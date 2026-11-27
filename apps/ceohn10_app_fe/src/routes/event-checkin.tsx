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
  Wifi,
  WifiOff,
  Download,
  CloudUpload,
  HardDrive,
  Clock,
  Ticket,
  Dices,
  MapPin,
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
  const [activeCategory, setActiveCategory] = useState<"member" | "ticket" | "walkin">("member");
  const [memberCodeInput, setMemberCodeInput] = useState("");
  const [unregisteredMember, setUnregisteredMember] = useState<any>(null);
  const [thankYouSuccess, setThankYouSuccess] = useState<{
    name: string;
    subtitle: string;
    luckyNumber?: string;
    seatAssignment?: string;
  } | null>(null);
  const [walkinQrResult, setWalkinQrResult] = useState<{
    regId: string;
    amount: number;
    vietQrUrl: string;
    transferContent: string;
    bankName: string;
    bankAccount: string;
    bankOwner: string;
    fullName: string;
  } | null>(null);
  const [ticketInput, setTicketInput] = useState("");
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDecodingImage, setIsDecodingImage] = useState(false);

  // Live Photos Modal State
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  // Selected Parts during ticket scan
  const [selectedCheckinParts, setSelectedCheckinParts] = useState<string[]>([]);

  // Danh sách sự kiện & Sự kiện đang chọn để Check-in (Yêu cầu 4)
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [selectedEventObj, setSelectedEventObj] = useState<any>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("latest");
  const [selectedEventName, setSelectedEventName] = useState<string>("DẠ TIỆC TẤT NIÊN YEAR END PARTY 2026 - CEO HN10");
  const [selectedEventFee, setSelectedEventFee] = useState<number>(500000);
  const [selectedEventIsFree, setSelectedEventIsFree] = useState<boolean>(false);

  // Walk-in Registration Modal State
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [walkinPaymentMethod, setWalkinPaymentMethod] = useState<"cash_instant" | "email_invoice">("cash_instant");
  const [walkinForm, setWalkinForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    company: "",
    position: "",
    selectedParts: [] as string[],
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

  // ── OFFLINE CHECKIN STATE (MẤT SÓNG / KHÔNG CÓ MẠNG) ───────────────────────
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== "undefined" ? navigator.onLine : true);
  const [forceOffline, setForceOffline] = useState(false);
  const [cachedTickets, setCachedTickets] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("ceohn10_offline_tickets");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("ceohn10_offline_queue");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [syncConflictReport, setSyncConflictReport] = useState<any[] | null>(null);

  const triggerAutoSync = async (queueToSync: any[]) => {
    if (!queueToSync || queueToSync.length === 0 || isSyncingQueue) return;
    setIsSyncingQueue(true);
    try {
      const res = await fetchNestApi<any>("/events/batch-sync-checkin", {
        method: "POST",
        body: JSON.stringify({
          eventId: currentTicket?.eventId || "latest",
          items: queueToSync,
        }),
      });
      if (res && res.ok) {
        if (res.conflictCount && res.conflictCount > 0) {
          toast.warning(`[Auto-Sync] Đã đồng bộ ${res.syncedCount} vé, phát hiện ${res.conflictCount} vé quét trùng lặp giữa 2 máy!`);
          setSyncConflictReport(res.details?.filter((d: any) => d.status === "conflict_duplicate_warning") || []);
        } else {
          toast.success(`[Auto-Sync] Tự động đồng bộ thành công ${res.syncedCount} lượt check-in ngoại tuyến lên máy chủ!`);
        }
        setOfflineQueue([]);
        localStorage.removeItem("ceohn10_offline_queue");
      }
    } catch {
      // Giữ hàng đợi nếu mạng chập chờn
    } finally {
      setIsSyncingQueue(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info("Đã có kết nối Internet trở lại! Đang tự động kiểm tra và đồng bộ hàng đợi check-in...");
      try {
        const raw = localStorage.getItem("ceohn10_offline_queue");
        const queue = raw ? JSON.parse(raw) : [];
        if (queue.length > 0) {
          void triggerAutoSync(queue);
        }
      } catch {}
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Mất sóng / Không có Internet! Hệ thống tự động chuyển sang Chế độ Check-in Ngoại Tuyến (Offline).");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Polling Auto-sync định kỳ khi có mạng và có hàng đợi
  useEffect(() => {
    if (!isOnline || offlineQueue.length === 0) return;
    const timer = setInterval(() => {
      void triggerAutoSync(offlineQueue);
    }, 25000);
    return () => clearInterval(timer);
  }, [isOnline, offlineQueue]);

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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetchNestApi<any>("/events");
        const list = Array.isArray(res) ? res : res?.items || [];
        if (list.length > 0) {
          setEventsList(list);
          const urlEventId =
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("eventId")
              : null;
          const matched =
            (urlEventId && list.find((e: any) => e.id === urlEventId || e.slug === urlEventId)) ||
            list[0];
          setSelectedEventObj(matched);
          setSelectedEventId(matched.id);
          setSelectedEventName(matched.name || matched.title || "Sự kiện CLB CEO HN10");
          const fee = Number(matched.fee || matched.ticket_price || matched.ticketPrice || 0);
          setSelectedEventFee(fee);
          setSelectedEventIsFree(fee === 0);
        }
      } catch {
        // ignore
      }
    };
    void fetchEvents();
  }, []);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    const found = eventsList.find((e) => e.id === eventId);
    if (found) {
      setSelectedEventObj(found);
      setSelectedEventName(found.name || found.title || "Sự kiện CLB CEO HN10");
      const fee = Number(found.fee || found.ticket_price || found.ticketPrice || 0);
      setSelectedEventFee(fee);
      setSelectedEventIsFree(fee === 0);
    }
  };

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

  const downloadOfflineTickets = async (targetEventId?: string) => {
    const eId = targetEventId || currentTicket?.eventId || "latest";
    setIsDownloadingOffline(true);
    try {
      const res = await fetchNestApi<any>(`/events/${eId}/offline-dataset`);
      if (res && res.ok && Array.isArray(res.tickets)) {
        setCachedTickets(res.tickets);
        localStorage.setItem("ceohn10_offline_tickets", JSON.stringify(res.tickets));
        toast.success(`Đã tải trước thành công ${res.tickets.length} vé về máy! Bạn có thể check-in mượt mà kể cả khi mất sóng.`);
      } else {
        toast.error(res?.message || "Không thể tải danh sách vé sự kiện");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tải danh sách vé ngoại tuyến");
    } finally {
      setIsDownloadingOffline(false);
    }
  };

  const handleSyncOfflineQueue = async () => {
    if (offlineQueue.length === 0) {
      toast.info("Không có lượt check-in ngoại tuyến nào cần đồng bộ.");
      return;
    }
    setIsSyncingQueue(true);
    try {
      const res = await fetchNestApi<any>("/events/batch-sync-checkin", {
        method: "POST",
        body: JSON.stringify({
          eventId: currentTicket?.eventId || "latest",
          items: offlineQueue,
        }),
      });
      if (res && res.ok) {
        toast.success(`Đồng bộ thành công ${res.syncedCount} lượt check-in ngoại tuyến lên máy chủ!`);
        setOfflineQueue([]);
        localStorage.removeItem("ceohn10_offline_queue");
      } else {
        toast.error(res?.message || "Lỗi khi đồng bộ dữ liệu ngoại tuyến");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi kết nối khi đồng bộ lên máy chủ");
    } finally {
      setIsSyncingQueue(false);
    }
  };

  // Auto-polling 3s khi khách mới đang chờ thanh toán VietQR
  useEffect(() => {
    if (!walkinQrResult?.regId) return;
    const timer = setInterval(async () => {
      try {
        const qp = selectedEventId && selectedEventId !== "latest" ? `?eventId=${encodeURIComponent(selectedEventId)}` : "";
        const st = await fetchNestApi<any>(`/events/ticket-status/${encodeURIComponent(walkinQrResult.regId)}${qp}`);
        if (st?.found && st?.ticket && (st.ticket.paymentStatus === "paid" || st.ticket.status === "confirmed")) {
          // Tự động đánh dấu Check-in khi thanh toán thành công
          let finalLucky = st.ticket.luckyNumber;
          if (!st.ticket.isCheckedIn) {
            const chkRes = await fetchNestApi<any>("/events/ticket-checkin", {
              method: "POST",
              body: JSON.stringify({ ticketCode: walkinQrResult.regId, method: "sepay_walkin_auto" }),
            }).catch(() => null);
            if (chkRes?.ticket?.luckyNumber) finalLucky = chkRes.ticket.luckyNumber;
          }
          clearInterval(timer);
          setThankYouSuccess({
            name: walkinQrResult.fullName,
            subtitle: "Thanh toán thành công! Đã dán Sticker Số May Mắn và lưu vào Màn Quay Thưởng.",
            luckyNumber: finalLucky,
            seatAssignment: st.ticket.seatAssignment,
          });
          setWalkinQrResult(null);
          setWalkinModalOpen(false);
          toast.success(`Thanh toán thành công! Cảm ơn ${walkinQrResult.fullName} đã tham gia sự kiện!`);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [walkinQrResult, selectedEventId]);

  const lookupTicket = async (codeToSearch: string) => {
    if (!codeToSearch || !codeToSearch.trim()) {
      toast.info("Vui lòng nhập mã vé hoặc mã học viên để tra cứu");
      return;
    }
    const clean = codeToSearch.trim();
    setLoading(true);
    setSelectedFeeQr(null);
    setUnregisteredMember(null);
    setThankYouSuccess(null);

    const effectiveOffline = !isOnline || forceOffline;
    if (effectiveOffline) {
      const lower = clean.toLowerCase();
      const localFound = cachedTickets.find(
        (t) =>
          t.id === clean ||
          (t.memberCode && t.memberCode.toUpperCase() === clean.toUpperCase()) ||
          t.luckyNumber === clean ||
          (t.phone && t.phone.includes(clean)) ||
          (t.memberName && t.memberName.toLowerCase().includes(lower)) ||
          (t.company && t.company.toLowerCase().includes(lower))
      );
      if (localFound) {
        const queued = offlineQueue.find((q) => q.ticketCode === localFound.id || q.ticketCode === clean);
        const isAlreadyCheckedIn = localFound.isCheckedIn || !!queued;
        const checkedInAt = queued?.checkedInAt || localFound.checkedInAt;

        setCurrentTicket({
          id: localFound.id,
          memberName: localFound.memberName,
          memberCode: localFound.memberCode,
          eventTitle: localFound.eventTitle || "Sự kiện CEO HN10",
          phone: localFound.phone,
          company: localFound.company,
          position: localFound.position,
          seatAssignment: localFound.seatAssignment,
          luckyNumber: localFound.luckyNumber,
          ticketType: localFound.ticketType,
          isCheckedIn: isAlreadyCheckedIn,
          checkedInAt: checkedInAt,
          attendedParts: localFound.attendedParts || [],
          isOfflineData: true,
        });
        toast.success(`[OFFLINE] Tìm thấy vé: ${localFound.memberName} (${localFound.company || "Hội viên"})`);
      } else {
        setCurrentTicket(null);
        toast.error(`[OFFLINE] Không tìm thấy vé với mã "${clean}" trong dữ liệu máy đã tải về. Bấm "Tải Vé Offline" khi có mạng để cập nhật.`);
      }
      setLoading(false);
      return;
    }

    try {
      const evQuery = selectedEventId && selectedEventId !== "latest" ? `?eventId=${encodeURIComponent(selectedEventId)}` : "";
      const res = await fetchNestApi<any>(
        `/events/ticket-status/${encodeURIComponent(clean)}${evQuery}`
      );
      if (res && res.found && res.ticket) {
        setCurrentTicket(res.ticket);
        setUnregisteredMember(null);
        toast.success(`Tìm thấy thông tin vé: ${res.ticket.memberName}`);
        if (res.ticket.eventId) {
          loadEventFees(res.ticket.eventId);
        }
      } else if (res && res.notRegisteredForEvent && res.member) {
        setCurrentTicket(null);
        setUnregisteredMember(res.member);
        toast.warning(res.message || "Học viên chưa đăng ký sự kiện này!");
      } else {
        setCurrentTicket(null);
        setUnregisteredMember(null);
        toast.error(res?.message || "Không tìm thấy vé với mã này trong sự kiện.");
      }
    } catch (err: any) {
      // Fallback local search
      const lower = clean.toLowerCase();
      const localFound = cachedTickets.find(
        (t) =>
          t.id === clean ||
          (t.memberCode && t.memberCode.toUpperCase() === clean.toUpperCase()) ||
          t.luckyNumber === clean ||
          (t.phone && t.phone.includes(clean)) ||
          (t.memberName && t.memberName.toLowerCase().includes(lower)) ||
          (t.company && t.company.toLowerCase().includes(lower))
      );
      if (localFound) {
        const queued = offlineQueue.find((q) => q.ticketCode === localFound.id || q.ticketCode === clean);
        setCurrentTicket({
          ...localFound,
          isCheckedIn: localFound.isCheckedIn || !!queued,
          checkedInAt: queued?.checkedInAt || localFound.checkedInAt,
          isOfflineData: true,
        });
        toast.info(`[Chế độ dự phòng] Lỗi mạng - Đã lấy thông tin từ dữ liệu lưu trong máy: ${localFound.memberName}`);
      } else {
        setCurrentTicket(null);
        toast.error(err?.message || "Lỗi khi tra cứu mã vé");
      }
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

    const effectiveOffline = !isOnline || forceOffline;

    // OFFLINE CHECK-IN LOGIC
    if (effectiveOffline) {
      if (currentTicket.isCheckedIn) {
        toast.error(`[OFFLINE] Vé này ĐÃ ĐƯỢC CHECK-IN lúc ${currentTicket.checkedInAt || "trước đó"}! Không thể check-in lại.`);
        setActionLoading(false);
        return;
      }

      const nowStr = new Date().toLocaleString("vi-VN");
      const newQueueItem = {
        ticketCode: currentTicket.id,
        checkedInAt: new Date().toISOString(),
        method: "offline_kiosk",
        attendedParts: selectedCheckinParts,
        memberName: currentTicket.memberName,
        company: currentTicket.company,
        seatAssignment: currentTicket.seatAssignment,
      };

      const nextQueue = [...offlineQueue, newQueueItem];
      setOfflineQueue(nextQueue);
      localStorage.setItem("ceohn10_offline_queue", JSON.stringify(nextQueue));

      const updatedTickets = cachedTickets.map((t) =>
        t.id === currentTicket.id ? { ...t, isCheckedIn: true, checkedInAt: nowStr } : t
      );
      setCachedTickets(updatedTickets);
      localStorage.setItem("ceohn10_offline_tickets", JSON.stringify(updatedTickets));

      setCurrentTicket({
        ...currentTicket,
        isCheckedIn: true,
        checkedInAt: nowStr,
        attendedParts: selectedCheckinParts,
        isQueuedOffline: true,
      });

      toast.success(`[OFFLINE] Check-in thành công: ${currentTicket.memberName}! (Đã lưu vào bộ nhớ máy, chờ có mạng để đồng bộ)`);
      setActionLoading(false);
      return;
    }

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
        const assignedLucky = res.ticket?.luckyNumber || currentTicket.luckyNumber || String(Math.floor(1000 + Math.random() * 9000));
        toast.success(res.message || `Check-in thành công! Sticker số may mắn: #${assignedLucky}`);
        setCurrentTicket({
          ...currentTicket,
          isCheckedIn: true,
          luckyNumber: assignedLucky,
          checkedInAt: res.checkedInAt || new Date().toLocaleString("vi-VN"),
          attendedParts: res.ticket?.attendedParts || selectedCheckinParts,
        });
        setThankYouSuccess({
          name: currentTicket.memberName || "Quý đại biểu",
          subtitle: "Check-in thành công! Khách mời đã được cấp Sticker Số May Mắn & lưu trực tiếp vào Màn Quay Thưởng.",
          luckyNumber: assignedLucky,
          seatAssignment: res.ticket?.seatAssignment || currentTicket.seatAssignment,
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
      // Fallback to offline queue on unexpected network fail
      const nowStr = new Date().toLocaleString("vi-VN");
      const newQueueItem = {
        ticketCode: currentTicket.id,
        checkedInAt: new Date().toISOString(),
        method: "offline_fallback",
        attendedParts: selectedCheckinParts,
        memberName: currentTicket.memberName,
      };
      const nextQueue = [...offlineQueue, newQueueItem];
      setOfflineQueue(nextQueue);
      localStorage.setItem("ceohn10_offline_queue", JSON.stringify(nextQueue));

      setCurrentTicket({
        ...currentTicket,
        isCheckedIn: true,
        checkedInAt: nowStr,
        attendedParts: selectedCheckinParts,
        isQueuedOffline: true,
      });
      toast.warning(`Mất kết nối mạng! Hệ thống đã tự động lưu lượt check-in của ${currentTicket.memberName} vào bộ nhớ máy để đồng bộ sau.`);
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
    const targetEventId = selectedEventId || currentTicket?.eventId || "latest";
    const isInstantCheckin = walkinPaymentMethod === "cash_instant" || selectedEventIsFree;
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
          ticketType: selectedEventIsFree ? "Vé Khách Mới (Miễn Phí)" : "Vé Khách Mới Tại Cửa",
          ticketCount: allWalkins.length,
          ticketPrice: selectedEventFee,
          isWalkIn: true,
          autoCheckin: isInstantCheckin,
          paymentStatus: isInstantCheckin ? (selectedEventIsFree ? "free" : "paid") : "pending",
          sendPaymentInvoiceEmail: !isInstantCheckin,
          note: isInstantCheckin
            ? (selectedEventIsFree ? "Khách mới sự kiện miễn phí - Đã check-in tại quầy" : "Khách mới - Đã thanh toán trực tiếp tại quầy và check-in")
            : "Khách mới - Đã gửi email thông báo phí kèm VietQR (Hệ thống tự động check-in khi nhận thanh toán)",
          attendees: allWalkins,
          attendedParts: walkinForm.selectedParts,
        }),
      });

      if (res && res.ok) {
        const regId = res.registrationId || res.id || `REG-${Date.now().toString().slice(-6)}`;
        const assignedLucky = res.luckyNumber || res.createdTickets?.[0]?.luckyNumber || String(Math.floor(1000 + Math.random() * 9000));
        if (selectedEventIsFree || selectedEventFee <= 0 || isInstantCheckin) {
          // Đảm bảo kích hoạt ticket-checkin để lưu checked_in_at và đồng bộ sang màn quay thưởng
          await fetchNestApi("/events/ticket-checkin", {
            method: "POST",
            body: JSON.stringify({
              ticketCode: regId,
              method: "walkin_gate_auto",
              attendedParts: walkinForm.selectedParts,
            }),
          }).catch(() => {});
        }
        if (selectedEventIsFree || selectedEventFee <= 0) {
          setThankYouSuccess({
            name: walkinForm.fullName.trim(),
            subtitle: "Đăng ký & Check-in thành công! Đã cấp Sticker Số May Mắn và lưu vào Màn Quay Thưởng.",
            luckyNumber: assignedLucky,
          });
          toast.success(`Check-in thành công cho ${walkinForm.fullName}! Số may mắn: #${assignedLucky}`);
          setWalkinModalOpen(false);
          setWalkinForm({
            fullName: "",
            phone: "",
            email: "",
            company: "",
            position: "",
            selectedParts: [],
          });
          setAdditionalWalkins([]);
          lookupTicket(regId);
        } else {
          // Sự kiện có phí: Hiện luôn mã QR thanh toán VietQR & chờ thanh toán thành công -> Tự Check-in
          const activeEv = eventsList.find((ev) => ev.id === targetEventId);
          const bankAccount = activeEv?.bank_account || activeEv?.bankAccount || "0983101010";
          const bankName = activeEv?.bank_name || activeEv?.bankName || "MB Bank";
          const bankOwner = activeEv?.bank_owner || activeEv?.bankOwner || "CLB DOANH NHAN CEO HN10";
          const totalPay = selectedEventFee * allWalkins.length;
          const transferContent = `EV_${regId}`;
          const vietQrUrl =
            res.vietQrUrl ||
            `https://img.vietqr.io/image/970422-${encodeURIComponent(bankAccount)}-compact2.png?amount=${totalPay}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankOwner)}`;
          setWalkinQrResult({
            regId,
            amount: totalPay,
            vietQrUrl,
            transferContent,
            bankName,
            bankAccount,
            bankOwner,
            fullName: walkinForm.fullName.trim(),
          });
          toast.info("Vui lòng quét mã QR để thanh toán vé. Thanh toán xong hệ thống tự động Check-in!");
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

  // Lấy danh sách các phần chương trình đã cấu hình của sự kiện (không fix cứng Tọa đàm/Tiệc)
  const configuredEventParts: string[] = (() => {
    const rawParts = currentTicket?.eventParts || selectedEventObj?.parts;
    if (Array.isArray(rawParts) && rawParts.length > 0) {
      return rawParts
        .map((p: any) => (typeof p === "string" ? p : p?.name || p?.title || ""))
        .filter(Boolean);
    }
    return [];
  })();

  // Lấy Timeline (Agenda) đúng theo sự kiện đang chọn (tổng hợp cả timeline của từng phần nếu có)
  const rawEventAgenda: Array<{ time?: string; title?: string; speaker?: string; description?: string }> = (() => {
    const source = currentTicket?.eventAgenda || selectedEventObj?.agenda;
    if (Array.isArray(source) && source.length > 0) return source;
    if (typeof source === "string" && source.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(source);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    // Nếu sự kiện có cấu hình timeline trong các parts thì gom lại
    if (Array.isArray(selectedEventObj?.parts) && selectedEventObj.parts.length > 0) {
      const fromParts: Array<{ time?: string; title?: string; speaker?: string; description?: string }> = [];
      for (const p of selectedEventObj.parts) {
        if (Array.isArray(p?.timeline) && p.timeline.length > 0) {
          for (const tItem of p.timeline) {
            fromParts.push({
              time: [tItem.startTime, tItem.endTime].filter(Boolean).join(" - ") || tItem.time || p.startTime,
              title: tItem.title || tItem.content || p.name,
              speaker: tItem.speaker || p.name,
              description: tItem.description,
            });
          }
        } else if (p?.name) {
          fromParts.push({
            time: [p.startTime, p.endTime].filter(Boolean).join(" - ") || "Theo lịch trình",
            title: p.name,
            speaker: p.hallName || selectedEventObj?.venueName || "",
          });
        }
      }
      if (fromParts.length > 0) return fromParts;
    }
    const baseStart = selectedEventObj?.start_time || selectedEventObj?.startTime || "08:00";
    const baseEnd = selectedEventObj?.end_time || selectedEventObj?.endTime || "12:00";
    return [
      {
        time: `${baseStart} - 08:45`,
        title: "Đón tiếp Đại biểu · Quét QR Check-in & Dán Sticker Số May Mắn",
        speaker: "Ban Lễ Tân & Thư Ký CLB CEO HN10",
      },
      {
        time: "08:45 - 10:30",
        title: "Khai mạc & Nội dung Trọng Tâm Sự Kiện",
        speaker: "Ban Chủ Tịch & Khách Mời",
      },
      {
        time: `10:30 - ${baseEnd}`,
        title: "Giao Lưu Kết Nối & Quay Thưởng Sticker Số May Mắn",
        speaker: "Toàn thể Hội viên & Khách mời",
      },
    ];
  })();

  // Hiệu ứng chạm mặt nước iOS chân thực (3 vòng sóng nước đồng tâm + khúc xạ ánh sáng + độ nảy mặt nước)
  const triggerWaterRipple = (e: React.MouseEvent<HTMLElement> | React.PointerEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    target.classList.remove("ios-water-surface-bounce");
    void target.offsetWidth;
    target.classList.add("ios-water-surface-bounce");

    const drop = document.createElement("span");
    drop.className = "ios-water-ripple-wave";
    drop.style.left = `${x}px`;
    drop.style.top = `${y}px`;
    target.appendChild(drop);

    const ring1 = document.createElement("span");
    ring1.className = "ios-water-ripple-ring";
    ring1.style.left = `${x}px`;
    ring1.style.top = `${y}px`;
    target.appendChild(ring1);

    const ring2 = document.createElement("span");
    ring2.className = "ios-water-ripple-ring ios-water-ripple-ring-delay-1";
    ring2.style.left = `${x}px`;
    ring2.style.top = `${y}px`;
    target.appendChild(ring2);

    const ring3 = document.createElement("span");
    ring3.className = "ios-water-ripple-ring ios-water-ripple-ring-delay-2";
    ring3.style.left = `${x}px`;
    ring3.style.top = `${y}px`;
    target.appendChild(ring3);

    setTimeout(() => {
      drop.remove();
      ring1.remove();
      ring2.remove();
      ring3.remove();
    }, 1150);
  };

  const submergedBgImage =
    selectedEventObj?.image ||
    selectedEventObj?.banner ||
    selectedEventObj?.cover_image ||
    "/skyline_perspective_dark.jpg";

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden flex flex-col text-slate-950 font-sans selection:bg-slate-900 selection:text-white bg-[#dbe4f0]">
      <style>{`
        @keyframes iosCausticFloat {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(20px, -16px, 0) scale(1.06); }
        }
        @keyframes iosWaterSurfaceBounce {
          0% { transform: scale(1); }
          25% { transform: scale(0.978) translateY(1.5px); }
          55% { transform: scale(1.01) translateY(-1px); }
          80% { transform: scale(0.996); }
          100% { transform: scale(1); }
        }
        .ios-water-surface-bounce {
          animation: iosWaterSurfaceBounce 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes iosWaterWave {
          0% {
            width: 6px;
            height: 6px;
            opacity: 0.95;
            transform: translate(-50%, -50%) scale(0.2);
          }
          50% {
            opacity: 0.65;
          }
          100% {
            width: 420px;
            height: 420px;
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.35);
          }
        }
        @keyframes iosWaterRing {
          0% {
            width: 8px;
            height: 8px;
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.25);
          }
          70% {
            opacity: 0.55;
          }
          100% {
            width: 360px;
            height: 360px;
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.45);
          }
        }
        .ios-liquid-glass {
          position: relative;
          overflow: hidden;
          background: radial-gradient(
            130% 100% at 12% 8%,
            rgba(255, 255, 255, 0.46) 0%,
            rgba(255, 255, 255, 0.14) 45%,
            rgba(255, 255, 255, 0.22) 100%
          );
          backdrop-filter: blur(15px) saturate(200%) brightness(106%);
          -webkit-backdrop-filter: blur(15px) saturate(200%) brightness(106%);
          border: 1px solid rgba(255, 255, 255, 0.72);
          box-shadow:
            0 24px 48px -12px rgba(15, 23, 42, 0.25),
            0 10px 22px -6px rgba(15, 23, 42, 0.12),
            inset 0 2px 6px rgba(255, 255, 255, 0.98),
            inset 0 -3px 8px rgba(15, 23, 42, 0.08),
            inset 0 0 22px rgba(255, 255, 255, 0.28);
        }
        .ios-liquid-glass-active {
          position: relative;
          overflow: hidden;
          background: radial-gradient(
            130% 100% at 12% 8%,
            rgba(255, 255, 255, 0.64) 0%,
            rgba(255, 255, 255, 0.28) 50%,
            rgba(255, 255, 255, 0.38) 100%
          );
          backdrop-filter: blur(16px) saturate(215%) brightness(108%);
          -webkit-backdrop-filter: blur(16px) saturate(215%) brightness(108%);
          border: 1.5px solid rgba(255, 255, 255, 0.96);
          box-shadow:
            0 26px 52px -10px rgba(15, 23, 42, 0.28),
            0 8px 20px -4px rgba(15, 23, 42, 0.14),
            inset 0 2.5px 6px rgba(255, 255, 255, 1),
            inset 0 -3px 8px rgba(14, 165, 233, 0.16),
            inset 0 0 28px rgba(255, 255, 255, 0.42);
        }
        .ios-liquid-pill {
          position: relative;
          overflow: hidden;
          background: radial-gradient(
            120% 90% at 15% 10%,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(255, 255, 255, 0.16) 55%,
            rgba(255, 255, 255, 0.24) 100%
          );
          backdrop-filter: blur(12px) saturate(195%);
          -webkit-backdrop-filter: blur(12px) saturate(195%);
          border: 1px solid rgba(255, 255, 255, 0.78);
          box-shadow:
            0 10px 24px -6px rgba(15, 23, 42, 0.16),
            inset 0 2px 4px rgba(255, 255, 255, 0.98),
            inset 0 -2px 4px rgba(15, 23, 42, 0.06);
        }
        .ios-liquid-input {
          background: rgba(255, 255, 255, 0.32);
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          border: 1.5px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            inset 0 2px 4px rgba(255, 255, 255, 0.85),
            0 4px 14px rgba(15, 23, 42, 0.06);
        }
        .ios-liquid-input:focus {
          background: rgba(255, 255, 255, 0.52);
          border-color: rgba(255, 255, 255, 1);
          box-shadow:
            0 0 0 3px rgba(255, 255, 255, 0.55),
            inset 0 1.5px 3px rgba(255, 255, 255, 1);
        }
        .ios-water-btn {
          position: relative;
          overflow: hidden;
          transition:
            transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.32s cubic-bezier(0.22, 1, 0.36, 1),
            background 0.32s ease;
        }
        .ios-water-btn:active {
          transform: scale(0.96);
        }
        .ios-water-ripple-wave {
          position: absolute;
          pointer-events: none;
          border-radius: 9999px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(186, 230, 253, 0.78) 32%,
            rgba(125, 211, 252, 0.38) 56%,
            rgba(255, 255, 255, 0) 76%
          );
          animation: iosWaterWave 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 30;
        }
        .ios-water-ripple-ring {
          position: absolute;
          pointer-events: none;
          border-radius: 9999px;
          border: 2px solid rgba(255, 255, 255, 0.96);
          box-shadow:
            0 0 18px rgba(125, 211, 252, 0.85),
            inset 0 0 12px rgba(255, 255, 255, 0.95);
          animation: iosWaterRing 0.92s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 31;
        }
        .ios-water-ripple-ring-delay-1 {
          animation-delay: 0.11s;
          border-width: 1.5px;
          opacity: 0;
        }
        .ios-water-ripple-ring-delay-2 {
          animation-delay: 0.22s;
          border-width: 1px;
          opacity: 0;
        }
      `}</style>

      {/* NỀN CÓ ẢNH CHÌM SANG TRỌNG + LỚP PHỦ TRONG SUỐT ĐỂ KÍNH LIQUID GLASS KHÚC XẠ RÕ NÉT */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-all duration-700"
          style={{
            backgroundImage: `url("${submergedBgImage}"), url("/skyline_perspective_dark.jpg")`,
            filter: "saturate(120%) contrast(106%) brightness(104%)",
          }}
        />
        {/* Lớp voan ngọc trai siêu trong suốt (0.32 - 0.42) để nhìn rõ ảnh chìm phía dưới lớp kính mà chữ đen vẫn nổi bật */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(155deg, rgba(248, 250, 252, 0.38) 0%, rgba(241, 245, 249, 0.32) 50%, rgba(226, 232, 240, 0.42) 100%)",
          }}
        />
        <div
          className="absolute -top-24 -left-16 w-[500px] h-[500px] rounded-full opacity-65 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(186,230,253,0.4) 55%, transparent 100%)",
            animation: "iosCausticFloat 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[540px] h-[540px] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(254,243,199,0.45) 0%, rgba(255,255,255,0.5) 60%, transparent 100%)",
            animation: "iosCausticFloat 15s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-4 flex flex-col justify-center">
        {/* HEADER CHỈ CÓ LOGO CEO HN10 CÙNG TÊN SỰ KIỆN & THÔNG TIN (ĐÃ BỎ TIMELINE) */}
        <div className="ios-liquid-glass rounded-3xl p-4 sm:p-6 text-center space-y-3.5 relative overflow-hidden">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="ios-liquid-pill px-4 py-1.5 rounded-2xl inline-flex items-center justify-center">
              <img
                src="/hn10-logo-2.png"
                alt="CEO HN10"
                className="h-7 sm:h-9 w-auto object-contain brightness-0"
              />
            </div>

            <h1
              className="text-xl sm:text-3xl font-black uppercase tracking-tight text-slate-950 leading-tight break-words"
              style={{ textShadow: "0 1px 2px rgba(255,255,255,0.85)" }}
            >
              {selectedEventName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            {(selectedEventObj?.date || selectedEventObj?.time) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ios-liquid-pill text-slate-950 font-bold">
                <Calendar className="w-3.5 h-3.5 text-slate-900" />
                <span>
                  {[
                    selectedEventObj?.date
                      ? String(selectedEventObj.date).slice(0, 10)
                      : null,
                    selectedEventObj?.time ||
                      [selectedEventObj?.start_time, selectedEventObj?.end_time].filter(Boolean).join(" - "),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            )}
            {(selectedEventObj?.venueName || selectedEventObj?.venue_name || selectedEventObj?.location) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ios-liquid-pill text-slate-950 font-bold">
                <MapPin className="w-3.5 h-3.5 text-slate-900" />
                <span>
                  {[selectedEventObj?.venueName || selectedEventObj?.venue_name, selectedEventObj?.location]
                    .filter(Boolean)
                    .join(" - ")}
                </span>
              </span>
            )}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full font-black border backdrop-blur-md ${
                selectedEventIsFree
                  ? "bg-emerald-400/35 text-emerald-950 border-white/85"
                  : "bg-amber-400/35 text-amber-950 border-white/85"
              }`}
            >
              {selectedEventIsFree
                ? "Miễn phí tham dự"
                : `Phí: ${new Intl.NumberFormat("vi-VN").format(selectedEventFee)} VNĐ`}
            </span>

            {eventsList.length > 1 && (
              <select
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value)}
                className="text-xs font-bold ios-liquid-pill rounded-full px-3 py-1 text-slate-950 outline-none cursor-pointer max-w-[230px] truncate hover:border-white transition"
                title="Đổi sự kiện để check-in"
              >
                {eventsList.map((evt) => (
                  <option key={evt.id} value={evt.id} className="text-slate-950 bg-white">
                    {evt.name || evt.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* 3 DANH MỤC NẰM NGANG NGAY CẢ TRÊN MÀN ĐIỆN THOẠI + KÍNH TRONG SUỐT & CHẠM MẶT NƯỚC */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
          <button
            type="button"
            onPointerDown={triggerWaterRipple}
            onClick={() => {
              setActiveCategory("member");
              setUnregisteredMember(null);
            }}
            className={`ios-water-btn group rounded-2xl p-2.5 sm:p-4 text-left cursor-pointer text-slate-950 ${
              activeCategory === "member"
                ? "ios-liquid-glass-active scale-[1.02]"
                : "ios-liquid-glass hover:bg-white/35"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
              <span
                className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-[10px] sm:text-xs font-black ${
                  activeCategory === "member"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "ios-liquid-pill text-slate-950"
                }`}
              >
                01
              </span>
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900" />
            </div>
            <div
              className="text-[11px] sm:text-sm font-black tracking-tight leading-tight text-slate-950"
              style={{ textShadow: "0 1px 1px rgba(255,255,255,0.8)" }}
            >
              Học viên CEO HN10
            </div>
            <div className="text-[9.5px] sm:text-[11px] mt-0.5 leading-tight line-clamp-2 text-slate-800 font-semibold">
              Nhập mã HV tra cứu &amp; nhận Sticker số may mắn
            </div>
          </button>

          <button
            type="button"
            onPointerDown={triggerWaterRipple}
            onClick={() => {
              setActiveCategory("ticket");
              setUnregisteredMember(null);
            }}
            className={`ios-water-btn group rounded-2xl p-2.5 sm:p-4 text-left cursor-pointer text-slate-950 ${
              activeCategory === "ticket"
                ? "ios-liquid-glass-active scale-[1.02]"
                : "ios-liquid-glass hover:bg-white/35"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
              <span
                className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-[10px] sm:text-xs font-black ${
                  activeCategory === "ticket"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "ios-liquid-pill text-slate-950"
                }`}
              >
                02
              </span>
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900" />
            </div>
            <div
              className="text-[11px] sm:text-sm font-black tracking-tight leading-tight text-slate-950"
              style={{ textShadow: "0 1px 1px rgba(255,255,255,0.8)" }}
            >
              Khách đã có Mã Vé
            </div>
            <div className="text-[9.5px] sm:text-[11px] mt-0.5 leading-tight line-clamp-2 text-slate-800 font-semibold">
              Nhập mã vé hoặc tải ảnh QR vé để Check-in
            </div>
          </button>

          <button
            type="button"
            onPointerDown={triggerWaterRipple}
            onClick={() => {
              setActiveCategory("walkin");
              setUnregisteredMember(null);
              setWalkinQrResult(null);
            }}
            className={`ios-water-btn group rounded-2xl p-2.5 sm:p-4 text-left cursor-pointer text-slate-950 ${
              activeCategory === "walkin"
                ? "ios-liquid-glass-active scale-[1.02]"
                : "ios-liquid-glass hover:bg-white/35"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
              <span
                className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-[10px] sm:text-xs font-black ${
                  activeCategory === "walkin"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "ios-liquid-pill text-slate-950"
                }`}
              >
                03
              </span>
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900" />
            </div>
            <div
              className="text-[11px] sm:text-sm font-black tracking-tight leading-tight text-slate-950"
              style={{ textShadow: "0 1px 1px rgba(255,255,255,0.8)" }}
            >
              Khách mới đến
            </div>
            <div className="text-[9.5px] sm:text-[11px] mt-0.5 leading-tight line-clamp-2 text-slate-800 font-semibold">
              Đăng ký tại quầy &amp; cấp Sticker số may mắn
            </div>
          </button>
        </div>

        {/* KHUNG NỘI DUNG TƯƠNG ỨNG VỚI DANH MỤC ĐANG CHỌN (TRUE iOS LIQUID GLASS PANEL) */}
        <div className="ios-liquid-glass rounded-3xl text-slate-950 p-5 sm:p-7 space-y-4">
          {activeCategory === "member" && (
            <div className="space-y-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Tra Cứu &amp; Check-in Dành Cho Học Viên
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập mã học viên (VD: HN10-1234) để hệ thống kiểm tra dữ liệu đăng ký đúng sự kiện này.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="Nhập mã học viên (VD: HN10-1234)..."
                  value={memberCodeInput}
                  onChange={(e) => setMemberCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") lookupTicket(memberCodeInput);
                  }}
                  className="flex-1 h-11 rounded-xl ios-liquid-input px-4 text-sm text-slate-950 font-mono uppercase placeholder:text-slate-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    triggerWaterRipple(e);
                    lookupTicket(memberCodeInput);
                  }}
                  disabled={loading}
                  className="ios-water-btn h-11 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm shadow-md disabled:opacity-60 cursor-pointer shrink-0 transition"
                >
                  {loading ? "Đang tra cứu..." : "Tra cứu & Check-in"}
                </button>
              </div>
            </div>
          )}

          {activeCategory === "ticket" && (
            <div className="space-y-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Check-in Bằng Mã Vé Sự Kiện
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập mã vé (VD: REG-...) hoặc tải lên ảnh chứa mã QR vé của Quý đại biểu.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrImageUpload}
              />

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="Nhập mã vé (VD: REG-...)..."
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") lookupTicket(ticketInput);
                  }}
                  className="flex-1 h-11 rounded-xl ios-liquid-input px-4 text-sm text-slate-950 font-mono placeholder:text-slate-500 focus:outline-none transition"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      triggerWaterRipple(e);
                      fileInputRef.current?.click();
                    }}
                    disabled={isDecodingImage || loading}
                    className="ios-water-btn ios-liquid-pill h-11 px-4 rounded-xl hover:bg-white/75 text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shrink-0 transition"
                    title="Tải ảnh mã QR vé"
                  >
                    <Upload className="w-4 h-4 text-slate-700" />
                    <span>Ảnh QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      triggerWaterRipple(e);
                      lookupTicket(ticketInput);
                    }}
                    disabled={loading || isDecodingImage}
                    className="ios-water-btn h-11 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm shadow-md disabled:opacity-60 cursor-pointer shrink-0 transition"
                  >
                    {loading ? "Đang kiểm tra..." : "Check-in"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "walkin" && (
            <form onSubmit={handleWalkinSubmit} className="space-y-4 text-xs">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Đăng Ký Vé &amp; Check-in Khách Mới Đến
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Điền thông tin tham dự sự kiện <strong className="text-slate-800">{selectedEventName}</strong>. Thanh toán thành công sẽ tự động hoàn tất Check-in.
                </p>
              </div>

              {!selectedEventIsFree && (
                <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 space-y-2">
                  <div className="text-xs font-bold text-amber-950 flex items-center justify-between">
                    <span>Phí sự kiện: {new Intl.NumberFormat("vi-VN").format(selectedEventFee)} VNĐ / đại biểu</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      Có phí
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <label
                      className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition ${
                        walkinPaymentMethod === "cash_instant"
                          ? "bg-white border-slate-900 ring-1 ring-slate-900 shadow-2xs"
                          : "bg-white/60 border-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="walkinPayment"
                        checked={walkinPaymentMethod === "cash_instant"}
                        onChange={() => setWalkinPaymentMethod("cash_instant")}
                        className="mt-0.5 text-slate-900"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">1. Quét mã VietQR tại chỗ</div>
                        <div className="text-[10px] text-slate-500">Hiển thị QR thanh toán &amp; tự động Check-in</div>
                      </div>
                    </label>

                    <label
                      className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition ${
                        walkinPaymentMethod === "email_invoice"
                          ? "bg-white border-amber-600 ring-1 ring-amber-500 shadow-2xs"
                          : "bg-white/60 border-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="walkinPayment"
                        checked={walkinPaymentMethod === "email_invoice"}
                        onChange={() => setWalkinPaymentMethod("email_invoice")}
                        className="mt-0.5 text-amber-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">2. Gửi mail thông báo phí</div>
                        <div className="text-[10px] text-slate-500">Gửi mail kèm VietQR, tự động check-in khi thanh toán</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {walkinQrResult && (
                <div className="p-4 rounded-2xl border-2 border-amber-400 bg-amber-50 text-center space-y-3">
                  <div className="text-sm font-black text-amber-900">
                    Quét mã VietQR thanh toán vé ({walkinQrResult.amount.toLocaleString("vi-VN")} đ)
                  </div>
                  <img
                    src={walkinQrResult.vietQrUrl}
                    alt="VietQR Thanh Toán"
                    className="w-48 h-48 mx-auto rounded-xl bg-white p-2 border border-amber-200 shadow-sm object-contain"
                  />
                  <div className="text-xs text-slate-700 space-y-0.5">
                    <div>
                      Ngân hàng: <b>{walkinQrResult.bankName}</b> · STK:{" "}
                      <b className="font-mono">{walkinQrResult.bankAccount}</b>
                    </div>
                    <div>
                      Nội dung CK: <b className="font-mono text-blue-700">{walkinQrResult.transferContent}</b>
                    </div>
                    <div className="text-emerald-700 font-semibold flex items-center justify-center gap-1.5 pt-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang chờ thanh toán tự động... Thanh toán xong sẽ tự động Check-in!</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-800 font-bold mb-1">
                    Họ và tên đại biểu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={walkinForm.fullName}
                    onChange={(e) => setWalkinForm({ ...walkinForm, fullName: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl ios-liquid-input text-slate-950 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0983..."
                    value={walkinForm.phone}
                    onChange={(e) => setWalkinForm({ ...walkinForm, phone: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl ios-liquid-input text-slate-950 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@congty.com"
                    value={walkinForm.email}
                    onChange={(e) => setWalkinForm({ ...walkinForm, email: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl ios-liquid-input text-slate-950 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    Doanh nghiệp / Công ty
                  </label>
                  <input
                    type="text"
                    placeholder="Tập đoàn..."
                    value={walkinForm.company}
                    onChange={(e) => setWalkinForm({ ...walkinForm, company: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl ios-liquid-input text-slate-950 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Chức danh / Chức vụ</label>
                  <input
                    type="text"
                    placeholder="Giám đốc..."
                    value={walkinForm.position}
                    onChange={(e) => setWalkinForm({ ...walkinForm, position: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl ios-liquid-input text-slate-950 outline-none transition"
                  />
                </div>
              </div>

              {(() => {
                const activeEv = eventsList.find((e) => e.id === selectedEventId);
                const checkinCustomFields: any[] = Array.isArray(
                  activeEv?.formFieldsConfig?.checkinCustomFields
                )
                  ? activeEv.formFieldsConfig.checkinCustomFields
                  : [];
                if (checkinCustomFields.length === 0) return null;
                return (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Thông tin bổ sung khi Check-in
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {checkinCustomFields.map((cf: any) => (
                        <div key={cf.id}>
                          <label className="block text-slate-700 font-semibold mb-1 text-xs">
                            {cf.label} {cf.required && <span className="text-rose-500">*</span>}
                          </label>
                          {cf.type === "select" ? (
                            <select
                              required={Boolean(cf.required)}
                              value={(walkinForm as any)[`cf_${cf.id}`] || ""}
                              onChange={(e) =>
                                setWalkinForm({ ...walkinForm, [`cf_${cf.id}`]: e.target.value } as any)
                              }
                              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs outline-none focus:border-slate-900 focus:bg-white"
                            >
                              <option value="">-- Chọn --</option>
                              {String(cf.optionsText || "")
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                                .map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <input
                              type={
                                cf.type === "number" || cf.type === "date" || cf.type === "email"
                                  ? cf.type
                                  : "text"
                              }
                              required={Boolean(cf.required)}
                              value={(walkinForm as any)[`cf_${cf.id}`] || ""}
                              onChange={(e) =>
                                setWalkinForm({ ...walkinForm, [`cf_${cf.id}`]: e.target.value } as any)
                              }
                              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs outline-none focus:border-slate-900 focus:bg-white"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Danh sách người đi cùng */}
              {additionalWalkins.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="font-semibold text-slate-700">
                    Người đi cùng ({additionalWalkins.length}):
                  </div>
                  {additionalWalkins.map((w, idx) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>Đại biểu #{idx + 2}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAdditionalWalkins((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-rose-600 hover:underline font-semibold cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                          className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
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
                          className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
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
                          className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
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
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 cursor-pointer transition inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Thêm người check-in</span>
                </button>
                <button
                  type="submit"
                  disabled={submittingWalkin}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md disabled:opacity-50 transition cursor-pointer"
                >
                  {submittingWalkin
                    ? "Đang xử lý..."
                    : !selectedEventIsFree && walkinPaymentMethod === "email_invoice"
                    ? "Gửi Mail Thông Báo Phí & Lưu Vé Chờ"
                    : "Xác Nhận Đăng Ký & Check-in"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* TÍCH XANH CẢM ƠN & STICKER SỐ MAY MẮN KHI CHECK-IN THÀNH CÔNG */}
        {thankYouSuccess && (
          <div
            className="p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/60 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
            style={{
              background: "linear-gradient(135deg, rgba(236,253,245,0.92) 0%, rgba(255,255,255,0.92) 100%)",
              backdropFilter: "blur(24px)",
            }}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                Cảm ơn {thankYouSuccess.name} đã Check-in tham dự sự kiện!
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-emerald-800">{thankYouSuccess.subtitle}</p>
            </div>

            {/* STICKER SỐ MAY MẮN NGẪU NHIÊN DÁN CHO KHÁCH MỜI & LƯU VÀO MÀN QUAY THƯỞNG */}
            {thankYouSuccess.luckyNumber && (
              <div className="max-w-md mx-auto p-5 rounded-3xl bg-gradient-to-br from-amber-100 via-white to-amber-50 border-2 border-dashed border-amber-500 shadow-xl space-y-2.5 relative overflow-hidden">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>STICKER SỐ MAY MẮN DÁN CHO ĐẠI BIỂU</span>
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-slate-950 py-1">
                  #{thankYouSuccess.luckyNumber}
                </div>
                <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                  Mã số <strong className="text-slate-950">#{thankYouSuccess.luckyNumber}</strong> đã được hệ thống tự động lưu vào danh sách quay thưởng sự kiện.
                </p>
              </div>
            )}
          </div>
        )}

        {/* THÔNG BÁO KHI HỌC VIÊN CHƯA ĐĂNG KÝ SỰ KIỆN NÀY */}
        {unregisteredMember && (
          <div className="p-5 rounded-2xl border-2 border-amber-400 bg-amber-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="space-y-1">
              <div className="text-sm font-black text-amber-900">
                Học viên {unregisteredMember.fullName} ({unregisteredMember.code}) chưa đăng ký sự kiện này
              </div>
              <div className="text-xs text-amber-800">
                Bấm nút bên cạnh để chuyển sang danh mục Khách mới đến với thông tin đã điền sẵn.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setWalkinForm((prev) => ({
                  ...prev,
                  fullName: unregisteredMember.fullName || prev.fullName,
                  phone: unregisteredMember.phone || prev.phone,
                  email: unregisteredMember.email || prev.email,
                  company: unregisteredMember.company || prev.company,
                  position: unregisteredMember.position || prev.position,
                }));
                setWalkinQrResult(null);
                setActiveCategory("walkin");
                setUnregisteredMember(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shrink-0 transition"
            >
              Đăng ký vé &amp; Check-in ngay
            </button>
          </div>
        )}

        {/* CẢNH BÁO XUNG ĐỘT QUÉT TRÙNG LẶP OFFLINE (NẾU CÓ) */}
        {syncConflictReport && syncConflictReport.length > 0 && (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-amber-400" />
                <span>Phát hiện {syncConflictReport.length} trường hợp quét trùng lặp giữa 2 máy Offline</span>
              </span>
              <button
                type="button"
                onClick={() => setSyncConflictReport(null)}
                className="text-[11px] hover:underline text-slate-400 cursor-pointer"
              >
                Đóng thông báo
              </button>
            </div>
            <div className="divide-y divide-amber-500/20 max-h-36 overflow-y-auto">
              {syncConflictReport.map((c: any, idx: number) => (
                <div key={idx} className="py-1.5 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-mono font-bold text-white mr-2">{c.ticketCode}</span>
                    <span>{c.memberName}</span>
                  </div>
                  <span className="text-amber-300 italic">{c.warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ticket Details View (Luxury White & Liquid Glass) */}
        {currentTicket && (
          <div
            className="rounded-3xl overflow-hidden space-y-6 animate-in fade-in zoom-in-95 duration-200 text-slate-950"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.75) 100%)",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.95)",
              boxShadow: "0 24px 60px -15px rgba(15,23,42,0.1), inset 0 1px 2px rgba(255,255,255,1)",
            }}
          >
            {/* Event Header Banner */}
            <div className="bg-white/80 p-6 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-900 text-white">
                  {currentTicket.eventDate} · {currentTicket.eventTime}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 mt-2">
                  {currentTicket.eventTitle}
                </h2>
                <p className="text-xs text-slate-600 font-semibold mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-900" />
                  {currentTicket.eventLocation}
                </p>
              </div>

              {/* Lucky Draw Sticker Box */}
              {currentTicket.luckyNumber && (
                <div className="bg-amber-50 border-2 border-dashed border-amber-500 rounded-2xl p-3 text-center min-w-[140px] shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center justify-center gap-1">
                    <Ticket className="w-3 h-3 text-amber-600" />
                    <span>Sticker Số May Mắn</span>
                  </div>
                  <div className="text-2xl font-black text-slate-950 font-mono mt-0.5">
                    #{currentTicket.luckyNumber}
                  </div>
                  <div className="text-[9.5px] font-bold text-emerald-700 mt-0.5">
                    Đã lưu vào Màn Quay Thưởng
                  </div>
                </div>
              )}
            </div>

            {/* ── BẢNG ĐỐI SOÁT & PHÂN BIỆT ĐẠI BIỂU (SO SÁNH VỚI DATABASE) ── */}
            <div className="px-6">
              {currentTicket.isWalkInAfterGHour || currentTicket.registrationOrigin === "walkin_unannounced" || (currentTicket.note && currentTicket.note.includes("trước giờ G")) ? (
                <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 sm:p-5 text-left flex items-start gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 font-black">
                    <Sparkles className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-600 text-white shadow-xs uppercase tracking-wider">
                        KHÁCH KHÔNG NẰM TRONG DANH SÁCH ĐĂNG KÝ TRƯỚC GIỜ G
                      </span>
                      <span className="text-xs text-amber-900 font-bold">
                        (Sự kiện miễn phí: Tự động Check-in Pass)
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Đại biểu đến tham dự trực tiếp chưa có trong danh sách đăng ký trước giờ G. Hệ thống tự động cấp quyền tham dự và Check-in thành công.
                    </p>
                  </div>
                </div>
              ) : currentTicket.isWalkIn || currentTicket.attendeeType === "WALK_IN_NEW" ? (
                <div className="rounded-2xl border-2 border-blue-400 bg-blue-50 p-4 sm:p-5 text-left flex items-start gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-700 flex items-center justify-center shrink-0 font-black">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs uppercase tracking-wider">
                        KHÁCH MỚI ĐĂNG KÝ TẠI SỰ KIỆN (WALK-IN)
                      </span>
                      <span className="text-xs text-blue-900 font-semibold">
                        (Mã 1: Khách quét mã đăng ký tại cửa)
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Hệ thống đã đối soát danh sách: Khách mời này <strong>chưa đăng ký trước</strong>, đã mở biểu mẫu đăng ký tại cửa sự kiện.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 sm:p-5 text-left flex items-start gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0 font-black">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs uppercase tracking-wider">
                        ĐẠI BIỂU ĐÃ ĐĂNG KÝ TỪ TRƯỚC (PRE-REGISTERED)
                      </span>
                      <span className="text-xs text-emerald-900 font-semibold">
                        (Mã 2: Có trong danh sách đăng ký chính thức)
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Hệ thống đã đối soát danh sách: Đại biểu này <strong>đã đăng ký tham gia từ trước</strong> và có mã vé chính thức hợp lệ.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* STRICT 1-TIME CHECK-IN ENFORCEMENT ALERT */}
            <div className="px-6">
              {currentTicket.isCheckedIn ? (
                <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/90 p-4 sm:p-5 text-left space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-black text-sm sm:text-base">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      <span>ĐÃ CHECK-IN THÀNH CÔNG LÚC {currentTicket.checkedInAt}</span>
                    </div>
                    {currentTicket.luckyNumber && (
                      <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                        Sticker Số May Mắn: #{currentTicket.luckyNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed pl-8">
                    Đại biểu đã hoàn tất điểm danh và số Sticker may mắn <strong>#{currentTicket.luckyNumber}</strong> đã được đưa vào danh sách quay thưởng sự kiện.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-50/80 p-4 text-left flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-black text-emerald-950 text-sm">
                      Vé Hợp Lệ — Sẵn Sàng Check-in &amp; Cấp Sticker Số May Mắn
                    </div>
                    <div className="text-xs text-emerald-800">
                      Bấm nút xác nhận bên dưới để điểm danh đại biểu và lưu Sticker số may mắn vào màn quay thưởng.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Attendee Info Grid */}
            <div className="px-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 space-y-2 shadow-2xs">
                <div className="text-slate-500 font-black uppercase text-[10px] tracking-wider">
                  Thông Tin Đại Biểu
                </div>
                <div className="text-sm font-black text-slate-950 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-900" />
                  {currentTicket.memberName}
                </div>
                <div className="text-slate-700 font-semibold flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {currentTicket.phone || "—"}
                </div>
                <div className="text-slate-700 font-semibold flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {currentTicket.company} ({currentTicket.position})
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 space-y-2 shadow-2xs">
                <div className="text-slate-500 font-black uppercase text-[10px] tracking-wider">
                  Chi Tiết Mã Vé &amp; Số May Mắn
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Mã Vé:</span>
                  <span className="font-mono font-black text-slate-950 text-sm">
                    {currentTicket.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Sticker Số May Mắn:</span>
                  <span className="font-mono font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                    #{currentTicket.luckyNumber || "Tự động cấp khi Check-in"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Loại Vé:</span>
                  <span className="font-bold text-slate-900">
                    {currentTicket.ticketType} ({currentTicket.ticketCount || 1} người)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Vị Trí Chỗ Ngồi:</span>
                  <span className="font-bold text-slate-900">
                    {currentTicket.seatAssignment || "Bàn VIP / Khu vực đại biểu"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Trạng Thái Phí Vé:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      currentTicket.paymentStatus === "paid" || currentTicket.paymentStatus === "free"
                        ? "bg-emerald-500/15 text-emerald-900 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-900 border border-amber-500/30"
                    }`}
                  >
                    {currentTicket.paymentStatus === "paid"
                      ? "Đã thanh toán"
                      : currentTicket.paymentStatus === "free"
                      ? "Miễn phí"
                      : "Chưa thanh toán"}
                  </span>
                </div>
              </div>
            </div>

            {/* CHỌN PHẦN THAM GIA SỰ KIỆN KHI SOÁT VÉ (CHỈ HIỆN KHI SỰ KIỆN CÓ CẤU HÌNH PHẦN CHƯƠNG TRÌNH) */}
            {!currentTicket.isCheckedIn && configuredEventParts.length > 0 && (
              <div className="px-6 py-2 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Xác nhận phần chương trình tham gia của đại biểu:</span>
                  <span className="text-[11px] text-slate-500">Theo cấu hình sự kiện</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {configuredEventParts.map((part) => {
                    const isSelected = selectedCheckinParts.includes(part);
                    return (
                      <div
                        key={part}
                        onClick={(e) => {
                          triggerWaterRipple(e);
                          setSelectedCheckinParts((prev) =>
                            prev.includes(part)
                              ? prev.filter((p) => p !== part)
                              : [...prev, part]
                          );
                        }}
                        className={`ios-water-btn flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition ${
                          isSelected
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "ios-liquid-pill text-slate-800 hover:bg-white/80"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-slate-900 pointer-events-none"
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

        {/* NÚT THÊM NGƯỜI CHECK-IN GỌN GÀNG (ĐÃ BỎ NÚT CHỤP ẢNH, BỎ NÚT QUAY THƯỞNG & ẨN CHẾ ĐỘ ONLINE/OFFLINE) */}
        {activeCategory !== "walkin" && (
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={(e) => {
                triggerWaterRipple(e);
                setActiveCategory("walkin");
                setWalkinQrResult(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="ios-water-btn ios-liquid-pill inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-slate-950 hover:bg-white/80 text-xs font-black shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-900" />
              <span>+ Thêm người check-in</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
