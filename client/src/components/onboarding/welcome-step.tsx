import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Sparkles, ArrowRight } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding-page";

interface WelcomeStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onStepCompleted: () => void;
  onNext: () => void;
  isCompleted: boolean;
}

export default function WelcomeStep({ onStepCompleted, onNext }: WelcomeStepProps) {
  useEffect(() => {
    // Auto-complete this step since it's just informational
    onStepCompleted();
  }, [onStepCompleted]);

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      {/* App Branding */}
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative">
            <Leaf className="h-16 w-16 text-primary-600" />
            <Sparkles className="h-6 w-6 text-primary-400 absolute -top-1 -right-1" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-neutral-900">Welcome to NutriScan</h1>
        <p className="text-xl text-primary-600 font-medium">
          Track smarter, eat better with AI.
        </p>
      </div>

      {/* Welcome Content */}
      <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-200">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold">1</span>
              </div>
              <p className="text-left text-neutral-700">
                Set up your personal profile for AI-powered nutrition recommendations
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold">2</span>
              </div>
              <p className="text-left text-neutral-700">
                Choose your health goals and dietary preferences
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold">3</span>
              </div>
              <p className="text-left text-neutral-700">
                Get personalized meal suggestions and nutrition insights
              </p>
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={onNext}
              size="lg"
              className="w-full flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-neutral-500">
        This will only take 2-3 minutes to complete
      </p>
    </div>
  );
}