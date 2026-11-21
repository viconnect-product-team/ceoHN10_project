import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ZaloService } from '../zalo/zalo.service';

export interface SePayConfig {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  apiToken?: string;
  webhookSecret?: string;
  prefixEvent: string;
  prefixFee: string;
  autoActivate: boolean;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly zaloService?: ZaloService,
  ) { }

  /**
   * Lấy cấu hình SePay từ database (app_settings) hoặc biến môi trường bên ngoài
   */
  async getSepayConfig(): Promise<SePayConfig> {
    try {
      const row = await this.prisma.$queryRaw<any[]>`
        SELECT value FROM public.app_settings WHERE key = 'crm_sepay_config' LIMIT 1
      `.catch(() => []);

      const dbConfig = row.length > 0 && row[0]?.value ? row[0].value : {};

      return {
        bankName: dbConfig.bankName || process.env.SEPAY_BANK_NAME || 'MBBank',
        accountNumber: dbConfig.accountNumber || process.env.SEPAY_ACCOUNT_NO || '198300000000',
        accountHolder: dbConfig.accountHolder || process.env.SEPAY_ACCOUNT_HOLDER || 'CLB DOANH NHAN CEO HN10',
        apiToken: dbConfig.apiToken || process.env.SEPAY_API_TOKEN || '',
        webhookSecret: dbConfig.webhookSecret || process.env.SEPAY_WEBHOOK_SECRET || '',
        prefixEvent: dbConfig.prefixEvent || 'CEOHN10_SK',
        prefixFee: dbConfig.prefixFee || 'CEOHN10_HP',
        autoActivate: dbConfig.autoActivate !== false,
      };
    } catch {
      return {
        bankName: process.env.SEPAY_BANK_NAME || 'MBBank',
        accountNumber: process.env.SEPAY_ACCOUNT_NO || '198300000000',
        accountHolder: process.env.SEPAY_ACCOUNT_HOLDER || 'CLB DOANH NHAN CEO HN10',
        apiToken: process.env.SEPAY_API_TOKEN || '',
        webhookSecret: process.env.SEPAY_WEBHOOK_SECRET || '',
        prefixEvent: 'CEOHN10_SK',
        prefixFee: 'CEOHN10_HP',
        autoActivate: true,
      };
    }
  }

  /**
   * Tạo phiên thanh toán SePay VietQR động
   */
  async createSepayCheckout(params: {
    orderId: string;
    amount: number;
    description: string;
    type?: 'event' | 'fee';
  }) {
    if (!params.amount || params.amount <= 0) {
      throw new HttpException('Số tiền thanh toán không hợp lệ', HttpStatus.BAD_REQUEST);
    }

    const config = await this.getSepayConfig();
    const memo = `${params.type === 'event' ? config.prefixEvent : config.prefixFee}_${params.orderId}`.replace(/[^A-Za-z0-9_]/g, '');
    const bankShort = config.bankName.toUpperCase().includes('MB') ? 'MB' : config.bankName;

    const qrImageUrl = `https://img.vietqr.io/image/${bankShort}-${config.accountNumber}-compact2.png?amount=${params.amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(config.accountHolder)}`;

    return {
      success: true,
      method: 'SEPAY_VIETQR',
      orderId: params.orderId,
      amount: params.amount,
      qrImageUrl,
      paymentUrl: qrImageUrl,
      bankAccount: {
        bankName: config.bankName,
        accountNumber: config.accountNumber,
        accountHolder: config.accountHolder,
        transferMemo: memo,
      },
    };
  }

  /**
   * Tạo phiên thanh toán SePay VietQR cho Đăng ký sự kiện
   */
  async createEventCheckout(data: {
    registrationId: string;
    eventId: string;
    amount: number;
    memberName?: string;
    memberCode?: string;
    clientIp?: string;
  }) {
    const { registrationId, amount, memberName } = data;
    const cleanRegId = String(registrationId || '').trim();

    return this.createSepayCheckout({
      orderId: cleanRegId,
      amount,
      description: `CEO HN10 - Ve su kien #${cleanRegId}${memberName ? ` - ${memberName}` : ''}`,
      type: 'event',
    });
  }

  /**
   * Tạo phiên thanh toán SePay VietQR cho Hội phí
   */
  async createFeeCheckout(data: {
    invoiceId: string;
    memberId?: string;
    amount: number;
    year?: number;
    memberName?: string;
    clientIp?: string;
  }) {
    const { invoiceId, amount, year, memberName } = data;
    const cleanInvId = String(invoiceId || '').trim();

    return this.createSepayCheckout({
      orderId: cleanInvId,
      amount,
      description: `CEO HN10 - Hoi phi ${year || new Date().getFullYear()} #${cleanInvId}${memberName ? ` - ${memberName}` : ''}`,
      type: 'fee',
    });
  }

  /**
   * Tiếp nhận Webhook SePay tự động khi có tiền về tài khoản ngân hàng
   */
  async handleSepayWebhook(payload: any) {
    this.logger.log(`Received SePay Webhook: ${JSON.stringify(payload)}`);
    if (!payload) return { success: false, message: 'Payload rỗng' };

    const content = String(payload.content || payload.description || '').toUpperCase();
    const transferAmount = Number(payload.transferAmount || payload.amount || 0);

    const config = await this.getSepayConfig();

    // 1. Khớp mã sự kiện: CEOHN10_SK_[REG_ID]
    if (content.includes(config.prefixEvent)) {
      const match = content.match(new RegExp(`${config.prefixEvent}_([A-Z0-9]+)`, 'i'));
      if (match && match[1]) {
        const regId = match[1];
        await this.prisma.$executeRawUnsafe(`
          UPDATE public.event_registrations 
          SET payment_status = 'paid', payment_amount = $1, updated_at = NOW()
          WHERE id = $2 OR UPPER(member_code) = UPPER($2)
        `, transferAmount, regId).catch(() => {});

        // Lấy thông tin vé để ghi nhận vào Quỹ tài chính CRM
        const regRows = await this.prisma.$queryRawUnsafe<any[]>(`
          SELECT r.*, e.name as event_name FROM public.event_registrations r
          LEFT JOIN public.events e ON e.id = r.event_id
          WHERE r.id = $1 LIMIT 1
        `, regId).catch(() => []);

        if (regRows.length > 0) {
          const reg = regRows[0];
          await this.prisma.$executeRawUnsafe(`
            INSERT INTO public.income_records (
              id, category, title, amount, date, payer_name, payment_method, status, event_id, notes, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), 'Vé sự kiện', $1, $2, NOW(), $3, 'Chuyển khoản SePay', 'completed', $4, $5, NOW(), NOW()
            )
          `,
            `Thu tiền vé sự kiện ${reg.event_name || ''} - ${reg.member_name || ''} (Mã vé: ${reg.id})`,
            transferAmount,
            reg.member_name || 'Khách tham dự',
            reg.event_id || null,
            `Thanh toán tự động qua SePay (GD: ${payload.id || ''})`,
          ).catch(() => {});
        }

        return { success: true, matched: 'event', regId };
      }
    }

    // 2. Khớp mã hội phí: CEOHN10_HP_[INV_ID]
    if (content.includes(config.prefixFee)) {
      const match = content.match(new RegExp(`${config.prefixFee}_([A-Z0-9]+)`, 'i'));
      if (match && match[1]) {
        const invId = match[1];
        await this.prisma.$executeRawUnsafe(`
          UPDATE public.invoices 
          SET status = 'paid', paid_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, invId).catch(() => {});

        return { success: true, matched: 'fee', invId };
      }
    }

    return { success: true, matched: 'unmatched', content };
  }

  // Tương thích ngược: giả lập thanh toán test
  async simulatePaymentSuccess(orderId: string, amount: number) {
    return this.handleSepayWebhook({
      content: orderId,
      transferAmount: amount,
      id: `SIM_${Date.now()}`,
    });
  }
}
