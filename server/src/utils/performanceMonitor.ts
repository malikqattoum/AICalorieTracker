import { config } from '../config';
import { Logger } from './logger';

// Performance metrics interface
export interface PerformanceMetrics {
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
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
    totalTime: number;
    averageTime: number;
  };
  externalApiCalls: {
    count: number;
    totalTime: number;
    averageTime: number;
    successRate: number;
  };
  aiServiceCalls: {
    count: number;
    totalTime: number;
    averageTime: number;
    successRate: number;
  };
  customMetrics?: Record<string, number>;
}

// Database query metrics
export interface DatabaseQueryMetrics {
  query: string;
  duration: number;
    success: boolean;
    timestamp: Date;
    table?: string;
    operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
}

// External API call metrics
export interface ExternalApiMetrics {
  service: string;
  endpoint: string;
  method: string;
  duration: number;
    success: boolean;
    statusCode?: number;
    timestamp: Date;
    size?: number;
}

// AI service call metrics
export interface AiServiceMetrics {
  service: string;
  model: string;
  endpoint: string;
  duration: number;
    success: boolean;
    tokensUsed?: number;
    timestamp: Date;
}

// Performance monitoring interface
export interface PerformanceMonitor {
  startTimer(label: string): () => void;
  recordMetric(metric: PerformanceMetrics): void;
  recordDatabaseQuery(query: DatabaseQueryMetrics): void;
  recordExternalApiCall(apiCall: ExternalApiMetrics): void;
  recordAiServiceCall(aiCall: AiServiceMetrics): void;
  getPerformanceStats(): Promise<PerformanceStats>;
  getSlowEndpoints(threshold: number): Promise<PerformanceMetrics[]>;
  getDatabaseStats(): Promise<DatabaseStats>;
  getExternalApiStats(): Promise<ExternalApiStats>;
  getAiServiceStats(): Promise<AiServiceStats>;
  clearMetrics(): void;
}

// Performance statistics
export interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  throughput: number;
  memoryUsage: {
    average: number;
    peak: number;
  };
  cpuUsage: {
    average: number;
    peak: number;
  };
  topEndpoints: Array<{
    endpoint: string;
    count: number;
    averageTime: number;
    errorRate: number;
  }>;
}

// Database statistics
export interface DatabaseStats {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  queriesByTable: Record<string, number>;
  queriesByOperation: Record<string, number>;
  slowestQueries: Array<{
    query: string;
    duration: number;
    timestamp: Date;
  }>;
}

// External API statistics
export interface ExternalApiStats {
  totalCalls: number;
  averageCallTime: number;
  successRate: number;
  callsByService: Record<string, number>;
  slowestCalls: Array<{
    service: string;
    endpoint: string;
    duration: number;
    timestamp: Date;
  }>;
}

// AI service statistics
export interface AiServiceStats {
  totalCalls: number;
  averageCallTime: number;
  successRate: number;
  callsByService: Record<string, number>;
  tokensUsed: number;
  averageTokensPerCall: number;
  slowestCalls: Array<{
    service: string;
    model: string;
    duration: number;
    timestamp: Date;
  }>;
}

// Mock performance monitor implementation
export class MockPerformanceMonitor implements PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private databaseQueries: DatabaseQueryMetrics[] = [];
  private externalApiCalls: ExternalApiMetrics[] = [];
  private aiServiceCalls: AiServiceMetrics[] = [];
  private timers: Map<string, { start: number; metrics: Partial<PerformanceMetrics> }> = new Map();
  private maxMetrics = 10000;

  startTimer(label: string): () => void {
    const start = Date.now();
    const timer = { start, metrics: {} };
    this.timers.set(label, timer);

    return () => {
      const duration = Date.now() - start;
      const timerData = this.timers.get(label);
      if (timerData) {
        timerData.metrics.responseTime = duration;
        this.timers.delete(label);
      }
    };
  }

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Maintain metrics limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  recordDatabaseQuery(query: DatabaseQueryMetrics): void {
    this.databaseQueries.push(query);

    // Maintain queries limit
    if (this.databaseQueries.length > this.maxMetrics) {
      this.databaseQueries = this.databaseQueries.slice(-this.maxMetrics);
    }
  }

  recordExternalApiCall(apiCall: ExternalApiMetrics): void {
    this.externalApiCalls.push(apiCall);

    // Maintain API calls limit
    if (this.externalApiCalls.length > this.maxMetrics) {
      this.externalApiCalls = this.externalApiCalls.slice(-this.maxMetrics);
    }
  }

  recordAiServiceCall(aiCall: AiServiceMetrics): void {
    this.aiServiceCalls.push(aiCall);

    // Maintain AI calls limit
    if (this.aiServiceCalls.length > this.maxMetrics) {
      this.aiServiceCalls = this.aiServiceCalls.slice(-this.maxMetrics);
    }
  }

  async getPerformanceStats(): Promise<PerformanceStats> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get metrics from the last hour
    const recentMetrics = this.metrics.filter(metric => 
      metric.timestamp >= oneHourAgo
    );

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        memoryUsage: { average: 0, peak: 0 },
        cpuUsage: { average: 0, peak: 0 },
        topEndpoints: []
      };
    }

    // Calculate response times
    const responseTimes = recentMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)];

    // Calculate error rate
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / recentMetrics.length) * 100;

    // Calculate throughput (requests per second)
    const throughput = recentMetrics.length / 3600; // 1 hour in seconds

    // Calculate memory and CPU usage
    const memoryUsages = recentMetrics.map(m => m.memoryUsage.percentage);
    const cpuUsages = recentMetrics.map(m => m.cpuUsage.user + m.cpuUsage.system);

    const memoryUsage = {
      average: memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length,
      peak: Math.max(...memoryUsages)
    };

    const cpuUsage = {
      average: cpuUsages.reduce((sum, usage) => sum + usage, 0) / cpuUsages.length,
      peak: Math.max(...cpuUsages)
    };

    // Get top endpoints
    const endpointStats = new Map<string, { count: number; totalTime: number; errors: number }>();
    recentMetrics.forEach(metric => {
      const stats = endpointStats.get(metric.endpoint) || { count: 0, totalTime: 0, errors: 0 };
      stats.count++;
      stats.totalTime += metric.responseTime;
      if (metric.statusCode >= 400) stats.errors++;
      endpointStats.set(metric.endpoint, stats);
    });

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        averageTime: stats.totalTime / stats.count,
        errorRate: (stats.errors / stats.count) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests: recentMetrics.length,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      errorRate,
      throughput,
      memoryUsage,
      cpuUsage,
      topEndpoints
    };
  }

  async getSlowEndpoints(threshold: number): Promise<PerformanceMetrics[]> {
    return this.metrics
      .filter(metric => metric.responseTime > threshold)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 50);
  }

  async getDatabaseStats(): Promise<DatabaseStats> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentQueries = this.databaseQueries.filter(query => 
      query.timestamp >= oneHourAgo
    );

    if (recentQueries.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        queriesByTable: {},
        queriesByOperation: {},
        slowestQueries: []
      };
    }

    // Calculate statistics
    const averageQueryTime = recentQueries.reduce((sum, query) => sum + query.duration, 0) / recentQueries.length;
    const slowQueries = recentQueries.filter(query => query.duration > 1000).length;

    // Group by table
    const queriesByTable: Record<string, number> = {};
    recentQueries.forEach(query => {
      if (query.table) {
        queriesByTable[query.table] = (queriesByTable[query.table] || 0) + 1;
      }
    });

    // Group by operation
    const queriesByOperation: Record<string, number> = {};
    recentQueries.forEach(query => {
      if (query.operation) {
        queriesByOperation[query.operation] = (queriesByOperation[query.operation] || 0) + 1;
      }
    });

    // Get slowest queries
    const slowestQueries = recentQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalQueries: recentQueries.length,
      averageQueryTime,
      slowQueries,
      queriesByTable,
      queriesByOperation,
      slowestQueries
    };
  }

  async getExternalApiStats(): Promise<ExternalApiStats> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentCalls = this.externalApiCalls.filter(call => 
      call.timestamp >= oneHourAgo
    );

    if (recentCalls.length === 0) {
      return {
        totalCalls: 0,
        averageCallTime: 0,
        successRate: 0,
        callsByService: {},
        slowestCalls: []
      };
    }

    // Calculate statistics
    const averageCallTime = recentCalls.reduce((sum, call) => sum + call.duration, 0) / recentCalls.length;
    const successCalls = recentCalls.filter(call => call.success).length;
    const successRate = (successCalls / recentCalls.length) * 100;

    // Group by service
    const callsByService: Record<string, number> = {};
    recentCalls.forEach(call => {
      callsByService[call.service] = (callsByService[call.service] || 0) + 1;
    });

    // Get slowest calls
    const slowestCalls = recentCalls
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalCalls: recentCalls.length,
      averageCallTime,
      successRate,
      callsByService,
      slowestCalls
    };
  }

  async getAiServiceStats(): Promise<AiServiceStats> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentCalls = this.aiServiceCalls.filter(call => 
      call.timestamp >= oneHourAgo
    );

    if (recentCalls.length === 0) {
      return {
        totalCalls: 0,
        averageCallTime: 0,
        successRate: 0,
        callsByService: {},
        tokensUsed: 0,
        averageTokensPerCall: 0,
        slowestCalls: []
      };
    }

    // Calculate statistics
    const averageCallTime = recentCalls.reduce((sum, call) => sum + call.duration, 0) / recentCalls.length;
    const successCalls = recentCalls.filter(call => call.success).length;
    const successRate = (successCalls / recentCalls.length) * 100;
    const totalTokensUsed = recentCalls.reduce((sum, call) => sum + (call.tokensUsed || 0), 0);
    const averageTokensPerCall = totalTokensUsed / recentCalls.length;

    // Group by service
    const callsByService: Record<string, number> = {};
    recentCalls.forEach(call => {
      callsByService[call.service] = (callsByService[call.service] || 0) + 1;
    });

    // Get slowest calls
    const slowestCalls = recentCalls
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalCalls: recentCalls.length,
      averageCallTime,
      successRate,
      callsByService,
      tokensUsed: totalTokensUsed,
      averageTokensPerCall,
      slowestCalls
    };
  }

  clearMetrics(): void {
    this.metrics = [];
    this.databaseQueries = [];
    this.externalApiCalls = [];
    this.aiServiceCalls = [];
    this.timers.clear();
  }
}

// Real performance monitor implementation (using Prometheus or similar)
export class PrometheusPerformanceMonitor implements PerformanceMonitor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  startTimer(label: string): () => void {
    // In a real implementation, this would start a Prometheus timer
    this.logger.debug(`Performance timer started: ${label}`);
    return () => {
      this.logger.debug(`Performance timer stopped: ${label}`);
    };
  }

  recordMetric(metric: PerformanceMetrics): void {
    // In a real implementation, this would record metrics to Prometheus
    this.logger.debug('Performance metric recorded', metric);
  }

  recordDatabaseQuery(query: DatabaseQueryMetrics): void {
    // In a real implementation, this would record database metrics
    this.logger.debug('Database query recorded', query);
  }

  recordExternalApiCall(apiCall: ExternalApiMetrics): void {
    // In a real implementation, this would record external API metrics
    this.logger.debug('External API call recorded', apiCall);
  }

  recordAiServiceCall(aiCall: AiServiceMetrics): void {
    // In a real implementation, this would record AI service metrics
    this.logger.debug('AI service call recorded', aiCall);
  }

  async getPerformanceStats(): Promise<PerformanceStats> {
    // This would query Prometheus API in a real implementation
    this.logger.debug('Getting performance stats');
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      memoryUsage: { average: 0, peak: 0 },
      cpuUsage: { average: 0, peak: 0 },
      topEndpoints: []
    };
  }

  async getSlowEndpoints(threshold: number): Promise<PerformanceMetrics[]> {
    // This would query Prometheus API in a real implementation
    this.logger.debug(`Getting slow endpoints (threshold: ${threshold}ms)`);
    return [];
  }

  async getDatabaseStats(): Promise<DatabaseStats> {
    // This would query Prometheus API in a real implementation
    this.logger.debug('Getting database stats');
    return {
      totalQueries: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      queriesByTable: {},
      queriesByOperation: {},
      slowestQueries: []
    };
  }

  async getExternalApiStats(): Promise<ExternalApiStats> {
    // This would query Prometheus API in a real implementation
    this.logger.debug('Getting external API stats');
    return {
      totalCalls: 0,
      averageCallTime: 0,
      successRate: 0,
      callsByService: {},
      slowestCalls: []
    };
  }

  async getAiServiceStats(): Promise<AiServiceStats> {
    // This would query Prometheus API in a real implementation
    this.logger.debug('Getting AI service stats');
    return {
      totalCalls: 0,
      averageCallTime: 0,
      successRate: 0,
      callsByService: {},
      tokensUsed: 0,
      averageTokensPerCall: 0,
      slowestCalls: []
    };
  }

  clearMetrics(): void {
    // This would clear Prometheus metrics in a real implementation
    this.logger.debug('Performance metrics cleared');
  }
}

// Factory function to create performance monitor
export function createPerformanceMonitor(logger: Logger): PerformanceMonitor {
  if (config.monitoring.prometheus?.enabled) {
    return new PrometheusPerformanceMonitor(logger);
  }
  return new MockPerformanceMonitor();
}

// Performance monitoring middleware
export function performanceMonitoringMiddleware(performanceMonitor: PerformanceMonitor, logger: Logger) {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Record request start
    logger.http(`Request started: ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });

    // Monitor response
    res.on('finish', () => {
      const duration = Date.now() - start;
      const cpuUsageEnd = process.cpuUsage(cpuUsage);

      // Record performance metric
      const metric: PerformanceMetrics = {
        timestamp: new Date(),
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: duration,
        memoryUsage: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        },
        cpuUsage: {
          user: cpuUsageEnd.user,
          system: cpuUsageEnd.system
        },
        databaseQueries: {
          count: 0, // This would be populated by database middleware
          totalTime: 0,
          averageTime: 0
        },
        externalApiCalls: {
          count: 0, // This would be populated by API middleware
          totalTime: 0,
          averageTime: 0,
          successRate: 100
        },
        aiServiceCalls: {
          count: 0, // This would be populated by AI middleware
          totalTime: 0,
          averageTime: 0,
          successRate: 100
        }
      };

      performanceMonitor.recordMetric(metric);

      // Log performance
      logger.performance(`${req.method} ${req.path}`, duration, {
        statusCode: res.statusCode,
        memoryUsage: metric.memoryUsage.percentage,
        cpuUsage: metric.cpuUsage.user + metric.cpuUsage.system
      });
    });

    next();
  };
}

// Export default performance monitor
export const defaultPerformanceMonitor = createPerformanceMonitor(new Logger('PerformanceMonitor'));