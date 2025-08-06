import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, MessageCircle, Share2, ExternalLink, Eye, MousePointer } from "lucide-react";

interface AdPreviewAnimationProps {
  formData: any;
  device: string;
}

const AdPreviewAnimation = ({ formData, device }: AdPreviewAnimationProps) => {
  const [animationStep, setAnimationStep] = useState(0);
  const [userInteractions, setUserInteractions] = useState({
    views: 1247,
    likes: 89,
    comments: 23,
    shares: 12,
    clicks: 156
  });

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

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4);
      
      // Simulate real-time engagement updates
      if (Math.random() > 0.7) {
        setUserInteractions(prev => ({
          ...prev,
          views: prev.views + Math.floor(Math.random() * 5) + 1,
          likes: prev.likes + (Math.random() > 0.8 ? 1 : 0),
          comments: prev.comments + (Math.random() > 0.9 ? 1 : 0),
          shares: prev.shares + (Math.random() > 0.95 ? 1 : 0),
          clicks: prev.clicks + (Math.random() > 0.85 ? 1 : 0)
        }));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getAnimationDescription = () => {
    switch (animationStep) {
      case 0:
        return "User scrolling through feed";
      case 1:
        return "Ad catches attention - pause";
      case 2:
        return "User engaging with content";
      case 3:
        return "Click-through to landing page";
      default:
        return "Ad in feed";
    }
  };

  const getScrollPosition = () => {
    return animationStep === 0 ? "translateY(-50%)" : "translateY(0%)";
  };

  return (
    <div className="space-y-4">
      {/* Animation Controls */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Simulation</span>
          <Badge variant="outline">Live Preview</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>{getAnimationDescription()}</span>
        </div>
      </div>

      {/* Simulated Feed */}
      <div className="relative">
        <motion.div
          className={`${getDeviceStyles()} relative`}
          style={{ height: device === "mobile" ? "600px" : "500px", overflow: "hidden" }}
        >
          {/* Background Feed Items */}
          <motion.div
            animate={{ y: getScrollPosition() }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="space-y-4"
          >
            {/* Dummy feed item above */}
            <Card className="opacity-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-muted"></div>
                  <div className="space-y-1">
                    <div className="h-3 bg-muted rounded w-20"></div>
                    <div className="h-2 bg-muted rounded w-16"></div>
                  </div>
                </div>
                <div className="h-32 bg-muted rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>

            {/* Main Ad Preview */}
            <motion.div
              animate={{
                scale: animationStep === 1 ? 1.02 : 1,
                boxShadow: animationStep === 1 ? "0 8px 25px -5px rgba(59, 130, 246, 0.3)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden bg-white border-2 border-transparent hover:border-primary/20">
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

                {/* Media */}
                <div className="aspect-video relative bg-gradient-to-br from-primary/10 to-primary/5">
                  {formData.mediaUrl ? (
                    <>
                      {formData.mediaType === "video" ? (
                        <div className="relative w-full h-full">
                          <video
                            src={formData.mediaUrl}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            autoPlay={animationStep === 2}
                          />
                          <AnimatePresence>
                            {animationStep !== 2 && (
                              <motion.div
                                initial={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <Button size="lg" className="rounded-full w-16 h-16 p-0">
                                  <Play className="h-6 w-6 ml-1" />
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
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
                        <p className="text-muted-foreground text-sm">Interactive preview</p>
                      </div>
                    </div>
                  )}

                  {/* Interaction Overlay */}
                  <AnimatePresence>
                    {animationStep === 2 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none"
                      >
                        <motion.div
                          animate={{
                            x: [100, 200, 150, 250],
                            y: [100, 150, 200, 100]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute"
                        >
                          <MousePointer className="h-5 w-5 text-primary drop-shadow-lg" />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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

                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Button 
                      className="w-full"
                      variant={animationStep === 3 ? "default" : "outline"}
                    >
                      {animationStep === 3 ? "Clicking..." : "Learn More"}
                    </Button>
                  </motion.div>

                  {/* Live Engagement Stats */}
                  <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <motion.button 
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                        animate={animationStep === 2 ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Heart className={`h-4 w-4 ${animationStep === 2 ? 'text-red-500' : ''}`} />
                        <span>{userInteractions.likes}</span>
                      </motion.button>
                      <button className="flex items-center gap-1 hover:text-primary transition-colors">
                        <MessageCircle className="h-4 w-4" />
                        <span>{userInteractions.comments}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Share2 className="h-4 w-4" />
                        <span>{userInteractions.shares}</span>
                      </button>
                    </div>
                    <motion.div 
                      className="text-xs"
                      key={userInteractions.views}
                      initial={{ scale: 1.1, color: "#3b82f6" }}
                      animate={{ scale: 1, color: "#6b7280" }}
                      transition={{ duration: 0.5 }}
                    >
                      {userInteractions.views} views
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Dummy feed item below */}
            <Card className="opacity-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-muted"></div>
                  <div className="space-y-1">
                    <div className="h-3 bg-muted rounded w-20"></div>
                    <div className="h-2 bg-muted rounded w-16"></div>
                  </div>
                </div>
                <div className="h-32 bg-muted rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Performance Metrics */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-primary">{userInteractions.clicks}</div>
              <div className="text-xs text-muted-foreground">Clicks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-green-600">
                {((userInteractions.clicks / userInteractions.views) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">CTR</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdPreviewAnimation;