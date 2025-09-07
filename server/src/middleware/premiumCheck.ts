import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has premium access
 */
export const requirePremium = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user has premium access
  if (!user.isPremium && user.role !== 'admin') {
    return res.status(403).json({
      error: 'Premium subscription required',
      message: 'This feature requires a premium subscription. Please upgrade to access this functionality.'
    });
  }

  next();
};

/**
 * Middleware to check user ownership of resources
 */
export const requireOwnership = (resourceUserIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const resourceUserId = req.params[resourceUserIdParam] || req.body[resourceUserIdParam] || req.query[resourceUserIdParam];

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Allow admins to access any resource
    if (user.role === 'admin') {
      return next();
    }

    // Check if the user owns the resource
    if (resourceUserId && parseInt(resourceUserId) !== user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }

    // If no specific userId provided, assume current user's resources
    if (!resourceUserId) {
      (req as any).resourceUserId = user.id;
    }

    next();
  };
};

/**
 * Combined middleware for premium + ownership check
 */
export const requirePremiumAndOwnership = (resourceUserIdParam: string = 'userId') => {
  return [requirePremium, requireOwnership(resourceUserIdParam)];
};

export default {
  requirePremium,
  requireOwnership,
  requirePremiumAndOwnership
};