import React, { type ReactNode, cloneElement, isValidElement } from "react";
import { usePermissions, type DataScopeLevel } from "@/hooks/use-permissions";

export interface PermissionGuardProps {
  /** Mã hành động cần kiểm tra quyền (VD: 'MEM_DELETE', 'FIN_COL_ADD') */
  action?: string;
  /** Danh sách mã hành động cần kiểm tra */
  actions?: string[];
  /** Nếu true, yêu cầu phải có TẤT CẢ các quyền trong actions; mặc định là chỉ cần 1 quyền (canAny) */
  requireAll?: boolean;
  /** Yêu cầu phạm vi dữ liệu tối thiểu (VD: 'ALL') */
  requiredDataScope?: DataScopeLevel;
  /** Nội dung thay thế khi không có quyền (Mặc định là null / ẩn hoàn toàn) */
  fallback?: ReactNode;
  /** Chế độ xử lý: 'hide' (ẩn) hoặc 'disable' (vô hiệu hóa nút và hiện tooltip) */
  mode?: "hide" | "disable";
  /** Thông điệp giải thích khi bị vô hiệu hóa */
  tooltip?: string;
  children: ReactNode;
}

export function PermissionGuard({
  action,
  actions,
  requireAll = false,
  requiredDataScope,
  fallback = null,
  mode = "hide",
  tooltip = "Bạn không có quyền thực hiện thao tác này",
  children,
}: PermissionGuardProps) {
  const { can, canAll, canAny, dataScope, isSuperAdmin } = usePermissions();

  let hasPermission = true;

  if (!isSuperAdmin) {
    if (action) {
      hasPermission = can(action);
    } else if (actions && actions.length > 0) {
      hasPermission = requireAll ? canAll(...actions) : canAny(...actions);
    }

    if (hasPermission && requiredDataScope) {
      if (requiredDataScope === "ALL" && dataScope !== "ALL") {
        hasPermission = false;
      } else if (requiredDataScope === "DEPARTMENT" && dataScope === "SELF") {
        hasPermission = false;
      }
    }
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  if (mode === "disable" && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<any>, {
      disabled: true,
      title: tooltip,
      className: `${(children.props as any).className || ""} opacity-50 cursor-not-allowed pointer-events-none`,
      "aria-disabled": true,
    });
  }

  return <>{fallback}</>;
}
