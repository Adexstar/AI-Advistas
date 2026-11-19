import { Sparkles } from "lucide-react";

/** Full-screen hold for auth and lazy routes. It keeps the app surface instead of a blank spinner. */
export function RouteLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-live="polite" data-loading="route">
      <div className="flex flex-col items-center gap-3">
        <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
          <Sparkles className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[hsl(30_95%_55%)] ring-[3px] ring-background" />
        </div>
        <p className="text-sm text-muted-foreground">Opening AdVista</p>
        <div className="adv-shimmer h-1.5 w-28 rounded-full border border-border/60" />
      </div>
    </div>
  );
}
