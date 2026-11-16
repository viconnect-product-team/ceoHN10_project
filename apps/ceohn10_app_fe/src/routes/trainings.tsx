import { createFileRoute } from "@tanstack/react-router";
import { LiveActivityMediaSection } from "@/components/common/LiveActivityMediaSection";
import React, { useState, useEffect, useMemo } from "react";
import {
  GraduationCap,
  Camera,
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Link as LinkIcon,
  Play,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  PhoneCall,
  Download,
  Share2,
  Radio,
  MapPin,
  QrCode,
  Send,
  Copy,
  Sparkles,
  UserCheck,
  Eye,
  Pencil,
  Trash2,
  Ticket,
  Award,
  Building2,
  Package,
  MessageSquare,
  List,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { AppShell } from "@/components/dashboard/AppShell";
import { SupplyDeclarationModal } from "@/components/dashboard/SupplyDeclarationModal";
import { TrainingFeedbackModal } from "@/components/trainings/TrainingFeedbackModal";
import { TrainingAttendeesModal } from "@/components/trainings/TrainingAttendeesModal";
import { TrainingMediaModal } from "@/components/trainings/TrainingMediaModal";
import {
  CustomTable,
  useCustomTableSort,
  CrmMetricCard,
  CrmMetricGrid,
  CrmToolbar,
  type CustomTableColumn,
} from "@/components/common/CustomTable";
import { StandardDateInput, formatToDdmmyyyy } from "@/components/common/StandardDateInput";
import { GoogleMapAddressPicker } from "@/components/common/GoogleMapAddressPicker";
import { VndCurrencyInput } from "@/components/dashboard/VndCurrencyInput";
import { QrCanvas } from "@/components/member/QrCanvas";

export const Route = createFileRoute("/trainings")({
  component: TrainingsPage,
  head: () => ({
    meta: [
      { title: "Đào Tạo & Khóa Học Doanh Nhân | CEO HN10" },
      {
        name: "description",
        content:
          "Phân hệ quản trị đào tạo, khai báo khóa học doanh nhân và thiết lập phòng họp trực tuyến cho CLB CEO HN10",
      },
    ],
  }),
});

export interface TicketTier {
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface TrainingItem {
  id: string;
  title: string;
  tagline?: string;
  instructor_name?: string;
  instructor_title?: string;
  instructor_company?: string;
  description?: string;
  category?: string;
  format?: "online" | "offline" | "hybrid";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  start_time?: string;
  end_time?: string;
  location?: string;
  address?: string;
  room_id?: string;
  room_url?: string;
  meeting_passcode?: string;
  video_provider?: string;
  max_attendees: number;
  attendee_count: number;
  ticket_tiers?: TicketTier[];
  materials?: { title: string; url: string }[];
  cover_image?: string;
  registration_url?: string;
  open_registration?: boolean;
  created_at?: string;
  attendees?: any[];
}

function TrainingsPage() {
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Active Modals
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState<TrainingItem | null>(null);
  const [detailTraining, setDetailTraining] = useState<TrainingItem | null>(null);
  const [activeCallRoom, setActiveCallRoom] = useState<{ id: string; title: string; link: string } | null>(null);
  const [activeMediaModal, setActiveMediaModal] = useState<TrainingItem | null>(null);
  const [activeQrModal, setActiveQrModal] = useState<TrainingItem | null>(null);
  const [activeAttendeesModal, setActiveAttendeesModal] = useState<TrainingItem | null>(null);
  const [activeFeedbackModal, setActiveFeedbackModal] = useState<TrainingItem | null>(null);
  const [activeSupplyModal, setActiveSupplyModal] = useState<TrainingItem | null>(null);
  const [activeMediaRecordingModal, setActiveMediaRecordingModal] = useState<TrainingItem | null>(null);

  const [viewMode, setViewMode] = useState<"table" | "grid" | "calendar">("table");
  const [calendarCursor, setCalendarCursor] = useState(new Date());

  // Form State cho Khai Báo Khóa Đào Tạo (Chuẩn như Sự Kiện, có số lượng & hạng vé, KHÔNG xếp chỗ)
  const [formIsFixed, setFormIsFixed] = useState(true);
  const [formScheduleType, setFormScheduleType] = useState<"saturday_weekly" | "periodic" | "custom">("saturday_weekly");
  const [formTotalCost, setFormTotalCost] = useState<number>(0);
  const [formExpectedAttendees, setFormExpectedAttendees] = useState<number>(20);
  const [formAgenda, setFormAgenda] = useState([
    { time: "08:30 - 09:00", activity: "Đón tiếp học viên & check-in điện tử" },
    { time: "09:00 - 10:30", activity: "Chuyên đề 1: Lý thuyết & Case study thực chiến" },
    { time: "10:30 - 10:45", activity: "Giải lao kết nối & Tea break doanh nhân" },
    { time: "10:45 - 11:30", activity: "Chuyên đề 2: Thảo luận nhóm & Hỏi đáp cùng Chuyên gia" },
  ]);

  const [formTitle, setFormTitle] = useState("");
  const [formTagline, setFormTagline] = useState("");
  const [formInstructorName, setFormInstructorName] = useState("");
  const [formInstructorTitle, setFormInstructorTitle] = useState("");
  const [formInstructorCompany, setFormInstructorCompany] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("Kỹ năng lãnh đạo");
  const [formFormat, setFormFormat] = useState<"online" | "offline" | "hybrid">("hybrid");
  const [formStatus, setFormStatus] = useState<"upcoming" | "ongoing" | "completed" | "cancelled">("upcoming");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("08:30");
  const [formEndTime, setFormEndTime] = useState("11:30");
  const [formLocation, setFormLocation] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formRoomId, setFormRoomId] = useState("");
  const [formRoomUrl, setFormRoomUrl] = useState("");
  const [formMeetingPasscode, setFormMeetingPasscode] = useState("198388");
  const [formMaxAttendees, setFormMaxAttendees] = useState("100");
  const [formMaterialsUrl, setFormMaterialsUrl] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formRegistrationUrl, setFormRegistrationUrl] = useState("");
  const [formTicketTiers, setFormTicketTiers] = useState<TicketTier[]>([
    {
      name: "Vé Hội Viên CEO HN10",
      price: 0,
      quantity: 100,
      description: "Đặc quyền miễn phí 100% dành cho hội viên chính thức CLB",
    },
    {
      name: "Vé Doanh Nhân Khách Mời",
      price: 500000,
      quantity: 20,
      description: "Dành cho đại biểu & khách mời ngoài CLB giao lưu",
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Load danh sách khóa đào tạo từ CSDL Backend
  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res = await fetchNestApi<any>("/trainings");
      const list = Array.isArray(res) ? res : res?.items || [];
      if (Array.isArray(list)) {
        setTrainings(list);
      }
    } catch {
      toast.error("Không thể tải danh sách khóa đào tạo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  // Filter dữ liệu
  const filteredTrainings = useMemo(() => {
    return trainings.filter((t) => {
      const matchSearch =
        !search.trim() ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.instructor_name && t.instructor_name.toLowerCase().includes(search.toLowerCase())) ||
        (t.location && t.location.toLowerCase().includes(search.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

      const matchFormat = formatFilter === "all" || t.format === formatFilter;
      const matchStatus = statusFilter === "all" || t.status === statusFilter;

      return matchSearch && matchFormat && matchStatus;
    });
  }, [trainings, search, formatFilter, statusFilter]);

  // Hook sắp xếp 3 trạng thái chuẩn CRM CEO HN10
  const { sortKey, sortDir, handleSort, sortData } = useCustomTableSort<TrainingItem>(
    "start_time",
    "desc"
  );

  const sortedTrainings = useMemo(() => {
    return sortData(filteredTrainings, {
      title: (t) => t.title,
      instructor_name: (t) => t.instructor_name || "",
      start_time: (t) => (t.start_time ? new Date(t.start_time).getTime() : 0),
      format: (t) => t.format || "hybrid",
      max_attendees: (t) => Number(t.max_attendees) || 0,
      attendee_count: (t) => Number(t.attendee_count) || 0,
      status: (t) => t.status,
    });
  }, [filteredTrainings, sortData]);

  const pagedTrainings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTrainings.slice(start, start + pageSize);
  }, [sortedTrainings, page, pageSize]);

  // Tính toán 4 chỉ số KPI Metric Grid
  const kpis = useMemo(() => {
    const total = trainings.length;
    const active = trainings.filter((t) => t.status === "upcoming" || t.status === "ongoing").length;
    const totalAttendees = trainings.reduce((acc, t) => acc + (Number(t.attendee_count) || 0), 0);
    const totalCapacity = trainings.reduce((acc, t) => acc + (Number(t.max_attendees) || 0), 0);
    return { total, active, totalAttendees, totalCapacity };
  }, [trainings]);

  // Reset form mở modal tạo mới
  const handleOpenCreate = () => {
    setEditingTraining(null);
    setFormTitle("");
    setFormTagline("Chuyên đề nâng cao năng lực quản trị doanh nghiệp CEO HN10");
    setFormInstructorName("");
    setFormInstructorTitle("Chuyên gia cố vấn Ban Điều Hành");
    setFormInstructorCompany("CLB Doanh Nhân CEO HN10");
    setFormDescription("");
    setFormCategory("Kỹ năng lãnh đạo");
    setFormFormat("hybrid");
    setFormStatus("upcoming");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormStartTime("08:30");
    setFormEndTime("11:30");
    setFormLocation("Hội trường VIP Keangnam Landmark 72, Hà Nội");
    setFormAddress("Tầng 5, Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội");
    const autoRoomId = `CEOHN10_DAO_TAO_${Date.now().toString(36).toUpperCase()}`;
    setFormRoomId(autoRoomId);
    setFormRoomUrl(`https://meet.jit.si/${autoRoomId}`);
    setFormMeetingPasscode("198388");
    setFormMaxAttendees("100");
    setFormMaterialsUrl("");
    setFormCoverImage("");
    setFormRegistrationUrl("");
    setFormIsFixed(true);
    setFormScheduleType("saturday_weekly");
    setFormAgenda([
      { time: "08:30 - 09:00", activity: "Đón tiếp học viên & check-in điện tử" },
      { time: "09:00 - 10:30", activity: "Chuyên đề 1: Lý thuyết & Case study thực chiến" },
      { time: "10:30 - 10:45", activity: "Giải lao kết nối & Tea break doanh nhân" },
      { time: "10:45 - 11:30", activity: "Chuyên đề 2: Thảo luận nhóm & Hỏi đáp cùng Chuyên gia" },
    ]);
    setFormTicketTiers([
      {
        name: "Vé Hội Viên CEO HN10",
        price: 0,
        quantity: 100,
        description: "Đặc quyền miễn phí 100% dành cho hội viên chính thức CLB",
      },
      {
        name: "Vé Doanh Nhân Khách Mời",
        price: 500000,
        quantity: 20,
        description: "Dành cho đại biểu & khách mời ngoài CLB giao lưu",
      },
    ]);
    setShowWizardModal(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (t: TrainingItem) => {
    setEditingTraining(t);
    setFormTitle(t.title);
    setFormTagline(t.tagline || "");
    setFormInstructorName(t.instructor_name || "");
    setFormInstructorTitle(t.instructor_title || "");
    setFormInstructorCompany(t.instructor_company || "");
    setFormDescription(t.description || "");
    setFormCategory(t.category || "Kỹ năng lãnh đạo");
    setFormFormat(t.format || "hybrid");
    setFormStatus(t.status || "upcoming");
    if (t.start_time) {
      const d = new Date(t.start_time);
      setFormDate(d.toISOString().split("T")[0]);
      setFormStartTime(d.toTimeString().slice(0, 5));
    }
    if (t.end_time) {
      const d = new Date(t.end_time);
      setFormEndTime(d.toTimeString().slice(0, 5));
    }
    setFormLocation(t.location || "");
    setFormAddress(t.address || "");
    setFormRoomId(t.room_id || "");
    setFormRoomUrl(t.room_url || "");
    setFormMeetingPasscode(t.meeting_passcode || "198388");
    setFormMaxAttendees(String(t.max_attendees || 100));
    setFormMaterialsUrl(t.materials && t.materials[0] ? t.materials[0].url : "");
    setFormCoverImage(t.cover_image || "");
    setFormRegistrationUrl(t.registration_url || "");
    setFormIsFixed((t as any).is_fixed ?? (t as any).isFixed ?? true);
    setFormScheduleType((t as any).schedule_type ?? (t as any).scheduleType ?? "saturday_weekly");
    if (Array.isArray((t as any).agenda) && (t as any).agenda.length > 0) {
      setFormAgenda((t as any).agenda);
    }
    setFormTicketTiers(
      t.ticket_tiers && t.ticket_tiers.length > 0
        ? t.ticket_tiers
        : [
            {
              name: "Vé Hội Viên CEO HN10",
              price: 0,
              quantity: t.max_attendees || 100,
              description: "Đặc quyền miễn phí 100% dành cho hội viên",
            },
          ]
    );
    setShowWizardModal(true);
  };

  // Lưu tạo / cập nhật khóa đào tạo
  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Vui lòng nhập tên khóa đào tạo!");
      return;
    }

    setSubmitting(true);
    try {
      const startIso = formDate
        ? new Date(`${formDate}T${formStartTime || "08:30"}:00`).toISOString()
        : new Date().toISOString();
      const endIso = formDate
        ? new Date(`${formDate}T${formEndTime || "11:30"}:00`).toISOString()
        : new Date(Date.now() + 3600000 * 3).toISOString();

      const payload = {
        title: formTitle.trim(),
        tagline: formTagline.trim(),
        instructorName: formInstructorName.trim() || "Ban Đào Tạo CLB CEO HN10",
        instructorTitle: formInstructorTitle.trim(),
        instructorCompany: formInstructorCompany.trim(),
        description: formDescription.trim(),
        category: formCategory,
        format: formFormat,
        status: formStatus,
        isFixed: formIsFixed,
        scheduleType: formScheduleType,
        isCustomSession: formScheduleType === "custom",
        totalCost: formScheduleType === "custom" ? formTotalCost : 0,
        expectedAttendees: formScheduleType === "custom" ? formExpectedAttendees : parseInt(formMaxAttendees) || 100,
        ticketFee: formScheduleType === "custom" ? (formExpectedAttendees > 0 ? Math.round(formTotalCost / formExpectedAttendees) : 0) : 0,
        fundType: formScheduleType === "custom" ? "personal_pool" : "general",
        agenda: formAgenda,
        startTime: startIso,
        endTime: endIso,
        location: formLocation.trim() || "Keangnam Landmark 72, Hà Nội",
        address: formAddress.trim(),
        roomId: formRoomId.trim(),
        roomUrl: formRoomUrl.trim() || `https://meet.jit.si/${formRoomId || "CEOHN10_DAO_TAO"}`,
        meetingPasscode: formMeetingPasscode.trim(),
        maxAttendees: parseInt(formMaxAttendees) || 100,
        ticketTiers: formTicketTiers,
        materials: formMaterialsUrl.trim()
          ? [{ title: "Giáo trình & Slide đào tạo", url: formMaterialsUrl.trim() }]
          : [],
        coverImage: formCoverImage.trim(),
        registrationUrl: formRegistrationUrl.trim(),
      };

      if (editingTraining) {
        await fetchNestApi(`/trainings/${editingTraining.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success(`Đã cập nhật khóa đào tạo "${formTitle}" thành công!`);
      } else {
        await fetchNestApi("/trainings", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success(`Đã khai báo thành công khóa đào tạo "${formTitle}"!`);
      }

      setShowWizardModal(false);
      await fetchTrainings();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu thông tin khóa đào tạo");
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa khóa đào tạo
  const handleDeleteTraining = async (t: TrainingItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khóa đào tạo "${t.title}"?`)) return;
    try {
      await fetchNestApi(`/trainings/${t.id}`, { method: "DELETE" });
      toast.success(`Đã xóa khóa đào tạo "${t.title}"`);
      await fetchTrainings();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi xóa khóa đào tạo");
    }
  };

  // Định nghĩa các cột cho CustomTable
  const columns: CustomTableColumn<TrainingItem>[] = [
    {
      key: "title",
      label: "Khóa Đào Tạo & Chuyên Đề",
      width: 320,
      render: (t) => (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setDetailTraining(t)}
              className="text-xs font-bold text-slate-900 dark:text-white hover:text-[#003B95] dark:hover:text-blue-400 hover:underline text-left line-clamp-1 cursor-pointer"
            >
              {t.title}
            </button>
            {t.tagline && (
              <div className="text-[11px] text-slate-500 line-clamp-1">{t.tagline}</div>
            )}
            <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-slate-500">
              <span className="font-semibold text-blue-700 dark:text-blue-400">
                {t.category || "Kỹ năng"}
              </span>
              <span>·</span>
              <span className="capitalize">
                {t.format === "online"
                  ? "🌐 Trực tuyến"
                  : t.format === "offline"
                  ? "🏢 Trực tiếp"
                  : "⚡ Kết hợp Hybrid"}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "instructor_name",
      label: "Giảng Viên / Chuyên Gia",
      width: 220,
      render: (t) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white text-xs">
            {t.instructor_name || "Ban Đào Tạo"}
          </div>
          <div className="text-[11px] text-slate-500">
            {t.instructor_title || t.instructor_company || "Cố vấn CLB"}
          </div>
        </div>
      ),
    },
    {
      key: "start_time",
      label: "Thời Gian Diễn Ra",
      width: 180,
      render: (t) => {
        if (!t.start_time) return <span className="text-slate-400">Chưa xếp lịch</span>;
        const d = new Date(t.start_time);
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white text-xs">
              <Calendar className="h-3.5 w-3.5 text-[#003B95]" />
              <span>{d.toLocaleDateString("vi-VN")}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="h-3 w-3" />
              <span>
                {d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "max_attendees",
      label: "Học Viên / Sức Chứa",
      width: 170,
      render: (t) => {
        const count = t.attendee_count || 0;
        const max = t.max_attendees || 100;
        const pct = Math.min(100, Math.round((count / max) * 100));
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-900 dark:text-white">
                {count}/{max} học viên
              </span>
              <span className="text-muted-foreground font-semibold">{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-[#003B95] dark:bg-blue-400"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400">
              {t.ticket_tiers ? `${t.ticket_tiers.length} hạng vé` : "1 hạng vé"}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Trạng Thái",
      width: 140,
      render: (t) => {
        const isOngoing = t.status === "ongoing";
        const isUpcoming = t.status === "upcoming";
        const isCompleted = t.status === "completed";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isOngoing
                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse"
                : isUpcoming
                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                : isCompleted
                ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {isOngoing && <Radio className="h-3 w-3 text-rose-600 animate-spin" />}
            {isOngoing
              ? "Đang Diễn Ra"
              : isUpcoming
              ? "Sắp Diễn Ra"
              : isCompleted
              ? "Đã Kết Thúc"
              : "Đã Hủy"}
          </span>
        );
      },
    },
  ];

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header với Icon Logo */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center shrink-0 shadow-md">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-slate-900 dark:text-white text-2xl font-bold font-['Inter'] leading-8">
              Quản Lý Đào Tạo &amp; Phòng Họp Doanh Nhân
            </h1>
            <p className="text-slate-500 text-sm font-normal font-['Inter'] leading-5 mt-0.5">
              Khai báo khóa học chuyên sâu, phân phối hạng vé học viên, thiết lập phòng họp trực tuyến và quản trị điểm danh điện tử cho CLB CEO HN10
            </p>
          </div>
        </div>

        {/* ── 4 THẺ METRIC GRADIENT FIGMA CHUẨN ── */}
        <CrmMetricGrid>
          <CrmMetricCard
            label="TỔNG KHÓA ĐÀO TẠO"
            value={kpis.total}
            sub="Khóa học & chuyên đề đã tạo"
            icon={GraduationCap}
            tone="sky"
          />
          <CrmMetricCard
            label="ĐANG &amp; SẮP DIỄN RA"
            value={kpis.active}
            sub="Khóa học sẵn sàng đón học viên"
            icon={Calendar}
            tone="violet"
          />
          <CrmMetricCard
            label="LƯỢT HỌC VIÊN ĐĂNG KÝ"
            value={kpis.totalAttendees}
            sub="Hội viên & doanh nhân đã đăng ký"
            icon={UserCheck}
            tone="green"
          />
          <CrmMetricCard
            label="QUY MÔ CHỖ ĐÀO TẠO"
            value={kpis.totalCapacity}
            sub="Tổng số lượng học viên tối đa"
            icon={Users}
            tone="orange"
          />
        </CrmMetricGrid>

        {/* ── TOOLBAR TÌM KIẾM CẠNH THÊM MỚI (FIGMA STYLE) ── */}
        <CrmToolbar
          searchQuery={search}
          onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
          }}
          searchPlaceholder="Tìm theo tên khóa học, giảng viên, địa điểm..."
          addButtonLabel="Khai Báo Khóa Học Mới"
          onAddClick={handleOpenCreate}
        >
          <div className="flex items-center gap-2">
            <select
              value={formatFilter}
              onChange={(e) => {
                setFormatFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-[100px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-card text-xs font-semibold text-foreground outline-none cursor-pointer"
            >
              <option value="all">Tất cả hình thức</option>
              <option value="online">🌐 Trực tuyến (Online)</option>
              <option value="offline">🏢 Trực tiếp (Offline)</option>
              <option value="hybrid">⚡ Kết hợp (Hybrid)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-[100px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-card text-xs font-semibold text-foreground outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="ongoing">Đang diễn ra</option>
              <option value="completed">Đã kết thúc</option>
            </select>

            {/* Chuyển đổi giao diện Bảng / Lưới / Lịch */}
            <div className="flex items-center gap-1 rounded-[100px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-card p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Dạng bảng chi tiết"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[#003B95] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-foreground"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Bảng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Dạng lưới thẻ"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#003B95] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lưới</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                title="Dạng lịch đào tạo"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  viewMode === "calendar"
                    ? "bg-[#003B95] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-foreground"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lịch</span>
              </button>
            </div>
          </div>
        </CrmToolbar>

        {/* ── BỘ HIỂN THỊ ĐA DẠNG: BẢNG / LƯỚI / LỊCH ── */}
        {viewMode === "table" ? (
          <CustomTable<TrainingItem>
            columns={columns}
            data={pagedTrainings}
            keyExtractor={(t) => t.id}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            showStt={true}
            page={page}
            pageSize={pageSize}
            total={sortedTrainings.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            actionColumn={{
              title: "THAO TÁC",
              width: 320,
              render: (t) => (
                <div className="flex items-center justify-center gap-1.5">
                  {/* Quản lý danh sách học viên, điểm danh & gửi slide */}
                  <button
                    type="button"
                    onClick={() => setActiveAttendeesModal(t)}
                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 transition cursor-pointer"
                    title="Danh sách học viên, điểm danh & gửi slide bài giảng"
                  >
                    <Users className="h-4 w-4" />
                  </button>

                  {/* Phản hồi & Đóng góp ý kiến sau buổi học */}
                  <button
                    type="button"
                    onClick={() => setActiveFeedbackModal(t)}
                    className="p-1.5 rounded-lg bg-blue-50 text-[#003B95] hover:bg-blue-100 transition cursor-pointer"
                    title="Xem & gửi đánh giá phản hồi sau buổi học"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>

                  {/* Khai báo vật dụng hỗ trợ (Ban Sự Kiện & Hậu Cần) */}
                  <button
                    type="button"
                    onClick={() => setActiveSupplyModal(t)}
                    className="p-1.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 transition cursor-pointer"
                    title="Khai báo vật dụng hỗ trợ buổi học (Ban Sự Kiện & Hậu Cần)"
                  >
                    <Package className="h-4 w-4" />
                  </button>

                  {/* Tư liệu quay phim chụp ảnh (Lưu vào Quản Lý Tài Liệu) */}
                  <button
                    type="button"
                    onClick={() => setActiveMediaRecordingModal(t)}
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
                    title="Quay phim & chụp ảnh - Tự động đồng bộ vào Quản Lý Tài Liệu"
                  >
                    <Camera className="h-4 w-4" />
                  </button>

                  {/* Vào phòng Video Call */}
                  {t.room_url && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveCallRoom({
                          id: t.id,
                          title: t.title,
                          link: t.room_url || `https://meet.jit.si/${t.room_id || t.id}`,
                        })
                      }
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 transition cursor-pointer"
                      title="Vào phòng họp Video Call trực tuyến"
                    >
                      <Video className="h-4 w-4" />
                    </button>
                  )}

                  {/* Điểm danh QR */}
                  <button
                    type="button"
                    onClick={() => setActiveQrModal(t)}
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
                    title="Mã QR Điểm danh học viên điện tử"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>

                  {/* Chi tiết */}
                  <button
                    type="button"
                    onClick={() => setDetailTraining(t)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                    title="Xem chi tiết khóa học"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {/* Sửa */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 transition cursor-pointer"
                    title="Chỉnh sửa khóa học"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  {/* Xóa */}
                  <button
                    type="button"
                    onClick={() => handleDeleteTraining(t)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100 transition cursor-pointer"
                    title="Xóa khóa học"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            }}
            emptyText="Chưa có khóa đào tạo nào phù hợp bộ lọc."
            emptyAction={
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#003B95] text-white text-xs font-bold shadow-xs hover:bg-[#002f78] transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Khai Báo Khóa Học Mới Ngay</span>
              </button>
            }
          />
        ) : viewMode === "grid" ? (
          /* ── GRID VIEW (DẠNG LƯỚI THẺ) ── */
          <div className="space-y-6">
            {pagedTrainings.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card p-6">
                <GraduationCap className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Không tìm thấy khóa đào tạo nào</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc</p>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#003B95] text-white text-xs font-bold shadow-xs hover:bg-[#002f78] transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Khai Báo Khóa Học Mới</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pagedTrainings.map((t) => {
                  const count = t.attendee_count || 0;
                  const max = t.max_attendees || 100;
                  const pct = Math.min(100, Math.round((count / max) * 100));
                  const isOngoing = t.status === "ongoing";
                  const isUpcoming = t.status === "upcoming";
                  const isCompleted = t.status === "completed";
                  const isFixed = (t as any).is_fixed ?? (t as any).isFixed ?? true;
                  const img = t.cover_image || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80";

                  return (
                    <div
                      key={t.id}
                      className="group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card overflow-hidden shadow-xs hover:shadow-md transition hover:-translate-y-0.5"
                    >
                      {/* Cover Image & Badges */}
                      <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                        <img
                          src={img}
                          alt={t.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

                        {/* Status badge */}
                        <div className="absolute top-3 left-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs ${
                              isOngoing
                                ? "bg-rose-500 text-white animate-pulse"
                                : isUpcoming
                                ? "bg-[#003B95] text-white"
                                : isCompleted
                                ? "bg-slate-700 text-slate-200"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            {isOngoing && <Radio className="h-3 w-3 animate-spin" />}
                            {isOngoing ? "Đang Diễn Ra" : isUpcoming ? "Sắp Diễn Ra" : isCompleted ? "Đã Kết Thúc" : "Đã Hủy"}
                          </span>
                        </div>

                        {/* Format & Fixed Badges */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          {isFixed && (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500 text-slate-950 shadow-xs">
                              Thứ 7 Hàng Tuần
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-white/90 text-slate-900 backdrop-blur shadow-xs">
                            {t.format === "online" ? "🌐 Online" : t.format === "offline" ? "🏢 Offline" : "⚡ Hybrid"}
                          </span>
                        </div>

                        {/* Course Category */}
                        <div className="absolute bottom-3 left-3">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-black/60 text-white backdrop-blur border border-white/20">
                            {t.category || "Kỹ năng lãnh đạo"}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <button
                            type="button"
                            onClick={() => setDetailTraining(t)}
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#003B95] dark:hover:text-blue-400 text-left line-clamp-2 hover:underline cursor-pointer"
                          >
                            {t.title}
                          </button>
                          {t.tagline && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.tagline}</p>
                          )}
                        </div>

                        {/* Instructor Info */}
                        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                          <div className="w-8 h-8 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {(t.instructor_name || "BĐT").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {t.instructor_name || "Ban Đào Tạo CLB CEO HN10"}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {t.instructor_title || "Chuyên gia đào tạo"} {t.instructor_company ? `• ${t.instructor_company}` : ""}
                            </div>
                          </div>
                        </div>

                        {/* Date, Time & Venue */}
                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[#003B95] shrink-0" />
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {t.start_time ? formatToDdmmyyyy(t.start_time) : "Thứ Bảy hàng tuần"}
                            </span>
                            <span className="text-slate-400">•</span>
                            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>
                              {t.start_time ? new Date(t.start_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "08:30"} - {t.end_time ? new Date(t.end_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "11:30"}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{t.location || "Keangnam Landmark 72, Hà Nội"}</span>
                          </div>
                        </div>

                        {/* Attendee capacity progress */}
                        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {count}/{max} học viên
                            </span>
                            <span className="text-slate-500 font-semibold">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-full rounded-full bg-[#003B95] dark:bg-blue-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Action buttons toolbar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveAttendeesModal(t)}
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 transition cursor-pointer"
                              title="Điểm danh & gửi slide"
                            >
                              <Users className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveFeedbackModal(t)}
                              className="p-1.5 rounded-lg bg-blue-50 text-[#003B95] hover:bg-blue-100 transition cursor-pointer"
                              title="Ý kiến phản hồi"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveSupplyModal(t)}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 transition cursor-pointer"
                              title="Vật dụng hỗ trợ"
                            >
                              <Package className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveMediaRecordingModal(t)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
                              title="Quay phim chụp ảnh"
                            >
                              <Camera className="h-4 w-4" />
                            </button>
                            {t.room_url && (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCallRoom({
                                    id: t.id,
                                    title: t.title,
                                    link: t.room_url || `https://meet.jit.si/${t.room_id || t.id}`,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 transition cursor-pointer"
                                title="Vào phòng Video"
                              >
                                <Video className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailTraining(t)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(t)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 transition cursor-pointer"
                              title="Sửa khóa học"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTraining(t)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100 transition cursor-pointer"
                              title="Xóa khóa học"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination cho Grid */}
            {sortedTrainings.length > pageSize && (
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="text-xs text-slate-500">
                  Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, sortedTrainings.length)} trên tổng số {sortedTrainings.length} khóa học
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Trang trước
                  </button>
                  <span className="text-xs font-bold px-2">
                    Trang {page} / {Math.ceil(sortedTrainings.length / pageSize)}
                  </span>
                  <button
                    type="button"
                    disabled={page >= Math.ceil(sortedTrainings.length / pageSize)}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Trang tiếp
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── CALENDAR VIEW (DẠNG LỊCH THÁNG) ── */
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card p-4 shadow-xs space-y-4">
            {/* Calendar Nav */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                  {calendarCursor.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {filteredTrainings.length} khóa học
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  ‹ Tháng trước
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarCursor(new Date())}
                  className="px-3 py-1.5 rounded-lg bg-[#003B95] text-white text-xs font-semibold hover:bg-[#002f78] cursor-pointer"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Tháng sau ›
                </button>
              </div>
            </div>

            {/* Days Grid */}
            {(() => {
              const year = calendarCursor.getFullYear();
              const month = calendarCursor.getMonth();
              const firstDay = new Date(year, month, 1);
              const startWeekday = (firstDay.getDay() + 6) % 7; // Monday-first
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const cells: (Date | null)[] = [];
              for (let i = 0; i < startWeekday; i++) cells.push(null);
              for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

              const weekdays = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy (Lịch Học)", "Chủ Nhật"];
              const todayStr = new Date().toISOString().split("T")[0];

              return (
                <div className="space-y-1">
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-600 dark:text-slate-400 py-1">
                    {weekdays.map((w, idx) => (
                      <div key={w} className={`py-1 rounded-md ${idx === 5 ? "bg-amber-100 text-amber-900 font-extrabold" : ""}`}>
                        {w}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {cells.map((date, idx) => {
                      if (!date) {
                        return <div key={`empty-${idx}`} className="min-h-[105px] rounded-xl bg-slate-50/50 dark:bg-slate-900/20" />;
                      }
                      const dateIso = date.toISOString().split("T")[0];
                      const isToday = dateIso === todayStr;
                      const isSaturday = date.getDay() === 6;

                      // Find trainings on this date (or fixed weekly saturday courses)
                      const dayTrainings = filteredTrainings.filter((t) => {
                        if (t.start_time) {
                          const tDate = new Date(t.start_time).toISOString().split("T")[0];
                          if (tDate === dateIso) return true;
                        }
                        const isFixed = (t as any).is_fixed ?? (t as any).isFixed ?? true;
                        if (isFixed && isSaturday) return true;
                        return false;
                      });

                      return (
                        <div
                          key={dateIso}
                          className={`min-h-[105px] rounded-xl border p-2 flex flex-col justify-between transition ${
                            isToday
                              ? "border-[#003B95] bg-blue-50/40 dark:bg-blue-950/30"
                              : isSaturday
                              ? "border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-card"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isToday ? "text-[#003B95] dark:text-blue-400 font-black" : isSaturday ? "text-amber-800 font-extrabold" : "text-slate-700 dark:text-slate-300"}`}>
                              {date.getDate()}
                            </span>
                            {isSaturday && (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                Lớp cố định
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 my-1 overflow-y-auto max-h-[85px] no-scrollbar">
                            {dayTrainings.slice(0, 3).map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setDetailTraining(t)}
                                className="w-full text-left p-1 rounded-md text-[10.5px] font-semibold truncate block transition cursor-pointer bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 hover:bg-blue-200"
                                title={`${t.title} - ${t.instructor_name || ""}`}
                              >
                                🎓 {t.title}
                              </button>
                            ))}
                            {dayTrainings.length > 3 && (
                              <div className="text-[10px] font-bold text-slate-400 text-center">
                                +{dayTrainings.length - 3} khóa khác
                              </div>
                            )}
                          </div>

                          <div className="text-[10px] text-right text-slate-400">
                            {dayTrainings.length > 0 ? `${dayTrainings.length} buổi` : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── MODAL KHAI BÁO KHÓA ĐÀO TẠO (CHUẨN EVENT WIZARD, CÓ SỐ LƯỢNG & HẠNG VÉ, KHÔNG XẾP CHỖ) ── */}
        {showWizardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-800 text-white flex items-center justify-center font-bold">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {editingTraining
                        ? "Chỉnh Sửa Khai Báo Khóa Đào Tạo"
                        : "Khai Báo Khóa Đào Tạo Doanh Nhân Mới"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Thiết lập chuyên đề, giảng viên, hình thức tổ chức, số lượng học viên &amp; hạng vé
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWizardModal(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveTraining} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* 1. Tên & Tagline */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>1. Thông Tin Khóa Học &amp; Chuyên Đề</span>
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tên Khóa Đào Tạo / Buổi Chia Sẻ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ví dụ: Chiến Lược Quản Trị Dòng Tiền & Tối Ưu Thuế 2026"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-bold text-foreground outline-none focus:border-[#003B95] focus:ring-1 focus:ring-[#003B95]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Khẩu Hiệu / Tagline Khóa Học
                    </label>
                    <input
                      type="text"
                      value={formTagline}
                      onChange={(e) => setFormTagline(e.target.value)}
                      placeholder="Ví dụ: Nâng cao năng lực tài chính chiến lược cho chủ doanh nghiệp CEO HN10"
                      className="w-full h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs text-foreground outline-none focus:border-[#003B95]"
                    />
                  </div>
                </div>

                {/* 2. Giảng Viên / Diễn Giả */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    <span>2. Giảng Viên &amp; Đơn Vị Đào Tạo</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Họ &amp; Tên Giảng Viên
                      </label>
                      <input
                        type="text"
                        value={formInstructorName}
                        onChange={(e) => setFormInstructorName(e.target.value)}
                        placeholder="ThS. Nguyễn Văn A"
                        className="w-full h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-semibold text-foreground outline-none focus:border-[#003B95]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Chức Danh / Học Vị
                      </label>
                      <input
                        type="text"
                        value={formInstructorTitle}
                        onChange={(e) => setFormInstructorTitle(e.target.value)}
                        placeholder="Chuyên gia Tài chính Doanh nghiệp"
                        className="w-full h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs text-foreground outline-none focus:border-[#003B95]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Đơn Vị Công Tác / Học Viện
                      </label>
                      <input
                        type="text"
                        value={formInstructorCompany}
                        onChange={(e) => setFormInstructorCompany(e.target.value)}
                        placeholder="Học viện Quản trị & CLB CEO HN10"
                        className="w-full h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs text-foreground outline-none focus:border-[#003B95]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Thời Gian & Hình Thức */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>3. Thời Gian &amp; Hình Thức Tổ Chức</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ngày Diễn Ra
                      </label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-semibold text-foreground outline-none focus:border-[#003B95]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Giờ Bắt Đầu
                      </label>
                      <input
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-semibold text-foreground outline-none focus:border-[#003B95]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Giờ Kết Thúc
                      </label>
                      <input
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-semibold text-foreground outline-none focus:border-[#003B95]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Hình Thức Tổ Chức
                      </label>
                      <select
                        value={formFormat}
                        onChange={(e) => setFormFormat(e.target.value as any)}
                        className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-bold text-foreground outline-none cursor-pointer focus:border-[#003B95]"
                      >
                        <option value="hybrid">⚡ Kết hợp Trực tiếp &amp; Online (Hybrid)</option>
                        <option value="online">🌐 Hoàn toàn Trực tuyến (Video Call Jitsi)</option>
                        <option value="offline">🏢 Trực tiếp tại Hội trường (Offline)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Trạng Thái Khóa Học
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-bold text-foreground outline-none cursor-pointer focus:border-[#003B95]"
                      >
                        <option value="upcoming">Sắp diễn ra</option>
                        <option value="ongoing">Đang diễn ra (Phát trực tiếp)</option>
                        <option value="completed">Đã kết thúc</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                  </div>

                  {/* UC-3: Tính chất buổi học (Cố định thứ 7 hàng tuần vs Không cố định) */}
                  <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                    <label className="block text-xs font-bold text-blue-900 dark:text-blue-200">
                      Tính Chất Khóa Đào Tạo (UC-3)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormIsFixed(true);
                          setFormScheduleType("saturday_weekly");
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                          formIsFixed && formScheduleType === "saturday_weekly"
                            ? "border-[#003B95] bg-blue-100/70 dark:bg-blue-900/50 text-[#003B95] dark:text-blue-300 ring-2 ring-[#003B95]/20"
                            : "border-slate-300 dark:border-slate-700 bg-background text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div>📅 Cố Định (Thứ 7 Hàng Tuần)</div>
                        <div className="text-[10.5px] font-normal text-slate-500 mt-0.5">
                          Định kỳ sinh hoạt nâng cao năng lực hội viên mỗi sáng Thứ 7
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormIsFixed(false);
                          setFormScheduleType("custom");
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                          !formIsFixed
                            ? "border-[#003B95] bg-blue-100/70 dark:bg-blue-900/50 text-[#003B95] dark:text-blue-300 ring-2 ring-[#003B95]/20"
                            : "border-slate-300 dark:border-slate-700 bg-background text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div>⚡ Buổi Học Riêng (Quỹ cá nhân)</div>
                        <div className="text-[10.5px] font-normal text-slate-500 mt-0.5">
                          Khóa học riêng tự chia đều kinh phí theo đầu người, tách biệt Quỹ chung
                        </div>
                      </button>
                    </div>

                    {!formIsFixed && (
                      <div className="mt-3 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 space-y-3">
                        <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <span>💰 Thiết Lập Kinh Phí & Chia Đều Tiền Vé (Quỹ Cá Nhân Riêng)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Tổng kinh phí dự toán buổi học riêng (VNĐ)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="50000"
                              value={formTotalCost || ""}
                              onChange={(e) => {
                                const cost = Number(e.target.value) || 0;
                                setFormTotalCost(cost);
                                const fee = formExpectedAttendees > 0 ? Math.round(cost / formExpectedAttendees) : 0;
                                setFormTicketTiers([
                                  {
                                    name: "Vé Buổi Học Riêng (Quỹ cá nhân)",
                                    price: fee,
                                    quantity: formExpectedAttendees,
                                    description: `Tự động chia đều: ${fee.toLocaleString('vi-VN')} đ/người. Quỹ cá nhân riêng biệt.`
                                  }
                                ]);
                              }}
                              placeholder="VD: 10000000"
                              className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-background text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Số lượng người dự kiến tham gia
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={formExpectedAttendees || ""}
                              onChange={(e) => {
                                const count = Math.max(1, Number(e.target.value) || 1);
                                setFormExpectedAttendees(count);
                                const fee = Math.round(formTotalCost / count);
                                setFormTicketTiers([
                                  {
                                    name: "Vé Buổi Học Riêng (Quỹ cá nhân)",
                                    price: fee,
                                    quantity: count,
                                    description: `Tự động chia đều: ${fee.toLocaleString('vi-VN')} đ/người. Quỹ cá nhân riêng biệt.`
                                  }
                                ]);
                              }}
                              placeholder="VD: 20"
                              className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-background text-xs font-semibold"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                          <span className="text-slate-600 dark:text-slate-400">Tiền vé tự động chia đều:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                            {formExpectedAttendees > 0 ? Math.round(formTotalCost / formExpectedAttendees).toLocaleString('vi-VN') : 0} đ / người
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 italic">
                          * Lưu ý: Dòng tiền của buổi học riêng sẽ tính vào Quỹ cá nhân riêng, tách hoàn toàn khỏi Quỹ chung CEO HN10.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* UC-3: Phân rã mốc thời gian trong 1 buổi học (Agenda Timetable) */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-background space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#003B95]" />
                        <span>Khung Thời Gian Chi Tiết Trong Buổi Học (Agenda Slots)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormAgenda([
                            ...formAgenda,
                            { time: "11:30 - 12:00", activity: "Hoạt động mới" },
                          ])
                        }
                        className="text-[11px] font-bold text-[#003B95] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Thêm mốc giờ
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {formAgenda.map((slot, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={slot.time}
                            onChange={(e) => {
                              const next = [...formAgenda];
                              next[sIdx].time = e.target.value;
                              setFormAgenda(next);
                            }}
                            placeholder="08:30 - 09:00"
                            className="w-28 h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-semibold"
                          />
                          <input
                            type="text"
                            value={slot.activity}
                            onChange={(e) => {
                              const next = [...formAgenda];
                              next[sIdx].activity = e.target.value;
                              setFormAgenda(next);
                            }}
                            placeholder="Nội dung hoạt động chi tiết..."
                            className="flex-1 h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                          />
                          {formAgenda.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormAgenda(formAgenda.filter((_, i) => i !== sIdx))
                              }
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Địa điểm (nếu Offline/Hybrid) */}
                  {formFormat !== "online" && (
                    <div className="pt-2 space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Địa Điểm Hội Trường Tổ Chức
                      </label>
                      <input
                        type="text"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        placeholder="Hội trường VIP Keangnam Landmark 72, Hà Nội"
                        className="w-full h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-semibold text-foreground outline-none focus:border-[#003B95]"
                      />
                      <input
                        type="text"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        placeholder="Số nhà, phố, quận/huyện chi tiết..."
                        className="w-full h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs text-foreground outline-none focus:border-[#003B95]"
                      />
                    </div>
                  )}

                  {/* Phòng Họp Trực Tuyến (nếu Online/Hybrid) */}
                  {formFormat !== "offline" && (
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Phòng Họp Trực Tuyến (Jitsi Video)
                        </label>
                        <input
                          type="text"
                          value={formRoomId}
                          onChange={(e) => {
                            setFormRoomId(e.target.value);
                            setFormRoomUrl(`https://meet.jit.si/${e.target.value}`);
                          }}
                          placeholder="Mã phòng họp..."
                          className="w-full h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-mono text-foreground outline-none focus:border-[#003B95]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Mật Mã Phòng Họp (Passcode)
                        </label>
                        <input
                          type="text"
                          value={formMeetingPasscode}
                          onChange={(e) => setFormMeetingPasscode(e.target.value)}
                          placeholder="198388"
                          className="w-full h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-mono font-bold text-foreground outline-none focus:border-[#003B95]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. SỐ LƯỢNG HỌC VIÊN TỐI ĐA & HẠNG VÉ (CÓ SỐ LƯỢNG - TUYỆT ĐỐI KHÔNG XẾP CHỖ) */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                      <Ticket className="h-4 w-4" />
                      <span>4. Số Lượng Học Viên &amp; Hạng Vé (Không Xếp Chỗ)</span>
                    </h3>
                    <div className="text-[11px] font-semibold text-slate-500">
                      Tự do vào lớp, quét mã QR điểm danh
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tổng Số Lượng Học Viên Tối Đa (Sức Chứa / Capacity) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={1000}
                      value={formMaxAttendees}
                      onChange={(e) => setFormMaxAttendees(e.target.value)}
                      placeholder="100"
                      className="w-full sm:w-48 h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-bold text-foreground outline-none focus:border-[#003B95]"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Hệ thống tự động khóa đăng ký khi đạt giới hạn số lượng học viên này.
                    </p>
                  </div>

                  {/* Bảng cấu hình các hạng vé */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Danh Sách Hạng Vé Học Viên
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormTicketTiers((prev) => [
                            ...prev,
                            {
                              name: `Hạng vé ${prev.length + 1}`,
                              price: 0,
                              quantity: 20,
                              description: "Quyền lợi học viên tiêu chuẩn",
                            },
                          ])
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-bold hover:bg-blue-100 transition cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Thêm Hạng Vé</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formTicketTiers.map((tier, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-800"
                        >
                          <input
                            type="text"
                            value={tier.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormTicketTiers((prev) =>
                                prev.map((t, i) => (i === idx ? { ...t, name: val } : t))
                              );
                            }}
                            placeholder="Tên hạng vé..."
                            className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-xs font-bold text-foreground outline-none focus:border-[#003B95]"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={tier.price}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setFormTicketTiers((prev) =>
                                  prev.map((t, i) => (i === idx ? { ...t, price: val } : t))
                                );
                              }}
                              placeholder="Giá vé (0đ = Miễn phí)"
                              className="w-28 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-xs font-semibold text-foreground outline-none"
                            />
                            <span className="text-[11px] text-slate-500 font-bold">VNĐ</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              value={tier.quantity}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 1;
                                setFormTicketTiers((prev) =>
                                  prev.map((t, i) => (i === idx ? { ...t, quantity: val } : t))
                                );
                              }}
                              placeholder="Số lượng"
                              className="w-20 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-xs font-bold text-foreground outline-none text-center"
                            />
                            <span className="text-[11px] text-slate-500">vé</span>
                          </div>
                          {formTicketTiers.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormTicketTiers((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer self-end sm:self-auto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Tài Liệu & Mô Tả */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span>5. Tài Liệu &amp; Nội Dung Giảng Dạy</span>
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Link Tài Liệu / Giáo Trình Slide
                    </label>
                    <input
                      type="url"
                      value={formMaterialsUrl}
                      onChange={(e) => setFormMaterialsUrl(e.target.value)}
                      placeholder="https://drive.google.com/... hoặc link tải slide"
                      className="w-full h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs text-foreground outline-none focus:border-[#003B95]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mô Tả &amp; Mục Tiêu Khóa Đào Tạo
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Tóm tắt nội dung trọng tâm, mục tiêu đạt được sau buổi học..."
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-normal text-foreground outline-none focus:border-[#003B95]"
                    />
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowWizardModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-card text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-[#003B95] text-white text-xs font-bold shadow-md hover:bg-[#002f78] transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>{editingTraining ? "Lưu Cập Nhật" : "Hoàn Tất Khai Báo"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL CHI TIẾT KHÓA HỌC ── */}
        {detailTraining && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="h-5 w-5 text-[#003B95]" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Chi Tiết Khóa Đào Tạo
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailTraining(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {detailTraining.title}
                  </h4>
                  {detailTraining.tagline && (
                    <p className="text-slate-500 mt-0.5">{detailTraining.tagline}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500 font-semibold block">Giảng viên:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {detailTraining.instructor_name || "Ban Đào Tạo"} (
                      {detailTraining.instructor_title || "Chuyên gia"})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Hình thức:</span>
                    <span className="font-bold text-[#003B95] capitalize">
                      {detailTraining.format || "Hybrid"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Quy mô chỗ ngồi:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {detailTraining.attendee_count || 0}/{detailTraining.max_attendees} học viên (Không xếp chỗ)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Thời gian:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {detailTraining.start_time
                        ? new Date(detailTraining.start_time).toLocaleString("vi-VN")
                        : "Chưa ấn định"}
                    </span>
                  </div>
                </div>

                {detailTraining.description && (
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Mục tiêu &amp; Nội dung:</div>
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                      {detailTraining.description}
                    </p>
                  </div>
                )}

                {/* Hạng vé */}
                {detailTraining.ticket_tiers && detailTraining.ticket_tiers.length > 0 && (
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Các Hạng Vé Khóa Học:
                    </div>
                    <div className="space-y-2">
                      {detailTraining.ticket_tiers.map((tt, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-background"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{tt.name}</div>
                            {tt.description && (
                              <div className="text-[11px] text-slate-500">{tt.description}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#003B95]">
                              {tt.price === 0
                                ? "Miễn Phí 0đ"
                                : `${tt.price.toLocaleString("vi-VN")} VNĐ`}
                            </div>
                            <div className="text-[11px] text-slate-500 font-semibold">
                              Số lượng: {tt.quantity} vé
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phòng họp online */}
                {detailTraining.room_url && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-blue-900 dark:text-blue-200">
                        Phòng Học Video Call Jitsi
                      </div>
                      <div className="text-[11px] text-blue-700 dark:text-blue-300 font-mono">
                        Pass: {detailTraining.meeting_passcode || "198388"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailTraining(null);
                        setActiveCallRoom({
                          id: detailTraining.id,
                          title: detailTraining.title,
                          link: detailTraining.room_url || "",
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-800 text-white font-bold text-xs shadow-xs hover:bg-blue-900 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Video className="h-4 w-4" />
                      <span>Vào Phòng Học</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL QR CHECK-IN ĐIỂM DANH HỌC VIÊN ── */}
        {activeQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card p-6 shadow-2xl text-center space-y-4">
              <button
                type="button"
                onClick={() => setActiveQrModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Mã QR Điểm Danh Học Viên
                </h3>
                <p className="text-xs text-slate-500 mt-1">{activeQrModal.title}</p>
              </div>

              <div className="flex justify-center p-3 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-xs">
                <QrCanvas
                  value={`CEOHN10_TRAINING_CHECKIN|TRAINING_ID:${activeQrModal.id}|TITLE:${encodeURIComponent(
                    activeQrModal.title
                  )}`}
                  size={180}
                />
              </div>

              <div className="text-[11px] text-slate-500">
                Học viên dùng Camera hoặc App CEO HN10 quét mã này tại cửa phòng học để xác nhận điểm danh tự động.
              </div>

              <button
                type="button"
                onClick={() => setActiveQrModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Modal Quản lý Học Viên, Điểm danh & Gửi slide bài giảng (UC-3) */}
        {activeAttendeesModal && (
          <TrainingAttendeesModal
            open={!!activeAttendeesModal}
            trainingId={activeAttendeesModal.id}
            trainingTitle={activeAttendeesModal.title}
            initialSlideUrl={(activeAttendeesModal as any).slide_url || (activeAttendeesModal as any).materials?.[0]?.url}
            onClose={() => setActiveAttendeesModal(null)}
            onUpdateCount={(count) => {
              setTrainings((prev) =>
                prev.map((tr) => (tr.id === activeAttendeesModal.id ? { ...tr, attendee_count: count } : tr))
              );
            }}
          />
        )}

        {/* Modal Phản Hồi & Đóng Góp Ý Kiến Sau Buổi Học (UC-3) */}
        {activeFeedbackModal && (
          <TrainingFeedbackModal
            open={!!activeFeedbackModal}
            trainingId={activeFeedbackModal.id}
            trainingTitle={activeFeedbackModal.title}
            onClose={() => setActiveFeedbackModal(null)}
          />
        )}

        {/* Modal Khai Báo Vật Dụng Hậu Cần Buổi Học (UC-4) */}
        {activeSupplyModal && (
          <SupplyDeclarationModal
            open={!!activeSupplyModal}
            targetType="training"
            targetId={activeSupplyModal.id}
            targetName={activeSupplyModal.title}
            department="Ban Đào Tạo & Ban Hậu Cần"
            onClose={() => setActiveSupplyModal(null)}
          />
        )}

        {/* Modal Quay Phim & Chụp Ảnh Tư Liệu Buổi Học (UC-3: Tự động lưu Quản lý tài liệu) */}
        {activeMediaRecordingModal && (
          <TrainingMediaModal
            open={!!activeMediaRecordingModal}
            trainingId={activeMediaRecordingModal.id}
            trainingTitle={activeMediaRecordingModal.title}
            existingMediaUrl={(activeMediaRecordingModal as any).media_url}
            onClose={() => setActiveMediaRecordingModal(null)}
            onUpdated={() => fetchTrainings()}
          />
        )}

        {/* ── MODAL PHÒNG HỌP TRỰC TUYẾN (IFRAME VIDEO CALL JITSI) ── */}
        {activeCallRoom && (
          <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-sm truncate">{activeCallRoom.title}</span>
                <span className="text-xs text-slate-400 font-mono">
                  (Video Call Jitsi Bảo Mật CLB CEO HN10)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeCallRoom.link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Mở Tab Riêng</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveCallRoom(null)}
                  className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full h-full bg-black">
              <iframe
                src={activeCallRoom.link}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
                title={activeCallRoom.title}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
