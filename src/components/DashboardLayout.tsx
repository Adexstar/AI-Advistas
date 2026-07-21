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
import { AIStatusProvider } from "@/contexts/AIStatusContext";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
  notify?: number;
};

type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    title: "Creative Workspace",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Campaigns", href: "/campaigns", icon: Megaphone },
      { name: "Create Ad", href: "/create", icon: Plus },
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
      { name: "Export Center", href: "/exports", icon: Download },
      { name: "Integrations Hub", href: "/integrations", icon: Plug },
      { name: "Notifications", href: "/notifications", icon: Bell, notify: 4 },
      { name: "Automation Center", href: "/automation", icon: Zap },
      { name: "Team Workspace", href: "/team", icon: Users },
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
            <span className="flex-1 truncate">{item.name}</span>
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
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.name}</span>
          {item.notify ? <NotifyBadge count={item.notify} variant="unread" /> : null}
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
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b border-white/10 px-4", collapsed && "justify-center px-2")}>
          <NavLink to="/dashboard" onClick={close} className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-white">AdVista</p>
                <p className="truncate text-[11px] font-medium text-white/50">Advertising Studio</p>
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

        {/* Search */}
        <div className={cn("px-4 pt-4", collapsed && "flex justify-center px-2")}>
          <SidebarSearch onOpen={onOpenSearch} collapsed={collapsed} />
        </div>

        {/* Create button */}
        <div className={cn("px-4 pt-3", collapsed && "px-2")}>
          {collapsed ? (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button asChild size="icon" className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] shadow-lg hover:opacity-90">
                  <NavLink to="/create" onClick={close} aria-label="Create Ad">
                    <Plus className="h-5 w-5" />
                  </NavLink>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Create Ad</TooltipContent>
            </Tooltip>
          ) : (
            <Button asChild className="h-11 w-full justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] text-base font-semibold shadow-lg hover:opacity-90">
              <NavLink to="/create" onClick={close}>
                <Plus className="h-4 w-4" />
                Create Ad
              </NavLink>
            </Button>
          )}
        </div>

        {/* Nav groups */}
        <nav className={cn("min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4 pt-5", collapsed && "px-2")}>
          {navGroups.map((group, idx) => (
            <div key={group.title} className={cn("space-y-1", idx > 0 && "border-t border-white/10 pt-4")}>
              {!collapsed && (
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => (
                <NavItemRow key={item.name} item={item} collapsed={collapsed} onNavigate={close} />
              ))}
              {group.title === "Account" && isAdmin && (
                <NavItemRow
                  item={{ name: "Admin", href: "/admin", icon: Shield }}
                  collapsed={collapsed}
                  onNavigate={close}
                />
              )}
            </div>
          ))}

          {/* Usage Widget */}
          {!collapsed && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-white">Usage this month</p>
                <Badge className="h-5 rounded-full bg-primary/20 px-2 text-[10px] text-primary-foreground hover:bg-primary/20">{planLabel}</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-white/60">
                    <span>Storage</span>
                    <span>3.2 / 10 GB</span>
                  </div>
                  <Progress value={32} className="h-1.5 bg-white/10" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-white/60">
                    <span>Campaigns</span>
                    <span>12 / ∞</span>
                  </div>
                  <Progress value={60} className="h-1.5 bg-white/10" />
                </div>
              </div>
              <Button asChild size="sm" className="mt-4 h-8 w-full rounded-lg bg-white text-primary hover:bg-white/90">
                <NavLink to="/billing" onClick={close}>Upgrade Plan</NavLink>
              </Button>
            </div>
          )}
        </nav>

        {/* User card */}
        <div className={cn("border-t border-white/10 p-3", collapsed && "p-2")}>
          {collapsed ? (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <button
                  onClick={signOut}
                  className="grid h-10 w-full place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] text-xs font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                <p className="truncate text-[11px] text-white/50">{planLabel}</p>
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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <div className="flex min-h-0 w-full flex-1 overflow-hidden">

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


        {/* Desktop sidebar */}
        <aside
          className={cn(
            "hidden h-full shrink-0 overflow-y-auto border-r border-white/5 bg-[hsl(240_15%_8%)] text-white transition-[width] duration-300 lg:flex lg:flex-col",
            collapsed ? "w-[76px]" : "w-[260px]"
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

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1 px-2 flex items-center justify-center">
              <AIContextBar />
            </div>
            <Button size="icon" className="h-9 w-9 rounded-xl" asChild>
              <NavLink to="/create" aria-label="Create Ad">
                <Plus className="h-4 w-4" />
              </NavLink>
            </Button>
          </header>

          {/* Desktop header */}
          <header className="sticky top-0 z-20 hidden h-16 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur-xl lg:flex">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">{activePage.title}</h2>
              <p className="truncate text-xs text-muted-foreground">{activePage.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <AIContextBar />
              <button
                onClick={openSearch}
                className="flex h-10 w-64 items-center gap-2 rounded-xl border border-border bg-card px-3 text-left text-sm text-muted-foreground transition hover:border-primary/40"
              >
                <span className="flex-1 truncate">Search anything…</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
              </button>
              <Button asChild variant="outline" size="icon" className="relative h-10 w-10 rounded-xl">
                <NavLink to="/notifications" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-1 -top-1"><NotifyBadge count={4} variant="unread" /></span>
                </NavLink>
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 pb-24 lg:px-6 lg:py-8 lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

const DashboardLayout = () => (
  <AIStatusProvider>
    <DashboardShell />
  </AIStatusProvider>
);

export default DashboardLayout;
