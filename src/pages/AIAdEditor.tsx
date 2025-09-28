import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, Palette, Wand2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TemplateSystem } from "@/components/TemplateSystem";
import { AIStylePanel } from "@/components/ai/AIStylePanel";
import { SmartCopyEditor } from "@/components/ai/SmartCopyEditor";

const AIAdEditor = () => {
  const [productName, setProductName] = useState("");
  const [platform, setPlatform] = useState("facebook");
  const [adCopy, setAdCopy] = useState({
    headline: "",
    description: "",
    cta: ""
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 relative"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 px-4 lg:px-6 pt-6 pb-4 text-center"
      >
        <h1 className="text-2xl lg:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Sparkles className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-400" />
          AI Ad Editor
        </h1>
        <p className="text-white/80 text-sm lg:text-base max-w-2xl mx-auto">
          Create stunning advertisements with AI-powered suggestions for copy, design, and optimization
        </p>
      </motion.div>

      {/* Content Area */}
      <div className="relative z-10 px-4 lg:px-6 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Setup Card */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader className="bg-gradient-to-r from-primary to-primary-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Product Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter your product name..."
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="google">Google Ads</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Tools Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Style Suggestions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <AIStylePanel
                productCategory={productName ? "general" : "product"}
                platform={platform}
                onStyleSelect={(style) => {
                  toast({
                    title: "Style Applied",
                    description: `Applied ${style.name} style with ${style.primaryColor} theme.`,
                  });
                }}
              />
            </motion.div>

            {/* Smart Copy Editor */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Smart Copy Editor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Headline
                    </label>
                    <SmartCopyEditor
                      text={adCopy.headline}
                      onTextChange={(newText) => setAdCopy(prev => ({ ...prev, headline: newText }))}
                      productName={productName}
                      platform={platform}
                      textType="headline"
                      maxLength={100}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Description
                    </label>
                    <SmartCopyEditor
                      text={adCopy.description}
                      onTextChange={(newText) => setAdCopy(prev => ({ ...prev, description: newText }))}
                      productName={productName}
                      platform={platform}
                      textType="description"
                      maxLength={300}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Call to Action
                    </label>
                    <SmartCopyEditor
                      text={adCopy.cta}
                      onTextChange={(newText) => setAdCopy(prev => ({ ...prev, cta: newText }))}
                      productName={productName}
                      platform={platform}
                      textType="cta"
                      maxLength={50}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Template System with AI Auto-fill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-primary to-primary-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  AI-Powered Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <TemplateSystem
                  onUseTemplate={(template) => {
                  setAdCopy(prev => ({
                    ...prev,
                    headline: template.content.headline || prev.headline,
                    description: template.content.description || prev.description,
                  }));
                    toast({
                      title: "Template Applied",
                      description: `${template.name} template has been applied to your ad.`,
                    });
                  }}
                  productName={productName}
                  platform={platform}
                  onAutoFill={(templateId, filledData) => {
                    setAdCopy(prev => ({
                      ...prev,
                      headline: filledData.filledTemplate.headline || prev.headline,
                      description: filledData.filledTemplate.description || prev.description,
                      cta: filledData.filledTemplate.cta || prev.cta,
                    }));
                    toast({
                      title: "AI Auto-fill Complete",
                      description: "Template has been automatically filled with AI-generated content.",
                    });
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AIAdEditor;