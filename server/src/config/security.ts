import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Security configuration
export const securityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'aicalorietracker',
    audience: process.env.JWT_AUDIENCE || 'aicalorietracker-users',
    algorithm: 'HS256' as const,
    notBefore: 0,
    jwtid: undefined,
    subject: undefined,
    noTimestamp: false,
    header: undefined,
    keyid: undefined
  },

  // Session Configuration
  session: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // 24 hours in milliseconds
    rolling: process.env.SESSION_ROLLING === 'true',
    secure: process.env.SESSION_SECURE === 'true',
    httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
    sameSite: process.env.SESSION_SAME_SITE as 'lax' | 'strict' | 'none' || 'strict',
    domain: process.env.SESSION_DOMAIN || undefined,
    path: process.env.SESSION_PATH || '/',
    maxSessionsPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER || '5'),
    maxInactiveTime: parseInt(process.env.MAX_INACTIVE_TIME || '1800000'), // 30 minutes
    cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '3600000') // 1 hour
  },

  // Rate Limiting Configuration
  rateLimit: {
    api: {
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      max: parseInt(process.env.API_RATE_LIMIT_MAX || '100'),
      message: process.env.API_RATE_LIMIT_MESSAGE || 'Too many API requests, please try again later',
      skip: (req: any) => {
        // Skip rate limiting for health checks and certain admin routes
        return req.path.startsWith('/api/health') || 
               req.path.startsWith('/api/admin') ||
               req.ip === '127.0.0.1' ||
               req.ip === '::1';
      }
    },
    auth: {
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'),
      message: process.env.AUTH_RATE_LIMIT_MESSAGE || 'Too many authentication attempts, please try again later'
    },
    upload: {
      windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW || '3600000'), // 1 hour
      max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '10'),
      message: process.env.UPLOAD_RATE_LIMIT_MESSAGE || 'Too many file uploads, please try again later'
    },
    ai: {
      windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW || '3600000'), // 1 hour
      max: parseInt(process.env.AI_RATE_LIMIT_MAX || '50'),
      message: process.env.AI_RATE_LIMIT_MESSAGE || 'Too many AI service requests, please try again later'
    }
  },

  // Password Configuration
  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    requireNumber: process.env.PASSWORD_REQUIRE_NUMBER !== 'false',
    requireSpecialChar: process.env.PASSWORD_REQUIRE_SPECIAL_CHAR !== 'false',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    maxAttempts: parseInt(process.env.PASSWORD_MAX_ATTEMPTS || '5'),
    lockoutDuration: parseInt(process.env.PASSWORD_LOCKOUT_DURATION || '900000') // 15 minutes
  },

  // CORS Configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:5000',
      'http://localhost:5001'
    ],
    credentials: process.env.CORS_CREDENTIALS !== 'false',
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin', 
      'X-Requested-With', 
      'Content-Type', 
      'Accept', 
      'Authorization',
      'X-API-Key',
      'X-Session-ID',
      'X-CSRF-Token'
    ],
    exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: parseInt(process.env.CORS_MAX_AGE || '86400') // 24 hours
  },

  // Security Headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': process.env.STRICT_TRANSPORT_SECURITY || 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': process.env.CONTENT_SECURITY_POLICY || 
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; worker-src 'self'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; manifest-src 'self'; base-uri 'self'",
    'Referrer-Policy': process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin',
    'Permissions-Policy': process.env.PERMISSIONS_POLICY || 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880'), // 5MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ],
    allowedExtensions: process.env.UPLOAD_ALLOWED_EXTENSIONS?.split(',') || [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'
    ]
  },

  // IP Filtering Configuration
  ipFilter: {
    whitelist: process.env.IP_WHITELIST?.split(',') || [],
    blacklist: process.env.IP_BLACKLIST?.split(',') || [],
    enable: process.env.IP_FILTER_ENABLE !== 'false'
  },

  // Bot Detection Configuration
  botDetection: {
    enable: process.env.BOT_DETECTION_ENABLE !== 'false',
    suspiciousUserAgents: process.env.SUSPICIOUS_USER_AGENTS?.split(',') || [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests',
      'scrapy', 'selenium', 'phantomjs', 'headless', 'chrome/90', 'firefox/88',
      'postman', 'insomnia', 'axios', 'fetch', 'node-fetch'
    ]
  },

  // Database Security
  database: {
    ssl: process.env.DB_SSL === 'true',
    sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
    timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '60000')
  },

  // Encryption Configuration
  encryption: {
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    key: process.env.ENCRYPTION_KEY || 'your-encryption-key-change-in-production',
    ivLength: parseInt(process.env.ENCRYPTION_IV_LENGTH || '16'),
    tagLength: parseInt(process.env.ENCRYPTION_TAG_LENGTH || '16')
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING !== 'false',
    logDirectory: process.env.LOG_DIRECTORY || './logs',
    maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE || '10485760'), // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
    enableConsoleLogging: process.env.ENABLE_CONSOLE_LOGGING !== 'false'
  },

  // Monitoring Configuration
  monitoring: {
    enableErrorTracking: process.env.ENABLE_ERROR_TRACKING !== 'false',
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
    enableSecurityMonitoring: process.env.ENABLE_SECURITY_MONITORING !== 'false',
    sentryDsn: process.env.SENTRY_DSN || undefined,
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT || 'development',
    sentryRelease: process.env.SENTRY_RELEASE || '1.0.0'
  },

  // API Configuration
  api: {
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
    retries: parseInt(process.env.API_RETRIES || '3'),
    retryDelay: parseInt(process.env.API_RETRY_DELAY || '1000'),
    enableCompression: process.env.API_ENABLE_COMPRESSION !== 'false',
    enableRequestLogging: process.env.API_ENABLE_REQUEST_LOGGING !== 'false'
  },

  // Mobile App Configuration
  mobile: {
    enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS !== 'false',
    pushNotificationService: process.env.PUSH_NOTIFICATION_SERVICE || 'fcm',
    enableOfflineMode: process.env.ENABLE_OFFLINE_MODE !== 'false',
    enableBiometricAuth: process.env.ENABLE_BIOMETRIC_AUTH !== 'false'
  }
};

// Validate security configuration
export function validateSecurityConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate JWT configuration
  if (!securityConfig.jwt.secret || securityConfig.jwt.secret === 'your-secret-key-change-in-production') {
    errors.push('JWT secret must be set and changed from default value');
  }

  if (securityConfig.jwt.secret.length < 32) {
    errors.push('JWT secret must be at least 32 characters long');
  }

  // Validate session configuration
  if (securityConfig.session.maxAge < 60000) { // Less than 1 minute
    errors.push('Session max age must be at least 1 minute');
  }

  // Validate password configuration
  if (securityConfig.password.minLength < 8) {
    errors.push('Password minimum length must be at least 8 characters');
  }

  // Validate rate limiting configuration
  if (securityConfig.rateLimit.api.max < 1) {
    errors.push('API rate limit max must be at least 1');
  }

  // Validate CORS configuration
  if (securityConfig.cors.origin.length === 0) {
    errors.push('CORS origin must be configured');
  }

  // Validate database configuration
  if (!securityConfig.database.ssl && process.env.NODE_ENV === 'production') {
    errors.push('Database SSL should be enabled in production');
  }

  // Validate encryption configuration
  if (!securityConfig.encryption.key || securityConfig.encryption.key === 'your-encryption-key-change-in-production') {
    errors.push('Encryption key must be set and changed from default value');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Get security configuration for specific environment
export function getSecurityConfigForEnvironment(env: string): any {
  const config = { ...securityConfig };
  
  if (env === 'production') {
    // Production-specific security settings
    config.session.secure = true;
    config.session.httpOnly = true;
    config.cors.credentials = true;
    config.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    config.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; worker-src 'self'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; manifest-src 'self'; base-uri 'self'";
  } else if (env === 'development') {
    // Development-specific security settings
    config.headers['Content-Security-Policy'] = "default-src 'self' http://localhost:* https://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://localhost:*; style-src 'self' 'unsafe-inline' http://localhost:* https://localhost:*; img-src 'self' data: http://localhost:* https://localhost:*; connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*; font-src 'self' http://localhost:* https://localhost:*; object-src 'none'; media-src 'self' http://localhost:* https://localhost:*; frame-src 'self' http://localhost:* https://localhost:*; worker-src 'self' blob:; child-src 'self' http://localhost:* https://localhost:*; frame-ancestors 'none'; form-action 'self' http://localhost:* https://localhost:*; manifest-src 'self' http://localhost:* https://localhost:*; base-uri 'self' http://localhost:* https://localhost:*";
  }
  
  return config;
}

// Export security utilities
export const securityUtils = {
  // Generate secure random string
  generateSecureString: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate secure token
  generateToken: (length: number = 64): string => {
    return securityUtils.generateSecureString(length);
  },

  // Validate email format
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  validatePasswordStrength: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < securityConfig.password.minLength) {
      errors.push(`Password must be at least ${securityConfig.password.minLength} characters long`);
    }
    
    if (securityConfig.password.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (securityConfig.password.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (securityConfig.password.requireNumber && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (securityConfig.password.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Sanitize input
  sanitizeInput: (input: any): any => {
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
      return input.map(securityUtils.sanitizeInput);
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const key in input) {
        sanitized[key] = securityUtils.sanitizeInput(input[key]);
      }
      return sanitized;
    }
    return input;
  }
};