import React from 'react';

// Accessibility configuration
export const accessibilityConfig = {
  // Screen reader announcements
  announcements: {
    loading: 'Loading, please wait...',
    error: 'An error occurred',
    success: 'Operation completed successfully',
    navigation: 'Navigating to {page}',
    formSubmitted: 'Form submitted successfully',
  },
  
  // Keyboard navigation
  keyboard: {
    // Key codes for common actions
    keys: {
      enter: 13,
      space: 32,
      escape: 27,
      tab: 9,
      arrowUp: 38,
      arrowDown: 40,
      arrowLeft: 37,
      arrowRight: 39,
    },
    
    // Navigation patterns
    patterns: {
      // Arrow key navigation for grids
      grid: {
        horizontal: 'arrowLeft,arrowRight',
        vertical: 'arrowUp,arrowDown',
        wrap: true,
      },
      
      // Tab navigation order
      tabOrder: [
        'main',
        'navigation',
        'search',
        'content',
        'footer',
      ],
    },
  },
  
  // Focus management
  focus: {
    // Focus trap configuration
    trap: {
      escapeExits: true,
      initialFocus: 'first',
      returnFocus: true,
    },
    
    // Focus styles
    styles: {
      outline: '2px solid #3b82f6',
      outlineOffset: '2px',
    },
  },
  
  // ARIA labels and descriptions
  aria: {
    // Common ARIA roles
    roles: {
      application: 'application',
      banner: 'banner',
      complementary: 'complementary',
      contentinfo: 'contentinfo',
      main: 'main',
      navigation: 'navigation',
      region: 'region',
      search: 'search',
    },
    
    // Common ARIA states
    states: {
      expanded: 'expanded',
      pressed: 'pressed',
      checked: 'checked',
      selected: 'selected',
      disabled: 'disabled',
      hidden: 'hidden',
      busy: 'busy',
    },
  },
};

// Accessibility hooks
export function useAnnouncement() {
  const [announcement, setAnnouncement] = React.useState<string>('');
  
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(message);
    
    // Clear after a delay for polite announcements
    if (priority === 'polite') {
      setTimeout(() => setAnnouncement(''), 1000);
    }
  };
  
  return { announcement, announce };
}

// Focus trap hook
export function useFocusTrap(isActive: boolean) {
  const containerRef = React.useRef<HTMLElement>(null);
  
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    // Set initial focus
    firstElement?.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Exit focus trap
        isActive = false;
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('keydown', handleEscape);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('keydown', handleEscape);
    };
  }, [isActive]);
  
  return containerRef;
}

// Keyboard navigation hook
export function useKeyboardNavigation(
  items: any[],
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
    onNavigate?: (index: number) => void;
  } = {}
) {
  const { loop = true, orientation = 'vertical', onNavigate } = options;
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    const keys = accessibilityConfig.keyboard.keys;
    const isVertical = orientation === 'vertical';
    
    let newIndex = selectedIndex;
    
    if (e.key === (isVertical ? 'ArrowDown' : 'ArrowRight')) {
      newIndex = selectedIndex + 1;
    } else if (e.key === (isVertical ? 'ArrowUp' : 'ArrowLeft')) {
      newIndex = selectedIndex - 1;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = items.length - 1;
    } else {
      return;
    }
    
    // Handle looping
    if (loop) {
      if (newIndex >= items.length) newIndex = 0;
      if (newIndex < 0) newIndex = items.length - 1;
    } else {
      // Clamp to bounds
      newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
    }
    
    setSelectedIndex(newIndex);
    onNavigate?.(newIndex);
  };
  
  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
  };
}

// Accessibility utilities
export const accessibilityUtils = {
  // Generate unique ID for accessibility
  generateId(prefix: string = 'a11y'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // Create accessible label
  createLabel(text: string, description?: string): string {
    return description ? `${text}, ${description}` : text;
  },
  
  // Create accessible description
  createDescription(text: string, details?: string): string {
    return details ? `${text}. ${details}` : text;
  },
  
  // Create accessible error message
  createErrorMessage(field: string, message: string): string {
    return `${field}: ${message}`;
  },
  
  // Check if element is in viewport
  isInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },
  
  // Scroll element into view with accessibility in mind
  scrollIntoView(element: Element, options: ScrollIntoViewOptions = {}): void {
    const defaultOptions: ScrollIntoViewOptions = {
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
      ...options,
    };
    
    element.scrollIntoView(defaultOptions);
    
    // Announce the action for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = 'Element scrolled into view';
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  },
  
  // Manage focus
  manageFocus(element: HTMLElement | null, options: {
    preventScroll?: boolean;
    focusVisible?: boolean;
  } = {}): void {
    if (!element) return;
    
    const { preventScroll = false, focusVisible = true } = options;
    
    if (focusVisible) {
      element.focus({ preventScroll });
    } else {
      // Use a more subtle focus for non-keyboard interactions
      element.focus({ preventScroll });
      element.style.outline = 'none';
    }
  },
  
  // Create accessible table data
  createAccessibleTableData(
    headers: string[],
    rows: string[][],
    caption?: string
  ): {
    headers: string[];
    rows: string[][];
    caption?: string;
  } {
    return {
      headers,
      rows,
      caption,
    };
  },
  
  // Create accessible form data
  createAccessibleFormData(
    fields: Array<{
      id: string;
      label: string;
      type: string;
      required?: boolean;
      description?: string;
      error?: string;
    }>
  ): Array<{
    id: string;
    label: string;
    type: string;
    required?: boolean;
    description?: string;
    error?: string;
    htmlFor: string;
    describedBy?: string;
    invalid: boolean;
  }> {
    return fields.map(field => ({
      ...field,
      htmlFor: field.id,
      describedBy: field.description ? `${field.id}-description` : undefined,
      invalid: !!field.error,
    }));
  },
};

// Accessibility components
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return React.createElement('span', {
    style: {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      borderWidth: 0,
    },
    children,
  });
}

export function SkipToContent({ href = '#main' }: { href?: string }) {
  return React.createElement('a', {
    href,
    className: 'skip-link',
    style: {
      position: 'absolute',
      top: '-40px',
      left: 0,
      backgroundColor: '#000',
      color: '#fff',
      padding: '8px',
      textDecoration: 'none',
      zIndex: 100,
    },
    onFocus: (e: React.FocusEvent<HTMLAnchorElement>) => {
      e.currentTarget.style.top = '0';
    },
    onBlur: (e: React.FocusEvent<HTMLAnchorElement>) => {
      e.currentTarget.style.top = '-40px';
    },
    children: 'Skip to main content',
  });
}

export function LiveRegion({ children }: { children: React.ReactNode }) {
  return React.createElement('div', {
    'aria-live': 'polite',
    'aria-atomic': 'true',
    style: {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      borderWidth: 0,
    },
    children,
  });
}

export default {
  accessibilityConfig,
  useAnnouncement,
  useFocusTrap,
  useKeyboardNavigation,
  accessibilityUtils,
  ScreenReaderOnly,
  SkipToContent,
  LiveRegion,
};