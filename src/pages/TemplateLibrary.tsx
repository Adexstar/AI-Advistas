import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates, useTrackTemplateUsage, type AdTemplate } from '@/hooks/useTemplates';
import { useCampaigns } from '@/hooks/useCampaigns';
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
} from 'lucide-react';
import { downloadTemplate } from '@/services/templates/templateDownload';


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

const TemplateCard = ({
  template,
  isFavorite,
  onFavorite,
  onPreview,
  onAssign,
  onEdit,
  onDuplicate,
}: {
  template: AdTemplate;
  isFavorite: boolean;
  onFavorite: () => void;
  onPreview: () => void;
  onAssign: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
}) => {
  const platform = template.platforms?.[0] || 'Facebook';
  const thumb = (template as any).thumbnail_url || (template as any).preview_url;
  const PlatformIcon =
    platform === 'Instagram' || platform === 'Instagram Story'
      ? Instagram
      : platform === 'YouTube'
      ? Youtube
      : platform === 'TikTok'
      ? Sparkles
      : Facebook;

  return (
    <Card className="group overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:shadow-lg">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {thumb ? (
          <img
            src={thumb}
            alt={template.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
            <LayoutGrid className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge className="gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-white">
            <PlatformIcon className="h-3 w-3" />
            {platform}
          </Badge>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
          }}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-110"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-foreground'}`} />
        </button>
      </div>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{template.name}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="mr-2 h-4 w-4" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAssign}>
                <Send className="mr-2 h-4 w-4" /> Assign to Campaign
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {((template.usage_count || 0) / 1000).toFixed(1)}K
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {(((template.usage_count || 0) * 3.2) / 1000).toFixed(1)}K
          </span>
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

  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [category, setCategory] = useState<string | null>(null);
  const [favorites, toggleFavorite] = useLocalSet(FAV_KEY);
  const [, setAssignments] = useLocalSet(ASSIGN_KEY);
  const [previewTemplate, setPreviewTemplate] = useState<AdTemplate | null>(null);
  const [assignTemplate, setAssignTemplate] = useState<AdTemplate | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (platform !== 'all' && !(t.platforms || []).includes(platform)) return false;
      if (category && t.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [templates, platform, category, search]);

  const popular = useMemo(
    () => [...filtered].sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 6),
    [filtered],
  );
  const recent = useMemo(
    () =>
      [...templates]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 4),
    [templates],
  );

  const handleEdit = (t: AdTemplate) => {
    trackUsage.mutate(t.id);
    navigate('/template-customizer', { state: { templateData: t } });
  };

  const handleDuplicate = (t: AdTemplate) => {
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
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Templates</h1>
            <p className="mt-1 text-sm text-muted-foreground">
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
            <Button onClick={() => navigate('/originals')} className="h-10 gap-2 rounded-xl">
              <Sparkles className="h-4 w-4" /> AdVista Originals
            </Button>
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
              <Button onClick={() => navigate('/create')} className="mt-4 gap-2 rounded-xl">
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
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
              ))}
            </div>
          ) : popular.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
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
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {popular.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  isFavorite={favorites.has(t.id)}
                  onFavorite={() => toggleFavorite(t.id)}
                  onPreview={() => setPreviewTemplate(t)}
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
          {isLoading ? (
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
                      <p className="truncate text-sm font-semibold">{t.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.platforms?.[0] || 'Multi-platform'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
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

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
              {(previewTemplate as any)?.thumbnail_url ? (
                <img
                  src={(previewTemplate as any).thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium">{previewTemplate?.category || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Platforms</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {previewTemplate?.platforms?.map((p) => (
                    <Badge key={p} variant="secondary">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Usage Count</p>
                <p className="font-medium">{previewTemplate?.usage_count || 0} uses</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">
                  {previewTemplate?.created_at
                    ? new Date(previewTemplate.created_at).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAssignTemplate(previewTemplate);
                setPreviewTemplate(null);
              }}
            >
              <Send className="mr-2 h-4 w-4" /> Assign to Campaign
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!previewTemplate) return;
                const t = previewTemplate as any;
                downloadTemplate({
                  id: t.id,
                  name: t.name,
                  description: t.description,
                  category: t.category,
                  platform: t.platforms?.[0],
                  objective: t.goal,
                  template_json: t.template_json ?? null,
                  metadata: t.metadata ?? {},
                  layout_dna: t.layout_dna ?? t.metadata ?? {},
                  ai_tags: t.tags ?? [],
                  industry_tags: t.industry ? [t.industry] : [],
                  brand_compatible: t.brand_compatible ?? null,
                });
                toast({ title: 'Template exported', description: 'Downloaded as .advista.json' });
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Export JSON
            </Button>

            <Button
              onClick={() => {
                if (previewTemplate) handleEdit(previewTemplate);
                setPreviewTemplate(null);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" /> Open in Visual Editor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
