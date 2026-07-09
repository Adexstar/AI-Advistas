// TemplateService — AdVista's orchestration layer for templates.
// Pages must never call template edge functions directly; use this service.
// Sources: (1) AI Template Generator (proprietary), (2) Supabase library,
// (3) Freepik import. Canva is optional productivity, not a source.
import { supabase } from "@/integrations/supabase/client";
import { BrandService, type BrandIdentity } from "@/services/ai/BrandService";
import { CategoryService } from "@/services/ai/CategoryService";

export interface TemplateGenContext {
  brand?: BrandIdentity | null;
  category?: string;
  platform?: string;
  goal?: string;
  productName?: string;
  targetAudience?: string;
  templateType?: string;
}

export const TemplateService = {
  async list(_filter: { category?: string; platform?: string } = {}) {
    const { data, error } = await supabase.from("templates").select("*").limit(200);
    if (error) throw error;
    return data ?? [];
  },

  async get(id: string) {
    const { data, error } = await supabase.from("templates").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async generate(ctx: TemplateGenContext) {
    const guardrails = BrandService.toPromptGuardrails(ctx.brand ?? null);
    const playbook = ctx.category ? await CategoryService.get(ctx.category) : null;
    const { data, error } = await supabase.functions.invoke("generate-ad-draft", {
      body: {
        productName: ctx.productName,
        platform: ctx.platform,
        targetAudience: ctx.targetAudience,
        templateType: ctx.templateType,
        brandGuardrails: guardrails,
        categoryPlaybook: playbook,
        goal: ctx.goal,
      },
    });
    if (error) throw error;
    return data;
  },

  async autoFill(ctx: TemplateGenContext & { templateId?: string; templateStructure?: unknown }) {
    const guardrails = BrandService.toPromptGuardrails(ctx.brand ?? null);
    const { data, error } = await supabase.functions.invoke("auto-fill-template", {
      body: {
        templateId: ctx.templateId,
        templateStructure: ctx.templateStructure,
        productName: ctx.productName,
        platform: ctx.platform,
        targetAudience: ctx.targetAudience,
        brandGuardrails: guardrails,
      },
    });
    if (error) throw error;
    return data;
  },

  async importFromFreepik(query: string, opts: { category?: string; platform?: string } = {}) {
    const { data, error } = await supabase.functions.invoke("search-freepik-templates", {
      body: { query, ...opts },
    });
    if (error) throw error;
    return data;
  },

  async fetchFreepikAsset(freepikId: string) {
    const { data, error } = await supabase.functions.invoke("get-freepik-template", {
      body: { freepikId },
    });
    if (error) throw error;
    return data;
  },
};
