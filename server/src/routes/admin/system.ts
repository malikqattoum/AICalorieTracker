import { Router } from 'express';
import { isAdmin } from '../../middleware/auth';
import os from 'os';
import { performance } from 'perf_hooks';
import fs from 'fs';
import { promisify } from 'util';

const router = Router();
const readFile = promisify(fs.readFile);

// Middleware to protect all admin system routes
router.use(isAdmin);

// Mock data stores for system monitoring
let systemAlerts: any[] = [
  {
    id: 'alert_1',
    type: 'performance',
    severity: 'high',
    title: 'High Memory Usage Detected',
    message: 'System memory usage has exceeded 85% threshold',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    resolved: false
  },
  {
    id: 'alert_2',
    type: 'security',
    severity: 'medium',
    title: 'Multiple Failed Login Attempts',
    message: 'Detected 15 failed login attempts from IP 192.168.1.100',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    resolved: false
  }
];

let systemLogs: any[] = [
  {
    id: 'log_1',
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'web-server',
    message: 'Server started successfully on port 3000',
    metadata: { port: 3000, env: 'production' }
  },
  {
    id: 'log_2',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    level: 'warn',
    service: 'database',
    message: 'Database connection pool reached 80% capacity',
    metadata: { connections: 80, maxConnections: 100 }
  },
  {
    id: 'log_3',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    level: 'error',
    service: 'ai-service',
    message: 'OpenAI API rate limit exceeded',
    metadata: { provider: 'openai', remainingQuota: 0 }
  }
];

// System statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    // Get system information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = Math.round((usedMemory / totalMemory) * 100);

    // Get CPU usage (simplified)
    const cpuUsage = Math.round(Math.random() * 100); // In a real app, use proper CPU monitoring

    // Get disk usage (simplified)
    const diskUsage = Math.round(Math.random() * 100); // In a real app, use proper disk monitoring

    // Get uptime
    const uptime = os.uptime();
    const uptimeFormatted = formatUptime(uptime);

    // Mock active connections
    const activeConnections = Math.floor(Math.random() * 50) + 10;

    // Get user stats from database (you'll need to implement these queries)
    const totalUsers = 150; // Mock data - replace with actual DB query
    const activeUsers = 45; // Mock data
    const aiAnalysesCount = 2500; // Mock data

    const stats = {
      totalUsers,
      activeUsers,
      totalMeals: 1200, // Mock data
      aiAnalysesCount,
      systemUptime: uptimeFormatted,
      memoryUsage,
      cpuUsage,
      diskUsage,
      activeConnections
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ message: 'Failed to fetch system statistics' });
  }
});

// Error logs endpoint
router.get('/logs/errors', async (req, res) => {
  try {
    // In a real application, you'd fetch from a logging database or file
    const mockErrorLogs = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        level: 'error',
        message: 'AI service timeout: Request to OpenAI API failed',
        userId: 123
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        level: 'warning',
        message: 'High memory usage detected: 87%',
        userId: null
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        level: 'error',
        message: 'Database connection pool exhausted',
        userId: null
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        level: 'info',
        message: 'Scheduled backup completed successfully',
        userId: null
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        level: 'warning',
        message: 'Unusual number of failed login attempts detected',
        userId: 456
      }
    ];

    res.json(mockErrorLogs);
  } catch (error) {
    console.error('Error fetching error logs:', error);
    res.status(500).json({ message: 'Failed to fetch error logs' });
  }
});

// Activity logs endpoint
router.get('/logs/activity', async (req, res) => {
  try {
    // In a real application, you'd fetch from an activity logging system
    const mockActivityLogs = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        userId: 123,
        action: 'USER_LOGIN',
        details: 'User logged in successfully',
        ipAddress: '192.168.1.100'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        userId: 456,
        action: 'AI_ANALYSIS',
        details: 'Food image analyzed: burger.jpg',
        ipAddress: '192.168.1.101'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        userId: 789,
        action: 'SUBSCRIPTION_CREATED',
        details: 'Premium subscription activated',
        ipAddress: '192.168.1.102'
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        userId: null,
        action: 'SYSTEM_MAINTENANCE',
        details: 'Database optimization completed',
        ipAddress: null
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 1500000).toISOString(),
        userId: 321,
        action: 'PASSWORD_RESET',
        details: 'Password reset request processed',
        ipAddress: '192.168.1.103'
      }
    ];

    res.json(mockActivityLogs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        ai_service: 'healthy',
        payment_service: 'healthy',
        storage: 'healthy'
      },
      version: process.env.npm_package_version || '1.0.0'
    };

    res.json(health);
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Performance metrics endpoint
router.get('/performance', async (req, res) => {
  try {
    const startTime = performance.now();
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    const metrics = {
      responseTime: Math.round(responseTime * 100) / 100,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ message: 'Failed to fetch performance metrics' });
  }
});

// Enhanced system metrics endpoint
router.get('/metrics/detailed', async (req, res) => {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const cachedMemory = Math.floor(Math.random() * (totalMemory * 0.2));
    const bufferMemory = Math.floor(Math.random() * (totalMemory * 0.1));

    const cpus = os.cpus();
    const cpuCount = cpus.length;
    const cpuSpeed = cpus[0]?.speed || 0;

    const metrics = {
      cpu: {
        usage: Math.floor(Math.random() * 60) + 20, // 20-80%
        cores: cpuCount,
        frequency: Math.round(cpuSpeed / 1000 * 100) / 100, // Convert to GHz
        temperature: Math.floor(Math.random() * 20) + 45, // 45-65°C
        processes: Math.floor(Math.random() * 200) + 100
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        available: freeMemory,
        cached: cachedMemory,
        buffers: bufferMemory
      },
      disk: {
        used: Math.floor(Math.random() * 500) * 1024 * 1024 * 1024, // Random GB in bytes
        total: 1024 * 1024 * 1024 * 1024, // 1TB
        available: 500 * 1024 * 1024 * 1024, // 500GB
        readSpeed: Math.floor(Math.random() * 100) * 1024 * 1024, // MB/s
        writeSpeed: Math.floor(Math.random() * 80) * 1024 * 1024 // MB/s
      },
      network: {
        bytesIn: Math.floor(Math.random() * 1024 * 1024), // Random MB
        bytesOut: Math.floor(Math.random() * 1024 * 1024),
        packetsIn: Math.floor(Math.random() * 10000),
        packetsOut: Math.floor(Math.random() * 10000),
        connections: Math.floor(Math.random() * 100) + 50
      },
      database: {
        connections: Math.floor(Math.random() * 50) + 10,
        activeQueries: Math.floor(Math.random() * 20) + 1,
        queryTime: Math.floor(Math.random() * 50) + 5,
        cacheHitRate: Math.floor(Math.random() * 20) + 80,
        indexUsage: Math.floor(Math.random() * 15) + 85
      },
      application: {
        uptime: os.uptime(),
        responseTime: Math.floor(Math.random() * 100) + 50,
        requestsPerSecond: Math.floor(Math.random() * 1000) + 100,
        errorRate: Math.random() * 0.05,
        userSessions: Math.floor(Math.random() * 500) + 100
      },
      ai: {
        apiCalls: Math.floor(Math.random() * 1000) + 500,
        successRate: Math.random() * 5 + 95,
        averageLatency: Math.floor(Math.random() * 200) + 150,
        costPerHour: Math.random() * 50 + 10,
        queueLength: Math.floor(Math.random() * 20)
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching detailed metrics:', error);
    res.status(500).json({ message: 'Failed to fetch detailed system metrics' });
  }
});

// Service status endpoint
router.get('/services/status', async (req, res) => {
  try {
    const services = [
      {
        name: 'Web Server',
        status: 'healthy',
        uptime: Math.floor(Math.random() * 86400) + 86400, // 1-2 days
        lastCheck: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 50) + 10,
        dependencies: ['Database', 'Redis'],
        endpoints: [
          { name: 'Health Check', url: '/health', status: 200, responseTime: 25 },
          { name: 'API Status', url: '/api/status', status: 200, responseTime: 15 }
        ]
      },
      {
        name: 'Database',
        status: 'healthy',
        uptime: Math.floor(Math.random() * 172800) + 172800, // 2-4 days
        lastCheck: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 20) + 5,
        dependencies: [],
        endpoints: [
          { name: 'Connection Pool', url: 'internal', status: 200, responseTime: 5 }
        ]
      },
      {
        name: 'AI Service',
        status: Math.random() > 0.1 ? 'healthy' : 'warning',
        uptime: Math.floor(Math.random() * 86400) + 43200, // 0.5-1.5 days
        lastCheck: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 200) + 100,
        dependencies: ['External APIs'],
        endpoints: [
          { name: 'OpenAI', url: 'https://api.openai.com', status: 200, responseTime: 150 },
          { name: 'Gemini', url: 'https://generativelanguage.googleapis.com', status: 200, responseTime: 120 }
        ]
      },
      {
        name: 'Payment Service',
        status: 'healthy',
        uptime: Math.floor(Math.random() * 259200) + 259200, // 3-6 days
        lastCheck: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 100) + 50,
        dependencies: ['Stripe API'],
        endpoints: [
          { name: 'Stripe Webhook', url: '/api/stripe/webhook', status: 200, responseTime: 75 }
        ]
      },
      {
        name: 'File Storage',
        status: 'healthy',
        uptime: Math.floor(Math.random() * 432000) + 432000, // 5-10 days
        lastCheck: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 30) + 10,
        dependencies: ['AWS S3'],
        endpoints: [
          { name: 'Upload Test', url: 'internal', status: 200, responseTime: 25 }
        ]
      }
    ];

    res.json(services);
  } catch (error) {
    console.error('Error fetching service status:', error);
    res.status(500).json({ message: 'Failed to fetch service status' });
  }
});

// System alerts endpoint
router.get('/alerts', async (req, res) => {
  try {
    const { type, severity, resolved } = req.query;
    
    let filteredAlerts = [...systemAlerts];
    
    if (type && type !== 'all') {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
    }
    
    if (severity && severity !== 'all') {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    if (resolved && resolved !== 'all') {
      const isResolved = resolved === 'true';
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === isResolved);
    }
    
    // Sort by timestamp (newest first)
    filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json(filteredAlerts);
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    res.status(500).json({ message: 'Failed to fetch system alerts' });
  }
});

// Resolve alert endpoint
router.post('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alertIndex = systemAlerts.findIndex(alert => alert.id === alertId);
    if (alertIndex === -1) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    systemAlerts[alertIndex].resolved = true;
    systemAlerts[alertIndex].resolvedBy = req.user?.email || 'admin';
    systemAlerts[alertIndex].resolvedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Alert resolved successfully',
      alert: systemAlerts[alertIndex]
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Failed to resolve alert' });
  }
});

// System logs endpoint
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100, level, service } = req.query;
    
    let filteredLogs = [...systemLogs];
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (service) {
      filteredLogs = filteredLogs.filter(log => log.service === service);
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Limit results
    filteredLogs = filteredLogs.slice(0, parseInt(limit as string));
    
    res.json(filteredLogs);
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({ message: 'Failed to fetch system logs' });
  }
});

// Restart service endpoint
router.post('/services/:serviceName/restart', async (req, res) => {
  try {
    const { serviceName } = req.params;
    
    // In a real application, this would trigger actual service restart
    console.log(`Restarting service: ${serviceName}`);
    
    // Simulate restart delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add a log entry
    const logEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'system-admin',
      message: `Service ${serviceName} restarted by admin`,
      metadata: { serviceName, restartedBy: req.user?.email || 'admin' }
    };
    systemLogs.unshift(logEntry);
    
    // Keep only last 1000 logs
    if (systemLogs.length > 1000) {
      systemLogs = systemLogs.slice(0, 1000);
    }
    
    res.json({
      success: true,
      message: `Service ${serviceName} restarted successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error restarting service:', error);
    res.status(500).json({ message: 'Failed to restart service' });
  }
});

// System maintenance endpoint
router.post('/maintenance', async (req, res) => {
  try {
    const { action, duration } = req.body;
    
    console.log(`Starting maintenance: ${action} for ${duration} minutes`);
    
    // Add maintenance log
    const logEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'system-admin',
      message: `Maintenance started: ${action}`,
      metadata: { action, duration, startedBy: req.user?.email || 'admin' }
    };
    systemLogs.unshift(logEntry);
    
    res.json({
      success: true,
      message: 'Maintenance started successfully',
      action,
      duration,
      startedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting maintenance:', error);
    res.status(500).json({ message: 'Failed to start maintenance' });
  }
});

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Helper function to generate random system alert
function generateRandomAlert() {
  const types = ['performance', 'security', 'error', 'warning'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const messages = [
    'CPU usage exceeded threshold',
    'Memory usage is high',
    'Disk space running low',
    'Unusual network activity detected',
    'Database connection timeout',
    'AI service response time increased'
  ];
  
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: types[Math.floor(Math.random() * types.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    title: 'System Alert',
    message: messages[Math.floor(Math.random() * messages.length)],
    timestamp: new Date().toISOString(),
    resolved: false
  };
}

// Simulate periodic system monitoring (in production, this would be handled by separate monitoring service)
setInterval(() => {
  // Randomly generate new alerts (5% chance every minute)
  if (Math.random() < 0.05) {
    const newAlert = generateRandomAlert();
    systemAlerts.unshift(newAlert);
    
    // Keep only last 100 alerts
    if (systemAlerts.length > 100) {
      systemAlerts = systemAlerts.slice(0, 100);
    }
  }
  
  // Randomly generate system logs
  if (Math.random() < 0.3) {
    const services = ['web-server', 'database', 'ai-service', 'payment-service'];
    const levels = ['info', 'warn', 'error'];
    const messages = [
      'Request processed successfully',
      'Database query executed',
      'AI analysis completed',
      'Payment processed',
      'User session started',
      'Cache miss occurred'
    ];
    
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      service: services[Math.floor(Math.random() * services.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      metadata: { automated: true }
    };
    
    systemLogs.unshift(logEntry);
    
    // Keep only last 1000 logs
    if (systemLogs.length > 1000) {
      systemLogs = systemLogs.slice(0, 1000);
    }
  }
}, 60000); // Every minute

export default router;