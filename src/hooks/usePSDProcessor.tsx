import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PSDLayer {
  id: string;
  name: string;
  type: 'text' | 'image' | 'shape';
  content?: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: {
    font?: string;
    size?: number;
    color?: string;
  };
  visible: boolean;
}

export interface ProcessedPSDData {
  type: 'freepik-psd';
  layers: PSDLayer[];
  placeholders: string[];
  canvas: {
    width: number;
    height: number;
  };
}

export interface ProcessPSDRequest {
  templateId: string;
  freepikDownloadUrl: string;
}

export interface ProcessPSDResponse {
  success: boolean;
  processedData: ProcessedPSDData;
  message: string;
}

export const useProcessPSD = () => {
  return useMutation<ProcessPSDResponse, Error, ProcessPSDRequest>({
    mutationFn: async (request) => {
      const { data, error } = await supabase.functions.invoke('process-freepik-psd', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'Failed to process PSD');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('PSD template processed successfully!');
    },
    onError: (error) => {
      console.error('PSD processing error:', error);
      toast.error(`Failed to process PSD: ${error.message}`);
    },
  });
};

export const useAutoFillPSDTemplate = () => {
  return useMutation({
    mutationFn: async (request: {
      templateId: string;
      productName: string;
      platform: string;
      targetAudience?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('auto-fill-template', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'Failed to auto-fill PSD template');
      }

      return data;
    },
    onSuccess: () => {
      toast.success('PSD template auto-filled with AI content!');
    },
    onError: (error) => {
      console.error('PSD auto-fill error:', error);
      toast.error(`Failed to auto-fill template: ${error.message}`);
    },
  });
};