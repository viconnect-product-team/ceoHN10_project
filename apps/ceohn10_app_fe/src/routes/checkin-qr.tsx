import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Copy,
  Check,
  Printer,
  CalendarDays,
  MapPin,
  Users,
  RefreshCw,
  ShieldAlert,
  QrCode as QrCodeIcon,
  DollarSign,
  Ticket,
  Save,
  ExternalLink,
  Download,
  Settings2,
  FileCheck2,
  UserCheck,
  Building2,
  CreditCard,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isPrivilegedAdminOrPresident, isMediaDepartmentMember } from "@/lib/checkin-gatekeeper-auth";
import { AppShell } from "@/components/dashboard/AppShell";
import { QrCanvas } from "@/components/member/QrCanvas";
import { getCheckinQrEventsFn, type CheckinQrEvent } from "@/lib/checkin-qr.functions";
import { fetchNestApi } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkin-qr")({
  ssr: false,
  staleTime: 0,
  gcTime: 0,
  shouldReload: true,
  loader: async () => {
    try {
      const data = await getCheckinQrEventsFn();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("[checkin-qr] getCheckinQrEventsFn loader error:", err);
      return [];
    }
  },
  component: CheckinQrSetupPage,
  head: () => ({
    meta: [
      { title: "Cấu hình Mã QR & Biểu mẫu Sự kiện | CEO HN10 CRM" },
      {
        name: "description",
        content: "Cấu hình 2 mã QR chuẩn cho sự kiện: Mã QR đăng ký và Mã QR check-in kèm biểu mẫu có phí hoặc miễn phí.",
      },
    ],
  }),
});

function CheckinQrSetupPage() {
  const router = useRouter();
  const rawEvents = Route.useLoaderData();
  const events: CheckinQrEvent[] = Array.isArray(rawEvents) ? rawEvents : [];
  const { user } = useAuth();
  const isAuthorized = isPrivilegedAdminOrPresident(user) || isMediaDepartmentMember(user);

  // Chọn sự kiện để setup
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const urlEvt = sp.get("eventId");
      if (urlEvt && events.some((e) => e.id === urlEvt)) return urlEvt;
    }
    return events[0]?.id || "";
  });

  const [refreshing, setRefreshing] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedRegLink, setCopiedRegLink] = useState(false);
  const [copiedCheckinLink, setCopiedCheckinLink] = useState(false);

  // Tìm sự kiện đang được chọn
  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  // Cấu hình sự kiện: Có phí / Miễn phí
  const [isPaidEvent, setIsPaidEvent] = useState<boolean>(false);
  const [ticketFee, setTicketFee] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState<string>("Chuyển khoản theo cú pháp: [Họ Tên] [SĐT] [Tên Sự Kiện]");
  const [bankAccount, setBankAccount] = useState<string>("8888202610 - MB Bank (Quỹ Sự Kiện CEO HN10)");

  // Cấu hình các trường trong Form Đăng Ký
  const [formFields, setFormFields] = useState({
    fullName: true,
    phone: true,
    email: true,
    company: true,
    position: true,
    networkingNeed: true,
    requirePayment: false,
  });

  // Đồng bộ cấu hình khi đổi sự kiện
  useEffect(() => {
    if (activeEvent) {
      const price = Number(activeEvent.ticketPrice || 0);
      setIsPaidEvent(price > 0);
      setTicketFee(price);
      setFormFields((prev) => ({
        ...prev,
        requirePayment: price > 0,
      }));
    }
  }, [activeEvent]);

  // Xử lý lưu cấu hình
  const handleSaveSetup = async () => {
    if (!activeEvent) return;
    setSavingConfig(true);
    try {
      const currentPrice = isPaidEvent ? Number(ticketFee) : 0;
      await fetchNestApi(`/events/${activeEvent.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ticketPrice: currentPrice,
          isPaid: isPaidEvent,
          paymentNote: paymentNote,
          bankAccount: bankAccount,
          formFieldsConfig: formFields,
        }),
      }).catch(async () => {
        // Fallback update ticket price endpoint
        await fetchNestApi(`/events/${activeEvent.id}/ticket-price`, {
          method: "PATCH",
          body: JSON.stringify({ ticketPrice: currentPrice }),
        }).catch(() => {});
      });

      toast.success(
        `Đã lưu cấu hình thành công! Sự kiện "${activeEvent.name}" hiện là ${
          isPaidEvent ? `Có phí (${ticketFee.toLocaleString("vi-VN")} đ)` : "Miễn phí (0đ)"
        }.`
      );
      await router.invalidate();
    } catch (err: any) {
      toast.error("Lỗi khi lưu cấu hình: " + (err?.message || ""));
    } finally {
      setSavingConfig(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await router.invalidate();
      toast.success("Đã làm mới dữ liệu sự kiện!");
    } finally {
      setRefreshing(false);
    }
  };

  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const publicAppOrigin = isLocalHost ? window.location.origin : "https://ceohn10.viconnect.vn";

  // URL 2 Mã QR tối đa theo yêu cầu
  const registerUrl = activeEvent ? `${publicAppOrigin}/guest-event-register/${activeEvent.id}` : "";
  const checkinUrl = activeEvent ? `${publicAppOrigin}/event-checkin?eventId=${activeEvent.id}` : "";

  const copyRegister = async () => {
    if (!registerUrl) return;
    try {
      await navigator.clipboard.writeText(registerUrl);
      setCopiedRegLink(true);
      setTimeout(() => setCopiedRegLink(false), 2000);
      toast.success("Đã sao chép liên kết Mã QR Đăng ký!");
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  const copyCheckin = async () => {
    if (!checkinUrl) return;
    try {
      await navigator.clipboard.writeText(checkinUrl);
      setCopiedCheckinLink(true);
      setTimeout(() => setCopiedCheckinLink(false), 2000);
      toast.success("Đã sao chép liên kết Mã QR Check-in!");
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  if (!isAuthorized) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center mt-12 space-y-3 shadow-xl">
          <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Không có quyền truy cập</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Chức năng Cấu hình Mã QR & Biểu mẫu Sự kiện chỉ dành cho Ban Quản trị, Chủ tịch hoặc Ban Truyền Thông được phân công.
          </p>
          <div className="pt-2">
            <Link
              to="/events"
              className="inline-block px-4 py-2 rounded-xl bg-[#003B95] text-white font-bold text-xs shadow-md hover:bg-[#002B70] transition"
            >
              Về danh sách sự kiện
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 space-y-6">
        {/* Header bar */}
        <header className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#003B95] text-white shadow-md">
                <QrCodeIcon className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Cấu Hình Mã QR &amp; Biểu Mẫu Sự Kiện
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Thiết lập tối đa đúng 2 mã QR chuẩn hóa cho mỗi sự kiện: Mã QR Đăng ký (kèm form có phí/miễn phí) và Mã QR Check-in vào cửa.
            </p>
          </div>

          <div className="flex items-center gap-2.5 print:hidden">
            <button
              type="button"
              onClick={refreshData}
              disabled={refreshing}
              className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-slate-900 hover:bg-black px-4 text-xs font-bold text-white transition shadow-sm cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In Bảng Standee QR</span>
            </button>
          </div>
        </header>

        {/* BƯỚC 1: THANH CHỌN SỰ KIỆN */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#DC2626]" />
              <label htmlFor="select-event" className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                Chọn Sự Kiện Cần Cấu Hình:
              </label>
            </div>
            <div className="flex-1 max-w-xl">
              <select
                id="select-event"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs outline-none focus:border-[#003B95] focus:ring-2 focus:ring-[#003B95]/20 cursor-pointer"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({new Date(e.date).toLocaleDateString("vi-VN")}) — {e.checkedIn || 0}/{e.registered || 0} đã check-in
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeEvent && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                Mã sự kiện: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[#003B95]">{activeEvent.id}</code>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-amber-500" />
                <span className="truncate max-w-xs">{activeEvent.location || "Trung tâm Hội nghị Hà Nội"}</span>
              </span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <Users className="h-3.5 w-3.5" />
                <span>{activeEvent.checkedIn || 0}/{activeEvent.registered || 0} đại biểu đã tham gia</span>
              </span>
            </div>
          )}
        </div>

        {activeEvent ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CỘT TRÁI: BẢNG SET UP FORM & VÉ CÓ PHÍ / MIỄN PHÍ */}
            <div className="lg:col-span-5 space-y-5">
              {/* Box 1: Cấu hình Phí vé / Miễn phí */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <CreditCard className="h-5 w-5 text-[#003B95]" />
                  <h3 className="text-sm font-bold text-slate-900">1. Cấu Hình Phí Vé &amp; Tài Khoản Thu</h3>
                </div>

                {/* Chọn Có Phí hoặc Miễn Phí */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaidEvent(false);
                      setTicketFee(0);
                      setFormFields((prev) => ({ ...prev, requirePayment: false }));
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      !isPaidEvent
                        ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 text-emerald-950 font-bold"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Miễn Phí (0đ)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Đại biểu đăng ký không cần nộp phí vé.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPaidEvent(true);
                      if (ticketFee === 0) setTicketFee(500000);
                      setFormFields((prev) => ({ ...prev, requirePayment: true }));
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isPaidEvent
                        ? "border-[#003B95] bg-blue-50/60 ring-2 ring-[#003B95]/20 text-[#003B95] font-bold"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#003B95]" />
                      <span>Có Phí Tham Dự</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Hiện giá vé &amp; hướng dẫn QR chuyển khoản.</p>
                  </button>
                </div>

                {/* Nếu có phí -> Nhập số tiền & thông tin chuyển khoản */}
                {isPaidEvent && (
                  <div className="space-y-3 pt-2 animate-in fade-in">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Mức Phí Vé Tham Dự (VNĐ):</label>
                      <div className="mt-1 relative">
                        <DollarSign className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          value={ticketFee}
                          onChange={(e) => setTicketFee(Number(e.target.value))}
                          placeholder="VD: 500000"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#003B95]/20"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Bằng chữ: <span className="font-bold text-[#DC2626]">{ticketFee.toLocaleString("vi-VN")} VNĐ / vé</span>
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700">Tài Khoản Nhận Tiền / Ngân Hàng:</label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#003B95]/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700">Cú Pháp / Ghi Chú Chuyển Khoản:</label>
                      <input
                        type="text"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#003B95]/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Box 2: Cấu hình Trường Thông Tin Biểu Mẫu (Dynamic Form Fields) */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Settings2 className="h-5 w-5 text-[#DC2626]" />
                  <h3 className="text-sm font-bold text-slate-900">2. Thiết Lập Trường Biểu Mẫu Đăng Ký</h3>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <span className="font-semibold text-slate-800">Họ và tên đại biểu</span>
                    <input type="checkbox" checked={formFields.fullName} disabled className="rounded text-[#003B95]" />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <span className="font-semibold text-slate-800">Số điện thoại (Nhận vé Zalo/SMS)</span>
                    <input type="checkbox" checked={formFields.phone} disabled className="rounded text-[#003B95]" />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <span className="font-semibold text-slate-800">Email (Nhận vé điện tử PDF)</span>
                    <input
                      type="checkbox"
                      checked={formFields.email}
                      onChange={(e) => setFormFields({ ...formFields, email: e.target.checked })}
                      className="rounded text-[#003B95]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <span className="font-semibold text-slate-800">Tên Doanh nghiệp / Công ty</span>
                    <input
                      type="checkbox"
                      checked={formFields.company}
                      onChange={(e) => setFormFields({ ...formFields, company: e.target.checked })}
                      className="rounded text-[#003B95]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <span className="font-semibold text-slate-800">Chức vụ / Chức danh</span>
                    <input
                      type="checkbox"
                      checked={formFields.position}
                      onChange={(e) => setFormFields({ ...formFields, position: e.target.checked })}
                      className="rounded text-[#003B95]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <span className="font-semibold text-slate-800">Nhu cầu kết nối giao thương B2B</span>
                    <input
                      type="checkbox"
                      checked={formFields.networkingNeed}
                      onChange={(e) => setFormFields({ ...formFields, networkingNeed: e.target.checked })}
                      className="rounded text-[#003B95]"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSetup}
                  disabled={savingConfig}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-60"
                >
                  {savingConfig ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Đang lưu thiết lập...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Lưu Cấu Hình Sự Kiện &amp; Biểu Mẫu</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CỘT PHẢI: HIỂN THỊ CHUẨN XÁC ĐÚNG 2 MÃ QR (Mỗi sự kiện tối đa 2 mã) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-amber-50 p-3.5 rounded-2xl border border-blue-200 text-xs text-slate-700 flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
                <span>
                  <strong>Quy chuẩn tối cao:</strong> Mỗi sự kiện được cấp tối đa <strong>2 mã QR duy nhất</strong>. Khi quét mã Đăng ký, biểu mẫu sẽ tự động hiển thị theo chế độ Có phí hoặc Miễn phí bạn đã cấu hình bên cạnh.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* ── MÃ QR 1: ĐĂNG KÝ THAM GIA SỰ KIỆN ── */}
                <div className="rounded-3xl border-2 border-[#003B95]/30 bg-white p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#003B95] text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                    MÃ QR SỐ 1
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-[#003B95] text-[10px] font-bold uppercase mb-1">
                        Standee Đón Tiếp / Banner Online
                      </span>
                      <h4 className="text-base font-black text-slate-900 leading-snug">
                        Mã QR Đăng Ký Tham Gia
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Khách mời hoặc Học viên dùng Camera / Zalo quét mã này để mở biểu mẫu đăng ký.
                      </p>
                    </div>

                    <div className="flex justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-inner">
                      <QrCanvas value={registerUrl} size={168} />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Chế độ biểu mẫu:</span>
                        <span className={`font-bold px-2 py-0.5 rounded ${isPaidEvent ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                          {isPaidEvent ? `Có Phí (${ticketFee.toLocaleString("vi-VN")} đ)` : "Miễn Phí (0đ)"}
                        </span>
                      </div>
                      <code className="block truncate rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] text-[#003B95]">
                        {registerUrl}
                      </code>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex gap-2">
                      <a
                        href={registerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 min-h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold shadow-xs transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Xem Thử Form</span>
                      </a>
                      <button
                        type="button"
                        onClick={copyRegister}
                        className="min-h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                      >
                        {copiedRegLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedRegLink ? "Đã Chép" : "Chép Link"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── MÃ QR 2: CHECK-IN / SOÁT VÉ VÀO CỬA ── */}
                <div className="rounded-3xl border-2 border-[#DC2626]/30 bg-white p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#DC2626] text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                    MÃ QR SỐ 2
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-rose-100 text-[#DC2626] text-[10px] font-bold uppercase mb-1">
                        Bàn Lễ Tân / Quầy Soát Vé
                      </span>
                      <h4 className="text-base font-black text-slate-900 leading-snug">
                        Mã QR Check-in Vào Cửa
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Quét mã này để mở ngay Cổng Soát Vé / Điểm Danh đại biểu vào hội trường.
                      </p>
                    </div>

                    <div className="flex justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-inner">
                      <QrCanvas value={checkinUrl} size={168} />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Chức năng cổng:</span>
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          Soát Vé &amp; Điểm Danh
                        </span>
                      </div>
                      <code className="block truncate rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] text-[#DC2626]">
                        {checkinUrl}
                      </code>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex gap-2">
                      <a
                        href={checkinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 min-h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-bold shadow-xs transition"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Mở Cổng Check-in</span>
                      </a>
                      <button
                        type="button"
                        onClick={copyCheckin}
                        className="min-h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                      >
                        {copiedCheckinLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCheckinLink ? "Đã Chép" : "Chép Link"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
            <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Chưa có sự kiện nào trong hệ thống</p>
            <p className="text-xs text-slate-500 mt-1">Vui lòng tạo sự kiện mới tại mục Quản lý sự kiện.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
