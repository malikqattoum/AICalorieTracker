import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2 } from "lucide-react";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useCamera } from "@/hooks/use-camera";
import { CameraView } from "@/components/camera/camera-view";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MealAnalysis } from "@shared/schema";
import { Switch } from "@/components/ui/switch";

export function CameraUploadCard() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [multiFoodMode, setMultiFoodMode] = useState(false);
  const [multiFoodResult, setMultiFoodResult] = useState<any | null>(null);
  const {
    isOpen: isCameraOpen,
    capturedImage,
    openCamera,
    closeCamera
  } = useCamera();

  const analyzeImageMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const res = await apiRequest("POST", "/api/analyze-food", { imageData });
      return res.json();
    },
    onSuccess: (analysis: MealAnalysis) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-analyses"] });
      toast({
        title: "Analysis complete!",
        description: `Detected ${analysis.foodName} with ${analysis.calories} calories.`,
      });
      setUploadedImage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setUploadedImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const analyzeImage = () => {
    if (!uploadedImage && !capturedImage) return;
    setMultiFoodResult(null);
    if (multiFoodMode) {
      analyzeMultiFood(uploadedImage || capturedImage!);
    } else {
      analyzeImageMutation.mutate(uploadedImage || capturedImage!);
    }
  };

  const analyzeMultiFood = async (imageData: string) => {
    try {
      const res = await apiRequest("POST", "/api/analyze-multi-food", { imageData });
      const data = await res.json();
      setMultiFoodResult(data);
      toast({
        title: "Multi-Food Analysis complete!",
        description: `Detected ${data.foods.length} foods in the image.`,
      });
      setUploadedImage(null);
    } catch (error: any) {
      toast({
        title: "Multi-Food Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isLoading = analyzeImageMutation.isPending;

  useEffect(() => {
    if (isCameraOpen && capturedImage) {
      setUploadedImage(capturedImage);
    }
    // If camera is closed, clear uploadedImage if it was set by camera
    if (!isCameraOpen && uploadedImage === capturedImage) {
      setUploadedImage(null);
    }
  }, [isCameraOpen, capturedImage]);

  return (
    <>
      <Card className="card-gradient hover-effect rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-neutral-200 flex flex-col gap-2">
          <CardTitle className="text-xl font-semibold text-neutral-800">Scan Your Meal</CardTitle>
          <div className="flex items-center gap-2">
            <Switch checked={multiFoodMode} onCheckedChange={setMultiFoodMode} id="multi-food-switch" />
            <label htmlFor="multi-food-switch" className="text-sm text-neutral-500 cursor-pointer">Multi-Food Recognition</label>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative bg-neutral-100 rounded-lg overflow-hidden" style={{ minHeight: "300px" }}>
            {uploadedImage ? (
              <div className="absolute inset-0">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded meal" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <div className="flex flex-col items-center p-4 space-y-4">
                    <Button onClick={analyzeImage} disabled={isLoading} className="border border-neutral-100 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2 h-12 text-base">
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Analyze Image"
                      )}
                    </Button>
                    <Button variant="secondary" onClick={resetUpload} disabled={isLoading} className="font-medium">
                      Cancel
                    </Button>
                    {isLoading && (
                      <div className="mt-2 text-white text-center">
                        <p className="mb-2">AI is analyzing your meal</p>
                        <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 animate-pulse rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-neutral-600 font-medium mb-2">Take a photo or upload an image of your meal</p>
                <p className="text-neutral-500 text-sm">Supported formats: JPG, PNG</p>
              </div>
            )}

            <div className="absolute bottom-0 inset-x-0 p-6 flex justify-center space-x-4">
              <Button 
                onClick={handleUploadClick} 
                variant="outline" 
                className="inline-flex items-center px-4 py-2.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50"
                disabled={isLoading}
              >
                <Upload className="h-5 w-5 mr-2 text-neutral-500" />
                Upload Photo
              </Button>

              <Button 
                onClick={openCamera}
                className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm bg-primary hover:bg-primary-700"
                disabled={isLoading}
              >
                <Camera className="h-5 w-5 mr-2" />
                Take Photo
              </Button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg, image/png"
                className="hidden"
              />
            </div>
          </div>

          {multiFoodResult && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Detected Foods</h3>
              <ul className="divide-y divide-neutral-200">
                {multiFoodResult.foods.map((food: any, idx: number) => (
                  <li key={idx} className="py-3">
                    <div className="font-medium text-neutral-900">{food.foodName}</div>
                    <div className="text-sm text-neutral-600 flex gap-4">
                      <span>Calories: {food.calories}</span>
                      <span>Protein: {food.protein}g</span>
                      <span>Carbs: {food.carbs}g</span>
                      <span>Fat: {food.fat}g</span>
                      <span>Fiber: {food.fiber}g</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {isCameraOpen && (
        <CameraView
          onCapture={() => {
            // CameraView handles capture and sets capturedImage in useCamera
            // The effect below will set uploadedImage when capturedImage is set
            closeCamera();
          }}
          onClose={closeCamera}
          isAnalyzing={isLoading}
        />
      )}
    </>
  );
}