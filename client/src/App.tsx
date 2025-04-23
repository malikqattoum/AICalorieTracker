import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import HistoryPage from "@/pages/history-page";
import LandingPage from "@/pages/landing-page";
import TryItPage from "@/pages/try-it-page";
import PricingPage from "@/pages/pricing-page";
import { ProtectedRoute } from "./lib/protected-route";
import { ReactElement } from "react";

function Router(): ReactElement {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/try-it" component={TryItPage} />
      <Route path="/pricing" component={PricingPage} />
      <ProtectedRoute path="/dashboard" component={HomePage} />
      <ProtectedRoute path="/history" component={HistoryPage} />
      <Route path="/auth" component={AuthPage} />
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
