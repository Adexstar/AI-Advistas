import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, MessageCircle, Share2, ExternalLink } from "lucide-react";

interface AdPreviewProps {
  formData: any;
  device: string;
}

const AdPreview = ({ formData, device }: AdPreviewProps) => {
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

  const getImageStyles = () => {
    if (formData.adType === "carousel") {
      return "aspect-square";
    }
    return device === "mobile" ? "aspect-square" : "aspect-video";
  };

  return (
    <motion.div
      key={device}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={getDeviceStyles()}
    >
      <Card className="overflow-hidden shadow-lg border-0 bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold text-sm">
            {formData.product ? formData.product.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {formData.product || "Your Business"}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Sponsored
              </Badge>
              <span className="text-xs text-muted-foreground">2h</span>
            </div>
          </div>
        </div>

        {/* Media Content */}
        <div className={`relative ${getImageStyles()} bg-gradient-to-br from-primary/10 to-primary/5`}>
          {formData.mediaUrl ? (
            <>
              {formData.mediaType === "video" ? (
                <div className="relative w-full h-full">
                  <video
                    src={formData.mediaUrl}
                    className="w-full h-full object-cover"
                    muted
                    loop
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button size="lg" className="rounded-full w-16 h-16 p-0">
                      <Play className="h-6 w-6 ml-1" />
                    </Button>
                  </div>
                </div>
              ) : (
                <img
                  src={formData.mediaUrl}
                  alt="Ad preview"
                  className="w-full h-full object-cover"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl">📸</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {formData.adType === "video" ? "Video preview" : "Image preview"}
                </p>
              </div>
            </div>
          )}
          
          {formData.adType === "carousel" && (
            <div className="absolute bottom-4 right-4">
              <Badge variant="secondary" className="text-xs">
                1/3
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight">
              {formData.product ? 
                `Discover ${formData.product}` : 
                "Your amazing product awaits"
              }
            </h3>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {formData.details || 
                "Add your product details to see them in the preview. Describe your key features and benefits here."
              }
            </p>
          </div>

          {formData.websiteUrl && (
            <div className="flex items-center gap-2 text-primary text-sm">
              <ExternalLink className="h-3 w-3" />
              <span className="truncate">{formData.websiteUrl}</span>
            </div>
          )}

          <Button className="w-full">
            Learn More
          </Button>

          {/* Engagement Stats */}
          <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                <Heart className="h-4 w-4" />
                <span>1.2k</span>
              </button>
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span>89</span>
              </button>
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <Share2 className="h-4 w-4" />
                <span>45</span>
              </button>
            </div>
            <div className="text-xs">
              {formData.audience ? `Targeting: ${formData.audience}` : "No targeting set"}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdPreview;