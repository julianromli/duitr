
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinanceProvider } from "@/context/FinanceContext";
import Navbar from "@/components/layout/Navbar";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Budgets from "@/pages/Budgets";
import Wallets from "@/pages/Wallets";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FinanceProvider>
        <BrowserRouter>
          <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background">
            <Navbar />
            <main className="flex-1 md:ml-64 relative">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/wallets" element={<Wallets />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </FinanceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
