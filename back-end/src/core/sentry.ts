import Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { logger } from "./logger";
import { sentryConfig } from "@/config";

export function initSentry() {
  // Only initialize Sentry in production or when explicitly enabled
  if (!sentryConfig.enabled && sentryConfig.environment !== "production") {
    return;
  }

  if (!sentryConfig.dsn) {
    logger.warn("Sentry DSN not provided - monitoring disabled");
    return;
  }

  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    // Enable logs to be sent to Sentry

    enableLogs: true,

    // Performance Monitoring
    tracesSampleRate: sentryConfig.tracesSampleRate,

    // Profiling
    profilesSampleRate: sentryConfig.profilesSampleRate,

    integrations: [
      nodeProfilingIntegration(),

      // HTTP integration for API monitoring
      Sentry.httpIntegration(),

      // Prisma integration for database monitoring
      Sentry.prismaIntegration(),

      // send console.log, console.warn, and console.error calls as logs to Sentry
      Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),

      // Pino integration for structured logging
      Sentry.pinoIntegration(),
    ],

    // Configure what gets sent to Sentry
    beforeSend(event) {
      // Filter out sensitive information
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Don't send health check errors
      if (event.exception?.values?.[0]?.value?.includes("health")) {
        return null;
      }

      return event;
    },

    // Filter logs before sending to Sentry
    beforeSendLog(log) {
      // Skip health check logs to reduce noise
      if (
        log.message &&
        typeof log.message === "string" &&
        log.message.toLowerCase().includes("health")
      ) {
        return null;
      }

      return log;
    },

    // Set release information
    release: sentryConfig.release,

    // Configure tags
    initialScope: {
      tags: {
        component: "backend",
        service: "rabbithq-api",
      },
    },
  });
}

export function setSentryUser(user: {
  id: string;
  workspaceId: string | null;
  email?: string;
}) {
  Sentry.setUser({
    id: user.id,
    workspace_id: user.workspaceId || undefined,
    email: user.email,
  });
}

export function setSentryContext(context: string, data: any) {
  Sentry.setContext(context, data);
}

export function captureRabbitMQError(
  error: Error,
  context: {
    serverId?: string;
    queueName?: string;
    exchange?: string;
    routingKey?: string;
    messageId?: string;
    operation?: string;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag("component", "rabbitmq");
    scope.setContext("rabbitmq", context);
    Sentry.captureException(error);
  });
}

export function captureMessageProcessingError(
  error: Error,
  context: {
    messageId?: string;
    queueName?: string;
    serverId?: string;
    operation?: string;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag("component", "message-processing");
    scope.setContext("message", context);
    Sentry.captureException(error);
  });
}

export function captureStreamingError(
  error: Error,
  context: {
    streamId?: string;
    userId?: string;
    serverId?: string;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag("component", "streaming");
    scope.setContext("stream", context);
    Sentry.captureException(error);
  });
}

export { Sentry };
