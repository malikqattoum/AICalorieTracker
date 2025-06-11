import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Leaf, Camera, ChevronRight, CheckCircle, Zap, LineChart, Shield, ArrowRight, Star, Heart, Sparkles, Twitter, Facebook, Instagram, Github } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const { user } = useAuth();
  // Dynamic content state
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/content/home")
      .then(r => r.json())
      .then(data => {
        try {
          setContent(JSON.parse(data.value));
        } catch {
          setContent(null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fallbacks for each section
  const hero = content?.hero || {
    title: "Analyze Your Food With AI Technology",
    subtitle: "Take a photo of your meal and instantly get detailed nutrition information. Track calories, protein, carbs, and more with NutriScan.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
    calories: 425
  };
  const features = content?.features || [
    {
      icon: "Camera",
      title: "Snap a Photo",
      desc: "Simply take a picture of your meal using our app's camera or upload an existing image."
    },
    {
      icon: "Zap",
      title: "AI Analysis",
      desc: "Our advanced AI identifies the food items and calculates nutrition data instantly."
    },
    {
      icon: "LineChart",
      title: "Track Progress",
      desc: "View detailed reports, monitor your nutritional intake and track improvement over time."
    }
  ];
  const pricingCta = content?.pricingCta || {
    title: "Ready to Transform Your Nutrition Tracking?",
    subtitle: "Choose a plan that works for you and start your nutrition journey today."
  };
  const testimonials = content?.testimonials || [
    {
      name: "Sarah M.",
      role: "Fitness Coach",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      quote: "NutriScan has completely changed how I track my clients' nutrition. The AI analysis is incredibly accurate and saves hours of manual logging."
    },
    {
      name: "James K.",
      role: "Marathon Runner",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      quote: "Being able to quickly snap a photo and get nutrition data has helped me optimize my training diet. The protein tracking feature is invaluable."
    },
    {
      name: "Emily R.",
      role: "Nutrition Student",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
      quote: "As someone studying nutrition, I'm impressed by the accuracy of the AI analysis. It's extremely helpful for both my studies and personal meal planning."
    }
  ];
  const featureList = content?.featureList || [
    {
      icon: "CheckCircle",
      title: "Advanced AI Recognition",
      desc: "Accurately identifies food items from images"
    },
    {
      icon: "LineChart",
      title: "Meal History & Trends",
      desc: "View your meal analysis history and visualize nutrition trends over time."
    },
    {
      icon: "Zap",
      title: "Smart Meal Suggestions",
      desc: "Get AI-powered suggestions for healthier meals and recipes based on your goals."
    },
    {
      icon: "Camera",
      title: "Multi-Food Recognition",
      desc: "Analyze multiple foods in a single image for comprehensive nutrition info."
    },
    {
      icon: "Shield",
      title: "Personalized Nutrition Goals",
      desc: "Set calorie and macro goals, and track your progress automatically."
    },
    {
      icon: "CheckCircle",
      title: "Allergen & Diet Warnings",
      desc: "Get instant warnings for allergens or foods outside your dietary preferences."
    }
  ];
  const featureListDesc = content?.featureListDesc || {
    title: "Why Choose NutriScan?",
    subtitle: "Our platform offers advanced features for both casual users and nutrition professionals"
  };
  const featureListImage = content?.featureListImage || "https://images.unsplash.com/photo-1530021232320-687d8e3dba54?w=800&h=600&fit=crop";
  const finalCta = content?.finalCta || {
    title: "Start Your Nutrition Journey Today",
    subtitle: "Join thousands of users who have transformed their relationship with food using NutriScan"
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="bg-primary-500/10 p-2 rounded-xl">
                <Leaf className="h-7 w-7 text-primary-600" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-500">NutriScan</span>
            </div>

            <nav className="hidden md:flex space-x-8 items-center">
              <Link href="/" className="text-slate-700 hover:text-primary-600 font-medium transition-colors">
                Home
              </Link>
              <Link href="/try-it" className="text-slate-700 hover:text-primary-600 font-medium transition-colors">
                Try It Free
              </Link>
              <Link href="/pricing" className="text-slate-700 hover:text-primary-600 font-medium transition-colors">
                Pricing
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm" className="bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg transition-all duration-300">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth" className="hidden sm:block">
                    <Button variant="outline" size="sm" className="border-primary-200 text-primary-700 hover:bg-primary-50 transition-all duration-300">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button size="sm" className="bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-glow transition-all duration-300">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 md:py-28 overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-60">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
          <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow animation-delay-4000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered Nutrition Tracking
              </div>
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold mb-6 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-500">
                  {loading ? "Loading..." : hero.title}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
                {loading ? "" : hero.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/try-it">
                  <Button size="lg" className="bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 shadow-lg hover:shadow-glow transition-all duration-300 px-8 text-white">
                    Try It Free
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="border-primary-200 text-primary-700 hover:bg-primary-50 transition-all duration-300">
                    Sign Up <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="mt-8 flex items-center space-x-4">
                <div className="flex -space-x-2">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
                </div>
                <span className="text-sm text-slate-600">Joined by <span className="font-medium text-slate-900">2,000+</span> users</span>
              </div>
            </div>
            
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-lg">
                {/* Decorative blobs */}
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float animation-delay-2000"></div>
                
                {/* Main image card with glass effect */}
                <div className="glass-effect rounded-2xl shadow-xl overflow-hidden p-2 relative">
                  <img 
                    src={hero.image}
                    alt="Healthy food plate" 
                    className="w-full h-auto rounded-xl shadow-md"
                  />
                  
                  {/* Floating stats card */}
                  <div className="absolute top-4 right-4 glass-effect rounded-xl shadow-lg p-3 border border-white/40">
                    <div className="text-sm font-semibold text-slate-700">Calories</div>
                    <div className="text-2xl font-bold text-primary-600">{hero.calories}</div>
                  </div>
                  
                  {/* Floating nutrition card */}
                  <div className="absolute -bottom-3 -left-3 glass-effect rounded-xl shadow-lg p-3 border border-white/40">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-8 bg-primary-500 rounded-full"></div>
                      <div className="w-2 h-8 bg-secondary-500 rounded-full"></div>
                      <div className="w-2 h-8 bg-accent-500 rounded-full"></div>
                      <div className="ml-1">
                        <div className="text-xs font-semibold text-slate-700">Balanced Nutrition</div>
                        <div className="text-xs text-slate-500">Protein • Carbs • Fat</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/30 to-white opacity-50 z-0"></div>
        <div className="absolute right-0 top-1/4 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float"></div>
        <div className="absolute left-0 bottom-1/4 w-64 h-64 bg-secondary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float animation-delay-2000"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              Simple Process
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 section-title inline-block">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-500">
                How NutriScan Works
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Our AI-powered platform makes nutrition tracking simple, fast, and accurate
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f: any, i: number) => (
              <div 
                className="glass-effect p-8 rounded-2xl card-hover border border-white/40 relative" 
                key={i}
              >
                {/* Feature number */}
                <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {i+1}
                </div>
                
                {/* Icon */}
                <div className="bg-gradient-to-br from-primary-100 to-primary-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  {f.icon === "Camera" && <Camera className="h-8 w-8 text-primary-600" />}
                  {f.icon === "Zap" && <Zap className="h-8 w-8 text-primary-600" />}
                  {f.icon === "LineChart" && <LineChart className="h-8 w-8 text-primary-600" />}
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
                
                {/* Decorative element */}
                <div className="absolute bottom-4 right-4 w-12 h-1 rounded-full bg-gradient-to-r from-primary-300/40 to-secondary-300/40"></div>
              </div>
            ))}
          </div>
          
          {/* Additional feature highlight */}
          <div className="mt-16 bg-gradient-to-r from-primary-50 to-secondary-50 p-8 rounded-2xl shadow-lg border border-white/40">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to transform your nutrition tracking?</h3>
                <p className="text-slate-600">Join thousands of users who have improved their health with our AI-powered nutrition analysis.</p>
              </div>
              <div>
                <Link href="/try-it">
                  <Button size="lg" className="bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 shadow-lg hover:shadow-glow transition-all duration-300 px-8 text-white">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-3xl p-10 md:p-16 overflow-hidden relative shadow-xl">
            {/* Decorative elements */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-70 -mr-20 -mt-20 animate-pulse-slow"></div>
            <div className="absolute left-0 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-60 -ml-20 -mb-20 animate-pulse-slow animation-delay-2000"></div>
            <div className="absolute right-1/4 bottom-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl opacity-40 animate-pulse-slow animation-delay-4000"></div>
            
            {/* Decorative shapes */}
            <div className="absolute top-8 right-8 w-24 h-24 border-4 border-white/20 rounded-xl rotate-12 opacity-70"></div>
            <div className="absolute bottom-8 left-8 w-16 h-16 border-4 border-white/20 rounded-full opacity-70"></div>
            
            <div className="relative">
              <div className="text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6 backdrop-blur-sm">
                  <Star className="h-4 w-4 mr-2 text-yellow-300" />
                  Premium Features Available
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                  {loading ? "Loading..." : pricingCta.title}
                </h2>
                <p className="text-xl mb-10 text-white/90">
                  {loading ? "" : pricingCta.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <Link href="/pricing">
                    <Button size="lg" className="bg-white text-primary-700 hover:bg-slate-100 px-8 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold">
                      View Pricing Plans
                    </Button>
                  </Link>
                  <Link href="/try-it">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 backdrop-blur-sm transition-all duration-300">
                      Try Free Demo <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                {/* Trust badges */}
                <div className="mt-10 flex flex-wrap justify-center gap-6 items-center">
                  <div className="flex items-center text-white/80 text-sm">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-300" />
                    No credit card required
                  </div>
                  <div className="flex items-center text-white/80 text-sm">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-300" />
                    14-day free trial
                  </div>
                  <div className="flex items-center text-white/80 text-sm">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-300" />
                    Cancel anytime
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute left-0 top-1/4 w-72 h-72 bg-primary-100 rounded-full blur-3xl opacity-60 -ml-20"></div>
        <div className="absolute right-0 bottom-1/4 w-72 h-72 bg-secondary-100 rounded-full blur-3xl opacity-60 -mr-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent-100 text-accent-700 text-sm font-medium mb-6">
              <Heart className="h-4 w-4 mr-2 text-accent-500" />
              What Our Users Say
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-secondary-600 text-transparent bg-clip-text">
              Trusted by thousands of users worldwide
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              See what people are saying about their experience with NutriScan
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial: { quote: string; avatar?: string; name: string; role: string }, i: number) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-100">
                <div className="mb-6">
                  <div className="flex items-center mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="h-14 w-14 rounded-full overflow-hidden mr-4 ring-2 ring-primary-100">
                    <img 
                      src={testimonial.avatar || "/placeholder-avatar.png"} 
                      alt={`${testimonial.name} avatar`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Trust indicators */}
          <div className="mt-20 pt-10 border-t border-slate-200">
            <h3 className="text-center text-lg font-medium text-slate-700 mb-8">Trusted by health-conscious individuals worldwide</h3>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
              <div className="text-slate-400 font-semibold text-xl">FitnessMag</div>
              <div className="text-slate-400 font-semibold text-xl">HealthTech</div>
              <div className="text-slate-400 font-semibold text-xl">NutritionDaily</div>
              <div className="text-slate-400 font-semibold text-xl">WellnessHub</div>
              <div className="text-slate-400 font-semibold text-xl">FitLife</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature List */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">{featureListDesc.title}</h2>
              <p className="text-lg text-neutral-600 mb-8">{featureListDesc.subtitle}</p>

              <div className="space-y-4">
                {featureList.map((f: any, i: number) => (
                  <div className="flex" key={i}>
                    {f.icon === "CheckCircle" && <CheckCircle className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0" />}
                    {f.icon === "LineChart" && <LineChart className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0" />}
                    {f.icon === "Zap" && <Zap className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0" />}
                    {f.icon === "Camera" && <Camera className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0" />}
                    {f.icon === "Shield" && <Shield className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0" />}
                    <div>
                      <h4 className="font-semibold text-neutral-900">{f.title}</h4>
                      <p className="text-neutral-600">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:w-1/2 md:pl-12">
              <div className="bg-white p-1 rounded-xl shadow-lg">
                <img 
                  src={featureListImage}
                  alt="AI-powered nutrition analysis" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-100 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4 mr-2 text-primary-500" />
              Start Your Journey Today
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 text-transparent bg-clip-text">
              {loading ? "Loading..." : finalCta.title}
            </h2>
            
            <p className="text-xl mb-10 text-slate-600">
              {loading ? "" : finalCta.subtitle}
            </p>
            
            <div className="flex flex-col items-center">
              <Link href="/auth">
                <Button size="lg" className="px-10 py-7 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700">
                  Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <p className="mt-6 text-slate-500 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                No credit card required. Cancel anytime.
              </p>
            </div>
            
            {/* User stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">10k+</p>
                <p className="text-slate-500">Active Users</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">5M+</p>
                <p className="text-slate-500">Meals Tracked</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">98%</p>
                <p className="text-slate-500">Satisfaction</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">24/7</p>
                <p className="text-slate-500">Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-20 pb-10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-900/20 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-900/20 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text">AICalorieTracker</div>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">AI-powered nutrition tracking for a healthier you. Analyze your meals, track your progress, and achieve your health goals.</p>
              <div className="flex space-x-4">
                <a href="#" className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white hover:bg-primary-600 transition-colors duration-300">
                  <span className="sr-only">Twitter</span>
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white hover:bg-primary-600 transition-colors duration-300">
                  <span className="sr-only">Facebook</span>
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white hover:bg-primary-600 transition-colors duration-300">
                  <span className="sr-only">Instagram</span>
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white hover:bg-primary-600 transition-colors duration-300">
                  <span className="sr-only">GitHub</span>
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Product</h4>
              <ul className="space-y-4">
                <li><Link href="/features" className="text-slate-400 hover:text-white transition-colors duration-200">Features</Link></li>
                <li><Link href="/pricing" className="text-slate-400 hover:text-white transition-colors duration-200">Pricing</Link></li>
                <li><Link href="/try-it" className="text-slate-400 hover:text-white transition-colors duration-200">Try Demo</Link></li>
                <li><Link href="/integrations" className="text-slate-400 hover:text-white transition-colors duration-200">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Company</h4>
              <ul className="space-y-4">
                <li><Link href="/about" className="text-slate-400 hover:text-white transition-colors duration-200">About Us</Link></li>
                <li><Link href="/blog" className="text-slate-400 hover:text-white transition-colors duration-200">Blog</Link></li>
                <li><Link href="/careers" className="text-slate-400 hover:text-white transition-colors duration-200">Careers</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-white transition-colors duration-200">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Legal</h4>
              <ul className="space-y-4">
                <li><Link href="/privacy" className="text-slate-400 hover:text-white transition-colors duration-200">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-white transition-colors duration-200">Terms of Service</Link></li>
                <li><Link href="/cookies" className="text-slate-400 hover:text-white transition-colors duration-200">Cookie Policy</Link></li>
                <li><Link href="/gdpr" className="text-slate-400 hover:text-white transition-colors duration-200">GDPR</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm">© {new Date().getFullYear()} AICalorieTracker. All rights reserved.</p>
            
            <div className="mt-4 md:mt-0 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
              <Link href="/sitemap" className="hover:text-white transition-colors duration-200">Sitemap</Link>
              <span>·</span>
              <Link href="/accessibility" className="hover:text-white transition-colors duration-200">Accessibility</Link>
              <span>·</span>
              <Link href="/help" className="hover:text-white transition-colors duration-200">Help Center</Link>
            </div>
          </div>
          
          {/* Newsletter subscription - optional */}
          <div className="mt-16 pt-8 border-t border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h5 className="text-white font-semibold mb-2">Subscribe to our newsletter</h5>
                <p className="text-slate-400 text-sm">Get the latest updates and nutrition tips</p>
              </div>
              <div className="flex w-full md:w-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="px-4 py-2 bg-slate-800 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 w-full md:w-auto"
                />
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-r-md transition-colors duration-300">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}