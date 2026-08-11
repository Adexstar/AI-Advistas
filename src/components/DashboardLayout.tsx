import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BarChart3,
  Bell,
  Brain,
  Target,
  SlidersHorizontal,

  ChevronLeft,
  Code2,
  CreditCard,
  Download,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Megaphone,
  Menu,
  Palette,
  PenTool,
  Plug,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Store,
  Users,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import SidebarSearch from "@/components/sidebar/SidebarSearch";
import GlobalSearch from "@/components/GlobalSearch";
import MobileBottomNav from "@/components/MobileBottomNav";
import AIContextBar from "@/components/dashboard/AIContextBar";
import NotifyBadge from "@/components/ui/NotifyBadge";


type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
  notify?: number;
  soon?: boolean;
};

type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    title: "Creative Workspace",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Campaigns", href: "/campaigns", icon: Megaphone },
      { name: "Create Ad", href: "/create-ad", icon: Plus },
      { name: "Templates", href: "/template-library", icon: LayoutTemplate },
      { name: "Visual Editor", href: "/visual-editor", icon: PenTool },
      { name: "Brand Kit", href: "/brand-kit", icon: Palette },
      { name: "Media Library", href: "/media-library", icon: ImageIcon },
      { name: "Analytics & Reports", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Export Center", href: "/exports", icon: Download, soon: true },
      { name: "Integrations Hub", href: "/integrations", icon: Plug, soon: true },
      { name: "Notifications", href: "/notifications", icon: Bell, soon: true },
      { name: "Automation Center", href: "/automation", icon: Zap, soon: true },
      { name: "Team Workspace", href: "/team", icon: Users, soon: true },
    ],
  },
  {
    title: "Account",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Billing", href: "/billing", icon: CreditCard },
    ],
  },
  {
    title: "Future",
    items: [
      { name: "Asset Marketplace", href: "/marketplace", icon: Store, badge: "Soon", disabled: true },
      { name: "Developer Center", href: "/developer", icon: Code2, badge: "Soon", disabled: true },
    ],
  },
];

const adminNavItems: NavItem[] = [
  { name: "Admin Dashboard", href: "/admin", icon: Shield },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Templates", href: "/admin/templates", icon: LayoutTemplate },
  { name: "AI Decisions Log", href: "/admin/decisions", icon: Brain },
  { name: "System Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "API & Providers", href: "/admin/providers", icon: Plug },
  { name: "Category Playbooks", href: "/admin/playbooks", icon: Target },
  { name: "System Settings", href: "/admin/settings", icon: SlidersHorizontal },
];


const pageMeta: { match: (p: string) => boolean; title: string; description: string }[] = [
  { match: (p) => p.startsWith("/dashboard"), title: "Dashboard", description: "Overview of business performance." },
  { match: (p) => p.startsWith("/campaigns"), title: "Campaigns", description: "Track, pause, and edit running ads." },
  { match: (p) => p.startsWith("/template"), title: "Templates", description: "Browse and customize creative templates." },
  { match: (p) => p.startsWith("/visual-editor") || p.startsWith("/ad-editor"), title: "Visual Editor", description: "Design and edit creatives." },
  { match: (p) => p.startsWith("/create"), title: "Create Ad", description: "Launch a new ad with AI." },
  { match: (p) => p.startsWith("/billing"), title: "Billing", description: "Manage your plan and credits." },
  { match: (p) => p.startsWith("/settings"), title: "Settings", description: "Preferences and account details." },
  { match: (p) => p.startsWith("/analytics"), title: "Analytics & Reports", description: "Track performance, analyze results, and grow your advertising impact." },
  { match: (p) => p.startsWith("/exports"), title: "Export Center", description: "Render creatives in every format and preset." },
  { match: (p) => p.startsWith("/integrations"), title: "Integrations Hub", description: "Connect your ad, creative and storage platforms." },
  { match: (p) => p.startsWith("/notifications"), title: "Notifications", description: "Every important signal, in one place." },
  { match: (p) => p.startsWith("/automation"), title: "Automation Center", description: "Operations dashboard for AdVista AI." },
  { match: (p) => p.startsWith("/team"), title: "Team Workspace", description: "Members, roles, permissions and approvals." },
  { match: (p) => p.startsWith("/marketplace"), title: "Asset Marketplace", description: "Templates, stock and brand packs." },
  { match: (p) => p.startsWith("/developer"), title: "Developer Center", description: "API keys, webhooks and SDKs." },
  { match: (p) => p.startsWith("/system"), title: "System Monitor", description: "Admin-only infrastructure health." },
  { match: (p) => p.startsWith("/admin"), title: "Admin", description: "Workspace controls." },
];

const NavItemRow = ({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) => {
  const Icon = item.icon;

  if (item.disabled) {
    const disabled = (
      <div
        aria-disabled
        className={cn(
          "group flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-truncate">{item.name}</span>
            {item.badge && (
              <Badge className="h-5 rounded-full bg-primary/20 px-2 text-[10px] font-semibold text-primary-foreground hover:bg-primary/20">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </div>
    );
    if (!collapsed) return disabled;
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>{disabled}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">{item.name} · Coming soon</TooltipContent>
      </Tooltip>
    );
  }

  const link = (
    <NavLink
      to={item.href}
      onClick={onNavigate}
      end={item.href === "/dashboard"}
      aria-disabled={item.soon || undefined}
      tabIndex={item.soon ? -1 : undefined}
      className={({ isActive }) =>
        cn(
          "group flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-all",
          collapsed && "justify-center px-0",
          item.soon && "pointer-events-none opacity-60",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-truncate">{item.name}</span>
          {item.soon ? (
            <span className="rounded-[10px] bg-[rgba(108,99,255,0.15)] px-1.5 py-[2px] text-[9px] font-bold tracking-wide text-[#A78BFA]">
              SOON
            </span>
          ) : item.notify ? (
            <NotifyBadge count={item.notify} variant="unread" />
          ) : null}
          {item.badge && (
            <Badge variant="secondary" className="h-5 rounded-full bg-white/10 px-2 text-[10px] font-semibold text-white/70 hover:bg-white/10">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  );
  if (!collapsed) return link;
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="font-medium">{item.name}</TooltipContent>
    </Tooltip>
  );
};

const SidebarBody = ({
  collapsed,
  onToggleCollapse,
  onClose,
  isMobile = false,
  user,
  isAdmin,
  signOut,
  onOpenSearch,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
  user: any;
  isAdmin: boolean;
  signOut: () => void;
  onOpenSearch: () => void;
}) => {
  const close = () => onClose?.();
  const planLabel = "Pro Plan";
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Welcome";

  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 flex-col">
        {/* Sidebar Top — logo + actions */}
        <div className="sidebar-top">
          <div className={cn("flex h-14 items-center px-3", collapsed && "justify-center")}>
            <NavLink to="/dashboard" onClick={close} className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] shadow-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-truncate text-base font-bold text-white">AdVista</p>
                  <p className="text-truncate text-[11px] font-medium text-white/50">Advertising Studio</p>
                </div>
              )}
            </NavLink>
            {isMobile && (
              <Button variant="ghost" size="icon" className="ml-auto text-white hover:bg-white/10 hover:text-white" onClick={close}>
                <X className="h-5 w-5" />
              </Button>
            )}
            {!isMobile && !collapsed && onToggleCollapse && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white"
                onClick={onToggleCollapse}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className={cn("px-3 pb-2", collapsed && "flex justify-center")}>
            <SidebarSearch onOpen={onOpenSearch} collapsed={collapsed} />
          </div>
          <div className={cn("px-3 pb-3", collapsed && "px-2")}>
            {collapsed ? (
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button asChild size="icon" className="h-10 w-full rounded-lg bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] shadow-lg hover:opacity-90">
                    <NavLink to="/create" onClick={close} aria-label="Create Ad">
                      <Plus className="h-5 w-5" />
                    </NavLink>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Create Ad</TooltipContent>
              </Tooltip>
            ) : (
              <Button asChild className="h-10 w-full justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] text-sm font-semibold shadow-lg hover:opacity-90">
                <NavLink to="/create" onClick={close}>
                  <Plus className="h-4 w-4" />
                  Create Ad
                </NavLink>
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar Nav — scrolls */}
        <nav className="sidebar-nav">
          {navGroups.map((group, idx) => (
            <div key={group.title}>
              {!collapsed && group.title !== "Creative Workspace" && (
                <div className="border-t border-white/10 mx-3 my-2" />
              )}
              {!collapsed && (
                <p className="sidebar-section-label">{group.title}</p>
              )}
              {group.items.map((item) => (
                <NavItemRow key={item.name} item={item} collapsed={collapsed} onNavigate={close} />
              ))}
              {group.title === "Account" && isAdmin && (
                <>
                  {!collapsed && <div className="border-t border-white/10 mx-3 my-2" />}
                  {!collapsed && <p className="sidebar-section-label">Admin</p>}
                  {adminNavItems.map((item) => (
                    <NavItemRow key={item.name} item={item} collapsed={collapsed} onNavigate={close} />
                  ))}
                </>
              )}

            </div>
          ))}

          {/* Usage Widget */}
          {!collapsed && (
            <div className="mx-3 mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-micro font-semibold text-white">Usage this month</p>
                <Badge className="h-5 rounded-full bg-primary/20 px-2 text-[10px] text-primary-foreground hover:bg-primary/20">{planLabel}</Badge>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="mb-0.5 flex items-center justify-between text-[10px] text-white/60">
                    <span>Storage</span>
                    <span>3.2 / 10 GB</span>
                  </div>
                  <Progress value={32} className="h-1.5 bg-white/10" />
                </div>
                <div>
                  <div className="mb-0.5 flex items-center justify-between text-[10px] text-white/60">
                    <span>Campaigns</span>
                    <span>12 / ∞</span>
                  </div>
                  <Progress value={60} className="h-1.5 bg-white/10" />
                </div>
              </div>
              <Button asChild size="sm" className="mt-3 h-8 w-full rounded-lg bg-white text-primary hover:bg-white/90">
                <NavLink to="/billing" onClick={close}>Upgrade Plan</NavLink>
              </Button>
            </div>
          )}
        </nav>

        {/* Sidebar Bottom — user card */}
        <div className="sidebar-bottom">
          {collapsed ? (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <button
                  onClick={signOut}
                  className="grid h-10 w-full place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-white/5 p-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] text-[11px] font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-truncate text-sm font-semibold text-white">{displayName}</p>
                <p className="text-truncate text-[10px] text-white/50">{planLabel}</p>
              </div>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <button
                    onClick={signOut}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Sign out</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

const DashboardShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin } = useAdmin();

  const activePage = pageMeta.find((item) => item.match(location.pathname)) || pageMeta[0];
  const openSearch = () => setSearchOpen(true);

  // Prefetch adjacent routes in the background so navigation is instant.
  useEffect(() => {
    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback ? (window as any).requestIdleCallback(cb) : setTimeout(cb, 400);
    idle(() => {
      import("@/pages/Campaigns").catch(() => {});
      import("@/pages/TemplateLibrary").catch(() => {});
      import("@/pages/Dashboard").catch(() => {});
      import("@/pages/CreateAd").catch(() => {});
    });
  }, []);


  return (
    <div className="app-shell bg-background">
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Top Bar — never scrolls, always visible */}
      <header className="top-bar z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        {/* Mobile header (hamburger + logo + bell) */}
        <div className="flex h-[52px] items-center justify-between px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="h-8 w-8">
              <Menu className="h-5 w-5" />
            </Button>
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-[hsl(243_82%_62%)]">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-foreground">AdVista</span>
            </NavLink>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="relative h-8 w-8">
              <NavLink to="/notifications" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </NavLink>
            </Button>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden h-14 items-center justify-between gap-4 px-6 lg:flex">
          <div className="min-w-0">
            <h2 className="font-page-title">{activePage.title}</h2>
            <p className="font-micro text-muted-foreground">{activePage.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={openSearch}
              className="flex h-9 w-56 items-center gap-2 rounded-lg border border-border bg-card px-3 text-left text-sm text-muted-foreground transition hover:border-primary/40"
            >
              <span className="flex-1 text-truncate">Search anything…</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            </button>
            <Button asChild variant="outline" size="icon" className="relative h-9 w-9 rounded-lg">
              <NavLink to="/notifications" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1"><NotifyBadge count={4} variant="unread" /></span>
              </NavLink>
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile context bar (below header on mobile) */}
        <div className="flex border-t border-border/40 bg-background/80 px-4 py-2 lg:hidden">
          <AIContextBar />
        </div>
      </header>

      {/* Desktop Context Bar — separate row, never scrolls */}
      <div className="context-bar hidden border-b border-border/40 bg-background/60 px-6 py-1.5 backdrop-blur-xl lg:flex">
        <AIContextBar />
      </div>

      {/* Main Body — only .page-content scrolls */}
      <div className="main-body">
        {/* Mobile drawer */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="w-[min(20rem,calc(100vw-3rem))] border-r-0 bg-[hsl(240_15%_8%)] p-0 shadow-2xl [&>button]:hidden lg:hidden"
          >
            <VisuallyHidden.Root>
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Main app navigation and account actions.</SheetDescription>
            </VisuallyHidden.Root>
            <SidebarBody
              collapsed={false}
              isMobile
              onClose={() => setSidebarOpen(false)}
              user={user}
              isAdmin={isAdmin}
              signOut={signOut}
              onOpenSearch={() => { setSidebarOpen(false); setSearchOpen(true); }}
            />
          </SheetContent>
        </Sheet>

        {/* Desktop sidebar — scrolls independently */}
        <aside
          className={cn(
            "sidebar border-r border-white/5 bg-[hsl(240_15%_8%)] text-white transition-[width] duration-300",
            collapsed && "collapsed"
          )}
        >
          <SidebarBody
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
            user={user}
            isAdmin={isAdmin}
            signOut={signOut}
            onOpenSearch={openSearch}
          />
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-20 grid h-6 w-6 place-items-center rounded-full border border-border bg-background text-foreground shadow-md transition hover:scale-110"
              aria-label="Expand sidebar"
            >
              <Menu className="h-3 w-3" />
            </button>
          )}
        </aside>

        {/* Page content — ONLY this scrolls */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};

const DashboardLayout = () => <DashboardShell />;

export default DashboardLayout;
