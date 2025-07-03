import { Hono } from "hono";
import coreRoutes from "./core.controller";
import privacyRoutes from "./privacy.controller";
import statsRoutes from "./stats.controller";
import dataRoutes from "./data.controller";
import planRoutes from "./plan.controller";

const workspaceRoutes = new Hono();

// Mount all workspace route modules
// IMPORTANT: Mount specific routes BEFORE the catch-all /:id route
// Plan routes must come before core routes because core has /:id catch-all
workspaceRoutes.route("/", planRoutes);
workspaceRoutes.route("/", privacyRoutes);
workspaceRoutes.route("/", statsRoutes);
workspaceRoutes.route("/", dataRoutes);
// Core routes last because it contains the catch-all /:id route
workspaceRoutes.route("/", coreRoutes);

export default workspaceRoutes;
