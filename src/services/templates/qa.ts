// Automated QA for AdVista templates.
//
// Runs three checks on any Fabric.js template JSON:
//   1) Structural integrity — the JSON is well-formed and every object has
//      the fields Fabric.js needs to deserialize.
//   2) Variable contract — required {{placeholders}} / variableKeys are all
//      present in the tree (so the Template Engine can personalize).
//   3) Preview rendering — the JSON deserializes into an off-screen Fabric
//      canvas and produces a non-empty raster (data URL).
//
// Every TemplateVersion snapshot is validated with runVersionQA() before it
// is written to the database — bad snapshots never reach production.

import type { FabricObjectJSON, FabricTemplateJSON } from "./types";

export interface TemplateQAResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    objectCount: number;
    textLayers: number;
    imageLayers: number;
    variablesFound: string[];
    missingVariables: string[];
    previewDataUrlBytes: number;
  };
}

const KNOWN_FABRIC_TYPES = new Set([
  "rect", "circle", "ellipse", "triangle", "line", "polygon", "polyline",
  "path", "image", "text", "i-text", "textbox", "group", "activeselection",
]);

function walk(objects: FabricObjectJSON[] | undefined, visit: (o: FabricObjectJSON) => void) {
  if (!Array.isArray(objects)) return;
  for (const o of objects) {
    visit(o);
    const children = (o as { objects?: FabricObjectJSON[] }).objects;
    if (Array.isArray(children)) walk(children, visit);
  }
}

function collectVariables(json: FabricTemplateJSON): string[] {
  const found = new Set<string>();
  const rx = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
  walk(json.objects, (o) => {
    if (typeof o.variableKey === "string" && o.variableKey.length > 0) found.add(o.variableKey);
    for (const field of ["text", "src"] as const) {
      const v = (o as Record<string, unknown>)[field];
      if (typeof v === "string") {
        let m: RegExpExecArray | null;
        rx.lastIndex = 0;
        while ((m = rx.exec(v))) found.add(m[1]);
      }
    }
  });
  return Array.from(found);
}

export function validateStructure(json: unknown): { errors: string[]; warnings: string[]; objectCount: number; textLayers: number; imageLayers: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let objectCount = 0;
  let textLayers = 0;
  let imageLayers = 0;

  if (!json || typeof json !== "object") {
    errors.push("Template JSON must be an object.");
    return { errors, warnings, objectCount, textLayers, imageLayers };
  }
  const doc = json as FabricTemplateJSON;
  if (!Array.isArray(doc.objects)) {
    errors.push("Template JSON is missing an `objects` array.");
    return { errors, warnings, objectCount, textLayers, imageLayers };
  }

  walk(doc.objects, (o) => {
    objectCount++;
    if (typeof o.type !== "string" || o.type.length === 0) {
      errors.push(`Layer #${objectCount} is missing a \`type\`.`);
      return;
    }
    if (!KNOWN_FABRIC_TYPES.has(o.type.toLowerCase())) {
      warnings.push(`Layer #${objectCount} has an unknown Fabric type "${o.type}".`);
    }
    if (o.type === "image" || o.type === "Image") {
      imageLayers++;
      if (typeof o.src !== "string" || o.src.length === 0) {
        errors.push(`Image layer #${objectCount} has no \`src\`.`);
      }
    }
    if (o.type === "text" || o.type === "i-text" || o.type === "textbox") {
      textLayers++;
      if (typeof o.text !== "string") {
        errors.push(`Text layer #${objectCount} has no \`text\` string.`);
      }
    }
  });

  if (objectCount === 0) warnings.push("Template has no layers.");
  return { errors, warnings, objectCount, textLayers, imageLayers };
}

async function renderPreview(json: FabricTemplateJSON, width = 320, height = 400): Promise<string> {
  // Off-screen render using Fabric's StaticCanvas. If deserialization or
  // rasterization fails, the caller records it as a QA error.
  const { StaticCanvas } = await import("fabric");
  const el = document.createElement("canvas");
  el.width = width;
  el.height = height;
  const canvas = new StaticCanvas(el, { width, height });
  try {
    await canvas.loadFromJSON(json as unknown as Record<string, unknown>);
    canvas.renderAll();
    const url = canvas.toDataURL({ format: "png", multiplier: 1 });
    return url;
  } finally {
    canvas.dispose();
  }
}

export async function runTemplateQA(
  json: FabricTemplateJSON,
  opts: { requiredVariables?: string[]; renderCheck?: boolean } = {}
): Promise<TemplateQAResult> {
  const struct = validateStructure(json);
  const variablesFound = collectVariables(json);
  const required = opts.requiredVariables ?? [];
  const missingVariables = required.filter((v) => !variablesFound.includes(v));

  const errors = [...struct.errors];
  const warnings = [...struct.warnings];
  if (missingVariables.length > 0) {
    errors.push(`Missing required variables: ${missingVariables.join(", ")}`);
  }

  let previewBytes = 0;
  if (opts.renderCheck !== false && typeof document !== "undefined" && errors.length === 0) {
    try {
      const url = await renderPreview(json);
      previewBytes = url.length;
      if (previewBytes < 200) errors.push("Preview render produced an empty canvas.");
    } catch (e) {
      errors.push(`Preview render failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      objectCount: struct.objectCount,
      textLayers: struct.textLayers,
      imageLayers: struct.imageLayers,
      variablesFound,
      missingVariables,
      previewDataUrlBytes: previewBytes,
    },
  };
}
