import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  CalendarDays,
  Download,
  LayoutGrid,
  List,
  Eye,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  Search,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
  Send,
  Package,
  MessageSquare,
  Camera,
  Heart,
  Mail,
  Sliders,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { BulkDeleteBar, TableActionsGroup } from "@/components/common/CustomTable";
import { PageHeader, StatCard } from "@/components/dashboard/PageKit";
import { EmptyState, NoSearchResult } from "@/components/dashboard/StateKit";
import { CrudModal, type CrudField, type CrudValues } from "@/components/dashboard/CrudModal";
import { EventWizard } from "@/components/dashboard/EventWizard";
import { EventCheckinGatekeeperModal } from "@/components/events/EventCheckinGatekeeperModal";
import { SupplyDeclarationModal } from "@/components/dashboard/SupplyDeclarationModal";
import { EventFeedbackModal } from "@/components/events/EventFeedbackModal";
import { EventMediaModal } from "@/components/events/EventMediaModal";
import { EventQrStaffSelector } from "@/components/events/EventQrStaffSelector";
import { EventFormConfigModal } from "@/components/events/EventFormConfigModal";
import { EventQrConfigModal } from "@/components/events/EventQrConfigModal";
import { EventLivePhotoGalleryModal } from "@/components/events/EventLivePhotoGalleryModal";
import { EventPartsEditor, createDefaultCeoHn10Parts } from "@/components/events/EventPartsEditor";
import { EventInvitationBuilderModal } from "@/components/events/EventInvitationBuilderModal";
import { OmnichannelBroadcastModal } from "@/components/templates/OmnichannelBroadcastModal";
import { useRole, PERMISSIONS } from "@/hooks/use-role";
import { useAuth } from "@/context/AuthContext";
import { canScanEventQr } from "@/lib/checkin-gatekeeper-auth";
import { TruncatedText } from "@/components/dashboard/TruncatedText";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination, SortHeader } from "@/components/dashboard/DataTablePagination";
import { type EventItem } from "@/lib/events.functions";
import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";
import {
  getEventView,
  setEventView,
  getEventFilters,
  saveEventFilter,
  deleteEventFilter,
  type EventView,
  type EventSavedFilter,
} from "@/lib/event-prefs";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import { exportToExcel, formatDisplayDate } from "@/lib/excel-export";
import { useServerFn } from "@tanstack/react-start";
import { createNotificationFn } from "@/lib/notifications.functions";

export const Route = createFileRoute("/events/")({
  ssr: false,
  loader: async () => {
    try {
      const res = await fetchNestApi<EventItem[]>("/events");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
  component: EventsPage,
});

type Bucket = "all" | "today" | "week" | "upcoming" | "past";

const STATUS_TONE: Record<EventItem["status"], { bg: string; fg: string }> = {
  upcoming: { bg: "oklch(0.93 0.05 255)", fg: "oklch(0.45 0.16 265)" },
  ongoing: { bg: "oklch(0.93 0.07 155)", fg: "oklch(0.40 0.16 155)" },
  completed: { bg: "oklch(0.94 0.005 260)", fg: "oklch(0.50 0.02 260)" },
  cancelled: { bg: "oklch(0.94 0.06 25)", fg: "oklch(0.50 0.20 25)" },
};
const STATUS_KEY: Record<EventItem["status"], TKey> = {
  upcoming: "events.status.upcoming",
  ongoing: "events.status.ongoing",
  completed: "events.status.completed",
  cancelled: "events.status.cancelled",
};
const TYPE_KEY: Record<EventItem["type"], TKey> = {
  khai_giang: "events.type.khai_giang" as TKey,
  year_end_party: "events.type.year_end_party" as TKey,
  teambuilding: "events.type.teambuilding" as TKey,
  be_giang: "events.type.be_giang" as TKey,
  charity: "events.type.charity" as TKey,
  forum: "events.type.forum",
  workshop: "events.type.workshop",
  networking: "events.type.networking",
  training: "events.type.training",
};
// Decorative branded covers per event type — purely visual, no fabricated data.
const TYPE_COVER: Record<EventItem["type"], string> = {
  khai_giang: "linear-gradient(135deg, #071322 0%, #003B95 55%, #0A2540 100%)",
  year_end_party: "linear-gradient(135deg, #3A1005 0%, #B45309 55%, #78350F 100%)",
  teambuilding: "linear-gradient(135deg, #042F2E 0%, #0D9488 55%, #115E59 100%)",
  be_giang: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 55%, #312E81 100%)",
  charity: "linear-gradient(135deg, #0D9488, #047857)",
  forum: "linear-gradient(135deg, oklch(0.55 0.18 265), oklch(0.62 0.16 300))",
  workshop: "linear-gradient(135deg, oklch(0.55 0.15 195), oklch(0.60 0.14 235))",
  networking: "linear-gradient(135deg, oklch(0.58 0.16 330), oklch(0.60 0.16 20))",
  training: "linear-gradient(135deg, oklch(0.55 0.15 155), oklch(0.60 0.14 195))",
};

export const EVENT_DEPARTMENTS = [
  { value: "all", label: "Tất cả các Ban", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "ban_thien_nguyen", label: "Ban Thiện Nguyện", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { value: "ban_hoc_tap", label: "Ban Học tập", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "ban_su_kien", label: "Ban Sự kiện & Hậu cần", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "ban_tai_chinh", label: "Ban Tài chính & Tài trợ", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "ban_truyen_thong", label: "Ban Truyền thông", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "ban_cong_nghe", label: "Ban Công nghệ", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "ban_doi_ngoai", label: "Ban Đối ngoại & Giao thương", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "ban_doi_song", label: "Ban Đời sống & Gắn kết thành viên", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "chung", label: "Sự Kiện Chung Toàn CLB", color: "bg-sky-50 text-sky-700 border-sky-200" },
];

export const DEPARTMENT_LABELS: Record<string, { label: string; color: string }> = {
  ban_thien_nguyen: { label: "Ban Thiện Nguyện", color: "bg-teal-100 text-teal-800 border-teal-200" },
  ban_hoc_tap: { label: "Ban Học tập", color: "bg-blue-100 text-blue-800 border-blue-200" },
  ban_su_kien: { label: "Ban Sự kiện & Hậu cần", color: "bg-slate-100 text-slate-800 border-slate-200" },
  ban_tai_chinh: { label: "Ban Tài chính & Tài trợ", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  ban_truyen_thong: { label: "Ban Truyền thông", color: "bg-rose-100 text-rose-800 border-rose-200" },
  ban_cong_nghe: { label: "Ban Công nghệ", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  ban_doi_ngoai: { label: "Ban Đối ngoại & Giao thương", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  ban_doi_song: { label: "Ban Đời sống & Gắn kết thành viên", color: "bg-amber-100 text-amber-800 border-amber-200" },
  chung: { label: "Toàn CLB", color: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200" },
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function bucketOf(iso: string): Exclude<Bucket, "all"> {
  const today = startOfDay(new Date());
  const d = startOfDay(new Date(iso));
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "past";
  if (diffDays === 0) return "today";
  if (diffDays <= 7) return "week";
  return "upcoming";
}

function getEffectiveStatus(e: {
  status?: EventItem["status"];
  date: string;
}): EventItem["status"] {
  if (e.status === "cancelled") return "cancelled";
  if (e.status === "ongoing") return "ongoing";
  const today = startOfDay(new Date()).getTime();
  const d = startOfDay(new Date(e.date)).getTime();
  if (d < today) return "completed";
  return e.status || "upcoming";
}

function EventsPage() {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const createNotif = useServerFn(createNotificationFn);
  const loaderEvents = Route.useLoaderData() as EventItem[];
  const [events, setEvents] = useState<EventItem[]>(loaderEvents || []);

  useEffect(() => {
    if (Array.isArray(loaderEvents) && loaderEvents.length > 0) {
      setEvents(loaderEvents);
    }
  }, [loaderEvents]);

  // Eager client-side fetch để luôn lấy danh sách sự kiện live từ CSDL 113.20.107.184:6432
  const reloadEvents = async () => {
    try {
      const res = await fetchNestApi<EventItem[]>("/events");
      if (Array.isArray(res)) {
        setEvents(res);
      }
    } catch (err) {
      console.warn("[EventsPage] Eager fetch error:", err);
    }
  };

  useEffect(() => {
    reloadEvents();
  }, []);
  const { can } = useRole();
  const { user } = useAuth();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<EventItem["status"] | "all">("all");
  const [type, setType] = useState<EventItem["type"] | "all">("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [bucket, setBucket] = useState<Bucket>("all");
  const [view, setView] = useState<EventView>("cards");
  const [savedFilters, setSavedFilters] = useState<EventSavedFilter[]>([]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelectEvent = (id: string) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDeleteEvents = async () => {
    if (selectedEventIds.size === 0) return;
    if (typeof window !== "undefined" && !window.confirm(`Xóa vĩnh viễn ${selectedEventIds.size} sự kiện đã chọn?`)) {
      return;
    }
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedEventIds);
      for (const id of ids) {
        await fetchNestApi(`/events/${id}`, { method: "DELETE" }).catch(() => {});
      }
      setEvents((prev) => prev.filter((ev) => !selectedEventIds.has(ev.id)));
      setSelectedEventIds(new Set());
      toast.success(`Đã xóa ${ids.length} sự kiện đã chọn!`);
    } finally {
      setBulkDeleting(false);
    }
  };
  const [open, setOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialType, setWizardInitialType] = useState<EventItem["type"] | undefined>(undefined);

  const isCharityRole = useMemo(() => {
    if (!user) return false;
    const r = (user.role || "").toLowerCase();
    const s = ((user as any).srsRole || "").toLowerCase();
    const dept = ((user as any).department || "").toLowerCase();
    const isSuper = ["admin", "superadmin", "chu_tich", "quan_tri", "lop_truong", "truong_team_lt"].some((x) => r.includes(x) || s.includes(x));
    const isCharity = ["thien_nguyen", "btn", "doi_song"].some((x) => r.includes(x) || s.includes(x) || dept.includes(x));
    return isSuper || isCharity;
  }, [user]);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [qrGatekeeperEvent, setQrGatekeeperEvent] = useState<EventItem | null>(null);
  const [selectedSupplyEvent, setSelectedSupplyEvent] = useState<EventItem | null>(null);
  const [feedbackModalEvent, setFeedbackModalEvent] = useState<EventItem | null>(null);
  const [mediaModalEvent, setMediaModalEvent] = useState<EventItem | null>(null);
  const [formConfigEvent, setFormConfigEvent] = useState<EventItem | null>(null);
  const [qrConfigEvent, setQrConfigEvent] = useState<EventItem | null>(null);
  const [livePhotoEvent, setLivePhotoEvent] = useState<EventItem | null>(null);

  const handleSendPostEventRecap = async (eventId: string, eventName: string) => {
    if (
      !confirm(
        `Xác nhận gửi email và Zalo OA thông báo tổng kết (kèm link Album ảnh và nút Đánh giá sự kiện) cho toàn bộ đại biểu ĐÃ CHECK-IN của sự kiện "${eventName}"?`
      )
    ) {
      return;
    }
    try {
      toast.info("Đang gửi thông báo tổng kết tới các đại biểu đã check-in...");
      const res: any = await fetchNestApi(`/events/${eventId}/send-post-event-recap`, {
        method: "POST",
      });
      if (res && res.ok) {
        toast.success(res.message || "Đã gửi thông báo tổng kết thành công!");
      } else {
        toast.error(res?.message || "Không thể gửi thông báo lúc này");
      }
    } catch (err: any) {
      toast.error("Lỗi khi gửi thông báo: " + (err?.message || ""));
    }
  };
  const [omnichannelModalOpen, setOmnichannelModalOpen] = useState(false);
  const [invitationModalEvent, setInvitationModalEvent] = useState<EventItem | null>(null);
  const [omnichannelEventData, setOmnichannelEventData] = useState<any>({
    title: "",
    subtitle: "",
    date: "",
    time: "",
    location: "",
    posterUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleOpenBroadcastModal = (e?: EventItem) => {
    const target = e || events[0];
    if (target) {
      setInvitationModalEvent(target);
      return;
    }
    setOmnichannelEventData({
      title: "Lễ Khai Giảng CEO HN10",
      subtitle: "CLB Doanh Nhân CEO HN10 (HanoiBA)",
      date: "2026-12-05",
      time: "08:30 - 12:00",
      location: "Trung tâm Hội nghị Quốc gia, Hà Nội",
      posterUrl: "/app-icon.png",
    });
    setOmnichannelModalOpen(true);
  };

  useEffect(() => {
    setView(getEventView());
    setSavedFilters(getEventFilters());
  }, []);

  const changeView = (v: EventView) => {
    setView(v);
    setEventView(v);
  };

  const fields: CrudField[] = [
    { name: "name", label: t("events.col.event"), type: "text", required: true },
    { name: "tagline", label: "Khẩu hiệu / Thông điệp phụ trên Banner (Tagline)", type: "text" },
    { name: "image", label: "Ảnh banner sự kiện", type: "image" },
    { name: "date", label: t("events.col.date"), type: "date", required: true },
    { name: "startTime", label: "Giờ bắt đầu (VD: 08:30)", type: "text" },
    { name: "endTime", label: "Giờ kết thúc (VD: 11:30)", type: "text" },
    { name: "venueName", label: "Tên Hội trường / Phòng tổ chức (hiện trên Thư mời)", type: "text" },
    { name: "location", label: t("events.col.location"), type: "text" },
    {
      name: "parts",
      label: "Các phần chương trình (Phần 1, Phần 2 Dự Tiệc, Phí từng phần)",
      type: "custom",
      render: (val: any, onChange: (v: any) => void) => (
        <EventPartsEditor
          venueName={String((editing as any)?.venueName || "")}
          onChangeVenueName={() => {}}
          parts={Array.isArray(val) && val.length > 0 ? val : createDefaultCeoHn10Parts()}
          onChangeParts={onChange}
        />
      ),
    },
    {
      name: "changeReason",
      label: "Lý do thay đổi thời gian / địa điểm / hủy (Hệ thống sẽ gửi email tự động tới các đại biểu)",
      type: "textarea",
    },
    {
      name: "qrStaff",
      label: "Người thực hiện quét mã QR (Ban Truyền Thông)",
      type: "custom",
      render: (val, onChange) => (
        <EventQrStaffSelector value={val || []} onChange={onChange} />
      ),
    },
    { name: "capacity", label: t("events.kpi.capacity"), type: "number" },
    { name: "description", label: "Mô tả / Thông tin sự kiện", type: "textarea" },
    {
      name: "photoGalleryUrl",
      label: "Link album ảnh sự kiện (Google Drive / Cloud storage)",
      type: "text",
    },
    {
      name: "department",
      label: "Ban Phụ Trách / Đơn Vị Tổ Chức",
      type: "select",
      options: [
        { value: "ban_thien_nguyen", label: "Ban Thiện Nguyện & Đời Sống" },
        { value: "ban_su_kien", label: "Ban Sự Kiện & Hậu Cần" },
        { value: "ban_dao_tao", label: "Ban Đào Tạo & Phát Triển" },
        { value: "ban_b2b", label: "Ban B2B & Giao Thương" },
        { value: "ban_truyen_thong", label: "Ban Truyền Thông" },
        { value: "ban_dieu_hanh", label: "Ban Điều Hành" },
        { value: "chung", label: "Sự Kiện Chung Toàn CLB" },
      ],
    },
    {
      name: "ticketPrice",
      label: "Giá vé / Phí tham dự (VNĐ - Điền 0 nếu Miễn phí)",
      type: "number",
    },
    {
      name: "type",
      label: t("events.col.type"),
      type: "select",
      options: [
        { value: "khai_giang", label: t("events.type.khai_giang" as never) },
        { value: "year_end_party", label: t("events.type.year_end_party" as never) },
        { value: "teambuilding", label: t("events.type.teambuilding" as never) },
        { value: "be_giang", label: t("events.type.be_giang" as never) },
        { value: "charity", label: t("events.type.charity" as never) },
        { value: "forum", label: t("events.type.forum") },
        { value: "workshop", label: t("events.type.workshop") },
        { value: "networking", label: t("events.type.networking") },
        { value: "training", label: t("events.type.training") },
      ],
    },
    {
      name: "status",
      label: t("events.col.status"),
      type: "select",
      options: [
        { value: "upcoming", label: t("events.status.upcoming") },
        { value: "ongoing", label: t("events.status.ongoing") },
        { value: "completed", label: t("events.status.completed") },
        { value: "cancelled", label: t("events.status.cancelled") },
      ],
    },
  ];

  const onSubmit = async (v: CrudValues) => {
    const loc = String(v.location || "").trim();
    const dt = String(v.date || "").trim();

    setSubmitting(true);
    try {
      const payload = {
        name: String(v.name || "").trim(),
        tagline: v.tagline ? String(v.tagline).trim() : "",
        image: v.image || null,
        banner: v.image || null,
        date: dt || new Date().toISOString().slice(0, 10),
        startTime: v.startTime ? String(v.startTime).trim() : null,
        endTime: v.endTime ? String(v.endTime).trim() : null,
        venueName: v.venueName ? String(v.venueName).trim() : "",
        parts: Array.isArray(v.parts) ? v.parts : [],
        location: loc,
        capacity: v.capacity ? Number(v.capacity) : 100,
        description: v.description ? String(v.description).trim() : "",
        changeReason: v.changeReason ? String(v.changeReason).trim() : undefined,
        reason: v.changeReason ? String(v.changeReason).trim() : undefined,
        photoGalleryUrl: v.photoGalleryUrl ? String(v.photoGalleryUrl).trim() : "",
        department: v.department || "ban_su_kien",
        ticketPrice: v.ticketPrice !== undefined && v.ticketPrice !== "" ? Number(v.ticketPrice) : 0,
        fee: v.ticketPrice !== undefined && v.ticketPrice !== "" ? Number(v.ticketPrice) : 0,
        type: v.type || "forum",
        status: v.status || "upcoming",
        qrStaff: v.qrStaff || [],
        qrScanners: v.qrStaff || [],
        associationId: (user as any)?.associationId || "a0000000-0000-4000-8000-000000000010",
      };
      if (editing) {
        await fetchNestApi(`/events/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success(t("common.updated"));
      } else {
        await fetchNestApi("/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        // Phát thông báo in-app đồng bộ tới Member App
        try {
          await createNotif({
            data: {
              title: `[Sự kiện mới] ${payload.name || "Sự kiện Hiệp hội CEO HN10"}`,
              body: `Sự kiện "${payload.name}" diễn ra vào ${payload.date} tại ${payload.location || "Hội trường CLB CEO HN10"}. Kính mời toàn thể Quý Học viên đăng ký tham gia!`,
              category: "event",
              audience: "all",
              channel: "inapp",
              appScope: "all",
              targetApp: "all",
              status: "sent",
              actionUrl: `/association/events`,
            },
          });
        } catch (notifErr) {
          console.warn("[Events] Could not dispatch notification:", notifErr);
        }
        toast.success(t("common.created"));
      }
      setOpen(false);
      setEditing(null);
      await reloadEvents();
      await router.invalidate();
    } catch (err: any) {
      console.error("[Events] Submit error:", err);
      toast.error(err?.message || "Không thể lưu sự kiện. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (e: EventItem) => {
    if (!window.confirm(t("events.deleteConfirm", { name: e.name }))) return;
    setDeletingId(e.id);
    try {
      await fetchNestApi(`/events/${e.id}`, { method: "DELETE" });
      toast.success(t("events.deleted"));
      await reloadEvents();
      await router.invalidate();
    } catch (err: any) {
      console.error("[Events] Delete error:", err);
      toast.error(err?.message || t("events.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  const bucketCounts = useMemo(() => {
    const c: Record<Bucket, number> = {
      all: events.length,
      today: 0,
      week: 0,
      upcoming: 0,
      past: 0,
    };
    for (const e of events) c[bucketOf(e.date)]++;
    return c;
  }, [events]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return events
      .filter((e: any) => {
        if (status === "all") return true;
        const eff = getEffectiveStatus(e);
        return eff === status || e.status === status;
      })
      .filter((e: any) => (type === "all" ? true : e.type === type))
      .filter((e: any) => {
        if (departmentFilter === "all") return true;
        const dept = e.department || "ban_su_kien";
        return dept === departmentFilter;
      })
      .filter((e: any) => (bucket === "all" ? true : bucketOf(e.date) === bucket))
      .filter(
        (e) => !ql || e.name.toLowerCase().includes(ql) || e.location.toLowerCase().includes(ql),
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [q, status, type, departmentFilter, bucket, events]);

  const accessors = useMemo(
    () => ({
      name: (e: EventItem) => e.name,
      date: (e: EventItem) => e.date,
      type: (e: EventItem) => e.type,
      location: (e: EventItem) => e.location,
      status: (e: EventItem) => e.status,
      registered: (e: EventItem) => e.registered,
      capacity: (e: EventItem) => e.capacity,
    }),
    [],
  );

  const tc = useTableControls(filtered, accessors, {
    initialPageSize: 10,
    initialSortKey: "date",
    initialSortDir: "asc",
  });

  // Featured = soonest upcoming, non-cancelled event (visual highlight only).
  const featured = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    return events
      .filter(
        (e: any) => e.status !== "cancelled" && startOfDay(new Date(e.date)).getTime() >= today,
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [events]);

  const totalReg = events.reduce((s, e) => s + e.registered, 0);
  const totalCap = events.reduce((s, e) => s + e.capacity, 0);

  const hasActiveFilter = q.trim() !== "" || status !== "all" || type !== "all" || bucket !== "all";

  const applySaved = (f: EventSavedFilter) => {
    setQ(f.q);
    setStatus((f.status as EventItem["status"] | "all") || "all");
    setType((f.type as EventItem["type"] | "all") || "all");
    setBucket((f.bucket as Bucket) || "all");
  };

  const onSaveFilter = () => {
    const name = window.prompt(t("events.saveFilterPrompt"));
    if (!name || !name.trim()) return;
    const next = saveEventFilter({
      id: `${Date.now()}`,
      name: name.trim(),
      q,
      status,
      type,
      bucket,
    });
    setSavedFilters(next);
    toast.success(t("events.filterSaved"));
  };

  const onDeleteFilter = (id: string) => {
    setSavedFilters(deleteEventFilter(id));
    toast.success(t("events.filterDeleted"));
  };

  const clearFilters = () => {
    setQ("");
    setStatus("all");
    setType("all");
    setBucket("all");
  };

  const handleExport = () => {
    exportToExcel<EventItem>({
      title: "BÁO CÁO TỔNG HỢP SỰ KIỆN & HỘI NGHỊ HIỆP HỘI DOANH NHÂN CEO HN10",
      subtitle: "Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)",
      filename: "danh-sach-su-kien-ceohn10",
      sheetName: "Danh_Sach_Su_Kien",
      data: filtered,
      columns: [
        { header: "Mã sự kiện", key: "id", width: 16, value: (e) => e.id },
        { header: "Tên sự kiện / Hội nghị", key: "name", width: 35, value: (e) => e.name },
        { header: "Ngày tổ chức", key: "date", width: 16, value: (e) => formatDisplayDate(e.date) },
        { header: "Địa điểm tổ chức", key: "location", width: 32, value: (e) => e.location },
        { header: "Phân loại", key: "type", width: 18, value: (e) => e.type },
        { header: "Trạng thái", key: "status", width: 18, value: (e) => (e.status === "upcoming" ? "Sắp diễn ra" : e.status === "ongoing" ? "Đang diễn ra" : "Đã kết thúc") },
        { header: "Số đại biểu đăng ký", key: "registered", width: 22, value: (e) => e.registered },
        { header: "Sức chứa tối đa", key: "capacity", width: 18, value: (e) => e.capacity },
        {
          header: "Tỷ lệ lấp đầy (%)",
          key: "occupancy",
          width: 18,
          value: (e) => (e.capacity ? `${Math.round((e.registered / e.capacity) * 100)}%` : "100%"),
        },
      ],
      summaryRows: [
        [
          "TỔNG SỐ ĐẠI BIỂU ĐĂNG KÝ:",
          "",
          "",
          "",
          "",
          "",
          filtered.reduce((acc, e) => acc + (Number(e.registered) || 0), 0),
          filtered.reduce((acc, e) => acc + (Number(e.capacity) || 0), 0),
          "",
        ],
      ],
      signerTitles: ["NGƯỜI LẬP BIỂU", "TRƯỞNG BAN SỰ KIỆN", "CHỦ TỊCH CLB CEO HN10"],
    });
    toast.success("Đã xuất danh sách sự kiện chuẩn doanh nghiệp CEO HN10 (.xlsx)!");
  };

  const handleBroadcastEventToFeed = async (e: EventItem) => {
    try {
      const poster =
        (e as any).image ||
        (e as any).banner ||
        (e as any).imageUrl ||
        (e as any).coverUrl ||
        (e as any).bannerUrl ||
        "/app-icon.png";
      const regUrl = `https://ceohn10.viconnect.vn/guest-event-register/${e.id}`;
      const checkinQr = regUrl; // Mã QR chứa trực tiếp đường link đăng ký

      await fetchNestApi("/feed", {
        method: "POST",
        body: JSON.stringify({
          title: `[SỰ KIỆN CLB] ${e.name}`,
          content: `🎉 SỰ KIỆN CLB DOANH NHÂN CEO HN10:
${e.name}

⏰ Thời gian: ${new Date(e.date).toLocaleString("vi-VN")}
📍 Địa điểm: ${e.location || "Trụ sở CLB CEO HN10"}
🎟️ Vé tham dự: ${e.ticketPrice && Number(e.ticketPrice) > 0 ? Number(e.ticketPrice).toLocaleString("vi-VN") + " VNĐ" : "Miễn phí dành cho Học viên"}

${(e as any).description ? `📝 Chi tiết: ${(e as any).description}\n\n` : ""}👉 Quý Doanh nhân bấm vào mã QR hoặc truy cập đường link để đăng ký tham gia: ${regUrl}`,
          category: "EVENT_MEETING",
          department: "Ban Sự Kiện",
          images: [poster],
          posterUrl: poster,
          qrCodeUrl: checkinQr,
          meetingLink: regUrl,
          invitationLetterUrl: (e as any).invitationUrl || poster,
        }),
      }).catch((err) => {
        console.warn("Feed event broadcast fallback:", err);
      });

      toast.success(
        "Đã bắn chi tiết sự kiện kèm Poster, Thư mời & Mã QR gắn link xuống Mạng lưới thành công!"
      );
    } catch {
      toast.error("Không thể bắn sự kiện xuống Bảng tin");
    }
  };

  const buckets: { key: Bucket; label: TKey }[] = [
    { key: "all", label: "events.bucket.all" },
    { key: "today", label: "events.bucket.today" },
    { key: "week", label: "events.bucket.week" },
    { key: "upcoming", label: "events.bucket.upcoming" },
    { key: "past", label: "events.bucket.past" },
  ];

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <PageHeader
            title={t("events.title")}
            subtitle={t("events.subtitle")}
            actions={
              <>
                {can("EVTO_EXPORT") && (
                  <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-muted cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-muted-foreground" />
                    {t("common.export")}
                  </button>
                )}
                {isCharityRole && (
                  <button
                    onClick={() => {
                      setWizardInitialType("charity");
                      setWizardOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-500/20 cursor-pointer transition active:scale-95"
                  >
                    <Heart className="h-4 w-4" />
                    Tạo Sự Kiện Thiện Nguyện
                  </button>
                )}
                {can(PERMISSIONS.EVENT_CREATE) && (
                  <button
                    onClick={() => {
                      setWizardInitialType(undefined);
                      setWizardOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] cursor-pointer"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Plus className="h-4 w-4" />
                    {t("events.create")}
                  </button>
                )}
              </>
            }
          />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label={t("events.kpi.total")}
            value={events.length}
            icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
          />
          <StatCard
            label={t("events.kpi.upcoming")}
            value={events.filter((e: any) => getEffectiveStatus(e) === "upcoming").length}
            tone="info"
            icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
          />
          <StatCard
            label={t("events.kpi.totalReg")}
            value={fmt.num(totalReg)}
            hint={
              totalCap > 0
                ? t("events.kpi.fillRate", { n: Math.round((totalReg / totalCap) * 100) })
                : undefined
            }
            tone="success"
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
          />
          <StatCard
            label={t("events.kpi.capacity")}
            value={fmt.num(totalCap)}
            tone="warning"
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
          />
        </div>

        {/* Featured event */}
        {featured && (
          <FeaturedCard
            event={featured}
            onOpen={() =>
              router.navigate({ to: "/events/$eventId", params: { eventId: featured.id } })
            }
          />
        )}

        {/* Sticky search + controls */}
        <div className="sm:sticky sm:top-18 z-20 mb-5 rounded-2xl border border-border bg-card/90 p-3 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full min-w-0 sm:min-w-[220px] sm:flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("events.searchPh")}
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-11 min-w-0 rounded-lg border border-border bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-10 text-slate-800 dark:text-slate-200"
              >
                {EVENT_DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventItem["type"] | "all")}
                className="h-11 min-w-0 rounded-lg border border-border bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-10"
              >
                <option value="all">{t("events.filter.allTypes")}</option>
                <option value="khai_giang">{t("events.type.khai_giang" as never)}</option>
                <option value="year_end_party">{t("events.type.year_end_party" as never)}</option>
                <option value="teambuilding">{t("events.type.teambuilding" as never)}</option>
                <option value="be_giang">{t("events.type.be_giang" as never)}</option>
                <option value="charity">{t("events.type.charity" as never)}</option>
                <option value="forum">{t("events.type.forum")}</option>
                <option value="workshop">{t("events.type.workshop")}</option>
                <option value="networking">{t("events.type.networking")}</option>
                <option value="training">{t("events.type.training")}</option>
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventItem["status"] | "all")}
                className="h-11 min-w-0 rounded-lg border border-border bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-10"
              >
                <option value="all">{t("common.allStatuses")}</option>
                <option value="upcoming">{t("events.status.upcoming")}</option>
                <option value="ongoing">{t("events.status.ongoing")}</option>
                <option value="completed">{t("events.status.completed")}</option>
                <option value="cancelled">{t("events.status.cancelled")}</option>
              </select>

              {/* View toggle */}
              <div className="col-span-2 flex items-center gap-1 rounded-lg border border-border bg-background p-1 sm:col-span-1">
                <button
                  type="button"
                  onClick={() => changeView("table")}
                  aria-label="Xem bảng"
                  aria-pressed={view === "table"}
                  title="Xem bảng"
                  className={`grid h-9 flex-1 place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-8 sm:w-8 sm:flex-none ${view === "table"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => changeView("cards")}
                  aria-label={t("events.view.cards")}
                  aria-pressed={view === "cards"}
                  title={t("events.view.cards")}
                  className={`grid h-9 flex-1 place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-8 sm:w-8 sm:flex-none ${view === "cards"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => changeView("calendar")}
                  aria-label={t("events.view.calendar")}
                  aria-pressed={view === "calendar"}
                  title={t("events.view.calendar")}
                  className={`grid h-9 flex-1 place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-8 sm:w-8 sm:flex-none ${view === "calendar"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Department quick filter bar */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 pt-1.5 border-t border-border/50 no-scrollbar">
            <span className="text-xs font-bold text-muted-foreground shrink-0 mr-1">Ban phụ trách:</span>
            {EVENT_DEPARTMENTS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDepartmentFilter(d.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${departmentFilter === d.value
                    ? "bg-[#003B95] text-white border-[#003B95] shadow-xs"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
                  }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Time buckets */}
          <div className="-mx-3 mt-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
            {buckets.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => setBucket(b.key)}
                aria-pressed={bucket === b.key}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:py-1.5 ${bucket === b.key
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
              >
                {t(b.label)} ({bucketCounts[b.key]})
              </button>
            ))}
            <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground">
              {t("events.results", { n: filtered.length })}
            </span>
          </div>

          {/* Saved filters */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {savedFilters.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background py-1 pl-3 pr-1 text-xs font-medium text-foreground"
              >
                <button type="button" onClick={() => applySaved(f)} className="hover:text-primary">
                  {f.name}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteFilter(f.id)}
                  aria-label={t("events.filterDeleted")}
                  className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ))}
            {hasActiveFilter && (
              <>
                <button
                  type="button"
                  onClick={onSaveFilter}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <Star className="h-3 w-3" aria-hidden="true" /> {t("events.saveFilter")}
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" aria-hidden="true" /> {t("mdetail.reviews.clear")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          hasActiveFilter ? (
            <NoSearchResult />
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title={t("events.empty")}
              action={
                <button
                  onClick={() => {
                    setWizardOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Plus className="h-4 w-4" /> {t("events.create")}
                </button>
              }
            />
          )
        ) : view === "table" ? (
          <div className="space-y-2">
            {can(PERMISSIONS.EVENT_DELETE) && (
              <BulkDeleteBar
                selectedCount={selectedEventIds.size}
                onBulkDelete={handleBulkDeleteEvents}
                onClear={() => setSelectedEventIds(new Set())}
                label="Xóa các sự kiện đã chọn"
                busy={bulkDeleting}
              />
            )}
            <div className="self-stretch relative bg-white dark:bg-card rounded-[20px] outline outline-1 outline-slate-200 dark:outline-slate-800 flex flex-col justify-start items-start overflow-hidden shadow-xs">
              <div className="overflow-x-auto relative w-full">
                <table className="w-full min-w-[1200px] whitespace-nowrap text-sm border-collapse">
                  <thead>
                    <tr className="h-16 bg-blue-50/70 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100">
                      <th className="sticky left-0 z-20 w-[72px] min-w-[72px] max-w-[72px] bg-blue-50/90 dark:bg-blue-950/90 px-2 py-3 text-center border-r border-b border-slate-200 dark:border-slate-800 select-none">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <input
                            type="checkbox"
                            aria-label="Chọn tất cả"
                            checked={tc.pageRows.length > 0 && tc.pageRows.every((r: any) => selectedEventIds.has(r.id))}
                            onChange={() => {
                              const allSel = tc.pageRows.length > 0 && tc.pageRows.every((r: any) => selectedEventIds.has(r.id));
                              setSelectedEventIds((prev) => {
                                const next = new Set(prev);
                                tc.pageRows.forEach((r: any) => (allSel ? next.delete(r.id) : next.add(r.id)));
                                return next;
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[#003B95] cursor-pointer"
                          />
                          <span>STT</span>
                        </div>
                      </th>
                    <th className="sticky left-[56px] z-20 min-w-[100px] bg-blue-50/90 dark:bg-blue-950/90 px-4 py-3 border-r border-b border-slate-200 dark:border-slate-800 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] text-left">
                      Mã
                    </th>
                    <SortHeader
                      label="Tên sự kiện"
                      columnKey="name"
                      sortKey={tc.sortKey}
                      sortDir={tc.sortDir}
                      onSort={tc.toggleSort}
                      width={260}
                      className="border-r border-slate-200 dark:border-slate-800"
                    />
                    <SortHeader
                      label="Thời gian"
                      columnKey="date"
                      sortKey={tc.sortKey}
                      sortDir={tc.sortDir}
                      onSort={tc.toggleSort}
                      width={130}
                      className="border-r border-slate-200 dark:border-slate-800"
                    />
                    <SortHeader
                      label="Địa điểm"
                      columnKey="location"
                      sortKey={tc.sortKey}
                      sortDir={tc.sortDir}
                      onSort={tc.toggleSort}
                      width={220}
                      className="border-r border-slate-200 dark:border-slate-800"
                    />
                    <SortHeader
                      label="Phân loại"
                      columnKey="type"
                      sortKey={tc.sortKey}
                      sortDir={tc.sortDir}
                      onSort={tc.toggleSort}
                      width={130}
                      className="border-r border-slate-200 dark:border-slate-800"
                    />
                    <th className="px-4 py-3 border-r border-b border-slate-200 dark:border-slate-800 text-left min-w-[150px]">
                      Ban phụ trách
                    </th>
                    <SortHeader
                      label="Giá vé / Phí"
                      columnKey="ticketPrice"
                      sortKey={tc.sortKey}
                      sortDir={tc.sortDir}
                      onSort={tc.toggleSort}
                      width={140}
                      className="border-r border-slate-200 dark:border-slate-800"
                    />
                    <th className="px-4 py-3 border-r border-b border-slate-200 dark:border-slate-800 text-left min-w-[150px]">
                      Đăng ký / Sức chứa
                    </th>
                    <SortHeader
                      label="Trạng thái"
                      columnKey="status"
                      sortKey={tc.sortKey}
                      sortDir={tc.sortDir}
                      onSort={tc.toggleSort}
                      width={130}
                      className="border-r border-slate-200 dark:border-slate-800"
                    />
                    <th className="sticky right-0 z-20 min-w-[170px] bg-blue-50/90 dark:bg-blue-950/90 px-4 py-3 text-center font-bold uppercase tracking-wider border-l border-b border-slate-200 dark:border-slate-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                      THAO TÁC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {tc.pageRows.map((e: any, idx: number) => {
                    const tone =
                      STATUS_TONE[e.status as keyof typeof STATUS_TONE] ?? STATUS_TONE.upcoming;
                    const d = new Date(e.date);
                    return (
                      <tr
                        key={e.id}
                        className="group border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer"
                        onClick={(evt) => {
                          if ((evt.target as HTMLElement).closest("a,button")) return;
                          router.navigate({ to: "/events/$eventId", params: { eventId: e.id } });
                        }}
                      >
                        <td
                          className="sticky left-0 z-10 w-[72px] min-w-[72px] max-w-[72px] bg-card group-hover:bg-muted/70 px-2 py-3.5 text-center text-xs font-medium text-muted-foreground border-r border-b border-slate-200 dark:border-slate-800 transition-colors"
                          onClick={(evt) => evt.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <input
                              type="checkbox"
                              checked={selectedEventIds.has(e.id)}
                              onChange={() => toggleSelectEvent(e.id)}
                              aria-label="Chọn sự kiện"
                              className="h-4 w-4 rounded border-slate-300 text-[#003B95] cursor-pointer"
                            />
                            <span>{(tc.page - 1) * tc.pageSize + idx + 1}</span>
                          </div>
                        </td>
                        <td className="sticky left-[56px] z-10 min-w-[100px] bg-card group-hover:bg-muted/70 px-4 py-3.5 font-mono text-[12px] font-semibold text-primary border-r border-b border-slate-200 dark:border-slate-800 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors whitespace-nowrap">
                          EV-{e.id.slice(0, 6).toUpperCase()}
                        </td>
                        <td className="px-4 py-3.5 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          <TruncatedText
                            text={e.name}
                            maxWidth="max-w-[280px]"
                            className="font-semibold text-foreground text-xs"
                          />
                        </td>
                        <td className="px-4 py-3.5 text-xs border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          <span className="font-semibold text-foreground text-xs">
                            {d.toLocaleDateString("vi-VN")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <TruncatedText text={e.location || "Online / Khách Sạn Daewoo"} maxWidth="max-w-[240px]" className="text-foreground font-medium text-xs" />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          <span className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {t(TYPE_KEY[e.type as EventItem["type"]] ?? "events.type.forum")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          {(() => {
                            const dept = e.department || "ban_su_kien";
                            const deptInfo = DEPARTMENT_LABELS[dept] || { label: "Ban Sự Kiện", color: "bg-rose-100 text-rose-800 border-rose-200" };
                            return (
                              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${deptInfo.color}`}>
                                {deptInfo.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3.5 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          {e.ticketPrice && Number(e.ticketPrice) > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                              {fmt.money(Number(e.ticketPrice))}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              Miễn phí
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          <div className="text-xs font-semibold text-foreground">
                            {e.registered} / {e.capacity}
                          </div>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary mt-1">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${Math.min(100, Math.round((e.registered / (e.capacity || 1)) * 100))}%`,
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 border-r border-b border-slate-200 dark:border-slate-800">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ background: tone.bg, color: tone.fg }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: tone.fg }}
                            />
                            {t(
                              STATUS_KEY[e.status as EventItem["status"]] ?? "events.status.upcoming",
                            )}
                          </span>
                        </td>
                        <td className="sticky right-0 z-10 min-w-[170px] bg-card group-hover:bg-muted/70 px-4 py-3.5 text-center border-l border-b border-slate-200 dark:border-slate-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] transition-colors">
                          <TableActionsGroup maxVisible={3}>
                            <Link
                              to="/events/$eventId"
                              params={{ eventId: e.id }}
                              title="Xem chi tiết sự kiện"
                              className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-border bg-background text-primary hover:bg-primary/10 transition"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {can(PERMISSIONS.EVENT_EDIT) && (
                              <button
                                onClick={() => {
                                  setEditing(e);
                                  setOpen(true);
                                }}
                                title="Chỉnh sửa sự kiện"
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-border bg-background text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canScanEventQr(user, e) && (
                              <button
                                type="button"
                                title="Quản lý Check-in & QR Gatekeeper"
                                onClick={(evt) => {
                                  evt.stopPropagation();
                                  setQrGatekeeperEvent(e);
                                }}
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition cursor-pointer"
                              >
                                <QrCode className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              title="Gửi thư mời đa kênh (Word/Excel/Zalo/Email)"
                              onClick={(evt) => {
                                evt.stopPropagation();
                                handleOpenBroadcastModal(e);
                              }}
                              className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition cursor-pointer"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            {can(PERMISSIONS.EVENT_DELETE) && (
                              <button
                                onClick={() => onDelete(e)}
                                disabled={deletingId === e.id}
                                title="Xóa sự kiện"
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-destructive/20 bg-background text-destructive hover:bg-destructive/10 disabled:opacity-50 transition cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </TableActionsGroup>
                        </td>
                      </tr>
                    );
                  })}
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
          </div>
        ) : view === "cards" ? (
          <div className="space-y-4">
            {can(PERMISSIONS.EVENT_DELETE) && (
              <BulkDeleteBar
                selectedCount={selectedEventIds.size}
                onBulkDelete={handleBulkDeleteEvents}
                onClear={() => setSelectedEventIds(new Set())}
                label="Xóa các sự kiện đã chọn"
                busy={bulkDeleting}
              />
            )}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {tc.pageRows.map((e: any) => (
                <div key={e.id} className="relative">
                  {can(PERMISSIONS.EVENT_DELETE) && (
                    <label
                      onClick={(evt) => evt.stopPropagation()}
                      className="absolute top-3 left-3 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 shadow-md border border-slate-200 cursor-pointer"
                      title="Chọn sự kiện"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEventIds.has(e.id)}
                        onChange={() => toggleSelectEvent(e.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#003B95] cursor-pointer"
                      />
                    </label>
                  )}
                  <EventCard
                    event={e}
                  deleting={deletingId === e.id}
                  onEdit={() => {
                    setEditing(e);
                    setOpen(true);
                  }}
                  onDelete={() => onDelete(e)}
                  onQrGatekeeper={() => setQrGatekeeperEvent(e)}
                  onBroadcastToFeed={() => handleBroadcastEventToFeed(e)}
                  onSupply={() => setSelectedSupplyEvent(e)}
                  onFeedback={() => setFeedbackModalEvent(e)}
                  onMedia={() => setMediaModalEvent(e)}
                />
                </div>
              ))}
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
        ) : (
          <CalendarView events={filtered} />
        )}

        <CrudModal
          open={open}
          title={editing ? t("common.editTitle") : t("events.create")}
          fields={fields}
          initial={
            editing
              ? ({
                ...editing,
                sponsors: editing.sponsors || [],
                qrStaff: (editing as any).qrStaff || (editing as any).qrScanners || [],
              } as unknown as CrudValues)
              : { sponsors: [], qrStaff: [] }
          }
          submitting={submitting}
          submitLabel={editing ? t("common.save") : t("common.create")}
          cancelLabel={t("common.cancel")}
          onSubmit={onSubmit}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
        />

        <EventWizard
          open={wizardOpen}
          initialType={wizardInitialType}
          onClose={() => {
            setWizardOpen(false);
            setWizardInitialType(undefined);
          }}
          onCreated={(ev) => {
            setWizardOpen(false);
            setWizardInitialType(undefined);
            router.invalidate();
            router.navigate({ to: "/events/$eventId", params: { eventId: ev.id } });
          }}
        />

        <EventCheckinGatekeeperModal
          open={!!qrGatekeeperEvent}
          event={qrGatekeeperEvent}
          onClose={() => setQrGatekeeperEvent(null)}
          onUpdateEvent={() => router.invalidate()}
        />

        {selectedSupplyEvent && (
          <SupplyDeclarationModal
            open={!!selectedSupplyEvent}
            targetType="event"
            targetId={selectedSupplyEvent.id}
            targetName={selectedSupplyEvent.name}
            department="Ban Sự Kiện & Hậu Cần"
            onClose={() => setSelectedSupplyEvent(null)}
          />
        )}

        {feedbackModalEvent && (
          <EventFeedbackModal
            open={!!feedbackModalEvent}
            eventId={feedbackModalEvent.id}
            eventName={feedbackModalEvent.name}
            onClose={() => setFeedbackModalEvent(null)}
          />
        )}

        {mediaModalEvent && (
          <EventMediaModal
            open={!!mediaModalEvent}
            eventId={mediaModalEvent.id}
            eventName={mediaModalEvent.name}
            existingGalleryUrl={(mediaModalEvent as any).photoGalleryUrl || (mediaModalEvent as any).photo_gallery_url}
            onClose={() => setMediaModalEvent(null)}
            onUpdated={() => router.invalidate()}
          />
        )}

        {formConfigEvent && (
          <EventFormConfigModal
            open={!!formConfigEvent}
            eventId={formConfigEvent.id}
            eventName={formConfigEvent.name}
            initialConfig={(formConfigEvent as any).form_config || (formConfigEvent as any).formConfig}
            onClose={() => setFormConfigEvent(null)}
            onSaved={() => router.invalidate()}
          />
        )}

        {qrConfigEvent && (
          <EventQrConfigModal
            open={!!qrConfigEvent}
            event={qrConfigEvent}
            onClose={() => setQrConfigEvent(null)}
            onSaved={() => router.invalidate()}
          />
        )}

        {livePhotoEvent && (
          <EventLivePhotoGalleryModal
            open={!!livePhotoEvent}
            eventId={livePhotoEvent.id}
            eventName={livePhotoEvent.name}
            onClose={() => setLivePhotoEvent(null)}
          />
        )}

        <OmnichannelBroadcastModal
          open={omnichannelModalOpen}
          onClose={() => setOmnichannelModalOpen(false)}
          invitationData={omnichannelEventData}
          onSuccess={() => router.invalidate()}
        />

        <EventInvitationBuilderModal
          open={!!invitationModalEvent}
          event={invitationModalEvent}
          onClose={() => setInvitationModalEvent(null)}
        />
      </div>
    </AppShell>
  );
}

function CapacityBar({ registered, capacity }: { registered: number; capacity: number }) {
  const t = useT();
  const pct = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
  const spots = Math.max(0, capacity - registered);
  const full = capacity > 0 && registered >= capacity;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t("events.col.reg")}</span>
        <span className="font-semibold text-foreground">
          {registered}/{capacity}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: full ? "oklch(0.55 0.2 25)" : "var(--gradient-primary)",
          }}
        />
      </div>
      <p className="mt-1 text-[11px] font-medium text-muted-foreground">
        {full ? t("events.full") : t("events.spotsLeft", { n: spots })}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status?: EventItem["status"] }) {
  const t = useT();
  const validStatus: EventItem["status"] = status && STATUS_TONE[status] ? status : "upcoming";
  const s = STATUS_TONE[validStatus] ?? STATUS_TONE.upcoming;
  const labelKey = STATUS_KEY[validStatus] ?? "events.status.upcoming";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} aria-hidden="true" />
      {t(labelKey)}
    </span>
  );
}

function EventCard({
  event: e,
  deleting,
  onEdit,
  onDelete,
  onQrGatekeeper,
  onBroadcastToFeed,
  onSupply,
  onFeedback,
  onMedia,
}: {
  event: EventItem;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onQrGatekeeper?: () => void;
  onBroadcastToFeed?: () => void;
  onSupply?: () => void;
  onFeedback?: () => void;
  onMedia?: () => void;
}) {
  const t = useT();
  const fmt = useFmt();
  const { can } = useRole();
  const { user } = useAuth();
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]">
      <div
        className="relative h-48 w-full aspect-[16/9] overflow-hidden"
        style={{ background: TYPE_COVER[e.type] ?? TYPE_COVER.forum }}
      >
        {(() => {
          const typeFallbacks: Record<string, string> = {
            forum:
              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
            workshop:
              "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
            networking:
              "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
            training:
              "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
          };
          const fallback = typeFallbacks[e.type] || typeFallbacks.forum;
          const raw =
            (e as any).imageUrl || (e as any).image || (e as any).bannerUrl || (e as any).coverUrl;
          const resolved = resolveMediaUrl(raw) || raw || fallback;
          return (
            <img
              src={resolved}
              alt={e.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(ev) => {
                const target = ev.target as HTMLImageElement;
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
          );
        })()}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
        <div className="absolute left-3 top-3">
          <StatusPill status={getEffectiveStatus(e)} />
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {e.ticketPrice && Number(e.ticketPrice) > 0 ? (
            <span className="rounded-full bg-amber-500 text-slate-950 font-black px-2.5 py-1 text-[11px] shadow-sm backdrop-blur">
              {fmt.money(Number(e.ticketPrice))}
            </span>
          ) : (
            <span className="rounded-full bg-emerald-600 text-white font-bold px-2.5 py-1 text-[11px] shadow-sm backdrop-blur">
              Miễn phí
            </span>
          )}
          <span className="rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground backdrop-blur">
            {t(TYPE_KEY[e.type] ?? "events.type.forum")}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {/* Department Badge */}
        {(() => {
          const dept = e.department || "ban_su_kien";
          const deptInfo = DEPARTMENT_LABELS[dept] || { label: "Ban Sự Kiện & Hậu Cần", color: "bg-rose-100 text-rose-800 border-rose-200" };
          return (
            <div className="mb-2">
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border ${deptInfo.color}`}>
                🏛️ {deptInfo.label}
              </span>
            </div>
          );
        })()}
        <div className="mb-3 flex items-start justify-between gap-2">
          <Link
            to="/events/$eventId"
            params={{ eventId: e.id }}
            className="line-clamp-2 text-base font-semibold text-foreground transition hover:text-primary"
          >
            {e.name}
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            {onBroadcastToFeed && (
              <button
                type="button"
                onClick={onBroadcastToFeed}
                aria-label="Bắn chi tiết sự kiện xuống Mạng lưới"
                title="Bắn chi tiết sự kiện kèm Poster & QR xuống Mạng lưới"
                className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-500/15 hover:text-blue-700"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {canScanEventQr(user, e) && (
              <button
                type="button"
                onClick={onQrGatekeeper}
                aria-label="Quản lý Check-in & Gatekeeper QR"
                title="Quản lý Check-in & Gatekeeper QR"
                className="rounded-lg p-1.5 text-amber-600 transition hover:bg-amber-500/15 hover:text-amber-700"
              >
                <QrCode className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {onSupply && (
              <button
                type="button"
                onClick={onSupply}
                aria-label="Khai báo vật dụng hậu cần"
                title="Khai báo vật dụng hỗ trợ sự kiện - Ban Hậu Cần"
                className="rounded-lg p-1.5 text-indigo-600 transition hover:bg-indigo-500/15 hover:text-indigo-700"
              >
                <Package className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {onFeedback && (
              <button
                type="button"
                onClick={onFeedback}
                aria-label="Đánh giá phản hồi"
                title="Đánh giá & phản hồi sự kiện"
                className="rounded-lg p-1.5 text-amber-600 transition hover:bg-amber-500/15 hover:text-amber-700"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {onMedia && (
              <button
                type="button"
                onClick={onMedia}
                aria-label="Tư liệu media"
                title="Tư liệu & media sự kiện - Tự động đồng bộ Quản lý tài liệu"
                className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-500/15 hover:text-emerald-700"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {can(PERMISSIONS.EVENT_EDIT) && (
              <button
                type="button"
                onClick={onEdit}
                aria-label={t("common.edit")}
                title={t("common.edit")}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {can(PERMISSIONS.EVENT_DELETE) && e.status !== "cancelled" && (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                aria-label={t("events.delete")}
                title={t("events.delete")}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {fmt.date(e.date)}
        </div>
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{e.location || "—"}</span>
        </div>
        <div className="mt-auto">
          <CapacityBar registered={e.registered} capacity={e.capacity} />
        </div>
      </div>
    </article>
  );
}

function FeaturedCard({ event: e, onOpen }: { event: EventItem; onOpen: () => void }) {
  const t = useT();
  const fmt = useFmt();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mb-5 block w-full overflow-hidden rounded-3xl border border-border text-left shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-glow)]"
    >
      <div className="relative grid gap-0 md:grid-cols-[1.1fr_1fr]">
        <div
          className="relative min-h-[180px] p-6 overflow-hidden"
          style={{ background: TYPE_COVER[e.type] }}
        >
          {(() => {
            const typeFallbacks: Record<string, string> = {
              forum:
                "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
              workshop:
                "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
              networking:
                "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
              training:
                "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
            };
            const fallback = typeFallbacks[e.type] || typeFallbacks.forum;
            const raw =
              (e as any).imageUrl ||
              (e as any).image ||
              (e as any).bannerUrl ||
              (e as any).coverUrl;
            const resolved = resolveMediaUrl(raw) || raw || fallback;
            return (
              <img
                src={resolved}
                alt={e.name}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(ev) => {
                  const target = ev.target as HTMLImageElement;
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
            );
          })()}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />
          <div className="relative z-10 flex h-full flex-col">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> {t("events.featured")}
            </span>
            <h2 className="mt-auto text-2xl font-bold text-primary-foreground drop-shadow-sm">
              {e.name}
            </h2>
            <div className="mt-2 flex flex-wrap gap-3 text-sm font-medium text-primary-foreground/90">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" aria-hidden="true" /> {fmt.date(e.date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" /> {e.location || "—"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-4 bg-card p-6">
          <div className="flex items-center gap-2">
            <StatusPill status={e.status} />
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(TYPE_KEY[e.type])}
            </span>
          </div>
          <CapacityBar registered={e.registered} capacity={e.capacity} />
          <span
            className="inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            {t("events.viewDetail")}
          </span>
        </div>
      </div>
    </button>
  );
}

function CalendarView({ events }: { events: EventItem[] }) {
  const t = useT();
  const fmt = useFmt();
  const [cursor, setCursor] = useState(() => {
    const first = events[0] ? new Date(events[0].date) : new Date();
    return new Date(first.getFullYear(), first.getMonth(), 1);
  });

  const byDay = useMemo(() => {
    const m = new Map<string, EventItem[]>();
    for (const e of events) {
      const key = new Date(e.date).toDateString();
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    }
    return m;
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const weekdays =
    fmt.locale === "en-US"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const todayKey = new Date().toDateString();

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          aria-label="‹"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border text-base font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          ‹
        </button>
        <h3 className="text-sm font-semibold text-foreground">
          {cursor.toLocaleDateString(fmt.locale, { month: "long", year: "numeric" })}
        </h3>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="›"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border text-base font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
        {weekdays.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date)
            return <div key={`e${i}`} className="min-h-[52px] rounded-lg sm:min-h-[76px]" />;
          const dayEvents = byDay.get(date.toDateString()) ?? [];
          const isToday = date.toDateString() === todayKey;
          return (
            <div
              key={date.toISOString()}
              className={`min-h-[52px] rounded-lg border p-1 text-left sm:min-h-[76px] sm:p-1.5 ${isToday ? "border-primary bg-primary/5" : "border-border bg-background"
                }`}
            >
              <span
                className={`text-[11px] font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}
              >
                {date.getDate()}
              </span>
              {/* Mobile: compact color dots */}
              {dayEvents.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                  {dayEvents.slice(0, 4).map((e: any) => (
                    <span
                      key={e.id}
                      title={e.name}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: TYPE_COVER[e.type as EventItem["type"]] }}
                    />
                  ))}
                </div>
              )}
              {/* sm+: labelled chips */}
              <div className="mt-1 hidden space-y-1 sm:block">
                {dayEvents.slice(0, 2).map((e: any) => (
                  <div
                    key={e.id}
                    title={e.name}
                    className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground"
                    style={{ background: TYPE_COVER[e.type as EventItem["type"]] }}
                  >
                    {e.name}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="px-1 text-[10px] font-medium text-muted-foreground">
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("events.calendar.noEvents")}
        </p>
      )}
    </div>
  );
}
