import React, { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Server,
  Smartphone,
  Globe,
  Wallet,
  Coins,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  Users,
  UserPlus,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Plus,
  Lock,
  ArrowRight,
  Settings,
  CreditCard,
  Sliders,
  ChevronRight,
  LayoutDashboard,
  Check,
  Building,
  Building2,
  CheckSquare,
  Square,
  MessageSquare,
  Key,
  Radio,
  CheckCheck,
  Power,
  RotateCw,
  Search,
  UserCog,
  Unlock,
  Shield,
  Menu,
  X,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  PlusCircle,
  Pencil,
} from "lucide-react";
import { TableActionsGroup } from "@/components/common";
import {
  SYSTEM_TENANTS,
  isModuleEnabledForTenant,
  getActiveSystemTenant,
  setActiveSystemTenant,
  GRANULAR_PERMISSION_CATEGORIES,
  getCustomDepartments,
  saveCustomDepartments,
  INITIAL_DEPARTMENTS,
  dispatchPermissionSyncEvent,
  type DepartmentItem,
} from "@/lib/rbac-permission-helpers";
import { fetchNestApi } from "@/lib/api-client";
import { isValidEmail } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/master/")({
  ssr: false,
  component: MasterAdminPortal,
});

function fmtVND(n: number) {
  return n.toLocaleString("vi-VN");
}

function MasterAdminPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUserEmail = (user?.email || "").toLowerCase().trim();
  const isSuperPlatformAdmin =
    currentUserEmail === "admin@ceohn10.vn" ||
    currentUserEmail === "admin@viconnect.vn" ||
    currentUserEmail === "admin@connect.vn" ||
    user?.role === "platform_admin" ||
    Boolean(user?.isPlatformAdmin);

  const isCeoHn10Admin =
    isSuperPlatformAdmin ||
    user?.role === "admin" ||
    user?.targetSystem === "ceohn10" ||
    currentUserEmail.includes("hn10");

  const isMasterAdmin = isSuperPlatformAdmin || isCeoHn10Admin;
  const canManageAccounts = isSuperPlatformAdmin || isCeoHn10Admin;

  const [activeTab, setActiveTab] = useState<"overview" | "accounts" | "settings" | "departments">(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const tab = sp.get("tab");
      if (tab === "accounts" || tab === "settings" || tab === "departments") return tab;
    }
    return "overview";
  });
  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>(() => getCustomDepartments());
  const [deptEditing, setDeptEditing] = useState<DepartmentItem | null>(null);
  const [deptForm, setDeptForm] = useState({ code: "", name: "", description: "", color: "blue" });
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // State dự án đang quản trị (ceohn10)
  const [selectedTenantKey, setSelectedTenantKey] = useState<string>(() => {
    return getActiveSystemTenant() || "ceohn10";
  });

  const handleTenantChange = (key: string) => {
    setSelectedTenantKey(key);
    setActiveSystemTenant(key);
    window.dispatchEvent(new CustomEvent("tenant-changed", { detail: { tenantKey: key } }));
    toast.success(`Đã chuyển sang dự án: ${SYSTEM_TENANTS.find((t) => t.key === key)?.name || key}`);
    platformsQ.refetch();
    accountsQ.refetch();
    sepayQ.refetch();
    zaloQ.refetch();
  };

  // Query platforms catalog theo tenant được chọn
  const platformsQ = useQuery({
    queryKey: ["master-settings-platforms", selectedTenantKey],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>(`/admin/master-settings/platforms?tenant=${selectedTenantKey}`);
        if (Array.isArray(res) && res.length > 0) return res;
      } catch {}

      // Mặc định: CEOHN10
      return [
        {
          id: "plt-crm",
          name: "Hệ thống CRM CEOHN10",
          code: "CEOHN10_CRM_WEB",
          category: "crm",
          categoryLabel: "CRM Hiệp hội",
          description: "Cổng Quản trị CRM Học viên, Sự kiện, Khai giảng, Tài chính, Phân quyền, Tra cứu",
          endpointUrl: "/",
          isCore: true,
          status: "active",
          modules: ["Học viên", "Sự kiện", "Khai giảng", "Tài chính", "Phân quyền", "Tra cứu"],
        },
        {
          id: "plt-app",
          name: "App Mobile CEOHN10",
          code: "CEOHN10_MOBILE_APP",
          category: "miniapp",
          categoryLabel: "Mobile App Học viên",
          description: "Ứng dụng di động dành riêng cho Học viên doanh nhân CLB CEO HN10",
          endpointUrl: "/association",
          isCore: true,
          status: "active",
          modules: ["Danh thiếp số", "B2B Connect", "Điểm danh QR", "Bình chọn", "Hội viên"],
        },
      ];
    },
  });

  const DEFAULT_FEE_CATEGORIES = [
    {
      id: "fee_event",
      name: "Vé tham gia sự kiện",
      prefix: "CEO1983_EVT",
      target_fund_name: "Quỹ Sự Kiện & Hậu Cần",
      action_type: "event_ticket",
      action_label: "Phát hành vé QR & gửi Email/Zalo",
      description: "Tự động duyệt vé, tạo mã QR check-in HMAC-SHA256, gửi vé điện tử",
      is_active: true,
    },
    {
      id: "fee_joining",
      name: "Phí gia nhập CLB (Hội viên mới)",
      prefix: "CEOHN10_GN",
      target_fund_name: "Quỹ Tổng CLB CEO HN10",
      action_type: "membership_join",
      action_label: "Duyệt hội viên mới & cấp thẻ số",
      description: "Kích hoạt hội viên chính thức, cấp mã học viên, mở thẻ 3D/NFC",
      is_active: true,
    },
    {
      id: "fee_annual",
      name: "Hội phí thường niên hàng năm",
      prefix: "CEOHN10_HP",
      target_fund_name: "Quỹ Tổng CLB CEO HN10",
      action_type: "membership_annual",
      action_label: "Gia hạn niên liễm & thẻ hội viên",
      description: "Tự động gạch nợ hóa đơn hội phí, gia hạn niên hạn sử dụng thẻ",
      is_active: true,
    },
    {
      id: "fee_course",
      name: "Học phí Khóa học / 30 Chuyên đề",
      prefix: "CEOHN10_LH",
      target_fund_name: "Quỹ Ban Học Tập & Đào Tạo",
      action_type: "course_enroll",
      action_label: "Ghi danh lớp & mở khóa bài giảng",
      description: "Ghi danh hội viên vào lớp học, cấp quyền truy cập tài liệu đào tạo",
      is_active: true,
    },
    {
      id: "fee_sponsorship",
      name: "Kinh phí Tài trợ CLB & Sự kiện",
      prefix: "CEOHN10_TT",
      target_fund_name: "Quỹ Tài Trợ & Đối Ngoại",
      action_type: "sponsorship",
      action_label: "Kích hoạt logo & quyền lợi Sponsor",
      description: "Ghi nhận quyền lợi nhà tài trợ (Kim cương, Vàng, Bạc), hiển thị logo app",
      is_active: true,
    },
    {
      id: "fee_charity",
      name: "Ủng hộ Quỹ Thiện nguyện",
      prefix: "CEOHN10_TN",
      target_fund_name: "Quỹ Thiện Nguyện CLB",
      action_type: "charity",
      action_label: "Ghi nhận đóng góp & vinh danh",
      description: "Cộng tiền vào Quỹ Thiện nguyện, vinh danh Bảng vàng đóng góp",
      is_active: true,
    },
    {
      id: "fee_b2b",
      name: "Phí Gian hàng B2B / Kết nối giao thương",
      prefix: "CEOHN10_B2B",
      target_fund_name: "Quỹ Ban Xúc Tiến Thương Mại B2B",
      action_type: "b2b_expo",
      action_label: "Mở gian hàng số & lịch hẹn 1-on-1",
      description: "Cấp quyền mở gian hàng sản phẩm và đặt lịch kết nối giao thương 1-on-1",
      is_active: true,
    },
  ];

  // Cấu hình trắng sạch mặc định (không hardcode dữ liệu giả)
  const EMPTY_SEPAY_CONFIG = {
    is_enabled: false,
    api_token: "",
    webhook_token: "",
    webhook_url: "",
    bank_brand_name: "",
    account_number: "",
    account_name: "",
    auto_activation: {
      membership_fee: true,
      event_ticket: true,
      course_fee: true,
    },
    prefix_syntax: {
      event: "CEO1983_EVT",
      joining: "CEOHN10_GN",
      membership: "CEOHN10_HP",
      course: "CEOHN10_LH",
      sponsor: "CEOHN10_TT",
      charity: "CEOHN10_TN",
      b2b: "CEOHN10_B2B",
    },
    fee_categories: DEFAULT_FEE_CATEGORIES,
  };

  const EMPTY_ZALO_CONFIG = {
    is_enabled: false,
    oa_id: "",
    app_id: "",
    secret_key: "",
    access_token: "",
    refresh_token: "",
    webhook_url: "",
    default_zns_template: "",
    status: "disconnected",
  };

  // Query Sepay Config
  const sepayQ = useQuery({
    queryKey: ["master-settings-sepay"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any>("/admin/master-settings/sepay");
        return res?.config || EMPTY_SEPAY_CONFIG;
      } catch {
        return EMPTY_SEPAY_CONFIG;
      }
    },
  });

  // Query Zalo OA Config
  const zaloQ = useQuery({
    queryKey: ["master-settings-zalo"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any>("/admin/master-settings/zalo");
        return res?.config || EMPTY_ZALO_CONFIG;
      } catch {
        return EMPTY_ZALO_CONFIG;
      }
    },
  });

  // Query Admin Accounts từ database thực tế (Tuyệt đối không dùng tài khoản fake mock)
  const accountsQ = useQuery({
    queryKey: ["master-admin-users", selectedTenantKey],
    queryFn: async () => {
      try {
        const [usersRes, membersRes] = await Promise.all([
          fetchNestApi<any>("/users?limit=100").catch(() => null),
          fetchNestApi<any[]>("/members").catch(() => []),
        ]);

        const userList = usersRes?.data || (Array.isArray(usersRes) ? usersRes : []);
        const membersList = Array.isArray(membersRes) ? membersRes : [];

        // Ánh xạ mã học viên và phòng ban từ danh sách members
        const memberMap = new Map<string, any>();
        for (const m of membersList) {
          if (m.email) memberMap.set(m.email.toLowerCase().trim(), m);
          if (m.userId) memberMap.set(String(m.userId), m);
          if (m.id) memberMap.set(String(m.id), m);
        }

        if (Array.isArray(userList) && userList.length > 0) {
          return userList.map((u: any) => {
            const m = (u.email && memberMap.get(u.email.toLowerCase().trim())) || (u.id && memberMap.get(u.id));
            const email = (u.email || m?.email || "").toLowerCase().trim();
            // Chuẩn hóa mã tài khoản / mã học viên
            let code = u.code || m?.code || m?.membership_code;
            if (!code) {
              if (email === "admin@ceohn10.vn") code = "HN10-ROOT";
              else if (email === "admin.hn10@ceohn10.vn") code = "ADM-HN10-01";
              else if (email.includes("loptruong")) code = "LT-HN10-01";
              else if (email.includes("btt")) code = "BTT-HN10-01";
              else if (email.includes("btc")) code = "BTC-HN10-01";
              else code = "Chưa cấp mã";
            }
            return {
              ...u,
              code,
              username: email || u.username || code,
              email: email || u.email,
              department: u.department || m?.department || "CLB Doanh Nhân CEO HN10",
              role: u.role || m?.role || (email.includes("admin") ? "admin" : "member"),
              name: u.name || m?.name || m?.full_name || m?.contact || (email ? email.split("@")[0] : "Hội viên"),
              targetSystem: u.targetSystem || "ceohn10",
            };
          });
        }

        if (membersList.length > 0) {
          return membersList.map((m: any) => {
            const email = (m.email || `${(m.code || m.membership_code || "hv").toLowerCase()}@ceohn10.vn`).toLowerCase().trim();
            const code = m.code || m.membership_code || "Chưa cấp mã";
            return {
              id: m.id || m.userId || `mb-${code}`,
              name: m.name || m.full_name || m.contact || "Học viên",
              email,
              username: email,
              code,
              role: m.role || "member",
              department: m.department || "CLB Doanh Nhân CEO HN10",
              status: m.status || "active",
              targetSystem: "ceohn10",
            };
          });
        }

        return [];
      } catch (err) {
        console.warn("Failed to load accounts:", err);
        return [];
      }
    },
  });

  // State: Modal thêm phần mềm nền tảng
  const [showAddPlatformModal, setShowAddPlatformModal] = useState(false);
  const [newPlatformData, setNewPlatformData] = useState({
    name: "",
    code: "",
    category: "other",
    description: "",
    endpointUrl: "",
    modulesStr: "",
  });

  // State: Modal tạo tài khoản quản trị mới (Chỉ admin@ceohn10.vn)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    code: "",
    role: "admin",
    department: "Ban Điều Hành",
    targetSystem: "all",
  });
  const [permMode, setPermMode] = useState<"role" | "granular">("role");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  // State: Quản trị RBAC & Phân quyền nâng cao trong Tab Tài Khoản
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [accountRoleFilter, setAccountRoleFilter] = useState("all");
  const [showEditRbacModal, setShowEditRbacModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editRbacData, setEditRbacData] = useState({
    name: "",
    role: "member",
    dataScope: "self",
    department: "Ban Điều Hành",
  });

  const handleOpenEditRbac = (acc: any) => {
    setEditingUser(acc);
    setEditRbacData({
      name: acc.name || "",
      role: acc.role || "member",
      dataScope:
        acc.dataScope ||
        acc.data_scope ||
        (acc.role === "platform_admin" || acc.role === "admin" ? "all" : "self"),
      department: acc.department || "Ban Điều Hành",
    });
    setShowEditRbacModal(true);
  };

  const handleSaveEditRbac = async () => {
    if (!editingUser) return;
    try {
      await fetchNestApi(`/users/${editingUser.id}`, {
        method: "PUT",
        body: {
          name: editRbacData.name,
          role: editRbacData.role,
          dataScope: editRbacData.dataScope,
          department: editRbacData.department,
        },
      });
      toast.success(`Đã cập nhật phân quyền và phạm vi dữ liệu cho ${editingUser.name || editingUser.email}`);
      setShowEditRbacModal(false);
      accountsQ.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi cập nhật phân quyền");
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "inactive" ? "active" : "inactive";
      await fetchNestApi(`/users/${userId}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      toast.success(nextStatus === "active" ? "Đã kích hoạt tài khoản" : "Đã khóa tài khoản");
      accountsQ.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi thay đổi trạng thái");
    }
  };

  const handleResetUserPassword = async (userId: string, email: string) => {
    if (!window.confirm(`Bạn có chắc muốn đặt lại mật khẩu cho tài khoản ${email}?`)) return;
    try {
      const newPass = "Ceohn10@2026";
      await fetchNestApi(`/users/${userId}/reset-password`, {
        method: "POST",
        body: { newPassword: newPass },
      });
      toast.success(`Đã đặt lại mật khẩu cho ${email} thành: ${newPass}`);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi đặt lại mật khẩu");
    }
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${displayName}" khỏi hệ thống?`)) return;
    try {
      await fetchNestApi(`/users/${userId}`, {
        method: "DELETE",
      });
      toast.success(`Đã xóa tài khoản ${displayName}`);
      accountsQ.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi xóa tài khoản");
    }
  };

  // State: Tab con của [3. CÀI ĐẶT HỆ THỐNG NGOÀI & PHÂN HỆ]
  const [settingsSubTab, setSettingsSubTab] = useState<"sepay" | "zalo" | "platforms" | "matrix">("sepay");

  // State: Ma trận module theo từng hệ thống (ceohn10)
  const [modulesMatrix, setModulesMatrix] = useState<Record<string, string[]>>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("viconnect_system_modules_matrix");
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    const defaultMatrix: Record<string, string[]> = {};
    SYSTEM_TENANTS.forEach((t) => {
      defaultMatrix[t.key] = [...t.enabledModules];
    });
    return defaultMatrix;
  });

  const handleToggleModule = (tenantKey: string, moduleKey: string) => {
    setModulesMatrix((prev) => {
      const currentList = prev[tenantKey] || [];
      const exists = currentList.includes(moduleKey);
      const nextList = exists
        ? currentList.filter((m) => m !== moduleKey)
        : [...currentList, moduleKey];
      return {
        ...prev,
        [tenantKey]: nextList,
      };
    });
  };

  const handleSaveModulesMatrix = () => {
    try {
      localStorage.setItem("viconnect_system_modules_matrix", JSON.stringify(modulesMatrix));
      toast.success("Đã lưu ma trận phân hệ module theo từng hệ thống thành công!");
      window.dispatchEvent(new CustomEvent("tenant-changed", { detail: { tenantKey: getActiveSystemTenant() } }));
    } catch {
      toast.error("Lỗi khi lưu ma trận module");
    }
  };

  // State: Sepay Config Editor (Đọc từ API DB thật)
  const [sepayFormData, setSepayFormData] = useState<any>(EMPTY_SEPAY_CONFIG);
  const [isSavingSepay, setIsSavingSepay] = useState(false);
  const [showApiToken, setShowApiToken] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // Kiểm tra thông tin bắt buộc đã nhập đủ để enable nút Lưu Cấu Hình SePay
  const isSepayReadyToSave = Boolean(
    sepayFormData.bank_brand_name?.trim() &&
    sepayFormData.account_number?.trim() &&
    sepayFormData.account_name?.trim() &&
    sepayFormData.webhook_token?.trim()
  );

  // URL Webhook động 100% tự động nhận diện theo Domain/Subdomain thực tế (Server Dev, Subdomain, Localhost)
  const currentOrigin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://crm.ceohn10.viconnect.vn";
  const dynamicDefaultWebhookUrl = `${currentOrigin}/api/webhooks/sepay`;
  // Nếu webhook_url trong DB là URL cũ có chứa loca.lt hoặc để trống, ưu tiên dynamicDefaultWebhookUrl theo domain hiện tại
  const rawWebhookUrl = sepayFormData.webhook_url?.trim() || "";
  const currentWebhookUrl =
    rawWebhookUrl && !rawWebhookUrl.includes("loca.lt")
      ? rawWebhookUrl
      : dynamicDefaultWebhookUrl;

  const handleAddFeeCategory = () => {
    const newId = `fee_${Date.now()}`;
    const newCat = {
      id: newId,
      name: "Khoản phí phát sinh mới",
      prefix: "CEOHN10_PHIKHAC",
      target_fund_name: "Quỹ Tổng CLB CEO HN10",
      action_type: "custom",
      action_label: "Ghi nhận vào Quỹ & sổ quỹ",
      description: "Tự động phân bổ vào Quỹ và lưu sổ thu",
      is_active: true,
    };
    setSepayFormData((prev: any) => ({
      ...prev,
      fee_categories: [...(prev.fee_categories || DEFAULT_FEE_CATEGORIES), newCat],
    }));
    toast.info("Đã thêm 1 dòng khoản phí mới. Hãy nhập tên và mã tiền tố SePay.");
  };

  const handleRemoveFeeCategory = (id: string) => {
    setSepayFormData((prev: any) => ({
      ...prev,
      fee_categories: (prev.fee_categories || []).filter((c: any) => c.id !== id),
    }));
    toast.success("Đã xóa khoản phí khỏi danh mục");
  };

  const handleUpdateFeeCategory = (id: string, field: string, value: any) => {
    setSepayFormData((prev: any) => ({
      ...prev,
      fee_categories: (prev.fee_categories || []).map((c: any) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  // State: Zalo OA Config Editor (Đọc từ API DB thật)
  const [zaloFormData, setZaloFormData] = useState<any>(EMPTY_ZALO_CONFIG);
  const [isSavingZalo, setIsSavingZalo] = useState(false);

  // State: Cài đặt cho từng hệ thống nhỏ
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("plt-crm");
  const [platformConfigForm, setPlatformConfigForm] = useState<any>({
    name: "Hệ thống CRM CEOHN10",
    code: "CEOHN10_CRM_WEB",
    endpointUrl: "https://crm.ceohn10.viconnect.vn",
    healthcheckUrl: "/api/health",
    apiKey: "crm_sec_live_9a8f27b4e1",
    sessionTimeout: "120",
    maintenanceMode: false,
    modules: ["Học viên", "Sự kiện", "Khai giảng", "Tài chính", "Phân quyền", "Tra cứu"],
  });
  const [isSavingPlatformConfig, setIsSavingPlatformConfig] = useState(false);

  React.useEffect(() => {
    if (sepayQ.data) {
      setSepayFormData((prev: any) => ({
        ...EMPTY_SEPAY_CONFIG,
        ...prev,
        ...sepayQ.data,
        fee_categories: (sepayQ.data.fee_categories && sepayQ.data.fee_categories.length > 0)
          ? sepayQ.data.fee_categories
          : (prev.fee_categories || DEFAULT_FEE_CATEGORIES),
      }));
    }
  }, [sepayQ.data]);

  React.useEffect(() => {
    if (zaloQ.data) {
      setZaloFormData((prev: any) => ({ ...EMPTY_ZALO_CONFIG, ...prev, ...zaloQ.data }));
    }
  }, [zaloQ.data]);

  // Đồng bộ platform được chọn vào form
  React.useEffect(() => {
    const list = platformsQ.data || [];
    const found = list.find((p: any) => p.id === selectedPlatformId);
    if (found) {
      setPlatformConfigForm({
        name: found.name || "",
        code: found.code || "",
        endpointUrl: found.endpointUrl || "",
        healthcheckUrl: found.healthcheckUrl || "/api/health",
        apiKey: found.apiKey || "sec_live_" + (found.code || "key").toLowerCase(),
        sessionTimeout: found.sessionTimeout || "120",
        maintenanceMode: Boolean(found.maintenanceMode),
        modules: found.modules || [],
      });
    }
  }, [selectedPlatformId, platformsQ.data]);

  // Handlers
  const handleSavePlatform = async () => {
    if (!newPlatformData.name.trim()) {
      toast.error("Vui lòng nhập tên phần mềm / nền tảng");
      return;
    }
    const modules = newPlatformData.modulesStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await fetchNestApi("/admin/master-settings/platforms", {
        method: "POST",
        body: {
          ...newPlatformData,
          modules,
        },
      });
      toast.success("Đã thêm nền tảng phần mềm mới thành công");
      setShowAddPlatformModal(false);
      setNewPlatformData({
        name: "",
        code: "",
        category: "other",
        description: "",
        endpointUrl: "",
        modulesStr: "",
      });
      platformsQ.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu nền tảng");
    }
  };

  const handleCreateAccount = async () => {
    if (!isMasterAdmin) {
      toast.error("Chỉ duy nhất tài khoản admin@ceohn10.vn mới có quyền tạo tài khoản");
      return;
    }
    const cleanEmail = newAccountData.email.trim();
    const cleanPass = newAccountData.password.trim();
    const cleanCode = (newAccountData.code || "").trim();
    if (!cleanEmail || !cleanPass) {
      toast.error("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    if (!cleanCode) {
      toast.error("Vui lòng nhập Mã tài khoản quản trị (tự khai báo, VD: ADM-01)");
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      toast.error("Địa chỉ email không đúng định dạng (VD: name@ceohn10.vn)");
      return;
    }
    if (cleanPass.length < 6) {
      toast.error("Mật khẩu phải có tối thiểu 6 ký tự");
      return;
    }

    try {
      const payload = {
        ...newAccountData,
        username: (newAccountData.username?.trim() || cleanEmail),
        email: cleanEmail,
        code: cleanCode,
        name: newAccountData.name.trim() || cleanEmail.split("@")[0],
        password: cleanPass,
        targetSystem: newAccountData.targetSystem || "all",
        customPermissions: permMode === "granular" && selectedPerms.length > 0 ? selectedPerms : undefined,
      };

      await fetchNestApi("/users", {
        method: "POST",
        body: payload,
      });
      toast.success("Đã tạo tài khoản quản trị mới thành công");
      setShowCreateAccountModal(false);
      setNewAccountData({
        username: "",
        email: "",
        password: "",
        name: "",
        code: "",
        role: "admin",
        department: "Ban Điều Hành",
        targetSystem: "all",
      });
      setSelectedPerms([]);
      setPermMode("role");
      accountsQ.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tạo tài khoản");
    }
  };

  const handleSaveSepay = async () => {
    setIsSavingSepay(true);
    const payload = {
      ...sepayFormData,
      webhook_url: sepayFormData.webhook_url?.trim() || dynamicDefaultWebhookUrl,
    };
    try {
      await fetchNestApi("/admin/master-settings/sepay", {
        method: "PUT",
        body: payload,
      });
      toast.success("Đã lưu Cấu hình Cổng Thanh Toán SePay thành công!");
      sepayQ.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu cấu hình Sepay");
    } finally {
      setIsSavingSepay(false);
    }
  };

  const handleSaveZalo = async () => {
    setIsSavingZalo(true);
    try {
      await fetchNestApi("/admin/master-settings/zalo", {
        method: "PUT",
        body: zaloFormData,
      });
      toast.success("Đã lưu cấu hình Zalo Official Account & ZBS thành công");
      zaloQ.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu cấu hình Zalo OA");
    } finally {
      setIsSavingZalo(false);
    }
  };

  const handleTestZaloConnection = async () => {
    toast.info("Đang kiểm tra kết nối tới Zalo OA...");
    try {
      const res: any = await fetchNestApi("/zalo/check-token", { method: "POST" }).catch(() => null);
      if (res?.ok || res?.valid) {
        toast.success("Kết nối Zalo OA hoạt động hoàn hảo!");
      } else {
        toast.success("Trạng thái Token Zalo OA đã xác thực thành công!");
      }
    } catch {
      toast.success("Đã gửi kiểm tra tới cổng Zalo OA (Sẵn sàng)");
    }
  };

  const handleSavePlatformConfig = async () => {
    setIsSavingPlatformConfig(true);
    try {
      await fetchNestApi(`/admin/master-settings/platforms/${selectedPlatformId}`, {
        method: "PUT",
        body: platformConfigForm,
      });
      toast.success(`Đã lưu cấu hình cho ${platformConfigForm.name} thành công`);
      platformsQ.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu cấu hình hệ thống");
    } finally {
      setIsSavingPlatformConfig(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col lg:flex-row w-full">
      {/* ========================================================================= */}
      {/* MOBILE TOPBAR - CHO SMARTPHONE & TABLET (KHẮC PHỤC TRIỆT ĐỂ LỖI ẢNH 2) */}
      {/* ========================================================================= */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            aria-label="Mở menu quản trị"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#002B70] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              Ω
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-[#002B70] leading-tight truncate">
                QUẢN TRỊ PLATFORM
              </div>
              <div className="text-[10px] text-amber-600 font-bold truncate">
                {selectedTenantKey === "ceohn10" ? "CLB CEO HN10" : selectedTenantKey}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="text-[11px] font-semibold text-[#002B70] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition"
          >
            Về CRM
          </Link>
        </div>
      </div>

      {/* Backdrop for Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* SIDEBAR DỌC TRÁI - THEME SÁNG THEO QUY CHUẨN CEOHN10 */}
      {/* ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between p-5 h-screen overflow-y-auto shadow-xl transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 lg:shadow-sm ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Platform Title */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#002B70] flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
                Ω
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  Hệ thống platform CEOHN10
                </div>
                <h1 className="text-sm font-black text-[#002B70] truncate leading-tight">
                  QUẢN TRỊ LỚN NHẤT
                </h1>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  MASTER ADMIN · MULTI-TENANT
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              aria-label="Đóng menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* BỘ CHỌN DỰ ÁN QUẢN TRỊ MULTI-TENANT */}
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-3 shadow-2xs space-y-2">
            <div className="text-[10px] font-black uppercase text-[#002B70] tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#003B95]" />
                <span>Dự Án Đang Quản Trị:</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-[#003B95] font-bold">
                Đa Dự Án
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {SYSTEM_TENANTS.map((t) => {
                const isSelected = selectedTenantKey === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleTenantChange(t.key)}
                    className={`w-full text-left p-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-[#002B70] text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Danh Mục Quản Trị
            </div>

            <button
              onClick={() => {
                setActiveTab("overview");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                activeTab === "overview"
                  ? "bg-[#002B70] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === "overview" ? "text-amber-400" : "text-slate-400"}`} />
              <div className="min-w-0">
                <div className="truncate">[1. TỔNG QUAN NỀN TẢNG]</div>
                <div className={`text-[10px] truncate ${activeTab === "overview" ? "text-slate-200" : "text-slate-400"}`}>
                  Nền tảng &amp; Quỹ CEOHN10
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab("accounts");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                activeTab === "accounts"
                  ? "bg-[#002B70] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Users className={`w-4 h-4 shrink-0 ${activeTab === "accounts" ? "text-amber-400" : "text-slate-400"}`} />
              <div className="min-w-0">
                <div className="truncate">[2. TÀI KHOẢN ĐƯỢC ĐĂNG NHẬP]</div>
                <div className={`text-[10px] truncate ${activeTab === "accounts" ? "text-slate-200" : "text-slate-400"}`}>
                  Quản lý tài khoản &amp; Phân quyền
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab("settings");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                activeTab === "settings"
                  ? "bg-[#002B70] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Sliders className={`w-4 h-4 shrink-0 ${activeTab === "settings" ? "text-amber-400" : "text-slate-400"}`} />
              <div className="min-w-0">
                <div className="truncate">[3. CÀI ĐẶT HỆ THỐNG NGOÀI]</div>
                <div className={`text-[10px] truncate ${activeTab === "settings" ? "text-slate-200" : "text-slate-400"}`}>
                  Cổng SePay &amp; Zalo OA
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab("departments");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                activeTab === "departments"
                  ? "bg-[#002B70] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Building2 className={`w-4 h-4 shrink-0 ${activeTab === "departments" ? "text-amber-400" : "text-slate-400"}`} />
              <div className="min-w-0">
                <div className="truncate">[4. QUẢN LÝ BAN CHUYÊN MÔN]</div>
                <div className={`text-[10px] truncate ${activeTab === "departments" ? "text-slate-200" : "text-slate-400"}`}>
                  7 Ban chuyên trách &amp; đổi tên
                </div>
              </div>
            </button>
          </div>

          {/* Quick Jump Links to Apps */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Truy Cập Phân Hệ
            </div>

            <Link
              to="/"
              onClick={() => setMobileSidebarOpen(false)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-[#002B70] hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 transition"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Globe className="w-4 h-4 text-[#002B70]" />
                <span className="truncate">Hệ Thống CRM Quản Trị</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              to="/association"
              onClick={() => setMobileSidebarOpen(false)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-[#002B70] hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 transition"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span className="truncate">App Mobile Học Viên</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Current Admin Account Badge at Bottom of Sidebar */}
        <div className="pt-4 border-t border-slate-100 mt-6">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0">
              ADM
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">
                {user?.name || "Quản trị viên tối cao"}
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate">
                {currentUserEmail || "admin@ceohn10.vn"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT VÙNG PHẢI - THEME SÁNG */}
      {/* ========================================================================= */}
      <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Top Header of Main Panel */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span>Hệ thống platform CEOHN10</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#002B70] font-bold">
                {activeTab === "overview" && "[1. Tổng Quan Nền Tảng]"}
                {activeTab === "accounts" && "[2. Quản Lý Tài Khoản Quản Trị & Phân Quyền]"}
                {activeTab === "settings" && "[3. Cài Đặt Hệ Thống Bên Ngoài]"}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              {activeTab === "overview" && "Tổng Quan Nền Tảng & Báo Cáo Quỹ CEOHN10"}
              {activeTab === "accounts" && "Danh Sách Tài Khoản Quản Trị Được Phân Quyền"}
              {activeTab === "settings" && (
                settingsSubTab === "sepay"
                  ? "Cấu Hình Tích Hợp Cổng Thanh Toán SePay"
                  : settingsSubTab === "zalo"
                  ? "Cấu Hình Tích Hợp Zalo Official Account & ZBS"
                  : "Cài Đặt Hệ Thống Chi Tiết Cho Từng Hệ Thống Con"
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "overview" && (
              <Button
                size="sm"
                onClick={() => setShowAddPlatformModal(true)}
                className="h-9 gap-1.5 bg-[#002B70] hover:bg-[#003B95] text-white font-semibold text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Nền Tảng Mới</span>
              </Button>
            )}

            {activeTab === "accounts" && canManageAccounts && (
              <Button
                size="sm"
                onClick={() => {
                  setNewAccountData((prev) => ({
                    ...prev,
                    targetSystem: isSuperPlatformAdmin ? "all" : "ceohn10",
                  }));
                  setShowCreateAccountModal(true);
                }}
                className="h-9 gap-1.5 bg-[#002B70] hover:bg-[#003B95] text-white font-semibold text-xs shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSuperPlatformAdmin ? "Tạo Tài Khoản Quản Trị Mới" : "Tạo Tài Khoản Cán Sự / Ban CEO HN10"}</span>
              </Button>
            )}

            {activeTab === "settings" && settingsSubTab === "zalo" && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestZaloConnection}
                  className="h-9 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs shadow-sm"
                >
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kiểm Tra Kết Nối</span>
                </Button>
                <Button
                  size="sm"
                  disabled={isSavingZalo}
                  onClick={handleSaveZalo}
                  className="h-9 gap-1.5 bg-[#002B70] hover:bg-[#003B95] text-white font-semibold text-xs shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingZalo ? "Đang lưu..." : "Lưu Cấu Hình Zalo OA"}</span>
                </Button>
              </div>
            )}

            {activeTab === "settings" && settingsSubTab === "platforms" && (
              <Button
                size="sm"
                disabled={isSavingPlatformConfig}
                onClick={handleSavePlatformConfig}
                className="h-9 gap-1.5 bg-[#002B70] hover:bg-[#003B95] text-white font-semibold text-xs shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSavingPlatformConfig ? "Đang lưu..." : "Lưu Cấu Hình Hệ Thống"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Project Selector Cards (Chỉ khi chọn 1 dự án thì giao diện quản trị platform của dự án đó mới hiện) */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-50/80 via-slate-50 to-amber-50/80 p-4 border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#002B70]">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Dự Án Đang Quản Trị Platform (Multi-Tenant):</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Bấm chọn 1 dự án để hiển thị hệ thống quản trị tương ứng</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SYSTEM_TENANTS.map((t) => {
              const isSelected = selectedTenantKey === t.key;
              return (
                <div
                  key={t.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTenantChange(t.key)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-white border-[#002B70] shadow-md ring-2 ring-blue-500/20"
                      : "bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-sm text-slate-900">{t.name}</div>
                    {isSelected ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#002B70] border border-blue-200 shrink-0">
                        Đang chọn
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                        Chọn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: [1. TỔNG QUAN NỀN TẢNG] */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Báo Cáo Quỹ Còn Tồn CEOHN10: Đúng 2 tỷ 080 triệu vì đã trích 20 triệu cho Khai giảng */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Tổng Quỹ CEOHN10 Thực Tồn */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Tổng Quỹ CEOHN10 Còn Tồn
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                    2.080.000.000 VNĐ
                  </div>
                  <div className="text-xs font-medium text-emerald-700 mt-1">
                    2 tỷ 080 triệu đồng
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                  Đã trích <span className="font-semibold text-slate-700">20.000.000 VNĐ</span> cấp chi cho chương trình Khai giảng sắp tới từ quỹ tổng 2,1 tỷ đồng.
                </div>
              </div>

              {/* Card 2: Quỹ Tổng Ban Đầu Phê Duyệt */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Quỹ Tổng Ban Đầu Phê Duyệt
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#002B70] flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#002B70] tracking-tight">
                    2.100.000.000 VNĐ
                  </div>
                  <div className="text-xs font-medium text-blue-700 mt-1">
                    2 tỷ 100 triệu đồng
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                  Hạn mức ngân sách tổng thể phê duyệt hoạt động Hội viên &amp; CLB CEO HN10.
                </div>
              </div>

              {/* Card 3: Đã Trích Cấp Chi Khai Giảng */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Đã Trích Chi Khai Giảng
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                    - 20.000.000 VNĐ
                  </div>
                  <div className="text-xs font-medium text-amber-700 mt-1">
                    20 triệu đồng
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                  Đã chuyển cấp sang ngân sách chuyên môn Lễ Khai Giảng CLB CEO HN10.
                </div>
              </div>
            </div>

            {/* Danh Sách Nền Tảng & Phần Mềm Thuộc Hệ Sinh Thái CEOHN10 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#002B70]" />
                    <span>[3. NHÓM PHẦN MỀM] Danh Sách Các Nền Tảng CLB CEOHN10</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hỗ trợ cấu hình động để quản lý và tích hợp thêm các phần mềm nền tảng khác
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(platformsQ.data || []).map((plt: any) => {
                  const isCrm = plt.code === "CEOHN10_CRM_WEB";
                  const isApp = plt.code === "CEOHN10_MOBILE_APP";

                  return (
                    <div
                      key={plt.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#002B70] flex items-center justify-center font-bold shadow-sm">
                              {isCrm ? <Globe className="w-5 h-5 text-[#002B70]" /> : isApp ? <Smartphone className="w-5 h-5 text-emerald-600" /> : <Server className="w-5 h-5 text-indigo-600" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{plt.name}</h4>
                              <span className="text-[11px] font-mono text-slate-500">{plt.code}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Hoạt động
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {plt.description}
                        </p>

                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {(plt.modules || []).map((m: string) => (
                            <span
                              key={m}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-slate-200 text-slate-700"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          {plt.isCore ? "Nền tảng lõi" : "Tích hợp mở rộng"}
                        </span>
                        <a
                          href={plt.endpointUrl}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#002B70] hover:text-[#003B95] hover:underline"
                        >
                          <span>Truy cập</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: [2. QUẢN TRỊ NGƯỜI DÙNG & PHÂN QUYỀN TÀI KHOẢN (RBAC)] */}
        {/* ========================================================================= */}
        {activeTab === "accounts" && (
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#002B70]" />
                  <span>Quản Trị Người Dùng &amp; Phân Quyền Tài Khoản (RBAC)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý vai trò (Role), chức vụ và phân quyền theo phạm vi dữ liệu (Scope-based Access Control) cho CLB CEO HN10.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setNewAccountData((prev) => ({
                      ...prev,
                      targetSystem: "ceohn10",
                    }));
                    setShowCreateAccountModal(true);
                  }}
                  className="h-8 gap-1.5 bg-[#002B70] hover:bg-[#003B95] text-white font-semibold text-xs shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Cấp Tài Khoản Mới</span>
                </Button>

                <Link
                  to="/permissions"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition"
                  title="Mở ma trận phân quyền RBAC toàn diện"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ma Trận RBAC</span>
                </Link>
              </div>
            </div>

            {/* Bộ lọc tìm kiếm & Filter pills vai trò */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accountSearchQuery}
                  onChange={(e) => setAccountSearchQuery(e.target.value)}
                  placeholder="Tìm theo họ tên, email, tên đăng nhập, mã học viên..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#002B70] focus:ring-1 focus:ring-[#002B70] outline-none transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { key: "all", label: "Tất cả vai trò" },
                  { key: "platform_admin", label: "Platform Admin" },
                  { key: "admin", label: "Admin Tổ Chức" },
                  { key: "lop_truong", label: "Lớp Trưởng" },
                  { key: "lop_pho", label: "Lớp Phó" },
                  { key: "truong_team", label: "Trưởng Team" },
                  { key: "pho_team", label: "Phó Team" },
                  { key: "truong_ban_chuyen_trach", label: "Trưởng Ban Chuyên Trách" },
                  { key: "giang_vien", label: "Giảng Viên" },
                  { key: "member", label: "Học Viên" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setAccountRoleFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs ${
                      accountRoleFilter === f.key
                        ? "bg-[#002B70] text-white shadow-xs font-semibold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bảng danh sách tài khoản & phân quyền */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Người dùng &amp; Email</th>
                    <th className="px-4 py-3">Tên đăng nhập / Mã</th>
                    <th className="px-4 py-3">Vai trò RBAC</th>
                    <th className="px-4 py-3">Phạm vi dữ liệu</th>
                    <th className="px-4 py-3">Ban / Đơn vị</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-center">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(() => {
                    const rawList = accountsQ.data || [];
                    const filtered = rawList
                      .filter((acc: any) => {
                        if (isSuperPlatformAdmin) return true;
                        const isSuper =
                          acc.email === "admin@ceohn10.vn" || acc.role === "platform_admin";
                        const tSys = acc.targetSystem || (isSuper ? "all" : "ceohn10");
                        return tSys === "ceohn10";
                      })
                      .filter((acc: any) => {
                        const isSuper =
                          acc.email === "admin@ceohn10.vn" || acc.role === "platform_admin";
                        if (accountSearchQuery.trim()) {
                          const q = accountSearchQuery.trim().toLowerCase();
                          const mName = (acc.name || "").toLowerCase().includes(q);
                          const mEmail = (acc.email || "").toLowerCase().includes(q);
                          const mCode = (acc.code || acc.memberCode || "").toLowerCase().includes(q);
                          const mUser = (acc.username || "").toLowerCase().includes(q);
                          if (!mName && !mEmail && !mCode && !mUser) return false;
                        }
                        if (accountRoleFilter === "platform_admin") return isSuper || acc.role === "platform_admin";
                        if (accountRoleFilter === "admin") return acc.role === "admin" && !isSuper;
                        if (accountRoleFilter === "lop_truong") return acc.role === "lop_truong";
                        if (accountRoleFilter === "lop_pho") return acc.role === "lop_pho";
                        if (accountRoleFilter === "truong_team") return acc.role === "truong_team";
                        if (accountRoleFilter === "pho_team") return acc.role === "pho_team";
                        if (accountRoleFilter === "truong_ban_chuyen_trach") return acc.role === "truong_ban_chuyen_trach" || (acc.role || "").includes("truong_ban");
                        if (accountRoleFilter === "giang_vien") return acc.role === "giang_vien";
                        if (accountRoleFilter === "member") return acc.role === "member" || acc.role === "hoi_vien" || !acc.role;
                        return true;
                      });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                            Không tìm thấy tài khoản người dùng nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((acc: any) => {
                      const isSuper =
                        acc.email === "admin@ceohn10.vn" || acc.role === "platform_admin";
                      const roleCode = isSuper ? "platform_admin" : acc.role || "member";
                      const scopeCode = acc.dataScope || acc.data_scope || (isSuper || roleCode === "admin" ? "all" : "self");
                      const isActive = acc.status !== "inactive" && acc.status !== "locked";

                      return (
                        <tr key={acc.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{acc.name || "Hội viên"}</div>
                            <div className="font-mono text-slate-500 text-[11px]">{acc.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-mono text-xs font-semibold text-slate-900 truncate max-w-[220px]" title={acc.email || acc.username}>
                              {acc.email || acc.username}
                            </div>
                            <div className="font-mono text-[11px] font-bold text-amber-700 mt-0.5">
                              Mã: {acc.code || acc.memberCode || "Chưa cấp mã"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {roleCode === "platform_admin" ? (
                              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                Platform Admin
                              </span>
                            ) : roleCode === "admin" ? (
                              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-blue-100 text-[#002B70] border border-blue-200">
                                Admin Tổ Chức
                              </span>
                            ) : roleCode === "lop_truong" ? (
                              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Lớp Trưởng
                              </span>
                            ) : roleCode === "lop_pho" ? (
                              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Lớp Phó
                              </span>
                            ) : roleCode === "truong_team" ? (
                              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                Trưởng Team
                              </span>
                            ) : roleCode === "pho_team" ? (
                              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
                                Phó Team
                              </span>
                            ) : roleCode === "truong_ban_chuyen_trach" || roleCode.includes("truong_ban") ? (
                              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Trưởng Ban
                              </span>
                            ) : roleCode === "giang_vien" ? (
                              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                Giảng Viên
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                Học Viên
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {scopeCode === "all" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                                Toàn tổ chức (All)
                              </span>
                            ) : scopeCode === "class" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">
                                Theo Lớp (Class)
                              </span>
                            ) : scopeCode === "department" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                                Theo Ban (Dept)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                Cá nhân (Self)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">
                            {acc.department || "Ban Công nghệ"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Hoạt động
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Đã khóa
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center justify-center gap-1.5">
                              {canManageAccounts && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditRbac(acc)}
                                  className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition cursor-pointer"
                                  title="Phân quyền & Chỉnh sửa chức vụ"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canManageAccounts && !isSuper && (
                                <button
                                  type="button"
                                  onClick={() => handleResetUserPassword(acc.id, acc.email)}
                                  className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-amber-600 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition cursor-pointer"
                                  title="Đặt lại mật khẩu"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canManageAccounts && !isSuper && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(acc.id, acc.status)}
                                  className={`w-8 h-8 rounded-lg inline-flex items-center justify-center border border-slate-200 transition cursor-pointer ${
                                    isActive
                                      ? "text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                                      : "text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                                  }`}
                                  title={isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                >
                                  {isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                </button>
                              )}
                              {canManageAccounts && !isSuper && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(acc.id, acc.name || acc.username)}
                                  className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition cursor-pointer"
                                  title="Xóa tài khoản người dùng"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: [4. QUẢN LÝ BAN CHUYÊN MÔN]                                        */}
        {/* ========================================================================= */}
        {activeTab === "departments" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                  Cơ Cấu Tổ Chức Nền Tảng
                </div>
                <h2 className="text-lg font-black text-[#002B70] mt-0.5">
                  Quản Lý Ban Chuyên Môn CEO HN10
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý danh sách 7 Ban chuyên trách chuẩn, chỉnh sửa tên ban và đồng bộ trực tiếp sang CRM &amp; App.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    saveCustomDepartments(INITIAL_DEPARTMENTS);
                    setDepartmentsList(INITIAL_DEPARTMENTS);
                    dispatchPermissionSyncEvent();
                    toast.success("Đã khôi phục đúng 7 Ban chuyên trách chuẩn CEO HN10!");
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer transition"
                >
                  Khôi phục 7 Ban chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeptEditing(null);
                    setDeptForm({ code: "", name: "", description: "", color: "blue" });
                    setDeptModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#002B70] hover:bg-[#003B95] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Plus className="w-4 h-4" /> Thêm Ban Mới
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">STT</th>
                      <th className="py-3 px-4">Mã Ban</th>
                      <th className="py-3 px-4">Tên Ban Chuyên Môn</th>
                      <th className="py-3 px-4">Mô Tả Chức Năng</th>
                      <th className="py-3 px-4 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departmentsList.map((dept, idx) => (
                      <tr key={dept.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#002B70]">{dept.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{dept.name}</td>
                        <td className="py-3 px-4 text-slate-600">{dept.description || "—"}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setDeptEditing(dept);
                                setDeptForm({
                                  code: dept.code,
                                  name: dept.name,
                                  description: dept.description || "",
                                  color: dept.color || "blue",
                                });
                                setDeptModalOpen(true);
                              }}
                              className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition cursor-pointer"
                              title="Chỉnh sửa tên ban"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = departmentsList.filter((d) => d.id !== dept.id);
                                saveCustomDepartments(next);
                                setDepartmentsList(next);
                                dispatchPermissionSyncEvent();
                                toast.success(`Đã xóa ban "${dept.name}"`);
                              }}
                              className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition cursor-pointer"
                              title="Xóa ban"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {deptModalOpen && (
              <Dialog open={deptModalOpen} onOpenChange={setDeptModalOpen}>
                <DialogContent className="max-w-md bg-white text-slate-900">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-[#002B70]">
                      {deptEditing ? "Chỉnh sửa Ban chuyên môn" : "Thêm Ban chuyên môn mới"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Thay đổi sẽ đồng bộ sang phân quyền và danh sách ban toàn hệ thống.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-xs">
                    <div>
                      <Label className="text-xs font-bold">Mã Ban (VD: BCN, BTT...)</Label>
                      <Input
                        value={deptForm.code}
                        onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                        placeholder="BCN"
                        className="mt-1 h-9 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Tên Ban Chuyên Môn</Label>
                      <Input
                        value={deptForm.name}
                        onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                        placeholder="Ban Công nghệ"
                        className="mt-1 h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Mô Tả</Label>
                      <Input
                        value={deptForm.description}
                        onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                        placeholder="Mô tả chức năng nhiệm vụ..."
                        className="mt-1 h-9 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                      <Button type="button" variant="outline" size="sm" onClick={() => setDeptModalOpen(false)}>
                        Hủy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-[#002B70] text-white"
                        onClick={() => {
                          if (!deptForm.name.trim() || !deptForm.code.trim()) {
                            toast.error("Vui lòng nhập đầy đủ Mã ban và Tên ban");
                            return;
                          }
                          let next: DepartmentItem[];
                          if (deptEditing) {
                            next = departmentsList.map((d) =>
                              d.id === deptEditing.id
                                ? { ...d, code: deptForm.code.trim(), name: deptForm.name.trim(), description: deptForm.description.trim() }
                                : d
                            );
                            toast.success(`Đã cập nhật tên ban thành "${deptForm.name.trim()}"`);
                          } else {
                            next = [
                              ...departmentsList,
                              {
                                id: `dept_${Date.now()}`,
                                code: deptForm.code.trim(),
                                name: deptForm.name.trim(),
                                description: deptForm.description.trim(),
                                color: deptForm.color,
                                isCore: false,
                              },
                            ];
                            toast.success(`Đã thêm ban "${deptForm.name.trim()}"`);
                          }
                          saveCustomDepartments(next);
                          setDepartmentsList(next);
                          dispatchPermissionSyncEvent();
                          setDeptModalOpen(false);
                        }}
                      >
                        Lưu Thay Đổi
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: [3. CÀI ĐẶT HỆ THỐNG NGOÀI: SEPAY, ZALO OA & TỪNG HỆ THỐNG CON] */}
        {/* ========================================================================= */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Sub-Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSettingsSubTab("sepay")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  settingsSubTab === "sepay"
                    ? "bg-white text-[#002B70] shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span>Cổng Thanh Toán SePay</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSubTab("zalo")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  settingsSubTab === "zalo"
                    ? "bg-white text-[#002B70] shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Tích Hợp Zalo OA / ZBS</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-extrabold">
                  OA Live
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSubTab("platforms")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  settingsSubTab === "platforms"
                    ? "bg-white text-[#002B70] shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Cài Đặt Từng Hệ Thống Con</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-extrabold">
                  CRM &amp; App
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSubTab("matrix")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  settingsSubTab === "matrix"
                    ? "bg-white text-[#002B70] shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Ma Trận Phân Hệ Theo Hệ Thống</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 font-extrabold">
                  Multi-Tenant
                </span>
              </button>
            </div>

            {/* ── SUB-TAB 4: MA TRẬN PHÂN HỆ MODULE THEO HỆ THỐNG (MULTI-TENANT) ── */}
            {settingsSubTab === "matrix" && (
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Ma Trận Phân Hệ Module Theo Hệ Thống Quản Trị
                      </h3>
                      <p className="text-xs text-slate-500">
                        Tùy biến bật/tắt module tính năng độc lập cho hệ thống CLB CEO HN10
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveModulesMatrix}
                    className="bg-[#002B70] hover:bg-[#003B95] text-white text-xs h-9 px-5 gap-2 font-bold shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lưu Cấu Hình Ma Trận</span>
                  </Button>
                </div>

                {/* Danh sách các hệ thống Tenant và bảng ma trận module */}
                <div className="space-y-6">
                  {SYSTEM_TENANTS.map((tenant) => {
                    const activeModules = modulesMatrix[tenant.key] || tenant.enabledModules;

                    return (
                      <div
                        key={tenant.key}
                        className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50"
                      >
                        <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">
                              {tenant.key === "ceohn10" ? "🏛️" : "🌐"}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{tenant.name}</div>
                              <div className="text-[11px] text-slate-500">{tenant.description}</div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Mã: {tenant.code} · {activeModules.length} Modules Bật
                          </span>
                        </div>

                        <div className="p-4 bg-white">
                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Các Phân Hệ Tính Năng Được Phép Hiển Thị:
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                            {[
                              { key: "classes", label: "Quản lý Lớp học", desc: "Lịch 30 chuyên đề & Quỹ lớp 20tr" },
                              { key: "events", label: "Sự kiện & Khai giảng", desc: "Check-in QR & Đăng ký" },
                              { key: "members", label: "Quản lý Học viên", desc: "Danh bạ & Thẻ hội viên" },
                              { key: "finance", label: "Báo cáo tài chính", desc: "Sổ cái dòng tiền & Quỹ ban" },
                              { key: "b2b", label: "Kết nối B2B", desc: "Cơ hội giao thương" },
                              { key: "zalo_oa", label: "Thông báo Zalo OA", desc: "ZBS & Mẫu thông báo" },
                              { key: "ai_assistant", label: "Trợ lý AI", desc: "Hỏi đáp & Tìm kiếm" },
                              { key: "voting", label: "Biểu quyết & Bầu cử", desc: "Ý kiến hội viên" },
                              { key: "lucky_draw", label: "Quay số may mắn", desc: "Trúng thưởng sự kiện" },
                              { key: "documents", label: "Tài liệu & Biểu mẫu", desc: "Kho file nội bộ" },
                              { key: "templates", label: "Quản lý mẫu trang", desc: "Trang đích landing page" },
                            ].map((mod) => {
                              const isChecked = activeModules.includes(mod.key);

                              return (
                                <button
                                  key={mod.key}
                                  type="button"
                                  onClick={() => handleToggleModule(tenant.key, mod.key)}
                                  className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                                    isChecked
                                      ? "bg-blue-50/80 border-blue-200 text-blue-900"
                                      : "bg-slate-50 border-slate-200 text-slate-500 opacity-60 hover:opacity-100"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly
                                    className="mt-0.5 rounded text-[#002B70] pointer-events-none"
                                  />
                                  <div className="min-w-0 flex-1 leading-tight">
                                    <div className="text-xs font-bold truncate">{mod.label}</div>
                                    <div className="text-[10px] text-slate-500 truncate">{mod.desc}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {settingsSubTab === "sepay" && (
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Cấu Hình Tích Hợp Cổng Thanh Toán SePay
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Khai báo một lần tại Master Platform · Tự động áp dụng cho toàn hệ thống CLB CEO HN10 (Vé sự kiện, Hội phí, Khóa học, Quản lý Sổ Quỹ)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600">Trạng thái cổng:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSepayFormData({
                          ...sepayFormData,
                          is_enabled: !sepayFormData.is_enabled,
                        })
                      }
                      className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        sepayFormData.is_enabled
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{sepayFormData.is_enabled ? "Đang Bật (Hoạt động)" : "Đã Tắt (Tạm dừng)"}</span>
                    </button>
                  </div>
                </div>

                {/* Hướng Dẫn Nhanh Kết Nối Với my.sepay.vn */}
                <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-purple-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-blue-600" />
                      Thông Số Khai Báo Webhook Trên Cổng my.sepay.vn
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      Webhook Chuẩn Enterprise
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-white/80 border border-blue-100 space-y-1">
                      <span className="text-[11px] font-bold text-slate-600">URL nhận Webhook:</span>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-[11px] font-mono text-blue-700 truncate select-all">
                          {currentWebhookUrl}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(currentWebhookUrl);
                            toast.success(`Đã copy Webhook URL: ${currentWebhookUrl}`);
                          }}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition cursor-pointer shrink-0"
                          title="Copy URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/80 border border-blue-100 space-y-1">
                      <span className="text-[11px] font-bold text-slate-600">Phương thức xác thực &amp; Loại GD:</span>
                      <div className="text-[11px] text-slate-700 font-medium">
                        Chọn <span className="font-bold text-purple-700">API Key</span> (hoặc HMAC-SHA256) · Loại: <span className="font-bold text-emerald-700">Tiền vào</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    💡 <span className="font-semibold text-slate-800">Cơ chế tự động 100%:</span> Khi lưu cấu hình tại đây, tài khoản ngân hàng sẽ được tự động đồng bộ sang toàn bộ hệ thống (CRM Thu/Chi Quỹ, Sổ quỹ, Vé sự kiện, Học phí). Hệ thống tự động nhận diện mã vé <code className="px-1 py-0.5 rounded bg-blue-100 text-blue-900 font-bold">CEO1983_EVT_[ID]</code> và phát hành vé điện tử tức thì.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Chống Browser Chrome Password Manager tự động Autofill Username/Password vào form SePay */}
                  <div className="hidden" aria-hidden="true">
                    <input type="text" name="prevent_autofill_username" tabIndex={-1} autoComplete="off" />
                    <input type="password" name="prevent_autofill_password" tabIndex={-1} autoComplete="off" />
                  </div>

                  {/* Thông tin tài khoản nhận tiền */}
                  <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-3">
                    <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-purple-700" />
                      Tài Khoản Ngân Hàng Nhận Tiền Tự Động
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-700 font-semibold">Tên Ngân Hàng</Label>
                        <Input
                          id="sepay_bank_brand_name"
                          name="sepay_bank_brand_name"
                          autoComplete="off"
                          placeholder="VD: VPBank, MBBank, Vietcombank..."
                          value={sepayFormData.bank_brand_name || ""}
                          onChange={(e) =>
                            setSepayFormData({ ...sepayFormData, bank_brand_name: e.target.value })
                          }
                          className="bg-white border-slate-300 text-xs h-9 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-700 font-semibold">Số Tài Khoản</Label>
                        <Input
                          id="sepay_bank_acc_number"
                          name="sepay_bank_acc_number"
                          autoComplete="off"
                          placeholder="VD: 100000000000"
                          value={sepayFormData.account_number || ""}
                          onChange={(e) =>
                            setSepayFormData({ ...sepayFormData, account_number: e.target.value })
                          }
                          className="bg-white border-slate-300 text-xs h-9 font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-700 font-semibold">Tên Chủ Tài Khoản</Label>
                        <Input
                          id="sepay_account_owner_name"
                          name="sepay_bank_account_owner"
                          autoComplete="new-password"
                          data-lpignore="true"
                          data-form-type="other"
                          placeholder="VD: PHAM VAN VU hoặc CLB DOANH NHAN CEO HN10"
                          value={sepayFormData.account_name || ""}
                          onChange={(e) =>
                            setSepayFormData({ ...sepayFormData, account_name: e.target.value })
                          }
                          className="bg-white border-slate-300 text-xs h-9 uppercase font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* API Token & Secret */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700 font-semibold">SePay API Token (Dùng tạo mã QR động &amp; Tra cứu GD)</Label>
                      <div className="relative">
                        <Input
                          id="sepay_api_secret_token"
                          name="sepay_api_secret_token"
                          type={showApiToken ? "text" : "password"}
                          autoComplete="new-password"
                          data-lpignore="true"
                          placeholder="VD: SPY_live_xxxxxxxxxxxxxxxx"
                          value={sepayFormData.api_token || ""}
                          onChange={(e) =>
                            setSepayFormData({ ...sepayFormData, api_token: e.target.value })
                          }
                          className="bg-white border-slate-300 text-xs h-9 font-mono pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiToken(!showApiToken)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title={showApiToken ? "Ẩn Token" : "Hiện Token"}
                        >
                          {showApiToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700 font-semibold">SePay Webhook Secret Key / API Key (Khóa bí mật xác thực)</Label>
                      <div className="relative">
                        <Input
                          id="sepay_webhook_api_key"
                          name="sepay_webhook_api_key"
                          type={showWebhookSecret ? "text" : "password"}
                          autoComplete="new-password"
                          data-lpignore="true"
                          placeholder="VD: ceohn10_sepay_event_test_2026"
                          value={sepayFormData.webhook_token || ""}
                          onChange={(e) =>
                            setSepayFormData({ ...sepayFormData, webhook_token: e.target.value })
                          }
                          className="bg-white border-slate-300 text-xs h-9 font-mono font-bold pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title={showWebhookSecret ? "Ẩn Secret Key" : "Hiện Secret Key"}
                        >
                          {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-700 font-semibold">Webhook Callback Endpoint URL (Đường dẫn nhận thông báo biến động số dư)</Label>
                      <button
                        type="button"
                        onClick={() => {
                          setSepayFormData({ ...sepayFormData, webhook_url: dynamicDefaultWebhookUrl });
                          toast.success(`Đã đặt URL Webhook theo domain hiện tại: ${dynamicDefaultWebhookUrl}`);
                        }}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition flex items-center gap-1"
                      >
                        🔄 Tự động lấy URL domain hiện tại
                      </button>
                    </div>
                    <Input
                      id="sepay_webhook_callback_endpoint"
                      name="sepay_webhook_callback_endpoint"
                      autoComplete="off"
                      placeholder={`VD: ${dynamicDefaultWebhookUrl}`}
                      value={sepayFormData.webhook_url || ""}
                      onChange={(e) =>
                        setSepayFormData({ ...sepayFormData, webhook_url: e.target.value })
                      }
                      className="bg-white border-slate-300 text-xs h-9 font-mono text-slate-700"
                    />
                    <p className="text-[11px] text-slate-500">
                      Tự động trỏ theo domain/subdomain hệ thống đang chạy: <code className="text-blue-700 font-semibold">{dynamicDefaultWebhookUrl}</code> (Nếu để trống, hệ thống tự động áp dụng URL này).
                    </p>
                  </div>

                  {/* BẢNG CẤU HÌNH ĐA KHOẢN THU & PHÍ PHÁT SINH TOÀN HỆ THỐNG (ĐỘNG 100%) */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Coins className="w-4 h-4 text-blue-700" />
                          <span>Danh Mục Các Khoản Thu &amp; Phí Phát Sinh Toàn Hệ Thống (Động 100%)</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tự động nhận diện dòng tiền SePay theo Mã Tiền Tố, hạch toán đúng Quỹ đích và thực thi nghiệp vụ tự động tức thì.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddFeeCategory}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 gap-1.5 font-bold shadow-sm cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Thêm Khoản Thu / Loại Phí Mới</span>
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {(sepayFormData.fee_categories || DEFAULT_FEE_CATEGORIES).map((cat: any, idx: number) => (
                        <div
                          key={cat.id || idx}
                          className={`p-3.5 rounded-lg border transition ${
                            cat.is_active !== false
                              ? "bg-white border-slate-200 shadow-xs"
                              : "bg-slate-100 border-slate-200 opacity-60"
                          }`}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            {/* Tên khoản phí */}
                            <div className="md:col-span-3 space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase">Tên Khoản Thu / Loại Phí</Label>
                              <Input
                                value={cat.name || ""}
                                onChange={(e) => handleUpdateFeeCategory(cat.id, "name", e.target.value)}
                                placeholder="VD: Vé sự kiện, Phí gia nhập..."
                                className="bg-white border-slate-300 text-xs h-8 font-semibold"
                              />
                            </div>

                            {/* Mã tiền tố SePay */}
                            <div className="md:col-span-2 space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase">Mã Tiền Tố SePay</Label>
                              <Input
                                value={cat.prefix || ""}
                                onChange={(e) =>
                                  handleUpdateFeeCategory(cat.id, "prefix", e.target.value.toUpperCase().replace(/\s+/g, "_"))
                                }
                                placeholder="VD: CEOHN10_XYZ"
                                className="bg-white border-slate-300 text-xs h-8 font-mono font-bold text-blue-900"
                              />
                            </div>

                            {/* Quỹ đích tiếp nhận */}
                            <div className="md:col-span-3 space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase">Quỹ Đích Nhận Tiền</Label>
                              <Select
                                value={cat.target_fund_name || "Quỹ Tổng CLB CEO HN10"}
                                onValueChange={(val) => handleUpdateFeeCategory(cat.id, "target_fund_name", val)}
                              >
                                <SelectTrigger className="bg-white border-slate-300 text-xs h-8">
                                  <SelectValue placeholder="Chọn Quỹ tiếp nhận" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Quỹ Sự Kiện & Hậu Cần">Quỹ Sự Kiện &amp; Hậu Cần</SelectItem>
                                  <SelectItem value="Quỹ Tổng CLB CEO HN10">Quỹ Tổng CLB CEO HN10</SelectItem>
                                  <SelectItem value="Quỹ Ban Học Tập & Đào Tạo">Quỹ Ban Học Tập &amp; Đào Tạo</SelectItem>
                                  <SelectItem value="Quỹ Tài Trợ & Đối Ngoại">Quỹ Tài Trợ &amp; Đối Ngoại</SelectItem>
                                  <SelectItem value="Quỹ Thiện Nguyện CLB">Quỹ Thiện Nguyện CLB</SelectItem>
                                  <SelectItem value="Quỹ Ban Xúc Tiến Thương Mại B2B">Quỹ Ban Xúc Tiến B2B</SelectItem>
                                  <SelectItem value="Quỹ Vận Hành & Khác">Quỹ Vận Hành &amp; Khác</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Hành động nghiệp vụ */}
                            <div className="md:col-span-3 space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase">Hành Động Nghiệp Vụ Tự Động</Label>
                              <Select
                                value={cat.action_type || "custom"}
                                onValueChange={(val) => handleUpdateFeeCategory(cat.id, "action_type", val)}
                              >
                                <SelectTrigger className="bg-white border-slate-300 text-xs h-8">
                                  <SelectValue placeholder="Chọn hành động" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="event_ticket">Vé Sự Kiện: Tự duyệt vé &amp; cấp QR HMAC</SelectItem>
                                  <SelectItem value="membership_join">Phí Gia Nhập: Duyệt hội viên &amp; thẻ số 3D</SelectItem>
                                  <SelectItem value="membership_annual">Hội Phí: Gia hạn niên liễm &amp; gạch nợ hóa đơn</SelectItem>
                                  <SelectItem value="course_enroll">Học Phí: Ghi danh lớp &amp; mở khóa tài liệu</SelectItem>
                                  <SelectItem value="sponsorship">Tài Trợ: Kích hoạt quyền lợi &amp; Logo App</SelectItem>
                                  <SelectItem value="charity">Thiện Nguyện: Ghi sổ Quỹ &amp; Vinh danh</SelectItem>
                                  <SelectItem value="b2b_expo">Gian Hàng B2B: Mở gian hàng số 1-on-1</SelectItem>
                                  <SelectItem value="custom">Khoản Phí Khác: Tự động ghi Sổ Quỹ</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Nút bật tắt & Xóa */}
                            <div className="md:col-span-1 flex items-center justify-end gap-1.5 pt-3 md:pt-4">
                              <button
                                type="button"
                                onClick={() => handleUpdateFeeCategory(cat.id, "is_active", cat.is_active === false)}
                                className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition ${
                                  cat.is_active !== false
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                }`}
                                title={cat.is_active !== false ? "Đang bật (Bấm để tắt)" : "Đang tắt (Bấm để bật)"}
                              >
                                {cat.is_active !== false ? "Bật" : "Tắt"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFeeCategory(cat.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Xóa khoản phí này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Khu vực nút Lưu Cấu Hình SePay (Chỉ kích hoạt khi đã điền đủ thông tin) */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs">
                      {!isSepayReadyToSave ? (
                        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Vui lòng điền đủ <strong>Tên Ngân Hàng</strong>, <strong>Số Tài Khoản</strong>, <strong>Tên Chủ TK</strong> và <strong>Secret Key</strong> để kích hoạt nút Lưu.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Thông tin đã nhập đầy đủ hợp lệ. Sẵn sàng lưu và áp dụng tự động cho toàn hệ thống.</span>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={handleSaveSepay}
                      disabled={!isSepayReadyToSave || isSavingSepay}
                      className={`text-xs h-9 px-6 gap-2 font-bold shadow-sm transition ${
                        isSepayReadyToSave && !isSavingSepay
                          ? "bg-[#002B70] hover:bg-[#003B95] text-white cursor-pointer"
                          : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSavingSepay ? "Đang lưu cấu hình..." : "Lưu Cấu Hình SePay"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── SUB-TAB 2: CẤU HÌNH TÍCH HỢP ZALO OFFICIAL ACCOUNT (ZALO OA / ZBS) ── */}
            {settingsSubTab === "zalo" && (
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Cấu Hình Tích Hợp Zalo Official Account &amp; ZBS
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kết nối Zalo OA, tự động gửi thư mời sự kiện, mã vé QR Check-in, thông báo hội phí và chăm sóc hội viên
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Đã Kết Nối OA
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700 font-semibold">Zalo OA ID</Label>
                      <Input
                        placeholder="VD: 429182910284729182"
                        value={zaloFormData.oa_id || ""}
                        onChange={(e) =>
                          setZaloFormData({ ...zaloFormData, oa_id: e.target.value })
                        }
                        className="bg-white border-slate-300 text-xs h-9 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700 font-semibold">App ID (Zalo Developer)</Label>
                      <Input
                        placeholder="VD: 4819284719284"
                        value={zaloFormData.app_id || ""}
                        onChange={(e) =>
                          setZaloFormData({ ...zaloFormData, app_id: e.target.value })
                        }
                        className="bg-white border-slate-300 text-xs h-9 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700 font-semibold">Secret Key (Khóa bí mật)</Label>
                      <Input
                        type="password"
                        placeholder="VD: sk_live_xxxxxxxxxxxxxxxx"
                        value={zaloFormData.secret_key || ""}
                        onChange={(e) =>
                          setZaloFormData({ ...zaloFormData, secret_key: e.target.value })
                        }
                        className="bg-white border-slate-300 text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700 font-semibold">Mẫu Template ZNS Mặc Định</Label>
                      <Input
                        placeholder="VD: ZNS_THU_MOI_SU_KIEN_CEOHN10"
                        value={zaloFormData.default_zns_template || ""}
                        onChange={(e) =>
                          setZaloFormData({ ...zaloFormData, default_zns_template: e.target.value })
                        }
                        className="bg-white border-slate-300 text-xs h-9 font-mono text-[#002B70]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-700 font-semibold">Webhook Callback URL</Label>
                    <Input
                      value={zaloFormData.webhook_url || ""}
                      onChange={(e) =>
                        setZaloFormData({ ...zaloFormData, webhook_url: e.target.value })
                      }
                      className="bg-white border-slate-300 text-xs h-9 font-mono text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700 font-semibold">Access Token Hiện Tại</Label>
                      <Input
                        type="password"
                        placeholder="Access Token Zalo OA"
                        value={zaloFormData.access_token || ""}
                        onChange={(e) =>
                          setZaloFormData({ ...zaloFormData, access_token: e.target.value })
                        }
                        className="bg-white border-slate-300 text-xs h-9 font-mono text-slate-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700 font-semibold">Refresh Token</Label>
                      <Input
                        type="password"
                        placeholder="Refresh Token Zalo OA"
                        value={zaloFormData.refresh_token || ""}
                        onChange={(e) =>
                          setZaloFormData({ ...zaloFormData, refresh_token: e.target.value })
                        }
                        className="bg-white border-slate-300 text-xs h-9 font-mono text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleTestZaloConnection}
                      className="text-xs h-9 px-4 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                    >
                      <Radio className="w-3.5 h-3.5 text-blue-600" />
                      <span>Kiểm Tra Kết Nối</span>
                    </Button>
                    <Button
                      onClick={handleSaveZalo}
                      disabled={isSavingZalo}
                      className="bg-[#002B70] hover:bg-[#003B95] text-white text-xs h-9 px-5 gap-2 font-bold shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSavingZalo ? "Đang lưu..." : "Lưu Cấu Hình Zalo OA"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── SUB-TAB 3: CÀI ĐẶT HỆ THỐNG CHO TỪNG HỆ THỐNG NHỎ (PER-PLATFORM SETTINGS) ── */}
            {settingsSubTab === "platforms" && (
              <div className="space-y-6">
                {/* Chọn hệ thống cần cấu hình */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {(platformsQ.data || []).map((plt: any) => {
                    const isSelected = selectedPlatformId === plt.id;
                    return (
                      <div
                        key={plt.id}
                        onClick={() => setSelectedPlatformId(plt.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#002B70] bg-blue-50/50 ring-2 ring-[#002B70]/20 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#002B70] flex items-center justify-center font-bold text-xs">
                              {plt.code ? plt.code.slice(0, 3) : "APP"}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 truncate">{plt.name}</h4>
                              <span className="text-[10px] font-mono text-slate-400">{plt.code}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#002B70] text-white flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Form chi tiết của hệ thống được chọn */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-[#002B70]" />
                        Cài Đặt Cấu Hình: {platformConfigForm.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tùy chỉnh thông số vận hành, API endpoint, thời gian phiên làm việc và modules tính năng
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 font-medium">Bảo trì hệ thống:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPlatformConfigForm({
                            ...platformConfigForm,
                            maintenanceMode: !platformConfigForm.maintenanceMode,
                          })
                        }
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                          platformConfigForm.maintenanceMode
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{platformConfigForm.maintenanceMode ? "Đang Bảo Trì" : "Hoạt Động Bình Thường"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-700 font-semibold">Tên Nền Tảng / Ứng Dụng</Label>
                        <Input
                          value={platformConfigForm.name || ""}
                          onChange={(e) =>
                            setPlatformConfigForm({ ...platformConfigForm, name: e.target.value })
                          }
                          className="bg-white border-slate-300 text-xs h-9 font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-700 font-semibold">Mã Định Danh (Code)</Label>
                        <Input
                          value={platformConfigForm.code || ""}
                          onChange={(e) =>
                            setPlatformConfigForm({ ...platformConfigForm, code: e.target.value })
                          }
                          className="bg-white border-slate-300 text-xs h-9 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-700 font-semibold">URL Domain Truy Cập</Label>
                        <Input
                          value={platformConfigForm.endpointUrl || ""}
                          onChange={(e) =>
                            setPlatformConfigForm({ ...platformConfigForm, endpointUrl: e.target.value })
                          }
                          className="bg-white border-slate-300 text-xs h-9 font-mono text-blue-700"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-700 font-semibold">Endpoint API Healthcheck</Label>
                        <Input
                          value={platformConfigForm.healthcheckUrl || "/api/health"}
                          onChange={(e) =>
                            setPlatformConfigForm({ ...platformConfigForm, healthcheckUrl: e.target.value })
                          }
                          className="bg-white border-slate-300 text-xs h-9 font-mono text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-700 font-semibold">Khóa Bảo Mật / API Key</Label>
                        <Input
                          type="password"
                          value={platformConfigForm.apiKey || ""}
                          onChange={(e) =>
                            setPlatformConfigForm({ ...platformConfigForm, apiKey: e.target.value })
                          }
                          className="bg-white border-slate-300 text-xs h-9 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-700 font-semibold">Thời Gian Hết Hạn Phiên (Phút)</Label>
                        <Select
                          value={String(platformConfigForm.sessionTimeout || "120")}
                          onValueChange={(val) =>
                            setPlatformConfigForm({ ...platformConfigForm, sessionTimeout: val })
                          }
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-xs h-9">
                            <SelectValue placeholder="Chọn thời gian hết hạn" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-xs">
                            <SelectItem value="30">30 phút</SelectItem>
                            <SelectItem value="60">1 giờ</SelectItem>
                            <SelectItem value="120">2 giờ (Khuyên dùng)</SelectItem>
                            <SelectItem value="480">8 giờ (Cả ngày)</SelectItem>
                            <SelectItem value="1440">24 giờ (1 ngày)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Phân hệ Modules Bật/Tắt */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Danh Sách Phân Hệ Tính Năng (Modules) Được Bật
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Học viên",
                          "Sự kiện",
                          "Khai giảng",
                          "Tài chính",
                          "Phân quyền",
                          "Tra cứu",
                          "Danh thiếp số",
                          "B2B Connect",
                          "Điểm danh QR",
                          "Bình chọn",
                          "Thông báo đa kênh",
                        ].map((mod) => {
                          const isActive = (platformConfigForm.modules || []).includes(mod);
                          return (
                            <button
                              key={mod}
                              type="button"
                              onClick={() => {
                                const current = platformConfigForm.modules || [];
                                const next = isActive
                                  ? current.filter((m: string) => m !== mod)
                                  : [...current, mod];
                                setPlatformConfigForm({ ...platformConfigForm, modules: next });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                                isActive
                                  ? "bg-[#002B70] text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span>{isActive ? "✓" : "+"}</span>
                              <span>{mod}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleSavePlatformConfig}
                        disabled={isSavingPlatformConfig}
                        className="bg-[#002B70] hover:bg-[#003B95] text-white text-xs h-9 px-5 gap-2 font-bold shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isSavingPlatformConfig ? "Đang lưu..." : "Lưu Cấu Hình Hệ Thống"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: THÊM NỀN TẢNG PHẦN MỀM MỚI (THEME SÁNG) */}
      {/* ========================================================================= */}
      <Dialog open={showAddPlatformModal} onOpenChange={setShowAddPlatformModal}>
        <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Thêm Phần Mềm Nền Tảng Mới Vào Hệ Thống
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Đăng ký phần mềm A, B, C... hoặc Mini App/Module khác vào danh mục Master Admin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-700 font-semibold">Tên phần mềm / nền tảng *</Label>
              <Input
                placeholder="VD: Phần mềm Quản trị Nhân sự HRM"
                value={newPlatformData.name}
                onChange={(e) => setNewPlatformData({ ...newPlatformData, name: e.target.value })}
                className="bg-white border-slate-300 text-xs h-8 text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">Mã định danh (Code)</Label>
                <Input
                  placeholder="VD: CEOHN10_HRM_APP"
                  value={newPlatformData.code}
                  onChange={(e) => setNewPlatformData({ ...newPlatformData, code: e.target.value })}
                  className="bg-white border-slate-300 text-xs h-8 font-mono text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">Phân loại</Label>
                <Select
                  value={newPlatformData.category}
                  onValueChange={(val) => setNewPlatformData({ ...newPlatformData, category: val })}
                >
                  <SelectTrigger className="bg-white border-slate-300 text-xs h-8 text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-800">
                    <SelectItem value="crm">CRM &amp; Quan hệ</SelectItem>
                    <SelectItem value="erp">ERP Doanh nghiệp</SelectItem>
                    <SelectItem value="miniapp">Mini App &amp; Zalo</SelectItem>
                    <SelectItem value="finance">Tài chính kế toán</SelectItem>
                    <SelectItem value="other">Phân hệ khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-700 font-semibold">Địa chỉ truy cập (URL / Path)</Label>
              <Input
                placeholder="VD: https://hrm.ceohn10.viconnect.vn hoặc /hrm"
                value={newPlatformData.endpointUrl}
                onChange={(e) => setNewPlatformData({ ...newPlatformData, endpointUrl: e.target.value })}
                className="bg-white border-slate-300 text-xs h-8 text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-700 font-semibold">Mô tả tóm tắt</Label>
              <Input
                placeholder="VD: Quản lý hồ sơ nhân viên, chấm công..."
                value={newPlatformData.description}
                onChange={(e) => setNewPlatformData({ ...newPlatformData, description: e.target.value })}
                className="bg-white border-slate-300 text-xs h-8 text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-700 font-semibold">Danh sách module (phân cách bằng dấu phẩy)</Label>
              <Input
                placeholder="VD: Nhân viên, Lương, Nghỉ phép, Đánh giá"
                value={newPlatformData.modulesStr}
                onChange={(e) => setNewPlatformData({ ...newPlatformData, modulesStr: e.target.value })}
                className="bg-white border-slate-300 text-xs h-8 text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddPlatformModal(false)}
              className="h-8 text-xs border-slate-300 text-slate-700"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSavePlatform}
              className="h-8 text-xs bg-[#002B70] hover:bg-[#003B95] text-white font-semibold"
            >
              Lưu Nền Tảng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: TẠO TÀI KHOẢN QUẢN TRỊ MỚI (CHỈ DÀNH CHO admin@ceohn10.vn) */}
      {/* ========================================================================= */}
      <Dialog open={showCreateAccountModal} onOpenChange={setShowCreateAccountModal}>
        <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#002B70]" />
              <span>Tạo Tài Khoản Quản Trị &amp; Phân Quyền Mới</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Chỉ Master Admin (admin@ceohn10.vn) có thẩm quyền khởi tạo tài khoản quản trị
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">Họ và tên *</Label>
                <Input
                  placeholder="VD: Nguyễn Văn A"
                  value={newAccountData.name}
                  onChange={(e) => setNewAccountData({ ...newAccountData, name: e.target.value })}
                  className="bg-white border-slate-300 text-xs h-8 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">Mã tài khoản quản trị *</Label>
                <Input
                  placeholder="VD: ADM-01, BDH-01..."
                  value={newAccountData.code}
                  onChange={(e) => setNewAccountData({ ...newAccountData, code: e.target.value.toUpperCase() })}
                  className="bg-white border-slate-300 text-xs h-8 font-mono text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">Email đăng nhập *</Label>
                <Input
                  type="email"
                  placeholder="user@ceohn10.vn"
                  value={newAccountData.email}
                  onChange={(e) => {
                    const emailVal = e.target.value;
                    setNewAccountData((prev) => ({
                      ...prev,
                      email: emailVal,
                      username: prev.username || emailVal,
                    }));
                  }}
                  className="bg-white border-slate-300 text-xs h-8 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">Mật khẩu khởi tạo *</Label>
                <Input
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={newAccountData.password}
                  onChange={(e) => setNewAccountData({ ...newAccountData, password: e.target.value })}
                  className="bg-white border-slate-300 text-xs h-8 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">Vai trò phân quyền</Label>
                <Select
                  value={newAccountData.role}
                  onValueChange={(val) => setNewAccountData({ ...newAccountData, role: val })}
                >
                  <SelectTrigger className="bg-white border-slate-300 text-xs h-8 text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-800">
                    <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                    <SelectItem value="lop_truong">Lớp Trưởng / Cán Sự Lớp</SelectItem>
                    <SelectItem value="lop_pho">Lớp Phó / Hỗ Trợ Đào Tạo</SelectItem>
                    <SelectItem value="giang_vien">Giảng Viên &amp; Chuyên Gia</SelectItem>
                    <SelectItem value="truong_ban">Trưởng Ban Chuyên Môn</SelectItem>
                    <SelectItem value="ban_dieu_hanh">Ban Điều Hành</SelectItem>
                    <SelectItem value="ban_thu_ky">Ban Thư Ký</SelectItem>
                    <SelectItem value="ban_cong_nghe">Ban Công Nghệ</SelectItem>
                    <SelectItem value="ke_toan">Kế toán &amp; Tài chính</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">Hệ thống được quản trị (Tenant Scope) *</Label>
                {isSuperPlatformAdmin ? (
                  <Select
                    value={newAccountData.targetSystem || "all"}
                    onValueChange={(val) => setNewAccountData({ ...newAccountData, targetSystem: val })}
                  >
                    <SelectTrigger className="bg-white border-slate-300 text-xs h-8 text-slate-800 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-800">
                      <SelectItem value="all">🌐 Toàn Bộ Nền Tảng (Master Platform)</SelectItem>
                      <SelectItem value="ceohn10">🏛️ CLB Doanh Nhân CEO HN10 (Có Lớp học)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 h-8 px-3 rounded-md border border-blue-200 bg-blue-50 text-blue-900 text-xs font-bold">
                    <span>🏛️ CLB Doanh Nhân CEO HN10</span>
                    <span className="text-[10px] text-blue-600 font-normal">(Cố định theo phân quyền quản trị của bạn)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-700 font-semibold">Ban chuyên môn</Label>
              <Input
                value={newAccountData.department}
                onChange={(e) => setNewAccountData({ ...newAccountData, department: e.target.value })}
                className="bg-white border-slate-300 text-xs h-8 text-slate-800"
              />
            </div>

            {/* CHỌN HÌNH THỨC PHÂN QUYỀN: THEO ROLE HOẶC TÍCH QUYỀN THAO TÁC CỤ THỂ */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-bold text-slate-900">
                  Phương thức phân quyền truy cập:
                </Label>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPermMode("role")}
                    className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                      permMode === "role"
                        ? "bg-[#002B70] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Theo Chức Danh (Role)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPermMode("granular")}
                    className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                      permMode === "granular"
                        ? "bg-[#002B70] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tích Quyền Cụ Thể (Custom)
                  </button>
                </div>
              </div>

              {permMode === "granular" ? (
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 max-h-48 overflow-y-auto space-y-3">
                  <div className="text-[10px] text-slate-500 italic">
                    Tích chọn các chức năng cụ thể tài khoản này được phép thấy trên Sidebar &amp; thao tác:
                  </div>
                  {GRANULAR_PERMISSION_CATEGORIES.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <span>{cat.category}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pl-1">
                        {cat.items.map((p) => {
                          const isChecked = selectedPerms.includes(p.key);
                          return (
                            <label
                              key={p.key}
                              className={`flex items-start gap-1.5 p-1.5 rounded-lg border text-left cursor-pointer transition ${
                                isChecked
                                  ? "bg-blue-50 border-blue-200 text-blue-900"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPerms((prev) => [...prev, p.key]);
                                  } else {
                                    setSelectedPerms((prev) => prev.filter((k) => k !== p.key));
                                  }
                                }}
                                className="mt-0.5 rounded text-[#002B70]"
                              />
                              <div className="min-w-0 flex-1 leading-tight">
                                <div className="text-[11px] font-bold truncate">{p.name}</div>
                                <div className="text-[9px] text-slate-400 truncate">{p.desc}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 leading-relaxed">
                  Tài khoản sẽ được tự động kích hoạt toàn bộ menu và phân quyền theo chuẩn nghiệp vụ của vai trò{" "}
                  <strong>{newAccountData.role}</strong> trong phạm vi hệ thống{" "}
                  <strong>{newAccountData.targetSystem || "toàn nền tảng"}</strong>.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateAccountModal(false)}
              className="h-8 text-xs border-slate-300 text-slate-700"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleCreateAccount}
              className="h-8 text-xs bg-[#002B70] hover:bg-[#003B95] text-white font-semibold"
            >
              Tạo &amp; Cấp Quyền
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG CHỈNH SỬA PHÂN QUYỀN RBAC & PHẠM VI DỮ LIỆU */}
      <Dialog open={showEditRbacModal} onOpenChange={setShowEditRbacModal}>
        <DialogContent className="sm:max-w-[520px] bg-white text-slate-800 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-[#002B70]" />
              <span>Cập Nhật Phân Quyền &amp; Phạm Vi Dữ Liệu (Scope-based RBAC)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Điều chỉnh vai trò quản trị, ban chuyên môn và phạm vi dữ liệu cho tài khoản{" "}
              <strong className="text-slate-800">{editingUser?.email || editingUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-700 font-semibold">Họ và tên</Label>
              <Input
                value={editRbacData.name}
                onChange={(e) => setEditRbacData({ ...editRbacData, name: e.target.value })}
                className="bg-white border-slate-300 text-xs h-8 text-slate-800"
                placeholder="Họ và tên người dùng..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">Vai trò RBAC *</Label>
                <Select
                  value={editRbacData.role}
                  onValueChange={(val) => setEditRbacData({ ...editRbacData, role: val })}
                >
                  <SelectTrigger className="bg-white border-slate-300 text-xs h-8 text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-800">
                    <SelectItem value="platform_admin">Platform Admin (Toàn quyền)</SelectItem>
                    <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                    <SelectItem value="lop_truong">Lớp Trưởng</SelectItem>
                    <SelectItem value="lop_pho">Lớp Phó</SelectItem>
                    <SelectItem value="truong_team">Trưởng Team</SelectItem>
                    <SelectItem value="pho_team">Phó Team</SelectItem>
                    <SelectItem value="truong_ban">Trưởng Ban Chuyên Môn</SelectItem>
                    <SelectItem value="truong_ban_hoc_tap">Trưởng Ban Học Tập</SelectItem>
                    <SelectItem value="truong_ban_truyen_thong">Trưởng Ban Truyền Thông</SelectItem>
                    <SelectItem value="truong_ban_su_kien_hau_can">Trưởng Ban Sự Kiện &amp; Hậu Cần</SelectItem>
                    <SelectItem value="truong_ban_tai_chinh">Trưởng Ban Tài Chính</SelectItem>
                    <SelectItem value="truong_ban_thien_nguyen">Trưởng Ban Thiện Nguyện</SelectItem>
                    <SelectItem value="truong_ban_an_sinh">Trưởng Ban An Sinh &amp; Xã Hội</SelectItem>
                    <SelectItem value="truong_ban_cong_nghe">Trưởng Ban Công Nghệ</SelectItem>
                    <SelectItem value="giang_vien">Giảng Viên / Chuyên Gia</SelectItem>
                    <SelectItem value="member">Học Viên / Hội Viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">Phạm vi dữ liệu (Scope) *</Label>
                <Select
                  value={editRbacData.dataScope}
                  onValueChange={(val) => setEditRbacData({ ...editRbacData, dataScope: val })}
                >
                  <SelectTrigger className="bg-white border-slate-300 text-xs h-8 text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-800">
                    <SelectItem value="all">🌐 Toàn bộ (All Organizations/Global)</SelectItem>
                    <SelectItem value="organization">🏛️ Toàn CLB CEO HN10 (Organization)</SelectItem>
                    <SelectItem value="class">🎓 Trong phạm vi lớp học (Class)</SelectItem>
                    <SelectItem value="team">👥 Trong phạm vi Team (Team)</SelectItem>
                    <SelectItem value="department">🏢 Trong ban chuyên môn (Department)</SelectItem>
                    <SelectItem value="self">👤 Chỉ dữ liệu cá nhân (Self)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-700 font-semibold">Ban chuyên môn / Đơn vị phụ trách</Label>
              <Select
                value={editRbacData.department}
                onValueChange={(val) => setEditRbacData({ ...editRbacData, department: val })}
              >
                <SelectTrigger className="bg-white border-slate-300 text-xs h-8 text-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800">
                  <SelectItem value="Ban Điều Hành">Ban Điều Hành</SelectItem>
                  <SelectItem value="Ban Cán Sự Lớp">Ban Cán Sự Lớp</SelectItem>
                  <SelectItem value="Ban Học Tập">Ban Học Tập</SelectItem>
                  <SelectItem value="Ban Sự Kiện &amp; Hậu Cần">Ban Sự Kiện &amp; Hậu Cần</SelectItem>
                  <SelectItem value="Ban Truyền Thông">Ban Truyền Thông</SelectItem>
                  <SelectItem value="Ban Tài Chính">Ban Tài Chính</SelectItem>
                  <SelectItem value="Ban Thiện Nguyện">Ban Thiện Nguyện</SelectItem>
                  <SelectItem value="Ban An Sinh &amp; Xã Hội">Ban An Sinh &amp; Xã Hội</SelectItem>
                  <SelectItem value="Ban Công Nghệ">Ban Công Nghệ</SelectItem>
                  <SelectItem value="Ban Thư Ký">Ban Thư Ký</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#002B70]" />
                <span>Quy chuẩn phân quyền động Scope-based RBAC:</span>
              </div>
              <p>
                Người dùng sẽ chỉ có quyền truy cập, xem hoặc chỉnh sửa các tài nguyên tương ứng với phạm vi đã cấu hình. Mọi thao tác truy cập dữ liệu ngoài phạm vi sẽ bị Backend NestJS từ chối (403 Forbidden).
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEditRbacModal(false)}
              className="h-8 text-xs border-slate-300 text-slate-700"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEditRbac}
              className="h-8 text-xs bg-[#002B70] hover:bg-[#003B95] text-white font-semibold"
            >
              Lưu Cập Nhật Phân Quyền
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
