import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { CheckinController } from './checkin.controller';
import { EventsService } from './events.service';
import { EventsRepository } from './events.repository';
import { EventsCheckinService } from './sub-services/events-checkin.service';
import { EventsMediaService } from './sub-services/events-media.service';
import { EventsFeedbackService } from './sub-services/events-feedback.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { ZaloModule } from '../zalo/zalo.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PrismaModule, AuthModule, MailModule, ZaloModule, PaymentModule],
  controllers: [EventsController, CheckinController],
  providers: [
    EventsService,
    EventsRepository,
    EventsCheckinService,
    EventsMediaService,
    EventsFeedbackService,
  ],
  exports: [
    EventsService,
    EventsRepository,
    EventsCheckinService,
    EventsMediaService,
    EventsFeedbackService,
  ],
})
export class EventsModule {}
