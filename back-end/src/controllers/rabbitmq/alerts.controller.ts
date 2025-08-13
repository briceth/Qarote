import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { logger } from "@/core/logger";
import { verifyServerAccess } from "./shared";
import { createErrorResponse } from "../shared";
import { alertService } from "@/services/alert.service";
import {
  ServerParamSchema,
  AlertsQuerySchema,
  UpdateThresholdsRequestSchema,
} from "@/schemas/alerts";

const alertsController = new Hono();

/**
 * Get current alerts for a server
 * GET /servers/:id/alerts
 */
alertsController.get(
  "/servers/:id/alerts",
  zValidator("param", ServerParamSchema),
  zValidator("query", AlertsQuerySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user");

    try {
      const server = await verifyServerAccess(id, user.workspaceId);

      const { alerts, summary } = await alertService.getServerAlerts(
        id,
        server.name,
        user.workspaceId
      );

      // Get current thresholds for response
      const thresholds = await alertService.getWorkspaceThresholds(
        user.workspaceId
      );

      return c.json({
        success: true,
        alerts,
        summary,
        thresholds,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error("Error getting alerts:", error);
      return createErrorResponse(c, error, 500, "Failed to get alerts");
    }
  }
);

/**
 * Get cluster-wide alerts summary
 * GET /servers/:id/alerts/summary
 */
alertsController.get(
  "/servers/:id/alerts/summary",
  zValidator("param", ServerParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user");

    try {
      await verifyServerAccess(id, user.workspaceId);
      const clusterHealth = await alertService.getClusterHealthSummary(
        id,
        user.workspaceId
      );

      return c.json({
        success: true,
        ...clusterHealth,
      });
    } catch (error: any) {
      logger.error("Error getting alerts summary:", error);
      return createErrorResponse(c, error, 500, "Failed to get alerts summary");
    }
  }
);

/**
 * Get health check for a server
 * GET /servers/:id/health
 */
alertsController.get(
  "/servers/:id/health",
  zValidator("param", ServerParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user");

    try {
      await verifyServerAccess(id, user.workspaceId);
      const healthCheck = await alertService.getHealthCheck(
        id,
        user.workspaceId
      );

      return c.json({
        success: true,
        health: healthCheck,
      });
    } catch (error: any) {
      logger.error("Error getting health check:", error);
      return createErrorResponse(c, error, 500, "Failed to get health check");
    }
  }
);

/**
 * Get alert thresholds for the workspace
 * GET /thresholds
 */
alertsController.get("/thresholds", async (c) => {
  const user = c.get("user");

  try {
    const thresholds = await alertService.getWorkspaceThresholds(
      user.workspaceId
    );
    const canModify = await alertService.canModifyThresholds(user.workspaceId);

    return c.json({
      success: true,
      thresholds,
      canModify,
      defaults: alertService.getDefaultThresholds(),
    });
  } catch (error: any) {
    logger.error("Error getting thresholds:", error);
    return createErrorResponse(c, error, 500, "Failed to get thresholds");
  }
});

/**
 * Update alert thresholds for the workspace
 * PUT /thresholds
 */
alertsController.put(
  "/thresholds",
  zValidator("json", UpdateThresholdsRequestSchema),
  async (c) => {
    const user = c.get("user");
    const { thresholds } = c.req.valid("json");

    try {
      const result = await alertService.updateWorkspaceThresholds(
        user.workspaceId,
        thresholds as any // Cast to match service expectation for partial updates
      );

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: result.message,
          },
          403
        );
      }

      const updatedThresholds = await alertService.getWorkspaceThresholds(
        user.workspaceId
      );

      return c.json({
        success: true,
        message: result.message,
        thresholds: updatedThresholds,
      });
    } catch (error: any) {
      logger.error("Error updating thresholds:", error);
      return createErrorResponse(c, error, 500, "Failed to update thresholds");
    }
  }
);

export default alertsController;
