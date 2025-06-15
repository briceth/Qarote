import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import prisma from "../core/prisma";
import {
  authenticate,
  authorize,
  checkCompanyAccess,
  SafeUser,
} from "../core/auth";
import { CreateCompanySchema, UpdateCompanySchema } from "../schemas/company";
import { UserRole } from "@prisma/client";

const companyController = new Hono();

// All routes in this controller require authentication
companyController.use("*", authenticate);

// Get all companies (admin only)
companyController.get("/", authorize([UserRole.ADMIN]), async (c) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            servers: true,
          },
        },
      },
    });

    return c.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return c.json({ error: "Failed to fetch companies" }, 500);
  }
});

// Get user's company
companyController.get("/me", async (c) => {
  const user = c.get("user") as SafeUser;

  if (!user.companyId) {
    return c.json({ error: "You are not associated with any company" }, 404);
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        _count: {
          select: {
            users: true,
            servers: true,
          },
        },
      },
    });

    if (!company) {
      return c.json({ error: "Company not found" }, 404);
    }

    return c.json({ company });
  } catch (error) {
    console.error(`Error fetching company ${user.companyId}:`, error);
    return c.json({ error: "Failed to fetch company" }, 500);
  }
});

// Get a specific company by ID
companyController.get("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user") as SafeUser;

  // Only allow admins or users from the company to access company details
  if (user.role !== UserRole.ADMIN && user.companyId !== id) {
    return c.json(
      { error: "Forbidden", message: "Cannot access this company" },
      403
    );
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            servers: true,
          },
        },
      },
    });

    if (!company) {
      return c.json({ error: "Company not found" }, 404);
    }

    return c.json({ company });
  } catch (error) {
    console.error(`Error fetching company ${id}:`, error);
    return c.json({ error: "Failed to fetch company" }, 500);
  }
});

// Create a new company (admin only)
companyController.post(
  "/",
  authorize([UserRole.ADMIN]),
  zValidator("json", CreateCompanySchema),
  async (c) => {
    const data = c.req.valid("json");

    try {
      const company = await prisma.company.create({
        data,
      });

      return c.json({ company }, 201);
    } catch (error) {
      console.error("Error creating company:", error);
      return c.json({ error: "Failed to create company" }, 500);
    }
  }
);

// Update a company
companyController.put(
  "/:id",
  zValidator("json", UpdateCompanySchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const user = c.get("user") as SafeUser;

    // Only allow company users or admins to update company details
    if (user.role !== UserRole.ADMIN && user.companyId !== id) {
      return c.json(
        { error: "Forbidden", message: "Cannot update this company" },
        403
      );
    }

    try {
      // Check if company exists
      const existingCompany = await prisma.company.findUnique({
        where: { id },
      });

      if (!existingCompany) {
        return c.json({ error: "Company not found" }, 404);
      }

      const company = await prisma.company.update({
        where: { id },
        data,
      });

      return c.json({ company });
    } catch (error) {
      console.error(`Error updating company ${id}:`, error);
      return c.json({ error: "Failed to update company" }, 500);
    }
  }
);

// Delete a company (admin only)
companyController.delete("/:id", authorize([UserRole.ADMIN]), async (c) => {
  const id = c.req.param("id");

  try {
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return c.json({ error: "Company not found" }, 404);
    }

    // Delete company (this will also delete all related records due to cascade)
    await prisma.company.delete({
      where: { id },
    });

    return c.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error(`Error deleting company ${id}:`, error);
    return c.json({ error: "Failed to delete company" }, 500);
  }
});

// Get company statistics
companyController.get("/:id/stats", checkCompanyAccess, async (c) => {
  const id = c.req.param("id");

  try {
    // Get company with counts
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            servers: true,
          },
        },
      },
    });

    if (!company) {
      return c.json({ error: "Company not found" }, 404);
    }

    // Get server and queue counts
    const servers = await prisma.rabbitMQServer.count({
      where: { companyId: id },
    });

    const queuesAggregate = await prisma.queue.aggregate({
      where: {
        server: {
          companyId: id,
        },
      },
      _count: true,
      _sum: {
        messages: true,
        messagesReady: true,
        messagesUnack: true,
      },
    });

    // Get recent alerts
    const recentAlerts = await prisma.alert.findMany({
      where: {
        createdBy: {
          companyId: id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const stats = {
      userCount: company._count.users,
      serverCount: servers,
      queueCount: queuesAggregate._count,
      messageStats: {
        total: queuesAggregate._sum.messages || 0,
        ready: queuesAggregate._sum.messagesReady || 0,
        unacknowledged: queuesAggregate._sum.messagesUnack || 0,
      },
      recentAlerts,
    };

    return c.json({ stats });
  } catch (error) {
    console.error(`Error fetching stats for company ${id}:`, error);
    return c.json({ error: "Failed to fetch company statistics" }, 500);
  }
});

// Get company privacy settings
companyController.get("/:id/privacy", checkCompanyAccess, async (c) => {
  try {
    const id = c.req.param("id");

    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        planType: true,
        storageMode: true,
        retentionDays: true,
        encryptData: true,
        autoDelete: true,
        consentGiven: true,
        consentDate: true,
      },
    });

    if (!company) {
      return c.json({ error: "Company not found" }, 404);
    }

    return c.json({ privacy: company });
  } catch (error) {
    console.error(
      `Error fetching privacy settings for company ${c.req.param("id")}:`,
      error
    );
    return c.json({ error: "Failed to fetch privacy settings" }, 500);
  }
});

// Update company privacy settings (admin only)
companyController.put(
  "/:id/privacy",
  authorize([UserRole.ADMIN]),
  zValidator(
    "json",
    z.object({
      storageMode: z.enum(["MEMORY_ONLY", "TEMPORARY", "HISTORICAL"]),
      retentionDays: z.number().min(0).max(365),
      encryptData: z.boolean(),
      autoDelete: z.boolean(),
      consentGiven: z.boolean(),
    })
  ),
  async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");
      const user = c.get("user") as SafeUser;

      // Verify company exists and user has access
      const company = await prisma.company.findUnique({
        where: { id },
        select: { id: true, planType: true },
      });

      if (!company) {
        return c.json({ error: "Company not found" }, 404);
      }

      // Validate storage mode against plan type
      if (
        data.storageMode === "HISTORICAL" &&
        company.planType !== "PREMIUM" &&
        company.planType !== "ENTERPRISE"
      ) {
        return c.json(
          {
            error:
              "Historical storage mode requires Premium or Enterprise plan",
          },
          400
        );
      }

      // Update privacy settings
      const updatedCompany = await prisma.company.update({
        where: { id },
        data: {
          ...data,
          consentDate: data.consentGiven ? new Date() : null,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          planType: true,
          storageMode: true,
          retentionDays: true,
          encryptData: true,
          autoDelete: true,
          consentGiven: true,
          consentDate: true,
        },
      });

      return c.json({ privacy: updatedCompany });
    } catch (error) {
      console.error(
        `Error updating privacy settings for company ${c.req.param("id")}:`,
        error
      );
      return c.json({ error: "Failed to update privacy settings" }, 500);
    }
  }
);

// Export all company data (admin only)
companyController.get("/:id/export", authorize([UserRole.ADMIN]), async (c) => {
  try {
    const id = c.req.param("id");

    // Get all company data
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
            lastLogin: true,
          },
        },
        servers: {
          include: {
            Queues: {
              include: {
                QueueMetrics: true,
              },
            },
          },
        },
        alerts: true,
        alertRules: true,
      },
    });

    if (!company) {
      return c.json({ error: "Company not found" }, 404);
    }

    // Prepare export data
    const exportData = {
      company: {
        id: company.id,
        name: company.name,
        planType: company.planType,
        createdAt: company.createdAt,
      },
      users: company.users,
      servers: company.servers,
      alerts: company.alerts,
      alertRules: company.alertRules,
      exportedAt: new Date().toISOString(),
      exportedBy: c.get("user").id,
    };

    // Set headers for file download
    c.header("Content-Type", "application/json");
    c.header(
      "Content-Disposition",
      `attachment; filename="company-${company.name}-export-${
        new Date().toISOString().split("T")[0]
      }.json"`
    );

    return c.json(exportData);
  } catch (error) {
    console.error(
      `Error exporting data for company ${c.req.param("id")}:`,
      error
    );
    return c.json({ error: "Failed to export company data" }, 500);
  }
});

// Delete all company data (admin only)
companyController.delete(
  "/:id/data",
  authorize([UserRole.ADMIN]),
  async (c) => {
    try {
      const id = c.req.param("id");

      // Use a transaction to delete all related data
      await prisma.$transaction(async (tx) => {
        // Delete queue metrics first (due to foreign key constraints)
        await tx.queueMetric.deleteMany({
          where: {
            queue: {
              server: {
                companyId: id,
              },
            },
          },
        });

        // Delete queues
        await tx.queue.deleteMany({
          where: {
            server: {
              companyId: id,
            },
          },
        });

        // Delete alerts
        await tx.alert.deleteMany({
          where: { companyId: id },
        });

        // Delete alert rules
        await tx.alertRule.deleteMany({
          where: { companyId: id },
        });

        // Delete servers
        await tx.rabbitMQServer.deleteMany({
          where: { companyId: id },
        });

        // Clean up temporary cache for all users in the company
        const companyUsers = await tx.user.findMany({
          where: { companyId: id },
          select: { id: true },
        });

        // Delete cache entries for all company users
        for (const user of companyUsers) {
          await tx.$executeRaw`
            DELETE FROM temp_cache 
            WHERE key LIKE ${`%${user.id}%`}
          `;
        }
      });

      return c.json({
        message: "All company data has been permanently deleted",
        deletedAt: new Date().toISOString(),
        deletedBy: c.get("user").id,
      });
    } catch (error) {
      console.error(
        `Error deleting data for company ${c.req.param("id")}:`,
        error
      );
      return c.json({ error: "Failed to delete company data" }, 500);
    }
  }
);

export default companyController;
