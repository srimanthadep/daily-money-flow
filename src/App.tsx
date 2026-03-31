import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import AnalyticsPage from "./pages/Analytics.tsx";
import ExpensesPage from "./pages/Expenses.tsx";
import ActivityLog from "./pages/ActivityLog.tsx";
import NotFound from "./pages/NotFound.tsx";
import { MainLayout } from "./components/layout/MainLayout.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MainLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/activity" element={<ActivityLog />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
