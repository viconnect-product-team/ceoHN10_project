import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "./use-role";

export type DataScopeLevel = "ALL" | "DEPARTMENT" | "CLASS" | "SELF";

export interface PermissionActionMeta {
  code: string;
  label: string;
  module: string;
}

export const ACTION_DEFINITIONS: Record<string, PermissionActionMeta> = {
  // Học viên
  MEM_VIEW: { code: "MEM_VIEW", label: "Xem danh sách học viên", module: "members" },
  MEM_ADD: { code: "MEM_ADD", label: "Thêm mới học viên", module: "members" },
  MEM_EDIT: { code: "MEM_EDIT", label: "Chỉnh sửa thông tin học viên", module: "members" },
  MEM_DELETE: { code: "MEM_DELETE", label: "Xóa học viên khỏi CSDL", module: "members" },
  MEM_APPROVE: { code: "MEM_APPROVE", label: "Phê duyệt học viên", module: "members" },
  MEM_EXPORT: { code: "MEM_EXPORT", label: "Xuất dữ liệu học viên ra Excel", module: "members" },

  // Tài chính
  FIN_VIEW: { code: "FIN_VIEW", label: "Xem báo cáo tài chính", module: "finance" },
  FIN_ROW_ADD: { code: "FIN_ROW_ADD", label: "Thêm chứng từ thu chi", module: "finance" },
  FIN_ROW_EDIT: { code: "FIN_ROW_EDIT", label: "Chỉnh sửa chứng từ tài chính", module: "finance" },
  FIN_ROW_DELETE: { code: "FIN_ROW_DELETE", label: "Xóa chứng từ tài chính", module: "finance" },
  FIN_COL_ADD: { code: "FIN_COL_ADD", label: "Thêm cột động báo cáo tài chính", module: "finance" },
  FIN_COL_DELETE: { code: "FIN_COL_DELETE", label: "Xóa cột động báo cáo tài chính", module: "finance" },
  FRP_EXPORT: { code: "FRP_EXPORT", label: "Xuất báo cáo tài chính Excel/PDF", module: "finance" },

  // Sự kiện
  EVT_VIEW: { code: "EVT_VIEW", label: "Xem danh sách sự kiện", module: "events" },
  EVT_ADD: { code: "EVT_ADD", label: "Tạo sự kiện mới", module: "events" },
  EVT_EDIT: { code: "EVT_EDIT", label: "Chỉnh sửa sự kiện", module: "events" },
  EVT_DELETE: { code: "EVT_DELETE", label: "Hủy/xóa sự kiện", module: "events" },
  EVT_EXPORT: { code: "EVT_EXPORT", label: "Xuất danh sách đăng ký sự kiện", module: "events" },
  CHK_SCAN: { code: "CHK_SCAN", label: "Quét mã QR check-in sự kiện", module: "events" },

  // Lớp học
  CLS_VIEW: { code: "CLS_VIEW", label: "Xem danh sách lớp học", module: "classes" },
  CLS_ADD: { code: "CLS_ADD", label: "Thêm lớp học mới", module: "classes" },
  CLS_EDIT: { code: "CLS_EDIT", label: "Chỉnh sửa lớp học", module: "classes" },
  CLS_DELETE: { code: "CLS_DELETE", label: "Xóa lớp học", module: "classes" },
  CLS_ATTEND: { code: "CLS_ATTEND", label: "Điểm danh học viên lớp học", module: "classes" },

  // Quản trị hệ sinh thái (Master Admin)
  SYS_SEPAY_CONFIG: { code: "SYS_SEPAY_CONFIG", label: "Cấu hình cổng thanh toán Sepay", module: "system" },
  SYS_PLATFORM_MANAGE: { code: "SYS_PLATFORM_MANAGE", label: "Quản lý phần mềm nền tảng", module: "system" },
  SYS_USER_CREATE: { code: "SYS_USER_CREATE", label: "Tạo tài khoản quản trị mới", module: "system" },
  SYS_USER_PERM: { code: "SYS_USER_PERM", label: "Phân quyền tài khoản quản trị", module: "system" },
  SYS_DYNAMIC_FIELDS: { code: "SYS_DYNAMIC_FIELDS", label: "Cấu hình trường động Ban Công Nghệ", module: "system" },
};

export function usePermissions() {
  const { user } = useAuth();
  const roleState = useRole();

  const userEmail = (user?.email || (user as any)?.username || "").toLowerCase().trim();

  // 1. Quản trị viên tối cao: admin@ceohn10.vn hoặc platform_admin
  const isSuperAdmin =
    userEmail === "admin@ceohn10.vn" ||
    roleState.isPlatformAdmin ||
    roleState.isSuperAdmin ||
    roleState.isChuTich ||
    roleState.roles.includes("platform_admin") ||
    roleState.roles.includes("superadmin");

  const isPlatformAdmin = userEmail === "admin@ceohn10.vn" || roleState.isPlatformAdmin;

  // 2. Xác định Phân Quyền Dữ Liệu (Data Scope)
  const dataScope: DataScopeLevel = useMemo(() => {
    if (isSuperAdmin || roleState.canManageFinance || roleState.isBQT) {
      return "ALL";
    }
    if (roleState.isTruongBan || roleState.userDepartment) {
      return "DEPARTMENT";
    }
    if (roleState.roles.some((r) => r.includes("giao_vien") || r.includes("teacher"))) {
      return "CLASS";
    }
    return "SELF";
  }, [isSuperAdmin, roleState]);

  const dataScopeLabel = useMemo(() => {
    switch (dataScope) {
      case "ALL":
        return "Toàn Hệ Thống (Master Scope)";
      case "DEPARTMENT":
        return `Phạm vi Ban ${roleState.userDepartment || "Chuyên Môn"}`;
      case "CLASS":
        return "Phạm vi Lớp Học";
      case "SELF":
      default:
        return "Phạm vi Cá Nhân";
    }
  }, [dataScope, roleState.userDepartment]);

  // 3. Phân Quyền Thao Tác (Action Permissions)
  const can = useMemo(() => {
    return (actionCode: string): boolean => {
      // Superadmin có full quyền tất cả các thao tác
      if (isSuperAdmin) return true;

      // Kiểm tra quyền theo vai trò cụ thể
      const code = actionCode.toUpperCase().trim();

      // Quyền thành viên / học viên
      if (code === "MEM_VIEW") return true;
      if (code === "MEM_ADD") return roleState.canManageMembers || roleState.isBanDieuHanh;
      if (code === "MEM_EDIT") return roleState.canManageMembers || roleState.isBanDieuHanh;
      if (code === "MEM_DELETE") return roleState.isAdmin || roleState.isBQT;
      if (code === "MEM_APPROVE") return roleState.canApproveMembers || roleState.isTongThuKy;
      if (code === "MEM_EXPORT") return roleState.canManageMembers || roleState.isBanDieuHanh;

      // Quyền tài chính
      if (code === "FIN_VIEW") return roleState.canManageFinance || roleState.isBQT;
      if (code === "FIN_ROW_ADD") return roleState.canManageFinance || roleState.isTruongBanTaiChinh;
      if (code === "FIN_ROW_EDIT") return roleState.canManageFinance || roleState.isTruongBanTaiChinh;
      if (code === "FIN_ROW_DELETE") return roleState.isBQT || roleState.isTruongBanTaiChinh;
      if (code === "FIN_COL_ADD") return roleState.isBQT || roleState.isTruongBanTaiChinh;
      if (code === "FIN_COL_DELETE") return roleState.isBQT || roleState.isTruongBanTaiChinh;
      if (code === "FRP_EXPORT") return roleState.canManageFinance || roleState.isBQT;

      // Quyền sự kiện
      if (code === "EVT_VIEW") return true;
      if (code === "EVT_ADD") return roleState.canManageEvents || roleState.isTruongBanTruyenThong;
      if (code === "EVT_EDIT") return roleState.canManageEvents || roleState.isTruongBanTruyenThong;
      if (code === "EVT_DELETE") return roleState.isBQT || roleState.isTruongBanTruyenThong;
      if (code === "CHK_SCAN") return roleState.canScanQR || roleState.canManageEvents;
      if (code === "EVT_EXPORT") return roleState.canManageEvents || roleState.isBanDieuHanh;

      // Quyền lớp học
      if (code === "CLS_VIEW") return true;
      if (code === "CLS_ADD") return roleState.isBQT || roleState.isBanDieuHanh;
      if (code === "CLS_EDIT") return roleState.isBQT || roleState.isBanDieuHanh;
      if (code === "CLS_DELETE") return roleState.isBQT;
      if (code === "CLS_ATTEND") return roleState.canScanQR || roleState.isBanDieuHanh;

      // Quyền hệ thống tối cao
      if (
        code === "SYS_SEPAY_CONFIG" ||
        code === "SYS_PLATFORM_MANAGE" ||
        code === "SYS_USER_CREATE" ||
        code === "SYS_USER_PERM" ||
        code === "SYS_DYNAMIC_FIELDS"
      ) {
        return isSuperAdmin;
      }

      // Fallback kiểm tra qua permissions list của roleState
      return roleState.can(code);
    };
  }, [isSuperAdmin, roleState]);

  const canAny = useMemo(() => {
    return (...actions: string[]): boolean => actions.some((act) => can(act));
  }, [can]);

  const canAll = useMemo(() => {
    return (...actions: string[]): boolean => actions.every((act) => can(act));
  }, [can]);

  // 4. Phân Quyền Chức Năng (Route / Menu Permissions)
  const canAccessRoute = useMemo(() => {
    return (routePath: string): boolean => {
      if (isSuperAdmin) return true;
      const path = routePath.toLowerCase();

      if (path === "/master" || path.startsWith("/master")) {
        return isSuperAdmin;
      }
      if (path === "/permissions" || path.startsWith("/permissions")) {
        return isSuperAdmin;
      }
      if (path === "/settings" || path.startsWith("/settings")) {
        return isSuperAdmin;
      }
      if (path === "/finance-report" || path.startsWith("/finance")) {
        return can("FIN_VIEW");
      }
      if (path === "/members" || path.startsWith("/members")) {
        return can("MEM_VIEW");
      }
      if (path === "/events" || path.startsWith("/events")) {
        return can("EVT_VIEW");
      }
      if (path === "/classes" || path.startsWith("/classes") || path.startsWith("/trainings")) {
        return can("CLS_VIEW");
      }
      return true;
    };
  }, [isSuperAdmin, can]);

  return {
    can,
    canAny,
    canAll,
    canAccessRoute,
    dataScope,
    dataScopeLabel,
    isSuperAdmin,
    isPlatformAdmin,
    department: roleState.userDepartment,
    roles: roleState.roles,
    loading: roleState.loading,
  };
}
