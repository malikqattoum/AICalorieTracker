import { QueryClient, QueryFunction, QueryFunctionContext } from "@tanstack/react-query";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearTokens,
  isTokenExpired,
  isTokenExpiringSoon,
  validateTokenForRequest,
  cleanupExpiredTokens
} from './tokenManager';
import { CONFIG, logError, logInfo, logWarning } from './config';

// Utility function to validate URL for HTTPS enforcement
export const validateHttpsUrl = (url: string): boolean => {
  if (!CONFIG.security.enforceHTTPS) return true;
  
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

// Utility function to add security headers to fetch requests
export const addSecurityHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
  const securityHeaders = CONFIG.security.headers;
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers[key] = value;
  });
  
  return headers;
};

// Utility function to add Authorization header to fetch requests
export const addAuthHeader = (headers: Record<string, string> = {}): Record<string, string> => {
  const token = getAccessToken();
  
  // Validate token before adding to header
  if (token && validateTokenForRequest()) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (token) {
    // Token exists but is invalid, attempt cleanup
    logWarning('Invalid token detected, attempting cleanup');
    try {
      cleanupExpiredTokens();
    } catch (cleanupError) {
      logError('Failed to cleanup invalid token', cleanupError);
    }
  }
  
  return headers;
};

// Enhanced token validation with format checks
export const validateTokenFormat = (token: string): boolean => {
  if (!token) return false;
  
  const config = CONFIG.security.tokenValidation;
  
  // Check length requirements
  if (token.length < config.minLength || token.length > config.maxLength) {
    logWarning(`Token length validation failed: ${token.length} characters`);
    return false;
  }
  
  // Check for Bearer prefix if required
  if (config.requireBearerPrefix && !token.startsWith('Bearer ')) {
    logWarning('Token missing required Bearer prefix');
    return false;
  }
  
  // Basic JWT structure validation
  const parts = token.split('.');
  if (parts.length !== 3) {
    logWarning('Invalid JWT token structure');
    return false;
  }
  
  // Check header and payload are valid base64
  try {
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    // Check required JWT claims
    if (!header.typ || header.typ !== 'JWT') {
      logWarning('Invalid JWT header type');
      return false;
    }
    
    if (!payload.exp || !payload.iat) {
      logWarning('JWT missing required expiration or issued at claims');
      return false;
    }
    
    // Check token age
    const now = Math.floor(Date.now() / 1000);
    const tokenAge = now - payload.iat;
    if (tokenAge > config.maxTokenAge / 1000) {
      logWarning(`Token too old: ${tokenAge} seconds`);
      return false;
    }
    
  } catch (error) {
    logWarning('JWT token parsing failed', error);
    return false;
  }
  
  return true;
};

// Constants for token refresh handling
const MAX_REFRESH_ATTEMPTS = 3;
const REFRESH_RETRY_DELAY = 1000; // 1 second

// Track refresh attempts to prevent infinite loops
let refreshAttemptCount = 0;
let isRefreshing = false;

// Helper function to refresh access token with retry logic
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    logError('Token refresh failed: No refresh token available');
    return null;
  }
  
  try {
    logInfo('Attempting to refresh access token');
    
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.message || 'Failed to refresh token';
      logError(`Token refresh failed: ${errorMessage}`, { status: res.status });
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    setAccessToken(data.accessToken);
    refreshAttemptCount = 0; // Reset counter on successful refresh
    logInfo('Access token refreshed successfully');
    return data.accessToken;
  } catch (error) {
    // If refresh fails, clear tokens and log the error
    clearTokens();
    refreshAttemptCount = 0; // Reset counter on failure
    logError('Token refresh failed, clearing tokens', error);
    throw error;
  }
};

// Helper function to handle token refresh with retry limit
export const performTokenRefresh = async (): Promise<string | null> => {
  if (isRefreshing) {
    logInfo('Token refresh already in progress, waiting...');
    // Wait for current refresh to complete
    await new Promise(resolve => setTimeout(resolve, REFRESH_RETRY_DELAY));
    return getAccessToken();
  }

  if (refreshAttemptCount >= MAX_REFRESH_ATTEMPTS) {
    logError(`Maximum refresh attempts (${MAX_REFRESH_ATTEMPTS}) exceeded`);
    throw new Error('Maximum refresh attempts exceeded');
  }

  isRefreshing = true;
  refreshAttemptCount++;

  try {
    const newToken = await refreshAccessToken();
    return newToken;
  } finally {
    isRefreshing = false;
  }
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Cleanup expired tokens before making request
  try {
    cleanupExpiredTokens();
  } catch (cleanupError) {
    logError('Failed to cleanup expired tokens before request', cleanupError);
  }
  
  // HTTPS enforcement check
  if (!validateHttpsUrl(url)) {
    throw new Error('HTTPS is required for all API requests. Please use a secure connection.');
  }
  
  // Get token from token manager
  const token = getAccessToken();
  
  // Check if token exists for protected routes
  if (!token && !url.includes('/auth/login') && !url.includes('/auth/register') && !url.includes('/auth/refresh')) {
    throw new Error('Authentication required. Please log in to continue.');
  }
  
  const headers: Record<string, string> = {};
  
  // Add security headers
  addSecurityHeaders(headers);
  
  // Add content-type for requests with data
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add authorization header if token exists and is valid
  if (token) {
    // Enhanced token format validation
    if (!validateTokenFormat(token)) {
      logWarning('Token format validation failed, attempting cleanup');
      try {
        cleanupExpiredTokens();
      } catch (cleanupError) {
        logError('Failed to cleanup invalid token', cleanupError);
      }
      throw new Error('Authentication token format is invalid. Please log in again.');
    }
    
    if (validateTokenForRequest()) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Token is invalid, throw error immediately
      throw new Error('Authentication token is invalid. Please log in again.');
    }
  }

  let res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Handle 401 errors by attempting to refresh the token
  if (res.status === 401 && !url.includes('/auth/refresh')) {
    logInfo(`Received 401 error for ${method} ${url}, attempting token refresh`);
    
    try {
      const newToken = await performTokenRefresh();
      if (newToken) {
        // Retry the original request with the new token
        const retryHeaders = { ...headers };
        retryHeaders["Authorization"] = `Bearer ${newToken}`;
        
        logInfo(`Retrying ${method} ${url} with new token`);
        res = await fetch(url, {
          method,
          headers: retryHeaders,
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });

        // If retry still fails with 401, it means the refresh token is also expired
        if (res.status === 401) {
          logError('Token refresh succeeded but retry still failed with 401 - session likely expired');
          throw new Error('Session expired. Please log in again.');
        }

        logInfo(`Retry successful for ${method} ${url}`);
        await throwIfResNotOk(res);
        return res;
      }
    } catch (refreshError) {
      // If refresh fails, throw a more informative error
      const errorMessage = refreshError instanceof Error ? refreshError.message : 'Token refresh failed';
      logError(`Token refresh failed for ${method} ${url}: ${errorMessage}`, refreshError);
      throw new Error('Session expired. Please log in again.');
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async (context: QueryFunctionContext) => {
    const { queryKey } = context;
    // Cleanup expired tokens before making query
    try {
      cleanupExpiredTokens();
    } catch (cleanupError) {
      logError('Failed to cleanup expired tokens before query', cleanupError);
    }
    
    // HTTPS enforcement check for queries
    if (typeof queryKey[0] === 'string' && !validateHttpsUrl(queryKey[0])) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw new Error('HTTPS is required for all API requests. Please use a secure connection.');
    }
    
    // Get token from token manager
    const token = getAccessToken();
    
    const headers: Record<string, string> = {};
    
    // Add security headers for queries
    addSecurityHeaders(headers);
    
    // Add authorization header if token exists and is valid
    if (token) {
      // Enhanced token format validation for queries
      if (!validateTokenFormat(token)) {
        logWarning('Token format validation failed for query, attempting cleanup');
        try {
          cleanupExpiredTokens();
        } catch (cleanupError) {
          logError('Failed to cleanup invalid token for query', cleanupError);
        }
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error('Authentication token format is invalid. Please log in again.');
      }
      
      if (validateTokenForRequest()) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        // Token is invalid, handle according to unauthorizedBehavior
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error('Authentication token is invalid. Please log in again.');
      }
    }

    let res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    // Handle 401 errors by attempting to refresh the token
    if (res.status === 401 && typeof queryKey[0] === 'string' && !queryKey[0].includes('/auth/refresh')) {
      logInfo(`Received 401 error for query ${queryKey[0]}, attempting token refresh`);
      
      try {
        const newToken = await performTokenRefresh();
        if (newToken) {
          // Retry the original query with the new token
          const retryHeaders = { ...headers };
          retryHeaders["Authorization"] = `Bearer ${newToken}`;
          
          logInfo(`Retrying query ${queryKey[0]} with new token`);
          res = await fetch(queryKey[0] as string, {
            headers: retryHeaders,
            credentials: "include",
          });
          
          // If retry still fails with 401, it means the refresh token is also expired
          if (res.status === 401) {
            logError(`Token refresh succeeded but query retry still failed with 401 for ${queryKey[0]}`);
            if (unauthorizedBehavior === "returnNull") {
              return null;
            }
            throw new Error('Session expired. Please log in again.');
          }
        }
      } catch (refreshError) {
        // If refresh fails, handle according to unauthorizedBehavior
        const errorMessage = refreshError instanceof Error ? refreshError.message : 'Token refresh failed';
        logError(`Token refresh failed for query ${queryKey[0]}: ${errorMessage}`, refreshError);
        
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
