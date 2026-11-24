import React from "react";
import {
  LayoutDashboard,
  BarChart3,
  FolderTree,
  Coins,
  ArrowLeftRight,
  CreditCard,
} from "lucide-react";

export type FinanceViewMode =
  | "dashboard"
  | "charts"
  | "unit_tree"
  | "opening_balance"
  | "transfers"
  | "banking_sepay";

interface FinanceViewModeTabsProps {
  viewMode: FinanceViewMode;
  onChange: (mode: FinanceViewMode) => void;
  className?: string;
}

export function FinanceViewModeTabs({
  viewMode,
  onChange,
  className = "",
}: FinanceViewModeTabsProps) {
  const tabs = [
    {
      id: "dashboard" as const,
      label: "Dashboard Tổng Hợp",
      icon: LayoutDashboard,
    },
    {
      id: "opening_balance" as const,
      label: "Số Dư Đầu Kỳ",
      icon: Coins,
    },
    {
      id: "transfers" as const,
      label: "Điều Chuyển Nội Bộ",
      icon: ArrowLeftRight,
    },
    {
      id: "banking_sepay" as const,
      label: "Ngân Hàng & SePay",
      icon: CreditCard,
    },
    {
      id: "charts" as const,
      label: "Biểu Đồ & Dòng Tiền",
      icon: BarChart3,
    },
    {
      id: "unit_tree" as const,
      label: "Cây Đơn Vị (6 Ban)",
      icon: FolderTree,
    },
  ];

  return (
    <div
      className={`p-1 rounded-xl bg-card border border-border/80 flex flex-wrap items-center gap-1 shadow-xs ${className}`}
    >
      {tabs.map((tab) => {
        const active = viewMode === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 min-w-[150px] py-2 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              active
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            <Icon
              className={`size-4 shrink-0 transition-colors ${
                active
                  ? "text-amber-400 dark:text-amber-600"
                  : "text-muted-foreground"
              }`}
            />
            <span className="whitespace-nowrap tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
