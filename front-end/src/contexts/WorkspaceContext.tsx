import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { apiClient } from "@/lib/api";
import type { Workspace } from "@/lib/api/workspaceClient";
import { WorkspacePlan } from "@/lib/plans/planUtils";
import logger from "../lib/logger";

interface WorkspaceContextType {
  workspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  workspacePlan: WorkspacePlan;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
}) => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  const fetchWorkspace = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getCurrentWorkspace();
      setWorkspace(response.workspace);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch workspace";
      setError(errorMessage);
      logger.error("Failed to fetch workspace:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWorkspace();
    }
  }, [isAuthenticated, user, fetchWorkspace]);

  const workspacePlan =
    (workspace?.plan as WorkspacePlan) || WorkspacePlan.FREE;

  const value: WorkspaceContextType = {
    workspace,
    isLoading,
    error,
    refetch: fetchWorkspace,
    workspacePlan,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
