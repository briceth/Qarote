/**
 * Discourse server configuration and provisioning utilities
 */
import { Logger, Paths } from "../utils";
import {
  HetznerServer,
  executeRemoteCommands,
  uploadFile,
  waitForSSH,
} from "./common";
import {
  getOrCreateHetznerServer,
  waitForServerReady,
  ensureProductionApplicationFirewall,
  ensureDiscourseVolume,
  attachVolumeToServer,
} from "./hetzner";

/**
 * Get Discourse server config options
 */
export function getDiscourseServerConfig(environment: string): {
  name: string;
  type: string;
} {
  const isProduction = environment === "production";

  return {
    name: `rabbithq-discourse-${environment}`,
    type: isProduction ? "cpx31" : "cpx21", // CPX31 for production, CPX21 for staging
  };
}

/**
 * Set up a Discourse server with complete stack (staging)
 */
export async function setupDiscourseServer(
  server: HetznerServer,
  environment: string
): Promise<void> {
  const serverIP = server.public_net.ipv4.ip;
  Logger.info(
    `Setting up Discourse server at ${serverIP} for ${environment}...`
  );

  await waitForSSH(serverIP);

  // Create customized setup script
  const scriptContent = await createDiscourseSetupScript(environment);
  const scriptPath = "/tmp/discourse-setup.sh";

  // Write script to temporary file
  const fs = await import("node:fs/promises");
  await fs.writeFile(scriptPath, scriptContent);

  // Upload and execute script
  await uploadFile(serverIP, scriptPath, "/tmp/discourse-setup.sh");

  const scriptOutput = await executeRemoteCommands(serverIP, [
    "sudo chmod +x /tmp/discourse-setup.sh",
    `sudo /tmp/discourse-setup.sh`,
  ]);

  if (scriptOutput.toLowerCase().includes("error")) {
    Logger.error("Discourse server setup encountered errors:");
    Logger.error(scriptOutput);
    throw new Error("Discourse server setup failed");
  }

  Logger.success("Discourse server setup completed successfully!");
}

/**
 * Create customized Discourse setup script
 */
async function createDiscourseSetupScript(
  environment: string
): Promise<string> {
  const fs = await import("node:fs/promises");
  const templatePath =
    environment === "production"
      ? `${Paths.scriptDir}/setup/discourse-setup-production.sh`
      : `${Paths.scriptDir}/setup/discourse-setup.sh`;

  try {
    // Read the template script
    const templateContent = await fs.readFile(templatePath, "utf-8");

    // Determine domain and SSO secret based on environment
    const domain =
      environment === "production"
        ? "forum.rabbithq.io"
        : "forum-staging.rabbithq.io";

    const ssoSecret = "gagyJ/OHhh35SS5Cl0P6FrcMju+RIPN94xcOIasWba4=";

    // Replace placeholders
    const customizedScript = templateContent
      .replace(/\{\{ENVIRONMENT\}\}/g, environment)
      .replace(/\{\{DOMAIN\}\}/g, domain)
      .replace(/\{\{SSO_SECRET\}\}/g, ssoSecret);

    return customizedScript;
  } catch (error) {
    throw new Error(
      `Failed to create Discourse setup script: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Provision and configure Discourse server
 */
export async function provisionDiscourseServer(
  sshKeyId: number,
  environment: string
): Promise<HetznerServer> {
  Logger.info(`Provisioning Discourse server for ${environment}...`);

  const config = getDiscourseServerConfig(environment);

  // Ensure firewall exists (reuse existing app firewall for Discourse)
  const firewall = await ensureProductionApplicationFirewall();

  const server = await getOrCreateHetznerServer(
    config.name,
    config.type,
    sshKeyId,
    environment,
    firewall.id
  );

  await waitForServerReady(server.id);

  // Only attach volume for production environment
  if (environment === "production") {
    // Create a dedicated volume for Discourse instead of reusing the database volume
    const discourseVolume = await ensureDiscourseVolume();
    await attachVolumeToServer(discourseVolume.id, server.id, true);
  }

  await setupDiscourseServer(server, environment);

  return server;
}

/**
 * Configure Discourse server after setup
 */
export async function configureDiscourseServer(
  server: HetznerServer,
  environment: string
): Promise<void> {
  const serverIP = server.public_net.ipv4.ip;
  const domain =
    environment === "production"
      ? "forum.rabbithq.io"
      : "forum-staging.rabbithq.io";

  Logger.info(`Domain: ${domain}`);
  Logger.info(`Configuring Discourse server at ${serverIP}...`);

  await waitForSSH(serverIP);

  // Additional configuration commands
  await executeRemoteCommands(serverIP, [
    // Ensure Docker is running
    "sudo systemctl start docker",
    "sudo systemctl enable docker",
    // Check Docker status
    "docker --version",
    "docker compose version",
  ]);

  Logger.success("Discourse server configuration completed!");
}

/**
 * Setup complete Discourse infrastructure
 */
export async function setupDiscourseInfrastructure(
  sshKeyId: number,
  environment: string
): Promise<{ discourseServer: HetznerServer }> {
  Logger.rocket(`Setting up Discourse infrastructure for ${environment}...`);

  // Provision Discourse server (all-in-one)
  const discourseServer = await provisionDiscourseServer(sshKeyId, environment);

  // Configure server
  await configureDiscourseServer(discourseServer, environment);

  Logger.success(
    `Discourse infrastructure setup completed for ${environment}!`
  );

  return { discourseServer };
}
