import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MealAnalysis } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { NutritionChart } from "./nutrition-chart";
import { formatDistanceToNow } from "date-fns";

export function RecentResultsCard() {
  const { data: analyses, isLoading, error } = useQuery<MealAnalysis[]>({
    queryKey: ["/api/meal-analyses"],
  });

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center">
        <div>
          <CardTitle className="text-xl font-semibold text-neutral-800">Recent Results</CardTitle>
          <p className="text-neutral-600 text-sm mt-1">Your latest meal analysis</p>
        </div>
        <Link href="/history">
          <a className="text-sm font-medium text-primary hover:text-primary-700">View All</a>
        </Link>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-neutral-600">
            <p>Error loading results</p>
          </div>
        ) : analyses && analyses.length > 0 ? (
          <div className="divide-y divide-neutral-200">
            {analyses.slice(0, 3).map((analysis) => (
              <div key={analysis.id} className="p-6 flex flex-col md:flex-row">
                <div className="flex-shrink-0 w-full md:w-32 h-24 md:h-32 mb-4 md:mb-0 md:mr-6 bg-neutral-200 rounded-lg overflow-hidden relative">
                  <img
                    src={analysis.imageUrl || '/placeholder-food.jpg'}
                    alt={analysis.foodName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-neutral-900">{analysis.foodName}</h3>
                      <p className="text-sm text-neutral-500">
                        {analysis.analysisTimestamp ? formatDistanceToNow(new Date(analysis.analysisTimestamp), { addSuffix: true }) : 'No date available'}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0 flex items-center bg-primary-50 text-primary-800 py-1 px-3 rounded-full text-sm font-medium">
                      <span>{analysis.estimatedCalories || 0} calories</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-neutral-700">Protein</span>
                        <span className="text-sm text-neutral-600">{parseFloat(analysis.estimatedProtein || '0')}g</span>
                      </div>
                      <NutritionChart
                        value={parseFloat(analysis.estimatedProtein || '0')}
                        maxValue={50}
                        color="bg-chart-1"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-neutral-700">Carbs</span>
                        <span className="text-sm text-neutral-600">{parseFloat(analysis.estimatedCarbs || '0')}g</span>
                      </div>
                      <NutritionChart
                        value={parseFloat(analysis.estimatedCarbs || '0')}
                        maxValue={100}
                        color="bg-chart-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-neutral-700">Fat</span>
                        <span className="text-sm text-neutral-600">{parseFloat(analysis.estimatedFat || '0')}g</span>
                      </div>
                      <NutritionChart
                        value={parseFloat(analysis.estimatedFat || '0')}
                        maxValue={40}
                        color="bg-chart-3"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-neutral-700">Fiber</span>
                        <span className="text-sm text-neutral-600">0g</span>
                      </div>
                      <NutritionChart
                        value={0}
                        maxValue={20}
                        color="bg-chart-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-neutral-600">
            <p>No meal analyses yet. Take a photo of your meal to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
