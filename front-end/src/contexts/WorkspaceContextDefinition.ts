import { createContext } from "react";
import type { CurrentPlanResponse } from "@/lib/api";
import type { Workspace } from "@/lib/api/workspaceClient";
import { WorkspacePlan } from "@/types/plans";

// Extended workspace interface to handle the full API response
interface ExtendedWorkspace extends Workspace {
  storageMode?: string;
  retentionDays?: number;
  encryptData?: boolean;
  autoDelete?: boolean;
  consentGiven?: boolean;
  consentDate?: string;
  _count?: {
    users: number;
    servers: number;
  };
}

interface WorkspaceContextType {
  workspace: ExtendedWorkspace | null;
  planData: CurrentPlanResponse | null;
  isLoading: boolean;
  isPlanLoading: boolean;
  error: string | null;
  planError: string | null;
  refetch: () => Promise<void>;
  refetchPlan: () => Promise<void>;
  workspacePlan: WorkspacePlan;
  // Convenience getters for common plan operations
  canAddServer: boolean;
  canAddQueue: boolean;
  canSendMessages: boolean;
  canAddExchange: boolean;
  canAddVirtualHost: boolean;
  canAddRabbitMQUser: boolean;
  canManageQueues: boolean;
  canConfigureAlerts: boolean;
  canCreateWorkspace: boolean;
  approachingLimits: boolean;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export type { WorkspaceContextType, ExtendedWorkspace };
