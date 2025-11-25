import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alertDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ApiError } from "@/lib/api/types";
import {
  Loader2,
  Mail,
  BellOff,
  Webhook,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useAlertNotificationSettings,
  useUpdateAlertNotificationSettings,
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
} from "@/hooks/useApi";

interface AlertNotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertNotificationSettingsModal({
  isOpen,
  onClose,
}: AlertNotificationSettingsModalProps) {
  const { workspace, isLoading: isWorkspaceLoading } = useWorkspace();
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState(true);
  const [contactEmail, setContactEmail] = useState<string>("");
  const [notificationSeverities, setNotificationSeverities] = useState<
    string[]
  >(["critical", "warning", "info"]);

  // Query for current settings
  const { data: settingsData } = useAlertNotificationSettings(isOpen);

  // Update form data when settings load
  useEffect(() => {
    if (settingsData?.settings) {
      setEmailNotificationsEnabled(
        settingsData.settings.emailNotificationsEnabled
      );
      setContactEmail(settingsData.settings.contactEmail || "");
      setNotificationSeverities(
        settingsData.settings.notificationSeverities || [
          "critical",
          "warning",
          "info",
        ]
      );
    }
  }, [settingsData]);

  // Show loading state only if workspace is loading (settings will use placeholder data for instant display)
  const isLoading = isWorkspaceLoading || !workspace?.id;

  // Mutation for updating settings
  const updateSettingsMutation = useUpdateAlertNotificationSettings();

  // Webhook hooks (must be called before any early returns)
  const { data: webhooksData } = useWebhooks(isOpen);
  const createWebhookMutation = useCreateWebhook();
  const updateWebhookMutation = useUpdateWebhook();
  const deleteWebhookMutation = useDeleteWebhook();

  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<string | null>(null);
  const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [showSecret, setShowSecret] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email if notifications are enabled
    if (emailNotificationsEnabled && !contactEmail.trim()) {
      toast.error("Please provide an email address for notifications");
      return;
    }

    if (
      emailNotificationsEnabled &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
    ) {
      toast.error("Please provide a valid email address");
      return;
    }

    // Validate at least one severity is selected
    if (emailNotificationsEnabled && notificationSeverities.length === 0) {
      toast.error("Please select at least one alert severity");
      return;
    }

    updateSettingsMutation.mutate(
      {
        emailNotificationsEnabled,
        contactEmail: emailNotificationsEnabled ? contactEmail : null,
        notificationSeverities: emailNotificationsEnabled
          ? notificationSeverities
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Alert notification settings updated successfully");
          onClose();
        },
        onError: (error: ApiError) => {
          toast.error(error.message || "Failed to update settings");
        },
      }
    );
  };

  // Show modal immediately, but show loading state only if workspace is loading
  // Settings will use placeholder data for instant display
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alert Notification Settings</DialogTitle>
            <DialogDescription>Loading workspace...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const webhooks = webhooksData?.webhooks || [];

  const handleAddWebhook = () => {
    if (!webhookUrl.trim()) {
      toast.error("Please provide a webhook URL");
      return;
    }

    try {
      new URL(webhookUrl);
    } catch {
      toast.error("Please provide a valid webhook URL");
      return;
    }

    createWebhookMutation.mutate(
      {
        url: webhookUrl.trim(),
        enabled: webhookEnabled,
        secret: webhookSecret.trim() || null,
        version: "v1",
      },
      {
        onSuccess: () => {
          toast.success("Webhook created successfully");
          setShowAddWebhook(false);
          setWebhookUrl("");
          setWebhookSecret("");
          setWebhookEnabled(true);
        },
        onError: (error: ApiError) => {
          toast.error(error.message || "Failed to create webhook");
        },
      }
    );
  };

  const handleUpdateWebhook = (webhookId: string) => {
    if (!webhookUrl.trim()) {
      toast.error("Please provide a webhook URL");
      return;
    }

    try {
      new URL(webhookUrl);
    } catch {
      toast.error("Please provide a valid webhook URL");
      return;
    }

    updateWebhookMutation.mutate(
      {
        webhookId,
        data: {
          url: webhookUrl.trim(),
          enabled: webhookEnabled,
          secret: webhookSecret.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Webhook updated successfully");
          setEditingWebhook(null);
          setWebhookUrl("");
          setWebhookSecret("");
          setWebhookEnabled(true);
        },
        onError: (error: ApiError) => {
          toast.error(error.message || "Failed to update webhook");
        },
      }
    );
  };

  const handleDeleteWebhook = (webhookId: string) => {
    setWebhookToDelete(webhookId);
  };

  const confirmDeleteWebhook = () => {
    if (!webhookToDelete) return;

    deleteWebhookMutation.mutate(webhookToDelete, {
      onSuccess: () => {
        toast.success("Webhook deleted successfully");
        setWebhookToDelete(null);
      },
      onError: (error: ApiError) => {
        toast.error(error.message || "Failed to delete webhook");
        setWebhookToDelete(null);
      },
    });
  };

  const handleToggleWebhook = (webhookId: string, enabled: boolean) => {
    updateWebhookMutation.mutate(
      {
        webhookId,
        data: { enabled },
      },
      {
        onSuccess: () => {
          toast.success(`Webhook ${enabled ? "enabled" : "disabled"}`);
        },
        onError: (error: ApiError) => {
          toast.error(error.message || "Failed to update webhook");
        },
      }
    );
  };

  const startEditWebhook = (webhook: (typeof webhooks)[0]) => {
    setEditingWebhook(webhook.id);
    setWebhookUrl(webhook.url);
    setWebhookSecret(webhook.secret || "");
    setWebhookEnabled(webhook.enabled);
    setShowSecret(false);
  };

  const cancelEdit = () => {
    setEditingWebhook(null);
    setShowAddWebhook(false);
    setWebhookUrl("");
    setWebhookSecret("");
    setWebhookEnabled(true);
    setShowSecret(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Alert Notification Settings
          </DialogTitle>
          <DialogDescription>
            Configure email and webhook notifications for new alerts. Select
            which alert severities you want to receive notifications for.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive email alerts for new alerts based on your severity
                preferences
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotificationsEnabled}
              onCheckedChange={setEmailNotificationsEnabled}
              disabled={updateSettingsMutation.isPending}
              className="data-[state=checked]:bg-gradient-button"
            />
          </div>

          {/* Alert Severity Selection */}
          {emailNotificationsEnabled && (
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base">Alert Severities</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select which alert severities you want to receive email
                notifications for
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="severity-critical"
                    checked={notificationSeverities.includes("critical")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNotificationSeverities([
                          ...notificationSeverities,
                          "critical",
                        ]);
                      } else {
                        setNotificationSeverities(
                          notificationSeverities.filter((s) => s !== "critical")
                        );
                      }
                    }}
                    disabled={updateSettingsMutation.isPending}
                    className="data-[state=checked]:bg-gradient-button data-[state=checked]:border-gradient-button"
                  />
                  <Label
                    htmlFor="severity-critical"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-red-600 font-medium">Critical</span>
                    <span className="text-xs text-muted-foreground">
                      - Immediate action required
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="severity-warning"
                    checked={notificationSeverities.includes("warning")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNotificationSeverities([
                          ...notificationSeverities,
                          "warning",
                        ]);
                      } else {
                        setNotificationSeverities(
                          notificationSeverities.filter((s) => s !== "warning")
                        );
                      }
                    }}
                    disabled={updateSettingsMutation.isPending}
                    className="data-[state=checked]:bg-gradient-button data-[state=checked]:border-gradient-button"
                  />
                  <Label
                    htmlFor="severity-warning"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-yellow-600 font-medium">Warning</span>
                    <span className="text-xs text-muted-foreground">
                      - Attention recommended
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="severity-info"
                    checked={notificationSeverities.includes("info")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNotificationSeverities([
                          ...notificationSeverities,
                          "info",
                        ]);
                      } else {
                        setNotificationSeverities(
                          notificationSeverities.filter((s) => s !== "info")
                        );
                      }
                    }}
                    disabled={updateSettingsMutation.isPending}
                    className="data-[state=checked]:bg-gradient-button data-[state=checked]:border-gradient-button"
                  />
                  <Label
                    htmlFor="severity-info"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-blue-600 font-medium">Info</span>
                    <span className="text-xs text-muted-foreground">
                      - Informational alerts
                    </span>
                  </Label>
                </div>
              </div>
              {notificationSeverities.length === 0 && (
                <p className="text-xs text-red-500 mt-2">
                  Please select at least one alert severity
                </p>
              )}
            </div>
          )}

          {/* Contact Email Input */}
          {emailNotificationsEnabled && (
            <div className="space-y-2">
              <Label htmlFor="contact-email">
                Notification Email Address
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="your-email@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={updateSettingsMutation.isPending}
                required={emailNotificationsEnabled}
              />
              <p className="text-xs text-muted-foreground">
                This email will receive notifications for new alerts
              </p>
            </div>
          )}

          {/* Info Alert */}
          {!emailNotificationsEnabled && (
            <Alert>
              <BellOff className="h-4 w-4" />
              <AlertDescription>
                Email notifications are disabled. You won't receive alerts via
                email, but you can still view them in the dashboard.
              </AlertDescription>
            </Alert>
          )}

          {/* Webhooks Section */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                <Label className="text-base">Webhook Notifications</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddWebhook(true);
                  setEditingWebhook(null);
                  setWebhookUrl("");
                  setWebhookSecret("");
                  setWebhookEnabled(true);
                  setShowSecret(false);
                }}
                disabled={
                  showAddWebhook ||
                  editingWebhook !== null ||
                  createWebhookMutation.isPending
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure webhook endpoints to receive alert notifications via
              POST requests.
            </p>

            {/* Add/Edit Webhook Form */}
            {(showAddWebhook || editingWebhook) && (
              <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">
                    Webhook URL
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://your-endpoint.com/webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    disabled={
                      createWebhookMutation.isPending ||
                      updateWebhookMutation.isPending
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-secret">Secret (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="webhook-secret"
                      type={showSecret ? "text" : "password"}
                      placeholder="Secret for HMAC signature"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      disabled={
                        createWebhookMutation.isPending ||
                        updateWebhookMutation.isPending
                      }
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowSecret(!showSecret)}
                      disabled={
                        createWebhookMutation.isPending ||
                        updateWebhookMutation.isPending
                      }
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional secret key for webhook signature verification
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="webhook-enabled"
                      checked={webhookEnabled}
                      onCheckedChange={setWebhookEnabled}
                      disabled={
                        createWebhookMutation.isPending ||
                        updateWebhookMutation.isPending
                      }
                      className="data-[state=checked]:bg-gradient-button"
                    />
                    <Label htmlFor="webhook-enabled">Enabled</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                      disabled={
                        createWebhookMutation.isPending ||
                        updateWebhookMutation.isPending
                      }
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (editingWebhook) {
                          handleUpdateWebhook(editingWebhook);
                        } else {
                          handleAddWebhook();
                        }
                      }}
                      disabled={
                        createWebhookMutation.isPending ||
                        updateWebhookMutation.isPending
                      }
                      className="bg-gradient-button hover:bg-gradient-button-hover text-white"
                    >
                      {createWebhookMutation.isPending ||
                      updateWebhookMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingWebhook ? "Updating..." : "Creating..."}
                        </>
                      ) : editingWebhook ? (
                        "Update"
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Webhooks List */}
            <div className="space-y-2">
              {webhooks.length === 0 && !showAddWebhook && (
                <div className="p-4 border rounded-lg text-center text-sm text-muted-foreground">
                  No webhooks configured. Click "Add Webhook" to create one.
                </div>
              )}
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {webhook.url}
                      </p>
                      {webhook.enabled ? (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                          Enabled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">
                          Disabled
                        </span>
                      )}
                      {webhook.secret && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          Secured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Version: {webhook.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={(enabled) =>
                        handleToggleWebhook(webhook.id, enabled)
                      }
                      disabled={updateWebhookMutation.isPending}
                      className="data-[state=checked]:bg-gradient-button"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditWebhook(webhook)}
                      disabled={
                        editingWebhook !== null ||
                        updateWebhookMutation.isPending
                      }
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      disabled={deleteWebhookMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateSettingsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="bg-gradient-button hover:bg-gradient-button-hover text-white"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Delete Webhook Confirmation Dialog */}
      <AlertDialog
        open={webhookToDelete !== null}
        onOpenChange={(open) => !open && setWebhookToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Webhook
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook?
              {webhookToDelete && (
                <span className="block mt-2 font-mono text-sm bg-muted p-2 rounded">
                  {webhooks.find((w) => w.id === webhookToDelete)?.url}
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteWebhook}
              disabled={deleteWebhookMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteWebhookMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
