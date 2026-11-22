import React, { useState } from "react";
import {
  X,
  Sliders,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  QrCode,
  FileText,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export interface CustomFormField {
  id: string;
  label: string;
  name: string;
  type: "text" | "number" | "select" | "checkbox" | "email" | "tel";
  required: boolean;
  placeholder?: string;
  options?: string[]; // Cho select
}

export interface FormConfig {
  registrationFields: CustomFormField[];
  checkinFields: CustomFormField[];
}

export function EventFormConfigModal({
  open,
  eventId,
  eventName,
  initialConfig,
  onClose,
  onSaved,
}: {
  open: boolean;
  eventId: string;
  eventName: string;
  initialConfig?: FormConfig;
  onClose: () => void;
  onSaved?: (cfg: FormConfig) => void;
}) {
  const [activeTab, setActiveTab] = useState<"registration" | "checkin">("registration");

  const [registrationFields, setRegistrationFields] = useState<CustomFormField[]>(() => {
    return initialConfig?.registrationFields || [
      { id: "f1", label: "Quy mô doanh nghiệp (Số nhân sự)", name: "company_size", type: "select", required: false, options: ["Dưới 20", "20 - 50", "50 - 200", "Trên 200"] },
      { id: "f2", label: "Nhu cầu kết nối giao thương", name: "b2b_demand", type: "text", required: false, placeholder: "VD: Cần tìm đối tác sản xuất..." },
    ];
  });

  const [checkinFields, setCheckinFields] = useState<CustomFormField[]>(() => {
    return initialConfig?.checkinFields || [
      { id: "c1", label: "Bàn tiệc phân bổ", name: "assigned_table", type: "text", required: false, placeholder: "VD: Bàn VIP 01" },
      { id: "c2", label: "Đã nhận quà tặng đại biểu", name: "received_gift", type: "checkbox", required: false },
    ];
  });

  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const currentFields = activeTab === "registration" ? registrationFields : checkinFields;
  const setCurrentFields = activeTab === "registration" ? setRegistrationFields : setCheckinFields;

  const addField = () => {
    const newId = `field_${Date.now()}`;
    setCurrentFields([
      ...currentFields,
      {
        id: newId,
        label: "Trường dữ liệu mới",
        name: `custom_${newId.slice(-6)}`,
        type: "text",
        required: false,
        placeholder: "Nhập giá trị...",
      },
    ]);
  };

  const removeField = (id: string) => {
    setCurrentFields(currentFields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<CustomFormField>) => {
    setCurrentFields(currentFields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: FormConfig = {
        registrationFields,
        checkinFields,
      };

      await fetchNestApi(`/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify({
          form_config: payload,
        }),
      });

      toast.success("Đã lưu và áp dụng cấu hình Form Đăng Ký & Check-in thành công!");
      if (onSaved) onSaved(payload);
      onClose();
    } catch {
      toast.error("Không thể lưu cấu hình form lúc này");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl border border-border bg-white dark:bg-card shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-[#002B70] via-[#003B95] to-[#0A4DB0] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide">
                CẤU HÌNH BIỂU MẪU ĐĂNG KÝ &amp; CHECK-IN (FORM BUILDER)
              </h2>
              <p className="text-xs text-blue-200 line-clamp-1">{eventName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-muted/30 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("registration")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "registration"
                  ? "bg-[#003B95] text-white shadow-sm"
                  : "bg-white dark:bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Form Đăng Ký Đại Biểu ({registrationFields.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("checkin")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "checkin"
                  ? "bg-[#003B95] text-white shadow-sm"
                  : "bg-white dark:bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Form Check-in Tại Cửa ({checkinFields.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={addField}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Trường Mới</span>
          </button>
        </div>

        {/* Body Form List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300">
            <strong>Nguyên tắc Form Tùy Biến Động:</strong> Quản trị viên có thể tự do thêm, sửa, xóa các trường theo yêu cầu của từng sự kiện cụ thể. Khi bấm <strong>Áp dụng</strong>, toàn bộ biểu mẫu Web công khai và cổng soát vé sẽ tự động chuẩn hóa theo cấu hình này.
          </div>

          {currentFields.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground rounded-2xl border-2 border-dashed border-border">
              Chưa có trường tùy biến nào. Bấm <strong>+ Thêm Trường Mới</strong> để tạo.
            </div>
          ) : (
            currentFields.map((field, idx) => (
              <div
                key={field.id}
                className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                    Trường #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa trường</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Tiêu đề hiển thị (Label) *
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="w-full h-8 px-3 rounded-lg border border-border bg-background outline-none focus:border-[#003B95]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Loại dữ liệu
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                      className="w-full h-8 px-2.5 rounded-lg border border-border bg-background outline-none focus:border-[#003B95]"
                    >
                      <option value="text">Văn bản (Text)</option>
                      <option value="number">Số lượng (Number)</option>
                      <option value="select">Hộp lựa chọn (Select Dropdown)</option>
                      <option value="checkbox">Hộp kiểm (Checkbox)</option>
                      <option value="email">Email</option>
                      <option value="tel">Số điện thoại</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Mô tả gợi ý (Placeholder)
                    </label>
                    <input
                      type="text"
                      value={field.placeholder || ""}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      className="w-full h-8 px-3 rounded-lg border border-border bg-background outline-none focus:border-[#003B95]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="rounded text-[#003B95]"
                    />
                    <span>Bắt buộc điền (Required)</span>
                  </label>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-slate-50 dark:bg-muted/30 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted cursor-pointer transition"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Đang Lưu..." : "Áp Dụng Biểu Mẫu Chuẩn"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
