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

    // 2. Đồng bộ vào Quản lý tài liệu (documents) - Tự động tạo/lưu vào Folder riêng của sự kiện
    try {
      const folderCode = `FOLDER_EVT_${eventId}`;
      const folderRows = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.documents
        WHERE (code = ${folderCode} OR (is_folder = true AND event_id = ${eventId}))
        LIMIT 1
      `.catch(() => []);

      let folderId = folderRows[0]?.id;
      if (!folderId) {
        folderId = `doc_folder_${eventId}`;
        await this.prisma.$executeRaw`
          INSERT INTO public.documents (
            id, code, name, title, category, size, uploaded_by, type, is_folder, event_id, association_id, uploaded_at
          ) VALUES (
            ${folderId},
            ${folderCode},
            ${`📁 Sự kiện: ${eventName}`},
            ${`Thư mục ảnh tư liệu: ${eventName}`},
            'Ảnh Sự Kiện',
            '0 KB',
            'Ban Tổ Chức',
            'folder',
            true,
            ${eventId},
            ${assocId}::uuid,
            now()
          )
        `.catch((err) => {
          this.logger.warn(`[addEventPhoto] Không thể tạo folder tài liệu sự kiện: ${err?.message}`);
        });
      }

      // Lưu file ảnh vào bên trong Folder của sự kiện trong documents
      const docId = `doc_event_photo_${photoId}`;
      const docCode = `DOC_IMG_${photoId}`;
      await this.prisma.$executeRaw`
        INSERT INTO public.documents (
          id, code, name, title, file_path, file_url, category, size, uploaded_by, type, folder_id, is_folder, event_id, association_id, uploaded_at
        ) VALUES (
          ${docId},
          ${docCode},
          ${caption || `Ảnh: ${eventName}`},
          ${caption},
          ${data.photoUrl.trim()},
          ${data.photoUrl.trim()},
          'Ảnh Sự Kiện',
          '1.5 MB',
          ${uploadedBy},
          'image',
          ${folderId},
          false,
          ${eventId},
          ${assocId}::uuid,
          now()
        )
      `.catch((err) => {
        this.logger.warn(`[addEventPhoto] Lỗi lưu ảnh vào thư mục tài liệu: ${err?.message}`);
      });
    } catch (err: any) {
      this.logger.warn(`[addEventPhoto] Lỗi đồng bộ tài liệu: ${err?.message}`);
    }

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
