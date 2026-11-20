import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, RequireActions, DataScopeLevel } from '../auth/roles.decorator';
import { MasterSettingsService } from './master-settings.service';

@Controller('admin/master-settings')
export class MasterSettingsController {
  constructor(private readonly masterSettingsService: MasterSettingsService) {}

  // ── SEPAY DYNAMIC CONFIG ──────────────────────────────────────────

  @Get('sepay')
  async getSepayConfig() {
    return this.masterSettingsService.getSepayConfig();
  }

  @Put('sepay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'admin')
  @RequireActions('SYS_SEPAY_CONFIG')
  @DataScopeLevel('ALL')
  async saveSepayConfig(@Request() req: any, @Body() body: any) {
    const userEmail = req.user?.email || req.user?.username || 'admin@ceohn10.vn';
    return this.masterSettingsService.saveSepayConfig(body, userEmail);
  }

  // ── ZALO OA INTEGRATION CONFIG ─────────────────────────────────────

  @Get('zalo')
  async getZaloConfig() {
    return this.masterSettingsService.getZaloConfig();
  }

  @Put('zalo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'admin')
  @RequireActions('SYS_ZALO_CONFIG')
  @DataScopeLevel('ALL')
  async saveZaloConfig(@Request() req: any, @Body() body: any) {
    const userEmail = req.user?.email || req.user?.username || 'admin@ceohn10.vn';
    return this.masterSettingsService.saveZaloConfig(body, userEmail);
  }

  // ── PLATFORMS CATALOG ─────────────────────────────────────────────

  @Get('platforms')
  async getPlatforms() {
    return this.masterSettingsService.getPlatforms();
  }

  @Post('platforms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin')
  @RequireActions('SYS_PLATFORM_MANAGE')
  @DataScopeLevel('ALL')
  async addPlatform(@Request() req: any, @Body() body: any) {
    const userEmail = req.user?.email || req.user?.username || 'admin@ceohn10.vn';
    return this.masterSettingsService.addPlatform(body, userEmail);
  }

  @Put('platforms/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin')
  @RequireActions('SYS_PLATFORM_MANAGE')
  @DataScopeLevel('ALL')
  async updatePlatform(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userEmail = req.user?.email || req.user?.username || 'admin@ceohn10.vn';
    return this.masterSettingsService.updatePlatform(id, body, userEmail);
  }

  @Delete('platforms/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin')
  @RequireActions('SYS_PLATFORM_MANAGE')
  @DataScopeLevel('ALL')
  async deletePlatform(@Request() req: any, @Param('id') id: string) {
    const userEmail = req.user?.email || req.user?.username || 'admin@ceohn10.vn';
    return this.masterSettingsService.deletePlatform(id, userEmail);
  }
}
