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

@Controller('finance-init')
export class FinancialInitController {
  constructor(private readonly finService: FinancialInitService) {}

  /**
   * Danh sách Quỹ
   */
  @Get('funds')
  getFunds() {
    return this.finService.getFunds();
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
