import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const navigationLinks = [
  { label: 'Product', href: '#features', detail: 'Operating lanes' },
  { label: 'Workflow', href: '#workflow', detail: 'Brief to launch' },
  { label: 'Pricing', href: '#pricing', detail: 'Plans for ad teams' },
  { label: 'Why AdVista', href: '#about', detail: 'Why teams switch' },
] as const;

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const appDestination = '/dashboard';

  const handleAuthNavigation = () => {
    if (user) {
      navigate(appDestination);
    } else {
      navigate('/auth');
    }

    setIsOpen(false);
  };

  const handleDashboardNavigation = () => {
    navigate(appDestination);
    setIsOpen(false);
  };

  const handleHomeNavigation = () => {
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 pt-4">
      <div className="page-container relative">
        <div className="rounded-[28px] border border-white/55 bg-white/74 px-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-2xl md:rounded-full">
          <div className="flex h-16 items-center justify-between gap-4 md:h-[72px]">
            <div className="flex items-center">
            <button
              type="button"
              onClick={handleHomeNavigation}
              className="flex items-center gap-3 text-left"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-base font-bold text-white shadow-glow md:h-11 md:w-11">
                A
              </span>
              <span className="hidden sm:block">
                <span className="block text-2xl font-bold tracking-[-0.04em] text-foreground">AdVista</span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Campaign Command Workspace</span>
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

            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-full border border-border/70 bg-white/70 px-3 py-2 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Launch workflow</p>
                <p className="text-sm font-medium text-foreground">Brief, creative, ops</p>
              </div>
              {loading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
              ) : user ? (
                <>
                  <Button variant="ghost" className="rounded-full text-foreground/75 hover:bg-secondary/70 hover:text-foreground" onClick={handleDashboardNavigation}>Dashboard</Button>
                  <Button onClick={handleDashboardNavigation} className="rounded-full bg-gradient-primary px-5 text-white shadow-glow hover:opacity-95">Open Workspace</Button>
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
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="rounded-2xl border border-border/70 bg-white/60"
                onClick={() => setIsOpen((current) => !current)}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {isOpen && (
            <div className="border-t border-border/70 pb-4 pt-4 md:hidden">
              <div className="space-y-4 rounded-[28px] border border-border/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.1),_transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-4 shadow-card">
                <div className="rounded-[24px] border border-border/70 bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Public chrome</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">Built for launch teams</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Move from the product story into the workspace without the mobile nav feeling like an afterthought.</p>
                </div>

                <div className="grid gap-2">
                  {navigationLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="flex items-center justify-between rounded-[22px] border border-border/70 bg-white/70 px-4 py-3 text-left transition-all duration-200 hover:border-primary/20 hover:bg-white"
                      onClick={() => setIsOpen(false)}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.detail}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>

                <div className="grid gap-2 pt-1">
                  {loading ? (
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                  ) : user ? (
                    <>
                      <Button variant="ghost" className="rounded-full border border-border/70 bg-white/70" onClick={handleDashboardNavigation}>Dashboard</Button>
                      <Button onClick={handleDashboardNavigation} className="rounded-full bg-gradient-primary text-white shadow-glow">Open Workspace</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" className="rounded-full border border-border/70 bg-white/70" onClick={handleAuthNavigation}>Sign In</Button>
                      <Button onClick={handleAuthNavigation} className="rounded-full bg-gradient-primary text-white shadow-glow">Get Started</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;