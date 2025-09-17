import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ssoService } from "@/services/sso.service";
import { Shield, Loader2 } from "lucide-react";
import logger from "@/lib/logger";

interface Auth0SSOButtonProps {
  workspaceId?: string;
  onError?: (error: Error) => void;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

const Auth0SSOButton: React.FC<Auth0SSOButtonProps> = ({
  workspaceId,
  onError,
  className,
  variant = "outline",
  size = "default",
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSSOLogin = async () => {
    try {
      setIsLoading(true);
      logger.info("Initiating Auth0 SSO login", { workspaceId });
      
      await ssoService.login(workspaceId);
    } catch (error) {
      logger.error("Auth0 SSO login failed", { error });
      if (onError) {
        onError(error instanceof Error ? error : new Error("SSO login failed"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleSSOLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Shield className="w-4 h-4 mr-2" />
      )}
      {children || "Sign in with SSO"}
    </Button>
  );
};

export default Auth0SSOButton;
