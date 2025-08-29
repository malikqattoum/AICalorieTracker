import { Request, Response, NextFunction } from "express";

// Middleware to check if user is authenticated (JWT-based)
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is an admin (JWT-based)
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // First check if user is authenticated
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if user has admin role
  if (user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }

  return next();
};

// Alias for backward compatibility
export const isAdmin2 = isAdmin;