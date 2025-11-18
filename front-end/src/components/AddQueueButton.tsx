import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddQueueForm } from "@/components/AddQueueForm";

interface AddQueueButtonProps {
  serverId: string;
  onSuccess?: () => void;
}

export const AddQueueButton = ({
  serverId,
  onSuccess,
}: AddQueueButtonProps) => {
  return (
    <AddQueueForm
      serverId={serverId}
      onSuccess={onSuccess}
      trigger={
        <Button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Queue
        </Button>
      }
    />
  );
};
