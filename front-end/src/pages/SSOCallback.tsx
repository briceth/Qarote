import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { ssoService } from "@/services/sso.service";
import { useAuth } from "@/contexts/AuthContext";
import logger from "@/lib/logger";

const SSOCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        logger.info("Processing SSO callback");

        // Get the access token from Auth0
        const accessToken = await ssoService.getAccessToken();
        if (!accessToken) {
          throw new Error("No access token received from SSO provider");
        }

        // Get workspace ID from app state (if provided)
        const workspaceId = location.state?.workspaceId;

        // Send the token to our backend for verification
        const response = await fetch('/api/auth/auth0/sso', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken,
            workspaceId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'SSO authentication failed');
        }

        const data = await response.json();
        
        // Update auth context with the user data
        login(data.user, data.token);

        logger.info("SSO authentication successful", {
          userId: data.user.id,
          workspaceId: data.user.workspaceId,
          ssoProvider: data.ssoProvider,
        });

        setStatus('success');

        // Redirect to dashboard or intended page
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }, 1500);

      } catch (error) {
        logger.error("SSO callback error", { error });
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate, location, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-800 to-red-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-gray-900 text-center">
              {status === 'loading' && 'Authenticating...'}
              {status === 'success' && 'Authentication Successful'}
              {status === 'error' && 'Authentication Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {status === 'loading' && (
              <div className="space-y-4">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-orange-600" />
                <p className="text-gray-600">
                  Please wait while we complete your authentication...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <CheckCircle className="w-8 h-8 mx-auto text-green-600" />
                <p className="text-gray-600">
                  You have been successfully authenticated. Redirecting...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <XCircle className="w-8 h-8 mx-auto text-red-600" />
                <Alert variant="destructive">
                  <AlertDescription>
                    {error || 'An error occurred during authentication'}
                  </AlertDescription>
                </Alert>
                <button
                  onClick={() => navigate('/auth/sign-in')}
                  className="text-sm text-orange-600 hover:text-orange-500 underline"
                >
                  Return to sign in
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SSOCallback;
