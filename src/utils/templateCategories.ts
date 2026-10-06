// Template category definitions and utilities

export const TEMPLATE_CATEGORIES = {
  SOCIAL_MEDIA: 'social_media',
  BUSINESS: 'business',
  AGENCY_MARKETING: 'agency_marketing',
  FREEPIK: 'freepik',
  INTERNAL: 'internal',
  BEAUTY: 'beauty',
  FASHION: 'fashion',
  REAL_ESTATE: 'real_estate',
  FOOD: 'food',
  SAAS: 'saas',
  FITNESS: 'fitness',
  ECOMMERCE: 'ecommerce',
  HEALTHCARE: 'healthcare',
  EDUCATION: 'education',
  AUTOMOTIVE: 'automotive',
  FINANCE: 'finance',
  TRAVEL: 'travel',
  AGENCY: 'agency',
  SEASONAL: 'seasonal',
} as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[keyof typeof TEMPLATE_CATEGORIES];

export const CATEGORY_OPTIONS = [
  { id: 'beauty', label: 'Beauty' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'food', label: 'Restaurant & Food' },
  { id: 'saas', label: 'SaaS & Technology' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'education', label: 'Education' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'finance', label: 'Finance' },
  { id: 'travel', label: 'Travel & Leisure' },
  { id: 'agency', label: 'Agency' },
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'business', label: 'Business' },
] as const;

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map(({ id, label }) => [id, label]),
);

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  [TEMPLATE_CATEGORIES.SOCIAL_MEDIA]: 'Templates optimized for social media platforms',
  [TEMPLATE_CATEGORIES.BUSINESS]: 'Professional business and corporate templates',
  [TEMPLATE_CATEGORIES.AGENCY_MARKETING]: 'Marketing agency and promotional templates',
  [TEMPLATE_CATEGORIES.FREEPIK]: 'Premium templates from Freepik',
  [TEMPLATE_CATEGORIES.INTERNAL]: 'Uploaded file-based templates',
  [TEMPLATE_CATEGORIES.BEAUTY]: 'Beauty and skincare campaigns',
  [TEMPLATE_CATEGORIES.FASHION]: 'Fashion and apparel launches',
  [TEMPLATE_CATEGORIES.REAL_ESTATE]: 'Property and real estate marketing',
  [TEMPLATE_CATEGORIES.FOOD]: 'Food, restaurant and hospitality promos',
  [TEMPLATE_CATEGORIES.SAAS]: 'Tech SaaS product and growth campaigns',
  [TEMPLATE_CATEGORIES.FITNESS]: 'Fitness and wellness content',
  [TEMPLATE_CATEGORIES.ECOMMERCE]: 'Commerce and product promotions',
  [TEMPLATE_CATEGORIES.HEALTHCARE]: 'Healthcare and wellness campaigns',
  [TEMPLATE_CATEGORIES.EDUCATION]: 'Education and learning promotions',
  [TEMPLATE_CATEGORIES.AUTOMOTIVE]: 'Automotive launches and sales',
  [TEMPLATE_CATEGORIES.FINANCE]: 'Finance and banking marketing',
  [TEMPLATE_CATEGORIES.TRAVEL]: 'Travel and leisure experiences',
  [TEMPLATE_CATEGORIES.AGENCY]: 'Agency and creative campaigns',
  [TEMPLATE_CATEGORIES.SEASONAL]: 'Seasonal promotions and campaigns',
};

const CATEGORY_ALIASES: Record<string, string> = {
  beauty: 'beauty',
  'beauty and skincare': 'beauty',
  'beauty and wellness': 'beauty',
  'beauty and makeup': 'beauty',
  'beauty skincare': 'beauty',
  'beauty wellness': 'beauty',
  fashion: 'fashion',
  'fashion and apparel': 'fashion',
  'real estate': 'real_estate',
  'real-estate': 'real_estate',
  'real_estate': 'real_estate',
  'real estate listing': 'real_estate',
  'property and real estate': 'real_estate',
  restaurant: 'food',
  'restaurant and food': 'food',
  'restaurant & food': 'food',
  'restaurant food': 'food',
  'food and restaurant': 'food',
  'food and beverage': 'food',
  'restaurant and beverage': 'food',
  food: 'food',
  saas: 'saas',
  'saas and technology': 'saas',
  'saas & technology': 'saas',
  'saas technology': 'saas',
  'saas and software': 'saas',
  technology: 'saas',
  'technology and saas': 'saas',
  'software and technology': 'saas',
  fitness: 'fitness',
  'fitness and wellness': 'fitness',
  ecommerce: 'ecommerce',
  'e commerce': 'ecommerce',
  'e-commerce': 'ecommerce',
  'online shopping': 'ecommerce',
  'shopping and retail': 'ecommerce',
  'travel and leisure': 'travel',
  'travel & leisure': 'travel',
  'travel and tourism': 'travel',
  'travel tourism': 'travel',
  travel: 'travel',
  'travel leisure': 'travel',
  healthcare: 'healthcare',
  'healthcare and wellness': 'healthcare',
  education: 'education',
  'education and learning': 'education',
  automotive: 'automotive',
  finance: 'finance',
  'finance and fintech': 'finance',
  agency: 'agency',
  'agency marketing': 'agency',
  'agency and marketing': 'agency',
  'marketing agency': 'agency',
  'creative agency': 'agency',
  seasonal: 'seasonal',
  'seasonal campaigns': 'seasonal',
  business: 'business',
  'business and marketing': 'business',
  'social media': 'social_media',
  'social media marketing': 'social_media',
  freepik: 'freepik',
  internal: 'internal',
};

const CATEGORY_KEYWORDS = [
  [/beauty|skincare|cosmetics|makeup|wellness/, 'beauty'],
  [/fashion|apparel|clothing|luxury/, 'fashion'],
  [/real estate|property|properties|listing|home|housing/, 'real_estate'],
  [/restaurant|food|beverage|cafe|dining|menu/, 'food'],
  [/saas|software|technology|tech|startup|platform/, 'saas'],
  [/fitness|gym|workout|training|wellness/, 'fitness'],
  [/e commerce|ecommerce|shopping|retail|commerce|store/, 'ecommerce'],
  [/healthcare|medical|clinic|dental|wellness/, 'healthcare'],
  [/education|course|learning|webinar|school/, 'education'],
  [/automotive|car|auto|vehicle|motors/, 'automotive'],
  [/finance|fintech|banking|tax|investment/, 'finance'],
  [/travel|tourism|vacation|leisure|hospitality/, 'travel'],
  [/agency|marketing|creative|studio|brand/, 'agency'],
  [/seasonal|holiday|black friday|christmas|summer|winter/, 'seasonal'],
  [/business|corporate|b2b|professional/, 'business'],
  [/social media|social_media|socialmedia/, 'social_media'],
  [/freepik|premium/, 'freepik'],
  [/internal|uploaded|custom/, 'internal'],
] as const;

export function normalizeTemplateCategory(value?: string | null): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const normalized = raw
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const key = normalized.replace(/\s+/g, ' ');
  const direct = CATEGORY_ALIASES[key];
  if (direct) return direct;

  for (const [pattern, resolved] of CATEGORY_KEYWORDS) {
    if (pattern.test(key)) return resolved;
  }

  return key.replace(/\s+/g, '_');
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

export function getCategoryDescription(category: string): string {
  return CATEGORY_DESCRIPTIONS[category] || 'Ad templates';
}

export function isValidCategory(category: string): boolean {
  return Object.values(TEMPLATE_CATEGORIES).includes(category as TemplateCategory);
}
