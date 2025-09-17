import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { prisma } from "@/core/prisma";
import { logger } from "@/core/logger";
import { setSentryUser } from "@/core/sentry";
import { generateToken, SafeUser } from "@/core/auth";
import { ssoService } from "@/services/sso.service";
import { WorkspacePlan } from "@prisma/client";

const auth0Controller = new Hono();

// Schema for Auth0 SSO request
const Auth0SSOSchema = z.object({
  accessToken: z.string(),
  workspaceId: z.string().optional(), // Optional workspace ID for enterprise users
});

// Auth0 SSO login endpoint
auth0Controller.post(
  "/auth0/sso",
  zValidator("json", Auth0SSOSchema),
  async (c) => {
    const { accessToken, workspaceId } = c.req.valid("json");

    try {
      // Verify the Auth0 token and get user info
      const ssoUserInfo = await ssoService.verifyToken(accessToken);

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: ssoUserInfo.email },
        include: { workspace: true },
      });

      if (user) {
        // User exists, check if they have Auth0 SSO linked
        if (!user.auth0Id) {
          // Link Auth0 SSO to existing account
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              auth0Id: ssoUserInfo.providerId,
              ssoProvider: ssoUserInfo.provider,
              ssoMetadata: ssoUserInfo.metadata,
              emailVerified: true, // SSO emails are verified
              emailVerifiedAt: new Date(),
              lastLogin: new Date(),
            },
            include: { workspace: true },
          });
        } else {
          // Update last login and metadata
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLogin: new Date(),
              ssoMetadata: ssoUserInfo.metadata,
            },
            include: { workspace: true },
          });
        }
      } else {
        // Create new user with Auth0 SSO
        // For enterprise users, they should provide a workspaceId
        if (workspaceId) {
          // Check if the workspace exists and is enterprise
          const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
          });

          if (!workspace) {
            return c.json({ error: "Invalid workspace ID" }, 400);
          }

          if (workspace.plan !== WorkspacePlan.ENTERPRISE) {
            return c.json(
              {
                error: "SSO is only available for enterprise workspaces",
              },
              403
            );
          }

          // Create user in the enterprise workspace
          user = await prisma.user.create({
            data: {
              email: ssoUserInfo.email,
              firstName: ssoUserInfo.firstName,
              lastName: ssoUserInfo.lastName,
              auth0Id: ssoUserInfo.providerId,
              ssoProvider: ssoUserInfo.provider,
              ssoMetadata: ssoUserInfo.metadata,
              emailVerified: true,
              emailVerifiedAt: new Date(),
              isActive: true,
              role: "USER",
              lastLogin: new Date(),
              workspaceId: workspaceId,
            },
            include: { workspace: true },
          });
        } else {
          // Create user with default workspace (for non-enterprise SSO)
          user = await prisma.user.create({
            data: {
              email: ssoUserInfo.email,
              firstName: ssoUserInfo.firstName,
              lastName: ssoUserInfo.lastName,
              auth0Id: ssoUserInfo.providerId,
              ssoProvider: ssoUserInfo.provider,
              ssoMetadata: ssoUserInfo.metadata,
              emailVerified: true,
              emailVerifiedAt: new Date(),
              isActive: true,
              role: "USER",
              lastLogin: new Date(),
              // Create a default workspace for the user
              workspace: {
                create: {
                  name: `${ssoUserInfo.firstName || "User"}'s Workspace`,
                  contactEmail: ssoUserInfo.email,
                  plan: "FREE",
                },
              },
            },
            include: { workspace: true },
          });
        }
      }

      if (!user.isActive) {
        return c.json({ error: "Account is inactive" }, 403);
      }

      // Generate JWT token
      const token = await generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
      });

      const safeUser: SafeUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        workspaceId: user.workspaceId,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      // Set Sentry user context
      setSentryUser({
        id: user.id,
        workspaceId: user.workspaceId,
        email: user.email,
      });

      logger.info(
        {
          userId: user.id,
          email: user.email,
          workspaceId: user.workspaceId,
          ssoProvider: ssoUserInfo.provider,
        },
        "SSO login successful"
      );

      return c.json({
        user: safeUser,
        token,
        workspace: user.workspace,
        ssoProvider: ssoUserInfo.provider,
      });
    } catch (error) {
      logger.error({ error }, "Auth0 SSO login error");
      return c.json({ error: "Failed to authenticate with SSO" }, 500);
    }
  }
);

// Get SSO configuration endpoint (for frontend)
auth0Controller.get("/auth0/config", async (c) => {
  try {
    return c.json({
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENT_ID,
      // Don't expose client secret
    });
  } catch (error) {
    logger.error({ error }, "Failed to get Auth0 config");
    return c.json({ error: "Failed to get SSO configuration" }, 500);
  }
});

export default auth0Controller;
