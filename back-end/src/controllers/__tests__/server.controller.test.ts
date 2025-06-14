import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Hono } from 'hono';
import { prisma } from '../../core/__mocks__/prisma';
import { RabbitMQClient } from '../../core/rabbitmq'; // Actual class to be mocked
import {
  getAllRabbitMQServers,
  getRabbitMQServerById,
  createRabbitMQServer,
  updateRabbitMQServer,
  deleteRabbitMQServer,
  testRabbitMQConnection,
} from '../server.controller'; // Adjust path as necessary
import { lucia } from '../../core/__mocks__/auth'; // For lucia.generateId

// Mock the RabbitMQClient constructor and its methods
jest.mock('../../core/rabbitmq', () => {
  return {
    RabbitMQClient: jest.fn().mockImplementation(() => {
      return {
        getOverview: jest.fn(), // Used for connection testing
        // Add other methods if server.controller starts using them
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
  // user: any = null // Assuming these routes are admin/system protected, not tied to specific user context for now
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
    // get: (key: string) => {
    //   if (key === 'user') return user;
    //   return undefined;
    // },
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

describe('Server Controller (RabbitMQServer)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const clientInstance = getMockRabbitMQClientInstance();
    if (clientInstance) {
        (clientInstance.getOverview as jest.Mock).mockReset();
    }
    // Reset Prisma mocks
    Object.values(prisma.rabbitMQServer).forEach(mockFn => {
        if (jest.isMockFunction(mockFn)) mockFn.mockReset();
    });
    (lucia.generateId as jest.Mock).mockReset();

  });

  // Test suites for each controller function will go here

  describe('GET /servers (getAllRabbitMQServers)', () => {
    it('should return all RabbitMQ servers', async () => {
      const mockServers = [
        { id: 'server1', name: 'Server A', apiUrl: 'http://s1', username: 'u1', passwordToken: 'p1', companyId: 'c1' },
        { id: 'server2', name: 'Server B', apiUrl: 'http://s2', username: 'u2', passwordToken: 'p2', companyId: 'c2' },
      ];
      const expectedServers = mockServers.map(s => ({ ...s, passwordToken: undefined })); // Password should be excluded
      (prisma.rabbitMQServer.findMany as jest.Mock).mockResolvedValue(mockServers);

      const c = mockContext('GET');
      await getAllRabbitMQServers(c as any);

      expect(prisma.rabbitMQServer.findMany).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(expectedServers);
    });

    it('should handle errors during retrieval of all servers', async () => {
      (prisma.rabbitMQServer.findMany as jest.Mock).mockRejectedValue(new Error('Prisma findMany error'));
      const c = mockContext('GET');
      await getAllRabbitMQServers(c as any);

      expect(prisma.rabbitMQServer.findMany).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch RabbitMQ servers', details: 'Prisma findMany error' });
    });
     it('should return an empty array if no servers exist', async () => {
      (prisma.rabbitMQServer.findMany as jest.Mock).mockResolvedValue([]);
      const c = mockContext('GET');
      await getAllRabbitMQServers(c as any);

      expect(prisma.rabbitMQServer.findMany).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual([]);
    });
  });

  describe('GET /servers/:id (getRabbitMQServerById)', () => {
    const serverId = 'serverAbc';
    const mockServer = { id: serverId, name: 'Server ABC', apiUrl: 'http://sAbc', username: 'uAbc', passwordToken: 'pAbc', companyId: 'cAbc' };

    it('should return a specific RabbitMQ server by ID, excluding password', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(mockServer);
      const expectedServer = { ...mockServer, passwordToken: undefined };

      const c = mockContext('GET', { id: serverId });
      await getRabbitMQServerById(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(expectedServer);
    });

    it('should return 404 if server not found', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(null);
      const c = mockContext('GET', { id: serverId });
      await getRabbitMQServerById(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'RabbitMQ server not found' });
    });

    it('should handle errors during retrieval of a server by ID', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockRejectedValue(new Error('Prisma findUnique error'));
      const c = mockContext('GET', { id: serverId });
      await getRabbitMQServerById(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch RabbitMQ server', details: 'Prisma findUnique error' });
    });
  });

  describe('POST /servers (createRabbitMQServer)', () => {
    const serverData = {
      name: 'New Server',
      apiUrl: 'http://newserver:15672',
      username: 'newuser',
      password: 'newpassword', // Raw password in input
      companyId: 'comp123'
    };
    const mockServerId = 'generated-server-id';
    const createdServerDb = { ...serverData, id: mockServerId, passwordToken: `encrypted_${serverData.password}` };
    const expectedResponse = { ...createdServerDb, passwordToken: undefined, password: undefined }; // password and token excluded

    beforeEach(() => {
        (lucia.generateId as jest.Mock).mockReturnValue(mockServerId);
        // Mock encryptPassword from your actual crypto utility if it's separate
        // For this test, let's assume it's a simple mock transformation
        // In a real scenario, you wouldn't mock the encryption itself but the module providing it.
        jest.spyOn(require('../../core/crypto'), 'encryptPassword').mockImplementation(pass => `encrypted_${pass}`);
    });

    it('should create a server if connection test passes', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getOverview as jest.Mock).mockResolvedValue({ version: '3.9.0' }); // Connection test success
      (prisma.rabbitMQServer.create as jest.Mock).mockResolvedValue(createdServerDb);

      const c = mockContext('POST', {}, serverData, serverData);
      await createRabbitMQServer(c as any);

      expect(RabbitMQClient).toHaveBeenCalledWith(serverData.apiUrl, serverData.username, serverData.password);
      expect(clientInstance.getOverview).toHaveBeenCalledTimes(1);
      expect(require('../../core/crypto').encryptPassword).toHaveBeenCalledWith(serverData.password);
      expect(prisma.rabbitMQServer.create).toHaveBeenCalledWith({
        data: {
          id: mockServerId,
          name: serverData.name,
          apiUrl: serverData.apiUrl,
          username: serverData.username,
          passwordToken: `encrypted_${serverData.password}`,
          companyId: serverData.companyId,
        },
      });
      expect(c.res.statusVal).toBe(201);
      expect(c.res.jsonBody).toEqual(expectedResponse);
    });

    it('should return 500 if connection test fails', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getOverview as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const c = mockContext('POST', {}, serverData, serverData);
      await createRabbitMQServer(c as any);

      expect(RabbitMQClient).toHaveBeenCalledWith(serverData.apiUrl, serverData.username, serverData.password);
      expect(clientInstance.getOverview).toHaveBeenCalledTimes(1);
      expect(prisma.rabbitMQServer.create).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to connect to RabbitMQ server', details: 'Connection failed' });
    });

    it('should handle Prisma errors during server creation', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getOverview as jest.Mock).mockResolvedValue({ version: '3.9.0' }); // Connection test success
      (prisma.rabbitMQServer.create as jest.Mock).mockRejectedValue(new Error('Prisma create error'));

      const c = mockContext('POST', {}, serverData, serverData);
      await createRabbitMQServer(c as any);

      expect(prisma.rabbitMQServer.create).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to create RabbitMQ server in database', details: 'Prisma create error' });
    });
  });

  describe('PUT /servers/:id (updateRabbitMQServer)', () => {
    const serverId = 'existing-server-id';
    const existingServer = {
      id: serverId,
      name: 'Old Server Name',
      apiUrl: 'http://oldserver:15672',
      username: 'olduser',
      passwordToken: 'encrypted_oldpassword',
      companyId: 'comp1'
    };
    const updateDataNoCredChange = { name: 'New Server Name', companyId: 'comp2' };
    const updateDataWithCredChange = {
      name: 'Updated Server Name Creds',
      apiUrl: 'http://newapiserver:15672',
      username: 'newapiuser',
      password: 'newapipassword' // Raw password
    };
    // Assume decryptPassword is also in crypto, needed to get plain text for connection test if only partial creds change
    // For simplicity, our mock won't go that deep unless strictly necessary for the controller logic.
    // The controller *should* use the new password from payload if provided, or decrypt existing if only URL/user changes.
    // Let's assume controller sends new password if 'password' field is in payload.

    beforeEach(() => {
        // crypto.encryptPassword is already spied from POST tests, can be reused or reset if needed
        // crypto.decryptPassword might be needed if controller logic tries to reuse old password
        jest.spyOn(require('../../core/crypto'), 'decryptPassword').mockImplementation(token => token.replace('encrypted_', ''));
    });

    it('should update a server without credential change (no connection test)', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(existingServer);
      const updatedDbServer = { ...existingServer, ...updateDataNoCredChange };
      (prisma.rabbitMQServer.update as jest.Mock).mockResolvedValue(updatedDbServer);
      const expectedResponse = { ...updatedDbServer, passwordToken: undefined };

      const c = mockContext('PUT', { id: serverId }, updateDataNoCredChange, updateDataNoCredChange);
      await updateRabbitMQServer(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(RabbitMQClient).not.toHaveBeenCalled(); // No connection test expected
      expect(prisma.rabbitMQServer.update).toHaveBeenCalledWith({
        where: { id: serverId },
        data: updateDataNoCredChange, // No passwordToken change
      });
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(expectedResponse);
    });

    it('should update a server with credential change and connection test PASS', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(existingServer);
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getOverview as jest.Mock).mockResolvedValue({ version: '3.9.0' }); // Connection test success

      const encryptedNewPassword = `encrypted_${updateDataWithCredChange.password}`;
      const dataToUpdateInDb = {
        name: updateDataWithCredChange.name,
        apiUrl: updateDataWithCredChange.apiUrl,
        username: updateDataWithCredChange.username,
        passwordToken: encryptedNewPassword,
      };
      const updatedDbServer = { ...existingServer, ...dataToUpdateInDb };
      (prisma.rabbitMQServer.update as jest.Mock).mockResolvedValue(updatedDbServer);
      const expectedResponse = { ...updatedDbServer, passwordToken: undefined, password: undefined };


      const c = mockContext('PUT', { id: serverId }, updateDataWithCredChange, updateDataWithCredChange);
      await updateRabbitMQServer(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(RabbitMQClient).toHaveBeenCalledWith(updateDataWithCredChange.apiUrl, updateDataWithCredChange.username, updateDataWithCredChange.password);
      expect(clientInstance.getOverview).toHaveBeenCalledTimes(1);
      expect(require('../../core/crypto').encryptPassword).toHaveBeenCalledWith(updateDataWithCredChange.password);
      expect(prisma.rabbitMQServer.update).toHaveBeenCalledWith({
        where: { id: serverId },
        data: dataToUpdateInDb,
      });
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(expectedResponse);
    });

    it('should NOT update server if credential change and connection test FAIL', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(existingServer);
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getOverview as jest.Mock).mockRejectedValue(new Error('New creds connection failed'));

      const c = mockContext('PUT', { id: serverId }, updateDataWithCredChange, updateDataWithCredChange);
      await updateRabbitMQServer(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(RabbitMQClient).toHaveBeenCalledWith(updateDataWithCredChange.apiUrl, updateDataWithCredChange.username, updateDataWithCredChange.password);
      expect(clientInstance.getOverview).toHaveBeenCalledTimes(1);
      expect(prisma.rabbitMQServer.update).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(400); // Or 500 depending on how error is handled
      expect(c.res.jsonBody).toEqual({ error: 'Failed to connect to RabbitMQ server with new credentials', details: 'New creds connection failed' });
    });

    it('should return 404 if server to update is not found', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(null);
      const c = mockContext('PUT', { id: serverId }, updateDataNoCredChange, updateDataNoCredChange);
      await updateRabbitMQServer(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(prisma.rabbitMQServer.update).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'RabbitMQ server not found' });
    });

    it('should handle Prisma errors during server update', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(existingServer);
      // Assuming no credential change to simplify to Prisma error
      (prisma.rabbitMQServer.update as jest.Mock).mockRejectedValue(new Error('Prisma update error'));

      const c = mockContext('PUT', { id: serverId }, updateDataNoCredChange, updateDataNoCredChange);
      await updateRabbitMQServer(c as any);

      expect(prisma.rabbitMQServer.update).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to update RabbitMQ server in database', details: 'Prisma update error' });
    });
  });

  describe('DELETE /servers/:id (deleteRabbitMQServer)', () => {
    const serverId = 'server-to-delete';
    const existingServer = { id: serverId, name: 'Test Delete Server', apiUrl: 'http://del', username: 'udel', passwordToken: 'pdel' };

    it('should delete a server successfully', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(existingServer); // Server exists
      (prisma.rabbitMQServer.delete as jest.Mock).mockResolvedValue(existingServer); // Deletion successful

      const c = mockContext('DELETE', { id: serverId });
      await deleteRabbitMQServer(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(prisma.rabbitMQServer.delete).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual({ message: 'RabbitMQ server deleted successfully' });
    });

    it('should return 404 if server to delete is not found', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(null); // Server does not exist
      const c = mockContext('DELETE', { id: serverId });
      await deleteRabbitMQServer(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(prisma.rabbitMQServer.delete).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'RabbitMQ server not found' });
    });

    it('should handle Prisma errors during server deletion', async () => {
      (prisma.rabbitMQServer.findUnique as jest.Mock).mockResolvedValue(existingServer); // Server exists
      (prisma.rabbitMQServer.delete as jest.Mock).mockRejectedValue(new Error('Prisma delete error')); // Deletion fails

      const c = mockContext('DELETE', { id: serverId });
      await deleteRabbitMQServer(c as any);

      expect(prisma.rabbitMQServer.findUnique).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(prisma.rabbitMQServer.delete).toHaveBeenCalledWith({ where: { id: serverId } });
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to delete RabbitMQ server', details: 'Prisma delete error' });
    });
  });

  describe('POST /servers/test-connection (testRabbitMQConnection)', () => {
    const connectionData = { apiUrl: 'http://testurl:15672', username: 'testuser', password: 'testpassword' };
    const mockOverview = { version: '3.9.0', node: 'rabbit@testhost' }; // Example overview data

    it('should return success if connection test passes', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getOverview as jest.Mock).mockResolvedValue(mockOverview);

      const c = mockContext('POST', {}, connectionData, connectionData);
      await testRabbitMQConnection(c as any);

      expect(RabbitMQClient).toHaveBeenCalledWith(connectionData.apiUrl, connectionData.username, connectionData.password);
      expect(clientInstance.getOverview).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual({ message: 'Successfully connected to RabbitMQ server.', data: mockOverview });
    });

    it('should return 500 if connection test fails', async () => {
      const clientInstance = getMockRabbitMQClientInstance();
      (clientInstance.getOverview as jest.Mock).mockRejectedValue(new Error('Connection test API error'));

      const c = mockContext('POST', {}, connectionData, connectionData);
      await testRabbitMQConnection(c as any);

      expect(RabbitMQClient).toHaveBeenCalledWith(connectionData.apiUrl, connectionData.username, connectionData.password);
      expect(clientInstance.getOverview).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to connect to RabbitMQ server', details: 'Connection test API error' });
    });
  });
});
