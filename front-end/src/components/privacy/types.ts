export interface CompanyPrivacySettings {
  id: string;
  planType: string;
  storageMode: "MEMORY_ONLY" | "TEMPORARY" | "HISTORICAL";
  retentionDays: number;
  encryptData: boolean;
  autoDelete: boolean;
  consentGiven: boolean;
  consentDate?: string;
}

export interface PrivacySettingsProps {
  settings: CompanyPrivacySettings;
  onSettingsChange: (settings: CompanyPrivacySettings) => void;
  isAdmin: boolean;
  isLoading?: boolean;
}
