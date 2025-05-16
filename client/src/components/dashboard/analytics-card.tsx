import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, PieChart } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { WeeklyStats } from "@shared/schema";

export function AnalyticsCard({ stats, daysOfWeek }: { stats: WeeklyStats | undefined, daysOfWeek: string[] }) {
  if (!stats) return null;
  const macrosByDay = stats.macrosByDay ?? {};
  // Macro breakdowns and analytics charts from StatsCard
  return (
    <Card className="card-gradient glass-effect rounded-xl border border-neutral-800">
      <CardHeader><CardTitle>Analytics</CardTitle></CardHeader>
      <CardContent>
        {/* Calorie Trend */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-5 h-5 text-primary-500" />
            <h3 className="font-medium text-neutral-900">Calorie Trend</h3>
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
                  <span className={`text-xs mt-2 ${isPastOrToday ? 'text-neutral-100' : 'text-neutral-500'}`}>{day.substring(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>
        {/* Weekly Nutrition Breakdown */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-5 h-5 text-primary-200" />
            <h3 className="font-medium text-primary-100">Weekly Nutrition Breakdown</h3>
          </div>
          <div className="h-64 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg p-4 shadow-inner">
            <ChartContainer config={{ calories: { label: "Calories", color: "#4CAF50" } }}>
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
          </div>
        </div>
        {/* Macro Distribution Line Chart (per-day breakdown) */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-5 h-5 text-amber-200" />
            <h3 className="font-medium text-amber-500">Macro Distribution</h3>
          </div>
          <div className="h-56 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg p-4 flex items-center justify-center shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={daysOfWeek.map(day => {
                  const macros = macrosByDay[day] || { protein: 0, carbs: 0, fat: 0 };
                  return {
                    name: day.substring(0, 3),
                    Protein: macros.protein,
                    Carbs: macros.carbs,
                    Fat: macros.fat,
                  };
                })}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip contentStyle={{ background: '#23272b', border: '1px solid #333', color: '#fff' }} />
                <Legend />
                <Line type="monotone" dataKey="Protein" stroke="#a78bfa" strokeWidth={2} dot />
                <Line type="monotone" dataKey="Carbs" stroke="#2dd4bf" strokeWidth={2} dot />
                <Line type="monotone" dataKey="Fat" stroke="#fbbf24" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Add a summary below the chart */}
          <div className="mt-4 text-sm text-neutral-600 text-center">
            {(() => {
              let totalProtein = 0, totalCarbs = 0, totalFat = 0;
              for (const day of daysOfWeek) {
                const macros = macrosByDay[day] || { protein: 0, carbs: 0, fat: 0 };
                totalProtein += macros.protein;
                totalCarbs += macros.carbs;
                totalFat += macros.fat;
              }
              const total = totalProtein + totalCarbs + totalFat;
              const pct = (val: number) => total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                <>
                  <span className="mr-4">Protein: <span className="text-amber-600 font-semibold">{totalProtein}g</span> ({pct(totalProtein)}%)</span>
                  <span className="mr-4">Carbs: <span className="text-teal-600 font-semibold">{totalCarbs}g</span> ({pct(totalCarbs)}%)</span>
                  <span>Fat: <span className="text-yellow-600 font-semibold">{totalFat}g</span> ({pct(totalFat)}%)</span>
                </>
              );
            })()}
          </div>
        </div>
        {/* Macro Consistency Chart */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-5 h-5 text-primary-200" />
            <h3 className="font-medium text-primary-100">Macro Consistency</h3>
          </div>
          <div className="h-56 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg p-4 flex items-center justify-center shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={daysOfWeek.map(day => {
                  const macros = macrosByDay[day] || { protein: 0, carbs: 0, fat: 0 };
                  const total = macros.protein + macros.carbs + macros.fat;
                  return {
                    name: day.substring(0, 3),
                    Protein: total > 0 ? Math.round((macros.protein / total) * 100) : 0,
                    Carbs: total > 0 ? Math.round((macros.carbs / total) * 100) : 0,
                    Fat: total > 0 ? Math.round((macros.fat / total) * 100) : 0,
                  };
                })}
              >
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${v}%`} contentStyle={{ background: '#23272b', border: '1px solid #333', color: '#fff' }} />
                <Legend />
                <Line type="monotone" dataKey="Protein" stroke="#a78bfa" strokeWidth={2} dot />
                <Line type="monotone" dataKey="Carbs" stroke="#2dd4bf" strokeWidth={2} dot />
                <Line type="monotone" dataKey="Fat" stroke="#fbbf24" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Macro Consistency: Add average and best day summary below the chart */}
          <div className="mt-4 text-sm text-emerald-600 text-center">
            {(() => {
              let bestDay = daysOfWeek[0];
              let bestScore = -Infinity;
              let avgConsistency = 0;
              let count = 0;
              for (const day of daysOfWeek) {
                const macros = macrosByDay[day] || { protein: 0, carbs: 0, fat: 0 };
                const total = macros.protein + macros.carbs + macros.fat;
                if (total === 0) continue;
                // Score: closer to 30/45/25 is better
                const p = macros.protein / total, c = macros.carbs / total, f = macros.fat / total;
                const diff = Math.abs(p - 0.3) + Math.abs(c - 0.45) + Math.abs(f - 0.25);
                const score = 1 - diff; // higher is better
                avgConsistency += score;
                count++;
                if (score > bestScore) {
                  bestScore = score;
                  bestDay = day;
                }
              }
              avgConsistency = count > 0 ? Math.round((avgConsistency / count) * 100) : 0;
              return (
                <>
                  <span className="mr-4">Avg. Consistency: <span className="font-semibold">{avgConsistency}%</span></span>
                  <span className="mr-4">Best Macro Day: <span className="font-semibold">{bestDay}</span></span>
                </>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
