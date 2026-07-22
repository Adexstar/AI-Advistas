// Learning loop — every AI generation, edit, and publish is logged so the
// generator's future recommendations improve for this brand + category.

import { supabase } from "@/integrations/supabase/client";
import type { TemplateBlueprint } from "./TemplateBlueprintService";

export interface GenerationRecord {
  userId: string;
  blueprint: TemplateBlueprint;
  templateId?: string | null;
  outcome: "generated" | "edited" | "published" | "discarded";
  performance?: Record<string, unknown>;
}

export const TemplateLearningService = {
  async record(rec: GenerationRecord): Promise<void> {
    try {
      await (supabase as any).from("ai_jobs").insert({
        user_id: rec.userId,
        job_type: "generate_template",
        status: "completed",
        input: { blueprint: rec.blueprint, templateId: rec.templateId ?? null },
        output: { outcome: rec.outcome, performance: rec.performance ?? null },
        completed_at: new Date().toISOString(),
      });
    } catch (err) {
      // Learning must never break the user flow.
      console.warn("[TemplateLearningService] record failed", err);
    }
  },
};
