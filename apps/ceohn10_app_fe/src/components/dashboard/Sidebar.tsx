import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { isRouteAllowedByMatrix, type SystemRoleKey } from "@/lib/rbac-permission-helpers";
import { useAuth } from "@/context/AuthContext";
import { isPrivilegedAdminOrPresident, isMediaDepartmentMember } from "@/lib/checkin-gatekeeper-auth";
import { useT } from "@/lib/i18n";
import { useRole } from "@/hooks/use-role";
import { useSidebarLabels } from "@/hooks/use-sidebar-labels";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useServerData } from "@/hooks/use-server-data";
import { listMyAssociationsFn, type MyAssociation } from "@/lib/associations.functions";
import { useUnreadNotifications, markNotificationsSeen } from "@/hooks/use-unread-notifications";
import { resolveMediaUrl } from "@/lib/api-client";
import {
  LayoutDashboard,
  Users,
  Building2,
  Tags,
  RefreshCw,
  Calendar,
  ClipboardList,
  CheckSquare,
  ScanLine,
  QrCode as QrCodeIcon,
  Handshake,
  Package,
  FileBarChart,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  PieChart,
  Bell,
  Mail,
  Newspaper,
  Gift,
  Award,
  Vote,
  Users2,
  FolderOpen,
  Settings,
  History,
  Activity,
  Sparkles,
  MessageSquare,
  Store,
  IdCard,
  Bookmark,
  ShieldCheck,
  UserCog,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Contrast,
  ChevronUp,
  ChevronDown,
  LayoutTemplate,
  Palette,
  BarChart3,
  GraduationCap,
  Globe,
  ExternalLink,
} from "lucide-react";
import type { TKey } from "@/lib/i18n";
import type { LucideIcon } from "lucide-react";

type SubItem = { to: string; label: string; icon?: LucideIcon };
type Item = { key: TKey; icon: LucideIcon; to?: string; label?: string; children?: SubItem[] };

// 1. Menu Top-level: Tổng quan, Trợ lý AI, Học viên, Lớp học & Khóa học
const overview: Item[] = [
  { key: "nav.dashboard", icon: LayoutDashboard, to: "/", label: "Tổng quan" },
  { key: "nav.aiAssistant" as TKey, icon: Sparkles, to: "/ai-assistant", label: "Trợ lý AI" },
  { key: "nav.members", icon: Users, to: "/members", label: "Học viên" },
  { key: "nav.trainings" as TKey, icon: GraduationCap, to: "/trainings", label: "Lớp học & Khóa học" },
];

// 2. Nhóm TRUYỀN THÔNG (Sự kiện)
const events: Item[] = [
  { key: "nav.events", icon: Calendar, to: "/events", label: "Sự kiện" },
  { key: "eventsOverview.title" as TKey, icon: LayoutTemplate, to: "/events-overview", label: "Tổng quan sự kiện" },
  { key: "nav.governance", icon: Vote, to: "/voting", label: "Biểu quyết" },
  { key: "nav.eventReg", icon: ClipboardList, to: "/event-registrations", label: "Đăng ký sự kiện" },
  { key: "nav.luckyDraw" as TKey, icon: Gift, to: "/lucky-draw", label: "Bốc thăm trúng thưởng" },
];

// 3. Nhóm TÀI TRỢ (Nhà tài trợ, Báo cáo tài trợ, Quỹ tài trợ: tiền mặt, hiện vật, thiện nguyện)
const sponsors: Item[] = [
  { key: "nav.sponsors", icon: Handshake, to: "/sponsors", label: "Nhà tài trợ" },
  { key: "nav.sponsorReport", icon: FileBarChart, to: "/sponsor-report", label: "Báo cáo tài trợ" },
  {
    key: "nav.sponsorFunds" as TKey,
    icon: Wallet,
    to: "/sponsors?tab=funds",
    label: "Quỹ tài trợ",
    children: [
      { to: "/sponsors?tab=funds&fund_type=general_cash", label: "Quỹ hoạt động: Tiền mặt" },
      { to: "/sponsors?tab=funds&fund_type=general_in_kind", label: "Quỹ hoạt động: Hiện vật" },
      { to: "/sponsors?tab=funds&fund_type=charity_cash", label: "Quỹ thiện nguyện: Tiền mặt" },
      { to: "/sponsors?tab=funds&fund_type=charity_in_kind", label: "Quỹ thiện nguyện: Hiện vật" },
    ],
  },
];

// 4. Nhóm TÀI CHÍNH (Thống kê báo cáo, Khoản thu, Khoản chi, Báo cáo tài chính)
const finance: Item[] = [
  {
    key: "nav.analytics" as TKey,
    icon: BarChart3,
    to: "/analytics",
    label: "Thống kê báo cáo",
    children: [
      { to: "/analytics?category=events", label: "Thống kê báo cáo sự kiện" },
      { to: "/analytics?category=csr", label: "Thống kê thiện nguyện (CSR)" },
      { to: "/analytics", label: "Thống kê tổng hợp" },
    ],
  },
  { key: "nav.income", icon: ArrowDownCircle, to: "/income", label: "Khoản thu" },
  { key: "nav.expenses" as TKey, icon: ArrowUpCircle, to: "/expenses", label: "Khoản chi" },
  {
    key: "nav.financeReport",
    icon: PieChart,
    to: "/finance-report",
    label: "Báo cáo tài chính",
    children: [
      { to: "/finance-report?category=events", label: "Báo cáo cho sự kiện" },
      { to: "/finance-report?category=classes", label: "Báo cáo cho lớp học" },
      { to: "/finance-report?category=fees", label: "Báo cáo phí tham gia" },
      { to: "/finance-report", label: "Báo cáo tổng hợp" },
    ],
  },
];

// 5. Nhóm TRUYỀN THÔNG (Thông báo, Tin tức & Truyền thông, Quyền lợi & Ưu đãi)
const comm: Item[] = [
  {
    key: "nav.notify",
    icon: Bell,
    to: "/notifications",
    label: "Thông báo",
    children: [
      { to: "/notifications?filter=events", label: "Thông báo sự kiện" },
      { to: "/notifications?filter=trainings", label: "Thông báo lớp học" },
      { to: "/notifications", label: "Tất cả thông báo" },
    ],
  },
  { key: "nav.news", icon: Newspaper, to: "/news", label: "Tin tức & Truyền thông" },
  { key: "nav.perks", icon: Gift, to: "/perks", label: "Quyền lợi & Ưu đãi" },
];

// 6. Nhóm KẾT NỐI & GIAO THƯƠNG (Nhắn tin, Chia sẻ cơ hội, Giao thương B2B, Phân loại doanh nghiệp)
const network: Item[] = [
  { key: "nav.network", icon: MessageSquare, to: "/network", label: "Nhắn tin" },
  { key: "nav.opportunities" as TKey, icon: Sparkles, to: "/opportunities", label: "Chia sẻ cơ hội" },
  { key: "nav.b2bDeals" as TKey, icon: Store, to: "/marketplace", label: "Giao thương B2B" },
  { key: "nav.companies" as TKey, icon: Building2, to: "/companies", label: "Phân loại doanh nghiệp" },
];

// 7. Nhóm HOẠT ĐỘNG (Quản lý cuộc họp, Tài liệu, Biểu mẫu)
const activities: Item[] = [
  { key: "nav.meetings" as TKey, icon: Users2, to: "/meetings", label: "Quản lý cuộc họp" },
  { key: "nav.documents", icon: FolderOpen, to: "/documents", label: "Tài liệu" },
  {
    key: "nav.templates" as TKey,
    icon: LayoutTemplate,
    to: "/templates",
    label: "Biểu mẫu",
    children: [
      { to: "/templates?type=excel", label: "Biểu mẫu Excel (Báo cáo & Thu chi)" },
      { to: "/templates?type=word", label: "Biểu mẫu Word (Công văn & Thư mời)" },
      { to: "/templates?type=pdf", label: "Biểu mẫu PDF (Hóa đơn & Quyết toán)" },
    ],
  },
];

// 8. Nhóm HỆ THỐNG (Cài đặt hệ thống, Lịch sử hoạt động)
const system: Item[] = [
  { key: "nav.settings", icon: Settings, to: "/settings", label: "Cài đặt hệ thống" },
  { key: "nav.activity" as TKey, icon: Activity, to: "/activity", label: "Lịch sử hoạt động" },
];

// 9. Nhóm PHÂN QUYỀN (Quản lý ban, Quản lý phân quyền chức năng, Phân quyền Trợ lý AI, Quản lý tài khoản người dùng)
const permissionsGroup: Item[] = [
  {
    key: "nav.departments" as TKey,
    icon: Building2,
    to: "/departments",
    label: "Quản lý ban",
  },
  {
    key: "nav.permissions" as TKey,
    icon: ShieldCheck,
    to: "/permissions",
    label: "Quản lý phân quyền chức năng",
  },
  {
    key: "nav.aiPermissions" as TKey,
    icon: Sparkles,
    to: "/permissions?tab=ai",
    label: "Phân quyền Trợ lý AI",
  },
  {
    key: "nav.accounts" as TKey,
    icon: UserCog,
    to: "/accounts",
    label: "Quản lý tài khoản người dùng",
  },
];

const COLLAPSE_KEY = "vba.sidebar.collapsed";

function isActive(pathname: string | undefined, to?: string, searchStr?: string) {
  if (!to || !pathname) return false;
  const normPath = pathname.replace(/\/$/, "") || "/";
  if (to.includes("?")) {
    const [pathPart, queryPart] = to.split("?");
    const normToPath = pathPart.replace(/\/$/, "") || "/";
    if (normPath !== normToPath) return false;
    const currentSearch = searchStr ?? (typeof window !== "undefined" ? window.location.search : "");
    const sp = new URLSearchParams(currentSearch);
    const [queryKey, queryVal] = queryPart.split("=");
    if (queryKey && queryVal) {
      const actualVal = sp.get(queryKey);
      if (!actualVal && queryKey === "tab" && (queryVal === "matrix" || queryVal === "users" || queryVal === "all")) {
        return true;
      }
      return actualVal === queryVal;
    }
    return currentSearch.includes(queryPart);
  }
  if (to === "/") return normPath === "/";
  const normTo = to.replace(/\/$/, "");
  return normPath === normTo || normPath.startsWith(normTo + "/");
}

function NavItem({
  item,
  pathname,
  searchStr,
  collapsed,
  onNavigate,
  badge,
  badges,
  getLabel,
  onDismissBadge,
}: {
  item: Item;
  pathname: string | undefined;
  searchStr?: string;
  collapsed: boolean;
  onNavigate?: () => void;
  badge?: number;
  badges?: Record<string, number>;
  getLabel?: (it: { to?: string; key?: string; label?: string }, fallback?: string) => string;
  onDismissBadge?: (route?: string) => void;
}) {
  const t = useT();
  const Icon = item.icon;
  const active = isActive(pathname, item.to, searchStr);
  const defaultLabel = item.label || t(item.key);
  const label = getLabel ? getLabel(item, defaultLabel) : defaultLabel;

  const hasChildren = Boolean(item.children && item.children.length > 0);
  const totalChildrenBadge = hasChildren
    ? item.children!.reduce((acc, child) => {
        const cBadge = child.to ? (badges?.[child.to] ?? 0) : 0;
        return acc + cBadge;
      }, 0)
    : 0;
  const effectiveBadge = (badge && badge > 0 ? badge : 0) || totalChildrenBadge;
  const showBadge = effectiveBadge > 0;
  const badgeText = effectiveBadge > 99 ? "99+" : String(effectiveBadge);

  const isParentActive = Boolean(item.to && pathname && (pathname === item.to || pathname.startsWith(item.to + "/")));

  const [expanded, setExpanded] = useState<boolean>(() => {
    return isParentActive;
  });

  useEffect(() => {
    if (isParentActive) {
      setExpanded(true);
    }
  }, [isParentActive]);

  const cls = `group relative flex w-full items-center gap-3 rounded-lg py-2 text-[13px] outline-none transition-[background-color,color] duration-[var(--motion-fast)] ease-out focus-visible:ring-2 focus-visible:ring-sidebar-ring ${collapsed ? "justify-center px-0" : "pl-3.5 pr-3"
    } ${active
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
      : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
    }`;
  const badgeEl = showBadge ? (
    collapsed ? (
      <span className="vba-badge-pop absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-slate-500 ring-2 ring-sidebar" />
    ) : (
      <span className="vba-badge-pop inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-600 px-1.5 text-[10px] font-black text-white !text-white shadow-xs select-none">
        {badgeText}
      </span>
    )
  ) : null;
  const inner = (
    <>
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
      )}
      {active && collapsed && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
      )}
      <Icon
        className={`h-[18px] w-[18px] shrink-0 transition-transform duration-[var(--motion-fast)] ease-out ${active ? "text-sidebar-primary" : "group-hover:translate-x-0.5"
          }`}
        strokeWidth={active ? 2.4 : 1.9}
      />
      {!collapsed && <span className="flex-1 truncate text-left font-medium">{label}</span>}
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        {badgeEl}
        {!collapsed && hasChildren && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            className="p-1 rounded hover:bg-sidebar-accent/80 text-sidebar-foreground/60 transition cursor-pointer"
            title={expanded ? "Thu gọn menu" : "Mở rộng menu"}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </span>
        )}
      </div>
    </>
  );

  return (
    <div className="w-full">
      {item.to ? (
        <Link
          to={item.to}
          data-active={active ? "true" : undefined}
          className={cls}
          onClick={() => {
            if (item.to) onDismissBadge?.(item.to);
            if (hasChildren) setExpanded(true);
            if (onNavigate) onNavigate();
          }}
          title={collapsed ? label : undefined}
        >
          {inner}
        </Link>
      ) : (
        <button
          data-active={active ? "true" : undefined}
          className={cls}
          onClick={() => {
            if (hasChildren) setExpanded((prev) => !prev);
            if (onNavigate) onNavigate();
          }}
          title={collapsed ? label : undefined}
        >
          {inner}
        </button>
      )}

      {/* Sub-menu tree rendered when expanded and not collapsed */}
      {!collapsed && hasChildren && expanded && (
        <div className="ml-5 pl-2.5 my-1 border-l-2 border-sidebar-border/60 space-y-0.5 animate-in fade-in-50 duration-150">
          {item.children!.map((child) => {
            const childActive = isActive(pathname, child.to, searchStr);
            const childBadge = child.to ? badges?.[child.to] : undefined;
            const hasChildBadge = !!childBadge && childBadge > 0;
            return (
              <Link
                key={child.to}
                to={child.to}
                onClick={() => {
                  if (child.to) onDismissBadge?.(child.to);
                  if (onNavigate) onNavigate();
                }}
                className={`group flex items-center justify-between gap-2 rounded-lg py-1.5 px-2.5 text-[12px] font-medium transition-[background-color,color] ${childActive
                    ? "bg-sidebar-accent text-sidebar-primary font-bold shadow-2xs"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={`size-1.5 rounded-full shrink-0 transition-transform ${childActive ? "bg-sidebar-primary scale-125" : "bg-sidebar-foreground/35 group-hover:bg-sidebar-foreground/60"
                      }`}
                  />
                  <span className="truncate">{child.label}</span>
                </div>
                {hasChildBadge && (
                  <span className="vba-badge-pop shrink-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-600 px-1 text-[9px] font-black text-white !text-white shadow-xs select-none">
                    {childBadge > 99 ? "99+" : childBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Group({
  label,
  customGroupLabel,
  items,
  pathname,
  searchStr,
  collapsed,
  onNavigate,
  badges,
  onDismissBadge,
}: {
  label?: TKey | string;
  customGroupLabel?: string;
  items: Item[];
  pathname: string | undefined;
  searchStr?: string;
  collapsed: boolean;
  onNavigate?: () => void;
  badges?: Record<string, number>;
  onDismissBadge?: (route?: string) => void;
}) {
  if (!items || items.length === 0) return null;
  const t = useT();
  const { getLabel, getGroupLabel } = useSidebarLabels();
  const displayGroupLabel = customGroupLabel || (label ? getGroupLabel(label, (t as any)(label) || label) : undefined);
  return (
    <div className={collapsed ? "px-2.5" : "px-3"}>
      {displayGroupLabel &&
        (collapsed ? (
          <div className="mx-2 mb-1.5 mt-1 h-px bg-sidebar-border/50" />
        ) : (
          <div className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">
            {displayGroupLabel}
          </div>
        ))}
      <div className="space-y-[3px]">
        {items.map((it) => (
          <NavItem
            key={it.key}
            item={it}
            pathname={pathname}
            searchStr={searchStr}
            collapsed={collapsed}
            onNavigate={onNavigate}
            badge={it.to ? badges?.[it.to] : undefined}
            badges={badges}
            getLabel={getLabel}
            onDismissBadge={onDismissBadge}
          />
        ))}
      </div>
    </div>
  );
}

export function Sidebar({
  mobile = false,
  onNavigate,
}: { mobile?: boolean; onNavigate?: () => void } = {}) {
  const t = useT();
  const { user } = useAuth();
  const roleState = useRole();
  const {
    isPlatformAdmin,
    isAdmin,
    srsRole,
    isBQT,
    isBTK,
    isBTT,
    isBXT,
    isBTV,
    isBTN,
    isBTC,
    isHVT,
    isChuTich,
    isPresident,
    isBanDieuHanh,
    isTongThuKy,
    isBanThuKy,
    isTruongBanTruyenThong,
    isTruongBanThanhVien,
    isTruongBanXucTien,
    isTruongBanTaiChinh,
    isTruongBanThienNguyen,
    canManageMembers,
    canManageFinance,
    canManageMedia,
    canManageEvents,
    canScanQR,
    canManageSystem,
    setRoleOverride,
  } = roleState;

  // Xác định vai trò hệ thống CRM cốt lõi theo thứ tự ưu tiên chính xác
  const currentRoleKey: SystemRoleKey = useMemo(() => {
    const rawRole = (srsRole as string) || "";

    // 1. Vai trò Lãnh đạo cấp cao: Lớp Trưởng & Lớp Phó Lâm Thời, Quản trị hệ thống
    if (rawRole === "chu_tich" || rawRole === "president" || isChuTich) return "chu_tich";
    if (rawRole === "pho_chu_tich" || rawRole.startsWith("lop_pho_")) return "chu_tich";
    if (rawRole.startsWith("truong_team_") || rawRole.startsWith("pho_team_") || rawRole.startsWith("tb_")) return "admin";
    if (rawRole === "quan_tri" || rawRole === "ADM" || isPlatformAdmin) return "quan_tri";
    if (rawRole === "admin" || (isAdmin && !rawRole.startsWith("thanh_vien_ban_") && rawRole !== "member" && rawRole !== "HVT") || isBQT) return "admin";

    // 2. Trưởng ban các Ban Chuyên Môn
    if (rawRole === "truong_ban_truyen_thong" || rawRole === "BTT" || isTruongBanTruyenThong) return "truong_ban_truyen_thong";
    if (rawRole === "truong_ban_thanh_vien" || rawRole === "BTV" || isTruongBanThanhVien) return "truong_ban_thanh_vien";
    if (rawRole === "truong_ban_xuc_tien" || rawRole === "BXT" || isTruongBanXucTien) return "truong_ban_xuc_tien";
    if (rawRole === "truong_ban_tai_chinh" || rawRole === "BTC" || isTruongBanTaiChinh) return "truong_ban_tai_chinh";
    if (rawRole === "truong_ban_thien_nguyen" || rawRole === "BTN" || isTruongBanThienNguyen) return "truong_ban_thien_nguyen";
    if (rawRole === "tong_thu_ky" || isTongThuKy) return "tong_thu_ky";
    if (rawRole === "ban_thu_ky" || isBanThuKy) return "tong_thu_ky";
    if (rawRole === "ban_dieu_hanh" || rawRole === "truong_ban_dieu_hanh" || rawRole === "BQT") return "truong_ban_dieu_hanh";

    // 3. Vai trò chuyên môn của Ban (Thành viên ban chuyên trách)
    if (rawRole === "thanh_vien_ban_su_kien") return "thanh_vien_ban_su_kien";
    if (rawRole === "thanh_vien_ban_xuc_tien") return "thanh_vien_ban_xuc_tien";
    if (rawRole === "thanh_vien_ban_thanh_vien") return "thanh_vien_ban_thanh_vien";
    if (rawRole === "thanh_vien_ban_truyen_thong") return "thanh_vien_ban_truyen_thong";
    if (rawRole === "thanh_vien_ban_tai_chinh") return "thanh_vien_ban_tai_chinh";
    if (rawRole === "thanh_vien_ban_thien_nguyen") return "thanh_vien_ban_thien_nguyen";
    if (rawRole === "thanh_vien_ban_dieu_hanh") return "thanh_vien_ban_dieu_hanh";

    return "member";
  }, [
    srsRole,
    isPlatformAdmin,
    isChuTich,
    isAdmin,
    isBQT,
    isTongThuKy,
    isBanThuKy,
    isTruongBanTruyenThong,
    isTruongBanThanhVien,
    isTruongBanXucTien,
    isTruongBanTaiChinh,
    isTruongBanThienNguyen,
  ]);

  const [matrixRevision, setMatrixRevision] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setMatrixRevision((v) => v + 1);
    window.addEventListener("crm_permissions_updated", handleUpdate);
    window.addEventListener("rbac-matrix-synced", handleUpdate);
    window.addEventListener("role-changed", handleUpdate);
    return () => {
      window.removeEventListener("crm_permissions_updated", handleUpdate);
      window.removeEventListener("rbac-matrix-synced", handleUpdate);
      window.removeEventListener("role-changed", handleUpdate);
    };
  }, []);

  const isAllowed = useCallback(
    (route?: string): boolean => {
      if (!route) return true;
      return isRouteAllowedByMatrix(route, currentRoleKey, user);
    },
    [currentRoleKey, matrixRevision, user]
  );

  // Scoped permissions according to the SRS RBAC matrix:
  const isPrivilegedAdmin =
    !String(srsRole).startsWith("thanh_vien_ban_") &&
    srsRole !== "member" &&
    srsRole !== "HVT" &&
    (isPlatformAdmin || isAdmin || isChuTich || srsRole === "admin" || srsRole === "quan_tri" || srsRole === "ADM" || srsRole === "chu_tich");
  const canViewMembers = true; // All can view member directory (HVT is read-only)
  const canViewEvents = true; // All can view events
  const canViewSponsors = true;
  const canViewFinance = true;
  const canViewComm = true;
  const canViewNetwork = true;
  const canViewBusinessConnect = true;
  const canViewSystem = isPrivilegedAdmin || srsRole === "admin" || srsRole === "quan_tri" || srsRole === "chu_tich";
  const canViewPlatform = isPrivilegedAdmin || srsRole === "admin" || srsRole === "quan_tri" || srsRole === "chu_tich";

  const location = useRouterState({ select: (s) => s?.location });
  const pathname = location?.pathname;
  const searchStr = location?.searchStr || (typeof window !== "undefined" ? window.location.search : "");

  const fetchMine = useServerFn(listMyAssociationsFn);
  const { data: myAssocs, reload } = useServerData<MyAssociation[]>(() => fetchMine(), []);
  const activeAssoc = myAssocs?.find((a) => a.isActive) ?? myAssocs?.[0];

  const { count: unreadNotify, categoryCounts: notifBadges } = useUnreadNotifications();
  const badges: Record<string, number> = {
    "/notifications": unreadNotify,
    ...(notifBadges || {}),
  };

  const [dismissedBadges, setDismissedBadges] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("vba_crm_dismissed_badges");
        if (raw) return new Set(JSON.parse(raw));
      } catch {}
    }
    return new Set();
  });

  const dismissBadge = useCallback((route?: string) => {
    if (!route) return;
    setDismissedBadges((prev) => {
      const next = new Set(prev);
      next.add(route);
      const clean = route.split("?")[0];
      next.add(clean);
      if (clean === "/notifications") {
        next.add("/notifications?filter=new_members");
        next.add("/notifications?filter=fee_alerts");
        next.add("/notifications?filter=admin_system");
        next.add("/notifications?filter=events_meetings");
        markNotificationsSeen();
      }
      try {
        localStorage.setItem("vba_crm_dismissed_badges", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (pathname) {
      dismissBadge(pathname);
      if (searchStr) {
        dismissBadge(`${pathname}${searchStr}`);
      }
    }
  }, [pathname, searchStr, dismissBadge]);

  const effectiveBadges = useMemo(() => {
    const result: Record<string, number> = {};
    for (const [route, count] of Object.entries(badges)) {
      if (dismissedBadges.has(route) || dismissedBadges.has(route.split("?")[0])) {
        result[route] = 0;
      } else {
        result[route] = count;
      }
    }
    return result;
  }, [badges, dismissedBadges]);

  const [overrideBrandName, setOverrideBrandName] = useState<string | null>(null);
  const [overrideBrandLogo, setOverrideBrandLogo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedName = localStorage.getItem("vba_active_assoc_name") || localStorage.getItem("crm_system_name");
      if (savedName) setOverrideBrandName(savedName);
      const savedLogo =
        localStorage.getItem("vba_active_assoc_logo") ||
        localStorage.getItem("crm_system_logo") ||
        null;
      if (savedLogo) setOverrideBrandLogo(savedLogo);
    } catch {}
  }, []);

  useEffect(() => {
    const onChange = (e: any) => {
      reload();
      if (e?.detail?.name) {
        setOverrideBrandName(e.detail.name);
      } else if (typeof window !== "undefined") {
        setOverrideBrandName(localStorage.getItem("vba_active_assoc_name") || localStorage.getItem("crm_system_name"));
      }
      if (e?.detail?.logoUrl) {
        setOverrideBrandLogo(e.detail.logoUrl);
      } else if (typeof window !== "undefined") {
        setOverrideBrandLogo(localStorage.getItem("vba_active_assoc_logo") || localStorage.getItem("crm_system_logo"));
      }
    };
    window.addEventListener("association-changed", onChange);
    window.addEventListener("crm-branding-changed", onChange);
    return () => {
      window.removeEventListener("association-changed", onChange);
      window.removeEventListener("crm-branding-changed", onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const brandName = overrideBrandName || activeAssoc?.name || t("brand.name");
  const rawAssocLogo = activeAssoc?.logoUrl
    ? resolveMediaUrl(activeAssoc.logoUrl) || activeAssoc.logoUrl
    : null;
  const brandLogo =
    (overrideBrandLogo && !overrideBrandLogo.includes("image 6.png")
      ? resolveMediaUrl(overrideBrandLogo) || overrideBrandLogo
      : null) ||
    (rawAssocLogo && !rawAssocLogo.includes("image 6.png")
      ? rawAssocLogo
      : "/app-icon.png");

  // Collapse only applies to the desktop sidebar; the mobile drawer is always full.
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [bottomExpanded, setBottomExpanded] = useState(false);

  useEffect(() => {
    if (mobile) return;
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, [mobile]);

  // Restore scroll position & auto-scroll active item into view
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("crm_sidebar_scroll_top");
      if (saved && scrollRef.current) {
        scrollRef.current.scrollTop = Number(saved);
      }
    } catch {
      /* ignore */
    }

    const timer = setTimeout(() => {
      const activeEl = scrollRef.current?.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    try {
      sessionStorage.setItem("crm_sidebar_scroll_top", String(e.currentTarget.scrollTop));
    } catch {
      /* ignore */
    }
  };

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const isCollapsed = !mobile && collapsed;
  const visibility = mobile ? "flex" : "hidden lg:flex";
  const width = isCollapsed ? "w-[72px]" : "w-[260px]";

  // Lọc chi tiết từng mục menu kết hợp Ma Trận Quyền RBAC
  const filteredOverview = overview.filter((it) => isAllowed(it.to));

  const filteredEvents = events.filter((it) => isAllowed(it.to));

  const filteredSponsors = sponsors.filter((it) => isAllowed(it.to));
  
  const filteredFinance = finance.filter((it) => isAllowed(it.to));
  
  const filteredComm = comm.filter((it) => isAllowed(it.to));

  const filteredNetwork = network.filter((it) => isAllowed(it.to));

  // Nhóm Hoạt động (Cuộc họp, Tài liệu, Biểu mẫu) lọc theo phân quyền CSDL
  const filteredActivities = activities.filter((it) => isAllowed(it.to));

  const filteredSystem = system.filter((it) => isAllowed(it.to));

  const filteredPermissions = permissionsGroup.filter((it) => {
    // Chỉ Quản trị cấp cao, Chủ tịch, Tổng thư ký hoặc Trưởng ban chuyên môn mới có quyền truy cập nhóm phân quyền
    if (!isPrivilegedAdmin && !isTongThuKy && !isBanThuKy && !String(srsRole).startsWith("truong_ban_")) {
      return false;
    }
    if (it.to?.includes("/account-settings") || it.to?.includes("/accounts")) {
      const roleStr = String(srsRole || "");
      const emailLower = (user?.email || "").toLowerCase().trim();
      return (
        isPrivilegedAdmin ||
        emailLower === "admin@viconnect.vn" ||
        emailLower === "admin@connect.vn" ||
        roleStr === "quan_tri" ||
        roleStr === "admin" ||
        roleStr === "chu_tich" ||
        roleStr === "president" ||
        roleStr === "tong_thu_ky" ||
        roleStr === "ban_thu_ky" ||
        roleStr === "truong_ban_dieu_hanh" ||
        roleStr.startsWith("truong_ban_")
      );
    }
    return isPrivilegedAdmin && isAllowed(it.to || "/permissions");
  });

  return (
    <aside
      className={`${visibility} ${mobile ? "h-dvh" : "sticky top-0 h-dvh"} ${width} shrink-0 flex-col border-r border-sidebar-border transition-[width] duration-[var(--motion-slow)] ease-out`}
      style={{ background: "var(--gradient-sidebar)" }}
    >
      {/* Logo */}
      <div
        className={`flex h-[72px] items-center gap-3 border-b border-sidebar-border ${isCollapsed ? "justify-center px-2" : "px-5"
          }`}
      >
        <img
          src={brandLogo || "/app-icon.png"}
          alt={brandName}
          className="h-10 w-10 shrink-0 rounded-xl object-contain bg-white/10 p-0.5 border border-sidebar-border/40 shadow-xs"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/app-icon.png";
          }}
        />
        {!isCollapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[14px] font-bold text-sidebar-foreground">
              {brandName}
            </div>
          </div>
        )}
        {!mobile && !isCollapsed && (
          <button
            onClick={toggle}
            aria-label={t("nav.collapse")}
            title={t("nav.collapse")}
            className="shrink-0 rounded-lg p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
          >
            <PanelLeftClose className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {/* Collapsed expand button */}
      {!mobile && isCollapsed && (
        <div className="flex justify-center pt-2">
          <button
            onClick={toggle}
            aria-label={t("nav.expand")}
            title={t("nav.expand")}
            className="rounded-lg p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}

      {/* Nav */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="sidebar-scroll flex-1 space-y-5 overflow-y-auto py-4"
      >
        {/* 1. TOP-LEVEL: Tổng quan, Trợ lý AI, Học viên, Lớp học & Khóa học */}
        {filteredOverview.length > 0 && (
          <Group
            items={filteredOverview}
            pathname={pathname}
            searchStr={searchStr}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
            badges={effectiveBadges}
            onDismissBadge={dismissBadge}
          />
        )}

        {/* 2. NHÓM TRUYỀN THÔNG (Sự kiện, Tổng quan, Biểu quyết, Đăng ký, Bốc thăm) */}
        {canViewEvents && filteredEvents.length > 0 && (
          <Group
            customGroupLabel="TRUYỀN THÔNG"
            items={filteredEvents}
            pathname={pathname}
            searchStr={searchStr}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
            badges={effectiveBadges}
            onDismissBadge={dismissBadge}
          />
        )}

        {/* 3. NHÓM TÀI TRỢ (Nhà tài trợ, Báo cáo tài trợ, Quỹ tài trợ) */}
        {canViewSponsors && filteredSponsors.length > 0 && (
          <Group
            customGroupLabel="TÀI TRỢ"
            items={filteredSponsors}
            pathname={pathname}
            searchStr={searchStr}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
            badges={effectiveBadges}
            onDismissBadge={dismissBadge}
          />
        )}

        {/* 4. NHÓM TÀI CHÍNH (Thống kê báo cáo, Khoản thu, Khoản chi, Báo cáo tài chính) */}
        {canViewFinance && filteredFinance.length > 0 && (
          <Group
            customGroupLabel="TÀI CHÍNH"
            items={filteredFinance}
            pathname={pathname}
            searchStr={searchStr}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
            badges={effectiveBadges}
            onDismissBadge={dismissBadge}
          />
        )}

        {/* 5. NHÓM TRUYỀN THÔNG (Thông báo, Tin tức & Truyền thông, Quyền lợi & Ưu đãi) */}
        {canViewComm && filteredComm.length > 0 && (
          <Group
            customGroupLabel="TRUYỀN THÔNG"
            items={filteredComm}
            pathname={pathname}
            searchStr={searchStr}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
            badges={effectiveBadges}
            onDismissBadge={dismissBadge}
          />
        )}

        {/* 6. NHÓM KẾT NỐI & GIAO THƯƠNG (Nhắn tin, Chia sẻ cơ hội, Giao thương B2B, Phân loại doanh nghiệp) */}
        {filteredNetwork.length > 0 && (
          <Group
            customGroupLabel="KẾT NỐI & GIAO THƯƠNG"
            items={filteredNetwork}
            pathname={pathname}
            searchStr={searchStr}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
            badges={effectiveBadges}
            onDismissBadge={dismissBadge}
          />
        )}

        {/* 7. NHÓM HOẠT ĐỘNG (Quản lý công việc, Quản lý cuộc họp, Tài liệu biểu mẫu) */}
        {filteredActivities.length > 0 && (
          <Group
            customGroupLabel="HOẠT ĐỘNG"
            items={filteredActivities}
            pathname={pathname}
            searchStr={searchStr}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
            badges={effectiveBadges}
            onDismissBadge={dismissBadge}
          />
        )}

        {/* 8. NHÓM HỆ THỐNG (Cài đặt hệ thống, Lịch sử hoạt động) */}
        {canViewSystem && filteredSystem.length > 0 && (
          <Group
            customGroupLabel="HỆ THỐNG"
            items={filteredSystem}
            pathname={pathname}
            searchStr={searchStr}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
            badges={effectiveBadges}
            onDismissBadge={dismissBadge}
          />
        )}

        {/* 9. NHÓM PHÂN QUYỀN (Phân quyền hệ thống, Quản lý Ban Chuyên Môn, Quản trị người dùng) */}
        {canViewPlatform && filteredPermissions.length > 0 && (
          <Group
            customGroupLabel="PHÂN QUYỀN"
            items={filteredPermissions}
            pathname={pathname}
            searchStr={searchStr}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
            badges={effectiveBadges}
            onDismissBadge={dismissBadge}
          />
        )}
      </div>

      {/* Enterprise Bar — có thể thu nhỏ cố định hoặc phóng to (Đã loại bỏ Theme Switcher theo quy chuẩn Light Theme) */}
      {!isCollapsed && (
        <div className="border-t border-sidebar-border px-3 py-2.5">
          <div className="flex w-full items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500">CEO HN10 CRM</span>
            <button
              type="button"
              onClick={() => setBottomExpanded(!bottomExpanded)}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary transition hover:bg-primary/20 cursor-pointer"
              title="Xem thông tin phiên bản"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="truncate max-w-[68px]">Enterprise</span>
              {bottomExpanded ? <ChevronDown className="h-3.5 w-3.5 opacity-70" /> : <ChevronUp className="h-3.5 w-3.5 opacity-70" />}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
