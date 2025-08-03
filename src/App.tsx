import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CreateAd from "./pages/CreateAd";
import Audience from "./pages/Audience";
import Billing from "./pages/Billing";
import LandingPages from "./pages/LandingPages";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
          </Route>
          <Route path="/campaigns" element={<DashboardLayout />}>
            <Route index element={<Campaigns />} />
          </Route>
          <Route path="/create-ad" element={<DashboardLayout />}>
            <Route index element={<CreateAd />} />
          </Route>
          <Route path="/audience" element={<DashboardLayout />}>
            <Route index element={<Audience />} />
          </Route>
          <Route path="/billing" element={<DashboardLayout />}>
            <Route index element={<Billing />} />
          </Route>
          <Route path="/landing-pages" element={<DashboardLayout />}>
            <Route index element={<LandingPages />} />
          </Route>
          <Route path="/settings" element={<DashboardLayout />}>
            <Route index element={<Settings />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
