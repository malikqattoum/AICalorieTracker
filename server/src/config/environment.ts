import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().url(),
  DATABASE_SSL: z.string().optional().default('false'),
  
  // Server Configuration
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('localhost'),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // AI Service Configuration
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4'),
  OPENAI_MAX_TOKENS: z.coerce.number().default(1000),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-sonnet-20240229'),
  
  // Payment Processing Configuration
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_CURRENCY: z.string().default('usd'),
  
  // Push Notification Configuration
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
  FIREBASE_SERVER_KEY: z.string().optional(),
  APNS_CERT_PATH: z.string().optional(),
  APNS_KEY_ID: z.string().optional(),
  APNS_TEAM_ID: z.string().optional(),
  APNS_BUNDLE_ID: z.string().optional(),
  
  // Image Storage Configuration
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_ENDPOINT: z.string().optional(),
  
  // File Storage Configuration
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  ALLOWED_MIME_TYPES: z.string().default('image/jpeg,image/png,image/gif,image/webp'),
  
  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_FROM_NAME: z.string().default('AICalorieTracker'),
  
  // Redis Configuration (for caching)
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  
  // Healthcare Provider Configuration
  APPLE_HEALTH_CLIENT_ID: z.string().optional(),
  APPLE_HEALTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_FIT_CLIENT_ID: z.string().optional(),
  GOOGLE_FIT_CLIENT_SECRET: z.string().optional(),
  FITBIT_CLIENT_ID: z.string().optional(),
  FITBIT_CLIENT_SECRET: z.string().optional(),
  GARMIN_CLIENT_ID: z.string().optional(),
  GARMIN_CLIENT_SECRET: z.string().optional(),
  MEDTRONIC_CLIENT_ID: z.string().optional(),
  MEDTRONIC_CLIENT_SECRET: z.string().optional(),
  OMRON_CLIENT_ID: z.string().optional(),
  OMRON_CLIENT_SECRET: z.string().optional(),
  WITHINGS_CLIENT_ID: z.string().optional(),
  WITHINGS_CLIENT_SECRET: z.string().optional(),
  OURA_CLIENT_ID: z.string().optional(),
  OURA_CLIENT_SECRET: z.string().optional(),
  
  // Analytics Configuration
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  MIXPANEL_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  
  // Security Configuration
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_FILE: z.string().optional(),
  
  // CORS Configuration
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.string().default('true'),
  
  // Cache Configuration
  CACHE_TTL: z.coerce.number().default(3600), // 1 hour
  CACHE_MAX_SIZE: z.coerce.number().default(1000),
  
  // Session Configuration
  SESSION_SECRET: z.string().min(32),
  SESSION_MAX_AGE: z.coerce.number().default(7 * 24 * 60 * 60 * 1000), // 7 days
  SESSION_SECURE: z.string().default('false'),
  
  // File Processing Configuration
  SHARP_PATH: z.string().optional(),
  IMAGE_QUALITY: z.coerce.number().min(1).max(100).default(85),
  IMAGE_MAX_WIDTH: z.coerce.number().default(1920),
  IMAGE_MAX_HEIGHT: z.coerce.number().default(1080),
  IMAGE_THUMBNAIL_SIZE: z.coerce.number().default(300),
  
  // Notification Configuration
  NOTIFICATION_BATCH_SIZE: z.coerce.number().default(100),
  NOTIFICATION_RETRY_DELAY: z.coerce.number().default(5000), // 5 seconds
  NOTIFICATION_MAX_RETRIES: z.coerce.number().default(3),
  
  // Webhook Configuration
  WEBHOOK_SECRET: z.string().min(32),
  WEBHOOK_TIMEOUT: z.coerce.number().default(30000), // 30 seconds
  
  // Monitoring Configuration
  HEALTH_CHECK_INTERVAL: z.coerce.number().default(60000), // 1 minute
  HEALTH_CHECK_TIMEOUT: z.coerce.number().default(5000), // 5 seconds
  
  // Feature Flags
  ENABLE_FEATURE_FLAG: z.string().default('false'),
  FEATURE_FLAG_URL: z.string().optional(),
  
  // Rate Limiting Configuration
  RATE_LIMIT_ENABLED: z.string().default('true'),
  RATE_LIMIT_STORE: z.enum(['memory', 'redis']).default('memory'),
  
  // Security Headers
  SECURITY_HEADERS_ENABLED: z.string().default('true'),
  SECURITY_HEADERS_CSP: z.string().optional(),
  SECURITY_HEADERS_XSS_PROTECTION: z.string().default('1; mode=block'),
  SECURITY_HEADERS_CONTENT_TYPE_OPTIONS: z.string().default('nosniff'),
  SECURITY_HEADERS_STRICT_TRANSPORT_SECURITY: z.string().default('max-age=31536000; includeSubDomains'),
  
  // Database Connection Pool
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(10),
  DB_POOL_ACQUIRE_TIMEOUT: z.coerce.number().default(30000), // 30 seconds
  DB_POOL_IDLE_TIMEOUT: z.coerce.number().default(300000), // 5 minutes
  DB_POOL_MAX_LIFETIME: z.coerce.number().default(1800000), // 30 minutes
  
  // Request Configuration
  REQUEST_TIMEOUT: z.coerce.number().default(30000), // 30 seconds
  REQUEST_MAX_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  REQUEST_MAX_JSON_SIZE: z.coerce.number().default(1 * 1024 * 1024), // 1MB
  
  // Response Configuration
  RESPONSE_COMPRESSION_ENABLED: z.string().default('true'),
  RESPONSE_COMPRESSION_THRESHOLD: z.coerce.number().default(1024), // 1KB
  
  // Upload Configuration
  UPLOAD_ALLOWED_EXTENSIONS: z.string().default('.jpg,.jpeg,.png,.gif,.webp'),
  UPLOAD_MAX_FILENAME_LENGTH: z.coerce.number().default(255),
  UPLOAD_MAX_FILE_NAME_LENGTH: z.coerce.number().default(255),
  UPLOAD_SANITIZE_FILE_NAMES: z.string().default('true'),
  
  // Image Processing Configuration
  IMAGE_AUTO_ORIENTATION: z.string().default('true'),
  IMAGE_AUTO_EXIF: z.string().default('true'),
  IMAGE_STRIP_METADATA: z.string().default('false'),
  IMAGE_ENHANCE_QUALITY: z.string().default('true'),
  
  // CDN Configuration
  CDN_ENABLED: z.string().default('false'),
  CDN_BASE_URL: z.string().optional(),
  CDN_CLOUDFRONT_DOMAIN: z.string().optional(),
  
  // Backup Configuration
  BACKUP_ENABLED: z.string().default('false'),
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'), // Daily at 2 AM
  BACKUP_RETENTION_DAYS: z.coerce.number().default(30),
  BACKUP_COMPRESSION: z.string().default('gzip'),
  BACKUP_ENCRYPTION: z.string().default('true'),
  
  // Monitoring Configuration
  MONITORING_ENABLED: z.string().default('true'),
  MONITORING_METRICS_ENABLED: z.string().default('true'),
  MONITORING_LOGS_ENABLED: z.string().default('true'),
  MONITORING_TRACES_ENABLED: z.string().default('false'),
  
  // Performance Configuration
  PERFORMANCE_ENABLED: z.string().default('true'),
  PERFORMANCE_PROFILING_ENABLED: z.string().default('false'),
  PERFORMANCE_MEMORY_LIMIT: z.coerce.number().default(512), // MB
  PERFORMANCE_CPU_LIMIT: z.coerce.number().default(80), // %
  
  // Security Configuration
  SECURITY_ENABLED: z.string().default('true'),
  SECURITY_RATE_LIMITING_ENABLED: z.string().default('true'),
  SECURITY_CORS_ENABLED: z.string().default('true'),
  SECURITY_HELMET_ENABLED: z.string().default('true'),
  SECURITY_SANITIZATION_ENABLED: z.string().default('true'),
  
  // Development Configuration
  DEBUG: z.string().default('false'),
  VERBOSE_LOGGING: z.string().default('false'),
  DEV_TOOLS_ENABLED: z.string().default('false'),
  
  // Testing Configuration
  TEST_DATABASE_URL: z.string().url().optional(),
  TEST_JEST_TIMEOUT: z.coerce.number().default(30000), // 30 seconds
  TEST_JEST_MAX_WORKERS: z.coerce.number().default(4),
  
  // Production Configuration
  PRODUCTION_DOMAIN: z.string().optional(),
  PROTOCOL: z.enum(['http', 'https']).default('https'),
  FORCE_HTTPS: z.string().default('true'),
  
  // Third-party Services
  RECAPTCHA_SECRET_KEY: z.string().optional(),
  RECAPTCHA_SITE_KEY: z.string().optional(),
  HONEYPOT_ENABLED: z.string().default('true'),
  
  // API Configuration
  API_VERSION: z.string().default('v1'),
  API_PREFIX: z.string().default('/api'),
  API_RATE_LIMIT: z.coerce.number().default(100),
  API_RATE_LIMIT_WINDOW: z.coerce.number().default(900000), // 15 minutes
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Export environment configuration
export default env;

// Export individual environment variables
export const {
  NODE_ENV,
  PORT,
  HOST,
  DATABASE_URL,
  DATABASE_SSL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  OPENAI_API_KEY,
  OPENAI_MODEL,
  OPENAI_MAX_TOKENS,
  ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_CURRENCY,
  FIREBASE_SERVICE_ACCOUNT,
  FIREBASE_SERVER_KEY,
  APNS_CERT_PATH,
  APNS_KEY_ID,
  APNS_TEAM_ID,
  APNS_BUNDLE_ID,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_S3_BUCKET,
  AWS_S3_ENDPOINT,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  SMTP_FROM_NAME,
  REDIS_URL,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  REDIS_DB,
  APPLE_HEALTH_CLIENT_ID,
  APPLE_HEALTH_CLIENT_SECRET,
  GOOGLE_FIT_CLIENT_ID,
  GOOGLE_FIT_CLIENT_SECRET,
  FITBIT_CLIENT_ID,
  FITBIT_CLIENT_SECRET,
  GARMIN_CLIENT_ID,
  GARMIN_CLIENT_SECRET,
  MEDTRONIC_CLIENT_ID,
  MEDTRONIC_CLIENT_SECRET,
  OMRON_CLIENT_ID,
  OMRON_CLIENT_SECRET,
  WITHINGS_CLIENT_ID,
  WITHINGS_CLIENT_SECRET,
  OURA_CLIENT_ID,
  OURA_CLIENT_SECRET,
  GOOGLE_ANALYTICS_ID,
  MIXPANEL_TOKEN,
  SENTRY_DSN,
  BCRYPT_ROUNDS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  LOG_LEVEL,
  LOG_FILE,
  CORS_ORIGIN,
  CORS_CREDENTIALS,
  CACHE_TTL,
  CACHE_MAX_SIZE,
  SESSION_SECRET,
  SESSION_MAX_AGE,
  SESSION_SECURE,
  SHARP_PATH,
  IMAGE_QUALITY,
  IMAGE_MAX_WIDTH,
  IMAGE_MAX_HEIGHT,
  IMAGE_THUMBNAIL_SIZE,
  NOTIFICATION_BATCH_SIZE,
  NOTIFICATION_RETRY_DELAY,
  NOTIFICATION_MAX_RETRIES,
  WEBHOOK_SECRET,
  WEBHOOK_TIMEOUT,
  HEALTH_CHECK_INTERVAL,
  HEALTH_CHECK_TIMEOUT,
  ENABLE_FEATURE_FLAG,
  FEATURE_FLAG_URL,
  RATE_LIMIT_ENABLED,
  RATE_LIMIT_STORE,
  SECURITY_HEADERS_ENABLED,
  SECURITY_HEADERS_CSP,
  SECURITY_HEADERS_XSS_PROTECTION,
  SECURITY_HEADERS_CONTENT_TYPE_OPTIONS,
  SECURITY_HEADERS_STRICT_TRANSPORT_SECURITY,
  DB_POOL_MIN,
  DB_POOL_MAX,
  DB_POOL_ACQUIRE_TIMEOUT,
  DB_POOL_IDLE_TIMEOUT,
  DB_POOL_MAX_LIFETIME,
  REQUEST_TIMEOUT,
  REQUEST_MAX_SIZE,
  REQUEST_MAX_JSON_SIZE,
  RESPONSE_COMPRESSION_ENABLED,
  RESPONSE_COMPRESSION_THRESHOLD,
  UPLOAD_ALLOWED_EXTENSIONS,
  UPLOAD_MAX_FILENAME_LENGTH,
  UPLOAD_MAX_FILE_NAME_LENGTH,
  UPLOAD_SANITIZE_FILE_NAMES,
  IMAGE_AUTO_ORIENTATION,
  IMAGE_AUTO_EXIF,
  IMAGE_STRIP_METADATA,
  IMAGE_ENHANCE_QUALITY,
  CDN_ENABLED,
  CDN_BASE_URL,
  CDN_CLOUDFRONT_DOMAIN,
  BACKUP_ENABLED,
  BACKUP_SCHEDULE,
  BACKUP_RETENTION_DAYS,
  BACKUP_COMPRESSION,
  BACKUP_ENCRYPTION,
  MONITORING_ENABLED,
  MONITORING_METRICS_ENABLED,
  MONITORING_LOGS_ENABLED,
  MONITORING_TRACES_ENABLED,
  PERFORMANCE_ENABLED,
  PERFORMANCE_PROFILING_ENABLED,
  PERFORMANCE_MEMORY_LIMIT,
  PERFORMANCE_CPU_LIMIT,
  SECURITY_ENABLED,
  SECURITY_RATE_LIMITING_ENABLED,
  SECURITY_CORS_ENABLED,
  SECURITY_HELMET_ENABLED,
  SECURITY_SANITIZATION_ENABLED,
  DEBUG,
  VERBOSE_LOGGING,
  DEV_TOOLS_ENABLED,
  TEST_DATABASE_URL,
  TEST_JEST_TIMEOUT,
  TEST_JEST_MAX_WORKERS,
  PRODUCTION_DOMAIN,
  PROTOCOL,
  FORCE_HTTPS,
  RECAPTCHA_SECRET_KEY,
  RECAPTCHA_SITE_KEY,
  HONEYPOT_ENABLED,
  API_VERSION,
  API_PREFIX,
  API_RATE_LIMIT,
  API_RATE_LIMIT_WINDOW,
} = env;

// Export environment-specific configurations
export const isDevelopment = NODE_ENV === 'development';
export const isTest = NODE_ENV === 'test';
export const isProduction = NODE_ENV === 'production';

// Export database configuration
export const databaseConfig = {
  url: DATABASE_URL,
  ssl: DATABASE_SSL === 'true',
  pool: {
    min: DB_POOL_MIN,
    max: DB_POOL_MAX,
    acquireTimeout: DB_POOL_ACQUIRE_TIMEOUT,
    idleTimeout: DB_POOL_IDLE_TIMEOUT,
    maxLifetime: DB_POOL_MAX_LIFETIME,
  },
};

// Export JWT configuration
export const jwtConfig = {
  secret: JWT_SECRET,
  expiresIn: JWT_EXPIRES_IN,
  refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
};

// Export server configuration
export const serverConfig = {
  port: PORT,
  host: HOST,
  env: NODE_ENV,
  cors: {
    origin: CORS_ORIGIN,
    credentials: CORS_CREDENTIALS === 'true',
  },
  security: {
    helmet: SECURITY_HEADERS_ENABLED === 'true',
    rateLimit: {
      enabled: RATE_LIMIT_ENABLED === 'true',
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX_REQUESTS,
      store: RATE_LIMIT_STORE,
    },
    cors: SECURITY_CORS_ENABLED === 'true',
    sanitization: SECURITY_SANITIZATION_ENABLED === 'true',
  },
  performance: {
    enabled: PERFORMANCE_ENABLED === 'true',
    profiling: PERFORMANCE_PROFILING_ENABLED === 'true',
    memoryLimit: PERFORMANCE_MEMORY_LIMIT,
    cpuLimit: PERFORMANCE_CPU_LIMIT,
  },
};

// Export AI service configuration
export const aiConfig = {
  openai: {
    apiKey: OPENAI_API_KEY,
    model: OPENAI_MODEL,
    maxTokens: OPENAI_MAX_TOKENS,
  },
  anthropic: {
    apiKey: ANTHROPIC_API_KEY,
    model: ANTHROPIC_MODEL,
  },
};

// Export payment configuration
export const paymentConfig = {
  stripe: {
    secretKey: STRIPE_SECRET_KEY,
    webhookSecret: STRIPE_WEBHOOK_SECRET,
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    currency: STRIPE_CURRENCY,
  },
};

// Export push notification configuration
export const pushNotificationConfig = {
  firebase: {
    serviceAccount: FIREBASE_SERVICE_ACCOUNT,
    serverKey: FIREBASE_SERVER_KEY,
  },
  apns: {
    certPath: APNS_CERT_PATH,
    keyId: APNS_KEY_ID,
    teamId: APNS_TEAM_ID,
    bundleId: APNS_BUNDLE_ID,
  },
};

// Export image storage configuration
export const imageStorageConfig = {
  aws: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION,
    bucket: AWS_S3_BUCKET,
    endpoint: AWS_S3_ENDPOINT,
  },
  local: {
    uploadDir: UPLOAD_DIR,
    maxFileSize: MAX_FILE_SIZE,
    allowedMimeTypes: ALLOWED_MIME_TYPES.split(','),
  },
  processing: {
    sharpPath: SHARP_PATH,
    quality: IMAGE_QUALITY,
    maxWidth: IMAGE_MAX_WIDTH,
    maxHeight: IMAGE_MAX_HEIGHT,
    thumbnailSize: IMAGE_THUMBNAIL_SIZE,
    autoOrientation: IMAGE_AUTO_ORIENTATION === 'true',
    autoExif: IMAGE_AUTO_EXIF === 'true',
    stripMetadata: IMAGE_STRIP_METADATA === 'true',
    enhanceQuality: IMAGE_ENHANCE_QUALITY === 'true',
  },
};

// Export email configuration
export const emailConfig = {
  smtp: {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER,
    pass: SMTP_PASS,
    from: SMTP_FROM,
    fromName: SMTP_FROM_NAME,
  },
};

// Export cache configuration
export const cacheConfig = {
  enabled: CACHE_TTL > 0,
  ttl: CACHE_TTL,
  maxSize: CACHE_MAX_SIZE,
  redis: {
    url: REDIS_URL,
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    db: REDIS_DB,
  },
};

// Export session configuration
export const sessionConfig = {
  secret: SESSION_SECRET,
  maxAge: SESSION_MAX_AGE,
  secure: SESSION_SECURE === 'true',
};

// Export webhook configuration
export const webhookConfig = {
  secret: WEBHOOK_SECRET,
  timeout: WEBHOOK_TIMEOUT,
};

// Export health check configuration
export const healthCheckConfig = {
  interval: HEALTH_CHECK_INTERVAL,
  timeout: HEALTH_CHECK_TIMEOUT,
};

// Export feature flag configuration
export const featureFlagConfig = {
  enabled: ENABLE_FEATURE_FLAG === 'true',
  url: FEATURE_FLAG_URL,
};

// Export API configuration
export const apiConfig = {
  version: API_VERSION,
  prefix: API_PREFIX,
  rateLimit: {
    enabled: API_RATE_LIMIT > 0,
    limit: API_RATE_LIMIT,
    window: API_RATE_LIMIT_WINDOW,
  },
};

// Export backup configuration
export const backupConfig = {
  enabled: BACKUP_ENABLED === 'true',
  schedule: BACKUP_SCHEDULE,
  retentionDays: BACKUP_RETENTION_DAYS,
  compression: BACKUP_COMPRESSION,
  encryption: BACKUP_ENCRYPTION === 'true',
};

// Export monitoring configuration
export const monitoringConfig = {
  enabled: MONITORING_ENABLED === 'true',
  metrics: MONITORING_METRICS_ENABLED === 'true',
  logs: MONITORING_LOGS_ENABLED === 'true',
  traces: MONITORING_TRACES_ENABLED === 'true',
};

// Export development configuration
export const developmentConfig = {
  debug: DEBUG === 'true',
  verboseLogging: VERBOSE_LOGGING === 'true',
  devToolsEnabled: DEV_TOOLS_ENABLED === 'true',
};

// Export testing configuration
export const testingConfig = {
  databaseUrl: TEST_DATABASE_URL,
  jestTimeout: TEST_JEST_TIMEOUT,
  jestMaxWorkers: TEST_JEST_MAX_WORKERS,
};

// Export production configuration
export const productionConfig = {
  domain: PRODUCTION_DOMAIN,
  protocol: PROTOCOL,
  forceHttps: FORCE_HTTPS === 'true',
};

// Export security configuration
export const securityConfig = {
  bcryptRounds: BCRYPT_ROUNDS,
  recaptcha: {
    secretKey: RECAPTCHA_SECRET_KEY,
    siteKey: RECAPTCHA_SITE_KEY,
    enabled: !!RECAPTCHA_SECRET_KEY,
  },
  honeypot: {
    enabled: HONEYPOT_ENABLED === 'true',
  },
};

// Export logging configuration
export const loggingConfig = {
  level: LOG_LEVEL,
  file: LOG_FILE,
};

// Export request configuration
export const requestConfig = {
  timeout: REQUEST_TIMEOUT,
  maxSize: REQUEST_MAX_SIZE,
  maxJsonSize: REQUEST_MAX_JSON_SIZE,
};

// Export response configuration
export const responseConfig = {
  compression: {
    enabled: RESPONSE_COMPRESSION_ENABLED === 'true',
    threshold: RESPONSE_COMPRESSION_THRESHOLD,
  },
};

// Export upload configuration
export const uploadConfig = {
  allowedExtensions: UPLOAD_ALLOWED_EXTENSIONS.split(','),
  maxFilenameLength: UPLOAD_MAX_FILENAME_LENGTH,
  maxFileNameLength: UPLOAD_MAX_FILE_NAME_LENGTH,
  sanitizeFileNames: UPLOAD_SANITIZE_FILE_NAMES === 'true',
};

// Export CDN configuration
export const cdnConfig = {
  enabled: CDN_ENABLED === 'true',
  baseUrl: CDN_BASE_URL,
  cloudfrontDomain: CDN_CLOUDFRONT_DOMAIN,
};

// Export notification configuration
export const notificationConfig = {
  batchSize: NOTIFICATION_BATCH_SIZE,
  retryDelay: NOTIFICATION_RETRY_DELAY,
  maxRetries: NOTIFICATION_MAX_RETRIES,
};

// Export file processing configuration
export const fileProcessingConfig = {
  sharpPath: SHARP_PATH,
  imageQuality: IMAGE_QUALITY,
  imageMaxWidth: IMAGE_MAX_WIDTH,
  imageMaxHeight: IMAGE_MAX_HEIGHT,
  thumbnailSize: IMAGE_THUMBNAIL_SIZE,
};

// Export healthcare provider configuration
export const healthcareProviderConfig = {
  appleHealth: {
    clientId: APPLE_HEALTH_CLIENT_ID,
    clientSecret: APPLE_HEALTH_CLIENT_SECRET,
  },
  googleFit: {
    clientId: GOOGLE_FIT_CLIENT_ID,
    clientSecret: GOOGLE_FIT_CLIENT_SECRET,
  },
  fitbit: {
    clientId: FITBIT_CLIENT_ID,
    clientSecret: FITBIT_CLIENT_SECRET,
  },
  garmin: {
    clientId: GARMIN_CLIENT_ID,
    clientSecret: GARMIN_CLIENT_SECRET,
  },
  medtronic: {
    clientId: MEDTRONIC_CLIENT_ID,
    clientSecret: MEDTRONIC_CLIENT_SECRET,
  },
  omron: {
    clientId: OMRON_CLIENT_ID,
    clientSecret: OMRON_CLIENT_SECRET,
  },
  withings: {
    clientId: WITHINGS_CLIENT_ID,
    clientSecret: WITHINGS_CLIENT_SECRET,
  },
  oura: {
    clientId: OURA_CLIENT_ID,
    clientSecret: OURA_CLIENT_SECRET,
  },
};

// Export analytics configuration
export const analyticsConfig = {
  googleAnalytics: {
    id: GOOGLE_ANALYTICS_ID,
    enabled: !!GOOGLE_ANALYTICS_ID,
  },
  mixpanel: {
    token: MIXPANEL_TOKEN,
    enabled: !!MIXPANEL_TOKEN,
  },
  sentry: {
    dsn: SENTRY_DSN,
    enabled: !!SENTRY_DSN,
  },
};

// Export third-party services configuration
export const thirdPartyServicesConfig = {
  recaptcha: {
    secretKey: RECAPTCHA_SECRET_KEY,
    siteKey: RECAPTCHA_SITE_KEY,
    enabled: !!RECAPTCHA_SECRET_KEY,
  },
  honeypot: {
    enabled: HONEYPOT_ENABLED === 'true',
  },
};

// Export all configurations in a single object
export const allConfigs = {
  environment: env,
  isDevelopment,
  isTest,
  isProduction,
  database: databaseConfig,
  jwt: jwtConfig,
  server: serverConfig,
  ai: aiConfig,
  payment: paymentConfig,
  pushNotification: pushNotificationConfig,
  imageStorage: imageStorageConfig,
  email: emailConfig,
  cache: cacheConfig,
  session: sessionConfig,
  webhook: webhookConfig,
  healthCheck: healthCheckConfig,
  featureFlag: featureFlagConfig,
  api: apiConfig,
  backup: backupConfig,
  monitoring: monitoringConfig,
  development: developmentConfig,
  testing: testingConfig,
  production: productionConfig,
  security: securityConfig,
  logging: loggingConfig,
  request: requestConfig,
  response: responseConfig,
  upload: uploadConfig,
  cdn: cdnConfig,
  notification: notificationConfig,
  fileProcessing: fileProcessingConfig,
  healthcareProvider: healthcareProviderConfig,
  analytics: analyticsConfig,
  thirdPartyServices: thirdPartyServicesConfig,
};