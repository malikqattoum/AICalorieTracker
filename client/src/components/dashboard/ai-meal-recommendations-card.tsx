import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, RefreshCw, ChevronRight, Star, Clock, Sparkles, CalendarDays, Target } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Meal { 
  id?: string; 
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime?: number; 
  difficulty?: "easy" | "medium" | "hard"; 
  imageUrl?: string;
  tags?: string[]; 
}

interface DailyMealPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

interface MealRecommendation extends Meal {
  id: string; 
  prepTime: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export function AiMealRecommendationsCard() {
  const { toast } = useToast();
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner">("lunch");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showDailyPlanGenerator, setShowDailyPlanGenerator] = useState(false);
  const [targetCalories, setTargetCalories] = useState<number>(2000);
  const [dailyPlan, setDailyPlan] = useState<DailyMealPlan | null>(null);
  
  const availablePreferences = [
    "vegetarian", "vegan", "gluten-free", "dairy-free",
    "low-carb", "high-protein", "keto", "paleo",
  ];

  const togglePreference = (preference: string) => {
    setPreferences(prev => 
      prev.includes(preference) ? prev.filter(p => p !== preference) : [...prev, preference]
    );
  };

  const {
    data: recommendations, 
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery<MealRecommendation[]> ({
    queryKey: ["/api/meal-recommendations", mealType, preferences],
    queryFn: async () => {
      if (showDailyPlanGenerator) return [];
      try {
        const res = await fetch(`/api/meal-recommendations?type=${mealType}&preferences=${preferences.join(",")}`);
        if (!res.ok) throw new Error("Failed to fetch meal recommendations");
        return res.json();
      } catch (error) {
        console.error("Error fetching meal recommendations:", error);
        toast({ title: "Error", description: "Could not fetch meal suggestions.", variant: "destructive" });
        return []; 
      }
    },
    enabled: !showDailyPlanGenerator, 
  });

  const dailyPlanMutation = useMutation<DailyMealPlan, Error, { targetCalories: number; preferences: string[] }> ({
    mutationFn: async ({ targetCalories, preferences }) => {
      const res = await fetch("/api/meal-recommendations/daily-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCalories, preferences }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch daily meal plan");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setDailyPlan(data);
      toast({ title: "Daily meal plan generated!" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to generate daily plan", 
        description: error.message,
        variant: "destructive"
      });
      setDailyPlan(null);
    },
  });

  const saveMealMutation = useMutation<unknown, Error, Meal>({
    mutationFn: async (meal: Meal) => {
      const res = await fetch("/api/favorite-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mealId: meal.id || `${meal.name.replace(/\s+/g, '-')}-${Date.now()}`,
          mealName: meal.name,
          mealType: mealType, 
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          description: meal.description,
          tags: meal.tags || preferences,
        }),
      });
      if (!res.ok) throw new Error("Failed to save meal");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Meal saved to favorites" });
    },
    onError: () => {
      toast({ title: "Failed to save meal", variant: "destructive" });
    },
  });

  const getDifficultyInfo = (difficulty?: "easy" | "medium" | "hard") => {
    switch (difficulty) {
      case "easy": return { label: "Easy", color: "text-green-500" };
      case "medium": return { label: "Medium", color: "text-yellow-500" };
      case "hard": return { label: "Hard", color: "text-red-500" };
      default: return { label: "N/A", color: "text-neutral-500" };
    }
  };

  const fallbackRecommendations: MealRecommendation[] = [
    {
      id: "fallback-1",
      name: "Grilled Chicken Salad",
      description: "Fresh mixed greens with grilled chicken, cherry tomatoes, cucumber, and balsamic vinaigrette.",
      calories: 350, protein: 30, carbs: 15, fat: 18,
      prepTime: 20, difficulty: "easy", tags: ["high-protein", "low-carb"],
    },
    {
      id: "fallback-2",
      name: "Quinoa Bowl with Roasted Vegetables",
      description: "Protein-rich quinoa with roasted sweet potatoes, bell peppers, broccoli, and tahini dressing.",
      calories: 420, protein: 12, carbs: 65, fat: 14,
      prepTime: 35, difficulty: "medium", tags: ["vegetarian", "gluten-free"],
    },
  ];

  const currentRecommendations = isError ? fallbackRecommendations : recommendations;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg md:text-xl font-semibold text-neutral-800 flex items-center gap-2">
            <Utensils className="h-5 w-5 md:h-6 md:w-6 text-primary-500" />
            AI Meal Recommendations
          </CardTitle>
          <div className="flex items-center gap-2">
            {!showDailyPlanGenerator && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => refetch()} 
                disabled={isLoading || isFetching}
                className="h-8 w-8 md:h-9 md:w-9"
              >
                <RefreshCw className={`h-4 w-4 md:h-5 md:w-5 ${(isLoading || isFetching) ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1 text-xs md:text-sm"
              onClick={() => {
                setShowDailyPlanGenerator(!showDailyPlanGenerator);
                if (!showDailyPlanGenerator) setDailyPlan(null); 
                else if (currentRecommendations?.length === 0 && !isLoading && !isFetching) refetch();
              }}
            >
              <CalendarDays className="h-3.5 w-3.5 md:h-4 md:w-4" />
              {showDailyPlanGenerator ? "Single Meals" : "Daily Plan"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {!showDailyPlanGenerator && (
          <>
            <div className="flex justify-center gap-2 mt-4 mb-2">
              {(["breakfast", "lunch", "dinner"] as const).map((type) => (
                <Button
                  key={type}
                  variant={mealType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMealType(type)}
                  className="capitalize text-xs md:text-sm"
                >
                  {type}
                </Button>
              ))}
            </div>
            <div className="mt-3 mb-1">
              <Button variant="link" size="sm" onClick={() => setShowPreferences(!showPreferences)} className="text-primary-600 px-0 text-xs md:text-sm">
                {showPreferences ? "Hide" : "Show"} Dietary Preferences
              </Button>
              {showPreferences && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2 p-3 bg-neutral-50 rounded-md border border-neutral-200">
                  {availablePreferences.map((pref) => (
                    <Button 
                      key={pref} 
                      variant={preferences.includes(pref) ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => togglePreference(pref)}
                      className="text-xs justify-start h-auto py-1.5 px-2 truncate"
                    >
                      {pref}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardContent className="pt-0">
        {/* Single Meal Recommendations Display */}
        {!showDailyPlanGenerator && isLoading ? (
          <div className="space-y-4 pt-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border border-neutral-200">
                <Skeleton className="h-5 w-3/5 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6 mb-3" />
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-neutral-100">
                  {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-10 w-full" />)}
                </div>
              </div>
            ))}
          </div>
        ) : !showDailyPlanGenerator && isError ? (
          <div className="text-center py-10 text-red-600">
            <p>Error loading recommendations. Displaying fallbacks.</p>
            {/* Fallbacks will be rendered by the block below */}
          </div>
        ) : null}
        
        {!showDailyPlanGenerator && currentRecommendations && currentRecommendations.length > 0 ? (
          <div className="space-y-4 pt-4">
            {currentRecommendations.map((meal) => (
              <div key={meal.id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-md md:text-lg font-semibold text-neutral-800">{meal.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 md:h-8 md:w-8 text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50"
                      onClick={() => saveMealMutation.mutate(meal)}
                      disabled={saveMealMutation.isPending}
                    >
                      <Star className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </div>
                  <p className="text-xs md:text-sm text-neutral-600 mt-1 line-clamp-2">{meal.description}</p>
                  
                  {meal.tags && Array.isArray(meal.tags) && meal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {meal.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-neutral-100">
                    {[ { label: "Calories", value: meal.calories }, { label: "Protein", value: `${meal.protein}g` }, { label: "Carbs", value: `${meal.carbs}g` }, { label: "Fat", value: `${meal.fat}g` } ].map(item => (
                      <div key={item.label} className="text-center">
                        <div className="text-xs md:text-sm font-medium text-neutral-700">{item.value}</div>
                        <div className="text-xs text-neutral-500">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {typeof meal.prepTime === 'number' && meal.difficulty && (
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-neutral-100 text-xs md:text-sm">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-neutral-400" />
                        <span className="text-neutral-600">{meal.prepTime} min</span>
                      </div>
                      <div className={`font-medium ${getDifficultyInfo(meal.difficulty).color}`}>
                        {getDifficultyInfo(meal.difficulty).label}
                      </div>
                    </div>
                  )}
                </div>
                
                {meal.id && !showDailyPlanGenerator && (
                  <div className="bg-neutral-50 px-4 py-2 border-t border-neutral-200">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-between text-primary-600 hover:text-primary-700 hover:bg-primary-50 text-xs md:text-sm"
                      onClick={() => toast({ title: "Recipe details coming soon!" })}
                    >
                      <span>View Full Recipe</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !showDailyPlanGenerator && !isLoading && !isFetching && (!currentRecommendations || currentRecommendations.length === 0) ? (
          <div className="text-center py-10 text-neutral-500">
            <Utensils className="h-12 w-12 mx-auto mb-2 text-neutral-400" />
            <p>No meal recommendations found for your criteria.</p>
            <p className="text-sm">Try adjusting meal type or preferences.</p>
          </div>
        ) : null}

        {/* Daily Meal Plan Generator and Display Section */}
        {showDailyPlanGenerator && (
          <div className="mt-6 pt-4 border-t border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary-500" />
              Daily Meal Plan Generator
            </h3>
            <div className="space-y-3 p-3 bg-neutral-50 rounded-md border border-neutral-200">
              <div>
                <label htmlFor="targetCalories" className="block text-sm font-medium text-neutral-700 mb-1">Target Daily Calories:</label>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-neutral-400" />
                  <input 
                    type="number" 
                    id="targetCalories" 
                    value={targetCalories}
                    onChange={(e) => setTargetCalories(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="e.g., 2000"
                  />
                </div>
              </div>
               {showPreferences && (
                 <div className="space-y-2">
                   <p className="text-sm font-medium text-neutral-700">Dietary Preferences for Plan:</p>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                     {availablePreferences.map((pref) => (
                       <Button 
                         key={pref} 
                         variant={preferences.includes(pref) ? "secondary" : "ghost"}
                         size="sm"
                         onClick={() => togglePreference(pref)}
                         className="text-xs justify-start h-auto py-1.5 px-2 truncate"
                       >
                         {pref}
                       </Button>
                     ))}
                   </div>
                 </div>
               )}
               <Button variant="link" size="sm" onClick={() => setShowPreferences(!showPreferences)} className="text-primary-600 px-0 text-xs">
                 {showPreferences ? "Hide" : "Show"} Dietary Preferences for Plan
               </Button>
               <Button 
                 onClick={() => dailyPlanMutation.mutate({ targetCalories, preferences })}
                 disabled={dailyPlanMutation.isPending || targetCalories <=0}
                 className="w-full gap-2 mt-2"
               >
                 {dailyPlanMutation.isPending ? (
                   <RefreshCw className="h-4 w-4 animate-spin" />
                 ) : (
                   <Sparkles className="h-4 w-4" />
                 )}
                 Generate Daily Plan
               </Button>
             </div>

             {dailyPlanMutation.isPending && (
               <div className="space-y-4 mt-4">
                 {[...Array(3)].map((_, i) => (
                   <div key={i} className="bg-white p-4 rounded-lg border border-neutral-200">
                     <Skeleton className="h-5 w-3/4 mb-2" />
                     <Skeleton className="h-4 w-full mb-1" />
                     <Skeleton className="h-4 w-5/6 mb-3" />
                     <div className="grid grid-cols-4 gap-2 pt-2 border-t border-neutral-100">
                       {[...Array(4)].map((_,j) => <Skeleton key={j} className="h-10 w-full" />)}
                     </div>
                   </div>
                 ))}
               </div>
             )}

             {dailyPlanMutation.isError && (
               <div className="text-center py-6 text-red-500">
                 <p>Could not generate daily plan. {dailyPlanMutation.error?.message}</p>
               </div>
             )}

             {dailyPlan && !dailyPlanMutation.isPending && (
               <div className="mt-4 space-y-4">
                 {(Object.keys(dailyPlan) as Array<keyof DailyMealPlan>).map((mealTime) => {
                   const mealDetails = dailyPlan[mealTime];
                   if (!mealDetails) return null;
                   return (
                     <div key={mealTime} className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
                       <div className="p-4">
                         <div className="flex justify-between items-start">
                           <h4 className="text-md md:text-lg font-semibold capitalize text-neutral-800">{mealTime} - {mealDetails.name}</h4>
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-7 w-7 md:h-8 md:w-8 text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50"
                             onClick={() => saveMealMutation.mutate(mealDetails)} 
                             disabled={saveMealMutation.isPending}
                           >
                             <Star className="h-4 w-4 md:h-5 md:w-5" />
                           </Button>
                         </div>
                         <p className="text-xs md:text-sm text-neutral-600 mt-1 line-clamp-3">{mealDetails.description}</p>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-neutral-100">
                           {[ { label: "Calories", value: mealDetails.calories }, { label: "Protein", value: `${mealDetails.protein}g` }, { label: "Carbs", value: `${mealDetails.carbs}g` }, { label: "Fat", value: `${mealDetails.fat}g` } ].map(item => (
                             <div key={item.label} className="text-center">
                               <div className="text-xs md:text-sm font-medium text-neutral-700">{item.value}</div>
                               <div className="text-xs text-neutral-500">{item.label}</div>
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>
                   );
                 })}
                 <div className="text-center mt-3 text-sm text-neutral-700 font-semibold">
                   Total Estimated Calories: {Object.values(dailyPlan).reduce((sum, meal) => sum + (meal?.calories || 0), 0)}
                 </div>
               </div>
             )}
           </div>
         )}
       </CardContent>
     </Card>
   );
 }