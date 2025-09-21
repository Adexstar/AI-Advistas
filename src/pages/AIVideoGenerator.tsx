import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeAdGenerator, GeneratedAd } from '@/hooks/useRealTimeAdGenerator';
import { useExportAd } from '@/hooks/useExportAd';
import { usePlan } from '@/hooks/usePlan';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Play, 
  Wand2, 
  RefreshCw, 
  Download, 
  Copy, 
  Trash2,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Video,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Loader2,
  Zap,
  Lock,
  CheckCircle,
  BarChart3,
  Clock,
  Eye
} from 'lucide-react';

type AdType = 'text' | 'image' | 'video';

interface SavedAd {
  id: string;
  product_name: string;
  content: {
    headline: string;
    body: string;
    cta: string;
    hashtags: string[];
    imageUrl?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
  };
  ad_type: AdType;
  platform: string;
  created_at: string;
}

const AIVideoGenerator: React.FC = () => {
  const { user } = useAuth();
  const { 
    isGenerating, 
    generatedContent, 
    generateAdContent, 
    regenerate, 
    clearGenerated 
  } = useRealTimeAdGenerator();
  
  const { exportAdContent, copyTextContent } = useExportAd();
  const { canUse, incrementUsage, getRemainingUsage, getCurrentPlan, loading: planLoading } = usePlan();

  // State management
  const [productDescription, setProductDescription] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [adType, setAdType] = useState<AdType>('text');
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [loadingSavedAds, setLoadingSavedAds] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Platform and ad type configurations
  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-500' },
    { id: 'instagram-post', name: 'Instagram Post', icon: Instagram, color: 'bg-pink-500' },
    { id: 'instagram-story', name: 'Instagram Story', icon: Instagram, color: 'bg-purple-500' },
    { id: 'tiktok', name: 'TikTok', icon: Video, color: 'bg-black' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-500' },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'bg-gray-900' },
  ];

  const adTypes: { id: AdType; name: string; icon: any; description: string }[] = [
    { id: 'text', name: 'Text Ad', icon: FileText, description: 'Headlines, body text, and CTAs' },
    { id: 'image', name: 'Image Ad', icon: ImageIcon, description: 'Visual content with generated images' },
    { id: 'video', name: 'Video Ad', icon: Video, description: 'Dynamic video content (AI-powered)' },
  ];

  // Plan limits and features
  const { currentPlan } = usePlan();
  const remainingGenerations = getRemainingUsage('ads_generated');
  const canGenerate = canUse('ads_generated');

  // Fetch saved ads
  const fetchSavedAds = async () => {
    if (!user) return;
    
    setLoadingSavedAds(true);
    try {
      const { data, error } = await supabase
        .from('generated_ads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const transformedData = (data || []).map(ad => ({
        id: ad.id,
        product_name: ad.product_name,
        content: ad.content as SavedAd['content'],
        ad_type: ad.ad_type as AdType,
        platform: ad.platform,
        created_at: ad.created_at
      }));
      
      setSavedAds(transformedData);
    } catch (error) {
      console.error('Error fetching saved ads:', error);
    } finally {
      setLoadingSavedAds(false);
    }
  };

  useEffect(() => {
    fetchSavedAds();
  }, [user]);

  // Enhanced generation with progress tracking
  const handleGenerate = async () => {
    if (!productDescription.trim()) {
      toast.error('Please enter a product description');
      return;
    }
    
    if (!selectedPlatform) {
      toast.error('Please select a platform');
      return;
    }

    if (!canGenerate) {
      toast.error(`You've reached your ${currentPlan} plan limit. Upgrade to generate more ads.`);
      return;
    }

    // Simulate progress for better UX
    setGenerationProgress(0);
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 20;
      });
    }, 500);

    try {
      await generateAdContent({
        product: productDescription,
        platform: selectedPlatform,
        adType: adType
      });
      
      // Increment usage after successful generation
      await incrementUsage('ads_generated');
      setGenerationProgress(100);
      
      // Refresh saved ads
      fetchSavedAds();
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

  // Enhanced export functionality
  const handleExport = async (format: 'json' | 'png' | 'jpg' | 'mp4', size?: string) => {
    if (!generatedContent) return;
    
    await exportAdContent(
      generatedContent, 
      productDescription, 
      selectedPlatform,
      { format, size } as any
    );
  };

  const handleCopyText = () => {
    if (generatedContent) {
      copyTextContent(generatedContent);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      const { error } = await supabase
        .from('generated_ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      setSavedAds(prev => prev.filter(ad => ad.id !== adId));
      toast.success('Ad deleted successfully');
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Failed to delete ad');
    }
  };

  const getPlatformIcon = (platformName: string) => {
    const platform = platforms.find(p => p.id === platformName);
    return platform ? platform.icon : Sparkles;
  };

  const getAdTypeIcon = (type: AdType) => {
    const adTypeConfig = adTypes.find(t => t.id === type);
    return adTypeConfig ? adTypeConfig.icon : FileText;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            AI Ad Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Create compelling advertisements with AI-powered content generation. 
            Generate text, images, and videos optimized for every platform.
          </p>
          
          {/* Plan Status */}
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            <Badge variant={currentPlan === 'free' ? 'secondary' : 'default'} className="px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              {currentPlan.toUpperCase()} Plan
            </Badge>
            <div className="text-sm text-muted-foreground">
              {remainingGenerations} generations remaining
            </div>
            <Badge variant="outline" className="px-3 py-1">
              <BarChart3 className="w-4 h-4 mr-2" />
              {savedAds.length} ads generated
            </Badge>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Generation Controls */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Prompt Section */}
            <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  What are you advertising?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product">Product Description</Label>
                  <Textarea
                    id="product"
                    placeholder="e.g., Revolutionary smartwatch with health tracking and GPS..."
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="mt-2 min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Be specific about features, benefits, and target audience
                  </p>
                </div>
                
                {/* Ad Type Selection */}
                <div>
                  <Label>Ad Type</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {adTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <Button
                          key={type.id}
                          variant={adType === type.id ? "default" : "outline"}
                          onClick={() => setAdType(type.id)}
                          className="justify-start h-auto p-4"
                        >
                          <IconComponent className="w-4 h-4 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">{type.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {type.description}
                            </div>
                          </div>
                          {type.id === 'video' && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              NEW
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Platform Selection */}
                <div>
                  <Label>Platform</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {platforms.map((platform) => {
                      const IconComponent = platform.icon;
                      return (
                        <Button
                          key={platform.id}
                          variant={selectedPlatform === platform.id ? "default" : "outline"}
                          onClick={() => setSelectedPlatform(platform.id)}
                          className="justify-start h-12"
                        >
                          <IconComponent className="w-4 h-4 mr-2" />
                          <span className="truncate">{platform.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generation Button */}
            <Card>
              <CardContent className="p-6">
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !canGenerate || planLoading}
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : !canGenerate ? (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Limit Reached
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Generate Ad Content
                    </>
                  )}
                </Button>

                {/* Progress Bar */}
                {isGenerating && (
                  <div className="mt-4">
                    <Progress value={generationProgress} className="h-2" />
                    <div className="text-sm text-center text-muted-foreground mt-2">
                      {generationProgress < 30 ? 'Analyzing product...' :
                       generationProgress < 60 ? 'Generating content...' :
                       generationProgress < 90 ? 'Creating visuals...' :
                       'Finalizing...'}
                    </div>
                  </div>
                )}

                {/* Quick Tips */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">💡 Quick Tips</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Be specific about your product features</li>
                    <li>• Mention your target audience</li>
                    <li>• Include key benefits or selling points</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    Live Preview
                  </CardTitle>
                  
                  {generatedContent && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={regenerate}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </Button>
                      
                      {/* Export Options */}
                      <div className="flex gap-1">
                        <Button
                          onClick={handleCopyText}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        
                        {generatedContent.imageUrl && (
                          <>
                            <Button
                              onClick={() => handleExport('png')}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              PNG
                            </Button>
                            <Button
                              onClick={() => handleExport('jpg')}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              JPG
                            </Button>
                          </>
                        )}
                        
                        {generatedContent.videoUrl && (
                          <Button
                            onClick={() => handleExport('mp4')}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            MP4
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => handleExport('json')}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          JSON
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center h-96 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border-2 border-dashed border-primary/20"
                    >
                      <div className="text-center space-y-4">
                        <div className="relative">
                          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                          <div className="absolute inset-0 w-12 h-12 animate-ping bg-primary/20 rounded-full mx-auto"></div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Generating Your Ad</h3>
                          <p className="text-sm text-muted-foreground">
                            AI is creating optimized content for {selectedPlatform}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : generatedContent ? (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-6"
                    >
                      {/* Text Content */}
                      <div className="grid gap-4">
                        <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Headline</span>
                          </div>
                          <h3 className="text-xl font-bold">{generatedContent.headline}</h3>
                        </div>
                        
                        <div className="p-4 bg-muted/50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Body Text</span>
                          </div>
                          <p className="text-sm leading-relaxed">{generatedContent.body}</p>
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="flex-1 p-4 bg-accent/50 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-4 h-4 text-accent-foreground" />
                              <span className="text-sm font-medium">Call to Action</span>
                            </div>
                            <Button className="w-full" size="sm">
                              {generatedContent.cta}
                            </Button>
                          </div>
                          
                          <div className="flex-1 p-4 bg-secondary/50 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">#</span>
                              <span className="text-sm font-medium">Hashtags</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {generatedContent.hashtags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visual Content */}
                      {(generatedContent.imageUrl || generatedContent.videoUrl) && (
                        <div className="space-y-4">
                          <Separator />
                          
                          {/* Image Preview */}
                          {generatedContent.imageUrl && (
                            <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border">
                              <div className="flex items-center gap-2 mb-4">
                                <ImageIcon className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Generated Image</span>
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Ready
                                </Badge>
                              </div>
                              <div className="relative rounded-lg overflow-hidden bg-black/5">
                                <img 
                                  src={generatedContent.imageUrl} 
                                  alt="Generated ad content"
                                  className="w-full h-64 object-cover"
                                />
                              </div>
                            </div>
                          )}

                          {/* Video Preview */}
                          {generatedContent.videoUrl && (
                            <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border">
                              <div className="flex items-center gap-2 mb-4">
                                <Video className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Generated Video</span>
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Ready
                                </Badge>
                                {generatedContent.duration && (
                                  <Badge variant="outline" className="text-xs">
                                    {generatedContent.duration}s
                                  </Badge>
                                )}
                              </div>
                              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                                <video 
                                  src={generatedContent.videoUrl}
                                  poster={generatedContent.thumbnailUrl}
                                  controls
                                  className="w-full h-full object-cover"
                                >
                                  Your browser does not support the video tag.
                                </video>
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <Play className="w-12 h-12 text-white" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Video Placeholder for video type without URL */}
                          {adType === 'video' && !generatedContent.videoUrl && (
                            <div className="p-4 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-lg border-2 border-dashed border-primary/30">
                              <div className="flex items-center gap-2 mb-4">
                                <Video className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Video Generation</span>
                                <Badge variant="secondary" className="text-xs">
                                  Processing...
                                </Badge>
                              </div>
                              <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
                                <div className="text-center space-y-2">
                                  <Video className="w-12 h-12 text-primary mx-auto" />
                                  <div className="space-y-1">
                                    <h3 className="font-semibold">Video Being Generated</h3>
                                    <p className="text-sm text-muted-foreground">This may take a few minutes...</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20"
                    >
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <Wand2 className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Ready to Create</h3>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            Enter your product description and select preferences to generate your ad content
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Content Library */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Content Library
                  <Badge variant="outline" className="ml-auto">
                    {savedAds.length} ads
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSavedAds ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading your ads...</span>
                  </div>
                ) : savedAds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No saved ads yet. Generate your first ad to see it here!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {savedAds.map((ad) => {
                      const PlatformIcon = getPlatformIcon(ad.platform);
                      const TypeIcon = getAdTypeIcon(ad.ad_type);
                      
                      return (
                        <div key={ad.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <TypeIcon className="h-4 w-4 text-primary" />
                            </div>
                            <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{ad.product_name}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {ad.content.headline}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {ad.ad_type}
                              </Badge>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(ad.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-1">
                            {ad.content.imageUrl && (
                              <Button
                                onClick={() => window.open(ad.content.imageUrl, '_blank')}
                                variant="outline"
                                size="sm"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDeleteAd(ad.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AIVideoGenerator;