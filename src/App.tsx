import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CreateAd from "./pages/CreateAd";
import Audience from "./pages/Audience";
import Billing from "./pages/Billing";
import LandingPages from "./pages/LandingPages";
import Settings from "./pages/Settings";
import AdSimulatorPage from "./pages/AdSimulatorPage";
import VisualEditor from "./pages/VisualEditor";
import TemplateLibrary from "./pages/TemplateLibrary";
import AdEditor from "./pages/AdEditor";
import MyAds from "./pages/MyAds";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppProvider } from "./contexts/AppContext";

const queryClient = new QueryClient();

const AppContent = () => {
  // Global keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'h',
        ctrlKey: true,
        shiftKey: true,
        action: () => {
          window.location.href = '/';
        },
        description: 'Go to home',
        category: 'Navigation'
      },
      {
        key: 'd',
        ctrlKey: true,
        shiftKey: true,
        action: () => {
          window.location.href = '/dashboard';
        },
        description: 'Go to dashboard',
        category: 'Navigation'
      },
      {
        key: 'c',
        ctrlKey: true,
        shiftKey: true,
        action: () => {
          window.location.href = '/campaigns';
        },
        description: 'Go to campaigns',
        category: 'Navigation'
      },
      {
        key: 'n',
        ctrlKey: true,
        shiftKey: true,
        action: () => {
          window.location.href = '/create';
        },
        description: 'Create new ad',
        category: 'Navigation'
      }
    ]
  });

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
            </Route>
            <Route path="/campaigns" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Campaigns />} />
            </Route>
            <Route path="/create" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<CreateAd />} />
            </Route>
            <Route path="/audience" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Audience />} />
            </Route>
            <Route path="/billing" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Billing />} />
            </Route>
            <Route path="/settings" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Settings />} />
            </Route>
            <Route path="/templates" element={
              <ProtectedRoute>
                <TemplateLibrary />
              </ProtectedRoute>
            } />
            <Route path="/ads" element={
              <ProtectedRoute>
                <MyAds />
              </ProtectedRoute>
            } />
            <Route path="/editor" element={
              <ProtectedRoute>
                <VisualEditor />
              </ProtectedRoute>
            } />
            <Route path="/simulator" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdSimulatorPage />} />
            </Route>
            <Route path="/ad-editor/:templateId" element={
              <ProtectedRoute>
                <AdEditor />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
