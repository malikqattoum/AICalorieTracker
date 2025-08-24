import { render as rtlRender, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the contexts
const mockThemeContext = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    card: '#F2F2F7',
    text: '#000000',
    gray: '#8E8E93',
    lightGray: '#E5E5EA',
    border: '#C6C6C8',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#5AC8FA',
  },
  isDarkMode: false,
  toggleTheme: jest.fn(),
};

// Mock user data
export const mockUser = {
  id: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  isPremium: false,
  createdAt: '2023-01-01T00:00:00Z',
  lastLogin: '2023-12-01T10:00:00Z',
  preferences: {
    language: 'en',
    theme: 'light',
    notifications: {
      mealReminders: true,
      weeklyReports: true,
      tips: true,
    },
  },
};

const mockAuthContext = {
  user: mockUser,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateProfile: jest.fn(),
  isAuthenticated: true,
};

// Custom render function with basic providers
export const render = (
  ui: React.ReactElement,
  options?: RenderOptions & {
    queryClient?: QueryClient;
  }
) => {
  const queryClient = options?.queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return rtlRender(ui, { ...options });
};

// Re-export everything
export * from '@testing-library/react-native';

// Custom matchers for React Native
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeVisible(): R;
      toHaveStyle(style: any): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
    }
  }
}

expect.extend({
  toBeVisible(received: any) {
    return {
      pass: received.props.style?.opacity === 1 && received.props.style?.display !== 'none',
      message: () => `Expected element to be visible, but it's not`,
    };
  },
  
  toHaveStyle(received: any, style: any) {
    const receivedStyle = received.props.style || {};
    const hasStyle = Object.entries(style).every(([key, value]) => 
      receivedStyle[key] === value
    );
    
    return {
      pass: hasStyle,
      message: () => `Expected element to have style ${JSON.stringify(style)}, but got ${JSON.stringify(receivedStyle)}`,
    };
  },
  
  toBeDisabled(received: any) {
    return {
      pass: received.props.disabled || received.props.editable === false,
      message: () => `Expected element to be disabled, but it's not`,
    };
  },
  
  toBeEnabled(received: any) {
    return {
      pass: !received.props.disabled && received.props.editable !== false,
      message: () => `Expected element to be enabled, but it's not`,
    };
  },
});

// Mock data generators for testing
export const mockMeal = {
  id: 'meal-123',
  foodName: 'Grilled Chicken Salad',
  calories: 350,
  protein: 35,
  carbs: 15,
  fat: 18,
  fiber: 8,
  sugar: 5,
  sodium: 600,
  servingSize: '1 bowl',
  imageUrl: 'https://example.com/chicken-salad.jpg',
  mealType: 'lunch' as const,
  createdAt: '2023-12-01T12:30:00Z',
  isFavorite: true,
  ingredients: ['Chicken breast', 'Lettuce', 'Tomatoes', 'Cucumber', 'Olive oil'],
  aiInsights: 'High in protein, good for muscle recovery',
};

export const mockMealPlan = {
  id: 'plan-123',
  name: 'Weekly Healthy Plan',
  description: 'Balanced nutrition for the week',
  startDate: '2023-12-01',
  endDate: '2023-12-07',
  totalCalories: 14000,
  averageDailyCalories: 2000,
  days: [
    {
      date: '2023-12-01',
      meals: [
        {
          type: 'breakfast',
          name: 'Oatmeal with Berries',
          calories: 400,
          protein: 15,
          carbs: 60,
          fat: 12,
        },
        {
          type: 'lunch',
          name: 'Grilled Chicken Salad',
          calories: 350,
          protein: 35,
          carbs: 15,
          fat: 18,
        },
        {
          type: 'dinner',
          name: 'Salmon with Vegetables',
          calories: 450,
          protein: 40,
          carbs: 20,
          fat: 25,
        },
        {
          type: 'snack',
          name: 'Apple with Almonds',
          calories: 200,
          protein: 5,
          carbs: 25,
          fat: 10,
        },
      ],
    },
  ],
};

export const mockAnalytics = {
  dailyStats: [
    {
      date: '2023-12-01',
      calories: 1850,
      protein: 95,
      carbs: 120,
      fat: 75,
      fiber: 25,
      water: 2.5,
      steps: 8500,
      weight: 70.5,
    },
  ],
  weeklyStats: {
    averageCalories: 1950,
    averageProtein: 98,
    averageCarbs: 125,
    averageFat: 72,
    totalSteps: 59500,
    averageWeight: 70.3,
    weightChange: -0.2,
  },
  monthlyStats: {
    averageCalories: 1920,
    averageProtein: 96,
    averageCarbs: 122,
    averageFat: 70,
    totalSteps: 238000,
    averageWeight: 70.5,
    weightChange: -1.0,
  },
};

export const mockAchievements = [
  {
    id: 'achievement-1',
    title: 'First Steps',
    description: 'Log your first meal',
    icon: 'footsteps',
    earned: true,
    earnedAt: '2023-12-01T10:00:00Z',
  },
  {
    id: 'achievement-2',
    title: 'Week Warrior',
    description: 'Log meals for 7 consecutive days',
    icon: 'calendar',
    earned: true,
    earnedAt: '2023-12-07T10:00:00Z',
  },
  {
    id: 'achievement-3',
    title: 'Protein Power',
    description: 'Reach protein goal for 5 days',
    icon: 'fitness',
    earned: false,
  },
];

// Mock API responses
export const mockApiResponse = <T>(data: T, status: number = 200) => ({
  data,
  status,
  message: 'Success',
});

export const mockApiError = (message: string, status: number = 400) => ({
  message,
  status,
  code: 'API_ERROR',
});

// Async utilities for testing
export const waitForAsync = (delay: number = 0) => 
  new Promise(resolve => setTimeout(resolve, delay));

export const waitForElement = async (
  callback: () => Promise<any>,
  maxAttempts: number = 10,
  interval: number = 100
) => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const result = await callback();
      if (result) return result;
    } catch (error) {
      // Ignore errors and continue waiting
    }
    
    await waitForAsync(interval);
    attempts++;
  }
  
  throw new Error(`Element not found after ${maxAttempts} attempts`);
};

// Mock navigation utilities
export const mockNavigate = jest.fn();
export const mockGoBack = jest.fn();

// Mock TanStack Query responses
export const mockQueryResponse = <T>(data: T, isLoading: boolean = false, error: any = null) => ({
  data,
  isLoading,
  error,
  refetch: jest.fn(),
  isSuccess: !isLoading && !error,
  isError: !!error,
});

export const mockMutationResponse = <T>(
  mutate: jest.Mock,
  isPending: boolean = false,
  error: any = null,
  data: T | null = null
) => ({
  mutate,
  isPending,
  error,
  data,
  isSuccess: !isPending && !error && !!data,
  isError: !!error,
});

// Performance testing utilities
export const measurePerformance = async <T>(
  operation: () => Promise<T> | T,
  iterations: number = 10
): Promise<{ averageTime: number; results: T[] }> => {
  const results: T[] = [];
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    
    results.push(result);
    times.push(end - start);
  }

  const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
  
  return { averageTime, results };
};

// Accessibility testing utilities
export const checkAccessibility = (element: any) => {
  const accessibilityProps = element.props.accessibilityLabel || 
                           element.props.accessibilityHint || 
                           element.props.testID;
  
  return {
    hasAccessibilityLabel: !!element.props.accessibilityLabel,
    hasAccessibilityHint: !!element.props.accessibilityHint,
    hasTestID: !!element.props.testID,
    isAccessible: !!accessibilityProps,
  };
};

// Form testing utilities
export const fillForm = async (formElements: Record<string, any>, data: Record<string, any>) => {
  Object.entries(data).forEach(([key, value]) => {
    if (formElements[key]) {
      if (formElements[key].props.onChangeText) {
        formElements[key].props.onChangeText(value);
      } else if (formElements[key].props.onValueChange) {
        formElements[key].props.onValueChange(value);
      }
    }
  });
};

export const submitForm = async (formElements: Record<string, any>) => {
  if (formElements.onSubmit) {
    await formElements.onSubmit();
  } else if (formElements.onPress) {
    await formElements.onPress();
  }
};
