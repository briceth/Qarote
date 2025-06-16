/**
 * Routing Visualization Page
 * Interactive diagrams showing real-time message flows across exchanges
 */

import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ComingSoonPage from "@/components/ComingSoonPage";
import { RoutingVisualization } from "@/components/routing-visualization";
import { isRoutingEnabled } from "@/lib/routing-feature-flag";

const RoutingPage: React.FC = () => {
  // Check if routing feature is enabled
  const routingEnabled = isRoutingEnabled();

  // If routing is not enabled, show coming soon page
  if (!routingEnabled) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1">
          <header className="border-b">
            <div className="flex h-16 items-center px-4">
              <SidebarTrigger />
            </div>
          </header>
          <ComingSoonPage
            title="Routing Visualization"
            description="Interactive diagrams showing real-time message flows across direct, topic, headers, and fanout exchanges. Visualize complex routing patterns and debug message flows with ease."
            showBackButton={true}
          />
        </main>
      </SidebarProvider>
    );
  }

  return <RoutingVisualization />;
};

export default RoutingPage;
