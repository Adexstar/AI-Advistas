// Canonical types for the AdVista Template Engine.
// Templates are stored as Fabric.js-compatible JSON plus a metadata envelope.
// Variables ({{brand.logo}}, {{headline}}, ...) are resolved by the Template
// Engine at instantiate time — the design geometry itself is never mutated.

export type TemplateVariableKey =
  | "brand.logo"
  | "brand.primaryColor"
  | "brand.secondaryColor"
  | "brand.font"
  | "brand.voice"
  | "headline"
  | "subheadline"
  | "body"
  | "cta"
  | "website"
  | "phone"
  | "offer"
  | "product_image"
  | "hero_image";

export interface TemplateMetadata {
  emotion?: string;
  audience?: string;
  layout_style?: string;
  visual_weight?: string;
  primary_color?: string;
  recommended_platforms?: string[];
  recommended_goal?: string[];
}

export interface TemplateRecord {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  platform: string | null;
  objective: string | null;
  format: string | null;
  width: number | null;
  height: number | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  template_json: FabricTemplateJSON | null;
  ai_tags: string[];
  industry_tags: string[];
  brand_compatible: boolean;
  popularity_score: number;
  source: string;
  premium: boolean;
  metadata: TemplateMetadata;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FabricObjectJSON {
  type: string;
  text?: string;
  src?: string;
  // Custom AdVista fields — persisted through Fabric's `toObject`.
  variableKey?: TemplateVariableKey | string;
  brandReplaceable?: boolean;
  aiReplaceable?: boolean;
  editable?: boolean;
  [key: string]: unknown;
}

export interface FabricTemplateJSON {
  version?: string;
  background?: string;
  objects: FabricObjectJSON[];
  [key: string]: unknown;
}

export interface TemplateInstantiateContext {
  brand?: {
    id?: string;
    name?: string;
    logo_url?: string;
    colors?: string[];
    fonts?: string[];
    voice?: string;
    locked?: boolean;
  } | null;
  category?: string | null;
  goal?: string | null;
  platform?: string | null;
  productName?: string | null;
  targetAudience?: string | null;
  // Free-form overrides keyed by variable key.
  variables?: Partial<Record<TemplateVariableKey | string, string>>;
  // When true, AI copy generation is skipped and only static/brand vars are filled.
  skipAI?: boolean;
}

export interface InstantiatedTemplate {
  templateId: string;
  json: FabricTemplateJSON;
  resolvedVariables: Record<string, string>;
  appliedBrand: boolean;
  appliedAI: boolean;
}
