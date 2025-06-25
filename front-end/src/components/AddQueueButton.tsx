import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddQueueForm } from "@/components/AddQueueForm";
import { canUserAddQueueWithCount, WorkspacePlan } from "@/lib/plans/planUtils";

interface AddQueueButtonProps {
  workspacePlan: WorkspacePlan;
  queueCount: number;
  serverId: string;
  workspaceLoading: boolean;
  onUpgradeClick: () => void;
  onSuccess?: () => void;
}

export const AddQueueButton = ({
  workspacePlan,
  queueCount,
  serverId,
  workspaceLoading,
  onUpgradeClick,
  onSuccess,
}: AddQueueButtonProps) => {
  const canAddQueue = workspaceLoading
    ? false
    : canUserAddQueueWithCount(workspacePlan, queueCount);

  const getQueueButtonConfig = () => {
    if (workspaceLoading || canAddQueue) return null;

    switch (workspacePlan) {
      case "FREE":
        return {
          text: "Add Queue",
          badge: "Pro",
          badgeColor: "bg-orange-500",
          title: "Upgrade to add queues",
        };
      case "FREELANCE":
        return {
          text: "Add Queue",
          badge: `${queueCount}/10`,
          badgeColor: "bg-blue-500",
          title:
            "You've reached your queue limit (10). Upgrade to add more queues.",
        };
      case "STARTUP":
        return {
          text: "Add Queue",
          badge: `${queueCount}/50`,
          badgeColor: "bg-purple-500",
          title:
            "You've reached your queue limit (50). Upgrade to add more queues.",
        };
      case "BUSINESS":
        return {
          text: "Add Queue",
          badge: `${queueCount}/200`,
          badgeColor: "bg-green-500",
          title:
            "You've reached your queue limit (200). Contact support for enterprise solutions.",
        };
      default:
        return {
          text: "Add Queue",
          badge: "Pro",
          badgeColor: "bg-orange-500",
          title: "Upgrade to add queues",
        };
    }
  };

  const handleAddQueueClick = () => {
    if (!canAddQueue) {
      onUpgradeClick();
    }
  };

  if (canAddQueue) {
    return (
      <AddQueueForm
        serverId={serverId}
        onSuccess={onSuccess}
        trigger={
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Queue
          </Button>
        }
      />
    );
  }

  const buttonConfig = getQueueButtonConfig();
  if (!buttonConfig) return null;

  return (
    <Button
      onClick={handleAddQueueClick}
      disabled={true}
      className="bg-gray-200 text-gray-400 cursor-not-allowed opacity-60 flex items-center gap-2"
      title={buttonConfig.title}
    >
      <Lock className="w-4 h-4" />
      {buttonConfig.text}
      <span
        className={`ml-1 px-2 py-0.5 ${buttonConfig.badgeColor} text-white text-xs rounded-full font-bold`}
      >
        {buttonConfig.badge}
      </span>
    </Button>
  );
};
