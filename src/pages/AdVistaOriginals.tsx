import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, LayoutGrid, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useOriginalsSearch,
  type OriginalTemplate,
  type OriginalsSearchFilters,
} from '@/hooks/useOriginalsSearch';

const CATEGORIES = [
  'Agency', 'Automotive', 'Beauty', 'Business', 'E-commerce',
  'Education', 'Fashion', 'Finance', 'Fitness', 'Healthcare',
  'Real Estate', 'Restaurant & Food', 'SaaS & Technology', 'Seasonal', 'Travel',
];

const PLATFORMS = ['Facebook', 'Instagram', 'Instagram Story', 'LinkedIn', 'TikTok', 'YouTube', 'X', 'Snapchat'];
const GOALS = ['Awareness', 'Traffic', 'Conversions', 'Engagement', 'Sales', 'Sign-ups', 'Leads'];
const INDUSTRIES = [
  'Beauty', 'Skincare', 'Cosmetics', 'SaaS', 'Technology', 'B2B',
  'Fitness', 'Wellness', 'Fashion', 'Real Estate', 'Food',
  'Restaurant', 'Travel', 'Finance', 'Healthcare', 'Education', 'Automotive',
];
const LAYOUTS = [
  'Announcement', 'Asymmetric', 'Bold Type', 'Cinematic', 'Editorial', 'Hero',
  'Hero Poster', 'Minimal', 'Product Focus', 'Promo', 'Split', 'Typographic',
];
const EMOTIONS = [
  'Aspirational', 'Calm', 'Confident', 'Energetic', 'Escapist', 'Excited',
  'Fresh', 'Friendly', 'Innovative', 'Luxury', 'Motivated', 'Playful',
  'Professional', 'Urgent', 'Warm', 'Welcoming',
];
const BRAND_COMPAT = ['Luxury', 'Premium', 'Organic', 'Bold', 'Athletic', 'Motivational', 'Modern', 'Tech'];

const ANY = '__any__';

const TemplateTile = ({
  t,
  onOpen,
}: {
  t: OriginalTemplate;
  onOpen: () => void;
}) => {
  const emotion = t.metadata?.emotion as string | undefined;
  const layout = t.metadata?.layout_style as string | undefined;
  return (
    <Card
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {t.thumbnail_url ? (
          <img
            src={t.thumbnail_url}
            alt={t.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <LayoutGrid className="h-10 w-10 text-primary/40" />
          </div>
        )}
        {t.brand_compatible && (
          <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-white/95 text-xs text-foreground hover:bg-white">
            <Sparkles className="h-3 w-3" /> Brand-ready
          </Badge>
        )}
        {t.platform && (
          <Badge variant="secondary" className="absolute right-3 top-3 rounded-full text-xs">
            {t.platform}
          </Badge>
        )}
      </div>
      <CardContent className="space-y-2 p-3">
        <p className="truncate text-sm font-semibold">{t.name}</p>
        <div className="flex flex-wrap gap-1">
          {t.category && <Badge variant="outline" className="text-[10px]">{t.category}</Badge>}
          {layout && <Badge variant="outline" className="text-[10px]">{layout}</Badge>}
          {emotion && <Badge variant="outline" className="text-[10px]">{emotion}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
};

const FilterSelect = ({
  label, value, onChange, options,
}: { label: string; value?: string; onChange: (v?: string) => void; options: string[] }) => (
  <Select
    value={value || ANY}
    onValueChange={(v) => onChange(v === ANY ? undefined : v)}
  >
    <SelectTrigger className="h-9 rounded-xl">
      <SelectValue placeholder={label} />
    </SelectTrigger>
    <SelectContent className="max-h-72">
      <SelectItem value={ANY}>{label}: Any</SelectItem>
      {options.map((o) => (
        <SelectItem key={o} value={o}>{o}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const AdVistaOriginals = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<OriginalsSearchFilters>({});
  const [preview, setPreview] = useState<OriginalTemplate | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: templates = [], isLoading } = useOriginalsSearch(filters);

  const activeCount = useMemo(
    () => Object.entries(filters).filter(([k, v]) => k !== 'query' && v).length,
    [filters],
  );

  const patch = (p: Partial<OriginalsSearchFilters>) => setFilters((f) => ({ ...f, ...p }));
  const clearAll = () => setFilters({});

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container space-y-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-2 gap-1 rounded-full bg-primary/10 text-primary hover:bg-primary/15">
              <Sparkles className="h-3 w-3" /> AdVista Originals
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              30 proprietary templates, engineered to convert
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Every original comes with AI metadata — brand fit, goal, industry, emotion, and layout DNA — so search finds the right one instantly.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/template-library')} className="rounded-xl">
            All templates
          </Button>
        </header>

        {/* Search + filter toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:min-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.query || ''}
              onChange={(e) => patch({ query: e.target.value || undefined })}
              placeholder="Search by name, tag, industry, or vibe…"
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters((s) => !s)}
            className="h-10 gap-2 rounded-xl"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                {activeCount}
              </Badge>
            )}
          </Button>
          {(activeCount > 0 || filters.query) && (
            <Button variant="ghost" onClick={clearAll} className="h-10 gap-1 rounded-xl">
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <Card className="rounded-2xl border-border/60">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect label="Category" value={filters.category}
                onChange={(v) => patch({ category: v })} options={CATEGORIES} />
              <FilterSelect label="Platform" value={filters.platform}
                onChange={(v) => patch({ platform: v })} options={PLATFORMS} />
              <FilterSelect label="Goal" value={filters.goal}
                onChange={(v) => patch({ goal: v })} options={GOALS} />
              <FilterSelect label="Industry" value={filters.industry}
                onChange={(v) => patch({ industry: v })} options={INDUSTRIES} />
              <FilterSelect label="Layout" value={filters.layoutStyle}
                onChange={(v) => patch({ layoutStyle: v })} options={LAYOUTS} />
              <FilterSelect label="Emotion" value={filters.emotion}
                onChange={(v) => patch({ emotion: v })} options={EMOTIONS} />
              <FilterSelect label="Brand fit" value={filters.brandCompat}
                onChange={(v) => patch({ brandCompat: v })} options={BRAND_COMPAT} />
              <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!filters.brandCompatibleOnly}
                  onChange={(e) => patch({ brandCompatibleOnly: e.target.checked || undefined })}
                />
                Brand-compatible only
              </label>
            </CardContent>
          </Card>
        )}

        {/* Category chips */}
        <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => patch({ category: undefined })}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              !filters.category ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-muted'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => patch({ category: filters.category === c ? undefined : c })}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                filters.category === c
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Results */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isLoading ? 'Searching…' : `${templates.length} ${templates.length === 1 ? 'template' : 'templates'}`}
            </h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <LayoutGrid className="h-10 w-10 text-muted-foreground" />
                <p className="font-semibold">No templates match your filters</p>
                <p className="text-sm text-muted-foreground">Try clearing filters or changing your search.</p>
                <Button variant="outline" onClick={clearAll}>Clear filters</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {templates.map((t) => (
                <TemplateTile key={t.id} t={t} onOpen={() => setPreview(t)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Preview */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>{preview?.description}</DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="grid gap-4 sm:grid-cols-[1.3fr_1fr]">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                {preview.thumbnail_url ? (
                  <img src={preview.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
              </div>
              <div className="space-y-3 text-sm">
                <MetaRow label="Category" value={preview.category} />
                <MetaRow label="Platform" value={preview.platform} />
                <MetaRow label="Goal" value={preview.objective} />
                <MetaRow label="Emotion" value={preview.metadata?.emotion} />
                <MetaRow label="Layout" value={preview.metadata?.layout_style} />
                <MetaRow label="Audience" value={preview.metadata?.audience} />
                {preview.industry_tags?.length ? (
                  <div>
                    <p className="text-muted-foreground">Industry</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {preview.industry_tags.map((t) => (
                        <Badge key={t} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {preview.ai_tags?.length ? (
                  <div>
                    <p className="text-muted-foreground">AI tags</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {preview.ai_tags.map((t) => (
                        <Badge key={t} variant="outline">{t}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>Close</Button>
            <Button
              onClick={() => {
                if (preview) {
                  navigate('/template-customizer', { state: { templateData: preview } });
                }
              }}
            >
              Customize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MetaRow = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  ) : null;

export default AdVistaOriginals;
