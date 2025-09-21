import React from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Monitor, Tablet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { GeneratedAdContent } from '@/hooks/useRealTimeAdGenerator';

interface GenerationCanvasProps {
  content: GeneratedAdContent | null;
  isGenerating: boolean;
  adType: string;
  platform: string;
  onClear: () => void;
}

export const GenerationCanvas: React.FC<GenerationCanvasProps> = ({
  content,
  isGenerating,
  adType,
  platform,
  onClear
}) => {
  const platformColors = {
    facebook: 'bg-blue-500',
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    tiktok: 'bg-black',
    youtube: 'bg-red-500',
    linkedin: 'bg-blue-700'
  };

  const downloadAd = () => {
    if (!content) return;
    
    const adData = {
      headline: content.headline,
      body: content.body,
      cta: content.cta,
      hashtags: content.hashtags,
      platform: platform,
      adType: adType,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(adData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${platform}-ad-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">Generated Ad</CardTitle>
              <Badge 
                variant="secondary" 
                className={`${platformColors[platform as keyof typeof platformColors]} text-white`}
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Badge>
              <Badge variant="outline">
                {adType.charAt(0).toUpperCase() + adType.slice(1)}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              {content && !isGenerating && (
                <Button onClick={downloadAd} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              <Button onClick={onClear} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ad Content */}
            <div className="lg:col-span-2 space-y-4">
              {isGenerating ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  {adType === 'image' && (
                    <Skeleton className="h-64 w-full rounded-lg" />
                  )}
                </div>
              ) : content ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Headline */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Headline</label>
                    <h2 className="text-2xl font-bold text-foreground leading-tight">
                      {content.headline}
                    </h2>
                  </div>

                  <Separator />

                  {/* Body Text */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Body</label>
                    <p className="text-base leading-relaxed text-foreground/90">
                      {content.body}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Call to Action</label>
                    <Button className="bg-primary hover:bg-primary/90 font-semibold">
                      {content.cta}
                    </Button>
                  </div>

                  {/* Hashtags */}
                  {content.hashtags && content.hashtags.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Hashtags</label>
                      <div className="flex flex-wrap gap-2">
                        {content.hashtags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-primary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generated Image */}
                  {content.imageUrl && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Generated Image</label>
                      <div className="rounded-lg overflow-hidden border bg-muted">
                        <img 
                          src={content.imageUrl} 
                          alt="Generated ad image"
                          className="w-full h-auto"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </div>

            {/* Preview Devices */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Device Preview</h3>
              
              <div className="space-y-4">
                {/* Mobile Preview */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Smartphone className="w-4 h-4" />
                    Mobile
                  </div>
                  <div className="bg-background rounded border p-3 space-y-2 text-xs">
                    {content && !isGenerating ? (
                      <>
                        <div className="font-semibold line-clamp-2">{content.headline}</div>
                        <div className="text-muted-foreground line-clamp-3">{content.body}</div>
                        <Button size="sm" className="w-full text-xs h-7">
                          {content.cta}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </>
                    )}
                  </div>
                </div>

                {/* Desktop Preview */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Monitor className="w-4 h-4" />
                    Desktop
                  </div>
                  <div className="bg-background rounded border p-4 space-y-2 text-sm">
                    {content && !isGenerating ? (
                      <>
                        <div className="font-semibold">{content.headline}</div>
                        <div className="text-muted-foreground text-xs">{content.body}</div>
                        <Button size="sm" className="text-xs">
                          {content.cta}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-7 w-24" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};