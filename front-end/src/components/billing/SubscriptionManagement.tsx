import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Clock } from "lucide-react";
import { WorkspacePlan } from "@/types/plans";
import { CancelSubscriptionModal } from "./CancelSubscriptionModal";

interface CancelSubscriptionResponse {
  success: boolean;
  subscription: {
    id: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
    canceledAt: string | null;
  };
  message: string;
}

interface SubscriptionManagementProps {
  currentPlan: WorkspacePlan;
  onOpenBillingPortal: () => void;
  onUpgrade: (plan: WorkspacePlan, interval: "monthly" | "yearly") => void;
  onCancelSubscription: (data: {
    cancelImmediately: boolean;
    reason: string;
    feedback: string;
  }) => Promise<CancelSubscriptionResponse>;
  periodEnd?: string;
  isLoading?: boolean;
  cancelAtPeriodEnd?: boolean;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  currentPlan,
  // onOpenBillingPortal,
  // onUpgrade,
  onCancelSubscription,
  periodEnd,
  isLoading,
  cancelAtPeriodEnd,
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
              <>
                {cancelAtPeriodEnd ? (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                    <Clock className="w-4 h-4" />
                    <div className="text-sm">
                      <div className="font-medium">Subscription ending</div>
                      <div className="text-xs text-amber-700">
                        Will end on{" "}
                        {periodEnd
                          ? new Date(periodEnd).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "end of period"}
                      </div>
                    </div>
                  </div>
                ) : (
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
              </>
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
