import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageBackButton } from '@/components/navigation/PageBackButton';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAIContext } from '@/contexts/AIContext';
import { useBrandKits } from '@/hooks/useBrandKit';
import { AITemplateGeneratorService, type GeneratedTemplate } from '@/services/templates/generator';
import { DecisionService } from '@/services/ai';
import { useAuth } from '@/hooks/useAuth';
import { setPendingEditorTemplate } from '@/lib/templateEditorSession';
import {
  Sparkles,
  RefreshCw,
  Bookmark,
  Eye,
  Heart,
  Loader2,
  Building2,
  Diamond,
  Target,
  Instagram,
  ClipboardList,
  ChevronDown,
  CheckCircle,
  RotateCcw,
  Wand2,
} from 'lucide-react';

const PLATFORMS = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Pinterest', 'YouTube'] as const;
const FORMATS = ['Post', 'Story', 'Reel', 'Carousel', 'Banner'] as const;
const GOALS = ['Conversions', 'Awareness', 'Lead Gen', 'Engagement', 'Sale'] as const;
const VISUAL_STYLES = ['Minimal & Elegant', 'Bold & Modern', 'Playful & Fun', 'Luxury & Premium', 'Clean & Professional'] as const;
const COLOR_PREFERENCES = ['Brand Colors', 'Warm Tones', 'Cool Tones', 'Monochrome', 'Vibrant & Colorful'] as const;
const IMAGE_PREFERENCES = ['Product Focus', 'Lifestyle', 'Abstract', 'Model/Person', 'No People', 'Flat Design'] as const;
const TONE_OF_VOICE = ['Confident & Inspiring', 'Friendly & Warm', 'Professional & Trust', 'Urgent & Bold', 'Luxurious & Aspirational'] as const;
const SORT_OPTIONS = ['Best Match', 'Newest First', 'Highest Confidence'] as const;
const SAVED_PROMPTS_UNAVAILABLE = 'Saved prompts are not set up for this workspace yet.';

function savedPromptMessage(message: string) {
  if (/saved_prompts|schema cache|does not exist/i.test(message)) return SAVED_PROMPTS_UNAVAILABLE;
  return message;
}

type GeneratedCard = GeneratedTemplate & { id: string; favorited?: boolean };

type SavedPromptTable = {
  from: (table: 'saved_prompts') => {
    insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{ data: SavedPrompt[] | null; error: { message: string } | null }>;
    };
  };
};

type SavedPrompt = {
  id: string;
  name: string;
  preferences: {
    platform?: string;
    category?: string;
    goal?: string;
    visual_style?: string;
    color_preference?: string;
    image_preference?: string;
    tone_of_voice?: string;
    special_request?: string;
  } | null;
};

const TemplateGenerate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { effectiveContext, brand } = useAIContext();
  const { user } = useAuth();
  const { data: kits } = useBrandKits();

  const activeKit = kits?.find((k) => k.is_active) || kits?.[0];

  /* ---- Section 1 - AI Context ---- */
  const [workspace] = useState(brand?.name ?? activeKit?.name ?? 'Default Workspace');
  const [category, setCategory] = useState(effectiveContext?.active_category ?? 'Beauty');
  const [goal, setGoal] = useState(effectiveContext?.active_objective ?? 'Conversions');
  const [platform, setPlatform] = useState(effectiveContext?.active_platform ?? 'Instagram');
  const [campaignName] = useState('Summer Glow Launch');
  const [aiMode] = useState('Smart');

  /* ---- Section 2 - Additional Preferences ---- */
  const [visualStyle, setVisualStyle] = useState<string>(VISUAL_STYLES[0]);
  const [colorPreference, setColorPreference] = useState<string>(COLOR_PREFERENCES[0]);
  const [imagePreference, setImagePreference] = useState<string>(IMAGE_PREFERENCES[0]);
  const [toneOfVoice, setToneOfVoice] = useState<string>(TONE_OF_VOICE[0]);
  const [specialRequest, setSpecialRequest] = useState('');

  /* ---- Generation state ---- */
  const [generating, setGenerating] = useState(false);
  const [generatedTemplates, setGeneratedTemplates] = useState<GeneratedCard[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>(SORT_OPTIONS[0]);

  const [previewTemplate, setPreviewTemplate] = useState<GeneratedCard | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [promptsError, setPromptsError] = useState<string | null>(null);

  useEffect(() => {
    if (effectiveContext?.active_platform) {
      const p = effectiveContext.active_platform;
      const mapped = p.charAt(0).toUpperCase() + p.slice(1);
      if (PLATFORMS.includes(mapped as any)) setPlatform(mapped);
    }
    if (effectiveContext?.active_objective) {
      const g = effectiveContext.active_objective;
      const mapped = g.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (GOALS.includes(mapped as any)) setGoal(mapped);
    }
    if (effectiveContext?.active_category) {
      setCategory(effectiveContext.active_category);
    }
  }, [effectiveContext]);

  const contextRows = useMemo(() => [
    { icon: Building2, label: 'Workspace', value: workspace, bg: 'hsl(250 89% 65% / 0.16)', iconColor: '#6E56F5' },
    { icon: Diamond, label: 'Category', value: category, bg: '#DBEAFE', iconColor: '#2563EB' },
    { icon: Target, label: 'Goal', value: goal, bg: '#DCFCE7', iconColor: '#16A34A' },
    { icon: Instagram, label: 'Platform', value: platform === 'Instagram' ? 'Instagram Feed (1080×1080)' : platform, bg: '#FCE7F3', iconColor: '#DB2777' },
    { icon: ClipboardList, label: 'Campaign', value: campaignName, bg: '#FEF3C7', iconColor: '#D97706' },
    { icon: Sparkles, label: 'AI Mode', value: aiMode, bg: 'hsl(250 89% 65% / 0.16)', iconColor: '#6E56F5' },
  ], [workspace, category, goal, platform, campaignName, aiMode]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await AITemplateGeneratorService.generate({
        brand: brand ? {
          id: brand.id,
          name: brand.name,
          logo_url: activeKit?.logo_url ?? undefined,
          colors: [activeKit?.primary_color, activeKit?.secondary_color, activeKit?.accent_color].filter(Boolean) as string[],
          voice: (brand as any)?.voice ?? undefined,
          locked: false,
        } : null,
        category,
        goal: goal.toLowerCase(),
        platform: platform.toLowerCase(),
        prompt: specialRequest || null,
        userId: user?.id ?? null,
      });

      const card: GeneratedCard = { ...result, id: crypto.randomUUID() };
      setGeneratedTemplates((prev) => [card, ...prev]);

      if (user?.id) {
        await DecisionService.record(user.id, {
          signal: 'template_generation',
          action: 'generated_templates',
          confidence: result.confidence,
          reasoning: JSON.stringify(result.reasoning),
          page: 'template_generate',
          trigger_source: 'manual',
          category,
        });
      }

      toast({ title: 'Templates generated', description: '3 variations are ready to preview.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Generation failed', description: 'Could not generate templates. Please try again.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleUseTemplate = (t: GeneratedCard) => {
    setPendingEditorTemplate(t.template, 'ai');
    navigate('/visual-editor');
  };

  const handleSavePrompt = async () => {
    if (!user?.id) {
      toast({ title: 'Sign in to save prompts', variant: 'destructive' });
      return;
    }
    const { error } = await (supabase as unknown as SavedPromptTable).from('saved_prompts').insert({
      user_id: user.id,
      name: `${platform} · ${goal}`,
      preferences: {
        platform, category, goal,
        visual_style: visualStyle,
        color_preference: colorPreference,
        image_preference: imagePreference,
        tone_of_voice: toneOfVoice,
        special_request: specialRequest,
      },
    });
    if (error) {
      toast({ title: 'Could not save this prompt', description: savedPromptMessage(error.message), variant: 'destructive' });
      return;
    }
    toast({ title: 'Prompt saved', description: 'Open Saved Prompts to use this setup again.' });
  };

  const openSavedPrompts = async () => {
    setPromptsOpen(true);
    if (!user?.id) {
      setPromptsError('Sign in to see saved prompts.');
      setSavedPrompts([]);
      return;
    }
    setPromptsLoading(true);
    setPromptsError(null);
    try {
      const { data, error } = await (supabase as unknown as SavedPromptTable)
        .from('saved_prompts')
        .select('id,name,preferences')
        .eq('user_id', user.id);
    if (error) {
      setPromptsError(savedPromptMessage(error.message));
      setSavedPrompts([]);
      return;
    }
      setSavedPrompts(data ?? []);
    } catch (err) {
      setPromptsError(err instanceof Error ? err.message : 'Could not load saved prompts.');
      setSavedPrompts([]);
    } finally {
      setPromptsLoading(false);
    }
  };

  const applySavedPrompt = (prompt: SavedPrompt) => {
    const prefs = prompt.preferences ?? {};
    if (prefs.platform) setPlatform(prefs.platform);
    if (prefs.category) setCategory(prefs.category);
    if (prefs.goal) setGoal(prefs.goal);
    if (prefs.visual_style) setVisualStyle(prefs.visual_style);
    if (prefs.color_preference) setColorPreference(prefs.color_preference);
    if (prefs.image_preference) setImagePreference(prefs.image_preference);
    if (prefs.tone_of_voice) setToneOfVoice(prefs.tone_of_voice);
    if (typeof prefs.special_request === 'string') setSpecialRequest(prefs.special_request);
    setPromptsOpen(false);
    toast({ title: 'Prompt restored' });
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setGeneratedTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, favorited: !t.favorited } : t))
    );
  };

  const getInsightTags = () => [
    { label: 'Matches your brand style', bg: '#DCFCE7', color: '#16A34A' },
    { label: `Optimized for ${goal}`, bg: '#DBEAFE', color: '#2563EB' },
    { label: `Proven to perform in ${category}`, bg: '#FEF3C7', color: '#D97706' },
    { label: `Perfect for ${platform} Feed`, bg: '#FCE7F3', color: '#DB2777' },
  ];

  const displayTemplates = useMemo(() => {
    let list = [...generatedTemplates];
    if (sortBy === 'Newest First') {
      list = list.reverse();
    } else if (sortBy === 'Highest Confidence') {
      list.sort((a, b) => b.confidence - a.confidence);
    }
    return list;
  }, [generatedTemplates, sortBy]);

  const platformLabel = platform?.charAt(0).toUpperCase() + platform?.slice(1) || 'Instagram';

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="page-container py-6 lg:py-8">
        {/* PAGE HEADER */}
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <PageBackButton fallback="/templates" label="Back to templates" />
            <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold leading-tight text-foreground">
              AI Template{' '}
              <span className="whitespace-nowrap">
                Generator{' '}
                <span className="ml-1 inline-block translate-y-[-2px] rounded-md bg-primary/15 px-2 py-1 align-middle text-[11px] font-bold leading-none text-primary">
                  Beta
                </span>
              </span>
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Generate unique, high-converting marketing templates in seconds.
            </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-xl px-4 text-sm font-medium"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'hsl(var(--card))' }}
              onClick={() => setHistoryOpen(true)}
            >
              <RotateCcw className="h-4 w-4" /> Generation History
            </Button>
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-xl px-4 text-sm font-medium"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'hsl(var(--card))' }}
              onClick={() => void openSavedPrompts()}
            >
              <Bookmark className="h-4 w-4" /> Saved Prompts
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="h-10 gap-2 rounded-xl px-5 text-sm font-bold"
              style={{ background: '#6E56F5', color: 'white', border: 'none' }}
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Template</>
              )}
            </Button>
          </div>
        </header>

        {/* MAIN LAYOUT */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* LEFT COLUMN */}
          <div className="w-full shrink-0 lg:w-[340px]">
            <div className="space-y-6">
              {/* SECTION 1 — AI Context */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>1. AI Context</h3>
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>(Auto-filled)</span>
                  </div>
                  <button
                    className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
                    style={{ borderColor: 'hsl(var(--border))', color: '#6E56F5', background: 'transparent' }}
                  >
                    <Wand2 className="h-3 w-3" /> Edit Context
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  {contextRows.map((row) => {
                    const Icon = row.icon;
                    return (
                      <div
                        key={row.label}
                        className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
                      >
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full shrink-0"
                          style={{ background: row.bg }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: row.iconColor }} />
                        </div>
                        <span className="w-[100px] shrink-0 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {row.label}
                        </span>
                        <span className="truncate text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {row.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SECTION 2 — Additional Preferences */}
              <section>
                <h3 className="mb-4 text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>2. Additional Preferences</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Visual Style</Label>
                    <Select value={visualStyle} onValueChange={setVisualStyle}>
                      <SelectTrigger className="h-10 w-full rounded-lg border px-3 text-sm" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'hsl(var(--card))' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISUAL_STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Color Preference</Label>
                    <Select value={colorPreference} onValueChange={setColorPreference}>
                      <SelectTrigger className="h-10 w-full rounded-lg border px-3 text-sm" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'hsl(var(--card))' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_PREFERENCES.map((s) => (
                          <SelectItem key={s} value={s}>
                            <span className="flex items-center gap-2">
                              {s === 'Brand Colors' && (
                                <span className="inline-flex -space-x-1">
                                  <span className="h-3 w-3 rounded-full border border-white" style={{ background: activeKit?.primary_color || '#6E56F5' }} />
                                  <span className="h-3 w-3 rounded-full border border-white" style={{ background: activeKit?.secondary_color || 'hsl(250 89% 65% / 0.16)' }} />
                                </span>
                              )}
                              {s}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Image Preference</Label>
                    <Select value={imagePreference} onValueChange={setImagePreference}>
                      <SelectTrigger className="h-10 w-full rounded-lg border px-3 text-sm" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'hsl(var(--card))' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMAGE_PREFERENCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Tone of Voice</Label>
                    <Select value={toneOfVoice} onValueChange={setToneOfVoice}>
                      <SelectTrigger className="h-10 w-full rounded-lg border px-3 text-sm" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'hsl(var(--card))' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OF_VOICE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Special Request (Optional)
                  </Label>
                  <Textarea
                    value={specialRequest}
                    onChange={(e) => setSpecialRequest(e.target.value)}
                    placeholder="E.g. Include a badge for free shipping"
                    className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm"
                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', height: 80 }}
                  />
                </div>
              </section>

              {/* GENERATE BUTTON (sticky on desktop) */}
              <div className="lg:sticky lg:top-24">
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold"
                  style={{ background: generating ? '#8B74F8' : '#6E56F5', color: 'white', border: 'none' }}
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate Template</>
                  )}
                </Button>
                <p className="mt-1.5 text-center text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Uses 1 AI generation credit
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="min-w-0 flex-1">
            {generating ? (
              /* LOADING STATE */
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="overflow-hidden rounded-xl" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                      <Skeleton className="aspect-square w-full animate-pulse" style={{ background: 'linear-gradient(135deg, #F0F0F5, #E5E5EA)' }} />
                      <div className="p-3">
                        <div className="flex gap-2">
                          <Skeleton className="h-9 flex-1 rounded-lg" />
                          <Skeleton className="h-9 flex-1 rounded-lg" />
                          <Skeleton className="h-9 w-9 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="animate-pulse text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  ✨ Generating templates for {category} · {goal} · {platformLabel}...
                </p>
              </div>
            ) : generatedTemplates.length === 0 ? (
              /* EMPTY STATE */
              <div className="flex flex-col items-center justify-center py-20">
                <Sparkles className="h-16 w-16" style={{ color: '#C4B5FD' }} />
                <h3 className="mt-4 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  Your templates will appear here
                </h3>
                <p
                  className="mt-2 max-w-xs text-center text-sm leading-relaxed"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  Fill in your preferences and click Generate Template to create unique ad templates
                  tailored to your brand and goals.
                </p>
              </div>
            ) : (
              /* RESULTS */
              <div className="space-y-8">
                {/* SECTION 3 — Generated Templates */}
                <section>
                  <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>3. Generated Templates</h3>
                      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Choose your favorite or customize further in the editor.
                      </p>
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger
                        className="h-9 w-[160px] rounded-lg border px-3 text-sm"
                        style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {displayTemplates.slice(0, 3).map((t, idx) => (
                      <div
                        key={t.id}
                        className="relative overflow-hidden rounded-xl bg-card"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      >
                        {idx === 0 && (
                          <span
                            className="absolute left-3 top-3 z-10 rounded px-2 py-1 text-[10px] font-extrabold tracking-wider"
                            style={{ background: '#6E56F5', color: 'white' }}
                          >
                            BEST MATCH
                          </span>
                        )}
                        <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                          {(t.template as any)?.thumbnail_url ? (
                            <img
                              src={(t.template as any).thumbnail_url}
                              alt={t.template.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <div className="text-center">
                                <LayoutGrid className="mx-auto h-10 w-10" style={{ color: '#C4B5FD' }} />
                                <p className="mt-2 text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.template.name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 p-3">
                          <Button
                            variant="outline"
                            className="flex-1 gap-1.5 rounded-lg text-xs font-medium"
                            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', height: 36 }}
                            onClick={() => {
                              setPreviewTemplate(t);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </Button>
                          <Button
                            className="flex-1 gap-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: '#6E56F5', color: 'white', height: 36 }}
                            onClick={() => handleUseTemplate(t)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Use This
                          </Button>
                          <button
                            onClick={() => toggleFavorite(t.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border"
                            style={{ borderColor: 'hsl(var(--border))' }}
                          >
                            <Heart
                              className={`h-4 w-4 ${favorites.has(t.id) ? 'fill-red-500' : ''}`}
                              style={{ color: favorites.has(t.id) ? '#EF4444' : 'hsl(var(--muted-foreground))' }}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* SECTION 4 — Generation Insights */}
                <section>
                  <h3 className="text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>4. Generation Insights</h3>
                  <p className="mt-0.5 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Why these templates were recommended
                  </p>
                  <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex flex-1 flex-wrap gap-2">
                      {getInsightTags().map((tag) => (
                        <span
                          key={tag.label}
                          className="inline-block rounded-full px-3 py-1.5 text-xs font-medium"
                          style={{ background: tag.bg, color: tag.color }}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                    <div
                      className="w-full rounded-xl border bg-card p-4 text-center sm:w-[160px]"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      <p className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Confidence Score</p>
                      <p className="my-1 text-4xl font-extrabold" style={{ color: 'hsl(var(--foreground))' }}>
                        {Math.round((generatedTemplates[0]?.confidence ?? 0.96) * 100)}%
                      </p>
                      <p className="text-[11px] font-medium" style={{ color: '#22C55E' }}>
                        High match for your campaign
                      </p>
                    </div>
                  </div>
                </section>

                {/* SECTION 5 — Next Steps */}
                <section>
                  <h3 className="text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>5. Next Steps</h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <NextStepCard
                      icon={CheckCircle}
                      bg="rgba(110,86,245,0.16)"
                      color="#6E56F5"
                      title="Use Template"
                      description="Open in editor and customize to your liking."
                      onClick={() => generatedTemplates[0] && handleUseTemplate(generatedTemplates[0])}
                    />
                    <NextStepCard
                      icon={RotateCcw}
                      bg="#DBEAFE"
                      color="#2563EB"
                      title="Regenerate"
                      description="Generate new variations with different styles."
                      onClick={handleGenerate}
                    />
                    <NextStepCard
                      icon={Bookmark}
                      bg="#DCFCE7"
                      color="#16A34A"
                      title="Save as Prompt"
                      description="Save this setup to use again in the future."
                      onClick={handleSavePrompt}
                    />
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generation history</DialogTitle>
            <DialogDescription>Templates generated during this visit.</DialogDescription>
          </DialogHeader>
          {generatedTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No templates generated in this session yet.</p>
          ) : (
            <div className="space-y-2">
              {generatedTemplates.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-left hover:border-primary/40"
                  onClick={() => { setHistoryOpen(false); handleUseTemplate(item); }}
                >
                  <span className="truncate text-sm font-medium">{item.template?.name || 'Generated template'}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{Math.round(item.confidence * 100)}%</span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={promptsOpen} onOpenChange={setPromptsOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Saved prompts</DialogTitle>
            <DialogDescription>Setups stored on your account.</DialogDescription>
          </DialogHeader>
          {promptsLoading ? (
            <p className="text-sm text-muted-foreground">Loading saved prompts…</p>
          ) : promptsError ? (
            <p className="text-sm text-destructive">{promptsError}</p>
          ) : savedPrompts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved prompts yet.</p>
          ) : (
            <div className="space-y-2">
              {savedPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  className="w-full rounded-xl border border-border px-3 py-2 text-left text-sm font-medium hover:border-primary/40"
                  onClick={() => applySavedPrompt(prompt)}
                >
                  {prompt.name}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const NextStepCard = ({
  icon: Icon,
  bg,
  color,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  bg: string;
  color: string;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full rounded-xl border border-border bg-card p-4 text-left transition hover:shadow-md"
  >
    <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: bg }}>
      <Icon className="h-4 w-4" style={{ color }} />
    </div>
    <h4 className="mt-2.5 text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{title}</h4>
    <p className="mt-1 text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>{description}</p>
  </button>
);

const LayoutGrid = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

export default TemplateGenerate;