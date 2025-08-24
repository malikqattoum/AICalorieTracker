# AI Calorie Tracker Production Readiness Guide

## Overview

This guide provides comprehensive instructions for preparing the AI Calorie Tracker application for production deployment. It covers security hardening, performance optimization, monitoring, backup strategies, and production deployment best practices.

## Table of Contents
- [Security Hardening](#security-hardening)
- [Performance Optimization](#performance-optimization)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Backup and Recovery](#backup-and-recovery)
- [Production Deployment](#production-deployment)
- [Scaling and Load Balancing](#scaling-and-load-balancing)
- [Disaster Recovery](#disaster-recovery)
- [Compliance and Legal](#compliance-and-legal)
- [Maintenance and Updates](#maintenance-and-updates)

## Security Hardening

### 1. Environment Security

#### Environment Variables
```bash
# Production environment variables
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
SESSION_SECRET=your-super-secure-session-key
BCRYPT_ROUNDS=12

# Database
DATABASE_URL=postgresql://user:password@prod-db:5432/ai_calorie_tracker
DB_SSL_MODE=require

# AI Services
OPENAI_API_KEY=your-production-openai-key
GOOGLE_AI_API_KEY=your-production-google-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-secure-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
UPLOAD_PATH=/var/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://your-domain.com
CORS_CREDENTIALS=true

# SSL
FORCE_HTTPS=true
SSL_CERT_PATH=/etc/ssl/certs/your-domain.com.crt
SSL_KEY_PATH=/etc/ssl/private/your-domain.com.key
```

#### File Permissions
```bash
# Set proper file permissions
chmod 600 .env
chmod 700 uploads/
chmod 600 logs/
chmod 600 backups/

# Remove development dependencies
npm prune --production

# Remove sensitive files
rm -rf .env.example
rm -rf .git/
rm -rf node_modules/.cache
```

### 2. Application Security

#### Security Middleware
```typescript
// Enhanced security middleware
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://generativelanguage.googleapis.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// HTTP parameter pollution
app.use(hpp());

// XSS protection
app.use(xss());

// NoSQL injection protection
app.use(mongoSanitize());

// Trust proxy for load balancers
app.set('trust proxy', 1);
```

#### Input Validation
```typescript
// Enhanced input validation
import { z } from 'zod';

// User validation schema
const userSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().max(254),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  firstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/),
  lastName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/)
});

// File upload validation
const fileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string().max(255),
  encoding: z.string(),
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().max(parseInt(process.env.MAX_FILE_SIZE || '10485760')),
  destination: z.string(),
  filename: z.string(),
  path: z.string(),
  buffer: z.unknown()
});

// Validate and sanitize input
const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};
```

#### Authentication Security
```typescript
// Enhanced authentication security
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Password hashing with salt rounds
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  return bcrypt.hash(password, saltRounds);
};

// Password verification
const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// JWT token generation
const generateToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'ai-calorie-tracker',
    audience: 'ai-calorie-tracker-users'
  });
};

// JWT token verification
const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: 'ai-calorie-tracker',
      audience: 'ai-calorie-tracker-users'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Session security
const sessionConfig = {
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.COOKIE_DOMAIN
  }
};
```

### 3. Database Security

#### Database Configuration
```sql
-- Production database configuration
-- Enable SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/server.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/server.key';
ALTER SYSTEM SET ssl_ca_file = '/path/to/ca.crt';

-- Set connection limits
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_line_prefix = '%m [%p] %u@%d %r %q%';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Enable connection pooling
ALTER SYSTEM SET max_worker_processes = 8;
ALTER SYSTEM SET max_parallel_workers = 8;
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
```

#### Database User Permissions
```sql
-- Create production database user
CREATE USER app_user WITH PASSWORD 'secure_password_here';
ALTER USER app_user WITH CREATEDB;

-- Grant minimal required permissions
GRANT CONNECT ON DATABASE ai_calorie_tracker TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant table-specific permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON meals TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_analyses TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON health_scores TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON health_predictions TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON health_insights TO app_user;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Restrict dangerous operations
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE ai_calorie_tracker FROM PUBLIC;

-- Create read-only user for reporting
CREATE USER reporting_user WITH PASSWORD 'reporting_password_here';
GRANT CONNECT ON DATABASE ai_calorie_tracker TO reporting_user;
GRANT USAGE ON SCHEMA public TO reporting_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporting_user;
```

#### Database Security Auditing
```sql
-- Enable audit logging
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Configure audit logging
ALTER SYSTEM SET pgaudit.log = 'all';
ALTER SYSTEM SET pgaudit.log_relation = 'on';
ALTER SYSTEM SET pgaudit.log_parameter = 'on';

-- Create audit table
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(50),
  table_name VARCHAR(50),
  record_id INTEGER,
  old_data JSONB,
  new_data JSONB,
  action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_data, ip_address, user_agent)
    VALUES (current_setting('app.current_user_id', true)::integer, 'INSERT', TG_TABLE_NAME, NEW.id, 
            row_to_json(NEW), inet_client_addr(), http_user_agent());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data, ip_address, user_agent)
    VALUES (current_setting('app.current_user_id', true)::integer, 'UPDATE', TG_TABLE_NAME, NEW.id,
            row_to_json(OLD), row_to_json(NEW), inet_client_addr(), http_user_agent());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, ip_address, user_agent)
    VALUES (current_setting('app.current_user_id', true)::integer, 'DELETE', TG_TABLE_NAME, OLD.id,
            row_to_json(OLD), inet_client_addr(), http_user_agent());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for sensitive tables
CREATE TRIGGER users_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER meal_analyses_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON meal_analyses
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## Performance Optimization

### 1. Application Performance

#### Caching Strategy
```typescript
// Redis caching configuration
import Redis from 'ioredis';
import NodeCache from 'node-cache';

// Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: false
});

// Local cache for frequently accessed data
const localCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 600, // 10 minutes
  useClones: false
});

// Cache middleware
const cacheResponse = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.originalUrl || req.url;
    
    // Try local cache first
    const cachedData = localCache.get(key);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Try Redis cache
    redis.get(key).then((cachedData) => {
      if (cachedData) {
        const data = JSON.parse(cachedData);
        localCache.set(key, data);
        return res.json(data);
      }
      
      // Cache the response
      res.originalJson = res.json;
      res.json = (body: any) => {
        const response = {
          data: body,
          cached: false,
          timestamp: new Date().toISOString()
        };
        
        // Cache in Redis
        redis.setex(key, duration, JSON.stringify(response));
        
        // Cache locally
        localCache.set(key, response);
        
        res.originalJson(response);
      };
      
      next();
    }).catch(() => {
      // If Redis fails, continue without caching
      next();
    });
  };
};

// Cache invalidation
const invalidateCache = (pattern: string) => {
  redis.keys(pattern).then((keys) => {
    if (keys.length > 0) {
      redis.del(keys);
    }
  });
  
  // Clear local cache
  localCache.flushAll();
};
```

#### Database Optimization
```typescript
// Database connection pooling
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ai_calorie_tracker',
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // maximum number of connections
  min: 5, // minimum number of connections
  idleTimeoutMillis: 30000, // close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
});

// Query optimization with connection pooling
const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow query: ${duration}ms - ${text}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Database error: ${error.message} - ${text}`);
    throw error;
  }
};

// Index optimization
const optimizeIndexes = async () => {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
    'CREATE INDEX IF NOT EXISTS idx_meal_analyses_user_id ON meal_analyses(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_meal_analyses_timestamp ON meal_analyses(timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_health_scores_user_id ON health_scores(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_health_scores_score_type ON health_scores(score_type)',
    'CREATE INDEX IF NOT EXISTS idx_health_predictions_user_id ON health_predictions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_health_insights_user_id ON health_insights(user_id)'
  ];
  
  for (const index of indexes) {
    await query(index);
  }
};
```

#### Application Performance Monitoring
```typescript
// Performance monitoring
const performance = require('perf_hooks').performance;

// Request timing middleware
const requestTiming = (req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${duration}ms - ${req.method} ${req.url}`);
    }
    
    // Add timing header
    res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
  });
  
  next();
};

// Memory usage monitoring
const memoryUsage = () => {
  const used = process.memoryUsage();
  const format = (bytes: number) => `${Math.round(bytes / 1024 / 1024 * 100) / 100} MB`;
  
  console.log('Memory Usage:');
  console.log(`  RSS: ${format(used.rss)}`);
  console.log(`  Heap Total: ${format(used.heapTotal)}`);
  console.log(`  Heap Used: ${format(used.heapUsed)}`);
  console.log(`  External: ${format(used.external)}`);
};

// Monitor memory usage every 5 minutes
setInterval(memoryUsage, 5 * 60 * 1000);
```

### 2. Database Performance

#### Query Optimization
```sql
-- Optimize common queries
CREATE INDEX IF NOT EXISTS idx_user_meal_timestamp ON meal_analyses(user_id, timestamp DESC);

-- Create composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_health_scores_user_date ON health_scores(user_id, calculation_date DESC);

-- Optimize text search
CREATE INDEX IF NOT EXISTS idx_meal_analyses_food_name ON meal_analyses USING gin(to_tsvector('english', food_name));

-- Create partial indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_active_users ON users(is_active) WHERE is_active = true;

-- Optimize join queries
CREATE INDEX IF NOT EXISTS idx_meal_analyses_user_timestamp ON meal_analyses(user_id, timestamp DESC);
```

#### Database Maintenance
```sql
-- Analyze tables for query optimization
ANALYZE users;
ANALYZE meal_analyses;
ANALYZE health_scores;
ANALYZE health_predictions;
ANALYZE health_insights;

-- Update statistics
VACUUM ANALYZE;

-- Reorganize tables
REINDEX TABLE users;
REINDEX TABLE meal_analyses;
REINDEX TABLE health_scores;

-- Clean up old data
DELETE FROM meal_analyses WHERE timestamp < NOW() - INTERVAL '1 year';
DELETE FROM health_scores WHERE calculation_date < NOW() - INTERVAL '6 months';
DELETE FROM health_insights WHERE created_at < NOW() - INTERVAL '3 months';

-- Archive old data
CREATE TABLE meal_analyses_archive AS
SELECT * FROM meal_analyses WHERE timestamp < NOW() - INTERVAL '1 year';

TRUNCATE meal_analyses WHERE timestamp < NOW() - INTERVAL '1 year';
```

## Monitoring and Alerting

### 1. Application Monitoring

#### Logging Configuration
```typescript
// Structured logging configuration
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.metadata()
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ai-calorie-tracker' },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
      maxSize: '20m'
    }),
    
    // Combined logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m'
    })
  ]
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id
    });
  });
  
  next();
};

// Error logging middleware
const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Application error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id
  });
  
  next(error);
};

export { logger, requestLogger, errorLogger };
```

#### Health Checks
```typescript
// Comprehensive health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      aiServices: await checkAIServices(),
      storage: await checkStorage(),
      memory: checkMemory(),
      disk: checkDisk()
    }
  };
  
  // Determine overall health status
  const unhealthyChecks = Object.entries(healthCheck.checks)
    .filter(([_, status]) => status !== 'healthy');
  
  if (unhealthyChecks.length > 0) {
    healthCheck.status = 'degraded';
    res.status(503);
  } else {
    res.status(200);
  }
  
  res.json(healthCheck);
});

// Individual health check functions
const checkDatabase = async (): Promise<string> => {
  try {
    await pool.query('SELECT 1');
    return 'healthy';
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return 'unhealthy';
  }
};

const checkRedis = async (): Promise<string> => {
  try {
    await redis.ping();
    return 'healthy';
  } catch (error) {
    logger.error('Redis health check failed', { error: error.message });
    return 'unhealthy';
  }
};

const checkAIServices = async (): Promise<string> => {
  try {
    // Test OpenAI connection
    await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'health check' }],
      max_tokens: 1
    });
    return 'healthy';
  } catch (error) {
    logger.error('AI services health check failed', { error: error.message });
    return 'degraded';
  }
};

const checkStorage = async (): Promise<string> => {
  try {
    const fs = require('fs').promises;
    await fs.access(process.env.UPLOAD_PATH || './uploads');
    return 'healthy';
  } catch (error) {
    logger.error('Storage health check failed', { error: error.message });
    return 'unhealthy';
  }
};

const checkMemory = (): string => {
  const used = process.memoryUsage();
  const heapUsed = used.heapUsed / 1024 / 1024; // MB
  const heapTotal = used.heapTotal / 1024 / 1024; // MB
  
  if (heapUsed > 500) {
    return 'critical';
  } else if (heapUsed > 300) {
    return 'warning';
  } else {
    return 'healthy';
  }
};

const checkDisk = (): string => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const stats = fs.statSync('/');
    const totalSpace = stats.blocks * stats.blksize;
    const freeSpace = stats.bfree * stats.blksize;
    const usedSpace = totalSpace - freeSpace;
    const usagePercent = (usedSpace / totalSpace) * 100;
    
    if (usagePercent > 90) {
      return 'critical';
    } else if (usagePercent > 80) {
      return 'warning';
    } else {
      return 'healthy';
    }
  } catch (error) {
    return 'unknown';
  }
};
```

### 2. Alerting System

#### Alert Configuration
```typescript
// Alerting system
const AlertManager = {
  alerts: [] as Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>,
  
  // Add alert
  addAlert: (type: string, severity: 'low' | 'medium' | 'high' | 'critical', message: string) => {
    const alert = {
      id: crypto.randomUUID(),
      type,
      severity,
      message,
      timestamp: new Date(),
      resolved: false
    };
    
    this.alerts.push(alert);
    
    // Send notification
    this.sendNotification(alert);
    
    logger.warn('Alert triggered', alert);
  },
  
  // Resolve alert
  resolveAlert: (id: string) => {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.resolved = true;
      logger.info('Alert resolved', { id, type: alert.type });
    }
  },
  
  // Send notification
  sendNotification: (alert: any) => {
    // Send email notification
    if (alert.severity === 'critical' || alert.severity === 'high') {
      this.sendEmailAlert(alert);
    }
    
    // Send Slack notification
    this.sendSlackAlert(alert);
    
    // Send SMS notification for critical alerts
    if (alert.severity === 'critical') {
      this.sendSMSAlert(alert);
    }
  },
  
  // Send email alert
  sendEmailAlert: (alert: any) => {
    // Implementation using nodemailer or similar
    logger.info('Email alert sent', { alertId: alert.id, type: alert.type });
  },
  
  // Send Slack alert
  sendSlackAlert: (alert: any) => {
    // Implementation using @slack/web-api or similar
    logger.info('Slack alert sent', { alertId: alert.id, type: alert.type });
  },
  
  // Send SMS alert
  sendSMSAlert: (alert: any) => {
    // Implementation using Twilio or similar
    logger.info('SMS alert sent', { alertId: alert.id, type: alert.type });
  },
  
  // Get active alerts
  getActiveAlerts: () => {
    return this.alerts.filter(a => !a.resolved);
  }
};

// Alert middleware
const alertMiddleware = (threshold: number, type: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (duration > threshold) {
        AlertManager.addAlert(type, 'high', `Slow request: ${duration}ms - ${req.method} ${req.url}`);
      }
    });
    
    next();
  };
};

// Usage
app.use(alertMiddleware(5000, 'slow_request')); // Alert for requests taking longer than 5 seconds
```

### 3. Metrics Collection

#### Prometheus Metrics
```typescript
// Prometheus metrics collection
import client from 'prom-client';

// Create registry
const register = new client.Registry();

// Enable default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const databaseQueries = new client.Counter({
  name: 'database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['type', 'table']
});

const aiServiceRequests = new client.Counter({
  name: 'ai_service_requests_total',
  help: 'Total number of AI service requests',
  labelNames: ['service', 'model']
});

const activeUsers = new client.Gauge({
  name: 'active_users_total',
  help: 'Number of active users'
});

const mealAnalyses = new client.Counter({
  name: 'meal_analyses_total',
  help: 'Total number of meal analyses',
  labelNames: ['success']
});

// Apply metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const end = httpRequestDuration.startTimer();
  
  res.on('finish', () => {
    end({ 
      method: req.method, 
      route: req.route?.path || 'unknown',
      status_code: res.statusCode 
    });
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Update metrics
const updateMetrics = async () => {
  // Update active users count
  const activeUsersCount = await pool.query(
    'SELECT COUNT(*) as count FROM users WHERE last_active > NOW() - INTERVAL '5 minutes''
  );
  activeUsers.set(parseInt(activeUsersCount.rows[0].count));
  
  // Update other metrics
  logger.info('Metrics updated');
};

// Update metrics every minute
setInterval(updateMetrics, 60 * 1000);
```

## Backup and Recovery

### 1. Database Backup

#### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

# Configuration
BACKUP_DIR="/var/backups/ai-calorie-tracker"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ai_calorie_tracker"
DB_USER="app_user"
DB_HOST="localhost"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "Starting database backup..."
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  --format=custom \
  --verbose \
  --file="$BACKUP_DIR/db_backup_$DATE.dump"

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_DIR/db_backup_$DATE.dump"

# Upload to cloud storage (optional)
if command -v aws &> /dev/null; then
  echo "Uploading backup to S3..."
  aws s3 cp "$BACKUP_DIR/db_backup_$DATE.dump.gz" "s3://your-backup-bucket/db_backups/db_backup_$DATE.dump.gz"
fi

# Clean old backups
echo "Cleaning old backups..."
find "$BACKUP_DIR" -name "db_backup_*.dump.gz" -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "Backup completed: $BACKUP_DIR/db_backup_$DATE.dump.gz"
```

#### Backup Verification
```bash
#!/bin/bash
# verify-backup.sh

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Verifying backup file: $BACKUP_FILE"

# Check file integrity
gzip -t "$BACKUP_FILE"
if [ $? -ne 0 ]; then
  echo "Backup file is corrupted"
  exit 1
fi

# Extract and verify database structure
TEMP_DIR=$(mktemp -d)
gunzip -c "$BACKUP_FILE" > "$TEMP_DIR/backup.dump"

# Verify backup contains expected tables
pg_restore -l "$TEMP_DIR/backup.dump" | grep -E "(users|meal_analyses|health_scores|health_predictions|health_insights)"
if [ $? -ne 0 ]; then
  echo "Backup does not contain expected tables"
  rm -rf "$TEMP_DIR"
  exit 1
fi

echo "Backup verification successful"
rm -rf "$TEMP_DIR"
```

### 2. File Backup

#### File Backup Script
```bash
#!/bin/bash
# backup-files.sh

# Configuration
BACKUP_DIR="/var/backups/ai-calorie-tracker"
UPLOADS_DIR="/var/uploads"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR/files"

# Backup uploads directory
echo "Backing up uploads directory..."
tar -czf "$BACKUP_DIR/files/uploads_backup_$DATE.tar.gz" -C "$UPLOADS_DIR" .

# Backup configuration files
echo "Backing up configuration files..."
tar -czf "$BACKUP_DIR/files/config_backup_$DATE.tar.gz" \
  -C /etc/nginx/sites-available/ \
  -C /etc/systemd/system/ \
  -C /home/app/ \
  .

# Backup environment files
echo "Backing up environment files..."
tar -czf "$BACKUP_DIR/files/env_backup_$DATE.tar.gz" \
  /home/app/.env \
  /home/app/client/.env \
  /home/app/mobile/.env \
  .

# Clean old backups
echo "Cleaning old file backups..."
find "$BACKUP_DIR/files" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "File backup completed"
```

### 3. Backup Testing

#### Restore Testing Script
```bash
#!/bin/bash
# test-restore.sh

BACKUP_FILE="$1"
RESTORE_DIR="/tmp/restore_test"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

echo "Starting restore test: $BACKUP_FILE"

# Create temporary directory
mkdir -p "$RESTORE_DIR"

# Extract database backup
echo "Extracting database backup..."
gunzip -c "$BACKUP_FILE" > "$RESTORE_DIR/backup.dump"

# Create test database
echo "Creating test database..."
psql -U postgres -c "CREATE DATABASE restore_test;"
psql -U postgres -c "CREATE USER restore_user WITH PASSWORD 'restore_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE restore_test TO restore_user;"

# Restore database
echo "Restoring database..."
pg_restore -U restore_user -d restore_test "$RESTORE_DIR/backup.dump"

# Verify database structure
echo "Verifying database structure..."
psql -U restore_user -d restore_test -c "\dt" | grep -E "(users|meal_analyses|health_scores|health_predictions|health_insights)"

# Run basic queries
echo "Running basic queries..."
psql -U restore_user -d restore_test -c "SELECT COUNT(*) FROM users;"
psql -U restore_user -d restore_test -c "SELECT COUNT(*) FROM meal_analyses;"

# Clean up
echo "Cleaning up..."
psql -U postgres -c "DROP DATABASE restore_test;"
psql -U postgres -c "DROP USER restore_user;"
rm -rf "$RESTORE_DIR"

echo "Restore test completed successfully"
```

## Production Deployment

### 1. Docker Deployment

#### Production Dockerfile
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S app -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=app:nodejs /app/dist ./dist
COPY --from=builder --chown=app:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=app:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs && chown -R app:nodejs /app/uploads /app/logs

# Switch to non-root user
USER app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

#### Docker Compose Production
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://app_user:password@db:5432/ai_calorie_tracker
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-super-secret-jwt-key
      - SESSION_SECRET=your-super-secret-session-key
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ai_calorie_tracker
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: password
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app_user -d ai_calorie_tracker"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass your-redis-password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./uploads:/var/www/uploads
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 2. Systemd Service

#### Systemd Service File
```ini
# /etc/systemd/system/ai-calorie-tracker.service
[Unit]
Description=AI Calorie Tracker Application
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=simple
User=app
Group=app
WorkingDirectory=/home/app/ai-calorie-tracker
Environment=NODE_ENV=production
Environment=PATH=/home/app/ai-calorie-tracker/node_modules/.bin
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/home/app/ai-calorie-tracker/uploads
ReadWritePaths=/home/app/ai-calorie-tracker/logs

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

#### Systemd Timer for Maintenance
```ini
# /etc/systemd/system/ai-calorie-tracker-maintenance.timer
[Unit]
Description=Daily maintenance tasks for AI Calorie Tracker
Requires=ai-calorie-tracker.service

[Timer]
OnCalendar=daily
Persistent=true
Unit=ai-calorie-tracker-maintenance.service

[Install]
WantedBy=timers.target

# /etc/systemd/system/ai-calorie-tracker-maintenance.service
[Unit]
Description=Daily maintenance tasks for AI Calorie Tracker
After=ai-calorie-tracker.service

[Service]
Type=oneshot
User=app
Group=app
ExecStart=/home/app/ai-calorie-tracker/scripts/maintenance.sh
```

### 3. Nginx Configuration

#### Production Nginx Configuration
```nginx
# /etc/nginx/sites-available/ai-calorie-tracker
upstream app {
    server 127.0.0.1:3000;
    # Add load balancing servers if needed
    # server 127.0.0.1:3001;
    # server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL configuration
    ssl_certificate /etc/ssl/certs/your-domain.com.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Rate limiting
    limit_req zone=api burst=20 nodelay;
    limit_req zone=login burst=5 nodelay;
    
    # Static files
    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # File uploads
    location /uploads {
        alias /var/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";
    }
    
    # Health check
    location /health {
        access_log off;
        proxy_pass http://app;
    }
    
    # Metrics
    location /metrics {
        allow 127.0.0.1;
        deny all;
        proxy_pass http://app;
    }
    
    # Security
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Block access to sensitive files
    location ~* \.(env|log|conf)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

## Scaling and Load Balancing

### 1. Horizontal Scaling

#### Load Balancer Configuration
```nginx
# /etc/nginx/sites-available/load-balancer
upstream backend {
    least_conn;
    server 10.0.1.10:3000 weight=3 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 weight=3 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3000 weight=2 max_fails=3 fail_timeout=30s backup;
    
    keepalive 32;
}

server {
    listen 80;
    server_name api.your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    
    # Proxy to backend
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
    }
    
    # Health check
    location /health {
        access_log off;
        proxy_pass http://backend;
    }
}
```

#### Docker Swarm Scaling
```bash
# Initialize Docker Swarm
docker swarm init

# Create overlay network
docker network create -d overlay app-network

# Deploy stack
docker stack deploy -c docker-compose.prod.yml ai-calorie-tracker

# Scale services
docker service scale ai-calorie-tracker_app=5
docker service scale ai-calorie-tracker_db=3
```

### 2. Database Scaling

#### Read Replicas
```sql
-- Create read replica
CREATE DATABASE ai_calorie_tracker_replica WITH TEMPLATE ai_calorie_tracker;

-- Create read-only user
CREATE USER replica_user WITH PASSWORD 'replica_password';
GRANT CONNECT ON DATABASE ai_calorie_tracker_replica TO replica_user;
GRANT USAGE ON SCHEMA public TO replica_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replica_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO replica_user;

-- Configure streaming replication
-- In postgresql.conf on primary:
wal_level = replica
max_wal_senders = 5
max_replication_slots = 5

-- In recovery.conf on replica:
standby_mode = on
primary_conninfo = 'host=primary-db port=5432 user=replica_user password=replica_password'
restore_command = 'cp /archive/%f %p'
archive_cleanup_command = 'pg_archivecleanup /archive %r'
```

#### Connection Pooling
```sql
-- Create connection pool
CREATE EXTENSION IF NOT EXISTS pgpool_adm;

-- Configure PgBouncer for connection pooling
-- Install PgBouncer: apt-get install pgbouncer

-- Configure PgBouncer (pgbouncer.ini)
[databases]
ai_calorie_tracker = host=localhost port=5432 dbname=ai_calorie_tracker

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
log_connections = 1
log_disconnections = 1
check_database_dir = true

-- Create PgBouncer user
CREATE USER pgbouncer WITH PASSWORD 'pgbouncer_password';
GRANT CONNECT ON DATABASE ai_calorie_tracker TO pgbouncer;
GRANT USAGE ON SCHEMA public TO pgbouncer;
```

### 3. Caching Layer

#### Redis Clustering
```bash
# Redis cluster configuration
# Create Redis cluster with 6 nodes (3 master, 3 replica)
redis-cli --cluster create 10.0.1.20:7000 10.0.1.21:7000 10.0.1.22:7000 \
          10.0.1.23:7000 10.0.1.24:7000 10.0.1.25:7000 \
          --cluster-replicas 1 --cluster-yes

# Redis sentinel for high availability
# Configure sentinel.conf
port 26379
sentinel monitor mymaster 10.0.1.20 7000 2
sentinel down-after-milliseconds mymaster 30000
sentinel failover-timeout mymaster 180000
sentinel parallel-syncs mymaster 1

# Start sentinel instances
redis-sentinel /etc/redis/sentinel.conf
```

## Disaster Recovery

### 1. Backup Strategy

#### 3-2-1 Backup Rule
- **3 copies**: Keep 3 copies of your data
- **2 different media**: Store on at least 2 different storage types
- **1 off-site**: Keep at least 1 copy off-site

#### Backup Schedule
```bash
# Daily backups (database + files)
0 2 * * * /home/app/scripts/daily-backup.sh

# Weekly backups (full system)
0 3 * * 0 /home/app/scripts/weekly-backup.sh

# Monthly backups (archival)
0 4 1 * * /home/app/scripts/monthly-backup.sh

# Real-time replication (database)
# Configure streaming replication to standby server
```

### 2. Disaster Recovery Plan

#### Recovery Procedures
```bash
#!/bin/bash
# disaster-recovery.sh

BACKUP_DATE="$1"
BACKUP_TYPE="$2" # db, files, or full

if [ -z "$BACKUP_DATE" ] || [ -z "$BACKUP_TYPE" ]; then
    echo "Usage: $0 <backup-date> <backup-type>"
    exit 1
fi

echo "Starting disaster recovery for $BACKUP_TYPE backup from $BACKUP_DATE"

# Stop application services
echo "Stopping application services..."
systemctl stop ai-calorie-tracker
systemctl stop nginx

# Restore database backup
if [ "$BACKUP_TYPE" = "db" ] || [ "$BACKUP_TYPE" = "full" ]; then
    echo "Restoring database backup..."
    gunzip -c "/var/backups/ai-calorie-tracker/db_backup_${BACKUP_DATE}.dump.gz" > "/tmp/restore_${BACKUP_DATE}.dump"
    
    # Drop and recreate database
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS ai_calorie_tracker;"
    sudo -u postgres psql -c "CREATE DATABASE ai_calorie_tracker;"
    
    # Restore database
    sudo -u postgres pg_restore -d ai_calorie_tracker "/tmp/restore_${BACKUP_DATE}.dump"
    
    # Update database schema if needed
    npm run db:migrate
    
    rm "/tmp/restore_${BACKUP_DATE}.dump"
fi

# Restore file backups
if [ "$BACKUP_TYPE" = "files" ] || [ "$BACKUP_TYPE" = "full" ]; then
    echo "Restoring file backups..."
    tar -xzf "/var/backups/ai-calorie-tracker/files/uploads_backup_${BACKUP_DATE}.tar.gz" -C /
    tar -xzf "/var/backups/ai-calorie-tracker/files/config_backup_${BACKUP_DATE}.tar.gz" -C /
fi

# Start application services
echo "Starting application services..."
systemctl start ai-calorie-tracker
systemctl start nginx

echo "Disaster recovery completed"
```

#### Failover Procedures
```bash
#!/bin/bash
# failover.sh

PRIMARY_DB="$1"
STANDBY_DB="$2"

if [ -z "$PRIMARY_DB" ] || [ -z "$STANDBY_DB" ]; then
    echo "Usage: $0 <primary-db> <standby-db>"
    exit 1
fi

echo "Starting failover from $PRIMARY_DB to $STANDBY_DB"

# Promote standby to primary
ssh $STANDBY_DB "sudo -u postgres pg_ctl promote -D /var/lib/postgresql/data"

# Update application configuration
sed -i "s/DB_HOST=$PRIMARY_DB/DB_HOST=$STANDBY_DB/" /home/app/.env

# Restart application
systemctl restart ai-calorie-tracker

# Verify failover
curl -f http://localhost:3000/health || {
    echo "Failover verification failed"
    exit 1
}

echo "Failover completed successfully"
```

### 3. Testing Disaster Recovery

#### Recovery Testing Script
```bash
#!/bin/bash
# test-dr.sh

echo "Starting disaster recovery test"

# Create test backup
echo "Creating test backup..."
/home/app/scripts/daily-backup.sh

# Simulate disaster
echo "Simulating disaster..."
systemctl stop ai-calorie-tracker
systemctl stop postgresql

# Corrupt database
echo "Corrupting database..."
sudo -u postgres psql -c "DROP TABLE IF EXISTS users;"

# Attempt recovery
echo "Attempting recovery..."
/home/app/scripts/disaster-recovery.sh $(date +%Y%m%d) full

# Verify recovery
echo "Verifying recovery..."
curl -f http://localhost:3000/health || {
    echo "Recovery test failed"
    exit 1
}

# Verify data integrity
USER_COUNT=$(sudo -u postgres psql -d ai_calorie_tracker -t -c "SELECT COUNT(*) FROM users;")
if [ "$USER_COUNT" -eq 0 ]; then
    echo "Data integrity check failed"
    exit 1
fi

echo "Disaster recovery test passed"
```

## Compliance and Legal

### 1. Data Privacy

#### GDPR Compliance
```typescript
// Data privacy implementation
import crypto from 'crypto';

// Data encryption
const encryptData = (data: string): string => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  });
};

// Data decryption
const decryptData = (encryptedData: string): string => {
  const { encrypted, iv, authTag } = JSON.parse(encryptedData);
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Data subject rights implementation
class DataSubjectRights {
  // Right to access
  async getUserData(userId: number): Promise<any> {
    const userData = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    const mealData = await pool.query(
      'SELECT id, food_name, calories, timestamp FROM meal_analyses WHERE user_id = $1',
      [userId]
    );
    
    return {
      user: userData.rows[0],
      meals: mealData.rows
    };
  }
  
  // Right to erasure
  async deleteUserData(userId: number): Promise<void> {
    await pool.query('BEGIN');
    
    try {
      // Anonymize user data
      await pool.query(
        'UPDATE users SET email = NULL, username = NULL WHERE id = $1',
        [userId]
      );
      
      // Delete meal data
      await pool.query(
        'DELETE FROM meal_analyses WHERE user_id = $1',
        [userId]
      );
      
      // Delete health data
      await pool.query(
        'DELETE FROM health_scores WHERE user_id = $1',
        [userId]
      );
      
      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }
  
  // Right to rectification
  async updateUserData(userId: number, updates: any): Promise<void> {
    await pool.query(
      'UPDATE users SET email = $1, username = $2 WHERE id = $3',
      [updates.email, updates.username, userId]
    );
  }
}
```

#### CCPA Compliance
```typescript
// CCPA compliance implementation
class CCPACompliance {
  // Do Not Sell signal
  async processDoNotSellSignal(userId: number): Promise<void> {
    await pool.query(
      'UPDATE users WHERE id = $1 SET marketing_opt_out = true, data_sharing_opt_out = true',
      [userId]
    );
    
    // Delete third-party data
    await pool.query(
      'DELETE FROM third_party_data WHERE user_id = $1',
      [userId]
    );
  }
  
  // Data deletion request
  async processDataDeletionRequest(userId: number): Promise<void> {
    await pool.query('BEGIN');
    
    try {
      // Delete user data
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      
      // Delete related data
      await pool.query('DELETE FROM meal_analyses WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM health_scores WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM health_predictions WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM health_insights WHERE user_id = $1', [userId]);
      
      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }
  
  // Data portability
  async exportUserData(userId: number): Promise<string> {
    const userData = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    const mealData = await pool.query(
      'SELECT id, food_name, calories, timestamp FROM meal_analyses WHERE user_id = $1',
      [userId]
    );
    
    const exportData = {
      user: userData.rows[0],
      meals: mealData.rows,
      export_date: new Date().toISOString(),
      format: 'json'
    };
    
    return JSON.stringify(exportData, null, 2);
  }
}
```

### 2. Security Compliance

#### SOC 2 Compliance
```typescript
// SOC 2 controls implementation
class SOC2Controls {
  // Access control
  async enforceAccessControl(userId: number, resource: string, action: string): Promise<boolean> {
    const userRole = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userRole.rows.length === 0) {
      return false;
    }
    
    // Implement role-based access control
    const permissions = await pool.query(
      'SELECT permission FROM role_permissions WHERE role = $1 AND resource = $2',
      [userRole.rows[0].role, resource]
    );
    
    return permissions.rows.some(p => p.permission === action);
  }
  
  // Audit logging
  async logAuditEvent(userId: number, action: string, resource: string, details: any): Promise<void> {
    await pool.query(
      'INSERT INTO audit_log (user_id, action, resource, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, action, resource, JSON.stringify(details), '127.0.0.1', 'system']
    );
  },
  
  // Change management
  async logConfigurationChange(userId: number, change: string, oldValue: string, newValue: string): Promise<void> {
    await pool.query(
      'INSERT INTO configuration_changes (user_id, change, old_value, new_value, changed_at) VALUES ($1, $2, $3, $4, $5)',
      [userId, change, oldValue, newValue, new Date()]
    );
  }
};
```

## Maintenance and Updates

### 1. Automated Maintenance

#### Maintenance Scripts
```bash
#!/bin/bash
# maintenance.sh

echo "Starting daily maintenance tasks"

# Clean up old sessions
echo "Cleaning up old sessions..."
find /var/lib/php/sessions -type f -mtime +7 -delete

# Clean up old logs
echo "Cleaning up old logs..."
find /var/log/nginx -name "*.log.*" -mtime +30 -delete

# Optimize database
echo "Optimizing database..."
sudo -u postgres psql -d ai_calorie_tracker -c "VACUUM ANALYZE;"
sudo -u postgres psql -d ai_calorie_tracker -c "REINDEX TABLE users;"

# Update SSL certificates
echo "Checking SSL certificates..."
if [ -f "/etc/letsencrypt/live/your-domain.com/cert.pem" ]; then
    openssl x509 -enddate -noout -in "/etc/letsencrypt/live/your-domain.com/cert.pem" | cut -d= -f2 | xargs -I {} date -d {} +%s > /tmp/expiry_date
    expiry_date=$(cat /tmp/expiry_date)
    current_date=$(date +%s)
    
    if [ $expiry_date -lt $((current_date + 7 * 24 * 60 * 60)) ]; then
        echo "SSL certificate expires soon, renewing..."
        certbot renew --quiet
       
### 2. Automated Maintenance

#### Maintenance Scripts
```bash
#!/bin/bash
# maintenance.sh

echo "Starting daily maintenance tasks"

# Clean up old sessions
echo "Cleaning up old sessions..."
find /var/lib/php/sessions -type f -mtime +7 -delete

# Clean up old logs
echo "Cleaning up old logs..."
find /var/log/nginx -name "*.log.*" -mtime +30 -delete

# Optimize database
echo "Optimizing database..."
sudo -u postgres psql -d ai_calorie_tracker -c "VACUUM ANALYZE;"
sudo -u postgres psql -d ai_calorie_tracker -c "REINDEX TABLE users;"

# Update SSL certificates
echo "Checking SSL certificates..."
if [ -f "/etc/letsencrypt/live/your-domain.com/cert.pem" ]; then
    openssl x509 -enddate -noout -in "/etc/letsencrypt/live/your-domain.com/cert.pem" | cut -d= -f2 | xargs -I {} date -d {} +%s > /tmp/expiry_date
    expiry_date=$(cat /tmp/expiry_date)
    current_date=$(date +%s)
    
    if [ $expiry_date -lt $((current_date + 7 * 24 * 60 * 60)) ]; then
        echo "SSL certificate expires soon, renewing..."
        certbot renew --quiet
    fi
fi

# Check for system updates
echo "Checking for system updates..."
if command -v apt-get &> /dev/null; then
    apt-get update -qq
    apt-get upgrade -qq -y
elif command -v yum &> /dev/null; then
    yum check-update -q
    yum update -q -y
fi

# Restart services if needed
echo "Restarting services if needed..."
systemctl reload nginx
systemctl restart ai-calorie-tracker --quiet

echo "Daily maintenance completed"
```

#### Update Procedures
```bash
#!/bin/bash
# update-prod.sh

echo "Starting production update"

# Create backup before update
echo "Creating pre-update backup..."
/home/app/scripts/daily-backup.sh

# Stop application
echo "Stopping application..."
systemctl stop ai-calorie-tracker

# Pull latest code
echo "Pulling latest code..."
cd /home/app/ai-calorie-tracker
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Build application
echo "Building application..."
npm run build

# Run database migrations
echo "Running database migrations..."
npm run db:migrate

# Start application
echo "Starting application..."
systemctl start ai-calorie-tracker

# Verify application is running
echo "Verifying application..."
sleep 10
curl -f http://localhost:3000/health || {
    echo "Application health check failed"
    exit 1
}

echo "Production update completed successfully"
```

### 3. Monitoring and Alerting Setup

#### Monitoring Dashboard
```typescript
// Monitoring dashboard setup
const setupMonitoring = () => {
  // Application metrics
  const appMetrics = {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    activeConnections: pool.totalCount,
    redisConnections: redis.serverInfo.connected_clients
  };
  
  // Database metrics
  const dbMetrics = {
    activeConnections: pool.totalCount,
    waitingClients: pool.waitingCount,
    totalRequests: pool.totalRequestCount,
    averageQueryTime: 0 // Calculate from query logs
  };
  
  // System metrics
  const systemMetrics = {
    diskUsage: getDiskUsage(),
    cpuLoad: getCpuLoad(),
    memoryLoad: getMemoryLoad(),
    networkStats: getNetworkStats()
  };
  
  return {
    app: appMetrics,
    database: dbMetrics,
    system: systemMetrics,
    timestamp: new Date().toISOString()
  };
};

// Alert thresholds
const alertThresholds = {
  memoryUsage: 0.8, // 80%
  cpuUsage: 0.9, // 90%
  diskUsage: 0.9, // 90%
  databaseConnections: 0.9, // 90%
  responseTime: 5000, // 5 seconds
  errorRate: 0.05 // 5%
};

// Monitor and alert
const monitorSystem = () => {
  const metrics = setupMonitoring();
  
  // Check thresholds
  Object.entries(alertThresholds).forEach(([metric, threshold]) => {
    const currentValue = getMetricValue(metrics, metric);
    if (currentValue > threshold) {
      AlertManager.addAlert('system', 'high', `${metric} exceeded threshold: ${currentValue} > ${threshold}`);
    }
  });
  
  return metrics;
};

// Run monitoring every minute
setInterval(monitorSystem, 60 * 1000);
```

### 4. Performance Tuning

#### Application Performance Tuning
```typescript
// Performance tuning configuration
const performanceConfig = {
  // Node.js optimization
  nodeOptions: {
    maxOldSpaceSize: 4096, // 4GB heap
    optimizeForSize: false,
    enableSingletons: false
  },
  
  // Database optimization
  database: {
    connectionPool: {
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 2000
    },
    queryTimeout: 30000,
    slowQueryThreshold: 1000
  },
  
  // Redis optimization
  redis: {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
    enableReadyCheck: false
  },
  
  // File upload optimization
  upload: {
    maxFileSize: 10485760, // 10MB
    maxFiles: 5,
    fileSizeThreshold: 1024 * 1024 // 1MB
  }
};

// Apply performance optimizations
const applyPerformanceOptimizations = () => {
  // Node.js optimizations
  if (performanceConfig.nodeOptions.maxOldSpaceSize) {
    process.memoryUsage().heapTotal = performanceConfig.nodeOptions.maxOldSpaceSize * 1024 * 1024;
  }
  
  // Database optimizations
  pool.on('error', (err) => {
    console.error('Database connection error:', err);
  });
  
  // Redis optimizations
  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
  
  // File upload optimizations
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
};
```

## Conclusion

This production readiness guide provides comprehensive instructions for deploying and maintaining the AI Calorie Tracker application in a production environment. By following these guidelines, you can ensure:

- **Security**: Proper hardening against common vulnerabilities
- **Performance**: Optimized application and database performance
- **Reliability**: Robust monitoring and alerting systems
- **Scalability**: Horizontal scaling capabilities
- **Disaster Recovery**: Comprehensive backup and recovery procedures
- **Compliance**: GDPR and CCPA compliance requirements
- **Maintenance**: Automated maintenance and update procedures

Remember to regularly review and update these procedures as your application evolves and new security best practices emerge.