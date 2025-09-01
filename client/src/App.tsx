import { Switch, Route, useLocation } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "./pages/not-found";
import HomePage from "./pages/home-page";
import AuthPage from "./pages/auth-page";
import HistoryPage from "./pages/history-page";
import LandingPage from "./pages/landing-page";
import TryItPage from "./pages/try-it-page";
import PricingPage from "./pages/pricing-page";
import AboutPage from "./pages/about-page";
import ContactPage from "./pages/contact-page";
import TermsPage from "./pages/terms-page";
import PrivacyPage from "./pages/privacy-page";
import MealPlanPage from "./pages/meal-plan-page";
import MealCalendarPage from "./pages/meal-calendar-page";
import RecipeImportPage from "./pages/recipe-import-page";
import OnboardingPage from "./pages/onboarding-page";
import AdminPanel from "./pages/admin-panel";
import ChatbotPage from "./pages/chatbot";
import AchievementsPage from "./pages/achievements-page";
import NutritionEducationPage from "./pages/nutrition-education-page";
import ProfilePage from "./pages/profile-page";
import PremiumAnalyticsPage from "./pages/PremiumAnalytics";
import { ProtectedRoute } from "./lib/protected-route";
import { ReactElement } from "react";

const RedirectToLogin = () => {
  const [, setLocation] = useLocation();
  setLocation('/login');
  return null;
};

function Router(): ReactElement {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/try-it" component={TryItPage} />
      <Route path="/pricing" component={PricingPage} />
      <ProtectedRoute path="/dashboard" component={HomePage} />
      <ProtectedRoute path="/history" component={HistoryPage} />
      <Route path="/auth" component={RedirectToLogin} />
      <Route path="/login" component={AuthPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <ProtectedRoute path="/meal-plan" component={MealPlanPage} />
      <ProtectedRoute path="/meal-calendar" component={MealCalendarPage} />
      <ProtectedRoute path="/recipe-import" component={RecipeImportPage} />
      <ProtectedRoute path="/onboarding" component={OnboardingPage} />
      <ProtectedRoute path="/admin" component={AdminPanel} />
      <ProtectedRoute path="/chatbot" component={ChatbotPage} />
      <ProtectedRoute path="/achievements" component={AchievementsPage} />
      <ProtectedRoute path="/nutrition-education" component={NutritionEducationPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/premium-analytics" component={PremiumAnalyticsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App(): ReactElement {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
