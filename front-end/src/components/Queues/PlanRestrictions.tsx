import { Crown, MessageSquare, X } from "lucide-react";
import { WorkspacePlan } from "@/lib/plans/planUtils";

interface PlanRestrictionsProps {
  workspacePlan: WorkspacePlan;
  queueCount: number;
  canAddQueue: boolean;
  canSendMessages: boolean;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export function PlanRestrictions({
  workspacePlan,
  queueCount,
  canAddQueue,
  canSendMessages,
  onUpgrade,
  onDismiss,
}: PlanRestrictionsProps) {
  if (canAddQueue && canSendMessages) {
    return null;
  }

  const getQueueRestrictionMessage = () => {
    switch (workspacePlan) {
      case "FREE":
        return {
          title: "Queue creation is not available on the Free plan",
          description:
            "Upgrade to Freelance, Startup, or Business plan to create and manage custom queues.",
          buttonColor: "bg-orange-500 hover:bg-orange-600",
        };
      case "FREELANCE":
        return {
          title: `You've reached your queue limit (${queueCount}/10)`,
          description:
            "Upgrade to Startup plan for 50 queues or Business plan for 200 queues.",
          buttonColor: "bg-blue-500 hover:bg-blue-600",
        };
      case "STARTUP":
        return {
          title: `You've reached your queue limit (${queueCount}/50)`,
          description: "Upgrade to Business plan for 200 queues.",
          buttonColor: "bg-purple-500 hover:bg-purple-600",
        };
      case "BUSINESS":
        return {
          title: `You've reached your queue limit (${queueCount}/200)`,
          description:
            "Contact support for enterprise solutions with unlimited queues.",
          buttonColor: "bg-green-500 hover:bg-green-600",
        };
      default:
        return {
          title: "Queue creation is restricted",
          description: "Upgrade your plan to create more queues.",
          buttonColor: "bg-orange-500 hover:bg-orange-600",
        };
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {!canAddQueue && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg relative">
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-orange-100 rounded-full transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4 text-orange-600" />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <Crown className="w-5 h-5 text-orange-500" />
            <div>
              <p className="font-medium text-orange-900">
                {getQueueRestrictionMessage().title}
              </p>
              <p className="text-sm text-orange-700 mt-1">
                {getQueueRestrictionMessage().description}
              </p>
            </div>
            <button
              onClick={onUpgrade}
              className={`ml-auto px-4 py-2 ${getQueueRestrictionMessage().buttonColor} text-white rounded-lg font-medium transition-colors`}
            >
              {workspacePlan === "BUSINESS" ? "Contact Support" : "Upgrade Now"}
            </button>
          </div>
        </div>
      )}

      {!canSendMessages && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg relative">
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <MessageSquare className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-900">
                Message sending is not available on the Free plan
              </p>
              <p className="text-sm text-red-700 mt-1">
                Upgrade to send messages to queues. Freelance: 100/month,
                Startup: 1,000/month, Business: unlimited.
              </p>
            </div>
            <button
              onClick={onUpgrade}
              className="ml-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
