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
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10">
              <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-neutral-800 mb-2">Analyzing Your Meal</h3>
                <p className="text-neutral-600 mb-4">Our AI is working on identifying your food and calculating nutritional information.</p>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 animate-pulse rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between w-full px-6 mb-4">
            <Button 
              variant="secondary"
              size="lg"
              className="rounded-full bg-white shadow-lg h-14 w-14 flex items-center justify-center"
              onClick={onClose}
              disabled={isAnalyzing}
            >
              <ArrowLeft className="h-7 w-7 text-neutral-900" />
            </Button>
            
            {!capturedImage ? (
              <Button 
                variant="default" 
                size="lg"
                className="rounded-full bg-primary-600 shadow-lg h-16 w-16 flex items-center justify-center"
                onClick={captureImage}
                disabled={!isCameraReady || isAnalyzing}
              >
                <Camera className="h-8 w-8 text-white" />
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="lg"
                className="rounded-full bg-primary-600 shadow-lg h-16 w-16 flex items-center justify-center"
                onClick={handleCapture}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Eye className="h-8 w-8 text-white" />
                )}
              </Button>
            )}
            <div className="w-14"></div> {/* Empty div for flex spacing */}
          </div>
          <div className="text-center text-white text-base font-medium mb-4 px-6 py-2 bg-black bg-opacity-40 rounded-full">
            {isAnalyzing ? "Analyzing your meal..." : "Position your meal in the frame"}
          </div>
        </div>
      </div>
    </div>
  );
}
