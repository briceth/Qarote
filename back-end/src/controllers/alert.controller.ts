import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import prisma from "../core/prisma";
import { CreateAlertSchema, UpdateAlertSchema } from "../schemas/alerts";

const alertController = new Hono();

// Get all alerts
alertController.get("/", async (c) => {
  const status = c.req.query("status");
  const severity = c.req.query("severity");

  try {
    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (severity) {
      whereClause.severity = severity;
    }

    const alerts = await prisma.alert.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return c.json({ alerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return c.json({ error: "Failed to fetch alerts" }, 500);
  }
});

// Get a specific alert by ID
alertController.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      return c.json({ error: "Alert not found" }, 404);
    }

    return c.json({ alert });
  } catch (error) {
    console.error(`Error fetching alert ${id}:`, error);
    return c.json({ error: "Failed to fetch alert" }, 500);
  }
});

// Create a new alert
alertController.post("/", zValidator("json", CreateAlertSchema), async (c) => {
  const data = c.req.valid("json");

  try {
    const alert = await prisma.alert.create({
      data,
    });

    return c.json({ alert }, 201);
  } catch (error) {
    console.error("Error creating alert:", error);
    return c.json({ error: "Failed to create alert" }, 500);
  }
});

// Update an alert
alertController.put(
  "/:id",
  zValidator("json", UpdateAlertSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    try {
      // Check if alert exists
      const existingAlert = await prisma.alert.findUnique({
        where: { id },
      });

      if (!existingAlert) {
        return c.json({ error: "Alert not found" }, 404);
      }

      // If status is being changed to 'resolved', set resolvedAt
      if (data.status === "resolved" && existingAlert.status !== "resolved") {
        data.resolvedAt = new Date();
      }

      const alert = await prisma.alert.update({
        where: { id },
        data,
      });

      return c.json({ alert });
    } catch (error) {
      console.error(`Error updating alert ${id}:`, error);
      return c.json({ error: "Failed to update alert" }, 500);
    }
  }
);

// Delete an alert
alertController.delete("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    // Check if alert exists
    const existingAlert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!existingAlert) {
      return c.json({ error: "Alert not found" }, 404);
    }

    await prisma.alert.delete({
      where: { id },
    });

    return c.json({ message: "Alert deleted successfully" });
  } catch (error) {
    console.error(`Error deleting alert ${id}:`, error);
    return c.json({ error: "Failed to delete alert" }, 500);
  }
});

// Get recent alerts (last 24 hours)
alertController.get("/recent/day", async (c) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const alerts = await prisma.alert.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ alerts });
  } catch (error) {
    console.error("Error fetching recent alerts:", error);
    return c.json({ error: "Failed to fetch recent alerts" }, 500);
  }
});

export default alertController;
