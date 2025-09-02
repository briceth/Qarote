import { useMutation } from "@tanstack/react-query";
import { apiClient, LoginRequest, RegisterRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const useLogin = (intendedDestination: string = "/") => {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      return await apiClient.login(credentials);
    },
    onSuccess: async (data) => {
      try {
        // Check if user has any workspaces BEFORE setting auth state
        // Temporarily store the new token to make the API call
        const currentToken = localStorage.getItem("auth_token");
        localStorage.setItem("auth_token", data.token);

        const workspacesResponse = await apiClient.getUserWorkspaces();
        const workspaces = workspacesResponse.workspaces || [];

        // Restore original token temporarily (in case login fails)
        if (currentToken) {
          localStorage.setItem("auth_token", currentToken);
        } else {
          localStorage.removeItem("auth_token");
        }

        // Now set the authentication state (this will trigger context providers)
        login(data.token, data.user);

        if (workspaces.length === 0) {
          // No workspaces - redirect to workspace creation
          navigate("/workspace", { replace: true });
        } else {
          // Has workspaces - redirect to intended destination
          navigate(intendedDestination, { replace: true });
        }
      } catch (error) {
        console.error("Failed to check workspaces after login:", error);
        // Even if workspace check fails, set auth state and redirect
        login(data.token, data.user);
        navigate(intendedDestination, { replace: true });
      }
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: RegisterRequest) => {
      return await apiClient.register(userData);
    },
    // No onSuccess callback - user must verify email before logging in
  });
};

export const useLogout = () => {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      await apiClient.logout();
    },
    onSuccess: () => {
      logout();
    },
    onError: () => {
      // Always logout on the client even if the server request fails
      logout();
    },
  });
};

export const useAcceptInvitation = () => {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      token: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => {
      const response = await apiClient.acceptInvitationWithRegistration(
        params.token,
        {
          password: params.password,
          firstName: params.firstName,
          lastName: params.lastName,
        }
      );
      return response;
    },
    onSuccess: (data) => {
      login(data.token, data.user);
    },
  });
};
