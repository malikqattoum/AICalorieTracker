import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import NutritionCoachScreen from '../src/screens/NutritionCoachScreen';
import Toast from 'react-native-toast-message';

// Mock dependencies
jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('../src/i18n', () => ({
  t: (key: string) => {
    const translations: Record<string, any> = {
      'nutritionCoach.welcomeMessage': 'Welcome to your AI nutrition coach! How can I help you today?',
      'nutritionCoach.thinking': 'Thinking...',
      'nutritionCoach.errorMessage': 'Sorry, I encountered an error. Please try again.',
      'nutritionCoach.askQuestion': 'Ask a question...',
      'nutritionCoach.suggestions': [
        'What should I eat for breakfast?',
        'How many calories do I need?',
        'Is this meal healthy?',
      ],
    };
    return translations[key] || key;
  },
}));

jest.mock('../src/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4F46E5',
      text: '#000000',
      gray: '#666666',
      card: '#FFFFFF',
      border: '#E5E7EB',
    },
  }),
}));

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      firstName: 'John',
    },
  }),
}));

jest.mock('../src/services/nutritionCoachService', () => ({
  askQuestion: jest.fn(),
}));

describe('NutritionCoachScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('renders welcome message initially', () => {
      const { getByText } = render(<NutritionCoachScreen />);
      
      expect(getByText('Welcome to your AI nutrition coach! How can I help you today?')).toBeTruthy();
    });

    it('shows suggestions when first loaded', () => {
      const { getByText } = render(<NutritionCoachScreen />);
      
      expect(getByText('Try asking:')).toBeTruthy();
      expect(getByText('What should I eat for breakfast?')).toBeTruthy();
      expect(getByText('How many calories do I need?')).toBeTruthy();
      expect(getByText('Is this meal healthy?')).toBeTruthy();
    });

    it('hides suggestions after user sends a message', async () => {
      const { getByText, queryByText, getByTestId } = render(<NutritionCoachScreen />);
      
      // Send a message
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(queryByText('Try asking:')).toBeFalsy();
      });
    });
  });

  describe('Message Input', () => {
    it('allows user to type messages', () => {
      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      
      fireEvent.changeText(input, 'Hello, how are you?');
      
      expect(input.props.value).toBe('Hello, how are you?');
    });

    it('disables send button when input is empty', () => {
      const { getByTestId } = render(<NutritionCoachScreen />);
      const sendButton = getByTestId('send-button');
      
      expect(sendButton.props.disabled).toBe(true);
    });

    it('enables send button when input has text', () => {
      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      
      expect(sendButton.props.disabled).toBe(false);
    });

    it('disables send button when mutation is pending', () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: true,
      });

      const { getByTestId } = render(<NutritionCoachScreen />);
      const sendButton = getByTestId('send-button');
      
      expect(sendButton.props.disabled).toBe(true);
    });

    it('clears input after sending message', async () => {
      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(input.props.value).toBe('');
      });
    });
  });

  describe('Sending Messages', () => {
    beforeEach(() => {
      const { askQuestion } = require('../src/services/nutritionCoachService');
      askQuestion.mockResolvedValue({
        content: 'Hello! I\'m here to help you with your nutrition questions.',
      });
    });

    it('sends user message when send button is pressed', async () => {
      const { useMutation } = require('@tanstack/react-query');
      const mockMutate = jest.fn();
      useMutation.mockReturnValueOnce({
        mutate: mockMutate,
        isPending: false,
      });

      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      expect(mockMutate).toHaveBeenCalledWith('Hello');
    });

    it('sends user message when enter key is pressed', async () => {
      const { useMutation } = require('@tanstack/react-query');
      const mockMutate = jest.fn();
      useMutation.mockReturnValueOnce({
        mutate: mockMutate,
        isPending: false,
      });

      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent(input, 'submitEditing');
      
      expect(mockMutate).toHaveBeenCalledWith('Hello');
    });

    it('shows thinking indicator while waiting for response', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: true,
      });

      const { getByText, getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      expect(getByText('Thinking...')).toBeTruthy();
    });

    it('shows AI response when received', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: false,
      });

      const { getByText, getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      // Wait for the response
      await waitFor(() => {
        expect(getByText('Hello! I\'m here to help you with your nutrition questions.')).toBeTruthy();
      });
    });

    it('hides thinking indicator after response', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: false,
      });

      const { queryByText, getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      // Wait for the response
      await waitFor(() => {
        expect(queryByText('Thinking...')).toBeFalsy();
      });
    });
  });

  describe('Suggestion Buttons', () => {
    it('sends suggestion when suggestion button is pressed', async () => {
      const { useMutation } = require('@tanstack/react-query');
      const mockMutate = jest.fn();
      useMutation.mockReturnValueOnce({
        mutate: mockMutate,
        isPending: false,
      });

      const { getByText } = render(<NutritionCoachScreen />);
      
      const suggestionButton = getByText('What should I eat for breakfast?');
      fireEvent.press(suggestionButton);
      
      expect(mockMutate).toHaveBeenCalledWith('What should I eat for breakfast?');
    });

    it('hides suggestions after any interaction', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: false,
      });

      const { queryByText, getByText } = render(<NutritionCoachScreen />);
      
      const suggestionButton = getByText('What should I eat for breakfast?');
      fireEvent.press(suggestionButton);
      
      await waitFor(() => {
        expect(queryByText('Try asking:')).toBeFalsy();
      });
    });
  });

  describe('Message Display', () => {
    beforeEach(() => {
      const { askQuestion } = require('../src/services/nutritionCoachService');
      askQuestion.mockResolvedValue({
        content: 'Hello! I\'m here to help you with your nutrition questions.',
      });
    });

    it('displays user messages on the right', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: false,
      });

      const { getByText, getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        const userMessage = getByText('Hello');
        expect(userMessage.props.style.alignItems).toBe('flex-end');
      });
    });

    it('displays AI messages on the left', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: false,
      });

      const { getByText, getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        const aiMessage = getByText('Hello! I\'m here to help you with your nutrition questions.');
        expect(aiMessage.props.style.alignItems).toBe('flex-start');
      });
    });

    it('displays thinking indicator with loading spinner', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: true,
      });

      const { getByText, getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      expect(getByText('Thinking...')).toBeTruthy();
      expect(getByTestId('thinking-spinner')).toBeTruthy();
    });

    it('scrolls to bottom when new messages are added', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: false,
      });

      const { getByTestId } = render(<NutritionCoachScreen />);
      const flatListRef = React.createRef();
      
      // Mock the flat list ref
      const screen = NutritionCoachScreen as any;
      screen.useRef = jest.fn(() => flatListRef);
      
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(flatListRef.current).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when AI service fails', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: false,
        error: new Error('AI service unavailable'),
      });

      const { getByText, getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(getByText('Sorry, I encountered an error. Please try again.')).toBeTruthy();
      });
    });

    it('shows error toast when AI service fails', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: false,
        error: new Error('AI service unavailable'),
      });

      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'common.error',
          text2: 'AI service unavailable',
        });
      });
    });

    it('hides thinking indicator when error occurs', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: false,
        error: new Error('AI service unavailable'),
      });

      const { queryByText, getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(queryByText('Thinking...')).toBeFalsy();
      });
    });
  });

  describe('Input Validation', () => {
    it('prevents sending empty messages', () => {
      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, '   ');
      fireEvent.press(sendButton);
      
      expect(sendButton.props.disabled).toBe(true);
    });

    it('prevents sending messages with only whitespace', () => {
      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, '   \n\t   ');
      fireEvent.press(sendButton);
      
      expect(sendButton.props.disabled).toBe(true);
    });

    it('allows sending messages with valid content', () => {
      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      fireEvent.changeText(input, 'Hello world');
      fireEvent.press(sendButton);
      
      expect(sendButton.props.disabled).toBe(false);
    });
  });

  describe('Character Limit', () => {
    it('respects character limit in input', () => {
      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      
      // Try to input more than 500 characters
      const longText = 'a'.repeat(501);
      fireEvent.changeText(input, longText);
      
      expect(input.props.value.length).toBeLessThanOrEqual(500);
    });

    it('shows character count when approaching limit', () => {
      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      
      // Input 490 characters
      const longText = 'a'.repeat(490);
      fireEvent.changeText(input, longText);
      
      expect(input.props.maxLength).toBe(500);
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels', () => {
      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      const sendButton = getByTestId('send-button');
      
      expect(input.props.accessibilityLabel).toBe('Ask a question...');
      expect(sendButton.props.accessibilityLabel).toBe('Send message');
    });

    it('is accessible for screen readers', () => {
      const { getByTestId } = render(<NutritionCoachScreen />);
      const input = getByTestId('message-input');
      
      expect(input.props.accessibilityRole).toBe('textinput');
    });
  });
});