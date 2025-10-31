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
import CreateAdEntry from "./pages/CreateAdEntry";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import VisualEditorPage from "./pages/VisualEditorPage";
import AdEditor from "./pages/AdEditor";
import TemplateCustomizer from "./pages/TemplateCustomizer";
import TemplateLibrary from "./pages/TemplateLibrary";
import CanvaCallback from "./pages/CanvaCallback";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { AppProvider } from "./contexts/AppContext";
import { VisualEditorProvider } from "./contexts/VisualEditorContext";

const queryClient = new QueryClient();

const AppContent = () => {
  // Global keyboard shortcuts - simplified for core actions
  useKeyboardShortcuts({
    shortcuts: [
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
          window.location.href = '/create';
        },
        description: 'Create new ad',
        category: 'Navigation'
      },
      {
        key: 'm',
        ctrlKey: true,
        shiftKey: true,
        action: () => {
          window.location.href = '/campaigns';
        },
        description: 'Manage campaigns',
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
              <Route index element={<CreateAdEntry />} />
            </Route>
            <Route path="/ad-editor" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdEditor />} />
            </Route>
            <Route path="/create-old" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<CreateAd />} />
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
            <Route path="/template-library" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<TemplateLibrary />} />
            </Route>
            
            {/* Redirects from old routes to new consolidated structure */}
            <Route path="/templates" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<CreateAd />} />
            </Route>
            <Route path="/ads" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Campaigns />} />
            </Route>
            <Route path="/audience" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Campaigns />} />
            </Route>
            <Route path="/ai-editor" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<CreateAd />} />
            </Route>
            <Route path="/simulator" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<CreateAd />} />
            </Route>
            <Route path="/visual-editor" element={<ProtectedRoute><VisualEditorPage /></ProtectedRoute>} />
            <Route path="/template-customizer" element={
              <ProtectedRoute>
                <VisualEditorProvider>
                  <TemplateCustomizer />
                </VisualEditorProvider>
              </ProtectedRoute>
            } />
            <Route path="/auth/canva/callback" element={
              <ProtectedRoute>
                <CanvaCallback />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminRoute>
                  <DashboardLayout />
                </AdminRoute>
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
            </Route>
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
