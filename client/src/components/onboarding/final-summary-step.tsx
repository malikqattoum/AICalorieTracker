import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Sparkles, User, Target, Utensils, Bell, Loader2 } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding-page";
import { useLocation } from "wouter";

interface FinalSummaryStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onStepCompleted: () => void;
  onNext: () => void;
  isCompleted: boolean;
}

export default function FinalSummaryStep({ 
  data, 
  onStepCompleted,
  isCompleted 
}: FinalSummaryStepProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const completeOnboarding = async () => {
    setIsCompleting(true);
    
    try {
      // Validate required fields before sending
      const requiredFields = ['age', 'gender', 'height', 'weight', 'activityLevel', 'primaryGoal'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate numeric fields
      if (data.age && (data.age < 13 || data.age > 120)) {
        throw new Error('Age must be between 13 and 120');
      }
      if (data.height && (data.height < 100 || data.height > 250)) {
        throw new Error('Height must be between 100cm and 250cm');
      }
      if (data.weight && (data.weight < 30 || data.weight > 300)) {
        throw new Error('Weight must be between 30kg and 300kg');
      }

      // Validate activity level and goal
      const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'extra-active'];
      const validGoals = ['lose-weight', 'maintain-weight', 'gain-muscle'];
      
      if (!validActivityLevels.includes(data.activityLevel || '')) {
        throw new Error('Invalid activity level selected');
      }
      if (!validGoals.includes(data.primaryGoal || '')) {
        throw new Error('Invalid primary goal selected');
      }

      console.log('Submitting onboarding data:', data);

      // Save onboarding data to the server
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header if available
          ...(user?.token && { Authorization: `Bearer ${user.token}` })
        },
        body: JSON.stringify(data),
        credentials: 'include' // Important for session-based auth
      });

      const responseText = await response.text();
      console.log('Onboarding response status:', response.status);
      console.log('Onboarding response body:', responseText);

      if (response.ok) {
        try {
          const responseData = JSON.parse(responseText);
          console.log('Onboarding successful:', responseData);
          onStepCompleted();
          // Simulate background loading of AI features
          setTimeout(() => {
            setLocation('/dashboard');
          }, 2000);
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          // If response isn't JSON but status is OK, still proceed
          onStepCompleted();
          setTimeout(() => {
            setLocation('/dashboard');
          }, 2000);
        }
      } else {
        let errorMessage = 'Failed to complete onboarding';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
          if (errorData.errors) {
            errorMessage += ': ' + errorData.errors.join(', ');
          }
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setIsCompleting(false);
    }
  };

  const getActivityLevelDisplay = (level: string) => {
    const levels = {
      'sedentary': 'Sedentary',
      'light': 'Lightly Active',
      'moderate': 'Moderately Active',
      'active': 'Very Active',
      'extra-active': 'Extremely Active'
    };
    return levels[level as keyof typeof levels] || level;
  };

  const getGoalDisplay = (goal: string) => {
    const goals = {
      'lose-weight': 'Lose Weight',
      'maintain-weight': 'Maintain Weight',
      'gain-muscle': 'Gain Muscle'
    };
    return goals[goal as keyof typeof goals] || goal;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {!isCompleting ? (
        <>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-primary-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-neutral-900">You're All Set!</h2>
              <p className="text-lg text-neutral-600 mt-2">
                Here's a summary of your personalized nutrition profile
              </p>
            </div>
          </div>

          {/* Profile Summary */}
          <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-200">
            <CardContent className="p-6 space-y-6">
              {/* Personal Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-neutral-900">Personal Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-600">Name:</span>
                    <p className="font-medium">{data.name}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Age:</span>
                    <p className="font-medium">{data.age} years</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Height:</span>
                    <p className="font-medium">{data.height} cm</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Weight:</span>
                    <p className="font-medium">{data.weight} kg</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Goals & Activity */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-neutral-900">Goals & Activity</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 text-sm">Primary Goal:</span>
                    <Badge variant="default">{getGoalDisplay(data.primaryGoal || '')}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 text-sm">Activity Level:</span>
                    <Badge variant="outline">{getActivityLevelDisplay(data.activityLevel || '')}</Badge>
                  </div>
                  {data.targetWeight && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 text-sm">Target Weight:</span>
                      <span className="font-medium">{data.targetWeight} kg</span>
                    </div>
                  )}
                  {data.timeline && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 text-sm">Timeline:</span>
                      <span className="font-medium">{data.timeline}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Diet Preferences */}
              {(data.dietaryPreferences?.length || data.allergies?.length) && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Utensils className="h-5 w-5 text-primary-600" />
                      <h3 className="font-semibold text-neutral-900">Dietary Preferences</h3>
                    </div>
                    <div className="space-y-2">
                      {data.dietaryPreferences && data.dietaryPreferences.length > 0 && (
                        <div>
                          <span className="text-neutral-600 text-sm">Diet Types:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {data.dietaryPreferences.map((pref) => (
                              <Badge key={pref} variant="outline" className="text-xs">
                                {pref.replace('-', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {data.allergies && data.allergies.length > 0 && (
                        <div>
                          <span className="text-neutral-600 text-sm">Allergies:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {data.allergies.map((allergy) => (
                              <Badge key={allergy} variant="destructive" className="text-xs">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* AI Features */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-neutral-900">AI Features</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 text-sm">Meal Suggestions:</span>
                    <Badge variant={data.aiMealSuggestions ? "default" : "outline"}>
                      {data.aiMealSuggestions ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {data.aiChatAssistantName && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 text-sm">AI Assistant:</span>
                      <span className="font-medium">{data.aiChatAssistantName}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Notifications */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-neutral-900">Notifications</h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 text-sm">Reminders:</span>
                  <Badge variant={data.notificationsEnabled ? "default" : "outline"}>
                    {data.notificationsEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-3">What's Next?</h3>
              <div className="space-y-2 text-sm text-primary-100">
                <p>• Your personalized dashboard is being prepared</p>
                <p>• AI meal recommendations are being generated</p>
                <p>• Daily nutrition goals are being calculated</p>
                <p>• Your nutrition coach is getting ready to assist you</p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center pt-4">
            <Button 
              onClick={completeOnboarding}
              size="lg"
              className="px-8"
            >
              Start Tracking
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center space-y-6 py-12">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Setting Up Your Experience</h2>
            <p className="text-neutral-600 mt-2">
              We're personalizing your dashboard and preparing your AI recommendations...
            </p>
          </div>
          <div className="max-w-xs mx-auto">
            <div className="h-2 bg-neutral-200 rounded-full">
              <div className="h-2 bg-primary-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}