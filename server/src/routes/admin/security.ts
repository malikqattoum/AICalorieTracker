import { Router } from 'express';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Middleware to protect all admin security routes
router.use(isAdmin);

// Mock security data - in a real application, this would be stored in database
let securityEvents = [
  {
    id: 'sec_1',
    type: 'failed_login',
    severity: 'medium',
    user: { id: 'user_1', email: 'john@example.com', name: 'John Doe' },
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    location: 'New York, US',
    details: 'Multiple failed login attempts',
    status: 'investigating'
  },
  {
    id: 'sec_2',
    type: 'suspicious_activity',
    severity: 'high',
    user: { id: 'user_2', email: 'suspicious@example.com', name: 'Suspicious User' },
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    ipAddress: '10.0.0.50',
    userAgent: 'curl/7.68.0',
    location: 'Unknown',
    details: 'Unusual API usage pattern detected',
    status: 'pending'
  },
  {
    id: 'sec_3',
    type: 'api_abuse',
    severity: 'critical',
    user: { id: 'user_3', email: 'bot@example.com', name: 'Bot User' },
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ipAddress: '203.0.113.0',
    userAgent: 'Python-urllib/3.9',
    location: 'Singapore',
    details: 'Rate limit exceeded by 1000%',
    status: 'blocked'
  }
];

let blockedIPs = [
  {
    id: 'blocked_1',
    ipAddress: '203.0.113.0',
    reason: 'API abuse - rate limit exceeded',
    blockedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    blockedBy: 'admin@system.com',
    attempts: 5000,
    isActive: true
  },
  {
    id: 'blocked_2',
    ipAddress: '198.51.100.0',
    reason: 'Multiple failed login attempts',
    blockedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    blockedBy: 'security-system',
    attempts: 25,
    isActive: true
  }
];

// Get security metrics
router.get('/metrics', async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentEvents = securityEvents.filter(e => new Date(e.timestamp) >= last24h);
    
    const metrics = {
      totalEvents: securityEvents.length,
      criticalEvents: securityEvents.filter(e => e.severity === 'critical').length,
      blockedIPs: blockedIPs.filter(ip => ip.isActive).length,
      failedLogins: securityEvents.filter(e => e.type === 'failed_login').length,
      suspiciousActivities: securityEvents.filter(e => e.type === 'suspicious_activity').length,
      activeThreats: securityEvents.filter(e => e.status === 'pending' || e.status === 'investigating').length
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    res.status(500).json({ message: 'Failed to fetch security metrics' });
  }
});

// Get security events with filtering
router.get('/events', async (req, res) => {
  try {
    const { severity, timeRange } = req.query;
    
    let filteredEvents = [...securityEvents];
    
    // Filter by severity
    if (severity && severity !== 'all') {
      filteredEvents = filteredEvents.filter(e => e.severity === severity);
    }
    
    // Filter by time range
    if (timeRange) {
      const now = new Date();
      let cutoffTime;
      
      switch (timeRange) {
        case '1h':
          cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      
      filteredEvents = filteredEvents.filter(e => new Date(e.timestamp) >= cutoffTime);
    }
    
    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json(filteredEvents);
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ message: 'Failed to fetch security events' });
  }
});

// Resolve security event
router.post('/events/:eventId/resolve', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const eventIndex = securityEvents.findIndex(e => e.id === eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Security event not found' });
    }
    
    securityEvents[eventIndex].status = 'resolved';
    
    res.json({
      success: true,
      message: 'Security event resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving security event:', error);
    res.status(500).json({ message: 'Failed to resolve security event' });
  }
});

// Get blocked IPs
router.get('/blocked-ips', async (req, res) => {
  try {
    // Sort by blocked date (newest first)
    const sortedIPs = [...blockedIPs].sort((a, b) => 
      new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime()
    );
    
    res.json(sortedIPs);
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    res.status(500).json({ message: 'Failed to fetch blocked IPs' });
  }
});

// Block IP address
router.post('/block-ip', async (req, res) => {
  try {
    const { ipAddress, reason } = req.body;
    
    if (!ipAddress || !reason) {
      return res.status(400).json({ message: 'IP address and reason are required' });
    }
    
    // Check if IP is already blocked
    const existingBlock = blockedIPs.find(ip => ip.ipAddress === ipAddress && ip.isActive);
    if (existingBlock) {
      return res.status(400).json({ message: 'IP address is already blocked' });
    }
    
    const newBlock = {
      id: `blocked_${Date.now()}`,
      ipAddress,
      reason,
      blockedAt: new Date().toISOString(),
      blockedBy: req.user?.email || 'admin',
      attempts: 1,
      isActive: true
    };
    
    blockedIPs.push(newBlock);
    
    // In a real application, you would also add the IP to firewall rules or security groups
    console.log(`Blocked IP ${ipAddress}: ${reason}`);
    
    res.status(201).json({
      success: true,
      message: 'IP address blocked successfully',
      blockedIP: newBlock
    });
  } catch (error) {
    console.error('Error blocking IP:', error);
    res.status(500).json({ message: 'Failed to block IP address' });
  }
});

// Unblock IP address
router.delete('/unblock-ip/:ipId', async (req, res) => {
  try {
    const { ipId } = req.params;
    
    const ipIndex = blockedIPs.findIndex(ip => ip.id === ipId);
    if (ipIndex === -1) {
      return res.status(404).json({ message: 'Blocked IP not found' });
    }
    
    // Deactivate the block instead of deleting for audit purposes
    blockedIPs[ipIndex].isActive = false;
    
    console.log(`Unblocked IP ${blockedIPs[ipIndex].ipAddress}`);
    
    res.json({
      success: true,
      message: 'IP address unblocked successfully'
    });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({ message: 'Failed to unblock IP address' });
  }
});

// Get security settings
router.get('/settings', async (req, res) => {
  try {
    // Mock security settings - in production, these would be stored in database
    const settings = {
      autoBlockSuspiciousIPs: true,
      rateLimitingEnabled: true,
      failedLoginMonitoring: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15, // minutes
      emailAlertsEnabled: true,
      slackNotificationsEnabled: false,
      alertThreshold: 'medium',
      adminEmail: 'admin@aicalorietracker.com',
      twoFactorRequired: false,
      passwordMinLength: 8,
      sessionTimeout: 1440, // minutes (24 hours)
      requireStrongPasswords: true,
      allowPasswordReuse: false
    };
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({ message: 'Failed to fetch security settings' });
  }
});

// Update security settings
router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;
    
    // In a real application, you would validate and save these settings to database
    console.log('Updated security settings:', settings);
    
    res.json({
      success: true,
      message: 'Security settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ message: 'Failed to update security settings' });
  }
});

// Generate security report
router.get('/report', async (req, res) => {
  try {
    const { timeRange = '30d', format = 'json' } = req.query;
    
    const now = new Date();
    let cutoffTime;
    
    switch (timeRange) {
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const eventsInRange = securityEvents.filter(e => new Date(e.timestamp) >= cutoffTime);
    const blocksInRange = blockedIPs.filter(ip => new Date(ip.blockedAt) >= cutoffTime);
    
    const report = {
      reportGenerated: new Date().toISOString(),
      timeRange,
      summary: {
        totalEvents: eventsInRange.length,
        eventsBySeverity: {
          critical: eventsInRange.filter(e => e.severity === 'critical').length,
          high: eventsInRange.filter(e => e.severity === 'high').length,
          medium: eventsInRange.filter(e => e.severity === 'medium').length,
          low: eventsInRange.filter(e => e.severity === 'low').length
        },
        eventsByType: {
          failed_login: eventsInRange.filter(e => e.type === 'failed_login').length,
          suspicious_activity: eventsInRange.filter(e => e.type === 'suspicious_activity').length,
          api_abuse: eventsInRange.filter(e => e.type === 'api_abuse').length,
          password_change: eventsInRange.filter(e => e.type === 'password_change').length,
          admin_action: eventsInRange.filter(e => e.type === 'admin_action').length
        },
        totalIPBlocks: blocksInRange.length,
        activeBlocks: blocksInRange.filter(ip => ip.isActive).length
      },
      events: eventsInRange,
      blockedIPs: blocksInRange
    };
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=security-report-${timeRange}.csv`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=security-report-${timeRange}.json`);
      res.json(report);
    }
  } catch (error) {
    console.error('Error generating security report:', error);
    res.status(500).json({ message: 'Failed to generate security report' });
  }
});

// Simulate security event (for testing)
router.post('/simulate-event', async (req, res) => {
  try {
    const { type, severity, userId, ipAddress } = req.body;
    
    const newEvent = {
      id: `sec_${Date.now()}`,
      type: type || 'suspicious_activity',
      severity: severity || 'medium',
      user: {
        id: userId || 'unknown',
        email: 'test@example.com',
        name: 'Test User'
      },
      timestamp: new Date().toISOString(),
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: 'Test-Agent/1.0',
      location: 'Test Location',
      details: `Simulated ${type} event`,
      status: 'pending'
    };
    
    securityEvents.push(newEvent);
    
    res.status(201).json({
      success: true,
      message: 'Security event simulated successfully',
      event: newEvent
    });
  } catch (error) {
    console.error('Error simulating security event:', error);
    res.status(500).json({ message: 'Failed to simulate security event' });
  }
});

// Helper function to convert report to CSV
function convertToCSV(report: any): string {
  const headers = ['Timestamp', 'Type', 'Severity', 'User Email', 'IP Address', 'Details', 'Status'];
  const csvRows = [headers.join(',')];
  
  report.events.forEach((event: any) => {
    const row = [
      event.timestamp,
      event.type,
      event.severity,
      event.user.email,
      event.ipAddress,
      `"${event.details}"`,
      event.status
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

export default router;