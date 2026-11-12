import { stockTemplateRecord, type StockPhoto } from "./stockLayout";

const photo = (
  sourceId: string,
  name: string,
  category: string,
  format: StockPhoto["format"],
  width: number,
  height: number,
  author: string,
  slug: string,
): StockPhoto => ({
  provider: "pexels",
  source_id: sourceId,
  name,
  category,
  format,
  width,
  height,
  author,
  page_url: `https://www.pexels.com/photo/${slug}-${sourceId}/`,
  image_url: `https://images.pexels.com/photos/${sourceId}/pexels-photo-${sourceId}.jpeg?auto=compress&cs=tinysrgb&w=1600`,
  thumbnail_url: `https://images.pexels.com/photos/${sourceId}/pexels-photo-${sourceId}.jpeg?auto=compress&cs=tinysrgb&h=350`,
});

/** High-resolution Pexels photos laid out as square, story, and landscape ads. */
const STARTER_PHOTOS: StockPhoto[] = [
  photo("4735904", "Skincare Still Life", "Beauty", "story", 3124, 4686, "Kaboompics", "assorted-cosmetics-on-white-surface"),
  photo("7691161", "Skincare Close-up", "Beauty", "square", 3820, 5730, "ROMAN ODINTSOV", "close-up-shot-of-skincare-products"),
  photo("38290948", "Red Suit Editorial", "Fashion", "story", 5464, 8196, "Esra Saltürk", "fashion-model-in-red-suit-holding-magazine-outdoors"),
  photo("36430157", "Plated Steak", "Restaurant & Food", "landscape", 6000, 4000, "Willians Huerta", "chef-garnishing-steak-dish-in-kitchen"),
  photo("30580640", "Twin Houses", "Real Estate", "landscape", 3500, 2103, "Karolina K", "modern-twin-houses-with-symmetrical-design"),
  photo("18214902", "City Residences", "Real Estate", "story", 3648, 5472, "David Brown", "lit-up-windows-of-a-grey-residential-building"),
  photo("20594792", "Gym Session", "Fitness", "square", 6000, 4000, "Franco Monsalvo", "a-man-exercising-at-a-gym"),
  photo("26611769", "Product Kit", "E-commerce", "square", 3182, 3977, "Bagsandpouches Sg", "a-dim-sum-dumplings-meal-kit-in-a-colorful-packaging"),
  photo("6804612", "Startup Workstations", "SaaS & Technology", "landscape", 6486, 4325, "cottonbro studio", "workstations-of-a-startup-software-company"),
  photo("6789839", "Beach Resort", "Travel", "landscape", 4426, 2819, "Lelani Badenhorst", "scenic-view-of-a-resort"),
  photo("25706808", "Palm Shore", "Travel", "story", 2268, 4032, "Saila Holidays  Zanzibar", "palm-trees-on-sandy-beach-in-resort"),
  photo("4041392", "Serum and Petals", "Beauty", "landscape", 6000, 4000, "Pexels", "serum-bottle-on-petals"),
  photo("1926769", "Studio Look", "Fashion", "story", 4000, 6000, "Pexels", "fashion-portrait-in-studio"),
  photo("996329", "Clothing Rack", "Fashion", "landscape", 6000, 4000, "Pexels", "clothes-on-wooden-hangers"),
  photo("1640777", "Vegetable Bowl", "Restaurant & Food", "square", 6000, 4000, "Pexels", "vegetable-salad-bowl"),
  photo("376464", "Pancake Stack", "Restaurant & Food", "landscape", 6000, 3665, "Pexels", "pancakes-with-strawberries"),
  photo("1552242", "Rope Training", "Fitness", "landscape", 6000, 4000, "Pexels", "athletes-training-with-ropes"),
  photo("4164761", "Dumbbell Set", "Fitness", "story", 4000, 6000, "Pexels", "dumbbell-workout"),
  photo("5632399", "Sale Drop", "E-commerce", "square", 6000, 4000, "Pexels", "black-friday-sale"),
  photo("3965545", "Boutique Rail", "E-commerce", "landscape", 6000, 4000, "Pexels", "boutique-clothing-rail"),
  photo("3184465", "Team Handshake", "SaaS & Technology", "square", 6000, 4000, "Pexels", "handshake-at-a-laptop"),
];

export const stockStarterTemplates = STARTER_PHOTOS.map((item) => stockTemplateRecord(item));

export type StockCatalogItem = {
  provider: StockPhoto["provider"];
  source_id: string;
  name: string;
  image_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  license: string;
  author?: string;
  page_url?: string;
  tags?: string[];
  category: string;
  format: StockPhoto["format"];
};

/** Payload for the import-stock-templates catalog mode. */
export function stockCatalogItems(): StockCatalogItem[] {
  return STARTER_PHOTOS.map((photo) => ({
    provider: photo.provider,
    source_id: photo.source_id,
    name: photo.name,
    image_url: photo.image_url,
    thumbnail_url: photo.thumbnail_url,
    width: photo.width,
    height: photo.height,
    license: "pexels:free",
    author: photo.author,
    page_url: photo.page_url,
    tags: [photo.category, photo.format],
    category: photo.category,
    format: photo.format,
  }));
}

type LibraryIdentity = {
  id?: string;
  source?: string | null;
  source_id?: string | null;
  format?: string | null;
  preview_url?: string | null;
};

export function libraryIdentityKeys(row: LibraryIdentity) {
  const keys: string[] = [];
  if (row.source && row.source_id) keys.push(`${row.source}:${row.source_id}:${row.format ?? ""}`);
  if (row.preview_url) keys.push(`url:${row.preview_url}`);
  if (row.id) keys.push(`id:${row.id}`);
  return keys;
}

/** Saved rows stay, and any stock design that is not already stored is added. */
export function mergeLibraryTemplates<T extends LibraryIdentity>(remote: T[] | null | undefined): T[] {
  const rows = Array.isArray(remote) ? remote.filter(Boolean) : [];
  const seen = new Set(rows.flatMap((row) => libraryIdentityKeys(row)));
  const extras = stockStarterTemplates.filter((item) => !libraryIdentityKeys(item).some((key) => seen.has(key)));
  return [...rows, ...(extras as unknown as T[])];
}

export function withStockStarter<T extends LibraryIdentity>(remote: T[] | null | undefined, failed = false): T[] {
  if (failed || !remote || remote.length === 0) return stockStarterTemplates as unknown as T[];
  return mergeLibraryTemplates(remote);
}
