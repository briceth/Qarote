import { jest } from '@jest/globals';

export const hashPassword = jest.fn(async (password: string) => `hashed_${password}`);

export const comparePassword = jest.fn(async (plainPassword: string, hashedPassword?: string | null) => {
  if (!hashedPassword) return false;
  return `hashed_${plainPassword}` === hashedPassword;
});

export const generateToken = jest.fn((userId: string, email: string, companyId?: string | null) => {
  return `mock_token_for_${userId}_${companyId || 'no_company'}`;
});

export const generateRandomToken = jest.fn(async (length: number = 32) => {
  return `random_mock_token_${length}`;
});

// Mock for the 'authenticate' middleware
export const authenticate = jest.fn(() => {
  return async (c: any, next: any) => {
    // Default behavior: try to set user from a mock token for testing protected routes
    // Test cases can override c.get('user') by providing the `user` param in mockContext
    if (c.get('user')) { // If user is already set by mockContext, respect that
      await next();
      return;
    }
    // Otherwise, try to simulate token-based auth
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer mock_token_for_')) {
        const tokenParts = authHeader.split('_');
        const userId = tokenParts[3];
        const companyId = tokenParts[4] !== 'no' ? tokenParts[4] : undefined;
        const userRole = tokenParts[5] || 'USER'; // Assume role is part of token or user object
      c.set('user', { id: userId, email: `user_${userId}@example.com`, companyId: companyId, role: userRole });
    } else if (authHeader?.startsWith('Bearer invalid_token')) {
      // c.set('user', null) // or don't set, depending on how actual middleware handles it
    }
    await next();
  };
});

// Mock for the 'authorize' middleware
export const authorize = jest.fn((allowedRoles: string | string[]) => {
  return async (c: any, next: any) => {
    const user = c.get('user');
    if (!user) {
      c.res.status(401);
      return c.res.json({ error: 'Unauthorized' });
    }
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!user.role || !roles.includes(user.role)) {
      c.res.status(403);
      return c.res.json({ error: 'Forbidden' });
    }
    await next();
  };
});

// Mock for the 'checkCompanyAccess' middleware
// This is a simplified mock. Actual middleware might have more complex logic.
export const checkCompanyAccess = jest.fn((options?: { allowUserItself?: boolean }) => {
  return async (c: any, next: any) => {
    const user = c.get('user');
    const companyIdParam = c.req.param('id') || c.req.param('companyId'); // or however companyId is passed

    if (!user) {
      c.res.status(401);
      return c.res.json({ error: 'Unauthorized for company access check' });
    }

    // Admins have access to all companies
    if (user.role === 'ADMIN') {
      await next();
      return;
    }

    // If checking against user's own company (e.g., /companies/me or PUT /companies/:id where user is admin of :id)
    if (!companyIdParam && user.companyId) { // For routes like /companies/me
        await next();
        return;
    }

    if (companyIdParam && user.companyId === companyIdParam) {
        // Further check if user is a company admin for certain operations if needed
        // For now, if companyId matches, grant access for non-ADMIN roles.
        // Specific tests can refine this by checking user.role within company context.
        await next();
        return;
    }

    // If allowUserItself is true and the route is about the user's own ID (not company)
    // This part of the mock might be less relevant for company controller but included for completeness
    if (options?.allowUserItself && c.req.param('id') === user.id) {
        await next();
        return;
    }

    c.res.status(403);
    return c.res.json({ error: 'Forbidden: Company access denied' });
  };
});


export const lucia = {
  createSession: jest.fn(async (userId, attributes) => ({ id: `session_for_${userId}` })),
  invalidateSession: jest.fn(async (sessionId) => {}),
  readSessionCookie: jest.fn((cookieHeader) => {
    if (cookieHeader && cookieHeader.includes('mock_session_cookie')) {
      return 'valid_session_id';
    }
    return null;
  }),
  validateSession: jest.fn(async (sessionId) => {
    if (sessionId === 'valid_session_id') {
      return {
        user: { id: 'user_from_session', email: 'session@example.com', companyId: 'company_from_session', role: 'USER' },
        session: { id: sessionId, fresh: false, userId: 'user_from_session' }
      };
    }
    return { user: null, session: null };
  }),
  createSessionCookie: jest.fn((sessionId) => ({
    name: 'auth_session',
    value: `mock_session_cookie_for_${sessionId}`,
    attributes: { path: '/', httpOnly: true, secure: true, sameSite: 'lax' }
  })),
   generateId: jest.fn((length: number = 15) => `generated_id_${length}`),
};
