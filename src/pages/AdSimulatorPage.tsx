import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  PlayCircle, 
  Settings, 
  Share2, 
  Download,
  Target,
  BarChart3,
  Eye
} from "lucide-react";
import AdPreviewSimulator from "@/components/ad/AdPreviewSimulator";
import AdPlacementPreview from "@/components/ad/AdPlacementPreview";

const AdSimulatorPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("simulator");

  // Sample ad content for demonstration
  const sampleAdContent = {
    title: "Revolutionary Smart Watch",
    description: "Experience the future with our cutting-edge smartwatch featuring advanced health monitoring, seamless connectivity, and stunning design that adapts to your lifestyle.",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
    cta: "Shop Now",
    product: "SmartWatch Pro",
    details: "Advanced health monitoring, 7-day battery life, water-resistant design, and seamless smartphone integration. Perfect for fitness enthusiasts and tech lovers.",
    websiteUrl: "smartwatchpro.com",
    platforms: ["facebook", "instagram", "twitter", "tiktok"],
    placementOptions: {
      facebook: ["feed", "stories", "marketplace"],
      instagram: ["feed", "stories", "reels"],
      twitter: ["timeline", "search"],
      tiktok: ["foryou", "branded"]
    },
    targetAudience: {
      age: { min: 25, max: 45 },
      gender: "All",
      interests: ["Technology", "Fitness", "Gadgets", "Innovation"]
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="page-container py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
                <div className="h-6 w-px bg-border" />
                <div>
                  <h1 className="text-2xl font-bold">Ad Preview Simulator</h1>
                  <p className="text-sm text-muted-foreground">
                    Test your ads across platforms before publishing
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button size="sm" onClick={() => navigate("/create-ad")}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Create New Ad
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="page-container py-8">
          {/* Ad Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white border-0">
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        Active Preview
                      </Badge>
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        4 Platforms
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{sampleAdContent.title}</h2>
                    <p className="text-primary-100 mb-4 max-w-2xl">
                      {sampleAdContent.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>Est. Reach: 250K</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>CTR: 3.2%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Engagement: 4.5%</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full max-w-xs lg:ml-6 lg:w-auto lg:flex-shrink-0">
                    <div className="w-32 h-20 bg-white/10 rounded-lg overflow-hidden">
                      {sampleAdContent.imageUrl ? (
                        <img 
                          src={sampleAdContent.imageUrl} 
                          alt="Ad preview" 
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">📱</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Simulator Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="grid grid-cols-2 w-fit">
                  <TabsTrigger value="simulator" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Performance Simulator
                  </TabsTrigger>
                  <TabsTrigger value="placements" className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Placement Preview
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="simulator">
                <AdPreviewSimulator 
                  adContent={sampleAdContent}
                  isGenerating={false}
                />
              </TabsContent>

              <TabsContent value="placements">
                <AdPlacementPreview 
                  adContent={sampleAdContent}
                />
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex justify-center gap-4 pb-8"
          >
            <Button variant="outline" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button size="lg" onClick={() => navigate("/create-ad")}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Create New Campaign
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdSimulatorPage;