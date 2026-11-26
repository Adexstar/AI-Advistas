import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, Eye,
  Facebook, Instagram, Linkedin, Image as ImageIcon, Link, Loader2, MapPin,
  Save, Send, Sparkles, Target, Upload, Users, Video, X, Edit3,
  Calendar as CalendarIcon, ShoppingCart, Menu,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { signedMediaUrl } from '@/lib/mediaUrl';
import { useAuth } from '@/hooks/useAuth';
import { CreativeService, creativeDocument } from '@/services/creative/CreativeService';
import { TemplateEngine } from '@/services/templates/TemplateEngine';
import { CreateAdTemplatePicker, type PickerTemplate } from '@/components/ad/CreateAdTemplatePicker';
import { CreateAdMediaPicker } from '@/components/ad/CreateAdMediaPicker';
import { isDraftStatus } from '@/lib/campaignStatus';
import { PublishingService } from '@/services/publishing';
import type { Json } from '@/integrations/supabase/types';

/* ------------------------------------------------------------------ */
/* Types & Constants                                                   */
/* ------------------------------------------------------------------ */

type BudgetType = 'daily' | 'total';
type RunType = 'continuous' | 'end_date';

type FormValues = {
  name: string;
  objective: string;
  platforms: string[];
  mediaUrl: string;
  primaryText: string;
  headline: string;
  descriptionCopy: string;
  cta: string;
  websiteUrl: string;
  location: string;
  ageMin: number;
  ageMax: number;
  gender: string;
  interests: string;
  budgetType: BudgetType;
  budgetAmount: number;
  startDate: Date;
  runType: RunType;
  endDate: Date | null;
  termsAccepted: boolean;
};

const STEPS = [
  { id: 1, label: 'Setup' },
  { id: 2, label: 'Creative' },
  { id: 3, label: 'Audience' },
  { id: 4, label: 'Budget' },
  { id: 5, label: 'Review' },
] as const;

const OBJECTIVES = [
  { value: 'conversions', label: 'Conversions', icon: ShoppingCart },
  { value: 'traffic', label: 'Traffic', icon: ArrowRight },
  { value: 'leads', label: 'Lead Generation', icon: Users },
  { value: 'awareness', label: 'Awareness', icon: Eye },
  { value: 'engagement', label: 'Engagement', icon: Sparkles },
  { value: 'app_installs', label: 'App Installs', icon: Download },
] as const;

const CTAS = [
  'Shop Now', 'Learn More', 'Sign Up', 'Get Quote', 'Book Now',
  'Download', 'Contact Us', 'Watch More', 'Subscribe', 'Try Free',
  'Get Started', 'See More', 'Apply Now', 'Register', 'Play Game',
  'Listen Now', 'Donate', 'Join Us',
];

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'tiktok', label: 'TikTok', icon: Video },
  { value: 'pinterest', label: 'Pinterest', icon: PinIcon },
  { value: 'twitter', label: 'X', icon: XIcon },
  { value: 'youtube', label: 'YouTube', icon: VideoIcon },
  { value: 'more', label: 'Other', icon: Menu },
];

function PinIcon({ className }: { className?: string }) { return <Target className={className} />; }
function XIcon({ className }: { className?: string }) { return <X className={className} />; }
function VideoIcon({ className }: { className?: string }) { return <Video className={className} />; }
function Download({ className }: { className?: string }) { return <Send className={className} />; }

const GENDERS = ['All', 'Men', 'Women'];

/* ------------------------------------------------------------------ */
/* Progress Bar                                                        */
/* ------------------------------------------------------------------ */

function StepProgress({ step }: { step: number }) {
  return (
    <div className="mx-auto flex w-full max-w-xl items-center gap-1 px-4 py-3 sm:gap-2 sm:px-6">
      {STEPS.map((s, i) => {
        const idx = i + 1;
        const active = step === idx;
        const completed = step > idx;
        return (
          <div key={s.id} className="flex min-w-0 flex-1 items-center last:flex-none">
            <div className="flex min-w-0 flex-col items-center gap-1">
              <div className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all sm:h-7 sm:w-7 sm:text-xs',
                active && 'bg-primary text-white shadow-sm',
                completed && 'bg-primary text-white',
                !active && !completed && 'border border-border bg-background text-muted-foreground',
              )}>
                {completed ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : idx}
              </div>
              <span className={cn(
                'max-w-full truncate text-[10px] font-medium sm:text-[11px]',
                active || completed ? 'text-primary' : 'text-muted-foreground',
              )}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'mx-1 mb-4 h-px min-w-[8px] flex-1 sm:mx-2',
                completed ? 'bg-primary' : 'bg-border',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field Helpers                                                       */
/* ------------------------------------------------------------------ */

function Field({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-label text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {hint && <p className="font-micro text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StepSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
      <header className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function StepPanel({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn('mx-auto w-full space-y-4', wide ? 'max-w-xl' : 'max-w-lg')}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function CreateAd() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedStep = Number(searchParams.get('step'));
  const [step, setStep] = useState(requestedStep >= 1 && requestedStep <= 5 ? requestedStep : searchParams.has('campaignId') ? 2 : 1);
  const [draftId, setDraftId] = useState<string | null>(searchParams.get('campaignId'));
  const [creativeId, setCreativeId] = useState<string | null>(null);
  const draftIdRef = useRef(draftId);
  const creativeIdRef = useRef<string | null>(null);
  const existingCreativeRef = useRef<Record<string, any>>({});
  const hasCanvasRef = useRef(false);
  const saveInFlight = useRef<Promise<string | null> | null>(null);
  const [restoring, setRestoring] = useState(searchParams.has('campaignId') || searchParams.has('adId'));
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'mobile' | 'desktop'>('mobile');
  const [previewPlatform, setPreviewPlatform] = useState('facebook_feed');
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [designName, setDesignName] = useState<string | null>(null);
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [writing, setWriting] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const stepScrollRef = useRef<HTMLDivElement>(null);

  const { register, watch, control, handleSubmit, setValue, reset } = useForm<FormValues>({
    defaultValues: {
      name: '', objective: 'conversions', platforms: ['facebook', 'instagram'],
      mediaUrl: '', primaryText: '', headline: '', descriptionCopy: '', cta: 'Shop Now', websiteUrl: '',
      location: '', ageMin: 18, ageMax: 55, gender: 'All', interests: '',
      budgetType: 'daily', budgetAmount: 50,
      startDate: new Date(), runType: 'continuous', endDate: null,
      termsAccepted: false,
    },
  });

  const values = watch();
  const brandName = values.name.trim() || 'Your brand';

  useEffect(() => {
    const id = searchParams.get('campaignId');
    const attachedAdId = searchParams.get('adId');
    if ((!id && !attachedAdId) || !user) return;
    let cancelled = false;
    (async () => {
      try {
        if (!id && attachedAdId) {
          const creative = await CreativeService.get(user.id, attachedAdId);
          if (cancelled || !creative) return;
          const content = (creative.content ?? {}) as Partial<FormValues> & { templateName?: string };
          existingCreativeRef.current = content;
          hasCanvasRef.current = !!creative.canvas_data;
          setCreativeId(creative.id);
          creativeIdRef.current = creative.id;
          setDesignName(creative.name || (typeof content.templateName === 'string' ? content.templateName : 'Attached design'));
          if (creative.preview_url || content.mediaUrl) {
            reset({ ...values, mediaUrl: creative.preview_url ?? content.mediaUrl ?? '' });
          }
          setStep((current) => (current < 2 ? 2 : current));
          setRestoring(false);
          return;
        }
        const [{ data: campaign, error }, creatives] = await Promise.all([
          supabase.from('campaigns').select('*').eq('id', id!).eq('user_id', user.id).single(),
          CreativeService.list(user.id, id!),
        ]);
        if (error) throw error;
        if (cancelled || !campaign) return;
        if (!isDraftStatus(campaign.status)) {
          navigate(`/campaigns/${id}`, { replace: true });
          return;
        }
        const creative = attachedAdId
          ? creatives.find((item) => item.id === attachedAdId) ?? await CreativeService.get(user.id, attachedAdId)
          : creatives[0];
        const content = (creative?.content ?? {}) as Partial<FormValues> & { templateName?: string };
        const copy = content;
        existingCreativeRef.current = copy;
        hasCanvasRef.current = !!creative?.canvas_data;
        const settings = campaign.settings as Partial<FormValues>;
        const audience = campaign.target_audience as Record<string, any>;
        reset({ ...values, ...settings, ...copy, name: campaign.name, objective: campaign.objective,
          platforms: campaign.platform?.split(',').filter(Boolean) ?? [], budgetAmount: campaign.budget,
          startDate: campaign.start_date ? new Date(campaign.start_date) : new Date(),
          endDate: campaign.end_date ? new Date(campaign.end_date) : null,
          location: audience.location ?? '', ageMin: audience.age_min ?? 18, ageMax: audience.age_max ?? 55,
          gender: audience.gender ?? 'All', interests: audience.interests ?? '',
          mediaUrl: creative?.preview_url ?? copy.mediaUrl ?? '',
        });
        setCreativeId(creative?.id ?? null);
        creativeIdRef.current = creative?.id ?? null;
        setDesignName(typeof content.templateName === 'string' ? content.templateName : creative?.name ?? null);
        const savedInterests = typeof audience?.interests === 'string' ? audience.interests : '';
        setInterests(savedInterests.split(',').map((item) => item.trim()).filter(Boolean));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not restore campaign');
      } finally { if (!cancelled) setRestoring(false); }
    })();
    return () => { cancelled = true; };
    // Restore once; form changes must not trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user?.id, reset]);

  useEffect(() => {
    stepScrollRef.current?.scrollTo({ top: 0 });
  }, [step]);


  const spendPlan = useMemo(() => {
    const amount = Number(values.budgetAmount) || 0;
    const money = `$${amount.toFixed(2)}`;
    if (values.budgetType === 'daily') {
      return { label: 'Daily spend', value: money, detail: 'This is the most the campaign can spend each day. Reach is counted after it runs.' };
    }
    return { label: 'Campaign cap', value: money, detail: 'This is the most the campaign can spend in total. Reach is counted after it runs.' };
  }, [values.budgetAmount, values.budgetType]);

  const setInterestList = (next: string[]) => {
    setInterests(next);
    setValue('interests', next.join(', '), { shouldDirty: true });
  };

  const applyWritingTool = async (tool: string) => {
    const productName = values.name.trim() || values.headline.trim();
    if (!productName) {
      toast.message('Name the campaign first', { description: 'The writer uses that name as the offer. Your draft stays as you left it.' });
      return;
    }
    setWriting(tool);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-copy', {
        body: {
          productName,
          templateType: tool === 'Refine headline' ? 'headline' : 'full_ad',
          platform: values.platforms[0] ?? 'social',
          targetAudience: [values.location, interests.join(', ')].filter(Boolean).join(' · '),
          additionalContext: [
            values.primaryText,
            values.headline,
            tool === 'Match brand voice' ? 'Keep a clear, confident voice. Do not invent a different brand name.' : '',
          ].filter(Boolean).join('\n'),
        },
      });
      if (error) throw new Error(error.message || 'Copy is unavailable');
      const copy = (data as { copy?: { headline?: string; subtitle?: string; cta?: string } } | null)?.copy;
      const headline = copy?.headline?.trim();
      const subtitle = copy?.subtitle?.trim();
      if (!headline && !subtitle) throw new Error('No copy came back. Try a more specific campaign name.');
      if (headline) setValue('headline', headline.slice(0, 40), { shouldDirty: true });
      if (tool !== 'Refine headline' && subtitle) setValue('primaryText', subtitle.slice(0, 125), { shouldDirty: true });
      const cta = copy?.cta?.trim();
      const matchedCta = cta ? CTAS.find((item) => item.toLowerCase() === cta.toLowerCase()) : undefined;
      if (matchedCta) setValue('cta', matchedCta, { shouldDirty: true });
      toast.success(tool === 'Refine headline' ? 'Headline updated' : 'Copy added to this draft');
    } catch (error) {
      const raw = error instanceof Error ? error.message : '';
      const plain = !raw || /non-2xx|edge function|failed to fetch|failed to send/i.test(raw)
        ? 'Copy is unavailable right now. Your draft was not changed.'
        : raw;
      toast.error(plain);
    } finally {
      setWriting(null);
    }
  };

  const runDays = useMemo(() => {
    if (values.runType === 'continuous' || !values.endDate) return null;
    return Math.round((values.endDate.getTime() - values.startDate.getTime()) / 86400000);
  }, [values.runType, values.endDate, values.startDate]);

  /* ---------- Save draft ---------- */
  const saveDraft = useCallback(async (silent = false): Promise<string | null> => {
    if (!user || restoring) return null;
    if (saveInFlight.current) return saveInFlight.current;
    const operation = (async () => {
    setSaving(true);
    setSaveState('saving');
    setSaveError(null);
    try {
      const draftFields = {
        name: values.name || 'Untitled Campaign',
        objective: values.objective,
        platform: values.platforms.join(','),
        budget: Number(values.budgetAmount) || 0,
        start_date: format(values.startDate, 'yyyy-MM-dd'),
        end_date: values.endDate ? format(values.endDate, 'yyyy-MM-dd') : null,
        settings: { budgetType: values.budgetType, runType: values.runType },
        target_audience: {
          location: values.location,
          age_min: values.ageMin,
          age_max: values.ageMax,
          gender: values.gender,
          interests: values.interests,
        },
      };

      let id = draftIdRef.current;
      if (id) {
        const { data, error } = await supabase.from('campaigns').update(draftFields).eq('id', id).eq('status', 'draft').select('id');
        if (error) throw error;
        if (!data?.length) {
          if (!silent) toast.error('This campaign is no longer a draft, so it was left unchanged.');
          return null;
        }
      } else {
        const { data, error } = await supabase.from('campaigns').insert({
          ...draftFields,
          user_id: user.id,
          status: 'draft',
          spend: 0, reach: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0, ctr: 0, roas: 0,
        }).select().single();
        if (error) throw error;
        id = data.id;
        draftIdRef.current = id;
        setDraftId(id);
      }
      const creative = await CreativeService.save(user.id, {
        campaign_id: id,
        name: values.headline || values.name || 'Untitled Creative',
        content: { ...existingCreativeRef.current, mediaUrl: values.mediaUrl, primaryText: values.primaryText, headline: values.headline,
          descriptionCopy: values.descriptionCopy, cta: values.cta, websiteUrl: values.websiteUrl } as Json,
        // A rendered canvas preview takes precedence after returning from the editor.
        ...(hasCanvasRef.current ? {} : { preview_url: values.mediaUrl || null }),
      }, creativeIdRef.current);
      creativeIdRef.current = creative.id;
      setCreativeId(creative.id);
      setLastSavedAt(new Date());
      setSaveState('saved');
      if (!silent) toast.success('Draft saved');
      return id;
    } catch (e: any) {
      setSaveState('failed');
      setSaveError(e.message || 'Could not save this draft');
      if (!silent) toast.error(e.message || 'Failed to save draft');
      return null;
    } finally {
      setSaving(false);
    }
    })();
    saveInFlight.current = operation;
    try { return await operation; } finally { saveInFlight.current = null; }
  }, [user, values, restoring]);

  const openStudio = async () => {
    const id = await saveDraft(true);
    if (!id) return;
    navigate(`/visual-editor?campaignId=${id}&adId=${creativeIdRef.current ?? ''}&returnTo=create`);
  };

  const applyTemplate = async (template: PickerTemplate) => {
    if (!user) return;
    setApplyingTemplate(true);
    try {
      const id = await saveDraft(true);
      if (!id) return;
      const inst = await TemplateEngine.instantiate(template as any, {
        productName: values.headline || values.name || template.name,
        skipAI: true,
      });
      const json = (inst.json ?? {}) as Record<string, unknown>;
      const width = Number(template.width) || Number(json.width) || 1080;
      const height = Number(template.height) || Number(json.height) || 1080;
      const preview = template.preview_url || template.thumbnail_url || null;
      const content = {
        ...existingCreativeRef.current,
        mediaUrl: preview,
        primaryText: values.primaryText,
        headline: values.headline || template.name.slice(0, 40),
        descriptionCopy: values.descriptionCopy,
        cta: values.cta,
        websiteUrl: values.websiteUrl,
        templateName: template.name,
      };
      const creative = await CreativeService.save(user.id, {
        campaign_id: id,
        name: values.headline || values.name || template.name,
        template_id: template.id,
        canvas_data: creativeDocument(json, width, height),
        preview_url: preview,
        content: content as Json,
      }, creativeIdRef.current);
      creativeIdRef.current = creative.id;
      setCreativeId(creative.id);
      existingCreativeRef.current = content;
      hasCanvasRef.current = true;
      setDesignName(template.name);
      if (!values.headline) setValue('headline', template.name.slice(0, 40));
      if (preview) setValue('mediaUrl', preview);
      setTemplatePickerOpen(false);
      toast.success('Template added. Continue, or edit the design.');
    } catch (error: any) {
      toast.error(error?.message || 'Could not add that template');
    } finally {
      setApplyingTemplate(false);
    }
  };

  /* ---------- Autosave ---------- */
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user || !values.name) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => { void saveDraft(true); }, 4000);
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, [values.name, values.objective, values.budgetAmount, values.platforms.join(','), values.startDate, values.endDate, values.headline, values.primaryText, values.descriptionCopy, values.cta, values.websiteUrl, values.mediaUrl, values.location, values.ageMin, values.ageMax, values.gender, values.interests]);

  const publish = handleSubmit(async () => {
    if (!values.name) { toast.error('Campaign name is required'); setStep(1); return; }
    if (!values.platforms.length) { toast.error('Choose at least one platform'); setStep(1); return; }
    if (!values.termsAccepted) { toast.error('Please accept the terms'); return; }
    setPublishing(true);
    try {
      const id = await saveDraft(true);
      const creativeId = creativeIdRef.current;
      if (!id || !user || !creativeId) {
        toast.error('Save the ad before publishing');
        return;
      }
      const outcome = await PublishingService.publish({
        campaignId: id,
        when: 'now',
        targets: values.platforms.map((platform) => ({
          platform,
          mode: platform === 'google' ? 'paid' as const : 'social' as const,
        })),
        asset: {
          id: creativeId,
          userId: user.id,
          campaignId: id,
          platform: values.platforms[0],
          goal: values.objective,
          status: 'draft',
          mediaUrl: values.mediaUrl || undefined,
          headline: values.headline,
          body: values.primaryText,
          cta: values.cta,
        },
      });
      const failed = outcome.results.filter((result) => !result.ok);
      if (failed.length) toast.error(failed.map((result) => `${result.platform}: ${result.error ?? 'Unavailable'}`).join(' · '));
      else toast.success('Published');
      navigate(`/campaigns/${id}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to publish campaign');
    } finally {
      setPublishing(false);
    }
  });

  /* ---------- Media upload ---------- */
  const handleFile = async (f: File) => {
    if (!user) return;
    const path = `${user.id}/creatives/${Date.now()}-${f.name}`;
    const { error: uploadError } = await supabase.storage.from('media-library').upload(path, f);
    if (uploadError) { toast.error(uploadError.message); return; }
    const signedUrl = await signedMediaUrl(path);
    setValue('mediaUrl', signedUrl);
    toast.success('Media uploaded');
  };

  const togglePlatform = (v: string) => {
    const set = new Set(values.platforms);
    set.has(v) ? set.delete(v) : set.add(v);
    setValue('platforms', Array.from(set), { shouldDirty: true });
  };

  const nextStep = () => {
    if (step === 1 && !values.name.trim()) {
      toast.error('Campaign name is required'); return;
    }
    if (step === 3 && !values.location.trim()) {
      toast.error('Please enter a target location'); return;
    }
    if (step === 4 && (!values.budgetAmount || values.budgetAmount <= 0)) {
      toast.error('Please set a budget amount'); return;
    }
    if (step < 5) setStep(step + 1);
  };
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  /* ------------------------------------------------------------------ */
  /* STEP 1 — Setup                                                     */
  /* ------------------------------------------------------------------ */
  const StepSetup = (
    <StepPanel>
        <StepSection title="Campaign setup" subtitle="Name the campaign, pick an objective, and choose where it runs.">
          <div className="space-y-4">
            <Field label="Campaign Name" required>
              <Input placeholder="Summer Sale Campaign" {...register('name', { required: true })}
                className="h-11 border-[1.5px] border-border rounded-[10px] text-sm px-3.5 focus:border-primary" />
            </Field>
            <Field label="Objective">
              <Controller control={control} name="objective" render={({ field }) => (
                <select value={field.value} onChange={(e) => field.onChange(e.target.value)}
                  className="h-11 w-full appearance-none rounded-[10px] border-[1.5px] border-border bg-background px-3.5 text-sm focus:border-primary focus:outline-none">
                  {OBJECTIVES.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )} />
            </Field>
            <Field label="Platforms">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PLATFORMS.slice(0, 8).map((p) => {
                  const selected = values.platforms.includes(p.value);
                  const Icon = p.icon;
                  return (
                    <button key={p.value} type="button" onClick={() => togglePlatform(p.value)}
                      className={cn(
                        'relative flex h-[72px] flex-col items-center justify-center rounded-[10px] border-[1.5px] text-xs font-medium text-foreground transition',
                        selected ? 'border-primary bg-primary/10' : 'border-border bg-background',
                      )}>
                      {selected && (
                        <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      <Icon className="mb-1 h-5 w-5" />
                      <span className="text-[10px]">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </StepSection>

        <div className="flex justify-end">
          <button onClick={nextStep} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
    </StepPanel>
  );

  const previewPlatforms = ['Facebook Feed', 'Instagram Feed', 'Instagram Story', 'Facebook Story', 'TikTok', 'LinkedIn'];
  const adPreview = (
    <div id="ad-preview" className="min-w-0 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Preview</h3>
        <p className="text-xs text-muted-foreground">Approximate look across placements.</p>
      </div>
      <div className="flex w-fit gap-1 rounded-lg bg-muted/50 p-0.5">
        <button type="button" onClick={() => setPreviewTab('mobile')}
          className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition', previewTab === 'mobile' ? 'bg-primary text-white' : 'text-muted-foreground')}>Mobile</button>
        <button type="button" onClick={() => setPreviewTab('desktop')}
          className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition', previewTab === 'desktop' ? 'bg-primary text-white' : 'text-muted-foreground')}>Desktop</button>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {previewPlatforms.map((p) => {
          const id = p.toLowerCase().replace(/\s+/g, '_');
          return (
            <button key={p} type="button" onClick={() => setPreviewPlatform(id)}
              className={cn('shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs', previewPlatform === id ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-border text-muted-foreground')}>
              {p}
            </button>
          );
        })}
      </div>
      <div className={cn(
        'mx-auto overflow-hidden rounded-xl border border-[#DADDE1] bg-white text-[13px] leading-[1.4] text-[#050505]',
        previewTab === 'mobile' ? 'max-w-[340px]' : 'w-full max-w-[520px]',
      )}>
            {/* Header: Page info + sponsored */}
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-glow shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate text-[#050505]">{brandName}</p>
                <p className="text-[11px] text-[#65676B]">Sponsored · <span className="font-medium">Paid for by {brandName}</span></p>
              </div>
              <button className="text-[#65676B] hover:bg-[#F2F2F2] rounded-full p-1 -mr-1">
                <span className="text-lg leading-none font-bold">⋯</span>
              </button>
            </div>

            {/* Primary Text — appears above image in Facebook feed */}
            {values.primaryText && (
              <div className="px-3 pb-2.5">
                <p className="text-[13px] leading-[1.4] text-[#050505]">{values.primaryText}</p>
              </div>
            )}

            {/* Media */}
            <div className="bg-[#F0F2F5] flex items-center justify-center" style={{ aspectRatio: values.mediaUrl ? '1.91/1' : '16/9' }}>
              {values.mediaUrl ? (
                <img src={values.mediaUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-[#B0B3B8]">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-[11px]">Ad preview</span>
                </div>
              )}
            </div>

            {/* Link preview card */}
            <div className="border-t border-[#DADDE1]">
              <div className="px-3 pt-2 pb-1">
                <p className="text-[11px] text-[#65676B] uppercase tracking-wide">{(() => { try { return values.websiteUrl ? new URL(values.websiteUrl).hostname : 'Add a website'; } catch { return 'Add a website'; } })()}</p>
                <p className="text-[14px] font-semibold leading-tight text-[#050505] mt-0.5">{values.headline || 'Your headline'}</p>
                <p className="text-[12px] text-[#65676B] leading-snug mt-0.5">{values.descriptionCopy || 'A short line under the headline'}</p>
              </div>
              <div className="px-3 pb-2 pt-1">
                <span className="inline-flex items-center justify-center h-9 px-5 text-[13px] font-semibold text-white bg-[#1B74E4] rounded-md hover:bg-[#1A6ED8] cursor-pointer">{values.cta || 'Shop Now'}</span>
              </div>
            </div>

            {/* Like / Comment / Share */}
            <div className="flex items-center gap-1 border-t border-[#DADDE1] px-2 py-2">
              {[
                { label: 'Like', icon: '👍' },
                { label: 'Comment', icon: '💬' },
                { label: 'Share', icon: '↗' },
              ].map((a) => (
                <button key={a.label} type="button"
                  className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-md text-[12px] font-semibold text-[#65676B]">
                  <span className="text-sm">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
      </div>
      <p className="text-[10px] text-muted-foreground">Live ads may differ slightly by platform.</p>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* STEP 2 — Ad Creative                                                */
  /* ------------------------------------------------------------------ */
  const StepCreative = (
    <StepPanel>
      <StepSection title="Creative" subtitle="Add media and write the ad copy.">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={saving || restoring || applyingTemplate} onClick={() => void openStudio()}><Edit3 className="mr-2 h-4 w-4" />{values.mediaUrl || designName ? 'Edit design' : 'Open editor'}</Button>
            <Button variant="outline" disabled={saving || restoring || applyingTemplate} onClick={() => setTemplatePickerOpen(true)}><ImageIcon className="mr-2 h-4 w-4" />Use template</Button>
          </div>
          {designName && (
            <p className="text-[11px] text-muted-foreground">Using “{designName}”.</p>
          )}
          <Field label="Media">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition cursor-pointer" onClick={() => fileRef.current?.click()}>
              {values.mediaUrl ? (
                <img src={values.mediaUrl} alt="" className="max-h-40 mx-auto rounded-lg" />
              ) : (
                <>
                  <Upload className="mx-auto h-7 w-7 text-muted-foreground" />
                  <p className="mt-2 text-xs font-medium text-primary">Upload media</p>
                  <p className="text-[11px] text-muted-foreground">Image or video</p>
                </>
              )}
            </div>
            <div className="mt-2">
              <button type="button" onClick={() => setLibraryOpen(true)} className="text-xs font-medium text-primary hover:underline">From library</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </Field>
          <Field label="Primary text" hint={`${values.primaryText.length}/125`}>
            <Textarea rows={2} maxLength={125} placeholder="Write your ad copy…"
              {...register('primaryText')}
              className="resize-none rounded-[10px] border-[1.5px] border-border text-sm focus:border-primary" />
          </Field>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground"><Sparkles className="h-3 w-3" /> Writing tools</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {['Suggest copy', 'Refine headline', 'Match brand voice'].map((a) => (
                <button key={a} type="button" disabled={writing !== null} onClick={() => void applyWritingTool(a)}
                  className="rounded-full border border-border px-2.5 py-1 text-[10px] transition hover:border-primary/40 disabled:opacity-60">{writing === a ? 'Writing…' : a}</button>
              ))}
            </div>
          </div>
          <Field label="Headline" hint={`${values.headline.length}/40`}>
            <Input maxLength={40} placeholder="Headline" {...register('headline')}
              className="h-11 border-[1.5px] border-border rounded-[10px] text-sm px-3.5 focus:border-primary" />
          </Field>
          <Field label="Description" hint={`${values.descriptionCopy.length}/30 · optional`}>
            <Input maxLength={30} placeholder="Short supporting line" {...register('descriptionCopy')}
              className="h-11 rounded-[10px] border-[1.5px] border-border px-3.5 text-sm focus:border-primary" />
          </Field>
          <Field label="Call to action">
            <Controller control={control} name="cta" render={({ field }) => (
              <select value={field.value} onChange={(e) => field.onChange(e.target.value)}
                className="h-11 w-full border-[1.5px] border-border rounded-[10px] text-sm px-3.5 bg-card focus:border-primary focus:outline-none appearance-none">
                {CTAS.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            )} />
          </Field>
          <Field label="Website URL" hint="Visible in some ad placements">
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="https://yourwebsite.com" {...register('websiteUrl')}
                className="h-11 pl-9 border-[1.5px] border-border rounded-[10px] text-sm focus:border-primary" />
            </div>
          </Field>
        </div>
      </StepSection>
      <div className="flex justify-end">
        <button onClick={nextStep} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </StepPanel>
  );

  /* ------------------------------------------------------------------ */
  /* STEP 3 — Audience                                                   */
  /* ------------------------------------------------------------------ */
  const StepAudience = (
    <StepPanel>
      <StepSection title="Audience" subtitle="Define who should see this ad.">
        <div className="space-y-5">
          <Field label="Locations">
            <Controller control={control} name="location" render={({ field }) => (
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="United States" {...field}
                  className="h-11 pl-9 border-[1.5px] border-border rounded-[10px] text-sm focus:border-primary" />
              </div>
            )} />
          </Field>
          <Field label="Age Range">
            <div className="flex items-center gap-3">
              <Controller control={control} name="ageMin" render={({ field }) => (
                <input type="range" min={13} max={65} step={1} value={field.value} onChange={(e) => field.onChange(Math.min(Number(e.target.value), values.ageMax))} className="w-full accent-primary" />
              )} />
              <span className="text-xs font-medium text-foreground shrink-0 w-16 text-right">{values.ageMin}–{values.ageMax}</span>
              <Controller control={control} name="ageMax" render={({ field }) => (
                <input type="range" min={13} max={65} step={1} value={field.value} onChange={(e) => field.onChange(Math.max(Number(e.target.value), values.ageMin))} className="w-full accent-primary" />
              )} />
            </div>
          </Field>
          <Field label="Gender">
            <Controller control={control} name="gender" render={({ field }) => (
              <div className="flex gap-1.5">
                {GENDERS.map((g) => (
                  <button key={g} type="button" onClick={() => field.onChange(g)}
                    className={cn('px-4 py-2 text-xs font-medium rounded-lg border border-border transition',
                      field.value === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground hover:border-primary/40')}>{g}</button>
                ))}
              </div>
            )} />
          </Field>
          <Field label="Interests">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {interests.length === 0 && <p className="text-[11px] text-muted-foreground">Add the topics this audience already cares about.</p>}
              {interests.map((int) => (
                <span key={int} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-primary/10 text-primary rounded-md">
                  {int}
                  <button type="button" onClick={() => setInterestList(interests.filter((i) => i !== int))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={interestInput} onChange={(e) => setInterestInput(e.target.value)}
                placeholder="Add interest..." className="h-10 text-sm border-[1.5px] border-border rounded-[10px] focus:border-primary" />
              <button type="button" onClick={() => { if (interestInput.trim()) { setInterestList([...interests, interestInput.trim()]); setInterestInput(''); } }}
                className="px-3 py-2 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary/10">+ Add</button>
            </div>
          </Field>
        </div>
      </StepSection>
      <div className="flex justify-between gap-3">
        <button onClick={prevStep} className="flex h-10 items-center gap-1 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted/50">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={nextStep} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </StepPanel>
  );

  /* ------------------------------------------------------------------ */
  /* STEP 4 — Budget & Schedule                                          */
  /* ------------------------------------------------------------------ */
  const StepBudget = (
    <StepPanel>
      <StepSection title="Budget & schedule" subtitle="Set spend and when the campaign runs.">
        {/* Budget Type Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <Controller control={control} name="budgetType" render={({ field }) => (
            <>
              <button type="button" onClick={() => field.onChange('daily')}
                className={cn('rounded-xl border-[1.5px] p-4 text-left transition',
                  field.value === 'daily' ? 'border-primary bg-primary/10' : 'border-border bg-background')}>
                <div className={cn('mb-2 flex h-4 w-4 items-center justify-center rounded-full border-2',
                  field.value === 'daily' ? 'border-primary' : 'border-border')}>
                  {field.value === 'daily' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="text-sm font-semibold text-foreground">Daily budget</p>
                <p className="mt-1 text-xs text-muted-foreground">Spend up to this amount each day.</p>
              </button>
              <button type="button" onClick={() => field.onChange('total')}
                className={cn('rounded-xl border-[1.5px] p-4 text-left transition',
                  field.value === 'total' ? 'border-primary bg-primary/10' : 'border-border bg-background')}>
                <div className={cn('mb-2 flex h-4 w-4 items-center justify-center rounded-full border-2',
                  field.value === 'total' ? 'border-primary' : 'border-border')}>
                  {field.value === 'total' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="text-sm font-semibold text-foreground">Lifetime budget</p>
                <p className="mt-1 text-xs text-muted-foreground">Cap spend for the full campaign.</p>
              </button>
            </>
          )} />
        </div>

        {/* Budget Input */}
        <div className="mb-5">
          <Label className="font-label text-foreground mb-1.5 block">
            {values.budgetType === 'daily' ? 'Daily Budget' : 'Total Budget'}
          </Label>
          <Controller control={control} name="budgetAmount" render={({ field }) => (
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-foreground">$</span>
              <input type="number" min={1} value={field.value || ''} onChange={(e) => field.onChange(Number(e.target.value))}
                placeholder="0.00"
                className="w-full h-12 pl-7 pr-3.5 text-lg font-semibold text-foreground bg-card border-[1.5px] border-border rounded-[10px] focus:border-primary focus:outline-none placeholder:text-muted-foreground" />
            </div>
          )} />
        </div>

        {/* Estimated Reach Card */}
        <div className="bg-card border border-border rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-foreground">{spendPlan.label}</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{spendPlan.value}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">{spendPlan.detail}</p>
        </div>

        {/* Schedule Section */}
        <div>
          <h4 className="text-base font-bold text-foreground mb-4">Schedule</h4>

          <Label className="font-label text-foreground mb-1.5 block">Start Date</Label>
          <Controller control={control} name="startDate" render={({ field }) => (
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger asChild>
                <button className="w-full h-12 flex items-center gap-2.5 px-3.5 border-[1.5px] border-border rounded-[10px] bg-card text-left">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground flex-1">{format(field.value, 'dd/MM/yyyy')}</span>
                  <span className="text-xs text-primary">Change</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={field.value} onSelect={(d) => { if (d) { field.onChange(d); setStartOpen(false); } }} initialFocus />
              </PopoverContent>
            </Popover>
          )} />

          {/* Run Length */}
          <div className="mt-5">
            <Label className="font-label text-foreground mb-2 block">Run Length</Label>
            <div className="space-y-2">
              <Controller control={control} name="runType" render={({ field }) => (
                <>
                  <button type="button" onClick={() => field.onChange('continuous')}
                    className={cn('w-full rounded-xl border-[1.5px] p-3.5 text-left transition',
                      field.value === 'continuous' ? 'border-primary bg-primary/10' : 'border-border bg-background')}>
                    <div className="flex items-center gap-2">
                      <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                        field.value === 'continuous' ? 'border-primary' : 'border-border')}>
                        {field.value === 'continuous' && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Run continuously</p>
                        <p className="text-xs text-muted-foreground">Stays live until you pause it.</p>
                      </div>
                    </div>
                  </button>
                  <button type="button" onClick={() => field.onChange('end_date')}
                    className={cn('w-full rounded-xl border-[1.5px] p-3.5 text-left transition',
                      field.value === 'end_date' ? 'border-primary bg-primary/10' : 'border-border bg-background')}>
                    <div className="flex items-center gap-2">
                      <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                        field.value === 'end_date' ? 'border-primary' : 'border-border')}>
                        {field.value === 'end_date' && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Set an end date</p>
                        <p className="text-xs text-muted-foreground">Stops automatically on the date you choose.</p>
                      </div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {field.value === 'end_date' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <Label className="font-label text-foreground mb-1.5 block mt-3">End Date</Label>
                        <Controller control={control} name="endDate" render={({ field: endField }) => (
                          <Popover open={endOpen} onOpenChange={setEndOpen}>
                            <PopoverTrigger asChild>
                              <button className="w-full h-12 flex items-center gap-2.5 px-3.5 border-[1.5px] border-border rounded-[10px] bg-card text-left">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-foreground flex-1">{endField.value ? format(endField.value, 'dd/MM/yyyy') : 'Select date'}</span>
                                <span className="text-xs text-primary">Change</span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={endField.value ?? undefined}
                                onSelect={(d) => { if (d) { endField.onChange(d); setEndOpen(false); } }}
                                disabled={(date) => date <= values.startDate}
                                initialFocus />
                            </PopoverContent>
                          </Popover>
                        )} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )} />
            </div>
          </div>
        </div>

        {/* Campaign Summary Card */}
        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <p className="mb-3 text-xs font-semibold text-foreground">Summary</p>
          <div className="space-y-2">
            <SummaryRow label={spendPlan.label} value={spendPlan.value} />
            <SummaryRow label="Start" value={format(values.startDate, 'MMM d, yyyy')} />
            <SummaryRow label="Duration" value={values.runType === 'continuous' ? 'Continuous' : runDays ? `${runDays} days` : '—'} />
            {values.budgetType === 'daily' && values.runType === 'end_date' && runDays ? (
              <SummaryRow label="Spend across the dates" value={`$${(values.budgetAmount * runDays).toFixed(2)}`} />
            ) : null}
          </div>
        </div>
      </StepSection>

      <div className="flex justify-between gap-3">
        <button onClick={prevStep} className="flex h-10 items-center gap-1 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted/50">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={nextStep} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </StepPanel>
  );

  /* ------------------------------------------------------------------ */
  /* STEP 5 — Review & Publish                                           */
  /* ------------------------------------------------------------------ */
  const StepReview = (
    <StepPanel wide>
      <StepSection title="Review" subtitle="Confirm the details, then publish.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ReviewCard title="Campaign" rows={[
            ['Name', values.name || '—'],
            ['Objective', values.objective],
            ['Platforms', values.platforms.join(', ')],
          ]} />
          <ReviewCard title="Creative" rows={[
            ['Headline', values.headline || '—'],
            ['Primary text', values.primaryText || '—'],
            ['Website', values.websiteUrl || '—'],
            ['CTA', values.cta],
            ['Media', values.mediaUrl ? 'Uploaded' : 'None'],
          ]} />
          <ReviewCard title="Audience" rows={[
            ['Location', values.location || '—'],
            ['Age', `${values.ageMin}–${values.ageMax}`],
            ['Gender', values.gender],
            ['Interests', interests.join(', ') || '—'],
          ]} />
          <ReviewCard title="Budget & Schedule" rows={[
            [values.budgetType === 'daily' ? 'Daily' : 'Total', `$${values.budgetAmount.toFixed(2)}`],
            ['Start', format(values.startDate, 'MMM d, yyyy')],
            ['End', values.endDate ? format(values.endDate, 'MMM d, yyyy') : 'Continuous'],
          ]} />
        </div>

        {adPreview}

        <div className="flex items-start gap-2">
          <Controller control={control} name="termsAccepted" render={({ field }) => (
            <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)}
              className="mt-0.5 accent-primary" />
          )} />
          <p className="text-xs text-muted-foreground">I have rights to this media and content, and I agree to the platform advertising policies.</p>
        </div>

        <button onClick={publish} disabled={publishing || !values.termsAccepted}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50">
          {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {publishing ? 'Publishing…' : 'Publish campaign'}
        </button>
      </StepSection>

      <div className="flex justify-start">
        <button onClick={prevStep} className="flex h-10 items-center gap-1 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted/50">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    </StepPanel>
  );

  const stepContent = [null, StepSetup, StepCreative, StepAudience, StepBudget, StepReview][step];

  /* ------------------------------------------------------------------ */
  /* Layout                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <CreateAdTemplatePicker
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onSelect={(template) => void applyTemplate(template)}
        busy={applyingTemplate}
      />
      <CreateAdMediaPicker
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(url) => setValue('mediaUrl', url)}
      />

      {/* Fixed chrome — never scrolls; form scrolls in the pane below */}
      <div className="shrink-0 border-b border-border bg-background">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between gap-3 px-4 sm:h-14 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(-1)} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">Create ad</h1>
              {(saveState === 'saving' || saveState === 'failed' || saveState === 'saved') && (
                <p className="font-micro text-muted-foreground">
                  {saveState === 'saving' ? 'Saving…' : saveState === 'failed' ? (saveError || 'Save failed') : 'Draft saved'}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button onClick={() => saveDraft()} disabled={saving}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border text-xs font-medium text-foreground transition hover:bg-muted/50 sm:flex sm:h-9 sm:w-auto sm:items-center sm:gap-1.5 sm:px-3">
              <Save className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Save</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(5);
                window.setTimeout(() => document.getElementById("ad-preview")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
              }}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border text-xs font-medium text-foreground transition hover:bg-muted/50 sm:flex sm:h-9 sm:w-auto sm:items-center sm:gap-1.5 sm:px-3">
              <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              onClick={() => { if (step < 5) nextStep(); else void publish(); }}
              disabled={publishing}
              className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 sm:flex sm:h-9 sm:w-auto sm:items-center sm:gap-1.5 sm:px-3.5">
              {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : step < 5 ? <ArrowRight className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{step < 5 ? 'Continue' : 'Publish'}</span>
            </button>
          </div>
        </div>

        <div className="border-t border-border bg-background">
          <StepProgress step={step} />
        </div>
      </div>

      {/* Only this pane scrolls — content cannot pass under the chrome */}
      <div ref={stepScrollRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              {stepContent}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

type ReviewRow = readonly [string, string];

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between font-label">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function ReviewCard({ title, rows }: { title: string; rows: ReviewRow[] }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="mb-2 font-caption-upper text-muted-foreground">{title}</p>
      <dl className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 font-label">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="min-w-0 max-w-[140px] truncate text-right font-medium text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
