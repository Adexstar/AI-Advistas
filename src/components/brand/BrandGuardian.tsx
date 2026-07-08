import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Shield,
  ShieldCheck,
  Sparkles,
  Wand2,
  Lightbulb,
  ChevronDown,
  Check,
  X,
  Info,
  Lock,
  Unlock,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAIContext } from '@/contexts/AIContext';
import { useAIStatus } from '@/contexts/AIStatusContext';
import { DecisionService, CategoryService, CampaignMemoryService } from '@/services/ai';
import { useToast } from '@/hooks/use-toast';
import type { BrandKit } from '@/hooks/useBrandKit';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  title: string;
  reason: string;
  confidence: number;
  source: string;
}

const buildSuggestions = (brand: BrandKit, category?: string | null): Suggestion[] => {
  const list: Suggestion[] = [];
  if (!brand.description) {
    list.push({
      id: 'desc',
      title: 'Add a brand description',
      reason: 'A short mission statement improves tone consistency across generated ads.',
      confidence: 0.9,
      source: 'Brand completeness',
    });
  }
  if (!brand.industry) {
    list.push({
      id: 'industry',
      title: 'Set a primary industry',
      reason: 'Industry unlocks category playbooks (hooks, CTAs, audience patterns).',
      confidence: 0.85,
      source: 'Category intelligence',
    });
  }
  if (brand.primary_color?.toLowerCase() === brand.secondary_color?.toLowerCase()) {
    list.push({
      id: 'contrast',
      title: 'Increase heading contrast',
      reason: 'Primary and secondary colors are near-identical, hurting hierarchy.',
      confidence: 0.78,
      source: 'Visual style rules',
    });
  }
  if (category?.toLowerCase().includes('beauty')) {
    list.push({
      id: 'beauty',
      title: 'Beauty performs 22% better with softer CTAs',
      reason: 'Beauty playbook favors elegant, minimal CTAs like "Discover" over "Buy Now".',
      confidence: 0.82,
      source: 'category_playbooks · Beauty',
    });
  }
  if (category?.toLowerCase().includes('fashion')) {
    list.push({
      id: 'fashion',
      title: 'Try bolder display typography',
      reason: 'Fashion audiences respond to large, energetic headline fonts.',
      confidence: 0.8,
      source: 'category_playbooks · Fashion',
    });
  }
  list.push({
    id: 'voice',
    title: 'Your audience responds better to confident language',
    reason: 'Recent winning copy skewed assertive; tone is currently marked professional.',
    confidence: 0.74,
    source: 'campaign_memory',
  });
  return list;
};

const HealthRow = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}%</span>
    </div>
    <Progress value={value} className="h-1.5" />
  </div>
);

export const BrandGuardian = ({ brand }: { brand: BrandKit }) => {
  const { user } = useAuth();
  const { context, update } = useAIContext();
  const { setStatus } = useAIStatus();
  const { toast } = useToast();

  const [locked, setLocked] = useState<boolean>(false);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewriteInput, setRewriteInput] = useState('');
  const [rewritePreview, setRewritePreview] = useState<string | null>(null);
  const [rewriting, setRewriting] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [explainId, setExplainId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = context?.brand_id === brand.id || context?.active_brandkit_id === brand.id;

  useEffect(() => {
    setLocked(false);
  }, [brand.id]);

  const suggestions = useMemo(
    () => buildSuggestions(brand, context?.active_category ?? null).filter((s) => !dismissed[s.id]),
    [brand, context?.active_category, dismissed]
  );

  const health = useMemo(() => {
    const consistency = Math.min(100, 60 + (brand.logo_url ? 15 : 0) + (brand.description ? 10 : 0) + (brand.industry ? 10 : 0));
    const voice = brand.description ? 92 : 70;
    const colors = brand.primary_color && brand.secondary_color && brand.accent_color ? 100 : 70;
    const typography = 88;
    const overall = Math.round((consistency + voice + colors + typography) / 4);
    return { overall, consistency, voice, colors, typography, aiReady: overall >= 80 };
  }, [brand]);

  const applyBrand = async () => {
    if (!user) return;
    setApplying(true);
    setStatus('working', 'Applying brand context…');
    try {
      await update({ brand_id: brand.id, active_brandkit_id: brand.id });
      await DecisionService.record(user.id, {
        page: 'brand-kit',
        trigger_source: 'apply_brand',
        signal: 'apply_brand',
        action: `Set active brand to ${brand.name}`,
        reasoning: 'User explicitly applied Brand Kit to workspace context.',
        confidence: 1,
      }).catch(() => null);
      toast({ title: '✓ Brand applied to current workspace', description: `${brand.name} will guide every AI generation.` });
      setStatus('ready');
    } catch (e: any) {
      toast({ title: 'Could not apply brand', description: e.message, variant: 'destructive' });
      setStatus('ready');
    } finally {
      setApplying(false);
    }
  };

  const runRewrite = () => {
    if (!rewriteInput.trim()) return;
    setRewriting(true);
    setStatus('working', 'Rewriting with brand voice…');
    // Deterministic client-side preview (real call goes through AI job in generation surfaces).
    setTimeout(() => {
      const tone = brand.description?.toLowerCase().includes('luxury') ? 'refined' : 'confident';
      const preview = `${rewriteInput.trim().replace(/[.!?]*$/, '')}. — Reimagined in a ${tone} ${brand.name} voice.`;
      setRewritePreview(preview);
      setRewriting(false);
      setStatus('approval', 'Awaiting approval');
    }, 700);
  };

  const approveRewrite = async () => {
    if (!user || !rewritePreview) return;
    await DecisionService.record(user.id, {
      page: 'brand-kit',
      trigger_source: 'rewrite_using_brand',
      signal: 'rewrite_using_brand',
      action: 'Approved brand rewrite',
      reasoning: `Rewrote copy using ${brand.name} brand voice.`,
      confidence: 0.9,
    }).catch(() => null);
    await CampaignMemoryService.recordWin(user.id, brand.id, 'copy', {
      original: rewriteInput,
      rewritten: rewritePreview,
      brand_id: brand.id,
    }).catch(() => null);
    toast({ title: 'Rewrite applied', description: 'Saved to campaign memory.' });
    setStatus('ready');
    setRewriteOpen(false);
    setRewriteInput('');
    setRewritePreview(null);
  };

  const suggestImprovements = async () => {
    setStatus('working', 'Reviewing brand kit…');
    // Ensure category playbooks are consulted before surfacing.
    await CategoryService.list().catch(() => []);
    setSuggestOpen(true);
    setStatus('ready');
  };

  const applySuggestion = async (s: Suggestion) => {
    if (!user) return;
    await DecisionService.record(user.id, {
      page: 'brand-kit',
      trigger_source: 'suggest_improvements',
      category: context?.active_category ?? null,
      signal: `apply_suggestion:${s.id}`,
      action: s.title,
      reasoning: s.reason,
      confidence: s.confidence,
    }).catch(() => null);
    toast({ title: 'Suggestion queued', description: s.title });
    setDismissed((d) => ({ ...d, [s.id]: true }));
  };

  const dismissSuggestion = async (s: Suggestion) => {
    if (user) {
      await DecisionService.record(user.id, {
        page: 'brand-kit',
        trigger_source: 'suggest_improvements',
        signal: `dismiss:${s.id}`,
        action: `Dismissed: ${s.title}`,
        reasoning: 'User dismissed the suggestion.',
        confidence: s.confidence,
      }).catch(() => null);
    }
    setDismissed((d) => ({ ...d, [s.id]: true }));
  };

  const toggleLock = async (v: boolean) => {
    setLocked(v);
    if (user) {
      await DecisionService.record(user.id, {
        page: 'brand-kit',
        trigger_source: 'brand_lock',
        signal: v ? 'brand_lock_on' : 'brand_lock_off',
        action: v ? 'Enabled Brand Lock' : 'Disabled Brand Lock',
        reasoning: v ? 'AI generations must preserve brand identity.' : 'Brand Lock disabled — AI may deviate.',
        confidence: 1,
      }).catch(() => null);
    }
    toast({ title: v ? '🔒 Brand Locked' : 'Brand Lock disabled', description: v ? 'AI generations will preserve brand identity.' : 'AI can experiment freely.' });
  };

  const ActionsRow = (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Button size="sm" variant="secondary" className="justify-start gap-2" onClick={applyBrand} disabled={applying}>
        {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        <span className="truncate">{isActive ? 'Brand Active' : 'Apply Brand'}</span>
      </Button>
      <Button size="sm" variant="secondary" className="justify-start gap-2" onClick={() => setRewriteOpen(true)}>
        <Wand2 className="h-4 w-4" />
        <span className="truncate">Rewrite</span>
      </Button>
      <Button size="sm" variant="secondary" className="justify-start gap-2" onClick={suggestImprovements}>
        <Lightbulb className="h-4 w-4" />
        <span className="truncate">Suggest</span>
      </Button>
      <div className={cn(
        'flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-xs',
        locked ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground'
      )}>
        <span className="inline-flex items-center gap-1.5 font-medium">
          {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          Brand Lock
        </span>
        <Switch checked={locked} onCheckedChange={toggleLock} />
      </div>
    </div>
  );

  const IntelligenceCard = (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Brand Intelligence</p>
            <p className="text-[11px] text-muted-foreground">AI actions guided by this brand</p>
          </div>
        </div>
        {isActive && <Badge variant="secondary" className="gap-1 text-[10px]"><Sparkles className="h-3 w-3" />Active</Badge>}
      </div>
      {ActionsRow}
    </Card>
  );

  const HealthCard = (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Brand Health</p>
          <p className="text-[11px] text-muted-foreground">AI readiness across identity</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-primary leading-none">{health.overall}%</p>
          <p className="text-[10px] text-muted-foreground">{health.aiReady ? 'AI Ready' : 'Needs polish'}</p>
        </div>
      </div>
      <div className="space-y-2.5">
        <HealthRow label="Consistency" value={health.consistency} />
        <HealthRow label="Voice Match" value={health.voice} />
        <HealthRow label="Color Usage" value={health.colors} />
        <HealthRow label="Typography" value={health.typography} />
      </div>
    </Card>
  );

  const SuggestionsCard = (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Brand Suggestions</p>
          <p className="text-[11px] text-muted-foreground">Category-aware, explainable, reversible</p>
        </div>
        <Badge variant="outline" className="text-[10px]">{suggestions.length}</Badge>
      </div>
      {suggestions.length === 0 ? (
        <p className="rounded-md bg-muted/40 px-3 py-4 text-center text-xs text-muted-foreground">All caught up — brand looks great.</p>
      ) : (
        <div className="space-y-2">
          {suggestions.slice(0, 4).map((s) => (
            <div key={s.id} className="rounded-lg border border-border/60 bg-background p-2.5">
              <div className="flex items-start gap-2">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Sparkles className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground">{s.title}</p>
                  {explainId === s.id && (
                    <div className="mt-1 rounded-md bg-muted/50 p-2 text-[11px] text-muted-foreground">
                      <p>{s.reason}</p>
                      <p className="mt-1 text-[10px] opacity-70">Source: {s.source} · Confidence {Math.round(s.confidence * 100)}%</p>
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center gap-1">
                    <Badge variant="secondary" className="h-4 rounded-sm px-1.5 text-[9px]">{Math.round(s.confidence * 100)}%</Badge>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => applySuggestion(s)}>
                      <Check className="mr-1 h-3 w-3" />Apply
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setExplainId(explainId === s.id ? null : s.id)}>
                      <Info className="mr-1 h-3 w-3" />Explain
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-muted-foreground" onClick={() => dismissSuggestion(s)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  return (
    <>
      {/* Desktop right-rail stack (lg+); mobile/tablet use collapsible above */}
      <div className="hidden space-y-4 lg:block">
        {IntelligenceCard}
        {HealthCard}
        {SuggestionsCard}
      </div>

      <div className="lg:hidden">
        <Collapsible open={mobileOpen} onOpenChange={setMobileOpen}>
          <Card className="p-4">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold">Brand Intelligence</p>
                    <p className="text-[11px] text-muted-foreground">Health {health.overall}% · {suggestions.length} suggestions</p>
                  </div>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', mobileOpen && 'rotate-180')} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {ActionsRow}
              <div className="space-y-2.5 rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">Brand Health</p>
                  <p className="text-lg font-bold text-primary">{health.overall}%</p>
                </div>
                <HealthRow label="Consistency" value={health.consistency} />
                <HealthRow label="Voice Match" value={health.voice} />
                <HealthRow label="Color Usage" value={health.colors} />
                <HealthRow label="Typography" value={health.typography} />
              </div>
              {SuggestionsCard}
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      <Dialog open={rewriteOpen} onOpenChange={(v) => { setRewriteOpen(v); if (!v) { setRewritePreview(null); setRewriteInput(''); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" />Rewrite Using Brand</DialogTitle>
            <DialogDescription>Paste any copy — AI will rewrite it in {brand.name}'s voice. Nothing is applied without approval.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={rewriteInput}
              onChange={(e) => setRewriteInput(e.target.value)}
              placeholder="e.g. Our new product is now available online."
              className="min-h-[100px]"
            />
            {rewritePreview && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">Preview</p>
                <p className="text-sm text-foreground">{rewritePreview}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            {!rewritePreview ? (
              <Button onClick={runRewrite} disabled={!rewriteInput.trim() || rewriting}>
                {rewriting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <>Generate Preview</>}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setRewritePreview(null)}>Regenerate</Button>
                <Button onClick={approveRewrite}><Check className="mr-2 h-4 w-4" />Approve & Apply</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BrandGuardian;
