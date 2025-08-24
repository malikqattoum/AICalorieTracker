import { Request, Response, NextFunction, RequestHandler } from 'express';

export interface TimeoutOptions {
  responseTimeout?: number; // Response timeout in milliseconds
  requestTimeout?: number; // Request timeout in milliseconds
  onTimeout?: (req: Request, res: Response, next: NextFunction) => void;
  errorGenerator?: (timeout: number) => Error;
}

class TimeoutService {
  private defaultOptions: Required<TimeoutOptions>;

  constructor(options: TimeoutOptions = {}) {
    this.defaultOptions = {
      responseTimeout: 30000, // 30 seconds default
      requestTimeout: 60000, // 60 seconds default
      onTimeout: this.defaultTimeoutHandler,
      errorGenerator: this.defaultErrorGenerator,
      ...options,
    };
  }

  /**
   * Create timeout middleware
   */
  middleware(options: TimeoutOptions = {}): RequestHandler {
    const config = { ...this.defaultOptions, ...options };

    return (req: Request, res: Response, next: NextFunction) => {
      // Set request timeout
      const requestTimeout = setTimeout(() => {
        if (!req.complete) {
          config.onTimeout(req, res, next);
        }
      }, config.requestTimeout);

      // Set response timeout
      const responseTimeout = setTimeout(() => {
        if (!res.headersSent) {
          config.onTimeout(req, res, next);
        }
      }, config.responseTimeout);

      // Clean up timeouts on response completion
      const cleanup = () => {
        clearTimeout(requestTimeout);
        clearTimeout(responseTimeout);
      };

      res.on('finish', cleanup);
      res.on('close', cleanup);

      // Override res.end to track completion
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any) {
        cleanup();
        return originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  /**
   * Create timeout handler for specific routes
   */
  routeHandler(options: TimeoutOptions = {}): RequestHandler {
    return this.middleware(options);
  }

  /**
   * Default timeout handler
   */
  private defaultTimeoutHandler(req: Request, res: Response, next: NextFunction): void {
    const error = this.defaultErrorGenerator(this.defaultOptions.responseTimeout);
    
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timeout',
          details: 'The server did not receive a timely response from the upstream server',
          timeout: this.defaultOptions.responseTimeout,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Default error generator
   */
  private defaultErrorGenerator(timeout: number): Error {
    const error = new Error(`Request timeout after ${timeout}ms`);
    error.name = 'TimeoutError';
    (error as any).code = 'TIMEOUT';
    (error as any).timeout = timeout;
    return error;
  }

  /**
   * Create async timeout wrapper
   */
  async timeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string = 'Operation timed out'
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const error = new Error(timeoutMessage);
        error.name = 'TimeoutError';
        (error as any).code = 'TIMEOUT';
        (error as any).timeout = timeoutMs;
        reject(error);
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Create timeout for database queries
   */
  dbTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
    return this.timeout(promise, timeoutMs, 'Database query timeout');
  }

  /**
   * Create timeout for AI service calls
   */
  aiTimeout<T>(promise: Promise<T>, timeoutMs: number = 45000): Promise<T> {
    return this.timeout(promise, timeoutMs, 'AI service timeout');
  }

  /**
   * Create timeout for file operations
   */
  fileTimeout<T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> {
    return this.timeout(promise, timeoutMs, 'File operation timeout');
  }

  /**
   * Create timeout for external API calls
   */
  apiTimeout<T>(promise: Promise<T>, timeoutMs: number = 20000): Promise<T> {
    return this.timeout(promise, timeoutMs, 'External API timeout');
  }

  /**
   * Get current timeout configuration
   */
  getOptions(): TimeoutOptions {
    return { ...this.defaultOptions };
  }

  /**
   * Update timeout configuration
   */
  updateOptions(options: Partial<TimeoutOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
}

// Export singleton instance
export const timeoutService = new TimeoutService();
export default timeoutService;