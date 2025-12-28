/**
 * Frontend Feature Flags
 * Note: These are for UI display only. All authorization is done server-side.
 */

export type PremiumFeature =
  | "workspace_management"
  | "alerting"
  | "slack_integration"
  | "webhook_integration"
  | "data_export"
  | "advanced_alert_rules";

/**
 * Get deployment mode from environment
 */
export function getDeploymentMode(): "cloud" | "community" | "enterprise" {
  return (import.meta.env.VITE_DEPLOYMENT_MODE as "cloud" | "community" | "enterprise") || "cloud";
}

/**
 * Check if running in community mode
 */
export function isCommunityMode(): boolean {
  return getDeploymentMode() === "community";
}

/**
 * Check if running in enterprise mode
 */
export function isEnterpriseMode(): boolean {
  return getDeploymentMode() === "enterprise";
}

/**
 * Check if running in cloud mode
 */
export function isCloudMode(): boolean {
  return getDeploymentMode() === "cloud";
}

/**
 * Feature descriptions for UI
 */
export const FEATURE_DESCRIPTIONS: Record<PremiumFeature, string> = {
  workspace_management: "Workspace Management",
  alerting: "Alerting System",
  slack_integration: "Slack Integration",
  webhook_integration: "Webhook Integration",
  data_export: "Data Export",
  advanced_alert_rules: "Advanced Alert Rules",
};

/**
 * Get feature description
 */
export function getFeatureDescription(feature: PremiumFeature): string {
  return FEATURE_DESCRIPTIONS[feature] || feature;
}

