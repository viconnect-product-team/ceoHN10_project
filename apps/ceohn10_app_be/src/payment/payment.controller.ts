import { Controller, Post, Body, Req, Get, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-event-checkout')
  createEventCheckout(
    @Body()
    dto: {
      registrationId: string;
      eventId: string;
      amount: number;
      memberName?: string;
      memberCode?: string;
    },
    @Req() req: any,
  ) {
    const clientIp =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.connection?.remoteAddress ||
      '127.0.0.1';

    return this.paymentService.createEventCheckout({
      ...dto,
      clientIp,
    });
  }

  @Post('create-fee-checkout')
  createFeeCheckout(
    @Body()
    dto: {
      invoiceId: string;
      memberId?: string;
      amount: number;
      year?: number;
      memberName?: string;
    },
    @Req() req: any,
  ) {
    const clientIp =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.connection?.remoteAddress ||
      '127.0.0.1';

    return this.paymentService.createFeeCheckout({
      ...dto,
      clientIp,
    });
  }

  /**
   * Endpoint Webhook chính thức của SePay
   */
  @Post('sepay-webhook')
  handleSepayWebhook(@Body() payload: any) {
    return this.paymentService.handleSepayWebhook(payload);
  }

  @Get('sepay-config')
  getSepayConfig() {
    return this.paymentService.getSepayConfig();
  }

  @Post('simulate-success')
  simulateSuccess(@Body() dto: { orderId: string; amount: number }) {
    return this.paymentService.simulatePaymentSuccess(
      dto.orderId,
      dto.amount,
    );
  }
}
