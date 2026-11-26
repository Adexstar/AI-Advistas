import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { isMobileBrowser } from "@/lib/mobileBrowser";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Home, LayoutDashboard, Megaphone, LayoutTemplate, MoreHorizontal, Clapperboard,
  CreditCard, Settings, LogOut, Palette, PenTool, ImageIcon, BarChart3, Plus,
} from "lucide-react";

// Dashboard lives in More so Ad Studio can take its place in the bar.
const items = [
  { name: "Create", href: "/create", icon: Home, primary: true },
  { name: "Ad Studio", href: "/ad-studio", icon: Clapperboard },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Templates", href: "/templates", icon: LayoutTemplate },
];

const moreLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Create Ad", href: "/create-ad", icon: Plus },
  { name: "Visual Editor", href: "/visual-editor", icon: PenTool },
  { name: "Brand Kit", href: "/brand-kit", icon: Palette },
  { name: "Media Library", href: "/media-library", icon: ImageIcon },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Plans", href: "/billing", icon: CreditCard },
];

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const mobileBrowser = useState(isMobileBrowser)[0];

  useEffect(() => {
    document.documentElement.classList.toggle("mobile-browser", mobileBrowser);
    return () => document.documentElement.classList.remove("mobile-browser");
  }, [mobileBrowser]);

  if (!mobileBrowser) return null;
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Profile";

  return (
    <>
      <nav className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden"
      )}>
        <div className="grid w-full grid-cols-5 items-end px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/create" && pathname.startsWith(item.href));
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/create"}
                aria-label={item.name}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium",
                  active || (item.primary && pathname === "/create") ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className={cn(
                  "grid h-8 w-8 place-items-center",
                  item.primary && "rounded-full bg-primary text-primary-foreground",
                )}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            aria-label="More"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium",
              moreOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className="grid h-8 w-8 place-items-center">
              <MoreHorizontal className="h-5 w-5" />
            </span>
            <span className="truncate">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle>More</SheetTitle>
            <SheetDescription>{displayName}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 grid gap-2">
            {moreLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.href}
                  variant="outline"
                  className="justify-start"
                  onClick={() => { setMoreOpen(false); navigate(link.href); }}
                >
                  <Icon className="mr-2 h-4 w-4" /> {link.name}
                </Button>
              );
            })}
            <Button variant="outline" className="justify-start" onClick={() => { setMoreOpen(false); void signOut(); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileBottomNav;
