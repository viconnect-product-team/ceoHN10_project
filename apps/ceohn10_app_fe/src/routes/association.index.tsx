import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  GraduationCap,
  Users,
  QrCode,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  UserPlus,
  UserCheck,
  MessageSquare,
  Phone,
  Search,
  Copy,
  Check,
  Sparkles,
  Ticket,
  ScanLine,
  BookOpen,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Video,
  Award,
  Bell,
  RefreshCw,
  Handshake,
  CalendarDays,
  X,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";
import { AssociationMemberQrModal } from "@/components/member/AssociationMemberQrModal";
import { isPrivilegedAdminOrPresident, isMediaDepartmentMember } from "@/lib/checkin-gatekeeper-auth";
import { toast } from "sonner";
import { formatDisplayDate } from "@/lib/date-format";

export const Route = createFileRoute("/association/")({
  component: CeoHn10StudentAppScreen,
  head: () => ({
    meta: [
      { title: "Cổng Học Viên Doanh Nhân CEO HN10 | HanoiBA" },
      { name: "description", content: "Ứng dụng di động quản lý học viên, sự kiện, lớp học và kết nối doanh nhân CEO HN10." },
    ],
  }),
});

// Type definitions
interface StudentProfile {
  id: string;
  name: string;
  studentCode: string;
  companyName: string;
  position: string;
  cohort: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  joinDate?: string;
}

interface EventItem {
  id: string;
  name: string;
  date: string;
  location?: string;
  status: string;
  description?: string;
  isRegistered?: boolean;
  ticketCode?: string;
  isPaid?: boolean;
  price?: number;
}

interface ClassTrainingItem {
  id: string;
  title: string;
  moduleCode: string;
  instructor: string;
  date: string;
  duration: string;
  location: string;
  isOnline?: boolean;
  slideUrl?: string;
  status: "upcoming" | "completed" | "in_progress";
  attendanceMarked?: boolean;
}

interface PeerConnection {
  id: string;
  name: string;
  studentCode: string;
  companyName: string;
  position: string;
  industry: string;
  avatarUrl?: string;
  phone?: string;
  isConnected: boolean;
}

interface StudentTimelineActivity {
  id: string;
  title: string;
  category: "class" | "event" | "team_meeting";
  date: string;
  time: string;
  location: string;
  status: "registered" | "checked_in" | "pending";
}

export function CeoHn10StudentAppScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active main pillar tab
  const [activeTab, setActiveTab] = useState<"events" | "connect" | "classes" | "timeline">("events");

  // State Data
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [classes, setClasses] = useState<ClassTrainingItem[]>([]);
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [activities, setActivities] = useState<StudentTimelineActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchPeerQuery, setSearchPeerQuery] = useState("");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Selected ticket for modal viewer
  const [viewTicketEvent, setViewTicketEvent] = useState<EventItem | null>(null);
  // Selected detail event modal
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<EventItem | null>(null);

  // Quyền quét check-in sự kiện: Chỉ hiển thị cho Ban Truyền Thông hoặc Admin / Ban Tổ Chức
  const canScanCheckin = useMemo(() => {
    return isMediaDepartmentMember(user) || isPrivilegedAdminOrPresident(user);
  }, [user]);

  // Danh sách bài tập & nhiệm vụ của học viên CEO HN10
  const [studentAssignments, setStudentAssignments] = useState([
    {
      id: "asn-01",
      title: "Chuyên Đề 1: Kế Hoạch Tái Cấu Trúc Tài Chính & Quản Trị Dòng Tiền 2026",
      module: "MOD-FIN-01",
      deadline: "10/12/2026",
      instructor: "TS. Nguyễn Minh Tuấn",
      status: "completed" as const,
      score: "9.5/10",
      description: "Xây dựng bảng kế hoạch lưu chuyển tiền tệ 12 tháng và dự phóng vốn lưu động cho doanh nghiệp.",
    },
    {
      id: "asn-02",
      title: "Chuyên Đề 2: Bản Đồ Giao Thương B2B & Kết Nối Chuỗi Cung Ứng",
      module: "MOD-NEG-02",
      deadline: "18/12/2026",
      instructor: "ThS. Phạm Hoàng Nam",
      status: "pending" as const,
      description: "Lập hồ sơ năng lực doanh nghiệp và danh sách 5 đối tác tiềm năng trong Hiệp hội CEO HN10.",
    },
    {
      id: "asn-03",
      title: "Chuyên Đề 3: Ứng Dụng AI & Tự Động Hóa Vận Hành Lớp Doanh Nhân",
      module: "MOD-AI-03",
      deadline: "25/12/2026",
      instructor: "Kỹ sư Lê Thành Long",
      status: "in_progress" as const,
      description: "Thực hành thiết lập kịch bản chăm sóc khách hàng và đồng bộ dữ liệu CRM.",
    },
  ]);

  // Load Member & Academic Profile
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Current Member Profile
      let memberData: any = null;
      try {
        memberData = await fetchNestApi<any>("/members/me");
      } catch (e) {
        // Fallback to local user
      }

      const derivedStudentCode = memberData?.membership_code || memberData?.code || `HN10-CEO-${user?.id?.slice(0, 4)?.toUpperCase() || "8899"}`;

      setProfile({
        id: memberData?.id || user?.id || "guest",
        name: memberData?.full_name || memberData?.name || user?.name || user?.email?.split("@")[0] || "Học Viên Doanh Nhân",
        studentCode: derivedStudentCode,
        companyName: memberData?.company_name || memberData?.company || "Doanh Nghiệp Thành Viên CEO HN10",
        position: memberData?.position || "Chủ Tịch / Tổng Giám Đốc",
        cohort: "Khóa Doanh Nhân CEO HN10 (2026 - 2027)",
        avatarUrl: memberData?.avatar_url || (user as any)?.avatar_url,
        phone: memberData?.phone || (user as any)?.phone,
        email: memberData?.email || user?.email,
      });

      // 2. Load Real Events from Backend
      try {
        const eventsRes = await fetchNestApi<any[]>("/events");
        if (Array.isArray(eventsRes)) {
          setEvents(
            eventsRes.map((e) => ({
              id: e.id,
              name: e.name || e.title || "Sự Kiện CEO HN10",
              date: e.date || new Date().toISOString(),
              location: e.location || "Trung Tâm Hội Nghị Hà Nội",
              status: e.status || "upcoming",
              description: e.description,
              isRegistered: Boolean(e.registered || e.is_registered),
              ticketCode: `TKT-${e.id?.slice(0, 6)?.toUpperCase() || "VIP"}-${derivedStudentCode}`,
              price: e.price || 0,
            }))
          );
        }
      } catch (err) {
        setEvents([]);
      }

      // 3. Load Trainings / Classes from Backend
      try {
        const trainingsRes = await fetchNestApi<any[]>("/trainings");
        if (Array.isArray(trainingsRes) && trainingsRes.length > 0) {
          setClasses(
            trainingsRes.map((t, idx) => ({
              id: t.id,
              title: t.title || t.name || `Chuyên đề ${idx + 1}: Quản Trị Chiến Lược`,
              moduleCode: `MOD-${idx + 1}`,
              instructor: t.instructor || t.speaker || "Chuyên Gia Đào Tạo Cao Cấp",
              date: t.date || new Date(Date.now() + 86400000 * (idx + 2)).toISOString(),
              duration: t.duration || "3.5 Giờ (08:30 - 12:00)",
              location: t.location || "Hội Trường VIP CEO HN10",
              isOnline: Boolean(t.is_online),
              slideUrl: t.slide_url,
              status: t.status || "upcoming",
              attendanceMarked: Boolean(t.attended),
            }))
          );
        } else {
          // Default Academic Curriculum for CEO HN10 Class
          setClasses([
            {
              id: "cls-01",
              title: "Chuyên Đề 1: Tái Cấu Trúc Tài Chính & Quản Trị Dòng Tiền Doanh Nghiệp 2026",
              moduleCode: "MOD-FIN-01",
              instructor: "TS. Nguyễn Minh Tuấn - Chuyên gia Tài chính Doanh nghiệp",
              date: "2026-12-05T08:30:00.000Z",
              duration: "08:30 - 12:00 (Thứ Bảy)",
              location: "Phòng Hội Thảo A, Khách Sạn Daewoo Hà Nội",
              status: "upcoming",
              slideUrl: "#",
            },
            {
              id: "cls-02",
              title: "Chuyên Đề 2: Nghệ Thuật Đàm Phán & Giao Thương Chiến Lược B2B Cho Lãnh Đạo",
              moduleCode: "MOD-NEG-02",
              instructor: "ThS. Phạm Hoàng Nam - Viện Quản Trị Kinh Doanh",
              date: "2026-12-12T08:30:00.000Z",
              duration: "08:30 - 12:00 (Thứ Bảy)",
              location: "Hội Trường HanoiBA, 38 Bà Triệu, Hà Nội",
              status: "upcoming",
              slideUrl: "#",
            },
            {
              id: "cls-03",
              title: "Chuyên Đề 3: Ứng Dụng Trí Tuệ Nhân Tạo (AI) Tối Ưu Hóa Vận Hành Doanh Nghiệp",
              moduleCode: "MOD-AI-03",
              instructor: "Kỹ Sư Trưởng Lê Thành Long - Viện Công Nghệ Số",
              date: "2026-12-19T08:30:00.000Z",
              duration: "08:30 - 12:00 (Thứ Bảy)",
              location: "Trực Tuyến Qua Zoom VIP & Phòng Lab Số",
              isOnline: true,
              status: "upcoming",
              slideUrl: "#",
            },
          ]);
        }
      } catch (err) {
        // Fallback default modules
      }

      // 4. Load Peer Network / Members
      try {
        const membersRes = await fetchNestApi<any[]>("/members");
        if (Array.isArray(membersRes) && membersRes.length > 0) {
          setPeers(
            membersRes
              .filter((m) => m.id !== memberData?.id)
              .map((m, idx) => ({
                id: m.id,
                name: m.full_name || m.name || "Doanh Nhân Hội Viên",
                studentCode: m.membership_code || `HN10-CEO-${1000 + idx}`,
                companyName: m.company_name || m.company || "Tập Đoàn Doanh Nghiệp HN10",
                position: m.position || "Tổng Giám Đốc",
                industry: m.industry || "Thương Mại & Dịch Vụ",
                avatarUrl: m.avatar_url,
                phone: m.phone,
                isConnected: idx % 3 === 0, // Mock connection status
              }))
          );
        }
      } catch (err) {
        setPeers([]);
      }

      // 5. Timeline Activities based on student code
      setActivities([
        {
          id: "act-1",
          title: "Điểm Danh: Chuyên Đề Tái Cấu Trúc Tài Chính 2026",
          category: "class",
          date: "05/12/2026",
          time: "08:30 - 12:00",
          location: "Khách Sạn Daewoo Hà Nội",
          status: "registered",
        },
        {
          id: "act-2",
          title: "Họp Gặp Mặt Ban Giao Thương & Team Kết Nối B2B Nhóm 2",
          category: "team_meeting",
          date: "08/12/2026",
          time: "14:00 - 16:30",
          location: "Văn Phòng Hiệp Hội HanoiBA",
          status: "registered",
        },
        {
          id: "act-3",
          title: "Dạ Tiệc Gala Doanh Nhân & Tổng Kết Khóa CEO HN10",
          category: "event",
          date: "26/12/2026",
          time: "18:00 - 21:30",
          location: "Trung Tâm Sự Kiện Quốc Gia",
          status: "pending",
        },
      ]);
    } catch (error) {
      console.error("Error loading student portal data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Copy Student Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success("Đã sao chép Mã Học Viên!", { description: code });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // One-click Register Event
  const handleRegisterEvent = (event: EventItem) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              isRegistered: true,
              ticketCode: `TKT-${event.id?.slice(0, 6)?.toUpperCase()}-${profile?.studentCode || "VIP"}`,
            }
          : e
      )
    );
    // Add to activity timeline
    setActivities((prev) => [
      {
        id: `act-evt-${event.id}`,
        title: `Tham Gia: ${event.name}`,
        category: "event",
        date: formatDisplayDate(event.date),
        time: "08:00 - 17:00",
        location: event.location || "Hội trường CEO HN10",
        status: "registered",
      },
      ...prev,
    ]);
    toast.success("Đăng ký sự kiện thành công!", {
      description: `Mã vé đã được liên kết với Mã Học Viên ${profile?.studentCode}.`,
    });
  };

  // Toggle Friend/Peer Connection
  const handleToggleConnect = (peerId: string) => {
    setPeers((prev) =>
      prev.map((p) => {
        if (p.id === peerId) {
          const nextState = !p.isConnected;
          toast.success(nextState ? "Đã gửi lời mời kết bạn doanh nhân!" : "Đã hủy kết nối.");
          return { ...p, isConnected: nextState };
        }
        return p;
      })
    );
  };

  // Filter peers
  const filteredPeers = useMemo(() => {
    if (!searchPeerQuery.trim()) return peers;
    const q = searchPeerQuery.toLowerCase();
    return peers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.companyName.toLowerCase().includes(q) ||
        p.industry.toLowerCase().includes(q) ||
        p.studentCode.toLowerCase().includes(q)
    );
  }, [peers, searchPeerQuery]);

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col pb-24 text-slate-800">
      {/* ── TOP EXECUTIVE APP BAR (TỐI GIẢN: NỀN TRẮNG, TEXT ĐEN, LOGO & TÊN CHUẨN CEO HN10) ── */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 flex items-center justify-between shadow-xs border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <img
            src="/app-icon.png"
            alt="CEO HN10"
            className="w-9 h-9 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/app-icon.png";
            }}
          />
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>CLB Doanh Nhân CEO HN10</span>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                HanoiBA
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[240px]">
              Ứng Dụng Học Viên &amp; Kết Nối Doanh Nghiệp
            </p>
          </div>
        </div>

        {/* Header tối giản: Không để nút quét QR hay nút hiển thị QR ở đây */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            Khóa 2026
          </span>
        </div>
      </header>

      {/* ── HERO STUDENT ID CARD (THẺ ĐỊNH DANH HỌC VIÊN SANG TRỌNG) ── */}
      <section className="px-4 pt-4 pb-2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002244] via-[#003B95] to-[#0A192F] p-4 text-white shadow-xl border border-amber-400/30">
          {/* Background decorative watermark */}
          <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-amber-400/5 blur-2xl pointer-events-none" />
          <div className="absolute right-4 top-4 text-amber-400/10 font-black text-6xl select-none pointer-events-none">
            CEO
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            {/* Top row: Cohort & Status */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {profile?.cohort || "Khóa Học Viên 2026"}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                Đang Kích Hoạt
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-3.5 pt-1">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 shadow-md bg-slate-800 flex items-center justify-center text-white font-bold text-xl">
                  {profile?.avatarUrl && resolveMediaUrl(profile.avatarUrl) ? (
                    <img src={resolveMediaUrl(profile.avatarUrl) || undefined} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    profile?.name?.charAt(0)?.toUpperCase() || "C"
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[#001D4A] shadow">
                  <Award className="w-3 h-3" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white tracking-tight truncate flex items-center gap-1.5">
                  {profile?.name}
                </h2>
                <p className="text-xs text-amber-200/90 font-medium truncate">
                  {profile?.position}
                </p>
                <p className="text-[11px] text-slate-300 truncate flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  {profile?.companyName}
                </p>
              </div>
            </div>

            {/* Bottom row: Student Code with Copy & Actions */}
            <div className="mt-1 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-300 font-medium">MÃ HỌC VIÊN:</span>
                <span className="font-mono text-sm font-black text-amber-300 tracking-wider bg-black/30 px-2 py-0.5 rounded border border-amber-400/30">
                  {profile?.studentCode}
                </span>
                <button
                  onClick={() => profile && handleCopyCode(profile.studentCode)}
                  className="p-1.5 rounded hover:bg-white/10 active:scale-95 text-slate-300 transition-colors"
                  title="Sao chép mã"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                onClick={() => setQrModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-[#001D4A] text-xs font-bold shadow transition-all"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Mã QR Thẻ</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 PHÂN HỆ TRỌNG TÂM: INTERACTIVE PILLAR NAVIGATION ── */}
      <section className="px-4 py-2 sticky top-[57px] z-20 bg-slate-50/95 backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-white border border-slate-200/80 shadow-sm">
          <button
            onClick={() => setActiveTab("events")}
            className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              activeTab === "events"
                ? "bg-[#003B95] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === "events" ? "text-amber-400" : "text-[#003B95]"}`} />
            <span className="text-[11px] leading-tight">Sự Kiện</span>
          </button>

          <button
            onClick={() => setActiveTab("connect")}
            className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              activeTab === "connect"
                ? "bg-[#003B95] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === "connect" ? "text-amber-400" : "text-[#003B95]"}`} />
            <span className="text-[11px] leading-tight">Kết Bạn</span>
          </button>

          <button
            onClick={() => setActiveTab("classes")}
            className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              activeTab === "classes"
                ? "bg-[#003B95] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${activeTab === "classes" ? "text-amber-400" : "text-[#003B95]"}`} />
            <span className="text-[11px] leading-tight">Lớp Học</span>
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              activeTab === "timeline"
                ? "bg-[#003B95] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className={`w-4 h-4 ${activeTab === "timeline" ? "text-amber-400" : "text-[#003B95]"}`} />
            <span className="text-[11px] leading-tight">Lịch Trình</span>
          </button>
        </div>
      </section>

      {/* ── NỘI DUNG CHI TIẾT THEO TỪNG PHÂN HỆ ── */}
      <main className="px-4 py-2 flex-1">
        {/* ======================================================== */}
        {/* PHÂN HỆ 1: 📅 TRANG CHỦ SỰ KIỆN — 3 KHỐI THEO QUY CHUẨN   */}
        {/* ======================================================== */}
        {activeTab === "events" && (
          <div className="space-y-6">
            {/* ── KHỐI 1: SỰ KIỆN SẮP TỚI ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#DC2626]" />
                    <span>Sự Kiện Sắp Tới</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Xem chi tiết, đăng ký vé tham dự và quét mã QR</p>
                </div>
                <Link
                  to="/association/events"
                  className="text-xs font-semibold text-[#003B95] hover:underline flex items-center gap-0.5"
                >
                  Xem tất cả <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {events.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-sm">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Chưa có sự kiện nào sắp tới</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Các sự kiện mới của Hiệp hội CEO HN10 sẽ được cập nhật liên tục tại đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#DC2626] border border-rose-200">
                              Sự Kiện CEO HN10
                            </span>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {event.price && event.price > 0 ? `${event.price.toLocaleString("vi-VN")} đ` : "Miễn phí (0đ)"}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                            {event.name}
                          </h4>
                        </div>
                      </div>

                      <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">{formatDisplayDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{event.location || "Trung tâm Hội nghị Hà Nội"}</span>
                        </div>
                      </div>

                      {/* Action buttons: Xem chi tiết & Đăng ký qua App */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailEvent(event)}
                          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#003B95]" />
                          <span>Xem Chi Tiết</span>
                        </button>

                        {event.isRegistered ? (
                          <button
                            type="button"
                            onClick={() => setViewTicketEvent(event)}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#003B95] text-white font-bold text-xs hover:bg-[#002b6d] shadow transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Ticket className="w-3.5 h-3.5 text-amber-400" />
                            <span>Mã Vé QR</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRegisterEvent(event)}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#DC2626] hover:bg-[#b91c1c] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>Đăng Ký Ngay</span>
                          </button>
                        )}

                        {/* Nút check in quét mã QR chỉ show cho Ban Truyền Thông / Admin */}
                        {canScanCheckin && (
                          <Link
                            to="/association/checkin"
                            className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#001D4A] font-bold text-xs shadow-sm flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                            title="Soát vé Check-in (Ban Truyền Thông)"
                          >
                            <ScanLine className="w-3.5 h-3.5" />
                            <span>QR</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── KHỐI 2: HỌC VIÊN MỚI THAM GIA ── */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-[#003B95]" />
                    <span>Học Viên Mới Tham Gia</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Chào mừng các lãnh đạo doanh nghiệp vừa gia nhập CEO HN10</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("connect")}
                  className="text-xs font-semibold text-[#003B95] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Mạng lưới <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {peers.slice(0, 4).map((peer) => (
                  <div
                    key={peer.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 overflow-hidden border border-amber-300">
                        {peer.avatarUrl && resolveMediaUrl(peer.avatarUrl) ? (
                          <img src={resolveMediaUrl(peer.avatarUrl) || undefined} alt={peer.name} className="w-full h-full object-cover" />
                        ) : (
                          peer.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{peer.name}</h4>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                            Mới
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{peer.companyName}</p>
                        <span className="font-mono text-[9px] text-slate-400 font-semibold">{peer.studentCode}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleConnect(peer.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shrink-0 cursor-pointer ${
                        peer.isConnected
                          ? "bg-slate-100 text-slate-600"
                          : "bg-blue-50 text-[#003B95] hover:bg-blue-100 border border-blue-200"
                      }`}
                    >
                      {peer.isConnected ? "Đã Kết Nối" : "+ Kết Bạn"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── KHỐI 3: BÀI TẬP & NHIỆM VỤ CỦA HỌC VIÊN ── */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#F59E0B]" />
                    <span>Bài Tập &amp; Nhiệm Vụ Của Học Viên</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Chuyên đề học tập, bài thu hoạch và kết nối giao thương</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("classes")}
                  className="text-xs font-semibold text-[#003B95] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Giáo trình <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {studentAssignments.map((asn) => (
                  <div
                    key={asn.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {asn.module}
                          </span>
                          <span className="text-[10px] text-slate-500">Hạn nộp: <b>{asn.deadline}</b></span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                          {asn.title}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          asn.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : asn.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {asn.status === "completed"
                          ? `Đã nộp (${asn.score})`
                          : asn.status === "in_progress"
                          ? "Đang làm"
                          : "Cần nộp bài"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {asn.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Giảng viên: <b>{asn.instructor}</b></span>
                      <button
                        type="button"
                        onClick={() => toast.success(`Mở chuyên đề: ${asn.title}`)}
                        className="font-bold text-[#003B95] hover:underline cursor-pointer"
                      >
                        {asn.status === "completed" ? "Xem Lại Bài Nộp" : "Nộp Bài Ngay →"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHÂN HỆ 2: 🤝 KẾT BẠN DOANH NHÂN (NETWORKING)            */}
        {/* ======================================================== */}
        {activeTab === "connect" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#003B95]" />
                  Kết Nối Bạn Học & Doanh Nhân
                </h3>
                <p className="text-[11px] text-slate-500">Mạng lưới thành viên cùng lớp và Hiệp hội</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                {peers.length} Thành viên
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm bạn học, công ty, ngành nghề..."
                value={searchPeerQuery}
                onChange={(e) => setSearchPeerQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003B95]/20 focus:border-[#003B95]"
              />
            </div>

            {/* Peer List */}
            {filteredPeers.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center border border-slate-200 shadow-sm">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Không tìm thấy hội viên phù hợp</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredPeers.map((peer) => (
                  <div
                    key={peer.id}
                    className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                        {peer.avatarUrl && resolveMediaUrl(peer.avatarUrl) ? (
                          <img src={resolveMediaUrl(peer.avatarUrl) || undefined} alt={peer.name} className="w-full h-full object-cover" />
                        ) : (
                          peer.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                          {peer.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {peer.position} • {peer.companyName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold text-[#003B95] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {peer.industry}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {peer.studentCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Connect Action Button */}
                    <button
                      onClick={() => handleToggleConnect(peer.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all active:scale-95 flex items-center gap-1 ${
                        peer.isConnected
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-[#003B95] text-white hover:bg-[#002b6d] shadow-sm"
                      }`}
                    >
                      {peer.isConnected ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã Kết Nối</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Kết Bạn</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PHÂN HỆ 3: 🎓 LỚP HỌC DOANH TRÍ (TRAININGS & CLASSES)   */}
        {/* ======================================================== */}
        {activeTab === "classes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-500" />
                  Chương Trình Đào Tạo CEO HN10
                </h3>
                <p className="text-[11px] text-slate-500">Các học phần, bài giảng và tài liệu chuyên sâu</p>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {classes.length} Chuyên Đề
              </span>
            </div>

            <div className="space-y-3">
              {classes.map((cls, idx) => (
                <div
                  key={cls.id}
                  className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                      {cls.moduleCode}
                    </span>
                    {cls.isOnline ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        <Video className="w-3 h-3" /> Zoom Trực Tuyến
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        <Building2 className="w-3 h-3" /> Tại Hội Trường
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {cls.title}
                  </h4>

                  <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                    <p className="font-medium text-slate-700">
                      👨‍🏫 Giảng viên: <span className="font-semibold text-[#003B95]">{cls.instructor}</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cls.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cls.location}</span>
                    </div>
                  </div>

                  {/* Class actions */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toast.info("Đang tải slide bài giảng...", { description: cls.title })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold active:scale-95 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Slide & Tài Liệu</span>
                    </button>

                    <button
                      onClick={() => toast.success("Đã điểm danh buổi học thành công!", { description: cls.title })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#003B95] hover:bg-[#002b6d] text-white text-xs font-bold active:scale-95 shadow transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Điểm Danh Học</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHÂN HỆ 4: 🗓️ LỊCH & HOẠT ĐỘNG CỦA MÃ HỌC VIÊN          */}
        {/* ======================================================== */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#003B95]" />
                  Lịch Trình Cá Nhân Hóa
                </h3>
                <p className="text-[11px] text-slate-500">
                  Hoạt động theo Mã Học Viên: <span className="font-mono font-bold text-[#003B95]">{profile?.studentCode}</span>
                </p>
              </div>
              <Link
                to="/association/calendar"
                className="text-xs font-semibold text-[#003B95] hover:underline flex items-center gap-0.5"
              >
                Mở Lịch Tháng <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Timeline cards */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {activities.map((act) => {
                const isClass = act.category === "class";
                const isEvent = act.category === "event";
                const isMeeting = act.category === "team_meeting";

                return (
                  <div key={act.id} className="relative group">
                    {/* Timeline bullet dot */}
                    <div
                      className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                        isClass
                          ? "bg-amber-500"
                          : isEvent
                          ? "bg-[#DC2626]"
                          : "bg-[#003B95]"
                      }`}
                    />

                    <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            isClass
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : isEvent
                              ? "bg-rose-50 text-[#DC2626] border border-rose-200"
                              : "bg-blue-50 text-[#003B95] border border-blue-200"
                          }`}
                        >
                          {isClass ? "Buổi Học" : isEvent ? "Sự Kiện" : "Gặp Mặt Team"}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {act.date}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {act.title}
                      </h4>

                      <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{act.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{act.location}</span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {act.status === "registered" ? "Đã Xác Nhận Tham Gia" : "Cần Phản Hồi"}
                        </span>
                        <button
                          onClick={() => toast.success("Đã đồng bộ lịch vào điện thoại thành công!")}
                          className="text-[11px] font-bold text-[#003B95] hover:underline"
                        >
                          Thêm vào Lịch máy
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL HIỂN THỊ VÉ ĐIỆN TỬ VỚI MÃ QR ── */}
      {viewTicketEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-gradient-to-r from-[#001D4A] to-[#003B95] p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  VÉ ĐIỆN TỬ CHÍNH THỨC
                </span>
                <h3 className="text-sm font-bold text-white leading-tight mt-0.5">
                  {viewTicketEvent.name}
                </h3>
              </div>
              <button
                onClick={() => setViewTicketEvent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center text-center space-y-4">
              {/* QR Container */}
              <div className="p-3 bg-white rounded-xl border-2 border-dashed border-[#003B95]/30 shadow-inner flex flex-col items-center justify-center">
                <div className="w-44 h-44 bg-slate-900 rounded-lg flex items-center justify-center text-white p-2">
                  {/* Visual QR representation */}
                  <QrCode className="w-36 h-36 text-white" />
                </div>
                <p className="mt-2 text-[11px] text-slate-500 font-medium">
                  Đưa mã này cho lễ tân khi check-in tại cửa
                </p>
              </div>

              {/* Ticket Details */}
              <div className="w-full bg-slate-50 rounded-xl p-3 text-left space-y-1.5 border border-slate-200/80 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã vé:</span>
                  <span className="font-mono font-bold text-[#DC2626]">{viewTicketEvent.ticketCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Học viên:</span>
                  <span className="font-bold text-slate-800">{profile?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã học viên:</span>
                  <span className="font-mono font-semibold text-slate-700">{profile?.studentCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian:</span>
                  <span className="font-medium text-slate-700">{formatDisplayDate(viewTicketEvent.date)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  toast.success("Đã tải ảnh vé điện tử về máy!");
                  setViewTicketEvent(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#003B95] hover:bg-[#002b6d] active:scale-98 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Lưu Vé Vào Thư Viện Ảnh</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XEM CHI TIẾT SỰ KIỆN & ĐĂNG KÝ QUA APP ── */}
      {selectedDetailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 text-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex-1 pr-2">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#DC2626] border border-rose-200 mb-1">
                  Chi Tiết Sự Kiện
                </span>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {selectedDetailEvent.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailEvent(null)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3.5 pr-1 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-[#003B95] shrink-0" />
                  <span>Thời gian: <b>{formatDisplayDate(selectedDetailEvent.date)}</b></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Địa điểm: <b>{selectedDetailEvent.location || "Trung tâm Hội nghị Hà Nội"}</b></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Ticket className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span>Phí tham dự: <b className="text-[#DC2626]">{selectedDetailEvent.price && selectedDetailEvent.price > 0 ? `${selectedDetailEvent.price.toLocaleString("vi-VN")} đ` : "Miễn phí (0đ)"}</b></span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Giới Thiệu Chương Trình:</h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {selectedDetailEvent.description || "Chương trình quy tụ các chuyên gia kinh tế, lãnh đạo doanh nghiệp hàng đầu trong CLB Doanh Nhân CEO HN10 nhằm kết nối giao thương, chia sẻ kinh nghiệm quản trị và mở rộng cơ hội hợp tác chiến lược."}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1.5">Lịch Trình Chi Tiết:</h4>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                    <span className="font-mono font-bold text-[#003B95]">08:00 - 08:45</span>
                    <span>Đón tiếp đại biểu, quét mã QR Check-in &amp; Tea-break giao lưu</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                    <span className="font-mono font-bold text-[#003B95]">08:45 - 10:30</span>
                    <span>Khai mạc sự kiện, Báo cáo &amp; Tọa đàm chuyên đề doanh nghiệp</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                    <span className="font-mono font-bold text-[#003B95]">10:30 - 11:30</span>
                    <span>Giao thương B2B, Biểu quyết &amp; Bốc thăm trúng thưởng may mắn</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedDetailEvent(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Đóng
              </button>

              {selectedDetailEvent.isRegistered ? (
                <button
                  type="button"
                  onClick={() => {
                    setViewTicketEvent(selectedDetailEvent);
                    setSelectedDetailEvent(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#003B95] hover:bg-[#002b6d] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-amber-400" />
                  <span>Xem Vé Điện Tử QR Của Bạn</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleRegisterEvent(selectedDetailEvent);
                    setSelectedDetailEvent(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#DC2626] hover:bg-[#b91c1c] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Đăng Ký Tham Gia Sự Kiện Này</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL QR ĐỊNH DANH HỌC VIÊN CÁ NHÂN ── */}
      <AssociationMemberQrModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        memberCode={profile?.studentCode || ""}
        memberName={profile?.name || "Học viên CEO HN10"}
        memberTitle={profile?.position || "Chủ tịch / Tổng Giám Đốc"}
        memberCompany={profile?.companyName || "CLB Doanh Nhân CEO HN10"}
        memberAvatar={profile?.avatarUrl || null}
      />
    </div>
  );
}
