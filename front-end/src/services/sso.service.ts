import { createAuth0Client, Auth0Client, User } from '@auth0/auth0-spa-js';

// SSO Provider abstraction interface
export interface SSOProvider {
  name: string;
  initialize(): Promise<void>;
  login(workspaceId?: string): Promise<void>;
  logout(): Promise<void>;
  getUser(): Promise<User | null>;
  getAccessToken(): Promise<string | null>;
  isAuthenticated(): Promise<boolean>;
}

// Auth0 implementation
export class Auth0Provider implements SSOProvider {
  public readonly name = "auth0";
  private client: Auth0Client | null = null;
  private domain: string;
  private clientId: string;

  constructor(domain: string, clientId: string) {
    this.domain = domain;
    this.clientId = clientId;
  }

  async initialize(): Promise<void> {
    if (this.client) return;

    this.client = await createAuth0Client({
      domain: this.domain,
      clientId: this.clientId,
      authorizationParams: {
        redirect_uri: window.location.origin + '/auth/sso/callback',
        audience: `https://${this.domain}/api/v2/`,
        scope: 'openid profile email',
      },
    });
  }

  async login(workspaceId?: string): Promise<void> {
    if (!this.client) {
      await this.initialize();
    }

    const loginOptions: any = {};
    
    // Add workspace ID to state for enterprise users
    if (workspaceId) {
      loginOptions.appState = { workspaceId };
    }

    await this.client!.loginWithRedirect(loginOptions);
  }

  async logout(): Promise<void> {
    if (!this.client) return;

    await this.client.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }

  async getUser(): Promise<User | null> {
    if (!this.client) {
      await this.initialize();
    }

    return this.client!.getUser();
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.client) {
      await this.initialize();
    }

    try {
      return await this.client!.getTokenSilently();
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.client) {
      await this.initialize();
    }

    return this.client!.isAuthenticated();
  }
}

// Future Firebase Auth implementation (placeholder)
export class FirebaseAuthProvider implements SSOProvider {
  public readonly name = "firebase";

  async initialize(): Promise<void> {
    // TODO: Implement Firebase Auth initialization
    throw new Error("Firebase Auth provider not implemented yet");
  }

  async login(workspaceId?: string): Promise<void> {
    // TODO: Implement Firebase Auth login
    throw new Error("Firebase Auth provider not implemented yet");
  }

  async logout(): Promise<void> {
    // TODO: Implement Firebase Auth logout
    throw new Error("Firebase Auth provider not implemented yet");
  }

  async getUser(): Promise<User | null> {
    // TODO: Implement Firebase Auth getUser
    throw new Error("Firebase Auth provider not implemented yet");
  }

  async getAccessToken(): Promise<string | null> {
    // TODO: Implement Firebase Auth getAccessToken
    throw new Error("Firebase Auth provider not implemented yet");
  }

  async isAuthenticated(): Promise<boolean> {
    // TODO: Implement Firebase Auth isAuthenticated
    throw new Error("Firebase Auth provider not implemented yet");
  }
}

// SSO Service factory
export class SSOService {
  private static instance: SSOService;
  private provider: SSOProvider | null = null;
  private config: { domain: string; clientId: string } | null = null;

  private constructor() {}

  public static getInstance(): SSOService {
    if (!SSOService.instance) {
      SSOService.instance = new SSOService();
    }
    return SSOService.instance;
  }

  // Initialize with Auth0 config
  public async initialize(config: { domain: string; clientId: string }): Promise<void> {
    this.config = config;
    this.provider = new Auth0Provider(config.domain, config.clientId);
    await this.provider.initialize();
  }

  // Method to switch providers (for future flexibility)
  public setProvider(provider: SSOProvider): void {
    this.provider = provider;
    console.log(`SSO provider switched to: ${provider.name}`);
  }

  public getCurrentProvider(): SSOProvider | null {
    return this.provider;
  }

  public async login(workspaceId?: string): Promise<void> {
    if (!this.provider) {
      throw new Error("SSO service not initialized");
    }
    return this.provider.login(workspaceId);
  }

  public async logout(): Promise<void> {
    if (!this.provider) return;
    return this.provider.logout();
  }

  public async getUser(): Promise<User | null> {
    if (!this.provider) return null;
    return this.provider.getUser();
  }

  public async getAccessToken(): Promise<string | null> {
    if (!this.provider) return null;
    return this.provider.getAccessToken();
  }

  public async isAuthenticated(): Promise<boolean> {
    if (!this.provider) return false;
    return this.provider.isAuthenticated();
  }
}

// Export singleton instance
export const ssoService = SSOService.getInstance();
