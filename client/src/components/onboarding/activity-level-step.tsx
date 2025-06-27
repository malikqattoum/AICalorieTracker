import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Users, Zap, Mountain, Rocket } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding-page";
import { cn } from "@/lib/utils";

const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise, desk job',
    details: 'Office work, mostly sitting, minimal physical activity',
    icon: Users,
    multiplier: 1.2,
  },
  {
    id: 'light',
    title: 'Lightly Active',
    description: 'Light exercise 1-3 times per week',
    details: 'Light workouts, walking, occasional sports',
    icon: Activity,
    multiplier: 1.375,
  },
  {
    id: 'moderate',
    title: 'Moderately Active',
    description: 'Moderate exercise 3-5 times per week',
    details: 'Regular gym sessions, consistent exercise routine',
    icon: Zap,
    multiplier: 1.55,
  },
  {
    id: 'active',
    title: 'Very Active',
    description: 'Hard exercise 6-7 times per week',
    details: 'Daily workouts, sports, physically demanding job',
    icon: Mountain,
    multiplier: 1.725,
  },
  {
    id: 'extra-active',
    title: 'Extremely Active',
    description: 'Very hard exercise, physical job',
    details: 'Professional athlete, manual labor, multiple daily workouts',
    icon: Rocket,
    multiplier: 1.9,
  },
];

interface ActivityLevelStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onStepCompleted: () => void;
  onNext: () => void;
  isCompleted: boolean;
}

export default function ActivityLevelStep({ 
  data, 
  updateData, 
  onStepCompleted, 
  onNext,
  isCompleted 
}: ActivityLevelStepProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>(data.activityLevel || '');

  const handleSelectLevel = (levelId: string) => {
    setSelectedLevel(levelId);
    updateData({ activityLevel: levelId });
  };

  const handleContinue = () => {
    if (selectedLevel) {
      onStepCompleted();
      onNext();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
          <Activity className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">What's Your Activity Level?</h2>
        <p className="text-neutral-600">This helps us calculate your daily calorie needs</p>
      </div>

      <div className="grid gap-3">
        {ACTIVITY_LEVELS.map((level) => {
          const IconComponent = level.icon;
          const isSelected = selectedLevel === level.id;
          
          return (
            <Card 
              key={level.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected 
                  ? "ring-2 ring-primary-500 bg-primary-50 border-primary-200" 
                  : "hover:border-primary-200"
              )}
              onClick={() => handleSelectLevel(level.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isSelected ? "bg-primary-500" : "bg-neutral-100"
                  )}>
                    <IconComponent className={cn(
                      "h-5 w-5",
                      isSelected ? "text-white" : "text-neutral-600"
                    )} />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-neutral-900">{level.title}</h3>
                      <span className="text-xs text-neutral-500 font-medium">
                        {level.multiplier}x
                      </span>
                    </div>
                    <p className="text-neutral-600 text-sm">{level.description}</p>
                    <p className="text-neutral-500 text-xs">{level.details}</p>
                  </div>

                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    isSelected 
                      ? "border-primary-500 bg-primary-500" 
                      : "border-neutral-300"
                  )}>
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <Button 
          onClick={handleContinue}
          disabled={!selectedLevel}
          className="px-8"
        >
          Continue
        </Button>
      </div>

      <div className="text-center text-xs text-neutral-500">
        <p>Don't worry, you can change this later in your settings</p>
      </div>
    </div>
  );
}