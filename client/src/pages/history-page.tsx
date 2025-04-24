import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { MealAnalysis } from "@shared/schema";
import { Loader2, Calendar, ChevronLeft } from "lucide-react";
import { NutritionChart } from "@/components/dashboard/nutrition-chart";
import { Link } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const { data: analyses, isLoading, error } = useQuery<MealAnalysis[]>({
    queryKey: ["/api/meal-analyses"],
  });

  // Group analyses by date
  const groupedAnalyses = analyses?.reduce<Record<string, MealAnalysis[]>>((groups, analysis) => {
    const date = format(new Date(analysis.timestamp), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(analysis);
    return groups;
  }, {}) || {};

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedAnalyses).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Meal History</h1>
              <p className="text-neutral-600">View your past meal analyses and nutrition data</p>
            </div>

            <Link href="/dashboard">
              <Button variant="outline" className="flex items-center">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-neutral-600">Error loading meal history</p>
              </CardContent>
            </Card>
          ) : analyses && analyses.length > 0 ? (
            <div className="space-y-8">
              {sortedDates.map(date => (
                <div key={date}>
                  <div className="flex items-center mb-4">
                    <Calendar className="h-5 w-5 text-primary-600 mr-2" />
                    <h2 className="text-xl font-semibold text-neutral-800">
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {groupedAnalyses[date].map(analysis => (
                      <Card key={analysis.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-48 h-48 bg-neutral-200">
                              <img 
                                src={analysis.imageData} 
                                alt={analysis.foodName} 
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="p-6 flex-grow">
                              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                                <div>
                                  <h3 className="text-xl font-medium text-neutral-900">{analysis.foodName}</h3>
                                  <p className="text-sm text-neutral-500">
                                    {format(new Date(analysis.timestamp), 'h:mm a')}
                                  </p>
                                </div>
                                <div className="mt-2 md:mt-0 flex items-center bg-primary-50 text-primary-800 py-1 px-3 rounded-full text-sm font-medium">
                                  <span>{analysis.calories} calories</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-neutral-700">Protein</span>
                                    <span className="text-sm text-neutral-600">{analysis.protein}g</span>
                                  </div>
                                  <NutritionChart 
                                    value={analysis.protein} 
                                    maxValue={50} 
                                    color="bg-chart-1" 
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-neutral-700">Carbs</span>
                                    <span className="text-sm text-neutral-600">{analysis.carbs}g</span>
                                  </div>
                                  <NutritionChart 
                                    value={analysis.carbs} 
                                    maxValue={100} 
                                    color="bg-chart-2" 
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-neutral-700">Fat</span>
                                    <span className="text-sm text-neutral-600">{analysis.fat}g</span>
                                  </div>
                                  <NutritionChart 
                                    value={analysis.fat} 
                                    maxValue={40} 
                                    color="bg-chart-3" 
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-neutral-700">Fiber</span>
                                    <span className="text-sm text-neutral-600">{analysis.fiber}g</span>
                                  </div>
                                  <NutritionChart 
                                    value={analysis.fiber} 
                                    maxValue={20} 
                                    color="bg-chart-4" 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center py-20">
                <p className="text-neutral-600 mb-4">No meal analyses found</p>
                <Link href="/">
                  <Button>
                    Scan a Meal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}