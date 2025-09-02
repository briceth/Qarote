import { Hono } from "hono";
import { authenticate } from "@/core/auth";
import { planValidationMiddleware } from "@/middlewares/plan-validation";
import overviewController from "./rabbitmq/overview.controller";
import queuesController from "./rabbitmq/queues.controller";
import messagesController from "./rabbitmq/messages.controller";
import metricsController from "./rabbitmq/metrics.controller";
import infrastructureController from "./rabbitmq/infrastructure.controller";
import memoryController from "./rabbitmq/memory.controller";
import adminController from "./rabbitmq/admin.controller";
import vhostController from "./rabbitmq/vhost.controller";
import usersController from "./rabbitmq/users.controller";
import alertsController from "./rabbitmq/alerts.controller";

const rabbitmqController = new Hono();

// All RabbitMQ routes require authentication
rabbitmqController.use("*", authenticate);
adminController.use("*", planValidationMiddleware());

// Mount all the sub-controllers with workspace-scoped routes
rabbitmqController.route("/workspaces/:workspaceId", overviewController);
rabbitmqController.route("/workspaces/:workspaceId", queuesController);
rabbitmqController.route("/workspaces/:workspaceId", messagesController);
rabbitmqController.route("/workspaces/:workspaceId", metricsController);
rabbitmqController.route("/workspaces/:workspaceId", infrastructureController);
rabbitmqController.route("/workspaces/:workspaceId", memoryController);
rabbitmqController.route("/workspaces/:workspaceId", adminController);
rabbitmqController.route("/workspaces/:workspaceId", vhostController);
rabbitmqController.route("/workspaces/:workspaceId", usersController);
rabbitmqController.route("/workspaces/:workspaceId", alertsController);

export default rabbitmqController;
