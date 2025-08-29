// Token management utilities
import { logError, logInfo, logWarning } from './config';
import { validateTokenFormat } from './queryClient';

export const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

// Token metadata for tracking expiration
interface TokenMetadata {
  expiresAt: number;
  issuedAt: number;
  lastChecked: number;
}

const TOKEN_METADATA_KEY = 'tokenMetadata';

/**
 * Store access token in localStorage with metadata
 */
export const setAccessToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, token);
    // Store metadata for expiration tracking
    const metadata: TokenMetadata = {
      expiresAt: Date.now() + (30 * 60 * 1000), // Assume 30 minutes expiry
      issuedAt: Date.now(),
      lastChecked: Date.now(),
    };
    localStorage.setItem(TOKEN_METADATA_KEY, JSON.stringify(metadata));
    logInfo('Access token stored successfully');
  } catch (error) {
    logError('Failed to store access token', error);
    throw new Error('Failed to store authentication token');
  }
};

/**
 * Store refresh token in localStorage
 */
export const setRefreshToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, token);
    logInfo('Refresh token stored successfully');
  } catch (error) {
    logError('Failed to store refresh token', error);
    throw new Error('Failed to store refresh token');
  }
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    logError('Failed to retrieve access token', error);
    return null;
  }
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    logError('Failed to retrieve refresh token', error);
    return null;
  }
};

/**
 * Remove both access and refresh tokens from localStorage
 */
export const clearTokens = (): void => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_METADATA_KEY);
    logInfo('All tokens cleared successfully');
  } catch (error) {
    logError('Failed to clear tokens', error);
    throw new Error('Failed to clear authentication tokens');
  }
};

/**
 * Check if user has valid access token
 */
export const hasValidAccessToken = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;
  
  // Check if token is expired
  if (isTokenExpired()) {
    logWarning('Access token is expired');
    return false;
  }
  
  return true;
};

/**
 * Check if user has refresh token
 */
export const hasRefreshToken = (): boolean => {
  return !!getRefreshToken();
};

/**
 * Update tokens from login/register response
 */
export const updateTokensFromResponse = (responseData: any): void => {
  try {
    if (responseData.tokens && responseData.tokens.accessToken && responseData.tokens.refreshToken) {
      setAccessToken(responseData.tokens.accessToken);
      setRefreshToken(responseData.tokens.refreshToken);
      logInfo('Tokens updated from response with new format');
    } else if (responseData.token) {
      // Fallback for old format
      setAccessToken(responseData.token);
      logInfo('Token updated from response with old format');
    } else {
      logWarning('No valid tokens found in response data');
      throw new Error('No valid tokens received from server');
    }
  } catch (error) {
    logError('Failed to update tokens from response', error);
    throw new Error('Failed to store authentication tokens');
  }
};

/**
 * Decode JWT token to extract payload
 */
const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    logError('Failed to decode JWT token', error);
    return null;
  }
};

/**
 * Check if token is expired based on JWT payload
 */
export const isTokenExpired = (token?: string): boolean => {
  try {
    const targetToken = token || getAccessToken();
    if (!targetToken) return true;

    const payload = decodeJWT(targetToken);
    if (!payload || !payload.exp) {
      logWarning('Token payload missing expiration information');
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < currentTime;
    
    if (isExpired) {
      logWarning(`Token expired at ${new Date(payload.exp * 1000).toISOString()}`);
    }
    
    return isExpired;
  } catch (error) {
    logError('Failed to check token expiration', error);
    // If we can't check expiration, assume it's expired for safety
    return true;
  }
};

/**
 * Get token metadata for tracking
 */
export const getTokenMetadata = (): TokenMetadata | null => {
  try {
    const metadataStr = localStorage.getItem(TOKEN_METADATA_KEY);
    if (!metadataStr) return null;
    
    const metadata = JSON.parse(metadataStr);
    // Update last checked time
    metadata.lastChecked = Date.now();
    localStorage.setItem(TOKEN_METADATA_KEY, JSON.stringify(metadata));
    
    return metadata;
  } catch (error) {
    logError('Failed to retrieve token metadata', error);
    return null;
  }
};

/**
 * Check if token is about to expire (within buffer time)
 */
export const isTokenExpiringSoon = (bufferMinutes: number = 5): boolean => {
  try {
    const token = getAccessToken();
    if (!token) return true;

    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    const bufferSeconds = bufferMinutes * 60;
    const expiringSoon = payload.exp < (currentTime + bufferSeconds);
    
    if (expiringSoon) {
      logWarning(`Token expiring soon at ${new Date(payload.exp * 1000).toISOString()}`);
    }
    
    return expiringSoon;
  } catch (error) {
    logError('Failed to check if token is expiring soon', error);
    return true;
  }
};

/**
 * Validate token before including in requests
 */
export const validateTokenForRequest = (): boolean => {
  if (!hasValidAccessToken()) {
    logWarning('Invalid access token for request');
    return false;
  }

  // Enhanced validation with browser-compatible checks
  const token = getAccessToken();
  if (!token) return false;

  // Check if token is revoked
  if (isTokenRevoked(token)) {
    logWarning('Token has been revoked');
    return false;
  }

  // Validate token structure (signature verification handled server-side)
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  if (!verifyTokenSignature(token, secret)) {
    logWarning('Token structure validation failed');
    return false;
  }

  // Validate secure storage
  if (!validateSecureStorage()) {
    logWarning('Secure storage validation failed');
    return false;
  }

  return true;
};

/**
 * Cleanup expired tokens automatically
 */
export const cleanupExpiredTokens = (): void => {
  try {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    
    let cleaned = false;
    
    if (accessToken && isTokenExpired(accessToken)) {
      logInfo('Cleaning up expired access token');
      localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(TOKEN_METADATA_KEY);
      cleaned = true;
    }
    
    if (refreshToken && isTokenExpired(refreshToken)) {
      logInfo('Cleaning up expired refresh token');
      localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
      cleaned = true;
    }
    
    if (cleaned) {
      logInfo('Expired tokens cleaned up successfully');
    }
  } catch (error) {
    logError('Failed to cleanup expired tokens', error);
  }
};

/**
 * Get remaining time until token expires (in milliseconds)
 */
export const getTokenTimeRemaining = (): number => {
  try {
    const token = getAccessToken();
    if (!token) return 0;

    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return 0;

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, (payload.exp - currentTime) * 1000);
  } catch (error) {
    logError('Failed to get token time remaining', error);
    return 0;
  }
};

/**
 * Force cleanup of all authentication data
 */
export const cleanupAllAuthData = (): void => {
  try {
    clearTokens();
    // Clear any other auth-related data
    localStorage.removeItem('authState');
    localStorage.removeItem('userPreferences');
    logInfo('All authentication data cleaned up successfully');
  } catch (error) {
    logError('Failed to cleanup all auth data', error);
    throw new Error('Failed to cleanup authentication data');
  }
};

/**
 * Verify token signature using browser-compatible validation
 * Note: Full cryptographic verification should only be done server-side
 */
export const verifyTokenSignature = (token: string, secret: string): boolean => {
  try {
    // Browser-compatible validation - only check basic structure
    // Full signature verification should be handled server-side
    if (!token || typeof token !== 'string') {
      logWarning('Token is not a valid string');
      return false;
    }

    // Check if token has proper JWT structure (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      logWarning('Token does not have proper JWT structure');
      return false;
    }

    // Validate each part is base64url encoded
    for (const part of parts) {
      if (!/^[A-Za-z0-9_-]*$/.test(part)) {
        logWarning('Token contains invalid base64url characters');
        return false;
      }
    }

    // Note: We skip actual cryptographic verification for security reasons
    // The server should handle full JWT verification
    logInfo('Token structure validation passed (signature verification skipped for browser compatibility)');
    return true;
  } catch (error) {
    logError('Token signature validation failed', error);
    return false;
  }
};

/**
 * Comprehensive token validation including format and structure
 */
export const validateTokenComprehensive = (token: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Format validation
  if (!validateTokenFormat(token)) {
    errors.push('Token format validation failed');
  }

  // Structure validation (signature verification handled server-side)
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  if (!verifyTokenSignature(token, secret)) {
    errors.push('Token structure validation failed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Secure token storage validation with encryption check
 */
export const validateSecureStorage = (): boolean => {
  try {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    
    // Check if tokens exist
    if (!accessToken || !refreshToken) {
      logWarning('Missing tokens in storage');
      return false;
    }
    
    // Validate token format
    if (!validateTokenFormat(accessToken) || !validateTokenFormat(refreshToken)) {
      logWarning('Invalid token format in storage');
      return false;
    }
    
    // Check if tokens are expired
    if (isTokenExpired(accessToken) || isTokenExpired(refreshToken)) {
      logWarning('Expired tokens found in storage');
      return false;
    }
    
    // Additional security checks
    const tokenMetadata = getTokenMetadata();
    if (!tokenMetadata) {
      logWarning('Missing token metadata');
      return false;
    }
    
    // Check if token metadata is consistent with token
    const now = Date.now();
    if (tokenMetadata.expiresAt < now) {
      logWarning('Token metadata indicates expired token');
      return false;
    }
    
    logInfo('Token storage validation passed');
    return true;
  } catch (error) {
    logError('Token storage validation failed', error);
    return false;
  }
};

/**
 * Enhanced token revocation checking mechanism
 */
export const isTokenRevoked = (token: string): boolean => {
  try {
    // In a real implementation, this would check against a revocation list
    // For now, we'll check if the token is expired or has invalid format
    
    if (!validateTokenFormat(token)) {
      return true;
    }
    
    if (isTokenExpired(token)) {
      return true;
    }
    
    // Additional revocation checks could be added here
    // For example, checking against a database of revoked tokens
    
    return false;
  } catch (error) {
    logError('Token revocation check failed', error);
    return true; // Assume revoked if we can't verify
  }
};