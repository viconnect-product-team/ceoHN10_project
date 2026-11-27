import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { getPublicAppOrigin } from "@/lib/qr";
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
  Plus,
  Trash2,
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
  const [copiedVipLink, setCopiedVipLink] = useState(false);
  const [copiedStdLink, setCopiedStdLink] = useState(false);
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

  // Cấu hình danh sách hạng vé (Loại vé)
  type TicketConfig = {
    id?: string;
    name: string;
    price: number;
    quantity: number;
    description: string;
  };
  const [configuredTickets, setConfiguredTickets] = useState<TicketConfig[]>([]);

  // Tải danh sách hạng vé của sự kiện đang chọn
  useEffect(() => {
    if (!activeEvent) return;
    let cancelled = false;
    fetchNestApi<any[]>(`/events/${activeEvent.id}/tickets`)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : [];
        if (list.length > 0) {
          setConfiguredTickets(
            list.map((t: any) => ({
              id: t.id,
              name: t.name || "",
              price: Number(t.price || 0),
              quantity: Number(t.quantity || 0),
              description: t.description || "",
            }))
          );
        } else {
          const defaultPrice = Number(activeEvent.ticketPrice || 0);
          if (defaultPrice > 0) {
            setConfiguredTickets([
              { name: "Vé VIP", price: defaultPrice * 2 || 500000, quantity: 50, description: "Bàn tiệc VIP, tài liệu cao cấp" },
              { name: "Vé Tiêu Chuẩn", price: defaultPrice, quantity: 100, description: "Tham dự toàn bộ chương trình" },
            ]);
          } else {
            setConfiguredTickets([
              { name: "Vé Tiêu Chuẩn", price: 0, quantity: 0, description: "Miễn phí tham dự sự kiện" },
            ]);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeEvent?.id]);

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

  // Xử lý lưu cấu hình (Bao gồm đồng bộ Loại vé về Chi tiết sự kiện)
  const handleSaveSetup = async () => {
    if (!activeEvent) return;
    setSavingConfig(true);
    try {
      const maxPrice = isPaidEvent && configuredTickets.length > 0
        ? Math.max(0, ...configuredTickets.map((t) => Number(t.price) || 0))
        : 0;

      // 1. Lưu danh sách Loại vé vào /events/:id/tickets (phản ánh trực tiếp ở Chi tiết sự kiện)
      await fetchNestApi(`/events/${activeEvent.id}/tickets`, {
        method: "PUT",
        body: JSON.stringify({
          tickets: configuredTickets.map((t) => ({
            ...t,
            price: isPaidEvent ? Number(t.price) || 0 : 0,
          })),
        }),
      }).catch(() => {});

      // 2. Cập nhật thông số sự kiện & trường biểu mẫu
      await fetchNestApi(`/events/${activeEvent.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ticketPrice: maxPrice,
          fee: maxPrice,
          isPaid: isPaidEvent,
          paymentNote: paymentNote,
          bankAccount: bankAccount,
          formFieldsConfig: formFields,
        }),
      }).catch(async () => {
        await fetchNestApi(`/events/${activeEvent.id}/ticket-price`, {
          method: "PATCH",
          body: JSON.stringify({ ticketPrice: maxPrice }),
        }).catch(() => {});
      });

      toast.success(
        `Đã lưu cấu hình thành công! Sự kiện "${activeEvent.name}" đã cập nhật ${configuredTickets.length} loại vé và đồng bộ vào Loại vé chi tiết sự kiện.`
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

  const publicAppOrigin = getPublicAppOrigin();

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
              {/* Box 1: Cấu hình Phí vé & Các Hạng Vé */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#003B95]" />
                    <h3 className="text-sm font-bold text-slate-900">1. Cấu Hình Hạng Vé &amp; Tài Khoản Thu</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {configuredTickets.length} loại vé
                  </span>
                </div>

                {/* Chọn Có Phí hoặc Miễn Phí */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaidEvent(false);
                      setTicketFee(0);
                      setConfiguredTickets((prev) =>
                        prev.map((t) => ({ ...t, price: 0 }))
                      );
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
                      setConfiguredTickets((prev) => {
                        if (prev.length === 0 || prev.every((t) => t.price === 0)) {
                          return [
                            { name: "Vé VIP", price: 500000, quantity: 50, description: "Bàn tiệc VIP, tài liệu cao cấp" },
                            { name: "Vé Tiêu Chuẩn", price: 200000, quantity: 100, description: "Tham dự toàn bộ chương trình" },
                          ];
                        }
                        return prev;
                      });
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

                {/* Danh sách các loại vé (Lưu vào phần Loại vé ở chi tiết sự kiện) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5 text-[#003B95]" />
                      <span>Danh Sách Hạng Vé Sự Kiện:</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setConfiguredTickets([
                          ...configuredTickets,
                          {
                            name: isPaidEvent ? "Vé VIP" : "Vé Mời",
                            price: isPaidEvent ? 500000 : 0,
                            quantity: 50,
                            description: "",
                          },
                        ])
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#003B95] hover:underline cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Thêm Hạng Vé</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {configuredTickets.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={t.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfiguredTickets((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                              );
                            }}
                            placeholder="Tên hạng vé (VD: Vé VIP, Vé Tiêu Chuẩn)..."
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 outline-none focus:ring-1 focus:ring-[#003B95]"
                          />
                          {configuredTickets.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfiguredTickets((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Xóa hạng vé này"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                              Giá vé (VNĐ):
                            </span>
                            <input
                              type="number"
                              disabled={!isPaidEvent}
                              value={isPaidEvent ? t.price : 0}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                setConfiguredTickets((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
                                );
                              }}
                              className={`w-full px-2 py-1 rounded-lg border font-mono font-bold ${
                                !isPaidEvent
                                  ? "bg-slate-100 text-slate-400 border-slate-200"
                                  : "bg-white text-slate-900 border-slate-300"
                              }`}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                              Số lượng vé (suất):
                            </span>
                            <input
                              type="number"
                              value={t.quantity || 0}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                setConfiguredTickets((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, quantity: val } : item))
                                );
                              }}
                              placeholder="0: Không giới hạn"
                              className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
                            />
                          </div>
                        </div>

                        <input
                          type="text"
                          value={t.description || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfiguredTickets((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, description: val } : item))
                            );
                          }}
                          placeholder="Mô tả quyền lợi vé..."
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-600 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nếu có phí -> Nhập thông tin chuyển khoản */}
                {isPaidEvent && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in">
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
                  <h3 className="text-sm font-bold text-slate-900">2. Tùy Chỉnh Trường Biểu Mẫu Đăng Ký &amp; Check-In</h3>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <span className="font-semibold text-slate-800">Họ và tên đại biểu (Bắt buộc)</span>
                    <input type="checkbox" checked={formFields.fullName} disabled className="rounded text-[#003B95]" />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <span className="font-semibold text-slate-800">Số điện thoại (Nhận vé Zalo/SMS - Bắt buộc)</span>
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
                      <span>Lưu Cấu Hình Loại Vé &amp; Biểu Mẫu Sự Kiện</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CỘT PHẢI: HIỂN THỊ MÃ QR THEO TỪNG LOẠI VÉ (VD: Vé VIP & Vé Tiêu Chuẩn) */}
            <div className="lg:col-span-7 space-y-6">
              {(() => {
                const vipTicket = configuredTickets.find((t) => t.name.toUpperCase().includes("VIP"));
                const stdTicket =
                  configuredTickets.find((t) => !t.name.toUpperCase().includes("VIP")) || configuredTickets[0];
                const has2Tiers = configuredTickets.length >= 2;

                const vipUrl =
                  activeEvent && vipTicket
                    ? `${publicAppOrigin}/guest-event-register/${activeEvent.id}?ticketType=${encodeURIComponent(vipTicket.name)}`
                    : registerUrl;
                const stdUrl =
                  activeEvent && stdTicket
                    ? `${publicAppOrigin}/guest-event-register/${activeEvent.id}?ticketType=${encodeURIComponent(stdTicket.name)}`
                    : registerUrl;

                return (
                  <>
                    <div className="bg-gradient-to-r from-blue-50 to-amber-50 p-3.5 rounded-2xl border border-blue-200 text-xs text-slate-700 flex items-center gap-2.5">
                      <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
                      <span>
                        {has2Tiers ? (
                          <>
                            Sự kiện có <strong>2 loại vé riêng biệt ({vipTicket?.name || "VIP"} &amp; {stdTicket?.name || "Tiêu Chuẩn"})</strong>. Hệ thống tự động phân tách 2 mã QR độc lập để khách mời quét đúng biểu mẫu của từng loại vé.
                          </>
                        ) : (
                          <>
                            Hệ thống hiển thị chuẩn xác <strong>Mã QR Đăng ký</strong> và <strong>Mã QR Check-in</strong> cho sự kiện.
                          </>
                        )}
                      </span>
                    </div>

                    <div className={`grid grid-cols-1 ${has2Tiers ? "md:grid-cols-2" : "md:grid-cols-2"} gap-5`}>
                      {/* NẾU CÓ 2 LOẠI VÉ: SHOW 1 QR CHO VÉ VIP, 1 QR CHO VÉ THƯỜNG */}
                      {has2Tiers ? (
                        <>
                          {/* ── MÃ QR ĐĂNG KÝ VÉ VIP ── */}
                          <div className="rounded-3xl border-2 border-amber-500/40 bg-white p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-amber-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                              QR VÉ VIP
                            </div>

                            <div className="space-y-3">
                              <div>
                                <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase mb-1">
                                  {vipTicket?.name || "Vé VIP Doanh Nhân"}
                                </span>
                                <h4 className="text-base font-black text-slate-900 leading-snug">
                                  Mã QR Đăng Ký Vé VIP
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Quét mã này sẽ mở trực tiếp form đăng ký dành riêng cho hạng vé VIP.
                                </p>
                              </div>

                              <div className="flex justify-center p-3 bg-white rounded-2xl border border-amber-200 shadow-inner">
                                <QrCanvas value={vipUrl} size={150} />
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Mức phí vé:</span>
                                  <span className="font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                                    {vipTicket?.price ? `${vipTicket.price.toLocaleString("vi-VN")} đ` : "Miễn phí"}
                                  </span>
                                </div>
                                <code className="block truncate rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10.5px] text-amber-700">
                                  {vipUrl}
                                </code>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                              <a
                                href={vipUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 min-h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Mở Form VIP</span>
                              </a>
                              <button
                                type="button"
                                onClick={async () => {
                                  await navigator.clipboard.writeText(vipUrl);
                                  setCopiedVipLink(true);
                                  setTimeout(() => setCopiedVipLink(false), 2000);
                                  toast.success("Đã sao chép link QR Đăng Ký Vé VIP!");
                                }}
                                className="min-h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                              >
                                {copiedVipLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{copiedVipLink ? "Đã Chép" : "Chép"}</span>
                              </button>
                            </div>
                          </div>

                          {/* ── MÃ QR ĐĂNG KÝ VÉ THƯỜNG / TIÊU CHUẨN ── */}
                          <div className="rounded-3xl border-2 border-[#003B95]/30 bg-white p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-[#003B95] text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                              QR VÉ TIÊU CHUẨN
                            </div>

                            <div className="space-y-3">
                              <div>
                                <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-[#003B95] text-[10px] font-bold uppercase mb-1">
                                  {stdTicket?.name || "Vé Tiêu Chuẩn"}
                                </span>
                                <h4 className="text-base font-black text-slate-900 leading-snug">
                                  Mã QR Đăng Ký Vé Thường
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Quét mã này sẽ mở trực tiếp form đăng ký dành riêng cho hạng vé tiêu chuẩn.
                                </p>
                              </div>

                              <div className="flex justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-inner">
                                <QrCanvas value={stdUrl} size={150} />
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Mức phí vé:</span>
                                  <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-[#003B95]">
                                    {stdTicket?.price ? `${stdTicket.price.toLocaleString("vi-VN")} đ` : "Miễn phí"}
                                  </span>
                                </div>
                                <code className="block truncate rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10.5px] text-[#003B95]">
                                  {stdUrl}
                                </code>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                              <a
                                href={stdUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 min-h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold shadow-xs transition"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Mở Form Thường</span>
                              </a>
                              <button
                                type="button"
                                onClick={async () => {
                                  await navigator.clipboard.writeText(stdUrl);
                                  setCopiedStdLink(true);
                                  setTimeout(() => setCopiedStdLink(false), 2000);
                                  toast.success("Đã sao chép link QR Đăng Ký Vé Thường!");
                                }}
                                className="min-h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                              >
                                {copiedStdLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{copiedStdLink ? "Đã Chép" : "Chép"}</span>
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* ── MÃ QR ĐĂNG KÝ DUY NHẤT KHI CHỈ CÓ 1 HẠNG VÉ ── */
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
                              <QrCanvas value={registerUrl} size={150} />
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
                      )}

                      {/* ── MÃ QR SOÁT VÉ CHECK-IN VÀO CỬA (BẮT BUỘC CÓ CHO MỌI SỰ KIỆN) ── */}
                      <div className="rounded-3xl border-2 border-[#DC2626]/30 bg-white p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-[#DC2626] text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                          MÃ QR CHECK-IN
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
                            <QrCanvas value={checkinUrl} size={150} />
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
                  </>
                );
              })()}
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
