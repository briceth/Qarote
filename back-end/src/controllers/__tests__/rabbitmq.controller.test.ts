import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Hono } from 'hono';
import { prisma } from '../../core/__mocks__/prisma';
import { RabbitMQClient } from '../../core/rabbitmq'; // Actual class to be mocked
import {
  getRabbitMQOverview,
  getRabbitMQQueues,
  getRabbitMQNodes,
  getRabbitMQQueueByName,
  getDirectRabbitMQOverview,
  getDirectRabbitMQQueues,
  getDirectRabbitMQNodes,
  getRabbitMQMetrics,
  testRabbitMQConnectionWithMetrics,
} from '../rabbitmq.controller'; // Adjust path as necessary

// Mock the RabbitMQClient constructor and its methods
jest.mock('../../core/rabbitmq', () => {
  return {
    RabbitMQClient: jest.fn().mockImplementation(() => {
      return {
        getOverview: jest.fn(),
        getQueues: jest.fn(),
        getNodes: jest.fn(),
        getQueue: jest.fn(),
        getMetrics: jest.fn(), // For combined metrics endpoint
        getQueueMetrics: jest.fn(), // If separate, or part of getMetrics
        getNodeMetrics: jest.fn(), // If separate, or part of getMetrics
        testConnection: jest.fn(), // For the test connection endpoint
        // Add any other methods that are used by the controller
      };
    }),
  };
});


// Mock Hono context
const mockContext = (
  method: string,
  params: any = {},
  body: any = null,
  validData: any = null,
  user: any = null // For potential future use with authenticated RabbitMQ server access
) => {
  const req = {
    method,
    param: (key: string) => params[key],
    json: async () => body,
    query: (key:string) => params[key],
    valid: (target: 'json' | 'query' | 'param' | 'header' | 'cookie') => validData,
  } as any;

  const res = {
    statusVal: 0,
    jsonBody: null,
    json: function (data: any) {
      this.jsonBody = data;
      return this;
    },
    status: function (statusCode: number) {
      this.statusVal = statusCode;
      return this;
    },
  } as any;

  const honoContext: any = {
    req,
    res,
    ...res,
    get: (key: string) => {
      if (key === 'user') return user;
      return undefined;
    },
    set: jest.fn(),
    next: jest.fn(),
  };
  return honoContext;
};

// Helper to get the latest mock instance of RabbitMQClient
const getMockRabbitMQClientInstance = () => {
  const MockedRabbitMQClient = RabbitMQClient as jest.MockedClass<typeof RabbitMQClient>;
  return MockedRabbitMQClient.mock.instances[0];
};


describe('RabbitMQ Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear mock implementations for RabbitMQClient methods if they are set per test
    const clientInstance = getMockRabbitMQClientInstance();
    if (clientInstance) {
        Object.values(clientInstance).forEach(mockFn => {
            if (jest.isMockFunction(mockFn)) {
                mockFn.mockReset();
            }
        });
    }
     // Also clear Prisma mocks
    Object.values(prisma.alert).forEach(mockFn => mockFn.mockReset());
    Object.values(prisma.user).forEach(mockFn => mockFn.mockReset());
    Object.values(prisma.company).forEach(mockFn => mockFn.mockReset());
    Object.values(prisma.invitation).forEach(mockFn => mockFn.mockReset());
    Object.values(prisma.passwordResetToken).forEach(mockFn => mockFn.mockReset());
    if (prisma.rabbitMQServer) { // Check if rabbitMQServer mock exists
        Object.values(prisma.rabbitMQServer).forEach(mockFn => mockFn.mockReset());
    }
    if (prisma.queue) { // Check if queue mock exists
        Object.values(prisma.queue).forEach(mockFn => mockFn.mockReset());
    }
     if (prisma.queueMetric) { // Check if queueMetric mock exists
        Object.values(prisma.queueMetric).forEach(mockFn => mockFn.mockReset());
    }
    (prisma.$transaction as jest.Mock).mockReset();


  });

  // Test suites for each controller function will go here

  describe('GET /servers/:id/overview (getRabbitMQOverview)', () => {
    const serverId = 'server1';
    const mockServer = { id: serverId, name: 'Test Server', apiUrl: 'http://localhost:15672', username: 'user', passwordToken: 'passToken', companyId: 'comp1' };
    const mockOverviewData = { node: 'rabbit@localhost', version: '3.9.0' };

    it('should return RabbitMQ overview for a valid server ID', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(mockServer);
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getOverview as jest.Mock).mockResolvedValue(mockOverviewData);

      const c = mockContext('GET', { id: serverId });
      await getRabbitMQOverview(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(RabbitMQClient).toHaveBeenCalledWith(mockServer.apiUrl, mockServer.username, mockServer.passwordToken);
      expect(clientInstance.getOverview).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockOverviewData);
    });

    it('should return 404 if server not found', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(null);
      const c = mockContext('GET', { id: serverId });
      await getRabbitMQOverview(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(RabbitMQClient).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'RabbitMQ server configuration not found.' });
    });

    it('should handle errors from RabbitMQClient', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(mockServer);
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getOverview as jest.Mock).mockRejectedValue(new Error('RabbitMQ API error'));

      const c = mockContext('GET', { id: serverId });
      await getRabbitMQOverview(c as any);

      expect(RabbitMQClient).toHaveBeenCalledWith(mockServer.apiUrl, mockServer.username, mockServer.passwordToken);
      expect(clientInstance.getOverview).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch RabbitMQ overview', details: 'RabbitMQ API error' });
    });
     it('should handle errors if Prisma findUnique fails', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockRejectedValue(new Error('Prisma DB error'));
      const c = mockContext('GET', { id: serverId });
      await getRabbitMQOverview(c as any);

      expect(RabbitMQClient).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch RabbitMQ overview', details: 'Prisma DB error' });
    });
  });

  describe('GET /servers/:id/queues (getRabbitMQQueues)', () => {
    const serverId = 'server1';
    const mockServer = { id: serverId, name: 'Test Server', apiUrl: 'http://localhost:15672', username: 'user', passwordToken: 'passToken', companyId: 'comp1' };
    const mockQueuesData = [
      { name: 'queue1', vhost: '/', messages: 10, consumers: 1, state: 'running', node: 'rabbit@node1', memory: 1024, message_stats: { publish_details: { rate: 0.5 } } },
      { name: 'queue2', vhost: '/', messages: 5, consumers: 0, state: 'idle', node: 'rabbit@node2', memory: 512, message_stats: { publish_details: { rate: 0.1 } } },
    ];
    const mockQueueMetricId = 'metric-id-123';

    beforeEach(() => {
        (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(mockServer);
        (prisma.queue.upsert as jest.Mock).mockImplementation(async ({ where, create, update }) => ({ // Simulate upsert returning the queue
            id: `qid-${where.name}-${where.vhost}-${where.rabbitMQServerId}`,
            ...create,
            ...update,
        }));
        (prisma.queueMetric.create as jest.Mock).mockResolvedValue({ id: mockQueueMetricId, queueId: 'qid-queue1-/-server1', messages: 10, consumerCount: 1, publishRate: 0.5, memory: 1024 });
        (lucia.generateId as jest.Mock).mockReturnValue(mockQueueMetricId); // For queueMetric id
        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(prisma));
    });

    it('should return RabbitMQ queues and update/create them in Prisma', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getQueues as jest.Mock).mockResolvedValue(mockQueuesData);

      const c = mockContext('GET', { id: serverId });
      await getRabbitMQQueues(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(RabbitMQClient).toHaveBeenCalledWith(mockServer.apiUrl, mockServer.username, mockServer.passwordToken);
      expect(clientInstance.getQueues).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1); // One transaction for all queue operations

      // Check upsert and metric creation for each queue
      expect(prisma.queue.upsert).toHaveBeenCalledTimes(mockQueuesData.length);
      expect(prisma.queueMetric.create).toHaveBeenCalledTimes(mockQueuesData.length);

      for (const q of mockQueuesData) {
        expect(prisma.queue.upsert).toHaveBeenCalledWith(expect.objectContaining({
          where: { name_vhost_rabbitMQServerId: { name: q.name, vhost: q.vhost, rabbitMQServerId: serverId } },
          create: expect.objectContaining({ name: q.name, vhost: q.vhost, rabbitMQServerId: serverId, durable: undefined, autoDelete: undefined, exclusive: undefined, node: q.node }),
          update: expect.objectContaining({ durable: undefined, autoDelete: undefined, exclusive: undefined, node: q.node }),
        }));
        expect(prisma.queueMetric.create).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({
            id: mockQueueMetricId, // Assuming lucia.generateId is called for each metric
            queueId: `qid-${q.name}-${q.vhost}-${serverId}`, // Matches the simulated upserted queue ID
            messages: q.messages,
            consumerCount: q.consumers,
            state: q.state,
            publishRate: q.message_stats?.publish_details?.rate ?? 0,
            memory: q.memory,
          })
        }));
      }
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockQueuesData);
    });

    it('should return 404 if server not found', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(null);
      const c = mockContext('GET', { id: serverId });
      await getRabbitMQQueues(c as any);

      expect(RabbitMQClient).not.toHaveBeenCalled();
      expect(prisma.queue.upsert).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'RabbitMQ server configuration not found.' });
    });

    it('should handle errors from RabbitMQClient during getQueues', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getQueues as jest.Mock).mockRejectedValue(new Error('RabbitMQ API error for queues'));

      const c = mockContext('GET', { id: serverId });
      await getRabbitMQQueues(c as any);

      expect(clientInstance.getQueues).toHaveBeenCalledTimes(1);
      expect(prisma.queue.upsert).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch RabbitMQ queues', details: 'RabbitMQ API error for queues' });
    });

    it('should handle errors if Prisma transaction fails', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getQueues as jest.Mock).mockResolvedValue(mockQueuesData); // RabbitMQ part succeeds
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Prisma transaction error')); // Prisma part fails

      const c = mockContext('GET', { id: serverId });
      await getRabbitMQQueues(c as any);

      expect(clientInstance.getQueues).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch RabbitMQ queues', details: 'Prisma transaction error' });
    });
  });

  describe('GET /servers/:id/nodes (getRabbitMQNodes)', () => {
    const serverId = 'server1';
    const mockServer = { id: serverId, name: 'Test Server', apiUrl: 'http://localhost:15672', username: 'user', passwordToken: 'passToken', companyId: 'comp1' };
    const mockNodesData = [ { name: 'rabbit@node1', type: 'disc', running: true }, { name: 'rabbit@node2', type: 'disc', running: false } ];

    beforeEach(() => {
        (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(mockServer);
    });

    it('should return RabbitMQ nodes for a valid server ID', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getNodes as jest.Mock).mockResolvedValue(mockNodesData);

      const c = mockContext('GET', { id: serverId });
      await getRabbitMQNodes(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(RabbitMQClient).toHaveBeenCalledWith(mockServer.apiUrl, mockServer.username, mockServer.passwordToken);
      expect(clientInstance.getNodes).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockNodesData);
    });

    it('should return 404 if server not found', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(null);
      const c = mockContext('GET', { id: serverId });
      await getRabbitMQNodes(c as any);

      expect(RabbitMQClient).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'RabbitMQ server configuration not found.' });
    });

    it('should handle errors from RabbitMQClient during getNodes', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getNodes as jest.Mock).mockRejectedValue(new Error('RabbitMQ API error for nodes'));

      const c = mockContext('GET', { id: serverId });
      await getRabbitMQNodes(c as any);

      expect(clientInstance.getNodes).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch RabbitMQ nodes', details: 'RabbitMQ API error for nodes' });
    });
  });

  describe('GET /servers/:id/queues/:queueName (getRabbitMQQueueByName)', () => {
    const serverId = 'server1';
    const queueName = 'myQueue';
    const vhost = '/'; // Default vhost
    const mockServer = { id: serverId, name: 'Test Server', apiUrl: 'http://localhost:15672', username: 'user', passwordToken: 'passToken', companyId: 'comp1' };
    const mockQueueData = { name: queueName, vhost: vhost, messages: 3, consumers: 1 };

    beforeEach(() => {
        (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(mockServer);
    });

    it('should return specific RabbitMQ queue data', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getQueue as jest.Mock).mockResolvedValue(mockQueueData);

      const c = mockContext('GET', { id: serverId, queueName: queueName }); // vhost will be taken from query or default
      await getRabbitMQQueueByName(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(RabbitMQClient).toHaveBeenCalledWith(mockServer.apiUrl, mockServer.username, mockServer.passwordToken);
      // Hono escapes '/' in params, so it becomes '%2F', need to decode for the call
      expect(clientInstance.getQueue).toHaveBeenCalledWith(vhost, queueName);
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockQueueData);
    });

    it('should use vhost from query if provided', async () => {
      const customVhost = 'customVhost';
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getQueue as jest.Mock).mockResolvedValue({...mockQueueData, vhost: customVhost });

      const c = mockContext('GET', { id: serverId, queueName: queueName, vhost: customVhost });
      await getRabbitMQQueueByName(c as any);

      expect(clientInstance.getQueue).toHaveBeenCalledWith(customVhost, queueName);
      expect(c.res.statusVal).toBe(200);
    });


    it('should return 404 if server not found', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(null);
      const c = mockContext('GET', { id: serverId, queueName: queueName });
      await getRabbitMQQueueByName(c as any);

      expect(RabbitMQClient).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'RabbitMQ server configuration not found.' });
    });

    it('should handle errors from RabbitMQClient during getQueue', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getQueue as jest.Mock).mockRejectedValue(new Error('RabbitMQ API error for specific queue'));

      const c = mockContext('GET', { id: serverId, queueName: queueName });
      await getRabbitMQQueueByName(c as any);

      expect(clientInstance.getQueue).toHaveBeenCalledWith(vhost, queueName);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch RabbitMQ queue', details: 'RabbitMQ API error for specific queue' });
    });
  });

  describe('POST /direct/overview (getDirectRabbitMQOverview)', () => {
    const directCredentials = { apiUrl: 'http://direct:15672', username: 'directUser', password: 'directPassword' };
    const mockOverviewData = { node: 'rabbit@directhost', version: '3.10.0' };

    it('should return RabbitMQ overview with direct credentials', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getOverview as jest.Mock).mockResolvedValue(mockOverviewData);

      const c = mockContext('POST', {}, directCredentials, directCredentials); // Body and validData are the same
      await getDirectRabbitMQOverview(c as any);

      expect(RabbitMQClient).toHaveBeenCalledWith(directCredentials.apiUrl, directCredentials.username, directCredentials.password);
      expect(clientInstance.getOverview).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockOverviewData);
    });

    it('should handle errors from RabbitMQClient with direct credentials', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getOverview as jest.Mock).mockRejectedValue(new Error('Direct RabbitMQ API error'));

      const c = mockContext('POST', {}, directCredentials, directCredentials);
      await getDirectRabbitMQOverview(c as any);

      expect(RabbitMQClient).toHaveBeenCalledWith(directCredentials.apiUrl, directCredentials.username, directCredentials.password);
      expect(clientInstance.getOverview).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch RabbitMQ overview with direct connection', details: 'Direct RabbitMQ API error' });
    });
  });

  describe('POST /direct/queues (getDirectRabbitMQQueues)', () => {
    const directCredentials = { apiUrl: 'http://direct:15672', username: 'directUser', password: 'directPassword' };
    const mockQueuesData = [ { name: 'directQ1', messages: 100 }, { name: 'directQ2', messages: 0 } ];

    it('should return RabbitMQ queues with direct credentials', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getQueues as jest.Mock).mockResolvedValue(mockQueuesData);

      const c = mockContext('POST', {}, directCredentials, directCredentials);
      await getDirectRabbitMQQueues(c as any);

      expect(RabbitMQClient).toHaveBeenCalledWith(directCredentials.apiUrl, directCredentials.username, directCredentials.password);
      expect(clientInstance.getQueues).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockQueuesData);
    });

    it('should handle errors from RabbitMQClient for direct queues', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getQueues as jest.Mock).mockRejectedValue(new Error('Direct RabbitMQ Queues API error'));

      const c = mockContext('POST', {}, directCredentials, directCredentials);
      await getDirectRabbitMQQueues(c as any);

      expect(clientInstance.getQueues).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch RabbitMQ queues with direct connection', details: 'Direct RabbitMQ Queues API error' });
    });
  });

  describe('POST /direct/nodes (getDirectRabbitMQNodes)', () => {
    const directCredentials = { apiUrl: 'http://direct:15672', username: 'directUser', password: 'directPassword' };
    const mockNodesData = [ { name: 'directNode1', running: true } ];

    it('should return RabbitMQ nodes with direct credentials', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getNodes as jest.Mock).mockResolvedValue(mockNodesData);

      const c = mockContext('POST', {}, directCredentials, directCredentials);
      await getDirectRabbitMQNodes(c as any);

      expect(RabbitMQClient).toHaveBeenCalledWith(directCredentials.apiUrl, directCredentials.username, directCredentials.password);
      expect(clientInstance.getNodes).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockNodesData);
    });

    it('should handle errors from RabbitMQClient for direct nodes', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getNodes as jest.Mock).mockRejectedValue(new Error('Direct RabbitMQ Nodes API error'));

      const c = mockContext('POST', {}, directCredentials, directCredentials);
      await getDirectRabbitMQNodes(c as any);

      expect(clientInstance.getNodes).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch RabbitMQ nodes with direct connection', details: 'Direct RabbitMQ Nodes API error' });
    });
  });

  describe('GET /servers/:id/metrics (getRabbitMQMetrics)', () => {
    const serverId = 'server1';
    const mockServer = { id: serverId, name: 'Test Server', apiUrl: 'http://localhost:15672', username: 'user', passwordToken: 'passToken', companyId: 'comp1' };
    const mockMetricsData = {
      uptime: 123456,
      message_rates: { publish: 10.5, deliver: 9.2 },
      connection_stats: { total: 5, active: 3 },
    };

    beforeEach(() => {
        (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(mockServer);
    });

    it('should return enhanced RabbitMQ metrics for a valid server ID', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getMetrics as jest.Mock).mockResolvedValue(mockMetricsData); // Assuming getMetrics fetches all necessary data

      const c = mockContext('GET', { id: serverId });
      await getRabbitMQMetrics(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(RabbitMQClient).toHaveBeenCalledWith(mockServer.apiUrl, mockServer.username, mockServer.passwordToken);
      expect(clientInstance.getMetrics).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockMetricsData);
    });

    it('should return 404 if server not found', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(null);
      const c = mockContext('GET', { id: serverId });
      await getRabbitMQMetrics(c as any);

      expect(RabbitMQClient).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'RabbitMQ server configuration not found.' });
    });

    it('should handle errors from RabbitMQClient during getMetrics', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getMetrics as jest.Mock).mockRejectedValue(new Error('RabbitMQ API error for metrics'));

      const c = mockContext('GET', { id: serverId });
      await getRabbitMQMetrics(c as any);

      expect(clientInstance.getMetrics).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch RabbitMQ metrics', details: 'RabbitMQ API error for metrics' });
    });
  });

  describe('POST /test-connection-with-metrics (testRabbitMQConnectionWithMetrics)', () => {
    const directCredentials = { apiUrl: 'http://testconn:15672', username: 'testUser', password: 'testPassword' };
    const mockConnectionTestData = { success: true, version: '3.9.5', nodes: 1, queues: 3 }; // Example data

    it('should successfully test connection and retrieve basic metrics', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      // Assuming testConnection or a similar method returns some indicative data
      (clientInstance.testConnection as jest.Mock).mockResolvedValue(mockConnectionTestData);
      // Or if it reuses getOverview/getMetrics:
      // (clientInstance.getOverview as jest.Mock).mockResolvedValue({ version: '3.9.5', rabbitmq_version: '3.9.5' });
      // (clientInstance.getQueues as jest.Mock).mockResolvedValue([{name: 'q1'}, {name: 'q2'}]);

      const c = mockContext('POST', {}, directCredentials, directCredentials);
      await testRabbitMQConnectionWithMetrics(c as any);

      expect(RabbitMQClient).toHaveBeenCalledWith(directCredentials.apiUrl, directCredentials.username, directCredentials.password);
      expect(clientInstance.testConnection).toHaveBeenCalledTimes(1); // or getOverview/getMetrics
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual({ message: 'Connection test successful.', data: mockConnectionTestData });
    });

    it('should handle connection failure or errors from RabbitMQClient', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.testConnection as jest.Mock).mockRejectedValue(new Error('Connection test failed'));

      const c = mockContext('POST', {}, directCredentials, directCredentials);
      await testRabbitMQConnectionWithMetrics(c as any);

      expect(RabbitMQClient).toHaveBeenCalledWith(directCredentials.apiUrl, directCredentials.username, directCredentials.password);
      expect(clientInstance.testConnection).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'RabbitMQ connection test failed.', details: 'Connection test failed' });
    });
  });
});
