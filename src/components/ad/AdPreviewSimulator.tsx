import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { 
  Smartphone, 
  Monitor, 
  Users, 
  TrendingUp, 
  BarChart3,
  Target,
  Eye,
  MousePointer,
  DollarSign
} from "lucide-react";
import SocialMediaPreview from "./SocialMediaPreview";

interface AdPreviewSimulatorProps {
  adContent: {
    title?: string;
    description?: string;
    imageUrl?: string;
    cta?: string;
    product?: string;
    details?: string;
    websiteUrl?: string;
    platforms?: string[];
    placementOptions?: Record<string, string[]>;
    targetAudience?: {
      age: { min: number; max: number };
      gender: string;
      interests: string[];
    };
  };
  isGenerating?: boolean;
}

const AdPreviewSimulator = ({ adContent, isGenerating = false }: AdPreviewSimulatorProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState("facebook");
  const [deviceView, setDeviceView] = useState<"mobile" | "desktop">("mobile");
  const [audienceSize, setAudienceSize] = useState([50]);
  const [engagementRate, setEngagementRate] = useState([30]);
  const [targetingPreset, setTargetingPreset] = useState("balanced");

  const platforms = [
    { id: "facebook", name: "Facebook", color: "bg-blue-600", textColor: "text-blue-600" },
    { id: "instagram", name: "Instagram", color: "bg-pink-600", textColor: "text-pink-600" },
    { id: "twitter", name: "Twitter", color: "bg-blue-500", textColor: "text-blue-500" },
    { id: "tiktok", name: "TikTok", color: "bg-black", textColor: "text-black" },
    { id: "google", name: "Google", color: "bg-red-600", textColor: "text-red-600" },
    { id: "youtube", name: "YouTube", color: "bg-red-500", textColor: "text-red-500" }
  ];

  const targetingPresets = {
    broad: { audienceSize: 80, engagementRate: 20, label: "Broad Targeting" },
    balanced: { audienceSize: 50, engagementRate: 30, label: "Balanced Targeting" },
    specific: { audienceSize: 25, engagementRate: 45, label: "Specific Targeting" }
  };

  const calculateMetrics = () => {
    const baseReach = {
      facebook: 100000,
      twitter: 75000,
      instagram: 120000,
      tiktok: 200000,
      google: 150000,
      youtube: 180000
    };
    
    const base = baseReach[selectedPlatform as keyof typeof baseReach] || 100000;
    const reach = Math.floor((base * audienceSize[0]) / 100);
    const engagement = Math.floor((reach * engagementRate[0]) / 100);
    const ctr = (engagementRate[0] / 10).toFixed(1);
    const cpc = (0.5 + Math.random() * 1.5).toFixed(2);
    
    return { reach, engagement, ctr, cpc };
  };

  const metrics = calculateMetrics();

  const handlePresetChange = (preset: string) => {
    setTargetingPreset(preset);
    const presetData = targetingPresets[preset as keyof typeof targetingPresets];
    setAudienceSize([presetData.audienceSize]);
    setEngagementRate([presetData.engagementRate]);
  };

  const formData = {
    product: adContent.title || adContent.product || "Sample Product",
    details: adContent.description || adContent.details || "This is a sample ad description for preview purposes.",
    websiteUrl: adContent.websiteUrl || "example.com",
    mediaUrl: adContent.imageUrl,
    platforms: adContent.platforms || [selectedPlatform],
    placementOptions: adContent.placementOptions || {}
  };

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Ad Preview Simulator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Platform</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platforms.map((platform) => (
                <motion.button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedPlatform === platform.id
                      ? `${platform.color} text-white border-transparent`
                      : "border-border hover:border-primary"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-sm font-medium">{platform.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Device View Toggle */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Device View</label>
            <div className="flex gap-2">
              <Button
                variant={deviceView === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setDeviceView("mobile")}
                className="flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Mobile
              </Button>
              <Button
                variant={deviceView === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => setDeviceView("desktop")}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                Desktop
              </Button>
            </div>
          </div>

          {/* Targeting Presets */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Targeting Strategy</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(targetingPresets).map(([key, preset]) => (
                <Button
                  key={key}
                  variant={targetingPreset === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange(key)}
                  className="flex flex-col items-start p-4 h-auto"
                >
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-xs opacity-70">
                    {preset.audienceSize}% reach • {preset.engagementRate}% engagement
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Manual Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Audience Size: {audienceSize[0]}%
              </label>
              <Slider
                value={audienceSize}
                onValueChange={setAudienceSize}
                max={100}
                min={5}
                step={5}
                className="w-full"
              />
              <Progress value={audienceSize[0]} className="h-2" />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">
                Engagement Rate: {engagementRate[0]}%
              </label>
              <Slider
                value={engagementRate}
                onValueChange={setEngagementRate}
                max={60}
                min={5}
                step={1}
                className="w-full"
              />
              <Progress value={engagementRate[0]} max={60} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Simulation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Est. Reach</span>
              </div>
              <div className="text-2xl font-bold">
                {metrics.reach.toLocaleString()}
              </div>
              <Badge variant="secondary" className="text-xs">
                +12% vs avg
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Engagement</span>
              </div>
              <div className="text-2xl font-bold">
                {metrics.engagement.toLocaleString()}
              </div>
              <Badge variant="secondary" className="text-xs">
                +8% vs avg
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MousePointer className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Est. CTR</span>
              </div>
              <div className="text-2xl font-bold">{metrics.ctr}%</div>
              <Badge variant="secondary" className="text-xs">
                Above avg
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Est. CPC</span>
              </div>
              <div className="text-2xl font-bold">${metrics.cpc}</div>
              <Badge variant="secondary" className="text-xs">
                Below avg
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={deviceView === "mobile" ? "max-w-sm mx-auto" : "max-w-2xl mx-auto"}>
            <SocialMediaPreview 
              formData={{
                ...formData,
                platforms: [selectedPlatform]
              }}
              device={deviceView}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdPreviewSimulator;