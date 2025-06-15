import React from "react";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { DataRetentionSettings } from "@/components/DataRetentionSettings";
import { AppSidebar } from "@/components/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function PrivacySettings() {
  const navigate = useNavigate();

  const handleSettingsChange = (settings: {
    storeMetrics: boolean;
    storeAlerts: boolean;
    storeLogs: boolean;
    retentionPeriod: number;
    encryptData: boolean;
    autoDelete: boolean;
    consentGiven: boolean;
  }) => {
    console.log("Privacy settings changed:", settings);
    // Here you would typically save the settings to your backend
    // await updatePrivacySettings(settings);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Privacy Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold">Privacy & Data Settings</h1>
              </div>
              <p className="text-gray-600">
                Control your data privacy and storage preferences
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          {/* Privacy Overview */}
          <PrivacyNotice variant="detailed" />

          {/* Data Retention Settings */}
          <DataRetentionSettings onSettingsChange={handleSettingsChange} />

          {/* Information Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  How We Protect Your Data
                </CardTitle>
                <CardDescription>
                  Security measures we implement to keep your information safe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">🔐 Encryption</h4>
                  <p className="text-sm text-gray-600">
                    All stored data is encrypted using AES-256 encryption, both
                    at rest and in transit.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    🗑️ Automatic Deletion
                  </h4>
                  <p className="text-sm text-gray-600">
                    Data is automatically deleted after your specified retention
                    period expires.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    🚫 No Third-Party Sharing
                  </h4>
                  <p className="text-sm text-gray-600">
                    We never share your RabbitMQ data with third parties or use
                    it for analytics.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">💾 Minimal Storage</h4>
                  <p className="text-sm text-gray-600">
                    By default, we operate in real-time mode with no persistent
                    data storage.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Rights</CardTitle>
                <CardDescription>
                  You have full control over your data and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">📥 Data Export</h4>
                  <p className="text-sm text-gray-600">
                    Export all your stored data in a standard format at any
                    time.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">🗂️ Data Portability</h4>
                  <p className="text-sm text-gray-600">
                    Take your data with you if you decide to switch services.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    🚮 Complete Deletion
                  </h4>
                  <p className="text-sm text-gray-600">
                    Request complete deletion of all your data with immediate
                    effect.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">⚡ Revoke Consent</h4>
                  <p className="text-sm text-gray-600">
                    Withdraw consent for data storage at any time and return to
                    real-time mode.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Questions about Privacy?
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    If you have any questions about our privacy practices or
                    need help with your data settings, please contact our
                    privacy team at{" "}
                    <a
                      href="mailto:privacy@rabbitmqdashboard.com"
                      className="underline"
                    >
                      privacy@rabbitmqdashboard.com
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
