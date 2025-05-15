import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { WeeklyStats } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, Minus, Trophy, Flame, BarChart2, CalendarCheck, PieChart, Sparkles } from "lucide-react";

export function StatsCard() {
  const { data: stats, isLoading, error } = useQuery<WeeklyStats>({
    queryKey: ["/api/weekly-stats"],
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Card className="card-gradient glass-effect hover-effect rounded-xl shadow-lg border border-neutral-800 overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-neutral-800 bg-gradient-to-r from-neutral-900/80 to-neutral-800/80">
        <CardTitle className="text-xl font-semibold text-primary-200">Your Stats</CardTitle>
        <p className="text-neutral-400 text-sm mt-1">This week's summary</p>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-300" />
          </div>
        ) : error || !stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-900/80 rounded-lg p-4 shadow-md">
              <span className="block text-primary-300 text-sm font-medium mb-1">Avg. Daily Calories</span>
              <span className="text-2xl font-bold text-primary-100">--</span>
            </div>
            <div className="bg-blue-900/80 rounded-lg p-4 shadow-md">
              <span className="block text-blue-200 text-sm font-medium mb-1">Meals Tracked</span>
              <span className="text-2xl font-bold text-blue-100">0</span>
            </div>
            <div className="bg-amber-900/80 rounded-lg p-4 shadow-md">
              <span className="block text-amber-200 text-sm font-medium mb-1">Protein (avg)</span>
              <span className="text-2xl font-bold text-amber-100">--</span>
            </div>
            <div className="bg-green-900/80 rounded-lg p-4 shadow-md">
              <span className="block text-green-200 text-sm font-medium mb-1">Healthiest Day</span>
              <span className="text-2xl font-bold text-green-100">--</span>
            </div>

            <div className="col-span-2 mt-6">
              <h3 className="font-medium text-primary-200 mb-3">Calorie Trend</h3>
              <div className="h-48 bg-neutral-800/80 rounded-lg flex items-end justify-between p-4">
                {daysOfWeek.map((day, index) => (
                  <div key={day} className="w-1/7 flex flex-col items-center">
                    <div className="bg-primary-700 w-full rounded-t-sm" style={{ height: "0%" }}></div>
                    <span className="text-xs mt-2 text-neutral-400">{day.substring(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-primary-900 to-neutral-900 rounded-xl p-5 shadow-md hover:shadow-xl transition-shadow duration-200 flex items-center gap-4" aria-label="Average Daily Calories" tabIndex={0}>
                <Flame className="w-8 h-8 text-primary-200 bg-primary-900 rounded-full p-1 shadow" />
                <div>
                  <span className="block text-primary-200 text-sm font-medium mb-1">Avg. Daily Calories</span>
                  <span className="text-2xl font-bold text-primary-100" aria-live="polite">{stats.averageCalories}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-900 to-neutral-900 rounded-xl p-5 shadow-md hover:shadow-xl transition-shadow duration-200 flex items-center gap-4" aria-label="Meals Tracked" tabIndex={0}>
                <BarChart2 className="w-8 h-8 text-blue-200 bg-blue-900 rounded-full p-1 shadow" />
                <div>
                  <span className="block text-blue-200 text-sm font-medium mb-1">Meals Tracked</span>
                  <span className="text-2xl font-bold text-blue-100" aria-live="polite">{stats.mealsTracked}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-900 to-neutral-900 rounded-xl p-5 shadow-md hover:shadow-xl transition-shadow duration-200 flex items-center gap-4" aria-label="Average Protein" tabIndex={0}>
                <PieChart className="w-8 h-8 text-amber-200 bg-amber-900 rounded-full p-1 shadow" />
                <div>
                  <span className="block text-amber-200 text-sm font-medium mb-1">Protein (avg)</span>
                  <span className="text-2xl font-bold text-amber-100" aria-live="polite">{stats.averageProtein}g</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-900 to-neutral-900 rounded-xl p-5 shadow-md hover:shadow-xl transition-shadow duration-200 flex items-center gap-4" aria-label="Healthiest Day" tabIndex={0}>
                <CalendarCheck className="w-8 h-8 text-green-200 bg-green-900 rounded-full p-1 shadow" />
                <div>
                  <span className="block text-green-200 text-sm font-medium mb-1">Healthiest Day</span>
                  <span className="text-2xl font-bold text-green-100" aria-live="polite">{stats.healthiestDay}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="my-8 border-t border-neutral-800" />

            {/* Streak Tracking */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-fuchsia-900 to-neutral-900 rounded-xl p-5 shadow flex items-center gap-4" aria-label="Current Streak" tabIndex={0}>
                <Trophy className="w-8 h-8 text-fuchsia-200 bg-fuchsia-900 rounded-full p-1 shadow" />
                <div>
                  <span className="block text-fuchsia-200 text-sm font-medium mb-1">Current Streak</span>
                  <span className="text-2xl font-bold text-fuchsia-100" aria-live="polite">{0} days</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-900 to-neutral-900 rounded-xl p-5 shadow flex items-center gap-4" aria-label="Longest Streak" tabIndex={0}>
                <Trophy className="w-8 h-8 text-indigo-200 bg-indigo-900 rounded-full p-1 shadow" />
                <div>
                  <span className="block text-indigo-200 text-sm font-medium mb-1">Longest Streak</span>
                  <span className="text-2xl font-bold text-indigo-100" aria-live="polite">{0} days</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="my-8 border-t border-neutral-800" />

            {/* Weekly Calorie Goal Progress */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-5 h-5 text-primary-200" />
                <h3 className="font-medium text-primary-100">Weekly Calorie Goal Progress</h3>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-4 overflow-hidden">
                {(() => {
                  const goal = 14000;
                  const consumed = Object.values(stats.caloriesByDay as Record<string, number>).reduce((a, b) => a + b, 0);
                  const percent = Math.min(100, Math.round((consumed / goal) * 100));
                  return (
                    <div
                      className="h-4 bg-gradient-to-r from-primary-400 to-primary-700 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                      aria-label={`Weekly calorie goal progress: ${percent}%`}
                    />
                  );
                })()}
              </div>
              <div className="flex justify-between text-xs mt-1 text-neutral-400">
                <span>Consumed: {Object.values(stats.caloriesByDay as Record<string, number>).reduce((a, b) => a + b, 0)} kcal</span>
                <span>Goal: 14000 kcal</span>
              </div>
            </div>

            {/* Divider */}
            <div className="my-8 border-t border-neutral-800" />

            {/* Calorie Trend */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-5 h-5 text-primary-200" />
                <h3 className="font-medium text-primary-100">Calorie Trend</h3>
              </div>
              <div className="h-48 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg flex items-end justify-between p-4 shadow-inner">
                {daysOfWeek.map((day) => {
                  const calories = (stats.caloriesByDay as Record<string, number>)[day] || 0;
                  const maxCalories = Math.max(...Object.values(stats.caloriesByDay as Record<string, number>));
                  const percentage = maxCalories > 0 ? (calories / maxCalories) * 100 : 0;
                  const today = new Date().getDay();
                  const dayIndex = daysOfWeek.indexOf(day);
                  const isPastOrToday = dayIndex <= today;
                  return (
                    <div key={day} className="w-1/7 flex flex-col items-center">
                      <div 
                        className={isPastOrToday ? "bg-primary-400 w-full rounded-t-sm" : "bg-primary-900 w-full rounded-t-sm"} 
                        style={{ height: `${percentage}%` }}
                        aria-label={`Calories for ${day}: ${calories}`}
                      ></div>
                      <span className={`text-xs mt-2 ${isPastOrToday ? 'text-primary-100' : 'text-neutral-500'}`}>{day.substring(0, 3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Nutrition Breakdown */}
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-5 h-5 text-primary-200" />
                <h3 className="font-medium text-primary-100">Weekly Nutrition Breakdown</h3>
              </div>
              <div className="h-64 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg p-4 shadow-inner">
                {stats && (
                  <ChartContainer
                    config={{
                      calories: { label: "Calories", color: "#4CAF50" },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={daysOfWeek.map((day) => ({
                          day: day.substring(0, 3),
                          calories: (stats.caloriesByDay as Record<string, number>)[day] || 0,
                        }))}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <XAxis dataKey="day" stroke="#b5e3b6" />
                        <YAxis stroke="#b5e3b6" />
                        <Tooltip contentStyle={{ background: '#23272b', border: '1px solid #333', color: '#fff' }} />
                        <Legend />
                        <Line type="monotone" dataKey="calories" stroke="#4CAF50" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </div>
            </div>

            {/* Nutrition Balance Pie Chart */}
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-5 h-5 text-amber-200" />
                <h3 className="font-medium text-amber-100">Nutrition Balance</h3>
              </div>
              <div className="h-56 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg p-4 flex items-center justify-center shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      const protein = 0;
                      const carbs = 0;
                      const fat = 0;
                      return [
                        { name: 'Protein', value: protein },
                        { name: 'Carbs', value: carbs },
                        { name: 'Fat', value: fat },
                      ];
                    })()}
                  >
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#23272b', border: '1px solid #333', color: '#fff' }} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI-Powered Tip of the Week */}
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-fuchsia-200" />
                <h3 className="font-medium text-fuchsia-100">AI Tip of the Week</h3>
              </div>
              <div className="bg-gradient-to-br from-fuchsia-900 to-neutral-900 rounded-xl p-5 text-fuchsia-100 text-base font-medium shadow-md border border-fuchsia-800">
                {(() => {
                  const tips = [
                    "Try to include a source of protein in every meal for better satiety.",
                    "Drink a glass of water before each meal to help control appetite.",
                    "Aim for colorful plates: more colors usually mean more nutrients!",
                    "Plan your meals ahead to avoid impulsive eating.",
                    "Balance your macros for sustained energy throughout the day."
                  ];
                  const index = Math.floor((new Date().getTime() / (1000 * 60 * 60 * 24 * 7)) % tips.length);
                  return tips[index];
                })()}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}