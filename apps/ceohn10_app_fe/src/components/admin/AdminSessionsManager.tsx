import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldCheck,
  KeyRound,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Laptop,
  Smartphone,
  Globe,
  Lock,
  Unlock,
  AlertTriangle,
  UserCheck,
  UserX,
  Clock,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAdminSessions,
  revokeAdminSession,
  toggleAdminAccountStatus,
  type AdminAccountItem,
} from "@/lib/master-admin.functions";

export function AdminSessionsManager() {
  const [accounts, setAccounts] = useState<AdminAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminSessions();
      setAccounts(res.accounts || []);
    } catch (err: any) {
      toast.error("Không thể tải danh sách tài khoản quản trị: " + err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRevokeSession = async (sessionId: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn ngắt phiên làm việc và đăng xuất tài khoản "${name}" từ xa?`)) {
      return;
    }

    setRevokingId(sessionId);
    try {
      await revokeAdminSession(sessionId);
      toast.success(`Đã thu hồi phiên ${sessionId} của ${name}. Thiết bị đã bị đăng xuất.`);
      loadData();
    } catch (err: any) {
      toast.error("Lỗi khi thu hồi phiên: " + err?.message);
    } finally {
      setRevokingId(null);
    }
  };

  const handleToggleStatus = async (account: AdminAccountItem) => {
    const nextStatus = !account.isActive;
    const actionText = nextStatus ? "kích hoạt" : "tạm khóa";

    if (!confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản quản trị "${account.name}"?`)) {
      return;
    }

    try {
      await toggleAdminAccountStatus(account.id, nextStatus);
      toast.success(`Đã ${actionText} tài khoản ${account.name} thành công.`);
      loadData();
    } catch (err: any) {
      toast.error("Lỗi thay đổi trạng thái: " + err?.message);
    }
  };

  const filtered = accounts.filter((a) => {
    const matchSearch =
      searchTerm === "" ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.roleLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && a.isOnline) ||
      (statusFilter === "active" && a.isActive) ||
      (statusFilter === "locked" && !a.isActive);
    return matchSearch && matchStatus;
  });

  const onlineCount = accounts.filter((a) => a.isOnline).length;

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">
              [2. QUẢN LÝ TÀI KHOẢN QUẢN TRỊ ĐƯỢC ĐĂNG NHẬP]
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {onlineCount} tài khoản đang đăng nhập
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Quản lý tài khoản quản trị đang đăng nhập · Giám sát phiên làm việc (Active Sessions) · Phân quyền &amp; Khóa khẩn cấp
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 transition cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Tải lại</span>
        </button>
      </div>

      {/* Filter and stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên quản trị viên, email, ban, vai trò..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none"
          >
            <option value="all">Tất cả tài khoản ({accounts.length})</option>
            <option value="online">Đang Online ({onlineCount})</option>
            <option value="active">Đã Kích Hoạt ({accounts.filter((a) => a.isActive).length})</option>
            <option value="locked">Tạm Khóa ({accounts.filter((a) => !a.isActive).length})</option>
          </select>
        </div>
      </div>

      {/* Danh sách tài khoản quản trị và phiên làm việc */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Tài Khoản Quản Trị</th>
                <th className="px-4 py-3">Ban Chuyên Môn / Vai Trò</th>
                <th className="px-4 py-3">Trạng Thái Đăng Nhập</th>
                <th className="px-4 py-3">Phiên Làm Việc &amp; Thiết Bị</th>
                <th className="px-4 py-3">IP &amp; Thời Gian</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((a) => {
                const isOnline = a.isOnline;
                const isRevoking = revokingId === a.session.sessionId;

                return (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    {/* Tên & Email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
                          {a.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{a.name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{a.email}</div>
                          <div className="text-[10px] text-muted-foreground">{a.phone}</div>
                        </div>
                      </div>
                    </td>

                    {/* Ban & Vai Trò */}
                    <td className="px-4 py-3">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                          <ShieldCheck className="h-3 w-3" />
                          {a.roleLabel}
                        </span>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{a.department}</div>
                      </div>
                    </td>

                    {/* Trạng thái Online */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold border ${
                            isOnline
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          {isOnline ? "Đang Online" : "Ngoại tuyến"}
                        </span>

                        <div>
                          {a.isActive ? (
                            <span className="text-[10px] font-semibold text-emerald-600">● Kích hoạt</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-rose-600">● Đang khóa</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phiên làm việc & Thiết bị */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 font-semibold text-foreground text-[11.5px]">
                          <Laptop className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[170px]">{a.device}</span>
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          ID: {a.session.sessionId}
                        </div>
                      </div>
                    </td>

                    {/* IP & Thời gian */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center gap-1 font-mono text-foreground font-semibold">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{a.lastIp}</span>
                        </div>
                        <div className="text-[10.5px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(a.lastLoginAt).toLocaleTimeString("vi-VN")}</span>
                        </div>
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isOnline && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(a.session.sessionId, a.name)}
                            disabled={isRevoking}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                            title="Ngắt phiên làm việc từ xa"
                          >
                            <LogOut className="h-3 w-3" />
                            <span>{isRevoking ? "Đang ngắt..." : "Thu hồi phiên"}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(a)}
                          className={`rounded-lg p-1.5 transition cursor-pointer ${
                            a.isActive
                              ? "text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
                              : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                          }`}
                          title={a.isActive ? "Tạm khóa tài khoản" : "Mở khóa tài khoản"}
                        >
                          {a.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
