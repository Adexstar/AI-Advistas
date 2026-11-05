import { normalizeTemplateCategory } from "@/utils/templateCategories";

export const LIBRARY_PLATFORMS = [
  "All",
  "Facebook",
  "Instagram",
  "Instagram Story",
  "TikTok",
  "LinkedIn",
  "YouTube",
] as const;

export const LIBRARY_CATEGORIES = [
  { id: "ecommerce", label: "E-commerce" },
  { id: "beauty", label: "Beauty & Skincare" },
  { id: "fashion", label: "Fashion" },
  { id: "food", label: "Food & Drink" },
  { id: "real_estate", label: "Real Estate" },
  { id: "fitness", label: "Fitness" },
  { id: "saas", label: "Technology" },
] as const;

export const FORMAT_FILTERS = [
  { id: "All", label: "All formats" },
  { id: "square", label: "Post" },
  { id: "story", label: "Story" },
  { id: "landscape", label: "Landscape" },
] as const;

export function matchesPlatform(value: string | null | undefined, filter: string) {
  if (!filter || filter === "All") return true;
  return (value || "").trim().toLowerCase() === filter.toLowerCase();
}

export function matchesFormat(value: string | null | undefined, filter: string) {
  if (!filter || filter === "All") return true;
  const format = (value || "").trim().toLowerCase();
  if (filter === "square") return format === "square" || format.includes("square") || format === "post";
  if (filter === "story") return format.includes("story");
  if (filter === "landscape") return format.includes("landscape") || format.includes("horizontal") || format.includes("feed");
  return format === filter.toLowerCase();
}

export function categoryCounts(categories: Array<string | null | undefined>) {
  const counts = new Map<string, number>();
  for (const category of categories) {
    const id = normalizeTemplateCategory(category);
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
}

export function relativeUpdated(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "";
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return "";
  const minutes = Math.max(0, Math.round((now - time) / 60000));
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Updated ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
}
