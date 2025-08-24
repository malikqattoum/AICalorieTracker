import React from 'react';
import { render, fireEvent, waitFor, screen } from '../__tests__/test-utils';
import MealPlanScreen from '../screens/MealPlanScreen';
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

describe('MealPlanScreen', () => {
  const mockQuery = useQuery as jest.MockedFunction<typeof useQuery>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('renders meal plan screen correctly', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
            {
              type: 'lunch' as const,
              name: 'Grilled Chicken Salad',
              calories: 350,
              protein: 35,
              carbs: 15,
              fat: 18,
            },
            {
              type: 'dinner' as const,
              name: 'Salmon with Vegetables',
              calories: 450,
              protein: 40,
              carbs: 20,
              fat: 25,
            },
            {
              type: 'snack' as const,
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

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByText('mealPlan.title')).toBeTruthy();
    expect(screen.getByText('Weekly Healthy Plan')).toBeTruthy();
    expect(screen.getByText('Balanced nutrition for the week')).toBeTruthy();
    expect(screen.getByText('Dec 1, 2023')).toBeTruthy();
    expect(screen.getByText('14,000')).toBeTruthy(); // Total calories
    expect(screen.getByText('2,000')).toBeTruthy(); // Average daily calories
  });

  it('shows loading state when data is loading', () => {
    mockQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows error state when data loading fails', () => {
    mockQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load meal plan'),
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByText('common.error')).toBeTruthy();
    expect(screen.getByText('mealPlan.errorLoadingPlan')).toBeTruthy();
  });

  it('displays meal plan days correctly', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
            {
              type: 'lunch' as const,
              name: 'Grilled Chicken Salad',
              calories: 350,
              protein: 35,
              carbs: 15,
              fat: 18,
            },
            {
              type: 'dinner' as const,
              name: 'Salmon with Vegetables',
              calories: 450,
              protein: 40,
              carbs: 20,
              fat: 25,
            },
            {
              type: 'snack' as const,
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

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByText('Dec 1, 2023')).toBeTruthy();
    expect(screen.getByText('Oatmeal with Berries')).toBeTruthy();
    expect(screen.getByText('Grilled Chicken Salad')).toBeTruthy();
    expect(screen.getByText('Salmon with Vegetables')).toBeTruthy();
    expect(screen.getByText('Apple with Almonds')).toBeTruthy();
  });

  it('displays meal type icons correctly', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
            {
              type: 'lunch' as const,
              name: 'Grilled Chicken Salad',
              calories: 350,
              protein: 35,
              carbs: 15,
              fat: 18,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByTestId('breakfast-icon')).toBeTruthy();
    expect(screen.getByTestId('lunch-icon')).toBeTruthy();
  });

  it('displays meal calories correctly', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
            {
              type: 'lunch' as const,
              name: 'Grilled Chicken Salad',
              calories: 350,
              protein: 35,
              carbs: 15,
              fat: 18,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByText('400 cal')).toBeTruthy();
    expect(screen.getByText('350 cal')).toBeTruthy();
  });

  it('displays daily totals correctly', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
            {
              type: 'lunch' as const,
              name: 'Grilled Chicken Salad',
              calories: 350,
              protein: 35,
              carbs: 15,
              fat: 18,
            },
            {
              type: 'dinner' as const,
              name: 'Salmon with Vegetables',
              calories: 450,
              protein: 40,
              carbs: 20,
              fat: 25,
            },
            {
              type: 'snack' as const,
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

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByText('1,400')).toBeTruthy(); // Total daily calories
    expect(screen.getByText('95g')).toBeTruthy(); // Total protein
    expect(screen.getByText('120g')).toBeTruthy(); // Total carbs
    expect(screen.getByText('65g')).toBeTruthy(); // Total fat
  });

  it('navigates to meal details when meal is pressed', () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    const mealItem = screen.getByText('Oatmeal with Berries');
    fireEvent.press(mealItem);

    expect(mockNavigate).toHaveBeenCalledWith('MealDetails', { mealId: 'meal-123-breakfast' });
  });

  it('shows search functionality', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByTestId('search-input')).toBeTruthy();
    expect(screen.getByText('mealPlan.searchMeals')).toBeTruthy();
  });

  it('filters meals by search term', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
            {
              type: 'lunch' as const,
              name: 'Grilled Chicken Salad',
              calories: 350,
              protein: 35,
              carbs: 15,
              fat: 18,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.changeText(searchInput, 'chicken');

    expect(screen.getByText('Grilled Chicken Salad')).toBeTruthy();
    expect(screen.queryByText('Oatmeal with Berries')).toBeNull();
  });

  it('shows empty state when no meals match search', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.changeText(searchInput, 'pizza');

    expect(screen.getByText('mealPlan.noMealsFound')).toBeTruthy();
    expect(screen.getByText('mealPlan.tryDifferentSearch')).toBeTruthy();
  });

  it('shows meal plan summary', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByText('mealPlan.summary')).toBeTruthy();
    expect(screen.getByText('14,000')).toBeTruthy(); // Total calories
    expect(screen.getByText('2,000')).toBeTruthy(); // Average daily calories
    expect(screen.getByText('7')).toBeTruthy(); // Number of days
  });

  it('shows meal plan progress', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByText('mealPlan.progress')).toBeTruthy();
    expect(screen.getByText('1/7')).toBeTruthy(); // 1 day completed out of 7
  });

  it('shows meal plan completion percentage', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByText('14%')).toBeTruthy(); // 1/7 = 14%
  });

  it('shows meal plan navigation', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByTestId('previous-day-button')).toBeTruthy();
    expect(screen.getByTestId('next-day-button')).toBeTruthy();
  });

  it('navigates to previous day', () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    const previousDayButton = screen.getByTestId('previous-day-button');
    fireEvent.press(previousDayButton);

    expect(mockNavigate).toHaveBeenCalledWith('MealPlan', { date: '2023-11-30' });
  });

  it('navigates to next day', () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    const nextDayButton = screen.getByTestId('next-day-button');
    fireEvent.press(nextDayButton);

    expect(mockNavigate).toHaveBeenCalledWith('MealPlan', { date: '2023-12-02' });
  });

  it('disables previous day button on first day', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    const previousDayButton = screen.getByTestId('previous-day-button');
    expect(previousDayButton.props.disabled).toBe(true);
  });

  it('disables next day button on last day', () => {
    const mockMealPlan = {
      id: 'plan-123',
      name: 'Weekly Healthy Plan',
      description: 'Balanced nutrition for the week',
      startDate: '2023-12-01',
      endDate: '2023-12-07',
      totalCalories: 14000,
      averageDailyCalories: 2000,
      days: [
        {
          date: '2023-12-07',
          meals: [
            {
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    const nextDayButton = screen.getByTestId('next-day-button');
    expect(nextDayButton.props.disabled).toBe(true);
  });

  it('shows meal plan export button', () => {
    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    expect(screen.getByTestId('export-button')).toBeTruthy();
    expect(screen.getByText('mealPlan.export')).toBeTruthy();
  });

  it('exports meal plan when export button is pressed', () => {
    const mockExportMealPlan = jest.fn();
    jest.mock('../services/mealPlanService', () => ({
      exportMealPlan: mockExportMealPlan,
    }));

    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    const exportButton = screen.getByTestId('export-button');
    fireEvent.press(exportButton);

    expect(mockExportMealPlan).toHaveBeenCalledWith('plan-123');
  });

  it('shows loading state during export', () => {
    const mockExportMealPlan = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    jest.mock('../services/mealPlanService', () => ({
      exportMealPlan: mockExportMealPlan,
    }));

    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    const exportButton = screen.getByTestId('export-button');
    fireEvent.press(exportButton);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows success message after export', async () => {
    const mockExportMealPlan = jest.fn().mockResolvedValue({ success: true });
    jest.mock('../services/mealPlanService', () => ({
      exportMealPlan: mockExportMealPlan,
    }));

    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    const exportButton = screen.getByTestId('export-button');
    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(screen.getByText('mealPlan.exportSuccess')).toBeTruthy();
    });
  });

  it('shows error message after export failure', async () => {
    const mockExportMealPlan = jest.fn().mockRejectedValue(new Error('Export failed'));
    jest.mock('../services/mealPlanService', () => ({
      exportMealPlan: mockExportMealPlan,
    }));

    const mockMealPlan = {
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
              type: 'breakfast' as const,
              name: 'Oatmeal with Berries',
              calories: 400,
              protein: 15,
              carbs: 60,
              fat: 12,
            },
          ],
        },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockMealPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MealPlanScreen />);

    const exportButton = screen.getByTestId('export-button');
    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(screen.getByText('common.error')).toBeTruthy();
    });
  });
});