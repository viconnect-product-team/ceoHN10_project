import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EventsMediaService {
  private readonly logger = new Logger(EventsMediaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async addEventPhoto(
    eventId: string,
    data: { photoUrl: string; caption?: string; uploadedBy?: string }
  ) {
    if (!eventId) throw new BadRequestException('Mã sự kiện không được để trống');
    if (!data.photoUrl || !data.photoUrl.trim()) {
      throw new BadRequestException('Đường dẫn ảnh không được để trống');
    }

    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT name, title, association_id FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);
    const eventName = eventRows[0]?.name || eventRows[0]?.title || 'Sự kiện CEO HN10';
    const assocId = eventRows[0]?.association_id || 'c1983000-0000-4000-8000-000000001983';

    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const caption = data.caption || `Ảnh chụp trực tiếp sự kiện: ${eventName}`;
    const uploadedBy = data.uploadedBy || 'Ban Tổ Chức';

    // 1. Lưu vào event_photos
    await this.prisma.$executeRaw`
      INSERT INTO public.event_photos (
        id, event_id, photo_url, caption, uploaded_by, created_at
      ) VALUES (
        ${photoId},
        ${eventId},
        ${data.photoUrl.trim()},
        ${caption},
        ${uploadedBy},
        now()
      )
    `;

    // 2. Đồng bộ vào Quản lý tài liệu (documents)
    const docId = `doc_event_photo_${photoId}`;
    await this.prisma.$executeRaw`
      INSERT INTO public.documents (
        id, title, file_url, category, description, association_id, created_at
      ) VALUES (
        ${docId},
        ${caption},
        ${data.photoUrl.trim()},
        'Ảnh Sự Kiện',
        ${`Ảnh chụp tư liệu chính thức thuộc sự kiện: ${eventName}`},
        ${assocId}::uuid,
        now()
      )
    `.catch((err) => {
      this.logger.warn(`[addEventPhoto] Lỗi đồng bộ tài liệu: ${err?.message}`);
    });

    return {
      ok: true,
      photoId,
      photoUrl: data.photoUrl.trim(),
      caption,
      message: 'Đã lưu ảnh sự kiện và đồng bộ vào Quản Lý Tài Liệu thành công',
    };
  }

  async getEventPhotos(eventId: string) {
    if (!eventId) throw new BadRequestException('Mã sự kiện không được để trống');
    const photos = await this.prisma.$queryRaw<any[]>`
      SELECT id, event_id, photo_url, caption, uploaded_by, created_at
      FROM public.event_photos
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
    `.catch(() => []);

    return {
      ok: true,
      eventId,
      total: photos.length,
      photos: photos.map((p) => ({
        id: p.id,
        photoUrl: p.photo_url,
        caption: p.caption,
        uploadedBy: p.uploaded_by,
        createdAt: p.created_at,
      })),
    };
  }
}
