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
import { AIStatusProvider } from "./contexts/AIStatusContext";
import { AIContextProvider } from "./contexts/AIContext";
import { AIBrainProvider } from "./contexts/AIBrainContext";

const queryClient = new QueryClient();

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const CampaignWorkspace = lazy(() => import("./pages/CampaignWorkspace"));
const CreateAd = lazy(() => import("./pages/CreateAd"));
const Billing = lazy(() => import("./pages/Billing"));
const Settings = lazy(() => import("./pages/Settings"));
const VisualEditorPage = lazy(() => import("./pages/VisualEditorPage"));
const AdEditor = lazy(() => import("./pages/AdEditor"));
const TemplateCustomizer = lazy(() => import("./pages/TemplateCustomizer"));
const TemplateLibrary = lazy(() => import("./pages/TemplateLibrary"));
const TemplateGenerate = lazy(() => import("./pages/TemplateGenerate"));
const Templates = lazy(() => import("./pages/Templates"));
const OriginalTemplateDetail = lazy(() => import("./pages/OriginalTemplateDetail"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProviders = lazy(() => import("./pages/AdminProviders"));
const MediaLibrary = lazy(() => import("./pages/MediaLibrary"));
const BrandKit = lazy(() => import("./pages/BrandKit"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ExportCenter = lazy(() => import("./pages/ExportCenter"));
const IntegrationsHub = lazy(() => import("./pages/IntegrationsHub"));
const Notifications = lazy(() => import("./pages/Notifications"));
const AutomationCenter = lazy(() => import("./pages/AutomationCenter"));
const TeamWorkspace = lazy(() => import("./pages/TeamWorkspace"));
const AssetMarketplace = lazy(() => import("./pages/AssetMarketplace"));
const DeveloperCenter = lazy(() => import("./pages/DeveloperCenter"));
const SystemMonitor = lazy(() => import("./pages/SystemMonitor"));

// No full-screen loader on route transitions — pages render their own skeletons.
const RouteFallback = () => null;

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
          window.location.href = '/create-ad';
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
            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
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
              <Route path=":id" element={<CampaignWorkspace />} />
            </Route>
            <Route path="/create" element={<Navigate to="/create-ad" replace />} />
            <Route path="/create-ad" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<CreateAd />} />
            </Route>
            <Route path="/ad-editor" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdEditor />} />
            </Route>
            <Route path="/create-old" element={<Navigate to="/create-ad" replace />} />
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
              <Route path="generate" element={<TemplateGenerate />} />
            </Route>
            <Route path="/templates" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Templates />} />
              <Route path="generate" element={<TemplateGenerate />} />
            </Route>
            <Route path="/originals" element={<Navigate to="/templates" replace />} />

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
            <Route path="/analytics" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Analytics />} />
            </Route>
            
            <Route path="/exports" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<ExportCenter />} />
            </Route>
            <Route path="/integrations" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<IntegrationsHub />} />
            </Route>
            <Route path="/notifications" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Notifications />} />
            </Route>
            <Route path="/automation" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<AutomationCenter />} />
            </Route>
            <Route path="/team" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<TeamWorkspace />} />
            </Route>
            <Route path="/marketplace" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<AssetMarketplace />} />
            </Route>
            <Route path="/developer" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DeveloperCenter />} />
            </Route>
            <Route path="/system" element={<ProtectedRoute><AdminRoute><DashboardLayout /></AdminRoute></ProtectedRoute>}>
              <Route index element={<SystemMonitor />} />
            </Route>

            {/* Redirects from old routes to new consolidated structure */}
            <Route path="/ads" element={<Navigate to="/campaigns" replace />} />
            <Route path="/audience" element={<Navigate to="/campaigns" replace />} />
            <Route path="/ai-editor" element={<Navigate to="/create-ad" replace />} />
            <Route path="/simulator" element={<Navigate to="/create-ad" replace />} />
            <Route path="/visual-editor" element={<ProtectedRoute><VisualEditorPage /></ProtectedRoute>} />

            <Route path="/template-customizer" element={
              <ProtectedRoute>
                <VisualEditorProvider>
                  <TemplateCustomizer />
                </VisualEditorProvider>
              </ProtectedRoute>
            } />
            <Route path="/admin/providers" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminProviders />} />
            </Route>
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
      <AIStatusProvider>
        <AIContextProvider>
          <AppProvider>
            <AIBrainProvider>
              <TooltipProvider>
                <AppContent />
              </TooltipProvider>
            </AIBrainProvider>
          </AppProvider>
        </AIContextProvider>
      </AIStatusProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
