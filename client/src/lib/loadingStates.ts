import React, { useState, useEffect, useCallback } from 'react';

// Loading states configuration
export const loadingConfig = {
  // Animation durations
  durations: {
    spinner: 1000,
    pulse: 1500,
    bounce: 2000,
    fade: 300,
    slide: 400,
  },
  
  // Progress bar configurations
  progress: {
    height: '4px',
    backgroundColor: '#e5e7eb',
    foregroundColor: '#3b82f6',
    borderRadius: '9999px',
    transitionDuration: '300ms',
  },
  
  // Loading message templates
  messages: {
    generic: 'Loading...',
    network: 'Connecting to server...',
    processing: 'Processing your request...',
    saving: 'Saving changes...',
    uploading: 'Uploading files...',
    downloading: 'Downloading files...',
    searching: 'Searching...',
    loadingMore: 'Loading more items...',
  },
  
  // Error message templates
  errorMessages: {
    generic: 'An error occurred',
    network: 'Network error',
    timeout: 'Request timed out',
    unauthorized: 'Unauthorized access',
    forbidden: 'Access forbidden',
    notFound: 'Resource not found',
    serverError: 'Server error',
    validation: 'Validation error',
  },
};

// Loading hook
export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingMessage, setLoadingMessage] = useState(loadingConfig.messages.generic);
  
  const startLoading = useCallback((message?: string) => {
    setIsLoading(true);
    setLoadingMessage(message || loadingConfig.messages.generic);
  }, []);
  
  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(loadingConfig.messages.generic);
  }, []);
  
  const toggleLoading = useCallback(() => {
    setIsLoading(prev => !prev);
  }, []);
  
  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    toggleLoading,
    setLoadingMessage,
  };
}

// Progress hook
export function useProgress(initialValue = 0) {
  const [progress, setProgress] = useState(initialValue);
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  
  const updateProgress = useCallback((value: number, indeterminate = false) => {
    setProgress(Math.max(0, Math.min(100, value)));
    setIsIndeterminate(indeterminate);
  }, []);
  
  const resetProgress = useCallback(() => {
    setProgress(0);
    setIsIndeterminate(false);
  }, []);
  
  const animateProgress = useCallback((targetValue: number, duration = 1000) => {
    setIsIndeterminate(false);
    const startValue = progress;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressValue = Math.min(elapsed / duration, 1);
      
      const currentValue = startValue + (targetValue - startValue) * progressValue;
      setProgress(currentValue);
      
      if (progressValue < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [progress]);
  
  return {
    progress,
    isIndeterminate,
    updateProgress,
    resetProgress,
    animateProgress,
  };
}

// Debounced loading hook
export function useDebouncedLoading(delay = 300) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingConfig.messages.generic);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  
  const startLoading = useCallback((message?: string) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsLoading(true);
      setLoadingMessage(message || loadingConfig.messages.generic);
    }, delay);
  }, [delay]);
  
  const stopLoading = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsLoading(false);
    setLoadingMessage(loadingConfig.messages.generic);
  }, []);
  
  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
  };
}

// Loading components
export function LoadingSpinner({ 
  size = 'medium', 
  color = 'blue',
  message,
  className = '' 
}: {
  size?: 'small' | 'medium' | 'large';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  message?: string;
  className?: string;
}) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };
  
  const colorClasses = {
    blue: 'border-blue-600 border-t-blue-600',
    green: 'border-green-600 border-t-green-600',
    red: 'border-red-600 border-t-red-600',
    yellow: 'border-yellow-600 border-t-yellow-600',
    purple: 'border-purple-600 border-t-purple-600',
    gray: 'border-gray-600 border-t-gray-600',
  };
  
  return React.createElement('div', {
    className: `flex flex-col items-center justify-center ${className}`,
    children: [
      React.createElement('div', {
        className: `animate-spin rounded-full border-2 border-gray-200 ${sizeClasses[size]} ${colorClasses[color]}`,
      }),
      message && React.createElement('span', {
        className: 'mt-2 text-sm text-gray-600',
        children: message,
      }),
    ],
  });
}

export function LoadingPulse({ 
  message,
  className = '' 
}: {
  message?: string;
  className?: string;
}) {
  return React.createElement('div', {
    className: `flex flex-col items-center justify-center ${className}`,
    children: [
      React.createElement('div', {
        className: 'animate-pulse w-8 h-8 bg-blue-600 rounded-full',
      }),
      message && React.createElement('span', {
        className: 'mt-2 text-sm text-gray-600',
        children: message,
      }),
    ],
  });
}

export function LoadingSkeleton({ 
  rows = 3,
  className = '' 
}: {
  rows?: number;
  className?: string;
}) {
  const skeletonRows = Array.from({ length: rows }, (_, i) => i);
  
  return React.createElement('div', {
    className: `space-y-3 ${className}`,
    children: skeletonRows.map(() => 
      React.createElement('div', {
        className: 'animate-pulse space-y-2',
        children: [
          React.createElement('div', {
            className: 'h-4 bg-gray-200 rounded w-3/4',
          }),
          React.createElement('div', {
            className: 'h-4 bg-gray-200 rounded w-1/2',
          }),
        ],
      })
    ),
  });
}

export function ProgressBar({ 
  progress,
  isIndeterminate = false,
  message,
  className = '' 
}: {
  progress: number;
  isIndeterminate?: boolean;
  message?: string;
  className?: string;
}) {
  const progressStyle = {
    width: `${progress}%`,
    transition: `width ${loadingConfig.progress.transitionDuration} ease-in-out`,
  };
  
  return React.createElement('div', {
    className: `w-full ${className}`,
    children: [
      React.createElement('div', {
        className: 'w-full bg-gray-200 rounded-full h-1',
        children: isIndeterminate ? 
          React.createElement('div', {
            className: 'animate-pulse bg-blue-600 h-1 rounded-full',
          }) :
          React.createElement('div', {
            className: 'bg-blue-600 h-1 rounded-full transition-all duration-300',
            style: progressStyle,
          }),
      }),
      message && React.createElement('div', {
        className: 'mt-2 text-sm text-gray-600 text-center',
        children: message,
      }),
    ],
  });
}

export function LoadingOverlay({ 
  isLoading,
  message,
  children,
  className = '' 
}: {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!isLoading) return children;
  
  return React.createElement('div', {
    className: `relative ${className}`,
    children: [
      children,
      React.createElement('div', {
        className: 'absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10',
        children: React.createElement(LoadingSpinner, {
          message,
          size: 'large',
        }),
      }),
    ],
  });
}

// Error handling hook
export function useErrorHandling() {
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'generic' | 'network' | 'validation' | 'server'>('generic');
  
  const handleError = useCallback((error: Error | string, type: 'generic' | 'network' | 'validation' | 'server' = 'generic') => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    setError(errorMessage);
    setErrorType(type);
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
    setErrorType('generic');
  }, []);
  
  const getErrorMessage = useCallback(() => {
    if (!error) return null;
    
    switch (errorType) {
      case 'network':
        return loadingConfig.errorMessages.network;
      case 'validation':
        return loadingConfig.errorMessages.validation;
      case 'server':
        return loadingConfig.errorMessages.serverError;
      default:
        return loadingConfig.errorMessages.generic;
    }
  }, [error, errorType]);
  
  return {
    error,
    errorType,
    handleError,
    clearError,
    getErrorMessage,
  };
}

// Loading utilities
export const loadingUtils = {
  // Simulate async operation
  simulateAsync: async (duration: number, message?: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, duration);
    });
  },
  
  // Create loading promise
  createLoadingPromise: <T>(
    operation: () => Promise<T>,
    loadingCallback: (isLoading: boolean, message?: string) => void
  ): Promise<T> => {
    loadingCallback(true, loadingConfig.messages.processing);
    
    return operation()
      .finally(() => {
        loadingCallback(false);
      });
  },
  
  // Batch multiple operations
  batchOperations: async (
    operations: Array<() => Promise<any>>,
    onProgress?: (current: number, total: number) => void
  ): Promise<any[]> => {
    const results: any[] = [];
    const total = operations.length;
    
    for (let i = 0; i < operations.length; i++) {
      const result = await operations[i]();
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, total);
      }
    }
    
    return results;
  },
  
  // Retry operation with exponential backoff
  retryOperation: async <T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  },
  
  // Create loading context
  createLoadingContext: () => {
    const loadingStates = new Map<string, boolean>();
    
    const startLoading = (key: string) => {
      loadingStates.set(key, true);
    };
    
    const stopLoading = (key: string) => {
      loadingStates.set(key, false);
    };
    
    const isLoading = (key: string) => {
      return loadingStates.get(key) || false;
    };
    
    const isAnyLoading = () => {
      return Array.from(loadingStates.values()).some(state => state);
    };
    
    return {
      startLoading,
      stopLoading,
      isLoading,
      isAnyLoading,
    };
  },
};

export default {
  loadingConfig,
  useLoading,
  useProgress,
  useDebouncedLoading,
  LoadingSpinner,
  LoadingPulse,
  LoadingSkeleton,
  ProgressBar,
  LoadingOverlay,
  useErrorHandling,
  loadingUtils,
};