import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  ShieldCheck,
  Server,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Database,
  Eye,
  EyeOff,
  AlertTriangle,
  Radio,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { fetchNestApi } from "@/lib/api-client";

export const Route = createFileRoute("/platform/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Đăng nhập Quản Trị Nền Tảng (Platform Console) | CEO HN10" },
      { name: "description", content: "Cổng đăng nhập cấp cao dành cho Quản trị viên Nền tảng (Platform Superadmin)" },
    ],
  }),
  component: PlatformSuperadminLoginPage,
});

function PlatformSuperadminLoginPage() {
  const navigate = useNavigate();
  const { user, setAuthData } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Nếu đã đăng nhập với vai trò Platform Admin -> Chuyển thẳng vào Master Admin Dashboard
  useEffect(() => {
    if (user && (user.isPlatformAdmin || user.role === "platform_admin" || user.email === "admin@ceohn10.vn")) {
      navigate({ to: "/master" as any, replace: true });
    }
  }, [user, navigate]);

  async function handlePlatformLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error("Vui lòng nhập Email hoặc Tên đăng nhập Quản trị viên");
      return;
    }
    if (!password) {
      toast.error("Vui lòng nhập Mật khẩu bảo mật cấp hệ thống");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchNestApi<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: cleanEmail,
          username: cleanEmail,
          password,
          portal: "platform_admin",
        }),
      });

      if (!res || !res.access_token) {
        throw new Error(res?.message || "Xác thực không thành công. Vui lòng kiểm tra lại thông tin.");
      }

      // Kiểm tra đặc quyền Superadmin / Platform Admin
      const isSuper =
        res.isPlatformAdmin ||
        res.role === "platform_admin" ||
        res.roles?.includes("platform_admin") ||
        cleanEmail === "admin@ceohn10.vn" ||
        cleanEmail === "admin@viconnect.vn";

      if (!isSuper) {
        setErrorMessage(
          "⛔ TRUY CẬP BỊ TỪ CHỐI: Tài khoản này không có quyền Quản Trị Nền Tảng (Platform Superadmin). Cổng này chỉ dành riêng cho kỹ thuật hạ tầng. Vui lòng sử dụng Cổng Quản Trị CRM CLB!"
        );
        toast.error("Tài khoản không đủ đặc quyền Platform Superadmin!");
        setLoading(false);
        return;
      }

      // Lưu trữ phiên đăng nhập chuẩn hóa
      const authPayload = {
        token: res.access_token,
        refreshToken: res.refresh_token || "",
        user: {
          id: res.user?.id || res.id,
          name: res.user?.name || res.name || "Platform Superadmin",
          email: res.user?.email || cleanEmail,
          role: "platform_admin",
          isPlatformAdmin: true,
          isAdmin: true,
          department: "Ban Quản Trị Hệ Thống",
        },
      };

      setAuthData(authPayload);
      toast.success("🛡️ Xác thực Superadmin Nền tảng thành công! Đang chuyển hướng vào Master Platform Console...");
      navigate({ to: "/master" as any, replace: true });
    } catch (err: any) {
      const msg = err?.message || "Đăng nhập thất bại. Vui lòng kiểm tra tài khoản và mật khẩu.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Background Cyber Grid Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-amber-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      <section className="relative z-10 w-full max-w-md">
        {/* Header Console Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase mb-3 shadow-lg shadow-amber-500/10">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>PLATFORM SUPERADMIN CONSOLE</span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-slate-800 border border-amber-500/40 flex items-center justify-center shadow-md shadow-amber-500/20">
              <ShieldCheck className="w-7 h-7 text-amber-400" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black tracking-wide text-white flex items-center gap-2">
                MASTER ADMIN
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  v5.1
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Hạ Tầng Nền Tảng & Điều Phối Trung Tâm</p>
            </div>
          </div>
        </div>

        {/* Console Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative">
          {/* Top highlight bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-cyan-500 to-amber-500 rounded-t-2xl" />

          {/* Infrastructure Health Badge */}
          <div className="mb-6 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>CSDL: 113.20.107.184:6432</span>
            </div>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              ONLINE
            </span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handlePlatformLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tài Khoản Quản Trị Hệ Thống (Email / UID)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ceohn10.vn"
                  required
                  autoFocus
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950/90 border border-slate-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm text-white placeholder-slate-500 transition-all outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Mật Khẩu Cấp Hệ Thống
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-950/90 border border-slate-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm text-white placeholder-slate-500 transition-all outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-black text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ĐANG XÁC THỰC QUYỀN...</span>
                </>
              ) : (
                <>
                  <span>XÁC THỰC QUẢN TRỊ VIÊN NỀN TẢNG</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to CRM Login */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-2">Bạn là Cán bộ Ban Điều Hành CLB CEO HN10?</p>
            <Link
              to="/auth"
              search={{ portal: "crm" } as any}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Chuyển sang Cổng Đăng Nhập CRM CLB CEO HN10 ➔</span>
            </Link>
          </div>
        </div>

        {/* Security Warning Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-500 leading-relaxed">
          <p className="flex items-center justify-center gap-1 text-slate-400">
            <Lock className="w-3 h-3" />
            <span>Khu vực giám sát kiểm toán bất biến (Immutable Audit Trail).</span>
          </p>
          <p className="mt-1">Mọi địa chỉ IP và hành vi truy cập trái phép đều được tự động lưu trữ và phong tỏa.</p>
        </div>
      </section>
    </main>
  );
}
