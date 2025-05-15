import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Leaf, Camera, Upload, Loader2, Info, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { NutritionChart } from "@/components/dashboard/nutrition-chart";

export default function TryItPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [tryItContent, setTryItContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const analyzeImageMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const res = await apiRequest("POST", "/api/demo-analyze", { imageData });
      return res.json();
    },
    onSuccess: (result) => {
      setAnalysisResult(result);
      toast({
        title: "Analysis complete!",
        description: `Detected ${result.foodName} with ${result.calories} calories.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/content/try-it")
      .then(r => r.json())
      .then(data => {
        setTryItContent(data.value);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
    if (uploadedImage) {
      analyzeImageMutation.mutate(uploadedImage);
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isLoading = analyzeImageMutation.isPending;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-neutral-800">NutriScan</span>
            </div>
            
            <nav className="hidden md:flex space-x-8 items-center">
              <Link href="/" className="text-neutral-700 hover:text-primary-600 font-medium">
                Home
              </Link>
              <Link href="/try-it" className="text-primary-600 font-medium">
                Try It Free
              </Link>
              <Link href="/pricing" className="text-neutral-700 hover:text-primary-600 font-medium">
                Pricing
              </Link>
            </nav>
            
            <div className="flex items-center">
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {/* Title Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Try NutriScan for Free
            </h1>
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
              Upload a food image to see how our AI instantly analyzes the nutritional content.
              No account required!
            </p>
            
            <div className="flex justify-center">
              <Link href="/">
                <Button variant="outline" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Upload Section */}
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-neutral-200">
                    <h2 className="text-xl font-semibold text-neutral-800">
                      {loading ? "Loading..." : (tryItContent || "Upload a Food Image")}
                    </h2>
                    <p className="text-neutral-600 text-sm mt-1">
                      {loading ? "" : (tryItContent ? null : "Take a photo or select an image of your meal")}
                    </p>
                  </div>
                  
                  <div className="p-6">
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
                              <Button onClick={analyzeImage} disabled={isLoading} className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2 h-12 text-base">
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
                          className="inline-flex items-center px-4 py-2.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-primary"
                          disabled={isLoading}
                        >
                          <Upload className="h-5 w-5 mr-2 text-neutral-500" />
                          Upload Photo
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
                    
                    <div className="mt-4 flex items-center p-3 bg-primary-50 rounded-lg">
                      <Info className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                      <p className="text-sm text-neutral-700">
                        This is a demo version with limited features. <Link href="/auth" className="text-primary-600 font-medium">Sign up</Link> for full access.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Results Section */}
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden h-full">
                  <div className="px-6 py-5 border-b border-neutral-200">
                    <h2 className="text-xl font-semibold text-neutral-800">Analysis Results</h2>
                    <p className="text-neutral-600 text-sm mt-1">
                      See the nutritional breakdown of your meal
                    </p>
                  </div>
                  
                  <div className="p-6">
                    {analysisResult ? (
                      <div>
                        <div className="mb-6">
                          <h3 className="text-xl font-semibold text-neutral-900 mb-1">{analysisResult.foodName}</h3>
                          <div className="inline-flex items-center bg-primary-50 text-primary-800 py-1 px-3 rounded-full text-sm font-medium">
                            <span>{analysisResult.calories} calories</span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-neutral-700">Protein</span>
                              <span className="text-sm text-neutral-600">{analysisResult.protein}g</span>
                            </div>
                            <NutritionChart 
                              value={analysisResult.protein} 
                              maxValue={50} 
                              color="bg-chart-1" 
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-neutral-700">Carbs</span>
                              <span className="text-sm text-neutral-600">{analysisResult.carbs}g</span>
                            </div>
                            <NutritionChart 
                              value={analysisResult.carbs} 
                              maxValue={100} 
                              color="bg-chart-2" 
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-neutral-700">Fat</span>
                              <span className="text-sm text-neutral-600">{analysisResult.fat}g</span>
                            </div>
                            <NutritionChart 
                              value={analysisResult.fat} 
                              maxValue={40} 
                              color="bg-chart-3" 
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-neutral-700">Fiber</span>
                              <span className="text-sm text-neutral-600">{analysisResult.fiber}g</span>
                            </div>
                            <NutritionChart 
                              value={analysisResult.fiber} 
                              maxValue={20} 
                              color="bg-chart-4" 
                            />
                          </div>
                        </div>
                        
                        <div className="mt-8 text-center">
                          <Link href="/auth">
                            <Button className="bg-primary-600 hover:bg-primary-700">
                              Sign Up for Full Access
                            </Button>
                          </Link>
                          <p className="mt-2 text-sm text-neutral-500">
                            Create an account to save and track your meal history
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-12">
                        <div className="bg-neutral-100 rounded-full p-6 mb-4">
                          <Leaf className="h-12 w-12 text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">No Analysis Yet</h3>
                        <p className="text-neutral-600 max-w-sm mb-6">
                          Upload a food image and click "Analyze Image" to see the nutritional information of your meal
                        </p>
                        <div className="flex space-x-4">
                          <Link href="/auth">
                            <Button variant="outline">
                              Sign Up
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-12 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Unlock Full Features with a Free Account
              </h2>
              <p className="text-neutral-600 max-w-2xl mx-auto">
                Sign up to access all the powerful features of NutriScan
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Camera className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-900 mb-2">Save Your History</h3>
                  <p className="text-neutral-600">
                    Track all your meals over time and monitor your nutritional trends
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary-600">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-900 mb-2">Weekly Statistics</h3>
                  <p className="text-neutral-600">
                    Get detailed weekly reports with insights about your nutritional intake
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary-600">
                      <path d="M12 2v8L7 5" />
                      <circle cx="12" cy="14" r="8" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-900 mb-2">Smart Recommendations</h3>
                  <p className="text-neutral-600">
                    Receive personalized nutrition tips based on your eating habits
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center mt-10">
              <Link href="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary-700 text-primary-100">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}