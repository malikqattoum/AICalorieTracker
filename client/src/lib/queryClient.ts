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
  // Allow HTTP in development environment for local development
  if (!CONFIG.security.enforceHTTPS) {
    logInfo('HTTPS enforcement disabled - allowing HTTP URLs for development');
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';

    if (!isHttps) {
      logWarning(`HTTPS required but HTTP URL detected: ${url}`);
    }

    return isHttps;
  } catch (error) {
    logError('Invalid URL format for HTTPS validation', error);
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

  console.log('[DEBUG] Retrieved token:', token ? 'Token exists' : 'No token');

  // Simplified validation: only check if token exists and is not expired
  if (token && !isTokenExpired(token)) {
    console.log('[DEBUG] Adding authorization header with token');
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.log('[DEBUG] Not adding authorization header:', token ? 'Token expired' : 'No token');
    if (token) {
      // Token exists but is expired, attempt cleanup
      logWarning('Expired token detected, attempting cleanup');
      try {
        cleanupExpiredTokens();
      } catch (cleanupError) {
        logError('Failed to cleanup expired token', cleanupError);
      }
    }
  }

  return headers;
};

// Enhanced token validation with format checks
export const validateTokenFormat = (token: string): boolean => {
  console.log('[TOKEN DEBUG] Starting token format validation');

  if (!token) {
    console.log('[TOKEN DEBUG] Token is null or empty');
    return false;
  }

  console.log('[TOKEN DEBUG] Token length:', token.length);

  const config = CONFIG.security.tokenValidation;

  // Check length requirements
  if (token.length < config.minLength || token.length > config.maxLength) {
    console.log(`[TOKEN DEBUG] Token length validation failed: ${token.length} characters (min: ${config.minLength}, max: ${config.maxLength})`);
    logWarning(`Token length validation failed: ${token.length} characters`);
    return false;
  }

  // Check for Bearer prefix if required
  if (config.requireBearerPrefix && !token.startsWith('Bearer ')) {
    console.log('[TOKEN DEBUG] Token missing required Bearer prefix');
    logWarning('Token missing required Bearer prefix');
    return false;
  }

  // Basic JWT structure validation
  const parts = token.split('.');
  console.log('[TOKEN DEBUG] Token parts after split:', parts.length);

  if (parts.length !== 3) {
    console.log('[TOKEN DEBUG] Invalid JWT structure - not 3 parts');
    logWarning('Invalid JWT token structure');
    return false;
  }

  // Check header and payload are valid base64
  try {
    console.log('[TOKEN DEBUG] Attempting to parse JWT header and payload');
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));

    console.log('[TOKEN DEBUG] JWT header:', header);
    console.log('[TOKEN DEBUG] JWT payload exp:', payload.exp, 'iat:', payload.iat);

    // Check required JWT claims
    if (!header.typ || header.typ !== 'JWT') {
      console.log('[TOKEN DEBUG] Invalid JWT header type:', header.typ);
      logWarning('Invalid JWT header type');
      return false;
    }

    if (!payload.exp || !payload.iat) {
      console.log('[TOKEN DEBUG] JWT missing required claims - exp:', payload.exp, 'iat:', payload.iat);
      logWarning('JWT missing required expiration or issued at claims');
      return false;
    }

    // Check token age
    const now = Math.floor(Date.now() / 1000);
    const tokenAge = now - payload.iat;
    console.log('[TOKEN DEBUG] Token age:', tokenAge, 'seconds, max allowed:', config.maxTokenAge / 1000);

    if (tokenAge > config.maxTokenAge / 1000) {
      console.log('[TOKEN DEBUG] Token too old');
      logWarning(`Token too old: ${tokenAge} seconds`);
      return false;
    }

  } catch (error) {
    console.log('[TOKEN DEBUG] JWT parsing failed:', error);
    logWarning('JWT token parsing failed', error);
    return false;
  }

  console.log('[TOKEN DEBUG] Token format validation passed');
  return true;
};

// Enhanced constants for token refresh handling
const MAX_REFRESH_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 1000; // 1 second base delay
const MAX_RETRY_DELAY = 10000; // 10 seconds max delay
const JITTER_FACTOR = 0.1; // 10% jitter to prevent thundering herd

// Track refresh attempts to prevent infinite loops
let refreshAttemptCount = 0;
let isRefreshing = false;
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 5000; // 5 seconds minimum between refresh attempts

// Helper function to refresh access token with retry logic
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    logError('Token refresh failed: No refresh token available');
    return null;
  }
  
  try {
    logInfo('Attempting to refresh access token');
    
    const res = await fetch(`${CONFIG.api}/api/auth/refresh`, {
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

// Calculate exponential backoff delay with jitter
const calculateBackoffDelay = (attemptNumber: number): number => {
  const exponentialDelay = BASE_RETRY_DELAY * Math.pow(2, attemptNumber - 1);
  const jitter = exponentialDelay * JITTER_FACTOR * Math.random();
  return Math.min(exponentialDelay + jitter, MAX_RETRY_DELAY);
};

// Enhanced helper function to handle token refresh with retry limit and backoff
export const performTokenRefresh = async (): Promise<string | null> => {
  const now = Date.now();

  // Prevent too frequent refresh attempts
  if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
    const waitTime = MIN_REFRESH_INTERVAL - (now - lastRefreshTime);
    logInfo(`Waiting ${waitTime}ms before next refresh attempt`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  if (isRefreshing) {
    logInfo('Token refresh already in progress, waiting...');
    // Wait for current refresh to complete with backoff
    const waitDelay = calculateBackoffDelay(refreshAttemptCount);
    await new Promise(resolve => setTimeout(resolve, waitDelay));
    return getAccessToken();
  }

  if (refreshAttemptCount >= MAX_REFRESH_ATTEMPTS) {
    logError(`Maximum refresh attempts (${MAX_REFRESH_ATTEMPTS}) exceeded`);
    throw new Error('Maximum refresh attempts exceeded');
  }

  isRefreshing = true;
  refreshAttemptCount++;
  lastRefreshTime = now;

  try {
    const newToken = await refreshAccessToken();
    // Reset counter on successful refresh
    refreshAttemptCount = 0;
    return newToken;
  } catch (error) {
    // Add exponential backoff delay before next attempt
    const backoffDelay = calculateBackoffDelay(refreshAttemptCount);
    logWarning(`Token refresh failed, waiting ${backoffDelay}ms before retry`, error);
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
    throw error;
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

  // Prepend API_URL if url is relative (starts with /api/)
  if (url.startsWith('/api/')) {
    url = `${CONFIG.api}${url}`;
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

    // Add retry logic for token validation
    let retryCount = 0;
    const maxRetries = 1;
    let tokenValid = false;
    while (retryCount <= maxRetries && !tokenValid) {
      if (validateTokenForRequest()) {
        tokenValid = true;
      } else if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
      }
    }

    if (tokenValid) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Token is invalid after retry, throw error
      throw new Error('Authentication token is invalid. Please log in again.');
    }
  }

  let res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Enhanced 401 error handling with better error categorization
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
          clearTokens(); // Clear invalid tokens
          throw new Error('Session expired. Please log in again.');
        }

        // Handle other retry errors (network issues, server errors)
        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unknown error');
          logError(`Retry failed with status ${res.status} for ${method} ${url}: ${errorText}`);
          throw new Error(`Request failed after token refresh: ${res.status} ${res.statusText}`);
        }

        logInfo(`Retry successful for ${method} ${url}`);
        await throwIfResNotOk(res);
        return res;
      }
    } catch (refreshError) {
      // Categorize refresh errors
      if (refreshError instanceof Error) {
        if (refreshError.message.includes('Maximum refresh attempts exceeded')) {
          logError(`Token refresh failed for ${method} ${url}: Max attempts exceeded`);
          clearTokens();
          throw new Error('Session expired. Please log in again.');
        } else if (refreshError.message.includes('Network') || refreshError.message.includes('fetch')) {
          logError(`Token refresh failed for ${method} ${url}: Network error`, refreshError);
          throw new Error('Network error during authentication. Please check your connection and try again.');
        } else {
          logError(`Token refresh failed for ${method} ${url}: ${refreshError.message}`, refreshError);
          clearTokens();
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        logError(`Token refresh failed for ${method} ${url}: Unknown error`, refreshError);
        clearTokens();
        throw new Error('Session expired. Please log in again.');
      }
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

    let queryUrl = queryKey[0] as string;

    // Prepend API_URL if url is relative (starts with /api/)
    if (queryUrl.startsWith('/api/')) {
      queryUrl = `${CONFIG.api}${queryUrl}`;
    }

    // HTTPS enforcement check for queries
    if (!validateHttpsUrl(queryUrl)) {
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

    let res = await fetch(queryUrl, {
      headers,
      credentials: "include",
    });

    // Enhanced 401 error handling for queries with better error categorization
    if (res.status === 401 && !queryUrl.includes('/auth/refresh')) {
      logInfo(`Received 401 error for query ${queryUrl}, attempting token refresh`);

      try {
        const newToken = await performTokenRefresh();
        if (newToken) {
          // Retry the original query with the new token
          const retryHeaders = { ...headers };
          retryHeaders["Authorization"] = `Bearer ${newToken}`;

          logInfo(`Retrying query ${queryUrl} with new token`);
          res = await fetch(queryUrl, {
            headers: retryHeaders,
            credentials: "include",
          });

          // If retry still fails with 401, it means the refresh token is also expired
          if (res.status === 401) {
            logError(`Token refresh succeeded but query retry still failed with 401 for ${queryUrl}`);
            clearTokens(); // Clear invalid tokens
            if (unauthorizedBehavior === "returnNull") {
              return null;
            }
            throw new Error('Session expired. Please log in again.');
          }

          // Handle other retry errors (network issues, server errors)
          if (!res.ok) {
            const errorText = await res.text().catch(() => 'Unknown error');
            logError(`Query retry failed with status ${res.status} for ${queryUrl}: ${errorText}`);
            if (unauthorizedBehavior === "returnNull") {
              return null;
            }
            throw new Error(`Query failed after token refresh: ${res.status} ${res.statusText}`);
          }
        }
      } catch (refreshError) {
        // Categorize refresh errors for queries
        if (refreshError instanceof Error) {
          if (refreshError.message.includes('Maximum refresh attempts exceeded')) {
            logError(`Token refresh failed for query ${queryUrl}: Max attempts exceeded`);
            clearTokens();
            if (unauthorizedBehavior === "returnNull") {
              return null;
            }
            throw new Error('Session expired. Please log in again.');
          } else if (refreshError.message.includes('Network') || refreshError.message.includes('fetch')) {
            logError(`Token refresh failed for query ${queryUrl}: Network error`, refreshError);
            if (unauthorizedBehavior === "returnNull") {
              return null;
            }
            throw new Error('Network error during authentication. Please check your connection and try again.');
          } else {
            logError(`Token refresh failed for query ${queryUrl}: ${refreshError.message}`, refreshError);
            clearTokens();
            if (unauthorizedBehavior === "returnNull") {
              return null;
            }
            throw new Error('Session expired. Please log in again.');
          }
        } else {
          logError(`Token refresh failed for query ${queryUrl}: Unknown error`, refreshError);
          clearTokens();
          if (unauthorizedBehavior === "returnNull") {
            return null;
          }
          throw new Error('Session expired. Please log in again.');
        }
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
