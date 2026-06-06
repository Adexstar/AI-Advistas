import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { AppProvider } from "./contexts/AppContext";
import { VisualEditorProvider } from "./contexts/VisualEditorContext";

const queryClient = new QueryClient();

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const CreateAdEntry = lazy(() => import("./pages/CreateAdEntry"));
const Billing = lazy(() => import("./pages/Billing"));
const Settings = lazy(() => import("./pages/Settings"));
const VisualEditorPage = lazy(() => import("./pages/VisualEditorPage"));
const AdEditor = lazy(() => import("./pages/AdEditor"));
const TemplateCustomizer = lazy(() => import("./pages/TemplateCustomizer"));
const TemplateLibrary = lazy(() => import("./pages/TemplateLibrary"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const MediaLibrary = lazy(() => import("./pages/MediaLibrary"));
const BrandKit = lazy(() => import("./pages/BrandKit"));

const RouteFallback = () => (
  <div className="min-h-screen w-full bg-background">
    <div className="page-container flex min-h-screen items-center justify-center py-16">
      <div className="surface-panel w-full max-w-sm rounded-3xl px-6 py-8 text-center shadow-card">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-primary/15" />
        <p className="text-sm font-medium text-foreground">Loading workspace</p>
        <p className="mt-2 text-sm text-muted-foreground">Preparing the next view.</p>
      </div>
    </div>
  </div>
);

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
        <Suspense fallback={<RouteFallback />}>
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
            <Route path="/create-old" element={<Navigate to="/create" replace />} />
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
            <Route path="/media-library" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<MediaLibrary />} />
            </Route>
            <Route path="/brand-kit" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<BrandKit />} />
            </Route>
            
            {/* Redirects from old routes to new consolidated structure */}
            <Route path="/templates" element={<Navigate to="/template-library" replace />} />
            <Route path="/ads" element={<Navigate to="/campaigns" replace />} />
            <Route path="/audience" element={<Navigate to="/campaigns" replace />} />
            <Route path="/ai-editor" element={<Navigate to="/create" replace />} />
            <Route path="/simulator" element={<Navigate to="/create" replace />} />
            <Route path="/visual-editor" element={<ProtectedRoute><VisualEditorPage /></ProtectedRoute>} />
            <Route path="/template-customizer" element={
              <ProtectedRoute>
                <VisualEditorProvider>
                  <TemplateCustomizer />
                </VisualEditorProvider>
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
        </Suspense>
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
