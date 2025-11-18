import { PageHeader } from "@/components/ui/PageHeader";
import { AddSendMessageButton } from "@/components/AddSendMessageButton";
import { AddQueueButton } from "@/components/AddQueueButton";

interface QueueHeaderProps {
  selectedServerId: string;
  queueCount: number;
  workspaceLoading: boolean;
  canAddQueue: boolean;
  canSendMessages: boolean;
  onAddQueueClick?: () => void;
  onSendMessageClick?: () => void;
  onRefetch?: () => void; // Callback to refresh queue data
}

export function QueueHeader({ selectedServerId, onRefetch }: QueueHeaderProps) {
  const actions = (
    <>
      {/* Send Message Button */}
      <AddSendMessageButton serverId={selectedServerId} onSuccess={onRefetch} />

      {/* Add Queue Button */}
      <AddQueueButton serverId={selectedServerId} onSuccess={onRefetch} />
    </>
  );

  return (
    <PageHeader
      title="Queues"
      subtitle="Manage and monitor all queues across your clusters"
      actions={actions}
      showSidebarTrigger={false}
    />
  );
}
