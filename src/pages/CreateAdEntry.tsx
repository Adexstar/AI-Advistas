import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, LayoutTemplate, Square, ArrowLeft } from 'lucide-react';
import QuickDraftPrompt from '@/components/ad/QuickDraftPrompt';
import TemplateBrowser from '@/components/ad/TemplateBrowser';
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
      <div className="min-h-screen bg-background">
        <div className="page-container py-4 sm:py-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Options
          </Button>
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
      <div className="min-h-screen bg-background">
        <div className="page-container py-4 sm:py-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Options
          </Button>
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
      className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8 sm:py-10 lg:py-12"
    >
      <div className="page-container">
        <div className="mb-8 text-center sm:mb-10 lg:mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="mb-4 break-words text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              How Would You Like to Create Your Ad?
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-foreground/80 sm:text-base md:text-lg">
              Select the option that gets you to launch the fastest. Each path leads to the same powerful editor.
            </p>
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
              className="h-full cursor-pointer border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 transition-all duration-300 hover:border-primary hover:shadow-lg"
            >
              <CardHeader className="pb-4 text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Wand2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">1. AI Quick Draft</CardTitle>
                <CardDescription className="text-base">
                  Tell the AI your goal in one sentence. We'll generate copy, audience, and placements instantly.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
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
              className="h-full cursor-pointer border-2 transition-all duration-300 hover:border-secondary hover:shadow-lg"
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                  <LayoutTemplate className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-2xl mb-2">2. Use a Template</CardTitle>
                <CardDescription className="text-base">
                  Browse pre-designed layouts optimized for specific platforms and goals.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
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
                <Button variant="secondary" className="w-full" size="lg">
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
              className="h-full cursor-pointer border-2 transition-all duration-300 hover:border-muted-foreground/30 hover:shadow-lg"
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Square className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl mb-2">3. Start from Scratch</CardTitle>
                <CardDescription className="text-base">
                  Full control. Build your ad step-by-step with manual input for all settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
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
          <p>Don't worry. You can customize everything in the next step, regardless of which option you choose.</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CreateAdEntry;
