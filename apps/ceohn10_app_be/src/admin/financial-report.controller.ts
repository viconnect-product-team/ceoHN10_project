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
  @DataScopeLevel('ALL')
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
  ) {
    return this.financialReportService.getRows({ fromDate, toDate, category });
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
}
