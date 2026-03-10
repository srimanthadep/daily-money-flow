import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
<<<<<<< HEAD
import ExpensesPage from "./pages/Expenses.tsx";
import NotFound from "./pages/NotFound.tsx";
import { MainLayout } from "./components/MainLayout.tsx";
=======
import NotFound from "./pages/NotFound.tsx";
>>>>>>> c858d41a280eb1830d0b49e066a0a7ae053c50cc

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
<<<<<<< HEAD
        <MainLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
=======
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
>>>>>>> c858d41a280eb1830d0b49e066a0a7ae053c50cc
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
