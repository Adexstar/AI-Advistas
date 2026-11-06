import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { isMobileBrowser } from "@/lib/mobileBrowser";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LayoutDashboard, Megaphone, LayoutTemplate, Plus } from "lucide-react";

const items = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Create", href: "/create-ad", icon: Plus, primary: true },
  { name: "Templates", href: "/templates", icon: LayoutTemplate },
];

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const mobileBrowser = useState(isMobileBrowser)[0];

  useEffect(() => {
    document.documentElement.classList.toggle("mobile-browser", mobileBrowser);
    return () => document.documentElement.classList.remove("mobile-browser");
  }, [mobileBrowser]);

  if (!mobileBrowser) return null;
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Profile";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <nav className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden"
      )}>
        <div className="grid w-full grid-cols-5 items-end px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-3">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            if (item.primary) {
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  aria-label={item.name}
                  className="flex flex-col items-center gap-0.5 pb-1.5 text-[10px] font-medium text-primary"
                >
                  <span className="grid h-12 w-12 -translate-y-2 place-items-center rounded-full bg-primary text-white shadow-[0_8px_18px_rgba(110,86,245,0.28)]">
                    <Plus className="h-5 w-5" />
                  </span>
                  <span>Create</span>
                </NavLink>
              );
            }
            return (
              <NavLink
                key={item.name}
                to={item.href}
                aria-label={item.name}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className="grid h-8 w-8 place-items-center">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            aria-label="Profile"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen(true)}
            className={cn(
              "flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium",
              profileOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold",
                profileOpen ? "bg-primary text-white" : "bg-primary/15 text-primary"
              )}
            >
              {initial}
            </span>
            <span className="truncate">Profile</span>
          </button>
        </div>
      </nav>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="items-center text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-dashed border-current/30 text-lg font-semibold text-muted-foreground">
              {initial}
            </span>
            <SheetTitle>Profile</SheetTitle>
            <SheetDescription>
              This profile is empty.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileBottomNav;
