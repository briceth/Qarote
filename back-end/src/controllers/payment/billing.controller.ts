import { Hono } from "hono";
import { authenticate } from "@/core/auth";
import { prisma } from "@/core/prisma";
import { logger } from "@/core/logger";
import { StripeService } from "@/services/stripe/stripe.service";
import { strictRateLimiter, billingRateLimiter } from "@/middlewares/security";
import { getUserResourceCounts } from "@/services/plan/plan.service";
import {
  extractStringId,
  mapStripeStatusToSubscriptionStatus,
} from "./webhook-handlers";

const billingController = new Hono();

billingController.use("*", authenticate);

// Get comprehensive billing overview - use more lenient rate limiting
billingController.get("/billing/overview", billingRateLimiter, async (c) => {
  const user = c.get("user");

  try {
    // Get user with subscription
    const userWithSubscription = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        subscription: true,
      },
    });

    if (!userWithSubscription) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get user's current workspace for display purposes
    const currentWorkspace = user.workspaceId
      ? await prisma.workspace.findUnique({
          where: { id: user.workspaceId },
        })
      : null;

    if (!currentWorkspace) {
      return c.json({ error: "No workspace assigned" }, 400);
    }

    let stripeSubscription = null;
    let upcomingInvoice = null;
    let paymentMethod = null;

    // Fetch Stripe subscription details if exists
    if (userWithSubscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await StripeService.getSubscription(
          userWithSubscription.stripeSubscriptionId
        );

        // Get upcoming invoice
        if (stripeSubscription && !stripeSubscription.canceled_at) {
          upcomingInvoice = await StripeService.getUpcomingInvoice(
            userWithSubscription.stripeCustomerId || ""
          );
        }

        // Get payment method
        if (userWithSubscription.stripeCustomerId) {
          paymentMethod = await StripeService.getPaymentMethod(
            userWithSubscription.stripeCustomerId
          );
        }
      } catch (stripeError) {
        logger.warn("Failed to fetch Stripe data:", stripeError);
        // Continue without Stripe data
      }
    }

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        amount: true,
        status: true,
        description: true,
        createdAt: true,
      },
    });

    // Get current usage
    const resourceCounts = await getUserResourceCounts(user.id);

    const response = {
      workspace: {
        id: currentWorkspace.id,
        name: currentWorkspace.name,
      },
      subscription: userWithSubscription.subscription
        ? {
            id: userWithSubscription.subscription.id,
            status: userWithSubscription.subscription.status,
            stripeCustomerId: userWithSubscription.stripeCustomerId,
            stripeSubscriptionId: userWithSubscription.stripeSubscriptionId,
            plan: userWithSubscription.subscription.plan,
            canceledAt: userWithSubscription.subscription.canceledAt,
            isRenewalAfterCancel:
              userWithSubscription.subscription.isRenewalAfterCancel,
            previousCancelDate:
              userWithSubscription.subscription.previousCancelDate,
            createdAt: userWithSubscription.subscription.createdAt,
            updatedAt: userWithSubscription.subscription.updatedAt,
          }
        : null,
      stripeSubscription,
      upcomingInvoice,
      paymentMethod,
      currentUsage: {
        servers: resourceCounts.servers,
        users: resourceCounts.users,
        queues: 0, // TODO: Add queue counting when needed
        messagesThisMonth: 0, // TODO: Add message counting when needed
      },
      recentPayments: recentPayments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt.toISOString(),
      })),
    };

    return c.json(response);
  } catch (error) {
    logger.error("Error fetching billing overview:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// All other billing endpoints use strict rate limiting
billingController.use("*", strictRateLimiter);

// Create billing portal session
billingController.post("/billing/portal", async (c) => {
  const user = c.get("user");

  try {
    if (!user.stripeCustomerId) {
      return c.json({ error: "No Stripe customer ID found" }, 400);
    }

    const session = await StripeService.createPortalSession(
      user.stripeCustomerId,
      `${process.env.FRONTEND_URL}/billing`
    );

    return c.json({ url: session.url });
  } catch (error) {
    logger.error("Error creating billing portal session:", error);
    return c.json({ error: "Failed to create billing portal session" }, 500);
  }
});

// Cancel subscription
billingController.post("/billing/cancel", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  try {
    const { cancelImmediately = false, reason = "", feedback = "" } = body;

    if (!user.stripeSubscriptionId) {
      return c.json({ error: "No active subscription found" }, 400);
    }

    const subscription = await StripeService.cancelSubscription(
      user.stripeSubscriptionId,
      cancelImmediately
    );

    // Update subscription in database
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        status: mapStripeStatusToSubscriptionStatus(subscription.status),
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    // Log cancellation reason and feedback
    if (reason || feedback) {
      // TODO: Create subscriptionCancellation table if needed
      logger.info("Subscription cancellation feedback", {
        userId: user.id,
        reason,
        feedback,
      });
    }

    return c.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
      },
      message: cancelImmediately
        ? "Subscription canceled immediately"
        : "Subscription will be canceled at the end of the current period",
    });
  } catch (error) {
    logger.error("Error canceling subscription:", error);
    return c.json({ error: "Failed to cancel subscription" }, 500);
  }
});

// Renew subscription
billingController.post("/billing/renew", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  try {
    const { plan, interval = "monthly" } = body;

    if (!plan) {
      return c.json({ error: "Plan is required" }, 400);
    }

    const checkoutSession = await StripeService.createCheckoutSession({
      userId: user.id,
      plan,
      billingInterval: interval,
      successUrl: `${process.env.FRONTEND_URL}/payment/success`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
      customerEmail: user.email,
    });

    return c.json({ url: checkoutSession.url });
  } catch (error) {
    logger.error("Error renewing subscription:", error);
    return c.json({ error: "Failed to renew subscription" }, 500);
  }
});

// Get payment history
billingController.get("/payments", async (c) => {
  const user = c.get("user");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");

  try {
    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        amount: true,
        status: true,
        description: true,
        createdAt: true,
        stripePaymentId: true,
      },
    });

    const total = await prisma.payment.count({
      where: { userId: user.id },
    });

    return c.json({
      payments: payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt.toISOString(),
        stripePaymentId: payment.stripePaymentId,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    logger.error("Error fetching payment history:", error);
    return c.json({ error: "Failed to fetch payment history" }, 500);
  }
});

export default billingController;
