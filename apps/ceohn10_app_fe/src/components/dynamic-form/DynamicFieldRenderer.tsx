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
  field_type:
    | "text"
    | "textarea"
    | "select"
    | "multi_select"
    | "number"
    | "currency"
    | "date"
    | "datetime"
    | "switch"
    | "email"
    | "phone"
    | "url";
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

    case "currency":
      return (
        <div className="space-y-1.5">
          {labelWithReq}
          <div className="relative">
            <Input
              id={fieldId}
              type="text"
              value={
                value !== undefined && value !== null && value !== ""
                  ? Number(String(value).replace(/[^0-9]/g, "")).toLocaleString("vi-VN")
                  : ""
              }
              onChange={(e) => {
                const rawNum = e.target.value.replace(/[^0-9]/g, "");
                onChange(rawNum ? Number(rawNum) : "");
              }}
              placeholder={field.placeholder || "0 đ"}
              disabled={disabled}
              className="text-xs h-9 pr-8 text-right font-medium"
            />
            <span className="absolute right-2.5 top-2.5 text-[11px] font-semibold text-muted-foreground pointer-events-none">
              VNĐ
            </span>
          </div>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      );

    case "datetime":
      return (
        <div className="space-y-1.5">
          {labelWithReq}
          <Input
            id={fieldId}
            type="datetime-local"
            value={value ? String(value).slice(0, 16) : ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="text-xs h-9"
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      );

    case "url":
      return (
        <div className="space-y-1.5">
          {labelWithReq}
          <Input
            id={fieldId}
            type="url"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "https://example.com"}
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
