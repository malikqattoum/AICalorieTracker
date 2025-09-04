// Server-side security utilities for enhanced security features

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { securityConfig } from '../config/security';

const logger = new Logger('SecurityUtils');

/**
 * Standardized IP resolution function that handles proxy headers correctly
 * This function respects the X-Forwarded-For header when trust proxy is enabled
 */
export const getClientIp = (req: Request): string => {
  // When trust proxy is enabled, req.ip will be the left-most IP in X-Forwarded-For
  // If X-Forwarded-For is not present, it falls back to req.connection.remoteAddress
  // If trust proxy is not enabled, req.ip will be the direct connection IP
  return req.ip || 'unknown';
};

/**
 * Enhanced IP resolution that includes additional proxy headers for better accuracy
 * This function provides more detailed IP information for logging and analysis
 */
export const getDetailedIpInfo = (req: Request): {
  ip: string;
  xForwardedFor: string | undefined;
  xRealIp: string | undefined;
  connectionIp: string | undefined;
} => {
  return {
    ip: getClientIp(req),
    xForwardedFor: req.headers['x-forwarded-for'] as string,
    xRealIp: req.headers['x-real-ip'] as string,
    connectionIp: req.connection?.remoteAddress
  };
};

/**
 * Enhanced CORS validation
 */
export const validateCORS = (origin: string): boolean => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
    'https://aicalorietracker.com',
    'https://www.aicalorietracker.com',
    'https://staging.aicalorietracker.com'
  ];
  
  if (!origin) return false;
  
  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check for wildcard subdomains (e.g., *.example.com)
  const wildcardDomains = allowedOrigins.filter((origin: string) => origin.startsWith('*.'));
  for (const wildcardDomain of wildcardDomains) {
    const domain = wildcardDomain.substring(2); // Remove '*.'
    if (origin.endsWith(domain)) {
      return true;
    }
  }
  
  return false;
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
  endpoint?: string;
}): void => {
  if (process.env.NODE_ENV !== 'production') return;

  const logEntry = {
    timestamp: new Date().toISOString(),
    type: event.type,
    level: event.level,
    message: event.message,
    details: event.details || {},
    userId: event.userId || 'anonymous',
    ip: event.ip || 'unknown',
    userAgent: event.userAgent || 'unknown',
    endpoint: event.endpoint || 'unknown',
    environment: process.env.NODE_ENV || 'development'
  };

  // Log to console
  console.log('[Security Event]', JSON.stringify(logEntry, null, 2));

  // Log specific events based on type
  switch (event.type) {
    case 'AUTH_ATTEMPT':
      logger.info(`Authentication attempt: ${event.message}`, event.details);
      break;
    case 'TOKEN_VALIDATION':
      logger.info(`Token validation: ${event.message}`, event.details);
      break;
    case 'SECURITY_VIOLATION':
      logger.warn(`Security violation: ${event.message}`, event.details);
      break;
    case 'SUSPICIOUS_ACTIVITY':
      logger.warn(`Suspicious activity: ${event.message}`, event.details);
      break;
  }
};

/**
 * Enhanced request validation to prevent common security vulnerabilities
 */
export const validateRequest = (req: Request): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // SQL injection detection
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

  if (checkForSQL(req.body) || checkForSQL(req.query) || checkForSQL(req.params)) {
    errors.push('Potential SQL injection detected');
  }

  // XSS detection
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

  if (checkForXSS(req.body) || checkForXSS(req.query) || checkForXSS(req.params)) {
    errors.push('Potential XSS attack detected');
  }

  // Path traversal detection
  const checkPathTraversal = (value: any): boolean => {
    if (typeof value === 'string') {
      return /\.\.\//g.test(value) || /\/etc\/passwd/g.test(value) || /windows\\system32/gi.test(value);
    }
    return false;
  };

  if (checkPathTraversal(req.body) || checkPathTraversal(req.query) || checkPathTraversal(req.params)) {
    errors.push('Potential path traversal attack detected');
  }

  // Command injection detection
  const checkCommandInjection = (value: any): boolean => {
    if (typeof value === 'string') {
      return /;|&&|\|\|/g.test(value);
    }
    return false;
  };

  if (checkCommandInjection(req.body) || checkCommandInjection(req.query) || checkCommandInjection(req.params)) {
    errors.push('Potential command injection detected');
  }

  // File type validation for uploads
  if (req.body && req.body.fileType) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(req.body.fileType)) {
      errors.push(`Invalid file type: ${req.body.fileType}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Enhanced JWT validation with additional security checks
 */
export const validateJWTEnhanced = (token: string): { valid: boolean; payload?: any; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    // Basic token format validation
    if (!token || token.length < 10) {
      errors.push('Token too short');
      return { valid: false, errors };
    }

    // Check JWT structure
    const parts = token.split('.');
    if (parts.length !== 3) {
      errors.push('Invalid JWT structure');
      return { valid: false, errors };
    }

    // Decode payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      errors.push('Token expired');
    }

    // Check not before (if present)
    if (payload.nbf && payload.nbf > now) {
      errors.push('Token not yet valid');
    }

    // Check issuer (if present)
    if (payload.iss && payload.iss !== 'aicalorietracker') {
      errors.push('Invalid token issuer');
    }

    // Check audience (if present)
    if (payload.aud && !Array.isArray(payload.aud) && payload.aud !== 'aicalorietracker') {
      errors.push('Invalid token audience');
    }

    // Check token ID (if present)
    if (!payload.jti) {
      errors.push('Missing token ID');
    }

    return {
      valid: errors.length === 0,
      payload,
      errors
    };

  } catch (error) {
    errors.push('Token validation failed');
    return { valid: false, errors };
  }
};

/**
 * Enhanced rate limiting with security features
 */
export class EnhancedRateLimiter {
  private requests: Map<string, { count: number; firstRequest: number; lastRequest: number }> = new Map();
  private maxRequests: number;
  private windowMs: number;
  private blockDuration: number;

  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000, blockDuration: number = 60 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.blockDuration = blockDuration;
  }

  isAllowed(identifier: string): { allowed: boolean; remaining: number; blocked: boolean; blockTime?: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // Check if IP is blocked
    if (entry && now - entry.lastRequest < this.blockDuration) {
      return {
        allowed: false,
        remaining: 0,
        blocked: true,
        blockTime: entry.lastRequest + this.blockDuration - now
      };
    }

    // Clean expired entries
    if (entry && now - entry.lastRequest > this.windowMs) {
      this.requests.delete(identifier);
      return { allowed: true, remaining: this.maxRequests, blocked: false };
    }

    // Get or create entry
    if (!entry) {
      this.requests.set(identifier, {
        count: 1,
        firstRequest: now,
        lastRequest: now
      });
      return { allowed: true, remaining: this.maxRequests - 1, blocked: false };
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      // Block the IP
      this.requests.set(identifier, {
        count: entry.count + 1,
        firstRequest: entry.firstRequest,
        lastRequest: now
      });
      return {
        allowed: false,
        remaining: 0,
        blocked: true,
        blockTime: this.blockDuration
      };
    }

    // Increment count
    entry.count++;
    entry.lastRequest = now;
    this.requests.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      blocked: false
    };
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Export rate limiter instances
export const apiRateLimiter = new EnhancedRateLimiter(
  securityConfig.rateLimit?.api?.max || 100,
  securityConfig.rateLimit?.api?.windowMs || 15 * 60 * 1000
);

export const authRateLimiter = new EnhancedRateLimiter(
  securityConfig.rateLimit?.auth?.max || 5,
  securityConfig.rateLimit?.auth?.windowMs || 15 * 60 * 1000,
  30 * 60 * 1000 // 30 minute block for auth failures
);

/**
 * Enhanced rate limiting middleware that uses standardized IP resolution
 */
export const createEnhancedRateLimiter = (windowMs: number, max: number, message: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req);
    const result = apiRateLimiter.isAllowed(clientIp);
    
    if (!result.allowed) {
      logger.warn(`Rate limit exceeded for IP: ${clientIp}, blocked: ${result.blocked}`);
      
      return res.status(429).json({
        success: false,
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
        retryAfter: result.blockTime ? Math.ceil(result.blockTime / 1000) : undefined,
        limit: max,
        remaining: result.remaining,
        blocked: result.blocked
      });
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': (Date.now() + windowMs).toString()
    });
    
    next();
  };
};