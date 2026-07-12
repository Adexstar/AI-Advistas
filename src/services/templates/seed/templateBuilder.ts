// Helpers to author AdVista Originals as Fabric.js JSON with variable tags,
// Brand Engine flags, and layer naming conventions. Kept intentionally
// minimal — templates are authored by hand, this file removes boilerplate.

import type {
  FabricObjectJSON,
  FabricTemplateJSON,
  TemplateMetadata,
  TemplateVariableKey,
} from "../types";

export interface LayoutDNA {
  hero_position: "top" | "center" | "bottom" | "left" | "right";
  text_alignment: "left" | "center" | "right";
  cta_position: "top" | "center" | "bottom";
  image_priority: "product" | "hero" | "background" | "logo";
  visual_balance: "symmetrical" | "asymmetrical";
  spacing: "tight" | "comfortable" | "spacious";
  content_density: "low" | "medium" | "high";
  style: "minimal" | "bold" | "editorial" | "playful" | "corporate";
}

export interface TemplateVariables {
  key: TemplateVariableKey | string;
  label: string;
  default: string;
  ai_editable?: boolean;
  brand_locked?: boolean;
}

export interface OriginalTemplateModule {
  slug: string;
  name: string;
  description: string;
  category: string;
  collection_slug: string;
  platform: string;
  objective: string;
  format: string;
  width: number;
  height: number;
  ai_tags: string[];
  industry_tags: string[];
  metadata: TemplateMetadata & Record<string, unknown>;
  layout_dna: LayoutDNA;
  variables: TemplateVariables[];
  preview_url: string;
  thumbnail_url: string;
  template_json: FabricTemplateJSON;
}

let z = 0;
const nextZ = () => ++z;

interface CommonProps {
  name: string;
  left: number;
  top: number;
  width?: number;
  height?: number;
  variableKey?: TemplateVariableKey | string;
  brandReplaceable?: boolean;
  aiReplaceable?: boolean;
  editable?: boolean;
  opacity?: number;
  angle?: number;
  originX?: string;
  originY?: string;
}

export function rect(
  props: CommonProps & { fill: string; rx?: number; ry?: number }
): FabricObjectJSON {
  return {
    type: "rect",
    left: props.left,
    top: props.top,
    width: props.width ?? 100,
    height: props.height ?? 100,
    fill: props.fill,
    rx: props.rx ?? 0,
    ry: props.ry ?? 0,
    opacity: props.opacity ?? 1,
    angle: props.angle ?? 0,
    originX: props.originX ?? "left",
    originY: props.originY ?? "top",
    selectable: true,
    name: props.name,
    zIndex: nextZ(),
    variableKey: props.variableKey,
    brandReplaceable: props.brandReplaceable ?? false,
    aiReplaceable: props.aiReplaceable ?? false,
    editable: props.editable ?? true,
  };
}

export function textbox(
  props: CommonProps & {
    text: string;
    fontFamily?: string;
    fontSize: number;
    fontWeight?: string | number;
    fill: string;
    textAlign?: "left" | "center" | "right";
    lineHeight?: number;
    letterSpacing?: number;
  }
): FabricObjectJSON {
  return {
    type: "textbox",
    left: props.left,
    top: props.top,
    width: props.width ?? 800,
    text: props.text,
    fontFamily: props.fontFamily ?? "Inter",
    fontSize: props.fontSize,
    fontWeight: props.fontWeight ?? "normal",
    fill: props.fill,
    textAlign: props.textAlign ?? "left",
    lineHeight: props.lineHeight ?? 1.15,
    charSpacing: props.letterSpacing ?? 0,
    opacity: props.opacity ?? 1,
    angle: props.angle ?? 0,
    originX: props.originX ?? "left",
    originY: props.originY ?? "top",
    selectable: true,
    name: props.name,
    zIndex: nextZ(),
    variableKey: props.variableKey,
    brandReplaceable: props.brandReplaceable ?? false,
    aiReplaceable: props.aiReplaceable ?? true,
    editable: props.editable ?? true,
  };
}

export function image(
  props: CommonProps & { src: string; scaleX?: number; scaleY?: number }
): FabricObjectJSON {
  return {
    type: "image",
    left: props.left,
    top: props.top,
    width: props.width,
    height: props.height,
    src: props.src,
    scaleX: props.scaleX ?? 1,
    scaleY: props.scaleY ?? 1,
    opacity: props.opacity ?? 1,
    angle: props.angle ?? 0,
    originX: props.originX ?? "left",
    originY: props.originY ?? "top",
    selectable: true,
    name: props.name,
    zIndex: nextZ(),
    variableKey: props.variableKey,
    brandReplaceable: props.brandReplaceable ?? false,
    aiReplaceable: props.aiReplaceable ?? false,
    editable: props.editable ?? true,
  };
}

export function canvas(
  background: string,
  objects: FabricObjectJSON[]
): FabricTemplateJSON {
  return {
    version: "5.3.0",
    background,
    objects,
  };
}

export function resetZ() {
  z = 0;
}
