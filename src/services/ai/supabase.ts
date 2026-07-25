// Loosely typed accessor for tables not yet reflected in generated Database types.
// The generated types file will catch up on the next Supabase types regeneration;
// until then services use this to talk to the AI infrastructure tables.
import { supabase } from "@/integrations/supabase/client";
export const sb = supabase as unknown as {
  from: (table: string) => any;
  auth: typeof supabase.auth;
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
};
