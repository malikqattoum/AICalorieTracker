import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CameraUploadCard } from "@/components/dashboard/camera-upload-card";
import { RecentResultsCard } from "@/components/dashboard/recent-results-card";
import { OverviewCard } from "@/components/dashboard/overview-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AnalyticsCard } from "@/components/dashboard/analytics-card";
import { AiInsightsCard } from "@/components/dashboard/ai-insights-card";
import { AchievementsCard } from "@/components/dashboard/achievements-card";
import { MealPlanCard } from "@/components/dashboard/meal-plan-card";
import { NutritionTipsCard } from "@/components/dashboard/nutrition-tips-card";
import { SmartMealSuggestionsCard } from "@/components/dashboard/smart-meal-suggestions-card";
import { MealTrendsCard } from "@/components/dashboard/meal-trends-card";
import { NutritionCoachChatbot } from "@/components/dashboard/nutrition-coach-chatbot";
import ReferralCommissionsCard from "@/components/dashboard/referral-commissions-card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { WeeklyStats } from "@shared/schema";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

export default function HomePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Medical Diet AI Assistant state
  const [medicalCondition, setMedicalCondition] = useState<string>("none");
  // AI Meal Plan state (moved from StatsCard)
  const [goal, setGoal] = useState<string>("");

  // Replace direct fetch with React Query mutation
  const mealPlanMutation = useMutation({
    mutationFn: async ({ goal, medicalCondition }: { goal: string; medicalCondition: string }) => {
      const res = await apiRequest("POST", "/api/meal-plan", { goal, medicalCondition });
      return res.json();
    },
    onSuccess: (data) => {
      // Update meal plan data in query cache
      queryClient.setQueryData(["meal-plan", goal, medicalCondition], data);
    },
    onError: (error: any) => {
      console.error("Meal plan generation failed:", error);
    },
  });

  // Get meal plan data from React Query cache
  const { data: mealPlan } = useQuery({
    queryKey: ["meal-plan", goal, medicalCondition],
    queryFn: () => null, // This will be populated by the mutation
    enabled: false, // Don't fetch automatically, only when mutation succeeds
  });
  // Updated stats query to include medicalCondition in the queryKey
  const { data: stats } = useQuery<WeeklyStats>({
    queryKey: [`/api/weekly-stats?medicalCondition=${medicalCondition}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
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
  useEffect(() => {
    // Trigger meal plan generation when goal or medical condition changes
    if (goal && medicalCondition) {
      mealPlanMutation.mutate({ goal, medicalCondition });
    }
    // eslint-disable-next-line
  }, [goal, medicalCondition]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Dashboard
            </h1>
            <p className="text-neutral-500">
              Welcome back, {user.firstName}. Track your nutrition with
              AI-powered analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area (2/3 on desktop) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <CameraUploadCard />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OverviewCard stats={stats} daysOfWeek={daysOfWeek} />
                <AnalyticsCard
                  stats={stats}
                  daysOfWeek={daysOfWeek}
                  selectedCondition={medicalCondition}
                  onConditionChange={setMedicalCondition}
                />
                <AchievementsCard stats={stats} daysOfWeek={daysOfWeek} />
                <AiInsightsCard stats={stats} daysOfWeek={daysOfWeek} />
                <MealPlanCard
                  mealPlan={mealPlan}
                  isMealPlanLoading={mealPlanMutation.isPending}
                  mealPlanError={mealPlanMutation.error?.message || null}
                  fetchMealPlan={() => mealPlanMutation.mutate({ goal, medicalCondition })}
                  goal={goal}
                  daysOfWeek={daysOfWeek}
                  medicalCondition={medicalCondition}
                />
                <NutritionCoachChatbot userId={user?.id} />
              </div>
              <RecentResultsCard />
            </div>
            {/* Sidebar (1/3 on desktop) */}
            <div className="flex flex-col gap-6">
              <NutritionTipsCard />
              <MealTrendsCard />
              <SmartMealSuggestionsCard />
              <ReferralCommissionsCard />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
