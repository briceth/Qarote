/**
 * Authentication API Client
 * Handles user authentication and profile management
 */

import { BaseApiClient } from "./base-client";
import { LoginRequest, RegisterRequest, User } from "./auth-types";

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

  async getProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>("/auth/profile");
  }

  async updateProfile(userData: Partial<User>): Promise<{ user: User }> {
    return this.request<{ user: User }>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>("/auth/logout", {
      method: "POST",
    });
  }
}
