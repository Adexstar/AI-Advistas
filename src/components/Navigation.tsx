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
    <nav className="fixed left-0 right-0 top-0 z-50 pt-6">
      <div className="page-container relative">
        <div className="flex h-16 w-full min-w-0 items-center gap-2 rounded-full border border-border bg-card/85 px-3 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-2xl md:h-[72px] md:px-4">
          <button type="button" onClick={handleHomeNavigation} className="flex min-w-0 shrink-0 items-center gap-3 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-lg font-bold text-primary-foreground shadow-glow md:h-11 md:w-11">
              A
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-2xl font-bold tracking-[-0.04em] text-foreground">AdVista</span>
              <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Campaign Command Workspace</span>
            </span>
          </button>

          <div className="hidden min-w-0 flex-1 items-center justify-center px-2 lg:flex">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border/70 bg-secondary/55 p-1 [scrollbar-width:none]">
              {navigationLinks.map((link) => (
                <a key={link.label} href={link.href} className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-foreground/78 transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:shadow-sm xl:px-4">
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-3">
            <div className="hidden rounded-full border border-border/70 bg-card/60 px-3 py-2 text-right xl:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Launch workflow</p>
              <p className="text-sm font-medium text-foreground">Brief, creative, ops</p>
            </div>
            {loading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
            ) : user ? (
              <>
                <Button variant="ghost" className="rounded-full text-foreground/75 hover:bg-secondary/70 hover:text-foreground" onClick={handleDashboardNavigation}>Dashboard</Button>
                <Button onClick={handleDashboardNavigation} className="rounded-full bg-gradient-primary px-5 text-primary-foreground shadow-glow hover:opacity-95">Open Workspace</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="rounded-full text-foreground/75 hover:bg-secondary/70 hover:text-foreground" onClick={handleAuthNavigation}>Sign In</Button>
                <Button onClick={handleAuthNavigation} className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow">Get Started</Button>
              </>
            )}
          </div>

          <Button variant="ghost" size="icon" aria-expanded={isOpen} aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'} className="ml-auto shrink-0 rounded-xl border border-border/70 bg-card/60 lg:hidden" onClick={() => setIsOpen((current) => !current)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isOpen && (
          <div className="pt-3 lg:hidden">
            <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-card">
              <div className="rounded-xl border border-border/70 bg-card/85 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Public chrome</p>
                <p className="mt-2 text-lg font-semibold text-foreground">Built for launch teams</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Move from the product story into the workspace without the mobile nav feeling like an afterthought.</p>
              </div>

              <div className="grid gap-2">
                {navigationLinks.map((link) => (
                  <a key={link.label} href={link.href} className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 px-4 py-3 text-left transition-all duration-200 hover:border-primary/20 hover:bg-primary/10" onClick={() => setIsOpen(false)}>
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
                    <Button variant="ghost" className="rounded-full border border-border/70 bg-card/60" onClick={handleDashboardNavigation}>Dashboard</Button>
                    <Button onClick={handleDashboardNavigation} className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow">Open Workspace</Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="rounded-full border border-border/70 bg-card/60" onClick={handleAuthNavigation}>Sign In</Button>
                    <Button onClick={handleAuthNavigation} className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow">Get Started</Button>
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