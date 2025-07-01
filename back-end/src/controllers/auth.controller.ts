import { Hono } from "hono";
import {
  registrationRoutes,
  sessionRoutes,
  verificationRoutes,
  passwordRoutes,
  invitationRoutes,
} from "./auth";

const authController = new Hono();

authController.route("/", registrationRoutes);
authController.route("/", sessionRoutes);
authController.route("/", verificationRoutes);
authController.route("/", passwordRoutes);
authController.route("/invitation", invitationRoutes);

export default authController;
