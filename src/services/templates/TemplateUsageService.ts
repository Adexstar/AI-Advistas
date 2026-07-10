// Records template lifecycle events. Feeds the recommendation engine and
// Campaign Memory so future suggestions improve over time.

import { supabase } from "@/integrations/supabase/client";

export type TemplateUsageEvent =
  | "viewed"
  | "used"
  | "edited"
  | "favorited"
  | "published";

export const TemplateUsageService = {
  async record(templateId: string, event: TemplateUsageEvent, context: Record<string, unknown> = {}) {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return; // Anonymous events are dropped for now.
      await supabase.from("template_usage_events").insert({
        template_id: templateId,
        user_id: uid,
        event,
        context: context as unknown as Record<string, unknown>,
      });
    } catch (err) {
      console.warn("[TemplateUsageService]", err);
    }
  },
};
