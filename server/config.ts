import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const HIPAA_COMPLIANCE_ENABLED = process.env.HIPAA_COMPLIANCE_ENABLED === 'true';

// Require proper encryption key in production
if (NODE_ENV === 'production' && (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === 'default-encryption-key-change-in-production')) {
  throw new Error('ENCRYPTION_KEY must be set in production environment');
}
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

// Require proper session secret in production
if (NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'default-session-secret-change-in-production')) {
  throw new Error('SESSION_SECRET must be set in production environment');
}
export const SESSION_SECRET = process.env.SESSION_SECRET || 'default-session-secret-change-in-production';

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_stripe_webhook_secret';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-gemini-api-key';

// Database configuration
export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;
export const DB_USER = process.env.DB_USER || 'root';
export const DB_PASSWORD = process.env.DB_PASSWORD || '';
export const DB_NAME = process.env.DB_NAME || 'calorie_tracker';