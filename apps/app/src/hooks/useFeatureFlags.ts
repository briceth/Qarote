/**
 * React hook for feature flags
 * Note: Frontend feature flags are for UI display only.
 * All authorization is enforced server-side.
 */

import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/lib/trpc/client";
import type { PremiumFeature } from "@/lib/featureFlags";
import { isCloudMode } from "@/lib/featureFlags";

/**
 * Hook to check if a premium feature is enabled
 * In cloud mode, all features are enabled.
 * In community/enterprise mode, checks with server.
 */
export function useFeatureFlags() {
  // In cloud mode, all features are enabled
  const cloudMode = isCloudMode();

  // Query feature availability from server (for enterprise/community)
  const { data: features } = trpc.public.getFeatureFlags.useQuery(undefined, {
    enabled: !cloudMode,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const hasFeature = (feature: PremiumFeature): boolean => {
    // Cloud mode: all features enabled
    if (cloudMode) {
      return true;
    }

    // Enterprise/Community: check server response
    return features?.features?.[feature] ?? false;
  };

  return {
    hasFeature,
    isLoading: !cloudMode && !features,
    features: features?.features ?? {},
  };
}

