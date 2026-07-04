import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarSearchProps {
  onOpen?: () => void;
  className?: string;
  collapsed?: boolean;
}

export const SidebarSearch = ({ onOpen, className, collapsed }: SidebarSearchProps) => {
  if (collapsed) {
    return (
      <button
        onClick={onOpen}
        aria-label="Open search"
        className={cn(
          "grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors",
          className
        )}
      >
        <Search className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-xs text-white/50 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white/80",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">Search campaigns, templates, brands...</span>
      <kbd className="hidden shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white/60 sm:inline">
        ⌘K
      </kbd>
    </button>
  );
};

export default SidebarSearch;
