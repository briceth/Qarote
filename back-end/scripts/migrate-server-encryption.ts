/**
 * Migration script to encrypt existing server credentials
 *
 * This script will:
 * 1. Read all existing RabbitMQ servers from the database
 * 2. Encrypt their usernames and passwords using the EncryptionService
 * 3. Update the records with encrypted data
 *
 * IMPORTANT:
 * - Run this script ONCE after deploying the encryption changes
 * - Backup your database before running this migration
 * - Make sure ENCRYPTION_KEY environment variable is set
 */

import { PrismaClient } from "@prisma/client";
import { EncryptionService } from "../src/services/encryption.service";

const prisma = new PrismaClient();

async function migrateServerCredentials() {
  console.log("Starting server credentials encryption migration...");

  try {
    // Get all servers from the database
    const servers = await prisma.rabbitMQServer.findMany({
      select: {
        id: true,
        username: true,
        password: true,
        name: true,
      },
    });

    console.log(`Found ${servers.length} servers to migrate`);

    if (servers.length === 0) {
      console.log("No servers to migrate");
      return;
    }

    // Check if data is already encrypted (by checking if first server has encrypted format)
    const firstServer = servers[0];
    if (
      firstServer.username?.includes(":") &&
      firstServer.password?.includes(":")
    ) {
      console.log("Data appears to already be encrypted. Skipping migration.");
      return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const server of servers) {
      try {
        // Skip if username or password is null/empty
        if (!server.username || !server.password) {
          console.log(
            `Skipping server ${server.name} (${server.id}) - missing credentials`
          );
          skipped++;
          continue;
        }

        // Check if already encrypted (contains colon separator)
        if (server.username.includes(":") && server.password.includes(":")) {
          console.log(
            `Skipping server ${server.name} (${server.id}) - already encrypted`
          );
          skipped++;
          continue;
        }

        // Encrypt the credentials
        const encryptedUsername = EncryptionService.encrypt(server.username);
        const encryptedPassword = EncryptionService.encrypt(server.password);

        // Update the server with encrypted credentials
        await prisma.rabbitMQServer.update({
          where: { id: server.id },
          data: {
            username: encryptedUsername,
            password: encryptedPassword,
          },
        });

        console.log(`✓ Migrated server: ${server.name} (${server.id})`);
        migrated++;
      } catch (error) {
        console.error(
          `✗ Failed to migrate server ${server.name} (${server.id}):`,
          error
        );
      }
    }

    console.log("\n--- Migration Summary ---");
    console.log(`Total servers: ${servers.length}`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateServerCredentials().catch((error) => {
    console.error("Unhandled error during migration:", error);
    process.exit(1);
  });
}

export { migrateServerCredentials };
