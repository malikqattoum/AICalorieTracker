import { Request, Response, NextFunction } from 'express';
import { log } from '../../vite';

export interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  userAgent: string;
  ip: string;
  userId?: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  requestId?: string;
  traceId?: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
}

export interface LoggingOptions {
  includeHeaders?: boolean;
  includeBody?: boolean;
  includeResponse?: boolean;
  maxBodySize?: number;
  maxResponseSize?: number;
  sensitiveFields?: string[];
  maskSensitiveData?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  sampleRate?: number;
  customLogFormatter?: (logEntry: LogEntry) => string;
}

interface RequestInfo {
  startTime: number;
  requestSize: number;
  requestId: string;
  traceId?: string;
}

class RequestLoggingService {
  private activeRequests = new Map<string, RequestInfo>();
  private options: Required<LoggingOptions>;
  private logQueue: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(options: LoggingOptions = {}) {
    this.options = {
      includeHeaders: false,
      includeBody: false,
      includeResponse: false,
      maxBodySize: 1024, // 1KB
      maxResponseSize: 1024, // 1KB
      sensitiveFields: ['password', 'token', 'authorization', 'credit_card', 'cvv'],
      maskSensitiveData: true,
      logLevel: 'info',
      sampleRate: 1, // 100% sampling
      customLogFormatter: (logEntry: LogEntry) => JSON.stringify(logEntry, null, 2),
      ...options,
    };

    this.startFlushInterval();
  }

  /**
   * Create logging middleware
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip logging if sampling rate doesn't match
      if (Math.random() > this.options.sampleRate) {
        return next();
      }

      const requestId = this.generateRequestId();
      const traceId = this.generateTraceId();
      
      // Store request info
      const requestInfo: RequestInfo = {
        startTime: Date.now(),
        requestSize: this.calculateRequestSize(req),
        requestId,
        traceId,
      };

      this.activeRequests.set(requestId, requestInfo);

      // Add request ID to response headers
      res.set('X-Request-ID', requestId);
      if (traceId) {
        res.set('X-Trace-ID', traceId);
      }

      // Monitor response
      const originalSend = res.send;
      res.send = function(data) {
        // Restore original send function
        res.send = originalSend;
        
        // Log the response
        loggingService.logResponse(req, res as any, requestId, traceId, data);
        
        // Call original send
        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Log response
   */
  logResponse(req: Request, res: Response, requestId: string, traceId?: string, responseData?: any) {
    const requestInfo = this.activeRequests.get(requestId);
    if (!requestInfo) {
      return;
    }

    const responseTime = Date.now() - requestInfo.startTime;
    const responseSize = this.calculateResponseSize(res, responseData);

    const logEntry: LogEntry = {
      id: requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.get('User-Agent') || '',
      ip: this.getClientIP(req),
      userId: (req as any).user?.id?.toString(),
      statusCode: res.statusCode,
      responseTime,
      requestSize: requestInfo.requestSize,
      responseSize,
      requestId,
      traceId,
      error: res.statusCode >= 400 ? this.extractError(responseData) : undefined,
      metadata: this.extractMetadata(req, res),
    };

    // Add to queue for batch processing
    this.logQueue.push(logEntry);

    // Log immediately for errors
    if (res.statusCode >= 400) {
      this.flushLogQueue();
    }
  }

  /**
   * Get active requests
   */
  getActiveRequests(): Array<{
    id: string;
    startTime: number;
    duration: number;
    method: string;
    url: string;
    ip: string;
  }> {
    const now = Date.now();
    return Array.from(this.activeRequests.entries()).map(([id, info]) => ({
      id,
      startTime: info.startTime,
      duration: now - info.startTime,
      method: '', // Would need to store this in request info
      url: '', // Would need to store this in request info
      ip: '', // Would need to store this in request info
    }));
  }

  /**
   * Get request statistics
   */
  getStats(): {
    totalRequests: number;
    activeRequests: number;
    averageResponseTime: number;
    errorRate: number;
    totalDataProcessed: number;
  } {
    // This would need to track historical data
    return {
      totalRequests: 0,
      activeRequests: this.activeRequests.size,
      averageResponseTime: 0,
      errorRate: 0,
      totalDataProcessed: 0,
    };
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate request size
   */
  private calculateRequestSize(req: Request): number {
    let size = 0;
    
    // Method and URL
    size += req.method.length + req.url.length;
    
    // Headers
    for (const [key, value] of Object.entries(req.headers)) {
      size += key.length + (value ? String(value).length : 0);
    }
    
    // Body (if included and within limits)
    if (req.body && this.options.includeBody) {
      const bodySize = JSON.stringify(req.body).length;
      size += Math.min(bodySize, this.options.maxBodySize!);
    }
    
    return size;
  }

  /**
   * Calculate response size
   */
  private calculateResponseSize(res: Response, responseData?: any): number {
    let size = 0;
    
    // Status code
    size += res.statusCode.toString().length;
    
    // Headers
    for (const [key, value] of Object.entries(res.getHeaders() || {})) {
      size += key.length + (value ? String(value).length : 0);
    }
    
    // Body (if included and within limits)
    if (responseData && this.options.includeResponse) {
      const responseSize = JSON.stringify(responseData).length;
      size += Math.min(responseSize, this.options.maxResponseSize!);
    }
    
    return size;
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string) || 
           (req.headers['x-real-ip'] as string) || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           'unknown';
  }

  /**
   * Extract error information
   */
  private extractError(responseData: any): { message: string; stack?: string; code?: string } | undefined {
    if (!responseData) return undefined;
    
    if (responseData instanceof Error) {
      return {
        message: responseData.message,
        stack: responseData.stack,
        code: (responseData as any).code,
      };
    }
    
    if (typeof responseData === 'object') {
      return {
        message: responseData.message || responseData.error || 'Unknown error',
        stack: responseData.stack,
        code: responseData.code,
      };
    }
    
    return {
      message: String(responseData),
    };
  }

  /**
   * Extract metadata
   */
  private extractMetadata(req: Request, res: Response): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    // Add request metadata
    if (this.options.includeHeaders) {
      metadata.headers = this.sanitizeData(req.headers);
    }
    
    if (this.options.includeBody && req.body) {
      metadata.body = this.sanitizeData(req.body);
    }
    
    // Add response metadata
    if (this.options.includeResponse) {
      metadata.responseHeaders = this.sanitizeData(res.getHeaders());
    }
    
    // Add custom metadata
    if ((req as any).metadata) {
      metadata.custom = (req as any).metadata;
    }
    
    return metadata;
  }

  /**
   * Sanitize sensitive data
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    for (const key of this.options.sensitiveFields!) {
      if (key in sanitized) {
        sanitized[key] = this.maskSensitiveData(sanitized[key]);
      }
    }
    
    return sanitized;
  }

  /**
   * Mask sensitive data
   */
  private maskSensitiveData(value: any): any {
    if (typeof value === 'string' && value.length > 4) {
      return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
    }
    return '***';
  }

  /**
   * Start flush interval
   */
  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    this.flushInterval = setInterval(() => {
      this.flushLogQueue();
    }, 5000); // Flush every 5 seconds

    log('Started request logging flush interval');
  }

  /**
   * Flush log queue
   */
  private flushLogQueue(): void {
    if (this.logQueue.length === 0) {
      return;
    }

    const logsToFlush = [...this.logQueue];
    this.logQueue = [];

    // Process logs
    for (const logEntry of logsToFlush) {
      this.processLogEntry(logEntry);
    }

    log(`Flushed ${logsToFlush.length} log entries`);
  }

  /**
   * Process individual log entry
   */
  private processLogEntry(logEntry: LogEntry): void {
    // Format log entry
    let formattedLog: string;
    
    if (this.options.customLogFormatter) {
      formattedLog = this.options.customLogFormatter(logEntry);
    } else {
      formattedLog = this.defaultLogFormatter(logEntry);
    }

    // Log based on level
    switch (this.options.logLevel) {
      case 'debug':
        console.log(formattedLog);
        break;
      case 'info':
        console.log(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
        console.error(formattedLog);
        break;
    }
  }

  /**
   * Default log formatter
   */
  private defaultLogFormatter(logEntry: LogEntry): string {
    const { id, timestamp, method, url, statusCode, responseTime, ip, userId } = logEntry;
    
    let logMessage = `[${timestamp}] ${method} ${url} - ${statusCode} (${responseTime}ms)`;
    
    if (userId) {
      logMessage += ` [User: ${userId}]`;
    }
    
    logMessage += ` [IP: ${ip}] [ID: ${id}]`;
    
    if (logEntry.error) {
      logMessage += ` ERROR: ${logEntry.error.message}`;
    }
    
    return logMessage;
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush remaining logs
    this.flushLogQueue();
    
    // Clear active requests
    this.activeRequests.clear();
    
    log('Request logging service cleaned up');
  }
}

// Export singleton instance
export const loggingService = new RequestLoggingService();
export default loggingService;