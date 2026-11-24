import React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

/**
 * EMPTY STATE COMPONENT - CEO HN10
 * Hiển thị trạng thái dữ liệu trống theo phong cách chuẩn mực, tối giản và sang trọng.
 */
export function EmptyState({
  icon,
  title = "Chưa có dữ liệu",
  description = "Hiện tại chưa có bản ghi nào được tạo trong mục này.",
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl border border-dashed border-border bg-card/40 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-4 shadow-inner">
        {icon || <FolderOpen className="w-7 h-7 text-muted-foreground/70" />}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}
