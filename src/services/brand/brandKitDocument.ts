export type BrandKitView = {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  cover_image_url: string | null;
  brand_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BrandColorItem = {
  id: string;
  brand_id: string;
  name: string | null;
  hex: string;
  rgb: string | null;
  is_primary: boolean;
};

export type BrandFontItem = {
  id: string;
  brand_id: string;
  name: string;
  font_url: string | null;
  font_type: string | null;
  role: string | null;
};

export type BrandAssetItem = {
  id: string;
  brand_id: string;
  name: string | null;
  asset_url: string;
  asset_type: string | null;
};

export type BrandKitRow = {
  id: string;
  user_id: string;
  name: string;
  logos: unknown;
  colors: unknown;
  fonts: unknown;
  created_at: string;
  updated_at: string;
};

export type BrandKitWrite = {
  name: string;
  logos: unknown[];
  colors: unknown[];
  fonts: unknown[];
};

const DEFAULTS = {
  primary: "#6E56F5",
  secondary: "#8B74F8",
  accent: "#10B981",
};

function list(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") as Record<string, unknown>[] : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function newItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `brand-${Date.now()}`;
}

export function readBrandKit(row: BrandKitRow): BrandKitView {
  const colors = list(row.colors);
  const logos = list(row.logos);
  const profile = logos.find((item) => item.asset_type === "profile") ?? {};
  const logo = logos.find((item) => item.asset_type === "logo" && text(item.asset_url));
  const cover = logos.find((item) => item.asset_type === "cover" && text(item.asset_url));
  const primary = colors.find((item) => item.is_primary === true) ?? colors[0];
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    industry: text(profile.industry),
    website: text(profile.website),
    description: text(profile.description),
    primary_color: text(primary?.hex) ?? DEFAULTS.primary,
    secondary_color: text(colors[1]?.hex) ?? DEFAULTS.secondary,
    accent_color: text(colors[2]?.hex) ?? DEFAULTS.accent,
    logo_url: text(logo?.asset_url),
    cover_image_url: text(cover?.asset_url),
    brand_score: 0,
    is_active: profile.is_active !== false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function readColors(row: BrandKitRow): BrandColorItem[] {
  return list(row.colors).flatMap((item) => {
    const hex = text(item.hex);
    if (!hex) return [];
    return [{
      id: text(item.id) ?? hex,
      brand_id: row.id,
      name: text(item.name),
      hex,
      rgb: text(item.rgb),
      is_primary: item.is_primary === true,
    }];
  });
}

export function readFonts(row: BrandKitRow): BrandFontItem[] {
  return list(row.fonts).flatMap((item) => {
    const name = text(item.name);
    if (!name) return [];
    return [{
      id: text(item.id) ?? name,
      brand_id: row.id,
      name,
      font_url: text(item.font_url),
      font_type: text(item.font_type),
      role: text(item.role),
    }];
  });
}

export function readAssets(row: BrandKitRow): BrandAssetItem[] {
  return list(row.logos).flatMap((item) => {
    const url = text(item.asset_url);
    const type = text(item.asset_type);
    if (!url || type === "profile") return [];
    return [{
      id: text(item.id) ?? url,
      brand_id: row.id,
      name: text(item.name),
      asset_url: url,
      asset_type: type,
    }];
  });
}

function slotColor(current: Record<string, unknown> | undefined, brandId: string, hex: string, name: string, isPrimary: boolean) {
  return {
    id: text(current?.id) ?? newItemId(),
    brand_id: brandId,
    name: text(current?.name) ?? name,
    hex,
    rgb: text(current?.rgb),
    is_primary: isPrimary,
  };
}

export function applyBrandUpdate(row: BrandKitRow, updates: Partial<BrandKitView>): BrandKitWrite {
  const colors = list(row.colors);
  const fonts = list(row.fonts);
  const logos = list(row.logos);
  const nextColors = [...colors];
  const paint = (index: number, hex: string | undefined, name: string, isPrimary: boolean) => {
    if (!hex) return;
    nextColors[index] = slotColor(nextColors[index], row.id, hex, name, isPrimary);
  };
  paint(0, updates.primary_color, "Primary", true);
  paint(1, updates.secondary_color, "Secondary", false);
  paint(2, updates.accent_color, "Accent", false);

  const profileIndex = logos.findIndex((item) => item.asset_type === "profile");
  const profile = { ...(profileIndex >= 0 ? logos[profileIndex] : { id: "profile", asset_type: "profile" }) };
  if ("industry" in updates) profile.industry = updates.industry;
  if ("website" in updates) profile.website = updates.website;
  if ("description" in updates) profile.description = updates.description;
  if ("is_active" in updates) profile.is_active = updates.is_active;
  const nextLogos = [...logos];
  if (profileIndex >= 0) nextLogos[profileIndex] = profile;
  else nextLogos.push(profile);

  const putFile = (type: "logo" | "cover", url: string | null | undefined) => {
    if (url === undefined) return;
    const index = nextLogos.findIndex((item) => item.asset_type === type);
    if (!url) {
      if (index >= 0) nextLogos.splice(index, 1);
      return;
    }
    const entry = {
      id: text(nextLogos[index]?.id) ?? newItemId(),
      asset_type: type,
      asset_url: url,
      name: type === "logo" ? "Logo" : "Cover",
    };
    if (index >= 0) nextLogos[index] = entry;
    else nextLogos.push(entry);
  };
  putFile("logo", updates.logo_url);
  putFile("cover", updates.cover_image_url);

  return {
    name: updates.name?.trim() || row.name,
    colors: nextColors,
    fonts,
    logos: nextLogos,
  };
}

export function emptyBrandWrite(name: string, updates: Partial<BrandKitView> = {}): BrandKitWrite {
  return applyBrandUpdate({
    id: "new",
    user_id: "",
    name: name || "Untitled brand",
    logos: [],
    colors: [],
    fonts: [],
    created_at: "",
    updated_at: "",
  }, { name, ...updates });
}

export function addColor(row: BrandKitRow, input: { hex: string; name?: string; is_primary?: boolean }): BrandKitWrite {
  const colors = readColors(row);
  colors.push({
    id: newItemId(),
    brand_id: row.id,
    name: input.name ?? null,
    hex: input.hex,
    rgb: null,
    is_primary: Boolean(input.is_primary),
  });
  return { name: row.name, colors, fonts: list(row.fonts), logos: list(row.logos) };
}

export function removeColor(row: BrandKitRow, id: string): BrandKitWrite {
  return {
    name: row.name,
    colors: readColors(row).filter((color) => color.id !== id),
    fonts: list(row.fonts),
    logos: list(row.logos),
  };
}

export function addFont(row: BrandKitRow, input: { name: string; role?: string; font_url?: string; font_type?: string }): BrandKitWrite {
  const fonts = readFonts(row);
  fonts.push({
    id: newItemId(),
    brand_id: row.id,
    name: input.name,
    font_url: input.font_url ?? null,
    font_type: input.font_type ?? null,
    role: input.role ?? null,
  });
  return { name: row.name, colors: list(row.colors), fonts, logos: list(row.logos) };
}

export function addAsset(row: BrandKitRow, input: { asset_url: string; asset_type: string; name?: string }): BrandKitWrite {
  const logos = list(row.logos);
  logos.push({
    id: newItemId(),
    asset_url: input.asset_url,
    asset_type: input.asset_type,
    name: input.name ?? null,
  });
  return { name: row.name, colors: list(row.colors), fonts: list(row.fonts), logos };
}
