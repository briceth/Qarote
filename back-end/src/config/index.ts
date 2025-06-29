import { z } from "zod/v4";
import dotenv from "dotenv";

dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("localhost"),

  // Security
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  ENCRYPTION_KEY: z
    .string()
    .min(32, "ENCRYPTION_KEY must be at least 32 characters"),

  // Database
  DATABASE_URL: z.string().startsWith("postgresql://", {
    message: "DATABASE_URL must start with 'postgres://'",
  }),

  // CORS
  CORS_ORIGIN: z.string().default("*"),

  // Email Configuration
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.email().default("noreply@rabbitscout.com"),
  FRONTEND_URL: z.url("FRONTEND_URL must be a valid URL"),

  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Stripe Price IDs
  STRIPE_FREELANCE_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_FREELANCE_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_STARTUP_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_STARTUP_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_BUSINESS_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_BUSINESS_YEARLY_PRICE_ID: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Sentry Configuration
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENABLED: z.coerce.boolean().default(false),
  SENTRY_RELEASE: z.string().optional(),

  // NPM package version (for Sentry releases)
  npm_package_version: z.string().optional(),

  // Feature Flags (for backwards compatibility)
  NODE_TLS_REJECT_UNAUTHORIZED: z.string().optional(),
});

// Parse and validate environment variables
function parseConfig() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
      throw new Error(
        `Configuration validation failed:\n${errorMessages.join("\n")}`
      );
    }
    throw error;
  }
}

// Export validated config
export const config = parseConfig();

// Export types for TypeScript
export type Config = z.infer<typeof envSchema>;

// Helper functions to check configuration
export const isDevelopment = () => config.NODE_ENV === "development";
export const isProduction = () => config.NODE_ENV === "production";
export const isTest = () => config.NODE_ENV === "test";

// Specific config getters with validation
export const serverConfig = {
  port: config.PORT,
  host: config.HOST,
  nodeEnv: config.NODE_ENV,
} as const;

export const authConfig = {
  jwtSecret: config.JWT_SECRET,
  encryptionKey: config.ENCRYPTION_KEY,
} as const;

export const databaseConfig = {
  url: config.DATABASE_URL,
} as const;

export const corsConfig = {
  origin: config.CORS_ORIGIN,
} as const;

export const emailConfig = {
  resendApiKey: config.RESEND_API_KEY,
  fromEmail: config.FROM_EMAIL,
  frontendUrl: config.FRONTEND_URL,
} as const;

export const stripeConfig = {
  secretKey: config.STRIPE_SECRET_KEY,
  webhookSecret: config.STRIPE_WEBHOOK_SECRET,
  priceIds: {
    freelance: {
      monthly: config.STRIPE_FREELANCE_MONTHLY_PRICE_ID,
      yearly: config.STRIPE_FREELANCE_YEARLY_PRICE_ID,
    },
    startup: {
      monthly: config.STRIPE_STARTUP_MONTHLY_PRICE_ID,
      yearly: config.STRIPE_STARTUP_YEARLY_PRICE_ID,
    },
    business: {
      monthly: config.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
      yearly: config.STRIPE_BUSINESS_YEARLY_PRICE_ID,
    },
  },
} as const;

export const logConfig = {
  level: config.LOG_LEVEL,
  isDevelopment: isDevelopment(),
} as const;

export const sentryConfig = {
  dsn: config.SENTRY_DSN,
  enabled: config.SENTRY_ENABLED,
  environment: config.NODE_ENV,
  release:
    config.SENTRY_RELEASE ||
    `rabbit-scout-backend@${config.npm_package_version || "unknown"}`,
  tracesSampleRate: isProduction() ? 0.1 : 1.0,
  profilesSampleRate: isProduction() ? 0.05 : 1.0,
} as const;
