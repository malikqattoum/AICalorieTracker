import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Zap } from "lucide-react";

interface SuggestionsResponse {
  suggestions: string[];
}

export function SmartMealSuggestionsCard() {
  const { data, isLoading, error } = useQuery<SuggestionsResponse>({
    queryKey: ["smart-meal-suggestions"],
    queryFn: () => fetch("/api/smart-meal-suggestions").then(res => res.json())
  });

  // Fallback suggestions in case API fails
  const fallbackSuggestions = [
    "Grilled chicken breast with quinoa and steamed broccoli",
    "Salmon salad with mixed greens, cherry tomatoes, and olive oil vinaigrette",
    "Vegetarian stir-fry with tofu, bell peppers, and brown rice"
  ];

  const suggestions = (data?.suggestions?.length > 0) ? data.suggestions : fallbackSuggestions;

  return (
    <Card className="card-gradient hover-effect rounded-xl overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-neutral-200">
        <CardTitle className="text-xl font-semibold text-neutral-800 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary-500" />
          Smart Meal Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <ul className="divide-y divide-neutral-200">
            {fallbackSuggestions.map((suggestion, index) => (
              <li key={index} className="py-3 px-2">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm text-neutral-700">{suggestion}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="py-3 px-2">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm text-neutral-700">{suggestion}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
