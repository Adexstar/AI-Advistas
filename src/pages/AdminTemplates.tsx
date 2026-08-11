import { useMemo, useState } from 'react';
import { format as formatDate } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Power, PowerOff, Search, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminTemplates, useSaveTemplate, useToggleTemplateActive, type AdminTemplate,
} from '@/hooks/useAdminTemplates';
import { validateStructure } from '@/services/templates/qa';

const SOURCE_LABELS: Record<string, string> = {
  advista_original: 'AdVista Original',
  freepik_api: 'Freepik',
  freepik: 'Freepik',
  canva: 'Canva',
  cloudinary: 'Cloudinary',
  manual: 'Manual',
  owned: 'Owned',
};

const emptyForm = {
  id: '',
  name: '',
  description: '',
  category: '',
  platform: '',
  objective: '',
  format: '',
  width: '',
  height: '',
  preview_url: '',
  thumbnail_url: '',
  ai_tags: '',
  industry_tags: '',
  premium: false,
  brand_compatible: true,
  popularity_score: '0',
  source: 'advista_original',
  source_id: '',
  source_license: 'owned',
  license_expires_at: '',
  imported_at: '',
  template_json: '{\n  "objects": []\n}',
};

type FormState = typeof emptyForm;

const toForm = (t: AdminTemplate): FormState => ({
  id: t.id,
  name: t.name ?? '',
  description: t.description ?? '',
  category: t.category ?? '',
  platform: t.platform ?? '',
  objective: t.objective ?? '',
  format: t.format ?? '',
  width: t.width != null ? String(t.width) : '',
  height: t.height != null ? String(t.height) : '',
  preview_url: t.preview_url ?? '',
  thumbnail_url: t.thumbnail_url ?? '',
  ai_tags: (t.ai_tags ?? []).join(', '),
  industry_tags: (t.industry_tags ?? []).join(', '),
  premium: !!t.premium,
  brand_compatible: t.brand_compatible !== false,
  popularity_score: String(t.popularity_score ?? 0),
  source: t.source ?? 'advista_original',
  source_id: t.source_id ?? '',
  source_license: t.source_license ?? 'owned',
  license_expires_at: t.license_expires_at ? t.license_expires_at.slice(0, 10) : '',
  imported_at: t.imported_at ? t.imported_at.slice(0, 10) : '',
  template_json: JSON.stringify(t.template_json ?? { objects: [] }, null, 2),
});

const prettyDate = (v: string | null) => {
  if (!v) return '—';
  try { return formatDate(new Date(v), 'MMMM d, yyyy'); } catch { return v; }
};

export default function AdminTemplates() {
  const { data: templates = [], isLoading } = useAdminTemplates();
  const save = useSaveTemplate();
  const toggle = useToggleTemplateActive();

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const categories = useMemo(
    () => Array.from(new Set(templates.map((t) => t.category).filter(Boolean) as string[])).sort(),
    [templates]
  );
  const sources = useMemo(
    () => Array.from(new Set(templates.map((t) => t.source).filter(Boolean))).sort(),
    [templates]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (q && !`${t.name} ${t.description ?? ''} ${(t.ai_tags ?? []).join(' ')}`.toLowerCase().includes(q)) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;
      if (statusFilter === 'active' && !t.is_active) return false;
      if (statusFilter === 'inactive' && t.is_active) return false;
      return true;
    });
  }, [templates, query, categoryFilter, sourceFilter, statusFilter]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => { setForm(emptyForm); setOpen(true); };
  const openEdit = (t: AdminTemplate) => { setForm(toForm(t)); setOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    let json: any;
    try {
      json = JSON.parse(form.template_json || '{}');
    } catch {
      toast.error('Template JSON is not valid JSON');
      return;
    }
    const qa = validateStructure(json);
    if (qa.errors.length) {
      toast.error(`Template JSON failed QA: ${qa.errors[0]}`);
      return;
    }
    if (qa.warnings.length) toast.warning(qa.warnings[0]);

    const toArray = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);
    const num = (v: string) => (v.trim() === '' ? null : Number(v));

    save.mutate(
      {
        ...(form.id ? { id: form.id } : {}),
        name: form.name.trim(),
        description: form.description || null,
        category: form.category || null,
        platform: form.platform || null,
        objective: form.objective || null,
        format: form.format || null,
        width: num(form.width),
        height: num(form.height),
        preview_url: form.preview_url || null,
        thumbnail_url: form.thumbnail_url || null,
        ai_tags: toArray(form.ai_tags),
        industry_tags: toArray(form.industry_tags),
        premium: form.premium,
        brand_compatible: form.brand_compatible,
        popularity_score: Number(form.popularity_score) || 0,
        source: form.source || 'manual',
        source_id: form.source_id || null,
        source_license: form.source_license || null,
        license_expires_at: form.license_expires_at ? new Date(form.license_expires_at).toISOString() : null,
        imported_at: form.imported_at ? new Date(form.imported_at).toISOString() : new Date().toISOString(),
        template_json: json,
      } as any,
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Template Library — Admin View</h1>
          <p className="text-muted-foreground mt-1">
            Create, edit and deactivate templates. Source and licensing details are admin-only.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Template
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search templates…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {sources.map((s) => <SelectItem key={s} value={s}>{SOURCE_LABELS[s] ?? s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No templates match these filters.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((t) => (
            <Card key={t.id} className={t.is_active ? '' : 'opacity-60'}>
              <CardContent className="p-4 flex gap-4">
                <div className="h-24 w-24 shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                  {t.thumbnail_url || t.preview_url ? (
                    <img src={(t.thumbnail_url || t.preview_url) as string} alt={`${t.name} preview`} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{t.name}</h3>
                    <Badge variant={t.is_active ? 'secondary' : 'outline'}>{t.is_active ? 'Active' : 'Inactive'}</Badge>
                    {t.premium && <Badge variant="outline">Premium</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Category: {t.category ?? '—'}
                    {t.platform ? ` · ${t.platform}` : ''}
                  </p>
                  <div className="rounded-md border border-dashed p-2 text-xs text-muted-foreground space-y-0.5">
                    <p>Source: {SOURCE_LABELS[t.source] ?? t.source}{t.source_id ? ` (ID: ${t.source_id})` : ''}</p>
                    <p>
                      License: {t.source_license ?? '—'} · Expires: {t.license_expires_at ? prettyDate(t.license_expires_at) : 'Never'}
                    </p>
                    <p>Imported: {prettyDate(t.imported_at)}</p>
                  </div>
                  <p className="text-sm">
                    Usage: {t.usage_count ?? 0} times · Score: {t.popularity_score ?? 0}/100
                  </p>
                  {!!(t.ai_tags ?? []).length && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(t.ai_tags ?? []).slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={t.is_active ? 'ghost' : 'secondary'}
                      onClick={() => toggle.mutate({ id: t.id, is_active: !t.is_active })}
                      disabled={toggle.isPending}
                    >
                      {t.is_active ? <PowerOff className="h-3.5 w-3.5 mr-1.5" /> : <Power className="h-3.5 w-3.5 mr-1.5" />}
                      {t.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit template' : 'New template'}</DialogTitle>
            <DialogDescription>
              User-facing fields appear in the library. Internal fields are admin-only.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <section className="space-y-3">
              <h4 className="text-sm font-semibold">User-facing</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="beauty" />
                </div>
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <Input value={form.platform} onChange={(e) => set('platform', e.target.value)} placeholder="instagram" />
                </div>
                <div className="space-y-1.5">
                  <Label>Objective</Label>
                  <Input value={form.objective} onChange={(e) => set('objective', e.target.value)} placeholder="Conversion" />
                </div>
                <div className="space-y-1.5">
                  <Label>Format</Label>
                  <Input value={form.format} onChange={(e) => set('format', e.target.value)} placeholder="square" />
                </div>
                <div className="space-y-1.5">
                  <Label>Width</Label>
                  <Input type="number" value={form.width} onChange={(e) => set('width', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Height</Label>
                  <Input type="number" value={form.height} onChange={(e) => set('height', e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Preview URL</Label>
                  <Input value={form.preview_url} onChange={(e) => set('preview_url', e.target.value)} placeholder="https://res.cloudinary.com/…" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Thumbnail URL</Label>
                  <Input value={form.thumbnail_url} onChange={(e) => set('thumbnail_url', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>AI tags (comma separated)</Label>
                  <Input value={form.ai_tags} onChange={(e) => set('ai_tags', e.target.value)} placeholder="luxury, skincare" />
                </div>
                <div className="space-y-1.5">
                  <Label>Industry tags</Label>
                  <Input value={form.industry_tags} onChange={(e) => set('industry_tags', e.target.value)} />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Switch checked={form.premium} onCheckedChange={(v) => set('premium', v)} id="premium" />
                  <Label htmlFor="premium">Premium</Label>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Switch checked={form.brand_compatible} onCheckedChange={(v) => set('brand_compatible', v)} id="brandcompat" />
                  <Label htmlFor="brandcompat">Brand compatible</Label>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold">Internal — admin only</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Input value={form.source} onChange={(e) => set('source', e.target.value)} placeholder="freepik_api" />
                </div>
                <div className="space-y-1.5">
                  <Label>Source ID</Label>
                  <Input value={form.source_id} onChange={(e) => set('source_id', e.target.value)} placeholder="fp_12345" />
                </div>
                <div className="space-y-1.5">
                  <Label>License</Label>
                  <Input value={form.source_license} onChange={(e) => set('source_license', e.target.value)} placeholder="premium" />
                </div>
                <div className="space-y-1.5">
                  <Label>License expires (blank = never)</Label>
                  <Input type="date" value={form.license_expires_at} onChange={(e) => set('license_expires_at', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Imported at</Label>
                  <Input type="date" value={form.imported_at} onChange={(e) => set('imported_at', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Popularity score</Label>
                  <Input type="number" value={form.popularity_score} onChange={(e) => set('popularity_score', e.target.value)} />
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold">Template JSON (Fabric.js)</h4>
              <Textarea
                rows={10}
                className="font-mono text-xs"
                value={form.template_json}
                onChange={(e) => set('template_json', e.target.value)}
              />
            </section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
