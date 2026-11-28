import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

export interface ReportColumn {
  header: string;
  key: string;
}

export interface EmailReportAttachment {
  filename: string;
  contentBase64: string;
  contentType: string;
}

function toAsciiSafe(text: string): string {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Tạo đồng thời cả 3 định dạng tệp đính kèm (.xlsx, .csv, .pdf) để gửi báo cáo qua Email
 */
export function buildThreeFormatAttachments(opts: {
  title: string;
  subtitle?: string;
  filePrefix: string;
  columns: ReportColumn[];
  rows: Array<Record<string, any>>;
}): EmailReportAttachment[] {
  const { title, subtitle, filePrefix, columns, rows } = opts;
  const safePrefix = filePrefix.replace(/[^a-zA-Z0-9_-]/g, "_");

  // 1. Excel (.xlsx)
  const aoa: any[][] = [
    [title],
    ...(subtitle ? [[subtitle]] : []),
    [`Ngay xuat: ${new Date().toLocaleString("vi-VN")}`],
    [],
    ["STT", ...columns.map((c) => c.header)],
    ...rows.map((r, idx) => [idx + 1, ...columns.map((c) => r[c.key] ?? "")]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao");
  const xlsxBase64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

  // 2. CSV (.csv UTF-8 BOM)
  const csvEscape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csvLines = [
    ["STT", ...columns.map((c) => c.header)].map(csvEscape).join(","),
    ...rows.map((r, idx) =>
      [idx + 1, ...columns.map((c) => r[c.key] ?? "")].map(csvEscape).join(","),
    ),
  ];
  const csvBase64 = utf8ToBase64("\uFEFF" + csvLines.join("\n"));

  // 3. PDF (.pdf) via jsPDF
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(14);
  doc.text(toAsciiSafe(title), 14, 16);
  doc.setFontSize(9);
  if (subtitle) {
    doc.text(toAsciiSafe(subtitle), 14, 22);
  }
  doc.text(`Thoi gian xuat: ${toAsciiSafe(new Date().toLocaleString("vi-VN"))} | Tong ban ghi: ${rows.length}`, 14, 27);

  let y = 35;
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxCols = Math.min(columns.length, 7);
  const colW = Math.floor(265 / (maxCols + 1));

  const drawHeader = () => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("STT", 14, y);
    for (let c = 0; c < maxCols; c++) {
      doc.text(toAsciiSafe(columns[c].header).slice(0, 24), 14 + (c + 1) * colW, y);
    }
    y += 5;
    doc.line(14, y - 3, 283, y - 3);
    doc.setFont("helvetica", "normal");
  };

  drawHeader();
  rows.forEach((r, idx) => {
    if (y > pageHeight - 14) {
      doc.addPage();
      y = 16;
      drawHeader();
    }
    doc.text(String(idx + 1), 14, y);
    for (let c = 0; c < maxCols; c++) {
      const val = toAsciiSafe(String(r[columns[c].key] ?? "")).slice(0, 26);
      doc.text(val, 14 + (c + 1) * colW, y);
    }
    y += 5.5;
  });

  const pdfDataUri = doc.output("datauristring");
  const pdfBase64 = pdfDataUri.split(",")[1] || "";

  return [
    {
      filename: `${safePrefix}.xlsx`,
      contentBase64: xlsxBase64,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    {
      filename: `${safePrefix}.csv`,
      contentBase64: csvBase64,
      contentType: "text/csv;charset=utf-8",
    },
    {
      filename: `${safePrefix}.pdf`,
      contentBase64: pdfBase64,
      contentType: "application/pdf",
    },
  ];
}
