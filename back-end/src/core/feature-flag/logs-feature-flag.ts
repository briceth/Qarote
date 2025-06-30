import { Context, Next } from "hono";
import { isDevelopment, config } from "@/config";

/**
 * Logs Feature Flag
 *
 * Controls access to the logs feature based on environment.
 * - Production: Logs are disabled (coming soon)
 * - Development: Logs are fully enabled
 */

/**
 * Check if logs feature is enabled based on the current environment
 * @returns true if logs are enabled, false otherwise
 */
export const isLogsEnabled = (): boolean => {
  // Enable logs only in development
  return isDevelopment();
};

/**
 * Get the environment name for debugging/logging
 * @returns current environment name
 */
export const getCurrentEnvironment = (): string => {
  return config.NODE_ENV;
};

/**
 * Middleware to check if logs feature is enabled
 * Returns 403 with appropriate message if disabled
 */
export const requireLogsEnabled = () => {
  return async (c: Context, next: Next) => {
    if (!isLogsEnabled()) {
      return c.json(
        {
          error: "Feature not available",
          message:
            "Logs feature is coming soon. Currently available in development mode only.",
          environment: getCurrentEnvironment(),
        },
        403
      );
    }
    await next();
  };
};
