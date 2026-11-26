import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { FolderOpen, LayoutTemplate, Megaphone } from "lucide-react";
import { editorStartUrl } from "@/lib/designHome";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CampaignHit = { id: string; name: string };
type DesignHit = { id: string; name: string };
type TemplateHit = { id: string; name: string };

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignHit[]>([]);
  const [designs, setDesigns] = useState<DesignHit[]>([]);
  const [templates, setTemplates] = useState<TemplateHit[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [campaignRes, designRes, templateRes] = await Promise.all([
          supabase.from("campaigns").select("id, name").order("updated_at", { ascending: false }).limit(40),
          user?.id
            ? supabase.from("ads").select("id, name").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(40)
            : Promise.resolve({ data: [] as DesignHit[], error: null }),
          supabase.from("templates").select("id, name").eq("is_active", true).order("popularity_score", { ascending: false }).limit(40),
        ]);
        if (cancelled) return;
        const firstError = campaignRes.error || designRes.error || templateRes.error;
        if (firstError) {
          setError(firstError.message);
          setCampaigns([]);
          setDesigns([]);
          setTemplates([]);
          return;
        }
        setError("");
        setCampaigns((campaignRes.data ?? []).filter((row) => row.name));
        setDesigns((designRes.data ?? []).filter((row) => row.name));
        setTemplates((templateRes.data ?? []).filter((row) => row.name));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Search failed");
      }
    })();
    return () => { cancelled = true; };
  }, [open, user?.id]);

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

  const needle = query.trim().toLowerCase();
  const match = (name: string) => !needle || name.toLowerCase().includes(needle);
  const campaignHits = campaigns.filter((item) => match(item.name)).slice(0, 8);
  const designHits = designs.filter((item) => match(item.name)).slice(0, 8);
  const templateHits = templates.filter((item) => match(item.name)).slice(0, 8);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search templates, designs, or campaigns"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{error || "No matching templates, designs, or campaigns."}</CommandEmpty>

        <CommandGroup heading="Templates">
          {templateHits.length === 0 ? (
            <CommandItem disabled value="no-templates">No templates match</CommandItem>
          ) : templateHits.map((item) => (
            <CommandItem key={item.id} value={`template ${item.name}`} onSelect={() => go(`/visual-editor?template=${encodeURIComponent(item.id)}`)}>
              <LayoutTemplate className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Your designs">
          {designHits.length === 0 ? (
            <CommandItem disabled value="no-designs">No designs match</CommandItem>
          ) : designHits.map((item) => (
            <CommandItem key={item.id} value={`design ${item.name}`} onSelect={() => go(editorStartUrl({ adId: item.id }))}>
              <FolderOpen className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Campaigns">
          {campaignHits.length === 0 ? (
            <CommandItem disabled value="no-campaigns">No campaigns match</CommandItem>
          ) : campaignHits.map((item) => (
            <CommandItem key={item.id} value={`campaign ${item.name}`} onSelect={() => go(`/campaigns/${item.id}`)}>
              <Megaphone className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
