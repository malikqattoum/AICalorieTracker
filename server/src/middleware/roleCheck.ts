import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has required role
 */
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore - User is added by passport
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // @ts-ignore - role property may not be defined in User type
    if (user.role !== requiredRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};