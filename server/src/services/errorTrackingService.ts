import { log } from '../../vite';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  ip?: string;
  timestamp: number;
  environment: string;
  version: string;
}

export interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'validation' | 'database' | 'api' | 'ai' | 'file' | 'system' | 'unknown';
  context: ErrorContext;
  metadata?: Record<string, any>;
}

export interface ErrorTrackingOptions {
  enableTracking?: boolean;
  environment?: string;
  version?: string;
  sampleRate?: number;
  beforeSend?: (error: ErrorDetails) => boolean;
  maxStackSize?: number;
  excludePatterns?: RegExp[];
  includeStack?: boolean;
}

class ErrorTrackingService {
  private options: Required<ErrorTrackingOptions>;
  private errorQueue: ErrorDetails[] = [];
  private isProcessing = false;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(options: ErrorTrackingOptions = {}) {
    this.options = {
      enableTracking: true,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      sampleRate: 1.0,
      beforeSend: (error) => true,
      maxStackSize: 1000,
      excludePatterns: [],
      includeStack: true,
      ...options,
    };

    this.startFlushInterval();
  }

  /**
   * Track an error
   */
  async trackError(error: Error | ErrorDetails, context?: Partial<ErrorContext>): Promise<void> {
    if (!this.options.enableTracking) {
      return;
    }

    // Check sampling rate
    if (Math.random() > this.options.sampleRate) {
      return;
    }

    // Check exclusion patterns
    if (this.shouldExcludeError(error)) {
      return;
    }

    const errorDetails = error instanceof Error ? this.createErrorDetails(error, context) : error;

    // Apply beforeSend hook
    if (!this.options.beforeSend(errorDetails)) {
      return;
    }

    // Add to queue
    this.errorQueue.push(errorDetails);

    // Check queue size
    if (this.errorQueue.length >= this.options.maxStackSize) {
      await this.flush();
    }

    // Log error
    this.logError(errorDetails);
  }

  /**
   * Create error details from Error object
   */
  private createErrorDetails(error: Error, context?: Partial<ErrorContext>): ErrorDetails {
    const errorContext: ErrorContext = {
      timestamp: Date.now(),
      environment: this.options.environment,
      version: this.options.version,
      ...context,
    };

    return {
      name: error.name,
      message: error.message,
      stack: this.options.includeStack ? error.stack : undefined,
      code: (error as any).code,
      statusCode: (error as any).statusCode,
      severity: this.categorizeSeverity(error),
      category: this.categorizeError(error),
      context: errorContext,
      metadata: {
        ...((error as any).metadata || {}),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };
  }

  /**
   * Categorize error severity
   */
  private categorizeSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    const code = (error as any).code?.toLowerCase();

    // Critical errors
    if (code === 'auth_failed' || code === 'unauthorized' || message.includes('critical')) {
      return 'critical';
    }

    // High errors
    if (code === 'validation_failed' || message.includes('failed') || message.includes('error')) {
      return 'high';
    }

    // Medium errors
    if (message.includes('warning') || message.includes('deprecated')) {
      return 'medium';
    }

    // Low errors
    return 'low';
  }

  /**
   * Categorize error type
   */
  private categorizeError(error: Error): 'auth' | 'validation' | 'database' | 'api' | 'ai' | 'file' | 'system' | 'unknown' {
    const message = error.message.toLowerCase();
    const code = (error as any).code?.toLowerCase();

    if (code?.includes('auth') || message.includes('auth') || message.includes('login')) {
      return 'auth';
    }

    if (code?.includes('validation') || message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }

    if (code?.includes('database') || message.includes('database') || message.includes('sql')) {
      return 'database';
    }

    if (code?.includes('api') || message.includes('api') || message.includes('http')) {
      return 'api';
    }

    if (code?.includes('ai') || message.includes('ai') || message.includes('openai') || message.includes('gemini')) {
      return 'ai';
    }

    if (code?.includes('file') || message.includes('file') || message.includes('image')) {
      return 'file';
    }

    if (code?.includes('system') || message.includes('system') || message.includes('memory')) {
      return 'system';
    }

    return 'unknown';
  }

  /**
   * Check if error should be excluded
   */
  private shouldExcludeError(error: Error | ErrorDetails): boolean {
    const message = error instanceof Error ? error.message : error.message;
    const code = error instanceof Error ? (error as any).code : error.code;

    return this.options.excludePatterns.some(pattern => {
      return pattern.test(message) || (code && pattern.test(code));
    });
  }

  /**
   * Log error
   */
  private logError(errorDetails: ErrorDetails): void {
    const logMessage = `[${errorDetails.severity.toUpperCase()}] ${errorDetails.category.toUpperCase()}: ${errorDetails.message}`;
    
    switch (errorDetails.severity) {
      case 'critical':
        console.error(logMessage, errorDetails);
        break;
      case 'high':
        console.error(logMessage, errorDetails);
        break;
      case 'medium':
        console.warn(logMessage, errorDetails);
        break;
      case 'low':
        console.info(logMessage, errorDetails);
        break;
    }
  }

  /**
   * Flush error queue
   */
  async flush(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const errorsToFlush = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In a real implementation, you would send errors to an external service
      // For now, we'll just log them
      log(`Flushing ${errorsToFlush.length} errors to tracking service`);
      
      // Simulate sending to external service
      await this.sendToExternalService(errorsToFlush);
    } catch (error) {
      console.log('Failed to flush errors:', error instanceof Error ? error.message : String(error));
      // Re-queue errors if flush fails
      this.errorQueue.unshift(...errorsToFlush);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send errors to external service
   */
  private async sendToExternalService(errors: ErrorDetails[]): Promise<void> {
    // In a real implementation, you would send to Sentry, Rollbar, or similar
    // For now, we'll just simulate the call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Create error boundary for React components
   */
  createReactErrorBoundary(): any {
    return {
      ErrorBoundary: class ReactErrorBoundary {
        state = { hasError: false, error: null };

        static getDerivedStateFromError(error: Error) {
          return { hasError: true, error };
        }

        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
          const errorDetails = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
            statusCode: (error as any).statusCode,
            severity: 'high' as const,
            category: 'system' as const,
            context: {
              timestamp: Date.now(),
              environment: errorTrackingService.options.environment,
              version: errorTrackingService.options.version,
              componentStack: errorInfo.componentStack,
            },
            metadata: {
              component: 'UnknownComponent',
              location: window.location.href,
            },
          };

          errorTrackingService.trackError(errorDetails);
        }

        render() {
          if (this.state.hasError) {
            return `
              <div class="error-boundary">
                <h2>Something went wrong</h2>
                <p>We're sorry, but something went wrong. Our team has been notified.</p>
                <button onclick="window.location.reload()">Refresh the page</button>
              </div>
            `;
          }

          return '';
        }
      },
    };
  }

  /**
   * Create global error handler
   */
  createGlobalErrorHandler(): (event: ErrorEvent, promiseRejection: PromiseRejectionEvent) => void {
    return (event: ErrorEvent, promiseRejection: PromiseRejectionEvent) => {
      const errorDetails: ErrorDetails = {
        name: event.error?.name || promiseRejection.reason?.name || 'UnknownError',
        message: event.error?.message || promiseRejection.reason?.message || 'Unknown error occurred',
        stack: event.error?.stack || promiseRejection.reason?.stack,
        code: (event.error as any)?.code || (promiseRejection.reason as any)?.code,
        statusCode: (event.error as any)?.statusCode || (promiseRejection.reason as any)?.statusCode,
        severity: 'high',
        category: 'system',
        context: {
          timestamp: Date.now(),
          environment: this.options.environment,
          version: this.options.version,
          source: event.filename || promiseRejection.type,
          lineno: event.lineno,
          colno: event.colno,
        },
        metadata: {
          type: event.type || promiseRejection.type,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      };

      this.trackError(errorDetails);
    };
  }

  /**
   * Install global error handlers
   */
  installGlobalHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.trackError(error, {
        category: 'system',
        severity: 'critical',
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.trackError(error, {
        category: 'system',
        severity: 'high',
      });
    });

    // Handle browser errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError(event.error, {
          category: 'system',
          severity: 'high',
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        this.trackError(error, {
          category: 'system',
          severity: 'high',
        });
      });
    }
  }

  /**
   * Start flush interval
   */
  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  /**
   * Get error statistics
   */
  getStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    queueSize: number;
  } {
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errorQueue.forEach(error => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorQueue.length,
      errorsByCategory,
      errorsBySeverity,
      queueSize: this.errorQueue.length,
    };
  }

  /**
   * Clear error queue
   */
  clearQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<ErrorTrackingOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): ErrorTrackingOptions {
    return { ...this.options };
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    this.flush();
  }
}

// Export singleton instance
export const errorTrackingService = new ErrorTrackingService();
export default errorTrackingService;