// Error boundary for authentication components
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../../lib/config';
import { AuthError, AuthErrorType, createAuthError, handleAuthError } from '../../lib/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AuthError, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  authError: AuthError | null;
  errorInfo: ErrorInfo | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      authError: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Convert JavaScript error to AuthError
    const authError = createAuthError(
      AuthErrorType.UNKNOWN_ERROR,
      error.message,
      { details: error.stack }
    );

    return {
      hasError: true,
      authError,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const authError = createAuthError(
      AuthErrorType.UNKNOWN_ERROR,
      error.message,
      { details: { error, errorInfo } }
    );

    this.setState({
      hasError: true,
      authError,
      errorInfo
    });

    // Log the error
    logError('AuthErrorBoundary caught an error', { error, errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(authError, errorInfo);
    }

    // Handle the error with recovery mechanisms
    this.handleError(authError, errorInfo);
  }

  private async handleError(authError: AuthError, errorInfo: ErrorInfo): Promise<void> {
    try {
      const result = await handleAuthError(authError, { errorInfo });
      
      if (result === null) {
        // Error was successfully handled, reset state
        this.setState({
          hasError: false,
          authError: null,
          errorInfo: null
        });
      }
    } catch (handlingError) {
      logError('Failed to handle auth error in boundary', handlingError);
    }
  }

  private renderErrorContent(): ReactNode {
    const { authError } = this.state;
    const { fallback } = this.props;

    if (fallback) {
      return fallback;
    }

    if (!authError) {
      return null;
    }

    // Default error UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Error
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {authError.userMessage}
            </p>
          </div>

          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              {authError.severity === 'CRITICAL' && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-red-800">
                    Critical Error
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    Please contact support immediately.
                  </p>
                </div>
              )}

              {authError.recovery === 'RELOGIN' && (
                <div className="text-center">
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {authError.recovery === 'CONTACT_SUPPORT' && (
                <div className="text-center">
                  <button
                    onClick={this.handleContactSupport}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Contact Support
                  </button>
                </div>
              )}

              {authError.retryable && authError.retryCount! < 3 && (
                <div className="text-sm text-gray-500">
                  Retrying... (Attempt {authError.retryCount! + 1}/3)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  private handleRetry = (): void => {
    // Reset error state and trigger a retry
    this.setState({
      hasError: false,
      authError: null,
      errorInfo: null
    });
    
    // You might want to trigger a specific retry action here
    window.location.reload();
  };

  private handleContactSupport = (): void => {
    // Open support contact modal or redirect to support page
    // This is a placeholder implementation
    const supportEmail = 'support@aicalorietracker.com';
    const subject = encodeURIComponent('Authentication Error Support Request');
    const body = encodeURIComponent(`I encountered an authentication error:\n\nType: ${this.state.authError?.type}\nMessage: ${this.state.authError?.message}\n\nPlease help me resolve this issue.`);
    
    window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  render(): ReactNode {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return this.renderErrorContent();
    }

    return children;
  }
}

// Higher-order component to wrap components with AuthErrorBoundary
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <AuthErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </AuthErrorBoundary>
    );
  };
}

// Hook for handling errors within components
export function useAuthErrorHandler() {
  const handleError = React.useCallback(async (error: Error, context?: any) => {
    const authError = createAuthError(
      AuthErrorType.UNKNOWN_ERROR,
      error.message,
      { details: context }
    );
    
    return await handleAuthError(authError, context);
  }, []);

  const retryOperation = React.useCallback(async (operation: () => Promise<any>, maxRetries: number = 3) => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }, []);

  return {
    handleError,
    retryOperation
  };
}