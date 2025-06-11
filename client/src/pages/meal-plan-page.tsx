
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { MealPlan } from "@shared/schema";

export default function MealPlanPage() {
  const [goal, setGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const { toast } = useToast();

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
      const response = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      
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
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">AI Meal Planner</h1>
      
      <div className="max-w-xl mb-8">
        <Select value={goal} onValueChange={setGoal}>
          <option value="">Select your goal</option>
          <option value="weight-loss">Weight Loss</option>
          <option value="muscle-gain">Muscle Gain</option>
          <option value="maintenance">Maintenance</option>
          <option value="keto">Keto Diet</option>
          <option value="vegan">Vegan</option>
        </Select>
        
        <Button 
          onClick={generatePlan} 
          disabled={isLoading}
          className="mt-4"
        >
          {isLoading ? "Generating..." : "Generate Meal Plan"}
        </Button>
      </div>

      {mealPlan && (
        <div className="grid gap-6">
          {mealPlan.meals.map((daily: any, i: number) => (
            <Card key={i} className="p-6">
              <h2 className="text-xl font-semibold mb-4">{daily.day}</h2>
              
              <div className="grid gap-4">
                <div>
                  <h3 className="font-medium mb-2">Breakfast</h3>
                  <p>{daily.breakfast.name}</p>
                  <p className="text-sm text-neutral-600">
                    {daily.breakfast.calories} cal | {daily.breakfast.protein}g protein
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Lunch</h3>
                  <p>{daily.lunch.name}</p>
                  <p className="text-sm text-neutral-600">
                    {daily.lunch.calories} cal | {daily.lunch.protein}g protein
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Dinner</h3>
                  <p>{daily.dinner.name}</p>
                  <p className="text-sm text-neutral-600">
                    {daily.dinner.calories} cal | {daily.dinner.protein}g protein
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Snacks</h3>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
