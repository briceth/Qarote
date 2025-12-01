import { CheckCircle, Loader2 } from "lucide-react";
import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { AlertItem } from "./AlertItem";

interface ResolvedAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  details?: {
    current?: number | string;
    threshold?: number;
    recommended?: string;
    affected?: string[];
  };
  firstSeenAt: string;
  resolvedAt: string;
  duration?: number;
  source?: {
    type: string;
    name: string;
  };
}

interface ResolvedAlertsListProps {
  alerts: ResolvedAlert[];
  isLoading: boolean;
  error: Error | null;
}

export const ResolvedAlertsList = ({
  alerts,
  isLoading,
  error,
}: ResolvedAlertsListProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
        <p className="text-muted-foreground mt-2">Loading resolved alerts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load resolved alerts. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Resolved Alerts</h3>
        <p className="text-muted-foreground">
          No alerts have been resolved yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} isResolved={true} />
      ))}
    </div>
  );
};
