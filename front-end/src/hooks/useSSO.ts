import { useState, useEffect } from 'react';
import { ssoService } from '@/services/sso.service';
import logger from '@/lib/logger';

interface SSOConfig {
  domain: string;
  clientId: string;
}

interface SSOState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useSSO = () => {
  const [state, setState] = useState<SSOState>({
    isInitialized: false,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize SSO service
  const initializeSSO = async (config: SSOConfig) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await ssoService.initialize(config);
      
      const isAuthenticated = await ssoService.isAuthenticated();
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isAuthenticated,
        isLoading: false,
      }));

      logger.info('SSO service initialized', { 
        isAuthenticated,
        provider: ssoService.getCurrentProvider()?.name 
      });
    } catch (error) {
      logger.error('Failed to initialize SSO service', { error });
      setState(prev => ({
        ...prev,
        isInitialized: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize SSO',
      }));
    }
  };

  // Login with SSO
  const loginWithSSO = async (workspaceId?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await ssoService.login(workspaceId);
      
      logger.info('SSO login initiated', { workspaceId });
    } catch (error) {
      logger.error('SSO login failed', { error });
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'SSO login failed',
      }));
    }
  };

  // Logout from SSO
  const logoutFromSSO = async () => {
    try {
      await ssoService.logout();
      
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
      }));

      logger.info('SSO logout successful');
    } catch (error) {
      logger.error('SSO logout failed', { error });
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'SSO logout failed',
      }));
    }
  };

  // Get user info from SSO
  const getSSOUser = async () => {
    try {
      return await ssoService.getUser();
    } catch (error) {
      logger.error('Failed to get SSO user', { error });
      return null;
    }
  };

  // Get access token from SSO
  const getSSOAccessToken = async () => {
    try {
      return await ssoService.getAccessToken();
    } catch (error) {
      logger.error('Failed to get SSO access token', { error });
      return null;
    }
  };

  // Check authentication status
  const checkAuthentication = async () => {
    try {
      const isAuthenticated = await ssoService.isAuthenticated();
      setState(prev => ({ ...prev, isAuthenticated }));
      return isAuthenticated;
    } catch (error) {
      logger.error('Failed to check SSO authentication', { error });
      return false;
    }
  };

  return {
    ...state,
    initializeSSO,
    loginWithSSO,
    logoutFromSSO,
    getSSOUser,
    getSSOAccessToken,
    checkAuthentication,
  };
};
