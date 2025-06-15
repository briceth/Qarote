import { Clock, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrivacySettingsProps } from "./types";

export function RetentionSettings({
  settings,
  onSettingsChange,
  isAdmin,
}: PrivacySettingsProps) {
  const isStorageEnabled = settings.storageMode !== "MEMORY_ONLY";

  const handleRetentionChange = (retentionDays: number) => {
    onSettingsChange({ ...settings, retentionDays });
  };

  const handleAutoDeleteChange = (autoDelete: boolean) => {
    onSettingsChange({ ...settings, autoDelete });
  };

  if (!isStorageEnabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Data Retention Settings
        </CardTitle>
        <CardDescription>
          Configure how long data is kept and security settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="retention" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Retention Period
            </Label>
            <Select
              value={settings.retentionDays.toString()}
              onValueChange={(value) => handleRetentionChange(parseInt(value))}
              disabled={!isAdmin}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Data Encryption
            </Label>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-green-50">
              <Lock className="w-4 h-4 text-green-600" />
              <div className="flex-1">
                <span className="text-sm text-green-700 font-medium">
                  AES-256 Encryption
                </span>
                <p className="text-xs text-green-600">
                  All data is automatically encrypted at rest
                </p>
              </div>
              <div className="text-green-600 text-sm font-medium">
                ✓ Enabled
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="space-y-1">
              <Label className="font-medium text-blue-900">
                Automatic Data Deletion
              </Label>
              <p className="text-sm text-blue-700">
                Automatically delete data after the retention period expires
              </p>
            </div>
            <Switch
              checked={settings.autoDelete}
              onCheckedChange={handleAutoDeleteChange}
              disabled={!isAdmin}
            />
          </div>
        </div>

        {!isAdmin && (
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            💡 Only administrators can modify retention settings for your
            company.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
