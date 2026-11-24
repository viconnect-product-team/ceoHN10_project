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
  Search,
  Copy,
  Check,
  Sparkles,
  Ticket,
  ScanLine,
  BookOpen,
  ChevronRight,
  Download,
  Video,
  Award,
  X,
  Compass,
  Milestone,
  Heart,
  Send,
  Flame,
  ArrowRight,
  TrendingUp,
  FileText,
  Briefcase,
  Layers,
  ShieldCheck,
  ChevronLeft,
  Bell,
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
  highlightQuote?: string;
  confirmedCount?: number;
}

interface ClassTrainingItem {
  id: string;
  title: string;
  moduleCode: string;
  instructor: string;
  instructorTitle?: string;
  instructorAvatar?: string;
  date: string;
  duration: string;
  location: string;
  isOnline?: boolean;
  slideUrl?: string;
  status: "upcoming" | "completed" | "in_progress";
  attendanceMarked?: boolean;
  description?: string;
  objectives?: string[];
  attendeesCount?: number;
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

interface JourneyMilestone {
  id: string;
  stepNumber: number;
  title: string;
  category: "class" | "event" | "b2b_meeting" | "gala";
  date: string;
  time: string;
  location: string;
  status: "completed" | "in_progress" | "upcoming";
  badge: string;
  scoreOrTag?: string;
  referenceId?: string;
}

interface ClassComment {
  id: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

export function CeoHn10StudentAppScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active main tab: "home" (Bento & Slider), "classes", "events", "connect"
  const [activeTab, setActiveTab] = useState<"home" | "classes" | "events" | "connect">("home");

  // State Data
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [classes, setClasses] = useState<ClassTrainingItem[]>([]);
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchPeerQuery, setSearchPeerQuery] = useState("");

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Selected ticket for modal viewer
  const [viewTicketEvent, setViewTicketEvent] = useState<EventItem | null>(null);
  // Selected detail event modal
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<EventItem | null>(null);

  // Selected detail class / course modal
  const [selectedDetailClass, setSelectedDetailClass] = useState<ClassTrainingItem | null>(null);
  const [classComments, setClassComments] = useState<ClassComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [classDetailActiveTab, setClassDetailActiveTab] = useState<"info" | "discussion" | "materials">("info");

  // Quyền quét check-in sự kiện: Chỉ hiển thị cho Ban Truyền Thông hoặc Admin / Ban Tổ Chức
  const canScanCheckin = useMemo(() => {
    return isMediaDepartmentMember(user) || isPrivilegedAdminOrPresident(user);
  }, [user]);

  // Hành trình học tập & sự kiện CEO HN10 (Timeline Milestone Stations)
  const [journeyMilestones, setJourneyMilestones] = useState<JourneyMilestone[]>([
    {
      id: "jrn-01",
      stepNumber: 1,
      title: "Lễ Khai Giảng & Ra Mắt Lớp Doanh Nhân CEO HN10",
      category: "gala",
      date: "15/11/2026",
      time: "08:30 - 12:00",
      location: "Trung Tâm Hội Nghị Quốc Gia",
      status: "completed",
      badge: "Khai Giảng",
      scoreOrTag: "Đã Điểm Danh 100%",
    },
    {
      id: "jrn-02",
      stepNumber: 2,
      title: "Chuyên Đề 1: Tái Cấu Trúc Tài Chính & Quản Trị Dòng Tiền 2026",
      category: "class",
      date: "05/12/2026",
      time: "08:30 - 12:00",
      location: "Khách Sạn Daewoo Hà Nội",
      status: "in_progress",
      badge: "Chuyên Đề 01",
      scoreOrTag: "Đang Học · MOD-FIN-01",
      referenceId: "cls-01",
    },
    {
      id: "jrn-03",
      stepNumber: 3,
      title: "Chương Trình Giao Thương & Cafe Connect B2B Nhóm 2",
      category: "b2b_meeting",
      date: "12/12/2026",
      time: "14:00 - 17:00",
      location: "Trụ Sở Hiệp Hội HanoiBA",
      status: "upcoming",
      badge: "Kết Nối B2B",
      scoreOrTag: "Đã Đăng Ký",
    },
    {
      id: "jrn-04",
      stepNumber: 4,
      title: "Chuyên Đề 2: Nghệ Thuật Đàm Phán & Giao Thương Chiến Lược B2B",
      category: "class",
      date: "19/12/2026",
      time: "08:30 - 12:00",
      location: "Hội Trường HanoiBA, 38 Bà Triệu",
      status: "upcoming",
      badge: "Chuyên Đề 02",
      scoreOrTag: "Sắp Tới · MOD-NEG-02",
      referenceId: "cls-02",
    },
    {
      id: "jrn-05",
      stepNumber: 5,
      title: "Dạ Tiệc Gala Doanh Nhân & Trao Chứng Chỉ Tốt Nghiệp CEO HN10",
      category: "gala",
      date: "26/12/2026",
      time: "18:00 - 21:30",
      location: "Khách Sạn Melia Hà Nội",
      status: "upcoming",
      badge: "Dạ Khúc CEO",
      scoreOrTag: "Mở Vé VIP",
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
        if (Array.isArray(eventsRes) && eventsRes.length > 0) {
          setEvents(
            eventsRes.map((e, idx) => ({
              id: e.id,
              name: e.name || e.title || "Sự Kiện CEO HN10",
              date: e.date || new Date(Date.now() + 86400000 * (idx * 3 + 1)).toISOString(),
              location: e.location || "Trung Tâm Hội Nghị Hà Nội",
              status: e.status || "upcoming",
              description: e.description,
              isRegistered: Boolean(e.registered || e.is_registered),
              ticketCode: `TKT-${e.id?.slice(0, 6)?.toUpperCase() || "VIP"}-${derivedStudentCode}`,
              price: e.price || 0,
              highlightQuote: idx === 0 
                ? "“Gặp gỡ những người dẫn đầu để cùng kiến tạo tương lai thịnh vượng.”" 
                : "“Giao thương bền vững khởi đầu từ sự thấu hiểu và sẻ chia giá trị.”",
              confirmedCount: 38 + idx * 7,
            }))
          );
        } else {
          // Default Event Carousel list for Slide View (Concept 3)
          setEvents([
            {
              id: "evt-01",
              name: "Dạ Tiệc Tất Niên Year End Party 2026: Gắn Kết & Tôn Vinh",
              date: "2026-12-26T18:00:00.000Z",
              location: "Ballroom Khách Sạn Melia, Hà Nội",
              status: "upcoming",
              description: "Đêm hội kết nối tinh hoa, tôn vinh các doanh nghiệp tiêu biểu và giao lưu nghệ thuật thượng đỉnh của Hiệp hội CEO HN10.",
              isRegistered: true,
              ticketCode: `VIP-MELIA-${derivedStudentCode}`,
              price: 0,
              highlightQuote: "“Tôn vinh hành trình kiên định và bản lĩnh tiên phong của các nhà lãnh đạo.”",
              confirmedCount: 68,
            },
            {
              id: "evt-02",
              name: "Lễ Khai Giảng Khóa Học Doanh Trí CEO HN10 Khóa II",
              date: "2026-12-30T08:30:00.000Z",
              location: "Trung Tâm Hội Nghị Quốc Gia Hà Nội",
              status: "upcoming",
              description: "Lễ ra mắt học phần chiến lược mới, trao học bổng kết nối và khai phóng tư duy điều hành hiện đại.",
              isRegistered: false,
              ticketCode: `TKT-KG2-${derivedStudentCode}`,
              price: 1000000,
              highlightQuote: "“Học hỏi không ngừng là vũ khí tối thượng của người thuyền trưởng.”",
              confirmedCount: 45,
            },
            {
              id: "evt-03",
              name: "Diễn Đàn Giao Thương B2B & Chuỗi Cung Ứng Thủ Đô",
              date: "2027-01-10T14:00:00.000Z",
              location: "Trụ Sở Hiệp Hội Doanh Nghiệp HanoiBA",
              status: "upcoming",
              description: "Ký kết 20 biên bản ghi nhớ hợp tác thương mại đa ngành, xúc tiến đầu tư nội khối CEO HN10.",
              isRegistered: false,
              ticketCode: `TKT-B2B-${derivedStudentCode}`,
              price: 0,
              highlightQuote: "“Một cánh én không làm nên mùa xuân, một doanh nhân cần cả một cộng đồng.”",
              confirmedCount: 52,
            },
          ]);
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
              moduleCode: t.code || `MOD-${idx + 1}`,
              instructor: t.instructor || t.speaker || "Chuyên Gia Đào Tạo Cao Cấp",
              instructorTitle: t.instructor_title || "Chuyên gia Kinh tế & Quản trị Doanh nghiệp",
              instructorAvatar: t.instructor_avatar,
              date: t.date || new Date(Date.now() + 86400000 * (idx + 2)).toISOString(),
              duration: t.duration || "3.5 Giờ (08:30 - 12:00)",
              location: t.location || "Hội Trường VIP CEO HN10",
              isOnline: Boolean(t.is_online),
              slideUrl: t.slide_url,
              status: t.status || "upcoming",
              attendanceMarked: Boolean(t.attended),
              description: t.description || "Nội dung học phần chuyên sâu dành riêng cho các Tổng giám đốc và Nhà sáng lập doanh nghiệp CEO HN10.",
              objectives: [
                "Nắm vững các phương pháp tái cấu trúc và quản trị vận hành hiện đại.",
                "Tối ưu hóa dòng tiền và phân bổ nguồn lực tài chính hiệu quả.",
                "Thực hành giải quyết bài toán thực tế của doanh nghiệp học viên.",
                "Kết nối cung ứng và thúc đẩy hợp tác B2B đa ngành nghề.",
              ],
              attendeesCount: t.attendee_count || 48,
            }))
          );
        } else {
          // Default Academic Curriculum for CEO HN10 Class
          setClasses([
            {
              id: "cls-01",
              title: "Chuyên Đề 1: Tái Cấu Trúc Tài Chính & Quản Trị Dòng Tiền Doanh Nghiệp 2026",
              moduleCode: "MOD-FIN-01",
              instructor: "TS. Nguyễn Minh Tuấn",
              instructorTitle: "Viện trưởng Viện Quản trị Tài chính Chiến lược",
              date: "2026-12-05T08:30:00.000Z",
              duration: "08:30 - 12:00 (Thứ Bảy)",
              location: "Phòng Hội Thảo A, Khách Sạn Daewoo Hà Nội",
              status: "upcoming",
              slideUrl: "#",
              description: "Phương pháp lập kế hoạch dòng tiền 12 tháng, dự phóng vốn lưu động và quản trị rủi ro thanh khoản trong kỷ nguyên biến động.",
              objectives: [
                "Xác định điểm hòa vốn và mô hình lưu chuyển dòng tiền doanh nghiệp.",
                "Chiến lược đàm phán tín dụng và cơ cấu lại các khoản nợ phải trả.",
                "Ứng dụng bảng tính Excel thông minh để kiểm soát doanh thu - chi phí hàng ngày.",
                "Thực hành xây dựng phương án phòng vệ rủi ro biến động tỷ giá và lãi suất.",
              ],
              attendeesCount: 52,
            },
            {
              id: "cls-02",
              title: "Chuyên Đề 2: Nghệ Thuật Đàm Phán & Giao Thương Chiến Lược B2B Cho Lãnh Đạo",
              moduleCode: "MOD-NEG-02",
              instructor: "ThS. Phạm Hoàng Nam",
              instructorTitle: "Chuyên gia Đàm phán Cấp cao & Thương mại Quốc tế",
              date: "2026-12-12T08:30:00.000Z",
              duration: "08:30 - 12:00 (Thứ Bảy)",
              location: "Hội Trường HanoiBA, 38 Bà Triệu, Hà Nội",
              status: "upcoming",
              slideUrl: "#",
              description: "Bộ công cụ đàm phán thương vụ lớn, bảo vệ biên lợi nhuận và thiết lập quan hệ đối tác chiến lược bền vững cho CEO.",
              objectives: [
                "Nguyên lý BATNA và kỹ thuật neo giá trong hợp đồng thương mại lớn.",
                "Đọc vị tâm lý đối tác và kiểm soát cảm xúc trong bàn đàm phán căng thẳng.",
                "Nghệ thuật nhượng bộ có điều kiện để tối đa hóa giá trị deal.",
                "Ký kết hợp đồng nguyên tắc bảo đảm quyền lợi pháp lý tối thượng.",
              ],
              attendeesCount: 46,
            },
            {
              id: "cls-03",
              title: "Chuyên Đề 3: Ứng Dụng Trí Tuệ Nhân Tạo (AI) Tối Ưu Hóa Vận Hành Doanh Nghiệp",
              moduleCode: "MOD-AI-03",
              instructor: "Kỹ Sư Trưởng Lê Thành Long",
              instructorTitle: "Giám đốc Công nghệ Tập đoàn AI & Tự Động Hóa",
              date: "2026-12-19T08:30:00.000Z",
              duration: "08:30 - 12:00 (Thứ Bảy)",
              location: "Trực Tuyến Qua Zoom VIP & Phòng Lab Số",
              isOnline: true,
              status: "upcoming",
              slideUrl: "#",
              description: "Tích hợp AI Agents, tự động hóa xử lý văn bản, chăm sóc khách hàng 24/7 và nâng cao 300% hiệu suất làm việc của đội ngũ.",
              objectives: [
                "Xây dựng trợ lý ảo AI đào tạo nội bộ theo dữ liệu riêng của công ty.",
                "Tự động hóa quy trình báo cáo tài chính và tổng hợp công nợ khách hàng.",
                "Phân tích hành vi mua hàng và dự báo nhu cầu thị trường bằng Machine Learning.",
                "Triển khai khung bảo mật dữ liệu doanh nghiệp an toàn tuyệt đối khi dùng AI.",
              ],
              attendeesCount: 65,
            },
          ]);
        }
      } catch (err) {
        // Fallback
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
                isConnected: idx % 3 === 0,
              }))
          );
        } else {
          setPeers([]);
        }
      } catch (err) {
        setPeers([]);
      }
    } catch (error) {
      console.error("Error loading student portal data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Load Class Discussion Comments
  const loadClassComments = async (classId: string) => {
    try {
      const res = await fetchNestApi<any[]>(`/trainings/${classId}/feedbacks`).catch(() => []);
      if (Array.isArray(res) && res.length > 0) {
        setClassComments(
          res.map((r) => ({
            id: r.id,
            userName: r.userName || "Học viên Doanh nhân",
            content: r.content || "",
            createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "Vừa xong",
            likes: Math.floor(Math.random() * 8) + 1,
            isLiked: false,
          }))
        );
      } else {
        // Fallback default discussions
        setClassComments([
          {
            id: "cmt-1",
            userName: "Nguyễn Văn Hùng (CEO Hùng Phát)",
            content: "Bài giảng chuyên đề này rất thực chiến! Doanh nghiệp mình vừa áp dụng kịch bản dự phóng vốn lưu động và thấy kiểm soát nợ phải thu tốt hơn hẳn.",
            createdAt: "10:30 Hôm nay",
            likes: 6,
            isLiked: true,
          },
          {
            id: "cmt-2",
            userName: "Trần Thị Mai (Tổng Giám Đốc Ánh Dương)",
            content: "Chào thầy Tuấn và các anh chị, trong buổi học thứ 7 tới nhóm mình có thể xin thêm case-study về quản trị dòng tiền ngành sản xuất không ạ?",
            createdAt: "09:15 Hôm nay",
            likes: 4,
            isLiked: false,
          },
          {
            id: "cmt-3",
            userName: "Lê Hoàng Quân (Chủ tịch Nam Đô Group)",
            content: "Rất hoan nghênh câu hỏi của chị Mai! Nhóm 2 chúng tôi cũng đang gặp bài toán tương tự về vốn dự phòng cho quý 1/2027.",
            createdAt: "Hôm qua",
            likes: 3,
            isLiked: false,
          },
        ]);
      }
    } catch {
      //
    }
  };

  // Open Detailed Class Modal
  const handleOpenClassDetail = (cls: ClassTrainingItem) => {
    setSelectedDetailClass(cls);
    setClassDetailActiveTab("info");
    loadClassComments(cls.id);
  };

  // Submit comment in class public discussion
  const handleSubmitComment = async () => {
    if (!newCommentText.trim() || !selectedDetailClass) return;
    setSubmittingComment(true);
    const commentPayload = {
      content: newCommentText.trim(),
      userName: profile?.name || user?.name || "Học viên CEO HN10",
      rating: 5,
      memberId: profile?.id && profile.id.length === 36 ? profile.id : undefined,
    };

    try {
      await fetchNestApi(`/trainings/${selectedDetailClass.id}/feedbacks`, {
        method: "POST",
        body: JSON.stringify(commentPayload),
      }).catch(() => {});

      const newCmt: ClassComment = {
        id: `cmt-${Date.now()}`,
        userName: commentPayload.userName,
        content: commentPayload.content,
        createdAt: "Vừa xong",
        likes: 1,
        isLiked: true,
      };
      setClassComments((prev) => [newCmt, ...prev]);
      setNewCommentText("");
      toast.success("Đã đăng bình luận trao đổi lên nhóm lớp học!");
    } catch {
      toast.error("Không thể gửi bình luận, vui lòng thử lại.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Toggle Like on Comment
  const handleToggleLikeComment = (commentId: string) => {
    setClassComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const nextLiked = !c.isLiked;
          return {
            ...c,
            isLiked: nextLiked,
            likes: nextLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
          };
        }
        return c;
      })
    );
  };

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
    <div className="w-full min-h-screen bg-slate-50 flex flex-col pb-28 text-slate-900 font-sans">
      {/* ── 1. TOP HEADER TỐI GIẢN (CHỈ CÓ LOGO CEO HN10 CÙNG ICON THÔNG BÁO VÀ TIN NHẮN) ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        {/* Bên trái: Logo CEO HN10 */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs tracking-wider">
            HN10
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-900 tracking-tight leading-tight">
              CLB DOANH NHÂN CEO HN10
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              Hiệp Hội HanoiBA · {profile?.name || "Học Viên"}
            </p>
          </div>
        </div>

        {/* Bên phải: CHỈ 2 icon Thông báo & Tin nhắn */}
        <div className="flex items-center gap-1.5">
          <Link
            to="/association/notifications"
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
          </Link>

          <Link
            to="/association/messages"
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Tin nhắn"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </Link>
        </div>
      </header>

      {/* ── NỘI DUNG CHÍNH (THEO CÁC TAB: HOME / LỚP HỌC / SỰ KIỆN / B2B) ── */}
      <main className="px-4 py-3 flex-1 space-y-5">
        {/* ======================================================== */}
        {/* TAB 1: 🌟 TRANG CHỦ BENTO GRID & EDITORIAL SLIDER        */}
        {/* ======================================================== */}
        {activeTab === "home" && (
          <div className="space-y-6">
            {/* ── BENTO GRID MẪU 2 (TỐI GIẢN: TRẮNG, XÁM NHẠT, TEXT ĐEN, ĐIỂM NHẤN ĐỎ & XANH) ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Trung Tâm Vận Hành Doanh Nhân
                  </h2>
                  <p className="text-xs font-bold text-slate-900">Bento Grid Điều Hành VIP</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                  ● Trạng Thái Sẵn Sàng
                </span>
              </div>

              {/* Lưới Bento 4 Khối Đa Năng */}
              <div className="grid grid-cols-2 gap-3">
                {/* Bento 1: THẺ QR 1 CHẠM (Điểm nhấn Xanh) */}
                <div
                  onClick={() => setQrModalOpen(true)}
                  className="rounded-3xl p-4 bg-white border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                      <QrCode className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full text-blue-700 border border-blue-100">
                      1 Chạm
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Thẻ QR Danh Thiếp</h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{profile?.studentCode}</p>
                    <div className="mt-2 text-[10px] font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Mở thẻ quét <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Bento 2: RADAR B2B CONNECT (Điểm nhấn Đỏ) */}
                <div
                  onClick={() => setActiveTab("connect")}
                  className="rounded-3xl p-4 bg-white border border-slate-200 shadow-2xs hover:border-red-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-2xl bg-red-50 text-red-600 border border-red-100">
                      <Users className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      14 Đối tác
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Radar B2B Connect</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Kết nối cùng ngành nghề</p>
                    <div className="mt-2 text-[10px] font-bold text-red-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Khám phá mạng lưới <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Bento 3: KHO TÀI LIỆU ĐÀO TẠO VIP (Điểm nhấn Xanh) */}
                <div
                  onClick={() => {
                    if (classes[0]) handleOpenClassDetail(classes[0]);
                    setClassDetailActiveTab("materials");
                  }}
                  className="rounded-3xl p-4 bg-white border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                      <FileText className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-blue-50 px-2 py-0.5 rounded-full text-blue-700 border border-blue-100">
                      28 Files
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Kho Tài Liệu VIP</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Slide &amp; Mẫu Biểu Excel</p>
                    <div className="mt-2 text-[10px] font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Tải giáo trình <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Bento 4: DIỄN ĐÀN LỚP HỌC (Điểm nhấn Đỏ) */}
                <div
                  onClick={() => {
                    if (classes[0]) handleOpenClassDetail(classes[0]);
                    setClassDetailActiveTab("discussion");
                  }}
                  className="rounded-3xl p-4 bg-white border border-slate-200 shadow-2xs hover:border-red-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-2xl bg-red-50 text-red-600 border border-red-100">
                      <MessageSquare className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      12 Bài mới
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Diễn Đàn Lớp Học</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Hỏi đáp case study thực tế</p>
                    <div className="mt-2 text-[10px] font-bold text-red-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Tham gia thảo luận <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── SỰ KIỆN DẠNG SLIDE LƯỚT NGANG (CONCEPT 3 - TỐI GIẢN TRẮNG XÁM ĐỎ XANH) ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Sự Kiện Tiêu Điểm
                  </h3>
                  <p className="text-[11px] text-slate-500">Lướt ngang để chọn sự kiện &amp; xem sơ đồ VIP</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("events")}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Tất cả ({events.length}) <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Slider Horizontal Carousel */}
              <div className="overflow-x-auto pb-4 pt-1 snap-x flex gap-4 scrollbar-none">
                {events.map((evt, idx) => (
                  <div
                    key={evt.id}
                    className="min-w-[310px] max-w-[325px] snap-center rounded-3xl p-5 bg-white text-slate-900 border border-slate-200 shadow-sm flex flex-col justify-between shrink-0 hover:border-slate-300 transition-colors"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-50 text-red-600 border border-red-200">
                          {idx === 0 ? "★ Dạ Khúc Thượng Đỉnh" : "Sự Kiện Đặc Quyền"}
                        </span>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          {evt.price && evt.price > 0 ? `${evt.price.toLocaleString("vi-VN")} đ` : "Miễn Phí Hội Viên"}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {evt.name}
                      </h4>

                      {/* Highlight Quote */}
                      <p className="mt-2 text-[11px] italic text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                        {evt.highlightQuote || "“Giao thương bền vững bắt đầu từ sự thấu hiểu và sẻ chia giá trị.”"}
                      </p>

                      {/* Date & Location */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800">{formatDisplayDate(evt.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{evt.location || "Ballroom Melia Hà Nội"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Social proof & Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-medium">
                          👥 {evt.confirmedCount || 48} CEO đã xác nhận
                        </span>
                        <span className="text-slate-400">Formal VIP</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailEvent(evt)}
                          className="flex-1 py-2 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                          <span>Chi Tiết</span>
                        </button>

                        {evt.isRegistered ? (
                          <button
                            type="button"
                            onClick={() => setViewTicketEvent(evt)}
                            className="flex-1 py-2 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Ticket className="w-3.5 h-3.5 text-white" />
                            <span>Mở Vé QR</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRegisterEvent(evt)}
                            className="flex-1 py-2 px-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Ticket className="w-3.5 h-3.5 text-white" />
                            <span>Đăng Ký</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── TIẾN ĐỘ HỌC TẬP (VÒNG TRÒN GAUGE % KÈM TIMELINE HÀNH TRÌNH ĐÀO TẠO) ── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Lộ Trình Đào Tạo &amp; Tiến Độ Tín Chỉ
                  </h3>
                  <p className="text-[11px] text-slate-500">Chỉ số hoàn thành và chuỗi trạm phát triển doanh nhân</p>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Khóa 2026 - 2027
                </span>
              </div>

              {/* 1. KHỐI VÒNG TRÒN ĐỒNG HỒ CIRCULAR GAUGE % */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center gap-5">
                {/* SVG Circular Gauge */}
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background track circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#E2E8F0"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    {/* Progress stroke: 82% (Xanh #1D4ED8) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1D4ED8"
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 * (1 - 0.82)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-black text-red-600 leading-tight">82%</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Tín Chỉ</span>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">Tiêu Chuẩn Tốt Nghiệp CEO HN10</h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Đạt Chuẩn
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Đã hoàn thành <b>4/5 chuyên đề trọng tâm</b> và tham gia đầy đủ các phiên kết nối giao thương B2B.
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-slate-700">
                    <span>Điểm danh: <b className="text-blue-700">100%</b></span>
                    <span>•</span>
                    <span>Xếp loại: <b className="text-red-600">Xuất Sắc</b></span>
                  </div>
                </div>
              </div>

              {/* 2. DẠNG TIMELINE (DÒNG THỜI GIAN CÁC TRẠM ĐÀO TẠO) */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Dòng Thời Gian Các Trạm Đào Tạo (Timeline)
                </h4>

                <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {journeyMilestones.map((m) => {
                    const isDone = m.status === "completed";
                    const isDoing = m.status === "in_progress";
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (m.referenceId) {
                            const target = classes.find((c) => c.id === m.referenceId);
                            if (target) handleOpenClassDetail(target);
                          } else {
                            toast.info(`Trạm ${m.stepNumber}: ${m.title}`);
                          }
                        }}
                        className="relative group cursor-pointer"
                      >
                        {/* Timeline Node Icon Pin */}
                        <div
                          className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-transform group-hover:scale-110 ${
                            isDone
                              ? "bg-blue-600 border-white text-white shadow-xs"
                              : isDoing
                              ? "bg-red-600 border-white text-white shadow-xs ring-2 ring-red-200"
                              : "bg-slate-200 border-white text-slate-600"
                          }`}
                        >
                          {isDone ? "✓" : m.stepNumber}
                        </div>

                        {/* Station Card Content */}
                        <div
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isDoing
                              ? "bg-white border-red-200 shadow-xs"
                              : isDone
                              ? "bg-blue-50/30 border-blue-100 text-slate-800"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isDoing
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : isDone
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              Trạm {m.stepNumber} · {m.badge}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                isDoing ? "text-red-600" : isDone ? "text-blue-700" : "text-slate-400"
                              }`}
                            >
                              {isDone ? "Đã qua" : isDoing ? "● Đang diễn ra" : "○ Sắp tới"}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold mt-1.5 leading-snug line-clamp-2 text-slate-900">
                            {m.title}
                          </h5>

                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                            <span>📅 {m.date} ({m.time})</span>
                            <span
                              className={`font-semibold flex items-center gap-0.5 group-hover:underline ${
                                isDoing ? "text-red-600" : "text-blue-600"
                              }`}
                            >
                              Chi tiết <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: 🎓 DANH SÁCH LỚP HỌC (CLASSES VIEW)                */}
        {/* ======================================================== */}
        {activeTab === "classes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Chương Trình Đào Tạo CEO HN10
                </h3>
                <p className="text-[11px] text-slate-500">Giáo trình, tài liệu slide và thảo luận nhóm lớp học</p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {classes.length} Chuyên Đề
              </span>
            </div>

            <div className="space-y-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                      {cls.moduleCode}
                    </span>
                    {cls.isOnline ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Video className="w-3 h-3" /> Zoom Trực Tuyến VIP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <Building2 className="w-3 h-3" /> Tại Hội Trường
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {cls.title}
                  </h4>

                  <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                    <p className="font-medium text-slate-700">
                      👨‍🏫 Giảng viên: <span className="font-bold text-slate-900">{cls.instructor}</span>
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
                      type="button"
                      onClick={() => handleOpenClassDetail(cls)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-2xs"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-white" />
                      <span>Xem Chi Tiết Lớp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleOpenClassDetail(cls);
                        setClassDetailActiveTab("discussion");
                      }}
                      className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>Thảo Luận ({classComments.length || 3})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: 📅 SỰ KIỆN DOANH NHÂN (EVENTS VIEW)                 */}
        {/* ======================================================== */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Sự Kiện Hiệp Hội CEO HN10
                </h3>
                <p className="text-[11px] text-slate-500">Xem chi tiết, đăng ký vé tham dự và nhận mã QR</p>
              </div>
              <Link
                to="/association/events"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5"
              >
                Mở trung tâm vé <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200">
                      Sự Kiện CEO HN10
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {event.price && event.price > 0 ? `${event.price.toLocaleString("vi-VN")} đ` : "Miễn phí (0đ)"}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                    {event.name}
                  </h4>

                  <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">{formatDisplayDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{event.location || "Trung tâm Hội nghị Hà Nội"}</span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailEvent(event)}
                      className="flex-1 py-2 px-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                      <span>Xem Chi Tiết</span>
                    </button>

                    {event.isRegistered ? (
                      <button
                        type="button"
                        onClick={() => setViewTicketEvent(event)}
                        className="flex-1 py-2 px-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5 text-white" />
                        <span>Mã Vé QR</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRegisterEvent(event)}
                        className="flex-1 py-2 px-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Đăng Ký Ngay</span>
                      </button>
                    )}

                    {canScanCheckin && (
                      <Link
                        to="/association/checkin"
                        className="py-2 px-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                        title="Soát vé Check-in"
                      >
                        <ScanLine className="w-3.5 h-3.5" />
                        <span>QR</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: 🤝 BẠN HỌC & KẾT NỐI DOANH NHÂN (CONNECT VIEW)     */}
        {/* ======================================================== */}
        {activeTab === "connect" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Mạng Lưới Bạn Học CEO HN10
                </h3>
                <p className="text-[11px] text-slate-500">Các lãnh đạo doanh nghiệp cùng khóa học và Hiệp hội</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
                {peers.length} Doanh nhân
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
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Peer List */}
            <div className="space-y-2.5">
              {filteredPeers.map((peer) => (
                <div
                  key={peer.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-blue-600 font-bold flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                      {peer.avatarUrl && resolveMediaUrl(peer.avatarUrl) ? (
                        <img src={resolveMediaUrl(peer.avatarUrl) || undefined} alt={peer.name} className="w-full h-full object-cover" />
                      ) : (
                        peer.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{peer.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {peer.position} • {peer.companyName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {peer.industry}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {peer.studentCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleConnect(peer.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                      peer.isConnected
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
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
          </div>
        )}
      </main>

      {/* ── 4. FOOTER (BOTTOM NAV) THEO MẪU 1 (FLOATING LUXURY ROUNDED BAR - TỐI GIẢN) ── */}
      <footer className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-3xl px-3 py-2 flex items-center justify-around text-slate-600">
          {/* Tab 1: Trang Chủ */}
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === "home"
                ? "bg-blue-50 text-blue-600 font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Trang Chủ</span>
          </button>

          {/* Tab 2: Lớp Học */}
          <button
            onClick={() => setActiveTab("classes")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === "classes"
                ? "bg-blue-50 text-blue-600 font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Lớp Học</span>
          </button>

          {/* Nút Giữa Floating: Thẻ QR Cá Nhân */}
          <button
            onClick={() => setQrModalOpen(true)}
            className="w-12 h-12 -mt-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            title="Thẻ QR Doanh Nhân"
          >
            <QrCode className="w-6 h-6" />
          </button>

          {/* Tab 3: Sự Kiện */}
          <button
            onClick={() => setActiveTab("events")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === "events"
                ? "bg-blue-50 text-blue-600 font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Sự Kiện</span>
          </button>

          {/* Tab 4: B2B Hub */}
          <button
            onClick={() => setActiveTab("connect")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === "connect"
                ? "bg-blue-50 text-blue-600 font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">B2B Hub</span>
          </button>
        </div>
      </footer>

      {/* ── MODAL CHI TIẾT LỚP HỌC & THẢO LUẬN ── */}
      {selectedDetailClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-5 text-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col space-y-3">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-50 text-[#D97706] border border-amber-200 font-mono">
                    {selectedDetailClass.moduleCode}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Lớp Doanh Nhân CEO HN10
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {selectedDetailClass.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailClass(null)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => setClassDetailActiveTab("info")}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  classDetailActiveTab === "info" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Thông Tin Lớp
              </button>
              <button
                type="button"
                onClick={() => setClassDetailActiveTab("discussion")}
                className={`py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  classDetailActiveTab === "discussion" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Thảo Luận ({classComments.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setClassDetailActiveTab("materials")}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  classDetailActiveTab === "materials" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tài Liệu Slide
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-3.5 pr-1 text-xs flex-1">
              {classDetailActiveTab === "info" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-[#D97706] shrink-0" />
                      <span>Thời lượng: <b>{selectedDetailClass.duration}</b></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Địa điểm: <b>{selectedDetailClass.location}</b></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Sĩ số lớp: <b>{selectedDetailClass.attendeesCount || 48} Học viên lãnh đạo</b></span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#0F172A] text-[#C5A059] font-bold flex items-center justify-center shrink-0 border border-amber-300">
                      👨‍🏫
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-800">Giảng Viên Chuyên Đề:</span>
                      <h4 className="text-sm font-bold text-slate-900">{selectedDetailClass.instructor}</h4>
                      <p className="text-[11px] text-slate-600">{selectedDetailClass.instructorTitle || "Chuyên gia cố vấn kinh tế & quản trị doanh nghiệp"}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Nội Dung Trọng Tâm Buổi Học:</span>
                    </h4>
                    <p className="text-slate-600 text-[11px] leading-relaxed mb-2">
                      {selectedDetailClass.description}
                    </p>
                    <div className="space-y-1.5">
                      {(selectedDetailClass.objectives || []).map((obj, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {classDetailActiveTab === "discussion" && (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Diễn đàn trao đổi mở giữa giảng viên và các học viên cùng lớp CEO HN10.</span>
                  </div>

                  <div className="space-y-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <textarea
                      rows={2}
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Đặt câu hỏi cho giảng viên hoặc chia sẻ kinh nghiệm thực tế..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059]"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Đăng với tên: <b>{profile?.name}</b></span>
                      <button
                        type="button"
                        onClick={handleSubmitComment}
                        disabled={submittingComment || !newCommentText.trim()}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-[#C5A059] text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submittingComment ? "Đang gửi..." : "Gửi Bình Luận"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {classComments.map((cmt) => (
                      <div key={cmt.id} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#0F172A] text-[#C5A059] font-bold text-xs flex items-center justify-center">
                              {cmt.userName.charAt(0)}
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-900 text-[11px] leading-tight">{cmt.userName}</h5>
                              <span className="text-[10px] text-slate-400">{cmt.createdAt}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleLikeComment(cmt.id)}
                            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full transition cursor-pointer ${
                              cmt.isLiked ? "text-[#8B1E2F] bg-rose-50" : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${cmt.isLiked ? "fill-current text-[#8B1E2F]" : ""}`} />
                            <span>{cmt.likes}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed pl-9">
                          {cmt.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {classDetailActiveTab === "materials" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-8 h-8 text-[#8B1E2F]" />
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs">Slide Bài Giảng Chuyên Đề (PDF)</h5>
                        <p className="text-[10px] text-slate-500">Dung lượng: 12.5 MB · Bản chính thức</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toast.success("Đang tải slide bài giảng về máy...")}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#D97706] hover:brightness-110 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải Xuống</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="w-8 h-8 text-emerald-600" />
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs">Mẫu Biểu Kế Hoạch Tài Chính (Excel)</h5>
                        <p className="text-[10px] text-slate-500">Dung lượng: 2.1 MB · Kèm công thức tự tính</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toast.success("Đang tải biểu mẫu Excel...")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải Xuống</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedDetailClass(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => {
                  toast.success("Điểm danh lớp học thành công!", { description: selectedDetailClass.title });
                  setSelectedDetailClass(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Điểm Danh Buổi Học Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL HIỂN THỊ VÉ ĐIỆN TỬ VỚI MÃ QR ── */}
      {viewTicketEvent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#0F172A] p-4 text-white flex items-center justify-between border-b border-[#C5A059]/30">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                  VÉ ĐIỆN TỬ CHÍNH THỨC
                </span>
                <h3 className="text-sm font-bold text-white leading-tight mt-0.5">
                  {viewTicketEvent.name}
                </h3>
              </div>
              <button
                onClick={() => setViewTicketEvent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-white rounded-3xl border-2 border-dashed border-[#C5A059]/40 shadow-inner flex flex-col items-center justify-center">
                <div className="w-44 h-44 bg-slate-900 rounded-2xl flex items-center justify-center text-white p-2">
                  <QrCode className="w-36 h-36 text-white" />
                </div>
                <p className="mt-2 text-[11px] text-slate-500 font-medium">
                  Đưa mã này cho lễ tân khi check-in tại cửa
                </p>
              </div>

              <div className="w-full bg-slate-50 rounded-2xl p-3.5 text-left space-y-1.5 border border-slate-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã vé:</span>
                  <span className="font-mono font-bold text-[#8B1E2F]">{viewTicketEvent.ticketCode}</span>
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
                className="w-full py-2.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 active:scale-98 text-[#C5A059] font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Lưu Vé Vào Thư Viện Ảnh</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XEM CHI TIẾT SỰ KIỆN & ĐĂNG KÝ ── */}
      {selectedDetailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 text-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex-1 pr-2">
                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#8B1E2F] border border-rose-200 mb-1">
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
                  <Clock className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span>Thời gian: <b>{formatDisplayDate(selectedDetailEvent.date)}</b></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Địa điểm: <b>{selectedDetailEvent.location || "Trung tâm Hội nghị Hà Nội"}</b></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Ticket className="w-4 h-4 text-[#8B1E2F] shrink-0" />
                  <span>Phí tham dự: <b className="text-[#8B1E2F]">{selectedDetailEvent.price && selectedDetailEvent.price > 0 ? `${selectedDetailEvent.price.toLocaleString("vi-VN")} đ` : "Miễn phí (0đ)"}</b></span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Giới Thiệu Chương Trình:</h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {selectedDetailEvent.description || "Chương trình quy tụ các chuyên gia kinh tế, lãnh đạo doanh nghiệp hàng đầu trong CLB Doanh Nhân CEO HN10 nhằm kết nối giao thương, chia sẻ kinh nghiệm quản trị và mở rộng cơ hội hợp tác chiến lược."}
                </p>
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
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-[#C5A059] font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-[#C5A059]" />
                  <span>Xem Vé Điện Tử QR</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleRegisterEvent(selectedDetailEvent);
                    setSelectedDetailEvent(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#8B1E2F] hover:bg-[#a32437] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Đăng Ký Tham Gia</span>
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
