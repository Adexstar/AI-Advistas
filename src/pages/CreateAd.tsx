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
  { id: 1, label: 'Setup', subtitle: 'Campaign & Goal' },
  { id: 2, label: 'Ad Creative', subtitle: 'Design Your Ad' },
  { id: 3, label: 'Audience', subtitle: 'Target People' },
  { id: 4, label: 'Budget', subtitle: 'Set Budget & Schedule' },
  { id: 5, label: 'Review', subtitle: 'Finalize & Publish' },
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
  { value: 'twitter', label: 'Twitter/X', icon: XIcon },
  { value: 'youtube', label: 'YouTube', icon: VideoIcon },
  { value: 'more', label: 'More', icon: Menu },
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
    <div className="flex items-center w-full max-w-4xl mx-auto mb-8 px-4 overflow-x-auto">
      {STEPS.map((s, i) => {
        const idx = i + 1;
        const active = step === idx;
        const completed = step > idx;
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none min-w-0">
            <div className="flex flex-col items-center">
              <div className={cn(
                'flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[10px] sm:text-xs font-bold transition-all shrink-0',
                active && 'bg-primary text-white shadow-sm',
                completed && 'bg-primary text-white',
                !active && !completed && 'bg-card border-2 border-border text-muted-foreground',
              )}>
                {completed ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : idx}
              </div>
              <span className={cn(
                'font-label mt-1',
                active && 'text-primary',
                completed && 'text-primary',
                !active && !completed && 'text-muted-foreground',
              )}>{s.label}</span>
              <span className="hidden sm:block font-micro text-muted-foreground leading-tight">{s.subtitle}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-px mx-1.5 sm:mx-3 mt-[-18px] sm:mt-[-20px]',
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
    <div className="mb-6">
      <h3 className="font-section-header text-foreground">{title}</h3>
      {subtitle && <p className="font-label text-muted-foreground mt-0.5 mb-4">{subtitle}</p>}
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
  const [restoring, setRestoring] = useState(searchParams.has('campaignId'));
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
  const brandName = 'Your Brand';

  useEffect(() => {
    const id = searchParams.get('campaignId');
    if (!id || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ data: campaign, error }, creatives] = await Promise.all([
          supabase.from('campaigns').select('*').eq('id', id).eq('user_id', user.id).single(),
          CreativeService.list(user.id, id),
        ]);
        if (error) throw error;
        if (cancelled || !campaign) return;
        if (!isDraftStatus(campaign.status)) {
          navigate(`/campaigns/${id}`, { replace: true });
          return;
        }
        const creative = creatives[0];
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
        setDesignName(typeof content.templateName === 'string' ? content.templateName : null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not restore campaign');
      } finally { if (!cancelled) setRestoring(false); }
    })();
    return () => { cancelled = true; };
    // Restore once; form changes must not trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user?.id, reset]);


  /* ---------- Reach estimation ---------- */
  const reachEstimate = useMemo(() => {
    const amt = values.budgetAmount || 0;
    if (values.budgetType === 'daily') {
      const low = amt * 840;
      const high = amt * 1680;
      return { label: 'Estimated Daily Reach', low, high };
    }
    const low = amt * 840;
    const high = amt * 1680;
    return { label: 'Estimated Campaign Reach', low, high };
  }, [values.budgetAmount, values.budgetType]);

  const reachPercent = useMemo(() => {
    const high = reachEstimate.high || 1;
    return Math.min((reachEstimate.low / high) * 100, 100);
  }, [reachEstimate]);

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
  const fileRef = useRef<HTMLInputElement>(null);
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
    <div className="max-w-[480px] space-y-6">
        <StepSection title="Campaign & Goal" subtitle="Choose the campaign objective and define your ad.">
          <div className="space-y-4">
            <Field label="Campaign Name" required>
              <Input placeholder="Summer Sale Campaign" {...register('name', { required: true })}
                className="h-11 border-[1.5px] border-border rounded-[10px] text-sm px-3.5 focus:border-primary" />
            </Field>
            <Field label="Objective">
              <Controller control={control} name="objective" render={({ field }) => (
                <select value={field.value} onChange={(e) => field.onChange(e.target.value)}
                  className="h-11 w-full border-[1.5px] border-border rounded-[10px] text-sm px-3.5 bg-card focus:border-primary focus:outline-none appearance-none">
                  {OBJECTIVES.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )} />
            </Field>
            <Field label="Platform">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLATFORMS.slice(0, 8).map((p) => {
                  const selected = values.platforms.includes(p.value);
                  const Icon = p.icon;
                  return (
                    <button key={p.value} type="button" onClick={() => togglePlatform(p.value)}
                      className={cn(
                        'relative flex flex-col items-center justify-center h-[72px] rounded-[10px] border-[1.5px] transition text-xs font-medium text-foreground',
                        selected ? 'border-primary bg-primary/10' : 'border-border bg-card',
                      )}>
                      {selected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-[10px]">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </StepSection>

        <div className="flex justify-end">
          <button onClick={nextStep} className="bg-primary text-white rounded-[10px] h-11 px-6 text-sm font-semibold flex items-center gap-2 hover:bg-[#5A52E0] transition">
            Next: Ad Creative <ArrowRight className="h-4 w-4" />
          </button>
        </div>
    </div>
  );

  const previewPlatforms = ['Facebook Feed', 'Instagram Feed', 'Instagram Story', 'Facebook Story', 'TikTok', 'LinkedIn'];
  const adPreview = (
    <div id="ad-preview" className="min-w-0 space-y-4">
      <div>
        <h3 className="font-section-header text-foreground">Ad Preview</h3>
        <p className="font-label text-muted-foreground">See how your ad will look across platforms.</p>
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
                <p className="text-[11px] text-[#65676B] uppercase tracking-wide">{(() => { try { return values.websiteUrl ? new URL(values.websiteUrl).hostname : 'yourwebsite.com'; } catch { return 'yourwebsite.com'; } })()}</p>
                <p className="text-[14px] font-semibold leading-tight text-[#050505] mt-0.5">{values.headline || 'Natural Skincare for You'}</p>
                <p className="text-[12px] text-[#65676B] leading-snug mt-0.5">{values.descriptionCopy || 'Hydrating. Clean. Effective.'}</p>
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
      <p className="text-[10px] italic text-muted-foreground">Preview is an approximation and may differ from the actual ad on each platform.</p>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* STEP 2 — Ad Creative                                                */
  /* ------------------------------------------------------------------ */
  const StepCreative = (
    <div className="max-w-[480px] space-y-6">
      <StepSection title="Ad Creative" subtitle="Design the content for your ad.">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={saving || restoring || applyingTemplate} onClick={() => void openStudio()}><Edit3 className="mr-2 h-4 w-4" />{values.mediaUrl || designName ? 'Edit design' : 'Open in Visual Editor'}</Button>
            <Button variant="outline" disabled={saving || restoring || applyingTemplate} onClick={() => setTemplatePickerOpen(true)}><ImageIcon className="mr-2 h-4 w-4" />Select Template</Button>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {designName ? `Using “${designName}”. ` : ''}
            A template is added on this step. Saving in the editor brings you back here to continue.
          </p>
          <Field label="Media">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition cursor-pointer" onClick={() => fileRef.current?.click()}>
              {values.mediaUrl ? (
                <img src={values.mediaUrl} alt="" className="max-h-40 mx-auto rounded-lg" />
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-xs font-medium text-primary mt-2">Upload Media</p>
                  <p className="text-[11px] text-muted-foreground">or drag and drop</p>
                </>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => setLibraryOpen(true)} className="text-xs text-primary font-medium hover:underline">Media from Library</button>
              <span className="text-border">|</span>
              <button type="button" onClick={() => toast.message('Image generation is not connected', { description: 'Upload a file or choose one from your media library.' })} className="text-xs font-medium text-muted-foreground hover:underline">AI Generate Image</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </Field>
          <Field label="Primary Text" hint={`${values.primaryText.length}/125`}>
            <Textarea rows={2} maxLength={125} placeholder="Write your ad copy..."
              {...register('primaryText')}
              className="border-[1.5px] border-border rounded-[10px] text-sm resize-none focus:border-primary" />
          </Field>
          <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
            <p className="text-[10px] font-semibold text-primary flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Suggestions</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {['Generate Copy', 'Improve Headline', 'Use Brand Voice'].map((a) => (
                <button key={a} type="button" onClick={() => toast.message(a, { description: 'AI hook ready — will populate once connected.' })}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-border hover:border-primary/40 transition">{a}</button>
              ))}
            </div>
          </div>
          <Field label="Headline" hint={`${values.headline.length}/40`}>
            <Input maxLength={40} placeholder="Headline" {...register('headline')}
              className="h-11 border-[1.5px] border-border rounded-[10px] text-sm px-3.5 focus:border-primary" />
          </Field>
          <Field label="Description (Optional)" hint={`${values.descriptionCopy.length}/30`}>
            <Input maxLength={30} placeholder="Description" {...register('descriptionCopy')}
              className="h-11 border-[1.5px] border-border rounded-[10px] text-sm px-3.5 focus:border-primary" />
          </Field>
          <Field label="Call to Action">
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
        <button onClick={nextStep} className="bg-primary text-white rounded-[10px] h-11 px-6 text-sm font-semibold flex items-center gap-2 hover:bg-[#5A52E0] transition">
          Next: Audience <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* STEP 3 — Audience                                                   */
  /* ------------------------------------------------------------------ */
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>(['Skincare', 'Beauty', 'Wellness']);

  const StepAudience = (
    <div className="max-w-[480px] space-y-6">
      <StepSection title="Audience" subtitle="Target the right people for your ad.">
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
                <input type="range" min={13} max={65} step={1} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} className="w-full accent-primary" />
              )} />
              <span className="text-xs font-medium text-foreground shrink-0 w-16 text-right">{values.ageMin}–{values.ageMax}</span>
              <Controller control={control} name="ageMax" render={({ field }) => (
                <input type="range" min={13} max={65} step={1} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} className="w-full accent-primary" />
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
              {interests.map((int) => (
                <span key={int} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-primary/10 text-primary rounded-md">
                  {int}
                  <button type="button" onClick={() => setInterests(interests.filter((i) => i !== int))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={interestInput} onChange={(e) => setInterestInput(e.target.value)}
                placeholder="Add interest..." className="h-10 text-sm border-[1.5px] border-border rounded-[10px] focus:border-primary" />
              <button type="button" onClick={() => { if (interestInput.trim()) { setInterests([...interests, interestInput.trim()]); setInterestInput(''); } }}
                className="px-3 py-2 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary/10">+ Add</button>
            </div>
          </Field>
        </div>
      </StepSection>
      <div className="flex justify-between">
        <button onClick={prevStep} className="h-11 px-4 text-sm font-medium text-foreground border border-border rounded-[10px] hover:bg-muted/50 transition flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={nextStep} className="bg-primary text-white rounded-[10px] h-11 px-6 text-sm font-semibold flex items-center gap-2 hover:bg-[#5A52E0] transition">
          Next: Budget <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* STEP 4 — Budget & Schedule                                          */
  /* ------------------------------------------------------------------ */
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const StepBudget = (
    <div className="max-w-[480px] space-y-6">
      <StepSection title="Budget & Schedule" subtitle="Set your spending limits and campaign timing.">
        {/* Budget Type Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <Controller control={control} name="budgetType" render={({ field }) => (
            <>
              <button type="button" onClick={() => field.onChange('daily')}
                className={cn('rounded-xl border-[1.5px] p-5 text-left transition',
                  field.value === 'daily' ? 'border-primary bg-primary/10' : 'border-border bg-card')}>
                <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center mb-2',
                  field.value === 'daily' ? 'border-primary' : 'border-border')}>
                  {field.value === 'daily' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <p className="text-sm font-bold text-foreground">Daily Budget</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Best for always-on campaigns and boost-style delivery.</p>
              </button>
              <button type="button" onClick={() => field.onChange('total')}
                className={cn('rounded-xl border-[1.5px] p-5 text-left transition',
                  field.value === 'total' ? 'border-primary bg-primary/10' : 'border-border bg-card')}>
                <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center mb-2',
                  field.value === 'total' ? 'border-primary' : 'border-border')}>
                  {field.value === 'total' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <p className="text-sm font-bold text-foreground">Total Budget</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Best when you know the full campaign spend upfront.</p>
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
          <p className="text-xs font-semibold text-foreground">{reachEstimate.label}</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">
            {reachEstimate.low.toLocaleString()} – {reachEstimate.high.toLocaleString()}
          </p>
          <div className="h-1.5 bg-muted rounded mt-3 overflow-hidden">
            <div className="h-full rounded bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${reachPercent}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            A simple estimate based on budget and selected platforms. Final delivery will adjust after launch.
          </p>
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
                    className={cn('w-full rounded-xl border-[1.5px] p-4 text-left transition',
                      field.value === 'continuous' ? 'border-primary bg-primary/10' : 'border-border bg-card')}>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                        field.value === 'continuous' ? 'border-primary' : 'border-border')}>
                        {field.value === 'continuous' && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Run Continuously</p>
                        <p className="text-xs text-muted-foreground">Keep the campaign live until you pause it from Campaigns.</p>
                      </div>
                    </div>
                  </button>
                  <button type="button" onClick={() => field.onChange('end_date')}
                    className={cn('w-full rounded-xl border-[1.5px] p-4 text-left transition',
                      field.value === 'end_date' ? 'border-primary bg-primary/10' : 'border-border bg-card')}>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                        field.value === 'end_date' ? 'border-primary' : 'border-border')}>
                        {field.value === 'end_date' && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Choose an End Date</p>
                        <p className="text-xs text-muted-foreground">Set a clear campaign window when you know the promotion should stop.</p>
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
        <div className="bg-card border border-border rounded-xl p-4 mt-5">
          <p className="text-xs font-bold text-foreground mb-3">Campaign Summary</p>
          <div className="space-y-2">
            <SummaryRow label={`${values.budgetType === 'daily' ? 'Daily' : 'Total'} Budget`} value={`$${values.budgetAmount.toFixed(2)}`} />
            <SummaryRow label={reachEstimate.label} value={`${reachEstimate.low.toLocaleString()} – ${reachEstimate.high.toLocaleString()} people`} />
            <SummaryRow label="Start Date" value={format(values.startDate, 'MMMM d, yyyy')} />
            <SummaryRow label="Run Length" value={values.runType === 'continuous' ? 'Continuous' : runDays ? `${runDays} days` : '—'} />
            {values.runType === 'end_date' && runDays && (
              <SummaryRow label="Estimated Total Spend" value={`$${(values.budgetAmount * runDays).toFixed(2)}`} />
            )}
          </div>
        </div>
      </StepSection>

      <div className="flex justify-between">
        <button onClick={prevStep} className="h-11 px-4 text-sm font-medium text-foreground border border-border rounded-[10px] hover:bg-muted/50 transition flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={nextStep} className="bg-primary text-white rounded-[10px] h-11 px-6 text-sm font-semibold flex items-center gap-2 hover:bg-[#5A52E0] transition">
          Next: Review <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* STEP 5 — Review & Publish                                           */
  /* ------------------------------------------------------------------ */
  const StepReview = (
    <div className="max-w-[580px] space-y-6">
      <StepSection title="Review & Publish" subtitle="Review your ad before publishing.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ReviewCard title="Campaign" rows={[
            ['Name', values.name || '—'],
            ['Objective', values.objective],
            ['Platforms', values.platforms.join(', ')],
          ]} />
          <ReviewCard title="Creative" rows={[
            ['Headline', values.headline || '—'],
            ['CTA', values.cta],
            ['Media', values.mediaUrl ? 'Uploaded' : 'None'],
          ]} />
          <ReviewCard title="Audience" rows={[
            ['Location', values.location || '—'],
            ['Age', `${values.ageMin}–${values.ageMax}`],
            ['Gender', values.gender],
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
          <p className="text-xs text-muted-foreground">I confirm that I have the rights to use all media and content in this ad, and I agree to the platform advertising policies.</p>
        </div>

        <button onClick={publish} disabled={publishing || !values.termsAccepted}
          className="w-full h-12 bg-primary text-white rounded-[10px] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#5A52E0] transition disabled:opacity-50">
          {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {publishing ? 'Publishing…' : 'Publish'}
        </button>
      </StepSection>

      <div className="flex justify-between">
        <button onClick={prevStep} className="h-11 px-4 text-sm font-medium text-foreground border border-border rounded-[10px] hover:bg-muted/50 transition flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    </div>
  );

  const stepContent = [null, StepSetup, StepCreative, StepAudience, StepBudget, StepReview][step];

  /* ------------------------------------------------------------------ */
  /* Layout                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-background">
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
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14 sm:h-16">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(-1)} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="font-page-title text-foreground truncate">Create Ad</h1>
              <p className="font-micro text-muted-foreground hidden sm:block">
                {saveState === 'saving' ? 'Saving…' : saveState === 'failed' ? (saveError || 'Save failed') : saveState === 'saved' ? 'Saved' : 'Build high-performing ads in minutes.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-micro text-muted-foreground" aria-live="polite">
              {saveState === 'saving' ? 'Saving' : saveState === 'failed' ? 'Not saved' : saveState === 'saved' ? 'Saved' : ''}
            </span>
            <button onClick={() => saveDraft()} disabled={saving}
              className="h-9 w-9 sm:w-auto sm:px-3 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-muted/50 transition grid place-items-center sm:flex sm:items-center sm:gap-1.5">
              <Save className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Save Draft</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(5);
                window.setTimeout(() => document.getElementById("ad-preview")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
              }}
              className="h-9 w-9 sm:w-auto sm:px-3 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-muted/50 transition grid place-items-center sm:flex sm:items-center sm:gap-1.5">
              <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              onClick={() => { if (step < 5) nextStep(); else void publish(); }}
              disabled={publishing}
              className="h-9 w-9 sm:w-auto sm:px-4 text-xs font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition grid place-items-center sm:flex sm:items-center sm:gap-1.5">
              {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : step < 5 ? <ArrowRight className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{step < 5 ? 'Next' : 'Publish'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-card border-b border-border">
        <StepProgress step={step} />
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {stepContent}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between font-label">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function ReviewCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="font-caption-upper text-muted-foreground mb-2">{title}</p>
      <dl className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 font-label">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium text-foreground text-right truncate min-w-0 max-w-[140px]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
