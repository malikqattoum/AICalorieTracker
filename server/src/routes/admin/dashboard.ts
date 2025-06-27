import { Router } from 'express';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Middleware to protect all admin dashboard routes
router.use(isAdmin);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Mock dashboard stats - in a real application, these would come from database queries
    const stats = {
      users: {
        total: 2350,
        premium: 485,
        active: 1890,
        newToday: 23,
        growthRate: 12.5
      },
      revenue: {
        total: 145250,
        monthly: 23456,
        daily: 1250,
        growthRate: 8.3
      },
      ai: {
        totalAnalyses: 12234,
        successRate: 98.7,
        averageResponseTime: 245,
        costToday: 89.50
      },
      system: {
        uptime: 99.9,
        cpuUsage: 45,
        memoryUsage: 67,
        diskUsage: 34,
        activeConnections: 156
      },
      security: {
        threatsBlocked: 45,
        failedLogins: 12,
        activeThreats: 2,
        lastIncident: '2 days ago'
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    // Mock recent activity data
    const activities = [
      {
        id: 'activity_1',
        type: 'user_registration',
        message: 'New user registered: sarah@example.com',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        user: {
          name: 'Sarah Johnson',
          email: 'sarah@example.com'
        }
      },
      {
        id: 'activity_2',
        type: 'premium_upgrade',
        message: 'User upgraded to premium subscription',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        user: {
          name: 'Mike Chen',
          email: 'mike@example.com'
        }
      },
      {
        id: 'activity_3',
        type: 'ai_analysis',
        message: 'AI analysis completed for 25 meal images',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        severity: 'low'
      },
      {
        id: 'activity_4',
        type: 'security_event',
        message: 'Suspicious login attempt blocked from IP 192.168.1.100',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        severity: 'medium'
      },
      {
        id: 'activity_5',
        type: 'system_alert',
        message: 'Database connection pool reached 80% capacity',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        severity: 'high'
      },
      {
        id: 'activity_6',
        type: 'user_registration',
        message: 'New user registered: alex@example.com',
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        user: {
          name: 'Alex Rodriguez',
          email: 'alex@example.com'
        }
      }
    ];

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity' });
  }
});

// Get system alerts
router.get('/alerts', async (req, res) => {
  try {
    // Mock system alerts
    const alerts = [
      {
        id: 'alert_1',
        title: 'High Memory Usage',
        message: 'System memory usage has exceeded 90% threshold',
        severity: 'critical',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        acknowledged: false
      },
      {
        id: 'alert_2',
        title: 'API Rate Limit Approaching',
        message: 'OpenAI API usage is at 85% of daily limit',
        severity: 'warning',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        acknowledged: false
      },
      {
        id: 'alert_3',
        title: 'Database Backup Completed',
        message: 'Automated database backup completed successfully',
        severity: 'info',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged: true
      },
      {
        id: 'alert_4',
        title: 'Failed Payment Processing',
        message: 'Multiple payment failures detected in the last hour',
        severity: 'error',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        acknowledged: false
      }
    ];

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    res.status(500).json({ message: 'Failed to fetch system alerts' });
  }
});

// Acknowledge alert
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    
    // In a real application, you would update the alert in the database
    console.log(`Alert ${alertId} acknowledged by ${req.user?.email}`);
    
    res.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ message: 'Failed to acknowledge alert' });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Mock performance data based on time range
    const performanceData = {
      timeRange,
      metrics: {
        responseTime: {
          current: 245,
          average: 220,
          trend: 'stable'
        },
        throughput: {
          current: 1250,
          average: 1180,
          trend: 'increasing'
        },
        errorRate: {
          current: 0.02,
          average: 0.015,
          trend: 'increasing'
        },
        uptime: {
          current: 99.9,
          average: 99.8,
          trend: 'stable'
        }
      },
      timeSeries: generateTimeSeriesData(timeRange as string)
    };

    res.json(performanceData);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ message: 'Failed to fetch performance metrics' });
  }
});

// Get user growth analytics
router.get('/user-growth', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Mock user growth data
    const userGrowth = {
      timeRange,
      totalUsers: 2350,
      newUsers: generateGrowthData(timeRange as string, 'users'),
      premiumConversions: generateGrowthData(timeRange as string, 'conversions'),
      churnRate: 2.3,
      avgSessionDuration: '8m 32s'
    };

    res.json(userGrowth);
  } catch (error) {
    console.error('Error fetching user growth:', error);
    res.status(500).json({ message: 'Failed to fetch user growth data' });
  }
});

// Get revenue analytics
router.get('/revenue', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Mock revenue data
    const revenueData = {
      timeRange,
      totalRevenue: 145250,
      monthlyRecurringRevenue: 23456,
      averageRevenuePerUser: 9.99,
      revenueGrowth: generateGrowthData(timeRange as string, 'revenue'),
      subscriptionBreakdown: {
        monthly: 320,
        yearly: 165
      }
    };

    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ message: 'Failed to fetch revenue data' });
  }
});

// Get AI usage analytics
router.get('/ai-usage', async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Mock AI usage data
    const aiUsage = {
      timeRange,
      totalAnalyses: 12234,
      successfulAnalyses: 12073,
      failedAnalyses: 161,
      averageProcessingTime: 245,
      costBreakdown: {
        openai: 450.25,
        gemini: 125.75,
        total: 576.00
      },
      usageByProvider: [
        { provider: 'OpenAI', analyses: 8500, cost: 450.25 },
        { provider: 'Gemini', analyses: 3734, cost: 125.75 }
      ],
      dailyUsage: generateAIUsageData(timeRange as string)
    };

    res.json(aiUsage);
  } catch (error) {
    console.error('Error fetching AI usage:', error);
    res.status(500).json({ message: 'Failed to fetch AI usage data' });
  }
});

// Helper function to generate time series data
function generateTimeSeriesData(timeRange: string) {
  const now = new Date();
  const data = [];
  let points, interval;

  switch (timeRange) {
    case '1h':
      points = 60;
      interval = 60 * 1000; // 1 minute
      break;
    case '24h':
      points = 24;
      interval = 60 * 60 * 1000; // 1 hour
      break;
    case '7d':
      points = 7;
      interval = 24 * 60 * 60 * 1000; // 1 day
      break;
    default:
      points = 30;
      interval = 24 * 60 * 60 * 1000; // 1 day
  }

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * interval);
    data.push({
      timestamp: timestamp.toISOString(),
      responseTime: Math.random() * 100 + 200,
      throughput: Math.random() * 500 + 1000,
      errorRate: Math.random() * 0.05,
      cpuUsage: Math.random() * 30 + 40,
      memoryUsage: Math.random() * 20 + 60
    });
  }

  return data;
}

// Helper function to generate growth data
function generateGrowthData(timeRange: string, type: string) {
  const now = new Date();
  const data = [];
  let points, interval;

  switch (timeRange) {
    case '7d':
      points = 7;
      interval = 24 * 60 * 60 * 1000;
      break;
    case '30d':
      points = 30;
      interval = 24 * 60 * 60 * 1000;
      break;
    default:
      points = 30;
      interval = 24 * 60 * 60 * 1000;
  }

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * interval);
    let value;

    switch (type) {
      case 'users':
        value = Math.floor(Math.random() * 50 + 10);
        break;
      case 'conversions':
        value = Math.floor(Math.random() * 10 + 2);
        break;
      case 'revenue':
        value = Math.floor(Math.random() * 2000 + 500);
        break;
      default:
        value = Math.floor(Math.random() * 100);
    }

    data.push({
      timestamp: timestamp.toISOString(),
      value
    });
  }

  return data;
}

// Helper function to generate AI usage data
function generateAIUsageData(timeRange: string) {
  const now = new Date();
  const data = [];
  let points;

  switch (timeRange) {
    case '7d':
      points = 7;
      break;
    case '30d':
      points = 30;
      break;
    default:
      points = 7;
  }

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    data.push({
      timestamp: timestamp.toISOString(),
      analyses: Math.floor(Math.random() * 500 + 200),
      cost: Math.random() * 50 + 10,
      successRate: Math.random() * 5 + 95
    });
  }

  return data;
}

export default router;