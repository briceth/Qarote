import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SSLConfig } from "./types";

interface SSLConfigurationProps {
  sslConfig: SSLConfig;
  onSSLConfigChange: (field: keyof SSLConfig, value: string | boolean) => void;
}

export const SSLConfiguration = ({
  sslConfig,
  onSSLConfigChange,
}: SSLConfigurationProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-medium">SSL Configuration</Label>

        <div className="flex items-center space-x-3">
          <Switch
            checked={sslConfig.enabled}
            onCheckedChange={(checked) => onSSLConfigChange("enabled", checked)}
          />
          <Label className="text-sm font-medium">Enable SSL/TLS</Label>
        </div>

        {sslConfig.enabled && (
          <div className="space-y-6 ml-6 pl-6 border-l-2 border-blue-200 bg-blue-50/30 px-5 py-4 rounded-r-lg">
            <div className="grid gap-4">
              <div className="space-y-3">
                <Label htmlFor="caCertPath" className="text-sm font-medium">
                  CA Certificate Path (Optional)
                </Label>
                <Input
                  id="caCertPath"
                  placeholder="/path/to/ca-cert.pem"
                  value={sslConfig.caCertPath || ""}
                  onChange={(e) =>
                    onSSLConfigChange("caCertPath", e.target.value)
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="clientCertPath" className="text-sm font-medium">
                  Client Certificate Path (Optional)
                </Label>
                <Input
                  id="clientCertPath"
                  placeholder="/path/to/client-cert.pem"
                  value={sslConfig.clientCertPath || ""}
                  onChange={(e) =>
                    onSSLConfigChange("clientCertPath", e.target.value)
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="clientKeyPath" className="text-sm font-medium">
                  Client Private Key Path (Optional)
                </Label>
                <Input
                  id="clientKeyPath"
                  placeholder="/path/to/client-key.pem"
                  value={sslConfig.clientKeyPath || ""}
                  onChange={(e) =>
                    onSSLConfigChange("clientKeyPath", e.target.value)
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> SSL certificates should be accessible by
                the backend server. For production use, consider using a
                certificate management service.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
