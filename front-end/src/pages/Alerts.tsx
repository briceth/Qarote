import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { AlertTriangle, Loader2, Mail, Settings } from "lucide-react";

import { ActiveAlertsList } from "@/components/alerts/ActiveAlertsList";
import { AlertNotificationSettingsModal } from "@/components/alerts/AlertNotificationSettingsModal";
import { AlertRulesModal } from "@/components/alerts/AlertRulesModal";
import { AlertsSummary } from "@/components/alerts/AlertsSummary";
import { ResolvedAlertsList } from "@/components/alerts/ResolvedAlertsList";
import { AppSidebar } from "@/components/AppSidebar";
import { NoServerConfigured } from "@/components/NoServerConfigured";
import { PageLoader } from "@/components/PageLoader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useServerContext } from "@/contexts/ServerContext";

import {
  useAlertNotificationSettings,
  useRabbitMQAlerts,
  useResolvedAlerts,
} from "@/hooks/useApi";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { useUser } from "@/hooks/useUser";

import { AlertThresholds } from "@/types/alerts";

const Alerts = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedServerId, hasServers } = useServerContext();
  const { userPlan } = useUser();
  // const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] =
    useState(false);
  const [showAlertRulesModal, setShowAlertRulesModal] = useState(false);
  const [viewMode, setViewMode] = useState<"active" | "resolved">("active");

  const currentServerId = serverId || selectedServerId;

  // Check for query parameter to open notification settings modal
  useEffect(() => {
    const openNotificationSettings = searchParams.get(
      "openNotificationSettings"
    );
    if (openNotificationSettings === "true") {
      setShowNotificationSettingsModal(true);
      // Remove the query parameter from URL after opening modal
      searchParams.delete("openNotificationSettings");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Default thresholds for query
  const defaultThresholds: AlertThresholds = {
    memory: { warning: 80, critical: 95 },
    disk: { warning: 15, critical: 10 },
    fileDescriptors: { warning: 80, critical: 90 },
    queueMessages: { warning: 10000, critical: 50000 },
    connections: { warning: 500, critical: 1000 },
  };

  // Query for alerts with the RabbitMQ alerts hook
  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
  } = useRabbitMQAlerts(currentServerId, defaultThresholds);

  // Query for resolved alerts
  const {
    data: resolvedAlertsData,
    isLoading: resolvedAlertsLoading,
    error: resolvedAlertsError,
  } = useResolvedAlerts(currentServerId);

  // Get browser notification settings
  const { data: notificationSettings } = useAlertNotificationSettings(true);

  // Set up browser notifications
  useBrowserNotifications(alertsData?.alerts, {
    enabled: notificationSettings.settings.browserNotificationsEnabled,
    severities: notificationSettings.settings.browserNotificationSeverities,
  });

  if (!hasServers) {
    return (
      <SidebarProvider>
        <div className="page-layout">
          <AppSidebar />
          <main className="main-content-scrollable">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
            </div>
            <NoServerConfigured
              title="Alerts"
              description="Monitor system alerts and notifications"
            />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!currentServerId) {
    return <PageLoader />;
  }

  // Render main content
  const alerts = alertsData?.alerts || [];
  const summary = alertsData?.summary || {
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
  };

  if (alertsLoading && !alertsData) {
    return <PageLoader />;
  }

  if (alertsError) {
    return (
      <SidebarProvider>
        <div className="page-layout">
          <AppSidebar />
          <main className="main-content-scrollable">
            <div className="content-container-large">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="title-page">Alerts</h1>
                  <p className="text-gray-500">
                    Monitor system alerts and notifications
                  </p>
                </div>
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load alerts data. Please try again.
                </AlertDescription>
              </Alert>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="page-layout">
        <AppSidebar />
        <main className="main-content-scrollable">
          <div className="content-container-large">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="title-page">Alerts</h1>
                  <p className="text-gray-500">
                    Monitor system alerts and notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {alertsLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <Button
                  onClick={() => setShowAlertRulesModal(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Alert Rules
                </Button>
                <Button
                  onClick={() => setShowNotificationSettingsModal(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Notification Settings
                </Button>
              </div>
            </div>
            {/* Alerts Summary */}
            <AlertsSummary summary={summary} />

            {/* Alerts with Tabs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={viewMode}
                  onValueChange={(value) =>
                    setViewMode(value as "active" | "resolved")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="active">Active Alerts</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved Alerts</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                    <ActiveAlertsList
                      alerts={alerts}
                      summary={summary}
                      userPlan={userPlan}
                    />
                  </TabsContent>

                  <TabsContent value="resolved">
                    <ResolvedAlertsList
                      alerts={resolvedAlertsData?.alerts || []}
                      isLoading={resolvedAlertsLoading && !resolvedAlertsData}
                      error={resolvedAlertsError}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Notification Settings Modal */}
      <AlertNotificationSettingsModal
        isOpen={showNotificationSettingsModal}
        onClose={() => setShowNotificationSettingsModal(false)}
      />

      {/* Alert Rules Modal */}
      <AlertRulesModal
        isOpen={showAlertRulesModal}
        onClose={() => setShowAlertRulesModal(false)}
      />
    </SidebarProvider>
  );
};

export default Alerts;
