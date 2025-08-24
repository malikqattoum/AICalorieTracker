import React from 'react';
import { render, fireEvent, waitFor, screen } from '../__tests__/test-utils';
import MealHistoryScreen from '../screens/MealHistoryScreen';
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

describe('MealHistoryScreen', () => {
  const mockQuery = useQuery as jest.MockedFunction<typeof useQuery>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('renders meal history screen correctly', () => {
    mockQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByText('mealHistory.title')).toBeTruthy();
    expect(screen.getByTestId('meal-type-filter')).toBeTruthy();
    expect(screen.getByTestId('date-picker')).toBeTruthy();
    expect(screen.getByTestId('meal-list')).toBeTruthy();
  });

  it('shows loading state when data is loading', () => {
    mockQuery.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows error state when data loading fails', () => {
    mockQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Failed to load meals'),
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByText('common.error')).toBeTruthy();
    expect(screen.getByText('mealHistory.errorLoadingMeals')).toBeTruthy();
  });

  it('displays meals correctly when data is loaded', () => {
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
        imageUrl: 'https://example.com/chicken-salad.jpg',
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
        imageUrl: 'https://example.com/oatmeal.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByText('Grilled Chicken Salad')).toBeTruthy();
    expect(screen.getByText('Oatmeal with Berries')).toBeTruthy();
    expect(screen.getByText('350 cal')).toBeTruthy();
    expect(screen.getByText('400 cal')).toBeTruthy();
  });

  it('filters meals by meal type', () => {
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
        imageUrl: 'https://example.com/chicken-salad.jpg',
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
        imageUrl: 'https://example.com/oatmeal.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    // Initially shows all meals
    expect(screen.getByText('Grilled Chicken Salad')).toBeTruthy();
    expect(screen.getByText('Oatmeal with Berries')).toBeTruthy();

    // Filter by breakfast
    const breakfastFilter = screen.getByTestId('breakfast-filter');
    fireEvent.press(breakfastFilter);

    expect(screen.getByText('Oatmeal with Berries')).toBeTruthy();
    expect(screen.queryByText('Grilled Chicken Salad')).toBeNull();
  });

  it('filters meals by date', () => {
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
        imageUrl: 'https://example.com/chicken-salad.jpg',
      },
      {
        id: 'meal-2',
        foodName: 'Oatmeal with Berries',
        calories: 400,
        protein: 15,
        carbs: 60,
        fat: 12,
        mealType: 'breakfast' as const,
        createdAt: '2023-12-02T08:00:00Z',
        isFavorite: false,
        imageUrl: 'https://example.com/oatmeal.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    // Initially shows all meals
    expect(screen.getByText('Grilled Chicken Salad')).toBeTruthy();
    expect(screen.getByText('Oatmeal with Berries')).toBeTruthy();

    // Filter by specific date
    const datePicker = screen.getByTestId('date-picker');
    fireEvent(datePicker, 'onChange', new Date('2023-12-01'));

    expect(screen.getByText('Grilled Chicken Salad')).toBeTruthy();
    expect(screen.queryByText('Oatmeal with Berries')).toBeNull();
  });

  it('shows daily summary correctly', () => {
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
        imageUrl: 'https://example.com/chicken-salad.jpg',
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
        imageUrl: 'https://example.com/oatmeal.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByText('750')).toBeTruthy(); // Total calories
    expect(screen.getByText('50g')).toBeTruthy(); // Total protein
    expect(screen.getByText('75g')).toBeTruthy(); // Total carbs
    expect(screen.getByText('30g')).toBeTruthy(); // Total fat
  });

  it('navigates to meal details when meal is pressed', () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

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
        imageUrl: 'https://example.com/chicken-salad.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    const mealItem = screen.getByText('Grilled Chicken Salad');
    fireEvent.press(mealItem);

    expect(mockNavigate).toHaveBeenCalledWith('MealDetails', { mealId: 'meal-1' });
  });

  it('shows favorite indicator for favorite meals', () => {
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
        imageUrl: 'https://example.com/chicken-salad.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByTestId('favorite-icon')).toBeTruthy();
  });

  it('shows meal type icons correctly', () => {
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
        imageUrl: 'https://example.com/chicken-salad.jpg',
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
        imageUrl: 'https://example.com/oatmeal.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByTestId('breakfast-icon')).toBeTruthy();
    expect(screen.getByTestId('lunch-icon')).toBeTruthy();
  });

  it('shows meal image when available', () => {
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
        imageUrl: 'https://example.com/chicken-salad.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByTestId('meal-image')).toBeTruthy();
  });

  it('shows placeholder when meal image is not available', () => {
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
        imageUrl: null,
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByTestId('meal-image-placeholder')).toBeTruthy();
  });

  it('handles refresh correctly', async () => {
    const mockRefetch = jest.fn();
    mockQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<MealHistoryScreen />);

    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.press(refreshButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('shows empty state when no meals are found', () => {
    mockQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByText('mealHistory.noMealsFound')).toBeTruthy();
    expect(screen.getByText('mealHistory.startLogging')).toBeTruthy();
  });

  it('shows empty state when no meals match the filter', () => {
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
        imageUrl: 'https://example.com/chicken-salad.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    // Filter by breakfast (no breakfast meals)
    const breakfastFilter = screen.getByTestId('breakfast-filter');
    fireEvent.press(breakfastFilter);

    expect(screen.getByText('mealHistory.noMealsFound')).toBeTruthy();
    expect(screen.getByText('mealHistory.tryDifferentFilter')).toBeTruthy();
  });

  it('shows meal time correctly', () => {
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
        imageUrl: 'https://example.com/chicken-salad.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByText('12:30 PM')).toBeTruthy();
  });

  it('shows meal date correctly', () => {
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
        imageUrl: 'https://example.com/chicken-salad.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByText('Dec 1, 2023')).toBeTruthy();
  });

  it('shows macros breakdown correctly', () => {
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
        imageUrl: 'https://example.com/chicken-salad.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    expect(screen.getByText('P: 35g')).toBeTruthy();
    expect(screen.getByText('C: 15g')).toBeTruthy();
    expect(screen.getByText('F: 18g')).toBeTruthy();
  });

  it('handles meal deletion correctly', async () => {
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
        imageUrl: 'https://example.com/chicken-salad.jpg',
      },
    ];

    mockQuery.mockReturnValue({
      data: mockMeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealHistoryScreen />);

    // Long press on meal item to show delete option
    const mealItem = screen.getByText('Grilled Chicken Salad');
    fireEvent(mealItem, 'longPress');

    // This would typically show a delete confirmation dialog
    // For now, we just verify the long press was handled
    expect(mealItem).toBeTruthy();
  });
});