import { AlertCategory } from "./alert.interfaces";

/**
 * Generate alert ID (includes timestamp for uniqueness)
 */
export function generateAlertId(
  serverId: string,
  category: AlertCategory,
  source: string
): string {
  return `${serverId}-${category}-${source}-${Date.now()}`;
}

/**
 * Generate stable alert fingerprint (without timestamp) for tracking seen alerts
 */
export function generateAlertFingerprint(
  serverId: string,
  category: AlertCategory,
  sourceType: "node" | "queue" | "cluster",
  sourceName: string
): string {
  return `${serverId}-${category}-${sourceType}-${sourceName}`;
}
