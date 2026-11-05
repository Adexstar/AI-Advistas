import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ComingSoonStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  storageKey?: string;
}

const ComingSoonState = ({ icon: Icon, title, description, storageKey }: ComingSoonStateProps) => {
  const key = storageKey ?? `advista:notify:${title.toLowerCase().replace(/\s+/g, "-")}`;
  const [notified, setNotified] = useState(() => {
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });

  const notifyMe = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    setNotified(true);
    toast.success(`We'll let you know when ${title} is ready.`);
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <Icon className="h-12 w-12 text-primary" strokeWidth={1.5} />
      <h1 className="mt-5 text-[22px] font-extrabold text-foreground">{title}</h1>
      <span className="mt-3 rounded-[10px] bg-primary/15 px-1.5 py-[2px] text-[9px] font-bold tracking-wide text-primary">
        COMING SOON
      </span>
      <p className="mt-4 max-w-sm text-[13px] text-muted-foreground">{description}</p>
      <Button
        variant="outline"
        onClick={notifyMe}
        disabled={notified}
        className="mt-6"
      >
        {notified ? "We'll notify you" : "Notify me when ready"}
      </Button>
    </div>
  );
};

export default ComingSoonState;
