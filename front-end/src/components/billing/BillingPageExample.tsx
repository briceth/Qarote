import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SubscriptionManagement } from "@/components/billing/SubscriptionManagement";
import { apiClient } from "@/lib/api/client";
import { WorkspacePlan } from "@/types/plans";
import type { CancelSubscriptionRequest } from "@/lib/api/paymentClient";

interface BillingPageProps {
  currentPlan: WorkspacePlan;
  periodEnd?: string;
  // ... other props
}

export const BillingPage: React.FC<BillingPageProps> = ({
  currentPlan,
  periodEnd,
}) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: (data: CancelSubscriptionRequest) =>
      apiClient.cancelSubscription(data),
    onSuccess: (response) => {
      toast.success(response.message, {
        description: response.subscription.cancelAtPeriodEnd
          ? `Your subscription will end on ${new Date(
              response.subscription.currentPeriodEnd
            ).toLocaleDateString()}`
          : "Your workspace has been downgraded to the Free plan.",
      });

      // Refresh relevant queries
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
      queryClient.invalidateQueries({ queryKey: ["current-plan"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to cancel subscription", {
        description: error.message || "Please try again later.",
      });
    },
  });

  // Handle opening billing portal
  const handleOpenBillingPortal = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.createBillingPortalSession();
      window.open(response.url, "_blank");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Please try again later.";
      toast.error("Failed to open billing portal", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle plan upgrade (you would implement this based on your existing upgrade flow)
  const handleUpgrade = async (
    plan: WorkspacePlan,
    interval: "monthly" | "yearly"
  ) => {
    try {
      setIsLoading(true);
      const response = await apiClient.createCheckoutSession({
        plan,
        billingInterval: interval,
      });
      window.location.href = response.url;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Please try again later.";
      toast.error("Failed to start upgrade process", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async (data: {
    cancelImmediately: boolean;
    reason: string;
    feedback: string;
  }) => {
    await cancelSubscriptionMutation.mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      <SubscriptionManagement
        currentPlan={currentPlan}
        onOpenBillingPortal={handleOpenBillingPortal}
        onUpgrade={handleUpgrade}
        onCancelSubscription={handleCancelSubscription}
        periodEnd={periodEnd}
        isLoading={isLoading || cancelSubscriptionMutation.isPending}
      />

      {/* Add other billing components here */}
    </div>
  );
};
