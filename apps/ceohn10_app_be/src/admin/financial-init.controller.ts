import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FinancialInitService } from './financial-init.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('finance-init')
export class FinancialInitController {
  constructor(private readonly finService: FinancialInitService) {}

  /**
   * Danh sách Quỹ
   */
  @Get('funds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'platform_admin', 'superadmin', 'president', 'vice_president', 'accountant', 'secretary', 'lop_truong', 'lop_pho', 'truong_ban_chuyen_trach', 'quan_tri')
  getFunds() {
    return this.finService.getFunds();
  }

  /**
   * Sổ chi tiết dòng tiền minh bạch (người chuyển phí sự kiện, thu/chi nhập tay, SePay)
   */
  @Get('detailed-ledger')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'platform_admin', 'superadmin', 'president', 'vice_president', 'accountant', 'secretary', 'lop_truong', 'lop_pho', 'truong_ban_chuyen_trach', 'quan_tri')
  getDetailedLedger() {
    return this.finService.getDetailedLedger();
  }

  /**
   * Nhập tay khoản Thu / Chi trực tiếp vào Quỹ (tự động biến động số dư Quỹ & tùy chọn chuyển về Quỹ Tổng)
   */
  @Post('manual-cashflow')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'platform_admin', 'superadmin', 'president', 'vice_president', 'accountant', 'secretary', 'lop_truong', 'lop_pho', 'truong_ban_chuyen_trach', 'quan_tri')
  createManualCashflow(
    @Req() req: any,
    @Body()
    dto: {
      fundId?: string;
      flowType: 'IN' | 'OUT';
      category: string;
      amount: number;
      payerName: string;
      payerPhone?: string;
      payerEmail?: string;
      companyName?: string;
      studentCode?: string;
      paymentMethod?: 'bank' | 'cash' | 'vietqr';
      description: string;
      transactionDate?: string;
      transferToGeneral?: boolean;
    },
  ) {
    return this.finService.createManualCashflow(req.user, dto);
  }

  /**
   * Cập nhật thông tin Quỹ & Tài khoản ngân hàng của Quỹ
   */
  @Put('funds/:id')
  @UseGuards(JwtAuthGuard)
  updateFund(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      description?: string;
      leaderName?: string;
      bankName?: string;
      accountNumber?: string;
      accountHolder?: string;
      sepayAccountId?: string;
    },
  ) {
    return this.finService.updateFund(id, dto);
  }

  /**
   * Chi tiết số dư đầu kỳ (2.1 tỷ)
   */
  @Get('opening-balance')
  getOpeningBalance() {
    return this.finService.getOpeningBalance();
  }

  /**
   * Lưu phân bổ số dư đầu kỳ
   */
  @Post('opening-balance')
  @UseGuards(JwtAuthGuard)
  saveOpeningBalance(
    @Body()
    dto: {
      items: { fundId: string; allocatedAmount: number; notes?: string }[];
      notes?: string;
    },
    @Req() req: any,
  ) {
    return this.finService.saveOpeningBalance(req.user?.id, dto);
  }

  /**
   * Phê duyệt số dư đầu kỳ
   */
  @Post('opening-balance/approve')
  @UseGuards(JwtAuthGuard)
  approveOpeningBalance(@Req() req: any) {
    return this.finService.approveOpeningBalance(req.user?.id);
  }

  /**
   * Chốt sổ số dư đầu kỳ (POSTED)
   */
  @Post('opening-balance/post')
  @UseGuards(JwtAuthGuard)
  postOpeningBalance(@Req() req: any) {
    return this.finService.postOpeningBalance(req.user?.id);
  }

  /**
   * Danh sách điều chuyển nội bộ
   */
  @Get('transfers')
  getTransfers() {
    return this.finService.getTransfers();
  }

  /**
   * Lập lệnh điều chuyển nội bộ giữa 2 quỹ
   */
  @Post('transfers')
  @UseGuards(JwtAuthGuard)
  createTransfer(
    @Body()
    dto: {
      sourceFundId: string;
      destFundId: string;
      amount: number;
      description: string;
      transferDate?: string;
    },
    @Req() req: any,
  ) {
    return this.finService.createTransfer(req.user?.id, dto);
  }

  /**
   * Danh sách tài khoản ngân hàng
   */
  @Get('bank-accounts')
  getBankAccounts() {
    return this.finService.getBankAccounts();
  }

  /**
   * Thêm tài khoản ngân hàng
   */
  @Post('bank-accounts')
  @UseGuards(JwtAuthGuard)
  createBankAccount(
    @Body()
    dto: {
      fundId: string;
      bankName: string;
      accountNumber: string;
      accountHolder: string;
      sepayAccountId?: string;
      isDefault?: boolean;
    },
  ) {
    return this.finService.createBankAccount(dto);
  }

  /**
   * Sửa tài khoản ngân hàng
   */
  @Put('bank-accounts/:id')
  @UseGuards(JwtAuthGuard)
  updateBankAccount(
    @Param('id') id: string,
    @Body()
    dto: {
      fundId?: string;
      bankName?: string;
      accountNumber?: string;
      accountHolder?: string;
      sepayAccountId?: string;
      isActive?: boolean;
      isDefault?: boolean;
    },
  ) {
    return this.finService.updateBankAccount(id, dto);
  }

  /**
   * Danh sách các phiên đối soát ngân hàng
   */
  @Get('reconciliations')
  getReconciliations() {
    return this.finService.getReconciliations();
  }

  /**
   * Tạo phiên đối soát mới
   */
  @Post('reconciliations')
  @UseGuards(JwtAuthGuard)
  createReconciliation(
    @Body()
    dto: {
      bankAccountId: string;
      periodFrom: string;
      periodTo: string;
      openingBalance: number;
      closingBalance: number;
      totalIn: number;
      totalOut: number;
      difference: number;
      matchedCount?: number;
      unmatchedCount?: number;
      notes?: string;
    },
    @Req() req: any,
  ) {
    return this.finService.createReconciliation(req.user?.id, dto);
  }
}
