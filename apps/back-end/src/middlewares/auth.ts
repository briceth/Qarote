import { UserRole } from "@prisma/client";
import { Context, Next } from "hono";

import { extractUserFromToken } from "@/core/auth";

export const authenticate = async (c: Context, next: () => Promise<void>) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401
    );
  }

  const token = authHeader.split(" ")[1];
  const user = await extractUserFromToken(token);

  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Invalid or expired token" },
      401
    );
  }

  if (!user.isActive) {
    return c.json({ error: "Forbidden", message: "Account is inactive" }, 403);
  }

  // Set user in the context variables for use in route handlers
  c.set("user", user);
  await next();
};

// Role-based authorization middleware
export const authorize = (allowedRoles: UserRole[]) => {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get("user");

    if (!user) {
      return c.json(
        { error: "Unauthorized", message: "Authentication required" },
        401
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        403
      );
    }

    await next();
  };
};

export const requireRole = (role: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user || user.role !== role) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    await next();
  };
};
