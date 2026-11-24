import { type ReactNode, useEffect, useState, useMemo } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home, Calendar, MessageSquare, User, QrCode,
  Scan, ChevronLeft, WifiOff, BarChart3,
  Smartphone, Download, X
} from "lucide-react";
import { useT, useLang, type TKey } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { fetchNestApi } from "@/lib/api-client";
import authBg from "@/assets/connect-auth-bg.jpg";

const CHARCOAL = "#0F172A";
const emblem83 = "/ceohn10-emblem-8.png";

import { PullToRefresh } from "@/components/member/PullToRefresh";
import { IncomingConnectionModal } from "@/components/member/IncomingConnectionModal";
import { WelcomeMemberModal } from "@/components/member/WelcomeMemberModal";
import { sendExternalNotification, registerNativePushUser, getNotificationPermission } from "@/lib/notification-permissions";
import { useAuth } from "@/context/AuthContext";
import { AssociationMemberQrModal } from "@/components/member/AssociationMemberQrModal";
import { canScanEventQr, isPrivilegedAdminOrPresident } from "@/lib/checkin-gatekeeper-auth";
import { getConnectAppSocket } from "@/hooks/use-connect-app-socket";
import { toast } from "sonner";
import { useCalendarNotifications } from "@/hooks/use-calendar-notifications";
import { CeoFacebookReminderBanner } from "@/components/calendar/CeoFacebookReminderBanner";
import { Ceo1983ColorThemeModal } from "@/components/member/Ceo1983ColorThemeModal";
import { FirstDayAiWelcomeModal } from "@/components/member/FirstDayAiWelcomeModal";
import { ViOneAiTutorGuide } from "@/components/common/ViOneAiTutorGuide";
import { applyCeo1983ColorTheme, getActiveCeo1983ColorThemeId, getActiveCeo1983ColorTheme, COLOR_THEME_EVENT, type Ceo1983ColorTheme } from "@/lib/ceohn10-color-theme";
import { SeasonalThemeAmbientOverlay } from "@/components/member/SeasonalThemeAmbientOverlay";
import { getEffectiveThemeOption, isEventThemeEnabled } from "@/components/member/SeasonalEventHeader";

/** Mobile-constrained container for the member app. */
export function MemberScreen({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Nhắc lịch thông minh kiểu Facebook Pop-up (7h sáng & trước sự kiện/cuộc họp)
  const { activeNotice, dismissNotice, snoozeNotice } = useCalendarNotifications();

  // Modal chọn 4 dạng màu tiêu chuẩn CEO HN10 (độc lập với CRM)
  const [colorThemeModalOpen, setColorThemeModalOpen] = useState(false);
  const [showAiTour, setShowAiTour] = useState(false);

  useEffect(() => {
    // Luôn áp dụng màu theme đã setup khi nạp MemberShell
    applyCeo1983ColorTheme(getActiveCeo1983ColorThemeId());

    const handleOpenColorModal = () => setColorThemeModalOpen(true);
    const handleOpenTour = () => setShowAiTour(true);
    window.addEventListener("ceohn10:open_color_theme_modal", handleOpenColorModal);
    window.addEventListener("vba:open_ai_tour", handleOpenTour);
    return () => {
      window.removeEventListener("ceohn10:open_color_theme_modal", handleOpenColorModal);
      window.removeEventListener("vba:open_ai_tour", handleOpenTour);
    };
  }, []);

  // ── BẢO VỆ ĐIỀU HƯỚNG CHUẨN NATIVE APP (NHƯ MOMO) ──
  // 1. Lắng nghe sự kiện phím Back cứng từ Native Android APK (Capacitor Bridge)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // KHÔNG tự động xin quyền thông báo khi mở app. Người dùng bật tại màn Cá nhân (association.profile).

    const handleNativeHardwareBack = () => {
      // A. Nếu có Dialog / Modal / Sheet đang mở: Bấm Back sẽ đóng modal trước
      const openDialog = document.querySelector(
        '[role="dialog"], [data-modal-container], .modal-standard, [data-state="open"]',
      );
      if (openDialog) {
        window.dispatchEvent(new CustomEvent("vba:close_top_modal"));
        (window as any).__VBA_HANDLED_BACK__ = true;
        return;
      }

      // B. Nếu đang ở các tab con (/association/events, /association/card, /association/messages, /association/profile)
      // Bấm Back sẽ quay về Trang chủ /association thay vì thoát app
      if (pathname !== "/association" && pathname.startsWith("/association")) {
        navigate({ to: "/association" });
        (window as any).__VBA_HANDLED_BACK__ = true;
        return;
      }

      // C. Nếu đang ở Trang chủ /association và không có modal: Báo cho Android Native đếm 2 lần mới thoát
      (window as any).__VBA_HANDLED_BACK__ = false;
    };

    window.addEventListener("native:hardware_back", handleNativeHardwareBack);
    return () => window.removeEventListener("native:hardware_back", handleNativeHardwareBack);
  }, [pathname, navigate]);

  // 2. Lắng nghe phím Back cho PWA Standalone / Capacitor native
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const openDialog = document.querySelector(
        '[role="dialog"], [data-modal-container], .modal-standard, [data-state="open"]',
      );
      if (openDialog) {
        window.dispatchEvent(new CustomEvent("vba:close_top_modal"));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const socket = getConnectAppSocket();

    const handleConnectionAccepted = (data: any) => {
      const partnerName =
        data?.accepterProfile?.display_name || data?.accepterProfile?.name || "Học viên CEO HN10";
      const partnerAvatar = data?.accepterProfile?.avatar_url || data?.accepterProfile?.avatar;
      const partnerCode = data?.accepterProfile?.memberCode || data?.accepterProfile?.code;
      const partnerUserId = data?.accepterProfile?.userId;

      // 1. Lưu vào vba_notifications (đẩy về chuông thông báo hiệp hội)
      try {
        const newNotif = {
          id: `conn_acc_${Date.now()}`,
          title: "Lời mời kết nối đã được chấp nhận!",
          body: `${partnerName} đã đồng ý lời mời kết nối của bạn. Giờ đây hai bạn có thể trò chuyện và giao thương.`,
          createdAt: new Date().toISOString(),
          unread: true,
          type: "connection",
          avatar: partnerAvatar,
        };
        const rawNotifs = localStorage.getItem("vba_notifications");
        const notifs = rawNotifs ? JSON.parse(rawNotifs) : [];
        notifs.unshift(newNotif);
        localStorage.setItem("vba_notifications", JSON.stringify(notifs.slice(0, 50)));

        // 2. Lưu vào danh bạ kết nối vba_connected_members
        const rawConnected = localStorage.getItem("vba_connected_members");
        const connectedList = rawConnected ? JSON.parse(rawConnected) : [];
        if (partnerCode && !connectedList.includes(partnerCode)) connectedList.push(partnerCode);
        if (partnerUserId && !connectedList.includes(partnerUserId))
          connectedList.push(partnerUserId);
        localStorage.setItem("vba_connected_members", JSON.stringify(connectedList));

        window.dispatchEvent(new CustomEvent("notifications-updated"));
        window.dispatchEvent(new CustomEvent("vba:conversation_updated"));
        // Lưu thông tin người mới kết nối nhất vào localStorage (Yêu cầu 1)
        if (partnerCode || partnerUserId) {
          localStorage.setItem("vba_latest_connected_id", partnerCode || partnerUserId);
          try {
            localStorage.setItem("vba_latest_connected_info", JSON.stringify({
              code: partnerCode,
              userId: partnerUserId,
              name: partnerName,
              avatar: data?.acceptorMember?.avatar || data?.acceptorProfile?.avatar_url,
              time: new Date().toISOString(),
            }));
          } catch { }
        }
        window.dispatchEvent(new CustomEvent("vba:connection_accepted", { detail: data }));
        window.dispatchEvent(new CustomEvent("vba.connection.changed"));
      } catch {
        /* ignore */
      }

      // 3. Thông báo đẩy 2 chiều trên app & hệ thống điện thoại
      toast.success(`${partnerName} đã đồng ý kết nối giao thương với bạn!`);
      sendExternalNotification("🎉 Lời mời kết nối đã được chấp nhận!", {
        body: `${partnerName} đã đồng ý lời mời kết nối của bạn.`,
        type: "notification",
        url: "/association/messages",
      });
    };

    const handleConnectionDeclined = (data: any) => {
      const declinerName =
        data?.declinerProfile?.display_name || data?.declinerProfile?.name || "Học viên CEO HN10";
      try {
        const newNotif = {
          id: `conn_dec_${Date.now()}`,
          title: "Lời mời kết nối đã bị từ chối",
          body: `${declinerName} đã từ chối lời mời kết nối của bạn.`,
          createdAt: new Date().toISOString(),
          unread: true,
          type: "connection",
        };
        const rawNotifs = localStorage.getItem("vba_notifications");
        const notifs = rawNotifs ? JSON.parse(rawNotifs) : [];
        notifs.unshift(newNotif);
        localStorage.setItem("vba_notifications", JSON.stringify(notifs.slice(0, 50)));

        window.dispatchEvent(new CustomEvent("notifications-updated"));
      } catch {
        /* ignore */
      }

      toast.info(`${declinerName} đã từ chối lời mời kết nối.`);
    };

    const handleMeetingRequested = (data: any) => {
      const hostName = data?.host?.name || "Học viên CEO HN10";
      try {
        const newNotif = {
          id: `meet_req_${Date.now()}`,
          title: "Lời mời hẹn gặp kết nối 1-on-1 mới!",
          body: `${hostName} đã gửi lời mời hẹn gặp kết nối 1-on-1 với bạn: "${data?.title || "Gặp gỡ kết nối"}".`,
          createdAt: new Date().toISOString(),
          unread: true,
          type: "meeting",
          actionUrl: "/association/members?tab=meetings",
          meetingId: data?.id,
        };
        const rawNotifs = localStorage.getItem("vba_notifications");
        const notifs = rawNotifs ? JSON.parse(rawNotifs) : [];
        notifs.unshift(newNotif);
        localStorage.setItem("vba_notifications", JSON.stringify(notifs.slice(0, 50)));

        window.dispatchEvent(new CustomEvent("notifications-updated"));
        window.dispatchEvent(new Event("vba.meeting.changed"));
      } catch {
        /* ignore */
      }

      toast.info(`Bạn có lời mời hẹn gặp 1-on-1 mới từ ${hostName}!`, {
        action: {
          label: "Xem chi tiết",
          onClick: () => {
            window.location.href = "/association/members?tab=meetings";
          },
        },
      });

      sendExternalNotification("🤝 Lời mời hẹn gặp 1-on-1 mới!", {
        body: `${hostName} đã gửi lời mời hẹn gặp kết nối 1-on-1 với bạn: "${data?.title || "Gặp gỡ kết nối"}"`,
        type: "meeting",
        url: "/association/members?tab=meetings",
      });
    };

    const handleMeetingResponded = (data: any) => {
      const responderName = data?.responder?.name || "Đối tác";
      const isAccepted = data?.action === "accept";
      try {
        const newNotif = {
          id: `meet_resp_${Date.now()}`,
          title: isAccepted ? "Lịch hẹn gặp đã được đồng ý!" : "Lịch hẹn gặp đã bị từ chối",
          body: isAccepted
            ? `${responderName} đã đồng ý lịch hẹn gặp kết nối với bạn!`
            : `${responderName} đã từ chối lịch hẹn gặp kết nối.`,
          createdAt: new Date().toISOString(),
          unread: true,
          type: "meeting",
          actionUrl: "/association/members?tab=meetings",
          meetingId: data?.id,
        };
        const rawNotifs = localStorage.getItem("vba_notifications");
        const notifs = rawNotifs ? JSON.parse(rawNotifs) : [];
        notifs.unshift(newNotif);
        localStorage.setItem("vba_notifications", JSON.stringify(notifs.slice(0, 50)));

        window.dispatchEvent(new CustomEvent("notifications-updated"));
        window.dispatchEvent(new Event("vba.meeting.changed"));
      } catch {
        /* ignore */
      }

      if (isAccepted) {
        toast.success(`${responderName} đã đồng ý lịch hẹn gặp kết nối 1-on-1!`);
      } else {
        toast.info(`${responderName} đã từ chối lịch hẹn gặp kết nối.`);
      }

      sendExternalNotification(
        isAccepted ? "🤝 Lịch hẹn đã được đồng ý!" : "🤝 Lịch hẹn đã bị từ chối",
        {
          body: isAccepted
            ? `${responderName} đã đồng ý lịch hẹn gặp kết nối với bạn!`
            : `${responderName} đã từ chối lịch hẹn gặp kết nối.`,
          type: "meeting",
          url: "/association/members?tab=meetings",
        },
      );
    };

    // Lắng nghe tất cả thông báo hệ thống, cơ hội, sự kiện, nhắc nhở (Yêu cầu 4)
    const handleGeneralNotification = (data: any) => {
      const title = data?.title || "CLB Doanh Nhân CEO HN10";
      const body = data?.body || data?.message || "Bạn có thông báo mới";
      const targetUrl = data?.targetRoute || data?.actionUrl || data?.url || "/association/notifications";

      // 1. Lưu vào localStorage để badge chuông cập nhật
      try {
        const rawNotifs = localStorage.getItem("vba_notifications");
        const notifs = rawNotifs ? JSON.parse(rawNotifs) : [];
        const newNotif = {
          id: data?.id || `notif_${Date.now()}`,
          title,
          body,
          createdAt: new Date().toISOString(),
          unread: true,
          type: data?.type || "info",
          actionUrl: targetUrl,
        };
        notifs.unshift(newNotif);
        localStorage.setItem("vba_notifications", JSON.stringify(notifs.slice(0, 50)));
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      } catch { }

      // 2. Nếu tab đang ẩn hoặc người dùng ra ngoài app: Bắn Notification ra ngoài màn hình thiết bị!
      if (typeof document !== "undefined" && (document.hidden || document.visibilityState === "hidden")) {
        sendExternalNotification(title, {
          body,
          url: targetUrl,
          type: "notification",
        });
      } else {
        toast.info(title, {
          description: body,
          action: {
            label: "Xem",
            onClick: () => {
              navigate({ to: targetUrl });
            },
          },
        });
      }
    };

    socket.on("connection:accepted", handleConnectionAccepted);
    socket.on("connection:declined", handleConnectionDeclined);
    socket.on("meeting:requested", handleMeetingRequested);
    socket.on("meeting:responded", handleMeetingResponded);
    socket.on("notification:new", handleGeneralNotification);
    socket.on("business_notification:new", handleGeneralNotification);
    socket.on("notification", handleGeneralNotification);
    socket.on("member_notification:new", handleGeneralNotification);

    return () => {
      socket.off("connection:accepted", handleConnectionAccepted);
      socket.off("connection:declined", handleConnectionDeclined);
      socket.off("meeting:requested", handleMeetingRequested);
      socket.off("meeting:responded", handleMeetingResponded);
      socket.off("notification:new", handleGeneralNotification);
      socket.off("business_notification:new", handleGeneralNotification);
      socket.off("notification", handleGeneralNotification);
      socket.off("member_notification:new", handleGeneralNotification);
    };
  }, [navigate]);

  // Tự động đăng ký native push user khi có thông tin Học viên
  useEffect(() => {
    if (user?.id) {
      registerNativePushUser(user.id);
    }
  }, [user?.id]);

  return (
    <div className="vba-app fixed inset-0 h-full w-full overflow-hidden bg-[#F8FAFC] text-slate-900 transition-colors duration-200 flex flex-col items-center">
      {/* Dải Edge Guard vô hình 2 bên mép: Đảm bảo pointer-events-none để không chặn cảm ứng người dùng */}
      <div
        className="fixed left-0 top-0 bottom-0 w-3 z-40 pointer-events-none touch-none select-none opacity-0"
        aria-hidden="true"
      />
      <div
        className="fixed right-0 top-0 bottom-0 w-3 z-40 pointer-events-none touch-none select-none opacity-0"
        aria-hidden="true"
      />

      <div
        className="relative z-10 flex h-full w-full max-w-[480px] flex-col justify-between overflow-hidden border-x border-slate-200 bg-white shadow-[0_0_50px_-10px_rgba(0,0,0,0.1)]"
      >
        <OfflineBanner />
        <PwaInstallBanner />
        <SeasonalThemeAmbientOverlay />
        {/* Vùng nội dung cuộn chiếm trọn không gian phía trên thanh TabBar */}
        <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          <PullToRefresh
            enableSwipeNav={false}
            pathname={pathname}
            className="flex-1"
          >
            {children}
          </PullToRefresh>
        </div>
        <MemberTabBar />
        <CeoFacebookReminderBanner
          notice={activeNotice}
          onDismiss={dismissNotice}
          onSnooze={snoozeNotice}
        />
        <IncomingConnectionModal />
        <WelcomeMemberModal />
        <FirstDayAiWelcomeModal onOpenTour={() => setShowAiTour(true)} />
        <ViOneAiTutorGuide
          isOpen={showAiTour}
          onClose={() => setShowAiTour(false)}
          systemType="app"
        />
        <Ceo1983ColorThemeModal
          open={colorThemeModalOpen}
          onClose={() => setColorThemeModalOpen(false)}
        />
      </div>
    </div>
  );
}

/** Shows a thin banner when the device loses its network connection. */
function OfflineBanner() {
  const t = useT();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="ceo-safe-sticky sticky top-0 z-40 flex items-center justify-center gap-2 bg-slate-800 px-4 py-1.5 text-[11px] font-semibold text-white">
      <WifiOff className="h-3.5 w-3.5" />
      {t("m.shell.offline")}
    </div>
  );
}

/** Banner gợi ý cài đặt PWA lên màn hình chính điện thoại khi chưa chạy ở chế độ standalone */
function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(ua) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    const dismissed = sessionStorage.getItem("ceohn10_pwa_banner_dismissed");

    if (isMobile && !standalone && !dismissed) {
      setShowBanner(true);
    }
  }, []);

  if (!showBanner) return null;

  return (
    <div className="relative z-30 flex items-center justify-between gap-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-3.5 py-2 text-white shadow-md border-b border-amber-400/30 shrink-0 select-none">
      <div className="flex items-center gap-2 min-w-0">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-400/40">
          <Smartphone className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-amber-300 leading-tight truncate">
            Cài đặt App CEO HN10
          </p>
          <p className="text-[10px] text-slate-200 leading-tight truncate">
            Thêm vào màn hình chính dùng như app gốc
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-install-prompt"));
          }}
          className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1 text-[11px] font-bold text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 active:scale-95 transition cursor-pointer flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          <span>Cài ngay</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setShowBanner(false);
            try {
              sessionStorage.setItem("ceohn10_pwa_banner_dismissed", "true");
            } catch { }
          }}
          className="grid h-6 w-6 place-items-center rounded-full text-slate-400 hover:text-white transition cursor-pointer"
          aria-label="Đóng"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Simple top bar with optional back button. */
export function MemberHeader({
  title,
  subtitle,
  back,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const t = useT();
  const navigate = useNavigate();

  const handleBack = () => {
    try {
      if (navigator.vibrate) navigator.vibrate(10);
    } catch { }
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 2) {
      window.history.back();
    } else {
      navigate({ to: "/association" });
    }
  };

  return (
    <header
      className="w-full sticky top-0 z-40 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-slate-200/80 dark:border-slate-800/80 bg-[var(--vba-bg-2)]/95 px-4 backdrop-blur-xl transition-all shadow-xs select-none"
      style={{
        paddingTop: "max(env(safe-area-inset-top, 0px), 8px)",
        paddingBottom: "8px",
        minHeight: "calc(max(env(safe-area-inset-top, 0px), 8px) + 42px)",
      }}
    >
      <div className="flex w-9 items-center">
        {back ? (
          <button
            onClick={handleBack}
            aria-label={t("m.shell.back")}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-800 dark:text-slate-200 hover:text-slate-950 transition hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <div className="min-w-0 text-center">
        <h1 className="truncate text-[15px] font-semibold text-[var(--vba-text)]">{title}</h1>
        {subtitle ? (
          <p className="truncate text-[11px] text-[var(--vba-text-muted)]">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex min-w-[36px] items-center justify-end">{right}</div>
    </header>
  );
}

function FooterHomeIcon({ active, brandColor }: { active: boolean; brandColor?: string }) {
  const activeColor = brandColor || "var(--vba-charcoal, #0F172A)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-6 transition-all duration-200">
      <path d="M10 18L14 18" stroke={active ? activeColor : "#8F8F8F"} strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.02099 4.6L5.58114 5.64106C3.65403 7.03443 2.69047 7.73112 2.25617 8.74938C1.82186 9.76763 1.99837 10.9162 2.35139 13.2135L2.65243 15.1724C3.15287 18.4289 3.40309 20.0572 4.571 21.0286C5.73891 22 7.44633 22 10.8612 22H13.1388C16.5537 22 18.2611 22 19.429 21.0286C20.5969 20.0572 20.8471 18.4289 21.3476 15.1724L21.6486 13.2135C22.0016 10.9162 22.1781 9.76763 21.7438 8.74938C21.3095 7.73112 20.346 7.03443 18.4189 5.64106L16.979 4.6C14.5817 2.86667 13.3831 2 12 2C10.6169 2 9.41829 2.86667 7.02099 4.6Z" stroke={active ? activeColor : "#8F8F8F"} strokeWidth={active ? "2" : "1.5"} strokeLinejoin="round" />
    </svg>
  );
}

function FooterEventsIcon({ active, brandColor }: { active: boolean; brandColor?: string }) {
  const activeColor = brandColor || "var(--vba-charcoal, #0F172A)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-6 transition-all duration-200">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke={active ? activeColor : "#8F8F8F"} strokeWidth={active ? "2" : "1.5"} />
      <path d="M16 2V6" stroke={active ? activeColor : "#8F8F8F"} strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" />
      <path d="M8 2V6" stroke={active ? activeColor : "#8F8F8F"} strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" />
      <path d="M3 10H21" stroke={active ? activeColor : "#8F8F8F"} strokeWidth={active ? "2" : "1.5"} />
      <circle cx="8" cy="14" r="1.2" fill={active ? activeColor : "#8F8F8F"} />
      <circle cx="12" cy="14" r="1.2" fill={active ? activeColor : "#8F8F8F"} />
      <circle cx="16" cy="14" r="1.2" fill={active ? activeColor : "#8F8F8F"} />
      <circle cx="8" cy="18" r="1.2" fill={active ? activeColor : "#8F8F8F"} />
      <circle cx="12" cy="18" r="1.2" fill={active ? activeColor : "#8F8F8F"} />
      <circle cx="16" cy="18" r="1.2" fill={active ? activeColor : "#8F8F8F"} />
    </svg>
  );
}

function FooterConnectIcon({ active, brandColor }: { active: boolean; brandColor?: string }) {
  const activeColor = brandColor || "var(--vba-charcoal, #0F172A)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-6 transition-all duration-200">
      <circle cx="9" cy="7" r="4" stroke={active ? activeColor : "#8F8F8F"} strokeWidth={active ? "2" : "1.5"} />
      <path d="M2 21V19C2 15.6863 4.68629 13 8 13H10C13.3137 13 16 15.6863 16 19V21" stroke={active ? activeColor : "#8F8F8F"} strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" />
      <path d="M16 11L18 13L22 9" stroke={active ? activeColor : "#8F8F8F"} strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FooterUserIcon({ active, brandColor }: { active: boolean; brandColor?: string }) {
  const activeColor = brandColor || "var(--vba-charcoal, #0F172A)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-6 transition-all duration-200">
      <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke={active ? activeColor : "#8F8F8F"} strokeWidth={active ? "2.2" : "1.75"} />
      <path d="M14.75 9.5C14.75 11.0188 13.5188 12.25 12 12.25C10.4812 12.25 9.25 11.0188 9.25 9.5C9.25 7.98122 10.4812 6.75 12 6.75C13.5188 6.75 14.75 7.98122 14.75 9.5Z" stroke={active ? activeColor : "#8F8F8F"} strokeWidth={active ? "2.2" : "1.75"} />
      <path d="M5.5 19L6.0604 18.0193C6.95061 16.4614 8.60733 15.5 10.4016 15.5H13.5984C15.3927 15.5 17.0494 16.4614 17.9396 18.0193L18.5 19" stroke={active ? activeColor : "#8F8F8F"} strokeWidth={active ? "2.2" : "1.75"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const tabs = [
  { to: "/association", label: "m.shell.tab_home", icon: FooterHomeIcon, exact: true },
  { to: "/association/events", label: "m.shell.tab_events" as any, icon: FooterEventsIcon },
  { to: "/association/card", label: "m.shell.tab_qr", icon: null, center: true },
  { to: "/association/connect", label: "m.shell.tab_connect" as any, icon: FooterConnectIcon },
  { to: "/association/profile", label: "m.shell.tab_profile", icon: FooterUserIcon },
] satisfies { to: string; label: any; icon: any; exact?: boolean; center?: boolean }[];

function useVirtualKeyboard() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Chỉ kiểm tra virtual keyboard trên thiết bị di động có màn hình cảm ứng thực sự
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

    // Trên máy tính / Desktop / Laptop có chuột & phím vật lý: không bao giờ ẩn tab bar footer
    if (!isTouchDevice) {
      return;
    }

    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const diff = window.innerHeight - vv.height - (vv.offsetTop || 0);
      // Trên mobile thực tế, bàn phím ảo Android/iOS luôn chiếm tối thiểu > 180px
      if (diff > 180) {
        setKeyboardOpen(true);
      } else {
        setKeyboardOpen(false);
      }
    };

    vv.addEventListener("resize", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
    };
  }, []);

  return keyboardOpen;
}

function MemberTabBar() {
  const t = useT();
  const { lang } = useLang();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const keyboardOpen = useVirtualKeyboard();
  const [isMidAutumn, setIsMidAutumn] = useState(false);
  const { user } = useAuth();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  // Yêu cầu 3: Chu kỳ quét QR (2.5s thanh ngang quét + icon Scan vuông -> 2s hiện mã QR tĩnh)
  const [isScanningPhase, setIsScanningPhase] = useState(true);

  // Màu thương hiệu động theo cài đặt hệ thống tại màn cá nhân (Yêu cầu nút Quét QR và Active tab)
  const [brandColorTheme, setBrandColorTheme] = useState<Ceo1983ColorTheme>(() => getActiveCeo1983ColorTheme());
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (e?.detail) setBrandColorTheme(e.detail);
      else setBrandColorTheme(getActiveCeo1983ColorTheme());
    };
    window.addEventListener(COLOR_THEME_EVENT, handleThemeChange);
    window.addEventListener("theme-color-changed", handleThemeChange);
    window.addEventListener("storage", handleThemeChange);
    return () => {
      window.removeEventListener(COLOR_THEME_EVENT, handleThemeChange);
      window.removeEventListener("theme-color-changed", handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  useEffect(() => {
    let timer: any;
    if (isScanningPhase) {
      // Đang quét 2.5s
      timer = setTimeout(() => {
        setIsScanningPhase(false);
      }, 2500);
    } else {
      // Quét xong hiện icon mã QR đúng 2s rồi lặp lại quét
      timer = setTimeout(() => {
        setIsScanningPhase(true);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isScanningPhase]);

  // Check if current user is authorized as event QR scanner / check-in staff
  const [canScanQr, setCanScanQr] = useState<boolean>(() => {
    return isPrivilegedAdminOrPresident(user);
  });

  useEffect(() => {
    if (!user) {
      setCanScanQr(false);
      return;
    }
    if (isPrivilegedAdminOrPresident(user)) {
      setCanScanQr(true);
      return;
    }

    fetchNestApi<any[]>('/events')
      .then((events) => {
        if (!Array.isArray(events) || events.length === 0) {
          setCanScanQr(false);
          return;
        }
        setCanScanQr(canScanEventQr(user, events));
      })
      .catch(() => { });
  }, [user]);

  const visibleTabs = tabs;

  useEffect(() => {
    const handleOpenQr = () => setQrModalOpen(true);
    window.addEventListener("vba:open_qr_modal", handleOpenQr);
    return () => window.removeEventListener("vba:open_qr_modal", handleOpenQr);
  }, []);

  const tabLabels: Record<string, { vi: string; en: string }> = {
    "/association": { vi: "Trang chủ", en: "Home" },
    "/association/events": { vi: "Hoạt động", en: "Activities" },
    "/association/card": { vi: "Quét QR", en: "Scan QR" },
    "/association/connect": { vi: "Gắn kết", en: "Connect" },
    "/association/messages": { vi: "Gắn kết", en: "Connect" },
    "/association/profile": { vi: "Cá nhân", en: "Profile" },
  };

  const memberCode = useMemo(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("vba_my_member") : null;
      if (raw) {
        const m = JSON.parse(raw);
        if (m?.code) return m.code;
      }
    } catch { }
    return user?.member_code || user?.id || "";
  }, [user]);

  const memberName = useMemo(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("vba_my_member") : null;
      if (raw) {
        const m = JSON.parse(raw);
        if (m?.name) return m.name;
      }
    } catch { }
    return user?.full_name || user?.name || "Học viên CLB CEO HN10";
  }, [user]);

  const memberCompany = useMemo(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("vba_my_member") : null;
      if (raw) {
        const m = JSON.parse(raw);
        if (m?.company || m?.company_name) return m.company || m.company_name;
      }
    } catch { }
    return user?.company || "CLB Doanh Nhân CEO HN10";
  }, [user]);

  const memberTitle = useMemo(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("vba_my_member") : null;
      if (raw) {
        const m = JSON.parse(raw);
        if (m?.title || m?.job_title || m?.position || m?.professional_title) {
          return m.title || m.job_title || m.position || m.professional_title;
        }
      }
    } catch { }
    return user?.title || "Học viên chính thức";
  }, [user]);

  const memberAvatar = useMemo(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("vba_my_member") : null;
      if (raw) {
        const m = JSON.parse(raw);
        if (m?.avatar || m?.avatar_url) return m.avatar || m.avatar_url;
      }
    } catch { }
    return user?.avatar_url || user?.avatar || null;
  }, [user]);

  // Track new events count & unread messages count for animated badges
  const [newEventCount, setNewEventCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const rawCount = localStorage.getItem("vba_new_event_count");
      if (rawCount) return Math.max(0, parseInt(rawCount, 10));
      const seen = localStorage.getItem("vba_seen_events");
      if (!seen) return 2;
    } catch { }
    return 0;
  });

  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const rawCount = localStorage.getItem("vba_total_unread_messages");
      if (rawCount) return Math.max(0, parseInt(rawCount, 10));
      const rawConv = localStorage.getItem("vba_conversations");
      if (rawConv) {
        const list = JSON.parse(rawConv);
        if (Array.isArray(list)) {
          return list.reduce((acc: number, c: any) => acc + (Number(c.unread) || 0), 0);
        }
      }
    } catch { }
    return 1;
  });

  // Clear or update badges based on current route
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (pathname === "/association/events" || pathname.startsWith("/association/events/")) {
      setNewEventCount(0);
      try {
        localStorage.setItem("vba_new_event_count", "0");
        localStorage.setItem("vba_seen_events", Date.now().toString());
      } catch { }
    }

    if (pathname === "/association/messages" || pathname.startsWith("/association/messages/")) {
      setUnreadMessageCount(0);
      try {
        localStorage.setItem("vba_total_unread_messages", "0");
      } catch { }
    }
  }, [pathname]);

  // Listen to socket and custom events for new messages and new events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessagesUpdate = () => {
      try {
        const rawConv = localStorage.getItem("vba_conversations");
        if (rawConv) {
          const list = JSON.parse(rawConv);
          if (Array.isArray(list)) {
            const sum = list.reduce((acc: number, c: any) => acc + (Number(c.unread) || 0), 0);
            setUnreadMessageCount(sum);
            return;
          }
        }
        const rawCount = localStorage.getItem("vba_total_unread_messages");
        if (rawCount) {
          setUnreadMessageCount(Math.max(0, parseInt(rawCount, 10)));
        }
      } catch { }
    };

    const handleNewMessage = () => {
      if (pathname !== "/association/messages") {
        setUnreadMessageCount((prev) => prev + 1);
      }
    };

    const handleNewEvent = () => {
      if (pathname !== "/association/events") {
        setNewEventCount((prev) => prev + 1);
      }
    };

    window.addEventListener("vba:conversation_updated", handleMessagesUpdate);
    window.addEventListener("dm:message_received", handleNewMessage);
    window.addEventListener("vba:new_event", handleNewEvent);
    window.addEventListener("events-updated", handleNewEvent);
    window.addEventListener("storage", handleMessagesUpdate);

    return () => {
      window.removeEventListener("vba:conversation_updated", handleMessagesUpdate);
      window.removeEventListener("dm:message_received", handleNewMessage);
      window.removeEventListener("vba:new_event", handleNewEvent);
      window.removeEventListener("events-updated", handleNewEvent);
      window.removeEventListener("storage", handleMessagesUpdate);
    };
  }, [pathname]);

  const [activeThemeOption, setActiveThemeOption] = useState(() => getEffectiveThemeOption());
  const isThemeActive = isEventThemeEnabled() && activeThemeOption?.id !== "none" && activeThemeOption?.id !== "classic";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const check = () => {
        const enabled = localStorage.getItem("vba_event_theme_enabled") === "true";
        const disabled = localStorage.getItem("vba_event_theme_disabled") === "true";
        const type = localStorage.getItem("vba_event_theme_type") || "mid-autumn";
        setIsMidAutumn(enabled && !disabled && type === "mid-autumn");
        setActiveThemeOption(getEffectiveThemeOption());
      };
      check();
      window.addEventListener("vba-event-theme-changed", check);
      window.addEventListener("ceohn10-theme-changed", check);
      window.addEventListener("storage", check);
      return () => {
        window.removeEventListener("vba-event-theme-changed", check);
        window.removeEventListener("ceohn10-theme-changed", check);
        window.removeEventListener("storage", check);
      };
    }
  }, []);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  // Automatically hide bottom tab bar when mobile keyboard is open, user is typing,
  // OR when mustChangePassword is required for a new member
  const isMustChangePassword = typeof window !== "undefined" && localStorage.getItem("vba_must_change_password") === "true";
  // Bottom tab bar remains persistent so search/input focus never causes footer loss.
  if (isMustChangePassword) return null;

  return (
    <>
      <nav
        className="vba-bottom-bar sticky bottom-0 z-40 mx-auto w-full max-w-[480px] shrink-0 select-none transition-all duration-200 px-3 pb-[max(env(safe-area-inset-bottom,0px),10px)] pt-1.5 bg-gradient-to-t from-slate-100/90 via-slate-50/70 to-transparent dark:from-slate-950/90 dark:via-slate-900/70 pointer-events-none"
      >
        <div
          className="pointer-events-auto relative flex items-center justify-between gap-1.5 p-1.5 rounded-[26px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.12)] transition-all"
        >
          {/* Festive Mid-Autumn Corner Dangling Lantern */}
          {isMidAutumn && (
            <div
              className="pointer-events-none absolute left-3 -top-3.5 flex flex-col items-center select-none"
              aria-hidden="true"
            >
              <span
                className="text-[14px] animate-bounce filter drop-shadow-[0_2px_6px_rgba(239,68,68,0.7)]"
                style={{ animationDuration: "3s" }}
              >
                🏮
              </span>
            </div>
          )}

          {/* Festive Mid-Autumn Corner Moon Rabbit */}
          {isMidAutumn && (
            <div
              className="pointer-events-none absolute right-3.5 -top-3.5 flex flex-col items-center select-none"
              aria-hidden="true"
            >
              <span className="text-[13px] animate-pulse filter drop-shadow-[0_2px_6px_rgba(251,191,36,0.8)]">
                🥮
              </span>
            </div>
          )}

          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.to, tab.exact);

            const handleTabClick = () => {
              try {
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                  navigator.vibrate(8);
                }
              } catch { }
              // Nếu bấm vào tab Mạng lưới (messages): luôn reset về giao diện Bản tin Mạng Lưới
              if (tab.to.includes("messages")) {
                window.dispatchEvent(new CustomEvent("vba:reset_network_tab"));
              }
              // Bấm lại vào tab đang active -> Cuộn mượt lên đỉnh (chuẩn MoMo / iOS Native)
              if (active) {
                window.dispatchEvent(new CustomEvent("vba:scroll_to_top"));
              }
            };

            if (tab.center) {
              return (
                <div key={tab.to} className="relative flex flex-col items-center justify-center shrink-0 px-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleTabClick();
                      navigate({ to: "/association/card" as any });
                      setQrModalOpen(true);
                    }}
                    aria-label="Quét mã QR Check-in"
                    className="-mt-5 relative size-12 rounded-full bg-slate-900 text-white border-2 border-white dark:border-slate-800 shadow-[0_6px_20px_rgba(15,23,42,0.35)] flex flex-col items-center justify-center active:scale-90 transition-transform cursor-pointer outline-none group"
                  >
                    {isScanningPhase ? (
                      <Scan className="size-6 text-white stroke-[2.3] animate-pulse" />
                    ) : (
                      <QrCode className="size-6 text-white stroke-[2.3] animate-in fade-in zoom-in-95 duration-200" />
                    )}

                    {/* MoMo-style Scanning Laser Beam: Chỉ hiện và quét từ trên xuống khi trong chu kỳ quét */}
                    {isScanningPhase && (
                      <div
                        className="absolute inset-x-1.5 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_8px_#38bdf8] pointer-events-none"
                        style={{
                          animation: "momoLaserScan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                        }}
                      />
                    )}

                    {isThemeActive && (
                      <span
                        className="absolute -top-1 -right-1 text-[11px] select-none z-30 filter drop-shadow-sm animate-bounce"
                        aria-hidden="true"
                      >
                        {activeThemeOption.id === "tet"
                          ? "🧧"
                          : activeThemeOption.id === "christmas"
                            ? "🔔"
                            : activeThemeOption.id === "national-day"
                              ? "🇻🇳"
                              : activeThemeOption.id === "mid-autumn"
                                ? "🌕"
                                : activeThemeOption.id === "ceohn10-birthday"
                                  ? "🎂"
                                  : activeThemeOption.iconEmoji || "✨"}
                      </span>
                    )}
                  </button>
                  <span className="text-[9.5px] font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-3">
                    Quét QR
                  </span>
                </div>
              );
            }

            // Custom seasonal tab badges
            let seasonalBadge: ReactNode = null;
            if (isThemeActive) {
              const thId = activeThemeOption.id;
              let emoji = "";
              if (tab.to === "/association") {
                emoji = thId === "tet" ? "🌸" : thId === "christmas" ? "🎄" : thId === "national-day" ? "🇻🇳" : thId === "mid-autumn" ? "🌕" : thId === "ceohn10-birthday" ? "🎂" : "👑";
              } else if (tab.to.includes("analytics")) {
                emoji = thId === "tet" ? "🧧" : thId === "christmas" ? "🎁" : thId === "mid-autumn" ? "🥮" : "📊";
              } else if (tab.to.includes("messages")) {
                emoji = thId === "tet" ? "🌸" : thId === "christmas" ? "❄️" : thId === "mid-autumn" ? "🐰" : "💬";
              } else if (tab.to.includes("profile")) {
                emoji = thId === "tet" ? "🧧" : thId === "christmas" ? "🎅" : thId === "mid-autumn" ? "🏮" : "🎖️";
              }
              if (emoji) {
                seasonalBadge = (
                  <span
                    className="absolute -top-1.5 -right-1.5 text-[9px] animate-pulse select-none"
                    aria-hidden="true"
                  >
                    {emoji}
                  </span>
                );
              }
            } else if (isMidAutumn) {
              if (tab.to.includes("notifications")) {
                seasonalBadge = (
                  <span
                    className="absolute -top-1 -right-1 text-[9px] animate-bounce select-none"
                    style={{ animationDuration: "2.4s" }}
                    aria-hidden="true"
                  >
                    🏮
                  </span>
                );
              } else if (tab.to.includes("messages")) {
                seasonalBadge = (
                  <span
                    className="absolute -top-1.5 -right-1.5 text-[9px] animate-pulse select-none"
                    aria-hidden="true"
                  >
                    🐰
                  </span>
                );
              } else if (tab.to.includes("profile")) {
                seasonalBadge = (
                  <span
                    className="absolute -top-1.5 -right-1.5 text-[9px] animate-wiggle select-none"
                    aria-hidden="true"
                  >
                    ✨
                  </span>
                );
              }
            }

            // Animated notification badges for Events and Messages
            let notificationBadge: ReactNode = null;
            if (tab.to === "/association/events" && newEventCount > 0) {
              notificationBadge = (
                <span
                  className="absolute -top-1.5 -right-2.5 z-20 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-1 text-[9px] font-black text-white shadow-xs ring-1 ring-white/80 select-none animate-pulse"
                  title={`${newEventCount} sự kiện mới`}
                >
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
                  <span className="relative z-10">{newEventCount > 9 ? "9+" : newEventCount}</span>
                </span>
              );
            } else if ((tab.to === "/association/connect" || tab.to === "/association/messages") && unreadMessageCount > 0) {
              notificationBadge = (
                <span
                  className="absolute -top-1.5 -right-2.5 z-20 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-[#B8860B] px-1 text-[9px] font-black text-white shadow-xs ring-1 ring-white/80 select-none animate-pulse"
                  title={`${unreadMessageCount} cập nhật mạng lưới`}
                >
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
                  <span className="relative z-10">
                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                  </span>
                </span>
              );
            }

            const linkSearch = tab.to === "/association/messages" ? { tab: "feed" } : undefined;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                search={linkSearch as any}
                onClick={handleTabClick}
                className={`relative flex-1 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-95 cursor-pointer border ${
                  active
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100/90 dark:hover:bg-slate-800/80"
                }`}
              >
                <div className="relative">
                  {Icon && <Icon active={active} brandColor={active ? "#FFFFFF" : undefined} />}
                  {notificationBadge || seasonalBadge}
                </div>
                <span
                  className={`text-[10px] tracking-tight leading-3 select-none font-['Inter'] ${
                    active
                      ? "font-bold text-white"
                      : "font-medium text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {lang === "en"
                    ? tabLabels[tab.to]?.en || t(tab.label)
                    : tabLabels[tab.to]?.vi || t(tab.label)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <AssociationMemberQrModal
        open={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
        }}
        defaultTab="scan_qr"
        memberCode={memberCode}
        memberName={memberName}
        memberTitle={memberTitle}
        memberCompany={memberCompany}
        memberAvatar={memberAvatar}
      />
    </>
  );
}

/** Reusable section heading with optional "see all" link. */
export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[15px] font-bold text-[var(--vba-text)]">{title}</h2>
      {action}
    </div>
  );
}
