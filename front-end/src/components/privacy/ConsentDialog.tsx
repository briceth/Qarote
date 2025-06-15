import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PrivacySettingsProps } from "./types";

export function ConsentDialog({
  settings,
  onSettingsChange,
  isAdmin,
}: PrivacySettingsProps) {
  const isStorageEnabled = settings.storageMode !== "MEMORY_ONLY";

  const handleConsentChange = (consentGiven: boolean) => {
    onSettingsChange({ ...settings, consentGiven });
  };

  if (!isStorageEnabled) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Shield className="w-5 h-5" />
          Data Storage Consent
        </CardTitle>
        <CardDescription className="text-blue-700">
          Your consent is required to store data according to your privacy
          settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm text-blue-800">
          <p className="font-medium">
            By providing consent, you acknowledge that:
          </p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>
              Data will be encrypted using industry-standard AES-256 encryption
            </li>
            <li>
              Data will be automatically deleted after the specified retention
              period
            </li>
            <li>You can export or delete your data at any time</li>
            <li>You can revoke consent and return to real-time mode anytime</li>
            <li>
              Data is used only for your dashboard functionality, never shared
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-between p-4 bg-white border border-blue-200 rounded-lg">
          <div className="space-y-1">
            <Label className="font-medium text-blue-900">
              I consent to data storage
            </Label>
            <p className="text-sm text-blue-700">
              Enable storage according to the settings above
              {settings.consentDate && (
                <span className="block text-xs mt-1">
                  Last updated:{" "}
                  {new Date(settings.consentDate).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
          <Switch
            checked={settings.consentGiven}
            onCheckedChange={handleConsentChange}
            disabled={!isAdmin}
          />
        </div>

        {!settings.consentGiven && isStorageEnabled && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
            ⚠️{" "}
            <strong>Storage is enabled but consent has not been given.</strong>
            No data will be stored until consent is provided.
          </div>
        )}

        {!isAdmin && (
          <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
            🔒 Only administrators can modify consent settings for your company.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
