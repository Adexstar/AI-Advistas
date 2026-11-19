import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImageIcon, Loader2, Search } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export type PickerTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  template_json: Record<string, unknown> | null;
  width: number | null;
  height: number | null;
};

/** Half-screen by default; drag up toward full height while the form stays in view. */
const SNAP_HALF = 0.52;
const SNAP_FULL = 0.92;

export function CreateAdTemplatePicker({
  open,
  onOpenChange,
  onSelect,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: PickerTemplate) => void;
  busy: boolean;
}) {
  const [query, setQuery] = useState('');
  const [snap, setSnap] = useState<number | string | null>(SNAP_HALF);

  const { data, isLoading, error } = useQuery({
    queryKey: ['create-ad-templates'],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('id,name,description,category,preview_url,thumbnail_url,template_json,width,height')
        .eq('is_active', true)
        .order('popularity_score', { ascending: false })
        .limit(80);
      if (error) throw error;
      return (data ?? []) as PickerTemplate[];
    },
  });

  const templates = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((template) =>
      `${template.name} ${template.description ?? ''} ${template.category ?? ''}`.toLowerCase().includes(term),
    );
  }, [data, query]);

  const atHalf = snap === SNAP_HALF;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (next) setSnap(SNAP_HALF);
        else setQuery('');
        onOpenChange(next);
      }}
      shouldScaleBackground={false}
      snapPoints={[SNAP_HALF, SNAP_FULL]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <DrawerContent
        overlayClassName="bg-black/40"
        className={cn(
          'flex h-full max-h-[97vh] flex-col gap-0 overflow-hidden rounded-t-2xl border-border bg-background p-0',
          '[&>div:first-child]:mt-3 [&>div:first-child]:h-1.5 [&>div:first-child]:w-12 [&>div:first-child]:bg-muted-foreground/30',
        )}
      >
        <DrawerHeader className="shrink-0 gap-1 border-b border-border/60 px-4 pb-3 pt-1 text-left sm:px-5">
          <DrawerTitle className="text-base font-semibold tracking-tight">Choose a template</DrawerTitle>
          <DrawerDescription className="text-xs sm:text-sm">
            {atHalf
              ? 'Drag up for more templates. Your ad stays visible above.'
              : 'Pick a template to add it to this ad.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="shrink-0 px-4 pb-3 pt-3 sm:px-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates"
              className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-5">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading templates
            </div>
          )}
          {error && (
            <p className="py-10 text-center text-sm text-destructive">Templates could not be loaded. Try again.</p>
          )}
          {!isLoading && !error && templates.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No templates match that search.</p>
          )}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {templates.map((template) => {
              const src = template.thumbnail_url || template.preview_url;
              return (
                <button
                  key={template.id}
                  type="button"
                  disabled={busy}
                  onClick={() => onSelect(template)}
                  className="overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-primary disabled:opacity-60"
                >
                  <div className="flex aspect-square items-center justify-center bg-muted/40">
                    {src ? (
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <span className="block truncate px-2 py-2 text-xs font-medium">{template.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
