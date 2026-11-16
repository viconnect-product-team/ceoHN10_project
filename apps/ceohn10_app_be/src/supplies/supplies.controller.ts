import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SuppliesService, DeclareSupplyDto } from './supplies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('supplies')
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Get()
  async listSupplies(
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
  ) {
    return this.suppliesService.listSupplies(targetType, targetId);
  }

  @Get('sponsor-inventory')
  async getSponsorInventory() {
    return this.suppliesService.getAvailableSponsorItems();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async declareSupply(@Body() body: DeclareSupplyDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const userName = req.user?.name || req.user?.username || 'Ban Sự kiện & Hậu cần';
    return this.suppliesService.declareSupply(body, userId, userName);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateSupply(@Param('id') id: string, @Body() body: Partial<DeclareSupplyDto>) {
    return this.suppliesService.updateSupply(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteSupply(@Param('id') id: string) {
    return this.suppliesService.deleteSupply(id);
  }
}
