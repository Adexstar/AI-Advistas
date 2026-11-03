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
      <Icon className="h-12 w-12 text-[#FF9455]" strokeWidth={1.5} />
      <h1 className="mt-5 text-[22px] font-extrabold text-[#111827]">{title}</h1>
      <span className="mt-3 rounded-[10px] bg-[rgba(244,123,53,0.15)] px-1.5 py-[2px] text-[9px] font-bold tracking-wide text-[#FF9455]">
        COMING SOON
      </span>
      <p className="mt-4 max-w-sm text-[13px] text-[#9CA3AF]">{description}</p>
      <Button
        variant="outline"
        onClick={notifyMe}
        disabled={notified}
        className="mt-6 border-[#FF9455] text-[#FF9455] hover:bg-[rgba(244,123,53,0.08)] hover:text-[#FF9455]"
      >
        {notified ? "We'll notify you" : "Notify me when ready"}
      </Button>
    </div>
  );
};

export default ComingSoonState;
