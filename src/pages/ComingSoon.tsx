import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

interface ComingSoonProps {
  title?: string;
  description?: string;
  eta?: string;
}

const ComingSoon = ({
  title = "Coming Soon",
  description = "This module is currently under development.",
  eta,
}: ComingSoonProps) => {
  return (
    <div className="page-container py-6 md:py-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm md:p-14">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] text-white shadow-lg">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground md:text-base">
          {description}
        </p>
        {eta && (
          <p className="mt-4 inline-block rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
            ETA: {eta}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <NavLink to="/dashboard">Back to Dashboard</NavLink>
          </Button>
          <Button asChild>
            <NavLink to="/create">Create an Ad</NavLink>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
