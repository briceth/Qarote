import { prisma } from "../core/prisma";
import { logger } from "../core/logger";
import { getMetricsRetentionDays } from "../services/plan/plan.service";
import { WorkspacePlan } from "@prisma/client";

interface CleanupStats {
  workspaceId: string;
  plan: WorkspacePlan;
  retentionDays: number;
  metricsDeleted: number;
  cutoffDate: Date;
}

class MetricsCleanupService {
  async cleanupExpiredMetrics(): Promise<CleanupStats[]> {
    console.log("🧹 Starting metrics cleanup process...");

    const stats: CleanupStats[] = [];

    try {
      // Get all workspaces with their plans
      const workspaces = await prisma.workspace.findMany({
        include: {
          servers: {
            include: {
              Queues: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      console.log(`📊 Found ${workspaces.length} workspaces to process`);

      for (const workspace of workspaces) {
        const retentionDays = getMetricsRetentionDays(workspace.plan);
        const cutoffDate = new Date(
          Date.now() - retentionDays * 24 * 60 * 60 * 1000
        );

        console.log(
          `🔍 Processing workspace ${workspace.id} (${workspace.plan}): retention ${retentionDays} days, cutoff ${cutoffDate.toISOString()}`
        );

        // Get all queue IDs for this workspace
        const queueIds = workspace.servers.flatMap((server) =>
          server.Queues.map((queue) => queue.id)
        );

        if (queueIds.length === 0) {
          console.log(`  📭 No queues found for workspace ${workspace.id}`);
          continue;
        }

        // Delete expired metrics for this workspace
        const deleteResult = await prisma.queueMetric.deleteMany({
          where: {
            queueId: {
              in: queueIds,
            },
            timestamp: {
              lt: cutoffDate,
            },
          },
        });

        const workspaceStats: CleanupStats = {
          workspaceId: workspace.id,
          plan: workspace.plan,
          retentionDays,
          metricsDeleted: deleteResult.count,
          cutoffDate,
        };

        stats.push(workspaceStats);

        console.log(
          `  ✅ Deleted ${deleteResult.count} expired metrics for workspace ${workspace.id}`
        );
      }

      // Log summary
      const totalDeleted = stats.reduce(
        (sum, stat) => sum + stat.metricsDeleted,
        0
      );
      console.log(`\n📈 Cleanup Summary:`);
      console.log(`  🗑️  Total metrics deleted: ${totalDeleted}`);
      console.log(`  🏢 Workspaces processed: ${stats.length}`);

      stats.forEach((stat) => {
        if (stat.metricsDeleted > 0) {
          console.log(
            `    • ${stat.workspaceId} (${stat.plan}): ${stat.metricsDeleted} metrics deleted`
          );
        }
      });

      return stats;
    } catch (error) {
      logger.error({ error }, "Error during metrics cleanup");
      throw error;
    }
  }

  async getMetricsOverview(): Promise<{
    totalMetrics: number;
    metricsByPlan: Record<WorkspacePlan, number>;
    oldestMetric: Date | null;
    newestMetric: Date | null;
  }> {
    console.log("📊 Getting metrics overview...");

    const totalMetrics = await prisma.queueMetric.count();

    // Get metrics breakdown by plan
    const planBreakdown: Record<WorkspacePlan, number> = {
      [WorkspacePlan.FREE]: 0,
      [WorkspacePlan.DEVELOPER]: 0,
      [WorkspacePlan.STARTUP]: 0,
      [WorkspacePlan.BUSINESS]: 0,
    };

    for (const plan of Object.values(WorkspacePlan)) {
      const count = await prisma.queueMetric.count({
        where: {
          queue: {
            server: {
              workspace: {
                plan,
              },
            },
          },
        },
      });
      planBreakdown[plan] = count;
    }

    // Get date range
    const dateRange = await prisma.queueMetric.aggregate({
      _min: {
        timestamp: true,
      },
      _max: {
        timestamp: true,
      },
    });

    return {
      totalMetrics,
      metricsByPlan: planBreakdown,
      oldestMetric: dateRange._min.timestamp,
      newestMetric: dateRange._max.timestamp,
    };
  }
}

// Main execution function
async function main() {
  const cleanupService = new MetricsCleanupService();

  try {
    // Show current state
    const overview = await cleanupService.getMetricsOverview();
    console.log("\n🔍 Current Metrics Overview:");
    console.log(
      `  📊 Total metrics: ${overview.totalMetrics.toLocaleString()}`
    );
    console.log(
      `  📅 Date range: ${overview.oldestMetric?.toISOString()} → ${overview.newestMetric?.toISOString()}`
    );
    console.log(`  📋 By plan:`);
    Object.entries(overview.metricsByPlan).forEach(([plan, count]) => {
      if (count > 0) {
        console.log(`    • ${plan}: ${count.toLocaleString()} metrics`);
      }
    });

    // Perform cleanup
    console.log("\n" + "=".repeat(50));
    const stats = await cleanupService.cleanupExpiredMetrics();

    // Show final state
    console.log("\n" + "=".repeat(50));
    const finalOverview = await cleanupService.getMetricsOverview();
    console.log("\n🎯 Final Metrics Overview:");
    console.log(
      `  📊 Total metrics: ${finalOverview.totalMetrics.toLocaleString()}`
    );
    console.log(
      `  📅 Date range: ${finalOverview.oldestMetric?.toISOString()} → ${finalOverview.newestMetric?.toISOString()}`
    );

    console.log("\n✅ Metrics cleanup completed successfully!");
  } catch (error) {
    console.error("\n❌ Metrics cleanup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT. Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM. Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

// Run the cleanup if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

export { MetricsCleanupService };
