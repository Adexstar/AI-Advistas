import { useCallback } from 'react';
import { GeneratedAdContent } from './useRealTimeAdGenerator';
import { toast } from 'sonner';

interface ExportOptions {
  format: 'json' | 'png' | 'jpg' | 'mp4';
  size?: 'original' | 'instagram-post' | 'instagram-story' | 'facebook-post' | 'tiktok' | 'youtube-thumbnail';
}

export const useExportAd = () => {
  const exportAdContent = useCallback(async (
    content: GeneratedAdContent, 
    productName: string, 
    platform: string,
    options: ExportOptions = { format: 'json' }
  ) => {
    try {
      if (options.format === 'json') {
        // Export as JSON file
        const exportData = {
          productName,
          platform,
          content,
          exportedAt: new Date().toISOString(),
          metadata: {
            format: options.format,
            size: options.size
          }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${productName.toLowerCase().replace(/\s+/g, '-')}-ad-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Ad content exported successfully!');
      } 
      else if (options.format === 'png' || options.format === 'jpg') {
        // Export image with different sizes
        if (!content.imageUrl) {
          toast.error('No image available to export');
          return;
        }

        // Create canvas and resize image based on platform requirements
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = content.imageUrl!;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set dimensions based on platform
        let width = img.width;
        let height = img.height;
        
        switch (options.size) {
          case 'instagram-post':
            width = height = 1080;
            break;
          case 'instagram-story':
            width = 1080;
            height = 1920;
            break;
          case 'facebook-post':
            width = 1200;
            height = 630;
            break;
          case 'tiktok':
            width = 1080;
            height = 1920;
            break;
          case 'youtube-thumbnail':
            width = 1280;
            height = 720;
            break;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image to canvas with proper scaling
        const scale = Math.min(width / img.width, height / img.height);
        const x = (width - img.width * scale) / 2;
        const y = (height - img.height * scale) / 2;
        
        ctx?.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${productName.toLowerCase().replace(/\s+/g, '-')}-${options.size || 'original'}.${options.format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success(`Image exported as ${options.format.toUpperCase()}!`);
          }
        }, `image/${options.format}`, 0.9);
      }
      else if (options.format === 'mp4') {
        // Export video
        if (!content.videoUrl) {
          toast.error('No video available to export');
          return;
        }

        // Create a temporary link to download the video
        const link = document.createElement('a');
        link.href = content.videoUrl;
        link.download = `${productName.toLowerCase().replace(/\s+/g, '-')}-video.mp4`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Video download started!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export content');
    }
  }, []);

  const copyTextContent = useCallback((content: GeneratedAdContent) => {
    const textToCopy = `${content.headline}\n\n${content.body}\n\n${content.cta}\n\n${content.hashtags.join(' ')}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success('Text content copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy content');
    });
  }, []);

  return {
    exportAdContent,
    copyTextContent
  };
};