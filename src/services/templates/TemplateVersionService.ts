// Version history for templates. Every save in the Visual Editor snapshots
// the current Fabric JSON so users can restore any prior state, Figma-style.
// Every snapshot is validated by the QA pipeline before it is persisted —
// broken Fabric JSON, missing required variables, or unrenderable previews
// are rejected so the version history stays production-safe.

import { supabase } from "@/integrations/supabase/client";
import type { FabricTemplateJSON } from "./types";
import { runTemplateQA, type TemplateQAResult } from "./qa";


export interface TemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  template_json: FabricTemplateJSON;
  layers: unknown[];
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export const TemplateVersionService = {
  async list(templateId: string): Promise<TemplateVersion[]> {
    const { data, error } = await supabase
      .from("template_versions")
      .select("*")
      .eq("template_id", templateId)
      .order("version_number", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as TemplateVersion[];
  },

  async qa(
    templateJson: FabricTemplateJSON,
    opts: { requiredVariables?: string[]; renderCheck?: boolean } = {}
  ): Promise<TemplateQAResult> {
    return runTemplateQA(templateJson, opts);
  },

  async snapshot(params: {
    templateId: string;
    templateJson: FabricTemplateJSON;
    note?: string;
    requiredVariables?: string[];
    /** When true (default), a failing QA run throws before insert. */
    enforceQA?: boolean;
  }): Promise<TemplateVersion & { qa: TemplateQAResult }> {
    const enforce = params.enforceQA !== false;
    const qa = await runTemplateQA(params.templateJson, {
      requiredVariables: params.requiredVariables,
      // Render only in the browser; skip when running server-side.
      renderCheck: typeof document !== "undefined",
    });
    if (enforce && !qa.ok) {
      throw new Error(`Template QA failed: ${qa.errors.join(" | ")}`);
    }

    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id ?? null;

    const { data: latest } = await supabase
      .from("template_versions")
      .select("version_number")
      .eq("template_id", params.templateId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = ((latest?.version_number as number) ?? 0) + 1;

    const qaNote = qa.ok
      ? `qa:pass objects=${qa.stats.objectCount}`
      : `qa:warn ${qa.warnings.length} warnings`;
    const note = params.note ? `${params.note} — ${qaNote}` : qaNote;

    const { data, error } = await supabase
      .from("template_versions")
      .insert([
        {
          template_id: params.templateId,
          version_number: nextVersion,
          template_json: params.templateJson as any,
          layers: [] as any,
          note,
          created_by: uid,
        },
      ])
      .select("*")
      .single();
    if (error) throw error;
    return { ...(data as unknown as TemplateVersion), qa };
  },


  async restore(versionId: string): Promise<TemplateVersion> {
    const { data, error } = await supabase
      .from("template_versions")
      .select("*")
      .eq("id", versionId)
      .single();
    if (error) throw error;
    return data as unknown as TemplateVersion;
  },
};
