// Global error state management context
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { AuthError, AuthErrorType, ErrorSeverity, RecoveryStrategy } from '../lib/errorHandling';

// Error state interface
interface ErrorState {
  activeErrors: Map<string, AuthError>;
  globalError: AuthError | null;
  errorHistory: AuthError[];
  isLoading: boolean;
  recoveryInProgress: boolean;
  errorSettings: {
    enableAnalytics: boolean;
    enableLogging: boolean;
    enableRecovery: boolean;
    maxRetries: number;
    retryDelay: number;
  };
}

// Error action types
type ErrorAction =
  | { type: 'ADD_ERROR'; payload: { errorId: string; error: AuthError } }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'SET_GLOBAL_ERROR'; payload: AuthError | null }
  | { type: 'ADD_TO_HISTORY'; payload: AuthError }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RECOVERY_IN_PROGRESS'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ErrorState['errorSettings']> }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'CLEAR_HISTORY' };

// Initial error state
const initialState: ErrorState = {
  activeErrors: new Map(),
  globalError: null,
  errorHistory: [],
  isLoading: false,
  recoveryInProgress: false,
  errorSettings: {
    enableAnalytics: true,
    enableLogging: true,
    enableRecovery: true,
    maxRetries: 3,
    retryDelay: 1000
  }
};

// Error reducer
function errorReducer(state: ErrorState, action: ErrorAction): ErrorState {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        ...state,
        activeErrors: new Map(state.activeErrors).set(action.payload.errorId, action.payload.error)
      };

    case 'REMOVE_ERROR':
      const newErrors = new Map(state.activeErrors);
      newErrors.delete(action.payload);
      return {
        ...state,
        activeErrors: newErrors
      };

    case 'SET_GLOBAL_ERROR':
      return {
        ...state,
        globalError: action.payload
      };

    case 'ADD_TO_HISTORY':
      return {
        ...state,
        errorHistory: [action.payload, ...state.errorHistory].slice(0, 100) // Keep last 100 errors
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_RECOVERY_IN_PROGRESS':
      return {
        ...state,
        recoveryInProgress: action.payload
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        errorSettings: {
          ...state.errorSettings,
          ...action.payload
        }
      };

    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        activeErrors: new Map(),
        globalError: null
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        errorHistory: []
      };

    default:
      return state;
  }
}

// Error context
interface ErrorContextType {
  state: ErrorState;
  actions: {
    addError: (error: AuthError, errorId?: string) => string;
    removeError: (errorId: string) => void;
    setGlobalError: (error: AuthError | null) => void;
    addToHistory: (error: AuthError) => void;
    setLoading: (loading: boolean) => void;
    setRecoveryInProgress: (inProgress: boolean) => void;
    updateSettings: (settings: Partial<ErrorState['errorSettings']>) => void;
    clearAllErrors: () => void;
    clearHistory: () => void;
    getErrorByType: (type: AuthErrorType) => AuthError | null;
    getErrorsBySeverity: (severity: ErrorSeverity) => AuthError[];
    hasError: (type?: AuthErrorType) => boolean;
    getErrorCount: () => number;
    getRecoveryErrors: () => AuthError[];
  };
}

const ErrorContext = createContext<ErrorContextType | null>(null);

// Error provider component
interface ErrorProviderProps {
  children: ReactNode;
  initialSettings?: Partial<ErrorState['errorSettings']>;
}

export function ErrorProvider({ children, initialSettings }: ErrorProviderProps) {
  const [state, dispatch] = useReducer(errorReducer, {
    ...initialState,
    errorSettings: {
      ...initialState.errorSettings,
      ...initialSettings
    }
  });

  // Generate unique error ID
  const generateErrorId = useCallback((error: AuthError): string => {
    return `${error.type}-${error.timestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add error to state
  const addError = useCallback((error: AuthError, errorId?: string): string => {
    const id = errorId || generateErrorId(error);
    
    dispatch({
      type: 'ADD_ERROR',
      payload: { errorId: id, error }
    });

    dispatch({
      type: 'ADD_TO_HISTORY',
      payload: error
    });

    return id;
  }, [generateErrorId]);

  // Remove error from state
  const removeError = useCallback((errorId: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: errorId });
  }, []);

  // Set global error
  const setGlobalError = useCallback((error: AuthError | null) => {
    dispatch({ type: 'SET_GLOBAL_ERROR', payload: error });
  }, []);

  // Add to history
  const addToHistory = useCallback((error: AuthError) => {
    dispatch({ type: 'ADD_TO_HISTORY', payload: error });
  }, []);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  // Set recovery in progress
  const setRecoveryInProgress = useCallback((inProgress: boolean) => {
    dispatch({ type: 'SET_RECOVERY_IN_PROGRESS', payload: inProgress });
  }, []);

  // Update settings
  const updateSettings = useCallback((settings: Partial<ErrorState['errorSettings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  // Get error by type
  const getErrorByType = useCallback((type: AuthErrorType): AuthError | null => {
    const errorsArray = Array.from(state.activeErrors.values());
    return errorsArray.find(error => error.type === type) || null;
  }, [state.activeErrors]);

  // Get errors by severity
  const getErrorsBySeverity = useCallback((severity: ErrorSeverity): AuthError[] => {
    return Array.from(state.activeErrors.values()).filter(error => error.severity === severity);
  }, [state.activeErrors]);

  // Check if error exists
  const hasError = useCallback((type?: AuthErrorType): boolean => {
    if (type) {
      return state.activeErrors.has(`${type}-`);
    }
    return state.activeErrors.size > 0;
  }, [state.activeErrors]);

  // Get error count
  const getErrorCount = useCallback((): number => {
    return state.activeErrors.size;
  }, [state.activeErrors]);

  // Get errors that need recovery
  const getRecoveryErrors = useCallback((): AuthError[] => {
    return Array.from(state.activeErrors.values()).filter(
      error => error.recovery !== RecoveryStrategy.NONE && !error.retryable
    );
  }, [state.activeErrors]);

  const contextValue: ErrorContextType = {
    state,
    actions: {
      addError,
      removeError,
      setGlobalError,
      addToHistory,
      setLoading,
      setRecoveryInProgress,
      updateSettings,
      clearAllErrors,
      clearHistory,
      getErrorByType,
      getErrorsBySeverity,
      hasError,
      getErrorCount,
      getRecoveryErrors
    }
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
}

// Hook to use error context
export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}

// Hook for common error operations
export function useErrorHandler() {
  const { state, actions } = useErrorContext();

  // Handle error with automatic recovery
  const handleError = useCallback(async (error: AuthError): Promise<boolean> => {
    actions.setLoading(true);
    actions.setRecoveryInProgress(true);

    try {
      const errorId = actions.addError(error);

      // Here you would implement recovery logic
      // For now, we'll simulate recovery
      const recoverySuccess = await simulateRecovery(error);

      if (recoverySuccess) {
        actions.removeError(errorId);
        return true;
      } else {
        // Keep error in state for manual handling
        return false;
      }
    } catch (recoveryError) {
      console.error('Error recovery failed:', recoveryError);
      return false;
    } finally {
      actions.setLoading(false);
      actions.setRecoveryInProgress(false);
    }
  }, [actions]);

  // Show error notification
  const showErrorNotification = useCallback((error: AuthError) => {
    // This would integrate with your notification system
    console.error('Error notification:', error.userMessage);
    
    // In a real app, you might use a toast notification
    // toast.error(error.userMessage);
  }, []);

  // Dismiss error
  const dismissError = useCallback((errorId: string) => {
    actions.removeError(errorId);
  }, [actions]);

  // Dismiss all errors
  const dismissAllErrors = useCallback(() => {
    actions.clearAllErrors();
  }, [actions]);

  return {
    ...actions,
    ...state,
    handleError,
    showErrorNotification,
    dismissError,
    dismissAllErrors,
    hasActiveErrors: state.activeErrors.size > 0,
    hasGlobalError: state.globalError !== null,
    isRecovering: state.recoveryInProgress
  };
}

// Simulate error recovery (for demonstration)
async function simulateRecovery(error: AuthError): Promise<boolean> {
  // Simulate recovery delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate recovery success based on error type
  const recoverableTypes = [
    AuthErrorType.NETWORK_ERROR,
    AuthErrorType.SERVER_ERROR,
    AuthErrorType.TOKEN_EXPIRED,
    AuthErrorType.SESSION_EXPIRED
  ];

  if (recoverableTypes.includes(error.type)) {
    return Math.random() > 0.3; // 70% success rate for recoverable errors
  }

  return false; // Non-recoverable errors
}

// Higher-order component to provide error context
export function withErrorContext<P extends object>(
  Component: React.ComponentType<P>,
  errorContextProps?: Partial<ErrorProviderProps>
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorProvider {...errorContextProps}>
        <Component {...props} />
      </ErrorProvider>
    );
  };
}