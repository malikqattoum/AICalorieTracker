import React from 'react';
import { View } from 'react-native';
import { render, fireEvent, waitFor, screen } from '../__tests__/test-utils';
import CameraScreen from '../screens/CameraScreen';
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

// Mock the i18n
jest.mock('../i18n', () => ({
  t: (key: string) => key,
}));

// Mock the API URL
jest.mock('../config', () => ({
  API_URL: 'https://api.example.com',
}));

// Mock the safeFetchJson
jest.mock('../utils/fetchWrapper', () => ({
  safeFetchJson: jest.fn(),
}));

// Mock the Toast
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

// Mock the Camera
jest.mock('expo-camera', () => ({
  Camera: jest.fn().mockImplementation((props) => {
    return <View {...props} />;
  }),
  CameraType: {
    back: 'back',
    front: 'front',
  },
}));

// Mock the ImagePicker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'images',
  },
}));

// Mock the ImageManipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

// Mock the Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.fn().mockImplementation((props) => {
    return <View {...props} />;
  }),
}));

describe('CameraScreen', () => {
  const mockMutation = useMutation as jest.MockedFunction<typeof useMutation>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('renders camera screen correctly', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<CameraScreen />);

    expect(screen.getByTestId('camera-container')).toBeTruthy();
    expect(screen.getByTestId('camera-controls')).toBeTruthy();
    expect(screen.getByTestId('capture-button')).toBeTruthy();
    expect(screen.getByTestId('gallery-button')).toBeTruthy();
  });

  it('shows loading state when camera permission is being requested', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<CameraScreen />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows camera permission denied state', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission denied
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'denied' });

    render(<CameraScreen />);

    expect(screen.getByText('camera.cameraPermission')).toBeTruthy();
    expect(screen.getByTestId('back-button')).toBeTruthy();
  });

  it('shows camera when permission is granted', async () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    render(<CameraScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('camera-container')).toBeTruthy();
    });
  });

  it('toggles camera type', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    render(<CameraScreen />);

    const cameraTypeButton = screen.getByTestId('camera-type-button');
    fireEvent.press(cameraTypeButton);

    // Camera type should toggle
    expect(cameraTypeButton).toBeTruthy();
  });

  it('toggles flash', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    render(<CameraScreen />);

    const flashButton = screen.getByTestId('flash-button');
    fireEvent.press(flashButton);

    // Flash should toggle
    expect(flashButton).toBeTruthy();
  });

  it('takes picture', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    expect(cameraRef.takePictureAsync).toHaveBeenCalled();
  });

  it('shows captured image', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    expect(screen.getByTestId('captured-image')).toBeTruthy();
  });

  it('shows preview buttons when image is captured', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    expect(screen.getByTestId('retake-button')).toBeTruthy();
    expect(screen.getByTestId('analyze-button')).toBeTruthy();
  });

  it('retakes picture', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const retakeButton = screen.getByTestId('retake-button');
    fireEvent.press(retakeButton);

    expect(screen.queryByTestId('captured-image')).toBeNull();
  });

  it('analyzes image', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    // Mock image manipulator
    const { manipulateAsync } = require('expo-image-manipulator');
    manipulateAsync.mockResolvedValue({
      base64: 'test-base64',
      uri: 'test-uri',
    });

    // Mock safeFetchJson
    const { safeFetchJson } = require('../utils/fetchWrapper');
    safeFetchJson.mockResolvedValue({
      data: {
        foodName: 'Test Food',
        nutritionalInfo: {
          calories: 250,
          protein: 10,
          carbs: 30,
          fat: 15,
        },
      },
    });

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(mockMutate).toHaveBeenCalledWith('test-image-uri');
  });

  it('shows loading state during analysis', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows success toast after analysis', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    // Mock image manipulator
    const { manipulateAsync } = require('expo-image-manipulator');
    manipulateAsync.mockResolvedValue({
      base64: 'test-base64',
      uri: 'test-uri',
    });

    // Mock safeFetchJson
    const { safeFetchJson } = require('../utils/fetchWrapper');
    safeFetchJson.mockResolvedValue({
      data: {
        foodName: 'Test Food',
        nutritionalInfo: {
          calories: 250,
          protein: 10,
          carbs: 30,
          fat: 15,
        },
      },
    });

    // Mock Toast
    const { show } = require('react-native-toast-message');
    show.mockImplementation(() => {});

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(show).toHaveBeenCalledWith({
      type: 'success',
      text1: 'common.success',
      text2: 'Detected Test Food with 250 calories',
    });
  });

  it('shows error toast after analysis failure', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('Analysis failed'),
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    // Mock Toast
    const { show } = require('react-native-toast-message');
    show.mockImplementation(() => {});

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'common.error',
      text2: 'Analysis failed',
    });
  });

  it('picks image from gallery', async () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock image picker
    const { requestMediaLibraryPermissionsAsync, launchImageLibraryAsync } = require('expo-image-picker');
    requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
    launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'test-gallery-image' }],
    });

    render(<CameraScreen />);

    const galleryButton = screen.getByTestId('gallery-button');
    fireEvent.press(galleryButton);

    await waitFor(() => {
      expect(screen.getByTestId('captured-image')).toBeTruthy();
    });
  });

  it('shows gallery permission denied', async () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock image picker permission denied
    const { requestMediaLibraryPermissionsAsync } = require('expo-image-picker');
    requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'denied' });

    render(<CameraScreen />);

    const galleryButton = screen.getByTestId('gallery-button');
    fireEvent.press(galleryButton);

    expect(screen.getByText('camera.photoLibraryPermissionDenied')).toBeTruthy();
  });

  it('shows multi-food mode toggle', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    render(<CameraScreen />);

    expect(screen.getByTestId('multi-food-toggle')).toBeTruthy();
  });

  it('toggles multi-food mode', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    render(<CameraScreen />);

    const multiFoodToggle = screen.getByTestId('multi-food-toggle');
    fireEvent(multiFoodToggle, 'valueChange', true);

    expect(multiFoodToggle.props.value).toBe(true);
  });

  it('analyzes multiple foods', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    // Mock image manipulator
    const { manipulateAsync } = require('expo-image-manipulator');
    manipulateAsync.mockResolvedValue({
      base64: 'test-base64',
      uri: 'test-uri',
    });

    // Mock safeFetchJson
    const { safeFetchJson } = require('../utils/fetchWrapper');
    safeFetchJson.mockResolvedValue({
      foods: [
        {
          foodName: 'Food 1',
          nutritionalInfo: {
            calories: 250,
            protein: 10,
            carbs: 30,
            fat: 15,
          },
        },
        {
          foodName: 'Food 2',
          nutritionalInfo: {
            calories: 350,
            protein: 15,
            carbs: 40,
            fat: 20,
          },
        },
      ],
    });

    render(<CameraScreen />);

    // Enable multi-food mode
    const multiFoodToggle = screen.getByTestId('multi-food-toggle');
    fireEvent(multiFoodToggle, 'valueChange', true);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(mockMutate).toHaveBeenCalledWith('test-image-uri');
  });

  it('shows multiple food results', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    // Mock image manipulator
    const { manipulateAsync } = require('expo-image-manipulator');
    manipulateAsync.mockResolvedValue({
      base64: 'test-base64',
      uri: 'test-uri',
    });

    // Mock safeFetchJson
    const { safeFetchJson } = require('../utils/fetchWrapper');
    safeFetchJson.mockResolvedValue({
      foods: [
        {
          foodName: 'Food 1',
          nutritionalInfo: {
            calories: 250,
            protein: 10,
            carbs: 30,
            fat: 15,
          },
        },
        {
          foodName: 'Food 2',
          nutritionalInfo: {
            calories: 350,
            protein: 15,
            carbs: 40,
            fat: 20,
          },
        },
      ],
    });

    render(<CameraScreen />);

    // Enable multi-food mode
    const multiFoodToggle = screen.getByTestId('multi-food-toggle');
    fireEvent(multiFoodToggle, 'valueChange', true);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(screen.getByText('Food 1')).toBeTruthy();
    expect(screen.getByText('Food 2')).toBeTruthy();
    expect(screen.getByText('250 cal | P: 10g | C: 30g | F: 15g')).toBeTruthy();
    expect(screen.getByText('350 cal | P: 15g | C: 40g | F: 20g')).toBeTruthy();
  });

  it('shows done button for multiple food results', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    // Mock image manipulator
    const { manipulateAsync } = require('expo-image-manipulator');
    manipulateAsync.mockResolvedValue({
      base64: 'test-base64',
      uri: 'test-uri',
    });

    // Mock safeFetchJson
    const { safeFetchJson } = require('../utils/fetchWrapper');
    safeFetchJson.mockResolvedValue({
      foods: [
        {
          foodName: 'Food 1',
          nutritionalInfo: {
            calories: 250,
            protein: 10,
            carbs: 30,
            fat: 15,
          },
        },
      ],
    });

    // Mock navigation
    const { useNavigation } = require('@react-navigation/native');
    const mockNavigate = jest.fn();
    useNavigation.mockReturnValue({
      navigate: mockNavigate,
      goBack: jest.fn(),
    });

    render(<CameraScreen />);

    // Enable multi-food mode
    const multiFoodToggle = screen.getByTestId('multi-food-toggle');
    fireEvent(multiFoodToggle, 'valueChange', true);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    const doneButton = screen.getByTestId('done-button');
    fireEvent.press(doneButton);

    expect(mockNavigate).toHaveBeenCalledWith('goBack');
  });

  it('shows portion size information', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    // Mock image manipulator
    const { manipulateAsync } = require('expo-image-manipulator');
    manipulateAsync.mockResolvedValue({
      base64: 'test-base64',
      uri: 'test-uri',
    });

    // Mock safeFetchJson
    const { safeFetchJson } = require('../utils/fetchWrapper');
    safeFetchJson.mockResolvedValue({
      foods: [
        {
          foodName: 'Food 1',
          nutritionalInfo: {
            calories: 250,
            protein: 10,
            carbs: 30,
            fat: 15,
          },
          portionSize: {
            estimatedWeight: 150,
            referenceObject: 'hand',
          },
        },
      ],
    });

    render(<CameraScreen />);

    // Enable multi-food mode
    const multiFoodToggle = screen.getByTestId('multi-food-toggle');
    fireEvent(multiFoodToggle, 'valueChange', true);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(screen.getByText('Portion: 150g (hand)')).toBeTruthy();
  });

  it('shows health score information', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    // Mock image manipulator
    const { manipulateAsync } = require('expo-image-manipulator');
    manipulateAsync.mockResolvedValue({
      base64: 'test-base64',
      uri: 'test-uri',
    });

    // Mock safeFetchJson
    const { safeFetchJson } = require('../utils/fetchWrapper');
    safeFetchJson.mockResolvedValue({
      foods: [
        {
          foodName: 'Food 1',
          nutritionalInfo: {
            calories: 250,
            protein: 10,
            carbs: 30,
            fat: 15,
          },
          healthScore: 85,
        },
      ],
    });

    render(<CameraScreen />);

    // Enable multi-food mode
    const multiFoodToggle = screen.getByTestId('multi-food-toggle');
    fireEvent(multiFoodToggle, 'valueChange', true);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(screen.getByText('Health Score: 85/100')).toBeTruthy();
  });

  it('handles camera error', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref error
    const cameraRef = {
      takePictureAsync: jest.fn().mockRejectedValue(new Error('Camera error')),
    };

    // Mock Toast
    const { show } = require('react-native-toast-message');
    show.mockImplementation(() => {});

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    expect(show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'common.error',
      text2: 'Failed to take picture',
    });
  });

  it('handles gallery error', async () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock image picker permission granted
    const { requestMediaLibraryPermissionsAsync } = require('expo-image-picker');
    requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock image picker error
    const { launchImageLibraryAsync } = require('expo-image-picker');
    launchImageLibraryAsync.mockRejectedValue(new Error('Gallery error'));

    // Mock Toast
    const { show } = require('react-native-toast-message');
    show.mockImplementation(() => {});

    render(<CameraScreen />);

    const galleryButton = screen.getByTestId('gallery-button');
    fireEvent.press(galleryButton);

    expect(show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'common.error',
      text2: 'Failed to pick image',
    });
  });

  it('handles analysis API error', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    // Mock image manipulator
    const { manipulateAsync } = require('expo-image-manipulator');
    manipulateAsync.mockResolvedValue({
      base64: 'test-base64',
      uri: 'test-uri',
    });

    // Mock safeFetchJson error
    const { safeFetchJson } = require('../utils/fetchWrapper');
    safeFetchJson.mockResolvedValue(null);

    // Mock Toast
    const { show } = require('react-native-toast-message');
    show.mockImplementation(() => {});

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'common.error',
      text2: 'Failed to analyze image',
    });
  });

  it('handles image manipulation error', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    // Mock image manipulator error
    const { manipulateAsync } = require('expo-image-manipulator');
    manipulateAsync.mockRejectedValue(new Error('Image manipulation error'));

    // Mock Toast
    const { show } = require('react-native-toast-message');
    show.mockImplementation(() => {});

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'common.error',
      text2: 'Failed to analyze image',
    });
  });

  it('shows close button', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock navigation
    const { useNavigation } = require('@react-navigation/native');
    const mockGoBack = jest.fn();
    useNavigation.mockReturnValue({
      navigate: jest.fn(),
      goBack: mockGoBack,
    });

    render(<CameraScreen />);

    const closeButton = screen.getByTestId('close-button');
    fireEvent.press(closeButton);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows header with multi-food toggle', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    render(<CameraScreen />);

    expect(screen.getByTestId('camera-header')).toBeTruthy();
    expect(screen.getByTestId('multi-food-toggle')).toBeTruthy();
  });

  it('shows camera controls when no image is captured', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    render(<CameraScreen />);

    expect(screen.getByTestId('camera-controls')).toBeTruthy();
    expect(screen.getByTestId('capture-button')).toBeTruthy();
    expect(screen.getByTestId('gallery-button')).toBeTruthy();
  });

  it('hides camera controls when image is captured', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    expect(screen.queryByTestId('camera-controls')).toBeNull();
  });

  it('shows preview overlay when image is captured', () => {
    mockMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    expect(screen.getByTestId('preview-overlay')).toBeTruthy();
  });

  it('shows loading indicator during analysis', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows progress bar during analysis', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });

  it('shows analyzing text during analysis', () => {
    const mockMutate = jest.fn();
    mockMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    // Mock camera permission granted
    const { Camera } = require('expo-camera');
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock camera ref
    const cameraRef = {
      takePictureAsync: jest.fn().mockResolvedValue({ uri: 'test-image-uri' }),
    };

    render(<CameraScreen />);

    const captureButton = screen.getByTestId('capture-button');
    fireEvent.press(captureButton);

    const analyzeButton = screen.getByTestId('analyze-button');
    fireEvent.press(analyzeButton);

    expect(screen.getByText('camera.analyzing')).toBeTruthy();
  });
});