import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, TrendingDown, Minus, TrendingUp, Calendar } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding-page";
import { cn } from "@/lib/utils";

const GOALS = [
  {
    id: 'lose-weight',
    title: 'Lose Weight',
    description: 'Reduce body weight and body fat',
    icon: TrendingDown,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    ringColor: 'ring-red-500',
  },
  {
    id: 'maintain-weight',
    title: 'Maintain Weight',
    description: 'Keep current weight stable',
    icon: Minus,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    ringColor: 'ring-blue-500',
  },
  {
    id: 'gain-muscle',
    title: 'Gain Muscle',
    description: 'Build lean muscle mass',
    icon: TrendingUp,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    ringColor: 'ring-green-500',
  },
];

const goalDetailsSchema = z.object({
  targetWeight: z.number().min(30, "Please enter a valid target weight").max(300, "Please enter a valid target weight").optional(),
  timeline: z.string().optional(),
});

type GoalDetailsFormValues = z.infer<typeof goalDetailsSchema>;

interface GoalSettingStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onStepCompleted: () => void;
  onNext: () => void;
  isCompleted: boolean;
}

export default function GoalSettingStep({ 
  data, 
  updateData, 
  onStepCompleted, 
  onNext,
  isCompleted 
}: GoalSettingStepProps) {
  const [selectedGoal, setSelectedGoal] = useState<string>(data.primaryGoal || '');
  const [showDetails, setShowDetails] = useState(false);

  const form = useForm<GoalDetailsFormValues>({
    resolver: zodResolver(goalDetailsSchema),
    defaultValues: {
      targetWeight: data.targetWeight || undefined,
      timeline: data.timeline || "",
    },
  });

  const handleSelectGoal = (goalId: string) => {
    setSelectedGoal(goalId);
    updateData({ primaryGoal: goalId });
    
    // Show details form for weight goals
    if (goalId === 'lose-weight' || goalId === 'gain-muscle') {
      setShowDetails(true);
    } else {
      setShowDetails(false);
      handleContinue();
    }
  };

  const handleContinue = () => {
    if (selectedGoal) {
      onStepCompleted();
      onNext();
    }
  };

  const onSubmitDetails = (formData: GoalDetailsFormValues) => {
    updateData({
      targetWeight: formData.targetWeight,
      timeline: formData.timeline,
    });
    handleContinue();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
          <Target className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">What's Your Primary Goal?</h2>
        <p className="text-neutral-600">We'll customize your nutrition plan to help you achieve it</p>
      </div>

      <div className="grid gap-4">
        {GOALS.map((goal) => {
          const IconComponent = goal.icon;
          const isSelected = selectedGoal === goal.id;
          
          return (
            <Card 
              key={goal.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected 
                  ? `ring-2 ${goal.ringColor} ${goal.bgColor} ${goal.borderColor}` 
                  : "hover:border-primary-200"
              )}
              onClick={() => handleSelectGoal(goal.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    isSelected ? "bg-white" : goal.bgColor
                  )}>
                    <IconComponent className={cn(
                      "h-6 w-6",
                      goal.color
                    )} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 text-lg">{goal.title}</h3>
                    <p className="text-neutral-600">{goal.description}</p>
                  </div>

                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    isSelected 
                      ? `border-primary-500 bg-primary-500` 
                      : "border-neutral-300"
                  )}>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showDetails && selectedGoal && (selectedGoal === 'lose-weight' || selectedGoal === 'gain-muscle') && (
        <Card className="bg-neutral-50 border-primary-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              <h3 className="font-semibold text-neutral-900">Additional Details (Optional)</h3>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitDetails)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Weight (kg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder={selectedGoal === 'lose-weight' ? '65' : '75'} 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timeline</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-3 months">1-3 Months</SelectItem>
                            <SelectItem value="3-6 months">3-6 Months</SelectItem>
                            <SelectItem value="6-12 months">6-12 Months</SelectItem>
                            <SelectItem value="1+ years">1+ Years</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={handleContinue}
                  >
                    Skip Details
                  </Button>
                  <Button type="submit">
                    Continue
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {selectedGoal === 'maintain-weight' && (
        <div className="text-center">
          <p className="text-sm text-neutral-600 mb-4">
            Great! We'll help you maintain your current weight with balanced nutrition.
          </p>
        </div>
      )}

      <div className="text-center text-xs text-neutral-500">
        <p>Your goals can be adjusted anytime in your profile settings</p>
      </div>
    </div>
  );
}