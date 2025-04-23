import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Salad, TrendingUp, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero section */}
          <div className="py-16 md:py-24 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
              About <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700">NutriScan</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto">
              Revolutionizing nutrition tracking with cutting-edge AI technology
            </p>
          </div>

          {/* Our story section */}
          <div className="mb-16 md:mb-24">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-6 md:p-10">
                <h2 className="text-3xl font-bold text-neutral-900 mb-6">Our Story</h2>
                <div className="prose max-w-none text-neutral-700">
                  <p>
                    NutriScan was born from a simple observation: tracking nutrition accurately is too difficult and time-consuming for most people.
                  </p>
                  <p>
                    Our founder, a nutrition enthusiast with a background in AI, struggled with traditional food tracking apps that required manual logging and often provided inaccurate nutritional information. The tedious process of searching databases, weighing food, and estimating portions made consistent tracking nearly impossible.
                  </p>
                  <p>
                    We envisioned a simpler solution: what if you could just take a photo of your meal and instantly get accurate nutritional information? By combining the latest advances in computer vision and large language models, we've created an AI system that can analyze food with remarkable accuracy.
                  </p>
                  <p>
                    Today, NutriScan helps thousands of users make better nutritional choices without the friction of traditional tracking methods. Our mission is to make nutrition tracking effortless, accurate, and accessible to everyone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Our technology section */}
          <div className="mb-16 md:mb-24">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">Our Technology</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Brain className="h-10 w-10 text-primary-600" />,
                  title: "Advanced AI",
                  description: "Utilizing state-of-the-art large language models and computer vision to accurately identify food items and their nutritional content."
                },
                {
                  icon: <Zap className="h-10 w-10 text-primary-600" />,
                  title: "Instant Analysis",
                  description: "Get nutritional information in seconds, not minutes. No more tedious manual logging or searching databases."
                },
                {
                  icon: <Salad className="h-10 w-10 text-primary-600" />,
                  title: "Food Recognition",
                  description: "Our AI can identify thousands of different foods and ingredients, even in complex mixed meals."
                },
                {
                  icon: <TrendingUp className="h-10 w-10 text-primary-600" />,
                  title: "Personalization",
                  description: "The more you use NutriScan, the more it learns about your habits, providing increasingly accurate recommendations."
                }
              ].map((feature, index) => (
                <Card key={index} className="border border-neutral-200 shadow-sm bg-white">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="rounded-full bg-primary-50 p-3 mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">{feature.title}</h3>
                      <p className="text-neutral-600">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Vision and values section */}
          <div className="mb-16 md:mb-24">
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-2xl overflow-hidden">
              <div className="p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-8 text-center">Our Vision & Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Our Vision</h3>
                    <p className="text-primary-50 mb-4">
                      We envision a world where everyone has access to accurate nutritional information at their fingertips, empowering them to make better food choices and improve their overall health.
                    </p>
                    <p className="text-primary-50">
                      By removing the friction from nutrition tracking, we aim to help millions of people develop healthier relationships with food and achieve their wellness goals.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Our Values</h3>
                    <ul className="space-y-3 text-primary-50">
                      <li className="flex items-start">
                        <span className="font-bold mr-2">•</span>
                        <span><strong>Accuracy:</strong> We're committed to providing the most precise nutritional information possible.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">•</span>
                        <span><strong>Accessibility:</strong> Our tools should be easy to use for everyone, regardless of tech savviness.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">•</span>
                        <span><strong>Privacy:</strong> We respect user data and maintain the highest standards of privacy.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">•</span>
                        <span><strong>Innovation:</strong> We continuously improve our technology to deliver the best experience.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}