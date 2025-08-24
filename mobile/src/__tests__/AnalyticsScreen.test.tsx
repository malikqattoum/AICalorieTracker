import React from 'react';
import { render, fireEvent, waitFor, screen } from '../__tests__/test-utils';
import AnalyticsScreen from '../screens/AnalyticsScreen';
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

describe('AnalyticsScreen', () => {
  const mockQuery = useQuery as jest.MockedFunction<typeof useQuery>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('renders analytics screen correctly', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
        { id: '2', title: 'Calorie Goal', description: 'Met daily calorie goal for 5 days', earned: true, date: '2023-12-02' },
        { id: '3', title: 'Protein Champion', description: 'Ate 100g+ protein for 3 days', earned: false, date: null },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByText('analytics.title')).toBeTruthy();
    expect(screen.getByText('analytics.overview')).toBeTruthy();
    expect(screen.getByText('analytics.nutrition')).toBeTruthy();
    expect(screen.getByText('analytics.achievements')).toBeTruthy();
    expect(screen.getByText('14,000')).toBeTruthy(); // Total calories
    expect(screen.getByText('2,000')).toBeTruthy(); // Average daily calories
    expect(screen.getByText('98')).toBeTruthy(); // Total meals
    expect(screen.getByText('14')).toBeTruthy(); // Average meals per day
    expect(screen.getByText('-2.5kg')).toBeTruthy(); // Weight change
    expect(screen.getByText('75%')).toBeTruthy(); // Goal progress
  });

  it('shows loading state when data is loading', () => {
    mockQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows error state when data loading fails', () => {
    mockQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load analytics'),
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByText('common.error')).toBeTruthy();
    expect(screen.getByText('analytics.errorLoadingData')).toBeTruthy();
  });

  it('displays overview statistics correctly', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
        { id: '2', title: 'Calorie Goal', description: 'Met daily calorie goal for 5 days', earned: true, date: '2023-12-02' },
        { id: '3', title: 'Protein Champion', description: 'Ate 100g+ protein for 3 days', earned: false, date: null },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByText('14,000')).toBeTruthy(); // Total calories
    expect(screen.getByText('2,000')).toBeTruthy(); // Average daily calories
    expect(screen.getByText('98')).toBeTruthy(); // Total meals
    expect(screen.getByText('14')).toBeTruthy(); // Average meals per day
    expect(screen.getByText('-2.5kg')).toBeTruthy(); // Weight change
    expect(screen.getByText('75%')).toBeTruthy(); // Goal progress
  });

  it('displays nutrition breakdown correctly', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
        { id: '2', title: 'Calorie Goal', description: 'Met daily calorie goal for 5 days', earned: true, date: '2023-12-02' },
        { id: '3', title: 'Protein Champion', description: 'Ate 100g+ protein for 3 days', earned: false, date: null },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByText('1,750g')).toBeTruthy(); // Total protein
    expect(screen.getByText('250g')).toBeTruthy(); // Average protein
    expect(screen.getByText('25%')).toBeTruthy(); // Protein percentage
    expect(screen.getByText('2,800g')).toBeTruthy(); // Total carbs
    expect(screen.getByText('400g')).toBeTruthy(); // Average carbs
    expect(screen.getByText('40%')).toBeTruthy(); // Carbs percentage
    expect(screen.getByText('1,400g')).toBeTruthy(); // Total fat
    expect(screen.getByText('200g')).toBeTruthy(); // Average fat
    expect(screen.getByText('35%')).toBeTruthy(); // Fat percentage
  });

  it('displays achievements correctly', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
        { id: '2', title: 'Calorie Goal', description: 'Met daily calorie goal for 5 days', earned: true, date: '2023-12-02' },
        { id: '3', title: 'Protein Champion', description: 'Ate 100g+ protein for 3 days', earned: false, date: null },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByText('7-Day Streak')).toBeTruthy();
    expect(screen.getByText('Logged meals for 7 consecutive days')).toBeTruthy();
    expect(screen.getByText('Dec 1, 2023')).toBeTruthy();
    expect(screen.getByText('Calorie Goal')).toBeTruthy();
    expect(screen.getByText('Met daily calorie goal for 5 days')).toBeTruthy();
    expect(screen.getByText('Dec 2, 2023')).toBeTruthy();
    expect(screen.getByText('Protein Champion')).toBeTruthy();
    expect(screen.getByText('Ate 100g+ protein for 3 days')).toBeTruthy();
    expect(screen.getByText('Not earned yet')).toBeTruthy();
  });

  it('shows earned achievements with checkmark', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByTestId('achievement-checkmark')).toBeTruthy();
  });

  it('shows unearned achievements with lock', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '3', title: 'Protein Champion', description: 'Ate 100g+ protein for 3 days', earned: false, date: null },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByTestId('achievement-lock')).toBeTruthy();
  });

  it('shows period selection', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByTestId('period-selector')).toBeTruthy();
    expect(screen.getByText('analytics.period')).toBeTruthy();
  });

  it('changes period when period selector is used', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    const periodSelector = screen.getByTestId('period-selector');
    fireEvent(periodSelector, 'onValueChange', 'month');

    expect(periodSelector.props.value).toBe('month');
  });

  it('shows different data for different periods', () => {
    const mockWeeklyAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    const mockMonthlyAnalytics = {
      overview: {
        totalCalories: 56000,
        averageDailyCalories: 1867,
        totalMeals: 392,
        averageMealsPerDay: 13,
        weightChange: -5.0,
        goalProgress: 80,
      },
      nutrition: {
        protein: { total: 7000, average: 233, percentage: 25 },
        carbs: { total: 11200, average: 373, percentage: 40 },
        fat: { total: 5600, average: 187, percentage: 35 },
        fiber: { total: 2240, average: 75, percentage: 10 },
        sugar: { total: 1680, average: 56, percentage: 15 },
        sodium: { total: 67200, average: 2240, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
        { id: '2', title: '30-Day Streak', description: 'Logged meals for 30 consecutive days', earned: true, date: '2023-12-15' },
      ],
    };

    mockQuery
      .mockReturnValueOnce({
        data: mockWeeklyAnalytics,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any)
      .mockReturnValueOnce({
        data: mockMonthlyAnalytics,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

    render(<AnalyticsScreen />);

    // Check weekly data
    expect(screen.getByText('14,000')).toBeTruthy();
    expect(screen.getByText('2,000')).toBeTruthy();

    // Change to monthly
    const periodSelector = screen.getByTestId('period-selector');
    fireEvent(periodSelector, 'onValueChange', 'month');

    // Check monthly data
    expect(screen.getByText('56,000')).toBeTruthy();
    expect(screen.getByText('1,867')).toBeTruthy();
  });

  it('shows nutrition chart', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByTestId('nutrition-chart')).toBeTruthy();
  });

  it('shows goal progress bar', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByTestId('goal-progress-bar')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('shows weight change indicator', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByTestId('weight-change-indicator')).toBeTruthy();
    expect(screen.getByText('-2.5kg')).toBeTruthy();
  });

  it('shows positive weight change', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: 1.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByText('+1.5kg')).toBeTruthy();
  });

  it('shows no weight change', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: 0,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByText('0kg')).toBeTruthy();
  });

  it('shows export button', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByTestId('export-button')).toBeTruthy();
    expect(screen.getByText('analytics.export')).toBeTruthy();
  });

  it('exports analytics when export button is pressed', () => {
    const mockExportAnalytics = jest.fn();
    jest.mock('../services/analyticsService', () => ({
      exportAnalytics: mockExportAnalytics,
    }));

    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    const exportButton = screen.getByTestId('export-button');
    fireEvent.press(exportButton);

    expect(mockExportAnalytics).toHaveBeenCalledWith('week');
  });

  it('shows loading state during export', () => {
    const mockExportAnalytics = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    jest.mock('../services/analyticsService', () => ({
      exportAnalytics: mockExportAnalytics,
    }));

    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    const exportButton = screen.getByTestId('export-button');
    fireEvent.press(exportButton);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows success message after export', async () => {
    const mockExportAnalytics = jest.fn().mockResolvedValue({ success: true });
    jest.mock('../services/analyticsService', () => ({
      exportAnalytics: mockExportAnalytics,
    }));

    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    const exportButton = screen.getByTestId('export-button');
    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(screen.getByText('analytics.exportSuccess')).toBeTruthy();
    });
  });

  it('shows error message after export failure', async () => {
    const mockExportAnalytics = jest.fn().mockRejectedValue(new Error('Export failed'));
    jest.mock('../services/analyticsService', () => ({
      exportAnalytics: mockExportAnalytics,
    }));

    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    const exportButton = screen.getByTestId('export-button');
    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(screen.getByText('common.error')).toBeTruthy();
    });
  });

  it('shows refresh button', () => {
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AnalyticsScreen />);

    expect(screen.getByTestId('refresh-button')).toBeTruthy();
    expect(screen.getByText('analytics.refresh')).toBeTruthy();
  });

  it('refreshes data when refresh button is pressed', () => {
    const mockRefetch = jest.fn();
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<AnalyticsScreen />);

    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.press(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows loading state during refresh', () => {
    const mockRefetch = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<AnalyticsScreen />);

    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.press(refreshButton);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows success message after refresh', async () => {
    const mockRefetch = jest.fn().mockResolvedValue({ success: true });
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<AnalyticsScreen />);

    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.press(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('analytics.refreshSuccess')).toBeTruthy();
    });
  });

  it('shows error message after refresh failure', async () => {
    const mockRefetch = jest.fn().mockRejectedValue(new Error('Refresh failed'));
    const mockAnalytics = {
      overview: {
        totalCalories: 14000,
        averageDailyCalories: 2000,
        totalMeals: 98,
        averageMealsPerDay: 14,
        weightChange: -2.5,
        goalProgress: 75,
      },
      nutrition: {
        protein: { total: 1750, average: 250, percentage: 25 },
        carbs: { total: 2800, average: 400, percentage: 40 },
        fat: { total: 1400, average: 200, percentage: 35 },
        fiber: { total: 560, average: 80, percentage: 10 },
        sugar: { total: 420, average: 60, percentage: 15 },
        sodium: { total: 16800, average: 2400, percentage: 100 },
      },
      achievements: [
        { id: '1', title: '7-Day Streak', description: 'Logged meals for 7 consecutive days', earned: true, date: '2023-12-01' },
      ],
    };

    mockQuery.mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<AnalyticsScreen />);

    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.press(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('common.error')).toBeTruthy();
    });
  });
});