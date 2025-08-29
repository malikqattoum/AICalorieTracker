import {
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  hasValidAccessToken,
  hasRefreshToken,
  updateTokensFromResponse,
  isTokenExpired,
  getTokenMetadata,
  isTokenExpiringSoon,
  validateTokenForRequest,
  cleanupExpiredTokens,
  getTokenTimeRemaining,
  cleanupAllAuthData,
  verifyTokenSignature,
  validateTokenComprehensive,
  validateSecureStorage,
  isTokenRevoked,
  TOKEN_STORAGE_KEYS
} from './tokenManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock jwt library
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn()
}));

// Mock config
jest.mock('./config', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn()
}));

// Mock queryClient
jest.mock('./queryClient', () => ({
  validateTokenFormat: jest.fn()
}));

import jwt from 'jsonwebtoken';
import { validateTokenFormat } from './queryClient';

describe('TokenManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Token Storage Operations', () => {
    test('should store and retrieve access token', () => {
      const token = 'test-access-token';
      setAccessToken(token);

      expect(getAccessToken()).toBe(token);
    });

    test('should store and retrieve refresh token', () => {
      const token = 'test-refresh-token';
      setRefreshToken(token);

      expect(getRefreshToken()).toBe(token);
    });

    test('should clear all tokens', () => {
      setAccessToken('access-token');
      setRefreshToken('refresh-token');

      clearTokens();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    test('should handle localStorage errors gracefully', () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => setAccessToken('token')).toThrow('Failed to store authentication token');

      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('Token Persistence Across Page Refreshes', () => {
    test('should persist tokens across simulated page refreshes', () => {
      const accessToken = 'persistent-access-token';
      const refreshToken = 'persistent-refresh-token';

      // Simulate initial storage
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      // Simulate page refresh by creating new instance
      // (in real scenario, this would be tested with browser refresh)
      expect(getAccessToken()).toBe(accessToken);
      expect(getRefreshToken()).toBe(refreshToken);
    });

    test('should maintain token metadata across storage operations', () => {
      const token = 'test-token';
      setAccessToken(token);

      const metadata = getTokenMetadata();
      expect(metadata).toBeTruthy();
      expect(metadata?.expiresAt).toBeGreaterThan(Date.now());
      expect(metadata?.issuedAt).toBeLessThanOrEqual(Date.now());
    });

    test('should handle corrupted localStorage data', () => {
      localStorageMock.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, 'valid-token');
      localStorageMock.setItem('tokenMetadata', 'invalid-json');

      expect(() => getTokenMetadata()).not.toThrow();
      expect(getTokenMetadata()).toBeNull();
    });
  });

  describe('Token Expiration Scenarios', () => {
    test('should detect expired tokens', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    test('should detect tokens expiring soon', () => {
      setAccessToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');

      (jwt.verify as jest.Mock).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 120 // Expires in 2 minutes
      });

      expect(isTokenExpiringSoon(5)).toBe(true);
    });

    test('should handle invalid JWT format', () => {
      const invalidToken = 'invalid-jwt-format';

      expect(isTokenExpired(invalidToken)).toBe(true);
      expect(isTokenExpiringSoon()).toBe(true);
    });

    test('should calculate remaining token time', () => {
      const token = 'valid-token';

      (jwt.verify as jest.Mock).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 300 // Expires in 5 minutes
      });

      const remaining = getTokenTimeRemaining();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(300000); // 5 minutes in ms
    });
  });

  describe('Token Validation and Security', () => {
    test('should validate token format', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.payload';
      const invalidToken = 'invalid-format';

      (validateTokenFormat as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(false);

      expect(validateTokenForRequest()).toBe(false); // No token

      setAccessToken(validToken);
      expect(validateTokenForRequest()).toBe(true);

      setAccessToken(invalidToken);
      expect(validateTokenForRequest()).toBe(false);
    });

    test('should verify token signature', () => {
      const validToken = 'valid-token';
      const invalidToken = 'invalid-token';

      (jwt.verify as jest.Mock).mockReturnValueOnce({}).mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      expect(verifyTokenSignature(validToken, 'secret')).toBe(true);
      expect(verifyTokenSignature(invalidToken, 'secret')).toBe(false);
    });

    test('should perform comprehensive token validation', () => {
      const validToken = 'valid-token';
      const invalidToken = 'invalid-token';

      (validateTokenFormat as jest.Mock).mockReturnValue(true);
      (jwt.verify as jest.Mock).mockReturnValueOnce({}).mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      const validResult = validateTokenComprehensive(validToken);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = validateTokenComprehensive(invalidToken);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Token signature verification failed');
    });

    test('should validate secure storage', () => {
      setAccessToken('valid-token');
      setRefreshToken('valid-refresh-token');

      (validateTokenFormat as jest.Mock).mockReturnValue(true);
      (jwt.verify as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

      const result = validateSecureStorage();
      expect(result).toBe(true);
    });

    test('should detect revoked tokens', () => {
      const validToken = 'valid-token';
      const invalidToken = 'invalid-token';

      (validateTokenFormat as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(false);

      expect(isTokenRevoked(validToken)).toBe(false);
      expect(isTokenRevoked(invalidToken)).toBe(true);
    });
  });

  describe('Token Cleanup and Management', () => {
    test('should cleanup expired tokens', () => {
      const expiredToken = 'expired-token';
      const validToken = 'valid-token';

      setAccessToken(expiredToken);
      setRefreshToken(expiredToken);

      (jwt.verify as jest.Mock).mockImplementation((token) => {
        if (token === expiredToken) {
          const error = new Error('jwt expired');
          error.name = 'TokenExpiredError';
          throw error;
        }
        return { exp: Math.floor(Date.now() / 1000) + 3600 };
      });

      cleanupExpiredTokens();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    test('should cleanup all authentication data', () => {
      setAccessToken('token');
      setRefreshToken('refresh');
      localStorageMock.setItem('authState', 'some-state');
      localStorageMock.setItem('userPreferences', 'preferences');

      cleanupAllAuthData();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(localStorageMock.getItem('authState')).toBeNull();
      expect(localStorageMock.getItem('userPreferences')).toBeNull();
    });

    test('should update tokens from response', () => {
      const responseData = {
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      };

      updateTokensFromResponse(responseData);

      expect(getAccessToken()).toBe('new-access-token');
      expect(getRefreshToken()).toBe('new-refresh-token');
    });

    test('should handle old response format', () => {
      const responseData = {
        token: 'old-format-token'
      };

      updateTokensFromResponse(responseData);

      expect(getAccessToken()).toBe('old-format-token');
    });

    test('should throw error for invalid response format', () => {
      const responseData = {};

      expect(() => updateTokensFromResponse(responseData)).toThrow('No valid tokens received from server');
    });
  });

  describe('Token State Checks', () => {
    test('should check if user has valid access token', () => {
      expect(hasValidAccessToken()).toBe(false);

      setAccessToken('valid-token');
      (jwt.verify as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

      expect(hasValidAccessToken()).toBe(true);
    });

    test('should check if user has refresh token', () => {
      expect(hasRefreshToken()).toBe(false);

      setRefreshToken('refresh-token');
      expect(hasRefreshToken()).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle localStorage quota exceeded', () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      expect(() => setAccessToken('token')).toThrow('Failed to store authentication token');

      localStorageMock.setItem = originalSetItem;
    });

    test('should handle malformed JWT tokens', () => {
      const malformedToken = 'malformed.jwt.token';

      expect(isTokenExpired(malformedToken)).toBe(true);
      expect(isTokenExpiringSoon()).toBe(true);
    });

    test('should handle network errors during token operations', () => {
      // This would be tested in integration tests with actual network calls
      // For unit tests, we focus on localStorage and JWT operations
    });

    test('should handle concurrent token operations', () => {
      // Test concurrent access to token storage
      const promises = [
        Promise.resolve(setAccessToken('token1')),
        Promise.resolve(setAccessToken('token2')),
        Promise.resolve(getAccessToken())
      ];

      return Promise.all(promises).then(() => {
        expect(getAccessToken()).toBe('token2');
      });
    });
  });

  describe('Performance Tests', () => {
    test('should perform token operations within acceptable time', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        setAccessToken(`token-${i}`);
        getAccessToken();
        isTokenExpired();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 100 operations in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    test('should handle large number of token validations efficiently', () => {
      const tokens = Array.from({ length: 50 }, (_, i) => `token-${i}`);
      const startTime = Date.now();

      tokens.forEach(token => {
        (validateTokenFormat as jest.Mock).mockReturnValue(true);
        validateTokenForRequest();
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
    });
  });
});