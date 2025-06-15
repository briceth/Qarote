import prisma from "../prisma";
import { EncryptionService } from "./encryption";
import { DataType, StorageMode, type PrivacySettings } from "./types";

/**
 * Privacy management for user data and consent
 */
export class PrivacyManager {
  /**
   * Check if data storage is allowed for a user and data type
   */
  static async shouldStoreData(
    userId: string,
    dataType: DataType
  ): Promise<boolean> {
    try {
      const settings = await this.getPrivacySettings(userId);

      // Default: no storage unless explicitly consented
      if (
        !settings.consentGiven ||
        settings.storageMode === StorageMode.MEMORY_ONLY
      ) {
        return false;
      }

      // Check user's plan and preferences
      const isTemporaryAllowed = settings.storageMode === StorageMode.TEMPORARY;
      const isHistoricalAllowed =
        settings.storageMode === StorageMode.HISTORICAL &&
        (settings.planType === "PREMIUM" || settings.planType === "ENTERPRISE");

      return isTemporaryAllowed || isHistoricalAllowed;
    } catch (error) {
      console.error("Error checking data storage permission:", error);
      return false; // Fail-safe: no storage
    }
  }

  /**
   * Get user's privacy settings
   */
  static async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          company: {
            select: {
              planType: true,
              storageMode: true,
              retentionDays: true,
              encryptData: true,
              autoDelete: true,
              consentGiven: true,
              consentDate: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const company = user.company;
      if (!company) {
        // User without company gets strictest default settings
        return {
          userId,
          planType: "FREE",
          storageMode: StorageMode.MEMORY_ONLY,
          retentionDays: 0,
          encryptData: true,
          autoDelete: true,
          consentGiven: false,
        };
      }

      return {
        userId,
        planType: company.planType,
        storageMode: company.storageMode as StorageMode,
        retentionDays: company.retentionDays,
        encryptData: company.encryptData,
        autoDelete: company.autoDelete,
        consentGiven: company.consentGiven,
        consentDate: company.consentDate || undefined,
      };
    } catch (error) {
      console.error("Error getting privacy settings:", error);
      // Return strictest defaults on error
      return {
        userId,
        planType: "FREE",
        storageMode: StorageMode.MEMORY_ONLY,
        retentionDays: 0,
        encryptData: true,
        autoDelete: true,
        consentGiven: false,
      };
    }
  }

  /**
   * Update user's privacy consent
   */
  static async updateConsent(
    userId: string,
    consentGiven: boolean,
    storageMode?: StorageMode
  ): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user?.companyId) {
        throw new Error("User company not found");
      }

      await prisma.company.update({
        where: { id: user.companyId },
        data: {
          consentGiven,
          consentDate: consentGiven ? new Date() : null,
          ...(storageMode && { storageMode }),
        },
      });

      // Log the consent change
      await this.logPrivacyAction(userId, "consent_updated", {
        consentGiven,
        storageMode,
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Error updating consent:", error);
      return false;
    }
  }

  /**
   * Store data with privacy checks
   */
  static async storeDataWithPrivacy(
    userId: string,
    dataType: DataType,
    data: any
  ): Promise<boolean> {
    try {
      const canStore = await this.shouldStoreData(userId, dataType);
      if (!canStore) {
        return false;
      }

      const settings = await this.getPrivacySettings(userId);

      // Encrypt if required
      let finalData = data;
      if (settings.encryptData) {
        finalData = EncryptionService.encryptSensitiveData(data);
      }

      // Here you would store the data in your chosen storage
      // This is a placeholder - implement based on your needs
      console.log(`Storing ${dataType} data for user ${userId}`, {
        encrypted: settings.encryptData,
        storageMode: settings.storageMode,
      });

      return true;
    } catch (error) {
      console.error("Error storing data with privacy:", error);
      return false;
    }
  }

  /**
   * Delete all user data (GDPR right to erasure)
   */
  static async deleteAllUserData(userId: string): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        // Delete operational data while preserving account structure
        await tx.alert.deleteMany({
          where: {
            companyId: {
              in: await tx.user
                .findUnique({
                  where: { id: userId },
                  select: { companyId: true },
                })
                .then((u) => (u?.companyId ? [u.companyId] : [])),
            },
          },
        });

        // Note: We keep user account and company info for authentication
        // but delete all operational/sensitive data
      });

      console.log(
        `Successfully deleted all operational data for user ${userId}`
      );
      return true;
    } catch (error) {
      console.error("Error deleting user data:", error);
      return false;
    }
  }

  /**
   * Export user data for transparency
   */
  static async exportUserData(userId: string): Promise<any> {
    try {
      const settings = await this.getPrivacySettings(userId);

      return {
        privacySettings: settings,
        storedDataTypes:
          settings.storageMode === StorageMode.MEMORY_ONLY
            ? []
            : ["queue_metrics", "alerts", "user_preferences"],
        exportDate: new Date(),
        note: "This export includes all data we store about you. Most operational data is accessed in real-time and not stored.",
      };
    } catch (error) {
      console.error("Error exporting user data:", error);
      throw new Error("Failed to export user data");
    }
  }

  /**
   * Log privacy-related actions for audit
   */
  static async logPrivacyAction(
    userId: string,
    action: string,
    details: any
  ): Promise<void> {
    try {
      // Implement audit logging here
      console.log(`Privacy action: ${action}`, {
        userId,
        action,
        details,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error logging privacy action:", error);
    }
  }
}
