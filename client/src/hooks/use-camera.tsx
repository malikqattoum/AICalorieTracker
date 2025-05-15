import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

type CameraHookResult = {
  webcamRef: React.RefObject<Webcam>;
  isOpen: boolean;
  isCameraReady: boolean;
  capturedImage: string | null;
  error: string | null;
  openCamera: () => void;
  closeCamera: () => void;
  captureImage: () => void;
  resetImage: () => void;
};

export function useCamera(): CameraHookResult {
  const webcamRef = useRef<Webcam>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openCamera = useCallback(() => {
    setIsOpen(true);
    setError(null);
  }, []);

  const closeCamera = useCallback(() => {
    setIsOpen(false);
    setIsCameraReady(false);
    setCapturedImage(null);
    setError(null);
  }, []);

  const handleUserMedia = useCallback(() => {
    setIsCameraReady(true);
    setError(null);
  }, []);

  const handleError = useCallback((err: string | DOMException) => {
    console.error("Camera error:", err);
    setError(typeof err === 'string' ? err : 'Failed to access camera');
    setIsCameraReady(false);
  }, []);

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
      } else {
        setError("Failed to capture image");
      }
    } else {
      setError("Camera not initialized");
    }
  }, [webcamRef]);

  const resetImage = useCallback(() => {
    setCapturedImage(null);
  }, []);

  return {
    webcamRef,
    isOpen,
    isCameraReady,
    capturedImage,
    error,
    openCamera,
    closeCamera,
    captureImage,
    resetImage
  };
}
