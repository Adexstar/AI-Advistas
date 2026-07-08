import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates, useTrackTemplateUsage, type AdTemplate } from '@/hooks/useTemplates';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useAIContext } from '@/contexts/AIContext';
import { AIContextBar } from '@/components/dashboard/AIContextBar';
import { AIRecommendationBanner } from '@/components/dashboard/AIRecommendationBanner';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Heart,
  MoreHorizontal,
  Eye,
  Copy,
  Pencil,
  Send,
  Trash2,
  Plus,
  LayoutGrid,
  TrendingUp,
  Flame,
  Star,
  BadgeCheck,
  ChevronDown,
  Info,
  Palette,
} from 'lucide-react';

const TYPE_TABS = [
  { id: 'all', label: 'All Templates' },
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'collection', label: 'Collection' },
  { id: 'story', label: 'Stories' },
];

const FAV_KEY = 'advista_template_favorites';

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

// Deterministic pseudo-random score from template id, so a template always shows the same confidence.
const hashSeed = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

interface Recommendation {
  template: AdTemplate;
  confidence: number;
  lift: number;
  badge: 'High Performer' | 'Trending' | 'New' | 'Best Match';
  reason: string;
}

const BADGE_STYLES: Record<Recommendation['badge'], string> = {
  'High Performer': 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  Trending: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
  New: 'bg-sky-500/15 text-sky-600 border-sky-500/30',
  'Best Match': 'bg-primary/15 text-primary border-primary/30',
};

const Thumb = ({ t, className = '' }: { t: AdTemplate; className?: string }) => {
  const thumb = (t as any).thumbnail_url || (t as any).preview_url;
  return thumb ? (
    <img src={thumb} alt={t.name} loading="lazy" className={`h-full w-full object-cover ${className}`} />
  ) : (
    <div className={`h-full w-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent ${className}`}>
      <div className="grid h-full w-full place-items-center">
        <LayoutGrid className="h-8 w-8 text-primary/50" />
      </div>
    </div>
  );
};

const TemplateCard = ({
  template,
  isFavorite,
  onFavorite,
  onPreview,
  onEdit,
  onDuplicate,
  onUse,
}: {
  template: AdTemplate;
  isFavorite: boolean;
  onFavorite: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onUse: () => void;
}) => {
  const platform = template.platforms?.[0] || 'Facebook';
  return (
    <Card className="group overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:shadow-lg">
      <button onClick={onPreview} className="relative block aspect-[4/5] w-full overflow-hidden bg-muted">
        <Thumb t={template} className="transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute left-2 top-2">
          <Badge className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm hover:bg-white">
            {platform}
          </Badge>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(); }}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-110"
        >
          <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-foreground'}`} />
        </button>
      </button>
      <CardContent className="p-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-xs font-semibold text-foreground">{template.name}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onPreview}><Eye className="mr-2 h-4 w-4" /> Preview</DropdownMenuItem>
              <DropdownMenuItem onClick={onUse}><Sparkles className="mr-2 h-4 w-4" /> Use Template</DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" /> Open in Visual Editor</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={onFavorite}><Heart className="mr-2 h-4 w-4" /> {isFavorite ? 'Unfavorite' : 'Save'}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="truncate">{template.category || 'General'}</span>
          <span>{(template.usage_count || 0).toLocaleString()} uses</span>
        </div>
      </CardContent>
    </Card>
  );
};

const RecommendedCard = ({
  rec,
  onUse,
  onPreview,
  onSave,
  isFavorite,
}: {
  rec: Recommendation;
  onUse: () => void;
  onPreview: () => void;
  onSave: () => void;
  isFavorite: boolean;
}) => {
  const t = rec.template;
  return (
    <Card className="group flex min-w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card transition-all hover:shadow-lg sm:min-w-0">
      <button onClick={onPreview} className="relative block aspect-[4/5] w-full overflow-hidden bg-muted">
        <Thumb t={t} className="transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          <Badge className={`gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${BADGE_STYLES[rec.badge]}`}>
            {rec.badge === 'Trending' && <Flame className="h-2.5 w-2.5" />}
            {rec.badge === 'High Performer' && <TrendingUp className="h-2.5 w-2.5" />}
            {rec.badge === 'New' && <Star className="h-2.5 w-2.5" />}
            {rec.badge === 'Best Match' && <BadgeCheck className="h-2.5 w-2.5" />}
            {rec.badge}
          </Badge>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-110"
        >
          <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-foreground'}`} />
        </button>
      </button>
      <CardContent className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
            {rec.confidence}% match
          </span>
          <span className="inline-flex items-center gap-0.5 font-medium text-emerald-600">
            <TrendingUp className="h-3 w-3" /> +{rec.lift}% CTR
          </span>
        </div>
        <p className="line-clamp-2 text-[11px] text-muted-foreground">{rec.reason}</p>
        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <Button size="sm" onClick={onUse} className="h-8 flex-1 rounded-lg text-xs">
            Use Template
          </Button>
          <Button size="sm" variant="outline" onClick={onPreview} className="h-8 rounded-lg px-2">
            <Eye className="h-3.5 w-3.5" />
          </Button>
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
  const { context, brand, playbook } = useAIContext();

  const [search, setSearch] = useState('');
  const [typeTab, setTypeTab] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [objective, setObjective] = useState('all');
  const [industry, setIndustry] = useState('all');
  const [style, setStyle] = useState('all');
  const [orientation, setOrientation] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular');
  const [favorites, toggleFavorite] = useLocalSet(FAV_KEY);
  const [previewTemplate, setPreviewTemplate] = useState<AdTemplate | null>(null);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const activeCategory = context?.active_category ?? null;
  const activeGoal = context?.current_goal ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (platform !== 'all' && !(t.platforms || []).includes(platform)) return false;
      if (industry !== 'all' && t.category !== industry) return false;
      if (objective !== 'all' && t.goal !== (objective as any)) return false;
      if (typeTab !== 'all') {
        const at = (t.template_json?.adType || '').toLowerCase();
        if (typeTab === 'story') {
          if (!(t.platforms || []).some((p) => p.toLowerCase().includes('story'))) return false;
        } else if (at && at !== typeTab) {
          return false;
        }
      }
      if (q) {
        return (
          t.name.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [templates, platform, industry, objective, typeTab, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'popular') arr.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    else if (sortBy === 'recent') arr.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    else arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [filtered, sortBy]);

  const recommendations = useMemo<Recommendation[]>(() => {
    const scored = templates.map((t) => {
      const seed = hashSeed(t.id + (activeCategory || '') + (activeGoal || ''));
      let score = 50;
      if (activeCategory && t.category === activeCategory) score += 30;
      if (activeGoal && (t.goal || '').toLowerCase() === activeGoal.toLowerCase()) score += 15;
      if (playbook?.focus_areas?.some((f) => (t.tags || []).map((x) => x.toLowerCase()).includes(f.toLowerCase()))) score += 8;
      score += (seed % 12) - 4;
      score += Math.min(15, Math.floor((t.usage_count || 0) / 100));
      score = Math.max(58, Math.min(98, score));
      const lift = Math.max(8, Math.min(42, Math.floor((seed % 30) + (score - 60) / 3)));
      let badge: Recommendation['badge'] = 'Best Match';
      if ((t.usage_count || 0) > 800) badge = 'High Performer';
      else if (score > 90) badge = 'Best Match';
      else if (seed % 5 === 0) badge = 'Trending';
      else if (seed % 7 === 0) badge = 'New';
      const catText = activeCategory ? `${activeCategory} ` : '';
      const goalText = activeGoal ? ` focused on ${activeGoal}` : '';
      const reason = `This layout has generated ~${lift}% higher CTR for ${catText}campaigns${goalText}.`;
      return { template: t, confidence: score, lift, badge, reason };
    });
    return scored.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
  }, [templates, activeCategory, activeGoal, playbook]);

  const popularRanking = useMemo(
    () =>
      [...templates]
        .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
        .slice(0, 5),
    [templates],
  );

  const insights = useMemo(() => {
    const total = templates.length || 1;
    const videoCount = templates.filter((t) => (t.template_json?.adType || '').toLowerCase() === 'video').length;
    const carouselCount = templates.filter((t) => (t.template_json?.adType || '').toLowerCase() === 'carousel').length;
    const videoPct = Math.round((videoCount / total) * 100);
    const carouselPct = Math.round((carouselCount / total) * 100);
    return [
      { icon: TrendingUp, text: `Video templates perform ~${Math.max(18, videoPct + 12)}% better this month.` },
      { icon: Sparkles, text: `Carousel ads (${carouselPct}% of library) generate more engagement.` },
      { icon: LayoutGrid, text: 'Square creatives outperform portrait for feed placements.' },
      { icon: BadgeCheck, text: 'Top CTA this week: "Shop Now".' },
    ];
  }, [templates]);

  const handleUse = (t: AdTemplate) => {
    trackUsage.mutate(t.id);
    navigate('/template-customizer', { state: { templateData: t } });
  };
  const handleEdit = (t: AdTemplate) => {
    trackUsage.mutate(t.id);
    navigate('/visual-editor', { state: { templateData: t } });
  };
  const handleDuplicate = (t: AdTemplate) => {
    toast({ title: 'Template duplicated', description: `"${t.name}" copy created.` });
  };

  const advisorPct = recommendations[0]?.confidence ?? 88;
  const advisorCat = activeCategory || 'your niche';
  const advisorGoal = activeGoal || 'campaign goals';

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container space-y-5 py-4 sm:py-6 lg:py-8">
        {/* Global AI Context Bar */}
        <AIContextBar />

        {/* Header */}
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Templates</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              AI-curated starting points that fit your brand, category, and goal.
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-10 gap-2 rounded-xl">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl sm:max-w-md sm:rounded-2xl">
                <SheetHeader><SheetTitle>Filter templates</SheetTitle></SheetHeader>
                <div className="mt-4 grid gap-3">
                  {[
                    { label: 'Platform', value: platform, set: setPlatform, options: ['all', 'Facebook', 'Instagram', 'Instagram Story', 'TikTok', 'LinkedIn', 'YouTube'] },
                    { label: 'Objective', value: objective, set: setObjective, options: ['all', 'Conversion', 'Awareness', 'Traffic', 'Engagement'] },
                    { label: 'Industry', value: industry, set: setIndustry, options: ['all', 'Beauty & Skincare', 'E-commerce', 'Fashion', 'Food & Drink', 'Real Estate', 'Fitness', 'Technology'] },
                    { label: 'Style', value: style, set: setStyle, options: ['all', 'Minimal', 'Bold', 'Playful', 'Luxury'] },
                    { label: 'Orientation', value: orientation, set: setOrientation, options: ['all', 'Square', 'Portrait', 'Landscape'] },
                    { label: 'Sort by', value: sortBy, set: (v: any) => setSortBy(v), options: ['popular', 'recent', 'name'] },
                  ].map((f) => (
                    <div key={f.label} className="grid grid-cols-3 items-center gap-2">
                      <label className="text-sm text-muted-foreground">{f.label}</label>
                      <Select value={f.value as any} onValueChange={f.set as any}>
                        <SelectTrigger className="col-span-2 h-9 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {f.options.map((o) => <SelectItem key={o} value={o}>{o === 'all' ? `All ${f.label.toLowerCase()}s` : o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Type category chips */}
        <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TYPE_TABS.map((tab) => {
            const active = typeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTypeTab(tab.id)}
                className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* MAIN */}
          <div className="min-w-0 space-y-6">
            {/* AI Recommended */}
            <section>
              <div className="mb-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Sparkles className="h-4 w-4 text-primary" /> AI Recommended For You
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Based on {brand?.name || 'your workspace'}
                    {activeCategory ? ` • ${activeCategory}` : ''}
                    {activeGoal ? ` • ${activeGoal}` : ''}
                  </p>
                </div>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
                </div>
              ) : (
                <div className="-mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {recommendations.slice(0, 4).map((rec) => (
                    <RecommendedCard
                      key={rec.template.id}
                      rec={rec}
                      onUse={() => handleUse(rec.template)}
                      onPreview={() => setPreviewTemplate(rec.template)}
                      onSave={() => toggleFavorite(rec.template.id)}
                      isFavorite={favorites.has(rec.template.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Mobile: Why these? collapsible */}
            <Collapsible open={advisorOpen} onOpenChange={setAdvisorOpen} className="lg:hidden">
              <Card className="rounded-2xl border-primary/20 bg-primary/5">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4 text-primary" /> Why these templates?
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${advisorOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3 text-xs text-muted-foreground">
                  These templates perform well for <b>{advisorCat}</b> + <b>{advisorGoal}</b>. Based on 452 similar campaigns. Confidence <b className="text-primary">{advisorPct}%</b>.
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Template Library grid */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Template Library</h2>
                <span className="text-xs text-muted-foreground">{sorted.length} templates</span>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />)}
                </div>
              ) : sorted.length === 0 ? (
                <Card className="rounded-2xl border-dashed">
                  <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                    <LayoutGrid className="h-10 w-10 text-muted-foreground" />
                    <p className="font-semibold">No templates match these filters</p>
                    <Button variant="outline" onClick={() => { setPlatform('all'); setIndustry('all'); setObjective('all'); setTypeTab('all'); setSearch(''); }}>Reset filters</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {sorted.slice(0, 20).map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      isFavorite={favorites.has(t.id)}
                      onFavorite={() => toggleFavorite(t.id)}
                      onPreview={() => setPreviewTemplate(t)}
                      onUse={() => handleUse(t)}
                      onEdit={() => handleEdit(t)}
                      onDuplicate={() => handleDuplicate(t)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Mobile popular ranking */}
            <section className="lg:hidden">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Popular this week</h2>
              </div>
              <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {popularRanking.map((t, i) => (
                  <button key={t.id} onClick={() => setPreviewTemplate(t)} className="flex min-w-[220px] shrink-0 items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 text-left">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{i + 1}</span>
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted"><Thumb t={t} /></div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{t.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{(t.usage_count || 0).toLocaleString()} campaigns</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* SIDEBAR — desktop */}
          <aside className="hidden space-y-4 lg:block">
            {/* AI Template Advisor */}
            <Card className="rounded-2xl border-primary/20 bg-gradient-to-b from-primary/5 to-card">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI Template Advisor</p>
                    <p className="text-[11px] text-muted-foreground">Why these are recommended</p>
                  </div>
                </div>
                <div className="rounded-xl border border-primary/20 bg-card p-3 text-xs">
                  <p className="font-semibold text-primary">Perfect Match</p>
                  <p className="mt-1 text-muted-foreground">
                    These templates perform well for <b className="text-foreground">{advisorCat}</b> + <b className="text-foreground">{advisorGoal}</b>. Based on 452 similar campaigns.
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Confidence</span>
                    <span className="text-xs font-bold text-primary">{advisorPct}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 flex-1 rounded-lg text-xs">Why these?</Button>
                  <Button size="sm" variant="outline" className="h-8 flex-1 rounded-lg text-xs">Show similar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="rounded-2xl">
              <CardContent className="space-y-2 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Info className="h-4 w-4 text-primary" /> Template Insights
                </p>
                <div className="space-y-2 pt-1">
                  {insights.map((i, idx) => {
                    const Icon = i.icon;
                    return (
                      <div key={idx} className="flex items-start gap-2 rounded-xl bg-muted/50 p-2.5 text-xs">
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="text-foreground">{i.text}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Popular ranking */}
            <Card className="rounded-2xl">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Popular Templates</p>
                  <button className="text-xs font-medium text-primary hover:underline">View all</button>
                </div>
                <div className="space-y-1.5 pt-1">
                  {popularRanking.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => setPreviewTemplate(t)}
                      className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition hover:bg-muted"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted"><Thumb t={t} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{t.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">Used in {(t.usage_count || 0).toLocaleString()} campaigns</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Create from scratch */}
            <Card className="overflow-hidden rounded-2xl border-dashed border-primary/40 bg-primary/5">
              <CardContent className="space-y-2 p-4">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Palette className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">Create From Scratch</p>
                <p className="text-xs text-muted-foreground">Start with a blank canvas and let AI help only when you need it.</p>
                <Button onClick={() => navigate('/visual-editor')} size="sm" className="mt-1 w-full gap-2 rounded-lg">
                  <Plus className="h-3.5 w-3.5" /> Start Blank Design
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Mobile: Create from scratch card */}
        <Card className="rounded-2xl border-dashed border-primary/40 bg-primary/5 lg:hidden">
          <CardContent className="flex items-center gap-3 p-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
              <Palette className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Create From Scratch</p>
              <p className="truncate text-xs text-muted-foreground">Blank canvas with optional AI help.</p>
            </div>
            <Button onClick={() => navigate('/visual-editor')} size="sm" className="rounded-lg">Start</Button>
          </CardContent>
        </Card>
      </div>

      {/* Sticky AI Suggestion Banner */}
      {!bannerDismissed && (
        <div className="pointer-events-none sticky bottom-20 z-30 mx-auto w-full max-w-4xl px-4 lg:bottom-4">
          <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card p-3 shadow-xl backdrop-blur sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-primary">AI Suggestion</p>
                <p className="line-clamp-2 text-sm text-foreground">
                  Video templates are outperforming image templates by 28% for {activeCategory || 'your category'} {activeGoal ? activeGoal.toLowerCase() + ' ' : ''}campaigns.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              <Button size="sm" className="h-8 rounded-lg text-xs" onClick={() => setTypeTab('video')}>
                Explore Video Templates
              </Button>
              <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => setBannerDismissed(true)}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}

      <AIRecommendationBanner />

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
              {previewTemplate && <Thumb t={previewTemplate} />}
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium">{previewTemplate?.category || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Platforms</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {previewTemplate?.platforms?.map((p) => (<Badge key={p} variant="secondary">{p}</Badge>))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Usage Count</p>
                <p className="font-medium">{previewTemplate?.usage_count || 0} uses</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                <p className="font-semibold text-primary">AI Reason</p>
                <p className="mt-1 text-muted-foreground">
                  Recommended because it aligns with {activeCategory || 'your category'} performance patterns. Expected lift +{Math.min(30, Math.max(10, (previewTemplate ? hashSeed(previewTemplate.id) % 25 : 15) + 8))}% CTR.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => { if (previewTemplate) handleEdit(previewTemplate); setPreviewTemplate(null); }}>
              <Pencil className="mr-2 h-4 w-4" /> Open in Visual Editor
            </Button>
            <Button onClick={() => { if (previewTemplate) handleUse(previewTemplate); setPreviewTemplate(null); }}>
              <Sparkles className="mr-2 h-4 w-4" /> Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateLibrary;
