import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, BarChart2, PieChart, CalendarCheck, Trophy } from "lucide-react";
import { WeeklyStats } from "@shared/schema";

export function OverviewCard({ stats, daysOfWeek }: { stats: WeeklyStats | undefined, daysOfWeek: string[] }) {
  if (!stats) return (
    <Card className="card-gradient glass-effect rounded-xl border border-neutral-800">
      <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
      <CardContent className="text-neutral-400 text-center py-8">No stats available.</CardContent>
    </Card>
  );
  const caloriesByDay = stats.caloriesByDay as Record<string, number>;
  return (
    <Card className="card-gradient glass-effect rounded-xl border border-neutral-800">
      <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-primary-900 to-neutral-900 rounded-xl p-5 shadow-md flex items-center gap-4" aria-label="Average Daily Calories" tabIndex={0}>
            <Flame className="w-8 h-8 text-primary-200 bg-primary-900 rounded-full p-1 shadow" />
            <div>
              <span className="block text-primary-200 text-sm font-medium mb-1">Avg. Daily Calories</span>
              <span className="text-2xl font-bold text-primary-100" aria-live="polite">{stats.averageCalories ?? '--'}</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-900 to-neutral-900 rounded-xl p-5 shadow-md flex items-center gap-4" aria-label="Meals Tracked" tabIndex={0}>
            <BarChart2 className="w-8 h-8 text-blue-200 bg-blue-900 rounded-full p-1 shadow" />
            <div>
              <span className="block text-blue-200 text-sm font-medium mb-1">Meals Tracked</span>
              <span className="text-2xl font-bold text-blue-100" aria-live="polite">{stats.mealsTracked ?? 0}</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-900 to-neutral-900 rounded-xl p-5 shadow-md flex items-center gap-4" aria-label="Average Protein" tabIndex={0}>
            <PieChart className="w-8 h-8 text-amber-200 bg-amber-900 rounded-full p-1 shadow" />
            <div>
              <span className="block text-amber-200 text-sm font-medium mb-1">Protein (avg)</span>
              <span className="text-2xl font-bold text-amber-100" aria-live="polite">{stats.averageProtein ?? '--'}g</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-900 to-neutral-900 rounded-xl p-5 shadow-md flex items-center gap-4" aria-label="Healthiest Day" tabIndex={0}>
            <CalendarCheck className="w-8 h-8 text-green-200 bg-green-900 rounded-full p-1 shadow" />
            <div>
              <span className="block text-green-200 text-sm font-medium mb-1">Healthiest Day</span>
              <span className="text-2xl font-bold text-green-100" aria-live="polite">{stats.healthiestDay ?? '--'}</span>
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
              <span className="text-2xl font-bold text-fuchsia-100" aria-live="polite">{(() => {
                let streak = 0;
                for (let i = daysOfWeek.length - 1; i >= 0; i--) {
                  const cals = caloriesByDay?.[daysOfWeek[i]] ?? 0;
                  if (cals >= 1500 && cals <= 2200) streak++;
                  else break;
                }
                return streak;
              })()} days</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-900 to-neutral-900 rounded-xl p-5 shadow flex items-center gap-4" aria-label="Longest Streak" tabIndex={0}>
            <Trophy className="w-8 h-8 text-indigo-200 bg-indigo-900 rounded-full p-1 shadow" />
            <div>
              <span className="block text-indigo-200 text-sm font-medium mb-1">Longest Streak</span>
              <span className="text-2xl font-bold text-indigo-100" aria-live="polite">{(() => {
                let streak = 0, maxStreak = 0;
                for (let i = 0; i < daysOfWeek.length; i++) {
                  const cals = caloriesByDay?.[daysOfWeek[i]] ?? 0;
                  if (cals >= 1500 && cals <= 2200) {
                    streak++;
                    maxStreak = Math.max(maxStreak, streak);
                  } else {
                    streak = 0;
                  }
                }
                return maxStreak;
              })()} days</span>
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
              const consumed = Object.values(caloriesByDay ?? {}).reduce((a, b) => a + b, 0);
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
            <span>Consumed: {Object.values(caloriesByDay ?? {}).reduce((a, b) => a + b, 0)} kcal</span>
            <span>Goal: 14000 kcal</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
