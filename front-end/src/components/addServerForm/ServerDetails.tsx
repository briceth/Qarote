import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddServerFormData } from "./types";

interface ServerDetailsProps {
  formData: AddServerFormData;
  errors: Partial<Record<keyof AddServerFormData, string>>;
  onInputChange: (
    field: keyof AddServerFormData,
    value: string | number
  ) => void;
}

export const ServerDetails = ({
  formData,
  errors,
  onInputChange,
}: ServerDetailsProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Server Details</Label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Server Name</Label>
          <Input
            id="name"
            placeholder="Production RabbitMQ"
            value={formData.name}
            onChange={(e) => onInputChange("name", e.target.value)}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="host">Host</Label>
          <Input
            id="host"
            placeholder="localhost"
            value={formData.host}
            onChange={(e) => onInputChange("host", e.target.value)}
            className={errors.host ? "border-red-500" : ""}
          />
          {errors.host && <p className="text-sm text-red-500">{errors.host}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            type="number"
            placeholder="15672"
            value={formData.port}
            onChange={(e) =>
              onInputChange("port", parseInt(e.target.value) || 15672)
            }
            className={errors.port ? "border-red-500" : ""}
          />
          {errors.port && <p className="text-sm text-red-500">{errors.port}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vhost">Virtual Host</Label>
          <Input
            id="vhost"
            placeholder="/"
            value={formData.vhost}
            onChange={(e) => onInputChange("vhost", e.target.value)}
            className={errors.vhost ? "border-red-500" : ""}
          />
          {errors.vhost && (
            <p className="text-sm text-red-500">{errors.vhost}</p>
          )}
        </div>
      </div>
    </div>
  );
};
