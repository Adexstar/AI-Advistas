// Import adapter layer. Pages never call provider APIs directly — they call
// this service, which routes through Supabase edge functions. Each adapter
// normalizes provider payloads into AdVista's Fabric JSON + layer format.

import type { FabricTemplateJSON } from "./types";

export type TemplateProvider = "canva" | "bannerbear";

export interface ImportResult {
  name: string;
  preview_url?: string;
  template_json: FabricTemplateJSON;
  source: TemplateProvider;
}

export const TemplateImportService = {
  async search(provider: TemplateProvider, _query: string, _opts: Record<string, unknown> = {}) {
    throw new Error(`Provider ${provider} not yet available`);
  },

  async import(provider: TemplateProvider, _externalId: string): Promise<ImportResult> {
    throw new Error(`Provider ${provider} not yet available`);
  },
};
