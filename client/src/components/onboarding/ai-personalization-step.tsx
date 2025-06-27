import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Bot, ChefHat, MessageCircle, Lightbulb, TrendingUp } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding-page";

const AI_ASSISTANT_NAMES = [
  'NutriBot', 'ChefAI', 'HealthyHelper', 'WellnessWiz', 'FitFriend', 'NutritionNinja'
];

interface AIPersonalizationStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onStepCompleted: () => void;
  onNext: () => void;
  isCompleted: boolean;
}

export default function AIPersonalizationStep({ 
  data, 
  updateData, 
  onStepCompleted, 
  onNext,
  isCompleted 
}: AIPersonalizationStepProps) {
  const [aiMealSuggestions, setAiMealSuggestions] = useState(
    data.aiMealSuggestions !== undefined ? data.aiMealSuggestions : true
  );
  const [aiChatAssistantName, setAiChatAssistantName] = useState(
    data.aiChatAssistantName || ''
  );

  const handleToggleMealSuggestions = (enabled: boolean) => {
    setAiMealSuggestions(enabled);
    updateData({ aiMealSuggestions: enabled });
  };

  const handleAssistantNameChange = (name: string) => {
    setAiChatAssistantName(name);
    updateData({ aiChatAssistantName: name });
  };

  const handleContinue = () => {
    onStepCompleted();
    onNext();
  };

  const handleSkip = () => {
    updateData({ 
      aiMealSuggestions: true,
      aiChatAssistantName: 'NutriBot'
    });
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-primary-100 rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">AI-Powered Features</h2>
        <p className="text-neutral-600">Customize how AI helps you reach your goals</p>
      </div>

      {/* AI Features Overview */}
      <Card className="bg-gradient-to-br from-purple-50 to-primary-50 border-primary-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bot className="h-6 w-6 text-primary-600" />
            <h3 className="font-semibold text-neutral-900">How AI Helps You</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <ChefHat className="h-5 w-5 text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-neutral-900">Smart Meal Suggestions</h4>
                <p className="text-xs text-neutral-600">Get personalized recipes based on your goals and preferences</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MessageCircle className="h-5 w-5 text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-neutral-900">Nutrition Chat Assistant</h4>
                <p className="text-xs text-neutral-600">Ask questions about nutrition and get instant expert advice</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Lightbulb className="h-5 w-5 text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-neutral-900">Intelligent Insights</h4>
                <p className="text-xs text-neutral-600">Discover patterns in your eating habits and get improvement tips</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-neutral-900">Progress Optimization</h4>
                <p className="text-xs text-neutral-600">AI adjusts recommendations as you progress toward your goals</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Meal Suggestions Toggle */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="ai-meals" className="text-base font-medium">
                AI Meal Suggestions
              </Label>
              <p className="text-sm text-neutral-600">
                Get daily personalized meal recommendations based on your goals
              </p>
            </div>
            <Switch
              id="ai-meals"
              checked={aiMealSuggestions}
              onCheckedChange={handleToggleMealSuggestions}
            />
          </div>
          
          {aiMealSuggestions && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✨ Great! You'll receive 3 personalized meal suggestions every day.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Chat Assistant Name */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-base font-medium">AI Chat Assistant Name (Optional)</Label>
            <p className="text-sm text-neutral-600 mt-1">
              Give your AI nutrition assistant a friendly name
            </p>
          </div>
          
          <div className="space-y-3">
            <Input
              placeholder="Enter a custom name or choose from suggestions"
              value={aiChatAssistantName}
              onChange={(e) => handleAssistantNameChange(e.target.value)}
              className="w-full"
            />
            
            <div className="flex flex-wrap gap-2">
              <p className="text-xs text-neutral-500 w-full mb-1">Quick suggestions:</p>
              {AI_ASSISTANT_NAMES.map((name) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssistantNameChange(name)}
                  className="text-xs h-7"
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>
          
          {aiChatAssistantName && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                👋 Hi! I'm <strong>{aiChatAssistantName}</strong>, your personal nutrition assistant.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-4">
        <Button 
          variant="ghost"
          onClick={handleSkip}
          className="text-neutral-500"
        >
          Use Defaults
        </Button>
        
        <Button onClick={handleContinue}>
          Continue
        </Button>
      </div>

      <div className="text-center text-xs text-neutral-500">
        <p>All AI features can be customized later in your settings</p>
      </div>
    </div>
  );
}