import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { WeeklyStats } from "@shared/schema";
import { Loader2 } from "lucide-react";

export function StatsCard() {
  const { data: stats, isLoading, error } = useQuery<WeeklyStats>({
    queryKey: ["/api/weekly-stats"],
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Card className="card-gradient hover-effect rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-neutral-200">
        <CardTitle className="text-xl font-semibold text-neutral-800">Your Stats</CardTitle>
        <p className="text-neutral-600 text-sm mt-1">This week's summary</p>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error || !stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary-50 rounded-lg p-4">
              <span className="block text-primary-700 text-sm font-medium mb-1">Avg. Daily Calories</span>
              <span className="text-2xl font-bold text-neutral-900">--</span>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <span className="block text-blue-700 text-sm font-medium mb-1">Meals Tracked</span>
              <span className="text-2xl font-bold text-neutral-900">0</span>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <span className="block text-amber-700 text-sm font-medium mb-1">Protein (avg)</span>
              <span className="text-2xl font-bold text-neutral-900">--</span>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <span className="block text-green-700 text-sm font-medium mb-1">Healthiest Day</span>
              <span className="text-2xl font-bold text-neutral-900">--</span>
            </div>

            <div className="col-span-2 mt-6">
              <h3 className="font-medium text-neutral-900 mb-3">Calorie Trend</h3>
              <div className="h-48 bg-neutral-100 rounded-lg flex items-end justify-between p-4">
                {daysOfWeek.map((day, index) => (
                  <div key={day} className="w-1/7 flex flex-col items-center">
                    <div className="bg-primary-200 w-full rounded-t-sm" style={{ height: "0%" }}></div>
                    <span className="text-xs mt-2 text-neutral-400">{day.substring(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <span className="block text-primary-700 text-sm font-medium mb-1">Avg. Daily Calories</span>
                <span className="text-2xl font-bold text-neutral-900">{stats.averageCalories}</span>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <span className="block text-blue-700 text-sm font-medium mb-1">Meals Tracked</span>
                <span className="text-2xl font-bold text-neutral-900">{stats.mealsTracked}</span>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <span className="block text-amber-700 text-sm font-medium mb-1">Protein (avg)</span>
                <span className="text-2xl font-bold text-neutral-900">{stats.averageProtein}g</span>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <span className="block text-green-700 text-sm font-medium mb-1">Healthiest Day</span>
                <span className="text-2xl font-bold text-neutral-900">{stats.healthiestDay}</span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-neutral-900 mb-3">Calorie Trend</h3>
              <div className="h-48 bg-neutral-100 rounded-lg flex items-end justify-between p-4">
                {daysOfWeek.map((day) => {
                  const calories = stats.caloriesByDay[day] || 0;
                  const maxCalories = Math.max(...Object.values(stats.caloriesByDay));
                  const percentage = maxCalories > 0 ? (calories / maxCalories) * 100 : 0;

                  // Determine if this day is in the past/present or future
                  const today = new Date().getDay();
                  const dayIndex = daysOfWeek.indexOf(day);
                  const isPastOrToday = dayIndex <= today;

                  return (
                    <div key={day} className="w-1/7 flex flex-col items-center">
                      <div 
                        className={isPastOrToday ? "bg-primary-500 w-full rounded-t-sm" : "bg-primary-200 w-full rounded-t-sm"} 
                        style={{ height: `${percentage}%` }}
                      ></div>
                      <span className={`text-xs mt-2 ${isPastOrToday ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        {day.substring(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}