import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/logger';
import { AppError, AuthenticationError, AuthorizationError, ErrorType, ErrorCode } from './errorHandler';
import { securityConfig } from '../config/security';

const logger = new Logger('SecurityEnhanced');

// Enhanced rate limiting with persistent storage
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

// Use a more persistent storage (in production, use Redis or database)
const rateLimitStore = new Map<string, RateLimitEntry>();

export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean expired entries
    const expiredEntries: string[] = [];
    rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetTime) {
        expiredEntries.push(key);
      }
    });
    expiredEntries.forEach(key => rateLimitStore.delete(key));
    
    // Get or create entry
    let entry = rateLimitStore.get(clientIp);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now
      };
      rateLimitStore.set(clientIp, entry);
    } else {
      entry.count++;
    }
    
    // Check if limit exceeded
    if (entry.count > max) {
      logger.warn(`Rate limit exceeded for IP: ${clientIp}, Count: ${entry.count}`);
      return res.status(429).json({
        success: false,
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        limit: max,
        remaining: 0
      });
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': (max - entry.count).toString(),
      'X-RateLimit-Reset': entry.resetTime.toString(),
      'X-RateLimit-Window': windowMs.toString()
    });
    
    next();
  };
};

// Enhanced JWT validation middleware
export const validateJWT = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization token required');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token || token.length < 10) {
      throw new AuthenticationError('Invalid token format');
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as any;
    
    // Add user to request object
    (req as any).user = decoded;
    
    // Check if token is about to expire (within 1 hour)
    const now = Date.now();
    const exp = decoded.exp * 1000;
    if (exp - now < 60 * 60 * 1000) {
      logger.warn('Token expiring soon for user:', decoded.id);
    }
    
    next();
  } catch (error) {
    logger.error('JWT validation failed:', error);
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: error.message,
        code: 'INVALID_TOKEN'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID'
    });
  }
};

// Enhanced session management
export const sessionSecurity = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.headers['x-session-id'] as string;
  const userAgent = req.get('User-Agent') || '';
  const clientIp = req.ip || 'unknown';
  
  // Check if session exists and is valid
  if (sessionId) {
    // In production, validate session against database
    logger.debug('Session validation for:', sessionId);
  }
  
  // Add security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; worker-src 'self'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; manifest-src 'self'; base-uri 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  next();
};

// Enhanced input validation and sanitization
export const inputValidation = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = sanitize(value[key]);
      }
      return sanitized;
    }
    return value;
  };
  
  // Sanitize input (only if body exists)
  if (req.body) {
    req.body = sanitize(req.body);
  }
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// Enhanced SQL injection protection
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|CREATE|ALTER|TRUNCATE)\b)/gi,
    /('|--|;|\/\*|\*\/|@@|xp_|sp_|exec\s+)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi,
    /(\b(OR|AND)\s+\w+\s*LIKE\s*\w+)/gi,
    /(\b(OR|AND)\s+\w+\s*IN\s*\([^)]+\))/gi,
    /(\b(OR|AND)\s+\w+\s*BETWEEN\s+\w+\s+AND\s+\w+)/gi
  ];
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.some(checkValue);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };
  
  // Check request body, query, and params
  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    logger.warn('SQL injection attempt detected from:', req.ip);
    throw new AppError(ErrorType.VALIDATION_ERROR, ErrorCode.INVALID_INPUT, 'Invalid request format');
  }
  
  next();
};

// Enhanced XSS protection
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*rel\s*=\s*"stylesheet"[^>]*>/gi,
    /<meta[^>]*http-equiv[^>]*refresh[^>]*>/gi,
    /<form[^>]*>.*?<\/form>/gi,
    /<input[^>]*type\s*=\s*"hidden"[^>]*>/gi
  ];
  
  const checkXSS = (value: any): boolean => {
    if (typeof value === 'string') {
      return xssPatterns.some(pattern => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.some(checkXSS);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkXSS);
    }
    return false;
  };
  
  // Check for XSS patterns
  if (checkXSS(req.body) || checkXSS(req.query) || checkXSS(req.params)) {
    logger.warn('XSS attempt detected from:', req.ip);
    throw new AppError(ErrorType.VALIDATION_ERROR, ErrorCode.INVALID_INPUT, 'Invalid request format');
  }
  
  next();
};

// Enhanced CSRF protection
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') {
    // Skip CSRF protection for authentication and onboarding endpoints
    const bypassPaths = ['/api/login', '/api/register', '/api/logout', '/api/auth/', '/api/onboarding/'];
    if (bypassPaths.some(path => req.path.startsWith(path))) {
      logger.debug('CSRF protection skipped for auth/onboarding endpoint:', req.path);
      return next();
    }
    
    // Skip CSRF protection for localhost testing
    if (req.hostname === 'localhost' || req.ip === '127.0.0.1') {
      logger.debug('CSRF protection skipped for localhost testing:', req.path);
      return next();
    }
    
    const csrfToken = req.headers['x-csrf-token'];
    const sessionToken = req.headers['x-session-token'];
    
    if (!csrfToken || !sessionToken) {
      logger.warn('CSRF protection failed - missing tokens from:', req.ip);
      throw new AuthorizationError('CSRF protection failed');
    }
    
    // In production, validate tokens against session store
    if (csrfToken !== sessionToken) {
      logger.warn('CSRF token mismatch from:', req.ip);
      throw new AuthorizationError('Invalid CSRF token');
    }
  }
  
  next();
};

// Enhanced IP filtering
export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || 'unknown';
  const whitelist = process.env.IP_WHITELIST?.split(',') || [];
  const blacklist = process.env.IP_BLACKLIST?.split(',') || [];
  
  // Check blacklist first
  if (blacklist.length > 0 && blacklist.includes(clientIp)) {
    logger.warn('Blocked blacklisted IP:', clientIp);
    throw new AuthorizationError('Access denied');
  }
  
  // Check whitelist if specified
  if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
    logger.warn('Blocked non-whitelisted IP:', clientIp);
    throw new AuthorizationError('Access denied');
  }
  
  next();
};

// Enhanced bot detection
export const botDetection = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  const suspiciousUserAgents = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests',
    'scrapy', 'selenium', 'phantomjs', 'headless', 'chrome/90', 'firefox/88',
    'postman', 'insomnia', 'axios', 'fetch', 'node-fetch'
  ];
  
  const isBot = suspiciousUserAgents.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isBot) {
    logger.warn(`Bot detected: ${userAgent} from IP: ${req.ip}`);
    // Log but don't block - you can choose to block if needed
  }
  
  next();
};

// Enhanced security monitoring
export const securityMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Monitor for suspicious patterns
  const suspiciousPatterns = {
    sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|CREATE|ALTER|TRUNCATE)\b)/gi,
    xss: /<script[^>]*>.*?<\/script>/gi,
    pathTraversal: /\.\.\//g,
    commandInjection: /;|&&|\|\|/g,
    directoryTraversal: /\/etc\/passwd/g,
    windowsSystem: /windows\\system32/gi,
    dataUri: /data:text\/html/gi
  };
  
  const checkSuspicious = (input: string): string[] => {
    const detected: string[] = [];
    for (const [name, pattern] of Object.entries(suspiciousPatterns)) {
      if (pattern.test(input)) {
        detected.push(name);
      }
    }
    return detected;
  };
  
  // Check request body
  if (req.body) {
    const bodyStr = JSON.stringify(req.body);
    const suspicious = checkSuspicious(bodyStr);
    if (suspicious.length > 0) {
      logger.warn(`Suspicious activity detected in body from ${req.ip}:`, suspicious);
    }
  }
  
  // Check query parameters
  if (req.query) {
    const queryStr = JSON.stringify(req.query);
    const suspicious = checkSuspicious(queryStr);
    if (suspicious.length > 0) {
      logger.warn(`Suspicious activity detected in query from ${req.ip}:`, suspicious);
    }
  }
  
  // Monitor response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 10000) { // 10 seconds
      logger.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  
  next();
};

// Enhanced password validation
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Enhanced security utilities


// Export enhanced security middleware
export const enhancedSecurityMiddleware = [
  securityMonitoring,
  ipFilter,
  botDetection,
  inputValidation,
  sqlInjectionProtection,
  xssProtection,
  csrfProtection,
  sessionSecurity
];

// Export rate limiters
export const rateLimiters = {
  api: createRateLimiter(
    securityConfig.rateLimit.api.windowMs,
    securityConfig.rateLimit.api.max,
    securityConfig.rateLimit.api.message
  ),
  auth: createRateLimiter(
    securityConfig.rateLimit.auth.windowMs,
    securityConfig.rateLimit.auth.max,
    securityConfig.rateLimit.auth.message
  ),
  upload: createRateLimiter(
    securityConfig.rateLimit.upload.windowMs,
    securityConfig.rateLimit.upload.max,
    securityConfig.rateLimit.upload.message
  ),
  ai: createRateLimiter(
    securityConfig.rateLimit.ai.windowMs,
    securityConfig.rateLimit.ai.max,
    securityConfig.rateLimit.ai.message
  )
};