import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  Save,
  RotateCcw,
  Download,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  Building2,
  PenTool,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  ReportTemplateConfig,
  ReportColumnConfig,
  getReportTemplates,
  saveReportTemplates,
  exportReportToPdf,
  DEFAULT_REPORT_TEMPLATES,
} from "@/lib/report-templates";
import { exportToExcel, exportToWord, formatExcelCurrency, numberToVietnameseWords } from "@/lib/excel-export";

interface ReportTemplateEditorProps {
  type: "excel" | "word" | "pdf";
}

export function ReportTemplateEditor({ type }: ReportTemplateEditorProps) {
  const [templates, setTemplates] = useState<ReportTemplateConfig[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [currentTemplate, setCurrentTemplate] = useState<ReportTemplateConfig | null>(null);
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    const list = getReportTemplates().filter((t) => t.type === type);
    setTemplates(list);
    if (list.length > 0) {
      setSelectedTemplateId(list[0].id);
      setCurrentTemplate({ ...list[0] });
    }
  }, [type]);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = templates.find((t) => t.id === id);
    if (found) {
      setCurrentTemplate({ ...found });
    }
  };

  const handleUpdateField = <K extends keyof ReportTemplateConfig>(field: K, val: ReportTemplateConfig[K]) => {
    if (!currentTemplate) return;
    setCurrentTemplate({ ...currentTemplate, [field]: val });
  };

  const handleToggleColumn = (colId: string) => {
    if (!currentTemplate) return;
    const nextCols = currentTemplate.columns.map((c) =>
      c.id === colId ? { ...c, enabled: !c.enabled } : c
    );
    setCurrentTemplate({ ...currentTemplate, columns: nextCols });
  };

  const handleUpdateColumnHeader = (colId: string, header: string) => {
    if (!currentTemplate) return;
    const nextCols = currentTemplate.columns.map((c) =>
      c.id === colId ? { ...c, header } : c
    );
    setCurrentTemplate({ ...currentTemplate, columns: nextCols });
  };

  const handleSave = () => {
    if (!currentTemplate) return;
    const all = getReportTemplates();
    const updated = all.map((t) => (t.id === currentTemplate.id ? { ...currentTemplate, updatedAt: new Date().toISOString() } : t));
    saveReportTemplates(updated);
    toast.success(`Đã lưu cấu hình biểu mẫu "${currentTemplate.name}" thành công! Khi xuất báo cáo tài chính sẽ tự động áp dụng format này.`);
  };

  const handleReset = () => {
    const defaultOne = DEFAULT_REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (defaultOne) {
      setCurrentTemplate({ ...defaultOne });
      toast.info("Đã khôi phục cài đặt mặc định cho biểu mẫu này.");
    }
  };

  // Xuất file demo theo cấu hình đã set up
  const handleExportSample = () => {
    if (!currentTemplate) return;

    const sampleData = [
      {
        id: "CT-2026-001",
        date: "2026-03-10",
        type: "income",
        category: currentTemplate.categoryLabel || "Hội phí",
        description: "Thu niên liễm hội viên chính thức năm 2026",
        amount: 25000000,
        method: "bank",
        recipient: "Công ty Cổ phần Công nghệ Alpha",
        status: "completed",
      },
      {
        id: "CT-2026-002",
        date: "2026-03-08",
        type: "expense",
        category: "Tổ chức",
        description: "Chi phí thuê phòng họp VIP & Teabreak sinh hoạt",
        amount: 8500000,
        method: "bank",
        recipient: "Trung tâm Hội nghị Quốc Gia",
        status: "completed",
      },
      {
        id: "CT-2026-003",
        date: "2026-03-05",
        type: "income",
        category: "Tài trợ",
        description: "Khoản tài trợ truyền thông sự kiện tháng 3",
        amount: 50000000,
        method: "bank",
        recipient: "Ngân hàng Techcombank",
        status: "completed",
      },
    ];

    const activeCols = currentTemplate.columns.filter((c) => c.enabled);
    const subIn = 75000000;
    const subOut = 8500000;
    const net = subIn - subOut;

    if (currentTemplate.type === "excel") {
      exportToExcel({
        title: currentTemplate.title,
        subtitle: currentTemplate.subtitle,
        organization: currentTemplate.organization,
        address: currentTemplate.address,
        circularCode: currentTemplate.circularCode,
        circularNote: currentTemplate.circularNote,
        currencyUnit: currentTemplate.currencyUnit,
        filename: `mau-xuat-thu-${currentTemplate.id}`,
        sheetName: "Bao_Cao_Mau",
        data: sampleData,
        columns: activeCols.map((c) => ({
          header: c.header,
          key: c.key,
          width: c.width || 18,
          value: (row: any, idx: number) => {
            if (c.key === "_index") return idx + 1;
            if (c.key === "amount") return formatExcelCurrency(row.amount);
            if (c.key === "type") return row.type === "income" ? "Khoản Thu" : "Khoản Chi";
            return row[c.key] ?? "";
          },
        })),
        summaryRows: [
          ["TỔNG NGUỒN THU:", "", "", "", "", "", "", formatExcelCurrency(subIn) + " đ", "", ""],
          ["TỔNG KHOẢN CHI:", "", "", "", "", "", "", formatExcelCurrency(subOut) + " đ", "", ""],
          ["TỒN QUỸ RÒNG:", "", "", "", "", "", "", formatExcelCurrency(net) + " đ", "", ""],
        ],
        amountInWords: numberToVietnameseWords(net),
        signerTitles: currentTemplate.signerTitles,
      });
      toast.success("Đã tải xuống file Excel mẫu theo đúng cấu hình vừa thiết lập!");
    } else if (currentTemplate.type === "word") {
      exportToWord({
        title: currentTemplate.title,
        subtitle: currentTemplate.subtitle,
        organization: currentTemplate.organization,
        address: currentTemplate.address,
        categoryName: currentTemplate.categoryLabel,
        circularCode: currentTemplate.circularCode,
        circularNote: currentTemplate.circularNote,
        currencyUnit: currentTemplate.currencyUnit,
        filename: `mau-xuat-thu-${currentTemplate.id}`,
        columns: activeCols.map((c) => ({
          header: c.header,
          key: c.key,
          value: (row: any, idx: number) => {
            if (c.key === "_index") return idx + 1;
            if (c.key === "amount") return formatExcelCurrency(row.amount);
            if (c.key === "type") return row.type === "income" ? "Khoản Thu" : "Khoản Chi";
            return row[c.key] ?? "";
          },
        })),
        data: sampleData,
        summaryRows: [
          ["TỔNG THU:", formatExcelCurrency(subIn) + " đ"],
          ["TỔNG CHI:", formatExcelCurrency(subOut) + " đ"],
          ["TỒN QUỸ RÒNG:", formatExcelCurrency(net) + " đ"],
        ],
        amountInWords: numberToVietnameseWords(net),
        signerTitles: currentTemplate.signerTitles,
      });
      toast.success("Đã tải xuống file Word mẫu theo đúng cấu hình vừa thiết lập!");
    } else {
      exportReportToPdf({
        template: currentTemplate,
        data: sampleData,
        summaryRows: [
          ["TỔNG THU:", formatExcelCurrency(subIn) + " đ"],
          ["TỔNG CHI:", formatExcelCurrency(subOut) + " đ"],
          ["TỒN QUỸ RÒNG:", formatExcelCurrency(net) + " đ"],
        ],
        amountInWords: numberToVietnameseWords(net),
        filename: `mau-xuat-thu-${currentTemplate.id}.pdf`,
      });
      toast.success("Đã xuất file PDF mẫu theo đúng cấu hình vừa thiết lập!");
    }
  };

  if (!currentTemplate) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Chưa có cấu hình biểu mẫu nào cho định dạng {type.toUpperCase()}.
      </div>
    );
  }

  const typeLabel = type === "excel" ? "Excel (.xlsx)" : type === "word" ? "Word (.doc/.docx)" : "PDF (.pdf)";
  const typeIcon = type === "excel" ? FileSpreadsheet : type === "word" ? FileText : FileCode;
  const IconComp = typeIcon;

  return (
    <div className="space-y-6">
      {/* Header bar & Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 grid place-items-center">
            <IconComp className="size-6 text-[#003B95]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Cấu Hình Format Biểu Mẫu {typeLabel}
            </h2>
            <p className="text-xs text-muted-foreground">
              Tùy biến tiêu đề, danh mục, cột dữ liệu và khối chữ ký. Báo cáo tài chính sẽ xuất đúng format này thay vì hardcode.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Khôi phục mặc định</span>
          </button>
          <button
            type="button"
            onClick={handleExportSample}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-foreground flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="size-3.5 text-[#003B95]" />
            <span>Xuất thử file demo</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Save className="size-3.5" />
            <span>Lưu biểu mẫu format</span>
          </button>
        </div>
      </div>

      {/* Template Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelectTemplate(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border ${
              selectedTemplateId === t.id
                ? "bg-[#003B95] text-white border-[#003B95] shadow-xs"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <span>{t.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-medium">
              {t.categoryLabel}
            </span>
          </button>
        ))}
      </div>

      {/* Main Grid: Form Setting + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Cấu hình Header, Thông tư, Chữ ký */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Building2 className="size-4 text-[#003B95]" />
              <span>1. Thông tin Tổ chức & Tiêu đề Báo cáo</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Đơn vị phát hành / Tổ chức
                </label>
                <input
                  type="text"
                  value={currentTemplate.organization}
                  onChange={(e) => handleUpdateField("organization", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background focus:ring-1 focus:ring-[#003B95] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Địa điểm / Tỉnh thành
                </label>
                <input
                  type="text"
                  value={currentTemplate.address}
                  onChange={(e) => handleUpdateField("address", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background focus:ring-1 focus:ring-[#003B95] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Tiêu đề báo cáo (Title)
                </label>
                <input
                  type="text"
                  value={currentTemplate.title}
                  onChange={(e) => handleUpdateField("title", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background font-bold focus:ring-1 focus:ring-[#003B95] outline-none uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Phụ đề / Ghi chú kỳ kiểm toán (Subtitle)
                </label>
                <input
                  type="text"
                  value={currentTemplate.subtitle}
                  onChange={(e) => handleUpdateField("subtitle", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background focus:ring-1 focus:ring-[#003B95] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Mã số hiệu mẫu (Circular Code)
                </label>
                <input
                  type="text"
                  value={currentTemplate.circularCode}
                  onChange={(e) => handleUpdateField("circularCode", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background focus:ring-1 focus:ring-[#003B95] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Thông tư áp dụng / Ghi chú quy chế
                </label>
                <input
                  type="text"
                  value={currentTemplate.circularNote}
                  onChange={(e) => handleUpdateField("circularNote", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background focus:ring-1 focus:ring-[#003B95] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cấu hình các cột (Columns) */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sliders className="size-4 text-[#003B95]" />
                <span>2. Thiết lập Các Cột Dữ Liệu Báo Cáo</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                Đã bật {currentTemplate.columns.filter((c) => c.enabled).length}/{currentTemplate.columns.length} cột
              </span>
            </div>

            <div className="space-y-2">
              {currentTemplate.columns.map((col) => (
                <div
                  key={col.id}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition ${
                    col.enabled
                      ? "bg-background border-border"
                      : "bg-muted/30 border-dashed border-border/60 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`col_${col.id}`}
                      checked={col.enabled}
                      onChange={() => handleToggleColumn(col.id)}
                      className="size-4 rounded accent-[#003B95] cursor-pointer"
                    />
                    <label htmlFor={`col_${col.id}`} className="text-xs font-semibold text-foreground cursor-pointer">
                      {col.key}
                    </label>
                  </div>

                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <input
                      type="text"
                      value={col.header}
                      disabled={!col.enabled}
                      onChange={(e) => handleUpdateColumnHeader(col.id, e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background disabled:bg-muted/50 focus:ring-1 focus:ring-[#003B95] outline-none"
                      placeholder="Tên tiêu đề cột"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cấu hình Khối chữ ký */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <PenTool className="size-4 text-[#003B95]" />
              <span>3. Khối Chữ Ký & Người Phê Duyệt</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl border border-border bg-muted/10 space-y-2">
                <span className="text-xs font-bold text-[#003B95] block">Người ký 1 (Bên trái)</span>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Chức danh</label>
                  <input
                    type="text"
                    value={currentTemplate.signerTitles[0]}
                    onChange={(e) => {
                      const titles = [...currentTemplate.signerTitles] as [string, string, string];
                      titles[0] = e.target.value;
                      handleUpdateField("signerTitles", titles);
                    }}
                    className="w-full text-xs px-2 py-1 rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Họ tên</label>
                  <input
                    type="text"
                    value={currentTemplate.signerNames?.[0] || ""}
                    onChange={(e) => {
                      const names = [...(currentTemplate.signerNames || ["", "", ""])] as [string, string, string];
                      names[0] = e.target.value;
                      handleUpdateField("signerNames", names);
                    }}
                    className="w-full text-xs px-2 py-1 rounded border border-border bg-background"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border bg-muted/10 space-y-2">
                <span className="text-xs font-bold text-[#003B95] block">Người ký 2 (Ở giữa)</span>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Chức danh</label>
                  <input
                    type="text"
                    value={currentTemplate.signerTitles[1]}
                    onChange={(e) => {
                      const titles = [...currentTemplate.signerTitles] as [string, string, string];
                      titles[1] = e.target.value;
                      handleUpdateField("signerTitles", titles);
                    }}
                    className="w-full text-xs px-2 py-1 rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Họ tên</label>
                  <input
                    type="text"
                    value={currentTemplate.signerNames?.[1] || ""}
                    onChange={(e) => {
                      const names = [...(currentTemplate.signerNames || ["", "", ""])] as [string, string, string];
                      names[1] = e.target.value;
                      handleUpdateField("signerNames", names);
                    }}
                    className="w-full text-xs px-2 py-1 rounded border border-border bg-background"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border bg-muted/10 space-y-2">
                <span className="text-xs font-bold text-[#003B95] block">Người ký 3 (Bên phải)</span>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Chức danh</label>
                  <input
                    type="text"
                    value={currentTemplate.signerTitles[2]}
                    onChange={(e) => {
                      const titles = [...currentTemplate.signerTitles] as [string, string, string];
                      titles[2] = e.target.value;
                      handleUpdateField("signerTitles", titles);
                    }}
                    className="w-full text-xs px-2 py-1 rounded border border-border bg-background font-bold text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Họ tên</label>
                  <input
                    type="text"
                    value={currentTemplate.signerNames?.[2] || ""}
                    onChange={(e) => {
                      const names = [...(currentTemplate.signerNames || ["", "", ""])] as [string, string, string];
                      names[2] = e.target.value;
                      handleUpdateField("signerNames", names);
                    }}
                    className="w-full text-xs px-2 py-1 rounded border border-border bg-background"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview: Live Document Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Eye className="size-4 text-[#003B95]" />
                <span>Xem Trước Bố Cục Biểu Mẫu ({typeLabel})</span>
              </h3>
              <span className="text-[11px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                Chuẩn Định Dạng
              </span>
            </div>

            {/* Document sheet representation */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 font-serif text-[11px] space-y-4 leading-relaxed overflow-x-auto shadow-inner">
              <div className="flex justify-between items-start gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="text-left font-bold uppercase text-slate-800 dark:text-slate-200">
                  {currentTemplate.organization}
                  <div className="text-[9px] font-normal normal-case text-muted-foreground">
                    {currentTemplate.address}
                  </div>
                </div>
                <div className="text-right text-[9px] text-muted-foreground">
                  <div className="font-bold text-slate-800 dark:text-slate-200">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div>Độc lập - Tự do - Hạnh phúc</div>
                  <div className="italic mt-1">{currentTemplate.circularCode}</div>
                </div>
              </div>

              <div className="text-center space-y-1 py-1">
                <h4 className="text-xs font-black tracking-wide text-[#003B95] uppercase">
                  {currentTemplate.title}
                </h4>
                <p className="text-[10px] italic text-muted-foreground">
                  {currentTemplate.subtitle}
                </p>
                <p className="text-[9px] text-muted-foreground font-sans">
                  (Đơn vị tính: {currentTemplate.currencyUnit})
                </p>
              </div>

              {/* Sample Table */}
              <div className="border border-slate-300 dark:border-slate-700 rounded overflow-hidden">
                <table className="w-full text-[9px] text-left border-collapse">
                  <thead className="bg-slate-200 dark:bg-slate-800 font-bold">
                    <tr>
                      {currentTemplate.columns
                        .filter((c) => c.enabled)
                        .slice(0, 5)
                        .map((c) => (
                          <th key={c.id} className="p-1 border-r border-slate-300 dark:border-slate-700 last:border-r-0 text-center">
                            {c.header}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-300 dark:border-slate-700">
                      <td className="p-1 border-r border-slate-300 dark:border-slate-700 text-center">1</td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-700 text-center">CT-001</td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-700 text-center">10/03/2026</td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-700">Khoản Thu</td>
                      <td className="p-1">{currentTemplate.categoryLabel}</td>
                    </tr>
                    <tr className="border-t border-slate-300 dark:border-slate-700 font-bold bg-slate-100 dark:bg-slate-800/60">
                      <td colSpan={4} className="p-1 border-r border-slate-300 dark:border-slate-700 text-right">
                        TỔNG CỘNG:
                      </td>
                      <td className="p-1 text-right text-[#003B95]">75.000.000 đ</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2 text-[9px]">
                {currentTemplate.signerTitles.map((title, i) => (
                  <div key={i} className="space-y-6">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{title}</div>
                      <div className="text-[8px] text-muted-foreground italic">(Ký, ghi rõ họ tên)</div>
                    </div>
                    <div className="text-[9px] font-medium text-slate-700 dark:text-slate-300 pt-3">
                      {currentTemplate.signerNames?.[i] || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>
                Khi người dùng vào màn hình <strong>Báo cáo tài chính</strong> và bấm xuất file theo danh mục (Sự kiện, Lớp học, Phí tham gia, Tổng hợp), hệ thống sẽ đọc chính xác cấu hình này để tạo file Word, Excel, PDF.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
