import { useState } from "react";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { WorkspacePlan } from "@/types/plans";

interface AddUserButtonProps {
  serverId: string;
  onUpgradeClick: () => void;
  onSuccess?: () => void;
  initialName?: string;
  initialPassword?: string;
  initialTags?: string;
  initialVhost?: string;
}

export function AddUserButton({
  serverId,
  onUpgradeClick,
  onSuccess,
  initialName = "",
  initialPassword = "",
  initialTags = "",
  initialVhost = "/",
}: AddUserButtonProps) {
  const { workspacePlan, isLoading: workspaceLoading } = useWorkspace();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // For Free plan users, user creation is restricted
  const canAddUser = workspacePlan !== WorkspacePlan.FREE;

  const getUserButtonConfig = () => {
    if (workspaceLoading || canAddUser) return null;

    return {
      text: "Add user",
      badge: "Pro",
      badgeColor: "bg-orange-500",
      title: "Upgrade to add users",
    };
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
}
