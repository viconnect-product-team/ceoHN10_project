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
  const [selectedCheckinParts, setSelectedCheckinParts] = useState<string[]>([]);

  // Danh sách sự kiện & Sự kiện đang chọn để Check-in (Yêu cầu 4)
  const [eventsList, setEventsList] = useState<any[]>([]);
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
    selectedParts: ["Tọa đàm / Hội nghị Chuyên Đề", "Tiệc Gala Dinner & Kết Nối"] as string[],
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

  const lookupTicket = async (codeToSearch: string) => {
    if (!codeToSearch || !codeToSearch.trim()) {
      toast.info("Vui lòng nhập mã vé hoặc mã học viên để tra cứu");
      return;
    }
    const clean = codeToSearch.trim();
    setLoading(true);
    setSelectedFeeQr(null);

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
      const res = await fetchNestApi<any>(
        `/events/ticket-status/${encodeURIComponent(clean)}`
      );
      if (res && res.found && res.ticket) {
        setCurrentTicket(res.ticket);
        toast.success(`Tìm thấy thông tin vé: ${res.ticket.memberName}`);
        if (res.ticket.eventId) {
          loadEventFees(res.ticket.eventId);
        }
      } else {
        setCurrentTicket(null);
        toast.error(res?.message || "Không tìm thấy vé với mã này trên hệ thống.");
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
        if (isInstantCheckin) {
          toast.success(`Đã đăng ký và CHECK-IN THÀNH CÔNG cho khách mới: ${walkinForm.fullName}!`);
        } else {
          toast.success(`Đã gửi email thông báo phí kèm mã VietQR tới ${walkinForm.email}. Hệ thống sẽ TỰ ĐỘNG CHECK-IN ngay khi nhận được thanh toán!`);
        }
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header - Chuẩn Theme Sáng (Yêu cầu 4) */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-20 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Sự kiện đang Check-in:
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedEventIsFree ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}>
                  {selectedEventIsFree ? "MIỄN PHÍ" : `CÓ PHÍ (${new Intl.NumberFormat("vi-VN").format(selectedEventFee)} VNĐ)`}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
                {selectedEventName}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {eventsList.length > 1 && (
              <select
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 outline-none cursor-pointer max-w-[170px] truncate"
                title="Đổi sự kiện để check-in"
              >
                {eventsList.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name || evt.title}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => setPhotoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title="Chụp ảnh trực tiếp hoặc xem album ảnh sự kiện"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chụp &amp; Album</span>
            </button>
            <button
              type="button"
              onClick={() => setWalkinModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title="Mở form đăng ký check-in nhanh cho khách mới chưa có vé"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Khách Mới</span>
            </button>
            <a
              href="/events"
              className="text-xs text-slate-600 hover:text-slate-900 transition px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-medium"
            >
              Về CRM
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* PHÂN LOẠI CHECK-IN RÕ RÀNG: ĐÃ ĐĂNG KÝ TRƯỚC vs KHÁCH ĐĂNG KÝ MỚI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl border-2 border-[#003B95] bg-blue-50/70 flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#003B95] text-white flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-[#003B95] uppercase tracking-wide">
                1. Đã đăng ký trước (Mặc định)
              </div>
              <div className="text-[11px] text-slate-600">
                Chỉ cần nhập Mã vé đã đăng ký hoặc Tải ảnh QR vé từ email
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setWalkinModalOpen(true)}
            className="p-3.5 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 flex items-center gap-3 text-left transition shadow-xs cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                2. Khách đăng ký mới (Chưa đăng ký trước)
              </div>
              <div className="text-[11px] text-slate-600">
                Bấm vào đây để mở form đăng ký mới &amp; check-in tại quầy
              </div>
            </div>
          </button>
        </div>

        {/* Search / Scan Box & Upload QR Image (Mặc định chỉ cần Mã vé hoặc Tải ảnh QR vé email) */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-[#003B95]" />
              <span>Nhập Mã Vé đã đăng ký hoặc Tải ảnh mã QR vé gửi về Email:</span>
            </label>
            <span className="text-[11px] text-slate-500">
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
              placeholder="Nhập mã vé đã đăng ký (VD: REG-..., HN10-0001)..."
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") lookupTicket(ticketInput);
              }}
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003B95] transition"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDecodingImage || loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm shadow-2xs transition disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              title="Tải ảnh mã QR vé từ email hoặc ảnh chụp màn hình"
            >
              {isDecodingImage ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              ) : (
                <Upload className="w-4 h-4 text-[#003B95]" />
              )}
              <span>Tải ảnh QR vé</span>
            </button>
            <button
              type="button"
              onClick={() => lookupTicket(ticketInput)}
              disabled={loading || isDecodingImage}
              className="px-5 py-2.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white font-bold text-xs sm:text-sm shadow-sm transition disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Check-in</span>
            </button>
          </div>
        </div>

        {/* Offline & Network Resilience Banner (Khắc phục sự cố mất sóng tại sự kiện) */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
            !isOnline || forceOffline
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-white text-slate-700"
          } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                !isOnline || forceOffline
                  ? "bg-amber-200 text-amber-900 border border-amber-300"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {!isOnline || forceOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {!isOnline || forceOffline
                    ? "Chế độ Ngoại Tuyến (Offline - Mất Sóng)"
                    : "Chế độ Trực Tuyến (Online)"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    !isOnline || forceOffline
                      ? "bg-amber-500 text-white font-black"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {!isOnline || forceOffline ? "ĐANG BẢO VỆ CHECK-IN" : "KẾT NỐI SẴN SÀNG"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-blue-600" />
                  Đã tải về máy: <strong className="text-slate-800">{cachedTickets.length}</strong> vé
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <CloudUpload className="w-3 h-3 text-amber-600" />
                  Chờ đồng bộ: <strong className="text-amber-700">{offlineQueue.length}</strong> vé
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => downloadOfflineTickets()}
              disabled={isDownloadingOffline}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition disabled:opacity-50 cursor-pointer shadow-2xs"
              title="Tải toàn bộ danh sách vé của sự kiện về máy để check-in không cần internet"
            >
              <Download
                className={`w-3.5 h-3.5 text-blue-600 ${
                  isDownloadingOffline ? "animate-bounce" : ""
                }`}
              />
              <span>{isDownloadingOffline ? "Đang tải..." : "Tải trước Vé Offline"}</span>
            </button>

            {offlineQueue.length > 0 && (
              <button
                type="button"
                onClick={handleSyncOfflineQueue}
                disabled={isSyncingQueue}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50 animate-pulse cursor-pointer"
                title="Đẩy toàn bộ vé đã check-in ngoại tuyến lên hệ thống"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSyncingQueue ? "animate-spin" : ""}`} />
                <span>
                  {isSyncingQueue ? "Đang đồng bộ..." : `Đồng bộ lên Cloud (${offlineQueue.length})`}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setForceOffline(!forceOffline);
                toast.info(
                  !forceOffline
                    ? "Đã bật giả lập mất sóng (Chế độ Offline)"
                    : "Đã tắt giả lập mất sóng"
                );
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                forceOffline
                  ? "bg-amber-600 text-white border-amber-600 font-bold"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
              title="Bật/Tắt chế độ ngoại tuyến chủ động để kiểm thử"
            >
              {forceOffline ? "⚡ Đang test Offline" : "Test Offline"}
            </button>
          </div>
        </div>

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
              {currentTicket.isWalkInAfterGHour || currentTicket.registrationOrigin === "walkin_unannounced" || (currentTicket.note && currentTicket.note.includes("trước giờ G")) ? (
                <div className="rounded-2xl border-2 border-amber-500/80 bg-amber-950/40 p-4 sm:p-5 text-left flex items-start gap-3.5 shadow-lg shadow-amber-950/50">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-black">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-600 text-white shadow-xs uppercase tracking-wider">
                        KHÁCH KHÔNG NẰM TRONG DANH SÁCH ĐĂNG KÝ TRƯỚC GIỜ G
                      </span>
                      <span className="text-xs text-amber-300 font-bold">
                        (Sự kiện miễn phí: Tự động Check-in Pass)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Đại biểu đến tham dự trực tiếp chưa có trong danh sách đăng ký trước giờ G. Hệ thống tự động cấp quyền tham dự và Check-in thành công.
                    </p>
                  </div>
                </div>
              ) : currentTicket.isWalkIn || currentTicket.attendeeType === "WALK_IN_NEW" ? (
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
                {currentTicket.isCheckedIn && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400">Tiến Độ Điểm Danh:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        currentTicket.isLate
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {currentTicket.isLate ? "Đi muộn" : "Đúng giờ"}
                    </span>
                  </div>
                )}
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

        {/* MODAL ĐĂNG KÝ CHECK-IN KHÁCH MỚI TẠI CỬA (WALK-IN) - Chuẩn Theme Sáng (Yêu cầu 4) */}
        {walkinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 space-y-5 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Đăng Ký Check-in Khách Mới Tại Cửa
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Sự kiện: <strong className="text-blue-700">{selectedEventName}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWalkinModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tùy chọn xử lý phí sự kiện cho khách mới (Yêu cầu 4) */}
              {!selectedEventIsFree && (
                <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 space-y-2">
                  <div className="text-xs font-bold text-amber-950 flex items-center justify-between">
                    <span>Phí sự kiện: {new Intl.NumberFormat("vi-VN").format(selectedEventFee)} VNĐ / đại biểu</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      Có phí
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <label className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition ${
                      walkinPaymentMethod === 'cash_instant' ? 'bg-white border-blue-500 ring-1 ring-blue-400 shadow-2xs' : 'bg-white/60 border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="walkinPayment"
                        checked={walkinPaymentMethod === 'cash_instant'}
                        onChange={() => setWalkinPaymentMethod('cash_instant')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">1. Thu tiền tại quầy</div>
                        <div className="text-[10px] text-slate-500">Nộp tiền mặt/chuyển khoản tại quầy &amp; Check-in luôn</div>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition ${
                      walkinPaymentMethod === 'email_invoice' ? 'bg-white border-amber-500 ring-1 ring-amber-400 shadow-2xs' : 'bg-white/60 border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="walkinPayment"
                        checked={walkinPaymentMethod === 'email_invoice'}
                        onChange={() => setWalkinPaymentMethod('email_invoice')}
                        className="mt-0.5 text-amber-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">2. Gửi mail thông báo phí</div>
                        <div className="text-[10px] text-slate-500">Gửi mail kèm VietQR, tự động check-in khi nhận thanh toán</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <form onSubmit={handleWalkinSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Họ và tên khách mời *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={walkinForm.fullName}
                    onChange={(e) => setWalkinForm({ ...walkinForm, fullName: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0983..."
                      value={walkinForm.phone}
                      onChange={(e) => setWalkinForm({ ...walkinForm, phone: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="email@congty.com"
                      value={walkinForm.email}
                      onChange={(e) => setWalkinForm({ ...walkinForm, email: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Doanh nghiệp / Công ty
                    </label>
                    <input
                      type="text"
                      placeholder="Tập đoàn..."
                      value={walkinForm.company}
                      onChange={(e) => setWalkinForm({ ...walkinForm, company: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Chức danh / Chức vụ
                    </label>
                    <input
                      type="text"
                      placeholder="Giám đốc..."
                      value={walkinForm.position}
                      onChange={(e) => setWalkinForm({ ...walkinForm, position: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Chọn phần tham gia sự kiện */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Tham gia phần nào của sự kiện?
                  </label>
                  <div className="space-y-1.5">
                    {["Tọa đàm / Hội nghị Chuyên Đề", "Tiệc Gala Dinner & Kết Nối"].map((part) => {
                      const isChecked = walkinForm.selectedParts.includes(part);
                      return (
                        <label
                          key={part}
                          className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs text-slate-800 transition"
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
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>{part}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Nút thêm người đi cùng (+) */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">
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
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 cursor-pointer transition"
                    >
                      + Thêm người đi cùng
                    </button>
                  </div>

                  {additionalWalkins.map((w, idx) => (
                    <div key={w.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>Đại biểu #{idx + 2}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAdditionalWalkins((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-rose-600 hover:underline font-semibold"
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
                          className="h-8 px-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
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
                          className="h-8 px-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
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
                          className="h-8 px-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setWalkinModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submittingWalkin}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md disabled:opacity-50 transition cursor-pointer"
                  >
                    {submittingWalkin
                      ? "Đang xử lý..."
                      : (!selectedEventIsFree && walkinPaymentMethod === 'email_invoice')
                      ? "Gửi Mail Thông Báo Phí & Lưu Vé Chờ"
                      : "Xác Nhận & Check-in Ngay"}
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
