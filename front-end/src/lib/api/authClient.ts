/**
 * Authentication API Client
 * Handles user authentication and profile management
 */

import { BaseApiClient } from "./baseClient";
import {
  LoginRequest,
  RegisterRequest,
  User,
  UserProfile,
  UpdateProfileRequest,
  UpdateCompanyRequest,
  InviteUserRequest,
  Company,
  Workspace,
  Invitation,
  SendInvitationRequest,
  SendInvitationResponse,
  GetInvitationsResponse,
  InvitationDetailsResponse,
  AcceptInvitationResponse,
  RevokeInvitationResponse,
} from "./authTypes";

export class AuthApiClient extends BaseApiClient {
  async login(
    credentials: LoginRequest
  ): Promise<{ user: User; token: string }> {
    return this.request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(
    userData: RegisterRequest
  ): Promise<{ user: User; token: string }> {
    return this.request<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getProfile(): Promise<{ profile: UserProfile }> {
    return this.request<{ profile: UserProfile }>("/users/profile/me");
  }

  async updateProfile(userData: UpdateProfileRequest): Promise<{ user: User }> {
    return this.request<{ user: User }>("/users/profile/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async updateCompany(
    companyData: UpdateCompanyRequest
  ): Promise<{ company: Company }> {
    return this.request<{ company: Company }>("/users/profile/company", {
      method: "PUT",
      body: JSON.stringify(companyData),
    });
  }

  // New workspace methods
  async updateWorkspace(
    workspaceData: UpdateCompanyRequest
  ): Promise<{ workspace: Company }> {
    return this.request<{ workspace: Company }>("/users/profile/workspace", {
      method: "PUT",
      body: JSON.stringify(workspaceData),
    });
  }

  async getCompanyUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>("/users/profile/company/users");
  }

  // New workspace users method
  async getWorkspaceUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>("/users/profile/workspace/users");
  }

  async inviteUser(
    userData: InviteUserRequest
  ): Promise<{ invitation: Invitation }> {
    return this.request<{ invitation: Invitation }>("/users/invite", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>("/auth/logout", {
      method: "POST",
    });
  }

  // Invitation management
  async getInvitations(): Promise<GetInvitationsResponse> {
    return this.request<GetInvitationsResponse>("/invitations");
  }

  async sendInvitation(
    invitationData: SendInvitationRequest
  ): Promise<SendInvitationResponse> {
    return this.request<SendInvitationResponse>("/invitations", {
      method: "POST",
      body: JSON.stringify(invitationData),
    });
  }

  async revokeInvitation(
    invitationId: string
  ): Promise<RevokeInvitationResponse> {
    return this.request<RevokeInvitationResponse>(
      `/invitations/${invitationId}`,
      {
        method: "DELETE",
      }
    );
  }

  async getInvitationDetails(
    token: string
  ): Promise<InvitationDetailsResponse> {
    return this.request<InvitationDetailsResponse>(`/invitations/${token}`);
  }

  async acceptInvitation(token: string): Promise<AcceptInvitationResponse> {
    return this.request<AcceptInvitationResponse>(
      `/invitations/${token}/accept`,
      {
        method: "POST",
      }
    );
  }

  async acceptInvitationWithRegistration(
    token: string,
    registrationData: {
      password: string;
      firstName: string;
      lastName: string;
    }
  ): Promise<{ user: User; token: string; workspace: Workspace }> {
    return this.request<{ user: User; token: string; workspace: Workspace }>(
      "/auth/invitation/accept",
      {
        method: "POST",
        body: JSON.stringify({
          token,
          ...registrationData,
        }),
      }
    );
  }
}
