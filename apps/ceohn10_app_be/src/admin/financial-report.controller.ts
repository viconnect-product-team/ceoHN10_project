import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireActions, DataScopeLevel } from '../auth/roles.decorator';
import { FinancialReportService } from './financial-report.service';
import {
  AddColumnDto,
  UpdateColumnDto,
  AddRowDto,
  UpdateRowDto,
} from './dto/financial-report.dto';

@Controller('financial-report')
export class FinancialReportController {
  constructor(private readonly financialReportService: FinancialReportService) {}

  // ── COLUMNS MANAGEMENT ──────────────────────────────────────────

  @Get('columns')
  async getColumns() {
    return this.financialReportService.getColumns();
  }

  @Post('columns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireActions('FIN_COL_ADD')
  async addColumn(@Body() body: AddColumnDto) {
    return this.financialReportService.addColumn(body);
  }

  @Put('columns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireActions('FIN_COL_ADD')
  @DataScopeLevel('ALL')
  async updateColumn(@Param('id') id: string, @Body() body: UpdateColumnDto) {
    return this.financialReportService.updateColumn(id, body);
  }

  @Delete('columns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireActions('FIN_COL_DELETE')
  @DataScopeLevel('ALL')
  async deleteColumn(@Param('id') id: string) {
    return this.financialReportService.deleteColumn(id);
  }

  // ── ROWS DATA MANAGEMENT ────────────────────────────────────────

  @Get('rows')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireActions('FIN_VIEW')
  async getRows(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('category') category?: string,
    @Query('fundId') fundId?: string,
    @Query('department') department?: string,
  ) {
    return this.financialReportService.getRows({ fromDate, toDate, category, fundId, department });
  }

  @Post('rows')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireActions('FIN_ROW_ADD')
  async addRow(@Body() body: AddRowDto) {
    return this.financialReportService.addRow(body);
  }

  @Put('rows/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireActions('FIN_ROW_EDIT')
  async updateRow(@Param('id') id: string, @Body() body: UpdateRowDto) {
    return this.financialReportService.updateRow(id, body);
  }

  @Delete('rows/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireActions('FIN_ROW_DELETE')
  async deleteRow(@Param('id') id: string) {
    return this.financialReportService.deleteRow(id);
  }

  // ── LỆNH ĐIỀU CHUYỂN NGÂN SÁCH QUỸ BAN CHUYÊN MÔN (BAN CÔNG NGHỆ) ───────────

  @Get('fund-transfers')
  @UseGuards(JwtAuthGuard)
  async getFundTransferOrders() {
    return this.financialReportService.getFundTransferOrders();
  }

  @Post('fund-transfers')
  @UseGuards(JwtAuthGuard)
  async createFundTransferOrder(
    @Req() req: any,
    @Body()
    body: {
      direction?: 'master_to_dept' | 'dept_to_master';
      sourceFundId?: string;
      destinationFundId?: string;
      sourceFundName?: string;
      destinationFundName?: string;
      amount: number;
      description?: string;
      transferDate?: string;
    },
  ) {
    return this.financialReportService.createFundTransferOrder(req.user, body);
  }

  @Post('fund-transfers/:id/accept')
  @UseGuards(JwtAuthGuard)
  async acceptFundTransferOrder(@Req() req: any, @Param('id') id: string) {
    return this.financialReportService.acceptFundTransferOrder(req.user, id);
  }

  @Delete('fund-transfers/:id')
  @UseGuards(JwtAuthGuard)
  async deleteFundTransferOrder(@Param('id') id: string) {
    return this.financialReportService.deleteFundTransferOrder(id);
  }

  @Post('fund-transfer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireActions('FIN_ROW_ADD')
  async transferDepartmentFund(
    @Body() body: {
      fromDepartment?: string;
      toDepartment: string;
      amount: number;
      description: string;
      invoiceUrl?: string;
      fundAccountLink?: string;
      transactionDate?: string;
    },
  ) {
    return this.financialReportService.transferDepartmentFund(body);
  }
}
