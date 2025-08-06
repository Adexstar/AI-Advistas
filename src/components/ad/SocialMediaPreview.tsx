import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreHorizontal, Play, Bookmark, Send } from "lucide-react";

interface SocialMediaPreviewProps {
  formData: any;
  device: string;
}

const SocialMediaPreview = ({ formData, device }: SocialMediaPreviewProps) => {
  const getDeviceStyles = () => {
    switch (device) {
      case "mobile":
        return "max-w-sm mx-auto";
      case "tablet":
        return "max-w-md mx-auto";
      default:
        return "max-w-lg mx-auto";
    }
  };

  const platformConfigs = {
    facebook: {
      name: "Facebook",
      color: "bg-blue-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      icon: "📘",
      actions: [
        { icon: Heart, label: "Like", count: "1.2k" },
        { icon: MessageCircle, label: "Comment", count: "89" },
        { icon: Share2, label: "Share", count: "45" }
      ]
    },
    instagram: {
      name: "Instagram",
      color: "bg-gradient-to-r from-purple-600 to-pink-600",
      textColor: "text-pink-600",
      bgColor: "bg-pink-50",
      icon: "📷",
      actions: [
        { icon: Heart, label: "Like", count: "2.1k" },
        { icon: MessageCircle, label: "Comment", count: "156" },
        { icon: Send, label: "Share", count: "78" }
      ]
    },
    tiktok: {
      name: "TikTok",
      color: "bg-black",
      textColor: "text-black",
      bgColor: "bg-gray-50",
      icon: "🎵",
      actions: [
        { icon: Heart, label: "Like", count: "5.2k" },
        { icon: MessageCircle, label: "Comment", count: "342" },
        { icon: Share2, label: "Share", count: "189" }
      ]
    },
    twitter: {
      name: "Twitter",
      color: "bg-blue-500",
      textColor: "text-blue-500",
      bgColor: "bg-blue-50",
      icon: "🐦",
      actions: [
        { icon: Heart, label: "Like", count: "892" },
        { icon: MessageCircle, label: "Reply", count: "67" },
        { icon: Share2, label: "Retweet", count: "234" }
      ]
    },
    youtube: {
      name: "YouTube",
      color: "bg-red-600",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
      icon: "📹",
      actions: [
        { icon: Heart, label: "Like", count: "3.4k" },
        { icon: MessageCircle, label: "Comment", count: "451" },
        { icon: Share2, label: "Share", count: "123" }
      ]
    },
    google: {
      name: "Google Ads",
      color: "bg-red-500",
      textColor: "text-red-500",
      bgColor: "bg-red-50",
      icon: "🔍",
      actions: [
        { icon: Heart, label: "Helpful", count: "234" },
        { icon: MessageCircle, label: "Review", count: "56" },
        { icon: Share2, label: "Share", count: "89" }
      ]
    }
  };

  if (formData.platforms.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Select platforms to see previews</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {formData.platforms.map((platformId: string, index: number) => {
        const config = platformConfigs[platformId as keyof typeof platformConfigs];
        if (!config) return null;

        return (
          <motion.div
            key={platformId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={getDeviceStyles()}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-xl">{config.icon}</span>
                  {config.name} Preview
                  <Badge variant="outline" className={`ml-auto ${config.textColor}`}>
                    Optimized
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platform-specific mockup */}
                <div className={`rounded-lg overflow-hidden border ${config.bgColor}`}>
                  {platformId === "facebook" && (
                    <FacebookPreview formData={formData} config={config} device={device} />
                  )}
                  {platformId === "instagram" && (
                    <InstagramPreview formData={formData} config={config} device={device} />
                  )}
                  {platformId === "tiktok" && (
                    <TikTokPreview formData={formData} config={config} device={device} />
                  )}
                  {platformId === "twitter" && (
                    <TwitterPreview formData={formData} config={config} device={device} />
                  )}
                  {platformId === "youtube" && (
                    <YouTubePreview formData={formData} config={config} device={device} />
                  )}
                  {platformId === "google" && (
                    <GoogleAdsPreview formData={formData} config={config} device={device} />
                  )}
                </div>

                {/* Platform-specific placements */}
                {formData.placementOptions[platformId]?.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Active Placements:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.placementOptions[platformId].map((placement: string) => (
                        <Badge
                          key={placement}
                          variant="secondary"
                          className={`text-xs ${config.textColor}`}
                        >
                          {placement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

// Platform-specific preview components
const FacebookPreview = ({ formData, config, device }: any) => (
  <div className="bg-white p-4">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center text-white font-bold text-sm`}>
        {formData.product?.charAt(0) || "A"}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{formData.product || "Your Business"}</p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">Sponsored</Badge>
          <span className="text-xs text-muted-foreground">2h • 🌍</span>
        </div>
      </div>
      <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
    </div>
    
    <p className="text-sm mb-3">
      {formData.details || "Discover amazing products that will change your life! 🚀"}
    </p>
    
    <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
      {formData.mediaUrl ? (
        <img src={formData.mediaUrl} alt="Ad" className="w-full h-full object-cover rounded-lg" />
      ) : (
        <span className="text-4xl">📸</span>
      )}
    </div>
    
    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
      <div className="flex items-center gap-4">
        {config.actions.map((action, idx) => (
          <button key={idx} className="flex items-center gap-1 hover:text-primary transition-colors">
            <action.icon className="h-4 w-4" />
            <span>{action.count}</span>
          </button>
        ))}
      </div>
    </div>
    
    <Button className="w-full">Learn More</Button>
  </div>
);

const InstagramPreview = ({ formData, config, device }: any) => (
  <div className="bg-white">
    <div className="flex items-center gap-3 p-4 border-b">
      <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white font-bold text-xs`}>
        {formData.product?.charAt(0) || "A"}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{formData.product || "yourbusiness"}</p>
        <p className="text-xs text-muted-foreground">Sponsored</p>
      </div>
      <MoreHorizontal className="h-5 w-5" />
    </div>
    
    <div className="aspect-square bg-muted flex items-center justify-center">
      {formData.mediaUrl ? (
        <img src={formData.mediaUrl} alt="Ad" className="w-full h-full object-cover" />
      ) : (
        <span className="text-6xl">📸</span>
      )}
    </div>
    
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          {config.actions.map((action, idx) => (
            <action.icon key={idx} className="h-6 w-6" />
          ))}
        </div>
        <Bookmark className="h-6 w-6" />
      </div>
      
      <p className="font-semibold text-sm mb-1">{config.actions[0].count} likes</p>
      <p className="text-sm">
        <span className="font-semibold">{formData.product || "yourbusiness"}</span>{" "}
        {formData.details?.slice(0, 100) || "Amazing product features here..."}
      </p>
    </div>
  </div>
);

const TikTokPreview = ({ formData, config, device }: any) => (
  <div className="bg-black text-white relative aspect-[9/16] max-h-96">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
    <div className="absolute inset-0 flex items-center justify-center">
      {formData.mediaUrl ? (
        <img src={formData.mediaUrl} alt="Ad" className="w-full h-full object-cover" />
      ) : (
        <div className="text-center">
          <span className="text-6xl">🎵</span>
          <p className="mt-2">TikTok Video</p>
        </div>
      )}
    </div>
    
    <div className="absolute bottom-4 left-4 right-16">
      <p className="font-semibold mb-1">@{formData.product || "yourbusiness"}</p>
      <p className="text-sm opacity-90">
        {formData.details?.slice(0, 80) || "Viral content that converts! 🔥"} #ad
      </p>
    </div>
    
    <div className="absolute right-4 bottom-20 flex flex-col items-center gap-4">
      {config.actions.map((action, idx) => (
        <div key={idx} className="text-center">
          <action.icon className="h-8 w-8 mb-1" />
          <span className="text-xs">{action.count}</span>
        </div>
      ))}
    </div>
    
    <div className="absolute bottom-4 right-4">
      <Badge className="bg-yellow-500 text-black">Sponsored</Badge>
    </div>
  </div>
);

const TwitterPreview = ({ formData, config, device }: any) => (
  <div className="bg-white p-4">
    <div className="flex gap-3">
      <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
        {formData.product?.charAt(0) || "A"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-sm">{formData.product || "Your Business"}</p>
          <span className="text-muted-foreground text-sm">@yourbusiness</span>
          <span className="text-muted-foreground text-sm">· 2h</span>
          <Badge variant="secondary" className="text-xs">Promoted</Badge>
        </div>
        
        <p className="text-sm mb-3">
          {formData.details || "Discover the future of innovation! 🚀 Transform your life today."} 
        </p>
        
        {formData.mediaUrl && (
          <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
            <img src={formData.mediaUrl} alt="Ad" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="flex items-center justify-between text-muted-foreground max-w-xs">
          {config.actions.map((action, idx) => (
            <button key={idx} className="flex items-center gap-1 hover:text-primary transition-colors">
              <action.icon className="h-4 w-4" />
              <span className="text-sm">{action.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const YouTubePreview = ({ formData, config, device }: any) => (
  <div className="bg-white">
    <div className="aspect-video bg-black relative">
      {formData.mediaUrl ? (
        <img src={formData.mediaUrl} alt="Ad" className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center justify-center text-white">
          <span className="text-6xl">📹</span>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <Button size="lg" className="rounded-full w-16 h-16 p-0 bg-red-600 hover:bg-red-700">
          <Play className="h-6 w-6 ml-1" />
        </Button>
      </div>
      <Badge className="absolute bottom-2 right-2 bg-yellow-500 text-black">Ad</Badge>
    </div>
    
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-2">
        {formData.product ? `${formData.product} - Official Video` : "Your Product Video"}
      </h3>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <span>{config.actions[0].count} views</span>
        <span>•</span>
        <span>2 hours ago</span>
      </div>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white font-bold text-xs`}>
          {formData.product?.charAt(0) || "A"}
        </div>
        <div>
          <p className="font-medium text-sm">{formData.product || "Your Business"}</p>
          <p className="text-xs text-muted-foreground">1.2M subscribers</p>
        </div>
        <Button size="sm" className="ml-auto">Subscribe</Button>
      </div>
    </div>
  </div>
);

const GoogleAdsPreview = ({ formData, config, device }: any) => (
  <div className="bg-white border rounded p-4">
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs">Ad</Badge>
          <span className="text-green-600 text-sm">{formData.websiteUrl || "yourwebsite.com"}</span>
        </div>
        <h3 className="text-lg font-medium text-blue-600 hover:underline cursor-pointer mb-1">
          {formData.product || "Your Amazing Product"} - Official Site
        </h3>
        <p className="text-sm text-muted-foreground">
          {formData.details?.slice(0, 120) || "Discover the best products and services. Free shipping, great prices, and excellent customer service."} 
        </p>
      </div>
      {formData.mediaUrl && (
        <div className="w-20 h-20 bg-muted rounded flex-shrink-0">
          <img src={formData.mediaUrl} alt="Ad" className="w-full h-full object-cover rounded" />
        </div>
      )}
    </div>
  </div>
);

export default SocialMediaPreview;