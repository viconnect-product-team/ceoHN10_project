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
  SlidersHorizontal,
  Save,
} from "lucide-react";
import { fetchNestApi, getAuthToken } from "@/lib/api-client";
import { toast } from "sonner";
import { decodeQrFromImage } from "@/lib/qr-image-decoder";
import { EventLivePhotoGalleryModal } from "@/components/events/EventLivePhotoGalleryModal";

export const Route = createFileRoute("/event-checkin")({
  ssr: false,
  component: PublicEventCheckinGatePage,
});

type CheckinCustomField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "email" | "phone";
  required: boolean;
  optionsText?: string;
};

type CheckinFormConfig = {
  logoUrl: string;
  logoHeightPx: number;
  accentColor: string;
  enabledTabs: {
    member: boolean;
    ticket: boolean;
    walkin: boolean;
    checkout: boolean;
    checkedin_list: boolean;
    checkedout_list: boolean;
  };
  tabLabels: {
    member: string;
    ticket: string;
    walkin: string;
    checkout: string;
    checkedin_list: string;
    checkedout_list: string;
  };
  sectionTitles: {
    member: string;
    ticket: string;
    walkin: string;
    checkout: string;
  };
  memberPlaceholder: string;
  ticketPlaceholder: string;
  submitButtonText: string;
  showProxyCheckin: boolean;
  bankName?: string;
  bankAccount?: string;
  bankOwner?: string;
  customFields: CheckinCustomField[];
};

const DEFAULT_CHECKIN_FORM_CONFIG: CheckinFormConfig = {
  logoUrl: "/ceohn10-official-logo.png",
  logoHeightPx: 56,
  accentColor: "#007AFF",
  enabledTabs: {
    member: true,
    ticket: true,
    walkin: true,
    checkout: true,
    checkedin_list: true,
    checkedout_list: true,
  },
  tabLabels: {
    member: "Học viên",
    ticket: "Có mã vé",
    walkin: "Khách mới",
    checkout: "Check-out",
    checkedin_list: "Đã Check-in",
    checkedout_list: "Đã Check-out",
  },
  sectionTitles: {
    member: "Check-in Học Viên",
    ticket: "Check-in Bằng Mã Vé",
    walkin: "Đăng Ký Khách Mới",
    checkout: "Check-out Sự Kiện",
  },
  memberPlaceholder: "Nhập mã học viên...",
  ticketPlaceholder: "Nhập mã vé...",
  submitButtonText: "Check-in",
  showProxyCheckin: true,
  bankName: "",
  bankAccount: "",
  bankOwner: "",
  customFields: [],
};

function mergeCheckinFormConfig(raw?: any): CheckinFormConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_CHECKIN_FORM_CONFIG;
  return {
    logoUrl: raw.logoUrl || DEFAULT_CHECKIN_FORM_CONFIG.logoUrl,
    logoHeightPx: Number(raw.logoHeightPx) > 24 ? Number(raw.logoHeightPx) : DEFAULT_CHECKIN_FORM_CONFIG.logoHeightPx,
    accentColor: raw.accentColor || DEFAULT_CHECKIN_FORM_CONFIG.accentColor,
    enabledTabs: {
      ...DEFAULT_CHECKIN_FORM_CONFIG.enabledTabs,
      ...(raw.enabledTabs || {}),
    },
    tabLabels: {
      ...DEFAULT_CHECKIN_FORM_CONFIG.tabLabels,
      ...(raw.tabLabels || {}),
    },
    sectionTitles: {
      ...DEFAULT_CHECKIN_FORM_CONFIG.sectionTitles,
      ...(raw.sectionTitles || {}),
    },
    memberPlaceholder: raw.memberPlaceholder || DEFAULT_CHECKIN_FORM_CONFIG.memberPlaceholder,
    ticketPlaceholder: raw.ticketPlaceholder || DEFAULT_CHECKIN_FORM_CONFIG.ticketPlaceholder,
    submitButtonText: raw.submitButtonText || DEFAULT_CHECKIN_FORM_CONFIG.submitButtonText,
    showProxyCheckin:
      raw.showProxyCheckin !== undefined
        ? Boolean(raw.showProxyCheckin)
        : DEFAULT_CHECKIN_FORM_CONFIG.showProxyCheckin,
    bankName: raw.bankName || "",
    bankAccount: raw.bankAccount || "",
    bankOwner: raw.bankOwner || "",
    customFields: Array.isArray(raw.customFields) ? raw.customFields : [],
  };
}

function PublicEventCheckinGatePage() {
  const [activeCategory, setActiveCategory] = useState<
    "member" | "ticket" | "walkin" | "checkout" | "checkedin_list" | "checkedout_list"
  >("member");
  const [formConfig, setFormConfig] = useState<CheckinFormConfig>(DEFAULT_CHECKIN_FORM_CONFIG);
  const [draftFormConfig, setDraftFormConfig] = useState<CheckinFormConfig>(DEFAULT_CHECKIN_FORM_CONFIG);
  const [isFormEditorOpen, setIsFormEditorOpen] = useState(false);
  const [savingFormConfig, setSavingFormConfig] = useState(false);
  const [hasAdminSession, setHasAdminSession] = useState(false);
  const [showWalkinBankQr, setShowWalkinBankQr] = useState(false);
  const [sepayBankInfo, setSepayBankInfo] = useState<{
    bankName: string;
    bankAccount: string;
    bankOwner: string;
  } | null>(null);
  const [memberCodeInput, setMemberCodeInput] = useState("");
  const [checkoutCodeInput, setCheckoutCodeInput] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [listFilterQuery, setListFilterQuery] = useState("");
  const [loadingLists, setLoadingLists] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{
    ok: boolean;
    message: string;
    memberName?: string;
    eventTitle?: string;
    checkedOutAt?: string;
  } | null>(null);
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
    lookupCode?: string;
    lookupLoading?: boolean;
    lookupStatus?: string;
    ticketCode?: string;
    memberCode?: string;
    isRegistered?: boolean;
    isCheckedIn?: boolean;
    fullName: string;
    phone: string;
    email: string;
    company: string;
    position: string;
  }>>([]);

  const lookupCompanionByCode = async (idx: number, rawCode?: string) => {
    const target = additionalWalkins[idx];
    const clean = String(rawCode ?? target?.lookupCode ?? "").trim();
    if (!clean) {
      toast.info("Vui lòng nhập mã học viên hoặc mã vé của người nhờ check-in hộ");
      return;
    }
    setAdditionalWalkins((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, lookupLoading: true, lookupStatus: undefined } : it)),
    );
    try {
      const evQuery =
        selectedEventId && selectedEventId !== "latest"
          ? `?eventId=${encodeURIComponent(selectedEventId)}`
          : "";
      const res = await fetchNestApi<any>(
        `/events/ticket-status/${encodeURIComponent(clean)}${evQuery}`,
      );
      if (res && res.found && res.ticket) {
        const tk = res.ticket;
        setAdditionalWalkins((prev) =>
          prev.map((it, i) =>
            i === idx
              ? {
                  ...it,
                  lookupLoading: false,
                  ticketCode: tk.id,
                  memberCode: tk.memberCode || "",
                  isRegistered: true,
                  isCheckedIn: Boolean(tk.isCheckedIn),
                  fullName: tk.memberName || it.fullName,
                  phone: tk.phone || it.phone,
                  email: tk.email || it.email,
                  company: tk.company || it.company,
                  position: tk.position || it.position,
                  lookupStatus: tk.isCheckedIn
                    ? `Đã check-in trước đó (${tk.id})`
                    : `Đã đăng ký sự kiện (${tk.id}) — sẵn sàng check-in hộ`,
                }
              : it,
          ),
        );
        toast.success(`Đã tìm thấy thông tin đại biểu: ${tk.memberName}`);
      } else if (res && res.notRegisteredForEvent && res.member) {
        const mb = res.member;
        setAdditionalWalkins((prev) =>
          prev.map((it, i) =>
            i === idx
              ? {
                  ...it,
                  lookupLoading: false,
                  ticketCode: undefined,
                  memberCode: mb.code || clean.toUpperCase(),
                  isRegistered: false,
                  isCheckedIn: false,
                  fullName: mb.fullName || it.fullName,
                  phone: mb.phone || it.phone,
                  email: mb.email || it.email,
                  company: mb.company || it.company,
                  position: mb.position || it.position,
                  lookupStatus: `Học viên (${mb.code || clean}) chưa đăng ký sự kiện này — sẽ tự đăng ký & check-in hộ`,
                }
              : it,
          ),
        );
        toast.info(`Đã điền thông tin học viên ${mb.fullName} (chưa đăng ký sự kiện này)`);
      } else {
        setAdditionalWalkins((prev) =>
          prev.map((it, i) =>
            i === idx
              ? {
                  ...it,
                  lookupLoading: false,
                  lookupStatus: res?.message || "Không tìm thấy mã học viên hoặc mã vé này",
                }
              : it,
          ),
        );
        toast.error(res?.message || "Không tìm thấy mã học viên hoặc mã vé này");
      }
    } catch {
      setAdditionalWalkins((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, lookupLoading: false } : it)),
      );
      toast.error("Lỗi tra cứu thông tin người nhờ check-in hộ");
    }
  };

  const checkinProxyEntries = async (): Promise<number> => {
    const ready = additionalWalkins.filter((a) => a.ticketCode && !a.isCheckedIn);
    if (ready.length === 0) return 0;
    let count = 0;
    for (const comp of ready) {
      try {
        const res = await fetchNestApi<any>("/events/ticket-checkin", {
          method: "POST",
          body: JSON.stringify({
            ticketCode: comp.ticketCode,
            method: "companion_checkin",
            attendedParts: selectedCheckinParts,
          }),
        });
        if (res?.ok || res?.alreadyCheckedIn) {
          count += 1;
          setAdditionalWalkins((prev) =>
            prev.map((it) =>
              it.id === comp.id
                ? { ...it, isCheckedIn: true, lookupStatus: `Đã check-in hộ thành công: ${comp.fullName}` }
                : it,
            ),
          );
        }
      } catch { }
    }
    if (count > 0) {
      toast.success(`Đã check-in hộ thành công ${count} người đi cùng!`);
    }
    return count;
  };

  const renderProxyCheckinBox = (mode: "member" | "ticket") => (
    <div className="space-y-2.5 pt-1">
      {additionalWalkins.length > 0 && (
        <div className="space-y-2">
          {additionalWalkins.map((w, idx) => (
            <div
              key={w.id}
              className="p-3 rounded-2xl border border-[#cdddf0] bg-white/80 space-y-2"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-[#0B0D12]">
                <span>Check-in hộ #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => setAdditionalWalkins((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Xóa
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={mode === "member" ? "Nhập mã học viên check-in hộ (HN10-...)..." : "Nhập mã vé (REG-...) hoặc mã HV check-in hộ..."}
                  value={w.lookupCode || ""}
                  onChange={(e) => {
                    const val = mode === "member" ? e.target.value.toUpperCase() : e.target.value;
                    setAdditionalWalkins((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, lookupCode: val } : it)),
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void lookupCompanionByCode(idx);
                    }
                  }}
                  className="ios-liquid-input !py-2 !px-3 !text-xs font-mono flex-1"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    triggerWaterRipple(e);
                    void lookupCompanionByCode(idx);
                  }}
                  disabled={w.lookupLoading}
                  className="ios-water-btn ios-btn-submit !py-2 !px-3 !text-xs shrink-0 disabled:opacity-60"
                >
                  {w.lookupLoading ? "Tìm..." : "Tra cứu"}
                </button>
              </div>
              {w.fullName && (
                <div className="text-[11px] font-semibold text-[#0B0D12] px-1">
                  {w.fullName} {w.company ? `· ${w.company}` : ""}
                </div>
              )}
              {w.lookupStatus && (
                <div
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${
                    w.isCheckedIn
                      ? "bg-emerald-500/20 text-emerald-900"
                      : w.isRegistered
                        ? "bg-blue-500/15 text-blue-900"
                        : "bg-amber-500/15 text-amber-900"
                  }`}
                >
                  {w.lookupStatus}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            setAdditionalWalkins((prev) => [
              ...prev,
              {
                id: `proxy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                lookupCode: "",
                fullName: "",
                phone: "",
                email: "",
                company: "",
                position: "",
              },
            ])
          }
          className="px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-[#0B0D12] text-[11px] font-bold border border-[#cdddf0] cursor-pointer transition inline-flex items-center gap-1"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Check-in hộ</span>
        </button>

        {additionalWalkins.some((a) => a.ticketCode && !a.isCheckedIn) && (
          <button
            type="button"
            onClick={() => void checkinProxyEntries()}
            className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition"
          >
            Xác nhận Check-in hộ ({additionalWalkins.filter((a) => a.ticketCode && !a.isCheckedIn).length})
          </button>
        )}
      </div>
    </div>
  );
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
    const token = getAuthToken();
    setHasAdminSession(Boolean(token));
    const search = new URLSearchParams(window.location.search);
    if (search.get("editForm") === "1" && token) {
      setIsFormEditorOpen(true);
    }
    fetchNestApi<any>("/admin/master-settings/sepay")
      .then((res) => {
        if (res && (res.account_number || res.bank_brand_name)) {
          setSepayBankInfo({
            bankName: res.bank_brand_name || "MB Bank",
            bankAccount: res.account_number || "",
            bankOwner: res.account_name || "CLB DOANH NHAN CEO HN10",
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const targetId = selectedEventId || "latest";
    const loadConfig = async () => {
      try {
        const res = await fetchNestApi<any>(`/events/${encodeURIComponent(targetId)}/checkin-form-config`);
        const merged = mergeCheckinFormConfig(res?.config);
        setFormConfig(merged);
        setDraftFormConfig(merged);
        const tabKeys: Array<keyof CheckinFormConfig["enabledTabs"]> = [
          "member",
          "ticket",
          "walkin",
          "checkout",
          "checkedin_list",
          "checkedout_list",
        ];
        if (!merged.enabledTabs[activeCategory]) {
          const firstEnabled = tabKeys.find((k) => merged.enabledTabs[k]);
          if (firstEnabled) setActiveCategory(firstEnabled);
        }
      } catch {
        // Keep defaults
      }
    };
    void loadConfig();
  }, [selectedEventId]);

  const handleApplyFormConfig = async () => {
    setSavingFormConfig(true);
    try {
      const targetId = selectedEventId || "latest";
      const res = await fetchNestApi<any>(`/events/${encodeURIComponent(targetId)}/checkin-form-config`, {
        method: "PUT",
        body: JSON.stringify({ config: draftFormConfig }),
      });
      const merged = mergeCheckinFormConfig(res?.config || draftFormConfig);
      setFormConfig(merged);
      setDraftFormConfig(merged);
      const tabKeys: Array<keyof CheckinFormConfig["enabledTabs"]> = [
        "member",
        "ticket",
        "walkin",
        "checkout",
        "checkedin_list",
        "checkedout_list",
      ];
      if (!merged.enabledTabs[activeCategory]) {
        const firstEnabled = tabKeys.find((k) => merged.enabledTabs[k]);
        if (firstEnabled) setActiveCategory(firstEnabled);
      }
      setIsFormEditorOpen(false);
      toast.success("Đã áp dụng & Public cấu hình Form Check-in mới!");
    } catch (err: any) {
      toast.error(err?.message || "Không thể lưu cấu hình Form Check-in (cần đăng nhập quyền Quản trị).");
    } finally {
      setSavingFormConfig(false);
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

  const refreshEventTicketLists = async (targetEventId?: string) => {
    const eId = targetEventId || selectedEventId || currentTicket?.eventId || "latest";
    setLoadingLists(true);
    try {
      const res = await fetchNestApi<any>(`/events/${eId}/offline-dataset`);
      if (res && res.ok && Array.isArray(res.tickets)) {
        setCachedTickets(res.tickets);
        localStorage.setItem("ceohn10_offline_tickets", JSON.stringify(res.tickets));
      }
    } catch {
    } finally {
      setLoadingLists(false);
    }
  };

  const renderAttendanceList = (mode: "checkin" | "checkout") => {
    const ql = listFilterQuery.trim().toLowerCase();
    const baseList = cachedTickets.filter((t) =>
      mode === "checkin"
        ? Boolean(t.isCheckedIn || t.status === "attended" || t.checkedInAt)
        : Boolean(t.checkedOutAt),
    );
    const filteredList = baseList.filter((t) => {
      if (!ql) return true;
      return (
        String(t.memberName || "").toLowerCase().includes(ql) ||
        String(t.memberCode || "").toLowerCase().includes(ql) ||
        String(t.id || "").toLowerCase().includes(ql) ||
        String(t.company || "").toLowerCase().includes(ql) ||
        String(t.luckyNumber || "").toLowerCase().includes(ql)
      );
    });

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[14px] font-bold text-[#0B0D12]">
            {mode === "checkin" ? `Danh sách đã Check-in (${baseList.length})` : `Danh sách đã Check-out (${baseList.length})`}
          </div>
          <button
            type="button"
            onClick={() => void refreshEventTicketLists()}
            disabled={loadingLists}
            className="px-3 py-1 rounded-full bg-white/80 hover:bg-white border border-[#cdddf0] text-[11px] font-bold text-[#0B0D12] cursor-pointer disabled:opacity-50"
          >
            {loadingLists ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        <input
          type="text"
          placeholder="Tìm theo tên, mã HV, mã vé, số may mắn..."
          value={listFilterQuery}
          onChange={(e) => setListFilterQuery(e.target.value)}
          className="ios-liquid-input !py-2 !px-3.5 !text-xs"
        />

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {filteredList.length === 0 ? (
            <div className="p-5 text-center text-xs text-[#525866] bg-white/60 rounded-2xl border border-[#cdddf0]">
              {loadingLists
                ? "Đang tải danh sách từ hệ thống..."
                : mode === "checkin"
                  ? "Chưa có đại biểu nào Check-in."
                  : "Chưa có đại biểu nào Check-out."}
            </div>
          ) : (
            filteredList.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white/85 border border-[#cdddf0] flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-[#0B0D12] truncate">{item.memberName || "Đại biểu"}</div>
                  <div className="text-[11px] text-[#525866] truncate">
                    {item.memberCode || item.id} {item.company ? `· ${item.company}` : ""}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    {mode === "checkin"
                      ? `Check-in: ${item.checkedInAt || "Đã điểm danh"}`
                      : `Check-out: ${item.checkedOutAt}`}
                  </div>
                </div>
                {item.luckyNumber && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-400 text-amber-900 font-mono font-black text-[11px] shrink-0">
                    #{item.luckyNumber}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const handleDirectCheckout = async (rawCode?: string) => {
    const clean = String(rawCode ?? checkoutCodeInput).trim();
    if (!clean) {
      toast.info("Vui lòng nhập mã học viên hoặc mã vé để Check-out");
      return;
    }
    setCheckoutLoading(true);
    setCheckoutResult(null);
    try {
      const res = await fetchNestApi<any>("/events/ticket-checkout", {
        method: "POST",
        body: JSON.stringify({ ticketCode: clean }),
      });
      if (res && res.ok) {
        const msg = res.message || "Check-out thành công!";
        toast.success(msg);
        setCheckoutResult({
          ok: true,
          message: msg,
          memberName: res.ticket?.memberName,
          eventTitle: res.ticket?.eventTitle,
          checkedOutAt: res.checkedOutAt || new Date().toLocaleString("vi-VN"),
        });
      } else {
        const errMsg =
          res?.notCheckedIn
            ? "Đại biểu chưa Check-in sự kiện này! Chỉ những người đã Check-in mới được phép Check-out."
            : res?.message || "Không thể Check-out vé này.";
        toast.error(errMsg);
        setCheckoutResult({
          ok: false,
          message: errMsg,
          memberName: res?.ticket?.memberName,
          eventTitle: res?.ticket?.eventTitle,
        });
      }
    } catch (err: any) {
      const errMsg = err?.message || "Không tìm thấy vé hoặc đại biểu chưa Check-in.";
      toast.error(errMsg);
      setCheckoutResult({ ok: false, message: errMsg });
    } finally {
      setCheckoutLoading(false);
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
        await checkinProxyEntries();
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
      const preRegisteredCompanions = additionalWalkins.filter((a) => Boolean(a.ticketCode));
      const newWalkinCompanions = additionalWalkins.filter((a) => !a.ticketCode);

      const allWalkins = [
        {
          fullName: walkinForm.fullName.trim(),
          phone: walkinForm.phone.trim(),
          email: walkinForm.email.trim().toLowerCase(),
          company: walkinForm.company.trim(),
          position: walkinForm.position.trim(),
        },
        ...newWalkinCompanions.map((a) => ({
          fullName: a.fullName.trim(),
          phone: a.phone.trim(),
          email: a.email.trim().toLowerCase(),
          company: a.company.trim() || walkinForm.company.trim(),
          position: a.position.trim(),
          memberCode: a.memberCode || undefined,
        })),
      ];

      // Check-in hộ các đại biểu đã có vé / đã đăng ký sự kiện này
      for (const comp of preRegisteredCompanions) {
        if (comp.ticketCode && !comp.isCheckedIn) {
          await fetchNestApi("/events/ticket-checkin", {
            method: "POST",
            body: JSON.stringify({
              ticketCode: comp.ticketCode,
              method: "companion_checkin",
              attendedParts: walkinForm.selectedParts,
            }),
          }).catch(() => {});
        }
      }

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
          const bankAccount =
            formConfig.bankAccount ||
            activeEv?.bank_account ||
            activeEv?.bankAccount ||
            sepayBankInfo?.bankAccount ||
            "0983101010";
          const bankName =
            formConfig.bankName ||
            activeEv?.bank_name ||
            activeEv?.bankName ||
            sepayBankInfo?.bankName ||
            "MB Bank";
          const bankOwner =
            formConfig.bankOwner ||
            activeEv?.bank_owner ||
            activeEv?.bankOwner ||
            sepayBankInfo?.bankOwner ||
            "CLB DOANH NHAN CEO HN10";
          const totalPay = selectedEventFee * allWalkins.length;
          const transferContent = `EV_${regId}`;
          const vietQrUrl =
            res.vietQrUrl ||
            `https://img.vietqr.io/image/${encodeURIComponent(bankName.replace(/\s+/g, ""))}-${encodeURIComponent(bankAccount)}-compact2.png?amount=${totalPay}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankOwner)}`;
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
    <div className="min-h-screen w-full relative overflow-x-hidden flex items-center justify-center p-4 sm:p-6 text-[#0B0D12] font-sans selection:bg-[#007AFF] selection:text-white bg-[#FFFFFF]">
      <style>{`
        :root {
          --bg-canvas: #FFFFFF;
          --accent-color: ${formConfig.accentColor || "#007AFF"};
          --caustic-cyan: rgba(56, 189, 248, 0.13);
          --caustic-violet: rgba(167, 139, 250, 0.11);
          --caustic-mint: rgba(52, 211, 153, 0.10);
          --glass-bg: rgba(255, 255, 255, 0.72);
          --glass-bg-elevated: rgba(255, 255, 255, 0.92);
          --glass-input-bg: rgba(241, 245, 249, 0.68);
          --glass-border-top: rgba(255, 255, 255, 1);
          --glass-border-edge: rgba(203, 213, 225, 0.55);
          --prism-glow: rgba(56, 189, 248, 0.25);
          --glass-shadow: 0 0 0 1px rgba(15, 23, 42, 0.045),
                          0 24px 56px -14px rgba(15, 23, 42, 0.08),
                          0 6px 18px -4px rgba(15, 23, 42, 0.035);
          --pill-active-shadow: 0 6px 18px -4px rgba(15, 23, 42, 0.10),
                                0 0 16px rgba(56, 189, 248, 0.24);
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
          background: var(--glass-bg);
          backdrop-filter: blur(36px) saturate(200%);
          -webkit-backdrop-filter: blur(36px) saturate(200%);
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.92);
          box-shadow:
            inset 0 1.5px 1px rgba(255, 255, 255, 1),
            inset 0 -1px 2px rgba(56, 189, 248, 0.16),
            var(--glass-shadow);
        }
        .ios-liquid-glass::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.55) 0%,
            rgba(255, 255, 255, 0.08) 42%,
            rgba(255, 255, 255, 0) 68%
          );
          z-index: 0;
        }
        .ios-liquid-glass > * {
          position: relative;
          z-index: 1;
        }
        .ios-liquid-glass-active {
          position: relative;
          overflow: hidden;
          background: var(--glass-bg-elevated);
          backdrop-filter: blur(30px) saturate(190%);
          -webkit-backdrop-filter: blur(30px) saturate(190%);
          border: 1px solid var(--glass-border-edge);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 1),
            var(--pill-active-shadow);
        }
        .ios-liquid-pill {
          position: relative;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(203, 213, 225, 0.58);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 1),
            0 4px 12px rgba(15, 23, 42, 0.045);
        }
        .ios-seg-btn {
          border: 1px solid transparent;
          background: transparent;
          padding: 10px 8px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ios-seg-btn.active {
          background: rgba(255, 255, 255, 0.96);
          color: #0B0D12;
          font-weight: 700;
          border-color: rgba(203, 213, 225, 0.55);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 1),
            0 6px 18px -4px rgba(15, 23, 42, 0.09),
            0 0 14px rgba(56, 189, 248, 0.20);
        }
        .ios-liquid-input {
          width: 100%;
          padding: 13px 18px;
          border-radius: 999px;
          border: 1px solid rgba(203, 213, 225, 0.62);
          background: var(--glass-input-bg);
          color: #0B0D12;
          font-size: 14.5px;
          outline: none;
          transition: all 0.22s ease;
        }
        .ios-liquid-input::placeholder {
          color: #94A3B8;
        }
        .ios-liquid-input:focus {
          background: rgba(255, 255, 255, 0.96);
          border-color: rgba(56, 189, 248, 0.65);
          box-shadow: 0 0 0 3.5px rgba(56, 189, 248, 0.22);
        }
        .ios-btn-submit {
          padding: 13px 20px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          background: var(--accent-color, #007AFF);
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow:
            inset 0 1.5px 1px rgba(255, 255, 255, 0.35),
            0 10px 24px -6px rgba(0, 122, 255, 0.32);
          transition: transform 0.15s ease, opacity 0.15s ease, filter 0.15s ease;
        }
        .ios-btn-submit:hover {
          filter: brightness(1.06);
        }
        .ios-btn-submit:active {
          transform: scale(0.98);
        }
        .ios-btn-qr {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          border: 1px solid rgba(205, 222, 240, 0.65);
          background: rgba(255, 255, 255, 0.85);
          color: #0B0D12;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.98),
            0 4px 12px rgba(0, 0, 0, 0.05);
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
          transform: scale(0.97);
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

      {/* Hiệu ứng vệt khúc xạ ánh sáng Caustics chuẩn iOS Light Liquid Glass trên nền trắng */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(circle at 15% 18%, var(--caustic-cyan) 0%, transparent 40%),
            radial-gradient(circle at 86% 28%, var(--caustic-violet) 0%, transparent 42%),
            radial-gradient(circle at 50% 86%, var(--caustic-mint) 0%, transparent 42%)
          `,
        }}
      />

      {hasAdminSession && (
        <button
          type="button"
          onClick={() => {
            setDraftFormConfig(formConfig);
            setIsFormEditorOpen(true);
          }}
          className="fixed top-4 right-4 z-40 ios-liquid-pill px-3.5 py-2 rounded-full inline-flex items-center gap-1.5 text-xs font-bold text-[#0B0D12] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          title="Chỉnh sửa giao diện & trường thông tin Form Check-in"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>Chỉnh sửa Form</span>
        </button>
      )}

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-[440px] mx-auto flex flex-col gap-[18px]">
        {/* 1. Header Card — Chỉ hiển thị Logo CEO HN10 */}
        <section className="ios-liquid-glass px-6 py-5 text-center flex items-center justify-center">
          <img
            src={formConfig.logoUrl || "/ceohn10-official-logo.png"}
            alt="CEO HN10"
            style={{ height: `${formConfig.logoHeightPx || 56}px` }}
            className="w-auto max-w-[240px] object-contain mx-auto select-none"
          />
        </section>

        {/* 2. Segmented Pill danh mục (tùy biến bật/tắt & nhãn từ Cấu hình Form) */}
        {(() => {
          const allTabDefs: Array<{
            key: keyof CheckinFormConfig["enabledTabs"];
            onSelect: () => void;
          }> = [
            {
              key: "member",
              onSelect: () => {
                setActiveCategory("member");
                setUnregisteredMember(null);
              },
            },
            {
              key: "ticket",
              onSelect: () => {
                setActiveCategory("ticket");
                setUnregisteredMember(null);
              },
            },
            {
              key: "walkin",
              onSelect: () => {
                setActiveCategory("walkin");
                setUnregisteredMember(null);
                setWalkinQrResult(null);
              },
            },
            {
              key: "checkout",
              onSelect: () => {
                setActiveCategory("checkout");
                setUnregisteredMember(null);
                setCheckoutResult(null);
              },
            },
            {
              key: "checkedin_list",
              onSelect: () => {
                setActiveCategory("checkedin_list");
                setUnregisteredMember(null);
                void refreshEventTicketLists();
              },
            },
            {
              key: "checkedout_list",
              onSelect: () => {
                setActiveCategory("checkedout_list");
                setUnregisteredMember(null);
                void refreshEventTicketLists();
              },
            },
          ];
          const visibleTabs = allTabDefs.filter((t) => formConfig.enabledTabs[t.key]);
          if (visibleTabs.length === 0) return null;
          return (
            <nav
              className="ios-liquid-glass grid p-[5px] !rounded-3xl sm:!rounded-full gap-1"
              style={{
                gridTemplateColumns: `repeat(${Math.min(visibleTabs.length, 3)}, minmax(0, 1fr))`,
              }}
            >
              {visibleTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onPointerDown={triggerWaterRipple}
                  onClick={t.onSelect}
                  className={`ios-water-btn ios-seg-btn !text-[12px] !px-2 truncate ${
                    activeCategory === t.key ? "active" : ""
                  }`}
                >
                  {formConfig.tabLabels[t.key]}
                </button>
              ))}
            </nav>
          );
        })()}

        {/* 3. Khối nhập liệu Check-in */}
        <section className="ios-liquid-glass px-5 py-[22px] flex flex-col gap-3.5">
          {activeCategory === "member" && (
            <div className="flex flex-col gap-3.5">
              <div className="text-center text-[15px] font-bold text-[#0B0D12] tracking-tight">
                {formConfig.sectionTitles.member}
              </div>
              <input
                type="text"
                placeholder={formConfig.memberPlaceholder}
                value={memberCodeInput}
                onChange={(e) => setMemberCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") lookupTicket(memberCodeInput);
                }}
                className="ios-liquid-input font-mono uppercase"
              />
              {formConfig.showProxyCheckin && renderProxyCheckinBox("member")}
              <button
                type="button"
                onClick={(e) => {
                  triggerWaterRipple(e);
                  lookupTicket(memberCodeInput);
                }}
                disabled={loading}
                className="ios-water-btn ios-btn-submit w-full disabled:opacity-60"
              >
                {loading ? "Đang tra cứu..." : formConfig.submitButtonText}
              </button>
            </div>
          )}

          {activeCategory === "ticket" && (
            <div className="flex flex-col gap-3.5">
              <div className="text-center text-[15px] font-bold text-[#0B0D12] tracking-tight">
                {formConfig.sectionTitles.ticket}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrImageUpload}
              />

              <input
                type="text"
                placeholder={formConfig.ticketPlaceholder}
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") lookupTicket(ticketInput);
                }}
                className="ios-liquid-input font-mono"
              />
              {formConfig.showProxyCheckin && renderProxyCheckinBox("ticket")}

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    triggerWaterRipple(e);
                    lookupTicket(ticketInput);
                  }}
                  disabled={loading || isDecodingImage}
                  className="ios-water-btn ios-btn-submit flex-1 disabled:opacity-60"
                >
                  {loading ? "Đang kiểm tra..." : formConfig.submitButtonText}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    triggerWaterRipple(e);
                    fileInputRef.current?.click();
                  }}
                  disabled={isDecodingImage || loading}
                  className="ios-water-btn ios-btn-qr disabled:opacity-60"
                  title="Tải ảnh QR"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {activeCategory === "walkin" && (
            <form onSubmit={handleWalkinSubmit} className="space-y-3.5 text-xs">
              <div className="text-center text-[15px] font-bold text-[#0B0D12] tracking-tight">
                {formConfig.sectionTitles.walkin}
              </div>

              {!selectedEventIsFree && (() => {
                const activeEv = eventsList.find((ev) => ev.id === selectedEventId);
                const bankAccount =
                  formConfig.bankAccount ||
                  activeEv?.bank_account ||
                  activeEv?.bankAccount ||
                  sepayBankInfo?.bankAccount ||
                  "0983101010";
                const bankName =
                  formConfig.bankName ||
                  activeEv?.bank_name ||
                  activeEv?.bankName ||
                  sepayBankInfo?.bankName ||
                  "MB Bank";
                const bankOwner =
                  formConfig.bankOwner ||
                  activeEv?.bank_owner ||
                  activeEv?.bankOwner ||
                  sepayBankInfo?.bankOwner ||
                  "CLB DOANH NHAN CEO HN10";
                const totalFee = selectedEventFee * (1 + additionalWalkins.length);
                const noteText = `CEOHN10 ${walkinForm.phone || walkinForm.fullName || "KHACHMOI"}`.trim();
                const previewQrUrl = `https://img.vietqr.io/image/${encodeURIComponent(bankName.replace(/\s+/g, ""))}-${encodeURIComponent(bankAccount)}-compact2.png?amount=${totalFee}&addInfo=${encodeURIComponent(noteText)}&accountName=${encodeURIComponent(bankOwner)}`;

                return (
                  <div className="p-3.5 rounded-2xl border border-amber-200/90 bg-amber-50/75 space-y-2.5">
                    <div className="text-xs font-bold text-amber-950 flex items-center justify-between gap-2">
                      <span>Phí sự kiện: {new Intl.NumberFormat("vi-VN").format(selectedEventFee)} VNĐ / đại biểu</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold shrink-0">
                        Có phí
                      </span>
                    </div>

                    {/* Thông tin tài khoản CEO HN10 + Nút Xem mã QR chuyển khoản */}
                    <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/70 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-[11px] text-slate-700 space-y-0.5">
                          <div className="font-bold text-slate-900">Tài khoản nhận phí CEO HN10</div>
                          <div>
                            Ngân hàng: <b>{bankName}</b> · STK:{" "}
                            <b className="font-mono text-[#003B95]">{bankAccount}</b>
                          </div>
                          <div>
                            Chủ TK: <b>{bankOwner}</b>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowWalkinBankQr((v) => !v)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#007AFF] hover:bg-[#0062CC] text-white text-[11px] font-bold shadow-xs transition cursor-pointer shrink-0"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{showWalkinBankQr ? "Ẩn mã QR" : "Xem mã QR chuyển khoản"}</span>
                        </button>
                      </div>

                      {showWalkinBankQr && (
                        <div className="pt-2 border-t border-amber-100 text-center space-y-1.5">
                          <img
                            src={previewQrUrl}
                            alt="VietQR CEO HN10"
                            className="w-44 h-44 mx-auto rounded-xl bg-white p-1.5 border border-amber-200 shadow-xs object-contain"
                          />
                          <div className="text-[11px] text-slate-600">
                            Số tiền:{" "}
                            <b className="text-emerald-700">
                              {new Intl.NumberFormat("vi-VN").format(totalFee)} VNĐ
                            </b>{" "}
                            · Nội dung: <b className="font-mono text-[#003B95]">{noteText}</b>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
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
                );
              })()}

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
                const legacyFields: any[] = Array.isArray(
                  activeEv?.formFieldsConfig?.checkinCustomFields
                )
                  ? activeEv.formFieldsConfig.checkinCustomFields
                  : [];
                const checkinCustomFields =
                  formConfig.customFields && formConfig.customFields.length > 0
                    ? formConfig.customFields
                    : legacyFields;
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
                      className="p-3.5 rounded-2xl border border-[#cdddf0] bg-white/75 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#0B0D12]">
                        <span>Đại biểu check-in hộ #{idx + 2}</span>
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

                      {/* Nhập Mã học viên hoặc Mã vé để tự động điền thông tin người nhờ check-in hộ */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Nhập mã học viên (HN10-...) hoặc mã vé (REG-...)..."
                          value={w.lookupCode || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAdditionalWalkins((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, lookupCode: val } : it))
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void lookupCompanionByCode(idx);
                            }
                          }}
                          className="ios-liquid-input !py-2 !px-3.5 !text-xs font-mono flex-1"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            triggerWaterRipple(e);
                            void lookupCompanionByCode(idx);
                          }}
                          disabled={w.lookupLoading}
                          className="ios-water-btn ios-btn-submit !py-2 !px-3.5 !text-xs shrink-0 disabled:opacity-60"
                        >
                          {w.lookupLoading ? "Đang tìm..." : "Tra cứu"}
                        </button>
                      </div>

                      {w.lookupStatus && (
                        <div
                          className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl ${
                            w.isRegistered
                              ? "bg-emerald-500/15 text-emerald-800"
                              : "bg-amber-500/15 text-amber-900"
                          }`}
                        >
                          {w.lookupStatus}
                        </div>
                      )}

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
                          className="ios-liquid-input !py-2 !px-3 !text-xs"
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
                          className="ios-liquid-input !py-2 !px-3 !text-xs"
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
                          className="ios-liquid-input !py-2 !px-3 !text-xs"
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

          {activeCategory === "checkout" && (
            <div className="flex flex-col gap-3.5">
              <div className="text-center text-[15px] font-bold text-[#0B0D12] tracking-tight">
                {formConfig.sectionTitles.checkout} (Chỉ dành cho đại biểu đã Check-in)
              </div>
              <input
                type="text"
                placeholder="Nhập mã học viên (HN10-...) hoặc mã vé đã Check-in..."
                value={checkoutCodeInput}
                onChange={(e) => setCheckoutCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleDirectCheckout();
                }}
                className="ios-liquid-input font-mono uppercase"
              />
              <button
                type="button"
                onClick={(e) => {
                  triggerWaterRipple(e);
                  void handleDirectCheckout();
                }}
                disabled={checkoutLoading}
                className="ios-water-btn ios-btn-submit w-full disabled:opacity-60"
              >
                {checkoutLoading ? "Đang xác nhận Check-out..." : "Xác nhận Check-out"}
              </button>

              {checkoutResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                    checkoutResult.ok
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-900"
                      : "bg-rose-500/15 border-rose-500/40 text-rose-900"
                  }`}
                >
                  <div className="font-bold">{checkoutResult.message}</div>
                  {checkoutResult.memberName && (
                    <div>Đại biểu: <strong>{checkoutResult.memberName}</strong></div>
                  )}
                  {checkoutResult.checkedOutAt && (
                    <div>Thời gian Check-out: <strong>{checkoutResult.checkedOutAt}</strong></div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeCategory === "checkedin_list" && renderAttendanceList("checkin")}

          {activeCategory === "checkedout_list" && renderAttendanceList("checkout")}
        </section>

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

        {/* NÚT PHỤ DƯỚI CÙNG */}
        {activeCategory !== "walkin" && formConfig.enabledTabs.walkin && (
          <button
            type="button"
            onClick={(e) => {
              triggerWaterRipple(e);
              setActiveCategory("walkin");
              setWalkinQrResult(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="ios-water-btn ios-liquid-glass self-center !rounded-full px-[22px] py-2.5 text-[13.5px] font-semibold text-[#0B0D12] cursor-pointer"
          >
            + Thêm người
          </button>
        )}
      </main>

      {/* Modal Chỉnh sửa Form Check-in & Áp dụng Public (dành cho BTC / Admin) */}
      {isFormEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-md">
          <div className="ios-liquid-glass w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden !bg-white/95">
            <div className="px-5 py-4 border-b border-slate-200/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#007AFF]" />
                <h2 className="text-sm sm:text-base font-extrabold text-[#0B0D12]">
                  Chỉnh sửa Form Check-in Public
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormEditorOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Chọn sự kiện áp dụng */}
              {eventsList.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Sự kiện áp dụng</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => handleSelectEvent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-[#0B0D12] outline-none focus:border-[#007AFF]"
                  >
                    {eventsList.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.name || evt.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Màu chủ đạo iOS Liquid Glass & Logo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Màu nút chính (iOS Accent)</label>
                  <div className="flex items-center gap-2">
                    {[
                      { label: "iOS Blue", color: "#007AFF" },
                      { label: "Obsidian", color: "#0B0D12" },
                      { label: "CEO HN10", color: "#003B95" },
                      { label: "Emerald", color: "#059669" },
                    ].map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() =>
                          setDraftFormConfig((prev) => ({ ...prev, accentColor: preset.color }))
                        }
                        className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                          draftFormConfig.accentColor === preset.color
                            ? "border-[#0B0D12] bg-slate-100 text-[#0B0D12]"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: preset.color }}
                        />
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Chiều cao Logo Header ({draftFormConfig.logoHeightPx}px)
                  </label>
                  <input
                    type="range"
                    min={36}
                    max={96}
                    value={draftFormConfig.logoHeightPx}
                    onChange={(e) =>
                      setDraftFormConfig((prev) => ({
                        ...prev,
                        logoHeightPx: Number(e.target.value) || 56,
                      }))
                    }
                    className="w-full accent-[#007AFF]"
                  />
                </div>
              </div>

              {/* Bật/Tắt & Đổi tên 6 Danh mục */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  Các danh mục hiển thị trên Form Check-in
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      { key: "member", defaultLabel: "Học viên" },
                      { key: "ticket", defaultLabel: "Có mã vé" },
                      { key: "walkin", defaultLabel: "Khách mới" },
                      { key: "checkout", defaultLabel: "Check-out" },
                      { key: "checkedin_list", defaultLabel: "Đã Check-in" },
                      { key: "checkedout_list", defaultLabel: "Đã Check-out" },
                    ] as const
                  ).map(({ key }) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50/70"
                    >
                      <input
                        type="checkbox"
                        checked={draftFormConfig.enabledTabs[key]}
                        onChange={(e) =>
                          setDraftFormConfig((prev) => ({
                            ...prev,
                            enabledTabs: {
                              ...prev.enabledTabs,
                              [key]: e.target.checked,
                            },
                          }))
                        }
                        className="rounded accent-[#007AFF] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={draftFormConfig.tabLabels[key]}
                        onChange={(e) =>
                          setDraftFormConfig((prev) => ({
                            ...prev,
                            tabLabels: {
                              ...prev.tabLabels,
                              [key]: e.target.value,
                            },
                          }))
                        }
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-[#0B0D12]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tiêu đề & Nhãn nút */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Tiêu đề tab Học viên</label>
                  <input
                    type="text"
                    value={draftFormConfig.sectionTitles.member}
                    onChange={(e) =>
                      setDraftFormConfig((prev) => ({
                        ...prev,
                        sectionTitles: { ...prev.sectionTitles, member: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Tiêu đề tab Có mã vé</label>
                  <input
                    type="text"
                    value={draftFormConfig.sectionTitles.ticket}
                    onChange={(e) =>
                      setDraftFormConfig((prev) => ({
                        ...prev,
                        sectionTitles: { ...prev.sectionTitles, ticket: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Placeholder mã học viên</label>
                  <input
                    type="text"
                    value={draftFormConfig.memberPlaceholder}
                    onChange={(e) =>
                      setDraftFormConfig((prev) => ({ ...prev, memberPlaceholder: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Chữ trên nút xác nhận</label>
                  <input
                    type="text"
                    value={draftFormConfig.submitButtonText}
                    onChange={(e) =>
                      setDraftFormConfig((prev) => ({ ...prev, submitButtonText: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftFormConfig.showProxyCheckin}
                  onChange={(e) =>
                    setDraftFormConfig((prev) => ({ ...prev, showProxyCheckin: e.target.checked }))
                  }
                  className="rounded accent-[#007AFF]"
                />
                <span>Cho phép nút &quot;+ Check-in hộ&quot; nhiều người cùng lúc</span>
              </label>

              {/* Tài khoản nhận phí CEO HN10 cho Khách mới */}
              <div className="space-y-2 pt-2 border-t border-slate-200/70">
                <label className="font-bold text-slate-700 block">
                  Tài khoản nhận phí CEO HN10 (hiển thị cho Khách mới khi sự kiện có phí)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Ngân hàng (VD: MB Bank)"
                    value={draftFormConfig.bankName || ""}
                    onChange={(e) =>
                      setDraftFormConfig((prev) => ({ ...prev, bankName: e.target.value }))
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="Số tài khoản CEO HN10"
                    value={draftFormConfig.bankAccount || ""}
                    onChange={(e) =>
                      setDraftFormConfig((prev) => ({ ...prev, bankAccount: e.target.value }))
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Chủ tài khoản"
                    value={draftFormConfig.bankOwner || ""}
                    onChange={(e) =>
                      setDraftFormConfig((prev) => ({ ...prev, bankOwner: e.target.value }))
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Trường tùy chỉnh bổ sung */}
              <div className="space-y-2 pt-2 border-t border-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">
                    Trường thông tin bổ sung ({draftFormConfig.customFields.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftFormConfig((prev) => ({
                        ...prev,
                        customFields: [
                          ...prev.customFields,
                          {
                            id: `cf_${Date.now().toString(36)}`,
                            label: "Thông tin thêm",
                            type: "text",
                            required: false,
                            optionsText: "",
                          },
                        ],
                      }))
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-[#007AFF] font-bold text-[11px] hover:bg-sky-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm trường
                  </button>
                </div>

                {draftFormConfig.customFields.map((cf, idx) => (
                  <div
                    key={cf.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cf.label}
                        onChange={(e) =>
                          setDraftFormConfig((prev) => ({
                            ...prev,
                            customFields: prev.customFields.map((item, i) =>
                              i === idx ? { ...item, label: e.target.value } : item
                            ),
                          }))
                        }
                        placeholder="Tên trường..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                      />
                      <select
                        value={cf.type}
                        onChange={(e) =>
                          setDraftFormConfig((prev) => ({
                            ...prev,
                            customFields: prev.customFields.map((item, i) =>
                              i === idx ? { ...item, type: e.target.value as any } : item
                            ),
                          }))
                        }
                        className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px]"
                      >
                        <option value="text">Văn bản</option>
                        <option value="number">Số</option>
                        <option value="select">Danh sách chọn</option>
                        <option value="phone">SĐT</option>
                        <option value="email">Email</option>
                      </select>
                      <label className="inline-flex items-center gap-1 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cf.required}
                          onChange={(e) =>
                            setDraftFormConfig((prev) => ({
                              ...prev,
                              customFields: prev.customFields.map((item, i) =>
                                i === idx ? { ...item, required: e.target.checked } : item
                              ),
                            }))
                          }
                        />
                        <span>Bắt buộc</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftFormConfig((prev) => ({
                            ...prev,
                            customFields: prev.customFields.filter((_, i) => i !== idx),
                          }))
                        }
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {cf.type === "select" && (
                      <input
                        type="text"
                        value={cf.optionsText || ""}
                        onChange={(e) =>
                          setDraftFormConfig((prev) => ({
                            ...prev,
                            customFields: prev.customFields.map((item, i) =>
                              i === idx ? { ...item, optionsText: e.target.value } : item
                            ),
                          }))
                        }
                        placeholder="Các lựa chọn cách nhau dấu phẩy (VD: S, M, L)"
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-200/70 flex items-center justify-end gap-2 bg-white/80">
              <button
                type="button"
                onClick={() => setDraftFormConfig(DEFAULT_CHECKIN_FORM_CONFIG)}
                className="px-3.5 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Khôi phục mặc định
              </button>
              <button
                type="button"
                onClick={handleApplyFormConfig}
                disabled={savingFormConfig}
                className="ios-btn-submit !py-2 !px-5 !text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingFormConfig ? "Đang áp dụng..." : "Áp dụng & Public"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
