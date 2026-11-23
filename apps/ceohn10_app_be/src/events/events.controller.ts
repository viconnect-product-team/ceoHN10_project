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
  Response,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DataScopeInterceptor } from '../auth/data-scope.interceptor';
import { DataScope } from '../auth/data-scope.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('qr')
  async getQrImage(
    @Request() req: any,
    @Query('data') data: string,
    @Query('regId') regId: string,
    @Query('size') size: string,
    @Query('eventId') eventId: string,
    @Query('baseUrl') customBaseUrl: string,
    @Res() res: any,
  ) {
    let rawData = data || regId || 'CEO HN10-EVENT-TICKET';
    const reqOrigin = req?.headers?.origin || req?.headers?.referer;
    let detectedOrigin = '';
    if (reqOrigin) {
      try {
        const u = new URL(reqOrigin);
        detectedOrigin = `${u.protocol}//${u.host}`;
      } catch {}
    }
    const baseUrl = customBaseUrl || detectedOrigin || process.env.APP_URL || 'https://ceohn10.viconnect.vn';
    
    // Nếu rawData không phải là một liên kết Web (URL), chuyển đổi thành URL mở Form đăng ký công khai (Public) trên Web
    if (!rawData.startsWith('http://') && !rawData.startsWith('https://')) {
      const qp = new URLSearchParams();
      qp.set('action', 'register');
      if (eventId) qp.set('id', eventId);
      if (regId) qp.set('ticket', regId);
      qp.set('ref', 'qr_scan');
      qp.set('qrData', rawData);
      rawData = eventId
        ? `${baseUrl}/guest-event-register/${eventId}`
        : `${baseUrl}/guest-event-register/latest`;
    }

    const parsedSize = Math.min(
      Math.max(parseInt(size || '320', 10) || 320, 100),
      800,
    );
    try {
      const buffer = await QRCode.toBuffer(String(rawData), {
        width: parsedSize,
        margin: 1,
        color: {
          dark: '#003B95',
          light: '#FFFFFF',
        },
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.end(buffer);
    } catch (err: any) {
      res
        .status(500)
        .json({ error: 'Failed to generate QR code', message: err?.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-events')
  async listMyEvents(@Request() req: any) {
    return this.eventsService.listMyEvents(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('overview')
  async getEventsOverview(
    @Request() req: any,
    @Query('associationId') associationId?: string,
  ) {
    return this.eventsService.getEventsOverview(req.user.id, associationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'platform_admin',
    'superadmin',
    'adm',
    'admin',
    'bqt',
    'btt',
    'btv',
    'btk',
    'bxt',
    'btn',
    'quan_tri',
    'tong_thu_ky',
    'ban_thu_ky',
    'truong_ban_truyen_thong',
    'truong_ban_thanh_vien',
    'truong_ban_xuc_tien',
    'truong_ban_tai_chinh',
    'truong_ban_thien_nguyen',
    'member',
  )
  @Get('registrations')
  async listRegistrations(
    @Request() req: any,
    @Query('associationId') associationId?: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.eventsService.listRegistrations(
      req.user?.id || '',
      associationId,
      eventId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'platform_admin',
    'superadmin',
    'adm',
    'admin',
    'bqt',
    'btt',
    'btv',
    'btk',
    'bxt',
    'btn',
    'quan_tri',
    'tong_thu_ky',
    'ban_thu_ky',
    'truong_ban_truyen_thong',
    'truong_ban_thanh_vien',
    'truong_ban_xuc_tien',
    'truong_ban_tai_chinh',
    'truong_ban_thien_nguyen',
    'member',
  )
  @Get('with-registrations')
  async listEventsWithRegistrations(
    @Request() req: any,
    @Query('associationId') associationId?: string,
  ) {
    return this.eventsService.listEventsWithRegistrations(
      req.user.id,
      associationId,
    );
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(DataScopeInterceptor)
  @DataScope('event')
  async listEvents(
    @Request() req: any,
    @Query('associationId') associationId?: string,
  ) {
    return this.eventsService.listEvents(req.user?.id || '', associationId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(DataScopeInterceptor)
  @DataScope('event')
  async getEventById(@Request() req: any, @Param('id') id: string) {
    return this.eventsService.getEventById(req.user?.id || '', id);
  }

  @Get(':id/tickets')
  async getEventTickets(@Param('id') id: string) {
    return this.eventsService.getEventTickets(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt',
    'chu_tich', 'lop_truong', 'lop_pho', 'ban_su_kien', 'ban_thien_nguyen', 'truong_ban', 'quan_tri',
    'member', 'hoi_vien'
  )
  @Post()
  async createEvent(@Request() req: any, @Body() body: CreateEventDto) {
    return this.eventsService.createEvent(req.user.id, body);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/register')
  async registerForEvent(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body?: any,
  ) {
    const userId = req.user?.id;
    if (!userId || userId === 'guest') {
      return this.eventsService.guestRegister(id, body);
    }
    return this.eventsService.registerForEvent(userId, id, body);
  }

  /**
   * Đăng ký tham gia sự kiện công khai dành cho khách vãng lai quét mã QR tại bàn đón tiếp
   */
  @Post(':id/guest-register')
  async guestRegister(@Param('id') id: string, @Body() body: any) {
    return this.eventsService.guestRegister(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelEventRegistration(
    @Request() req: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.eventsService.cancelEventRegistration(req.user.id, id, reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt')
  @Post(':id/cancel-event')
  async cancelEvent(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string; refundPolicy?: string },
  ) {
    return this.eventsService.cancelEvent(req.user.id, id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt')
  @Put(':id')
  async updateEvent(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(req.user.id, id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt')
  @Put(':id/qr-fields')
  async updateQrFields(
    @Request() req: any,
    @Param('id') id: string,
    @Body('qrFields') qrFields: string[],
  ) {
    return this.eventsService.updateQrFields(req.user.id, id, qrFields);
  }

  @UseGuards(JwtAuthGuard)
  @Put('registrations/:id/seating')
  async updateRegistrationSeating(
    @Request() req: any,
    @Param('id') id: string,
    @Body('seatAssignment') seatAssignment: string,
  ) {
    return this.eventsService.updateRegistrationSeating(
      req.user.id,
      id,
      seatAssignment,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btc')
  @Post('registrations/:id/walk-in-cash')
  async recordWalkInCashPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body('amount') amount?: number,
  ) {
    return this.eventsService.recordWalkInCashPayment(req.user.id, id, amount);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btc')
  @Post('registrations/:id/send-payment-reminder')
  async sendPaymentReminder(@Request() req: any, @Param('id') id: string) {
    return this.eventsService.sendPaymentReminder(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'platform_admin',
    'superadmin',
    'adm',
    'admin',
    'bqt',
    'btt',
    'btc',
    'btk',
    'btv',
    'tong_thu_ky',
    'ban_thu_ky',
    'truong_ban_tai_chinh',
    'truong_ban_kiem_soat',
    'member',
  )
  @Post('registrations/:id/confirm-payment')
  async confirmPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body('method') method?: string,
  ) {
    return this.eventsService.confirmBankPayment(
      req.user.id,
      id,
      method || 'bank_transfer',
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'platform_admin',
    'superadmin',
    'adm',
    'admin',
    'bqt',
    'btt',
    'btc',
    'btk',
    'btv',
    'tong_thu_ky',
    'ban_thu_ky',
    'truong_ban_tai_chinh',
    'truong_ban_kiem_soat',
    'member',
  )
  @Post('registrations/:id/reconcile-payment')
  async reconcilePayment(@Request() req: any, @Param('id') id: string) {
    return this.eventsService.reconcilePayment(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt')
  @Post(':id/attendees/add-or-checkin')
  async addOrCheckinAttendee(
    @Request() req: any,
    @Param('id') eventId: string,
    @Body() body: any,
  ) {
    return this.eventsService.addOrCheckinAttendee(req.user.id, eventId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt')
  @Delete('registrations/:id')
  async deleteRegistration(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.id || req.user?.sub || 'system';
    return this.eventsService.deleteRegistration(userId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt')
  @Delete(':id')
  async deleteEvent(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.id || req.user?.sub || 'system';
    return this.eventsService.deleteEvent(userId, id);
  }

  // ── EVENT FEEDBACK & RATINGS (UC-2) ──

  @Get(':id/feedbacks')
  async listEventFeedbacks(@Param('id') id: string) {
    return this.eventsService.listEventFeedbacks(id);
  }

  @Post(':id/feedbacks')
  async submitEventFeedback(@Param('id') id: string, @Body() body: any) {
    return this.eventsService.submitEventFeedback(id, body);
  }

  // ── ATTACH MEDIA (PHOTO/VIDEO ARCHIVE TO DOCUMENTS) ──

  @Post(':id/media')
  @UseGuards(JwtAuthGuard)
  async attachEventMedia(
    @Param('id') id: string,
    @Body('mediaUrl') mediaUrl: string,
    @Body('description') description?: string,
  ) {
    return this.eventsService.attachEventMedia(id, mediaUrl, description);
  }

  // ── 1-TIME CHECKIN, CHECKOUT & TICKET LOOKUP (WEB/ZALO/APP) ───────────────

  @Get('ticket-status/:ticketCode')
  async getTicketStatus(@Param('ticketCode') ticketCode: string) {
    return this.eventsService.getTicketStatus(ticketCode);
  }

  @Post('ticket-checkin')
  async performTicketCheckin(
    @Body('ticketCode') ticketCode: string,
    @Body('method') method?: string,
    @Body('attendedParts') attendedParts?: string[],
  ) {
    return this.eventsService.performTicketCheckin(ticketCode, method || 'web', attendedParts);
  }

  @Post('ticket-checkout')
  async performTicketCheckout(@Body('ticketCode') ticketCode: string) {
    return this.eventsService.performTicketCheckout(ticketCode);
  }

  // ── OFFLINE CHECKIN ENGINE (HỖ TRỢ KHU VỰC MẤT SÓNG / KHÔNG CÓ MẠNG) ─────────

  @Get(':id/offline-dataset')
  async getEventOfflineDataset(@Param('id') eventId: string) {
    return this.eventsService.getEventOfflineDataset(eventId);
  }

  @Post('batch-sync-checkin')
  async batchSyncCheckin(
    @Body('eventId') eventId: string,
    @Body('items') items: Array<{ ticketCode: string; checkedInAt?: string; method?: string; attendedParts?: string[] }>,
  ) {
    return this.eventsService.batchSyncCheckin(eventId, items || []);
  }

  // ── DYNAMIC EVENT FEE CODES (TÍCH HỢP SEPAY DYNAMIC) ─────────────────────────

  @Get(':id/fee-items')
  async listEventFeeItems(@Param('id') id: string) {
    return this.eventsService.listEventFeeItems(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt')
  @Post(':id/fee-items')
  async createEventFeeItem(
    @Param('id') id: string,
    @Body() body: { feeCode: string; feeName: string; amount: number; description?: string },
  ) {
    return this.eventsService.createEventFeeItem(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt')
  @Put(':id/fee-items/:feeId')
  async updateEventFeeItem(
    @Param('id') id: string,
    @Param('feeId') feeId: string,
    @Body() body: any,
  ) {
    return this.eventsService.updateEventFeeItem(id, feeId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt')
  @Delete(':id/fee-items/:feeId')
  async deleteEventFeeItem(
    @Param('id') id: string,
    @Param('feeId') feeId: string,
  ) {
    return this.eventsService.deleteEventFeeItem(id, feeId);
  }

  @Post(':id/fee-items/:feeId/sepay-qr')
  async generateSepayFeeQr(
    @Param('id') id: string,
    @Param('feeId') feeId: string,
    @Body('ticketCode') ticketCode: string,
  ) {
    return this.eventsService.generateSepayFeeQr(id, feeId, ticketCode);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt', 'btk', 'bxt', 'member')
  @Post(':id/import-attendees')
  async importAttendees(
    @Param('id') id: string,
    @Body() body: { records: any[]; customColumns?: string[]; associationId?: string },
  ) {
    return this.eventsService.importAttendeesFromFile(
      id,
      body.records || [],
      body.customColumns || [],
      body.associationId,
    );
  }

  @Get(':id/dynamic-columns')
  async getDynamicColumns(@Param('id') id: string) {
    return this.eventsService.getEventDynamicColumns(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt', 'btk', 'bxt', 'member')
  @Patch('registrations/:id/payment-status')
  async updateRegistrationPaymentStatus(
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: 'paid' | 'unpaid' | 'free',
  ) {
    return this.eventsService.updateRegistrationPaymentStatus(id, paymentStatus);
  }

  @Get(':id/checked-in-candidates')
  async getCheckedInCandidates(@Param('id') id: string) {
    return this.eventsService.getCheckedInCandidates(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt', 'btk', 'bxt', 'member')
  @Post(':id/photos')
  async addEventPhoto(
    @Param('id') id: string,
    @Body() body: { photoUrl: string; caption?: string; uploadedBy?: string; associationId?: string },
  ) {
    return this.eventsService.addEventPhoto(id, body);
  }

  @Get(':id/photos')
  async getEventPhotos(@Param('id') id: string) {
    return this.eventsService.getEventPhotos(id);
  }

  @Post(':id/feedback')
  async saveEventFeedback(
    @Param('id') id: string,
    @Body() body: { memberName: string; memberPhone?: string; memberEmail?: string; rating: number; content: string },
  ) {
    return this.eventsService.saveEventFeedback(id, body);
  }

  @Get(':id/feedback')
  async getEventFeedback(@Param('id') id: string) {
    return this.eventsService.getEventFeedback(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'superadmin', 'adm', 'admin', 'bqt', 'btt', 'btk', 'bxt', 'member')
  @Post(':id/send-post-event-recap')
  async sendPostEventRecap(@Param('id') id: string) {
    return this.eventsService.sendPostEventRecap(id);
  }
}
