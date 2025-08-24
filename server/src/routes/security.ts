import { Router, Request, Response } from 'express';
import { securityAuditService, SecurityEventType, SecurityEventSeverity } from '../services/securityAuditService';
import { validateSession } from '../middleware/secureSession';
import { AppError, AuthorizationError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';

const router = Router();
const logger = new Logger('SecurityRoutes');

// Apply session validation to all security routes
router.use(validateSession);

// Middleware to check if user has admin privileges
const requireAdmin = (req: Request, res: Response, next: any) => {
  const user = (req as any).user;
  
  if (!user || !user.isAdmin) {
    throw new AuthorizationError('Admin access required');
  }
  
  next();
};

// Apply admin middleware to all security routes
router.use(requireAdmin);

// Get security events
router.get('/events', async (req: Request, res: Response) => {
  try {
    const {
      type,
      severity,
      userId,
      ipAddress,
      startDate,
      endDate,
      resolved,
      limit = '100',
      offset = '0',
      format = 'json'
    } = req.query;

    const filters: any = {};
    if (type) filters.type = type as SecurityEventType;
    if (severity) filters.severity = severity as SecurityEventSeverity;
    if (userId) filters.userId = userId as string;
    if (ipAddress) filters.ipAddress = ipAddress as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (resolved !== undefined) filters.resolved = resolved === 'true';

    const events = securityAuditService.getEvents(
      filters,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="security_events.csv"');
      return res.send(securityAuditService.exportEvents('csv'));
    }

    res.json({
      success: true,
      data: events,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: events.length
      },
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error getting security events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve security events',
      timestamp: new Date()
    });
  }
});

// Get security statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = securityAuditService.getStatistics();
    
    res.json({
      success: true,
      data: statistics,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error getting security statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve security statistics',
      timestamp: new Date()
    });
  }
});

// Get security report
router.get('/report', async (req: Request, res: Response) => {
  try {
    const report = securityAuditService.generateReport();
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error generating security report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate security report',
      timestamp: new Date()
    });
  }
});

// Get security score
router.get('/score', async (req: Request, res: Response) => {
  try {
    const score = securityAuditService.getSecurityScore();
    
    res.json({
      success: true,
      data: {
        score,
        status: score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor'
      },
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error getting security score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate security score',
      timestamp: new Date()
    });
  }
});

// Resolve security event
router.put('/events/:eventId/resolve', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { resolvedBy } = req.body;
    
    if (!resolvedBy) {
      throw new AppError('VALIDATION_ERROR', 'VALIDATION_ERROR', 'resolvedBy field is required');
    }
    
    const success = securityAuditService.resolveEvent(eventId, resolvedBy);
    
    if (!success) {
      throw new AppError('NOT_FOUND', 'EVENT_NOT_FOUND', 'Security event not found');
    }
    
    res.json({
      success: true,
      message: 'Security event resolved successfully',
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error resolving security event:', error);
    if (error instanceof AppError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to resolve security event',
        timestamp: new Date()
      });
    }
  }
});

// Export security events
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { format = 'json', type, severity, startDate, endDate } = req.query;
    
    const filters: any = {};
    if (type) filters.type = type as SecurityEventType;
    if (severity) filters.severity = severity as SecurityEventSeverity;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    
    // Get filtered events
    const events = securityAuditService.getEvents(filters);
    
    let exportData: string;
    let contentType: string;
    let filename: string;
    
    if (format === 'csv') {
      exportData = securityAuditService.exportEvents('csv');
      contentType = 'text/csv';
      filename = 'security_events.csv';
    } else {
      exportData = JSON.stringify(events, null, 2);
      contentType = 'application/json';
      filename = 'security_events.json';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    logger.error('Error exporting security events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export security events',
      timestamp: new Date()
    });
  }
});

// Clear old security events
router.delete('/events/clear', async (req: Request, res: Response) => {
  try {
    const { olderThan = '30' } = req.query;
    const days = parseInt(olderThan as string);
    
    if (isNaN(days) || days < 1) {
      throw new AppError('VALIDATION_ERROR', 'VALIDATION_ERROR', 'olderThan must be a valid number greater than 0');
    }
    
    const clearedCount = securityAuditService.clearOldEvents(days);
    
    res.json({
      success: true,
      message: `Cleared ${clearedCount} old security events`,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error clearing old security events:', error);
    if (error instanceof AppError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to clear old security events',
        timestamp: new Date()
      });
    }
  }
});

// Log custom security event (for manual logging)
router.post('/events/log', async (req: Request, res: Response) => {
  try {
    const { type, severity, description, details } = req.body;
    
    if (!type || !severity || !description) {
      throw new AppError('VALIDATION_ERROR', 'VALIDATION_ERROR', 'type, severity, and description are required');
    }
    
    securityAuditService.logEvent(
      type,
      severity,
      description,
      details || {},
      req
    );
    
    res.json({
      success: true,
      message: 'Security event logged successfully',
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error logging security event:', error);
    if (error instanceof AppError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to log security event',
        timestamp: new Date()
      });
    }
  }
});

// Get security recommendations
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const report = securityAuditService.generateReport();
    
    res.json({
      success: true,
      data: {
        recommendations: report.recommendations,
        score: report.score,
        generatedAt: report.generatedAt
      },
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error getting security recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve security recommendations',
      timestamp: new Date()
    });
  }
});

// Get security event types (for reference)
router.get('/event-types', async (req: Request, res: Response) => {
  try {
    const eventTypes = Object.values(SecurityEventType).map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
    
    const severities = Object.values(SecurityEventSeverity).map(severity => ({
      value: severity,
      label: severity.charAt(0).toUpperCase() + severity.slice(1)
    }));
    
    res.json({
      success: true,
      data: {
        eventTypes,
        severities
      },
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error getting security event types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve security event types',
      timestamp: new Date()
    });
  }
});

export default router;