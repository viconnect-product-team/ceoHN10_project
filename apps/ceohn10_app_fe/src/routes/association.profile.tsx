import { useState, useMemo, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
  LogOut,
  Pencil,
  Lock,
  Headphones,
  LayoutDashboard,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/use-role";
import { signOutSession } from "@/lib/business-connect/mobile/auth-session";
import { resolveMediaUrl, fetchNestApi } from "@/lib/api-client";
import { AssociationMemberQrModal } from "@/components/member/AssociationMemberQrModal";
import { QuickProfileEditModal } from "@/components/common/QuickProfileEditModal";
import { ContactSupportModal } from "@/components/member/ContactSupportModal";
import { AccountSecuritySettingsForm } from "@/components/member/AccountSecuritySettingsForm";
import { toast } from "sonner";

export const Route = createFileRoute("/association/profile")({
  component: ProfileScreen,
});

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const { isSuperAdmin, isAdmin, isBQT, isChuTich } = useRole();

  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [contactSupportOpen, setContactSupportOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Load Member Profile
  const loadProfile = async () => {
    setLoading(true);
    try {
      let data = await fetchNestApi<any>("/members/me").catch(() => null);
      if (!data) {
        data = await fetchNestApi<any>("/users/me").catch(() => null);
      }
      setMember(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const memberCode =
    member?.membership_code ||
    member?.code ||
    (user as any)?.memberCode ||
    `HN10-CEO-${user?.id?.slice(0, 4)?.toUpperCase() || "8899"}`;

  const displayName =
    member?.full_name ||
    member?.name ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Doanh Nhân CEO HN10";

  const companyName =
    member?.company_name ||
    member?.company ||
    "Tập Đoàn Doanh Nghiệp Thành Viên";

  const position =
    member?.position ||
    member?.title ||
    "Chủ Tịch HĐQT / Tổng Giám Đốc";

  const phone = member?.phone || (user as any)?.phone || "Chưa cập nhật";
  const email = member?.email || user?.email || "Chưa cập nhật";
  const industry = member?.industry || "Thương Mại & Dịch Vụ";
  const address = member?.address || "Hà Nội, Việt Nam";

  const handleCopy = (text: string, type: "code" | "phone" | "email") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      toast.success("Đã sao chép Mã Học Viên!");
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === "phone") {
      setCopiedPhone(true);
      toast.success("Đã sao chép Số điện thoại!");
      setTimeout(() => setCopiedPhone(false), 2000);
    } else {
      setCopiedEmail(true);
      toast.success("Đã sao chép Địa chỉ Email!");
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch {}
    signOutSession();
    toast.success("Đã đăng xuất tài khoản an toàn.");
    navigate({ to: "/association/login" });
  };

  const canAccessCrm = isSuperAdmin || isAdmin || isBQT || isChuTich;

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col pb-24 text-slate-800 font-sans">
      {/* ── TOP HEADER (TỐI GIẢN & TRANG TRỌNG) ── */}
      <header className="sticky top-0 z-30 bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between shadow-md border-b border-amber-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-xs">
            HN10
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight">HỒ SƠ CÁ NHÂN</h1>
            <p className="text-[10px] text-amber-300 font-mono">Khóa Doanh Nhân CEO HN10</p>
          </div>
        </div>

        <button
          onClick={() => setEditProfileOpen(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-amber-300 transition-all cursor-pointer border border-amber-400/30"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Sửa Hồ Sơ</span>
        </button>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* ── 1. THẺ ĐỊNH DANH DOANH NHÂN CỐT LÕI (EXECUTIVE PROFILE CARD) ── */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] rounded-3xl p-5 text-white shadow-xl border border-amber-400/30 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-18 h-18 rounded-full bg-slate-800 border-2 border-amber-400 overflow-hidden flex items-center justify-center text-white text-2xl font-black shadow-md">
                {member?.avatar_url || (user as any)?.avatarUrl ? (
                  <img
                    src={resolveMediaUrl(member?.avatar_url || (user as any)?.avatarUrl) || undefined}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-white truncate tracking-tight">{displayName}</h2>
                <span className="p-0.5 rounded-full bg-amber-400 text-slate-950 shrink-0" title="Đã xác thực">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-xs text-amber-300 font-semibold truncate mt-0.5">{position}</p>
              <p className="text-[11px] text-slate-300 truncate flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{companyName}</span>
              </p>
            </div>
          </div>

          {/* Dải thông tin mã học viên & QR */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-300 font-medium">MÃ HỌC VIÊN:</span>
              <span className="font-mono text-xs font-black text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-400/30">
                {memberCode}
              </span>
              <button
                onClick={() => handleCopy(memberCode, "code")}
                className="p-1 rounded hover:bg-white/10 active:scale-95 text-slate-300 transition cursor-pointer"
                title="Sao chép"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              onClick={() => setQrModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs shadow flex items-center gap-1.5 transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Thẻ</span>
            </button>
          </div>
        </div>

        {/* ── 2. THÔNG TIN LIÊN HỆ & DOANH NGHIỆP CẦN THIẾT NHẤT ── */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Thông Tin Doanh Nghiệp &amp; Liên Hệ</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-600 truncate">{phone}</span>
              </div>
              <button
                onClick={() => handleCopy(phone, "phone")}
                className="p-1 text-slate-400 hover:text-slate-700 active:scale-95 transition cursor-pointer"
                title="Sao chép"
              >
                {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-slate-600 truncate">{email}</span>
              </div>
              <button
                onClick={() => handleCopy(email, "email")}
                className="p-1 text-slate-400 hover:text-slate-700 active:scale-95 transition cursor-pointer"
                title="Sao chép"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 text-[#DC2626] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ngành nghề:</span>
                <span className="text-slate-700 font-bold truncate block">{industry}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Địa chỉ:</span>
                <span className="text-slate-700 font-medium truncate block">{address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. TIỆN ÍCH THIẾT YẾU NHẤT (CHỈ CÁC NÚT CẦN THIẾT) ── */}
        <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-xs space-y-1">
          {/* Đổi mật khẩu & Bảo mật */}
          <button
            onClick={() => setSecurityModalOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-900 block">Đổi Mật Khẩu &amp; Bảo Mật</span>
                <span className="text-[11px] text-slate-500 block">Quản lý mật khẩu và an toàn tài khoản</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Hỗ trợ Ban Thư Ký */}
          <button
            onClick={() => setContactSupportOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-900 block">Hỗ Trợ Ban Thư Ký 24/7</span>
                <span className="text-[11px] text-slate-500 block">Hotline, giải đáp thắc mắc và hỗ trợ kỹ thuật</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Cổng Quản Trị CRM (Chỉ hiển thị cho Admin / Ban Điều Hành) */}
          {canAccessCrm && (
            <a
              href="/"
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-900 block">Cổng Quản Trị Web CRM</span>
                  <span className="text-[11px] text-slate-500 block">Dành riêng cho Ban Điều Hành &amp; Admin</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          )}
        </div>

        {/* ── 4. NÚT ĐĂNG XUẤT TÀI KHOẢN (AN TOÀN) ── */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 px-4 rounded-2xl border border-red-200 bg-rose-50/70 hover:bg-rose-100 text-[#DC2626] font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Tài Khoản</span>
          </button>
        </div>
      </main>

      {/* ── MODALS ── */}
      <QuickProfileEditModal
        open={editProfileOpen}
        onClose={() => {
          setEditProfileOpen(false);
          loadProfile();
        }}
        initialName={displayName}
        initialPhone={phone}
        initialCompany={companyName}
        initialTitle={position}
        initialIndustry={industry}
        initialAddress={address}
        initialAvatar={member?.avatar_url || (user as any)?.avatarUrl || null}
      />

      <AssociationMemberQrModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        memberCode={memberCode}
        memberName={displayName}
        memberTitle={position}
        memberCompany={companyName}
        memberAvatar={member?.avatar_url || (user as any)?.avatarUrl || null}
      />

      <ContactSupportModal
        open={contactSupportOpen}
        onClose={() => setContactSupportOpen(false)}
      />

      {securityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#D97706]" />
                <span>Đổi Mật Khẩu &amp; An Toàn Tài Khoản</span>
              </h3>
              <button
                onClick={() => setSecurityModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <AccountSecuritySettingsForm />
          </div>
        </div>
      )}
    </div>
  );
}
