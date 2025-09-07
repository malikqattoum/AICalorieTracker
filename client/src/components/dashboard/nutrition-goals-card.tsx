import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Target, Check, X, Save, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { APP_CONFIG } from "@/lib/constants";

interface NutritionGoals {
  userId: number;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  weeklyWorkouts: number;
  waterIntake: number;
  weight: number;
  bodyFatPercentage: number;
}

export function NutritionGoalsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [goals, setGoals] = useState<NutritionGoals | null>(null);
  const [formValues, setFormValues] = useState<NutritionGoals | null>(null);

  // Fetch user's nutrition goals
  const { data: nutritionGoals, isLoading } = useQuery<NutritionGoals>({
    queryKey: ["/api/nutrition-goals"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/nutrition-goals");
        if (!res.ok) throw new Error("Failed to fetch nutrition goals");
        return res.json();
      } catch (error) {
        console.error("Error fetching nutrition goals:", error);
        // Return default goals if none exist
        return {
          userId: 0,
          ...APP_CONFIG.DEFAULT_NUTRITION_GOALS,
        };
      }
    },
  });

  // Update goals state when data is fetched
  useEffect(() => {
    if (nutritionGoals) {
      setGoals(nutritionGoals);
      setFormValues(nutritionGoals);
    }
  }, [nutritionGoals]);

  // Fetch today's nutrition data
  const { data: todayStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/today-stats"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/today-stats");
        if (!res.ok) throw new Error("Failed to fetch today's stats");
        return res.json();
      } catch (error) {
        console.error("Error fetching today's stats:", error);
        return {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          water: 0,
        };
      }
    },
  });

  // Update nutrition goals mutation
  const updateGoalsMutation = useMutation({
    mutationFn: async (updatedGoals: NutritionGoals) => {
      const res = await apiRequest("PUT", "/api/nutrition-goals", updatedGoals);
      if (!res.ok) throw new Error("Failed to update nutrition goals");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-goals"] });
      setGoals(data);
      setIsEditing(false);
      toast({ title: "Nutrition goals updated successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to update nutrition goals", 
        variant: "destructive"
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formValues) {
      updateGoalsMutation.mutate(formValues);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof NutritionGoals, value: number) => {
    if (formValues) {
      setFormValues({
        ...formValues,
        [field]: value,
      });
    }
  };

  // Calculate progress percentage
  const calculateProgress = (current: number, goal: number) => {
    if (goal <= 0) return 0;
    const percentage = (current / goal) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  // Get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    const colors = APP_CONFIG.PROGRESS_COLORS;
    if (percentage < colors.low.threshold) return colors.low.color;
    if (percentage < colors.medium.threshold) return colors.medium.color;
    if (percentage < colors.high.threshold) return colors.high.color;
    if (percentage < colors.veryHigh.threshold) return colors.veryHigh.color;
    return colors.complete.color;
  };

  return (
    <Card className="card-gradient hover-effect rounded-xl overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center">
        <CardTitle className="text-xl font-semibold text-neutral-800 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary-500" />
          Nutrition Goals
        </CardTitle>
        {!isEditing && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4" /> Edit Goals
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Daily Calories</label>
                <input
                  type="number"
                  min={APP_CONFIG.NUTRITION_RANGES.dailyCalories.min}
                  max={APP_CONFIG.NUTRITION_RANGES.dailyCalories.max}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  value={formValues?.dailyCalories || 0}
                  onChange={(e) => handleInputChange("dailyCalories", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Daily Protein (g)</label>
                <input
                  type="number"
                  min={APP_CONFIG.NUTRITION_RANGES.dailyProtein.min}
                  max={APP_CONFIG.NUTRITION_RANGES.dailyProtein.max}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  value={formValues?.dailyProtein || 0}
                  onChange={(e) => handleInputChange("dailyProtein", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Daily Carbs (g)</label>
                <input
                  type="number"
                  min={APP_CONFIG.NUTRITION_RANGES.dailyCarbs.min}
                  max={APP_CONFIG.NUTRITION_RANGES.dailyCarbs.max}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  value={formValues?.dailyCarbs || 0}
                  onChange={(e) => handleInputChange("dailyCarbs", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Daily Fat (g)</label>
                <input
                  type="number"
                  min={APP_CONFIG.NUTRITION_RANGES.dailyFat.min}
                  max={APP_CONFIG.NUTRITION_RANGES.dailyFat.max}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  value={formValues?.dailyFat || 0}
                  onChange={(e) => handleInputChange("dailyFat", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Weekly Workouts</label>
                <input
                  type="number"
                  min={APP_CONFIG.NUTRITION_RANGES.weeklyWorkouts.min}
                  max={APP_CONFIG.NUTRITION_RANGES.weeklyWorkouts.max}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  value={formValues?.weeklyWorkouts || 0}
                  onChange={(e) => handleInputChange("weeklyWorkouts", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Water Intake (ml)</label>
                <input
                  type="number"
                  min={APP_CONFIG.NUTRITION_RANGES.waterIntake.min}
                  max={APP_CONFIG.NUTRITION_RANGES.waterIntake.max}
                  step={APP_CONFIG.NUTRITION_RANGES.waterIntake.step}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  value={formValues?.waterIntake || 0}
                  onChange={(e) => handleInputChange("waterIntake", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  min={APP_CONFIG.NUTRITION_RANGES.weight.min}
                  max={APP_CONFIG.NUTRITION_RANGES.weight.max}
                  step={APP_CONFIG.NUTRITION_RANGES.weight.step}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  value={formValues?.weight || 0}
                  onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Body Fat (%)</label>
                <input
                  type="number"
                  min={APP_CONFIG.NUTRITION_RANGES.bodyFatPercentage.min}
                  max={APP_CONFIG.NUTRITION_RANGES.bodyFatPercentage.max}
                  step={APP_CONFIG.NUTRITION_RANGES.bodyFatPercentage.step}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  value={formValues?.bodyFatPercentage || 0}
                  onChange={(e) => handleInputChange("bodyFatPercentage", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setFormValues(goals);
                }}
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={updateGoalsMutation.isPending}
              >
                {updateGoalsMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-1">⏳</span> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" /> Save Goals
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : goals ? (
          <div className="space-y-4">
            {isLoadingStats ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm font-medium">Calories</div>
                    <span className="text-sm text-neutral-500">
                      {todayStats?.calories || 0} / {goals.dailyCalories} kcal
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${getProgressColor(calculateProgress(todayStats?.calories || 0, goals.dailyCalories))}`}
                      style={{ width: `${calculateProgress(todayStats?.calories || 0, goals.dailyCalories)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Protein</span>
                    <span className="text-sm text-neutral-500">
                      {todayStats?.protein || 0} / {goals.dailyProtein} g
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${getProgressColor(calculateProgress(todayStats?.protein || 0, goals.dailyProtein))}`}
                      style={{ width: `${calculateProgress(todayStats?.protein || 0, goals.dailyProtein)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Carbs</span>
                    <span className="text-sm text-neutral-500">
                      {todayStats?.carbs || 0} / {goals.dailyCarbs} g
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${getProgressColor(calculateProgress(todayStats?.carbs || 0, goals.dailyCarbs))}`}
                      style={{ width: `${calculateProgress(todayStats?.carbs || 0, goals.dailyCarbs)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Fat</span>
                    <span className="text-sm text-neutral-500">
                      {todayStats?.fat || 0} / {goals.dailyFat} g
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${getProgressColor(calculateProgress(todayStats?.fat || 0, goals.dailyFat))}`}
                      style={{ width: `${calculateProgress(todayStats?.fat || 0, goals.dailyFat)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Water</span>
                    <span className="text-sm text-neutral-500">
                      {todayStats?.water || 0} / {goals.waterIntake} ml
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-blue-500"
                      style={{ width: `${calculateProgress(todayStats?.water || 0, goals.waterIntake)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Weight</span>
                    <span className="text-sm text-neutral-500">
                      {goals.weight} kg
                    </span>
                  </div>
                  <Progress value={calculateProgress(goals.weight, 200)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Body Fat</span>
                    <span className="text-sm text-neutral-500">
                      {goals.bodyFatPercentage} %
                    </span>
                  </div>
                  <Progress value={calculateProgress(goals.bodyFatPercentage, 60)} className="h-2" />
                </div>
                <div className="mt-4 p-3 bg-primary-50 rounded-md border border-primary-100">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-primary-800">Personalized Recommendation</h4>
                      <p className="text-sm text-primary-700 mt-1">
                        Based on your goals and activity level, we recommend focusing on increasing your protein intake and staying hydrated throughout the day.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-400">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="mb-4">No nutrition goals set yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mx-auto"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4 mr-1" /> Set Your Nutrition Goals
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}