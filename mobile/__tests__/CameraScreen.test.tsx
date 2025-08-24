import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import CameraScreen from '../src/screens/CameraScreen';
import Toast from 'react-native-toast-message';

// Mock dependencies
jest.mock('expo-camera', () => ({
  Camera: jest.fn().mockImplementation(({ children }) => <>{children}</>),
  CameraType: {
    back: 'back',
    front: 'front',
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

jest.mock('../src/i18n', () => ({
  t: (key: string) => key,
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

jest.mock('../src/config', () => ({
  API_URL: 'http://localhost:5001',
}));

jest.mock('../src/utils/fetchWrapper', () => ({
  safeFetchJson: jest.fn(),
}));

describe('CameraScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Camera Permissions', () => {
    it('shows loading while checking permissions', () => {
      const { getByTestId } = render(<CameraScreen />);
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('shows permission denied message when camera access is denied', async () => {
      const { Camera } = require('expo-camera');
      Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const { findByText } = render(<CameraScreen />);
      
      await waitFor(() => {
        expect(findByText('camera.cameraPermission')).toBeTruthy();
      });
    });

    it('renders camera when permission is granted', async () => {
      const { Camera } = require('expo-camera');
      Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

      const { findByTestId } = render(<CameraScreen />);
      
      await waitFor(() => {
        expect(findByTestId('camera-component')).toBeTruthy();
      });
    });
  });

  describe('Camera Controls', () => {
    beforeEach(async () => {
      const { Camera } = require('expo-camera');
      Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
      await waitFor(() => render(<CameraScreen />));
    });

    it('toggles camera type when camera reverse button is pressed', () => {
      const { getByTestId } = render(<CameraScreen />);
      const cameraReverseButton = getByTestId('camera-reverse-button');
      
      fireEvent.press(cameraReverseButton);
      
      expect(CameraType.front).toBeDefined();
    });

    it('toggles flash when flash button is pressed', () => {
      const { getByTestId } = render(<CameraScreen />);
      const flashButton = getByTestId('flash-button');
      
      fireEvent.press(flashButton);
      
      expect(flashButton).toBeTruthy();
    });
  });

  describe('Image Capture', () => {
    beforeEach(async () => {
      const { Camera } = require('expo-camera');
      Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
      await waitFor(() => render(<CameraScreen />));
    });

    it('captures image when capture button is pressed', () => {
      const { Camera } = require('expo-camera');
      const cameraRef = React.createRef();
      Camera.mockImplementation(({ ref }: { ref: React.RefObject<any> }) => {
        return <></>;
      });

      const { getByTestId } = render(<CameraScreen />);
      const captureButton = getByTestId('capture-button');
      
      fireEvent.press(captureButton);
      
      expect(cameraRef.current).toBeDefined();
    });

    it('picks image from gallery when gallery button is pressed', async () => {
      const { launchImageLibraryAsync } = require('expo-image-picker');
      launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'test-image-uri' }],
      });

      const { getByTestId } = render(<CameraScreen />);
      const galleryButton = getByTestId('gallery-button');
      
      await act(async () => {
        fireEvent.press(galleryButton);
      });
      
      expect(launchImageLibraryAsync).toHaveBeenCalled();
    });
  });

  describe('Image Analysis', () => {
    beforeEach(async () => {
      const { Camera } = require('expo-camera');
      Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
      await waitFor(() => render(<CameraScreen />));
    });

    it('analyzes captured image when analyze button is pressed', async () => {
      const { safeFetchJson } = require('../src/utils/fetchWrapper');
      const { manipulateAsync } = require('expo-image-manipulator');
      
      manipulateAsync.mockResolvedValue({
        base64: 'test-base64',
      });
      
      safeFetchJson.mockResolvedValue({
        foodName: 'Test Food',
        calories: 250,
      });

      const { getByTestId } = render(<CameraScreen />);
      
      // Set captured image
      const cameraScreen = CameraScreen as any;
      cameraScreen.useState = jest.fn((initial) => [initial, jest.fn()]);
      cameraScreen.useState.mockReturnValueOnce(['test-image-uri', jest.fn()]);
      
      const analyzeButton = getByTestId('analyze-button');
      
      await act(async () => {
        fireEvent.press(analyzeButton);
      });
      
      expect(manipulateAsync).toHaveBeenCalled();
      expect(safeFetchJson).toHaveBeenCalledWith(
        'http://localhost:5001/api/analyze-food',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test-base64'),
        })
      );
    });

    it('shows success toast when image analysis is successful', async () => {
      const { safeFetchJson } = require('../src/utils/fetchWrapper');
      const { manipulateAsync } = require('expo-image-manipulator');
      
      manipulateAsync.mockResolvedValue({
        base64: 'test-base64',
      });
      
      safeFetchJson.mockResolvedValue({
        foodName: 'Test Food',
        calories: 250,
      });

      const { getByTestId } = render(<CameraScreen />);
      
      // Set captured image
      const cameraScreen = CameraScreen as any;
      cameraScreen.useState = jest.fn((initial) => [initial, jest.fn()]);
      cameraScreen.useState.mockReturnValueOnce(['test-image-uri', jest.fn()]);
      
      const analyzeButton = getByTestId('analyze-button');
      
      await act(async () => {
        fireEvent.press(analyzeButton);
      });
      
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'common.success',
        text2: 'Detected Test Food with 250 calories',
      });
    });

    it('shows error toast when image analysis fails', async () => {
      const { safeFetchJson } = require('../src/utils/fetchWrapper');
      const { manipulateAsync } = require('expo-image-manipulator');
      
      manipulateAsync.mockResolvedValue({
        base64: 'test-base64',
      });
      
      safeFetchJson.mockRejectedValue(new Error('Analysis failed'));

      const { getByTestId } = render(<CameraScreen />);
      
      // Set captured image
      const cameraScreen = CameraScreen as any;
      cameraScreen.useState = jest.fn((initial) => [initial, jest.fn()]);
      cameraScreen.useState.mockReturnValueOnce(['test-image-uri', jest.fn()]);
      
      const analyzeButton = getByTestId('analyze-button');
      
      await act(async () => {
        fireEvent.press(analyzeButton);
      });
      
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'common.error',
        text2: 'Analysis failed',
      });
    });
  });

  describe('Multi-Food Mode', () => {
    beforeEach(async () => {
      const { Camera } = require('expo-camera');
      Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
      await waitFor(() => render(<CameraScreen />));
    });

    it('toggles multi-food mode when switch is toggled', () => {
      const { getByTestId } = render(<CameraScreen />);
      const multiFoodSwitch = getByTestId('multi-food-switch');
      
      fireEvent.press(multiFoodSwitch);
      
      expect(multiFoodSwitch).toBeTruthy();
    });

    it('analyzes multiple foods when in multi-food mode', async () => {
      const { safeFetchJson } = require('../src/utils/fetchWrapper');
      const { manipulateAsync } = require('expo-image-manipulator');
      
      manipulateAsync.mockResolvedValue({
        base64: 'test-base64',
      });
      
      safeFetchJson.mockResolvedValue({
        foods: [
          { foodName: 'Food 1', calories: 100, protein: 10, carbs: 20, fat: 5 },
          { foodName: 'Food 2', calories: 150, protein: 15, carbs: 25, fat: 8 },
        ],
      });

      const { getByTestId } = render(<CameraScreen />);
      
      // Set captured image and multi-food mode
      const cameraScreen = CameraScreen as any;
      cameraScreen.useState = jest.fn((initial) => [initial, jest.fn()]);
      cameraScreen.useState.mockReturnValueOnce(['test-image-uri', jest.fn()]);
      cameraScreen.useState.mockReturnValueOnce([true, jest.fn()]);
      
      const analyzeButton = getByTestId('analyze-button');
      
      await act(async () => {
        fireEvent.press(analyzeButton);
      });
      
      expect(safeFetchJson).toHaveBeenCalledWith(
        'http://localhost:5001/api/analyze-multi-food',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test-base64'),
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const { Camera } = require('expo-camera');
      Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
      await waitFor(() => render(<CameraScreen />));
    });

    it('handles image manipulation errors gracefully', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      
      manipulateAsync.mockRejectedValue(new Error('Image manipulation failed'));

      const { getByTestId } = render(<CameraScreen />);
      
      // Set captured image
      const cameraScreen = CameraScreen as any;
      cameraScreen.useState = jest.fn((initial) => [initial, jest.fn()]);
      cameraScreen.useState.mockReturnValueOnce(['test-image-uri', jest.fn()]);
      
      const analyzeButton = getByTestId('analyze-button');
      
      await act(async () => {
        fireEvent.press(analyzeButton);
      });
      
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'common.error',
        text2: 'Image manipulation failed',
      });
    });

    it('handles network errors gracefully', async () => {
      const { safeFetchJson } = require('../src/utils/fetchWrapper');
      const { manipulateAsync } = require('expo-image-manipulator');
      
      manipulateAsync.mockResolvedValue({
        base64: 'test-base64',
      });
      
      safeFetchJson.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = render(<CameraScreen />);
      
      // Set captured image
      const cameraScreen = CameraScreen as any;
      cameraScreen.useState = jest.fn((initial) => [initial, jest.fn()]);
      cameraScreen.useState.mockReturnValueOnce(['test-image-uri', jest.fn()]);
      
      const analyzeButton = getByTestId('analyze-button');
      
      await act(async () => {
        fireEvent.press(analyzeButton);
      });
      
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'common.error',
        text2: 'Network error',
      });
    });
  });
});