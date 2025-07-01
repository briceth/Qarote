import pino from "pino";
import { logConfig } from "@/config";

// Configure pino logger based on environment
const logger = pino({
  level: logConfig.level,
  redact: {
    paths: [
      // Password and authentication fields
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
      "apiKey",
      "secret",
      "privateKey",

      // Database credentials
      "dbPassword",
      "connectionString",

      // RabbitMQ credentials
      "rabbitmq.password",
      "credentials.password",
      "server.password",

      // User sensitive data
      "email",
      "phone",
      "ssn",
      "creditCard",

      // Headers that might contain sensitive data
      "headers.authorization",
      "headers.cookie",
      'headers["x-api-key"]',

      // Request/response body fields
      "body.password",
      "body.token",
      "req.body.password",
      "res.body.password",

      // SSL/TLS certificates
      "cert",
      "key",
      "ca",
      "sslKey",
      "sslCert",

      // JWT and session data
      "jwt",
      "session",
      "sessionId",
    ],
    censor: "[REDACTED]",
  },
  transport: logConfig.isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    pid: false,
    hostname: false,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export { logger };
