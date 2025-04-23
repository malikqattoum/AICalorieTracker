import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CameraUploadCard } from "@/components/dashboard/camera-upload-card";
import { RecentResultsCard } from "@/components/dashboard/recent-results-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { NutritionTipsCard } from "@/components/dashboard/nutrition-tips-card";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
            <p className="text-neutral-600">
              Welcome back, {user.firstName}. Track your nutrition with AI-powered analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area (2/3 on desktop) */}
            <div className="lg:col-span-2 space-y-6">
              <CameraUploadCard />
              <RecentResultsCard />
            </div>

            {/* Sidebar (1/3 on desktop) */}
            <div className="space-y-6">
              <StatsCard />
              <NutritionTipsCard />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
