import { supabase } from "@/integrations/supabase/client";
import { readEdgeError } from "@/services/edgeError";

const MISSING_KEY = "Copy generation is unavailable. Add GROQ_API_KEY or OPENAI_API_KEY as a Supabase secret, then try again.";

export async function requestTextRewrite(action: string, text: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-gateway", {
    body: {
      specialist: "creative_strategist",
      preferredProvider: "groq",
      temperature: 0.4,
      maxTokens: 160,
      systemPrompt: "You rewrite advertising copy. Return only the rewritten line. Do not add quotes, labels, or an explanation.",
      userPrompt: `Action: ${action}\nCurrent copy:\n${text.trim() || "(empty)"}`,
    },
  });

  if (error) throw new Error(await readEdgeError(error, MISSING_KEY));

  const payload = data && typeof data === "object" ? data as { content?: unknown; error?: unknown; provider?: unknown } : {};
  if (payload.provider === "error" || (typeof payload.error === "string" && payload.error.trim())) {
    throw new Error(typeof payload.error === "string" && payload.error.trim() ? payload.error : MISSING_KEY);
  }
  const content = typeof payload.content === "string" ? payload.content.trim() : "";
  if (!content) throw new Error(MISSING_KEY);
  return content.replace(/^["']|["']$/g, "");
}
