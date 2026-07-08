import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Bookmark, Check, ChevronRight, CircleDollarSign,
  Eye, Facebook, Image as ImageIcon, Instagram, Layers, Linkedin, Loader2,
  MapPin, Palette, Rocket, Save, Send, Sparkles, Target, Upload, Users, Video, Wand2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBrandKits } from '@/hooks/useBrandKit';
import { AIContextBar } from '@/components/dashboard/AIContextBar';
import { AICreativeAssistant } from '@/components/ai/AICreativeAssistant';
import { AIRecommendationBanner } from '@/components/dashboard/AIRecommendationBanner';

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type FormValues = {
  // Step 1 — Offer
  name: string;
  category: string;
  objective: string;
  description: string;
  websiteUrl: string;
  cta: string;
  // Step 2 — Creative
  primaryText: string;
  headline: string;
  descriptionCopy: string;
  mediaUrl: string;
  templateSource: string;
  // Step 3 — Audience
  location: string;
  ageMin: number;
  ageMax: number;
  gender: string;
  interests: string;
  behaviors: string;
  languages: string;
  placements: string[];
  budgetGoal: string;
  // Step 4 — Budget
  dailyBudget: number;
  lifetimeBudget: number;
  startDate: string;
  endDate: string;
  bidding: string;
  allocation: string;
};

const STEPS = [
  { id: 1, label: 'Offer', icon: Target, hint: 'Campaign & Goal' },
  { id: 2, label: 'Creative', icon: Palette, hint: 'Design Your Ad' },
  { id: 3, label: 'Audience', icon: Users, hint: 'Target People' },
  { id: 4, label: 'Budget', icon: CircleDollarSign, hint: 'Spend & Schedule' },
  { id: 5, label: 'Review', icon: Rocket, hint: 'Finalize & Publish' },
] as const;

const OBJECTIVES = [
  { v: 'awareness', l: 'Awareness' },
  { v: 'traffic', l: 'Traffic' },
  { v: 'leads', l: 'Leads' },
  { v: 'sales', l: 'Sales' },
  { v: 'app_installs', l: 'App Installs' },
  { v: 'conversions', l: 'Conversions' },
];

const CTAS = ['Shop Now', 'Buy Now', 'Learn More', 'Sign Up', 'Contact', 'Download'];

const PLATFORMS = [
  { v: 'facebook', l: 'Facebook', icon: Facebook, color: 'bg-blue-500/10 text-blue-600' },
  { v: 'instagram', l: 'Instagram', icon: Instagram, color: 'bg-pink-500/10 text-pink-600' },
  { v: 'tiktok', l: 'TikTok', icon: Video, color: 'bg-slate-900/10 text-slate-900 dark:text-slate-100' },
  { v: 'linkedin', l: 'LinkedIn', icon: Linkedin, color: 'bg-sky-500/10 text-sky-700' },
];

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn('rounded-2xl border-border/60 shadow-sm', className)}>
      <CardContent className="p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}

function Field({
  label, hint, children, required,
}: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AISuggestionBar({ actions, onAction }: { actions: string[]; onAction: (a: string) => void }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="h-3.5 w-3.5" /> AI Suggestions
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button key={a} type="button" size="sm" variant="outline"
            onClick={() => onAction(a)} className="rounded-full h-8 text-xs">
            <Wand2 className="mr-1.5 h-3 w-3" /> {a}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live Preview                                                        */
/* ------------------------------------------------------------------ */

function LivePreview({ v, brandName }: { v: FormValues; brandName: string }) {
  const [tab, setTab] = useState('mobile');
  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5 h-9">
          <TabsTrigger value="mobile" className="text-xs">Mobile</TabsTrigger>
          <TabsTrigger value="desktop" className="text-xs">Desktop</TabsTrigger>
          <TabsTrigger value="feed" className="text-xs">Feed</TabsTrigger>
          <TabsTrigger value="story" className="text-xs">Story</TabsTrigger>
          <TabsTrigger value="carousel" className="text-xs">Carousel</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className={cn(
        'mx-auto overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm',
        tab === 'story' ? 'aspect-[9/16] max-w-[220px]' :
          tab === 'desktop' ? 'w-full' : 'max-w-[300px]'
      )}>
        {/* header */}
        <div className="flex items-center gap-2 border-b border-border/60 p-2.5">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/50" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{brandName || 'Your Brand'}</p>
            <p className="text-[10px] text-muted-foreground">Sponsored</p>
          </div>
        </div>
        {/* body text */}
        <div className="px-3 pt-2">
          <p className="line-clamp-3 text-xs leading-snug">
            {v.primaryText || 'Your primary ad text will appear here. Add compelling copy that hooks your audience.'}
          </p>
        </div>
        {/* media */}
        <div className={cn(
          'mt-2 flex items-center justify-center overflow-hidden bg-muted/50',
          tab === 'story' ? 'aspect-[9/16]' : 'aspect-square'
        )}>
          {v.mediaUrl ? (
            <img src={v.mediaUrl} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <p className="text-[10px]">Upload media</p>
            </div>
          )}
        </div>
        {/* footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border/60 p-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold">
              {v.headline || 'Your headline goes here'}
            </p>
            {v.descriptionCopy && (
              <p className="truncate text-[10px] text-muted-foreground">{v.descriptionCopy}</p>
            )}
          </div>
          <Button size="sm" className="h-7 shrink-0 rounded-md px-2 text-[10px]">
            {v.cta || 'Shop Now'}
          </Button>
        </div>
      </div>

      <p className="rounded-lg bg-muted/50 p-2 text-center text-[10px] text-muted-foreground">
        Preview is an approximation and may differ from the actual ad on each platform.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress card                                                        */
/* ------------------------------------------------------------------ */

function ProgressCard({
  step, setStep, completion, readiness,
}: { step: number; setStep: (n: number) => void; completion: number; readiness: number }) {
  return (
    <SectionCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setup Progress</p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-2xl font-bold">{completion}%</span>
            <span className="text-xs text-muted-foreground">Complete</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-800/50 dark:bg-emerald-950/50">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {readiness}% Ready
          </span>
        </div>
      </div>

      <Progress value={completion} className="h-1.5" />

      <div className="mt-5 grid grid-cols-5 gap-1 sm:gap-2">
        {STEPS.map((s, i) => {
          const active = step === s.id;
          const done = step > s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={cn(
                'group relative flex flex-col items-center gap-1.5 rounded-xl p-2 text-center transition',
                active && 'bg-primary/10',
                !active && 'hover:bg-muted/60'
              )}
            >
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition',
                done ? 'bg-emerald-500 text-white' :
                  active ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' :
                    'bg-muted text-muted-foreground'
              )}>
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-tight sm:text-xs',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="absolute right-[-4px] top-[22px] hidden sm:block">
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export default function CreateAd() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: brandKits = [] } = useBrandKits();
  const brandName = brandKits[0]?.name ?? 'Your Brand';

  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { register, watch, control, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: '', category: '', objective: 'conversions', description: '', websiteUrl: '', cta: 'Shop Now',
      primaryText: '', headline: '', descriptionCopy: '', mediaUrl: '', templateSource: 'advista',
      location: 'United States', ageMin: 18, ageMax: 45, gender: 'all',
      interests: '', behaviors: '', languages: 'English', placements: ['facebook', 'instagram'],
      budgetGoal: 'balanced',
      dailyBudget: 25, lifetimeBudget: 500,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      bidding: 'lowest_cost', allocation: 'auto',
    },
  });

  const values = watch();

  /* ---------- Completion & Readiness scoring ---------- */
  const { completion, readiness, checks } = useMemo(() => {
    const c1 = !!values.name && !!values.objective;
    const c2 = !!values.primaryText && !!values.headline;
    const c3 = values.placements.length > 0 && !!values.location;
    const c4 = values.dailyBudget > 0 || values.lifetimeBudget > 0;
    const done = [c1, c2, c3, c4].filter(Boolean).length;
    const completion = Math.round((done / 4) * 100);

    const checks = [
      { ok: !!brandKits.length, label: 'Brand Applied' },
      { ok: !!values.cta, label: 'CTA Set' },
      { ok: (values.headline?.length || 0) > 6, label: 'Strong Headline' },
      { ok: values.placements.length > 0, label: 'Audience Placements' },
      { ok: !!values.mediaUrl, label: 'Creative Media' },
    ];
    const readiness = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

    return { completion, readiness, checks };
  }, [values, brandKits.length]);

  /* ---------- Save draft ---------- */
  const saveDraft = useCallback(async (silent = false): Promise<string | null> => {
    if (!user) return null;
    setSaving(true);
    try {
      const platform = values.placements.join(',');
      const payload = {
        user_id: user.id,
        name: values.name || 'Untitled Campaign',
        objective: values.objective,
        platform,
        budget: Number(values.dailyBudget) || 0,
        start_date: values.startDate || null,
        end_date: values.endDate || null,
        status: 'draft' as const,
      };

      let id = draftId;
      if (id) {
        const { error } = await supabase.from('campaigns').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('campaigns').insert(payload).select().single();
        if (error) throw error;
        id = data.id;
        setDraftId(id);
      }
      setLastSavedAt(new Date());
      if (!silent) toast.success('Draft saved');
      return id;
    } catch (e: any) {
      if (!silent) toast.error(e.message || 'Failed to save draft');
      return null;
    } finally {
      setSaving(false);
    }
  }, [user, values, draftId]);

  /* ---------- Autosave (debounced) ---------- */
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user || !values.name) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => { void saveDraft(true); }, 4000);
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.name, values.objective, values.dailyBudget, values.placements.join(','), values.startDate, values.endDate]);

  const publish = handleSubmit(async () => {
    if (!values.name) { toast.error('Campaign name is required'); setStep(1); return; }
    if (!values.placements.length) { toast.error('Select at least one placement'); setStep(3); return; }
    setPublishing(true);
    const id = await saveDraft(true);
    if (id) {
      await supabase.from('campaigns').update({ status: 'active' }).eq('id', id);
      toast.success('Campaign published!');
      navigate('/campaigns');
    }
    setPublishing(false);
  });

  const goToTemplate = () => navigate('/template-library');
  const goToEditor = () => navigate('/visual-editor');
  const goToMedia = () => navigate('/media-library');

  /* ---------- AI stub (interfaces ready for wiring) ---------- */
  const applyAI = (action: string) => {
    toast.message(`${action}`, { description: 'AI hook ready — will populate suggestions once connected.' });
  };

  /* ---------- Placement toggle ---------- */
  const togglePlacement = (v: string) => {
    const set = new Set(values.placements);
    set.has(v) ? set.delete(v) : set.add(v);
    setValue('placements', Array.from(set), { shouldDirty: true });
  };

  /* ---------- Media upload ---------- */
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = async (f: File) => {
    if (!user) return;
    const path = `${user.id}/creatives/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from('media-library').upload(path, f);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from('media-library').getPublicUrl(path);
    setValue('mediaUrl', data.publicUrl);
    toast.success('Media uploaded');
  };

  /* ---------- Steps content ---------- */
  const StepOffer = (
    <div className="space-y-5">
      <SectionCard>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Campaign & Goal</h3>
          <p className="text-xs text-muted-foreground">Choose the campaign objective and define your ad.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Campaign Name" required>
            <Input placeholder="Summer Sale Campaign" {...register('name', { required: true })} />
          </Field>
          <Field label="Business Category">
            <Input placeholder="e.g. Skincare, SaaS, Fitness" {...register('category')} />
          </Field>
          <Field label="Objective">
            <Controller control={control} name="objective" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OBJECTIVES.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </Field>
          <Field label="Call to Action">
            <Controller control={control} name="cta" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CTAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </Field>
          <Field label="Website URL">
            <Input placeholder="https://yourdomain.com" {...register('websiteUrl')} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Offer Description" hint="Describe what you're promoting in 1–2 sentences.">
            <Textarea rows={3} placeholder="Natural skincare designed for radiant, glowing skin…" {...register('description')} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard>
        <AISuggestionBar
          actions={['Generate Offer', 'Improve Offer', 'Rewrite CTA', 'Apply Brand']}
          onAction={applyAI}
        />
      </SectionCard>
    </div>
  );

  const StepCreative = (
    <div className="space-y-5">
      <SectionCard>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Ad Creative</h3>
          <p className="text-xs text-muted-foreground">Design the content for your ad.</p>
        </div>

        <Field label="Media">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/40">
              {values.mediaUrl ? (
                <img src={values.mediaUrl} alt="creative" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border/70 bg-background text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5"
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs font-medium">Upload</span>
              <span className="text-[10px]">Image or Video</span>
              <span className="text-[10px] opacity-70">Recommended: 1080×1080</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        </Field>

        <div className="mt-4 grid gap-4">
          <Field label="Primary Text" hint={`${values.primaryText.length}/125`}>
            <Textarea rows={2} maxLength={125}
              placeholder="Glow naturally. Pure ingredients for healthy, radiant skin ✨"
              {...register('primaryText')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Headline" hint={`${values.headline.length}/40`}>
              <Input maxLength={40} placeholder="Natural Skincare for You" {...register('headline')} />
            </Field>
            <Field label="Description" hint={`${values.descriptionCopy.length}/30 · Optional`}>
              <Input maxLength={30} placeholder="Hydrating. Clean. Effective." {...register('descriptionCopy')} />
            </Field>
          </div>
        </div>

        <Separator className="my-5" />

        <div>
          <p className="mb-2 text-sm font-medium">Template Source</p>
          <Controller control={control} name="templateSource" render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange}
              className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {['AdVista', 'Canva', 'Freepik', 'Upload'].map((s) => (
                <label key={s} className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-sm transition',
                  field.value === s.toLowerCase() && 'border-primary bg-primary/5'
                )}>
                  <RadioGroupItem value={s.toLowerCase()} />
                  {s}
                </label>
              ))}
            </RadioGroup>
          )} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={goToTemplate}>
              <Layers className="mr-1.5 h-3.5 w-3.5" /> Browse Templates
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={goToEditor}>
              <Palette className="mr-1.5 h-3.5 w-3.5" /> Open Visual Editor
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={goToMedia}>
              <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Use Existing
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <AISuggestionBar
          actions={['Generate Copy', 'Improve Headline', 'Generate Variants', 'Visual Direction', 'Use Brand Voice']}
          onAction={applyAI}
        />
      </SectionCard>
    </div>
  );

  const StepAudience = (
    <div className="space-y-5">
      <SectionCard>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Target Audience</h3>
          <p className="text-xs text-muted-foreground">Define who should see your ad.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="United States" {...register('location')} />
            </div>
          </Field>
          <Field label="Languages">
            <Input placeholder="English" {...register('languages')} />
          </Field>
        </div>

        <div className="mt-4">
          <Field label={`Age Range: ${values.ageMin} – ${values.ageMax}`}>
            <div className="grid grid-cols-2 gap-3">
              <Slider min={13} max={65} step={1}
                value={[values.ageMin]} onValueChange={(v) => setValue('ageMin', v[0])} />
              <Slider min={13} max={65} step={1}
                value={[values.ageMax]} onValueChange={(v) => setValue('ageMax', v[0])} />
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Gender</p>
          <Controller control={control} name="gender" render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {['all', 'men', 'women'].map((g) => (
                <button key={g} type="button" onClick={() => field.onChange(g)}
                  className={cn(
                    'rounded-xl border border-border/60 px-3 py-2 text-sm capitalize transition',
                    field.value === g && 'border-primary bg-primary/5 font-semibold text-primary'
                  )}>{g}</button>
              ))}
            </div>
          )} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Interests" hint="Comma-separated">
            <Input placeholder="Skincare, Beauty, Wellness" {...register('interests')} />
          </Field>
          <Field label="Behaviors" hint="Comma-separated">
            <Input placeholder="Online Shoppers, Frequent Travelers" {...register('behaviors')} />
          </Field>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">Placements</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PLATFORMS.map((p) => {
              const on = values.placements.includes(p.v);
              const Icon = p.icon;
              return (
                <button key={p.v} type="button" onClick={() => togglePlacement(p.v)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2.5 text-sm transition',
                    on && 'border-primary bg-primary/5 shadow-sm'
                  )}>
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', p.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{p.l}</span>
                  {on && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">AI Suggested Audience</p>
            <p className="text-xs text-muted-foreground">
              Source: {values.category || 'Category'} · Brand Memory
            </p>
          </div>
          <Badge variant="outline" className="rounded-full">Beta</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Apply', 'Compare', 'Ignore'].map((a) => (
            <Button key={a} type="button" size="sm" variant={a === 'Apply' ? 'default' : 'outline'}
              onClick={() => applyAI(`Audience: ${a}`)}>{a}</Button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const StepBudget = (
    <div className="space-y-5">
      <SectionCard>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Budget & Schedule</h3>
          <p className="text-xs text-muted-foreground">Decide how much to spend and when.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Daily Budget ($)">
            <Input type="number" min={1} {...register('dailyBudget', { valueAsNumber: true })} />
          </Field>
          <Field label="Lifetime Budget ($)">
            <Input type="number" min={0} {...register('lifetimeBudget', { valueAsNumber: true })} />
          </Field>
          <Field label="Start Date">
            <Input type="date" {...register('startDate')} />
          </Field>
          <Field label="End Date">
            <Input type="date" {...register('endDate')} />
          </Field>
          <Field label="Bidding">
            <Controller control={control} name="bidding" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lowest_cost">Lowest Cost</SelectItem>
                  <SelectItem value="cost_cap">Cost Cap</SelectItem>
                  <SelectItem value="bid_cap">Bid Cap</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </Field>
          <Field label="Allocation">
            <Controller control={control} name="allocation" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </Field>
        </div>

        <Separator className="my-5" />

        <div className="grid grid-cols-3 gap-3">
          {[
            { l: 'Expected Reach', v: `${Math.round(values.dailyBudget * 320).toLocaleString()}` },
            { l: 'Est. Clicks', v: `${Math.round(values.dailyBudget * 12).toLocaleString()}` },
            { l: 'Est. Spend / wk', v: `$${(values.dailyBudget * 7).toFixed(0)}` },
          ].map((k) => (
            <div key={k.l} className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{k.l}</p>
              <p className="mt-1 text-lg font-bold">{k.v}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <AISuggestionBar
          actions={['Optimize Budget', 'Recommend Allocation', 'Improve ROAS']}
          onAction={applyAI}
        />
        <p className="mt-2 text-xs text-muted-foreground">AI confidence: 82% based on historical performance.</p>
      </SectionCard>
    </div>
  );

  const StepReview = (
    <div className="space-y-5">
      <SectionCard>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Review & Publish</h3>
          <p className="text-xs text-muted-foreground">Review your ad before publishing.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { t: 'Campaign', rows: [['Name', values.name || '—'], ['Objective', values.objective], ['CTA', values.cta]] },
            { t: 'Creative', rows: [['Headline', values.headline || '—'], ['Primary', values.primaryText.slice(0, 40) || '—']] },
            { t: 'Audience', rows: [['Location', values.location], ['Age', `${values.ageMin}–${values.ageMax}`], ['Placements', values.placements.join(', ') || '—']] },
            { t: 'Budget', rows: [['Daily', `$${values.dailyBudget}`], ['Start', values.startDate], ['End', values.endDate]] },
          ].map((s) => (
            <div key={s.t} className="rounded-xl border border-border/60 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.t}</p>
              <dl className="space-y-1 text-sm">
                {s.rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="min-w-0 truncate text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <p className="mb-3 text-sm font-semibold">Readiness Checks</p>
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              <span className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                c.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              )}>{c.ok ? '✓' : '!'}</span>
              <span className={c.ok ? '' : 'text-muted-foreground'}>{c.label}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard className="border-primary/30 bg-primary/[0.03]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Recommended Improvements</p>
            <p className="text-xs text-muted-foreground">
              Add a stronger CTA and upload branded media to increase estimated CTR by ~14%.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => applyAI('Dismiss')}>Dismiss</Button>
            <Button size="sm" onClick={() => applyAI('Apply Recommendations')}>Apply</Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const stepContent = [null, StepOffer, StepCreative, StepAudience, StepBudget, StepReview][step];

  /* ------------------ layout ------------------ */
  return (
    <div className="min-h-screen bg-muted/20">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="page-container flex flex-wrap items-center justify-between gap-3 py-3 sm:py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                onClick={() => navigate(-1)} aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold sm:text-xl">Create Ad</h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Build, preview, and launch campaigns.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {saving ? (
                <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>
              ) : lastSavedAt ? (
                <span className="inline-flex items-center gap-1"><Bookmark className="h-3 w-3" /> Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              ) : 'Autosave on'}
            </span>
            <Button size="sm" variant="outline" onClick={() => saveDraft()} disabled={saving}>
              <Save className="mr-1.5 h-3.5 w-3.5" /> Save Draft
            </Button>
            <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="lg:hidden">
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(24rem,calc(100vw-1rem))] overflow-y-auto">
                <p className="mb-3 text-sm font-semibold">Live Preview</p>
                <LivePreview v={values} brandName={brandName} />
              </SheetContent>
            </Sheet>
            <Button size="sm" onClick={publish} disabled={publishing}>
              {publishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
              Publish Ad
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="page-container py-5 sm:py-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            <AIContextBar />
            <ProgressCard step={step} setStep={setStep}
              completion={completion} readiness={readiness} />


            <motion.div
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {stepContent}
            </motion.div>

            {/* Bottom nav */}
            <div className="sticky bottom-0 z-20 -mx-4 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" size="sm"
                  onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
                </Button>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Step {step} of {STEPS.length}
                </p>
                {step < STEPS.length ? (
                  <Button size="sm" onClick={() => setStep(step + 1)}>
                    Next: {STEPS[step].label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={publish} disabled={publishing}>
                    <Rocket className="mr-1.5 h-3.5 w-3.5" /> Publish
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sticky preview + AI rail (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-3">
              <AICreativeAssistant step={step} />
              <SectionCard>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">Ad Preview</p>
                  <Badge variant="outline" className="text-[10px]">Live</Badge>
                </div>
                <LivePreview v={values} brandName={brandName} />
              </SectionCard>
            </div>
          </aside>
        </div>
      </div>
      <AIRecommendationBanner />
    </div>
  );
}
