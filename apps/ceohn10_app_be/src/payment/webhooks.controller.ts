import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Endpoint chính thức: POST /api/webhooks/sepay (hoặc POST /webhooks/sepay)
   */
  @Post('sepay')
  async handleSepayWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: any,
  ) {
    return this.paymentService.handleSepayWebhook(payload, {
      headers,
      rawBody: req.rawBody,
    });
  }

  /**
   * Endpoint giả lập Webhook SePay trên Localhost: POST /api/webhooks/sepay/simulate
   */
  @Post('sepay/simulate')
  async simulateSepayWebhook(
    @Body()
    dto: {
      type?: 'event_ticket' | 'membership_fee' | 'transfer' | 'general';
      amount?: number;
      accountNumber?: string;
      content?: string;
      referenceCode?: string;
    },
  ) {
    return this.paymentService.simulateLocalWebhook(dto);
  }
}
