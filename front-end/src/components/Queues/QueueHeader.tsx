import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SendMessageDialog } from "@/components/SendMessageDialog";
import { AddQueueButton } from "@/components/AddQueueButton";
import { MessageSquare, Lock } from "lucide-react";
import { WorkspacePlan } from "@/lib/plans/planUtils";

interface QueueHeaderProps {
  selectedServerId: string;
  workspacePlan: WorkspacePlan;
  queueCount: number;
  workspaceLoading: boolean;
  canAddQueue: boolean;
  canSendMessages: boolean;
  onAddQueueClick: () => void;
  onSendMessageClick: () => void;
  onRefetch?: () => void; // Callback to refresh queue data
}

export function QueueHeader({
  selectedServerId,
  workspacePlan,
  queueCount,
  workspaceLoading,
  canAddQueue,
  canSendMessages,
  onAddQueueClick,
  onSendMessageClick,
  onRefetch,
}: QueueHeaderProps) {
  const actions = (
    <>
      {/* Send Message Button with plan restrictions */}
      {canSendMessages ? (
        <SendMessageDialog
          serverId={selectedServerId}
          mode="exchange"
          onSuccess={onRefetch}
          trigger={
            <Button variant="outline" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Send Message
            </Button>
          }
        />
      ) : (
        <Button
          onClick={onSendMessageClick}
          disabled={true}
          variant="outline"
          className="flex items-center gap-2 opacity-60 cursor-not-allowed"
          title="Upgrade to send messages"
        >
          <Lock className="w-4 h-4" />
          Send Message
          <span className="ml-1 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-bold">
            Pro
          </span>
        </Button>
      )}

      {/* Add Queue Button with plan restrictions */}
      <AddQueueButton
        workspacePlan={workspacePlan}
        queueCount={queueCount}
        serverId={selectedServerId}
        workspaceLoading={workspaceLoading}
        onUpgradeClick={onAddQueueClick}
        onSuccess={onRefetch}
      />
    </>
  );

  return (
    <PageHeader
      title="Queue Management"
      subtitle="Manage and monitor all queues across your clusters"
      actions={actions}
      showSidebarTrigger={false}
    />
  );
}
