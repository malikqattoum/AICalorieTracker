import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server and project root reliably (works after bundling)
const envCandidates = [
  path.resolve(__dirname, '../server/.env'), // when running from dist/
  path.resolve(__dirname, '.env'),           // if .env is alongside compiled file
  path.resolve(process.cwd(), '.env')        // project root
];
for (const envPath of envCandidates) {
  dotenv.config({ path: envPath });
}

// Local log function to avoid importing Vite dependencies
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { errorHandler } from "./error-handler";
import { securityHeaders, corsMiddleware, sanitizeInput, requestSizeLimiter } from "./security-middleware";
import { createTimeoutMiddleware } from "./src/middleware/timeoutMiddleware";
import healthRouter from "./src/routes/health";
import { errorTrackingService } from "./src/services/errorTrackingService";
import { performanceMonitoringMiddleware } from "./src/utils/performanceMonitor";
import { Logger } from "./src/utils/logger";
import { enhancedSecurityMiddleware, rateLimiters } from "./src/middleware/securityEnhanced";
import { sessionMiddleware, validateSession, refreshSession } from "./src/middleware/secureSession";
import { securityAuditService, securityAuditMiddleware } from "./src/services/securityAuditService";
import { enforceHttps } from "./src/middleware/security";
import { PORT } from "./config";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
// Import image storage service
import { imageStorageService } from "./src/services/imageStorageService";

export const app = express();

// Trust proxy configuration - must be set before any middleware that uses req.ip
// Use a numeric hop count to avoid permissive trust proxy issues with rate limiters
app.set('trust proxy', 1);

// Apply JSON middleware before any routes with enhanced logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('[PRE-PARSING] Headers:', req.headers);
  console.log('[PRE-PARSING] Raw headers:', req.rawHeaders);
  next();
});

// Enhanced body parsing middleware with proper Content-Type validation
app.use(express.json({
  limit: '50mb',
  strict: false,
  verify: (req: Request, res: Response, buf: Buffer, encoding: string) => {
    // Add custom verification for JSON parsing
    try {
      JSON.parse(buf.toString(encoding as BufferEncoding || 'utf8'));
    } catch (e) {
      // If JSON parsing fails, let the request continue
      // This allows form data to be handled by urlencoded middleware
    }
  }
}));

// Use extended: true to handle complex form data and nested objects
app.use(express.urlencoded({
  extended: true,
  limit: '50mb',
  parameterLimit: 10000,
  verify: (req: Request, res: Response, buf: Buffer, encoding: string) => {
    // Add custom verification for URL-encoded data
    try {
      const str = buf.toString(encoding as BufferEncoding || 'utf8');
      // Basic validation for URL-encoded format
      if (str && str.includes('=')) {
        // Parse the URL-encoded string to validate it
        const urlSearchParams = new URLSearchParams(str);
        urlSearchParams.toString(); // This will throw if the format is invalid
      }
    } catch (e) {
      // If URL-encoded parsing fails, let the request continue
      // The error will be handled by the error handling middleware
    }
  }
}));

// Fix misformatted URL-encoded payloads where JSON was stringified as a key
// Handles cases like:
// 1) {"a":1,"b":2} as the only key with empty value
// 2) {"...","allergies": as key and the value object containing selected items as keys
app.use((req: Request, res: Response, next: NextFunction) => {
  const contentType = req.get('Content-Type') || '';
  if (contentType.includes('application/x-www-form-urlencoded') && req.body && typeof req.body === 'object') {
    const keys = Object.keys(req.body);
    if (keys.length === 1) {
      const soleKey = keys[0].trim();
      const soleVal: any = (req.body as any)[keys[0]];
      // Case 1: entire JSON string used as a key with empty value
      if (soleKey.startsWith('{') && soleKey.endsWith('}') && soleVal === '') {
        try {
          const parsed = JSON.parse(soleKey);
          if (parsed && typeof parsed === 'object') {
            req.body = parsed;
          }
        } catch (e) {
          // Ignore parsing errors and continue
        }
      }
      // Case 2: partial JSON where last property (e.g., allergies) is missing its value,
      // and the value came through as an object whose keys are the chosen items.
      // Example:
      // key: '{"name":"x", ... , "allergies":'
      // val: { '"Peanuts"': '' }
      else if (soleKey.startsWith('{') && /"(allergies|dietaryPreferences)":\s*$/.test(soleKey) && soleVal && typeof soleVal === 'object') {
        try {
          // Convert object keys to an array of strings, unwrapping extra quotes if present
          const arr = Object.keys(soleVal).map(k => {
            try { return JSON.parse(k); } catch { return k.replace(/^\"|\"$/g, '').replace(/^"|"$/g, ''); }
          });
          const reconstructed = `${soleKey}${JSON.stringify(arr)}}`;
          const parsed = JSON.parse(reconstructed);
          if (parsed && typeof parsed === 'object') {
            req.body = parsed;
          }
        } catch (e) {
          // Ignore parsing errors and continue
        }
      }
    }
  }
  next();
});

// Enhanced body logging with Content-Type information
app.use((req: Request, res: Response, next: NextFunction) => {
  const contentType = req.get('Content-Type') || 'unknown';
  console.log('[POST-PARSING] Content-Type:', contentType);
  if (process.env.NODE_ENV !== 'production') {
    console.log('[POST-PARSING] Body:', req.body);
    console.log('[POST-PARSING] Body type:', typeof req.body);
    console.log('[POST-PARSING] Body keys:', Object.keys(req.body || {}));
  }
  next();
});

// Add Content-Type validation middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const contentType = req.get('Content-Type');
  
  // Validate Content-Type for JSON and form data
  if (contentType) {
    if (contentType.includes('application/json') && typeof req.body !== 'object') {
      console.warn('[CONTENT-TYPE-WARNING] Content-Type indicates JSON but body is not an object');
    } else if (contentType.includes('application/x-www-form-urlencoded') && typeof req.body !== 'object') {
      console.warn('[CONTENT-TYPE-WARNING] Content-Type indicates form data but body is not an object');
    }
  }
  
  next();
});

// Apply HTTPS enforcement middleware (must be early)
app.use(enforceHttps);

// Configure static file serving for uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: '1y', // Cache for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set content type for images
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));
console.log('[SERVER] Static file serving configured for uploads directory');

// Image storage service will be initialized in the async function below

// Register API routes FIRST (before any middleware)
console.log('[SERVER] Registering routes...');
console.log('[SERVER] NODE_ENV:', process.env.NODE_ENV);
console.log('[SERVER] Environment is development:', process.env.NODE_ENV === "development");
registerRoutes(app);
console.log('[SERVER] Routes registered');

// Remove duplicate JSON middleware - already applied above

// Apply enhanced security middleware
app.use(enhancedSecurityMiddleware);
app.use(rateLimiters.api);

// Apply timeout middleware globally with longer timeouts to avoid proxy socket hangups during AI calls
app.use(createTimeoutMiddleware({ responseTimeout: 120000, requestTimeout: 300000 }));

// Apply session middleware only to protected routes (moved after public routes)

// Add performance monitoring middleware
const logger = new Logger('Performance');
import { defaultPerformanceMonitor } from "./src/utils/performanceMonitor";
app.use(performanceMonitoringMiddleware(defaultPerformanceMonitor, logger));

// Add health check routes (no timeout for health checks)
app.use('/api/health', (req: Request, res: Response, next: NextFunction) => {
  // Skip timeout middleware for health checks
  next();
}, healthRouter);


// Add a simple test endpoint for mobile app debugging
app.get('/api/test', (req: Request, res: Response) => {
  log('=== TEST ENDPOINT HIT ===');
  log('Request received from mobile app');
  log('Sending test response');
  
  res.json({
    success: true,
    message: 'Mobile app test endpoint working',
    timestamp: new Date().toISOString(),
    server: 'AI Calorie Tracker Backend',
    version: '1.0.0'
  });
});

// Add a test endpoint for form data validation
app.post('/api/test-form-data', (req: Request, res: Response) => {
  log('=== FORM DATA TEST ENDPOINT HIT ===');
  log('Content-Type:', req.get('Content-Type'));
  log('Parsed body:', req.body);
  log('Body type:', typeof req.body);
  log('Body keys:', Object.keys(req.body || {}).join(', '));
  
  res.json({
    success: true,
    message: 'Form data test endpoint working',
    timestamp: new Date().toISOString(),
    receivedBody: req.body,
    bodyType: typeof req.body,
    bodyKeys: Object.keys(req.body || {}),
    contentType: req.get('Content-Type')
  });
});

// Add a public connectivity test endpoint
app.get('/api/connectivity-test', (req: Request, res: Response) => {
  log('=== CONNECTIVITY TEST ENDPOINT HIT ===');
  log('Request received from mobile app');
  log('Sending connectivity test response');
  
  res.json({
    success: true,
    message: 'Connectivity test successful',
    timestamp: new Date().toISOString(),
    server: 'AI Calorie Tracker Backend',
    version: '1.0.0',
    ip: req.ip,
    headers: {
      'user-agent': req.get('User-Agent'),
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP')
    }
  });
});

// Add a database health check endpoint
app.get('/api/health/db', async (req: Request, res: Response) => {
  log('=== DATABASE HEALTH CHECK ENDPOINT HIT ===');
  
  try {
    // Test database connection
    const { storage } = await import('./storage-provider');
    
    // Test site content table access
    const testContent = await storage.getSiteContent('test_key');
    log('Database health check successful');
    
    res.json({
      success: true,
      message: 'Database health check passed',
      timestamp: new Date().toISOString(),
      storageType: storage.constructor.name,
      testContent: testContent
    });
  } catch (error) {
    log('Database health check failed:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});
// Add a 404 handler for API routes that don't exist
app.use('/api/*', (req: Request, res: Response) => {
  console.log(`[API-404] API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
    method: req.method,
    path: req.originalUrl
  });
});

// Add public routes (no authentication required)
app.get('/api/public/connectivity-test', (req: Request, res: Response) => {
  log('=== PUBLIC CONNECTIVITY TEST ENDPOINT HIT ===');
  log('Request received from mobile app');
  log('Sending connectivity test response');
  
  res.json({
    success: true,
    message: 'Public connectivity test successful',
    timestamp: new Date().toISOString(),
    server: 'AI Calorie Tracker Backend',
    version: '1.0.0',
    ip: req.ip,
    headers: {
      'user-agent': req.get('User-Agent'),
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP')
    }
  });
});
// Add a 404 handler for API routes that don't exist
app.use('/api/*', (req: Request, res: Response) => {
  console.log(`[API-404] API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
    method: req.method,
    path: req.originalUrl
  });
});


// Add protected routes with session validation
app.use('/api/auth/refresh', sessionMiddleware, validateSession, refreshSession);
// Note: Individual routes will handle their own authentication middleware

// Install global error handlers
errorTrackingService.installGlobalHandlers();

// Install security audit middleware
app.use(securityAuditMiddleware);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: unknown) {
    capturedJsonResponse = bodyJson as Record<string, any>;
    return originalResJson.call(res, bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Enhanced diagnostic logging for mobile app debugging
      log(`=== API RESPONSE DEBUG ===`);
      log(`Method: ${req.method}`);
      log(`Path: ${path}`);
      log(`Status: ${res.statusCode}`);
      log(`Duration: ${duration}ms`);
      log(`Content-Type: ${res.get('content-type')}`);
      log(`Content-Length: ${res.get('content-length')}`);
      
      if (capturedJsonResponse) {
        log(`Response Data Type: ${typeof capturedJsonResponse}`);
        log(`Response Data Size: ${JSON.stringify(capturedJsonResponse).length} chars`);
        log(`Response Data: ${JSON.stringify(capturedJsonResponse).substring(0, 200)}${JSON.stringify(capturedJsonResponse).length > 200 ? '...' : ''}`);
      } else {
        log(`No JSON response captured`);
      }
      log(`=========================`);

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});


// Handle graceful shutdown
let serverInstance: Server | undefined;

process.on('SIGTERM', async () => {
  log('SIGTERM received, shutting down gracefully');
  await errorTrackingService.flush();
  if (serverInstance) {
    serverInstance!.close(() => {
      log('Process terminated');
      process.exit(0);
    });
  }
});

process.on('SIGINT', async () => {
  log('SIGINT received, shutting down gracefully');
  await errorTrackingService.flush();
  if (serverInstance) {
    serverInstance!.close(() => {
      log('Process terminated');
      process.exit(0);
    });
  }
});

(async () => {
  let server: Server = createServer(app);

// Set up server configuration
if (process.env.NODE_ENV === "development") {
  // In development with concurrent setup, don't use Vite middleware
  // The Vite dev server (running on port 3000) will handle the frontend
  // and proxy API requests to this server (port 3002)
  console.log('[SERVER] Development mode: Express server running on port 3002 for API routes');
  console.log('[SERVER] Vite dev server running on port 3000 for frontend with API proxy');
} else {
  const { serveStatic } = await import("./vite");
  serveStatic(app);
  console.log('[SERVER] Production mode: Using static file serving');
}

  // Initialize image storage service
  try {
    await imageStorageService.initialize();
    console.log('[SERVER] Image storage service initialized successfully');
  } catch (error) {
    console.error('[SERVER] Failed to initialize image storage service:', error);
    // Don't exit the server, just log the error
  }


  
  // Use centralized error handling middleware (after all routes)
  app.use(errorHandler);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || PORT;
  const host = "0.0.0.0";
  console.log(`[SERVER] Attempting to start server on ${host}:${port}`);
  console.log(`[SERVER] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[SERVER] Platform: ${process.platform}`);

  // Increase server connection limits
  server.maxConnections = 100;
  server.timeout = 120000; // 120 seconds
  server.keepAliveTimeout = 125000; // 125 seconds
  server.headersTimeout = 130000; // 130 seconds

  try {
    serverInstance = server!.listen({
      port,
      host,
      // Removed reusePort as it's not supported on Windows
    }, () => {
      log(`[SERVER] Server successfully started and listening on ${host}:${port}`);
    });
    // Handle listen errors
    serverInstance.on('error', (error) => {
      console.error(`[SERVER] Server listen error:`, error);
      console.error(`[SERVER] Error code: ${(error as NodeJS.ErrnoException).code}`);
      console.error(`[SERVER] Error message: ${error.message}`);
      process.exit(1);
    });
  } catch (error) {
    console.error(`[SERVER] Failed to start server:`, error);
    console.error(`[SERVER] Error details:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
})();
