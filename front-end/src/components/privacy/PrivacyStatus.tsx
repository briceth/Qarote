import { Settings, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyPrivacySettings } from "./types";

interface PrivacyStatusProps {
  settings: CompanyPrivacySettings;
}

export function PrivacyStatus({ settings }: PrivacyStatusProps) {
  const getStorageModeLabel = (mode: string) => {
    switch (mode) {
      case "MEMORY_ONLY":
        return "Real-time Only";
      case "TEMPORARY":
        return "Temporary Storage";
      case "HISTORICAL":
        return "Historical Storage";
      default:
        return mode;
    }
  };

  const getStorageModeVariant = (mode: string) => {
    switch (mode) {
      case "MEMORY_ONLY":
        return "secondary" as const;
      case "TEMPORARY":
        return "outline" as const;
      case "HISTORICAL":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  const getConsentStatus = () => {
    if (settings.storageMode === "MEMORY_ONLY") {
      return { label: "Not Required", variant: "secondary" as const };
    }
    return settings.consentGiven
      ? { label: "Given", variant: "default" as const }
      : { label: "Required", variant: "destructive" as const };
  };

  const consentStatus = getConsentStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5" />
          Current Privacy Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Storage Mode:</span>
            <Badge variant={getStorageModeVariant(settings.storageMode)}>
              {getStorageModeLabel(settings.storageMode)}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Data Encryption:</span>
            <Badge variant={settings.encryptData ? "default" : "destructive"}>
              {settings.encryptData ? "AES-256 Enabled" : "Disabled"}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Auto-Delete:</span>
            <Badge variant={settings.autoDelete ? "default" : "outline"}>
              {settings.autoDelete ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          {settings.storageMode !== "MEMORY_ONLY" && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Retention Period:</span>
              <Badge variant="outline">
                {settings.retentionDays}{" "}
                {settings.retentionDays === 1 ? "day" : "days"}
              </Badge>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Consent Status:</span>
            <Badge variant={consentStatus.variant}>{consentStatus.label}</Badge>
          </div>

          {settings.consentDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Consent Date:</span>
              <span className="text-sm text-gray-600">
                {new Date(settings.consentDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {!settings.consentGiven && settings.storageMode !== "MEMORY_ONLY" && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Consent Required</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Data storage is enabled but consent has not been given. Please
              review and accept the privacy terms.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
