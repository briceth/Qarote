import { zValidator } from "@hono/zod-validator";
import { UserRole } from "@prisma/client";
import { Hono } from "hono";

import { logger } from "@/core/logger";
import { prisma } from "@/core/prisma";

import { authorize } from "@/middlewares/auth";
import { checkWorkspaceAccess } from "@/middlewares/workspace";

import {
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
} from "@/schemas/workspace";

const coreRoutes = new Hono();

// Get all workspaces (ADMIN ONLY)
coreRoutes.get("/", authorize([UserRole.ADMIN]), async (c) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      include: {
        _count: {
          select: {
            members: true,
            servers: true,
          },
        },
      },
    });

    return c.json({ workspaces });
  } catch (error) {
    logger.error({ error }, "Error fetching workspaces:");
    return c.json({ error: "Failed to fetch workspaces" }, 500);
  }
});

// Get user's current workspace (ALL USERS)
coreRoutes.get("/current", async (c) => {
  const user = c.get("user");

  try {
    // If user doesn't have a workspaceId, they don't have a current workspace
    if (!user.workspaceId) {
      return c.json({ error: "No workspace assigned" }, 404);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: user.workspaceId },
      include: {
        _count: {
          select: {
            members: true,
            servers: true,
          },
        },
      },
    });

    if (!workspace) {
      return c.json({ error: "Workspace not found" }, 404);
    }

    return c.json({ workspace });
  } catch (error) {
    logger.error({ error }, "Error fetching current workspace:");
    return c.json({ error: "Failed to fetch workspace" }, 500);
  }
});

// Get specific workspace by ID
coreRoutes.get("/:workspaceId", checkWorkspaceAccess, async (c) => {
  const id = c.req.param("workspaceId");

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            servers: true,
          },
        },
      },
    });

    if (!workspace) {
      return c.json({ error: "Workspace not found" }, 404);
    }

    return c.json({ workspace });
  } catch (error) {
    logger.error({ error }, `Error fetching workspace ${id}:`);
    return c.json({ error: "Failed to fetch workspace" }, 500);
  }
});

// Create new workspace (ADMIN ONLY)
coreRoutes.post(
  "/",
  authorize([UserRole.ADMIN]),
  zValidator("json", CreateWorkspaceSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const workspace = await prisma.workspace.create({
        data,
      });

      return c.json({ workspace }, 201);
    } catch (error) {
      logger.error({ error }, "Error creating workspace:");
      return c.json({ error: "Failed to create workspace" }, 500);
    }
  }
);

// Update workspace (ADMIN ONLY)
coreRoutes.put(
  "/:workspaceId",
  authorize([UserRole.ADMIN]),
  checkWorkspaceAccess,
  zValidator("json", UpdateWorkspaceSchema),
  async (c) => {
    try {
      const id = c.req.param("workspaceId");
      const data = c.req.valid("json");

      const workspace = await prisma.workspace.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
      });

      return c.json({ workspace });
    } catch (error) {
      logger.error(
        { error },
        `Error updating workspace ${c.req.param("workspaceId")}:`
      );
      return c.json({ error: "Failed to update workspace" }, 500);
    }
  }
);

// Delete workspace (ADMIN ONLY)
coreRoutes.delete(
  "/:workspaceId",
  authorize([UserRole.ADMIN]),
  checkWorkspaceAccess,
  async (c) => {
    try {
      const id = c.req.param("workspaceId");

      await prisma.workspace.delete({
        where: { id },
      });

      return c.json({ message: "Workspace deleted successfully" });
    } catch (error) {
      logger.error(
        { error },
        `Error deleting workspace ${c.req.param("workspaceId")}:`
      );
      return c.json({ error: "Failed to delete workspace" }, 500);
    }
  }
);

export default coreRoutes;
