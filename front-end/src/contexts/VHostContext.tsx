import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useServers, useVHosts } from "@/hooks/useApi";

import { useServerContext } from "./ServerContext";
import { VHostContext, type VHostContextType } from "./VHostContextDefinition";

// Re-export hook for convenience

interface VHostProviderProps {
  children: React.ReactNode;
}

export const VHostProvider: React.FC<VHostProviderProps> = ({ children }) => {
  const { selectedServerId } = useServerContext();
  const { data: vhostsResponse, isLoading } = useVHosts(
    selectedServerId,
    !!selectedServerId
  );

  const availableVHosts = useMemo(
    () => vhostsResponse?.vhosts || [],
    [vhostsResponse]
  );

  // Get server's configured vhost from servers list
  const { data: serversResponse } = useServers();
  const servers = useMemo(
    () => serversResponse?.servers || [],
    [serversResponse]
  );
  const selectedServer = servers.find((s) => s.id === selectedServerId);
  const serverVHost = selectedServer?.vhost || "/";

  // Initialize from localStorage if available
  const [selectedVHost, setSelectedVHostState] = useState<string | null>(() => {
    if (typeof window !== "undefined" && selectedServerId) {
      const stored = localStorage.getItem(`selectedVHost_${selectedServerId}`);
      return stored || null;
    }
    return null;
  });

  // Custom setter that also persists to localStorage
  const handleSetSelectedVHost = useCallback(
    (vhost: string | null) => {
      setSelectedVHostState(vhost);
      if (typeof window !== "undefined" && selectedServerId) {
        if (vhost) {
          localStorage.setItem(`selectedVHost_${selectedServerId}`, vhost);
        } else {
          localStorage.removeItem(`selectedVHost_${selectedServerId}`);
        }
      }
    },
    [selectedServerId]
  );

  // Auto-select server's configured vhost when server changes
  useEffect(() => {
    if (!selectedServerId) {
      setSelectedVHostState(null);
      return;
    }

    // If vhosts are loaded, validate and set default
    if (availableVHosts.length > 0) {
      // Check if stored vhost exists in available vhosts
      const storedVHost = localStorage.getItem(
        `selectedVHost_${selectedServerId}`
      );
      if (storedVHost) {
        const vhostExists = availableVHosts.some((v) => v.name === storedVHost);
        if (vhostExists) {
          setSelectedVHostState(storedVHost);
          return;
        }
      }

      // Check if server's configured vhost exists in available vhosts
      const serverVHostExists = availableVHosts.some(
        (v) => v.name === serverVHost
      );
      if (serverVHostExists) {
        handleSetSelectedVHost(serverVHost);
      } else {
        // Fallback to "/" if it exists, otherwise first vhost
        const defaultVHost = availableVHosts.find((v) => v.name === "/");
        if (defaultVHost) {
          handleSetSelectedVHost("/");
        } else if (availableVHosts.length > 0) {
          handleSetSelectedVHost(availableVHosts[0].name);
        }
      }
    }
  }, [selectedServerId, availableVHosts, serverVHost, handleSetSelectedVHost]);

  // Validate selected vhost exists in available vhosts
  useEffect(() => {
    if (selectedVHost && availableVHosts.length > 0) {
      const vhostExists = availableVHosts.some((v) => v.name === selectedVHost);
      if (!vhostExists) {
        // Selected vhost no longer exists, reset to default
        const defaultVHost = availableVHosts.find(
          (v) => v.name === serverVHost
        );
        if (defaultVHost) {
          handleSetSelectedVHost(serverVHost);
        } else if (availableVHosts.length > 0) {
          handleSetSelectedVHost(availableVHosts[0].name);
        }
      }
    }
  }, [selectedVHost, availableVHosts, serverVHost, handleSetSelectedVHost]);

  const value: VHostContextType = {
    selectedVHost,
    setSelectedVHost: handleSetSelectedVHost,
    availableVHosts,
    isLoading,
  };

  return (
    <VHostContext.Provider value={value}>{children}</VHostContext.Provider>
  );
};
