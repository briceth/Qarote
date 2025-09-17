import { ManagementClient, AuthenticationClient } from "auth0";
import { logger } from "@/core/logger";
import { config } from "@/config";

// SSO Provider abstraction interface
export interface SSOProvider {
  name: string;
  verifyToken(token: string): Promise<SSOUserInfo>;
  getUserInfo(accessToken: string): Promise<SSOUserInfo>;
}

// Standardized user info interface
export interface SSOUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  provider: string;
  providerId: string;
  picture?: string;
  metadata?: Record<string, any>;
}

// Auth0 implementation
export class Auth0Provider implements SSOProvider {
  public readonly name = "auth0";
  private managementClient: ManagementClient;
  private authenticationClient: AuthenticationClient;

  constructor() {
    this.managementClient = new ManagementClient({
      domain: config.AUTH0_DOMAIN,
      clientId: config.AUTH0_CLIENT_ID,
      clientSecret: config.AUTH0_CLIENT_SECRET,
      scope: "read:users read:user_idp_tokens",
    });

    this.authenticationClient = new AuthenticationClient({
      domain: config.AUTH0_DOMAIN,
      clientId: config.AUTH0_CLIENT_ID,
      clientSecret: config.AUTH0_CLIENT_SECRET,
    });
  }

  async verifyToken(token: string): Promise<SSOUserInfo> {
    try {
      // Verify the Auth0 token
      const userInfo = await this.authenticationClient.getProfile(token);
      
      return {
        id: userInfo.sub,
        email: userInfo.email || "",
        firstName: userInfo.given_name || "",
        lastName: userInfo.family_name || "",
        emailVerified: userInfo.email_verified || false,
        provider: "auth0",
        providerId: userInfo.sub,
        picture: userInfo.picture,
        metadata: {
          nickname: userInfo.nickname,
          locale: userInfo.locale,
          updated_at: userInfo.updated_at,
        },
      };
    } catch (error) {
      logger.error({ error }, "Auth0 token verification failed");
      throw new Error("Invalid Auth0 token");
    }
  }

  async getUserInfo(accessToken: string): Promise<SSOUserInfo> {
    try {
      const userInfo = await this.authenticationClient.getProfile(accessToken);
      
      return {
        id: userInfo.sub,
        email: userInfo.email || "",
        firstName: userInfo.given_name || "",
        lastName: userInfo.family_name || "",
        emailVerified: userInfo.email_verified || false,
        provider: "auth0",
        providerId: userInfo.sub,
        picture: userInfo.picture,
        metadata: {
          nickname: userInfo.nickname,
          locale: userInfo.locale,
          updated_at: userInfo.updated_at,
        },
      };
    } catch (error) {
      logger.error({ error }, "Auth0 user info retrieval failed");
      throw new Error("Failed to get user info from Auth0");
    }
  }
}

// Future Firebase Auth implementation (placeholder)
export class FirebaseAuthProvider implements SSOProvider {
  public readonly name = "firebase";

  async verifyToken(token: string): Promise<SSOUserInfo> {
    // TODO: Implement Firebase Auth token verification
    throw new Error("Firebase Auth provider not implemented yet");
  }

  async getUserInfo(accessToken: string): Promise<SSOUserInfo> {
    // TODO: Implement Firebase Auth user info retrieval
    throw new Error("Firebase Auth provider not implemented yet");
  }
}

// SSO Service factory
export class SSOService {
  private static instance: SSOService;
  private provider: SSOProvider;

  private constructor() {
    // Initialize with Auth0 by default
    this.provider = new Auth0Provider();
  }

  public static getInstance(): SSOService {
    if (!SSOService.instance) {
      SSOService.instance = new SSOService();
    }
    return SSOService.instance;
  }

  // Method to switch providers (for future flexibility)
  public setProvider(provider: SSOProvider): void {
    this.provider = provider;
    logger.info(`SSO provider switched to: ${provider.name}`);
  }

  public getCurrentProvider(): SSOProvider {
    return this.provider;
  }

  public async verifyToken(token: string): Promise<SSOUserInfo> {
    return this.provider.verifyToken(token);
  }

  public async getUserInfo(accessToken: string): Promise<SSOUserInfo> {
    return this.provider.getUserInfo(accessToken);
  }
}

// Export singleton instance
export const ssoService = SSOService.getInstance();
