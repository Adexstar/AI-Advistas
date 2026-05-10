import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const navigationLinks = [
  { label: "Product", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Pricing", href: "#pricing" },
  { label: "Why AdVista", href: "#about" },
] as const;

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleAuthNavigation = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 pt-4">
      <div className="page-container rounded-full border border-white/45 bg-white/70 px-4 shadow-card backdrop-blur-2xl">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-3 text-left"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-base font-bold text-white shadow-glow">
                A
              </span>
              <span>
                <span className="block text-2xl font-bold tracking-[-0.04em] text-foreground">AdVista</span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Creative Ops Workspace</span>
              </span>
            </button>
          </div>
          
          <div className="hidden items-center rounded-full border border-border/70 bg-secondary/55 p-1 md:flex md:space-x-1">
            {navigationLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-foreground/78 transition-all duration-200 hover:bg-white hover:text-primary hover:shadow-sm"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center space-x-3 md:flex">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            ) : user ? (
              <>
                <Button variant="ghost" className="rounded-full text-foreground/75 hover:bg-secondary/70 hover:text-foreground" onClick={() => navigate("/dashboard")}>Dashboard</Button>
                <Button onClick={() => navigate("/dashboard")} className="rounded-full bg-gradient-primary px-5 text-white shadow-glow hover:opacity-95">Go to App</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="rounded-full text-foreground/75 hover:bg-secondary/70 hover:text-foreground" onClick={handleAuthNavigation}>Sign In</Button>
                <Button onClick={handleAuthNavigation} className="rounded-full bg-gradient-primary px-5 text-white shadow-glow hover:opacity-95">Get Started</Button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-border/70 py-4 md:hidden">
            <div className="flex flex-col space-y-4">
              {navigationLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-2xl px-3 py-2 text-foreground transition-colors hover:bg-secondary/70 hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col space-y-2 pt-4">
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                ) : user ? (
                  <>
                    <Button variant="ghost" className="rounded-full" onClick={() => { navigate("/dashboard"); setIsOpen(false); }}>Dashboard</Button>
                    <Button onClick={() => { navigate("/dashboard"); setIsOpen(false); }} className="rounded-full bg-gradient-primary text-white shadow-glow">Go to App</Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="rounded-full" onClick={() => { handleAuthNavigation(); setIsOpen(false); }}>Sign In</Button>
                    <Button onClick={() => { handleAuthNavigation(); setIsOpen(false); }} className="rounded-full bg-gradient-primary text-white shadow-glow">Get Started</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;