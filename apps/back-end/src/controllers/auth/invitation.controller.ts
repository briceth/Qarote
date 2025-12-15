import { zValidator } from "@hono/zod-validator";
import { InvitationStatus, UserRole } from "@prisma/client";
import { Hono } from "hono";

import { generateToken, hashPassword, SafeUser } from "@/core/auth";
import { logger } from "@/core/logger";
import { prisma } from "@/core/prisma";
import { ensureWorkspaceMember } from "@/core/workspace-access";

import { AcceptInvitationSchema } from "@/schemas/auth";

const invitationController = new Hono();

// Accept invitation
invitationController.post(
  "/accept",
  zValidator("json", AcceptInvitationSchema),
  async (c) => {
    const { token, password, firstName, lastName } = c.req.valid("json");

    try {
      // Find invitation by token
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: { workspace: true },
      });

      if (!invitation) {
        return c.json({ error: "Invalid invitation token" }, 400);
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        return c.json(
          { error: "Invitation has already been used or expired" },
          400
        );
      }

      const now = new Date();
      if (invitation.expiresAt < now) {
        // Update invitation status to expired
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.EXPIRED },
        });
        return c.json({ error: "Invitation has expired" }, 400);
      }

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: invitation.email },
      });

      // Transaction to handle user creation/update and invitation acceptance
      const result = await prisma.$transaction(async (tx) => {
        if (user) {
          // Update existing user's workspace (but NOT their global role)
          // The workspace-specific role is stored in WorkspaceMember.role
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              workspaceId: invitation.workspaceId,
              // Do NOT update User.role - it's for global admin access only
              // Workspace-specific role is stored in WorkspaceMember.role
            },
          });
        } else {
          // Create new user
          if (!password || !firstName || !lastName) {
            throw new Error(
              "Password, first name, and last name are required for new users"
            );
          }

          const hashedPassword = await hashPassword(password);
          user = await tx.user.create({
            data: {
              email: invitation.email,
              passwordHash: hashedPassword,
              firstName,
              lastName,
              workspaceId: invitation.workspaceId,
              role: UserRole.USER, // Default global role - workspace-specific role is in WorkspaceMember
              isActive: true,
              emailVerified: true, // Auto-verify since they came from invitation
              emailVerifiedAt: new Date(),
              lastLogin: new Date(),
            },
          });
        }

        // Add user to WorkspaceMember table
        await ensureWorkspaceMember(
          user.id,
          invitation.workspaceId,
          invitation.role,
          tx
        );

        // Update invitation status
        await tx.invitation.update({
          where: { id: invitation.id },
          data: {
            status: InvitationStatus.ACCEPTED,
            invitedUserId: user.id,
          },
        });

        return user;
      });

      // Generate JWT token
      const authToken = await generateToken({
        id: result.id,
        email: result.email,
        role: result.role,
        workspaceId: result.workspaceId,
      });

      const safeUser: SafeUser = {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
        workspaceId: result.workspaceId,
        isActive: result.isActive,
        emailVerified: result.emailVerified,
        lastLogin: result.lastLogin,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      return c.json({
        user: safeUser,
        token: authToken,
        workspace: invitation.workspace,
      });
    } catch (error) {
      logger.error({ error }, "Accept invitation error");
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "Failed to accept invitation" }, 500);
    }
  }
);

export default invitationController;
