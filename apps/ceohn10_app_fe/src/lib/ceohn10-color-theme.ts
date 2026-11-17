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
    name: "Xám Doanh Nhân & Bạc Sang Trọng",
    subtitle: "Nhận diện xám chuẩn mực CEO HN10",
    threeColors: ["#475569", "#64748B", "#F8FAFC"],
    primaryColor: "#334155",
    primaryDeep: "#1E293B",
    accentColor: "#64748B",
    accentLight: "#94A3B8",
    lightBg: "#F8FAFC",
    lightBorder: "#E2E8F0",
    badgeBg: "bg-slate-100 text-slate-800 border-slate-200",
    gradientPrimary: "linear-gradient(135deg, #334155 0%, #64748B 100%)",
    gradientCard: "linear-gradient(135deg, #334155 0%, #475569 100%)",
    darkSurface: "#FFFFFF",
    darkSurface2: "#F8FAFC",
    darkBorder: "#E2E8F0",
    darkBorderSoft: "#F1F5F9",
    iconColor: "#334155",
    swatches: ["#334155", "#475569", "#94A3B8"],
  },
  {
    id: "dynamic-orange",
    name: "Xám Than Chì & Khói Trầm",
    subtitle: "Biến thể xám than chì tối giản",
    threeColors: ["#1E293B", "#334155", "#F8FAFC"],
    primaryColor: "#1E293B",
    primaryDeep: "#0F172A",
    accentColor: "#475569",
    accentLight: "#64748B",
    lightBg: "#F8FAFC",
    lightBorder: "#CBD5E1",
    badgeBg: "bg-slate-100 text-slate-800 border-slate-300",
    gradientPrimary: "linear-gradient(135deg, #1E293B 0%, #475569 100%)",
    gradientCard: "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
    darkSurface: "#FFFFFF",
    darkSurface2: "#F8FAFC",
    darkBorder: "#E2E8F0",
    darkBorderSoft: "#F1F5F9",
    iconColor: "#1E293B",
    swatches: ["#1E293B", "#334155", "#64748B"],
  },
  {
    id: "crimson-red",
    name: "Xám Titan & Ánh Bạc",
    subtitle: "Tone màu titan công nghệ sắc sảo",
    threeColors: ["#475569", "#94A3B8", "#F8FAFC"],
    primaryColor: "#475569",
    primaryDeep: "#334155",
    accentColor: "#64748B",
    accentLight: "#94A3B8",
    lightBg: "#F8FAFC",
    lightBorder: "#E2E8F0",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
    gradientPrimary: "linear-gradient(135deg, #475569 0%, #94A3B8 100%)",
    gradientCard: "linear-gradient(135deg, #475569 0%, #64748B 100%)",
    darkSurface: "#FFFFFF",
    darkSurface2: "#F8FAFC",
    darkBorder: "#E2E8F0",
    darkBorderSoft: "#F1F5F9",
    iconColor: "#475569",
    swatches: ["#475569", "#64748B", "#CBD5E1"],
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

    /* Đổi biến CSS đồng bộ khi ở Dark Mode - Luôn duy trì nền sáng thanh lịch */
    html.dark,
    .dark {
      --primary: ${primary} !important;
      --primary-foreground: #FFFFFF !important;
      --ring: ${accent} !important;
      --accent: ${accent} !important;
      --accent-foreground: #FFFFFF !important;
      --background: #F8FAFC !important;
      --foreground: #0F172A !important;
      --card: #FFFFFF !important;
      --card-foreground: #0F172A !important;
      --popover: #FFFFFF !important;
      --popover-foreground: #0F172A !important;
      --border: ${lightBorder} !important;
      --input: ${lightBorder} !important;
      --sidebar: #FFFFFF !important;
      --sidebar-foreground: #0F172A !important;
      --vba-border: ${lightBorder} !important;
      --vba-surface: #FFFFFF !important;
      --vba-surface-2: #F8FAFC !important;
      --theme-primary-gradient: ${gradientPrimary} !important;
    }

    /* 1. Recolor All Primary Solid Buttons & Badges (KHÔNG đè lên các class có độ mờ opacity /10, /20) */
    [class*="bg-[#003B95]"]:not([class*="/"]):not([class*="group-hover"]):not([class*="hover"]),
    [class*="bg-[#002B66]"]:not([class*="/"]):not([class*="group-hover"]):not([class*="hover"]),
    [class*="bg-[#002d73]"]:not([class*="/"]):not([class*="group-hover"]):not([class*="hover"]),
    [class*="bg-[#0052CC]"]:not([class*="/"]):not([class*="group-hover"]):not([class*="hover"]),
    [class*="bg-[#1E3A8A]"]:not([class*="/"]):not([class*="group-hover"]):not([class*="hover"]),
    [class*="bg-[#1F3864]"]:not([class*="/"]):not([class*="group-hover"]):not([class*="hover"]),
    .bg-primary,
    .vba-btn-primary,
    .vba-active-tab {
      background-color: ${primary} !important;
      background-image: none !important;
      color: #FFFFFF !important;
    }

    /* Các badge mờ (opacity /10, /15, /20) chuyển về xám sáng thanh lịch chuẩn bảng dữ liệu */
    [class*="bg-[#003B95]/"],
    [class*="bg-[#1E3A8A]/"],
    [class*="bg-[#7C2D82]/"] {
      background-color: #F1F5F9 !important;
      color: #334155 !important;
      border-color: #E2E8F0 !important;
    }

    /* 2. Recolor All Primary Texts across all brand colors */
    [class*="text-[#003B95]"]:not([class*="/"]),
    [class*="text-[#002B66]"]:not([class*="/"]),
    [class*="text-[#002d73]"]:not([class*="/"]),
    [class*="text-[#0052CC]"]:not([class*="/"]),
    [class*="text-[#1E3A8A]"]:not([class*="/"]),
    [class*="text-[#1F3864]"]:not([class*="/"]),
    .text-primary {
      color: ${primary} !important;
    }

    /* 3. Recolor All Borders */
    [class*="border-[#003B95]"]:not([class*="/"]),
    [class*="border-[#002B66]"]:not([class*="/"]),
    [class*="border-[#1E3A8A]"]:not([class*="/"]),
    .border-primary {
      border-color: ${lightBorder} !important;
    }

    /* 4. Recolor Rings & Outlines */
    [class*="ring-[#003B95]"],
    [class*="outline-[#003B95]"],
    .ring-primary {
      --tw-ring-color: ${accent} !important;
    }

    /* 5. Chuyển triệt để mọi class màu tím / violet về màu xám trung tính */
    [class*="bg-purple-"],
    [class*="bg-violet-"] {
      background-color: #F1F5F9 !important;
      color: #334155 !important;
      border-color: #CBD5E1 !important;
    }
    [class*="text-purple-"],
    [class*="text-violet-"] {
      color: #475569 !important;
    }
    [class*="border-purple-"],
    [class*="border-violet-"] {
      border-color: #CBD5E1 !important;
    }
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

  // Đảm bảo toàn bộ hệ thống luôn giữ nền sáng thanh lịch (không bị đen nền)
  const bg = "#FFFFFF";
  const bg2 = "#F8FAFC";
  const surface = "#FFFFFF";
  const surface2 = "#F8FAFC";
  const textColor = "#0F172A";
  const textMuted = "#475569";

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
  root.style.setProperty("--vba-border", theme.lightBorder);
  root.style.setProperty("--vba-border-soft", theme.lightBorder);
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

