import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Wand2, Eye, Smartphone, Monitor, Tablet } from "lucide-react";

const CreateAd = () => {
  const [formData, setFormData] = useState({
    businessName: "",
    industry: "",
    objective: "",
    productDescription: "",
    targetAudience: "",
    budget: "",
    platforms: []
  });

  const [previewDevice, setPreviewDevice] = useState("desktop");

  const industries = [
    "Technology", "Fashion", "Health & Fitness", "Food & Beverage", 
    "Travel", "Finance", "Education", "Real Estate"
  ];

  const objectives = [
    "Brand Awareness", "Traffic", "Engagement", "Conversions", 
    "App Installs", "Video Views", "Lead Generation"
  ];

  const platforms = [
    { id: "facebook", name: "Facebook", icon: "📘" },
    { id: "instagram", name: "Instagram", icon: "📷" },
    { id: "twitter", name: "Twitter", icon: "🐦" },
    { id: "linkedin", name: "LinkedIn", icon: "💼" },
    { id: "tiktok", name: "TikTok", icon: "🎵" },
    { id: "google", name: "Google Ads", icon: "🔍" }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlatformToggle = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(id => id !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Ad Campaign</h1>
        <p className="text-muted-foreground">Use AI to create optimized ads for multiple platforms</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Enter your business name"
                value={formData.businessName}
                onChange={(e) => handleInputChange("businessName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Campaign Objective</Label>
              <Select value={formData.objective} onValueChange={(value) => handleInputChange("objective", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign objective" />
                </SelectTrigger>
                <SelectContent>
                  {objectives.map((objective) => (
                    <SelectItem key={objective} value={objective}>{objective}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productDescription">Product/Service Description</Label>
              <Textarea
                id="productDescription"
                placeholder="Describe your product or service, key features, and unique selling points..."
                rows={4}
                value={formData.productDescription}
                onChange={(e) => handleInputChange("productDescription", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Textarea
                id="targetAudience"
                placeholder="Describe your ideal customer (age, interests, location, behavior)..."
                rows={3}
                value={formData.targetAudience}
                onChange={(e) => handleInputChange("targetAudience", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Daily Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="100"
                value={formData.budget}
                onChange={(e) => handleInputChange("budget", e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>Target Platforms</Label>
              <div className="grid grid-cols-2 gap-3">
                {platforms.map((platform) => (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform.id}
                      checked={formData.platforms.includes(platform.id)}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    />
                    <Label htmlFor={platform.id} className="flex items-center gap-2 cursor-pointer">
                      <span>{platform.icon}</span>
                      {platform.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90">
              <Wand2 className="mr-2 h-4 w-4" />
              Generate AI Campaign
            </Button>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Live Preview
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={previewDevice === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewDevice("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewDevice === "tablet" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewDevice("tablet")}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewDevice === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewDevice("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="static" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="static">Static</TabsTrigger>
                <TabsTrigger value="interactive">Interactive</TabsTrigger>
                <TabsTrigger value="platforms">Platforms</TabsTrigger>
              </TabsList>
              
              <TabsContent value="static" className="mt-4">
                <div className={`mx-auto bg-white border rounded-lg overflow-hidden ${
                  previewDevice === "mobile" ? "max-w-sm" : 
                  previewDevice === "tablet" ? "max-w-md" : "max-w-lg"
                }`}>
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <p className="text-muted-foreground">Ad image preview</p>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">
                      {formData.businessName || "Your Business Name"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.productDescription.slice(0, 100) || "Your product description will appear here..."}
                    </p>
                    <Button className="mt-3 w-full">Learn More</Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="interactive" className="mt-4">
                <div className="bg-muted rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">Interactive preview will show ad behavior simulation</p>
                </div>
              </TabsContent>
              
              <TabsContent value="platforms" className="mt-4">
                <div className="space-y-4">
                  {formData.platforms.length > 0 ? (
                    formData.platforms.map((platformId) => {
                      const platform = platforms.find(p => p.id === platformId);
                      return (
                        <div key={platformId} className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span>{platform?.icon}</span>
                            <span className="font-medium">{platform?.name}</span>
                          </div>
                          <div className="bg-muted rounded p-4 text-center text-sm text-muted-foreground">
                            {platform?.name} optimized preview
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-muted rounded-lg p-8 text-center">
                      <p className="text-muted-foreground">Select platforms to see previews</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateAd;