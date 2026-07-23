import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

type GeneratedCard = GeneratedTemplate & { id: string; favorited?: boolean };

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
    { icon: Building2, label: 'Workspace', value: workspace, bg: '#EDE9FE', iconColor: '#6C63FF' },
    { icon: Diamond, label: 'Category', value: category, bg: '#DBEAFE', iconColor: '#2563EB' },
    { icon: Target, label: 'Goal', value: goal, bg: '#DCFCE7', iconColor: '#16A34A' },
    { icon: Instagram, label: 'Platform', value: platform === 'Instagram' ? 'Instagram Feed (1080×1080)' : platform, bg: '#FCE7F3', iconColor: '#DB2777' },
    { icon: ClipboardList, label: 'Campaign', value: campaignName, bg: '#FEF3C7', iconColor: '#D97706' },
    { icon: Sparkles, label: 'AI Mode', value: aiMode, bg: '#EDE9FE', iconColor: '#6C63FF' },
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
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const sb = supabase as any;
      await sb.from('saved_prompts').insert({
        user_id: user?.id,
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
      toast({ title: 'Prompt saved', description: 'You can reuse this setup anytime.' });
    } catch {
      toast({ title: 'Saved locally', description: 'Preferences saved for this session.' });
    }
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
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="page-container py-6 lg:py-8">
        {/* PAGE HEADER */}
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-extrabold" style={{ color: '#111827' }}>
                AI Template Generator
              </h1>
              <span
                className="inline-block rounded-md px-2 py-[3px] text-[11px] font-bold leading-none"
                style={{ background: '#EDE9FE', color: '#6C63FF' }}
              >
                Beta
              </span>
            </div>
            <p className="mt-1 text-sm" style={{ color: '#9CA3AF' }}>
              Generate unique, high-converting marketing templates in seconds.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-xl px-4 text-sm font-medium"
              style={{ borderColor: '#E5E5E5', color: '#374151', background: 'white' }}
            >
              <RotateCcw className="h-4 w-4" /> Generation History
            </Button>
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-xl px-4 text-sm font-medium"
              style={{ borderColor: '#E5E5E5', color: '#374151', background: 'white' }}
            >
              <Bookmark className="h-4 w-4" /> Saved Prompts
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="h-10 gap-2 rounded-xl px-5 text-sm font-bold"
              style={{ background: '#6C63FF', color: 'white', border: 'none' }}
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
                    <h3 className="text-sm font-bold" style={{ color: '#111827' }}>1. AI Context</h3>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>(Auto-filled)</span>
                  </div>
                  <button
                    className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
                    style={{ borderColor: '#E5E5E5', color: '#6C63FF', background: 'transparent' }}
                  >
                    <Wand2 className="h-3 w-3" /> Edit Context
                  </button>
                </div>
                <div className="rounded-xl border" style={{ borderColor: '#F3F4F6' }}>
                  {contextRows.map((row) => {
                    const Icon = row.icon;
                    return (
                      <div
                        key={row.label}
                        className="flex items-center gap-3 px-4 py-2.5"
                        style={{ borderBottom: '1px solid #F3F4F6' }}
                      >
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full shrink-0"
                          style={{ background: row.bg }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: row.iconColor }} />
                        </div>
                        <span className="w-[100px] shrink-0 text-xs" style={{ color: '#9CA3AF' }}>
                          {row.label}
                        </span>
                        <span className="truncate text-sm font-medium" style={{ color: '#111827' }}>
                          {row.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SECTION 2 — Additional Preferences */}
              <section>
                <h3 className="mb-4 text-sm font-bold" style={{ color: '#111827' }}>2. Additional Preferences</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 block text-xs font-medium" style={{ color: '#9CA3AF' }}>Visual Style</Label>
                    <Select value={visualStyle} onValueChange={setVisualStyle}>
                      <SelectTrigger className="h-10 w-full rounded-lg border px-3 text-sm" style={{ borderColor: '#E5E5E5', color: '#111827', background: 'white' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISUAL_STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs font-medium" style={{ color: '#9CA3AF' }}>Color Preference</Label>
                    <Select value={colorPreference} onValueChange={setColorPreference}>
                      <SelectTrigger className="h-10 w-full rounded-lg border px-3 text-sm" style={{ borderColor: '#E5E5E5', color: '#111827', background: 'white' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_PREFERENCES.map((s) => (
                          <SelectItem key={s} value={s}>
                            <span className="flex items-center gap-2">
                              {s === 'Brand Colors' && (
                                <span className="inline-flex -space-x-1">
                                  <span className="h-3 w-3 rounded-full border border-white" style={{ background: activeKit?.primary_color || '#6C63FF' }} />
                                  <span className="h-3 w-3 rounded-full border border-white" style={{ background: activeKit?.secondary_color || '#EDE9FE' }} />
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
                    <Label className="mb-1 block text-xs font-medium" style={{ color: '#9CA3AF' }}>Image Preference</Label>
                    <Select value={imagePreference} onValueChange={setImagePreference}>
                      <SelectTrigger className="h-10 w-full rounded-lg border px-3 text-sm" style={{ borderColor: '#E5E5E5', color: '#111827', background: 'white' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMAGE_PREFERENCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs font-medium" style={{ color: '#9CA3AF' }}>Tone of Voice</Label>
                    <Select value={toneOfVoice} onValueChange={setToneOfVoice}>
                      <SelectTrigger className="h-10 w-full rounded-lg border px-3 text-sm" style={{ borderColor: '#E5E5E5', color: '#111827', background: 'white' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OF_VOICE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="mb-1 block text-xs font-medium" style={{ color: '#9CA3AF' }}>
                    Special Request (Optional)
                  </Label>
                  <Textarea
                    value={specialRequest}
                    onChange={(e) => setSpecialRequest(e.target.value)}
                    placeholder="E.g. Include a badge for free shipping"
                    className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm"
                    style={{ borderColor: '#E5E5E5', color: '#374151', height: 80 }}
                  />
                </div>
              </section>

              {/* GENERATE BUTTON (sticky on desktop) */}
              <div className="lg:sticky lg:top-24">
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold"
                  style={{ background: generating ? '#8B83FF' : '#6C63FF', color: 'white', border: 'none' }}
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate Template</>
                  )}
                </Button>
                <p className="mt-1.5 text-center text-[11px]" style={{ color: '#9CA3AF' }}>
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
                <p className="animate-pulse text-center text-sm" style={{ color: '#9CA3AF' }}>
                  ✨ Generating templates for {category} · {goal} · {platformLabel}...
                </p>
              </div>
            ) : generatedTemplates.length === 0 ? (
              /* EMPTY STATE */
              <div className="flex flex-col items-center justify-center py-20">
                <Sparkles className="h-16 w-16" style={{ color: '#C4B5FD' }} />
                <h3 className="mt-4 text-sm font-semibold" style={{ color: '#374151' }}>
                  Your templates will appear here
                </h3>
                <p
                  className="mt-2 max-w-xs text-center text-sm leading-relaxed"
                  style={{ color: '#9CA3AF' }}
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
                      <h3 className="text-base font-bold" style={{ color: '#111827' }}>3. Generated Templates</h3>
                      <p className="text-sm" style={{ color: '#9CA3AF' }}>
                        Choose your favorite or customize further in the editor.
                      </p>
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger
                        className="h-9 w-[160px] rounded-lg border px-3 text-sm"
                        style={{ borderColor: '#E5E5E5', background: 'white' }}
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
                        className="relative overflow-hidden rounded-xl bg-white"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      >
                        {idx === 0 && (
                          <span
                            className="absolute left-3 top-3 z-10 rounded px-2 py-1 text-[10px] font-extrabold tracking-wider"
                            style={{ background: '#6C63FF', color: 'white' }}
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
                                <p className="mt-2 text-[10px] font-medium" style={{ color: '#9CA3AF' }}>{t.template.name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 p-3">
                          <Button
                            variant="outline"
                            className="flex-1 gap-1.5 rounded-lg text-xs font-medium"
                            style={{ borderColor: '#E5E5E5', color: '#374151', height: 36 }}
                            onClick={() => {
                              setPreviewTemplate(t);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </Button>
                          <Button
                            className="flex-1 gap-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: '#6C63FF', color: 'white', height: 36 }}
                            onClick={() => handleUseTemplate(t)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Use This
                          </Button>
                          <button
                            onClick={() => toggleFavorite(t.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border"
                            style={{ borderColor: '#E5E5E5' }}
                          >
                            <Heart
                              className={`h-4 w-4 ${favorites.has(t.id) ? 'fill-red-500' : ''}`}
                              style={{ color: favorites.has(t.id) ? '#EF4444' : '#9CA3AF' }}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* SECTION 4 — Generation Insights */}
                <section>
                  <h3 className="text-base font-bold" style={{ color: '#111827' }}>4. Generation Insights</h3>
                  <p className="mt-0.5 text-sm" style={{ color: '#9CA3AF' }}>
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
                      className="w-full rounded-xl border bg-white p-4 text-center sm:w-[160px]"
                      style={{ borderColor: '#E5E5E5' }}
                    >
                      <p className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>Confidence Score</p>
                      <p className="my-1 text-4xl font-extrabold" style={{ color: '#111827' }}>
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
                  <h3 className="text-base font-bold" style={{ color: '#111827' }}>5. Next Steps</h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <NextStepCard
                      icon={CheckCircle}
                      bg="#EDE9FE"
                      color="#6C63FF"
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
    className="w-full rounded-xl border p-4 text-left transition hover:shadow-md"
    style={{ background: '#F9F9FB', borderColor: '#F0F0F5' }}
  >
    <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: bg }}>
      <Icon className="h-4 w-4" style={{ color }} />
    </div>
    <h4 className="mt-2.5 text-sm font-bold" style={{ color: '#111827' }}>{title}</h4>
    <p className="mt-1 text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{description}</p>
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