import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyStats } from "@shared/schema";

export function AiInsightsCard({ stats, daysOfWeek }: { stats: WeeklyStats | undefined, daysOfWeek: string[] }) {
  if (!stats) return null;
  // AI insights logic from StatsCard
  const caloriesByDay = (stats.caloriesByDay ?? {}) as Record<string, number>;
  const macrosByDay = (stats.macrosByDay ?? {}) as Record<string, { protein: number; carbs: number; fat: number }>;

  const calorieVals = Object.values(caloriesByDay) as number[];
  const calories = calorieVals.reduce((a, b) => a + b, 0);
  const days = Object.keys(caloriesByDay).length;
  let msg = `Your average daily calories this week: ${days ? Math.round(calories / days) : 0}.`;
  if (days ? Math.round(calories / days) : 0 > 2200) msg += " Consider reducing your portions for weight loss.";
  else if (days ? Math.round(calories / days) : 0 < 1500) msg += " You may want to eat a bit more for energy.";
  else msg += " Great job staying in a healthy range!";
  // Macro balance insight
  let totalProtein = 0, totalCarbs = 0, totalFat = 0;
  for (const day of daysOfWeek) {
    const macros = macrosByDay[day] || { protein: 0, carbs: 0, fat: 0 };
    totalProtein += macros.protein;
    totalCarbs += macros.carbs;
    totalFat += macros.fat;
  }
  const macroTotal = totalProtein + totalCarbs + totalFat;
  if (macroTotal > 0) {
    const pctProtein = Math.round((totalProtein / macroTotal) * 100);
    const pctCarbs = Math.round((totalCarbs / macroTotal) * 100);
    const pctFat = Math.round((totalFat / macroTotal) * 100);
    msg += `\nMacro ratio: Protein ${pctProtein}%, Carbs ${pctCarbs}%, Fat ${pctFat}%.`;
    if (pctProtein < 15) msg += " Consider increasing your protein intake for muscle maintenance.";
    if (pctCarbs > 60) msg += " Your carb intake is quite high; try to balance with more protein and healthy fats.";
    if (pctFat > 40) msg += " Fat intake is above recommended; consider reducing fatty foods.";
  }
  // Consistency insight
  const calorieStd = (() => {
    if (calorieVals.length < 2) return 0;
    const mean = calorieVals.reduce((a, b) => a + b, 0) / calorieVals.length;
    const variance = calorieVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (calorieVals.length - 1);
    return Math.sqrt(variance);
  })();
  if (calorieStd > 400) msg += "\nYour daily calories fluctuate a lot. Try to keep your intake more consistent for best results.";
  // Best macro day
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
  msg += `\nBest macro day: ${bestDay} (score: ${bestScore.toFixed(2)})`;
  return (
    <Card className="card-gradient glass-effect rounded-xl border border-neutral-800">
      <CardHeader><CardTitle>AI Insights</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {msg.split('\n').map((line: string, i: number) => (
            <div key={i} className="flex gap-2">
              <span className="text-emerald-300">•</span>
              <span className="whitespace-pre-line">{line}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
