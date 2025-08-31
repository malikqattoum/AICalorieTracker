import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { MealAnalysis } from "@shared/schema";
import { LineChart as LineChartIcon } from "lucide-react";
import { format } from "date-fns";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function MealTrendsCard() {
  const { data: analyses, isLoading } = useQuery<MealAnalysis[]>({
    queryKey: ["/api/meal-analyses"],
  });

  // Aggregate daily totals for calories, protein, carbs, fat
  const dailyTotals: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
  (analyses || []).forEach(a => {
    if (a.analysisTimestamp) {
      const date = format(new Date(a.analysisTimestamp), "yyyy-MM-dd");
      if (!dailyTotals[date]) {
        dailyTotals[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      dailyTotals[date].calories += a.estimatedCalories || 0;
      dailyTotals[date].protein += parseFloat(a.estimatedProtein || '0');
      dailyTotals[date].carbs += parseFloat(a.estimatedCarbs || '0');
      dailyTotals[date].fat += parseFloat(a.estimatedFat || '0');
    }
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
        <LineChartIcon className="h-5 w-5 text-primary-500" />
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
          <div className="h-64">
            <ChartContainer config={{
              calories: { label: "Calories", color: "#4CAF50" },
              protein: { label: "Protein (g)", color: "#a78bfa" },
              carbs: { label: "Carbs (g)", color: "#2dd4bf" },
              fat: { label: "Fat (g)", color: "#fbbf24" }
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.map(row => ({
                  ...row,
                  date: format(new Date(row.date), "MMM d")
                }))}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip contentStyle={{ background: '#23272b', border: '1px solid #333', color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="calories" stroke="#4CAF50" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="protein" stroke="#a78bfa" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="carbs" stroke="#2dd4bf" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="fat" stroke="#fbbf24" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
