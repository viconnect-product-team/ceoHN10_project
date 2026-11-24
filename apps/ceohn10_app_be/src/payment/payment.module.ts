import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { ZaloModule } from '../zalo/zalo.module';
import { PaymentController } from './payment.controller';
import { WebhooksController } from './webhooks.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [PrismaModule, MailModule, ZaloModule],
  controllers: [PaymentController, WebhooksController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
