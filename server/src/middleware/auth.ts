import { Request, Response, NextFunction } from 'express';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated via session
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // If not authenticated, return 401
  return res.status(401).json({ message: 'Authentication required' });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user || (req.user as any).role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  return next();
}
// Aliases for different naming conventions
export const isAdmin = requireAdmin;
export const isAuthenticated = authenticateToken;
