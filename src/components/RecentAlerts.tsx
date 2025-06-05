
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Zap, Server } from "lucide-react";

interface Alert {
  id: string;
  type: "warning" | "error" | "info";
  message: string;
  timestamp: string;
  source: string;
}

export const RecentAlerts = () => {
  const alerts: Alert[] = [
    {
      id: "1",
      type: "warning",
      message: "High memory usage on node-03 (78.9%)",
      timestamp: "2 minutes ago",
      source: "rabbit@node-03"
    },
    {
      id: "2",
      type: "error",
      message: "Queue 'critical-alerts' has no consumers",
      timestamp: "5 minutes ago",
      source: "Queue Monitor"
    },
    {
      id: "3",
      type: "info",
      message: "Node rabbit@node-03 restarted successfully",
      timestamp: "2 hours ago",
      source: "Cluster Manager"
    },
    {
      id: "4",
      type: "warning",
      message: "Message rate spike detected (+150%)",
      timestamp: "4 hours ago",
      source: "Rate Monitor"
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "error":
        return <Zap className="w-4 h-4 text-red-600" />;
      case "info":
        return <Server className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-700">Error</Badge>;
      case "info":
        return <Badge className="bg-blue-100 text-blue-700">Info</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          Recent Alerts
        </CardTitle>
        <p className="text-sm text-gray-500">System notifications and warnings</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">{alert.message}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {alert.timestamp}
                  </div>
                  {getAlertBadge(alert.type)}
                </div>
                <p className="text-xs text-gray-400 mt-1">Source: {alert.source}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
