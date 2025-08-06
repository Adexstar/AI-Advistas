import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Smartphone, Monitor, Tablet, Sparkles, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AdCreator from "@/components/ad/AdCreator";
import AdPreview from "@/components/ad/AdPreview";
import AdPreviewAnimation from "@/components/ad/AdPreviewAnimation";
import SocialMediaPreview from "@/components/ad/SocialMediaPreview";

const CreateAd = () => {
  const [formData, setFormData] = useState({
    product: "",
    details: "",
    websiteUrl: "",
    adType: "image",
    platforms: [],
    placementOptions: {},
    audience: "",
    simpleAudience: "",
    mediaUrl: null,
    mediaType: "image"
  });

  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Campaign Generated!",
        description: "Your AI-powered ad campaign has been created successfully.",
      });
      
      // Here you would make the actual API call
      console.log("Generating campaign with data:", formData);
      
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was an error generating your campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20" />
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 text-yellow-400" />
            AI Ad Studio
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Create professional, high-converting advertisements across multiple platforms with AI-powered optimization
          </p>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-7xl mx-auto"
        >
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary-600 p-6">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6" />
                  <h2 className="text-2xl font-bold">Campaign Creator</h2>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <span className="text-sm">Real-time preview</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-0">
              {/* Creator Form - 2/3 width */}
              <div className="lg:col-span-2 p-6 bg-gradient-to-b from-white to-gray-50/50 border-r">
                <AdCreator
                  formData={formData}
                  setFormData={setFormData}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                />
              </div>

              {/* Preview Section - 1/3 width */}
              <div className="p-6 bg-white">
                <div className="sticky top-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Live Preview
                    </h3>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <Button
                        variant={previewDevice === "desktop" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewDevice("desktop")}
                        className="p-2"
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewDevice === "tablet" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewDevice("tablet")}
                        className="p-2"
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={previewDevice === "mobile" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewDevice("mobile")}
                        className="p-2"
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="static" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="static" className="text-xs">Static</TabsTrigger>
                      <TabsTrigger value="interactive" className="text-xs">Interactive</TabsTrigger>
                      <TabsTrigger value="social" className="text-xs">Platforms</TabsTrigger>
                    </TabsList>
                    
                    <div className="min-h-[500px]">
                      <TabsContent value="static" className="mt-0">
                        <AdPreview formData={formData} device={previewDevice} />
                      </TabsContent>
                      
                      <TabsContent value="interactive" className="mt-0">
                        <AdPreviewAnimation formData={formData} device={previewDevice} />
                      </TabsContent>
                      
                      <TabsContent value="social" className="mt-0">
                        <SocialMediaPreview formData={formData} device={previewDevice} />
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CreateAd;