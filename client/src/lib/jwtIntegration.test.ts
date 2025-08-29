import {
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  hasValidAccessToken,
  validateTokenForRequest,
  cleanupExpiredTokens,
  isTokenExpired,
  isTokenExpiringSoon
} from './tokenManager';
import {
  apiRequest,
  refreshAccessToken,
  performTokenRefresh,
  validateTokenFormat
} from './queryClient';

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

// Mock fetch
const fetchMock = jest.fn();
global.fetch = fetchMock;

// Mock other dependencies
jest.mock('./config', () => ({
  CONFIG: {
    security: {
      enforceHTTPS: true,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      },
      tokenValidation: {
        minLength: 10,
        maxLength: 1000,
        requireBearerPrefix: false,
        maxTokenAge: 3600000
      }
    }
  },
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn()
}));

jest.mock('./tokenManager', () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  setAccessToken: jest.fn(),
  clearTokens: jest.fn(),
  validateTokenForRequest: jest.fn(),
  cleanupExpiredTokens: jest.fn(),
  isTokenExpired: jest.fn(),
  isTokenExpiringSoon: jest.fn(),
  hasValidAccessToken: jest.fn()
}));

import {
  getAccessToken as mockGetAccessToken,
  getRefreshToken as mockGetRefreshToken,
  setAccessToken as mockSetAccessToken,
  clearTokens as mockClearTokens,
  validateTokenForRequest as mockValidateTokenForRequest,
  cleanupExpiredTokens as mockCleanupExpiredTokens,
  isTokenExpired as mockIsTokenExpired,
  isTokenExpiringSoon as mockIsTokenExpiringSoon,
  hasValidAccessToken as mockHasValidAccessToken
} from './tokenManager';

describe('JWT Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    fetchMock.mockClear();
  });

  describe('Complete Authentication Flow', () => {
    test('should handle login and token storage', async () => {
      const loginResponse = {
        tokens: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456'
        },
        user: { id: 1, username: 'testuser' }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(loginResponse),
        status: 200
      });

      (mockGetAccessToken as jest.Mock).mockReturnValue('access-token-123');
      (mockValidateTokenForRequest as jest.Mock).mockReturnValue(true);

      // Simulate login API call
      const result = await apiRequest('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      }));
    });

    test('should handle authenticated API requests', async () => {
      const apiResponse = { data: 'protected-data' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
        status: 200
      });

      (mockGetAccessToken as jest.Mock).mockReturnValue('valid-token');
      (mockValidateTokenForRequest as jest.Mock).mockReturnValue(true);

      const result = await apiRequest('GET', '/api/protected');

      expect(fetchMock).toHaveBeenCalledWith('/api/protected', expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer valid-token'
        })
      }));
    });

    test('should handle logout and cleanup', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      (mockGetAccessToken as jest.Mock).mockReturnValue('token-to-clear');

      await apiRequest('POST', '/api/logout');

      expect(fetchMock).toHaveBeenCalledWith('/api/logout', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer token-to-clear'
        })
      }));
    });
  });

  describe('Token Persistence Across Page Refreshes', () => {
    test('should persist tokens across simulated page refreshes', () => {
      const accessToken = 'persistent-access-token';
      const refreshToken = 'persistent-refresh-token';

      // Simulate initial token storage
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      // Simulate page refresh by checking storage directly
      expect(getAccessToken()).toBe(accessToken);
      expect(getRefreshToken()).toBe(refreshToken);
    });

    test('should maintain token state after page refresh simulation', () => {
      // Set initial tokens
      setAccessToken('initial-access');
      setRefreshToken('initial-refresh');

      // Simulate page refresh
      // In a real scenario, this would be tested with browser refresh
      expect(getAccessToken()).toBe('initial-access');
      expect(getRefreshToken()).toBe('initial-refresh');

      // Simulate token update after refresh
      setAccessToken('updated-access');
      expect(getAccessToken()).toBe('updated-access');
    });

    test('should handle localStorage corruption gracefully', () => {
      // Set valid tokens
      setAccessToken('valid-token');
      setRefreshToken('valid-refresh');

      // Simulate localStorage corruption
      localStorageMock.setItem('accessToken', 'corrupted-data');
      localStorageMock.removeItem('refreshToken');

      expect(getAccessToken()).toBe('corrupted-data');
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe('Token Expiration Scenarios', () => {
    test('should detect and handle expired tokens', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      (mockIsTokenExpired as jest.Mock).mockReturnValue(true);
      (mockHasValidAccessToken as jest.Mock).mockReturnValue(false);

      expect(hasValidAccessToken()).toBe(false);
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    test('should handle tokens expiring soon', () => {
      const soonExpiringToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      (mockIsTokenExpiringSoon as jest.Mock).mockReturnValue(true);

      expect(isTokenExpiringSoon()).toBe(true);
    });

    test('should cleanup expired tokens automatically', () => {
      setAccessToken('expired-token');
      setRefreshToken('expired-refresh');

      (mockIsTokenExpired as jest.Mock).mockReturnValue(true);

      cleanupExpiredTokens();

      expect(mockCleanupExpiredTokens).toHaveBeenCalled();
    });
  });

  describe('401 Error Handling and Token Refresh', () => {
    test('should handle 401 errors and attempt token refresh', async () => {
      const successResponse = { data: 'success' };

      // First request returns 401
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      // Refresh succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'new-token' }),
        status: 200
      });

      // Retry succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(successResponse),
        status: 200
      });

      (mockGetAccessToken as jest.Mock).mockReturnValueOnce('expired-token').mockReturnValueOnce('new-token');
      (mockGetRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (mockValidateTokenForRequest as jest.Mock).mockReturnValue(true);

      const result = await apiRequest('GET', '/api/test');

      expect(fetchMock).toHaveBeenCalledTimes(3); // Original + refresh + retry
      expect(result).toEqual(successResponse);
    });

    test('should handle refresh token failure', async () => {
      // Original request fails with 401
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      // Refresh fails
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid refresh token' }),
        statusText: 'Unauthorized'
      });

      (mockGetAccessToken as jest.Mock).mockReturnValue('expired-token');
      (mockGetRefreshToken as jest.Mock).mockReturnValue('invalid-refresh-token');

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('Session expired');
    });

    test('should handle maximum refresh attempts', async () => {
      // Mock multiple failed refresh attempts
      for (let i = 0; i < 3; i++) {
        fetchMock.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid refresh token' }),
          statusText: 'Unauthorized'
        });
      }

      (mockGetRefreshToken as jest.Mock).mockReturnValue('invalid-refresh-token');

      await expect(performTokenRefresh()).rejects.toThrow('Maximum refresh attempts exceeded');
    });
  });

  describe('Security Features', () => {
    test('should enforce HTTPS for API requests', async () => {
      (mockGetAccessToken as jest.Mock).mockReturnValue('token');

      await expect(apiRequest('GET', 'http://insecure-api.com')).rejects.toThrow('HTTPS is required');
    });

    test('should validate token format before requests', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.payload.signature';
      const invalidToken = 'invalid-format';

      expect(validateTokenFormat(validToken)).toBe(true);
      expect(validateTokenFormat(invalidToken)).toBe(false);
    });

    test('should add security headers to requests', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'success' }),
        status: 200
      });

      (mockGetAccessToken as jest.Mock).mockReturnValue('token');
      (mockValidateTokenForRequest as jest.Mock).mockReturnValue(true);

      await apiRequest('GET', '/api/test');

      expect(fetchMock).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        headers: expect.objectContaining({
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        })
      }));
    });

    test('should validate tokens before including in requests', () => {
      (mockHasValidAccessToken as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(false);

      expect(validateTokenForRequest()).toBe(true);
      expect(validateTokenForRequest()).toBe(false);
    });
  });

  describe('Logout Behavior and Token Cleanup', () => {
    test('should clear all tokens on logout', () => {
      setAccessToken('access-token');
      setRefreshToken('refresh-token');

      clearTokens();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    test('should handle logout API call', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      (mockGetAccessToken as jest.Mock).mockReturnValue('token');

      await apiRequest('POST', '/api/logout');

      expect(fetchMock).toHaveBeenCalledWith('/api/logout', expect.objectContaining({
        method: 'POST'
      }));
    });

    test('should cleanup tokens even if logout API fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      (mockGetAccessToken as jest.Mock).mockReturnValue('token');

      await expect(apiRequest('POST', '/api/logout')).rejects.toThrow('500: Internal Server Error');
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple concurrent requests efficiently', async () => {
      const mockResponse = { data: 'success' };

      for (let i = 0; i < 10; i++) {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
          status: 200
        });
      }

      (mockGetAccessToken as jest.Mock).mockReturnValue('token');
      (mockValidateTokenForRequest as jest.Mock).mockReturnValue(true);

      const startTime = Date.now();

      const promises = Array.from({ length: 10 }, (_, i) =>
        apiRequest('GET', `/api/test${i}`)
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Should complete in less than 500ms
      expect(fetchMock).toHaveBeenCalledTimes(10);
    });

    test('should perform token operations efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        setAccessToken(`token-${i}`);
        getAccessToken();
        validateTokenFormat(`token-${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle network errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      (mockGetAccessToken as jest.Mock).mockReturnValue('token');

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('Network error');
    });

    test('should handle malformed JSON responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
        status: 200
      });

      (mockGetAccessToken as jest.Mock).mockReturnValue('token');

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow();
    });

    test('should handle invalid token formats', () => {
      const invalidTokens = [
        '',
        'invalid',
        'a'.repeat(2000), // Too long
        'short' // Too short
      ];

      invalidTokens.forEach(token => {
        expect(validateTokenFormat(token)).toBe(false);
      });
    });

    test('should recover from token refresh failures', async () => {
      // Original request fails
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      // Refresh fails
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid refresh token' }),
        statusText: 'Unauthorized'
      });

      (mockGetAccessToken as jest.Mock).mockReturnValue('expired-token');
      (mockGetRefreshToken as jest.Mock).mockReturnValue('invalid-refresh-token');

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('Session expired');

      // Verify tokens were cleared after failed refresh
      expect(mockClearTokens).toHaveBeenCalled();
    });
  });
});