import crypto from "crypto";
import prisma from "./prisma";

export enum DataType {
  METRICS = "metrics",
  MESSAGES = "messages",
  LOGS = "logs",
  CONNECTIONS = "connections",
  ALERTS = "alerts",
}

export enum StorageMode {
  MEMORY_ONLY = "memory_only", // Default: No persistent storage
  TEMPORARY = "temporary", // Short-term storage (1-7 days)
  HISTORICAL = "historical", // Long-term storage (Premium)
}

export interface PrivacySettings {
  userId: string;
  planType: string;
  storageMode: StorageMode;
  retentionDays: number;
  encryptData: boolean;
  autoDelete: boolean;
  consentGiven: boolean;
  consentDate?: Date;
}

export class PrivacyManager {
  private static readonly ENCRYPTION_ALGORITHM = "aes-256-gcm";
  private static readonly ENCRYPTION_KEY =
    process.env.ENCRYPTION_KEY || "default-key-change-in-production";

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
            },
          },
          // Add privacy fields to user model later
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const planType = user.company?.planType || "FREE";

      // Default privacy-first settings
      return {
        userId,
        planType,
        storageMode: StorageMode.MEMORY_ONLY,
        retentionDays: 0,
        encryptData: true,
        autoDelete: true,
        consentGiven: false,
      };
    } catch (error) {
      console.error("Error getting privacy settings:", error);
      // Return strictest settings as fallback
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
   * Encrypt sensitive data
   */
  static encryptSensitiveData(data: any): {
    encrypted: string;
    iv: string;
    tag: string;
  } {
    try {
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(this.ENCRYPTION_KEY, "salt", 32);
      const cipher = crypto.createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);

      let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
      encrypted += cipher.final("hex");

      return {
        encrypted,
        iv: iv.toString("hex"),
        tag: cipher.getAuthTag().toString("hex"),
      };
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decryptSensitiveData(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
  }): any {
    try {
      const key = crypto.scryptSync(this.ENCRYPTION_KEY, "salt", 32);
      const iv = Buffer.from(encryptedData.iv, "hex");
      const decipher = crypto.createDecipheriv(
        this.ENCRYPTION_ALGORITHM,
        key,
        iv
      );

      decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"));

      let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Schedule automatic data deletion
   */
  static async scheduleDataDeletion(userId: string): Promise<void> {
    try {
      const settings = await this.getPrivacySettings(userId);

      if (settings.autoDelete && settings.retentionDays > 0) {
        const deleteDate = new Date();
        deleteDate.setDate(deleteDate.getDate() + settings.retentionDays);

        // Schedule deletion (could use a job queue in production)
        console.log(
          `Scheduled data deletion for user ${userId} on ${deleteDate}`
        );

        // For now, log the scheduled deletion
        // In production, you'd use a job queue like Bull or Agenda
      }
    } catch (error) {
      console.error("Error scheduling data deletion:", error);
    }
  }

  /**
   * Delete all user data
   */
  static async deleteAllUserData(userId: string): Promise<boolean> {
    try {
      // Delete user's stored data from all tables
      await prisma.$transaction(async (tx) => {
        // Delete queue metrics
        await tx.queueMetric.deleteMany({
          where: {
            queue: {
              server: {
                companyId: {
                  in: await tx.user
                    .findUnique({
                      where: { id: userId },
                      select: { companyId: true },
                    })
                    .then((u) => (u?.companyId ? [u.companyId] : [])),
                },
              },
            },
          },
        });

        // Delete alerts
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
    details?: any
  ): Promise<void> {
    try {
      console.log(
        `Privacy Action - User: ${userId}, Action: ${action}, Details:`,
        details
      );

      // In production, you might want to store privacy audit logs
      // but ensure they don't contain sensitive information
    } catch (error) {
      console.error("Error logging privacy action:", error);
    }
  }

  /**
   * Get available storage modes based on user's plan
   */
  static getAvailableStorageModes(planType: string): StorageMode[] {
    const modes = [StorageMode.MEMORY_ONLY];

    // All plans can use temporary storage (with consent)
    modes.push(StorageMode.TEMPORARY);

    // Only premium and enterprise plans can use historical storage
    if (planType === "PREMIUM" || planType === "ENTERPRISE") {
      modes.push(StorageMode.HISTORICAL);
    }

    return modes;
  }

  /**
   * Check if a specific storage mode is available for a plan
   */
  static isStorageModeAvailable(
    planType: string,
    storageMode: StorageMode
  ): boolean {
    const availableModes = this.getAvailableStorageModes(planType);
    return availableModes.includes(storageMode);
  }
}

/**
 * PostgreSQL-based temporary storage for non-persistent data with TTL
 */
export class TemporaryStorage {
  /**
   * Clean up expired entries
   */
  private static async cleanupExpired(): Promise<void> {
    try {
      await prisma.tempCache.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });
    } catch (error) {
      console.error("Error cleaning up expired cache entries:", error);
    }
  }

  static async set(
    key: string,
    value: any,
    ttlMinutes: number = 30
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      await prisma.tempCache.upsert({
        where: { key },
        update: {
          value: value,
          expiresAt: expiresAt,
          createdAt: new Date(),
        },
        create: {
          key,
          value: value,
          expiresAt: expiresAt,
        },
      });

      // Periodically clean up expired entries (every 100 operations)
      if (Math.random() < 0.01) {
        setImmediate(() => this.cleanupExpired());
      }
    } catch (error) {
      console.error("Error setting cache value:", error);
      throw new Error("Failed to store temporary data");
    }
  }

  static async get(key: string): Promise<any | null> {
    try {
      const result = await prisma.tempCache.findFirst({
        where: {
          key,
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          value: true,
        },
      });

      return result?.value || null;
    } catch (error) {
      console.error("Error getting cache value:", error);
      return null;
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      await prisma.tempCache.delete({
        where: { key },
      });
    } catch (error) {
      console.error("Error deleting cache value:", error);
    }
  }

  static async clear(): Promise<void> {
    try {
      await prisma.tempCache.deleteMany({});
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  static async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    oldestEntry?: Date;
  }> {
    try {
      const result = await prisma.$queryRaw<
        Array<{
          total_keys: bigint;
          total_size: bigint;
          oldest_entry?: Date;
        }>
      >`
        SELECT 
          COUNT(*) as total_keys,
          SUM(octet_length(value::text)) as total_size,
          MIN(created_at) as oldest_entry
        FROM temp_cache 
        WHERE expires_at > NOW()
      `;

      const stats = result[0];

      return {
        totalKeys: Number(stats.total_keys),
        memoryUsage: `${Math.round(Number(stats.total_size) / 1024)}KB`,
        oldestEntry: stats.oldest_entry,
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return {
        totalKeys: 0,
        memoryUsage: "0KB",
      };
    }
  }

  /**
   * Manual cleanup of expired entries (can be called by a cron job)
   */
  static async cleanup(): Promise<{ deletedCount: number }> {
    try {
      const result = await prisma.tempCache.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });

      return { deletedCount: result.count };
    } catch (error) {
      console.error("Error during manual cleanup:", error);
      return { deletedCount: 0 };
    }
  }

  /**
   * Set TTL for an existing key
   */
  static async extend(
    key: string,
    additionalMinutes: number
  ): Promise<boolean> {
    try {
      const result = await prisma.$executeRaw`
        UPDATE temp_cache 
        SET expires_at = expires_at + INTERVAL '${additionalMinutes} minutes'
        WHERE key = ${key} AND expires_at > NOW()
      `;

      return Number(result) > 0;
    } catch (error) {
      console.error("Error extending cache TTL:", error);
      return false;
    }
  }

  /**
   * Generate a cache key for user-specific data
   */
  static generateKey(
    userId: string,
    dataType: string,
    identifier?: string
  ): string {
    const parts = [dataType, userId];
    if (identifier) {
      parts.push(identifier);
    }
    return parts.join("_");
  }

  /**
   * Set cache with automatic key generation
   */
  static async setUserData(
    userId: string,
    dataType: string,
    data: any,
    identifier?: string,
    ttlMinutes: number = 30
  ): Promise<void> {
    const key = this.generateKey(userId, dataType, identifier);
    return this.set(key, data, ttlMinutes);
  }

  /**
   * Get cache with automatic key generation
   */
  static async getUserData(
    userId: string,
    dataType: string,
    identifier?: string
  ): Promise<any | null> {
    const key = this.generateKey(userId, dataType, identifier);
    return this.get(key);
  }

  /**
   * Initialize periodic cleanup (call this once at application startup)
   */
  static startPeriodicCleanup(intervalMinutes: number = 60): NodeJS.Timeout {
    const cleanup = async () => {
      try {
        const result = await this.cleanup();
        if (result.deletedCount > 0) {
          console.log(
            `Cache cleanup: removed ${result.deletedCount} expired entries`
          );
        }
      } catch (error) {
        console.error("Periodic cache cleanup failed:", error);
      }
    };

    // Run cleanup immediately and then periodically
    cleanup();
    return setInterval(cleanup, intervalMinutes * 60 * 1000);
  }
}
