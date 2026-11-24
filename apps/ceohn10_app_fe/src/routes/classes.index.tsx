import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  Users,
  QrCode,
  BookOpen,
  UserCheck,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Filter,
  Download,
  Share2,
  ExternalLink,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  Award,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  Bookmark,
  Layers,
  Sparkles,
  X,
  Check,
  Copy,
  Trash2,
  LayoutDashboard,
  LayoutGrid,
  Pencil,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { fetchNestApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/excel-export";

export const Route = createFileRoute("/classes/")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : "courses",
  }),
  component: ClassesManagementPage,
});

// ── DỮ LIỆU ĐÀO TẠO & BUỔI HỌC ──
interface CourseSession {
  id: string;
  sessionNumber: number;
  sessionType?: "standard" | "makeup" | "training" | "field_trip";
  sessionTypeName?: string;
  title: string;
  instructorName: string;
  date: string;
  time: string;
  location: string;
  status: "completed" | "ongoing" | "upcoming";
  attendees: number;
  maxAttendees: number;
  qrCode: string;
}

// ── 30 BUỔI HỌC CỐ ĐỊNH CHUẨN DOANH TRÍ CEO HN10 (HANOIBA) ──
const CEOHN10_TOPICS = [
  "Định Vị Chiến Lược Doanh Nghiệp & Tầm Nhìn Doanh Nhân Thời Đại Mới",
  "Tối Ưu Hóa Dòng Tiền, Quản Trị Chi Phí & Tái Cấu Trúc Nguồn Vốn",
  "Nghệ Thuật Đàm Phán Thương Mại B2B & Thu Hút Đầu Tư Chiến Lược",
  "Chuyển Đổi Số Thực Chiến & Ứng Dụng AI Trong Vận Hành Doanh Nghiệp",
  "Xây Dựng Văn Hóa Doanh Nghiệp Đột Phá & Giữ Chân Nhân Tài Cấp Cao",
  "Quản Trị Rủi Ro Pháp Lý Doanh Nghiệp & Bảo Vệ Tài Sản Cổ Đông",
  "Chiến Lược Marketing B2B Đa Kênh & Tối Ưu Phễu Khách Hàng Doanh Nghiệp",
  "Nghệ Thuật Lãnh Đạo Tinh Gọn & Quản Trị Mục Tiêu OKRs/KPIs",
  "Tái Cấu Trúc Doanh Nghiệp & Mô Hình Kinh Doanh Tinh Gọn Lean Startup",
  "Quản Trị Chuỗi Cung Ứng & Tối Ưu Hóa Logistics Quốc Tế",
  "Xây Dựng Hệ Thống Kiểm Soát Nội Bộ & Kiểm Toán Doanh Nghiệp",
  "Chiến Lược M&A, Mua Bán Sáp Nhập & Định Giá Doanh Nghiệp",
  "Quản Trị Khủng Hoảng Truyền Thông & Bảo Vệ Danh Tiếng Thương Hiệu",
  "Pháp Luật Thuế Chuyên Sâu & Tối Ưu Nghĩa Vụ Tài Chính Hợp Pháp",
  "Kỹ Năng Pitching Gọi Vốn Đỉnh Cao Trước Các Quỹ Đầu Tư Mạo Hiểm",
  "Xây Dựng Hệ Sinh Thái Đối Tác & Liên Minh Doanh Nghiệp B2B",
  "Tự Động Hóa Quy Trình Vận Hành Doanh Nghiệp (ERP / CRM)",
  "Tâm Lý Học Lãnh Đạo & Trí Tuệ Cảm Xúc (EQ) Trong Quản Trị Đỉnh Cao",
  "Chiến Lược Sở Hữu Trí Tuệ & Đăng Ký Bản Quyền Sáng Chế Toàn Cầu",
  "Quản Trị Đổi Mới Sáng Tạo & Phát Triển Sản Phẩm Mới R&D",
  "Khai Thác Dữ Liệu Lớn (Big Data) & Ra Quyết Định Kinh Doanh Dựa Trên Dữ Liệu",
  "Xây Dựng Thương Hiệu Cá Nhân Cho Lãnh Đạo C-Level & CEO",
  "Văn Hóa Đấu Thầu & Thắng Thầu Dự Án Quy Mô Lớn",
  "Quản Lý Dự Án Theo Chuẩn PMI & Agile/Scrum Cho Doanh Nghiệp Vừa & Lớn",
  "Trách Nhiệm Xã Hội Của Doanh Nghiệp (CSR / ESG) & Phát Triển Bền Vững",
  "Chiến Lược Thương Mại Điện Tử Xuyên Biên Giới (Cross-Border E-Commerce)",
  "Nghệ Thuật Đọc Báo Cáo Tài Chính & Phát Hiện Gian Lận Kế Toán",
  "Quản Trị Trải Nghiệm Khách Hàng (CX) & Giữ Chân Khách Hàng Trọn Đời",
  "Kỹ Năng Thuyết Trình Trước Hội Đồng Quản Trị & Cổ Đông Lớn",
  "Bế Giảng Khóa Học, Lễ Trao Bằng Doanh Trí & Gala Vinh Danh Doanh Nhân CEO HN10",
];

const DEFAULT_SESSIONS: CourseSession[] = CEOHN10_TOPICS.map((topic, idx) => {
  const num = idx + 1;
  const isCompleted = num <= 2;
  const isOngoing = num === 3;
  const status: "completed" | "ongoing" | "upcoming" = isCompleted
    ? "completed"
    : isOngoing
    ? "ongoing"
    : "upcoming";

  const instructors = [
    "TS. Nguyễn Trí Hiếu",
    "ThS. Đỗ Hoài Nam",
    "Bà Phạm Thanh Hưng",
    "TS. Lê Thẩm Dương",
    "Chuyên Gia Công Nghệ ViConnect",
    "Luật Sư Trương Thanh Đức",
    "Chuyên Gia Chiến Lược HanoiBA",
  ];

  return {
    id: `sess-${num}`,
    sessionNumber: num,
    sessionType: "standard",
    sessionTypeName: "Chuyên Đề Chính Khóa",
    title: `Buổi ${num}: ${topic}`,
    instructorName: instructors[idx % instructors.length],
    date: `${String(14 + ((num - 1) * 7) % 28).padStart(2, "0")}/${String(3 + Math.floor((num - 1) / 4)).padStart(2, "0")}/2026`,
    time: "08:30 - 11:30",
    location: "Hội trường Tầng 3 - Trụ sở CLB CEO HN10 & Hybrid Zoom",
    status,
    attendees: isCompleted ? 92 + (num % 3) : isOngoing ? 88 : 0,
    maxAttendees: 95,
    qrCode: `QR-CLASS-SESS-${String(num).padStart(2, "0")}`,
  };
});

// ── DỮ LIỆU HỌC VIÊN DASHBOARD (ĐA CHỈ SỐ) ──
interface StudentItem {
  id: string;
  code: string;
  fullName: string;
  company: string;
  industry: string;
  position: string;
  classRole: string;
  phone: string;
  email: string;
  attendanceRate: string; // VD: 28/30 (93%)
  eventsJoined: number;
  classFundStatus: "Đã nộp (2.000.000đ)" | "Chưa nộp" | "Miễn giảm";
  penaltyDebt: number; // Phí phạt đi muộn/vắng
  karmaPoints: number;
  status: "Đang theo học" | "Bảo lưu" | "Tốt nghiệp";
}

const DEFAULT_STUDENTS: StudentItem[] = [
  {
    id: "std-1",
    code: "HN10-001",
    fullName: "Nguyễn Văn Hùng",
    company: "Tập Đoàn Công Nghệ & Đầu Tư Alpha",
    industry: "Công nghệ & Viễn thông",
    position: "Chủ tịch HĐQT",
    classRole: "Lớp Trưởng Lâm Thời",
    phone: "0903112233",
    email: "hung.nguyen@alphagroup.vn",
    attendanceRate: "3/3 buổi (100%)",
    eventsJoined: 14,
    classFundStatus: "Đã nộp (2.000.000đ)",
    penaltyDebt: 0,
    karmaPoints: 100,
    status: "Đang theo học",
  },
  {
    id: "std-2",
    code: "HN10-002",
    fullName: "Trần Thị Mai Phương",
    company: "Chuỗi Bán Lẻ & Dược Phẩm An Khang",
    industry: "Dược phẩm & Y tế",
    position: "Tổng Giám Đốc (CEO)",
    classRole: "Lớp Phó Học Tập",
    phone: "0912334455",
    email: "phuong.tran@ankhangpharma.vn",
    attendanceRate: "3/3 buổi (100%)",
    eventsJoined: 11,
    classFundStatus: "Đã nộp (2.000.000đ)",
    penaltyDebt: 0,
    karmaPoints: 98,
    status: "Đang theo học",
  },
  {
    id: "std-3",
    code: "HN10-003",
    fullName: "Lê Hoàng Nam",
    company: "Tổng Công Ty Tiếp Vận Logistics Toàn Cầu HN",
    industry: "Logistics & Kho bãi",
    position: "Chủ tịch & CEO",
    classRole: "Lớp Phó Tài Chính",
    phone: "0988556677",
    email: "nam.le@globallogistics.vn",
    attendanceRate: "2/3 buổi (67%)",
    eventsJoined: 8,
    classFundStatus: "Đã nộp (2.000.000đ)",
    penaltyDebt: 200000,
    karmaPoints: 92,
    status: "Đang theo học",
  },
  {
    id: "std-4",
    code: "HN10-004",
    fullName: "Phạm Quốc Tuấn",
    company: "Công Ty Cổ Phần Xây Dựng & Bất Động Sản Hòa Bình",
    industry: "Xây dựng & Kiến trúc",
    position: "Phó Tổng Giám Đốc",
    classRole: "Lớp Phó Sự Kiện",
    phone: "0904889900",
    email: "tuan.pham@hoabinhcon.vn",
    attendanceRate: "3/3 buổi (100%)",
    eventsJoined: 15,
    classFundStatus: "Đã nộp (2.000.000đ)",
    penaltyDebt: 0,
    karmaPoints: 99,
    status: "Đang theo học",
  },
  {
    id: "std-5",
    code: "HN10-005",
    fullName: "Vũ Hải Đăng",
    company: "Tập Đoàn Năng Lượng Tái Tạo Xanh",
    industry: "Năng lượng & Môi trường",
    position: "Giám Đốc Điều Hành",
    classRole: "Học Viên Chính Thức",
    phone: "0977443322",
    email: "dang.vu@greenenergy.vn",
    attendanceRate: "2/3 buổi (67%)",
    eventsJoined: 6,
    classFundStatus: "Chưa nộp",
    penaltyDebt: 100000,
    karmaPoints: 88,
    status: "Đang theo học",
  },
  {
    id: "std-6",
    code: "HN10-006",
    fullName: "Hoàng Thùy Linh",
    company: "Hệ Thống Thời Trang Thiết Kế Vivian",
    industry: "Thời trang & May mặc",
    position: "Sáng Lập Viên & CEO",
    classRole: "Học Viên Chính Thức",
    phone: "0933221100",
    email: "linh.hoang@vivianfashion.vn",
    attendanceRate: "3/3 buổi (100%)",
    eventsJoined: 9,
    classFundStatus: "Đã nộp (2.000.000đ)",
    penaltyDebt: 0,
    karmaPoints: 95,
    status: "Đang theo học",
  },
  {
    id: "std-7",
    code: "HN10-007",
    fullName: "Đỗ Thành Long",
    company: "Công Ty Thiết Bị Điện & Tự Động Hóa Công Nghiệp",
    industry: "Cơ khí & Tự động hóa",
    position: "Tổng Giám Đốc",
    classRole: "Học Viên Dự Thính",
    phone: "0915778899",
    email: "long.do@automationvn.com",
    attendanceRate: "1/3 buổi (33%)",
    eventsJoined: 4,
    classFundStatus: "Miễn giảm",
    penaltyDebt: 0,
    karmaPoints: 85,
    status: "Đang theo học",
  },
];

// ── DỮ LIỆU SỔ CÁI TÀI CHÍNH LỚP HỌC (QUỸ 20TR & CÁC NGUỒN VÀO/RA) ──
interface ClassLedgerEntry {
  id: string;
  code: string;
  date: string;
  description: string;
  sourceType: "general_fund_init" | "penalty_fee" | "event_fee" | "training_fee" | "member_fee" | "expense_teabreak" | "expense_gift" | "expense_materials" | "expense_event";
  sourceTypeName: string;
  direction: "IN" | "OUT";
  amount: number;
  personInCharge: string;
  status: "Đã xác nhận" | "Chờ duyệt";
  documentLink?: string;
}

const DEFAULT_LEDGER: ClassLedgerEntry[] = [
  {
    id: "tx-init",
    code: "GD-FUND-INIT",
    date: "10/03/2026",
    description: "Khởi tạo quỹ lớp CEO HN10 rót từ Quỹ Tổng Hiệp Hội HN10 (Đúng mức quy chuẩn 20tr)",
    sourceType: "general_fund_init",
    sourceTypeName: "Khởi tạo từ Quỹ Tổng HN10",
    direction: "IN",
    amount: 20000000,
    personInCharge: "Ban Thư Ký Quỹ Tổng",
    status: "Đã xác nhận",
    documentLink: "https://ceohn10.viconnect.vn/docs/qd-khoi-tao-quy-lop-20tr.pdf",
  },
  {
    id: "tx-pen-01",
    code: "GD-PENALTY-01",
    date: "14/03/2026",
    description: "Thu phí phạt học viên đi muộn & vắng mặt không phép Buổi 1 (100k - 200k/HV)",
    sourceType: "penalty_fee",
    sourceTypeName: "Phí Phạt Nội Quy Lớp",
    direction: "IN",
    amount: 1200000,
    personInCharge: "Ban Cán Sự & Kỷ Luật Lớp",
    status: "Đã xác nhận",
    documentLink: "https://ceohn10.viconnect.vn/docs/bien-ban-ky-luat-buoi1.pdf",
  },
  {
    id: "tx-mem-01",
    code: "GD-MEMBER-FEE-01",
    date: "15/03/2026",
    description: "Thu đóng góp Quỹ Sinh Hoạt Học Viên Đợt 1 (15 học viên nộp đủ 2.000.000đ)",
    sourceType: "member_fee",
    sourceTypeName: "Quỹ Học Viên Chính Khóa",
    direction: "IN",
    amount: 30000000,
    personInCharge: "Lê Hoàng Nam (Lớp Phó Tài Chính)",
    status: "Đã xác nhận",
    documentLink: "https://ceohn10.viconnect.vn/docs/danh-sach-nop-quy-dot1.pdf",
  },
  {
    id: "tx-train-01",
    code: "GD-TRAINING-01",
    date: "18/03/2026",
    description: "Thu phí tài liệu & chuyên đề Training Thực Chiến Buổi 3 (Đàm phán thương mại B2B)",
    sourceType: "training_fee",
    sourceTypeName: "Phí Chương Trình Training",
    direction: "IN",
    amount: 8500000,
    personInCharge: "Trần Thị Mai Phương (Lớp Phó Học Tập)",
    status: "Đã xác nhận",
    documentLink: "https://ceohn10.viconnect.vn/docs/phieu-thu-training-b3.pdf",
  },
  {
    id: "tx-evt-01",
    code: "GD-EVENT-FEE-01",
    date: "20/03/2026",
    description: "Thu tài trợ & đóng góp tổ chức hoạt động Teambuilding kết nối mini của lớp",
    sourceType: "event_fee",
    sourceTypeName: "Phí Sự Kiện Lớp",
    direction: "IN",
    amount: 5000000,
    personInCharge: "Phạm Quốc Tuấn (Lớp Phó Sự Kiện)",
    status: "Đã xác nhận",
    documentLink: "https://ceohn10.viconnect.vn/docs/hop-dong-tai-tro-mini-gala.pdf",
  },
  {
    id: "tx-exp-01",
    code: "GD-EXP-TEABREAK",
    date: "14/03/2026",
    description: "Chi phục vụ tiệc Teabreak, trà cà phê & hoa quả tươi phục vụ Buổi 1 & Buổi 2",
    sourceType: "expense_teabreak",
    sourceTypeName: "Chi Teabreak Buổi Học",
    direction: "OUT",
    amount: 2400000,
    personInCharge: "Ban Hậu Cần Lớp",
    status: "Đã xác nhận",
    documentLink: "https://ceohn10.viconnect.vn/docs/hoa-don-teabreak-b1-b2.pdf",
  },
  {
    id: "tx-exp-02",
    code: "GD-EXP-GIFT-01",
    date: "14/03/2026",
    description: "Chi hoa tươi & quà tặng kỷ niệm tri ân TS. Nguyễn Trí Hiếu giảng dạy Buổi 1",
    sourceType: "expense_gift",
    sourceTypeName: "Chi Tri Ân Giảng Viên",
    direction: "OUT",
    amount: 1800000,
    personInCharge: "Nguyễn Văn Hùng (Lớp Trưởng)",
    status: "Đã xác nhận",
    documentLink: "https://ceohn10.viconnect.vn/docs/hoa-don-qua-giang-vien.pdf",
  },
  {
    id: "tx-exp-03",
    code: "GD-EXP-BOOKS",
    date: "20/03/2026",
    description: "Chi in ấn và phát hành 95 bộ giáo trình, cẩm nang chiến lược doanh nghiệp cho cả lớp",
    sourceType: "expense_materials",
    sourceTypeName: "Chi Ấn Phẩm & Học Liệu",
    direction: "OUT",
    amount: 6000000,
    personInCharge: "Trần Thị Mai Phương (Lớp Phó Học Tập)",
    status: "Đã xác nhận",
    documentLink: "https://ceohn10.viconnect.vn/docs/hoa-don-in-giao-trinh.pdf",
  },
  {
    id: "tx-exp-04",
    code: "GD-EXP-GALA-01",
    date: "22/03/2026",
    description: "Chi đặt cọc hội trường & âm thanh ánh sáng cho đêm Gala kết nối mini của lớp",
    sourceType: "expense_event",
    sourceTypeName: "Chi Tổ Chức Sự Kiện Lớp",
    direction: "OUT",
    amount: 8000000,
    personInCharge: "Phạm Quốc Tuấn (Lớp Phó Sự Kiện)",
    status: "Đã xác nhận",
    documentLink: "https://ceohn10.viconnect.vn/docs/phieu-chi-dat-coc-gala.pdf",
  },
];

// ── BỘ CHUYỂN ĐỔI CHẾ ĐỘ XEM: DASHBOARD / LƯỚI / BẢNG ──
function ViewModeSwitcher({
  value,
  onChange,
}: {
  value: "dashboard" | "grid" | "table";
  onChange: (v: "dashboard" | "grid" | "table") => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/70 border border-border">
      <button
        type="button"
        onClick={() => onChange("dashboard")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
          value === "dashboard"
            ? "bg-background text-foreground shadow-2xs font-bold"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutDashboard className="size-3.5" />
        <span>Dashboard</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
          value === "grid"
            ? "bg-background text-foreground shadow-2xs font-bold"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutGrid className="size-3.5" />
        <span>Lưới (Grid)</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
          value === "table"
            ? "bg-background text-foreground shadow-2xs font-bold"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <FileSpreadsheet className="size-3.5" />
        <span>Bảng</span>
      </button>
    </div>
  );
}

// ── PHÂN TRANG GIAO DIỆN CHUẨN ──
function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  totalItems: number;
  pageSize: number;
}) {
  if (totalPages <= 1) return null;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
      <div>
        Hiển thị <span className="font-semibold text-foreground">{start}</span> -{" "}
        <span className="font-semibold text-foreground">{end}</span> trên tổng số{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> mục
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Trang trước"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        {Array.from({ length: totalPages }).map((_, i) => {
          const p = i + 1;
          if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentPage === p
                    ? "bg-primary text-primary-foreground font-bold"
                    : "border border-border bg-card hover:bg-muted text-foreground"
                }`}
              >
                {p}
              </button>
            );
          }
          if (p === currentPage - 2 || p === currentPage + 2) {
            return (
              <span key={p} className="px-1 text-muted-foreground">
                ...
              </span>
            );
          }
          return null;
        })}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Trang kế tiếp"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function ClassesManagementPage() {
  const search = Route.useSearch();
  const [activeTab, setActiveTab] = useState<string>(search.tab || "courses");

  // Query classes / trainings from backend
  const classesQ = useQuery({
    queryKey: ["classes-list"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>("/trainings");
        if (Array.isArray(res) && res.length > 0) return res;
      } catch {}
      return [];
    },
  });

  // State: Sessions & Classes
  const [sessions, setSessions] = useState<CourseSession[]>(DEFAULT_SESSIONS);
  const [selectedSessionForQr, setSelectedSessionForQr] = useState<CourseSession | null>(null);

  // View modes: Courses
  const [coursesViewMode, setCoursesViewMode] = useState<"dashboard" | "grid" | "table">("dashboard");
  const [courseSearch, setCourseSearch] = useState("");
  const [courseStatusFilter, setCourseStatusFilter] = useState("all");
  const [courseTypeFilter, setCourseTypeFilter] = useState("all");
  const [coursePage, setCoursePage] = useState(1);
  const coursePageSize = 10;
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CourseSession | null>(null);

  // View modes: Teachers
  const [teachersViewMode, setTeachersViewMode] = useState<"dashboard" | "grid" | "table">("dashboard");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherRatingFilter, setTeacherRatingFilter] = useState("all");
  const [teacherPage, setTeacherPage] = useState(1);
  const teacherPageSize = 6;
  const [isEditTeacherOpen, setIsEditTeacherOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);

  // View modes: Students
  const [studentsViewMode, setStudentsViewMode] = useState<"dashboard" | "grid" | "table">("dashboard");
  const [studentFundFilter, setStudentFundFilter] = useState("all");
  const [studentPage, setStudentPage] = useState(1);
  const studentPageSize = 10;
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [newStudentForm, setNewStudentForm] = useState({
    fullName: "",
    code: "",
    company: "",
    industry: "",
    position: "",
    classRole: "Học Viên Chính Thức",
    phone: "",
    email: "",
    classFundStatus: "Đã nộp (2.000.000đ)" as any,
  });

  // Modal Thêm Buổi Học (Học bù / Training chuyên sâu / Ngoại khóa)
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    sessionType: "makeup" as "standard" | "makeup" | "training" | "field_trip",
    title: "",
    instructorName: "",
    date: "",
    time: "08:30 - 11:30",
    location: "Hội trường Tầng 3 - Trụ sở CLB CEO HN10 & Hybrid Zoom",
    maxAttendees: 95,
  });

  // State: Students & Dashboard
  const [students, setStudents] = useState<StudentItem[]>(DEFAULT_STUDENTS);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentRoleFilter, setStudentRoleFilter] = useState("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const handleToggleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteStudents = () => {
    if (selectedStudentIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedStudentIds.length} học viên đã chọn khỏi danh sách?`)) {
      return;
    }
    setStudents((prev) => prev.filter((s) => !selectedStudentIds.includes(s.id)));
    toast.success(`Đã xóa thành công ${selectedStudentIds.length} học viên khỏi lớp!`);
    setSelectedStudentIds([]);
  };

  // Courses CRUD
  const handleDeleteSession = (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa buổi học này?")) return;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Đã xóa buổi học thành công!");
  };

  const handleOpenEditSession = (sess: CourseSession) => {
    setEditingSession({ ...sess });
    setIsEditSessionOpen(true);
  };

  const handleSaveEditSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession || !editingSession.title.trim()) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === editingSession.id ? editingSession : s))
    );
    setIsEditSessionOpen(false);
    toast.success("Đã cập nhật thông tin buổi học!");
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.title.trim()) {
      toast.error("Vui lòng nhập tên buổi học");
      return;
    }
    let typeName = "Buổi Học Bù";
    if (sessionForm.sessionType === "training") typeName = "Training Chuyên Sâu";
    else if (sessionForm.sessionType === "field_trip") typeName = "Ngoại Khóa Doanh Nghiệp";

    const nextNum = sessions.length + 1;
    const newSess: CourseSession = {
      id: `sess-custom-${Date.now()}`,
      sessionNumber: nextNum,
      sessionType: sessionForm.sessionType,
      sessionTypeName: typeName,
      title: sessionForm.title.trim(),
      instructorName: sessionForm.instructorName.trim() || "Chuyên gia thỉnh giảng",
      date: sessionForm.date.trim() || new Date().toLocaleDateString("vi-VN"),
      time: sessionForm.time.trim() || "08:30 - 11:30",
      location: sessionForm.location.trim() || "Hội trường CLB CEO HN10",
      status: "upcoming",
      attendees: 0,
      maxAttendees: Number(sessionForm.maxAttendees) || 95,
      qrCode: `QR-CLASS-CUSTOM-${Date.now().toString().slice(-4)}`,
    };

    setSessions((prev) => [...prev, newSess]);
    setIsAddSessionOpen(false);
    setSessionForm({
      sessionType: "makeup",
      title: "",
      instructorName: "",
      date: "",
      time: "08:30 - 11:30",
      location: "Hội trường Tầng 3 - Trụ sở CLB CEO HN10 & Hybrid Zoom",
      maxAttendees: 95,
    });
    toast.success(`Đã thêm ${typeName} thành công!`);
  };

  // Teachers CRUD
  const handleDeleteTeacher = (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa giảng viên này khỏi danh sách?")) return;
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    toast.success("Đã xóa giảng viên thành công!");
  };

  const handleOpenEditTeacher = (tc: any) => {
    setEditingTeacher({ ...tc });
    setIsEditTeacherOpen(true);
  };

  const handleSaveEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editingTeacher.name.trim()) return;
    setTeachers((prev) =>
      prev.map((t) => (t.id === editingTeacher.id ? editingTeacher : t))
    );
    setIsEditTeacherOpen(false);
    toast.success("Đã cập nhật thông tin giảng viên!");
  };

  // Students CRUD
  const handleDeleteStudent = (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa học viên này khỏi danh sách lớp?")) return;
    setStudents((prev) => prev.filter((s) => s.id !== id));
    toast.success("Đã xóa học viên thành công!");
  };

  const handleOpenEditStudent = (st: StudentItem) => {
    setEditingStudent({ ...st });
    setIsEditStudentOpen(true);
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.fullName.trim()) return;
    setStudents((prev) =>
      prev.map((s) => (s.id === editingStudent.id ? editingStudent : s))
    );
    setIsEditStudentOpen(false);
    toast.success("Đã cập nhật thông tin học viên!");
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên học viên!");
      return;
    }
    const nextCode = `HN10-${String(students.length + 1).padStart(3, "0")}`;
    const newStd: StudentItem = {
      id: `std-${Date.now()}`,
      code: newStudentForm.code.trim() || nextCode,
      fullName: newStudentForm.fullName.trim(),
      company: newStudentForm.company.trim() || "Doanh nghiệp CEO HN10",
      industry: newStudentForm.industry.trim() || "Thương mại & Dịch vụ",
      position: newStudentForm.position.trim() || "Tổng Giám Đốc (CEO)",
      classRole: newStudentForm.classRole || "Học Viên Chính Thức",
      phone: newStudentForm.phone.trim() || "0988000000",
      email: newStudentForm.email.trim() || "hocvien@ceohn10.vn",
      attendanceRate: "3/3 buổi (100%)",
      eventsJoined: 5,
      classFundStatus: newStudentForm.classFundStatus || "Đã nộp (2.000.000đ)",
      penaltyDebt: 0,
      karmaPoints: 95,
      status: "Đang theo học",
    };
    setStudents((prev) => [newStd, ...prev]);
    setIsAddStudentOpen(false);
    setNewStudentForm({
      fullName: "",
      code: "",
      company: "",
      industry: "",
      position: "",
      classRole: "Học Viên Chính Thức",
      phone: "",
      email: "",
      classFundStatus: "Đã nộp (2.000.000đ)",
    });
    toast.success("Đã thêm học viên mới vào lớp thành công!");
  };

  // State: Finance & Ledger
  const [ledgerEntries, setLedgerEntries] = useState<ClassLedgerEntry[]>(DEFAULT_LEDGER);
  const [financeTypeFilter, setFinanceTypeFilter] = useState("all");

  // Modal Thêm giao dịch thu chi lớp học
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [newTxForm, setNewTxForm] = useState({
    description: "",
    sourceType: "penalty_fee",
    direction: "IN" as "IN" | "OUT",
    amount: 500000,
    personInCharge: "Ban Cán Sự Lớp",
    documentLink: "",
  });

  // Modal Thêm Giáo Viên
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    title: "",
    phone: "",
    email: "",
    coursesCount: 1,
    rating: 5.0,
  });

  // Danh sách giáo viên
  const [teachers, setTeachers] = useState([
    {
      id: "tc-1",
      name: "TS. Nguyễn Trí Hiếu",
      title: "Chuyên gia Tài chính & Ngân hàng quốc tế",
      coursesCount: 4,
      studentsCount: 180,
      phone: "0903123456",
      email: "hieu.nguyen@ceohn10.vn",
      rating: 4.9,
    },
    {
      id: "tc-2",
      name: "ThS. Đỗ Hoài Nam",
      title: "Chuyên gia Quản trị Chiến lược & Tăng trưởng",
      coursesCount: 3,
      studentsCount: 140,
      phone: "0912987654",
      email: "nam.do@ceohn10.vn",
      rating: 4.8,
    },
    {
      id: "tc-3",
      name: "Bà Phạm Thanh Hưng",
      title: "Chuyên gia Đàm phán B2B & Đầu tư Doanh nghiệp",
      coursesCount: 5,
      studentsCount: 220,
      phone: "0988554433",
      email: "hung.pham@ceohn10.vn",
      rating: 5.0,
    },
    {
      id: "tc-4",
      name: "TS. Lê Thẩm Dương",
      title: "Cố vấn Văn hóa Doanh nghiệp & Nghệ thuật Lãnh đạo",
      coursesCount: 6,
      studentsCount: 310,
      phone: "0915667788",
      email: "duong.le@ceohn10.vn",
      rating: 4.9,
    },
  ]);

  // Thống kê tài chính quỹ lớp
  const financeStats = React.useMemo(() => {
    const initFund = 20000000; // Khởi tạo đúng 20 triệu từ quỹ tổng
    let totalIn = 0;
    let totalOut = 0;
    let penaltyIn = 0;
    let eventIn = 0;
    let trainingIn = 0;
    let memberIn = 0;

    ledgerEntries.forEach((tx) => {
      if (tx.direction === "IN") {
        totalIn += tx.amount;
        if (tx.sourceType === "penalty_fee") penaltyIn += tx.amount;
        if (tx.sourceType === "event_fee") eventIn += tx.amount;
        if (tx.sourceType === "training_fee") trainingIn += tx.amount;
        if (tx.sourceType === "member_fee") memberIn += tx.amount;
      } else {
        totalOut += tx.amount;
      }
    });

    const balance = totalIn - totalOut;

    return {
      initFund,
      totalIn,
      totalOut,
      balance,
      penaltyIn,
      eventIn,
      trainingIn,
      memberIn,
    };
  }, [ledgerEntries]);

  // ── LỌC & PHÂN TRANG: BUỔI HỌC (COURSES) ──
  const filteredSessions = React.useMemo(() => {
    return sessions.filter((s) => {
      const matchSearch =
        !courseSearch.trim() ||
        s.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
        s.instructorName.toLowerCase().includes(courseSearch.toLowerCase()) ||
        s.location.toLowerCase().includes(courseSearch.toLowerCase()) ||
        `buổi ${s.sessionNumber}`.includes(courseSearch.toLowerCase());
      const matchStatus =
        courseStatusFilter === "all" || s.status === courseStatusFilter;
      const matchType =
        courseTypeFilter === "all" || s.sessionType === courseTypeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [sessions, courseSearch, courseStatusFilter, courseTypeFilter]);

  const totalCoursePages = Math.ceil(filteredSessions.length / coursePageSize) || 1;
  const pagedSessions = React.useMemo(() => {
    const start = (coursePage - 1) * coursePageSize;
    return filteredSessions.slice(start, start + coursePageSize);
  }, [filteredSessions, coursePage, coursePageSize]);

  // ── LỌC & PHÂN TRANG: GIẢNG VIÊN (TEACHERS) ──
  const filteredTeachers = React.useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        !teacherSearch.trim() ||
        t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.title.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.phone.includes(teacherSearch);
      const matchRating =
        teacherRatingFilter === "all" ||
        (teacherRatingFilter === "5.0" && t.rating >= 5.0) ||
        (teacherRatingFilter === "4.8" && t.rating >= 4.8);
      return matchSearch && matchRating;
    });
  }, [teachers, teacherSearch, teacherRatingFilter]);

  const totalTeacherPages = Math.ceil(filteredTeachers.length / teacherPageSize) || 1;
  const pagedTeachers = React.useMemo(() => {
    const start = (teacherPage - 1) * teacherPageSize;
    return filteredTeachers.slice(start, start + teacherPageSize);
  }, [filteredTeachers, teacherPage, teacherPageSize]);

  // ── LỌC & PHÂN TRANG: HỌC VIÊN (STUDENTS) ──
  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !studentSearch.trim() ||
        s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.company.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.phone.includes(studentSearch);

      const matchRole =
        studentRoleFilter === "all" ||
        (studentRoleFilter === "leader" && s.classRole.includes("Lớp Trưởng")) ||
        (studentRoleFilter === "vice" && s.classRole.includes("Lớp Phó")) ||
        (studentRoleFilter === "official" && s.classRole.includes("Chính Thức")) ||
        (studentRoleFilter === "auditor" && s.classRole.includes("Dự Thính"));

      const matchFund =
        studentFundFilter === "all" ||
        (studentFundFilter === "paid" && s.classFundStatus.includes("Đã nộp")) ||
        (studentFundFilter === "unpaid" && s.classFundStatus.includes("Chưa nộp")) ||
        (studentFundFilter === "exempt" && s.classFundStatus.includes("Miễn giảm"));

      return matchSearch && matchRole && matchFund;
    });
  }, [students, studentSearch, studentRoleFilter, studentFundFilter]);

  const totalStudentPages = Math.ceil(filteredStudents.length / studentPageSize) || 1;
  const pagedStudents = React.useMemo(() => {
    const start = (studentPage - 1) * studentPageSize;
    return filteredStudents.slice(start, start + studentPageSize);
  }, [filteredStudents, studentPage, studentPageSize]);

  // Lọc sổ cái thu chi
  const filteredLedger = React.useMemo(() => {
    return ledgerEntries.filter((tx) => {
      if (financeTypeFilter === "all") return true;
      if (financeTypeFilter === "IN") return tx.direction === "IN";
      if (financeTypeFilter === "OUT") return tx.direction === "OUT";
      return tx.sourceType === financeTypeFilter;
    });
  }, [ledgerEntries, financeTypeFilter]);

  // Thêm giao dịch thu chi mới
  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxForm.description.trim() || newTxForm.amount <= 0) {
      toast.error("Vui lòng điền nội dung và số tiền hợp lệ!");
      return;
    }

    let typeName = "Khoản thu";
    if (newTxForm.sourceType === "penalty_fee") typeName = "Phí Phạt Nội Quy Lớp";
    else if (newTxForm.sourceType === "event_fee") typeName = "Phí Sự Kiện Lớp";
    else if (newTxForm.sourceType === "training_fee") typeName = "Phí Chương Trình Training";
    else if (newTxForm.sourceType === "member_fee") typeName = "Quỹ Học Viên Chính Khóa";
    else if (newTxForm.sourceType.startsWith("expense_")) typeName = "Chi Hoạt Động Lớp";

    const newTx: ClassLedgerEntry = {
      id: `tx-${Date.now()}`,
      code: `GD-${newTxForm.direction}-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString("vi-VN"),
      description: newTxForm.description.trim(),
      sourceType: newTxForm.sourceType as any,
      sourceTypeName: typeName,
      direction: newTxForm.direction,
      amount: Number(newTxForm.amount),
      personInCharge: newTxForm.personInCharge.trim() || "Ban Cán Sự Lớp",
      status: "Đã xác nhận",
      documentLink: newTxForm.documentLink.trim() || undefined,
    };

    setLedgerEntries([newTx, ...ledgerEntries]);
    setIsAddTxOpen(false);
    setNewTxForm({
      description: "",
      sourceType: "penalty_fee",
      direction: "IN",
      amount: 500000,
      personInCharge: "Ban Cán Sự Lớp",
      documentLink: "",
    });
    toast.success("Đã ghi nhận giao dịch vào Sổ Cái Quỹ Lớp CEO HN10 thành công!");
  };

  // Xuất Excel danh sách học viên đa cột
  const handleExportStudentsExcel = () => {
    exportToExcel({
      filename: `Danh_Sach_Hoc_Vien_CEOHN10_${Date.now()}`,
      sheetName: "HocVien",
      title: "BẢNG QUẢN TRỊ HỌC VIÊN LỚP DOANH NHÂN CEO HN10 (HANOIBA)",
      subtitle: `Khóa học: CEOHN10-2026 · Tổng số: ${filteredStudents.length} Học viên`,
      columns: [
        { header: "Mã Học Viên", key: "code", value: (r: StudentItem) => r.code },
        { header: "Họ và Tên", key: "fullName", value: (r: StudentItem) => r.fullName },
        { header: "Doanh Nghiệp", key: "company", value: (r: StudentItem) => r.company },
        { header: "Ngành Nghề", key: "industry", value: (r: StudentItem) => r.industry },
        { header: "Chức Vụ DN", key: "position", value: (r: StudentItem) => r.position },
        { header: "Chức Danh Lớp", key: "classRole", value: (r: StudentItem) => r.classRole },
        { header: "Số Điện Thoại", key: "phone", value: (r: StudentItem) => r.phone },
        { header: "Email", key: "email", value: (r: StudentItem) => r.email },
        { header: "Điểm Danh / Chuyên Cần", key: "attendanceRate", value: (r: StudentItem) => r.attendanceRate },
        { header: "Sự Kiện Đã Tham Gia", key: "eventsJoined", value: (r: StudentItem) => r.eventsJoined },
        { header: "Đóng Quỹ Lớp (2tr)", key: "classFundStatus", value: (r: StudentItem) => r.classFundStatus },
        { header: "Nợ Quỹ Phạt (VNĐ)", key: "penaltyDebt", value: (r: StudentItem) => r.penaltyDebt },
        { header: "Điểm Tín Nhiệm (Karma)", key: "karmaPoints", value: (r: StudentItem) => r.karmaPoints },
        { header: "Trạng Thái", key: "status", value: (r: StudentItem) => r.status },
      ],
      data: filteredStudents,
    });
    toast.success("Đã xuất danh sách Học viên ra file Excel thành công!");
  };

  // Xuất Excel sổ cái tài chính lớp học
  const handleExportFinanceExcel = () => {
    exportToExcel({
      filename: `So_Cai_Tai_Chinh_Lop_CEOHN10_${Date.now()}`,
      sheetName: "SoCaiQuyLop",
      title: "BÁO CÁO TỔNG HỢP THU CHI & SỔ CÁI DÒNG TIỀN QUỸ LỚP CEO HN10",
      subtitle: "Vốn khởi tạo đúng chuẩn 20.000.000đ từ Quỹ Tổng HN10 kèm tổng hợp phí phạt, phí sự kiện, phí đào tạo",
      columns: [
        { header: "Mã Giao Dịch", key: "code", value: (r: ClassLedgerEntry) => r.code },
        { header: "Ngày Thực Hiện", key: "date", value: (r: ClassLedgerEntry) => r.date },
        { header: "Nội Dung Diễn Giải", key: "description", value: (r: ClassLedgerEntry) => r.description },
        { header: "Phân Loại Nguồn Tiền", key: "sourceTypeName", value: (r: ClassLedgerEntry) => r.sourceTypeName },
        { header: "Luồng Tiền", key: "direction", value: (r: ClassLedgerEntry) => (r.direction === "IN" ? "THU (VÀO)" : "CHI (RA)") },
        { header: "Số Tiền (VNĐ)", key: "amount", value: (r: ClassLedgerEntry) => r.amount },
        { header: "Người Phụ Trách", key: "personInCharge", value: (r: ClassLedgerEntry) => r.personInCharge },
        { header: "Trạng Thái", key: "status", value: (r: ClassLedgerEntry) => r.status },
      ],
      data: filteredLedger,
    });
    toast.success("Đã xuất Báo cáo tài chính Quỹ lớp ra file Excel thành công!");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Phân Hệ Lớp Học &amp; Đào Tạo CEO HN10
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Quản lý khóa học, lịch học 30 buổi, giảng viên, dashboard học viên đa chỉ số và Quỹ tài chính lớp (20tr khởi tạo &amp; tổng hợp thu/chi)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/trainings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted transition"
            >
              <span>Giao diện Đào tạo nâng cao</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border">
          {[
            { key: "courses", label: "Quản lý Lớp & Lịch học", icon: BookOpen },
            { key: "teachers", label: "Quản lý Giảng viên", icon: Users },
            { key: "students", label: "Dashboard Học viên (Đa chỉ số)", icon: UserCheck },
            { key: "finance", label: "Quỹ Tài Chính Lớp (20tr & Thu/Chi)", icon: Wallet },
            { key: "attendance-qr", label: "Mã QR Điểm Danh Theo Buổi", icon: QrCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                  isActive
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: QUẢN LÝ LỚP HỌC & LỊCH HỌC                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "courses" && (
          <div className="space-y-6">
            {/* Banner Lớp Học Trọng Điểm */}
            <div className="p-6 rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 via-background to-amber-500/5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-primary/10 grid place-items-center text-primary font-black text-xl shadow-2xs">
                    30
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase font-mono">
                        CLASS-CEOHN10-2026
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        Đang diễn ra
                      </span>
                    </div>
                    <h3 className="text-base font-black text-foreground mt-1">
                      Lớp Doanh Nhân CEO HN10 - Chương Trình Đào Tạo 30 Buổi Thứ Bảy Hàng Tuần
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setActiveTab("attendance-qr")}
                    className="h-8 gap-1.5 text-xs font-bold"
                  >
                    <QrCode className="h-3.5 w-3.5" /> Chiếu QR Điểm Danh
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed bg-background/80 p-3.5 rounded-xl border border-border/60">
                Chương trình đào tạo thực chiến 30 chuyên đề quản trị, tài chính, đàm phán và công nghệ dành riêng cho các Chủ tịch, CEO và Lãnh đạo doanh nghiệp thành viên CLB CEO HN10 (HanoiBA). Học trực tiếp vào sáng Thứ Bảy hàng tuần kết hợp Online Hybrid.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-muted-foreground text-[11px]">Tổng số buổi học:</div>
                  <div className="text-base font-bold text-foreground">30 Chuyên đề</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-muted-foreground text-[11px]">Đã hoàn thành:</div>
                  <div className="text-base font-bold text-emerald-600">
                    {sessions.filter((s) => s.status === "completed").length} / {sessions.length} buổi
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-muted-foreground text-[11px]">Sĩ số học viên:</div>
                  <div className="text-base font-bold text-primary">{students.length} Học viên</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-muted-foreground text-[11px]">Ban Cán Sự Phụ Trách:</div>
                  <div className="text-xs font-bold text-foreground truncate">Nguyễn Văn Hùng &amp; BQT</div>
                </div>
              </div>
            </div>

            {/* Thanh công cụ tìm kiếm, bộ lọc và chuyển đổi View Mode */}
            <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative min-w-[220px] flex-1 max-w-sm">
                    <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => {
                        setCourseSearch(e.target.value);
                        setCoursePage(1);
                      }}
                      placeholder="Tìm theo tên buổi, giảng viên, địa điểm..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <select
                    value={courseStatusFilter}
                    onChange={(e) => {
                      setCourseStatusFilter(e.target.value);
                      setCoursePage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="completed">Đã hoàn thành</option>
                    <option value="ongoing">Đang diễn ra</option>
                    <option value="upcoming">Sắp tới</option>
                  </select>

                  <select
                    value={courseTypeFilter}
                    onChange={(e) => {
                      setCourseTypeFilter(e.target.value);
                      setCoursePage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary"
                  >
                    <option value="all">Tất cả phân loại</option>
                    <option value="standard">Chuyên Đề Chính Khóa</option>
                    <option value="makeup">Buổi Học Bù</option>
                    <option value="training">Training Chuyên Sâu</option>
                    <option value="field_trip">Ngoại Khóa Doanh Nghiệp</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <ViewModeSwitcher value={coursesViewMode} onChange={setCoursesViewMode} />
                  <Button
                    size="sm"
                    onClick={() => setIsAddSessionOpen(true)}
                    className="h-8 gap-1.5 text-xs font-semibold bg-[#002B70] hover:bg-[#003B95] text-white cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm Buổi Học</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* ── CHẾ ĐỘ 1: DASHBOARD BUỔI HỌC ── */}
            {coursesViewMode === "dashboard" && (
              <div className="space-y-4">
                {/* KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
                    <div className="text-[11px] text-muted-foreground font-semibold">TỔNG BUỔI HỌC</div>
                    <div className="text-xl font-bold text-foreground mt-1">{sessions.length} Buổi</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">30 buổi chuẩn + ngoại khóa</div>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
                    <div className="text-[11px] text-muted-foreground font-semibold">ĐÃ HOÀN THÀNH</div>
                    <div className="text-xl font-bold text-emerald-600 mt-1">
                      {sessions.filter((s) => s.status === "completed").length} Buổi
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Đạt {((sessions.filter((s) => s.status === "completed").length / (sessions.length || 1)) * 100).toFixed(0)}% lộ trình
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
                    <div className="text-[11px] text-muted-foreground font-semibold">ĐIỂM DANH TRUNG BÌNH</div>
                    <div className="text-xl font-bold text-primary mt-1">94.8%</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">90/95 HV mỗi buổi</div>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
                    <div className="text-[11px] text-muted-foreground font-semibold">BUỔI TIẾP THEO</div>
                    <div className="text-sm font-bold text-amber-600 truncate mt-1">
                      {sessions.find((s) => s.status === "ongoing" || s.status === "upcoming")?.title || "Chưa có lịch"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {sessions.find((s) => s.status === "ongoing" || s.status === "upcoming")?.date}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Tiến độ hoàn thành khóa học Doanh Trí CEO HN10:</span>
                    <span className="text-primary font-bold">
                      {sessions.filter((s) => s.status === "completed").length} / {sessions.length} Buổi
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (sessions.filter((s) => s.status === "completed").length / (sessions.length || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Bảng danh sách buổi học */}
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-muted/50 font-bold text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-3 py-3 w-12 text-center">#</th>
                          <th className="px-3.5 py-3">Buổi Học / Chuyên Đề</th>
                          <th className="px-3.5 py-3">Phân Loại</th>
                          <th className="px-3.5 py-3">Giảng Viên</th>
                          <th className="px-3.5 py-3">Thời Gian &amp; Địa Điểm</th>
                          <th className="px-3.5 py-3 text-center">Điểm Danh</th>
                          <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                          <th className="px-3.5 py-3 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pagedSessions.map((sess) => (
                          <tr key={sess.id} className="hover:bg-muted/20 transition">
                            <td className="px-3 py-3 text-center font-mono font-bold text-primary">
                              #{sess.sessionNumber}
                            </td>
                            <td className="px-3.5 py-3 font-semibold text-foreground max-w-sm truncate">
                              {sess.title}
                            </td>
                            <td className="px-3.5 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                                {sess.sessionTypeName || "Chính Khóa"}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 font-medium text-foreground">
                              {sess.instructorName}
                            </td>
                            <td className="px-3.5 py-3 text-muted-foreground text-[11px]">
                              <div>{sess.date} ({sess.time})</div>
                              <div className="truncate max-w-xs">{sess.location}</div>
                            </td>
                            <td className="px-3.5 py-3 text-center font-bold text-emerald-600">
                              {sess.attendees} / {sess.maxAttendees} HV
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sess.status === "completed"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : sess.status === "ongoing"
                                    ? "bg-amber-500/10 text-amber-600 animate-pulse"
                                    : "bg-blue-500/10 text-blue-600"
                                }`}
                              >
                                {sess.status === "completed"
                                  ? "Đã hoàn thành"
                                  : sess.status === "ongoing"
                                  ? "Đang diễn ra"
                                  : "Sắp tới"}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSessionForQr(sess)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-[11px] font-semibold transition cursor-pointer"
                                  title="Chiếu mã QR điểm danh"
                                >
                                  <QrCode className="size-3" /> QR
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSession(sess)}
                                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                                  title="Chỉnh sửa buổi học"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSession(sess.id)}
                                  className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                                  title="Xóa buổi học"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <SimplePagination
                  currentPage={coursePage}
                  totalPages={totalCoursePages}
                  onPageChange={setCoursePage}
                  totalItems={filteredSessions.length}
                  pageSize={coursePageSize}
                />
              </div>
            )}

            {/* ── CHẾ ĐỘ 2: LƯỚI (GRID) BUỔI HỌC ── */}
            {coursesViewMode === "grid" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pagedSessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-primary/40 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-primary px-2 py-0.5 rounded-md bg-primary/10">
                            Buổi #{sess.sessionNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sess.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : sess.status === "ongoing"
                                ? "bg-amber-500/10 text-amber-600 animate-pulse"
                                : "bg-blue-500/10 text-blue-600"
                            }`}
                          >
                            {sess.status === "completed"
                              ? "Đã hoàn thành"
                              : sess.status === "ongoing"
                              ? "Đang diễn ra"
                              : "Sắp tới"}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                          {sess.title}
                        </h4>

                        <div className="space-y-1 text-xs text-muted-foreground pt-1">
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <Users className="size-3.5 text-primary shrink-0" />
                            <span className="truncate">{sess.instructorName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="size-3.5 shrink-0" />
                            <span>{sess.date} ({sess.time})</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] truncate">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{sess.location}</span>
                          </div>
                        </div>

                        {/* Điểm danh Bar */}
                        <div className="pt-2 border-t border-border/60 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Điểm danh:</span>
                            <span className="font-bold text-emerald-600">
                              {sess.attendees} / {sess.maxAttendees} HV
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (sess.attendees / (sess.maxAttendees || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSessionForQr(sess)}
                          className="h-7 text-xs gap-1 font-semibold text-primary cursor-pointer"
                        >
                          <QrCode className="size-3" /> QR Điểm Danh
                        </Button>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSession(sess)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(sess.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                            title="Xóa buổi học"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <SimplePagination
                  currentPage={coursePage}
                  totalPages={totalCoursePages}
                  onPageChange={setCoursePage}
                  totalItems={filteredSessions.length}
                  pageSize={coursePageSize}
                />
              </div>
            )}

            {/* ── CHẾ ĐỘ 3: BẢNG (TABLE) BUỔI HỌC ── */}
            {coursesViewMode === "table" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-muted/50 font-bold text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-3.5 py-3">Buổi</th>
                          <th className="px-3.5 py-3">Mã Chuyên Đề</th>
                          <th className="px-3.5 py-3">Tiêu Đề Khóa Học</th>
                          <th className="px-3.5 py-3">Phân Loại</th>
                          <th className="px-3.5 py-3">Giảng Viên</th>
                          <th className="px-3.5 py-3">Ngày &amp; Giờ</th>
                          <th className="px-3.5 py-3">Địa Điểm</th>
                          <th className="px-3.5 py-3 text-center">Sĩ Số Đã Đến</th>
                          <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                          <th className="px-3.5 py-3 text-right">Hành Động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pagedSessions.map((sess) => (
                          <tr key={sess.id} className="hover:bg-muted/20 transition">
                            <td className="px-3.5 py-3 font-mono font-bold text-primary">
                              #{sess.sessionNumber}
                            </td>
                            <td className="px-3.5 py-3 font-mono text-muted-foreground text-[11px]">
                              {sess.id}
                            </td>
                            <td className="px-3.5 py-3 font-bold text-foreground max-w-sm truncate">
                              {sess.title}
                            </td>
                            <td className="px-3.5 py-3 text-muted-foreground">
                              {sess.sessionTypeName || "Chính Khóa"}
                            </td>
                            <td className="px-3.5 py-3 font-medium text-foreground">
                              {sess.instructorName}
                            </td>
                            <td className="px-3.5 py-3 text-muted-foreground text-[11px]">
                              {sess.date} ({sess.time})
                            </td>
                            <td className="px-3.5 py-3 text-muted-foreground text-[11px] truncate max-w-xs">
                              {sess.location}
                            </td>
                            <td className="px-3.5 py-3 text-center font-bold text-emerald-600">
                              {sess.attendees}/{sess.maxAttendees}
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sess.status === "completed"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : sess.status === "ongoing"
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "bg-blue-500/10 text-blue-600"
                                }`}
                              >
                                {sess.status === "completed"
                                  ? "Đã hoàn thành"
                                  : sess.status === "ongoing"
                                  ? "Đang diễn ra"
                                  : "Sắp tới"}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSessionForQr(sess)}
                                  className="p-1 rounded-lg hover:bg-primary/10 text-primary transition cursor-pointer"
                                  title="QR"
                                >
                                  <QrCode className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSession(sess)}
                                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                                  title="Sửa"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSession(sess.id)}
                                  className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                                  title="Xóa"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <SimplePagination
                  currentPage={coursePage}
                  totalPages={totalCoursePages}
                  onPageChange={setCoursePage}
                  totalItems={filteredSessions.length}
                  pageSize={coursePageSize}
                />
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: QUẢN LÝ GIÁO VIÊN & GIẢNG VIÊN                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "teachers" && (
          <div className="space-y-6">
            {/* Header & Thanh công cụ lọc, tìm kiếm và chuyển chế độ xem */}
            <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative min-w-[220px] flex-1 max-w-sm">
                    <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => {
                        setTeacherSearch(e.target.value);
                        setTeacherPage(1);
                      }}
                      placeholder="Tìm theo tên giảng viên, chuyên môn, email..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <select
                    value={teacherRatingFilter}
                    onChange={(e) => {
                      setTeacherRatingFilter(e.target.value);
                      setTeacherPage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary"
                  >
                    <option value="all">Tất cả đánh giá</option>
                    <option value="5.0">5.0 ★ Tuyệt đối</option>
                    <option value="4.8">Từ 4.8 ★ trở lên</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <ViewModeSwitcher value={teachersViewMode} onChange={setTeachersViewMode} />
                  <Button
                    size="sm"
                    onClick={() => setIsAddTeacherOpen(true)}
                    className="h-8 gap-1.5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" /> Thêm Giáo Viên
                  </Button>
                </div>
              </div>
            </div>

            {/* ── CHẾ ĐỘ 1: DASHBOARD GIẢNG VIÊN ── */}
            {teachersViewMode === "dashboard" && (
              <div className="space-y-4">
                {/* KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
                    <div className="text-[11px] text-muted-foreground font-semibold">TỔNG GIẢNG VIÊN</div>
                    <div className="text-xl font-bold text-foreground mt-1">{teachers.length} Chuyên Gia</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Giảng viên &amp; Cố vấn cao cấp</div>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
                    <div className="text-[11px] text-muted-foreground font-semibold">ĐÁNH GIÁ TRUNG BÌNH</div>
                    <div className="text-xl font-bold text-amber-500 mt-1">★ 4.9 / 5.0</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Đánh giá thực tế từ học viên</div>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
                    <div className="text-[11px] text-muted-foreground font-semibold">TỔNG LỚP PHỤ TRÁCH</div>
                    <div className="text-xl font-bold text-primary mt-1">
                      {teachers.reduce((sum, t) => sum + (t.coursesCount || 0), 0)} Lớp
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Các lớp thuộc CEO HN10</div>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
                    <div className="text-[11px] text-muted-foreground font-semibold">LƯỢT HỌC VIÊN ĐÀO TẠO</div>
                    <div className="text-xl font-bold text-emerald-600 mt-1">
                      {teachers.reduce((sum, t) => sum + (t.studentsCount || 0), 0)} HV
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Học viên tham gia các buổi</div>
                  </div>
                </div>

                {/* Bảng danh sách giảng viên */}
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-muted/50 font-bold text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-3.5 py-3">Giảng Viên / Chuyên Gia</th>
                          <th className="px-3.5 py-3">Danh Hiệu &amp; Chuyên Môn</th>
                          <th className="px-3.5 py-3 text-center">Đánh Giá</th>
                          <th className="px-3.5 py-3 text-center">Lớp Phụ Trách</th>
                          <th className="px-3.5 py-3 text-center">Lượt Học Viên</th>
                          <th className="px-3.5 py-3">Liên Hệ</th>
                          <th className="px-3.5 py-3 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pagedTeachers.map((tc) => (
                          <tr key={tc.id} className="hover:bg-muted/20 transition">
                            <td className="px-3.5 py-3 font-bold text-foreground">
                              {tc.name}
                            </td>
                            <td className="px-3.5 py-3 text-muted-foreground max-w-xs truncate">
                              {tc.title}
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                ★ {tc.rating}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-center font-semibold text-foreground">
                              {tc.coursesCount} lớp
                            </td>
                            <td className="px-3.5 py-3 text-center font-bold text-primary">
                              {tc.studentsCount} HV
                            </td>
                            <td className="px-3.5 py-3 text-muted-foreground text-[11px] font-mono">
                              <div>{tc.phone}</div>
                              <div>{tc.email}</div>
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTeacher(tc)}
                                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                                  title="Chỉnh sửa thông tin giảng viên"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTeacher(tc.id)}
                                  className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                                  title="Xóa giảng viên"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <SimplePagination
                  currentPage={teacherPage}
                  totalPages={totalTeacherPages}
                  onPageChange={setTeacherPage}
                  totalItems={filteredTeachers.length}
                  pageSize={teacherPageSize}
                />
              </div>
            )}

            {/* ── CHẾ ĐỘ 2: LƯỚI (GRID) GIẢNG VIÊN ── */}
            {teachersViewMode === "grid" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pagedTeachers.map((tc) => (
                    <div key={tc.id} className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary font-bold grid place-items-center text-sm">
                              {tc.name.split(" ").slice(-1)[0]?.[0] || "GV"}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">{tc.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tc.title}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                            ★ {tc.rating}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                          <div>
                            <span className="font-semibold text-foreground">{tc.coursesCount}</span> lớp phụ trách
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">{tc.studentsCount}</span> học viên
                          </div>
                        </div>

                        <div className="text-[11px] text-muted-foreground font-mono space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Phone className="size-3 text-muted-foreground" />
                            <span>{tc.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="size-3 text-muted-foreground" />
                            <span>{tc.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTeacher(tc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
                        >
                          <Pencil className="size-3" /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTeacher(tc.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="size-3" /> Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <SimplePagination
                  currentPage={teacherPage}
                  totalPages={totalTeacherPages}
                  onPageChange={setTeacherPage}
                  totalItems={filteredTeachers.length}
                  pageSize={teacherPageSize}
                />
              </div>
            )}

            {/* ── CHẾ ĐỘ 3: BẢNG (TABLE) GIẢNG VIÊN ── */}
            {teachersViewMode === "table" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-muted/50 font-bold text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-3.5 py-3">Mã GV</th>
                          <th className="px-3.5 py-3">Họ Và Tên</th>
                          <th className="px-3.5 py-3">Học Hàm / Chuyên Môn</th>
                          <th className="px-3.5 py-3 text-center">Đánh Giá</th>
                          <th className="px-3.5 py-3 text-center">Lớp Giảng Dạy</th>
                          <th className="px-3.5 py-3 text-center">Lượt Học Viên</th>
                          <th className="px-3.5 py-3">Số Điện Thoại</th>
                          <th className="px-3.5 py-3">Email</th>
                          <th className="px-3.5 py-3 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pagedTeachers.map((tc) => (
                          <tr key={tc.id} className="hover:bg-muted/20 transition">
                            <td className="px-3.5 py-3 font-mono font-bold text-primary">
                              {tc.id}
                            </td>
                            <td className="px-3.5 py-3 font-bold text-foreground">
                              {tc.name}
                            </td>
                            <td className="px-3.5 py-3 text-muted-foreground">
                              {tc.title}
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                                ★ {tc.rating}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-center font-semibold text-foreground">
                              {tc.coursesCount}
                            </td>
                            <td className="px-3.5 py-3 text-center font-bold text-primary">
                              {tc.studentsCount}
                            </td>
                            <td className="px-3.5 py-3 font-mono text-[11px] text-muted-foreground">
                              {tc.phone}
                            </td>
                            <td className="px-3.5 py-3 font-mono text-[11px] text-muted-foreground">
                              {tc.email}
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTeacher(tc)}
                                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                                  title="Sửa"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTeacher(tc.id)}
                                  className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                                  title="Xóa"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <SimplePagination
                  currentPage={teacherPage}
                  totalPages={totalTeacherPages}
                  onPageChange={setTeacherPage}
                  totalItems={filteredTeachers.length}
                  pageSize={teacherPageSize}
                />
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 3: DASHBOARD HỌC VIÊN ĐA CHỈ SỐ (NHIỀU CỘT CHI TIẾT)         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "students" && (
          <div className="space-y-6">
            {/* Header & Thao tác tìm kiếm, lọc, view mode, xuất file */}
            <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative min-w-[220px] flex-1 max-w-sm">
                    <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        setStudentPage(1);
                      }}
                      placeholder="Tìm theo Mã HV, Họ tên, Doanh nghiệp hoặc SĐT..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <select
                    value={studentRoleFilter}
                    onChange={(e) => {
                      setStudentRoleFilter(e.target.value);
                      setStudentPage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary"
                  >
                    <option value="all">Tất cả chức danh trong lớp</option>
                    <option value="leader">Lớp Trưởng</option>
                    <option value="vice">Lớp Phó các ban</option>
                    <option value="official">Học Viên Chính Thức</option>
                    <option value="auditor">Học Viên Dự Thính</option>
                  </select>

                  <select
                    value={studentFundFilter}
                    onChange={(e) => {
                      setStudentFundFilter(e.target.value);
                      setStudentPage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary"
                  >
                    <option value="all">Tất cả trạng thái quỹ</option>
                    <option value="paid">Đã nộp quỹ (2tr)</option>
                    <option value="unpaid">Chưa nộp quỹ</option>
                    <option value="exempt">Miễn giảm quỹ</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <ViewModeSwitcher value={studentsViewMode} onChange={setStudentsViewMode} />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportStudentsExcel}
                    className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Xuất Excel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsAddStudentOpen(true)}
                    className="h-8 gap-1.5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Thêm Học Viên
                  </Button>
                </div>
              </div>
            </div>

            {/* Thanh công cụ Bulk Action chọn nhiều học viên */}
            {selectedStudentIds.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in-50">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Đang chọn {selectedStudentIds.length} học viên</span>
                  <span className="text-[11px] opacity-75">(trên tổng số {filteredStudents.length} học viên)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds([])}
                    className="px-2.5 py-1 rounded-lg border border-rose-300 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDeleteStudents}
                    className="h-7 text-xs font-bold gap-1 cursor-pointer bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Xóa {selectedStudentIds.length} Học Viên Đã Chọn</span>
                  </Button>
                </div>
              </div>
            )}

            {/* ── CHẾ ĐỘ 1: DASHBOARD HỌC VIÊN ĐA CHỈ SỐ ── */}
            {studentsViewMode === "dashboard" && (
              <div className="space-y-4">
                {/* KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
                    <div className="text-[11px] text-muted-foreground font-semibold">TỔNG SĨ SỐ HỌC VIÊN</div>
                    <div className="text-xl font-bold text-foreground mt-1">{students.length} Doanh Nhân</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Thành viên lớp CEO HN10</div>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
                    <div className="text-[11px] text-muted-foreground font-semibold">CHUYÊN CẦN TRUNG BÌNH</div>
                    <div className="text-xl font-bold text-emerald-600 mt-1">94.2%</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Tỉ lệ tham dự 3 buổi qua</div>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
                    <div className="text-[11px] text-muted-foreground font-semibold">HOÀN TẤT QUỸ LỚP (2TR)</div>
                    <div className="text-xl font-bold text-primary mt-1">
                      {students.filter((s) => s.classFundStatus.includes("Đã nộp")).length} / {students.length} HV
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Đạt {((students.filter((s) => s.classFundStatus.includes("Đã nộp")).length / (students.length || 1)) * 100).toFixed(0)}% hoàn thành
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
                    <div className="text-[11px] text-muted-foreground font-semibold">TỔNG NỢ QUỸ PHẠT</div>
                    <div className="text-xl font-bold text-rose-600 mt-1">
                      {new Intl.NumberFormat("vi-VN").format(students.reduce((acc, s) => acc + (s.penaltyDebt || 0), 0))} đ
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Phí phạt đi muộn / vắng học</div>
                  </div>
                </div>

                {/* Bảng Dữ Liệu Học Viên Đa Chỉ Số */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-muted/50 font-bold text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-3 py-3 text-center w-10">
                            <input
                              type="checkbox"
                              checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                              onChange={handleToggleSelectAllStudents}
                              className="rounded border-slate-300 text-primary focus:ring-primary size-4 cursor-pointer"
                              title="Chọn tất cả học viên"
                            />
                          </th>
                          <th className="px-3.5 py-3">Mã HV</th>
                          <th className="px-3.5 py-3">Học Viên</th>
                          <th className="px-3.5 py-3">Doanh Nghiệp &amp; Ngành Nghề</th>
                          <th className="px-3.5 py-3">Chức Vụ DN</th>
                          <th className="px-3.5 py-3">Chức Danh Lớp</th>
                          <th className="px-3.5 py-3">Liên Hệ</th>
                          <th className="px-3.5 py-3 text-center">Chuyên Cần</th>
                          <th className="px-3.5 py-3 text-center">Sự Kiện Đã Dự</th>
                          <th className="px-3.5 py-3 text-center">Quỹ Lớp (2tr)</th>
                          <th className="px-3.5 py-3 text-right">Nợ Quỹ Phạt</th>
                          <th className="px-3.5 py-3 text-center">Điểm Tín Nhiệm</th>
                          <th className="px-3.5 py-3 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pagedStudents.map((s) => (
                          <tr key={s.id} className={`hover:bg-muted/20 transition ${selectedStudentIds.includes(s.id) ? "bg-rose-500/5" : ""}`}>
                            <td className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(s.id)}
                                onChange={() => handleToggleSelectStudent(s.id)}
                                className="rounded border-slate-300 text-primary focus:ring-primary size-4 cursor-pointer"
                                title={`Chọn học viên ${s.fullName}`}
                              />
                            </td>
                            <td className="px-3.5 py-3 font-mono font-bold text-primary">
                              {s.code}
                            </td>
                            <td className="px-3.5 py-3 font-bold text-foreground">
                              {s.fullName}
                            </td>
                            <td className="px-3.5 py-3">
                              <div className="font-semibold text-foreground max-w-xs truncate">{s.company}</div>
                              <div className="text-[11px] text-muted-foreground">{s.industry}</div>
                            </td>
                            <td className="px-3.5 py-3 font-medium text-foreground">
                              {s.position}
                            </td>
                            <td className="px-3.5 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s.classRole.includes("Lớp Trưởng")
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                    : s.classRole.includes("Lớp Phó")
                                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {s.classRole}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-[11px] text-muted-foreground font-mono">
                              <div>{s.phone}</div>
                              <div>{s.email}</div>
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                {s.attendanceRate}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-center font-bold text-foreground">
                              {s.eventsJoined} sự kiện
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s.classFundStatus.includes("Đã nộp")
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : s.classFundStatus === "Chưa nộp"
                                    ? "bg-rose-500/10 text-rose-600"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {s.classFundStatus}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-right font-mono font-bold">
                              {s.penaltyDebt > 0 ? (
                                <span className="text-rose-600">
                                  {new Intl.NumberFormat("vi-VN").format(s.penaltyDebt)} đ
                                </span>
                              ) : (
                                <span className="text-emerald-600">0 đ</span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-center font-bold">
                              <span className="text-amber-600">★ {s.karmaPoints}</span>
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditStudent(s)}
                                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                                  title="Chỉnh sửa học viên"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(s.id)}
                                  className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                                  title="Xóa học viên"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <SimplePagination
                  currentPage={studentPage}
                  totalPages={totalStudentPages}
                  onPageChange={setStudentPage}
                  totalItems={filteredStudents.length}
                  pageSize={studentPageSize}
                />
              </div>
            )}

            {/* ── CHẾ ĐỘ 2: LƯỚI (GRID) THẺ HỌC VIÊN ── */}
            {studentsViewMode === "grid" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pagedStudents.map((s) => (
                    <div
                      key={s.id}
                      className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3 flex flex-col justify-between hover:border-primary/40 transition"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary font-bold grid place-items-center text-sm">
                              {s.fullName.split(" ").slice(-1)[0]?.[0] || "HV"}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">{s.fullName}</h4>
                              <p className="font-mono text-[11px] text-primary font-semibold">{s.code}</p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.classRole.includes("Lớp Trưởng")
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                : s.classRole.includes("Lớp Phó")
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {s.classRole}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1">
                          <div className="font-semibold text-foreground truncate">{s.company}</div>
                          <div className="text-muted-foreground text-[11px] truncate">{s.position} · {s.industry}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                          <div>
                            Chuyên cần: <span className="font-bold text-emerald-600">{s.attendanceRate}</span>
                          </div>
                          <div>
                            Sự kiện: <span className="font-bold text-foreground">{s.eventsJoined} sự kiện</span>
                          </div>
                          <div>
                            Quỹ lớp:{" "}
                            <span
                              className={`font-semibold ${
                                s.classFundStatus.includes("Đã nộp")
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              }`}
                            >
                              {s.classFundStatus}
                            </span>
                          </div>
                          <div>
                            Điểm tín nhiệm: <span className="font-bold text-amber-600">★ {s.karmaPoints}</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-muted-foreground font-mono space-y-0.5 pt-1 border-t border-border/50">
                          <div className="flex items-center gap-1.5">
                            <Phone className="size-3 text-muted-foreground" />
                            <span>{s.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="size-3 text-muted-foreground" />
                            <span className="truncate">{s.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60">
                        <button
                          type="button"
                          onClick={() => handleOpenEditStudent(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
                        >
                          <Pencil className="size-3" /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(s.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="size-3" /> Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <SimplePagination
                  currentPage={studentPage}
                  totalPages={totalStudentPages}
                  onPageChange={setStudentPage}
                  totalItems={filteredStudents.length}
                  pageSize={studentPageSize}
                />
              </div>
            )}

            {/* ── CHẾ ĐỘ 3: BẢNG (TABLE) HỌC VIÊN ── */}
            {studentsViewMode === "table" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-muted/50 font-bold text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-3.5 py-3">Mã HV</th>
                          <th className="px-3.5 py-3">Họ Và Tên</th>
                          <th className="px-3.5 py-3">Doanh Nghiệp</th>
                          <th className="px-3.5 py-3">Chức Vụ</th>
                          <th className="px-3.5 py-3">Chức Danh Lớp</th>
                          <th className="px-3.5 py-3">Chuyên Cần</th>
                          <th className="px-3.5 py-3">Quỹ Lớp (2tr)</th>
                          <th className="px-3.5 py-3">Nợ Phạt</th>
                          <th className="px-3.5 py-3">Điện Thoại</th>
                          <th className="px-3.5 py-3 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pagedStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-muted/20 transition">
                            <td className="px-3.5 py-3 font-mono font-bold text-primary">
                              {s.code}
                            </td>
                            <td className="px-3.5 py-3 font-bold text-foreground">
                              {s.fullName}
                            </td>
                            <td className="px-3.5 py-3 text-muted-foreground truncate max-w-xs">
                              {s.company}
                            </td>
                            <td className="px-3.5 py-3 text-foreground font-medium">
                              {s.position}
                            </td>
                            <td className="px-3.5 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground">
                                {s.classRole}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 font-semibold text-emerald-600">
                              {s.attendanceRate}
                            </td>
                            <td className="px-3.5 py-3">
                              {s.classFundStatus}
                            </td>
                            <td className="px-3.5 py-3 font-mono">
                              {s.penaltyDebt > 0 ? `${new Intl.NumberFormat("vi-VN").format(s.penaltyDebt)} đ` : "0 đ"}
                            </td>
                            <td className="px-3.5 py-3 font-mono text-[11px] text-muted-foreground">
                              {s.phone}
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditStudent(s)}
                                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                                  title="Sửa"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(s.id)}
                                  className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                                  title="Xóa"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <SimplePagination
                  currentPage={studentPage}
                  totalPages={totalStudentPages}
                  onPageChange={setStudentPage}
                  totalItems={filteredStudents.length}
                  pageSize={studentPageSize}
                />
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 4: QUỸ TÀI CHÍNH LỚP HỌC (20TR KHỞI TẠO & CÁC NGUỒN THU/CHI) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "finance" && (
          <div className="space-y-6">
            {/* THẺ TỔNG HỢP CHỈ SỐ QUỸ LỚP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Thẻ 1: Khởi tạo 20tr từ Quỹ Tổng */}
              <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">VỐN KHỞI TẠO TỪ QUỸ TỔNG</span>
                  <Award className="size-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-primary">
                  {new Intl.NumberFormat("vi-VN").format(financeStats.initFund)} VNĐ
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Đúng mức chuẩn 20.000.000đ được phê duyệt và rót từ Quỹ Tổng Hiệp Hội HN10.
                </p>
              </div>

              {/* Thẻ 2: Tổng Thu Lớp Học */}
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">TỔNG THU CÁC NGUỒN</span>
                  <ArrowDownCircle className="size-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {new Intl.NumberFormat("vi-VN").format(financeStats.totalIn)} VNĐ
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Gồm Phí phạt ({new Intl.NumberFormat("vi-VN").format(financeStats.penaltyIn)}đ), Phí sự kiện ({new Intl.NumberFormat("vi-VN").format(financeStats.eventIn)}đ), Phí training ({new Intl.NumberFormat("vi-VN").format(financeStats.trainingIn)}đ).
                </p>
              </div>

              {/* Thẻ 3: Tổng Chi Lớp Học */}
              <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400">TỔNG CHI HOẠT ĐỘNG</span>
                  <ArrowUpCircle className="size-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {new Intl.NumberFormat("vi-VN").format(financeStats.totalOut)} VNĐ
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Chi teabreak các buổi học, quà tặng tri ân giảng viên, in ấn giáo trình và tổ chức Gala mini.
                </p>
              </div>

              {/* Thẻ 4: Số Dư Quỹ Thực Tế */}
              <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-400">SỐ DƯ QUỸ HIỆN HỮU</span>
                  <Wallet className="size-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {new Intl.NumberFormat("vi-VN").format(financeStats.balance)} VNĐ
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Số dư an toàn, sẵn sàng phục vụ cho các buổi học tiếp theo và lễ bế giảng trao bằng.
                </p>
              </div>
            </div>

            {/* BẢNG SỔ CÁI DÒNG TIỀN QUỸ LỚP */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="size-4 text-primary" />
                    <span>Sổ Cái Dòng Tiền &amp; Báo Cáo Tài Chính Lớp CEO HN10</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ghi nhận minh bạch mọi nguồn vào/ra: Khởi tạo 20tr từ quỹ tổng, Phí phạt, Phí sự kiện, Phí chương trình training
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportFinanceExcel}
                    className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Xuất Sổ Cái Excel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsAddTxOpen(true)}
                    className="h-8 gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Ghi Nhận Thu / Chi
                  </Button>
                </div>
              </div>

              {/* Bộ lọc loại nguồn tiền */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground font-semibold">Lọc nguồn tiền:</span>
                {[
                  { key: "all", label: "Tất cả giao dịch" },
                  { key: "IN", label: "Chỉ nguồn Thu (+)" },
                  { key: "OUT", label: "Chỉ nguồn Chi (-)" },
                  { key: "penalty_fee", label: "Phí phạt nội quy" },
                  { key: "event_fee", label: "Phí sự kiện lớp" },
                  { key: "training_fee", label: "Phí chương trình training" },
                  { key: "general_fund_init", label: "Khởi tạo Quỹ Tổng (20tr)" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFinanceTypeFilter(f.key)}
                    className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                      financeTypeFilter === f.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Bảng sổ cái */}
              <div className="rounded-xl border border-border overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-muted/50 font-bold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Mã GD</th>
                      <th className="px-4 py-3">Ngày</th>
                      <th className="px-4 py-3">Nội Dung Diễn Giải</th>
                      <th className="px-4 py-3">Phân Loại Nguồn Tiền</th>
                      <th className="px-4 py-3 text-right">Số Tiền (VNĐ)</th>
                      <th className="px-4 py-3">Người Phụ Trách</th>
                      <th className="px-4 py-3 text-center">Chứng Từ</th>
                      <th className="px-4 py-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLedger.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/20 transition">
                        <td className="px-4 py-3 font-mono font-bold text-foreground">
                          {tx.code}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{tx.date}</td>
                        <td className="px-4 py-3 font-medium text-foreground max-w-sm truncate">
                          {tx.description}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.sourceType === "general_fund_init"
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : tx.sourceType === "penalty_fee"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                : tx.sourceType === "event_fee"
                                ? "bg-purple-500/10 text-purple-600"
                                : tx.sourceType === "training_fee"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-slate-500/10 text-slate-600"
                            }`}
                          >
                            {tx.sourceTypeName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-black text-sm">
                          {tx.direction === "IN" ? (
                            <span className="text-emerald-600">
                              +{new Intl.NumberFormat("vi-VN").format(tx.amount)} đ
                            </span>
                          ) : (
                            <span className="text-rose-600">
                              -{new Intl.NumberFormat("vi-VN").format(tx.amount)} đ
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{tx.personInCharge}</td>
                        <td className="px-4 py-3 text-center">
                          {tx.documentLink ? (
                            <a
                              href={tx.documentLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                            >
                              <Receipt className="size-3" /> Xem File
                            </a>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">Phiếu thu nội bộ</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 5: MÃ QR ĐIỂM DANH THEO BUỔI                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "attendance-qr" && (
          <div className="p-6 rounded-2xl border border-border bg-card space-y-5">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                <span>Quản Lý Cấu Hình Mã QR Điểm Danh Theo Buổi Học Thứ 7</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mỗi buổi học có 1 mã QR bảo mật riêng biệt. Học viên quét mã bằng App Mobile CEO HN10 để tự động ghi nhận vào sổ điểm danh điện tử.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((s) => (
                <div key={s.id} className="p-5 rounded-2xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                      Buổi #{s.sessionNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : s.status === "ongoing"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-blue-500/10 text-blue-600"
                      }`}
                    >
                      {s.status === "completed" ? "Đã xong" : s.status === "ongoing" ? "Đang diễn ra" : "Sắp tới"}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-foreground leading-snug">{s.title}</h4>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{s.date} · {s.time}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>{s.instructorName}</span>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground">
                      Đã điểm danh: <strong className="text-primary">{s.attendees}/{s.maxAttendees} HV</strong>
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setSelectedSessionForQr(s)}
                      className="h-7 gap-1 text-xs font-semibold cursor-pointer"
                    >
                      <QrCode className="h-3 w-3" /> Chiếu QR
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL CHIẾU QR ĐIỂM DANH */}
        <Dialog
          open={Boolean(selectedSessionForQr)}
          onOpenChange={(open) => !open && setSelectedSessionForQr(null)}
        >
          <DialogContent className="max-w-sm text-center">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Mã QR Điểm Danh Buổi Học
              </DialogTitle>
            </DialogHeader>
            {selectedSessionForQr && (
              <div className="space-y-4 py-2">
                <p className="text-xs font-bold text-foreground">{selectedSessionForQr.title}</p>
                <div className="text-[11px] text-muted-foreground">
                  {selectedSessionForQr.date} · {selectedSessionForQr.time} · {selectedSessionForQr.instructorName}
                </div>
                <div className="w-56 h-56 mx-auto bg-white p-3 rounded-2xl border-2 border-primary/40 shadow-md flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://ceohn10.viconnect.vn/classes/checkin?code=${selectedSessionForQr.qrCode}`}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-muted text-[11px] font-mono text-foreground flex items-center justify-between">
                  <span>Mã QR: {selectedSessionForQr.qrCode}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://ceohn10.viconnect.vn/classes/checkin?code=${selectedSessionForQr.qrCode}`);
                      toast.success("Đã sao chép link điểm danh!");
                    }}
                    className="text-primary hover:underline font-sans cursor-pointer"
                  >
                    Copy Link
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Học viên dùng Camera điện thoại hoặc App CEO HN10 quét mã này tại lớp để tự động ghi nhận vào sổ điểm danh.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* MODAL GHI NHẬN GIAO DỊCH THU / CHI QUỸ LỚP */}
        <Dialog open={isAddTxOpen} onOpenChange={setIsAddTxOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Wallet className="size-5 text-primary" />
                <span>Ghi Nhận Giao Dịch Thu / Chi Quỹ Lớp</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddTx} className="space-y-3.5 text-xs">
              <div>
                <Label className="text-xs font-semibold block mb-1">Loại Dòng Tiền:</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTxForm({ ...newTxForm, direction: "IN" })}
                    className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                      newTxForm.direction === "IN"
                        ? "bg-emerald-500 text-white border-emerald-600"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    + Thu Vào Quỹ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTxForm({ ...newTxForm, direction: "OUT" })}
                    className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                      newTxForm.direction === "OUT"
                        ? "bg-rose-500 text-white border-rose-600"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    - Chi Ra Khỏi Quỹ
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">Phân Loại Nguồn Tiền:</Label>
                <select
                  value={newTxForm.sourceType}
                  onChange={(e) => setNewTxForm({ ...newTxForm, sourceType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold outline-none"
                >
                  {newTxForm.direction === "IN" ? (
                    <>
                      <option value="penalty_fee">Phí phạt nội quy (Đi muộn / Vắng mặt)</option>
                      <option value="event_fee">Phí sự kiện lớp (Gala / Dã ngoại)</option>
                      <option value="training_fee">Phí chương trình đào tạo &amp; tài liệu</option>
                      <option value="member_fee">Quỹ học viên chính khóa</option>
                    </>
                  ) : (
                    <>
                      <option value="expense_teabreak">Chi teabreak &amp; đồ uống các buổi học</option>
                      <option value="expense_gift">Chi hoa tươi &amp; quà tặng tri ân giảng viên</option>
                      <option value="expense_materials">Chi in ấn giáo trình &amp; học liệu</option>
                      <option value="expense_event">Chi tổ chức sự kiện &amp; Gala của lớp</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">Nội Dung Diễn Giải (*):</Label>
                <Input
                  type="text"
                  required
                  value={newTxForm.description}
                  onChange={(e) => setNewTxForm({ ...newTxForm, description: e.target.value })}
                  placeholder="VD: Thu phí phạt đi muộn Buổi 3 / Chi mua hoa tri ân..."
                  className="text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">Số Tiền (VNĐ) (*):</Label>
                <Input
                  type="number"
                  required
                  min={1000}
                  step={10000}
                  value={newTxForm.amount}
                  onChange={(e) => setNewTxForm({ ...newTxForm, amount: Number(e.target.value) })}
                  className="text-xs font-bold"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">Người Phụ Trách / Kế Toán Lớp:</Label>
                <Input
                  type="text"
                  value={newTxForm.personInCharge}
                  onChange={(e) => setNewTxForm({ ...newTxForm, personInCharge: e.target.value })}
                  placeholder="Lê Hoàng Nam (Lớp Phó Tài Chính)"
                  className="text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">Link Hóa Đơn / Chứng Từ (Nếu có):</Label>
                <Input
                  type="url"
                  value={newTxForm.documentLink}
                  onChange={(e) => setNewTxForm({ ...newTxForm, documentLink: e.target.value })}
                  placeholder="https://..."
                  className="text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddTxOpen(false)}
                  className="text-xs"
                >
                  Hủy
                </Button>
                <Button type="submit" className="text-xs font-bold">
                  Ghi Nhận Giao Dịch
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL THÊM GIÁO VIÊN */}
        <Dialog open={isAddTeacherOpen} onOpenChange={setIsAddTeacherOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <GraduationCap className="size-5 text-primary" />
                <span>Thêm Giáo Viên / Chuyên Gia Mới</span>
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!teacherForm.name.trim()) return;
                setTeachers([
                  ...teachers,
                  {
                    id: `tc-${Date.now()}`,
                    name: teacherForm.name.trim(),
                    title: teacherForm.title.trim() || "Chuyên gia Đào tạo",
                    coursesCount: teacherForm.coursesCount || 1,
                    studentsCount: 95,
                    phone: teacherForm.phone.trim() || "0988000000",
                    email: teacherForm.email.trim() || "giangvien@ceohn10.vn",
                    rating: teacherForm.rating || 5.0,
                  },
                ]);
                setIsAddTeacherOpen(false);
                setTeacherForm({ name: "", title: "", phone: "", email: "", coursesCount: 1, rating: 5.0 });
                toast.success("Đã thêm giảng viên thành công!");
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <Label className="text-xs font-semibold block mb-1">Họ Và Tên Giảng Viên (*):</Label>
                <Input
                  type="text"
                  required
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  placeholder="VD: TS. Nguyễn Trí Hiếu"
                  className="text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">Danh Hiệu / Chuyên Môn:</Label>
                <Input
                  type="text"
                  value={teacherForm.title}
                  onChange={(e) => setTeacherForm({ ...teacherForm, title: e.target.value })}
                  placeholder="VD: Chuyên gia Tài chính & Ngân hàng quốc tế"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold block mb-1">Số Điện Thoại:</Label>
                  <Input
                    type="tel"
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="0903 xxx xxx"
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold block mb-1">Email:</Label>
                  <Input
                    type="email"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    placeholder="giangvien@ceohn10.vn"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddTeacherOpen(false)}
                  className="text-xs"
                >
                  Hủy
                </Button>
                <Button type="submit" className="text-xs font-bold">
                  Lưu Giảng Viên
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL THÊM BUỔI HỌC (BÙ / TRAINING CHUYÊN SÂU / NGOẠI KHÓA DOANH NGHIỆP) */}
        <Dialog open={isAddSessionOpen} onOpenChange={setIsAddSessionOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                <span>Thêm Buổi Học (Học Bù / Training / Ngoại Khóa)</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Tạo buổi học bổ sung ngoài 30 chuyên đề chuẩn CEO HN10 cho học viên
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSession} className="space-y-3.5 text-xs">
              <div>
                <Label className="text-xs font-semibold block mb-1">Loại Buổi Học (*):</Label>
                <select
                  value={sessionForm.sessionType}
                  onChange={(e) => setSessionForm({ ...sessionForm, sessionType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary"
                >
                  <option value="makeup">Buổi Học Bù (Makeup Class)</option>
                  <option value="training">Training Chuyên Sâu (Deep Dive Training)</option>
                  <option value="field_trip">Ngoại Khóa Doanh Nghiệp (Business Tour & Field Trip)</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">Tiêu Đề Buổi Học (*):</Label>
                <Input
                  type="text"
                  required
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  placeholder="VD: Workshop: Tối ưu chi phí thuế & Bảo vệ tài sản chủ doanh nghiệp 2026"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold block mb-1">Giảng Viên / Chuyên Gia:</Label>
                  <Input
                    type="text"
                    value={sessionForm.instructorName}
                    onChange={(e) => setSessionForm({ ...sessionForm, instructorName: e.target.value })}
                    placeholder="VD: Chuyên gia Trần Đình Triều"
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold block mb-1">Ngày Diễn Ra (*):</Label>
                  <Input
                    type="text"
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                    placeholder="VD: Thứ 7, 28/11/2026"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold block mb-1">Khung Giờ:</Label>
                  <Input
                    type="text"
                    value={sessionForm.time}
                    onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })}
                    placeholder="VD: 08:30 - 11:30"
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold block mb-1">Sức Chứa Tối Đa:</Label>
                  <Input
                    type="number"
                    value={sessionForm.maxAttendees}
                    onChange={(e) => setSessionForm({ ...sessionForm, maxAttendees: Number(e.target.value) || 95 })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">Địa Điểm Học:</Label>
                <Input
                  type="text"
                  value={sessionForm.location}
                  onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                  placeholder="VD: Hội trường Tầng 3 - Trụ sở CLB CEO HN10 & Hybrid Zoom"
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddSessionOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Hủy
                </Button>
                <Button type="submit" className="text-xs font-bold cursor-pointer bg-primary text-primary-foreground">
                  Lưu Buổi Học Mới
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL CHỈNH SỬA BUỔI HỌC */}
        <Dialog open={isEditSessionOpen} onOpenChange={setIsEditSessionOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Pencil className="size-4 text-primary" />
                <span>Chỉnh Sửa Buổi Học #{editingSession?.sessionNumber}</span>
              </DialogTitle>
            </DialogHeader>

            {editingSession && (
              <form onSubmit={handleSaveEditSession} className="space-y-3.5 text-xs">
                <div>
                  <Label className="text-xs font-semibold block mb-1">Tiêu Đề Buổi Học (*):</Label>
                  <Input
                    type="text"
                    required
                    value={editingSession.title}
                    onChange={(e) => setEditingSession({ ...editingSession, title: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Giảng Viên / Chuyên Gia:</Label>
                    <Input
                      type="text"
                      value={editingSession.instructorName}
                      onChange={(e) => setEditingSession({ ...editingSession, instructorName: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Trạng Thái:</Label>
                    <select
                      value={editingSession.status}
                      onChange={(e) => setEditingSession({ ...editingSession, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold outline-none"
                    >
                      <option value="upcoming">Sắp tới</option>
                      <option value="ongoing">Đang diễn ra</option>
                      <option value="completed">Đã hoàn thành</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Ngày Diễn Ra:</Label>
                    <Input
                      type="text"
                      value={editingSession.date}
                      onChange={(e) => setEditingSession({ ...editingSession, date: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Khung Giờ:</Label>
                    <Input
                      type="text"
                      value={editingSession.time}
                      onChange={(e) => setEditingSession({ ...editingSession, time: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Sĩ Số Đã Đến:</Label>
                    <Input
                      type="number"
                      value={editingSession.attendees}
                      onChange={(e) => setEditingSession({ ...editingSession, attendees: Number(e.target.value) || 0 })}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Sức Chứa Tối Đa:</Label>
                    <Input
                      type="number"
                      value={editingSession.maxAttendees}
                      onChange={(e) => setEditingSession({ ...editingSession, maxAttendees: Number(e.target.value) || 95 })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold block mb-1">Địa Điểm Học:</Label>
                  <Input
                    type="text"
                    value={editingSession.location}
                    onChange={(e) => setEditingSession({ ...editingSession, location: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditSessionOpen(false)}
                    className="text-xs cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button type="submit" className="text-xs font-bold cursor-pointer bg-primary text-primary-foreground">
                    Cập Nhật Buổi Học
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* MODAL CHỈNH SỬA GIẢNG VIÊN */}
        <Dialog open={isEditTeacherOpen} onOpenChange={setIsEditTeacherOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Pencil className="size-4 text-primary" />
                <span>Chỉnh Sửa Giảng Viên / Chuyên Gia</span>
              </DialogTitle>
            </DialogHeader>

            {editingTeacher && (
              <form onSubmit={handleSaveEditTeacher} className="space-y-3 text-xs">
                <div>
                  <Label className="text-xs font-semibold block mb-1">Họ Và Tên Giảng Viên (*):</Label>
                  <Input
                    type="text"
                    required
                    value={editingTeacher.name}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold block mb-1">Danh Hiệu / Chuyên Môn:</Label>
                  <Input
                    type="text"
                    value={editingTeacher.title}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, title: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Số Điện Thoại:</Label>
                    <Input
                      type="tel"
                      value={editingTeacher.phone}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Email:</Label>
                    <Input
                      type="email"
                      value={editingTeacher.email}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Số Lớp Phụ Trách:</Label>
                    <Input
                      type="number"
                      value={editingTeacher.coursesCount}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, coursesCount: Number(e.target.value) || 1 })}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Đánh Giá (Sao):</Label>
                    <Input
                      type="number"
                      step={0.1}
                      min={1}
                      max={5}
                      value={editingTeacher.rating}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, rating: Number(e.target.value) || 5.0 })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditTeacherOpen(false)}
                    className="text-xs"
                  >
                    Hủy
                  </Button>
                  <Button type="submit" className="text-xs font-bold bg-primary text-primary-foreground">
                    Cập Nhật Giảng Viên
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* MODAL THÊM HỌC VIÊN VÀO LỚP */}
        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <UserPlus className="size-4 text-primary" />
                <span>Thêm Học Viên Mới Vào Lớp CEO HN10</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold block mb-1">Mã Học Viên:</Label>
                  <Input
                    type="text"
                    value={newStudentForm.code}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, code: e.target.value })}
                    placeholder="VD: HN10-098"
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold block mb-1">Họ Và Tên (*):</Label>
                  <Input
                    type="text"
                    required
                    value={newStudentForm.fullName}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, fullName: e.target.value })}
                    placeholder="VD: Phạm Hoàng Sơn"
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">Tên Doanh Nghiệp:</Label>
                <Input
                  type="text"
                  value={newStudentForm.company}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, company: e.target.value })}
                  placeholder="VD: Công Ty CP Công Nghệ & Thương Mại Sơn Hà"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold block mb-1">Chức Vụ Doanh Nghiệp:</Label>
                  <Input
                    type="text"
                    value={newStudentForm.position}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, position: e.target.value })}
                    placeholder="Chủ tịch HĐQT / CEO"
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold block mb-1">Chức Danh Trong Lớp:</Label>
                  <select
                    value={newStudentForm.classRole}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, classRole: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold outline-none"
                  >
                    <option value="Học Viên Chính Thức">Học Viên Chính Thức</option>
                    <option value="Lớp Trưởng">Lớp Trưởng</option>
                    <option value="Lớp Phó Học Tập">Lớp Phó Học Tập</option>
                    <option value="Lớp Phó Tài Chính">Lớp Phó Tài Chính</option>
                    <option value="Lớp Phó Sự Kiện">Lớp Phó Sự Kiện</option>
                    <option value="Học Viên Dự Thính">Học Viên Dự Thính</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold block mb-1">Số Điện Thoại:</Label>
                  <Input
                    type="tel"
                    value={newStudentForm.phone}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                    placeholder="0988 xxx xxx"
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold block mb-1">Email:</Label>
                  <Input
                    type="email"
                    value={newStudentForm.email}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                    placeholder="son.pham@sonha.vn"
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">Trạng Thái Đóng Quỹ Lớp (2tr):</Label>
                <select
                  value={newStudentForm.classFundStatus}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, classFundStatus: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold outline-none"
                >
                  <option value="Đã nộp (2.000.000đ)">Đã nộp (2.000.000đ)</option>
                  <option value="Chưa nộp">Chưa nộp</option>
                  <option value="Miễn giảm">Miễn giảm</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Hủy
                </Button>
                <Button type="submit" className="text-xs font-bold cursor-pointer bg-primary text-primary-foreground">
                  Lưu Học Viên
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL CHỈNH SỬA HỌC VIÊN */}
        <Dialog open={isEditStudentOpen} onOpenChange={setIsEditStudentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Pencil className="size-4 text-primary" />
                <span>Chỉnh Sửa Học Viên ({editingStudent?.code})</span>
              </DialogTitle>
            </DialogHeader>

            {editingStudent && (
              <form onSubmit={handleSaveEditStudent} className="space-y-3 text-xs">
                <div>
                  <Label className="text-xs font-semibold block mb-1">Họ Và Tên (*):</Label>
                  <Input
                    type="text"
                    required
                    value={editingStudent.fullName}
                    onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                    className="text-xs font-bold"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold block mb-1">Tên Doanh Nghiệp:</Label>
                  <Input
                    type="text"
                    value={editingStudent.company}
                    onChange={(e) => setEditingStudent({ ...editingStudent, company: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Chức Vụ DN:</Label>
                    <Input
                      type="text"
                      value={editingStudent.position}
                      onChange={(e) => setEditingStudent({ ...editingStudent, position: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Chức Danh Lớp:</Label>
                    <Input
                      type="text"
                      value={editingStudent.classRole}
                      onChange={(e) => setEditingStudent({ ...editingStudent, classRole: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Số Điện Thoại:</Label>
                    <Input
                      type="tel"
                      value={editingStudent.phone}
                      onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Email:</Label>
                    <Input
                      type="email"
                      value={editingStudent.email}
                      onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Quỹ Lớp (2tr):</Label>
                    <select
                      value={editingStudent.classFundStatus}
                      onChange={(e) => setEditingStudent({ ...editingStudent, classFundStatus: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold outline-none"
                    >
                      <option value="Đã nộp (2.000.000đ)">Đã nộp (2.000.000đ)</option>
                      <option value="Chưa nộp">Chưa nộp</option>
                      <option value="Miễn giảm">Miễn giảm</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold block mb-1">Nợ Quỹ Phạt (VNĐ):</Label>
                    <Input
                      type="number"
                      value={editingStudent.penaltyDebt}
                      onChange={(e) => setEditingStudent({ ...editingStudent, penaltyDebt: Number(e.target.value) || 0 })}
                      className="text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditStudentOpen(false)}
                    className="text-xs cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button type="submit" className="text-xs font-bold cursor-pointer bg-primary text-primary-foreground">
                    Cập Nhật Học Viên
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
