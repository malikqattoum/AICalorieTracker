import { useCamera } from "@/hooks/use-camera";
import Webcam from "react-webcam";
import { Eye, Camera, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface CameraViewProps {
  onCapture: () => void;
  onClose: () => void;
  isAnalyzing: boolean;
}

export function CameraView({ onCapture, onClose, isAnalyzing }: CameraViewProps) {
  const {
    webcamRef,
    isCameraReady,
    capturedImage,
    error,
    captureImage,
    resetImage
  } = useCamera();

  // Set width and height constraints for better performance
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment"
  };

  // Auto-close the camera view when isAnalyzing changes from true to false (analysis completed)
  useEffect(() => {
    if (!isAnalyzing && capturedImage) {
      onClose();
    }
  }, [isAnalyzing, capturedImage, onClose]);

  const handleCapture = () => {
    captureImage();
    onCapture();
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative h-full">
        {!capturedImage ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="h-full w-full object-cover"
              onUserMedia={() => {}}
              onUserMediaError={() => {}}
            />

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
                <div className="text-white text-center p-4">
                  <p className="mb-4">{error}</p>
                  <Button variant="default" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-full w-full">
            <img src={capturedImage} alt="Captured meal" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="camera-overlay">
          <div className="flex space-x-4 mb-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-white h-12 w-12"
              onClick={onClose}
              disabled={isAnalyzing}
            >
              <ArrowLeft className="h-6 w-6 text-neutral-900" />
            </Button>
            
            {!capturedImage ? (
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-white h-12 w-12"
                onClick={captureImage}
                disabled={!isCameraReady || isAnalyzing}
              >
                <Camera className="h-6 w-6 text-primary-600" />
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-white h-12 w-12"
                onClick={handleCapture}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
                ) : (
                  <Eye className="h-6 w-6 text-primary-600" />
                )}
              </Button>
            )}
          </div>
          <div className="text-center text-white text-sm mb-2">
            {isAnalyzing ? "Analyzing your meal..." : "Position your meal in the frame"}
          </div>
        </div>
      </div>
    </div>
  );
}
