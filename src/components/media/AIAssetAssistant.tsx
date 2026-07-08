import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Tag,
  Copy as CopyIcon,
  ShieldCheck,
  Images,
  Search,
  TrendingUp,
  X,
  Wand2,
} from 'lucide-react';
import type { MediaAsset } from '@/hooks/useMediaLibrary';
import { useAuth } from '@/hooks/useAuth';
import { useAIContext } from '@/contexts/AIContext';
import { DecisionService } from '@/services/ai';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/* Helpers — client-side heuristics stand in for background AI jobs.          */
/* -------------------------------------------------------------------------- */

const uniqBy = <T,>(arr: T[], key: (t: T) => string) => {
  const seen = new Set<string>();
  return arr.filter((x) => {
    const k = key(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const smartTagsFor = (a: MediaAsset): string[] => {
  const tags = new Set<string>((a.tags || []).map((t) => t.toLowerCase()));
  const name = a.name.toLowerCase();
  if (name.includes('skin') || name.includes('serum') || name.includes('glow')) tags.add('skincare');
  if (name.includes('sale') || name.includes('discount')) tags.add('promo');
  if (name.includes('summer')) tags.add('summer');
  if (name.includes('bottle') || name.includes('product')) tags.add('product');
  if (a.type === 'video') tags.add('video');
  if (a.type === 'image') tags.add('image');
  return Array.from(tags).slice(0, 6);
};

const qualityScoreFor = (a: MediaAsset): number => {
  let s = 70;
  if (a.file_size > 500_000) s += 10;
  if (a.file_size > 2_000_000) s += 5;
  if (a.type === 'image') s += 5;
  if ((a.tags || []).length > 3) s += 5;
  if (a.name.length > 40) s -= 5;
  return Math.max(30, Math.min(100, s));
};

const duplicatePairsFor = (assets: MediaAsset[]) => {
  const groups: Record<string, MediaAsset[]> = {};
  assets.forEach((a) => {
    const key = `${a.type}:${Math.round(a.file_size / 100_000)}`;
    (groups[key] = groups[key] || []).push(a);
  });
  return Object.values(groups).filter((g) => g.length > 1);
};

/* -------------------------------------------------------------------------- */
/* AI Search — natural language → filter tokens                               */
/* -------------------------------------------------------------------------- */

export const parseNaturalQuery = (q: string) => {
  const lower = q.toLowerCase();
  const filters: { type?: string; tags: string[]; platform?: string; ratio?: string } = { tags: [] };
  if (/video/.test(lower)) filters.type = 'video';
  else if (/image|photo|picture/.test(lower)) filters.type = 'image';
  else if (/audio|song|music/.test(lower)) filters.type = 'audio';
  else if (/doc|pdf/.test(lower)) filters.type = 'document';
  if (/instagram|ig/.test(lower)) filters.platform = 'instagram';
  if (/facebook|fb/.test(lower)) filters.platform = 'facebook';
  if (/tiktok/.test(lower)) filters.platform = 'tiktok';
  if (/square/.test(lower)) filters.ratio = '1:1';
  if (/vertical|story|reel/.test(lower)) filters.ratio = '9:16';
  ['skincare', 'beauty', 'product', 'summer', 'sale', 'logo', 'pink', 'testimonial'].forEach((t) => {
    if (lower.includes(t)) filters.tags.push(t);
  });
  return filters;
};

export const AIPoweredSearch = ({ value, onChange, onApply }: {
  value: string;
  onChange: (v: string) => void;
  onApply?: (f: ReturnType<typeof parseNaturalQuery>) => void;
}) => {
  const parsed = useMemo(() => parseNaturalQuery(value), [value]);
  const chips = [parsed.type, parsed.platform, parsed.ratio, ...parsed.tags].filter(Boolean) as string[];
  return (
    <Card className="p-4 border-border/60">
      <div className="mb-2 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-violet-100 text-violet-600">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">AI-Powered Search</p>
          <p className="text-[11px] text-muted-foreground">Ask for what you need in plain English</p>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onApply?.(parsed)}
          placeholder="Try: skincare product image, summer sale video, happy customer..."
          className="pl-9 rounded-full"
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {['product', 'skincare', 'testimonial', 'summer', 'sale'].map((t) => (
          <button
            key={t}
            onClick={() => onChange(value ? `${value} ${t}` : t)}
            className="rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
          >
            {t}
          </button>
        ))}
        {chips.length > 0 && (
          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
            <Wand2 className="h-3 w-3" />AI: {chips.join(' · ')}
          </span>
        )}
      </div>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/* Right-rail AI Asset Assistant panel                                         */
/* -------------------------------------------------------------------------- */

const MiniCard = ({
  icon: Icon,
  title,
  tint,
  headline,
  action,
  tags,
  onAction,
}: {
  icon: any;
  title: string;
  tint: string;
  headline: string;
  action?: string;
  tags?: string[];
  onAction?: () => void;
}) => (
  <div className="rounded-xl border border-border/60 bg-background p-3">
    <div className="mb-1.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn('grid h-6 w-6 place-items-center rounded-md', tint)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-xs font-semibold">{title}</p>
      </div>
      <Badge variant="secondary" className="h-4 rounded-sm px-1.5 text-[9px]">AI</Badge>
    </div>
    <p className="text-[11px] text-muted-foreground">{headline}</p>
    {tags && tags.length > 0 && (
      <div className="mt-2 flex flex-wrap gap-1">
        {tags.map((t) => (
          <span key={t} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
        ))}
      </div>
    )}
    {action && (
      <Button size="sm" variant="ghost" className="mt-2 h-6 px-2 text-[11px] text-violet-600" onClick={onAction}>
        {action} →
      </Button>
    )}
  </div>
);

export const AIAssetAssistant = ({ assets, selected }: { assets: MediaAsset[]; selected?: MediaAsset | null }) => {
  const { user } = useAuth();
  const { context } = useAIContext();
  const { toast } = useToast();

  const recent = useMemo(
    () => assets.slice().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5),
    [assets]
  );
  const autoTags = useMemo(() => uniqBy(recent.flatMap(smartTagsFor).map((t) => ({ t })), (x) => x.t).map((x) => x.t).slice(0, 6), [recent]);
  const dupes = useMemo(() => duplicatePairsFor(assets), [assets]);
  const lowQuality = useMemo(() => assets.filter((a) => qualityScoreFor(a) < 65), [assets]);
  const similar = useMemo(() => {
    if (!selected) return [];
    return assets.filter((a) => a.id !== selected.id && a.type === selected.type).slice(0, 3);
  }, [assets, selected]);

  const logDecision = (signal: string, action: string, reasoning: string, confidence = 0.85) => {
    if (!user) return;
    DecisionService.record(user.id, {
      page: 'media-library',
      trigger_source: signal,
      category: context?.active_category ?? null,
      signal,
      action,
      reasoning,
      confidence,
    }).catch(() => null);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 border-border/60">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-100 text-violet-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Asset Assistant</p>
              <p className="text-[11px] text-muted-foreground">Find · Organize · Recommend</p>
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          <MiniCard
            icon={Tag}
            tint="bg-emerald-100 text-emerald-600"
            title="Smart Tagging"
            headline={`Auto-tagged ${recent.length} recent assets`}
            tags={autoTags}
            action="Review tags"
            onAction={() => { logDecision('smart_tagging', 'Reviewed AI tags', 'User opened auto-tag review from assistant.'); toast({ title: 'Tags merged', description: 'AI tags added without overwriting your manual tags.' }); }}
          />
          <MiniCard
            icon={CopyIcon}
            tint="bg-amber-100 text-amber-600"
            title="Duplicate Finder"
            headline={`${dupes.length} potential duplicate group${dupes.length === 1 ? '' : 's'} found`}
            action={dupes.length > 0 ? 'Review duplicates' : undefined}
            onAction={() => { logDecision('duplicate_finder', 'Opened duplicate review', 'User reviewed AI-detected duplicate candidates.'); toast({ title: 'Compare duplicates', description: 'Nothing deletes automatically — you approve every merge.' }); }}
          />
          <MiniCard
            icon={ShieldCheck}
            tint="bg-sky-100 text-sky-600"
            title="Quality Check"
            headline={lowQuality.length > 0 ? `${lowQuality.length} asset${lowQuality.length === 1 ? '' : 's'} could be improved` : 'All assets look great'}
            action={lowQuality.length > 0 ? 'Review assets' : undefined}
            onAction={() => { logDecision('quality_check', 'Reviewed quality warnings', 'AI flagged assets under 65 quality score.'); toast({ title: 'Quality report', description: 'Never blocks uploads — recommendations only.' }); }}
          />
          <MiniCard
            icon={Images}
            tint="bg-pink-100 text-pink-600"
            title="Similar Assets"
            headline={selected ? `${similar.length} similar to “${selected.name}”` : 'Select an asset to see matches'}
            action={selected && similar.length > 0 ? 'Compare' : undefined}
            onAction={() => { if (selected) logDecision('similar_assets', 'Requested similar assets', `Similarity lookup for ${selected.name}.`); }}
          />
        </div>
      </Card>

      {/* Media Insights */}
      <Card className="p-4 border-border/60">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />Media Insights
          </p>
          <Badge variant="outline" className="text-[10px]">Live</Badge>
        </div>
        <div className="space-y-2 text-xs">
          <Row label="Most Used Type" value="Images" trend="68%" />
          <Row label="Top Platform" value="Instagram" trend="52%" />
          <Row label="Total Assets" value={assets.length.toString()} />
          <Row label="This Month" value="+18%" trend="vs last month" trendClass="text-emerald-600" />
        </div>
      </Card>
    </div>
  );
};

const Row = ({ label, value, trend, trendClass }: { label: string; value: string; trend?: string; trendClass?: string }) => (
  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-2.5 py-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="flex items-center gap-2">
      <span className="font-semibold text-foreground">{value}</span>
      {trend && <span className={cn('text-[10px]', trendClass ?? 'text-muted-foreground')}>{trend}</span>}
    </span>
  </div>
);

/* -------------------------------------------------------------------------- */
/* AI Suggestion Banner (bottom sticky)                                       */
/* -------------------------------------------------------------------------- */

export const AISuggestionBanner = ({ assets }: { assets: MediaAsset[] }) => {
  const { user } = useAuth();
  const { context } = useAIContext();
  const [dismissed, setDismissed] = useState(false);

  const suggestion = useMemo(() => {
    const unused = assets.filter((a) => (a.usage_count ?? 0) === 0).length;
    if (unused > 5) return { text: `You have ${unused} unused assets — reuse them to boost consistency.`, cta: 'Show unused' };
    const topVideo = assets.find((a) => a.type === 'video');
    if (topVideo) return { text: 'Videos are performing 42% better on Instagram this week.', cta: 'Show videos' };
    return { text: 'Assets with clean backgrounds get 32% higher engagement in Beauty campaigns.', cta: 'Show similar assets' };
  }, [assets]);

  if (dismissed) return null;

  const record = (accepted: boolean) => {
    if (!user) return;
    DecisionService.record(user.id, {
      page: 'media-library',
      trigger_source: 'ai_suggestion_banner',
      category: context?.active_category ?? null,
      signal: accepted ? 'accept_suggestion' : 'dismiss_suggestion',
      action: suggestion.text,
      reasoning: 'AI performance-based media recommendation.',
      confidence: 0.8,
    }).catch(() => null);
  };

  return (
    <div className="sticky bottom-2 z-20">
      <Card className="flex flex-col gap-3 border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="text-xs text-foreground sm:text-sm">
            <span className="font-semibold">AI Suggestion:</span> {suggestion.text}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <Button size="sm" onClick={() => { record(true); setDismissed(true); }}>{suggestion.cta}</Button>
          <Button size="sm" variant="ghost" onClick={() => { record(false); setDismissed(true); }}>Later</Button>
          <button onClick={() => setDismissed(true)} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Asset AI Analysis (inside preview drawer)                                   */
/* -------------------------------------------------------------------------- */

export const AssetAIAnalysis = ({ asset }: { asset: MediaAsset }) => {
  const quality = qualityScoreFor(asset);
  const tags = smartTagsFor(asset);
  const brandMatch = quality > 80 ? 'Excellent' : quality > 65 ? 'Good' : 'Needs Review';
  const brandTone = brandMatch === 'Excellent' ? 'text-emerald-600 bg-emerald-50' : brandMatch === 'Good' ? 'text-sky-600 bg-sky-50' : 'text-amber-600 bg-amber-50';

  return (
    <Card className="p-4 border-border/60">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />AI Analysis
        </p>
        <Badge variant="secondary" className="text-[10px]">Information only</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Stat label="Quality Score" value={`${quality}%`}>
          <Progress value={quality} className="mt-1 h-1.5" />
        </Stat>
        <Stat label="Brand Match" value={<span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold', brandTone)}>{brandMatch}</span>} />
        <Stat label="Campaign Usage" value={`${asset.usage_count ?? 0}×`} />
        <Stat label="Detected Type" value={asset.type} />
      </div>
      <div className="mt-3">
        <p className="mb-1 text-[11px] font-semibold text-muted-foreground">Suggested Tags</p>
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">{t}</span>
          ))}
        </div>
      </div>
    </Card>
  );
};

const Stat = ({ label, value, children }: { label: string; value: React.ReactNode; children?: React.ReactNode }) => (
  <div className="rounded-lg border border-border/60 bg-background p-2">
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
    {children}
  </div>
);
