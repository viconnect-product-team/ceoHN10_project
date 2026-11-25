import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  DollarSign,
  Building2,
  Mail,
  Phone,
  MapPin,
  Tag,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  Sparkles,
  User,
  Shield,
} from "lucide-react";
import type { DynamicFieldDef } from "./DynamicFieldRenderer";

interface DynamicDetailViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  record: Record<string, any> | null;
  dynamicFields?: DynamicFieldDef[];
  onEdit?: () => void;
}

export function DynamicDetailViewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  record,
  dynamicFields = [],
  onEdit,
}: DynamicDetailViewModalProps) {
  if (!record) return null;

  const customData = record.customData || record.custom_data || {};

  // Nhóm trường core
  const coreFields = [
    { label: "Mã định danh", value: record.code || record.memberCode || record.voucher_no || record.id },
    { label: "Họ và tên / Tiêu đề", value: record.name || record.fullName || record.title || record.memberName },
    { label: "Email", value: record.email, icon: Mail },
    { label: "Số điện thoại", value: record.phone, icon: Phone },
    { label: "Công ty / Doanh nghiệp", value: record.company || record.companyName, icon: Building2 },
    { label: "Chức vụ / Vị trí", value: record.position || record.executiveRole },
    { label: "Ban chuyên môn", value: record.department },
    { label: "Địa chỉ", value: record.address, icon: MapPin },
    { label: "Trạng thái", value: record.status },
  ].filter((f) => f.value !== undefined && f.value !== null && String(f.value).trim() !== "");

  // Nhóm trường động
  const activeDynamicDefs = dynamicFields.filter((df) => df.is_enabled !== false);

  const formatDynamicValue = (def: DynamicFieldDef, rawVal: any) => {
    if (rawVal === undefined || rawVal === null || rawVal === "") return "—";
    switch (def.field_type) {
      case "currency":
        return `${Number(String(rawVal).replace(/[^0-9]/g, "")).toLocaleString("vi-VN")} đ`;
      case "number":
        return Number(rawVal).toLocaleString("vi-VN");
      case "date":
        return new Date(rawVal).toLocaleDateString("vi-VN");
      case "datetime":
        return new Date(rawVal).toLocaleString("vi-VN");
      case "switch":
        return Boolean(rawVal) ? "✓ Có / Đạt" : "✗ Không";
      case "url":
        return (
          <a
            href={String(rawVal).startsWith("http") ? String(rawVal) : `https://${rawVal}`}
            target="_blank"
            rel="noreferrer"
            className="text-[#003B95] underline inline-flex items-center gap-1"
          >
            <span>{String(rawVal)}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      default:
        return String(rawVal);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-background text-foreground shadow-2xl rounded-2xl border border-border">
        {/* HEADER */}
        <DialogHeader className="p-5 border-b border-border bg-card/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003B95]/10 text-[#003B95] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">{title}</DialogTitle>
              {subtitle && <DialogDescription className="text-xs text-muted-foreground mt-0.5">{subtitle}</DialogDescription>}
            </div>
          </div>

          {onEdit && (
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="text-xs h-8 bg-[#003B95] hover:bg-[#002B70] text-white"
            >
              Chỉnh sửa
            </Button>
          )}
        </DialogHeader>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Thông tin cơ bản */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#003B95]" />
              <span>Thông tin cốt lõi</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-border bg-card">
              {coreFields.map((f, i) => (
                <div key={i} className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground">{f.label}</span>
                  <p className="font-semibold text-foreground">{String(f.value)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trường dữ liệu động (Custom Fields) */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Trường dữ liệu tùy biến (Dynamic Fields)</span>
            </h4>

            {activeDynamicDefs.length === 0 && Object.keys(customData).length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border text-center text-muted-foreground">
                Chưa có trường dữ liệu tùy biến nào được cấu hình cho bản ghi này.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-amber-200/60 bg-amber-50/20">
                {activeDynamicDefs.map((df) => {
                  const val = customData[df.field_name] ?? record[df.field_name];
                  return (
                    <div key={df.id} className="space-y-0.5">
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <span>{df.field_label}</span>
                        <code className="text-[9px] font-mono opacity-60">({df.field_type})</code>
                      </span>
                      <p className="font-semibold text-foreground">
                        {formatDynamicValue(df, val)}
                      </p>
                    </div>
                  );
                })}

                {/* Hiển thị thêm các key có trong customData mà chưa có trong schema */}
                {Object.entries(customData)
                  .filter(([k]) => !activeDynamicDefs.some((d) => d.field_name === k))
                  .map(([k, v]) => (
                    <div key={k} className="space-y-0.5">
                      <span className="text-[11px] font-medium text-muted-foreground">{k}</span>
                      <p className="font-semibold text-foreground">{String(v ?? "—")}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-border bg-card/60 flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-9 border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
