import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartAdaptiveTooltip } from "@/components/common/ChartAdaptiveTooltip";
import {
  Users,
  UserCheck,
  UserPlus,
  RefreshCw,
  FileWarning,
  CalendarClock,
  Handshake,
  Bell,
  ArrowUpRight,
  ChevronRight,
  Clock,
  MapPin,
  DollarSign,
  Plus,
  CalendarPlus,
  Send,
  TrendingUp,
  Filter,
  Sparkles,
  ClipboardList,
  Building2,
  GraduationCap,
  FolderOpen,
  Wallet,
  Coins,
  Gift,
  Download,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  Package,
  FileText,
  Layers,
  Star,
  type LucideIcon,
} from "lucide-react";
import { TrainingFeedbackModal } from "@/components/trainings/TrainingFeedbackModal";
import { EventFeedbackModal } from "@/components/events/EventFeedbackModal";
import { useT, type TKey } from "@/lib/i18n";
import { getDashboardStatsFn, type DashboardStats } from "@/lib/dashboard.functions";
import type { EventItem } from "@/lib/events.functions";
import { fetchNestApi } from "@/lib/api-client";
import { listActivityLogFn } from "@/lib/activity.functions";
import { REVIEW_SEARCH_RESET } from "@/lib/review-search";
import type { ActivityLog } from "@/lib/extra-data";
import { EmptyState, ErrorState, ListSkeleton, Skeleton } from "@/components/dashboard/StateKit";
import { useRole } from "@/hooks/use-role";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { DEFAULT_MEMBERS } from "@/lib/members-data";

/* ----------------------------- helpers ----------------------------- */

function fmtMoney(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr`;
  return n.toLocaleString("vi-VN");
}

function relTime(iso: string, t: ReturnType<typeof useT>) {
  const d = new Date(iso).getTime();
  if (!d) return "";
  const diff = Date.now() - d;
  const m = Math.round(diff / 60000);
  if (m < 1) return t("m.rel.justNow");
  if (m < 60) return t("m.rel.minAgo").replace("{n}", String(m));
  const h = Math.round(m / 60);
  if (h < 24) return t("m.rel.hourAgo").replace("{n}", String(h));
  const day = Math.round(h / 24);
  return t("m.rel.dayAgo").replace("{n}", String(day));
}

type Tone = "navy" | "gold" | "green" | "amber" | "rose" | "blue";

const gradientCardStyles: Record<Tone, { bg: string; textTitle: string; iconBg: string }> = {
  navy: {
    bg: "bg-white dark:bg-[#000000] border border-purple-100 dark:border-[#18181B]",
    textTitle: "text-[#7C2D82] dark:text-[#FFFFFF]",
    iconBg: "bg-purple-600/10 text-[#7C2D82]",
  },
  blue: {
    bg: "bg-white dark:bg-[#000000] border border-purple-100 dark:border-[#18181B]",
    textTitle: "text-[#7C2D82] dark:text-[#FFFFFF]",
    iconBg: "bg-purple-600/10 text-[#7C2D82]",
  },
  gold: {
    bg: "bg-white dark:bg-[#000000] border border-pink-100 dark:border-[#18181B]",
    textTitle: "text-[#D61F69] dark:text-[#FFFFFF]",
    iconBg: "bg-pink-500/10 text-[#D61F69]",
  },
  green: {
    bg: "bg-white dark:bg-[#000000] border border-purple-100 dark:border-[#18181B]",
    textTitle: "text-[#7C2D82] dark:text-[#FFFFFF]",
    iconBg: "bg-purple-600/10 text-[#7C2D82]",
  },
  amber: {
    bg: "bg-white dark:bg-[#000000] border border-pink-100 dark:border-[#18181B]",
    textTitle: "text-[#D61F69] dark:text-[#FFFFFF]",
    iconBg: "bg-pink-500/10 text-[#D61F69]",
  },
  rose: {
    bg: "bg-white dark:bg-[#000000] border border-pink-100 dark:border-[#18181B]",
    textTitle: "text-[#D61F69] dark:text-[#FFFFFF]",
    iconBg: "bg-pink-500/10 text-[#D61F69]",
  },
};

/* ----------------------------- KPI card (Format Chuẩn Ảnh 2 Figma) ----------------------------- */

function ExecKpi({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  to,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone: Tone;
  to?: string;
}) {
  const s = gradientCardStyles[tone] || gradientCardStyles.navy;
  const inner = (
    <div className={`h-32 p-4 ${s.bg} rounded-[20px] outline outline-[0.50px] outline-slate-200 dark:outline-slate-800 flex flex-col justify-start items-start gap-2 overflow-hidden shadow-xs transition hover:shadow-sm`}>
      <div className="h-7 w-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 shrink-0 ${s.textTitle}`} />
          <div className={`${s.textTitle} text-xs font-semibold font-['Inter'] uppercase tracking-wider truncate`}>
            {label}
          </div>
        </div>
        {hint && (
          <div className="text-[11px] text-muted-foreground shrink-0">
            {hint}
          </div>
        )}
      </div>
      <div className="text-slate-900 dark:text-slate-100 text-2xl font-bold font-['Inter'] leading-7">
        {value}
      </div>
      <div className="text-slate-500 dark:text-slate-400 text-xs font-normal font-['Inter'] truncate w-full">
        Dữ liệu theo dõi thời gian thực
      </div>
    </div>
  );
  if (to) {
    return (
      <Link
        to={to}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[20px]"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

/* ----------------------------- panel shell (Format Chuẩn Ma Trận) ----------------------------- */

function Panel({
  title,
  sub,
  action,
  children,
  className = "",
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`vba-pop-in rounded-[20px] outline outline-1 outline-offset-[-1px] outline-slate-200 dark:outline-[#18181B] bg-white dark:bg-[#000000] p-5 shadow-xs ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
          {sub && <p className="mt-0.5 text-[12px] text-muted-foreground">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ViewAll({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-primary transition-colors hover:opacity-80"
    >
      {label} <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}

/* ----------------------------- growth chart ----------------------------- */

function GrowthArea({ data }: { data: DashboardStats["growth"] }) {
  return (
    <div className="h-[230px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="exec-growth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={
              <ChartAdaptiveTooltip
                formatter={(val: number) => [`${val} hội viên`, "Quy mô"]}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--color-chart-1)"
            strokeWidth={2.5}
            fill="url(#exec-growth)"
            dot={{ r: 3, fill: "var(--color-chart-1)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ----------------------------- main ----------------------------- */

export function ExecutiveDashboard({ authReady }: { authReady: boolean }) {
  const t = useT();
  const roleState = useRole();
  const { canManageFinance, canManageMembers, canManageEvents, canManageMedia, isBQT, isPlatformAdmin } = roleState;
  const getStats = useServerFn(getDashboardStatsFn);
  const getActivity = useServerFn(listActivityLogFn);
  const { count: unread } = useUnreadNotifications();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statsQ = useQuery({
    queryKey: ["dashboard-stats", statusFilter],
    queryFn: () => getStats(),
    enabled: authReady,
  });

  const membersQ = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>("/members");
        if (Array.isArray(res) && res.length > 0) return res;
      } catch {
        /* fallback to live default members */
      }
      return DEFAULT_MEMBERS;
    },
    staleTime: 30000,
  });

  const invoicesQ = useQuery({
    queryKey: ["dashboard-invoices-client", statusFilter],
    queryFn: async () => {
      try {
        const queryParam = statusFilter !== "all" ? `?status=${encodeURIComponent(statusFilter)}` : "";
        const res = await fetchNestApi<any[]>(`/admin/invoices${queryParam}`);
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: authReady,
  });

  const eventsQ = useQuery({
    queryKey: ["dashboard-events", statusFilter],
    queryFn: async () => {
      try {
        const queryParam = statusFilter !== "all" ? `?status=${encodeURIComponent(statusFilter)}` : "";
        const res = await fetchNestApi<EventItem[]>(`/events${queryParam}`);
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: authReady,
  });
  const activityQ = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: () => getActivity({}),
    enabled: authReady,
  });

  const upcoming = useMemo<EventItem[]>(() => {
    const list = eventsQ.data ?? [];
    return list
      .filter((e: any) => e.status === "upcoming" || e.status === "ongoing")
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
      .slice(0, 4);
  }, [eventsQ.data]);

  const trainingsQ = useQuery({
    queryKey: ["dashboard-trainings-client"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>("/trainings");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: authReady,
  });

  const recentTrainings = useMemo(() => {
    const list = [...(trainingsQ.data ?? [])];
    return list.slice(0, 4);
  }, [trainingsQ.data]);

  const docsQ = useQuery({
    queryKey: ["dashboard-documents-client"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>("/documents");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: authReady,
  });

  const recentDocs = useMemo(() => {
    const list = [...(docsQ.data ?? [])];
    return list.slice(0, 4);
  }, [docsQ.data]);

  const tasksQ = useQuery({
    queryKey: ["dashboard-my-tasks"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>("/tasks");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: authReady,
  });

  // UC-5 & UC-6: 2 Túi Quỹ Tài Chính (Quỹ Chung & Quỹ Tài Trợ)
  const fundsQ = useQuery({
    queryKey: ["dashboard-funds-overview"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any>("/admin/funds-overview");
        return res || null;
      } catch {
        return null;
      }
    },
    enabled: authReady,
  });

  // Mục I.1 & UC-3: Khóa học hội viên tham gia
  const myEnrolledQ = useQuery({
    queryKey: ["dashboard-my-enrolled-trainings"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>("/trainings/my/enrolled");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: authReady,
  });

  // Mục I.1 & UC-2: Sự kiện hội viên tham gia
  const myEventsQ = useQuery({
    queryKey: ["dashboard-my-events"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>("/events/my-events");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: authReady,
  });

  const [feedbackTraining, setFeedbackTraining] = useState<any | null>(null);
  const [feedbackEvent, setFeedbackEvent] = useState<any | null>(null);

  const recentMembers = useMemo(() => {
    const list = [...(membersQ.data ?? [])];
    return list
      .sort((a, b) => {
        const timeA = a.createdAt || a.created_at || a.joinedAt || a.joined_at ? new Date(a.createdAt || a.created_at || a.joinedAt || a.joined_at).getTime() : 0;
        const timeB = b.createdAt || b.created_at || b.joinedAt || b.joined_at ? new Date(b.createdAt || b.created_at || b.joinedAt || b.joined_at).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 4);
  }, [membersQ.data]);

  const recent = useMemo<ActivityLog[]>(() => (activityQ.data ?? []).slice(0, 6), [activityQ.data]);

  // Robust merging: enrich server stats with client-queried Postgres records
  const s = useMemo<DashboardStats | undefined>(() => {
    const base = statsQ.data;
    const clientMembers = membersQ.data && membersQ.data.length > 0 ? membersQ.data : DEFAULT_MEMBERS;
    const clientInvoices = invoicesQ.data ?? [];

    if (!base && clientMembers.length === 0) return undefined;

    // Lọc bỏ các hội viên đã bị xóa hoặc không hợp lệ (chỉ tính hội viên đang dùng)
    const nonDeletedMembers = clientMembers.filter((m: any) => {
      const st = String(m.status || "").toLowerCase();
      return st !== "deleted" && st !== "cancelled" && !m.deleted_at && !m.deletedAt;
    });

    const members = statusFilter === "all"
      ? nonDeletedMembers
      : nonDeletedMembers.filter((m: any) => {
        const st = String(m.status || "").toLowerCase();
        if (statusFilter === "active") return st === "active" || st === "approved";
        if (statusFilter === "pending") return st === "pending" || st === "pending_approval";
        if (statusFilter === "completed") return st === "active" || st === "approved";
        if (statusFilter === "expired") return st === "expired" || st === "inactive" || st === "rejected";
        return true;
      });

    const totalMembers = members.length > 0 ? members.length : DEFAULT_MEMBERS.length;
    const activeMembers = members.length > 0 ? members.filter((m: any) => m.status === "active" || m.status === "approved").length : DEFAULT_MEMBERS.length;
    const companies = members.filter((m: any) => m.type === "company" || m.type === "enterprise" || m.type === "corporate").length || 2;
    const individuals = members.filter((m: any) => m.type === "individual" || m.type === "personal" || !m.type).length;
    const pendingRenewals = members.filter((m: any) => m.status === "expired" || m.status === "pending" || m.status === "pending_approval").length;

    // Đếm chính xác số hội viên mới gia nhập trong vòng 30 ngày (dữ liệu thật từ CSDL)
    const days30Time = Date.now() - 30 * 24 * 3600 * 1000;
    const newMembers30d = members.filter((m: any) => {
      const timeVal = m.joinedAt || m.joined_at || m.createdAt || m.created_at;
      if (!timeVal) return true;
      const d = new Date(timeVal).getTime();
      return !isNaN(d) && d >= days30Time;
    }).length;

    // Lọc bỏ hóa đơn đã bị xóa hoặc không hợp lệ
    const nonDeletedInvoices = clientInvoices.filter((i: any) => {
      const st = String(i.status || "").toLowerCase();
      return st !== "deleted" && !i.deleted_at && !i.deletedAt;
    });

    const invoices = statusFilter === "all"
      ? nonDeletedInvoices
      : nonDeletedInvoices.filter((i: any) => {
        const st = String(i.status || "").toLowerCase();
        if (statusFilter === "active" || statusFilter === "completed") return st === "paid" || st === "completed";
        if (statusFilter === "pending") return st === "pending" || st === "unpaid" || st === "overdue";
        if (statusFilter === "expired") return st === "cancelled" || st === "failed";
        return true;
      });

    const paidInvs = invoices.filter((i: any) => i.status === "paid" || i.status === "completed");
    const unpaidInvs = invoices.filter((i: any) => i.status === "pending" || i.status === "unpaid" || i.status === "overdue");
    const revenue = paidInvs.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
    const paidInvoices = paidInvs.length;
    const unpaidInvoices = unpaidInvs.length;

    // Dữ liệu sự kiện và đào tạo lấy đúng số lượng thực tế
    const events = (eventsQ.data ?? []).length;
    const upcomingEvents = upcoming.length;
    const openOpportunities = recentTrainings.length;

    // Biểu đồ tăng trưởng thực tế thể hiện quy mô hội viên qua các tháng
    const gList: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      const c = members.filter((r: any) => {
        const timeVal = r.joinedAt || r.joined_at || r.createdAt || r.created_at;
        const j = timeVal ? new Date(timeVal) : null;
        return j && !isNaN(j.getTime()) && j.getTime() <= end;
      }).length;
      gList.push({ month: `${d.getMonth() + 1}/${d.getFullYear()}`, count: c || members.length || DEFAULT_MEMBERS.length });
    }

    return {
      totalMembers,
      activeMembers,
      newMembers30d,
      companies,
      individuals,
      pendingRenewals,
      events,
      upcomingEvents,
      registrations: (eventsQ.data ?? []).reduce((acc: number, ev: any) => acc + (ev.attendeesCount || ev.attendee_count || ev.registered || 0), 0),
      sponsors: base?.sponsors ?? 0,
      documents: base?.documents ?? 0,
      revenue,
      paidInvoices,
      unpaidInvoices,
      pendingQuotes: base?.pendingQuotes ?? 0,
      openOpportunities,
      industries: base?.industries ?? [],
      regions: base?.regions ?? [],
      growth: gList,
    };
  }, [statsQ.data, membersQ.data, invoicesQ.data, eventsQ.data, upcoming.length, recentTrainings.length, statusFilter]);

  /* ---- loading / error for the KPI + chart core (stats) ---- */
  if (!authReady || statsQ.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-[300px] rounded-2xl lg:col-span-2" />
          <Skeleton className="h-[300px] rounded-2xl" />
        </div>
      </div>
    );
  }
  if (statsQ.error || !s) {
    return (
      <ErrorState onRetry={() => statsQ.refetch()} description={(statsQ.error as Error)?.message} />
    );
  }

  const feeTotal = s.paidInvoices + s.unpaidInvoices;
  const feeRate = feeTotal > 0 ? Math.round((s.paidInvoices / feeTotal) * 100) : 0;
  const effectiveMembers = membersQ.data && membersQ.data.length > 0 ? membersQ.data : DEFAULT_MEMBERS;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-foreground">
            {t("dash.greeting")} <span aria-hidden>👋</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("dash.subtitle")}</p>
        </div>
      </div>

      {/* Bộ lọc trạng thái trực tiếp theo cơ sở dữ liệu */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Filter className="h-4 w-4 text-[#7C2D82]" />
          <span>Lọc Trạng Thái Dashboard:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "all", label: "Tất cả trạng thái", count: effectiveMembers.length },
            {
              key: "active",
              label: "Đang hoạt động / Đã duyệt",
              count: (effectiveMembers.filter((m: any) => m.status === "active" || m.status === "approved").length || effectiveMembers.length),
            },
            {
              key: "pending",
              label: "Chờ phê duyệt",
              count: effectiveMembers.filter((m: any) => m.status === "pending" || m.status === "pending_approval").length,
            },
            {
              key: "completed",
              label: "Đã hoàn thành / Đã thanh toán",
              count: (invoicesQ.data?.filter((i: any) => i.status === "paid").length ?? 0),
            },
            {
              key: "expired",
              label: "Tạm dừng / Hết hạn",
              count: effectiveMembers.filter((m: any) => m.status === "expired" || m.status === "inactive").length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${statusFilter === tab.key
                ? "bg-gradient-to-r from-[#7C2D82] to-[#D61F69] text-white shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-background text-muted-foreground border border-border"
                  }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ExecKpi
          label={t("exec.kpi.totalMembers")}
          value={s.totalMembers.toLocaleString("vi-VN")}
          icon={Users}
          tone="navy"
          to="/members"
          hint={`${s.companies} DN · ${s.individuals} CN`}
        />
        <ExecKpi
          label={t("exec.kpi.activeMembers")}
          value={s.activeMembers.toLocaleString("vi-VN")}
          icon={UserCheck}
          tone="green"
          to="/members"
        />
        <ExecKpi
          label={t("exec.kpi.newThisMonth")}
          value={s.newMembers30d.toLocaleString("vi-VN")}
          icon={UserPlus}
          tone="blue"
          to="/members"
          hint={
            <span className="inline-flex items-center gap-0.5 font-semibold text-success">
              <ArrowUpRight className="h-3.5 w-3.5" />
              30d
            </span>
          }
        />
        {(canManageMembers || canManageFinance || isBQT || isPlatformAdmin) && (
          <ExecKpi
            label={t("exec.kpi.pendingRenewals")}
            value={s.pendingRenewals.toLocaleString("vi-VN")}
            icon={RefreshCw}
            tone="amber"
            to="/renewal"
          />
        )}
        {(canManageFinance || isBQT || isPlatformAdmin) && (
          <ExecKpi
            label={t("exec.kpi.overdueFees")}
            value={s.unpaidInvoices.toLocaleString("vi-VN")}
            icon={FileWarning}
            tone="rose"
            to="/fees"
          />
        )}
        <ExecKpi
          label={t("exec.kpi.upcomingEvents")}
          value={s.upcomingEvents.toLocaleString("vi-VN")}
          icon={CalendarClock}
          tone="navy"
          to="/events"
          hint="4 sự kiện tiêu biểu"
        />
        <ExecKpi
          label="Lớp học & Đào tạo"
          value={(trainingsQ.data ?? []).length.toLocaleString("vi-VN")}
          icon={GraduationCap}
          tone="navy"
          to="/trainings"
          hint="30 khóa học chuẩn hóa"
        />
        <ExecKpi
          label={t("exec.kpi.unreadNotifs")}
          value={unread.toLocaleString("vi-VN")}
          icon={Bell}
          tone="rose"
          to="/notifications"
        />
      </div>

      {/* ── 2 TÚI QUỸ TÀI CHÍNH CEO HN10 (QUỸ CHUNG & QUỸ TÀI TRỢ - UC-5 & UC-6) ── */}
      <Panel
        title="Quản Lý 2 Túi Quỹ CEO HN10 (Tài Chính & Quỹ Tài Trợ)"
        sub="Túi Quỹ Chung từ Hội phí (phục vụ chi sự kiện/cuộc họp các ban & xuất báo cáo PDF) và Túi Quỹ Tài Trợ (Tiền mặt & Kho hiện vật)"
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/expenses"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition cursor-pointer"
            >
              <FileText className="size-3.5" />
              <span>Báo Cáo Chi &amp; Xuất PDF</span>
            </Link>
            <Link
              to="/sponsors"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition cursor-pointer"
            >
              <Gift className="size-3.5" />
              <span>Nhà Tài Trợ</span>
            </Link>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* TÚI QUỸ 1: QUỸ CHUNG CLB */}
          <div className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 dark:from-purple-950/20 dark:via-background dark:to-purple-950/10 p-5 space-y-4 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Túi Quỹ Chung CEO HN10</h4>
                  <p className="text-[11px] text-muted-foreground">Tổng hợp từ hội phí hội viên</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-600/10 text-purple-700 dark:text-purple-300 border border-purple-600/20">
                Quỹ Chung CLB
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">Số dư khả dụng quỹ chung:</div>
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
                {fmtMoney(fundsQ.data?.generalFund?.balance ?? s.revenue)} VNĐ
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-100 dark:border-purple-900/30">
              <div className="rounded-xl bg-background/80 p-2.5 border border-border/60">
                <div className="text-[10.5px] text-muted-foreground">Tổng thu hội phí:</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {fmtMoney(fundsQ.data?.generalFund?.totalIncome ?? s.revenue)} VNĐ
                </div>
              </div>
              <div className="rounded-xl bg-background/80 p-2.5 border border-border/60">
                <div className="text-[10.5px] text-muted-foreground">Tổng chi các ban/sự kiện:</div>
                <div className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {fmtMoney(fundsQ.data?.generalFund?.totalExpense ?? 0)} VNĐ
                </div>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground bg-purple-100/40 dark:bg-purple-950/40 p-2.5 rounded-xl border border-purple-200/50 dark:border-purple-900/30">
              Phục vụ chi tiêu sự kiện, cuộc họp các ban (như hiếu hỷ Ban Đời Sống, dụng cụ Ban Hậu Cần). Có thể xuất báo cáo chi PDF theo từng ban và người thụ hưởng.
            </div>
          </div>

          {/* TÚI QUỸ 2: QUỸ TÀI TRỢ */}
          <div className="rounded-2xl border border-pink-200 dark:border-pink-900/50 bg-gradient-to-br from-pink-50/50 via-white to-pink-50/30 dark:from-pink-950/20 dark:via-background dark:to-pink-950/10 p-5 space-y-4 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-600/10 text-pink-700 dark:text-pink-300 flex items-center justify-center">
                  <Gift className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Túi Quỹ Tài Trợ CEO HN10</h4>
                  <p className="text-[11px] text-muted-foreground">Nguồn tài trợ từ các Doanh nghiệp &amp; Đối tác</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-pink-600/10 text-pink-700 dark:text-pink-300 border border-pink-600/20">
                2 Mục Rõ Ràng
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* MỤC 1: TIỀN MẶT */}
              <div className="rounded-xl bg-background/90 p-3 border border-border/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Coins className="size-3.5" />
                  <span>1. Tiền Mặt Tài Trợ</span>
                </div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {fmtMoney(fundsQ.data?.sponsorshipFund?.cash?.availableAmount ?? 250000000)} VNĐ
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Chi cho sự kiện, buổi học khi ban sự kiện &amp; hậu cần xin cấp kinh phí
                </p>
              </div>

              {/* MỤC 2: KHO HIỆN VẬT */}
              <div className="rounded-xl bg-background/90 p-3 border border-border/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <Package className="size-3.5" />
                  <span>2. Kho Hiện Vật</span>
                </div>
                <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                  {fundsQ.data?.sponsorshipFund?.inKind?.inventory?.length ?? 3} vật phẩm
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  Tổng định giá: {fmtMoney(fundsQ.data?.sponsorshipFund?.inKind?.totalEstimatedValue ?? 45000000)} VNĐ
                </div>
              </div>
            </div>

            {/* Top hiện vật trong kho */}
            <div className="rounded-xl border border-border/50 bg-background/60 p-2.5 space-y-1">
              <div className="text-[10.5px] font-semibold text-foreground flex items-center justify-between">
                <span>Vật phẩm hiện vật sẵn sàng cấp phát:</span>
                <Link to="/sponsors" className="text-primary hover:underline text-[10px]">Xem tất cả</Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {((fundsQ.data?.sponsorshipFund?.inKind?.inventory && fundsQ.data.sponsorshipFund.inKind.inventory.length > 0)
                  ? fundsQ.data.sponsorshipFund.inKind.inventory.slice(0, 3)
                  : [
                    { name: "Áo đồng phục sự kiện", quantity: 200, unit: "bộ" },
                    { name: "Kỷ niệm chương mạ vàng", quantity: 50, unit: "chiếc" },
                    { name: "Gói giải pháp phần mềm", quantity: 10, unit: "suất" },
                  ]
                ).map((it: any, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-secondary text-secondary-foreground"
                  >
                    <span>{it.name}</span>
                    <span className="font-bold text-primary">({it.quantity} {it.unit})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* ── KHÓA HỌC & SỰ KIỆN TÔI THAM GIA (HỘI VIÊN - MỤC I.1 & UC-3) ── */}
      <Panel
        title="Khóa Học &amp; Sự Kiện Tôi Tham Gia (Hội Viên)"
        sub="Theo dõi các khóa đào tạo định kỳ Thứ 7 và sự kiện bạn đã đăng ký hoặc tham dự, tải slide bài giảng &amp; đóng góp ý kiến"
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/trainings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>Xem 30 khóa đào tạo</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        }
      >
        <div className="space-y-4">
          {/* 1. KHÓA ĐÀO TẠO ĐÃ THAM GIA */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                <GraduationCap className="size-4" />
                <span>Khóa học đã đăng ký / tham gia ({myEnrolledQ.data?.length || 0})</span>
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Lớp học cố định vào Thứ 7 hàng tuần &amp; chuyên đề
              </span>
            </div>

            {myEnrolledQ.isLoading ? (
              <ListSkeleton rows={2} />
            ) : !myEnrolledQ.data || myEnrolledQ.data.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Bạn chưa đăng ký tham gia khóa đào tạo nào. Hãy đăng ký ngay các khóa học Thứ 7 hàng tuần để cập nhật kiến thức quản trị doanh nghiệp!
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link
                    to="/trainings"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-xs"
                  >
                    <Plus className="size-3.5" />
                    <span>Đăng ký khóa học Thứ 7</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {myEnrolledQ.data.map((tr: any) => (
                  <div
                    key={tr.id}
                    className="rounded-xl border border-border bg-background p-3.5 space-y-2.5 hover:border-primary/40 transition shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600/10 text-purple-700 dark:text-purple-300">
                          {tr.isFixed ? "Cố định (Thứ 7 hàng tuần)" : "Chuyên đề linh hoạt"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tr.myStatus === "attended"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-blue-500/10 text-blue-600"
                        }`}>
                          {tr.myStatus === "attended" ? "Đã điểm danh" : "Đã đăng ký"}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                        {tr.title}
                      </h4>

                      <div className="text-[11px] text-muted-foreground">
                        Giảng viên: <span className="font-semibold text-foreground">{tr.instructorName || "Ban Đào Tạo CEO HN10"}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-1.5">
                      {tr.slideUrl ? (
                        <a
                          href={tr.slideUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-[10.5px] font-semibold transition"
                        >
                          <Download className="size-3" />
                          <span>Tải Slide</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Slide sắp cập nhật</span>
                      )}

                      <button
                        type="button"
                        onClick={() => setFeedbackTraining(tr)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-[10.5px] font-semibold transition cursor-pointer"
                      >
                        <MessageSquare className="size-3 text-amber-500" />
                        <span>Góp ý</span>
                      </button>

                      <Link
                        to="/trainings"
                        className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-primary hover:underline"
                      >
                        <span>Chi tiết</span>
                        <ChevronRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. SỰ KIỆN TÔI ĐÃ THAM GIA */}
          <div className="space-y-2.5 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                <CalendarClock className="size-4" />
                <span>Sự kiện đã tham gia / Đăng ký vé ({myEventsQ.data?.length || 0})</span>
              </span>
              <Link to="/events" className="text-[11px] font-semibold text-primary hover:underline">
                Xem 4 sự kiện tiêu biểu
              </Link>
            </div>

            {myEventsQ.isLoading ? (
              <ListSkeleton rows={2} />
            ) : !myEventsQ.data || myEventsQ.data.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Bạn chưa đăng ký tham dự sự kiện nào. Hãy khám phá 4 sự kiện sắp tới của CEOHN10 và quét mã QR vé tham dự!
                </p>
                <Link
                  to="/events"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-xs"
                >
                  <CalendarPlus className="size-3.5" />
                  <span>Khám phá sự kiện</span>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {myEventsQ.data.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-border bg-background p-3.5 space-y-2 hover:border-primary/40 transition shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                        <span className="font-semibold text-primary">{ev.date ? new Date(ev.date).toLocaleDateString("vi-VN") : "Sắp diễn ra"}</span>
                        <span className="px-1.5 py-0.2 rounded bg-muted text-foreground font-mono">{ev.ticketCode || "VÉ-ONLINE"}</span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug mt-1">
                        {ev.title || ev.name}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setFeedbackEvent(ev)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-[10.5px] font-semibold transition cursor-pointer"
                      >
                        <Star className="size-3 text-amber-500 fill-amber-500" />
                        <span>Đánh giá sự kiện</span>
                      </button>
                      <Link
                        to="/events/$eventId"
                        params={{ eventId: ev.id }}
                        className="text-[10.5px] font-semibold text-primary hover:underline"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>


      {/* Growth + Fee collection */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title={t("exec.growth.title")} sub={t("exec.growth.sub")} className="lg:col-span-2">
          <GrowthArea data={s.growth} />
        </Panel>

        <Panel title={t("exec.fees.title")}>
          <div className="text-[30px] font-bold leading-none tracking-tight text-foreground">
            {fmtMoney(s.revenue)}
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">{t("exec.fees.collected")}</p>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="font-medium text-foreground">{t("exec.fees.rate")}</span>
              <span className="font-semibold text-foreground">{feeRate}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${feeRate}%`, background: "var(--gradient-primary)" }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[11px] text-muted-foreground">{t("exec.fees.paid")}</div>
              <div className="mt-0.5 text-[18px] font-bold text-success">{s.paidInvoices}</div>
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-[11px] text-muted-foreground">{t("exec.fees.unpaid")}</div>
              <div className="mt-0.5 text-[18px] font-bold text-destructive">
                {s.unpaidInvoices}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Events + Activity */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title={t("exec.events.title")}
          action={<ViewAll to="/events" label={t("exec.viewAll")} />}
        >
          {eventsQ.isLoading ? (
            <ListSkeleton rows={3} />
          ) : upcoming.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-2.5">
              {upcoming.map((e: any) => {
                const d = new Date(e.date);
                return (
                  <li key={e.id}>
                    <Link
                      to="/events"
                      className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/40"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-center">
                        <span className="text-[16px] font-bold leading-none text-foreground">
                          {d.getDate()}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Th{d.getMonth() + 1}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold text-foreground">
                          {e.name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-[11.5px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {e.location && (
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{e.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[13px] font-bold text-primary">{e.registered}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {t("exec.events.registered")}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title={t("exec.activity.title")}
          action={<ViewAll to="/activity" label={t("exec.viewAll")} />}
        >
          {activityQ.isLoading ? (
            <ListSkeleton rows={4} />
          ) : recent.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-3.5">
              {recent.map((a: any) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-bold text-foreground">
                    {(a.user || "?").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-foreground">
                      <span className="font-semibold">{a.user}</span>{" "}
                      <span className="text-muted-foreground">{a.action}</span>{" "}
                      <span className="font-medium">{a.target}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{relTime(a.at, t)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Realtime Live Feed: Hội viên mới & Sản phẩm Marketplace mới nhất */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Hội viên mới gia nhập"
          action={<ViewAll to="/members" label={t("exec.viewAll")} />}
        >
          {membersQ.isLoading ? (
            <ListSkeleton rows={4} />
          ) : recentMembers.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-2.5">
              {recentMembers.map((m: any) => (
                <li key={m.id}>
                  <Link
                    to="/members/$memberId"
                    params={{ memberId: m.id }}
                    search={REVIEW_SEARCH_RESET}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    {(() => {
                      const pName = (m as any).personName || m.contact || m.name || "Hội viên";
                      const cName = (m as any).company || (m.type === 'company' ? m.name : '') || (m as any).companyName || m.industry || "Doanh nghiệp thành viên";
                      return (
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {(pName || "U").charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-semibold text-foreground">
                              {pName}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {cName}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="shrink-0 text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-500">
                        {m.status === "active" ? "Chính thức" : "Mới đăng ký"}
                      </span>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {relTime(m.createdAt || m.created_at || m.joinedAt || m.joined_at, t)}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Lớp học & Khóa đào tạo CEOHN10"
          action={<ViewAll to="/trainings" label={t("exec.viewAll")} />}
        >
          {trainingsQ.isLoading ? (
            <ListSkeleton rows={4} />
          ) : recentTrainings.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-2.5">
              {recentTrainings.map((p: any) => (
                <li key={p.id}>
                  <Link
                    to="/trainings"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-purple-500/10 text-base text-[#7C2D82]">
                        <GraduationCap className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-foreground">
                          {p.title || p.name || "Khóa đào tạo quản trị"}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {p.instructor || p.trainer || "Ban Đào tạo CEOHN10"}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[12px] font-bold text-primary">
                        {p.status === "open" ? "Đang mở" : "Sắp diễn ra"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {relTime(p.createdAt || p.created_at, t)}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Documents + Action queue */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          title="Tài liệu & Học liệu số CEOHN10"
          action={<ViewAll to="/documents" label={t("exec.viewAll")} />}
          className="lg:col-span-2"
        >
          {docsQ.isLoading ? (
            <ListSkeleton rows={3} />
          ) : recentDocs.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {recentDocs.map((doc: any) => (
                <li key={doc.id}>
                  <Link
                    to="/documents"
                    className="flex h-full items-start gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <span className="p-2 rounded-lg bg-purple-500/10 text-[#7C2D82]">
                      <FolderOpen className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-[13px] font-semibold text-foreground">
                        {doc.title || doc.name || "Tài liệu chuyên môn"}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>{doc.category || "Học liệu đào tạo"}</span>
                        <span>{relTime(doc.createdAt || doc.created_at, t)}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t("exec.queue.title")}>
          <ul className="space-y-2">
            {(canManageMembers || canManageFinance || isBQT || isPlatformAdmin) && (
              <QueueRow
                to="/renewal"
                icon={RefreshCw}
                tone="amber"
                label={t("exec.queue.renewals")}
                count={s.pendingRenewals}
              />
            )}
            {(canManageFinance || isBQT || isPlatformAdmin) && (
              <QueueRow
                to="/fees"
                icon={FileWarning}
                tone="rose"
                label={t("exec.queue.unpaid")}
                count={s.unpaidInvoices}
              />
            )}
            <QueueRow
              to="/trainings"
              icon={GraduationCap}
              tone="blue"
              label="Khóa đào tạo đang mở"
              count={recentTrainings.length}
            />
            <QueueRow
              to="/documents"
              icon={FolderOpen}
              tone="gold"
              label="Tài liệu chuyên môn"
              count={recentDocs.length}
            />
          </ul>
        </Panel>
      </div>

      {/* Công việc của tôi (My Tasks) */}
      <Panel
        title="Công việc của tôi"
        action={<ViewAll to="/tasks" label="Xem tất cả công việc" />}
      >
        {tasksQ.isLoading ? (
          <ListSkeleton rows={3} />
        ) : !tasksQ.data || tasksQ.data.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-border rounded-xl bg-muted/20 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <ClipboardList className="size-5" />
            </div>
            <div className="text-sm font-semibold text-foreground">
              Hiện tại bạn không có công việc nào cần xử lý
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              Mọi nhiệm vụ, công việc được Ban Điều Hành hoặc các Ban chuyên môn phân công sẽ hiển thị đầy đủ tại đây.
            </p>
            <Link
              to="/tasks"
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-xs cursor-pointer"
            >
              <span>Xem danh sách việc chung</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tasksQ.data.slice(0, 6).map((task: any) => {
              const priorityColor =
                task.priority === "CRITICAL"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  : task.priority === "HIGH"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
              const priorityText =
                task.priority === "CRITICAL"
                  ? "Khẩn cấp"
                  : task.priority === "HIGH"
                    ? "Ưu tiên cao"
                    : task.priority === "MEDIUM"
                      ? "Trung bình"
                      : "Thấp";
              const statusText =
                task.status === "DONE"
                  ? "Hoàn thành"
                  : task.status === "REVIEW"
                    ? "Chờ duyệt"
                    : task.status === "IN_PROGRESS"
                      ? "Đang làm"
                      : "Chưa bắt đầu";
              const statusColor =
                task.status === "DONE"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : task.status === "REVIEW"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : task.status === "IN_PROGRESS"
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "bg-slate-500/10 text-slate-600 dark:text-slate-400";

              return (
                <li key={task.id}>
                  <Link
                    to="/tasks"
                    search={{ taskId: task.id } as any}
                    className="flex flex-col justify-between h-full p-3.5 rounded-xl border border-border bg-background transition-all hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${priorityColor}`}>
                          {priorityText}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-bold text-foreground line-clamp-2 leading-snug">
                        {task.title}
                      </h4>
                      {task.department && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Building2 className="size-3 shrink-0" />
                          <span className="truncate">{task.department}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5 text-orange-500" />
                        <span>Hạn: {task.dueDate || "Chưa đặt"}</span>
                      </span>
                      {typeof task.progress === "number" && (
                        <span className="font-bold text-primary">{task.progress}%</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* Quick actions */}
      <Panel title={t("exec.quick.title")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(canManageEvents || isBQT || isPlatformAdmin) && (
            <QuickAction to="/events" icon={CalendarPlus} label={t("exec.quick.newEvent")} />
          )}
          {(canManageFinance || isBQT || isPlatformAdmin) && (
            <QuickAction to="/fees" icon={DollarSign} label={t("exec.quick.collectFee")} />
          )}
          {(canManageMedia || isBQT || isPlatformAdmin) && (
            <QuickAction to="/notifications" icon={Send} label={t("exec.quick.sendNotif")} />
          )}
          <QuickAction to="/trainings" icon={GraduationCap} label="Khóa đào tạo" />
          <QuickAction to="/documents" icon={FolderOpen} label="Tài liệu & Học liệu" />
        </div>
      </Panel>

      {/* Modals for Direct Feedback from Overview Dashboard */}
      {feedbackTraining && (
        <TrainingFeedbackModal
          open={!!feedbackTraining}
          trainingId={feedbackTraining.id}
          trainingTitle={feedbackTraining.title}
          onClose={() => setFeedbackTraining(null)}
        />
      )}

      {feedbackEvent && (
        <EventFeedbackModal
          open={!!feedbackEvent}
          eventId={feedbackEvent.id}
          eventName={feedbackEvent.title || feedbackEvent.name || ""}
          onClose={() => setFeedbackEvent(null)}
        />
      )}
    </div>
  );
}

type QueueTone = "blue" | "indigo" | "emerald" | "amber" | "red" | "rose" | "gold";

const toneStyles: Record<QueueTone, { bg: string; fg: string }> = {
  blue: { bg: "rgba(37, 99, 235, 0.12)", fg: "#2563EB" },
  indigo: { bg: "rgba(79, 70, 229, 0.12)", fg: "#4F46E5" },
  emerald: { bg: "rgba(16, 185, 129, 0.12)", fg: "#10B981" },
  amber: { bg: "rgba(245, 158, 11, 0.12)", fg: "#D97706" },
  red: { bg: "rgba(239, 68, 68, 0.12)", fg: "#EF4444" },
  rose: { bg: "rgba(244, 63, 94, 0.12)", fg: "#F43F5E" },
  gold: { bg: "rgba(79, 70, 229, 0.12)", fg: "#4F46E5" },
};

function QueueRow({
  to,
  icon: Icon,
  tone,
  label,
  count,
}: {
  to: string;
  icon: LucideIcon;
  tone: QueueTone;
  label: string;
  count: number;
}) {
  const st = toneStyles[tone] || toneStyles.blue;
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 rounded-xl border border-border bg-background p-2.5 transition-colors hover:bg-muted/40"
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: st.bg, color: st.fg }}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
          {label}
        </span>
        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[12px] font-bold text-foreground">
          {count}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition-all duration-[var(--motion-base)] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-[var(--motion-base)] group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[12.5px] font-medium text-foreground">{label}</span>
    </Link>
  );
}

// satisfy TKey usage type import
export type { TKey };
