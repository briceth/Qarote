import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    "apps/api": {
      entry: [
        "src/index.ts",
        "src/workers/alert-monitor.ts",
        "scripts/**/*.ts",
        "prisma/schema.prisma",
        "vitest.config.ts",
      ],
      project: ["src/**/*.ts", "scripts/**/*.ts"],
      ignore: ["**/*.test.ts", "**/*.spec.ts", "dist/**", "node_modules/**"],
    },
    "apps/app": {
      entry: [
        "src/main.tsx",
        "src/App.tsx",
        "index.html",
        "vite.config.ts",
        "vitest.config.ts",
      ],
      project: ["src/**/*.{ts,tsx}"],
      ignore: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "dist/**",
        "node_modules/**",
      ],
    },
    "apps/web": {
      entry: [
        "src/main.tsx",
        "index.html",
        "vite.config.ts",
        "vitest.config.ts",
      ],
      project: ["src/**/*.{ts,tsx}"],
      ignore: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "dist/**",
        "node_modules/**",
      ],
    },
    "apps/portal": {
      entry: ["src/main.tsx", "index.html", "vite.config.ts"],
      project: ["src/**/*.{ts,tsx}"],
      ignore: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "dist/**",
        "node_modules/**",
      ],
    },
    infrastructure: {
      entry: ["scripts/**/*.ts"],
      project: ["scripts/**/*.ts"],
      ignore: ["**/*.test.ts", "**/*.spec.ts", "dist/**", "node_modules/**"],
    },
  },
  ignore: [
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/build/**",
    "**/coverage/**",
    "**/*.d.ts",
    "**/migrations/**",
    "**/prisma/migrations/**",
    "**/.turbo/**",
    "**/public/**",
    "**/assets/**",
    "**/*.config.{js,ts}",
    "**/tsconfig*.json",
    "**/package.json",
    "**/pnpm-lock.yaml",
    "**/bun.lockb",
    // UI components kept for future use
    "**/components/ui/**",
    "apps/app/src/components/ui/**",
    "apps/web/src/components/ui/**",
    "apps/portal/src/components/ui/**",
  ],
  ignoreDependencies: [
    // Build tools
    "typescript",
    "@types/node",
    "tsx",
    "tsc-alias",
    "tsconfig-paths",
    "vite",
    "@vitejs/plugin-react",
    "vitest",
    "eslint",
    "prettier",
    "prisma",
    // Development tools
    "@react-email/preview-server",
    "husky",
    "lint-staged",
    "syncpack",
    "turbo",
    // Type definitions that might be used indirectly
    "@types/react",
    "@types/react-dom",
    "@types/uuid",
    "@types/amqplib",
    "@types/bcryptjs",
    "@types/cors",
    "@types/nodemailer",
  ],
  ignoreBinaries: [
    "tsx",
    "tsc",
    "prisma",
    "vite",
    "vitest",
    "eslint",
    "prettier",
  ],
};

export default config;
