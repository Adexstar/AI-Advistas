import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdCreator from '@/components/ad/AdCreator';
import { useApp, type AdContent, type Campaign, type CampaignDraftSettings } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import {
  clearCreateFlowSession,
  readCreateFlowSession,
  saveCreateFlowSession,
} from '@/lib/createFlowSession';

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const AdEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { state, actions } = useApp();

  const locationState = (location.state || {}) as Record<string, any>;
  const persistedSession = readCreateFlowSession();
  const activeState = Object.keys(locationState).length > 0 ? locationState : (persistedSession || {});
  const initialData = activeState.initialData || {};
  const isAI = activeState.isAI || false;
  const templateId = activeState.templateId;
  const isTemplate = activeState.isTemplate || false;
  const isScratch = activeState.isScratch || false;
  const templateName = activeState.initialData?.templateName || activeState.templateName;

  const defaultCampaignSettings: CampaignDraftSettings = {
    budget: 25,
    budgetPeriod: 'daily',
    startDate: formatDateForInput(new Date()),
    endDate: formatDateForInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    runContinuously: true,
  };

  const [formData, setFormData] = useState<AdContent>({
    ...initialData,
    product: initialData.product || '',
    details: initialData.details || '',
    websiteUrl: initialData.websiteUrl || '',
    adType: initialData.adType || 'image',
    platforms: initialData.platforms || [],
    audience: initialData.audience || '',
    audienceMode: initialData.audienceMode || 'advantage_plus',
    ageRange: initialData.ageRange || { min: 18, max: 65 },
    locations: initialData.locations || [],
    interests: initialData.interests || [],
    gender: initialData.gender || 'all',
    mediaUrl: initialData.mediaUrl || '',
    mediaType: initialData.mediaType || 'image',
    placementOptions: initialData.placementOptions || {},
    simpleAudience: initialData.simpleAudience || '',
    suggestedHeadlines: initialData.suggestedHeadlines || initialData.aiMetadata?.suggestedHeadlines || []
  });

  const [campaignSettings, setCampaignSettings] = useState<CampaignDraftSettings>({
    ...defaultCampaignSettings,
    ...(activeState.campaignSettings || {}),
  });

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (campaignId) {
      return;
    }

    saveCreateFlowSession({
      initialData: formData,
      campaignSettings,
      isAI,
      isTemplate,
      isScratch,
      templateId,
    });
  }, [campaignId, formData, campaignSettings, isAI, isTemplate, isScratch, templateId]);

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
        budget: campaignSettings.budget,
        budgetPeriod: campaignSettings.budgetPeriod,
        spent: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        startDate: campaignSettings.startDate,
        endDate: campaignSettings.runContinuously ? undefined : campaignSettings.endDate,
        runContinuously: campaignSettings.runContinuously,
        adContent: formData
      };
      
      actions.createCampaign(newCampaign);
      clearCreateFlowSession();
      
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
    if (templateId || isTemplate) return `Customize Template: ${templateName || 'Template Ad'}`;
    return 'New Ad Setup';
  };

  const getSubtitle = () => {
    if (campaignId) return 'Make changes to your live campaign settings.';
    if (isAI) return 'AI has pre-filled the form. Simply review the copy, audience, and placements.';
    if (templateId || isTemplate) return 'This template is loaded with proven content. Customize it to match your needs.';
    return 'Fill in the details to launch your ad campaign.';
  };

  if (!campaignId && !Object.keys(initialData).length && !isScratch && !isAI && !templateId) {
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
    <div className="page-container py-4 md:py-6">
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
        campaignSettings={campaignSettings}
        setCampaignSettings={setCampaignSettings}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        initialData={initialData}
        isAI={isAI}
        isTemplate={isTemplate}
        templateName={templateName}
      />
    </div>
  );
};

export default AdEditor;
