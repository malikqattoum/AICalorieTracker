import { Request, Response, NextFunction } from 'express';

export interface TimeoutOptions {
  responseTimeout?: number;
  requestTimeout?: number;
  responseTimeoutMessage?: string;
  requestTimeoutMessage?: string;
}

/**
 * Request timeout middleware
 * Handles both request timeout and response timeout
 */
export function timeoutMiddleware(options: TimeoutOptions = {}) {
  const {
    responseTimeout = 30000, // 30 seconds default response timeout
    requestTimeout = 300000, // 5 minutes default request timeout
    responseTimeoutMessage = 'Request timeout',
    requestTimeoutMessage = 'Request processing timeout'
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Set request timeout
    const requestTimeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: requestTimeoutMessage,
          code: 'REQUEST_TIMEOUT',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }
    }, requestTimeout);

    // Set response timeout
    const responseTimeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          error: responseTimeoutMessage,
          code: 'RESPONSE_TIMEOUT',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }
    }, responseTimeout);

    // Clear timeouts when response is finished
    const cleanup = () => {
      clearTimeout(requestTimeoutId);
      clearTimeout(responseTimeoutId);
      res.removeListener('finish', cleanup);
      res.removeListener('error', cleanup);
    };

    res.on('finish', cleanup);
    res.on('error', cleanup);

    next();
  };
}

/**
 * Specific timeout middleware for AI service calls
 */
export function aiTimeoutMiddleware() {
  return timeoutMiddleware({
    responseTimeout: 120000, // 2 minutes for AI calls
    requestTimeout: 300000, // 5 minutes for AI calls
    responseTimeoutMessage: 'AI service timeout',
    requestTimeoutMessage: 'AI request processing timeout'
  });
}

/**
 * Specific timeout middleware for file uploads
 */
export function uploadTimeoutMiddleware() {
  return timeoutMiddleware({
    responseTimeout: 60000, // 1 minute for upload response
    requestTimeout: 300000, // 5 minutes for upload request
    responseTimeoutMessage: 'Upload timeout',
    requestTimeoutMessage: 'Upload processing timeout'
  });
}

/**
 * Specific timeout middleware for database operations
 */
export function databaseTimeoutMiddleware() {
  return timeoutMiddleware({
    responseTimeout: 15000, // 15 seconds for database response
    requestTimeout: 60000, // 1 minute for database request
    responseTimeoutMessage: 'Database timeout',
    requestTimeoutMessage: 'Database operation timeout'
  });
}

/**
 * Global timeout configuration
 */
export const globalTimeoutOptions: TimeoutOptions = {
  responseTimeout: parseInt(process.env.RESPONSE_TIMEOUT || '30000'),
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '300000'),
  responseTimeoutMessage: process.env.RESPONSE_TIMEOUT_MESSAGE || 'Request timeout',
  requestTimeoutMessage: process.env.REQUEST_TIMEOUT_MESSAGE || 'Request processing timeout'
};

/**
 * Create timeout middleware with environment-based configuration
 */
export function createTimeoutMiddleware(customOptions?: Partial<TimeoutOptions>) {
  const options = { ...globalTimeoutOptions, ...customOptions };
  return timeoutMiddleware(options);
}

/**
 * Timeout handler for async operations
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    })
  ]);
}

/**
 * Timeout utility for database queries
 */
export function withDbTimeout<T>(
  query: Promise<T>,
  timeoutMs: number = 15000
): Promise<T> {
  return withTimeout(query, timeoutMs, 'Database query timeout');
}

/**
 * Timeout utility for AI service calls
 */
export function withAiTimeout<T>(
  call: Promise<T>,
  timeoutMs: number = 120000
): Promise<T> {
  return withTimeout(call, timeoutMs, 'AI service call timeout');
}

/**
 * Timeout utility for file operations
 */
export function withFileTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number = 60000
): Promise<T> {
  return withTimeout(operation, timeoutMs, 'File operation timeout');
}