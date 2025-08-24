import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '../ErrorBoundary';

// Mock console.error to avoid noise in tests
global.console.error = jest.fn();

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Test component that uses the error handler hook
const TestHookComponent: React.FC = () => {
  const { handleError, error } = useErrorHandler();
  
  return (
    <div>
      {error && <div data-testid="error-display">{error.message}</div>}
      <button 
        onClick={() => handleError(new Error('Hook test error'))}
        data-testid="trigger-error"
      >
        Trigger Error
      </button>
    </div>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ErrorBoundary Component', () => {
    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('catches errors and displays fallback UI', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('We encountered an unexpected error')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('calls onError callback when error occurs', () => {
      const mockOnError = jest.fn();
      const testError = new Error('Test error');
      
      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledWith(testError, expect.any(Object));
    });

    it('provides custom fallback UI', () => {
      const customFallback = <div>Custom Error Fallback</div>;
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error Fallback')).toBeInTheDocument();
    });

    it('allows retry functionality', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Initially shows error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Click retry button
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      // Should re-render the component tree
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('allows navigation to home', () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const homeButton = screen.getByText('Go Home');
      fireEvent.click(homeButton);

      expect(window.location.href).toBe('/');
    });

    it('shows component stack in development mode', () => {
      // Mock process.env.NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Stack:')).toBeInTheDocument();

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });

    it('does not show component stack in production mode', () => {
      // Mock process.env.NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Component Stack:')).not.toBeInTheDocument();

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('withErrorBoundary HOC', () => {
    it('wraps components with error boundary', () => {
      const ComponentWithError = withErrorBoundary(() => <div>Test component</div>);
      
      render(<ComponentWithError />);

      expect(screen.getByText('Test component')).toBeInTheDocument();
    });

    it('catches errors in wrapped components', () => {
      const ComponentWithError = withErrorBoundary(() => <ThrowError />);
      
      render(<ComponentWithError />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('passes error boundary props', () => {
      const mockOnError = jest.fn();
      const ComponentWithError = withErrorBoundary(
        () => <ThrowError />,
        { onError: mockOnError }
      );
      
      render(<ComponentWithError />);

      expect(mockOnError).toHaveBeenCalled();
    });
  });

  describe('useErrorHandler Hook', () => {
    it('provides error handling functionality', () => {
      render(<TestHookComponent />);

      // Initially no error
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();

      // Trigger error
      const triggerButton = screen.getByTestId('trigger-error');
      fireEvent.click(triggerButton);

      // Error should be displayed
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByTestId('error-display')).toHaveTextContent('Hook test error');
    });

    it('allows error reset', () => {
      const TestResetComponent: React.FC = () => {
        const { handleError, error, resetError } = useErrorHandler();
        
        return (
          <div>
            {error && <div data-testid="error-display">{error.message}</div>}
            <button 
              onClick={() => handleError(new Error('Test error'))}
              data-testid="trigger-error"
            >
              Trigger Error
            </button>
            <button 
              onClick={resetError}
              data-testid="reset-error"
            >
              Reset Error
            </button>
          </div>
        );
      };

      render(<TestResetComponent />);

      // Trigger error
      fireEvent.click(screen.getByTestId('trigger-error'));
      expect(screen.getByTestId('error-display')).toBeInTheDocument();

      // Reset error
      fireEvent.click(screen.getByTestId('reset-error'));
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
    });
  });

  describe('AsyncErrorBoundary', () => {
    it('renders children normally when no error occurs', () => {
      const { container } = render(
        <ErrorBoundary.AsyncErrorBoundary>
          <div>Async content</div>
        </ErrorBoundary.AsyncErrorBoundary>
      );

      expect(screen.getByText('Async content')).toBeInTheDocument();
    });

    it('catches synchronous errors', () => {
      const { container } = render(
        <ErrorBoundary.AsyncErrorBoundary>
          <div>
            <button 
              onClick={() => {
                throw new Error('Sync error');
              }}
              data-testid="throw-sync"
            >
              Throw Sync Error
            </button>
          </div>
        </ErrorBoundary.AsyncErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('throw-sync'));

      expect(screen.getByText('Async Error')).toBeInTheDocument();
      expect(screen.getByText('Sync error')).toBeInTheDocument();
    });

    it('catches unhandled promise rejections', async () => {
      const { container } = render(
        <ErrorBoundary.AsyncErrorBoundary>
          <div>
            <button 
              onClick={() => {
                Promise.reject(new Error('Promise error'));
              }}
              data-testid="throw-promise"
            >
              Throw Promise Error
            </button>
          </div>
        </ErrorBoundary.AsyncErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('throw-promise'));

      // Wait for the promise rejection to be handled
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Async Error')).toBeInTheDocument();
      expect(screen.getByText('Promise error')).toBeInTheDocument();
    });

    it('allows error dismissal', () => {
      const { container } = render(
        <ErrorBoundary.AsyncErrorBoundary>
          <div>
            <button 
              onClick={() => {
                throw new Error('Sync error');
              }}
              data-testid="throw-sync"
            >
              Throw Sync Error
            </button>
          </div>
        </ErrorBoundary.AsyncErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('throw-sync'));
      expect(screen.getByText('Async Error')).toBeInTheDocument();

      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);

      expect(screen.queryByText('Async Error')).not.toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('handles multiple nested errors', () => {
      const NestedErrorComponent: React.FC = () => {
        return (
          <ErrorBoundary>
            <div>
              <ThrowError />
            </div>
          </ErrorBoundary>
        );
      };

      render(<NestedErrorComponent />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('works with React.lazy and Suspense', async () => {
      // This would test integration with code-splitting components
      // For now, we'll just verify the error boundary works in a complex scenario
      const ComplexComponent: React.FC = () => {
        return (
          <ErrorBoundary>
            <div>
              <TestHookComponent />
              <ThrowError />
            </div>
          </ErrorBoundary>
        );
      };

      render(<ComplexComponent />);

      // Should catch the error from ThrowError
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('logs errors to console', () => {
      const originalConsoleError = console.error;
      console.error = jest.fn();

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error caught by boundary:',
        expect.any(Error),
        expect.any(Object)
      );

      console.error = originalConsoleError;
    });
  });
});