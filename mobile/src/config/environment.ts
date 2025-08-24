import { z } from 'zod';

// Environment variable validation schema for mobile app
const envSchema = z.object({
  // App Configuration
  APP_NAME: z.string().default('AICalorieTracker'),
  APP_VERSION: z.string().default('1.0.0'),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // API Configuration
  API_BASE_URL: z.string().url(),
  API_TIMEOUT: z.coerce.number().default(30000), // 30 seconds
  API_RETRIES: z.coerce.number().default(3),
  API_RETRY_DELAY: z.coerce.number().default(1000), // 1 second
  
  // Authentication Configuration
  AUTH_TOKEN_KEY: z.string().default('auth_token'),
  REFRESH_TOKEN_KEY: z.string().default('refresh_token'),
  AUTH_TOKEN_EXPIRY: z.coerce.number().default(3600), // 1 hour
  REFRESH_TOKEN_EXPIRY: z.coerce.number().default(2592000), // 30 days
  
  // Secure Storage Configuration
  SECURE_STORAGE_ENABLED: z.string().default('true'),
  SECURE_STORAGE_ENCRYPTION: z.string().default('true'),
  SECURE_STORAGE_KEYCHAIN: z.string().default('true'),
  SECURE_STORAGE_BIOMETRICS: z.string().default('false'),
  
  // Push Notifications Configuration
  PUSH_NOTIFICATIONS_ENABLED: z.string().default('true'),
  PUSH_NOTIFICATIONS_BADGE: z.string().default('true'),
  PUSH_NOTIFICATIONS_SOUND: z.string().default('true'),
  PUSH_NOTIFICATIONS_ALERT: z.string().default('true'),
  PUSH_NOTIFICATIONS_BACKGROUND: z.string().default('true'),
  PUSH_NOTIFICATIONS_FOREGROUND: z.string().default('true'),
  
  // Wearable Device Configuration
  WEARABLE_DEVICES_ENABLED: z.string().default('true'),
  WEARABLE_AUTO_SYNC: z.string().default('true'),
  WEARABLE_SYNC_INTERVAL: z.coerce.number().default(300), // 5 minutes
  WEARABLE_BACKGROUND_SYNC: z.string().default('true'),
  WEARABLE_BLUETOOTH_ENABLED: z.string().default('true'),
  WEARABLE_WIFI_ENABLED: z.string().default('true'),
  
  // Healthcare Provider Configuration
  HEALTHCARE_PROVIDERS_ENABLED: z.string().default('true'),
  HEALTHCARE_AUTO_SYNC: z.string().default('true'),
  HEALTHCARE_SYNC_INTERVAL: z.coerce.number().default(3600), // 1 hour
  HEALTHCARE_DATA_RETENTION: z.coerce.number().default(365), // days
  HEALTHCARE_PRIVACY_ENABLED: z.string().default('true'),
  HEALTHCARE_DATA_SHARING: z.string().default('false'),
  
  // AI Service Configuration
  AI_SERVICE_ENABLED: z.string().default('true'),
  AI_SERVICE_PROVIDER: z.enum(['openai', 'anthropic', 'google']).default('openai'),
  AI_SERVICE_MODEL: z.string().default('gpt-4'),
  AI_SERVICE_MAX_TOKENS: z.coerce.number().default(1000),
  AI_SERVICE_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  AI_SERVICE_TOP_P: z.coerce.number().min(0).max(1).default(0.9),
  AI_SERVICE_FREQUENCY_PENALTY: z.coerce.number().min(-2).max(2).default(0),
  AI_SERVICE_PRESENCE_PENALTY: z.coerce.number().min(-2).max(2).default(0),
  
  // Image Processing Configuration
  IMAGE_PROCESSING_ENABLED: z.string().default('true'),
  IMAGE_COMPRESSION_ENABLED: z.string().default('true'),
  IMAGE_COMPRESSION_QUALITY: z.coerce.number().min(1).max(100).default(85),
  IMAGE_MAX_WIDTH: z.coerce.number().default(1920),
  IMAGE_MAX_HEIGHT: z.coerce.number().default(1080),
  IMAGE_MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  IMAGE_FORMATS: z.string().default('image/jpeg,image/png,image/gif,image/webp'),
  
  // Camera Configuration
  CAMERA_ENABLED: z.string().default('true'),
  CAMERA_SAVE_TO_GALLERY: z.string().default('true'),
  CAMERA_IMAGE_QUALITY: z.coerce.number().min(1).max(100).default(85),
  CAMERA_IMAGE_FORMAT: z.enum(['jpeg', 'png']).default('jpeg'),
  CAMERA_ENABLE_FLASH: z.string().default('true'),
  CAMERA_ENABLE_FOCUS: z.string().default('true'),
  CAMERA_ENABLE_ZOOM: z.string().default('true'),
  CAMERA_ENABLE_TORCH: z.string().default('true'),
  
  // File Upload Configuration
  FILE_UPLOAD_ENABLED: z.string().default('true'),
  FILE_UPLOAD_MAX_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  FILE_UPLOAD_MAX_FILES: z.coerce.number().default(5),
  FILE_UPLOAD_TYPES: z.string().default('image/jpeg,image/png,image/gif,image/webp'),
  FILE_UPLOAD_COMPRESSION: z.string().default('true'),
  FILE_UPLOAD_PROGRESS: z.string().default('true'),
  
  // Cache Configuration
  CACHE_ENABLED: z.string().default('true'),
  CACHE_SIZE: z.coerce.number().default(50 * 1024 * 1024), // 50MB
  CACHE_TTL: z.coerce.number().default(3600), // 1 hour
  CACHE_DISK_SIZE: z.coerce.number().default(100 * 1024 * 1024), // 100MB
  CACHE_DISK_TTL: z.coerce.number().default(86400), // 24 hours
  CACHE_MEMORY_SIZE: z.coerce.number().default(20 * 1024 * 1024), // 20MB
  CACHE_MEMORY_TTL: z.coerce.number().default(1800), // 30 minutes
  
  // Analytics Configuration
  ANALYTICS_ENABLED: z.string().default('true'),
  ANALYTICS_PROVIDER: z.enum(['firebase', 'mixpanel', 'amplitude', 'segment']).default('firebase'),
  ANALYTICS_DEBUG: z.string().default('false'),
  ANALYTICS_AUTO_TRACK: z.string().default('true'),
  ANALYTICS_SESSION_TIMEOUT: z.coerce.number().default(1800000), // 30 minutes
  ANALYTICS_FLUSH_INTERVAL: z.coerce.number().default(15000), // 15 seconds
  ANALYTICS_MAX_BATCH_SIZE: z.coerce.number().default(100),
  
  // Crash Reporting Configuration
  CRASH_REPORTING_ENABLED: z.string().default('true'),
  CRASH_REPORTING_PROVIDER: z.enum(['sentry', 'bugsnag', 'fabric']).default('sentry'),
  CRASH_REPORTING_DEBUG: z.string().default('false'),
  CRASH_REPORTING_AUTO_SEND: z.string().default('true'),
  CRASH_REPORTING_SEND_NETWORK: z.string().default('true'),
  CRASH_REPORTING_MAX_STACK_TRACE_LINES: z.coerce.number().default(50),
  
  // Performance Monitoring Configuration
  PERFORMANCE_MONITORING_ENABLED: z.string().default('true'),
  PERFORMANCE_MONITORING_PROVIDER: z.enum(['newrelic', 'datadog', 'appdynamics']).default('newrelic'),
  PERFORMANCE_MONITORING_DEBUG: z.string().default('false'),
  PERFORMANCE_MONITORING_SAMPLING_RATE: z.coerce.number().min(0).max(1).default(0.1),
  PERFORMANCE_MONITORING_MAX_TRACE_DURATION: z.coerce.number().default(30000), // 30 seconds
  PERFORMANCE_MONITORING_MAX_SPAN_DURATION: z.coerce.number().default(5000), // 5 seconds
  
  // Logging Configuration
  LOGGING_ENABLED: z.string().default('true'),
  LOGGING_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOGGING_FILE_ENABLED: z.string().default('true'),
  LOGGING_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  LOGGING_FILE_COUNT: z.coerce.number().default(5),
  LOGGING_CONSOLE_ENABLED: z.string().default('true'),
  LOGGING_REMOTE_ENABLED: z.string().default('false'),
  LOGGING_REMOTE_URL: z.string().url().optional(),
  
  // Network Configuration
  NETWORK_ENABLED: z.string().default('true'),
  NETWORK_WIFI_ONLY: z.string().default('false'),
  NETWORK_OFFLINE_ENABLED: z.string().default('true'),
  NETWORK_RETRY_ENABLED: z.string().default('true'),
  NETWORK_RETRY_COUNT: z.coerce.number().default(3),
  NETWORK_RETRY_DELAY: z.coerce.number().default(1000), // 1 second
  NETWORK_TIMEOUT: z.coerce.number().default(30000), // 30 seconds
  NETWORK_CACHE_ENABLED: z.string().default('true'),
  NETWORK_CACHE_TTL: z.coerce.number().default(3600), // 1 hour
  
  // Security Configuration
  SECURITY_ENABLED: z.string().default('true'),
  SECURITY_PIN_ENABLED: z.string().default('false'),
  SECURITY_BIOMETRICS_ENABLED: z.string().default('false'),
  SECURITY_FACE_ID_ENABLED: z.string().default('false'),
  SECURITY_TOUCH_ID_ENABLED: z.string().default('false'),
  SECURITY_PATTERN_ENABLED: z.string().default('false'),
  SECURITY_PASSWORD_ENABLED: z.string().default('false'),
  SECURITY_AUTO_LOCK: z.string().default('true'),
  SECURITY_AUTO_LOCK_TIMEOUT: z.coerce.number().default(300), // 5 minutes
  SECURITY_DATA_ENCRYPTION: z.string().default('true'),
  SECURITY_SECURE_STORAGE: z.string().default('true'),
  SECURITY_SECURE_KEYCHAIN: z.string().default('true'),
  SECURITY_SECURE_BIOMETRICS: z.string().default('false'),
  
  // Localization Configuration
  LOCALIZATION_ENABLED: z.string().default('true'),
  LOCALIZATION_DEFAULT_LANGUAGE: z.string().default('en'),
  LOCALIZATION_SUPPORTED_LANGUAGES: z.string().default('en,es,fr,de,ja,ko,zh'),
  LOCALIZATION_DEFAULT_COUNTRY: z.string().default('US'),
  LOCALIZATION_DEFAULT_CURRENCY: z.string().default('USD'),
  LOCALIZATION_DATE_FORMAT: z.string().default('MM/DD/YYYY'),
  LOCALIZATION_TIME_FORMAT: z.string().default('h:mm A'),
  LOCALIZATION_NUMBER_FORMAT: z.string().default('en-US'),
  LOCALIZATION_CURRENCY_FORMAT: z.string().default('en-US'),
  
  // Theme Configuration
  THEME_ENABLED: z.string().default('true'),
  THEME_DEFAULT: z.enum(['light', 'dark', 'system']).default('system'),
  THEME_CUSTOM_COLORS: z.string().default('false'),
  THEME_PRIMARY_COLOR: z.string().default('#007AFF'),
  THEME_SECONDARY_COLOR: z.string().default('#5AC8FA'),
  THEME_BACKGROUND_COLOR: z.string().default('#FFFFFF'),
  THEME_TEXT_COLOR: z.string().default('#000000'),
  THEME_ACCENT_COLOR: z.string().default('#FF3B30'),
  
  // Navigation Configuration
  NAVIGATION_ENABLED: z.string().default('true'),
  NAVIGATION_TAB_BAR_ENABLED: z.string().default('true'),
  NAVIGATION_DRAWER_ENABLED: z.string().default('true'),
  NAVIGATION_BOTTOM_TAB_ENABLED: z.string().default('true'),
  NAVIGATION_HEADER_ENABLED: z.string().default('true'),
  NAVIGATION_GESTURES_ENABLED: z.string().default('true'),
  NAVIGATION_ANIMATIONS_ENABLED: z.string().default('true'),
  NAVIGATION_TRANSITIONS_ENABLED: z.string().default('true'),
  
  // Animation Configuration
  ANIMATION_ENABLED: z.string().default('true'),
  ANIMATION_DURATION: z.coerce.number().default(300),
  ANIMATION_EASING: z.string().default('ease-in-out'),
  ANIMATION_SPRING_ENABLED: z.string().default('true'),
  ANIMATION_SPRING_DAMPING: z.coerce.number().default(0.8),
  ANIMATION_SPRING_STIFFNESS: z.coerce.number().default(200),
  ANIMATION_INTERPOLATION_ENABLED: z.string().default('true'),
  
  // Gesture Configuration
  GESTURE_ENABLED: z.string().default('true'),
  GESTURE_SWIPE_ENABLED: z.string().default('true'),
  GESTURE_PINCH_ENABLED: z.string().default('true'),
  GESTURE_ROTATE_ENABLED: z.string().default('true'),
  GESTURE_TAP_ENABLED: z.string().default('true'),
  GESTURE_LONG_PRESS_ENABLED: z.string().default('true'),
  GESTURE_DOUBLE_TAP_ENABLED: z.string().default('true'),
  GESTURE_PAN_ENABLED: z.string().default('true'),
  
  // Accessibility Configuration
  ACCESSIBILITY_ENABLED: z.string().default('true'),
  ACCESSIBILITY_SCREEN_READER_ENABLED: z.string().default('true'),
  ACCESSIBILITY_VOICE_OVER_ENABLED: z.string().default('true'),
  ACCESSIBILITY_SPEAK_SCREEN_ENABLED: z.string().default('true'),
  ACCESSIBILITY_SPEAK_SELECTION_ENABLED: z.string().default('true'),
  ACCESSIBILITY_SWITCH_CONTROL_ENABLED: z.string().default('true'),
  ACCESSIBILITY_ASSISTIVE_TOUCH_ENABLED: z.string().default('true'),
  ACCESSIBILITY_DYNAMIC_TYPE_ENABLED: z.string().default('true'),
  ACCESSIBILITY_DYNAMIC_TYPE_SCALE: z.coerce.number().min(0.5).max(3).default(1),
  
  // Font Configuration
  FONT_ENABLED: z.string().default('true'),
  FONT_SYSTEM_ENABLED: z.string().default('true'),
  FONT_CUSTOM_ENABLED: z.string().default('false'),
  FONT_DEFAULT_SIZE: z.coerce.number().default(16),
  FONT_MIN_SIZE: z.coerce.number().default(12),
  FONT_MAX_SIZE: z.coerce.number().default(24),
  FONT_LINE_HEIGHT: z.coerce.number().default(1.5),
  FONT_LETTER_SPACING: z.coerce.number().default(0),
  FONT_PARAGRAPH_SPACING: z.coerce.number().default(8),
  
  // Color Configuration
  COLOR_ENABLED: z.string().default('true'),
  COLOR_PRIMARY: z.string().default('#007AFF'),
  COLOR_SECONDARY: z.string().default('#5AC8FA'),
  COLOR_SUCCESS: z.string().default('#34C759'),
  COLOR_WARNING: z.string().default('#FF9500'),
  COLOR_ERROR: z.string().default('#FF3B30'),
  COLOR_INFO: z.string().default('#5AC8FA'),
  COLOR_BACKGROUND: z.string().default('#FFFFFF'),
  COLOR_SURFACE: z.string().default('#F2F2F7'),
  COLOR_TEXT_PRIMARY: z.string().default('#000000'),
  COLOR_TEXT_SECONDARY: z.string().default('#8E8E93'),
  COLOR_TEXT_DISABLED: z.string().default('#C7C7CC'),
  COLOR_DIVIDER: z.string().default('#C6C6C8'),
  COLOR_BORDER: z.string().default('#C6C6C8'),
  COLOR_SHADOW: z.string().default('#000000'),
  
  // Spacing Configuration
  SPACING_ENABLED: z.string().default('true'),
  SPACING_BASE: z.coerce.number().default(8),
  SPACING_UNIT: z.coerce.number().default(4),
  SPACING_SCALE: z.coerce.number().default(1),
  SPACING_COMPACT: z.coerce.number().default(0.5),
  SPACING_NORMAL: z.coerce.number().default(1),
  SPACING_COMFORTABLE: z.coerce.number().default(1.5),
  SPACING_SPACIOUS: z.coerce.number().default(2),
  
  // Border Configuration
  BORDER_ENABLED: z.string().default('true'),
  BORDER_WIDTH: z.coerce.number().default(1),
  BORDER_RADIUS: z.coerce.number().default(8),
  BORDER_COLOR: z.string().default('#C6C6C8'),
  BORDER_STYLE: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  
  // Shadow Configuration
  SHADOW_ENABLED: z.string().default('true'),
  SHADOW_COLOR: z.string().default('#000000'),
  SHADOW_OPACITY: z.coerce.number().min(0).max(1).default(0.1),
  SHADOW_RADIUS: z.coerce.number().default(4),
  SHADOW_OFFSET: z.coerce.number().default(2),
  SHADOW_SPREAD: z.coerce.number().default(0),
  
  // Icon Configuration
  ICON_ENABLED: z.string().default('true'),
  ICON_SIZE: z.coerce.number().default(24),
  ICON_COLOR: z.string().default('#007AFF'),
  ICON_PACK: z.enum(['material', 'ios', 'fontawesome', 'custom']).default('material'),
  ICON_LIBRARY: z.string().default('react-native-vector-icons'),
  
  // Image Configuration
  IMAGE_ENABLED: z.string().default('true'),
  IMAGE_CACHE_ENABLED: z.string().default('true'),
  IMAGE_CACHE_SIZE: z.coerce.number().default(50 * 1024 * 1024), // 50MB
  IMAGE_CACHE_TTL: z.coerce.number().default(86400), // 24 hours
  IMAGE_RESIZE_ENABLED: z.string().default('true'),
  IMAGE_RESIZE_WIDTH: z.coerce.number().default(400),
  IMAGE_RESIZE_HEIGHT: z.coerce.number().default(400),
  IMAGE_FORMAT: z.enum(['auto', 'jpeg', 'png', 'webp']).default('auto'),
  IMAGE_QUALITY: z.coerce.number().min(1).max(100).default(85),
  
  // Video Configuration
  VIDEO_ENABLED: z.string().default('true'),
  VIDEO_CACHE_ENABLED: z.string().default('true'),
  VIDEO_CACHE_SIZE: z.coerce.number().default(100 * 1024 * 1024), // 100MB
  VIDEO_CACHE_TTL: z.coerce.number().default(86400), // 24 hours
  VIDEO_RESIZE_ENABLED: z.string().default('true'),
  VIDEO_RESIZE_WIDTH: z.coerce.number().default(400),
  VIDEO_RESIZE_HEIGHT: z.coerce.number().default(300),
  VIDEO_FORMAT: z.enum(['auto', 'mp4', 'mov', 'avi']).default('auto'),
  VIDEO_QUALITY: z.enum(['low', 'medium', 'high']).default('medium'),
  
  // Audio Configuration
  AUDIO_ENABLED: z.string().default('true'),
  AUDIO_CACHE_ENABLED: z.string().default('true'),
  AUDIO_CACHE_SIZE: z.coerce.number().default(50 * 1024 * 1024), // 50MB
  AUDIO_CACHE_TTL: z.coerce.number().default(86400), // 24 hours
  AUDIO_RESIZE_ENABLED: z.string().default('true'),
  AUDIO_RESIZE_BITRATE: z.coerce.number().default(128), // kbps
  AUDIO_FORMAT: z.enum(['auto', 'mp3', 'wav', 'aac']).default('auto'),
  AUDIO_QUALITY: z.enum(['low', 'medium', 'high']).default('medium'),
  
  // Document Configuration
  DOCUMENT_ENABLED: z.string().default('true'),
  DOCUMENT_CACHE_ENABLED: z.string().default('true'),
  DOCUMENT_CACHE_SIZE: z.coerce.number().default(100 * 1024 * 1024), // 100MB
  DOCUMENT_CACHE_TTL: z.coerce.number().default(86400), // 24 hours
  DOCUMENT_FORMAT: z.enum(['auto', 'pdf', 'doc', 'docx', 'txt']).default('auto'),
  DOCUMENT_MAX_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Export environment configuration
export default env;

// Export environment-specific configurations
export const isDevelopment = env.APP_ENV === 'development';
export const isStaging = env.APP_ENV === 'staging';
export const isProduction = env.APP_ENV === 'production';

// Export app configuration
export const appConfig = {
  name: env.APP_NAME,
  version: env.APP_VERSION,
  env: env.APP_ENV,
};

// Export API configuration
export const apiConfig = {
  baseUrl: env.API_BASE_URL,
  timeout: env.API_TIMEOUT,
  retries: env.API_RETRIES,
  retryDelay: env.API_RETRY_DELAY,
};

// Export authentication configuration
export const authConfig = {
  tokenKey: env.AUTH_TOKEN_KEY,
  refreshTokenKey: env.REFRESH_TOKEN_KEY,
  tokenExpiry: env.AUTH_TOKEN_EXPIRY,
  refreshTokenExpiry: env.REFRESH_TOKEN_EXPIRY,
};

// Export secure storage configuration
export const secureStorageConfig = {
  enabled: env.SECURE_STORAGE_ENABLED === 'true',
  encryption: env.SECURE_STORAGE_ENCRYPTION === 'true',
  keychain: env.SECURE_STORAGE_KEYCHAIN === 'true',
  biometrics: env.SECURE_STORAGE_BIOMETRICS === 'true',
};

// Export push notifications configuration
export const pushNotificationConfig = {
  enabled: env.PUSH_NOTIFICATIONS_ENABLED === 'true',
  badge: env.PUSH_NOTIFICATIONS_BADGE === 'true',
  sound: env.PUSH_NOTIFICATIONS_SOUND === 'true',
  alert: env.PUSH_NOTIFICATIONS_ALERT === 'true',
  background: env.PUSH_NOTIFICATIONS_BACKGROUND === 'true',
  foreground: env.PUSH_NOTIFICATIONS_FOREGROUND === 'true',
};

// Export wearable device configuration
export const wearableConfig = {
  enabled: env.WEARABLE_DEVICES_ENABLED === 'true',
  autoSync: env.WEARABLE_AUTO_SYNC === 'true',
  syncInterval: env.WEARABLE_SYNC_INTERVAL,
  backgroundSync: env.WEARABLE_BACKGROUND_SYNC === 'true',
  bluetoothEnabled: env.WEARABLE_BLUETOOTH_ENABLED === 'true',
  wifiEnabled: env.WEARABLE_WIFI_ENABLED === 'true',
};

// Export healthcare provider configuration
export const healthcareConfig = {
  enabled: env.HEALTHCARE_PROVIDERS_ENABLED === 'true',
  autoSync: env.HEALTHCARE_AUTO_SYNC === 'true',
  syncInterval: env.HEALTHCARE_SYNC_INTERVAL,
  dataRetention: env.HEALTHCARE_DATA_RETENTION,
  privacyEnabled: env.HEALTHCARE_PRIVACY_ENABLED === 'true',
  dataSharing: env.HEALTHCARE_DATA_SHARING === 'true',
};

// Export AI service configuration
export const aiServiceConfig = {
  enabled: env.AI_SERVICE_ENABLED === 'true',
  provider: env.AI_SERVICE_PROVIDER,
  model: env.AI_SERVICE_MODEL,
  maxTokens: env.AI_SERVICE_MAX_TOKENS,
  temperature: env.AI_SERVICE_TEMPERATURE,
  topP: env.AI_SERVICE_TOP_P,
  frequencyPenalty: env.AI_SERVICE_FREQUENCY_PENALTY,
  presencePenalty: env.AI_SERVICE_PRESENCE_PENALTY,
};

// Export image processing configuration
export const imageProcessingConfig = {
  enabled: env.IMAGE_PROCESSING_ENABLED === 'true',
  compressionEnabled: env.IMAGE_COMPRESSION_ENABLED === 'true',
  compressionQuality: env.IMAGE_COMPRESSION_QUALITY,
  maxWidth: env.IMAGE_MAX_WIDTH,
  maxHeight: env.IMAGE_MAX_HEIGHT,
  maxFileSize: env.IMAGE_MAX_FILE_SIZE,
  formats: env.IMAGE_FORMATS.split(','),
};

// Export camera configuration
export const cameraConfig = {
  enabled: env.CAMERA_ENABLED === 'true',
  saveToGallery: env.CAMERA_SAVE_TO_GALLERY === 'true',
  imageQuality: env.CAMERA_IMAGE_QUALITY,
  imageFormat: env.CAMERA_IMAGE_FORMAT,
  enableFlash: env.CAMERA_ENABLE_FLASH === 'true',
  enableFocus: env.CAMERA_ENABLE_FOCUS === 'true',
  enableZoom: env.CAMERA_ENABLE_ZOOM === 'true',
  enableTorch: env.CAMERA_ENABLE_TORCH === 'true',
};

// Export file upload configuration
export const fileUploadConfig = {
  enabled: env.FILE_UPLOAD_ENABLED === 'true',
  maxSize: env.FILE_UPLOAD_MAX_SIZE,
  maxFiles: env.FILE_UPLOAD_MAX_FILES,
  types: env.FILE_UPLOAD_TYPES.split(','),
  compression: env.FILE_UPLOAD_COMPRESSION === 'true',
  progress: env.FILE_UPLOAD_PROGRESS === 'true',
};

// Export cache configuration
export const cacheConfig = {
  enabled: env.CACHE_ENABLED === 'true',
  size: env.CACHE_SIZE,
  ttl: env.CACHE_TTL,
  diskSize: env.CACHE_DISK_SIZE,
  diskTtl: env.CACHE_DISK_TTL,
  memorySize: env.CACHE_MEMORY_SIZE,
  memoryTtl: env.CACHE_MEMORY_TTL,
};

// Export analytics configuration
export const analyticsConfig = {
  enabled: env.ANALYTICS_ENABLED === 'true',
  provider: env.ANALYTICS_PROVIDER,
  debug: env.ANALYTICS_DEBUG === 'true',
  autoTrack: env.ANALYTICS_AUTO_TRACK === 'true',
  sessionTimeout: env.ANALYTICS_SESSION_TIMEOUT,
  flushInterval: env.ANALYTICS_FLUSH_INTERVAL,
  maxBatchSize: env.ANALYTICS_MAX_BATCH_SIZE,
};

// Export crash reporting configuration
export const crashReportingConfig = {
  enabled: env.CRASH_REPORTING_ENABLED === 'true',
  provider: env.CRASH_REPORTING_PROVIDER,
  debug: env.CRASH_REPORTING_DEBUG === 'true',
  autoSend: env.CRASH_REPORTING_AUTO_SEND === 'true',
  sendNetwork: env.CRASH_REPORTING_SEND_NETWORK === 'true',
  maxStackTraceLines: env.CRASH_REPORTING_MAX_STACK_TRACE_LINES,
};

// Export performance monitoring configuration
export const performanceMonitoringConfig = {
  enabled: env.PERFORMANCE_MONITORING_ENABLED === 'true',
  provider: env.PERFORMANCE_MONITORING_PROVIDER,
  debug: env.PERFORMANCE_MONITORING_DEBUG === 'true',
  samplingRate: env.PERFORMANCE_MONITORING_SAMPLING_RATE,
  maxTraceDuration: env.PERFORMANCE_MONITORING_MAX_TRACE_DURATION,
  maxSpanDuration: env.PERFORMANCE_MONITORING_MAX_SPAN_DURATION,
};

// Export logging configuration
export const loggingConfig = {
  enabled: env.LOGGING_ENABLED === 'true',
  level: env.LOGGING_LEVEL,
  fileEnabled: env.LOGGING_FILE_ENABLED === 'true',
  fileSize: env.LOGGING_FILE_SIZE,
  fileCount: env.LOGGING_FILE_COUNT,
  consoleEnabled: env.LOGGING_CONSOLE_ENABLED === 'true',
  remoteEnabled: env.LOGGING_REMOTE_ENABLED === 'true',
  remoteUrl: env.LOGGING_REMOTE_URL,
};

// Export network configuration
export const networkConfig = {
  enabled: env.NETWORK_ENABLED === 'true',
  wifiOnly: env.NETWORK_WIFI_ONLY === 'true',
  offlineEnabled: env.NETWORK_OFFLINE_ENABLED === 'true',
  retryEnabled: env.NETWORK_RETRY_ENABLED === 'true',
  retryCount: env.NETWORK_RETRY_COUNT,
  retryDelay: env.NETWORK_RETRY_DELAY,
  timeout: env.NETWORK_TIMEOUT,
  cacheEnabled: env.NETWORK_CACHE_ENABLED === 'true',
  cacheTtl: env.NETWORK_CACHE_TTL,
};

// Export security configuration
export const securityConfig = {
  enabled: env.SECURITY_ENABLED === 'true',
  pinEnabled: env.SECURITY_PIN_ENABLED === 'true',
  biometricsEnabled: env.SECURITY_BIOMETRICS_ENABLED === 'true',
  faceIdEnabled: env.SECURITY_FACE_ID_ENABLED === 'true',
  touchIdEnabled: env.SECURITY_TOUCH_ID_ENABLED === 'true',
  patternEnabled: env.SECURITY_PATTERN_ENABLED === 'true',
  passwordEnabled: env.SECURITY_PASSWORD_ENABLED === 'true',
  autoLock: env.SECURITY_AUTO_LOCK === 'true',
  autoLockTimeout: env.SECURITY_AUTO_LOCK_TIMEOUT,
  dataEncryption: env.SECURITY_DATA_ENCRYPTION === 'true',
  secureStorage: env.SECURITY_SECURE_STORAGE === 'true',
  secureKeychain: env.SECURITY_SECURE_KEYCHAIN === 'true',
  secureBiometrics: env.SECURITY_SECURE_BIOMETRICS === 'true',
};

// Export localization configuration
export const localizationConfig = {
  enabled: env.LOCALIZATION_ENABLED === 'true',
  defaultLanguage: env.LOCALIZATION_DEFAULT_LANGUAGE,
  supportedLanguages: env.LOCALIZATION_SUPPORTED_LANGUAGES.split(','),
  defaultCountry: env.LOCALIZATION_DEFAULT_COUNTRY,
  defaultCurrency: env.LOCALIZATION_DEFAULT_CURRENCY,
  dateFormat: env.LOCALIZATION_DATE_FORMAT,
  timeFormat: env.LOCALIZATION_TIME_FORMAT,
  numberFormat: env.LOCALIZATION_NUMBER_FORMAT,
  currencyFormat: env.LOCALIZATION_CURRENCY_FORMAT,
};

// Export theme configuration
export const themeConfig = {
  enabled: env.THEME_ENABLED === 'true',
  default: env.THEME_DEFAULT,
  customColors: env.THEME_CUSTOM_COLORS === 'true',
  primaryColor: env.THEME_PRIMARY_COLOR,
  secondaryColor: env.THEME_SECONDARY_COLOR,
  backgroundColor: env.THEME_BACKGROUND_COLOR,
  textColor: env.THEME_TEXT_COLOR,
  accentColor: env.THEME_ACCENT_COLOR,
};

// Export navigation configuration
export const navigationConfig = {
  enabled: env.NAVIGATION_ENABLED === 'true',
  tabBarEnabled: env.NAVIGATION_TAB_BAR_ENABLED === 'true',
  drawerEnabled: env.NAVIGATION_DRAWER_ENABLED === 'true',
  bottomTabEnabled: env.NAVIGATION_BOTTOM_TAB_ENABLED === 'true',
  headerEnabled: env.NAVIGATION_HEADER_ENABLED === 'true',
  gesturesEnabled: env.NAVIGATION_GESTURES_ENABLED === 'true',
  animationsEnabled: env.NAVIGATION_ANIMATIONS_ENABLED === 'true',
  transitionsEnabled: env.NAVIGATION_TRANSITIONS_ENABLED === 'true',
};

// Export animation configuration
export const animationConfig = {
  enabled: env.ANIMATION_ENABLED === 'true',
  duration: env.ANIMATION_DURATION,
  easing: env.ANIMATION_EASING,
  springEnabled: env.ANIMATION_SPRING_ENABLED === 'true',
  springDamping: env.ANIMATION_SPRING_DAMPING,
  springStiffness: env.ANIMATION_SPRING_STIFFNESS,
  interpolationEnabled: env.ANIMATION_INTERPOLATION_ENABLED === 'true',
};

// Export gesture configuration
export const gestureConfig = {
  enabled: env.GESTURE_ENABLED === 'true',
  swipeEnabled: env.GESTURE_SWIPE_ENABLED === 'true',
  pinchEnabled: env.GESTURE_PINCH_ENABLED === 'true',
  rotateEnabled: env.GESTURE_ROTATE_ENABLED === 'true',
  tapEnabled: env.GESTURE_TAP_ENABLED === 'true',
  longPressEnabled: env.GESTURE_LONG_PRESS_ENABLED === 'true',
  doubleTapEnabled: env.GESTURE_DOUBLE_TAP_ENABLED === 'true',
  panEnabled: env.GESTURE_PAN_ENABLED === 'true',
};

// Export accessibility configuration
export const accessibilityConfig = {
  enabled: env.ACCESSIBILITY_ENABLED === 'true',
  screenReaderEnabled: env.ACCESSIBILITY_SCREEN_READER_ENABLED === 'true',
  voiceOverEnabled: env.ACCESSIBILITY_VOICE_OVER_ENABLED === 'true',
  speakScreenEnabled: env.ACCESSIBILITY_SPEAK_SCREEN_ENABLED === 'true',
  speakSelectionEnabled: env.ACCESSIBILITY_SPEAK_SELECTION_ENABLED === 'true',
  switchControlEnabled: env.ACCESSIBILITY_SWITCH_CONTROL_ENABLED === 'true',
  assistiveTouchEnabled: env.ACCESSIBILITY_ASSISTIVE_TOUCH_ENABLED === 'true',
  dynamicTypeEnabled: env.ACCESSIBILITY_DYNAMIC_TYPE_ENABLED === 'true',
  dynamicTypeScale: env.ACCESSIBILITY_DYNAMIC_TYPE_SCALE,
};

// Export font configuration
export const fontConfig = {
  enabled: env.FONT_ENABLED === 'true',
  systemEnabled: env.FONT_SYSTEM_ENABLED === 'true',
  customEnabled: env.FONT_CUSTOM_ENABLED === 'true',
  defaultSize: env.FONT_DEFAULT_SIZE,
  minSize: env.FONT_MIN_SIZE,
  maxSize: env.FONT_MAX_SIZE,
  lineHeight: env.FONT_LINE_HEIGHT,
  letterSpacing: env.FONT_LETTER_SPACING,
  paragraphSpacing: env.FONT_PARAGRAPH_SPACING,
};

// Export color configuration
export const colorConfig = {
  enabled: env.COLOR_ENABLED === 'true',
  primary: env.COLOR_PRIMARY,
  secondary: env.COLOR_SECONDARY,
  success: env.COLOR_SUCCESS,
  warning: env.COLOR_WARNING,
  error: env.COLOR_ERROR,
  info: env.COLOR_INFO,
  background: env.COLOR_BACKGROUND,
  surface: env.COLOR_SURFACE,
  textPrimary: env.COLOR_TEXT_PRIMARY,
  textSecondary: env.COLOR_TEXT_SECONDARY,
  textDisabled: env.COLOR_TEXT_DISABLED,
  divider: env.COLOR_DIVIDER,
  border: env.COLOR_BORDER,
  shadow: env.COLOR_SHADOW,
};

// Export spacing configuration
export const spacingConfig = {
  enabled: env.SPACING_ENABLED === 'true',
  base: env.SPACING_BASE,
  unit: env.SPACING_UNIT,
  scale: env.SPACING_SCALE,
  compact: env.SPACING_COMPACT,
  normal: env.SPACING_NORMAL,
  comfortable: env.SPACING_COMFORTABLE,
  spacious: env.SPACING_SPACIOUS,
};

// Export border configuration
export const borderConfig = {
  enabled: env.BORDER_ENABLED === 'true',
  width: env.BORDER_WIDTH,
  radius: env.BORDER_RADIUS,
  color: env.BORDER_COLOR,
  style: env.BORDER_STYLE,
};

// Export shadow configuration
export const shadowConfig = {
  enabled: env.SHADOW_ENABLED === 'true',
  color: env.SHADOW_COLOR,
  opacity: env.SHADOW_OPACITY,
  radius: env.SHADOW_RADIUS,
  offset: env.SHADOW_OFFSET,
  spread: env.SHADOW_SPREAD,
};

// Export icon configuration
export const iconConfig = {
  enabled: env.ICON_ENABLED === 'true',
  size: env.ICON_SIZE,
  color: env.ICON_COLOR,
  pack: env.ICON_PACK,
  library: env.ICON_LIBRARY,
};

// Export image configuration
export const imageConfig = {
  enabled: env.IMAGE_ENABLED === 'true',
  cacheEnabled: env.IMAGE_CACHE_ENABLED === 'true',
  cacheSize: env.IMAGE_CACHE_SIZE,
  cacheTtl: env.IMAGE_CACHE_TTL,
  resizeEnabled: env.IMAGE_RESIZE_ENABLED === 'true',
  resizeWidth: env.IMAGE_RESIZE_WIDTH,
  resizeHeight: env.IMAGE_RESIZE_HEIGHT,
  format: env.IMAGE_FORMAT,
  quality: env.IMAGE_QUALITY,
};

// Export video configuration
export const videoConfig = {
  enabled: env.VIDEO_ENABLED === 'true',
  cacheEnabled: env.VIDEO_CACHE_ENABLED === 'true',
  cacheSize: env.VIDEO_CACHE_SIZE,
  cacheTtl: env.VIDEO_CACHE_TTL,
  resizeEnabled: env.VIDEO_RESIZE_ENABLED === 'true',
  resizeWidth: env.VIDEO_RESIZE_WIDTH,
  resizeHeight: env.VIDEO_RESIZE_HEIGHT,
  format: env.VIDEO_FORMAT,
  quality: env.VIDEO_QUALITY,
};

// Export audio configuration
export const audioConfig = {
  enabled: env.AUDIO_ENABLED === 'true',
  cacheEnabled: env.AUDIO_CACHE_ENABLED === 'true',
  cacheSize: env.AUDIO_CACHE_SIZE,
  cacheTtl: env.AUDIO_CACHE_TTL,
  resizeEnabled: env.AUDIO_RESIZE_ENABLED === 'true',
  resizeBitrate: env.AUDIO_RESIZE_BITRATE,
  format: env.AUDIO_FORMAT,
  quality: env.AUDIO_QUALITY,
};

// Export document configuration
export const documentConfig = {
  enabled: env.DOCUMENT_ENABLED === 'true',
  cacheEnabled: env.DOCUMENT_CACHE_ENABLED === 'true',
  cacheSize: env.DOCUMENT_CACHE_SIZE,
  cacheTtl: env.DOCUMENT_CACHE_TTL,
  format: env.DOCUMENT_FORMAT,
  maxSize: env.DOCUMENT_MAX_SIZE,
};

// Export all configurations in a single object
export const allConfigs = {
  environment: env,
  isDevelopment,
  isStaging,
  isProduction,
  app: appConfig,
  api: apiConfig,
  auth: authConfig,
  secureStorage: secureStorageConfig,
  pushNotification: pushNotificationConfig,
  wearable: wearableConfig,
  healthcare: healthcareConfig,
  aiService: aiServiceConfig,
  imageProcessing: imageProcessingConfig,
  camera: cameraConfig,
  fileUpload: fileUploadConfig,
  cache: cacheConfig,
  analytics: analyticsConfig,
  crashReporting: crashReportingConfig,
  performanceMonitoring: performanceMonitoringConfig,
  logging: loggingConfig,
  network: networkConfig,
  security: securityConfig,
  localization: localizationConfig,
  theme: themeConfig,
  navigation: navigationConfig,
  animation: animationConfig,
  gesture: gestureConfig,
  accessibility: accessibilityConfig,
  font: fontConfig,
  color: colorConfig,
  spacing: spacingConfig,
  border: borderConfig,
  shadow: shadowConfig,
  icon: iconConfig,
  image: imageConfig,
  video: videoConfig,
  audio: audioConfig,
  document: documentConfig,
};