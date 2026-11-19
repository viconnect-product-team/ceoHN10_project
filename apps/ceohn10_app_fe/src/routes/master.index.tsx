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
  Edit2,
  Trash2,
  Lock,
  ArrowRight,
  Settings,
  CreditCard,
  Building2,
  Radio,
  FileText,
  Sliders,
  ChevronRight,
} from "lucide-react";
import { fetchNestApi } from "@/lib/api-client";
import { isValidEmail } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/use-role";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

function fmtMoney(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr`;
  return n.toLocaleString("vi-VN");
}

function MasterAdminPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUserEmail = (user?.email || "").toLowerCase().trim();
  const isMasterAdmin =
    currentUserEmail === "admin@ceohn10.vn" || user?.role === "platform_admin";

  const [activeTab, setActiveTab] = useState<"overview" | "accounts" | "settings">("overview");

  // Query platforms catalog
  const platformsQ = useQuery({
    queryKey: ["master-settings-platforms"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>("/admin/master-settings/platforms");
        if (Array.isArray(res) && res.length > 0) return res;
      } catch {}
      return [
        {
          id: "plt-crm",
          name: "Hệ thống CRM CEOHN10",
          code: "CEOHN10_CRM_WEB",
          category: "crm",
          categoryLabel: "CRM Hiệp hội",
          description: "Cổng Quản trị CRM Học viên, Sự kiện, Tài chính, Phân quyền RBAC",
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
          description: "Ứng dụng di động dành riêng cho Học viên doanh nhân CEO HN10",
          endpointUrl: "/association",
          isCore: true,
          status: "active",
          modules: ["Danh thiếp số", "B2B Connect", "Điểm danh QR", "Bình chọn", "Hội viên"],
        },
      ];
    },
  });

  // Query Sepay Config
  const sepayQ = useQuery({
    queryKey: ["master-settings-sepay"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any>("/admin/master-settings/sepay");
        return res?.config || null;
      } catch {
        return null;
      }
    },
  });

  // Query Admin Accounts
  const accountsQ = useQuery({
    queryKey: ["master-admin-users"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any>("/users?limit=50");
        return res?.data || (Array.isArray(res) ? res : []);
      } catch {
        return [];
      }
    },
  });

  // Query Funds
  const fundsQ = useQuery({
    queryKey: ["master-funds-overview"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any>("/admin/funds-overview");
        return res || null;
      } catch {
        return null;
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
  });

  // State: Sepay Config Editor
  const [sepayFormData, setSepayFormData] = useState<any>(null);
  const [isSavingSepay, setIsSavingSepay] = useState(false);

  React.useEffect(() => {
    if (sepayQ.data && !sepayFormData) {
      setSepayFormData(sepayQ.data);
    }
  }, [sepayQ.data]);

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
      await fetchNestApi("/users", {
        method: "POST",
        body: newAccountData,
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
      });
      accountsQ.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tạo tài khoản");
    }
  };

  const handleSaveSepay = async () => {
    setIsSavingSepay(true);
    try {
      await fetchNestApi("/admin/master-settings/sepay", {
        method: "PUT",
        body: sepayFormData,
      });
      toast.success("Đã lưu cấu hình Sepay dynamic thành công");
      sepayQ.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu cấu hình Sepay");
    } finally {
      setIsSavingSepay(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Master Portal */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-black text-lg">
              Ω
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  QUẢN TRỊ LỚN NHẤT (MASTER ADMIN - CEOHN10)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Platform Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cổng điều hành trung tâm toàn bộ phần mềm &amp; app thuộc hệ sinh thái CLB CEO HN10
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-200">
                {user?.name || "Quản Trị Viên Tối Cao"}
              </div>
              <div className="text-[11px] font-mono text-blue-400">{currentUserEmail}</div>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              <span>Vào Hệ Thống CRM CEOHN10</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6">
        <div className="max-w-7xl mx-auto flex gap-2">
          {[
            { key: "overview", label: "[1. TỔNG QUAN NỀN TẢNG]", icon: Activity },
            { key: "accounts", label: "[2. TÀI KHOẢN ĐƯỢC ĐĂNG NHẬP]", icon: Users },
            { key: "settings", label: "[3. CÀI ĐẶT NGOÀI & SEPAY DYNAMIC]", icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  isActive
                    ? "border-blue-500 text-blue-400 bg-blue-500/10"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: [1. TỔNG QUAN NỀN TẢNG] */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Báo cáo quỹ còn tồn (Tổng quỹ / Số dư tự tính / Dòng tiền) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Tổng Quỹ Còn Tồn</span>
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  {fmtMoney(fundsQ.data?.generalFund?.balance ?? 585000000)} VNĐ
                </div>
                <div className="text-[11px] text-slate-400">
                  Đồng bộ từ CSDL chuẩn 113.20.107.184:6432
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Số Dư Tự Tính</span>
                  <Coins className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-blue-400">
                  {fmtMoney(fundsQ.data?.sponsorFund?.cashBalance ?? 230000000)} VNĐ
                </div>
                <div className="text-[11px] text-slate-400">
                  Lũy kế thu trừ chi thực tế thời gian thực
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-semibold uppercase tracking-wider">Dòng Tiền Ròng Tháng Này</span>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">
                  +125.000.000 VNĐ
                </div>
                <div className="text-[11px] text-slate-400">
                  Dòng tiền dương · Kiểm toán tự động
                </div>
              </div>
            </div>

            {/* Danh sách & Trạng thái các phần mềm nền tảng của CEOHN10 */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>[3. NHÓM PHẦN MỀM] Danh Sách &amp; Trạng Thái Nền Tảng CLB CEOHN10</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hỗ trợ cấu hình động để quản lý các phần mềm nền tảng khác sau này
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => setShowAddPlatformModal(true)}
                  className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Phần Mềm Nền Tảng Mới</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(platformsQ.data || []).map((plt: any) => {
                  const isCrm = plt.code === "CEOHN10_CRM_WEB";
                  const isApp = plt.code === "CEOHN10_MOBILE_APP";

                  return (
                    <div
                      key={plt.id}
                      className="p-5 rounded-2xl border border-slate-800 bg-slate-950/70 space-y-3.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold">
                              {isCrm ? <Globe className="w-5 h-5" /> : isApp ? <Smartphone className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{plt.name}</h4>
                              <span className="text-[11px] font-mono text-slate-400">{plt.code}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Hoạt động
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">
                          {plt.description}
                        </p>

                        <div className="pt-2 flex flex-wrap gap-1.5">
                          {(plt.modules || []).map((m: string) => (
                            <span
                              key={m}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-850 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {plt.isCore ? "Phần mềm lõi" : "Tích hợp mở rộng"}
                        </span>
                        <a
                          href={plt.endpointUrl}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300"
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
        {/* TAB 2: [2. QUẢN LÝ TÀI KHOẢN QUẢN TRỊ ĐƯỢC ĐĂNG NHẬP] */}
        {/* ========================================================================= */}
        {activeTab === "accounts" && (
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-400" />
                  <span>[2. QUẢN LÝ TÀI KHOẢN] Tài Khoản Quản Trị Đang Đăng Nhập · Phiên · Phân Quyền</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chỉ duy nhất tài khoản <span className="font-mono text-blue-400 font-bold">admin@ceohn10.vn</span> có quyền tạo tài khoản mới và phân quyền.
                </p>
              </div>

              {isMasterAdmin ? (
                <Button
                  size="sm"
                  onClick={() => setShowCreateAccountModal(true)}
                  className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Tạo Tài Khoản Quản Trị Mới</span>
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Chỉ admin@ceohn10.vn được tạo tài khoản</span>
                </div>
              )}
            </div>

            {/* Bảng danh sách tài khoản */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Họ tên &amp; Email</th>
                    <th className="px-4 py-3">Mã tài khoản</th>
                    <th className="px-4 py-3">Tên đăng nhập</th>
                    <th className="px-4 py-3">Vai trò phân quyền</th>
                    <th className="px-4 py-3">Ban chuyên môn</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {(accountsQ.data || []).map((acc: any) => {
                    const isSuper =
                      acc.email === "admin@ceohn10.vn" ||
                      acc.role === "platform_admin";

                    return (
                      <tr key={acc.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-white">{acc.name || "Quản trị viên"}</div>
                          <div className="font-mono text-slate-400">{acc.email}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-400">
                          {acc.code || acc.memberCode || (isSuper ? "CEO-HN10-ROOT" : "—")}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {acc.username || acc.email}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSuper
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {isSuper ? "Master Platform Admin" : acc.role || "Admin"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {acc.department || "Ban Điều Hành"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Hoạt động
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isMasterAdmin ? (
                            <Link
                              to="/permissions"
                              className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              Phân quyền
                            </Link>
                          ) : (
                            <span className="text-slate-600">Đã khóa</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: [3. CÀI ĐẶT NGOÀI & SEPAY DYNAMIC] */}
        {/* ========================================================================= */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Cấu Hình Tích Hợp Cổng Thanh Toán Sepay (Dynamic Master Admin)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Đưa cấu hình cổng thanh toán ra bên ngoài CRM · Tự động map và kích hoạt quyền lợi
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  disabled={isSavingSepay}
                  onClick={handleSaveSepay}
                  className="h-8 gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSavingSepay ? "Đang lưu..." : "Lưu Cấu Hình Sepay"}</span>
                </Button>
              </div>

              {sepayFormData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Sepay API Token</Label>
                      <Input
                        type="password"
                        placeholder="VD: SPY_live_xxxxxxxxxxxxxxxx"
                        value={sepayFormData.api_token || ""}
                        onChange={(e) =>
                          setSepayFormData({ ...sepayFormData, api_token: e.target.value })
                        }
                        className="bg-slate-950 border-slate-800 text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">Sepay Webhook Secret Token</Label>
                      <Input
                        type="password"
                        placeholder="VD: whsec_xxxxxxxxxxxxxxxx"
                        value={sepayFormData.webhook_token || ""}
                        onChange={(e) =>
                          setSepayFormData({ ...sepayFormData, webhook_token: e.target.value })
                        }
                        className="bg-slate-950 border-slate-800 text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Webhook Callback Endpoint URL</Label>
                    <Input
                      value={sepayFormData.webhook_url || ""}
                      onChange={(e) =>
                        setSepayFormData({ ...sepayFormData, webhook_url: e.target.value })
                      }
                      className="bg-slate-950 border-slate-800 text-xs h-9 font-mono"
                    />
                  </div>

                  {/* Cú pháp tiền tố chuyển khoản */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Cú Pháp Tiền Tố Nhận Diện Tự Động
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-400">Đóng Hội phí Học viên</Label>
                        <Input
                          value={sepayFormData.prefix_syntax?.membership || "CEOHN10_HP"}
                          onChange={(e) =>
                            setSepayFormData({
                              ...sepayFormData,
                              prefix_syntax: {
                                ...sepayFormData.prefix_syntax,
                                membership: e.target.value,
                              },
                            })
                          }
                          className="bg-slate-900 border-slate-700 text-xs h-8 font-mono font-bold text-amber-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-400">Vé Tham gia Sự kiện</Label>
                        <Input
                          value={sepayFormData.prefix_syntax?.event || "CEOHN10_SK"}
                          onChange={(e) =>
                            setSepayFormData({
                              ...sepayFormData,
                              prefix_syntax: {
                                ...sepayFormData.prefix_syntax,
                                event: e.target.value,
                              },
                            })
                          }
                          className="bg-slate-900 border-slate-700 text-xs h-8 font-mono font-bold text-blue-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-400">Học phí Khóa học / Lớp</Label>
                        <Input
                          value={sepayFormData.prefix_syntax?.course || "CEOHN10_LH"}
                          onChange={(e) =>
                            setSepayFormData({
                              ...sepayFormData,
                              prefix_syntax: {
                                ...sepayFormData.prefix_syntax,
                                course: e.target.value,
                              },
                            })
                          }
                          className="bg-slate-900 border-slate-700 text-xs h-8 font-mono font-bold text-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Thêm nền tảng phần mềm mới */}
      <Dialog open={showAddPlatformModal} onOpenChange={setShowAddPlatformModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              Thêm Phần Mềm Nền Tảng Mới Vào Hệ Thống
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Đăng ký phần mềm A, B, C... hoặc Mini App/Module khác vào danh mục Master Admin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Tên phần mềm / nền tảng *</Label>
              <Input
                placeholder="VD: Phần mềm Quản trị Nhân sự HRM"
                value={newPlatformData.name}
                onChange={(e) => setNewPlatformData({ ...newPlatformData, name: e.target.value })}
                className="bg-slate-950 border-slate-800 text-xs h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Mã định danh (Code)</Label>
                <Input
                  placeholder="VD: CEOHN10_HRM_APP"
                  value={newPlatformData.code}
                  onChange={(e) => setNewPlatformData({ ...newPlatformData, code: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-xs h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Phân loại</Label>
                <Select
                  value={newPlatformData.category}
                  onValueChange={(val) => setNewPlatformData({ ...newPlatformData, category: val })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
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
              <Label className="text-xs text-slate-300">Địa chỉ truy cập (URL / Path)</Label>
              <Input
                placeholder="VD: https://hrm.ceohn10.viconnect.vn hoặc /hrm"
                value={newPlatformData.endpointUrl}
                onChange={(e) => setNewPlatformData({ ...newPlatformData, endpointUrl: e.target.value })}
                className="bg-slate-950 border-slate-800 text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Mô tả tóm tắt</Label>
              <Input
                placeholder="VD: Quản lý hồ sơ nhân viên, chấm công..."
                value={newPlatformData.description}
                onChange={(e) => setNewPlatformData({ ...newPlatformData, description: e.target.value })}
                className="bg-slate-950 border-slate-800 text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Danh sách module (phân cách bằng dấu phẩy)</Label>
              <Input
                placeholder="VD: Nhân viên, Lương, Nghỉ phép, Đánh giá"
                value={newPlatformData.modulesStr}
                onChange={(e) => setNewPlatformData({ ...newPlatformData, modulesStr: e.target.value })}
                className="bg-slate-950 border-slate-800 text-xs h-8"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddPlatformModal(false)}
              className="h-8 text-xs border-slate-700 text-slate-300"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSavePlatform}
              className="h-8 text-xs bg-blue-600 hover:bg-blue-500 font-semibold"
            >
              Lưu Nền Tảng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: Tạo tài khoản quản trị mới (Chỉ dành cho admin@ceohn10.vn) */}
      <Dialog open={showCreateAccountModal} onOpenChange={setShowCreateAccountModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>Tạo Tài Khoản Quản Trị &amp; Phân Quyền Mới</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Chỉ Master Admin (admin@ceohn10.vn) có thẩm quyền khởi tạo tài khoản quản trị
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Họ và tên *</Label>
                <Input
                  placeholder="VD: Nguyễn Văn A"
                  value={newAccountData.name}
                  onChange={(e) => setNewAccountData({ ...newAccountData, name: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Mã tài khoản quản trị *</Label>
                <Input
                  placeholder="VD: ADM-01, BDH-01..."
                  value={newAccountData.code}
                  onChange={(e) => setNewAccountData({ ...newAccountData, code: e.target.value.toUpperCase() })}
                  className="bg-slate-950 border-slate-800 text-xs h-8 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Email đăng nhập *</Label>
                <Input
                  type="email"
                  placeholder="user@ceohn10.vn"
                  value={newAccountData.email}
                  onChange={(e) => setNewAccountData({ ...newAccountData, email: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Mật khẩu khởi tạo *</Label>
                <Input
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={newAccountData.password}
                  onChange={(e) => setNewAccountData({ ...newAccountData, password: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Vai trò phân quyền</Label>
                <Select
                  value={newAccountData.role}
                  onValueChange={(val) => setNewAccountData({ ...newAccountData, role: val })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                    <SelectItem value="ban_dieu_hanh">Ban Điều Hành</SelectItem>
                    <SelectItem value="ban_thu_ky">Ban Thư Ký</SelectItem>
                    <SelectItem value="ban_cong_nghe">Ban Công Nghệ</SelectItem>
                    <SelectItem value="ke_toan">Kế toán &amp; Tài chính</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Ban chuyên môn</Label>
                <Input
                  value={newAccountData.department}
                  onChange={(e) => setNewAccountData({ ...newAccountData, department: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-xs h-8"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateAccountModal(false)}
              className="h-8 text-xs border-slate-700 text-slate-300"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleCreateAccount}
              className="h-8 text-xs bg-blue-600 hover:bg-blue-500 font-semibold"
            >
              Tạo &amp; Cấp Quyền
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
