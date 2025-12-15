import { UserPlan } from "@prisma/client";
import { Hono } from "hono";

import { logger } from "@/core/logger";
import { prisma } from "@/core/prisma";

import { getPlanFeatures, PLAN_FEATURES } from "@/services/plan/plan.service";

const planRoutes = new Hono();

// Get all available plans with their features
planRoutes.get("/plans", async (c) => {
  try {
    const allPlans = Object.entries(PLAN_FEATURES).map(
      ([planKey, features]) => ({
        plan: planKey as UserPlan,
        ...features,
      })
    );

    return c.json({ plans: allPlans });
  } catch (error) {
    logger.error({ error }, "Error fetching plan information");
    return c.json({ error: "Failed to fetch plan information" }, 500);
  }
});

// Get current user's plan features and usage
// Always uses workspace owner's subscription plan for workspace features
planRoutes.get("/current/plan", async (c) => {
  const user = c.get("user");

  try {
    // Get user with subscription and workspace information
    const userWithSubscription = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
        workspace: {
          include: {
            _count: {
              select: {
                members: true,
                servers: true,
              },
            },
          },
        },
      },
    });

    if (!userWithSubscription) {
      return c.json({ error: "User not found" }, 404);
    }

    // Always use workspace owner's subscription plan for workspace features
    let workspacePlan: UserPlan = UserPlan.FREE;
    const currentWorkspace = userWithSubscription.workspace;

    if (currentWorkspace?.ownerId) {
      const ownerSubscription = await prisma.subscription.findUnique({
        where: { userId: currentWorkspace.ownerId },
        select: {
          plan: true,
          status: true,
        },
      });

      if (ownerSubscription) {
        workspacePlan = ownerSubscription.plan;
      }
    }

    // Use workspace plan for all workspace features
    const planFeatures = getPlanFeatures(workspacePlan);

    // Count owned workspaces for workspace usage calculation
    const ownedWorkspaceCount = await prisma.workspace.count({
      where: { ownerId: user.id },
    });

    // Get current workspace counts
    const workspaceUsers = currentWorkspace?._count.members || 0;
    const workspaceServers = currentWorkspace?._count.servers || 0;

    // Calculate usage percentages and limits
    const usage = {
      users: {
        current: workspaceUsers,
        limit: planFeatures.maxUsers,
        percentage: planFeatures.maxUsers
          ? Math.round((workspaceUsers / planFeatures.maxUsers) * 100)
          : 0,
        canAdd: planFeatures.maxUsers
          ? workspaceUsers < planFeatures.maxUsers
          : true,
      },
      servers: {
        current: workspaceServers,
        limit: planFeatures.maxServers,
        percentage: planFeatures.maxServers
          ? Math.round((workspaceServers / planFeatures.maxServers) * 100)
          : 0,
        canAdd: planFeatures.maxServers
          ? workspaceServers < planFeatures.maxServers
          : true,
      },
      workspaces: {
        current: ownedWorkspaceCount,
        limit: planFeatures.maxWorkspaces,
        percentage: planFeatures.maxWorkspaces
          ? Math.round((ownedWorkspaceCount / planFeatures.maxWorkspaces) * 100)
          : 0,
        canAdd: planFeatures.maxWorkspaces
          ? ownedWorkspaceCount < planFeatures.maxWorkspaces
          : true,
      },
    };

    // Check if user is approaching limits (80% threshold)
    const warnings = {
      users: usage.users.percentage >= 80,
      servers: usage.servers.percentage >= 80,
      workspaces: usage.workspaces.percentage >= 80,
    };

    const response = {
      user: {
        id: userWithSubscription.id,
        email: userWithSubscription.email,
        plan: workspacePlan, // Always return workspace plan
        subscriptionStatus: userWithSubscription.subscription?.status || null,
      },
      workspace: currentWorkspace
        ? {
            id: currentWorkspace.id,
            name: currentWorkspace.name,
          }
        : null,
      planFeatures,
      usage,
      warnings,
      approachingLimits: Object.values(warnings).some(Boolean),
    };

    return c.json(response);
  } catch (error) {
    logger.error({ error, userId: user.id }, "Error fetching current plan");
    return c.json({ error: "Failed to fetch plan information" }, 500);
  }
});

export default planRoutes;
