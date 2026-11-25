import * as XLSX from 'xlsx';
import { DynamicFieldType, FieldMappingItem, SupportedEntityType } from './dto/dynamic-import.dto';

export interface ExtractedTable {
  sheetName: string;
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  sampleRows: Record<string, any>[];
}

export interface InferredFieldProposal {
  sourceColumn: string;
  targetFieldKey: string;
  targetFieldLabel: string;
  targetFieldType: DynamicFieldType;
  isCustomField: boolean;
  confidence: number;
  options?: string[];
  sampleValues: any[];
}

export interface ParseResult {
  fileName: string;
  fileType: 'excel' | 'csv' | 'word' | 'pdf' | 'text';
  fileSize: number;
  fileSignature: string;
  sheets: string[];
  selectedSheet: string;
  tables: ExtractedTable[];
  suggestedEntityType: SupportedEntityType;
  proposals: InferredFieldProposal[];
  summary: string;
}

export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
export const GLOBAL_EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
export const PHONE_REGEX = /^(?:0|\+84)(?:3|5|7|8|9)[0-9]{8}$/;
export const DATE_DMY_REGEX = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
export const DATE_YMD_REGEX = /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/;

/**
 * Chuẩn hóa tên trường tiếng Việt thành Technical Key PostgreSQL an toàn (snake_case)
 */
export function slugifyFieldName(label: string): string {
  if (!label) return 'custom_field';
  let s = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

  if (!s || /^[0-9]/.test(s)) {
    s = `field_${s}`;
  }
  return s.slice(0, 40);
}

/**
 * Tính toán file signature từ cấu trúc cột và sheet
 */
export function computeFileSignature(headers: string[]): string {
  const norm = headers
    .map((h) => slugifyFieldName(h))
    .sort()
    .join('|');
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash << 5) - hash + norm.charCodeAt(i);
    hash |= 0;
  }
  return `sig_${Math.abs(hash).toString(36)}`;
}

/**
 * Nhận diện kiểu dữ liệu tự động dựa trên mảng giá trị mẫu
 */
export function inferDataTypeFromValues(values: any[]): {
  type: DynamicFieldType;
  options?: string[];
} {
  const nonNull = values
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
    .map((v) => String(v).trim());

  if (nonNull.length === 0) {
    return { type: 'text' };
  }

  // 1. Kiểm tra Email
  const emailCount = nonNull.filter((v) => EMAIL_REGEX.test(v)).length;
  if (emailCount / nonNull.length >= 0.7) {
    return { type: 'email' };
  }

  // 2. Kiểm tra Số điện thoại
  const phoneCount = nonNull.filter((v) => {
    const clean = v.replace(/[\s\.\-\(\)]/g, '');
    return PHONE_REGEX.test(clean) || (clean.startsWith('0') && clean.length >= 10 && clean.length <= 11 && /^[0-9]+$/.test(clean));
  }).length;
  if (phoneCount / nonNull.length >= 0.7) {
    return { type: 'phone' };
  }

  // 3. Kiểm tra Ngày tháng
  const dateCount = nonNull.filter((v) => {
    return DATE_DMY_REGEX.test(v) || DATE_YMD_REGEX.test(v) || !isNaN(Date.parse(v));
  }).length;
  if (dateCount / nonNull.length >= 0.7) {
    return { type: 'date' };
  }

  // 4. Kiểm tra Boolean / Switch
  const boolCount = nonNull.filter((v) => {
    const l = v.toLowerCase();
    return ['true', 'false', 'có', 'không', 'co', 'khong', 'yes', 'no', '1', '0', 'x', '✓'].includes(l);
  }).length;
  if (boolCount / nonNull.length >= 0.8) {
    return { type: 'switch' };
  }

  // 5. Kiểm tra Tiền tệ & Số
  const currencyCount = nonNull.filter((v) => {
    return /[0-9]+(?:\.[0-9]{3}|,[0-9]{3})*(?:[,\.][0-9]+)?\s*(?:đ|vnd|usd|\$)?/i.test(v) &&
      (v.includes('đ') || v.includes('VND') || v.includes('vnđ') || v.includes('$') || /^[0-9\.\,\s]+$/.test(v));
  }).length;

  const numberCount = nonNull.filter((v) => {
    const clean = v.replace(/[\s,\.]/g, '');
    return !isNaN(Number(clean)) && clean.length > 0;
  }).length;

  if (currencyCount / nonNull.length >= 0.7 && nonNull.some((v) => /[đ\$]|vnd/i.test(v) || v.length > 6)) {
    return { type: 'currency' };
  }
  if (numberCount / nonNull.length >= 0.8) {
    return { type: 'number' };
  }

  // 6. Kiểm tra URL
  const urlCount = nonNull.filter((v) => v.startsWith('http://') || v.startsWith('https://') || v.startsWith('www.')).length;
  if (urlCount / nonNull.length >= 0.7) {
    return { type: 'url' };
  }

  // 7. Kiểm tra Select (danh sách discrete lặp lại <= 12 giá trị duy nhất)
  const uniqueVals = Array.from(new Set(nonNull));
  if (nonNull.length >= 4 && uniqueVals.length >= 2 && uniqueVals.length <= 12 && uniqueVals.every((u) => u.length <= 50)) {
    return { type: 'select', options: uniqueVals };
  }

  // 8. Textarea nếu văn bản dài
  if (nonNull.some((v) => v.length > 100 || v.includes('\n'))) {
    return { type: 'textarea' };
  }

  return { type: 'text' };
}

/**
 * Ánh xạ thông minh các cột phổ biến sang các trường Core CRM hoặc Custom Field
 */
export function matchStandardCrmField(
  colHeader: string,
  entityType: SupportedEntityType,
): { key: string; label: string; isCustom: boolean; confidence: number; defaultType?: DynamicFieldType } {
  const norm = colHeader.toLowerCase().trim();

  // MEMBER (Học viên / Hội viên)
  if (entityType === 'member') {
    if (/họ\s*(?:và|&)?\s*tên|họ_tên|học\s*viên|hội\s*viên|full\s*name|^tên$|^name$/i.test(norm)) {
      return { key: 'name', label: 'Họ và tên', isCustom: false, confidence: 0.98, defaultType: 'text' };
    }
    if (/mã\s*(?:số|học\s*viên|hội\s*viên|thành\s*viên|tv|hv)|member_?code|^code$|^mã$/i.test(norm)) {
      return { key: 'code', label: 'Mã học viên', isCustom: false, confidence: 0.95, defaultType: 'text' };
    }
    if (/sđt|số\s*điện\s*thoại|điện\s*thoại|phone|mobile|hotline/i.test(norm)) {
      return { key: 'phone', label: 'Số điện thoại', isCustom: false, confidence: 0.98, defaultType: 'phone' };
    }
    if (/email|e-mail|thư\s*điện\s*tử|^mail$/i.test(norm)) {
      return { key: 'email', label: 'Email', isCustom: false, confidence: 0.98, defaultType: 'email' };
    }
    if (/công\s*ty|doanh\s*nghiệp|đơn\s*vị|company|enterprise/i.test(norm)) {
      return { key: 'company', label: 'Công ty / Doanh nghiệp', isCustom: false, confidence: 0.95, defaultType: 'text' };
    }
    if (/chức\s*(?:vụ|danh)|vị\s*trí|position|title/i.test(norm)) {
      return { key: 'position', label: 'Chức vụ', isCustom: false, confidence: 0.95, defaultType: 'text' };
    }
    if (/ngành\s*(?:nghề)?|lĩnh\s*vực|industry|sector/i.test(norm)) {
      return { key: 'industry', label: 'Ngành nghề', isCustom: false, confidence: 0.92, defaultType: 'select' };
    }
    if (/ban\s*(?:chuyên\s*môn)?|phòng\s*ban|department/i.test(norm)) {
      return { key: 'department', label: 'Ban chuyên môn', isCustom: false, confidence: 0.92, defaultType: 'select' };
    }
    if (/địa\s*chỉ|tỉnh\s*\/?\s*thành|khu\s*vực|address|region/i.test(norm)) {
      return { key: 'address', label: 'Địa chỉ', isCustom: false, confidence: 0.9, defaultType: 'text' };
    }
    if (/ngày\s*(?:sinh|gia\s*nhập|tham\s*gia)|joined_?at|dob/i.test(norm)) {
      return { key: 'joined_at', label: 'Ngày tham gia', isCustom: false, confidence: 0.9, defaultType: 'date' };
    }
    if (/trạng\s*thái|status/i.test(norm)) {
      return { key: 'status', label: 'Trạng thái hoạt động', isCustom: false, confidence: 0.9, defaultType: 'select' };
    }
    if (/thanh\s*toán|đóng\s*phí|hội\s*phí|payment/i.test(norm)) {
      return { key: 'payment_status', label: 'Tình trạng hội phí', isCustom: false, confidence: 0.9, defaultType: 'select' };
    }
    if (/ghi\s*chú|mô\s*tả|nội\s*dung|note|about/i.test(norm)) {
      return { key: 'about', label: 'Ghi chú / Giới thiệu', isCustom: false, confidence: 0.88, defaultType: 'textarea' };
    }
  }

  // EVENT REGISTRATION
  if (entityType === 'event_registration') {
    if (/họ\s*(?:và|&)?\s*tên|đại\s*biểu|người\s*tham\s*dự|tên|name/i.test(norm)) {
      return { key: 'member_name', label: 'Họ và tên đại biểu', isCustom: false, confidence: 0.98, defaultType: 'text' };
    }
    if (/email|e-mail|thư\s*điện\s*tử/i.test(norm)) {
      return { key: 'email', label: 'Email', isCustom: false, confidence: 0.98, defaultType: 'email' };
    }
    if (/sđt|số\s*điện\s*thoại|điện\s*thoại|phone/i.test(norm)) {
      return { key: 'phone', label: 'Số điện thoại', isCustom: false, confidence: 0.98, defaultType: 'phone' };
    }
    if (/mã\s*(?:số|vé|đăng\s*ký|đại\s*biểu|thẻ)|code/i.test(norm)) {
      return { key: 'member_code', label: 'Mã vé / Mã đại biểu', isCustom: false, confidence: 0.95, defaultType: 'text' };
    }
    if (/công\s*ty|doanh\s*nghiệp|đơn\s*vị/i.test(norm)) {
      return { key: 'company', label: 'Công ty / Đơn vị', isCustom: false, confidence: 0.95, defaultType: 'text' };
    }
    if (/chức\s*vụ|position/i.test(norm)) {
      return { key: 'position', label: 'Chức vụ', isCustom: false, confidence: 0.95, defaultType: 'text' };
    }
    if (/loại\s*vé|hạng\s*vé|ticket/i.test(norm)) {
      return { key: 'ticket_type', label: 'Loại vé', isCustom: false, confidence: 0.92, defaultType: 'select' };
    }
    if (/tiền\s*vé|số\s*tiền|giá\s*vé|amount|fee/i.test(norm)) {
      return { key: 'payment_amount', label: 'Số tiền vé', isCustom: false, confidence: 0.92, defaultType: 'currency' };
    }
    if (/thanh\s*toán|tình\s*trạng\s*vé|payment_?status/i.test(norm)) {
      return { key: 'payment_status', label: 'Trạng thái thanh toán', isCustom: false, confidence: 0.92, defaultType: 'select' };
    }
    if (/số\s*bàn|bàn\s*tiệc|vị\s*trí\s*ngồi|seat|table/i.test(norm)) {
      return { key: 'table_name', label: 'Bàn tiệc / Ghế ngồi', isCustom: false, confidence: 0.9, defaultType: 'text' };
    }
    if (/điểm\s*danh|check-?in|checked/i.test(norm)) {
      return { key: 'checked_in', label: 'Đã điểm danh', isCustom: false, confidence: 0.9, defaultType: 'switch' };
    }
  }

  // CLASS / TRAININGS (Buổi học / Khóa học)
  if (entityType === 'class') {
    if (/tên\s*(?:buổi\s*học|chuyên\s*đề|khóa\s*học|bài\s*học)|tiêu\s*đề|^title$|^topic$/i.test(norm)) {
      return { key: 'title', label: 'Tên chuyên đề / Buổi học', isCustom: false, confidence: 0.98, defaultType: 'text' };
    }
    if (/buổi\s*số|thứ\s*tự|session_?number|stt/i.test(norm)) {
      return { key: 'session_number', label: 'Buổi số', isCustom: false, confidence: 0.95, defaultType: 'number' };
    }
    if (/giảng\s*viên|diễn\s*giả|chuyên\s*gia|instructor|lecturer|speaker/i.test(norm)) {
      return { key: 'instructor_name', label: 'Giảng viên chính', isCustom: false, confidence: 0.95, defaultType: 'text' };
    }
    if (/ngày\s*(?:học|khai\s*giảng|tổ\s*chức)|date/i.test(norm)) {
      return { key: 'date', label: 'Ngày học', isCustom: false, confidence: 0.95, defaultType: 'date' };
    }
    if (/giờ|thời\s*gian|khung\s*giờ|time/i.test(norm)) {
      return { key: 'time', label: 'Thời gian học', isCustom: false, confidence: 0.9, defaultType: 'text' };
    }
    if (/địa\s*điểm|phòng\s*học|hội\s*trường|location|room/i.test(norm)) {
      return { key: 'location', label: 'Địa điểm / Phòng học', isCustom: false, confidence: 0.92, defaultType: 'text' };
    }
    if (/hình\s*thức|format/i.test(norm)) {
      return { key: 'format', label: 'Hình thức học (Offline/Online/Hybrid)', isCustom: false, confidence: 0.9, defaultType: 'select' };
    }
    if (/học\s*phí|chi\s*phí|cost|fee/i.test(norm)) {
      return { key: 'ticket_fee', label: 'Học phí / Buổi', isCustom: false, confidence: 0.9, defaultType: 'currency' };
    }
    if (/số\s*học\s*viên|sĩ\s*số|max_?attendees/i.test(norm)) {
      return { key: 'max_attendees', label: 'Sĩ số tối đa', isCustom: false, confidence: 0.88, defaultType: 'number' };
    }
  }

  // TEACHER (Giảng viên)
  if (entityType === 'teacher') {
    if (/họ\s*(?:và|&)?\s*tên|giảng\s*viên|diễn\s*giả|tên|name/i.test(norm)) {
      return { key: 'name', label: 'Họ tên giảng viên', isCustom: false, confidence: 0.98, defaultType: 'text' };
    }
    if (/học\s*hàm|học\s*vị|chức\s*danh|title/i.test(norm)) {
      return { key: 'title', label: 'Học hàm / Học vị', isCustom: false, confidence: 0.95, defaultType: 'text' };
    }
    if (/công\s*ty|tổ\s*chức|doanh\s*nghiệp|company/i.test(norm)) {
      return { key: 'company', label: 'Cơ quan / Doanh nghiệp', isCustom: false, confidence: 0.95, defaultType: 'text' };
    }
    if (/sđt|điện\s*thoại|phone/i.test(norm)) {
      return { key: 'phone', label: 'Số điện thoại', isCustom: false, confidence: 0.98, defaultType: 'phone' };
    }
    if (/email|e-mail/i.test(norm)) {
      return { key: 'email', label: 'Email giảng viên', isCustom: false, confidence: 0.98, defaultType: 'email' };
    }
    if (/chuyên\s*môn|lĩnh\s*vực|chuyên\s*đề|expertise/i.test(norm)) {
      return { key: 'expertise', label: 'Lĩnh vực chuyên môn', isCustom: false, confidence: 0.92, defaultType: 'text' };
    }
    if (/thù\s*lao|phí\s*giảng|remuneration/i.test(norm)) {
      return { key: 'fee_rate', label: 'Mức thù lao giảng viên', isCustom: true, confidence: 0.88, defaultType: 'currency' };
    }
  }

  // FINANCE (Báo cáo tài chính thu chi)
  if (entityType === 'finance') {
    if (/ngày\s*(?:giao\s*dịch|chứng\s*từ|thu|chi)|date/i.test(norm)) {
      return { key: 'transaction_date', label: 'Ngày giao dịch', isCustom: false, confidence: 0.98, defaultType: 'date' };
    }
    if (/số\s*chứng\s*từ|số\s*phiếu|voucher/i.test(norm)) {
      return { key: 'voucher_no', label: 'Số chứng từ / Phiếu', isCustom: false, confidence: 0.95, defaultType: 'text' };
    }
    if (/danh\s*mục|loại\s*(?:thu|chi)|khoản\s*mục|category/i.test(norm)) {
      return { key: 'category', label: 'Hạng mục thu / chi', isCustom: false, confidence: 0.95, defaultType: 'select' };
    }
    if (/nội\s*dung|diễn\s*giải|mô\s*tả|description/i.test(norm)) {
      return { key: 'description', label: 'Nội dung diễn giải', isCustom: false, confidence: 0.98, defaultType: 'text' };
    }
    if (/số\s*tiền\s*thu|tiền\s*thu|khoản\s*thu|income/i.test(norm)) {
      return { key: 'income_amount', label: 'Số tiền Thu', isCustom: false, confidence: 0.95, defaultType: 'currency' };
    }
    if (/số\s*tiền\s*chi|tiền\s*chi|khoản\s*chi|expense/i.test(norm)) {
      return { key: 'expense_amount', label: 'Số tiền Chi', isCustom: false, confidence: 0.95, defaultType: 'currency' };
    }
    if (/số\s*tiền|giá\s*trị|amount/i.test(norm)) {
      return { key: 'amount', label: 'Số tiền giao dịch', isCustom: false, confidence: 0.92, defaultType: 'currency' };
    }
    if (/đối\s*tượng|người\s*nộp|người\s*nhận|đơn\s*vị\s*nộp|party/i.test(norm)) {
      return { key: 'party_name', label: 'Người nộp / Người nhận', isCustom: false, confidence: 0.95, defaultType: 'text' };
    }
    if (/hình\s*thức|phương\s*thức|method/i.test(norm)) {
      return { key: 'payment_method', label: 'Phương thức thanh toán', isCustom: false, confidence: 0.9, defaultType: 'select' };
    }
    if (/số\s*dư|còn\s*lại|balance/i.test(norm)) {
      return { key: 'balance_after', label: 'Số dư sau GD', isCustom: false, confidence: 0.88, defaultType: 'currency' };
    }
  }

  // NẾU KHÔNG KHỚP TRƯỜNG CỐT LÕI -> ĐỀ XUẤT TẠO TRƯỜNG MỚI (DYNAMIC FIELD)
  const safeSlug = slugifyFieldName(colHeader);
  return {
    key: safeSlug,
    label: colHeader.trim(),
    isCustom: true,
    confidence: 0.75,
  };
}

/**
 * Trích xuất bảng dữ liệu từ Workbook Excel/CSV
 */
export function extractExcelWorkbook(buffer: Buffer | Uint8Array, fileName: string): ExtractedTable[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const tables: ExtractedTable[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
    if (!rawRows || rawRows.length === 0) continue;

    // Tìm dòng header (dòng có nhiều ô có chữ nhất trong 10 dòng đầu)
    let headerRowIdx = 0;
    let maxNonEmpty = 0;
    for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;
      const count = row.filter((c) => c !== undefined && c !== null && String(c).trim() !== '').length;
      if (count > maxNonEmpty) {
        maxNonEmpty = count;
        headerRowIdx = r;
      }
    }

    const rawHeaders: any[] = rawRows[headerRowIdx] || [];
    const headers: string[] = [];
    const usedHeaders = new Set<string>();

    for (let c = 0; c < rawHeaders.length; c++) {
      let h = String(rawHeaders[c] || '').trim();
      if (!h) h = `Cot_${c + 1}`;
      let finalHeader = h;
      let counter = 2;
      while (usedHeaders.has(finalHeader)) {
        finalHeader = `${h}_${counter++}`;
      }
      usedHeaders.add(finalHeader);
      headers.push(finalHeader);
    }

    const rows: Record<string, any>[] = [];
    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const rowData = rawRows[r];
      if (!Array.isArray(rowData)) continue;
      const rowObj: Record<string, any> = {};
      let hasData = false;

      headers.forEach((h, idx) => {
        const val = rowData[idx];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          hasData = true;
          rowObj[h] = typeof val === 'string' ? val.trim() : val;
        } else {
          rowObj[h] = '';
        }
      });

      if (hasData) {
        rows.push(rowObj);
      }
    }

    if (rows.length > 0) {
      tables.push({
        sheetName,
        headers,
        rows,
        totalRows: rows.length,
        sampleRows: rows.slice(0, 10),
      });
    }
  }

  return tables;
}

/**
 * Trích xuất bảng và văn bản từ Word .docx
 */
export function extractWordDocx(buffer: Buffer | Uint8Array, fileName: string): ExtractedTable[] {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const rawStr = decoder.decode(buffer);

  // Lọc sạch XML tags nếu có để lấy các dòng văn bản
  const cleanLines = rawStr
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    .split(/\r?\n|\s{3,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  // Nhận diện cấu trúc dòng có phân tách bằng tab hoặc dấu phẩy hoặc pipe |
  const parsedRows: Record<string, any>[] = [];
  const headers = ['Họ và tên', 'Số điện thoại', 'Email', 'Công ty', 'Chức vụ', 'Nội dung'];

  for (const line of cleanLines) {
    const emails = line.match(GLOBAL_EMAIL_REGEX) || [];
    if (emails.length > 0 && emails[0]) {
      const email = emails[0].toLowerCase();
      // Tách tên và thông tin xung quanh
      const parts = line.split(/[|\t,;]/).map((p) => p.trim()).filter(Boolean);
      parsedRows.push({
        'Họ và tên': parts[0] || email.split('@')[0],
        'Số điện thoại': (line.match(/(?:0|\+84)[0-9]{9,10}/) || [''])[0] || '',
        'Email': email,
        'Công ty': parts[2] || '',
        'Chức vụ': parts[3] || '',
        'Nội dung': line.slice(0, 200),
      });
    }
  }

  if (parsedRows.length === 0 && cleanLines.length > 0) {
    // Fallback: nếu không thấy email, phân tích từng dòng văn bản
    cleanLines.slice(0, 50).forEach((line, idx) => {
      parsedRows.push({
        'STT': idx + 1,
        'Nội dung dòng': line,
        'Trạng thái': 'Trích xuất tự động',
      });
    });
    return [
      {
        sheetName: 'Word_Document',
        headers: ['STT', 'Nội dung dòng', 'Trạng thái'],
        rows: parsedRows,
        totalRows: parsedRows.length,
        sampleRows: parsedRows.slice(0, 10),
      },
    ];
  }

  return [
    {
      sheetName: 'Word_Tables',
      headers,
      rows: parsedRows,
      totalRows: parsedRows.length,
      sampleRows: parsedRows.slice(0, 10),
    },
  ];
}

/**
 * Trích xuất bảng và văn bản từ PDF
 */
export function extractPdf(buffer: Buffer | Uint8Array, fileName: string): ExtractedTable[] {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const rawStr = decoder.decode(buffer);

  const textChunks: string[] = [];
  const textPattern = /\(([^)]+)\)\s*Tj|\[([^\]]+)\]\s*TJ/g;
  let match;
  while ((match = textPattern.exec(rawStr)) !== null) {
    const chunk = match[1] || match[2] || '';
    textChunks.push(chunk.replace(/\\([()\\])/g, '$1'));
  }

  if (textChunks.length === 0) {
    const cleanLines = rawStr
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .split(/\s{2,}/)
      .filter((s) => s.trim().length > 3 && /[a-zA-ZÀ-ỹ0-9]/.test(s));
    textChunks.push(...cleanLines);
  }

  const combinedText = textChunks.join('\n');
  const lines = combinedText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 3);

  const parsedRows: Record<string, any>[] = [];
  const headers = ['Họ và tên', 'Số điện thoại', 'Email', 'Ghi chú'];

  for (const line of lines) {
    const emails = line.match(GLOBAL_EMAIL_REGEX) || [];
    if (emails.length > 0 && emails[0]) {
      const email = emails[0].toLowerCase();
      const phone = (line.match(/(?:0|\+84)[0-9]{9,10}/) || [''])[0] || '';
      const name = line.replace(email, '').replace(phone, '').trim() || email.split('@')[0];
      parsedRows.push({
        'Họ và tên': name,
        'Số điện thoại': phone,
        'Email': email,
        'Ghi chú': line.slice(0, 100),
      });
    }
  }

  if (parsedRows.length === 0) {
    lines.slice(0, 50).forEach((l, idx) => {
      parsedRows.push({
        'STT': idx + 1,
        'Dữ liệu': l,
      });
    });
    return [
      {
        sheetName: 'PDF_Document',
        headers: ['STT', 'Dữ liệu'],
        rows: parsedRows,
        totalRows: parsedRows.length,
        sampleRows: parsedRows.slice(0, 10),
      },
    ];
  }

  return [
    {
      sheetName: 'PDF_Data',
      headers,
      rows: parsedRows,
      totalRows: parsedRows.length,
      sampleRows: parsedRows.slice(0, 10),
    },
  ];
}
