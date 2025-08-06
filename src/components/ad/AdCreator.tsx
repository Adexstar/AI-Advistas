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
import { Upload, X, Wand2, Target, Camera, Video, Grid3X3, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdCreatorProps {
  formData: any;
  setFormData: (data: any) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const AdCreator = ({ formData, setFormData, onGenerate, isGenerating }: AdCreatorProps) => {
  const [dragActive, setDragActive] = useState(false);

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

  const handleGenerate = () => {
    if (validateForm()) {
      onGenerate();
    }
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

      {/* Generate Button */}
      <Card>
        <CardContent className="pt-6">
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
                Generating AI Campaign...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Generate AI Campaign
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdCreator;