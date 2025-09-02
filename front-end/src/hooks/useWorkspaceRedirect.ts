import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import logger from "@/lib/logger";

/**
 * Hook to handle workspace-based redirects after login
 * Redirects to /workspace if user has no workspaces, otherwise to intended destination
 */
export const useWorkspaceRedirect = (
  isAuthenticated: boolean,
  isLoginSuccess: boolean,
  intendedDestination: string = "/"
) => {
  const navigate = useNavigate();
  const hasProcessedRedirect = useRef(false);

  logger.debug("useWorkspaceRedirect called with:", {
    isAuthenticated,
    isLoginSuccess,
    intendedDestination,
    hasProcessedRedirect: hasProcessedRedirect.current,
  });

  // Track parameter changes
  useEffect(() => {
    logger.debug("useWorkspaceRedirect parameters changed:", {
      isAuthenticated,
      isLoginSuccess,
      intendedDestination,
      hasProcessedRedirect: hasProcessedRedirect.current,
    });
  }, [isAuthenticated, isLoginSuccess, intendedDestination]);

  // Reset the redirect flag when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      hasProcessedRedirect.current = false;
      logger.debug(
        "Reset hasProcessedRedirect because user is not authenticated"
      );
    }
  }, [isAuthenticated]);

  // Alternative approach: use authentication state directly instead of relying on mutation success
  const shouldFetchWorkspaces =
    isAuthenticated && !hasProcessedRedirect.current;

  logger.debug("Should fetch workspaces?", {
    shouldFetchWorkspaces,
    isAuthenticated,
    hasProcessedRedirect: hasProcessedRedirect.current,
  });

  // Fetch user's workspaces when authenticated and we haven't processed redirect yet
  const {
    data: workspacesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-workspaces"],
    queryFn: () => apiClient.getUserWorkspaces(),
    enabled: shouldFetchWorkspaces,
    refetchOnWindowFocus: false,
  });

  logger.debug("Workspace query state:", {
    isLoading,
    hasData: !!workspacesData,
    workspacesCount: workspacesData?.workspaces?.length || 0,
    error: error?.message,
  });

  useEffect(() => {
    logger.debug("useWorkspaceRedirect effect triggered:", {
      shouldFetchWorkspaces,
      isLoading,
      hasWorkspacesData: !!workspacesData,
      hasProcessedRedirect: hasProcessedRedirect.current,
      dependencies: {
        shouldFetchWorkspaces,
        isLoading,
        hasWorkspacesData: !!workspacesData,
        hasError: !!error,
        intendedDestination,
      },
    });

    // Only proceed if we should fetch workspaces and haven't processed redirect yet
    if (!shouldFetchWorkspaces || hasProcessedRedirect.current) {
      logger.debug("Skipping redirect - conditions not met", {
        shouldFetchWorkspaces,
        hasProcessedRedirect: hasProcessedRedirect.current,
      });
      return;
    }

    logger.debug("Should fetch workspaces, checking if data is loading...");

    // Wait for workspace data to load
    if (isLoading) {
      logger.debug("Skipping redirect - workspace data still loading", {
        isLoading,
      });
      return;
    }

    logger.debug("Workspace data finished loading, checking for errors...");

    // If there was an error fetching workspaces, skip redirect
    if (error) {
      logger.error("Error fetching workspaces, skipping redirect:", error);
      return;
    }

    logger.debug("No errors, processing workspace redirect...");

    const workspaces = workspacesData?.workspaces || [];
    logger.debug("Processing workspace redirect:", {
      workspacesCount: workspaces.length,
      workspaces: workspaces.map((w) => ({ id: w.id, name: w.name })),
      intendedDestination,
    });

    // Mark that we've processed the redirect to prevent loops
    hasProcessedRedirect.current = true;

    // If user has no workspaces, redirect to workspace creation page
    if (workspaces.length === 0) {
      logger.info(
        "No workspaces found - redirecting to workspace creation page"
      );
      navigate("/workspace", { replace: true });
    } else {
      logger.info(
        `User has ${workspaces.length} workspace(s) - redirecting to intended destination: ${intendedDestination}`
      );
      // User has workspaces, redirect to intended destination
      navigate(intendedDestination, { replace: true });
    }
  }, [
    shouldFetchWorkspaces,
    isLoading,
    workspacesData,
    error,
    navigate,
    intendedDestination,
  ]);

  return {
    isCheckingWorkspaces: shouldFetchWorkspaces && isLoading,
    hasWorkspaces: (workspacesData?.workspaces || []).length > 0,
  };
};
