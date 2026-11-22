import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  LogIn,
  Search,
  User,
  Phone,
  Building2,
  Calendar,
  CreditCard,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Upload,
  Users,
  Camera,
  UserPlus,
  X,
} from "lucide-react";
import { fetchNestApi } from "@/lib/api-client";
import { toast } from "sonner";
import { decodeQrFromImage } from "@/lib/qr-image-decoder";
import { EventLivePhotoGalleryModal } from "@/components/events/EventLivePhotoGalleryModal";

export const Route = createFileRoute("/event-checkin")({
  ssr: false,
  component: PublicEventCheckinGatePage,
});

function PublicEventCheckinGatePage() {
  const [ticketInput, setTicketInput] = useState("");
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDecodingImage, setIsDecodingImage] = useState(false);

  // Live Photos Modal State
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  // Selected Parts during ticket scan
  const [selectedCheckinParts, setSelectedCheckinParts] = useState<string[]>([
    "Tọa đàm / Hội nghị Chuyên Đề",
    "Tiệc Gala Dinner & Kết Nối",
  ]);

  // Walk-in Registration Modal State
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [walkinForm, setWalkinForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    company: "",
    position: "",
    selectedParts: ["Tọa đàm / Hội nghị Chuyên Đề", "Tiệc Gala Dinner & Kết Nối"],
  });
  const [additionalWalkins, setAdditionalWalkins] = useState<Array<{
    id: string;
    fullName: string;
    phone: string;
    email: string;
    company: string;
    position: string;
  }>>([]);
  const [submittingWalkin, setSubmittingWalkin] = useState(false);

  const handleQrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsDecodingImage(true);
    try {
      const decoded = await decodeQrFromImage(file);
      if (decoded) {
        toast.success("Đã quét và giải mã mã QR từ ảnh thành công!");
        let code = decoded.trim();
        try {
          if (code.includes("http://") || code.includes("https://")) {
            const url = new URL(code);
            code =
              url.searchParams.get("ticket") ||
              url.searchParams.get("ticketCode") ||
              url.searchParams.get("code") ||
              url.searchParams.get("regId") ||
              code;
          }
        } catch { }
        setTicketInput(code);
        void lookupTicket(code);
      } else {
        toast.error("Không tìm thấy mã QR hợp lệ trong bức ảnh này. Vui lòng thử lại với ảnh rõ nét hơn.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi quét ảnh mã QR");
    } finally {
      setIsDecodingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Dynamic Fee Configuration states
  const [showFeeConfig, setShowFeeConfig] = useState(false);
  const [feeItems, setFeeItems] = useState<any[]>([]);
  const [newFeeCode, setNewFeeCode] = useState("");
  const [newFeeName, setNewFeeName] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState<number | string>(500000);
  const [newFeeDesc, setNewFeeDesc] = useState("");
  const [isCreatingFee, setIsCreatingFee] = useState(false);

  // Selected Fee SePay QR
  const [selectedFeeQr, setSelectedFeeQr] = useState<any>(null);
  const [copiedQrInfo, setCopiedQrInfo] = useState(false);

  // Parse URL search params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = new URLSearchParams(window.location.search);
    const paramTicket =
      search.get("ticket") ||
      search.get("ticketCode") ||
      search.get("code") ||
      search.get("regId");
    if (paramTicket) {
      setTicketInput(paramTicket);
      void lookupTicket(paramTicket);
    }
  }, []);

  const lookupTicket = async (codeToSearch: string) => {
    if (!codeToSearch || !codeToSearch.trim()) {
      toast.info("Vui lòng nhập mã vé hoặc mã học viên để tra cứu");
      return;
    }
    setLoading(true);
    setSelectedFeeQr(null);
    try {
      const res = await fetchNestApi<any>(
        `/events/ticket-status/${encodeURIComponent(codeToSearch.trim())}`
      );
      if (res && res.found && res.ticket) {
        setCurrentTicket(res.ticket);
        toast.success(`Tìm thấy thông tin vé: ${res.ticket.memberName}`);
        // Tải danh sách mã phí động của sự kiện
        if (res.ticket.eventId) {
          loadEventFees(res.ticket.eventId);
        }
      } else {
        setCurrentTicket(null);
        toast.error(res?.message || "Không tìm thấy vé với mã này trên hệ thống.");
      }
    } catch (err: any) {
      setCurrentTicket(null);
      toast.error(err?.message || "Lỗi khi tra cứu mã vé");
    } finally {
      setLoading(false);
    }
  };

  const loadEventFees = async (eventId: string) => {
    try {
      const fees = await fetchNestApi<any[]>(`/events/${eventId}/fee-items`);
      if (Array.isArray(fees)) {
        setFeeItems(fees);
      }
    } catch {
      setFeeItems([]);
    }
  };

  const handleCheckin = async () => {
    if (!currentTicket?.id) return;
    setActionLoading(true);
    try {
      const res = await fetchNestApi<any>("/events/ticket-checkin", {
        method: "POST",
        body: JSON.stringify({
          ticketCode: currentTicket.id,
          method: "web_zalo",
          attendedParts: selectedCheckinParts,
        }),
      });
      if (res && res.ok) {
        toast.success(res.message || "Check-in thành công!");
        setCurrentTicket({
          ...currentTicket,
          isCheckedIn: true,
          checkedInAt: res.checkedInAt || new Date().toLocaleString("vi-VN"),
          attendedParts: res.ticket?.attendedParts || selectedCheckinParts,
        });
      } else if (res && res.alreadyCheckedIn) {
        toast.error(res.message);
        setCurrentTicket({
          ...currentTicket,
          isCheckedIn: true,
          checkedInAt: res.checkedInAt || currentTicket.checkedInAt,
        });
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi thực hiện check-in");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinForm.fullName.trim() || !walkinForm.phone.trim() || !walkinForm.email.trim()) {
      toast.error("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Email!");
      return;
    }
    const targetEventId = currentTicket?.eventId || "latest";
    setSubmittingWalkin(true);
    try {
      const allWalkins = [
        {
          fullName: walkinForm.fullName.trim(),
          phone: walkinForm.phone.trim(),
          email: walkinForm.email.trim().toLowerCase(),
          company: walkinForm.company.trim(),
          position: walkinForm.position.trim(),
        },
        ...additionalWalkins.map((a) => ({
          fullName: a.fullName.trim(),
          phone: a.phone.trim(),
          email: a.email.trim().toLowerCase(),
          company: a.company.trim() || walkinForm.company.trim(),
          position: a.position.trim(),
        })),
      ];

      const res = await fetchNestApi<any>(`/events/${targetEventId}/guest-register`, {
        method: "POST",
        body: JSON.stringify({
          fullName: walkinForm.fullName.trim(),
          phone: walkinForm.phone.trim(),
          email: walkinForm.email.trim().toLowerCase(),
          company: walkinForm.company.trim(),
          position: walkinForm.position.trim(),
          ticketType: "Vé Khách Mới Tại Cửa",
          ticketCount: allWalkins.length,
          ticketPrice: 0,
          isWalkIn: true,
          attendees: allWalkins,
          attendedParts: walkinForm.selectedParts,
        }),
      });

      if (res && res.ok) {
        toast.success(`Đã đăng ký và cấp vé check-in thành công cho ${allWalkins.length} đại biểu mới!`);
        setWalkinModalOpen(false);
        setWalkinForm({
          fullName: "",
          phone: "",
          email: "",
          company: "",
          position: "",
          selectedParts: ["Tọa đàm / Hội nghị Chuyên Đề", "Tiệc Gala Dinner & Kết Nối"],
        });
        setAdditionalWalkins([]);
        if (res.registrationId) {
          lookupTicket(res.registrationId);
        }
      } else {
        toast.error(res?.message || "Không thể đăng ký lúc này");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi đăng ký khách mới");
    } finally {
      setSubmittingWalkin(false);
    }
  };

  const handleCheckout = async () => {
    if (!currentTicket?.id) return;
    setActionLoading(true);
    try {
      const res = await fetchNestApi<any>("/events/ticket-checkout", {
        method: "POST",
        body: JSON.stringify({ ticketCode: currentTicket.id }),
      });
      if (res && res.ok) {
        toast.success(res.message || "Check-out thành công!");
        setCurrentTicket({
          ...currentTicket,
          isCheckedOut: true,
          checkedOutAt: res.checkedOutAt || new Date().toLocaleString("vi-VN"),
        });
      } else {
        toast.error(res?.message || "Không thể check-out");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi thực hiện check-out");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFeeItem = async () => {
    if (!currentTicket?.eventId) {
      toast.error("Vui lòng tra cứu một mã vé sự kiện trước khi cấu hình mã phí");
      return;
    }
    if (!newFeeCode.trim() || !newFeeName.trim()) {
      toast.error("Vui lòng nhập đầy đủ Mã phí và Tên phí");
      return;
    }
    setIsCreatingFee(true);
    try {
      await fetchNestApi(`/events/${currentTicket.eventId}/fee-items`, {
        method: "POST",
        body: JSON.stringify({
          feeCode: newFeeCode.trim().toUpperCase(),
          feeName: newFeeName.trim(),
          amount: Number(newFeeAmount) || 0,
          description: newFeeDesc.trim(),
        }),
      });
      toast.success("Đã thêm mã phí mới thành công!");
      setNewFeeCode("");
      setNewFeeName("");
      setNewFeeDesc("");
      loadEventFees(currentTicket.eventId);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tạo mã phí");
    } finally {
      setIsCreatingFee(false);
    }
  };

  const handleDeleteFeeItem = async (feeId: string) => {
    if (!currentTicket?.eventId) return;
    try {
      await fetchNestApi(`/events/${currentTicket.eventId}/fee-items/${feeId}`, {
        method: "DELETE",
      });
      toast.success("Đã xóa mã phí");
      loadEventFees(currentTicket.eventId);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi xóa mã phí");
    }
  };

  const handleGenerateSepayQr = async (feeId: string) => {
    if (!currentTicket?.eventId || !currentTicket?.id) return;
    try {
      const res = await fetchNestApi<any>(
        `/events/${currentTicket.eventId}/fee-items/${feeId}/sepay-qr`,
        {
          method: "POST",
          body: JSON.stringify({ ticketCode: currentTicket.id }),
        }
      );
      if (res && res.ok) {
        setSelectedFeeQr(res);
        toast.success(`Đã sinh mã VietQR cho khoản phí: ${res.feeName}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi sinh mã QR SePay");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-20 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                CỔNG CHECK-IN & CHECK-OUT SỰ KIỆN CEO HN10
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Zalo · Web · App
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Xác thực 1 lần chống gian lận &amp; Tích hợp mã phí SePay Dynamic
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPhotoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
              title="Chụp ảnh trực tiếp hoặc xem album ảnh sự kiện"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Chụp &amp; Album Ảnh</span>
            </button>
            <button
              type="button"
              onClick={() => setWalkinModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
              title="Mở form đăng ký check-in nhanh cho khách mới chưa có vé"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Khách Mới Tại Cửa</span>
            </button>
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800"
            >
              Về CRM
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Search / Scan Box & Upload QR Image */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-blue-400" />
              <span>Quét mã QR hoặc Nhập Mã Vé / Tải ảnh QR vé:</span>
            </label>
            <span className="text-[11px] text-slate-400">
              Đối soát tự động với danh sách sự kiện
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleQrImageUpload}
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="VD: 4001, HN10-0001, EV-1234..."
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") lookupTicket(ticketInput);
              }}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDecodingImage || loading}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              title="Tải ảnh mã QR vé từ thư viện ảnh hoặc ảnh chụp màn hình"
            >
              {isDecodingImage ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <Upload className="w-4 h-4 text-amber-400" />
              )}
              <span>Tải ảnh QR</span>
            </button>
            <button
              type="button"
              onClick={() => lookupTicket(ticketInput)}
              disabled={loading || isDecodingImage}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Tra cứu</span>
            </button>
          </div>
        </div>

        {/* Ticket Details View */}
        {currentTicket && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Event Header Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {currentTicket.eventDate} · {currentTicket.eventTime}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white mt-2">
                  {currentTicket.eventTitle}
                </h2>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  {currentTicket.eventLocation}
                </p>
              </div>

              {/* Lucky Draw Box */}
              {currentTicket.luckyNumber && (
                <div className="bg-slate-950/80 border border-amber-400/40 rounded-2xl p-3 text-center min-w-[110px] shadow-inner">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Số Quay Thưởng
                  </div>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    #{currentTicket.luckyNumber}
                  </div>
                </div>
              )}
            </div>

            {/* ── BẢNG ĐỐI SOÁT & PHÂN BIỆT ĐẠI BIỂU (SO SÁNH VỚI DATABASE) ── */}
            <div className="px-6">
              {currentTicket.isWalkIn || currentTicket.attendeeType === "WALK_IN_NEW" ? (
                <div className="rounded-2xl border-2 border-blue-500/60 bg-blue-950/40 p-4 sm:p-5 text-left flex items-start gap-3.5 shadow-lg shadow-blue-950/50">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-black">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs uppercase tracking-wider">
                        KHÁCH MỚI ĐĂNG KÝ TẠI SỰ KIỆN (WALK-IN)
                      </span>
                      <span className="text-xs text-blue-300 font-medium">
                        (Mã 1: Khách quét mã đăng ký tại cửa)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Hệ thống đã đối soát danh sách: Khách mời này <strong>chưa đăng ký trước</strong>, đã mở biểu mẫu đăng ký tại cửa sự kiện.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-emerald-500/60 bg-emerald-950/40 p-4 sm:p-5 text-left flex items-start gap-3.5 shadow-lg shadow-emerald-950/50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-black">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs uppercase tracking-wider">
                        ĐẠI BIỂU ĐÃ ĐĂNG KÝ TỪ TRƯỚC (PRE-REGISTERED)
                      </span>
                      <span className="text-xs text-emerald-300 font-medium">
                        (Mã 2: Có trong danh sách đăng ký chính thức)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Hệ thống đã đối soát danh sách: Đại biểu này <strong>đã đăng ký tham gia từ trước</strong> và có mã vé chính thức hợp lệ.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* STRICT 1-TIME CHECK-IN ENFORCEMENT ALERT */}
            <div className="px-6">
              {currentTicket.isCheckedIn ? (
                <div className="rounded-2xl border-2 border-rose-500/50 bg-rose-950/40 p-4 sm:p-5 text-left space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 text-rose-400 font-black text-sm sm:text-base">
                    <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                    <span>VÉ NÀY ĐÃ ĐƯỢC CHECK-IN LÚC {currentTicket.checkedInAt}!</span>
                  </div>
                  <p className="text-xs text-rose-200/90 leading-relaxed pl-8">
                    ⛔ Cảnh báo bảo mật: Mã vé này đã được sử dụng để vào cửa trước đó. Theo quy chế sự kiện, mỗi vé chỉ được phép check-in duy nhất 1 lần để chống gian lận thẻ vé.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-left flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-300 text-sm">
                      Vé Hợp Lệ — Sẵn Sàng Check-in Vào Cửa
                    </div>
                    <div className="text-xs text-emerald-200/80">
                      Chưa ghi nhận lượt check-in nào. Ban Tổ Chức có thể bấm nút bên dưới để xác nhận đón tiếp đại biểu.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Attendee Info Grid */}
            <div className="px-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  Thông Tin Đại Biểu
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  {currentTicket.memberName}
                </div>
                <div className="text-slate-300 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {currentTicket.phone || "—"}
                </div>
                <div className="text-slate-300 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {currentTicket.company} ({currentTicket.position})
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  Chi Tiết Mã Vé
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mã Vé:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {currentTicket.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mã Học Viên / Khách:</span>
                  <span className="font-mono font-bold text-blue-400">
                    {currentTicket.memberCode || "GUEST"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Loại Vé:</span>
                  <span className="font-semibold text-slate-200">
                    {currentTicket.ticketType} ({currentTicket.ticketCount || 1} người)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Vị Trí Chỗ Ngồi:</span>
                  <span className="font-semibold text-slate-200">
                    {currentTicket.seatAssignment || "Bàn VIP / Khu vực đại biểu"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Trạng Thái Phí Vé:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      currentTicket.paymentStatus === "paid"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {currentTicket.paymentStatus === "paid"
                      ? "Đã thanh toán"
                      : "Chưa thanh toán"}
                  </span>
                </div>
              </div>
            </div>

            {/* CHỌN PHẦN THAM GIA SỰ KIỆN KHI SOÁT VÉ */}
            {!currentTicket.isCheckedIn && (
              <div className="px-6 py-2 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Xác nhận phần tham gia của đại biểu:</span>
                  <span className="text-[11px] text-slate-400">Có thể tích 1 hoặc tất cả</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {["Tọa đàm / Hội nghị Chuyên Đề", "Tiệc Gala Dinner & Kết Nối"].map((part) => {
                    const isSelected = selectedCheckinParts.includes(part);
                    return (
                      <div
                        key={part}
                        onClick={() => {
                          setSelectedCheckinParts((prev) =>
                            prev.includes(part)
                              ? (prev.length > 1 ? prev.filter((p) => p !== part) : prev)
                              : [...prev, part]
                          );
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-950/40 text-blue-300"
                            : "border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span className="truncate">{part}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Checkin / Checkout Action Buttons */}
            <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row gap-3">
              {/* Check-In Button */}
              <button
                type="button"
                onClick={handleCheckin}
                disabled={currentTicket.isCheckedIn || actionLoading}
                className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                  currentTicket.isCheckedIn
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-98"
                }`}
              >
                <LogIn className="w-5 h-5" />
                {currentTicket.isCheckedIn ? "Đã Check-in Vào Cửa" : "XÁC NHẬN CHECK-IN VÀO CỬA"}
              </button>

              {/* Check-Out Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={!currentTicket.isCheckedIn || currentTicket.isCheckedOut || actionLoading}
                className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                  !currentTicket.isCheckedIn
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    : currentTicket.isCheckedOut
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-98"
                }`}
              >
                <LogOut className="w-5 h-5" />
                {currentTicket.isCheckedOut
                  ? `Đã Check-out (${currentTicket.checkedOutAt})`
                  : "XÁC NHẬN CHECK-OUT (RA VỀ)"}
              </button>
            </div>

            {/* DYNAMIC FEE ITEMS CONFIGURATION (TÍCH HỢP SEPAY DYNAMIC) */}
            <div className="border-t border-slate-800 p-6 bg-slate-950/40 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Cấu Hình Mã Phí Sự Kiện &amp; Thu Phí Dự Tiệc (SePay Dynamic)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tự động sinh mã VietQR theo cấu hình SePay: CEOHN10_SK_[MÃ_VÉ]_[MÃ_PHÍ]
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFeeConfig(!showFeeConfig)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 font-semibold text-slate-200 transition"
                >
                  {showFeeConfig ? "Đóng Cấu Hình" : "+ Cấu hình Mã Phí Mới"}
                </button>
              </div>

              {/* Form Thêm Mã Phí Động */}
              {showFeeConfig && (
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-3 animate-in fade-in duration-150">
                  <div className="font-bold text-xs text-slate-200">Thêm Mã Phí Mới Cho Sự Kiện:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Mã Phí * (VD: FEE_TIEC_TOI)</label>
                      <input
                        type="text"
                        placeholder="VD: FEE_PARTY_GALA"
                        value={newFeeCode}
                        onChange={(e) => setNewFeeCode(e.target.value.toUpperCase())}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Tên Khoản Phí *</label>
                      <input
                        type="text"
                        placeholder="VD: Phí Dự Tiệc Gala Dinner"
                        value={newFeeName}
                        onChange={(e) => setNewFeeName(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Số Tiền (VNĐ) *</label>
                      <input
                        type="number"
                        placeholder="VD: 500000"
                        value={newFeeAmount}
                        onChange={(e) => setNewFeeAmount(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCreateFeeItem}
                      disabled={isCreatingFee}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Lưu Mã Phí Động
                    </button>
                  </div>
                </div>
              )}

              {/* Danh sách các mã phí đã cấu hình */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300">
                  Danh Sách Khoản Phí Khả Dụng ({feeItems.length}):
                </div>
                {feeItems.length === 0 ? (
                  <div className="text-xs text-slate-500 p-3 rounded-xl border border-dashed border-slate-800 text-center">
                    Chưa có mã phí nào. Bấm "+ Cấu hình Mã Phí Mới" để thêm các khoản như: Phí tiệc, phí tài liệu, phí gala...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {feeItems.map((fee) => (
                      <div
                        key={fee.id}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{fee.fee_name}</div>
                          <div className="font-mono text-[11px] text-amber-400">
                            {fee.fee_code} · {new Intl.NumberFormat("vi-VN").format(fee.amount)} VNĐ
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleGenerateSepayQr(fee.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" />
                            Mã SePay QR
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFeeItem(fee.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                            title="Xóa mã phí"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SePay QR Code Viewer Popup / Card */}
              {selectedFeeQr && (
                <div className="mt-4 p-5 rounded-2xl border-2 border-amber-500/50 bg-slate-900 shadow-xl space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Mã Thanh Toán SePay VietQR: {selectedFeeQr.feeName}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFeeQr(null)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="bg-white p-2.5 rounded-2xl border shadow shrink-0">
                      <img
                        src={selectedFeeQr.vietQrUrl}
                        alt="SePay VietQR"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                    <div className="space-y-2 text-xs text-slate-300 flex-1">
                      <div>
                        <span className="text-slate-400">Ngân hàng: </span>
                        <strong className="text-white">{selectedFeeQr.bankName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Số tài khoản: </span>
                        <strong className="text-amber-400 font-mono text-sm">
                          {selectedFeeQr.bankAccount}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Chủ tài khoản: </span>
                        <strong className="text-white">{selectedFeeQr.bankOwner}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Số tiền: </span>
                        <strong className="text-emerald-400 font-mono text-sm">
                          {new Intl.NumberFormat("vi-VN").format(selectedFeeQr.amount)} VNĐ
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Nội dung chuyển khoản (Tự động kích hoạt): </span>
                        <code className="block mt-1 font-mono text-xs font-bold text-amber-300 bg-slate-950 p-2 rounded-lg border border-slate-800">
                          {selectedFeeQr.transferDescription}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(selectedFeeQr.transferDescription);
                          setCopiedQrInfo(true);
                          toast.success("Đã sao chép nội dung chuyển khoản!");
                          setTimeout(() => setCopiedQrInfo(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 transition"
                      >
                        {copiedQrInfo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedQrInfo ? "Đã sao chép" : "Sao chép cú pháp"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL CHỤP & XEM ẢNH TRỰC TIẾP TRONG SỰ KIỆN */}
        {photoModalOpen && (
          <EventLivePhotoGalleryModal
            open={photoModalOpen}
            eventId={currentTicket?.eventId || "latest"}
            eventName={currentTicket?.eventTitle || "Sự kiện CLB CEO HN10"}
            onClose={() => setPhotoModalOpen(false)}
          />
        )}

        {/* MODAL ĐĂNG KÝ CHECK-IN KHÁCH MỚI TẠI CỬA (WALK-IN) */}
        {walkinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-blue-500/40 bg-slate-900 shadow-2xl p-6 space-y-5 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Đăng Ký Check-in Khách Mới Tại Cửa
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tự động cấp mã vé và đánh dấu là khách mới (Walk-in)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWalkinModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleWalkinSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Họ và tên khách mời *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={walkinForm.fullName}
                    onChange={(e) => setWalkinForm({ ...walkinForm, fullName: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0983..."
                      value={walkinForm.phone}
                      onChange={(e) => setWalkinForm({ ...walkinForm, phone: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="email@congty.com"
                      value={walkinForm.email}
                      onChange={(e) => setWalkinForm({ ...walkinForm, email: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Doanh nghiệp / Công ty
                    </label>
                    <input
                      type="text"
                      placeholder="Tập đoàn..."
                      value={walkinForm.company}
                      onChange={(e) => setWalkinForm({ ...walkinForm, company: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Chức danh / Chức vụ
                    </label>
                    <input
                      type="text"
                      placeholder="Giám đốc..."
                      value={walkinForm.position}
                      onChange={(e) => setWalkinForm({ ...walkinForm, position: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Chọn phần tham gia sự kiện */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Tham gia phần nào của sự kiện?
                  </label>
                  <div className="space-y-1.5">
                    {["Tọa đàm / Hội nghị Chuyên Đề", "Tiệc Gala Dinner & Kết Nối"].map((part) => {
                      const isChecked = walkinForm.selectedParts.includes(part);
                      return (
                        <label
                          key={part}
                          className="flex items-center gap-2 p-2 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setWalkinForm((prev) => ({
                                ...prev,
                                selectedParts: prev.selectedParts.includes(part)
                                  ? prev.selectedParts.filter((p) => p !== part)
                                  : [...prev.selectedParts, part],
                              }));
                            }}
                            className="rounded text-blue-600"
                          />
                          <span>{part}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Nút thêm người đi cùng (+) */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">
                      Người đi cùng ({additionalWalkins.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAdditionalWalkins((prev) => [
                          ...prev,
                          {
                            id: `walk_${Date.now()}`,
                            fullName: "",
                            phone: "",
                            email: "",
                            company: walkinForm.company,
                            position: "",
                          },
                        ])
                      }
                      className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-[11px] font-bold border border-blue-500/40"
                    >
                      + Thêm người đi cùng
                    </button>
                  </div>

                  {additionalWalkins.map((w, idx) => (
                    <div key={w.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                        <span>Đại biểu #{idx + 2}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAdditionalWalkins((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-rose-400 hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Họ tên *"
                          value={w.fullName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAdditionalWalkins((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, fullName: val } : it))
                            );
                          }}
                          className="h-8 px-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="SĐT *"
                          value={w.phone}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAdditionalWalkins((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, phone: val } : it))
                            );
                          }}
                          className="h-8 px-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white"
                        />
                        <input
                          type="email"
                          required
                          placeholder="Email *"
                          value={w.email}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAdditionalWalkins((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, email: val } : it))
                            );
                          }}
                          className="h-8 px-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setWalkinModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submittingWalkin}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md disabled:opacity-50"
                  >
                    {submittingWalkin ? "Đang Đăng Ký..." : "Xác Nhận & Check-in"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
