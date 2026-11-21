/**
 * 46 — Design Pattern Pragmatism: ADAPTER PATTERN
 * Phục vụ Kịch bản: Tích hợp hệ thống thanh toán tự động SePay VietQR
 * ĐÃ LOẠI BỎ HOÀN TOÀN VNPAY/MOMO.
 */

export interface CreateSePayQrParams {
  amount: number;
  orderInfo: string;
  orderId: string;
  clientIp?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export interface IPaymentGatewayAdapter {
  readonly gatewayName: string;
  createCheckoutUrl(params: CreateSePayQrParams): string;
  verifyReturn(params: Record<string, string>): {
    isValid: boolean;
    orderId: string;
    amount: number;
    transactionNo: string;
  };
}

export class SePayAdapter implements IPaymentGatewayAdapter {
  readonly gatewayName = 'SEPAY';

  private readonly bankName: string;
  private readonly accountNumber: string;
  private readonly accountHolder: string;

  constructor(config?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  }) {
    this.bankName = config?.bankName || process.env.SEPAY_BANK_NAME || 'MB';
    this.accountNumber = config?.accountNumber || process.env.SEPAY_ACCOUNT_NO || '198300000000';
    this.accountHolder = config?.accountHolder || process.env.SEPAY_ACCOUNT_HOLDER || 'CLB DOANH NHAN CEO HN10';
  }

  createCheckoutUrl(params: CreateSePayQrParams): string {
    const memo = `CEOHN10 ${params.orderId}`;
    return `https://img.vietqr.io/image/${this.bankName}-${this.accountNumber}-compact2.png?amount=${params.amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(this.accountHolder)}`;
  }

  verifyReturn(params: Record<string, string>): {
    isValid: boolean;
    orderId: string;
    amount: number;
    transactionNo: string;
  } {
    // SePay Webhook Verification
    const transactionId = params['id'] || params['transactionId'] || '';
    const content = params['content'] || params['description'] || '';
    const transferAmount = Number(params['transferAmount'] || params['amount'] || 0);

    return {
      isValid: Boolean(transactionId && transferAmount > 0),
      orderId: content,
      amount: transferAmount,
      transactionNo: String(transactionId),
    };
  }
}
