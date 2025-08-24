# Technical Specifications for AICalorieTracker Completion

## Database Schema Migration Specifications

### MySQL Schema Alignment

#### Current Issues
1. **PostgreSQL vs MySQL Syntax**: The existing migration file uses PostgreSQL-specific syntax
2. **Missing Tables**: Several tables defined in `shared/schema.ts` are not implemented
3. **Healthcare Schema**: Missing healthcare-related tables for AI insights and tracking

#### Required Tables Implementation

```sql
-- 1. Favorite Meals Table
CREATE TABLE IF NOT EXISTS favorite_meals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    meal_name VARCHAR(255) NOT NULL,
    meal_id INT,
    meal_type VARCHAR(50),
    ingredients JSON,
    nutrition JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_meal_name (meal_name)
);

-- 2. Imported Recipes Table
CREATE TABLE IF NOT EXISTS imported_recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    recipe_name VARCHAR(255) NOT NULL,
    ingredients JSON,
    instructions TEXT,
    parsed_nutrition JSON,
    notes TEXT,
    source_url VARCHAR(500),
    source_image_url VARCHAR(500),
    raw_image_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_recipe_name (recipe_name)
);

-- 3. Referral Settings Table
CREATE TABLE IF NOT EXISTS referral_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Referral Commissions Table
CREATE TABLE IF NOT EXISTS referral_commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrer_id INT NOT NULL,
    referee_id INT NOT NULL,
    subscription_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_recurring BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id),
    FOREIGN KEY (referee_id) REFERENCES users(id),
    INDEX idx_referrer_id (referrer_id),
    INDEX idx_referee_id (referee_id),
    INDEX idx_status (status)
);

-- 5. Languages Table
CREATE TABLE IF NOT EXISTS languages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active)
);

-- 6. Translations Table
CREATE TABLE IF NOT EXISTS translations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    language_id INT NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    is_auto_translated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (language_id) REFERENCES languages(id),
    INDEX idx_language_id (language_id),
    INDEX idx_key (key)
);

-- 7. Workouts Table
CREATE TABLE IF NOT EXISTS workouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    duration INT NOT NULL, -- in minutes
    calories_burned INT NOT NULL,
    date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_date (date)
);

-- 8. Meal Images Table
CREATE TABLE IF NOT EXISTS meal_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meal_analysis_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INT,
    height INT,
    image_hash VARCHAR(64) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (meal_analysis_id) REFERENCES meal_analyses(id),
    INDEX idx_meal_analysis_id (meal_analysis_id),
    INDEX idx_image_hash (image_hash)
);

-- 9. Meal Image Archive Table
CREATE TABLE IF NOT EXISTS meal_image_archive (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meal_analysis_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_analysis_id) REFERENCES meal_analyses(id),
    INDEX idx_meal_analysis_id (meal_analysis_id)
);

-- 10. Health Scores Table
CREATE TABLE IF NOT EXISTS health_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score_type VARCHAR(50) NOT NULL, -- 'nutrition', 'fitness', 'recovery', 'consistency', 'overall'
    score_value DECIMAL(5,2) NOT NULL,
    calculation_date DATE NOT NULL,
    score_details JSON,
    trend_direction VARCHAR(20) DEFAULT 'stable',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_score_type (score_type),
    INDEX idx_calculation_date (calculation_date)
);

-- 11. Health Goals Table
CREATE TABLE IF NOT EXISTS health_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_type VARCHAR(50) NOT NULL, -- 'weight', 'steps', 'calories', 'sleep', 'exercise'
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    deadline DATE,
    is_achieved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_goal_type (goal_type)
);

-- 12. Health Insights Table
CREATE TABLE IF NOT EXISTS health_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    insight_type VARCHAR(20) NOT NULL, -- 'warning', 'recommendation', 'achievement', 'alert'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    metric_type VARCHAR(50),
    value DECIMAL(10,2),
    threshold DECIMAL(10,2),
    recommendation TEXT,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_insight_type (insight_type),
    INDEX idx_priority (priority)
);

-- 13. Real-time Monitoring Table
CREATE TABLE IF NOT EXISTS real_time_monitoring (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_score DECIMAL(5,4),
    metadata JSON,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_metric_type (metric_type),
    INDEX idx_timestamp (timestamp)
);

-- 14. Pattern Analysis Table
CREATE TABLE IF NOT EXISTS pattern_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    pattern_data JSON NOT NULL,
    confidence_score DECIMAL(5,4),
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_pattern_type (pattern_type)
);

-- 15. Health Reports Table
CREATE TABLE IF NOT EXISTS health_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_type VARCHAR(20) NOT NULL, -- 'weekly', 'monthly', 'quarterly', 'annual'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    summary JSON,
    insights JSON,
    recommendations JSON,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_report_type (report_type),
    INDEX idx_period (period_start, period_end)
);
```

### Database Functions and Triggers

```sql
-- Health Score Calculation Function
DELIMITER //
CREATE PROCEDURE CalculateHealthScores(IN p_user_id INT, IN p_calculation_date DATE)
BEGIN
    -- Nutrition Score Calculation
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction)
    SELECT 
        u.id,
        'nutrition',
        -- Calculate nutrition score based on calorie targets and macronutrient balance
        CASE 
            WHEN COUNT(m.id) = 0 THEN 0
            ELSE 
                LEAST(100,
                    (SUM(CASE WHEN ABS(m.calories - u.daily_calorie_target) <= u.daily_calorie_target * 0.1 THEN 40 ELSE 0 END) / COUNT(m.id)) +
                    (SUM(CASE WHEN m.protein >= u.protein_target * 0.9 THEN 30 ELSE 0 END) / COUNT(m.id)) +
                    (SUM(CASE WHEN m.carbs >= u.carbs_target * 0.9 THEN 20 ELSE 0 END) / COUNT(m.id)) +
                    (SUM(CASE WHEN m.fat >= u.fat_target * 0.9 THEN 10 ELSE 0 END) / COUNT(m.id))
                )
        END,
        p_calculation_date,
        JSON_OBJECT(
            'avg_calories', AVG(m.calories),
            'avg_protein', AVG(m.protein),
            'avg_carbs', AVG(m.carbs),
            'avg_fat', AVG(m.fat),
            'calorie_consistency', (SUM(CASE WHEN ABS(m.calories - u.daily_calorie_target) <= u.daily_calorie_target * 0.1 THEN 1 ELSE 0 END) / COUNT(m.id)) * 100
        ),
        'stable'
    FROM users u
    LEFT JOIN meals m ON u.id = m.user_id AND DATE(m.created_at) = p_calculation_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
    
    -- Fitness Score Calculation
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction)
    SELECT 
        u.id,
        'fitness',
        -- Calculate fitness score based on workout frequency and intensity
        CASE 
            WHEN COUNT(w.id) = 0 THEN 0
            ELSE 
                LEAST(100,
                    (MIN(100, (COUNT(w.id) / 7) * 100) * 0.4) + -- Workout frequency (40%)
                    (AVG(w.calories_burned) / 500 * 100 * 0.3) + -- Calorie burn (30%)
                    (MIN(100, AVG(w.duration) / 60 * 100) * 0.3) -- Workout duration (30%)
                )
        END,
        p_calculation_date,
        JSON_OBJECT(
            'workout_count', COUNT(w.id),
            'avg_duration', AVG(w.duration),
            'avg_calories_burned', AVG(w.calories_burned),
            'high_intensity_ratio', (SUM(CASE WHEN w.intensity = 'high' THEN 1 ELSE 0 END) / COUNT(w.id)) * 100,
            'consistency_score', AVG(w.consistency_score)
        ),
        'stable'
    FROM users u
    LEFT JOIN workouts w ON u.id = w.user_id AND DATE(w.created_at) = p_calculation_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
    
    -- Recovery Score Calculation
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction)
    SELECT 
        u.id,
        'recovery',
        -- Calculate recovery score based on sleep quality and rest metrics
        CASE 
            WHEN COUNT(s.id) = 0 THEN 0
            ELSE 
                LEAST(100,
                    (SUM(CASE WHEN s.duration >= 7 THEN 40 ELSE 0 END) / COUNT(s.id)) +
                    (SUM(CASE WHEN s.quality_score >= 80 THEN 30 ELSE 0 END) / COUNT(s.id)) +
                    (SUM(CASE WHEN s.deep_sleep_ratio >= 0.2 THEN 20 ELSE 0 END) / COUNT(s.id)) +
                    (SUM(CASE WHEN s.consistency >= 85 THEN 10 ELSE 0 END) / COUNT(s.id))
                )
        END,
        p_calculation_date,
        JSON_OBJECT(
            'avg_sleep_duration', AVG(s.duration),
            'avg_sleep_quality', AVG(s.quality_score),
            'avg_deep_sleep_ratio', AVG(s.deep_sleep_ratio),
            'sleep_consistency', AVG(s.consistency)
        ),
        'stable'
    FROM users u
    LEFT JOIN sleep_data s ON u.id = s.user_id AND DATE(s.created_at) = p_calculation_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
    
    -- Overall Health Score (weighted average)
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction)
    SELECT 
        u.id,
        'overall',
        -- Weighted average: Nutrition (30%), Fitness (25%), Recovery (25%), Consistency (20%)
        CASE 
            WHEN (COUNT(n.id) + COUNT(f.id) + COUNT(r.id)) = 0 THEN 0
            ELSE 
                (SUM(n.score_value * 0.3) + SUM(f.score_value * 0.25) + 
                 SUM(r.score_value * 0.25)) / 
                (COUNT(n.id) + COUNT(f.id) + COUNT(r.id))
        END,
        p_calculation_date,
        JSON_OBJECT(
            'nutrition_score', COALESCE(AVG(n.score_value), 0),
            'fitness_score', COALESCE(AVG(f.score_value), 0),
            'recovery_score', COALESCE(AVG(r.score_value), 0),
            'weighted_average', 
                (COALESCE(AVG(n.score_value), 0) * 0.3) + 
                (COALESCE(AVG(f.score_value), 0) * 0.25) + 
                (COALESCE(AVG(r.score_value), 0) * 0.25)
        ),
        'stable'
    FROM users u
    LEFT JOIN health_scores n ON u.id = n.user_id AND n.score_type = 'nutrition' AND n.calculation_date = p_calculation_date
    LEFT JOIN health_scores f ON u.id = f.user_id AND f.score_type = 'fitness' AND f.calculation_date = p_calculation_date
    LEFT JOIN health_scores r ON u.id = r.user_id AND r.score_type = 'recovery' AND r.calculation_date = p_calculation_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
END //
DELIMITER ;

-- Update timestamps trigger
DELIMITER //
CREATE TRIGGER update_timestamps BEFORE UPDATE ON users
FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP();
DELIMITER ;

-- Health insights generation trigger
DELIMITER //
CREATE TRIGGER generate_health_insights AFTER INSERT ON health_scores
FOR EACH ROW
BEGIN
    IF NEW.score_type = 'nutrition' AND NEW.score_value < 70 THEN
        INSERT INTO health_insights (user_id, insight_type, title, message, priority, metric_type, value, threshold, recommendation)
        VALUES (NEW.user_id, 'warning', 'Poor Nutrition Score', 
                'Your nutrition score is ' + CAST(NEW.score_value AS VARCHAR) + '. Consider improving your diet quality.',
                'medium', 'nutrition', NEW.score_value, 70, 
                'Focus on balanced meals with proper macronutrient ratios.');
    END IF;
    
    IF NEW.score_type = 'fitness' AND NEW.score_value < 60 THEN
        INSERT INTO health_insights (user_id, insight_type, title, message, priority, metric_type, value, threshold, recommendation)
        VALUES (NEW.user_id, 'warning', 'Low Fitness Activity', 
                'Your fitness score is ' + CAST(NEW.score_value AS VARCHAR) + '. Increase your physical activity.',
                'medium', 'fitness', NEW.score_value, 60,
                'Aim for at least 30 minutes of moderate exercise most days of the week.');
    END IF;
    
    IF NEW.score_type = 'recovery' AND NEW.score_value < 65 THEN
        INSERT INTO health_insights (user_id, insight_type, title, message, priority, metric_type, value, threshold, recommendation)
        VALUES (NEW.user_id, 'warning', 'Insufficient Recovery', 
                'Your recovery score is ' + CAST(NEW.score_value AS VARCHAR) + '. Focus on better sleep and rest.',
                'high', 'recovery', NEW.score_value, 65,
                'Prioritize 7-9 hours of quality sleep and incorporate rest days into your routine.');
    END IF;
END //
DELIMITER ;
```

## Error Handling and Logging Specifications

### Error Handling Architecture

#### Error Types and Codes

```typescript
// Error types
enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR'
}

// Error codes
enum ErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  QUERY_FAILED = 'QUERY_FAILED',
  EXTERNAL_API_TIMEOUT = 'EXTERNAL_API_TIMEOUT',
  EXTERNAL_API_UNAVAILABLE = 'EXTERNAL_API_UNAVAILABLE',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  SYSTEM_OVERLOAD = 'SYSTEM_OVERLOAD',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND'
}

// Standardized error response
interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    type: ErrorType;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
    stack?: string;
  };
}
```

### Error Handling Middleware

```typescript
// Global error handling middleware
export class GlobalErrorHandler {
  private logger: Logger;
  private errorTracker: ErrorTracker;

  constructor(logger: Logger, errorTracker: ErrorTracker) {
    this.logger = logger;
    this.errorTracker = errorTracker;
  }

  handle(error: Error, req: Request, res: Response, next: NextFunction): void {
    const requestId = req.headers['x-request-id'] as string;
    const errorResponse = this.formatErrorResponse(error, requestId);

    // Log error
    this.logger.error('Error occurred', {
      error: errorResponse,
      request: {
        method: req.method,
        url: req.url,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        userId: req.user?.id
      }
    });

    // Track error for monitoring
    this.errorTracker.track(error, {
      requestId,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: req.user?.id,
      endpoint: req.path,
      method: req.method
    });

    // Send error response
    const statusCode = this.getStatusCode(error);
    res.status(statusCode).json(errorResponse);
  }

  private formatErrorResponse(error: Error, requestId: string): ErrorResponse {
    let errorCode: ErrorCode;
    let errorType: ErrorType;
    let message: string;

    if (error instanceof ValidationError) {
      errorCode = ErrorCode.VALIDATION_FAILED;
      errorType = ErrorType.VALIDATION_ERROR;
      message = error.message;
    } else if (error instanceof AuthenticationError) {
      errorCode = ErrorCode.UNAUTHORIZED;
      errorType = ErrorType.AUTHENTICATION_ERROR;
      message = 'Authentication failed';
    } else if (error instanceof AuthorizationError) {
      errorCode = ErrorCode.FORBIDDEN;
      errorType = ErrorType.AUTHORIZATION_ERROR;
      message = 'Access denied';
    } else if (error instanceof DatabaseError) {
      errorCode = ErrorCode.QUERY_FAILED;
      errorType = ErrorType.DATABASE_ERROR;
      message = 'Database operation failed';
    } else if (error instanceof ExternalApiError) {
      errorCode = ErrorCode.EXTERNAL_API_TIMEOUT;
      errorType = ErrorType.EXTERNAL_API_ERROR;
      message = 'External service unavailable';
    } else {
      errorCode = ErrorCode.SYSTEM_ERROR;
      errorType = ErrorType.SYSTEM_ERROR;
      message = 'Internal server error';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        type: errorType,
        message,
        details: error instanceof BusinessLogicError ? error.details : undefined,
        timestamp: new Date().toISOString(),
        requestId,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    };
  }

  private getStatusCode(error: Error): number {
    if (error instanceof ValidationError) return 400;
    if (error instanceof AuthenticationError) return 401;
    if (error instanceof AuthorizationError) return 403;
    if (error instanceof NotFoundError) return 404;
    if (error instanceof RateLimitError) return 429;
    return 500;
  }
}

// Request validation middleware
export class ValidationMiddleware {
  private validator: Validator;

  constructor(validator: Validator) {
    this.validator = validator;
  }

  validate(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = this.validator.validate(req.body, schema);
      
      if (error) {
        throw new ValidationError(error.details[0].message);
      }
      
      req.body = value;
      next();
    };
  }

  validateQuery(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = this.validator.validate(req.query, schema);
      
      if (error) {
        throw new ValidationError(error.details[0].message);
      }
      
      req.query = value;
      next();
    };
  }

  validateParams(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = this.validator.validate(req.params, schema);
      
      if (error) {
        throw new ValidationError(error.details[0].message);
      }
      
      req.params = value;
      next();
    };
  }
}
```

### Logging System

```typescript
// Logger interface
interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
}

// Structured logger implementation
export class StructuredLogger implements Logger {
  private serviceName: string;
  private environment: string;

  constructor(serviceName: string, environment: string) {
    this.serviceName = serviceName;
    this.environment = environment;
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log('error', message, meta);
  }

  private log(level: string, message: string, meta?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...meta
    };

    // In production, send to logging service
    if (this.environment === 'production') {
      this.sendToLoggingService(logEntry);
    } else {
      // In development, log to console
      console[level](JSON.stringify(logEntry, null, 2));
    }
  }

  private async sendToLoggingService(logEntry: any): Promise<void> {
    try {
      // Send to external logging service (Sentry, Loggly, etc.)
      await fetch(process.env.LOGGING_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOGGING_SERVICE_TOKEN}`
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // Fallback to console logging if service is unavailable
      console.error('Failed to send log to service:', error);
      console.error('Log entry:', logEntry);
    }
  }
}

// Request logging middleware
export class RequestLoggingMiddleware {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    
    // Log request
    this.logger.info('Request received', {
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: req.user?.id,
      requestId: req.headers['x-request-id']
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logger.info('Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        userId: req.user?.id,
        requestId: req.headers['x-request-id']
      });
    });

    next();
  }
}
```

## Performance Monitoring Specifications

### Performance Monitoring Middleware

```typescript
// Performance monitoring interface
interface PerformanceMetrics {
  requestDuration: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  databaseQueries: {
    count: number;
    totalDuration: number;
    averageDuration: number;
  };
  externalApiCalls: {
    count: number;
    totalDuration: number;
    averageDuration: number;
  };
}

// Performance monitoring middleware
export class PerformanceMonitoringMiddleware {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    // Track database queries
    const queryStartTimes: number[] = [];
    const originalQuery = (global as any).query;
    
    (global as any).query = (sql: string, params?: any[]) => {
      const queryStart = Date.now();
      return originalQuery.call(this, sql, params).then((result: any) => {
        queryStartTimes.push(queryStart);
        return result;
      });
    };

    // Track external API calls
    const originalFetch = global.fetch;
    const apiCallStartTimes: number[] = [];
    
    global.fetch = (url: string, options?: any) => {
      const apiStart = Date.now();
      return originalFetch.call(this, url, options).then((response: any) => {
        apiCallStartTimes.push(apiStart);
        return response;
      });
    };

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);

      const metrics: PerformanceMetrics = {
        requestDuration: duration,
        memoryUsage: {
          used: endMemory.heapUsed,
          total: endMemory.heapTotal,
          percentage: (endMemory.heapUsed / endMemory.heapTotal) * 100
        },
        cpuUsage: {
          user: endCpu.user,
          system: endCpu.system
        },
        databaseQueries: {
          count: queryStartTimes.length,
          totalDuration: queryStartTimes.reduce((sum, time) => sum + (Date.now() - time), 0),
          averageDuration: queryStartTimes.length > 0 ? 
            queryStartTimes.reduce((sum, time) => sum + (Date.now() - time), 0) / queryStartTimes.length : 0
        },
        externalApiCalls: {
          count: apiCallStartTimes.length,
          totalDuration: apiCallStartTimes.reduce((sum, time) => sum + (Date.now() - time), 0),
          averageDuration: apiCallStartTimes.length > 0 ? 
            apiCallStartTimes.reduce((sum, time) => sum + (Date.now() - time), 0) / apiCallStartTimes.length : 0
        }
      };

      // Store metrics
      const key = `${req.method}:${req.path}`;
      this.metrics.set(key, metrics);

      // Log performance metrics
      this.logger.info('Performance metrics', {
        method: req.method,
        url: req.url,
        ...metrics
      });

      // Check for performance issues
      this.checkPerformanceIssues(metrics, req);

      // Restore original functions
      (global as any).query = originalQuery;
      global.fetch = originalFetch;
    });

    next();
  }

  private checkPerformanceIssues(metrics: PerformanceMetrics, req: Request): void {
    const issues: string[] = [];

    if (metrics.requestDuration > 5000) {
      issues.push(`Slow request: ${metrics.requestDuration}ms`);
    }

    if (metrics.memoryUsage.percentage > 80) {
      issues.push(`High memory usage: ${metrics.memoryUsage.percentage}%`);
    }

    if (metrics.databaseQueries.averageDuration > 1000) {
      issues.push(`Slow database queries: ${metrics.databaseQueries.averageDuration}ms average`);
    }

    if (metrics.externalApiCalls.averageDuration > 3000) {
      issues.push(`Slow external API calls: ${metrics.externalApiCalls.averageDuration}ms average`);
    }

    if (issues.length > 0) {
      this.logger.warn('Performance issues detected', {
        method: req.method,
        url: req.url,
        issues
      });
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  getAggregatedMetrics(timeRange: number = 3600000): PerformanceMetrics {
    const cutoff = Date.now() - timeRange;
    const recentMetrics = Array.from(this.metrics.values())
      .filter(metric => Date.now() - metric.requestDuration < cutoff);

    if (recentMetrics.length === 0) {
      return {
        requestDuration: 0,
        memoryUsage: { used: 0, total: 0, percentage: 0 },
        cpuUsage: { user: 0, system: 0 },
        databaseQueries: { count: 0, totalDuration: 0, averageDuration: 0 },
        externalApiCalls: { count: 0, totalDuration: 0, averageDuration: 0 }
      };
    }

    return {
      requestDuration: recentMetrics.reduce((sum, m) => sum + m.requestDuration, 0) / recentMetrics.length,
      memoryUsage: {
        used: recentMetrics.reduce((sum, m) => sum + m.memoryUsage.used, 0) / recentMetrics.length,
        total: recentMetrics.reduce((sum, m) => sum + m.memoryUsage.total, 0) / recentMetrics.length,
        percentage: recentMetrics.reduce((sum, m) => sum + m.memoryUsage.percentage, 0) / recentMetrics.length
      },
      cpuUsage: {
        user: recentMetrics.reduce((sum, m) => sum + m.cpuUsage.user, 0) / recentMetrics.length,
        system: recentMetrics.reduce((sum, m) => sum + m.cpuUsage.system, 0) / recentMetrics.length
      },
      databaseQueries: {
        count: recentMetrics.reduce((sum, m) => sum + m.databaseQueries.count, 0),
        totalDuration: recentMetrics.reduce((sum, m) => sum + m.databaseQueries.totalDuration, 0),
        averageDuration: recentMetrics.reduce((sum, m) => sum + m.databaseQueries.averageDuration, 0) / recentMetrics.length
      },
      externalApiCalls: {
        count: recentMetrics.reduce((sum, m) => sum + m.externalApiCalls.count, 0),
        totalDuration: recentMetrics.reduce((sum, m) => sum + m.externalApiCalls.totalDuration, 0),
        averageDuration: recentMetrics.reduce((sum, m) => sum + m.externalApiCalls.averageDuration, 0) / recentMetrics.length
      }
    };
  }
}
```

### Database Query Monitoring

```typescript
// Database query monitoring
export class DatabaseQueryMonitor {
  private queryMetrics: Map<string, any> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  monitorQuery(sql: string, params: any[], startTime: number, result: any, error?: Error): void {
    const duration = Date.now() - startTime;
    const queryHash = this.generateQueryHash(sql, params);

    const metric = {
      sql,
      params,
      duration,
      success: !error,
      error: error?.message,
      timestamp: new Date().toISOString()
    };

    if (!this.queryMetrics.has(queryHash)) {
      this.queryMetrics.set(queryHash, []);
    }

    this.queryMetrics.get(queryHash).push(metric);

    // Log slow queries
    if (duration > 1000) {
      this.logger.warn('Slow database query detected', {
        sql,
        params,
        duration,
        error: error?.message
      });
    }

    // Log failed queries
    if (error) {
      this.logger.error('Database query failed', {
        sql,
        params,
        error: error.message
      });
    }
  }

  private generateQueryHash(sql: string, params: any[]): string {
    const queryStr = sql + JSON.stringify(params);
    let hash = 0;
    for (let i = 0; i < queryStr.length; i++) {
      const char = queryStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  getQueryMetrics(): any {
    return Object.fromEntries(this.queryMetrics);
  }

  getSlowQueries(threshold: number = 1000): any[] {
    const slowQueries: any[] = [];
    
    for (const [queryHash, metrics] of this.queryMetrics) {
      const avgDuration = metrics.reduce((sum: number, m: any) => sum + m.duration, 0) / metrics.length;
      if (avgDuration > threshold) {
        slowQueries.push({
          queryHash,
          averageDuration: avgDuration,
          callCount: metrics.length,
          lastExecution: metrics[metrics.length - 1].timestamp
        });
      }
    }
    
    return slowQueries.sort((a, b) => b.averageDuration - a.averageDuration);
  }
}
```

## Documentation Specifications

### API Documentation with OpenAPI/Swagger

```yaml
# OpenAPI 3.0 specification
openapi: 3.0.0
info:
  title: AICalorieTracker API
  description: API for the AICalorieTracker mobile application with AI-powered calorie tracking
  version: 1.0.0
  contact:
    name: API Support
    email: support@aicalorietracker.com

servers:
  - url: https://api.aicalorietracker.com/v1
    description: Production server
  - url: https://staging-api.aicalorietracker.com/v1
    description: Staging server

paths:
  /auth/register:
    post:
      tags:
        - Authentication
      summary: Register a new user
      description: Create a new user account with email and password
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
                - firstName
                - lastName
              properties:
                email:
                  type: string
                  format: email
                  example: user@example.com
                password:
                  type: string
                  format: password
                  example: SecurePassword123!
                firstName:
                  type: string
                  example: John
                lastName:
                  type: string
                  example: Doe
                age:
                  type: integer
                  example: 30
                gender:
                  type: string
                  enum: [male, female, other]
                  example: male
      responses:
        '201':
          description: User registered successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      user:
                        $ref: '#/components/schemas/User'
                      token:
                        type: string
                        example: jwt_token_here
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: User already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /meals:
    post:
      tags:
        - Meals
      summary: Create a new meal entry
      description: Add a new meal entry with optional image analysis
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - imageData
              properties:
                imageData:
                  type: string
                  format: binary
                  description: Image of the meal
                mealType:
                  type: string
                  enum: [breakfast, lunch, dinner, snack]
                  example: lunch
                notes:
                  type: string
                  example: Healthy chicken salad
      responses:
        '201':
          description: Meal created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    $ref: '#/components/schemas/MealAnalysis'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /health/scores:
    get:
      tags:
        - Health
      summary: Get user health scores
      description: Retrieve calculated health scores for the user
      security:
        - bearerAuth: []
      parameters:
        - name: type
          in: query
          schema:
            type: string
            enum: [nutrition, fitness, recovery, consistency, overall]
          description: Filter by score type
        - name: startDate
          in: query
          schema:
            type: string
            format: date
          description: Start date for score history
        - name: endDate
          in: query
          schema:
            type: string
            format: date
          description: End date for score history
      responses:
        '200':
          description: Health scores retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/HealthScore'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          example: 1
        email:
          type: string
          format: email
          example: user@example.com
        firstName:
          type: string
          example: John
        lastName:
          type: string
          example: Doe
        isPremium:
          type: boolean
          example: false
        createdAt:
          type: string
          format: date-time
          example: 2024-01-01T00:00:00Z

    MealAnalysis:
      type: object
      properties:
        id:
          type: integer
          example: 1
        foodName:
          type: string
          example: Grilled Chicken Salad
        calories:
          type: integer
          example: 350
        protein:
          type: integer
          example: 25
        carbs:
          type: integer
          example: 20
        fat:
          type: integer
          example: 15
        timestamp:
          type: string
          format: date-time
          example: 2024-01-01T12:00:00Z

    HealthScore:
      type: object
      properties:
        id:
          type: integer
          example: 1
        scoreType:
          type: string
          enum: [nutrition, fitness, recovery, consistency, overall]
          example: nutrition
        scoreValue:
          type: number
          format: float
          example: 85.5
        calculationDate:
          type: string
          format: date
          example: 2024-01-01
        trendDirection:
          type: string
          enum: [improving, stable, declining]
          example: stable

    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean