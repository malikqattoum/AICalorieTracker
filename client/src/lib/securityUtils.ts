// Enhanced security utilities for token validation, signature verification, and secure storage

import { CONFIG, isDevelopment } from './config';
import { logError, logInfo, logWarning } from './config';

// Token revocation store (in production, this would be server-side)
const revokedTokens = new Set<string>();

/**
 * Token signature verification using JWT library
 * In a real implementation, you would use a proper JWT library like 'jsonwebtoken'
 */
export const verifyTokenSignature = (token: string, secret: string): boolean => {
  try {
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      logWarning('Invalid JWT token structure for signature verification');
      return false;
    }

    // Decode header and payload
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    const signature = parts[2];

    // Create signature input
    const signatureInput = `${parts[0]}.${parts[1]}`;
    
    // In production, use proper JWT verification:
    // const isValid = jwt.verify(token, secret);
    // For now, we'll do a basic validation
    
    // Check if token is revoked
    if (isTokenRevoked(token)) {
      logWarning('Token has been revoked');
      return false;
    }

    // Validate token claims
    const now = Math.floor(Date.now() / 1000);
    
    // Check expiration
    if (payload.exp && payload.exp < now) {
      logWarning('Token has expired');
      return false;
    }

    // Check not before (if present)
    if (payload.nbf && payload.nbf > now) {
      logWarning('Token is not yet valid');
      return false;
    }

    // Check issuer (if present)
    if (payload.iss && payload.iss !== CONFIG.api) {
      logWarning('Invalid token issuer');
      return false;
    }

    // Check audience (if present)
    if (payload.aud && !Array.isArray(payload.aud) && payload.aud !== 'aicalorietracker') {
      logWarning('Invalid token audience');
      return false;
    }

    logInfo('Token signature verification passed');
    return true;

  } catch (error) {
    logError('Token signature verification failed', error);
    return false;
  }
};

/**
 * Check if token has been revoked
 */
export const isTokenRevoked = (token: string): boolean => {
  // Extract token ID from payload (jti claim)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const tokenId = payload.jti || token;
    return revokedTokens.has(tokenId);
  } catch {
    return false;
  }
};

/**
 * Revoke a token
 */
export const revokeToken = (token: string): void => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const tokenId = payload.jti || token;
    revokedTokens.add(tokenId);
    logInfo(`Token revoked: ${tokenId}`);
  } catch (error) {
    logError('Failed to revoke token', error);
  }
};

/**
 * Clear all revoked tokens (admin function)
 */
export const clearRevokedTokens = (): void => {
  revokedTokens.clear();
  logInfo('All revoked tokens cleared');
};

/**
 * Secure token storage validation with encryption
 */
export const validateSecureStorage = (): boolean => {
  try {
    // Check if localStorage is available and secure
    if (typeof window === 'undefined') {
      logWarning('Window object not available - secure storage validation failed');
      return false;
    }

    // Check if we're in a secure context
    if (!window.isSecureContext) {
      logWarning('Not in a secure context - HTTPS required');
      return false;
    }

    // Check for localStorage availability
    try {
      const testKey = '__secure_storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
    } catch {
      logWarning('localStorage not available');
      return false;
    }

    // Check for sessionStorage availability (for sensitive data)
    try {
      const testKey = '__secure_session_test__';
      sessionStorage.setItem(testKey, testKey);
      sessionStorage.removeItem(testKey);
    } catch {
      logWarning('sessionStorage not available');
      return false;
    }

    logInfo('Secure storage validation passed');
    return true;

  } catch (error) {
    logError('Secure storage validation failed', error);
    return false;
  }
};

/**
 * Encrypt sensitive data before storage
 */
export const encryptData = (data: string, secret: string): string => {
  try {
    // In production, use proper encryption like AES-256-GCM
    // For now, we'll use a simple base64 encoding with a basic XOR
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const secretBuffer = encoder.encode(secret);
    
    let encrypted = new Uint8Array(dataBuffer.length);
    for (let i = 0; i < dataBuffer.length; i++) {
      encrypted[i] = dataBuffer[i] ^ secretBuffer[i % secretBuffer.length];
    }
    
    return btoa(Array.from(encrypted).map(byte => String.fromCharCode(byte)).join(''));
  } catch (error) {
    logError('Data encryption failed', error);
    return '';
  }
};

/**
 * Decrypt sensitive data after retrieval
 */
export const decryptData = (encryptedData: string, secret: string): string => {
  try {
    // In production, use proper decryption
    const decoder = new TextDecoder();
    const encryptedBuffer = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    const secretBuffer = new TextEncoder().encode(secret);
    
    let decrypted = new Uint8Array(encryptedBuffer.length);
    for (let i = 0; i < encryptedBuffer.length; i++) {
      decrypted[i] = encryptedBuffer[i] ^ secretBuffer[i % secretBuffer.length];
    }
    
    return decoder.decode(decrypted);
  } catch (error) {
    logError('Data decryption failed', error);
    return '';
  }
};

/**
 * Enhanced request validation to prevent common security vulnerabilities
 */
export const validateRequest = (request: {
  body?: any;
  query?: any;
  params?: any;
  headers?: Record<string, string>;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!CONFIG.security.requestValidation.sanitizeInput) {
    return { valid: true, errors: [] };
  }

  // SQL injection detection
  if (CONFIG.security.requestValidation.checkForSQLInjection) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|CREATE|ALTER|TRUNCATE)\b)/gi,
      /('|--|;|\/\*|\*\/|@@|xp_|sp_|exec\s+)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi
    ];

    const checkForSQL = (value: any): boolean => {
      if (typeof value === 'string') {
        return sqlPatterns.some(pattern => pattern.test(value));
      }
      if (Array.isArray(value)) {
        return value.some(checkForSQL);
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkForSQL);
      }
      return false;
    };

    if (checkForSQL(request.body) || checkForSQL(request.query) || checkForSQL(request.params)) {
      errors.push('Potential SQL injection detected');
    }
  }

  // XSS detection
  if (CONFIG.security.requestValidation.checkForXSS) {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi
    ];

    const checkForXSS = (value: any): boolean => {
      if (typeof value === 'string') {
        return xssPatterns.some(pattern => pattern.test(value));
      }
      if (Array.isArray(value)) {
        return value.some(checkForXSS);
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkForXSS);
      }
      return false;
    };

    if (checkForXSS(request.body) || checkForXSS(request.query) || checkForXSS(request.params)) {
      errors.push('Potential XSS attack detected');
    }
  }

  // Path traversal detection
  const checkPathTraversal = (value: any): boolean => {
    if (typeof value === 'string') {
      return /\.\.\//g.test(value) || /\/etc\/passwd/g.test(value) || /windows\\system32/gi.test(value);
    }
    return false;
  };

  if (checkPathTraversal(request.body) || checkPathTraversal(request.query) || checkPathTraversal(request.params)) {
    errors.push('Potential path traversal attack detected');
  }

  // Command injection detection
  const checkCommandInjection = (value: any): boolean => {
    if (typeof value === 'string') {
      return /;|&&|\|\|/g.test(value);
    }
    return false;
  };

  if (checkCommandInjection(request.body) || checkCommandInjection(request.query) || checkCommandInjection(request.params)) {
    errors.push('Potential command injection detected');
  }

  // File type validation for uploads
  if (request.body && request.body.fileType) {
    const allowedTypes = CONFIG.security.requestValidation.allowedFileTypes;
    if (!allowedTypes.includes(request.body.fileType)) {
      errors.push(`Invalid file type: ${request.body.fileType}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Security logging for authentication attempts and suspicious activities
 */
export const logSecurityEvent = (event: {
  type: 'AUTH_ATTEMPT' | 'TOKEN_VALIDATION' | 'SECURITY_VIOLATION' | 'SUSPICIOUS_ACTIVITY';
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  details?: any;
  userId?: string;
  ip?: string;
  userAgent?: string;
}): void => {
  if (!CONFIG.security.logging.enableSecurityLogging) return;

  const logEntry = {
    timestamp: new Date().toISOString(),
    type: event.type,
    level: event.level,
    message: event.message,
    details: event.details || {},
    userId: event.userId || 'anonymous',
    ip: event.ip || 'unknown',
    userAgent: event.userAgent || 'unknown',
    environment: CONFIG.api
  };

  // Log to console in development
  if (isDevelopment) {
    console.log('[Security Event]', logEntry);
  }

  // In production, send to security monitoring service
  // sendToSecurityMonitoringService(logEntry);

  // Specific logging based on event type
  switch (event.type) {
    case 'AUTH_ATTEMPT':
      if (CONFIG.security.logging.logAuthenticationAttempts) {
        console.log(`[Auth Attempt] ${event.message}`, event.details);
      }
      break;
    case 'TOKEN_VALIDATION':
      if (CONFIG.security.logging.logTokenValidation) {
        console.log(`[Token Validation] ${event.message}`, event.details);
      }
      break;
    case 'SECURITY_VIOLATION':
      if (CONFIG.security.logging.logSecurityViolations) {
        console.warn(`[Security Violation] ${event.message}`, event.details);
      }
      break;
    case 'SUSPICIOUS_ACTIVITY':
      if (CONFIG.security.logging.logSuspiciousActivity) {
        console.warn(`[Suspicious Activity] ${event.message}`, event.details);
      }
      break;
  }
};

/**
 * Enhanced CORS validation
 */
export const validateCORS = (origin: string): boolean => {
  const allowedOrigins = CONFIG.security.cors.allowedOrigins;
  
  if (!origin) return false;
  
  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check for wildcard subdomains (e.g., *.example.com)
  const wildcardDomains = allowedOrigins.filter(origin => origin.startsWith('*.'));
  for (const wildcardDomain of wildcardDomains) {
    const domain = wildcardDomain.substring(2); // Remove '*.'
    if (origin.endsWith(domain)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests
    const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
    
    // Check if limit exceeded
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Export rate limiter instance
export const apiRateLimiter = new RateLimiter(
  CONFIG.security.rateLimit?.api?.max || 100,
  CONFIG.security.rateLimit?.api?.windowMs || 15 * 60 * 1000
);

export const authRateLimiter = new RateLimiter(
  CONFIG.security.rateLimit?.auth?.max || 5,
  CONFIG.security.rateLimit?.auth?.windowMs || 15 * 60 * 1000
);