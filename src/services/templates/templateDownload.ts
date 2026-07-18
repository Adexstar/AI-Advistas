// Downloads a template as a self-contained .advista.json file that bundles
// the Fabric.js JSON plus AdVista metadata (layout DNA, AI tags, variable
// contract). Round-trip compatible with TemplateImportService.

import type { FabricTemplateJSON } from "./types";

export interface DownloadableTemplate {
  id?: string;
  name: string;
  description?: string | null;
  category?: string | null;
  platform?: string | null;
  objective?: string | null;
  width?: number | null;
  height?: number | null;
  template_json?: FabricTemplateJSON | null;
  layout_dna?: unknown;
  metadata?: unknown;
  ai_tags?: string[] | null;
  industry_tags?: string[] | null;
  brand_compatible?: boolean | null;
}

export function buildTemplateExport(t: DownloadableTemplate) {
  return {
    format: "advista.template.v1",
    exportedAt: new Date().toISOString(),
    template: {
      id: t.id,
      name: t.name,
      description: t.description ?? null,
      category: t.category ?? null,
      platform: t.platform ?? null,
      objective: t.objective ?? null,
      width: t.width ?? null,
      height: t.height ?? null,
      brand_compatible: t.brand_compatible ?? null,
      ai_tags: t.ai_tags ?? [],
      industry_tags: t.industry_tags ?? [],
      metadata: t.metadata ?? {},
      layout_dna: t.layout_dna ?? {},
      template_json: t.template_json ?? { version: "5.3.0", objects: [] },
    },
  };
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "template";
}

export function downloadTemplate(t: DownloadableTemplate) {
  const payload = buildTemplateExport(t);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(t.name)}.advista.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
