import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { crashReporter } from '../services/crashReporter';
import { ErrorHandler, ErrorType } from '../utils/errorHandler';
import { crashScenarioTester } from '../utils/crashScenarios';
import { logError, log } from '../config';

interface CrashMonitoringConfig {
  enableAutoReporting?: boolean;
  enableScenarioTesting?: boolean;
  reportFrequency?: number; // minutes
  maxReportsPerSession?: number;
  enableMemoryMonitoring?: boolean;
  enableNetworkMonitoring?: boolean;
  enablePerformanceMonitoring?: boolean;
}

interface CrashMonitoringState {
  isMonitoring: boolean;
  crashCount: number;
  lastCrashTime: string | null;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  networkStatus: 'online' | 'offline';
  performanceMetrics: {
    fps: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export const useCrashMonitoring = (config: CrashMonitoringConfig = {}) => {
  const {
    enableAutoReporting = true,
    enableScenarioTesting = false,
    reportFrequency = 5,
    maxReportsPerSession = 10,
    enableMemoryMonitoring = true,
    enableNetworkMonitoring = true,
    enablePerformanceMonitoring = true,
  } = config;

  const [state, setState] = useState<CrashMonitoringState>({
    isMonitoring: false,
    crashCount: 0,
    lastCrashTime: null,
    memoryUsage: { used: 0, total: 0, percentage: 0 },
    networkStatus: 'online',
    performanceMetrics: { fps: 60, memoryUsage: 0, cpuUsage: 0 },
  });

  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const lastReportTime = useRef<number>(0);
  const reportCount = useRef<number>(0);
  const appState = useRef<AppStateStatus>('active');

  // Initialize crash monitoring
  useEffect(() => {
    initializeMonitoring();
    
    return () => {
      cleanupMonitoring();
    };
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  const initializeMonitoring = useCallback(async () => {
    try {
      log('Initializing crash monitoring');
      
      // Initialize crash reporter
      await crashReporter.initialize();
      
      // Set up monitoring intervals
      if (enableAutoReporting) {
        startMonitoring();
      }
      
      // Set up error boundaries
      setupErrorBoundaries();
      
      // Set up global error handlers
      setupGlobalErrorHandlers();
      
      setState(prev => ({ ...prev, isMonitoring: true }));
      
      log('Crash monitoring initialized successfully');
    } catch (error) {
      logError('Failed to initialize crash monitoring:', error);
    }
  }, [enableAutoReporting]);

  const startMonitoring = useCallback(() => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
    }

    monitoringInterval.current = setInterval(async () => {
      await performMonitoringChecks();
    }, reportFrequency * 60 * 1000); // Convert minutes to milliseconds

    log(`Crash monitoring started with ${reportFrequency} minute intervals`);
  }, [reportFrequency]);

  const stopMonitoring = useCallback(() => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
    log('Crash monitoring stopped');
  }, []);

  const cleanupMonitoring = useCallback(() => {
    stopMonitoring();
    setState(prev => ({ ...prev, isMonitoring: false }));
    log('Crash monitoring cleaned up');
  }, [stopMonitoring]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    const currentAppState = appState.current;
    appState.current = nextAppState;

    log(`App state changed: ${currentAppState} -> ${nextAppState}`);

    // Perform checks when app comes to foreground
    if (currentAppState.match(/inactive|background/) && nextAppState === 'active') {
      handleAppForeground();
    }

    // Clean up when app goes to background
    if (nextAppState === 'background') {
      handleAppBackground();
    }
  }, []);

  const handleAppForeground = useCallback(async () => {
    log('App came to foreground, performing checks');
    
    // Check for crashes that might have occurred while app was in background
    await checkForBackgroundCrashes();
    
    // Refresh monitoring
    if (enableMemoryMonitoring) {
      checkMemoryUsage();
    }
    
    if (enableNetworkMonitoring) {
      checkNetworkStatus();
    }
  }, [enableMemoryMonitoring, enableNetworkMonitoring]);

  const handleAppBackground = useCallback(() => {
    log('App went to background');
    
    // Stop intensive monitoring when app is in background
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = setTimeout(() => {
        startMonitoring();
      }, 30000); // Restart monitoring after 30 seconds
    }
  }, [startMonitoring]);

  const performMonitoringChecks = useCallback(async () => {
    try {
      const checks = [];
      
      if (enableMemoryMonitoring) {
        checks.push(checkMemoryUsage());
      }
      
      if (enableNetworkMonitoring) {
        checks.push(checkNetworkStatus());
      }
      
      if (enablePerformanceMonitoring) {
        checks.push(checkPerformanceMetrics());
      }
      
      await Promise.all(checks);
      
      log('All monitoring checks completed');
    } catch (error) {
      logError('Monitoring check failed:', error);
    }
  }, [enableMemoryMonitoring, enableNetworkMonitoring, enablePerformanceMonitoring]);

  const checkMemoryUsage = useCallback(async () => {
    try {
      // This is a simplified implementation
      // In a real app, you would use device-specific APIs
      const usedMemory = Math.floor(Math.random() * 1000); // MB
      const totalMemory = 2048; // MB
      const percentage = (usedMemory / totalMemory) * 100;
      
      setState(prev => ({
        ...prev,
        memoryUsage: { used: usedMemory, total: totalMemory, percentage }
      }));
      
      // Alert if memory usage is high
      if (percentage > 80) {
        log(`High memory usage detected: ${percentage.toFixed(1)}%`);
        await reportMemoryWarning(percentage);
      }
      
      return { used: usedMemory, total: totalMemory, percentage };
    } catch (error) {
      logError('Memory usage check failed:', error);
      return null;
    }
  }, []);

  const checkNetworkStatus = useCallback(async () => {
    try {
      // This is a simplified implementation
      // In a real app, you would use NetInfo
      const isOnline = Math.random() > 0.1; // 90% chance of being online
      
      setState(prev => ({
        ...prev,
        networkStatus: isOnline ? 'online' : 'offline'
      }));
      
      if (!isOnline) {
        log('Network status: offline');
        await reportNetworkOffline();
      }
      
      return isOnline;
    } catch (error) {
      logError('Network status check failed:', error);
      return true;
    }
  }, []);

  const checkPerformanceMetrics = useCallback(async () => {
    try {
      // This is a simplified implementation
      // In a real app, you would use performance monitoring APIs
      const fps = 30 + Math.floor(Math.random() * 30); // 30-60 FPS
      const memoryUsage = Math.floor(Math.random() * 1000); // MB
      const cpuUsage = Math.floor(Math.random() * 100); // 0-100%
      
      setState(prev => ({
        ...prev,
        performanceMetrics: { fps, memoryUsage, cpuUsage }
      }));
      
      // Alert if performance is poor
      if (fps < 30) {
        log(`Low FPS detected: ${fps}`);
        await reportPerformanceIssue('low_fps', fps);
      }
      
      return { fps, memoryUsage, cpuUsage };
    } catch (error) {
      logError('Performance metrics check failed:', error);
      return null;
    }
  }, []);

  const setupErrorBoundaries = useCallback(() => {
    // Set up global error handlers
    Error.stackTraceLimit = 50;
    
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError('Unhandled promise rejection:', event.reason);
      reportCrash(event.reason, {
        action: 'unhandled_promise_rejection',
        source: 'global'
      });
    };
    
    // Handle uncaught exceptions
    const handleUncaughtException = (event: ErrorEvent) => {
      logError('Uncaught exception:', event.error);
      reportCrash(event.error, {
        action: 'uncaught_exception',
        source: 'global'
      });
    };
    
    // Add event listeners (web only)
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      window.addEventListener('error', handleUncaughtException);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('error', handleUncaughtException);
      }
    };
  }, []);

  const setupGlobalErrorHandlers = useCallback(() => {
    // Override console.error to capture errors
    const originalError = console.error;
    console.error = (...args) => {
      originalError.apply(console, args);
      const error = args[0];
      if (error instanceof Error) {
        reportCrash(error, {
          action: 'console_error',
          source: 'global'
        });
      }
    };
    
    // Override console.warn to capture warnings
    const originalWarn = console.warn;
    console.warn = (...args) => {
      originalWarn.apply(console, args);
      const warning = args[0];
      if (typeof warning === 'string' && warning.includes('Warning')) {
        reportWarning(warning, {
          action: 'console_warning',
          source: 'global'
        });
      }
    };
  }, []);

  const reportCrash = useCallback(async (
    error: any,
    context?: {
      screen?: string;
      action?: string;
      details?: any;
      source?: string;
    }
  ) => {
    try {
      // Check if we should report this crash
      const now = Date.now();
      if (now - lastReportTime.current < 60000) { // 1 minute cooldown
        return;
      }
      
      if (reportCount.current >= maxReportsPerSession) {
        log('Max reports per session reached, skipping crash report');
        return;
      }
      
      // Report the crash
      const crashId = await crashReporter.reportCrash(error, context);
      
      // Update state
      setState(prev => ({
        ...prev,
        crashCount: prev.crashCount + 1,
        lastCrashTime: new Date().toISOString()
      }));
      
      lastReportTime.current = now;
      reportCount.current++;
      
      log(`Crash reported: ${crashId}`);
      
      // Check if we're in a crash loop
      if (crashReporter.isInCrashLoop()) {
        await handleCrashLoop();
      }
      
    } catch (reportError) {
      logError('Failed to report crash:', reportError);
    }
  }, [maxReportsPerSession]);

  const reportWarning = useCallback(async (
    warning: string,
    context?: {
      screen?: string;
      action?: string;
      details?: any;
      source?: string;
    }
  ) => {
    try {
      // Report warnings but with different severity
      await crashReporter.reportCrash(new Error(warning), {
        ...context,
      });
      
      log(`Warning reported: ${warning}`);
    } catch (error) {
      logError('Failed to report warning:', error);
    }
  }, []);

  const reportMemoryWarning = useCallback(async (percentage: number) => {
    await reportWarning(`High memory usage: ${percentage.toFixed(1)}%`, {
      action: 'memory_warning',
      details: { percentage }
    });
  }, [reportWarning]);

  const reportNetworkOffline = useCallback(async () => {
    await reportWarning('Network offline', {
      action: 'network_offline'
    });
  }, [reportWarning]);

  const reportPerformanceIssue = useCallback(
    async (type: string, value: number) => {
      await reportWarning(`Performance issue: ${type} = ${value}`, {
        action: 'performance_issue',
        details: { type, value }
      });
    },
    [reportWarning]
  );

  const handleCrashLoop = useCallback(async () => {
    log('Crash loop detected, taking recovery actions');
    
    try {
      // Get recovery suggestions
      const suggestions = crashReporter.getRecoverySuggestions();
      
      // Reset session
      crashReporter.newSession();
      
      // Reset report count
      reportCount.current = 0;
      
      // Log recovery actions
      log('Recovery actions taken:', suggestions);
      
    } catch (error) {
      logError('Failed to handle crash loop:', error);
    }
  }, []);

  const checkForBackgroundCrashes = useCallback(async () => {
    try {
      // This would check for crashes that occurred while app was in background
      // For now, we'll just log the check
      log('Checking for background crashes');
      
    } catch (error) {
      logError('Failed to check for background crashes:', error);
    }
  }, []);

  const runScenarioTests = useCallback(async (scenarioIds?: string[]) => {
    if (!enableScenarioTesting) {
      log('Scenario testing is disabled');
      return [];
    }
    
    try {
      log('Running scenario tests');
      
      if (scenarioIds && scenarioIds.length > 0) {
        // Run specific scenarios
        const results = [];
        for (const id of scenarioIds) {
          const result = await crashScenarioTester.runScenario(id);
          results.push(result);
        }
        return results;
      } else {
        // Run all scenarios
        return await crashScenarioTester.runAllScenarios();
      }
    } catch (error) {
      logError('Failed to run scenario tests:', error);
      return [];
    }
  }, [enableScenarioTesting]);

  const getMonitoringStats = useCallback(() => {
    return {
      ...state,
      sessionReports: reportCount.current,
      timeSinceLastReport: state.lastCrashTime 
        ? Date.now() - new Date(state.lastCrashTime).getTime()
        : null,
      crashReporterStats: crashReporter.getCrashAnalytics(),
      scenarioTestStats: crashScenarioTester.getTestStats()
    };
  }, [state]);

  const resetMonitoring = useCallback(() => {
    reportCount.current = 0;
    lastReportTime.current = 0;
    setState(prev => ({
      ...prev,
      crashCount: 0,
      lastCrashTime: null
    }));
    log('Monitoring state reset');
  }, []);

  return {
    state,
    reportCrash,
    reportWarning,
    startMonitoring,
    stopMonitoring,
    runScenarioTests,
    getMonitoringStats,
    resetMonitoring,
    isMonitoring: state.isMonitoring,
    crashCount: state.crashCount,
    memoryUsage: state.memoryUsage,
    networkStatus: state.networkStatus,
    performanceMetrics: state.performanceMetrics
  };
};

// Utility function to wrap async operations with crash monitoring
export const withCrashMonitoring = <T extends (...args: any[]) => any>(
  fn: T,
  context?: {
    screen?: string;
    action?: string;
    details?: any;
  }
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result && typeof result.catch === 'function') {
        return result.catch((error: any) => {
          crashReporter.reportCrash(error, context);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      crashReporter.reportCrash(error, context);
      throw error;
    }
  }) as T;
};

// Error boundary component for React components
export const CrashBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
      setHasError(true);
      crashReporter.reportCrash(event.error, {
        action: 'crash_boundary',
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason);
      setError(error);
      setHasError(true);
      crashReporter.reportCrash(error, {
        action: 'crash_boundary',
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
    };
  }, []);

  if (hasError) {
    return null;
  }

  return children;
};

export default useCrashMonitoring;