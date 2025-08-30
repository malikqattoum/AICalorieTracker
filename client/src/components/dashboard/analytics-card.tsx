import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, PieChart } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { WeeklyStats } from "@shared/schema";
import { useState } from "react";

const MEDICAL_CONDITIONS = [
  { value: "none", label: "None" },
  { value: "diabetes", label: "Diabetes" },
  { value: "hypertension", label: "Hypertension" },
  { value: "kidney", label: "Kidney Disease" },
  { value: "celiac", label: "Celiac Disease" },
  // Add more as needed
];

export function AnalyticsCard({ stats, daysOfWeek, selectedCondition, onConditionChange }: {
  stats: WeeklyStats | undefined,
  daysOfWeek: string[],
  selectedCondition: string,
  onConditionChange: (condition: string) => void
}) {
  if (!stats) return null;
  const macrosByDay = stats.macrosByDay ?? {};
  // Macro breakdowns and analytics charts from StatsCard
  return (
    <Card className="card-gradient glass-effect rounded-xl border border-neutral-800">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle>Analytics</CardTitle>
        <div className="flex items-center gap-2">
          <label htmlFor="medical-condition-select" className="text-xs text-neutral-400">Medical Diet:</label>
          <select
            id="medical-condition-select"
            className="rounded px-2 py-1 text-xs bg-neutral-900 text-neutral-100 border border-neutral-700"
            value={selectedCondition}
            onChange={e => onConditionChange(e.target.value)}
          >
            {MEDICAL_CONDITIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {selectedCondition !== "none" && (
            <span className="ml-2 px-2 py-0.5 rounded bg-emerald-800 text-emerald-100 text-xs font-semibold">{MEDICAL_CONDITIONS.find(opt => opt.value === selectedCondition)?.label} Mode</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Calorie Trend */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-5 h-5 text-primary-500" />
            <h3 className="font-medium text-neutral-900">Calorie Trend</h3>
          </div>
          {/* Clinical Nutrition Notice */}
          {selectedCondition !== "none" && (
            <div className="mb-2 p-2 rounded bg-emerald-900/60 text-emerald-200 text-xs">
              {selectedCondition === "diabetes" && (
                <>Diabetes Mode: Carbohydrate intake and glycemic load are highlighted. Try to keep carbs consistent and avoid high-sugar spikes.</>
              )}
              {selectedCondition === "hypertension" && (
                <>Hypertension Mode: Sodium and potassium balance are prioritized. Watch for high-sodium foods and aim for more potassium-rich meals.</>
              )}
              {selectedCondition === "kidney" && (
                <>Kidney Disease Mode: Protein, sodium, and potassium are carefully balanced. Avoid excess protein and high-potassium foods.</>
              )}
              {selectedCondition === "celiac" && (
                <>Celiac Disease Mode: Gluten-containing foods are flagged. Ensure all meals are gluten-free.</>
              )}
            </div>
          )}
          <div className="h-48 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg flex items-end justify-between p-4 shadow-inner">
            {daysOfWeek.map((day) => {
              const calories = (stats.caloriesByDay as Record<string, number>)[day] || 0;
              const maxCalories = Math.max(...Object.values(stats.caloriesByDay as Record<string, number>));
              const percentage = maxCalories > 0 ? (calories / maxCalories) * 100 : 0;
              const today = new Date().getDay();
              const dayIndex = daysOfWeek.indexOf(day);
              const isPastOrToday = dayIndex <= today;
              // Clinical logic: highlight bar if out of range for condition
              let barClass = isPastOrToday ? "bg-primary-400 w-full rounded-t-sm" : "bg-primary-900 w-full rounded-t-sm";
              if (selectedCondition === "diabetes") {
                // Example: highlight if carbs > 60g for the day (placeholder)
                const carbs = macrosByDay[day]?.carbs || 0;
                if (carbs > 60) barClass += " ring-2 ring-amber-400";
              }
              if (selectedCondition === "hypertension") {
                // Example: highlight if sodium > 2000mg (if sodium data available)
                // Placeholder: no sodium in data, but could add logic here
              }
              if (selectedCondition === "kidney") {
                // Example: highlight if protein > 60g (placeholder)
                const protein = macrosByDay[day]?.protein || 0;
                if (protein > 60) barClass += " ring-2 ring-red-400";
              }
              if (selectedCondition === "celiac") {
                // Example: highlight if gluten detected (not in data, placeholder)
              }
              return (
                <div key={day} className="w-1/7 flex flex-col items-center">
                  <div
                    className={barClass}
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
                  data={daysOfWeek.map((day) => {
                    const macros = macrosByDay[day] || { protein: 0, carbs: 0, fat: 0 };
                    // --- Clinical Nutrition Logic for Chart Data ---
                    let calories = (stats.caloriesByDay as Record<string, number>)[day] || 0;
                    let carbs = macros.carbs;
                    let protein = macros.protein;
                    // Adjust calories for diabetes (flag high-carb days)
                    let clinicalFlag = false;
                    if (selectedCondition === "diabetes" && carbs > 60) clinicalFlag = true;
                    if (selectedCondition === "kidney" && protein > 60) clinicalFlag = true;
                    // You can add more logic for other conditions here
                    return {
                      day: day.substring(0, 3),
                      calories,
                      clinicalFlag,
                    };
                  })}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <XAxis dataKey="day" stroke="#b5e3b6" />
                  <YAxis stroke="#b5e3b6" />
                  <Tooltip contentStyle={{ background: '#23272b', border: '1px solid #333', color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="calories" stroke="#4CAF50" strokeWidth={2} dot={false} />
                  {/* Custom dot for clinical flag */}
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="transparent"
                    dot={(props: any) => {
                      // Type guard for recharts dot props
                      if (!props || typeof props.cx !== 'number' || typeof props.cy !== 'number' || !props.payload) return <></>;
                      const { cx, cy, payload } = props;
                      return payload.clinicalFlag ? (
                        <circle
                          key={props.payload.day}
                          cx={cx}
                          cy={cy}
                          r={7}
                          fill="#fbbf24"
                          stroke="#b45309"
                          strokeWidth={2}
                          style={{ filter: 'drop-shadow(0 0 4px #fbbf24)' }}
                        >
                          <title>Clinical Alert: This day exceeds recommended limits for your selected condition.</title>
                        </circle>
                      ) : <></>;
                    }}
                  />
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
                  // --- Clinical Nutrition Logic for Macro Chart ---
                  let clinicalMacroFlag = false;
                  if (selectedCondition === "diabetes" && macros.carbs > 60) clinicalMacroFlag = true;
                  if (selectedCondition === "kidney" && macros.protein > 60) clinicalMacroFlag = true;
                  // Add more logic as needed
                  return {
                    name: day.substring(0, 3),
                    Protein: macros.protein,
                    Carbs: macros.carbs,
                    Fat: macros.fat,
                    clinicalMacroFlag,
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
                {/* Custom dot for clinical macro flag */}
                <Line
                  type="monotone"
                  dataKey="Protein"
                  stroke="transparent"
                  dot={(props: any) => {
                    // Type guard for recharts dot props
                    if (!props || typeof props.cx !== 'number' || typeof props.cy !== 'number' || !props.payload) return <></>;
                    const { cx, cy, payload } = props;
                    return payload.clinicalMacroFlag ? (
                      <circle
                        key={props.payload.name}
                        cx={cx}
                        cy={cy}
                        r={7}
                        fill="#fbbf24"
                        stroke="#b45309"
                        strokeWidth={2}
                        style={{ filter: 'drop-shadow(0 0 4px #fbbf24)' }}
                      >
                        <title>Clinical Alert: This day exceeds recommended macro limits for your selected condition.</title>
                      </circle>
                    ) : <></>;
                  }}
                />
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
