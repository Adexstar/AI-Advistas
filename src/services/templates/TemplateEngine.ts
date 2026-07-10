// TemplateEngine — the single entry point for turning a stored template into
// a personalized, editor-ready Fabric.js JSON document. Pages must never
// personalize templates themselves; call `TemplateEngine.instantiate`.

import { resolveVariables } from "./variables";
import { BrandEngine } from "./engines/BrandEngine";
import { AIEngine } from "./engines/AIEngine";
import { generateDefaultCanvasData } from "@/utils/canvasHelpers";
import type {
  FabricTemplateJSON,
  InstantiatedTemplate,
  TemplateInstantiateContext,
  TemplateRecord,
} from "./types";

export const TemplateEngine = {
  async instantiate(
    template: TemplateRecord,
    ctx: TemplateInstantiateContext = {}
  ): Promise<InstantiatedTemplate> {
    const base: FabricTemplateJSON =
      template.template_json ?? (generateDefaultCanvasData(template) as FabricTemplateJSON);

    const brandVars = BrandEngine.buildVariables(ctx);
    const aiVars = await AIEngine.personalize(template, ctx);
    const overrides = ctx.variables ?? {};

    // Brand Lock: when locked, user/AI overrides cannot mask brand values.
    const resolved: Record<string, string> = BrandEngine.isLocked(ctx)
      ? { ...aiVars, ...overrides, ...brandVars }
      : { ...aiVars, ...brandVars, ...overrides };

    const json = resolveVariables(base, resolved);

    return {
      templateId: template.id,
      json,
      resolvedVariables: resolved,
      appliedBrand: Object.keys(brandVars).length > 0,
      appliedAI: !ctx.skipAI,
    };
  },
};
