import { RabbitMQAlert } from "@/services/alerts/alert.interfaces";

export interface WebhookPayload {
  version: string;
  event: "alert.notification";
  timestamp: string;
  workspace: {
    id: string;
    name: string;
  };
  server: {
    id: string;
    name: string;
  };
  alerts: RabbitMQAlert[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  retries?: number;
}
