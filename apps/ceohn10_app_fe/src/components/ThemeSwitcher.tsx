import { Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";
import { useT } from "@/lib/i18n";

type TKey = Parameters<ReturnType<typeof useT>>[0];

type Variant = "default" | "overlay";

/**
 * Two-mode appearance switcher: light / dark.
 * Keeps the indigo enterprise identity in every mode.
 */
export function ThemeSwitcher({
  _variant = "default",
  _className = "",
}: {
  variant?: Variant;
  className?: string;
  _variant?: Variant;
  _className?: string;
}) {
  // Toàn bộ hệ thống cố định 100% Light Theme, không hiển thị switcher giao diện tối
  return null;
}
