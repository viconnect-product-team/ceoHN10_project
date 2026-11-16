import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TrainingsService } from './trainings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Get('trainings')
  async listTrainings(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('format') format?: string,
    @Query('category') category?: string,
    @Query('isFixed') isFixed?: string,
  ) {
    return this.trainingsService.listTrainings({
      status,
      search,
      format,
      category,
      isFixed,
    });
  }

  @Get('association/trainings')
  async listAssociationTrainings(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('isFixed') isFixed?: string,
  ) {
    return this.trainingsService.listTrainings({ status, search, isFixed });
  }

  @Get('trainings/my/enrolled')
  @UseGuards(JwtAuthGuard)
  async getMyTrainings(@Request() req: any) {
    const memberId = req.user?.memberId || req.user?.id || req.user?.sub;
    const email = req.user?.email;
    return this.trainingsService.getMyAttendedTrainings(memberId || email);
  }

  @Get('trainings/:id')
  async getTraining(@Param('id') id: string) {
    return this.trainingsService.getTrainingById(id);
  }

  @Get('association/trainings/:id')
  async getAssociationTraining(@Param('id') id: string) {
    return this.trainingsService.getTrainingById(id);
  }

  @Post('trainings')
  @UseGuards(JwtAuthGuard)
  async createTraining(@Body() body: any, @Request() req: any) {
    return this.trainingsService.createTraining(body, req.user?.id);
  }

  @Put('trainings/:id')
  @UseGuards(JwtAuthGuard)
  async updateTraining(@Param('id') id: string, @Body() body: any) {
    return this.trainingsService.updateTraining(id, body);
  }

  @Delete('trainings/:id')
  @UseGuards(JwtAuthGuard)
  async deleteTraining(@Param('id') id: string) {
    return this.trainingsService.deleteTraining(id);
  }

  // ── ATTENDEES & CHECK-IN ──

  @Get('trainings/:id/attendees')
  @UseGuards(JwtAuthGuard)
  async listAttendees(@Param('id') id: string) {
    return this.trainingsService.listAttendees(id);
  }

  @Post('trainings/:id/register')
  async registerTraining(@Param('id') id: string, @Body() body: any) {
    return this.trainingsService.registerAttendee(id, body);
  }

  @Post('trainings/:id/join')
  @UseGuards(JwtAuthGuard)
  async joinTraining(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    const attendeeData = {
      userName: req.user?.name || body?.name || 'Hội viên',
      email: req.user?.email || body?.email || '',
      phone: req.user?.phone || body?.phone || '',
      memberId: req.user?.memberId || req.user?.id,
    };
    return this.trainingsService.registerAttendee(id, attendeeData);
  }

  @Patch('trainings/:id/attendees/:attendeeId/checkin')
  @UseGuards(JwtAuthGuard)
  async checkinAttendee(
    @Param('id') id: string,
    @Param('attendeeId') attendeeId: string,
  ) {
    return this.trainingsService.checkinAttendee(id, attendeeId);
  }

  // ── SEND SLIDES ──

  @Post('trainings/:id/send-slides')
  @UseGuards(JwtAuthGuard)
  async sendSlides(@Param('id') id: string, @Body('slideUrl') slideUrl?: string) {
    return this.trainingsService.sendSlides(id, slideUrl);
  }

  // ── FEEDBACKS ──

  @Get('trainings/:id/feedbacks')
  async listFeedbacks(@Param('id') id: string) {
    return this.trainingsService.listFeedbacks(id);
  }

  @Post('trainings/:id/feedbacks')
  async submitFeedback(@Param('id') id: string, @Body() body: any) {
    return this.trainingsService.submitFeedback(id, body);
  }

  // ── MEDIA (PHOTO/VIDEO ARCHIVE TO DOCUMENTS) ──

  @Post('trainings/:id/media')
  @UseGuards(JwtAuthGuard)
  async attachMedia(
    @Param('id') id: string,
    @Body('mediaUrl') mediaUrl: string,
    @Body('description') description?: string,
    @Body('department') department?: string,
    @Body('uploaderName') uploaderName?: string,
    @Body('docType') docType?: 'slide' | 'video' | 'photo' | 'media',
  ) {
    return this.trainingsService.attachMedia(id, mediaUrl, description, department, uploaderName, docType);
  }
}
