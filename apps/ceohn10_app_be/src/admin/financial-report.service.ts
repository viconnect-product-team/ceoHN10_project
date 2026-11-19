import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface FinancialColumn {
  id: string;
  column_key: string;
  column_label: string;
  column_type: 'text' | 'number' | 'currency' | 'date' | 'select';
  is_custom: boolean;
  order_index: number;
  options?: any[];
  width_px?: number;
  is_visible?: boolean;
}

export interface FinancialRow {
  id: string;
  transaction_date: string;
  voucher_no?: string;
  category: string;
  description: string;
  income_amount: number;
  expense_amount: number;
  balance_after?: number;
  party_name?: string;
  status: string;
  custom_data?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class FinancialReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách cột động
   */
  async getColumns(): Promise<FinancialColumn[]> {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.financial_report_columns ORDER BY order_index ASC, created_at ASC`,
    );

    return rows.map((r) => ({
      id: r.id,
      column_key: r.column_key,
      column_label: r.column_label,
      column_type: r.column_type || 'text',
      is_custom: Boolean(r.is_custom),
      order_index: Number(r.order_index || 0),
      options: Array.isArray(r.options) ? r.options : typeof r.options === 'string' ? JSON.parse(r.options || '[]') : [],
      width_px: Number(r.width_px || 150),
      is_visible: r.is_visible !== undefined ? Boolean(r.is_visible) : true,
    }));
  }

  /**
   * Thêm cột mới trực tiếp từ giao diện -> Lưu ngay vào CSDL
   */
  async addColumn(data: {
    column_key?: string;
    column_label: string;
    column_type?: string;
    order_index?: number;
    options?: any[];
    width_px?: number;
  }): Promise<FinancialColumn> {
    const columnLabel = data.column_label.trim();
    // Tạo column_key tự động nếu chưa có
    const columnKey =
      data.column_key ||
      `col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const columnType = data.column_type || 'text';
    const orderIndex = Number(data.order_index || 99);
    const optionsJson = JSON.stringify(data.options || []);
    const widthPx = Number(data.width_px || 160);

    const inserted = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.financial_report_columns (
        id, column_key, column_label, column_type, is_custom, order_index, options, width_px, is_visible, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, true, $4, $5::jsonb, $6, true, NOW(), NOW()
      ) RETURNING *`,
      columnKey,
      columnLabel,
      columnType,
      orderIndex,
      optionsJson,
      widthPx,
    );

    const r = inserted[0];
    return {
      id: r.id,
      column_key: r.column_key,
      column_label: r.column_label,
      column_type: r.column_type,
      is_custom: Boolean(r.is_custom),
      order_index: Number(r.order_index),
      options: Array.isArray(r.options) ? r.options : [],
      width_px: Number(r.width_px),
      is_visible: Boolean(r.is_visible),
    };
  }

  /**
   * Cập nhật thông tin cột
   */
  async updateColumn(id: string, data: Partial<FinancialColumn>) {
    const existing = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.financial_report_columns WHERE id = $1::uuid LIMIT 1`,
      id,
    );
    if (!existing[0]) throw new NotFoundException('Không tìm thấy cột');

    const cur = existing[0];
    const columnLabel = data.column_label ?? cur.column_label;
    const columnType = data.column_type ?? cur.column_type;
    const orderIndex = data.order_index !== undefined ? Number(data.order_index) : cur.order_index;
    const isVisible = data.is_visible !== undefined ? Boolean(data.is_visible) : cur.is_visible;
    const widthPx = data.width_px !== undefined ? Number(data.width_px) : cur.width_px;
    const optionsJson = JSON.stringify(data.options ?? cur.options ?? []);

    const updated = await this.prisma.$queryRawUnsafe<any[]>(
      `UPDATE public.financial_report_columns SET
        column_label = $2,
        column_type = $3,
        order_index = $4,
        is_visible = $5,
        width_px = $6,
        options = $7::jsonb,
        updated_at = NOW()
       WHERE id = $1::uuid
       RETURNING *`,
      id,
      columnLabel,
      columnType,
      orderIndex,
      isVisible,
      widthPx,
      optionsJson,
    );

    return updated[0];
  }

  /**
   * Xóa cột động
   */
  async deleteColumn(id: string) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.financial_report_columns WHERE id = $1::uuid`,
      id,
    );
    return { success: true };
  }

  /**
   * Lấy danh sách hàng báo cáo tài chính
   */
  async getRows(query?: { fromDate?: string; toDate?: string; category?: string }) {
    let sql = `SELECT * FROM public.financial_report_rows WHERE 1=1`;
    const params: any[] = [];

    if (query?.fromDate) {
      params.push(query.fromDate);
      sql += ` AND transaction_date >= $${params.length}::date`;
    }
    if (query?.toDate) {
      params.push(query.toDate);
      sql += ` AND transaction_date <= $${params.length}::date`;
    }
    if (query?.category) {
      params.push(query.category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ` ORDER BY transaction_date DESC, created_at DESC`;

    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql, ...params);

    // Tính lũy kế số dư tự động
    let totalIncome = 0;
    let totalExpense = 0;

    const mapped = rows.map((r) => {
      const inc = Number(r.income_amount || 0);
      const exp = Number(r.expense_amount || 0);
      totalIncome += inc;
      totalExpense += exp;

      return {
        id: r.id,
        transaction_date: r.transaction_date,
        voucher_no: r.voucher_no || '',
        category: r.category || 'Chi phí chung',
        description: r.description || '',
        income_amount: inc,
        expense_amount: exp,
        balance_after: Number(r.balance_after || 0),
        party_name: r.party_name || '',
        status: r.status || 'completed',
        custom_data: typeof r.custom_data === 'string' ? JSON.parse(r.custom_data || '{}') : (r.custom_data || {}),
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    });

    return {
      rows: mapped,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        totalCount: mapped.length,
      },
    };
  }

  /**
   * Thêm hàng giao dịch tài chính mới
   */
  async addRow(data: {
    transaction_date?: string;
    voucher_no?: string;
    category?: string;
    description?: string;
    income_amount?: number;
    expense_amount?: number;
    party_name?: string;
    status?: string;
    custom_data?: Record<string, any>;
  }) {
    const txDate = data.transaction_date || new Date().toISOString().split('T')[0];
    const voucherNo = data.voucher_no || `PT-${Date.now().toString().slice(-6)}`;
    const category = data.category || 'Chi phí hoạt động';
    const description = data.description || 'Ghi nhận thu chi';
    const income = Number(data.income_amount || 0);
    const expense = Number(data.expense_amount || 0);
    const partyName = data.party_name || '';
    const status = data.status || 'completed';
    const customDataJson = JSON.stringify(data.custom_data || {});

    const inserted = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.financial_report_rows (
        id, transaction_date, voucher_no, category, description,
        income_amount, expense_amount, balance_after, party_name, status,
        custom_data, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::date, $2, $3, $4,
        $5, $6, 0, $7, $8,
        $9::jsonb, NOW(), NOW()
      ) RETURNING *`,
      txDate,
      voucherNo,
      category,
      description,
      income,
      expense,
      partyName,
      status,
      customDataJson,
    );

    return inserted[0];
  }

  /**
   * Cập nhật hàng tài chính
   */
  async updateRow(id: string, data: Partial<FinancialRow>) {
    const existing = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.financial_report_rows WHERE id = $1::uuid LIMIT 1`,
      id,
    );
    if (!existing[0]) throw new NotFoundException('Không tìm thấy bản ghi');

    const cur = existing[0];
    const txDate = data.transaction_date ?? cur.transaction_date;
    const voucherNo = data.voucher_no ?? cur.voucher_no;
    const category = data.category ?? cur.category;
    const description = data.description ?? cur.description;
    const income = data.income_amount !== undefined ? Number(data.income_amount) : cur.income_amount;
    const expense = data.expense_amount !== undefined ? Number(data.expense_amount) : cur.expense_amount;
    const partyName = data.party_name ?? cur.party_name;
    const status = data.status ?? cur.status;
    const mergedCustom = {
      ...(typeof cur.custom_data === 'string' ? JSON.parse(cur.custom_data || '{}') : (cur.custom_data || {})),
      ...(data.custom_data || {}),
    };
    const customDataJson = JSON.stringify(mergedCustom);

    const updated = await this.prisma.$queryRawUnsafe<any[]>(
      `UPDATE public.financial_report_rows SET
        transaction_date = $2::date,
        voucher_no = $3,
        category = $4,
        description = $5,
        income_amount = $6,
        expense_amount = $7,
        party_name = $8,
        status = $9,
        custom_data = $10::jsonb,
        updated_at = NOW()
       WHERE id = $1::uuid
       RETURNING *`,
      id,
      txDate,
      voucherNo,
      category,
      description,
      income,
      expense,
      partyName,
      status,
      customDataJson,
    );

    return updated[0];
  }

  /**
   * Xóa hàng
   */
  async deleteRow(id: string) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.financial_report_rows WHERE id = $1::uuid`,
      id,
    );
    return { success: true };
  }
}
