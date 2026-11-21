# ==============================================================================
# SCRIPT BÓC TÁCH 5 MODULE ĐỘC LẬP CHO DỰ ÁN CEO HN10 (PHIÊN BẢN HOÀN THIỆN 100%)
# Tên thư mục đích: ceohn10_features_standalone
# 5 Module cốt lõi:
#   1. Luồng Sự Kiện (Events, Lịch trình, Vé, Sơ đồ chỗ ngồi, Đăng ký)
#   2. Quản Lý Tài Chính (Finance: Thu, Chi, Hoàn ứng, Quyết toán dòng tiền)
#   3. Quản Lý Tài Trợ (Sponsorships: Hồ sơ nhà tài trợ, Gói tài trợ Diamond/Gold/Silver/Bronze)
#   4. Quản Lý Quỹ Tài Trợ (Funds Management: Quỹ thặng dư & Yêu cầu giải ngân quỹ)
#   5. Cổng Soát Vé QR & E-Ticket Check-in (Gate Check-in QR < 0.2s)
#
# NGUYÊN TẮC BẢO MẬT & BẢO VỆ TÀI SẢN TRÍ TUỆ (IP PROTECTION):
#   - Tuyệt đối KHÔNG copy AI Assistant, Core Auth, Dynamic Landing Webs,
#     Universal Doc Viewer, Sàn B2B, Thẻ số 3D, Zalo OA Secret, Master Admin Platforms.
#   - Tuyệt đối KHÔNG chứa bất kỳ thông tin kết nối CSDL Thật (113.20.107.184:6432).
#   - Cung cấp Docker Compose PostgreSQL Local và Mock Auth để đối tác code độc lập.
# ==============================================================================

param(
    [string]$TargetDir = "..\ceohn10_features_standalone"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " BẮT ĐẦU BÓC TÁCH 5 MODULE SANG THƯ MỤC ĐỘC LẬP" -ForegroundColor Yellow
Write-Host " Thư mục đích: $TargetDir" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$RootDir = Get-Location
$TargetFullPath = [System.IO.Path]::GetFullPath((Join-Path $RootDir $TargetDir))

Write-Host "[1/6] Khởi tạo cấu trúc thư mục độc lập..." -ForegroundColor White
$dirs = @(
    "$TargetFullPath",
    "$TargetFullPath\apps\be_features\src\events",
    "$TargetFullPath\apps\be_features\src\sponsors",
    "$TargetFullPath\apps\be_features\src\finance",
    "$TargetFullPath\apps\be_features\src\funds",
    "$TargetFullPath\apps\be_features\src\auth",
    "$TargetFullPath\apps\be_features\src\prisma",
    "$TargetFullPath\apps\be_features\src\mail",
    "$TargetFullPath\apps\be_features\src\zalo",
    "$TargetFullPath\apps\be_features\src\common",
    "$TargetFullPath\apps\be_features\prisma",
    "$TargetFullPath\apps\fe_features\src\routes",
    "$TargetFullPath\apps\fe_features\src\components\events",
    "$TargetFullPath\apps\fe_features\src\components\checkin",
    "$TargetFullPath\apps\fe_features\src\components\dashboard",
    "$TargetFullPath\apps\fe_features\src\components\common",
    "$TargetFullPath\apps\fe_features\src\components\ui",
    "$TargetFullPath\apps\fe_features\src\lib",
    "$TargetFullPath\apps\fe_features\src\types",
    "$TargetFullPath\apps\fe_features\src\hooks",
    "$TargetFullPath\apps\fe_features\src\assets",
    "$TargetFullPath\database"
)

foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
    }
}

Write-Host "[2/6] Bóc tách Backend (Events, Sponsors, Finance, Funds, Stubs)..." -ForegroundColor White

# 1. Copy Events module
Copy-Item -Path "apps\ceohn10_app_be\src\events\*" -Destination "$TargetFullPath\apps\be_features\src\events" -Recurse -Force

# 2. Copy Sponsors module
Copy-Item -Path "apps\ceohn10_app_be\src\sponsors\*" -Destination "$TargetFullPath\apps\be_features\src\sponsors" -Recurse -Force

# 3. Tạo trọn bộ Auth Stubs cho Backend (để controller không bị thiếu import)
$authGuardTs = @"
import { Injectable, CanActivate, ExecutionContext, SetMetadata, NestInterceptor, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Đối Tác Kỹ Thuật (Dev)',
      email: 'dev@ceohn10.local',
      role: 'admin',
      department: 'Ban Tài Chính',
    };
    return true;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(): boolean { return true; }
}

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: '00000000-0000-0000-0000-000000000001', name: 'Guest / Dev', role: 'admin' };
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(): boolean { return true; }
}

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
export const DataScope = (...scopes: string[]) => SetMetadata('dataScope', scopes);

@Injectable()
export class DataScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle();
  }
}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\auth\jwt-auth.guard.ts" -Value $authGuardTs -Encoding UTF8
Set-Content -Path "$TargetFullPath\apps\be_features\src\auth\auth.guard.ts" -Value $authGuardTs -Encoding UTF8
Set-Content -Path "$TargetFullPath\apps\be_features\src\auth\optional-jwt-auth.guard.ts" -Value $authGuardTs -Encoding UTF8
Set-Content -Path "$TargetFullPath\apps\be_features\src\auth\roles.guard.ts" -Value $authGuardTs -Encoding UTF8
Set-Content -Path "$TargetFullPath\apps\be_features\src\auth\roles.decorator.ts" -Value "import { SetMetadata } from '@nestjs/common'; export const Roles = (...roles: string[]) => SetMetadata('roles', roles);" -Encoding UTF8
Set-Content -Path "$TargetFullPath\apps\be_features\src\auth\data-scope.decorator.ts" -Value "import { SetMetadata } from '@nestjs/common'; export const DataScope = (...scopes: string[]) => SetMetadata('dataScope', scopes);" -Encoding UTF8
Set-Content -Path "$TargetFullPath\apps\be_features\src\auth\data-scope.interceptor.ts" -Value "import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'; import { Observable } from 'rxjs'; @Injectable() export class DataScopeInterceptor implements NestInterceptor { intercept(context: ExecutionContext, next: CallHandler): Observable<any> { return next.handle(); } }" -Encoding UTF8

$authModuleTs = @"
import { Module, Global } from '@nestjs/common';
import { JwtAuthGuard, AuthGuard, OptionalJwtAuthGuard, RolesGuard, DataScopeInterceptor } from './jwt-auth.guard';

@Global()
@Module({
  providers: [JwtAuthGuard, AuthGuard, OptionalJwtAuthGuard, RolesGuard, DataScopeInterceptor],
  exports: [JwtAuthGuard, AuthGuard, OptionalJwtAuthGuard, RolesGuard, DataScopeInterceptor],
})
export class AuthModule {}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\auth\auth.module.ts" -Value $authModuleTs -Encoding UTF8

# 4. Tạo Prisma Service & Module độc lập
$prismaService = @"
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.`$connect();
  }

  async onModuleDestroy() {
    await this.`$disconnect();
  }
}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\prisma\prisma.service.ts" -Value $prismaService -Encoding UTF8
Set-Content -Path "$TargetFullPath\apps\be_features\src\common\prisma.service.ts" -Value $prismaService -Encoding UTF8

$prismaModule = @"
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\prisma\prisma.module.ts" -Value $prismaModule -Encoding UTF8

# 5. Tạo Mail & Zalo Stubs độc lập
$mailStub = @"
import { Injectable, Logger, Module, Global } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendMail(to: string, subject: string, content: string) {
    this.logger.log(`[MOCK EMAIL SENT] to=${to}, subject=${subject}`);
    return { success: true, mock: true };
  }

  async sendEventTicketEmail(params: any) {
    this.logger.log(`[MOCK TICKET EMAIL SENT] to=${params?.email}`);
    return { success: true, mock: true };
  }
}

@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\mail\mail.service.ts" -Value $mailStub -Encoding UTF8
Set-Content -Path "$TargetFullPath\apps\be_features\src\mail\mail.module.ts" -Value "export { MailModule } from './mail.service';" -Encoding UTF8

$zaloStub = @"
import { Injectable, Logger, Module, Global } from '@nestjs/common';

@Injectable()
export class ZaloService {
  private readonly logger = new Logger(ZaloService.name);

  async sendMessage(phone: string, template: string, data: any) {
    this.logger.log(`[MOCK ZALO MSG] phone=${phone}, template=${template}`);
    return { success: true, mock: true };
  }
}

@Global()
@Module({
  providers: [ZaloService],
  exports: [ZaloService],
})
export class ZaloModule {}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\zalo\zalo.service.ts" -Value $zaloStub -Encoding UTF8
Set-Content -Path "$TargetFullPath\apps\be_features\src\zalo\zalo.module.ts" -Value "export { ZaloModule } from './zalo.service';" -Encoding UTF8

# 6. Tạo Finance Controller & Service độc lập
$financeController = @"
import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('transactions')
  async listTransactions(@Query('type') type?: string) {
    return this.financeService.listTransactions(type);
  }

  @Post('transactions')
  async createTransaction(@Body() body: any) {
    return this.financeService.createTransaction(body);
  }

  @Put('transactions/:id')
  async updateTransaction(@Param('id') id: string, @Body() body: any) {
    return this.financeService.updateTransaction(id, body);
  }

  @Delete('transactions/:id')
  async deleteTransaction(@Param('id') id: string) {
    return this.financeService.deleteTransaction(id);
  }

  @Get('income')
  async listIncome(@Query() query: any) {
    return this.financeService.listIncome(query);
  }

  @Get('expenses')
  async listExpenses(@Query() query: any) {
    return this.financeService.listExpenses(query);
  }

  @Get('summary-report')
  async getSummaryReport() {
    return this.financeService.getSummaryReport();
  }
}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\finance\finance.controller.ts" -Value $financeController -Encoding UTF8

$financeService = @"
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async listTransactions(type?: string) {
    const where: any = {};
    if (type) where.type = type;
    return (this.prisma as any).transactions.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async createTransaction(data: any) {
    return (this.prisma as any).transactions.create({ data });
  }

  async updateTransaction(id: string, data: any) {
    return (this.prisma as any).transactions.update({ where: { id }, data });
  }

  async deleteTransaction(id: string) {
    return (this.prisma as any).transactions.delete({ where: { id } });
  }

  async listIncome(query: any) {
    return (this.prisma as any).income_records.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async listExpenses(query: any) {
    return (this.prisma as any).expense_records.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async getSummaryReport() {
    const income = await (this.prisma as any).income_records.aggregate({
      _sum: { amount: true },
    });
    const expense = await (this.prisma as any).expense_records.aggregate({
      _sum: { amount: true },
    });
    const totalIncome = Number(income._sum.amount || 0);
    const totalExpense = Number(expense._sum.amount || 0);
    return {
      totalIncome,
      totalExpense,
      surplus: totalIncome - totalExpense,
    };
  }
}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\finance\finance.service.ts" -Value $financeService -Encoding UTF8

$financeModule = @"
import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\finance\finance.module.ts" -Value $financeModule -Encoding UTF8

# 7. Tạo Funds Module độc lập
$fundsController = @"
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FundsService } from './funds.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('funds')
@UseGuards(JwtAuthGuard)
export class FundsController {
  constructor(private readonly fundsService: FundsService) {}

  @Get('overview')
  async getFundsOverview() {
    return this.fundsService.getFundsOverview();
  }

  @Get('expense-requests')
  async listExpenseRequests(@Query() query: any) {
    return this.fundsService.listExpenseRequests(query);
  }

  @Post('expense-requests')
  async createExpenseRequest(@Body() body: any) {
    return this.fundsService.createExpenseRequest(body);
  }

  @Patch('expense-requests/:id/approve-finance')
  async approveFinance(@Param('id') id: string) {
    return this.fundsService.approveFinance(id);
  }

  @Patch('expense-requests/:id/approve-leader')
  async approveLeader(@Param('id') id: string) {
    return this.fundsService.approveLeader(id);
  }

  @Post('expense-requests/:id/disburse')
  async disburse(@Param('id') id: string) {
    return this.fundsService.disburse(id);
  }
}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\funds\funds.controller.ts" -Value $fundsController -Encoding UTF8

$fundsService = @"
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FundsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFundsOverview() {
    const funds = await (this.prisma as any).funds.findMany();
    return {
      funds,
      totalBalance: funds.reduce((acc: number, f: any) => acc + Number(f.balance || 0), 0),
    };
  }

  async listExpenseRequests(query: any) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.fundType) where.fund_type = query.fundType;
    return (this.prisma as any).expense_requests.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async createExpenseRequest(data: any) {
    return (this.prisma as any).expense_requests.create({
      data: {
        ...data,
        status: 'pending',
      },
    });
  }

  async approveFinance(id: string) {
    return (this.prisma as any).expense_requests.update({
      where: { id },
      data: { status: 'approved_finance', finance_approver: 'Ban Tài Chính' },
    });
  }

  async approveLeader(id: string) {
    return (this.prisma as any).expense_requests.update({
      where: { id },
      data: { status: 'approved_leader', leader_approver: 'Chủ Tịch' },
    });
  }

  async disburse(id: string) {
    return (this.prisma as any).expense_requests.update({
      where: { id },
      data: { status: 'disbursed' },
    });
  }
}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\funds\funds.service.ts" -Value $fundsService -Encoding UTF8

$fundsModule = @"
import { Module } from '@nestjs/common';
import { FundsController } from './funds.controller';
import { FundsService } from './funds.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FundsController],
  providers: [FundsService],
  exports: [FundsService],
})
export class FundsModule {}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\funds\funds.module.ts" -Value $fundsModule -Encoding UTF8

# 8. Tạo App Module & Main.ts cho Backend
$appModule = @"
import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';
import { SponsorsModule } from './sponsors/sponsors.module';
import { FinanceModule } from './finance/finance.module';
import { FundsModule } from './funds/funds.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { ZaloModule } from './zalo/zalo.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    MailModule,
    ZaloModule,
    EventsModule,
    SponsorsModule,
    FinanceModule,
    FundsModule
  ],
})
export class AppModule {}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\app.module.ts" -Value $appModule -Encoding UTF8

$mainBe = @"
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api');
  const port = process.env.PORT || 4003;
  await app.listen(port);
  console.log(`🚀 CEOHN10 Feature Backend đang chạy tại: http://localhost:${port}/api`);
}
bootstrap();
"@
Set-Content -Path "$TargetFullPath\apps\be_features\src\main.ts" -Value $mainBe -Encoding UTF8

# 9. Schema Prisma cho 5 Module
$prismaSchema = @"
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model events {
  id                String    @id @default(uuid()) @db.Uuid
  title             String
  description       String?
  start_time        DateTime? @db.Timestamptz
  end_time          DateTime? @db.Timestamptz
  location          String?
  address           String?
  poster_url        String?
  banner_url        String?
  max_attendees     Int?      @default(0)
  current_attendees Int?      @default(0)
  is_public         Boolean?  @default(true)
  status            String?   @default("published")
  created_at        DateTime? @default(now()) @db.Timestamptz
  updated_at        DateTime? @updated_at @db.Timestamptz
}

model event_ticket_types {
  id          String   @id @default(uuid()) @db.Uuid
  event_id    String   @db.Uuid
  name        String
  price       Decimal  @default(0) @db.Decimal(15, 2)
  quantity    Int      @default(0)
  sold        Int      @default(0)
  benefits    Json?
}

model event_registrations {
  id             String    @id @default(uuid()) @db.Uuid
  event_id       String    @db.Uuid
  user_id        String?   @db.Uuid
  full_name      String
  phone          String?
  email          String?
  company_name   String?
  ticket_type_id String?   @db.Uuid
  ticket_code    String?
  qr_code        String?
  status         String?   @default("registered")
  checked_in_at  DateTime? @db.Timestamptz
  seat_number    String?
  created_at     DateTime? @default(now()) @db.Timestamptz
}

model sponsors {
  id             String    @id @default(uuid()) @db.Uuid
  association_id String?   @db.Uuid
  name           String
  logo_url       String?
  website        String?
  tier           String?   @default("bronze")
  description    String?
  contact_person String?
  phone          String?
  email          String?
  status         String?   @default("active")
  created_at     DateTime? @default(now()) @db.Timestamptz
}

model sponsor_packages {
  id             String   @id @default(uuid()) @db.Uuid
  association_id String?  @db.Uuid
  name           String
  tier           String
  price          Decimal  @default(0) @db.Decimal(15, 2)
  benefits       Json?
  max_slots      Int?     @default(10)
  active         Boolean? @default(true)
}

model sponsors_prizes {
  id         String   @id @default(uuid()) @db.Uuid
  sponsor_id String?  @db.Uuid
  event_id   String?  @db.Uuid
  name       String
  quantity   Int      @default(1)
  remaining  Int      @default(1)
  value      Decimal? @default(0) @db.Decimal(15, 2)
}

model transactions {
  id          String    @id @default(uuid()) @db.Uuid
  code        String?
  title       String
  amount      Decimal   @default(0) @db.Decimal(15, 2)
  type        String
  category    String?
  status      String?   @default("completed")
  created_at  DateTime? @default(now()) @db.Timestamptz
}

model income_records {
  id             String    @id @default(uuid()) @db.Uuid
  code           String?
  title          String
  amount         Decimal   @default(0) @db.Decimal(15, 2)
  date           DateTime? @default(now()) @db.Timestamptz
  category       String?
  payer_name     String?
  payer_id       String?   @db.Uuid
  payment_method String?   @default("transfer")
  status         String?   @default("completed")
  notes          String?
  created_at     DateTime? @default(now()) @db.Timestamptz
}

model expense_records {
  id             String    @id @default(uuid()) @db.Uuid
  code           String?
  title          String
  amount         Decimal   @default(0) @db.Decimal(15, 2)
  date           DateTime? @default(now()) @db.Timestamptz
  category       String?
  recipient_name String?
  department     String?
  status         String?   @default("completed")
  proof_image    String?
  notes          String?
  created_at     DateTime? @default(now()) @db.Timestamptz
}

model expense_requests {
  id               String    @id @default(uuid()) @db.Uuid
  title            String
  amount           Decimal   @default(0) @db.Decimal(15, 2)
  department       String?
  requester_name   String?
  requester_id     String?   @db.Uuid
  fund_type        String?   @default("sponsorship_fund")
  status           String?   @default("pending")
  finance_approver String?
  leader_approver  String?
  notes            String?
  created_at       DateTime? @default(now()) @db.Timestamptz
}

model funds {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  code      String   @unique
  balance   Decimal  @default(0) @db.Decimal(15, 2)
  total_in  Decimal  @default(0) @db.Decimal(15, 2)
  total_out Decimal  @default(0) @db.Decimal(15, 2)
}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\prisma\schema.prisma" -Value $prismaSchema -Encoding UTF8

# Backend package.json & tsconfig
$bePackageJson = @"
{
  "name": "ceohn10-features-be",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "dev": "ts-node-dev --respawn --transpile-only src/main.ts",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@prisma/client": "^5.14.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "prisma": "^5.14.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\package.json" -Value $bePackageJson -Encoding UTF8

$beTsConfig = @"
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
"@
Set-Content -Path "$TargetFullPath\apps\be_features\tsconfig.json" -Value $beTsConfig -Encoding UTF8

Write-Host "[3/6] Bóc tách Frontend (Routes, Components, Helpers)..." -ForegroundColor White

# 1. Routes chi tiết của 5 Module
$feRoutes = @(
    "events.index.tsx",
    "events.tsx",
    "events.`$eventId.tsx",
    "event-checkin.tsx",
    "event-registrations.tsx",
    "events-overview.tsx",
    "checkin.tsx",
    "checkin-qr.tsx",
    "guest-event-register.`$eventId.tsx",
    "income.tsx",
    "expenses.tsx",
    "finance-report.tsx",
    "sponsors.tsx",
    "sponsor-packages.tsx",
    "sponsor-report.tsx",
    "association.events.tsx",
    "association.checkin.tsx"
)
foreach ($r in $feRoutes) {
    if (Test-Path "apps\ceohn10_app_fe\src\routes\$r") {
        Copy-Item -Path "apps\ceohn10_app_fe\src\routes\$r" -Destination "$TargetFullPath\apps\fe_features\src\routes\$r" -Force
    }
}

# 2. Components sự kiện và check-in
Copy-Item -Path "apps\ceohn10_app_fe\src\components\events\*" -Destination "$TargetFullPath\apps\fe_features\src\components\events" -Recurse -Force
Copy-Item -Path "apps\ceohn10_app_fe\src\components\checkin\*" -Destination "$TargetFullPath\apps\fe_features\src\components\checkin" -Recurse -Force

# 3. Components Dashboard cần thiết cho 5 module
$dashboardComponents = @(
    "FinanceChartsSection.tsx",
    "FinanceExcelImportModal.tsx",
    "FinanceUnitTreeSection.tsx",
    "FinanceViewModeTabs.tsx",
    "InvoiceExportModal.tsx",
    "VndCurrencyInput.tsx",
    "RevenueChart.tsx",
    "SponsorExcelImportModal.tsx",
    "SponsorModal.tsx",
    "SponsorOnboardWizard.tsx",
    "SponsorPackageModal.tsx",
    "MasterFundSurplusWidget.tsx",
    "CinemaSeatingMap.tsx",
    "EventAgenda.tsx",
    "EventAttendees.tsx",
    "EventCheckinPanel.tsx",
    "EventFeed.tsx",
    "EventPosterStudioModal.tsx",
    "EventQrConfigModal.tsx",
    "EventRegistrationPanel.tsx",
    "EventReminderPosterModal.tsx",
    "EventSponsors.tsx",
    "EventWizard.tsx",
    "LuckyDrawLandingBanner.tsx",
    "UpcomingEvents.tsx",
    "DataTablePagination.tsx",
    "ResizableTableHeaders.tsx",
    "TruncatedText.tsx",
    "PageKit.tsx",
    "StateKit.tsx",
    "CrudModal.tsx"
)
foreach ($c in $dashboardComponents) {
    if (Test-Path "apps\ceohn10_app_fe\src\components\dashboard\$c") {
        Copy-Item -Path "apps\ceohn10_app_fe\src\components\dashboard\$c" -Destination "$TargetFullPath\apps\fe_features\src\components\dashboard\$c" -Force
    }
}

# 4. AppShell Lite độc lập
$appShellLite = @"
import React, { type ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className=""min-h-screen bg-slate-900 text-slate-100 flex flex-col"">
      <div className=""flex-1 w-full max-w-7xl mx-auto p-4 md:p-6"">
        {children}
      </div>
    </div>
  );
}
"@
Set-Content -Path "$TargetFullPath\apps\fe_features\src\components\dashboard\AppShell.tsx" -Value $appShellLite -Encoding UTF8

# 5. Common & UI Primitives
Copy-Item -Path "apps\ceohn10_app_fe\src\components\ui\*" -Destination "$TargetFullPath\apps\fe_features\src\components\ui" -Recurse -Force
if (Test-Path "apps\ceohn10_app_fe\src\components\common\StandardDateInput.tsx") {
    Copy-Item -Path "apps\ceohn10_app_fe\src\components\common\StandardDateInput.tsx" -Destination "$TargetFullPath\apps\fe_features\src\components\common\StandardDateInput.tsx" -Force
}
if (Test-Path "apps\ceohn10_app_fe\src\components\common\FormattedCurrencyInput.tsx") {
    Copy-Item -Path "apps\ceohn10_app_fe\src\components\common\FormattedCurrencyInput.tsx" -Destination "$TargetFullPath\apps\fe_features\src\components\common\FormattedCurrencyInput.tsx" -Force
}
if (Test-Path "apps\ceohn10_app_fe\src\components\LangSwitcher.tsx") {
    Copy-Item -Path "apps\ceohn10_app_fe\src\components\LangSwitcher.tsx" -Destination "$TargetFullPath\apps\fe_features\src\components\LangSwitcher.tsx" -Force
}

# 6. Libs, Types, Hooks, Assets (Tất cả helper phục vụ 5 module)
$libFiles = @("api-client.ts", "invoice-receipt.ts", "excel-export.ts", "i18n.ts", "utils.ts", "checkin-data.ts", "checkin-errors.ts", "scan.ts", "events.functions.ts")
foreach ($l in $libFiles) {
    if (Test-Path "apps\ceohn10_app_fe\src\lib\$l") {
        Copy-Item -Path "apps\ceohn10_app_fe\src\lib\$l" -Destination "$TargetFullPath\apps\fe_features\src\lib\$l" -Force
    }
}
if (Test-Path "apps\ceohn10_app_fe\src\types\finance.types.ts") {
    Copy-Item -Path "apps\ceohn10_app_fe\src\types\finance.types.ts" -Destination "$TargetFullPath\apps\fe_features\src\types\finance.types.ts" -Force
}
$hookFiles = @("use-table-controls.ts", "use-qr-scanner.ts", "use-nfc-scanner.ts")
foreach ($h in $hookFiles) {
    if (Test-Path "apps\ceohn10_app_fe\src\hooks\$h") {
        Copy-Item -Path "apps\ceohn10_app_fe\src\hooks\$h" -Destination "$TargetFullPath\apps\fe_features\src\hooks\$h" -Force
    }
}
if (Test-Path "apps\ceohn10_app_fe\src\assets\ky_niem_4_nam_banner.ts") {
    Copy-Item -Path "apps\ceohn10_app_fe\src\assets\ky_niem_4_nam_banner.ts" -Destination "$TargetFullPath\apps\fe_features\src\assets\ky_niem_4_nam_banner.ts" -Force
}

# 7. Tạo Lite App Hub cho Frontend độc lập
$feAppTsx = @"
import React, { useState } from 'react';
import EventsIndexPage from './routes/events.index';
import IncomePage from './routes/income';
import ExpensesPage from './routes/expenses';
import FinanceReportPage from './routes/finance-report';
import SponsorsPage from './routes/sponsors';
import SponsorPackagesPage from './routes/sponsor-packages';
import CheckinPage from './routes/checkin';

export default function App() {
  const [activeTab, setActiveTab] = useState<'events' | 'checkin' | 'income' | 'expenses' | 'finance-report' | 'sponsors' | 'sponsor-packages'>('events');

  return (
    <div className=""min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans"">
      {/* Lite Topbar */}
      <header className=""h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50 shadow-md"">
        <div className=""flex items-center gap-3"">
          <div className=""w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 shadow-sm"">
            HN10
          </div>
          <div>
            <h1 className=""text-sm font-bold tracking-wide text-amber-400"">CEOHN10 FEATURE SUITE</h1>
            <p className=""text-xs text-slate-400"">Không Gian Phát Triển 5 Phân Hệ Độc Lập</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className=""flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 text-xs"">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 rounded-md font-medium transition \${activeTab === 'events' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            📅 1. Sự Kiện
          </button>
          <button
            onClick={() => setActiveTab('checkin')}
            className={`px-3 py-1.5 rounded-md font-medium transition \${activeTab === 'checkin' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            🎟️ 2. Soát Vé QR
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-3 py-1.5 rounded-md font-medium transition \${activeTab === 'income' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            💰 3. Thu Ngân Sách
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-md font-medium transition \${activeTab === 'expenses' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            💸 4. Chi Ngân Sách
          </button>
          <button
            onClick={() => setActiveTab('finance-report')}
            className={`px-3 py-1.5 rounded-md font-medium transition \${activeTab === 'finance-report' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            📊 5. Báo Cáo Tài Chính
          </button>
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`px-3 py-1.5 rounded-md font-medium transition \${activeTab === 'sponsors' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            💎 6. Nhà Tài Trợ
          </button>
          <button
            onClick={() => setActiveTab('sponsor-packages')}
            className={`px-3 py-1.5 rounded-md font-medium transition \${activeTab === 'sponsor-packages' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            🎁 Gói Tài Trợ
          </button>
        </nav>
      </header>

      {/* Main Content Render */}
      <main className=""flex-1 p-6"">
        {activeTab === 'events' && <EventsIndexPage />}
        {activeTab === 'checkin' && <CheckinPage />}
        {activeTab === 'income' && <IncomePage />}
        {activeTab === 'expenses' && <ExpensesPage />}
        {activeTab === 'finance-report' && <FinanceReportPage />}
        {activeTab === 'sponsors' && <SponsorsPage />}
        {activeTab === 'sponsor-packages' && <SponsorPackagesPage />}
      </main>
    </div>
  );
}
"@
Set-Content -Path "$TargetFullPath\apps\fe_features\src\App.tsx" -Value $feAppTsx -Encoding UTF8

# Frontend package.json
$fePackageJson = @"
{
  "name": "ceohn10-features-fe",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-router": "^1.31.0",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.378.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.7",
    "sonner": "^1.4.41",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.2.2",
    "vite": "^5.2.10"
  }
}
"@
Set-Content -Path "$TargetFullPath\apps\fe_features\package.json" -Value $fePackageJson -Encoding UTF8

Write-Host "[4/6] Khởi tạo CSDL Local & Docker Compose..." -ForegroundColor White

# File DDL SQL khởi tạo bảng
$initSql = @"
-- =============================================================================
-- CSDL ĐỘC LẬP CHO 5 PHÂN HỆ CEO HN10 (LOCAL POSTGRESQL)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Sự kiện
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  start_time timestamptz,
  end_time timestamptz,
  location text,
  address text,
  poster_url text,
  banner_url text,
  max_attendees int DEFAULT 0,
  current_attendees int DEFAULT 0,
  is_public boolean DEFAULT true,
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Hạng vé sự kiện
CREATE TABLE IF NOT EXISTS public.event_ticket_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(15,2) DEFAULT 0,
  quantity int DEFAULT 0,
  sold int DEFAULT 0,
  benefits jsonb
);

-- 3. Đăng ký & Soát vé QR
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid,
  full_name text NOT NULL,
  phone text,
  email text,
  company_name text,
  ticket_type_id uuid,
  ticket_code text,
  qr_code text,
  status text DEFAULT 'registered',
  checked_in_at timestamptz,
  seat_number text,
  created_at timestamptz DEFAULT now()
);

-- 4. Nhà tài trợ
CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  association_id uuid,
  name text NOT NULL,
  logo_url text,
  website text,
  tier text DEFAULT 'bronze',
  description text,
  contact_person text,
  phone text,
  email text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- 5. Gói tài trợ
CREATE TABLE IF NOT EXISTS public.sponsor_packages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  association_id uuid,
  name text NOT NULL,
  tier text NOT NULL,
  price numeric(15,2) DEFAULT 0,
  benefits jsonb,
  max_slots int DEFAULT 10,
  active boolean DEFAULT true
);

-- 6. Quà tặng / Giải thưởng tài trợ
CREATE TABLE IF NOT EXISTS public.sponsors_prizes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id uuid REFERENCES public.sponsors(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity int DEFAULT 1,
  remaining int DEFAULT 1,
  value numeric(15,2) DEFAULT 0
);

-- 7. Phiếu thu
CREATE TABLE IF NOT EXISTS public.income_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text,
  title text NOT NULL,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  date timestamptz DEFAULT now(),
  category text,
  payer_name text,
  payer_id uuid,
  payment_method text DEFAULT 'transfer',
  status text DEFAULT 'completed',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 8. Phiếu chi
CREATE TABLE IF NOT EXISTS public.expense_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text,
  title text NOT NULL,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  date timestamptz DEFAULT now(),
  category text,
  recipient_name text,
  department text,
  status text DEFAULT 'completed',
  proof_image text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 9. Yêu cầu chi & duyệt quỹ
CREATE TABLE IF NOT EXISTS public.expense_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  department text,
  requester_name text,
  requester_id uuid,
  fund_type text DEFAULT 'sponsorship_fund',
  status text DEFAULT 'pending',
  finance_approver text,
  leader_approver text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 10. Quỹ tài trợ & Ngân sách
CREATE TABLE IF NOT EXISTS public.funds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  balance numeric(15,2) DEFAULT 0,
  total_in numeric(15,2) DEFAULT 0,
  total_out numeric(15,2) DEFAULT 0
);

-- Dữ liệu mẫu khởi tạo
INSERT INTO public.funds (name, code, balance, total_in, total_out)
VALUES
  ('Quỹ Hoạt Động Hiệp Hội', 'operating_fund', 250000000, 500000000, 250000000),
  ('Quỹ Tài Trợ Sự Kiện Gala', 'sponsorship_fund', 180000000, 300000000, 120000000)
ON CONFLICT (code) DO NOTHING;
"@
Set-Content -Path "$TargetFullPath\database\init_5_modules_schema.sql" -Value $initSql -Encoding UTF8

# Docker Compose Local Database
$dockerCompose = @"
version: '3.8'

services:
  postgres_features_db:
    image: postgres:15-alpine
    container_name: ceohn10_features_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: ceohn10_features_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init_5_modules_schema.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - ceohn10_local_net

volumes:
  postgres_data:

networks:
  ceohn10_local_net:
    driver: bridge
"@
Set-Content -Path "$TargetFullPath\docker-compose.local-db.yml" -Value $dockerCompose -Encoding UTF8

# File .env.example
$envExample = @"
# =============================================================================
# BIẾN MÔI TRƯỜNG PHÁT TRIỂN LOCAL DÀNH CHO ĐỐI TÁC (5 MODULES)
# TUYỆT ĐỐI KHÔNG CHỨA THÔNG TIN CSDL SERVER PRODUCTION
# =============================================================================

# CSDL Local Docker
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/ceohn10_features_dev?schema=public"

# Backend API Port
PORT=4003

# Frontend Vite
VITE_API_URL="http://localhost:4003/api"
"@
Set-Content -Path "$TargetFullPath\.env.example" -Value $envExample -Encoding UTF8

Write-Host "[5/6] Tạo Root Config & Hướng dẫn Readme..." -ForegroundColor White

# Root package.json
$rootPackageJson = @"
{
  "name": "ceohn10-features-suite",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev:be": "npm run dev --prefix apps/be_features",
    "dev:fe": "npm run dev --prefix apps/fe_features",
    "db:up": "docker-compose -f docker-compose.local-db.yml up -d",
    "db:down": "docker-compose -f docker-compose.local-db.yml down",
    "db:push": "npm run prisma:push --prefix apps/be_features"
  }
}
"@
Set-Content -Path "$TargetFullPath\package.json" -Value $rootPackageJson -Encoding UTF8

# .gitignore
$gitIgnore = @"
node_modules/
dist/
.env
.DS_Store
*.log
"@
Set-Content -Path "$TargetFullPath\.gitignore" -Value $gitIgnore -Encoding UTF8

# README.md
$readme = @"
# CEO HN10 - KHÔNG GIAN PHÁT TRIỂN 5 PHÂN HỆ NGHIỆP VỤ (STANDALONE)

Repository này được tách riêng độc lập dành cho nhóm đối tác kỹ thuật phát triển **5 Phân Hệ Trọng Tâm** theo thỏa thuận hợp đồng tài trợ:

1. **Module 1: Luồng Sự Kiện (Events)** - Quản trị sự kiện, lịch trình agenda, sơ đồ chỗ ngồi, đăng ký vé.
2. **Module 2: Quản Lý Tài Chính (Finance)** - Quản lý phiếu thu, phiếu chi, tạm ứng, hoàn ứng, biểu đồ dòng tiền.
3. **Module 3: Quản Lý Tài Trợ (Sponsorships)** - Quản lý hồ sơ nhà tài trợ, các gói tài trợ (Diamond/Gold/Silver/Bronze).
4. **Module 4: Quản Lý Quỹ Tài Trợ (Funds)** - Theo dõi số dư các túi quỹ, quy trình lập & duyệt phiếu chi từ quỹ.
5. **Module 5: Soát Vé QR Gate & E-Ticket (Check-in)** - Cổng soát vé mã QR tốc độ cao, danh sách đại biểu tham dự.

---

## 🛠️ HƯỚNG DẪN KHỞI CHẠY DÀNH CHO DEVELOPER

### 1. Khởi chạy CSDL Local (Docker)
```bash
# Khởi động PostgreSQL 15 cục bộ (Port 5432)
npm run db:up
```

### 2. Cài đặt Dependencies & Khởi chạy Backend
```bash
cd apps/be_features
cp ../../.env.example .env
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
# Backend chạy tại: http://localhost:4003/api
```

### 3. Cài đặt & Khởi chạy Frontend
```bash
cd apps/fe_features
npm install
npm run dev
# Frontend chạy tại: http://localhost:5173
```

---

## ⚠️ NGUYÊN TẮC BẢN QUYỀN & BẢO MẬT
- Mọi đóng góp mã nguồn chỉ thực hiện trong phạm vi 5 thư mục module nêu trên.
- Không tự ý thêm các thư viện bên ngoài mà chưa được phê duyệt từ Technical Lead.
"@
Set-Content -Path "$TargetFullPath\README.md" -Value $readme -Encoding UTF8

# Hướng dẫn Git Setup cho Bạn
$gitGuide = @"
# HƯỚNG DẪN ĐẨY REPO RIÊNG NÀY LÊN GITHUB DÀNH CHO BẠN

Sau khi script bóc tách hoàn tất:

1. Di chuyển vào thư mục vừa tạo:
   cd $TargetDir

2. Khởi tạo Git repo mới:
   git init
   git add .
   git commit -m ""feat(init): khoi tao repo 5 modules ceohn10 doc lap""

3. Tạo 1 repository mới trên GitHub (Ví dụ: https://github.com/viconnect-product-team/ceohn10_features_app.git)

4. Gán remote và đẩy lên:
   git remote add origin https://github.com/viconnect-product-team/ceohn10_features_app.git
   git branch -M main
   git push -u origin main

5. Add tài khoản của đối tác/bạn kia vào làm Collaborator của repo này.
   -> Họ chỉ có quyền truy cập repo này, hoàn toàn KHÔNG biết và KHÔNG THỂ lấy được phần Base trong repo chính của bạn!
"@
Set-Content -Path "$TargetFullPath\GIT_SETUP_GUIDE.md" -Value $gitGuide -Encoding UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [HOÀN TẤT BÓC TÁCH THÀNH CÔNG!]" -ForegroundColor Green
Write-Host " Thư mục độc lập đã sẵn sàng tại: $TargetFullPath" -ForegroundColor Yellow
Write-Host " Hãy mở file '$TargetFullPath\GIT_SETUP_GUIDE.md' để đẩy lên Git riêng!" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
