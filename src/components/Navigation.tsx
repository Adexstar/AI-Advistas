import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AdVista
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-foreground hover:text-primary transition-colors">
              About
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            ) : user ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>Dashboard</Button>
                <Button variant="hero" onClick={() => navigate("/dashboard")}>Go to App</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={handleAuthNavigation}>Sign In</Button>
                <Button variant="hero" onClick={handleAuthNavigation}>Get Started</Button>
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
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-foreground hover:text-primary transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-foreground hover:text-primary transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-foreground hover:text-primary transition-colors">
                About
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                ) : user ? (
                  <>
                    <Button variant="ghost" onClick={() => { navigate("/dashboard"); setIsOpen(false); }}>Dashboard</Button>
                    <Button variant="hero" onClick={() => { navigate("/dashboard"); setIsOpen(false); }}>Go to App</Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => { handleAuthNavigation(); setIsOpen(false); }}>Sign In</Button>
                    <Button variant="hero" onClick={() => { handleAuthNavigation(); setIsOpen(false); }}>Get Started</Button>
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