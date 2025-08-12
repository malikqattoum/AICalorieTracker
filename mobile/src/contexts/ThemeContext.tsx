import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme colors
export type ThemeColors = {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  gray: string;
  lightGray: string;
};

// Define theme type
type Theme = 'light' | 'dark' | 'system';

// Define context type
type ThemeContextType = {
  theme: Theme;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
};

// Define light theme colors
const lightColors: ThemeColors = {
  primary: '#4F46E5', // Indigo
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1F2937',
  border: '#E5E7EB',
  notification: '#EF4444',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
};

// Define dark theme colors
const darkColors: ThemeColors = {
  primary: '#6366F1', // Lighter Indigo for dark mode
  background: '#111827',
  card: '#1F2937',
  text: '#F9FAFB',
  border: '#374151',
  notification: '#EF4444',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#60A5FA',
  gray: '#9CA3AF',
  lightGray: '#374151',
};

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  
  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeState(savedTheme as Theme);
        }
      } catch (error) {
        console.log('Failed to load theme:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Save theme when it changes
  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.log('Failed to save theme:', error);
    }
  };
  
  // Determine if dark mode is active
  const isDark = 
    theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  
  // Get current colors based on theme
  const colors = isDark ? darkColors : lightColors;
  
  // Context value
  const value = {
    theme,
    colors,
    setTheme,
    isDark,
  };
  
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};