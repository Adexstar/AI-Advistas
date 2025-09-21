import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useRealTimeAdGenerator } from '@/hooks/useRealTimeAdGenerator';
import { GenerationCanvas } from './GenerationCanvas';

export const RealTimeAdGenerator: React.FC = () => {
  const [product, setProduct] = useState('');
  const [platform, setPlatform] = useState('');
  const [adType, setAdType] = useState<'text' | 'image' | 'video'>('text');
  
  const {
    isGenerating,
    generatedContent,
    generateAdContent,
    regenerate,
    clearGenerated
  } = useRealTimeAdGenerator();

  const handleGenerate = () => {
    if (!product.trim()) {
      return;
    }
    
    generateAdContent({
      product: product.trim(),
      platform: platform || 'facebook',
      adType
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && product.trim()) {
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Ad Generator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Generate stunning ads in seconds. Just describe your product and watch the magic happen.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                What are you advertising?
              </CardTitle>
              <CardDescription>
                Describe your product or service and we'll create the perfect ad for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product">Product or Service</Label>
                <Input
                  id="product"
                  placeholder="e.g., PlayStation 5, Rolex watch, Digital marketing course..."
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-lg"
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adType">Ad Type</Label>
                  <Select value={adType} onValueChange={(value: 'text' | 'image' | 'video') => setAdType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ad type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Ad</SelectItem>
                      <SelectItem value="image">Image Ad</SelectItem>
                      <SelectItem value="video" disabled>
                        Video Ad 
                        <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={!product.trim() || isGenerating}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Ad
                    </>
                  )}
                </Button>

                {generatedContent && (
                  <Button
                    onClick={regenerate}
                    variant="outline"
                    size="lg"
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Generation Canvas */}
        {(generatedContent || isGenerating) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <GenerationCanvas
              content={generatedContent}
              isGenerating={isGenerating}
              adType={adType}
              platform={platform || 'facebook'}
              onClear={clearGenerated}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};