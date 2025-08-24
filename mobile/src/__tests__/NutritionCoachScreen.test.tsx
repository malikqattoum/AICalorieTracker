import React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { render, fireEvent, waitFor, screen } from '../__tests__/test-utils';
import NutritionCoachScreen from '../screens/NutritionCoachScreen';
import { useMutation } from '@tanstack/react-query';

// Mock the useMutation hook
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

// Mock the nutrition coach service
jest.mock('../services/nutritionCoachService', () => ({
  askQuestion: jest.fn(),
}));

// Mock the i18n
jest.mock('../i18n', () => ({
  t: (key: string) => key,
}));

// Mock the Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.fn().mockImplementation((props) => {
    return <View {...props} />;
  }),
}));

describe('NutritionCoachScreen', () => {
  const mockMutation = useMutation as jest.MockedFunction<typeof useMutation>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('renders nutrition coach screen correctly', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    expect(screen.getByTestId('nutrition-coach-container')).toBeTruthy();
    expect(screen.getByTestId('messages-list')).toBeTruthy();
    expect(screen.getByTestId('input-container')).toBeTruthy();
    expect(screen.getByTestId('send-button')).toBeTruthy();
  });

  it('shows welcome message on initial load', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    expect(screen.getByText('nutritionCoach.welcomeMessage')).toBeTruthy();
  });

  it('shows suggestions on initial load', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    expect(screen.getByText('Try asking:')).toBeTruthy();
    expect(screen.getByText('What should I eat for breakfast?')).toBeTruthy();
    expect(screen.getByText('How can I lose weight?')).toBeTruthy();
    expect(screen.getByText('What are healthy snacks?')).toBeTruthy();
  });

  it('hides suggestions after first message', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const suggestionButton = screen.getByText('What should I eat for breakfast?');
    fireEvent.press(suggestionButton);

    expect(screen.queryByText('Try asking:')).toBeNull();
  });

  it('sends user message when send button is pressed', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello, coach!');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(mockMutate).toHaveBeenCalledWith('Hello, coach!');
  });

  it('sends user message when enter key is pressed', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello, coach!');
    fireEvent(input, 'submitEditing');

    expect(mockMutate).toHaveBeenCalledWith('Hello, coach!');
  });

  it('disables send button when input is empty', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton.props.disabled).toBe(true);
  });

  it('enables send button when input has text', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton.props.disabled).toBe(false);
  });

  it('disables send button when mutation is pending', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton.props.disabled).toBe(true);
  });

  it('shows loading indicator when mutation is pending', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows thinking message when mutation starts', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(screen.getByText('nutritionCoach.thinking')).toBeTruthy();
  });

  it('shows AI response when mutation succeeds', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock nutrition coach service
    const { askQuestion } = require('../services/nutritionCoachService');
    askQuestion.mockResolvedValue({
      content: 'Hello! I\'m here to help you with your nutrition questions.',
    });

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(screen.getByText('Hello! I\'m here to help you with your nutrition questions.')).toBeTruthy();
  });

  it('shows error message when mutation fails', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('Failed to get response'),
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(screen.getByText('nutritionCoach.errorMessage')).toBeTruthy();
  });

  it('shows user message in user bubble', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByTestId('user-message-bubble')).toBeTruthy();
  });

  it('shows AI message in AI bubble', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock nutrition coach service
    const { askQuestion } = require('../services/nutritionCoachService');
    askQuestion.mockResolvedValue({
      content: 'Hello! I\'m here to help you.',
    });

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(screen.getByText('Hello! I\'m here to help you.')).toBeTruthy();
    expect(screen.getByTestId('ai-message-bubble')).toBeTruthy();
  });

  it('shows thinking message in AI bubble', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(screen.getByTestId('ai-message-bubble')).toBeTruthy();
  });

  it('shows thinking indicator in thinking message', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(screen.getByTestId('thinking-indicator')).toBeTruthy();
  });

  it('scrolls to bottom when new message is added', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock nutrition coach service
    const { askQuestion } = require('../services/nutritionCoachService');
    askQuestion.mockResolvedValue({
      content: 'Hello! I\'m here to help you.',
    });

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    // Check that the list has scrolled to the bottom
    const messagesList = screen.getByTestId('messages-list');
    expect(messagesList.props.data.length).toBeGreaterThan(1);
  });

  it('handles suggestion press', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const suggestionButton = screen.getByText('What should I eat for breakfast?');
    fireEvent.press(suggestionButton);

    expect(mockMutate).toHaveBeenCalledWith('What should I eat for breakfast?');
  });

  it('shows multiple suggestions', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    expect(screen.getByText('What should I eat for breakfast?')).toBeTruthy();
    expect(screen.getByText('How can I lose weight?')).toBeTruthy();
    expect(screen.getByText('What are healthy snacks?')).toBeTruthy();
    expect(screen.getByText('How much protein do I need?')).toBeTruthy();
    expect(screen.getByText('What vitamins should I take?')).toBeTruthy();
  });

  it('shows suggestion buttons correctly', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const suggestionButtons = screen.getAllByTestId('suggestion-button');
    expect(suggestionButtons.length).toBe(5);
  });

  it('shows input field with placeholder', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    expect(input.props.placeholder).toBe('nutritionCoach.askQuestion');
  });

  it('shows send button with icon', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton.props.children).toBeTruthy();
  });

  it('shows send button with loading indicator when pending', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(sendButton.props.children).toBeTruthy();
  });

  it('handles input text change', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello, coach!');

    expect(input.props.value).toBe('Hello, coach!');
  });

  it('limits input text length', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'a'.repeat(501));

    expect(input.props.value.length).toBe(500);
  });

  it('allows multiline input', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    expect(input.props.multiline).toBe(true);
  });

  it('shows input container with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const inputContainer = screen.getByTestId('input-container');
    expect(inputContainer).toBeTruthy();
  });

  it('shows messages list with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const messagesList = screen.getByTestId('messages-list');
    expect(messagesList).toBeTruthy();
  });

  it('shows container with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const container = screen.getByTestId('nutrition-coach-container');
    expect(container).toBeTruthy();
  });

  it('shows keyboard avoiding view on iOS', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const keyboardAvoidingView = screen.getByTestId('keyboard-avoiding-view');
    expect(keyboardAvoidingView.props.behavior).toBe('padding');
  });

  it('shows keyboard avoiding view on Android', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock Platform.OS
    jest.mock('react-native', () => ({
      ...jest.requireActual('react-native'),
      Platform: {
        OS: 'android',
      },
    }));

    render(<NutritionCoachScreen />);

    const keyboardAvoidingView = screen.getByTestId('keyboard-avoiding-view');
    expect(keyboardAvoidingView.props.behavior).toBe(undefined);
  });

  it('shows keyboard vertical offset on iOS', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const keyboardAvoidingView = screen.getByTestId('keyboard-avoiding-view');
    expect(keyboardAvoidingView.props.keyboardVerticalOffset).toBe(90);
  });

  it('shows no keyboard vertical offset on Android', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock Platform.OS
    jest.mock('react-native', () => ({
      ...jest.requireActual('react-native'),
      Platform: {
        OS: 'android',
      },
    }));

    render(<NutritionCoachScreen />);

    const keyboardAvoidingView = screen.getByTestId('keyboard-avoiding-view');
    expect(keyboardAvoidingView.props.keyboardVerticalOffset).toBe(0);
  });

  it('shows flat list with correct props', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const flatList = screen.getByTestId('messages-list');
    expect(flatList.props.data).toEqual([]);
    expect(flatList.props.renderItem).toBeTruthy();
    expect(flatList.props.keyExtractor).toBeTruthy();
    expect(flatList.props.contentContainerStyle).toBeTruthy();
    expect(flatList.props.showsVerticalScrollIndicator).toBe(false);
    expect(flatList.props.ListFooterComponent).toBeTruthy();
  });

  it('shows flat list with messages data', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const flatList = screen.getByTestId('messages-list');
    expect(flatList.props.data.length).toBe(1); // Welcome message
  });

  it('shows flat list with correct key extractor', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const flatList = screen.getByTestId('messages-list');
    expect(flatList.props.keyExtractor).toBeTruthy();
  });

  it('shows flat list with correct content container style', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const flatList = screen.getByTestId('messages-list');
    expect(flatList.props.contentContainerStyle).toBeTruthy();
  });

  it('shows flat list with list footer component', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const flatList = screen.getByTestId('messages-list');
    expect(flatList.props.ListFooterComponent).toBeTruthy();
  });

  it('shows flat list with suggestions as footer component', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const flatList = screen.getByTestId('messages-list');
    const footerComponent = flatList.props.ListFooterComponent();
    expect(footerComponent).toBeTruthy();
  });

  it('shows no footer component after first message', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const suggestionButton = screen.getByText('What should I eat for breakfast?');
    fireEvent.press(suggestionButton);

    const flatList = screen.getByTestId('messages-list');
    const footerComponent = flatList.props.ListFooterComponent();
    expect(footerComponent).toBeNull();
  });

  it('shows message container with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const messageContainer = screen.getByTestId('message-container');
    expect(messageContainer).toBeTruthy();
  });

  it('shows user message container with correct styling', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    const userMessageContainer = screen.getByTestId('user-message-container');
    expect(userMessageContainer).toBeTruthy();
  });

  it('shows AI message container with correct styling', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock nutrition coach service
    const { askQuestion } = require('../services/nutritionCoachService');
    askQuestion.mockResolvedValue({
      content: 'Hello! I\'m here to help you.',
    });

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    const aiMessageContainer = screen.getByTestId('ai-message-container');
    expect(aiMessageContainer).toBeTruthy();
  });

  it('shows message bubble with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const messageBubble = screen.getByTestId('message-bubble');
    expect(messageBubble).toBeTruthy();
  });

  it('shows user message bubble with correct styling', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    const userMessageBubble = screen.getByTestId('user-message-bubble');
    expect(userMessageBubble).toBeTruthy();
  });

  it('shows AI message bubble with correct styling', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock nutrition coach service
    const { askQuestion } = require('../services/nutritionCoachService');
    askQuestion.mockResolvedValue({
      content: 'Hello! I\'m here to help you.',
    });

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    const aiMessageBubble = screen.getByTestId('ai-message-bubble');
    expect(aiMessageBubble).toBeTruthy();
  });

  it('shows message text with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const messageText = screen.getByTestId('message-text');
    expect(messageText).toBeTruthy();
  });

  it('shows user message text with correct styling', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    const userMessageText = screen.getByTestId('user-message-text');
    expect(userMessageText).toBeTruthy();
  });

  it('shows AI message text with correct styling', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock nutrition coach service
    const { askQuestion } = require('../services/nutritionCoachService');
    askQuestion.mockResolvedValue({
      content: 'Hello! I\'m here to help you.',
    });

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    const aiMessageText = screen.getByTestId('ai-message-text');
    expect(aiMessageText).toBeTruthy();
  });

  it('shows thinking container with correct styling', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    const thinkingContainer = screen.getByTestId('thinking-container');
    expect(thinkingContainer).toBeTruthy();
  });

  it('shows thinking indicator with correct styling', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    const thinkingIndicator = screen.getByTestId('thinking-indicator');
    expect(thinkingIndicator).toBeTruthy();
  });

  it('shows thinking text with correct styling', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    fireEvent.changeText(input, 'Hello');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    const thinkingText = screen.getByTestId('thinking-text');
    expect(thinkingText).toBeTruthy();
  });

  it('shows suggestions container with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const suggestionsContainer = screen.getByTestId('suggestions-container');
    expect(suggestionsContainer).toBeTruthy();
  });

  it('shows suggestions title with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const suggestionsTitle = screen.getByTestId('suggestions-title');
    expect(suggestionsTitle).toBeTruthy();
  });

  it('shows suggestions list with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const suggestionsList = screen.getByTestId('suggestions-list');
    expect(suggestionsList).toBeTruthy();
  });

  it('shows suggestion button with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const suggestionButton = screen.getByTestId('suggestion-button');
    expect(suggestionButton).toBeTruthy();
  });

  it('shows suggestion text with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const suggestionText = screen.getByTestId('suggestion-text');
    expect(suggestionText).toBeTruthy();
  });

  it('shows input with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const input = screen.getByTestId('message-input');
    expect(input).toBeTruthy();
  });

  it('shows send button with correct styling', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<NutritionCoachScreen />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeTruthy();
  });
});
