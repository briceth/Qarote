/**
 * Discourse API Client
 * Handles all Discourse-related API calls
 */

import { BaseApiClient } from "./baseClient";

export interface DiscourseUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar_url?: string;
}

export interface DiscourseSSOResponse {
  ssoUrl: string;
}

export interface DiscourseEmbedResponse {
  embedUrl: string;
}

export interface DiscourseInfoResponse {
  discourseUrl: string;
  ssoEnabled: boolean;
  embedEnabled: boolean;
}

export interface DiscourseStatsResponse {
  topics: number;
  posts: number;
  users: number;
  categories: number;
}

export interface DiscourseTopic {
  id: number;
  title: string;
  slug: string;
  posts_count: number;
  reply_count: number;
  last_posted_at: string;
  category: {
    id: number;
    name: string;
    color: string;
  };
}

export interface DiscourseTopicsResponse {
  topics: DiscourseTopic[];
}

export class DiscourseApiClient extends BaseApiClient {
  constructor(baseUrl?: string) {
    super(baseUrl);
  }

  /**
   * Generate SSO URL for user to access Discourse
   */
  async generateSSOUrl(user: DiscourseUser): Promise<DiscourseSSOResponse> {
    return this.request<DiscourseSSOResponse>("/discourse/sso", {
      method: "POST",
      body: JSON.stringify(user),
    });
  }

  /**
   * Process SSO callback from Discourse
   * This method handles the SSO parameters and returns the redirect URL
   */
  async processSSOCallback(
    sso: string,
    sig: string
  ): Promise<{ redirectUrl: string }> {
    return this.request<{ redirectUrl: string }>(
      `/discourse/callback?sso=${sso}&sig=${sig}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Get Discourse embed configuration
   */
  async getEmbedUrl(
    topicId?: string,
    categoryId?: string
  ): Promise<DiscourseEmbedResponse> {
    const params = new URLSearchParams();
    if (topicId) params.append("topic", topicId);
    if (categoryId) params.append("category", categoryId);

    return this.request<DiscourseEmbedResponse>(
      `/discourse/embed?${params.toString()}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Get Discourse API information
   */
  async getInfo(): Promise<DiscourseInfoResponse> {
    return this.request<DiscourseInfoResponse>("/discourse/info", {
      method: "GET",
    });
  }

  /**
   * Get community statistics
   */
  async getStats(): Promise<DiscourseStatsResponse> {
    return this.request<DiscourseStatsResponse>("/discourse/stats", {
      method: "GET",
    });
  }

  /**
   * Get recent topics
   */
  async getTopics(limit: number = 5): Promise<DiscourseTopicsResponse> {
    return this.request<DiscourseTopicsResponse>(
      `/discourse/topics?limit=${limit}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Check authentication status
   */
  async checkAuth(): Promise<boolean> {
    try {
      const response = await this.request<{ authenticated: boolean }>(
        "/discourse/auth-check",
        {
          method: "GET",
        }
      );
      return response.authenticated;
    } catch {
      return false;
    }
  }
}
