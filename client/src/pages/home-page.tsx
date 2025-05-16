import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CameraUploadCard } from "@/components/dashboard/camera-upload-card";
import { RecentResultsCard } from "@/components/dashboard/recent-results-card";
import { OverviewCard } from "@/components/dashboard/overview-card";
import { AnalyticsCard } from "@/components/dashboard/analytics-card";
import { AiInsightsCard } from "@/components/dashboard/ai-insights-card";
import { AchievementsCard } from "@/components/dashboard/achievements-card";
import { MealPlanCard } from "@/components/dashboard/meal-plan-card";
import { NutritionTipsCard } from "@/components/dashboard/nutrition-tips-card";
import { SmartMealSuggestionsCard } from "@/components/dashboard/smart-meal-suggestions-card";
import { MealTrendsCard } from "@/components/dashboard/meal-trends-card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { WeeklyStats } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  const { data: stats } = useQuery<WeeklyStats>({
    queryKey: ["/api/weekly-stats"],
  });
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  // AI Meal Plan state (moved from StatsCard)
  const [mealPlan, setMealPlan] = useState<any | null>(null);
  const [isMealPlanLoading, setIsMealPlanLoading] = useState(false);
  const [mealPlanError, setMealPlanError] = useState<string | null>(null);
  const goal = "weight-loss"; // TODO: fetch from user profile/goals if available
  const fetchMealPlan = async () => {
    setIsMealPlanLoading(true);
    setMealPlanError(null);
    try {
      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      if (!res.ok) throw new Error("Failed to generate meal plan");
      const data = await res.json();
      setMealPlan(data);
    } catch (e: any) {
      setMealPlanError(e.message || "Unknown error");
    } finally {
      setIsMealPlanLoading(false);
    }
  };
  useEffect(() => {
    fetchMealPlan();
    // eslint-disable-next-line
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
            <p className="text-neutral-500">
              Welcome back, {user.firstName}. Track your nutrition with AI-powered analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area (2/3 on desktop) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <CameraUploadCard />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OverviewCard stats={stats} daysOfWeek={daysOfWeek} />
                <AnalyticsCard stats={stats} daysOfWeek={daysOfWeek} />
                <AchievementsCard stats={stats} daysOfWeek={daysOfWeek} />
                <AiInsightsCard stats={stats} daysOfWeek={daysOfWeek} />
                <MealPlanCard
                  mealPlan={mealPlan}
                  isMealPlanLoading={isMealPlanLoading}
                  mealPlanError={mealPlanError}
                  fetchMealPlan={fetchMealPlan}
                  goal={goal}
                  daysOfWeek={daysOfWeek}
                />
              </div>
              <RecentResultsCard />
            </div>
            {/* Sidebar (1/3 on desktop) */}
            <div className="flex flex-col gap-6">
              <NutritionTipsCard />
              <MealTrendsCard />
              <SmartMealSuggestionsCard />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
