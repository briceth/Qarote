import type { AppRouter } from "@api/trpc/router";
import { createTRPCReact } from "@trpc/react-query";

/**
 * Create tRPC React hooks
 * Strongly-typed React hooks from AppRouter type signature
 */
export const trpc = createTRPCReact<AppRouter>();
