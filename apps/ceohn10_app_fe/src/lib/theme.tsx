import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  applyCeo1983ColorTheme,
  getActiveCeo1983ColorThemeId,
  COLOR_THEME_EVENT,
  type Ceo1983ColorThemeId
} from "./ceohn10-color-theme";

export type Theme = "light" | "dark";

const STORAGE_KEY = "vba.theme";
const CRM_THEME_KEY = "vba.crm_theme";

function isAssociationApp(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/association");
}

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Cycles light → dark → light */
  toggle: () => void;
  colorTheme: Ceo1983ColorThemeId;
  setColorTheme: (ct: Ceo1983ColorThemeId) => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

function applyTheme(_theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // QUY CHUẨN TỐI CAO: TOÀN BỘ HỆ THỐNG CRM VÀ MOBILE APP CEO HN10 CỐ ĐỊNH 100% LIGHT THEME (Theme Sáng)
  root.classList.remove("dark");
  root.classList.remove("hc");
  root.classList.add("light");
  root.dataset.theme = "light";
  root.style.colorScheme = "light";
  applyCeo1983ColorTheme(getActiveCeo1983ColorThemeId());
}

function readInitial(): Theme {
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [colorTheme, setColorThemeState] = useState<Ceo1983ColorThemeId>("classic-navy");

  useEffect(() => {
    const initial = readInitial();
    const initialColor = getActiveCeo1983ColorThemeId();
    setThemeState(initial);
    setColorThemeState(initialColor);
    applyTheme(initial);
    applyCeo1983ColorTheme(initialColor);

    const handleColorChanged = (e: any) => {
      if (e.detail && e.detail.id) {
        setColorThemeState(e.detail.id);
      }
    };
    window.addEventListener(COLOR_THEME_EVENT, handleColorChanged);
    return () => window.removeEventListener(COLOR_THEME_EVENT, handleColorChanged);
  }, []);

  const setTheme = (_t: Theme) => {
    setThemeState("light");
    applyTheme("light");
    try {
      localStorage.setItem(CRM_THEME_KEY, "light");
      localStorage.setItem(STORAGE_KEY, "light");
    } catch {
      /* ignore */
    }
  };

  const setColorTheme = (ct: Ceo1983ColorThemeId) => {
    setColorThemeState(ct);
    applyCeo1983ColorTheme(ct);
  };

  const toggle = () => {
    // Luôn luôn là light theme theo quy chuẩn
    setTheme("light");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
