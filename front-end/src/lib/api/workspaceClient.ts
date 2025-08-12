/**
 * Workspace API Client
 * Handles Workspace privacy settings and data management
 */

import { BaseApiClient } from "./baseClient";

export interface Workspace {
  id: string;
  name: string;
  contactEmail: string;
  logoUrl?: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
  privacySettings: WorkspacePrivacySettings;
}

export interface WorkspacePrivacySettings {
  id: string;
  planType: string;
  storageMode: string;
  retentionDays: number;
  encryptData: boolean;
  autoDelete: boolean;
  consentGiven: boolean;
  consentDate?: string;
}

export interface UpdatePrivacySettingsRequest {
  storageMode: "MEMORY_ONLY" | "TEMPORARY" | "HISTORICAL";
  retentionDays: number;
  encryptData: boolean;
  autoDelete: boolean;
  consentGiven: boolean;
}

export class WorkspaceApiClient extends BaseApiClient {
  async getCurrentWorkspace(): Promise<{
    workspace: Workspace;
  }> {
    return this.request("/workspaces/current");
  }

  async getWorkspacePrivacySettings(WorkspaceId: string): Promise<{
    privacy: WorkspacePrivacySettings;
  }> {
    return this.request(`/workspaces/${WorkspaceId}/privacy`);
  }

  async updateWorkspacePrivacySettings(
    WorkspaceId: string,
    settings: UpdatePrivacySettingsRequest
  ): Promise<{
    privacy: WorkspacePrivacySettings;
  }> {
    return this.request(`/workspaces/${WorkspaceId}/privacy`, {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  async exportWorkspaceData(WorkspaceId: string): Promise<Blob> {
    return this.requestBlob(`/workspaces/${WorkspaceId}/export`, {
      method: "GET",
    });
  }

  async deleteWorkspaceData(WorkspaceId: string): Promise<{
    message: string;
    deletedAt: string;
    deletedBy: string;
  }> {
    return this.request(`/workspaces/${WorkspaceId}/data`, {
      method: "DELETE",
    });
  }

  async getCurrentWorkspaceMonthlyMessageCount(): Promise<{
    monthlyMessageCount: number;
    workspaceId: string;
    currentMonth: number;
    currentYear: number;
  }> {
    return this.request("/workspaces/current/monthly-message-count");
  }
}
