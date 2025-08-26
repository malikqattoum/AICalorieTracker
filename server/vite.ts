import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

// ES Module __dirname replacement
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Apply Vite middleware only to non-API routes
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/')) {
      console.log('[VITE] Skipping API route:', req.originalUrl);
      return next();
    }
    console.log('[VITE] Handling non-API route:', req.originalUrl);
    vite.middlewares(req, res, next);
  });
  
  // Serve React app only for non-API routes
  app.use("*", async (req, res, next) => {
    console.log('[DEBUG] Request received for:', req.originalUrl);
    console.log('[DEBUG] User-Agent:', req.get('User-Agent'));
    
    if (req.originalUrl.startsWith('/api/')) {
      console.log('[DEBUG] Skipping API route');
      return next();
    }
    
    // Skip if already handled by Vite
    if (res.headersSent) {
      console.log('[DEBUG] Response already sent, skipping');
      return next();
    }

    // Handle client requests
    try {
      const url = req.originalUrl;
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );
      
      console.log('[DEBUG] Attempting to serve client template from:', clientTemplate);
      
      // Check if client template exists
      if (!fs.existsSync(clientTemplate)) {
        console.error('[ERROR] Client template not found:', clientTemplate);
        throw new Error('Client template not found');
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      console.log('[DEBUG] Client template loaded, length:', template.length);
      
      template = template.replace(
        `src="./src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      
      const page = await vite.transformIndexHtml(url, template);
      console.log('[DEBUG] Transformed HTML, length:', page.length);
      
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
      console.log('[DEBUG] Successfully served React app');
    } catch (e) {
      console.error('[ERROR] Failed to serve React app:', e);
      vite.ssrFixStacktrace(e as Error);
      res.status(500).end((e as Error).message);
    }
  });
}

export function serveStatic(app: Express) {
  console.log('[SERVE-STATIC] Setting up static file serving...');
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.error('[ERROR] Build directory not found:', distPath);
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  console.log('[SERVE-STATIC] Serving static files from:', distPath);
  
  // Serve static files, but skip API routes
  app.use(express.static(distPath));

  // Handle non-API routes with a catch-all that serves index.html for client-side routing
  app.use("*", (req, res, next) => {
    // Skip API routes - let them be handled by the API routes or 404 handler
    if (req.originalUrl.startsWith('/api/')) {
      console.log('[SERVE-STATIC] Skipping API route:', req.originalUrl);
      return next(); // Let the next middleware handle it
    }
    
    // For non-API routes, serve the React app (client-side routing will handle the rest)
    try {
      const url = req.originalUrl;
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "dist",
        "public",
        "index.html"
      );
      
      // Check if client template exists
      if (!fs.existsSync(clientTemplate)) {
        console.error('[ERROR] Client template not found:', clientTemplate);
        return res.status(404).send('Client not built');
      }

      // Read and serve the index.html
      let template = fs.readFileSync(clientTemplate, "utf-8");
      
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      console.error('[ERROR] Failed to serve static file:', e);
      next(e);
    }
  });
}
