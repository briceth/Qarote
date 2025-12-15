import { UserRole } from "@prisma/client";
import { Hono } from "hono";

import { logger } from "@/core/logger";
import { prisma } from "@/core/prisma";

import { authorize } from "@/middlewares/auth";
import { strictRateLimiter } from "@/middlewares/rateLimiter";
import { checkWorkspaceAccess } from "@/middlewares/workspace";

const dataRoutes = new Hono();

// Export all workspace data (ADMIN ONLY)
dataRoutes.get(
  "/:workspaceId/export",
  strictRateLimiter,
  authorize([UserRole.ADMIN]),
  checkWorkspaceAccess,
  async (c) => {
    try {
      const id = c.req.param("workspaceId");

      // Get workspace basic info
      const workspace = await prisma.workspace.findUnique({
        where: { id },
        select: { id: true, name: true, ownerId: true },
      });

      if (!workspace) {
        return c.json({ error: "Workspace not found" }, 404);
      }

      // Get all workspace data including owner's subscription
      const fullWorkspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  createdAt: true,
                  lastLogin: true,
                  subscription: {
                    select: {
                      plan: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
          servers: {
            include: {
              queues: {
                include: {
                  queueMetrics: true,
                },
              },
            },
          },
          alerts: true,
          alertRules: true,
        },
      });

      if (!fullWorkspace) {
        return c.json({ error: "Workspace not found" }, 404);
      }

      // Find workspace owner to get plan information
      const ownerMember = fullWorkspace.members.find(
        (member) => member.userId === fullWorkspace.ownerId
      );
      const ownerPlan = ownerMember?.user.subscription?.plan || "FREE";

      // Prepare export data - map members to users format for backward compatibility
      const users = fullWorkspace.members.map((member) => ({
        id: member.user.id,
        email: member.user.email,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        role: member.role, // Use role from WorkspaceMember
        createdAt: member.user.createdAt,
        lastLogin: member.user.lastLogin,
        subscription: member.user.subscription,
      }));

      const exportData = {
        workspace: {
          id: fullWorkspace.id,
          name: fullWorkspace.name,
          ownerId: fullWorkspace.ownerId,
          ownerPlan: ownerPlan,
          createdAt: fullWorkspace.createdAt,
        },
        users,
        servers: fullWorkspace.servers,
        alerts: fullWorkspace.alerts,
        alertRules: fullWorkspace.alertRules,
        exportedAt: new Date().toISOString(),
        exportedBy: c.get("user").id,
      };

      // Set headers for file download
      c.header("Content-Type", "application/json");
      c.header(
        "Content-Disposition",
        `attachment; filename="workspace-${fullWorkspace.name}-export-${
          new Date().toISOString().split("T")[0]
        }.json"`
      );

      return c.json(exportData);
    } catch (error) {
      logger.error(
        { error, workspaceId: c.req.param("workspaceId") },
        "Error exporting data for workspace"
      );
      return c.json({ error: "Failed to export workspace data" }, 500);
    }
  }
);

// Delete all workspace data (ADMIN ONLY)
dataRoutes.delete(
  "/:workspaceId/data",
  authorize([UserRole.ADMIN]),
  checkWorkspaceAccess,
  async (c) => {
    try {
      const id = c.req.param("workspaceId");

      // Use a transaction to delete all related data
      await prisma.$transaction(async (tx) => {
        // Delete queue metrics first (due to foreign key constraints)
        await tx.queueMetric.deleteMany({
          where: {
            queue: {
              server: {
                workspaceId: id,
              },
            },
          },
        });

        // Delete queues
        await tx.queue.deleteMany({
          where: {
            server: {
              workspaceId: id,
            },
          },
        });

        // Delete alerts
        await tx.alert.deleteMany({
          where: { workspaceId: id },
        });

        // Delete alert rules
        await tx.alertRule.deleteMany({
          where: { workspaceId: id },
        });

        // Delete servers
        await tx.rabbitMQServer.deleteMany({
          where: { workspaceId: id },
        });

        // Clean up temporary cache for all users in the workspace
        const workspaceMembers = await tx.workspaceMember.findMany({
          where: { workspaceId: id },
          select: { userId: true },
        });
        const workspaceUsers = workspaceMembers.map((m) => ({ id: m.userId }));

        // Delete cache entries for all workspace users
        for (const user of workspaceUsers) {
          await tx.$executeRaw`
            DELETE FROM temp_cache 
            WHERE key LIKE ${`%${user.id}%`}
          `;
        }

        // Delete workspace members (must be after cache cleanup since we need user IDs)
        await tx.workspaceMember.deleteMany({
          where: { workspaceId: id },
        });
      });

      return c.json({
        message: "All workspace data has been permanently deleted",
        deletedAt: new Date().toISOString(),
        deletedBy: c.get("user").id,
      });
    } catch (error) {
      logger.error(
        { error, workspaceId: c.req.param("workspaceId") },
        "Error deleting data for workspace"
      );
      return c.json({ error: "Failed to delete workspace data" }, 500);
    }
  }
);

export default dataRoutes;
