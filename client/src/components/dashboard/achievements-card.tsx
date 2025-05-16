import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { WeeklyStats } from "@shared/schema";

export function AchievementsCard({ stats, daysOfWeek }: { stats: WeeklyStats | undefined, daysOfWeek: string[] }) {
  if (!stats) return null;
  // Progress badge: streaks
  const caloriesByDay = (stats.caloriesByDay ?? {}) as Record<string, number>;
  const macrosByDay = (stats.macrosByDay ?? {}) as Record<string, { protein: number; carbs: number; fat: number }>;

  const currentStreak = (() => {
    let streak = 0;
    for (let i = daysOfWeek.length - 1; i >= 0; i--) {
      const cals = caloriesByDay?.[daysOfWeek[i]] ?? 0;
      if (cals >= 1500 && cals <= 2200) streak++;
      else break;
    }
    return streak;
  })();
  const longestStreak = (() => {
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
  })();
  // Macro target: best macro day
  let bestDay = daysOfWeek[0];
  let bestScore = -Infinity;
  for (const day of daysOfWeek) {
    const macros = macrosByDay[day] || { protein: 0, carbs: 0, fat: 0 };
    // Score: high protein, moderate carbs, moderate fat
    const score = macros.protein * 2 - Math.abs(macros.carbs - 150) - Math.abs(macros.fat - 60);
    if (score > bestScore) {
      bestScore = score;
      bestDay = day;
    }
  }
  // Improved day: healthiest day
  const healthiestDay = stats.healthiestDay;
  // Meal quality score: average protein
  const avgProtein = stats.averageProtein;
  return (
    <Card className="card-gradient glass-effect rounded-xl border border-neutral-800">
      <CardHeader><CardTitle>Achievements</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-fuchsia-200 bg-fuchsia-900 rounded-full p-1 shadow" />
            <span className="font-medium text-fuchsia-500">Current Streak:</span>
            <span className="text-2xl font-bold text-fuchsia-500">{currentStreak} days</span>
          </div>
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-indigo-200 bg-indigo-900 rounded-full p-1 shadow" />
            <span className="font-medium text-indigo-500">Longest Streak:</span>
            <span className="text-2xl font-bold text-indigo-500">{longestStreak} days</span>
          </div>
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-200 bg-amber-900 rounded-full p-1 shadow" />
            <span className="font-medium text-amber-500">Best Macro Day:</span>
            <span className="text-lg font-bold text-amber-500">{bestDay}</span>
          </div>
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-green-200 bg-green-900 rounded-full p-1 shadow" />
            <span className="font-medium text-green-500">Healthiest Day:</span>
            <span className="text-lg font-bold text-green-500">{healthiestDay ?? '--'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-200 bg-amber-900 rounded-full p-1 shadow" />
            <span className="font-medium text-amber-500">Avg. Protein:</span>
            <span className="text-lg font-bold text-amber-500">{avgProtein ?? '--'}g</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
