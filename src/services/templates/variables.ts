// Variable resolver for the Template Engine.
// Walks a Fabric.js JSON tree and substitutes {{key}} placeholders in text
// fields and image `src` attributes. Layout, sizing, and effects are never
// touched — the resolver is intentionally content-only.

import type { FabricObjectJSON, FabricTemplateJSON } from "./types";

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

export function fillPlaceholders(
  input: string | undefined,
  vars: Record<string, string>
): string | undefined {
  if (!input) return input;
  return input.replace(PLACEHOLDER, (_, key: string) => {
    const v = vars[key];
    return v == null ? `{{${key}}}` : v;
  });
}

function resolveObject(
  obj: FabricObjectJSON,
  vars: Record<string, string>
): FabricObjectJSON {
  const next: FabricObjectJSON = { ...obj };

  // Preferred path: layer carries a variableKey → substitute wholesale.
  if (obj.variableKey && vars[obj.variableKey] != null) {
    const value = vars[obj.variableKey];
    if ("text" in obj) next.text = value;
    if ("src" in obj) next.src = value;
  }

  // Fallback: inline {{...}} placeholders in text/src.
  if (typeof next.text === "string") next.text = fillPlaceholders(next.text, vars) ?? next.text;
  if (typeof next.src === "string") next.src = fillPlaceholders(next.src, vars) ?? next.src;

  // Recurse into grouped children if present.
  const objects = (obj as { objects?: FabricObjectJSON[] }).objects;
  if (Array.isArray(objects)) {
    (next as { objects?: FabricObjectJSON[] }).objects = objects.map((child) =>
      resolveObject(child, vars)
    );
  }
  return next;
}

export function resolveVariables(
  json: FabricTemplateJSON,
  vars: Record<string, string>
): FabricTemplateJSON {
  return {
    ...json,
    objects: (json.objects ?? []).map((o) => resolveObject(o, vars)),
  };
}
