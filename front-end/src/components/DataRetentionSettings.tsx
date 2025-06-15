import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  StorageSettings,
  RetentionSettings,
  PrivacyStatus,
  DataActions,
  ConsentDialog,
  CompanyPrivacySettings,
} from "./privacy";

interface DataRetentionSettingsProps {
  onSettingsChange?: (settings: CompanyPrivacySettings) => void;
}

export function DataRetentionSettings({
  onSettingsChange,
}: DataRetentionSettingsProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<CompanyPrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const companyId = user?.companyId;

  // Load company privacy settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      // Don't make API calls if auth is still loading or user is not authenticated
      if (authLoading || !isAuthenticated || !companyId) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.getCompanyPrivacySettings(companyId);
        setSettings(response.privacy as CompanyPrivacySettings);
      } catch (error) {
        console.error("Failed to load privacy settings:", error);
        toast({
          title: "Error",
          description: "Failed to load privacy settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [companyId, toast, authLoading, isAuthenticated]);

  const handleSettingsChange = async (newSettings: CompanyPrivacySettings) => {
    if (!isAuthenticated || !isAdmin || !companyId) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can modify privacy settings",
        variant: "destructive",
      });
      return;
    }

    setSettings(newSettings);

    try {
      setSaving(true);
      // Note: encryptData is read-only for users, but we still send the current value to the API
      const response = await apiClient.updateCompanyPrivacySettings(companyId, {
        storageMode: newSettings.storageMode,
        retentionDays: newSettings.retentionDays,
        encryptData: newSettings.encryptData,
        autoDelete: newSettings.autoDelete,
        consentGiven: newSettings.consentGiven,
      });

      setSettings(response.privacy as CompanyPrivacySettings);
      onSettingsChange?.(response.privacy as CompanyPrivacySettings);

      toast({
        title: "Settings Updated",
        description: "Privacy settings have been saved successfully",
      });
    } catch (error) {
      console.error("Failed to update privacy settings:", error);
      toast({
        title: "Error",
        description: "Failed to update privacy settings",
        variant: "destructive",
      });
      // Revert changes on error
      if (settings) {
        setSettings(settings);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Unable to load privacy settings. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <StorageSettings
        settings={settings}
        onSettingsChange={handleSettingsChange}
        isAdmin={isAdmin}
        isLoading={saving}
      />

      <RetentionSettings
        settings={settings}
        onSettingsChange={handleSettingsChange}
        isAdmin={isAdmin}
        isLoading={saving}
      />

      <ConsentDialog
        settings={settings}
        onSettingsChange={handleSettingsChange}
        isAdmin={isAdmin}
        isLoading={saving}
      />

      <PrivacyStatus settings={settings} />

      {isAdmin && companyId && (
        <DataActions
          settings={settings}
          isAdmin={isAdmin}
          companyId={companyId}
        />
      )}

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving privacy settings...
        </div>
      )}
    </div>
  );
}
