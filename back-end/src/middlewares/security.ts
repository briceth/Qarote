import { Context, Next } from "hono";
import { UserRole } from "@prisma/client";
import { rateLimiter } from "hono-rate-limiter";
import { v4 as uuidv4 } from "uuid";

// Performance monitoring thresholds
const SLOW_REQUEST_THRESHOLD = 1000; // 1 second

/**
 * Request ID middleware - adds unique ID to each request for tracing
 */
export const requestIdMiddleware = async (c: Context, next: Next) => {
  const requestId = uuidv4();
  c.set("requestId", requestId);
  c.header("X-Request-ID", requestId);

  console.log(`[REQUEST] ${requestId} ${c.req.method} ${c.req.path}`);

  await next();
};

/**
 * Performance monitoring middleware - logs slow requests
 */
export const performanceMonitoring = async (c: Context, next: Next) => {
  const startTime = Date.now();
  const requestId = c.get("requestId") || "unknown";

  await next();

  const duration = Date.now() - startTime;

  if (duration > SLOW_REQUEST_THRESHOLD) {
    console.warn(
      `[SLOW_REQUEST] ${requestId} ${c.req.method} ${c.req.path} took ${duration}ms`
    );
  }

  c.header("X-Response-Time", `${duration}ms`);
};

/**
 * Rate limiting using hono-rate-limiter
 */
export const createRateLimiter = (
  windowMs: number = 60000, // 1 minute
  max: number = 100, // 100 requests per window
  keyGenerator?: (c: Context) => string
) => {
  return rateLimiter({
    windowMs,
    limit: max,
    standardHeaders: "draft-6",
    keyGenerator:
      keyGenerator ||
      ((c) => {
        const user = c.get("user");
        return user?.id || c.req.header("x-forwarded-for") || "anonymous";
      }),
    handler: (c) => {
      return c.json(
        {
          error: "Rate limit exceeded",
          message: `Too many requests. Try again later.`,
        },
        429
      );
    },
  });
};

/**
 * Strict rate limiting for sensitive operations (payments, cancellations)
 */
export const strictRateLimiter = createRateLimiter(
  60000, // 1 minute window
  5, // 5 requests max
  (c) => {
    const user = c.get("user");
    return `${user.id}:${c.req.method}:sensitive`;
  }
);

/**
 * Moderate rate limiting for billing overview and less sensitive operations
 */
export const billingRateLimiter = createRateLimiter(
  60000, // 1 minute window
  30, // 30 requests max - more convenient for billing overview
  (c) => {
    const user = c.get("user");
    return `${user.id}:billing`;
  }
);

/**
 * Standard rate limiting for API endpoints
 */
export const standardRateLimiter = createRateLimiter(
  60000, // 1 minute window
  100 // 100 requests max
);
