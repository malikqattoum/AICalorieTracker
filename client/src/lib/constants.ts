// Frontend configuration constants
export const APP_CONFIG = {
  // Nutrition Goals Defaults
  DEFAULT_NUTRITION_GOALS: {
    dailyCalories: 2000,
    dailyProtein: 150,
    dailyCarbs: 200,
    dailyFat: 65,
    weeklyWorkouts: 3,
    waterIntake: 2000,
    weight: 70,
    bodyFatPercentage: 20,
  },

  // Nutrition Goals Validation Ranges
  NUTRITION_RANGES: {
    dailyCalories: { min: 1000, max: 5000 },
    dailyProtein: { min: 30, max: 300 },
    dailyCarbs: { min: 50, max: 500 },
    dailyFat: { min: 20, max: 200 },
    weeklyWorkouts: { min: 0, max: 14 },
    waterIntake: { min: 500, max: 5000, step: 100 },
    weight: { min: 30, max: 200, step: 0.1 },
    bodyFatPercentage: { min: 5, max: 60, step: 0.1 },
  },

  // Progress Color Thresholds
  PROGRESS_COLORS: {
    low: { threshold: 25, color: "bg-blue-500" },
    medium: { threshold: 50, color: "bg-emerald-500" },
    high: { threshold: 75, color: "bg-yellow-500" },
    veryHigh: { threshold: 90, color: "bg-orange-500" },
    complete: { threshold: 100, color: "bg-red-500" },
  },

  // Camera/Upload Configuration
  UPLOAD_CONFIG: {
    supportedFormats: ['image/jpeg', 'image/png'],
    supportedFormatsDisplay: 'JPG, PNG',
    minHeight: 300,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },

  // UI Configuration
  UI_CONFIG: {
    cardBorderRadius: 'rounded-xl',
    primaryColor: 'primary-500',
    loadingAnimation: 'animate-pulse',
  },

  // API Configuration
  API_CONFIG: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },
} as const;

// Type definitions for better TypeScript support
export type NutritionGoals = typeof APP_CONFIG.DEFAULT_NUTRITION_GOALS;
export type NutritionRanges = typeof APP_CONFIG.NUTRITION_RANGES;
export type ProgressColors = typeof APP_CONFIG.PROGRESS_COLORS;