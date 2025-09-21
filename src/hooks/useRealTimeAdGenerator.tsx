import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdGenerationRequest {
  product: string;
  platform: string;
  adType: 'text' | 'image' | 'video';
}

export interface GeneratedAdContent {
  headline: string;
  body: string;
  cta: string;
  hashtags: string[];
  imageUrl?: string;
  videoUrl?: string;
}

export interface GeneratedAd {
  id: string;
  content: GeneratedAdContent;
  productName: string;
  platform: string;
  adType: string;
  createdAt: string;
}

export const useRealTimeAdGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedAdContent | null>(null);
  const [currentRequest, setCurrentRequest] = useState<AdGenerationRequest | null>(null);

  const generateAdContent = useCallback(async (request: AdGenerationRequest) => {
    setIsGenerating(true);
    setCurrentRequest(request);
    setGeneratedContent(null);

    try {
      // First, generate the text content
      console.log('Generating ad content for:', request);
      
      const { data: contentData, error: contentError } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          product: request.product,
          platform: request.platform,
          adType: request.adType
        }
      });

      if (contentError || !contentData?.success) {
        throw new Error(contentData?.error || 'Failed to generate ad content');
      }

      const textContent = contentData.content;
      console.log('Generated text content:', textContent);

      let finalContent: GeneratedAdContent = {
        headline: textContent.headline,
        body: textContent.body,
        cta: textContent.cta,
        hashtags: textContent.hashtags
      };

      // If image ad, also generate image
      if (request.adType === 'image') {
        console.log('Generating ad image...');
        
        const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-ad-image', {
          body: {
            product: request.product,
            platform: request.platform,
            adContent: textContent
          }
        });

        if (!imageError && imageData?.success) {
          finalContent.imageUrl = imageData.imageUrl;
          console.log('Generated image URL:', imageData.imageUrl);
        } else {
          console.warn('Failed to generate image:', imageError || imageData?.error);
          // Continue without image rather than failing completely
        }
      }

      setGeneratedContent(finalContent);

      // Auto-save to user's library
      try {
        await supabase.functions.invoke('save-generated-ad', {
          body: {
            productName: request.product,
            adType: request.adType,
            platform: request.platform,
            content: finalContent,
            generationPrompt: `${request.product} for ${request.platform}`
          }
        });
        console.log('Ad saved to library');
      } catch (saveError) {
        console.warn('Failed to save to library:', saveError);
        // Don't fail the generation if saving fails
      }

      toast.success('Ad generated successfully!');
      
    } catch (error) {
      console.error('Error generating ad:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate ad');
      setGeneratedContent(null);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const regenerate = useCallback(() => {
    if (currentRequest) {
      generateAdContent(currentRequest);
    }
  }, [currentRequest, generateAdContent]);

  const clearGenerated = useCallback(() => {
    setGeneratedContent(null);
    setCurrentRequest(null);
  }, []);

  return {
    isGenerating,
    generatedContent,
    currentRequest,
    generateAdContent,
    regenerate,
    clearGenerated
  };
};