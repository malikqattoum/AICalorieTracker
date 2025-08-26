import Constants from 'expo-constants';

// Environment configuration
const ENV = {
  development: {
    apiUrl: 'http://localhost:3002',
    enableLogging: true,
    useMockData: false, // Changed to false for real backend integration
    testApiUrl: 'http://localhost:3003', // Test server for connectivity checks
  },
  staging: {
    apiUrl: 'https://staging-api.aicalorietracker.com',
    testApiUrl: 'https://staging-api.aicalorietracker.com',
    enableLogging: true,
    useMockData: false,
  },
  production: {
    apiUrl: 'https://api.aicalorietracker.com',
    testApiUrl: 'https://api.aicalorietracker.com',
    enableLogging: false,
    useMockData: false,
  },
};

// Get current environment
const getEnvironment = () => {
  if (__DEV__) return 'development';
  
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;
  if (releaseChannel === 'staging') return 'staging';
  
  return 'production';
};

const currentEnv = getEnvironment();

// API configuration
export const API_URL = Constants.expoConfig?.extra?.apiUrl || ENV[currentEnv].apiUrl;
export const TEST_API_URL = Constants.expoConfig?.extra?.testApiUrl || ENV[currentEnv].testApiUrl;
export const ENABLE_LOGGING = Constants.expoConfig?.extra?.enableLogging ?? ENV[currentEnv].enableLogging;
export const USE_MOCK_DATA = Constants.expoConfig?.extra?.useMockData ?? ENV[currentEnv].useMockData;
export const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn || '';

// App configuration
export const APP_CONFIG = {
  appName: Constants.expoConfig?.extra?.appName || 'AI Calorie Tracker',
  version: Constants.expoConfig?.extra?.version || '1.0.0',
  supportEmail: Constants.expoConfig?.extra?.supportEmail || 'support@aicalorietracker.com',
  environment: Constants.expoConfig?.extra?.environment || currentEnv,
};

// Feature flags
export const FEATURES = {
  multiFood: true,
  nutritionCoach: true,
  mealPlanning: true,
  recipeImport: true,
  referralProgram: true,
  offlineSupport: true,
  pushNotifications: true,
};

// Network configuration
export const NETWORK_CONFIG = {
  timeout: 15000, // 15 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  cacheExpiration: 5 * 60 * 1000, // 5 minutes
};

// Default user settings
export const DEFAULT_SETTINGS = {
  notifications: {
    mealReminders: true,
    weeklyReports: true,
    tips: true,
    pushEnabled: true,
  },
  privacy: {
    shareAnalytics: true,
    storeImages: false,
    allowCrashReporting: true,
  },
  goals: {
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 200,
    fatGoal: 65,
    fiberGoal: 25,
    sugarGoal: 50,
    sodiumGoal: 2300,
  },
  units: {
    weight: 'kg', // kg or lbs
    height: 'cm', // cm or ft
    temperature: 'celsius', // celsius or fahrenheit
  },
  theme: {
    mode: 'system', // light, dark, system
    primaryColor: '#4F46E5',
  },
};

// Nutrition goals presets
export const NUTRITION_PRESETS = {
  weightLoss: {
    name: 'Weight Loss',
    description: 'Moderate calorie deficit for healthy weight loss',
    calorieGoal: 1800,
    proteinGoal: 150,
    carbsGoal: 150,
    fatGoal: 60,
    fiberGoal: 28,
    sugarGoal: 45,
    sodiumGoal: 2000,
  },
  maintenance: {
    name: 'Maintenance',
    description: 'Maintain current weight with balanced nutrition',
    calorieGoal: 2200,
    proteinGoal: 150,
    carbsGoal: 220,
    fatGoal: 70,
    fiberGoal: 25,
    sugarGoal: 50,
    sodiumGoal: 2300,
  },
  muscleGain: {
    name: 'Muscle Gain',
    description: 'Calorie surplus with high protein for muscle building',
    calorieGoal: 2500,
    proteinGoal: 180,
    carbsGoal: 280,
    fatGoal: 80,
    fiberGoal: 30,
    sugarGoal: 55,
    sodiumGoal: 2500,
  },
  highProtein: {
    name: 'High Protein',
    description: 'Protein-focused diet for active individuals',
    calorieGoal: 2100,
    proteinGoal: 180,
    carbsGoal: 180,
    fatGoal: 65,
    fiberGoal: 25,
    sugarGoal: 45,
    sodiumGoal: 2200,
  },
};

// Meal type configurations
export const MEAL_TYPES = {
  breakfast: {
    name: 'Breakfast',
    icon: '🌅',
    defaultTime: '08:00',
    caloriePercentage: 0.25,
  },
  lunch: {
    name: 'Lunch',
    icon: '☀️',
    defaultTime: '13:00',
    caloriePercentage: 0.30,
  },
  dinner: {
    name: 'Dinner',
    icon: '🌙',
    defaultTime: '19:00',
    caloriePercentage: 0.35,
  },
  snack: {
    name: 'Snack',
    icon: '🍎',
    defaultTime: '16:00',
    caloriePercentage: 0.10,
  },
};

// Cache keys for offline storage
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  USER_SETTINGS: 'user_settings',
  MEALS: 'meals',
  MEAL_PLANS: 'meal_plans',
  NUTRITION_HISTORY: 'nutrition_history',
  RECIPES: 'recipes',
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  ONBOARDING_COMPLETE: 'onboarding_complete',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  UNAUTHORIZED: 'Session expired. Please log in again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  CAMERA_PERMISSION: 'Camera permission is required to take photos of your meals.',
  PHOTO_PERMISSION: 'Photo library permission is required to select meal images.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  MEAL_SAVED: 'Meal saved successfully!',
  MEAL_UPDATED: 'Meal updated successfully!',
  MEAL_DELETED: 'Meal deleted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  RECIPE_IMPORTED: 'Recipe imported successfully!',
  MEAL_PLAN_GENERATED: 'Meal plan generated successfully!',
};

// Validation rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_AGE: 13,
  MAX_AGE: 120,
  MIN_WEIGHT: 30, // kg
  MAX_WEIGHT: 300, // kg
  MIN_HEIGHT: 100, // cm
  MAX_HEIGHT: 250, // cm
};

// Logging utility
export const log = (...args: any[]) => {
  if (ENABLE_LOGGING) {
    console.log(`[${new Date().toISOString()}]`, ...args);
  }
};

export const logError = (...args: any[]) => {
  if (ENABLE_LOGGING) {
    console.error(`[${new Date().toISOString()}] ERROR:`, ...args);
  }
};