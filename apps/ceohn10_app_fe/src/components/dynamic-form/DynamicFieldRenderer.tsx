import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DynamicFieldDef {
  id: string;
  field_name: string;
  field_label: string;
  field_type: "text" | "textarea" | "select" | "number" | "date" | "switch" | "email" | "phone";
  options?: (string | { label: string; value: string })[];
  placeholder?: string;
  default_value?: any;
  is_required: boolean;
  is_enabled: boolean;
  order_index?: number;
}

interface Props {
  field: DynamicFieldDef;
  value: any;
  onChange: (val: any) => void;
  error?: string;
  disabled?: boolean;
}

export function DynamicFieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: Props) {
  if (!field.is_enabled) return null;

  const fieldId = `dyn-${field.field_name}`;
  const labelWithReq = (
    <Label htmlFor={fieldId} className="text-xs font-semibold text-foreground flex items-center gap-1">
      <span>{field.field_label}</span>
      {field.is_required && <span className="text-destructive">*</span>}
    </Label>
  );

  switch (field.field_type) {
    case "textarea":
      return (
        <div className="space-y-1.5">
          {labelWithReq}
          <Textarea
            id={fieldId}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || `Nhập ${field.field_label.toLowerCase()}...`}
            disabled={disabled}
            rows={3}
            className="text-xs"
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      );

    case "select": {
      const opts = (field.options || []).map((o) =>
        typeof o === "string" ? { label: o, value: o } : o
      );
      return (
        <div className="space-y-1.5">
          {labelWithReq}
          <Select
            value={value ? String(value) : ""}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger id={fieldId} className="text-xs h-9">
              <SelectValue placeholder={field.placeholder || `-- Chọn ${field.field_label.toLowerCase()} --`} />
            </SelectTrigger>
            <SelectContent>
              {opts.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      );
    }

    case "switch":
      return (
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/20">
          <div className="space-y-0.5">
            {labelWithReq}
            {field.placeholder && (
              <p className="text-[11px] text-muted-foreground">{field.placeholder}</p>
            )}
          </div>
          <Switch
            id={fieldId}
            checked={Boolean(value)}
            onCheckedChange={onChange}
            disabled={disabled}
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-1.5">
          {labelWithReq}
          <Input
            id={fieldId}
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={field.placeholder || "0"}
            disabled={disabled}
            className="text-xs h-9"
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      );

    case "date":
      return (
        <div className="space-y-1.5">
          {labelWithReq}
          <Input
            id={fieldId}
            type="date"
            value={value ? String(value).split("T")[0] : ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="text-xs h-9"
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      );

    case "email":
      return (
        <div className="space-y-1.5">
          {labelWithReq}
          <Input
            id={fieldId}
            type="email"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "email@example.com"}
            disabled={disabled}
            className="text-xs h-9"
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      );

    case "phone":
      return (
        <div className="space-y-1.5">
          {labelWithReq}
          <Input
            id={fieldId}
            type="tel"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "0912345678"}
            disabled={disabled}
            className="text-xs h-9"
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      );

    case "text":
    default:
      return (
        <div className="space-y-1.5">
          {labelWithReq}
          <Input
            id={fieldId}
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || `Nhập ${field.field_label.toLowerCase()}...`}
            disabled={disabled}
            className="text-xs h-9"
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      );
  }
}
