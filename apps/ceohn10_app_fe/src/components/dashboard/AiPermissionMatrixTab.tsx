import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Save,
  RotateCcw,
  Check,
  X,
  ShieldCheck,
  Info,
  AlertCircle,
  FileCheck2,
  BookOpen,
  Mail,
  FileText,
  Database,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export interface AiCapabilityItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  requiresReviewStep: boolean;
  defaultRoles: Record<string, boolean>;
}

export const AI_ROLE_COLUMNS = [
  { key: "quan_tri", label: "Quản Trị Viên", desc: "Platform Admin & System Admin" },
  { key: "chu_tich", label: "Lớp Trưởng / Chủ Tịch", desc: "Lãnh đạo tối cao Ban Điều Hành" },
  { key: "pho_chu_tich", label: "Lớp Phó Lâm Thời", desc: "Ban Điều Hành & Phó Ban" },
  { key: "tong_thu_ky", label: "Ban Thư Ký", desc: "Tổng Thư ký & Thư ký lớp" },
  { key: "truong_ban_tai_chinh", label: "Ban Tài Chính & Tài Trợ", desc: "Kế toán & Quản lý 2 túi quỹ" },
  { key: "truong_ban_truyen_thong", label: "Ban Truyền Thông", desc: "Nội dung, sự kiện & thông báo" },
  { key: "member", label: "Học Viên Doanh Nhân", desc: "Thành viên chính thức CLB" },
];

export function AiPermissionMatrixTab() {
  const [capabilities, setCapabilities] = useState<AiCapabilityItem[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [initialMatrixStr, setInitialMatrixStr] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetchNestApi<any>("/ai/permissions/matrix");
      if (res && res.data) {
        setCapabilities(res.data.capabilities || []);
        setMatrix(res.data.matrix || {});
        setInitialMatrixStr(JSON.stringify(res.data.matrix || {}));
      }
    } catch (e: any) {
      console.error("[AiPermissionMatrix] Lỗi tải ma trận:", e);
      toast.error("Không thể kết nối đến máy chủ CSDL ma trận phân quyền AI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleToggle = (capCode: string, roleKey: string) => {
    setMatrix((prev) => {
      const currentVal = Boolean(prev[capCode]?.[roleKey]);
      return {
        ...prev,
        [capCode]: {
          ...(prev[capCode] || {}),
          [roleKey]: !currentVal,
        },
      };
    });
  };

  const handleToggleColumn = (roleKey: string, roleLabel: string) => {
    let total = capabilities.length;
    let enabled = 0;
    capabilities.forEach((c) => {
      if (matrix[c.code]?.[roleKey]) enabled++;
    });

    const targetVal = enabled < total;
    setMatrix((prev) => {
      const next = { ...prev };
      capabilities.forEach((c) => {
        next[c.code] = {
          ...(next[c.code] || {}),
          [roleKey]: targetVal,
        };
      });
      return next;
    });

    toast.success(
      targetVal
        ? `Đã cấp TOÀN BỘ quyền AI cho vai trò "${roleLabel}"!`
        : `Đã thu hồi tất cả quyền AI của vai trò "${roleLabel}"!`
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchNestApi("/ai/permissions/matrix", {
        method: "PUT",
        body: { matrix },
      });
      setInitialMatrixStr(JSON.stringify(matrix));
      toast.success("Đã lưu ma trận phân quyền Trợ Lý AI vào CSDL PostgreSQL thành công!");
    } catch (e: any) {
      toast.error(e?.message || "Lỗi khi lưu cấu hình phân quyền AI");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = () => {
    if (!confirm("Khôi phục ma trận phân quyền AI về cấu hình mặc định an toàn?")) return;
    const defaultMatrix: Record<string, Record<string, boolean>> = {};
    capabilities.forEach((c) => {
      defaultMatrix[c.code] = { ...c.defaultRoles };
    });
    setMatrix(defaultMatrix);
    toast.info("Đã đặt lại ma trận về cấu hình khuyến nghị. Vui lòng bấm 'Lưu Cấu Hình AI' để ghi vào CSDL.");
  };

  const isDirty = initialMatrixStr && JSON.stringify(matrix) !== initialMatrixStr;

  const getCapabilityIcon = (code: string) => {
    switch (code) {
      case "AI_READ_ANALYTICS":
        return <FileCheck2 className="size-4 text-blue-600 dark:text-blue-400" />;
      case "AI_READ_TECHNICAL_DOCS":
        return <BookOpen className="size-4 text-indigo-600 dark:text-indigo-400" />;
      case "AI_EXTRACT_DOCUMENTS":
        return <FileSpreadsheet className="size-4 text-amber-600 dark:text-amber-400" />;
      case "AI_SEND_FEE_REMINDERS":
        return <Mail className="size-4 text-emerald-600 dark:text-emerald-400" />;
      case "AI_SEND_EVENT_NOTICES":
        return <Mail className="size-4 text-teal-600 dark:text-teal-400" />;
      case "AI_EXPORT_REPORTS":
        return <FileText className="size-4 text-purple-600 dark:text-purple-400" />;
      case "AI_QUERY_DATABASE":
        return <Database className="size-4 text-rose-600 dark:text-rose-400" />;
      case "AI_APPROVE_ACTIONS":
        return <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Sparkles className="size-4 text-amber-500" />;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Banner Giới thiệu Năng Lực AI */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="size-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">Phân Quyền Năng Lực Trợ Lý AI Điều Hành</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PostgreSQL Realtime
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              Cấu hình chi tiết quyền hạn cho Trợ lý AI theo từng nhóm vai trò: cho phép AI đọc phân tích dữ liệu, bóc tách tài liệu BRD/SRS/CSDL, tự động gửi email nhắc phí, xuất báo cáo và thực thi tác vụ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 animate-pulse">
              <AlertCircle className="size-3.5" />
              Chưa lưu thay đổi
            </span>
          )}
          <button
            type="button"
            onClick={handleResetDefault}
            className="h-9 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Khôi phục quyền mặc định"
          >
            <RotateCcw className="size-3.5" />
            <span>Mặc định</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="size-4" />
            <span>{saving ? "Đang lưu CSDL..." : "Lưu Cấu Hình AI"}</span>
          </button>
        </div>
      </div>

      {/* Bảng Ma Trận Phân Quyền AI */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            Đang tải dữ liệu ma trận phân quyền AI từ CSDL PostgreSQL 113.20.107.184:6432...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                  <th className="py-3.5 px-4 text-xs font-bold min-w-[280px]">
                    Năng Lực &amp; Quyền Hạn Của AI
                  </th>
                  {AI_ROLE_COLUMNS.map((col) => (
                    <th key={col.key} className="py-3.5 px-3 text-center min-w-[120px] max-w-[150px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold truncate max-w-[130px]">{col.label}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleColumn(col.key, col.label)}
                          className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Chọn tất cả
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {capabilities.map((cap, idx) => (
                  <tr
                    key={cap.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 size-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                          {getCapabilityIcon(cap.code)}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {cap.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {cap.code}
                            </span>
                            {cap.requiresReviewStep && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                                Cần Duyệt Trước Khi Gửi
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {cap.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {AI_ROLE_COLUMNS.map((col) => {
                      const isChecked = Boolean(matrix[cap.code]?.[col.key]);
                      return (
                        <td key={col.key} className="py-3 px-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleToggle(cap.code, col.key)}
                            className={`size-6 mx-auto rounded-lg flex items-center justify-center transition cursor-pointer border ${
                              isChecked
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs scale-105"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                            }`}
                            title={`${isChecked ? "Thu hồi" : "Cấp"} quyền "${cap.name}" cho ${col.label}`}
                          >
                            {isChecked ? <Check className="size-3.5 stroke-[3]" /> : <X className="size-3" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chú thích & Hướng dẫn Vận hành */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs text-muted-foreground space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <Info className="size-4 text-primary" />
          <span>Quy Chuẩn Vận Hành Trợ Lý AI:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
          <li>
            <strong>Nguyên tắc kiểm duyệt:</strong> Với các hành động gửi email nhắc phí, gửi thông báo sự kiện hoặc xuất file, AI sẽ hiển thị đầy đủ các bước chuẩn bị (nội dung, danh sách người nhận chọn 1, nhiều hoặc tất cả) và chỉ thực thi khi người dùng bấm nút <strong>"Duyệt &amp; Gửi"</strong> cuối cùng.
          </li>
          <li>
            <strong>Bảo mật CSDL:</strong> Quyền truy vấn CSDL (\`AI_QUERY_DATABASE\`) chỉ chạy các câu lệnh SELECT an toàn qua PgBouncer máy chủ 113.20.107.184:6432, tuyệt đối không cho phép DROP hay ALTER.
          </li>
          <li>
            <strong>Lưu trữ tập trung:</strong> Toàn bộ cấu hình ma trận này được lưu trực tiếp vào CSDL PostgreSQL trong bảng \`public.app_settings\` với key \`ai_permission_matrix\`.
          </li>
        </ul>
      </div>
    </div>
  );
}
