/**
 * CEO HN10 COLOR THEME SYSTEM (Quy Chuẩn Nhận Diện 3 Dạng Màu Tiêu Chuẩn CEO HN10 - HanoiBA)
 * Tuân thủ Brandbook: https://ceohn10.brandbook.vn/ & BRAND ID Guidelines
 * Độc lập với CRM, tối ưu hiển thị Dark Mode & Light Mode
 * Đồng bộ toàn diện 100% giao diện: Nút bấm, Icon, Bảng biểu, Navigation Bar & Header
 */

export type Ceo1983ColorThemeId =
  | "classic-navy"    // Dạng 1: Xanh Doanh Nhân (Navy Cổ Điển & Hổ Phách)
  | "dynamic-orange"  // Dạng 2: Cam Tiên Phong (Cam Năng Động & Lam Thẫm)
  | "crimson-red"     // Dạng 3: Đỏ Nhiệt Huyết (Đỏ Bứt Phá & Vàng Kim)
  | "royal-gold"      // Alias backward compatibility -> classic-navy
  | "heritage-orange" // Alias backward compatibility -> dynamic-orange
  | "obsidian-gold"   // Alias backward compatibility -> classic-navy
  | "ruby-gold";      // Alias backward compatibility -> crimson-red

export interface Ceo1983ColorTheme {
  id: Ceo1983ColorThemeId;
  name: string;
  subtitle: string;
  threeColors: [string, string, string]; // [Màu chính, Màu nền tối, Màu điểm nhấn]
  primaryColor: string;
  primaryDeep: string;
  accentColor: string;
  accentLight: string;
  lightBg: string;
  lightBorder: string;
  badgeBg: string;
  gradientPrimary: string;
  gradientCard: string;
  darkSurface: string;
  darkSurface2: string;
  darkBorder: string;
  darkBorderSoft: string;
  iconColor: string;
  swatches: [string, string, string];
}

export const CEOHN10_COLOR_THEMES: Ceo1983ColorTheme[] = [
  {
    id: "classic-navy",
    name: "Tím Hoàng Gia & Hồng Năng Động",
    subtitle: "Nhận diện thương hiệu cốt lõi CEO HN10",
    threeColors: ["#7C2D82", "#D61F69", "#000000"],
    primaryColor: "#7C2D82",
    primaryDeep: "#4A1C6E",
    accentColor: "#D61F69",
    accentLight: "#F43F5E",
    lightBg: "#FAF5FF",
    lightBorder: "#E9D5FF",
    badgeBg: "bg-[#7C2D82]/15 text-[#7C2D82] dark:text-[#FFFFFF] border-[#7C2D82]/30",
    gradientPrimary: "linear-gradient(135deg, #7C2D82 0%, #D61F69 100%)",
    gradientCard: "linear-gradient(135deg, #7C2D82 0%, #D61F69 100%)",
    darkSurface: "#000000",
    darkSurface2: "#18181B",
    darkBorder: "#18181B",
    darkBorderSoft: "#18181B",
    iconColor: "#7C2D82",
    swatches: ["#7C2D82", "#D61F69", "#000000"],
  },
  {
    id: "dynamic-orange",
    name: "Tím Hồng Sang Trọng",
    subtitle: "Biến thể tinh hoa quản trị số",
    threeColors: ["#7C2D82", "#D61F69", "#000000"],
    primaryColor: "#7C2D82",
    primaryDeep: "#4A1C6E",
    accentColor: "#D61F69",
    accentLight: "#F43F5E",
    lightBg: "#FAF5FF",
    lightBorder: "#E9D5FF",
    badgeBg: "bg-[#D61F69]/15 text-[#D61F69] dark:text-[#FFFFFF] border-[#D61F69]/40",
    gradientPrimary: "linear-gradient(135deg, #7C2D82 0%, #D61F69 100%)",
    gradientCard: "linear-gradient(135deg, #7C2D82 0%, #D61F69 100%)",
    darkSurface: "#000000",
    darkSurface2: "#18181B",
    darkBorder: "#18181B",
    darkBorderSoft: "#18181B",
    iconColor: "#7C2D82",
    swatches: ["#7C2D82", "#D61F69", "#000000"],
  },
  {
    id: "crimson-red",
    name: "Tím Đen Huyền Bí",
    subtitle: "Dạ tiệc doanh nhân & Vinh danh",
    threeColors: ["#7C2D82", "#D61F69", "#000000"],
    primaryColor: "#7C2D82",
    primaryDeep: "#4A1C6E",
    accentColor: "#D61F69",
    accentLight: "#F43F5E",
    lightBg: "#FAF5FF",
    lightBorder: "#E9D5FF",
    badgeBg: "bg-[#7C2D82]/15 text-[#7C2D82] dark:text-[#FFFFFF] border-[#7C2D82]/40",
    gradientPrimary: "linear-gradient(135deg, #7C2D82 0%, #D61F69 100%)",
    gradientCard: "linear-gradient(135deg, #7C2D82 0%, #D61F69 100%)",
    darkSurface: "#000000",
    darkSurface2: "#18181B",
    darkBorder: "#18181B",
    darkBorderSoft: "#18181B",
    iconColor: "#7C2D82",
    swatches: ["#7C2D82", "#D61F69", "#000000"],
  },
];

export const COLOR_THEME_STORAGE_KEY = "ceohn10_app_color_theme";
export const COLOR_THEME_EVENT = "ceohn10:color_theme_changed";

export function normalizeThemeId(saved: string | null): Ceo1983ColorThemeId {
  if (saved === "classic-navy" || saved === "royal-gold" || saved === "obsidian-gold") {
    return "classic-navy";
  }
  if (saved === "dynamic-orange" || saved === "heritage-orange") {
    return "dynamic-orange";
  }
  if (saved === "crimson-red" || saved === "ruby-gold") {
    return "crimson-red";
  }
  return "classic-navy";
}

export function getActiveCeo1983ColorThemeId(): Ceo1983ColorThemeId {
  if (typeof window === "undefined") return "classic-navy";
  try {
    const saved = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    return normalizeThemeId(saved);
  } catch {
    /* ignore */
  }
  return "classic-navy";
}

export function getActiveCeo1983ColorTheme(): Ceo1983ColorTheme {
  const id = getActiveCeo1983ColorThemeId();
  return CEOHN10_COLOR_THEMES.find((t) => t.id === id) || CEOHN10_COLOR_THEMES[0];
}

/**
 * Cập nhật stylesheet toàn cục để đổi màu 100% app khi chọn Dạng màu tiêu chuẩn
 * Tuyệt đối không can thiệp ép trắng recursive lên thẻ con trong Light Mode
 */
function injectGlobalThemeOverride(theme: Ceo1983ColorTheme): void {
  if (typeof document === "undefined") return;

  const styleId = "ceohn10-dynamic-theme-override";
  let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }

  const primary = theme.primaryColor;
  const primaryDeep = theme.primaryDeep;
  const accent = theme.accentColor;
  const lightBg = theme.lightBg;
  const lightBorder = theme.lightBorder;
  const gradientPrimary = theme.gradientPrimary;
  const darkSurface = theme.darkSurface;
  const darkSurface2 = theme.darkSurface2;
  const darkBorder = theme.darkBorder;
  const darkBorderSoft = theme.darkBorderSoft;

  styleTag.innerHTML = `
    /* ========================================================== */
    /* CEO HN10 UNIVERSAL BRAND THEME OVERRIDE (100% APP SYNC)     */
    /* Theme: ${theme.name} (${theme.id})                        */
    /* ========================================================== */
    :root,
    html:not(.dark),
    body:not(.dark) {
      --primary: ${primary} !important;
      --primary-foreground: #FFFFFF !important;
      --ring: ${primary} !important;
      --accent: ${accent} !important;
      --accent-foreground: #FFFFFF !important;
      --background: #FFFFFF !important;
      --foreground: #0F172A !important;
      --card: #FFFFFF !important;
      --card-foreground: #0F172A !important;
      --popover: #FFFFFF !important;
      --popover-foreground: #0F172A !important;
      --border: ${lightBorder} !important;
      --input: ${lightBorder} !important;
      --sidebar: #FFFFFF !important;
      --sidebar-foreground: #0F172A !important;
      --vba-navy: ${primary} !important;
      --vba-navy-deep: ${primaryDeep} !important;
      --vba-gold: ${accent} !important;
      --vba-gold-2: ${theme.accentLight} !important;
      --vba-border: ${lightBorder} !important;
      --theme-icon-color: ${primary} !important;
      --theme-primary-gradient: ${gradientPrimary} !important;
      --bc-mobile-accent: ${primary} !important;
      --bc-mobile-accent-grad: ${gradientPrimary} !important;
      --vba-theme-primary: ${primary} !important;
      --vba-theme-light-bg: ${lightBg} !important;
      --vba-theme-light-border: ${lightBorder} !important;
    }

    /* Đổi biến CSS đồng bộ khi ở Dark Mode */
    html.dark,
    .dark {
      --primary: ${primary} !important;
      --primary-foreground: #FFFFFF !important;
      --ring: ${accent} !important;
      --accent: ${accent} !important;
      --accent-foreground: #FFFFFF !important;
      --background: #000000 !important;
      --foreground: #FFFFFF !important;
      --card: ${darkSurface} !important;
      --card-foreground: #FFFFFF !important;
      --popover: ${darkSurface} !important;
      --popover-foreground: #FFFFFF !important;
      --border: ${darkBorder} !important;
      --input: ${darkBorderSoft} !important;
      --sidebar: #000000 !important;
      --sidebar-foreground: #FFFFFF !important;
      --vba-border: ${darkBorder} !important;
      --vba-surface: ${darkSurface} !important;
      --vba-surface-2: ${darkSurface2} !important;
      --theme-primary-gradient: ${gradientPrimary} !important;
    }

    /* 1. Recolor All Primary Buttons & Interactive Badges across all 3 brand colors */
    [class*="bg-[#003B95]" i],
    [class*="bg-[#002B66]" i],
    [class*="bg-[#002d73]" i],
    [class*="bg-[#0052CC]" i],
    [class*="bg-[#1E3A8A]" i],
    [class*="bg-[#1F3864]" i],
    [class*="bg-[#EA580C]" i],
    [class*="bg-[#C2410C]" i],
    [class*="bg-[#9A3412]" i],
    [class*="bg-[#F97316]" i],
    [class*="bg-[#DC2626]" i],
    [class*="bg-[#B91C1C]" i],
    [class*="bg-[#7F1D1D]" i],
    [class*="bg-[#EF4444]" i],
    .bg-primary,
    .vba-btn-primary,
    .vba-active-tab {
      background-color: ${primary} !important;
      background-image: none !important;
    }

    /* Chỉ ép text trắng trên các nút bấm hoặc thẻ pill thực sự có nền primary */
    button[class*="bg-[#003B95]" i],
    button[class*="bg-[#002B66]" i],
    button[class*="bg-[#002d73]" i],
    button[class*="bg-[#EA580C]" i],
    button[class*="bg-[#DC2626]" i],
    button.bg-primary,
    a.bg-primary,
    .vba-btn-primary {
      color: #FFFFFF !important;
    }

    /* 2. Recolor All Primary Texts across all 3 brand colors */
    [class*="text-[#003B95]" i],
    [class*="text-[#002B66]" i],
    [class*="text-[#002d73]" i],
    [class*="text-[#0052CC]" i],
    [class*="text-[#1E3A8A]" i],
    [class*="text-[#1F3864]" i],
    [class*="text-[#EA580C]" i],
    [class*="text-[#C2410C]" i],
    [class*="text-[#9A3412]" i],
    [class*="text-[#F97316]" i],
    [class*="text-[#DC2626]" i],
    [class*="text-[#B91C1C]" i],
    [class*="text-[#7F1D1D]" i],
    [class*="text-[#EF4444]" i],
    .text-primary {
      color: ${primary} !important;
    }

    /* 3. Recolor All Borders across all 3 brand colors */
    [class*="border-[#003B95]" i],
    [class*="border-[#002B66]" i],
    [class*="border-[#002d73]" i],
    [class*="border-[#0052CC]" i],
    [class*="border-[#1E3A8A]" i],
    [class*="border-[#1F3864]" i],
    [class*="border-[#EA580C]" i],
    [class*="border-[#C2410C]" i],
    [class*="border-[#9A3412]" i],
    [class*="border-[#F97316]" i],
    [class*="border-[#DC2626]" i],
    [class*="border-[#B91C1C]" i],
    [class*="border-[#7F1D1D]" i],
    [class*="border-[#EF4444]" i],
    .border-primary {
      border-color: ${primary} !important;
    }

    /* 4. Recolor Rings & Outlines */
    [class*="ring-[#003B95]" i],
    [class*="ring-[#EA580C]" i],
    [class*="ring-[#DC2626]" i],
    [class*="outline-[#003B95]" i],
    [class*="outline-[#EA580C]" i],
    [class*="outline-[#DC2626]" i],
    .ring-primary {
      --tw-ring-color: ${primary} !important;
    }

    /* 5. Recolor SVG Fills and Strokes across all charts, gauges and icons */
    svg[stroke="#003B95" i],
    svg[stroke="#EA580C" i],
    svg[stroke="#DC2626" i],
    circle[stroke="#003B95" i],
    circle[stroke="#EA580C" i],
    circle[stroke="#DC2626" i],
    path[stroke="#003B95" i],
    path[stroke="#EA580C" i],
    path[stroke="#DC2626" i] {
      stroke: ${primary} !important;
    }
    svg[fill="#003B95" i],
    svg[fill="#EA580C" i],
    svg[fill="#DC2626" i],
    circle[fill="#003B95" i],
    circle[fill="#EA580C" i],
    circle[fill="#DC2626" i],
    path[fill="#003B95" i],
    path[fill="#EA580C" i],
    path[fill="#DC2626" i] {
      fill: ${primary} !important;
    }

    /* 6. Recolor Soft Tints in Light Mode */
    html:not(.dark) [class*="bg-blue-50"],
    html:not(.dark) [class*="bg-orange-50"],
    html:not(.dark) [class*="bg-red-50"] {
      background-color: ${lightBg} !important;
    }
    html:not(.dark) [class*="border-blue-200"],
    html:not(.dark) [class*="border-blue-100"],
    html:not(.dark) [class*="border-orange-200"],
    html:not(.dark) [class*="border-red-200"] {
      border-color: ${lightBorder} !important;
    }

    /* 7. Recolor Gradients */
    [class*="from-[#003B95]" i],
    [class*="from-[#EA580C]" i],
    [class*="from-[#DC2626]" i] {
      --tw-gradient-from: ${primary} var(--tw-gradient-from-position) !important;
      --tw-gradient-to: ${primaryDeep} var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), ${primaryDeep} var(--tw-gradient-to-position) !important;
    }
    [class*="to-[#003B95]" i],
    [class*="to-[#EA580C]" i],
    [class*="to-[#DC2626]" i] {
      --tw-gradient-to: ${primary} var(--tw-gradient-to-position) !important;
    }

    /* 8. Bottom Navigation Bar Active Indicator & QR Center Button */
    .vba-bottom-bar button span[class*="rounded-full"][class*="shadow"] {
      background: ${gradientPrimary} !important;
      box-shadow: 0 4px 14px ${primary}60 !important;
    }

    /* 9. Dark Mode Button, Border & Text Theme Sync */
    html.dark button.bg-primary,
    html.dark .vba-btn-primary {
      background-color: ${primary} !important;
      color: #FFFFFF !important;
    }
    html.dark .border-primary {
      border-color: ${darkBorder} !important;
    }
  `;
}

export function applyCeo1983ColorTheme(themeId: Ceo1983ColorThemeId): void {
  if (typeof document === "undefined") return;
  const normalizedId = normalizeThemeId(themeId);
  const theme = CEOHN10_COLOR_THEMES.find((t) => t.id === normalizedId) || CEOHN10_COLOR_THEMES[0];
  const root = document.documentElement;

  // Gán data attribute trên cả root và body
  root.dataset.appColorTheme = theme.id;
  if (document.body) {
    document.body.dataset.appColorTheme = theme.id;
  }

  const isDark = root.classList.contains("dark") || (typeof localStorage !== "undefined" && localStorage.getItem("theme") === "dark");

  const bg = isDark ? theme.threeColors[1] : "#FFFFFF";
  const bg2 = isDark ? theme.darkSurface : "#F8FAFC";
  const surface = isDark ? theme.darkSurface : "#FFFFFF";
  const surface2 = isDark ? theme.darkSurface2 : "#F8FAFC";
  const textColor = isDark ? "#FFFFFF" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#475569";

  // Áp dụng biến CSS thời gian thực
  root.style.setProperty("--vba-bg", bg);
  root.style.setProperty("--vba-bg-2", bg2);
  root.style.setProperty("--vba-surface", surface);
  root.style.setProperty("--vba-surface-2", surface2);
  root.style.setProperty("--vba-text", textColor);
  root.style.setProperty("--vba-text-muted", textMuted);
  root.style.setProperty("--vba-navy", theme.primaryColor);
  root.style.setProperty("--vba-navy-deep", theme.primaryDeep);
  root.style.setProperty("--vba-gold", theme.accentColor);
  root.style.setProperty("--vba-gold-2", theme.accentLight);
  root.style.setProperty("--vba-border", isDark ? theme.darkBorder : theme.lightBorder);
  root.style.setProperty("--vba-border-soft", isDark ? theme.darkBorderSoft : theme.lightBorder);
  root.style.setProperty("--theme-icon-color", theme.iconColor);
  root.style.setProperty("--theme-primary-gradient", theme.gradientPrimary);
  root.style.setProperty("--theme-card-gradient", theme.gradientCard);
  root.style.setProperty("--bc-mobile-accent", theme.primaryColor);
  root.style.setProperty("--bc-mobile-accent-grad", theme.gradientPrimary);

  // Kích hoạt engine style override để đổi màu 100% app
  injectGlobalThemeOverride(theme);

  try {
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme.id);
    localStorage.setItem("vba.theme.color", theme.id);
    localStorage.setItem("vba_theme_color", theme.id);
    localStorage.setItem("ceohn10_active_theme", theme.id);
    localStorage.setItem("vba_active_color_theme", theme.id);
    window.dispatchEvent(new CustomEvent(COLOR_THEME_EVENT, { detail: theme }));
    window.dispatchEvent(new CustomEvent("theme-color-changed", { detail: theme.id }));
    window.dispatchEvent(new Event("storage"));
  } catch {
    /* ignore */
  }
}

export const CEO1983_COLOR_THEMES = CEOHN10_COLOR_THEMES;

export type CeoHn10ColorThemeId = Ceo1983ColorThemeId;
export type CeoHn10ColorTheme = Ceo1983ColorTheme;
export const applyCeoHn10ColorTheme = applyCeo1983ColorTheme;
export const getActiveCeoHn10ColorThemeId = getActiveCeo1983ColorThemeId;
export const getActiveCeoHn10ColorTheme = getActiveCeo1983ColorTheme;

