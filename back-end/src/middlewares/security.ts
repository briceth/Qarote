import { Context, Next } from "hono";
import { UserRole } from "@prisma/client";
import { SafeUser } from "@/core/auth";

/**
 * Middleware to ensure users can only access data from their own workspace
 * unless they are admin users
 */
export const enforceWorkspaceIsolation = async (c: Context, next: Next) => {
  const user = c.get("user") as SafeUser;
  const requestedWorkspaceId =
    c.req.param("workspaceId") || c.req.query("workspaceId");

  // Admin users can access any workspace
  if (user.role === UserRole.ADMIN) {
    await next();
    return;
  }

  // Regular users can only access their own workspace
  if (requestedWorkspaceId && requestedWorkspaceId !== user.workspaceId) {
    return c.json(
      {
        error: "Access denied",
        message: "Cannot access data from different workspace",
      },
      403
    );
  }

  await next();
};

/**
 * Middleware to ensure only admin users can perform write operations
 */
export const requireAdminForWrites = async (c: Context, next: Next) => {
  const user = c.get("user") as SafeUser;
  const method = c.req.method;

  // Allow read operations for all authenticated users
  if (method === "GET") {
    await next();
    return;
  }

  // Require admin for write operations (POST, PUT, DELETE, PATCH)
  if (user.role !== UserRole.ADMIN) {
    return c.json(
      {
        error: "Admin access required",
        message: "Only admin users can perform write operations",
      },
      403
    );
  }

  await next();
};

/**
 * Middleware to log sensitive operations for audit trail
 */
export const auditSensitiveOperations = async (c: Context, next: Next) => {
  const user = c.get("user") as SafeUser;
  const method = c.req.method;
  const path = c.req.path;

  // Log write operations by admin users
  if (method !== "GET" && user.role === UserRole.ADMIN) {
    console.log(
      `[AUDIT] Admin operation: ${method} ${path} by user ${user.id} (${user.email})`
    );
  }

  await next();
};

/**
 * Middleware to prevent privilege escalation in user updates
 */
export const preventPrivilegeEscalation = async (c: Context, next: Next) => {
  const user = c.get("user") as SafeUser;
  const method = c.req.method;
  const path = c.req.path;

  // Only check for PUT/PATCH operations on user profiles
  if ((method === "PUT" || method === "PATCH") && path.includes("/profile")) {
    const body = await c.req.json();

    // Check for dangerous fields that users shouldn't be able to modify
    const dangerousFields = ["role", "workspaceId", "isActive", "permissions"];
    const hasDangerousFields = dangerousFields.some((field) => field in body);

    if (hasDangerousFields && user.role !== UserRole.ADMIN) {
      return c.json(
        {
          error: "Forbidden",
          message: "Cannot modify restricted user fields",
        },
        403
      );
    }
  }

  await next();
};

/**
 * Rate limiting for sensitive operations (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimitSensitiveOps = (
  maxRequests: number = 10,
  windowMs: number = 60000
) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as SafeUser;
    const method = c.req.method;
    const key = `${user.id}:${method}`;

    // Only rate limit write operations
    if (method === "GET") {
      await next();
      return;
    }

    const now = Date.now();
    const userLimit = rateLimitMap.get(key);

    if (!userLimit || now > userLimit.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      await next();
      return;
    }

    if (userLimit.count >= maxRequests) {
      return c.json(
        {
          error: "Rate limit exceeded",
          message: `Too many requests. Try again in ${Math.ceil((userLimit.resetTime - now) / 1000)} seconds`,
        },
        429
      );
    }

    userLimit.count++;
    await next();
  };
};

/**
 * Comprehensive security middleware that combines all security checks
 */
export const comprehensiveSecurityMiddleware = async (
  c: Context,
  next: Next
) => {
  // Apply all security checks in sequence
  await enforceWorkspaceIsolation(c, async () => {
    await preventPrivilegeEscalation(c, async () => {
      await auditSensitiveOperations(c, next);
    });
  });
};
