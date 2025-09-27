import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Wand2, Target, Camera, Video, Grid3X3, CheckCircle, Lightbulb, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAICampaign, type AICampaignResponse } from "@/hooks/useAICampaign";

interface AdCreatorProps {
  formData: any;
  setFormData: (data: any) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const AdCreator = ({ formData, setFormData, onGenerate, isGenerating }: AdCreatorProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [aiCampaign, setAiCampaign] = useState<AICampaignResponse | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  
  const aiCampaignMutation = useAICampaign();

  const platforms = [
    { id: "facebook", name: "Facebook", color: "bg-blue-100 text-blue-800 border-blue-200", icon: "📘" },
    { id: "instagram", name: "Instagram", color: "bg-pink-100 text-pink-800 border-pink-200", icon: "📷" },
    { id: "tiktok", name: "TikTok", color: "bg-slate-100 text-slate-800 border-slate-200", icon: "🎵" },
    { id: "twitter", name: "Twitter", color: "bg-blue-100 text-blue-800 border-blue-200", icon: "🐦" },
    { id: "youtube", name: "YouTube", color: "bg-red-100 text-red-800 border-red-200", icon: "📹" },
    { id: "google", name: "Google Ads", color: "bg-red-100 text-red-800 border-red-200", icon: "🔍" }
  ];

  const audiencePersonas = [
    "Young Adults (18-24)",
    "Young Professionals (25-34)", 
    "Parents (30-45)",
    "Seniors (55+)",
    "College Students",
    "Business Owners",
    "High Income Individuals",
    "General Audience"
  ];

  const placementOptions = {
    facebook: ["Newsfeed", "Stories", "Marketplace", "Video Feeds", "Right Column", "In-stream"],
    instagram: ["Feed", "Stories", "Explore", "Reels", "Shop", "Profile"],
    tiktok: ["For You Page", "Following Feed", "TopView", "Brand Takeover", "Branded Effects", "Hashtag Challenge"],
    twitter: ["Timeline", "Profile", "Search", "Explore", "Spaces", "Trending Topics"],
    youtube: ["Pre-roll", "Display", "Overlay", "Sponsored Cards", "Bumper", "Masthead"],
    google: ["Search", "Display", "YouTube", "Shopping", "Apps", "Discovery"]
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handlePlatformToggle = (platformId: string) => {
    const newPlatforms = formData.platforms.includes(platformId)
      ? formData.platforms.filter((id: string) => id !== platformId)
      : [...formData.platforms, platformId];
    
    handleInputChange("platforms", newPlatforms);
    
    // Reset placements when platforms change
    if (!newPlatforms.includes(platformId)) {
      const newPlacements = { ...formData.placementOptions };
      delete newPlacements[platformId];
      handleInputChange("placementOptions", newPlacements);
    }
  };

  const handlePlacementToggle = (platform: string, placement: string) => {
    const currentPlacements = formData.placementOptions[platform] || [];
    const newPlacements = currentPlacements.includes(placement)
      ? currentPlacements.filter((p: string) => p !== placement)
      : [...currentPlacements, placement];
    
    handleInputChange("placementOptions", {
      ...formData.placementOptions,
      [platform]: newPlacements
    });
  };

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4"];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, GIF, or MP4 files only.",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File too large", 
        description: "Please upload files smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }
    
    const mediaType = file.type.startsWith("image/") ? "image" : "video";
    const mediaUrl = URL.createObjectURL(file);
    
    handleInputChange("mediaUrl", mediaUrl);
    handleInputChange("mediaType", mediaType);
    
    toast({
      title: "Media uploaded successfully",
      description: `${file.name} has been uploaded.`,
    });
  }, [formData, setFormData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const validateForm = () => {
    const required = ["product", "details", "audience"];
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }
    
    if (formData.websiteUrl && !/^https?:\/\/.+\..+/.test(formData.websiteUrl)) {
      toast({
        title: "Invalid website URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleAICampaignGenerate = async () => {
    if (!validateForm()) return;
    
    try {
      const campaignData = {
        product: formData.product,
        details: formData.details,
        platforms: formData.platforms,
        audience: formData.audience,
        simpleAudience: formData.simpleAudience,
        adType: formData.adType,
        placementOptions: formData.placementOptions,
        websiteUrl: formData.websiteUrl
      };
      
      const result = await aiCampaignMutation.mutateAsync(campaignData);
      setAiCampaign(result);
      setShowAISuggestions(true);
      
      toast({
        title: "AI Campaign Generated!",
        description: "Your personalized campaign strategy is ready.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate AI campaign",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = () => {
    if (validateForm()) {
      onGenerate();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Ad Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">What are you advertising? *</Label>
            <Input
              id="product"
              placeholder="e.g., Fitness app, Organic skincare, Digital marketing course"
              value={formData.product}
              onChange={(e) => handleInputChange("product", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Key details or features *</Label>
            <Textarea
              id="details"
              placeholder="Describe the key features, benefits, and unique selling points of your product or service..."
              rows={4}
              value={formData.details}
              onChange={(e) => handleInputChange("details", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Your website URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://yourwebsite.com"
              value={formData.websiteUrl}
              onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Ad Type</Label>
            <RadioGroup
              value={formData.adType}
              onValueChange={(value) => handleInputChange("adType", value)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="image" id="image" />
                <Label htmlFor="image" className="flex items-center gap-2 cursor-pointer">
                  <Camera className="h-4 w-4" />
                  Image
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer">
                  <Video className="h-4 w-4" />
                  Video
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="carousel" id="carousel" />
                <Label htmlFor="carousel" className="flex items-center gap-2 cursor-pointer">
                  <Grid3X3 className="h-4 w-4" />
                  Carousel
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Media Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Media Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.mediaUrl ? (
            <div className="relative">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {formData.mediaType === "image" ? (
                  <img
                    src={formData.mediaUrl}
                    alt="Uploaded media"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={formData.mediaUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  handleInputChange("mediaUrl", null);
                  handleInputChange("mediaType", "image");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-primary/50 ${
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Upload your media</p>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop or click to select images (JPG, PNG, GIF) or videos (MP4)
              </p>
              <input
                id="file-upload"
                type="file"
                accept="image/*,video/mp4"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Platform Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {platforms.map((platform) => {
              const isSelected = formData.platforms.includes(platform.id);
              return (
                <motion.div
                  key={platform.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-muted hover:border-primary/50"
                  }`}
                  onClick={() => handlePlatformToggle(platform.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <p className="font-medium">{platform.name}</p>
                      <Badge variant="secondary" className={platform.color}>
                        {platform.name}
                      </Badge>
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2"
                    >
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Platform-specific placements */}
          {formData.platforms.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Advanced Placement Options</h4>
              {formData.platforms.map((platformId: string) => {
                const platform = platforms.find(p => p.id === platformId);
                const placements = placementOptions[platformId as keyof typeof placementOptions] || [];
                
                return (
                  <div key={platformId} className="space-y-3">
                    <h5 className="flex items-center gap-2 font-medium">
                      <span>{platform?.icon}</span>
                      {platform?.name} Placements
                    </h5>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {placements.map((placement) => (
                        <div key={placement} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${platformId}-${placement}`}
                            checked={formData.placementOptions[platformId]?.includes(placement)}
                            onCheckedChange={() => handlePlacementToggle(platformId, placement)}
                          />
                          <Label
                            htmlFor={`${platformId}-${placement}`}
                            className="text-sm cursor-pointer"
                          >
                            {placement}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audience Targeting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Audience Targeting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="audience">Primary audience persona *</Label>
            <Select
              value={formData.audience}
              onValueChange={(value) => handleInputChange("audience", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your target audience" />
              </SelectTrigger>
              <SelectContent>
                {audiencePersonas.map((persona) => (
                  <SelectItem key={persona} value={persona}>
                    {persona}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="simpleAudience">Additional audience details</Label>
            <Textarea
              id="simpleAudience"
              placeholder="Describe specific interests, behaviors, or demographics for better targeting..."
              rows={3}
              value={formData.simpleAudience}
              onChange={(e) => handleInputChange("simpleAudience", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Generate Buttons */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Button 
            onClick={handleAICampaignGenerate}
            disabled={aiCampaignMutation.isPending}
            className="w-full h-12 text-lg"
            variant="outline"
          >
            {aiCampaignMutation.isPending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <Lightbulb className="h-5 w-5" />
                </motion.div>
                Generating AI Strategy...
              </>
            ) : (
              <>
                <Lightbulb className="mr-2 h-5 w-5" />
                Generate AI Campaign Strategy
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full h-12 text-lg"
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <Wand2 className="h-5 w-5" />
                </motion.div>
                Creating Campaign...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Create Campaign
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Campaign Suggestions */}
      {showAISuggestions && aiCampaign && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Lightbulb className="h-5 w-5" />
              AI Campaign Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campaign Overview */}
            <div className="space-y-2">
              <h4 className="font-semibold">Strategy Overview</h4>
              <p className="text-sm text-muted-foreground">{aiCampaign.campaign_overview.strategy_summary}</p>
              <div className="space-y-1">
                <p className="text-sm font-medium">Key Messaging:</p>
                <p className="text-sm text-muted-foreground">{aiCampaign.campaign_overview.key_messaging}</p>
              </div>
            </div>

            {/* Platform-specific campaigns */}
            <div className="space-y-4">
              <h4 className="font-semibold">Platform Strategies</h4>
              {Object.entries(aiCampaign.platform_campaigns).map(([platform, campaign]) => (
                <div key={platform} className="border rounded-lg p-4 space-y-3 bg-background">
                  <h5 className="font-medium capitalize flex items-center gap-2">
                    {platforms.find(p => p.id === platform)?.icon} {platform}
                  </h5>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Headlines:</p>
                    <div className="space-y-1">
                      {campaign.headlines.map((headline, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="flex-1">{headline}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(headline)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Body Copy:</p>
                    <div className="flex items-start gap-2">
                      <p className="text-sm text-muted-foreground flex-1">{campaign.body_copy}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(campaign.body_copy)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium">Recommended CTA:</p>
                      <p className="text-muted-foreground">{campaign.cta}</p>
                    </div>
                    <div>
                      <p className="font-medium">Target Interests:</p>
                      <p className="text-muted-foreground">{campaign.targeting.interests.join(', ')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Budget Recommendations */}
            <div className="space-y-2">
              <h4 className="font-semibold">Budget Recommendations</h4>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Daily Budget:</span> {aiCampaign.budget_recommendations.recommended_daily_budget}</p>
                <p><span className="font-medium">Platform Allocation:</span> {aiCampaign.budget_recommendations.platform_allocation}</p>
                <p><span className="font-medium">Scaling Strategy:</span> {aiCampaign.budget_recommendations.scaling_strategy}</p>
              </div>
            </div>

            {/* Optimization Tips */}
            <div className="space-y-2">
              <h4 className="font-semibold">Optimization Tips</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {aiCampaign.optimization_tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAISuggestions(false)}
              className="w-full"
            >
              Hide AI Suggestions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdCreator;