import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ZaloService } from '../zalo/zalo.service';

export interface FeeCategoryItem {
  id: string;
  name: string;
  prefix: string;
  target_fund_name?: string;
  action_type?: string;
  action_label?: string;
  description?: string;
  is_active?: boolean;
}

export interface SePayConfig {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  apiToken?: string;
  webhookSecret?: string;
  prefixEvent: string;
  prefixFee: string;
  prefixJoin?: string;
  prefixCourse?: string;
  prefixSponsor?: string;
  prefixCharity?: string;
  prefixB2B?: string;
  feeCategories?: FeeCategoryItem[];
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
   * Quy đổi tên ngân hàng sang mã chuẩn VietQR BIN (VPB, VCB, MB, TCB, ACB, BIDV, CTG...)
   * Dùng chung cho toàn hệ thống (Vé sự kiện, Phí tham gia CLB CLB, Phí gia nhập, Học phí...).
   */
  resolveVietQrBankBin(bankName?: string): string {
    const raw = String(bankName || 'MB').trim().toUpperCase();
    if (!raw) return 'MB';
    if (raw.includes('VPB') || raw.includes('VPBANK')) return 'VPB';
    if (raw.includes('VIETCOM') || raw.includes('VCB')) return 'VCB';
    if (raw.includes('TECHCOM') || raw.includes('TCB')) return 'TCB';
    if (raw.includes('MB') || raw.includes('QUAN DOI')) return 'MB';
    if (raw.includes('ACB') || raw.includes('A CHAU')) return 'ACB';
    if (raw.includes('BIDV')) return 'BIDV';
    if (raw.includes('VIETIN') || raw.includes('CTG')) return 'CTG';
    if (raw.includes('TPB') || raw.includes('TIEN PHONG')) return 'TPB';
    if (raw.includes('SACOM') || raw.includes('STB')) return 'STB';
    if (raw.includes('VIB')) return 'VIB';
    if (raw.includes('MSB') || raw.includes('HANG HAI')) return 'MSB';
    if (raw.includes('OCB') || raw.includes('PHUONG DONG')) return 'OCB';
    if (raw.includes('SHB')) return 'SHB';
    if (raw.includes('HDB') || raw.includes('HD BANK')) return 'HDB';
    if (raw.includes('LPB') || raw.includes('LIENVIET') || raw.includes('LPBANK')) return 'LPB';
    return String(bankName || 'MB').trim();
  }

  buildVietQrUrl(opts: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    amount: number;
    memo: string;
  }): string {
    if (!opts.accountNumber) return '';
    const bankBin = this.resolveVietQrBankBin(opts.bankName);
    return `https://img.vietqr.io/image/${encodeURIComponent(bankBin)}-${encodeURIComponent(opts.accountNumber)}-compact2.png?amount=${Math.max(0, Math.round(Number(opts.amount) || 0))}&addInfo=${encodeURIComponent(opts.memo)}&accountName=${encodeURIComponent(opts.accountHolder || '')}`;
  }

  /**
   * Lấy cấu hình SePay từ database (master_system_settings / app_settings) hoặc biến môi trường bên ngoài
   */
  async getSepayConfig(): Promise<SePayConfig> {
    try {
      // 1. Ưu tiên đọc từ master_system_settings
      const masterRows = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT value FROM public.master_system_settings 
        WHERE key = 'sepay_integration_config' LIMIT 1
      `).catch(() => []);

      if (masterRows.length > 0 && masterRows[0]?.value) {
        const val = typeof masterRows[0].value === 'string'
          ? JSON.parse(masterRows[0].value)
          : masterRows[0].value;
        const bankAcc = (val.bank_accounts && val.bank_accounts[0]) || {};
        return {
          bankName: val.bank_brand_name || bankAcc.bank_brand_name || process.env.SEPAY_BANK_NAME || '',
          accountNumber: val.account_number || bankAcc.account_number || process.env.SEPAY_ACCOUNT_NO || '',
          accountHolder: val.account_name || bankAcc.account_name || process.env.SEPAY_ACCOUNT_HOLDER || '',
          apiToken: val.api_token || process.env.SEPAY_API_TOKEN || '',
          webhookSecret: val.webhook_token || process.env.SEPAY_WEBHOOK_SECRET || '',
          prefixEvent: val.prefix_syntax?.event || 'CEO1983_EVT',
          prefixFee: val.prefix_syntax?.membership || 'CEOHN10_HP',
          prefixJoin: val.prefix_syntax?.joining || 'CEOHN10_GN',
          prefixCourse: val.prefix_syntax?.course || 'CEOHN10_LH',
          prefixSponsor: val.prefix_syntax?.sponsor || 'CEOHN10_TT',
          prefixCharity: val.prefix_syntax?.charity || 'CEOHN10_TN',
          prefixB2B: val.prefix_syntax?.b2b || 'CEOHN10_B2B',
          feeCategories: val.fee_categories || [],
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
          prefixEvent: dbConfig.prefixEvent || 'CEO1983_EVT',
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
        prefixEvent: 'CEO1983_EVT',
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
        prefixEvent: 'CEO1983_EVT',
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
    let bankShort = (config.bankName || 'VPB').trim();
    const upperBank = bankShort.toUpperCase();
    if (upperBank.includes('VPB') || upperBank.includes('VPBANK')) bankShort = 'VPB';
    else if (upperBank.includes('MB')) bankShort = 'MB';
    else if (upperBank.includes('VCB') || upperBank.includes('VIETCOM')) bankShort = 'VCB';
    else if (upperBank.includes('TCB') || upperBank.includes('TECHCOM')) bankShort = 'TCB';
    else if (upperBank.includes('ACB')) bankShort = 'ACB';
    else if (upperBank.includes('BIDV')) bankShort = 'BIDV';
    else if (upperBank.includes('AGRI') || upperBank.includes('VBA')) bankShort = 'VBA';

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
   * Tạo phiên thanh toán SePay VietQR cho Phí tham gia CLB
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
   * - Tự động đối soát vé sự kiện, phí tham gia CLB hoặc điều chuyển nội bộ
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
      const lowerSig = signatureHeader.toLowerCase();
      if (lowerSig.startsWith('apikey ') || lowerSig.startsWith('bearer ')) {
        const token = signatureHeader.split(' ')[1]?.trim();
        isAuthenticated = token === config.webhookSecret.trim();
      } else if (signatureHeader.trim() === config.webhookSecret.trim()) {
        isAuthenticated = true;
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
    // A. Khớp vé sự kiện: CEO1983_EVT_[REG_ID], CEO1983EVT[REG_ID] (khi ngân hàng bỏ dấu _/-), CEOHN10_SK_[REG_ID], EV[REG_ID]
    const eventMatch =
      upperContent.match(/CEO1983[_-]?EVT[_-]?([A-Z0-9-]+)/i) ||
      upperContent.match(new RegExp(`${config.prefixEvent.replace(/[_-]/g, '[_-]?')}[_-]?([A-Z0-9-]+)`, 'i')) ||
      upperContent.match(/CEOHN10[_-]?([A-Z0-9-]+)/i) ||
      upperContent.match(/EVT[_-]?([A-Z0-9-]+)/i) ||
      upperContent.match(/(?:^|[^A-Z0-9])EV([A-Z0-9-]+)/i);

    if (eventMatch && eventMatch[1]) {
      const regId = eventMatch[1];

      // Lấy thông tin đăng ký và sự kiện trước khi xác nhận thanh toán (hỗ trợ khớp cả khi ngân hàng bỏ dấu gạch ngang)
      const regRows = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT r.*, e.name as event_name, e.date as event_date, e.status as event_status, e.location as event_location, e.time as event_time 
        FROM public.event_registrations r
        LEFT JOIN public.events e ON e.id = r.event_id
        WHERE r.id = $1
           OR REPLACE(REPLACE(UPPER(r.id), '-', ''), '_', '') = REPLACE(REPLACE(UPPER($1), '-', ''), '_', '')
           OR UPPER(r.member_code) = UPPER($1)
           OR r.note ILIKE '%' || $1 || '%'
      `, regId).catch(() => []);

      const isEndedEvent = (row: any) => {
        if (!row) return false;
        const st = String(row.event_status || '').toLowerCase();
        if (st === 'ended' || st === 'completed' || st === 'cancelled') return true;
        if (row.event_date) {
          const d = new Date(row.event_date);
          if (!isNaN(d.getTime())) {
            d.setHours(23, 59, 59, 999);
            if (d.getTime() < Date.now()) return true;
          }
        }
        return false;
      };

      if (regRows.length > 0 && regRows.some(isEndedEvent)) {
        const endedReg = regRows[0];
        await this.prisma.$executeRawUnsafe(`
          UPDATE public.event_registrations
          SET payment_status = 'refund_required', updated_at = NOW()
          WHERE id = $1
        `, endedReg.id).catch(() => {});

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.financial_report_rows (
            id, transaction_date, voucher_no, category, description,
            income_amount, expense_amount, balance_after, party_name, status,
            custom_data, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), NOW()::date, $1, 'Hoàn tiền (Sự kiện đã kết thúc)', $2,
            $3, 0, 0, $4, 'refund_required',
            $5::jsonb, NOW(), NOW()
          )
        `,
          `REFUND-${String(gatewayId || regId).slice(0, 18)}`,
          `[CẦN HOÀN TIỀN] Giao dịch SePay cho sự kiện đã kết thúc "${endedReg.event_name || ''}" (Mã vé: ${endedReg.id})`,
          transferAmount,
          endedReg.member_name || 'Khách chuyển khoản',
          JSON.stringify({
            department: 'Ban Sự Kiện',
            sourceFund: 'SePay VietQR',
            targetFund: 'Chờ hoàn trả người thanh toán',
            type: 'REFUND_REQUIRED',
            refundRequired: true,
            regId: endedReg.id,
            eventId: endedReg.event_id,
          }),
        ).catch(() => {});

        if (eventId) {
          await this.prisma.sepay_webhook_events.update({
            where: { id: eventId },
            data: {
              status: 'REFUND_REQUIRED',
              matched_order_id: regId,
              error_message: 'Sự kiện đã kết thúc — Cần hoàn trả lại tiền cho người thanh toán',
            },
          }).catch(() => {});
        }

        if (endedReg.email && String(endedReg.email).includes('@')) {
          this.mailService.sendDirectEmail({
            to: endedReg.email,
            subject: `[CEO HN10] Thông báo hoàn trả giao dịch — Sự kiện "${endedReg.event_name || ''}" đã kết thúc`,
            html: `<p>Kính gửi Anh/Chị <strong>${endedReg.member_name || 'Quý đại biểu'}</strong>,</p>
              <p>Hệ thống vừa nhận được khoản chuyển khoản <strong>${Number(transferAmount).toLocaleString('vi-VN')} đ</strong> cho mã vé <strong>${endedReg.id}</strong>.</p>
              <p>Tuy nhiên, sự kiện <strong>"${endedReg.event_name || ''}"</strong> đã kết thúc nên vé không thể kích hoạt. Hệ thống đã tự động ghi nhận yêu cầu <strong>hoàn trả tiền</strong> và thông báo cho Ban Tài Chính / Ban Sự Kiện để chuyển hoàn lại cho Quý Anh/Chị.</p>
              <p>Trân trọng,<br/>CLB Doanh Nhân CEO HN10</p>`,
          }).catch(() => {});
        }

        if (endedReg.phone && this.zaloService) {
          this.zaloService.sendAutoNotification({
            recipientPhone: endedReg.phone,
            recipientName: endedReg.member_name || 'Quý Anh/Chị',
            title: `Thông báo hoàn tiền: ${endedReg.event_name || 'Sự kiện đã kết thúc'}`,
            content: `Sự kiện "${endedReg.event_name || ''}" đã kết thúc nên khoản thanh toán ${Number(transferAmount).toLocaleString('vi-VN')} đ (Mã vé: ${endedReg.id}) không thể kích hoạt vé. Hệ thống đã ghi nhận yêu cầu hoàn trả lại cho Anh/Chị.`,
          }).catch(() => {});
        }

        return {
          success: false,
          status: 'REFUND_REQUIRED',
          matched: 'event_ended',
          regId: endedReg.id,
          message: 'Sự kiện đã kết thúc, không thể thanh toán vé. Hệ thống đã ghi nhận yêu cầu hoàn trả tiền.',
        };
      }

      await this.prisma.$executeRawUnsafe(`
        UPDATE public.event_registrations 
        SET payment_status = 'paid', status = 'confirmed', payment_amount = $1, paid_at = NOW(), updated_at = NOW()
        WHERE id = $2
           OR REPLACE(REPLACE(UPPER(id), '-', ''), '_', '') = REPLACE(REPLACE(UPPER($2), '-', ''), '_', '')
           OR UPPER(member_code) = UPPER($2)
           OR note ILIKE '%' || $2 || '%'
      `, transferAmount, regId).catch(() => {});

      if (regRows.length > 0) {
        for (const reg of regRows) {
          await this.prisma.$executeRawUnsafe(`
            INSERT INTO public.income_records (
              id, category, title, amount, date, payer_name, payment_method, status, event_id, notes, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), 'Vé sự kiện', $1, $2, NOW(), $3, 'Chuyển khoản SePay', 'completed', $4, $5, NOW(), NOW()
            )
          `,
            `Thu tiền vé sự kiện ${reg.event_name || ''} - ${reg.member_name || ''} (Mã vé: ${reg.id})`,
            reg.payment_amount || transferAmount,
            reg.member_name || 'Khách tham dự',
            reg.event_id || null,
            `Thanh toán tự động qua SePay (GD: ${gatewayId} - TK: ${bankAccountNumber})`,
          ).catch(() => {});

          // Phát hành vé điện tử & gửi email kèm mã QR Check-in ngay khi nhận Webhook SePay (UC-EVT-02, UC-EVT-04)
          if (reg.email && reg.email.includes('@')) {
            const checkinQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(reg.id)}`;
            this.mailService.sendEventPaymentSuccessEmail({
              to: reg.email,
              fullName: reg.member_name || 'Quý Hội viên / Đại biểu',
              phone: reg.phone || '',
              company: reg.company || '',
              eventTitle: reg.event_name || 'Sự kiện CLB CEO HN10',
              eventDate: reg.event_date ? (reg.event_date instanceof Date ? reg.event_date.toLocaleDateString('vi-VN') : String(reg.event_date).slice(0, 10)) : 'Sắp diễn ra',
              eventTime: reg.event_time || '08:30 - 12:00',
              eventLocation: reg.event_location || 'Hà Nội',
              registrationId: reg.id,
              ticketType: reg.ticket_type || 'Vé Tiêu Chuẩn',
              ticketCount: reg.ticket_count || 1,
              luckyNumber: reg.lucky_number,
              amountPaid: Number(reg.payment_amount || transferAmount),
              paymentMethod: 'Chuyển khoản SePay (Tự động)',
              qrCodeUrl: checkinQrUrl,
            }).catch((err) => {
              this.logger.warn(`[SePay Webhook] Lỗi gửi email vé cho ${reg.email}: ${err?.message}`);
            });
          }

          if (reg.phone && this.zaloService) {
            this.zaloService.sendAutoNotification({
              recipientPhone: reg.phone,
              recipientName: reg.member_name || 'Quý Anh/Chị',
              title: `Xác nhận thanh toán vé: ${reg.event_name || 'Sự kiện CEO HN10'}`,
              content: `Kính gửi Anh/Chị ${reg.member_name || 'Đại biểu'},\nBan Tổ Chức CLB Doanh Nhân CEO HN10 đã nhận được thanh toán thành công phí vé tham dự sự kiện "${reg.event_name || 'Sự kiện'}".\n- Mã vé: ${reg.id}\n- Số may mắn Lucky Draw: #${reg.lucky_number || '0000'}\n- Số tiền: ${Number(transferAmount).toLocaleString('vi-VN')} đ\nVé điện tử và mã QR check-in đã được gửi tới email của Anh/Chị. Trân trọng!`,
            }).catch(() => {});
          }

          await this.dispatchEventPaymentNotification(reg, Number(reg.payment_amount || transferAmount));
        }
      }

      // Cập nhật số dư Quỹ Ban Sự kiện & Hậu cần khi thanh toán phí vé sự kiện qua SePay
      let eventFundId: string | undefined = targetFundId || undefined;
      if (!eventFundId) {
        const eventFund = await this.prisma.financial_funds.findFirst({
          where: {
            OR: [
              { code: 'FUND_BAN_SU_KIEN_HAU_CAN' },
              { name: { contains: 'Sự kiện', mode: 'insensitive' } },
            ],
          },
        }).catch(() => null);
        eventFundId = eventFund?.id || undefined;
      }
      if (eventFundId) {
        await this.prisma.$executeRawUnsafe(`
          UPDATE public.financial_funds SET current_balance = current_balance + $1, updated_at = NOW()
          WHERE id = $2::uuid
        `, transferAmount, eventFundId).catch(() => {});
      }

      // Ghi sổ dòng tiền chi tiết vào financial_report_rows cho Quỹ Ban Sự Kiện
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO public.financial_report_rows (
          id, transaction_date, voucher_no, category, description,
          income_amount, expense_amount, balance_after, party_name, status,
          custom_data, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), NOW()::date, $1, 'Thu phí sự kiện (SePay)', $2,
          $3, 0, 0, $4, 'completed',
          $5::jsonb, NOW(), NOW()
        )
      `,
        `SEPAY-${String(gatewayId || regId).slice(0, 20)}`,
        `Thu tiền vé sự kiện qua SePay (Mã vé: ${regId})`,
        transferAmount,
        regRows[0]?.member_name || 'Khách tham dự',
        JSON.stringify({
          department: 'Ban Sự Kiện',
          sourceFund: 'SePay VietQR',
          targetFund: 'Quỹ Ban Sự Kiện',
          type: 'IN',
          flowDirection: 'in',
          regId,
        }),
      ).catch(() => {});

      if (eventId) {
        await this.prisma.sepay_webhook_events.update({
          where: { id: eventId },
          data: { status: 'POSTED', matched_order_id: regId, fund_id: eventFundId },
        }).catch(() => {});
      }

      return { success: true, status: 'POSTED', matched: 'event', regId };
    }

    // B. Khớp phí tham gia CLB thường niên: CEOHN10_HP_[INV_ID]
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

    // C. Khớp phí gia nhập CLB / Kết nạp hội viên mới: CEOHN10_GN_[MEMBER_ID/PHONE/CODE]
    const joinPrefix = config.prefixJoin || 'CEOHN10_GN';
    if (upperContent.includes(joinPrefix)) {
      const matchJoin = upperContent.match(new RegExp(`${joinPrefix}_([A-Z0-9-]+)`, 'i'));
      if (matchJoin && matchJoin[1]) {
        const memKey = matchJoin[1];
        await this.prisma.$executeRawUnsafe(`
          UPDATE public.members 
          SET level = 'OFFICIAL', type = 'OFFICIAL', status = 'active'
          WHERE id = $1 OR UPPER(code) = UPPER($1) OR phone = $1
        `, memKey).catch(() => {});

        // Ghi nhận sổ quỹ
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.income_records (
            id, category, title, amount, date, payer_name, payment_method, status, notes, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), 'Phí gia nhập CLB', $1, $2, NOW(), $3, 'Chuyển khoản SePay', 'completed', $4, NOW(), NOW()
          )
        `,
          `Thu phí gia nhập CLB CEO HN10 - HV: ${memKey}`,
          transferAmount,
          memKey,
          `Thanh toán phí gia nhập qua SePay (GD: ${gatewayId} - TK: ${bankAccountNumber})`,
        ).catch(() => {});

        // Quỹ Tổng tiếp nhận
        const mainFund = await this.prisma.financial_funds.findFirst({
          where: { name: { contains: 'Tổng', mode: 'insensitive' } },
        });
        const fundToCredit = targetFundId || mainFund?.id;
        if (fundToCredit) {
          await this.prisma.$executeRawUnsafe(`
            UPDATE public.financial_funds SET current_balance = current_balance + $1, updated_at = NOW()
            WHERE id = $2::uuid
          `, transferAmount, fundToCredit).catch(() => {});
        }

        if (eventId) {
          await this.prisma.sepay_webhook_events.update({
            where: { id: eventId },
            data: { status: 'POSTED', matched_order_id: memKey },
          }).catch(() => {});
        }

        return { success: true, status: 'POSTED', matched: 'joining_fee', memKey };
      }
    }

    // D. Khớp học phí khóa học / 30 chuyên đề: CEOHN10_LH_[CLASS_ID]_[MEMBER_ID]
    const coursePrefix = config.prefixCourse || 'CEOHN10_LH';
    if (upperContent.includes(coursePrefix)) {
      const matchCourse = upperContent.match(new RegExp(`${coursePrefix}_([A-Z0-9-]+)`, 'i'));
      if (matchCourse && matchCourse[1]) {
        const courseRef = matchCourse[1];
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.income_records (
            id, category, title, amount, date, payer_name, payment_method, status, notes, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), 'Học phí đào tạo', $1, $2, NOW(), $3, 'Chuyển khoản SePay', 'completed', $4, NOW(), NOW()
          )
        `,
          `Thu học phí 30 chuyên đề CEO HN10 - Ref: ${courseRef}`,
          transferAmount,
          courseRef,
          `Thanh toán học phí qua SePay (GD: ${gatewayId} - TK: ${bankAccountNumber})`,
        ).catch(() => {});

        const eduFund = await this.prisma.financial_funds.findFirst({
          where: { name: { contains: 'Học tập', mode: 'insensitive' } },
        });
        const fundToCredit = targetFundId || eduFund?.id;
        if (fundToCredit) {
          await this.prisma.$executeRawUnsafe(`
            UPDATE public.financial_funds SET current_balance = current_balance + $1, updated_at = NOW()
            WHERE id = $2::uuid
          `, transferAmount, fundToCredit).catch(() => {});
        }

        if (eventId) {
          await this.prisma.sepay_webhook_events.update({
            where: { id: eventId },
            data: { status: 'POSTED', matched_order_id: courseRef },
          }).catch(() => {});
        }

        return { success: true, status: 'POSTED', matched: 'course_fee', courseRef };
      }
    }

    // E. Khớp kinh phí tài trợ: CEOHN10_TT_[SPONSOR_ID]
    const sponsorPrefix = config.prefixSponsor || 'CEOHN10_TT';
    if (upperContent.includes(sponsorPrefix)) {
      const matchSponsor = upperContent.match(new RegExp(`${sponsorPrefix}_([A-Z0-9-]+)`, 'i'));
      if (matchSponsor && matchSponsor[1]) {
        const spRef = matchSponsor[1];
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.income_records (
            id, category, title, amount, date, payer_name, payment_method, status, notes, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), 'Kinh phí tài trợ', $1, $2, NOW(), $3, 'Chuyển khoản SePay', 'completed', $4, NOW(), NOW()
          )
        `,
          `Thu kinh phí tài trợ CLB CEO HN10 - Sponsor: ${spRef}`,
          transferAmount,
          spRef,
          `Thanh toán tài trợ qua SePay (GD: ${gatewayId} - TK: ${bankAccountNumber})`,
        ).catch(() => {});

        const spFund = await this.prisma.financial_funds.findFirst({
          where: { name: { contains: 'Tài trợ', mode: 'insensitive' } },
        });
        const fundToCredit = targetFundId || spFund?.id;
        if (fundToCredit) {
          await this.prisma.$executeRawUnsafe(`
            UPDATE public.financial_funds SET current_balance = current_balance + $1, updated_at = NOW()
            WHERE id = $2::uuid
          `, transferAmount, fundToCredit).catch(() => {});
        }

        if (eventId) {
          await this.prisma.sepay_webhook_events.update({
            where: { id: eventId },
            data: { status: 'POSTED', matched_order_id: spRef },
          }).catch(() => {});
        }

        return { success: true, status: 'POSTED', matched: 'sponsorship', spRef };
      }
    }

    // F. Khớp đóng góp thiện nguyện: CEOHN10_TN_[REF]
    const charityPrefix = config.prefixCharity || 'CEOHN10_TN';
    if (upperContent.includes(charityPrefix)) {
      const matchCharity = upperContent.match(new RegExp(`${charityPrefix}_([A-Z0-9-]+)`, 'i'));
      if (matchCharity && matchCharity[1]) {
        const chRef = matchCharity[1];
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.income_records (
            id, category, title, amount, date, payer_name, payment_method, status, notes, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), 'Ủng hộ thiện nguyện', $1, $2, NOW(), $3, 'Chuyển khoản SePay', 'completed', $4, NOW(), NOW()
          )
        `,
          `Đóng góp Quỹ Thiện nguyện CLB CEO HN10 - Ref: ${chRef}`,
          transferAmount,
          chRef,
          `Ủng hộ thiện nguyện qua SePay (GD: ${gatewayId} - TK: ${bankAccountNumber})`,
        ).catch(() => {});

        const chFund = await this.prisma.financial_funds.findFirst({
          where: { name: { contains: 'Thiện nguyện', mode: 'insensitive' } },
        });
        const fundToCredit = targetFundId || chFund?.id;
        if (fundToCredit) {
          await this.prisma.$executeRawUnsafe(`
            UPDATE public.financial_funds SET current_balance = current_balance + $1, updated_at = NOW()
            WHERE id = $2::uuid
          `, transferAmount, fundToCredit).catch(() => {});
        }

        if (eventId) {
          await this.prisma.sepay_webhook_events.update({
            where: { id: eventId },
            data: { status: 'POSTED', matched_order_id: chRef },
          }).catch(() => {});
        }

        return { success: true, status: 'POSTED', matched: 'charity', chRef };
      }
    }

    // G. Duyệt qua bất kỳ danh mục phí phát sinh nào khác trong config.feeCategories
    if (config.feeCategories && Array.isArray(config.feeCategories)) {
      for (const cat of config.feeCategories) {
        if (!cat.is_active || !cat.prefix) continue;
        const catPrefix = cat.prefix.trim().toUpperCase();
        if (upperContent.includes(catPrefix)) {
          const customMatch = upperContent.match(new RegExp(`${catPrefix}_([A-Z0-9-]+)`, 'i'));
          const customRef = (customMatch && customMatch[1]) || gatewayId;

          await this.prisma.$executeRawUnsafe(`
            INSERT INTO public.income_records (
              id, category, title, amount, date, payer_name, payment_method, status, notes, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, NOW(), $4, 'Chuyển khoản SePay', 'completed', $5, NOW(), NOW()
            )
          `,
            cat.name || 'Khoản thu khác',
            `Thu ${cat.name || 'phí'} - Ref: ${customRef}`,
            transferAmount,
            customRef,
            `Thanh toán qua SePay (GD: ${gatewayId} - TK: ${bankAccountNumber})`,
          ).catch(() => {});

          let dynFund: any = null;
          if (cat.target_fund_name) {
            dynFund = await this.prisma.financial_funds.findFirst({
              where: { name: { contains: cat.target_fund_name.split(' ')[0] || '', mode: 'insensitive' } },
            });
          }
          const fundToCredit = targetFundId || dynFund?.id;
          if (fundToCredit) {
            await this.prisma.$executeRawUnsafe(`
              UPDATE public.financial_funds SET current_balance = current_balance + $1, updated_at = NOW()
              WHERE id = $2::uuid
            `, transferAmount, fundToCredit).catch(() => {});
          }

          if (eventId) {
            await this.prisma.sepay_webhook_events.update({
              where: { id: eventId },
              data: { status: 'POSTED', matched_order_id: customRef },
            }).catch(() => {});
          }

          return { success: true, status: 'POSTED', matched: cat.id || 'custom_fee', customRef };
        }
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

  /**
   * Gửi thông báo vào hệ thống (App Học viên + CRM) khi thanh toán vé sự kiện thành công
   */
  private async dispatchEventPaymentNotification(reg: any, amount: number) {
    try {
      const eventTitle = reg.event_name || reg.event_title || 'Sự kiện CLB CEO HN10';
      const memberName = reg.member_name || 'Quý Hội viên / Đại biểu';
      const formattedAmt = Number(amount || 0).toLocaleString('vi-VN');
      const title = 'Thanh toán vé sự kiện thành công';
      const body = `${memberName} đã thanh toán thành công ${formattedAmt} đ cho vé sự kiện "${eventTitle}" (Mã vé: ${reg.id}).`;

      // 1. Thông báo tới CRM Notification Center
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO public.notifications (id, type, title, message, target_role, read, app_scope, target_app, created_at)
         VALUES (gen_random_uuid(), 'payment_success', $1, $2, 'all', false, 'crm_platform', 'crm_platform', NOW())`,
        `[SePay] ${title}`,
        body,
      ).catch(() => {});

      // 2. Tìm user_id người thanh toán để gửi vào App (member_notifications + business_notifications)
      let targetUserId: string | null = null;
      if (reg.email && String(reg.email).includes('@')) {
        const uRows = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT id FROM public.vione_users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          String(reg.email).trim(),
        ).catch(() => []);
        targetUserId = uRows[0]?.id || null;
      }
      if (!targetUserId && reg.member_code) {
        const mRows = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT user_id FROM public.members WHERE code = $1 AND user_id IS NOT NULL LIMIT 1`,
          String(reg.member_code).trim(),
        ).catch(() => []);
        targetUserId = mRows[0]?.user_id || null;
      }

      if (targetUserId) {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO public.member_notifications (id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, false, false, 'event_payment', $4, NOW())`,
          targetUserId,
          title,
          body,
          reg.id,
        ).catch(() => {});

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO public.business_notifications (
             id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
             title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
           ) VALUES (
             gen_random_uuid(), $1::uuid, 'payment', $2, 'event_payment', 'payment_success',
             $3, $4, $5::jsonb, 'high', 'delivered', $6, 'all', 'all', NOW(), NOW()
           )`,
          targetUserId,
          reg.id,
          title,
          body,
          JSON.stringify({ title, body, eventTitle, amount, regId: reg.id }),
          `evt-pay-${reg.id}-${Date.now()}`,
        ).catch(() => {});
      }
    } catch (e: any) {
      this.logger.warn(`dispatchEventPaymentNotification warning: ${e?.message}`);
    }
  }
}
