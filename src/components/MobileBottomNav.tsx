import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Megaphone,
  LayoutTemplate,
  MoreHorizontal,
  Plus,
  PenTool,
  Palette,
  ImageIcon,
  BarChart3,
  Download,
  Plug,
  Bell,
  Zap,
  Users,
  Settings,
  CreditCard,
  Store,
  Code2,
} from "lucide-react";

const primary = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Create", href: "/create-ad", icon: Plus, primary: true },
  { name: "Templates", href: "/template-library", icon: LayoutTemplate },
];

const groups = [
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
      { name: "Export Center", href: "/exports", icon: Download },
      { name: "Integrations Hub", href: "/integrations", icon: Plug },
      { name: "Notifications", href: "/notifications", icon: Bell },
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
      { name: "Asset Marketplace", href: "#", icon: Store, badge: "Soon" as const, disabled: true },
      { name: "Developer Center", href: "#", icon: Code2, badge: "Soon" as const, disabled: true },
    ],
  },
];

const MobileBottomNav = () => {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-end justify-between px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            if (item.primary) {
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className="grid h-12 w-12 -translate-y-3 place-items-center rounded-full bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] text-white shadow-lg"
                  aria-label="Create"
                >
                  <Icon className="h-5 w-5" />
                </NavLink>
              );
            }
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium",
              moreOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="text-left">All modules</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 p-4 pb-8">
            {groups.map((g) => (
              <div key={g.title}>
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {g.title}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {g.items.map((it: any) => {
                    const Icon = it.icon;
                    if (it.disabled) {
                      return (
                        <div
                          key={it.name}
                          className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-3 py-3 text-sm opacity-70"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{it.name}</span>
                          {it.badge && (
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              {it.badge}
                            </span>
                          )}
                        </div>
                      );
                    }
                    return (
                      <NavLink
                        key={it.name}
                        to={it.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 text-sm transition hover:border-primary/50 hover:bg-primary/5"
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="min-w-0 flex-1 truncate">{it.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileBottomNav;
