import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Megaphone,
  LayoutTemplate,
  ImageIcon,
  Palette,
  Bell,
  Settings,
  Sparkles,
  Plug,
  BarChart3,
} from "lucide-react";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const groups = [
  {
    heading: "Navigate",
    items: [
      { icon: Megaphone, label: "Campaigns", path: "/campaigns" },
      { icon: Sparkles, label: "Create Ad", path: "/create-ad" },
      { icon: LayoutTemplate, label: "Templates", path: "/templates" },
      { icon: ImageIcon, label: "Visual Editor", path: "/visual-editor" },
      { icon: ImageIcon, label: "Media Library", path: "/media-library" },
      { icon: Palette, label: "Brand Kit", path: "/brand-kit" },
      { icon: BarChart3, label: "Analytics", path: "/analytics" },
      { icon: Plug, label: "Integrations", path: "/integrations" },
      { icon: Settings, label: "Settings", path: "/settings" },
      { icon: Bell, label: "Billing", path: "/billing" },
    ],
  },
];

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search campaigns, templates, brands, decisions..." />
      <CommandList>
        <CommandEmpty>No matching pages.</CommandEmpty>
        {groups.map((g, i) => (
          <div key={g.heading}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={g.heading}>
              {g.items.map((it) => {
                const Icon = it.icon;
                return (
                  <CommandItem key={it.label} onSelect={() => go(it.path)}>
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{it.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
