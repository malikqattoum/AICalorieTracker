/**
 * Production configuration for the AICalorieTracker application
 * This file contains all production-specific settings and optimizations
 */

export const productionConfig = {
  // Security settings
  security: {
    // Enable rate limiting
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many API requests, please try again later'
    },
    
    // Enable security headers
    securityHeaders: {
      enabled: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; worker-src 'self'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; manifest-src 'self'; base-uri 'self'",
      strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
      xssProtection: '1; mode=block',
      frameOptions: 'DENY',
      contentTypeOptions: 'nosniff'
    },
    
    // Enable CORS
    cors: {
      enabled: true,
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://yourdomain.com',
        'https://www.yourdomain.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin', 
        'X-Requested-With', 
        'Content-Type', 
        'Accept', 
        'Authorization',
        'X-API-Key'
      ]
    },
    
    // Enable IP filtering
    ipFiltering: {
      enabled: true,
      whitelist: process.env.IP_WHITELIST?.split(',') || [],
      blacklist: process.env.IP_BLACKLIST?.split(',') || []
    },
    
    // Enable bot detection
    botDetection: {
      enabled: true,
      suspiciousUserAgents: [
        'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests',
        'scrapy', 'selenium', 'phantomjs', 'headless'
      ]
    },
    
    // Enable SQL injection protection
    sqlInjectionProtection: {
      enabled: true,
      patterns: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|CREATE|ALTER|TRUNCATE)\b)/gi,
        /('|--|;|\/\*|\*\/|@@|xp_|sp_|exec\s+)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi
      ]
    },
    
    // Enable XSS protection
    xssProtection: {
      enabled: true,
      sanitizeInput: true
    },
    
    // Enable CSRF protection
    csrfProtection: {
      enabled: true,
      tokenValidation: true
    }
  },
  
  // Performance settings
  performance: {
    // Enable compression
    compression: {
      enabled: true,
      level: 6
    },
    
    // Enable caching
    caching: {
      enabled: true,
      staticAssets: '1d',
      apiResponses: '5m',
      databaseQueries: '10m'
    },
    
    // Enable request timeout
    timeouts: {
      request: 300000, // 5 minutes
      response: 30000, // 30 seconds
      database: 15000, // 15 seconds
      aiService: 120000 // 2 minutes
    },
    
    // Enable connection pooling
    database: {
      pool: {
        min: 2,
        max: 10,
        acquire: 30000,
        idle: 10000
      }
    },
    
    // Enable clustering
    clustering: {
      enabled: true,
      workers: process.env.NODE_ENV === 'production' ? require('os').cpus().length : 1
    }
  },
  
  // Logging settings
  logging: {
    // Enable structured logging
    structured: true,
    
    // Log level
    level: process.env.LOG_LEVEL || 'info',
    
    // Enable request logging
    requestLogging: {
      enabled: true,
      includeHeaders: true,
      includeBody: false // Don't log request bodies in production
    },
    
    // Enable error logging
    errorLogging: {
      enabled: true,
      includeStack: true,
      includeRequest: true
    },
    
    // Enable security logging
    securityLogging: {
      enabled: true,
      includeFailedAuth: true,
      includeSuspiciousActivity: true
    },
    
    // Enable performance logging
    performanceLogging: {
      enabled: true,
      includeResponseTimes: true,
      includeSlowRequests: true
    }
  },
  
  // Database settings
  database: {
    // Connection pooling
    pool: {
      min: 2,
      max: 10,
      acquire: 30000,
      idle: 10000
    },
    
    // Connection settings
    connection: {
      ssl: {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA
      },
      connectTimeout: 10000,
      acquireTimeout: 30000,
      timeout: 15000
    },
    
    // Query settings
    query: {
      timeout: 15000,
      nestTables: true,
      typeCast: true
    }
  },
  
  // AI service settings
  aiService: {
    // Rate limiting
    rateLimit: {
      enabled: true,
      requestsPerMinute: 50,
      requestsPerHour: 1000,
      requestsPerDay: 10000
    },
    
    // Timeout settings
    timeouts: {
      request: 120000, // 2 minutes
      response: 300000 // 5 minutes
    },
    
    // Retry settings
    retry: {
      enabled: true,
      maxRetries: 3,
      retryDelay: 1000,
      backoffFactor: 2
    },
    
    // Circuit breaker settings
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
      resetTimeout: 30000
    }
  },
  
  // File upload settings
  fileUpload: {
    // Enable file upload limits
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 10,
      fields: 50
    },
    
    // Enable file validation
    validation: {
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'],
      maxSize: 5 * 1024 * 1024 // 5MB
    },
    
    // Enable file storage
    storage: {
      provider: process.env.FILE_STORAGE_PROVIDER || 's3',
      bucket: process.env.FILE_STORAGE_BUCKET,
      region: process.env.FILE_STORAGE_REGION,
      accessKeyId: process.env.FILE_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.FILE_STORAGE_SECRET_ACCESS_KEY
    }
  },
  
  // Cache settings
  cache: {
    // Enable Redis caching
    redis: {
      enabled: true,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      ttl: 3600 // 1 hour
    },
    
    // Enable in-memory caching
    memory: {
      enabled: true,
      maxSize: 100 * 1024 * 1024, // 100MB
      ttl: 300 // 5 minutes
    }
  },
  
  // Monitoring settings
  monitoring: {
    // Enable health checks
    healthChecks: {
      enabled: true,
      endpoint: '/api/health',
      interval: 30000, // 30 seconds
      timeout: 5000 // 5 seconds
    },
    
    // Enable metrics collection
    metrics: {
      enabled: true,
      endpoint: '/api/metrics',
      interval: 60000 // 1 minute
    },
    
    // Enable tracing
    tracing: {
      enabled: true,
      provider: process.env.TRACING_PROVIDER || 'jaeger',
      serviceName: 'aic-calorie-tracker',
      sampleRate: 0.1 // 10% of requests
    }
  },
  
  // Backup settings
  backup: {
    // Enable database backups
    database: {
      enabled: true,
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: 30, // 30 days
      compression: true,
      encryption: true
    },
    
    // Enable file backups
    files: {
      enabled: true,
      schedule: '0 3 * * *', // Daily at 3 AM
      retention: 7, // 7 days
      compression: true,
      encryption: true
    }
  },
  
  // Notification settings
  notifications: {
    // Enable email notifications
    email: {
      enabled: true,
      provider: process.env.EMAIL_PROVIDER || 'ses',
      from: process.env.EMAIL_FROM,
      templatePath: './templates/emails'
    },
    
    // Enable push notifications
    push: {
      enabled: true,
      provider: process.env.PUSH_PROVIDER || 'fcm',
      apiKey: process.env.PUSH_API_KEY,
      serviceAccount: process.env.PUSH_SERVICE_ACCOUNT
    },
    
    // Enable SMS notifications
    sms: {
      enabled: true,
      provider: process.env.SMS_PROVIDER || 'twilio',
      from: process.env.SMS_FROM,
      accountSid: process.env.SMS_ACCOUNT_SID,
      authToken: process.env.SMS_AUTH_TOKEN
    }
  },
  
  // Analytics settings
  analytics: {
    // Enable user analytics
    userAnalytics: {
      enabled: true,
      provider: process.env.ANALYTICS_PROVIDER || 'mixpanel',
      token: process.env.ANALYTICS_TOKEN
    },
    
    // Enable performance analytics
    performanceAnalytics: {
      enabled: true,
      provider: process.env.PERFORMANCE_ANALYTICS_PROVIDER || 'datadog',
      apiKey: process.env.PERFORMANCE_ANALYTICS_API_KEY
    },
    
    // Enable error analytics
    errorAnalytics: {
      enabled: true,
      provider: process.env.ERROR_ANALYTICS_PROVIDER || 'sentry',
      dsn: process.env.ERROR_ANALYTICS_DSN
    }
  },
  
  // Security audit settings
  securityAudit: {
    // Enable security audit logging
    logging: {
      enabled: true,
      level: 'info',
      includeHeaders: true,
      includeBody: false,
      includeResponse: true
    },
    
    // Enable security monitoring
    monitoring: {
      enabled: true,
      suspiciousActivity: true,
      bruteForceDetection: true,
      sqlInjectionDetection: true,
      xssDetection: true
    },
    
    // Enable security alerts
    alerts: {
      enabled: true,
      email: process.env.SECURITY_ALERT_EMAIL,
      sms: process.env.SECURITY_ALERT_SMS,
      webhook: process.env.SECURITY_ALERT_WEBHOOK
    }
  },
  
  // Compliance settings
  compliance: {
    // Enable GDPR compliance
    gdpr: {
      enabled: true,
      dataRetention: 365, // 365 days
      rightToBeForgotten: true,
      dataPortability: true,
      consentManagement: true
    },
    
    // Enable CCPA compliance
    ccpa: {
      enabled: true,
      dataRetention: 365, // 365 days
      optOutManagement: true,
      dataDeletion: true
    },
    
    // Enable HIPAA compliance
    hipaa: {
      enabled: true,
      dataEncryption: true,
      accessControl: true,
      auditLogging: true,
      businessAssociateAgreement: true
    }
  },
  
  // Environment-specific settings
  environment: {
    // Node.js settings
    node: {
      maxOldSpaceSize: process.env.NODE_MAX_OLD_SPACE_SIZE || '4096', // 4GB
      optimizeForProduction: true,
      enableSourceMaps: false
    },
    
    // Process settings
    process: {
      title: 'aic-calorie-tracker',
      env: process.env.NODE_ENV || 'production',
      port: parseInt(process.env.PORT || '3000'),
      host: process.env.HOST || '0.0.0.0'
    },
    
    // SSL settings
    ssl: {
      enabled: process.env.SSL_ENABLED === 'true',
      certPath: process.env.SSL_CERT_PATH,
      keyPath: process.env.SSL_KEY_PATH,
      caPath: process.env.SSL_CA_PATH,
      forceHttps: true
    }
  }
};

// Export configuration
export default productionConfig;

// Export individual configuration sections
export const {
  security,
  performance,
  logging,
  database,
  aiService,
  fileUpload,
  cache,
  monitoring,
  backup,
  notifications,
  analytics,
  securityAudit,
  compliance,
  environment
} = productionConfig;