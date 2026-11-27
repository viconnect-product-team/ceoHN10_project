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
  Trash2,
  Pencil,
  BarChart3,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { CustomTable, TableActionsGroup, type CustomTableColumn } from "@/components/common/CustomTable";
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
  const [selectedStatsFundId, setSelectedStatsFundId] = useState<string>("ALL");

  // Modal State: Chi tiết nguồn thu
  const [activeInflowModal, setActiveInflowModal] = useState<{
    title: string;
    description: string;
    totalAmount: number;
    items: InflowPayerDetail[];
  } | null>(null);

  // Modal State: Lệnh Chuyển Tiền Quỹ Tổng <-> Quỹ Ban
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDynamicImportModal, setShowDynamicImportModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    direction: "master_to_dept" as "master_to_dept" | "dept_to_master",
    targetDepartment: "",
    amount: "20000000",
    description: "",
    transferDate: new Date().toISOString().slice(0, 10),
  });
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Modal State: Xem Lịch Sử Cấp Quỹ
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string | number>>(new Set());

  // Modal State: Chỉnh sửa Thông tin Quỹ & Tài khoản Ngân hàng của từng Ban
  const [editingFund, setEditingFund] = useState<{
    id: string;
    name: string;
    description: string;
    leaderName: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    sepayAccountId: string;
  } | null>(null);
  const [savingFund, setSavingFund] = useState(false);

  // Modal State: Dashboard Chi Tiết Quỹ Từng Ban (Dòng tiền + Cột Động + Import Excel JSONB)
  const [activeDeptFund, setActiveDeptFund] = useState<any | null>(null);
  const [newColLabel, setNewColLabel] = useState("");
  const [addingCol, setAddingCol] = useState(false);
  const [importingDeptExcel, setImportingDeptExcel] = useState(false);
  const [selectedDeptRowIds, setSelectedDeptRowIds] = useState<Set<string | number>>(new Set());

  // Số dư đầu kỳ thực tế (không hardcode số ảo)
  const OPENING_BALANCE = 0;

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
        leader: f.leader_name || "Trưởng Ban Chuyên Trách",
        totalAllocated: Number(f.current_balance || 0),
        totalInflow: Number(f.total_inflow || 0),
        totalOutflow: Number(f.total_outflow || 0),
        transferCount: inTxs.length,
        lastTransferDate: latestTx?.date || new Date().toISOString().slice(0, 10),
        purposeNote: latestTx?.description || f.description || "Chưa có dòng tiền phát sinh",
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

  const tuitionPayers: InflowPayerDetail[] = [];

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

  // Lập Lệnh Chuyển Tiền (Quỹ Tổng <-> Quỹ Ban, tối đa 20 triệu từ Quỹ Tổng xuống Ban)
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(transferForm.amount.replace(/[^0-9]/g, "")) || 0;
    if (amt <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    if (transferForm.direction === "master_to_dept" && amt > 20000000) {
      toast.error("Mỗi lệnh chuyển tiền từ Quỹ Tổng xuống Quỹ Ban tối đa 20.000.000 VNĐ!");
      return;
    }
    const targetDept = departments.find((d) => d.name === transferForm.targetDepartment) || departments[0];
    if (!targetDept || !generalFund) {
      toast.error("Không tìm thấy Quỹ Ban hoặc Quỹ Tổng trong CSDL.");
      return;
    }
    if (transferForm.direction === "master_to_dept" && amt > currentMasterBalance) {
      toast.error("Số tiền cấp vượt quá số dư hiện có của Quỹ Tổng!");
      return;
    }
    if (transferForm.direction === "dept_to_master" && amt > targetDept.totalAllocated) {
      toast.error(`Số tiền chuyển vượt quá số dư hiện có của ${targetDept.name}!`);
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const res: any = await fetchNestApi("/financial-report/fund-transfers", {
        method: "POST",
        body: JSON.stringify({
          direction: transferForm.direction,
          sourceFundId: transferForm.direction === "master_to_dept" ? generalFund.id : targetDept.id,
          destinationFundId: transferForm.direction === "master_to_dept" ? targetDept.id : generalFund.id,
          sourceFundName: transferForm.direction === "master_to_dept" ? generalFund.name : targetDept.name,
          destinationFundName: transferForm.direction === "master_to_dept" ? targetDept.name : generalFund.name,
          amount: amt,
          description: transferForm.description || `${transferForm.direction === "master_to_dept" ? "Cấp kinh phí" : "Nộp tiền về Quỹ Tổng"} (${targetDept.name})`,
          transferDate: transferForm.transferDate,
        }),
      });
      await Promise.all([fundsQuery.refetch(), transfersQuery.refetch()]);
      setShowTransferModal(false);
      toast.success(res?.message || "Đã tạo lệnh chuyển tiền chờ tiếp nhận!");
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tạo lệnh chuyển tiền");
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleAcceptOrder = async (order: any) => {
    try {
      const res: any = await fetchNestApi(`/financial-report/fund-transfers/${order.id}/accept`, {
        method: "POST",
      });
      await Promise.all([fundsQuery.refetch(), transfersQuery.refetch(), txQuery.refetch()]);
      toast.success(res?.message || "Đã tiếp nhận lệnh chuyển tiền và cập nhật số dư quỹ!");
    } catch (err: any) {
      toast.error(err?.message || "Không thể tiếp nhận lệnh chuyển tiền");
    }
  };

  const handleDeleteOrder = async (order: any) => {
    try {
      await fetchNestApi(`/financial-report/fund-transfers/${order.id}`, { method: "DELETE" });
      await transfersQuery.refetch();
      toast.success("Đã xóa lệnh chuyển tiền!");
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa lệnh chuyển tiền");
    }
  };

  const handleBulkDeleteOrders = async (keys: (string | number)[]) => {
    for (const k of keys) {
      await fetchNestApi(`/financial-report/fund-transfers/${k}`, { method: "DELETE" }).catch(() => {});
    }
    setSelectedOrderIds(new Set());
    await transfersQuery.refetch();
    toast.success(`Đã xóa ${keys.length} lệnh chuyển tiền đã chọn!`);
  };

  // Query Cột động & Dòng tiền chi tiết cho Dashboard Quỹ từng Ban
  const deptColumnsQuery = useQuery({
    queryKey: ["financial-report-columns"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>("/financial-report/columns");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const deptRowsQuery = useQuery({
    queryKey: ["financial-report-dept-rows", activeDeptFund?.id],
    enabled: Boolean(activeDeptFund?.id),
    queryFn: async () => {
      if (!activeDeptFund) return { rows: [], summary: { totalIncome: 0, totalExpense: 0 } };
      const res: any = await fetchNestApi(
        `/financial-report/rows?fundId=${encodeURIComponent(activeDeptFund.id)}&department=${encodeURIComponent(activeDeptFund.name)}`,
      ).catch(() => ({ rows: [] }));
      return res || { rows: [] };
    },
    refetchInterval: 5000,
  });

  const handleSaveFundInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFund) return;
    setSavingFund(true);
    try {
      await fetchNestApi(`/finance-init/funds/${editingFund.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editingFund.name,
          description: editingFund.description,
          leaderName: editingFund.leaderName,
          bankName: editingFund.bankName,
          accountNumber: editingFund.accountNumber,
          accountHolder: editingFund.accountHolder,
          sepayAccountId: editingFund.sepayAccountId,
        }),
      });
      await fundsQuery.refetch();
      toast.success("Đã cập nhật thông tin Quỹ & Tài khoản ngân hàng!");
      setEditingFund(null);
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật thông tin quỹ");
    } finally {
      setSavingFund(false);
    }
  };

  const handleAddDynamicColumn = async () => {
    const label = newColLabel.trim();
    if (!label) return;
    setAddingCol(true);
    try {
      await fetchNestApi("/financial-report/columns", {
        method: "POST",
        body: JSON.stringify({ column_label: label, column_type: "text" }),
      });
      setNewColLabel("");
      await deptColumnsQuery.refetch();
      toast.success(`Đã thêm cột động "${label}"!`);
    } catch (err: any) {
      toast.error(err?.message || "Không thể thêm cột động");
    } finally {
      setAddingCol(false);
    }
  };

  const handleImportDeptExcel = async (file: File) => {
    if (!activeDeptFund) return;
    setImportingDeptExcel(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
      if (jsonRows.length === 0) {
        toast.error("File Excel không có dữ liệu.");
        return;
      }

      const fixedHeaders = new Set(["ngày", "date", "transaction_date", "mã chứng từ", "voucher_no", "danh mục", "category", "nội dung", "description", "thu", "income", "income_amount", "chi", "expense", "expense_amount", "đối tượng", "party_name"]);
      const existingCols = deptColumnsQuery.data || [];
      const colKeyMap: Record<string, string> = {};
      existingCols.forEach((c: any) => {
        colKeyMap[String(c.column_label || "").toLowerCase().trim()] = c.column_key;
      });

      const allHeaders = Object.keys(jsonRows[0] || {});
      for (const h of allHeaders) {
        const norm = h.toLowerCase().trim();
        if (!fixedHeaders.has(norm) && !colKeyMap[norm]) {
          try {
            const created: any = await fetchNestApi("/financial-report/columns", {
              method: "POST",
              body: JSON.stringify({ column_label: h, column_type: "text" }),
            });
            if (created?.column_key) {
              colKeyMap[norm] = created.column_key;
            }
          } catch {}
        }
      }

      for (const r of jsonRows) {
        const customData: Record<string, any> = {
          fundId: activeDeptFund.id,
          department: activeDeptFund.name,
        };
        for (const [k, v] of Object.entries(r)) {
          const norm = k.toLowerCase().trim();
          if (!fixedHeaders.has(norm)) {
            const key = colKeyMap[norm] || norm.replace(/[^a-z0-9_]/g, "_");
            customData[key] = v;
          }
        }
        await fetchNestApi("/financial-report/rows", {
          method: "POST",
          body: JSON.stringify({
            transaction_date: String(r["Ngày"] || r["date"] || r["transaction_date"] || new Date().toISOString().slice(0, 10)).slice(0, 10),
            voucher_no: String(r["Mã chứng từ"] || r["voucher_no"] || `IMP-${Date.now().toString().slice(-5)}`),
            category: String(r["Danh mục"] || r["category"] || "Dòng tiền Quỹ Ban"),
            description: String(r["Nội dung"] || r["description"] || `Import Excel (${activeDeptFund.name})`),
            income_amount: Number(String(r["Thu"] || r["income"] || r["income_amount"] || 0).replace(/[^0-9.-]/g, "")) || 0,
            expense_amount: Number(String(r["Chi"] || r["expense"] || r["expense_amount"] || 0).replace(/[^0-9.-]/g, "")) || 0,
            party_name: String(r["Đối tượng"] || r["party_name"] || activeDeptFund.name),
            status: "completed",
            custom_data: customData,
          }),
        });
      }

      await Promise.all([deptColumnsQuery.refetch(), deptRowsQuery.refetch()]);
      toast.success(`Đã import ${jsonRows.length} dòng & tự động lưu các cột thừa dạng JSON!`);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi import file Excel");
    } finally {
      setImportingDeptExcel(false);
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
              Quản trị dòng tiền Quỹ Tổng CEOHN10 CLB Doanh Nhân CEO HN10 (HanoiBA)
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

        {/* ── 2. HERO CARD: QUỸ TỔNG CEOHN10 (SỐ DƯ BIẾN ĐỘNG THỜI GIAN THỰC) ── */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl relative overflow-hidden border border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-600/30 text-blue-300 border border-blue-400/30">
                  TỔNG QUỸ CEOHN10 CEO HN10
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
                Tài khoản ngân hàng liên kết: <b>Techcombank - 1903668899 (Quỹ Tổng CEOHN10)</b>
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

        {/* ── 2B. THỐNG KÊ BIẾN ĐỘNG DÒNG TIỀN VÀO / RA THEO QUỸ BAN ── */}
        {(() => {
          const selectedFundObj =
            selectedStatsFundId === "FUND_GENERAL"
              ? generalFund
              : selectedStatsFundId !== "ALL"
              ? departments.find((d: any) => d.id === selectedStatsFundId || d.code === selectedStatsFundId)
              : null;

          const statsTitle = selectedFundObj
            ? `Biến Động Dòng Tiền: ${selectedFundObj.name}`
            : "Biểu Đồ Biến Động Dòng Tiền (Vào / Ra) Theo 7 Quỹ Ban";

          const selectedInflow = selectedFundObj
            ? Number(selectedFundObj.total_inflow ?? selectedFundObj.totalInflow ?? 0)
            : departments.reduce((s: number, d: any) => s + Number(d.totalInflow || 0), 0);

          const selectedOutflow = selectedFundObj
            ? Number(selectedFundObj.total_outflow ?? selectedFundObj.totalOutflow ?? 0)
            : departments.reduce((s: number, d: any) => s + Number(d.totalOutflow || 0), 0);

          const selectedBalance = selectedFundObj
            ? Number(selectedFundObj.current_balance ?? selectedFundObj.totalAllocated ?? 0)
            : totalAllocatedToDepts;

          const selectedTxs: any[] = selectedFundObj
            ? Array.isArray(selectedFundObj.transactions)
              ? selectedFundObj.transactions
              : []
            : departments.flatMap((d: any) => (Array.isArray(d.transactions) ? d.transactions : []));

          const barData = selectedFundObj
            ? (() => {
                const byDate = new Map<string, { name: string; inflow: number; outflow: number }>();
                for (const tx of selectedTxs) {
                  const key = String(tx.date || "").slice(0, 10) || "Chưa rõ";
                  const cur = byDate.get(key) || { name: key, inflow: 0, outflow: 0 };
                  if (tx.type === "IN") cur.inflow += Number(tx.amount || 0);
                  else cur.outflow += Number(tx.amount || 0);
                  byDate.set(key, cur);
                }
                const rows = Array.from(byDate.values()).sort((a, b) => a.name.localeCompare(b.name));
                return rows.length > 0
                  ? rows
                  : [{ name: selectedFundObj.name.replace("Quỹ ", "").replace("Ban ", ""), inflow: selectedInflow, outflow: selectedOutflow }];
              })()
            : departments.map((d: any) => ({
                name: d.name.replace("Quỹ ", "").replace("Ban ", ""),
                inflow: Number(d.totalInflow || 0),
                outflow: Number(d.totalOutflow || 0),
              }));

          const pieData = selectedFundObj
            ? [
                { name: "Tiền Vào", value: Math.max(0, selectedInflow) },
                { name: "Tiền Ra", value: Math.max(0, selectedOutflow) },
              ].filter((x) => x.value > 0)
            : [
                { name: "Quỹ Tổng", value: Math.max(0, currentMasterBalance) },
                { name: "7 Quỹ Ban", value: Math.max(0, totalAllocatedToDepts) },
                { name: "Thu Vé Sự Kiện", value: Math.max(0, totalEventIn) },
              ].filter((x) => x.value > 0);

          const pieColors = selectedFundObj ? ["#10B981", "#EF4444"] : ["#003B95", "#F59E0B", "#10B981"];

          return (
            <div className="space-y-4">
              {/* Bộ lọc chọn Quỹ cần xem thống kê */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#003B95]" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Chọn Quỹ Xem Thống Kê
                    </span>
                  </div>
                  <select
                    value={selectedStatsFundId}
                    onChange={(e) => setSelectedStatsFundId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Tất cả 7 Quỹ Ban (Tổng hợp)</option>
                    {generalFund && <option value="FUND_GENERAL">{generalFund.name} (Quỹ Tổng)</option>}
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick pills */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedStatsFundId("ALL")}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      selectedStatsFundId === "ALL"
                        ? "bg-[#003B95] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Tất cả 7 Quỹ Ban
                  </button>
                  {generalFund && (
                    <button
                      type="button"
                      onClick={() => setSelectedStatsFundId("FUND_GENERAL")}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                        selectedStatsFundId === "FUND_GENERAL"
                          ? "bg-[#003B95] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Quỹ Tổng
                    </button>
                  )}
                  {departments.map((d: any) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedStatsFundId(d.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                        selectedStatsFundId === d.id
                          ? "bg-[#003B95] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {d.name.replace("Quỹ ", "")}
                    </button>
                  ))}
                </div>

                {/* 4 thẻ KPI của Quỹ đang chọn */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 font-medium block">Số dư hiện tại</span>
                    <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">
                      {selectedBalance.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                    <span className="text-[11px] text-emerald-700 font-medium block">Tổng Tiền Vào</span>
                    <span className="text-sm font-black text-emerald-700 font-mono mt-0.5 block">
                      +{selectedInflow.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80">
                    <span className="text-[11px] text-rose-700 font-medium block">Tổng Tiền Ra</span>
                    <span className="text-sm font-black text-rose-700 font-mono mt-0.5 block">
                      -{selectedOutflow.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                    <span className="text-[11px] text-blue-800 font-medium block">Số giao dịch phát sinh</span>
                    <span className="text-sm font-black text-blue-900 font-mono mt-0.5 block">
                      {selectedTxs.length} giao dịch
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#003B95]" />
                      <h3 className="text-sm font-black text-slate-900">{statsTitle}</h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">Đơn vị: VNĐ (Dữ liệu thật)</span>
                  </div>
                  <div className="h-60 w-full">
                    {barData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        Chưa có dữ liệu quỹ để hiển thị biểu đồ
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v >= 1000000 ? `${Math.round(v / 1000000)}tr` : `${Math.round(v / 1000)}k`)} />
                          <RechartsTooltip formatter={(v: any) => `${Number(v || 0).toLocaleString("vi-VN")} đ`} />
                          <Legend wrapperStyle={{ fontSize: "11px" }} />
                          <Bar dataKey="inflow" name="Tiền Vào" fill="#10B981" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="outflow" name="Tiền Ra" fill="#EF4444" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <h3 className="text-sm font-black text-slate-900 mb-3">
                    {selectedFundObj ? "Tỷ Trọng Tiền Vào / Tiền Ra" : "Tỷ Trọng Quỹ Tổng & Quỹ Ban"}
                  </h3>
                  <div className="h-60 w-full">
                    {pieData.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-4 text-xs text-slate-400 gap-1">
                        <span className="font-bold text-slate-500">Chưa có phát sinh dòng tiền (0 đ)</span>
                        <span>Biểu đồ tỷ trọng sẽ tự động hiển thị khi có thu hoặc chi.</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={72}
                            label={false}
                          >
                            {pieColors.map((c, idx) => (
                              <Cell key={idx} fill={c} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(v: any) => `${Number(v || 0).toLocaleString("vi-VN")} đ`} />
                          <Legend wrapperStyle={{ fontSize: "11px" }} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── 3. PHÂN HỆ LUỒNG THU VÀO THỰC TẾ (KHÔNG DỮ LIỆU ẢO) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Luồng Dòng Tiền Thực Tế (Vé Sự Kiện &amp; Nộp Quỹ Tổng)
              </h2>
              <p className="text-xs text-slate-500">
                Tiền vé sự kiện vào Quỹ Ban Sự Kiện &amp; Hậu Cần trước, Trưởng ban lập lệnh chuyển về Quỹ Tổng. Quỹ Tài Trợ quản lý tại luồng riêng.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Tổng thu sự kiện: <b>{totalEventIn.toLocaleString("vi-VN")} đ</b>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NGUỒN 1: THU VÉ SỰ KIỆN VÀO QUỸ BAN SỰ KIỆN */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Vé Sự Kiện → Quỹ Ban Sự Kiện
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">{eventPayers.length} Đại biểu</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  Thu Vé &amp; Phí Tham Dự Sự Kiện
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cộng vào Quỹ Ban Sự Kiện &amp; Hậu Cần khi SePay xác nhận
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
                      description: "Danh sách học viên và khách mời đã thanh toán vé sự kiện (vào Quỹ Ban Sự Kiện & Hậu Cần).",
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

            {/* NGUỒN 2: TIỀN NỘP TỪ CÁC QUỸ BAN LÊN QUỸ TỔNG */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Quỹ Ban → Quỹ Tổng
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {(transfersQuery.data || []).filter((o: any) => o.direction === "dept_to_master" && o.status === "accepted").length} Lệnh
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  Tiền Các Ban Chuyển Nộp Về Quỹ Tổng
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tự động ghi nhận khi Trưởng ban làm lệnh chuyển lên Quỹ Tổng và được tiếp nhận
                </p>
                <div className="mt-3">
                  <span className="text-xl font-black text-emerald-700 font-mono">
                    {(transfersQuery.data || [])
                      .filter((o: any) => o.direction === "dept_to_master" && o.status === "accepted")
                      .reduce((s: number, o: any) => s + Number(o.amount || 0), 0)
                      .toLocaleString("vi-VN")} đ
                  </span>
                </div>
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

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const rawFund = allFunds.find((f) => f.id === dept.id);
                      setActiveDeptFund(rawFund || dept);
                    }}
                    className="text-[11px] font-bold text-[#003B95] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Dashboard Quỹ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const rawFund = allFunds.find((f) => f.id === dept.id);
                      const bank = rawFund?.bank_accounts?.[0];
                      setEditingFund({
                        id: dept.id,
                        name: dept.name,
                        description: rawFund?.description || "",
                        leaderName: rawFund?.leader_name || dept.leader || "",
                        bankName: bank?.bank_name || "",
                        accountNumber: bank?.account_number || "",
                        accountHolder: bank?.account_holder || "",
                        sepayAccountId: bank?.sepay_account_id || "",
                      });
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Sửa TK/Quỹ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferForm({
                        direction: "dept_to_master",
                        targetDepartment: dept.name,
                        amount: String(Math.min(dept.totalAllocated || 0, 20000000) || 1000000),
                        description: `Chuyển tiền thu về Quỹ Tổng từ ${dept.name}`,
                        transferDate: new Date().toISOString().slice(0, 10),
                      });
                      setShowTransferModal(true);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Nộp Tổng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferForm({
                        direction: "master_to_dept",
                        targetDepartment: dept.name,
                        amount: "20000000",
                        description: `Cấp kinh phí hoạt động cho ${dept.name}`,
                        transferDate: new Date().toISOString().slice(0, 10),
                      });
                      setShowTransferModal(true);
                    }}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Cấp (≤20tr)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4B. BẢNG LỆNH CHUYỂN TIỀN QUỸ TỔNG ↔ QUỸ BAN (TIẾP NHẬN REAL-TIME) ── */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Lệnh Chuyển Tiền (Quỹ Tổng ↔ Quỹ Ban)
              </h3>
              <p className="text-xs text-slate-500">
                Platform Admin / Lớp trưởng / Ban Tài Chính lập lệnh cấp xuống Ban (tối đa 20 triệu/lệnh). Trưởng ban bấm Tiếp nhận để cộng số dư vào Quỹ Ban.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTransferForm({
                  direction: "master_to_dept",
                  targetDepartment: departments[0]?.name || "",
                  amount: "20000000",
                  description: "",
                  transferDate: new Date().toISOString().slice(0, 10),
                });
                setShowTransferModal(true);
              }}
              className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lập Lệnh Chuyển Tiền</span>
            </button>
          </div>

          <CustomTable<any>
            data={transfersQuery.data || []}
            keyExtractor={(r) => r.id}
            selectable
            selectedKeys={selectedOrderIds}
            onSelectionChange={setSelectedOrderIds}
            onBulkDelete={handleBulkDeleteOrders}
            bulkDeleteLabel="Xóa các lệnh đã chọn"
            emptyText="Chưa có lệnh chuyển tiền nào giữa Quỹ Tổng và Quỹ Ban."
            columns={[
              { key: "transfer_code", label: "Mã Lệnh", width: 120 },
              {
                key: "direction",
                label: "Luồng Chuyển",
                width: 170,
                render: (r) =>
                  r.direction === "dept_to_master" ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                      Ban → Quỹ Tổng
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                      Quỹ Tổng → Ban
                    </span>
                  ),
              },
              {
                key: "source_fund_name",
                label: "Quỹ Nguồn → Đích",
                width: 240,
                render: (r) => `${r.source_fund_name} → ${r.destination_fund_name}`,
              },
              {
                key: "amount",
                label: "Số Tiền",
                align: "right",
                width: 140,
                render: (r) => (
                  <span className="font-mono font-bold text-slate-900">
                    {Number(r.amount || 0).toLocaleString("vi-VN")} đ
                  </span>
                ),
              },
              { key: "description", label: "Nội Dung", width: 220 },
              {
                key: "status",
                label: "Trạng Thái",
                align: "center",
                width: 150,
                render: (r) =>
                  r.status === "accepted" ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                      Đã tiếp nhận
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[11px]">
                      Chờ tiếp nhận
                    </span>
                  ),
              },
            ]}
            actionColumn={{
              title: "THAO TÁC",
              width: 180,
              actions: (r) => [
                ...(r.status !== "accepted"
                  ? [
                      {
                        key: "accept",
                        label: "Tiếp nhận",
                        icon: CheckCircle2,
                        variant: "success" as const,
                        onClick: () => handleAcceptOrder(r),
                      },
                    ]
                  : []),
                {
                  key: "delete",
                  label: "Xóa",
                  icon: Trash2,
                  danger: true,
                  onClick: () => handleDeleteOrder(r),
                },
              ],
            }}
          />
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
                <option value="events">Thu vé sự kiện</option>
                <option value="sponsors">Thu tài trợ</option>
                <option value="transfers">Lệnh chuyển tiền Quỹ Ban</option>
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
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* 1. Các khoản thu sự kiện */}
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
                    <td className="py-3 px-4 text-center">
                      <TableActionsGroup
                        maxVisible={3}
                        actions={[
                          {
                            key: "view",
                            label: "Chi tiết",
                            icon: Eye,
                            onClick: () =>
                              setActiveInflowModal({
                                title: `Chi tiết giao dịch ${e.transactionRef}`,
                                description: e.purpose,
                                totalAmount: e.amount,
                                items: [e],
                              }),
                          },
                        ]}
                      />
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
                    <td className="py-3 px-4 text-center">
                      <TableActionsGroup
                        maxVisible={3}
                        actions={[
                          {
                            key: "transfer_down",
                            label: "Cấp quỹ",
                            icon: Plus,
                            variant: "primary",
                            onClick: () => {
                              setTransferForm({
                                direction: "master_to_dept",
                                targetDepartment: d.name,
                                amount: "20000000",
                                description: `Cấp kinh phí hoạt động cho ${d.name}`,
                                transferDate: new Date().toISOString().slice(0, 10),
                              });
                              setShowTransferModal(true);
                            },
                          },
                          {
                            key: "transfer_up",
                            label: "Nộp lên Tổng",
                            icon: ArrowUpRight,
                            variant: "success",
                            onClick: () => {
                              setTransferForm({
                                direction: "dept_to_master",
                                targetDepartment: d.name,
                                amount: String(Math.min(d.totalAllocated || 0, 20000000) || 1000000),
                                description: `Nộp tiền thu về Quỹ Tổng từ ${d.name}`,
                                transferDate: new Date().toISOString().slice(0, 10),
                              });
                              setShowTransferModal(true);
                            },
                          },
                        ]}
                      />
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
                {/* Chọn chiều chuyển tiền */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Loại Lệnh Chuyển Tiền:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransferForm((p) => ({ ...p, direction: "master_to_dept", amount: "20000000" }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer ${transferForm.direction === "master_to_dept" ? "bg-blue-700 text-white border-blue-700" : "bg-white text-slate-700 border-slate-200"}`}
                    >
                      Quỹ Tổng → Ban (≤ 20tr)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferForm((p) => ({ ...p, direction: "dept_to_master" }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer ${transferForm.direction === "dept_to_master" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200"}`}
                    >
                      Quỹ Ban → Quỹ Tổng
                    </button>
                  </div>
                </div>

                {/* Chọn Ban */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {transferForm.direction === "master_to_dept" ? "Chọn Ban Nhận Kinh Phí:" : "Chọn Ban Nộp Tiền Về Quỹ Tổng:"}
                  </label>
                  <select
                    value={transferForm.targetDepartment}
                    onChange={(e) => setTransferForm({ ...transferForm, targetDepartment: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} (Số dư: {d.totalAllocated.toLocaleString("vi-VN")} đ)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Số tiền */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số Tiền Chuyển (VNĐ) {transferForm.direction === "master_to_dept" ? "(Tối đa 20.000.000 đ)" : ""}:
                  </label>
                  <input
                    type="number"
                    max={transferForm.direction === "master_to_dept" ? 20000000 : undefined}
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
          entityTitle="Sổ quỹ & Dòng tiền CEOHN10 CEO HN10"
          onSuccess={() => {
            toast.success("Đã đồng bộ dữ liệu tài chính từ tệp import thành công!");
          }}
        />

        {/* ── MODAL 3: CHỈNH SỬA THÔNG TIN QUỸ & TÀI KHOẢN NGÂN HÀNG BAN ── */}
        {editingFund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 text-slate-900 shadow-2xl space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">Chỉnh Sửa Thông Tin Quỹ &amp; Tài Khoản Ngân Hàng</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Cập nhật thông tin tài khoản nhận tiền SePay / chuyển khoản riêng cho quỹ ban</p>
                </div>
                <button type="button" onClick={() => setEditingFund(null)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveFundInfo} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên Quỹ Ban</label>
                  <input type="text" required value={editingFund.name} onChange={(e) => setEditingFund({ ...editingFund, name: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trưởng Ban / Người Phụ Trách</label>
                  <input type="text" value={editingFund.leaderName} onChange={(e) => setEditingFund({ ...editingFund, leaderName: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tên Ngân Hàng</label>
                    <input type="text" placeholder="VD: VPBank, Vietcombank..." value={editingFund.bankName} onChange={(e) => setEditingFund({ ...editingFund, bankName: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số Tài Khoản Ngân Hàng</label>
                    <input type="text" placeholder="Nhập STK..." value={editingFund.accountNumber} onChange={(e) => setEditingFund({ ...editingFund, accountNumber: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tên Chủ Tài Khoản</label>
                    <input type="text" value={editingFund.accountHolder} onChange={(e) => setEditingFund({ ...editingFund, accountHolder: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">SePay Account ID (Tùy chọn)</label>
                    <input type="text" placeholder="ID TK trên my.sepay.vn" value={editingFund.sepayAccountId} onChange={(e) => setEditingFund({ ...editingFund, sepayAccountId: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mô Tả / Ghi Chú Quỹ</label>
                  <textarea rows={2} value={editingFund.description} onChange={(e) => setEditingFund({ ...editingFund, description: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200" />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingFund(null)} className="px-4 py-2 rounded-xl border border-slate-200 font-bold cursor-pointer">Hủy</button>
                  <button type="submit" disabled={savingFund} className="px-4 py-2 rounded-xl bg-[#003B95] text-white font-bold cursor-pointer disabled:opacity-50">
                    {savingFund ? "Đang lưu..." : "Lưu Thông Tin Quỹ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL 4: DASHBOARD CHI TIẾT QUỸ TỪNG BAN (DÒNG TIỀN + CỘT ĐỘNG + EXCEL JSONB) ── */}
        {activeDeptFund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-5xl rounded-3xl bg-white border border-slate-200 p-6 text-slate-900 shadow-2xl max-h-[92vh] flex flex-col space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Dashboard Quỹ: {activeDeptFund.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Số dư: <b className="text-[#003B95] font-mono">{Number(activeDeptFund.current_balance || 0).toLocaleString("vi-VN")} đ</b>
                    {activeDeptFund.bank_accounts?.[0] ? ` • TK: ${activeDeptFund.bank_accounts[0].bank_name} - ${activeDeptFund.bank_accounts[0].account_number}` : " • Chưa gán STK ngân hàng"}
                  </p>
                </div>
                <button type="button" onClick={() => setActiveDeptFund(null)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thanh tạo cột động + Import Excel JSONB */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Tên cột động mới (VD: Dự án, Hóa đơn...)"
                    value={newColLabel}
                    onChange={(e) => setNewColLabel(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs w-64"
                  />
                  <button
                    type="button"
                    disabled={addingCol}
                    onClick={handleAddDynamicColumn}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{addingCol ? "Đang thêm..." : "Thêm Cột Động"}</span>
                  </button>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{importingDeptExcel ? "Đang import..." : "Import Excel (Lưu cột thừa JSON)"}</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImportDeptExcel(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {/* Biểu đồ biến động Dòng Tiền Vào / Ra riêng của Quỹ Ban */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-800">Biểu Đồ Biến Động Dòng Tiền (Vào / Ra) — {activeDeptFund.name}</span>
                  <span className="text-[11px] text-slate-500">
                    Tổng vào: <b className="text-emerald-600">+{Number(activeDeptFund.total_inflow || activeDeptFund.totalInflow || 0).toLocaleString("vi-VN")} đ</b> · Tổng ra: <b className="text-rose-600">-{Number(activeDeptFund.total_outflow || activeDeptFund.totalOutflow || 0).toLocaleString("vi-VN")} đ</b>
                  </span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const rows = deptRowsQuery.data?.rows || [];
                        if (rows.length === 0) {
                          return [{
                            date: new Date().toISOString().slice(0, 10),
                            inflow: Number(activeDeptFund.total_inflow || activeDeptFund.totalInflow || 0),
                            outflow: Number(activeDeptFund.total_outflow || activeDeptFund.totalOutflow || 0),
                          }];
                        }
                        const byDate: Record<string, { date: string; inflow: number; outflow: number }> = {};
                        for (const r of rows) {
                          const d = String(r.transaction_date || "").slice(0, 10) || "Khác";
                          if (!byDate[d]) byDate[d] = { date: d, inflow: 0, outflow: 0 };
                          byDate[d].inflow += Number(r.income_amount || 0);
                          byDate[d].outflow += Number(r.expense_amount || 0);
                        }
                        return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
                      })()}
                    >
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v >= 1000000 ? `${Math.round(v / 1000000)}tr` : `${Math.round(v / 1000)}k`)} />
                      <RechartsTooltip formatter={(v: any) => `${Number(v || 0).toLocaleString("vi-VN")} đ`} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="inflow" name="Tiền Vào" fill="#10B981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="outflow" name="Tiền Ra" fill="#EF4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bảng dòng tiền Quỹ Ban với Cột Động + Xóa cứng hàng loạt */}
              <div className="overflow-y-auto flex-1">
                <CustomTable<any>
                  data={deptRowsQuery.data?.rows || []}
                  keyExtractor={(r) => r.id}
                  selectable
                  selectedKeys={selectedDeptRowIds}
                  onSelectionChange={setSelectedDeptRowIds}
                  onBulkDelete={async (keys) => {
                    for (const k of keys) {
                      await fetchNestApi(`/financial-report/rows/${k}`, { method: "DELETE" }).catch(() => {});
                    }
                    setSelectedDeptRowIds(new Set());
                    await deptRowsQuery.refetch();
                    toast.success(`Đã xóa ${keys.length} dòng đã chọn!`);
                  }}
                  emptyText="Chưa có dòng tiền nào trong quỹ ban này."
                  columns={[
                    { key: "transaction_date", label: "Ngày", width: 110, render: (r) => String(r.transaction_date || "").slice(0, 10) },
                    { key: "voucher_no", label: "Mã CT", width: 120 },
                    { key: "category", label: "Phân Loại", width: 150 },
                    { key: "description", label: "Nội Dung", width: 220 },
                    {
                      key: "income_amount",
                      label: "Thu (+)",
                      align: "right",
                      width: 130,
                      render: (r) => <span className="font-mono font-bold text-emerald-600">+{Number(r.income_amount || 0).toLocaleString("vi-VN")} đ</span>,
                    },
                    {
                      key: "expense_amount",
                      label: "Chi (-)",
                      align: "right",
                      width: 130,
                      render: (r) => <span className="font-mono font-bold text-rose-600">-{Number(r.expense_amount || 0).toLocaleString("vi-VN")} đ</span>,
                    },
                    ...(deptColumnsQuery.data || []).map((col: any): CustomTableColumn<any> => ({
                      key: `dyn_${col.column_key}`,
                      label: col.column_label,
                      width: 140,
                      render: (r) => String(r.custom_data?.[col.column_key] ?? "—"),
                    })),
                  ]}
                  actionColumn={{
                    title: "THAO TÁC",
                    width: 110,
                    actions: (r) => [
                      {
                        key: "del",
                        label: "Xóa",
                        icon: Trash2,
                        danger: true,
                        onClick: async () => {
                          await fetchNestApi(`/financial-report/rows/${r.id}`, { method: "DELETE" });
                          await deptRowsQuery.refetch();
                          toast.success("Đã xóa dòng giao dịch!");
                        },
                      },
                    ],
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
export default FinanceReport;
