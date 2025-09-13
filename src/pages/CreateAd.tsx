import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp, type AdContent, type Campaign } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Smartphone, Monitor, Tablet, Sparkles, Target, FileText, TestTube } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import AdCreator from "@/components/ad/AdCreator";
import AdPreview from "@/components/ad/AdPreview";
import AdPreviewAnimation from "@/components/ad/AdPreviewAnimation";
import SocialMediaPreview from "@/components/ad/SocialMediaPreview";
import { TemplateSystem } from "@/components/TemplateSystem";
import { ABTestingInterface } from "@/components/ABTestingInterface";
import { PerformancePrediction } from "@/components/PerformancePrediction";

const CreateAd = () => {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  
  const [formData, setFormData] = useState<AdContent>({
    product: "",
    details: "",
    websiteUrl: "",
    adType: "image" as "image" | "video" | "carousel",
    platforms: [],
    audience: "",
    mediaUrl: "",
    mediaType: "image" as "image" | "video"
  });

  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [showTemplates, setShowTemplates] = useState(false);

  // Form validation
  const formValidation = useFormValidation(formData, {
    product: { required: true, minLength: 3, maxLength: 100 },
    details: { required: true, minLength: 10, maxLength: 500 },
    websiteUrl: { 
      required: true, 
      pattern: /^https?:\/\/.+\..+/,
      custom: (value) => {
        if (!value.startsWith('http')) return 'URL must start with http:// or https://';
        return true;
      }
    },
    platforms: { 
      custom: (value) => Array.isArray(value) && value.length > 0 ? true : 'Select at least one platform'
    }
  });

  // Auto-save functionality
  const { restoreFromAutoSave, clearAutoSave } = useAutoSave(
    formData,
    (data) => {
      // Save to local storage or API
      console.log('Auto-saving form data:', data);
    },
    {
      key: 'ad-creator-form',
      enabled: true,
      delay: 3000
    }
  );

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 's',
        ctrlKey: true,
        metaKey: true,
        action: () => {
          handleGenerate();
        },
        description: 'Save/Generate ad',
        category: 'Creation'
      },
      {
        key: 't',
        ctrlKey: true,
        metaKey: true,
        action: () => {
          setShowTemplates(!showTemplates);
        },
        description: 'Toggle templates',
        category: 'Creation'
      },
      {
        key: 'Escape',
        action: () => {
          setShowTemplates(false);
        },
        description: 'Close templates',
        category: 'Navigation'
      }
    ]
  });

  // Load selected campaign/ad data if editing
  useEffect(() => {
    if (state.selectedCampaign) {
      const updatedData = {
        ...formData,
        product: state.selectedCampaign.name,
        platforms: state.selectedCampaign.platform,
        ...state.selectedCampaign.adContent
      };
      setFormData(updatedData);
      formValidation.resetForm();
    }
    if (state.selectedAd) {
      const updatedData = {
        ...formData,
        ...state.selectedAd.content
      };
      setFormData(updatedData);
      formValidation.resetForm();
    }
    
    // Try to restore from auto-save on component mount
    const restored = restoreFromAutoSave();
    if (restored && !state.selectedCampaign && !state.selectedAd) {
      setFormData(restored);
      toast({
        title: "Draft Restored",
        description: "Your previous work has been restored from auto-save.",
      });
    }
  }, [state.selectedCampaign, state.selectedAd]);

  const handleGenerate = async () => {
    // Validate form before generating
    if (!formValidation.isValid) {
      formValidation.submitForm(() => {});
      return;
    }

    setIsGenerating(true);
    
    try {
      // Clear auto-save since we're submitting
      clearAutoSave();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (state.selectedAd) {
        // Update existing ad
        actions.updateAd(state.selectedAd.id, {
          content: formData,
          name: formData.product || state.selectedAd.name
        });
        actions.selectAd(null);
      } else if (state.selectedCampaign) {
        // Create new ad for existing campaign
        actions.createAd({
          name: formData.product || "New Ad",
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
        // Create new campaign and ad
        const newCampaign: Omit<Campaign, 'id' | 'createdAt'> = {
          name: formData.product || "New Campaign",
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
        title: "Success!",
        description: "Your ad has been created successfully.",
      });
      
      // Navigate to campaigns page
      setTimeout(() => navigate('/campaigns'), 1000);
      
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was an error creating your ad. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20" />
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 text-yellow-400" />
            AI Ad Studio
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Create professional, high-converting advertisements across multiple platforms with AI-powered optimization
          </p>
        </motion.div>

        {/* Template System */}
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto mb-6"
          >
            <TemplateSystem
              onUseTemplate={(template) => {
                setFormData(prev => ({ ...prev, ...template.content }));
                setShowTemplates(false);
                toast({
                  title: "Template Applied",
                  description: `${template.name} template has been applied to your ad.`,
                });
              }}
            />
          </motion.div>
        )}

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-7xl mx-auto"
        >
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary-600 p-6">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6" />
                  <h2 className="text-2xl font-bold">Campaign Creator</h2>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Templates
                  </Button>
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="text-sm">Real-time preview</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="border-b">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="create">Create</TabsTrigger>
                  <TabsTrigger value="test">A/B Test</TabsTrigger>
                  <TabsTrigger value="predict">Predict</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="create" className="mt-0">
                <div className="grid lg:grid-cols-3 gap-0">
                  {/* Creator Form - 2/3 width */}
                  <div className="lg:col-span-2 p-6 bg-gradient-to-b from-white to-gray-50/50 border-r">
                    <AdCreator
                      formData={formValidation.data}
                      setFormData={(data) => {
                        setFormData(data);
                        Object.keys(data).forEach(key => {
                          formValidation.updateField(key, data[key as keyof typeof data]);
                        });
                      }}
                      onGenerate={handleGenerate}
                      isGenerating={isGenerating}
                    />
                  </div>

                  {/* Preview Section - 1/3 width */}
                  <div className="p-6 bg-white">
                    <div className="sticky top-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Eye className="h-5 w-5 text-primary" />
                          Live Preview
                        </h3>
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                          <Button
                            variant={previewDevice === "desktop" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setPreviewDevice("desktop")}
                            className="p-2"
                          >
                            <Monitor className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={previewDevice === "tablet" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setPreviewDevice("tablet")}
                            className="p-2"
                          >
                            <Tablet className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={previewDevice === "mobile" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setPreviewDevice("mobile")}
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
                        
                        <div className="min-h-[500px]">
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
              </TabsContent>

              <TabsContent value="test" className="mt-0">
                <div className="p-6">
                  <ABTestingInterface
                    onCreateTest={(test) => {
                      toast({
                        title: "A/B Test Created",
                        description: "Your ad variant has been created for testing.",
                      });
                    }}
                    onUpdateTest={(testId, updates) => {
                      toast({
                        title: "Test Updated",
                        description: "Your A/B test has been updated.",
                      });
                    }}
                    onDeleteTest={(testId) => {
                      toast({
                        title: "Test Deleted",
                        description: "Your A/B test has been deleted.",
                      });
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="predict" className="mt-0">
                <div className="p-6">
                  <PerformancePrediction
                    campaignData={formData}
                    adData={formData}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <div className="p-6">
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <Button
                        variant={previewDevice === "desktop" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewDevice("desktop")}
                        className="p-2"
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewDevice === "tablet" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewDevice("tablet")}
                        className="p-2"
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewDevice === "mobile" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewDevice("mobile")}
                        className="p-2"
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="max-w-4xl mx-auto">
                    <SocialMediaPreview formData={formData} device={previewDevice} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CreateAd;