import { Hono } from "hono";
import { prisma } from "@/core/prisma";
import { logger } from "@/core/logger";
import { createErrorResponse } from "../shared";
import { createRabbitMQClient } from "./shared";

const metricsController = new Hono();

// Time range configurations for RabbitMQ API
const timeRangeConfigs = {
  "1m": { age: 60, increment: 10 }, // Last minute, 10-second intervals
  "10m": { age: 600, increment: 30 }, // Last 10 minutes, 30-second intervals
  "1h": { age: 3600, increment: 300 }, // Last hour, 5-minute intervals
} as const;

type TimeRange = keyof typeof timeRangeConfigs;

/**
 * Get metrics for a specific server (ALL USERS)
 * GET /workspaces/:workspaceId/servers/:id/metrics
 * Used in the Index page to show the metrics data for a specific server
 */
metricsController.get("/servers/:id/metrics", async (c) => {
  const id = c.req.param("id");
  const workspaceId = c.req.param("workspaceId");
  const user = c.get("user");

  // Verify user has access to this workspace
  if (user.workspaceId !== workspaceId) {
    return c.json({ error: "Access denied to this workspace" }, 403);
  }

  try {
    // Create RabbitMQ client to fetch enhanced metrics
    const client = await createRabbitMQClient(id, workspaceId);

    // Get enhanced metrics (system-level metrics including CPU, memory, disk usage)
    const enhancedMetrics = await client.getMetrics();

    return c.json({
      metrics: enhancedMetrics,
    });
  } catch (error) {
    logger.error({ error, id }, "Error fetching metrics for server");

    // Check if this is a 401 Unauthorized error from RabbitMQ API
    if (error instanceof Error && error.message.includes("401")) {
      // Return successful response with permission status instead of error
      return c.json({
        metrics: null,
        permissionStatus: {
          hasPermission: false,
          requiredPermission: "monitor",
          message:
            "User does not have 'monitor' permissions to view metrics data. Please contact your RabbitMQ administrator to grant the necessary permissions.",
        },
      });
    }

    return createErrorResponse(c, error, 500, "Failed to fetch metrics");
  }
});

/**
 * Get live message rates data for a specific server (ALL USERS)
 * Returns real-time message operation rates from RabbitMQ overview API
 * GET /workspaces/:workspaceId/servers/:id/metrics/rates?timeRange=1m|10m|1h
 * Used in the Index page to show the live rates data for a specific server
 */
metricsController.get("/servers/:id/metrics/rates", async (c) => {
  const id = c.req.param("id");
  const workspaceId = c.req.param("workspaceId");
  const user = c.get("user");
  const timeRange = (c.req.query("timeRange") as TimeRange) || "1m";

  // Verify user has access to this workspace
  if (user.workspaceId !== workspaceId) {
    return c.json({ error: "Access denied to this workspace" }, 403);
  }

  try {
    // Verify the server belongs to the user's workspace
    const server = await prisma.rabbitMQServer.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        workspace: {
          select: {
            plan: true,
          },
        },
      },
    });

    if (!server || !server.workspace) {
      return c.json({ error: "Server not found or access denied" }, 404);
    }

    const plan = server.workspace.plan;
    const currentTimestamp = new Date();

    // Fetch live data from RabbitMQ with time range
    const client = await createRabbitMQClient(id, workspaceId);
    const timeConfig = timeRangeConfigs[timeRange];
    const overview = await client.getOverviewWithTimeRange(timeConfig);

    logger.info(
      `Fetched live rates data from RabbitMQ for server ${id} with time range ${timeRange}`
    );

    // Extract message operation rates from overview.message_stats
    const messageStats = overview.message_stats || {};

    // Create live rates data structure based on what's available in message_stats
    const liveRates = {
      timestamp: currentTimestamp.getTime(),
      rates: {
        // Core message operations
        publish: messageStats.publish_details?.rate || 0,
        deliver: messageStats.deliver_details?.rate || 0,
        ack: messageStats.ack_details?.rate || 0,

        // Additional operations (if available)
        deliver_get: messageStats.deliver_get_details?.rate || 0,
        confirm: messageStats.confirm_details?.rate || 0,
        get: messageStats.get_details?.rate || 0,
        get_no_ack: messageStats.get_no_ack_details?.rate || 0,
        redeliver: messageStats.redeliver_details?.rate || 0,
        reject: messageStats.reject_details?.rate || 0,
        return_unroutable: messageStats.return_unroutable_details?.rate || 0,

        // Disk operations
        disk_reads: messageStats.disk_reads_details?.rate || 0,
        disk_writes: messageStats.disk_writes_details?.rate || 0,
      },
    };

    // Generate time series data for chart based on time range
    const timePoints = Math.floor(timeConfig.age / timeConfig.increment);
    const intervalMs = timeConfig.increment * 1000; // Convert to milliseconds
    const aggregatedThroughput = [];

    for (let i = timePoints - 1; i >= 0; i--) {
      const timestamp = currentTimestamp.getTime() - i * intervalMs;
      // For live data, we use current rates for all time points
      // In a real scenario, this would be historical data from RabbitMQ
      aggregatedThroughput.push({
        timestamp,
        publishRate: liveRates.rates.publish,
        consumeRate: liveRates.rates.deliver + liveRates.rates.get,
      });
    }

    const response = {
      serverId: id,
      timeRange,
      dataSource: "live_rates_with_time_range",
      timestamp: currentTimestamp.toISOString(),
      liveRates,
      aggregatedThroughput,
      metadata: {
        plan,
        updateInterval: "real-time",
        dataPoints: timePoints,
        timeConfig,
      },
    };

    return c.json(response);
  } catch (error) {
    logger.error(
      { error, id, timeRange },
      "Error fetching live rates data for server"
    );

    // Check if this is a 401 Unauthorized error from RabbitMQ API
    if (error instanceof Error && error.message.includes("401")) {
      // Return successful response with permission status instead of error
      return c.json({
        serverId: id,
        timeRange,
        dataSource: "permission_denied",
        timestamp: new Date().toISOString(),
        liveRates: { timestamp: Date.now(), rates: {} },
        aggregatedThroughput: [],
        permissionStatus: {
          hasPermission: false,
          requiredPermission: "monitor",
          message:
            "User does not have 'monitor' permissions to view metrics data. Please contact your RabbitMQ administrator to grant the necessary permissions.",
        },
        metadata: {
          plan: null,
          updateInterval: "real-time",
          dataPoints: 0,
        },
      });
    }

    return createErrorResponse(
      c,
      error,
      500,
      "Failed to fetch live rates data"
    );
  }
});

/**
 * Get live message rates data for a specific queue (ALL USERS)
 * Returns real-time message operation rates from RabbitMQ queue API
 * GET /workspaces/:workspaceId/servers/:id/queues/:queueName/metrics/rates?timeRange=1m|10m|1h
 * Used in the QueueDetail page to show the live rates data for a specific queue
 */
metricsController.get(
  "/servers/:id/queues/:queueName/metrics/rates",
  async (c) => {
    const id = c.req.param("id");
    const queueName = c.req.param("queueName");
    const workspaceId = c.req.param("workspaceId");
    const user = c.get("user");
    const timeRange = (c.req.query("timeRange") as TimeRange) || "1m";

    // Verify user has access to this workspace
    if (user.workspaceId !== workspaceId) {
      return c.json({ error: "Access denied to this workspace" }, 403);
    }

    try {
      // Verify the server belongs to the user's workspace
      const server = await prisma.rabbitMQServer.findFirst({
        where: {
          id,
          workspaceId,
        },
        include: {
          workspace: {
            select: {
              plan: true,
            },
          },
        },
      });

      if (!server || !server.workspace) {
        return c.json({ error: "Server not found or access denied" }, 404);
      }

      const plan = server.workspace.plan;
      const currentTimestamp = new Date();

      // Fetch queue-specific data from RabbitMQ with time range
      const client = await createRabbitMQClient(id, workspaceId);
      const timeConfig = timeRangeConfigs[timeRange];

      // Decode queue name in case it contains special characters
      const decodedQueueName = decodeURIComponent(queueName);
      const queue = await client.getQueueWithTimeRange(
        decodedQueueName,
        timeConfig
      );

      logger.info(
        `Fetched live rates data for queue ${decodedQueueName} from server ${id} with time range ${timeRange}`
      );

      // Extract message operation rates from queue.message_stats
      const messageStats = queue.message_stats || {};

      // Create live rates data structure based on what's available in queue message_stats
      // All these fields are now properly typed in the QueueMessageStats interface
      const liveRates = {
        timestamp: currentTimestamp.getTime(),
        queueName: decodedQueueName,
        rates: {
          // Core message operations (available in QueueMessageStats)
          publish: messageStats.publish_details?.rate || 0,
          deliver: messageStats.deliver_details?.rate || 0,
          ack: messageStats.ack_details?.rate || 0,

          // Additional operations (available at queue level according to RabbitMQ API docs)
          deliver_get: messageStats.deliver_get_details?.rate || 0,
          confirm: messageStats.confirm_details?.rate || 0,
          get: messageStats.get_details?.rate || 0,
          get_no_ack: messageStats.get_no_ack_details?.rate || 0,
          redeliver: messageStats.redeliver_details?.rate || 0,
          reject: messageStats.reject_details?.rate || 0,
          return_unroutable: messageStats.return_unroutable_details?.rate || 0,

          // Disk operations are not available at queue level (only at server overview level)
          disk_reads: 0,
          disk_writes: 0,
        },
      };

      const response = {
        serverId: id,
        queueName: decodedQueueName,
        timeRange,
        dataSource: "queue_live_rates_with_time_range",
        timestamp: currentTimestamp.toISOString(),
        liveRates,
        metadata: {
          plan,
          updateInterval: "real-time",
          timeConfig,
        },
      };

      return c.json(response);
    } catch (error) {
      logger.error(
        { error, id, queueName, timeRange },
        "Error fetching live rates data for queue"
      );

      // Check if this is a 401 Unauthorized error from RabbitMQ API
      if (error instanceof Error && error.message.includes("401")) {
        // Return successful response with permission status instead of error
        return c.json({
          serverId: id,
          queueName: decodeURIComponent(queueName),
          timeRange,
          dataSource: "permission_denied",
          timestamp: new Date().toISOString(),
          liveRates: {
            timestamp: Date.now(),
            queueName: decodeURIComponent(queueName),
            rates: {},
          },
          permissionStatus: {
            hasPermission: false,
            requiredPermission: "monitor",
            message:
              "User does not have 'monitor' permissions to view metrics data. Please contact your RabbitMQ administrator to grant the necessary permissions.",
          },
          metadata: {
            plan: null,
            updateInterval: "real-time",
          },
        });
      }

      return createErrorResponse(
        c,
        error,
        500,
        "Failed to fetch live rates data for queue"
      );
    }
  }
);

export default metricsController;
