import { authenticate, isAdmin } from './auth';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { User } from '../../../shared/schema';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../storage-provider', () => ({
  storage: {
    getUserById: jest.fn()
  }
}));

import { storage } from '../../storage-provider';

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request> & {
    headers: any;
    user?: any;
    path?: string;
    get: jest.Mock;
    header: jest.Mock;
    accepts: jest.Mock;
  };
  let mockResponse: any;
  let mockNext: jest.Mock;
  let statusSpy: jest.Mock;
  let jsonSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
      user: undefined,
      path: '',
      get: jest.fn(),
      header: jest.fn(),
      accepts: jest.fn()
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
    statusSpy = mockResponse.status;
    jsonSpy = mockResponse.json;
  });

  describe('authenticate', () => {
    test('should authenticate valid JWT token', async () => {
      const validToken = 'valid-jwt-token';
      const decodedToken = { userId: 123, id: 123 };
      const mockUser = {
        id: 123,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      (storage.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(validToken, expect.any(String));
      expect(storage.getUserById).toHaveBeenCalledWith(123);
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle token with id instead of userId', async () => {
      const validToken = 'valid-jwt-token';
      const decodedToken = { id: 456 }; // Using id instead of userId
      const mockUser = {
        id: 456,
        username: 'testuser',
        email: 'test@example.com'
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      (storage.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(storage.getUserById).toHaveBeenCalledWith(456);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should reject request without authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidHeader'
      };

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    test('should reject request with invalid JWT token', async () => {
      const invalidToken = 'invalid-jwt-token';

      mockRequest.headers = {
        authorization: `Bearer ${invalidToken}`
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    test('should reject request with expired JWT token', async () => {
      const expiredToken = 'expired-jwt-token';

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Token expired' });
    });

    test('should reject request when user not found', async () => {
      const validToken = 'valid-jwt-token';
      const decodedToken = { userId: 123 };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      (storage.getUserById as jest.Mock).mockResolvedValue(null);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    test('should handle database errors during user lookup', async () => {
      const validToken = 'valid-jwt-token';
      const decodedToken = { userId: 123 };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      (storage.getUserById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Authentication failed' });
    });

    test('should handle generic JWT verification errors', async () => {
      const token = 'some-token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Generic JWT error');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Authentication failed' });
    });

    test('should log authentication attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockRequest.path = '/api/protected';
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 123 });
      (storage.getUserById as jest.Mock).mockResolvedValue({
        id: 123,
        username: 'testuser',
        email: 'test@example.com'
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith('[AUTH] Authentication attempt for path: /api/protected');
      expect(consoleSpy).toHaveBeenCalledWith('[AUTH] Token received (first 20 chars): valid-token...');
      expect(consoleSpy).toHaveBeenCalledWith('[AUTH] Token decoded, userId: 123');

      consoleSpy.mockRestore();
    });
  });

  describe('isAdmin', () => {
    test('should allow admin user to proceed', () => {
      mockRequest.user = {
        id: 123,
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin'
      };

      isAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should reject non-admin user', () => {
      mockRequest.user = {
        id: 123,
        username: 'regularuser',
        email: 'user@example.com',
        role: 'user'
      };

      isAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request without user', () => {
      mockRequest.user = undefined;

      isAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Admin access required' });
    });

    test('should reject user with undefined role', () => {
      mockRequest.user = {
        id: 123,
        username: 'user',
        email: 'user@example.com'
        // role is undefined
      };

      isAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Admin access required' });
    });

    test('should handle errors during admin check', () => {
      mockRequest.user = null; // This would cause an error

      expect(() => {
        isAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();

      expect(statusSpy).toHaveBeenCalledWith(403);
    });
  });

  describe('Security Features', () => {
    test('should handle long tokens securely', async () => {
      const longToken = 'a'.repeat(1000);

      mockRequest.headers = {
        authorization: `Bearer ${longToken}`
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 123 });
      (storage.getUserById as jest.Mock).mockResolvedValue({
        id: 123,
        username: 'testuser'
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(longToken, expect.any(String));
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle tokens with special characters', async () => {
      const specialToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      mockRequest.headers = {
        authorization: `Bearer ${specialToken}`
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 123 });
      (storage.getUserById as jest.Mock).mockResolvedValue({
        id: 123,
        username: 'testuser'
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle case-insensitive Bearer prefix', async () => {
      const token = 'test-token';

      mockRequest.headers = {
        authorization: `bearer ${token}`
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 123 });
      (storage.getUserById as jest.Mock).mockResolvedValue({
        id: 123,
        username: 'testuser'
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty authorization header', async () => {
      mockRequest.headers = {
        authorization: ''
      };

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    test('should handle authorization header with only Bearer prefix', async () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    test('should handle multiple spaces in authorization header', async () => {
      const token = 'test-token';

      mockRequest.headers = {
        authorization: 'Bearer  test-token  '
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 123 });
      (storage.getUserById as jest.Mock).mockResolvedValue({
        id: 123,
        username: 'testuser'
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(' test-token  ', expect.any(String));
    });

    test('should handle concurrent authentication requests', async () => {
      const token1 = 'token1';
      const token2 = 'token2';

      mockRequest.headers = {
        authorization: `Bearer ${token1}`
      };

      const mockRequest2: Partial<Request> = {
        path: '/api/test2',
        headers: {
          authorization: `Bearer ${token2}`
        }
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 123 });
      (storage.getUserById as jest.Mock).mockResolvedValue({
        id: 123,
        username: 'testuser'
      });

      // Simulate concurrent requests
      const promises = [
        authenticate(mockRequest as Request, mockResponse as Response, mockNext),
        authenticate(mockRequest2 as Request, mockResponse as Response, mockNext)
      ];

      await Promise.all(promises);

      expect(jwt.verify).toHaveBeenCalledTimes(2);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple authentication attempts efficiently', async () => {
      const tokens = Array.from({ length: 10 }, (_, i) => `token-${i}`);
      const startTime = Date.now();

      for (const token of tokens) {
        mockRequest.headers = {
          authorization: `Bearer ${token}`
        };

        (jwt.verify as jest.Mock).mockReturnValue({ userId: 123 });
        (storage.getUserById as jest.Mock).mockResolvedValue({
          id: 123,
          username: 'testuser'
        });

        await authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 10 authentications in less than 200ms
      expect(duration).toBeLessThan(200);
      expect(mockNext).toHaveBeenCalledTimes(10);
    });

    test('should handle failed authentications efficiently', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 5; i++) {
        mockRequest.headers = {
          authorization: `Bearer invalid-token-${i}`
        };

        (jwt.verify as jest.Mock).mockImplementation(() => {
          throw new jwt.JsonWebTokenError('Invalid token');
        });

        await authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(statusSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete authentication flow', async () => {
      // Simulate a complete authentication flow
      const token = 'valid-jwt-token';
      const decodedToken = { userId: 123 };
      const mockUser = {
        id: 123,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      (storage.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle admin authentication flow', async () => {
      // First authenticate as admin
      const adminToken = 'admin-jwt-token';
      const decodedToken = { userId: 456 };
      const mockAdminUser = {
        id: 456,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      };

      mockRequest.headers = {
        authorization: `Bearer ${adminToken}`
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      (storage.getUserById as jest.Mock).mockResolvedValue(mockAdminUser);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Then check admin access
      isAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2); // Once for auth, once for admin check
    });

    test('should handle user role changes', async () => {
      // User starts as regular user
      mockRequest.user = {
        id: 123,
        username: 'user',
        email: 'user@example.com',
        role: 'user'
      };

      isAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(403);

      // User gets promoted to admin
      mockRequest.user = {
        id: 123,
        username: 'user',
        email: 'user@example.com',
        role: 'admin'
      };

      isAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});