import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SchemaSyncService } from './schema-sync.service';

@Global()
@Module({
  providers: [PrismaService, SchemaSyncService],
  exports: [PrismaService, SchemaSyncService],
})
export class PrismaModule {}
