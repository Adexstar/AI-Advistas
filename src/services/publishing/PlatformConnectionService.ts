import { supabase } from "@/integrations/supabase/client";

export interface PlatformConnection {
  id: string;
  platform: string;
  provider: string;
  account_name: string | null;
  account_id: string | null;
  is_active: boolean;
  expires_at: string | null;
  metadata: Record<string, unknown>;
}

export const PlatformConnectionService = {
  async list(): Promise<PlatformConnection[]> {
    const { data, error } = await supabase
      .from("platform_connections")
      .select("id, platform, provider, account_name, account_id, is_active, expires_at, metadata")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PlatformConnection[];
  },

  async connect(input: { platform: string; provider: string; account_name?: string; account_id?: string; access_token?: string; refresh_token?: string; expires_at?: string; metadata?: Record<string, unknown> }) {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) throw new Error("Not authenticated");
    const { data, error } = await supabase.from("platform_connections").insert({ ...input, user_id: userId, is_active: true } as any).select().single();
    if (error) throw error;
    return data;
  },

  async disconnect(id: string) {
    const { error } = await supabase.from("platform_connections").update({ is_active: false }).eq("id", id);
    if (error) throw error;
  },

  async isConnected(platform: string): Promise<boolean> {
    const { data } = await supabase
      .from("platform_connections")
      .select("id")
      .eq("platform", platform)
      .eq("is_active", true)
      .maybeSingle();
    return !!data;
  },
};
