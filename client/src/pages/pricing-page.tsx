import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Leaf, Check, CreditCard } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PricingPage() {
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  
  // Dynamic content state for hero section
  const [pricingContent, setPricingContent] = useState<{ title: string; subtitle: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/content/pricing")
      .then(r => r.json())
      .then(data => {
        // Support both plain string and JSON object for backward compatibility
        try {
          const parsed = JSON.parse(data.value);
          setPricingContent(parsed);
        } catch {
          setPricingContent({ title: data.value || "Simple, Transparent Pricing", subtitle: "Choose the plan that fits your nutrition tracking needs. All plans include our core AI-powered food analysis technology." });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Pricing tiers
  const tiers = [
    {
      name: "Basic",
      id: "basic",
      href: user ? "/subscribe?plan=basic" : "/auth",
      price: {
        monthly: "$9.99",
        yearly: "$99.99",
        discount: "Save 15%"
      },
      description: "Perfect for individuals getting started with nutrition tracking",
      features: [
        "25 AI food analyses per month",
        "Basic nutrition tracking",
        "Weekly reports",
        "Email support"
      ],
      featured: false
    },
    {
      name: "Premium",
      id: "premium",
      href: user ? "/subscribe?plan=premium" : "/auth",
      price: {
        monthly: "$19.99",
        yearly: "$199.99",
        discount: "Save 15%"
      },
      description: "Enhanced features for more detailed nutrition tracking",
      features: [
        "100 AI food analyses per month",
        "Advanced nutrition reporting",
        "Personalized meal suggestions",
        "Weekly & monthly trends",
        "Priority email support"
      ],
      featured: true
    },
    {
      name: "Professional",
      id: "professional",
      href: user ? "/subscribe?plan=professional" : "/auth",
      price: {
        monthly: "$39.99",
        yearly: "$399.99",
        discount: "Save 15%"
      },
      description: "For nutritionists and fitness professionals",
      features: [
        "Unlimited AI food analyses",
        "Client management tools",
        "Advanced analytics dashboard",
        "Custom reporting",
        "API access",
        "Dedicated support"
      ],
      featured: false
    }
  ];

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
              <Link href="/pricing" className="text-primary-600 font-medium">
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
      
      <main className="flex-grow">
        {/* Pricing Hero */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              {loading ? "Loading..." : (pricingContent?.title || "Simple, Transparent Pricing")}
            </h1>
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
              {loading ? "" : (pricingContent?.subtitle || "Choose the plan that fits your nutrition tracking needs. All plans include our core AI-powered food analysis technology.")}
            </p>
            
            <div className="flex justify-center">
              <Tabs 
                defaultValue="monthly" 
                className="w-full max-w-xs"
                value={billingInterval}
                onValueChange={(value) => setBillingInterval(value as "monthly" | "yearly")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {billingInterval === "yearly" && (
              <p className="mt-2 text-sm text-primary-600 font-medium">
                Save up to 15% with yearly billing
              </p>
            )}
          </div>
        </section>
        
        {/* Pricing Cards */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {tiers.map((tier) => (
                <Card key={tier.id} className={`border ${tier.featured ? 'border-primary-500 ring-1 ring-primary-500' : 'border-neutral-200'} overflow-hidden`}>
                  {tier.featured && (
                    <div className="bg-primary-500 text-white text-xs font-semibold text-center py-1">
                      MOST POPULAR
                    </div>
                  )}
                  <CardHeader className={tier.featured ? 'bg-primary-50' : ''}>
                    <CardTitle>{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-neutral">{billingInterval === "monthly" ? tier.price.monthly : tier.price.yearly}</span>
                      <span className="text-neutral-600 ml-2">{billingInterval === "monthly" ? "/ month" : "/ year"}</span>
                      
                      {billingInterval === "yearly" && (
                        <span className="block mt-1 text-sm text-primary-600 font-medium">
                          {tier.price.discount}
                        </span>
                      )}
                    </div>
                    
                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="h-5 w-5 text-primary-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-neutral">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="bg-neutral-50 px-6 py-4">
                    <Link href={tier.href} className="w-full">
                      <Button 
                        className={`w-full ${tier.featured ? 'bg-primary hover:bg-gradient-to-b' : 'hover:bg-primary'}`}
                        variant={tier.featured ? "default" : "outline"}
                      >
                        {user ? "Subscribe Now" : "Create Account"}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {/* Enterprise Option */}
            <div className="mt-12 bg-neutral-50 rounded-xl p-8 md:p-10">
              <div className="md:flex items-center justify-between">
                <div className="mb-6 md:mb-0 md:mr-6">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">Enterprise Plan</h3>
                  <p className="text-neutral-600 max-w-xl">
                    Need a custom solution for your organization? Our enterprise plan includes custom features,
                    dedicated support, and volume pricing.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Link href="/contact">
                    <Button size="lg" className={`w-full 'bg-primary hover:bg-gradient-to-b`}>
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Payment Methods */}
        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                Secure Payment Methods
              </h2>
              <p className="text-neutral-600 max-w-2xl mx-auto">
                We support various payment methods to make your subscription process seamless
              </p>
            </div>
            
            <div className="bg-neutral-50 rounded-xl p-8 flex flex-wrap justify-center items-center gap-8 md:gap-12">
              <div className="flex flex-col items-center">
                <CreditCard className="h-10 w-10 text-neutral-600 mb-2" />
                <span className="text-sm font-medium text-neutral-700">Credit Card</span>
              </div>
              
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#003087] mb-2">
                  <path fill="currentColor" d="M7.07 10.588h2.168c.073 0 .145.01.214.03a.606.606 0 0 1 .442.547.584.584 0 0 1-.189.452.653.653 0 0 1-.442.189c-.073 0-.145-.01-.214-.03H7.07v-.886zm0-1.822h1.745c.067 0 .134.009.197.027a.582.582 0 0 1 .415.544.566.566 0 0 1-.179.442.61.61 0 0 1-.415.174h-1.763v-.914zm3.258 2.995a1.81 1.81 0 0 0 1.24-.459c.34-.308.516-.749.477-1.199a1.657 1.657 0 0 0-.318-.943 1.692 1.692 0 0 0-.836-.595 1.485 1.485 0 0 0 .71-.587c.176-.291.255-.626.228-.96a1.551 1.551 0 0 0-.482-1.17 1.936 1.936 0 0 0-1.369-.448h-3.01v7.188h3.144c.078.002.156.002.234 0l-.018-.827zM20.471 13.44a.656.656 0 0 0-.656-.656H19.5V9.905c0-.363-.293-.657-.656-.657h-.778a.655.655 0 0 0-.614.422l-1.309 3.113-1.307-3.113a.656.656 0 0 0-.615-.422h-.778a.656.656 0 0 0-.656.657v2.88h-.315a.656.656 0 0 0-.657.655v.723h2.072v-.674h.314V10.99l1.483 3.52a.656.656 0 0 0 .607.414h.508c.25.001.482-.136.606-.357l1.484-3.531v2.739h.314v.674h2.072v-.723M3.867 7.38h-.436a.656.656 0 0 0-.58.352L.523 12.67a.656.656 0 0 0 .58.96h.919a.656.656 0 0 0 .58-.351l.414-.92h2.29l.392.92c.1.232.33.382.58.381h.92a.656.656 0 0 0 .58-.96L5.446 7.704a.655.655 0 0 0-.58-.352h-.436V7.38h-.564v.657zm-.142 3.531l.708-1.596.709 1.596H3.725z" />
                </svg>
                <span className="text-sm font-medium text-neutral-700">PayPal</span>
              </div>
              
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#635BFF] mb-2">
                  <path fill="currentColor" d="M13.479 9.883c-1.626 0-2.511.706-2.511 1.723 0 .867.788 1.37 2.306 1.37 1.625 0 2.51-.706 2.51-1.723 0-.866-.787-1.37-2.305-1.37zm-2.367-3.021c0 .706.706 1.206 1.934 1.206 1.274 0 1.98-.5 1.98-1.206 0-.753-.706-1.207-1.98-1.207-1.228 0-1.934.454-1.934 1.207zm10.84-4.147c1.166 0 2.118.952 2.118 2.118v14.334c0 1.166-.952 2.118-2.118 2.118H2.118A2.118 2.118 0 0 1 0 19.167V4.833c0-1.166.952-2.118 2.118-2.118zm-1.984 9.649c0-1.192-.972-2.14-2.756-2.14-1.112 0-1.744.252-2.373.57.035-.226.035-.452.035-.652 0-1.031-.813-1.652-2.221-1.652-.917 0-1.465.282-1.809.634.21-.106.35-.331.35-.622 0-.813-.847-1.271-1.991-1.271-.988 0-1.622.317-1.656 1.336a9.756 9.756 0 0 0-2.068.657v5.952h.882v-5.066c.387-.175.829-.35 1.396-.49.07.813.695 1.231 1.795 1.231.493 0 .9-.105 1.221-.282-.035.211-.035.423-.035.617 0 1.336.952 2.085 2.651 2.085.687 0 1.186-.88 1.66-.264-.035.158-.035.334-.035.493 0 1.02.864 1.62 2.221 1.62.864 0 1.465-.193 1.83-.546-.017.123-.017.246-.017.369 0 .759.599 1.248 1.622 1.248.687 0 1.151-.194 1.485-.477v-2.25h-1.133v1.476c-.106.088-.317.158-.582.158-.44 0-.723-.264-.723-.758v-1.09h1.465v-.917h-1.465v-1.477h-.882v1.477h-.971v.917h.97v1.09c0 .265-.52.547-.44.67.318.124.67.195 1.15.195.688 0 1.222-.125 1.729-.37-.035.247-.035.476-.035.706 0 1.302.9 2.049 2.598 2.049.723 0 1.239-.088 1.678-.299v-.916c-.44.228-.952.351-1.57.351-1.133 0-1.65-.44-1.65-1.39v-.37c0-.265.018-.547.07-.847h2.545V12.5h-2.668v-.988h3.164v-.864h-3.164v-.97h2.756v-.847h-2.756v-.881h-.847v.881H14.22v.847h2.545v.97h-3.129v.864h3.13v.988h-2.563c.052-.3.088-.618.088-.934l-.017-.087c-.018.018-.53.018-.88.018-.511 0-.952-.088-1.31-.281a2.063 2.063 0 0 0 1.345-.882h-.9a1.345 1.345 0 0 1-1.099.511c-.952 0-1.55-.53-1.55-1.373 0-.635.369-1.09.971-1.302-.389.123-.744.176-1.046.176-1.222 0-1.925-.583-1.925-1.566 0-.899.6-1.514 1.586-1.674-.387.159-.793.23-1.204.23-1.256 0-2.05-.563-2.05-1.46 0-.778.441-1.307 1.15-1.567h7.5V2.118H2.118v19.764h19.764V4.833c0-.037-.02-.073-.022-.11a2.102 2.102 0 0 0-2.096-2.008h-3.22c-.23.257-.3.64-.3 1.037 0 1.037.723 1.62 2.086 1.62 1.046 0 1.693-.3 2.068-.634-.123.37-.194.758-.194 1.196 0 1.39.899 2.261 2.332 2.261.387 0 .723-.053 1.063-.176l.035-.018z" />
                </svg>
                <span className="text-sm font-medium text-neutral-700">Stripe</span>
              </div>
              
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#FFC439] mb-2">
                  <rect width="24" height="24" rx="4" fill="currentColor" />
                  <path d="M8.04 7.044H4.638c-.065 0-.13.013-.19.039a.499.499 0 0 0-.272.272.501.501 0 0 0-.39.19v5.212c-.034.224.12.433.344.467.022.003.045.005.067.005h1.91a.466.466 0 0 0 .466-.402l.527-3.35.527 3.35a.466.466 0 0 0 .466.402h1.91a.467.467 0 0 0 .467-.403l1.062-6.742h-1.9a.466.466 0 0 0-.466.402l-.54 3.421-.539-3.42a.466.466 0 0 0-.466-.403M20.323 7.046h-1.909a.466.466 0 0 0-.467.402l-1.063 6.743h1.91a.466.466 0 0 0 .466-.402l1.063-6.743zM16.413 7.044h-1.91c-.24 0-.45.175-.49.412L13.09 13.732a.467.467 0 0 0 .41.518c.027.004.054.005.081.005h1.686c.241 0 .451-.175.49-.413l.307-1.95h1.096c1.695 0 2.673-.82 3.002-2.438.13-.644.005-1.15-.364-1.505-.405-.393-1.122-.594-2.075-.594h-.532l.211-1.315a.466.466 0 0 0-.462-.533c-.9.0018-.18.0036-.27.0054zm.253 2.884l-.193 1.235h-.871l.194-1.235h.87z" fill="#253B80" />
                </svg>
                <span className="text-sm font-medium text-neutral-700">Apple Pay</span>
              </div>
              
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#4285F4] mb-2">
                  <path d="M12 24c6.624 0 12-5.376 12-12S18.624 0 12 0 0 5.376 0 12s5.376 12 12 12z" fill="#4285F4" />
                  <path d="M12 9.5v3h4.199c-.17 1.15-1.231 3.36-4.199 3.36-2.52 0-4.58-2.09-4.58-4.66 0-2.56 2.06-4.65 4.58-4.65 1.44 0 2.4.61 2.95 1.14l2.01-1.94C15.47 4.36 13.9 3.5 12 3.5c-4.42 0-8 3.58-8 8s3.58 8 8 8c4.62 0 7.69-3.25 7.69-7.82 0-.52-.07-.92-.15-1.33H12z" fill="#FFF" />
                </svg>
                <span className="text-sm font-medium text-neutral-700">Google Pay</span>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-12 bg-neutral-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-neutral-600">
                Find answers to common questions about our subscription plans
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Can I change my plan later?
                </h3>
                <p className="text-neutral-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes to your subscription will be applied at the beginning of your next billing cycle.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-neutral-600">
                  Yes! You can try our demo version for free with limited features. Additionally, all paid plans come with a 7-day free trial period.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  How does the food analysis count work?
                </h3>
                <p className="text-neutral-600">
                  Each plan includes a specific number of AI food analyses per month. One analysis is counted each time you upload or take a photo of a meal for nutritional analysis.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Can I cancel my subscription?
                </h3>
                <p className="text-neutral-600">
                  Yes, you can cancel your subscription at any time. You'll continue to have access to your plan until the end of your current billing period.
                </p>
              </div>
            </div>
            
            <div className="mt-10 text-center">
              <p className="text-neutral-600 mb-4">
                Have more questions? We're here to help.
              </p>
              <Link href="/contact">
                <Button>
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}