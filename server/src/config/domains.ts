// Server-side domain configuration module
// Centralizes domain-related settings with environment variable support and fallbacks

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isStaging = process.env.NODE_ENV === 'staging';

// Domain configuration with fallbacks
export const domains = {
  // Support email for user inquiries
  supportEmail: process.env.SUPPORT_EMAIL || 'support@aical.scanitix.com',

  // Privacy policy and terms of service URLs
  privacyUrl: process.env.PRIVACY_URL || 'https://aicalorietracker.com/privacy',
  termsUrl: process.env.TERMS_URL || 'https://aicalorietracker.com/terms',

  // Main application URL
  appUrl: process.env.APP_URL || 'https://aicalorietracker.com',

  // API URLs based on environment
  apiUrl: {
    development: process.env.VITE_API_URL_DEV || 'http://localhost:3000',
    production: process.env.VITE_API_URL_PROD || 'http://146.190.120.35:3002',
    staging: process.env.VITE_API_URL_STAGING || 'https://staging-api.aicalorietracker.com',
  },

  // CORS origins - supports both new CORS_ORIGINS and legacy ALLOWED_ORIGINS
  corsOrigins: (process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || 'https://aicalorietracker.com,https://www.aicalorietracker.com,http://146.190.120.35:3002,https://www.aical.scanitix.com')
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0),

  // Environment-specific CORS origins
  corsOriginsByEnv: {
    development: [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173',
      'http://localhost:4173'
    ],
    production: [
      'https://aicalorietracker.com',
      'https://www.aicalorietracker.com',
      'http://146.190.120.35:3002',
      'https://www.aical.scanitix.com'
    ],
    staging: [
      'https://staging.aicalorietracker.com',
      'https://staging-api.aicalorietracker.com'
    ]
  }
};

// Get current API URL based on environment
export const getCurrentApiUrl = (): string => {
  if (isDevelopment) return domains.apiUrl.development;
  if (isStaging) return domains.apiUrl.staging;
  return domains.apiUrl.production;
};

// Get current CORS origins based on environment
export const getCurrentCorsOrigins = (): string[] => {
  if (isDevelopment) return domains.corsOriginsByEnv.development;
  if (isStaging) return domains.corsOriginsByEnv.staging;
  return domains.corsOriginsByEnv.production;
};

// Utility functions for domain validation
export const isValidDomain = (domain: string): boolean => {
  try {
    const url = new URL(domain);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isAllowedOrigin = (origin: string): boolean => {
  return domains.corsOrigins.includes(origin) ||
         getCurrentCorsOrigins().includes(origin);
};

// Export default configuration
export default domains;