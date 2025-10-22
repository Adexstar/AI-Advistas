import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Sparkles, Eye, Smartphone, Monitor, Tablet } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdCreator from '@/components/ad/AdCreator';
import AdPreview from '@/components/ad/AdPreview';
import AdPreviewAnimation from '@/components/ad/AdPreviewAnimation';
import SocialMediaPreview from '@/components/ad/SocialMediaPreview';
import { toast } from '@/hooks/use-toast';
import { useApp, type AdContent, type Campaign } from '@/contexts/AppContext';
import type { AdDraftResponse } from '@/schemas/adDraftSchema';

const AdEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, actions } = useApp();

  // Extract initial data from navigation state
  const { draftData, templateData, isAI, isScratch, templateId } = location.state || {};

  const [formData, setFormData] = useState<AdContent>({
    product: '',
    details: '',
    websiteUrl: '',
    adType: 'image' as 'image' | 'video' | 'carousel',
    platforms: [],
    audience: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video',
    placementOptions: {},
    simpleAudience: ''
  });

  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize form with data from navigation state
  useEffect(() => {
    if (draftData) {
      setFormData(prev => ({ ...prev, ...draftData }));
    } else if (templateData) {
      setFormData(prev => ({ ...prev, ...templateData.content }));
    }
  }, [draftData, templateData]);

  const handleBack = () => {
    navigate('/create');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (state.selectedAd) {
        actions.updateAd(state.selectedAd.id, {
          content: formData,
          name: formData.product || state.selectedAd.name
        });
        actions.selectAd(null);
      } else if (state.selectedCampaign) {
        actions.createAd({
          name: formData.product || 'New Ad',
          campaignId: state.selectedCampaign.id,
          status: 'draft',
          format: formData.adType as 'image' | 'video' | 'carousel',
          impressions: 0,
          clicks: 0,
          ctr: 0,
          content: formData
        });
        actions.selectCampaign(null);
      } else {
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
      }
      
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
    if (isAI) return 'Review & Refine AI Ad Draft';
    if (templateId) return 'Customize Template Ad';
    return 'New Ad Setup';
  };

  const getDescription = () => {
    if (isAI) return 'AI has pre-filled the form. Simply review the copy, audience, and placements.';
    if (templateId) return 'This template has been loaded with proven content. Customize it to match your needs.';
    return 'Fill in the details to launch your ad campaign.';
  };

  // Security check: Redirect if accessed directly without proper state
  if (!draftData && !isScratch && !templateId && !templateData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center p-6"
      >
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Please start your ad creation from the Create Ad page.
            </p>
            <Button onClick={handleBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Create Ad
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background"
    >
      <div className="container max-w-7xl mx-auto py-6 px-4">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Creation Options
        </Button>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2 mb-2">
                  {getTitle()}
                  {isAI && (
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{getDescription()}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex flex-col xl:grid xl:grid-cols-3 gap-0">
              {/* Editor Form */}
              <div className="xl:col-span-2 p-6 bg-gradient-to-b from-background to-muted/10 xl:border-r">
                <div className="max-h-[80vh] overflow-y-auto pr-2">
                  <AdCreator
                    formData={formData}
                    setFormData={setFormData}
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    initialData={formData}
                  />
                </div>
              </div>

              {/* Preview Section */}
              <div className="p-6 bg-background">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Live Preview
                    </h3>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <Button
                        variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewDevice('desktop')}
                        className="p-2"
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewDevice === 'tablet' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewDevice('tablet')}
                        className="p-2"
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewDevice('mobile')}
                        className="p-2"
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="static" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="static" className="text-xs">Static</TabsTrigger>
                      <TabsTrigger value="interactive" className="text-xs">Interactive</TabsTrigger>
                      <TabsTrigger value="social" className="text-xs">Platforms</TabsTrigger>
                    </TabsList>
                    
                    <div className="min-h-[300px] lg:min-h-[400px] max-h-[60vh] overflow-y-auto">
                      <TabsContent value="static" className="mt-0">
                        <AdPreview formData={formData} device={previewDevice} />
                      </TabsContent>
                      
                      <TabsContent value="interactive" className="mt-0">
                        <AdPreviewAnimation formData={formData} device={previewDevice} />
                      </TabsContent>
                      
                      <TabsContent value="social" className="mt-0">
                        <SocialMediaPreview formData={formData} device={previewDevice} />
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default AdEditor;
