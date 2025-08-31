
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SmartMealSuggestionsCard } from "@/components/dashboard/smart-meal-suggestions-card";
import { MealPlanCard } from "@/components/dashboard/meal-plan-card";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export default function MealPlanPage() {
    const [goal, setGoal] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mealPlan, setMealPlan] = useState<any>(null);
    const { toast } = useToast();

    // Fetch meal plan data
    const { data: mealPlanData, isLoading: mealPlanLoading, error: mealPlanError, refetch: fetchMealPlan } = useQuery({
      queryKey: ["/api/meal-plan"],
      queryFn: getQueryFn({ on401: "returnNull" })
    });

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const generatePlan = async () => {
    if (!goal) {
      toast({
        title: "Please select a goal",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/meal-plan", { goal });

      if (!response.ok) throw new Error("Failed to generate meal plan");

      const plan = await response.json();
      setMealPlan(plan);
    } catch (error) {
      toast({
        title: "Error generating meal plan",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">AI Meal Planner</h1>

      {/* Smart Meal Suggestions */}
      <div className="mb-8">
        <SmartMealSuggestionsCard />
      </div>

      {/* Meal Plan Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Generate New Plan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select your goal</label>
                <Select value={goal} onValueChange={setGoal}>
                  <option value="">Select your goal</option>
                  <option value="weight-loss">Weight Loss</option>
                  <option value="muscle-gain">Muscle Gain</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="keto">Keto Diet</option>
                  <option value="vegan">Vegan</option>
                </Select>
              </div>

              <Button
                onClick={generatePlan}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Generating..." : "Generate Meal Plan"}
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {/* Meal Plan Card */}
          <MealPlanCard
            mealPlan={mealPlanData}
            isMealPlanLoading={mealPlanLoading}
            mealPlanError={mealPlanError ? mealPlanError.message : null}
            fetchMealPlan={fetchMealPlan}
            goal={goal}
            daysOfWeek={daysOfWeek}
            medicalCondition="none"
          />
        </div>
      </div>

      {/* Manual Meal Plan Display (fallback) */}
      {mealPlan && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Meal Plan</h2>
          <div className="grid gap-6">
            {mealPlan.meals.map((daily: any, i: number) => (
              <div key={i} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">{daily.day}</h3>

                <div className="grid gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Breakfast</h4>
                    <p>{daily.breakfast.name}</p>
                    <p className="text-sm text-neutral-600">
                      {daily.breakfast.calories} cal | {daily.breakfast.protein}g protein
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Lunch</h4>
                    <p>{daily.lunch.name}</p>
                    <p className="text-sm text-neutral-600">
                      {daily.lunch.calories} cal | {daily.lunch.protein}g protein
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Dinner</h4>
                    <p>{daily.dinner.name}</p>
                    <p className="text-sm text-neutral-600">
                      {daily.dinner.calories} cal | {daily.dinner.protein}g protein
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Snacks</h4>
                    {daily.snacks.map((snack: any, j: number) => (
                      <div key={j} className="mb-2">
                        <p>{snack.name}</p>
                        <p className="text-sm text-neutral-600">
                          {snack.calories} cal | {snack.protein}g protein
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
