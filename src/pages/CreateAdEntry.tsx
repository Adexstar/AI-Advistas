import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, LayoutTemplate, Square, ArrowLeft, Megaphone, Rocket, Target, Sparkles } from 'lucide-react';
import QuickDraftPrompt from '@/components/ad/QuickDraftPrompt';
import TemplateBrowser from '@/components/ad/TemplateBrowser';
import GenerateTemplateDialog from '@/components/ad/GenerateTemplateDialog';
import type { AdDraftResponse } from '@/schemas/adDraftSchema';
import { saveCreateFlowSession } from '@/lib/createFlowSession';
import type { CampaignDraftSettings } from '@/contexts/AppContext';

type AdCreationMethod = 'AI_DRAFT' | 'TEMPLATE' | 'SCRATCH' | null;

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const createDefaultCampaignSettings = (): CampaignDraftSettings => ({
  budget: 25,
  budgetPeriod: 'daily',
  startDate: formatDateForInput(new Date()),
  endDate: formatDateForInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  runContinuously: true,
});

const CreateAdEntry = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<AdCreationMethod>(null);

  const handleDataReady = (data: Partial<AdDraftResponse> & { templateId?: string; templateName?: string }) => {
    const createFlowState = {
      initialData: data,
      campaignSettings: createDefaultCampaignSettings(),
      isAI: !!data.aiGenerated,
      isTemplate: !!data.templateId,
      templateId: data.templateId,
    };

    saveCreateFlowSession(createFlowState);

    navigate('/ad-editor', {
      state: createFlowState,
    });
  };

  const handleDraftGenerated = (draft: AdDraftResponse) => {
    handleDataReady(draft);
  };

  const handleTemplateSelect = (template: any) => {
    handleDataReady({
      ...template,
      templateId: template.id,
    });
  };

  const handleStartFromScratch = () => {
    const createFlowState = {
      initialData: {},
      campaignSettings: createDefaultCampaignSettings(),
      isScratch: true,
    };

    saveCreateFlowSession(createFlowState);
    navigate('/ad-editor', { state: createFlowState });
  };

  const handleBack = () => {
    setMethod(null);
  };

  // AI Draft view
  if (method === 'AI_DRAFT') {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.1),_transparent_22%),linear-gradient(180deg,rgba(248,250,252,1),rgba(255,255,255,1))]">
        <div className="page-container py-4 sm:py-6">
          <div className="mb-4 flex items-center justify-between rounded-[24px] border border-border/70 bg-background/85 p-3 shadow-card">
            <Button variant="ghost" onClick={handleBack} className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Options
            </Button>
            <Badge variant="outline" className="rounded-full px-3 py-1">AI draft flow</Badge>
          </div>
          <QuickDraftPrompt 
            onDraftGenerated={handleDraftGenerated} 
            onSkip={handleStartFromScratch}
          />
        </div>
      </div>
    );
  }

  // Template Browser view
  if (method === 'TEMPLATE') {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.1),_transparent_24%),linear-gradient(180deg,rgba(248,250,252,1),rgba(255,255,255,1))]">
        <div className="page-container py-4 sm:py-6">
          <div className="mb-4 flex items-center justify-between rounded-[24px] border border-border/70 bg-background/85 p-3 shadow-card">
            <Button variant="ghost" onClick={handleBack} className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Options
            </Button>
            <Badge variant="outline" className="rounded-full px-3 py-1">Template flow</Badge>
          </div>
          <TemplateBrowser onTemplateSelect={handleTemplateSelect} />
        </div>
      </div>
    );
  }

  // Default: Entry screen with 3 options
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_26%),linear-gradient(180deg,rgba(248,250,252,1),rgba(255,255,255,1))] py-8 sm:py-10 lg:py-12"
    >
      <div className="page-container">
        <div className="mb-8 rounded-[36px] border border-border/80 bg-background/88 p-6 text-center shadow-card sm:mb-10 lg:mb-12 lg:p-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Badge variant="outline" className="mb-4 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
              Campaign creation
            </Badge>
            <h1 className="mb-4 break-words text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Build your next ad the way your team actually works
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-foreground/80 sm:text-base md:text-lg">
              Start from an AI brief, a proven template, or a blank canvas. Every path still lands in the same editor, but the framing now mirrors an ad workflow instead of a generic setup screen.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5">
                <Rocket className="h-3.5 w-3.5 text-sky-600" />
                Launch faster
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-600" />
                Match the campaign goal
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5">
                <Megaphone className="h-3.5 w-3.5 text-amber-600" />
                Creative built for ads
              </span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3 lg:gap-8">
          {/* Option 1: AI Quick Draft */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card 
              onClick={() => setMethod('AI_DRAFT')}
              className="h-full cursor-pointer border-2 border-primary/20 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.15),_transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.95))] transition-all duration-300 hover:border-primary hover:shadow-lg"
            >
              <CardHeader className="pb-4 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Wand2 className="h-8 w-8 text-primary" />
                </div>
                <Badge variant="outline" className="mx-auto rounded-full px-3 py-1">Fastest route</Badge>
                <CardTitle className="text-2xl mb-2">1. AI Quick Draft</CardTitle>
                <CardDescription className="text-base">
                  Tell the AI your goal in one sentence. We'll generate copy, audience, and placements instantly.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4 rounded-[24px] border border-primary/10 bg-background/70 p-4 text-left text-sm text-muted-foreground">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">Best for</p>
                  <p className="mt-2">Teams that need a launchable concept, message angle, and target audience in minutes.</p>
                </div>
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-muted-foreground">Fastest path to launch</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-muted-foreground">AI-powered copy & targeting</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-muted-foreground">Fully customizable after</span>
                  </div>
                </div>
                <Button className="w-full" size="lg">
                  Start with AI
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Option 2: Use a Template */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card 
              onClick={() => setMethod('TEMPLATE')}
              className="h-full cursor-pointer border-2 border-amber-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,251,235,0.96))] transition-all duration-300 hover:border-amber-500 hover:shadow-lg"
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                  <LayoutTemplate className="h-8 w-8 text-amber-600" />
                </div>
                <Badge variant="outline" className="mx-auto rounded-full px-3 py-1">Design-led</Badge>
                <CardTitle className="text-2xl mb-2">2. Use a Template</CardTitle>
                <CardDescription className="text-base">
                  Browse pre-designed layouts optimized for specific platforms and goals.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4 rounded-[24px] border border-amber-500/10 bg-background/70 p-4 text-left text-sm text-muted-foreground">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">Best for</p>
                  <p className="mt-2">Campaigns that already know the platform, need a polished visual starting point, and want less design friction.</p>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-muted-foreground">Proven designs</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-muted-foreground">Platform-specific layouts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-muted-foreground">Quick customization</span>
                  </div>
                </div>
                <Button className="w-full bg-amber-500 text-amber-950 hover:bg-amber-400" size="lg">
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Option 3: Start from Scratch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card 
              onClick={handleStartFromScratch}
              className="h-full cursor-pointer border-2 border-slate-300/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] transition-all duration-300 hover:border-muted-foreground/30 hover:shadow-lg"
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Square className="h-8 w-8 text-muted-foreground" />
                </div>
                <Badge variant="outline" className="mx-auto rounded-full px-3 py-1">Manual control</Badge>
                <CardTitle className="text-2xl mb-2">3. Start from Scratch</CardTitle>
                <CardDescription className="text-base">
                  Full control. Build your ad step-by-step with manual input for all settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4 rounded-[24px] border border-slate-200 bg-background/70 p-4 text-left text-sm text-muted-foreground">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">Best for</p>
                  <p className="mt-2">Advanced users who already have the angle, assets, and structure mapped out.</p>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                    <span className="text-muted-foreground">Complete creative freedom</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                    <span className="text-muted-foreground">Manual configuration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                    <span className="text-muted-foreground">Advanced options</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" size="lg">
                  Manual Setup
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center text-sm text-foreground/70"
        >
          <p>Every route still ends in the same editor, so you can change copy, creative, audience, and budget after the initial setup.</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CreateAdEntry;
