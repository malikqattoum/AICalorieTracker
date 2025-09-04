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

import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
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
import { PORT } from "./config";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
// Import image storage service
import { imageStorageService } from "./src/services/imageStorageService";

export const app = express();

// Apply JSON middleware before any routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));


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

// Apply JSON middleware before security middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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
