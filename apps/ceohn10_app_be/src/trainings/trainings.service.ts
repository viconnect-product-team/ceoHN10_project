import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureSchema();
  }

  async ensureSchema() {
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.trainings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          tagline TEXT,
          instructor_name TEXT,
          instructor_title TEXT,
          instructor_company TEXT,
          description TEXT,
          category TEXT DEFAULT 'Kỹ năng lãnh đạo',
          format TEXT DEFAULT 'hybrid',
          status TEXT DEFAULT 'upcoming',
          is_fixed BOOLEAN DEFAULT false,
          schedule_type TEXT DEFAULT 'non_fixed',
          agenda JSONB DEFAULT '[]'::jsonb,
          start_time TIMESTAMPTZ,
          end_time TIMESTAMPTZ,
          location TEXT,
          address TEXT,
          room_id TEXT,
          room_url TEXT,
          meeting_passcode TEXT DEFAULT '198388',
          video_provider TEXT DEFAULT 'jitsi',
          max_attendees INTEGER DEFAULT 100,
          attendee_count INTEGER DEFAULT 0,
          ticket_tiers JSONB DEFAULT '[]'::jsonb,
          materials JSONB DEFAULT '[]'::jsonb,
          slide_url TEXT,
          media_url TEXT,
          document_id UUID,
          cover_image TEXT,
          registration_url TEXT,
          open_registration BOOLEAN DEFAULT true,
          created_by UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      const columnsToAdd = [
        `ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT false;`,
        `ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS schedule_type TEXT DEFAULT 'non_fixed';`,
        `ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS is_custom_session BOOLEAN DEFAULT false;`,
        `ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;`,
        `ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS expected_attendees INTEGER DEFAULT 1;`,
        `ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS ticket_fee NUMERIC DEFAULT 0;`,
        `ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS fund_type TEXT DEFAULT 'personal_pool';`,
        `ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS agenda JSONB DEFAULT '[]'::jsonb;`,
        `ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS slide_url TEXT;`,
        `ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS media_url TEXT;`,
        `ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS document_id UUID;`,
      ];

      for (const sql of columnsToAdd) {
        await this.prisma.$executeRawUnsafe(sql).catch(() => {});
      }
    } catch (e) {
      console.warn('Could not ensure trainings schema:', e);
    }
  }

  async listTrainings(query?: {
    status?: string;
    search?: string;
    format?: string;
    category?: string;
    isFixed?: string | boolean;
  }) {
    let sqlWhere = `1=1`;
    if (query?.status && query.status !== 'all') {
      sqlWhere += ` AND status = '${query.status.replace(/'/g, "''")}'`;
    }
    if (query?.format && query.format !== 'all') {
      sqlWhere += ` AND format = '${query.format.replace(/'/g, "''")}'`;
    }
    if (query?.category && query.category !== 'all') {
      sqlWhere += ` AND category = '${query.category.replace(/'/g, "''")}'`;
    }
    if (query?.isFixed !== undefined && query.isFixed !== 'all') {
      const isF = query.isFixed === true || query.isFixed === 'true';
      sqlWhere += ` AND is_fixed = ${isF}`;
    }
    if (query?.search?.trim()) {
      const s = query.search.trim().replace(/'/g, "''");
      sqlWhere += ` AND (title ILIKE '%${s}%' OR instructor_name ILIKE '%${s}%' OR description ILIKE '%${s}%' OR location ILIKE '%${s}%')`;
    }

    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM public.trainings
      WHERE ${sqlWhere}
      ORDER BY is_fixed DESC, start_time ASC NULLS LAST, created_at DESC;
    `).catch(() => []);

    return rows.map((r) => this.mapTrainingRow(r));
  }

  private mapTrainingRow(r: any) {
    let agenda = [];
    if (r.agenda) {
      try {
        agenda = Array.isArray(r.agenda) ? r.agenda : JSON.parse(r.agenda);
      } catch {
        agenda = [];
      }
    }

    return {
      id: r.id,
      title: r.title,
      tagline: r.tagline || '',
      instructorName: r.instructor_name || '',
      instructorTitle: r.instructor_title || '',
      instructorCompany: r.instructor_company || '',
      description: r.description || '',
      category: r.category || 'Kỹ năng lãnh đạo',
      format: r.format || 'hybrid',
      status: r.status || 'upcoming',
      isFixed: Boolean(r.is_fixed),
      scheduleType: r.schedule_type || (r.is_fixed ? 'fixed_saturday' : 'non_fixed'),
      isCustomSession: Boolean(r.is_custom_session),
      totalCost: Number(r.total_cost || 0),
      expectedAttendees: Number(r.expected_attendees || 1),
      ticketFee: Number(r.ticket_fee || 0),
      fundType: r.fund_type || 'personal_pool',
      agenda,
      startTime: r.start_time,
      endTime: r.end_time,
      location: r.location || '',
      address: r.address || '',
      roomId: r.room_id || '',
      roomUrl: r.room_url || '',
      meetingPasscode: r.meeting_passcode || '198388',
      videoProvider: r.video_provider || 'jitsi',
      maxAttendees: Number(r.max_attendees || 100),
      attendeeCount: Number(r.attendee_count || 0),
      ticketTiers: r.ticket_tiers || [],
      materials: r.materials || [],
      slideUrl: r.slide_url || '',
      mediaUrl: r.media_url || '',
      documentId: r.document_id || null,
      coverImage: r.cover_image || '',
      registrationUrl: r.registration_url || '',
      openRegistration: r.open_registration !== false,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async getTrainingById(id: string) {
    const list = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM public.trainings WHERE id::text = '${id.replace(/'/g, "''")}' LIMIT 1;
    `).catch(() => []);
    if (!list.length) throw new NotFoundException('Không tìm thấy phòng đào tạo');
    return this.mapTrainingRow(list[0]);
  }

  async createTraining(data: any, createdByUserId?: string) {
    if (!data.title?.trim()) {
      throw new BadRequestException('Vui lòng nhập tiêu đề khóa đào tạo');
    }

    const isFixed = Boolean(data.isFixed || data.scheduleType === 'fixed_saturday');
    const scheduleType = data.scheduleType || (isFixed ? 'fixed_saturday' : 'non_fixed');
    const agendaJson = JSON.stringify(Array.isArray(data.agenda) ? data.agenda : []);
    const materialsJson = JSON.stringify(Array.isArray(data.materials) ? data.materials : []);
    const maxAtt = parseInt(data.maxAttendees || 100, 10);
    const safeCreatedBy = createdByUserId && createdByUserId.length === 36 ? `'${createdByUserId}'::uuid` : 'NULL';

    const isCustomSession = Boolean(data.isCustomSession || scheduleType === 'custom' || scheduleType === 'custom_session');
    const totalCost = Math.max(0, Number(data.totalCost || 0));
    const expectedAttendees = Math.max(1, Number(data.expectedAttendees || data.maxAttendees || 1));
    const calculatedFee = isCustomSession && totalCost > 0 ? Math.round(totalCost / expectedAttendees) : Number(data.ticketFee || 0);
    const fundType = data.fundType || (isCustomSession ? 'personal_pool' : 'general');

    let finalTiers = Array.isArray(data.ticketTiers) && data.ticketTiers.length > 0 ? data.ticketTiers : [];
    if (isCustomSession && finalTiers.length === 0) {
      finalTiers = [{
        name: 'Vé Buổi Học Riêng (Quỹ cá nhân)',
        price: calculatedFee,
        quantity: expectedAttendees,
        description: `Phí tự động chia đều: ${calculatedFee.toLocaleString('vi-VN')} đ/người. Quỹ cá nhân riêng biệt.`
      }];
    }
    const tiersJson = JSON.stringify(finalTiers);

    const insertSql = `
      INSERT INTO public.trainings (
        title, tagline, instructor_name, instructor_title, instructor_company,
        description, category, format, status, is_fixed, schedule_type,
        is_custom_session, total_cost, expected_attendees, ticket_fee, fund_type,
        agenda, start_time, end_time, location, address, max_attendees, attendee_count,
        ticket_tiers, materials, slide_url, media_url, cover_image, registration_url,
        open_registration, created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17::jsonb, $18, $19, $20, $21, $22, 0,
        $23::jsonb, $24::jsonb, $25, $26, $27, $28,
        $29, ${safeCreatedBy}, now(), now()
      ) RETURNING id;
    `;

    const res = await this.prisma.$queryRawUnsafe<any[]>(
      insertSql,
      data.title.trim(),
      data.tagline || '',
      data.instructorName || '',
      data.instructorTitle || '',
      data.instructorCompany || '',
      data.description || '',
      data.category || 'Kỹ năng lãnh đạo',
      data.format || 'hybrid',
      data.status || 'upcoming',
      isFixed,
      scheduleType,
      isCustomSession,
      totalCost,
      expectedAttendees,
      calculatedFee,
      fundType,
      agendaJson,
      data.startTime ? new Date(data.startTime) : null,
      data.endTime ? new Date(data.endTime) : null,
      data.location || '',
      data.address || '',
      maxAtt,
      tiersJson,
      materialsJson,
      data.slideUrl || '',
      data.mediaUrl || '',
      data.coverImage || '',
      data.registrationUrl || '',
      data.openRegistration !== false,
    );

    const newId = res[0]?.id;

    // Tự động bắn thông báo cho Ban Sự Kiện & Hậu Cần chuẩn bị trang thiết bị/vật phẩm
    if (newId) {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO public.business_notifications (
          id, source_domain, source_record_id, event_kind, notification_kind,
          title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), 'trainings', $1, 'training_created', 'task_request',
          $2, $3, $4::jsonb, 'high', 'delivered', 'crm_platform', 'crm_platform', now(), now()
        );
      `,
        String(newId),
        `Ban Học Tập vừa tạo buổi học mới: ${data.title.trim()}`,
        `Kính mời Ban Sự Kiện & Hậu Cần lập dự trù vật tư, thiết bị cần thiết và lên báo cáo chuẩn bị cho buổi học.`,
        JSON.stringify({
          targetRoute: '/association/trainings',
          trainingId: String(newId),
          trainingTitle: data.title.trim(),
          department: 'Ban Sự Kiện – Hậu Cần'
        })
      ).catch(() => {});
    }

    return this.getTrainingById(newId);
  }

  async updateTraining(id: string, data: any) {
    await this.getTrainingById(id);

    const isFixed = data.isFixed !== undefined ? Boolean(data.isFixed) : undefined;
    const scheduleType = data.scheduleType !== undefined ? data.scheduleType : undefined;
    const agendaJson = data.agenda !== undefined ? JSON.stringify(data.agenda) : undefined;

    const updates: string[] = [];
    if (data.title) updates.push(`title = '${data.title.replace(/'/g, "''")}'`);
    if (data.tagline !== undefined) updates.push(`tagline = '${data.tagline.replace(/'/g, "''")}'`);
    if (data.instructorName) updates.push(`instructor_name = '${data.instructorName.replace(/'/g, "''")}'`);
    if (data.instructorTitle !== undefined) updates.push(`instructor_title = '${data.instructorTitle.replace(/'/g, "''")}'`);
    if (data.instructorCompany !== undefined) updates.push(`instructor_company = '${data.instructorCompany.replace(/'/g, "''")}'`);
    if (data.description !== undefined) updates.push(`description = '${data.description.replace(/'/g, "''")}'`);
    if (data.category !== undefined) updates.push(`category = '${data.category.replace(/'/g, "''")}'`);
    if (data.format !== undefined) updates.push(`format = '${data.format.replace(/'/g, "''")}'`);
    if (data.status) updates.push(`status = '${data.status.replace(/'/g, "''")}'`);
    if (isFixed !== undefined) updates.push(`is_fixed = ${isFixed}`);
    if (scheduleType !== undefined) updates.push(`schedule_type = '${scheduleType.replace(/'/g, "''")}'`);
    if (agendaJson !== undefined) updates.push(`agenda = '${agendaJson.replace(/'/g, "''")}'::jsonb`);
    if (data.slideUrl !== undefined) updates.push(`slide_url = '${data.slideUrl.replace(/'/g, "''")}'`);
    if (data.mediaUrl !== undefined) updates.push(`media_url = '${data.mediaUrl.replace(/'/g, "''")}'`);
    if (data.startTime) updates.push(`start_time = '${new Date(data.startTime).toISOString()}'::timestamptz`);
    if (data.endTime) updates.push(`end_time = '${new Date(data.endTime).toISOString()}'::timestamptz`);
    if (data.location !== undefined) updates.push(`location = '${data.location.replace(/'/g, "''")}'`);
    if (data.address !== undefined) updates.push(`address = '${data.address.replace(/'/g, "''")}'`);
    if (data.maxAttendees) updates.push(`max_attendees = ${parseInt(data.maxAttendees)}`);
    if (data.coverImage !== undefined) updates.push(`cover_image = '${data.coverImage.replace(/'/g, "''")}'`);
    if (data.openRegistration !== undefined) updates.push(`open_registration = ${data.openRegistration ? 'true' : 'false'}`);
    updates.push(`updated_at = now()`);

    await this.prisma.$executeRawUnsafe(`
      UPDATE public.trainings SET ${updates.join(', ')} WHERE id::text = '${id.replace(/'/g, "''")}';
    `);

    return this.getTrainingById(id);
  }

  async deleteTraining(id: string) {
    await this.prisma.$executeRawUnsafe(`
      DELETE FROM public.trainings WHERE id::text = '${id.replace(/'/g, "''")}';
    `);
    return { success: true, message: 'Đã xóa khóa học thành công' };
  }

  // ── ATTENDEES & CHECK-IN (UC-3) ──────────────────────────────────────────

  async registerAttendee(trainingId: string, attendeeData: any) {
    const training = await this.getTrainingById(trainingId);

    const userName = (attendeeData?.userName || attendeeData?.name || '').trim();
    const email = (attendeeData?.email || '').trim().toLowerCase();
    const phone = (attendeeData?.phone || '').trim();
    const company = (attendeeData?.company || '').trim();
    const memberId = attendeeData?.memberId && attendeeData.memberId.length === 36 ? attendeeData.memberId : null;

    if (!userName) {
      throw new BadRequestException('Vui lòng cung cấp họ và tên học viên');
    }

    const safeMemberId = memberId ? `'${memberId}'::uuid` : 'NULL';

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.training_attendees (
        training_id, member_id, user_name, email, phone, company, status, registered_at
      ) VALUES (
        $1::uuid, ${safeMemberId}, $2, $3, $4, $5, 'registered', now()
      );
    `, trainingId, userName, email, phone, company).catch(() => {});

    // Update attendee count
    await this.prisma.$executeRawUnsafe(`
      UPDATE public.trainings
      SET attendee_count = (SELECT COUNT(*) FROM public.training_attendees WHERE training_id = $1::uuid)
      WHERE id = $1::uuid;
    `, trainingId);

    return {
      success: true,
      message: `Đăng ký khóa học "${training.title}" thành công!`,
    };
  }

  async listAttendees(trainingId: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM public.training_attendees
      WHERE training_id = $1::uuid
      ORDER BY registered_at DESC;
    `, trainingId).catch(() => []);

    return rows.map((r) => ({
      id: r.id,
      trainingId: r.training_id,
      memberId: r.member_id,
      userName: r.user_name,
      email: r.email || '',
      phone: r.phone || '',
      company: r.company || '',
      status: r.status || 'registered',
      slideSent: Boolean(r.slide_sent),
      slideSentAt: r.slide_sent_at,
      registeredAt: r.registered_at,
      attendedAt: r.attended_at,
    }));
  }

  async checkinAttendee(trainingId: string, attendeeId: string) {
    await this.prisma.$executeRawUnsafe(`
      UPDATE public.training_attendees
      SET status = 'attended', attended_at = now()
      WHERE training_id = $1::uuid AND id = $2::uuid;
    `, trainingId, attendeeId);

    return { success: true, message: 'Điểm danh học viên thành công (Đã tham gia)' };
  }

  // ── SEND SLIDES & DOCUMENTS MANAGEMENT LINKAGE (UC-3) ───────────────────

  async sendSlides(trainingId: string, customSlideUrl?: string) {
    const training = await this.getTrainingById(trainingId);
    const slideUrl = customSlideUrl || training.slideUrl;
    if (!slideUrl) {
      throw new BadRequestException('Khóa học này chưa có link slide tài liệu bài giảng');
    }

    // 1. Cập nhật trạng thái đã gửi slide cho toàn bộ học viên đã tham gia / đăng ký
    await this.prisma.$executeRawUnsafe(`
      UPDATE public.training_attendees
      SET slide_sent = true, slide_sent_at = now()
      WHERE training_id = $1::uuid;
    `, trainingId);

    // 2. Tự động lưu slide vào chức năng Quản Lý Tài Liệu (public.documents)
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.documents (
        title, name, code, category, file_url, file_path, file_type, type,
        training_id, description, uploaded_by_name, uploaded_by, uploaded_at
      ) VALUES (
        $1, $1, $2, 'training_materials', $3, $3, 'pdf', 'pdf',
        $4::uuid, $5, 'Ban Đào Tạo CEO HN10', 'Ban Đào Tạo CEO HN10', now()
      );
    `,
      `[Slide Bài Giảng] ${training.title}`,
      `SLIDE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      slideUrl,
      trainingId,
      `Tài liệu slide bài giảng khóa đào tạo "${training.title}" do ${training.instructorName} chia sẻ.`,
    ).catch(() => {});

    return {
      success: true,
      message: `Đã gửi slide bài giảng tới toàn bộ học viên và lưu trữ vào Kho Tài Liệu CLB!`,
      slideUrl,
    };
  }

  // ── FEEDBACK & POST-SESSION REVIEWS (UC-3) ──────────────────────────────

  async listFeedbacks(trainingId: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM public.training_feedbacks
      WHERE training_id = $1::uuid
      ORDER BY created_at DESC;
    `, trainingId).catch(() => []);

    return rows.map((r) => ({
      id: r.id,
      trainingId: r.training_id,
      memberId: r.member_id,
      userName: r.user_name,
      content: r.content,
      fileUrl: r.file_url || '',
      fileName: r.file_name || '',
      rating: Number(r.rating || 5),
      createdAt: r.created_at,
    }));
  }

  async submitFeedback(trainingId: string, data: any) {
    if (!data.content?.trim() && !data.fileUrl) {
      throw new BadRequestException('Vui lòng nhập nội dung góp ý hoặc đính kèm file ý kiến');
    }

    const userName = (data.userName || 'Học viên CEO HN10').trim();
    const content = (data.content || '').trim();
    const fileUrl = data.fileUrl || null;
    const fileName = data.fileName || null;
    const rating = Math.min(5, Math.max(1, Number(data.rating) || 5));
    const memberId = data.memberId && data.memberId.length === 36 ? `'${data.memberId}'::uuid` : 'NULL';

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.training_feedbacks (
        training_id, member_id, user_name, content, file_url, file_name, rating, created_at
      ) VALUES (
        $1::uuid, ${memberId}, $2, $3, $4, $5, $6, now()
      );
    `, trainingId, userName, content, fileUrl, fileName, rating);

    return {
      success: true,
      message: 'Cảm ơn Anh/Chị đã gửi ý kiến đóng góp sau buổi học!',
    };
  }

  // ── ATTACH MEDIA & ARCHIVE TO DOCUMENTS (UC-3) ──────────────────────────

  async attachMedia(
    trainingId: string,
    mediaUrl: string,
    description?: string,
    department?: string,
    uploaderName?: string,
    docType?: 'slide' | 'video' | 'photo' | 'media',
  ) {
    if (!mediaUrl?.trim()) {
      throw new BadRequestException('Vui lòng cung cấp link hình ảnh, video hoặc slide bài giảng');
    }

    const training = await this.getTrainingById(trainingId);
    const assignedDept = department?.trim() || (docType === 'slide' ? 'Ban Học Tập' : 'Ban Truyền Thông');
    const uploader = uploaderName?.trim() || assignedDept;
    const isSlide = docType === 'slide' || mediaUrl.includes('drive.google.com') && description?.toLowerCase().includes('slide');

    // 1. Cập nhật media_url hoặc slide_url trong trainings
    if (isSlide) {
      await this.prisma.$executeRawUnsafe(`
        UPDATE public.trainings SET slide_url = $1, updated_at = now() WHERE id = $2::uuid;
      `, mediaUrl.trim(), trainingId);
    } else {
      await this.prisma.$executeRawUnsafe(`
        UPDATE public.trainings SET media_url = $1, updated_at = now() WHERE id = $2::uuid;
      `, mediaUrl.trim(), trainingId);
    }

    // 2. Quản lý lưu trữ tự động chia theo Thư mục từng Ban vào Kho Tài Liệu (public.documents)
    const docTitle = isSlide
      ? `[Slide Bài Giảng - ${assignedDept}] ${training.title}`
      : `[Media & Ảnh - ${assignedDept}] ${training.title}`;

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.documents (
        title, name, code, category, file_url, file_path, file_type, type,
        training_id, description, uploaded_by_name, uploaded_by, uploaded_at
      ) VALUES (
        $1, $1, $2, $3, $4, $4, $5, $5,
        $6::uuid, $7, $8, $8, now()
      );
    `,
      docTitle,
      `DOC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      assignedDept, // Thư mục tự động phân loại đúng Ban
      mediaUrl.trim(),
      isSlide ? 'slide_presentation' : 'event_media',
      trainingId,
      description || `Tài liệu lưu trữ được cập nhật bởi ${assignedDept} cho buổi đào tạo "${training.title}".`,
      uploader,
    ).catch(() => {});

    return {
      success: true,
      message: `Đã lưu trữ thành công và tự động phân loại vào thư mục [${assignedDept}] trong Quản Lý Tài Liệu!`,
      mediaUrl: mediaUrl.trim(),
      department: assignedDept,
    };
  }

  // ── MY ATTENDED TRAININGS (FOR OVERVIEW DASHBOARD) ──────────────────────

  async getMyAttendedTrainings(memberIdOrEmail?: string) {
    if (!memberIdOrEmail) return [];

    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT t.*, a.status as attendee_status, a.slide_sent, a.registered_at, a.attended_at
      FROM public.trainings t
      INNER JOIN public.training_attendees a ON t.id = a.training_id
      WHERE a.member_id::text = '${memberIdOrEmail.replace(/'/g, "''")}' 
         OR a.email ILIKE '${memberIdOrEmail.replace(/'/g, "''")}'
      ORDER BY a.registered_at DESC;
    `).catch(() => []);

    return rows.map((r) => ({
      ...this.mapTrainingRow(r),
      myStatus: r.attendee_status,
      slideSent: Boolean(r.slide_sent),
      myRegisteredAt: r.registered_at,
      myAttendedAt: r.attended_at,
    }));
  }
}
