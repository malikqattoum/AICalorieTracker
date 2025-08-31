import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Apple,
  Beef,
  Wheat,
  Droplets,
  CheckCircle,
  Clock,
  Star
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface NutritionTip {
  id: number;
  title: string;
  content: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  tags: string[];
  bookmarked?: boolean;
  completed?: boolean;
}

interface TipsResponse {
  tips: string[];
}

export default function NutritionEducationPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bookmarkedTips, setBookmarkedTips] = useState<Set<number>>(new Set([1, 3, 5]));
  const [completedTips, setCompletedTips] = useState<Set<number>>(new Set([1, 2]));

  // Fetch nutrition tips from API
  const { data, isLoading, error } = useQuery<TipsResponse>({
    queryKey: ["/api/nutrition-tips"],
    queryFn: getQueryFn({ on401: "returnNull" })
  });

  // Mock expanded nutrition education content
  const nutritionTips: NutritionTip[] = [
    {
      id: 1,
      title: "Understanding Macronutrients",
      content: "Macronutrients are the nutrients we need in large amounts: carbohydrates, proteins, and fats. Each plays a crucial role in our body's functions and energy production.",
      category: "basics",
      difficulty: "beginner",
      readTime: 5,
      tags: ["macronutrients", "basics", "nutrition"],
      bookmarked: true,
      completed: true
    },
    {
      id: 2,
      title: "Protein: The Building Block of Life",
      content: "Protein is essential for muscle repair, immune function, and hormone production. Learn how to calculate your daily protein needs and identify high-quality protein sources.",
      category: "protein",
      difficulty: "beginner",
      readTime: 8,
      tags: ["protein", "muscle", "health"],
      completed: true
    },
    {
      id: 3,
      title: "Carbohydrates: Energy for Performance",
      content: "Carbs are your body's primary energy source. Discover the difference between simple and complex carbohydrates and how to optimize your carb intake for sustained energy.",
      category: "carbs",
      difficulty: "intermediate",
      readTime: 10,
      tags: ["carbohydrates", "energy", "performance"],
      bookmarked: true
    },
    {
      id: 4,
      title: "Healthy Fats: Essential for Health",
      content: "Not all fats are created equal. Learn about omega-3s, omega-6s, and how to incorporate healthy fats into your diet while avoiding trans fats.",
      category: "fats",
      difficulty: "intermediate",
      readTime: 7,
      tags: ["fats", "omega-3", "health"],
    },
    {
      id: 5,
      title: "Micronutrients: Vitamins and Minerals",
      content: "While needed in smaller amounts, vitamins and minerals are crucial for optimal health. Understand the role of antioxidants, electrolytes, and essential minerals.",
      category: "micronutrients",
      difficulty: "advanced",
      readTime: 12,
      tags: ["vitamins", "minerals", "antioxidants"],
      bookmarked: true
    },
    {
      id: 6,
      title: "Hydration: More Than Just Water",
      content: "Proper hydration affects everything from cognitive function to physical performance. Learn about electrolyte balance and how to stay optimally hydrated.",
      category: "hydration",
      difficulty: "beginner",
      readTime: 6,
      tags: ["hydration", "electrolytes", "performance"]
    },
    {
      id: 7,
      title: "Meal Timing and Frequency",
      content: "When you eat can be as important as what you eat. Explore intermittent fasting, meal frequency, and timing strategies for optimal health.",
      category: "meal-timing",
      difficulty: "advanced",
      readTime: 15,
      tags: ["meal-timing", "intermittent-fasting", "metabolism"]
    },
    {
      id: 8,
      title: "Reading Nutrition Labels",
      content: "Navigate food labels like a pro. Learn to identify hidden sugars, understand serving sizes, and make informed decisions at the grocery store.",
      category: "label-reading",
      difficulty: "beginner",
      readTime: 9,
      tags: ["labels", "shopping", "education"]
    }
  ];

  const categories = [
    { id: "all", label: "All Topics", icon: BookOpen },
    { id: "basics", label: "Nutrition Basics", icon: Apple },
    { id: "protein", label: "Protein", icon: Beef },
    { id: "carbs", label: "Carbohydrates", icon: Wheat },
    { id: "fats", label: "Healthy Fats", icon: Droplets },
    { id: "micronutrients", label: "Vitamins & Minerals", icon: Star },
    { id: "hydration", label: "Hydration", icon: Droplets },
    { id: "meal-timing", label: "Meal Timing", icon: Clock },
    { id: "label-reading", label: "Label Reading", icon: Search }
  ];

  const filteredTips = useMemo(() => {
    return nutritionTips.filter(tip => {
      const matchesSearch = tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tip.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tip.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || tip.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const toggleBookmark = (tipId: number) => {
    setBookmarkedTips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tipId)) {
        newSet.delete(tipId);
      } else {
        newSet.add(tipId);
      }
      return newSet;
    });
  };

  const markAsCompleted = (tipId: number) => {
    setCompletedTips(prev => new Set([...Array.from(prev), tipId]));
  };

  const completedCount = completedTips.size;
  const totalTips = nutritionTips.length;
  const progressPercentage = Math.round((completedCount / totalTips) * 100);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Nutrition Education</h1>
        <p className="text-muted-foreground">
          Expand your knowledge with comprehensive nutrition guides, tips, and educational content.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}/{totalTips}</div>
            <Progress value={progressPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{progressPercentage}% Complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookmarked</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookmarkedTips.size}</div>
            <p className="text-xs text-muted-foreground mt-1">Saved for later</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">Articles read</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search nutrition topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2 text-xs">
                <category.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Tips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTips.map(tip => (
          <Card key={tip.id} className="relative hover:shadow-lg transition-shadow">
            {bookmarkedTips.has(tip.id) && (
              <div className="absolute -top-2 -right-2">
                <BookmarkCheck className="h-6 w-6 text-yellow-500 fill-current" />
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{tip.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getDifficultyColor(tip.difficulty)}>
                      {tip.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tip.readTime} min
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {tip.content}
              </p>

              <div className="flex flex-wrap gap-1 mb-4">
                {tip.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleBookmark(tip.id)}
                  className={bookmarkedTips.has(tip.id) ? "text-yellow-600" : ""}
                >
                  <Bookmark className="h-4 w-4 mr-1" />
                  {bookmarkedTips.has(tip.id) ? "Saved" : "Save"}
                </Button>

                {completedTips.has(tip.id) ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsCompleted(tip.id)}
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTips.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or browse all topics.
          </p>
        </div>
      )}

      {/* Quick Tips from API */}
      {data?.tips && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Daily Nutrition Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}