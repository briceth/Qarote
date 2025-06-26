import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/hooks/useApi";
import { Server, SSLConfig } from "@/lib/api/types";

// Update server mutation
export function useUpdateServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      host: string;
      port: number;
      username: string;
      password?: string;
      vhost: string;
      useSSL: boolean;
      managementPort: number;
    }) => {
      const serverData = {
        name: data.name,
        host: data.host,
        port: data.port,
        username: data.username,
        vhost: data.vhost,
        sslConfig: data.useSSL
          ? { enabled: true, verifyPeer: false }
          : undefined,
        ...(data.password && { password: data.password }),
      };

      const response = await apiClient.updateServer(data.id, serverData);
      return response.server;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers });
    },
  });
}

// Delete server mutation
export function useDeleteServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serverId: string) => {
      await apiClient.deleteServer(serverId);
      return serverId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers });
    },
  });
}

// Test connection mutation
export function useTestConnection() {
  return useMutation({
    mutationFn: async (credentials: {
      host: string;
      port: number;
      username: string;
      password: string;
      vhost: string;
      sslConfig?: SSLConfig;
    }) => {
      return await apiClient.testConnection(credentials);
    },
  });
}
