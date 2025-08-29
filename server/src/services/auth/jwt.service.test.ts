import { JWTService } from './jwt.service';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcrypt');
jest.mock('../../db', () => ({
  execute: jest.fn()
}));

import db from '../../db';

describe('JWTService', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    token_version: 1
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
  });

  describe('generateTokens', () => {
    test('should generate access and refresh tokens', async () => {
      const mockAccessToken = 'access-token-123';
      const mockRefreshToken = 'refresh-token-456';
      const mockHashedToken = 'hashed-refresh-token';

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedToken);
      (db.execute as jest.Mock).mockResolvedValue([{}]);

      const result = await JWTService.generateTokens(mockUser);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken
      });

      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(jwt.sign).toHaveBeenNthCalledWith(1, mockUser, 'test-jwt-secret', {
        expiresIn: '15m'
      });
      expect(jwt.sign).toHaveBeenNthCalledWith(2, {
        userId: mockUser.id,
        tokenVersion: mockUser.token_version
      }, 'test-refresh-secret', {
        expiresIn: '7d'
      });
    });

    test('should handle token generation errors', async () => {
      const error = new Error('Token generation failed');
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(JWTService.generateTokens(mockUser)).rejects.toThrow('Token generation failed');
    });

    test('should handle database errors during refresh token storage', async () => {
      const dbError = new Error('Database connection failed');
      (jwt.sign as jest.Mock).mockReturnValue('token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      (db.execute as jest.Mock).mockRejectedValue(dbError);

      await expect(JWTService.generateTokens(mockUser)).rejects.toThrow('Database connection failed');
    });

    test('should use default token version if not provided', async () => {
      const userWithoutVersion = { id: 'user-123', email: 'test@example.com' };
      const mockAccessToken = 'access-token-123';
      const mockRefreshToken = 'refresh-token-456';
      const mockHashedToken = 'hashed-refresh-token';

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedToken);
      (db.execute as jest.Mock).mockResolvedValue([{}]);

      await JWTService.generateTokens(userWithoutVersion);

      expect(jwt.sign).toHaveBeenNthCalledWith(2, {
        userId: userWithoutVersion.id,
        tokenVersion: 1
      }, 'test-refresh-secret', {
        expiresIn: '7d'
      });
    });
  });

  describe('refreshAccessToken', () => {
    test('should refresh access token with valid refresh token', async () => {
      const validRefreshToken = 'valid-refresh-token';
      const decodedRefreshToken = {
        userId: 'user-123',
        tokenVersion: 1
      };
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        token_version: 1
      };
      const newAccessToken = 'new-access-token';

      (jwt.verify as jest.Mock).mockReturnValue(decodedRefreshToken);
      (db.execute as jest.Mock).mockResolvedValue([[{ token_hash: 'hashed-token' }]]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      // Mock UserService
      jest.doMock('../user.service', () => ({
        UserService: {
          getUserById: jest.fn().mockResolvedValue(mockUser)
        }
      }));
      (jwt.sign as jest.Mock).mockReturnValue(newAccessToken);

      const result = await JWTService.refreshAccessToken(validRefreshToken);

      expect(result).toBe(newAccessToken);
      expect(jwt.verify).toHaveBeenCalledWith(validRefreshToken, 'test-refresh-secret');
      expect(db.execute).toHaveBeenCalledWith(
        'SELECT token_hash FROM refresh_tokens WHERE user_id = ? AND expires_at > NOW()',
        ['user-123']
      );
    });

    test('should return null for invalid refresh token', async () => {
      const invalidRefreshToken = 'invalid-refresh-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await JWTService.refreshAccessToken(invalidRefreshToken);

      expect(result).toBeNull();
    });

    test('should return null when refresh token not found in database', async () => {
      const refreshToken = 'refresh-token';
      const decodedRefreshToken = {
        userId: 'user-123',
        tokenVersion: 1
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedRefreshToken);
      (db.execute as jest.Mock).mockResolvedValue([[]]); // No tokens found

      const result = await JWTService.refreshAccessToken(refreshToken);

      expect(result).toBeNull();
    });

    test('should return null when refresh token hash does not match', async () => {
      const refreshToken = 'refresh-token';
      const decodedRefreshToken = {
        userId: 'user-123',
        tokenVersion: 1
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedRefreshToken);
      (db.execute as jest.Mock).mockResolvedValue([[{ token_hash: 'stored-hash' }]]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Hash doesn't match

      const result = await JWTService.refreshAccessToken(refreshToken);

      expect(result).toBeNull();
    });

    test('should return null when user not found', async () => {
      const refreshToken = 'refresh-token';
      const decodedRefreshToken = {
        userId: 'user-123',
        tokenVersion: 1
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedRefreshToken);
      (db.execute as jest.Mock).mockResolvedValue([[{ token_hash: 'hashed-token' }]]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock UserService to return null
      jest.doMock('../user.service', () => ({
        UserService: {
          getUserById: jest.fn().mockResolvedValue(null)
        }
      }));

      const result = await JWTService.refreshAccessToken(refreshToken);

      expect(result).toBeNull();
    });

    test('should handle database errors during refresh', async () => {
      const refreshToken = 'refresh-token';
      const dbError = new Error('Database connection failed');

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-123' });
      (db.execute as jest.Mock).mockRejectedValue(dbError);

      const result = await JWTService.refreshAccessToken(refreshToken);

      expect(result).toBeNull();
    });
  });

  describe('revokeRefreshToken', () => {
    test('should revoke refresh token successfully', async () => {
      const refreshToken = 'refresh-token-to-revoke';
      const decodedRefreshToken = {
        userId: 'user-123'
      };
      const hashedToken = 'hashed-token';

      (jwt.verify as jest.Mock).mockReturnValue(decodedRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedToken);
      (db.execute as jest.Mock).mockResolvedValue([{}]);

      await expect(JWTService.revokeRefreshToken(refreshToken)).resolves.toBeUndefined();

      expect(db.execute).toHaveBeenCalledWith(
        'DELETE FROM refresh_tokens WHERE user_id = ? AND token_hash = ?',
        ['user-123', hashedToken]
      );
    });

    test('should handle invalid refresh token during revocation', async () => {
      const invalidRefreshToken = 'invalid-refresh-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Should not throw error for invalid tokens
      await expect(JWTService.revokeRefreshToken(invalidRefreshToken)).resolves.toBeUndefined();

      expect(db.execute).not.toHaveBeenCalled();
    });

    test('should handle database errors during revocation', async () => {
      const refreshToken = 'refresh-token';
      const dbError = new Error('Database error');

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-123' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      (db.execute as jest.Mock).mockRejectedValue(dbError);

      // Should not throw error even if database fails
      await expect(JWTService.revokeRefreshToken(refreshToken)).resolves.toBeUndefined();
    });
  });

  describe('Token Expiration Handling', () => {
    test('should generate tokens with correct expiration times', async () => {
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';
      const mockHashedToken = 'hashed-token';

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedToken);
      (db.execute as jest.Mock).mockResolvedValue([{}]);

      await JWTService.generateTokens(mockUser);

      expect(jwt.sign).toHaveBeenNthCalledWith(1, mockUser, 'test-jwt-secret', {
        expiresIn: '15m'
      });
      expect(jwt.sign).toHaveBeenNthCalledWith(2, {
        userId: mockUser.id,
        tokenVersion: mockUser.token_version
      }, 'test-refresh-secret', {
        expiresIn: '7d'
      });
    });

    test('should handle expired refresh tokens', async () => {
      const expiredRefreshToken = 'expired-refresh-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const result = await JWTService.refreshAccessToken(expiredRefreshToken);

      expect(result).toBeNull();
    });
  });

  describe('Security Features', () => {
    test('should use different secrets for access and refresh tokens', async () => {
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';
      const mockHashedToken = 'hashed-token';

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedToken);
      (db.execute as jest.Mock).mockResolvedValue([{}]);

      await JWTService.generateTokens(mockUser);

      expect(jwt.sign).toHaveBeenNthCalledWith(1, mockUser, 'test-jwt-secret', expect.any(Object));
      expect(jwt.sign).toHaveBeenNthCalledWith(2, expect.any(Object), 'test-refresh-secret', expect.any(Object));
    });

    test('should hash refresh tokens before storing', async () => {
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';
      const mockHashedToken = 'hashed-token';

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedToken);
      (db.execute as jest.Mock).mockResolvedValue([{}]);

      await JWTService.generateTokens(mockUser);

      expect(bcrypt.hash).toHaveBeenCalledWith(mockRefreshToken, 10);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO refresh_tokens'),
        [mockUser.id, mockHashedToken, expect.any(Date)]
      );
    });

    test('should handle missing environment variables', async () => {
      delete process.env.JWT_SECRET;
      delete process.env.REFRESH_TOKEN_SECRET;

      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';
      const mockHashedToken = 'hashed-token';

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedToken);
      (db.execute as jest.Mock).mockResolvedValue([{}]);

      await expect(JWTService.generateTokens(mockUser)).rejects.toThrow();
    });
  });

  describe('Database Operations', () => {
    test('should store refresh token with correct expiration', async () => {
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';
      const mockHashedToken = 'hashed-token';

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedToken);
      (db.execute as jest.Mock).mockResolvedValue([{}]);

      await JWTService.generateTokens(mockUser);

      expect(db.execute).toHaveBeenCalledWith(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
        [mockUser.id, mockHashedToken]
      );
    });

    test('should verify refresh token against database', async () => {
      const refreshToken = 'refresh-token';
      const userId = 'user-123';
      const decodedRefreshToken = { userId, tokenVersion: 1 };
      const storedHash = 'stored-hash';

      (jwt.verify as jest.Mock).mockReturnValue(decodedRefreshToken);
      (db.execute as jest.Mock).mockResolvedValue([[{ token_hash: storedHash }]]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await JWTService.refreshAccessToken(refreshToken);

      expect(db.execute).toHaveBeenCalledWith(
        'SELECT token_hash FROM refresh_tokens WHERE user_id = ? AND expires_at > NOW()',
        [userId]
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(refreshToken, storedHash);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed tokens', async () => {
      const malformedToken = 'malformed-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Malformed token');
      });

      const result = await JWTService.refreshAccessToken(malformedToken);

      expect(result).toBeNull();
    });

    test('should handle database connection errors', async () => {
      const refreshToken = 'refresh-token';
      const dbError = new Error('Connection refused');

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-123' });
      (db.execute as jest.Mock).mockRejectedValue(dbError);

      const result = await JWTService.refreshAccessToken(refreshToken);

      expect(result).toBeNull();
    });

    test('should handle bcrypt errors', async () => {
      const refreshToken = 'refresh-token';
      const bcryptError = new Error('Bcrypt error');

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-123' });
      (db.execute as jest.Mock).mockResolvedValue([[{ token_hash: 'hash' }]]);
      (bcrypt.compare as jest.Mock).mockRejectedValue(bcryptError);

      const result = await JWTService.refreshAccessToken(refreshToken);

      expect(result).toBeNull();
    });

    test('should handle concurrent token operations', async () => {
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';
      const mockHashedToken = 'hashed-token';

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedToken);
      (db.execute as jest.Mock).mockResolvedValue([{}]);

      // Simulate concurrent token generation
      const promises = [
        JWTService.generateTokens(mockUser),
        JWTService.generateTokens(mockUser),
        JWTService.generateTokens(mockUser)
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toEqual({
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken
        });
      });
    });
  });

  describe('Performance Tests', () => {
    test('should generate tokens within acceptable time', async () => {
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';
      const mockHashedToken = 'hashed-token';

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedToken);
      (db.execute as jest.Mock).mockResolvedValue([{}]);

      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        await JWTService.generateTokens(mockUser);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 10 token generations in less than 200ms
      expect(duration).toBeLessThan(200);
    });

    test('should handle multiple refresh attempts efficiently', async () => {
      const refreshToken = 'refresh-token';
      const startTime = Date.now();

      for (let i = 0; i < 5; i++) {
        (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-123' });
        (db.execute as jest.Mock).mockResolvedValue([[]]); // No tokens found

        await JWTService.refreshAccessToken(refreshToken);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });
});