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
];

export const stockStarterTemplates = STARTER_PHOTOS.map((item) => stockTemplateRecord(item));

export function withStockStarter<T extends { id: string }>(remote: T[] | null | undefined, failed = false): T[] {
  if (remote && remote.length > 0 && !failed) return remote;
  return stockStarterTemplates as unknown as T[];
}
