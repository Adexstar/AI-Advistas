import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  RefreshCw, 
  Trash2,
  Image,
  Sparkles,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  CheckCircle2,
  BarChart3,
  Zap,
  Type,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeAdGenerator } from "@/hooks/useRealTimeAdGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  };
  ad_type: AdType;
  platform: string;
  created_at: string;
}

const AIVideoGenerator = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    isGenerating,
    generatedContent,
    currentRequest,
    generateAdContent,
    regenerate,
    clearGenerated
  } = useRealTimeAdGenerator();

  // Form data
  const [product, setProduct] = useState("");
  const [platform, setPlatform] = useState("facebook");
  const [adType, setAdType] = useState<AdType>("image");
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);

  // Fetch saved ads from database
  useEffect(() => {
    if (user) {
      fetchSavedAds();
    }
  }, [user]);

  const fetchSavedAds = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_ads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Transform the data to match our interface
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
    }
  };

  const handleGenerate = async () => {
    if (!product.trim()) {
      toast({
        title: "Missing product",
        description: "Please describe your product or service.",
        variant: "destructive"
      });
      return;
    }

    await generateAdContent({
      product: product.trim(),
      platform,
      adType
    });
    
    // Refresh saved ads after generation
    setTimeout(fetchSavedAds, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const downloadAdContent = () => {
    if (!generatedContent) return;
    
    const content = {
      ...generatedContent,
      product: currentRequest?.product,
      platform: currentRequest?.platform,
      adType: currentRequest?.adType,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-content-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPlatformIcon = (platformName: string) => {
    const icons: { [key: string]: any } = {
      facebook: Facebook,
      instagram: Instagram,
      twitter: Twitter,
      youtube: Youtube,
      linkedin: Sparkles
    };
    return icons[platformName.toLowerCase()] || Sparkles;
  };

  const getAdTypeIcon = (type: AdType) => {
    const icons = {
      text: Type,
      image: Image,
      video: Zap
    };
    return icons[type];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full mr-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Ad Generator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create compelling ad content using AI. Generate headlines, copy, and images perfect for social media campaigns and marketing.
          </p>
          
          {/* Analytics Card */}
          <div className="flex items-center justify-center mt-6">
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="flex items-center space-x-6 p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">Generated Ads</p>
                    <p className="text-2xl font-bold text-primary">{savedAds.length}</p>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Success Rate</p>
                  <p className="text-2xl font-bold text-primary">95%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            <Card className="shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product">Product or Service</Label>
                  <Input
                    id="product"
                    placeholder="e.g., iPhone 15, Fitness App, Coffee Shop..."
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Describe what you're advertising
                  </p>
                </div>
                
                <div>
                  <Label>Ad Type</Label>
                  <Select value={adType} onValueChange={(value: AdType) => setAdType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Ad</SelectItem>
                      <SelectItem value="image">Image Ad</SelectItem>
                      <SelectItem value="video">Video Ad (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Generation Controls */}
            <Card className="shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Ad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGenerate}
                  disabled={!product.trim() || isGenerating}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin mr-2">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Ad Content
                    </>
                  )}
                </Button>

                {generatedContent && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={regenerate}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={downloadAdContent}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Generated Content Preview */}
            <Card className="shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {React.createElement(getAdTypeIcon(adType), { className: "h-5 w-5 mr-2" })}
                  <span>Generated Content</span>
                  {currentRequest && (
                    <Badge variant="secondary" className="ml-auto">
                      {currentRequest.platform}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!generatedContent && !isGenerating && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Ready to generate amazing ads</p>
                    <p className="text-sm">Enter your product details and click generate to start</p>
                  </div>
                )}

                {isGenerating && (
                  <div className="text-center py-12">
                    <div className="animate-spin mx-auto mb-4">
                      <Sparkles className="h-12 w-12 text-primary" />
                    </div>
                    <p className="text-lg font-medium mb-2">Generating your ad content...</p>
                    <p className="text-sm text-muted-foreground">
                      This may take a few moments
                    </p>
                  </div>
                )}

                {generatedContent && (
                  <div className="space-y-6">
                    {/* Text Content */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-primary">Headline</Label>
                        <div className="p-3 bg-muted rounded-lg mt-1">
                          <p className="font-semibold text-lg">{generatedContent.headline}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-primary">Body Text</Label>
                        <div className="p-3 bg-muted rounded-lg mt-1">
                          <p className="text-sm leading-relaxed">{generatedContent.body}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-primary">Call to Action</Label>
                        <div className="p-3 bg-muted rounded-lg mt-1">
                          <Button size="sm" className="pointer-events-none">
                            {generatedContent.cta}
                          </Button>
                        </div>
                      </div>
                      
                      {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                        <div>
                          <Label className="text-sm font-semibold text-primary">Hashtags</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {generatedContent.hashtags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Generated Image Preview */}
                    {generatedContent.imageUrl && (
                      <div>
                        <Label className="text-sm font-semibold text-primary">Generated Image</Label>
                        <div className="mt-2 border rounded-lg overflow-hidden">
                          <img
                            src={generatedContent.imageUrl}
                            alt="Generated ad image"
                            className="w-full h-64 object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {adType === 'video' && (
                      <div className="text-center py-8 bg-muted/50 rounded-lg">
                        <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium">Video Generation Coming Soon</p>
                        <p className="text-sm text-muted-foreground">
                          We've generated the text content. Video generation will be available soon!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Ads */}
            <Card className="shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Your Generated Ads
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedAds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No saved ads yet. Generate your first ad to see it here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedAds.map((ad) => {
                      const PlatformIcon = getPlatformIcon(ad.platform);
                      const TypeIcon = getAdTypeIcon(ad.ad_type);
                      
                      return (
                        <div key={ad.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <TypeIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{ad.product_name}</h3>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {ad.content.headline}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{ad.platform}</span>
                              <Badge variant="outline" className="text-xs">
                                {ad.ad_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(ad.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4" />
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