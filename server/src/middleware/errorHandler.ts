import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { ErrorTracker, ErrorSeverity, ErrorCategory } from '../utils/errorTracker';

// Error types and codes
export enum ErrorType {
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

export enum ErrorCode {
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

// Custom error classes
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly requestId: string;

  constructor(
    type: ErrorType,
    code: ErrorCode,
    message: string,
    details?: Record<string, any>,
    requestId?: string
  ) {
    super(message);
    this.type = type;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.requestId = requestId || this.generateRequestId();
    this.name = 'AppError';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorType.VALIDATION_ERROR, ErrorCode.VALIDATION_FAILED, message, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(ErrorType.AUTHENTICATION_ERROR, ErrorCode.UNAUTHORIZED, message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(ErrorType.AUTHORIZATION_ERROR, ErrorCode.FORBIDDEN, message);
    this.name = 'AuthorizationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorType.DATABASE_ERROR, ErrorCode.QUERY_FAILED, message, details);
    this.name = 'DatabaseError';
  }
}

export class ExternalApiError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorType.EXTERNAL_API_ERROR, ErrorCode.EXTERNAL_API_TIMEOUT, message, details);
    this.name = 'ExternalApiError';
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorType.BUSINESS_LOGIC_ERROR, ErrorCode.BUSINESS_RULE_VIOLATION, message, details);
    this.name = 'BusinessLogicError';
  }
}

export class SystemError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorType.SYSTEM_ERROR, ErrorCode.SYSTEM_OVERLOAD, message, details);
    this.name = 'SystemError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(ErrorType.NOT_FOUND_ERROR, ErrorCode.RESOURCE_NOT_FOUND, message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(ErrorType.RATE_LIMIT_ERROR, ErrorCode.RATE_LIMIT_EXCEEDED, message);
    this.name = 'RateLimitError';
  }
}

// Standardized error response interface
export interface ErrorResponse {
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

// Global error handler middleware
export class GlobalErrorHandler {
  private logger: Logger;
  private errorTracker: ErrorTracker;

  constructor(logger: Logger, errorTracker: ErrorTracker) {
    this.logger = logger;
    this.errorTracker = errorTracker;
  }

  handle(error: Error, req: Request, res: Response, next: NextFunction): void {
    const requestId = req.headers['x-request-id'] as string || this.generateRequestId();
    const errorResponse = this.formatErrorResponse(error, requestId);

    // Log error
    this.logger.error('Error occurred', {
      error: errorResponse,
      request: {
        method: req.method,
        url: req.url,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        userId: req.user?.id,
        body: this.sanitizeRequestBody(req.body),
        params: req.params,
        query: req.query
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
    let details: Record<string, any> | undefined;

    if (error instanceof AppError) {
      errorCode = error.code;
      errorType = error.type;
      message = error.message;
      details = error.details;
    } else if (error instanceof ValidationError) {
      errorCode = ErrorCode.VALIDATION_FAILED;
      errorType = ErrorType.VALIDATION_ERROR;
      message = error.message;
      details = error.details;
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
      details = error.details;
    } else if (error instanceof ExternalApiError) {
      errorCode = ErrorCode.EXTERNAL_API_TIMEOUT;
      errorType = ErrorType.EXTERNAL_API_ERROR;
      message = 'External service unavailable';
      details = error.details;
    } else {
      errorCode = ErrorCode.SYSTEM_OVERLOAD;
      errorType = ErrorType.SYSTEM_ERROR;
      message = 'Internal server error';
      details = process.env.NODE_ENV === 'development' ? { originalError: error.message } : undefined;
    }

    return {
      success: false,
      error: {
        code: errorCode,
        type: errorType,
        message,
        details,
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

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeRequestBody(body: any): any {
    // Remove sensitive information from request body
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }
}

// Request validation middleware
export class ValidationMiddleware {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  validate(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        this.logger.warn('Validation failed', {
          method: req.method,
          url: req.url,
          error: error.details[0].message,
          requestBody: req.body
        });
        
        throw new ValidationError(error.details[0].message);
      }
      
      req.body = value;
      next();
    };
  }

  validateQuery(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = schema.validate(req.query);
      
      if (error) {
        this.logger.warn('Query validation failed', {
          method: req.method,
          url: req.url,
          error: error.details[0].message,
          query: req.query
        });
        
        throw new ValidationError(error.details[0].message);
      }
      
      req.query = value;
      next();
    };
  }

  validateParams(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = schema.validate(req.params);
      
      if (error) {
        this.logger.warn('Params validation failed', {
          method: req.method,
          url: req.url,
          error: error.details[0].message,
          params: req.params
        });
        
        throw new ValidationError(error.details[0].message);
      }
      
      req.params = value;
      next();
    };
  }
}

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Initialize error handler
export const initializeErrorHandler = (logger: Logger, errorTracker: ErrorTracker) => {
  const errorHandler = new GlobalErrorHandler(logger, errorTracker);
  
  return {
    errorHandler: errorHandler.handle.bind(errorHandler),
    validationMiddleware: new ValidationMiddleware(logger),
    asyncHandler,
    notFoundHandler
  };
};