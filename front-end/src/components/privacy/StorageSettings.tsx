import { Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrivacySettingsProps } from "./types";

export function StorageSettings({
  settings,
  onSettingsChange,
  isAdmin,
}: PrivacySettingsProps) {
  const handleStorageModeChange = (
    storageMode: "MEMORY_ONLY" | "TEMPORARY" | "HISTORICAL"
  ) => {
    onSettingsChange({ ...settings, storageMode });
  };

  const getStorageModeDescription = (mode: string) => {
    switch (mode) {
      case "MEMORY_ONLY":
        return "No data is stored permanently. All operations are real-time only.";
      case "TEMPORARY":
        return "Store data temporarily for enhanced performance. Auto-deleted.";
      case "HISTORICAL":
        return "Store data for historical analysis and reporting. Requires consent.";
      default:
        return "";
    }
  };

  const getStorageModeBadge = (mode: string) => {
    switch (mode) {
      case "MEMORY_ONLY":
        return <Badge variant="secondary">Free</Badge>;
      case "TEMPORARY":
        return <Badge variant="outline">Standard</Badge>;
      case "HISTORICAL":
        return <Badge variant="default">Premium</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Storage Mode
        </CardTitle>
        <CardDescription>
          Choose how your RabbitMQ data is handled and stored.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold">Storage Mode</Label>
          <Select
            value={settings.storageMode}
            onValueChange={handleStorageModeChange}
            disabled={!isAdmin}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select storage mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMORY_ONLY">
                <div className="flex items-center justify-between w-full">
                  <span>Memory Only</span>
                  <Badge variant="secondary" className="ml-2">
                    Free
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="TEMPORARY">
                <div className="flex items-center justify-between w-full">
                  <span>Temporary Storage</span>
                  <Badge variant="outline" className="ml-2">
                    Standard
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="HISTORICAL">
                <div className="flex items-center justify-between w-full">
                  <span>Historical Storage</span>
                  <Badge variant="default" className="ml-2">
                    Premium
                  </Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">
              {settings.storageMode.replace("_", " ")}
            </span>
            {getStorageModeBadge(settings.storageMode)}
          </div>
          <p className="text-sm text-gray-600">
            {getStorageModeDescription(settings.storageMode)}
          </p>
        </div>

        {!isAdmin && (
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            💡 Only administrators can modify storage settings for your company.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
