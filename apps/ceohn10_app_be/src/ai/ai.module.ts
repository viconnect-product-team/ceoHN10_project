import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiCrmAnalyticsService } from './ai-crm-analytics.service';
import { KnowledgeBaseService } from './knowledge-base.service';
import { AiPermissionService } from './ai-permission.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiCrmAnalyticsService,
    KnowledgeBaseService,
    AiPermissionService,
  ],
  exports: [
    AiService,
    AiCrmAnalyticsService,
    KnowledgeBaseService,
    AiPermissionService,
  ],
})
export class AiModule {}
