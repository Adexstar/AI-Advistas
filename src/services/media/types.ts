export interface MediaAsset {
  id: string;
  url: string;
  thumbnailUrl?: string;
  provider: string;
  kind: "image" | "video" | "audio" | "document" | "logo";
  width?: number;
  height?: number;
  tags?: string[];
  meta?: Record<string, unknown>;
}

export interface MediaSearchContext {
  intent: string;
  category?: string;
  platform?: string;
  goal?: string;
  brandColors?: string[];
}

export interface MediaProvider {
  id: string;
  isConfigured: () => boolean;
  search?: (ctx: MediaSearchContext) => Promise<MediaAsset[]>;
  upload?: (file: File) => Promise<MediaAsset>;
  generate?: (prompt: string, opts?: Record<string, unknown>) => Promise<MediaAsset>;
}
