import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { ZaloService } from '../../zalo/zalo.service';

function sanitizeGalleryUrl(url?: string | null): string {
  if (!url) return '';
  const s = url.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return '';
}

@Injectable()
export class EventsFeedbackService {
  private readonly logger = new Logger(EventsFeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly zaloService: ZaloService
  ) {}

  async saveEventFeedback(
    eventId: string,
    data: { memberName: string; memberPhone?: string; memberEmail?: string; rating: number; content: string }
  ) {
    if (!eventId) throw new BadRequestException('Mã sự kiện không được để trống');
    if (!data.content || !data.content.trim()) {
      throw new BadRequestException('Nội dung đánh giá, góp ý không được để trống');
    }

    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT name, title, association_id FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);
    const eventName = eventRows[0]?.name || eventRows[0]?.title || 'Sự kiện CEO HN10';
    const assocId = eventRows[0]?.association_id || 'c1983000-0000-4000-8000-000000001983';

    const feedbackId = `fb_ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const rating = Math.min(Math.max(Number(data.rating || 5), 1), 5);
    const memberName = data.memberName?.trim() || 'Đại biểu ẩn danh';
    const memberPhone = data.memberPhone?.trim() || '';
    const memberEmail = data.memberEmail?.trim() || '';
    const content = data.content.trim();

    // 1. Lưu vào event_feedback
    await this.prisma.$executeRaw`
      INSERT INTO public.event_feedback (
        id, event_id, member_name, member_phone, member_email, rating, content, created_at
      ) VALUES (
        ${feedbackId},
        ${eventId},
        ${memberName},
        ${memberPhone},
        ${memberEmail},
        ${rating},
        ${content},
        now()
      )
    `;

    // 2. Lưu vào feedbacks của CRM
    await this.prisma.$executeRaw`
      INSERT INTO public.feedbacks (
        id, title, content, rating, type, status, association_id, created_at, user_id
      ) VALUES (
        ${feedbackId},
        ${`Đánh giá sự kiện: ${eventName}`},
        ${`[${rating} Sao] ${content} - Người gửi: ${memberName} (${memberPhone || memberEmail || 'Không để lại thông tin'})`},
        ${rating},
        'event_feedback',
        'pending',
        ${assocId}::uuid,
        now(),
        NULL
      )
    `.catch((err) => {
      this.logger.warn(`[saveEventFeedback] Lỗi đồng bộ feedback CRM: ${err?.message}`);
    });

    return {
      ok: true,
      feedbackId,
      message: 'Cảm ơn bạn đã gửi đánh giá, góp ý cho sự kiện CLB CEO HN10!',
    };
  }

  async getEventFeedback(eventId: string) {
    if (!eventId) throw new BadRequestException('Mã sự kiện không được để trống');
    const list = await this.prisma.$queryRaw<any[]>`
      SELECT id, event_id, member_name, member_phone, member_email, rating, content, created_at
      FROM public.event_feedback
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
    `.catch(() => []);

    return {
      ok: true,
      eventId,
      total: list.length,
      feedbacks: list,
    };
  }

  async sendPostEventRecap(eventId: string) {
    if (!eventId) throw new BadRequestException('Mã sự kiện không được để trống');

    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, title, photo_gallery_url FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);
    if (eventRows.length === 0) {
      throw new NotFoundException(`Không tìm thấy sự kiện ${eventId}`);
    }
    const event = eventRows[0];
    const eventName = event.name || event.title || 'Sự kiện CLB CEO HN10';
    const galleryUrl = sanitizeGalleryUrl(event.photo_gallery_url) || `https://ceohn10.viconnect.vn/guest-event-feedback/${eventId}`;
    const feedbackUrl = `https://ceohn10.viconnect.vn/guest-event-feedback/${eventId}`;

    const checkedInAttendees = await this.prisma.$queryRaw<any[]>`
      SELECT id, member_name, email, phone 
      FROM public.event_registrations 
      WHERE event_id = ${eventId}
        AND (checked_in_at IS NOT NULL OR status = 'attended' OR status = 'checked_in')
    `.catch(() => []);

    let sentEmailCount = 0;
    let sentZaloCount = 0;

    for (const att of checkedInAttendees) {
      const email = (att.email || '').trim().toLowerCase();
      const phone = (att.phone || '').trim();
      const memberName = att.member_name || 'Quý Hội Viên / Đại Biểu';

      if (email && email.includes('@')) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; border-bottom: 2px solid #003B95; padding-bottom: 16px;">
              <h2 style="color: #003B95; margin: 0;">CLB DOANH NHÂN CEO HN10 (HANOIBA)</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Cảm Ơn Quý Đại Biểu Đã Tham Dự Sự Kiện</p>
            </div>
            <div style="padding: 20px 0; color: #1e293b; line-height: 1.6;">
              <p>Kính gửi: <strong>${memberName}</strong>,</p>
              <p>Ban Điều Hành CLB Doanh Nhân CEO HN10 xin gửi lời cảm ơn chân thành và sâu sắc nhất tới Quý Đại Biểu đã dành thời gian quý báu đến tham dự chương trình <strong>"${eventName}"</strong>.</p>
              <div style="margin: 24px 0; text-align: center;">
                <a href="${galleryUrl}" style="display: inline-block; background-color: #003B95; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-right: 8px;">
                  📸 Xem Trọn Bộ Album Ảnh Sự Kiện
                </a>
                <a href="${feedbackUrl}" style="display: inline-block; background-color: #BA2025; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                  ⭐ Gửi Đánh Giá &amp; Góp Ý
                </a>
              </div>
            </div>
          </div>
        `;
        this.mailService.dispatchSmtpEmail({
          to: email,
          subject: `[CEO HN10] Album Ảnh & Khảo Sát Đánh Giá Sự Kiện: ${eventName}`,
          html: emailHtml,
        }).then(() => { sentEmailCount++; }).catch(() => {});
      }

      if (phone) {
        this.zaloService.sendAutoNotification({
          recipientPhone: phone,
          recipientName: memberName,
          title: `[CEO HN10] Tổng kết sự kiện ${eventName}`,
          content: `Cảm ơn Quý Doanh nhân đã tham gia sự kiện ${eventName}. Xem album ảnh: ${galleryUrl} và đánh giá sự kiện: ${feedbackUrl}`,
        }).then(() => { sentZaloCount++; }).catch(() => {});
      }
    }

    return {
      ok: true,
      success: true,
      message: `Đã gửi Recap tổng kết sự kiện tới ${checkedInAttendees.length} đại biểu đã check-in.`,
      stats: {
        totalCheckedIn: checkedInAttendees.length,
        sentEmailCount,
        sentZaloCount,
        galleryUrl,
        feedbackUrl,
      },
    };
  }
}
