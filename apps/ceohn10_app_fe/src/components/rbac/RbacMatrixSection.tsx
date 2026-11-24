import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Check,
  X,
  Search,
  RefreshCw,
  Lock,
  Layers,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/dashboard/PageKit";
import { fetchNestApi } from "@/lib/api-client";

interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string;
}

interface Role {
  id: string;
  code: string;
  name: string;
  scope_level: string;
  description: string;
}

export function RbacMatrixSection({ className = "" }: { className?: string }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");

  const loadMatrix = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, mRes] = await Promise.all([
        fetchNestApi<any>("/rbac/roles"),
        fetchNestApi<any>("/rbac/permissions"),
        fetchNestApi<any>("/rbac/matrix"),
      ]);

      if (Array.isArray(rRes)) setRoles(rRes);
      else if (rRes && rRes.data) setRoles(rRes.data);

      if (Array.isArray(pRes)) setPermissions(pRes);
      else if (pRes && pRes.data) setPermissions(pRes.data);

      if (mRes && mRes.mappings && Array.isArray(mRes.mappings)) {
        const mat: Record<string, string[]> = {};
        for (const map of mRes.mappings) {
          if (!mat[map.role_id]) mat[map.role_id] = [];
          mat[map.role_id].push(map.permission_id);
        }
        setMatrix(mat);
      } else if (mRes && mRes.data) {
        setMatrix(mRes.data);
      }
    } catch {
      toast.error("Không thể tải ma trận phân quyền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  const modules = Array.from(new Set(permissions.map((p) => p.module))).sort();

  const filteredPermissions = permissions.filter((p) => {
    if (moduleFilter !== "ALL" && p.module !== moduleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!p.code.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl border-0 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <ShieldCheck className="size-3.5" />
              <span>Ma Trận Quyền Động (Dynamic Permission Matrix)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Cấu Hình Ma Trận Quyền Hạn (15 Roles × 38 Permissions)
            </h2>
            <p className="text-xs text-slate-300">
              Quy định rõ ràng từng hành động (CREATE, READ, UPDATE, DELETE, APPROVE, POST) theo từng module nghiệp vụ.
            </p>
          </div>
          <button
            onClick={loadMatrix}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-white/10"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới ma trận
          </button>
        </div>
      </Card>

      {/* Filter Controls */}
      <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm mã quyền, hành động..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-input bg-background font-semibold"
            >
              <option value="ALL">Tất Cả Module Nghiệp Vụ</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  Module: {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Permission Matrix Table */}
      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 min-w-[240px] sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                  Quyền Hạn (Permission Code & Mô tả)
                </th>
                {roles.map((r) => (
                  <th key={r.code} className="py-3 px-3 text-center min-w-[110px] border-r border-slate-800 text-[10px]">
                    <div className="font-bold text-amber-300">{r.name}</div>
                    <div className="text-[9px] text-slate-400 font-mono font-normal">{r.code}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPermissions.map((perm) => (
                <tr key={perm.code} className="hover:bg-muted/40 transition">
                  <td className="py-2.5 px-4 sticky left-0 bg-card z-10 border-r border-border">
                    <div className="font-mono font-bold text-foreground">{perm.code}</div>
                    <div className="text-[11px] text-muted-foreground">{perm.description}</div>
                  </td>
                  {roles.map((r) => {
                    const hasPerm = matrix[r.code]?.includes(perm.code);
                    return (
                      <td key={r.code} className="py-2.5 px-3 text-center border-r border-border">
                        {hasPerm ? (
                          <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                            <Check className="size-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center size-6 rounded-full bg-slate-100 text-slate-300 dark:bg-slate-900 dark:text-slate-600">
                            <X className="size-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}