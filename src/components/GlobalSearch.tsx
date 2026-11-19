import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [campaignError, setCampaignError] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    supabase.from("campaigns").select("id, name").order("updated_at", { ascending: false }).limit(20).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setCampaigns([]);
        setCampaignError(error.message);
        return;
      }
      setCampaignError("");
      setCampaigns((data ?? []).filter((row) => row.name));
    });
    return () => { cancelled = true; };
  }, [open]);

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
      <CommandInput placeholder="Search pages and your campaigns" />
      <CommandList>
        <CommandEmpty>No matching pages or campaigns.</CommandEmpty>
        <CommandGroup heading="Your campaigns">
          {campaignError ? (
            <CommandItem disabled value="campaign-error">{campaignError}</CommandItem>
          ) : campaigns.length === 0 ? (
            <CommandItem disabled value="no-campaigns">No campaigns saved yet.</CommandItem>
          ) : campaigns.map((campaign) => (
            <CommandItem key={campaign.id} value={`${campaign.name} campaign`} onSelect={() => go(`/campaigns/${campaign.id}`)}>
              <Megaphone className="mr-2 h-4 w-4" />
              <span>{campaign.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
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
