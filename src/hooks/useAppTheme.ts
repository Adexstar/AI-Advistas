import { useEffect, useState } from "react";
import { applyTheme, readAppliedTheme, THEME_EVENT, type AppTheme } from "@/lib/theme";

export function useAppTheme() {
  const [theme, setThemeState] = useState<AppTheme>(readAppliedTheme);

  useEffect(() => {
    const sync = () => setThemeState(readAppliedTheme());
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  const setTheme = (next: AppTheme) => {
    applyTheme(next);
    setThemeState(next);
  };

  return { theme, setTheme };
}
