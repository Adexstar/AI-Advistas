import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, LayoutTemplate, Square, ArrowLeft } from 'lucide-react';
import QuickDraftPrompt from '@/components/ad/QuickDraftPrompt';
import TemplateBrowser from '@/components/ad/TemplateBrowser';
import type { AdDraftResponse } from '@/schemas/adDraftSchema';

type AdCreationMethod = 'AI_DRAFT' | 'TEMPLATE' | 'SCRATCH' | null;

const CreateAd = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<AdCreationMethod>(null);

  const handleDataReady = (data: Partial<AdDraftResponse> & { templateId?: string }) => {
    navigate('/ad-editor', {
      state: {
        initialData: data,
        isAI: !!data.aiGenerated,
        templateId: data.templateId
      }
    });
  };

  const handleStartFromScratch = () => {
    navigate('/ad-editor', { state: { initialData: {}, isScratch: true } });
  };

  if (method === 'AI_DRAFT') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button variant="ghost" onClick={() => setMethod(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Options
        </Button>
        <QuickDraftPrompt
          onDraftGenerated={(draft) => handleDataReady(draft)}
          onSkip={handleStartFromScratch}
        />
      </div>
    );
  }

  if (method === 'TEMPLATE') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Button variant="ghost" onClick={() => setMethod(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Options
        </Button>
        <TemplateBrowser onTemplateSelect={(templateData) => handleDataReady(templateData)} />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-center">How Would You Like to Create Your Ad?</h1>
      <p className="text-lg text-muted-foreground text-center">Select the option that gets you to launch the fastest.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          onClick={() => setMethod('AI_DRAFT')}
          className="cursor-pointer hover:border-primary transition-all shadow-lg border-2 border-primary/20"
        >
          <CardHeader>
            <Wand2 className="h-8 w-8 text-primary mb-2" />
            <CardTitle>1. AI Quick Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Tell the AI your goal. We'll generate copy, audience, and placements instantly.
            </CardDescription>
            <Button className="mt-4 w-full" variant="default">
              Start with AI
            </Button>
          </CardContent>
        </Card>

        <Card
          onClick={() => setMethod('TEMPLATE')}
          className="cursor-pointer hover:border-secondary transition-all"
        >
          <CardHeader>
            <LayoutTemplate className="h-8 w-8 text-secondary mb-2" />
            <CardTitle>2. Use a Template</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Browse pre-designed layouts optimized for specific platforms and goals.
            </CardDescription>
            <Button className="mt-4 w-full" variant="secondary">
              Browse Templates
            </Button>
          </CardContent>
        </Card>

        <Card
          onClick={handleStartFromScratch}
          className="cursor-pointer hover:border-muted-foreground/50 transition-all"
        >
          <CardHeader>
            <Square className="h-8 w-8 text-muted-foreground mb-2" />
            <CardTitle>3. Start from Scratch</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Full control. Build your ad step-by-step with manual input for all settings.
            </CardDescription>
            <Button className="mt-4 w-full" variant="outline">
              Manual Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateAd;