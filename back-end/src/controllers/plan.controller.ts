import { Hono } from "hono";
import { authenticate, authorize } from "@/core/auth";
import { UserRole } from "@prisma/client";
import { PLAN_FEATURES, getUnifiedPlanFeatures } from "@/services/plan.service";
import { WorkspacePlan } from "@prisma/client";
import { prisma } from "@/core/prisma";
import { logger } from "@/core/logger";

const planController = new Hono();

// Apply authentication middleware
planController.use("*", authenticate);

// Get all available plans with their features (ADMIN ONLY - sensitive pricing data)
planController.get("/", authorize([UserRole.ADMIN]), async (c) => {
  try {
    const allPlans = Object.entries(PLAN_FEATURES).map(
      ([planKey, features]) => ({
        plan: planKey as WorkspacePlan,
        ...features,
      })
    );

    return c.json({ plans: allPlans });
  } catch (error) {
    logger.error("Error fetching plan information:", error);
    return c.json({ error: "Failed to fetch plan information" }, 500);
  }
});

// Get current user's plan features and usage (USER - can only see their own workspace plan)
planController.get("/current", async (c) => {
  const user = c.get("user");

  try {
    // Get user's workspace with plan and current usage
    const workspace = await prisma.workspace.findUnique({
      where: { id: user.workspaceId },
      include: {
        _count: {
          select: {
            users: true,
            servers: true,
          },
        },
      },
    });

    if (!workspace) {
      return c.json({ error: "Workspace not found" }, 404);
    }

    // Security check: Ensure user can only access their own workspace
    if (workspace.id !== user.workspaceId) {
      return c.json(
        { error: "Access denied: Cannot access other workspace data" },
        403
      );
    }

    // Get queue count
    const queueCount = await prisma.queue.count({
      where: {
        server: {
          workspaceId: user.workspaceId,
        },
      },
    });

    // Get current month's message count
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const monthlyMessageCount = await prisma.monthlyMessageCount.findUnique({
      where: {
        monthly_message_count_unique: {
          workspaceId: user.workspaceId,
          year: currentYear,
          month: currentMonth,
        },
      },
    });

    // Get plan features
    const planFeatures = getUnifiedPlanFeatures(workspace.plan);

    // Calculate usage percentages and limits
    const usage = {
      users: {
        current: workspace._count.users,
        limit: planFeatures.maxUsers,
        percentage: planFeatures.maxUsers
          ? Math.round((workspace._count.users / planFeatures.maxUsers) * 100)
          : 0,
        canAdd: planFeatures.maxUsers
          ? workspace._count.users < planFeatures.maxUsers
          : true,
      },
      servers: {
        current: workspace._count.servers,
        limit: planFeatures.maxServers,
        percentage: planFeatures.maxServers
          ? Math.round(
              (workspace._count.servers / planFeatures.maxServers) * 100
            )
          : 0,
        canAdd: planFeatures.maxServers
          ? workspace._count.servers < planFeatures.maxServers
          : true,
      },
      queues: {
        current: queueCount,
        limit: planFeatures.maxQueues,
        percentage: planFeatures.maxQueues
          ? Math.round((queueCount / planFeatures.maxQueues) * 100)
          : 0,
        canAdd: planFeatures.maxQueues
          ? queueCount < planFeatures.maxQueues
          : true,
      },
      messages: {
        current: monthlyMessageCount?.count || 0,
        limit: planFeatures.maxMessagesPerMonth,
        percentage: planFeatures.maxMessagesPerMonth
          ? Math.round(
              ((monthlyMessageCount?.count || 0) /
                planFeatures.maxMessagesPerMonth) *
                100
            )
          : 0,
        canSend: planFeatures.maxMessagesPerMonth
          ? (monthlyMessageCount?.count || 0) < planFeatures.maxMessagesPerMonth
          : true,
      },
    };

    // Check if user is approaching limits (80% threshold)
    const warnings = {
      users: usage.users.percentage >= 80,
      servers: usage.servers.percentage >= 80,
      queues: usage.queues.percentage >= 80,
      messages: usage.messages.percentage >= 80,
    };

    const response = {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        plan: workspace.plan,
      },
      planFeatures,
      usage,
      warnings,
      approachingLimits: Object.values(warnings).some(Boolean),
    };

    return c.json(response);
  } catch (error) {
    logger.error("Error fetching current plan:", error);
    return c.json({ error: "Failed to fetch plan information" }, 500);
  }
});

// Get specific plan features (ADMIN ONLY - sensitive plan details)
planController.get("/:plan", authorize([UserRole.ADMIN]), async (c) => {
  const planParam = c.req.param("plan").toUpperCase() as WorkspacePlan;

  // Validate plan parameter
  if (!Object.values(WorkspacePlan).includes(planParam)) {
    return c.json({ error: "Invalid plan specified" }, 400);
  }

  try {
    const planFeatures = getUnifiedPlanFeatures(planParam);

    return c.json({
      plan: planParam,
      ...planFeatures,
    });
  } catch (error) {
    logger.error(`Error fetching plan ${planParam}:`, error);
    return c.json({ error: "Failed to fetch plan information" }, 500);
  }
});

export { planController };
