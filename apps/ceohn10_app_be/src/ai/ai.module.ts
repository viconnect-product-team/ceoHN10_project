import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiCrmAnalyticsService } from './ai-crm-analytics.service';
import { KnowledgeBaseService } from './knowledge-base.service';
import { AiPermissionService } from './ai-permission.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { ToolRegistryService } from './tools/tool-registry.service';
import { LlmProviderAdapter } from './tools/llm-provider.adapter';
import { AgentCoreService } from './tools/agent-core.service';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiCrmAnalyticsService,
    KnowledgeBaseService,
    AiPermissionService,
    ToolRegistryService,
    LlmProviderAdapter,
    AgentCoreService,
  ],
  exports: [
    AiService,
    AiCrmAnalyticsService,
    KnowledgeBaseService,
    AiPermissionService,
    ToolRegistryService,
    LlmProviderAdapter,
    AgentCoreService,
  ],
})
export class AiModule {}
