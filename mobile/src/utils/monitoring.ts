import { log, logError, ENABLE_LOGGING, SENTRY_DSN } from '../config';
import { ErrorHandler, AppError } from './errorHandler';
import * as Sentry from '@sentry/react-native';

// Initialize Sentry crash reporting
if (!__DEV__ && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENABLE_LOGGING ? 'development' : 'production',
    tracesSampleRate: 0.2,
    attachStacktrace: true,
    enableAutoSessionTracking: true,
  });
}

const crashReporter = {
  captureException: (error: Error, context?: any) => {
    if (!__DEV__ && SENTRY_DSN) {
      Sentry.withScope(scope => {
        if (context) scope.setExtras(context);
        Sentry.captureException(error);
      });
    } else {
      logError('Crash Reported:', error, context);
    }
  },
  captureMessage: (message: string, context?: any) => {
    if (!__DEV__ && SENTRY_DSN) {
      Sentry.withScope(scope => {
        if (context) scope.setExtras(context);
        Sentry.captureMessage(message);
      });
    } else {
      logError('Crash Message:', message, context);
    }
  }
};

export const reportCrash = async (error: Error | AppError, context?: any) => {
  const normalizedError = await ErrorHandler.normalizeError(error);
  const crashContext = {
    ...context,
    errorType: normalizedError.type,
    errorCode: normalizedError.code || 'unknown',
    isFatal: true,
    componentStack: normalizedError.stack,
  };
  
  crashReporter.captureException(normalizedError, crashContext);
  
  // For non-production environments, log detailed error info
  if (__DEV__) {
    logError('Crash Details:', normalizedError, crashContext);
  }
};

// Global error handler setup
export const setupGlobalErrorHandling = () => {
  const defaultHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler(async (error, isFatal) => {
    await reportCrash(error, { isFatal });
    defaultHandler(error, isFatal);
  });
  
  // Capture unhandled promise rejections
  const defaultPromiseRejectionHandler = (global as any).PromiseRejectionTracker;
  (global as any).PromiseRejectionTracker = {
    ...defaultPromiseRejectionHandler,
    onUnhandled(id: string, error: Error) {
      reportCrash(error, { unhandledPromise: true });
      defaultPromiseRejectionHandler.onUnhandled?.(id, error);
    }
  };
};

export const logEvent = (name: string, properties?: Record<string, any>) => {
  if (!ENABLE_LOGGING) {
    // In production, this would send to analytics service
    console.log('Event:', name, properties);
  } else {
    log(`Analytics Event: ${name}`, properties);
  }
};

export const ApiMonitoring = {
  trackRequest: (endpoint: string, method: string) => {
    log(`API Request: ${method} ${endpoint}`);
    logEvent('api_request', { endpoint, method });
  },
  trackResponse: (endpoint: string, method: string, status: number, duration: number) => {
    log(`API Response: ${method} ${endpoint} - ${status} (${duration}ms)`);
    logEvent('api_response', {
      endpoint,
      method,
      status,
      duration
    });
  },
  trackError: async (endpoint: string, method: string, error: any, duration?: number) => {
    const normalizedError = await ErrorHandler.normalizeError(error);
    logError(`API Error: ${method} ${endpoint}`, normalizedError);
    
    logEvent('api_error', {
      endpoint,
      method,
      errorType: normalizedError.type,
      errorCode: normalizedError.code || 'unknown',
      status: 'status' in error ? error.status : 0,
      duration
    });
    
    await reportCrash(normalizedError, {
      endpoint,
      method,
      duration
    });
  }
};

export const PerformanceMetrics = {
  startTrace: (name: string) => {
    if (!__DEV__ && SENTRY_DSN) {
      return Sentry.startSpanManual({ name }, (span) => {
        return {
          end: () => {
            span.end();
            return spanToDuration(span);
          }
        };
      });
    } else {
      const startTime = Date.now();
      log(`⏱️ Trace started: ${name}`);
      return {
        end: () => {
          const duration = Date.now() - startTime;
          log(`⏱️ Trace ended: ${name} (${duration}ms)`);
          logEvent('performance_trace', { name, duration });
          return duration;
        }
      };
    }
  },
  measureInteraction: async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
    return Sentry.startSpanManual({ name }, async (span) => {
      try {
        const result = await operation();
        span.setStatus('ok' as any);
        return result;
      } catch (error) {
        span.setStatus('internal_error' as any);
        throw error;
      } finally {
        span.end();
      }
    });
  },
  trackNavigation: (fromScreen: string, toScreen: string, duration: number) => {
    if (!__DEV__ && SENTRY_DSN) {
      Sentry.metrics.distribution('navigation.duration', duration, {
        unit: 'millisecond',
        tags: { fromScreen, toScreen }
      });
    }
    logEvent('navigation', { fromScreen, toScreen, duration });
  }
};

// Helper to safely get span duration
const spanToDuration = (span: Sentry.Span): number => {
  const end = (span as any).endTimestamp || Date.now() / 1000;
  const start = (span as any).startTimestamp;
  return Math.round((end - start) * 1000);
};

// Send performance metrics to backend
const sendMetricsToBackend = async (metricType: string, data: Record<string, any>) => {
  try {
    const payload = {
      metricType,
      data,
      timestamp: new Date().toISOString(),
      sessionId: sessionStorage.getItem('sessionId'),
      userId: localStorage.getItem('userId')
    };

    if (ENABLE_LOGGING) {
      log(`Sending ${metricType} metrics:`, payload);
    }

    const response = await fetch(`${API_URL}/api/admin/analytics/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      logError('Failed to send metrics:', await response.text());
    }
  } catch (error) {
    logError('Error sending metrics:', error);
  }
};