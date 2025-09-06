import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Target, 
  Plus, 
  Users, 
  CreditCard, 
  Layout, 
  Settings,
  Menu,
  X,
  LogOut,
  Video
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Campaigns", href: "/campaigns", icon: Target },
    { name: "Create Ad", href: "/create-ad", icon: Plus },
    { name: "AI Video Generator", href: "/ai-video-generator", icon: Video },
    { name: "Audience", href: "/audience", icon: Users },
    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Ad Simulator", href: "/ad-simulator", icon: Layout },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActivePath = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AdVista
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) => cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-border">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={signOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-card border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
            AdVista
          </h1>
          <div className="w-8" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;