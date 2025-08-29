// API Configuration for Web App
const API_CONFIG = {
  // Development API URL - Force HTTPS for security
  development: 'https://localhost:3000',
  
  // Production API URL
  production: 'https://api.aicalorietracker.com',
  
  // Staging API URL
  staging: 'https://staging-api.aicalorietracker.com',
};

// Get current environment
const getEnvironment = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'development';
  }
  
  // Check for staging environment
  if (typeof window !== 'undefined' && window.location.hostname.includes('staging')) {
    return 'staging';
  }
  
  return 'production';
};

const currentEnv = getEnvironment();

// Export API URL based on environment
export const API_URL = API_CONFIG[currentEnv as keyof typeof API_CONFIG];

// Feature flags for enhanced food recognition
export const FEATURES = {
  enhancedFoodRecognition: true,
  multiItemRecognition: true,
  portionSizeEstimation: true,
  restaurantMenuRecognition: true,
  nutritionalDatabase: true,
  healthScoring: true,
  confidenceThreshold: 0.7,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  supportedImageFormats: ['image/jpeg', 'image/png', 'image/webp'],
  referenceObjects: ['hand', 'credit_card', 'smartphone', 'coin'],
  enable3DEstimation: false,
  enableOfflineMode: false,
  enableBarcodeScanning: true,
  enableNutritionAnalysis: true,
  enableHealthScoring: true,
  enablePortionEstimation: true,
  enableConfidenceDisplay: true,
  enableProcessingTimeDisplay: true,
  enableModelVersionDisplay: true,
  enableErrorHandling: true,
  enableFallbackMode: true,
  enableRetryMechanism: true,
  maxRetryAttempts: 3,
  retryDelay: 1000, // 1 second
  timeout: 30000, // 30 seconds
  cacheResults: true,
  cacheExpiration: 5 * 60 * 1000, // 5 minutes
  enableAnalytics: true,
  enableLogging: true,
  enableDebugMode: false,
};

// Camera configuration
export const CAMERA_CONFIG = {
  videoConstraints: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'environment',
    frameRate: { ideal: 30 }
  },
  imageConstraints: {
    width: 1280,
    height: 720,
    quality: 0.8,
    format: 'image/jpeg'
  },
  maxImageSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFileSizeDisplay: '10MB'
};

// Enhanced food recognition configuration
export const ENHANCED_FOOD_RECOGNITION_CONFIG = {
  // API endpoints
  endpoints: {
    single: '/api/user/enhanced-food-recognition/analyze-single',
    multi: '/api/user/enhanced-food-recognition/analyze-multi',
    barcode: '/api/user/enhanced-food-recognition/barcode-scan',
    restaurant: '/api/user/enhanced-food-recognition/restaurant-menu'
  },
  
  // Default options
  defaultOptions: {
    enablePortionEstimation: true,
    enable3DEstimation: false,
    confidenceThreshold: 0.7,
    referenceObjects: ['hand', 'credit_card', 'smartphone'],
    restaurantMode: false,
    enableHealthScoring: true,
    enableNutritionAnalysis: true,
    enableConfidenceDisplay: true,
    enableProcessingTimeDisplay: true,
    enableModelVersionDisplay: true,
    enableErrorHandling: true,
    enableFallbackMode: true,
    enableRetryMechanism: true,
    maxRetryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000,
    cacheResults: true,
    cacheExpiration: 5 * 60 * 1000
  },
  
  // Supported languages
  supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
  
  // Supported cuisines
  supportedCuisines: [
    'american', 'italian', 'mexican', 'chinese', 'japanese', 'korean', 
    'thai', 'indian', 'mediterranean', 'french', 'german', 'spanish'
  ],
  
  // Confidence levels
  confidenceLevels: {
    high: 0.8,
    medium: 0.6,
    low: 0.4
  },
  
  // Portion size estimation
  portionSizeConfig: {
    referenceObjects: {
      hand: { avgWidth: 8.5, avgHeight: 18, avgDepth: 2.5 }, // cm
      credit_card: { width: 8.56, height: 5.4, depth: 0.76 }, // cm
      smartphone: { width: 6.5, height: 13, depth: 0.8 }, // cm
      coin: { diameter: 2.4, thickness: 0.2 } // cm
    },
    maxPortionSize: 2000, // grams
    minPortionSize: 10, // grams
    defaultPortionSize: 100, // grams
    enable3DEstimation: false,
    enableWeightEstimation: true,
    enableVolumeEstimation: true
  },
  
  // Health scoring
  healthScoringConfig: {
    enableScoring: true,
    maxScore: 100,
    minScore: 0,
    factors: {
      nutritionBalance: 0.4,
      calorieDensity: 0.3,
      processingLevel: 0.2,
      additives: 0.1
    },
    thresholds: {
      excellent: 90,
      good: 75,
      fair: 60,
      poor: 45,
      veryPoor: 0
    }
  },
  
  // Nutrition analysis
  nutritionAnalysisConfig: {
    enableAnalysis: true,
    macronutrients: ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'],
    micronutrients: ['vitamins', 'minerals'],
    allergens: ['gluten', 'dairy', 'nuts', 'soy', 'eggs', 'fish', 'shellfish', 'sesame'],
    enableAllergenDetection: true,
    enableMicronutrientAnalysis: true,
    enableDailyValueCalculation: true,
    dailyValues: {
      calories: 2000,
      protein: 50, // grams
      carbs: 300, // grams
      fat: 65, // grams
      fiber: 25, // grams
      sugar: 50, // grams
      sodium: 2300 // mg
    }
  },
  
  // Error handling
  errorHandlingConfig: {
    enableErrorHandling: true,
    enableFallbackMode: true,
    enableRetryMechanism: true,
    maxRetryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000,
    enableLogging: true,
    enableAnalytics: true,
    enableDebugMode: false,
    errorMessages: {
      networkError: 'Network error. Please check your connection and try again.',
      timeoutError: 'Request timed out. Please try again.',
      processingError: 'Failed to process image. Please try again.',
      confidenceError: 'Low confidence in detection. Please try a clearer image.',
      sizeError: 'Image too large. Please use a smaller image.',
      formatError: 'Unsupported image format. Please use JPEG, PNG, or WebP.',
      permissionError: 'Camera permission denied. Please enable camera access.',
      unknownError: 'An unexpected error occurred. Please try again.'
    }
  }
};

// Security configuration
export const SECURITY_CONFIG = {
  // HTTPS enforcement
  enforceHTTPS: true,
  
  // Token validation
  tokenValidation: {
    minLength: 10,
    maxLength: 2048,
    requireBearerPrefix: true,
    allowRefreshTokens: true,
    maxTokenAge: 30 * 60 * 1000, // 30 minutes
    refreshBuffer: 5 * 60 * 1000, // 5 minutes before expiry
  },
  
  // Rate limiting
  rateLimit: {
    api: {
      max: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    auth: {
      max: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    }
  },
  
  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; worker-src 'self'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; manifest-src 'self'; base-uri 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  
  // CORS configuration
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      'https://aicalorietracker.com',
      'https://www.aicalorietracker.com',
      'https://staging.aicalorietracker.com'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization',
      'X-API-Key', 'X-CSRF-Token', 'X-Session-ID'
    ],
    exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400 // 24 hours
  },
  
  // Request validation
  requestValidation: {
    maxBodySize: '10mb',
    maxUploadSize: '5mb',
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    sanitizeInput: true,
    validateTokenFormat: true,
    checkForSQLInjection: true,
    checkForXSS: true
  },
  
  // Security logging
  logging: {
    enableSecurityLogging: true,
    logAuthenticationAttempts: true,
    logSecurityViolations: true,
    logSuspiciousActivity: true,
    logTokenValidation: true,
    logRequestValidation: true
  }
};

// Export all configurations
export const CONFIG = {
  api: API_URL,
  features: FEATURES,
  camera: CAMERA_CONFIG,
  enhancedFoodRecognition: ENHANCED_FOOD_RECOGNITION_CONFIG,
  security: SECURITY_CONFIG
};

// Utility functions
export const isDevelopment = currentEnv === 'development';
export const isProduction = currentEnv === 'production';
export const isStaging = currentEnv === 'staging';

// Debug logging
export const log = (message: string, data?: any) => {
  if (FEATURES.enableLogging && isDevelopment) {
    console.log(`[${new Date().toISOString()}] ${message}`, data || '');
  }
};

export const logError = (message: string, error?: any) => {
  if (FEATURES.enableLogging) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error || '');
  }
};

export const logInfo = (message: string, data?: any) => {
  if (FEATURES.enableLogging) {
    console.info(`[${new Date().toISOString()}] INFO: ${message}`, data || '');
  }
};

export const logWarning = (message: string, data?: any) => {
  if (FEATURES.enableLogging) {
    console.warn(`[${new Date().toISOString()}] WARNING: ${message}`, data || '');
  }
};

// Export default configuration
export default CONFIG;