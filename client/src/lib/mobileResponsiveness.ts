import React, { useState, useEffect, useCallback } from 'react';

// Mobile responsiveness configuration
export const mobileConfig = {
  // Breakpoints
  breakpoints: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    '2xl': 1400,
  },
  
  // Device types
  deviceTypes: {
    mobile: 'mobile',
    tablet: 'tablet',
    desktop: 'desktop',
  },
  
  // Touch gestures
  gestures: {
    tap: {
      threshold: 10,
      time: 200,
    },
    swipe: {
      threshold: 50,
      velocity: 0.5,
    },
    pinch: {
      threshold: 0.1,
    },
  },
  
  // Mobile-specific UI patterns
  patterns: {
    bottomNavigation: true,
    pullToRefresh: true,
    swipeToDelete: true,
    longPress: true,
  },
};

// Responsive hook
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  const [deviceType, setDeviceType] = useState<keyof typeof mobileConfig.deviceTypes>('desktop');
  
  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setWindowSize({ width, height });
    
    // Determine device type
    if (width < mobileConfig.breakpoints.sm) {
      setDeviceType('mobile');
    } else if (width < mobileConfig.breakpoints.lg) {
      setDeviceType('tablet');
    } else {
      setDeviceType('desktop');
    }
  }, []);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);
  
  // Check if specific breakpoint is active
  const isBreakpoint = (breakpoint: keyof typeof mobileConfig.breakpoints) => {
    return windowSize.width >= mobileConfig.breakpoints[breakpoint];
  };
  
  // Check if specific breakpoint is active and below
  const isUpToBreakpoint = (breakpoint: keyof typeof mobileConfig.breakpoints) => {
    return windowSize.width < mobileConfig.breakpoints[breakpoint];
  };
  
  // Check if between two breakpoints
  const isBetweenBreakpoints = (
    min: keyof typeof mobileConfig.breakpoints,
    max: keyof typeof mobileConfig.breakpoints
  ) => {
    return (
      windowSize.width >= mobileConfig.breakpoints[min] &&
      windowSize.width < mobileConfig.breakpoints[max]
    );
  };
  
  return {
    windowSize,
    deviceType,
    isBreakpoint,
    isUpToBreakpoint,
    isBetweenBreakpoints,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
  };
}

// Touch gesture hook
export function useTouchGesture(elementRef: React.RefObject<HTMLElement>) {
  const [touchState, setTouchState] = useState({
    isTouching: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
  });
  
  const callbacks = {
    onTap: () => {},
    onSwipeLeft: () => {},
    onSwipeRight: () => {},
    onSwipeUp: () => {},
    onSwipeDown: () => {},
    onPinch: () => {},
    onLongPress: () => {},
  };
  
  const setCallbacks = (newCallbacks: typeof callbacks) => {
    Object.assign(callbacks, newCallbacks);
  };
  
  const handleTouchStart = (e: TouchEvent) => {
    if (!elementRef.current) return;
    
    const touch = e.touches[0];
    setTouchState({
      isTouching: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
    });
    
    // Set up long press timer
    setTimeout(() => {
      if (touchState.isTouching) {
        callbacks.onLongPress();
      }
    }, 500);
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (!touchState.isTouching || !elementRef.current) return;
    
    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }));
  };
  
  const handleTouchEnd = () => {
    if (!touchState.isTouching) return;
    
    const deltaX = touchState.currentX - touchState.startX;
    const deltaY = touchState.currentY - touchState.startY;
    const deltaTime = Date.now() - touchState.startTime;
    
    // Check for tap
    if (Math.abs(deltaX) < mobileConfig.gestures.tap.threshold && 
        Math.abs(deltaY) < mobileConfig.gestures.tap.threshold &&
        deltaTime < mobileConfig.gestures.tap.time) {
      callbacks.onTap();
    }
    
    // Check for swipe
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
    
    if (velocity > mobileConfig.gestures.swipe.velocity) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          callbacks.onSwipeRight();
        } else {
          callbacks.onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          callbacks.onSwipeDown();
        } else {
          callbacks.onSwipeUp();
        }
      }
    }
    
    setTouchState({
      isTouching: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startTime: 0,
    });
  };
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchState.isTouching]);
  
  return { touchState, setCallbacks };
}

// Mobile navigation hook
export function useMobileNavigation() {
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState<string[]>(['home']);
  
  const navigate = (route: string) => {
    setHistory(prev => [...prev, route]);
    setActiveTab(0);
  };
  
  const goBack = () => {
    if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1));
      setActiveTab(0);
    }
  };
  
  const resetToHome = () => {
    setHistory(['home']);
    setActiveTab(0);
  };
  
  return {
    activeTab,
    setActiveTab,
    history,
    navigate,
    goBack,
    resetToHome,
    currentRoute: history[history.length - 1],
  };
}

// Pull-to-refresh hook
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  threshold = 100
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [canRefresh, setCanRefresh] = useState(false);
  
  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY !== 0) return;
    
    const startY = e.touches[0].clientY;
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentY = moveEvent.touches[0].clientY;
      const distance = currentY - startY;
      
      if (distance > 0) {
        setPullDistance(Math.min(distance, threshold * 2));
        setCanRefresh(distance >= threshold);
      }
    };
    
    const handleTouchEnd = async () => {
      if (canRefresh) {
        setIsRefreshing(true);
        await onRefresh();
      }
      setPullDistance(0);
      setCanRefresh(false);
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
  };
  
  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart);
    return () => document.removeEventListener('touchstart', handleTouchStart);
  }, [canRefresh]);
  
  return {
    isRefreshing,
    pullDistance,
    canRefresh,
    pullPercentage: (pullDistance / threshold) * 100,
  };
}

// Mobile utilities
export const mobileUtils = {
  // Check if device is mobile
  isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < mobileConfig.breakpoints.md;
  },
  
  // Check if device is iOS
  isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },
  
  // Check if device is Android
  isAndroid(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android/.test(navigator.userAgent);
  },
  
  // Get device pixel ratio
  getPixelRatio(): number {
    if (typeof window === 'undefined') return 1;
    return window.devicePixelRatio || 1;
  },
  
  // Get viewport dimensions
  getViewport(): { width: number; height: number } {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },
  
  // Get orientation
  getOrientation(): 'portrait' | 'landscape' {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  },
  
  // Handle viewport meta tag
  setViewportMeta(scale = 1, userScalable = false): void {
    if (typeof document === 'undefined') return;
    
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', `width=device-width, initial-scale=${scale}, user-scalable=${userScalable ? 'yes' : 'no'}`);
    }
  },
  
  // Prevent zoom on double tap
  preventDoubleTapZoom(): void {
    if (typeof window === 'undefined') return;
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  },
  
  // Add safe area insets for iOS
  addSafeAreaInsets(): void {
    if (typeof window === 'undefined' || !this.isIOS()) return;
    
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      const content = viewport.getAttribute('content') || '';
      viewport.setAttribute('content', `${content}, viewport-fit=cover`);
    }
  },
  
  // Handle back button
  handleBackButton(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      callback();
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  },
  
  // Create bottom navigation
  createBottomNavigation(items: Array<{
    id: string;
    label: string;
    icon: string;
    active?: boolean;
    onPress?: () => void;
  }>): React.ReactNode {
    return React.createElement('div', {
      className: 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200',
      children: items.map((item) => 
        React.createElement('button', {
          key: item.id,
          className: `flex flex-col items-center justify-center py-2 px-4 ${
            item.active ? 'text-blue-600' : 'text-gray-500'
          }`,
          onPress: item.onPress,
          children: [
            React.createElement('span', {
              key: 'icon',
              className: 'text-xl',
              children: item.icon,
            }),
            React.createElement('span', {
              key: 'label',
              className: 'text-xs mt-1',
              children: item.label,
            }),
          ],
        })
      ),
    });
  },
  
  // Create swipeable item
  createSwipeableItem(
    children: React.ReactNode,
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void
  ): React.ReactNode {
    return React.createElement('div', {
      className: 'relative overflow-hidden',
      children: [
        React.createElement('div', {
          className: 'absolute inset-y-0 left-0 w-20 bg-red-500 transform -translate-x-full transition-transform duration-200 ease-out',
          style: { display: onSwipeRight ? 'block' : 'none' },
          children: React.createElement('span', {
            className: 'flex items-center justify-center h-full text-white',
            children: 'Delete',
          }),
        }),
        React.createElement('div', {
          className: 'absolute inset-y-0 right-0 w-20 bg-green-500 transform translate-x-full transition-transform duration-200 ease-out',
          style: { display: onSwipeLeft ? 'block' : 'none' },
          children: React.createElement('span', {
            className: 'flex items-center justify-center h-full text-white',
            children: 'Archive',
          }),
        }),
        React.createElement('div', {
          className: 'relative z-10',
          children,
        }),
      ],
    });
  },
};

export default {
  mobileConfig,
  useResponsive,
  useTouchGesture,
  useMobileNavigation,
  usePullToRefresh,
  mobileUtils,
};