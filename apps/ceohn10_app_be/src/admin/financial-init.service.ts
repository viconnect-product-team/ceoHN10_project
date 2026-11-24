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
      where: { status: { in: ['PAID', 'RECEIVED'] } },
    });

    return funds.map((f) => {
      // 1. Số dư đầu kỳ phân bổ
      const obItem = obItems.find((it) => it.fund_id === f.id);
      const obAllocated = obItem ? Number(obItem.allocated_amount) : 0;

      // 2. Tiền nhận vào từ điều chuyển
      const transferIn = transfers
        .filter((tr) => tr.destination_fund_id === f.id)
        .reduce((sum, tr) => sum + Number(tr.amount), 0);

      // 3. Tiền chuyển đi từ điều chuyển
      const transferOut = transfers
        .filter((tr) => tr.source_fund_id === f.id)
        .reduce((sum, tr) => sum + Number(tr.amount), 0);

      // 4. Tiền nhận từ SePay Webhook
      const sepayIn = sepayEvents
        .filter((ev) => ev.fund_id === f.id && ev.transfer_type === 'in')
        .reduce((sum, ev) => sum + Number(ev.transfer_amount), 0);

      // Tổng tiền Vào (Inflow)
      const totalInflow = obAllocated + transferIn + sepayIn;

      // Tổng tiền Ra (Outflow)
      const totalOutflow = transferOut;

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
          txList.push({
            id: ev.id,
            type: 'IN',
            typeName: 'SePay Webhook',
            amount: Number(ev.transfer_amount),
            date: ev.transaction_date ? ev.transaction_date.toISOString().slice(0, 10) : '2026-11-23',
            counterparty: ev.bank_brand_name || 'Ngân hàng',
            description: ev.content,
            voucherNo: ev.reference_number || ev.gateway_transaction_id,
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
}
