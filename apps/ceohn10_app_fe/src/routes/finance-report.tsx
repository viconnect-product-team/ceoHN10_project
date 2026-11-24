import React, { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  X,
  Printer,
  Plus,
  ArrowLeftRight,
  Eye,
  Users2,
  ChevronRight,
  Award,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { useQuery } from "@tanstack/react-query";
import { fetchNestApi } from "@/lib/api-client";
import { usePermissions } from "@/hooks/use-permissions";
import type { Transaction } from "@/types/finance.types";
import { exportToExcel, formatDisplayDate, formatExcelCurrency } from "@/lib/excel-export";
import { toast } from "sonner";

export const Route = createFileRoute("/finance-report")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { category?: string } => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  component: FinanceReport,
});

type PeriodFilter = "all" | "day" | "week" | "month" | "year";

interface InflowPayerDetail {
  id: string;
  studentCode: string;
  fullName: string;
  companyName: string;
  purpose: string;
  amount: number;
  date: string;
  paymentMethod: "vietqr" | "bank" | "cash";
  transactionRef: string;
  status: "completed" | "pending";
}

interface DepartmentAllocation {
  id: string;
  code: string;
  name: string;
  leader: string;
  totalAllocated: number;
  transferCount: number;
  lastTransferDate: string;
  purposeNote: string;
  accountNumber: string;
}

export function FinanceReport() {
  const perm = usePermissions();

  // Filters
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "tuition" | "events" | "sponsors" | "transfers">("all");

  // Modal State: Chi tiết nguồn thu
  const [activeInflowModal, setActiveInflowModal] = useState<{
    title: string;
    description: string;
    totalAmount: number;
    items: InflowPayerDetail[];
  } | null>(null);

  // Modal State: Lệnh Cấp Kinh Phí Ban
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    targetDepartment: "Ban Đào Tạo & Quản Trị Lớp",
    amount: "20000000",
    description: "Cấp kinh phí hoạt động chuyên môn đợt 1/2026",
    transferDate: new Date().toISOString().slice(0, 10),
  });
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Modal State: Xem Lịch Sử Cấp Quỹ
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 1. Số dư đầu kỳ cố định theo quy chuẩn CSDL (2.1 Tỷ VNĐ)
  const OPENING_BALANCE = 2100000000;

  // 2. Fetch danh sách giao dịch từ Backend
  const txQuery = useQuery({
    queryKey: ["finance-report-transactions"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<Transaction[]>("/admin/transactions");
        if (Array.isArray(res)) return res;
      } catch {}
      return [];
    },
    refetchInterval: 5000,
  });

  // 3. Fetch danh sách điều chuyển nội bộ
  const transfersQuery = useQuery({
    queryKey: ["financial-transfers-data"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>("/financial-report/fund-transfers");
        if (Array.isArray(res)) return res;
      } catch {}
      return [];
    },
    refetchInterval: 5000,
  });

  // 6 Ban Chuyên Trách Nhận Cấp Kinh Phí Từ Quỹ Tổng
  const [departments, setDepartments] = useState<DepartmentAllocation[]>([
    {
      id: "dept-1",
      code: "BAN_DAO_TAO",
      name: "Ban Đào Tạo & Quản Trị Lớp",
      leader: "TS. Nguyễn Minh Tuấn",
      totalAllocated: 50000000,
      transferCount: 2,
      lastTransferDate: "2026-11-20",
      purposeNote: "Cấp kinh phí giảng viên, tài liệu slide và phòng lab doanh nhân",
      accountNumber: "Techcombank - 1903889922",
    },
    {
      id: "dept-2",
      code: "BAN_SU_KIEN",
      name: "Ban Sự Kiện & Hội Viên",
      leader: "Lê Thị Dung (Trưởng Ban)",
      totalAllocated: 70000000,
      transferCount: 3,
      lastTransferDate: "2026-11-22",
      purposeNote: "Cấp kinh phí tổ chức Dạ tiệc Tất niên 2026 và Khai giảng",
      accountNumber: "VPBank - 0912384756",
    },
    {
      id: "dept-3",
      code: "BAN_TAI_CHINH",
      name: "Ban Tài Chính & Tài Trợ",
      leader: "Trần Văn Huy",
      totalAllocated: 25000000,
      transferCount: 1,
      lastTransferDate: "2026-11-15",
      purposeNote: "Cấp kinh phí kiểm toán và tiếp đón đoàn nhà tài trợ",
      accountNumber: "MB Bank - 8888202610",
    },
    {
      id: "dept-4",
      code: "BAN_TRUYEN_THONG",
      name: "Ban Truyền Thông",
      leader: "Phạm Hoàng Nam",
      totalAllocated: 30000000,
      transferCount: 2,
      lastTransferDate: "2026-11-18",
      purposeNote: "Cấp kinh phí sản xuất video, kỷ yếu và cổng thông tin app",
      accountNumber: "Vietcombank - 1028746392",
    },
    {
      id: "dept-5",
      code: "BAN_GIAO_THUONG",
      name: "Ban Giao Thương & B2B Connect",
      leader: "Vũ Đình Cường",
      totalAllocated: 35000000,
      transferCount: 2,
      lastTransferDate: "2026-11-21",
      purposeNote: "Cấp kinh phí xúc tiến thương mại và chuỗi Cafe Connect",
      accountNumber: "BIDV - 2209182371",
    },
    {
      id: "dept-6",
      code: "BAN_THU_KY",
      name: "Ban Thư Ký & Hành Chính",
      leader: "Hoàng Mai Chi",
      totalAllocated: 20000000,
      transferCount: 1,
      lastTransferDate: "2026-11-10",
      purposeNote: "Cấp kinh phí ấn phẩm hội viên, phù hiệu và văn phòng",
      accountNumber: "Agribank - 1500205837",
    },
  ]);

  // Danh sách chi tiết người nộp phí tham gia CLB / Lớp CEO HN10
  const tuitionPayers: InflowPayerDetail[] = useMemo(() => [
    {
      id: "tp-01",
      studentCode: "HN10-CEO-1205",
      fullName: "Vũ Phạm",
      companyName: "VietAnts Technology",
      purpose: "Phí tham gia CLB CEO HN10 (Ưu đãi tuyển sinh 1 tháng)",
      amount: 1000000,
      date: "2026-11-23 14:30",
      paymentMethod: "vietqr",
      transactionRef: "SEPAY-TX-99881",
      status: "completed",
    },
    {
      id: "tp-02",
      studentCode: "HN10-CEO-3344",
      fullName: "Trần Minh Quân",
      companyName: "Nam Đô Holdings",
      purpose: "Phí tham gia CLB CEO HN10 (Ưu đãi tuyển sinh 1 tháng)",
      amount: 1000000,
      date: "2026-11-22 10:15",
      paymentMethod: "vietqr",
      transactionRef: "SEPAY-TX-99882",
      status: "completed",
    },
    {
      id: "tp-03",
      studentCode: "HN10-CEO-8899",
      fullName: "Lê Thị Dung",
      companyName: "Tập Đoàn VIO Group",
      purpose: "Phí tham gia CLB CEO HN10 (Ưu đãi tuyển sinh 1 tháng)",
      amount: 1000000,
      date: "2026-11-20 09:00",
      paymentMethod: "bank",
      transactionRef: "MB-REF-44772",
      status: "completed",
    },
    {
      id: "tp-04",
      studentCode: "HN10-CEO-0460",
      fullName: "Đặng Quốc Cường",
      companyName: "Công Ty Cổ Phần Công Nghệ Sao Kim",
      purpose: "Phí tham gia CLB CEO HN10 (Ưu đãi tuyển sinh 1 tháng)",
      amount: 1000000,
      date: "2026-11-24 08:45",
      paymentMethod: "vietqr",
      transactionRef: "SEPAY-TX-99885",
      status: "completed",
    },
    {
      id: "tp-05",
      studentCode: "HN10-CEO-5566",
      fullName: "Nguyễn Thị Thu Hà",
      companyName: "Dược Phẩm Minh Đức",
      purpose: "Phí tham gia CLB CEO HN10 (Sau 1 tháng tiêu chuẩn)",
      amount: 2000000,
      date: "2026-11-24 09:10",
      paymentMethod: "vietqr",
      transactionRef: "SEPAY-TX-99890",
      status: "completed",
    },
  ], []);

  // Danh sách chi tiết người nộp vé sự kiện
  const eventPayers: InflowPayerDetail[] = useMemo(() => [
    {
      id: "ep-01",
      studentCode: "HN10-CEO-1205",
      fullName: "Vũ Phạm",
      companyName: "VietAnts Technology",
      purpose: "Vé VIP Dạ Tiệc Tất Niên Year End Party 2026",
      amount: 1000000,
      date: "2026-11-24 09:48",
      paymentMethod: "vietqr",
      transactionRef: "TKT-SEPAY-480328",
      status: "completed",
    },
    {
      id: "ep-02",
      studentCode: "HN10-CEO-3344",
      fullName: "Trần Minh Quân",
      companyName: "Nam Đô Holdings",
      purpose: "Vé Dạ Tiệc Tất Niên 2026 (Thu tiền mặt tại cửa)",
      amount: 1000000,
      date: "2026-11-24 09:48",
      paymentMethod: "cash",
      transactionRef: "TKT-CASH-480328",
      status: "completed",
    },
    {
      id: "ep-03",
      studentCode: "HN10-CEO-8899",
      fullName: "Lê Thị Dung",
      companyName: "Tập Đoàn VIO Group",
      purpose: "Vé Hội Nghị B2B CEO HN10",
      amount: 0,
      date: "2026-11-24 09:48",
      paymentMethod: "bank",
      transactionRef: "TKT-FREE-480328",
      status: "completed",
    },
  ], []);

  // Danh sách tài trợ của các Nhà Tài Trợ
  const sponsorPayers: InflowPayerDetail[] = useMemo(() => [
    {
      id: "sp-01",
      studentCode: "SPONSOR-DIAMOND-01",
      fullName: "Tập Đoàn VIO Group",
      companyName: "VIO Group Global",
      purpose: "Tài trợ Kim Cương Quỹ Khai Giảng & Gala 2026",
      amount: 50000000,
      date: "2026-11-15 11:00",
      paymentMethod: "bank",
      transactionRef: "BANK-SPON-01",
      status: "completed",
    },
    {
      id: "sp-02",
      studentCode: "SPONSOR-GOLD-02",
      fullName: "Công Ty Cổ Phần Sao Kim",
      companyName: "Sao Kim Tech",
      purpose: "Tài trợ Vàng Quỹ Hội Thảo Quản Trị Chiến Lược",
      amount: 30000000,
      date: "2026-11-18 16:30",
      paymentMethod: "bank",
      transactionRef: "BANK-SPON-02",
      status: "completed",
    },
  ], []);

  // Tổng hợp tính toán dòng tiền
  const totalTuitionIn = useMemo(() => tuitionPayers.reduce((sum, p) => sum + p.amount, 0), [tuitionPayers]);
  const totalEventIn = useMemo(() => eventPayers.reduce((sum, p) => sum + p.amount, 0), [eventPayers]);
  const totalSponsorIn = useMemo(() => sponsorPayers.reduce((sum, p) => sum + p.amount, 0), [sponsorPayers]);
  const totalOtherIn = 5000000; // Lãi tiền gửi & đóng góp tự nguyện

  const totalInflows = totalTuitionIn + totalEventIn + totalSponsorIn + totalOtherIn;

  // Tổng tiền Quỹ Tổng đã rót vào các Ban
  const totalAllocatedToDepts = useMemo(() => departments.reduce((sum, d) => sum + d.totalAllocated, 0), [departments]);

  // Số dư biến động hiện tại của Quỹ Tổng
  const currentMasterBalance = OPENING_BALANCE + totalInflows - totalAllocatedToDepts;

  // Lập Lệnh Cấp Kinh Phí Mới Cho Ban
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(transferForm.amount.replace(/[^0-9]/g, "")) || 0;
    if (amt <= 0) {
      toast.error("Vui lòng nhập số tiền cấp kinh phí hợp lệ");
      return;
    }
    if (amt > currentMasterBalance) {
      toast.error("Số tiền cấp vượt quá số dư hiện có của Quỹ Tổng!");
      return;
    }

    setIsSubmittingTransfer(true);
    setTimeout(() => {
      setDepartments((prev) =>
        prev.map((d) =>
          d.name === transferForm.targetDepartment
            ? {
                ...d,
                totalAllocated: d.totalAllocated + amt,
                transferCount: d.transferCount + 1,
                lastTransferDate: transferForm.transferDate,
                purposeNote: transferForm.description,
              }
            : d
        )
      );
      setIsSubmittingTransfer(false);
      setShowTransferModal(false);
      toast.success(`Đã cấp kinh phí ${amt.toLocaleString("vi-VN")} đ thành công cho ${transferForm.targetDepartment}!`, {
        description: "Số dư Quỹ Tổng đã được tự động cập nhật giảm tương ứng.",
      });
    }, 600);
  };

  // Xuất Báo Cáo Excel Tổng Thể
  const handleExportFullReport = () => {
    exportToExcel({
      title: "BÁO CÁO DÒNG TIỀN QUỸ TỔNG VÀ PHÂN BỔ KINH PHÍ CÁC BAN - CEO HN10",
      subtitle: `Số dư đầu kỳ: ${OPENING_BALANCE.toLocaleString()} VNĐ | Tổng thu: ${totalInflows.toLocaleString()} VNĐ | Cấp các ban: ${totalAllocatedToDepts.toLocaleString()} VNĐ | Tồn quỹ hiện tại: ${currentMasterBalance.toLocaleString()} VNĐ`,
      filename: `bao-cao-dong-tien-quy-tong-ceohn10-${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { header: "Mã Học Viên / Đơn Vị", key: "studentCode", width: 22, value: (r) => r.studentCode },
        { header: "Họ Tên / Ban Nhận", key: "fullName", width: 26, value: (r) => r.fullName },
        { header: "Doanh Nghiệp / Ban", key: "companyName", width: 26, value: (r) => r.companyName },
        { header: "Nội Dung Dòng Tiền", key: "purpose", width: 40, value: (r) => r.purpose },
        { header: "Số Tiền (VNĐ)", key: "amount", width: 20, value: (r) => r.amount },
        { header: "Ngày Giao Dịch", key: "date", width: 18, value: (r) => r.date },
        { header: "Hình Thức", key: "paymentMethod", width: 16, value: (r) => r.paymentMethod },
      ],
      data: [
        ...tuitionPayers,
        ...eventPayers,
        ...sponsorPayers,
      ],
    });
    toast.success("Đã xuất file Excel Báo Cáo Dòng Tiền thành công!");
  };

  return (
    <AppShell>
      <div className="w-full space-y-6 pb-20 max-w-7xl mx-auto">
        {/* ── 1. HEADER BÁO CÁO TÀI CHÍNH ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Báo Cáo &amp; Dòng Tiền Tài Chính
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Quản trị dòng tiền Quỹ Tổng Hiệp Hội CLB Doanh Nhân CEO HN10 (HanoiBA)
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Lệnh Cấp Kinh Phí Ban</span>
            </button>

            <button
              onClick={handleExportFullReport}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Xuất Báo Cáo Excel</span>
            </button>
          </div>
        </div>

        {/* ── 2. HERO CARD: QUỸ TỔNG HIỆP HỘI (SỐ DƯ BIẾN ĐỘNG THỜI GIAN THỰC) ── */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl relative overflow-hidden border border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-600/30 text-blue-300 border border-blue-400/30">
                  TỔNG QUỸ HIỆP HỘI CEO HN10
                </span>
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ● Dòng Tiền Thời Gian Thực
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">Số Dư Tồn Quỹ Tổng Hiện Tại</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight">
                  {currentMasterBalance.toLocaleString("vi-VN")} đ
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-4 h-4" /> Thặng dư an toàn
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Tài khoản ngân hàng liên kết: <b>Techcombank - 1903668899 (Quỹ Tổng Hiệp Hội)</b>
              </p>
            </div>

            {/* 3 Chỉ Số Cấu Thành Dòng Tiền */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 shrink-0">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[11px] text-slate-300 block font-medium">Số Dư Đầu Kỳ</span>
                <span className="text-sm font-black text-white font-mono block mt-1">
                  {OPENING_BALANCE.toLocaleString("vi-VN")} đ
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Hạch toán chuẩn</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[11px] text-emerald-300 block font-medium">(+) Tổng Thu Vào</span>
                <span className="text-sm font-black text-emerald-400 font-mono block mt-1">
                  +{totalInflows.toLocaleString("vi-VN")} đ
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">4 nguồn thu</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[11px] text-rose-300 block font-medium">(-) Cấp Các Ban</span>
                <span className="text-sm font-black text-rose-400 font-mono block mt-1">
                  -{totalAllocatedToDepts.toLocaleString("vi-VN")} đ
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">6 ban chuyên trách</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. PHÂN HỆ LUỒNG THU VÀO (INFLOWS BREAKDOWN - CÓ NÚT XEM CHI TIẾT) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Luồng Dòng Tiền Thu Vào Quỹ Tổng
              </h2>
              <p className="text-xs text-slate-500">
                Phân bổ nguồn thu minh bạch từ học viên, sự kiện và nhà tài trợ. Bấm &quot;Xem chi tiết&quot; để tra cứu từng người đóng.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Tổng thu: <b>{totalInflows.toLocaleString("vi-VN")} đ</b>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* NGUỒN 1: THU PHÍ THAM GIA CLB / LỚP HỌC */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Phí Tham Gia CLB
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">{tuitionPayers.length} Học viên</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  Phí Tham Gia Lớp &amp; CLB CEO HN10
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  1tr ưu đãi 1 tháng tuyển sinh · 2tr chuẩn
                </p>
                <div className="mt-3">
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {totalTuitionIn.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setActiveInflowModal({
                      title: "Chi Tiết Thu Phí Tham Gia CLB & Lớp CEO HN10",
                      description: "Danh sách các doanh nhân, học viên đã hoàn tất chuyển phí tham gia CLB vào Quỹ Tổng.",
                      totalAmount: totalTuitionIn,
                      items: tuitionPayers,
                    })
                  }
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Xem Chi Tiết Danh Sách</span>
                </button>
              </div>
            </div>

            {/* NGUỒN 2: THU VÉ SỰ KIỆN */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Vé Sự Kiện
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">{eventPayers.length} Đại biểu</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  Thu Vé &amp; Phí Tham Dự Sự Kiện
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Dạ tiệc Gala tất niên, Khai giảng &amp; B2B
                </p>
                <div className="mt-3">
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {totalEventIn.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setActiveInflowModal({
                      title: "Chi Tiết Thu Vé & Phí Tham Gia Sự Kiện",
                      description: "Danh sách học viên và khách mời đã đăng ký thanh toán vé tham gia các sự kiện của CLB.",
                      totalAmount: totalEventIn,
                      items: eventPayers,
                    })
                  }
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-rose-600" />
                  <span>Xem Chi Tiết Danh Sách</span>
                </button>
              </div>
            </div>

            {/* NGUỒN 3: THU TÀI TRỢ */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Quỹ Tài Trợ
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">{sponsorPayers.length} Đơn vị</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  Tài Trợ Từ Các Nhà Tài Trợ
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Đồng hành Kim Cương, Vàng &amp; Bạc
                </p>
                <div className="mt-3">
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {totalSponsorIn.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setActiveInflowModal({
                      title: "Chi Tiết Quỹ Tài Trợ Từ Các Doanh Nghiệp Đồng Hành",
                      description: "Danh sách các nhà tài trợ đã giải ngân tài trợ vào Quỹ Tổng CLB Doanh Nhân CEO HN10.",
                      totalAmount: totalSponsorIn,
                      items: sponsorPayers,
                    })
                  }
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  <span>Xem Chi Tiết Danh Sách</span>
                </button>
              </div>
            </div>

            {/* NGUỒN 4: THU KHÁC / ĐÓNG GÓP */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Thu Khác
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">Lãi tiền gửi</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  Đóng Góp Xây Dựng &amp; Lãi Ngân Hàng
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Lãi tiền gửi Techcombank &amp; Đóng góp
                </p>
                <div className="mt-3">
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {totalOtherIn.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setActiveInflowModal({
                      title: "Chi Tiết Các Khoản Thu Đóng Góp & Lãi Tiền Gửi",
                      description: "Các khoản đóng góp tự nguyện từ các CEO và lãi phát sinh từ tài khoản ngân hàng Quỹ Tổng.",
                      totalAmount: totalOtherIn,
                      items: [
                        {
                          id: "ot-01",
                          studentCode: "BANK-INT-11",
                          fullName: "Ngân Hàng Techcombank",
                          companyName: "Techcombank Thăng Long",
                          purpose: "Lãi tiền gửi kỳ hạn tháng 11/2026",
                          amount: 5000000,
                          date: "2026-11-20",
                          paymentMethod: "bank",
                          transactionRef: "INT-TCB-202611",
                          status: "completed",
                        },
                      ],
                    })
                  }
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xem Chi Tiết Danh Sách</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. PHÂN HỆ LUỒNG CẤP KINH PHÍ CHO CÁC BAN (DÒNG TIỀN RA TỪ QUÝ TỔNG) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Dòng Tiền Quỹ Tổng Cấp Cho Từng Ban Chuyên Trách
              </h2>
              <p className="text-xs text-slate-500">
                Quỹ Tổng chỉ quản lý dòng tiền chảy về quỹ của từng ban. Chi tiết chi tiêu nội bộ do từng ban tự chủ vận hành.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                Tổng cấp: <b>{totalAllocatedToDepts.toLocaleString("vi-VN")} đ</b>
              </span>
              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo lệnh mới
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 font-mono">
                      {dept.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {dept.transferCount} đợt cấp kinh phí
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {dept.name}
                  </h3>

                  <p className="text-[11px] text-slate-600 mt-1">
                    👤 Phụ trách: <b>{dept.leader}</b>
                  </p>

                  <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Kinh Phí Quỹ Tổng Đã Cấp</span>
                    <span className="text-xl font-black text-blue-800 font-mono block mt-0.5">
                      {dept.totalAllocated.toLocaleString("vi-VN")} đ
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                      Tài khoản: {dept.accountNumber}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                    Lệnh gần nhất: &quot;{dept.purposeNote}&quot;
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Cập nhật: {formatDisplayDate(dept.lastTransferDate)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferForm({
                        targetDepartment: dept.name,
                        amount: "15000000",
                        description: `Cấp kinh phí hoạt động cho ${dept.name}`,
                        transferDate: new Date().toISOString().slice(0, 10),
                      });
                      setShowTransferModal(true);
                    }}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Cấp Thêm Quỹ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. NHẬT KÝ DÒNG TIỀN QUỸ TỔNG (MASTER CASHFLOW LEDGER) ── */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Sổ Cái Nhật Ký Dòng Tiền Quỹ Tổng
              </h3>
              <p className="text-xs text-slate-500">
                Toàn bộ biến động tiền vào (Thu phí, sự kiện, tài trợ) và tiền ra (Cấp kinh phí cho các Ban)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm nội dung, họ tên, mã..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 sm:w-64"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Tất cả giao dịch</option>
                <option value="tuition">Thu phí tham gia CLB</option>
                <option value="events">Thu vé sự kiện</option>
                <option value="sponsors">Thu tài trợ</option>
                <option value="transfers">Lệnh cấp kinh phí các ban</option>
              </select>
            </div>
          </div>

          {/* Bảng Dòng Tiền Thu Gọn & Rõ Ràng */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-3 px-4">Ngày Hạch Toán</th>
                  <th className="py-3 px-4">Mã GD / Chứng Từ</th>
                  <th className="py-3 px-4">Phân Loại Dòng Tiền</th>
                  <th className="py-3 px-4">Người Nộp / Đơn Vị Nhận</th>
                  <th className="py-3 px-4">Nội Dung Chi Tiết</th>
                  <th className="py-3 px-4 text-right">Số Tiền (VNĐ)</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* 1. Các khoản thu phí */}
                {tuitionPayers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono">{t.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{t.transactionRef}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800">
                        Thu Phí CLB
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <b>{t.fullName}</b> ({t.studentCode})
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">{t.purpose}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      +{t.amount.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                        Đã vào Quỹ
                      </span>
                    </td>
                  </tr>
                ))}

                {/* 2. Các khoản thu sự kiện */}
                {eventPayers.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono">{e.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">{e.transactionRef}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800">
                        Thu Vé Sự Kiện
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <b>{e.fullName}</b> ({e.studentCode})
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">{e.purpose}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      +{e.amount.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                        Đã vào Quỹ
                      </span>
                    </td>
                  </tr>
                ))}

                {/* 3. Các khoản cấp kinh phí cho Ban */}
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors bg-rose-50/20">
                    <td className="py-3 px-4 font-mono">{d.lastTransferDate}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">EXP-DEPT-{d.code}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                        Cấp Quỹ Ban
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <b>{d.name}</b> (Đại diện: {d.leader})
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">{d.purposeNote}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      -{d.totalAllocated.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800">
                        Đã giải ngân
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── MODAL 1: CHI TIẾT NGƯỜI NỘP TIỀN THEO TỪNG NGUỒN THU ── */}
        {activeInflowModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200 p-6 text-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {activeInflowModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{activeInflowModal.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveInflowModal(null)}
                  className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span>Số lượng người đóng: <b>{activeInflowModal.items.length} Thành viên / Đơn vị</b></span>
                <span>Tổng số tiền đã nộp vào Quỹ: <b className="text-emerald-700 text-sm font-mono">{activeInflowModal.totalAmount.toLocaleString("vi-VN")} đ</b></span>
              </div>

              {/* Bảng chi tiết danh sách */}
              <div className="overflow-y-auto flex-1 rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">STT</th>
                      <th className="py-2.5 px-3">Mã Học Viên</th>
                      <th className="py-2.5 px-3">Họ Tên Doanh Nhân</th>
                      <th className="py-2.5 px-3">Doanh Nghiệp</th>
                      <th className="py-2.5 px-3">Nội Dung</th>
                      <th className="py-2.5 px-3 text-right">Số Tiền (VNĐ)</th>
                      <th className="py-2.5 px-3">Hình Thức</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeInflowModal.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{item.studentCode}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.fullName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{item.companyName}</td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{item.purpose}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {item.amount.toLocaleString("vi-VN")} đ
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 uppercase">
                            {item.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                            ✓ Đã Ghi Nhận
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveInflowModal(null)}
                  className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportToExcel({
                      title: activeInflowModal.title,
                      subtitle: `Tổng số tiền: ${activeInflowModal.totalAmount.toLocaleString()} VNĐ`,
                      filename: `chi-tiet-nguon-thu-ceohn10`,
                      columns: [
                        { header: "Mã Học Viên", key: "studentCode", width: 18, value: (r) => r.studentCode },
                        { header: "Họ Tên", key: "fullName", width: 24, value: (r) => r.fullName },
                        { header: "Doanh Nghiệp", key: "companyName", width: 26, value: (r) => r.companyName },
                        { header: "Nội Dung", key: "purpose", width: 36, value: (r) => r.purpose },
                        { header: "Số Tiền (VNĐ)", key: "amount", width: 18, value: (r) => r.amount },
                        { header: "Ngày Nộp", key: "date", width: 18, value: (r) => r.date },
                      ],
                      data: activeInflowModal.items,
                    });
                    toast.success("Đã xuất danh sách chi tiết ra Excel!");
                  }}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Danh Sách Này Ra Excel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 2: TẠO LỆNH CẤP KINH PHÍ CHO BAN ── */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 text-slate-900 shadow-2xl flex flex-col space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    Lệnh Cấp Kinh Phí Từ Quỹ Tổng Sang Ban Chuyên Môn
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quỹ Tổng chỉ giải ngân trực tiếp cho các Ban. Ban nhận kinh phí tự quản lý chi tiêu nội bộ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
                {/* Chọn Ban nhận */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chọn Ban Chuyên Môn Nhận Kinh Phí:
                  </label>
                  <select
                    value={transferForm.targetDepartment}
                    onChange={(e) => setTransferForm({ ...transferForm, targetDepartment: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} (Phụ trách: {d.leader})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Số tiền cấp */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số Tiền Cấp Kinh Phí (VNĐ):
                  </label>
                  <input
                    type="number"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    placeholder="VD: 20000000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Số dư Quỹ Tổng hiện khả dụng: <b>{currentMasterBalance.toLocaleString("vi-VN")} đ</b>
                  </span>
                </div>

                {/* Nội dung cấp kinh phí */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nội Dung / Mục Đích Cấp Kinh Phí:
                  </label>
                  <textarea
                    rows={3}
                    value={transferForm.description}
                    onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                    placeholder="Mô tả mục đích cấp kinh phí cho ban..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Ngày thực hiện */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày Ký Duyệt &amp; Giải Ngân:
                  </label>
                  <input
                    type="date"
                    value={transferForm.transferDate}
                    onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingTransfer}
                    className="flex-1 py-2 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmittingTransfer ? "Đang xử lý..." : "Ký Duyệt & Cấp Kinh Phí Ngay"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
export default FinanceReport;
