import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LandingService } from './landing.service';
import type { LandingWebConfig } from './landing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateLandingWebDto,
  ApplySubdomainDto,
  TestApiConnectorDto,
  CastLandingVideoVoteDto,
} from './dto/landing.dto';

@Controller('admin/landing-webs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'president', 'vice_president', 'superadmin', 'platform_admin', 'quan_tri', 'lop_truong', 'lop_pho', 'truong_ban_chuyen_trach')
export class LandingAdminController {
  constructor(private readonly landingService: LandingService) {}

  @Get()
  async getAll() {
    return this.landingService.getAllLandingWebs();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.landingService.getLandingWebById(id);
  }

  @Post()
  async create(@Body() body: CreateLandingWebDto) {
    return this.landingService.createLandingWeb(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.landingService.updateLandingWeb(
      id,
      body as Partial<LandingWebConfig>,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return this.landingService.deleteLandingWeb(id);
  }

  @Post(':id/apply-subdomain')
  async applySubdomain(
    @Param('id') id: string,
    @Body() body: ApplySubdomainDto,
  ) {
    return this.landingService.applySubdomain(id, body.subdomain);
  }

  @Post('test-api')
  @HttpCode(HttpStatus.OK)
  async testApi(@Body() body: TestApiConnectorDto) {
    return this.landingService.testApiConnector(body as any);
  }

  @Get(':id/vote-stats')
  async getAdminVoteStats(@Param('id') id: string) {
    return this.landingService.getVideoVotingStats(id);
  }
}

@Controller(['public/landing-webs', 'api/public/landing-webs'])
export class LandingPublicController {
  constructor(private readonly landingService: LandingService) {}

  @Get(':slugOrSubdomain')
  async getPublic(@Param('slugOrSubdomain') slugOrSubdomain: string) {
    return this.landingService.getPublicLandingWeb(slugOrSubdomain);
  }

  @Get(':slugOrSubdomain/vote-stats')
  async getVoteStats(@Param('slugOrSubdomain') slugOrSubdomain: string) {
    return this.landingService.getVideoVotingStats(slugOrSubdomain);
  }

  @Post(':slugOrSubdomain/vote')
  @HttpCode(HttpStatus.OK)
  async castVote(
    @Param('slugOrSubdomain') slugOrSubdomain: string,
    @Body() body: CastLandingVideoVoteDto,
  ) {
    return this.landingService.castVideoVote(slugOrSubdomain, body);
  }
}
