import { config } from '../config';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error category types
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  USER_INTERFACE = 'user_interface'
}

// Error tracking interface
export interface ErrorTrackingData {
  error: {
    message: string;
    stack?: string;
    code?: string;
    type?: string;
  };
  context: {
    requestId: string;
    userId?: number;
    userAgent?: string;
    ip?: string;
    endpoint?: string;
    method?: string;
    timestamp: Date;
  };
  metadata?: Record<string, any>;
  severity: ErrorSeverity;
  category: ErrorCategory;
}

// Error tracking interface
export interface ErrorTracker {
  track(error: Error, context?: Record<string, any>): void;
  trackWithSeverity(error: Error, severity: ErrorSeverity, context?: Record<string, any>): void;
  trackWithCategory(error: Error, category: ErrorCategory, context?: Record<string, any>): void;
  trackWithDetails(error: Error, data: ErrorTrackingData): void;
  getErrorStats(): Promise<ErrorStats>;
  getRecentErrors(limit?: number): Promise<ErrorTrackingData[]>;
  clearErrors(): Promise<void>;
}

// Error statistics interface
export interface ErrorStats {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recentErrorRate: number;
  topErrorMessages: Array<{ message: string; count: number }>;
}

// Mock error tracker implementation (can be replaced with Sentry or similar)
export class MockErrorTracker implements ErrorTracker {
  private errors: ErrorTrackingData[] = [];
  private maxErrors = 1000;

  track(error: Error, context?: Record<string, any>): void {
    this.trackWithDetails(error, {
      error: {
        message: error.message,
        stack: error.stack,
        code: 'UNKNOWN_ERROR',
        type: error.constructor.name
      },
      context: {
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        ...context
      },
      metadata: context,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.SYSTEM
    });
  }

  trackWithSeverity(error: Error, severity: ErrorSeverity, context?: Record<string, any>): void {
    this.track(error, { ...context, severity });
  }

  trackWithCategory(error: Error, category: ErrorCategory, context?: Record<string, any>): void {
    this.track(error, { ...context, category });
  }

  trackWithDetails(error: Error, data: ErrorTrackingData): void {
    // Add timestamp if not provided
    if (!data.context.timestamp) {
      data.context.timestamp = new Date();
    }

    // Add request ID if not provided
    if (!data.context.requestId) {
      data.context.requestId = this.generateRequestId();
    }

    // Add error details if not provided
    if (!data.error.message) {
      data.error.message = error.message;
    }

    // Store error
    this.errors.push(data);

    // Maintain error limit
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log error for debugging
    console.error('Error tracked:', {
      message: data.error.message,
      severity: data.severity,
      category: data.category,
      requestId: data.context.requestId,
      timestamp: data.context.timestamp
    });
  }

  async getErrorStats(): Promise<ErrorStats> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get errors from the last hour
    const recentErrors = this.errors.filter(error => 
      error.context.timestamp >= oneHourAgo
    );

    // Calculate statistics
    const errorsByCategory: Record<ErrorCategory, number> = {} as any;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as any;

    // Initialize counters
    Object.values(ErrorCategory).forEach(category => {
      errorsByCategory[category] = 0;
    });

    Object.values(ErrorSeverity).forEach(severity => {
      errorsBySeverity[severity] = 0;
    });

    // Count errors
    recentErrors.forEach(error => {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
    });

    // Get top error messages
    const errorCounts = new Map<string, number>();
    recentErrors.forEach(error => {
      const count = errorCounts.get(error.error.message) || 0;
      errorCounts.set(error.error.message, count + 1);
    });

    const topErrorMessages = Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: recentErrors.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrorRate: recentErrors.length,
      topErrorMessages
    };
  }

  async getRecentErrors(limit: number = 50): Promise<ErrorTrackingData[]> {
    return this.errors
      .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime())
      .slice(0, limit);
  }

  async clearErrors(): Promise<void> {
    this.errors = [];
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Real error tracker implementation (using Sentry or similar)
export class SentryErrorTracker implements ErrorTracker {
  private sentry: any;

  constructor() {
    // Initialize Sentry if configured
    if (config.monitoring.sentry.dsn) {
      const Sentry = require('@sentry/node');
      Sentry.init({
        dsn: config.monitoring.sentry.dsn,
        environment: config.monitoring.sentry.environment,
        tracesSampleRate: 1.0,
      });
      this.sentry = Sentry;
    }
  }

  track(error: Error, context?: Record<string, any>): void {
    if (this.sentry) {
      this.sentry.captureException(error, {
        extra: context,
        tags: {
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.MEDIUM
        }
      });
    } else {
      // Fallback to mock tracker
      const mockTracker = new MockErrorTracker();
      mockTracker.track(error, context);
    }
  }

  trackWithSeverity(error: Error, severity: ErrorSeverity, context?: Record<string, any>): void {
    if (this.sentry) {
      this.sentry.captureException(error, {
        extra: context,
        tags: {
          category: ErrorCategory.SYSTEM,
          severity
        }
      });
    } else {
      const mockTracker = new MockErrorTracker();
      mockTracker.trackWithSeverity(error, severity, context);
    }
  }

  trackWithCategory(error: Error, category: ErrorCategory, context?: Record<string, any>): void {
    if (this.sentry) {
      this.sentry.captureException(error, {
        extra: context,
        tags: {
          category,
          severity: ErrorSeverity.MEDIUM
        }
      });
    } else {
      const mockTracker = new MockErrorTracker();
      mockTracker.trackWithCategory(error, category, context);
    }
  }

  trackWithDetails(error: Error, data: ErrorTrackingData): void {
    if (this.sentry) {
      this.sentry.captureException(error, {
        extra: {
          ...data.metadata,
          severity: data.severity,
          category: data.category,
          context: data.context
        },
        tags: {
          category: data.category,
          severity: data.severity
        }
      });
    } else {
      const mockTracker = new MockErrorTracker();
      mockTracker.trackWithDetails(error, data);
    }
  }

  async getErrorStats(): Promise<ErrorStats> {
    // This would query Sentry API in a real implementation
    const mockTracker = new MockErrorTracker();
    return mockTracker.getErrorStats();
  }

  async getRecentErrors(limit: number = 50): Promise<ErrorTrackingData[]> {
    // This would query Sentry API in a real implementation
    const mockTracker = new MockErrorTracker();
    return mockTracker.getRecentErrors(limit);
  }

  async clearErrors(): Promise<void> {
    // This would clear Sentry events in a real implementation
    const mockTracker = new MockErrorTracker();
    return mockTracker.clearErrors();
  }
}

// Factory function to create error tracker
export function createErrorTracker(): ErrorTracker {
  if (config.monitoring.sentry.dsn) {
    return new SentryErrorTracker();
  }
  return new MockErrorTracker();
}

// Error severity helper functions
export function getErrorSeverity(error: Error): ErrorSeverity {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (message.includes('error') || message.includes('fail')) {
      return ErrorSeverity.HIGH;
    }
    
    if (message.includes('warning') || message.includes('warn')) {
      return ErrorSeverity.MEDIUM;
    }
  }
  
  return ErrorSeverity.LOW;
}

// Error category helper functions
export function getErrorCategory(error: Error): ErrorCategory {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    
    if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorCategory.AUTHORIZATION;
    }
    
    if (message.includes('database') || message.includes('sql') || message.includes('connection')) {
      return ErrorCategory.DATABASE;
    }
    
    if (message.includes('api') || message.includes('external') || message.includes('service')) {
      return ErrorCategory.EXTERNAL_API;
    }
    
    if (message.includes('business') || message.includes('logic') || message.includes('rule')) {
      return ErrorCategory.BUSINESS_LOGIC;
    }
    
    if (message.includes('security') || message.includes('hack') || message.includes('breach')) {
      return ErrorCategory.SECURITY;
    }
    
    if (message.includes('performance') || message.includes('slow') || message.includes('timeout')) {
      return ErrorCategory.PERFORMANCE;
    }
    
    if (message.includes('ui') || message.includes('interface') || message.includes('display')) {
      return ErrorCategory.USER_INTERFACE;
    }
  }
  
  return ErrorCategory.SYSTEM;
}

// Error tracking middleware
export function errorTrackingMiddleware(errorTracker: ErrorTracker) {
  return (error: Error, req: any, res: any, next: any) => {
    const trackingData: ErrorTrackingData = {
      error: {
        message: error.message,
        stack: error.stack,
        code: 'MIDDLEWARE_ERROR',
        type: error.constructor.name
      },
      context: {
        requestId: req.headers['x-request-id'] || errorTracker['generateRequestId'](),
        userId: req.user?.id,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        endpoint: req.path,
        method: req.method,
        timestamp: new Date()
      },
      metadata: {
        body: req.body,
        params: req.params,
        query: req.query
      },
      severity: getErrorSeverity(error),
      category: getErrorCategory(error)
    };

    errorTracker.trackWithDetails(error, trackingData);
    next(error);
  };
}

// Export default error tracker
export const defaultErrorTracker = createErrorTracker();