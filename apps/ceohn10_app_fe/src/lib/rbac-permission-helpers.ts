/**
 * RBAC Permission Helper for Web CRM CEO HN10
 * Ma trận phân quyền 5 vai trò cốt lõi: Quản trị, Admin, Tổng thư ký, Trưởng ban, Thành viên
 */

export const RBAC_MATRIX_STORAGE_KEY = "ceohn10_rbac_tree_matrix_v7_sidebar_menu";

export interface SystemTenantDef {
  key: string;
  name: string;
  shortName: string;
  code: string;
  brandName: string;
  brandLogo: string;
  description: string;
  enabledModules: string[];
}

export const SYSTEM_TENANTS: SystemTenantDef[] = [
  {
    key: "ceohn10",
    name: "CLB Doanh Nhân CEO HN10 (HanoiBA)",
    shortName: "CEO HN10",
    code: "CEOHN10",
    brandName: "CLB Doanh Nhân CEO HN10 (HanoiBA)",
    brandLogo: "/app-icon.png",
    description: "Cổng Quản trị Doanh Trí, Lớp học 30 chuyên đề, Sự kiện & Hội viên CEO HN10",
    enabledModules: [
      "classes",
      "events",
      "members",
      "finance",
      "b2b",
      "zalo_oa",
      "ai_assistant",
      "voting",
      "lucky_draw",
      "documents",
      "templates",
    ],
  },
];

export const TENANT_STORAGE_KEY = "viconnect_active_tenant";

export function getActiveSystemTenant(): string {
  return "ceohn10";
}

export function setActiveSystemTenant(tenantKey: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TENANT_STORAGE_KEY, tenantKey);
    const tenant = SYSTEM_TENANTS.find((t) => t.key === tenantKey) || SYSTEM_TENANTS[0];
    localStorage.setItem("vba_active_assoc_name", tenant.brandName);
    localStorage.setItem("crm_system_name", tenant.brandName);
    window.dispatchEvent(new CustomEvent("association-changed", { detail: { name: tenant.brandName } }));
    window.dispatchEvent(new CustomEvent("tenant-changed", { detail: { tenantKey, tenant } }));
  } catch {}
}

export function isModuleEnabledForTenant(moduleKey: string, tenantKey?: string): boolean {
  const activeKey = tenantKey || getActiveSystemTenant();
  if (typeof window !== "undefined") {
    try {
      const rawMatrix = localStorage.getItem("viconnect_system_modules_matrix");
      if (rawMatrix) {
        const matrix = JSON.parse(rawMatrix);
        if (matrix[activeKey] && Array.isArray(matrix[activeKey])) {
          return matrix[activeKey].includes(moduleKey);
        }
      }
    } catch {}
  }
  const tenant = SYSTEM_TENANTS.find((t) => t.key === activeKey) || SYSTEM_TENANTS[0];
  return tenant.enabledModules.includes(moduleKey);
}

export type SystemRoleKey =
  | "admin_platform"
  | "lop_truong"
  | "admin"
  | "lop_pho"
  | "truong_team"
  | "pho_team"
  | "truong_ban_chuyen_trach"
  | "member"
  // Aliases tương thích ngược
  | "quan_tri"
  | "chu_tich"
  | "pho_chu_tich"
  | "tong_thu_ky"
  | "truong_ban_dieu_hanh";

export interface SystemRoleDef {
  key: SystemRoleKey;
  name: string;
  shortName: string;
  color: string;
  desc: string;
}

export const SYSTEM_5_ROLES: SystemRoleDef[] = [
  {
    key: "admin_platform",
    name: "Admin Platform",
    shortName: "Admin Platform",
    color: "text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
    desc: "Quản trị viên nền tảng tối cao, toàn quyền hệ thống & phân quyền cao nhất",
  },
  {
    key: "lop_truong",
    name: "Lớp trưởng",
    shortName: "Lớp trưởng",
    color: "text-amber-800 bg-amber-100 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700",
    desc: "Lớp trưởng CEO HN10 - Điều hành và phê duyệt tối cao toàn lớp",
  },
  {
    key: "admin",
    name: "Admin",
    shortName: "Admin",
    color: "text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    desc: "Quản trị viên vận hành hệ thống CRM & CSDL",
  },
  {
    key: "lop_pho",
    name: "Lớp phó",
    shortName: "Lớp phó",
    color: "text-blue-800 bg-blue-100 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700",
    desc: "Lớp phó điều hành, phụ trách các ban chuyên môn và hoạt động lớp",
  },
  {
    key: "truong_team",
    name: "Trưởng team",
    shortName: "Trưởng team",
    color: "text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    desc: "Trưởng các team/nhóm học viên trong lớp",
  },
  {
    key: "pho_team",
    name: "Phó team",
    shortName: "Phó team",
    color: "text-cyan-700 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800",
    desc: "Phó các team/nhóm học viên hỗ trợ trưởng team",
  },
  {
    key: "truong_ban_chuyen_trach",
    name: "Trưởng ban chuyên trách",
    shortName: "Trưởng ban",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    desc: "Các Trưởng ban chuyên trách: Đào tạo, Sự kiện, Tài chính, Truyền thông, B2B, Gắn kết",
  },
  {
    key: "member",
    name: "Học viên",
    shortName: "Học viên",
    color: "text-slate-700 bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800",
    desc: "Học viên sinh hoạt chính thức của lớp",
  },
];

export const ROLE_OPTIONS = [
  { value: "admin_platform", label: "Admin Platform (Quản trị nền tảng)" },
  { value: "lop_truong", label: "Lớp trưởng" },
  { value: "admin", label: "Admin (Quản trị viên)" },
  { value: "lop_pho", label: "Lớp phó" },
  { value: "truong_team", label: "Trưởng team" },
  { value: "pho_team", label: "Phó team" },
  { value: "truong_ban_chuyen_trach", label: "Trưởng ban chuyên trách" },
  { value: "member", label: "Học viên" },
];

export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  leaderName?: string;
  headTitle?: string;
  memberCount?: number;
  description?: string;
  color?: string;
  isCore?: boolean;
}

export const INITIAL_DEPARTMENTS: DepartmentItem[] = [
  { id: "dept_ht", name: "Ban Học tập", code: "BHT", leaderName: "Lớp Phó Học Tập Lâm Thời", description: "Tổ chức học tập, chia sẻ kiến thức, đào tạo kỹ năng doanh nhân", color: "blue", isCore: true },
  { id: "dept_sk", name: "Ban Sự kiện & Hậu cần", code: "BSK", leaderName: "Lớp Phó Sự Kiện & Hậu Cần Lâm Thời", description: "Lên kế hoạch, tổ chức sự kiện, chuẩn bị hậu cần lớp", color: "purple", isCore: true },
  { id: "dept_tc", name: "Ban Tài chính & Tài trợ", code: "BTC", leaderName: "Lớp Phó Tài Chính Tài Trợ Lâm Thời", description: "Quản lý ngân sách lớp, thu chi, vận động tài trợ", color: "yellow", isCore: true },
  { id: "dept_tt", name: "Ban Truyền thông", code: "BTT", leaderName: "Lớp Phó Truyền Thông Lâm Thời", description: "Truyền thông nội bộ và đối ngoại, xây dựng hình ảnh lớp", color: "rose", isCore: true },
  { id: "dept_cn", name: "Ban Công nghệ", code: "BCN", leaderName: "Lớp Phó Công Nghệ Lâm Thời", description: "Ứng dụng chuyển đổi số, hỗ trợ kỹ thuật và công nghệ thông tin", color: "indigo", isCore: true },
  { id: "dept_dn", name: "Ban Đối ngoại & Giao thương", code: "BDN", leaderName: "Lớp Phó Đối Ngoại & Giao Thương Lâm Thời", description: "Kết nối giao thương B2B, hợp tác đối ngoại, phát triển cơ hội", color: "emerald", isCore: true },
  { id: "dept_ds", name: "Ban Đời sống & Gắn kết thành viên", code: "BDS", leaderName: "Lớp Phó Đời Sống & Gắn Kết Thành Viên Lâm Thời", description: "Chăm lo đời sống thành viên, tổ chức sinh nhật, gắn kết tập thể", color: "amber", isCore: true },
  { id: "dept_tn", name: "Ban Thiện Nguyện", code: "BTN", leaderName: "Trưởng Ban Thiện Nguyện", description: "Tổ chức các hoạt động an sinh xã hội, gây quỹ và chương trình thiện nguyện vì cộng đồng", color: "teal", isCore: true },
];

export const DEPARTMENTS_STORAGE_KEY = "ceohn10_departments_v2";

export function getCustomDepartments(): DepartmentItem[] {
  if (typeof window === "undefined") return INITIAL_DEPARTMENTS;
  try {
    const raw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { }
  return INITIAL_DEPARTMENTS;
}

export function saveCustomDepartments(list: DepartmentItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("ceohn10_departments_updated", { detail: list }));
  } catch { }
}

export const DEPARTMENT_OPTIONS = [
  "Ban Học tập",
  "Ban Sự kiện & Hậu cần",
  "Ban Tài chính & Tài trợ",
  "Ban Truyền thông",
  "Ban Công nghệ",
  "Ban Đối ngoại & Giao thương",
  "Ban Đời sống & Gắn kết thành viên",
  "Ban Thiện Nguyện",
  "Học viên ceohn10",
];

export function normalizeRole(r?: string): SystemRoleKey {
  if (!r) return "member";
  const s = r.toLowerCase().trim();

  // 1. Quản trị nền tảng, Lớp trưởng, Lớp phó, Trưởng/Phó team, Admin
  if (s === "admin_platform" || s === "platform_admin" || s === "superadmin" || s.includes("hệ thống") || s === "quản trị" || s === "quan_tri") return "admin_platform";
  if (s === "lop_truong" || s === "chu_tich" || s === "president" || s.includes("chủ tịch") || s.includes("lớp trưởng")) return "lop_truong";
  if (s === "lop_pho" || s === "pho_chu_tich" || s.includes("phó chủ tịch") || s.includes("lớp phó")) return "lop_pho";
  if (s === "truong_team" || s.startsWith("truong_team_") || s.includes("trưởng team") || s.includes("trưởng nhóm")) return "truong_team";
  if (s === "pho_team" || s.startsWith("pho_team_") || s.includes("phó team") || s.includes("phó nhóm")) return "pho_team";
  if (s === "admin" || s === "adm") return "admin";
  if (s === "tong_thu_ky" || s === "ttk" || s.includes("tổng thư ký") || s === "ban_thu_ky" || s === "thu_ky" || s === "btk") return "admin";

  // 2. Trưởng ban chuyên trách (Tất cả các ban chuyên môn)
  if (
    s === "truong_ban_chuyen_trach" ||
    s.startsWith("truong_ban_") ||
    s.startsWith("tb_") ||
    s.includes("trưởng ban") ||
    s.includes("tbdh") ||
    s.includes("btt") ||
    s.includes("btv") ||
    s.includes("bxt") ||
    s.includes("btc") ||
    s.includes("btn")
  ) {
    return "truong_ban_chuyen_trach";
  }

  return "member";
}

export function normalizeDept(d?: string): string {
  if (!d) return "Học viên ceohn10";
  const s = d.toLowerCase().trim();
  if (s.includes("tài chính") || s.includes("kế toán") || s.includes("ngân quỹ")) return "Ban Tài chính";
  if (s.includes("thành viên") && !s.includes("Học viên") && !s.includes("ceo")) return "Ban Thành viên";
  if (s.includes("xúc tiến") || s.includes("thương mại") || s.includes("b2b")) return "Ban Xúc tiến";
  if (s.includes("thiện nguyện") || s.includes("tấm lòng") || s.includes("an sinh")) return "Ban Thiện nguyện";
  if (s.includes("truyền thông") || s.includes("marketing") || s.includes("báo chí")) return "Ban Truyền thông";
  if (s.includes("thư ký")) return "Ban Thư Ký";
  if (s.includes("điều hành") || s.includes("quản trị") || s.includes("bqt")) return "Ban Điều Hành";
  return "Học viên ceohn10";
}

export function getAllDynamicRoleOptions(customDepts?: DepartmentItem[]): { value: string; label: string; desc?: string }[] {
  const depts = customDepts || (typeof window !== "undefined" ? getCustomDepartments() : INITIAL_DEPARTMENTS);
  const base = [...ROLE_OPTIONS];
  depts.forEach((d) => {
    if (!d.isCore) {
      const leaderKey = `truong_ban_${d.code.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
      if (!base.some((r) => r.value === leaderKey)) {
        base.push({
          value: leaderKey,
          label: d.headTitle || `Trưởng ${d.name}`,
        });
      }
    }
  });
  return base;
}

export function getRolesForDepartment(
  deptName: string,
  customDepts?: DepartmentItem[],
  currentRole?: string
): { value: string; label: string; desc?: string }[] {
  const norm = normalizeDept(deptName);
  const depts = customDepts || (typeof window !== "undefined" ? getCustomDepartments() : INITIAL_DEPARTMENTS);
  const matchedCustom = depts.find(
    (d) =>
      d.name.toLowerCase() === deptName.toLowerCase() ||
      d.code.toLowerCase() === deptName.toLowerCase() ||
      deptName.toLowerCase().includes(d.name.toLowerCase())
  );

  let roles: { value: string; label: string; desc?: string }[] = [];

  if (norm === "Ban Điều Hành" || deptName.toLowerCase().includes("điều hành") || deptName.toLowerCase().includes("quản trị")) {
    roles = [
      { value: "quan_tri", label: "Quản trị", desc: "Toàn quyền quản trị hệ thống" },
      { value: "chu_tich", label: "Lớp Trưởng (Chủ tịch)", desc: "Lớp Trưởng Lâm thời CEO HN10 / Điều hành & phê duyệt tối cao" },
      { value: "pho_chu_tich", label: "Lớp Phó (Phó Chủ tịch)", desc: "Lớp Phó Lâm thời CEO HN10 / Phụ trách ban chuyên môn" },
      { value: "truong_ban_dieu_hanh", label: "Trưởng ban Điều hành", desc: "Điều hành quản lý nội bộ" },
      { value: "admin", label: "Admin", desc: "Quản trị viên kỹ thuật & dữ liệu" },
      { value: "thanh_vien_ban_dieu_hanh", label: "Thành viên ban điều hành", desc: "Thành viên Ban Điều Hành" },
    ];
  } else if (norm === "Ban Thư Ký" || deptName.toLowerCase().includes("thư ký")) {
    roles = [
      { value: "tong_thu_ky", label: "Tổng thư ký", desc: "Điều phối thư ký & văn phòng" },
      { value: "thanh_vien_ban_su_kien", label: "Thành viên Ban Sự Kiện", desc: "Phụ trách sự kiện & thư ký" },
      { value: "member", label: "Thành viên", desc: "Thành viên Ban thư ký" },
    ];
  } else if (norm === "Ban Thành viên" || deptName.toLowerCase().includes("thành viên")) {
    roles = [
      { value: "truong_ban_thanh_vien", label: "Trưởng ban Thành viên", desc: "Lãnh đạo Ban phát triển Học viên" },
      { value: "thanh_vien_ban_thanh_vien", label: "Thành viên Ban Thành Viên", desc: "Chuyên trách thẩm định & chăm sóc Học viên" },
      { value: "member", label: "Thành viên", desc: "Học viên" },
    ];
  } else if (norm === "Ban Xúc tiến" || deptName.toLowerCase().includes("xúc tiến")) {
    roles = [
      { value: "truong_ban_xuc_tien", label: "Trưởng ban Xúc tiến", desc: "Lãnh đạo Ban Xúc tiến thương mại" },
      { value: "thanh_vien_ban_xuc_tien", label: "Thành viên Ban Xúc Tiến TM", desc: "Chuyên trách kết nối giao thương B2B" },
      { value: "member", label: "Thành viên", desc: "Học viên" },
    ];
  } else if (norm === "Ban Truyền thông" || deptName.toLowerCase().includes("truyền thông")) {
    roles = [
      { value: "truong_ban_truyen_thong", label: "Trưởng ban Truyền thông", desc: "Lãnh đạo Ban Truyền thông & thương hiệu" },
      { value: "thanh_vien_ban_truyen_thong", label: "Thành viên Ban Truyền Thông", desc: "Chuyên trách tin tức & hình ảnh sự kiện" },
      { value: "member", label: "Thành viên", desc: "Học viên" },
    ];
  } else if (norm === "Ban Tài chính" || deptName.toLowerCase().includes("tài chính")) {
    roles = [
      { value: "truong_ban_tai_chinh", label: "Trưởng ban Tài chính", desc: "Lãnh đạo Ban Tài chính & ngân sách" },
      { value: "thanh_vien_ban_tai_chinh", label: "Thành viên Ban Tài Chính", desc: "Chuyên trách thu chi & kế toán quỹ" },
      { value: "member", label: "Thành viên", desc: "Học viên" },
    ];
  } else if (norm === "Ban Thiện nguyện" || deptName.toLowerCase().includes("thiện nguyện")) {
    roles = [
      { value: "truong_ban_thien_nguyen", label: "Trưởng ban Thiện nguyện", desc: "Lãnh đạo Ban Hoạt động thiện nguyện" },
      { value: "thanh_vien_ban_thien_nguyen", label: "Thành viên Ban Thiện Nguyện", desc: "Chuyên trách hoạt động an sinh xã hội" },
      { value: "member", label: "Thành viên", desc: "Học viên" },
    ];
  } else if (matchedCustom) {
    const leaderKey = `truong_ban_${matchedCustom.code.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
    const leaderTitle = matchedCustom.headTitle || `Trưởng ${matchedCustom.name}`;
    roles = [
      { value: leaderKey, label: leaderTitle, desc: `Lãnh đạo ban ${matchedCustom.name}` },
      { value: "member", label: "Thành viên", desc: `Học viên ban ${matchedCustom.name}` },
    ];
  } else {
    roles = [
      { value: "member", label: "Học viên", desc: "Học viên chính thức (App CEO HN10)" },
    ];
  }

  // Ensure currentRole is preserved if already set
  if (currentRole && !roles.some((r) => r.value === currentRole)) {
    const matchingRoleDef = ROLE_OPTIONS.find((r) => r.value === currentRole);
    roles.unshift({
      value: currentRole,
      label: matchingRoleDef?.label || currentRole,
      desc: "Vai trò hiện tại của tài khoản",
    });
  }

  return roles;
}

export function handleUnauthorizedAction(featureName?: string, actionName?: string, redirectTarget?: string) {
  const feat = featureName ? `chức năng "${featureName}"` : "chức năng này";
  const act = actionName ? `thao tác "${actionName}"` : "thao tác này";
  const message = `Tài khoản của bạn đã bị thay đổi quyền không còn quyền sử dụng ${feat}, không còn quyền ${act}.`;

  if (typeof window !== "undefined") {
    import("sonner").then(({ toast }) => {
      toast.error(message, { duration: 6000 });
    });

    localStorage.removeItem("vibe_token");
    localStorage.removeItem("vibe_refresh_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    document.cookie = `sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

    const isAssociationApp = window.location.pathname.startsWith("/association") || window.location.pathname.startsWith("/m");
    const target = redirectTarget || (isAssociationApp ? "/association/login" : "/auth");

    setTimeout(() => {
      window.location.href = `${target}?reason=permission_revoked`;
    }, 1200);
  }
}

/**
 * Chuẩn hóa quyền cho 5 vai trò hệ thống dựa trên hành động
 */
export function normalizeActionRoles(action: {
  id?: string;
  code?: string;
  name?: string;
  roles?: Record<string, boolean>;
}): Record<string, boolean> {
  const current = action.roles || {};
  const code = (action.code || "").toUpperCase();
  const id = (action.id || "").toLowerCase();

  const isView = code.endsWith("_VIEW") || id.includes("_view");
  const isPublicMemberAction =
    isView ||
    code === "NET_CONNECT" ||
    code === "BCM_ADD" ||
    code === "BCM_VIEW" ||
    code === "MKT_ADD" ||
    code === "OPP_ADD" ||
    code === "TSK_ADD";

  const isFinance =
    code.startsWith("FEE_") ||
    code.startsWith("INC_") ||
    code.startsWith("EXP_") ||
    code.startsWith("FRP_");

  const isSecretary =
    code.startsWith("MEET_") ||
    code.startsWith("VOTE_") ||
    code.startsWith("DOC_") ||
    code.startsWith("EVT_") ||
    code.startsWith("EREG_") ||
    code.startsWith("CHK_") ||
    code.startsWith("NWS_") ||
    Boolean(current.thu_ky);

  const isLeader =
    Boolean(current.thanh_vien) ||
    Boolean(current.xuc_tien) ||
    Boolean(current.truyen_thong) ||
    Boolean(current.thien_nguyen) ||
    code.startsWith("EVT_") ||
    code.startsWith("MEET_") ||
    code.startsWith("SPN_") ||
    code.startsWith("NWS_") ||
    code.startsWith("MKT_") ||
    code.startsWith("OPP_") ||
    code.startsWith("TSK_");

  const res: Record<string, boolean> = {
    ...current,
    admin_platform: current.admin_platform ?? current.quan_tri ?? true,
    lop_truong: current.lop_truong ?? current.chu_tich ?? true,
    admin: current.admin ?? true,
    lop_pho: current.lop_pho ?? current.pho_chu_tich ?? true,
    truong_team: current.truong_team ?? (isLeader ? true : false),
    pho_team: current.pho_team ?? (isLeader ? true : false),
    truong_ban_chuyen_trach: current.truong_ban_chuyen_trach ?? (isLeader || isSecretary ? true : false),
    member: current.member ?? (isPublicMemberAction && !isFinance ? true : false),
    // Aliases
    quan_tri: current.quan_tri ?? current.admin_platform ?? true,
    chu_tich: current.chu_tich ?? current.lop_truong ?? true,
    pho_chu_tich: current.pho_chu_tich ?? current.lop_pho ?? true,
  };
  delete res.ban_thu_ky;
  delete res.truong_ban_quan_tri;
  delete res.bqt;
  return res;
}

/**
 * Kiểm tra quyền của một vai trò trên một action trong ma trận RBAC (hỗ trợ alias đa chiều theo ban)
 */
export function isActionAllowedForRole(
  actionRoles: Record<string, boolean> | undefined,
  roleKey: string
): boolean {
  if (!actionRoles) return false;

  // Nếu hành động này bị tắt toàn bộ (tất cả vai trò đều false), nghĩa là tính năng bị khóa/ẩn trong hệ thống
  const values = Object.values(actionRoles);
  const hasAnyTrue = values.some((v) => v === true);
  if (!hasAnyTrue) return false;

  if (actionRoles[roleKey] === true) return true;
  if (actionRoles[roleKey] === false) return false;

  // Quản trị viên tối cao & Lớp trưởng
  if (roleKey === "admin_platform" || roleKey === "quan_tri" || roleKey === "platform_admin") return true;
  if ((roleKey === "lop_truong" || roleKey === "chu_tich") && (actionRoles.lop_truong === true || actionRoles.chu_tich === true || actionRoles.admin_platform === true || actionRoles.admin === true)) return true;
  if (roleKey === "admin" && (actionRoles.admin === true || actionRoles.admin_platform === true)) return true;
  if ((roleKey === "lop_pho" || roleKey === "pho_chu_tich") && (actionRoles.lop_pho === true || actionRoles.pho_chu_tich === true || actionRoles.lop_truong === true)) return true;
  if (roleKey === "truong_team" && (actionRoles.truong_team === true || actionRoles.lop_pho === true)) return true;
  if (roleKey === "pho_team" && (actionRoles.pho_team === true || actionRoles.truong_team === true)) return true;
  if (roleKey === "truong_ban_chuyen_trach" && (actionRoles.truong_ban_chuyen_trach === true || actionRoles.lop_pho === true)) return true;

  // Ánh xạ thành viên ban & trưởng ban sang các key ban tương ứng trong ma trận
  if (roleKey === "thanh_vien_ban_su_kien" || roleKey === "truong_ban_su_kien") {
    return Boolean(actionRoles.su_kien || actionRoles.bsk || actionRoles.events || actionRoles.thu_ky || actionRoles.btk);
  }
  if (roleKey === "thanh_vien_ban_xuc_tien" || roleKey === "truong_ban_xuc_tien") {
    return Boolean(actionRoles.xuc_tien || actionRoles.bxt || actionRoles.trade);
  }
  if (roleKey === "thanh_vien_ban_thanh_vien" || roleKey === "truong_ban_thanh_vien") {
    return Boolean(actionRoles.thanh_vien || actionRoles.btv || actionRoles.members);
  }
  if (roleKey === "thanh_vien_ban_truyen_thong" || roleKey === "truong_ban_truyen_thong") {
    return Boolean(actionRoles.truyen_thong || actionRoles.btt || actionRoles.media);
  }
  if (roleKey === "thanh_vien_ban_tai_chinh" || roleKey === "truong_ban_tai_chinh") {
    return Boolean(actionRoles.tai_chinh || actionRoles.btc || actionRoles.finance);
  }
  if (roleKey === "thanh_vien_ban_thien_nguyen" || roleKey === "truong_ban_thien_nguyen") {
    return Boolean(actionRoles.thien_nguyen || actionRoles.btn || actionRoles.charity);
  }
  if (roleKey === "thanh_vien_ban_dieu_hanh" || roleKey === "truong_ban_dieu_hanh") {
    return Boolean(actionRoles.dieu_hanh || actionRoles.bqt || actionRoles.admin);
  }
  if (roleKey === "tong_thu_ky" || roleKey === "ban_thu_ky") {
    return Boolean(actionRoles.tong_thu_ky || actionRoles.thu_ky || actionRoles.btk);
  }
  if (roleKey === "member" || roleKey === "HVT") {
    return Boolean(actionRoles.member || actionRoles.hvt);
  }

  return Boolean(actionRoles[roleKey]);
}

export function getDynamicDepartmentOptions(): string[] {
  const custom = typeof window !== "undefined" ? getCustomDepartments() : INITIAL_DEPARTMENTS;
  const list = [
    "Ban Học tập",
    "Ban Sự kiện & Hậu cần",
    "Ban Tài chính & Tài trợ",
    "Ban Truyền thông",
    "Ban Công nghệ",
    "Ban Đối ngoại & Giao thương",
    "Ban Đời sống & Gắn kết thành viên",
  ];
  custom.forEach((c) => {
    if (!list.includes(c.name)) list.push(c.name);
  });
  if (!list.includes("Học viên ceohn10")) list.push("Học viên ceohn10");
  return list;
}

// ── BẢNG PHÂN QUYỀN THAO TÁC CỤ THỂ (GRANULAR PERMISSIONS) ─────────────────────
export interface GranularPermItem {
  key: string;
  name: string;
  desc: string;
}

export interface GranularPermCategory {
  category: string;
  items: GranularPermItem[];
}

export const GRANULAR_PERMISSION_CATEGORIES: GranularPermCategory[] = [
  {
    category: "1. Tổng quan & Trợ lý AI",
    items: [
      { key: "/", name: "Tổng quan Dashboard", desc: "Xem trang điều hành tổng quan hệ thống" },
      { key: "/ai-assistant", name: "Trợ lý AI Điều Hành", desc: "Sử dụng AI phân tích CRM và xuất hóa đơn điện tử" },
    ],
  },
  {
    category: "2. Quản lý Học viên",
    items: [
      { key: "/members", name: "Quản lý Học viên & Doanh nghiệp", desc: "Xem, thêm sửa và duyệt hồ sơ học viên" },
    ],
  },
  {
    category: "3. Quản lý Sự kiện & Khai giảng",
    items: [
      { key: "/events", name: "Quản lý Sự kiện & Khai giảng", desc: "Tạo và điều hành sự kiện" },
      { key: "/event-registrations", name: "Quản lý Người đăng ký vé", desc: "Quản lý danh sách đăng ký và vé sự kiện" },
      { key: "/event-checkin", name: "Cổng Check-in & Soát vé (Online/Offline)", desc: "Quét mã QR và soát vé sự kiện" },
      { key: "/checkin-qr", name: "Cấu hình Mã QR Sự kiện", desc: "Cấu hình mã QR đăng ký và check-in" },
      { key: "/lucky-draw", name: "Quản lý Quay thưởng", desc: "Tổ chức bốc thăm trúng thưởng" },
      { key: "/voting", name: "Biểu quyết & Đánh giá ý kiến", desc: "Tạo và thu thập ý kiến biểu quyết" },
      { key: "/feedback", name: "Phản hồi & Góp ý", desc: "Khảo sát và phản hồi sau sự kiện" },
    ],
  },
  {
    category: "4. Phân hệ Lớp học CEO HN10",
    items: [
      { key: "/classes?tab=courses", name: "Quản lý Lớp & Lịch học 30 buổi", desc: "Xem và quản lý các chuyên đề học thứ 7" },
      { key: "/classes?tab=teachers", name: "Quản lý Giảng viên & Chuyên gia", desc: "Quản lý danh sách giảng viên" },
      { key: "/classes?tab=students", name: "Dashboard Học viên (Đa chỉ số)", desc: "Quản lý điểm danh, quỹ phạt, tín nhiệm" },
      { key: "/classes?tab=finance", name: "Quỹ Tài Chính Lớp (20tr & Thu/Chi)", desc: "Quản lý quỹ lớp khởi tạo 20tr và các nguồn thu chi" },
      { key: "/classes?tab=attendance-qr", name: "Mã QR Điểm danh theo buổi", desc: "Chiếu và quản lý mã QR điểm danh" },
    ],
  },
  {
    category: "5. Tài chính & Ngân sách",
    items: [
      { key: "/finance-report", name: "Báo cáo Tài chính Tổng CLB", desc: "Xem báo cáo thu chi ngân sách toàn CLB" },
    ],
  },
  {
    category: "6. Thông báo & Truyền thông",
    items: [
      { key: "/notifications", name: "Thông báo Zalo OA / ZBS", desc: "Tạo và gửi thông báo qua Zalo OA" },
      { key: "/email-marketing", name: "Thông báo đến Email", desc: "Gửi email marketing cho học viên" },
    ],
  },
  {
    category: "7. Quản trị & Cài đặt hệ thống",
    items: [
      { key: "/documents", name: "Quản lý Tài liệu & Học liệu", desc: "Quản lý tài liệu lớp học và hiệp hội" },
      { key: "/accounts", name: "Quản trị Người dùng & Phân quyền", desc: "Thêm mới và gán quyền tài khoản" },
      { key: "/permissions", name: "Ma Trận Phân Quyền RBAC", desc: "Cấu hình phân quyền hệ thống" },
      { key: "/settings", name: "Cài đặt Cấu hình SePay / Zalo OA", desc: "Cấu hình tích hợp thanh toán và Zalo" },
    ],
  },
];

export function getDefaultPermissionsForRole(role: string): string[] {
  const allRoutes = GRANULAR_PERMISSION_CATEGORIES.flatMap((c) => c.items.map((i) => i.key));

  if (role === "admin" || role === "quan_tri" || role === "ADM") {
    return allRoutes;
  }
  if (role === "chu_tich" || role === "president") {
    // Lớp Trưởng Lâm Thời: Quyền điều hành tối cao toàn lớp và sự kiện
    return allRoutes.filter((r) => r !== "/settings" && r !== "/permissions");
  }
  if (role === "pho_chu_tich" || role === "lop_pho_hoc_tap") {
    return [
      "/",
      "/ai-assistant",
      "/classes?tab=courses",
      "/classes?tab=teachers",
      "/classes?tab=students",
      "/classes?tab=attendance-qr",
      "/documents",
    ];
  }
  if (role === "lop_pho_tai_chinh" || role === "truong_ban_tai_chinh") {
    return [
      "/",
      "/classes?tab=courses",
      "/classes?tab=students",
      "/classes?tab=finance",
      "/finance-report",
      "/documents",
    ];
  }
  if (role === "lop_pho_su_kien" || role === "truong_ban_su_kien") {
    return [
      "/",
      "/events",
      "/event-registrations",
      "/event-checkin",
      "/checkin-qr",
      "/lucky-draw",
      "/voting",
      "/feedback",
      "/classes?tab=courses",
      "/classes?tab=students",
    ];
  }
  if (role === "lop_pho_truyen_thong" || role === "truong_ban_truyen_thong") {
    return [
      "/",
      "/classes?tab=courses",
      "/classes?tab=students",
      "/notifications",
      "/email-marketing",
      "/documents",
    ];
  }
  if (role === "giang_vien" || role === "instructor") {
    return [
      "/",
      "/classes?tab=courses",
      "/classes?tab=teachers",
      "/classes?tab=attendance-qr",
      "/documents",
    ];
  }
  if (role.startsWith("truong_ban_")) {
    return [
      "/",
      "/members",
      "/classes?tab=courses",
      "/classes?tab=students",
      "/documents",
    ];
  }
  // Học viên mặc định
  return [
    "/",
    "/classes?tab=courses",
    "/classes?tab=students",
    "/documents",
  ];
}

/**
 * Kiểm tra 1 route có được phép hiển thị trên Sidebar/CRM theo ma trận phân quyền RBAC CSDL hay không
 */
export function isRouteAllowedByMatrix(route: string, roleKey: SystemRoleKey, user?: any): boolean {
  // Làm sạch route (bỏ query parameters & hash fragment: ví dụ /permissions?tab=matrix -> /permissions)
  const cleanRoute = (route || "").split("?")[0].split("#")[0];

  // Trang Tổng quan luôn mở cho toàn bộ tài khoản đăng nhập
  if (cleanRoute === "/") {
    return true;
  }

  // 1. Phân hệ Phân Quyền & Quản Trị Người Dùng (/accounts & /permissions):
  // Yêu cầu bắt buộc: "phân quyền phải đưa vào màn quản trị platform crm không đưa vào màn crm hệ thống thường ceohn10"
  // Do đó, trên Sidebar CRM thường, 2 route này KHÔNG xuất hiện (chỉ nằm trong Cổng Quản Trị Nền Tảng /master)
  if (cleanRoute === "/accounts" || cleanRoute === "/permissions") {
    return false;
  }

  // ĐẶC QUYỀN QUẢN TRỊ TỐI CAO (PLATFORM ADMIN / ADMIN / LỚP TRƯỞNG / BAN ĐIỀU HÀNH / TRƯỞNG BAN)
  // Đảm bảo các tài khoản quản trị và điều hành luôn luôn thấy đầy đủ toàn bộ các chức năng của CEO HN10
  const isTopAdmin =
    (roleKey as string) === "quan_tri" ||
    (roleKey as string) === "admin" ||
    (roleKey as string) === "chu_tich" ||
    (roleKey as string) === "pho_chu_tich" ||
    String(roleKey).startsWith("lop_pho_") ||
    String(roleKey).startsWith("truong_team_") ||
    String(roleKey).startsWith("pho_team_") ||
    String(roleKey).startsWith("tb_") ||
    String(roleKey).startsWith("truong_ban_") ||
    (roleKey as string) === "tong_thu_ky" ||
    (roleKey as string) === "ban_dieu_hanh" ||
    (roleKey as string) === "truong_ban_dieu_hanh" ||
    user?.isPlatformAdmin === true ||
    user?.isAdmin === true ||
    user?.isPresident === true ||
    user?.role === "admin" ||
    user?.role === "quan_tri" ||
    user?.role === "ADM" ||
    user?.role === "chu_tich" ||
    user?.role === "president" ||
    user?.role === "lop_truong" ||
    user?.role === "pho_chu_tich" ||
    String(user?.role).startsWith("lop_pho_") ||
    String(user?.role).startsWith("truong_ban_") ||
    user?.email === "admin@ceohn10.vn" ||
    user?.email === "admin@viconnect.vn" ||
    user?.email === "infor@viconnect.vn" ||
    user?.email === "admin.hn10@ceohn10.vn" ||
    user?.email === "loptruong.hn10@ceohn10.vn" ||
    user?.email === "btt.hn10@ceohn10.vn" ||
    user?.email === "btc.hn10@ceohn10.vn" ||
    user?.email?.toLowerCase().includes("admin") ||
    user?.email?.toLowerCase().includes("loptruong");

  if (isTopAdmin) {
    // Nếu là module lớp học, tôn trọng cấu hình tenant (chỉ ẩn trên tenant không bật classes)
    if (cleanRoute === "/classes" || cleanRoute.startsWith("/classes")) {
      return isModuleEnabledForTenant("classes");
    }
    return true;
  }

  // 2. Phân hệ Lớp Học Doanh Trí: Kiểm tra module "classes" cho hệ thống hiện tại
  if (cleanRoute === "/classes" || cleanRoute.startsWith("/classes")) {
    return isModuleEnabledForTenant("classes");
  }

  // 3. Phân hệ Tài Chính: Kiểm tra module "finance"
  if (cleanRoute === "/finance-report" || cleanRoute.startsWith("/finance")) {
    return isModuleEnabledForTenant("finance");
  }

  // 0. Luồng tùy biến: Kiểm tra customPermissions cụ thể của tài khoản (nếu được admin tích chọn khi tạo tài khoản)
  if (user?.customPermissions && Array.isArray(user.customPermissions) && user.customPermissions.length > 0) {
    if (user.customPermissions.includes(route) || user.customPermissions.includes(cleanRoute)) {
      return true;
    }
    const hasMatch = user.customPermissions.some(
      (p: string) => (p !== "/" && cleanRoute.startsWith(p.split("?")[0])) || (p !== "/" && p.startsWith(cleanRoute))
    );
    if (hasMatch) return true;
    return false;
  }

  // 1. Luồng chuẩn API: Ưu tiên kiểm tra trực tiếp allowedRoutes do Backend tính từ CSDL
  if (user?.allowedRoutes && Array.isArray(user.allowedRoutes) && user.allowedRoutes.length > 0) {
    if (user.allowedRoutes.includes(cleanRoute)) {
      return true;
    }
    const hasPrefixMatch = user.allowedRoutes.some(
      (r: string) => r !== "/" && (cleanRoute.startsWith(r) || r.startsWith(cleanRoute))
    );
    if (hasPrefixMatch) {
      return true;
    }
    // Nếu Backend đã trả allowedRoutes nhưng không có route này -> không được phép
    return false;
  }

  // 2. Kiểm tra permissionsHash do Backend tính từ CSDL
  if (user?.permissionsHash && typeof user.permissionsHash === "object") {
    if (user.permissionsHash[cleanRoute] !== undefined) {
      return Boolean(user.permissionsHash[cleanRoute]);
    }
  }

  const sRole = String(roleKey);

  // Bảo vệ khẩn cấp: Chỉ mở quyền quản trị tối cao đối với các phân hệ phân quyền và cài đặt để tránh admin tự khóa mình khỏi hệ thống
  const isEmergencyAdminRoute =
    cleanRoute.startsWith("/permissions") ||
    cleanRoute.startsWith("/settings") ||
    cleanRoute.startsWith("/accounts") ||
    cleanRoute.startsWith("/departments");

  // 3. Kiểm tra quyền riêng của tài khoản hiện tại từ vba_member_permissions nếu có
  if (typeof window !== "undefined") {
    try {
      const rawUserPerms = localStorage.getItem("vba_member_permissions");
      const rawMyMem = localStorage.getItem("vba_my_member");
      if (rawUserPerms && rawMyMem) {
        const myMem = JSON.parse(rawMyMem);
        const mCode = myMem?.code;
        if (mCode) {
          const userMap = JSON.parse(rawUserPerms);
          const userProfile = userMap[mCode] || userMap[mCode.toUpperCase()] || userMap[mCode.toLowerCase()];
          if (userProfile) {
            if (userProfile.canView === false) return false;
            if (cleanRoute === "/events" && userProfile.canManageEvents === false) return false;
            if ((cleanRoute === "/finance" || cleanRoute === "/renewal") && userProfile.canManageFinance === false) return false;
            if (cleanRoute === "/news" && userProfile.canManageNews === false) return false;
          }
        }
      }
    } catch { }

    // 4. Tra cứu trực tiếp theo Ma Trận Phân Quyền CSDL (RBAC Matrix) đồng bộ từ DB về localStorage
    try {
      const raw = localStorage.getItem(RBAC_MATRIX_STORAGE_KEY);
      if (raw) {
        const categories = JSON.parse(raw);
        if (Array.isArray(categories) && categories.length > 0) {
          for (const cat of categories) {
            if (!cat?.features || !Array.isArray(cat.features)) continue;
            for (const feat of cat.features) {
              if (!feat?.route) continue;
              const featCleanRoute = String(feat.route).split("?")[0].split("#")[0];
              const isMatch =
                featCleanRoute === cleanRoute ||
                (cleanRoute !== "/" && featCleanRoute.startsWith(cleanRoute)) ||
                (featCleanRoute !== "/" && cleanRoute.startsWith(featCleanRoute)) ||
                ((featCleanRoute === "/accounts" || featCleanRoute === "/account-settings") &&
                  (cleanRoute === "/accounts" || cleanRoute === "/account-settings"));

              if (isMatch) {
                // Nếu tính năng bị tắt trong ma trận (enabled === false): Tắt cho toàn bộ vai trò
                if (feat.enabled === false) {
                  return false;
                }

                if (!feat.actions || !Array.isArray(feat.actions) || feat.actions.length === 0) {
                  return true;
                }

                const viewAction = feat.actions.find(
                  (a: any) =>
                    (a.code && (a.code.toUpperCase().endsWith("_VIEW") || a.code.toUpperCase().endsWith("_READ"))) ||
                    (a.id && (a.id.toLowerCase().includes("_view") || a.id.toLowerCase().includes("_read")))
                );

                if (viewAction) {
                  if (viewAction.enabled === false) return false;
                  if (viewAction.roles) {
                    return isActionAllowedForRole(viewAction.roles, roleKey);
                  }
                }

                return feat.actions.some((a: any) => a.enabled !== false && isActionAllowedForRole(a?.roles, roleKey));
              }
            }
          }
        }
      }
    } catch { }
  }

  // 5. Các route quản trị hệ thống nhạy cảm (Cấm đối với thành viên thường)
  const isSystemAdminOnlyRoute =
    cleanRoute.startsWith("/permissions") ||
    cleanRoute.startsWith("/departments") ||
    cleanRoute.startsWith("/settings") ||
    cleanRoute.startsWith("/activity") ||
    cleanRoute.startsWith("/admin") ||
    cleanRoute.startsWith("/accounts") ||
    cleanRoute.startsWith("/account-settings");

  if (isSystemAdminOnlyRoute) {
    return (
      sRole === "quan_tri" ||
      sRole === "admin" ||
      sRole === "chu_tich" ||
      sRole === "president" ||
      sRole === "platform_admin" ||
      sRole === "truong_ban_dieu_hanh" ||
      sRole === "tong_thu_ky"
    );
  }

  // Mẫu thư mời / Templates: Ban Truyền thông, Sự kiện, Thư ký và Quản trị
  if (cleanRoute.startsWith("/templates")) {
    return (
      sRole === "quan_tri" ||
      sRole === "admin" ||
      sRole === "chu_tich" ||
      sRole === "president" ||
      sRole === "platform_admin" ||
      sRole === "tong_thu_ky" ||
      sRole === "ban_thu_ky" ||
      sRole === "truong_ban_truyen_thong" ||
      sRole === "thanh_vien_ban_truyen_thong" ||
      sRole === "truong_ban_su_kien" ||
      sRole === "thanh_vien_ban_su_kien" ||
      sRole === "BTT"
    );
  }

  // Quản trị viên cấp cao có quyền xem các phân hệ chung
  if (
    sRole === "quan_tri" ||
    sRole === "admin" ||
    sRole === "chu_tich" ||
    sRole === "president" ||
    (roleKey as string) === "platform_admin"
  ) {
    return true;
  }

  // 5. Quyền hiển thị cơ bản cho thành viên
  if (
    cleanRoute === "/members" ||
    cleanRoute === "/events" ||
    cleanRoute === "/events-overview" ||
    cleanRoute === "/voting" ||
    cleanRoute === "/feedback" ||
    cleanRoute === "/event-registrations" ||
    cleanRoute === "/checkin-qr" ||
    cleanRoute === "/templates" ||
    cleanRoute === "/lucky-draw" ||
    cleanRoute === "/classes" ||
    cleanRoute === "/sponsors" ||
    cleanRoute === "/sponsor-report" ||
    cleanRoute === "/analytics" ||
    cleanRoute === "/income" ||
    cleanRoute === "/expenses" ||
    cleanRoute === "/finance-report" ||
    cleanRoute === "/notifications" ||
    cleanRoute === "/email-marketing" ||
    cleanRoute === "/meetings" ||
    cleanRoute === "/documents" ||
    cleanRoute === "/ai-assistant"
  ) {
    return true;
  }

  // 6. Quyền truy cập Master Admin (chỉ admin / chủ tịch / platform admin)
  if (cleanRoute === "/master") {
    return (
      (roleKey as string) === "quan_tri" ||
      (roleKey as string) === "admin" ||
      (roleKey as string) === "chu_tich" ||
      (roleKey as string) === "platform_admin" ||
      user?.email === "admin@ceohn10.vn"
    );
  }

  return false;
}

export const PERMISSION_TO_MATRIX_CODES: Record<string, string[]> = {
  "event:view": ["EVT_VIEW", "act_evt_view"],
  "event:create": ["EVT_ADD", "act_evt_add"],
  "event:edit": ["EVT_EDIT", "act_evt_edit"],
  "event:delete": ["EVT_DELETE", "act_evt_delete"],
  "event:cancel": ["EVT_CANCEL", "act_evt_cancel"],
  "event:checkin_manage": ["CHK_SCAN", "CHK_VIEW", "act_chk_scan", "CHKQ_VIEW"],
  "sponsor:view": ["SPN_VIEW", "act_spn_view", "SPK_VIEW"],
  "sponsor:create": ["SPN_ADD", "act_spn_add"],
  "sponsor:edit": ["SPN_EDIT", "act_spn_edit"],
  "sponsor:delete": ["SPN_DELETE", "act_spn_delete"],
  "sponsor:package_manage": ["SPK_ADD", "SPK_EDIT", "SPK_DELETE"],
  "sponsor:assign_event": ["SPN_APPROVE"],
  "member:view": ["MEM_VIEW", "act_mem_view", "COM_VIEW"],
  "member:create": ["MEM_ADD", "act_mem_add", "COM_ADD"],
  "member:edit": ["MEM_EDIT", "act_mem_edit", "COM_EDIT"],
  "member:delete": ["MEM_DELETE", "act_mem_delete", "COM_DELETE"],
  "member:approve": ["MEM_APPROVE", "act_mem_approve", "COM_APPROVE"],
  "member:renew": ["FEE_ADD", "MEM_EDIT", "REN_PROCESS"],
  "opportunity:view": ["OPP_VIEW", "MKT_VIEW", "BCM_VIEW"],
  "opportunity:manage": ["OPP_ADD", "OPP_EDIT", "OPP_DELETE", "OPP_APPROVE", "MKT_ADD", "MKT_EDIT", "BCM_ADD"],
  "marketplace:manage": ["MKT_ADD", "MKT_EDIT", "MKT_DELETE"],
  "charity:view": ["CHA_VIEW"],
  "charity:manage": ["CHA_ADD", "CHA_EDIT", "CHA_DELETE", "CHA_APPROVE"],
  "meeting:view": ["MEET_VIEW", "BCM_VIEW"],
  "meeting:manage": ["MEET_ADD", "MEET_EDIT", "MEET_DELETE", "MEET_APPROVE", "BCM_ADD", "BCM_EDIT", "BCM_DELETE"],
  "document:manage": ["DOC_VIEW", "DOC_ADD", "DOC_EDIT", "DOC_DELETE"],
  "finance:view": ["FEE_VIEW", "INC_VIEW", "EXP_VIEW", "FRP_VIEW"],
  "finance:manage": ["FEE_ADD", "FEE_EDIT", "FEE_DELETE", "INC_ADD", "INC_EDIT", "EXP_ADD", "EXP_EDIT"],
  "finance:approve": ["EXP_APPROVE", "FEE_RECONCILE"],
  "media:view": ["NTF_VIEW", "EML_VIEW", "NWS_VIEW"],
  "media:manage": ["NTF_SEND", "NTF_EDIT", "EML_ADD", "EML_SEND", "NWS_ADD", "NWS_EDIT"],
  "system:manage": ["PRM_EDIT", "SET_EDIT", "CRD_ADD", "CRD_EDIT", "CRD_DELETE"],
  "system:audit_view": ["ACT_VIEW", "ACT_EXPORT"],

  // Mã định danh thao tác con trực tiếp (Direct Action Codes)
  MEM_EXPORT: ["MEM_EXPORT", "act_mem_export"],
  COM_EXPORT: ["COM_EXPORT", "act_com_export"],
  COM_VIEW: ["COM_VIEW", "act_com_view"],
  COM_ADD: ["COM_ADD", "act_com_add"],
  COM_EDIT: ["COM_EDIT", "act_com_edit"],
  COM_DELETE: ["COM_DELETE", "act_com_delete"],
  FEE_VIEW: ["FEE_VIEW", "act_fee_view"],
  FEE_ADD: ["FEE_ADD", "act_fee_add"],
  FEE_EDIT: ["FEE_EDIT", "act_fee_edit"],
  FEE_DELETE: ["FEE_DELETE", "act_fee_delete"],
  FEE_RECONCILE: ["FEE_RECONCILE", "act_fee_reconcile"],
  EVT_EXPORT: ["EVTO_EXPORT", "act_evto_export", "EVT_EXPORT"],
  EVTO_EXPORT: ["EVTO_EXPORT", "act_evto_export"],
  CHK_SCAN: ["CHK_SCAN", "act_chk_scan"],
  MEET_ADD: ["MEET_ADD", "act_meet_add"],
  MEET_APPROVE: ["MEET_APPROVE", "act_meet_approve"],
  MEET_EDIT: ["MEET_EDIT", "act_meet_edit"],
  MEET_DELETE: ["MEET_DELETE", "act_meet_delete"],
  PRM_EDIT: ["PRM_EDIT", "act_prm_edit"],
};

export const COMMITTEE_PERMISSIONS_STORAGE_KEY = "ceohn10_committee_permissions_v2";

export function normalizeCommitteeKey(dept?: string): string {
  if (!dept) return "thanh_vien";
  const s = dept.toLowerCase().trim();
  if (s.includes("quản trị") || s.includes("bqt") || s.includes("điều hành") || s === "dieu_hanh") return "dieu_hanh";
  if (s.includes("thư ký") || s.includes("btk") || s.includes("tong_thu_ky") || s === "thu_ky") return "thu_ky";
  if (s.includes("tài chính") || s.includes("btc") || s === "tai_chinh") return "tai_chinh";
  if (s.includes("thành viên") || s.includes("btv") || s === "thanh_vien") return "thanh_vien";
  if (s.includes("xúc tiến") || s.includes("bxt") || s.includes("thương mại") || s === "xuc_tien") return "xuc_tien";
  if (s.includes("truyền thông") || s.includes("btt") || s === "truyen_thong") return "truyen_thong";
  if (s.includes("thiện nguyện") || s.includes("btn") || s.includes("an sinh") || s === "thien_nguyen") return "thien_nguyen";
  return "thanh_vien";
}

export function dispatchPermissionSyncEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("role-changed"));
    window.dispatchEvent(new Event("crm_permissions_updated"));
    window.dispatchEvent(new Event("vba_member_permissions_updated"));
    try {
      localStorage.setItem("ceohn10_perm_sync_ping", String(Date.now()));
      localStorage.setItem("vba_permission_last_updated", String(Date.now()));
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("vba_permission_sync");
        bc.postMessage({
          type: "PERMISSION_CHANGED",
          message:
            "Quyền hạn tài khoản của bạn vừa được Quản trị viên cập nhật. Hệ thống sẽ tải lại trang để áp dụng phân quyền mới.",
        });
        bc.close();
      }
    } catch { }
  }
}

/**
 * Kiểm tra xem một hành động / Permission có được cấp phép theo Ma Trận Phân Quyền (lưu trong CSDL / localStorage) hay không
 * Nếu người quản trị đã BỎ TÍCH trong ma trận và lưu, hàm này trả về FALSE để ẩn ngay các nút/thao tác trên giao diện.
 */
export function isActionAllowedByMatrix(
  actionOrPerm: string,
  roleKey?: string,
  committeeKeyOrDept?: string,
  memberCode?: string
): boolean {
  if (typeof window === "undefined") return true;

  try {
    // 1. Kiểm tra ghi đè trực tiếp của tài khoản Học viên từ vba_member_permissions nếu có (ưu tiên hàng đầu)
    if (memberCode) {
      const rawUserPerms = localStorage.getItem("vba_member_permissions");
      if (rawUserPerms) {
        const userMap = JSON.parse(rawUserPerms);
        const userProfile = userMap[memberCode] || userMap[memberCode.toUpperCase()] || userMap[memberCode.toLowerCase()];
        if (userProfile) {
          // Bị khóa chức năng cấp cao & thao tác cốt lõi
          if (userProfile.canView === false && (actionOrPerm.includes(":view") || actionOrPerm.endsWith("_VIEW") || actionOrPerm.endsWith(":read"))) {
            return false;
          }
          if (userProfile.canAdd === false && (actionOrPerm.includes(":create") || actionOrPerm.includes(":add") || actionOrPerm.endsWith("_ADD"))) {
            return false;
          }
          if (userProfile.canEdit === false && (actionOrPerm.includes(":edit") || actionOrPerm.includes(":update") || actionOrPerm.endsWith("_EDIT"))) {
            return false;
          }
          if (userProfile.canDelete === false && (actionOrPerm.includes(":delete") || actionOrPerm.endsWith("_DELETE"))) {
            return false;
          }
          if (userProfile.canApprove === false && (actionOrPerm.includes(":approve") || actionOrPerm.endsWith("_APPROVE"))) {
            return false;
          }
          if (actionOrPerm.startsWith("member:") && userProfile.canManageMembers === false && actionOrPerm !== "member:view") {
            return false;
          }
          if (actionOrPerm.startsWith("event:") && userProfile.canManageEvents === false && actionOrPerm !== "event:view") {
            return false;
          }
          if (actionOrPerm.startsWith("media:") && userProfile.canManageNews === false && actionOrPerm !== "media:view") {
            return false;
          }
          if ((actionOrPerm.startsWith("opportunity:") || actionOrPerm.startsWith("marketplace:")) && userProfile.canManageMarketplace === false && !actionOrPerm.endsWith(":view")) {
            return false;
          }
          if (userProfile.deniedCodes && Array.isArray(userProfile.deniedCodes)) {
            const denied = userProfile.deniedCodes.map((c: string) => c.toUpperCase());
            if (denied.includes(actionOrPerm.toUpperCase())) return false;
          }
        }
      }
    }

    // 2. Toàn quyền cho Quản trị viên cấp cao nhất (Super Admin gốc quan_tri)
    const normRole = (roleKey || "").toLowerCase().trim();
    if (
      normRole === "quan_tri" ||
      normRole === "platform_admin" ||
      normRole === "superadmin"
    ) {
      return true;
    }

    const raw = localStorage.getItem(RBAC_MATRIX_STORAGE_KEY);
    if (!raw) return true; // Chưa tùy biến thì giữ quyền mặc định

    const categories = JSON.parse(raw);
    if (!Array.isArray(categories)) return true;

    // Chuẩn hóa roleKey sang key trong ma trận (vai trò hệ thống)
    const targetNormRole = (roleKey || "member").toLowerCase().trim();
    let targetRole: SystemRoleKey = "member";
    if (targetNormRole === "admin_platform" || targetNormRole === "quan_tri" || targetNormRole === "adm" || targetNormRole === "platform_admin" || targetNormRole === "superadmin" || targetNormRole.includes("quản trị")) {
      targetRole = "admin_platform";
    } else if (targetNormRole === "lop_truong" || targetNormRole.includes("lớp trưởng") || targetNormRole.includes("chủ tịch") || targetNormRole === "chu_tich" || targetNormRole === "president") {
      targetRole = "lop_truong";
    } else if (targetNormRole === "lop_pho" || targetNormRole.includes("lớp phó") || targetNormRole === "pho_chu_tich" || targetNormRole.startsWith("lop_pho_")) {
      targetRole = "lop_pho";
    } else if (targetNormRole === "truong_team" || targetNormRole.includes("trưởng team") || targetNormRole.startsWith("truong_team_")) {
      targetRole = "truong_team";
    } else if (targetNormRole === "pho_team" || targetNormRole.includes("phó team") || targetNormRole.startsWith("pho_team_")) {
      targetRole = "pho_team";
    } else if (targetNormRole === "admin" || targetNormRole === "bqt") {
      targetRole = "admin";
    } else if (
      targetNormRole === "truong_ban_chuyen_trach" ||
      targetNormRole.includes("trưởng ban") ||
      targetNormRole.includes("truong ban") ||
      targetNormRole === "truong_ban_truyen_thong" || targetNormRole === "btt" ||
      targetNormRole === "truong_ban_thanh_vien" || targetNormRole === "btv" ||
      targetNormRole === "truong_ban_xuc_tien" || targetNormRole === "bxt" ||
      targetNormRole === "truong_ban_tai_chinh" || targetNormRole === "btc" ||
      targetNormRole === "truong_ban_thien_nguyen" || targetNormRole === "btn" ||
      targetNormRole === "tong_thu_ky" || targetNormRole === "ban_thu_ky" ||
      targetNormRole.startsWith("tb_")
    ) {
      targetRole = "truong_ban_chuyen_trach";
    }

    // Chuẩn hóa ban chuyên môn nếu có
    const committeeKey = committeeKeyOrDept ? normalizeCommitteeKey(committeeKeyOrDept) : null;

    // Lấy danh sách các mã thao tác tương ứng
    const codesToCheck = PERMISSION_TO_MATRIX_CODES[actionOrPerm] || [actionOrPerm.toUpperCase(), actionOrPerm.toLowerCase()];

    for (const cat of categories) {
      if (!cat?.features || !Array.isArray(cat.features)) continue;
      for (const feat of cat.features) {
        if (!feat?.actions || !Array.isArray(feat.actions)) continue;
        for (const act of feat.actions) {
          const actCode = (act.code || "").toUpperCase();
          const actId = (act.id || "").toLowerCase();

          const isMatch = codesToCheck.some(
            (c) => c.toUpperCase() === actCode || c.toLowerCase() === actId
          );

          if (isMatch && act.roles) {
            // A. Kiểm tra theo Ban chuyên môn của tài khoản
            if (committeeKey && act.roles[committeeKey] !== undefined) {
              if (act.roles[committeeKey] === false) {
                // Nếu Ban bị bỏ tích quyền này, lập tức khóa
                return false;
              }
            }

            // B. Kiểm tra theo Vai trò hệ thống
            if (act.roles[targetRole] !== undefined) {
              if (act.roles[targetRole] === false) {
                // Nếu vai trò bị bỏ tích quyền này, lập tức khóa (kể cả admin/quan_tri)
                return false;
              }
            }

            // C. Kiểm tra roleKey thô
            if (act.roles[normRole] !== undefined) {
              if (act.roles[normRole] === false) return false;
            }

            // D. Nếu cả ban hoặc vai trò có quyền true
            if (
              act.roles[targetRole] === true ||
              (committeeKey && act.roles[committeeKey] === true) ||
              (targetRole === "admin_platform" && act.roles["admin_platform"] !== false) ||
              ((targetRole as string) === "quan_tri" && act.roles["quan_tri"] !== false)
            ) {
              return true;
            }

            // E. Nếu thao tác này đã nằm trong ma trận nhưng vai trò không được cấp quyền
            return false;
          }
        }
      }
    }
  } catch {
    return true;
  }

  // Quản trị viên cấp cao mặc định được phép nếu không bị bỏ tích cụ thể
  if (roleKey === "quan_tri" || roleKey === "ADM" || roleKey === "platform_admin") {
    return true;
  }

  return true;
}

/**
 * Kiểm tra xem người dùng hiện tại có mã quyền cụ thể trong session không
 * Dựa trên mảng permissions[] được cấp từ backend NestJS và JWT
 */
export function hasPermission(
  user: { permissions?: string[]; permissionsHash?: Record<string, boolean>; isAdmin?: boolean; role?: string } | null | undefined,
  permission: string
): boolean {
  if (!user) return false;

  // 1. Kiểm tra nhanh O(1) qua bảng băm permissionsHash do Backend tính từ CSDL
  if (user.permissionsHash && typeof user.permissionsHash === 'object') {
    if (user.permissionsHash[permission] !== undefined) {
      return Boolean(user.permissionsHash[permission]);
    }
    // Kiểm tra các biến thể CRUD chuẩn: create <-> add, update <-> edit, read <-> view
    const permLower = permission.toLowerCase();
    if (permLower.includes(':create')) {
      const addVariant = permLower.replace(':create', ':add');
      if (user.permissionsHash[addVariant] !== undefined) return Boolean(user.permissionsHash[addVariant]);
    } else if (permLower.includes(':add')) {
      const createVariant = permLower.replace(':add', ':create');
      if (user.permissionsHash[createVariant] !== undefined) return Boolean(user.permissionsHash[createVariant]);
    }
    if (permLower.includes(':update')) {
      const editVariant = permLower.replace(':update', ':edit');
      if (user.permissionsHash[editVariant] !== undefined) return Boolean(user.permissionsHash[editVariant]);
    } else if (permLower.includes(':edit')) {
      const updateVariant = permLower.replace(':edit', ':update');
      if (user.permissionsHash[updateVariant] !== undefined) return Boolean(user.permissionsHash[updateVariant]);
    }
  }

  if (user.isAdmin || user.role === 'admin' || user.role === 'quan_tri' || user.role === 'chu_tich' || user.role === 'president') {
    return true;
  }
  if (!Array.isArray(user.permissions)) return false;
  if (user.permissions.includes('admin:full_access') || user.permissions.includes('*')) {
    return true;
  }
  return user.permissions.includes(permission);
}



