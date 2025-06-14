import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Hono } from 'hono';
import { prisma } from '../../core/__mocks__/prisma';
// Assuming authCore contains mocks for authenticate, authorize, checkCompanyAccess
import * as authCore from '../../core/__mocks__/auth';
import {
  getAllCompanies,
  getUserCompany,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats,
} from '../company.controller'; // Adjust path as necessary

// Mock Hono context - This can be further customized per test suite if needed
const mockContext = (
  method: string,
  params: any = {},
  body: any = null,
  validData: any = null,
  user: any = null, // For c.get('user') from 'authenticate'
  // Add flags or properties to simulate authorize and checkCompanyAccess behavior
  // e.g., isAuthorized: boolean, hasCompanyAccess: boolean
) => {
  const req = {
    method,
    param: (key: string) => params[key],
    json: async () => body,
    query: (key:string) => params[key],
    valid: (target: 'json' | 'query' | 'param' | 'header' | 'cookie') => validData,
  } as any;

  const res = {
    statusVal: 0, // Renamed to avoid conflict with status method
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
    res, // res contains status and json methods
    ...res, // Spread res for direct access to statusVal and jsonBody if needed for assertions
    get: (key: string) => {
      if (key === 'user') return user;
      // Potentially mock other c.get() calls if your middleware use them
      return undefined;
    },
    set: jest.fn(),
    next: jest.fn(),
  };
  return honoContext;
};


describe('Company Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset specific mock implementations for authCore if they are stateful between tests
    // For example, if authorize behavior is set globally in a mock:
    // (authCore.authorize as jest.Mock).mockImplementation((role) => async (c, next) => next());
  });

  // Test suites for each controller function will go here

  describe('GET /companies (getAllCompanies)', () => {
    const mockCompanies = [
      { id: 'comp1', name: 'Company A', users: [{ id: 'user1' }] },
      { id: 'comp2', name: 'Company B', users: [{ id: 'user2' }] },
    ];
    const adminUser = { id: 'admin1', role: 'ADMIN', companyId: null };
    const nonAdminUser = { id: 'user1', role: 'USER', companyId: 'comp1' };

    it('should return all companies for an ADMIN user', async () => {
      // Simulate ADMIN user context for authorize middleware
      const c = mockContext('GET', {}, null, null, adminUser);
      (prisma.company.findMany as jest.Mock).mockResolvedValue(mockCompanies);

      // Simulate authorize middleware allowing access
      (authCore.authorize as jest.Mock).mockImplementation((role) => async (ctx, next) => {
        if (ctx.get('user').role === role) await next();
        else { ctx.res.status(403); ctx.res.json({error: 'Forbidden'});}
      });

      await authCore.authorize('ADMIN')(c, async () => { // Simulate middleware execution
         await getAllCompanies(c as any);
      });

      expect(authCore.authorize).toHaveBeenCalledWith('ADMIN');
      if (!c.res.jsonBody?.error) { // Only proceed if authorize didn't block
        expect(prisma.company.findMany).toHaveBeenCalledTimes(1);
        expect(c.res.statusVal).toBe(200); // Check statusVal set by mockContext's res.status
        expect(c.res.jsonBody).toEqual(mockCompanies);
      } else {
        // This path should ideally not be taken if authorize is mocked correctly for admin
        expect(c.res.jsonBody.error).not.toBe('Forbidden');
      }
    });

    it('should return 403 Forbidden for a NON-ADMIN user', async () => {
      const c = mockContext('GET', {}, null, null, nonAdminUser);
      (authCore.authorize as jest.Mock).mockImplementation((role) => async (ctx, next) => {
        if (ctx.get('user').role === role) await next();
        else { ctx.res.status(403); return ctx.res.json({error: 'Forbidden'});} // Simulate middleware blocking
      });

      // Call the authorize middleware directly as it would be in the route definition
      const result = await authCore.authorize('ADMIN')(c, async () => {
        await getAllCompanies(c as any); // This shouldn't be reached
      });

      expect(authCore.authorize).toHaveBeenCalledWith('ADMIN');
      expect(prisma.company.findMany).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(403);
      expect(c.res.jsonBody).toEqual({ error: 'Forbidden' });
    });

    it('should handle errors during company retrieval', async () => {
      const c = mockContext('GET', {}, null, null, adminUser);
      (prisma.company.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));
      (authCore.authorize as jest.Mock).mockImplementation((role) => async (ctx, next) => await next()); // Simulate authorize allowing

      await authCore.authorize('ADMIN')(c, async () => {
         await getAllCompanies(c as any);
      });

      expect(prisma.company.findMany).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch companies' });
    });
  });

  describe('GET /companies/me (getUserCompany)', () => {
    const userWithCompany = { id: 'user1', role: 'USER', companyId: 'comp1' };
    const userWithoutCompany = { id: 'user2', role: 'USER', companyId: null };
    const mockCompany = { id: 'comp1', name: 'My Company', users: [{...userWithCompany}] };

    beforeEach(() => {
        // Default mock for authenticate: sets user on context
        (authCore.authenticate as jest.Mock).mockImplementation(() => async (c, next) => {
            // User is set by mockContext, so authenticate just calls next
            await next();
        });
        // Default mock for checkCompanyAccess: allows if user has companyId
        (authCore.checkCompanyAccess as jest.Mock).mockImplementation(() => async (c, next) => {
            const user = c.get('user');
            if (user && user.companyId) {
                await next();
            } else {
                c.res.status(404); // Or 403, depending on desired behavior for user w/o company
                return c.res.json({ error: 'User not associated with a company' });
            }
        });
    });

    it('should return the current user\'s company', async () => {
      const c = mockContext('GET', {}, null, null, userWithCompany);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);

      // Simulate middleware chain
      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await getUserCompany(c as any);
        });
      });

      expect(c.get('user')).toBe(userWithCompany);
      // Check if checkCompanyAccess was called correctly (optional, depends on how deep you want to test middleware mocks)
      // For getUserCompany, the companyId comes from c.get('user').companyId
      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: { id: userWithCompany.companyId },
        include: { users: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
      });
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockCompany);
    });

    it('should return 404 if user is not associated with a company', async () => {
      const c = mockContext('GET', {}, null, null, userWithoutCompany);

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => { // This middleware should block
            await getUserCompany(c as any);
        });
      });

      expect(prisma.company.findUnique).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(404); // As per the mockCheckCompanyAccess
      expect(c.res.jsonBody).toEqual({ error: 'User not associated with a company' });
    });

    it('should return 404 if the company from user.companyId is not found in DB', async () => {
      const c = mockContext('GET', {}, null, null, userWithCompany);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null); // Company not found

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await getUserCompany(c as any);
        });
      });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({
         where: { id: userWithCompany.companyId },
         include: { users: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
      });
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'Company not found' });
    });

    it('should handle errors during company retrieval', async () => {
      const c = mockContext('GET', {}, null, null, userWithCompany);
      (prisma.company.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await getUserCompany(c as any);
        });
      });

      expect(prisma.company.findUnique).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch company' });
    });
  });

  describe('GET /companies/:id (getCompanyById)', () => {
    const companyIdParam = 'comp123';
    const mockCompany = { id: companyIdParam, name: 'Specific Company', users: [] };
    const adminUser = { id: 'adminUser', role: 'ADMIN', companyId: null };
    const memberUser = { id: 'memberUser', role: 'USER', companyId: companyIdParam }; // Member of this company
    const companyAdminUser = { id: 'compAdminUser', role: 'COMPANY_ADMIN', companyId: companyIdParam }; // Company admin of this company
    const nonMemberUser = { id: 'nonMemberUser', role: 'USER', companyId: 'otherComp' }; // Member of a different company

    beforeEach(() => {
        (authCore.authenticate as jest.Mock).mockImplementation(() => async (c, next) => { await next(); });
        // More specific mock for checkCompanyAccess for this suite
        (authCore.checkCompanyAccess as jest.Mock).mockImplementation(() => async (c, next) => {
            const user = c.get('user');
            const routeCompanyId = c.req.param('id');
            if (user.role === 'ADMIN' || (user.companyId && user.companyId === routeCompanyId)) {
                await next();
            } else {
                c.res.status(403); return c.res.json({ error: 'Forbidden: Company access denied' });
            }
        });
    });

    it('should return a specific company for an ADMIN user', async () => {
      const c = mockContext('GET', { id: companyIdParam }, null, null, adminUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await getCompanyById(c as any);
        });
      });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: { id: companyIdParam },
        include: { users: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
      });
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockCompany);
    });

    it('should return a specific company for a member of that company', async () => {
      const c = mockContext('GET', { id: companyIdParam }, null, null, memberUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await getCompanyById(c as any);
        });
      });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { id: companyIdParam }, include: expect.any(Object) });
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockCompany);
    });

     it('should return a specific company for a COMPANY_ADMIN of that company', async () => {
      const c = mockContext('GET', { id: companyIdParam }, null, null, companyAdminUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await getCompanyById(c as any);
        });
      });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { id: companyIdParam }, include: expect.any(Object) });
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockCompany);
    });

    it('should return 403 Forbidden for a user who is not a member or ADMIN', async () => {
      const c = mockContext('GET', { id: companyIdParam }, null, null, nonMemberUser);

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => { // This should block
            await getCompanyById(c as any);
        });
      });

      expect(prisma.company.findUnique).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(403);
      expect(c.res.jsonBody).toEqual({ error: 'Forbidden: Company access denied' });
    });

    it('should return 404 if company not found', async () => {
      const c = mockContext('GET', { id: companyIdParam }, null, null, adminUser); // Admin should have access
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await getCompanyById(c as any);
        });
      });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { id: companyIdParam }, include: expect.any(Object) });
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'Company not found' });
    });

    it('should handle errors during company retrieval by ID', async () => {
      const c = mockContext('GET', { id: companyIdParam }, null, null, adminUser);
      (prisma.company.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await getCompanyById(c as any);
        });
      });

      expect(prisma.company.findUnique).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch company' });
    });
  });

  describe('POST /companies (createCompany)', () => {
    const companyData = { name: 'New Test Company', domain: 'newtest.com' };
    const adminUser = { id: 'admin1', role: 'ADMIN', companyId: null };
    const nonAdminUser = { id: 'user1', role: 'USER', companyId: 'comp1' };
    const createdCompany = { id: 'newCompId', ...companyData, industry: null, isActive: true, createdAt: new Date(), updatedAt: new Date() };

    beforeEach(() => {
        (authCore.authenticate as jest.Mock).mockImplementation(() => async (c, next) => { await next(); });
        (authCore.authorize as jest.Mock).mockImplementation((role) => async (c, next) => {
            const user = c.get('user');
            if (user && user.role === role) {
                await next();
            } else {
                c.res.status(403); return c.res.json({ error: 'Forbidden' });
            }
        });
        (lucia.generateId as jest.Mock).mockReturnValue('newCompId');
    });

    it('should create a new company for an ADMIN user', async () => {
      const c = mockContext('POST', {}, companyData, companyData, adminUser);
      (prisma.company.create as jest.Mock).mockResolvedValue(createdCompany);

      await authCore.authenticate()(c, async () => {
        await authCore.authorize('ADMIN')(c, async () => {
            await createCompany(c as any);
        });
      });

      expect(prisma.company.create).toHaveBeenCalledWith({ data: {id: 'newCompId', ...companyData} });
      expect(c.res.statusVal).toBe(201);
      expect(c.res.jsonBody).toEqual(createdCompany);
    });

    it('should return 403 Forbidden for a NON-ADMIN user', async () => {
      const c = mockContext('POST', {}, companyData, companyData, nonAdminUser);

      await authCore.authenticate()(c, async () => {
        await authCore.authorize('ADMIN')(c, async () => { // This should block
            await createCompany(c as any);
        });
      });

      expect(prisma.company.create).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(403);
      expect(c.res.jsonBody).toEqual({ error: 'Forbidden' });
    });

    it('should handle errors during company creation', async () => {
      const c = mockContext('POST', {}, companyData, companyData, adminUser);
      (prisma.company.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await authCore.authenticate()(c, async () => {
        await authCore.authorize('ADMIN')(c, async () => {
            await createCompany(c as any);
        });
      });

      expect(prisma.company.create).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to create company' });
    });
  });

  describe('PUT /companies/:id (updateCompany)', () => {
    const companyIdParam = 'comp123';
    const updateData = { name: 'Updated Company Name', industry: 'Tech' };
    const adminUser = { id: 'adminU', role: 'ADMIN', companyId: null };
    const companyAdminUser = { id: 'compAdminU', role: 'COMPANY_ADMIN', companyId: companyIdParam };
    const anotherCompanyAdminUser = { id: 'anotherCompAdminU', role: 'COMPANY_ADMIN', companyId: 'otherCompId' };
    const normalUserInCompany = { id: 'normalU', role: 'USER', companyId: companyIdParam };
    const updatedCompany = { id: companyIdParam, name: updateData.name, industry: updateData.industry, domain: 'test.com' };

    beforeEach(() => {
        (authCore.authenticate as jest.Mock).mockImplementation(() => async (c, next) => { await next(); });
        // Mock for checkCompanyAccess: Allows ADMIN or COMPANY_ADMIN of the specific company
        (authCore.checkCompanyAccess as jest.Mock).mockImplementation(() => async (c, next) => {
            const user = c.get('user');
            const routeCompanyId = c.req.param('id');
            if (user.role === 'ADMIN' || (user.role === 'COMPANY_ADMIN' && user.companyId === routeCompanyId)) {
                await next();
            } else {
                c.res.status(403); return c.res.json({ error: 'Forbidden: Insufficient role or company mismatch' });
            }
        });
    });

    it('should update a company for an ADMIN user', async () => {
      const c = mockContext('PUT', { id: companyIdParam }, updateData, updateData, adminUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({ id: companyIdParam, name: 'Old Name' }); // Company exists
      (prisma.company.update as jest.Mock).mockResolvedValue(updatedCompany);

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await updateCompany(c as any);
        });
      });

      expect(prisma.company.update).toHaveBeenCalledWith({ where: { id: companyIdParam }, data: updateData });
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(updatedCompany);
    });

    it('should update a company for a COMPANY_ADMIN of that company', async () => {
      const c = mockContext('PUT', { id: companyIdParam }, updateData, updateData, companyAdminUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({ id: companyIdParam, name: 'Old Name' });
      (prisma.company.update as jest.Mock).mockResolvedValue(updatedCompany);

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await updateCompany(c as any);
        });
      });

      expect(prisma.company.update).toHaveBeenCalledWith({ where: { id: companyIdParam }, data: updateData });
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(updatedCompany);
    });

    it('should return 403 Forbidden for a COMPANY_ADMIN of another company', async () => {
      const c = mockContext('PUT', { id: companyIdParam }, updateData, updateData, anotherCompanyAdminUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({ id: companyIdParam, name: 'Old Name' });

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => { // This should block
            await updateCompany(c as any);
        });
      });

      expect(prisma.company.update).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(403);
      expect(c.res.jsonBody).toEqual({ error: 'Forbidden: Insufficient role or company mismatch' });
    });

    it('should return 403 Forbidden for a normal USER in the company (not COMPANY_ADMIN or ADMIN)', async () => {
      const c = mockContext('PUT', { id: companyIdParam }, updateData, updateData, normalUserInCompany);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({ id: companyIdParam, name: 'Old Name' });

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => { // This should block due to role
            await updateCompany(c as any);
        });
      });

      expect(prisma.company.update).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(403);
      // The error message comes from the checkCompanyAccess mock
      expect(c.res.jsonBody).toEqual({ error: 'Forbidden: Insufficient role or company mismatch' });
    });

    it('should return 404 if company to update is not found', async () => {
      const c = mockContext('PUT', { id: companyIdParam }, updateData, updateData, adminUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null); // Company does not exist

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await updateCompany(c as any);
        });
      });

      expect(prisma.company.update).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'Company not found' });
    });

    it('should handle errors during company update', async () => {
      const c = mockContext('PUT', { id: companyIdParam }, updateData, updateData, adminUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({ id: companyIdParam, name: 'Old Name' });
      (prisma.company.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await updateCompany(c as any);
        });
      });

      expect(prisma.company.update).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to update company' });
    });
  });

  describe('DELETE /companies/:id (deleteCompany)', () => {
    const companyIdParam = 'compToDelete123';
    const adminUser = { id: 'adminUser', role: 'ADMIN', companyId: null };
    const nonAdminUser = { id: 'user1', role: 'USER', companyId: 'comp1' };
    const existingCompany = { id: companyIdParam, name: 'Company To Delete' };

    beforeEach(() => {
        (authCore.authenticate as jest.Mock).mockImplementation(() => async (c, next) => { await next(); });
        (authCore.authorize as jest.Mock).mockImplementation((role) => async (c, next) => {
            const user = c.get('user');
            if (user && user.role === role) {
                await next();
            } else {
                c.res.status(403); return c.res.json({ error: 'Forbidden' });
            }
        });
    });

    it('should delete a company for an ADMIN user', async () => {
      const c = mockContext('DELETE', { id: companyIdParam }, null, null, adminUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(existingCompany); // Company exists
      (prisma.company.delete as jest.Mock).mockResolvedValue(existingCompany);

      await authCore.authenticate()(c, async () => {
        await authCore.authorize('ADMIN')(c, async () => {
            await deleteCompany(c as any);
        });
      });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { id: companyIdParam } });
      expect(prisma.company.delete).toHaveBeenCalledWith({ where: { id: companyIdParam } });
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual({ message: 'Company deleted successfully' });
    });

    it('should return 403 Forbidden for a NON-ADMIN user', async () => {
      const c = mockContext('DELETE', { id: companyIdParam }, null, null, nonAdminUser);

      await authCore.authenticate()(c, async () => {
        await authCore.authorize('ADMIN')(c, async () => { // This should block
            await deleteCompany(c as any);
        });
      });

      expect(prisma.company.delete).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(403);
      expect(c.res.jsonBody).toEqual({ error: 'Forbidden' });
    });

    it('should return 404 if company to delete is not found', async () => {
      const c = mockContext('DELETE', { id: companyIdParam }, null, null, adminUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null); // Company does not exist

      await authCore.authenticate()(c, async () => {
        await authCore.authorize('ADMIN')(c, async () => {
            await deleteCompany(c as any);
        });
      });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { id: companyIdParam } });
      expect(prisma.company.delete).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'Company not found' });
    });

    it('should handle errors during company deletion', async () => {
      const c = mockContext('DELETE', { id: companyIdParam }, null, null, adminUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(existingCompany);
      (prisma.company.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await authCore.authenticate()(c, async () => {
        await authCore.authorize('ADMIN')(c, async () => {
            await deleteCompany(c as any);
        });
      });

      expect(prisma.company.delete).toHaveBeenCalledTimes(1);
      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to delete company' });
    });
  });

  describe('GET /companies/:id/stats (getCompanyStats)', () => {
    const companyIdParam = 'comp123';
    const adminUser = { id: 'adminU', role: 'ADMIN', companyId: null };
    const memberUser = { id: 'memberU', role: 'USER', companyId: companyIdParam };
    const nonMemberUser = { id: 'nonMemberU', role: 'USER', companyId: 'otherComp' };
    const mockCompanyExists = { id: companyIdParam, name: 'Test Company for Stats' };
    const mockStats = {
      totalUsers: 10,
      activeUsers: 8,
      pendingInvitations: 2,
      openAlerts: 5,
    };

    beforeEach(() => {
        (authCore.authenticate as jest.Mock).mockImplementation(() => async (c, next) => { await next(); });
        // Mock for checkCompanyAccess: Allows ADMIN or any member of the specific company for stats
        (authCore.checkCompanyAccess as jest.Mock).mockImplementation(() => async (c, next) => {
            const user = c.get('user');
            const routeCompanyId = c.req.param('id');
            if (user.role === 'ADMIN' || (user.companyId && user.companyId === routeCompanyId)) {
                await next();
            } else {
                c.res.status(403); return c.res.json({ error: 'Forbidden: Company access denied for stats' });
            }
        });
        (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompanyExists); // Assume company exists by default
        (prisma.user.count as jest.Mock).mockImplementation(({ where }) => {
            if (where && where.isActive === true) return Promise.resolve(mockStats.activeUsers);
            return Promise.resolve(mockStats.totalUsers);
        });
        (prisma.invitation.count as jest.Mock).mockResolvedValue(mockStats.pendingInvitations);
        (prisma.alert.count as jest.Mock).mockResolvedValue(mockStats.openAlerts);

    });

    it('should return company stats for an ADMIN user', async () => {
      const c = mockContext('GET', { id: companyIdParam }, null, null, adminUser);

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await getCompanyStats(c as any);
        });
      });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { id: companyIdParam } });
      expect(prisma.user.count).toHaveBeenCalledWith({ where: { companyId: companyIdParam } });
      expect(prisma.user.count).toHaveBeenCalledWith({ where: { companyId: companyIdParam, isActive: true } });
      expect(prisma.invitation.count).toHaveBeenCalledWith({ where: { companyId: companyIdParam, isAccepted: false, expiresAt: { gte: expect.any(Date) } } });
      expect(prisma.alert.count).toHaveBeenCalledWith({ where: { companyId: companyIdParam, status: 'open' } });
      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockStats);
    });

    it('should return company stats for a member of the company', async () => {
      const c = mockContext('GET', { id: companyIdParam }, null, null, memberUser);

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await getCompanyStats(c as any);
        });
      });

      expect(c.res.statusVal).toBe(200);
      expect(c.res.jsonBody).toEqual(mockStats);
    });

    it('should return 403 Forbidden for a user not part of the company and not ADMIN', async () => {
      const c = mockContext('GET', { id: companyIdParam }, null, null, nonMemberUser);

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => { // This should block
            await getCompanyStats(c as any);
        });
      });

      expect(prisma.user.count).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(403);
      expect(c.res.jsonBody).toEqual({ error: 'Forbidden: Company access denied for stats' });
    });

    it('should return 404 if company not found', async () => {
      const c = mockContext('GET', { id: companyIdParam }, null, null, adminUser);
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null); // Company does not exist

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await getCompanyStats(c as any);
        });
      });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { id: companyIdParam } });
      expect(prisma.user.count).not.toHaveBeenCalled();
      expect(c.res.statusVal).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'Company not found' });
    });

    it('should handle errors during stats retrieval (e.g., user.count fails)', async () => {
      const c = mockContext('GET', { id: companyIdParam }, null, null, adminUser);
      (prisma.user.count as jest.Mock).mockRejectedValue(new Error('Database error on user count'));

      await authCore.authenticate()(c, async () => {
        await authCore.checkCompanyAccess()(c, async () => {
            await getCompanyStats(c as any);
        });
      });

      expect(c.res.statusVal).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch company stats' });
    });
  });
});
