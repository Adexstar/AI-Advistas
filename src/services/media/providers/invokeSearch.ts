import { supabase } from "@/integrations/supabase/client";
import { readEdgeError } from "@/services/edgeError";
import type { MediaAsset } from "../types";

export async function invokeMediaSearch(functionName: string, body: unknown): Promise<MediaAsset[]> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) {
    throw new Error(await readEdgeError(error, `${functionName} is unavailable. Add its API key as a Supabase secret.`));
  }
  const payload = data && typeof data === "object" ? data as { error?: unknown; results?: unknown } : {};
  if (typeof payload.error === "string" && payload.error.trim() && !Array.isArray(payload.results)) {
    throw new Error(payload.error);
  }
  return (Array.isArray(payload.results) ? payload.results : []) as MediaAsset[];
}
