import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Coins,
  Crown,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  MapPin,
  QrCode,
  Search,
  Tag,
  Ticket,
  Trash2,
  Users,
  Utensils,
  ArrowLeftRight,
  X,
  XCircle,
  RefreshCw,
  Sparkles,
  LogIn,
  LogOut,
  UploadCloud,
  Eye,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, Pill, StatCard, TableShell } from "@/components/dashboard/PageKit";
import { useTableControls } from "@/hooks/use-table-controls";
import { fetchNestApi } from "@/lib/api-client";
import { getQrUrl } from "@/lib/qr";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import {
  addEventAttendeeFn,
  listEventsWithRegistrationsFn,
  recordWalkInCashPaymentFn,
  sendPaymentReminderFn,
  updateRegistrationSeatingFn,
  type EventItem,
  type Registration,
} from "@/lib/events.functions";
import { useFmt, useT } from "@/lib/i18n";
import { CinemaSeatingMap } from "@/components/dashboard/CinemaSeatingMap";
import { useRole } from "@/hooks/use-role";
import { EventReminderPosterModal } from "@/components/dashboard/EventReminderPosterModal";
import { EventPosterStudioModal } from "@/components/dashboard/EventPosterStudioModal";
import { VnpayPaymentModal } from "@/components/common/VnpayPaymentModal";
import { EventAttendeesImportModal } from "@/components/events/EventAttendeesImportModal";
import { EventRegistrationsExportModal } from "@/components/events/EventRegistrationsExportModal";
import { DynamicImportWizardModal } from "@/components/dynamic-import/DynamicImportWizardModal";
import { DynamicDetailViewModal } from "@/components/dynamic-form/DynamicDetailViewModal";
import { TableActionsGroup } from "@/components/common";

export const Route = createFileRoute("/event-registrations")({
  ssr: false,
  loader: async () => {
    try {
      const data = await listEventsWithRegistrationsFn();
      return (
        data || {
          events: [],
          registrations: [],
        }
      );
    } catch (err) {
      console.warn("[event-registrations] listEventsWithRegistrationsFn loader error:", err);
      return {
        events: [],
        registrations: [],
      };
    }
  },
  component: RegPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error?.message || "Đã xảy ra lỗi khi tải danh sách đăng ký sự kiện."}
    </div>
  ),
});

function RegPage() {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const { isBTT, isBQT, isAdmin, isPlatformAdmin } = useRole();
  const canSwapSeats = isBTT || isBQT || isAdmin || isPlatformAdmin;

  const loaderData = Route.useLoaderData() as {
    events: EventItem[];
    registrations: Registration[];
  };

  const [eventsList, setEventsList] = useState<EventItem[]>(loaderData?.events || []);
  const [registrationsList, setRegistrationsList] = useState<Registration[]>(loaderData?.registrations || []);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Sync loaderData if router invalidates
  useEffect(() => {
    if (loaderData?.events?.length) setEventsList(loaderData.events);
    if (loaderData?.registrations?.length) setRegistrationsList(loaderData.registrations);
  }, [loaderData]);

  // Eager client-side fetch on initial visit to ensure registrations load immediately without manual reloads
  const fetchLiveRegistrations = async () => {
    try {
      setIsLoadingLive(true);
      const res = await fetchNestApi<any>("/events/with-registrations").catch(async () => {
        const [evs, rgs] = await Promise.all([
          fetchNestApi<any[]>("/events").catch(() => []),
          fetchNestApi<any[]>("/events/registrations").catch(() => []),
        ]);
        return { events: evs, registrations: rgs };
      });

      if (res) {
        if (Array.isArray(res.events) && res.events.length > 0) {
          setEventsList(res.events);
        }
        if (Array.isArray(res.registrations)) {
          setRegistrationsList(res.registrations);
        }
      }
    } catch (err) {
      console.warn("[event-registrations] Client-side eager load failed:", err);
    } finally {
      setIsLoadingLive(false);
    }
  };

  const fetchLiveRegistrationsForEvent = async (selectedEvtId: string) => {
    if (!selectedEvtId || selectedEvtId === "all") {
      return fetchLiveRegistrations();
    }
    try {
      setIsLoadingLive(true);
      const res = await fetchNestApi<any[]>(`/events/${selectedEvtId}/registrations`).catch(async () => {
        return fetchNestApi<any[]>(`/events/registrations?eventId=${selectedEvtId}`).catch(() => []);
      });
      if (Array.isArray(res)) {
        setRegistrationsList(res);
      }
    } catch (err) {
      console.warn("[event-registrations] Load registrations for event failed:", err);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveRegistrations();
  }, []);

  const EVENTS = eventsList;
  // Dữ liệu người hủy tham dự biến mất hoàn toàn khỏi CRM theo yêu cầu
  const REGISTRATIONS = useMemo(() => {
    return registrationsList.filter((r) => r.status !== "cancelled");
  }, [registrationsList]);

  const updateSeating = useServerFn(updateRegistrationSeatingFn);
  const recordCash = useServerFn(recordWalkInCashPaymentFn);
  const sendReminder = useServerFn(sendPaymentReminderFn);
  const addAttendee = useServerFn(addEventAttendeeFn);

  const [q, setQ] = useState("");
  const [eventId, setEventId] = useState("all");
  const [status, setStatus] = useState<Registration["status"] | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "pending">("all");

  useEffect(() => {
    if (eventId && eventId !== "all") {
      fetchNestApi<any>(`/events/${eventId}/dynamic-columns`)
        .then((res) => {
          const raw = Array.isArray(res) ? res : res?.dynamicColumns || [];
          setDynamicColumns(raw.map((c: any) => (typeof c === "string" ? c : c.columnName || "")));
        })
        .catch(() => setDynamicColumns([]));
    } else {
      setDynamicColumns([]);
    }
  }, [eventId]);

  const handleTogglePaymentStatus = async (regId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "paid" ? "unpaid" : "paid";
    try {
      await fetchNestApi(`/events/registrations/${regId}/payment-status`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus: nextStatus }),
      });
      setRegistrationsList((prev) =>
        prev.map((it) => (it.id === regId ? { ...it, paymentStatus: nextStatus } : it))
      );
      toast.success(
        nextStatus === "paid"
          ? "Đã chuyển sang ĐÃ THANH TOÁN & tự động hạch toán Quỹ tài chính CRM!"
          : "Đã chuyển sang trạng thái CHƯA THANH TOÁN!"
      );
    } catch (err: any) {
      toast.error("Không thể cập nhật trạng thái thanh toán: " + (err?.message || ""));
    }
  };

  // Excel-like resizable columns state & handler
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    stt: 56,
    code: 96,
    member: 220,
    event: 240,
    seat: 180,
    ticket: 120,
    payment: 190,
    checkin: 130,
    status: 110,
    origin: 210,
    actions: 360,
  });

  const handleMouseDownResize = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 150;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColWidths((prev) => ({ ...prev, [colKey]: newWidth }));
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Add Attendee / QR Checkin Modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [dynamicImportWizardOpen, setDynamicImportWizardOpen] = useState(false);
  const [detailRegRecord, setDetailRegRecord] = useState<Registration | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [dynamicColumns, setDynamicColumns] = useState<string[]>([]);
  const [selectedRegIds, setSelectedRegIds] = useState<Set<string>>(new Set());
  const [eventReminderModalOpen, setEventReminderModalOpen] = useState(false);
  const [vnpayModalOpen, setVnpayModalOpen] = useState(false);
  const [selectedVnpayReg, setSelectedVnpayReg] = useState<Registration | null>(null);

  // Tự động phát hiện và bổ sung cột động từ custom_data / dynamic_data của các bản ghi đã import
  useEffect(() => {
    const detectedCols = new Set<string>(dynamicColumns);
    let added = false;
    REGISTRATIONS.forEach((r: any) => {
      const customObj = r.dynamic_data || r.custom_data || r.customData;
      if (customObj && typeof customObj === "object") {
        Object.keys(customObj).forEach((k) => {
          if (k && !detectedCols.has(k)) {
            detectedCols.add(k);
            added = true;
          }
        });
      }
    });
    if (added) {
      setDynamicColumns(Array.from(detectedCols));
    }
  }, [REGISTRATIONS, dynamicColumns]);

  const handleBulkDelete = async () => {
    if (selectedRegIds.size === 0) return;
    if (!confirm(`Xác nhận xóa ${selectedRegIds.size} đại biểu đã chọn khỏi danh sách đăng ký sự kiện?`)) return;
    try {
      const ids = Array.from(selectedRegIds);
      for (const id of ids) {
        fetchNestApi(`/events/registrations/${id}`, { method: "DELETE" }).catch(() => {});
      }
      setRegistrationsList((prev) => prev.filter((r) => !selectedRegIds.has(r.id)));
      setSelectedRegIds(new Set());
      toast.success(`Đã xóa thành công ${ids.length} đại biểu đã chọn!`);
    } catch (err: any) {
      toast.error("Lỗi khi xóa đại biểu: " + (err?.message || ""));
    }
  };

  // Seating Modal state
  const [seatingModalOpen, setSeatingModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [seatInput, setSeatInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Map of occupied seats for Cinema seating visual chart
  const occupiedSeatsMap = useMemo(() => {
    const map: Record<
      string,
      {
        registrationId?: string;
        attendeeName: string;
        attendeeCode?: string;
        company?: string;
        ticketType?: string;
        status?: string;
        phone?: string;
        title?: string;
      }
    > = {};
    REGISTRATIONS.forEach((r) => {
      if (r.seatAssignment && r.status !== "cancelled" && r.id !== selectedReg?.id) {
        const info = {
          registrationId: r.id,
          attendeeName: r.memberName,
          attendeeCode: r.memberCode,
          company: r.company || "",
          ticketType: r.ticketType || "VIP",
          status: r.status || "confirmed",
          phone: r.phone || "",
          title: r.title || (r as any).position || "Học viên VIP",
        };
        map[r.seatAssignment] = info;
        const match = r.seatAssignment.match(/[A-Z]+-\d{2}|T\d+-\d{2}|SK-\d{2}/i);
        if (match) {
          map[match[0].toUpperCase()] = info;
        }
      }
    });
    return map;
  }, [REGISTRATIONS, selectedReg]);

  // QR Modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrReg, setQrReg] = useState<Registration | null>(null);

  // Google Form Survey Modal state
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [selectedSurveyReg, setSelectedSurveyReg] = useState<any | null>(null);

  const handleOpenFormSurvey = (r: any) => {
    setSelectedSurveyReg(r);
    setSurveyModalOpen(true);
  };

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return REGISTRATIONS.filter((r) => (eventId === "all" ? true : r.eventId === eventId))
      .filter((r) => (status === "all" ? true : r.status === status))
      .filter((r) => {
        if (paymentFilter === "all") return true;
        return (r.paymentStatus || "pending") === paymentFilter;
      })
      .filter(
        (r) =>
          !ql ||
          r.memberName.toLowerCase().includes(ql) ||
          r.memberCode.toLowerCase().includes(ql) ||
          r.email.toLowerCase().includes(ql) ||
          (r.seatAssignment && r.seatAssignment.toLowerCase().includes(ql)),
      );
  }, [q, eventId, status, paymentFilter, REGISTRATIONS]);

  const tc = useTableControls<Registration>(
    filtered,
    {
      code: (r) => r.id,
      member: (r) => r.memberName,
      ticket: (r) => r.ticketType,
      regDate: (r) => r.registeredAt,
      status: (r) => r.status,
    },
    { initialSortKey: "regDate", initialSortDir: "desc", initialPageSize: 20 },
  );

  const confirmed = REGISTRATIONS.filter((r) => r.status === "confirmed").length;
  const paidCount = REGISTRATIONS.filter((r) => r.paymentStatus === "paid").length;
  const pendingCount = REGISTRATIONS.filter((r) => r.paymentStatus !== "paid").length;
  const seatedCount = REGISTRATIONS.filter((r) => !!r.seatAssignment).length;

  const handleOpenSeating = (r: Registration) => {
    setSelectedReg(r);
    setSeatInput(r.seatAssignment || "Bàn VIP 01 - Ghế 01");
    setSeatingModalOpen(true);
  };

  const handleMoveSeat = async (fromSeat: string, toSeat: string, occupant: any) => {
    const targetReg = REGISTRATIONS.find(
      (r) =>
        (occupant?.registrationId && r.id === occupant.registrationId) ||
        (fromSeat && r.seatAssignment === fromSeat) ||
        (occupant?.attendeeName && r.memberName === occupant.attendeeName),
    );
    if (!targetReg) {
      toast.error("Không tìm thấy thông tin đại biểu cần chuyển ghế");
      return;
    }

    const destReg = REGISTRATIONS.find(
      (r) => r.id !== targetReg.id && r.seatAssignment === toSeat && r.status !== "cancelled"
    );

    try {
      // 1. Gửi trực tiếp API với token của phiên đăng nhập hiện tại
      await fetchNestApi(`/events/registrations/${encodeURIComponent(targetReg.id)}/seating`, {
        method: "PUT",
        body: JSON.stringify({ seatAssignment: toSeat }),
      }).catch(async () => {
        return updateSeating({
          data: {
            registrationId: targetReg.id,
            seatAssignment: toSeat,
          },
        });
      });

      if (destReg) {
        await fetchNestApi(`/events/registrations/${encodeURIComponent(destReg.id)}/seating`, {
          method: "PUT",
          body: JSON.stringify({ seatAssignment: fromSeat }),
        }).catch(async () => {
          return updateSeating({
            data: {
              registrationId: destReg.id,
              seatAssignment: fromSeat,
            },
          });
        });
      }

      setRegistrationsList((prev) =>
        prev.map((r) => {
          if (r.id === targetReg.id) return { ...r, seatAssignment: toSeat };
          if (destReg && r.id === destReg.id) return { ...r, seatAssignment: fromSeat };
          return r;
        }),
      );

      if (selectedReg) {
        if (selectedReg.id === targetReg.id) {
          setSelectedReg((prev) => (prev ? { ...prev, seatAssignment: toSeat } : null));
          setSeatInput(toSeat);
        } else if (destReg && selectedReg.id === destReg.id) {
          setSelectedReg((prev) => (prev ? { ...prev, seatAssignment: fromSeat } : null));
          setSeatInput(fromSeat);
        }
      }

      if (destReg) {
        toast.success(
          `Đã hoán đổi chỗ ngồi: ${targetReg.memberName} (${toSeat}) ⇆ ${destReg.memberName} (${fromSeat})`
        );
      } else {
        toast.success(`Đã chuyển đại biểu ${targetReg.memberName} sang ${toSeat}`);
      }
      await router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi chuyển chỗ ngồi");
    }
  };

  const handleUnassignSeat = async () => {
    if (!selectedReg) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn gỡ vị trí chỗ ngồi "${selectedReg.seatAssignment}" của ${selectedReg.memberName} để xếp chỗ cho người khác?\nHệ thống sẽ tự động gửi thông báo điều chỉnh chỗ ngồi qua Email và Zalo OA cho đại biểu.`,
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      await fetchNestApi(`/events/registrations/${encodeURIComponent(selectedReg.id)}/seating`, {
        method: "PUT",
        body: JSON.stringify({ seatAssignment: "" }),
      }).catch(async () => {
        return updateSeating({
          data: {
            registrationId: selectedReg.id,
            seatAssignment: "",
          },
        });
      });

      setRegistrationsList((prev) =>
        prev.map((r) => (r.id === selectedReg.id ? { ...r, seatAssignment: "" } : r)),
      );
      setSeatInput("");
      toast.success(`Đã gỡ chỗ ngồi của ${selectedReg.memberName} và gửi thông báo qua Email & Zalo OA thành công!`);
      setSeatingModalOpen(false);
      await router.invalidate();
    } catch {
      toast.error("Lỗi khi gỡ vị trí chỗ ngồi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSeating = async () => {
    if (!selectedReg || !seatInput.trim()) {
      setSeatingModalOpen(false);
      return;
    }
    setSubmitting(true);
    const assignedSeat = seatInput.trim();
    try {
      // 1. Direct fetch to Nest API with token
      await fetchNestApi(`/events/registrations/${encodeURIComponent(selectedReg.id)}/seating`, {
        method: "PUT",
        body: JSON.stringify({ seatAssignment: assignedSeat }),
      }).catch(async (clientErr) => {
        console.warn("Direct fetch failed, falling back to serverFn:", clientErr);
        return updateSeating({
          data: {
            registrationId: selectedReg.id,
            seatAssignment: assignedSeat,
          },
        });
      });

      // 2. Cập nhật state ngay lập tức để bảng và sơ đồ rạp hiển thị chỗ ngồi mới
      setRegistrationsList((prev) =>
        prev.map((r) => (r.id === selectedReg.id ? { ...r, seatAssignment: assignedSeat } : r)),
      );
      toast.success(`Đã xếp chỗ cho ${selectedReg.memberName}: ${assignedSeat}`);
      setSeatingModalOpen(false);
      await router.invalidate();
    } catch {
      toast.error("Lỗi khi lưu vị trí chỗ ngồi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWalkInCashPayment = async (r: Registration) => {
    if (
      !window.confirm(
        `Xác nhận thu tiền mặt tại chỗ cho khách: ${r.memberName}?\nSố tiền: ${fmt.money(
          r.paymentAmount || 500000,
        )}\nHệ thống sẽ tự động hạch toán vào Quản lý thu - Tiền mặt.`,
      )
    ) {
      return;
    }

    try {
      await recordCash({
        data: {
          registrationId: r.id,
          amount: r.paymentAmount || 500000,
        },
      });
      toast.success(`Đã thu tiền mặt thành công! Đã cập nhật Quản lý thu.`);
      await router.invalidate();
    } catch {
      toast.error("Lỗi khi xử lý thu tiền mặt");
    }
  };

  const handleConfirmBankPayment = async (r: Registration) => {
    if (
      !window.confirm(
        `Xác nhận Học viên "${r.memberName}" ĐÃ THANH TOÁN phí tham dự sự kiện?\n` +
        `Số tiền: ${fmt.money(r.paymentAmount || 0)}\n\n` +
        `Sau khi xác nhận:\n` +
        `1. Hệ thống sẽ kích hoạt vé chính thức (Trạng thái: Đã thanh toán).\n` +
        `2. Tự động sinh mã QR Check-in và gửi email Vé Điện Tử (E-Ticket) tới "${r.email}".`
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const res: any = await fetchNestApi(`/events/registrations/${r.id}/confirm-payment`, {
        method: "POST",
        body: JSON.stringify({ method: "bank_transfer" }),
      });
      setRegistrationsList((prev) =>
        prev.map((item) =>
          item.id === r.id ? { ...item, paymentStatus: "paid", status: "confirmed" } : item,
        ),
      );
      toast.success(
        res?.message || `Đã xác nhận thanh toán và gửi vé QR check-in về email ${r.email}!`,
      );
      await router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi xác nhận thanh toán");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReconcilePayment = async (r: Registration) => {
    setSubmitting(true);
    try {
      const res: any = await fetchNestApi(`/events/registrations/${r.id}/reconcile-payment`, {
        method: "POST",
      });
      if (res?.matched) {
        setRegistrationsList((prev) =>
          prev.map((item) =>
            item.id === r.id ? { ...item, paymentStatus: "paid", status: "confirmed" } : item,
          ),
        );
        toast.success(`Dòng tiền khớp! Đã tự động kích hoạt vé và gửi vé QR về email ${r.email}.`);
        await router.invalidate();
      } else {
        toast.info(res?.message || `Chưa phát hiện giao dịch khớp với hóa đơn EV${r.id}. Bạn có thể bấm xác nhận thủ công.`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi kiểm tra đối soát dòng tiền");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReminder = async (r: Registration) => {
    try {
      const res: any = await sendReminder({
        data: { registrationId: r.id },
      });
      toast.success(res.message || "Đã gửi thông báo nhắc nhở");
      await router.invalidate();
    } catch {
      toast.error("Lỗi khi gửi thông báo nhắc nhở");
    }
  };

  const handleDeleteRegistration = async (r: Registration) => {
    if (
      !window.confirm(
        `Xác nhận xóa người đăng ký tham dự:\n"${r.memberName}" (Mã: ${r.memberCode || r.id})?\nThao tác này sẽ hủy chỗ ngồi và xóa hoàn toàn thông tin đại biểu khỏi sự kiện!`,
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      await fetchNestApi(`/events/registrations/${r.id}`, { method: "DELETE" }).catch(async () => {
        // Fallback to cancel registration endpoint
        await fetchNestApi(`/events/${r.eventId}/cancel`, {
          method: "POST",
          body: JSON.stringify({ reason: "Ban Tổ Chức xóa đăng ký đại biểu" }),
        });
      });
      toast.success(`Đã xóa đăng ký tham dự của ${r.memberName}`);
      await router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi xóa đăng ký sự kiện");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenQr = (r: Registration) => {
    setQrReg(r);
    setQrModalOpen(true);
  };

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      return `${hh}:${mm} - ${dd}/${mo}`;
    } catch {
      return iso;
    }
  };

  const handleQuickCheckin = async (r: Registration) => {
    try {
      await fetchNestApi("/events/ticket-checkin", {
        method: "POST",
        body: { ticketCode: r.id, method: "crm_operator" },
      });
      toast.success(`Đã xác nhận Check-in cho đại biểu: ${r.memberName}`);
      void fetchLiveRegistrations();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi thực hiện check-in");
    }
  };

  const handleQuickCheckout = async (r: Registration) => {
    try {
      await fetchNestApi("/events/ticket-checkout", {
        method: "POST",
        body: { ticketCode: r.id },
      });
      toast.success(`Đã xác nhận Check-out cho đại biểu: ${r.memberName}`);
      void fetchLiveRegistrations();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi thực hiện check-out");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Quản Lý Đăng Ký & Xếp Chỗ Sự Kiện"
        subtitle="Quản lý danh sách tham dự, sơ đồ chỗ ngồi và theo dõi thanh toán sự kiện"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDynamicImportWizardOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              title="Import danh sách đăng ký sự kiện từ Excel, CSV, Word, PDF và tự động sinh cột theo các trường trong file"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Import File</span>
            </button>
            <button
              onClick={() => setEventReminderModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            >
              <span>Gửi Thông Báo Sự Kiện</span>
            </button>
            <button
              onClick={() => {
                setSelectedReg(null);
                setSeatInput("");
                setSeatingModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer"
            >
              <span>Sơ Đồ Chỗ Ngồi</span>
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer shadow-2xs"
              title="Xuất báo cáo theo danh mục (Check-in, đi muộn, chưa đến...) đủ 3 định dạng: Excel, CSV, PDF"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Xuất Báo Cáo</span>
            </button>
          </div>
        }
      />

      {/* ── 4 THẺ CHỈ SỐ CHUẨN MÀU: XANH NAVY - ĐEN - VÀNG - XANH LÁ ── */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số người đăng ký (Xanh Navy) */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#003B95] dark:text-blue-400 text-xs font-bold uppercase tracking-wider">TỔNG ĐĂNG KÝ</span>
            <span className="size-2 rounded-full bg-[#003B95]" />
          </div>
          <div className="text-slate-900 dark:text-slate-100 text-2xl font-black">
            {REGISTRATIONS.length}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs">
            Học viên &amp; khách mời tham dự
          </div>
        </div>

        {/* Card 2: Đã xếp chỗ ngồi (Đen / Slate) */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">ĐÃ XẾP CHỖ NGỒI</span>
            <span className="size-2 rounded-full bg-slate-500" />
          </div>
          <div className="text-slate-900 dark:text-slate-100 text-2xl font-black">
            {seatedCount}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs">
            Đã gắn số bàn &amp; vị trí ghế
          </div>
        </div>

        {/* Card 3: Chờ thanh toán (Vàng hổ phách) */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">CHỜ THANH TOÁN</span>
            <span className="size-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-slate-900 dark:text-slate-100 text-2xl font-black">
            {pendingCount}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs">
            Chờ xác nhận phí tham dự
          </div>
        </div>

        {/* Card 4: Đã thanh toán phí (Xanh lá) */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">ĐÃ THANH TOÁN PHÍ</span>
            <span className="size-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-slate-900 dark:text-slate-100 text-2xl font-black">
            {paidCount}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs">
            Vé hợp lệ và sẵn sàng check-in
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên, mã Học viên, email, số bàn ghế..."
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm shadow-[var(--shadow-card)] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <select
          value={eventId}
          onChange={(e) => {
            const nextEvtId = e.target.value;
            setEventId(nextEvtId);
            fetchLiveRegistrationsForEvent(nextEvtId);
          }}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-[var(--shadow-card)]"
        >
          <option value="all">{t("reg.allEvents")}</option>
          {EVENTS.map((e: any) => (
            <option key={e.id} value={e.id}>
              {e.name || e.title}
            </option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as "all" | "paid" | "pending")}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-[var(--shadow-card)]"
        >
          <option value="all">Tất cả thanh toán</option>
          <option value="paid">Đã thanh toán (Paid)</option>
          <option value="pending">Chờ thanh toán (Pending)</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Registration["status"] | "all")}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-[var(--shadow-card)]"
        >
          <option value="all">{t("common.allStatuses")}</option>
          <option value="confirmed">{t("reg.status.confirmed")}</option>
          <option value="waitlist">{t("reg.status.waitlist")}</option>
        </select>
      </div>

      {/* Bulk Delete Toolbar */}
      {selectedRegIds.size > 0 && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-900 dark:text-rose-200">
            <CheckCircle2 className="h-4 w-4 text-rose-600" />
            <span>Đã chọn {selectedRegIds.size} đại biểu trong danh sách</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedRegIds(new Set())}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa {selectedRegIds.size} dòng đã chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[1550px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                <th className="sticky left-0 z-30 bg-secondary px-2.5 py-3 text-center border-b border-border w-10">
                  <input
                    type="checkbox"
                    checked={tc.pageRows.length > 0 && tc.pageRows.every((r: any) => selectedRegIds.has(r.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRegIds(new Set(tc.pageRows.map((r: any) => r.id)));
                      } else {
                        setSelectedRegIds(new Set());
                      }
                    }}
                    className="rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                    title="Chọn tất cả các dòng trên trang này"
                  />
                </th>
                <th
                  style={{ width: colWidths.stt, minWidth: colWidths.stt, maxWidth: colWidths.stt, left: 40 }}
                  className="sticky z-20 bg-secondary px-3 py-3 text-center text-xs font-bold border-b border-border whitespace-nowrap relative group/th"
                >
                  STT
                  <div
                    onMouseDown={(e) => handleMouseDownResize("stt", e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary z-30 transition-colors"
                    title="Kéo sang trái/phải để co dãn cột"
                  />
                </th>
                <th
                  style={{ width: colWidths.code, minWidth: colWidths.code, maxWidth: colWidths.code, left: 40 + colWidths.stt }}
                  className="sticky z-20 bg-secondary px-4 py-3 text-xs font-bold border-b border-border whitespace-nowrap relative group/th"
                >
                  Mã ĐK
                  <div
                    onMouseDown={(e) => handleMouseDownResize("code", e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary z-30 transition-colors"
                    title="Kéo sang trái/phải để co dãn cột"
                  />
                </th>
                <th
                  style={{ width: colWidths.member, minWidth: colWidths.member }}
                  className="px-4 py-3 border-b border-border whitespace-nowrap relative group/th"
                >
                  Người tham gia
                  <div
                    onMouseDown={(e) => handleMouseDownResize("member", e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary z-30 transition-colors"
                    title="Kéo sang trái/phải để co dãn cột"
                  />
                </th>
                <th
                  style={{ width: colWidths.event, minWidth: colWidths.event }}
                  className="px-4 py-3 border-b border-border whitespace-nowrap relative group/th text-primary"
                >
                  Sự kiện đăng ký
                  <div
                    onMouseDown={(e) => handleMouseDownResize("event", e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary z-30 transition-colors"
                    title="Kéo sang trái/phải để co dãn cột"
                  />
                </th>
                <th
                  style={{ width: colWidths.seat, minWidth: colWidths.seat }}
                  className="px-4 py-3 border-b border-border whitespace-nowrap relative group/th"
                >
                  Chỗ ngồi / Bàn VIP
                  <div
                    onMouseDown={(e) => handleMouseDownResize("seat", e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary z-30 transition-colors"
                    title="Kéo sang trái/phải để co dãn cột"
                  />
                </th>
                <th
                  style={{ width: colWidths.ticket, minWidth: colWidths.ticket }}
                  className="px-4 py-3 border-b border-border whitespace-nowrap relative group/th"
                >
                  Hạng vé
                  <div
                    onMouseDown={(e) => handleMouseDownResize("ticket", e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary z-30 transition-colors"
                    title="Kéo sang trái/phải để co dãn cột"
                  />
                </th>
                <th
                  style={{ width: colWidths.payment, minWidth: colWidths.payment }}
                  className="px-4 py-3 border-b border-border whitespace-nowrap relative group/th"
                >
                  Thanh toán & Phí
                  <div
                    onMouseDown={(e) => handleMouseDownResize("payment", e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary z-30 transition-colors"
                    title="Kéo sang trái/phải để co dãn cột"
                  />
                </th>
                <th
                  style={{ width: colWidths.checkin, minWidth: colWidths.checkin }}
                  className="px-4 py-3 border-b border-border whitespace-nowrap relative group/th"
                >
                  Check-in
                  <div
                    onMouseDown={(e) => handleMouseDownResize("checkin", e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary z-30 transition-colors"
                    title="Kéo sang trái/phải để co dãn cột"
                  />
                </th>
                <th
                  style={{ width: colWidths.status, minWidth: colWidths.status }}
                  className="px-4 py-3 border-b border-border whitespace-nowrap relative group/th"
                >
                  Trạng thái
                  <div
                    onMouseDown={(e) => handleMouseDownResize("status", e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary z-30 transition-colors"
                    title="Kéo sang trái/phải để co dãn cột"
                  />
                </th>
                <th
                  style={{ width: colWidths.origin, minWidth: colWidths.origin }}
                  className="px-4 py-3 border-b border-border whitespace-nowrap relative group/th"
                >
                  Phân loại trước giờ G
                  <div
                    onMouseDown={(e) => handleMouseDownResize("origin", e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary z-30 transition-colors"
                    title="Kéo sang trái/phải để co dãn cột"
                  />
                </th>
                {dynamicColumns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 border-b border-border whitespace-nowrap text-xs font-bold text-primary capitalize bg-primary/5"
                    title={`Cột dữ liệu tự động thêm từ file: ${col}`}
                  >
                    {col}
                  </th>
                ))}
                <th
                  style={{ width: colWidths.actions, minWidth: colWidths.actions }}
                  className="sticky right-0 z-20 bg-secondary px-4 py-3 text-center text-xs font-bold border-b border-border shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.12)] whitespace-nowrap relative group/th"
                >
                  THAO TÁC
                  <div
                    onMouseDown={(e) => handleMouseDownResize("actions", e)}
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary z-30 transition-colors"
                    title="Kéo sang trái/phải để co dãn cột"
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tc.pageRows.map((r: any, idx: number) => {
                const isPaid = r.paymentStatus === "paid";
                const isCancelled = r.status === "cancelled";
                const reminderCount = Number(r.reminderCount || 0);

                const matchedEvt = EVENTS.find((e: any) => String(e.id) === String(r.eventId));
                const evName = r.eventName || matchedEvt?.name || `Sự kiện #${r.eventId}`;
                const evDate = r.eventDate || matchedEvt?.date;
                const evLocation = r.eventLocation || matchedEvt?.location;
                const isMember = Boolean(r.memberCode && r.memberCode.trim().length > 0);

                return (
                  <tr key={r.id} className="group border-b border-border/50 transition hover:bg-secondary/40">
                    <td className="sticky left-0 z-20 bg-card px-2.5 py-3 text-center border-b border-border/50 group-hover:bg-muted w-10">
                      <input
                        type="checkbox"
                        checked={selectedRegIds.has(r.id)}
                        onChange={() => {
                          setSelectedRegIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(r.id)) next.delete(r.id);
                            else next.add(r.id);
                            return next;
                          });
                        }}
                        className="rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                      />
                    </td>
                    <td
                      style={{ width: colWidths.stt, minWidth: colWidths.stt, maxWidth: colWidths.stt, left: 40 }}
                      className="sticky z-10 bg-card px-3 py-3 text-center font-mono text-xs font-semibold text-muted-foreground group-hover:bg-muted border-b border-border/50 whitespace-nowrap"
                    >
                      {(tc.page - 1) * tc.pageSize + idx + 1}
                    </td>
                    <td
                      style={{ width: colWidths.code, minWidth: colWidths.code, maxWidth: colWidths.code, left: 40 + colWidths.stt }}
                      className="sticky z-10 bg-card px-4 py-3 font-mono text-[12px] font-bold text-primary group-hover:bg-muted border-b border-border/50 whitespace-nowrap"
                    >
                      {r.id}
                    </td>
                    <td
                      style={{ width: colWidths.member, minWidth: colWidths.member }}
                      className="px-4 py-3 border-b border-border/50"
                    >
                      <div className="font-semibold text-foreground text-xs">
                        {r.memberName}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {r.email} {r.memberCode ? `· ${r.memberCode}` : ""}
                      </div>
                    </td>

                    {/* Cột Sự kiện đăng ký (Có Call API & Join) */}
                    <td
                      style={{ width: colWidths.event, minWidth: colWidths.event }}
                      className="px-4 py-3 border-b border-border/50"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-xs text-foreground line-clamp-2" title={evName}>
                          {evName}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          {evDate && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                              {evDate}
                            </span>
                          )}
                          {evLocation && (
                            <span className="inline-flex items-center gap-1 truncate max-w-[130px]">
                              <MapPin className="h-3 w-3 text-primary shrink-0" />
                              {evLocation}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Chỗ ngồi / Bàn VIP */}
                    <td
                      style={{ width: colWidths.seat, minWidth: colWidths.seat }}
                      className="px-4 py-3 border-b border-border/50"
                    >
                      {r.seatAssignment ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                          <MapPin className="h-3.5 w-3.5" />
                          {r.seatAssignment}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Chưa xếp chỗ</span>
                      )}
                      {canSwapSeats ? (
                        <button
                          type="button"
                          onClick={() => handleOpenSeating(r)}
                          className="ml-2 text-[11px] text-primary underline hover:opacity-80 cursor-pointer font-semibold"
                          title="Ban Truyền thông / BQT / Admin: Nhấn để xếp hoặc đổi chỗ ngồi"
                        >
                          {r.seatAssignment ? "Đổi" : "Xếp"}
                        </button>
                      ) : (
                        <span
                          className="ml-2 text-[10px] text-muted-foreground italic"
                          title="Chỉ Ban Truyền Thông, Ban Quản Trị và Admin mới được xếp hoặc đổi chỗ"
                        >
                          (Cố định)
                        </span>
                      )}
                    </td>

                    <td
                      style={{ width: colWidths.ticket, minWidth: colWidths.ticket }}
                      className="px-4 py-3 border-b border-border/50 whitespace-nowrap"
                    >
                      {(() => {
                        const tt = String(r.ticketType || "VIP Pass");
                        const count = Number((r as any).ticketCount || 1);
                        const isDeclined = r.status === "declined" || tt.toLowerCase().includes("từ chối");
                        const isSinglePart = tt.startsWith("Chỉ dự:");
                        const isFull = tt.startsWith("Tham dự toàn bộ");
                        const badgeCls = isDeclined
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                          : isSinglePart
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                            : isFull
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-secondary text-foreground";
                        return (
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${badgeCls}`}>
                              <Tag className="h-3 w-3 shrink-0" />
                              <span>{tt}</span>
                            </span>
                            {!isDeclined && count > 1 && (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                Đoàn {count} người
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Thanh toán & Phí (Inline Toggle) */}
                    <td
                      style={{ width: colWidths.payment, minWidth: colWidths.payment }}
                      className="px-4 py-3 border-b border-border/50 whitespace-nowrap"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePaymentStatus(r.id, r.paymentStatus)}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold cursor-pointer transition hover:opacity-80 active:scale-95 ${isPaid
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                              }`}
                            title="Click để chuyển đổi trực tiếp trạng thái thanh toán trên hàng này"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{isPaid ? "Đã nộp" : "Chờ thanh toán"}</span>
                            <span className="text-[9px] opacity-70 underline ml-0.5">(Đổi)</span>
                          </button>
                          <span className="text-xs font-semibold text-foreground">
                            {fmt.money(r.paymentAmount || 500000)}
                          </span>
                        </div>
                        {!isPaid && !isCancelled && (
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            Nhắc: {reminderCount}/3 lần {reminderCount >= 2 && <span className="text-rose-600 font-bold">(Sắp hủy)</span>}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Checkin / Checkout status */}
                    <td
                      style={{ width: colWidths.checkin, minWidth: colWidths.checkin }}
                      className="px-4 py-3 border-b border-border/50 whitespace-nowrap"
                    >
                      {r.checkedOutAt ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                            <LogOut className="h-3.5 w-3.5" />
                            Đã check-out
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatTimestamp(r.checkedOutAt)}
                          </span>
                        </div>
                      ) : r.checkedInAt ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Đã check-in
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatTimestamp(r.checkedInAt)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Chưa đến</span>
                      )}
                    </td>

                    <td
                      style={{ width: colWidths.status, minWidth: colWidths.status }}
                      className="px-4 py-3 border-b border-border/50 whitespace-nowrap"
                    >
                      <Pill color={isPaid ? "success" : isCancelled ? "danger" : "warning"}>
                        {isCancelled ? "Đã hủy" : isPaid ? "Hợp lệ" : "Chờ phí"}
                      </Pill>
                    </td>

                    {/* Cột Phân loại trước giờ G */}
                    <td
                      style={{ width: colWidths.origin, minWidth: colWidths.origin }}
                      className="px-4 py-3 border-b border-border/50 whitespace-nowrap"
                    >
                      {r.isWalkIn || r.registrationOrigin === "walkin_unannounced" || r.registrationOrigin === "walkin_at_door" || (r.note && r.note.includes("trước giờ G")) ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>Không trong DS trước giờ G</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Đăng ký trước giờ G</span>
                        </span>
                      )}
                    </td>

                    {/* Cột Dữ Liệu Tự Động Thêm Từ File Import */}
                    {dynamicColumns.map((col) => {
                      const val =
                        r.dynamic_data?.[col] ??
                        (r as any).custom_data?.[col] ??
                        (r as any).customData?.[col] ??
                        (r as any)[col] ??
                        "—";
                      return (
                        <td key={col} className="px-4 py-3 border-b border-border/50 text-xs text-foreground whitespace-nowrap font-medium">
                          {String(val)}
                        </td>
                      );
                    })}

                    {/* Action Buttons - Đồng nhất bộ Icon căn giữa toàn hệ thống */}
                    <td
                      style={{ width: colWidths.actions, minWidth: colWidths.actions }}
                      className="sticky right-0 z-10 bg-card px-3 py-2.5 group-hover:bg-card border-b border-border/50 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.12)] whitespace-nowrap text-center"
                    >
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {/* Xem chi tiết đại biểu & trường động */}
                        <button
                          type="button"
                          onClick={() => setDetailRegRecord(r)}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-border bg-card text-primary hover:bg-primary/10 cursor-pointer transition-colors"
                          title="Xem chi tiết đại biểu"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Thao tác Check-in nhanh cho BTC */}
                        {!r.checkedInAt && (
                          <button
                            onClick={() => handleQuickCheckin(r)}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 cursor-pointer transition-colors"
                            title="Xác nhận Check-in có mặt"
                          >
                            <LogIn className="h-4 w-4" />
                          </button>
                        )}

                        {/* Thao tác Check-out nhanh cho BTC */}
                        {r.checkedInAt && !r.checkedOutAt && (
                          <button
                            onClick={() => handleQuickCheckout(r)}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 cursor-pointer transition-colors"
                            title="Xác nhận Check-out rời sự kiện"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        )}

                        {/* Xem QR checkin */}
                        <button
                          onClick={() => handleOpenQr(r)}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-border bg-card text-foreground hover:bg-secondary cursor-pointer transition-colors"
                          title="Xem mã QR Check-in"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>

                        {/* Chỉnh sửa / Xếp chỗ ngồi */}
                        <button
                          type="button"
                          onClick={() => handleOpenSeating(r)}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-border bg-card text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                          title="Chỉnh sửa / Xếp chỗ ngồi"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {/* Xác nhận đã thanh toán chuyển khoản và đẩy vé QR */}
                        {!isPaid && !isCancelled && (
                          <button
                            onClick={() => handleConfirmBankPayment(r)}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 cursor-pointer transition-colors"
                            title="Xác nhận đã thanh toán & gửi email vé QR"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Nhắc nhở nộp phí vé sự kiện qua Email & Zalo OA */}
                        {!isPaid && !isCancelled && (
                          <button
                            onClick={() => handleSendReminder(r)}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400 cursor-pointer transition-colors"
                            title="Gửi nhắc nộp phí sự kiện"
                          >
                            <Bell className="h-4 w-4" />
                          </button>
                        )}

                        {/* Xóa người đăng ký sự kiện */}
                        <button
                          onClick={() => handleDeleteRegistration(r)}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 cursor-pointer transition-colors"
                          title="Xóa người đăng ký tham dự"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tc.total === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Không tìm thấy đăng ký nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={tc.page}
          pageCount={tc.pageCount}
          pageSize={tc.pageSize}
          total={tc.total}
          from={tc.from}
          to={tc.to}
          onPage={tc.setPage}
          onPageSize={tc.setPageSize}
        />
      </div>

      {/* Seating Assignment Modal with Cinema-Style Graphical Map */}
      {seatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl my-auto max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <span>Sơ Đồ Xếp Chỗ & Điều Phối Sự Kiện (Hội Trường / Bàn Tiệc Gala)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedReg ? (
                    <>
                      Đang xếp chỗ cho: <strong className="text-foreground font-semibold">{selectedReg.memberName}</strong> ({selectedReg.memberCode}) · Vé: {selectedReg.ticketType || "VIP"}
                    </>
                  ) : (
                    "Kéo thả hoặc click chọn đại biểu để chuyển/đổi vị trí ngồi nhanh chóng trên sơ đồ."
                  )}
                </p>
              </div>
              <button
                onClick={() => setSeatingModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Interactive Seating Studio Map */}
            <div className="mb-4">
              <CinemaSeatingMap
                eventId={selectedReg?.eventId || (eventId !== "all" ? eventId : "default")}
                currentSeat={seatInput}
                occupiedSeats={occupiedSeatsMap}
                tickets={(() => {
                  const targetId = selectedReg?.eventId || (eventId !== "all" ? eventId : "");
                  const ev = eventsList.find((e: any) => String(e.id) === String(targetId));
                  return (ev as any)?.tickets || [];
                })()}
                onSelectSeat={(seatLabel) => setSeatInput(seatLabel)}
                onMoveSeat={handleMoveSeat}
              />
            </div>

            {/* Selected Seat Text & Quick Overrides */}
            {selectedReg && (
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-foreground">
                    Vị trí đã chọn cho {selectedReg.memberName} (Tự động hiển thị khi quét QR check-in):
                  </label>
                  <input
                    type="text"
                    value={seatInput}
                    onChange={(e) => setSeatInput(e.target.value)}
                    placeholder="Click vào ghế trên sơ đồ hoặc nhập trực tiếp..."
                    className="w-full sm:w-80 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Chọn nhanh theo hạng vé:</span>
                  {(() => {
                    const tkName = selectedReg?.ticketType || "VIP";
                    const isVip = tkName.toLowerCase().includes("vip");
                    const prefix = isVip ? "VIP" : "TC";
                    return [
                      `Ghế ${prefix}-01 (${tkName})`,
                      `Ghế ${prefix}-02 (${tkName})`,
                      `Ghế ${prefix}-03 (${tkName})`,
                      `Ghế ${prefix}-04 (${tkName})`,
                      `Hàng ${isVip ? "VIP A" : "Tiêu Chuẩn B"} - Ghế 01`,
                      `Bàn ${isVip ? "VIP 01" : "01"} - Ghế 1`,
                      "Khu Khách Mời Tự Do",
                    ];
                  })().map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSeatInput(preset)}
                      className="rounded-lg border border-border bg-secondary/70 px-2 py-0.5 text-[11px] font-medium text-foreground hover:border-primary hover:bg-secondary cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                {selectedReg && selectedReg.seatAssignment && (
                  <button
                    type="button"
                    onClick={handleUnassignSeat}
                    disabled={submitting}
                    className="w-full sm:w-auto rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-2 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                  >
                    Gỡ Chỗ Ngồi (Hủy Xếp Ghế Để Nhường)
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setSeatingModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                >
                  {selectedReg ? "Hủy" : "Đóng"}
                </button>
                {selectedReg && (
                  <button
                    onClick={handleSaveSeating}
                    disabled={submitting}
                    className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Đang lưu..." : "Xác Nhận Xếp Chỗ"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Preview Modal */}
      {qrModalOpen && qrReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Mã QR Check-In</span>
              <button
                onClick={() => setQrModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-primary/20 bg-white p-3 shadow-inner">
              <img
                src={getQrUrl(
                  qrReg.qrPayload || JSON.stringify({ id: qrReg.id, name: qrReg.memberName, seat: qrReg.seatAssignment }),
                  240
                )}
                alt="QR Checkin"
                className="h-full w-full object-contain"
              />
            </div>

            <h4 className="mt-4 text-base font-bold text-foreground">{qrReg.memberName}</h4>
            <p className="text-xs text-muted-foreground">{qrReg.id} · {qrReg.ticketType || "VIP Pass"}</p>

            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
              <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Vị trí chỗ ngồi đã xếp:</div>
              <div className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                {qrReg.seatAssignment || "Khu vực tự do"}
              </div>
            </div>

            <button
              onClick={() => setQrModalOpen(false)}
              className="mt-5 w-full rounded-xl border border-border bg-secondary py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Google Form Survey Response Details Modal */}
      {surveyModalOpen && selectedSurveyReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <FileText className="h-5 w-5" />
                <h3 className="text-base font-bold text-foreground">
                  Dữ Liệu Khảo Sát Google Form Của Đại Biểu
                </h3>
              </div>
              <button
                onClick={() => setSurveyModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3.5">
                <p className="text-sm font-bold text-foreground">{selectedSurveyReg.memberName}</p>
                <p className="text-muted-foreground mt-0.5">
                  Email: {selectedSurveyReg.email} · Mã: {selectedSurveyReg.id}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Doanh nghiệp: <strong>{selectedSurveyReg.company || "Công ty Học viên Hiệp Hội"}</strong>
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground">Nhu cầu kết nối giao thương B2B (Matchmaking):</span>
                <p className="text-muted-foreground bg-secondary/40 p-2.5 rounded-lg border border-border/60 leading-relaxed">
                  Tìm kiếm đối tác sản xuất bao bì sinh học, giải pháp chuyển đổi xanh ESG và các quỹ tín dụng hỗ trợ vốn lưu động lãi suất ưu đãi.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground">Câu hỏi đặt trước cho Ban Tổ Chức / Diễn Giả:</span>
                <p className="text-muted-foreground bg-secondary/40 p-2.5 rounded-lg border border-border/60 leading-relaxed">
                  Kế hoạch hỗ trợ các doanh nghiệp Học viên tham gia hội chợ xúc tiến thương mại quốc tế trong năm 2026?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-lg border border-border bg-background p-2.5">
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-0.5">Bàn tiệc Gala đăng ký:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedSurveyReg.seatAssignment || "Bàn Tiệc VIP Gala 02"}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-2.5">
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-0.5">Chế độ ẩm thực:</span>
                  <p className="font-bold text-foreground">Tiệc mặn tiêu chuẩn</p>
                </div>
              </div>

              <div className="pt-1">
                <span className="font-bold text-foreground block mb-1">Hồ sơ năng lực đính kèm:</span>
                <a
                  href="https://ceohn10.vn/docs/company-profile.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" /> Xem hồ sơ năng lực (Profile PDF)
                </a>
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <button
                  onClick={() => setSurveyModalOpen(false)}
                  className="rounded-xl bg-secondary px-5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Reminder Modal */}
      <EventReminderPosterModal
        open={eventReminderModalOpen}
        initialEventId={eventId !== "all" ? eventId : undefined}
        onClose={() => setEventReminderModalOpen(false)}
        onSuccess={() => {
          fetchLiveRegistrations();
          router.invalidate();
        }}
      />

      {/* VNPAY-QR Payment Gateway Modal */}
      <VnpayPaymentModal
        open={vnpayModalOpen}
        onClose={() => {
          setVnpayModalOpen(false);
          setSelectedVnpayReg(null);
        }}
        type="event"
        targetId={selectedVnpayReg?.id || ""}
        eventId={selectedVnpayReg?.eventId}
        amount={selectedVnpayReg?.paymentAmount || selectedVnpayReg?.eventTicketPrice || 500000}
        title={selectedVnpayReg?.eventName || "Vé Tham Dự Sự Kiện CEO HN10"}
        attendeeName={selectedVnpayReg?.memberName}
        memberCode={selectedVnpayReg?.memberCode}
        onSuccess={() => {
          fetchLiveRegistrations();
          router.invalidate();
        }}
      />

      {/* Event Attendees Import Modal (Word, Excel, PDF) */}
      <EventAttendeesImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        event={eventsList.find((e: any) => String(e.id) === String(eventId)) || eventsList[0]}
        eventsList={eventsList}
        initialEventId={eventId !== "all" ? eventId : undefined}
        onSuccess={() => {
          fetchLiveRegistrations();
          if (eventId && eventId !== "all") {
            fetchNestApi<string[]>(`/events/${eventId}/dynamic-columns`)
              .then((cols) => setDynamicColumns(Array.isArray(cols) ? cols : []))
              .catch(() => setDynamicColumns([]));
          }
          router.invalidate();
        }}
      />

      {/* Event Registrations Export Modal (3 formats: Excel, CSV, PDF) */}
      <EventRegistrationsExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        registrations={REGISTRATIONS}
        eventsList={eventsList}
        selectedEventId={eventId}
        currentEvent={eventsList.find((e: any) => String(e.id) === String(eventId)) || eventsList[0]}
      />

      {/* Dynamic Import Wizard Modal: Nhập dữ liệu 6 bước thông minh cho Đăng ký sự kiện */}
      <DynamicImportWizardModal
        isOpen={dynamicImportWizardOpen}
        onClose={() => setDynamicImportWizardOpen(false)}
        entityType="event_registration"
        entityTitle="Đại biểu đăng ký sự kiện CEO HN10"
        eventId={eventId !== "all" ? eventId : undefined}
        onSuccess={(res) => {
          if (res?.newFieldKeys && res.newFieldKeys.length > 0) {
            setDynamicColumns((prev) => Array.from(new Set([...prev, ...res.newFieldKeys])));
          }
          fetchLiveRegistrations();
          router.invalidate();
        }}
      />

      {/* Modal xem chi tiết đại biểu & các trường động tùy biến */}
      <DynamicDetailViewModal
        isOpen={!!detailRegRecord}
        onClose={() => setDetailRegRecord(null)}
        title={`Chi tiết đại biểu: ${detailRegRecord?.memberName || ""}`}
        subtitle={`Mã: ${detailRegRecord?.memberCode || detailRegRecord?.id || "—"} · Sự kiện: ${detailRegRecord?.eventName || "—"}`}
        record={detailRegRecord}
      />
    </AppShell>
  );
}
