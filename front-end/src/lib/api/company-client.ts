/**
 * Company API Client
 * Handles company privacy settings and data management
 */

import { BaseApiClient } from "./base-client";

export interface CompanyPrivacySettings {
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

export class CompanyApiClient extends BaseApiClient {
  async getCompanyPrivacySettings(companyId: string): Promise<{
    privacy: CompanyPrivacySettings;
  }> {
    return this.request(`/companies/${companyId}/privacy`);
  }

  async updateCompanyPrivacySettings(
    companyId: string,
    settings: UpdatePrivacySettingsRequest
  ): Promise<{
    privacy: CompanyPrivacySettings;
  }> {
    return this.request(`/companies/${companyId}/privacy`, {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  async exportCompanyData(companyId: string): Promise<Blob> {
    return this.requestBlob(`/companies/${companyId}/export`, {
      method: "GET",
    });
  }

  async deleteCompanyData(companyId: string): Promise<{
    message: string;
    deletedAt: string;
    deletedBy: string;
  }> {
    return this.request(`/companies/${companyId}/data`, {
      method: "DELETE",
    });
  }
}
