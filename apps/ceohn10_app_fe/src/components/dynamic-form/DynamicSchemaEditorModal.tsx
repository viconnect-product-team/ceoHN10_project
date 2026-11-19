import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sliders,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import type { DynamicFieldDef } from "./DynamicFieldRenderer";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityTitle?: string;
  fields: DynamicFieldDef[];
  onFieldsUpdated: () => void;
}

export function DynamicSchemaEditorModal({
  isOpen,
  onClose,
  entityType,
  entityTitle = "Học viên",
  fields,
  onFieldsUpdated,
}: Props) {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<DynamicFieldDef>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFieldData, setNewFieldData] = useState<Partial<DynamicFieldDef>>({
    field_name: "",
    field_label: "",
    field_type: "text",
    placeholder: "",
    is_required: false,
    is_enabled: true,
    options: [],
  });
  const [optionsInput, setOptionsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (f: DynamicFieldDef) => {
    setEditingFieldId(f.id);
    const optsStr = (f.options || [])
      .map((o) => (typeof o === "string" ? o : o.value))
      .join(", ");
    setOptionsInput(optsStr);
    setEditFormData({ ...f });
  };

  const cancelEdit = () => {
    setEditingFieldId(null);
    setEditFormData({});
    setOptionsInput("");
  };

  const saveEdit = async (id: string) => {
    setIsSubmitting(true);
    try {
      const opts = optionsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        ...editFormData,
        options: editFormData.field_type === "select" ? opts : [],
      };

      await fetchNestApi(`/dynamic-fields/fields/${id}`, {
        method: "PUT",
        body: payload,
      });

      toast.success("Đã cập nhật trường dữ liệu thành công");
      cancelEdit();
      onFieldsUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi cập nhật trường");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFieldEnabled = async (field: DynamicFieldDef) => {
    try {
      await fetchNestApi(`/dynamic-fields/fields/${field.id}`, {
        method: "PUT",
        body: { is_enabled: !field.is_enabled },
      });
      toast.success(`Đã ${!field.is_enabled ? "bật" : "tắt"} hiển thị trường ${field.field_label}`);
      onFieldsUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi đổi trạng thái trường");
    }
  };

  const handleAddNew = async () => {
    if (!newFieldData.field_label?.trim()) {
      toast.error("Vui lòng nhập tiêu đề hiển thị của trường");
      return;
    }
    const nameSlug =
      newFieldData.field_name?.trim() ||
      newFieldData.field_label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_");

    setIsSubmitting(true);
    try {
      const opts = optionsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await fetchNestApi("/dynamic-fields/fields", {
        method: "POST",
        body: {
          ...newFieldData,
          entity_type: entityType,
          field_name: nameSlug,
          options: newFieldData.field_type === "select" ? opts : [],
          order_index: fields.length + 1,
        },
      });

      toast.success("Đã thêm trường động mới vào CSDL thành công");
      setIsAddingNew(false);
      setNewFieldData({
        field_name: "",
        field_label: "",
        field_type: "text",
        placeholder: "",
        is_required: false,
        is_enabled: true,
        options: [],
      });
      setOptionsInput("");
      onFieldsUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi thêm trường mới");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteField = async (id: string, label: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa trường "${label}" khỏi hệ thống?`)) return;
    try {
      await fetchNestApi(`/dynamic-fields/fields/${id}`, {
        method: "DELETE",
      });
      toast.success(`Đã xóa trường "${label}" thành công`);
      onFieldsUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi xóa trường");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Cấu Hình Trường Động Ban Công Nghệ · {entityTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Tự do tùy biến định dạng trường (select, textarea, text, number...), bật/tắt hoặc thêm mới vào popup theo yêu cầu.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Danh sách trường */}
        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Danh sách trường cấu hình ({fields.length})
            </span>
            {!isAddingNew && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingNew(true)}
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm trường mới
              </Button>
            )}
          </div>

          {/* Form thêm mới */}
          {isAddingNew && (
            <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Thêm trường dữ liệu mới
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddingNew(false)}
                  className="h-6 w-6 p-0 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tiêu đề trường (Label) *</Label>
                  <Input
                    placeholder="VD: Sở thích cá nhân"
                    value={newFieldData.field_label}
                    onChange={(e) =>
                      setNewFieldData({ ...newFieldData, field_label: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Kiểu định dạng (Type) *</Label>
                  <Select
                    value={newFieldData.field_type}
                    onValueChange={(val: any) =>
                      setNewFieldData({ ...newFieldData, field_type: val })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Văn bản 1 dòng (text)</SelectItem>
                      <SelectItem value="textarea">Đoạn văn nhiều dòng (textarea)</SelectItem>
                      <SelectItem value="select">Danh sách chọn (select dropdown)</SelectItem>
                      <SelectItem value="number">Số nguyên / Số thực (number)</SelectItem>
                      <SelectItem value="date">Ngày tháng (date)</SelectItem>
                      <SelectItem value="switch">Bật / Tắt (switch boolean)</SelectItem>
                      <SelectItem value="email">Hộp thư điện tử (email)</SelectItem>
                      <SelectItem value="phone">Số điện thoại (phone)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newFieldData.field_type === "select" && (
                <div className="space-y-1">
                  <Label className="text-xs">Các lựa chọn (phân cách bằng dấu phẩy)</Label>
                  <Input
                    placeholder="VD: Hội viên chính thức, Hội viên liên kết, Hội viên danh dự"
                    value={optionsInput}
                    onChange={(e) => setOptionsInput(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Placeholder gợi ý</Label>
                  <Input
                    placeholder="VD: Nhập sở thích của học viên..."
                    value={newFieldData.placeholder}
                    onChange={(e) =>
                      setNewFieldData({ ...newFieldData, placeholder: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="new-req"
                      checked={newFieldData.is_required}
                      onCheckedChange={(checked) =>
                        setNewFieldData({ ...newFieldData, is_required: checked })
                      }
                    />
                    <Label htmlFor="new-req" className="text-xs">Bắt buộc nhập</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="new-en"
                      checked={newFieldData.is_enabled}
                      onCheckedChange={(checked) =>
                        setNewFieldData({ ...newFieldData, is_enabled: checked })
                      }
                    />
                    <Label htmlFor="new-en" className="text-xs">Bật hiển thị</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingNew(false)}
                  className="h-8 text-xs"
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleAddNew}
                  className="h-8 text-xs font-semibold"
                >
                  Lưu vào CSDL
                </Button>
              </div>
            </div>
          )}

          {/* Danh sách các trường hiện hữu */}
          <div className="divide-y divide-border/60 rounded-xl border border-border bg-card overflow-hidden">
            {fields.map((f) => {
              const isEditing = editingFieldId === f.id;

              if (isEditing) {
                return (
                  <div key={f.id} className="p-3.5 bg-muted/40 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tiêu đề trường (Label)</Label>
                        <Input
                          value={editFormData.field_label ?? ""}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, field_label: e.target.value })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Kiểu định dạng</Label>
                        <Select
                          value={editFormData.field_type}
                          onValueChange={(val: any) =>
                            setEditFormData({ ...editFormData, field_type: val })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Văn bản 1 dòng (text)</SelectItem>
                            <SelectItem value="textarea">Đoạn văn nhiều dòng (textarea)</SelectItem>
                            <SelectItem value="select">Danh sách chọn (select dropdown)</SelectItem>
                            <SelectItem value="number">Số (number)</SelectItem>
                            <SelectItem value="date">Ngày tháng (date)</SelectItem>
                            <SelectItem value="switch">Bật / Tắt (switch boolean)</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Số điện thoại</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {editFormData.field_type === "select" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Các lựa chọn (phân cách bằng dấu phẩy)</Label>
                        <Input
                          value={optionsInput}
                          onChange={(e) => setOptionsInput(e.target.value)}
                          placeholder="Tùy chọn 1, Tùy chọn 2, Tùy chọn 3"
                          className="h-8 text-xs"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Switch
                            id={`edit-req-${f.id}`}
                            checked={Boolean(editFormData.is_required)}
                            onCheckedChange={(checked) =>
                              setEditFormData({ ...editFormData, is_required: checked })
                            }
                          />
                          <Label htmlFor={`edit-req-${f.id}`} className="text-xs">Bắt buộc</Label>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                          className="h-7 text-xs"
                        >
                          Hủy
                        </Button>
                        <Button
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => saveEdit(f.id)}
                          className="h-7 gap-1 text-xs font-semibold"
                        >
                          <Check className="h-3.5 w-3.5" /> Lưu
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 transition hover:bg-muted/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Switch
                      checked={f.is_enabled}
                      onCheckedChange={() => toggleFieldEnabled(f)}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${f.is_enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
                          {f.field_label}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground uppercase">
                          {f.field_type}
                        </span>
                        {f.is_required && (
                          <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.2 rounded">
                            Bắt buộc
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Key: <span className="font-mono">{f.field_name}</span>
                        {f.placeholder ? ` · Gợi ý: "${f.placeholder}"` : ""}
                        {f.field_type === "select" && f.options && f.options.length > 0
                          ? ` · ${f.options.length} tùy chọn`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(f)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteField(f.id, f.field_label)}
                      className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
