import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Zap, MapPin, Wand2, AlertCircle, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface AdCreatorProps {
  formData: any;
  setFormData: (data: any) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  initialData?: any;
}

// Simple LivePreview component
const LivePreview = ({ formData }: { formData: any }) => (
  <div className="border border-border rounded-xl p-4 bg-muted">
    <h3 className="font-semibold text-center mb-2 text-sm">Live Preview (Mobile Feed)</h3>
    <div className="h-48 bg-background rounded-lg p-3 flex flex-col justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-muted rounded-full"></div>
        <div>
          <p className="text-sm font-semibold">Your Business</p>
          <p className="text-xs text-muted-foreground">Sponsored • 2h</p>
        </div>
      </div>
      <div className="text-center text-muted-foreground text-sm italic py-4">
        {formData.mediaUrl ? (
          formData.mediaType === 'image' ? (
            <img src={formData.mediaUrl} alt="Preview" className="w-full h-24 object-cover rounded" />
          ) : (
            '[Video Preview]'
          )
        ) : (
          '[Ad Image/Video Placeholder]'
        )}
      </div>
      <div className="text-xs text-primary font-medium">{formData.product || 'Your Product'} →</div>
    </div>
  </div>
);

const AdCreator = ({ formData, setFormData, onGenerate, isGenerating, initialData }: AdCreatorProps) => {
  const [dragActive, setDragActive] = useState(false);
  
  const isAI = initialData?.isAI || false;
  const isTemplate = initialData?.isTemplate || false;

  useEffect(() => {
    if (initialData) {
      setFormData((prev: any) => ({ ...prev, ...initialData }));
    }
  }, [initialData, setFormData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };
  
  const AIBadge = () => isAI && (
    <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 transition">
      <Wand2 className="h-3 w-3 mr-1" /> AI Generated
    </Badge>
  );
  
  const TemplateBadge = () => isTemplate && (
    <Badge className="ml-2 bg-secondary/10 text-secondary hover:bg-secondary/20 transition">
      <FileText className="h-3 w-3 mr-1" /> From Template
    </Badge>
  );

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload JPG, PNG, GIF, or MP4 files only.',
      });
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please upload files smaller than 50MB.',
      });
      return;
    }
    
    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
    const mediaUrl = URL.createObjectURL(file);
    
    handleInputChange('mediaUrl', mediaUrl);
    handleInputChange('mediaType', mediaType);
    
    toast.success('Media uploaded successfully');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product || !formData.details) {
      toast.error('Missing required fields', {
        description: 'Please fill out the product and details section.',
      });
      return;
    }
    
    onGenerate();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN: Input Sections (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* 1. Basic Ad Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Zap className="h-5 w-5 mr-2" /> 1. Basic Ad Details
            </CardTitle>
            <CardDescription>Define the core product, unique selling points, and ad type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product" className="flex items-center">
                What are you advertising? * <AIBadge /> <TemplateBadge />
              </Label>
              <Input 
                id="product"
                value={formData.product || ''}
                onChange={(e) => handleInputChange('product', e.target.value)}
                placeholder="e.g., Fitness App, Organic Skincare"
                className={isAI ? 'bg-primary/5 border-primary/20' : ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="details" className="flex items-center">
                Key Details or Features * <AIBadge /> <TemplateBadge />
              </Label>
              <Textarea 
                id="details"
                value={formData.details || ''}
                onChange={(e) => handleInputChange('details', e.target.value)}
                placeholder="Describe the key features, benefits, and unique selling points..."
                rows={3}
                className={isAI ? 'bg-primary/5 border-primary/20' : ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Ad Type</Label>
              <RadioGroup 
                value={formData.adType || 'image'} 
                onValueChange={(val) => handleInputChange('adType', val)}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="image" id="r1" />
                  <Label htmlFor="r1" className="cursor-pointer">Image</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="video" id="r2" />
                  <Label htmlFor="r2" className="cursor-pointer">Video</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="carousel" id="r3" />
                  <Label htmlFor="r3" className="cursor-pointer">Carousel</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* 2. Creative & Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-secondary">
              <MapPin className="h-5 w-5 mr-2" /> 2. Creative & Media
            </CardTitle>
            <CardDescription>Upload your creatives and define the copy that appears in the ad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.mediaUrl ? (
              <div className="relative">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {formData.mediaType === 'image' ? (
                    <img src={formData.mediaUrl} alt="Uploaded" className="w-full h-full object-cover" />
                  ) : (
                    <video src={formData.mediaUrl} controls className="w-full h-full object-cover" />
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    handleInputChange('mediaUrl', null);
                    handleInputChange('mediaType', 'image');
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-secondary transition ${
                  dragActive ? 'border-secondary bg-secondary/5' : 'border-border'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-sm font-medium">Drag & Drop or Click to Upload Media</p>
                <p className="text-xs text-muted-foreground">Supports JPG, PNG, MP4, max 50MB</p>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*,video/mp4"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="headline" className="flex items-center">
                Headline (Max 3 Options) <AIBadge />
              </Label>
              <div className="flex gap-2">
                <Input 
                  id="headline"
                  value={formData.suggestedHeadlines?.[0] || ''}
                  onChange={(e) => handleInputChange('suggestedHeadlines', [e.target.value])}
                  placeholder="Your main headline..."
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  type="button" 
                  className="bg-primary/10 text-primary hover:bg-primary/20" 
                  title="AI Generate Variant"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 3. Audience & Targeting (Simplified) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-500">
              <Zap className="h-5 w-5 mr-2" /> 3. Audience & Targeting
            </CardTitle>
            <CardDescription>Define who sees your ad based on demographics and interests.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audience" className="flex items-center">
                Target Audience Persona <AIBadge />
              </Label>
              <Input 
                id="audience"
                value={formData.audience || ''}
                onChange={(e) => handleInputChange('audience', e.target.value)}
                placeholder="e.g., Young Professionals (25-34) interested in fitness"
                className={isAI ? 'bg-primary/5 border-primary/20' : ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="platforms">Target Platforms (comma-separated)</Label>
              <Input 
                id="platforms"
                value={Array.isArray(formData.platforms) ? formData.platforms.join(', ') : ''}
                onChange={(e) => handleInputChange('platforms', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                placeholder="e.g., Facebook, Instagram, TikTok"
              />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* RIGHT COLUMN: Preview and Launch (1/3 width) */}
      <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 lg:self-start">
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <LivePreview formData={formData} />
            <p className="text-xs text-muted-foreground text-center mt-2">Preview is based on your current inputs.</p>
          </CardContent>
        </Card>
        
        {/* Launch Button */}
        <Button 
          type="submit" 
          className="w-full h-12 text-lg font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            'Launch Campaign'
          )}
        </Button>
        
        <div className="text-center text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          Launch will finalize all campaign settings and send to platforms.
        </div>
      </div>
    </form>
  );
};

export default AdCreator;
