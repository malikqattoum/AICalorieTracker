import React, { Suspense, ComponentType, LazyExoticComponent, ReactNode } from 'react';

// Simple loading spinner component
export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return React.createElement('div', {
    className: `flex items-center justify-center ${sizeClasses[size]}`,
    children: React.createElement('div', {
      className: 'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
    }),
  });
};

// Simple error boundary component
export class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || React.createElement('div', {
        className: 'p-4 border border-red-200 rounded-md bg-red-50',
        children: [
          React.createElement('h3', {
            key: 'title',
            className: 'text-red-800 font-medium',
            children: 'Something went wrong'
          }),
          React.createElement('p', {
            key: 'message',
            className: 'text-red-600 text-sm mt-1',
            children: this.state.error?.message || 'An unexpected error occurred'
          })
        ]
      });
    }

    return this.props.children;
  }
}

// Lazy loading wrapper with error boundary and loading state
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode,
  errorFallback?: ReactNode
): LazyExoticComponent<T> {
  const LazyComponent = React.lazy(importFn);
  
  const WrappedComponent = (props: Parameters<T>[0]) => React.createElement(
    ErrorBoundary,
    { fallback: errorFallback },
    React.createElement(
      Suspense,
      { fallback: fallback || React.createElement(LoadingSpinner) },
      React.createElement(LazyComponent, props)
    )
  );
  
  return WrappedComponent as LazyExoticComponent<T>;
}

// Route-based lazy loading
export function createLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return createLazyComponent(
    importFn,
    React.createElement('div', {
      className: 'flex items-center justify-center min-h-screen',
      children: React.createElement(LoadingSpinner, { size: 'lg' })
    }),
    React.createElement('div', {
      className: 'flex items-center justify-center min-h-screen',
      children: React.createElement('div', {
        className: 'text-center',
        children: [
          React.createElement('h2', {
            key: 'title',
            className: 'text-xl font-semibold text-red-600 mb-2',
            children: 'Failed to load component'
          }),
          React.createElement('p', {
            key: 'message',
            className: 'text-gray-600',
            children: 'Please refresh the page or try again later.'
          })
        ]
      })
    })
  );
}

// Preload utility for critical components
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): () => Promise<void> {
  return async () => {
    try {
      await importFn();
    } catch (error) {
      console.warn('Failed to preload component:', error);
    }
  };
}

// Intersection Observer for lazy loading components
export function useIntersectionObserver(
  threshold: number = 0.1,
  rootMargin: string = '0px'
) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}

// Lazy loading component with intersection observer
export function LazyLoadComponent<T extends ComponentType<any>>({
  importFn,
  fallback,
  errorFallback,
  threshold = 0.1,
  rootMargin = '0px',
  ...props
}: {
  importFn: () => Promise<{ default: T }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  [key: string]: any;
}) {
  const { ref, isVisible } = useIntersectionObserver(threshold, rootMargin);
  
  if (!isVisible) {
    return React.createElement('div', { ref, children: fallback || React.createElement(LoadingSpinner) });
  }

  return React.createElement('div', { ref },
    React.createElement(
      ErrorBoundary,
      { fallback: errorFallback },
      React.createElement(
        Suspense,
        { fallback: fallback || React.createElement(LoadingSpinner) },
        React.createElement(React.lazy(importFn), props)
      )
    )
  );
}

// Predefined lazy-loaded components for the application
export const LazyComponents = {
  // Dashboard components
  Dashboard: createLazyRoute(() => import('@/components/dashboard/Dashboard')),
  
  // Admin components
  AdminPanel: createLazyRoute(() => import('@/pages/admin-panel')),
  
  // Auth components
  AuthPage: createLazyRoute(() => import('@/pages/auth-page')),
  
  // Meal components
  MealCalendar: createLazyRoute(() => import('@/pages/meal-calendar-page')),
  MealPlan: createLazyRoute(() => import('@/pages/meal-plan-page')),
  RecipeImport: createLazyRoute(() => import('@/pages/recipe-import-page')),
  
  // Settings components
  Settings: createLazyRoute(() => import('@/pages/settings-page')),
  
  // Other pages
  Contact: createLazyRoute(() => import('@/pages/contact-page')),
  History: createLazyRoute(() => import('@/pages/history-page')),
  Home: createLazyRoute(() => import('@/pages/home-page')),
  Landing: createLazyRoute(() => import('@/pages/landing-page')),
  NotFound: createLazyRoute(() => import('@/pages/not-found')),
  Onboarding: createLazyRoute(() => import('@/pages/onboarding-page')),
  Pricing: createLazyRoute(() => import('@/pages/pricing-page')),
  Privacy: createLazyRoute(() => import('@/pages/privacy-page')),
  Terms: createLazyRoute(() => import('@/pages/terms-page')),
  TryIt: createLazyRoute(() => import('@/pages/try-it-page')),
};

export default {
  LoadingSpinner,
  ErrorBoundary,
  createLazyComponent,
  createLazyRoute,
  preloadComponent,
  useIntersectionObserver,
  LazyLoadComponent,
  LazyComponents,
};