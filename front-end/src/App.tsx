import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ServerProvider } from "@/contexts/ServerContext";
import Index from "./pages/Index";
import Queues from "./pages/Queues";
import QueueDetail from "./pages/QueueDetail";
import Connections from "./pages/Connections";
import Exchanges from "./pages/Exchanges";
import Channels from "./pages/Channels";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ServerProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/queues" element={<Queues />} />
            <Route path="/queues/:queueName" element={<QueueDetail />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/exchanges" element={<Exchanges />} />
            <Route path="/channels" element={<Channels />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ServerProvider>
  </QueryClientProvider>
);

export default App;
