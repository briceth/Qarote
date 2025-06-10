import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
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

    // Only allow admins or company admins to update company details
    if (
      user.role !== UserRole.ADMIN &&
      (user.companyId !== id || user.role !== UserRole.ADMIN)
    ) {
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

export default companyController;
