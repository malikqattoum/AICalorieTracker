import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage-provider";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  console.log('[AUTH] Setting up authentication...');
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "nutriscan-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      httpOnly: true, // Prevent client-side access to cookie
      secure: process.env.NODE_ENV === 'production' && !process.env.LOCAL_DEV, // Only send cookie over HTTPS in production
      sameSite: 'strict' // Prevent CSRF attacks
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  console.log('[AUTH] Authentication middleware set up');

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log('=== AUTHENTICATION DEBUG ===');
        console.log('Attempting to authenticate user:', username);
        
        // Try to find user by username first, then by email
        let user = await storage.getUserByUsername(username);
        if (!user) {
          user = await storage.getUserByEmail(username);
        }
        
        console.log('User found:', user ? 'YES' : 'NO');
        
        if (user) {
          console.log('User ID:', user.id);
          console.log('Username:', user.username);
          console.log('Email:', user.email);
          console.log('Password hash length:', user.password?.length || 0);
          console.log('Password hash format:', user.password?.includes('$2b') ? 'bcrypt' : 'unknown');
        }
        
        
        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
          console.log('Authentication failed: invalid credentials');
          return done(null, false);
        } else {
          console.log('Authentication successful');
          return done(null, user);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint is now handled in server/src/routes/auth/index.ts
  // This prevents route conflicts and ensures proper error handling


}