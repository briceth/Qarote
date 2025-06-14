import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Hono } from 'hono';
import { prisma } from '../../core/__mocks__/prisma';
import { hashPassword, generateToken, lucia, generateRandomToken } from '../../core/auth'; // Import actual functions to be mocked
import {
  registerUser,
  loginUser,
  getUserProfile,
  requestPasswordReset,
  resetPassword,
  changePassword,
  acceptInvitation,
} from '../auth.controller'; // Adjust path as necessary

// Mock Hono context
const mockContext = (method: string, params: any = {}, body: any = null, validData: any = null, user: any = null) => {
  const req = {
    method,
    param: (key: string) => params[key],
    json: async () => body,
    query: (key: string) => params[key], // For query parameters
    valid: (target: 'json' | 'query' | 'param' | 'header' | 'cookie') => validData,
  } as any;

  const res = {
    status: 0,
    jsonBody: null,
    json: function (data: any) {
      this.jsonBody = data;
      return this;
    },
    status: function (statusCode: number) {
      this.status = statusCode;
      return this;
    },
  } as any;

  const honoContext: any = {
    req,
    res,
    ...res, // Spread res for status and json methods
    get: (key: string) => {
      if (key === 'user') return user;
      return undefined;
    },
    set: jest.fn(), // Mock set if used by any middleware or controller
    next: jest.fn(),
  };
  return honoContext;
};

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset specific mock implementations if necessary
  });

  // Test suites for each controller function will go here

  describe('POST /register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };
    const registerDataWithCompany = {
      ...registerData,
      companyName: 'Test Company',
    };

    beforeEach(() => {
      (hashPassword as jest.Mock).mockImplementation(async (password) => `hashed_${password}`);
      (generateToken as jest.Mock).mockImplementation((userId, email, companyId) => `token_for_${userId}`);
      (lucia.generateId as jest.Mock).mockReturnValue('mock_user_id');

    });

    it('should register a new user without a company', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockImplementation(async ({ data }) => ({
        ...data,
        id: 'mock_user_id',
        companyId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const c = mockContext('POST', {}, registerData, registerData);
      await registerUser(c as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: registerData.email } });
      expect(hashPassword).toHaveBeenCalledWith(registerData.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          id: 'mock_user_id',
          email: registerData.email,
          hashedPassword: `hashed_${registerData.password}`,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          companyId: null,
        },
      });
      expect(lucia.createSession).toHaveBeenCalledWith('mock_user_id', {});
      expect(lucia.createSessionCookie).toHaveBeenCalledWith(expect.stringContaining('session_for_mock_user_id'));
      expect(c.res.status).toBe(201);
      expect(c.res.jsonBody.user.email).toBe(registerData.email);
      expect(c.res.jsonBody.user.companyId).toBeNull();
      expect(c.res.jsonBody.token).toBeUndefined(); // Token should be in cookie now
    });

    it('should register a new user with a new company', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (lucia.generateId as jest.Mock).mockImplementation((length) => length === 15 ? 'mock_user_id' : 'mock_company_id');


      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        // Simulate the transaction by calling the callback with a mock prisma client
        // that has mock implementations for company.create and user.create
        const mockPrismaTx = {
          company: {
            create: jest.fn().mockResolvedValue({ id: 'mock_company_id', name: registerDataWithCompany.companyName }),
          },
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'mock_user_id',
              ...registerData,
              companyId: 'mock_company_id',
              hashedPassword: `hashed_${registerData.password}`,
              isActive: true,
            }),
          },
        };
        return callback(mockPrismaTx);
      });

      const c = mockContext('POST', {}, registerDataWithCompany, registerDataWithCompany);
      await registerUser(c as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: registerDataWithCompany.email } });
      expect(hashPassword).toHaveBeenCalledWith(registerDataWithCompany.password);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      // Access the mock calls from within the transaction mock
      const transactionCallback = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      const mockPrismaTxInstance = {
        company: { create: jest.fn().mockResolvedValue({ id: 'mock_company_id', name: registerDataWithCompany.companyName }) },
        user: { create: jest.fn() }
      };
      await transactionCallback(mockPrismaTxInstance); // Execute the transaction callback to populate mock calls

      expect(mockPrismaTxInstance.company.create).toHaveBeenCalledWith({
        data: { id: 'mock_company_id', name: registerDataWithCompany.companyName },
      });
      expect(mockPrismaTxInstance.user.create).toHaveBeenCalledWith({
        data: {
          id: 'mock_user_id',
          email: registerDataWithCompany.email,
          hashedPassword: `hashed_${registerDataWithCompany.password}`,
          firstName: registerDataWithCompany.firstName,
          lastName: registerDataWithCompany.lastName,
          companyId: 'mock_company_id',
        },
      });
      expect(lucia.createSession).toHaveBeenCalledWith('mock_user_id', {});
      expect(lucia.createSessionCookie).toHaveBeenCalledWith(expect.stringContaining('session_for_mock_user_id'));
      expect(c.res.status).toBe(201);
      expect(c.res.jsonBody.user.email).toBe(registerDataWithCompany.email);
      expect(c.res.jsonBody.user.companyId).toBe('mock_company_id');
    });

    it('should return 409 if user already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing_user_id', email: registerData.email });
      const c = mockContext('POST', {}, registerData, registerData);
      await registerUser(c as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: registerData.email } });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(c.res.status).toBe(409);
      expect(c.res.jsonBody).toEqual({ error: 'User already exists' });
    });

    it('should handle errors during registration', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));
      const c = mockContext('POST', {}, registerData, registerData);
      await registerUser(c as any);

      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to register user' });
    });
  });

  describe('POST /login', () => {
    const loginData = { email: 'test@example.com', password: 'password123' };
    const mockUser = {
      id: 'user123',
      email: loginData.email,
      hashedPassword: 'hashed_password123',
      firstName: 'Test',
      lastName: 'User',
      companyId: 'comp456',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      (comparePassword as jest.Mock).mockImplementation(async (plain, hashed) => `hashed_${plain}` === hashed);
      (generateToken as jest.Mock).mockImplementation((userId, email, companyId) => `token_for_${userId}`);
    });

    it('should login a user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const c = mockContext('POST', {}, loginData, loginData);
      await loginUser(c as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: loginData.email } });
      expect(comparePassword).toHaveBeenCalledWith(loginData.password, mockUser.hashedPassword);
      expect(lucia.createSession).toHaveBeenCalledWith(mockUser.id, {});
      expect(lucia.createSessionCookie).toHaveBeenCalledWith(expect.stringContaining(`session_for_${mockUser.id}`));
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody.user.email).toBe(loginData.email);
      expect(c.res.jsonBody.token).toBeUndefined(); // Token should be in cookie
    });

    it('should return 401 for invalid credentials (user not found)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const c = mockContext('POST', {}, loginData, loginData);
      await loginUser(c as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: loginData.email } });
      expect(comparePassword).not.toHaveBeenCalled();
      expect(c.res.status).toBe(401);
      expect(c.res.jsonBody).toEqual({ error: 'Invalid email or password' });
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(false); // Simulate wrong password

      const c = mockContext('POST', {}, loginData, loginData);
      await loginUser(c as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: loginData.email } });
      expect(comparePassword).toHaveBeenCalledWith(loginData.password, mockUser.hashedPassword);
      expect(c.res.status).toBe(401);
      expect(c.res.jsonBody).toEqual({ error: 'Invalid email or password' });
    });

    it('should return 403 if user account is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser);
      (comparePassword as jest.Mock).mockResolvedValue(true);


      const c = mockContext('POST', {}, loginData, loginData);
      await loginUser(c as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: loginData.email } });
      expect(comparePassword).toHaveBeenCalledWith(loginData.password, inactiveUser.hashedPassword);
      expect(c.res.status).toBe(403);
      expect(c.res.jsonBody).toEqual({ error: 'Account is inactive. Please contact support.' });
    });

    it('should handle errors during login', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));
      const c = mockContext('POST', {}, loginData, loginData);
      await loginUser(c as any);

      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to login user' });
    });
  });

  describe('GET /me', () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      companyId: 'comp456',
      company: { id: 'comp456', name: 'Test Company' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return the current user profile', async () => {
      // Simulate that 'authenticate' middleware has run and set the user
      const c = mockContext('GET', {}, null, null, { ...mockUser, company: undefined }); // c.get('user') will return this
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);


      await getUserProfile(c as any);

      // The controller should use c.get('user').id to fetch the full profile
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: { company: true },
      });
      expect(c.res.status).toBe(200);
      // Remove hashedPassword before comparing
      const { hashedPassword, ...expectedUser } = mockUser;
      expect(c.res.jsonBody).toEqual(expectedUser);
    });

    it('should return 404 if user from token not found in DB (edge case)', async () => {
      const c = mockContext('GET', {}, null, null, { id: 'user123' }); // User from token
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // But not in DB

      await getUserProfile(c as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        include: { company: true },
      });
      expect(c.res.status).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'User not found' });
    });

    it('should return 401 if user is not authenticated (c.get("user") is null)', async () => {
      const c = mockContext('GET', {}, null, null, null); // No user on context

      await getUserProfile(c as any);

      expect(prisma.user.findUnique).not.toHaveBeenCalled(); // Should not try to fetch if no user id
      expect(c.res.status).toBe(401);
      expect(c.res.jsonBody).toEqual({ error: 'Unauthorized' });
    });

    it('should handle errors during profile retrieval', async () => {
      const c = mockContext('GET', {}, null, null, { id: 'user123' });
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getUserProfile(c as any);

      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to fetch user profile' });
    });
  });

  describe('POST /password-reset/request', () => {
    const requestData = { email: 'test@example.com' };
    const mockUser = { id: 'user123', email: requestData.email, firstName: 'Test' };
    const mockToken = 'mock_reset_token_123';

    beforeEach(() => {
      (generateRandomToken as jest.Mock).mockResolvedValue(mockToken);
      (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({
        token: mockToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      });
      // Mock sendPasswordResetEmail - assuming it's imported and used in the actual controller
      // For now, we'll assume it's called and doesn't throw.
      // If it's from a module, it would need jest.mock for that module.
    });

    it('should successfully request a password reset for an existing user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const c = mockContext('POST', {}, requestData, requestData);
      await requestPasswordReset(c as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: requestData.email } });
      expect(generateRandomToken).toHaveBeenCalledWith(40); // Assuming token length
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          token: mockToken,
          expiresAt: expect.any(Date), // Check that expiresAt is a Date
        },
      });
      // expect(sendPasswordResetEmail).toHaveBeenCalledWith(mockUser.email, mockUser.firstName, mockToken); // Verify email sending
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody).toEqual({ message: 'Password reset email sent.' });
    });

    it('should return success even if user is not found (to prevent email enumeration)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const c = mockContext('POST', {}, requestData, requestData);
      await requestPasswordReset(c as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: requestData.email } });
      expect(generateRandomToken).not.toHaveBeenCalled();
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      // expect(sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody).toEqual({ message: 'Password reset email sent.' });
    });

    it('should handle errors during password reset request', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser); // User found
      (generateRandomToken as jest.Mock).mockResolvedValue(mockToken);
      (prisma.passwordResetToken.create as jest.Mock).mockRejectedValue(new Error('Database error')); // DB error on token creation

      const c = mockContext('POST', {}, requestData, requestData);
      await requestPasswordReset(c as any);

      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to request password reset.' });
    });

    it('should handle error if generateRandomToken fails', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (generateRandomToken as jest.Mock).mockRejectedValue(new Error('Token generation failed'));

      const c = mockContext('POST', {}, requestData, requestData);
      await requestPasswordReset(c as any);

      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to request password reset.' });
    });
  });

  describe('POST /password-reset', () => {
    const resetData = { token: 'valid_reset_token', newPassword: 'newPassword123' };
    const mockPasswordResetToken = {
      token: resetData.token,
      userId: 'user123',
      expiresAt: new Date(Date.now() + 3600 * 1000), // Not expired
    };
    const mockUser = { id: 'user123', email: 'test@example.com', hashedPassword: 'old_hashed_password' };

    beforeEach(() => {
      (hashPassword as jest.Mock).mockImplementation(async (password) => `hashed_${password}`);
    });

    it('should successfully reset the password', async () => {
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockPasswordResetToken);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser); // Not strictly needed by this controller but good for consistency
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, hashedPassword: `hashed_${resetData.newPassword}` });
      (prisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(prisma));


      const c = mockContext('POST', {}, resetData, resetData);
      await resetPassword(c as any);

      expect(prisma.passwordResetToken.findFirst).toHaveBeenCalledWith({ where: { token: resetData.token } });
      expect(hashPassword).toHaveBeenCalledWith(resetData.newPassword);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockPasswordResetToken.userId },
        data: { hashedPassword: `hashed_${resetData.newPassword}` },
      });
      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: mockPasswordResetToken.userId } });
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody).toEqual({ message: 'Password has been reset successfully.' });
    });

    it('should return 400 if token is invalid or not found', async () => {
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(null);
      const c = mockContext('POST', {}, resetData, resetData);
      await resetPassword(c as any);

      expect(prisma.passwordResetToken.findFirst).toHaveBeenCalledWith({ where: { token: resetData.token } });
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(c.res.status).toBe(400);
      expect(c.res.jsonBody).toEqual({ error: 'Invalid or expired token.' });
    });

    it('should return 400 if token is expired', async () => {
      const expiredToken = { ...mockPasswordResetToken, expiresAt: new Date(Date.now() - 3600 * 1000) }; // Expired
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(expiredToken);
      const c = mockContext('POST', {}, resetData, resetData);
      await resetPassword(c as any);

      expect(prisma.passwordResetToken.findFirst).toHaveBeenCalledWith({ where: { token: resetData.token } });
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(c.res.status).toBe(400);
      expect(c.res.jsonBody).toEqual({ error: 'Invalid or expired token.' });
    });

    it('should handle errors during password reset (e.g., user update fails)', async () => {
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockPasswordResetToken);
      (hashPassword as jest.Mock).mockResolvedValue(`hashed_${resetData.newPassword}`);
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('Database error during user update'));
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        // Simulate transaction failure
        try {
          await callback(prisma);
        } catch (e) {
          throw e; // rethrow to be caught by controller
        }
      });

      const c = mockContext('POST', {}, resetData, resetData);
      await resetPassword(c as any);

      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to reset password.' });
    });

    it('should handle error if findFirst passwordResetToken fails', async () => {
      (prisma.passwordResetToken.findFirst as jest.Mock).mockRejectedValue(new Error('DB error findFirst'));
       const c = mockContext('POST', {}, resetData, resetData);
      await resetPassword(c as any);
      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to reset password.' });
    });
  });

  describe('POST /password-change', () => {
    const changePasswordData = { currentPassword: 'oldPassword123', newPassword: 'newPassword456' };
    const mockAuthedUser = { id: 'user123', email: 'test@example.com', hashedPassword: 'hashed_oldPassword123' };

    beforeEach(() => {
      (comparePassword as jest.Mock).mockImplementation(async (plain, hashed) => `hashed_${plain}` === hashed);
      (hashPassword as jest.Mock).mockImplementation(async (password) => `hashed_${password}`);
    });

    it('should successfully change the password', async () => {
      const c = mockContext('POST', {}, changePasswordData, changePasswordData, mockAuthedUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAuthedUser); // For fetching current user to compare pass
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockAuthedUser, hashedPassword: `hashed_${changePasswordData.newPassword}` });

      await changePassword(c as any);

      expect(c.get('user')).toEqual(mockAuthedUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockAuthedUser.id } });
      expect(comparePassword).toHaveBeenCalledWith(changePasswordData.currentPassword, mockAuthedUser.hashedPassword);
      expect(hashPassword).toHaveBeenCalledWith(changePasswordData.newPassword);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockAuthedUser.id },
        data: { hashedPassword: `hashed_${changePasswordData.newPassword}` },
      });
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody).toEqual({ message: 'Password changed successfully.' });
    });

    it('should return 401 if user is not authenticated', async () => {
      const c = mockContext('POST', {}, changePasswordData, changePasswordData, null); // No authenticated user
      await changePassword(c as any);

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(c.res.status).toBe(401);
      expect(c.res.jsonBody).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if authenticated user not found in DB (edge case)', async () => {
      const c = mockContext('POST', {}, changePasswordData, changePasswordData, mockAuthedUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // User from token not in DB

      await changePassword(c as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockAuthedUser.id } });
      expect(comparePassword).not.toHaveBeenCalled();
      expect(c.res.status).toBe(404);
      expect(c.res.jsonBody).toEqual({ error: 'User not found' });
    });

    it('should return 400 if current password is incorrect', async () => {
      const c = mockContext('POST', {}, changePasswordData, changePasswordData, mockAuthedUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAuthedUser);
      (comparePassword as jest.Mock).mockResolvedValue(false); // Current password does not match

      await changePassword(c as any);

      expect(comparePassword).toHaveBeenCalledWith(changePasswordData.currentPassword, mockAuthedUser.hashedPassword);
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(c.res.status).toBe(400);
      expect(c.res.jsonBody).toEqual({ error: 'Incorrect current password.' });
    });

    it('should handle errors during password change (e.g., user update fails)', async () => {
      const c = mockContext('POST', {}, changePasswordData, changePasswordData, mockAuthedUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAuthedUser);
      (comparePassword as jest.Mock).mockResolvedValue(true); // Current password matches
      (hashPassword as jest.Mock).mockResolvedValue(`hashed_${changePasswordData.newPassword}`);
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('Database error during update'));

      await changePassword(c as any);

      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to change password.' });
    });
  });

  describe('POST /invitation/accept', () => {
    const baseAcceptData = {
      token: 'valid_invite_token',
      firstName: 'Invited',
      lastName: 'User',
      password: 'password123',
    };
    const mockInvitation = {
      id: 'invite123',
      token: baseAcceptData.token,
      email: 'invited@example.com',
      companyId: 'comp789',
      company: { id: 'comp789', name: 'Invited Company' },
      role: 'USER', // or 'ADMIN'
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Not expired
      isAccepted: false,
      userId: null, // Not yet accepted
    };
    const newUserId = 'new_user_id_for_invitee';

    beforeEach(() => {
      (hashPassword as jest.Mock).mockImplementation(async (password) => `hashed_${password}`);
      (lucia.generateId as jest.Mock).mockReturnValue(newUserId);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(prisma)); // Default transaction mock
    });

    it('should successfully accept an invitation for a new user', async () => {
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // User does not exist by this email
      (prisma.user.create as jest.Mock).mockImplementation(async ({ data }) => ({
        id: newUserId,
        ...data,
        companyId: mockInvitation.companyId,
        isActive: true,
      }));
      (prisma.invitation.update as jest.Mock).mockResolvedValue({ ...mockInvitation, isAccepted: true, userId: newUserId });

      const c = mockContext('POST', {}, baseAcceptData, baseAcceptData);
      await acceptInvitation(c as any);

      expect(prisma.invitation.findUnique).toHaveBeenCalledWith({ where: { token: baseAcceptData.token }, include: { company: true } });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: mockInvitation.email } });
      expect(hashPassword).toHaveBeenCalledWith(baseAcceptData.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          id: newUserId,
          email: mockInvitation.email,
          hashedPassword: `hashed_${baseAcceptData.password}`,
          firstName: baseAcceptData.firstName,
          lastName: baseAcceptData.lastName,
          companyId: mockInvitation.companyId,
          role: mockInvitation.role,
          isActive: true,
        },
      });
      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: mockInvitation.id },
        data: { isAccepted: true, acceptedAt: expect.any(Date), userId: newUserId },
      });
      expect(lucia.createSession).toHaveBeenCalledWith(newUserId, {});
      expect(lucia.createSessionCookie).toHaveBeenCalled();
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody.user.email).toBe(mockInvitation.email);
      expect(c.res.jsonBody.user.companyId).toBe(mockInvitation.companyId);
    });

    it('should successfully accept an invitation for an existing user (updates their company and role)', async () => {
      const existingUser = {
        id: 'existing_user_id',
        email: mockInvitation.email,
        firstName: 'Already',
        lastName: 'Exists',
        hashedPassword: 'some_password',
        companyId: null, // No company or different company
        role: 'USER',
        isActive: true,
      };
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...existingUser,
        companyId: mockInvitation.companyId,
        role: mockInvitation.role,
      });
      (prisma.invitation.update as jest.Mock).mockResolvedValue({ ...mockInvitation, isAccepted: true, userId: existingUser.id });

      // For existing user, password from payload is ignored, firstName/lastName too for this test
      const c = mockContext('POST', {}, { token: baseAcceptData.token }, { token: baseAcceptData.token });
      await acceptInvitation(c as any);

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(hashPassword).not.toHaveBeenCalled(); // Password should not be changed for existing user via invitation
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: { companyId: mockInvitation.companyId, role: mockInvitation.role, isActive: true },
      });
      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: mockInvitation.id },
        data: { isAccepted: true, acceptedAt: expect.any(Date), userId: existingUser.id },
      });
      expect(lucia.createSession).toHaveBeenCalledWith(existingUser.id, {});
      expect(c.res.status).toBe(200);
      expect(c.res.jsonBody.user.id).toBe(existingUser.id);
      expect(c.res.jsonBody.user.companyId).toBe(mockInvitation.companyId);
    });

    it('should return 400 if invitation token is invalid or not found', async () => {
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(null);
      const c = mockContext('POST', {}, baseAcceptData, baseAcceptData);
      await acceptInvitation(c as any);
      expect(c.res.status).toBe(400);
      expect(c.res.jsonBody).toEqual({ error: 'Invalid or expired invitation token.' });
    });

    it('should return 400 if invitation token is expired', async () => {
      const expiredInvitation = { ...mockInvitation, expiresAt: new Date(Date.now() - 1000) };
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(expiredInvitation);
      const c = mockContext('POST', {}, baseAcceptData, baseAcceptData);
      await acceptInvitation(c as any);
      expect(c.res.status).toBe(400);
      expect(c.res.jsonBody).toEqual({ error: 'Invalid or expired invitation token.' });
    });

    it('should return 400 if invitation was already accepted', async () => {
      const acceptedInvitation = { ...mockInvitation, isAccepted: true, userId: 'some_user_id' };
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(acceptedInvitation);
      const c = mockContext('POST', {}, baseAcceptData, baseAcceptData);
      await acceptInvitation(c as any);
      expect(c.res.status).toBe(400);
      expect(c.res.jsonBody).toEqual({ error: 'Invitation has already been accepted.' });
    });

    // Missing required fields for new user is handled by Zod validation, not explicitly tested here
    // unless we want to mock c.req.valid('json') to return incomplete data.

    it('should handle errors during invitation acceptance (transaction fails)', async () => {
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // New user
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

      const c = mockContext('POST', {}, baseAcceptData, baseAcceptData);
      await acceptInvitation(c as any);
      expect(c.res.status).toBe(500);
      expect(c.res.jsonBody).toEqual({ error: 'Failed to accept invitation.' });
    });
  });
});
