import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { NotificationsController } from './notifications.controller';
import { DynamicFieldsController } from './dynamic-fields.controller';
import { FinancialReportController } from './financial-report.controller';
import { MasterSettingsController } from './master-settings.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { DynamicFieldsService } from './dynamic-fields.service';
import { FinancialReportService } from './financial-report.service';
import { MasterSettingsService } from './master-settings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ConnectAppModule } from '../connect-app/connect-app.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, AuthModule, ConnectAppModule, MailModule],
  controllers: [
    AdminController,
    NotificationsController,
    DynamicFieldsController,
    FinancialReportController,
    MasterSettingsController,
  ],
  providers: [
    AdminService,
    AdminRepository,
    DynamicFieldsService,
    FinancialReportService,
    MasterSettingsService,
  ],
  exports: [
    AdminService,
    AdminRepository,
    DynamicFieldsService,
    FinancialReportService,
    MasterSettingsService,
  ],
})
export class AdminModule {}
