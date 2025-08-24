import React, { Suspense, ComponentType, LazyExoticComponent, RefObject } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ErrorBoundary from './ErrorBoundary';

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  className?: string;
  timeout?: number;
}

/**
 * Lazy loading wrapper with fallback UI
 */
export function LazyLoad({ 
  children, 
  fallback, 
  errorFallback, 
  className,
  timeout = 3000 
}: LazyLoadProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [isLoading, timeout]);

  if (hasError) {
    return errorFallback || (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Failed to load component</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return fallback || (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return <>{children}</>;
}

interface LazyComponentProps {
  component: LazyExoticComponent<ComponentType<any>>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  className?: string;
  timeout?: number;
  [key: string]: any; // Pass through props
}

/**
 * Lazy load a component with error handling
 */
export function LazyComponent({ 
  component: Component, 
  fallback, 
  errorFallback, 
  className,
  timeout,
  ...props 
}: LazyComponentProps) {
  return (
    <Suspense 
      fallback={
        <LazyLoad 
          fallback={fallback} 
          timeout={timeout}
          className={className}
        >
          <div />
        </LazyLoad>
      }
    >
      <ErrorBoundary fallback={errorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    </Suspense>
  );
}

/**
 * Higher-order component for lazy loading
 */
export function withLazyLoad<T extends ComponentType<any>>(
  WrappedComponent: LazyExoticComponent<T>,
  options?: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    timeout?: number;
  }
) {
  return function LazyWrappedComponent(props: any) {
    return (
      <LazyComponent
        component={WrappedComponent}
        {...options}
        {...props}
      />
    );
  };
}

/**
 * Route-based lazy loading with preloading
 */
export function createLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    preload?: boolean;
  }
) {
  const LazyComponent = React.lazy(importFn);

  const LazyRoute: React.FC<React.ComponentProps<T>> = (props) => {
    const [isPreloaded, setIsPreloaded] = React.useState(false);

    React.useEffect(() => {
      if (options?.preload && !isPreloaded) {
        importFn().then(() => setIsPreloaded(true));
      }
    }, [options?.preload, isPreloaded]);

    return (
      <LazyComponent {...props} />
    );
  };

  return LazyRoute;
}

/**
 * Intersection Observer for lazy loading components
 */
interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (options.triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!options.triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        root: options.root,
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.1,
      }
    );

    observer.observe(element);

    return () => observer.unobserve(element);
  }, [options]);

  return { ref, isVisible };
}

/**
 * Lazy load images with intersection observer
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholder?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({ 
  src, 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZjdmNyIvPgogIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZmZmIi8+CiAgPHRleHQgeD0iMCIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuekuuS+i+WbvueJhzwvdGV4dD4KPC9zdmc+',
  fallback,
  onLoad,
  onError,
  className,
  ...props 
}: LazyImageProps) {
  const { ref, isVisible } = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [imageSrc, setImageSrc] = React.useState(placeholder);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (isVisible && !hasError && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        onLoad?.();
      };
      img.onerror = () => {
        setHasError(true);
        setImageSrc(fallback || placeholder);
        onError?.();
      };
      img.src = src;
    }
  }, [isVisible, src, placeholder, fallback, hasError, onLoad, onError]);

  return (
    <img
      ref={ref}
      src={imageSrc}
      alt={props.alt || ''}
      className={cn("transition-opacity duration-300", className)}
      style={{ opacity: isVisible ? 1 : 0 }}
      {...props}
    />
  );
}

export default LazyLoad;