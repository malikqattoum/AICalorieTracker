import { createRoot } from "react-dom/client";
import App from "@/App";
import "@/index.css";
import "@/lib/i18n"; // Added i18n import
import { AuthProvider } from "@/hooks/use-auth";
import { ErrorProvider } from "@/contexts/ErrorContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ErrorProvider>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </ErrorProvider>
  </QueryClientProvider>
);