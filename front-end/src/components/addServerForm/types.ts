export interface SSLConfig {
  enabled: boolean;
  verifyPeer: boolean;
  caCertPath?: string;
  clientCertPath?: string;
  clientKeyPath?: string;
}

export interface AddServerFormData {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  vhost: string;
  sslConfig: SSLConfig;
}

export interface ConnectionStatus {
  status: "idle" | "success" | "error";
  message?: string;
  details?: {
    version?: string;
    cluster_name?: string;
  };
}

export interface AddServerFormProps {
  onServerAdded?: () => void;
  trigger?: React.ReactNode;
}
