import { z } from 'zod';

export class AddColumnDto {
  static schema = z.object({
    column_key: z
      .string()
      .trim()
      .regex(
        /^[a-z][a-z0-9_]{1,63}$/,
        'Mã cột (column_key) phải bắt đầu bằng chữ cái thường và chỉ chứa chữ thường, số, dấu gạch dưới (VD: so_tien_tai_tro)',
      ),
    column_label: z.string().trim().min(1, 'Tên hiển thị của cột không được để trống'),
    data_type: z.enum(['text', 'number', 'currency', 'date', 'select', 'boolean'], {
      errorMap: () => ({ message: 'Kiểu dữ liệu cột phải là: text, number, currency, date, select hoặc boolean' }),
    }),
    is_required: z.boolean().optional().default(false),
    options: z.array(z.string()).optional().default([]),
    order_index: z.number().int().optional().default(0),
  });

  column_key!: string;
  column_label!: string;
  data_type!: 'text' | 'number' | 'currency' | 'date' | 'select' | 'boolean';
  is_required?: boolean;
  options?: string[];
  order_index?: number;
}

export class UpdateColumnDto {
  static schema = z.object({
    column_label: z.string().trim().min(1, 'Tên hiển thị của cột không được để trống').optional(),
    is_required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
    order_index: z.number().int().optional(),
  });

  column_label?: string;
  is_required?: boolean;
  options?: string[];
  order_index?: number;
}

export class AddRowDto {
  static schema = z.object({
    transaction_date: z.string().optional(),
    voucher_no: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    income_amount: z.number().nonnegative('Số tiền thu không được âm').optional(),
    expense_amount: z.number().nonnegative('Số tiền chi không được âm').optional(),
    party_name: z.string().optional(),
    status: z.string().optional(),
    custom_data: z.record(z.any()).optional(),
  });

  transaction_date?: string;
  voucher_no?: string;
  category?: string;
  description?: string;
  income_amount?: number;
  expense_amount?: number;
  party_name?: string;
  status?: string;
  custom_data?: Record<string, any>;
}

export class UpdateRowDto {
  static schema = z.object({
    transaction_date: z.string().optional(),
    voucher_no: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    income_amount: z.number().nonnegative('Số tiền thu không được âm').optional(),
    expense_amount: z.number().nonnegative('Số tiền chi không được âm').optional(),
    party_name: z.string().optional(),
    status: z.string().optional(),
    custom_data: z.record(z.any()).optional(),
  });

  transaction_date?: string;
  voucher_no?: string;
  category?: string;
  description?: string;
  income_amount?: number;
  expense_amount?: number;
  party_name?: string;
  status?: string;
  custom_data?: Record<string, any>;
}
