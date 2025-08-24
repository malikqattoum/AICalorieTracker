# 🏗️ AI Calorie Tracker - Architectural Optimization Plan

## Executive Summary

This document outlines a comprehensive optimization strategy for the AI Calorie Tracker application, focusing on database performance, error handling, security enhancements, and testing framework implementation. The plan addresses current technical debt and provides a roadmap for scalable, maintainable, and high-performance architecture.

## Current System Architecture

### Technology Stack
- **Frontend**: React Native (Expo), TypeScript, React Navigation
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL with comprehensive schema
- **AI Services**: OpenAI GPT-4, Google Gemini Vision
- **Authentication**: JWT with secure storage
- **Monitoring**: Custom error tracking service

### Key Components
1. **Mobile App**: Food capture, nutrition tracking, user dashboard
2. **API Layer**: RESTful endpoints with comprehensive error handling
3. **AI Integration**: Multi-provider food analysis and meal planning
4. **Database**: User management, meal tracking, analytics
5. **Security**: Authentication, authorization, data encryption

## Phase 1: Database Optimization Strategies

### 1.1 Performance-Critical Indexes

```sql
-- Add composite indexes for meal analysis queries
CREATE INDEX idx_meal_analyses_user_timestamp ON meal_analyses(user_id, timestamp DESC);
CREATE INDEX idx_meal_analyses_date_range ON meal_analyses(date_range_start, date_range_end);
CREATE INDEX idx_meal_analyses_nutrition ON meal_analyses(calories, protein, carbs, fat);

-- Optimize meal queries
CREATE INDEX idx_meals_user_date ON meals(user_id, date);
CREATE INDEX idx_meals_category ON meals(category);
CREATE INDEX idx_meals_nutrition ON meals(calories, protein, carbs, fat);

-- User-related optimizations
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_status ON users(status);

-- Analytics and reporting indexes
CREATE INDEX idx_weekly_stats_user_week ON weekly_stats(user_id, week_starting);
CREATE INDEX idx_nutrition_goals_user ON nutrition_goals(user_id);
CREATE INDEX idx_planned_meals_user_date ON planned_meals(user_id, date);
```

### 1.2 Query Optimization

#### Current Problem Queries
```sql
-- Slow: Complex meal analysis with multiple joins
SELECT m.*, na.calories, na.protein, na.carbs, na.fat
FROM meals m
LEFT JOIN meal_analyses na ON m.id = na.meal_id
WHERE m.user_id = ? AND m.date BETWEEN ? AND ?
ORDER BY m.date DESC;

-- Optimized version with proper indexing
SELECT m.*, na.calories, na.protein, na.carbs, na.fat
FROM meals m
LEFT JOIN meal_analyses na ON m.id = na.meal_id
WHERE m.user_id = ? AND m.date BETWEEN ? AND ?
ORDER BY m.date DESC
LIMIT 100;
```

#### Materialized Views for Analytics
```sql
-- Create materialized views for frequent analytics queries
CREATE TABLE user_nutrition_summary (
    user_id INT,
    date DATE,
    total_calories DECIMAL(10,2),
    total_protein DECIMAL(10,2),
    total_carbs DECIMAL(10,2),
    total_fat DECIMAL(10,2),
    meal_count INT,
    PRIMARY KEY (user_id, date)
);

-- Create view for weekly nutrition trends
CREATE VIEW weekly_nutrition_trends AS
SELECT 
    user_id,
    WEEK(date) as week_number,
    YEAR(date) as year,
    AVG(calories) as avg_calories,
    AVG(protein) as avg_protein,
    AVG(carbs) as avg_carbs,
    AVG(fat) as avg_fat,
    COUNT(*) as meal_count
FROM meal_analyses
GROUP BY user_id, WEEK(date), YEAR(date);
```

### 1.3 Database Connection Pooling

```typescript
// Enhanced database configuration with connection pooling
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_calorie_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  dateStrings: false,
  timezone: '+03:00',
  supportBigNumbers: true,
  bigNumberStrings: false,
});

export const db = pool;
```

### 1.4 Query Performance Monitoring

```typescript
// Query performance monitoring middleware
export class QueryMonitor {
  private static queryTimes: Map<string, number[]> = new Map();
  
  static async executeQuery(query: string, params: any[]): Promise<any> {
    const startTime = Date.now();
    
    try {
      const [results] = await db.execute(query, params);
      const duration = Date.now() - startTime;
      
      // Log slow queries (> 100ms)
      if (duration > 100) {
        console.warn(`Slow query (${duration}ms): ${query}`, params);
      }
      
      // Track query performance
      if (!this.queryTimes.has(query)) {
        this.queryTimes.set(query, []);
      }
      this.queryTimes.get(query)!.push(duration);
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query failed after ${duration}ms: ${query}`, params);
      throw error;
    }
  }
  
  static getPerformanceStats(): { query: string; avgTime: number; count: number }[] {
    const stats: { query: string; avgTime: number; count: number }[] = [];
    
    this.queryTimes.forEach((times, query) => {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      stats.push({
        query: query.substring(0, 100) + '...',
        avgTime: Math.round(avgTime),
        count: times.length
      });
    });
    
    return stats.sort((a, b) => b.avgTime - a.avgTime);
  }
}
```

## Phase 2: Enhanced Error Handling and Monitoring

### 2.1 Centralized Error Handling Middleware

```typescript
// Enhanced error handling with categorization and recovery
export class ErrorHandler {
  static handle(error: any, req: Request, res: Response, next: NextFunction): void {
    const errorContext = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode
      }
    };

    // Error categorization
    const categorizedError = this.categorizeError(error);
    
    // Log error with context
    console.error(`[${categorizedError.severity.toUpperCase()}] ${categorizedError.category}:`, {
      ...errorContext,
      metadata: error.metadata
    });

    // Error recovery strategies
    const recoveryResponse = this.getRecoveryStrategy(categorizedError);
    
    // Send appropriate response
    res.status(categorizedError.statusCode).json({
      success: false,
      error: {
        code: categorizedError.code,
        message: categorizedError.userMessage,
        severity: categorizedError.severity,
        category: categorizedError.category,
        recovery: recoveryResponse,
        timestamp: errorContext.timestamp
      },
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        debug: errorContext 
      })
    });
  }

  private static categorizeError(error: any): CategorizedError {
    const errorMap: Record<string, CategorizedError> = {
      'ValidationError': {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        severity: 'medium',
        category: 'validation',
        userMessage: 'Invalid input data',
        recovery: 'Please check your input and try again'
      },
      'UnauthorizedError': {
        code: 'UNAUTHORIZED',
        statusCode: 401,
        severity: 'high',
        category: 'auth',
        userMessage: 'Authentication required',
        recovery: 'Please log in again'
      },
      'ForbiddenError': {
        code: 'FORBIDDEN',
        statusCode: 403,
        severity: 'high',
        category: 'auth',
        userMessage: 'Access denied',
        recovery: 'You do not have permission to access this resource'
      },
      'NotFoundError': {
        code: 'NOT_FOUND',
        statusCode: 404,
        severity: 'medium',
        category: 'api',
        userMessage: 'Resource not found',
        recovery: 'The requested resource does not exist'
      },
      'DatabaseError': {
        code: 'DATABASE_ERROR',
        statusCode: 503,
        severity: 'critical',
        category: 'database',
        userMessage: 'Service temporarily unavailable',
        recovery: 'Please try again later'
      },
      'AIServiceError': {
        code: 'AI_SERVICE_ERROR',
        statusCode: 502,
        severity: 'high',
        category: 'ai',
        userMessage: 'Analysis service unavailable',
        recovery: 'Please try again in a few moments'
      }
    };

    // Match error by name or message
    for (const [key, categorized] of Object.entries(errorMap)) {
      if (error.name?.includes(key) || error.message?.includes(key)) {
        return categorized;
      }
    }

    // Default error
    return {
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      severity: 'critical',
      category: 'system',
      userMessage: 'Internal server error',
      recovery: 'Our team has been notified. Please try again later'
    };
  }

  private static getRecoveryStrategy(error: CategorizedError): string {
    const recoveryStrategies: Record<string, string> = {
      'validation': 'Please validate your input and resubmit',
      'auth': 'Please check your credentials and try again',
      'api': 'Please refresh the page and try again',
      'database': 'Please try again in a few moments',
      'ai': 'The analysis service may be busy. Please try again',
      'system': 'Our team has been notified. Please try again later'
    };

    return recoveryStrategies[error.category] || error.recovery;
  }
}

interface CategorizedError {
  code: string;
  statusCode: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  userMessage: string;
  recovery: string;
}
```

### 2.2 Comprehensive Logging System

```typescript
// Enhanced logging system with structured logging
export class Logger {
  private static logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'ai-calorie-tracker' },
    transports: [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
      new winston.transports.Console({
        format: winston.format.simple(),
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
      })
    ]
  });

  static info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  static warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  static error(message: string, error?: any, meta?: any): void {
    this.logger.error(message, { error: error?.stack || error, ...meta });
  }

  static debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  static performance(operation: string, duration: number, meta?: any): void {
    this.logger.info(`Performance: ${operation} completed in ${duration}ms`, {
      operation,
      duration,
      ...meta
    });
  }
}
```

### 2.3 Real-time Error Monitoring

```typescript
// Real-time error monitoring with WebSocket integration
export class ErrorMonitor {
  private static clients: Set<any> = new Set();
  private static errorQueue: any[] = [];
  private static isProcessing = false;

  static addClient(client: any): void {
    this.clients.add(client);
  }

  static removeClient(client: any): void {
    this.clients.delete(client);
  }

  static async trackError(error: any, context?: any): Promise<void> {
    const errorEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      severity: this.categorizeSeverity(error),
      category: this.categorizeCategory(error),
      message: error.message,
      stack: error.stack,
      context,
      metadata: {
        userAgent: context?.userAgent,
        userId: context?.userId,
        endpoint: context?.endpoint
      }
    };

    this.errorQueue.push(errorEvent);

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processErrorQueue();
    }
  }

  private static async processErrorQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.errorQueue.length > 0) {
      const errorEvent = this.errorQueue.shift();
      
      // Broadcast to connected clients
      this.broadcastError(errorEvent);

      // Send to external monitoring service (Sentry, etc.)
      await this.sendToMonitoringService(errorEvent);

      // Throttle to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  private static broadcastError(errorEvent: any): void {
    const message = JSON.stringify({
      type: 'error',
      data: errorEvent
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private static async sendToMonitoringService(errorEvent: any): Promise<void> {
    // Integration with Sentry, Datadog, or similar service
    try {
      // await sentry.captureException(errorEvent);
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }

  private static categorizeSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    if (error.statusCode >= 500) return 'critical';
    if (error.statusCode >= 400) return 'high';
    if (error.statusCode >= 300) return 'medium';
    return 'low';
  }

  private static categorizeCategory(error: any): string {
    if (error.name?.includes('Auth')) return 'authentication';
    if (error.name?.includes('Validation')) return 'validation';
    if (error.name?.includes('Database')) return 'database';
    if (error.name?.includes('AI')) return 'ai-service';
    return 'system';
  }
}
```

## Phase 3: Security Improvements

### 3.1 Enhanced JWT Authentication

```typescript
// Enhanced JWT with refresh token mechanism
export class AuthService {
  private static refreshTokens: Map<string, { token: string; expiresAt: Date }> = new Map();
  private static readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  static generateTokens(payload: any): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '15m'
    });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY);

    this.refreshTokens.set(refreshToken, { token: refreshToken, expiresAt });

    return { accessToken, refreshToken };
  }

  static refreshAccessToken(refreshToken: string): { accessToken: string } | null {
    const storedToken = this.refreshTokens.get(refreshToken);
    
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return null;
    }

    const payload = jwt.decode(refreshToken) as any;
    const newAccessToken = jwt.sign(
      { userId: payload.userId, email: payload.email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    return { accessToken: newAccessToken };
  }

  static revokeRefreshToken(refreshToken: string): void {
    this.refreshTokens.delete(refreshToken);
  }

  static cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.expiresAt < now) {
        this.refreshTokens.delete(token);
      }
    }
  }
}
```

### 3.2 Advanced Rate Limiting

```typescript
// Advanced rate limiting with Redis integration
export class RateLimiter {
  private static redis: any;

  static async initialize(): Promise<void> {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await this.redis.connect();
  }

  static async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const windowKey = `rate_limit:${key}:${Math.floor(now / windowMs)}`;

    try {
      const current = await this.redis.get(windowKey);
      const count = current ? parseInt(current) : 0;

      if (count >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: windowStart + windowMs
        };
      }

      await this.redis.incr(windowKey);
      await this.redis.expire(windowKey, Math.ceil(windowMs / 1000));

      return {
        allowed: true,
        remaining: limit - count - 1,
        resetTime: windowStart + windowMs
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: true, remaining: limit, resetTime: now + windowMs };
    }
  }

  static async trackApiUsage(endpoint: string, userId: string, duration: number): Promise<void> {
    const key = `api_usage:${endpoint}:${userId}`;
    const now = Date.now();

    try {
      await this.redis.zAdd(key, [
        { score: now, value: JSON.stringify({ timestamp: now, duration }) }
      ]);
      await this.redis.expire(key, 24 * 60 * 60); // 24 hours
    } catch (error) {
      console.error('Failed to track API usage:', error);
    }
  }
}
```

### 3.3 Input Validation and Sanitization

```typescript
// Comprehensive input validation and sanitization
export class InputValidator {
  private static readonly PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    username: /^[a-zA-Z0-9_]{3,20}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    foodName: /^[a-zA-Z0-9\s\-_',.()]{2,100}$/,
    calories: /^\d+(\.\d{1,2})?$/,
    protein: /^\d+(\.\d{1,2})?$/,
    carbs: /^\d+(\.\d{1,2})?$/,
    fat: /^\d+(\.\d{1,2})?$/
  };

  static validateEmail(email: string): boolean {
    return this.PATTERNS.email.test(email);
  }

  static validateUsername(username: string): boolean {
    return this.PATTERNS.username.test(username);
  }

  static validatePassword(password: string): boolean {
    return this.PATTERNS.password.test(password);
  }

  static validateFoodInput(foodData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!foodData.name || !this.PATTERNS.foodName.test(foodData.name)) {
      errors.push('Invalid food name');
    }

    if (foodData.calories && !this.PATTERNS.calories.test(foodData.calories.toString())) {
      errors.push('Invalid calories value');
    }

    if (foodData.protein && !this.PATTERNS.protein.test(foodData.protein.toString())) {
      errors.push('Invalid protein value');
    }

    if (foodData.carbs && !this.PATTERNS.carbs.test(foodData.carbs.toString())) {
      errors.push('Invalid carbs value');
    }

    if (foodData.fat && !this.PATTERNS.fat.test(foodData.fat.toString())) {
      errors.push('Invalid fat value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }
}
```

## Phase 4: Performance Optimization

### 4.1 Redis Caching Layer

```typescript
// Comprehensive Redis caching service
export class CacheService {
  private static redis: any;

  static async initialize(): Promise<void> {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await this.redis.connect();
  }

  static async get(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get failed:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), { EX: ttl });
    } catch (error) {
      console.error('Cache set failed:', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete failed:', error);
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }
  }

  // Cache-specific methods for different data types
  static async getUserCache(userId: string): Promise<any | null> {
    return this.get(`user:${userId}`);
  }

  static async setUserCache(userId: string, userData: any, ttl: number = 1800): Promise<void> {
    await this.set(`user:${userId}`, userData, ttl);
  }

  static async getMealCache(mealId: string): Promise<any | null> {
    return this.get(`meal:${mealId}`);
  }

  static async setMealCache(mealId: string, mealData: any, ttl: number = 7200): Promise<void> {
    await this.set(`meal:${mealId}`, mealData, ttl);
  }

  static async getNutritionCache(foodName: string): Promise<any | null> {
    return this.get(`nutrition:${foodName}`);
  }

  static async setNutritionCache(foodName: string, nutritionData: any, ttl: number = 86400): Promise<void> {
    await this.set(`nutrition:${foodName}`, nutritionData, ttl);
  }

  static async getAICache(imageHash: string): Promise<any | null> {
    return this.get(`ai_analysis:${imageHash}`);
  }

  static async setAICache(imageHash: string, analysisData: any, ttl: number = 3600): Promise<void> {
    await this.set(`ai_analysis:${imageHash}`, analysisData, ttl);
  }
}
```

### 4.2 AI API Optimization

```typescript
// Optimized AI service with caching and rate limiting
export class OptimizedAIService {
  private static requestQueue: Map<string, Promise<any>> = new Map();
  private static rateLimiter: Map<string, { count: number; resetTime: number }> = new Map();

  static async analyzeWithCache(
    imageData: string,
    provider: 'openai' | 'gemini',
    useCache: boolean = true
  ): Promise<any> {
    // Generate cache key
    const imageHash = crypto.createHash('sha256').update(imageData).digest('hex');
    const cacheKey = `ai_analysis:${provider}:${imageHash}`;

    // Check cache first
    if (useCache) {
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Check rate limiting
    const rateLimitKey = `ai_rate:${provider}:${Date.now() / 60000}`; // per minute
    const rateLimit = await this.checkRateLimit(rateLimitKey, 10, 60000); // 10 requests per minute
    
    if (!rateLimit.allowed) {
      throw new Error('AI service rate limit exceeded');
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    // Create and store the promise
    const promise = this.performAnalysis(imageData, provider, cacheKey);
    this.requestQueue.set(cacheKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  private static async performAnalysis(
    imageData: string,
    provider: 'openai' | 'gemini',
    cacheKey: string
  ): Promise<any> {
    const startTime = Date.now();

    try {
      let result;
      if (provider === 'openai') {
        result = await analyzeWithOpenAI(imageData);
      } else {
        result = await analyzeWithGemini(imageData);
      }

      // Cache the result
      await CacheService.set(cacheKey, result, 3600); // 1 hour cache

      // Log performance
      const duration = Date.now() - startTime;
      Logger.performance(`AI analysis (${provider})`, duration, { provider });

      return result;
    } catch (error) {
      Logger.error(`AI analysis failed (${provider})`, error);
      throw error;
    }
  }

  private static async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const rateLimit = this.rateLimiter.get(key);

    if (rateLimit && rateLimit.resetTime > now) {
      if (rateLimit.count >= limit) {
        return { allowed: false, remaining: 0 };
      }
      rateLimit.count++;
      return { allowed: true, remaining: limit - rateLimit.count };
    }

    // Reset rate limit
    this.rateLimiter.set(key, { count: 1, resetTime: windowStart + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
}
```

### 4.3 CDN and Static Asset Optimization

```typescript
// CDN integration and static asset optimization
export class CDNService {
  private static cdnUrl = process.env.CDN_URL || 'https://cdn.example.com';

  static getAssetUrl(path: string): string {
    return `${this.cdnUrl}/${path}`;
  }

  static optimizeImage(imageUrl: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}): string {
    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);

    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}${params.toString()}`;
  }

  static getOptimizedUserAvatar(userId: string, size: number = 100): string {
    const avatarPath = `avatars/${userId}`;
    return this.optimizeImage(this.getAssetUrl(avatarPath), {
      width: size,
      height: size,
      quality: 80,
      format: 'webp'
    });
  }

  static getOptimizedFoodImage(imageId: string, size: number = 300): string {
    const imagePath = `food-images/${imageId}`;
    return this.optimizeImage(this.getAssetUrl(imagePath), {
      width: size,
      height: size,
      quality: 85,
      format: 'webp'
    });
  }
}
```

## Phase 5: Testing Framework

### 5.1 Unit Testing Setup

```typescript
// Comprehensive testing configuration
export class TestConfig {
  static setup(): void {
    // Mock external dependencies
    jest.mock('redis', () => ({
      createClient: jest.fn(() => ({
        connect: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        keys: jest.fn(),
        on: jest.fn()
      }))
    }));

    jest.mock('mysql2/promise', () => ({
      createPool: jest.fn(() => ({
        execute: jest.fn(),
        getConnection: jest.fn()
      }))
    }));

    // Mock AI services
    jest.mock('../services/aiService', () => ({
      analyzeWithOpenAI: jest.fn(),
      analyzeWithGemini: jest.fn()
    }));

    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.DB_HOST = 'localhost';
    process.env.DB_USER = 'test-user';
    process.env.DB_PASSWORD = 'test-password';
    process.env.DB_NAME = 'test_ai_calorie_tracker';
  }

  static cleanup(): void {
    // Clean up mocks after each test
    jest.clearAllMocks();
  }
}
```

### 5.2 Unit Test Examples

```typescript
// Example unit tests for services
describe('UserService', () => {
  let userService: UserService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execute: jest.fn()
    };
    userService = new UserService(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user data when user exists', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      mockDb.execute.mockResolvedValue([[mockUser]]);

      const result = await userService.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(mockDb.execute).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [1]
      );
    });

    it('should return null when user does not exist', async () => {
      mockDb.execute.mockResolvedValue([[]]);

      const result = await userService.getUserById(999);

      expect(result).toBeNull();
    });
  });
});

describe('MealService', () => {
  let mealService: MealService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execute: jest.fn()
    };
    mealService = new MealService(mockDb);
  });

  describe('createMeal', () => {
    it('should create a new meal successfully', async () => {
      const mealData = {
        userId: 1,
        name: 'Test Meal',
        calories: 500,
        protein: 25,
        carbs: 50,
        fat: 15
      };

      const mockResult = { insertId: 1 };
      mockDb.execute.mockResolvedValue([mockResult]);

      const result = await mealService.createMeal(mealData);

      expect(result).toEqual({ id: 1, ...mealData });
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO meals'),
        [mealData.userId, mealData.name, mealData.calories, mealData.protein, mealData.carbs, mealData.fat]
      );
    });

    it('should throw error when required fields are missing', async () => {
      const invalidMealData = {
        userId: 1,
        name: 'Test Meal'
        // Missing required fields
      };

      await expect(mealService.createMeal(invalidMealData)).rejects.toThrow('Invalid meal data');
    });
  });
});
```

### 5.3 Integration Testing

```typescript
// Integration tests for API endpoints
describe('API Integration Tests', () => {
  let app: Express;
  let testServer: any;

  beforeAll(async () => {
    TestConfig.setup();
    app = createTestApp();
    testServer = app.listen(0);
  });

  afterAll(async () => {
    await testServer.close();
    TestConfig.cleanup();
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate valid user credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
      };

      const response = await request(testServer)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', loginData.email);
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await request(testServer)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
    });
  });

  describe('POST /api/meals', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get auth token
      const loginResponse = await request(testServer)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      authToken = loginResponse.body.accessToken;
    });

    it('should create a new meal with valid data', async () => {
      const mealData = {
        name: 'Test Meal',
        calories: 500,
        protein: 25,
        carbs: 50,
        fat: 15,
        date: new Date().toISOString()
      };

      const response = await request(testServer)
        .post('/api/meals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mealData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(mealData.name);
    });

    it('should reject meal creation without authentication', async () => {
      const mealData = {
        name: 'Test Meal',
        calories: 500
      };

      await request(testServer)
        .post('/api/meals')
        .send(mealData)
        .expect(401);
    });
  });
});
```

### 5.4 E2E Testing

```typescript
// End-to-end testing with Playwright
describe('E2E Tests - User Journey', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should complete user registration and login journey', async () => {
    // Navigate to registration page
    await page.goto('http://localhost:3000/register');

    // Fill registration form
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'testpassword123');
    await page.fill('[data-testid="confirm-password"]', 'testpassword123');

    // Submit registration
    await page.click('[data-testid="submit-register"]');

    // Wait for navigation to login page
    await page.waitForURL('**/login');

    // Fill login form
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'testpassword123');

    // Submit login
    await page.click('[data-testid="submit-login"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');

    // Verify user is logged in
    const welcomeMessage = await page.textContent('[data-testid="welcome-message"]');
    expect(welcomeMessage).toContain('testuser');
  });

  it('should allow meal creation and tracking', async () => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'testpassword123');
    await page.click('[data-testid="submit-login"]');

    // Navigate to meal creation
    await page.click('[data-testid="add-meal-button"]');

    // Fill meal form
    await page.fill('[data-testid="meal-name"]', 'Test Meal');
    await page.fill('[data-testid="meal-calories"]', '500');
    await page.fill('[data-testid="meal-protein"]', '25');
    await page.fill('[data-testid="meal-carbs"]', '50');
    await page.fill('[data-testid="meal-fat"]', '15');

    // Submit meal
    await page.click('[data-testid="submit-meal"]');

    // Verify meal was added
    await page.waitForSelector('[data-testid="meal-item"]');
    const mealItems = await page.$$('[data-testid="meal-item"]');
    expect(mealItems.length).toBeGreaterThan(0);
  });
});
```

## Implementation Timeline

### Phase 1: Database Optimization (Week 1-2)
- [ ] Add performance-critical indexes
- [ ] Implement query optimization
- [ ] Set up connection pooling
- [ ] Add query monitoring

### Phase 2: Enhanced Error Handling (Week 2-3)
- [ ] Implement centralized error middleware
- [ ] Set up comprehensive logging
- [ ] Add real-time error monitoring
- [ ] Create error recovery mechanisms

### Phase 3: Security Improvements (Week 3-4)
- [ ] Enhance JWT authentication
- [ ] Implement advanced rate limiting
- [ ] Add input validation and sanitization
- [ ] Set up security headers

### Phase 4: Performance Optimization (Week 4-5)
- [ ] Implement Redis caching
- [ ] Optimize AI API calls
- [ ] Add CDN integration
- [ ] Optimize database queries

### Phase 5: Testing Framework (Week 5-6)
- [ ] Set up unit testing
- [ ] Implement integration testing
- [ ] Add E2E testing
- [ ] Set up CI/CD pipeline

## Success Metrics

### Performance Metrics
- **Database Response Time**: < 50ms for 95% of queries
- **API Response Time**: < 200ms for 95% of requests
- **AI Analysis Time**: < 5 seconds for food image analysis
- **Page Load Time**: < 2 seconds for mobile app

### Reliability Metrics
- **Uptime**: 99.9% for all services
- **Error Rate**: < 0.1% for API requests
- **Success Rate**: > 99% for AI analysis requests
- **Recovery Time**: < 5 minutes for service disruptions

### Security Metrics
- **Vulnerabilities**: Zero critical security vulnerabilities
- **Authentication Success Rate**: > 99.5%
- **Rate Limit Effectiveness**: 99% reduction in abuse attempts
- **Data Encryption**: 100% of sensitive data encrypted

### Code Quality Metrics
- **Test Coverage**: > 90% for all modules
- **Code Coverage**: > 80% for business logic
- **Type Safety**: 100% TypeScript coverage
- **Documentation**: 100% API documentation

## Monitoring and Maintenance

### Performance Monitoring
- Database query performance tracking
- API response time monitoring
- AI service performance metrics
- Error rate tracking

### Security Monitoring
- Authentication attempt monitoring
- Rate limit violation tracking
- Input validation failure monitoring
- Security event logging

### Maintenance Schedule
- **Daily**: Log review, error monitoring
- **Weekly**: Performance review, security audit
- **Monthly**: System optimization, dependency updates
- **Quarterly**: Architecture review, planning

## Conclusion

This comprehensive optimization plan addresses the current technical debt in the AI Calorie Tracker application while providing a scalable, maintainable architecture for future growth. The implementation follows industry best practices and focuses on performance, security, reliability, and code quality.

By following this plan, the application will be transformed into a production-ready system that can handle increased traffic, provide better user experience, and maintain high standards of security and reliability.

---

*This document should be reviewed and updated regularly as the system evolves and new requirements emerge.*