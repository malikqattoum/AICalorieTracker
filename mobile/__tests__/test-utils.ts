import { render } from '@testing-library/react-native';
import React from 'react';

// Mock all the dependencies that are commonly used in tests
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  })),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    removeQueries: jest.fn(),
    resetQueries: jest.fn(),
  }),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Camera
jest.mock('expo-camera', () => ({
  Camera: jest.fn().mockImplementation(({ children }: { children: React.ReactNode }) => children),
  CameraType: {
    back: 'back',
    front: 'front',
  },
}));

// Mock ImagePicker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

// Mock ImageManipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
}));

// Mock FileSystem
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
  deleteAsync: jest.fn(),
  copyAsync: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  fetch: jest.fn(),
}));

// Mock Font loading
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
}));

// Mock SplashScreen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// Mock StatusBar
jest.mock('expo-status-bar', () => ({
  StatusBar: jest.fn(),
}));

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => {
  return function LinearGradient(props: any) {
    return props.children;
  };
});

// Mock Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.fn().mockImplementation(({ name, size, color }: { name: string; size: number; color: string }) => 
    React.createElement('div', { 'data-testid': `icon-${name}`, style: { fontSize: size, color } }, name)
  ),
}));

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return children;
};

const customRender = (ui: React.ReactElement, options?: any) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react-native';
export { customRender as render };

// Test utilities
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
});

export const createMockRoute = (params: any = {}) => ({
  params,
});

export const createMockQueryResult = (data: any = null, isLoading = false, error = null) => ({
  data,
  isLoading,
  error,
  refetch: jest.fn(),
});

export const createMockMutationResult = (mutate = jest.fn(), isPending = false, error = null) => ({
  mutate,
  isPending,
  error,
});

export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: 'OK',
  headers: {
    get: jest.fn(),
  },
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  blob: jest.fn(),
});

// Test data generators
export const generateMockMeal = (overrides: any = {}) => ({
  id: 'test-meal-id',
  foodName: 'Test Food',
  calories: 250,
  protein: 10,
  carbs: 20,
  fat: 5,
  fiber: 2,
  sugar: 5,
  sodium: 100,
  servingSize: '1 cup',
  imageUrl: 'test-image-url',
  mealType: 'breakfast' as const,
  createdAt: '2023-01-01T12:00:00Z',
  isFavorite: false,
  ingredients: ['Ingredient 1', 'Ingredient 2'],
  aiInsights: 'This is a healthy meal option.',
  ...overrides,
});

export const generateMockUser = (overrides: any = {}) => ({
  id: 'user-id',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  ...overrides,
});

export const generateMockNutritionData = (overrides: any = {}) => ({
  foodName: 'Test Food',
  calories: 250,
  protein: 10,
  carbs: 20,
  fat: 5,
  fiber: 2,
  portionSize: {
    estimatedWeight: 100,
    referenceObject: 'apple',
  },
  densityScore: 0.8,
  ...overrides,
});

// Test helpers
export const waitForAsync = async (callback: () => void, timeout = 5000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  throw new Error('Timeout waiting for async operation');
};

// Suppress console errors during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Export all test utilities
export default {
  render: customRender,
  sleep,
  createMockNavigation,
  createMockRoute,
  createMockQueryResult,
  createMockMutationResult,
  mockApiResponse,
  generateMockMeal,
  generateMockUser,
  generateMockNutritionData,
  waitForAsync,
};