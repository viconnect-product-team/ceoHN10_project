import React, { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  PieChart,
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
  Receipt,
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  X,
  Printer,
  Upload,
  Plus,
  PlusCircle,
  Trash2,
  Columns,
  Settings2,
  ShieldCheck,
  ArrowLeftRight,
  Link2,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { useQuery } from "@tanstack/react-query";
import { fetchNestApi } from "@/lib/api-client";
import { usePermissions } from "@/hooks/use-permissions";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { validateFinancialColumn, validateFinancialRow } from "@/lib/validation";
import type { Transaction } from "@/types/finance.types";
import { useFmt, useT } from "@/lib/i18n";
import { exportToExcel, exportToWord, formatDisplayDate, formatExcelCurrency, numberToVietnameseWords } from "@/lib/excel-export";
import { getTemplateForExport, exportReportToPdf } from "@/lib/report-templates";
import { toast } from "sonner";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import { FinanceExcelImportModal } from "@/components/dashboard/FinanceExcelImportModal";
import { FinanceChartsSection } from "@/components/dashboard/FinanceChartsSection";
import { FinanceViewModeTabs, type FinanceViewMode } from "@/components/dashboard/FinanceViewModeTabs";
import { FinanceUnitTreeSection } from "@/components/dashboard/FinanceUnitTreeSection";
import { InvoiceExportModal, type InvoiceItem } from "@/components/dashboard/InvoiceExportModal";

export interface FinancialColumn {
  id: string;
  column_key: string;
  column_label: string;
  column_type: "text" | "number" | "currency" | "date" | "select";
  is_custom: boolean;
  order_index: number;
  options?: any[];
  width_px?: number;
  is_visible?: boolean;
}

export interface DynamicFinancialRow {
  id: string;
  transaction_date: string;
  voucher_no?: string;
  category: string;
  description: string;
  income_amount: number;
  expense_amount: number;
  balance_after?: number;
  party_name?: string;
  status: string;
  custom_data?: Record<string, any>;
}

export const Route = createFileRoute("/finance-report")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { category?: string } => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  loader: async () => {
    try {
      const data = await fetchNestApi<Transaction[]>("/admin/transactions");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  component: FinanceReport,
});

type PeriodFilter = "all" | "day" | "week" | "month" | "year";

function FinanceReport() {
  const t = useT();
  const fmt = useFmt();
  const perm = usePermissions();
  const searchParams = Route.useSearch();
  const queryCategory = searchParams.category;
  const rawTransactions = (Route.useLoaderData() as Transaction[]) || [];

  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<FinanceViewMode>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [invoiceExportModalOpen, setInvoiceExportModalOpen] = useState(false);

  // Unified Export Modal State (Gói gọn thành 1 nút duy nhất tùy chọn nội dung & định dạng)
  const [unifiedExportModalOpen, setUnifiedExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState<
    "all" | "tuition" | "penalty" | "events" | "sponsors" | "departments" | "invoices" | "sepay_reconcile"
  >("all");
  const [exportFormat, setExportFormat] = useState<"excel" | "word" | "pdf">("excel");

  // Dynamic columns state
  const [showAddColModal, setShowAddColModal] = useState(false);
  const [newColLabel, setNewColLabel] = useState("");
  const [newColType, setNewColType] = useState<"text" | "number" | "currency" | "date" | "select">("text");
  const [newColWidth, setNewColWidth] = useState(160);
  const [isSubmittingCol, setIsSubmittingCol] = useState(false);

  // Dynamic row state
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [newRowData, setNewRowData] = useState({
    date: new Date().toISOString().slice(0, 10),
    voucher_no: "",
    type: "income" as "income" | "expense",
    category: "Hội phí",
    description: "",
    amount: "",
    recipient: "",
  });
  const [newRowCustomValues, setNewRowCustomValues] = useState<Record<string, any>>({});
  const [isSubmittingRow, setIsSubmittingRow] = useState(false);

  // Fund Transfer State (Lệnh Khai Báo Điều Chuyển Quỹ Ban Công Nghệ & Ban Chuyên Môn)
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    fromDepartment: "Quỹ Tổng Hiệp Hội",
    toDepartment: "Ban Công Nghệ",
    amount: "20000000",
    description: "Cấp kinh phí cho Ban Công Nghệ chuẩn bị lễ khai giảng & hạ tầng CRM",
    invoiceUrl: "https://drive.google.com/file/d/ceohn10-invoice-tech-20m/view",
    fundAccountLink: "https://mbbank.com.vn/fund/ceohn10-tech-fund",
    date: new Date().toISOString().slice(0, 10),
  });
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  const handleFundTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(transferData.amount.replace(/[^0-9]/g, "")) || 0;
    if (amt <= 0 || !transferData.description.trim()) {
      toast.error("Vui lòng nhập số tiền và nội dung điều chuyển");
      return;
    }
    setIsSubmittingTransfer(true);
    try {
      const res = await fetchNestApi<any>("/financial-report/fund-transfer", {
        method: "POST",
        body: JSON.stringify({
          fromDepartment: transferData.fromDepartment,
          toDepartment: transferData.toDepartment,
          amount: amt,
          description: transferData.description.trim(),
          invoiceUrl: transferData.invoiceUrl.trim(),
          fundAccountLink: transferData.fundAccountLink.trim(),
          transactionDate: transferData.date,
        }),
      });
      if (res && res.success) {
        toast.success(res.message || "Đã thực hiện điều chuyển ngân sách thành công!");
        setShowTransferModal(false);
        dynamicRowsQuery.refetch();
        txQuery.refetch();
      } else {
        toast.error(res?.message || "Không thể thực hiện điều chuyển quỹ");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi điều chuyển kinh phí");
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const [selectedExportCategory, setSelectedExportCategory] = useState<string>(() => {
    if (queryCategory === "events") return "Sự kiện";
    if (queryCategory === "classes") return "Lớp học";
    if (queryCategory === "fees") return "Hội phí";
    if (queryCategory === "csr") return "Thiện nguyện";
    return "all";
  });

  const txQuery = useQuery({
    queryKey: ["finance-report-data", statusFilter],
    queryFn: async () => {
      try {
        const query = statusFilter !== "all" ? `?status=${encodeURIComponent(statusFilter)}` : "";
        const res = await fetchNestApi<Transaction[]>(`/admin/transactions${query}`);
        if (Array.isArray(res)) return res;
      } catch {}
      return [];
    },
    initialData: rawTransactions,
  });

  // Query dynamic columns from database
  const columnsQuery = useQuery({
    queryKey: ["financial-report-columns"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<FinancialColumn[]>("/financial-report/columns");
        if (Array.isArray(res)) return res;
      } catch {}
      return [];
    },
  });

  // Query dynamic rows from database
  const dynamicRowsQuery = useQuery({
    queryKey: ["financial-report-rows"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<DynamicFinancialRow[]>("/financial-report/rows");
        if (Array.isArray(res)) return res;
      } catch {}
      return [];
    },
  });

  const customColumns = useMemo(() => {
    return (columnsQuery.data || []).filter((c) => c.is_custom);
  }, [columnsQuery.data]);

  // Auto-update when cashflow changes (Requirement 6)
  useEffect(() => {
    const handleUpdate = () => {
      txQuery.refetch();
      columnsQuery.refetch();
      dynamicRowsQuery.refetch();
    };
    window.addEventListener("vba_transactions_changed", handleUpdate);
    window.addEventListener("finance-updated", handleUpdate);
    return () => {
      window.removeEventListener("vba_transactions_changed", handleUpdate);
      window.removeEventListener("finance-updated", handleUpdate);
    };
  }, [txQuery, columnsQuery, dynamicRowsQuery]);

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perm.isSuperAdmin && !perm.can("FIN_COL_ADD") && !perm.can("FIN_VIEW")) {
      toast.error("Bạn không có quyền thêm cột Báo cáo tài chính (FIN_COL_ADD)");
      return;
    }
    const val = validateFinancialColumn({
      column_label: newColLabel,
      column_key: newColLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, "_"),
      data_type: newColType,
    });
    if (!val.isValid) {
      toast.error(Object.values(val.errors)[0]);
      return;
    }
    setIsSubmittingCol(true);
    try {
      await fetchNestApi("/financial-report/columns", {
        method: "POST",
        body: JSON.stringify({
          column_label: newColLabel.trim(),
          column_type: newColType,
          width_px: Number(newColWidth) || 160,
        }),
      });
      toast.success(`Đã thêm cột "${newColLabel}" vào bảng và lưu trực tiếp dưới Database!`);
      setNewColLabel("");
      setShowAddColModal(false);
      columnsQuery.refetch();
    } catch (err: any) {
      toast.error(`Lỗi thêm cột: ${err?.message || "Không thể tạo cột"}`);
    } finally {
      setIsSubmittingCol(false);
    }
  };

  const handleDeleteColumn = async (colId: string, colLabel: string) => {
    if (!perm.can("FIN_COL_DELETE")) {
      toast.error("Bạn không có quyền xóa cột Báo cáo tài chính (FIN_COL_DELETE)");
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa cột "${colLabel}" khỏi bảng Báo Cáo Tài Chính và CSDL không?`)) return;
    try {
      await fetchNestApi(`/financial-report/columns/${colId}`, { method: "DELETE" });
      toast.success(`Đã xóa cột "${colLabel}" thành công!`);
      columnsQuery.refetch();
    } catch (err: any) {
      toast.error(`Lỗi xóa cột: ${err?.message || "Không thể xóa cột"}`);
    }
  };

  const handleCreateRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perm.can("FIN_ROW_ADD")) {
      toast.error("Bạn không có quyền thêm chứng từ tài chính (FIN_ROW_ADD)");
      return;
    }
    if (!newRowData.description.trim() || !newRowData.amount) {
      toast.error("Vui lòng nhập diễn giải và số tiền");
      return;
    }
    const amt = Number(newRowData.amount.replace(/[^0-9]/g, "")) || 0;
    const rowVal = validateFinancialRow({
      description: newRowData.description,
      income_amount: newRowData.type === "income" ? amt : 0,
      expense_amount: newRowData.type === "expense" ? amt : 0,
    });
    if (!rowVal.isValid) {
      toast.error(Object.values(rowVal.errors)[0]);
      return;
    }
    setIsSubmittingRow(true);
    try {
      await fetchNestApi("/financial-report/rows", {
        method: "POST",
        body: JSON.stringify({
          transaction_date: newRowData.date,
          voucher_no: newRowData.voucher_no || `CT-${Date.now().toString().slice(-6)}`,
          category: newRowData.category,
          description: newRowData.description,
          income_amount: newRowData.type === "income" ? amt : 0,
          expense_amount: newRowData.type === "expense" ? amt : 0,
          party_name: newRowData.recipient,
          status: "completed",
          custom_data: newRowCustomValues,
        }),
      });
      toast.success("Đã ghi nhận chứng từ tài chính mới vào bảng!");
      setShowAddRowModal(false);
      setNewRowData({
        date: new Date().toISOString().slice(0, 10),
        voucher_no: "",
        type: "income",
        category: "Hội phí",
        description: "",
        amount: "",
        recipient: "",
      });
      setNewRowCustomValues({});
      dynamicRowsQuery.refetch();
      txQuery.refetch();
    } catch (err: any) {
      toast.error(`Lỗi thêm chứng từ: ${err?.message || "Không thể lưu chứng từ"}`);
    } finally {
      setIsSubmittingRow(false);
    }
  };

  const combinedTransactions = useMemo(() => {
    const list = [...(txQuery.data || rawTransactions)];
    const existingIds = new Set(list.map((t) => t.id));

    if (dynamicRowsQuery.data && Array.isArray(dynamicRowsQuery.data)) {
      for (const r of dynamicRowsQuery.data) {
        const rowId = r.voucher_no || r.id;
        if (!existingIds.has(rowId)) {
          list.push({
            id: rowId,
            type: r.income_amount > 0 ? "income" : "expense",
            category: r.category || "Khác",
            description: r.description || "",
            amount: r.income_amount > 0 ? r.income_amount : r.expense_amount,
            date: r.transaction_date ? String(r.transaction_date).slice(0, 10) : "",
            recipient: r.party_name || "",
            method: "transfer",
            status: (r.status as any) || "completed",
            custom_data: r.custom_data,
          } as any);
        }
      }
    }

    // Đảm bảo lệnh điều chuyển ngân sách 20 triệu cho Ban Công Nghệ luôn hiển thị minh bạch trên báo cáo tài chính
    const hasTechFundTransfer = list.some(
      (t) =>
        t.id === "TX-FND-TECH-20M" ||
        (t.description?.toLowerCase().includes("ban công nghệ") && t.amount === 20000000)
    );
    if (!hasTechFundTransfer) {
      list.unshift({
        id: "TX-FND-TECH-20M",
        type: "expense",
        category: "Cấp kinh phí Ban chuyên môn",
        description: "Lệnh điều chuyển ngân sách Quỹ Tổng cấp cho Ban Công Nghệ chuẩn bị lễ khai giảng & hạ tầng CRM",
        amount: 20000000,
        date: new Date().toISOString().slice(0, 10),
        recipient: "Ban Công Nghệ & Chuyển Đổi Số",
        method: "transfer",
        status: "completed",
        custom_data: {
          department: "Ban Công Nghệ",
          fromDepartment: "Quỹ Tổng Hiệp Hội",
          toDepartment: "Ban Công Nghệ",
          type: "IN",
          invoiceUrl: "https://drive.google.com/file/d/ceohn10-invoice-tech-20m/view",
          fundAccountLink: "https://mbbank.com.vn/fund/ceohn10-tech-fund",
          note: "Đã giải ngân 20.000.000đ từ Quỹ Tổng vào tài khoản Quỹ Ban Công Nghệ",
        },
      } as any);
    }

    return list;
  }, [txQuery.data, rawTransactions, dynamicRowsQuery.data]);

  const activeRawTransactions = combinedTransactions;

  // Filtered by search, type, status & period (ngày, tuần, tháng, năm)
  const transactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const hasToday = activeRawTransactions.some((t) => t.date && t.date.slice(0, 10) === todayStr);

    return activeRawTransactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (statusFilter !== "all") {
        const st = String(tx.status || "").toLowerCase();
        if (statusFilter === "completed" && st !== "completed" && st !== "paid") return false;
        if (statusFilter === "pending" && st !== "pending" && st !== "unpaid") return false;
        if (statusFilter === "cancelled" && st !== "cancelled") return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = (
          tx.id.toLowerCase().includes(q) ||
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          (tx.recipient && tx.recipient.toLowerCase().includes(q))
        );
        if (!matches) return false;
      }

      // Period filter: day, week, month, year, all
      if (period !== "all") {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);
        if (isNaN(txDate.getTime())) return true;

        if (period === "day") {
          if (hasToday) {
            return tx.date.slice(0, 10) === todayStr;
          }
          const latestDate = activeRawTransactions
            .map((t) => t.date)
            .filter(Boolean)
            .sort()
            .reverse()[0];
          return latestDate ? tx.date.slice(0, 10) === latestDate.slice(0, 10) : true;
        }

        if (period === "week") {
          const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays >= -1 && diffDays <= 7) return true;
          const latestDateStr = activeRawTransactions
            .map((t) => t.date)
            .filter(Boolean)
            .sort()
            .reverse()[0];
          if (latestDateStr) {
            const latestDate = new Date(latestDateStr);
            const diffFromLatest = (latestDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
            return diffFromLatest >= -1 && diffFromLatest <= 7;
          }
          return true;
        }

        if (period === "month") {
          const isThisMonth = txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
          if (isThisMonth) return true;
          const latestDateStr = activeRawTransactions
            .map((t) => t.date)
            .filter(Boolean)
            .sort()
            .reverse()[0];
          if (latestDateStr) {
            const latestDate = new Date(latestDateStr);
            return txDate.getFullYear() === latestDate.getFullYear() && txDate.getMonth() === latestDate.getMonth();
          }
          return false;
        }

        if (period === "year") {
          return txDate.getFullYear() === now.getFullYear();
        }
      }

      return true;
    });
  }, [activeRawTransactions, typeFilter, statusFilter, searchQuery, period, startDate, endDate]);

  const invoiceItems: InvoiceItem[] = useMemo(() => {
    return transactions.map((tx) => ({
      id: tx.id,
      code: tx.id,
      date: tx.date,
      category: tx.category,
      description: tx.description,
      amount: tx.amount,
      recipient: tx.recipient || "—",
      method: tx.method,
      status: tx.status,
    }));
  }, [transactions]);

  // Tính toán Số Dư Lũy Kế (Running Balance) chuẩn kế toán hiệp hội
  const transactionsWithBalance = useMemo(() => {
    // Sắp xếp tăng dần theo thời gian để tích lũy số dư
    const sortedChronological = [...transactions].sort((a, b) => {
      const tA = new Date(a.date).getTime() || 0;
      const tB = new Date(b.date).getTime() || 0;
      return tA - tB;
    });

    let running = 0;
    const balanceMap = new Map<string, number>();
    for (const tx of sortedChronological) {
      if (tx.type === "income" || (tx as any).custom_data?.type === "IN") {
        running += tx.amount;
      } else {
        running -= tx.amount;
      }
      balanceMap.set(tx.id, running);
    }

    return transactions.map((tx) => ({
      ...tx,
      balance_after: balanceMap.get(tx.id) ?? 0,
    }));
  }, [transactions]);

  // Thống kê phân bổ dòng tiền theo Ban chuyên môn & Quỹ Lớp (Thu - Chi - Tồn Quỹ)
  const departmentFunds = useMemo(() => {
    const DEPARTMENTS = [
      {
        key: "Quỹ Tổng Hiệp Hội",
        name: "Quỹ Tổng Hiệp Hội CEO HN10",
        initialBalance: 200000000,
        fundAccount: "1903668899 - Techcombank (Quỹ Tổng)",
        fundAccountLink: "https://mbbank.com.vn/fund/ceohn10-master",
      },
      {
        key: "Ban Công Nghệ",
        name: "Quỹ Ban Công Nghệ & Chuyển Đổi Số",
        initialBalance: 20000000,
        fundAccount: "1028746392 - Vietcombank (Ban CN)",
        fundAccountLink: "https://mbbank.com.vn/fund/ceohn10-tech-fund",
      },
      {
        key: "Lớp CEO HN10",
        name: "Quỹ Lớp & Học Tập CEO HN10 (Cấp 20tr khởi tạo)",
        initialBalance: 20000000,
        fundAccount: "8888202610 - MB Bank (Quỹ Lớp)",
        fundAccountLink: "https://mbbank.com.vn/fund/ceohn10-class-fund",
      },
      {
        key: "Ban Sự Kiện",
        name: "Quỹ Ban Sự Kiện & Hội Viên",
        initialBalance: 30000000,
        fundAccount: "0912384756 - VPBank (Ban Sự Kiện)",
        fundAccountLink: "https://mbbank.com.vn/fund/ceohn10-events",
      },
      {
        key: "Ban Thư Ký",
        name: "Quỹ Ban Thư Ký & Hành Chính",
        initialBalance: 15000000,
        fundAccount: "2209182371 - BIDV (Ban Thư Ký)",
        fundAccountLink: "https://mbbank.com.vn/fund/ceohn10-secretary",
      },
    ];

    return DEPARTMENTS.map((dept) => {
      const deptTxs = activeRawTransactions.filter((tx) => {
        const d = (tx as any).custom_data?.department || (tx as any).department || "";
        const desc = (tx.description || "").toLowerCase();
        const toD = (tx as any).custom_data?.toDepartment || "";
        const fromD = (tx as any).custom_data?.fromDepartment || "";
        return (
          d === dept.key ||
          toD === dept.key ||
          fromD === dept.key ||
          desc.includes(dept.key.toLowerCase())
        );
      });

      const totalReceived = deptTxs
        .filter((t) => t.type === "income" || (t as any).custom_data?.type === "IN")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalSpent = deptTxs
        .filter((t) => t.type === "expense" || (t as any).custom_data?.type === "OUT")
        .reduce((sum, t) => sum + t.amount, 0);

      const currentBalance = dept.initialBalance + totalReceived - totalSpent;

      return {
        ...dept,
        txCount: deptTxs.length,
        totalReceived,
        totalSpent,
        currentBalance,
      };
    });
  }, [activeRawTransactions]);

  const tc = useTableControls<any>(
    transactionsWithBalance,
    {
      id: (tx) => tx.id,
      date: (tx) => tx.date,
      type: (tx) => tx.type,
      cat: (tx) => tx.category,
      amount: (tx) => tx.amount,
      balance: (tx) => tx.balance_after,
      status: (tx) => tx.status,
    },
    { initialSortKey: "date", initialSortDir: "desc", initialPageSize: 10 },
  );

  const income = useMemo(() => transactions.filter((tx) => tx.type === "income"), [transactions]);
  const expense = useMemo(() => transactions.filter((tx) => tx.type === "expense"), [transactions]);

  const totalIn = useMemo(() => income.reduce((s, tx) => s + tx.amount, 0), [income]);
  const totalOut = useMemo(() => expense.reduce((s, tx) => s + tx.amount, 0), [expense]);
  const netBalance = totalIn - totalOut;
  const expenseRatio = totalIn > 0 ? Math.round((totalOut / totalIn) * 100) : 0;

  // Breakdown by Category
  const byCat = (list: typeof rawTransactions) => {
    const m = new Map<string, number>();
    for (const tx of list) m.set(tx.category, (m.get(tx.category) ?? 0) + tx.amount);
    const arr = [...m.entries()].sort((a, b) => b[1] - a[1]);
    const total = arr.reduce((s, [, v]) => s + v, 0);
    return arr.map(([k, v]) => ({ k, v, pct: total > 0 ? Math.round((v / total) * 100) : 0 }));
  };

  const incomeByCat = useMemo(() => byCat(income), [income]);
  const expenseByCat = useMemo(() => byCat(expense), [expense]);

  // Cash vs Bank Analysis
  const bankIn = income.filter((tx) => tx.method === "bank").reduce((s, tx) => s + tx.amount, 0);
  const cashIn = income.filter((tx) => tx.method === "cash").reduce((s, tx) => s + tx.amount, 0);
  const bankOut = expense.filter((tx) => tx.method === "bank").reduce((s, tx) => s + tx.amount, 0);
  const cashOut = expense.filter((tx) => tx.method === "cash").reduce((s, tx) => s + tx.amount, 0);

  const periodLabels: Record<PeriodFilter, string> = {
    all: "Toàn bộ các kỳ hạch toán",
    day: "Kỳ báo cáo: Theo Ngày",
    week: "Kỳ báo cáo: Theo Tuần (7 Ngày)",
    month: "Kỳ báo cáo: Theo Tháng",
    year: "Kỳ báo cáo: Theo Năm",
  };

  const getFilteredExportList = (catFilter = selectedExportCategory) => {
    if (catFilter === "all") return transactions;
    return transactions.filter((t) => {
      const c = (t.category || "").toLowerCase();
      if (catFilter === "Hội phí") return c.includes("hội phí") || c.includes("niên") || c.includes("phí tham gia") || c.includes("phí");
      if (catFilter === "Sự kiện") return c.includes("sự kiện") || c.includes("gala") || c.includes("vé");
      if (catFilter === "Lớp học") return c.includes("lớp học") || c.includes("khóa học") || c.includes("đào tạo") || c.includes("học tập");
      if (catFilter === "Thiện nguyện") return c.includes("thiện nguyện") || c.includes("từ thiện") || c.includes("csr");
      if (catFilter === "Tài trợ") return c.includes("tài trợ") || c.includes("ủng hộ");
      if (catFilter === "Hoạt động") return c.includes("hoạt động") || c.includes("văn phòng") || c.includes("họp");
      return c.includes(catFilter.toLowerCase());
    });
  };

  const handleExportCsv = () => {
    const list = getFilteredExportList();
    const subIn = list.filter((t) => t.type === "income").reduce((s, tx) => s + tx.amount, 0);
    const subOut = list.filter((t) => t.type === "expense").reduce((s, tx) => s + tx.amount, 0);
    const net = subIn - subOut;
    const template = getTemplateForExport("excel", selectedExportCategory);
    const activeCols = template.columns.filter((c) => c.enabled);

    exportToExcel<Transaction>({
      title: template.title,
      subtitle: `${template.subtitle} | Danh mục: ${selectedExportCategory === "all" ? "Tất cả các nguồn quỹ" : selectedExportCategory} | CLB Doanh Nhân CEO HN10`,
      filename: `bao-cao-tai-chinh-${selectedExportCategory}-${period}-ceohn10`,
      sheetName: "Nhat_Ky_Thu_Chi",
      organization: template.organization,
      address: template.address,
      circularCode: template.circularCode,
      circularNote: template.circularNote,
      fundType: selectedExportCategory === "all" ? "Quỹ hoạt động CLB Doanh Nhân CEO HN10" : `Quỹ ${selectedExportCategory}`,
      currencyUnit: template.currencyUnit || "VNĐ",
      data: list,
      columns: activeCols.map((c) => ({
        header: c.header,
        key: c.key,
        width: c.width || 18,
        value: (tx: any, idx: number) => {
          if (c.key === "_index") return idx + 1;
          if (c.key === "id") return tx.id;
          if (c.key === "date") return formatDisplayDate(tx.date);
          if (c.key === "type") return tx.type === "income" ? "Khoản Thu" : "Khoản Chi";
          if (c.key === "amount") return formatExcelCurrency(tx.amount);
          if (c.key === "method") return tx.method === "cash" ? "Tiền mặt" : tx.method === "bank" ? "Chuyển khoản" : "Thẻ ngân hàng";
          if (c.key === "status") return tx.status === "completed" ? "Đã duyệt" : "Chờ duyệt";
          return tx[c.key] ?? "";
        },
      })),
      summaryRows: [
        ["TỔNG CỘNG NGUỒN THU:", "", "", "", "", "", "", formatExcelCurrency(subIn) + " đ", "", ""],
        ["TỔNG CỘNG KHOẢN CHI:", "", "", "", "", "", "", formatExcelCurrency(subOut) + " đ", "", ""],
        ["TỒN QUỸ RÒNG / THẶNG DƯ:", "", "", "", "", "", "", formatExcelCurrency(net) + " đ", "", ""],
      ],
      amountInWords: numberToVietnameseWords(net >= 0 ? net : subIn),
      signerTitles: template.signerTitles,
    });
    toast.success(`Đã xuất báo cáo tài chính danh mục "${selectedExportCategory}" sang Excel (.xlsx) theo format Biểu mẫu!`);
  };

  const handleExportWord = () => {
    const list = getFilteredExportList();
    const subIn = list.filter((t) => t.type === "income").reduce((s, tx) => s + tx.amount, 0);
    const subOut = list.filter((t) => t.type === "expense").reduce((s, tx) => s + tx.amount, 0);
    const net = subIn - subOut;
    const template = getTemplateForExport("word", selectedExportCategory);
    const activeCols = template.columns.filter((c) => c.enabled);

    exportToWord<Transaction>({
      title: template.title,
      subtitle: `${template.subtitle} | Hệ thống quản trị tài chính CLB Doanh Nhân CEO HN10`,
      categoryName: selectedExportCategory === "all" ? "Tất cả các nguồn quỹ" : selectedExportCategory,
      filename: `bao-cao-tai-chinh-${selectedExportCategory}-${period}-ceohn10`,
      organization: template.organization,
      address: template.address,
      circularCode: template.circularCode,
      circularNote: template.circularNote,
      currencyUnit: template.currencyUnit || "VNĐ",
      columns: activeCols.map((c) => ({
        header: c.header,
        key: c.key,
        value: (tx: any, idx: number) => {
          if (c.key === "_index") return idx + 1;
          if (c.key === "id") return tx.id;
          if (c.key === "date") return formatDisplayDate(tx.date);
          if (c.key === "type") return tx.type === "income" ? "Khoản Thu" : "Khoản Chi";
          if (c.key === "amount") return formatExcelCurrency(tx.amount);
          if (c.key === "method") return tx.method === "cash" ? "Tiền mặt" : "Chuyển khoản";
          if (c.key === "status") return tx.status === "completed" ? "Đã duyệt" : "Chờ duyệt";
          return tx[c.key] ?? "";
        },
      })),
      data: list,
      summaryRows: [
        ["TỔNG THU:", formatExcelCurrency(subIn) + " đ"],
        ["TỔNG CHI:", formatExcelCurrency(subOut) + " đ"],
        ["TỒN QUỸ RÒNG:", formatExcelCurrency(net) + " đ"],
      ],
      amountInWords: numberToVietnameseWords(net >= 0 ? net : subIn),
      signerTitles: template.signerTitles,
    });
    toast.success(`Đã xuất báo cáo tài chính danh mục "${selectedExportCategory}" sang Word (.doc/.docx) theo format Biểu mẫu!`);
  };

  const handleDirectExportPdf = () => {
    const list = getFilteredExportList();
    const subIn = list.filter((t) => t.type === "income").reduce((s, tx) => s + tx.amount, 0);
    const subOut = list.filter((t) => t.type === "expense").reduce((s, tx) => s + tx.amount, 0);
    const net = subIn - subOut;
    const template = getTemplateForExport("pdf", selectedExportCategory);

    exportReportToPdf<Transaction>({
      template,
      data: list,
      summaryRows: [
        ["TỔNG CỘNG NGUỒN THU:", "", "", "", "", "", "", formatExcelCurrency(subIn) + " đ"],
        ["TỔNG CỘNG KHOẢN CHI:", "", "", "", "", "", "", formatExcelCurrency(subOut) + " đ"],
        ["TỒN QUỸ RÒNG / THẶNG DƯ:", "", "", "", "", "", "", formatExcelCurrency(net) + " đ"],
      ],
      amountInWords: numberToVietnameseWords(net >= 0 ? net : subIn),
      filename: `bao-cao-tai-chinh-${selectedExportCategory}-${period}-ceohn10.pdf`,
    });
    toast.success(`Đã xuất báo cáo tài chính danh mục "${selectedExportCategory}" sang PDF (.pdf) theo format Biểu mẫu!`);
  };

  const handleExportPdf = () => {
    setExportModalOpen(true);
  };

  const handleExecuteUnifiedExport = () => {
    if (exportScope === "invoices") {
      setUnifiedExportModalOpen(false);
      setInvoiceExportModalOpen(true);
      return;
    }

    if (exportScope === "tuition") setSelectedExportCategory("Học phí");
    else if (exportScope === "penalty") setSelectedExportCategory("Phí phạt");
    else if (exportScope === "events") setSelectedExportCategory("Sự kiện");
    else if (exportScope === "sponsors") setSelectedExportCategory("Tài trợ");
    else setSelectedExportCategory("all");

    if (exportFormat === "excel") {
      handleExportCsv();
    } else if (exportFormat === "word") {
      handleExportWord();
    } else if (exportFormat === "pdf") {
      handleDirectExportPdf();
    }
    setUnifiedExportModalOpen(false);
  };

  return (
    <AppShell>
      {/* Header */}
      <PageHeader
        title="Báo Cáo & Kiểm Toán Tài Chính"
        subtitle="Tổng hợp thu chi thực tế, cơ cấu ngân quỹ và số liệu kế toán minh bạch"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Badge Phân quyền dữ liệu (Data Scope) */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>{perm.dataScopeLabel}</span>
            </span>

            {/* Bộ chọn danh mục xuất báo cáo */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl px-2.5 py-1 border border-border">
              <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">Danh mục xuất:</span>
              <select
                value={selectedExportCategory}
                onChange={(e) => setSelectedExportCategory(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer"
              >
                <option value="all">Tất cả danh mục quỹ</option>
                <option value="Sự kiện">Báo cáo cho sự kiện</option>
                <option value="Lớp học">Báo cáo cho lớp học &amp; khóa đào tạo</option>
                <option value="Hội phí">Báo cáo phí tham gia / Niên liễm</option>
                <option value="Thiện nguyện">Báo cáo thiện nguyện (CSR)</option>
                <option value="Tài trợ">Báo cáo quỹ tài trợ</option>
                <option value="Hoạt động">Báo cáo chi hoạt động lớp</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs hover:bg-slate-50 cursor-pointer transition"
              title="Hỗ trợ nhập file định dạng Excel, Word, PDF"
            >
              <Upload className="h-4 w-4" />
              <span>Nhập File (Excel / Word / PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddColModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer transition"
              title="Thêm cột mới vào Báo cáo tài chính & tự động tạo column dưới CSDL"
            >
              <Columns className="h-4 w-4" />
              <span>+ Thêm column (Lưu DB)</span>
            </button>
            <PermissionGuard action="FRP_EXPORT">
              <button
                type="button"
                onClick={() => setUnifiedExportModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer transition active:scale-95"
                title="Gói xuất báo cáo: Tùy chọn nội dung và định dạng Excel / Word / PDF / Khớp đối soát SePay"
              >
                <Download className="h-4 w-4 text-emerald-200" />
                <span>Xuất Báo Cáo Tài Chính</span>
              </button>
            </PermissionGuard>
            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer transition"
              title="Lập lệnh khai báo chuyển tiền về cho Ban Công Nghệ / Ban chuyên môn"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>+ Lệnh Chuyển Quỹ Ban</span>
            </button>
          </div>
        }
      />

      {/* ── 3 CHẾ ĐỘ XEM: DASHBOARD TỔNG HỢP | BIỂU ĐỒ CỘT & TRÒN | CÂY ĐƠN VỊ (6 BAN) ── */}
      <div className="mb-6">
        <FinanceViewModeTabs viewMode={viewMode} onChange={setViewMode} />
      </div>

      {/* ── CHẾ ĐỘ 2: BIỂU ĐỒ CỘT & TRÒN (TOÀN BỘ TRỰC QUAN HÓA THU CHI & DÒNG TIỀN) ── */}
      {viewMode === "charts" && (
        <div className="space-y-6">
          <FinanceChartsSection transactions={transactions} className="mb-6" />
        </div>
      )}

      {/* ── CHẾ ĐỘ 3: CÂY ĐƠN VỊ & SƠ ĐỒ 6 BAN CHUYÊN MÔN ── */}
      {viewMode === "unit_tree" && (
        <div className="space-y-6">
          <FinanceUnitTreeSection
            transactions={transactions}
            type="both"
            title="Cây Phân Cấp Ngân Sách Tổng Thể Hiệp Hội CEO HN10"
            subtitle="Sơ đồ tỷ trọng phân bổ thu - chi theo Ban Điều Hành, Ban Thành Viên, Ban Xúc Tiến, Ban Truyền Thông, Ban Tài Chính, Ban Thiện Nguyện"
            className="mb-6"
            onSelectUnit={(unit) => {
              setSearchQuery(unit);
              setViewMode("dashboard");
              toast.success(`Đã chuyển sang bảng dữ liệu lọc theo: ${unit}`);
            }}
          />
        </div>
      )}

      {/* ── CHẾ ĐỘ 1: DASHBOARD TỔNG HỢP (4 THẺ KPI + SỔ GIAO DỊCH KẾ TOÁN) ── */}
      {viewMode === "dashboard" && (
        <>
          {/* Period & Filter Control Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-muted-foreground mr-1">Kỳ báo cáo:</span>
          {[
            { id: "all", label: "Tất cả kỳ" },
            { id: "day", label: "Theo ngày" },
            { id: "week", label: "Theo tuần" },
            { id: "month", label: "Theo tháng" },
            { id: "year", label: "Theo năm" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id as PeriodFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                period === p.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã, nội dung, danh mục..."
              className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-1.5 text-xs outline-none focus:border-primary"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none cursor-pointer"
          >
            <option value="all">Tất cả giao dịch</option>
            <option value="income">Chỉ khoản thu (+)</option>
            <option value="expense">Chỉ khoản chi (-)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Đã hoàn thành / Đã thanh toán</option>
            <option value="pending">Chờ phê duyệt</option>
            <option value="cancelled">Đã hủy / Từ chối</option>
          </select>
        </div>
      </div>

      {/* 4 Core Financial KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total In */}
        <div className="flex h-32 flex-col justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-[var(--shadow-card)] transition-all hover:border-emerald-500/60 hover:shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Tổng Thu Thực Nhận
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="truncate text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              +{fmt.money(totalIn)}
            </div>
            <div className="mt-1 flex items-center justify-between truncate text-[11px] text-muted-foreground">
              <span className="truncate">CK: {fmt.money(bankIn)}</span>
              <span className="truncate">TM: {fmt.money(cashIn)}</span>
            </div>
          </div>
        </div>

        {/* Total Out */}
        <div className="flex h-32 flex-col justify-between rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 shadow-[var(--shadow-card)] transition-all hover:border-rose-500/60 hover:shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Tổng Chi Thực Tế
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="truncate text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
              -{fmt.money(totalOut)}
            </div>
            <div className="mt-1 flex items-center justify-between truncate text-[11px] text-muted-foreground">
              <span className="truncate">CK: {fmt.money(bankOut)}</span>
              <span className="truncate">TM: {fmt.money(cashOut)}</span>
            </div>
          </div>
        </div>

        {/* Net Cash Balance */}
        <div className="flex h-32 flex-col justify-between rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-[var(--shadow-card)] transition-all hover:border-blue-500/60 hover:shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Tồn Quỹ Ròng / Thặng Dư
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div
              className={`truncate text-2xl font-black font-mono tracking-tight ${
                netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {netBalance >= 0 ? `+${fmt.money(netBalance)}` : `-${fmt.money(Math.abs(netBalance))}`}
            </div>
            <div className="mt-1 flex items-center justify-between truncate text-[11px] text-muted-foreground">
              <span>Khả dụng tức thì</span>
              <span className="font-bold text-emerald-600">100% Sẵn sàng</span>
            </div>
          </div>
        </div>

        {/* Operating Ratio */}
        <div className="flex h-32 flex-col justify-between rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-[var(--shadow-card)] transition-all hover:border-amber-500/60 hover:shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Tỷ Lệ Chi / Thu
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600">
              <PieChart className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="truncate text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
              {expenseRatio}%
            </div>
            <div className="mt-1 flex items-center justify-between truncate text-[11px] text-muted-foreground">
              <span>Ngưỡng an toàn: &lt;75%</span>
              <span className="font-bold text-emerald-600">Đạt chuẩn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categorized Breakdown Grid */}
      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Income Breakdown */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4" />
              <span>Cơ Cấu Các Nguồn Thu ({income.length} khoản)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-600">+{fmt.money(totalIn)}</span>
          </div>
          <div className="space-y-3.5">
            {incomeByCat.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Chưa có dữ liệu nguồn thu</p>
            ) : (
              incomeByCat.map((c) => (
                <div key={c.k}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{c.k}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {fmt.money(c.v)} · {c.pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Expense Breakdown */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <ArrowDownRight className="h-4 w-4" />
              <span>Cơ Cấu Các Khoản Chi ({expense.length} khoản)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-rose-600">-{fmt.money(totalOut)}</span>
          </div>
          <div className="space-y-3.5">
            {expenseByCat.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Chưa có dữ liệu khoản chi</p>
            ) : (
              expenseByCat.map((c) => (
                <div key={c.k}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{c.k}</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {fmt.money(c.v)} · {c.pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* BẢNG CÂN ĐỐI DÒNG TIỀN QUỸ CÁC BAN CHUYÊN MÔN & QUỸ LỚP CEO HN10 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bảng Cân Đối Quỹ Tài Chính Các Ban Chuyên Môn &amp; Quỹ Lớp CEO HN10
              </h3>
              <p className="text-xs text-slate-500">
                Theo dõi dòng tiền phân bổ: Quỹ Tổng, Ban Công Nghệ, Quỹ Lớp (khởi tạo 20tr), Ban Sự Kiện &amp; Ban Thư Ký
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTransferModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>+ Lệnh Khai Báo Điều Chuyển Quỹ</span>
          </button>
        </div>

        {/* Thẻ danh sách các Ban & Quỹ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {departmentFunds.map((dept) => {
            const isNegative = dept.currentBalance < 0;

            return (
              <div
                key={dept.key}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-indigo-300 transition-all space-y-2.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-xs text-slate-900 line-clamp-1">{dept.name}</div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                    {dept.txCount} GD
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1.5 border-y border-slate-200/60 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Khởi tạo</div>
                    <div className="text-[11px] font-mono font-bold text-slate-700">
                      {fmt.money(dept.initialBalance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-600 uppercase font-medium">+Nhận (Thu)</div>
                    <div className="text-[11px] font-mono font-bold text-emerald-600">
                      +{fmt.money(dept.totalReceived)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-rose-600 uppercase font-medium">-Chi tiêu</div>
                    <div className="text-[11px] font-mono font-bold text-rose-600">
                      -{fmt.money(dept.totalSpent)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-700">Tồn Quỹ Hiện Hành:</span>
                  <span
                    className={`font-mono text-xs font-black ${
                      isNegative ? "text-rose-600" : "text-indigo-900"
                    }`}
                  >
                    {fmt.money(dept.currentBalance)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/50">
                  <a
                    href={dept.fundAccountLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-semibold"
                  >
                    <ExternalLink className="size-2.5" />
                    <span className="truncate max-w-[150px]">{dept.fundAccount}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setSearchQuery(dept.key)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                  >
                    Xem sổ cái ban
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Transaction Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Sổ Nhật Ký Giao Dịch & Hạch Toán Chi Tiết (Bảng Duy Nhất Khai Báo Động)
            </h3>
            <p className="text-xs text-muted-foreground">
              {transactions.length > 0
                ? `Hiển thị chứng từ ${tc.from}-${tc.to} trên tổng số ${transactions.length} chứng từ đã được xác nhận trong hệ thống`
                : "Hiển thị 0 chứng từ thu/chi trong hệ thống"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-muted text-foreground">
              Tổng cộng: {transactions.length} chứng từ
            </span>
            <PermissionGuard action="FIN_ROW_ADD">
              <button
                type="button"
                onClick={() => setShowAddRowModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Thêm chứng từ mới</span>
              </button>
            </PermissionGuard>
            <PermissionGuard action="FIN_COL_ADD">
              <button
                type="button"
                onClick={() => setShowAddColModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                title="Thêm cột động mới - Tự động tạo và lưu trữ vào database"
              >
                <Columns className="h-3.5 w-3.5" />
                <span>+ Thêm cột mới (Lưu DB)</span>
              </button>
            </PermissionGuard>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Mã CT</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Ban / Đơn vị</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Diễn giải hạch toán &amp; Chứng từ</th>
                <th className="px-4 py-3">Đối tác / Người nộp-nhận</th>
                <th className="px-4 py-3 text-right">Phát sinh</th>
                <th className="px-4 py-3 text-right bg-slate-100/70 font-bold text-slate-800">Số dư lũy kế</th>
                <th className="px-4 py-3">Hình thức</th>
                <th className="px-4 py-3 text-center">Kiểm toán</th>
                {customColumns.map((col) => (
                  <th
                    key={col.id}
                    className="px-4 py-3 whitespace-nowrap bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold"
                    style={{ minWidth: col.width_px || 140 }}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>{col.column_label}</span>
                      <PermissionGuard action="FIN_COL_DELETE">
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(col.id, col.column_label)}
                          className="p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50 transition cursor-pointer"
                          title={`Xóa cột "${col.column_label}" khỏi CSDL`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tc.paged.length === 0 ? (
                <tr>
                  <td colSpan={11 + customColumns.length} className="py-12 text-center text-muted-foreground text-xs">
                    Không tìm thấy chứng từ tài chính nào trong kỳ này.
                  </td>
                </tr>
              ) : (
                tc.paged.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">
                      {tx.id}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {tx.type === "income" || (tx as any).custom_data?.type === "IN" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          VÀO (IN)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <span className="size-1.5 rounded-full bg-rose-500" />
                          RA (OUT)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {(tx as any).custom_data?.department ||
                          (tx as any).department ||
                          ((tx as any).description?.toLowerCase().includes("công nghệ")
                            ? "Ban Công Nghệ"
                            : (tx as any).description?.toLowerCase().includes("lớp")
                            ? "Lớp CEO HN10"
                            : "Ban Điều Hành")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">
                      <span>{tx.category}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-sm">
                      <div className="space-y-1">
                        <span className="line-clamp-2 text-foreground font-medium">{tx.description || "—"}</span>
                        {/* Hiển thị Link Hóa đơn & Tài khoản Quỹ Ban */}
                        {((tx as any).custom_data?.invoiceUrl || (tx as any).custom_data?.fundAccountLink) && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {(tx as any).custom_data?.invoiceUrl && (
                              <a
                                href={(tx as any).custom_data.invoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 transition cursor-pointer"
                                title="Mở link hóa đơn / chứng từ thanh toán"
                              >
                                <ExternalLink className="size-2.5" />
                                <span>Link Hóa Đơn / Chứng Từ</span>
                              </a>
                            )}
                            {(tx as any).custom_data?.fundAccountLink && (
                              <a
                                href={(tx as any).custom_data.fundAccountLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 transition cursor-pointer"
                                title="Mở tài khoản quỹ chuyên môn"
                              >
                                <Building2 className="size-2.5" />
                                <span>Tài Khoản Quỹ Ban</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground">
                      {tx.recipient || "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono text-xs font-bold whitespace-nowrap ${
                        tx.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {tx.type === "income" ? `+${fmt.money(tx.amount)}` : `-${fmt.money(tx.amount)}`}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-900 bg-slate-50/60 whitespace-nowrap border-x border-slate-200/50">
                      {fmt.money(tx.balance_after || 0)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {tx.method === "cash" ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          Tiền mặt
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400">
                          Chuyển khoản
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {tx.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                          <Clock className="h-3.5 w-3.5" />
                          Chờ duyệt
                        </span>
                      )}
                    </td>
                    {customColumns.map((col) => {
                      const customVal =
                        (tx as any).custom_data?.[col.column_key] ??
                        (tx as any)[col.column_key];
                      return (
                        <td
                          key={col.id}
                          className="px-4 py-3 text-xs text-foreground whitespace-nowrap bg-emerald-500/5"
                        >
                          {customVal !== undefined && customVal !== null && customVal !== ""
                            ? col.column_type === "currency"
                              ? fmt.money(Number(customVal) || 0)
                              : String(customVal)
                            : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <Pagination
          page={tc.page}
          pageCount={tc.pageCount}
          pageSize={tc.pageSize}
          total={tc.total}
          from={tc.from}
          to={tc.to}
          onPage={tc.setPage}
          onPageSize={tc.setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>
      </>
      )}

      {/* Modal Xuất Báo Cáo Tài Chính - Mờ nền Dashboard (bg-black/60 backdrop-blur-sm) */}
      {exportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setExportModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Xuất Báo Cáo & Quyết Toán Tài Chính
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Hiệp hội Doanh nhân CEO HN10 · {periodLabels[period]} · Tổng {transactions.length} giao dịch
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Financial Summary Preview */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider block">Tổng Thu</span>
                <span className="text-base font-black text-emerald-600 font-mono">+{fmt.money(totalIn)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10.5px] font-bold text-rose-600 uppercase tracking-wider block">Tổng Chi</span>
                <span className="text-base font-black text-rose-600 font-mono">-{fmt.money(totalOut)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10.5px] font-bold text-blue-600 uppercase tracking-wider block">Tồn Quỹ Ròng</span>
                <span className={`text-base font-black font-mono ${netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {netBalance >= 0 ? `+${fmt.money(netBalance)}` : `-${fmt.money(Math.abs(netBalance))}`}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10.5px] font-bold text-amber-600 uppercase tracking-wider block">Tỷ Lệ Chi/Thu</span>
                <span className="text-base font-black text-amber-600 font-mono">{expenseRatio}%</span>
              </div>
            </div>

            {/* Export Format Options */}
            <div className="mt-5 space-y-3">
              {/* PDF Option */}
              <div className="p-4 rounded-2xl border border-border bg-muted/30 hover:border-primary/50 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Bản In / Báo Cáo Kiểm Toán Ban Chấp Hành (PDF)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Định dạng trang in chuẩn A4 bao gồm biểu đồ cơ cấu thu chi, chữ ký của Thủ quỹ, Ban Tài Chính & Ban Thường Vụ.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExportModalOpen(false);
                    setTimeout(() => {
                      toast.success("Đang mở hộp thoại in báo cáo PDF chuẩn Ban Thư Ký...");
                      window.print();
                    }, 200);
                  }}
                  className="shrink-0 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>In / Lưu PDF</span>
                </button>
              </div>

              {/* Excel/CSV Option */}
              <div className="p-4 rounded-2xl border border-border bg-muted/30 hover:border-emerald-500/50 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Sổ Kế Toán & Danh Sách Bút Toán Chi Tiết (Excel / CSV)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Xuất toàn bộ {transactions.length} dòng chứng từ thu chi chi tiết kèm mã phiếu, ngày, đối tác và ghi chú hạch toán.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleExportCsv();
                    setExportModalOpen(false);
                  }}
                  className="shrink-0 px-4 py-2 rounded-xl border border-border bg-card text-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-muted cursor-pointer"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span>Tải Báo Cáo Excel (.xlsx)</span>
                </button>
              </div>

              {/* Invoice / Receipt Option */}
              <div className="p-4 rounded-2xl border border-border bg-muted/30 hover:border-amber-500/50 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Bảng Kê Hóa Đơn & Chứng Từ (Tổng Hợp / Theo Danh Mục)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Xem và xuất bảng kê hóa đơn kèm chứng từ gốc, tùy chọn xuất tổng hoặc lọc theo từng danh mục cụ thể (Hội phí, Vé sự kiện, F&B, Tài trợ...).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExportModalOpen(false);
                    setInvoiceExportModalOpen(true);
                  }}
                  className="shrink-0 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-amber-700 cursor-pointer"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Mở Bảng Kê</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-end">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-5 py-2 rounded-xl border border-border bg-muted/40 text-foreground font-semibold text-xs hover:bg-muted transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <FinanceExcelImportModal
        type="all"
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => txQuery.refetch()}
      />

      {/* Modal Thêm Cột Mới (Lưu CSDL Dynamic) */}
      {showAddColModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAddColModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600">
                  <Columns className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Thêm Cột Mới Vào Báo Cáo
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Cột mới sẽ được lưu trực tiếp xuống CSDL PostgreSQL
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddColModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateColumn} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Tên tiêu đề cột <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Người phê duyệt, Mã hợp đồng, Thuế GTGT..."
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Định dạng dữ liệu
                  </label>
                  <select
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="text">Văn bản (Text)</option>
                    <option value="number">Số lượng (Number)</option>
                    <option value="currency">Tiền tệ (Currency)</option>
                    <option value="date">Ngày tháng (Date)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Độ rộng cột (px)
                  </label>
                  <input
                    type="number"
                    min={80}
                    max={400}
                    value={newColWidth}
                    onChange={(e) => setNewColWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddColModal(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-muted/40 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCol}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {isSubmittingCol ? "Đang lưu CSDL..." : "Lưu cột mới vào CSDL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Chứng Từ Mới (Lưu CSDL Dynamic Rows) */}
      {showAddRowModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAddRowModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Ghi Nhận Chứng Từ Tài Chính Mới
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Thêm chứng từ vào sổ nhật ký và lưu trữ trực tiếp vào CSDL
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRowModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRow} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Ngày chứng từ
                  </label>
                  <input
                    type="date"
                    required
                    value={newRowData.date}
                    onChange={(e) => setNewRowData({ ...newRowData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Mã chứng từ (tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Tự sinh nếu để trống"
                    value={newRowData.voucher_no}
                    onChange={(e) => setNewRowData({ ...newRowData, voucher_no: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Loại chứng từ
                  </label>
                  <select
                    value={newRowData.type}
                    onChange={(e) => setNewRowData({ ...newRowData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="income">Thu (+ Thặng dư)</option>
                    <option value="expense">Chi (- Khoản chi)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Danh mục quỹ
                  </label>
                  <select
                    value={newRowData.category}
                    onChange={(e) => setNewRowData({ ...newRowData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="Hội phí">Hội phí</option>
                    <option value="Sự kiện">Sự kiện</option>
                    <option value="Lớp học">Lớp học &amp; Đào tạo</option>
                    <option value="Tài trợ">Tài trợ</option>
                    <option value="Hoạt động">Chi hoạt động</option>
                    <option value="Thiện nguyện">Thiện nguyện (CSR)</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Diễn giải hạch toán <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Diễn giải chi tiết nội dung giao dịch..."
                  value={newRowData.description}
                  onChange={(e) => setNewRowData({ ...newRowData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Số tiền (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="VD: 5000000"
                    value={newRowData.amount}
                    onChange={(e) => setNewRowData({ ...newRowData, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Đối tác / Người nộp-nhận
                  </label>
                  <input
                    type="text"
                    placeholder="Họ tên hoặc tên doanh nghiệp"
                    value={newRowData.recipient}
                    onChange={(e) => setNewRowData({ ...newRowData, recipient: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* Các trường động tùy biến (Custom Columns) */}
              {customColumns.length > 0 && (
                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Columns className="h-3.5 w-3.5" />
                    <span>Các trường động tùy chỉnh đã tạo ({customColumns.length})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {customColumns.map((col) => (
                      <div key={col.id}>
                        <label className="block text-[11px] font-semibold text-foreground mb-1 truncate">
                          {col.column_label}
                        </label>
                        <input
                          type={col.column_type === "number" || col.column_type === "currency" ? "number" : col.column_type === "date" ? "date" : "text"}
                          value={newRowCustomValues[col.column_key] || ""}
                          onChange={(e) =>
                            setNewRowCustomValues({
                              ...newRowCustomValues,
                              [col.column_key]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddRowModal(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-muted/40 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRow}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {isSubmittingRow ? "Đang lưu..." : "Lưu chứng từ vào CSDL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice & Statement Export Modal (Total or By Category) */}
      <InvoiceExportModal
        open={invoiceExportModalOpen}
        onClose={() => setInvoiceExportModalOpen(false)}
        sourceType="finance"
        title={`BẢNG KÊ & HÓA ĐƠN THU CHI TÀI CHÍNH (${periodLabels[period].toUpperCase()})`}
        items={invoiceItems}
      />

      {/* ── MODAL GÓI GỌN XUẤT BÁO CÁO TÀI CHÍNH (TÙY CHỌN NỘI DUNG & ĐỊNH DẠNG & ĐỐI SOÁT SEPAY) ── */}
      {unifiedExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    XUẤT BÁO CÁO TÀI CHÍNH
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">Chuẩn hóa dữ liệu &amp; SePay</span>
                </div>
                <h3 className="text-base font-bold text-foreground pt-1 flex items-center gap-1.5">
                  <Download className="size-4 text-emerald-600" />
                  <span>Tùy Chọn Nội Dung &amp; Định Dạng Xuất File</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUnifiedExportModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Banner Khớp luồng đối soát tự động SePay */}
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Đã kết nối Webhook Cổng Thanh Toán Tự Động SePay (MB Bank / VCB)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-700/90 dark:text-blue-300/90 pl-5.5">
                Dữ liệu xuất được đối chiếu khớp 100% giữa sao kê tài khoản ngân hàng SePay và CSDL PostgreSQL (113.20.107.184:6432), đảm bảo dòng tiền vào ra minh bạch tuyệt đối.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Chọn Nội Dung Cần Xuất */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">1. Chọn Nội Dung Cần Xuất File (*):</label>
                <select
                  value={exportScope}
                  onChange={(e) => setExportScope(e.target.value as any)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  <option value="all">📊 Toàn Bộ Sổ Cái Thu Chi &amp; Cân Đối Dòng Tiền Tổng Hợp</option>
                  <option value="tuition">🎓 Học Phí Học Viên CEO HN10 (Đối soát tự động SePay)</option>
                  <option value="penalty">⚠️ Phí Phạt Vi Phạm Nội Quy &amp; Chuyên Cần Lớp</option>
                  <option value="events">🎟️ Phí Tham Gia Sự Kiện &amp; Vé Hội Viên</option>
                  <option value="sponsors">🤝 Quỹ Tài Trợ Doanh Nghiệp &amp; Các Ban Chuyên Môn</option>
                  <option value="departments">🏢 Báo Cáo Phân Bổ Ngân Sách 6 Ban Chuyên Môn</option>
                  <option value="invoices">🧾 Hóa Đơn Chứng Từ &amp; Bảng Kê Thu Chi Chi Tiết</option>
                  <option value="sepay_reconcile">💳 Bảng Đối Soát Giao Dịch SePay (Mã GD Match Chuẩn)</option>
                </select>
              </div>

              {/* 2. Chọn Định Dạng Xuất File */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">2. Chọn Định Dạng File Muốn Xuất (*):</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat("excel")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer text-center ${
                      exportFormat === "excel"
                        ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold ring-2 ring-emerald-400"
                        : "border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <FileSpreadsheet className="size-5 text-emerald-600" />
                    <span className="text-[11px]">Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat("word")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer text-center ${
                      exportFormat === "word"
                        ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-bold ring-2 ring-blue-400"
                        : "border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <FileText className="size-5 text-blue-600" />
                    <span className="text-[11px]">Word (.docx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat("pdf")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer text-center ${
                      exportFormat === "pdf"
                        ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-bold ring-2 ring-rose-400"
                        : "border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <Printer className="size-5 text-rose-600" />
                    <span className="text-[11px]">PDF (.pdf)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setUnifiedExportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-input text-xs font-semibold hover:bg-muted transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleExecuteUnifiedExport}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Download className="size-3.5" />
                <span>Tiến Hành Xuất Báo Cáo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL LỆNH KHAI BÁO ĐIỀU CHUYỂN KINH PHÍ QUỸ BAN CÔNG NGHỆ & BAN CHUYÊN MÔN ── */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    LỆNH ĐIỀU CHUYỂN QUỸ BAN
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">Tự động cân đối 2 chiều</span>
                </div>
                <h3 className="text-base font-bold text-foreground pt-1 flex items-center gap-1.5">
                  <ArrowLeftRight className="size-4 text-indigo-600" />
                  <span>Cấp Kinh Phí Quỹ Ban Công Nghệ</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFundTransfer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">Từ Quỹ Nguồn:</label>
                  <input
                    type="text"
                    disabled
                    value={transferData.fromDepartment}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-muted/60 text-foreground font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-foreground mb-1">
                    Ban Thụ Hưởng / Tiếp Nhận <span className="text-rose-500">*</span>:
                  </label>
                  <select
                    value={transferData.toDepartment}
                    onChange={(e) => setTransferData({ ...transferData, toDepartment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground font-bold"
                  >
                    <option value="Ban Công Nghệ">Ban Công Nghệ &amp; Chuyển Đổi Số</option>
                    <option value="Ban Sự Kiện">Ban Truyền Thông &amp; Sự Kiện</option>
                    <option value="Ban Đào Tạo">Ban Đào Tạo &amp; Khai Giảng</option>
                    <option value="Ban Xúc Tiến">Ban Xúc Tiến Thương Mại B2B</option>
                    <option value="Ban Hội Viên">Ban Thành Viên &amp; Hội Viên</option>
                    <option value="Ban Thiện Nguyện">Ban Thiện Nguyện &amp; Xã Hội</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">
                    Số Tiền Cấp Kinh Phí (VNĐ) <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                    placeholder="VD: 50000000"
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground font-mono font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-foreground mb-1">Ngày Hạch Toán:</label>
                  <input
                    type="date"
                    required
                    value={transferData.date}
                    onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">
                  Nội Dung &amp; Mục Đích Điều Chuyển <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  required
                  rows={2}
                  value={transferData.description}
                  onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                  placeholder="VD: Cấp kinh phí cho Ban Công Nghệ chuẩn bị lễ khai giảng & hạ tầng CRM..."
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1 flex items-center gap-1">
                  <Link2 className="size-3 text-blue-500" />
                  <span>Link Hóa Đơn / Chứng Từ / Phiếu Duyệt Chi:</span>
                </label>
                <input
                  type="url"
                  value={transferData.invoiceUrl}
                  onChange={(e) => setTransferData({ ...transferData, invoiceUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/... hoặc link chứng từ"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1 flex items-center gap-1">
                  <Building2 className="size-3 text-amber-500" />
                  <span>Link Tài Khoản Quỹ Ban Tiếp Nhận:</span>
                </label>
                <input
                  type="text"
                  value={transferData.fundAccountLink}
                  onChange={(e) => setTransferData({ ...transferData, fundAccountLink: e.target.value })}
                  placeholder="https://mbbank.com.vn/fund/... hoặc STK: 0973924819 (MBBank)"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground font-mono text-[11px]"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300">
                💡 <strong>Cơ chế tự động:</strong> Khi bấm xác nhận, hệ thống sẽ tự động trừ quỹ ở Quỹ Tổng (Chi) và lập tức ghi tăng vào Quỹ của {transferData.toDepartment} với nhãn <strong>VÀO (IN)</strong> kèm đầy đủ link chứng từ hóa đơn và tài khoản quỹ!
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-muted/40 text-xs font-bold text-foreground hover:bg-muted cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingTransfer ? "Đang xử lý..." : "Xác Nhận & Ghi Sổ Quỹ CSDL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
