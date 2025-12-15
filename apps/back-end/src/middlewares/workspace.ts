import { UserRole } from "@prisma/client";
import { Context } from "hono";

import { prisma } from "@/core/prisma";

/**
 * Check if a user has access to a workspace (either as a member or owner)
 */
export async function hasWorkspaceAccess(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  // Check if user is the workspace owner
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });

  if (workspace?.ownerId === userId) {
    return true;
  }

  // Check if user is a member via WorkspaceMember
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  return !!member;
}

// Workspace access check middleware
export const checkWorkspaceAccess = async (
  c: Context,
  next: () => Promise<void>
) => {
  const user = c.get("user");
  const workspaceId = c.req.param("workspaceId");

  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401
    );
  }

  if (!workspaceId) {
    return c.json(
      {
        error: "Bad Request",
        message: "Workspace ID is required",
      },
      400
    );
  }

  // Allow ADMIN users to access any workspace
  if (user.role === UserRole.ADMIN) {
    await next();
    return;
  }

  // Check if user belongs to the requested workspace
  const hasAccess = await hasWorkspaceAccess(user.id, workspaceId);
  if (!hasAccess) {
    return c.json(
      {
        error: "Forbidden",
        message: "Cannot access resources for this workspace",
      },
      403
    );
  }

  await next();
};
