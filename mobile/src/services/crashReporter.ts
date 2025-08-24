import * as SecureStore from 'expo-secure-store';
// import * as Sentry from 'sentry-expo'; // Commented out since not available
import { Platform, NativeModules } from 'react-native';
import { logError, log } from '../config';
import { ErrorHandler, ErrorType } from '../utils/errorHandler';
import { AppError } from '../utils/errorHandler';

export interface CrashReport {
  id: string;
  timestamp: string;
  type: 'crash' | 'error' | 'warning';
  error: {
    message: string;
    type: ErrorType;
    code?: string;
    stack?: string;
    details?: any;
  };
  context: {
    screen?: string;
    action?: string;
    userId?: string;
    sessionId?: string;
    appVersion: string;
    buildNumber: string;
    platform: string;
    osVersion: string;
    deviceModel: string;
    freeMemory?: number;
    totalMemory?: number;
    networkStatus?: 'online' | 'offline';
    lastCrashTime?: string;
  };
  metadata: {
    userAgent?: string;
    language: string;
    timezone: string;
    isEmulator: boolean;
    hasCameraPermission: boolean;
    hasPhotoLibraryPermission: boolean;
    storageInfo?: {
      totalSpace: number;
      freeSpace: number;
      usedSpace: number;
    };
  };
}

export interface CrashAnalytics {
  totalCrashes: number;
  crashesByType: Record<ErrorType, number>;
  crashesByScreen: Record<string, number>;
  crashesByDevice: Record<string, number>;
  crashesByOS: Record<string, number>;
  recentCrashes: CrashReport[];
  crashFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export class CrashReporter {
  private static instance: CrashReporter;
  private isInitialized: boolean = false;
  private sessionId: string;
  private userId: string | null = null;
  private crashReports: CrashReport[] = [];
  private maxStoredReports: number = 50;
  private lastCrashTime: string | null = null;
  private crashCount: number = 0;
  private crashThreshold: number = 5; // Report after 5 crashes
  private crashWindow: number = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.loadStoredData();
  }

  static getInstance(): CrashReporter {
    if (!CrashReporter.instance) {
      CrashReporter.instance = new CrashReporter();
    }
    return CrashReporter.instance;
  }

  /**
   * Initialize crash reporting with Sentry or custom service
   */
  async initialize(apiKey?: string, userId?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.userId = userId || null;
      
      // Initialize Sentry if API key is provided
      if (apiKey) {
        // Sentry.init({
        //   dsn: apiKey,
        //   enableAutoSessionTracking: true,
        //   debug: __DEV__,
        //   environment: __DEV__ ? 'development' : 'production',
        // });
        log('Sentry would be initialized with API key');
      }

      this.isInitialized = true;
      log('Crash reporter initialized');
    } catch (error) {
      logError('Failed to initialize crash reporter:', error);
      // Continue without Sentry if initialization fails
      this.isInitialized = true;
    }
  }

  /**
   * Set user ID for crash reporting
   */
  setUserId(userId: string): void {
    this.userId = userId;
    // if (this.isInitialized && typeof Sentry.setUser === 'function') {
    //   Sentry.setUser({ id: userId });
    // }
  }

  /**
   * Report a crash or error
   */
  async reportCrash(
    error: any,
    context?: {
      screen?: string;
      action?: string;
      details?: any;
    }
  ): Promise<string> {
    const crashReport = await this.createCrashReport(error, context);
    
    // Store the crash report locally
    this.storeCrashReport(crashReport);
    
    // Send to external service if available
    if (this.isInitialized) {
      await this.sendToExternalService(crashReport);
    }

    // Check if we should show a crash notification
    this.checkCrashFrequency(crashReport);

    return crashReport.id;
  }

  /**
   * Create a crash report object
   */
  private async createCrashReport(
    error: any,
    context?: {
      screen?: string;
      action?: string;
      details?: any;
    }
  ): Promise<CrashReport> {
    const appError = this.normalizeError(error);
    
    // Get device information
    const deviceInfo = await this.getDeviceInfo();
    
    // Get memory information
    const memoryInfo = await this.getMemoryInfo();
    
    // Get storage information
    const storageInfo = await this.getStorageInfo();

    const crashReport: CrashReport = {
      id: this.generateCrashId(),
      timestamp: new Date().toISOString(),
      type: 'crash',
      error: {
        message: appError.message,
        type: appError.type,
        code: appError.code,
        stack: appError.stack,
        details: appError.details,
      },
      context: {
        screen: context?.screen,
        action: context?.action,
        userId: this.userId || undefined,
        sessionId: this.sessionId,
        appVersion: deviceInfo.appVersion,
        buildNumber: deviceInfo.buildNumber,
        platform: deviceInfo.platform,
        osVersion: deviceInfo.osVersion,
        deviceModel: deviceInfo.deviceModel,
        freeMemory: memoryInfo.free,
        totalMemory: memoryInfo.total,
        networkStatus: deviceInfo.networkStatus,
        lastCrashTime: this.lastCrashTime || undefined,
      },
      metadata: {
        userAgent: deviceInfo.userAgent,
        language: deviceInfo.language,
        timezone: deviceInfo.timezone,
        isEmulator: deviceInfo.isEmulator,
        hasCameraPermission: deviceInfo.hasCameraPermission,
        hasPhotoLibraryPermission: deviceInfo.hasPhotoLibraryPermission,
        storageInfo,
      },
    };

    return crashReport;
  }

  /**
   * Normalize error to AppError format
   */
  private normalizeError(error: any): AppError {
    if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
      return error as AppError;
    }

    return ErrorHandler.normalizeError(error);
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<any> {
    try {
      const { NativeModules } = require('react-native');
      const { DeviceInfo } = NativeModules;
      
      return {
        appVersion: DeviceInfo?.version || '1.0.0',
        buildNumber: DeviceInfo?.buildNumber || '1',
        platform: Platform.OS,
        osVersion: Platform.Version?.toString() || 'unknown',
        deviceModel: DeviceInfo?.model || 'unknown',
        networkStatus: 'online', // Would need NetInfo for real status
        userAgent: `AI-Calorie-Tracker/${DeviceInfo?.version || '1.0.0'}`,
        language: DeviceInfo?.preferredLanguages?.[0] || 'en',
        timezone: new Date().getTimezoneOffset().toString(),
        isEmulator: DeviceInfo?.isEmulator || false,
        hasCameraPermission: false, // Would need permission check
        hasPhotoLibraryPermission: false, // Would need permission check
      };
    } catch {
      return {
        appVersion: '1.0.0',
        buildNumber: '1',
        platform: Platform.OS,
        osVersion: Platform.Version?.toString() || 'unknown',
        deviceModel: 'unknown',
        networkStatus: 'online',
        userAgent: 'AI-Calorie-Tracker/1.0.0',
        language: 'en',
        timezone: new Date().getTimezoneOffset().toString(),
        isEmulator: false,
        hasCameraPermission: false,
        hasPhotoLibraryPermission: false,
      };
    }
  }

  /**
   * Get memory information
   */
  private async getMemoryInfo(): Promise<{ free: number; total: number }> {
    try {
      // This is a simplified implementation
      // In a real app, you would use device-specific APIs
      return {
        free: Math.floor(Math.random() * 1000), // MB
        total: 2048, // MB
      };
    } catch {
      return { free: 0, total: 0 };
    }
  }

  /**
   * Get storage information
   */
  private async getStorageInfo(): Promise<{
    totalSpace: number;
    freeSpace: number;
    usedSpace: number;
  }> {
    try {
      // This is a simplified implementation
      // In a real app, you would use file system APIs
      const totalSpace = 64 * 1024 * 1024 * 1024; // 64GB
      const freeSpace = Math.floor(Math.random() * totalSpace * 0.5); // Random free space
      const usedSpace = totalSpace - freeSpace;

      return { totalSpace, freeSpace, usedSpace };
    } catch {
      return { totalSpace: 0, freeSpace: 0, usedSpace: 0 };
    }
  }

  /**
   * Store crash report locally
   */
  private async storeCrashReport(report: CrashReport): Promise<void> {
    try {
      this.crashReports.unshift(report);
      
      // Keep only the most recent reports
      if (this.crashReports.length > this.maxStoredReports) {
        this.crashReports = this.crashReports.slice(0, this.maxStoredReports);
      }

      // Update crash statistics
      this.crashCount++;
      this.lastCrashTime = report.timestamp;

      // Store in SecureStore
      await SecureStore.setItemAsync('crash_reports', JSON.stringify(this.crashReports));
      await SecureStore.setItemAsync('last_crash_time', this.lastCrashTime);
      await SecureStore.setItemAsync('crash_count', this.crashCount.toString());

      log('Crash report stored locally:', { id: report.id, type: report.error.type });
    } catch (error) {
      logError('Failed to store crash report:', error);
    }
  }

  /**
   * Send crash report to external service
   */
  private async sendToExternalService(report: CrashReport): Promise<void> {
    try {
      // if (typeof Sentry.captureException === 'function') {
      //   Sentry.captureException(report.error.message, {
      //     tags: {
      //       type: report.error.type,
      //       code: report.error.code,
      //       screen: report.context.screen,
      //       platform: report.context.platform,
      //     },
      //     extra: {
      //       report: report,
      //       userId: report.context.userId,
      //       sessionId: report.context.sessionId,
      //     },
      //   });
      // }
      
      // Log crash to console for debugging
      log('Crash reported:', {
        type: report.error.type,
        message: report.error.message,
        screen: report.context.screen,
        platform: report.context.platform,
      });

      // Could also send to custom analytics endpoint
      // await this.sendToCustomAnalytics(report);
    } catch (error) {
      logError('Failed to send crash report to external service:', error);
    }
  }

  /**
   * Check crash frequency and take appropriate action
   */
  private checkCrashFrequency(report: CrashReport): void {
    if (!this.lastCrashTime) return;

    const timeSinceLastCrash = Date.now() - new Date(this.lastCrashTime).getTime();
    
    if (timeSinceLastCrash < this.crashWindow) {
      // Multiple crashes in a short time window
      log('Multiple crashes detected:', { 
        crashCount: this.crashCount, 
        timeSinceLastCrash 
      });

      // Could implement crash recovery logic here
      // - Reset app state
      // - Clear cache
      // - Show error message to user
    }
  }

  /**
   * Load stored crash data
   */
  private async loadStoredData(): Promise<void> {
    try {
      const storedReports = await SecureStore.getItemAsync('crash_reports');
      if (storedReports) {
        this.crashReports = JSON.parse(storedReports);
      }

      const lastCrashTime = await SecureStore.getItemAsync('last_crash_time');
      if (lastCrashTime) {
        this.lastCrashTime = lastCrashTime;
      }

      const crashCount = await SecureStore.getItemAsync('crash_count');
      if (crashCount) {
        this.crashCount = parseInt(crashCount, 10);
      }
    } catch (error) {
      logError('Failed to load stored crash data:', error);
    }
  }

  /**
   * Get crash analytics
   */
  getCrashAnalytics(): CrashAnalytics {
    const analytics: CrashAnalytics = {
      totalCrashes: this.crashCount,
      crashesByType: {} as Record<ErrorType, number>,
      crashesByScreen: {},
      crashesByDevice: {},
      crashesByOS: {},
      recentCrashes: this.crashReports.slice(0, 10),
      crashFrequency: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
    };

    // Calculate crashes by type
    this.crashReports.forEach(report => {
      const type = report.error.type;
      analytics.crashesByType[type] = (analytics.crashesByType[type] || 0) + 1;
    });

    // Calculate crashes by screen
    this.crashReports.forEach(report => {
      const screen = report.context.screen || 'unknown';
      analytics.crashesByScreen[screen] = (analytics.crashesByScreen[screen] || 0) + 1;
    });

    // Calculate crashes by device
    this.crashReports.forEach(report => {
      const device = report.context.deviceModel || 'unknown';
      analytics.crashesByDevice[device] = (analytics.crashesByDevice[device] || 0) + 1;
    });

    // Calculate crashes by OS
    this.crashReports.forEach(report => {
      const os = report.context.platform || 'unknown';
      analytics.crashesByOS[os] = (analytics.crashesByOS[os] || 0) + 1;
    });

    // Calculate crash frequency (simplified)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    analytics.crashFrequency.daily = this.crashReports.filter(
      report => new Date(report.timestamp) > oneDayAgo
    ).length;

    analytics.crashFrequency.weekly = this.crashReports.filter(
      report => new Date(report.timestamp) > oneWeekAgo
    ).length;

    analytics.crashFrequency.monthly = this.crashReports.filter(
      report => new Date(report.timestamp) > oneMonthAgo
    ).length;

    return analytics;
  }

  /**
   * Clear stored crash reports
   */
  async clearCrashReports(): Promise<void> {
    try {
      this.crashReports = [];
      this.crashCount = 0;
      this.lastCrashTime = null;

      await SecureStore.deleteItemAsync('crash_reports');
      await SecureStore.deleteItemAsync('last_crash_time');
      await SecureStore.deleteItemAsync('crash_count');

      log('Crash reports cleared');
    } catch (error) {
      logError('Failed to clear crash reports:', error);
    }
  }

  /**
   * Generate unique crash ID
   */
  private generateCrashId(): string {
    return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Create new session
   */
  newSession(): void {
    this.sessionId = this.generateSessionId();
    log('New session created:', { sessionId: this.sessionId });
  }

  /**
   * Check if app is in crash loop
   */
  isInCrashLoop(): boolean {
    if (!this.lastCrashTime || this.crashCount < this.crashThreshold) {
      return false;
    }

    const timeSinceLastCrash = Date.now() - new Date(this.lastCrashTime).getTime();
    return timeSinceLastCrash < this.crashWindow;
  }

  /**
   * Get crash recovery suggestions
   */
  getRecoverySuggestions(): string[] {
    const suggestions: string[] = [];

    if (this.isInCrashLoop()) {
      suggestions.push('App is experiencing repeated crashes. Please try the following:');
      suggestions.push('1. Restart the app');
      suggestions.push('2. Clear app cache and data');
      suggestions.push('3. Check for available updates');
      suggestions.push('4. Contact support if the issue persists');
    }

    const analytics = this.getCrashAnalytics();
    if (analytics.crashesByType.unknown > 5) {
      suggestions.push('Multiple unknown crashes detected. Please check device compatibility.');
    }

    if (analytics.crashesByType.unknown > 3) {
      suggestions.push('Unknown crashes detected. Check device compatibility and available memory.');
    }

    if (analytics.crashesByType.permission > 2) {
      suggestions.push('Permission-related crashes detected. Check app permissions.');
    }

    return suggestions;
  }
}

// Export singleton instance
export const crashReporter = CrashReporter.getInstance();
export default crashReporter;