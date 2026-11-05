import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImageIcon, Loader2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,720px)] w-[min(100vw-1.5rem,720px)] max-w-none flex-col gap-3 overflow-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Choose a template</DialogTitle>
          <DialogDescription>It is added to this ad. You stay here and can edit it or continue to the next step.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates"
            className="h-11 w-full rounded-[10px] border-[1.5px] border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading templates
            </div>
          )}
          {error && <p className="py-10 text-center text-sm text-destructive">Templates could not be loaded. Try again.</p>}
          {!isLoading && !error && templates.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No templates match that search.</p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                    {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <span className="block truncate px-2 py-2 text-xs font-medium">{template.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
