import pino from "pino";
import { logConfig } from "@/config";

// Configure pino logger based on environment
const logger = pino({
  level: logConfig.level,
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
