import * as XLSX from "xlsx";
import type { EventItem } from "@/lib/events.functions";

export interface ParsedEventData {
  name?: string;
  tagline?: string;
  date?: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  location?: string;
  speaker?: string;
  capacity?: string;
  description?: string;
  type?: EventItem["type"];
  extractedFields: string[];
}

/**
 * Trích xuất text từ XML docx
 */
function extractTextFromDocxXml(rawStr: string): string {
  const matches = rawStr.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  if (matches && matches.length > 0) {
    return matches
      .map((m) => m.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, ""))
      .join(" ");
  }
  return rawStr.replace(/<[^>]+>/g, " ");
}

/**
 * Trích xuất các trường thông tin sự kiện từ text thuần
 */
export function extractFieldsFromText(fullText: string): ParsedEventData {
  const lines = fullText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let name = "";
  let date = "";
  let startTime = "";
  let endTime = "";
  let location = "";
  let speaker = "";
  let capacity = "";
  let description = "";
  let type: EventItem["type"] = "forum";
  const extractedFields: string[] = [];

  // 1. Tên sự kiện
  for (const line of lines) {
    const m = line.match(
      /(?:tên\s+sự\s+kiện|tiêu\s+đề|chủ\s+đề|chương\s+trình|sự\s+kiện|event\s+name|tên\s+chương\s+trình)[\s:：]+(.+)/i
    );
    if (m && m[1].trim()) {
      name = m[1].trim().replace(/^["']|["']$/g, "");
      break;
    }
  }
  if (!name && lines.length > 0) {
    const candidate = lines.find(
      (l) =>
        l.length >= 10 &&
        l.length <= 150 &&
        !l.includes(":") &&
        !l.includes("Trang ") &&
        !l.includes("CỘNG HÒA")
    );
    if (candidate) name = candidate.replace(/^["']|["']$/g, "");
  }
  if (name) extractedFields.push("Tên sự kiện");

  // 2. Ngày diễn ra
  for (const line of lines) {
    const mDate =
      line.match(
        /(?:ngày|diễn\s+ra|lịch\s+trình|thời\s+gian|date)[\s:：]+.*?(?:ngày\s+)?(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/i
      ) || line.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    if (mDate) {
      const day = mDate[1].padStart(2, "0");
      const month = mDate[2].padStart(2, "0");
      const year = mDate[3];
      date = `${year}-${month}-${day}`;
      break;
    }
    const mDateText = line.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);
    if (mDateText) {
      const day = mDateText[1].padStart(2, "0");
      const month = mDateText[2].padStart(2, "0");
      const year = mDateText[3];
      date = `${year}-${month}-${day}`;
      break;
    }
  }
  if (date) extractedFields.push("Ngày diễn ra");

  // 3. Thời gian bắt đầu / kết thúc
  for (const line of lines) {
    const mRange = line.match(
      /(\d{1,2})[h:](\d{2})\s*(?:-|–|đến|to)\s*(\d{1,2})[h:](\d{2})/i
    );
    if (mRange) {
      startTime = `${mRange[1].padStart(2, "0")}:${mRange[2]}`;
      endTime = `${mRange[3].padStart(2, "0")}:${mRange[4]}`;
      break;
    }
    const mSingle = line.match(/(\d{1,2})[h:](\d{2})/i);
    if (mSingle && !startTime) {
      startTime = `${mSingle[1].padStart(2, "0")}:${mSingle[2]}`;
    }
  }
  if (startTime) extractedFields.push("Thời gian");

  // 4. Địa điểm
  for (const line of lines) {
    const m = line.match(
      /(?:địa\s+điểm|địa\s+chỉ|tại|tổ\s+chức\s+tại|location|venue)[\s:：]+(.+)/i
    );
    if (m && m[1].trim()) {
      location = m[1].trim();
      break;
    }
  }
  if (location) extractedFields.push("Địa điểm");

  // 5. Diễn giả (Speaker) / Khách mời
  for (const line of lines) {
    const m = line.match(
      /(?:diễn\s+giả|speaker|chuyên\s+gia|báo\s+cáo\s+viên|khách\s+mời|chủ\s+trì|speaker\s+name)[\s:：]+(.+)/i
    );
    if (m && m[1].trim()) {
      speaker = m[1].trim();
      break;
    }
  }
  if (speaker) extractedFields.push("Diễn giả");

  // 6. Sức chứa / Quy mô
  for (const line of lines) {
    const m =
      line.match(/(?:quy\s+mô|sức\s+chứa|số\s+lượng|số\s+chỗ|đại\s+biểu)[\s:：]+(\d+)/i) ||
      line.match(/(\d+)\s*(?:người|khách|đại biểu|chỗ|hội viên)/i);
    if (m && m[1]) {
      capacity = m[1];
      break;
    }
  }
  if (capacity) extractedFields.push("Sức chứa / Quy mô");

  // 7. Loại sự kiện
  const lower = fullText.toLowerCase();
  if (lower.includes("thiện nguyện") || lower.includes("từ thiện") || lower.includes("csr")) {
    type = "charity";
  } else if (lower.includes("đào tạo") || lower.includes("tập huấn") || lower.includes("khóa học")) {
    type = "training";
  } else if (lower.includes("workshop") || lower.includes("tọa đàm") || lower.includes("hội thảo")) {
    type = "workshop";
  } else if (lower.includes("giao thương") || lower.includes("b2b") || lower.includes("kết nối")) {
    type = "networking";
  }

  // 8. Mô tả sự kiện
  const descCandidates = lines.filter(
    (l) =>
      !l.toLowerCase().includes("cộng hòa xã hội") &&
      !l.toLowerCase().includes("độc lập - tự do") &&
      !l.toLowerCase().startsWith("tên sự kiện") &&
      !l.toLowerCase().startsWith("địa điểm") &&
      !l.toLowerCase().startsWith("thời gian") &&
      l.length > 15
  );

  const mainDesc = descCandidates.slice(0, 6).join("\n\n");
  if (speaker) {
    description = `Diễn giả / Khách mời: ${speaker}\n\n${mainDesc}`.trim();
  } else {
    description = mainDesc;
  }
  if (description) extractedFields.push("Mô tả sự kiện");

  return {
    name,
    tagline: speaker ? `Diễn giả khách mời: ${speaker}` : undefined,
    date,
    startTime,
    endTime,
    location,
    speaker,
    capacity,
    description,
    type,
    extractedFields,
  };
}

/**
 * Đọc và trích xuất dữ liệu sự kiện từ file Excel, Word, PDF hoặc TXT
 */
export async function parseEventDocument(file: File): Promise<ParsedEventData> {
  const fileName = file.name.toLowerCase();

  // 1. FILE EXCEL (.xlsx, .xls, .csv)
  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    let combinedText = "";

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      for (const row of rows) {
        if (Array.isArray(row) && row.length > 0) {
          const rowText = row
            .map((c) => String(c).trim())
            .filter(Boolean)
            .join(" : ");
          if (rowText) combinedText += rowText + "\n";
        }
      }
    }
    return extractFieldsFromText(combinedText);
  }

  // 2. FILE WORD (.docx)
  if (fileName.endsWith(".docx")) {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true });
    const raw = decoder.decode(new Uint8Array(buffer));
    const extracted = extractTextFromDocxXml(raw);
    return extractFieldsFromText(extracted);
  }

  // 3. FILE PDF (.pdf) HOẶC TXT / KHÁC
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true });
  const rawText = decoder.decode(new Uint8Array(buffer));
  return extractFieldsFromText(rawText);
}
