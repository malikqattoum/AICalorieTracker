import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { MealAnalysis } from "@shared/schema";
import { LineChart } from "lucide-react";
import { format } from "date-fns";

export function MealTrendsCard() {
  const { data: analyses, isLoading } = useQuery<MealAnalysis[]>({
    queryKey: ["/api/meal-analyses"],
  });

  // Aggregate daily totals for calories, protein, carbs, fat
  const dailyTotals: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
  (analyses || []).forEach(a => {
    const date = format(new Date(a.timestamp), "yyyy-MM-dd");
    if (!dailyTotals[date]) {
      dailyTotals[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    dailyTotals[date].calories += a.calories;
    dailyTotals[date].protein += a.protein;
    dailyTotals[date].carbs += a.carbs;
    dailyTotals[date].fat += a.fat;
  });
  const sortedDates = Object.keys(dailyTotals).sort();

  // Prepare data for charting
  const chartData = sortedDates.map(date => ({
    date,
    ...dailyTotals[date],
  }));

  return (
    <Card className="card-gradient hover-effect rounded-xl overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-neutral-200 flex items-center gap-2">
        <LineChart className="h-5 w-5 text-primary-500" />
        <CardTitle className="text-xl font-semibold text-neutral-800">Meal Trends</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8 text-primary">
            Loading trends...
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-neutral-300 text-center py-8">No meal data to show trends.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">Date</th>
                  <th className="px-2 py-1 text-left">Calories</th>
                  <th className="px-2 py-1 text-left">Protein</th>
                  <th className="px-2 py-1 text-left">Carbs</th>
                  <th className="px-2 py-1 text-left">Fat</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map(row => (
                  <tr key={row.date}>
                    <td className="px-2 py-1">{format(new Date(row.date), "MMM d")}</td>
                    <td className="px-2 py-1">{row.calories}</td>
                    <td className="px-2 py-1">{row.protein}g</td>
                    <td className="px-2 py-1">{row.carbs}g</td>
                    <td className="px-2 py-1">{row.fat}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
