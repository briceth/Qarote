import { Hono } from "hono";
import { prisma } from "@/core/prisma";
import { logger } from "@/core/logger";
import {
  canUserAccessMessageHistory,
  getMetricsRetentionDays,
  getMaxTimeRangeForPlan,
} from "@/services/plan/plan.service";
import { createErrorResponse } from "../shared";
import { createRabbitMQClient } from "./shared";

const metricsController = new Hono();

/**
 * Get metrics for a specific server (ALL USERS)
 * GET /servers/:id/metrics
 */
metricsController.get("/servers/:id/metrics", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  try {
    // Create RabbitMQ client to fetch enhanced metrics
    const client = await createRabbitMQClient(id, user.workspaceId);

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
 * Get historical and live timeseries metrics for a specific server (ALL USERS)
 * Returns historical data based on plan retention limits + live data
 * GET /servers/:id/metrics/timeseries?timeRange=1h
 */
metricsController.get("/servers/:id/metrics/timeseries", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const timeRange = c.req.query("timeRange") || "1h"; // Default to 1 hour

  try {
    // Verify the server belongs to the user's workspace and get workspace details
    const server = await prisma.rabbitMQServer.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
      include: {
        workspace: {
          select: {
            plan: true,
            storageMode: true,
            retentionDays: true,
            consentGiven: true,
          },
        },
      },
    });

    if (!server || !server.workspace) {
      return c.json({ error: "Server not found or access denied" }, 404);
    }

    const plan = server.workspace.plan;
    const maxRetentionDays = getMetricsRetentionDays(plan);
    const allowedTimeRanges = getMaxTimeRangeForPlan(plan);

    // Validate time range against plan limits
    if (!allowedTimeRanges.includes(timeRange)) {
      return c.json(
        {
          error: "Time range not allowed for your plan",
          allowedTimeRanges,
          currentPlan: plan,
        },
        403
      );
    }

    // Parse time range into hours/days
    let hoursBack = 1;
    if (timeRange.endsWith("m")) {
      hoursBack = parseInt(timeRange) / 60;
    } else if (timeRange.endsWith("h")) {
      hoursBack = parseInt(timeRange);
    } else if (timeRange.endsWith("d")) {
      hoursBack = parseInt(timeRange) * 24;
    } else if (timeRange.endsWith("y")) {
      hoursBack = parseInt(timeRange) * 365 * 24;
    }

    // Limit to plan's retention period
    const maxHours = maxRetentionDays * 24;
    if (hoursBack > maxHours) {
      hoursBack = maxHours;
    }

    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const currentTimestamp = new Date();

    // Always fetch current live data from RabbitMQ
    const client = await createRabbitMQClient(id, user.workspaceId);
    const liveQueues = await client.getQueues();

    logger.info(
      `Fetched ${liveQueues.length} live queues from RabbitMQ for server ${id}, timeRange: ${timeRange}`
    );

    // Calculate current live totals
    let currentPublishRate = 0;
    let currentConsumeRate = 0;

    for (const queue of liveQueues) {
      const publishRate = queue.message_stats?.publish_details?.rate || 0;
      const consumeRate = queue.message_stats?.deliver_details?.rate || 0;

      currentPublishRate += publishRate;
      currentConsumeRate += consumeRate;

      // Store current data for all plans (respecting retention)
      try {
        const queueRecord = await prisma.queue.upsert({
          where: {
            name_vhost_serverId: {
              name: queue.name,
              vhost: queue.vhost,
              serverId: id,
            },
          },
          update: {
            messages: queue.messages,
            messagesReady: queue.messages_ready,
            messagesUnack: queue.messages_unacknowledged,
            lastFetched: currentTimestamp,
          },
          create: {
            name: queue.name,
            vhost: queue.vhost,
            serverId: id,
            messages: queue.messages,
            messagesReady: queue.messages_ready,
            messagesUnack: queue.messages_unacknowledged,
            lastFetched: currentTimestamp,
          },
        });

        // Store metrics data for all plans
        await prisma.queueMetric.create({
          data: {
            queueId: queueRecord.id,
            timestamp: currentTimestamp,
            messages: queue.messages,
            messagesReady: queue.messages_ready,
            messagesUnack: queue.messages_unacknowledged,
            publishRate,
            consumeRate,
          },
        });

        logger.debug(
          `Stored metrics for queue ${queue.name} (plan: ${plan}, retention: ${maxRetentionDays}d)`
        );
      } catch (dbError) {
        logger.warn(
          { dbError, queueName: queue.name },
          "Failed to store queue metrics"
        );
      }
    }

    // Fetch historical data from database within plan limits
    const historicalData = await prisma.queueMetric.findMany({
      where: {
        queue: {
          serverId: id,
        },
        timestamp: {
          gte: startTime,
          lte: currentTimestamp,
        },
      },
      include: {
        queue: {
          select: {
            name: true,
            vhost: true,
          },
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    logger.info(
      `Fetched ${historicalData.length} historical data points for server ${id} (${timeRange})`
    );

    // Group historical data into time buckets for aggregation
    const bucketIntervalMinutes = Math.max(
      1,
      Math.floor((hoursBack * 60) / 50)
    ); // Max 50 data points
    const bucketIntervalMs = bucketIntervalMinutes * 60 * 1000;

    const buckets = new Map<
      number,
      {
        timestamp: number;
        publishRate: number;
        consumeRate: number;
        count: number;
      }
    >();

    // Process historical data into buckets
    historicalData.forEach((metric) => {
      const bucketTime =
        Math.floor(metric.timestamp.getTime() / bucketIntervalMs) *
        bucketIntervalMs;

      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, {
          timestamp: bucketTime,
          publishRate: 0,
          consumeRate: 0,
          count: 0,
        });
      }

      const bucket = buckets.get(bucketTime)!;
      bucket.publishRate += metric.publishRate || 0;
      bucket.consumeRate += metric.consumeRate || 0;
      bucket.count += 1;
    });

    // Average the rates for each bucket and create final time series
    let aggregatedThroughput = Array.from(buckets.values())
      .map((bucket) => ({
        timestamp: bucket.timestamp,
        publishRate: bucket.count > 0 ? bucket.publishRate / bucket.count : 0,
        consumeRate: bucket.count > 0 ? bucket.consumeRate / bucket.count : 0,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Always add current live data as the latest point
    aggregatedThroughput.push({
      timestamp: currentTimestamp.getTime(),
      publishRate: currentPublishRate,
      consumeRate: currentConsumeRate,
    });

    // Group queue-level historical data
    const queuesGrouped = historicalData.reduce(
      (acc, metric) => {
        const queueKey = `${metric.queue.vhost}/${metric.queue.name}`;
        if (!acc[queueKey]) {
          acc[queueKey] = {
            queueName: metric.queue.name,
            vhost: metric.queue.vhost,
            dataPoints: [],
          };
        }
        acc[queueKey].dataPoints.push({
          timestamp: metric.timestamp.getTime(),
          messages: metric.messages,
          messagesReady: metric.messagesReady,
          messagesUnack: metric.messagesUnack,
          publishRate: metric.publishRate || 0,
          consumeRate: metric.consumeRate || 0,
        });
        return acc;
      },
      {} as Record<string, any>
    );

    // Add current live data to queue groups
    for (const queue of liveQueues) {
      const queueKey = `${queue.vhost}/${queue.name}`;
      if (!queuesGrouped[queueKey]) {
        queuesGrouped[queueKey] = {
          queueName: queue.name,
          vhost: queue.vhost,
          dataPoints: [],
        };
      }
      queuesGrouped[queueKey].dataPoints.push({
        timestamp: currentTimestamp.getTime(),
        messages: queue.messages,
        messagesReady: queue.messages_ready,
        messagesUnack: queue.messages_unacknowledged,
        publishRate: queue.message_stats?.publish_details?.rate || 0,
        consumeRate: queue.message_stats?.deliver_details?.rate || 0,
      });
    }

    const response = {
      serverId: id,
      dataSource: "historical_with_live",
      timeRange,
      timestamp: currentTimestamp.toISOString(),
      queues: Object.values(queuesGrouped),
      aggregatedThroughput,
      metadata: {
        plan,
        maxRetentionDays,
        allowedTimeRanges,
        requestedHours: Math.floor(hoursBack),
        actualStartTime: startTime.toISOString(),
        bucketIntervalMinutes,
        historicalDataPoints: historicalData.length,
        aggregatedDataPoints: aggregatedThroughput.length,
        totalQueues: liveQueues.length,
      },
    };

    return c.json(response);
  } catch (error) {
    logger.error(
      { error, id, timeRange },
      "Error fetching timeseries data for server"
    );

    // Check if this is a 401 Unauthorized error from RabbitMQ API
    if (error instanceof Error && error.message.includes("401")) {
      // Return successful response with permission status instead of error
      return c.json({
        serverId: id,
        dataSource: "permission_denied",
        timeRange,
        timestamp: new Date().toISOString(),
        queues: [],
        aggregatedThroughput: [],
        permissionStatus: {
          hasPermission: false,
          requiredPermission: "monitor",
          message:
            "User does not have 'monitor' permissions to view metrics data. Please contact your RabbitMQ administrator to grant the necessary permissions.",
        },
        metadata: {
          plan: null,
          maxRetentionDays: 0,
          allowedTimeRanges: [],
          requestedHours: 0,
          actualStartTime: new Date().toISOString(),
          bucketIntervalMinutes: 0,
          historicalDataPoints: 0,
          aggregatedDataPoints: 0,
          totalQueues: 0,
        },
      });
    }

    return createErrorResponse(
      c,
      error,
      500,
      "Failed to fetch timeseries data"
    );
  }
});

/**
 * Get historical data for a specific server (requires appropriate plan)
 * GET /servers/:id/metrics/historical
 */
metricsController.get("/servers/:id/metrics/historical", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const timeRange = c.req.query("timeRange") || "24h";

  try {
    // Verify the server and get workspace details
    const server = await prisma.rabbitMQServer.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
      include: {
        workspace: {
          select: {
            plan: true,
            storageMode: true,
            retentionDays: true,
            consentGiven: true,
          },
        },
      },
    });

    if (!server || !server.workspace) {
      return c.json({ error: "Server not found or access denied" }, 404);
    }

    // Check if user can access historical data
    if (!canUserAccessMessageHistory(server.workspace.plan)) {
      return c.json(
        {
          error: "Historical data access requires a higher plan",
          currentPlan: server.workspace.plan,
          requiredFeature: "Message history access",
        },
        403
      );
    }

    if (!server.workspace.consentGiven) {
      return c.json(
        {
          error: "Data storage consent required for historical data",
          storageMode: server.workspace.storageMode,
        },
        403
      );
    }

    // Parse time range
    let hoursBack = 24;
    if (timeRange.endsWith("h")) {
      hoursBack = parseInt(timeRange);
    } else if (timeRange.endsWith("d")) {
      hoursBack = parseInt(timeRange) * 24;
    }

    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Get historical data from database
    const historicalData = await prisma.queueMetric.findMany({
      where: {
        queue: {
          serverId: id,
        },
        timestamp: {
          gte: startTime,
        },
      },
      include: {
        queue: {
          select: {
            name: true,
            vhost: true,
          },
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    // Group and aggregate data
    const groupedData = historicalData.reduce(
      (acc, metric) => {
        const queueKey = `${metric.queue.vhost}/${metric.queue.name}`;
        if (!acc[queueKey]) {
          acc[queueKey] = {
            queueName: metric.queue.name,
            vhost: metric.queue.vhost,
            dataPoints: [],
          };
        }
        acc[queueKey].dataPoints.push({
          timestamp: metric.timestamp.getTime(),
          messages: metric.messages,
          messagesReady: metric.messagesReady,
          messagesUnack: metric.messagesUnack,
          publishRate: metric.publishRate || 0,
          consumeRate: metric.consumeRate || 0,
        });
        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate aggregated throughput
    const throughputData = historicalData.reduce(
      (acc, metric) => {
        const timestampKey = metric.timestamp.getTime();
        if (!acc[timestampKey]) {
          acc[timestampKey] = {
            timestamp: timestampKey,
            publishRate: 0,
            consumeRate: 0,
          };
        }
        acc[timestampKey].publishRate += metric.publishRate || 0;
        acc[timestampKey].consumeRate += metric.consumeRate || 0;
        return acc;
      },
      {} as Record<number, any>
    );

    const aggregatedThroughput = Object.values(throughputData).sort(
      (a: any, b: any) => a.timestamp - b.timestamp
    );

    return c.json({
      serverId: id,
      timeRange,
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      dataSource: "historical",
      queues: Object.values(groupedData),
      aggregatedThroughput,
      metadata: {
        plan: server.workspace.plan,
        storageMode: server.workspace.storageMode,
        retentionDays: server.workspace.retentionDays,
        dataPoints: historicalData.length,
      },
    });
  } catch (error) {
    logger.error({ error, id }, "Error fetching historical data for server");

    // Check if this is a 401 Unauthorized error from RabbitMQ API
    if (error instanceof Error && error.message.includes("401")) {
      // Return successful response with permission status instead of error
      return c.json({
        serverId: id,
        timeRange,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        dataSource: "permission_denied",
        queues: [],
        aggregatedThroughput: [],
        permissionStatus: {
          hasPermission: false,
          requiredPermission: "monitor",
          message:
            "User does not have 'monitor' permissions to view metrics data. Please contact your RabbitMQ administrator to grant the necessary permissions.",
        },
        metadata: {
          plan: null,
          storageMode: null,
          retentionDays: 0,
          dataPoints: 0,
        },
      });
    }

    return createErrorResponse(
      c,
      error,
      500,
      "Failed to fetch historical data"
    );
  }
});

export default metricsController;
