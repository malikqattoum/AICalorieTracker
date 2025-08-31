import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { NutritionCoachChatbot } from "@/components/nutrition-coach-chatbot";
import { useAuth } from "@/hooks/use-auth";

export default function ChatbotPage() {
  const { user } = useAuth();

  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Nutrition Coach Chatbot
            </h1>
            <p className="text-neutral-500">
              Chat with your personal nutrition coach for advice on meals, nutrition, and healthy eating.
            </p>
          </div>

          <div className="flex justify-center">
            <NutritionCoachChatbot userId={user?.id} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}