import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

// https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node", // Use node environment for utility function tests
    globals: true, // Enable global test functions (describe, it, expect)
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
