// Export orchestrator. Fabric JSON is always the source of truth; exports
// are downstream renderings. Server-side heavy exports (MP4, high-DPI PDF)
// route through the `export-ad` edge function.

import { supabase } from "@/integrations/supabase/client";
import type { FabricTemplateJSON } from "./types";

export type ExportFormat = "png" | "jpg" | "pdf" | "mp4";

export const TemplateExportService = {
  async export(params: {
    templateId?: string;
    json: FabricTemplateJSON;
    format: ExportFormat;
  }) {
    const { data, error } = await supabase.functions.invoke("export-ad", {
      body: {
        templateId: params.templateId,
        canvas: params.json,
        format: params.format,
      },
    });
    if (error) throw error;
    return data;
  },
};
