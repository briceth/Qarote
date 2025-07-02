import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { WorkspacePlan } from "@/types/plans";
import { CancelSubscriptionModal } from "./CancelSubscriptionModal";

interface SubscriptionManagementProps {
  currentPlan: WorkspacePlan;
  onOpenBillingPortal: () => void;
  onUpgrade: (plan: WorkspacePlan, interval: "monthly" | "yearly") => void;
  onCancelSubscription: (data: {
    cancelImmediately: boolean;
    reason: string;
    feedback: string;
  }) => Promise<void>;
  periodEnd?: string;
  isLoading?: boolean;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  currentPlan,
  onOpenBillingPortal,
  onUpgrade,
  onCancelSubscription,
  periodEnd,
  isLoading,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async (data: {
    cancelImmediately: boolean;
    reason: string;
    feedback: string;
  }) => {
    await onCancelSubscription(data);
    setShowCancelModal(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Subscription Management</CardTitle>
              <p className="text-sm text-gray-600">
                Manage your plan, billing cycle, and subscription settings
              </p>
            </div>
            {/* Cancel Subscription - Only show for paid plans */}
            {currentPlan !== WorkspacePlan.FREE && (
              <Button
                onClick={handleCancelClick}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Content can be added here for other subscription management features */}
        </CardContent>
      </Card>

      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelConfirm}
        currentPlan={currentPlan}
        periodEnd={periodEnd}
        isLoading={isLoading}
      />
    </>
  );
};
