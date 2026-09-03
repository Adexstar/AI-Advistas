/**
 * /admin/templates/gallery — browse, preview, open in editor and approve
 * imported templates. `is_active` is the approval gate: imports land pending,
 * approving publishes them to the user-facing /templates library.
 */
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Download, Check, X, Sparkles, Loader2, ImageIcon, Eye, Pencil,
} from 'lucide-react';
import { TemplatePreviewDialog } from '@/components/templates/TemplatePreviewDialog';
import {
  useAdminTemplates, useReviewTemplates, type AdminTemplate,
} from '@/hooks/useAdminTemplates';
import { useImportStockTemplates, useSeedStarterPack, useStockSearch } from '@/hooks/useStockTemplateImport';
import type { StockItem, StockProvider } from '@/services/templates/StockImportService';
import { setPendingEditorTemplate } from '@/lib/templateEditorSession';
import type { TemplateRecord } from '@/services/templates/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CATEGORIES = ['Beauty', 'Fashion', 'Restaurant & Food', 'Fitness', 'Real Estate', 'SaaS & Technology', 'E-commerce'];

const providerLabel = (s: string) =>
  s === 'pexels' ? 'Pexels' : s === 'freepik' ? 'Freepik' : s;

const Thumb = ({ src, alt }: { src?: string | null; alt: string }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted">
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-square w-full rounded-lg object-cover"
    />
  );
};

export default function AdminTemplateGallery() {
  const navigate = useNavigate();
  const { data: templates = [], isLoading } = useAdminTemplates();
  const review = useReviewTemplates();

  const stockSearch = useStockSearch();
  const importStock = useImportStockTemplates();
  const seedPack = useSeedStarterPack();

  const [tab, setTab] = useState('pending');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<AdminTemplate | null>(null);

  // Import panel state
  const [importQuery, setImportQuery] = useState('');
  const [providers, setProviders] = useState<StockProvider[]>(['freepik', 'pexels']);
  const [importCategory, setImportCategory] = useState<string>('none');
  const [results, setResults] = useState<StockItem[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const pending = useMemo(() => templates.filter((t) => !t.is_active), [templates]);
  const approved = useMemo(() => templates.filter((t) => t.is_active), [templates]);

  const list = useMemo(() => {
    const base = tab === 'pending' ? pending : approved;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((t) => `${t.name} ${t.category ?? ''} ${t.source}`.toLowerCase().includes(q));
  }, [tab, pending, approved, query]);

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const openInEditor = (t: AdminTemplate) => {
    setPendingEditorTemplate(t as unknown as TemplateRecord, 'library');
    navigate(`/visual-editor?template=${t.id}`);
  };

  const decide = (ids: string[], decision: 'approved' | 'rejected') => {
    if (!ids.length) return;
    review.mutate({ ids, decision }, { onSuccess: () => setSelected(new Set()) });
  };

  const runSearch = () => {
    const q = importQuery.trim();
    if (!q) return toast.error('Enter a search term');
    if (!providers.length) return toast.error('Pick at least one provider');
    stockSearch.mutate(
      { query: q, providers, limit: 20 },
      {
        onSuccess: (r) => {
          setResults(r.results);
          setPicked(new Set());
          if (!r.results.length) toast.info('No results — try another term');
        },
      },
    );
  };

  const togglePicked = (key: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const importPicked = () => {
    const items = results.filter((r) => picked.has(`${r.provider}:${r.source_id}`));
    if (!items.length) return toast.error('Select at least one asset');
    importStock.mutate(
      { items, category: importCategory === 'none' ? null : importCategory },
      { onSuccess: () => { setPicked(new Set()); setTab('pending'); } },
    );
  };

  const toggleProvider = (p: StockProvider) =>
    setProviders((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  return (
    <div className="space-y-6">
      {/* Import panel */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Import from providers</h2>
              <p className="text-sm text-muted-foreground">
                Search Freepik and Pexels. Imports land as pending until you approve them.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => seedPack.mutate({ providers, perQuery: 5 })}
              disabled={seedPack.isPending}
            >
              {seedPack.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Seed starter pack
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={importQuery}
                onChange={(e) => setImportQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="e.g. skincare product photography"
                className="pl-9"
              />
            </div>
            <Select value={importCategory} onValueChange={setImportCategory}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={runSearch} disabled={stockSearch.isPending}>
              {stockSearch.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {(['freepik', 'pexels'] as StockProvider[]).map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={providers.includes(p)} onCheckedChange={() => toggleProvider(p)} />
                {providerLabel(p)}
              </label>
            ))}
            {results.length > 0 && (
              <Button size="sm" onClick={importPicked} disabled={importStock.isPending} className="ml-auto">
                {importStock.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Import selected ({picked.size})
              </Button>
            )}
          </div>

          {results.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {results.map((r) => {
                const key = `${r.provider}:${r.source_id}`;
                const on = picked.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePicked(key)}
                    className={`group relative overflow-hidden rounded-lg border text-left transition ${on ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/50'}`}
                  >
                    <Thumb src={r.thumbnail_url} alt={r.name} />
                    <div className="space-y-1 p-2">
                      <p className="truncate text-xs font-medium">{r.name}</p>
                      <Badge variant="secondary" className="text-[10px]">{providerLabel(r.provider)}</Badge>
                    </div>
                    {on && (
                      <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review gallery */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setSelected(new Set()); }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="pending">Pending review ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter templates" className="pl-9" />
          </div>
        </div>

        {selected.size > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
            <span className="text-sm">{selected.size} selected</span>
            <Button size="sm" onClick={() => decide([...selected], 'approved')} disabled={review.isPending}>
              <Check className="mr-2 h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide([...selected], 'rejected')} disabled={review.isPending}>
              <X className="mr-2 h-4 w-4" /> Reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] w-full rounded-lg" />)}
            </div>
          ) : list.length === 0 ? (
            <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
              {tab === 'pending' ? 'Nothing waiting for review. Import or seed some templates above.' : 'No approved templates yet.'}
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((t) => (
                <Card key={t.id} className="overflow-hidden">
                  <div className="relative">
                    <button type="button" className="block w-full" onClick={() => setPreview(t)}>
                      <Thumb src={t.thumbnail_url ?? t.preview_url} alt={t.name} />
                    </button>
                    <span className="absolute left-2 top-2">
                      <Checkbox
                        checked={selected.has(t.id)}
                        onCheckedChange={() => toggleSelected(t.id)}
                        className="bg-background/90"
                      />
                    </span>
                    <Badge variant="secondary" className="absolute right-2 top-2 text-[10px]">
                      {providerLabel(t.source)}
                    </Badge>
                  </div>
                  <CardContent className="space-y-2 p-3">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.category ?? 'Uncategorized'} · {t.format ?? '—'} · {t.width ?? '?'}×{t.height ?? '?'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setPreview(t)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => openInEditor(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {t.is_active ? (
                        <Button size="sm" variant="outline" className="h-8 flex-1" onClick={() => decide([t.id], 'rejected')}>
                          Unpublish
                        </Button>
                      ) : (
                        <Button size="sm" className="h-8 flex-1" onClick={() => decide([t.id], 'approved')}>
                          Approve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TemplatePreviewDialog
        template={preview}
        onOpenChange={(open) => !open && setPreview(null)}
        source="library"
        extraActions={
          preview && !preview.is_active ? (
            <Button onClick={() => { decide([preview.id], 'approved'); setPreview(null); }}>
              <Check className="mr-2 h-4 w-4" /> Approve
            </Button>
          ) : null
        }
      />
    </div>
  );
}
