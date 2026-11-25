import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DynamicImportController } from './dynamic-import.controller';
import { DynamicImportService } from './dynamic-import.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DynamicImportController],
  providers: [DynamicImportService],
  exports: [DynamicImportService],
})
export class DynamicImportModule {}
