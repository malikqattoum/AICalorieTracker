import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../config';
import { safeFetchJson } from '../utils/fetchWrapper';

export default function CameraScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [flash, setFlash] = useState(0); // 0 for off, 1 for on
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [multiFoodMode, setMultiFoodMode] = useState(false);
  const [multiFoodResult, setMultiFoodResult] = useState<any | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  // Request camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          i18n.t('common.error'),
          i18n.t('camera.cameraPermissionDenied'),
          [{ text: i18n.t('common.ok') }]
        );
      }
    })();
  }, []);

  // Analyze image mutation
  const analyzeImageMutation = useMutation({
    mutationFn: async (imageUri: string) => {
      // Convert image to base64
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      const imageData = `data:image/jpeg;base64,${manipResult.base64}`;
      
      // Call enhanced API based on mode
      const endpoint = multiFoodMode
        ? '/api/user/enhanced-food-recognition/analyze-multi'
        : '/api/user/enhanced-food-recognition/analyze-single';
      
      const options = {
        enablePortionEstimation: true,
        enable3DEstimation: false,
        confidenceThreshold: 0.7,
        referenceObjects: ['hand', 'credit_card', 'smartphone'],
        restaurantMode: false
      };
      
      const data = await safeFetchJson(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData, options }),
      });
      
      if (data === null) {
        throw new Error('Failed to analyze image');
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (multiFoodMode) {
        setMultiFoodResult(data);
        Toast.show({
          type: 'success',
          text1: i18n.t('common.success'),
          text2: `Detected ${data.foods?.length || 0} foods in the image`,
        });
      } else {
        // Invalidate queries to refresh meal history
        // queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
        
        const foodData = data.data || data;
        Toast.show({
          type: 'success',
          text1: i18n.t('common.success'),
          text2: `Detected ${foodData.foodName} with ${foodData.nutritionalInfo?.calories || 0} calories`,
        });
        
        // Navigate back
        navigation.goBack();
      }
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: i18n.t('common.error'),
        text2: error.message,
      });
    },
  });

  // Take picture
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo.uri);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: i18n.t('common.error'),
          text2: 'Failed to take picture',
        });
      }
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          i18n.t('common.error'),
          i18n.t('camera.photoLibraryPermissionDenied'),
          [{ text: i18n.t('common.ok') }]
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: i18n.t('common.error'),
        text2: 'Failed to pick image',
      });
    }
  };

  // Analyze image
  const analyzeImage = () => {
    if (capturedImage) {
      analyzeImageMutation.mutate(capturedImage);
    }
  };

  // Reset capture
  const resetCapture = () => {
    setCapturedImage(null);
    setMultiFoodResult(null);
  };

  // Toggle camera type
  const toggleCameraType = () => {
    setCameraType(current => (
      current === CameraType.back ? CameraType.front : CameraType.back
    ));
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlash(current => (
      current === 0 ? 1 : 0
    ));
  };

  // If permission not granted
  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          {i18n.t('camera.cameraPermission')}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>{i18n.t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>{i18n.t('camera.multiFood')}</Text>
          <Switch
            value={multiFoodMode}
            onValueChange={setMultiFoodMode}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor="white"
          />
        </View>
      </View>

      {/* Camera or Image Preview */}
      {capturedImage ? (
        <View style={styles.preview}>
          <Image
            source={{ uri: capturedImage }}
            style={styles.previewImage}
          />
          
          {/* Overlay with buttons */}
          <View style={styles.previewOverlay}>
            {analyzeImageMutation.isPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>
                  {i18n.t('camera.analyzing')}
                </Text>
                <View style={styles.progressBar}>
                  <View style={styles.progressIndicator} />
                </View>
              </View>
            ) : (
              <View style={styles.previewButtons}>
                <TouchableOpacity
                  style={[styles.previewButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                  onPress={resetCapture}
                >
                  <Text style={styles.previewButtonText}>{i18n.t('camera.retake')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.previewButton, { backgroundColor: colors.primary }]}
                  onPress={analyzeImage}
                >
                  <Text style={styles.previewButtonText}>{i18n.t('camera.analyzeImage')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      ) : (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={cameraType}
          flashMode={flash}
          ratio="4:3"
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={toggleFlash}
            >
              <Ionicons
                name={flash === 1 ? 'flash' : 'flash-off'}
                size={24}
                color="white"
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={toggleCameraType}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Camera>
      )}

      {/* Bottom Controls */}
      {!capturedImage && !analyzeImageMutation.isPending && (
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={pickImage}
          >
            <Ionicons name="images-outline" size={28} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <View style={styles.placeholder} />
        </View>
      )}

      {/* Multi-food results */}
      {multiFoodResult && (
        <View style={[styles.resultsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.resultsTitle, { color: colors.text }]}>
            {i18n.t('camera.detectedFoods')}
          </Text>
          
          {(multiFoodResult.foods || []).map((food: any, index: number) => (
            <View key={index} style={styles.foodItem}>
              <Text style={[styles.foodName, { color: colors.text }]}>
                {food.foodName}
              </Text>
              <Text style={[styles.foodCalories, { color: colors.gray }]}>
                {food.nutritionalInfo?.calories || 0} cal | P: {food.nutritionalInfo?.protein || 0}g | C: {food.nutritionalInfo?.carbs || 0}g | F: {food.nutritionalInfo?.fat || 0}g
              </Text>
              {food.portionSize && (
                <Text style={[styles.portionInfo, { color: colors.gray }]}>
                  Portion: {food.portionSize.estimatedWeight}g ({food.portionSize.referenceObject})
                </Text>
              )}
              {food.healthScore && (
                <Text style={[styles.healthScore, { color: colors.gray }]}>
                  Health Score: {food.healthScore}/100
                </Text>
              )}
            </View>
          ))}
          
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>{i18n.t('common.done')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  switchLabel: {
    color: 'white',
    marginRight: 8,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
    alignItems: 'center',
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000',
  },
  placeholder: {
    width: 50,
    height: 50,
  },
  preview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  previewButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressIndicator: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
    transform: [{ translateX: -100 }],
    opacity: 0.8,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
    fontFamily: 'Inter-Regular',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  resultsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  foodItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  foodCalories: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  portionInfo: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  healthScore: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
});