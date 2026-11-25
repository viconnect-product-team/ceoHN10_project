import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DynamicImportService } from './dynamic-import.service';
import {
  ExecuteImportDto,
  ParseFileDto,
  SaveImportTemplateDto,
  ValidateImportDto,
} from './dto/dynamic-import.dto';

@Controller('dynamic-import')
export class DynamicImportController {
  constructor(private readonly dynamicImportService: DynamicImportService) {}

  @Post('parse')
  async parseFile(@Body() body: ParseFileDto) {
    return this.dynamicImportService.parseFile(body);
  }

  @Post('validate')
  async validateImport(@Body() body: ValidateImportDto) {
    return this.dynamicImportService.validateImport(body);
  }

  @Post('execute')
  @UseGuards(JwtAuthGuard)
  async executeImport(@Body() body: ExecuteImportDto) {
    return this.dynamicImportService.executeImport(body);
  }

  @Get('history/:entityType')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Param('entityType') entityType: string) {
    return this.dynamicImportService.getImportHistory(entityType);
  }

  @Get('job-errors/:jobId')
  @UseGuards(JwtAuthGuard)
  async getJobErrors(@Param('jobId') jobId: string) {
    return this.dynamicImportService.getJobErrors(jobId);
  }

  @Get('templates/:entityType')
  async getTemplates(@Param('entityType') entityType: string) {
    return this.dynamicImportService.getTemplates(entityType);
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard)
  async saveTemplate(@Body() body: SaveImportTemplateDto) {
    return this.dynamicImportService.saveTemplate(body);
  }

  @Delete('templates/:id')
  @UseGuards(JwtAuthGuard)
  async deleteTemplate(@Param('id') id: string) {
    return this.dynamicImportService.deleteTemplate(id);
  }
}
