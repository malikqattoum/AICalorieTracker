import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MealPlanCard({ mealPlan, isMealPlanLoading, mealPlanError, fetchMealPlan, goal, daysOfWeek }: {
  mealPlan: any;
  isMealPlanLoading: boolean;
  mealPlanError: string | null;
  fetchMealPlan: () => void;
  goal: string;
  daysOfWeek: string[];
}) {
  return (
    <Card className="card-gradient glass-effect rounded-xl border border-neutral-800">
      <CardHeader><CardTitle>AI Meal Plan Generator</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-emerald-500 text-base font-semibold">
            Personalized for: <span className="font-bold">{goal.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          </div>
          <button
            className="ml-auto bg-emerald-700 hover:bg-emerald-600 text-emerald-50 font-semibold px-4 py-1.5 rounded shadow transition-colors duration-150 text-sm"
            aria-label="Regenerate meal plan"
            onClick={fetchMealPlan}
            disabled={isMealPlanLoading}
          >
            {isMealPlanLoading ? "Generating..." : "Regenerate Plan"}
          </button>
        </div>
        <div className="mb-4 text-xs text-emerald-600">
          <span className="font-bold">How it works:</span> This plan adapts each week based on your tracked meals, calories, and goals. Over- or under-eating, skipped meals, and preferences are all factored in for next week’s plan. <span className="text-emerald-700">Give feedback to improve your plan!</span>
        </div>
        {mealPlanError && (
          <div className="text-red-400 mb-4">{mealPlanError}</div>
        )}
        {isMealPlanLoading ? (
          <div className="text-emerald-500 py-8 text-center">Generating meal plan...</div>
        ) : mealPlan && mealPlan.meals ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mealPlan.meals.map((dayPlan: any, i: number) => (
              <div key={dayPlan.day || i} className="bg-emerald-800/40 rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-200 font-bold">{dayPlan.day || daysOfWeek[i]}</span>
                  {dayPlan.adaptation && (
                    <span className="ml-2 text-xs text-amber-300 bg-amber-900/60 rounded px-2 py-0.5">{dayPlan.adaptation}</span>
                  )}
                </div>
                <ul className="list-none text-emerald-100 text-sm mb-2">
                  {["breakfast", "lunch", "snack", "dinner", "snacks"].map(type => {
                    const meal = dayPlan[type] || (Array.isArray(dayPlan.snacks) && type === "snacks" ? null : undefined);
                    if (!meal) return null;
                    if (type === "snacks" && Array.isArray(dayPlan.snacks)) {
                      return dayPlan.snacks.map((snack: any, j: number) => (
                        <li key={`snack-${j}`} className="mb-1 flex flex-col md:flex-row md:items-center md:gap-2">
                          <span className="font-medium w-24 inline-block">Snack:</span>
                          <span>{snack.name}</span>
                          <span className="ml-auto text-xs text-emerald-300">{snack.calories} kcal</span>
                          <span className="ml-2 text-xs text-emerald-400">P:{snack.protein}g C:{snack.carbs}g F:{snack.fat}g</span>
                        </li>
                      ));
                    }
                    return (
                      <li key={type} className="mb-1 flex flex-col md:flex-row md:items-center md:gap-2">
                        <span className="font-medium w-24 inline-block">{type.charAt(0).toUpperCase() + type.slice(1)}:</span>
                        <span>{meal.name}</span>
                        <span className="ml-auto text-xs text-emerald-300">{meal.calories} kcal</span>
                        <span className="ml-2 text-xs text-emerald-400">P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex justify-between text-xs text-emerald-200 border-t border-emerald-700 pt-2 mt-2">
                  <span>Total: <span className="font-bold">{dayPlan.totalCalories || ''} kcal</span></span>
                  <span>P:{dayPlan.totalProtein || ''}g C:{dayPlan.totalCarbs || ''}g F:{dayPlan.totalFat || ''}g</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-emerald-600 py-8 text-center">No meal plan available.</div>
        )}
      </CardContent>
    </Card>
  );
}
