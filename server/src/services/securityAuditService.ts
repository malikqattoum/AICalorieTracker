import { Logger } from '../utils/logger';
import { securityConfig } from '../config/security';
import { Request, Response } from 'express';

const logger = new Logger('SecurityAudit');

// Security event types
export enum SecurityEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  ACCOUNT_LOCKOUT = 'account_lockout',
  SESSION_CREATE = 'session_create',
  SESSION_DESTROY = 'session_destroy',
  SESSION_EXPIRE = 'session_expire',
  SECURITY_VIOLATION = 'security_violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  IP_BLOCKED = 'ip_blocked',
  CSRF_DETECTED = 'csrf_detected',
  XSS_DETECTED = 'xss_detected',
  SQL_INJECTION_DETECTED = 'sql_injection_detected',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PERMISSION_DENIED = 'permission_denied',
  DATA_BREACH = 'data_breach',
  MALWARE_DETECTED = 'malware_detected',
  PHISHING_DETECTED = 'phishing_detected'
}

// Security event severity levels
export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Security event interface
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  description: string;
  details: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Security audit service
export class SecurityAuditService {
  private events: SecurityEvent[] = [];
  private maxEvents = 10000;
  private alertThresholds = {
    [SecurityEventSeverity.LOW]: 100,
    [SecurityEventSeverity.MEDIUM]: 50,
    [SecurityEventSeverity.HIGH]: 20,
    [SecurityEventSeverity.CRITICAL]: 5
  };

  // Log security event
  public logEvent(
    type: SecurityEventType,
    severity: SecurityEventSeverity,
    description: string,
    details: Record<string, any> = {},
    req?: Request
  ): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      userId: req?.user?.id?.toString(),
      sessionId: req?.session?.id as string,
      ipAddress: req?.ip || 'unknown',
      userAgent: req?.get('User-Agent') || 'unknown',
      timestamp: new Date(),
      description,
      details,
      resolved: false
    };

    this.events.push(event);
    logger.warn(`Security Event: ${type} - ${description}`, { event: event.details });

    // Check if event threshold is exceeded
    this.checkEventThresholds();

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check event thresholds and trigger alerts
  private checkEventThresholds(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Count events by severity in the last hour
    const eventCounts = {
      [SecurityEventSeverity.LOW]: 0,
      [SecurityEventSeverity.MEDIUM]: 0,
      [SecurityEventSeverity.HIGH]: 0,
      [SecurityEventSeverity.CRITICAL]: 0
    };

    this.events
      .filter(event => event.timestamp > oneHourAgo)
      .forEach(event => {
        eventCounts[event.severity]++;
      });

    // Check thresholds
    Object.entries(this.alertThresholds).forEach(([severity, threshold]) => {
      if (eventCounts[severity as SecurityEventSeverity] >= threshold) {
        this.triggerAlert(severity as SecurityEventSeverity, eventCounts[severity as SecurityEventSeverity]);
      }
    });
  }

  // Trigger security alert
  private triggerAlert(severity: SecurityEventSeverity, count: number): void {
    const message = `Security alert: ${count} ${severity} events detected in the last hour`;
    
    logger.error(`Security Alert: ${message}`);
    
    // In production, you would integrate with external monitoring services
    // like Sentry, Datadog, or custom alerting systems
    if (severity === SecurityEventSeverity.CRITICAL) {
      // Send critical alert to administrators
      this.sendCriticalAlert(message);
    }
  }

  // Send critical alert
  private sendCriticalAlert(message: string): void {
    // In production, integrate with email, SMS, or other alerting systems
    logger.error(`CRITICAL SECURITY ALERT: ${message}`);
    
    // You could also integrate with services like:
    // - Sentry
    // - Datadog
    // - PagerDuty
    // - Slack webhooks
    // - Email notifications
  }

  // Get security events
  public getEvents(
    filters: {
      type?: SecurityEventType;
      severity?: SecurityEventSeverity;
      userId?: string;
      ipAddress?: string;
      startDate?: Date;
      endDate?: Date;
      resolved?: boolean;
    } = {},
    limit: number = 100,
    offset: number = 0
  ): SecurityEvent[] {
    let filteredEvents = [...this.events];

    // Apply filters
    if (filters.type) {
      filteredEvents = filteredEvents.filter(event => event.type === filters.type);
    }
    if (filters.severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === filters.severity);
    }
    if (filters.userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === filters.userId);
    }
    if (filters.ipAddress) {
      filteredEvents = filteredEvents.filter(event => event.ipAddress === filters.ipAddress);
    }
    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(event => event.timestamp <= filters.endDate!);
    }
    if (filters.resolved !== undefined) {
      filteredEvents = filteredEvents.filter(event => event.resolved === filters.resolved);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    return filteredEvents.slice(offset, offset + limit);
  }

  // Get security statistics
  public getStatistics(): {
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecurityEventSeverity, number>;
    eventsByUser: Record<string, number>;
    eventsByIP: Record<string, number>;
    recentEvents: SecurityEvent[];
    unresolvedEvents: SecurityEvent[];
  } {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const eventsByType: Record<SecurityEventType, number> = {} as any;
    const eventsBySeverity: Record<SecurityEventSeverity, number> = {} as any;
    const eventsByUser: Record<string, number> = {};
    const eventsByIP: Record<string, number> = {};

    // Initialize counters
    Object.values(SecurityEventType).forEach(type => {
      eventsByType[type] = 0;
    });
    Object.values(SecurityEventSeverity).forEach(severity => {
      eventsBySeverity[severity] = 0;
    });

    // Count events
    this.events.forEach(event => {
      eventsByType[event.type]++;
      eventsBySeverity[event.severity]++;
      
      if (event.userId) {
        eventsByUser[event.userId] = (eventsByUser[event.userId] || 0) + 1;
      }
      
      eventsByIP[event.ipAddress] = (eventsByIP[event.ipAddress] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      eventsByUser,
      eventsByIP,
      recentEvents: this.events
        .filter(event => event.timestamp > oneDayAgo)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10),
      unresolvedEvents: this.events
        .filter(event => !event.resolved)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    };
  }

  // Resolve security event
  public resolveEvent(eventId: string, resolvedBy: string): boolean {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.resolved = true;
      event.resolvedAt = new Date();
      event.resolvedBy = resolvedBy;
      logger.info(`Security event resolved: ${eventId}`);
      return true;
    }
    return false;
  }

  // Get security score
  public getSecurityScore(): number {
    const stats = this.getStatistics();
    
    // Calculate security score based on various factors
    let score = 100; // Start with perfect score

    // Deduct points for unresolved critical events
    const unresolvedCritical = stats.unresolvedEvents.filter(e => e.severity === SecurityEventSeverity.CRITICAL).length;
    score -= unresolvedCritical * 20;

    // Deduct points for unresolved high severity events
    const unresolvedHigh = stats.unresolvedEvents.filter(e => e.severity === SecurityEventSeverity.HIGH).length;
    score -= unresolvedHigh * 10;

    // Deduct points for unresolved medium severity events
    const unresolvedMedium = stats.unresolvedEvents.filter(e => e.severity === SecurityEventSeverity.MEDIUM).length;
    score -= unresolvedMedium * 5;

    // Deduct points for excessive login failures
    const loginFailures = stats.eventsByType[SecurityEventType.LOGIN_FAILURE];
    if (loginFailures > 100) {
      score -= 10;
    }

    // Deduct points for suspicious activity
    const suspiciousActivity = stats.eventsByType[SecurityEventType.SUSPICIOUS_ACTIVITY];
    if (suspiciousActivity > 50) {
      score -= 15;
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  // Generate security report
  public generateReport(): {
    summary: string;
    score: number;
    statistics: ReturnType<typeof this.getStatistics>;
    recommendations: string[];
    generatedAt: Date;
  } {
    const score = this.getSecurityScore();
    const stats = this.getStatistics();
    
    const recommendations: string[] = [];

    // Generate recommendations based on security score
    if (score < 50) {
      recommendations.push('CRITICAL: Immediate security attention required. Review all security logs and implement additional security measures.');
    } else if (score < 70) {
      recommendations.push('HIGH: Security issues detected. Review and address security vulnerabilities.');
    } else if (score < 85) {
      recommendations.push('MEDIUM: Some security concerns identified. Consider implementing additional security measures.');
    } else {
      recommendations.push('LOW: Security posture is good. Continue monitoring for potential issues.');
    }

    // Add specific recommendations based on statistics
    if (stats.eventsByType[SecurityEventType.LOGIN_FAILURE] > 50) {
      recommendations.push('High number of login failures detected. Consider implementing account lockout or two-factor authentication.');
    }

    if (stats.eventsByType[SecurityEventType.SUSPICIOUS_ACTIVITY] > 20) {
      recommendations.push('Suspicious activity detected. Review IP addresses and user behavior patterns.');
    }

    if (stats.unresolvedEvents.length > 10) {
      recommendations.push('High number of unresolved security events. Prioritize resolving these issues.');
    }

    return {
      summary: `Security audit completed with score of ${score}/100`,
      score,
      statistics: stats,
      recommendations,
      generatedAt: new Date()
    };
  }

  // Export security events
  public exportEvents(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.events, null, 2);
    } else if (format === 'csv') {
      const headers = [
        'ID', 'Type', 'Severity', 'User ID', 'Session ID', 
        'IP Address', 'User Agent', 'Timestamp', 'Description', 'Details', 'Resolved'
      ];
      
      const rows = this.events.map(event => [
        event.id,
        event.type,
        event.severity,
        event.userId || '',
        event.sessionId || '',
        event.ipAddress,
        event.userAgent,
        event.timestamp.toISOString(),
        event.description,
        JSON.stringify(event.details),
        event.resolved.toString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return '';
  }

  // Clear old events
  public clearOldEvents(olderThan: number = 30): number {
    const cutoffDate = new Date(Date.now() - olderThan * 24 * 60 * 60 * 1000);
    const initialCount = this.events.length;
    
    this.events = this.events.filter(event => event.timestamp > cutoffDate);
    
    const clearedCount = initialCount - this.events.length;
    if (clearedCount > 0) {
      logger.info(`Cleared ${clearedCount} old security events`);
    }
    
    return clearedCount;
  }
}

// Create singleton instance
export const securityAuditService = new SecurityAuditService();

// Security middleware for logging events
export const securityAuditMiddleware = (req: Request, res: Response, next: Function) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Log security events based on response status
    if (res.statusCode === 401) {
      securityAuditService.logEvent(
        SecurityEventType.UNAUTHORIZED_ACCESS,
        SecurityEventSeverity.MEDIUM,
        'Unauthorized access attempt',
        { 
          path: req.path,
          method: req.method,
          statusCode: res.statusCode
        },
        req
      );
    } else if (res.statusCode === 403) {
      securityAuditService.logEvent(
        SecurityEventType.PERMISSION_DENIED,
        SecurityEventSeverity.MEDIUM,
        'Permission denied',
        { 
          path: req.path,
          method: req.method,
          statusCode: res.statusCode
        },
        req
      );
    } else if (res.statusCode === 429) {
      securityAuditService.logEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        SecurityEventSeverity.LOW,
        'Rate limit exceeded',
        { 
          path: req.path,
          method: req.method,
          statusCode: res.statusCode
        },
        req
      );
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};