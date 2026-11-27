import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Award,
  CalendarDays,
  Check,
  Download,
  FileSpreadsheet,
  Handshake,
  Heart,
  Lock,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  UserPlus,
  Wallet,
  Coins,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, Pill, StatCard } from "@/components/dashboard/PageKit";
import { useTableControls } from "@/hooks/use-table-controls";
import { useUrlState } from "@/hooks/use-url-state";
import { useServerData } from "@/hooks/use-server-data";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import {
  createSponsorFn,
  deleteSponsorFn,
  listSponsorsFn,
  sendSponsorThankYouEmailFn,
  updateSponsorFn,
  type Sponsor,
} from "@/lib/sponsors.functions";
import { SponsorModal, type SponsorDraft } from "@/components/dashboard/SponsorModal";
import { SponsorExcelImportModal } from "@/components/dashboard/SponsorExcelImportModal";
import { exportToExcel, formatDisplayDate, formatExcelCurrency } from "@/lib/excel-export";
import { useRole, PERMISSIONS } from "@/hooks/use-role";
import { useFmt, useT } from "@/lib/i18n";

export const Route = createFileRoute("/sponsors")({
  component: SponsorsPage,
});

export type SponsorFundCategory =
  | "general_cash"
  | "general_in_kind"
  | "charity_cash"
  | "charity_in_kind";

export function getSponsorFundCategory(s: Sponsor): SponsorFundCategory {
  if (s.packageType === "charity_cash") return "charity_cash";
  if (s.packageType === "charity_in_kind") return "charity_in_kind";

  const text = `${s.name} ${s.companyName || ""} ${s.inKindDescription || ""}`.toLowerCase();
  const isCharity =
    (s as any).sponsorType === "charity" ||
    (s as any).fundType === "charity" ||
    text.includes("thiện nguyện") ||
    text.includes("csr") ||
    text.includes("vùng cao") ||
    text.includes("an sinh");

  if (isCharity) {
    if (s.packageType === "in_kind") return "charity_in_kind";
    return "charity_cash";
  }

  if (s.packageType === "in_kind") return "general_in_kind";
  return "general_cash";
}

function SponsorsPage() {
  const t = useT();
  const fmt = useFmt();
  const { can } = useRole();
  const { data: SPONSORS, reload } = useServerData<Sponsor[]>(() => listSponsorsFn(), []);
  const [tab, setTab] = useUrlState<"list" | "funds">("tab", "list");
  const [fundFilter, setFundFilter] = useUrlState<
    "all" | "general_cash" | "general_in_kind" | "charity_cash" | "charity_in_kind"
  >("fund_type", "all");
  const [q, setQ] = useUrlState<string>("q", "");
  const [sponsorTypeFilter, setSponsorTypeFilter] = useState<"all" | "regular" | "new">("all");
  const [eventAssignedFilter, setEventAssignedFilter] = useState<"all" | "assigned" | "available">(
    "all",
  );

  const createFn = useServerFn(createSponsorFn);
  const updateFn = useServerFn(updateSponsorFn);
  const deleteFn = useServerFn(deleteSponsorFn);
  const sendEmailFn = useServerFn(sendSponsorThankYouEmailFn);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const onSubmit = async (draft: SponsorDraft) => {
    setSubmitting(true);
    const payload = {
      ...draft,
      since:
        draft.since && String(draft.since).trim()
          ? String(draft.since).trim()
          : new Date().toISOString().slice(0, 10),
    };
    try {
      if (editing) {
        await updateFn({ data: { id: editing.id, ...(payload as object) } as never });
        toast.success(t("common.updated"));
      } else {
        await createFn({ data: payload as never });
        if (payload.email && payload.email.includes("@")) {
          toast.success(
            "Thêm nhà tài trợ thành công! Đã ghi nhận vào quỹ và gửi email tri ân tới đối tác."
          );
        } else {
          toast.success(t("common.created"));
        }
      }
      setModalOpen(false);
      setEditing(null);
      reload();
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const onResendThankYouEmail = async (s: Sponsor) => {
    if (!s.email || !s.email.includes("@")) {
      toast.error("Nhà tài trợ chưa có thông tin email hợp lệ");
      return;
    }
    setSendingEmailId(s.id);
    try {
      await sendEmailFn({ data: { id: s.id } });
      toast.success(`Đã gửi thư tri ân thành công tới ${s.email}`);
    } catch {
      toast.error("Không thể gửi email tri ân lúc này. Vui lòng thử lại sau.");
    } finally {
      setSendingEmailId(null);
    }
  };

  const onDelete = async (s: Sponsor) => {
    if (!window.confirm(t("common.confirmDelete", { name: s.name }))) return;
    setDeletingId(s.id);
    try {
      await deleteFn({ data: { id: s.id } });
      toast.success(t("common.deletedToast"));
      reload();
    } catch {
      toast.error(t("common.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  // Tính toán số dư quỹ theo 2 khối rõ rệt: Quỹ Hoạt Động & Quỹ Thiện Nguyện (CSR)
  const totalGeneralCash = useMemo(() => {
    return SPONSORS.filter((s) => getSponsorFundCategory(s) === "general_cash").reduce(
      (acc, s) => acc + s.amount,
      0
    );
  }, [SPONSORS]);

  const totalGeneralInKind = useMemo(() => {
    return SPONSORS.filter((s) => getSponsorFundCategory(s) === "general_in_kind").reduce(
      (acc, s) => acc + s.amount,
      0
    );
  }, [SPONSORS]);

  const totalCharityCash = useMemo(() => {
    return SPONSORS.filter((s) => getSponsorFundCategory(s) === "charity_cash").reduce(
      (acc, s) => acc + s.amount,
      0
    );
  }, [SPONSORS]);

  const totalCharityInKind = useMemo(() => {
    return SPONSORS.filter((s) => getSponsorFundCategory(s) === "charity_in_kind").reduce(
      (acc, s) => acc + s.amount,
      0
    );
  }, [SPONSORS]);

  const totalGeneralFunds = totalGeneralCash + totalGeneralInKind;
  const totalCharityFunds = totalCharityCash + totalCharityInKind;
  const totalOverallFunds = totalGeneralFunds + totalCharityFunds;

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return SPONSORS.filter((s) => (sponsorTypeFilter === "all" ? true : s.sponsorType === sponsorTypeFilter))
      .filter((s) => {
        if (fundFilter === "all") return true;
        return getSponsorFundCategory(s) === fundFilter;
      })
      .filter((s) => {
        if (eventAssignedFilter === "all") return true;
        if (eventAssignedFilter === "assigned") return !!s.assignedEvent;
        return !s.assignedEvent;
      })
      .filter(
        (s) =>
          !ql ||
          s.name.toLowerCase().includes(ql) ||
          (s.companyName && s.companyName.toLowerCase().includes(ql)) ||
          s.contact.toLowerCase().includes(ql) ||
          s.email.toLowerCase().includes(ql) ||
          s.phone.toLowerCase().includes(ql) ||
          (s.inKindDescription && s.inKindDescription.toLowerCase().includes(ql))
      );
  }, [SPONSORS, q, sponsorTypeFilter, fundFilter, eventAssignedFilter]);

  const tc = useTableControls<Sponsor>(
    filtered,
    {
      name: (s) => s.name,
      contact: (s) => s.contact,
      amount: (s) => s.amount,
      events: (s) => s.events,
      since: (s) => s.since,
      status: (s) => s.status,
    },
    { initialSortKey: "amount", initialSortDir: "desc", initialPageSize: 20 }
  );

  const exportExcel = () => {
    const total = filtered.reduce((acc, s) => acc + s.amount, 0);

    exportToExcel<Sponsor>({
      title: "BÁO CÁO DANH SÁCH NHÀ TÀI TRỢ & CÁC NGUỒN QUỸ TÀI TRỢ",
      subtitle: `CLB Doanh Nhân CEO HN10 (HanoiBA) | Tổng số: ${filtered.length} nhà tài trợ đồng hành`,
      filename: `danh-sach-nha-tai-tro-va-quy-ceohn10-${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Nha_Tai_Tro_Va_Quy",
      organization: "CLB DOANH NHÂN CEO HN10 (HANOIBA)",
      address: "Tòa nhà HanoiBA, TP. Hà Nội",
      circularCode: "Mẫu số B03-TT",
      circularNote: "(Ban hành theo quy chế quản lý tài trợ & quỹ thiện nguyện CSR CLB CEO HN10)",
      fundType: "Nguồn quỹ tài trợ hoạt động & quỹ thiện nguyện",
      currencyUnit: "VNĐ",
      data: filtered,
      columns: [
        { header: "Mã NT", key: "id", width: 14, value: (s) => s.id },
        { header: "Tên Doanh Nghiệp / Tổ Chức", key: "name", width: 34, value: (s) => s.name },
        {
          header: "Nguồn Quỹ & Mục Tài Trợ",
          key: "fundCategory",
          width: 28,
          value: (s) => {
            const cat = getSponsorFundCategory(s);
            switch (cat) {
              case "general_cash":
                return "Quỹ Hoạt Động (Tiền mặt)";
              case "general_in_kind":
                return "Quỹ Hoạt Động (Hiện vật)";
              case "charity_cash":
                return "Quỹ Thiện Nguyện (Tiền mặt)";
              case "charity_in_kind":
                return "Quỹ Thiện Nguyện (Hiện vật)";
            }
          },
        },
        {
          header: "Nội Dung / Diễn Giải Tài Trợ",
          key: "content",
          width: 40,
          value: (s) => s.inKindDescription || "Tài trợ CEOHN10",
        },
        { header: "Đại Diện / Người Liên Hệ", key: "contact", width: 22, value: (s) => s.contact || "—" },
        { header: "Email", key: "email", width: 24, value: (s) => s.email || "—" },
        { header: "Số Điện Thoại", key: "phone", width: 18, value: (s) => s.phone || "—" },
        {
          header: "Giá Trị Tài Trợ / Quy Đổi (VNĐ)",
          key: "amount",
          width: 24,
          value: (s) => formatExcelCurrency(s.amount),
        },
        { header: "Ngày Tiếp Nhận", key: "since", width: 16, value: (s) => formatDisplayDate(s.since) },
        {
          header: "Trạng Thái",
          key: "status",
          width: 18,
          value: (s) => (s.status === "active" ? "Đang hiệu lực" : "Hết hạn"),
        },
      ],
      summaryRows: [
        ["TỔNG CỘNG GIÁ TRỊ TÀI TRỢ", "", "", "", "", "", "", formatExcelCurrency(total)],
        ["TỔNG SỐ ĐỐI TÁC", "", "", "", "", "", "", `${filtered.length} doanh nghiệp / tổ chức`],
      ],
      signerTitles: ["NGƯỜI LẬP BIỂU", "TRƯỞNG BAN TÀI CHÍNH", "CHỦ TỊCH CLB"],
    });
    toast.success("Đã xuất danh sách nhà tài trợ sang file Excel (.xlsx) chuẩn!");
  };

  return (
    <AppShell>
      <PageHeader
        title={tab === "funds" ? "Quỹ Tài Trợ & Quỹ Thiện Nguyện (CSR)" : "Quản Lý Nhà Tài Trợ"}
        subtitle={
          tab === "funds"
            ? "Theo dõi độc lập 2 khối quỹ: Quỹ Hoạt Động & Sự Kiện (Tiền mặt/Hiện vật) và Quỹ Dành Cho Thiện Nguyện (Tiền mặt/Hiện vật)"
            : "Hệ thống đối tác & nhà tài trợ chính thức đồng hành cùng CEOHN10 Doanh Nhân CEO HN10"
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 px-3.5 py-2 text-xs font-semibold text-[#003B95] dark:text-blue-300 shadow-xs hover:bg-blue-100/60 transition cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Nhập file Excel</span>
            </button>
            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-xs hover:bg-emerald-100/60 transition cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Xuất Excel (.xlsx)</span>
            </button>
            {can(PERMISSIONS.SPONSOR_CREATE) && (
              <button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-primary-foreground shadow-md transition hover:opacity-90 active:scale-95 cursor-pointer"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Plus className="h-4 w-4" />
                <span>{tab === "funds" ? "Tiếp nhận tài trợ vào quỹ" : "Khai báo nhà tài trợ mới"}</span>
              </button>
            )}
          </div>
        }
      />

      {/* ── TABS CHUYỂN ĐỔI: DANH SÁCH NHÀ TÀI TRỢ & BÁO CÁO QUỸ ── */}
      <div className="mb-5 flex border-b border-border">
        <button
          type="button"
          onClick={() => {
            setTab("list");
            setFundFilter("all");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            tab !== "funds"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Handshake className="size-4" />
          <span>Danh Sách Nhà Tài Trợ ({SPONSORS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTab("funds");
            setFundFilter("all");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            tab === "funds"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wallet className="size-4" />
          <span>Quỹ Tài Trợ (Quỹ Hoạt Động &amp; Quỹ Thiện Nguyện)</span>
        </button>
      </div>

      {/* ── DASHBOARD STATS: PHÂN ĐỊNH RÕ 2 KHỐI QUỸ ── */}
      {tab === "funds" ? (
        <div className="mb-6 space-y-4">
          {/* KHỐI 1: QUỸ HOẠT ĐỘNG & SỰ KIỆN */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <Coins className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  1. Quỹ Tài Trợ Hoạt Động &amp; Sự Kiện
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Tổng quỹ: {fmt.money(totalGeneralFunds)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatCard
                label="Mục Tiền Mặt (Quỹ Hoạt Động)"
                value={fmt.money(totalGeneralCash)}
                tone="success"
                hint="Tiền mặt & Chuyển khoản ngân hàng phục vụ sự kiện"
                icon={<Coins className="h-4 w-4 text-emerald-500" />}
              />
              <StatCard
                label="Mục Hiện Vật (Quỹ Hoạt Động)"
                value={fmt.money(totalGeneralInKind)}
                tone="info"
                hint="Vật phẩm, quà tặng, kỷ yếu, dịch vụ quy đổi"
                icon={<Gift className="h-4 w-4 text-sky-500" />}
              />
            </div>
          </div>

          {/* KHỐI 2: QUỸ DÀNH CHO THIỆN NGUYỆN (CSR) */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-400">
                  <Heart className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                  2. Quỹ Dành Cho Thiện Nguyện (CSR)
                </span>
              </div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Tổng quỹ thiện nguyện: {fmt.money(totalCharityFunds)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatCard
                label="Mục Tiền Mặt (Quỹ Thiện Nguyện)"
                value={fmt.money(totalCharityCash)}
                tone="warning"
                hint="Quỹ tiền mặt dành riêng cho an sinh & xây điểm trường"
                icon={<Heart className="h-4 w-4 text-rose-500" />}
              />
              <StatCard
                label="Mục Hiện Vật (Quỹ Thiện Nguyện)"
                value={fmt.money(totalCharityInKind)}
                tone="info"
                hint="Quần áo ấm, sách vở, nhu yếu phẩm quy đổi cho vùng cao"
                icon={<Gift className="h-4 w-4 text-amber-500" />}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Tổng NTT & Giá Trị"
            value={`${SPONSORS.length} NTT · ${fmt.money(totalOverallFunds)}`}
            icon={<Handshake className="h-4 w-4" />}
          />
          <StatCard
            label="Quỹ Hoạt Động & Sự Kiện"
            value={fmt.money(totalGeneralFunds)}
            tone="success"
            hint={`Tiền mặt: ${fmt.money(totalGeneralCash)} | Hiện vật: ${fmt.money(totalGeneralInKind)}`}
            icon={<Coins className="h-4 w-4 text-emerald-500" />}
          />
          <StatCard
            label="Quỹ Thiện Nguyện (CSR)"
            value={fmt.money(totalCharityFunds)}
            tone="info"
            hint={`Tiền mặt: ${fmt.money(totalCharityCash)} | Hiện vật: ${fmt.money(totalCharityInKind)}`}
            icon={<Heart className="h-4 w-4 text-rose-500" />}
          />
          <StatCard
            label="★ Thường Xuyên Ổn Định"
            value={`${SPONSORS.filter((s) => s.sponsorType === "regular").length} Đối tác`}
            hint={`${Math.round((SPONSORS.filter((s) => s.sponsorType === "regular").length / (SPONSORS.length || 1)) * 100)}% tổng số đối tác`}
            icon={<Award className="h-4 w-4 text-sky-500" />}
          />
        </div>
      )}

      {/* ── FILTER TOOLBAR: BỎ HOÀN TOÀN GÓI VÀNG BẠC ĐỒNG ── */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên doanh nghiệp, nội dung tài trợ, người liên hệ..."
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-xs shadow-xs focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 text-foreground"
          />
        </div>

        {/* Lọc theo Nguồn Quỹ & Mục Tài Trợ */}
        <select
          value={fundFilter}
          onChange={(e) => setFundFilter(e.target.value as any)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-xs cursor-pointer"
        >
          <option value="all">Tất cả các nguồn Quỹ</option>
          <option value="general_cash">🏢 Quỹ Hoạt Động · Mục Tiền mặt</option>
          <option value="general_in_kind">🏢 Quỹ Hoạt Động · Mục Hiện vật</option>
          <option value="charity_cash">❤️ Quỹ Thiện Nguyện · Mục Tiền mặt</option>
          <option value="charity_in_kind">❤️ Quỹ Thiện Nguyện · Mục Hiện vật</option>
        </select>

        {tab !== "funds" && (
          <select
            value={sponsorTypeFilter}
            onChange={(e) => setSponsorTypeFilter(e.target.value as any)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-xs cursor-pointer"
          >
            <option value="all">Tất cả đối tác</option>
            <option value="regular">★ Thường xuyên ổn định</option>
            <option value="new">✦ Nhà tài trợ mới</option>
          </select>
        )}

        <select
          value={eventAssignedFilter}
          onChange={(e) => setEventAssignedFilter(e.target.value as any)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-xs cursor-pointer"
        >
          <option value="all">Tất cả sự kiện</option>
          <option value="assigned">🔒 Đang tài trợ (Đã khóa)</option>
          <option value="available">✓ Sẵn sàng tài trợ (Khả dụng)</option>
        </select>
      </div>

      {/* ── BẢNG DANH SÁCH NHÀ TÀI TRỢ & QUỸ TÀI TRỢ ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[1050px]">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="w-12 px-3 py-3.5 text-center border-b border-border">STT</th>
                <th className="w-20 px-3 py-3.5 border-b border-border whitespace-nowrap">Mã NT</th>
                <th className="min-w-[220px] max-w-[280px] px-4 py-3.5 border-b border-border">
                  Doanh Nghiệp / Tổ Chức
                </th>
                <th className="min-w-[170px] px-3 py-3.5 border-b border-border whitespace-nowrap">
                  Nguồn Quỹ &amp; Mục Đích
                </th>
                <th className="min-w-[220px] max-w-[300px] px-4 py-3.5 border-b border-border">
                  Nội Dung / Diễn Giải Tài Trợ
                </th>
                <th className="min-w-[160px] px-4 py-3.5 border-b border-border">Đại Diện / Liên Hệ</th>
                <th className="min-w-[130px] px-4 py-3.5 border-b border-border whitespace-nowrap text-right">
                  Giá Trị Tài Trợ
                </th>
                <th className="min-w-[130px] px-3 py-3.5 border-b border-border whitespace-nowrap">
                  Trạng Thái
                </th>
                <th className="min-w-[100px] px-3 py-3.5 border-b border-border whitespace-nowrap">
                  Ngày Nhận
                </th>
                <th className="w-20 px-4 py-3.5 text-right font-bold border-b border-border whitespace-nowrap">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tc.pageRows.map((s, idx) => {
                const cat = getSponsorFundCategory(s);
                return (
                  <tr key={s.id} className="group transition-colors hover:bg-muted/40">
                    <td className="px-3 py-3 text-center font-mono text-xs font-semibold text-muted-foreground">
                      {(tc.page - 1) * tc.pageSize + idx + 1}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs font-bold text-primary whitespace-nowrap">
                      {s.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground text-xs leading-snug line-clamp-1" title={s.name}>
                        {s.name}
                      </div>
                      {s.companyName && s.companyName !== s.name && (
                        <div className="text-[11px] text-muted-foreground truncate font-medium">
                          {s.companyName}
                        </div>
                      )}
                      {s.website && (
                        <a
                          href={s.website.startsWith("http") ? s.website : `https://${s.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                        >
                          {s.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </td>

                    {/* NGUỒN QUỸ & MỤC ĐÍCH */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {cat === "general_cash" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                          <Coins className="h-3 w-3 text-emerald-600" />
                          <span>Quỹ Hoạt Động · Tiền mặt</span>
                        </span>
                      )}
                      {cat === "general_in_kind" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10.5px] font-bold text-[#003B95] dark:text-blue-300">
                          <Gift className="h-3 w-3 text-blue-600" />
                          <span>Quỹ Hoạt Động · Hiện vật</span>
                        </span>
                      )}
                      {cat === "charity_cash" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10.5px] font-bold text-rose-700 dark:text-rose-300">
                          <Heart className="h-3 w-3 text-rose-600" />
                          <span>Quỹ Thiện Nguyện · Tiền mặt</span>
                        </span>
                      )}
                      {cat === "charity_in_kind" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-bold text-amber-700 dark:text-amber-300">
                          <Gift className="h-3 w-3 text-amber-600" />
                          <span>Quỹ Thiện Nguyện · Hiện vật</span>
                        </span>
                      )}
                    </td>

                    {/* NỘI DUNG TÀI TRỢ MỞ RỘNG */}
                    <td className="px-4 py-3">
                      <div
                        className="text-xs text-foreground font-medium line-clamp-2 leading-relaxed"
                        title={s.inKindDescription || "Tài trợ CEOHN10"}
                      >
                        {s.inKindDescription || "Tài trợ hoạt động CLB"}
                      </div>
                      {Array.isArray(s.inKindItems) && s.inKindItems.length > 0 && (
                        <div className="mt-1 text-[10.5px] text-muted-foreground flex items-center gap-1">
                          <Gift className="h-3 w-3 text-amber-500" />
                          <span>{s.inKindItems.length} vật phẩm hiện vật</span>
                        </div>
                      )}
                    </td>

                    {/* ĐẠI DIỆN LIÊN HỆ */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground text-xs leading-snug line-clamp-1">
                        {s.contact || "Đại diện đối tác"}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{s.email || "—"}</div>
                      {s.phone && (
                        <div className="text-[10px] text-muted-foreground font-mono">{s.phone}</div>
                      )}
                    </td>

                    {/* GIÁ TRỊ TÀI TRỢ */}
                    <td className="px-4 py-3 font-mono font-bold text-foreground text-xs whitespace-nowrap text-right">
                      {fmt.money(s.amount)}
                    </td>

                    {/* TRẠNG THÁI */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Pill color={s.status === "active" ? "success" : "neutral"}>
                        {s.status === "active" ? "Đang hiệu lực" : "Hết hạn"}
                      </Pill>
                    </td>

                    {/* NGÀY TIẾP NHẬN */}
                    <td className="px-3 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {s.since}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {can(PERMISSIONS.SPONSOR_EDIT) && (
                          <>
                            {s.email && s.email.includes("@") && (
                              <button
                                onClick={() => onResendThankYouEmail(s)}
                                disabled={sendingEmailId === s.id}
                                aria-label="Gửi lại thư tri ân"
                                title={`Gửi lại thư tri ân tới ${s.email}`}
                                className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition disabled:opacity-50 cursor-pointer"
                              >
                                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditing(s);
                                setModalOpen(true);
                              }}
                              aria-label={t("common.edit")}
                              title="Sửa thông tin nhà tài trợ"
                              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => onDelete(s)}
                              disabled={deletingId === s.id}
                              aria-label={t("common.delete")}
                              title="Xóa nhà tài trợ"
                              className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tc.total === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-xs text-muted-foreground">
                    Không tìm thấy nhà tài trợ nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              )}
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

      {/* Sponsor Create & Edit Modal */}
      <SponsorModal
        open={modalOpen}
        initial={editing}
        submitting={submitting}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
      />

      {/* Sponsor Excel Import Modal */}
      <SponsorExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={reload}
      />
    </AppShell>
  );
}
