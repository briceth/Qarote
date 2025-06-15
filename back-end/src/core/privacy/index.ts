/**
 * Privacy module - Re-exports all privacy-related functionality
 *
 * This barrel file maintains backward compatibility while providing
 * a clean modular structure under the 200-line rule.
 */

// Types and enums
export {
  DataType,
  StorageMode,
  type PrivacySettings,
  type EncryptedData,
  type CacheStats,
  type CleanupResult,
} from "./types";

// Core services
export { PrivacyManager } from "./privacy-manager";
export { EncryptionService } from "./encryption";
export { TemporaryStorage } from "./temporary-storage";

// Backward compatibility - re-export main classes with original names
export { PrivacyManager as default } from "./privacy-manager";
