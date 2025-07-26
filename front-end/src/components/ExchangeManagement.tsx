import { useState } from "react";
import { useCreateExchange, useDeleteExchange } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/useToast";
import { Loader2, Plus } from "lucide-react";

interface ExchangeManagementProps {
  serverId: string;
}

export const CreateExchangeDialog = ({ serverId }: ExchangeManagementProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [exchangeName, setExchangeName] = useState("");
  const [exchangeType, setExchangeType] = useState<string>("");
  const [durable, setDurable] = useState(true);
  const [autoDelete, setAutoDelete] = useState(false);
  const [internal, setInternal] = useState(false);

  const createExchangeMutation = useCreateExchange();

  const handleCreateExchange = async () => {
    if (!exchangeName || !exchangeType) {
      toast({
        title: "Validation Error",
        description: "Exchange name and type are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createExchangeMutation.mutateAsync({
        serverId,
        exchangeData: {
          name: exchangeName,
          type: exchangeType,
          durable,
          auto_delete: autoDelete,
          internal,
        },
      });

      toast({
        title: "Success",
        description: `Exchange "${exchangeName}" created successfully`,
      });

      // Reset form and close modal
      setExchangeName("");
      setExchangeType("");
      setDurable(true);
      setAutoDelete(false);
      setInternal(false);
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create exchange",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Exchange
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Exchange</DialogTitle>
          <DialogDescription>
            Create a new RabbitMQ exchange to route messages between queues.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exchange-name">Exchange Name</Label>
              <Input
                id="exchange-name"
                value={exchangeName}
                onChange={(e) => setExchangeName(e.target.value)}
                placeholder="Enter exchange name"
                disabled={createExchangeMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchange-type">Exchange Type</Label>
              <Select value={exchangeType} onValueChange={setExchangeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exchange type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="fanout">Fanout</SelectItem>
                  <SelectItem value="topic">Topic</SelectItem>
                  <SelectItem value="headers">Headers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="durable"
                checked={durable}
                onCheckedChange={(checked) => setDurable(checked === true)}
                disabled={createExchangeMutation.isPending}
              />
              <Label htmlFor="durable">Durable</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-delete"
                checked={autoDelete}
                onCheckedChange={(checked) => setAutoDelete(checked === true)}
                disabled={createExchangeMutation.isPending}
              />
              <Label htmlFor="auto-delete">Auto Delete</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="internal"
                checked={internal}
                onCheckedChange={(checked) => setInternal(checked === true)}
                disabled={createExchangeMutation.isPending}
              />
              <Label htmlFor="internal">Internal</Label>
            </div>
          </div>

          <Button
            onClick={handleCreateExchange}
            disabled={
              createExchangeMutation.isPending || !exchangeName || !exchangeType
            }
            className="w-full"
          >
            {createExchangeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Exchange
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExchangeDialog;
