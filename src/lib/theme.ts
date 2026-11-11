export type AppTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "advista-theme";
export const THEME_EVENT = "advista-theme";

export function getStoredTheme(): AppTheme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* private browsing can block storage */
  }
  return "dark";
}

export function readAppliedTheme(): AppTheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: AppTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}
