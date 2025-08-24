import React from 'react';
import { render, fireEvent, waitFor, screen } from '../__tests__/test-utils';
import HomeScreen from '../screens/HomeScreen';
import { useQuery } from '@tanstack/react-query';

// Mock the useQuery hook
jest.mock('@tanstack/react-query');

// Mock the navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

// Mock the theme context
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4F46E5',
      secondary: '#7C3AED',
      background: '#FFFFFF',
      text: '#1F2937',
      gray: '#6B7280',
      lightGray: '#F3F4F6',
      card: '#FFFFFF',
      border: '#E5E7EB',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
    isDarkMode: false,
    toggleTheme: jest.fn(),
  }),
}));

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
    },
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
    error: null,
  }),
}));

describe('HomeScreen', () => {
  const mockQuery = useQuery as jest.MockedFunction<typeof useQuery>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    mockQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<HomeScreen />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders error state correctly', () => {
    mockQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load data'),
      refetch: jest.fn(),
    } as any);

    render(<HomeScreen />);

    expect(screen.getByText('common.error')).toBeTruthy();
    expect(screen.getByText('home.errorLoadingData')).toBeTruthy();
  });

  it('renders home screen with data correctly', () => {
    const mockDailyStats = {
      date: '2023-12-01',
      calories: 1850,
      protein: 95,
      carbs: 120,
      fat: 75,
      fiber: 25,
      water: 2.5,
      steps: 8500,
      weight: 70.5,
    };

    const mockMeals = [
      {
        id: 'meal-1',
        foodName: 'Grilled Chicken Salad',
        calories: 350,
        protein: 35,
        carbs: 15,
        fat: 18,
        mealType: 'lunch' as const,
        createdAt: '2023-12-01T12:30:00Z',
        isFavorite: true,
      },
      {
        id: 'meal-2',
        foodName: 'Oatmeal with Berries',
        calories: 400,
        protein: 15,
        carbs: 60,
        fat: 12,
        mealType: 'breakfast' as const,
        createdAt: '2023-12-01T08:00:00Z',
        isFavorite: false,
      },
    ];

    mockQuery
      .mockReturnValueOnce({
        data: mockDailyStats,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any)
      .mockReturnValueOnce({
        data: mockMeals,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any)
      .mockReturnValueOnce({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any)
      .mockReturnValueOnce({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any)
      .mockReturnValueOnce({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any)
      .mockReturnValueOnce({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

    render(<HomeScreen />);

    // Check if daily stats are displayed
    expect(screen.getByText('1850')).toBeTruthy(); // Calories
    expect(screen.getByText('95g')).toBeTruthy(); // Protein
    expect(screen.getByText('120g')).toBeTruthy(); // Carbs
    expect(screen.getByText('75g')).toBeTruthy(); // Fat

    // Check if recent meals are displayed
    expect(screen.getByText('Grilled Chicken Salad')).toBeTruthy();
    expect(screen.getByText('Oatmeal with Berries')).toBeTruthy();

    // Check if meal type icons are displayed
    expect(screen.getByTestId('breakfast-icon')).toBeTruthy();
    expect(screen.getByTestId('lunch-icon')).toBeTruthy();
  });

  it('navigates to meal history when view all meals is pressed', () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    const mockDailyStats = {
      date: '2023-12-01',
      calories: 1850,
      protein: 95,
      carbs: 120,
      fat: 75,
      fiber: 25,
      water: 2.5,
      steps: 8500,
      weight: 70.5,
    };

    mockQuery.mockReturnValue({
      data: mockDailyStats,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<HomeScreen />);

    const viewAllButton = screen.getByText('home.viewAllMeals');
    fireEvent.press(viewAllButton);

    expect(mockNavigate).toHaveBeenCalledWith('MealHistory');
  });

  it('navigates to camera when add meal button is pressed', () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    const mockDailyStats = {
      date: '2023-12-01',
      calories: 1850,
      protein: 95,
      carbs: 120,
      fat: 75,
      fiber: 25,
      water: 2.5,
      steps: 8500,
      weight: 70.5,
    };

    mockQuery.mockReturnValue({
      data: mockDailyStats,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<HomeScreen />);

    const addMealButton = screen.getByTestId('add-meal-button');
    fireEvent.press(addMealButton);

    expect(mockNavigate).toHaveBeenCalledWith('Camera');
  });

  it('displays premium badge for premium users', () => {
    jest.mock('../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: {
          id: 'user-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          isPremium: true,
        },
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        error: null,
      }),
    }));

    const mockDailyStats = {
      date: '2023-12-01',
      calories: 1850,
      protein: 95,
      carbs: 120,
      fat: 75,
      fiber: 25,
      water: 2.5,
      steps: 8500,
      weight: 70.5,
    };

    mockQuery.mockReturnValue({
      data: mockDailyStats,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<HomeScreen />);

    expect(screen.getByTestId('premium-badge')).toBeTruthy();
  });

  it('disables add meal button when loading', () => {
    const mockDailyStats = {
      date: '2023-12-01',
      calories: 1850,
      protein: 95,
      carbs: 120,
      fat: 75,
      fiber: 25,
      water: 2.5,
      steps: 8500,
      weight: 70.5,
    };

    mockQuery.mockReturnValue({
      data: mockDailyStats,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<HomeScreen />);

    const addMealButton = screen.getByTestId('add-meal-button');
    expect(addMealButton).not.toBeDisabled();
  });

  it('handles refetch correctly', async () => {
    const mockRefetch = jest.fn();
    const mockDailyStats = {
      date: '2023-12-01',
      calories: 1850,
      protein: 95,
      carbs: 120,
      fat: 75,
      fiber: 25,
      water: 2.5,
      steps: 8500,
      weight: 70.5,
    };

    mockQuery.mockReturnValue({
      data: mockDailyStats,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<HomeScreen />);

    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.press(refreshButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('displays water intake correctly', () => {
    const mockDailyStats = {
      date: '2023-12-01',
      calories: 1850,
      protein: 95,
      carbs: 120,
      fat: 75,
      fiber: 25,
      water: 2.5,
      steps: 8500,
      weight: 70.5,
    };

    mockQuery.mockReturnValue({
      data: mockDailyStats,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<HomeScreen />);

    expect(screen.getByText('2.5L')).toBeTruthy();
    expect(screen.getByText('home.water')).toBeTruthy();
  });

  it('displays steps count correctly', () => {
    const mockDailyStats = {
      date: '2023-12-01',
      calories: 1850,
      protein: 95,
      carbs: 120,
      fat: 75,
      fiber: 25,
      water: 2.5,
      steps: 8500,
      weight: 70.5,
    };

    mockQuery.mockReturnValue({
      data: mockDailyStats,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<HomeScreen />);

    expect(screen.getByText('8,500')).toBeTruthy();
    expect(screen.getByText('home.steps')).toBeTruthy();
  });

  it('displays weight correctly', () => {
    const mockDailyStats = {
      date: '2023-12-01',
      calories: 1850,
      protein: 95,
      carbs: 120,
      fat: 75,
      fiber: 25,
      water: 2.5,
      steps: 8500,
      weight: 70.5,
    };

    mockQuery.mockReturnValue({
      data: mockDailyStats,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<HomeScreen />);

    expect(screen.getByText('70.5kg')).toBeTruthy();
    expect(screen.getByText('home.weight')).toBeTruthy();
  });
});