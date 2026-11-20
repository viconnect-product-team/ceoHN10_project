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
} from "lucide-react";
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
  const isMasterAdmin =
    currentUserEmail === "admin@ceohn10.vn" ||
    currentUserEmail === "admin@viconnect.vn" ||
    currentUserEmail === "admin@connect.vn" ||
    user?.role === "platform_admin" ||
    user?.role === "admin" ||
    Boolean(user?.isPlatformAdmin);

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
      const payload = {
        ...newAccountData,
        username: (newAccountData.username?.trim() || cleanEmail),
        email: cleanEmail,
        code: cleanCode,
        name: newAccountData.name.trim() || cleanEmail.split("@")[0],
        password: cleanPass,
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex">
      {/* ========================================================================= */}
      {/* SIDEBAR DỌC TRÁI - THEME SÁNG THEO QUY CHUẨN CEOHN10 */}
      {/* ========================================================================= */}
      <aside className="w-64 sm:w-72 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between p-5 sticky top-0 h-screen overflow-y-auto shrink-0 shadow-sm z-30">
        <div className="space-y-6">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
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
                MASTER ADMIN · CEOHN10
              </div>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Danh Mục Quản Trị
            </div>

            <button
              onClick={() => setActiveTab("overview")}
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
              onClick={() => setActiveTab("accounts")}
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
              onClick={() => setActiveTab("settings")}
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
                  Sepay Dynamic &amp; Tích hợp
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
      <main className="flex-1 min-w-0 p-6 sm:p-8 space-y-6 overflow-y-auto">
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
              {activeTab === "settings" && "Cấu Hình Tích Hợp Cổng Thanh Toán Sepay Chuẩn Dynamic"}
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

            {activeTab === "accounts" && isMasterAdmin && (
              <Button
                size="sm"
                onClick={() => setShowCreateAccountModal(true)}
                className="h-9 gap-1.5 bg-[#002B70] hover:bg-[#003B95] text-white font-semibold text-xs shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tạo Tài Khoản Quản Trị Mới</span>
              </Button>
            )}

            {activeTab === "settings" && (
              <Button
                size="sm"
                disabled={isSavingSepay}
                onClick={handleSaveSepay}
                className="h-9 gap-1.5 bg-[#002B70] hover:bg-[#003B95] text-white font-semibold text-xs shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSavingSepay ? "Đang lưu..." : "Lưu Cấu Hình Sepay"}</span>
              </Button>
            )}
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
        {/* TAB 2: [2. QUẢN LÝ TÀI KHOẢN QUẢN TRỊ ĐƯỢC ĐĂNG NHẬP] */}
        {/* ========================================================================= */}
        {activeTab === "accounts" && (
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#002B70]" />
                  <span>[2. QUẢN LÝ TÀI KHOẢN] Tài Khoản Quản Trị Đang Đăng Nhập · Phân Quyền</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chỉ duy nhất tài khoản <span className="font-mono text-[#002B70] font-bold">admin@ceohn10.vn</span> có quyền tạo tài khoản mới và phân quyền.
                </p>
              </div>

              {!isMasterAdmin && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Chỉ admin@ceohn10.vn được tạo tài khoản</span>
                </div>
              )}
            </div>

            {/* Bảng danh sách tài khoản quản trị */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(accountsQ.data || []).map((acc: any) => {
                    const isSuper =
                      acc.email === "admin@ceohn10.vn" ||
                      acc.role === "platform_admin";

                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{acc.name || "Quản trị viên"}</div>
                          <div className="font-mono text-slate-500">{acc.email}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-700">
                          {acc.code || acc.memberCode || (isSuper ? "CEO-HN10-ROOT" : "—")}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {acc.username || acc.email}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isSuper
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-blue-50 text-[#002B70] border border-blue-200"
                            }`}
                          >
                            {isSuper ? "Master Platform Admin" : acc.role || "Admin"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {acc.department || "Ban Điều Hành"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Hoạt động
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isMasterAdmin ? (
                            <Link
                              to="/permissions"
                              className="text-xs font-semibold text-[#002B70] hover:text-[#003B95] hover:underline"
                            >
                              Phân quyền
                            </Link>
                          ) : (
                            <span className="text-slate-400">Đã khóa</span>
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
        {/* TAB 3: [3. CÀI ĐẶT HỆ THỐNG NGOÀI & SEPAY DYNAMIC] */}
        {/* ========================================================================= */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Cấu Hình Tích Hợp Cổng Thanh Toán Sepay (Dynamic Master Admin)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đưa cấu hình cổng thanh toán ra bên ngoài CRM · Tự động map và kích hoạt quyền lợi
                    </p>
                  </div>
                </div>
              </div>

              {sepayFormData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700 font-semibold">Sepay API Token</Label>
                      <Input
                        type="password"
                        placeholder="VD: SPY_live_xxxxxxxxxxxxxxxx"
                        value={sepayFormData.api_token || ""}
                        onChange={(e) =>
                          setSepayFormData({ ...sepayFormData, api_token: e.target.value })
                        }
                        className="bg-white border-slate-300 text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700 font-semibold">Sepay Webhook Secret Token</Label>
                      <Input
                        type="password"
                        placeholder="VD: whsec_xxxxxxxxxxxxxxxx"
                        value={sepayFormData.webhook_token || ""}
                        onChange={(e) =>
                          setSepayFormData({ ...sepayFormData, webhook_token: e.target.value })
                        }
                        className="bg-white border-slate-300 text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-700 font-semibold">Webhook Callback Endpoint URL</Label>
                    <Input
                      value={sepayFormData.webhook_url || ""}
                      onChange={(e) =>
                        setSepayFormData({ ...sepayFormData, webhook_url: e.target.value })
                      }
                      className="bg-white border-slate-300 text-xs h-9 font-mono text-slate-700"
                    />
                  </div>

                  {/* Cú pháp tiền tố chuyển khoản */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Cú Pháp Tiền Tố Nhận Diện Tự Động
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-600 font-medium">Đóng Hội phí Học viên</Label>
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
                          className="bg-white border-slate-300 text-xs h-8 font-mono font-bold text-amber-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-600 font-medium">Vé Tham gia Sự kiện</Label>
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
                          className="bg-white border-slate-300 text-xs h-8 font-mono font-bold text-[#002B70]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-600 font-medium">Học phí Khóa học / Lớp</Label>
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
                          className="bg-white border-slate-300 text-xs h-8 font-mono font-bold text-emerald-700"
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
                    <SelectItem value="ban_dieu_hanh">Ban Điều Hành</SelectItem>
                    <SelectItem value="ban_thu_ky">Ban Thư Ký</SelectItem>
                    <SelectItem value="ban_cong_nghe">Ban Công Nghệ</SelectItem>
                    <SelectItem value="ke_toan">Kế toán &amp; Tài chính</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">Ban chuyên môn</Label>
                <Input
                  value={newAccountData.department}
                  onChange={(e) => setNewAccountData({ ...newAccountData, department: e.target.value })}
                  className="bg-white border-slate-300 text-xs h-8 text-slate-800"
                />
              </div>
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
    </div>
  );
}
