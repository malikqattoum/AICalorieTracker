import { useState } from 'react';
import { PremiumAnalyticsDashboard } from '../components/premium/PremiumAnalyticsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { WeeklyStats } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { BarChart2, PieChart } from "lucide-react";
import {
  Star,
  Crown,
  Zap,
  Shield,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function PremiumAnalyticsPage() {
   const [showPremiumFeatures, setShowPremiumFeatures] = useState(false);

   // Fetch user's weekly stats for analytics
   const { data: stats } = useQuery<WeeklyStats>({
     queryKey: ["/api/user/stats"],
     queryFn: getQueryFn({ on401: "returnNull" })
   });

   const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
   const selectedCondition = "none"; // Default to none for premium analytics

  const premiumFeatures = [
    {
      icon: TrendingUp,
      title: 'AI-Powered Insights',
      description: 'Advanced machine learning algorithms provide personalized health predictions and recommendations',
      benefits: ['Weight projections', 'Goal achievement forecasts', 'Health risk assessment']
    },
    {
      icon: Zap,
      title: 'Real-time Monitoring',
      description: 'Live health tracking with instant alerts and continuous data synchronization',
      benefits: ['24/7 health monitoring', 'Customizable alerts', 'Multi-device sync']
    },
    {
      icon: Shield,
      title: 'Healthcare Integration',
      description: 'Secure data sharing with healthcare providers and professional-grade reports',
      benefits: ['HIPAA compliant', 'Professional reports', 'Provider collaboration']
    },
    {
      icon: Users,
      title: 'Expert Analysis',
      description: 'Access to nutritionists and fitness coaches for personalized guidance',
      benefits: ['Expert consultations', 'Personalized plans', 'Progress tracking']
    }
  ];

  const pricingPlans = [
    {
      name: 'Basic',
      price: '$9.99',
      period: 'month',
      features: ['Basic analytics', 'Weekly reports', 'Email support'],
      popular: false
    },
    {
      name: 'Premium',
      price: '$19.99',
      period: 'month',
      features: ['All Basic features', 'AI insights', 'Real-time monitoring', 'Healthcare integration', 'Priority support'],
      popular: true
    },
    {
      name: 'Professional',
      price: '$39.99',
      period: 'month',
      features: ['All Premium features', 'Expert consultations', 'Custom reports', 'API access', 'Dedicated support'],
      popular: false
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <main className="flex-grow">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
                <Crown className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Premium Analytics
              <span className="block text-blue-600">Unlock Your Health Potential</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your health journey with AI-powered insights, real-time monitoring, 
              and professional-grade analytics. Get the personalized guidance you need to achieve 
              your wellness goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                onClick={() => setShowPremiumFeatures(true)}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 py-3 text-lg"
                onClick={() => setShowPremiumFeatures(true)}
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Premium Analytics?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of health tracking with our comprehensive premium features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {premiumFeatures.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <feature.icon className="h-12 w-12 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="text-left space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Demo Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See It in Action
            </h2>
            <p className="text-xl text-gray-600">
              Experience the power of premium analytics with our interactive demo
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-8">
            {showPremiumFeatures ? (
              <PremiumAnalyticsDashboard />
            ) : (
              <div className="text-center py-12">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Star className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Ready to Transform Your Health Journey?
                  </h3>
                  <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                    Get started with our premium analytics dashboard and unlock powerful insights 
                    to help you achieve your health goals faster than ever before.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                      onClick={() => setShowPremiumFeatures(true)}
                    >
                      View Live Demo
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="px-8 py-3"
                      onClick={() => setShowPremiumFeatures(true)}
                    >
                      Explore Features
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Analytics Charts */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Advanced Analytics Dashboard
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive charts and insights from your meal tracking data
            </p>
          </div>

          <div className="space-y-8">
            {/* Calorie Trend */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5 text-primary-500" />
                <h3 className="font-medium text-neutral-900">Calorie Trend</h3>
              </div>
              <div className="h-48 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg flex items-end justify-between p-4 shadow-inner">
                {daysOfWeek.map((day) => {
                  const calories = (stats.caloriesByDay as Record<string, number>)[day] || 0;
                  const maxCalories = Math.max(...Object.values(stats.caloriesByDay as Record<string, number>));
                  const percentage = maxCalories > 0 ? (calories / maxCalories) * 100 : 0;
                  const today = new Date().getDay();
                  const dayIndex = daysOfWeek.indexOf(day);
                  const isPastOrToday = dayIndex <= today;
                  const barClass = isPastOrToday ? "bg-primary-400 w-full rounded-t-sm" : "bg-primary-900 w-full rounded-t-sm";
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
            </Card>

            {/* Weekly Nutrition Breakdown */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5 text-primary-200" />
                <h3 className="font-medium text-primary-100">Weekly Nutrition Breakdown</h3>
              </div>
              <div className="h-64 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg p-4 shadow-inner">
                <ChartContainer config={{ calories: { label: "Calories", color: "#4CAF50" } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={daysOfWeek.map((day) => {
                        const macros = stats.macrosByDay?.[day] || { protein: 0, carbs: 0, fat: 0 };
                        const calories = (stats.caloriesByDay as Record<string, number>)[day] || 0;
                        return {
                          day: day.substring(0, 3),
                          calories,
                        };
                      })}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <XAxis dataKey="day" stroke="#b5e3b6" />
                      <YAxis stroke="#b5e3b6" />
                      <Tooltip contentStyle={{ background: '#23272b', border: '1px solid #333', color: '#fff' }} />
                      <Legend />
                      <Line key="calories" type="monotone" dataKey="calories" stroke="#4CAF50" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </Card>

            {/* Macro Distribution */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-amber-200" />
                <h3 className="font-medium text-amber-500">Macro Distribution</h3>
              </div>
              <div className="h-56 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg p-4 flex items-center justify-center shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={daysOfWeek.map(day => {
                      const macros = stats.macrosByDay?.[day] || { protein: 0, carbs: 0, fat: 0 };
                      return {
                        name: day.substring(0, 3),
                        Protein: macros.protein,
                        Carbs: macros.carbs,
                        Fat: macros.fat,
                      };
                    })}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip contentStyle={{ background: '#23272b', border: '1px solid #333', color: '#fff' }} />
                    <Legend />
                    <Line key="protein" type="monotone" dataKey="Protein" stroke="#a78bfa" strokeWidth={2} dot />
                    <Line key="carbs" type="monotone" dataKey="Carbs" stroke="#2dd4bf" strokeWidth={2} dot />
                    <Line key="fat" type="monotone" dataKey="Fat" stroke="#fbbf24" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Add a summary below the chart */}
              <div className="mt-4 text-sm text-neutral-600 text-center">
                {(() => {
                  let totalProtein = 0, totalCarbs = 0, totalFat = 0;
                  for (const day of daysOfWeek) {
                    const macros = stats.macrosByDay?.[day] || { protein: 0, carbs: 0, fat: 0 };
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
            </Card>

            {/* AI Insights Section */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">AI-Powered Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Nutrition Optimization</h4>
                  <p className="text-sm text-blue-700">
                    Your protein intake shows good consistency. Consider increasing healthy fats for better satiety.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Calorie Management</h4>
                  <p className="text-sm text-green-700">
                    You're maintaining excellent calorie control. Your weekly average is within optimal range.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Progress Prediction</h4>
                  <p className="text-sm text-purple-700">
                    Based on current trends, you're on track to achieve your goals within the next 4 weeks.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Select the perfect plan for your health journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                    size="lg"
                  >
                    {plan.popular ? 'Get Started' : 'Choose Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Not sure which plan is right for you?
            </p>
            <Button variant="outline" size="lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied users who have transformed their health
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Fitness Enthusiast',
                content: 'The AI insights have completely changed how I approach my health. My weight loss goals are finally within reach!',
                rating: 5
              },
              {
                name: 'Michael Chen',
                role: 'Health Professional',
                content: 'As a doctor, I appreciate the accuracy and depth of the analytics. It helps me provide better care for my patients.',
                rating: 5
              },
              {
                name: 'Emily Rodriguez',
                role: 'Wellness Coach',
                content: 'The real-time monitoring and professional reports have elevated my coaching practice to a whole new level.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Health Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who have achieved their health goals with Premium Analytics
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
              onClick={() => setShowPremiumFeatures(true)}
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg"
            >
              Learn More
            </Button>
          </div>
          <p className="text-blue-100 mt-4 text-sm">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
        </main>
        <Footer />
      </div>
  );
}