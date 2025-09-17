import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Building2, ArrowLeft } from "lucide-react";
import { useSSO } from "@/hooks/useSSO";
import logger from "@/lib/logger";

const enterpriseSSOSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

type EnterpriseSSOFormData = z.infer<typeof enterpriseSSOSchema>;

const EnterpriseSSOLogin: React.FC = () => {
  const [ssoConfig, setSSOConfig] = useState<{ domain: string; clientId: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { initializeSSO, isInitialized: ssoInitialized, loginWithSSO } = useSSO();

  const form = useForm<EnterpriseSSOFormData>({
    resolver: zodResolver(enterpriseSSOSchema),
    defaultValues: {
      workspaceId: "",
    },
  });

  // Initialize SSO service
  useEffect(() => {
    const fetchSSOConfig = async () => {
      try {
        const response = await fetch('/api/auth/auth0/config');
        if (response.ok) {
          const config = await response.json();
          setSSOConfig(config);
          await initializeSSO(config);
        }
      } catch (error) {
        logger.error('Failed to fetch SSO config', { error });
        setError('Failed to initialize SSO service');
      }
    };

    fetchSSOConfig();
  }, [initializeSSO]);

  const onSubmit = async (data: EnterpriseSSOFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.info("Enterprise SSO login initiated", { workspaceId: data.workspaceId });
      
      await loginWithSSO(data.workspaceId);
    } catch (error) {
      logger.error("Enterprise SSO login failed", { error });
      setError(error instanceof Error ? error.message : "SSO login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-800 to-red-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-white/10">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Enterprise SSO Login
          </h2>
          <p className="mt-2 text-sm text-orange-100">
            Sign in to your enterprise workspace using SSO
          </p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-orange-600" />
              Enterprise Authentication
            </CardTitle>
            <CardDescription>
              Enter your workspace ID to authenticate with your organization's SSO provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="workspaceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your workspace ID"
                          disabled={isLoading || !ssoInitialized}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-button hover:bg-gradient-button-hover"
                  disabled={isLoading || !ssoInitialized || !form.formState.isValid}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Sign in with SSO
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Back to regular sign in */}
            <div className="mt-6 text-center">
              <Link
                to="/auth/sign-in"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to regular sign in
              </Link>
            </div>

            {/* Help text */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Need help?</strong> Contact your workspace administrator to get your workspace ID.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnterpriseSSOLogin;
