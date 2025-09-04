#!/usr/bin/env npx tsx
import amqp from "amqplib";

interface RabbitMQConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  managementPort: number;
}

class RatesActivityGenerator {
  private config: RabbitMQConfig;
  private publisherConnection: amqp.ChannelModel | null = null;
  private consumerConnection: amqp.ChannelModel | null = null;
  private publisherChannel: amqp.Channel | null = null;
  private consumerChannel: amqp.Channel | null = null;
  private isRunning: boolean = false;
  private stats = {
    published: 0,
    consumed: 0,
    acked: 0,
    rejected: 0,
    errors: 0,
  };

  constructor(config: RabbitMQConfig) {
    this.config = config;
  }

  private async waitForRabbitMQ(): Promise<void> {
    console.log("⏳ Waiting for RabbitMQ to be ready...");
    const maxRetries = 30;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const connection = await amqp.connect({
          hostname: this.config.host,
          port: this.config.port,
          username: this.config.username,
          password: this.config.password,
        });
        await connection.close();
        console.log("✅ RabbitMQ is ready!");
        return;
      } catch (error) {
        console.log(
          `⏳ RabbitMQ not ready. Retry ${retries + 1}/${maxRetries}...`
        );
        await this.sleep(2000);
        retries++;
      }
    }
    throw new Error("❌ RabbitMQ failed to become ready within timeout");
  }

  private async connect(): Promise<void> {
    try {
      // Create separate connections for publishing and consuming
      this.publisherConnection = await amqp.connect({
        hostname: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
      });

      this.consumerConnection = await amqp.connect({
        hostname: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
      });

      this.publisherChannel = await this.publisherConnection.createChannel();
      this.consumerChannel = await this.consumerConnection.createChannel();

      // Set prefetch for better consumer performance
      await this.consumerChannel.prefetch(10);

      console.log(
        "✅ Connected to RabbitMQ with separate publisher and consumer connections"
      );
    } catch (error) {
      console.error("❌ Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.publisherChannel) await this.publisherChannel.close();
      if (this.consumerChannel) await this.consumerChannel.close();
      if (this.publisherConnection) await this.publisherConnection.close();
      if (this.consumerConnection) await this.consumerConnection.close();
      console.log("✅ Disconnected from RabbitMQ");
    } catch (error) {
      console.error("❌ Error disconnecting:", error);
    }
  }

  private async setupInfrastructure(): Promise<void> {
    if (!this.publisherChannel || !this.consumerChannel) {
      throw new Error("Channels not initialized");
    }

    console.log("🔧 Setting up rates testing infrastructure...");

    // Create exchanges for different patterns
    const exchanges = [
      { name: "rates.direct", type: "direct" },
      { name: "rates.fanout", type: "fanout" },
      { name: "rates.topic", type: "topic" },
    ];

    for (const exchange of exchanges) {
      await this.publisherChannel.assertExchange(exchange.name, exchange.type, {
        durable: true,
      });
      console.log(`  ✅ Created exchange: ${exchange.name} (${exchange.type})`);
    }

    // Create queues for different usage patterns
    const queues = [
      { name: "rates.high.throughput", routingKey: "high" },
      { name: "rates.medium.throughput", routingKey: "medium" },
      { name: "rates.low.throughput", routingKey: "low" },
      { name: "rates.fanout.queue1", routingKey: "" },
      { name: "rates.fanout.queue2", routingKey: "" },
      { name: "rates.topic.orders", routingKey: "orders.*" },
      { name: "rates.topic.users", routingKey: "users.*" },
    ];

    for (const queue of queues) {
      await this.publisherChannel.assertQueue(queue.name, { durable: true });

      // Bind to direct exchange
      if (
        queue.routingKey &&
        !queue.name.includes("fanout") &&
        !queue.name.includes("topic")
      ) {
        await this.publisherChannel.bindQueue(
          queue.name,
          "rates.direct",
          queue.routingKey
        );
      }

      // Bind fanout queues
      if (queue.name.includes("fanout")) {
        await this.publisherChannel.bindQueue(queue.name, "rates.fanout", "");
      }

      // Bind topic queues
      if (queue.name.includes("topic")) {
        await this.publisherChannel.bindQueue(
          queue.name,
          "rates.topic",
          queue.routingKey
        );
      }

      console.log(`  ✅ Created and bound queue: ${queue.name}`);
    }

    console.log("✅ Infrastructure setup complete!");
  }

  private async startPublishing(messagesPerSecond: number = 10): Promise<void> {
    if (!this.publisherChannel)
      throw new Error("Publisher channel not initialized");

    const intervalMs = 1000 / messagesPerSecond;
    console.log(
      `🚀 Starting publisher: ${messagesPerSecond} msgs/sec (${intervalMs}ms interval)`
    );

    const publishInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(publishInterval);
        return;
      }

      try {
        const timestamp = new Date().toISOString();

        // Publish to different exchanges to generate various rates
        const publishTasks = [
          // Direct exchange messages
          this.publishMessage("rates.direct", "high", {
            type: "high_throughput",
            timestamp,
            data: { value: Math.random() * 100 },
          }),
          this.publishMessage("rates.direct", "medium", {
            type: "medium_throughput",
            timestamp,
            data: { value: Math.random() * 50 },
          }),
          this.publishMessage("rates.direct", "low", {
            type: "low_throughput",
            timestamp,
            data: { value: Math.random() * 25 },
          }),

          // Fanout messages (will go to multiple queues)
          this.publishMessage("rates.fanout", "", {
            type: "broadcast",
            timestamp,
            data: { message: "Fanout message" },
          }),

          // Topic messages
          this.publishMessage("rates.topic", "orders.created", {
            type: "order_event",
            timestamp,
            data: { orderId: Math.floor(Math.random() * 10000) },
          }),
          this.publishMessage("rates.topic", "users.registered", {
            type: "user_event",
            timestamp,
            data: { userId: Math.floor(Math.random() * 1000) },
          }),
        ];

        await Promise.all(publishTasks);
        this.stats.published += publishTasks.length;
      } catch (error) {
        this.stats.errors++;
        console.error("❌ Publishing error:", error);
      }
    }, intervalMs);
  }

  private async publishMessage(
    exchange: string,
    routingKey: string,
    message: any
  ): Promise<void> {
    if (!this.publisherChannel)
      throw new Error("Publisher channel not initialized");

    const messageBuffer = Buffer.from(JSON.stringify(message));

    this.publisherChannel.publish(exchange, routingKey, messageBuffer, {
      persistent: true,
      timestamp: Date.now(),
      messageId: `msg-${Date.now()}-${Math.random()}`,
      contentType: "application/json",
    });
  }

  private async startConsuming(): Promise<void> {
    if (!this.consumerChannel)
      throw new Error("Consumer channel not initialized");

    console.log("🔥 Starting consumers...");

    const queues = [
      "rates.high.throughput",
      "rates.medium.throughput",
      "rates.low.throughput",
      "rates.fanout.queue1",
      "rates.fanout.queue2",
      "rates.topic.orders",
      "rates.topic.users",
    ];

    for (const queueName of queues) {
      await this.consumerChannel.consume(
        queueName,
        async (message) => {
          if (!message) return;

          try {
            // Simulate different processing behaviors
            const shouldAck = Math.random() > 0.1; // 90% ack rate
            const shouldReject = Math.random() > 0.95; // 5% reject rate

            // Simulate processing time
            const processingTime = Math.random() * 50; // 0-50ms
            await this.sleep(processingTime);

            if (shouldReject) {
              // Reject and requeue sometimes to generate reject rates
              this.consumerChannel?.reject(message, Math.random() > 0.5);
              this.stats.rejected++;
            } else if (shouldAck) {
              this.consumerChannel?.ack(message);
              this.stats.acked++;
            } else {
              // Let some messages timeout to generate different patterns
              // Don't ack or reject
            }

            this.stats.consumed++;
          } catch (error) {
            this.stats.errors++;
            this.consumerChannel?.reject(message, false);
          }
        },
        {
          noAck: false, // We want to control acking for rate generation
        }
      );
    }

    console.log(`✅ Started consumers for ${queues.length} queues`);
  }

  private async printStats(): Promise<void> {
    const statsInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(statsInterval);
        return;
      }

      console.log(`\n📊 Live Stats:`);
      console.log(`  📤 Published: ${this.stats.published} messages`);
      console.log(`  📥 Consumed: ${this.stats.consumed} messages`);
      console.log(`  ✅ Acknowledged: ${this.stats.acked} messages`);
      console.log(`  ❌ Rejected: ${this.stats.rejected} messages`);
      console.log(`  💥 Errors: ${this.stats.errors} messages`);
      console.log(`  🔄 Current rates should be visible in dashboard...`);
    }, 5000); // Print stats every 5 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async run(
    durationMinutes: number = 5,
    messagesPerSecond: number = 20
  ): Promise<void> {
    try {
      console.log(`🚀 Starting Rates Activity Generator`);
      console.log(`   Duration: ${durationMinutes} minutes`);
      console.log(`   Rate: ${messagesPerSecond} messages/second`);
      console.log(
        `   Expected total: ~${durationMinutes * 60 * messagesPerSecond} messages\n`
      );

      await this.waitForRabbitMQ();
      await this.connect();
      await this.setupInfrastructure();

      this.isRunning = true;

      // Start all activities
      await this.startConsuming();
      await this.startPublishing(messagesPerSecond);
      this.printStats();

      console.log(
        `\n🎯 Activity started! Check your RabbitMQ dashboard rates chart now!`
      );
      console.log(
        `   The rates should show live data updating every 5 seconds.`
      );
      console.log(`   Press Ctrl+C to stop early.\n`);

      // Run for specified duration
      await this.sleep(durationMinutes * 60 * 1000);

      console.log(`\n⏰ ${durationMinutes} minutes completed!`);
    } catch (error) {
      console.error("💥 Error running rates activity generator:", error);
      throw error;
    } finally {
      this.isRunning = false;
      await this.sleep(2000); // Allow time for cleanup
      await this.disconnect();

      console.log(`\n📊 Final Stats:`);
      console.log(`  📤 Total Published: ${this.stats.published} messages`);
      console.log(`  📥 Total Consumed: ${this.stats.consumed} messages`);
      console.log(`  ✅ Total Acknowledged: ${this.stats.acked} messages`);
      console.log(`  ❌ Total Rejected: ${this.stats.rejected} messages`);
      console.log(`  💥 Total Errors: ${this.stats.errors} messages`);
    }
  }
}

// Main execution
async function main() {
  const config: RabbitMQConfig = {
    host: process.env.RABBITMQ_HOST || "localhost",
    port: parseInt(process.env.RABBITMQ_PORT || "5672"),
    username: process.env.RABBITMQ_USER || "admin",
    password: process.env.RABBITMQ_PASS || "admin123",
    managementPort: parseInt(process.env.RABBITMQ_MANAGEMENT_PORT || "15672"),
  };

  // Parse command line arguments
  const durationArg = process.argv[2];
  const rateArg = process.argv[3];

  const durationMinutes = durationArg ? parseInt(durationArg) : 5;
  const messagesPerSecond = rateArg ? parseInt(rateArg) : 20;

  if (isNaN(durationMinutes) || durationMinutes <= 0) {
    console.error(
      "❌ Invalid duration. Please provide a positive number of minutes."
    );
    process.exit(1);
  }

  if (isNaN(messagesPerSecond) || messagesPerSecond <= 0) {
    console.error(
      "❌ Invalid rate. Please provide a positive number of messages per second."
    );
    process.exit(1);
  }

  console.log("🔧 Configuration:");
  console.log(`  🏠 Host: ${config.host}:${config.port}`);
  console.log(`  👤 User: ${config.username}`);
  console.log(`  🔒 Password: ${config.password}`);
  console.log(`  📊 Management Port: ${config.managementPort}`);
  console.log(`  ⏱️  Duration: ${durationMinutes} minutes`);
  console.log(`  🚀 Rate: ${messagesPerSecond} messages/second\n`);

  const generator = new RatesActivityGenerator(config);

  try {
    await generator.run(durationMinutes, messagesPerSecond);
    console.log("\n🎉 Rates activity generation completed!");
    console.log(
      "   Check your dashboard to see if the rates chart updated correctly."
    );
  } catch (error) {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

export { RatesActivityGenerator };
