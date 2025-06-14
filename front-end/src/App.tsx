import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ServerProvider } from "@/contexts/ServerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PageLoader } from "@/components/PageLoader";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const Queues = lazy(() => import("./pages/Queues"));
const QueueDetail = lazy(() => import("./pages/QueueDetail"));
const Connections = lazy(() => import("./pages/Connections"));
const Exchanges = lazy(() => import("./pages/Exchanges"));
const Channels = lazy(() => import("./pages/Channels"));
const Alerts = lazy(() => import("./pages/Alerts"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ServerProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public authentication routes */}
                <Route path="/auth/sign-in" element={<SignIn />} />
                <Route path="/auth/sign-up" element={<SignUp />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/queues"
                  element={
                    <ProtectedRoute>
                      <Queues />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/queues/:queueName"
                  element={
                    <ProtectedRoute>
                      <QueueDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connections"
                  element={
                    <ProtectedRoute>
                      <Connections />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exchanges"
                  element={
                    <ProtectedRoute>
                      <Exchanges />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/channels"
                  element={
                    <ProtectedRoute>
                      <Channels />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <Alerts />
                    </ProtectedRoute>
                  }
                />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ServerProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
