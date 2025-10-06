/**
 * Main entry point for Discourse infrastructure setup
 */
import { config } from "dotenv";
import { Command } from "commander";
import { Environment, Logger, validateEnvironment } from "../utils";
import { ensureSSHKey } from "./hetzner";
import { setupDiscourseInfrastructure } from "./servers-discourse";

// Load environment variables from .env file
config({ path: ".env" });

/**
 * Main Discourse setup function
 */
export async function setupDiscourseInfrastructureMain(
  environment: Environment
): Promise<void> {
  Logger.rocket(
    `Starting Discourse infrastructure setup for ${environment}...`
  );

  try {
    // Get SSH key
    const sshKey = await ensureSSHKey();
    Logger.success(`Using SSH key: ${sshKey.name}`);

    // Set up Discourse infrastructure
    const { discourseServer } = await setupDiscourseInfrastructure(
      sshKey.id,
      environment
    );

    Logger.success(
      `Discourse server ${discourseServer.name} is ready at ${discourseServer.public_net.ipv4.ip}`
    );

    // Display setup instructions
    await displayDiscourseSetupInstructions(discourseServer, environment);
  } catch (error) {
    Logger.error(
      `Discourse infrastructure setup failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}

/**
 * Display setup instructions after infrastructure has been created
 */
export async function displayDiscourseSetupInstructions(
  discourseServer: any,
  environment: Environment
): Promise<void> {
  const domain =
    environment === "production"
      ? "forum.rabbithq.io"
      : "forum-staging.rabbithq.io";

  Logger.rocket(`Discourse infrastructure setup completed for ${environment}!`);

  console.log(`
🎉 Discourse Infrastructure Ready!

📋 Server Details:
   Server: ${discourseServer.name}
   IP: ${discourseServer.public_net.ipv4.ip}

🌐 Domain Configuration:
   Domain: ${domain}
   SSL: Let's Encrypt enabled

💬 Discourse Stack:
   ✅ Docker and Docker Compose
   ✅ Discourse application ready for deployment
   ✅ SSL certificates (via Cloudflare)

📋 Next Steps:
1. Update DNS records:
   ${domain} → ${discourseServer.public_net.ipv4.ip}

2. Follow official Discourse installation guide:
   https://github.com/discourse/discourse_docker
   
3. Configure your domain: ${domain}

4. Set up SSL certificates

5. Complete Discourse setup wizard

🔧 Management Commands:
   Status: npm run discourse:status -- ${environment}
   Logs: npm run discourse:logs -- ${environment}
   Backup: npm run discourse:backup -- ${environment}

🎯 Your Discourse community is ready to go!
`);

  Logger.info("Discourse infrastructure setup completed successfully!");
}

/**
 * Main entry point when run directly
 */
async function main() {
  const program = new Command();

  program
    .name("setup-discourse")
    .description("Discourse infrastructure setup utility")
    .argument("<environment>", "Target environment (staging or production)")
    .addHelpText(
      "after",
      `
Examples:
  npm run discourse:setup:staging
  npm run discourse:setup:production
`
    )
    .action(async (env) => {
      try {
        // Parse and validate environment
        const environment = validateEnvironment(env);

        // Run the setup
        await setupDiscourseInfrastructureMain(environment);
      } catch (error) {
        Logger.error(
          `Discourse setup failed: ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
      }
    });

  program.parse();
}

// Run main function if script is called directly
const scriptPath = process.argv[1] || "";
const scriptName = scriptPath.split("/").pop();
if (
  scriptName === "index.js" ||
  scriptName === "index.ts" ||
  scriptName === "discourse-setup.js" ||
  scriptName === "discourse-setup.ts"
) {
  main();
}
