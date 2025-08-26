import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage-provider";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { authRateLimiter, registerRateLimiter } from "./rate-limiter";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function comparePasswords(supplied: string, stored: string) {
  console.log('=== PASSWORD COMPARISON DEBUG ===');
  console.log('Stored password length:', stored.length);
  console.log('Stored password format:', stored.includes('$2b') ? 'bcrypt' : 'unknown');
  console.log('Stored password preview:', stored.substring(0, 20) + '...');
  
  try {
    const isValid = await bcrypt.compare(supplied, stored);
    console.log('Password comparison result:', isValid ? 'VALID' : 'INVALID');
    return isValid;
  } catch (error) {
    console.error('Password comparison error:', error);
    throw error;
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
        
        
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
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

  app.post("/api/login", authRateLimiter, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

}