import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { MealAnalysis } from "@shared/schema";
import { LineChart, BarChart, ArrowUpDown, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart as RechartsBarChart, Bar } from "recharts";

type ChartType = "line" | "bar";
type TimeRange = "7days" | "14days" | "30days";
type NutrientType = "calories" | "protein" | "carbs" | "fat";

export function EnhancedMealTrendsCard() {
  const [chartType, setChartType] = useState<ChartType>("line");
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");
  const [nutrientType, setNutrientType] = useState<NutrientType>("calories");

  const { data: analyses, isLoading } = useQuery<MealAnalysis[]>({
    queryKey: ["/api/meal-analyses"],
  });

  // Get date range based on selected time range
  const getDateRange = () => {
    const today = new Date();
    switch (timeRange) {
      case "7days":
        return subDays(today, 7);
      case "14days":
        return subDays(today, 14);
      case "30days":
        return subDays(today, 30);
      default:
        return subDays(today, 7);
    }
  };

  // Filter analyses by date range
  const filteredAnalyses = analyses?.filter(analysis => {
    const analysisDate = new Date(analysis.timestamp);
    return analysisDate >= getDateRange();
  }) || [];

  // Aggregate daily totals for calories, protein, carbs, fat
  const dailyTotals: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
  filteredAnalyses.forEach(a => {
    const date = format(new Date(a.timestamp), "yyyy-MM-dd");
    if (!dailyTotals[date]) {
      dailyTotals[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    dailyTotals[date].calories += a.calories;
    dailyTotals[date].protein += a.protein;
    dailyTotals[date].carbs += a.carbs;
    dailyTotals[date].fat += a.fat;
  });

  // Fill in missing dates with zeros
  const dateRange = [];
  const startDate = getDateRange();
  const endDate = new Date();
  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = format(new Date(d), "yyyy-MM-dd");
    dateRange.push(dateStr);
    if (!dailyTotals[dateStr]) {
      dailyTotals[dateStr] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  }

  // Prepare data for charting
  const chartData = dateRange.sort().map(date => ({
    date: format(new Date(date), "MMM d"),
    ...dailyTotals[date],
  }));

  // Get color for nutrient type
  const getNutrientColor = (type: NutrientType) => {
    switch (type) {
      case "calories":
        return "#f97316"; // Orange
      case "protein":
        return "#3b82f6"; // Blue
      case "carbs":
        return "#10b981"; // Green
      case "fat":
        return "#f43f5e"; // Pink
      default:
        return "#f97316";
    }
  };

  // Get label for nutrient type
  const getNutrientLabel = (type: NutrientType) => {
    switch (type) {
      case "calories":
        return "Calories";
      case "protein":
        return "Protein (g)";
      case "carbs":
        return "Carbs (g)";
      case "fat":
        return "Fat (g)";
      default:
        return "Calories";
    }
  };

  // Calculate average for selected nutrient
  const calculateAverage = () => {
    const values = chartData.map(item => item[nutrientType]);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / (values.length || 1));
  };

  // Calculate trend (up, down, or stable)
  const calculateTrend = () => {
    if (chartData.length < 2) return "stable";
    
    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((acc, item) => acc + item[nutrientType], 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((acc, item) => acc + item[nutrientType], 0) / secondHalf.length;
    
    const difference = secondHalfAvg - firstHalfAvg;
    const percentChange = (difference / firstHalfAvg) * 100;
    
    if (percentChange > 5) return "up";
    if (percentChange < -5) return "down";
    return "stable";
  };

  const trend = calculateTrend();
  const average = calculateAverage();

  return (
    <Card className="card-gradient hover-effect rounded-xl overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-neutral-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-neutral-800 flex items-center gap-2">
            {chartType === "line" ? (
              <LineChart className="h-5 w-5 text-primary-500" />
            ) : (
              <BarChart className="h-5 w-5 text-primary-500" />
            )}
            Enhanced Meal Trends
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Tabs defaultValue={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <TabsList className="grid grid-cols-3 h-8">
                <TabsTrigger value="7days" className="text-xs">7 Days</TabsTrigger>
                <TabsTrigger value="14days" className="text-xs">14 Days</TabsTrigger>
                <TabsTrigger value="30days" className="text-xs">30 Days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-[200px] w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-neutral-300 text-center py-8">No meal data to show trends.</div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setChartType("line")}
                  className={`p-1 rounded ${chartType === "line" ? "bg-primary-100 text-primary-700" : "text-neutral-500"}`}
                >
                  <LineChart className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={`p-1 rounded ${chartType === "bar" ? "bg-primary-100 text-primary-700" : "text-neutral-500"}`}
                >
                  <BarChart className="h-5 w-5" />
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setNutrientType("calories")}
                  className={`px-2 py-1 text-xs rounded ${nutrientType === "calories" ? "bg-orange-100 text-orange-700" : "text-neutral-500"}`}
                >
                  Calories
                </button>
                <button
                  onClick={() => setNutrientType("protein")}
                  className={`px-2 py-1 text-xs rounded ${nutrientType === "protein" ? "bg-blue-100 text-blue-700" : "text-neutral-500"}`}
                >
                  Protein
                </button>
                <button
                  onClick={() => setNutrientType("carbs")}
                  className={`px-2 py-1 text-xs rounded ${nutrientType === "carbs" ? "bg-green-100 text-green-700" : "text-neutral-500"}`}
                >
                  Carbs
                </button>
                <button
                  onClick={() => setNutrientType("fat")}
                  className={`px-2 py-1 text-xs rounded ${nutrientType === "fat" ? "bg-pink-100 text-pink-700" : "text-neutral-500"}`}
                >
                  Fat
                </button>
              </div>
            </div>
            
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <RechartsLineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.375rem" }}
                      itemStyle={{ color: "#f3f4f6" }}
                      labelStyle={{ color: "#f3f4f6" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={nutrientType} 
                      stroke={getNutrientColor(nutrientType)} 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 5 }} 
                    />
                  </RechartsLineChart>
                ) : (
                  <RechartsBarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.375rem" }}
                      itemStyle={{ color: "#f3f4f6" }}
                      labelStyle={{ color: "#f3f4f6" }}
                    />
                    <Bar 
                      dataKey={nutrientType} 
                      fill={getNutrientColor(nutrientType)} 
                      radius={[4, 4, 0, 0]}
                    />
                  </RechartsBarChart>
                )}
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-neutral-500" />
                <span className="text-sm text-neutral-500">{timeRange === "7days" ? "Last 7 days" : timeRange === "14days" ? "Last 14 days" : "Last 30 days"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Avg {getNutrientLabel(nutrientType)}: {average}</span>
                <div className={`flex items-center ${trend === "up" ? "text-red-500" : trend === "down" ? "text-green-500" : "text-yellow-500"}`}>
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="text-xs ml-1">
                    {trend === "up" ? "Increasing" : trend === "down" ? "Decreasing" : "Stable"}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}