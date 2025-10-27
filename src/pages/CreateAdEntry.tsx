import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, LayoutTemplate, Square, ArrowLeft } from 'lucide-react';
import QuickDraftPrompt from '@/components/ad/QuickDraftPrompt';
import TemplateBrowser from '@/components/ad/TemplateBrowser';
import type { AdDraftResponse } from '@/schemas/adDraftSchema';

type AdCreationMethod = 'AI_DRAFT' | 'TEMPLATE' | 'SCRATCH' | null;

const CreateAdEntry = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<AdCreationMethod>(null);

  const handleDraftGenerated = (draft: AdDraftResponse) => {
    navigate('/ad-editor', { state: { draftData: draft, isAI: true } });
  };

  const handleTemplateSelect = (template: any) => {
    navigate('/ad-editor', { state: { templateData: template, templateId: template.id } });
  };

  const handleStartFromScratch = () => {
    navigate('/ad-editor', { state: { isScratch: true } });
  };

  const handleBack = () => {
    setMethod(null);
  };

  // AI Draft view
  if (method === 'AI_DRAFT') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-6">
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
        <div className="container max-w-7xl mx-auto py-6">
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
      className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-12"
    >
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How Would You Like to Create Your Ad?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select the option that gets you to launch the fastest. Each path leads to the same powerful editor.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Option 1: AI Quick Draft */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card 
              onClick={() => setMethod('AI_DRAFT')}
              className="cursor-pointer h-full border-2 border-primary/20 hover:border-primary hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-primary/5 to-primary/10"
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Wand2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">1. AI Quick Draft</CardTitle>
                <CardDescription className="text-base">
                  Tell the AI your goal in one sentence. We'll generate copy, audience, and placements instantly.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-3 mb-6">
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
              className="cursor-pointer h-full border-2 hover:border-secondary hover:shadow-lg transition-all duration-300"
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
              className="cursor-pointer h-full border-2 hover:border-muted-foreground/30 hover:shadow-lg transition-all duration-300"
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
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          <p>💡 Don't worry - you can customize everything in the next step, regardless of which option you choose</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CreateAdEntry;
