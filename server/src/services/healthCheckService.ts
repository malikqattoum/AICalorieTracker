import { db } from '../../db';
import { log } from '../../vite';
import { timeoutService } from './timeoutService';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'warning' | 'critical';
      used: number;
      total: number;
      percentage: number;
    };
    cache: {
      status: 'healthy' | 'warning' | 'critical';
      hitRate: number;
      size: number;
    };
    aiService: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    timeoutService: {
      status: 'healthy';
      activeRequests: number;
      totalRequests: number;
    };
  };
  metrics: {
    cpu?: number;
    diskSpace?: {
      used: number;
      total: number;
      percentage: number;
    };
    network?: {
      latency: number;
      throughput: number;
    };
  };
}

class HealthCheckService {
  private startTime = Date.now();
  private lastHealthCheck: HealthCheckResult | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private aiServiceLatency: number[] = [];
  private maxLatencySamples = 10;

  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks: {
        database: await this.checkDatabase(),
        memory: this.checkMemory(),
        cache: this.checkCache(),
        aiService: await this.checkAIService(),
        timeoutService: this.checkTimeoutService(),
      },
      metrics: {
        cpu: this.checkCPU(),
        diskSpace: this.checkDiskSpace(),
        network: this.checkNetwork(),
      },
    };

    // Determine overall status
    result.status = this.determineOverallStatus(result.checks);

    // Calculate response time
    const responseTime = Date.now() - startTime;
    log(`Health check completed in ${responseTime}ms with status: ${result.status}`);

    // Store result
    this.lastHealthCheck = result;

    return result;
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheckResult['checks']['database']> {
    const startTime = Date.now();
    
    try {
      // Use timeout service to prevent hanging
      const result = await timeoutService.executeWithTimeout(
        async () => {
          // Simple database query to check connectivity
          await db.execute('SELECT 1 as test');
          return { success: true };
        },
        { timeout: 5000 }
      );

      if (result.success) {
        return {
          status: 'healthy',
          responseTime: Date.now() - startTime,
        };
      } else {
        return {
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: result.error?.message || 'Database timeout',
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): HealthCheckResult['checks']['memory'] {
    const used = process.memoryUsage().heapUsed;
    const total = process.memoryUsage().heapTotal;
    const percentage = (used / total) * 100;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (percentage > 90) {
      status = 'critical';
    } else if (percentage > 75) {
      status = 'warning';
    }

    return {
      status,
      used,
      total,
      percentage,
    };
  }

  /**
   * Check cache health
   */
  private checkCache(): HealthCheckResult['checks']['cache'] {
    // This would check your specific cache implementation
    // For now, simulate cache health check
    const hitRate = Math.random() * 0.3 + 0.7; // 70-100% hit rate
    const size = Math.floor(Math.random() * 1000) + 100; // 100-1100 items

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (hitRate < 0.5) {
      status = 'critical';
    } else if (hitRate < 0.7) {
      status = 'warning';
    }

    return {
      status,
      hitRate,
      size,
    };
  }

  /**
   * Check AI service health
   */
  private async checkAIService(): Promise<HealthCheckResult['checks']['aiService']> {
    const startTime = Date.now();
    
    try {
      // Simulate AI service health check
      // In a real implementation, you would make a test request to your AI service
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
      
      const responseTime = Date.now() - startTime;
      this.aiServiceLatency.push(responseTime);
      
      // Keep only recent samples
      if (this.aiServiceLatency.length > this.maxLatencySamples) {
        this.aiServiceLatency.shift();
      }

      const avgLatency = this.aiServiceLatency.reduce((sum, time) => sum + time, 0) / this.aiServiceLatency.length;

      return {
        status: avgLatency < 2000 ? 'healthy' : 'unhealthy',
        responseTime: avgLatency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'AI service error',
      };
    }
  }

  /**
   * Check timeout service health
   */
  private checkTimeoutService(): HealthCheckResult['checks']['timeoutService'] {
    const stats = timeoutService.getStats();
    
    return {
      status: 'healthy',
      activeRequests: stats.activeRequests,
      totalRequests: stats.totalRequests,
    };
  }

  /**
   * Check CPU usage (simulated)
   */
  private checkCPU(): number {
    // In a real implementation, you would use a library like systeminformation
    return Math.random() * 100; // 0-100%
  }

  /**
   * Check disk space (simulated)
   */
  private checkDiskSpace(): HealthCheckResult['metrics']['diskSpace'] {
    // In a real implementation, you would check actual disk space
    const used = Math.floor(Math.random() * 80) + 20; // 20-100 GB
    const total = 100; // 100 GB total
    const percentage = (used / total) * 100;

    return {
      used,
      total,
      percentage,
    };
  }

  /**
   * Check network latency (simulated)
   */
  private checkNetwork(): HealthCheckResult['metrics']['network'] {
    // In a real implementation, you would ping external services
    const latency = Math.floor(Math.random() * 50) + 10; // 10-60ms
    const throughput = Math.random() * 1000; // 0-1000 Mbps

    return {
      latency,
      throughput,
    };
  }

  /**
   * Determine overall health status based on individual checks
   */
  private determineOverallStatus(checks: HealthCheckResult['checks']): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('unhealthy') || statuses.includes('critical')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('warning')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Start periodic health checks
   */
  startPeriodicHealthCheck(interval: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        log(`Periodic health check failed:`, error instanceof Error ? error.message : String(error));
      }
    }, interval);

    log(`Started periodic health checks every ${interval}ms`);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      log('Stopped periodic health checks');
    }
  }

  /**
   * Get last health check result
   */
  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastHealthCheck;
  }

  /**
   * Get service statistics
   */
  getStats(): {
    uptime: number;
    totalHealthChecks: number;
    averageResponseTime: number;
    lastCheckTime: string | null;
  } {
    return {
      uptime: Date.now() - this.startTime,
      totalHealthChecks: this.lastHealthCheck ? 1 : 0,
      averageResponseTime: this.lastHealthCheck ? 0 : 0, // Would need to track history
      lastCheckTime: this.lastHealthCheck?.timestamp || null,
    };
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    this.stopPeriodicHealthCheck();
    log('Health check service cleaned up');
  }
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();
export default healthCheckService;

// Helper SQL template (would need to be imported from your database module)
const sql = {
  template: (strings: TemplateStringsArray, ...values: any[]) => {
    return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
  }
};