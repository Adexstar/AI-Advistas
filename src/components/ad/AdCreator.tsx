import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AudienceGender, AudienceMode, BudgetPeriod, CampaignDraftSettings } from '@/contexts/AppContext';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Globe2,
  Lightbulb,
  Loader2,
  MapPin,
  MonitorSmartphone,
  Sparkle,
  Settings2,
  Sparkles,
  Target,
  Upload,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdCreatorProps {
  formData: any;
  setFormData: (data: any) => void;
  campaignSettings: CampaignDraftSettings;
  setCampaignSettings: (data: any) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  initialData?: any;
  isAI?: boolean;
  isTemplate?: boolean;
  templateName?: string;
}

const editorSteps = [
  {
    value: 'offer',
    label: 'Offer',
    description: 'Core message and format',
  },
  {
    value: 'creative',
    label: 'Creative',
    description: 'Media and headline',
  },
  {
    value: 'audience',
    label: 'Audience',
    description: 'Who should see it',
  },
  {
    value: 'budget',
    label: 'Budget',
    description: 'Spend and schedule',
  },
  {
    value: 'review',
    label: 'Review',
    description: 'Readiness and launch',
  },
] as const;

type EditorStep = (typeof editorSteps)[number]['value'];

const platformOptions = [
  {
    id: 'facebook',
    label: 'Facebook',
    description: 'Feeds, stories, and marketplace coverage',
    placements: ['Feed', 'Stories', 'Marketplace'],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Strong for reels, stories, and feed discovery',
    placements: ['Feed', 'Stories', 'Reels'],
  },
  {
    id: 'messenger',
    label: 'Messenger',
    description: 'Great for direct-response conversations',
    placements: ['Inbox', 'Stories'],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'Best for message-first campaigns and support',
    placements: ['Chat entry', 'Status'],
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    description: 'Short-form discovery and strong creator style',
    placements: ['For You', 'TopView'],
  },
] as const;

const genderOptions: Array<{ value: AudienceGender; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const interestSuggestions = ['Online shopping', 'Small business', 'Health & fitness', 'Beauty', 'Tech gadgets', 'Parenting'];

const parseTagInput = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const buildAudienceSummary = (draft: any) => {
  const locations = Array.isArray(draft.locations) && draft.locations.length > 0 ? draft.locations.join(', ') : 'Worldwide';
  const ageRange = draft.ageRange ? `${draft.ageRange.min}-${draft.ageRange.max}` : '18-65';
  const gender = draft.gender && draft.gender !== 'all' ? draft.gender : 'all genders';
  const interests = Array.isArray(draft.interests) && draft.interests.length > 0 ? `Interested in ${draft.interests.join(', ')}` : 'Broad discovery';

  if (draft.audienceMode === 'manual') {
    return `${locations}, ages ${ageRange}, ${gender}, ${interests}`;
  }

  return `${locations}, ages ${ageRange}, ${gender}, Advantage+ optimization enabled`;
};

const buildAudienceShorthand = (draft: any) => {
  const primaryLocation = Array.isArray(draft.locations) && draft.locations.length > 0 ? draft.locations[0] : 'Worldwide';
  const ageRange = draft.ageRange ? `${draft.ageRange.min}-${draft.ageRange.max}` : '18-65';
  return `${draft.audienceMode === 'manual' ? 'Manual targeting' : 'Advantage+'} • ${primaryLocation} • ${ageRange}`;
};

const LivePreview = ({
  formData,
  previewMode,
}: {
  formData: any;
  previewMode: 'mobile' | 'desktop';
}) => (
  <div className="rounded-3xl border border-border/80 bg-secondary/45 p-4">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-foreground">
        {previewMode === 'mobile' ? 'Mobile Feed Preview' : 'Desktop Placement Preview'}
      </h3>
      <Badge
        variant="outline"
        className="rounded-full border-border/80 bg-background/70 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
      >
        {formData.adType || 'image'}
      </Badge>
    </div>

    <div className="rounded-3xl border border-border/80 bg-background p-3 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <div className="h-8 w-8 rounded-full bg-muted"></div>
        <div>
          <p className="text-sm font-semibold">Your Business</p>
          <p className="text-xs text-muted-foreground">Sponsored • 2h</p>
        </div>
      </div>

      <div className="py-4 text-center text-sm italic text-muted-foreground">
        {formData.mediaUrl ? (
          formData.mediaType === 'image' ? (
            <img src={formData.mediaUrl} alt="Preview" className="h-28 w-full rounded-2xl object-cover" />
          ) : (
            '[Video Preview]'
          )
        ) : (
          '[Ad Image/Video Placeholder]'
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">
          {formData.suggestedHeadlines?.[0] || formData.product || 'Your main headline appears here'}
        </p>
        <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">
          {formData.details || 'Add a clear offer, a strong visual, and a direct call to action to preview the final ad.'}
        </p>
        <div className="pt-1 text-xs font-medium text-primary">{formData.product || 'Your Product'} →</div>
      </div>
    </div>
  </div>
);

const AdCreator = ({
  formData,
  setFormData,
  campaignSettings,
  setCampaignSettings,
  onGenerate,
  isGenerating,
  initialData,
  isAI = false,
  isTemplate = false,
  templateName,
}: AdCreatorProps) => {
  const isMobile = useIsMobile();
  const [dragActive, setDragActive] = useState(false);
  const [activeStep, setActiveStep] = useState<EditorStep>('offer');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [previewApproved, setPreviewApproved] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData((prev: any) => ({ ...prev, ...initialData }));
    }
  }, [initialData, setFormData]);

  useEffect(() => {
    const audienceSummary = buildAudienceSummary(formData);
    const shorthand = buildAudienceShorthand(formData);

    if (formData.audience !== audienceSummary || formData.simpleAudience !== shorthand) {
      setFormData((prev: any) => ({
        ...prev,
        audience: audienceSummary,
        simpleAudience: shorthand,
      }));
    }
  }, [
    formData.audience,
    formData.simpleAudience,
    formData.audienceMode,
    formData.gender,
    formData.ageRange?.min,
    formData.ageRange?.max,
    (formData.locations || []).join('|'),
    (formData.interests || []).join('|'),
    setFormData,
  ]);

  useEffect(() => {
    if (!Array.isArray(formData.platforms) || formData.platforms.length === 0 || Object.keys(formData.placementOptions || {}).length > 0) {
      return;
    }

    const seededPlacementOptions = formData.platforms.reduce((accumulator: Record<string, string[]>, platformLabel: string) => {
      const match = platformOptions.find((platform) => platform.label === platformLabel);

      if (match) {
        accumulator[match.id] = match.placements.slice(0, 2);
      }

      return accumulator;
    }, {});

    if (Object.keys(seededPlacementOptions).length > 0) {
      setFormData((prev: any) => ({ ...prev, placementOptions: seededPlacementOptions }));
    }
  }, [formData.platforms, formData.placementOptions, setFormData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleCampaignSettingChange = <K extends keyof CampaignDraftSettings>(field: K, value: CampaignDraftSettings[K]) => {
    setCampaignSettings((prev: CampaignDraftSettings) => ({ ...prev, [field]: value }));
  };

  const handleAudienceFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const togglePlatform = (platformId: string) => {
    const selectedPlatform = platformOptions.find((platform) => platform.id === platformId);

    if (!selectedPlatform) {
      return;
    }

    setFormData((prev: any) => {
      const currentPlatforms = Array.isArray(prev.platforms) ? prev.platforms : [];
      const alreadySelected = currentPlatforms.includes(selectedPlatform.label);
      const nextPlatforms = alreadySelected
        ? currentPlatforms.filter((platform: string) => platform !== selectedPlatform.label)
        : [...currentPlatforms, selectedPlatform.label];
      const nextPlacementOptions = { ...(prev.placementOptions || {}) };

      if (alreadySelected) {
        delete nextPlacementOptions[platformId];
      } else {
        nextPlacementOptions[platformId] = nextPlacementOptions[platformId] || selectedPlatform.placements.slice(0, 2);
      }

      return {
        ...prev,
        platforms: nextPlatforms,
        placementOptions: nextPlacementOptions,
      };
    });
  };

  const togglePlacement = (platformId: string, placement: string) => {
    const selectedPlatform = platformOptions.find((platform) => platform.id === platformId);

    if (!selectedPlatform) {
      return;
    }

    setFormData((prev: any) => {
      const currentPlacements: string[] = prev.placementOptions?.[platformId] || [];
      const nextPlacements = currentPlacements.includes(placement)
        ? currentPlacements.filter((item) => item !== placement)
        : [...currentPlacements, placement];
      const nextPlatforms = Array.isArray(prev.platforms) ? [...prev.platforms] : [];

      if (!nextPlatforms.includes(selectedPlatform.label)) {
        nextPlatforms.push(selectedPlatform.label);
      }

      return {
        ...prev,
        platforms: nextPlatforms,
        placementOptions: {
          ...(prev.placementOptions || {}),
          [platformId]: nextPlacements,
        },
      };
    });
  };

  const AIBadge = () =>
    isAI ? (
      <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 transition">
        <Wand2 className="mr-1 h-3 w-3" /> AI Generated
      </Badge>
    ) : null;

  const TemplateBadge = () =>
    isTemplate ? (
      <Badge className="ml-2 bg-secondary/10 text-secondary hover:bg-secondary/20 transition">
        <FileText className="mr-1 h-3 w-3" /> From Template
      </Badge>
    ) : null;

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload JPG, PNG, GIF, or MP4 files only.',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please upload files smaller than 50MB.',
      });
      return;
    }

    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
    const mediaUrl = URL.createObjectURL(file);

    handleInputChange('mediaUrl', mediaUrl);
    handleInputChange('mediaType', mediaType);

    toast.success('Media uploaded successfully');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const audienceSummary = useMemo(() => buildAudienceSummary(formData), [formData]);
  const manualAudienceReady = Boolean((formData.locations || []).length && formData.ageRange?.min && formData.ageRange?.max);
  const selectedPlacementCount = useMemo<number>(
    () => Object.values(formData.placementOptions || {}).reduce<number>((count, placements) => count + (placements as string[]).length, 0),
    [formData.placementOptions]
  );
  const scheduleIsValid = Boolean(
    campaignSettings.startDate &&
      (campaignSettings.runContinuously ||
        (campaignSettings.endDate && new Date(campaignSettings.endDate).getTime() >= new Date(campaignSettings.startDate).getTime()))
  );
  const budgetIsValid = Number.isFinite(campaignSettings.budget) && campaignSettings.budget > 0;
  const estimatedResults = useMemo(() => {
    const platformCount = Math.max(1, Array.isArray(formData.platforms) ? formData.platforms.length : 0);
    const reachFactor = campaignSettings.budgetPeriod === 'daily' ? 420 : 70;
    const low = Math.round(campaignSettings.budget * reachFactor * platformCount * 0.8);
    const high = Math.round(campaignSettings.budget * reachFactor * platformCount * 1.6);

    return {
      low,
      high,
      label: campaignSettings.budgetPeriod === 'daily' ? 'Estimated daily reach' : 'Estimated campaign reach',
    };
  }, [campaignSettings.budget, campaignSettings.budgetPeriod, formData.platforms]);
  const budgetSliderMax = campaignSettings.budgetPeriod === 'daily' ? 1000 : 10000;
  const budgetSuggestionValues = campaignSettings.budgetPeriod === 'daily' ? [10, 25, 50] : [250, 500, 1000];

  const readinessChecks = useMemo(
    () => [
      {
        label: 'Offer defined',
        done: Boolean(formData.product?.trim() && formData.details?.trim()),
      },
      {
        label: 'Creative uploaded',
        done: Boolean(formData.mediaUrl),
      },
      {
        label: 'Headline present',
        done: Boolean(formData.suggestedHeadlines?.[0]?.trim()),
      },
      {
        label: 'Audience chosen',
        done: manualAudienceReady,
      },
      {
        label: 'Placements selected',
        done: Array.isArray(formData.platforms) && formData.platforms.length > 0 && selectedPlacementCount > 0,
      },
      {
        label: 'Budget set',
        done: budgetIsValid,
      },
      {
        label: 'Schedule valid',
        done: scheduleIsValid,
      },
      {
        label: 'Destination URL valid',
        done: (() => {
          if (!formData.websiteUrl?.trim()) {
            return false;
          }

          try {
            new URL(formData.websiteUrl);
            return true;
          } catch {
            return false;
          }
        })(),
      },
      {
        label: 'Preview approved',
        done: previewApproved,
      },
    ],
    [formData, previewApproved, manualAudienceReady, selectedPlacementCount, budgetIsValid, scheduleIsValid]
  );

  const completedChecks = readinessChecks.filter((item) => item.done).length;
  const progressValue = (completedChecks / readinessChecks.length) * 100;
  const activeStepIndex = editorSteps.findIndex((step) => step.value === activeStep);

  const goToNextStep = () => {
    const nextStep = editorSteps[activeStepIndex + 1];

    if (nextStep) {
      setActiveStep(nextStep.value);
    }
  };

  const goToPreviousStep = () => {
    const previousStep = editorSteps[activeStepIndex - 1];

    if (previousStep) {
      setActiveStep(previousStep.value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product || !formData.details) {
      toast.error('Missing required fields', {
        description: 'Please fill out the product and details section.',
      });
      setActiveStep('offer');
      return;
    }

    if (!previewApproved) {
      toast.error('Preview approval required', {
        description: 'Review the preview and confirm it is ready before launching.',
      });
      setActiveStep('review');
      return;
    }

    if (!manualAudienceReady || selectedPlacementCount === 0) {
      toast.error('Audience setup incomplete', {
        description: 'Choose locations, age range, and at least one placement before launching.',
      });
      setActiveStep('audience');
      return;
    }

    if (!budgetIsValid || !scheduleIsValid) {
      toast.error('Budget or schedule incomplete', {
        description: 'Set a valid budget and schedule before launching this campaign.',
      });
      setActiveStep('budget');
      return;
    }

    onGenerate();
  };

  const selectedPlatforms = Array.isArray(formData.platforms) ? formData.platforms : [];

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card className="border-border/80 shadow-card">
          <CardHeader className="space-y-4 border-b border-border/80 pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">Guided workflow</Badge>
              {isAI && <AIBadge />}
              {isTemplate && <TemplateBadge />}
              {templateName ? (
                <Badge variant="outline" className="rounded-full border-border/80 bg-background/70">
                  {templateName}
                </Badge>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">Build the ad step by step</CardTitle>
                  <CardDescription className="mt-1 text-sm leading-6">
                    Start with the essential inputs, then open advanced options only when you need more control.
                  </CardDescription>
                </div>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" className="rounded-2xl border-border/80">
                      <Settings2 className="h-4 w-4" />
                      Advanced Options
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full border-border/80 sm:max-w-lg">
                    <SheetHeader>
                      <SheetTitle>Advanced Options</SheetTitle>
                      <SheetDescription>
                        Keep the main flow simple, then fine-tune destination, variants, and targeting here.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="website-url">Destination URL</Label>
                        <Input
                          id="website-url"
                          value={formData.websiteUrl || ''}
                          onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                          placeholder="https://your-site.com/offer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="simple-audience">Audience shorthand</Label>
                        <Textarea
                          id="simple-audience"
                          value={formData.simpleAudience || ''}
                          onChange={(e) => handleInputChange('simpleAudience', e.target.value)}
                          placeholder="Add a quick shorthand for your targeting team, for example: Retargeting - 25 to 40, high intent buyers"
                          rows={3}
                        />
                      </div>

                      <div className="rounded-2xl border border-border/80 bg-secondary/45 p-4 text-sm text-muted-foreground">
                        Use this drawer for destination URL, shorthand notes, and export-ready setup. Core audience, placements, budget, and schedule now stay in the main flow.
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {completedChecks} of {readinessChecks.length} readiness checks complete
                  </span>
                  <span>{Math.round(progressValue)}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs value={activeStep} onValueChange={(value) => setActiveStep(value as EditorStep)}>
              <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-3xl bg-secondary/60 p-2 lg:grid-cols-5">
                {editorSteps.map((step, index) => (
                  <TabsTrigger
                    key={step.value}
                    value={step.value}
                    className="flex h-auto min-h-[76px] flex-col items-start rounded-2xl px-4 py-3 text-left data-[state=active]:shadow-card"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Step {index + 1}
                    </span>
                    <span className="mt-1 text-sm font-semibold text-foreground">{step.label}</span>
                    <span className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="offer" className="mt-6">
                <Card className="border-border/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <Zap className="mr-2 h-5 w-5" /> Offer
                    </CardTitle>
                    <CardDescription>
                      Define the core product, value proposition, and format before you move on.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="product" className="flex items-center">
                        What are you advertising? * <AIBadge /> <TemplateBadge />
                      </Label>
                      <Input
                        id="product"
                        value={formData.product || ''}
                        onChange={(e) => handleInputChange('product', e.target.value)}
                        placeholder="e.g., Fitness App, Organic Skincare"
                        className={isAI ? 'bg-primary/5 border-primary/20' : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="details" className="flex items-center">
                        Key details or features * <AIBadge /> <TemplateBadge />
                      </Label>
                      <Textarea
                        id="details"
                        value={formData.details || ''}
                        onChange={(e) => handleInputChange('details', e.target.value)}
                        placeholder="Describe the key features, benefits, and unique selling points..."
                        rows={4}
                        className={isAI ? 'bg-primary/5 border-primary/20' : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ad type</Label>
                      <RadioGroup
                        value={formData.adType || 'image'}
                        onValueChange={(value) => handleInputChange('adType', value)}
                        className="grid gap-3 md:grid-cols-3"
                      >
                        {['image', 'video', 'carousel'].map((value) => (
                          <Label
                            key={value}
                            htmlFor={`ad-type-${value}`}
                            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm font-medium capitalize transition hover:border-primary/40 hover:bg-primary/5"
                          >
                            <RadioGroupItem value={value} id={`ad-type-${value}`} />
                            {value}
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="creative" className="mt-6">
                <Card className="border-border/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <Sparkles className="mr-2 h-5 w-5" /> Creative
                    </CardTitle>
                    <CardDescription>Upload media and tighten the main headline before previewing the ad.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.mediaUrl ? (
                      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-muted">
                        <div className="aspect-video overflow-hidden">
                          {formData.mediaType === 'image' ? (
                            <img src={formData.mediaUrl} alt="Uploaded" className="h-full w-full object-cover" />
                          ) : (
                            <video src={formData.mediaUrl} controls className="h-full w-full object-cover" />
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          type="button"
                          className="absolute right-3 top-3"
                          onClick={() => {
                            handleInputChange('mediaUrl', null);
                            handleInputChange('mediaType', 'image');
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div
                        className={`rounded-3xl border-2 border-dashed p-8 text-center transition ${
                          dragActive ? 'border-primary bg-primary/5' : 'border-border bg-background'
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <Upload className="mx-auto mb-3 h-7 w-7 text-primary" />
                        <p className="text-sm font-medium text-foreground">Drag and drop or click to upload media</p>
                        <p className="mt-1 text-xs text-muted-foreground">Supports JPG, PNG, GIF, and MP4 up to 50MB</p>
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*,video/mp4"
                          className="hidden"
                          aria-label="Upload ad media"
                          onChange={(e) => handleFileUpload(e.target.files)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="headline" className="flex items-center">
                        Headline * <AIBadge />
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="headline"
                          value={formData.suggestedHeadlines?.[0] || ''}
                          onChange={(e) => handleInputChange('suggestedHeadlines', [e.target.value])}
                          placeholder="Your main headline..."
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          type="button"
                          className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                          title="AI Generate Variant"
                        >
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audience" className="mt-6">
                <Card className="border-border/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <MapPin className="mr-2 h-5 w-5" /> Audience
                    </CardTitle>
                    <CardDescription>
                      Choose an easier audience mode, then confirm placements and reach before launch.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        {
                          value: 'advantage_plus',
                          title: 'Advantage+ audience',
                          description: 'Use a broader audience and let delivery optimize toward likely responders.',
                        },
                        {
                          value: 'manual',
                          title: 'Manual targeting',
                          description: 'Choose audience details yourself while keeping placements easy to control.',
                        },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={cn(
                            'rounded-3xl border p-4 text-left transition-all',
                            formData.audienceMode === option.value
                              ? 'border-primary bg-primary/5 shadow-card'
                              : 'border-border/80 bg-background hover:border-primary/30'
                          )}
                          onClick={() => handleAudienceFieldChange('audienceMode', option.value as AudienceMode)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{option.title}</p>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">{option.description}</p>
                            </div>
                            <div
                              className={cn(
                                'mt-1 h-5 w-5 rounded-full border-2',
                                formData.audienceMode === option.value ? 'border-primary bg-primary' : 'border-border'
                              )}
                            />
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-3xl border border-border/80 bg-secondary/40 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Audience summary</p>
                          <p className="mt-2 text-lg font-semibold text-foreground">{formData.audienceMode === 'manual' ? 'People you choose through targeting' : 'Advantage+ audience'}</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{audienceSummary}</p>
                        </div>
                        <div className="rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm shadow-sm">
                          <p className="text-muted-foreground">Placements selected</p>
                          <p className="mt-1 font-semibold text-foreground">{selectedPlacementCount || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="locations" className="flex items-center gap-2">
                          <Globe2 className="h-4 w-4 text-primary" /> Locations
                        </Label>
                        <Input
                          id="locations"
                          value={(formData.locations || []).join(', ')}
                          onChange={(e) => handleAudienceFieldChange('locations', parseTagInput(e.target.value))}
                          placeholder="Nigeria, Ghana, Kenya"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="min-age">Min age</Label>
                          <Input
                            id="min-age"
                            type="number"
                            min={13}
                            max={65}
                            value={formData.ageRange?.min ?? 18}
                            onChange={(e) =>
                              handleAudienceFieldChange('ageRange', {
                                min: Number(e.target.value || 18),
                                max: formData.ageRange?.max ?? 65,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-age">Max age</Label>
                          <Input
                            id="max-age"
                            type="number"
                            min={18}
                            max={100}
                            value={formData.ageRange?.max ?? 65}
                            onChange={(e) =>
                              handleAudienceFieldChange('ageRange', {
                                min: formData.ageRange?.min ?? 18,
                                max: Number(e.target.value || 65),
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" /> Gender
                      </Label>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {genderOptions.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            variant={formData.gender === option.value ? 'default' : 'outline'}
                            className="rounded-full"
                            onClick={() => handleAudienceFieldChange('gender', option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {formData.audienceMode === 'manual' ? (
                      <div className="space-y-3 rounded-3xl border border-border/80 bg-background p-4">
                        <div className="space-y-2">
                          <Label htmlFor="interests">Interests</Label>
                          <Input
                            id="interests"
                            value={(formData.interests || []).join(', ')}
                            onChange={(e) => handleAudienceFieldChange('interests', parseTagInput(e.target.value))}
                            placeholder="Skincare, fitness, local businesses"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {interestSuggestions.map((interest) => {
                            const isSelected = (formData.interests || []).includes(interest);
                            return (
                              <Button
                                key={interest}
                                type="button"
                                variant={isSelected ? 'default' : 'outline'}
                                size="sm"
                                className="rounded-full"
                                onClick={() => {
                                  const nextInterests = isSelected
                                    ? (formData.interests || []).filter((item: string) => item !== interest)
                                    : [...(formData.interests || []), interest];
                                  handleAudienceFieldChange('interests', nextInterests);
                                }}
                              >
                                {interest}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
                        Advantage+ keeps targeting broad, then optimizes delivery using your location, age range, and placements. You can still tighten interests later if needed.
                      </div>
                    )}

                    <div className="space-y-3 rounded-3xl border border-border/80 bg-background p-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Placements</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Choose where this ad can appear. The more placements you allow, the more room delivery has to optimize.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {platformOptions.map((platform) => {
                          const isSelected = selectedPlatforms.includes(platform.label);
                          const currentPlacements = formData.placementOptions?.[platform.id] || [];

                          return (
                            <div key={platform.id} className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => togglePlatform(platform.id)}
                                  className="mt-1"
                                  aria-label={`Toggle ${platform.label}`}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-base font-semibold text-foreground">{platform.label}</p>
                                      <p className="text-sm leading-6 text-muted-foreground">{platform.description}</p>
                                    </div>
                                    {isSelected ? <Badge className="rounded-full bg-primary/10 text-primary">On</Badge> : null}
                                  </div>

                                  {isSelected ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {platform.placements.map((placement) => (
                                        <Button
                                          key={placement}
                                          type="button"
                                          variant={currentPlacements.includes(placement) ? 'default' : 'outline'}
                                          size="sm"
                                          className="rounded-full"
                                          onClick={() => togglePlacement(platform.id, placement)}
                                        >
                                          {placement}
                                        </Button>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="budget" className="mt-6">
                <Card className="border-border/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <CircleDollarSign className="mr-2 h-5 w-5" /> Budget and duration
                    </CardTitle>
                    <CardDescription>
                      Set the budget users will actually control before launch. Live spend starts at $0 and updates after delivery begins.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="space-y-4 rounded-3xl border border-border/80 bg-background p-5">
                        <div className="space-y-3">
                          <Label>Budget type</Label>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {[
                              { value: 'daily', label: 'Daily budget', description: 'Best for always-on campaigns and boost-style delivery.' },
                              { value: 'total', label: 'Total budget', description: 'Best when you know the full campaign spend upfront.' },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={cn(
                                  'rounded-3xl border p-4 text-left transition-all',
                                  campaignSettings.budgetPeriod === option.value
                                    ? 'border-primary bg-primary/5 shadow-card'
                                    : 'border-border/80 hover:border-primary/30'
                                )}
                                onClick={() => handleCampaignSettingChange('budgetPeriod', option.value as BudgetPeriod)}
                              >
                                <p className="text-sm font-semibold text-foreground">{option.label}</p>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">{option.description}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-border/70 bg-secondary/20 px-4 py-5 text-center">
                          <p className="text-sm text-muted-foreground">{campaignSettings.budgetPeriod === 'daily' ? 'Daily budget' : 'Total budget'}</p>
                          <div className="mt-2 flex items-center justify-center gap-2 text-primary">
                            <span className="text-5xl font-semibold tracking-tight">${campaignSettings.budget}</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Slider
                            value={[campaignSettings.budget]}
                            min={1}
                            max={budgetSliderMax}
                            step={1}
                            onValueChange={(value) => handleCampaignSettingChange('budget', value[0] || 1)}
                          />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>$1</span>
                            <span>${budgetSliderMax.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {budgetSuggestionValues.map((value) => (
                              <Button
                                key={value}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={() => handleCampaignSettingChange('budget', value)}
                              >
                                ${value}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="budget-input">Adjust budget directly</Label>
                          <Input
                            id="budget-input"
                            type="number"
                            min={1}
                            max={budgetSliderMax}
                            value={campaignSettings.budget}
                            onChange={(e) => handleCampaignSettingChange('budget', Number(e.target.value || 0))}
                          />
                        </div>

                        {campaignSettings.budget <= (campaignSettings.budgetPeriod === 'daily' ? 5 : 100) ? (
                          <div className="rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            Low budgets can limit delivery. Increase the {campaignSettings.budgetPeriod === 'daily' ? 'daily budget' : 'total budget'} if you want broader reach and more data.
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-4">
                        <Card className="border-border/80 bg-secondary/20 shadow-none">
                          <CardContent className="space-y-2 p-4">
                            <div className="flex items-center gap-2 text-primary">
                              <Lightbulb className="h-4 w-4" />
                              <p className="text-sm font-semibold">{estimatedResults.label}</p>
                            </div>
                            <p className="text-3xl font-semibold text-foreground">
                              {estimatedResults.low.toLocaleString()} - {estimatedResults.high.toLocaleString()}
                            </p>
                            <p className="text-sm leading-6 text-muted-foreground">
                              A simple estimate based on budget and selected platforms. Final delivery will adjust after launch.
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-border/80 bg-background shadow-none">
                          <CardContent className="space-y-4 p-4">
                            <div className="space-y-2">
                              <Label htmlFor="start-date" className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-primary" /> Start date
                              </Label>
                              <Input
                                id="start-date"
                                type="date"
                                value={campaignSettings.startDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleCampaignSettingChange('startDate', e.target.value)}
                              />
                            </div>

                            <div className="space-y-3">
                              <Label>Run length</Label>
                              <RadioGroup
                                value={campaignSettings.runContinuously ? 'continuous' : 'end_date'}
                                onValueChange={(value) => handleCampaignSettingChange('runContinuously', value === 'continuous')}
                                className="space-y-3"
                              >
                                <Label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/80 bg-secondary/20 px-4 py-4 text-sm">
                                  <RadioGroupItem value="continuous" className="mt-1" />
                                  <div>
                                    <p className="font-semibold text-foreground">Run continuously</p>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">Keep the campaign live until you pause it from Campaigns.</p>
                                  </div>
                                </Label>
                                <Label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/80 bg-secondary/20 px-4 py-4 text-sm">
                                  <RadioGroupItem value="end_date" className="mt-1" />
                                  <div>
                                    <p className="font-semibold text-foreground">Choose an end date</p>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">Set a clear campaign window when you know the promotion should stop.</p>
                                  </div>
                                </Label>
                              </RadioGroup>
                            </div>

                            {!campaignSettings.runContinuously ? (
                              <div className="space-y-2">
                                <Label htmlFor="end-date">End date</Label>
                                <Input
                                  id="end-date"
                                  type="date"
                                  value={campaignSettings.endDate || ''}
                                  min={campaignSettings.startDate}
                                  onChange={(e) => handleCampaignSettingChange('endDate', e.target.value)}
                                />
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-border/80 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
                                This ad will run on the selected {campaignSettings.budgetPeriod} budget until you pause it.
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="review" className="mt-6">
                <Card className="border-border/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <CheckCircle2 className="mr-2 h-5 w-5" /> Review and launch
                    </CardTitle>
                    <CardDescription>
                      Check what is ready, what still needs attention, and confirm the preview before launch.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-border/80 bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          What happens next
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground">
                          Launch creates the campaign in your workspace and prepares it for platform activation from the campaigns view.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          AI and edits
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground">
                          {isAI
                            ? 'AI prefilled the offer, audience, and headline. You can still change any field before launch.'
                            : 'Everything here is editable. Use the preview rail to confirm the final ad before launching.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Audience</p>
                        <p className="mt-2 text-base font-semibold text-foreground">
                          {formData.audienceMode === 'manual' ? 'Manual targeting' : 'Advantage+ audience'}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{audienceSummary}</p>
                        <p className="mt-3 text-sm text-foreground">{selectedPlatforms.length || 0} platform(s), {selectedPlacementCount || 0} placements</p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Budget and schedule</p>
                        <p className="mt-2 text-base font-semibold text-foreground">
                          ${campaignSettings.budget.toLocaleString()} / {campaignSettings.budgetPeriod}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Starts {campaignSettings.startDate} • {campaignSettings.runContinuously ? 'Runs continuously until paused' : `Ends ${campaignSettings.endDate}`}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-secondary/45 p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="preview-approved"
                          checked={previewApproved}
                          onCheckedChange={(checked) => setPreviewApproved(checked === true)}
                          className="mt-1"
                        />
                        <div>
                          <Label htmlFor="preview-approved" className="text-sm font-medium text-foreground">
                            I have reviewed the preview and approve this version for launch.
                          </Label>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            This keeps the launch flow intentional and makes the readiness checklist fully actionable.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div
              className={cn(
                'mt-6 flex flex-col gap-3 border-t border-border/80 pt-5 sm:flex-row sm:items-center sm:justify-between',
                isMobile && 'sticky bottom-4 z-20 rounded-3xl border border-border/80 bg-background/95 p-3 shadow-soft backdrop-blur'
              )}
            >
              <Button type="button" variant="ghost" onClick={goToPreviousStep} disabled={activeStepIndex === 0}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {activeStep !== 'review' ? (
                <Button type="button" className="rounded-2xl" onClick={goToNextStep}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="rounded-2xl bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/90"
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Launch Campaign'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Card className="border-border/80 shadow-card">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Preview rail</CardTitle>
                <CardDescription>See the current ad state as you edit.</CardDescription>
              </div>
              <div className="inline-flex rounded-full border border-border/80 bg-secondary/60 p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  className="h-8 rounded-full px-3"
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  className="h-8 rounded-full px-3"
                  onClick={() => setPreviewMode('desktop')}
                >
                  <MonitorSmartphone className="h-4 w-4" />
                  Desktop
                </Button>
              </div>
            </div>

            <LivePreview formData={formData} previewMode={previewMode} />
            <p className="text-xs leading-5 text-muted-foreground">
              Preview is based on the current inputs. Use Review to confirm what AI changed and what still needs a final check.
            </p>
          </CardHeader>
        </Card>

        <Card className="border-border/80 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Readiness checklist</CardTitle>
            <CardDescription>
              {completedChecks} of {readinessChecks.length} checks complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {readinessChecks.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-3 py-2"
              >
                <span className="text-sm text-foreground">{item.label}</span>
                <Badge
                  variant={item.done ? 'secondary' : 'outline'}
                  className={
                    item.done
                      ? 'rounded-full bg-primary/10 text-primary'
                      : 'rounded-full border-border/80 text-muted-foreground'
                  }
                >
                  {item.done ? 'Ready' : 'Pending'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <AlertCircle className="mr-1 inline h-3 w-3" />
          Launch finalizes the campaign inside your workspace. Platform activation stays manageable from Campaigns.
        </div>
      </div>
    </form>
  );
};

export default AdCreator;
