import { useState } from "react";
import type { AddServerFormData, ConnectionStatus, SSLConfig } from "./types";
import { apiClient } from "@/lib/api";

export const useAddServerForm = () => {
  const [formData, setFormData] = useState<AddServerFormData>({
    name: "",
    host: "",
    port: 15672,
    username: "guest",
    password: "guest",
    vhost: "/",
    sslConfig: {
      enabled: false,
      verifyPeer: true,
      caCertPath: "",
      clientCertPath: "",
      clientKeyPath: "",
    },
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof AddServerFormData, string>>
  >({});

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "idle",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AddServerFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Server name is required";
    }
    if (!formData.host.trim()) {
      newErrors.host = "Host is required";
    }
    if (!formData.port || formData.port <= 0) {
      newErrors.port = "Valid port number is required";
    }
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }
    if (!formData.vhost.trim()) {
      newErrors.vhost = "Virtual host is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof AddServerFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    // Reset connection status when form changes
    if (connectionStatus.status !== "idle") {
      setConnectionStatus({ status: "idle" });
    }
  };

  const handleSSLConfigChange = (
    field: keyof SSLConfig,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      sslConfig: { ...prev.sslConfig, [field]: value },
    }));
    // Reset connection status when SSL config changes
    if (connectionStatus.status !== "idle") {
      setConnectionStatus({ status: "idle" });
    }
  };

  const testConnection = async () => {
    if (!validateForm()) return;

    setIsTestingConnection(true);
    setConnectionStatus({ status: "idle" });

    try {
      const result = await apiClient.testConnection({
        host: formData.host,
        port: formData.port,
        username: formData.username,
        password: formData.password,
        vhost: formData.vhost,
        sslConfig: formData.sslConfig,
      });

      if (result.success) {
        setConnectionStatus({
          status: "success",
          message: "Connection successful!",
          details: {
            version: result.version,
            cluster_name: result.cluster_name,
          },
        });
      } else {
        setConnectionStatus({
          status: "error",
          message: result.message || "Connection failed",
        });
      }
    } catch (error) {
      setConnectionStatus({
        status: "error",
        message:
          error instanceof Error ? error.message : "Connection test failed",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      host: "",
      port: 15672,
      username: "guest",
      password: "guest",
      vhost: "/",
      sslConfig: {
        enabled: false,
        verifyPeer: true,
        caCertPath: "",
        clientCertPath: "",
        clientKeyPath: "",
      },
    });
    setErrors({});
    setConnectionStatus({ status: "idle" });
  };

  return {
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
  };
};
