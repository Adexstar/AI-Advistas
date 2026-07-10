// Version history for templates. Every save in the Visual Editor snapshots
// the current Fabric JSON so users can restore any prior state, Figma-style.

import { supabase } from "@/integrations/supabase/client";
import type { FabricTemplateJSON } from "./types";

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

  async snapshot(params: {
    templateId: string;
    templateJson: FabricTemplateJSON;
    note?: string;
  }): Promise<TemplateVersion> {
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

    const { data, error } = await supabase
      .from("template_versions")
      .insert({
        template_id: params.templateId,
        version_number: nextVersion,
        template_json: params.templateJson as unknown as Record<string, unknown>,
        layers: [],
        note: params.note ?? null,
        created_by: uid,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as TemplateVersion;
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
