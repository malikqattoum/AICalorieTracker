import React from 'react';
import { render, fireEvent, waitFor, screen } from '../__tests__/test-utils';
import ProfileScreen from '../screens/ProfileScreen';
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

describe('ProfileScreen', () => {
  const mockQuery = useQuery as jest.MockedFunction<typeof useQuery>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('renders profile screen correctly', () => {
    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    expect(screen.getByText('profile.title')).toBeTruthy();
    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText('john@example.com')).toBeTruthy();
    expect(screen.getByText('profile.personalInfo')).toBeTruthy();
    expect(screen.getByText('profile.stats')).toBeTruthy();
    expect(screen.getByText('profile.settings')).toBeTruthy();
  });

  it('shows loading state when data is loading', () => {
    mockQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows error state when data loading fails', () => {
    mockQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load profile'),
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    expect(screen.getByText('common.error')).toBeTruthy();
    expect(screen.getByText('profile.errorLoadingProfile')).toBeTruthy();
  });

  it('displays user avatar correctly', () => {
    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    expect(screen.getByTestId('user-avatar')).toBeTruthy();
  });

  it('shows placeholder when avatar is not available', () => {
    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: null,
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    expect(screen.getByTestId('avatar-placeholder')).toBeTruthy();
  });

  it('shows premium badge for premium users', () => {
    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: true,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    expect(screen.getByTestId('premium-badge')).toBeTruthy();
  });

  it('displays user stats correctly', () => {
    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    expect(screen.getByText('150')).toBeTruthy(); // Total meals
    expect(screen.getByText('7')).toBeTruthy(); // Streak
    expect(screen.getByText('1,850')).toBeTruthy(); // Average calories
    expect(screen.getByText('75kg')).toBeTruthy(); // Current weight
    expect(screen.getByText('70kg')).toBeTruthy(); // Target weight
  });

  it('displays personal information correctly', () => {
    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText('john@example.com')).toBeTruthy();
    expect(screen.getByText('profile.memberSince')).toBeTruthy();
  });

  it('navigates to personal info screen when personal info section is pressed', () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    const personalInfoSection = screen.getByText('profile.personalInfo');
    fireEvent.press(personalInfoSection);

    expect(mockNavigate).toHaveBeenCalledWith('PersonalInfo');
  });

  it('navigates to settings screen when settings section is pressed', () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    const settingsSection = screen.getByText('profile.settings');
    fireEvent.press(settingsSection);

    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });

  it('handles logout correctly', () => {
    const mockLogout = jest.fn();
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
        logout: mockLogout,
        isLoading: false,
        error: null,
      }),
    }));

    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    const logoutButton = screen.getByText('profile.logout');
    fireEvent.press(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('shows confirmation dialog for logout', () => {
    const mockLogout = jest.fn();
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
        logout: mockLogout,
        isLoading: false,
        error: null,
      }),
    }));

    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    const logoutButton = screen.getByText('profile.logout');
    fireEvent.press(logoutButton);

    expect(screen.getByText('profile.logoutConfirm')).toBeTruthy();
    expect(screen.getByText('common.yes')).toBeTruthy();
    expect(screen.getByText('common.no')).toBeTruthy();
  });

  it('handles logout confirmation', () => {
    const mockLogout = jest.fn();
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
        logout: mockLogout,
        isLoading: false,
        error: null,
      }),
    }));

    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    // Open logout confirmation
    const logoutButton = screen.getByText('profile.logout');
    fireEvent.press(logoutButton);

    // Confirm logout
    const confirmButton = screen.getByText('common.yes');
    fireEvent.press(confirmButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('cancels logout confirmation', () => {
    const mockLogout = jest.fn();
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
        logout: mockLogout,
        isLoading: false,
        error: null,
      }),
    }));

    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    // Open logout confirmation
    const logoutButton = screen.getByText('profile.logout');
    fireEvent.press(logoutButton);

    // Cancel logout
    const cancelButton = screen.getByText('common.no');
    fireEvent.press(cancelButton);

    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('shows loading state during logout', () => {
    const mockLogout = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
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
        logout: mockLogout,
        isLoading: true,
        error: null,
      }),
    }));

    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    const logoutButton = screen.getByText('profile.logout');
    fireEvent.press(logoutButton);

    const confirmButton = screen.getByText('common.yes');
    fireEvent.press(confirmButton);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('handles logout error', async () => {
    const mockLogout = jest.fn().mockRejectedValue(new Error('Logout failed'));
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
        logout: mockLogout,
        isLoading: false,
        error: new Error('Logout failed'),
      }),
    }));

    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    const logoutButton = screen.getByText('profile.logout');
    fireEvent.press(logoutButton);

    const confirmButton = screen.getByText('common.yes');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('common.error')).toBeTruthy();
    });
  });

  it('shows edit profile button', () => {
    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    expect(screen.getByTestId('edit-profile-button')).toBeTruthy();
  });

  it('navigates to edit profile when edit button is pressed', () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    const mockProfile = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isPremium: false,
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          mealReminders: true,
          weeklyReports: true,
          tips: true,
        },
      },
      stats: {
        totalMealsLogged: 150,
        streak: 7,
        averageCalories: 1850,
        weightGoal: 'lose',
        targetWeight: 70,
        currentWeight: 75,
      },
    };

    mockQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ProfileScreen />);

    const editButton = screen.getByTestId('edit-profile-button');
    fireEvent.press(editButton);

    expect(mockNavigate).toHaveBeenCalledWith('PersonalInfo');
  });
});