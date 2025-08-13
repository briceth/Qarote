import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import { WorkspacePlan } from "@/types/plans";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { usePlanData } from "@/hooks/usePlan";
import { useState } from "react";

interface AddUserButtonProps {
  serverId: string;
  onUpgradeClick: () => void;
  onSuccess?: () => void;
  initialName?: string;
}

export const AddUserButton = ({
  serverId,
  onUpgradeClick,
  onSuccess,
  initialName = "",
}: AddUserButtonProps) => {
  const { workspacePlan, isLoading: workspaceLoading } = useWorkspace();
  const { usage } = usePlanData();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const userUsage = usage?.users || {
    current: 0,
    limit: 1,
    percentage: 0,
    canAdd: false,
  };

  // Users can be added by paid plan users
  const canAddUser = userUsage.canAdd;

  const getUserButtonConfig = () => {
    if (workspaceLoading || canAddUser) return null;

    switch (workspacePlan) {
      case WorkspacePlan.FREE:
        return {
          text: "Add user",
          badge: "Pro",
          badgeColor: "bg-orange-500",
          title: "Upgrade to add users",
        };
      case WorkspacePlan.DEVELOPER:
        return {
          text: "Add user",
          badge: `${userUsage.current}/${userUsage.limit || 3}`,
          badgeColor: "bg-blue-500",
          title: "You've reached your user limit. Upgrade to add more users.",
        };
      case WorkspacePlan.STARTUP:
        return {
          text: "Add user",
          badge: `${userUsage.current}/${userUsage.limit || 10}`,
          badgeColor: "bg-purple-500",
          title: "You've reached your user limit. Upgrade to add more users.",
        };
      case WorkspacePlan.BUSINESS:
        return {
          text: "Add user",
          badge: `${userUsage.current}/${userUsage.limit || 50}`,
          badgeColor: "bg-green-500",
          title:
            "You've reached your user limit. Contact support for enterprise solutions.",
        };
      default:
        return {
          text: "Add user",
          badge: "Pro",
          badgeColor: "bg-orange-500",
          title: "Upgrade to add users",
        };
    }
  };

  const handleAddUserClick = () => {
    if (!canAddUser) {
      onUpgradeClick();
    } else {
      setShowCreateModal(true);
    }
  };

  if (canAddUser) {
    return (
      <>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add user
        </Button>

        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          serverId={serverId}
          initialName={initialName}
          onSuccess={() => {
            setShowCreateModal(false);
            onSuccess?.();
          }}
        />
      </>
    );
  }

  const buttonConfig = getUserButtonConfig();
  if (!buttonConfig) return null;

  return (
    <Button
      onClick={handleAddUserClick}
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
