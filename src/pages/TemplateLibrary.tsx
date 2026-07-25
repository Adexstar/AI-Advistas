import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates, useTrackTemplateUsage, type AdTemplate } from '@/hooks/useTemplates';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useOriginalsSearch, type OriginalTemplate } from '@/hooks/useOriginalsSearch';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  SlidersHorizontal,
  Bell,
  Sparkles,
  Heart,
  MoreHorizontal,
  Eye,
  Copy,
  Pencil,
  Send,
  Trash2,
  Plus,
  Upload,
  Facebook,
  Instagram,
  Youtube,
  LayoutGrid,
  ShoppingBag,
  Sparkle,
  Shirt,
  UtensilsCrossed,
  Home,
  Dumbbell,
  Cpu,
  ChevronRight,
  Download,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { TemplateDetailPanel } from '@/components/templates/TemplateDetailPanel';


const PLATFORM_TABS = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'Facebook', label: 'Facebook', icon: Facebook },
  { id: 'Instagram', label: 'Instagram', icon: Instagram },
  { id: 'Instagram Story', label: 'Instagram Story', icon: Instagram },
  { id: 'TikTok', label: 'TikTok', icon: Sparkles },
  { id: 'LinkedIn', label: 'LinkedIn', icon: Sparkles },
  { id: 'YouTube', label: 'YouTube', icon: Youtube },
];

const CATEGORIES = [
  { id: 'E-commerce', label: 'E-commerce', icon: ShoppingBag, color: 'text-sky-600 bg-sky-50' },
  { id: 'Beauty & Skincare', label: 'Beauty & Skincare', icon: Sparkle, color: 'text-pink-600 bg-pink-50' },
  { id: 'Fashion', label: 'Fashion', icon: Shirt, color: 'text-purple-600 bg-purple-50' },
  { id: 'Food & Drink', label: 'Food & Drink', icon: UtensilsCrossed, color: 'text-orange-600 bg-orange-50' },
  { id: 'Real Estate', label: 'Real Estate', icon: Home, color: 'text-emerald-600 bg-emerald-50' },
  { id: 'Fitness', label: 'Fitness', icon: Dumbbell, color: 'text-rose-600 bg-rose-50' },
  { id: 'Technology', label: 'Technology', icon: Cpu, color: 'text-indigo-600 bg-indigo-50' },
];

const FAV_KEY = 'advista_template_favorites';
const ASSIGN_KEY = 'advista_template_assignments';

const useLocalSet = (key: string) => {
  const [set, setSet] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(key) || '[]'));
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  }, [key, set]);
  const toggle = (id: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  return [set, toggle] as const;
};

type AnyTemplate = (AdTemplate | OriginalTemplate) & { _source?: 'originals' | 'user' };

const SOURCE_FILTERS = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'originals', label: 'Originals', icon: Sparkles },
  { id: 'mine', label: 'My Templates', icon: Bookmark },
  { id: 'favorites', label: 'Favorites', icon: Heart },
];

const TemplateCard = ({
  template,
  isFavorite,
  onFavorite,
  onOpen,
  onAssign,
  onEdit,
  onDuplicate,
}: {
  template: AnyTemplate;
  isFavorite: boolean;
  onFavorite: () => void;
  onOpen: () => void;
  onAssign: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
}) => {
  const isOriginal = template._source === 'originals';
  const platform = (template as AdTemplate).platforms?.[0] || (template as OriginalTemplate).platform || 'Facebook';
  const thumb = (template as any).thumbnail_url || (template as any).preview_url;
  const brandCompatible = isOriginal ? (template as OriginalTemplate).brand_compatible : true;
  const emotion = (template as OriginalTemplate).metadata?.emotion as string | undefined;
  const PlatformIcon =
    platform === 'Instagram' || platform === 'Instagram Story'
      ? Instagram
      : platform === 'YouTube'
      ? Youtube
      : platform === 'TikTok'
      ? Sparkles
      : Facebook;

  return (
    <Card onClick={onOpen} className="group cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:shadow-lg">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {thumb ? (
          <img src={thumb} alt={template.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
            <LayoutGrid className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          <Badge className="gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-white">
            <PlatformIcon className="h-3 w-3" />{platform}
          </Badge>
          {isOriginal && (
            <Badge className="rounded-full bg-purple-500/90 text-white px-2 py-0.5 text-[10px] font-semibold shadow-sm border-0 flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5" /> Original
            </Badge>
          )}
          {brandCompatible && !isOriginal && (
            <Badge className="rounded-full bg-emerald-500/90 text-white px-2 py-0.5 text-[10px] font-semibold shadow-sm border-0 flex items-center gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> Brand Ready
            </Badge>
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onFavorite(); }} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-110">
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-foreground'}`} />
        </button>
        {template.category && (
          <Badge className="absolute bottom-3 left-3 rounded-full bg-black/60 text-white px-2.5 py-0.5 text-[10px] font-medium border-0 backdrop-blur-sm">
            {template.category}
          </Badge>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-clamp-1 text-sm font-semibold text-foreground">{template.name}</p>
            {emotion && <p className="font-micro text-muted-foreground mt-0.5">{emotion}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button onClick={(e) => e.stopPropagation()} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(); }}><Eye className="mr-2 h-4 w-4" /> Preview</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssign(); }}><Send className="mr-2 h-4 w-4" /> Assign to Campaign</DropdownMenuItem>
              {!isOriginal && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}><Trash2 className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

const TemplateLibrary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: templates = [], isLoading } = useTemplates();
  const { data: campaigns = [] } = useCampaigns();
  const trackUsage = useTrackTemplateUsage();

  // Fetch originals (all) — no brandCompatibleOnly filter so the RPC returns everything
  const originalsFilters = useMemo(() => ({ query: '' }), []);
  const { data: originals = [], isLoading: originalsLoading } = useOriginalsSearch(originalsFilters);
  const loading = isLoading || originalsLoading;

  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [category, setCategory] = useState<string | null>(null);
  const [source, setSource] = useState('all');
  const [favorites, toggleFavorite] = useLocalSet(FAV_KEY);
  const [, setAssignments] = useLocalSet(ASSIGN_KEY);
  const [selectedTemplate, setSelectedTemplate] = useState<AnyTemplate | null>(null);
  const [assignTemplate, setAssignTemplate] = useState<AnyTemplate | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');

  // Merge user templates and originals into unified list
  const allTemplates = useMemo(() => {
    const userTemplates: AnyTemplate[] = (templates ?? []).map((t) => ({ ...t, _source: 'user' as const }));
    const originalTemplates: AnyTemplate[] = (originals ?? []).map((t) => ({ ...t, _source: 'originals' as const, platforms: t.platform ? [t.platform] : [] }));
    return [...userTemplates, ...originalTemplates];
  }, [templates, originals]);

  const filtered = useMemo(() => {
    let list = allTemplates;
    if (source === 'favorites') list = list.filter((t) => favorites.has(t.id));
    else if (source === 'originals') list = list.filter((t) => t._source === 'originals');
    else if (source === 'mine') list = list.filter((t) => t._source !== 'originals');
    if (platform !== 'all') list = list.filter((t) => {
      const ps = (t as AdTemplate).platforms || ((t as OriginalTemplate).platform ? [(t as OriginalTemplate).platform] : []);
      return ps.includes(platform);
    });
    if (category) list = list.filter((t) => t.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        ((t as AdTemplate).tags || []).some((tag: string) => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allTemplates, source, platform, category, search, favorites]);

  const popular = useMemo(
    () => [...filtered].sort((a: any, b: any) => (b.popularity_score ?? b.usage_count ?? 0) - (a.popularity_score ?? a.usage_count ?? 0)).slice(0, 6),
    [filtered],
  );
  const recent = useMemo(
    () => [...allTemplates].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4),
    [allTemplates],
  );

  const handleEdit = (t: AnyTemplate) => {
    trackUsage.mutate(t.id);
    navigate('/template-customizer', { state: { templateData: t } });
  };

  const handleDuplicate = (t: AnyTemplate) => {
    toast({ title: 'Template duplicated', description: `"${t.name}" copy created.` });
  };

  const handleAssignSave = () => {
    if (!assignTemplate || !selectedCampaign) return;
    setAssignments(`${assignTemplate.id}:${selectedCampaign}`);
    toast({
      title: 'Template assigned',
      description: `Linked to ${campaigns.find((c: any) => c.id === selectedCampaign)?.name || 'campaign'}.`,
    });
    setAssignTemplate(null);
    setSelectedCampaign('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-4 sm:py-6 lg:py-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="font-page-title">Templates</h1>
            <p className="font-body text-muted-foreground mt-1">
              Choose from professionally designed templates or create your own.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="h-10 rounded-xl pl-9"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SOURCE_FILTERS.map((f) => {
                const Icon = f.icon;
                const active = source === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSource(f.id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {f.label}
                  </button>
                );
              })}
            </div>
            <Button variant="outline" className="h-10 rounded-xl gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Filter
            </Button>
            <Select defaultValue="all">
              <SelectTrigger className="h-10 w-[150px] rounded-xl">
                <SelectValue placeholder="Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="relative h-10 w-10 rounded-xl">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                3
              </span>
            </Button>
          </div>
        </header>

        {/* Platform tabs */}
        <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PLATFORM_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = platform === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPlatform(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Hero banner */}
        <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-primary/15 via-primary/8 to-primary/5">
          <CardContent className="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-md">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Stand out with stunning templates
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                High-performing, customizable templates designed to get you more results.
              </p>
              <Button onClick={() => navigate('/template-library/generate')} className="mt-4 gap-2 rounded-xl">
                Create with AI <Sparkles className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3 self-stretch sm:self-auto">
              {recent.slice(0, 3).map((t, i) => (
                <div
                  key={t.id}
                  className={`relative h-32 w-24 overflow-hidden rounded-2xl border border-white/40 shadow-lg sm:h-40 sm:w-32 ${
                    i === 1 ? 'translate-y-[-8px]' : ''
                  }`}
                >
                  {(t as any).thumbnail_url ? (
                    <img src={(t as any).thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Categories</h3>
            <button className="text-sm font-medium text-primary hover:underline">View all</button>
          </div>
          <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const count = templates.filter((t) => t.category === c.id).length;
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(active ? null : c.id)}
                  className={`flex min-w-[150px] shrink-0 items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{count} Templates</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Popular Templates */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Popular Templates</h3>
            <button className="text-sm font-medium text-primary hover:underline">View all</button>
          </div>
          {loading ? (
            <div className="template-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
              ))}
            </div>
          ) : popular.length === 0 ? (
            <div className="card rounded-2xl border-dashed">
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <LayoutGrid className="h-10 w-10 text-muted-foreground" />
                <p className="font-semibold">No templates yet</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" /> Import Template
                  </Button>
                  <Button onClick={() => navigate('/create')} className="gap-2">
                    <Plus className="h-4 w-4" /> Create Template
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="template-grid">
              {popular.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  isFavorite={favorites.has(t.id)}
                  onFavorite={() => toggleFavorite(t.id)}
                  onOpen={() => setSelectedTemplate(t)}
                  onEdit={() => handleEdit(t)}
                  onDuplicate={() => handleDuplicate(t)}
                  onAssign={() => setAssignTemplate(t)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recently Used */}
        <section className="pb-10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recently Used</h3>
          </div>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recent.map((t) => (
                <Card
                  key={t.id}
                  className="cursor-pointer rounded-2xl transition hover:shadow-md"
                  onClick={() => handleEdit(t)}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {(t as any).thumbnail_url ? (
                        <img src={(t as any).thumbnail_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-clamp-1 text-sm font-semibold">{t.name}</p>
                      <p className="text-truncate font-label text-muted-foreground">
                        {'platforms' in t ? (t as AdTemplate).platforms?.[0] : (t as OriginalTemplate).platform || 'Multi-platform'}
                      </p>
                      <p className="mt-0.5 font-micro text-muted-foreground">
                        Edited {Math.floor(Math.random() * 5) + 1}d ago
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Detail Panel Sheet */}
      <Sheet open={!!selectedTemplate} onOpenChange={(o) => !o && setSelectedTemplate(null)}>
        <SheetContent side="right" className="w-full max-w-md border-l border-border p-0 shadow-2xl sm:max-w-lg">
          <VisuallyHidden.Root>
            <SheetTitle>Template Details</SheetTitle>
            <SheetDescription>Preview and manage template</SheetDescription>
          </VisuallyHidden.Root>
          <TemplateDetailPanel
            template={selectedTemplate}
            isFavorite={selectedTemplate ? favorites.has(selectedTemplate.id) : false}
            onFavorite={() => { if (selectedTemplate) { toggleFavorite(selectedTemplate.id); } }}
            onClose={() => setSelectedTemplate(null)}
            onEdit={(t) => { handleEdit(t); setSelectedTemplate(null); }}
            onDuplicate={(t) => { handleDuplicate(t); setSelectedTemplate(null); }}
            onAssign={(t) => { setAssignTemplate(t); setSelectedTemplate(null); }}
          />
        </SheetContent>
      </Sheet>

      {/* Assign Modal */}
      <Dialog open={!!assignTemplate} onOpenChange={(o) => !o && setAssignTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign template to campaign</DialogTitle>
            <DialogDescription>
              Link "{assignTemplate?.name}" to one of your campaigns.
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger>
              <SelectValue placeholder="Select a campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">No campaigns yet.</div>
              ) : (
                campaigns.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTemplate(null)}>
              Cancel
            </Button>
            <Button disabled={!selectedCampaign} onClick={handleAssignSave}>
              Save Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default TemplateLibrary;
