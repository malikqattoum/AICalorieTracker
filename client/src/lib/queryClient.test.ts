import {
  apiRequest,
  getQueryFn,
  refreshAccessToken,
  performTokenRefresh,
  validateHttpsUrl,
  addSecurityHeaders,
  addAuthHeader,
  validateTokenFormat,
  queryClient
} from './queryClient';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  validateTokenForRequest
} from './tokenManager';

// Mock fetch
const fetchMock = jest.fn();
global.fetch = fetchMock;

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

// Mock config
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

// Mock tokenManager
jest.mock('./tokenManager', () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  setAccessToken: jest.fn(),
  setRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
  validateTokenForRequest: jest.fn(),
  cleanupExpiredTokens: jest.fn(),
  isTokenExpired: jest.fn()
}));

describe('QueryClient', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    fetchMock.mockClear();
  });

  describe('HTTPS URL Validation', () => {
    test('should validate HTTPS URLs when enforcement is enabled', () => {
      expect(validateHttpsUrl('https://api.example.com')).toBe(true);
      expect(validateHttpsUrl('http://api.example.com')).toBe(false);
      expect(validateHttpsUrl('invalid-url')).toBe(false);
    });

    test('should handle invalid URLs gracefully', () => {
      expect(validateHttpsUrl('')).toBe(false);
      expect(validateHttpsUrl('not-a-url')).toBe(false);
    });
  });

  describe('Security Headers', () => {
    test('should add security headers to requests', () => {
      const headers = {};
      const result = addSecurityHeaders(headers);

      expect(result).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(result).toHaveProperty('X-Frame-Options', 'DENY');
    });

    test('should preserve existing headers', () => {
      const headers = { 'Content-Type': 'application/json' };
      const result = addSecurityHeaders(headers);

      expect(result).toHaveProperty('Content-Type', 'application/json');
      expect(result).toHaveProperty('X-Content-Type-Options', 'nosniff');
    });
  });

  describe('Authorization Headers', () => {
    test('should add authorization header with valid token', () => {
      (getAccessToken as jest.Mock).mockReturnValue('valid-token');
      (validateTokenForRequest as jest.Mock).mockReturnValue(true);

      const headers = {};
      const result = addAuthHeader(headers);

      expect(result).toHaveProperty('Authorization', 'Bearer valid-token');
    });

    test('should not add authorization header without token', () => {
      (getAccessToken as jest.Mock).mockReturnValue(null);

      const headers = {};
      const result = addAuthHeader(headers);

      expect(result).not.toHaveProperty('Authorization');
    });

    test('should not add authorization header with invalid token', () => {
      (getAccessToken as jest.Mock).mockReturnValue('invalid-token');
      (validateTokenForRequest as jest.Mock).mockReturnValue(false);

      const headers = {};
      const result = addAuthHeader(headers);

      expect(result).not.toHaveProperty('Authorization');
    });
  });

  describe('Token Format Validation', () => {
    test('should validate correct JWT format', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.payload.signature';
      expect(validateTokenFormat(validToken)).toBe(true);
    });

    test('should reject tokens with wrong number of parts', () => {
      const invalidToken = 'header.payload';
      expect(validateTokenFormat(invalidToken)).toBe(false);
    });

    test('should reject tokens that are too short', () => {
      const shortToken = 'short';
      expect(validateTokenFormat(shortToken)).toBe(false);
    });

    test('should reject tokens that are too long', () => {
      const longToken = 'a'.repeat(2000);
      expect(validateTokenFormat(longToken)).toBe(false);
    });

    test('should validate JWT header and payload structure', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(validateTokenFormat(validToken)).toBe(true);
    });

    test('should reject tokens with invalid base64', () => {
      const invalidToken = 'invalid.base64.payload.signature';
      expect(validateTokenFormat(invalidToken)).toBe(false);
    });
  });

  describe('API Request with Authentication', () => {
    test('should make authenticated requests with valid tokens', async () => {
      const mockResponse = { data: 'success' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200
      });

      (getAccessToken as jest.Mock).mockReturnValue('valid-token');
      (validateTokenForRequest as jest.Mock).mockReturnValue(true);

      const result = await apiRequest('GET', '/api/test');

      expect(fetchMock).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer valid-token'
        }),
        body: undefined,
        credentials: 'include'
      });
    });

    test('should reject requests to auth endpoints without tokens', async () => {
      (getAccessToken as jest.Mock).mockReturnValue(null);

      await expect(apiRequest('GET', '/api/protected')).rejects.toThrow('Authentication required');
    });

    test('should handle HTTPS enforcement', async () => {
      (getAccessToken as jest.Mock).mockReturnValue('token');

      await expect(apiRequest('GET', 'http://insecure-api.com')).rejects.toThrow('HTTPS is required');
    });

    test('should handle request errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error')
      });

      (getAccessToken as jest.Mock).mockReturnValue('token');

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('500: Internal Server Error');
    });
  });

  describe('401 Error Handling and Token Refresh', () => {
    test('should handle 401 errors and attempt token refresh', async () => {
      const mockSuccessResponse = { data: 'success' };

      // First call returns 401, second call succeeds after refresh
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
        status: 200
      });

      (getAccessToken as jest.Mock).mockReturnValue('expired-token');
      (getRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (validateTokenForRequest as jest.Mock).mockReturnValue(true);

      // Mock successful token refresh
      const mockRefreshResponse = { accessToken: 'new-token' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRefreshResponse),
        status: 200
      });

      const result = await apiRequest('GET', '/api/test');

      expect(fetchMock).toHaveBeenCalledTimes(3); // Original + refresh + retry
      expect(result).toEqual(mockSuccessResponse);
    });

    test('should handle token refresh failure', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      (getAccessToken as jest.Mock).mockReturnValue('expired-token');
      (getRefreshToken as jest.Mock).mockReturnValue('invalid-refresh-token');

      // Mock failed token refresh
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid refresh token' }),
        statusText: 'Unauthorized'
      });

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('Session expired');
    });

    test('should not attempt refresh for auth endpoints', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      (getAccessToken as jest.Mock).mockReturnValue('token');

      await expect(apiRequest('POST', '/api/auth/refresh')).rejects.toThrow('401: Unauthorized');
      expect(fetchMock).toHaveBeenCalledTimes(1); // Only original request
    });

    test('should handle retry after successful refresh', async () => {
      const mockSuccessResponse = { data: 'success' };

      // Original request fails with 401
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
        json: () => Promise.resolve(mockSuccessResponse),
        status: 200
      });

      (getAccessToken as jest.Mock).mockReturnValueOnce('expired-token').mockReturnValueOnce('new-token');
      (getRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (validateTokenForRequest as jest.Mock).mockReturnValue(true);

      const result = await apiRequest('POST', '/api/test', { data: 'test' });

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockSuccessResponse);
    });
  });

  describe('Token Refresh Functionality', () => {
    test('should refresh access token successfully', async () => {
      const mockRefreshResponse = { accessToken: 'new-access-token' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRefreshResponse),
        status: 200
      });

      (getRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await refreshAccessToken();

      expect(result).toBe('new-access-token');
      expect(setAccessToken).toHaveBeenCalledWith('new-access-token');
    });

    test('should handle refresh token not available', async () => {
      (getRefreshToken as jest.Mock).mockReturnValue(null);

      const result = await refreshAccessToken();

      expect(result).toBeNull();
    });

    test('should handle refresh request failure', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid refresh token' }),
        statusText: 'Unauthorized'
      });

      (getRefreshToken as jest.Mock).mockReturnValue('invalid-refresh-token');

      const result = await refreshAccessToken();

      expect(result).toBeNull();
      expect(clearTokens).toHaveBeenCalled();
    });

    test('should perform token refresh with retry logic', async () => {
      const mockRefreshResponse = { accessToken: 'new-access-token' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRefreshResponse),
        status: 200
      });

      (getRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await performTokenRefresh();

      expect(result).toBe('new-access-token');
    });

    test('should handle maximum refresh attempts exceeded', async () => {
      // Mock multiple failed refresh attempts
      for (let i = 0; i < 3; i++) {
        fetchMock.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid refresh token' }),
          statusText: 'Unauthorized'
        });
      }

      (getRefreshToken as jest.Mock).mockReturnValue('invalid-refresh-token');

      await expect(performTokenRefresh()).rejects.toThrow('Maximum refresh attempts exceeded');
    });
  });

  describe('Query Function for React Query', () => {
    test('should create query function with 401 handling', async () => {
      const mockSuccessResponse = { data: 'success' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
        status: 200
      });

      (getAccessToken as jest.Mock).mockReturnValue('valid-token');
      (validateTokenForRequest as jest.Mock).mockReturnValue(true);

      const queryFn = getQueryFn({ on401: 'throw' });
      const result = await queryFn({
        queryKey: ['/api/test'],
        client: queryClient,
        signal: new AbortController().signal,
        meta: {}
      });

      expect(result).toEqual(mockSuccessResponse);
    });

    test('should return null on 401 when configured', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      (getAccessToken as jest.Mock).mockReturnValue('expired-token');

      const queryFn = getQueryFn({ on401: 'returnNull' });
      const result = await queryFn({
        queryKey: ['/api/test'],
        client: queryClient,
        signal: new AbortController().signal,
        meta: {}
      });

      expect(result).toBeNull();
    });

    test('should handle HTTPS validation in queries', async () => {
      (getAccessToken as jest.Mock).mockReturnValue('token');

      const queryFn = getQueryFn({ on401: 'throw' });

      await expect(queryFn({
        queryKey: ['http://insecure-api.com'],
        client: queryClient,
        signal: new AbortController().signal,
        meta: {}
      })).rejects.toThrow('HTTPS is required');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle network errors during requests', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      (getAccessToken as jest.Mock).mockReturnValue('token');

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('Network error');
    });

    test('should handle malformed JSON responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
        status: 200
      });

      (getAccessToken as jest.Mock).mockReturnValue('token');

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow();
    });

    test('should handle cleanup of expired tokens before requests', async () => {
      const mockResponse = { data: 'success' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200
      });

      (getAccessToken as jest.Mock).mockReturnValue('token');
      (validateTokenForRequest as jest.Mock).mockReturnValue(true);

      await apiRequest('GET', '/api/test');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('should handle concurrent requests during token refresh', async () => {
      const mockSuccessResponse = { data: 'success' };

      // First request gets 401 and triggers refresh
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
        json: () => Promise.resolve(mockSuccessResponse),
        status: 200
      });

      (getAccessToken as jest.Mock).mockReturnValue('expired-token');
      (getRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (validateTokenForRequest as jest.Mock).mockReturnValue(true);

      // Simulate concurrent requests
      const promises = [
        apiRequest('GET', '/api/test'),
        apiRequest('GET', '/api/test2')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockSuccessResponse);
      expect(results[1]).toEqual(mockSuccessResponse);
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple concurrent API requests efficiently', async () => {
      const mockResponse = { data: 'success' };

      for (let i = 0; i < 10; i++) {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
          status: 200
        });
      }

      (getAccessToken as jest.Mock).mockReturnValue('token');
      (validateTokenForRequest as jest.Mock).mockReturnValue(true);

      const startTime = Date.now();

      const promises = Array.from({ length: 10 }, (_, i) =>
        apiRequest('GET', `/api/test${i}`)
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 10 requests in less than 500ms
      expect(duration).toBeLessThan(500);
      expect(fetchMock).toHaveBeenCalledTimes(10);
    });

    test('should perform token validation efficiently', () => {
      const tokens = Array.from({ length: 100 }, (_, i) => `token-${i}`);
      const startTime = Date.now();

      tokens.forEach(token => {
        validateTokenFormat(token);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete authentication flow', async () => {
      // Simulate login
      const loginResponse = {
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        },
        user: { id: 1, username: 'testuser' }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(loginResponse),
        status: 200
      });

      (getAccessToken as jest.Mock).mockReturnValue('access-token');
      (validateTokenForRequest as jest.Mock).mockReturnValue(true);

      // Make authenticated request
      const apiResponse = { data: 'protected-data' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
        status: 200
      });

      const result = await apiRequest('GET', '/api/protected');

      expect(result).toEqual(apiResponse);
      expect(fetchMock).toHaveBeenCalledWith('/api/protected', expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer access-token'
        })
      }));
    });

    test('should handle token refresh during API request', async () => {
      // First request fails with 401
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      // Refresh succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'new-access-token' }),
        status: 200
      });

      // Retry succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'success' }),
        status: 200
      });

      (getAccessToken as jest.Mock).mockReturnValueOnce('expired-token').mockReturnValueOnce('new-access-token');
      (getRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (validateTokenForRequest as jest.Mock).mockReturnValue(true);

      const result = await apiRequest('GET', '/api/test');

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    test('should handle logout and token cleanup', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      (getAccessToken as jest.Mock).mockReturnValue('token');

      await apiRequest('POST', '/api/logout');

      expect(fetchMock).toHaveBeenCalledWith('/api/logout', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer token'
        })
      }));
    });
  });
});