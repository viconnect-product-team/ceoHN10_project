import { BadRequestException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
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
export class FinancialReportService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.financial_report_columns (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          column_key TEXT UNIQUE NOT NULL,
          column_label TEXT NOT NULL,
          column_type TEXT NOT NULL DEFAULT 'text',
          is_custom BOOLEAN DEFAULT TRUE,
          order_index INT DEFAULT 99,
          options JSONB DEFAULT '[]'::jsonb,
          width_px INT DEFAULT 160,
          is_visible BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.financial_report_rows (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          transaction_date DATE NOT NULL,
          voucher_no TEXT,
          category TEXT NOT NULL,
          description TEXT,
          income_amount BIGINT DEFAULT 0,
          expense_amount BIGINT DEFAULT 0,
          balance_after BIGINT DEFAULT 0,
          party_name TEXT,
          status TEXT DEFAULT 'completed',
          custom_data JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.fund_transfer_orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          transfer_code TEXT UNIQUE NOT NULL,
          direction TEXT NOT NULL DEFAULT 'master_to_dept',
          source_fund_id UUID,
          destination_fund_id UUID,
          source_fund_name TEXT NOT NULL,
          destination_fund_name TEXT NOT NULL,
          amount BIGINT NOT NULL DEFAULT 0,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'pending_acceptance',
          created_by TEXT,
          created_by_name TEXT,
          accepted_by TEXT,
          accepted_by_name TEXT,
          accepted_at TIMESTAMPTZ,
          transfer_date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } catch (err) {
      console.warn('[FinancialReportService] Error creating tables on init:', err);
    }
  }

  /**
   * Lấy danh sách cột động
   */
  async getColumns(): Promise<FinancialColumn[]> {
    try {
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
    } catch (e) {
      console.warn('[FinancialReportService] getColumns fallback empty:', e);
      return [];
    }
  }

  /**
   * Thêm cột mới trực tiếp từ giao diện -> Lưu ngay vào CSDL và chạy ALTER TABLE
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
    // Tạo column_key an toàn cho CSDL PostgreSQL (lowercase a-z, 0-9, _)
    const baseSlug = columnLabel
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 30);
    const rawKey =
      data.column_key ||
      `col_${baseSlug}_${Date.now().toString().slice(-4)}`;
    const safeColKey = rawKey.replace(/[^a-z0-9_]/gi, '').toLowerCase();
    const columnType = data.column_type || 'text';
    const orderIndex = Number(data.order_index || 99);
    const optionsJson = JSON.stringify(data.options || []);
    const widthPx = Number(data.width_px || 160);

    const inserted = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.financial_report_columns (
        id, column_key, column_label, column_type, is_custom, order_index, options, width_px, is_visible, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, true, $4, $5::jsonb, $6, true, NOW(), NOW()
      ) ON CONFLICT (column_key) DO UPDATE SET
        column_label = EXCLUDED.column_label,
        column_type = EXCLUDED.column_type,
        width_px = EXCLUDED.width_px,
        updated_at = NOW()
      RETURNING *`,
      safeColKey,
      columnLabel,
      columnType,
      orderIndex,
      optionsJson,
      widthPx,
    );

    // THỰC THI ALTER TABLE NGAY DƯỚI CSDL POSTGRESQL CHO CẢ 2 BẢNG
    try {
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE public.financial_report_rows ADD COLUMN IF NOT EXISTS "${safeColKey}" TEXT;`,
      );
    } catch (alterErr) {
      console.warn(`[FinancialReport] Alter financial_report_rows error:`, alterErr);
    }
    try {
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS "${safeColKey}" TEXT;`,
      );
    } catch (alterErr2) {
      console.warn(`[FinancialReport] Alter transactions error:`, alterErr2);
    }

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
   * Xóa cột động và xóa column tương ứng dưới CSDL
   */
  async deleteColumn(id: string) {
    try {
      const existing = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT column_key, is_custom FROM public.financial_report_columns WHERE id = $1::uuid LIMIT 1`,
        id,
      );
      if (existing[0]?.column_key && existing[0]?.is_custom) {
        const safeColKey = existing[0].column_key.replace(/[^a-z0-9_]/gi, '').toLowerCase();
        try {
          await this.prisma.$executeRawUnsafe(
            `ALTER TABLE public.financial_report_rows DROP COLUMN IF EXISTS "${safeColKey}";`,
          );
        } catch (dropErr) {
          console.warn(`[FinancialReport] Drop column error:`, dropErr);
        }
      }
    } catch (e) {}

    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.financial_report_columns WHERE id = $1::uuid`,
      id,
    );
    return { success: true };
  }

  /**
   * Lấy danh sách hàng báo cáo tài chính
   */
  async getRows(query?: { fromDate?: string; toDate?: string; category?: string; fundId?: string; department?: string }) {
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
    if (query?.fundId || query?.department) {
      if (query.fundId && query.department) {
        params.push(query.fundId, query.department);
        sql += ` AND (custom_data->>'fundId' = $${params.length - 1} OR custom_data->>'department' = $${params.length} OR custom_data->>'targetFund' = $${params.length} OR custom_data->>'sourceFund' = $${params.length})`;
      } else if (query.fundId) {
        params.push(query.fundId);
        sql += ` AND custom_data->>'fundId' = $${params.length}`;
      } else if (query.department) {
        params.push(query.department);
        sql += ` AND (custom_data->>'department' = $${params.length} OR custom_data->>'targetFund' = $${params.length} OR custom_data->>'sourceFund' = $${params.length})`;
      }
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

  /**
   * Lệnh điều chuyển ngân sách / cấp kinh phí quỹ ban chuyên môn (Ví dụ: Cấp tiền cho Ban Công Nghệ)
   */
  async transferDepartmentFund(data: {
    fromDepartment?: string;
    toDepartment: string;
    amount: number;
    description: string;
    invoiceUrl?: string;
    fundAccountLink?: string;
    transactionDate?: string;
  }) {
    const fromDept = data.fromDepartment || 'Quỹ Tổng Hiệp Hội';
    const toDept = data.toDepartment || 'Ban Công Nghệ';
    const amount = Math.max(0, Number(data.amount) || 0);
    const txDate = data.transactionDate || new Date().toISOString().split('T')[0];
    const timestamp = Date.now().toString().slice(-6);

    const voucherOut = `CK-OUT-${timestamp}`;
    const voucherIn = `CK-IN-${timestamp}`;

    const customDataOut = {
      department: fromDept,
      sourceFund: fromDept,
      targetFund: toDept,
      type: 'OUT',
      flowDirection: 'out',
      invoiceUrl: data.invoiceUrl || '',
      fundAccountLink: data.fundAccountLink || '',
    };

    const customDataIn = {
      department: toDept,
      sourceFund: fromDept,
      targetFund: toDept,
      type: 'IN',
      flowDirection: 'in',
      invoiceUrl: data.invoiceUrl || '',
      fundAccountLink: data.fundAccountLink || '',
    };

    // 1. Ghi giao dịch xuất quỹ từ Quỹ nguồn
    const outRow = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.financial_report_rows (
        id, transaction_date, voucher_no, category, description,
        income_amount, expense_amount, balance_after, party_name, status,
        custom_data, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::date, $2, 'Điều chuyển ngân sách', $3,
        0, $4, 0, $5, 'completed',
        $6::jsonb, NOW(), NOW()
      ) RETURNING *`,
      txDate,
      voucherOut,
      `[CHI ĐIỀU CHUYỂN] ${data.description} -> Chuyển về ${toDept}`,
      amount,
      toDept,
      JSON.stringify(customDataOut),
    );

    // 2. Ghi giao dịch nhập quỹ vào Quỹ đích (type: 'IN')
    const inRow = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.financial_report_rows (
        id, transaction_date, voucher_no, category, description,
        income_amount, expense_amount, balance_after, party_name, status,
        custom_data, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::date, $2, 'Kinh phí điều chuyển nội bộ', $3,
        $4, 0, 0, $5, 'completed',
        $6::jsonb, NOW(), NOW()
      ) RETURNING *`,
      txDate,
      voucherIn,
      `[THU TIẾP NHẬN] ${data.description} (Nhận từ ${fromDept})`,
      amount,
      fromDept,
      JSON.stringify(customDataIn),
    );

    // 3. Cập nhật số dư thực tế trên bảng financial_funds cho cả Quỹ nguồn (-) và Quỹ đích (+)
    if (amount > 0) {
      const fromKeyword = fromDept.toLowerCase().includes('tổng')
        ? '%Tổng%'
        : fromDept.toLowerCase().includes('sự kiện')
        ? '%Sự kiện%'
        : `%${fromDept}%`;
      const toKeyword = toDept.toLowerCase().includes('tổng')
        ? '%Tổng%'
        : toDept.toLowerCase().includes('sự kiện')
        ? '%Sự kiện%'
        : `%${toDept}%`;

      await this.prisma.$executeRawUnsafe(
        `UPDATE public.financial_funds
         SET current_balance = GREATEST(0, current_balance - $1), updated_at = NOW()
         WHERE id = (SELECT id FROM public.financial_funds WHERE name ILIKE $2 ORDER BY created_at ASC LIMIT 1)`,
        amount,
        fromKeyword,
      ).catch(() => {});

      await this.prisma.$executeRawUnsafe(
        `UPDATE public.financial_funds
         SET current_balance = current_balance + $1, updated_at = NOW()
         WHERE id = (SELECT id FROM public.financial_funds WHERE name ILIKE $2 ORDER BY created_at ASC LIMIT 1)`,
        amount,
        toKeyword,
      ).catch(() => {});
    }

    return {
      success: true,
      message: `Đã điều chuyển ${amount.toLocaleString('vi-VN')} đ từ ${fromDept} về quỹ của ${toDept} thành công!`,
      outTransaction: outRow[0],
      inTransaction: inRow[0],
    };
  }

  private async canCreateMasterToDeptTransfer(actor: any): Promise<boolean> {
    if (!actor) return false;
    const email = String(actor.email || '').toLowerCase().trim();
    if (['admin@ceohn10.vn', 'admin@viconnect.vn', 'admin@connect.vn', 'ceo.chutich@ceohn10.com'].includes(email)) {
      return true;
    }
    const roles: string[] = [
      actor.role,
      ...(Array.isArray(actor.roles) ? actor.roles : []),
      actor.executiveRole,
      actor.department,
    ]
      .filter(Boolean)
      .map((r: any) => String(r).toLowerCase().trim());

    if (
      roles.some((r) =>
        ['platform_admin', 'admin_platform', 'superadmin', 'adm', 'admin', 'lop_truong', 'lớp trưởng', 'chu_tich', 'chủ tịch', 'ban_tai_chinh', 'tai_chinh', 'ke_toan'].includes(r) ||
        r.includes('tài chính') ||
        r.includes('tai chinh') ||
        r.includes('kế toán'),
      )
    ) {
      return true;
    }

    const userId = actor.id || actor.sub || actor.userId;
    if (!userId) return false;
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT m.department, m.executive_role, ur.role::text as user_role
      FROM public.members m
      LEFT JOIN public.user_roles ur ON ur.user_id = m.user_id
      WHERE m.user_id::text = ${String(userId)} OR LOWER(m.email) = LOWER(${email})
      LIMIT 3
    `.catch(() => []);

    return rows.some((r) => {
      const rStr = `${r.department || ''} ${r.executive_role || ''} ${r.user_role || ''}`.toLowerCase();
      return (
        rStr.includes('platform_admin') ||
        rStr.includes('lop_truong') ||
        rStr.includes('lớp trưởng') ||
        rStr.includes('tài chính') ||
        rStr.includes('tai chinh') ||
        rStr.includes('kế toán') ||
        rStr.includes('admin')
      );
    });
  }

  async getFundTransferOrders() {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM public.fund_transfer_orders ORDER BY created_at DESC LIMIT 200
    `).catch(() => []);
    return rows.map((r) => ({
      ...r,
      amount: Number(r.amount || 0),
    }));
  }

  async createFundTransferOrder(
    actor: any,
    dto: {
      direction?: 'master_to_dept' | 'dept_to_master';
      sourceFundId?: string;
      destinationFundId?: string;
      sourceFundName?: string;
      destinationFundName?: string;
      amount: number;
      description?: string;
      transferDate?: string;
    },
  ) {
    const direction = dto.direction === 'dept_to_master' ? 'dept_to_master' : 'master_to_dept';
    const amount = Math.round(Number(dto.amount) || 0);
    if (amount <= 0) {
      throw new BadRequestException('Số tiền lệnh chuyển phải lớn hơn 0');
    }

    if (direction === 'master_to_dept') {
      const allowed = await this.canCreateMasterToDeptTransfer(actor);
      if (!allowed) {
        throw new ForbiddenException(
          'Chỉ Platform Admin, Lớp trưởng hoặc thành viên Ban Tài Chính mới được lập lệnh chuyển tiền từ Quỹ Tổng xuống Ban!',
        );
      }
      if (amount > 20000000) {
        throw new BadRequestException(
          'Mỗi lệnh chuyển tiền từ Quỹ Tổng xuống Quỹ Ban tối đa 20.000.000 VNĐ',
        );
      }
    }

    let sourceFund: any = null;
    let destFund: any = null;
    if (dto.sourceFundId) {
      sourceFund = await this.prisma.financial_funds.findUnique({ where: { id: dto.sourceFundId } }).catch(() => null);
    }
    if (dto.destinationFundId) {
      destFund = await this.prisma.financial_funds.findUnique({ where: { id: dto.destinationFundId } }).catch(() => null);
    }

    const sourceName = sourceFund?.name || dto.sourceFundName || (direction === 'master_to_dept' ? 'Quỹ Tổng CLB CEO HN10' : 'Quỹ Ban Chuyên Trách');
    const destName = destFund?.name || dto.destinationFundName || (direction === 'dept_to_master' ? 'Quỹ Tổng CLB CEO HN10' : 'Quỹ Ban Chuyên Trách');
    const transferCode = `LCT-${Date.now().toString().slice(-6)}`;
    const txDate = dto.transferDate || new Date().toISOString().slice(0, 10);
    const actorId = String(actor?.id || actor?.sub || '');
    const actorName = String(actor?.name || actor?.email || 'Quản trị viên');

    const inserted = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.fund_transfer_orders (
        transfer_code, direction, source_fund_id, destination_fund_id,
        source_fund_name, destination_fund_name, amount, description,
        status, created_by, created_by_name, transfer_date, created_at, updated_at
      ) VALUES (
        $1, $2, $3::uuid, $4::uuid,
        $5, $6, $7, $8,
        'pending_acceptance', $9, $10, $11::date, NOW(), NOW()
      ) RETURNING *`,
      transferCode,
      direction,
      sourceFund?.id || null,
      destFund?.id || null,
      sourceName,
      destName,
      amount,
      dto.description || `Lệnh chuyển tiền ${sourceName} → ${destName}`,
      actorId,
      actorName,
      txDate,
    );

    const order = inserted[0];
    return {
      ...order,
      amount: Number(order.amount || 0),
      message:
        direction === 'master_to_dept'
          ? `Đã gửi lệnh chuyển ${amount.toLocaleString('vi-VN')} đ tới Trưởng ${destName} chờ tiếp nhận.`
          : `Đã gửi lệnh chuyển ${amount.toLocaleString('vi-VN')} đ lên Quỹ Tổng chờ tiếp nhận.`,
    };
  }

  async acceptFundTransferOrder(actor: any, orderId: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.fund_transfer_orders WHERE id = $1::uuid LIMIT 1`,
      orderId,
    ).catch(() => []);
    if (!rows.length) {
      throw new NotFoundException('Không tìm thấy lệnh chuyển tiền');
    }
    const order = rows[0];
    if (order.status === 'accepted') {
      throw new BadRequestException('Lệnh chuyển tiền này đã được tiếp nhận trước đó');
    }

    const amount = Number(order.amount || 0);
    const txDate = order.transfer_date
      ? order.transfer_date instanceof Date
        ? order.transfer_date.toISOString().slice(0, 10)
        : /^\d{4}-\d{2}-\d{2}/.test(String(order.transfer_date))
          ? String(order.transfer_date).slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    await this.prisma.$transaction(async (tx) => {
      if (order.source_fund_id) {
        await tx.$executeRawUnsafe(
          `UPDATE public.financial_funds SET current_balance = GREATEST(0, current_balance - $1), updated_at = NOW() WHERE id = $2::uuid`,
          amount,
          order.source_fund_id,
        );
      }
      if (order.destination_fund_id) {
        await tx.$executeRawUnsafe(
          `UPDATE public.financial_funds SET current_balance = current_balance + $1, updated_at = NOW() WHERE id = $2::uuid`,
          amount,
          order.destination_fund_id,
        );
      }

      await tx.$executeRawUnsafe(
        `INSERT INTO public.financial_report_rows (
          id, transaction_date, voucher_no, category, description,
          income_amount, expense_amount, balance_after, party_name, status,
          custom_data, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1::date, $2, $3, $4,
          0, $5, 0, $6, 'completed',
          $7::jsonb, NOW(), NOW()
        )`,
        txDate,
        `${order.transfer_code}-OUT`,
        order.direction === 'master_to_dept' ? 'Chi cấp kinh phí Ban' : 'Nộp tiền về Quỹ Tổng',
        `[ĐÃ TIẾP NHẬN] ${order.description || ''} (${order.source_fund_name} → ${order.destination_fund_name})`,
        amount,
        order.destination_fund_name,
        JSON.stringify({
          fundId: order.source_fund_id || undefined,
          department: order.source_fund_name,
          direction: order.direction,
          sourceFund: order.source_fund_name,
          targetFund: order.destination_fund_name,
          type: 'OUT',
          transferOrderId: order.id,
        }),
      );

      await tx.$executeRawUnsafe(
        `INSERT INTO public.financial_report_rows (
          id, transaction_date, voucher_no, category, description,
          income_amount, expense_amount, balance_after, party_name, status,
          custom_data, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1::date, $2, $3, $4,
          $5, 0, 0, $6, 'completed',
          $7::jsonb, NOW(), NOW()
        )`,
        txDate,
        `${order.transfer_code}-IN`,
        order.direction === 'master_to_dept' ? 'Tiếp nhận kinh phí từ Quỹ Tổng' : 'Thu tiền nộp từ Quỹ Ban về Quỹ Tổng',
        `[ĐÃ TIẾP NHẬN] ${order.description || ''} (Từ ${order.source_fund_name})`,
        amount,
        order.source_fund_name,
        JSON.stringify({
          fundId: order.destination_fund_id || undefined,
          department: order.destination_fund_name,
          direction: order.direction,
          sourceFund: order.source_fund_name,
          targetFund: order.destination_fund_name,
          type: 'IN',
          transferOrderId: order.id,
        }),
      );

      await tx.$executeRawUnsafe(
        `UPDATE public.fund_transfer_orders
         SET status = 'accepted', accepted_by = $1, accepted_by_name = $2, accepted_at = NOW(), updated_at = NOW()
         WHERE id = $3::uuid`,
        String(actor?.id || actor?.sub || ''),
        String(actor?.name || actor?.email || 'Trưởng ban'),
        orderId,
      );
    });

    return {
      success: true,
      message: `Đã tiếp nhận lệnh ${order.transfer_code} (${amount.toLocaleString('vi-VN')} đ) và cập nhật số dư quỹ thành công!`,
    };
  }

  async deleteFundTransferOrder(orderId: string) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.fund_transfer_orders WHERE id = $1::uuid`,
      orderId,
    );
    return { success: true };
  }
}
