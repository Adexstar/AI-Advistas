import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdCopyRequest {
  productName: string;
  templateType?: string;
  platform: string;
  targetAudience?: string;
  additionalContext?: string;
}

export interface AdCopyResponse {
  headline: string;
  subtitle: string;
  cta: string;
  alternativeHeadlines: string[];
}

export interface StyleSuggestionRequest {
  productCategory: string;
  brandPersonality?: string;
  platform: string;
  templateType?: string;
}

export interface StyleSuggestion {
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export interface StyleSuggestionResponse {
  styles: StyleSuggestion[];
}

export interface AutoFillRequest {
  templateId?: string;
  productName: string;
  templateStructure?: any;
  platform: string;
  targetAudience?: string;
}

export interface AutoFillResponse {
  filledTemplate: Record<string, string>;
  suggestions: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

export const useGenerateAdCopy = () => {
  return useMutation<AdCopyResponse, Error, AdCopyRequest>({
    mutationFn: async (request) => {
      const { data, error } = await supabase.functions.invoke('generate-ad-copy', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate ad copy');
      }

      return data.copy;
    },
  });
};

export const useSuggestAdStyle = () => {
  return useMutation<StyleSuggestionResponse, Error, StyleSuggestionRequest>({
    mutationFn: async (request) => {
      const { data, error } = await supabase.functions.invoke('suggest-ad-style', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'Failed to suggest ad style');
      }

      return data;
    },
  });
};

export const useAutoFillTemplate = () => {
  return useMutation<AutoFillResponse, Error, AutoFillRequest>({
    mutationFn: async (request) => {
      const { data, error } = await supabase.functions.invoke('auto-fill-template', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'Failed to auto-fill template');
      }

      return data;
    },
  });
};