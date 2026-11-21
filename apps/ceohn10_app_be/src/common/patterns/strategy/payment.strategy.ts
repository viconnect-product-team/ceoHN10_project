/**
 * 46 — Design Pattern Pragmatism: STRATEGY PATTERN
 * Phục vụ Kịch bản: Đa thuật toán xử lý cổng thanh toán
 * ĐÃ LOẠI BỎ HOÀN TOÀN MOMO VÀ VNPAY THEO YÊU CẦU DỰ ÁN
 * CHUYỂN TOÀN BỘ SANG SEPAY VIETQR TỰ ĐỘNG & CHUYỂN KHOẢN NGÂN HÀNG
 */

export interface PaymentIntent {
  orderId: string;
  amount: number;
  description: string;
  clientIp?: string;
  returnUrl?: string;
  bankAccount?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export interface PaymentProcessResult {
  success: boolean;
  paymentUrl?: string;
  qrCode?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    transferMemo: string;
  };
  method: string;
  transactionRef: string;
}

export interface IPaymentStrategy {
  readonly methodCode: string;
  processPayment(intent: PaymentIntent): Promise<PaymentProcessResult>;
}

export class BankTransferPaymentStrategy implements IPaymentStrategy {
  readonly methodCode = 'BANK_TRANSFER';

  async processPayment(intent: PaymentIntent): Promise<PaymentProcessResult> {
    const memo = `CEOHN10 ${intent.orderId}`;
    return {
      success: true,
      method: 'BANK_TRANSFER',
      transactionRef: intent.orderId,
      bankAccount: {
        bankName: process.env.SEPAY_BANK_NAME || 'Ngân hàng Quân Đội (MB Bank)',
        accountNumber: process.env.SEPAY_ACCOUNT_NO || '198300000000',
        accountHolder: process.env.SEPAY_ACCOUNT_HOLDER || 'CLB DOANH NHAN CEO HN10',
        transferMemo: memo,
      },
    };
  }
}

export class VietQRPaymentStrategy implements IPaymentStrategy {
  readonly methodCode = 'VIETQR';

  async processPayment(intent: PaymentIntent): Promise<PaymentProcessResult> {
    const memo = `CEOHN10 ${intent.orderId}`;
    const bankName = process.env.SEPAY_BANK_NAME || 'MB';
    const accNo = process.env.SEPAY_ACCOUNT_NO || '198300000000';
    const accHolder = process.env.SEPAY_ACCOUNT_HOLDER || 'CLB DOANH NHAN CEO HN10';
    const qrUrl = `https://img.vietqr.io/image/${bankName}-${accNo}-compact2.png?amount=${intent.amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accHolder)}`;
    return {
      success: true,
      method: 'VIETQR',
      transactionRef: intent.orderId,
      qrCode: qrUrl,
      bankAccount: {
        bankName,
        accountNumber: accNo,
        accountHolder: accHolder,
        transferMemo: memo,
      },
    };
  }
}

export class SePayPaymentStrategy implements IPaymentStrategy {
  readonly methodCode = 'SEPAY';

  async processPayment(intent: PaymentIntent): Promise<PaymentProcessResult> {
    const memo = `CEOHN10 ${intent.orderId}`;
    const bankName = process.env.SEPAY_BANK_NAME || 'MB';
    const accNo = process.env.SEPAY_ACCOUNT_NO || '198300000000';
    const accHolder = process.env.SEPAY_ACCOUNT_HOLDER || 'CLB DOANH NHAN CEO HN10';
    const qrUrl = `https://img.vietqr.io/image/${bankName}-${accNo}-compact2.png?amount=${intent.amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accHolder)}`;
    return {
      success: true,
      method: 'SEPAY',
      transactionRef: intent.orderId,
      qrCode: qrUrl,
      bankAccount: {
        bankName,
        accountNumber: accNo,
        accountHolder: accHolder,
        transferMemo: memo,
      },
    };
  }
}

export class PaymentStrategyFactory {
  private static registry = new Map<string, IPaymentStrategy>([
    ['BANK_TRANSFER', new BankTransferPaymentStrategy()],
    ['VIETQR', new VietQRPaymentStrategy()],
    ['SEPAY', new SePayPaymentStrategy()],
  ]);

  static register(strategy: IPaymentStrategy) {
    this.registry.set(strategy.methodCode, strategy);
  }

  static getStrategy(method: string): IPaymentStrategy {
    const strategy = this.registry.get((method || 'SEPAY').toUpperCase());
    return strategy || this.registry.get('SEPAY')!;
  }
}
