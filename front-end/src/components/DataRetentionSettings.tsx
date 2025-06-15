import { useState } from "react";
import {
  Database,
  Shield,
  Trash2,
  Download,
  Settings,
  Clock,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface DataRetentionSettings {
  storeMetrics: boolean;
  storeAlerts: boolean;
  storeLogs: boolean;
  retentionPeriod: number;
  encryptData: boolean;
  autoDelete: boolean;
  consentGiven: boolean;
}

interface DataRetentionSettingsProps {
  onSettingsChange?: (settings: DataRetentionSettings) => void;
}

export function DataRetentionSettings({
  onSettingsChange,
}: DataRetentionSettingsProps) {
  const [settings, setSettings] = useState({
    storeMetrics: false,
    storeAlerts: false,
    storeLogs: false,
    retentionPeriod: 7, // days
    encryptData: true,
    autoDelete: true,
    consentGiven: false,
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSettingChange = (
    key: keyof DataRetentionSettings,
    value: boolean | number
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);

    // Show confirmation when enabling storage for the first time
    if (
      (key === "storeMetrics" ||
        key === "storeAlerts" ||
        key === "storeLogs") &&
      value &&
      !settings.consentGiven
    ) {
      setShowConfirmation(true);
    }
  };

  const handleConsentGiven = () => {
    setSettings((prev) => ({ ...prev, consentGiven: true }));
    setShowConfirmation(false);
  };

  const isAnyStorageEnabled =
    settings.storeMetrics || settings.storeAlerts || settings.storeLogs;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Storage Preferences
          </CardTitle>
          <CardDescription>
            Control what data we store and for how long. By default, all
            operations are performed in real-time without storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Data Types</Label>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">Historical Metrics</Label>
                    <Badge variant="outline" className="text-xs">
                      Premium
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Store queue metrics, throughput data, and performance
                    history
                  </p>
                </div>
                <Switch
                  checked={settings.storeMetrics}
                  onCheckedChange={(checked) =>
                    handleSettingChange("storeMetrics", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">Alert History</Label>
                    <Badge variant="outline" className="text-xs">
                      Premium
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Keep a history of alerts and system notifications
                  </p>
                </div>
                <Switch
                  checked={settings.storeAlerts}
                  onCheckedChange={(checked) =>
                    handleSettingChange("storeAlerts", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">Activity Logs</Label>
                    <Badge variant="outline" className="text-xs">
                      Premium
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Store logs of user actions and system events
                  </p>
                </div>
                <Switch
                  checked={settings.storeLogs}
                  onCheckedChange={(checked) =>
                    handleSettingChange("storeLogs", checked)
                  }
                />
              </div>
            </div>
          </div>

          {/* Retention Settings - Only show if storage is enabled */}
          {isAnyStorageEnabled && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Retention Settings
                </Label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="retention"
                      className="flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Retention Period
                    </Label>
                    <Select
                      value={settings.retentionPeriod.toString()}
                      onValueChange={(value) =>
                        handleSettingChange("retentionPeriod", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Encryption
                    </Label>
                    <div className="flex items-center space-x-2 p-2 border rounded">
                      <Switch
                        checked={settings.encryptData}
                        onCheckedChange={(checked) =>
                          handleSettingChange("encryptData", checked)
                        }
                        disabled // Always enabled for security
                      />
                      <span className="text-sm text-gray-600">
                        Always enabled
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="space-y-1">
                    <Label className="font-medium text-green-900">
                      Auto-Delete
                    </Label>
                    <p className="text-sm text-green-700">
                      Automatically delete data after retention period expires
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoDelete}
                    onCheckedChange={(checked) =>
                      handleSettingChange("autoDelete", checked)
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* Warning when storage is enabled */}
          {isAnyStorageEnabled && !settings.consentGiven && (
            <Alert className="border-amber-200 bg-amber-50">
              <Shield className="w-4 h-4" />
              <AlertDescription className="text-amber-800">
                ⚠️ By enabling data storage, some information will be stored
                securely on our servers. All data is encrypted and you can
                delete it anytime. You'll need to provide explicit consent.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete All Data
              </Button>
            </div>

            {isAnyStorageEnabled && !settings.consentGiven && (
              <Button onClick={handleConsentGiven} className="gap-2">
                <Shield className="w-4 h-4" />
                Give Consent
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" />
            Current Privacy Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Storage Mode:</span>
              <Badge variant={isAnyStorageEnabled ? "default" : "secondary"}>
                {isAnyStorageEnabled ? "Data Storage Enabled" : "Read Only"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Encryption:</span>
              <Badge variant="secondary" className="text-green-600">
                AES-256 Enabled
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Auto-Delete:</span>
              <Badge
                variant={settings.autoDelete ? "secondary" : "destructive"}
              >
                {settings.autoDelete ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            {isAnyStorageEnabled && (
              <div className="flex justify-between">
                <span className="text-sm">Retention:</span>
                <Badge variant="outline">{settings.retentionPeriod} days</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consent Confirmation Modal/Alert */}
      {showConfirmation && (
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium text-blue-900">
                Data Storage Consent Required
              </p>
              <p className="text-sm text-blue-700">
                You're about to enable data storage. Please confirm that you
                understand:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Data will be encrypted and stored securely</li>
                <li>• You can export or delete your data anytime</li>
                <li>• Data will be auto-deleted after the retention period</li>
                <li>• You can revoke consent and disable storage anytime</li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleConsentGiven}>
                  I Understand & Consent
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowConfirmation(false);
                    setSettings((prev) => ({
                      ...prev,
                      storeMetrics: false,
                      storeAlerts: false,
                      storeLogs: false,
                    }));
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
