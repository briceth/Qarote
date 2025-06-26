import { useState } from "react";
import {
  MoreVertical,
  Edit,
  Trash2,
  Server as ServerIcon,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdownMenu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alertDialog";
import { EditServerDialog } from "@/components/EditServerDialog";
import { useServerContext } from "@/contexts/ServerContext";
import { useDeleteServer } from "@/hooks/useServerMutations";
import { Server } from "@/lib/api/types";

interface ServerActionsMenuProps {
  server: Server;
  onServerUpdated?: () => void;
}

export function ServerActionsMenu({
  server,
  onServerUpdated,
}: ServerActionsMenuProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { selectedServerId, setSelectedServerId } = useServerContext();
  const deleteServerMutation = useDeleteServer();

  const handleDeleteServer = async () => {
    try {
      await deleteServerMutation.mutateAsync(server.id);

      // If the deleted server was selected, clear the selection
      if (selectedServerId === server.id) {
        setSelectedServerId(null);
      }

      toast.success(`Server "${server.name}" has been deleted successfully`);
      setIsDeleteDialogOpen(false);
      onServerUpdated?.();
    } catch (error) {
      toast.error("Failed to delete server. Please try again.");
      console.error("Delete server error:", error);
    }
  };

  const handleEditServer = () => {
    setIsEditDialogOpen(true);
  };

  const handleServerUpdated = () => {
    setIsEditDialogOpen(false);
    onServerUpdated?.();
    toast.success(`Server "${server.name}" has been updated successfully`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <MoreVertical className="h-3 w-3" />
            <span className="sr-only">Server actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={handleEditServer}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Server
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`http://${server.host}:15672`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Management UI
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Server
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Server Dialog */}
      <EditServerDialog
        server={server}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onServerUpdated={handleServerUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Server
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete the server{" "}
                <strong>"{server.name}"</strong>?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <ServerIcon className="h-4 w-4" />
                  <span>
                    {server.host}:{server.port} ({server.vhost})
                  </span>
                </div>
              </div>
              <p className="text-red-600 font-medium">
                This action cannot be undone. All associated data and
                configurations will be permanently removed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteServer}
              disabled={deleteServerMutation.isPending}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {deleteServerMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Server
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
