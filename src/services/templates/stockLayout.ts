export type StockFormat = "square" | "story" | "landscape";

export interface StockPhoto {
  provider: "pexels" | "unsplash" | "pixabay";
  source_id: string;
  name: string;
  image_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  author?: string;
  page_url?: string;
  category: string;
  format: StockFormat;
}

export function artboardFor(format: StockFormat) {
  if (format === "landscape") return { format, width: 1200, height: 628, platform: "Facebook" };
  if (format === "story") return { format, width: 1080, height: 1920, platform: "Instagram Story" };
  return { format, width: 1080, height: 1080, platform: "Instagram" };
}

export function buildStockTemplateJSON(photo: Pick<StockPhoto, "image_url" | "width" | "height">, width: number, height: number) {
  const scale = Math.max(width / Math.max(photo.width, 1), height / Math.max(photo.height, 1));
  const pad = Math.round(width * 0.08);
  return {
    version: "6.0.0",
    background: "#0b0b0f",
    width,
    height,
    objects: [
      {
        type: "image",
        name: "Background image",
        src: photo.image_url,
        crossOrigin: "anonymous",
        left: width / 2,
        top: height / 2,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        evented: true,
        meta: { role: "hero_image", variable: "hero_image", locked: true },
      },
      {
        type: "rect",
        name: "Contrast scrim",
        left: 0,
        top: height * 0.42,
        width,
        height: height * 0.58,
        fill: "rgba(8,8,14,0.62)",
        selectable: true,
        meta: { role: "scrim" },
      },
      {
        type: "textbox",
        name: "Headline",
        text: "{{headline}}",
        left: pad,
        top: Math.round(height * 0.56),
        width: width - pad * 2,
        fontSize: Math.round(width * 0.07),
        fontWeight: "700",
        fontFamily: "{{brand.font}}",
        fill: "#ffffff",
        editable: true,
        meta: { role: "headline", variable: "headline" },
      },
      {
        type: "textbox",
        name: "Subheadline",
        text: "{{subheadline}}",
        left: pad,
        top: Math.round(height * 0.72),
        width: width - pad * 2,
        fontSize: Math.round(width * 0.034),
        fontFamily: "{{brand.font}}",
        fill: "rgba(255,255,255,0.86)",
        editable: true,
        meta: { role: "subheadline", variable: "subheadline" },
      },
      {
        type: "rect",
        name: "CTA background",
        left: pad,
        top: Math.round(height * 0.84),
        width: Math.round(width * 0.42),
        height: Math.round(height * 0.07),
        rx: Math.round(height * 0.035),
        ry: Math.round(height * 0.035),
        fill: "{{brand.primaryColor}}",
        meta: { role: "cta_bg" },
      },
      {
        type: "textbox",
        name: "CTA",
        text: "{{cta}}",
        left: pad,
        top: Math.round(height * 0.855),
        width: Math.round(width * 0.42),
        textAlign: "center",
        fontSize: Math.round(width * 0.03),
        fontWeight: "600",
        fontFamily: "{{brand.font}}",
        fill: "#ffffff",
        editable: true,
        meta: { role: "cta", variable: "cta" },
      },
    ],
  };
}

const PROVIDER_NAME = { pexels: "Pexels", unsplash: "Unsplash", pixabay: "Pixabay" };

export function stockTemplateRecord(photo: StockPhoto, now = "2026-11-07T00:00:00.000Z") {
  const board = artboardFor(photo.format);
  const credit = photo.author ? `Photo by ${photo.author} on ${PROVIDER_NAME[photo.provider]}.` : `Stock photo from ${PROVIDER_NAME[photo.provider]}.`;
  return {
    id: `stock-${photo.provider}-${photo.source_id}-${photo.format}`,
    name: photo.name,
    description: credit,
    category: photo.category,
    platform: board.platform,
    objective: "Awareness",
    format: board.format,
    width: board.width,
    height: board.height,
    preview_url: photo.image_url,
    thumbnail_url: photo.thumbnail_url || photo.image_url,
    template_json: buildStockTemplateJSON(photo, board.width, board.height),
    ai_tags: [photo.category, board.format],
    industry_tags: [photo.category],
    brand_compatible: true,
    popularity_score: 40,
    source: photo.provider,
    source_id: photo.source_id,
    source_license: `${photo.provider}:free`,
    external_id: photo.source_id,
    template_source: photo.provider,
    premium: false,
    is_active: true,
    review_status: "approved",
    metadata: {
      recommended_platforms: board.format === "story" ? ["Instagram Story", "TikTok"] : [board.platform, "Instagram"],
      author: photo.author ?? null,
      page_url: photo.page_url ?? null,
      stock: true,
    },
    created_by: null,
    created_at: now,
    updated_at: now,
  };
}

export function isStockTemplateId(id: string | null | undefined) {
  return typeof id === "string" && id.startsWith("stock-");
}
