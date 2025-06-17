import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import type { ConnectionStatus } from "./types";

interface ConnectionStatusDisplayProps {
  connectionStatus: ConnectionStatus;
}

export const ConnectionStatusDisplay = ({
  connectionStatus,
}: ConnectionStatusDisplayProps) => {
  if (connectionStatus.status === "idle") {
    return null;
  }

  return (
    <Alert
      className={
        connectionStatus.status === "success"
          ? "border-green-500"
          : "border-red-500"
      }
    >
      {connectionStatus.status === "success" ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-600" />
      )}
      <AlertDescription>
        {connectionStatus.message}
        {connectionStatus.details && (
          <div className="mt-2 text-sm text-gray-600">
            <p>RabbitMQ Version: {connectionStatus.details.version}</p>
            <p>Cluster: {connectionStatus.details.cluster_name}</p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};
