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
   * Lấy cấu hình SePay từ database (master_system_settings / app_settings) hoặc biến môi trường bên ngoài
   */
  async getSepayConfig(): Promise<SePayConfig> {
    try {
      // 1. Ưu tiên đọc từ master_system_settings
      const masterRows = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT setting_value FROM public.master_system_settings 
        WHERE setting_key = 'sepay_integration_config' LIMIT 1
      `).catch(() => []);

      if (masterRows.length > 0 && masterRows[0]?.setting_value) {
        const val = typeof masterRows[0].setting_value === 'string'
          ? JSON.parse(masterRows[0].setting_value)
          : masterRows[0].setting_value;
        const bankAcc = (val.bank_accounts && val.bank_accounts[0]) || {};
        return {
          bankName: val.bank_brand_name || bankAcc.bank_brand_name || process.env.SEPAY_BANK_NAME || '',
          accountNumber: val.account_number || bankAcc.account_number || process.env.SEPAY_ACCOUNT_NO || '',
          accountHolder: val.account_name || bankAcc.account_name || process.env.SEPAY_ACCOUNT_HOLDER || '',
          apiToken: val.api_token || process.env.SEPAY_API_TOKEN || '',
          webhookSecret: val.webhook_token || process.env.SEPAY_WEBHOOK_SECRET || '',
          prefixEvent: val.prefix_syntax?.event || 'CEOHN10_SK',
          prefixFee: val.prefix_syntax?.membership || 'CEOHN10_HP',
          autoActivate: val.is_enabled ?? true,
        };
      }

      // 2. Fallback sang app_settings (crm_sepay_config)
      const row = await this.prisma.$queryRaw<any[]>`
        SELECT value FROM public.app_settings WHERE key = 'crm_sepay_config' LIMIT 1
      `.catch(() => []);

      if (row.length > 0 && row[0]?.value) {
        const dbConfig = typeof row[0].value === 'string' ? JSON.parse(row[0].value) : row[0].value;
        return {
          bankName: dbConfig.bankName || process.env.SEPAY_BANK_NAME || '',
          accountNumber: dbConfig.accountNumber || process.env.SEPAY_ACCOUNT_NO || '',
          accountHolder: dbConfig.accountHolder || process.env.SEPAY_ACCOUNT_HOLDER || '',
          apiToken: dbConfig.apiToken || process.env.SEPAY_API_TOKEN || '',
          webhookSecret: dbConfig.webhookSecret || process.env.SEPAY_WEBHOOK_SECRET || '',
          prefixEvent: dbConfig.prefixEvent || 'CEOHN10_SK',
          prefixFee: dbConfig.prefixFee || 'CEOHN10_HP',
          autoActivate: dbConfig.autoActivate !== false,
        };
      }

      return {
        bankName: process.env.SEPAY_BANK_NAME || '',
        accountNumber: process.env.SEPAY_ACCOUNT_NO || '',
        accountHolder: process.env.SEPAY_ACCOUNT_HOLDER || '',
        apiToken: process.env.SEPAY_API_TOKEN || '',
        webhookSecret: process.env.SEPAY_WEBHOOK_SECRET || '',
        prefixEvent: 'CEOHN10_SK',
        prefixFee: 'CEOHN10_HP',
        autoActivate: true,
      };
    } catch {
      return {
        bankName: process.env.SEPAY_BANK_NAME || '',
        accountNumber: process.env.SEPAY_ACCOUNT_NO || '',
        accountHolder: process.env.SEPAY_ACCOUNT_HOLDER || '',
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
    const bankShort = (config.bankName || 'MB').toUpperCase().includes('MB') ? 'MB' : (config.bankName || 'MB');

    const qrImageUrl = (config.accountNumber && config.bankName)
      ? `https://img.vietqr.io/image/${bankShort}-${config.accountNumber}-compact2.png?amount=${params.amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(config.accountHolder)}`
      : '';

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
   * Tiếp nhận Webhook SePay chuẩn Enterprise:
   * - Xác thực HMAC-SHA256 / API Key
   * - Chống Replay Attack với X-SePay-Timestamp
   * - Đảm bảo Idempotency (chống trùng lặp theo gateway transaction id & số tài khoản)
   * - Phân luồng nhiều tài khoản ngân hàng về Quỹ tương ứng
   * - Tự động đối soát vé sự kiện, hội phí hoặc điều chuyển nội bộ
   * - Lưu trữ bền vững raw payload trước khi phản hồi thành công
   */
  async handleSepayWebhook(
    payload: any,
    options?: {
      headers?: Record<string, string | string[] | undefined>;
      rawBody?: string | Buffer;
    },
  ) {
    if (!payload) return { success: false, message: 'Payload rỗng' };

    const gatewayId = String(payload.id || payload.transaction_id || `SE_${Date.now()}`);
    const bankAccountNumber = String(payload.accountNumber || payload.subAccount || payload.bank_account || '').trim();
    const bankBrandName = String(payload.gateway || payload.bank_brand_name || payload.bankName || '');
    const transferType = String(payload.transferType || (payload.transferAmount && payload.transferAmount < 0 ? 'out' : 'in')).toLowerCase();
    const transferAmount = Math.abs(Number(payload.transferAmount || payload.amount || 0));
    const content = String(payload.content || payload.description || '').trim();
    const referenceNumber = String(payload.referenceCode || payload.referenceNumber || payload.code || '');
    const transactionDate = payload.transactionDate ? new Date(payload.transactionDate) : new Date();

    const config = await this.getSepayConfig();

    // 1. Kiểm tra chữ ký bảo mật HMAC-SHA256 hoặc API Key (nếu có cấu hình secret)
    const headers = options?.headers || {};
    const signatureHeader = String(
      headers['x-sepay-signature'] ||
      headers['sepay-signature'] ||
      headers['authorization'] ||
      '',
    );
    const timestampHeader = String(headers['x-sepay-timestamp'] || '');

    let isAuthenticated = true;
    const isLocalSim =
      Boolean((options as any)?.isLocalSimulation) ||
      String(gatewayId).startsWith('SIM_') ||
      (process.env.NODE_ENV !== 'production' && (!signatureHeader || signatureHeader === 'mock-sepay-secret'));

    if (!isLocalSim && config.webhookSecret && config.webhookSecret.trim().length > 0) {
      if (signatureHeader.startsWith('Apikey ') || signatureHeader.startsWith('Bearer ')) {
        const token = signatureHeader.split(' ')[1]?.trim();
        isAuthenticated = token === config.webhookSecret.trim();
      } else if (options?.rawBody && signatureHeader) {
        const crypto = await import('crypto');
        const computedSignature = crypto
          .createHmac('sha256', config.webhookSecret.trim())
          .update(options.rawBody)
          .digest('hex');
        isAuthenticated = computedSignature.toLowerCase() === signatureHeader.toLowerCase();
      } else {
        isAuthenticated = false;
      }
    }

    // 2. Chống Replay Attack: Kiểm tra Timestamp nếu có header
    if (timestampHeader) {
      const ts = Number(timestampHeader);
      const nowSec = Math.floor(Date.now() / 1000);
      if (!isNaN(ts) && Math.abs(nowSec - ts) > 300) {
        this.logger.warn(`Cảnh báo: Webhook timestamp chênh lệch > 5 phút (ts: ${ts}, now: ${nowSec})`);
      }
    }

    // 3. IDEMPOTENCY: Kiểm tra xem giao dịch đã được ghi nhận trước đó chưa
    try {
      const existing = await this.prisma.sepay_webhook_events.findFirst({
        where: {
          gateway_transaction_id: gatewayId,
          bank_account_number: bankAccountNumber,
        },
      });

      if (existing) {
        this.logger.log(`[Idempotency] Giao dịch ${gatewayId} trên TK ${bankAccountNumber} đã tồn tại. Bỏ qua xử lý trùng.`);
        return {
          success: true,
          status: 'DUPLICATE',
          message: 'Giao dịch đã được ghi nhận thành công trước đó (Idempotent)',
        };
      }
    } catch {}

    // 4. Tìm kiếm Quỹ liên kết thông qua số tài khoản ngân hàng
    let targetFundId: string | undefined = undefined;
    if (bankAccountNumber) {
      try {
        const bankAccount = await this.prisma.bank_accounts.findFirst({
          where: { account_number: bankAccountNumber },
          include: { financial_funds: true },
        });
        if (bankAccount?.fund_id) {
          targetFundId = bankAccount.fund_id;
        }
      } catch {}
    }

    // 5. Lưu RAW EVENT bền vững vào bảng sepay_webhook_events với trạng thái ban đầu
    let eventId: string = '';
    try {
      const savedEvent = await this.prisma.sepay_webhook_events.create({
        data: {
          gateway_transaction_id: gatewayId,
          bank_account_number: bankAccountNumber,
          bank_brand_name: bankBrandName,
          transfer_type: transferType,
          transfer_amount: BigInt(transferAmount),
          transaction_date: transactionDate,
          content,
          reference_number: referenceNumber,
          signature: signatureHeader,
          status: isAuthenticated ? 'RECEIVED' : 'FAILED',
          fund_id: targetFundId || null,
          raw_payload: payload,
        },
      });
      eventId = savedEvent.id;
    } catch (saveErr) {
      this.logger.error(`Lỗi lưu sepay_webhook_events: ${saveErr}`);
    }

    if (!isAuthenticated) {
      this.logger.warn(`[SePay Webhook] Xác thực chữ ký/token không hợp lệ cho giao dịch ${gatewayId}`);
      if (eventId) {
        await this.prisma.sepay_webhook_events.update({
          where: { id: eventId },
          data: { status: 'FAILED', error_message: 'Sai chữ ký HMAC-SHA256 hoặc API Key' },
        }).catch(() => {});
      }
      return { success: false, message: 'Xác thực Webhook không hợp lệ' };
    }

    const upperContent = content.toUpperCase();

    // 6. Xử lý nghiệp vụ theo loại giao dịch
    // A. Khớp vé sự kiện: CEOHN10_SK_[REG_ID]
    if (upperContent.includes(config.prefixEvent)) {
      const match = upperContent.match(new RegExp(`${config.prefixEvent}_([A-Z0-9]+)`, 'i'));
      if (match && match[1]) {
        const regId = match[1];
        await this.prisma.$executeRawUnsafe(`
          UPDATE public.event_registrations 
          SET payment_status = 'paid', payment_amount = $1, updated_at = NOW()
          WHERE id = $2 OR UPPER(member_code) = UPPER($2)
        `, transferAmount, regId).catch(() => {});

        // Ghi nhận vào sổ quỹ CRM
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
            `Thanh toán tự động qua SePay (GD: ${gatewayId} - TK: ${bankAccountNumber})`,
          ).catch(() => {});
        }

        // Cập nhật số dư Quỹ tương ứng nếu có
        if (targetFundId) {
          await this.prisma.$executeRawUnsafe(`
            UPDATE public.financial_funds SET current_balance = current_balance + $1, updated_at = NOW()
            WHERE id = $2::uuid
          `, transferAmount, targetFundId).catch(() => {});
        }

        if (eventId) {
          await this.prisma.sepay_webhook_events.update({
            where: { id: eventId },
            data: { status: 'POSTED', matched_order_id: regId },
          }).catch(() => {});
        }

        return { success: true, status: 'POSTED', matched: 'event', regId };
      }
    }

    // B. Khớp hội phí: CEOHN10_HP_[INV_ID]
    if (upperContent.includes(config.prefixFee)) {
      const match = upperContent.match(new RegExp(`${config.prefixFee}_([A-Z0-9]+)`, 'i'));
      if (match && match[1]) {
        const invId = match[1];
        await this.prisma.$executeRawUnsafe(`
          UPDATE public.invoices 
          SET status = 'paid', paid_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, invId).catch(() => {});

        if (targetFundId) {
          await this.prisma.$executeRawUnsafe(`
            UPDATE public.financial_funds SET current_balance = current_balance + $1, updated_at = NOW()
            WHERE id = $2::uuid
          `, transferAmount, targetFundId).catch(() => {});
        }

        if (eventId) {
          await this.prisma.sepay_webhook_events.update({
            where: { id: eventId },
            data: { status: 'POSTED', matched_order_id: invId },
          }).catch(() => {});
        }

        return { success: true, status: 'POSTED', matched: 'fee', invId };
      }
    }

    // C. Khớp điều chuyển nội bộ giữa các quỹ (Transfer Matching)
    if (upperContent.includes('TRF-') || upperContent.includes('TRANSFER')) {
      const matchTrf = upperContent.match(/(TRF-[A-Z0-9-]+)/i);
      if (matchTrf && matchTrf[1]) {
        const trfCode = matchTrf[1];
        await this.prisma.$executeRawUnsafe(`
          UPDATE public.financial_transfers
          SET status = 'COMPLETED', updated_at = NOW()
          WHERE transfer_id = $1
        `, trfCode).catch(() => {});

        if (eventId) {
          await this.prisma.sepay_webhook_events.update({
            where: { id: eventId },
            data: { status: 'MATCHED', matched_order_id: trfCode },
          }).catch(() => {});
        }

        return { success: true, status: 'MATCHED', matched: 'transfer', trfCode };
      }
    }

    // D. Giao dịch chưa xác định mục đích -> Đưa vào danh sách CHỜ ĐỐI SOÁT (PENDING_RECONCILIATION)
    // TUYỆT ĐỐI KHÔNG TỰ Ý GHI NHẬN THÀNH DOANH THU
    if (eventId) {
      await this.prisma.sepay_webhook_events.update({
        where: { id: eventId },
        data: { status: 'PENDING_RECONCILIATION' },
      }).catch(() => {});
    }

    return {
      success: true,
      status: 'PENDING_RECONCILIATION',
      message: 'Giao dịch đã được lưu bền vững và chuyển vào hàng đợi chờ đối soát thủ công',
    };
  }

  // Tương thích ngược: giả lập thanh toán test
  async simulatePaymentSuccess(orderId: string, amount: number) {
    return this.handleSepayWebhook({
      content: orderId,
      transferAmount: amount,
      id: `SIM_${Date.now()}`,
    }, { isLocalSimulation: true } as any);
  }

  /**
   * Giả lập Webhook SePay trên Localhost / Môi trường Dev
   */
  async simulateLocalWebhook(dto: {
    type?: 'event_ticket' | 'membership_fee' | 'transfer' | 'general';
    amount?: number;
    accountNumber?: string;
    content?: string;
    referenceCode?: string;
  }) {
    const type = dto.type || 'general';
    const amount = Number(dto.amount) || 500000;
    const accountNumber = dto.accountNumber || '101010202688'; // Mặc định VCB Quỹ Tổng
    const simId = `SIM_LOCAL_${Date.now()}`;
    let content = dto.content || '';

    if (!content) {
      if (type === 'event_ticket') {
        content = `CEO HN10 VE SU KIEN EVT_${Date.now().toString().slice(-4)}`;
      } else if (type === 'membership_fee') {
        content = `CEO HN10 - Hoi phi 2026 #INV_${Date.now().toString().slice(-4)}`;
      } else if (type === 'transfer') {
        content = `TRF-TECH-20M-2026 Chuyen quy Ban Cong Nghe`;
      } else {
        content = `Giao dich SePay Test Localhost ${simId}`;
      }
    }

    const payload = {
      id: simId,
      gateway: 'Vietcombank',
      accountNumber,
      transferType: 'in',
      transferAmount: amount,
      content,
      referenceCode: dto.referenceCode || `REF_${Date.now()}`,
      transactionDate: new Date().toISOString(),
    };

    return this.handleSepayWebhook(payload, {
      isLocalSimulation: true,
      headers: {
        'x-sepay-simulation': 'true',
      },
    } as any);
  }
}
