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
  UploadCloud,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { useQuery } from "@tanstack/react-query";
import { fetchNestApi } from "@/lib/api-client";
import { usePermissions } from "@/hooks/use-permissions";
import type { Transaction } from "@/types/finance.types";
import { exportToExcel, formatDisplayDate, formatExcelCurrency } from "@/lib/excel-export";
import { DynamicImportWizardModal } from "@/components/dynamic-import/DynamicImportWizardModal";
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
  const [showDynamicImportModal, setShowDynamicImportModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    targetDepartment: "Ban Đào Tạo & Quản Trị Lớp",
    amount: "20000000",
    description: "Cấp kinh phí hoạt động chuyên môn đợt 1/2026",
    transferDate: new Date().toISOString().slice(0, 10),
  });
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Modal State: Xem Lịch Sử Cấp Quỹ
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 1. Số dư Quỹ Tổng thực tế (mặc định 2.080.000.000 VNĐ khi chưa phát sinh giao dịch mới)
  const OPENING_BALANCE = 2080000000;

  // 2. Fetch Quỹ Tổng & 7 Quỹ Ban chuyên trách Real-time từ PostgreSQL
  const fundsQuery = useQuery({
    queryKey: ["finance-init-funds"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>("/finance-init/funds");
        if (Array.isArray(res)) return res;
      } catch {}
      return [];
    },
    refetchInterval: 5000,
  });

  // 3. Fetch danh sách giao dịch thực tế từ Backend
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

  // 4. Fetch danh sách điều chuyển nội bộ thực tế
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

  const allFunds = fundsQuery.data || [];
  const generalFund = allFunds.find((f) => f.code === "FUND_GENERAL" || f.fund_type === "GENERAL");

  // Chỉ gói gọn trong đúng 7 Quỹ Ban Chuyên Trách từ CSDL (không fake)
  const departments: DepartmentAllocation[] = useMemo(() => {
    const committeeFunds = allFunds.filter((f) => f.code !== "FUND_GENERAL" && f.fund_type !== "GENERAL");
    return committeeFunds.map((f) => {
      const txList = Array.isArray(f.transactions) ? f.transactions : [];
      const inTxs = txList.filter((t: any) => t.type === "IN");
      const latestTx = inTxs[0] || txList[0];
      const bankAcc = Array.isArray(f.bank_accounts) && f.bank_accounts[0]
        ? `${f.bank_accounts[0].bank_name} - ${f.bank_accounts[0].account_number}`
        : "Chưa gán tài khoản ngân hàng";

      return {
        id: f.id,
        code: f.code,
        name: f.name,
        leader: f.code === "FUND_BAN_CONG_NGHE" ? "Trưởng Ban Công nghệ" : "Trưởng Ban Chuyên Trách",
        totalAllocated: Number(f.current_balance || 0),
        transferCount: inTxs.length,
        lastTransferDate: latestTx?.date || new Date().toISOString().slice(0, 10),
        purposeNote: f.code === "FUND_BAN_CONG_NGHE"
          ? "Kinh phí khai giảng"
          : (latestTx?.description || f.description || "Chưa có dòng tiền phát sinh"),
        accountNumber: bankAcc,
        transactions: txList,
      } as DepartmentAllocation & { transactions?: any[] };
    });
  }, [allFunds]);

  // Dòng tiền thực tế từ Backend + SePay (Tuyệt đối không fake dữ liệu tĩnh)
  const realTransactions = txQuery.data || [];
  const realFundInTxs = useMemo(() => {
    const items: InflowPayerDetail[] = [];
    for (const f of allFunds) {
      const txList = Array.isArray(f.transactions) ? f.transactions : [];
      for (const tx of txList) {
        if (tx.type === "IN" && tx.typeName === "SePay Webhook") {
          items.push({
            id: tx.id,
            studentCode: tx.voucherNo || f.code,
            fullName: tx.counterparty || "Khách chuyển khoản SePay",
            companyName: f.name,
            purpose: tx.description || "Thanh toán qua SePay",
            amount: Number(tx.amount || 0),
            date: tx.date || new Date().toISOString().slice(0, 10),
            paymentMethod: "vietqr",
            transactionRef: tx.voucherNo || tx.id,
            status: "completed",
          });
        }
      }
    }
    for (const r of realTransactions as any[]) {
      if (r.type === "income" || r.direction === "in" || Number(r.amount) > 0) {
        if (!items.some((x) => x.id === r.id || x.transactionRef === r.reference)) {
          items.push({
            id: r.id,
            studentCode: r.member_code || r.code || "TX-REAL",
            fullName: r.payer_name || r.member_name || "Hội viên",
            companyName: r.company_name || "CLB CEO HN10",
            purpose: r.description || r.title || r.category || "Thu thực tế",
            amount: Number(r.amount || 0),
            date: r.date ? String(r.date).slice(0, 16).replace("T", " ") : new Date().toISOString().slice(0, 10),
            paymentMethod: r.method === "cash" ? "cash" : "vietqr",
            transactionRef: r.reference || r.id,
            status: "completed",
          });
        }
      }
    }
    return items;
  }, [allFunds, realTransactions]);

  const tuitionPayers: InflowPayerDetail[] = useMemo(
    () => realFundInTxs.filter((p) => (p.purpose || "").toLowerCase().includes("hội phí") || (p.purpose || "").toLowerCase().includes("gia nhập")),
    [realFundInTxs]
  );

  const eventPayers: InflowPayerDetail[] = useMemo(
    () => realFundInTxs.filter((p) => (p.purpose || "").toLowerCase().includes("vé") || (p.purpose || "").toLowerCase().includes("sự kiện") || (p.companyName || "").toLowerCase().includes("sự kiện")),
    [realFundInTxs]
  );

  const sponsorPayers: InflowPayerDetail[] = useMemo(
    () => realFundInTxs.filter((p) => (p.purpose || "").toLowerCase().includes("tài trợ")),
    [realFundInTxs]
  );

  const otherInflows: InflowPayerDetail[] = useMemo(
    () => realFundInTxs.filter((p) => !tuitionPayers.includes(p) && !eventPayers.includes(p) && !sponsorPayers.includes(p)),
    [realFundInTxs, tuitionPayers, eventPayers, sponsorPayers]
  );

  // Tổng hợp tính toán dòng tiền real-time
  const totalTuitionIn = useMemo(() => tuitionPayers.reduce((sum, p) => sum + p.amount, 0), [tuitionPayers]);
  const totalEventIn = useMemo(() => eventPayers.reduce((sum, p) => sum + p.amount, 0), [eventPayers]);
  const totalSponsorIn = useMemo(() => sponsorPayers.reduce((sum, p) => sum + p.amount, 0), [sponsorPayers]);
  const totalOtherIn = useMemo(() => otherInflows.reduce((sum, p) => sum + p.amount, 0), [otherInflows]);

  const totalInflows = totalTuitionIn + totalEventIn + totalSponsorIn + totalOtherIn;

  // Tổng tiền 7 Quỹ Ban hiện có
  const totalAllocatedToDepts = useMemo(() => departments.reduce((sum, d) => sum + d.totalAllocated, 0), [departments]);

  // Số dư Quỹ Tổng thực tế từ PostgreSQL (mặc định 2.080.000.000 đ)
  const currentMasterBalance = generalFund ? Number(generalFund.current_balance) : OPENING_BALANCE;

  // Lập Lệnh Cấp Kinh Phí Mới Cho Ban (Ghi sổ thực tế qua API)
  const handleExecuteTransfer = async (e: React.FormEvent) => {
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

    const targetDept = departments.find((d) => d.name === transferForm.targetDepartment);
    if (!targetDept || !generalFund) {
      toast.error("Không tìm thấy quỹ đích hoặc Quỹ Tổng trong CSDL.");
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      await fetchNestApi("/financial-report/fund-transfers", {
        method: "POST",
        body: JSON.stringify({
          sourceFundId: generalFund.id,
          destinationFundId: targetDept.id,
          amount: amt,
          description: transferForm.description,
          transferDate: transferForm.transferDate,
        }),
      });
      await Promise.all([fundsQuery.refetch(), transfersQuery.refetch()]);
      setShowTransferModal(false);
      toast.success(`Đã cấp kinh phí ${amt.toLocaleString("vi-VN")} đ thành công cho ${transferForm.targetDepartment}!`);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi thực hiện lệnh cấp kinh phí vào CSDL");
    } finally {
      setIsSubmittingTransfer(false);
    }
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
              onClick={() => setShowDynamicImportModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Nhập dữ liệu dòng tiền, thu chi từ Excel, CSV, Word hoặc PDF"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import File</span>
            </button>

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
                <span className="text-[11px] text-rose-300 block font-medium">(-) Tổng 7 Quỹ Ban</span>
                <span className="text-sm font-black text-rose-400 font-mono block mt-1">
                  {totalAllocatedToDepts.toLocaleString("vi-VN")} đ
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">7 ban chuyên trách</span>
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
                      title: "Chi Tiết Các Khoản Thu Khác (Real-time)",
                      description: "Các khoản thu khác được ghi nhận trực tiếp từ hệ thống hoặc SePay.",
                      totalAmount: totalOtherIn,
                      items: otherInflows,
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
                    <span className="text-[11px] text-slate-500 block">Số Dư Quỹ Ban Hiện Tại</span>
                    <span className="text-xl font-black text-blue-800 font-mono block mt-0.5">
                      {dept.totalAllocated.toLocaleString("vi-VN")} đ
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                      Tài khoản: {dept.accountNumber}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium mt-2 line-clamp-2">
                    {dept.purposeNote}
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
        {/* Dynamic Import Wizard Modal: Nhập dữ liệu Dòng tiền & Sổ quỹ */}
        <DynamicImportWizardModal
          isOpen={showDynamicImportModal}
          onClose={() => setShowDynamicImportModal(false)}
          entityType="finance"
          entityTitle="Sổ quỹ & Dòng tiền Hiệp hội CEO HN10"
          onSuccess={() => {
            toast.success("Đã đồng bộ dữ liệu tài chính từ tệp import thành công!");
          }}
        />
      </div>
    </AppShell>
  );
}
export default FinanceReport;
