import { useState } from 'react';
import { PremiumAnalyticsDashboard } from '../components/premium/PremiumAnalyticsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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

export default function PremiumAnalyticsPage() {
  const [showPremiumFeatures, setShowPremiumFeatures] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg"
            >
              Learn More
            </Button>
          </div>
          <p className="text-blue-100 mt-4 text-sm">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}