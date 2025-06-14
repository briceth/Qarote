export const prisma = {
  alert: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  company: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  invitation: {
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  passwordResetToken: {
    findFirst: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  rabbitMQServer: { // Added for RabbitMQ controller
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  queue: { // Added for RabbitMQ controller
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(), // Often used with queues
  },
  queueMetric: { // Added for RabbitMQ controller
    create: jest.fn(),
    findMany: jest.fn(),
    // Add other methods if specific metric queries are needed
  },
  $transaction: jest.fn(async (callback) => callback(prisma)),
};
