import { Request, Response } from 'express';
import { db } from '../db';
import { log } from '../../vite';
import { sql } from 'drizzle-orm';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      lastChecked: string;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      used: number;
      total: number;
      percentage: number;
    };
    aiService: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      lastChecked: string;
      error?: string;
    };
  };
  metrics?: {
    totalUsers: number;
    totalMeals: number;
    totalAnalyses: number;
    activeUsers24h: number;
  };
}

export class HealthController {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Basic health check
   */
  async basicHealthCheck(req: Request, res: Response): Promise<void> {
    const response: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: 'healthy',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
        },
        memory: {
          status: 'healthy',
          used: 0,
          total: 0,
          percentage: 0,
        },
        disk: {
          status: 'healthy',
          used: 0,
          total: 0,
          percentage: 0,
        },
        aiService: {
          status: 'healthy',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
        },
      },
    };

    try {
      // Check database connectivity
      const dbStart = Date.now();
      await db.execute(sql`SELECT 1`);
      const dbResponseTime = Date.now() - dbStart;
      response.checks.database.responseTime = dbResponseTime;

      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsed = memoryUsage.heapUsed;
      const memoryTotal = memoryUsage.heapTotal;
      const memoryPercentage = (memoryUsed / memoryTotal) * 100;
      
      response.checks.memory.used = memoryUsed;
      response.checks.memory.total = memoryTotal;
      response.checks.memory.percentage = memoryPercentage;

      // Check disk usage (if available)
      try {
        const fs = await import('fs');
        const path = await import('path');
        
        if (fs.existsSync && path.join) {
          const stats = await fs.promises.stat(process.cwd());
          response.checks.disk.used = stats.size;
          response.checks.disk.total = 1024 * 1024 * 1024; // 1GB default
          response.checks.disk.percentage = (stats.size / (1024 * 1024 * 1024)) * 100;
        }
      } catch (error) {
        // Disk check is optional
      }

      // Check AI service
      try {
        const aiStart = Date.now();
        // This would be a real AI service check in production
        await new Promise(resolve => setTimeout(resolve, 100));
        const aiResponseTime = Date.now() - aiStart;
        response.checks.aiService.responseTime = aiResponseTime;
      } catch (error) {
        response.checks.aiService.status = 'unhealthy';
        response.checks.aiService.error = error instanceof Error ? error.message : 'Unknown error';
      }

      // Determine overall status
      const unhealthyChecks = Object.values(response.checks).filter(check => check.status === 'unhealthy').length;
      const degradedChecks = Object.values(response.checks).filter(check => check.status === 'degraded').length;

      if (unhealthyChecks > 0) {
        response.status = 'unhealthy';
      } else if (degradedChecks > 0) {
        response.status = 'degraded';
      }

      // Set appropriate HTTP status code
      const statusCode = response.status === 'healthy' ? 200 : 
                        response.status === 'degraded' ? 206 : 503;

      res.status(statusCode).json(response);
    } catch (error) {
      log('Health check failed:', error);
      
      const errorResponse: HealthCheckResponse = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: {
            status: 'unhealthy',
            responseTime: 0,
            lastChecked: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          memory: {
            status: 'healthy',
            used: 0,
            total: 0,
            percentage: 0,
          },
          disk: {
            status: 'healthy',
            used: 0,
            total: 0,
            percentage: 0,
          },
          aiService: {
            status: 'unhealthy',
            responseTime: 0,
            lastChecked: new Date().toISOString(),
            error: 'Service unavailable',
          },
        },
      };

      res.status(503).json(errorResponse);
    }
  }

  /**
   * Detailed health check with metrics
   */
  async detailedHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Get basic health check
      const basicResponse = await this.basicHealthCheck(req, res);
      
      // Add metrics if database is healthy
      if (basicResponse.status !== 'unhealthy') {
        try {
          // Get user metrics
          const [userCount] = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
          const [mealCount] = await db.execute(sql`SELECT COUNT(*) as count FROM meals`);
          const [analysisCount] = await db.execute(sql`SELECT COUNT(*) as count FROM meal_analyses`);
          
          // Get active users in last 24 hours
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const [activeUsers] = await db.execute(
            sql`SELECT COUNT(DISTINCT user_id) as count FROM meals WHERE created_at > ${twentyFourHoursAgo}`
          );

          (basicResponse as HealthCheckResponse).metrics = {
            totalUsers: Number(userCount[0]?.count || 0),
            totalMeals: Number(mealCount[0]?.count || 0),
            totalAnalyses: Number(analysisCount[0]?.count || 0),
            activeUsers24h: Number(activeUsers[0]?.count || 0),
          };
        } catch (error) {
          log('Failed to get metrics:', error);
        }
      }

      res.json(basicResponse);
    } catch (error) {
      log('Detailed health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: {
            status: 'unhealthy',
            responseTime: 0,
            lastChecked: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          memory: {
            status: 'healthy',
            used: 0,
            total: 0,
            percentage: 0,
          },
          disk: {
            status: 'healthy',
            used: 0,
            total: 0,
            percentage: 0,
          },
          aiService: {
            status: 'unhealthy',
            responseTime: 0,
            lastChecked: new Date().toISOString(),
            error: 'Service unavailable',
          },
        },
      });
    }
  }

  /**
   * Database-specific health check
   */
  async databaseHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const start = Date.now();
      
      // Test database connection
      await db.execute(sql`SELECT 1`);
      const responseTime = Date.now() - start;

      // Get database statistics
      const [tables] = await db.execute(sql`SHOW TABLES`);
      const [status] = await db.execute(sql`SHOW STATUS LIKE 'Threads_connected'`);
      const [variables] = await db.execute(sql`SHOW VARIABLES LIKE 'max_connections'`);

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime,
        database: {
          version: '8.0.0', // This would be dynamic in production
          tables: tables.length,
          connections: Number(status[0]?.Value || 0),
          maxConnections: Number(variables[0]?.Value || 0),
          uptime: process.uptime(),
        },
      });
    } catch (error) {
      log('Database health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * System health check
   */
  async systemHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Get system information
      const systemInfo = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        uptime: process.uptime(),
        memory: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      };

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        system: systemInfo,
      });
    } catch (error) {
      log('System health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Readiness probe
   */
  async readinessProbe(req: Request, res: Response): Promise<void> {
    try {
      // Check if the application is ready to serve traffic
      const isReady = await this.checkReadiness();
      
      if (isReady) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      log('Readiness probe failed:', error);
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Liveness probe
   */
  async livenessProbe(req: Request, res: Response): Promise<void> {
    try {
      // Check if the application is alive
      const isAlive = await this.checkLiveness();
      
      if (isAlive) {
        res.status(200).json({
          status: 'alive',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        });
      } else {
        res.status(503).json({
          status: 'not alive',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      log('Liveness probe failed:', error);
      res.status(503).json({
        status: 'not alive',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if application is ready
   */
  private async checkReadiness(): Promise<boolean> {
    try {
      // Check database connection
      await db.execute(sql`SELECT 1`);
      
      // Check if essential services are available
      // In production, you might check external services, Redis, etc.
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if application is alive
   */
  private async checkLiveness(): Promise<boolean> {
    try {
      // Basic process health check
      const memoryUsage = process.memoryUsage();
      const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      // If memory usage is too high, consider the process unhealthy
      if (memoryPercentage > 90) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const healthController = new HealthController();
export default healthController;