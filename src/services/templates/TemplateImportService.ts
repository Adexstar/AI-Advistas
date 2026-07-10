// Import adapter layer. Pages never call provider APIs directly — they call
// this service, which routes through Supabase edge functions. Each adapter
// normalizes provider payloads into AdVista's Fabric JSON + layer format.

import { supabase } from "@/integrations/supabase/client";
import type { FabricTemplateJSON } from "./types";

export type TemplateProvider = "freepik" | "canva" | "bannerbear";

export interface ImportResult {
  name: string;
  preview_url?: string;
  template_json: FabricTemplateJSON;
  source: TemplateProvider;
}

export const TemplateImportService = {
  async search(provider: TemplateProvider, query: string, opts: Record<string, unknown> = {}) {
    if (provider === "freepik") {
      const { data, error } = await supabase.functions.invoke("search-freepik-templates", {
        body: { query, ...opts },
      });
      if (error) throw error;
      return data;
    }
    throw new Error(`Provider ${provider} not yet available`);
  },

  async import(provider: TemplateProvider, externalId: string): Promise<ImportResult> {
    if (provider === "freepik") {
      const { data, error } = await supabase.functions.invoke("get-freepik-template", {
        body: { freepikId: externalId },
      });
      if (error) throw error;
      return data as ImportResult;
    }
    throw new Error(`Provider ${provider} not yet available`);
  },
};
