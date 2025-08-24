import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import accessibilityService from '../services/accessibilityService';

interface AccessibilityContextType {
  config: {
    reduceMotion: boolean;
    screenReaderEnabled: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'extra_large';
    highContrast: boolean;
    colorBlindMode: boolean;
  };
  fontSizeScale: number;
  accessibilityStyles: any;
  announce: (message: string) => void;
  setFontSize: (size: 'small' | 'medium' | 'large' | 'extra_large') => void;
  toggleHighContrast: () => void;
  toggleColorBlindMode: () => void;
  generateAccessibilityProps: (label?: string, hint?: string, role?: string, accessibilityState?: any) => any;
  generateInteractiveAccessibilityProps: (label: string, hint?: string, state?: any) => any;
  generateTextAccessibilityProps: (label?: string, hint?: string) => any;
  generateImageAccessibilityProps: (label?: string, hint?: string) => any;
  getAccessibilityLabels: () => any;
  getAccessibilityHints: () => any;
  getAccessibilityRoles: () => any;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children
}) => {
  const [config, setConfig] = useState(accessibilityService.getConfig());
  const [fontSizeScale, setFontSizeScale] = useState(accessibilityService.getFontSizeScale());
  const [accessibilityStyles, setAccessibilityStyles] = useState(accessibilityService.getAccessibilityStyles());

  // Update state when accessibility config changes
  const updateConfig = useCallback(() => {
    const newConfig = accessibilityService.getConfig();
    setConfig(newConfig);
    setFontSizeScale(accessibilityService.getFontSizeScale());
    setAccessibilityStyles(accessibilityService.getAccessibilityStyles());
  }, []);

  // Listen for accessibility changes
  useEffect(() => {
    const unsubscribe = accessibilityService.addListener(updateConfig);
    return () => unsubscribe();
  }, [updateConfig]);

  // Announce message for screen readers
  const announce = useCallback((message: string) => {
    accessibilityService.announce(message);
  }, []);

  // Set font size
  const setFontSize = useCallback((size: 'small' | 'medium' | 'large' | 'extra_large') => {
    accessibilityService.setFontSize(size);
  }, []);

  // Toggle high contrast mode
  const toggleHighContrast = useCallback(() => {
    accessibilityService.toggleHighContrast();
  }, []);

  // Toggle color blind mode
  const toggleColorBlindMode = useCallback(() => {
    accessibilityService.toggleColorBlindMode();
  }, []);

  // Generate accessibility props
  const generateAccessibilityProps = useCallback((
    label?: string,
    hint?: string,
    role?: string,
    accessibilityState?: any
  ) => {
    return accessibilityService.generateAccessibilityProps(label, hint, role, accessibilityState);
  }, []);

  // Generate interactive accessibility props
  const generateInteractiveAccessibilityProps = useCallback((
    label: string,
    hint?: string,
    state?: any
  ) => {
    return accessibilityService.generateInteractiveAccessibilityProps(label, hint, state);
  }, []);

  // Generate text accessibility props
  const generateTextAccessibilityProps = useCallback((
    label?: string,
    hint?: string
  ) => {
    return accessibilityService.generateTextAccessibilityProps(label, hint);
  }, []);

  // Generate image accessibility props
  const generateImageAccessibilityProps = useCallback((
    label?: string,
    hint?: string
  ) => {
    return accessibilityService.generateImageAccessibilityProps(label, hint);
  }, []);

  // Get accessibility labels
  const getAccessibilityLabels = useCallback(() => {
    return accessibilityService.getAccessibilityLabels();
  }, []);

  // Get accessibility hints
  const getAccessibilityHints = useCallback(() => {
    return accessibilityService.getAccessibilityHints();
  }, []);

  // Get accessibility roles
  const getAccessibilityRoles = useCallback(() => {
    return accessibilityService.getAccessibilityRoles();
  }, []);

  const value: AccessibilityContextType = {
    config,
    fontSizeScale,
    accessibilityStyles,
    announce,
    setFontSize,
    toggleHighContrast,
    toggleColorBlindMode,
    generateAccessibilityProps,
    generateInteractiveAccessibilityProps,
    generateTextAccessibilityProps,
    generateImageAccessibilityProps,
    getAccessibilityLabels,
    getAccessibilityHints,
    getAccessibilityRoles
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityContext;