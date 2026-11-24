import React from "react";

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "gold";

export interface StatusBadgeProps {
  status?: string | boolean;
  label?: string;
  variant?: StatusVariant;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

/**
 * STATUS BADGE COMPONENT - CEO HN10
 * Chuẩn hóa màu sắc trạng thái theo nhận diện thương hiệu 3 màu chính (Đỏ - Vàng - Xanh)
 */
export function StatusBadge({
  status,
  label,
  variant,
  size = "sm",
  dot = true,
  className = "",
}: StatusBadgeProps) {
  // Tự động phân loại biến thể nếu không truyền variant tường minh
  const resolvedVariant: StatusVariant = (() => {
    if (variant) return variant;
    if (typeof status === "boolean") return status ? "success" : "danger";
    const s = String(status || "").toLowerCase();
    if (["active", "paid", "success", "confirmed", "checked_in", "hoạt động", "đã thanh toán"].includes(s))
      return "success";
    if (["pending", "waiting", "processing", "chờ duyệt", "đang xử lý"].includes(s))
      return "warning";
    if (["inactive", "expired", "cancelled", "rejected", "failed", "unpaid", "hết hạn", "hủy", "từ chối"].includes(s))
      return "danger";
    if (["vip", "platinum", "gold", "kim cương", "vàng"].includes(s))
      return "gold";
    if (["info", "member", "học viên"].includes(s))
      return "info";
    return "neutral";
  })();

  const variantStyles: Record<StatusVariant, { badge: string; dot: string }> = {
    success: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
      dot: "bg-emerald-500",
    },
    warning: {
      badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
      dot: "bg-amber-500",
    },
    danger: {
      badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
      dot: "bg-rose-500",
    },
    info: {
      badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
      dot: "bg-blue-500",
    },
    gold: {
      badge: "bg-amber-100/60 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700",
      dot: "bg-amber-600",
    },
    neutral: {
      badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dot: "bg-slate-400",
    },
  };

  const currentStyle = variantStyles[resolvedVariant];
  const sizeStyle = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const displayLabel = label || String(status || "Không xác định");

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeStyle} ${currentStyle.badge} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${currentStyle.dot} shrink-0`} />}
      <span>{displayLabel}</span>
    </span>
  );
}
