/**
 * Hetzner Cloud API utilities
 */
import fs from "node:fs/promises";
import { Logger, Paths } from "../utils";
import { HetznerServer, HetznerLoadBalancer, HetznerSSHKey } from "./common";

/**
 * Hetzner Cloud API Configuration
 */
const HETZNER_API_URL = "https://api.hetzner.cloud/v1";

/**
 * Get Hetzner API token (checked dynamically)
 */
function getHetznerApiToken(): string {
  const token = process.env.HETZNER_API_TOKEN;
  if (!token) {
    throw new Error(
      "HETZNER_API_TOKEN environment variable is not set. Please set it in your .env file."
    );
  }
  return token;
}

/**
 * Make a request to Hetzner Cloud API using fetch
 */
export async function hetznerApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const HETZNER_API_TOKEN = getHetznerApiToken();

  const url = `${HETZNER_API_URL}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${HETZNER_API_TOKEN}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Hetzner API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    throw new Error(
      `Hetzner API request failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get or create SSH key in Hetzner Cloud
 */
export async function ensureSSHKey(): Promise<HetznerSSHKey> {
  Logger.info("Checking SSH key in Hetzner Cloud...");

  // Check for local SSH key first - use main id_rsa key
  const mainKeyPath = `${process.env.HOME || ""}/.ssh/id_rsa.pub`;
  let localPublicKey: string;
  let keyUsed: string;

  try {
    localPublicKey = await fs.readFile(mainKeyPath, "utf-8");
    keyUsed = "main";
    Logger.info("Using main SSH key from: " + mainKeyPath);
  } catch (error) {
    throw new Error(
      `Failed to read SSH public key from ${mainKeyPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  // Get all existing SSH keys
  try {
    const response = await hetznerApiRequest<{ ssh_keys: HetznerSSHKey[] }>(
      "/ssh_keys"
    );

    // First, try exact public key match
    const normalizedLocalKey = localPublicKey.trim().replace(/\s+/g, ' ');
    
    for (const key of response.ssh_keys) {
      const normalizedRemoteKey = key.public_key.trim().replace(/\s+/g, ' ');
      
      if (normalizedRemoteKey === normalizedLocalKey) {
        Logger.success(`Found existing SSH key with exact public key match: ${key.name} (ID: ${key.id})`);
        return key;
      }
    }

    // If no exact match, try to find any rabbithq key
    for (const key of response.ssh_keys) {
      if (key.name.includes("rabbithq") || key.name.startsWith("rabbithq-main-")) {
        Logger.success(`Found existing RabbitHQ SSH key: ${key.name} (ID: ${key.id})`);
        Logger.info("Using this key for infrastructure setup.");
        return key;
      }
    }

    // If no rabbithq keys, use the first available key
    if (response.ssh_keys.length > 0) {
      const firstKey = response.ssh_keys[0];
      Logger.success(`Using first available SSH key: ${firstKey.name} (ID: ${firstKey.id})`);
      return firstKey;
    }

    // No SSH keys found at all
    throw new Error(
      "No SSH keys found in your Hetzner Cloud account. Please add an SSH key manually through the Hetzner Cloud Console first."
    );

  } catch (error) {
    if (error instanceof Error && error.message.includes("No SSH keys found")) {
      throw error; // Re-throw our custom error
    }
    
    throw new Error(
      `Failed to retrieve SSH keys: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get existing server by name or create new one (idempotent)
 */
export async function getOrCreateHetznerServer(
  name: string,
  serverType: string,
  sshKeyId: number,
  environment: string
): Promise<HetznerServer> {
  Logger.info(`Checking if server '${name}' exists...`);

  try {
    // Try to find existing server by name
    const response = await hetznerApiRequest<{ servers: HetznerServer[] }>(
      "/servers",
      {
        method: "GET",
      }
    );

    const existingServer = response.servers.find((s) => s.name === name);
    if (existingServer) {
      Logger.success(
        `Found existing server '${name}' with ID ${existingServer.id} at IP ${existingServer.public_net.ipv4.ip}`
      );
      return existingServer;
    }

    // Create server if it doesn't exist
    Logger.info(`Server '${name}' not found, creating new one...`);
    return await createHetznerServer(name, serverType, sshKeyId, environment);
  } catch (error) {
    throw new Error(
      `Failed to check or create server '${name}': ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Load and customize cloud-config template
 */
export async function loadCloudConfig(publicKey: string): Promise<string> {
  const cloudConfigPath = `${Paths.scriptDir}/setup/cloud-config.yml`;

  try {
    const template = await fs.readFile(cloudConfigPath, "utf8");
    return template.replace(
      /\{\s*\{\s*SSH_PUBLIC_KEY\s*\}\s*\}/g,
      publicKey.trim()
    );
  } catch (error) {
    throw new Error(
      `Failed to load cloud-config template: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Create a server in Hetzner Cloud with rabbithq user
 */
export async function createHetznerServer(
  name: string,
  serverType: string,
  sshKeyId: number,
  environment: string
): Promise<HetznerServer> {
  Logger.info(`Creating ${serverType} server: ${name} with rabbithq user...`);

  // Read local SSH public key for cloud-config - use main id_rsa key
  const mainKeyPath = `${process.env.HOME || ""}/.ssh/id_rsa.pub`;
  let localPublicKey: string;

  try {
    localPublicKey = await fs.readFile(mainKeyPath, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to read SSH public key from ${mainKeyPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  // Load and customize cloud-config
  const cloudConfig = await loadCloudConfig(localPublicKey);

  const server = await hetznerApiRequest<{
    server: HetznerServer;
    action: unknown;
  }>("/servers", {
    method: "POST",
    body: JSON.stringify({
      name,
      server_type: serverType,
      image: "ubuntu-24.04",
      ssh_keys: [sshKeyId],
      location: "nbg1",
      labels: {
        project: "rabbithq",
        environment,
        created_by: "setup-script",
      },
      user_data: cloudConfig,
    }),
  });

  Logger.success(`Server created with rabbithq user, ID: ${server.server.id}`);
  return server.server;
}

/**
 * Get existing load balancer by name or create new one (idempotent)
 */
export async function getOrCreateHetznerLoadBalancer(
  name: string,
  serverIds: number[],
  environment: string
): Promise<HetznerLoadBalancer> {
  Logger.info(`Checking if load balancer '${name}' exists...`);

  try {
    // Try to find existing load balancer by name
    const response = await hetznerApiRequest<{
      load_balancers: HetznerLoadBalancer[];
    }>("/load_balancers", {
      method: "GET",
    });

    const existingLB = response.load_balancers.find((lb) => lb.name === name);
    if (existingLB) {
      Logger.success(
        `Found existing load balancer '${name}' with ID ${existingLB.id} at IP ${existingLB.public_net.ipv4.ip}`
      );
      return existingLB;
    }

    // Create load balancer if it doesn't exist
    Logger.info(`Load balancer '${name}' not found, creating new one...`);
    return await createHetznerLoadBalancer(name, serverIds, environment);
  } catch (error) {
    throw new Error(
      `Failed to check or create load balancer '${name}': ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Create a load balancer in Hetzner Cloud
 */
export async function createHetznerLoadBalancer(
  name: string,
  serverIds: number[],
  environment: string
): Promise<HetznerLoadBalancer> {
  Logger.info(`Creating load balancer: ${name}...`);

  const loadBalancer = await hetznerApiRequest<{
    load_balancer: HetznerLoadBalancer;
  }>("/load_balancers", {
    method: "POST",
    body: JSON.stringify({
      name,
      load_balancer_type: "lb11",
      location: "nbg1",
      algorithm: {
        type: "round_robin",
      },
      services: [
        {
          protocol: "http",
          listen_port: 80,
          destination_port: 80,
          health_check: {
            protocol: "http",
            port: 80,
            interval: 15,
            timeout: 10,
            retries: 3,
            http: {
              path: "/health",
            },
          },
        },
        {
          protocol: "tcp",
          listen_port: 443,
          destination_port: 443,
          health_check: {
            protocol: "tcp",
            port: 443,
            interval: 15,
            timeout: 10,
            retries: 3,
          },
        },
      ],
      targets: serverIds.map((id) => ({
        type: "server",
        server: { id },
        use_private_ip: false,
      })),
      labels: {
        project: "rabbithq",
        environment,
        created_by: "setup-script",
      },
    }),
  });

  Logger.success(
    `Load balancer created with ID: ${loadBalancer.load_balancer.id}`
  );
  return loadBalancer.load_balancer;
}

/**
 * Wait for server to be ready
 */
export async function waitForServerReady(
  serverId: number,
  maxAttempts: number = 50
): Promise<void> {
  Logger.info("Waiting for server to be ready...");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await hetznerApiRequest<{ server: HetznerServer }>(
        `/servers/${serverId}`,
        {
          method: "GET",
        }
      );

      if (response.server.status === "running") {
        Logger.success("Server is now running!");
        return;
      }
    } catch (error) {
      // Ignore error and continue retrying
    }

    Logger.info(`Attempt ${attempt}/${maxAttempts}, server not ready yet...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error("Server did not become ready within the expected time");
}
