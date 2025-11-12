/**
 * Routing Feature Flag for Frontend
 *
 * Controls access to the routing visualization feature based on environment.
 * - Production: Routing is disabled (coming soon)
 * - Development: Routing is fully enabled
 */

/**
 * Check if routing feature is enabled based on the current environment
 * @returns true if routing is enabled, false otherwise
 */
export const isRoutingEnabled = (): boolean => {
  // In Vite, use import.meta.env.MODE to check the environment
  const isDev = import.meta.env.MODE === "development";

  // Enable routing only in development
  return isDev;
};

/**
 * Get routing feature status for display purposes
 * @returns object with enabled status and display text
 */
export const getRoutingFeatureStatus = () => {
  const enabled = isRoutingEnabled();
  return {
    enabled,
    statusText: enabled ? "Available" : "Coming Soon",
    description: enabled
      ? "Interactive diagrams showing live message flows across exchanges"
      : "Advanced routing visualization with interactive diagrams is coming soon to production environments",
  };
};
