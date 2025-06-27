import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Leaf, Fish, Wheat, Heart, Shield, Globe } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding-page";
import { cn } from "@/lib/utils";

const DIETARY_PREFERENCES = [
  {
    id: 'no-preference',
    title: 'No Preference',
    description: 'I eat everything',
    icon: Globe,
    color: 'text-neutral-600',
  },
  {
    id: 'vegetarian',
    title: 'Vegetarian',
    description: 'No meat, but dairy and eggs are okay',
    icon: Leaf,
    color: 'text-green-600',
  },
  {
    id: 'vegan',
    title: 'Vegan',
    description: 'No animal products at all',
    icon: Leaf,
    color: 'text-green-700',
  },
  {
    id: 'pescatarian',
    title: 'Pescatarian',
    description: 'Fish is okay, but no other meat',
    icon: Fish,
    color: 'text-blue-600',
  },
  {
    id: 'keto',
    title: 'Keto',
    description: 'Low-carb, high-fat diet',
    icon: Heart,
    color: 'text-red-600',
  },
  {
    id: 'paleo',
    title: 'Paleo',
    description: 'Whole foods, no processed items',
    icon: Shield,
    color: 'text-orange-600',
  },
  {
    id: 'gluten-free',
    title: 'Gluten-Free',
    description: 'No wheat, barley, or rye',
    icon: Wheat,
    color: 'text-yellow-600',
  },
  {
    id: 'halal',
    title: 'Halal',
    description: 'Following Islamic dietary laws',
    icon: Shield,
    color: 'text-purple-600',
  },
];

const COMMON_ALLERGIES = [
  'Nuts', 'Peanuts', 'Shellfish', 'Fish', 'Eggs', 'Dairy', 'Soy', 'Wheat', 'Sesame'
];

interface DietPreferencesStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onStepCompleted: () => void;
  onNext: () => void;
  isCompleted: boolean;
}

export default function DietPreferencesStep({ 
  data, 
  updateData, 
  onStepCompleted, 
  onNext,
  isCompleted 
}: DietPreferencesStepProps) {
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(
    data.dietaryPreferences || []
  );
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    data.allergies || []
  );

  const handleTogglePreference = (preferenceId: string) => {
    setSelectedPreferences(prev => {
      const newPreferences = prev.includes(preferenceId)
        ? prev.filter(id => id !== preferenceId)
        : [...prev, preferenceId];
      
      updateData({ dietaryPreferences: newPreferences });
      return newPreferences;
    });
  };

  const handleToggleAllergy = (allergyId: string) => {
    setSelectedAllergies(prev => {
      const newAllergies = prev.includes(allergyId)
        ? prev.filter(id => id !== allergyId)
        : [...prev, allergyId];
      
      updateData({ allergies: newAllergies });
      return newAllergies;
    });
  };

  const handleContinue = () => {
    onStepCompleted();
    onNext();
  };

  const handleSkip = () => {
    updateData({ 
      dietaryPreferences: [], 
      allergies: [] 
    });
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
          <Leaf className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">Dietary Preferences</h2>
        <p className="text-neutral-600">Help us suggest meals that fit your lifestyle</p>
      </div>

      {/* Dietary Preferences */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-neutral-900">Diet Type (Select all that apply)</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DIETARY_PREFERENCES.map((preference) => {
              const IconComponent = preference.icon;
              const isSelected = selectedPreferences.includes(preference.id);
              
              return (
                <Card 
                  key={preference.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-sm",
                    isSelected 
                      ? "ring-2 ring-primary-500 bg-primary-50 border-primary-200" 
                      : "hover:border-primary-200"
                  )}
                  onClick={() => handleTogglePreference(preference.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <IconComponent className={cn("h-5 w-5", preference.color)} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-neutral-900 text-sm">
                          {preference.title}
                        </h4>
                        <p className="text-neutral-600 text-xs truncate">
                          {preference.description}
                        </p>
                      </div>
                      <div className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center",
                        isSelected 
                          ? "border-primary-500 bg-primary-500" 
                          : "border-neutral-300"
                      )}>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Allergies */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-neutral-900">Food Allergies (Optional)</h3>
            <p className="text-sm text-neutral-600">We'll avoid suggesting foods with these ingredients</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((allergy) => {
              const isSelected = selectedAllergies.includes(allergy);
              
              return (
                <Badge
                  key={allergy}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected 
                      ? "bg-primary-500 hover:bg-primary-600" 
                      : "hover:bg-primary-50 hover:border-primary-300"
                  )}
                  onClick={() => handleToggleAllergy(allergy)}
                >
                  {allergy}
                </Badge>
              );
            })}
          </div>

          {selectedAllergies.length > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Selected allergies:</strong> {selectedAllergies.join(', ')}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                We'll exclude these ingredients from all meal suggestions.
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
          Skip This Step
        </Button>
        
        <Button onClick={handleContinue}>
          Continue
        </Button>
      </div>

      <div className="text-center text-xs text-neutral-500">
        <p>You can modify these preferences anytime in your settings</p>
      </div>
    </div>
  );
}