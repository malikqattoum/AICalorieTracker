import { Router } from 'express';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Middleware to protect all admin activity routes
router.use(isAdmin);

// Mock activity data - in a real application, this would be stored in database
let activityLogs = [
  {
    id: 'activity_1',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    userId: 'user123',
    userEmail: 'john@example.com',
    userName: 'John Doe',
    action: 'USER_LOGIN',
    category: 'auth',
    description: 'User successfully logged in',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    success: true,
    severity: 'low',
    location: {
      country: 'US',
      city: 'New York',
      region: 'NY'
    },
    metadata: {
      loginMethod: 'email',
      sessionId: 'sess_abc123',
      deviceType: 'desktop'
    }
  },
  {
    id: 'activity_2',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    userId: 'user456',
    userEmail: 'jane@example.com',
    userName: 'Jane Smith',
    action: 'AI_ANALYSIS_REQUEST',
    category: 'ai',
    description: 'User requested AI analysis for food image',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    success: true,
    severity: 'low',
    location: {
      country: 'US',
      city: 'Los Angeles',
      region: 'CA'
    },
    metadata: {
      imageSize: '2.5MB',
      processingTime: '3.2s',
      provider: 'openai',
      cost: 0.02
    }
  },
  {
    id: 'activity_3',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    userId: null,
    userEmail: 'admin@system.com',
    userName: 'System Admin',
    action: 'SYSTEM_BACKUP_COMPLETED',
    category: 'system',
    description: 'Automated system backup completed successfully',
    ipAddress: '127.0.0.1',
    userAgent: 'System/1.0',
    success: true,
    severity: 'medium',
    metadata: {
      backupSize: '1.2GB',
      duration: '45m',
      type: 'full_backup',
      destination: 'aws_s3'
    }
  },
  {
    id: 'activity_4',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    userId: 'user789',
    userEmail: 'hacker@malicious.com',
    userName: null,
    action: 'FAILED_LOGIN_ATTEMPT',
    category: 'security',
    description: 'Multiple failed login attempts detected',
    ipAddress: '203.0.113.1',
    userAgent: 'curl/7.68.0',
    success: false,
    severity: 'high',
    location: {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown'
    },
    metadata: {
      attemptCount: 15,
      timeWindow: '5m',
      blocked: true,
      reason: 'brute_force'
    }
  },
  {
    id: 'activity_5',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    userId: 'user321',
    userEmail: 'premium@example.com',
    userName: 'Premium User',
    action: 'SUBSCRIPTION_UPGRADE',
    category: 'payment',
    description: 'User upgraded to premium subscription',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    success: true,
    severity: 'medium',
    location: {
      country: 'US',
      city: 'Chicago',
      region: 'IL'
    },
    metadata: {
      plan: 'premium_monthly',
      amount: 9.99,
      currency: 'USD',
      paymentMethod: 'card_ending_4242'
    }
  },
  {
    id: 'activity_6',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    userId: null,
    userEmail: 'admin@system.com',
    userName: 'System Admin',
    action: 'ADMIN_CONFIG_CHANGE',
    category: 'admin',
    description: 'AI configuration updated for OpenAI provider',
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    success: true,
    severity: 'high',
    metadata: {
      configType: 'ai_provider',
      provider: 'openai',
      changes: ['model_name', 'temperature'],
      previousValues: { model: 'gpt-3.5-turbo', temperature: 0.7 },
      newValues: { model: 'gpt-4', temperature: 0.5 }
    }
  }
];

// Get activity statistics
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate statistics
    const totalActivities = activityLogs.length + Math.floor(Math.random() * 10000);
    const activitiesLast24h = activityLogs.filter(log => 
      new Date(log.timestamp) > last24h
    ).length + Math.floor(Math.random() * 100);
    
    const activitiesLast7d = activityLogs.filter(log => 
      new Date(log.timestamp) > last7d
    ).length + Math.floor(Math.random() * 500);

    const securityEvents = activityLogs.filter(log => 
      log.category === 'security'
    ).length + Math.floor(Math.random() * 50);

    const failedAttempts = activityLogs.filter(log => 
      !log.success
    ).length + Math.floor(Math.random() * 25);

    // Generate unique IPs count
    const uniqueIPs = new Set(activityLogs.map(log => log.ipAddress)).size + Math.floor(Math.random() * 100);

    // Generate top actions
    const actionCounts: { [key: string]: number } = {};
    activityLogs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    
    // Add some mock data for more realistic stats
    actionCounts['USER_LOGIN'] = (actionCounts['USER_LOGIN'] || 0) + Math.floor(Math.random() * 1000);
    actionCounts['AI_ANALYSIS_REQUEST'] = (actionCounts['AI_ANALYSIS_REQUEST'] || 0) + Math.floor(Math.random() * 800);
    actionCounts['PAGE_VIEW'] = Math.floor(Math.random() * 2000);
    actionCounts['FILE_UPLOAD'] = Math.floor(Math.random() * 500);
    actionCounts['SUBSCRIPTION_CREATED'] = Math.floor(Math.random() * 200);

    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    // Generate top users
    const userCounts: { [key: string]: number } = {};
    activityLogs.forEach(log => {
      if (log.userEmail) {
        userCounts[log.userEmail] = (userCounts[log.userEmail] || 0) + 1;
      }
    });

    // Add mock users for more realistic stats
    const mockUsers = [
      'active.user1@example.com',
      'power.user@example.com',
      'frequent.visitor@example.com',
      'premium.customer@example.com',
      'test.user@example.com'
    ];

    mockUsers.forEach(email => {
      userCounts[email] = Math.floor(Math.random() * 100) + 10;
    });

    const topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([email, count]) => ({ email, count }));

    const stats = {
      totalActivities,
      activitiesLast24h,
      activitiesLast7d,
      topActions,
      topUsers,
      securityEvents,
      failedAttempts,
      uniqueIPs
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ message: 'Failed to fetch activity statistics' });
  }
});

// Get activity logs with filtering
router.get('/logs', async (req, res) => {
  try {
    const { 
      category, 
      severity, 
      success, 
      timeRange, 
      userId, 
      action, 
      ipAddress, 
      search,
      limit = 100,
      offset = 0
    } = req.query;

    let filteredLogs = [...activityLogs];

    // Apply filters
    if (category && category !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (severity && severity !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }

    if (success && success !== 'all') {
      const isSuccess = success === 'true';
      filteredLogs = filteredLogs.filter(log => log.success === isSuccess);
    }

    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let timeFilter: Date;
      
      switch (timeRange) {
        case '1h':
          timeFilter = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) > timeFilter);
    }

    if (userId) {
      filteredLogs = filteredLogs.filter(log => 
        log.userId?.toLowerCase().includes(userId.toString().toLowerCase())
      );
    }

    if (action) {
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(action.toString().toLowerCase())
      );
    }

    if (ipAddress) {
      filteredLogs = filteredLogs.filter(log => 
        log.ipAddress.includes(ipAddress.toString())
      );
    }

    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(searchTerm) ||
        log.description.toLowerCase().includes(searchTerm) ||
        log.userEmail?.toLowerCase().includes(searchTerm) ||
        log.ipAddress.includes(searchTerm)
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedLogs = filteredLogs.slice(
      parseInt(offset.toString()), 
      parseInt(offset.toString()) + parseInt(limit.toString())
    );

    res.json(paginatedLogs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
});

// Export activity logs
router.get('/export', async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    // Get filtered logs using same logic as /logs endpoint
    const { 
      category, 
      severity, 
      success, 
      timeRange, 
      userId, 
      action, 
      ipAddress, 
      search
    } = req.query;

    let filteredLogs = [...activityLogs];

    // Apply same filters as logs endpoint
    if (category && category !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (severity && severity !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }

    if (success && success !== 'all') {
      const isSuccess = success === 'true';
      filteredLogs = filteredLogs.filter(log => log.success === isSuccess);
    }

    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let timeFilter: Date;
      
      switch (timeRange) {
        case '1h':
          timeFilter = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) > timeFilter);
    }

    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(searchTerm) ||
        log.description.toLowerCase().includes(searchTerm) ||
        log.userEmail?.toLowerCase().includes(searchTerm) ||
        log.ipAddress.includes(searchTerm)
      );
    }

    // Sort by timestamp
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'ID',
        'Timestamp',
        'User Email',
        'Action',
        'Category',
        'Description',
        'IP Address',
        'Success',
        'Severity',
        'Location'
      ];

      const csvRows = filteredLogs.map(log => [
        log.id,
        log.timestamp,
        log.userEmail || '',
        log.action,
        log.category,
        log.description,
        log.ipAddress,
        log.success.toString(),
        log.severity,
        log.location ? `${log.location.city}, ${log.location.country}` : ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity-logs.csv');
      res.send(csvContent);
    } else if (format === 'json') {
      // Generate JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=activity-logs.json');
      res.json({
        exported_at: new Date().toISOString(),
        total_records: filteredLogs.length,
        filters: {
          category: category || 'all',
          severity: severity || 'all',
          success: success || 'all',
          timeRange: timeRange || 'all',
          search: search || ''
        },
        logs: filteredLogs
      });
    } else {
      res.status(400).json({ message: 'Unsupported export format. Use csv or json.' });
    }
  } catch (error) {
    console.error('Error exporting activity logs:', error);
    res.status(500).json({ message: 'Failed to export activity logs' });
  }
});

// Get activity log by ID
router.get('/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const log = activityLogs.find(log => log.id === id);
    if (!log) {
      return res.status(404).json({ message: 'Activity log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ message: 'Failed to fetch activity log' });
  }
});

// Log new activity (internal endpoint)
router.post('/log', async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      userName,
      action,
      category,
      description,
      ipAddress,
      userAgent,
      success = true,
      severity = 'low',
      metadata = {}
    } = req.body;

    if (!action || !category || !description) {
      return res.status(400).json({ 
        message: 'Action, category, and description are required' 
      });
    }

    const newLog = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId,
      userEmail,
      userName,
      action,
      category,
      description,
      ipAddress: ipAddress || req.ip,
      userAgent: userAgent || req.get('User-Agent'),
      success,
      severity,
      metadata,
      location: {
        country: 'US', // In production, use IP geolocation service
        city: 'Unknown',
        region: 'Unknown'
      }
    };

    activityLogs.unshift(newLog);
    
    // Keep only last 10000 logs in memory (in production, use database with proper retention)
    if (activityLogs.length > 10000) {
      activityLogs = activityLogs.slice(0, 10000);
    }

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      logId: newLog.id
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ message: 'Failed to log activity' });
  }
});

// Delete activity logs (admin only)
router.delete('/logs', async (req, res) => {
  try {
    const { 
      olderThan, // ISO date string
      category,
      severity
    } = req.body;

    let deletedCount = 0;
    const originalLength = activityLogs.length;

    if (olderThan) {
      const cutoffDate = new Date(olderThan);
      activityLogs = activityLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        if (logDate < cutoffDate) {
          deletedCount++;
          return false;
        }
        return true;
      });
    }

    if (category) {
      activityLogs = activityLogs.filter(log => {
        if (log.category === category) {
          deletedCount++;
          return false;
        }
        return true;
      });
    }

    if (severity) {
      activityLogs = activityLogs.filter(log => {
        if (log.severity === severity) {
          deletedCount++;
          return false;
        }
        return true;
      });
    }

    // If no filters provided, just count what would be deleted
    if (!olderThan && !category && !severity) {
      deletedCount = originalLength;
    }

    res.json({
      success: true,
      message: `${deletedCount} activity logs deleted successfully`,
      deletedCount,
      remainingCount: activityLogs.length
    });
  } catch (error) {
    console.error('Error deleting activity logs:', error);
    res.status(500).json({ message: 'Failed to delete activity logs' });
  }
});

// Generate sample activity data (for testing)
router.post('/generate-sample', async (req, res) => {
  try {
    const { count = 100 } = req.body;
    
    const actions = [
      'USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'PASSWORD_RESET',
      'AI_ANALYSIS_REQUEST', 'AI_ANALYSIS_COMPLETED', 'IMAGE_UPLOAD',
      'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_CANCELLED', 'PAYMENT_PROCESSED',
      'ADMIN_LOGIN', 'ADMIN_CONFIG_CHANGE', 'SYSTEM_BACKUP_STARTED',
      'FAILED_LOGIN_ATTEMPT', 'SUSPICIOUS_ACTIVITY_DETECTED'
    ];

    const categories = ['auth', 'user', 'admin', 'system', 'payment', 'ai', 'security', 'data'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const ipAddresses = ['192.168.1.100', '192.168.1.101', '203.0.113.1', '10.0.0.1'];
    const userEmails = [
      'user1@example.com', 'user2@example.com', 'admin@example.com',
      'test@example.com', 'premium@example.com'
    ];

    for (let i = 0; i < count; i++) {
      const randomDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const action = actions[Math.floor(Math.random() * actions.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      const sampleLog: any = {
        id: `sample_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: randomDate.toISOString(),
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        userEmail: userEmails[Math.floor(Math.random() * userEmails.length)],
        userName: `User ${Math.floor(Math.random() * 1000)}`,
        action,
        category,
        description: `Sample activity: ${action.toLowerCase().replace(/_/g, ' ')}`,
        ipAddress: ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
        userAgent: 'Sample User Agent',
        success: Math.random() > 0.1, // 90% success rate
        severity: severities[Math.floor(Math.random() * severities.length)],
        location: {
          country: 'US',
          city: 'Sample City',
          region: 'Sample Region'
        },
        metadata: category === 'payment' ? {
          plan: 'premium',
          amount: 29.99,
          currency: 'USD',
          paymentMethod: 'credit_card'
        } : category === 'auth' ? {
          loginMethod: 'email',
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`
        } : category === 'admin' ? {
          adminLevel: 'super',
          targetUserId: `user_${Math.floor(Math.random() * 1000)}`
        } : {
          sample: true,
          generatedAt: new Date().toISOString()
        }
      };

      activityLogs.push(sampleLog);
    }

    // Sort by timestamp
    activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      message: `${count} sample activity logs generated successfully`,
      totalLogs: activityLogs.length
    });
  } catch (error) {
    console.error('Error generating sample data:', error);
    res.status(500).json({ message: 'Failed to generate sample data' });
  }
});

export default router;