interface NutritionChartProps {
  value: number;
  maxValue: number;
  color: string;
}

export function NutritionChart({ value, maxValue, color }: NutritionChartProps) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  return (
    <div className="nutrition-chart">
      <div 
        className={`nutrition-fill ${color}`} 
        style={{ width: `${percentage}%` }} 
      />
    </div>
  );
}
