import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">That page is not in AdVista</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {location.pathname} does not match a page. Check the address, or go back to a page that exists.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/">Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
