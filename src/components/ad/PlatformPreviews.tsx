import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Canvas as FabricCanvas } from 'fabric';

interface PlatformPreviewsProps {
  canvas: FabricCanvas | null;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'google';
}

export const PlatformPreviews: React.FC<PlatformPreviewsProps> = ({ canvas, platform }) => {
  const [previewImage, setPreviewImage] = useState('');
  
  useEffect(() => {
    if (canvas) {
      const updatePreview = () => {
        setPreviewImage(canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 }));
      };
      
      updatePreview();
      canvas.on('object:modified', updatePreview);
      canvas.on('object:added', updatePreview);
      canvas.on('object:removed', updatePreview);
      
      return () => {
        canvas.off('object:modified', updatePreview);
        canvas.off('object:added', updatePreview);
        canvas.off('object:removed', updatePreview);
      };
    }
  }, [canvas]);

  if (platform === 'facebook') {
    return (
      <Card className="bg-muted/20 p-4">
        <div className="bg-background rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">YB</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Your Business</p>
              <p className="text-xs text-muted-foreground">Sponsored · 🌎</p>
            </div>
          </div>
          <p className="text-sm mb-2">Check out our latest offer!</p>
          {previewImage && (
            <img
              src={previewImage}
              alt="Ad Preview"
              loading="lazy"
              decoding="async"
              className="mb-2 aspect-[1.91/1] w-full rounded-lg object-cover"
            />
          )}
          <div className="flex gap-2 mt-3">
            <div className="flex-1 py-2 px-3 bg-primary/10 text-primary rounded-md text-center text-sm font-medium cursor-pointer hover:bg-primary/20 transition-colors">
              Learn More
            </div>
          </div>
        </div>
      </Card>
    );
  }
            <img
              src={previewImage}
              alt="Ad Preview"
              loading="lazy"
              decoding="async"
              className="w-full aspect-square object-cover"
            />
  if (platform === 'instagram') {
    return (
      <Card className="bg-muted/20 p-4">
        <div className="bg-background rounded-lg shadow-lg">
          <div className="flex items-center gap-2 p-3 border-b">
            <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold">YB</span>
            </div>
            <div>
              <p className="font-semibold text-sm">yourbusiness</p>
              <p className="text-xs text-muted-foreground">Sponsored</p>
            </div>
          </div>
          {previewImage && (
            <img src={previewImage} alt="Ad Preview" className="w-full aspect-square object-cover" />
          )}
          <div className="p-3">
            <p className="text-sm">
              <span className="font-semibold">yourbusiness</span> Check out our latest offer! 
              <span className="text-primary"> #ad</span>
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (platform === 'tiktok') {
    return (
      <Card className="bg-muted/20 p-4">
        <div className="bg-background rounded-lg shadow-lg relative aspect-[9/16] overflow-hidden">
          {previewImage && (
            <img
              src={previewImage}
              alt="Ad Preview"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
            <p className="font-semibold text-sm mb-1">@yourbusiness</p>
            <p className="text-xs mb-2">Check out our latest offer! #ad</p>
            <button className="px-4 py-1.5 bg-primary rounded-full text-xs font-semibold">
              Learn More
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (platform === 'google') {
    return (
      <Card className="bg-muted/20 p-4">
        <div className="bg-background rounded-lg shadow-lg p-3">
          <div className="flex items-start gap-3">
            {previewImage && (
              <img
                src={previewImage}
                alt="Ad Preview"
                loading="lazy"
                decoding="async"
                className="w-24 h-24 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <p className="text-xs text-primary mb-1">Ad · www.yourbusiness.com</p>
              <h3 className="font-semibold text-sm mb-1 text-primary">Your Business - Special Offer</h3>
              <p className="text-xs text-muted-foreground">
                Check out our latest products and services. Limited time offer available now.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return null;
};
