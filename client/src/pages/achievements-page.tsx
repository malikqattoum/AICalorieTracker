import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Share2, Calendar, Target, TrendingUp, Users, Star, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { WeeklyStats } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedDate?: string;
  category: string;
}

interface AchievementHistory {
  id: number;
  achievementId: number;
  unlockedDate: string;
  shared: boolean;
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch user's weekly stats for achievements calculation
  const { data: stats } = useQuery<WeeklyStats>({
    queryKey: ["/api/user/stats"],
    queryFn: getQueryFn({ on401: "returnNull" })
  });

  // Mock achievements data - in real app this would come from API
  const achievements: Achievement[] = [
    {
      id: 1,
      title: "First Steps",
      description: "Log your first meal",
      icon: "🥗",
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      unlockedDate: "2024-01-15",
      category: "getting-started"
    },
    {
      id: 2,
      title: "Week Warrior",
      description: "Complete 7 days of meal tracking",
      icon: "📅",
      progress: 7,
      maxProgress: 7,
      unlocked: true,
      unlockedDate: "2024-01-22",
      category: "consistency"
    },
    {
      id: 3,
      title: "Calorie Master",
      description: "Maintain calorie goals for 30 days",
      icon: "🎯",
      progress: 25,
      maxProgress: 30,
      unlocked: false,
      category: "goals"
    },
    {
      id: 4,
      title: "Protein Champion",
      description: "Average 150g protein per day for a week",
      icon: "💪",
      progress: 120,
      maxProgress: 150,
      unlocked: false,
      category: "nutrition"
    },
    {
      id: 5,
      title: "Social Butterfly",
      description: "Share 10 achievements with friends",
      icon: "🦋",
      progress: 3,
      maxProgress: 10,
      unlocked: false,
      category: "social"
    }
  ];

  const categories = [
    { id: "all", label: "All", icon: Trophy },
    { id: "getting-started", label: "Getting Started", icon: Star },
    { id: "consistency", label: "Consistency", icon: Calendar },
    { id: "goals", label: "Goals", icon: Target },
    { id: "nutrition", label: "Nutrition", icon: Award },
    { id: "social", label: "Social", icon: Users }
  ];

  const filteredAchievements = selectedCategory === "all"
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalProgress = achievements.reduce((sum, a) => sum + (a.progress / a.maxProgress), 0);
  const averageProgress = Math.round((totalProgress / achievements.length) * 100);

  const handleShare = (achievement: Achievement) => {
    if (navigator.share) {
      navigator.share({
        title: `Achievement Unlocked: ${achievement.title}`,
        text: `I just unlocked "${achievement.title}" in AI Calorie Tracker! ${achievement.description}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `I just unlocked "${achievement.title}" in AI Calorie Tracker! ${achievement.description} ${window.location.href}`
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Achievements</h1>
        <p className="text-muted-foreground">
          Track your progress and unlock rewards as you work towards your health goals.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements Unlocked</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unlockedCount}/{achievements.length}</div>
            <Progress value={(unlockedCount / achievements.length) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProgress}%</div>
            <Progress value={averageProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? (() => {
                const caloriesByDay = (stats.caloriesByDay ?? {}) as Record<string, number>;
                const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                let streak = 0;
                for (let i = daysOfWeek.length - 1; i >= 0; i--) {
                  const cals = caloriesByDay?.[daysOfWeek[i]] ?? 0;
                  if (cals >= 1500 && cals <= 2200) streak++;
                  else break;
                }
                return streak;
              })() : 0} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map(achievement => (
              <Card key={achievement.id} className={`relative ${achievement.unlocked ? 'border-green-200 bg-green-50' : ''}`}>
                {achievement.unlocked && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-green-500">Unlocked</Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{achievement.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <Progress value={(achievement.progress / achievement.maxProgress) * 100} />
                    </div>

                    {achievement.unlocked && achievement.unlockedDate && (
                      <p className="text-xs text-muted-foreground">
                        Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString()}
                      </p>
                    )}

                    {achievement.unlocked && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare(achievement)}
                        className="w-full"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Achievement
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Achievement History */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Achievement History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements
              .filter(a => a.unlocked)
              .sort((a, b) => new Date(b.unlockedDate!).getTime() - new Date(a.unlockedDate!).getTime())
              .map(achievement => (
                <div key={achievement.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-medium">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(achievement.unlockedDate!).toLocaleDateString()}
                    </p>
                    <Badge variant="secondary" className="mt-1">Unlocked</Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}