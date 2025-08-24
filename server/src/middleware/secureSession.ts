import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { securityUtils } from '../config/security';

const logger = new Logger('SecureSession');

// Session interface
interface Session {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  lastAccessed: number;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

// In-memory session store (in production, use Redis or database)
const sessionStore = new Map<string, Session>();

// Session configuration
const SESSION_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  maxSessionsPerUser: 5,
  maxInactiveTime: 30 * 60 * 1000 // 30 minutes
};

// Session cleanup function
function cleanupExpiredSessions(): void {
  const now = Date.now();
  const expiredSessions: string[] = [];
  
  sessionStore.forEach((session, sessionId) => {
    if (now > session.expiresAt || !session.isActive) {
      expiredSessions.push(sessionId);
    }
  });
  
  expiredSessions.forEach(sessionId => {
    sessionStore.delete(sessionId);
    logger.debug('Cleaned up expired session:', sessionId);
  });
}

// Start session cleanup interval
setInterval(cleanupExpiredSessions, SESSION_CONFIG.cleanupInterval);

// Session middleware
export const sessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string;
  const clientIp = req.ip || 'unknown';
  const userAgent = req.get('User-Agent') || '';
  
  if (sessionId) {
    // Validate existing session
    const session = sessionStore.get(sessionId);
    
    if (session) {
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        sessionStore.delete(sessionId);
        logger.warn('Expired session used:', sessionId);
        return res.status(401).json({
          success: false,
          error: 'Session expired',
          code: 'SESSION_EXPIRED'
        });
      }
      
      // Check if session is inactive for too long
      if (Date.now() - session.lastAccessed > SESSION_CONFIG.maxInactiveTime) {
        sessionStore.delete(sessionId);
        logger.warn('Session inactive too long:', sessionId);
        return res.status(401).json({
          success: false,
          error: 'Session inactive',
          code: 'SESSION_INACTIVE'
        });
      }
      
      // Check if IP address changed significantly
      if (session.ipAddress !== clientIp) {
        logger.warn(`IP address changed for session: ${sessionId}, From: ${session.ipAddress}, To: ${clientIp}`);
        // You can choose to invalidate the session or allow it
      }
      
      // Update session last accessed time
      session.lastAccessed = Date.now();
      sessionStore.set(sessionId, session);
      
      // Add session to request
      (req as any).session = session;
      (req as any).user = { id: session.userId };
    } else {
      logger.warn('Invalid session ID used:', sessionId);
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
        code: 'INVALID_SESSION'
      });
    }
  } else {
    // Create new session
    const userId = (req as any).user?.id;
    if (!userId) {
      logger.warn('Attempt to create session without authenticated user');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Check maximum sessions per user
    const userSessions = Array.from(sessionStore.values()).filter(s => s.userId === userId);
    if (userSessions.length >= SESSION_CONFIG.maxSessionsPerUser) {
      logger.warn('Maximum sessions reached for user:', userId);
      // Remove oldest session
      const oldestSession = userSessions.reduce((oldest, current) => 
        current.createdAt < oldest.createdAt ? current : oldest
      );
      sessionStore.delete(oldestSession.id);
    }
    
    // Create new session
    const sessionId = securityUtils.generateToken(64);
    const newSession: Session = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_CONFIG.maxAge,
      lastAccessed: Date.now(),
      ipAddress: clientIp,
      userAgent,
      isActive: true
    };
    
    sessionStore.set(sessionId, newSession);
    (req as any).session = newSession;
    (req as any).user = { id: userId };
    
    // Set session cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_CONFIG.maxAge,
      path: '/'
    });
    
    logger.info('New session created for user:', userId);
  }
  
  next();
};

// Session management functions
export const sessionManager = {
  // Get session by ID
  getSession: (sessionId: string): Session | undefined => {
    return sessionStore.get(sessionId);
  },
  
  // Get all sessions for user
  getUserSessions: (userId: string): Session[] => {
    return Array.from(sessionStore.values()).filter(s => s.userId === userId);
  },
  
  // Invalidate session
  invalidateSession: (sessionId: string): boolean => {
    const session = sessionStore.get(sessionId);
    if (session) {
      session.isActive = false;
      sessionStore.delete(sessionId);
      logger.info('Session invalidated:', sessionId);
      return true;
    }
    return false;
  },
  
  // Invalidate all sessions for user
  invalidateUserSessions: (userId: string): number => {
    const userSessions = Array.from(sessionStore.values()).filter(s => s.userId === userId);
    userSessions.forEach(session => {
      session.isActive = false;
      sessionStore.delete(session.id);
    });
    logger.info(`Invalidated ${userSessions.length} sessions for user:`, userId);
    return userSessions.length;
  },
  
  // Extend session
  extendSession: (sessionId: string): boolean => {
    const session = sessionStore.get(sessionId);
    if (session && session.isActive) {
      session.expiresAt = Date.now() + SESSION_CONFIG.maxAge;
      session.lastAccessed = Date.now();
      sessionStore.set(sessionId, session);
      logger.debug('Session extended:', sessionId);
      return true;
    }
    return false;
  },
  
  // Get session statistics
  getSessionStats: () => {
    const totalSessions = sessionStore.size;
    const activeSessions = Array.from(sessionStore.values()).filter(s => s.isActive).length;
    const expiredSessions = totalSessions - activeSessions;
    
    return {
      totalSessions,
      activeSessions,
      expiredSessions,
      cleanupInterval: SESSION_CONFIG.cleanupInterval
    };
  }
};

// Session validation middleware
export const validateSession = (req: Request, res: Response, next: NextFunction) => {
  const session = (req as any).session;
  
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Session required',
      code: 'SESSION_REQUIRED'
    });
  }
  
  if (!session.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Session not active',
      code: 'SESSION_NOT_ACTIVE'
    });
  }
  
  next();
};

// Session refresh middleware
export const refreshSession = (req: Request, res: Response, next: NextFunction) => {
  const session = (req as any).session;
  
  if (session) {
    // Extend session if it's about to expire (within 1 hour)
    const now = Date.now();
    const timeUntilExpiry = session.expiresAt - now;
    
    if (timeUntilExpiry < 60 * 60 * 1000) { // Less than 1 hour
      sessionManager.extendSession(session.id);
      logger.debug('Session refreshed:', session.id);
    }
  }
  
  next();
};

// Logout middleware
export const logout = (req: Request, res: Response) => {
  const session = (req as any).session;
  
  if (session) {
    sessionManager.invalidateSession(session.id);
    res.clearCookie('sessionId');
    logger.info('User logged out:', session.userId);
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date()
  });
};

// Export session utilities
export const sessionUtils = {
  // Generate secure session ID
  generateSessionId: (): string => {
    return securityUtils.generateToken(64);
  },
  
  // Validate session ID format
  validateSessionId: (sessionId: string): boolean => {
    return /^[a-zA-Z0-9_-]{32,}$/.test(sessionId);
  },
  
  // Check if session is expired
  isSessionExpired: (session: Session): boolean => {
    return Date.now() > session.expiresAt;
  },
  
  // Check if session is inactive
  isSessionInactive: (session: Session): boolean => {
    return Date.now() - session.lastAccessed > SESSION_CONFIG.maxInactiveTime;
  }
};