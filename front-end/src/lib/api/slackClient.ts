/**
 * Slack API Client
 * Handles Slack configuration management for alert notifications
 */

import { BaseApiClient } from "./baseClient";

interface SlackConfig {
  id: string;
  workspaceId: string;
  webhookUrl: string;
  customValue: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSlackConfigRequest {
  webhookUrl: string;
  customValue?: string | null;
  enabled?: boolean;
}

export interface UpdateSlackConfigRequest {
  webhookUrl?: string;
  customValue?: string | null;
  enabled?: boolean;
}

export class SlackApiClient extends BaseApiClient {
  async getSlackConfigs(
    workspaceId: string
  ): Promise<{ slackConfigs: SlackConfig[] }> {
    return this.request(`/slack/workspaces/${workspaceId}/slack-configs`);
  }

  async getSlackConfig(
    workspaceId: string,
    slackConfigId: string
  ): Promise<{ slackConfig: SlackConfig }> {
    return this.request(
      `/slack/workspaces/${workspaceId}/slack-configs/${slackConfigId}`
    );
  }

  async createSlackConfig(
    workspaceId: string,
    data: CreateSlackConfigRequest
  ): Promise<{ slackConfig: SlackConfig }> {
    return this.request(`/slack/workspaces/${workspaceId}/slack-configs`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSlackConfig(
    workspaceId: string,
    slackConfigId: string,
    data: UpdateSlackConfigRequest
  ): Promise<{ slackConfig: SlackConfig }> {
    return this.request(
      `/slack/workspaces/${workspaceId}/slack-configs/${slackConfigId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteSlackConfig(
    workspaceId: string,
    slackConfigId: string
  ): Promise<{ message: string }> {
    return this.request(
      `/slack/workspaces/${workspaceId}/slack-configs/${slackConfigId}`,
      {
        method: "DELETE",
      }
    );
  }
}
