import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { MobileMenuDrawer } from "./MobileMenuDrawer";
import { CommandPaletteProvider } from "./CommandPalette";
import { ViOneAiTutorGuide } from "@/components/common/ViOneAiTutorGuide";
import { FirstLoginChangePasswordModal } from "@/components/member/FirstLoginChangePasswordModal";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/use-role";
import { isRouteAllowedByMatrix, type SystemRoleKey } from "@/lib/rbac-permission-helpers";
import { ShieldAlert } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAiTour, setShowAiTour] = useState(false);
  const { user, logout } = useAuth();
  const { srsRole, isPlatformAdmin, isAdmin, isBQT } = useRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mustChangePwd, setMustChangePwd] = useState(false);
  const [unauthorizedMsg, setUnauthorizedMsg] = useState<string | null>(null);
  const [kickCountdown, setKickCountdown] = useState<number>(5);

  const currentRoleKey: SystemRoleKey = useMemo(() => {
    const rawRole = String(srsRole || user?.role || "");
    if (rawRole === "platform_admin" || isPlatformAdmin) return "platform_admin";
    if (rawRole === "custom_account") return "custom_account";
    if (rawRole === "lop_truong") return "lop_truong";
    if (rawRole === "admin" || isAdmin || isBQT) return "admin";
    return (rawRole as SystemRoleKey) || "hoc_vien";
  }, [srsRole, user?.role, isPlatformAdmin, isAdmin, isBQT]);

  const isRouteBlocked = useMemo(() => {
    if (!user) return false;
    const clean = (pathname || "/").split("?")[0].split("#")[0];
    if (clean === "/" || clean === "/profile" || clean === "/auth") return false;
    const hasCustomPerms = Array.isArray((user as any)?.customPermissions) && (user as any).customPermissions.length > 0;
    if (user?.role === "custom_account" || hasCustomPerms) {
      return !isRouteAllowedByMatrix(clean, currentRoleKey, user);
    }
    return false;
  }, [user, pathname, currentRoleKey]);

  const isUnauthorizedBlocked = Boolean(unauthorizedMsg || isRouteBlocked);

  useEffect(() => {
    const handleRevoked = (e: any) => {
      const msg = e?.detail?.message || "Bạn không có quyền truy cập trang này";
      setUnauthorizedMsg(msg);
      setKickCountdown(5);
    };
    window.addEventListener("vba:permission_revoked", handleRevoked);
    return () => window.removeEventListener("vba:permission_revoked", handleRevoked);
  }, []);

  useEffect(() => {
    if (isRouteBlocked) {
      setKickCountdown(5);
    }
  }, [isRouteBlocked, pathname]);

  useEffect(() => {
    if (!isUnauthorizedBlocked) return;
    if (kickCountdown <= 0) {
      try {
        logout?.();
        localStorage.removeItem("vibe_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("sb-access-token");
        document.cookie = "vibe_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      } catch {}
      window.location.replace("/auth");
      return;
    }
    const timer = window.setTimeout(() => {
      setKickCountdown((c) => c - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [isUnauthorizedBlocked, kickCountdown, logout]);

  useEffect(() => {
    const flag =
      Boolean((user as any)?.mustChangePassword || (user as any)?.must_change_password) ||
      (typeof window !== "undefined" && localStorage.getItem("vba_must_change_password") === "true");
    setMustChangePwd(flag);
  }, [user]);

  useEffect(() => {
    const handleOpenTour = () => setShowAiTour(true);
    window.addEventListener("crm:open_ai_tour", handleOpenTour);
    return () => window.removeEventListener("crm:open_ai_tour", handleOpenTour);
  }, []);

  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 relative">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile drawer (swipe + tap-outside to close) */}
        <MobileMenuDrawer open={mobileOpen} onOpenChange={setMobileOpen} />

        <div className="flex min-w-0 flex-1 flex-col bg-background text-foreground">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 min-w-0 bg-crm-system px-4 py-6 lg:px-8 text-foreground">{children}</main>
          <BottomNav onMenuClick={() => setMobileOpen(true)} />
        </div>

        {/* Modal Hướng Dẫn Tương Tác Chuẩn Ngân Hàng (khi người dùng mở từ menu/chức năng AI) */}
        <ViOneAiTutorGuide
          isOpen={showAiTour}
          onClose={() => setShowAiTour(false)}
          systemType="crm"
        />

        {mustChangePwd && (
          <FirstLoginChangePasswordModal
            onSuccess={() => {
              setMustChangePwd(false);
              try {
                localStorage.removeItem("vba_must_change_password");
              } catch {}
            }}
            onLogout={() => {
              logout?.();
              window.location.replace("/auth");
            }}
          />
        )}

        {isUnauthorizedBlocked && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
            <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-2xl space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Bạn không có quyền truy cập trang này
              </h2>
              {unauthorizedMsg && unauthorizedMsg !== "Bạn không có quyền truy cập trang này" && (
                <p className="text-xs text-slate-600 leading-relaxed">{unauthorizedMsg}</p>
              )}
              <p className="text-xs font-semibold text-rose-600">
                Hệ thống sẽ tự động đăng xuất và chuyển về màn đăng nhập sau{" "}
                <span className="font-black text-sm">{Math.max(0, kickCountdown)}</span> giây...
              </p>
              <button
                type="button"
                onClick={() => {
                  try {
                    logout?.();
                    localStorage.removeItem("vibe_token");
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("token");
                  } catch {}
                  window.location.replace("/auth");
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer transition"
              >
                Về màn đăng nhập ngay
              </button>
            </div>
          </div>
        )}
      </div>
    </CommandPaletteProvider>
  );
}
