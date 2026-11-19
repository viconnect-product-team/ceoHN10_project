import * as XLSX from "xlsx";

export interface ParsedRecipientItem {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  amount?: number | string;
  notes?: string;
}

export interface ParsedTableData {
  sheetName?: string;
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export interface ParsedEventHint {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  attendees?: string[];
  description?: string;
}

export interface ParsedFileResult {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: "excel" | "word" | "pdf" | "csv" | "text" | "unknown";
  totalEmails: number;
  recipients: ParsedRecipientItem[];
  rawText?: string;
  summary: string;
  extractedSummary?: string;
  eventOrTopicHint?: string;
  eventDetails?: ParsedEventHint;
  tables?: ParsedTableData[];
  base64?: string;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const GLOBAL_EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:0|\+84)(?:3|5|7|8|9)[0-9]{8}/g;

/**
 * Xử lý đồng thời nhiều tệp tài liệu (Multi-file Drag & Drop Support)
 */
export async function parseMultipleFiles(files: FileList | File[]): Promise<ParsedFileResult[]> {
  const fileArray = Array.from(files);
  const results = await Promise.all(
    fileArray.map((file) => parseSingleDocument(file).catch((err) => ({
      id: `err_${Date.now()}_${Math.random()}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: "unknown" as const,
      totalEmails: 0,
      recipients: [],
      summary: `Lỗi xử lý tệp ${file.name}: ${err?.message || "Định dạng không hỗ trợ"}`,
    })))
  );
  return results;
}

/**
 * Trích xuất email, bảng biểu và thông tin sự kiện từ 1 tệp bất kỳ
 */
export async function parseSingleDocument(file: File): Promise<ParsedFileResult> {
  const fileName = file.name;
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (["xlsx", "xls", "csv"].includes(ext)) {
    return parseExcelFile(file, ext === "csv");
  } else if (["docx", "doc"].includes(ext)) {
    return parseWordFile(file);
  } else if (ext === "pdf") {
    return parsePdfFile(file);
  } else {
    return parseTextFile(file);
  }
}

/**
 * Tương thích ngược với hàm cũ parseExcelOrDocForEmails
 */
export async function parseExcelOrDocForEmails(file: File): Promise<ParsedFileResult> {
  return parseSingleDocument(file);
}

/**
 * Bóc tách tệp Excel (.xlsx, .xls, .csv)
 */
async function parseExcelFile(file: File, isCsv = false): Promise<ParsedFileResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const recipients: ParsedRecipientItem[] = [];
  const seenEmails = new Set<string>();
  const tables: ParsedTableData[] = [];
  let eventOrTopicHint = "";
  let fullRawText = "";

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Chuyển sheet sang mảng 2 chiều
    const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    if (!rawData || rawData.length === 0) continue;

    // Tìm dòng header
    let headerRowIndex = -1;
    let emailColIdx = -1;
    let nameColIdx = -1;
    let companyColIdx = -1;
    let phoneColIdx = -1;
    let amountColIdx = -1;

    for (let r = 0; r < Math.min(rawData.length, 10); r++) {
      const row = rawData[r] as any[];
      if (!Array.isArray(row)) continue;

      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || "").trim().toLowerCase();
        if (
          val.includes("email") ||
          val.includes("e-mail") ||
          val.includes("thư điện tử") ||
          val === "mail"
        ) {
          emailColIdx = c;
          headerRowIndex = r;
        } else if (
          val.includes("họ tên") ||
          val.includes("họ và tên") ||
          val.includes("người nhận") ||
          val.includes("đại biểu") ||
          val.includes("học viên") ||
          val.includes("họ_tên") ||
          val === "tên" ||
          val === "name"
        ) {
          nameColIdx = c;
        } else if (
          val.includes("công ty") ||
          val.includes("doanh nghiệp") ||
          val.includes("đơn vị") ||
          val.includes("company")
        ) {
          companyColIdx = c;
        } else if (
          val.includes("sđt") ||
          val.includes("điện thoại") ||
          val.includes("phone") ||
          val.includes("mobile")
        ) {
          phoneColIdx = c;
        } else if (
          val.includes("số tiền") ||
          val.includes("tiền") ||
          val.includes("phí") ||
          val.includes("amount") ||
          val.includes("hội phí")
        ) {
          amountColIdx = c;
        }

        if (
          val.includes("sự kiện") ||
          val.includes("khai giảng") ||
          val.includes("gala") ||
          val.includes("lớp học") ||
          val.includes("cuộc họp")
        ) {
          eventOrTopicHint = String(row[c] || "").trim();
        }
      }

      if (emailColIdx !== -1) break;
    }

    // Trích xuất cấu trúc bảng
    const headers: string[] = [];
    if (headerRowIndex !== -1 && Array.isArray(rawData[headerRowIndex])) {
      headers.push(
        ...rawData[headerRowIndex].map((h: any, idx: number) => String(h || `Cột_${idx + 1}`).trim())
      );
    } else if (rawData.length > 0 && Array.isArray(rawData[0])) {
      headers.push(...rawData[0].map((h: any, idx: number) => String(h || `Cột_${idx + 1}`).trim()));
      headerRowIndex = 0;
    }

    const tableRows: Record<string, any>[] = [];
    for (let r = headerRowIndex + 1; r < rawData.length; r++) {
      const row = rawData[r] as any[];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rowObj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = row[idx] !== undefined ? row[idx] : "";
      });
      tableRows.push(rowObj);

      // Bóc tách Email
      if (emailColIdx !== -1) {
        const rawEmail = String(row[emailColIdx] || "").trim();
        const match = rawEmail.match(EMAIL_REGEX);
        if (match) {
          const email = match[0].toLowerCase();
          if (!seenEmails.has(email)) {
            seenEmails.add(email);
            const name = nameColIdx !== -1 ? String(row[nameColIdx] || "").trim() : "";
            const company = companyColIdx !== -1 ? String(row[companyColIdx] || "").trim() : "";
            const phone = phoneColIdx !== -1 ? String(row[phoneColIdx] || "").trim() : "";
            const amount = amountColIdx !== -1 ? row[amountColIdx] : undefined;

            recipients.push({
              email,
              name: name || email.split("@")[0],
              company,
              phone,
              amount,
            });
          }
        }
      }
    }

    if (tableRows.length > 0) {
      tables.push({
        sheetName,
        headers,
        rows: tableRows.slice(0, 100), // Lưu tối đa 100 dòng đầu để hiển thị preview
        totalRows: tableRows.length,
      });
    }

    // Ghép text thô phục vụ phân tích ngữ cảnh
    fullRawText += rawData.map((row) => (Array.isArray(row) ? row.join(" | ") : "")).join("\n") + "\n";
  }

  // Nếu không thấy cột email trong header, quét tự do
  if (recipients.length === 0) {
    const rawMatches = fullRawText.match(GLOBAL_EMAIL_REGEX) || [];
    for (const em of rawMatches) {
      const email = em.toLowerCase();
      if (!seenEmails.has(email) && !email.endsWith(".png") && !email.endsWith(".jpg")) {
        seenEmails.add(email);
        recipients.push({ email, name: email.split("@")[0] });
      }
    }
  }

  const eventDetails = extractEventDetailsFromText(fullRawText, eventOrTopicHint);
  const summary = `Đã phân tích tệp ${isCsv ? "CSV" : "Excel"} [${file.name}]: Bóc tách ${recipients.length} email, ${tables.reduce((acc, t) => acc + t.totalRows, 0)} dòng dữ liệu trong ${workbook.SheetNames.length} sheet.`;

  return {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: isCsv ? "csv" : "excel",
    totalEmails: recipients.length,
    recipients,
    rawText: fullRawText.slice(0, 5000),
    summary,
    extractedSummary: summary,
    eventOrTopicHint,
    eventDetails,
    tables,
  };
}

/**
 * Bóc tách tệp Word (.docx, .doc)
 */
async function parseWordFile(file: File): Promise<ParsedFileResult> {
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let rawStr = decoder.decode(buffer);

  // Lọc lấy các đoạn text có nghĩa từ binary docx (loại bỏ các control characters không in được)
  const cleanLines = rawStr
    .replace(/<[^>]+>/g, " ") // Bỏ XML tags nếu có
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ")
    .split(/\s{2,}/)
    .filter((s) => s.trim().length > 2);

  const parsedText = cleanLines.join("\n");

  const seenEmails = new Set<string>();
  const recipients: ParsedRecipientItem[] = [];

  const matches = parsedText.match(GLOBAL_EMAIL_REGEX) || [];
  for (const m of matches) {
    const email = m.toLowerCase();
    if (!seenEmails.has(email) && !email.endsWith(".png") && !email.endsWith(".jpg")) {
      seenEmails.add(email);
      recipients.push({
        email,
        name: email.split("@")[0],
      });
    }
  }

  const eventDetails = extractEventDetailsFromText(parsedText);
  const summary = `Đã phân tích văn bản Word [${file.name}]: Trích xuất ${recipients.length} địa chỉ email, phát hiện ${eventDetails?.title ? `sự kiện "${eventDetails.title}"` : "nội dung công văn"}.`;

  return {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: "word",
    totalEmails: recipients.length,
    recipients,
    rawText: parsedText.slice(0, 5000),
    summary,
    extractedSummary: summary,
    eventDetails,
  };
}

/**
 * Bóc tách tệp PDF (.pdf)
 */
async function parsePdfFile(file: File): Promise<ParsedFileResult> {
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const rawStr = decoder.decode(buffer);

  // Trích xuất các luồng văn bản PDF nằm giữa các thẻ hoặc font streams
  const textChunks: string[] = [];
  
  // Trích xuất text trong các khối (Tj, TJ) của PDF
  const textPattern = /\(([^)]+)\)\s*Tj|\[([^\]]+)\]\s*TJ/g;
  let match;
  while ((match = textPattern.exec(rawStr)) !== null) {
    const chunk = match[1] || match[2] || "";
    // Làm sạch escape backslashes
    textChunks.push(chunk.replace(/\\([()\\])/g, "$1"));
  }

  // Nếu không thấy khối Tj chuẩn (ví dụ PDF mã hóa nhẹ), quét chuỗi văn bản UTF-8
  if (textChunks.length === 0) {
    const cleanLines = rawStr
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ")
      .split(/\s{2,}/)
      .filter((s) => s.trim().length > 3 && /[a-zA-ZÀ-ỹ0-9]/.test(s));
    textChunks.push(...cleanLines);
  }

  const combinedText = textChunks.join(" ");

  const seenEmails = new Set<string>();
  const recipients: ParsedRecipientItem[] = [];

  const emailMatches = rawStr.match(GLOBAL_EMAIL_REGEX) || combinedText.match(GLOBAL_EMAIL_REGEX) || [];
  for (const m of emailMatches) {
    const email = m.toLowerCase();
    if (!seenEmails.has(email) && !email.endsWith(".png") && !email.endsWith(".jpg")) {
      seenEmails.add(email);
      recipients.push({
        email,
        name: email.split("@")[0],
      });
    }
  }

  const eventDetails = extractEventDetailsFromText(combinedText);
  const summary = `Đã phân tích tệp PDF [${file.name}]: Trích xuất ${recipients.length} email, phân tích cấu trúc văn bản tài liệu.`;

  return {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: "pdf",
    totalEmails: recipients.length,
    recipients,
    rawText: combinedText.slice(0, 5000),
    summary,
    extractedSummary: summary,
    eventDetails,
  };
}

/**
 * Bóc tách tệp Văn bản thuần (.txt)
 */
async function parseTextFile(file: File): Promise<ParsedFileResult> {
  const text = await file.text();
  const seenEmails = new Set<string>();
  const recipients: ParsedRecipientItem[] = [];

  const matches = text.match(GLOBAL_EMAIL_REGEX) || [];
  for (const m of matches) {
    const email = m.toLowerCase();
    if (!seenEmails.has(email)) {
      seenEmails.add(email);
      recipients.push({
        email,
        name: email.split("@")[0],
      });
    }
  }

  const eventDetails = extractEventDetailsFromText(text);
  const summary = `Đã tìm thấy ${recipients.length} địa chỉ email trong tệp [${file.name}].`;

  return {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: "text",
    totalEmails: recipients.length,
    recipients,
    rawText: text.slice(0, 5000),
    summary,
    extractedSummary: summary,
    eventDetails,
  };
}

/**
 * Trích xuất thông minh chi tiết sự kiện / cuộc họp từ văn bản
 */
function extractEventDetailsFromText(text: string, titleHint = ""): ParsedEventHint | undefined {
  if (!text) return undefined;

  let title = titleHint;
  let date = "";
  let time = "";
  let location = "";
  const attendees: string[] = [];

  // 1. Nhận diện ngày tháng (vd: 25/11/2026, 25-11-2026, ngày 25 tháng 11)
  const dateMatch =
    text.match(/(?:ngày\s+)?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i) ||
    text.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm\s+(\d{4}))?/i);
  if (dateMatch) {
    date = dateMatch[1] || `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3] || "2026"}`;
  }

  // 2. Nhận diện giờ (vd: lúc 9h, 9h30, 09:00, 14h00)
  const timeMatch = text.match(/(?:lúc|vào lúc|thời gian[:\s]+)?(\d{1,2}(?:h|:| giờ)\d{0,2})/i);
  if (timeMatch) {
    time = timeMatch[1].trim();
  }

  // 3. Nhận diện địa điểm (vd: tại phòng họp tầng 3, tại khách sạn Meliá...)
  const locationMatch = text.match(
    /(?:tại|địa điểm[:\s]+)(phòng họp[^\,\.\n]+|khách sạn[^\,\.\n]+|trung tâm[^\,\.\n]+|tầng\s+\d+[^\,\.\n]*|[^\,\.\n]+)/i
  );
  if (locationMatch) {
    location = locationMatch[1].trim();
  }

  // 4. Nhận diện người tham gia (vd: Thành phần tham dự gồm Nguyễn Văn A, Trần Văn B...)
  const attendeesMatch = text.match(
    /(?:thành phần tham dự|thành phần|người tham gia|đại biểu)(?:[:\s]+)(?:gồm\s+)?([^\.\n]+)/i
  );
  if (attendeesMatch) {
    const rawNames = attendeesMatch[1].split(/,|\bvà\b|\b;\b/);
    for (const n of rawNames) {
      const clean = n.trim();
      if (clean && clean.length > 2 && !clean.includes("@")) {
        attendees.push(clean);
      }
    }
  }

  // 5. Tên sự kiện nếu chưa có hint
  if (!title) {
    const titleMatch = text.match(
      /(?:tổ chức|chương trình|sự kiện|cuộc họp|hội nghị|diễn đàn|gala)([:\s]+)([^\.\n,]+)/i
    );
    if (titleMatch) {
      title = `${titleMatch[0].trim()}`;
    }
  }

  if (title || date || time || location || attendees.length > 0) {
    return {
      title: title || "Cuộc họp / Sự kiện CEO HN10",
      date,
      time,
      location,
      attendees,
      description: text.slice(0, 300),
    };
  }

  return undefined;
}
