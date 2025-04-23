import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Leaf, Camera, ChevronRight, CheckCircle, Zap, LineChart, Shield } from "lucide-react";
import { Footer } from "@/components/layout/footer";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-neutral-800">NutriScan</span>
            </div>
            
            <nav className="hidden md:flex space-x-8 items-center">
              <Link href="/" className="text-neutral-700 hover:text-primary-600 font-medium">
                Home
              </Link>
              <Link href="/try-it" className="text-neutral-700 hover:text-primary-600 font-medium">
                Try It Free
              </Link>
              <Link href="/pricing" className="text-neutral-700 hover:text-primary-600 font-medium">
                Pricing
              </Link>
            </nav>
            
            <div className="flex items-center">
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mb-4 leading-tight">
                Analyze Your Food With <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">AI Technology</span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-600 mb-8 max-w-lg">
                Take a photo of your meal and instantly get detailed nutrition information. Track calories, protein, carbs, and more with NutriScan.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/try-it">
                  <Button size="lg" className="bg-primary-600 hover:bg-primary-700 px-8">
                    Try It Free
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="border-primary-600 text-primary-600 hover:bg-primary-50">
                    Sign Up <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-lg">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary-200 rounded-full blur-xl opacity-70"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-200 rounded-full blur-xl opacity-70"></div>
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-1 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80"
                    alt="Healthy food plate" 
                    className="w-full h-auto rounded-xl"
                  />
                  <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-3">
                    <div className="text-sm font-semibold text-neutral-900">Calories</div>
                    <div className="text-2xl font-bold text-primary-600">425</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">How NutriScan Works</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Our AI-powered platform makes nutrition tracking simple, fast, and accurate
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-neutral-50 p-6 rounded-xl">
              <div className="bg-primary-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Camera className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Snap a Photo</h3>
              <p className="text-neutral-600">
                Simply take a picture of your meal using our app's camera or upload an existing image.
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <div className="bg-primary-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">AI Analysis</h3>
              <p className="text-neutral-600">
                Our advanced AI identifies the food items and calculates nutrition data instantly.
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <div className="bg-primary-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <LineChart className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Track Progress</h3>
              <p className="text-neutral-600">
                View detailed reports, monitor your nutritional intake and track improvement over time.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing CTA */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-600 rounded-2xl p-8 md:p-12 overflow-hidden relative">
            <div className="absolute right-0 top-0 w-40 h-40 bg-primary-500 rounded-full blur-3xl opacity-70 -mr-20 -mt-20"></div>
            <div className="absolute left-0 bottom-0 w-40 h-40 bg-primary-500 rounded-full blur-2xl opacity-60 -ml-20 -mb-20"></div>
            <div className="relative">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Nutrition Tracking?</h2>
                <p className="text-primary-100 text-lg mb-8">
                  Choose a plan that works for you and start your nutrition journey today.
                </p>
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link href="/pricing">
                    <Button size="lg" className="bg-white text-primary-600 hover:bg-neutral-100 px-8">
                      View Pricing
                    </Button>
                  </Link>
                  <Link href="/try-it">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-primary-500 px-8">
                      Try Free Demo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">What Our Users Say</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Trusted by thousands of users worldwide to track their nutrition
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-neutral-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <div className="bg-neutral-200 w-12 h-12 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">Sarah M.</h4>
                  <p className="text-neutral-500 text-sm">Fitness Coach</p>
                </div>
              </div>
              <p className="text-neutral-600">
                "NutriScan has completely changed how I track my clients' nutrition. The AI analysis is incredibly accurate and saves hours of manual logging."
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <div className="bg-neutral-200 w-12 h-12 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">James K.</h4>
                  <p className="text-neutral-500 text-sm">Marathon Runner</p>
                </div>
              </div>
              <p className="text-neutral-600">
                "Being able to quickly snap a photo and get nutrition data has helped me optimize my training diet. The protein tracking feature is invaluable."
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <div className="bg-neutral-200 w-12 h-12 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">Emily R.</h4>
                  <p className="text-neutral-500 text-sm">Nutrition Student</p>
                </div>
              </div>
              <p className="text-neutral-600">
                "As someone studying nutrition, I'm impressed by the accuracy of the AI analysis. It's extremely helpful for both my studies and personal meal planning."
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Feature List */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">Why Choose NutriScan?</h2>
              <p className="text-lg text-neutral-600 mb-8">
                Our platform offers advanced features for both casual users and nutrition professionals
              </p>
              
              <div className="space-y-4">
                <div className="flex">
                  <CheckCircle className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-neutral-900">Advanced AI Recognition</h4>
                    <p className="text-neutral-600">Accurately identifies food items from images</p>
                  </div>
                </div>
                
                <div className="flex">
                  <CheckCircle className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-neutral-900">Comprehensive Nutrition Data</h4>
                    <p className="text-neutral-600">Get calories, macros, vitamins, and minerals</p>
                  </div>
                </div>
                
                <div className="flex">
                  <CheckCircle className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-neutral-900">Personalized Insights</h4>
                    <p className="text-neutral-600">Receive custom recommendations based on your eating habits</p>
                  </div>
                </div>
                
                <div className="flex">
                  <CheckCircle className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-neutral-900">Secure Data Privacy</h4>
                    <p className="text-neutral-600">Your nutrition data is encrypted and protected</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 md:pl-12">
              <div className="bg-white p-1 rounded-xl shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1553557202-65c1c250ce8a?w=800&auto=format&fit=crop&q=80"
                  alt="Nutrition tracking app" 
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Start Your Nutrition Journey Today</h2>
          <p className="text-lg text-neutral-600 mb-8">
            Join thousands of users who have transformed their relationship with food using NutriScan
          </p>
          <Link href="/auth">
            <Button size="lg" className="bg-primary-600 hover:bg-primary-700 px-8">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}