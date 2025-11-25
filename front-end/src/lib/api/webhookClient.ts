/**
 * Webhook API Client
 * Handles webhook management for alert notifications
 */

import { BaseApiClient } from "./baseClient";

interface Webhook {
  id: string;
  workspaceId: string;
  url: string;
  enabled: boolean;
  secret: string | null;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookRequest {
  url: string;
  enabled?: boolean;
  secret?: string | null;
  version?: string;
}

export interface UpdateWebhookRequest {
  url?: string;
  enabled?: boolean;
  secret?: string | null;
  version?: string;
}

export class WebhookApiClient extends BaseApiClient {
  async getWebhooks(workspaceId: string): Promise<{ webhooks: Webhook[] }> {
    return this.request(`/webhooks/v1/workspaces/${workspaceId}/webhooks`);
  }

  async getWebhook(
    workspaceId: string,
    webhookId: string
  ): Promise<{ webhook: Webhook }> {
    return this.request(
      `/webhooks/v1/workspaces/${workspaceId}/webhooks/${webhookId}`
    );
  }

  async createWebhook(
    workspaceId: string,
    data: CreateWebhookRequest
  ): Promise<{ webhook: Webhook }> {
    return this.request(`/webhooks/v1/workspaces/${workspaceId}/webhooks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWebhook(
    workspaceId: string,
    webhookId: string,
    data: UpdateWebhookRequest
  ): Promise<{ webhook: Webhook }> {
    return this.request(
      `/webhooks/v1/workspaces/${workspaceId}/webhooks/${webhookId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteWebhook(
    workspaceId: string,
    webhookId: string
  ): Promise<{ message: string }> {
    return this.request(
      `/webhooks/v1/workspaces/${workspaceId}/webhooks/${webhookId}`,
      {
        method: "DELETE",
      }
    );
  }
}
