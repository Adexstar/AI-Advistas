import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdCreator from '@/components/ad/AdCreator';
import { useApp, type AdContent, type Campaign } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

const AdEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { state, actions } = useApp();

  const locationState = location.state || {};
  const initialData = locationState.initialData || {};
  const isAI = locationState.isAI || false;
  const templateId = locationState.templateId;
  const isTemplate = locationState.isTemplate || false;
  const isScratch = locationState.isScratch || false;

  const [formData, setFormData] = useState<AdContent>({
    ...initialData,
    product: initialData.product || '',
    details: initialData.details || '',
    websiteUrl: initialData.websiteUrl || '',
    adType: initialData.adType || 'image',
    platforms: initialData.platforms || [],
    audience: initialData.audience || '',
    mediaUrl: initialData.mediaUrl || '',
    mediaType: initialData.mediaType || 'image',
    placementOptions: initialData.placementOptions || {},
    simpleAudience: initialData.simpleAudience || ''
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleBack = () => {
    if (campaignId) {
      navigate('/campaigns');
    } else {
      navigate('/create');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newCampaign: Omit<Campaign, 'id' | 'createdAt'> = {
        name: formData.product || 'New Campaign',
        status: 'draft',
        platform: formData.platforms,
        budget: 1000,
        spent: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adContent: formData
      };
      
      actions.createCampaign(newCampaign);
      
      toast({
        title: 'Success!',
        description: 'Your ad has been created successfully.',
      });
      
      setTimeout(() => navigate('/campaigns'), 1000);
      
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: 'There was an error creating your ad. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getTitle = () => {
    if (campaignId) return `Edit Campaign: ${campaignId}`;
    if (isAI) return 'Review & Refine AI Ad Draft';
    if (templateId || isTemplate) return `Customize Template: ${locationState.initialData?.templateName || 'Template Ad'}`;
    return 'New Ad Setup';
  };

  const getSubtitle = () => {
    if (campaignId) return 'Make changes to your live campaign settings.';
    if (isAI) return 'AI has pre-filled the form. Simply review the copy, audience, and placements.';
    if (templateId || isTemplate) return 'This template is loaded with proven content. Customize it to match your needs.';
    return 'Fill in the details to launch your ad campaign.';
  };

  if (!campaignId && !initialData && !isScratch && !isAI && !templateId) {
    return (
      <div className="p-10 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          Please start your ad creation from the{' '}
          <span onClick={handleBack} className="text-primary cursor-pointer underline">
            Create Ad page
          </span>
          .
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go to Create Ad
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <Button variant="ghost" onClick={handleBack} className="mb-4 text-primary">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Options
      </Button>
      
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">{getTitle()}</h1>
        <p className="text-sm text-muted-foreground">{getSubtitle()}</p>
      </div>

      <AdCreator 
        formData={formData}
        setFormData={setFormData}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        initialData={initialData}
      />
    </div>
  );
};

export default AdEditor;
