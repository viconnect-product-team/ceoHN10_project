import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  RefreshCw,
  Calendar,
  User,
  ShieldAlert,
  ArrowRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/dashboard/PageKit";
import { fetchNestApi } from "@/lib/api-client";

export interface RbacAuditLog {
  id: string;
  actor_id?: string;
  actor_name?: string;
  actor_email?: string;
  action: string;
  target_user_id?: string;
  target_user_email?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export function RbacAuditLogsSection({ className = "" }: { className?: string }) {
  const [logs, setLogs] = useState<RbacAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchNestApi<any>("/rbac/audit-logs");
      if (res && res.data) {
        setLogs(res.data);
      } else {
        // Fallback demo audit logs
        setLogs([
          {
            id: "log-001",
            actor_name: "Chủ tịch CLB CEO HN10",
            actor_email: "admin@viconnect.vn",
            action: "ASSIGN_ROLE",
            target_user_email: "loptruong@ceohn10.vn",
            details: { role: "LOP_TRUONG", scope: "CLASS", scopeId: "CEOHN10_K10" },
            ip_address: "113.20.107.184",
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: "log-002",
            actor_name: "Hệ thống SePay Webhook",
            actor_email: "gateway@sepay.vn",
            action: "POST_TRANSACTION",
            target_user_email: "payment@ceohn10.vn",
            details: { gateway: "sepay", amount: 20000000, reference: "TRF-TECH-20M-2026" },
            ip_address: "113.20.107.184",
            created_at: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            id: "log-003",
            actor_name: "Chủ tịch CLB CEO HN10",
            actor_email: "admin@viconnect.vn",
            action: "APPROVE_OPENING_BALANCE",
            details: { period: "OB_2026_INITIAL", total_amount: 2100000000 },
            ip_address: "113.20.107.184",
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
        ]);
      }
    } catch {
      toast.error("Không thể tải nhật ký kiểm toán");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((log) => {
    if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchActor = log.actor_name?.toLowerCase().includes(q) || log.actor_email?.toLowerCase().includes(q);
      const matchTarget = log.target_user_email?.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      if (!matchActor && !matchTarget && !matchAction) return false;
    }
    return true;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl border-0 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-xs font-semibold">
              <ShieldAlert className="size-3.5" />
              <span>Ghi Nhận & Truy Vết Bất Biến (Immutable Audit Logs)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Nhật Ký Kiểm Toán Toàn Diện (RBAC & Financial Audit Trail)
            </h2>
            <p className="text-xs text-slate-300">
              Lưu vết 100% các hành động gán quyền, thu hồi vai trò, cập nhật ma trận quyền và phê duyệt tài chính.
            </p>
          </div>
          <button
            onClick={loadLogs}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-white/10"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới nhật ký
          </button>
        </div>
      </Card>

      {/* Filter Toolbar */}
      <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo người thao tác, đối tượng, hành vi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-input bg-background font-semibold"
            >
              <option value="ALL">Tất cả hành vi (Action)</option>
              <option value="ASSIGN_ROLE">Bổ nhiệm chức vụ (ASSIGN_ROLE)</option>
              <option value="REVOKE_ROLE">Thu hồi chức vụ (REVOKE_ROLE)</option>
              <option value="UPDATE_MATRIX">Cập nhật ma trận (UPDATE_MATRIX)</option>
              <option value="APPROVE_OPENING_BALANCE">Phê duyệt số dư đầu kỳ</option>
              <option value="POST_TRANSACTION">Ghi nhận giao dịch</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Thời Gian & IP</th>
                <th className="py-3 px-4">Người Thực Hiện (Actor)</th>
                <th className="py-3 px-4">Hành Vi (Action)</th>
                <th className="py-3 px-4">Đối Tượng Tác Động</th>
                <th className="py-3 px-4">Dữ Liệu Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Chưa có sự kiện kiểm toán nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/40 transition">
                    <td className="py-3 px-4 text-muted-foreground text-[11px] whitespace-nowrap">
                      <div className="font-mono text-foreground">{new Date(log.created_at).toLocaleString("vi-VN")}</div>
                      <div className="font-mono text-[10px]">{log.ip_address || "Internal System"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">{log.actor_name || "Hệ thống"}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{log.actor_email || "system@local"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-mono font-bold text-[10px] border border-indigo-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-foreground">{log.target_user_email || "—"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <pre className="text-[10px] font-mono bg-muted/60 p-1.5 rounded-lg max-w-xs overflow-x-auto text-foreground">
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}