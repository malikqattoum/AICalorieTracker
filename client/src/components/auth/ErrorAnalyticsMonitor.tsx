// Error analytics and monitoring for authentication
import React, { useEffect, useState } from 'react';
import { logInfo, logWarning } from '../../lib/config';
import { 
  AuthError, 
  AuthErrorType, 
  ErrorAnalytics, 
  getErrorAnalytics, 
  getErrorState,
  configureErrorHandling 
} from '../../lib/errorHandling';

interface ErrorAnalyticsProps {
  enabled?: boolean;
  maxErrorsToShow?: number;
  showDebugInfo?: boolean;
}

interface ErrorStats {
  totalErrors: number;
  errorByType: Map<AuthErrorType, number>;
  recentErrors: AuthError[];
  recoverySuccessRate: number;
  mostCommonError: AuthErrorType | null;
}

export function ErrorAnalyticsMonitor({ 
  enabled = true, 
  maxErrorsToShow = 10,
  showDebugInfo = false 
}: ErrorAnalyticsProps) {
  const [stats, setStats] = useState<ErrorStats>({
    totalErrors: 0,
    errorByType: new Map(),
    recentErrors: [],
    recoverySuccessRate: 0,
    mostCommonError: null
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const updateStats = () => {
      const errorState = getErrorState();
      const analytics = getErrorAnalytics();
      
      // Calculate total errors
      let totalErrors = 0;
      const errorByType = new Map<AuthErrorType, number>();
      let mostCommonError: AuthErrorType | null = null;
      let maxCount = 0;

      analytics.forEach((analyticsData, errorType) => {
        const count = analyticsData.frequency;
        totalErrors += count;
        errorByType.set(errorType, count);
        
        if (count > maxCount) {
          maxCount = count;
          mostCommonError = errorType;
        }
      });

      // Get recent errors
      const recentErrors = Array.from(errorState.errors.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, maxErrorsToShow);

      // Calculate recovery success rate
      const successfulRecoveries = Array.from(errorState.errors.values())
        .filter(error => error.retryable && error.retryCount! >= 3)
        .length;
      const recoverySuccessRate = errorState.errors.size > 0 
        ? (successfulRecoveries / errorState.errors.size) * 100 
        : 0;

      setStats({
        totalErrors,
        errorByType,
        recentErrors,
        recoverySuccessRate,
        mostCommonError
      });
    };

    // Initial update
    updateStats();

    // Update stats every 5 seconds
    const intervalId = setInterval(updateStats, 5000);

    // Listen for error events
    const handleAuthError = (event: any) => {
      logInfo('New auth error detected', event.detail);
      updateStats();
    };

    // Set up event listeners (in a real app, you might use a proper event system)
    window.addEventListener('auth-error', handleAuthError);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, [enabled, maxErrorsToShow]);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const clearAnalytics = () => {
    // This would clear the error state in a real implementation
    logInfo('Error analytics cleared');
    setStats({
      totalErrors: 0,
      errorByType: new Map(),
      recentErrors: [],
      recoverySuccessRate: 0,
      mostCommonError: null
    });
  };

  const exportAnalytics = () => {
    const analyticsData = {
      timestamp: new Date().toISOString(),
      stats: stats,
      errorState: getErrorState()
    };

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `auth-analytics-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Analytics toggle button */}
      <button
        onClick={toggleVisibility}
        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Error Analytics"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* Analytics panel */}
      {isVisible && (
        <div className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Error Analytics</h3>
            <div className="flex space-x-2">
              <button
                onClick={exportAnalytics}
                className="text-sm text-blue-600 hover:text-blue-800"
                title="Export Analytics"
              >
                Export
              </button>
              <button
                onClick={clearAnalytics}
                className="text-sm text-red-600 hover:text-red-800"
                title="Clear Analytics"
              >
                Clear
              </button>
              <button
                onClick={toggleVisibility}
                className="text-gray-400 hover:text-gray-600"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalErrors}</div>
              <div className="text-sm text-blue-800">Total Errors</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.recoverySuccessRate.toFixed(1)}%</div>
              <div className="text-sm text-green-800">Recovery Rate</div>
            </div>
          </div>

          {/* Error type breakdown */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Error Types</h4>
            <div className="space-y-2">
              {Array.from(stats.errorByType.entries()).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{type.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent errors */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Errors</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {stats.recentErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded border">
                  <div className="font-medium text-gray-900">{error.type}</div>
                  <div className="text-gray-600 truncate">{error.message}</div>
                  <div className="text-gray-400 text-xs">
                    {error.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Debug info */}
          {showDebugInfo && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Most Common Error: {stats.mostCommonError || 'None'}</div>
                <div>Active Errors: {stats.recentErrors.length}</div>
                <div>Analytics Enabled: {enabled}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for accessing error analytics
export function useErrorAnalytics() {
  const [analytics, setAnalytics] = useState<Map<AuthErrorType, ErrorAnalytics>>(new Map());
  const [errorState, setErrorState] = useState<any>(null);

  useEffect(() => {
    const updateAnalytics = () => {
      setAnalytics(getErrorAnalytics());
      setErrorState(getErrorState());
    };

    updateAnalytics();
    const intervalId = setInterval(updateAnalytics, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return {
    analytics,
    errorState,
    exportAnalytics: () => {
      const data = {
        analytics,
        errorState,
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `auth-analytics-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }
  };
}

// Error tracking hook for components
export function useErrorTracking() {
  const trackError = React.useCallback((error: Error, context?: any) => {
    // This would integrate with your error tracking system
    console.error('Tracking error', { error, context, timestamp: new Date() });
    
    // Dispatch custom event for error monitoring
    const customEvent = new CustomEvent('auth-error', {
      detail: { error, context, timestamp: new Date() }
    });
    window.dispatchEvent(customEvent);
  }, []);

  const trackRecovery = React.useCallback((errorType: AuthErrorType, success: boolean) => {
    logInfo('Tracking recovery', { errorType, success, timestamp: new Date() });
    
    const customEvent = new CustomEvent('auth-recovery', {
      detail: { errorType, success, timestamp: new Date() }
    });
    window.dispatchEvent(customEvent);
  }, []);

  return {
    trackError,
    trackRecovery
  };
}