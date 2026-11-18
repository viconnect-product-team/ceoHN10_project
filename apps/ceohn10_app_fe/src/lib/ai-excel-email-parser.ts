import * as XLSX from "xlsx";

export interface ParsedRecipientItem {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  amount?: number | string;
  notes?: string;
}

export interface ParsedFileResult {
  fileName: string;
  fileSize: number;
  fileType: "excel" | "word" | "pdf" | "text" | "unknown";
  totalEmails: number;
  recipients: ParsedRecipientItem[];
  summary: string;
  eventOrTopicHint?: string;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/**
 * Trích xuất email và thông tin học viên/người nhận từ tệp Excel, Word, CSV hoặc Text
 */
export async function parseExcelOrDocForEmails(file: File): Promise<ParsedFileResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (["xlsx", "xls", "csv"].includes(ext)) {
    return parseExcelFile(file);
  } else if (["docx", "doc"].includes(ext)) {
    return parseWordFile(file);
  } else {
    return parseTextFile(file);
  }
}

/**
 * Bóc tách tệp Excel (.xlsx, .xls, .csv)
 */
async function parseExcelFile(file: File): Promise<ParsedFileResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const recipients: ParsedRecipientItem[] = [];
  const seenEmails = new Set<string>();
  let eventOrTopicHint = "";

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

        // Tìm gợi ý chủ đề sự kiện nếu có
        if (val.includes("sự kiện") || val.includes("khai giảng") || val.includes("gala") || val.includes("lớp học")) {
          eventOrTopicHint = String(row[c] || "").trim();
        }
      }

      if (emailColIdx !== -1) break;
    }

    // Nếu tìm thấy cột email từ header
    if (emailColIdx !== -1) {
      for (let r = headerRowIndex + 1; r < rawData.length; r++) {
        const row = rawData[r] as any[];
        if (!Array.isArray(row) || row.length === 0) continue;

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
    } else {
      // Quét tự do mọi ô trong bảng để tìm địa chỉ email
      for (let r = 0; r < rawData.length; r++) {
        const row = rawData[r] as any[];
        if (!Array.isArray(row)) continue;

        for (let c = 0; c < row.length; c++) {
          const cellStr = String(row[c] || "").trim();
          const match = cellStr.match(EMAIL_REGEX);
          if (match) {
            const email = match[0].toLowerCase();
            if (!seenEmails.has(email)) {
              seenEmails.add(email);
              // Thử đoán tên từ các ô bên cạnh
              const nameCandidate = c > 0 ? String(row[c - 1] || "").trim() : "";
              recipients.push({
                email,
                name: nameCandidate && !nameCandidate.includes("@") ? nameCandidate : email.split("@")[0],
              });
            }
          }
        }
      }
    }
  }

  const summary = `Đã bóc tách thành công ${recipients.length} địa chỉ email hợp lệ từ tệp ${file.name}.`;

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: "excel",
    totalEmails: recipients.length,
    recipients,
    summary,
    eventOrTopicHint,
  };
}

/**
 * Bóc tách tệp Word (.docx)
 */
async function parseWordFile(file: File): Promise<ParsedFileResult> {
  const buffer = await file.arrayBuffer();
  // Giải mã text cơ bản từ nhị phân docx
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const rawStr = decoder.decode(buffer);

  const seenEmails = new Set<string>();
  const recipients: ParsedRecipientItem[] = [];

  const matches = rawStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
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

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: "word",
    totalEmails: recipients.length,
    recipients,
    summary: `Đã bóc tách ${recipients.length} địa chỉ email từ văn bản Word ${file.name}.`,
  };
}

/**
 * Bóc tách tệp Text hoặc CSV thô
 */
async function parseTextFile(file: File): Promise<ParsedFileResult> {
  const text = await file.text();
  const seenEmails = new Set<string>();
  const recipients: ParsedRecipientItem[] = [];

  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
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

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: "text",
    totalEmails: recipients.length,
    recipients,
    summary: `Đã tìm thấy ${recipients.length} địa chỉ email trong tệp ${file.name}.`,
  };
}
