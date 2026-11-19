import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DynamicFieldsService } from './dynamic-fields.service';

@Controller('dynamic-fields')
export class DynamicFieldsController {
  constructor(private readonly dynamicFieldsService: DynamicFieldsService) {}

  @Get('schema/:entityType')
  async getSchema(@Param('entityType') entityType: string) {
    return this.dynamicFieldsService.getSchemaByEntityType(entityType);
  }

  @Post('fields')
  @UseGuards(JwtAuthGuard)
  async addField(@Body() body: any) {
    return this.dynamicFieldsService.addField(body);
  }

  @Put('fields/:id')
  @UseGuards(JwtAuthGuard)
  async updateField(@Param('id') id: string, @Body() body: any) {
    return this.dynamicFieldsService.updateField(id, body);
  }

  @Delete('fields/:id')
  @UseGuards(JwtAuthGuard)
  async deleteField(@Param('id') id: string) {
    return this.dynamicFieldsService.deleteField(id);
  }
}
