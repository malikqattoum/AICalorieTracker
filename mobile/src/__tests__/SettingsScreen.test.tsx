import React from 'react';
import { render, fireEvent, waitFor, screen } from '../__tests__/test-utils';
import SettingsScreen from '../screens/SettingsScreen';

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

describe('SettingsScreen', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('renders settings screen correctly', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.title')).toBeTruthy();
    expect(screen.getByText('settings.notifications')).toBeTruthy();
    expect(screen.getByText('settings.goals')).toBeTruthy();
    expect(screen.getByText('settings.units')).toBeTruthy();
    expect(screen.getByText('settings.privacy')).toBeTruthy();
    expect(screen.getByText('settings.about')).toBeTruthy();
  });

  it('renders notifications section correctly', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.notifications')).toBeTruthy();
    expect(screen.getByText('settings.mealReminders')).toBeTruthy();
    expect(screen.getByText('settings.weeklyReports')).toBeTruthy();
    expect(screen.getByText('settings.tips')).toBeTruthy();
  });

  it('renders goals section correctly', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.goals')).toBeTruthy();
    expect(screen.getByText('settings.dailyCalorieGoal')).toBeTruthy();
    expect(screen.getByText('settings.proteinGoal')).toBeTruthy();
    expect(screen.getByText('settings.carbsGoal')).toBeTruthy();
    expect(screen.getByText('settings.fatGoal')).toBeTruthy();
  });

  it('renders units section correctly', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.units')).toBeTruthy();
    expect(screen.getByText('settings.weightUnit')).toBeTruthy();
    expect(screen.getByText('settings.distanceUnit')).toBeTruthy();
  });

  it('renders privacy section correctly', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.privacy')).toBeTruthy();
    expect(screen.getByText('settings.dataCollection')).toBeTruthy();
    expect(screen.getByText('settings.analytics')).toBeTruthy();
    expect(screen.getByText('settings.personalizedAds')).toBeTruthy();
  });

  it('renders about section correctly', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.about')).toBeTruthy();
    expect(screen.getByText('settings.version')).toBeTruthy();
    expect(screen.getByText('settings.termsOfService')).toBeTruthy();
    expect(screen.getByText('settings.privacyPolicy')).toBeTruthy();
    expect(screen.getByText('settings.contactSupport')).toBeTruthy();
  });

  it('toggles meal reminders setting', () => {
    render(<SettingsScreen />);

    const mealRemindersSwitch = screen.getByTestId('meal-reminders-switch');
    expect(mealRemindersSwitch.props.value).toBe(true);

    fireEvent(mealRemindersSwitch, 'valueChange', false);
    expect(mealRemindersSwitch.props.value).toBe(false);
  });

  it('toggles weekly reports setting', () => {
    render(<SettingsScreen />);

    const weeklyReportsSwitch = screen.getByTestId('weekly-reports-switch');
    expect(weeklyReportsSwitch.props.value).toBe(true);

    fireEvent(weeklyReportsSwitch, 'valueChange', false);
    expect(weeklyReportsSwitch.props.value).toBe(false);
  });

  it('toggles tips setting', () => {
    render(<SettingsScreen />);

    const tipsSwitch = screen.getByTestId('tips-switch');
    expect(tipsSwitch.props.value).toBe(true);

    fireEvent(tipsSwitch, 'valueChange', false);
    expect(tipsSwitch.props.value).toBe(false);
  });

  it('updates daily calorie goal', () => {
    render(<SettingsScreen />);

    const calorieGoalInput = screen.getByTestId('calorie-goal-input');
    fireEvent.changeText(calorieGoalInput, '2200');

    expect(calorieGoalInput.props.value).toBe('2200');
  });

  it('updates protein goal', () => {
    render(<SettingsScreen />);

    const proteinGoalInput = screen.getByTestId('protein-goal-input');
    fireEvent.changeText(proteinGoalInput, '150');

    expect(proteinGoalInput.props.value).toBe('150');
  });

  it('updates carbs goal', () => {
    render(<SettingsScreen />);

    const carbsGoalInput = screen.getByTestId('carbs-goal-input');
    fireEvent.changeText(carbsGoalInput, '250');

    expect(carbsGoalInput.props.value).toBe('250');
  });

  it('updates fat goal', () => {
    render(<SettingsScreen />);

    const fatGoalInput = screen.getByTestId('fat-goal-input');
    fireEvent.changeText(fatGoalInput, '75');

    expect(fatGoalInput.props.value).toBe('75');
  });

  it('changes weight unit', () => {
    render(<SettingsScreen />);

    const weightUnitPicker = screen.getByTestId('weight-unit-picker');
    fireEvent(weightUnitPicker, 'onValueChange', 'lbs');

    expect(weightUnitPicker.props.value).toBe('lbs');
  });

  it('changes distance unit', () => {
    render(<SettingsScreen />);

    const distanceUnitPicker = screen.getByTestId('distance-unit-picker');
    fireEvent(distanceUnitPicker, 'onValueChange', 'miles');

    expect(distanceUnitPicker.props.value).toBe('miles');
  });

  it('toggles data collection setting', () => {
    render(<SettingsScreen />);

    const dataCollectionSwitch = screen.getByTestId('data-collection-switch');
    expect(dataCollectionSwitch.props.value).toBe(true);

    fireEvent(dataCollectionSwitch, 'valueChange', false);
    expect(dataCollectionSwitch.props.value).toBe(false);
  });

  it('toggles analytics setting', () => {
    render(<SettingsScreen />);

    const analyticsSwitch = screen.getByTestId('analytics-switch');
    expect(analyticsSwitch.props.value).toBe(true);

    fireEvent(analyticsSwitch, 'valueChange', false);
    expect(analyticsSwitch.props.value).toBe(false);
  });

  it('toggles personalized ads setting', () => {
    render(<SettingsScreen />);

    const personalizedAdsSwitch = screen.getByTestId('personalized-ads-switch');
    expect(personalizedAdsSwitch.props.value).toBe(false);

    fireEvent(personalizedAdsSwitch, 'valueChange', true);
    expect(personalizedAdsSwitch.props.value).toBe(true);
  });

  it('shows version information', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.version')).toBeTruthy();
    expect(screen.getByText('1.0.0')).toBeTruthy();
  });

  it('navigates to terms of service', () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    render(<SettingsScreen />);

    const termsOfServiceButton = screen.getByText('settings.termsOfService');
    fireEvent.press(termsOfServiceButton);

    expect(mockNavigate).toHaveBeenCalledWith('WebView', { url: 'https://example.com/terms' });
  });

  it('navigates to privacy policy', () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    render(<SettingsScreen />);

    const privacyPolicyButton = screen.getByText('settings.privacyPolicy');
    fireEvent.press(privacyPolicyButton);

    expect(mockNavigate).toHaveBeenCalledWith('WebView', { url: 'https://example.com/privacy' });
  });

  it('navigates to contact support', () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    render(<SettingsScreen />);

    const contactSupportButton = screen.getByText('settings.contactSupport');
    fireEvent.press(contactSupportButton);

    expect(mockNavigate).toHaveBeenCalledWith('WebView', { url: 'https://example.com/support' });
  });

  it('shows save button', () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId('save-button')).toBeTruthy();
  });

  it('shows reset button', () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId('reset-button')).toBeTruthy();
  });

  it('saves settings when save button is pressed', () => {
    const mockSaveSettings = jest.fn();
    jest.mock('../services/settingsService', () => ({
      saveSettings: mockSaveSettings,
    }));

    render(<SettingsScreen />);

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    expect(mockSaveSettings).toHaveBeenCalled();
  });

  it('resets settings when reset button is pressed', () => {
    render(<SettingsScreen />);

    const resetButton = screen.getByTestId('reset-button');
    fireEvent.press(resetButton);

    // Should show confirmation dialog
    expect(screen.getByText('settings.resetConfirm')).toBeTruthy();
    expect(screen.getByText('common.yes')).toBeTruthy();
    expect(screen.getByText('common.no')).toBeTruthy();
  });

  it('confirms settings reset', () => {
    const mockResetSettings = jest.fn();
    jest.mock('../services/settingsService', () => ({
      resetSettings: mockResetSettings,
    }));

    render(<SettingsScreen />);

    // Open reset confirmation
    const resetButton = screen.getByTestId('reset-button');
    fireEvent.press(resetButton);

    // Confirm reset
    const confirmButton = screen.getByText('common.yes');
    fireEvent.press(confirmButton);

    expect(mockResetSettings).toHaveBeenCalled();
  });

  it('cancels settings reset', () => {
    render(<SettingsScreen />);

    // Open reset confirmation
    const resetButton = screen.getByTestId('reset-button');
    fireEvent.press(resetButton);

    // Cancel reset
    const cancelButton = screen.getByText('common.no');
    fireEvent.press(cancelButton);

    // Confirmation dialog should be closed
    expect(screen.queryByText('settings.resetConfirm')).toBeNull();
  });

  it('shows loading state during save', () => {
    const mockSaveSettings = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    jest.mock('../services/settingsService', () => ({
      saveSettings: mockSaveSettings,
    }));

    render(<SettingsScreen />);

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows success message after save', async () => {
    const mockSaveSettings = jest.fn().mockResolvedValue({ success: true });
    jest.mock('../services/settingsService', () => ({
      saveSettings: mockSaveSettings,
    }));

    render(<SettingsScreen />);

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('settings.saveSuccess')).toBeTruthy();
    });
  });

  it('shows error message after save failure', async () => {
    const mockSaveSettings = jest.fn().mockRejectedValue(new Error('Save failed'));
    jest.mock('../services/settingsService', () => ({
      saveSettings: mockSaveSettings,
    }));

    render(<SettingsScreen />);

    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('common.error')).toBeTruthy();
    });
  });

  it('validates numeric inputs', () => {
    render(<SettingsScreen />);

    const calorieGoalInput = screen.getByTestId('calorie-goal-input');
    fireEvent.changeText(calorieGoalInput, 'invalid');

    // Should not allow invalid input
    expect(calorieGoalInput.props.value).toBe('');
  });

  it('shows validation error for negative values', () => {
    render(<SettingsScreen />);

    const calorieGoalInput = screen.getByTestId('calorie-goal-input');
    fireEvent.changeText(calorieGoalInput, '-100');

    // Should show validation error
    expect(screen.getByText('settings.invalidValue')).toBeTruthy();
  });

  it('shows validation error for zero values', () => {
    render(<SettingsScreen />);

    const calorieGoalInput = screen.getByTestId('calorie-goal-input');
    fireEvent.changeText(calorieGoalInput, '0');

    // Should show validation error
    expect(screen.getByText('settings.invalidValue')).toBeTruthy();
  });

  it('shows validation error for unrealistic values', () => {
    render(<SettingsScreen />);

    const calorieGoalInput = screen.getByTestId('calorie-goal-input');
    fireEvent.changeText(calorieGoalInput, '10000');

    // Should show validation error
    expect(screen.getByText('settings.unrealisticValue')).toBeTruthy();
  });

  it('shows help text for numeric inputs', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.calorieGoalHelp')).toBeTruthy();
    expect(screen.getByText('settings.proteinGoalHelp')).toBeTruthy();
    expect(screen.getByText('settings.carbsGoalHelp')).toBeTruthy();
    expect(screen.getByText('settings.fatGoalHelp')).toBeTruthy();
  });

  it('shows unit conversion information', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.unitConversion')).toBeTruthy();
  });

  it('shows data collection information', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.dataCollectionInfo')).toBeTruthy();
  });

  it('shows analytics information', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.analyticsInfo')).toBeTruthy();
  });

  it('shows personalized ads information', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.personalizedAdsInfo')).toBeTruthy();
  });

  it('shows app information', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.appInfo')).toBeTruthy();
  });

  it('shows copyright information', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('settings.copyright')).toBeTruthy();
  });

  it('handles keyboard dismiss for numeric inputs', () => {
    render(<SettingsScreen />);

    const calorieGoalInput = screen.getByTestId('calorie-goal-input');
    fireEvent(calorieGoalInput, 'focus');
    expect(calorieGoalInput.props.focused).toBe(true);

    fireEvent(calorieGoalInput, 'blur');
    expect(calorieGoalInput.props.focused).toBe(false);
  });

  it('shows keyboard for numeric inputs', () => {
    render(<SettingsScreen />);

    const calorieGoalInput = screen.getByTestId('calorie-goal-input');
    expect(calorieGoalInput.props.keyboardType).toBe('numeric');
  });

  it('shows keyboard type picker for unit selection', () => {
    render(<SettingsScreen />);

    const weightUnitPicker = screen.getByTestId('weight-unit-picker');
    expect(weightUnitPicker.props.keyboardType).toBe('default');
  });

  it('shows section separators', () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId('notifications-separator')).toBeTruthy();
    expect(screen.getByTestId('goals-separator')).toBeTruthy();
    expect(screen.getByTestId('units-separator')).toBeTruthy();
    expect(screen.getByTestId('privacy-separator')).toBeTruthy();
    expect(screen.getByTestId('about-separator')).toBeTruthy();
  });

  it('shows settings header', () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId('settings-header')).toBeTruthy();
    expect(screen.getByText('settings.title')).toBeTruthy();
  });

  it('shows back button in header', () => {
    const mockGoBack = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: jest.fn(),
        goBack: mockGoBack,
      }),
    }));

    render(<SettingsScreen />);

    const backButton = screen.getByTestId('back-button');
    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows settings icon in header', () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId('settings-icon')).toBeTruthy();
  });
});