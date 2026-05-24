import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { 
  ChevronRight,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Menu,
  PanelRightOpen,
  Plus,
  Settings,
  Sparkles,
  Target,
  LogOut,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();

  const mainNavigation = [
    { 
      name: "Home", 
      href: "/dashboard", 
      icon: LayoutDashboard,
      description: "Your command center and next steps"
    },
    { 
      name: "Create Ad", 
      href: "/create", 
      icon: Plus,
      description: "Launch a new ad instantly using AI Quick Draft"
    },
    {
      name: "Library",
      href: "/template-library",
      icon: FolderKanban,
      description: "Browse reusable creative assets and templates"
    },
    { 
      name: "Campaigns", 
      href: "/campaigns", 
      icon: Target,
      description: "Manage, pause, or edit all running and past ads"
    }
  ];

  const secondaryNavigation = [
    { name: "Visual Editor", href: "/visual-editor", icon: PanelRightOpen },
    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Settings", href: "/settings", icon: Settings }
  ];

  const adminNavigation = isAdmin
    ? [{ name: "Admin", href: "/admin", icon: Shield }]
    : [];

  const pageMeta = [
    {
      match: (path: string) => path.startsWith("/dashboard"),
      title: "Home",
      description: "See what needs attention, continue work, and launch faster."
    },
    {
      match: (path: string) => path.startsWith("/create") || path.startsWith("/ad-editor"),
      title: "Create",
      description: "Move from idea to launch in one guided workspace."
    },
    {
      match: (path: string) => path.startsWith("/template-library") || path.startsWith("/template-customizer"),
      title: "Library",
      description: "Find proven creative assets, then customize what fits your goal."
    },
    {
      match: (path: string) => path.startsWith("/campaigns"),
      title: "Campaigns",
      description: "Track performance, fix issues, and act without losing context."
    },
    {
      match: (path: string) => path.startsWith("/visual-editor"),
      title: "Advanced Tools",
      description: "Use deeper creative controls when the quick path is not enough."
    },
    {
      match: (path: string) => path.startsWith("/billing"),
      title: "Billing",
      description: "Manage plans, credits, and payment settings."
    },
    {
      match: (path: string) => path.startsWith("/settings"),
      title: "Settings",
      description: "Control preferences, account details, and workspace defaults."
    },
    {
      match: (path: string) => path.startsWith("/admin"),
      title: "Admin",
      description: "Manage roles, templates, and advanced workspace controls."
    }
  ];

  const activePage =
    pageMeta.find((item) => item.match(location.pathname)) || pageMeta[0];
  const showCreateFab =
    !location.pathname.startsWith("/create") &&
    !location.pathname.startsWith("/ad-editor");

  const getNavClassName = (isActive: boolean) =>
    cn(
      "group flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200",
      isActive
        ? "bg-gradient-primary text-primary-foreground shadow-glow"
        : "text-white/72 hover:bg-white/10 hover:text-white"
    );

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-16 items-center justify-between border-b border-white/10 px-6 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white font-bold text-primary-800 shadow-lg">A</div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Workspace</p>
            <h1 className="truncate text-xl font-semibold text-white">AdVista</h1>
          </div>
        </div>
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <div className="px-4 pt-4">
        <Button className="h-11 w-full justify-center rounded-2xl bg-white text-primary-800 shadow-lg hover:bg-white/92" asChild>
          <NavLink to="/create" onClick={() => setSidebarOpen(false)}>
            <Plus className="h-4 w-4" />
            Create Ad
          </NavLink>
        </Button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Main</p>
          <ul className="space-y-2">
            {mainNavigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) => cn(getNavClassName(isActive))}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="line-clamp-2 text-xs opacity-80">{item.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5" />
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">More</p>
          <ul className="space-y-2">
            {secondaryNavigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) => cn(getNavClassName(isActive))}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                  </div>
                </NavLink>
              </li>
            ))}
            {adminNavigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) => cn(getNavClassName(isActive))}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                  </div>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
            <Sparkles className="h-4 w-4 text-accent" />
            Guided workspace
          </div>
          <p className="text-sm leading-6 text-white/65">
            Start from AI, templates, or scratch. The rest of the workflow stays in one place.
          </p>
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl text-white/72 hover:bg-white/10 hover:text-white"
          onClick={signOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <div className="page-aura flex w-full text-left">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="w-[min(20rem,calc(100vw-1rem))] border-r-0 bg-transparent p-0 shadow-none [&>button]:hidden lg:hidden"
          >
            <aside className="flex h-full w-full flex-col border-r border-white/10 bg-gradient-to-b from-primary-900 via-primary-800 to-[hsl(247_52%_19%/.98)] text-white backdrop-blur-sm">
              {renderSidebarContent(true)}
            </aside>
          </SheetContent>
        </Sheet>

        <aside className="hidden min-h-screen w-72 shrink-0 border-r border-white/10 bg-gradient-to-b from-primary-900 via-primary-800 to-[hsl(247_52%_19%/.98)] text-white backdrop-blur-sm lg:flex lg:flex-col">
          {renderSidebarContent()}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-16 items-center justify-between border-b border-border/70 bg-white/60 px-4 backdrop-blur-xl lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Workspace</p>
            <h1 className="truncate text-sm font-semibold text-foreground">{activePage.title}</h1>
          </div>
          <Button size="icon" className="h-9 w-9 rounded-xl" asChild>
            <NavLink to="/create">
              <Plus className="h-4 w-4" />
            </NavLink>
          </Button>
        </header>

        <header className="hidden items-center justify-between gap-6 border-b border-border/70 bg-white/55 px-6 py-5 backdrop-blur-xl xl:px-8 lg:flex">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">AdVista Workspace</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{activePage.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{activePage.description}</p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Button variant="outline" className="rounded-2xl border-border/70 bg-white/70 text-muted-foreground hover:bg-white hover:text-foreground">
              Quick actions
            </Button>
            <Button className="rounded-2xl h-11 px-5" asChild>
              <NavLink to="/create">
                <Plus className="h-4 w-4" />
                Create Ad
              </NavLink>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 w-full min-w-0 overflow-x-hidden overflow-y-auto bg-transparent py-4 lg:py-6">
          <Outlet />
        </main>

        {showCreateFab ? (
          <Button className="fab-action touch-target rounded-full px-5 lg:hidden" asChild>
            <NavLink to="/create" aria-label="Create Ad">
              <Plus className="h-4 w-4" />
              Create Ad
            </NavLink>
          </Button>
        ) : null}
      </div>
      </div>
    </div>
  );
};

export default DashboardLayout;