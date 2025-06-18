import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  MessageSquare,
  BarChart3,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isSuperAdmin } from "@/lib/auth/superAdmin";
import {
  FeedbackStats,
  FeedbackList,
  FeedbackDetail,
} from "@/components/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(
    null
  );

  // Check if user is super admin (creator only)
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/sign-in");
      return;
    }

    if (!isSuperAdmin(user)) {
      navigate("/");
      return;
    }
  }, [user, isAuthenticated, navigate]);

  // Don't render anything if not super admin
  if (!user || !isSuperAdmin(user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                Access denied. Super admin privileges required.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex flex-1 items-center gap-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Super Admin</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-red-600" />
              <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            </div>
            <p className="text-gray-600">
              Creator dashboard - Manage feedback, view analytics, and
              administer the platform.
            </p>
          </div>

          {/* Super Admin Warning */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Super Admin Access:</strong> You have creator privileges
              as the application owner. Handle user data responsibly and in
              accordance with privacy policies.
            </AlertDescription>
          </Alert>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="feedback" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Feedback
              </TabsTrigger>
              <TabsTrigger
                value="detail"
                disabled={!selectedFeedbackId}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Detail
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <FeedbackStats />
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              <FeedbackList
                onSelectFeedback={(id) => {
                  setSelectedFeedbackId(id);
                }}
                selectedFeedbackId={selectedFeedbackId}
              />
            </TabsContent>

            <TabsContent value="detail" className="space-y-6">
              {selectedFeedbackId ? (
                <FeedbackDetail
                  feedbackId={selectedFeedbackId}
                  onClose={() => setSelectedFeedbackId(null)}
                />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">
                      Select a feedback item to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AdminDashboard;
