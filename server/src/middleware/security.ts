import { Request, Response, NextFunction } from 'express';

// Rate limiting configuration (without external dependencies)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

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
        resetTime: now + windowMs
      };
      rateLimitStore.set(clientIp, entry);
    } else {
      entry.count++;
    }
    
    // Check if limit exceeded
    if (entry.count > max) {
      return res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': (max - entry.count).toString(),
      'X-RateLimit-Reset': entry.resetTime.toString()
    });
    
    next();
  };
};

// API rate limiting
export const apiRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many API requests, please try again later'
);

// Authentication rate limiting
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 login attempts per window
  'Too many authentication attempts, please try again later'
);

// File upload rate limiting
export const uploadRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  'Too many file uploads, please try again later'
);

// AI service rate limiting
export const aiRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  50, // 50 AI calls per hour
  'Too many AI service requests, please try again later'
);

// CORS configuration - environment-aware
export const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    const isStaging = process.env.NODE_ENV === 'staging';

    const allowedOrigins = [
      // Environment variable override
      ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
      // Development origins
      ...(isDevelopment ? [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173'
      ] : []),
      // Production origins
      ...(isProduction ? [
        'https://aicalorietracker.com',
        'https://www.aicalorietracker.com',
        'https://aical.scanitix.com',
        'https://www.aical.scanitix.com'
      ] : []),
      // Staging origins
      ...(isStaging ? [
        'https://staging.aicalorietracker.com'
      ] : [])
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'X-API-Key'
  ],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
};

// Request size limiting
export const requestSizeLimiter = (limit: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSize = parseSizeToBytes(limit);
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Request entity too large',
        code: 'PAYLOAD_TOO_LARGE',
        maxSize: maxSize,
        receivedSize: contentLength
      });
    }
    
    next();
  };
};

// File upload size limiting
export const uploadSizeLimiter = (limit: string = '5mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSize = parseSizeToBytes(limit);
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'File too large',
        code: 'FILE_TOO_LARGE',
        maxSize: maxSize,
        receivedSize: contentLength
      });
    }
    
    next();
  };
};

// Security logging middleware
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log security-relevant information
  const securityInfo = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString(),
    path: req.path,
    query: req.query,
    headers: {
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP'),
      'cf-connecting-ip': req.get('CF-Connecting-IP')
    }
  };
  
  // Log security events
  if (req.path.includes('/login') || req.path.includes('/auth')) {
    console.log('Authentication attempt:', securityInfo);
  }
  
  if (req.path.includes('/admin')) {
    console.log('Admin access attempt:', securityInfo);
  }
  
  if (req.path.includes('/upload')) {
    console.log('File upload attempt:', securityInfo);
  }
  
  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`Security log - ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    // Log suspicious activity
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`Security alert - Failed ${req.method} ${req.url} from ${req.ip}`);
    }
    
    if (duration > 5000) {
      console.warn(`Performance alert - Slow request: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  
  next();
};

// SQL injection protection
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|CREATE|ALTER|TRUNCATE)\b)/gi,
    /('|--|;|\/\*|\*\/|@@|xp_|sp_|exec\s+)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi
  ];
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
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
    console.warn('SQL injection attempt detected from:', req.ip);
    return res.status(400).json({
      error: 'Invalid request format',
      code: 'INVALID_REQUEST'
    });
  }
  
  next();
};

// XSS protection
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
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
  
  // Sanitize request body and query parameters
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// CSRF protection
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // For APIs, we'll use a token-based approach
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') {
    // Skip CSRF protection for authentication and onboarding endpoints
    const bypassPaths = ['/api/auth/', '/api/onboarding/'];
    if (bypassPaths.some(path => req.path.startsWith(path))) {
      console.log('CSRF protection skipped for auth/onboarding endpoint:', req.path);
      return next();
    }
    
    // Skip CSRF protection for testing on localhost
    if (req.hostname === 'localhost' || req.ip === '127.0.0.1') {
      console.log('CSRF protection skipped for localhost testing:', req.path);
      return next();
    }
    
    const csrfToken = req.headers['x-csrf-token'];
    const sessionToken = req.headers['x-session-token'];
    
    if (!csrfToken || !sessionToken) {
      return res.status(403).json({
        error: 'CSRF protection failed',
        code: 'CSRF_FAILED'
      });
    }
    
    // In a real implementation, you would validate the tokens against your session store
    // For now, we'll just log the attempt
    console.log('CSRF protection check for:', req.method, req.url);
  }
  
  next();
};

// IP whitelist/blacklist
export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || 'unknown';
  const whitelist = process.env.IP_WHITELIST?.split(',') || [];
  const blacklist = process.env.IP_BLACKLIST?.split(',') || [];
  
  // Check blacklist first
  if (blacklist.length > 0 && blacklist.includes(clientIp)) {
    console.warn('Blocked blacklisted IP:', clientIp);
    return res.status(403).json({
      error: 'Access denied',
      code: 'IP_BLOCKED'
    });
  }
  
  // Check whitelist if specified
  if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
    console.warn('Blocked non-whitelisted IP:', clientIp);
    return res.status(403).json({
      error: 'Access denied',
      code: 'IP_NOT_ALLOWED'
    });
  }
  
  next();
};

// Bot detection
export const botDetection = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  const suspiciousUserAgents = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests',
    'scrapy', 'selenium', 'phantomjs', 'headless', 'chrome/90', 'firefox/88'
  ];
  
  const isBot = suspiciousUserAgents.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isBot) {
    console.log('Bot detected:', userAgent, 'from IP:', req.ip);
    // You can choose to block or log bot activity
    // return res.status(403).json({ error: 'Bot access denied' });
  }
  
  next();
};

// Request validation
export const requestValidation = (req: Request, res: Response, next: NextFunction) => {
  // Check for common attack patterns
  const attackPatterns = [
    /\.\./g, // Directory traversal
    /\/etc\/passwd/g, // Unix file access
    /windows\\system32/gi, // Windows file access
    /<script[^>]*>.*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /data:text\/html/gi, // Data URI
    /vbscript:/gi, // VBScript protocol
    /on\w+\s*=/gi // Event handlers
  ];
  
  const checkForAttacks = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return attackPatterns.some(pattern => pattern.test(obj));
    }
    if (Array.isArray(obj)) {
      return obj.some(checkForAttacks);
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(checkForAttacks);
    }
    return false;
  };
  
  if (checkForAttacks(req.body) || checkForAttacks(req.query) || checkForAttacks(req.params)) {
    console.warn('Potential attack detected from:', req.ip);
    return res.status(400).json({
      error: 'Invalid request',
      code: 'INVALID_REQUEST'
    });
  }
  
  next();
};

// Security headers middleware
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; worker-src 'self'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; manifest-src 'self'; base-uri 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  
  next();
};

// Security audit trail
export const securityAudit = (req: Request, res: Response, next: NextFunction) => {
  const auditTrail = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    headers: {
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP'),
      'cf-connecting-ip': req.get('CF-Connecting-IP')
    },
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
    statusCode: res.statusCode,
    responseTime: res.get('X-Response-Time')
  };
  
  // In production, you would send this to a security monitoring service
  console.log('Security audit:', JSON.stringify(auditTrail, null, 2));
  
  next();
};

// Enhanced authentication middleware
export const enhancedAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  // Check for API key first
  if (apiKey) {
    const validApiKeys = process.env.API_KEYS?.split(',') || [];
    if (!validApiKeys.includes(apiKey as string)) {
      console.warn('Invalid API key used:', apiKey, 'from IP:', req.ip);
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }
    next();
    return;
  }
  
  // Check for JWT token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Basic token validation (in production, use proper JWT library)
  if (!token || token.length < 10) {
    console.warn('Invalid token format from IP:', req.ip);
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  next();
};

// Admin access middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // This would check the user's role in the database
  // For now, we'll just check for admin token
  const adminToken = req.headers['x-admin-token'];
  const validAdminTokens = process.env.ADMIN_TOKENS?.split(',') || [];
  
  if (!adminToken || !validAdminTokens.includes(adminToken as string)) {
    console.warn('Unauthorized admin access attempt from IP:', req.ip);
    return res.status(403).json({
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
};

// Security monitoring middleware
export const securityMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Monitor for suspicious patterns
  const suspiciousPatterns = {
    sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|CREATE|ALTER|TRUNCATE)\b)/gi,
    xss: /<script[^>]*>.*?<\/script>/gi,
    pathTraversal: /\.\.\//g,
    commandInjection: /;|&&|\|\|/g
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
      console.warn(`Suspicious activity detected in body from ${req.ip}:`, suspicious);
    }
  }
  
  // Check query parameters
  if (req.query) {
    const queryStr = JSON.stringify(req.query);
    const suspicious = checkSuspicious(queryStr);
    if (suspicious.length > 0) {
      console.warn(`Suspicious activity detected in query from ${req.ip}:`, suspicious);
    }
  }
  
  // Monitor response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 10000) { // 10 seconds
      console.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  
  next();
};

// Helper function to parse size strings to bytes
function parseSizeToBytes(size: string): number {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  return value * (units[unit as keyof typeof units] || 1);
}

// Security configuration
export const securityConfig = {
  rateLimit: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many API requests, please try again later'
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      message: 'Too many authentication attempts, please try again later'
    },
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10,
      message: 'Too many file uploads, please try again later'
    },
    ai: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50,
      message: 'Too many AI service requests, please try again later'
    }
  },
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; worker-src 'self'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; manifest-src 'self'; base-uri 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  },
  requestLimits: {
    maxBodySize: '10mb',
    maxUploadSize: '5mb'
  }
};

// HTTPS enforcement middleware
export const enforceHttps = (req: Request, res: Response, next: NextFunction) => {
  const forceHttps = process.env.FORCE_HTTPS === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  // Skip HTTPS enforcement in development or if disabled
  if (!forceHttps || !isProduction) {
    return next();
  }

  // Check if request is using HTTPS
  const isHttps = req.protocol === 'https' ||
                  req.secure ||
                  req.headers['x-forwarded-proto'] === 'https' ||
                  req.headers['x-forwarded-protocol'] === 'https';

  // Allow localhost and internal requests in development
  const isLocalhost = req.hostname === 'localhost' ||
                     req.hostname === '127.0.0.1' ||
                     req.ip === '127.0.0.1' ||
                     req.ip === '::1';

  if (!isHttps && !isLocalhost) {
    console.warn(`HTTPS enforcement: Blocking HTTP request from ${req.ip} to ${req.originalUrl}`);
    return res.status(403).json({
      error: 'HTTPS is required for all API requests',
      code: 'HTTPS_REQUIRED',
      message: 'This API only accepts HTTPS requests for security reasons',
      timestamp: new Date().toISOString(),
      protocol: req.protocol,
      hostname: req.hostname
    });
  }

  next();
};

// Security utilities
export const securityUtils = {
  // Sanitize input
  sanitize: (input: any): any => {
    if (typeof input === 'string') {
      return input
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    if (Array.isArray(input)) {
      return input.map(securityUtils.sanitize);
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const key in input) {
        sanitized[key] = securityUtils.sanitize(input[key]);
      }
      return sanitized;
    }
    return input;
  },

  // Validate input
  validate: (input: any, patterns: RegExp[]): boolean => {
    if (typeof input === 'string') {
      return patterns.some(pattern => pattern.test(input));
    }
    if (Array.isArray(input)) {
      return input.some(item => securityUtils.validate(item, patterns));
    }
    if (typeof input === 'object' && input !== null) {
      return Object.values(input).some(value => securityUtils.validate(value, patterns));
    }
    return false;
  },

  // Generate secure token
  generateToken: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Hash password (simple implementation)
  hashPassword: (password: string): string => {
    // In production, use a proper hashing library like bcrypt
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
};