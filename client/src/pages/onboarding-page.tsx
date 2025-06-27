import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import onboarding step components
import WelcomeStep from "@/components/onboarding/welcome-step";
import AccountCreationStep from "@/components/onboarding/account-creation-step";
import PersonalInfoStep from "@/components/onboarding/personal-info-step";
import ActivityLevelStep from "@/components/onboarding/activity-level-step";
import GoalSettingStep from "@/components/onboarding/goal-setting-step";
import DietPreferencesStep from "@/components/onboarding/diet-preferences-step";
import AIPersonalizationStep from "@/components/onboarding/ai-personalization-step";
import NotificationsStep from "@/components/onboarding/notifications-step";
import FinalSummaryStep from "@/components/onboarding/final-summary-step";

export interface OnboardingData {
  // Personal Info
  name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  
  // Activity & Goals
  activityLevel?: string;
  primaryGoal?: string;
  targetWeight?: number;
  timeline?: string;
  
  // Diet Preferences
  dietaryPreferences?: string[];
  allergies?: string[];
  
  // AI Settings
  aiMealSuggestions?: boolean;
  aiChatAssistantName?: string;
  
  // Notifications
  notificationsEnabled?: boolean;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', component: WelcomeStep, required: true },
  { id: 'account', title: 'Account', component: AccountCreationStep, required: true },
  { id: 'personal', title: 'Personal Info', component: PersonalInfoStep, required: true },
  { id: 'activity', title: 'Activity Level', component: ActivityLevelStep, required: true },
  { id: 'goals', title: 'Goals', component: GoalSettingStep, required: true },
  { id: 'diet', title: 'Diet Preferences', component: DietPreferencesStep, required: false },
  { id: 'ai', title: 'AI Features', component: AIPersonalizationStep, required: false },
  { id: 'notifications', title: 'Notifications', component: NotificationsStep, required: false },
  { id: 'summary', title: 'Summary', component: FinalSummaryStep, required: true },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // If user is logged in and has completed onboarding, redirect to dashboard
  if (user?.onboardingCompleted) {
    return <Redirect to="/dashboard" />;
  }

  const updateOnboardingData = (newData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...newData }));
  };

  const markStepCompleted = (stepIndex: number) => {
    setCompletedSteps(prev => new Set([...Array.from(prev), stepIndex]));
  };

  const canProceedToNext = () => {
    const currentStepConfig = STEPS[currentStep];
    if (currentStepConfig.required) {
      return completedSteps.has(currentStep);
    }
    return true; // Can skip optional steps
  };

  const goToNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipStep = () => {
    if (!STEPS[currentStep].required) {
      goToNext();
    }
  };

  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Progress Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-primary-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-sm font-medium text-primary-600">
              Step {currentStep + 1} of {STEPS.length}
            </h1>
            <span className="text-sm text-neutral-500">
              {STEPS[currentStep].title}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[calc(100vh-200px)]"
          >
            <CurrentStepComponent
              data={onboardingData}
              updateData={updateOnboardingData}
              onStepCompleted={() => markStepCompleted(currentStep)}
              onNext={goToNext}
              isCompleted={completedSteps.has(currentStep)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="sticky bottom-0 bg-white border-t border-primary-100 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {!STEPS[currentStep].required && currentStep !== 0 && currentStep !== STEPS.length - 1 && (
              <Button
                variant="ghost"
                onClick={skipStep}
                className="text-neutral-500 hover:text-neutral-700"
              >
                Skip
              </Button>
            )}
            
            <Button
              onClick={goToNext}
              disabled={!canProceedToNext() || currentStep === STEPS.length - 1}
              className="flex items-center gap-2"
            >
              {currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}