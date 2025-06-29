import pino from "pino";

// Configure pino logger based on environment
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
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

export default logger;
