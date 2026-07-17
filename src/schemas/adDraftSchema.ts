import { z } from 'zod';

export const adDraftRequestSchema = z.object({
  prompt: z.string().min(20, "Prompt must be at least 20 characters").max(500, "Prompt must be less than 500 characters"),
  goal: z.enum(['awareness', 'conversion', 'traffic', 'engagement']).optional(),
  platform: z.array(z.string()).optional(),
});

export const adDraftResponseSchema = z.object({
  product: z.string().min(3).max(100),
  details: z.string().min(10).max(500),
  adType: z.enum(['image', 'video', 'carousel']),
  platforms: z.array(z.string()).min(1),
  audience: z.string(),
  simpleAudience: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  placementOptions: z.record(z.string(), z.array(z.string())),
  aiGenerated: z.literal(true),
  aiMetadata: z.object({
    suggestedHeadlines: z.array(z.string()),
    suggestedCTA: z.string(),
    confidence: z.number().min(0).max(100),
  }),
});

export type AdDraftRequest = z.infer<typeof adDraftRequestSchema>;
export type AdDraftResponse = z.infer<typeof adDraftResponseSchema>;
