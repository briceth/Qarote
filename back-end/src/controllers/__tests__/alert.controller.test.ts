import { describe, it, expect, jest } from '@jest/globals';
import { Hono } from 'hono';
import {
  getAllAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
  getRecentAlertsByDay,
} from '../alert.controller';
import { prisma } from '../../core/__mocks__/prisma'; // Adjust path as necessary

// Mock Hono context
const mockContext = (method: string, params: any = {}, body: any = null) => {
  const req = {
    method,
    param: (key: string) => params[key],
    json: async () => body,
    query: (key: string) => params[key], // For query parameters
  } as any;

  const res = {
    status: 0,
    jsonBody: null,
    json: function (data: any) {
      this.jsonBody = data;
      return this; // Allow chaining if Hono's actual res.json returns itself
    },
    status: function (statusCode: number) {
      this.status = statusCode;
      return this; // Allow chaining
    },
  } as any;

  // Add a next function to the context
  const next = jest.fn();

  return { req, res, ...res, next }; // Spread res for status and json methods
};


describe('Alert Controller', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /alerts', () => {
    it('should return all alerts', async () => {
      const mockAlerts = [
        { id: '1', message: 'Test Alert 1', status: 'open', severity: 'high', origin: 'test' },
        { id: '2', message: 'Test Alert 2', status: 'closed', severity: 'low', origin: 'test2' },
      ];
      (prisma.alert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

      const c = mockContext('GET');
      await getAllAlerts(c as any);

      expect(prisma.alert.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.alert.findMany).toHaveBeenCalledWith({});
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody).toEqual(mockAlerts);
    });

    it('should filter alerts by status', async () => {
      const mockAlerts = [
        { id: '1', message: 'Test Alert 1', status: 'open', severity: 'high', origin: 'test' },
      ];
      (prisma.alert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

      const c = mockContext('GET', { status: 'open' });
      await getAllAlerts(c as any);

      expect(prisma.alert.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.alert.findMany).toHaveBeenCalledWith({ where: { status: 'open' } });
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody).toEqual(mockAlerts);
    });

    it('should filter alerts by severity', async () => {
      const mockAlerts = [
        { id: '1', message: 'Test Alert 1', status: 'open', severity: 'high', origin: 'test' },
      ];
      (prisma.alert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

      const c = mockContext('GET', { severity: 'high' });
      await getAllAlerts(c as any);

      expect(prisma.alert.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.alert.findMany).toHaveBeenCalledWith({ where: { severity: 'high' } });
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody).toEqual(mockAlerts);
    });

    it('should handle errors during retrieval', async () => {
      (prisma.alert.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const c = mockContext('GET');
      await getAllAlerts(c as any);

      expect(prisma.alert.findMany).toHaveBeenCalledTimes(1);
      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch alerts' });
    });
  });

  describe('GET /alerts/:id', () => {
    it('should return a specific alert by ID', async () => {
      const mockAlert = { id: '1', message: 'Test Alert 1', status: 'open', severity: 'high', origin: 'test' };
      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(mockAlert);

      const c = mockContext('GET', { id: '1' });
      await getAlertById(c as any);

      expect(prisma.alert.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.alert.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody).toEqual(mockAlert);
    });

    it('should return 404 if alert not found', async () => {
      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(null);

      const c = mockContext('GET', { id: '1' });
      await getAlertById(c as any);

      expect(prisma.alert.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.alert.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(c.res.status).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'Alert not found' });
    });

    it('should handle errors during retrieval by ID', async () => {
      (prisma.alert.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const c = mockContext('GET', { id: '1' });
      await getAlertById(c as any);

      expect(prisma.alert.findUnique).toHaveBeenCalledTimes(1);
      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch alert' });
    });
  });

  describe('POST /alerts', () => {
    it('should create a new alert', async () => {
      const newAlertData = { message: 'New Alert', severity: 'critical', origin: 'system' };
      const createdAlert = { id: '3', ...newAlertData, status: 'open', createdAt: new Date(), updatedAt: new Date() };
      (prisma.alert.create as jest.Mock).mockResolvedValue(createdAlert);

      const c = mockContext('POST', {}, newAlertData);
      await createAlert(c as any);

      expect(prisma.alert.create).toHaveBeenCalledTimes(1);
      expect(prisma.alert.create).toHaveBeenCalledWith({ data: newAlertData });
      expect(c.res.status).toBe(201);
      expect(c.res.jsonBody).toEqual(createdAlert);
    });

    // Note: Validating Zod schemas usually requires Hono's validator middleware,
    // which is harder to unit test without full integration.
    // We'll focus on the controller logic assuming valid data.
    it('should handle errors during creation', async () => {
      const newAlertData = { message: 'New Alert', severity: 'critical', origin: 'system' };
      (prisma.alert.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const c = mockContext('POST', {}, newAlertData);
      await createAlert(c as any);

      expect(prisma.alert.create).toHaveBeenCalledTimes(1);
      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to create alert' });
    });
  });

  describe('PUT /alerts/:id', () => {
    const alertId = '1';
    const updateData = { message: 'Updated Alert', status: 'resolved' };
    const existingAlert = { id: alertId, message: 'Old Alert', status: 'open', severity: 'high', origin: 'test', resolvedAt: null };
    const updatedAlert = { ...existingAlert, ...updateData, resolvedAt: expect.any(Date) }; // Expect resolvedAt to be set

    it('should update an existing alert', async () => {
      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(existingAlert);
      (prisma.alert.update as jest.Mock).mockResolvedValue(updatedAlert);

      const c = mockContext('PUT', { id: alertId }, updateData);
      await updateAlert(c as any);

      expect(prisma.alert.findUnique).toHaveBeenCalledWith({ where: { id: alertId } });
      expect(prisma.alert.update).toHaveBeenCalledTimes(1);
      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: alertId },
        data: { ...updateData, resolvedAt: expect.any(Date) },
      });
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody).toEqual(updatedAlert);
    });

    it('should set resolvedAt when status changes to resolved', async () => {
      const updateDataResolved = { status: 'resolved' };
      const alertToBeResolved = { ...existingAlert, status: 'open', resolvedAt: null };
      const expectedResolvedAlert = { ...alertToBeResolved, status: 'resolved', resolvedAt: expect.any(Date) };

      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(alertToBeResolved);
      (prisma.alert.update as jest.Mock).mockResolvedValue(expectedResolvedAlert);

      const c = mockContext('PUT', { id: alertId }, updateDataResolved);
      await updateAlert(c as any);

      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: alertId },
        data: { status: 'resolved', resolvedAt: expect.any(Date) },
      });
      expect(c.res.jsonBody.resolvedAt).not.toBeNull();
    });

    it('should not overwrite resolvedAt if status is not changing to resolved', async () => {
      const updateDataKeepStatus = { message: 'Still Open' };
      const alreadyResolvedAlert = { ...existingAlert, status: 'resolved', resolvedAt: new Date() };
      // If we update a message, resolvedAt should not change if it was already set and status is not 'resolved' in this update.
      const expectedUpdatedAlert = { ...alreadyResolvedAlert, message: 'Still Open' };


      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(alreadyResolvedAlert);
      (prisma.alert.update as jest.Mock).mockResolvedValue(expectedUpdatedAlert);

      const c = mockContext('PUT', { id: alertId }, updateDataKeepStatus);
      await updateAlert(c as any);

      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: alertId },
        data: { ...updateDataKeepStatus }, // resolvedAt should not be part of this update data
      });
      expect(c.res.jsonBody.resolvedAt).toEqual(alreadyResolvedAlert.resolvedAt);
    });


    it('should return 404 if alert to update is not found', async () => {
      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(null);

      const c = mockContext('PUT', { id: 'unknown' }, updateData);
      await updateAlert(c as any);

      expect(prisma.alert.findUnique).toHaveBeenCalledWith({ where: { id: 'unknown' } });
      expect(prisma.alert.update).not.toHaveBeenCalled();
      expect(c.res.status).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'Alert not found' });
    });

    it('should handle errors during update', async () => {
      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(existingAlert);
      (prisma.alert.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const c = mockContext('PUT', { id: alertId }, updateData);
      await updateAlert(c as any);

      expect(prisma.alert.update).toHaveBeenCalledTimes(1);
      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to update alert' });
    });
  });

  describe('DELETE /alerts/:id', () => {
    const alertId = '1';
    const existingAlert = { id: alertId, message: 'Test Alert', status: 'open', severity: 'high', origin: 'test' };

    it('should delete an existing alert', async () => {
      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(existingAlert);
      (prisma.alert.delete as jest.Mock).mockResolvedValue(existingAlert);

      const c = mockContext('DELETE', { id: alertId });
      await deleteAlert(c as any);

      expect(prisma.alert.findUnique).toHaveBeenCalledWith({ where: { id: alertId } });
      expect(prisma.alert.delete).toHaveBeenCalledTimes(1);
      expect(prisma.alert.delete).toHaveBeenCalledWith({ where: { id: alertId } });
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody).toEqual({ message: 'Alert deleted successfully' });
    });

    it('should return 404 if alert to delete is not found', async () => {
      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(null);

      const c = mockContext('DELETE', { id: 'unknown' });
      await deleteAlert(c as any);

      expect(prisma.alert.findUnique).toHaveBeenCalledWith({ where: { id: 'unknown' } });
      expect(prisma.alert.delete).not.toHaveBeenCalled();
      expect(c.res.status).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'Alert not found' });
    });

    it('should handle errors during deletion', async () => {
      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(existingAlert);
      (prisma.alert.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      const c = mockContext('DELETE', { id: alertId });
      await deleteAlert(c as any);

      expect(prisma.alert.delete).toHaveBeenCalledTimes(1);
      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to delete alert' });
    });
  });

  describe('GET /alerts/recent/day', () => {
    it('should return recent alerts from the last 24 hours', async () => {
      const mockRecentAlerts = [
        { id: '1', message: 'Recent Alert 1', createdAt: new Date() },
        { id: '2', message: 'Recent Alert 2', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) }, // 12 hours ago
      ];
      (prisma.alert.findMany as jest.Mock).mockResolvedValue(mockRecentAlerts);

      const c = mockContext('GET');
      await getRecentAlertsByDay(c as any);

      expect(prisma.alert.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: expect.any(Date), // We expect a date object here
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      // Check that the date passed to gte is roughly 24 hours ago
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const actualDateArg = (prisma.alert.findMany as jest.Mock).mock.calls[0][0].where.createdAt.gte;
      expect(actualDateArg.getTime()).toBeGreaterThanOrEqual(twentyFourHoursAgo.getTime() - 1000); // Allow 1s diff for execution time
      expect(actualDateArg.getTime()).toBeLessThanOrEqual(twentyFourHoursAgo.getTime() + 1000);


      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody).toEqual(mockRecentAlerts);
    });

    it('should handle errors during retrieval of recent alerts', async () => {
      (prisma.alert.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const c = mockContext('GET');
      await getRecentAlertsByDay(c as any);

      expect(prisma.alert.findMany).toHaveBeenCalledTimes(1);
      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch recent alerts' });
    });
  });
});
