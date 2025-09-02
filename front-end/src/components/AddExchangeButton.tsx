import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspacePlan } from "@/types/plans";
import { useWorkspace } from "@/hooks/useWorkspace";

interface AddExchangeButtonProps {
  onUpgradeClick: () => void;
  onAddClick?: () => void;
}

export const AddExchangeButton = ({
  onUpgradeClick,
  onAddClick,
}: AddExchangeButtonProps) => {
  const { workspacePlan, isLoading: workspaceLoading } = useWorkspace();

  // For Free plan users, exchange creation is restricted
  const canAddExchange = workspacePlan !== WorkspacePlan.FREE;

  const getExchangeButtonConfig = () => {
    if (workspaceLoading || canAddExchange) return null;

    return {
      text: "Add Exchange",
      badge: "Pro",
      badgeColor: "bg-orange-500",
      title: "Upgrade to add exchanges",
    };
  };

  const handleAddExchangeClick = () => {
    if (!canAddExchange) {
      onUpgradeClick();
    } else {
      onAddClick?.();
    }
  };

  if (canAddExchange) {
    return (
      <Button
        onClick={onAddClick}
        className="btn-primary flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Exchange
      </Button>
    );
  }

  const buttonConfig = getExchangeButtonConfig();
  if (!buttonConfig) return null;

  return (
    <Button
      onClick={handleAddExchangeClick}
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
