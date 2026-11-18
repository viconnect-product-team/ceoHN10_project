import * as XLSX from "xlsx";
import { exportToExcel, exportToWord, formatDisplayDate, formatExcelCurrency, numberToVietnameseWords } from "./excel-export";
import { jsPDF } from "jspdf";

export interface ReportColumnConfig {
  id: string;
  header: string;
  key: string;
  width: number;
  align: "left" | "center" | "right";
  enabled: boolean;
}

export interface ReportTemplateConfig {
  id: string;
  name: string;
  category: "all" | "events" | "classes" | "fees" | "csr" | "sponsors";
  categoryLabel: string;
  type: "excel" | "word" | "pdf";
  organization: string;
  address: string;
  title: string;
  subtitle: string;
  circularCode: string;
  circularNote: string;
  currencyUnit: string;
  columns: ReportColumnConfig[];
  signerTitles: [string, string, string];
  signerNames?: [string, string, string];
  footerNotes?: string;
  updatedAt: string;
}

export const REPORT_TEMPLATE_STORAGE_KEY = "ceohn10_report_template_config_v2";

export const DEFAULT_COLUMNS: ReportColumnConfig[] = [
  { id: "col_stt", header: "STT", key: "_index", width: 8, align: "center", enabled: true },
  { id: "col_id", header: "Mã chứng từ", key: "id", width: 16, align: "center", enabled: true },
  { id: "col_date", header: "Ngày ghi sổ", key: "date", width: 16, align: "center", enabled: true },
  { id: "col_type", header: "Loại giao dịch", key: "type", width: 16, align: "center", enabled: true },
  { id: "col_cat", header: "Danh mục", key: "category", width: 22, align: "left", enabled: true },
  { id: "col_desc", header: "Nội dung hạch toán", key: "description", width: 38, align: "left", enabled: true },
  { id: "col_method", header: "Hình thức", key: "method", width: 18, align: "center", enabled: true },
  { id: "col_amount", header: "Số tiền (VNĐ)", key: "amount", width: 22, align: "right", enabled: true },
  { id: "col_rec", header: "Đối tác / Người nộp - nhận", key: "recipient", width: 28, align: "left", enabled: true },
  { id: "col_status", header: "Trạng thái", key: "status", width: 16, align: "center", enabled: true },
];

export const DEFAULT_REPORT_TEMPLATES: ReportTemplateConfig[] = [
  {
    id: "tpl_excel_events",
    name: "Biểu mẫu Excel Báo cáo Sự kiện",
    category: "events",
    categoryLabel: "Sự kiện",
    type: "excel",
    organization: "CLB DOANH NHÂN CEO HN10 (HANOIBA)",
    address: "TP. Hà Nội",
    title: "BÁO CÁO THU CHI & QUYẾT TOÁN SỰ KIỆN",
    subtitle: "Kỳ kiểm toán sự kiện & Gala giao thương Hiệp Hội Doanh Nhân CEO HN10",
    circularCode: "Mẫu số S07-DN",
    circularNote: "(Theo Thông tư 200/2014/TT-BTC & Quy chế Tài chính CEO HN10)",
    currencyUnit: "VNĐ",
    columns: DEFAULT_COLUMNS,
    signerTitles: ["NGƯỜI LẬP BIỂU", "TRƯỞNG BAN TÀI CHÍNH", "LỚP TRƯỞNG CEO HN10"],
    signerNames: ["Văn phòng Ban Thư Ký", "Trưởng Ban Tài Chính", "Lớp Trưởng Lâm Thời"],
    footerNotes: "Chứng từ gốc được lưu trữ tập trung tại Văn phòng Hiệp Hội CEO HN10",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_excel_classes",
    name: "Biểu mẫu Excel Báo cáo Lớp học & Khóa đào tạo",
    category: "classes",
    categoryLabel: "Lớp học",
    type: "excel",
    organization: "CLB DOANH NHÂN CEO HN10 (HANOIBA)",
    address: "TP. Hà Nội",
    title: "BÁO CÁO KINH PHÍ ĐÀO TẠO & LỚP HỌC",
    subtitle: "Kỳ hạch toán lớp học thứ 7 và các chuyên đề quản trị CEO HN10",
    circularCode: "Mẫu số S07-DN",
    circularNote: "(Theo quy chế tài chính Ban Đào Tạo CLB CEO HN10)",
    currencyUnit: "VNĐ",
    columns: DEFAULT_COLUMNS,
    signerTitles: ["NGƯỜI LẬP BIỂU", "TRƯỞNG BAN ĐÀO TẠO", "LỚP TRƯỞNG CEO HN10"],
    signerNames: ["Thư ký Lớp", "Trưởng Ban Đào Tạo", "Lớp Trưởng Lâm Thời"],
    footerNotes: "Kinh phí phục vụ công tác đào tạo, hội thảo và tài liệu học viên",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_excel_fees",
    name: "Biểu mẫu Excel Báo cáo Phí tham gia / Hội phí",
    category: "fees",
    categoryLabel: "Phí tham gia",
    type: "excel",
    organization: "CLB DOANH NHÂN CEO HN10 (HANOIBA)",
    address: "TP. Hà Nội",
    title: "BÁO CÁO THU NIÊN LIỄM & PHÍ THAM GIA",
    subtitle: "Bảng theo dõi đối soát nộp hội phí thường niên Học viên CEO HN10",
    circularCode: "Mẫu số B01-DN",
    circularNote: "(Theo Điều lệ & Quy chế hội viên Hiệp Hội CEO HN10)",
    currencyUnit: "VNĐ",
    columns: DEFAULT_COLUMNS,
    signerTitles: ["NGƯỜI LẬP BIỂU", "THỦ QUỸ LỚP", "LỚP TRƯỞNG CEO HN10"],
    signerNames: ["Bộ phận Kế toán", "Thủ Quỹ Hiệp Hội", "Lớp Trưởng Lâm Thời"],
    footerNotes: "Toàn bộ hội phí được quản lý minh bạch qua tài khoản ngân hàng chính thức",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_word_standard",
    name: "Biểu mẫu Word Báo cáo Quyết toán Tổng hợp",
    category: "all",
    categoryLabel: "Tổng hợp",
    type: "word",
    organization: "CLB DOANH NHÂN CEO HN10 (HANOIBA)",
    address: "TP. Hà Nội",
    title: "BÁO CÁO THU CHI & QUYẾT TOÁN TÀI CHÍNH TỔNG HỢP",
    subtitle: "Hệ thống quản trị tài chính & kiểm soát nguồn quỹ CLB Doanh Nhân CEO HN10",
    circularCode: "Mẫu số B01-DN",
    circularNote: "(Ban hành theo quy chế quản trị tài chính CLB CEO HN10)",
    currencyUnit: "VNĐ",
    columns: DEFAULT_COLUMNS,
    signerTitles: ["NGƯỜI LẬP BIỂU", "TRƯỞNG BAN TÀI CHÍNH", "LỚP TRƯỞNG CEO HN10"],
    signerNames: ["Văn phòng Ban Thư Ký", "Trưởng Ban Tài Chính", "Lớp Trưởng Lâm Thời"],
    footerNotes: "Văn bản chính thức phục vụ báo cáo định kỳ Ban Điều Hành & Đại Hội Lớp",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_pdf_standard",
    name: "Biểu mẫu PDF Báo cáo Tài chính Điện tử",
    category: "all",
    categoryLabel: "Tổng hợp",
    type: "pdf",
    organization: "CLB DOANH NHÂN CEO HN10 (HANOIBA)",
    address: "TP. Hà Nội",
    title: "BẢNG KÊ QUYẾT TOÁN & BÁO CÁO TÀI CHÍNH",
    subtitle: "Văn bản số hóa lưu trữ và trình ký điện tử Hiệp Hội Doanh Nhân CEO HN10",
    circularCode: "Mẫu số S07-DN",
    circularNote: "(Theo Thông tư 200/2014/TT-BTC)",
    currencyUnit: "VNĐ",
    columns: DEFAULT_COLUMNS,
    signerTitles: ["NGƯỜI LẬP BÁO CÁO", "TRƯỞNG BAN TÀI CHÍNH", "LỚP TRƯỞNG CEO HN10"],
    signerNames: ["Văn phòng Ban Thư Ký", "Trưởng Ban Tài Chính", "Lớp Trưởng Lâm Thời"],
    footerNotes: "Báo cáo được sinh tự động và bảo đảm tính toàn vẹn từ hệ thống CRM CEO HN10",
    updatedAt: new Date().toISOString(),
  },
];

export function getReportTemplates(): ReportTemplateConfig[] {
  if (typeof window === "undefined") return DEFAULT_REPORT_TEMPLATES;
  try {
    const raw = localStorage.getItem(REPORT_TEMPLATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_REPORT_TEMPLATES;
}

export function saveReportTemplates(templates: ReportTemplateConfig[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REPORT_TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
    window.dispatchEvent(new CustomEvent("ceohn10_templates_updated", { detail: templates }));
  } catch {}
}

export function getTemplateForExport(
  type: "excel" | "word" | "pdf",
  category?: string
): ReportTemplateConfig {
  const all = getReportTemplates();
  const normCat = (category || "").toLowerCase();
  
  // 1. Tìm match chính xác cả type và category
  const exact = all.find((t) => {
    if (t.type !== type) return false;
    if (normCat.includes("sự kiện") || normCat === "events") return t.category === "events";
    if (normCat.includes("lớp học") || normCat.includes("khóa học") || normCat === "classes") return t.category === "classes";
    if (normCat.includes("phí") || normCat.includes("niên") || normCat === "fees") return t.category === "fees";
    if (normCat.includes("thiện nguyện") || normCat.includes("csr")) return t.category === "csr";
    if (normCat.includes("tài trợ") || normCat === "sponsors") return t.category === "sponsors";
    return t.category === "all";
  });
  if (exact) return exact;

  // 2. Tìm match theo type
  const typeMatch = all.find((t) => t.type === type);
  if (typeMatch) return typeMatch;

  // 3. Fallback mặc định
  return DEFAULT_REPORT_TEMPLATES[0];
}

/**
 * Xuất Báo Cáo PDF Dựa trên Cấu Hình Biểu Mẫu (Không hardcode format)
 */
export function exportReportToPdf<T extends Record<string, any>>(opts: {
  template: ReportTemplateConfig;
  data: T[];
  summaryRows?: Array<Array<string | number | null | undefined>>;
  amountInWords?: string;
  filename?: string;
}) {
  const { template, data, summaryRows, amountInWords, filename } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const activeColumns = template.columns.filter((c) => c.enabled);
  const now = new Date();
  const dateStr = `Hà Nội, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

  // Tiêu đề đầu trang
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(template.organization.toUpperCase(), 14, 15);
  doc.text(template.address, 14, 20);

  doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 196, 15, { align: "right" });
  doc.text("Độc lập - Tự do - Hạnh phúc", 196, 20, { align: "right" });
  doc.setFontSize(8);
  doc.text(template.circularCode, 196, 25, { align: "right" });

  // Tiêu đề chính
  doc.setFontSize(14);
  doc.setTextColor(0, 59, 149); // Màu thương hiệu CEO HN10 #003B95
  doc.text(template.title, 105, 36, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(template.subtitle, 105, 42, { align: "center" });
  doc.text(`Đơn vị tính: ${template.currencyUnit}`, 105, 47, { align: "center" });

  // Bảng dữ liệu tự vẽ
  let startY = 53;
  const colCount = activeColumns.length;
  const availableWidth = 182; // 196 - 14
  const colWidth = availableWidth / colCount;

  // Header bảng
  doc.setFillColor(240, 243, 246);
  doc.rect(14, startY, availableWidth, 7, "F");
  doc.rect(14, startY, availableWidth, 7, "S");
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);

  activeColumns.forEach((c, idx) => {
    const x = 14 + idx * colWidth + 2;
    doc.text(c.header, x, startY + 5);
  });

  startY += 7;

  // Render các hàng dữ liệu
  const maxRows = Math.min(data.length, 30);
  for (let r = 0; r < maxRows; r++) {
    const item = data[r];
    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }

    doc.rect(14, startY, availableWidth, 6, "S");
    activeColumns.forEach((c, idx) => {
      const x = 14 + idx * colWidth + 2;
      let val = item[c.key];
      if (c.key === "_index") val = r + 1;
      else if (c.key === "date") val = formatDisplayDate(val);
      else if (c.key === "amount") val = formatExcelCurrency(val);
      else if (c.key === "type") val = val === "income" ? "Khoản Thu" : "Khoản Chi";
      else if (c.key === "method") val = val === "cash" ? "Tiền mặt" : "Chuyển khoản";
      else if (c.key === "status") val = val === "completed" ? "Đã duyệt" : "Chờ duyệt";

      const strVal = String(val ?? "").slice(0, 25);
      doc.text(strVal, x, startY + 4.2);
    });
    startY += 6;
  }

  // Summary nếu có
  if (summaryRows && summaryRows.length > 0) {
    summaryRows.forEach((sr) => {
      if (startY > 260) {
        doc.addPage();
        startY = 20;
      }
      doc.setFillColor(248, 250, 252);
      doc.rect(14, startY, availableWidth, 6, "F");
      doc.rect(14, startY, availableWidth, 6, "S");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      const title = String(sr[0] ?? "");
      const amount = String(sr[sr.length - 1] ?? "");
      doc.text(title, 16, startY + 4.2);
      doc.text(amount, 194, startY + 4.2, { align: "right" });
      startY += 6;
    });
  }

  if (amountInWords) {
    startY += 5;
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`Số tiền viết bằng chữ: ${amountInWords}`, 14, startY);
    startY += 6;
  }

  // Khối chữ ký cuối trang
  startY = Math.max(startY + 8, 240);
  if (startY > 265) {
    doc.addPage();
    startY = 30;
  }

  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(dateStr, 196, startY - 4, { align: "right" });

  const signColWidth = availableWidth / 3;
  template.signerTitles.forEach((title, idx) => {
    const x = 14 + idx * signColWidth + signColWidth / 2;
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 20);
    doc.text(title, x, startY + 2, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("(Ký, ghi rõ họ tên)", x, startY + 6, { align: "center" });

    const name = template.signerNames?.[idx];
    if (name) {
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);
      doc.text(name, x, startY + 22, { align: "center" });
    }
  });

  const outName = filename ? (filename.endsWith(".pdf") ? filename : `${filename}.pdf`) : `${template.id}-${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(outName);
}
