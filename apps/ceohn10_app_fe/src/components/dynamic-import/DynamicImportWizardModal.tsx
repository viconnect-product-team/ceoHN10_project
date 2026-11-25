import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Trash2,
  Plus,
  Download,
  History,
  Bookmark,
  ShieldCheck,
  Eye,
  Sliders,
  ChevronRight,
  Database,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { exportToExcel } from "@/lib/excel-export";
import * as XLSX from "xlsx";

export type SupportedEntityType =
  | "member"
  | "event_registration"
  | "class"
  | "teacher"
  | "finance";

export type DynamicFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "datetime"
  | "switch"
  | "select"
  | "multi_select"
  | "email"
  | "phone"
  | "url";

export type DuplicatePolicy = "skip" | "update" | "create_new";

export interface FieldMappingConfig {
  sourceColumn: string;
  targetFieldKey: string;
  targetFieldLabel: string;
  targetFieldType: DynamicFieldType;
  isCustomField: boolean;
  isRequired?: boolean;
  isUnique?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  options?: string[];
  defaultValue?: any;
  confidence?: number;
  sampleValues?: any[];
}

export interface DynamicImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: SupportedEntityType;
  entityTitle?: string;
  eventId?: string; // khi entityType = 'event_registration'
  onSuccess?: (result?: { newFieldKeys: string[]; mappings: FieldMappingConfig[] }) => void;
}

const ENTITY_LABELS: Record<SupportedEntityType, string> = {
  member: "Học viên / Hội viên",
  event_registration: "Đăng ký sự kiện",
  class: "Quản lý lớp học / Chuyên đề",
  teacher: "Quản lý giảng viên",
  finance: "Báo cáo tài chính thu chi",
};

export function DynamicImportWizardModal({
  isOpen,
  onClose,
  entityType: defaultEntityType,
  entityTitle,
  eventId: defaultEventId,
  onSuccess,
}: DynamicImportWizardModalProps) {
  // Stepper state: 1 to 6
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [targetEntity, setTargetEntity] = useState<SupportedEntityType>(defaultEntityType);
  const [targetEventId, setTargetEventId] = useState<string>(defaultEventId || "");
  const [eventsList, setEventsList] = useState<any[]>([]);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  // Analysis Result State
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [mappings, setMappings] = useState<FieldMappingConfig[]>([]);

  // Validation State
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>("skip");
  const [onlyImportValid, setOnlyImportValid] = useState(true);

  // Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // History & Templates Drawer
  const [showHistory, setShowHistory] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // Load live events if event_registration
  useEffect(() => {
    if (targetEntity === "event_registration" && isOpen) {
      fetchNestApi<any[]>("/events")
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setEventsList(res);
            if (!targetEventId) setTargetEventId(String(res[0].id));
          }
        })
        .catch(() => {});
    }
  }, [targetEntity, isOpen, targetEventId]);

  // Load templates & history
  useEffect(() => {
    if (isOpen) {
      fetchNestApi<any[]>(`/dynamic-import/templates/${targetEntity}`)
        .then((res) => setTemplates(Array.isArray(res) ? res : []))
        .catch(() => setTemplates([]));
      fetchNestApi<any[]>(`/dynamic-import/history/${targetEntity}`)
        .then((res) => setImportHistory(Array.isArray(res) ? res : []))
        .catch(() => setImportHistory([]));
    }
  }, [isOpen, targetEntity]);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedFile(null);
      setParsedData(null);
      setValidationResult(null);
      setExecutionResult(null);
      setTargetEntity(defaultEntityType);
      setTargetEventId(defaultEventId || "");
    }
  }, [isOpen, defaultEntityType, defaultEventId]);

  // ── XỬ LÝ CHỌN & PHÂN TÍCH TỆP ──
  const handleFileSelected = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowed = ["xlsx", "xls", "csv", "docx", "doc", "pdf", "txt"];
    if (!allowed.includes(ext)) {
      toast.error(`Định dạng .${ext} không được hỗ trợ. Vui lòng chọn tệp Excel, CSV, Word hoặc PDF.`);
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);

    try {
      // Đọc file thành base64 để gửi sang backend
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Str = e.target?.result as string;
        try {
          const res = await fetchNestApi<any>("/dynamic-import/parse", {
            method: "POST",
            body: {
              fileName: file.name,
              fileType: ext.includes("xls") ? "excel" : ext === "csv" ? "csv" : ext.includes("doc") ? "word" : ext === "pdf" ? "pdf" : "text",
              fileBase64: base64Str,
              entityType: targetEntity,
            },
          });

          setParsedData(res);
          if (res.sheets && res.sheets.length > 0) {
            setSelectedSheet(res.selectedSheet || res.sheets[0]);
          }

          // Khởi tạo mappings từ proposals
          const initialMappings: FieldMappingConfig[] = (res.proposals || []).map((p: any) => ({
            sourceColumn: p.sourceColumn,
            targetFieldKey: p.targetFieldKey,
            targetFieldLabel: p.targetFieldLabel,
            targetFieldType: p.targetFieldType,
            isCustomField: Boolean(p.isCustomField),
            isRequired: false,
            isSearchable: true,
            isFilterable: true,
            options: p.options || [],
            confidence: p.confidence || 0.8,
            sampleValues: p.sampleValues || [],
          }));

          // Kiểm tra xem có template nào trùng signature không
          const matchedTmpl = templates.find((t) => t.file_signature === res.fileSignature);
          if (matchedTmpl && Array.isArray(matchedTmpl.field_mappings)) {
            toast.info(`Đã tự động nhận diện Mẫu Import phù hợp: "${matchedTmpl.template_name}"`);
            // Áp dụng mappings từ template
            setMappings(matchedTmpl.field_mappings);
          } else {
            setMappings(initialMappings);
          }

          setIsParsing(false);
          setCurrentStep(2); // Sang bước 2
        } catch (err: any) {
          toast.error(`Lỗi phân tích tệp: ${err?.message || "Không thể đọc dữ liệu"}`);
          setIsParsing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(`Không thể đọc file: ${err?.message}`);
      setIsParsing(false);
    }
  };

  // ── XỬ LÝ CHUYỂN SHEET ──
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (!parsedData || !parsedData.tables) return;
    const table = parsedData.tables.find((t: any) => t.sheetName === sheetName);
    if (!table) return;

    // Tái đề xuất mapping cho sheet mới
    const newMappings: FieldMappingConfig[] = (table.headers || []).map((col: string) => {
      const existing = mappings.find((m) => m.sourceColumn === col);
      if (existing) return existing;
      const cleanSlug = col.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30);
      return {
        sourceColumn: col,
        targetFieldKey: cleanSlug,
        targetFieldLabel: col,
        targetFieldType: "text",
        isCustomField: true,
        isRequired: false,
        isSearchable: true,
        isFilterable: true,
        sampleValues: (table.rows || []).slice(0, 3).map((r: any) => r[col]),
      };
    });
    setMappings(newMappings);
  };

  // ── XÁC THỰC DỮ LIỆU (BƯỚC 4 SANG BƯỚC 5) ──
  const runValidation = async () => {
    if (!parsedData) return;
    const currentTable = parsedData.tables.find((t: any) => t.sheetName === selectedSheet) || parsedData.tables[0];
    if (!currentTable || !currentTable.rows) {
      toast.error("Không tìm thấy dữ liệu dòng để xác thực.");
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetchNestApi<any>("/dynamic-import/validate", {
        method: "POST",
        body: {
          entityType: targetEntity,
          mappings,
          rows: currentTable.rows,
          duplicatePolicy,
          eventId: targetEntity === "event_registration" ? targetEventId : undefined,
        },
      });

      setValidationResult(res);
      setIsValidating(false);
      setCurrentStep(5); // Sang bước preview
    } catch (err: any) {
      toast.error(`Lỗi xác thực dữ liệu: ${err?.message || "Kiểm tra thất bại"}`);
      setIsValidating(false);
    }
  };

  // ── THỰC THI IMPORT (BƯỚC 5 SANG BƯỚC 6) ──
  const executeImport = async () => {
    if (!parsedData) return;
    const currentTable = parsedData.tables.find((t: any) => t.sheetName === selectedSheet) || parsedData.tables[0];
    if (!currentTable || !currentTable.rows) return;

    let rowsToImport = currentTable.rows;
    if (onlyImportValid && validationResult && Array.isArray(validationResult.rows)) {
      rowsToImport = validationResult.rows
        .filter((r: any) => r.status !== "invalid")
        .map((r: any) => r.data);
    }

    setIsExecuting(true);
    try {
      const res = await fetchNestApi<any>("/dynamic-import/execute", {
        method: "POST",
        body: {
          entityType: targetEntity,
          fileName: selectedFile?.name || "import_data.xlsx",
          fileType: parsedData.fileType,
          fileSize: selectedFile?.size || 0,
          mappings,
          rows: rowsToImport,
          duplicatePolicy,
          eventId: targetEntity === "event_registration" ? targetEventId : undefined,
          saveAsTemplate: saveTemplate,
          templateName: templateName.trim() || undefined,
          importedBy: "Quản trị viên CRM",
        },
      });

      setExecutionResult(res);
      setIsExecuting(false);
      setCurrentStep(6); // Sang bước kết quả
      toast.success(res.summary || "Import dữ liệu thành công!");
      if (onSuccess) {
        const newFieldKeys = mappings
          .filter((m) => m.isCustomField)
          .map((m) => m.targetFieldKey);
        onSuccess({ newFieldKeys, mappings });
      }
    } catch (err: any) {
      toast.error(`Import thất bại: ${err?.message || "Lỗi máy chủ"}`);
      setIsExecuting(false);
    }
  };

  // Xuất báo cáo lỗi
  const exportErrorReport = () => {
    if (!validationResult || !validationResult.rows) return;
    const errRows = validationResult.rows
      .filter((r: any) => r.status === "invalid" || r.status === "duplicate")
      .map((r: any) => ({
        "Dòng": r.rowNumber,
        "Trạng thái": r.status === "invalid" ? "Lỗi định dạng" : "Trùng lặp CSDL",
        "Chi tiết cảnh báo": r.issues.map((i: any) => i.message).join(" | "),
        ...r.data,
      }));

    if (errRows.length === 0) {
      toast.info("Không có dòng lỗi nào cần xuất.");
      return;
    }

    exportToExcel({
      title: `BÁO CÁO DÒNG LỖI VÀ CẢNH BÁO IMPORT - ${ENTITY_LABELS[targetEntity] || targetEntity}`,
      filename: `Bao_Cao_Loi_Import_${targetEntity}_${Date.now()}`,
      sheetName: "Danh_Sach_Loi",
      data: errRows,
      columns: Object.keys(errRows[0] || {}).map((k) => ({
        header: k,
        key: k,
        width: 25,
        value: (row: any) => row[k],
      })),
    });
    toast.success("Đã tải xuống bảng báo cáo lỗi.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background text-foreground shadow-2xl rounded-2xl border border-border">
        {/* HEADER */}
        <DialogHeader className="p-5 border-b border-border bg-card/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003B95]/10 text-[#003B95] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-[#003B95]" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Dynamic Import & Data Management</span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {ENTITY_LABELS[targetEntity] || entityTitle || "CRM"}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Nhập dữ liệu tự động từ Excel, CSV, Word, PDF & đồng bộ trường dữ liệu tức thì
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs h-8 gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>{showHistory ? "Đóng lịch sử" : "Lịch sử import"}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* STEPPER PROGRESS BAR */}
        {!showHistory && (
          <div className="px-6 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between text-xs font-semibold">
            {[
              { num: 1, label: "Tải tệp" },
              { num: 2, label: "Phân tích" },
              { num: 3, label: "Ánh xạ" },
              { num: 4, label: "Cấu hình" },
              { num: 5, label: "Xem trước" },
              { num: 6, label: "Kết quả" },
            ].map((step, idx) => {
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;
              return (
                <div key={step.num} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                      isActive
                        ? "bg-[#003B95] text-white shadow-xs"
                        : isPast
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {isPast ? <Check className="w-3 h-3" /> : step.num}
                  </div>
                  <span
                    className={`hidden sm:inline ${
                      isActive ? "text-[#003B95] font-bold" : isPast ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {idx < 5 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 hidden md:inline ml-1" />}
                </div>
              );
            })}
          </div>
        )}

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* LỊCH SỬ IMPORT VIEW */}
          {showHistory ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-[#003B95]" />
                  <span>Nhật ký các phiên Import gần nhất</span>
                </h3>
                <span className="text-xs text-muted-foreground">{importHistory.length} phiên ghi nhận</span>
              </div>

              {importHistory.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  Chưa có lịch sử import nào cho phân hệ này.
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-3">Thời gian</th>
                        <th className="p-3">Tên tệp</th>
                        <th className="p-3">Định dạng</th>
                        <th className="p-3 text-center">Tổng dòng</th>
                        <th className="p-3 text-center">Thành công</th>
                        <th className="p-3 text-center">Lỗi</th>
                        <th className="p-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {importHistory.map((job) => (
                        <tr key={job.id} className="hover:bg-muted/20">
                          <td className="p-3 text-muted-foreground">
                            {job.created_at ? new Date(job.created_at).toLocaleString("vi-VN") : "—"}
                          </td>
                          <td className="p-3 font-semibold text-foreground flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{job.original_filename}</span>
                          </td>
                          <td className="p-3 uppercase text-[11px] font-bold text-muted-foreground">
                            {job.file_type}
                          </td>
                          <td className="p-3 text-center font-bold">{job.total_rows}</td>
                          <td className="p-3 text-center font-bold text-emerald-600">
                            {job.successful_rows}
                          </td>
                          <td className="p-3 text-center font-bold text-destructive">
                            {job.failed_rows}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {job.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* BƯỚC 1: TẢI TỆP LÊN */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  {/* Entity Context Banner - Khóa cứng theo đúng chức năng đang mở */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/10">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Chức năng đang nhập dữ liệu:
                      </span>
                      <div className="inline-flex items-center gap-2 text-sm font-bold text-[#003B95]">
                        <Database className="w-4 h-4" />
                        <span>{entityTitle || ENTITY_LABELS[targetEntity]}</span>
                      </div>
                    </div>

                    {targetEntity === "event_registration" && (
                      <div className="space-y-1.5 min-w-[240px]">
                        <Label className="text-xs font-semibold">Chọn sự kiện nhận đại biểu:</Label>
                        <Select
                          value={targetEventId}
                          onValueChange={(val) => setTargetEventId(val)}
                        >
                          <SelectTrigger className="text-xs h-9">
                            <SelectValue placeholder="-- Chọn sự kiện --" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventsList.map((e) => (
                              <SelectItem key={e.id} value={String(e.id)}>
                                {e.name || e.title || `Sự kiện #${e.id}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Drag & Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileSelected(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                      isDragging
                        ? "border-[#003B95] bg-[#003B95]/5"
                        : "border-border hover:border-slate-400 bg-muted/20"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelected(e.target.files[0]);
                        }
                      }}
                    />

                    {isParsing ? (
                      <div className="py-6 flex flex-col items-center gap-2">
                        <RefreshCw className="w-8 h-8 text-[#003B95] animate-spin" />
                        <p className="text-xs font-semibold text-foreground">Đang phân tích cấu trúc dữ liệu...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-border flex items-center justify-center text-[#003B95]">
                          <Upload className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground">
                            Kéo thả tài liệu vào đây hoặc <span className="text-[#003B95] underline">chọn tệp từ máy tính</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Hỗ trợ đa định dạng: <strong>Excel (.xlsx, .xls)</strong>, <strong>CSV (UTF-8)</strong>, <strong>Word (.docx)</strong>, <strong>PDF</strong>
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FileSpreadsheet className="w-3 h-3" /> Excel & CSV
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            <FileText className="w-3 h-3" /> Word (Biểu mẫu & Bảng)
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                            <FileCode className="w-3 h-3" /> PDF (Văn bản & Bảng)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* BƯỚC 2: PHÂN TÍCH CẤU TRÚC TỆP */}
              {currentStep === 2 && parsedData && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-emerald-900">{parsedData.summary}</p>
                      <p className="text-emerald-700">
                        Chữ ký cấu trúc: <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">{parsedData.fileSignature}</code>
                      </p>
                    </div>
                  </div>

                  {/* Multi-sheet selector nếu có */}
                  {parsedData.sheets && parsedData.sheets.length > 1 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Tệp có nhiều Sheet, vui lòng chọn Sheet cần import:</Label>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.sheets.map((s: string) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleSheetChange(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              selectedSheet === s
                                ? "bg-[#003B95] text-white border-[#003B95]"
                                : "bg-card text-foreground border-border hover:bg-muted"
                            }`}
                          >
                            Sheet: {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Danh sách trường phát hiện được */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Các cột dữ liệu đã nhận diện ({mappings.length} cột):</Label>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-3 rounded-xl border border-border bg-muted/20">
                      {mappings.map((m) => (
                        <span
                          key={m.sourceColumn}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            m.isCustomField
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          <span className="font-semibold">{m.sourceColumn}</span>
                          <span className="text-[10px] opacity-75">
                            ({m.isCustomField ? "Trường mới" : "Trường chuẩn"})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* BƯỚC 3: NHẬN DIỆN & ÁNH XẠ TRƯỜNG */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Kiểm tra ánh xạ giữa cột trong tệp và các trường dữ liệu CRM:
                    </p>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {mappings.filter((m) => m.isCustomField).length} trường mới sẽ được tạo
                    </span>
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border sticky top-0 z-10 backdrop-blur-xs">
                        <tr>
                          <th className="p-3">Cột trong tệp</th>
                          <th className="p-3">Giá trị mẫu</th>
                          <th className="p-3">Trường CRM tương ứng</th>
                          <th className="p-3">Kiểu dữ liệu</th>
                          <th className="p-3 text-center">Phân loại</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {mappings.map((m, idx) => (
                          <tr key={m.sourceColumn} className="hover:bg-muted/20">
                            <td className="p-3 font-semibold text-foreground">{m.sourceColumn}</td>
                            <td className="p-3 text-muted-foreground max-w-[150px] truncate">
                              {(m.sampleValues || []).join(", ") || "—"}
                            </td>
                            <td className="p-3">
                              <Input
                                value={m.targetFieldLabel}
                                onChange={(e) => {
                                  const updated = [...mappings];
                                  updated[idx].targetFieldLabel = e.target.value;
                                  setMappings(updated);
                                }}
                                className="text-xs h-8"
                              />
                            </td>
                            <td className="p-3">
                              <Select
                                value={m.targetFieldType}
                                onValueChange={(val: any) => {
                                  const updated = [...mappings];
                                  updated[idx].targetFieldType = val;
                                  setMappings(updated);
                                }}
                              >
                                <SelectTrigger className="text-xs h-8 w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Văn bản (text)</SelectItem>
                                  <SelectItem value="textarea">Văn bản dài (textarea)</SelectItem>
                                  <SelectItem value="number">Số nguyên / thập phân</SelectItem>
                                  <SelectItem value="currency">Tiền tệ (VNĐ)</SelectItem>
                                  <SelectItem value="date">Ngày tháng (date)</SelectItem>
                                  <SelectItem value="switch">Có / Không (boolean)</SelectItem>
                                  <SelectItem value="select">Lựa chọn (select)</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="phone">Số điện thoại</SelectItem>
                                  <SelectItem value="url">Đường dẫn (URL)</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...mappings];
                                  updated[idx].isCustomField = !updated[idx].isCustomField;
                                  setMappings(updated);
                                }}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                                  m.isCustomField
                                    ? "bg-amber-50 text-amber-800 border-amber-300"
                                    : "bg-blue-50 text-blue-800 border-blue-300"
                                }`}
                              >
                                {m.isCustomField ? "★ Trường mới" : "✓ Trường chuẩn"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BƯỚC 4: CẤU HÌNH TRƯỜNG ĐỘNG */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 text-xs text-blue-900 flex items-start gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Thiết lập cấu hình trường động mới</p>
                      <p className="text-blue-700">
                        Các trường mới sẽ tự động lưu vào CSDL và xuất hiện trên toàn bộ form nhập tay, chi tiết, bộ lọc và xuất Excel.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {mappings.filter((m) => m.isCustomField).map((m, idx) => (
                      <div key={m.sourceColumn} className="p-4 rounded-xl border border-border bg-card space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-xs font-bold text-foreground">{m.targetFieldLabel}</span>
                            <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {m.targetFieldKey}
                            </code>
                          </div>
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase">{m.targetFieldType}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <label className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/10 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(m.isRequired)}
                              onChange={(e) => {
                                const updated = [...mappings];
                                const targetIdx = updated.findIndex((x) => x.sourceColumn === m.sourceColumn);
                                if (targetIdx !== -1) updated[targetIdx].isRequired = e.target.checked;
                                setMappings(updated);
                              }}
                              className="rounded border-border text-[#003B95] focus:ring-0"
                            />
                            <span>Bắt buộc nhập</span>
                          </label>

                          <label className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/10 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.isSearchable !== false}
                              onChange={(e) => {
                                const updated = [...mappings];
                                const targetIdx = updated.findIndex((x) => x.sourceColumn === m.sourceColumn);
                                if (targetIdx !== -1) updated[targetIdx].isSearchable = e.target.checked;
                                setMappings(updated);
                              }}
                              className="rounded border-border text-[#003B95] focus:ring-0"
                            />
                            <span>Cho phép tìm kiếm</span>
                          </label>

                          <label className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/10 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.isFilterable !== false}
                              onChange={(e) => {
                                const updated = [...mappings];
                                const targetIdx = updated.findIndex((x) => x.sourceColumn === m.sourceColumn);
                                if (targetIdx !== -1) updated[targetIdx].isFilterable = e.target.checked;
                                setMappings(updated);
                              }}
                              className="rounded border-border text-[#003B95] focus:ring-0"
                            />
                            <span>Cho phép lọc</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BƯỚC 5: XEM TRƯỚC & KIỂM TRA LỖI */}
              {currentStep === 5 && validationResult && (
                <div className="space-y-4">
                  {/* Summary badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                      <p className="text-lg font-bold text-emerald-700">{validationResult.validRows}</p>
                      <p className="text-[11px] font-semibold text-emerald-800">Dòng hợp lệ</p>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
                      <p className="text-lg font-bold text-amber-700">{validationResult.warningRows}</p>
                      <p className="text-[11px] font-semibold text-amber-800">Cảnh báo</p>
                    </div>
                    <div className="p-3 rounded-xl border border-blue-200 bg-blue-50">
                      <p className="text-lg font-bold text-blue-700">{validationResult.duplicateRows}</p>
                      <p className="text-[11px] font-semibold text-blue-800">Trùng lặp CSDL</p>
                    </div>
                    <div className="p-3 rounded-xl border border-rose-200 bg-rose-50">
                      <p className="text-lg font-bold text-rose-700">{validationResult.errorRows}</p>
                      <p className="text-[11px] font-semibold text-rose-800">Không hợp lệ</p>
                    </div>
                  </div>

                  {/* Duplicate Policy Selector */}
                  <div className="p-4 rounded-xl border border-border bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <Label className="font-bold text-foreground">Chính sách khi gặp dữ liệu trùng lặp:</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Hệ thống dựa trên Email, Số điện thoại hoặc Mã định danh để đối chiếu CSDL
                      </p>
                    </div>
                    <Select
                      value={duplicatePolicy}
                      onValueChange={(val: any) => setDuplicatePolicy(val)}
                    >
                      <SelectTrigger className="w-48 text-xs h-9 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Bỏ qua bản ghi trùng</SelectItem>
                        <SelectItem value="update">Cập nhật bản ghi hiện tại</SelectItem>
                        <SelectItem value="create_new">Cho phép tạo bản ghi mới</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-border rounded-xl overflow-hidden max-h-[35vh] overflow-y-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border sticky top-0 z-10">
                        <tr>
                          <th className="p-2.5 text-center w-12">#</th>
                          <th className="p-2.5">Trạng thái</th>
                          {mappings.slice(0, 4).map((m) => (
                            <th key={m.sourceColumn} className="p-2.5">{m.targetFieldLabel}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(validationResult.rows || []).slice(0, 50).map((r: any) => (
                          <tr key={r.rowNumber} className="hover:bg-muted/20">
                            <td className="p-2.5 text-center font-bold text-muted-foreground">{r.rowNumber}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.status === "valid"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : r.status === "duplicate"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : r.status === "warning"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {r.status === "valid" ? "Hợp lệ" : r.status === "duplicate" ? "Trùng lặp" : r.status === "warning" ? "Cảnh báo" : "Lỗi"}
                              </span>
                            </td>
                            {mappings.slice(0, 4).map((m) => (
                              <td key={m.sourceColumn} className="p-2.5 max-w-[120px] truncate">
                                {String(r.data[m.sourceColumn] ?? "—")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <Switch checked={onlyImportValid} onCheckedChange={setOnlyImportValid} />
                      <span>Chỉ import các dòng hợp lệ (loại trừ dòng lỗi)</span>
                    </label>

                    {validationResult.errorRows > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportErrorReport}
                        className="text-xs h-8 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải báo cáo {validationResult.errorRows} dòng lỗi</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* BƯỚC 6: XÁC NHẬN & KẾT QUẢ */}
              {currentStep === 6 && executionResult && (
                <div className="space-y-5 text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">Import Dữ Liệu Hoàn Tất!</h3>
                    <p className="text-xs text-muted-foreground">{executionResult.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto text-xs">
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <p className="text-base font-bold text-foreground">{executionResult.totalRows}</p>
                      <p className="text-[11px] text-muted-foreground">Tổng số dòng</p>
                    </div>
                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                      <p className="text-base font-bold text-emerald-700">{executionResult.successfulRows}</p>
                      <p className="text-[11px] text-emerald-800">Thành công</p>
                    </div>
                    <div className="p-3 rounded-xl border border-blue-200 bg-blue-50">
                      <p className="text-base font-bold text-blue-700">{executionResult.duplicateRows}</p>
                      <p className="text-[11px] text-blue-800">Dòng trùng</p>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
                      <p className="text-base font-bold text-amber-700">{executionResult.newFieldsCount}</p>
                      <p className="text-[11px] text-amber-800">Trường mới tạo</p>
                    </div>
                  </div>

                  {/* Save Template Option */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 text-left space-y-3 max-w-lg mx-auto">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-foreground">Lưu cấu hình thành Mẫu Import:</Label>
                        <p className="text-[11px] text-muted-foreground">
                          Lần sau tải file có cấu trúc tương tự, hệ thống sẽ tự động áp dụng mapping này
                        </p>
                      </div>
                      <Switch checked={saveTemplate} onCheckedChange={setSaveTemplate} />
                    </div>

                    {saveTemplate && (
                      <div className="space-y-1.5 pt-1">
                        <Input
                          placeholder="Nhập tên mẫu (VD: Mẫu danh sách học viên 2026)..."
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          className="text-xs h-9 bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        {!showHistory && (
          <div className="p-4 border-t border-border bg-card/60 flex items-center justify-between">
            <div>
              {currentStep > 1 && currentStep < 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  className="text-xs h-9 gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs h-9 border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                {currentStep === 6 ? "Đóng" : "Hủy bỏ"}
              </Button>

              {currentStep === 2 && (
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(3)}
                  className="text-xs h-9 gap-1.5 bg-[#003B95] hover:bg-[#002B70] text-white"
                >
                  <span>Tiếp tục ánh xạ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}

              {currentStep === 3 && (
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(4)}
                  className="text-xs h-9 gap-1.5 bg-[#003B95] hover:bg-[#002B70] text-white"
                >
                  <span>Cấu hình trường mới</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}

              {currentStep === 4 && (
                <Button
                  size="sm"
                  onClick={runValidation}
                  disabled={isValidating}
                  className="text-xs h-9 gap-1.5 bg-[#003B95] hover:bg-[#002B70] text-white"
                >
                  {isValidating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kiểm tra & Xem trước</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}

              {currentStep === 5 && (
                <Button
                  size="sm"
                  onClick={executeImport}
                  disabled={isExecuting}
                  className="text-xs h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isExecuting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác nhận Import vào CRM</span>
                  <Check className="w-3.5 h-3.5" />
                </Button>
              )}

              {currentStep === 6 && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    if (onSuccess) onSuccess();
                  }}
                  className="text-xs h-9 bg-[#003B95] hover:bg-[#002B70] text-white"
                >
                  Hoàn tất
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
