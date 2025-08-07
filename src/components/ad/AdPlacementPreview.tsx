import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Monitor, 
  Smartphone, 
  MessageCircle, 
  Search,
  Home,
  PlayCircle,
  ShoppingBag,
  TrendingUp
} from "lucide-react";

interface AdPlacementPreviewProps {
  adContent: {
    title?: string;
    description?: string;
    imageUrl?: string;
    cta?: string;
    product?: string;
    details?: string;
    websiteUrl?: string;
  };
}

const AdPlacementPreview = ({ adContent }: AdPlacementPreviewProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState("facebook");
  const [selectedPlacement, setSelectedPlacement] = useState("feed");
  const [deviceView, setDeviceView] = useState<"mobile" | "desktop">("mobile");

  const previewTemplates = [
    {
      id: "facebook",
      name: "Facebook",
      color: "#1877F2",
      placementTypes: [
        { id: "feed", name: "News Feed", icon: Home, desc: "Main timeline placement" },
        { id: "stories", name: "Stories", icon: PlayCircle, desc: "Full-screen stories" },
        { id: "marketplace", name: "Marketplace", icon: ShoppingBag, desc: "Shopping section" },
        { id: "video", name: "Video Feeds", icon: PlayCircle, desc: "Video content" },
        { id: "rightcolumn", name: "Right Column", icon: MessageCircle, desc: "Sidebar ads" }
      ]
    },
    {
      id: "instagram",
      name: "Instagram", 
      color: "#E1306C",
      placementTypes: [
        { id: "feed", name: "Feed", icon: Home, desc: "Main feed placement" },
        { id: "stories", name: "Stories", icon: PlayCircle, desc: "Story carousel" },
        { id: "explore", name: "Explore", icon: Search, desc: "Explore tab" },
        { id: "reels", name: "Reels", icon: PlayCircle, desc: "Short video content" },
        { id: "shop", name: "Shop", icon: ShoppingBag, desc: "Shopping tab" }
      ]
    },
    {
      id: "twitter",
      name: "Twitter",
      color: "#1DA1F2", 
      placementTypes: [
        { id: "timeline", name: "Timeline", icon: Home, desc: "Main timeline" },
        { id: "profile", name: "Profile", icon: MessageCircle, desc: "Profile visits" },
        { id: "search", name: "Search", icon: Search, desc: "Search results" },
        { id: "explore", name: "Explore", icon: TrendingUp, desc: "Trending content" }
      ]
    },
    {
      id: "tiktok",
      name: "TikTok",
      color: "#000000",
      placementTypes: [
        { id: "foryou", name: "For You Page", icon: Home, desc: "Main feed" },
        { id: "topview", name: "TopView", icon: PlayCircle, desc: "Premium placement" },
        { id: "branded", name: "Branded Effects", icon: TrendingUp, desc: "AR filters" },
        { id: "hashtag", name: "Hashtag Challenge", icon: TrendingUp, desc: "Trending hashtags" }
      ]
    }
  ];

  const currentPlatform = previewTemplates.find(p => p.id === selectedPlatform);
  const currentPlacement = currentPlatform?.placementTypes.find(p => p.id === selectedPlacement);

  const renderPreviewContent = () => {
    const baseContent = {
      title: adContent.title || adContent.product || "Your Amazing Product",
      description: adContent.description || adContent.details || "Discover the perfect solution for your needs.",
      imageUrl: adContent.imageUrl,
      cta: adContent.cta || "Learn More",
      websiteUrl: adContent.websiteUrl || "example.com"
    };

    switch (selectedPlatform) {
      case "facebook":
        return <FacebookPlacementPreview placement={selectedPlacement} content={baseContent} device={deviceView} />;
      case "instagram":
        return <InstagramPlacementPreview placement={selectedPlacement} content={baseContent} device={deviceView} />;
      case "twitter":
        return <TwitterPlacementPreview placement={selectedPlacement} content={baseContent} device={deviceView} />;
      case "tiktok":
        return <TikTokPlacementPreview placement={selectedPlacement} content={baseContent} device={deviceView} />;
      default:
        return <div className="text-center py-8 text-muted-foreground">Select a platform to preview</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Placement Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <TabsList className="grid grid-cols-4 w-full">
              {previewTemplates.map((platform) => (
                <TabsTrigger key={platform.id} value={platform.id}>
                  {platform.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Placement Type Selection */}
          {currentPlatform && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Placement Type</label>
              <Select value={selectedPlacement} onValueChange={setSelectedPlacement}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentPlatform.placementTypes.map((placement) => (
                    <SelectItem key={placement.id} value={placement.id}>
                      <div className="flex items-center gap-2">
                        <placement.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{placement.name}</div>
                          <div className="text-xs text-muted-foreground">{placement.desc}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Device Toggle */}
          <div className="flex gap-2">
            <Button
              variant={deviceView === "mobile" ? "default" : "outline"}
              size="sm"
              onClick={() => setDeviceView("mobile")}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </Button>
            <Button
              variant={deviceView === "desktop" ? "default" : "outline"}
              size="sm"
              onClick={() => setDeviceView("desktop")}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentPlacement && <currentPlacement.icon className="h-5 w-5" />}
            {currentPlatform?.name} - {currentPlacement?.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{currentPlacement?.desc}</p>
        </CardHeader>
        <CardContent>
          <div className={deviceView === "mobile" ? "max-w-sm mx-auto" : "max-w-2xl mx-auto"}>
            {renderPreviewContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Platform-specific placement preview components
const FacebookPlacementPreview = ({ placement, content, device }: any) => {
  switch (placement) {
    case "stories":
      return (
        <div className="bg-black aspect-[9/16] max-h-96 rounded-lg overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
          {content.imageUrl ? (
            <img src={content.imageUrl} alt="Ad" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
              <span className="text-4xl">📸</span>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="font-bold text-lg mb-2">{content.title}</h3>
            <p className="text-sm opacity-90 mb-3">{content.description.slice(0, 80)}...</p>
            <Button className="w-full bg-white text-black hover:bg-white/90">
              {content.cta}
            </Button>
          </div>
          <Badge className="absolute top-4 right-4 bg-blue-600">Sponsored</Badge>
        </div>
      );
    case "marketplace":
      return (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="aspect-square bg-muted">
            {content.imageUrl ? (
              <img src={content.imageUrl} alt="Ad" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl">🛍️</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold mb-1">{content.title}</h3>
            <p className="text-lg font-bold text-green-600 mb-2">$99.99</p>
            <p className="text-sm text-muted-foreground mb-3">{content.websiteUrl}</p>
            <Badge variant="secondary" className="text-xs">Sponsored</Badge>
          </div>
        </div>
      );
    default: // feed
      return (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {content.title.charAt(0)}
              </div>
              <div>
                <div className="font-semibold">{content.title}</div>
                <div className="text-sm text-muted-foreground">Sponsored • 2h</div>
              </div>
            </div>
          </div>
          <div className="aspect-video bg-muted">
            {content.imageUrl ? (
              <img src={content.imageUrl} alt="Ad" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">📸</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <p className="mb-3">{content.description}</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              {content.cta}
            </Button>
          </div>
        </div>
      );
  }
};

const InstagramPlacementPreview = ({ placement, content, device }: any) => {
  switch (placement) {
    case "stories":
      return <FacebookPlacementPreview placement="stories" content={content} device={device} />;
    case "reels":
      return (
        <div className="bg-black aspect-[9/16] max-h-96 rounded-lg overflow-hidden relative">
          {content.imageUrl ? (
            <img src={content.imageUrl} alt="Ad" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-6xl">🎵</span>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-16 text-white">
            <h3 className="font-bold mb-1">@{content.title.toLowerCase().replace(/\s+/g, '')}</h3>
            <p className="text-sm opacity-90">{content.description.slice(0, 100)}... #ad</p>
          </div>
          <Badge className="absolute bottom-4 right-4 bg-pink-600">Sponsored</Badge>
        </div>
      );
    default: // feed
      return (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {content.title.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-sm">{content.title.toLowerCase().replace(/\s+/g, '')}</div>
                <div className="text-xs text-muted-foreground">Sponsored</div>
              </div>
            </div>
          </div>
          <div className="aspect-square bg-muted">
            {content.imageUrl ? (
              <img src={content.imageUrl} alt="Ad" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">📸</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <p className="text-sm">
              <span className="font-semibold">{content.title.toLowerCase().replace(/\s+/g, '')}</span> {content.description.slice(0, 100)}...
            </p>
          </div>
        </div>
      );
  }
};

const TwitterPlacementPreview = ({ placement, content, device }: any) => {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {content.title.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm">{content.title}</span>
            <span className="text-muted-foreground text-sm">@{content.title.toLowerCase().replace(/\s+/g, '')}</span>
            <span className="text-muted-foreground text-sm">• 2h</span>
            <Badge variant="secondary" className="text-xs">Promoted</Badge>
          </div>
          <p className="text-sm mb-3">{content.description}</p>
          {content.imageUrl && (
            <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
              <img src={content.imageUrl} alt="Ad" className="w-full h-full object-cover" />
            </div>
          )}
          <Button variant="outline" size="sm">{content.cta}</Button>
        </div>
      </div>
    </div>
  );
};

const TikTokPlacementPreview = ({ placement, content, device }: any) => {
  return (
    <div className="bg-black text-white aspect-[9/16] max-h-96 rounded-lg overflow-hidden relative">
      {content.imageUrl ? (
        <img src={content.imageUrl} alt="Ad" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-pink-500 to-black flex items-center justify-center">
          <span className="text-6xl">🎵</span>
        </div>
      )}
      <div className="absolute bottom-4 left-4 right-16">
        <h3 className="font-bold mb-1">@{content.title.toLowerCase().replace(/\s+/g, '')}</h3>
        <p className="text-sm opacity-90">{content.description.slice(0, 80)}... #fyp #ad</p>
      </div>
      <Badge className="absolute bottom-4 right-4 bg-yellow-500 text-black">Sponsored</Badge>
    </div>
  );
};

export default AdPlacementPreview;