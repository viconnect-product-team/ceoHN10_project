import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const TARGET_OPENING_BALANCE = 2100000000; // 2.1 tỷ đồng

@Injectable()
export class FinancialInitService {
  private readonly logger = new Logger(FinancialInitService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách toàn bộ các Quỹ tài chính kèm tổng dòng tiền VÀO và RA
   */
  async getFunds() {
    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE public.financial_funds ADD COLUMN IF NOT EXISTS leader_name TEXT
    `).catch(() => {});

    const funds = await this.prisma.financial_funds.findMany({
      orderBy: { current_balance: 'desc' },
      include: {
        bank_accounts: true,
      },
    });

    const transfers = await this.prisma.financial_transfers.findMany({
      where: { status: 'COMPLETED' },
    });

    const obItems = await this.prisma.financial_opening_balance_items.findMany();

    const sepayEvents = await this.prisma.sepay_webhook_events.findMany({
      where: { status: { in: ['PAID', 'RECEIVED', 'POSTED'] } },
    });

    const acceptedOrders = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM public.fund_transfer_orders WHERE status = 'accepted' ORDER BY accepted_at DESC
    `).catch(() => [] as any[]);

    // Nạp thêm dữ liệu đăng ký sự kiện đã thanh toán & giao dịch nhập tay để hiển thị rõ thông tin người chuyển
    const paidEventRegs = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT er.id, er.registration_id, er.full_name, er.email, er.phone, er.company,
             er.amount_paid, er.payment_method, er.payment_status, er.paid_at, er.created_at,
             e.name AS event_name
      FROM public.event_registrations er
      LEFT JOIN public.events e ON e.id::text = er.event_id::text
      WHERE LOWER(COALESCE(er.payment_status, '')) = 'paid' AND COALESCE(er.amount_paid, 0) > 0
      ORDER BY COALESCE(er.paid_at, er.created_at) DESC
      LIMIT 300
    `).catch(() => [] as any[]);

    const manualRows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT id, transaction_date, voucher_no, category, description,
             income_amount, expense_amount, party_name, status, custom_data, created_at
      FROM public.financial_report_rows
      WHERE COALESCE(custom_data->>'manualCashflow', '') = 'true'
      ORDER BY transaction_date DESC, created_at DESC
      LIMIT 300
    `).catch(() => [] as any[]);

    return funds.map((f) => {
      // 1. Số dư đầu kỳ phân bổ
      const obItem = obItems.find((it) => it.fund_id === f.id);
      const obAllocated = obItem ? Number(obItem.allocated_amount) : 0;

      // 2. Tiền nhận vào từ điều chuyển
      const transferIn =
        transfers
          .filter((tr) => tr.destination_fund_id === f.id)
          .reduce((sum, tr) => sum + Number(tr.amount), 0) +
        acceptedOrders
          .filter((o) => o.destination_fund_id === f.id)
          .reduce((sum, o) => sum + Number(o.amount || 0), 0);

      // 3. Tiền chuyển đi từ điều chuyển
      const transferOut =
        transfers
          .filter((tr) => tr.source_fund_id === f.id)
          .reduce((sum, tr) => sum + Number(tr.amount), 0) +
        acceptedOrders
          .filter((o) => o.source_fund_id === f.id)
          .reduce((sum, o) => sum + Number(o.amount || 0), 0);

      // 4. Tiền nhận từ SePay Webhook
      const sepayIn = sepayEvents
        .filter((ev) => ev.fund_id === f.id && ev.transfer_type === 'in')
        .reduce((sum, ev) => sum + Number(ev.transfer_amount), 0);

      // 5. Tiền nhập tay trực tiếp vào quỹ này
      const fundManualRows = manualRows.filter(
        (mr) => mr.custom_data?.fundId === f.id,
      );
      const manualIn = fundManualRows.reduce((sum, mr) => sum + Number(mr.income_amount || 0), 0);
      const manualOut = fundManualRows.reduce((sum, mr) => sum + Number(mr.expense_amount || 0), 0);

      // Tổng tiền Vào (Inflow)
      const totalInflow = obAllocated + transferIn + sepayIn + manualIn;

      // Tổng tiền Ra (Outflow)
      const totalOutflow = transferOut + manualOut;

      // Danh sách giao dịch Vào / Ra chi tiết của quỹ này
      const txList: any[] = [];
      if (obAllocated > 0) {
        txList.push({
          id: `OB-${f.code}`,
          type: 'IN',
          typeName: 'Số dư đầu kỳ',
          amount: obAllocated,
          date: '2026-01-01',
          counterparty: 'Số dư kết chuyển từ các kỳ trước',
          description: 'Khởi tạo số dư đầu kỳ chính thức CLB Doanh Nhân CEO HN10',
          voucherNo: 'SDDK-2026-001',
        });
      }

      acceptedOrders
        .filter((o) => o.destination_fund_id === f.id)
        .forEach((o) => {
          txList.push({
            id: o.id,
            type: 'IN',
            typeName: 'Lệnh chuyển quỹ (Đã tiếp nhận)',
            amount: Number(o.amount || 0),
            date: o.transfer_date ? String(o.transfer_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
            counterparty: o.source_fund_name || 'Quỹ Tổng CLB CEO HN10',
            description: o.description || 'Tiếp nhận kinh phí chuyển quỹ',
            voucherNo: o.transfer_code,
          });
        });

      acceptedOrders
        .filter((o) => o.source_fund_id === f.id)
        .forEach((o) => {
          txList.push({
            id: o.id,
            type: 'OUT',
            typeName: 'Lệnh chuyển quỹ đi',
            amount: Number(o.amount || 0),
            date: o.transfer_date ? String(o.transfer_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
            counterparty: o.destination_fund_name || 'Quỹ đích',
            description: o.description || 'Chuyển quỹ',
            voucherNo: o.transfer_code,
          });
        });

      transfers
        .filter((tr) => tr.destination_fund_id === f.id)
        .forEach((tr) => {
          txList.push({
            id: tr.id,
            type: 'IN',
            typeName: 'Nhận điều chuyển',
            amount: Number(tr.amount),
            date: tr.transfer_date ? tr.transfer_date.toISOString().slice(0, 10) : '2026-11-23',
            counterparty: 'Quỹ Tổng CLB Doanh Nhân CEO HN10',
            description: tr.description,
            voucherNo: tr.dest_voucher_no || 'PT-TRF-001',
          });
        });

      transfers
        .filter((tr) => tr.source_fund_id === f.id)
        .forEach((tr) => {
          const destFund = funds.find((d) => d.id === tr.destination_fund_id);
          txList.push({
            id: tr.id,
            type: 'OUT',
            typeName: 'Chuyển kinh phí',
            amount: Number(tr.amount),
            date: tr.transfer_date ? tr.transfer_date.toISOString().slice(0, 10) : '2026-11-23',
            counterparty: destFund?.name || 'Quỹ Ban chuyên môn',
            description: tr.description,
            voucherNo: tr.source_voucher_no || 'PC-TRF-001',
          });
        });

      sepayEvents
        .filter((ev) => ev.fund_id === f.id && ev.transfer_type === 'in')
        .forEach((ev) => {
          const contentUpper = String(ev.content || '').toUpperCase();
          const matchedReg = paidEventRegs.find((reg) => {
            const code = String(reg.registration_id || '').toUpperCase();
            return code && contentUpper.includes(code);
          });
          txList.push({
            id: ev.id,
            type: 'IN',
            typeName: 'SePay Webhook',
            amount: Number(ev.transfer_amount),
            date: ev.transaction_date ? ev.transaction_date.toISOString().slice(0, 10) : '2026-11-23',
            counterparty: matchedReg?.full_name
              ? `${matchedReg.full_name}${matchedReg.company ? ` (${matchedReg.company})` : ''}`
              : ev.bank_brand_name || 'Khách chuyển khoản SePay',
            payerEmail: matchedReg?.email || null,
            payerPhone: matchedReg?.phone || null,
            eventTitle: matchedReg?.event_name || null,
            ticketCode: matchedReg?.registration_id || null,
            description: matchedReg
              ? `Thanh toán vé sự kiện "${matchedReg.event_name || 'CEO HN10'}" (${matchedReg.registration_id}) - ${ev.content}`
              : ev.content,
            voucherNo: ev.reference_number || ev.gateway_transaction_id,
          });
        });

      fundManualRows.forEach((mr) => {
        const isIncome = Number(mr.income_amount || 0) > 0;
        const cd = mr.custom_data || {};
        txList.push({
          id: mr.id,
          type: isIncome ? 'IN' : 'OUT',
          typeName: isIncome ? 'Nhập tay Thu Quỹ' : 'Nhập tay Chi Quỹ',
          amount: isIncome ? Number(mr.income_amount) : Number(mr.expense_amount),
          date: mr.transaction_date ? String(mr.transaction_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
          counterparty: mr.party_name || cd.payerName || 'Giao dịch nhập tay',
          payerEmail: cd.payerEmail || null,
          payerPhone: cd.payerPhone || null,
          companyName: cd.companyName || null,
          studentCode: cd.studentCode || null,
          paymentMethod: cd.paymentMethod || 'bank',
          createdBy: cd.createdBy || null,
          createdByName: cd.createdByName || null,
          description: mr.description,
          voucherNo: mr.voucher_no,
        });
      });

      return {
        ...f,
        current_balance: Number(f.current_balance),
        opening_allocated: obAllocated,
        total_inflow: totalInflow,
        total_outflow: totalOutflow,
        transactions: txList,
      };
    });
  }

  /**
   * Nhập tay khoản Thu / Chi trực tiếp vào Quỹ Tổng hoặc Quỹ Ban (tự động biến động số dư quỹ theo thời gian thực)
   */
  async createManualCashflow(
    actor: any,
    dto: {
      fundId?: string;
      flowType: 'IN' | 'OUT';
      category: string;
      amount: number;
      payerName: string;
      payerPhone?: string;
      payerEmail?: string;
      companyName?: string;
      studentCode?: string;
      paymentMethod?: 'bank' | 'cash' | 'vietqr';
      description: string;
      transactionDate?: string;
      transferToGeneral?: boolean;
    },
  ) {
    const amount = Math.round(Number(dto.amount) || 0);
    if (amount <= 0) {
      throw new BadRequestException('Số tiền giao dịch phải lớn hơn 0');
    }
    if (!dto.payerName?.trim()) {
      throw new BadRequestException('Vui lòng nhập rõ họ tên người nộp / người nhận tiền');
    }

    const flowType = dto.flowType === 'OUT' ? 'OUT' : 'IN';
    const txDate = dto.transactionDate || new Date().toISOString().slice(0, 10);
    const voucherNo = `${flowType === 'IN' ? 'PT' : 'PC'}-TAY-${Date.now().toString().slice(-6)}`;
    const actorId = String(actor?.id || actor?.sub || actor?.userId || '');
    const actorName = String(actor?.name || actor?.email || 'Quản trị viên');

    const generalFund = await this.prisma.financial_funds.findFirst({
      where: { OR: [{ code: 'FUND_GENERAL' }, { fund_type: 'GENERAL' }] },
    });
    const targetFund = dto.fundId
      ? await this.prisma.financial_funds.findUnique({ where: { id: dto.fundId } })
      : generalFund;

    if (!targetFund) {
      throw new NotFoundException('Không tìm thấy Quỹ hạch toán trong CSDL');
    }

    if (flowType === 'OUT' && Number(targetFund.current_balance) < amount) {
      throw new BadRequestException(
        `Số dư ${targetFund.name} (${Number(targetFund.current_balance).toLocaleString('vi-VN')} đ) không đủ để chi ${amount.toLocaleString('vi-VN')} đ`,
      );
    }

    const customData = {
      manualCashflow: 'true',
      fundId: targetFund.id,
      fundName: targetFund.name,
      flowType,
      payerName: dto.payerName.trim(),
      payerPhone: dto.payerPhone?.trim() || null,
      payerEmail: dto.payerEmail?.trim() || null,
      companyName: dto.companyName?.trim() || null,
      studentCode: dto.studentCode?.trim() || null,
      paymentMethod: dto.paymentMethod || 'bank',
      createdBy: actorId,
      createdByName: actorName,
      transferToGeneral: Boolean(dto.transferToGeneral),
    };

    await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật biến động số dư Quỹ ngay lập tức
      const nextBalance =
        flowType === 'IN'
          ? BigInt(Number(targetFund.current_balance) + amount)
          : BigInt(Math.max(0, Number(targetFund.current_balance) - amount));

      await tx.financial_funds.update({
        where: { id: targetFund.id },
        data: { current_balance: nextBalance, updated_at: new Date() },
      });

      // 2. Lưu chi tiết dòng tiền nhập tay vào financial_report_rows (tương thích cả cột title/amount và voucher_no/income_amount)
      const rowId = crypto.randomUUID();
      await tx.$executeRawUnsafe(
        `INSERT INTO public.financial_report_rows (
          id, row_code, title, transaction_date, voucher_no, category, type, amount, description,
          income_amount, expense_amount, balance_after, party_name, status,
          custom_data, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4::date, $2, $5, $6, $7, $8,
          $9, $10, $11, $12, 'completed',
          $13::jsonb, NOW(), NOW()
        )`,
        rowId,
        voucherNo,
        dto.description || `${flowType === 'IN' ? 'Thu' : 'Chi'} từ ${dto.payerName.trim()}`,
        txDate,
        dto.category || (flowType === 'IN' ? 'Thu nhập tay' : 'Chi nhập tay'),
        flowType === 'IN' ? 'income' : 'expense',
        amount,
        dto.description || `${flowType === 'IN' ? 'Thu' : 'Chi'} từ ${dto.payerName.trim()}`,
        flowType === 'IN' ? amount : 0,
        flowType === 'OUT' ? amount : 0,
        Number(nextBalance),
        dto.payerName.trim(),
        JSON.stringify(customData),
      );

      // 3. Nếu là khoản Thu vào Quỹ Ban và bật "Lập lệnh chuyển thẳng về Quỹ Tổng"
      if (
        flowType === 'IN' &&
        dto.transferToGeneral &&
        generalFund &&
        targetFund.id !== generalFund.id
      ) {
        await tx.financial_funds.update({
          where: { id: targetFund.id },
          data: {
            current_balance: BigInt(Math.max(0, Number(nextBalance) - amount)),
            updated_at: new Date(),
          },
        });
        await tx.financial_funds.update({
          where: { id: generalFund.id },
          data: {
            current_balance: BigInt(Number(generalFund.current_balance) + amount),
            updated_at: new Date(),
          },
        });

        const trfCode = `LCT-AUTO-${Date.now().toString().slice(-6)}`;
        await tx.$executeRawUnsafe(
          `INSERT INTO public.fund_transfer_orders (
            transfer_code, direction, source_fund_id, destination_fund_id,
            source_fund_name, destination_fund_name, amount, description,
            status, created_by, created_by_name, accepted_by, accepted_by_name, accepted_at,
            transfer_date, created_at, updated_at
          ) VALUES (
            $1, 'dept_to_master', $2::uuid, $3::uuid,
            $4, $5, $6, $7,
            'accepted', $8, $9, $8, $9, NOW(),
            $10::date, NOW(), NOW()
          )`,
          trfCode,
          targetFund.id,
          generalFund.id,
          targetFund.name,
          generalFund.name,
          amount,
          `[Tự động chuyển về Quỹ Tổng] ${dto.description || dto.payerName.trim()}`,
          actorId,
          actorName,
          txDate,
        );
      }
    });

    return {
      success: true,
      voucherNo,
      amount,
      flowType,
      fundName: targetFund.name,
      message:
        flowType === 'IN' && dto.transferToGeneral && generalFund && targetFund.id !== generalFund.id
          ? `Đã ghi nhận khoản thu ${amount.toLocaleString('vi-VN')} đ từ ${dto.payerName.trim()} và chuyển thẳng vào ${generalFund.name}!`
          : `Đã ghi nhận khoản ${flowType === 'IN' ? 'Thu' : 'Chi'} ${amount.toLocaleString('vi-VN')} đ (${targetFund.name}) thành công!`,
    };
  }

  /**
   * Lấy Sổ chi tiết dòng tiền minh bạch (hiển thị rõ người chuyển phí sự kiện, giao dịch nhập tay, SePay & điều chuyển quỹ)
   */
  async getDetailedLedger() {
    const [paidEventRegs, manualRows, sepayEvents, funds] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(`
        SELECT er.id, er.registration_id, er.full_name, er.email, er.phone, er.company,
               er.amount_paid, er.payment_method, er.payment_status, er.paid_at, er.created_at,
               e.name AS event_name
        FROM public.event_registrations er
        LEFT JOIN public.events e ON e.id::text = er.event_id::text
        WHERE LOWER(COALESCE(er.payment_status, '')) = 'paid' AND COALESCE(er.amount_paid, 0) > 0
        ORDER BY COALESCE(er.paid_at, er.created_at) DESC
        LIMIT 300
      `).catch(() => []),
      this.prisma.$queryRawUnsafe<any[]>(`
        SELECT id, transaction_date, voucher_no, category, description,
               income_amount, expense_amount, party_name, status, custom_data, created_at
        FROM public.financial_report_rows
        ORDER BY transaction_date DESC, created_at DESC
        LIMIT 300
      `).catch(() => []),
      this.prisma.sepay_webhook_events.findMany({
        orderBy: { transaction_date: 'desc' },
        take: 100,
      }).catch(() => []),
      this.prisma.financial_funds.findMany().catch(() => []),
    ]);

    const fundMap = new Map<string, string>(
      funds.map((f) => [f.id, f.name] as [string, string]),
    );
    const ledger: any[] = [];

    for (const reg of paidEventRegs) {
      ledger.push({
        id: `EVT-${reg.id}`,
        voucherNo: reg.registration_id || `REG-${reg.id}`,
        flowType: 'IN',
        category: 'Thanh toán phí sự kiện',
        payerName: reg.full_name || 'Đại biểu sự kiện',
        payerEmail: reg.email || '',
        payerPhone: reg.phone || '',
        companyName: reg.company || '',
        studentCode: reg.registration_id || '',
        fundName: 'Quỹ Ban Sự kiện & Hậu cần',
        paymentMethod: reg.payment_method || 'vietqr',
        amount: Number(reg.amount_paid || 0),
        description: `Thanh toán vé sự kiện "${reg.event_name || 'Sự kiện CEO HN10'}" (Mã vé: ${reg.registration_id})`,
        date: (reg.paid_at || reg.created_at) ? new Date(reg.paid_at || reg.created_at).toISOString() : new Date().toISOString(),
        source: 'event_payment',
        createdBy: null,
        createdByName: 'Hệ thống SePay / Check-in',
      });
    }

    for (const mr of manualRows) {
      const cd = mr.custom_data || {};
      const isIn = Number(mr.income_amount || 0) > 0;
      ledger.push({
        id: mr.id,
        voucherNo: mr.voucher_no || 'PT-TAY',
        flowType: isIn ? 'IN' : 'OUT',
        category: mr.category || (isIn ? 'Thu nhập tay' : 'Chi nhập tay'),
        payerName: mr.party_name || cd.payerName || '—',
        payerEmail: cd.payerEmail || '',
        payerPhone: cd.payerPhone || '',
        companyName: cd.companyName || '',
        studentCode: cd.studentCode || '',
        fundName: cd.fundName || (cd.fundId ? fundMap.get(cd.fundId) : null) || cd.department || 'Quỹ Tổng CEOHN10',
        paymentMethod: cd.paymentMethod || 'bank',
        amount: isIn ? Number(mr.income_amount || 0) : Number(mr.expense_amount || 0),
        description: mr.description || '',
        date: mr.transaction_date ? new Date(mr.transaction_date).toISOString() : new Date().toISOString(),
        source: cd.manualCashflow === 'true' ? 'manual' : 'report_row',
        createdBy: cd.createdBy || null,
        createdByName: cd.createdByName || 'Quản trị viên',
      });
    }

    for (const ev of sepayEvents) {
      const contentUpper = String(ev.content || '').toUpperCase();
      const matched = paidEventRegs.find((reg) => reg.registration_id && contentUpper.includes(String(reg.registration_id).toUpperCase()));
      if (!matched) {
        ledger.push({
          id: `SEPAY-${ev.id}`,
          voucherNo: ev.reference_number || ev.gateway_transaction_id || 'SEPAY',
          flowType: ev.transfer_type === 'out' ? 'OUT' : 'IN',
          category: 'Giao dịch ngân hàng SePay',
          payerName: ev.bank_brand_name || 'Chuyển khoản SePay',
          payerEmail: '',
          payerPhone: '',
          companyName: '',
          studentCode: '',
          fundName: (ev.fund_id && fundMap.get(ev.fund_id)) || 'Quỹ Tổng CEOHN10',
          paymentMethod: 'vietqr',
          amount: Number(ev.transfer_amount || 0),
          description: ev.content || 'Biến động số dư SePay',
          date: ev.transaction_date ? ev.transaction_date.toISOString() : new Date().toISOString(),
          source: 'sepay',
          createdBy: null,
          createdByName: 'SePay Webhook',
        });
      }
    }

    ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return ledger;
  }

  /**
   * Lấy chi tiết Kỳ khởi tạo số dư đầu kỳ (Opening Balance 2.1 tỷ)
   */
  async getOpeningBalance() {
    const ob = await this.prisma.financial_opening_balances.findFirst({
      where: { period_code: 'OB_2026_INITIAL' },
      include: {
        financial_opening_balance_items: {
          include: { financial_funds: true },
        },
      },
    });

    if (!ob) {
      // Tự động khởi tạo nếu chưa có
      const defaultOb = await this.prisma.financial_opening_balances.create({
        data: {
          period_code: 'OB_2026_INITIAL',
          total_amount: BigInt(TARGET_OPENING_BALANCE),
          status: 'POSTED',
          notes: 'Khởi tạo số dư đầu kỳ chính thức CLB Doanh Nhân CEO HN10: 2.100.000.000 VNĐ',
          posted_at: new Date(),
        },
      });
      return {
        ...defaultOb,
        total_amount: Number(defaultOb.total_amount),
        items: [],
      };
    }

    return {
      ...ob,
      total_amount: Number(ob.total_amount),
      items: ob.financial_opening_balance_items.map((it) => ({
        id: it.id,
        fundId: it.fund_id,
        fundCode: it.financial_funds?.code,
        fundName: it.financial_funds?.name,
        fundType: it.financial_funds?.fund_type,
        allocatedAmount: Number(it.allocated_amount),
        notes: it.notes,
      })),
    };
  }

  /**
   * Lưu hoặc phân bổ số dư đầu kỳ (Bắt buộc tổng phải bằng đúng 2.100.000.000 VNĐ)
   */
  async saveOpeningBalance(
    actorId: string | undefined,
    data: {
      items: { fundId: string; allocatedAmount: number; notes?: string }[];
      notes?: string;
    },
  ) {
    const ob = await this.prisma.financial_opening_balances.findFirst({
      where: { period_code: 'OB_2026_INITIAL' },
    });

    if (ob && ob.status === 'POSTED') {
      throw new BadRequestException(
        'Kỳ số dư đầu kỳ đã được POSTED (ghi sổ chính thức), không thể chỉnh sửa trực tiếp. Vui lòng tạo bút toán điều chỉnh có audit log!',
      );
    }

    // 1. Kiểm tra tổng số tiền phân bổ
    const sumAllocated = data.items.reduce(
      (sum, item) => sum + Number(item.allocatedAmount || 0),
      0,
    );

    if (sumAllocated !== TARGET_OPENING_BALANCE) {
      throw new BadRequestException(
        `Quy tắc tài chính: Tổng số dư đầu kỳ phân bổ các quỹ phải CHÍNH XÁC bằng 2.100.000.000 VNĐ (Tổng hiện tại của bạn: ${sumAllocated.toLocaleString(
          'vi-VN',
        )} VNĐ - Chênh lệch: ${(
          TARGET_OPENING_BALANCE - sumAllocated
        ).toLocaleString('vi-VN')} VNĐ)`,
      );
    }

    const obId = ob
      ? ob.id
      : (
          await this.prisma.financial_opening_balances.create({
            data: {
              period_code: 'OB_2026_INITIAL',
              total_amount: BigInt(TARGET_OPENING_BALANCE),
              status: 'DRAFT',
              created_by: actorId || null,
            },
          })
        ).id;

    // 2. Lưu chi tiết phân bổ trong transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.financial_opening_balance_items.deleteMany({
        where: { opening_balance_id: obId },
      });

      for (const item of data.items) {
        await tx.financial_opening_balance_items.create({
          data: {
            opening_balance_id: obId,
            fund_id: item.fundId,
            allocated_amount: BigInt(item.allocatedAmount),
            notes: item.notes || '',
          },
        });
      }

      await tx.financial_opening_balances.update({
        where: { id: obId },
        data: {
          notes: data.notes || '',
          status: 'PENDING_APPROVAL',
          updated_at: new Date(),
        },
      });
    });

    return { success: true, message: 'Đã lưu phân bổ số dư đầu kỳ 2.1 tỷ đồng thành công!' };
  }

  /**
   * Phê duyệt số dư đầu kỳ
   */
  async approveOpeningBalance(actorId: string | undefined) {
    const ob = await this.prisma.financial_opening_balances.findFirst({
      where: { period_code: 'OB_2026_INITIAL' },
    });
    if (!ob) throw new NotFoundException('Không tìm thấy kỳ số dư đầu kỳ');

    return this.prisma.financial_opening_balances.update({
      where: { id: ob.id },
      data: {
        status: 'APPROVED',
        approved_by: actorId || null,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Chốt số dư đầu kỳ (POSTED) -> Chính thức cập nhật số dư các quỹ
   */
  async postOpeningBalance(actorId: string | undefined) {
    const ob = await this.prisma.financial_opening_balances.findFirst({
      where: { period_code: 'OB_2026_INITIAL' },
      include: { financial_opening_balance_items: true },
    });
    if (!ob) throw new NotFoundException('Không tìm thấy kỳ số dư đầu kỳ');

    if (ob.status === 'POSTED') {
      throw new BadRequestException('Kỳ số dư đầu kỳ này đã được POSTED trước đó!');
    }

    await this.prisma.$transaction(async (tx) => {
      // Cập nhật current_balance của từng quỹ
      for (const item of ob.financial_opening_balance_items) {
        await tx.financial_funds.update({
          where: { id: item.fund_id },
          data: {
            current_balance: item.allocated_amount,
            updated_at: new Date(),
          },
        });
      }

      await tx.financial_opening_balances.update({
        where: { id: ob.id },
        data: {
          status: 'POSTED',
          posted_at: new Date(),
          approved_by: actorId || ob.approved_by,
          updated_at: new Date(),
        },
      });
    });

    return { success: true, message: 'Đã chốt sổ chính thức (POSTED) số dư đầu kỳ 2.1 tỷ!' };
  }

  /**
   * Lấy danh sách các lệnh điều chuyển nội bộ giữa các quỹ
   */
  async getTransfers() {
    const rows = await this.prisma.financial_transfers.findMany({
      include: {
        source_fund: true,
        destination_fund: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
    }));
  }

  /**
   * Tạo lệnh điều chuyển nội bộ giữa 2 quỹ (VD: 20 triệu từ Quỹ Tổng sang Ban Công Nghệ)
   * TUYỆT ĐỐI KHÔNG TẠO DOANH THU / CHI PHÍ HỢP NHẤT
   */
  async createTransfer(
    actorId: string | undefined,
    data: {
      sourceFundId: string;
      destFundId: string;
      amount: number;
      description: string;
      transferDate?: string;
    },
  ) {
    if (data.sourceFundId === data.destFundId) {
      throw new BadRequestException('Quỹ nguồn và quỹ đích không được trùng nhau');
    }
    if (data.amount <= 0) {
      throw new BadRequestException('Số tiền điều chuyển phải lớn hơn 0');
    }

    const sourceFund = await this.prisma.financial_funds.findUnique({
      where: { id: data.sourceFundId },
    });
    if (!sourceFund) throw new NotFoundException('Không tìm thấy quỹ nguồn');

    const destFund = await this.prisma.financial_funds.findUnique({
      where: { id: data.destFundId },
    });
    if (!destFund) throw new NotFoundException('Không tìm thấy quỹ đích');

    if (Number(sourceFund.current_balance) < data.amount) {
      throw new BadRequestException(
        `Số dư quỹ nguồn không đủ để thực hiện lệnh chuyển (Hiện có: ${Number(
          sourceFund.current_balance,
        ).toLocaleString('vi-VN')} VNĐ - Cần chuyển: ${data.amount.toLocaleString(
          'vi-VN',
        )} VNĐ)`,
      );
    }

    const transferCode = `TRF-${Date.now().toString().slice(-6)}`;
    const sourceVoucher = `PC-TRF-${Date.now().toString().slice(-6)}`;
    const destVoucher = `PT-TRF-${Date.now().toString().slice(-6)}`;

    // Thực thi trong 1 transaction an toàn
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Trừ số dư quỹ nguồn
      await tx.financial_funds.update({
        where: { id: data.sourceFundId },
        data: {
          current_balance: BigInt(Number(sourceFund.current_balance) - data.amount),
          updated_at: new Date(),
        },
      });

      // 2. Cộng số dư quỹ đích
      await tx.financial_funds.update({
        where: { id: data.destFundId },
        data: {
          current_balance: BigInt(Number(destFund.current_balance) + data.amount),
          updated_at: new Date(),
        },
      });

      // 3. Tạo bản ghi điều chuyển
      return tx.financial_transfers.create({
        data: {
          transfer_id: transferCode,
          source_fund_id: data.sourceFundId,
          destination_fund_id: data.destFundId,
          amount: BigInt(data.amount),
          description: data.description,
          transfer_date: data.transferDate ? new Date(data.transferDate) : new Date(),
          status: 'COMPLETED',
          created_by: actorId || null,
          source_voucher_no: sourceVoucher,
          dest_voucher_no: destVoucher,
        },
        include: {
          source_fund: true,
          destination_fund: true,
        },
      });
    });

    return {
      ...result,
      amount: Number(result.amount),
    };
  }

  /**
   * Quản lý danh sách Tài khoản ngân hàng
   */
  async getBankAccounts() {
    return this.prisma.bank_accounts.findMany({
      include: { financial_funds: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async createBankAccount(data: {
    fundId: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    sepayAccountId?: string;
    isDefault?: boolean;
  }) {
    return this.prisma.bank_accounts.create({
      data: {
        fund_id: data.fundId,
        bank_name: data.bankName,
        account_number: data.accountNumber.trim(),
        account_holder: data.accountHolder.trim(),
        sepay_account_id: data.sepayAccountId?.trim() || null,
        is_default: data.isDefault || false,
      },
      include: { financial_funds: true },
    });
  }

  async updateBankAccount(
    id: string,
    data: {
      fundId?: string;
      bankName?: string;
      accountNumber?: string;
      accountHolder?: string;
      sepayAccountId?: string;
      isActive?: boolean;
      isDefault?: boolean;
    },
  ) {
    return this.prisma.bank_accounts.update({
      where: { id },
      data: {
        fund_id: data.fundId,
        bank_name: data.bankName,
        account_number: data.accountNumber ? data.accountNumber.trim() : undefined,
        account_holder: data.accountHolder ? data.accountHolder.trim() : undefined,
        sepay_account_id: data.sepayAccountId !== undefined ? data.sepayAccountId.trim() : undefined,
        is_active: data.isActive,
        is_default: data.isDefault,
        updated_at: new Date(),
      },
      include: { financial_funds: true },
    });
  }

  /**
   * Quản lý Đối soát ngân hàng
   */
  async getReconciliations() {
    const rows = await this.prisma.bank_reconciliations.findMany({
      include: { bank_accounts: true },
      orderBy: { created_at: 'desc' },
    });

    return rows.map((r) => ({
      ...r,
      opening_balance: Number(r.opening_balance),
      closing_balance: Number(r.closing_balance),
      total_in: Number(r.total_in),
      total_out: Number(r.total_out),
      difference: Number(r.difference),
    }));
  }

  async createReconciliation(
    actorId: string | undefined,
    data: {
      bankAccountId: string;
      periodFrom: string;
      periodTo: string;
      openingBalance: number;
      closingBalance: number;
      totalIn: number;
      totalOut: number;
      difference: number;
      matchedCount?: number;
      unmatchedCount?: number;
      notes?: string;
    },
  ) {
    const code = `REC-${Date.now().toString().slice(-6)}`;
    const row = await this.prisma.bank_reconciliations.create({
      data: {
        reconciliation_code: code,
        bank_account_id: data.bankAccountId,
        period_from: new Date(data.periodFrom),
        period_to: new Date(data.periodTo),
        opening_balance: BigInt(data.openingBalance),
        closing_balance: BigInt(data.closingBalance),
        total_in: BigInt(data.totalIn),
        total_out: BigInt(data.totalOut),
        difference: BigInt(data.difference),
        matched_count: data.matchedCount || 0,
        unmatched_count: data.unmatchedCount || 0,
        notes: data.notes || '',
        created_by: actorId || null,
        status: data.difference === 0 ? 'RECONCILED' : 'DRAFT',
      },
      include: { bank_accounts: true },
    });

    return {
      ...row,
      opening_balance: Number(row.opening_balance),
      closing_balance: Number(row.closing_balance),
      total_in: Number(row.total_in),
      total_out: Number(row.total_out),
      difference: Number(row.difference),
    };
  }

  async updateFund(
    fundId: string,
    dto: {
      name?: string;
      description?: string;
      leaderName?: string;
      bankName?: string;
      accountNumber?: string;
      accountHolder?: string;
      sepayAccountId?: string;
    },
  ) {
    const existing = await this.prisma.financial_funds.findUnique({
      where: { id: fundId },
      include: { bank_accounts: true },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy quỹ');

    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE public.financial_funds ADD COLUMN IF NOT EXISTS leader_name TEXT
    `).catch(() => {});

    await this.prisma.$executeRawUnsafe(
      `UPDATE public.financial_funds
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           leader_name = COALESCE($3, leader_name),
           updated_at = NOW()
       WHERE id = $4::uuid`,
      dto.name ?? null,
      dto.description ?? null,
      dto.leaderName ?? null,
      fundId,
    );

    if (dto.accountNumber && dto.accountNumber.trim()) {
      const accNum = dto.accountNumber.trim();
      const bankName = (dto.bankName || 'Ngân hàng').trim();
      const accHolder = (dto.accountHolder || existing.name || 'CEO HN10').trim();
      const existingAcc = existing.bank_accounts?.[0];

      if (existingAcc) {
        await this.prisma.bank_accounts.update({
          where: { id: existingAcc.id },
          data: {
            bank_name: bankName,
            account_number: accNum,
            account_holder: accHolder,
            sepay_account_id: dto.sepayAccountId ?? existingAcc.sepay_account_id,
            updated_at: new Date(),
          },
        });
      } else {
        await this.prisma.bank_accounts.create({
          data: {
            fund_id: fundId,
            bank_name: bankName,
            account_number: accNum,
            account_holder: accHolder,
            sepay_account_id: dto.sepayAccountId || null,
            is_default: true,
            is_active: true,
          },
        });
      }
    }

    const updated = await this.prisma.financial_funds.findUnique({
      where: { id: fundId },
      include: { bank_accounts: true },
    });
    return {
      ...updated,
      current_balance: Number(updated?.current_balance || 0),
    };
  }
}
