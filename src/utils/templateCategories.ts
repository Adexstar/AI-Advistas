// Template category definitions and utilities

export const TEMPLATE_CATEGORIES = {
  SOCIAL_MEDIA: 'social_media',
  BUSINESS: 'business',
  AGENCY_MARKETING: 'agency_marketing',
  FREEPIK: 'freepik',
  INTERNAL: 'internal',
} as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[keyof typeof TEMPLATE_CATEGORIES];

export const CATEGORY_LABELS: Record<string, string> = {
  [TEMPLATE_CATEGORIES.SOCIAL_MEDIA]: 'Social Media',
  [TEMPLATE_CATEGORIES.BUSINESS]: 'Business',
  [TEMPLATE_CATEGORIES.AGENCY_MARKETING]: 'Agency & Marketing',
  [TEMPLATE_CATEGORIES.FREEPIK]: 'Freepik Templates',
  [TEMPLATE_CATEGORIES.INTERNAL]: 'File-Based Templates',
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  [TEMPLATE_CATEGORIES.SOCIAL_MEDIA]: 'Templates optimized for social media platforms',
  [TEMPLATE_CATEGORIES.BUSINESS]: 'Professional business and corporate templates',
  [TEMPLATE_CATEGORIES.AGENCY_MARKETING]: 'Marketing agency and promotional templates',
  [TEMPLATE_CATEGORIES.FREEPIK]: 'Premium templates from Freepik',
  [TEMPLATE_CATEGORIES.INTERNAL]: 'Uploaded file-based templates',
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

export function getCategoryDescription(category: string): string {
  return CATEGORY_DESCRIPTIONS[category] || 'Ad templates';
}

export function isValidCategory(category: string): boolean {
  return Object.values(TEMPLATE_CATEGORIES).includes(category as TemplateCategory);
}
