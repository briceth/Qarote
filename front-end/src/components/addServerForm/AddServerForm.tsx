import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import logger from "../../lib/logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Server, Edit } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useServerContext } from "@/contexts/ServerContext";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/useApi";

import { ServerDetails } from "./ServerDetails";
import { Credentials } from "./Credentials";
import { SSLConfiguration } from "./SSLConfiguration";
import { ConnectionStatusDisplay } from "./ConnectionStatusDisplay";
import { TestConnectionButton } from "./TestConnectionButton";
import { RabbitMqVersionInfo } from "./RabbitMqVersionInfo";
import { useAddServerForm } from "./useAddServerForm";
import type { AddServerFormProps } from "./types";

export const AddServerForm = ({
  onServerAdded,
  onServerUpdated,
  trigger,
  server,
  mode = "add",
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: AddServerFormProps) => {
  const { setSelectedServerId } = useServerContext();
  const queryClient = useQueryClient();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use controlled or internal state for dialog open state
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledOnOpenChange || setInternalIsOpen;

  const {
    formData,
    errors,
    connectionStatus,
    isLoading,
    isTestingConnection,
    setIsLoading,
    setConnectionStatus,
    setFormData,
    setErrors,
    validateForm,
    handleInputChange,
    handleSSLConfigChange,
    testConnection,
    resetForm,
  } = useAddServerForm({ server, mode });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === "edit" && server) {
        // Update existing server
        const result = await apiClient.updateServer(server.id, {
          name: formData.name,
          host: formData.host,
          port: formData.port,
          username: formData.username,
          password: formData.password,
          vhost: formData.vhost,
          sslConfig: formData.sslConfig,
        });

        // Invalidate servers query to refresh the server list
        queryClient.invalidateQueries({ queryKey: queryKeys.servers });

        // Close dialog
        setIsOpen(false);

        // Notify parent component
        onServerUpdated?.();
      } else {
        // Create new server
        const result = await apiClient.createServer({
          name: formData.name,
          host: formData.host,
          port: formData.port,
          username: formData.username,
          password: formData.password,
          vhost: formData.vhost,
          sslConfig: formData.sslConfig,
        });

        // Set this as the selected server (only for new servers)
        setSelectedServerId(result.server.id);

        // Invalidate servers query to refresh the server list
        queryClient.invalidateQueries({ queryKey: queryKeys.servers });

        // Close dialog
        setIsOpen(false);

        // Notify parent component
        onServerAdded?.();
      }

      // Reset form and status
      setConnectionStatus({ status: "idle" });
      setErrors({});
    } catch (error) {
      setConnectionStatus({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : mode === "edit"
              ? "Failed to update server"
              : "Failed to create server",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          resetForm();
        }
      }}
    >
      {/* Only render trigger if not in controlled mode */}
      {controlledIsOpen === undefined && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {mode === "edit" ? (
              <>
                <Edit className="h-5 w-5" />
                Edit RabbitMQ Server
              </>
            ) : (
              <>
                <Server className="h-5 w-5" />
                Add RabbitMQ Server
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the connection details for your RabbitMQ server."
              : "Connect to your RabbitMQ server by providing the connection details below."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <RabbitMqVersionInfo />

            <ServerDetails
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
            />

            <Credentials
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
            />

            {/* SSL Configuration */}
            <SSLConfiguration
              sslConfig={formData.sslConfig}
              onSSLConfigChange={handleSSLConfigChange}
            />

            <ConnectionStatusDisplay
              connectionStatus={connectionStatus}
              onUpgrade={() => {
                // Navigate to upgrade page or show upgrade modal
                // For now, we'll just log - this can be enhanced later
                logger.info("Upgrade plan requested");
              }}
            />
          </form>
        </div>

        <DialogFooter className="flex gap-2 flex-shrink-0">
          <TestConnectionButton
            onTestConnection={testConnection}
            isTestingConnection={isTestingConnection}
            isLoading={isLoading}
          />
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || isTestingConnection}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : mode === "edit" ? (
              <Edit className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {mode === "edit" ? "Update Server" : "Add Server"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
