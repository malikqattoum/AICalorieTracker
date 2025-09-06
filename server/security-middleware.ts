import { Request, Response, NextFunction } from "express";

/**
 * Security middleware to add comprehensive security headers
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://api.stripe.com https://hooks.stripe.com; " +
    "frame-src 'none'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none'; " +
    "block-all-mixed-content"
  );

  // Strict Transport Security (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // X-Content-Type-Options
  res.setHeader("X-Content-Type-Options", "nosniff");

  // X-Frame-Options
  res.setHeader("X-Frame-Options", "DENY");

  // X-XSS-Protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  res.setHeader(
    "Permissions-Policy",
    "camera=(), " +
    "microphone=(), " +
    "geolocation=(), " +
    "payment=(), " +
    "usb=(), " +
    "accelerometer=(), " +
    "autoplay=(), " +
    "document-domain=(), " +
    "encrypted-media=(), " +
    "fullscreen=(self), " +
    "gyroscope=(), " +
    "magnetometer=(), " +
    "midi=(), " +
    "payment=(), " +
    "picture-in-picture=(), " +
    "publickey-credentials-get=(), " +
    "screen-wake-lock=(), " +
    "sync-xhr=(), " +
    "usb=(), " +
    "web-share=(), " +
    "xr-spatial-tracking=()"
  );

  // Remove server header for security
  res.removeHeader("Server");

  next();
};

/**
 * CORS middleware with secure configuration
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://aical.scanitix.com'] 
    : ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5173'];

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin as string)) {
    res.setHeader('Access-Control-Allow-Origin', origin as string);
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Requested-With, Cache-Control, Pragma'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

/**
 * Input validation and sanitization middleware
 * Modified to preserve base64 image data while still preventing XSS attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize user input to prevent XSS attacks
  const sanitize = (obj: any) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Check if this might be base64 image data (preserve it)
        const isBase64Data = obj[key].includes('base64,') || /^[A-Za-z0-9+/]*={0,2}$/.test(obj[key]);
        
        if (!isBase64Data) {
          // Only sanitize non-base64 strings
          obj[key] = obj[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitize(req.body);
  }

  if (req.query) {
    sanitize(req.query);
  }

  if (req.params) {
    sanitize(req.params);
  }

  next();
};

/**
 * Request size limiting middleware
 */
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const maxRequestSize = 50 * 1024 * 1024; // 50MB

  // Check Content-Length header for POST/PUT requests
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxRequestSize) {
      return res.status(413).json({
        error: 'Request entity too large',
        message: `Request size exceeds the maximum allowed size of ${maxRequestSize / (1024 * 1024)}MB`
      });
    }
  }

  next();
};

/**
 * Rate limiting for API endpoints
 */
export const apiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // This is a simple implementation - in production, use express-rate-limit
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  // In a real implementation, you would store this in Redis or similar
  // For now, we'll just pass through
  next();
};