import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Check } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

interface TipsResponse {
  tips: string[];
}

export function NutritionTipsCard() {
  const { data, isLoading, error } = useQuery<TipsResponse>({
    queryKey: ["/api/nutrition-tips"],
    queryFn: getQueryFn({ on401: "returnNull" })
  });

  // Fallback tips in case API fails
  const fallbackTips = [
    "Try to include protein with every meal for better satiety",
    "Aim for at least 5 servings of fruits and vegetables daily",
    "Stay hydrated by drinking water before and during meals",
    "Choose whole grains over refined carbohydrates when possible"
  ];

  // Use fallback if data is missing, not an array, or empty
  const tips = Array.isArray(data?.tips) && data.tips.length > 0 ? data.tips : fallbackTips;

  return (
    <Card className="card-gradient hover-effect rounded-xl overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-neutral-200">
        <CardTitle className="text-xl font-semibold text-neutral-900">Nutrition Tips</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {tips.map((tip, index) => (
              <li key={index} className="py-3 px-2">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-primary-500" />
                  </div>
                  <p className="ml-3 text-sm text-neutral-800">{tip}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {error instanceof Error || !!error ? (
          <div className="text-red-500 text-sm mt-2">Failed to load tips. Showing default tips.</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
