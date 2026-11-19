/**
 * Tiện ích Validate biểu mẫu chuẩn Tiếng Việt cho CEO HN10 CRM & Mobile App
 */

export const VIETNAMESE_PHONE_REGEX = /^(0|\+84)[1-9][0-9]{8,9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SAFE_COLUMN_KEY_REGEX = /^[a-z][a-z0-9_]{1,63}$/;

/**
 * Kiểm tra tính hợp lệ của Số điện thoại Việt Nam
 */
export function isValidVietnamesePhone(phone: string): boolean {
  if (!phone) return false;
  return VIETNAMESE_PHONE_REGEX.test(phone.trim().replace(/\s+/g, ""));
}

/**
 * Kiểm tra tính hợp lệ của Email
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Kiểm tra mã cột động (chỉ cho phép chữ thường, số, gạch dưới; chống SQL Injection)
 */
export function isValidColumnKey(key: string): boolean {
  if (!key) return false;
  return SAFE_COLUMN_KEY_REGEX.test(key.trim());
}

/**
 * Validate biểu mẫu thêm mới / sửa Học viên
 */
export function validateMemberForm(values: {
  name?: string;
  phone?: string;
  email?: string;
  type?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!values.name || !values.name.trim()) {
    errors.name = "Họ và tên học viên / doanh nghiệp không được để trống";
  }

  if (values.phone && values.phone.trim()) {
    if (!isValidVietnamesePhone(values.phone)) {
      errors.phone = "Số điện thoại phải từ 10-11 số và bắt đầu bằng số 0 hoặc +84 (VD: 0912345678)";
    }
  }

  if (values.email && values.email.trim()) {
    if (!isValidEmail(values.email)) {
      errors.email = "Địa chỉ email không đúng định dạng (VD: example@ceohn10.vn)";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate biểu mẫu tạo cột động Báo cáo tài chính
 */
export function validateFinancialColumn(values: {
  column_key?: string;
  column_label?: string;
  data_type?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!values.column_label || !values.column_label.trim()) {
    errors.column_label = "Tên hiển thị của cột không được để trống";
  }

  if (!values.column_key || !values.column_key.trim()) {
    errors.column_key = "Mã cột (column_key) không được để trống";
  } else if (!isValidColumnKey(values.column_key)) {
    errors.column_key = "Mã cột phải bắt đầu bằng chữ cái thường và chỉ chứa chữ thường, số, dấu gạch dưới (VD: so_tien_tai_tro)";
  }

  if (!values.data_type) {
    errors.data_type = "Vui lòng chọn kiểu dữ liệu cột";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate dòng chứng từ Báo cáo tài chính
 */
export function validateFinancialRow(values: {
  description?: string;
  income_amount?: number | string;
  expense_amount?: number | string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (values.income_amount !== undefined && values.income_amount !== "") {
    const inc = Number(values.income_amount);
    if (isNaN(inc) || inc < 0) {
      errors.income_amount = "Số tiền thu phải là số không âm";
    }
  }

  if (values.expense_amount !== undefined && values.expense_amount !== "") {
    const exp = Number(values.expense_amount);
    if (isNaN(exp) || exp < 0) {
      errors.expense_amount = "Số tiền chi phải là số không âm";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
