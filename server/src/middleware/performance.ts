import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface PerformanceMetrics {
  requestTime: number;
  memoryUsage: number;
  responseTime: number;
  statusCode: number;
  method: string;
  url: string;
  userAgent?: string;
  userId?: number;
}

export interface PerformanceThresholds {
  slowRequestThreshold: number; // ms
  memoryThreshold: number; // MB
  errorRateThreshold: number; // percentage
}

// Default performance thresholds
const defaultThresholds: PerformanceThresholds = {
  slowRequestThreshold: 5000, // 5 seconds
  memoryThreshold: 500, // 500 MB
  errorRateThreshold: 5 // 5%
};

// Performance monitoring middleware
export function performanceMonitoring(thresholds: PerformanceThresholds = defaultThresholds) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    // Track response time
    res.on('finish', () => {
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      const metrics: PerformanceMetrics = {
        requestTime: startTime,
        memoryUsage: Math.round((endMemory - startMemory) / 1024 / 1024), // Convert to MB
        responseTime: endTime - startTime,
        statusCode: res.statusCode,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id
      };

      // Log performance metrics
      logPerformanceMetrics(metrics);

      // Check for performance issues
      checkPerformanceIssues(metrics, thresholds);
    });

    next();
  };
}

// Log performance metrics
function logPerformanceMetrics(metrics: PerformanceMetrics): void {
  const logData = {
    timestamp: new Date(metrics.requestTime).toISOString(),
    method: metrics.method,
    url: metrics.url,
    responseTime: metrics.responseTime,
    memoryUsage: metrics.memoryUsage,
    statusCode: metrics.statusCode,
    userId: metrics.userId
  };

  // Log based on performance level
  if (metrics.responseTime > 5000) {
    logger.warn('Slow request detected', logData);
  } else if (metrics.statusCode >= 400) {
    logger.warn('HTTP error response', logData);
  } else {
    logger.info('Request processed', logData);
  }
}

// Check for performance issues and alert
function checkPerformanceIssues(metrics: PerformanceMetrics, thresholds: PerformanceThresholds): void {
  // Check for slow requests
  if (metrics.responseTime > thresholds.slowRequestThreshold) {
    logger.error('Performance alert: Slow request', {
      url: metrics.url,
      responseTime: metrics.responseTime,
      threshold: thresholds.slowRequestThreshold,
      method: metrics.method,
      userId: metrics.userId
    });
  }

  // Check for high memory usage
  if (metrics.memoryUsage > thresholds.memoryThreshold) {
    logger.error('Performance alert: High memory usage', {
      memoryUsage: metrics.memoryUsage,
      threshold: thresholds.memoryThreshold,
      url: metrics.url,
      method: metrics.method
    });
  }

  // Check for error rates (this would need to be tracked over time)
  if (metrics.statusCode >= 500) {
    logger.error('Performance alert: Server error', {
      statusCode: metrics.statusCode,
      url: metrics.url,
      method: metrics.method,
      userId: metrics.userId
    });
  }
}

// Database query performance monitoring
export function databaseQueryMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const queryStart = Date.now();
    
    // Monkey patch the response object to track database queries
    const originalEnd = res.end;
    res.end = function(this: Response, chunk?: any, encoding?: any): Response<any, Record<string, any>> {
      const queryEnd = Date.now();
      const queryDuration = queryEnd - queryStart;
      
      if (queryDuration > 1000) { // Log queries taking longer than 1 second
        logger.warn('Slow database query', {
          duration: queryDuration,
          url: req.url,
          method: req.method,
          userId: (req as any).user?.id
        });
      }
      
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

// AI service performance monitoring
export function aiServiceMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const aiStart = Date.now();
    
    // Track AI service calls
    res.on('finish', () => {
      const aiEnd = Date.now();
      const aiDuration = aiEnd - aiStart;
      
      if (aiDuration > 30000) { // Log AI calls taking longer than 30 seconds
        logger.warn('Slow AI service call', {
          duration: aiDuration,
          url: req.url,
          method: req.method,
          userId: (req as any).user?.id
        });
      }
    });

    next();
  };
}

// Real-time performance metrics collector
export class PerformanceCollector {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;

  addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Maintain metric limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const totalTime = this.metrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return Math.round(totalTime / this.metrics.length);
  }

  getErrorRate(): number {
    if (this.metrics.length === 0) return 0;
    
    const errorCount = this.metrics.filter(metric => metric.statusCode >= 400).length;
    return Math.round((errorCount / this.metrics.length) * 100);
  }

  getMemoryUsage(): number {
    if (this.metrics.length === 0) return 0;
    
    const totalMemory = this.metrics.reduce((sum, metric) => sum + metric.memoryUsage, 0);
    return Math.round(totalMemory / this.metrics.length);
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  getMetricsByEndpoint(): Record<string, {
    count: number;
    avgResponseTime: number;
    errorRate: number;
  }> {
    const endpointStats: Record<string, {
      count: number;
      totalTime: number;
      errorCount: number;
    }> = {};

    this.metrics.forEach(metric => {
      const endpoint = `${metric.method} ${metric.url}`;
      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = {
          count: 0,
          totalTime: 0,
          errorCount: 0
        };
      }

      endpointStats[endpoint].count++;
      endpointStats[endpoint].totalTime += metric.responseTime;
      if (metric.statusCode >= 400) {
        endpointStats[endpoint].errorCount++;
      }
    });

    const result: Record<string, {
      count: number;
      avgResponseTime: number;
      errorRate: number;
    }> = {};

    for (const [endpoint, stats] of Object.entries(endpointStats)) {
      result[endpoint] = {
        count: stats.count,
        avgResponseTime: Math.round(stats.totalTime / stats.count),
        errorRate: Math.round((stats.errorCount / stats.count) * 100)
      };
    }

    return result;
  }
}

// Global performance collector instance
export const performanceCollector = new PerformanceCollector();

// Performance metrics endpoint for monitoring
export function performanceMetricsEndpoint(req: Request, res: Response): void {
  const metrics = performanceCollector.getMetrics();
  
  res.json({
    timestamp: new Date().toISOString(),
    totalRequests: metrics.length,
    averageResponseTime: performanceCollector.getAverageResponseTime(),
    errorRate: performanceCollector.getErrorRate(),
    averageMemoryUsage: performanceCollector.getMemoryUsage(),
    metricsByEndpoint: performanceCollector.getMetricsByEndpoint(),
    recentMetrics: metrics.slice(-10) // Last 10 requests
  });
}

// Health check endpoint for performance
export function performanceHealthCheck(req: Request, res: Response): void {
  const thresholds = defaultThresholds;
  const metrics = performanceCollector.getMetrics();
  
  if (metrics.length === 0) {
    return res.json({
      status: 'healthy',
      message: 'No performance data available',
      timestamp: new Date().toISOString()
    });
  }

  const avgResponseTime = performanceCollector.getAverageResponseTime();
  const errorRate = performanceCollector.getErrorRate();
  const avgMemoryUsage = performanceCollector.getMemoryUsage();

  const issues: string[] = [];

  if (avgResponseTime > thresholds.slowRequestThreshold) {
    issues.push(`Average response time (${avgResponseTime}ms) exceeds threshold (${thresholds.slowRequestThreshold}ms)`);
  }

  if (errorRate > thresholds.errorRateThreshold) {
    issues.push(`Error rate (${errorRate}%) exceeds threshold (${thresholds.errorRateThreshold}%)`);
  }

  if (avgMemoryUsage > thresholds.memoryThreshold) {
    issues.push(`Average memory usage (${avgMemoryUsage}MB) exceeds threshold (${thresholds.memoryThreshold}MB)`);
  }

  if (issues.length === 0) {
    res.json({
      status: 'healthy',
      message: 'All performance metrics within acceptable ranges',
      timestamp: new Date().toISOString(),
      metrics: {
        averageResponseTime: avgResponseTime,
        errorRate: errorRate,
        averageMemoryUsage: avgMemoryUsage
      }
    });
  } else {
    res.status(503).json({
      status: 'degraded',
      message: 'Performance issues detected',
      timestamp: new Date().toISOString(),
      issues,
      metrics: {
        averageResponseTime: avgResponseTime,
        errorRate: errorRate,
        averageMemoryUsage: avgMemoryUsage
      }
    });
  }
}

// Export default performance monitoring middleware
export default performanceMonitoring;