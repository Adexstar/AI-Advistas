import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Canvas as FabricCanvas } from 'fabric';

export interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  quality?: number;
  width?: number;
  height?: number;
}

export const useExportAd = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      canvas, 
      adId, 
      options 
    }: { 
      canvas: FabricCanvas; 
      adId: string; 
      options: ExportOptions 
    }) => {
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      // Get canvas data as base64
      const format = options.format === 'jpg' ? 'jpeg' : (options.format === 'pdf' || options.format === 'svg' ? 'png' : options.format);
      const canvasData = canvas.toDataURL({
        format: format as 'png' | 'jpeg',
        quality: options.quality || 0.9,
        multiplier: options.width && options.height ? 
          Math.min(options.width / canvas.width!, options.height / canvas.height!) : 1
      });

      // Call export edge function
      const { data, error } = await supabase.functions.invoke('export-ad', {
        body: {
          adId,
          format: options.format,
          quality: options.quality,
          width: options.width,
          height: options.height,
          canvasData
        }
      });

      if (error) {
        throw new Error(error.message || 'Export failed');
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Export successful",
        description: `Your ad has been exported as ${data.format.toUpperCase()}`,
      });
      
      // Trigger download
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useQuickExport = () => {
  const { toast } = useToast();

  return {
    exportAsPNG: (canvas: FabricCanvas, filename = 'ad.png') => {
      if (!canvas) return;
      
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2 // 2x resolution for better quality
      });
      
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exported as PNG",
        description: "Your ad has been downloaded",
      });
    },
    
    exportAsJPG: (canvas: FabricCanvas, filename = 'ad.jpg') => {
      if (!canvas) return;
      
      const dataURL = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.9,
        multiplier: 2
      });
      
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exported as JPG",
        description: "Your ad has been downloaded",
      });
    },
    
    copyToClipboard: async (canvas: FabricCanvas) => {
      if (!canvas) return;
      
      try {
        const dataURL = canvas.toDataURL({ 
          format: 'png', 
          quality: 1,
          multiplier: 1 
        });
        const response = await fetch(dataURL);
        const blob = await response.blob();
        
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        
        toast({
          title: "Copied to clipboard",
          description: "Your ad has been copied as an image",
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Unable to copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };
};