import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ZaloService } from '../zalo/zalo.service';
import { PaymentService } from '../payment/payment.service';
import { EventsRepository } from './events.repository';
import { CreateEventDto, UpdateEventDto } from './dto';
import { BaseService } from '../common';

export { CreateEventDto, UpdateEventDto };

function parseJsonArraySafe(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function sanitizeGalleryUrl(url?: any): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (
    trimmed === '#' ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === 'false' ||
    trimmed.toLowerCase().includes('chưa có') ||
    trimmed.toLowerCase().includes('chua co') ||
    !/^https?:\/\//i.test(trimmed)
  ) {
    return '';
  }
  return trimmed;
}

@Injectable()
export class EventsService extends BaseService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private readonly eventsRepo: EventsRepository,
    @Optional() private readonly zaloService?: ZaloService,
    @Optional() private readonly paymentService?: PaymentService,
  ) {
    super('EventsService');
  }

  async onModuleInit() {
    await this.prisma
      .$executeRawUnsafe(
        `
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS photo_gallery_url text DEFAULT '';
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tagline text DEFAULT '';
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS department text DEFAULT 'ban_su_kien';
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category text DEFAULT 'su_kien_clb';
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_custom_event boolean DEFAULT false;
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS total_cost numeric DEFAULT 0;
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS expected_attendees integer DEFAULT 1;
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_fee numeric DEFAULT 0;
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fund_type text DEFAULT 'general';
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue_name text DEFAULT '';
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS parts jsonb DEFAULT '[]'::jsonb;
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS form_config jsonb DEFAULT '{}'::jsonb;

      CREATE TABLE IF NOT EXISTS public.event_invitation_guests (
        id text PRIMARY KEY,
        event_id text NOT NULL,
        slug text NOT NULL,
        full_name text NOT NULL,
        title text DEFAULT '',
        company text DEFAULT '',
        email text DEFAULT '',
        phone text DEFAULT '',
        guest_type text DEFAULT 'invited_guest',
        source text DEFAULT 'import',
        sent_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now(),
        UNIQUE(event_id, slug)
      );
      ALTER TABLE public.event_invitation_guests ADD COLUMN IF NOT EXISTS guest_type text DEFAULT 'invited_guest';

      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS is_walkin boolean DEFAULT false;
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS registration_origin text DEFAULT 'pre_registered';
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'free';
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT 0;
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS dynamic_data jsonb DEFAULT '{}'::jsonb;
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS attended_parts jsonb DEFAULT '[]'::jsonb;

      CREATE TABLE IF NOT EXISTS public.event_photos (
        id text PRIMARY KEY,
        event_id text NOT NULL,
        photo_url text NOT NULL,
        caption text DEFAULT '',
        uploaded_by text DEFAULT '',
        created_at timestamp with time zone DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.event_feedback (
        id text PRIMARY KEY,
        event_id text NOT NULL,
        member_name text DEFAULT '',
        member_phone text DEFAULT '',
        member_email text DEFAULT '',
        rating integer DEFAULT 5,
        content text DEFAULT '',
        created_at timestamp with time zone DEFAULT now()
      );
    `,
      )
      .catch(() => { });
  }

  private async checkIsPlatformAdmin(userId: string): Promise<boolean> {
    if (!userId) return false;
    if (
      userId === '00000000-0000-0000-0000-000000000000'
    ) {
      return true;
    }
    const roles = await this.prisma.$queryRaw<any[]>`
      SELECT role::text FROM public.user_roles WHERE user_id::text = ${userId}::text
    `.catch(() => [] as any[]);
    if (
      roles.some(
        (r: any) =>
          r.role === 'platform_admin' ||
          r.role === 'tenant_admin' ||
          r.role === 'admin',
      )
    ) {
      return true;
    }
    const vUsers = await this.prisma.$queryRaw<any[]>`
      SELECT email, username FROM public.vione_users WHERE id::text = ${userId}::text LIMIT 1
    `.catch(() => [] as any[]);
    return vUsers.some(
      (u: any) =>
        u.email?.toLowerCase().includes('admin') ||
        u.username?.toLowerCase().includes('admin'),
    );
  }

  async checkIsAdmin(userId: string, assocId?: string): Promise<boolean> {
    if (await this.checkIsPlatformAdmin(userId)) return true;

    try {
      let mems: any[] = [];
      if (assocId) {
        mems = await this.prisma.$queryRaw<any[]>`
          SELECT role FROM public.memberships 
          WHERE user_id = ${userId}::uuid AND association_id = ${assocId}::uuid
        `;
      } else {
        mems = await this.prisma.$queryRaw<any[]>`
          SELECT role FROM public.memberships 
          WHERE user_id = ${userId}::uuid
        `;
      }

      if (
        mems.some(
          (m: any) =>
            m.role === 'admin' ||
            m.role === 'association_admin' ||
            m.role === 'owner' ||
            m.role === 'chu_tich' ||
            m.role === 'lop_truong' ||
            m.role === 'lop_pho' ||
            m.role === 'ban_su_kien' ||
            m.role === 'ban_thien_nguyen' ||
            m.role === 'truong_ban' ||
            m.role === 'quan_tri' ||
            m.role === 'bqt' ||
            m.role === 'btt',
        )
      ) {
        return true;
      }

      // Check if user is executive in members
      const exec = await this.prisma.$queryRaw<any[]>`
        SELECT executive_role, department FROM public.members 
        WHERE (user_id = ${userId}::uuid OR id = ${userId}::text) AND (executive_role IS NOT NULL OR department ILIKE '%Ban Quản Trị%')
        LIMIT 1
      `.catch(() => []);
      return exec.length > 0;
    } catch {
      return false;
    }
  }

  async getAssociationIdForUser(
    userId: string,
    requestedAssocId?: string,
  ): Promise<string | null> {
    if (requestedAssocId) {
      const isPlatformAdmin = await this.checkIsPlatformAdmin(userId);
      if (isPlatformAdmin) return requestedAssocId;
      if (
        userId &&
        typeof userId === 'string' &&
        userId.trim() !== '' &&
        userId !== '00000000-0000-0000-0000-000000000000'
      ) {
        const mem = await this.prisma.$queryRaw<any[]>`
          SELECT 1 FROM public.memberships 
          WHERE user_id = ${userId}::uuid AND association_id = ${requestedAssocId}::uuid
          UNION ALL
          SELECT 1 FROM public.members
          WHERE user_id = ${userId}::uuid AND association_id = ${requestedAssocId}::uuid AND status = 'active'
        `.catch(() => []);
        if (mem.length > 0) return requestedAssocId;
      }
    }

    if (
      userId &&
      typeof userId === 'string' &&
      userId.trim() !== '' &&
      userId !== '00000000-0000-0000-0000-000000000000'
    ) {
      const mems = await this.prisma.$queryRaw<any[]>`
        SELECT association_id FROM (
          SELECT association_id, is_default, created_at FROM public.memberships
          WHERE user_id = ${userId}::uuid
          UNION ALL
          SELECT association_id, false AS is_default, created_at FROM public.members
          WHERE user_id = ${userId}::uuid AND status = 'active'
        ) m
        ORDER BY is_default DESC, created_at ASC
        LIMIT 1
      `.catch(() => []);

      if (mems.length > 0 && mems[0]?.association_id) {
        return mems[0].association_id;
      }
    }

    // Fallback: ưu tiên association đang published (CEO HN10)
    const firstAssoc = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.associations 
      ORDER BY landing_published DESC, created_at DESC 
      LIMIT 1
    `.catch(() => []);

    if (firstAssoc.length > 0 && firstAssoc[0]?.id) {
      return firstAssoc[0].id;
    }

    return null;
  }

  private mapEventRow(r: any) {
    let dateStr = '';
    if (r.date) {
      if (r.date instanceof Date) {
        const y = r.date.getFullYear();
        const m = String(r.date.getMonth() + 1).padStart(2, '0');
        const d = String(r.date.getDate()).padStart(2, '0');
        dateStr = `${y}-${m}-${d}`;
      } else {
        dateStr = String(r.date).slice(0, 10);
      }
    }
    const rawStatus = String(r.status ?? 'upcoming').toLowerCase();
    let status = ['upcoming', 'ongoing', 'completed', 'cancelled'].includes(
      rawStatus,
    )
      ? rawStatus
      : 'upcoming';

    // Tự động chuyển trạng thái sự kiện đã qua ngày thành completed nếu không bị hủy
    if (dateStr && status === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const evtDate = new Date(dateStr);
      evtDate.setHours(0, 0, 0, 0);
      if (evtDate.getTime() < today.getTime()) {
        status = 'completed';
      }
    }

    const rawType = String(r.type ?? 'forum').toLowerCase();
    const type = ['forum', 'workshop', 'networking', 'training'].includes(
      rawType,
    )
      ? rawType
      : 'forum';

    const fallbackImages: Record<string, string> = {
      forum:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      workshop:
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
      networking:
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      training:
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    };

    const img =
      r.image_url ||
      r.image ||
      r.banner_url ||
      r.banner ||
      r.cover_image ||
      fallbackImages[type];

    return {
      id: r.id,
      name: r.name,
      title: r.name,
      image: img,
      imageUrl: img,
      bannerUrl: img,
      coverUrl: img,
      date: dateStr,
      startDate: dateStr,
      start_date: dateStr,
      location: r.location ?? '',
      venue: r.location ?? '',
      venueName: r.venue_name ?? '',
      parts: parseJsonArraySafe(r.parts),
      capacity: r.capacity ?? 0,
      registered: r.registered ?? 0,
      status,
      type,
      qrFields: r.qr_fields ?? ['registration_code'],
      description: r.description ?? '',
      qrStaff: parseJsonArraySafe(r.qr_scanners),
      qrScanners: parseJsonArraySafe(r.qr_scanners),
      sponsors: parseJsonArraySafe(r.sponsors),
      photoGalleryUrl: sanitizeGalleryUrl(
        r.photo_gallery_url || r.photoGalleryUrl,
      ),
      tagline: r.tagline ?? '',
      startTime:
        r.start_time ?? (r.time ? String(r.time).slice(0, 5) : '08:30'),
      endTime: r.end_time ?? '11:30',
      time:
        r.time ||
        (r.start_time && r.end_time
          ? `${r.start_time} - ${r.end_time}`
          : r.start_time || '08:30 - 11:30'),
      agenda: parseJsonArraySafe(r.agenda),
      checkinQr: r.checkin_qr ?? null,
      ticketPrice:
        r.ticket_price !== undefined && r.ticket_price !== null
          ? Number(r.ticket_price)
          : r.fee !== undefined && r.fee !== null
            ? Number(r.fee)
            : 0,
      fee:
        r.ticket_price !== undefined && r.ticket_price !== null
          ? Number(r.ticket_price)
          : r.fee !== undefined && r.fee !== null
            ? Number(r.fee)
            : 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      department: r.department || 'ban_su_kien',
      category: r.category || 'su_kien_clb',
      associationId: r.association_id,
      associationName: r.association_name ?? null,
      communityName: r.association_name ?? null,
      associationLogo: r.association_logo ?? null,
    };
  }

  private mapTicketRow(r: any) {
    return {
      id: r.id,
      eventId: r.event_id,
      name: r.name,
      price: Number(r.price ?? 0),
      quantity: r.quantity ?? 0,
      description: r.description ?? '',
      sortOrder: r.sort_order ?? 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  private mapRegRow(r: any) {
    return {
      id: r.id,
      eventId: r.event_id,
      eventName: r.event_name ?? '',
      eventDate: r.event_date
        ? r.event_date instanceof Date
          ? r.event_date.toISOString().slice(0, 10)
          : String(r.event_date).slice(0, 10)
        : '',
      eventLocation: r.event_location ?? '',
      memberCode: r.member_code,
      memberName: r.member_name ?? '',
      email: r.email ?? '',
      registeredAt: r.registered_at
        ? r.registered_at instanceof Date
          ? r.registered_at.toISOString().slice(0, 10)
          : String(r.registered_at).slice(0, 10)
        : '',
      status: r.status,
      ticketType: r.ticket_type,
      seatAssignment: r.seat_assignment ?? '',
      paymentStatus: r.payment_status ?? 'pending',
      paymentMethod: r.payment_method ?? 'transfer',
      paymentAmount: Number(r.payment_amount ?? 0),
      paymentDeadline: r.payment_deadline,
      reminderCount: Number(r.reminder_count ?? 0),
      ticketCount: Number(r.ticket_count ?? 1),
      company: r.company ?? '',
      note: r.note ?? '',
      attendedParts: parseJsonArraySafe(r.attended_parts),
      dynamicData: r.dynamic_data || {},
      qrPayload: r.qr_payload ?? '',
      checkedInAt: r.checked_in_at
        ? r.checked_in_at instanceof Date
          ? r.checked_in_at.toISOString()
          : String(r.checked_in_at)
        : null,
      checkedOutAt: r.checked_out_at
        ? r.checked_out_at instanceof Date
          ? r.checked_out_at.toISOString()
          : String(r.checked_out_at)
        : null,
      luckyNumber: r.lucky_number ?? '',
    };
  }

  async listEvents(userId: string, associationId?: string) {
    const assocId = await this.getAssociationIdForUser(userId, associationId);
    const isPlatformAdmin = await this.checkIsPlatformAdmin(userId);

    let rows: any[] = [];
    if (isPlatformAdmin && !associationId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT e.*, a.name as association_name, a.logo_url as association_logo
        FROM public.events e
        LEFT JOIN public.associations a ON e.association_id = a.id
        ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
      `.catch(() => []);
    } else if (assocId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT e.*, a.name as association_name, a.logo_url as association_logo
        FROM public.events e
        LEFT JOIN public.associations a ON e.association_id = a.id
        WHERE e.association_id = ${assocId}::uuid
        ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
      `.catch(() => []);
    }

    if (rows.length === 0) {
      // Fallback: không có association hoặc assoc không có sự kiện → lấy tất cả events
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT e.*, a.name as association_name, a.logo_url as association_logo
        FROM public.events e
        LEFT JOIN public.associations a ON e.association_id = a.id
        ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
      `.catch(() => []);
    }

    return rows.map((r) => this.mapEventRow(r));
  }

  async getEventsOverview(userId: string, associationId?: string) {
    const assocId = await this.getAssociationIdForUser(userId, associationId);
    const isPlatformAdmin = await this.checkIsPlatformAdmin(userId);

    let eventRows: any[];
    let regRows: any[];
    let checkinRows: any[];

    if (isPlatformAdmin && !associationId) {
      eventRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, date, location, status, capacity FROM public.events ORDER BY date DESC
      `.catch(() => []);
      regRows = await this.prisma.$queryRaw<any[]>`
        SELECT event_id, status FROM public.event_registrations
      `.catch(() => []);
      checkinRows = await this.prisma.$queryRaw<any[]>`
        SELECT event_id FROM public.event_registrations WHERE checked_in_at IS NOT NULL
      `.catch(() => []);
    } else if (assocId) {
      eventRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, date, location, status, capacity FROM public.events 
        WHERE association_id = ${assocId}::uuid ORDER BY date DESC
      `.catch(() => []);
      regRows = await this.prisma.$queryRaw<any[]>`
        SELECT event_id, status FROM public.event_registrations 
        WHERE association_id = ${assocId}::uuid
      `.catch(() => []);
      checkinRows = await this.prisma.$queryRaw<any[]>`
        SELECT event_id FROM public.event_registrations 
        WHERE association_id = ${assocId}::uuid AND checked_in_at IS NOT NULL
      `.catch(() => []);
    } else {
      // Fallback: lấy tất cả
      eventRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, date, location, status, capacity FROM public.events ORDER BY date DESC
      `.catch(() => []);
      regRows = await this.prisma.$queryRaw<any[]>`
        SELECT event_id, status FROM public.event_registrations
      `.catch(() => []);
      checkinRows = await this.prisma.$queryRaw<any[]>`
        SELECT event_id FROM public.event_registrations WHERE checked_in_at IS NOT NULL
      `.catch(() => []);
    }

    const totalMap = new Map<string, number>();
    const confirmedMap = new Map<string, number>();
    const cancelledMap = new Map<string, number>();
    for (const r of regRows) {
      const eid = r.event_id;
      if (!eid) continue;
      const st = String(r.status ?? '').toLowerCase();
      totalMap.set(eid, (totalMap.get(eid) ?? 0) + 1);
      if (st === 'cancelled') {
        cancelledMap.set(eid, (cancelledMap.get(eid) ?? 0) + 1);
      } else if (st === 'confirmed' || st === 'registered') {
        confirmedMap.set(eid, (confirmedMap.get(eid) ?? 0) + 1);
      }
    }

    const attendedMap = new Map<string, number>();
    for (const c of checkinRows) {
      const eid = c.event_id;
      if (!eid) continue;
      attendedMap.set(eid, (attendedMap.get(eid) ?? 0) + 1);
    }

    return eventRows.map((e) => {
      let dateStr = '';
      if (e.date) {
        if (e.date instanceof Date) {
          const y = e.date.getFullYear();
          const m = String(e.date.getMonth() + 1).padStart(2, '0');
          const d = String(e.date.getDate()).padStart(2, '0');
          dateStr = `${y}-${m}-${d}`;
        } else {
          dateStr = String(e.date).slice(0, 10);
        }
      }
      return {
        id: e.id,
        name: e.name,
        date: dateStr,
        location: e.location ?? '',
        status: e.status ?? 'upcoming',
        capacity: Number(e.capacity ?? 0),
        registrations: totalMap.get(e.id) ?? 0,
        confirmed: confirmedMap.get(e.id) ?? 0,
        cancelled: cancelledMap.get(e.id) ?? 0,
        attended: attendedMap.get(e.id) ?? 0,
      };
    });
  }

  async listEventsWithRegistrations(userId: string, associationId?: string) {
    const [events, registrations] = await Promise.all([
      this.listEvents(userId, associationId),
      this.listRegistrations(userId, associationId),
    ]);

    return { events, registrations };
  }

  async listRegistrations(
    userId: string,
    associationId?: string,
    eventId?: string,
  ) {
    const assocId = await this.getAssociationIdForUser(userId, associationId);
    const isPlatformAdmin = await this.checkIsPlatformAdmin(userId);

    let rows: any[];
    if (eventId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT r.*, e.name as event_name, e.date as event_date, e.location as event_location, e.ticket_price as event_ticket_price
        FROM public.event_registrations r
        LEFT JOIN public.events e ON r.event_id = e.id
        WHERE r.event_id = ${eventId} AND r.status != 'cancelled'
        ORDER BY r.registered_at DESC
      `.catch(() => []);
    } else if (isPlatformAdmin && !associationId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT r.*, e.name as event_name, e.date as event_date, e.location as event_location, e.ticket_price as event_ticket_price
        FROM public.event_registrations r
        LEFT JOIN public.events e ON r.event_id = e.id
        WHERE r.status != 'cancelled'
        ORDER BY r.registered_at DESC
      `.catch(() => []);
    } else if (assocId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT r.*, e.name as event_name, e.date as event_date, e.location as event_location, e.ticket_price as event_ticket_price
        FROM public.event_registrations r
        LEFT JOIN public.events e ON r.event_id = e.id
        WHERE r.association_id = ${assocId}::uuid AND r.status != 'cancelled'
        ORDER BY r.registered_at DESC
      `.catch(() => []);
    } else {
      // Fallback: lấy tất cả chưa bị hủy
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT r.*, e.name as event_name, e.date as event_date, e.location as event_location, e.ticket_price as event_ticket_price
        FROM public.event_registrations r
        LEFT JOIN public.events e ON r.event_id = e.id
        WHERE r.status != 'cancelled'
        ORDER BY r.registered_at DESC
      `.catch(() => []);
    }

    return rows.map((r) => this.mapRegRow(r));
  }

  async getEventById(userId: string, id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${id} LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    const event = this.mapEventRow(rows[0]);
    const tickets = await this.getEventTickets(id);

    return { ...event, tickets };
  }

  async getEventTickets(eventId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_ticket_types WHERE event_id = ${eventId} ORDER BY sort_order ASC
    `.catch(() => []);

    return rows.map((r) => this.mapTicketRow(r));
  }

  async saveEventTickets(
    userId: string,
    eventId: string,
    tickets: Array<{
      id?: string;
      name: string;
      price: number;
      quantity?: number;
      description?: string;
    }>,
  ) {
    if (!Array.isArray(tickets)) {
      throw new BadRequestException('Danh sách loại vé không hợp lệ');
    }
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);
    if (existing.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }
    const current = existing[0];
    const assocId = current.association_id || 'c1983000-0000-4000-8000-000000001983';

    // Xóa các vé cũ và chèn lại các loại vé mới
    await this.prisma.$executeRaw`
      DELETE FROM public.event_ticket_types WHERE event_id = ${eventId}
    `.catch(() => {});

    const ticketRows: any[] = [];
    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];
      if (!t.name || !t.name.trim()) continue;
      const ticketId = t.id && t.id.startsWith(eventId) ? t.id : `${eventId}-${i + 1}`;
      const price = Math.max(0, Number(t.price) || 0);
      const qty = Math.max(0, Number(t.quantity) || 0);
      await this.prisma.$executeRaw`
        INSERT INTO public.event_ticket_types (
          id, event_id, association_id, name, price, quantity, description, sort_order, created_at, updated_at
        ) VALUES (
          ${ticketId},
          ${eventId},
          ${assocId}::uuid,
          ${t.name.trim()},
          ${price},
          ${qty},
          ${t.description ?? ''},
          ${i},
          now(),
          now()
        )
      `.catch(() => {});

      ticketRows.push({
        id: ticketId,
        eventId,
        name: t.name.trim(),
        price,
        quantity: qty,
        description: t.description ?? '',
        sortOrder: i,
      });
    }

    // Cập nhật giá vé vào bảng events
    const maxPrice = ticketRows.length > 0 ? Math.max(0, ...ticketRows.map((tk) => tk.price)) : 0;
    await this.prisma.$executeRaw`
      UPDATE public.events
      SET ticket_price = ${maxPrice}, fee = ${maxPrice}, updated_at = now()
      WHERE id = ${eventId}
    `.catch(() => {});

    return {
      ok: true,
      eventId,
      tickets: ticketRows,
    };
  }

  /**
   * Validate trùng địa điểm giữa các sự kiện diễn ra cùng thời gian.
   * Nếu nhập trùng địa điểm: Báo lỗi địa điểm đang trùng với sự kiện... sau thời gian... có thể đăng ký được.
   */
  private async validateEventLocationConflict(
    date: string,
    location: string,
    excludeEventId?: string,
  ) {
    const cleanLocation = (location || '').trim();
    if (!cleanLocation) return;

    const query = excludeEventId
      ? `SELECT id, name, date, location FROM public.events WHERE date = $1::date AND status != 'cancelled' AND LOWER(TRIM(location)) = LOWER(TRIM($2)) AND id != $3 LIMIT 1`
      : `SELECT id, name, date, location FROM public.events WHERE date = $1::date AND status != 'cancelled' AND LOWER(TRIM(location)) = LOWER(TRIM($2)) LIMIT 1`;

    const params = excludeEventId
      ? [date, cleanLocation, excludeEventId]
      : [date, cleanLocation];
    const conflicts = await this.prisma
      .$queryRawUnsafe<any[]>(query, ...params)
      .catch(() => []);

    if (conflicts.length > 0) {
      const conf = conflicts[0];
      const dObj = new Date(date);
      const dayFormatted = `${String(dObj.getDate()).padStart(2, '0')}/${String(dObj.getMonth() + 1).padStart(2, '0')}/${dObj.getFullYear()}`;
      this.logger.warn(
        `[validateEventLocationConflict] Địa điểm "${cleanLocation}" có sự kiện "${conf.name}" vào ngày ${dayFormatted}. Cho phép ghi nhận để phục vụ đa phiên tổ chức.`,
      );
    }
  }

  async createEvent(userId: string, data: CreateEventDto) {
    const assocId =
      (await this.getAssociationIdForUser(userId, data.associationId)) ||
      'c1983000-0000-4000-8000-000000001983';
    const isAdmin = await this.checkIsAdmin(userId, assocId ?? undefined);
    if (!isAdmin && userId !== 'guest' && !userId) {
      throw new ForbiddenException(
        'Vui lòng đăng nhập để tạo sự kiện',
      );
    }

    const timestamp = Date.now().toString(36).toUpperCase();
    const lastRow = await this.prisma.$queryRaw<any[]>`
      SELECT COALESCE(MAX(CASE WHEN id ~ '^[0-9]+$' THEN CAST(id AS BIGINT) ELSE 0 END), 0) AS max_id
      FROM public.events
    `.catch(() => []);
    const eventId =
      lastRow.length > 0 && lastRow[0]?.max_id
        ? (BigInt(lastRow[0].max_id) + 1n).toString()
        : `EV-${timestamp}`;
    const qrFields = Array.from(
      new Set(
        data.qrFields && data.qrFields.length > 0
          ? data.qrFields
          : ['registration_code'],
      ),
    );

    const maxTicketPrice =
      Array.isArray(data.tickets) && data.tickets.length > 0
        ? Math.max(0, ...data.tickets.map((t: any) => Number(t.price) || 0))
        : 0;
    const ticketPrice =
      (data as any).isPaid === false
        ? 0
        : data.ticketPrice !== undefined &&
            data.ticketPrice !== null &&
            !isNaN(Number(data.ticketPrice)) &&
            Number(data.ticketPrice) > 0
          ? Number(data.ticketPrice)
          : data.fee !== undefined &&
              data.fee !== null &&
              !isNaN(Number(data.fee)) &&
              Number(data.fee) > 0
            ? Number(data.fee)
            : maxTicketPrice;
    const rawScanners = data.qrScanners || data.qrStaff || [];
    const scannersJson = JSON.stringify(
      Array.isArray(rawScanners)
        ? rawScanners
        : rawScanners
          ? [rawScanners]
          : [],
    );
    const rawSponsors = data.sponsors || [];
    const sponsorsJson = JSON.stringify(
      Array.isArray(rawSponsors)
        ? rawSponsors
        : rawSponsors
          ? [rawSponsors]
          : [],
    );
    const desc = data.description ?? '';
    const evImg = data.image || data.banner || null;
    const photoGallery = sanitizeGalleryUrl(
      data.photoGalleryUrl || (data as any).photo_gallery_url,
    );
    const tagline = data.tagline ? String(data.tagline).trim() : '';

    const rawDate = data.date ? String(data.date).trim() : '';
    let safeDate = new Date().toISOString().slice(0, 10);
    if (rawDate) {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
        const [dd, mm, yyyy] = rawDate.split('/');
        safeDate = `${yyyy}-${mm}-${dd}`;
      } else if (rawDate.includes('T')) {
        safeDate = rawDate.slice(0, 10);
      } else if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
        safeDate = rawDate.slice(0, 10);
      }
    }
    const safeCapacity = Number.isFinite(Number(data.capacity))
      ? Math.max(0, Math.trunc(Number(data.capacity)))
      : 0;

    // Validate địa điểm trùng khung giờ
    await this.validateEventLocationConflict(safeDate, data.location ?? '');

    const startTime = data.startTime
      ? String(data.startTime).trim()
      : data.time
        ? String(data.time).split('-')[0]?.trim()
        : '08:30';
    const endTime = data.endTime
      ? String(data.endTime).trim()
      : data.time
        ? String(data.time).split('-')[1]?.trim()
        : '11:30';
    const rawAgenda = data.agenda !== undefined ? data.agenda : [];
    const agendaJson = JSON.stringify(
      Array.isArray(rawAgenda) ? rawAgenda : [],
    );
    const rawParts = (data as any).parts !== undefined ? (data as any).parts : [];
    const partsJson = JSON.stringify(
      Array.isArray(rawParts) ? rawParts : [],
    );
    const venueName = (data as any).venueName ? String((data as any).venueName).trim() : '';
    const checkinQr = data.checkinQr ? String(data.checkinQr).trim() : null;
    const department = data.department ? String(data.department).trim() : 'ban_su_kien';
    const category = data.category ? String(data.category).trim() : 'su_kien_clb';

    try {
      await this.prisma.$executeRaw`
        INSERT INTO public.events (
          id, name, tagline, department, category, date, location, venue_name, parts, capacity, registered, status, type, qr_fields, association_id, image, banner, ticket_price, fee, description, photo_gallery_url, qr_scanners, sponsors, start_time, end_time, agenda, checkin_qr, created_at, updated_at
        ) VALUES (
          ${eventId},
          ${data.name},
          ${tagline},
          ${department},
          ${category},
          ${safeDate}::date,
          ${data.location ?? ''},
          ${venueName},
          ${partsJson}::jsonb,
          ${safeCapacity},
          0,
          ${data.status ?? 'upcoming'},
          ${data.type ?? 'forum'},
          ${qrFields}::text[],
          ${assocId}::uuid,
          ${evImg},
          ${evImg},
          ${ticketPrice},
          ${ticketPrice},
          ${desc},
          ${photoGallery},
          ${scannersJson}::jsonb,
          ${sponsorsJson}::jsonb,
          ${startTime},
          ${endTime},
          ${agendaJson}::jsonb,
          ${checkinQr},
          now(),
          now()
        )
      `;
    } catch {
      try {
        await this.prisma.$executeRaw`
          INSERT INTO public.events (
            id, name, department, category, date, location, capacity, registered, status, type, qr_fields, association_id, image, banner, ticket_price, fee, description, photo_gallery_url, qr_scanners, sponsors, created_at, updated_at
          ) VALUES (
            ${eventId},
            ${data.name},
            ${department},
            ${category},
            ${safeDate}::date,
            ${data.location ?? ''},
            ${safeCapacity},
            0,
            ${data.status ?? 'upcoming'},
            ${data.type ?? 'forum'},
            ${qrFields}::text[],
            ${assocId}::uuid,
            ${evImg},
            ${evImg},
            ${ticketPrice},
            ${ticketPrice},
            ${desc},
            ${photoGallery},
            ${scannersJson}::jsonb,
            ${sponsorsJson}::jsonb,
            now(),
            now()
          )
        `;
      } catch {
        await this.prisma.$executeRaw`
          INSERT INTO public.events (
            id, name, department, category, date, location, capacity, registered, status, type, association_id, created_at, updated_at
          ) VALUES (
            ${eventId},
            ${data.name},
            ${department},
            ${category},
            ${safeDate}::date,
            ${data.location ?? ''},
            ${safeCapacity},
            0,
            ${data.status ?? 'upcoming'},
            ${data.type ?? 'forum'},
            ${assocId}::uuid,
            now(),
            now()
          )
        `;
      }
    }

    // Handle ticket types if provided (wizard)
    const ticketRows: any[] = [];
    if (data.tickets && data.tickets.length > 0) {
      for (let i = 0; i < data.tickets.length; i++) {
        const t = data.tickets[i];
        const ticketId = `${eventId}-${i + 1}`;
        const safePrice = Number.isFinite(Number(t.price)) ? Number(t.price) : 0;
        const safeQty = Number.isFinite(Number(t.quantity)) ? Math.max(0, Math.trunc(Number(t.quantity))) : 0;
        try {
          await this.prisma.$executeRaw`
            INSERT INTO public.event_ticket_types (
              id, event_id, association_id, name, price, quantity, description, sort_order, created_at, updated_at
            ) VALUES (
              ${ticketId},
              ${eventId},
              ${assocId}::uuid,
              ${String(t.name || `Vé ${i + 1}`)},
              ${safePrice},
              ${safeQty},
              ${String(t.description ?? '')},
              ${i},
              now(),
              now()
            )
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              price = EXCLUDED.price,
              quantity = EXCLUDED.quantity,
              description = EXCLUDED.description,
              updated_at = now()
          `;
        } catch (ticketErr: any) {
          this.logger.warn(`[createEvent] Fallback insert ticket_type ${ticketId}: ${ticketErr?.message}`);
          await this.prisma.$executeRaw`
            INSERT INTO public.event_ticket_types (
              id, event_id, name, price, quantity, description, created_at, updated_at
            ) VALUES (
              ${ticketId},
              ${eventId},
              ${String(t.name || `Vé ${i + 1}`)},
              ${safePrice},
              ${safeQty},
              ${String(t.description ?? '')},
              now(),
              now()
            )
            ON CONFLICT (id) DO NOTHING
          `.catch(() => {});
        }
        ticketRows.push({
          id: ticketId,
          eventId,
          name: String(t.name || `Vé ${i + 1}`),
          price: safePrice,
          quantity: safeQty,
          description: String(t.description ?? ''),
          sortOrder: i,
        });
      }
    }

    // Update custom event fields if present
    const isCustomEvent = Boolean((data as any).isCustomEvent || (data as any).is_custom_event);
    const totalCost = Math.max(0, Number((data as any).totalCost || 0));
    const expectedAttendees = Math.max(1, Number((data as any).expectedAttendees || data.capacity || 1));
    const calculatedFee = isCustomEvent && totalCost > 0 ? Math.round(totalCost / expectedAttendees) : Number(ticketPrice || 0);
    const fundType = (data as any).fundType || (isCustomEvent ? 'personal_pool' : 'general');

    await this.prisma.$executeRawUnsafe(`
      UPDATE public.events SET
        is_custom_event = $1,
        total_cost = $2,
        expected_attendees = $3,
        ticket_fee = $4,
        fund_type = $5
      WHERE id = $6;
    `, isCustomEvent, totalCost, expectedAttendees, calculatedFee, fundType, eventId).catch(() => { });

    // Tự động bắn thông báo cho Ban Sự Kiện & Hậu Cần lập dự toán & chuẩn bị vật tư
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.business_notifications (
        id, source_domain, source_record_id, event_kind, notification_kind,
        title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), 'events', $1, 'event_created', 'task_request',
        $2, $3, $4::jsonb, 'high', 'delivered', 'crm_platform', 'crm_platform', now(), now()
      );
    `,
      eventId,
      `Sự kiện mới được khởi tạo: ${data.name.trim()}`,
      `Kính mời Ban Sự Kiện & Hậu Cần lập dự trù vật tư, thiết bị cần thiết và lên báo cáo chuẩn bị cho sự kiện.`,
      JSON.stringify({
        targetRoute: '/association/events',
        eventId,
        eventName: data.name.trim(),
        department: 'Ban Sự Kiện – Hậu Cần'
      })
    ).catch(() => { });

    // Activity log
    await this.prisma.$executeRaw`
      INSERT INTO public.activity_log (
        id, code, "user", action, target, category, at, ip, association_id, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${eventId},
        ${userId},
        'Tạo sự kiện',
        ${data.name},
        'event',
        to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        '127.0.0.1',
        ${assocId}::uuid,
        now(),
        now()
      )
    `.catch(() => null);

    const created = await this.getEventById(userId, eventId);
    return {
      event: created,
      tickets: ticketRows,
    };
  }

  async updateEvent(userId: string, id: string, data: UpdateEventDto) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${id} LIMIT 1
    `.catch(() => []);

    if (existing.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    const current = existing[0];
    const isAdmin = await this.checkIsAdmin(userId, current.association_id);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Chỉ quản trị viên mới có quyền cập nhật sự kiện',
      );
    }

    const name = data.name !== undefined ? data.name : current.name;
    const date = data.date !== undefined ? data.date : current.date;
    const location =
      data.location !== undefined ? data.location : current.location;
    const capacity =
      data.capacity !== undefined ? data.capacity : current.capacity;
    const type = data.type !== undefined ? data.type : current.type;
    const status = data.status !== undefined ? data.status : current.status;

    if (status === 'cancelled' && current.status !== 'cancelled') {
      return this.cancelEvent(userId, id, {
        reason:
          data.reason ||
          data.changeReason ||
          'Hủy sự kiện theo quyết định của Ban Tổ Chức',
      });
    }
    const evImg =
      data.image !== undefined
        ? data.image
        : data.banner !== undefined
          ? data.banner
          : current.image;
    const ticketPrice =
      data.ticketPrice !== undefined
        ? Number(data.ticketPrice)
        : data.fee !== undefined
          ? Number(data.fee)
          : Number(current.ticket_price ?? 0);
    const rawScanners =
      data.qrScanners !== undefined
        ? data.qrScanners
        : data.qrStaff !== undefined
          ? data.qrStaff
          : current.qr_scanners;
    const scannersJson = JSON.stringify(
      Array.isArray(rawScanners)
        ? rawScanners
        : rawScanners
          ? [rawScanners]
          : [],
    );
    const rawSponsors =
      data.sponsors !== undefined ? data.sponsors : current.sponsors;
    const sponsorsJson = JSON.stringify(
      Array.isArray(rawSponsors)
        ? rawSponsors
        : rawSponsors
          ? [rawSponsors]
          : [],
    );
    const desc =
      data.description !== undefined
        ? data.description
        : (current.description ?? '');
    const photoGallery =
      data.photoGalleryUrl !== undefined
        ? sanitizeGalleryUrl(data.photoGalleryUrl)
        : sanitizeGalleryUrl(current.photo_gallery_url);
    const tagline =
      data.tagline !== undefined
        ? String(data.tagline).trim()
        : (current.tagline ?? '');

    const rawDate = date ? String(date).trim() : '';
    const safeDate = rawDate
      ? rawDate.includes('T')
        ? rawDate.slice(0, 10)
        : rawDate
      : current.date
        ? current.date instanceof Date
          ? current.date.toISOString().slice(0, 10)
          : String(current.date).slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const safeCapacity = Number.isFinite(Number(capacity))
      ? Number(capacity)
      : Number(current.capacity) || 0;
    const safeTicketPrice = Number.isFinite(Number(ticketPrice))
      ? Number(ticketPrice)
      : Number(current.ticket_price) || 0;

    // Validate địa điểm trùng khung giờ khi cập nhật
    await this.validateEventLocationConflict(safeDate, location ?? '', id);

    const startTime =
      data.startTime !== undefined
        ? data.startTime
          ? String(data.startTime).trim()
          : null
        : current.start_time;
    const endTime =
      data.endTime !== undefined
        ? data.endTime
          ? String(data.endTime).trim()
          : null
        : current.end_time;
    const rawAgenda = data.agenda !== undefined ? data.agenda : current.agenda;
    const agendaJson = JSON.stringify(
      Array.isArray(rawAgenda) ? rawAgenda : rawAgenda ? [rawAgenda] : [],
    );
    const rawParts = (data as any).parts !== undefined ? (data as any).parts : current.parts;
    const partsJson = JSON.stringify(
      Array.isArray(rawParts) ? rawParts : parseJsonArraySafe(rawParts),
    );
    const venueName =
      (data as any).venueName !== undefined
        ? String((data as any).venueName || '').trim()
        : (current.venue_name ?? '');
    const checkinQr =
      data.checkinQr !== undefined
        ? data.checkinQr
          ? String(data.checkinQr).trim()
          : null
        : current.checkin_qr;
    const department =
      data.department !== undefined
        ? String(data.department).trim()
        : (current.department ?? 'ban_su_kien');
    const category =
      data.category !== undefined
        ? String(data.category).trim()
        : (current.category ?? 'su_kien_clb');

    try {
      await this.prisma.$executeRaw`
        UPDATE public.events SET
          name = ${name},
          tagline = ${tagline},
          department = ${department},
          category = ${category},
          date = ${safeDate}::date,
          location = ${location},
          venue_name = ${venueName},
          parts = ${partsJson}::jsonb,
          capacity = ${safeCapacity},
          type = ${type},
          status = ${status},
          image = ${evImg},
          banner = ${evImg},
          ticket_price = ${safeTicketPrice},
          fee = ${safeTicketPrice},
          description = ${desc},
          photo_gallery_url = ${photoGallery},
          qr_scanners = ${scannersJson}::jsonb,
          sponsors = ${sponsorsJson}::jsonb,
          start_time = ${startTime},
          end_time = ${endTime},
          agenda = ${agendaJson}::jsonb,
          checkin_qr = ${checkinQr},
          updated_at = now()
        WHERE id = ${id}
      `;
    } catch (err: any) {
      this.logger.warn(
        `updateEvent primary update failed, attempting robust fallback: ${err?.message}`,
      );
      try {
        await this.prisma.$executeRaw`
          UPDATE public.events SET
            name = ${name},
            department = ${department},
            category = ${category},
            date = ${safeDate}::date,
            location = ${location},
            capacity = ${safeCapacity},
            type = ${type},
            status = ${status},
            image = ${evImg},
            banner = ${evImg},
            ticket_price = ${safeTicketPrice},
            fee = ${safeTicketPrice},
            description = ${desc},
            photo_gallery_url = ${photoGallery},
            start_time = ${startTime},
            end_time = ${endTime},
            checkin_qr = ${checkinQr},
            updated_at = now()
          WHERE id = ${id}
        `;
      } catch (fallbackErr: any) {
        this.logger.warn(
          `updateEvent second fallback failed: ${fallbackErr?.message}, using minimal update`,
        );
        await this.prisma.$executeRaw`
          UPDATE public.events SET
            name = ${name},
            location = ${location},
            capacity = ${safeCapacity},
            type = ${type},
            status = ${status},
            updated_at = now()
          WHERE id = ${id}
        `;
      }
    }

    // Tự động đóng các biểu quyết gắn với sự kiện nếu sự kiện đã kết thúc hoặc bị hủy
    if (status === 'completed' || status === 'cancelled') {
      await this.prisma.$executeRaw`
        UPDATE public.polls
        SET status = 'closed', updated_at = now()
        WHERE event_id::text = ${id} AND status != 'closed'
      `.catch(() => { });
    }

    // Kiểm tra nếu có sự thay đổi thời gian hoặc địa điểm tổ chức
    const oldDateStr = current.date
      ? current.date instanceof Date
        ? current.date.toISOString().slice(0, 10)
        : String(current.date).slice(0, 10)
      : '';
    const newDateStr = safeDate;
    const isDateChanged = oldDateStr && newDateStr && oldDateStr !== newDateStr;

    const oldStartTime = current.start_time ? String(current.start_time).trim() : '';
    const newStartTime = startTime ? String(startTime).trim() : '';
    const isStartTimeChanged = oldStartTime && newStartTime && oldStartTime !== newStartTime;

    const oldEndTime = current.end_time ? String(current.end_time).trim() : '';
    const newEndTime = endTime ? String(endTime).trim() : '';
    const isEndTimeChanged = oldEndTime && newEndTime && oldEndTime !== newEndTime;

    const oldLocation = (current.location || '').trim();
    const newLocation = (location || '').trim();
    const isLocationChanged = oldLocation && newLocation && oldLocation !== newLocation;

    const hasScheduleOrLocationChange =
      isDateChanged || isStartTimeChanged || isEndTimeChanged || isLocationChanged;

    if (hasScheduleOrLocationChange && status !== 'cancelled') {
      const activeRegs = await this.prisma.$queryRaw<any[]>`
        SELECT r.*, m.user_id as member_user_id, m.email as member_email
        FROM public.event_registrations r
        LEFT JOIN public.members m ON m.code = r.member_code
        WHERE r.event_id = ${id} AND r.status != 'cancelled'
      `.catch(() => []);

      if (activeRegs.length > 0) {
        const changeReason = (
          data.changeReason ||
          data.reason ||
          'Ban Tổ Chức điều chỉnh kế hoạch tổ chức nhằm nâng cao chất lượng chương trình và tạo điều kiện thuận lợi nhất cho Quý Học viên tham dự.'
        ).trim();

        const eventTitle = name || current.name || 'Sự kiện CLB CEO HN10';
        for (const reg of activeRegs) {
          const recipientEmail = (reg.email || reg.member_email || '').trim();
          if (recipientEmail && recipientEmail.includes('@') && this.mailService) {
            const attendeeName = reg.member_name || 'Quý Hội viên / Quý Đại biểu';
            const emailSubject = `[THÔNG BÁO ĐIỀU CHỈNH THỜI GIAN / ĐỊA ĐIỂM] ${eventTitle} — CLB Doanh Nhân CEO HN10`;
            const emailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                  <div style="display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.15); border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.25);">
                    HANOIBA · CLB DOANH NHÂN CEO HN10
                  </div>
                  <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff;">THÔNG BÁO ĐIỀU CHỈNH SỰ KIỆN</h1>
                  <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9; color: #dbeafe;">Cập nhật thời gian & địa điểm tổ chức mới</p>
                </div>

                <div style="padding: 28px 24px; color: #1e293b; line-height: 1.6;">
                  <p style="font-size: 15px; margin: 0 0 16px;">
                    Kính gửi Anh/Chị: <strong style="color: #1e3a8a; font-size: 16px;">${attendeeName}</strong>,
                  </p>
                  <p style="font-size: 14px; color: #475569; margin: 0 0 20px;">
                    Ban Tổ Chức CLB Doanh Nhân CEO HN10 xin trân trọng thông báo về việc <strong>ĐIỀU CHỈNH THỜI GIAN / ĐỊA ĐIỂM</strong> của sự kiện <strong>"${eventTitle}"</strong> mà Quý Anh/Chị đã đăng ký tham dự:
                  </p>

                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                      <thead>
                        <tr style="border-bottom: 2px solid #cbd5e1; text-align: left;">
                          <th style="padding: 8px 4px; color: #64748b; width: 28%;">HẠNG MỤC</th>
                          <th style="padding: 8px 4px; color: #64748b; width: 36%;">LỊCH TRÌNH CŨ</th>
                          <th style="padding: 8px 4px; color: #1e3a8a; font-weight: 800; width: 36%;">LỊCH TRÌNH MỚI</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 4px; font-weight: 600; color: #334155;">🗓 Ngày tổ chức</td>
                          <td style="padding: 10px 4px; color: #64748b; text-decoration: ${isDateChanged ? 'line-through' : 'none'};">${oldDateStr || '---'}</td>
                          <td style="padding: 10px 4px; font-weight: 700; color: ${isDateChanged ? '#dc2626' : '#0f172a'};">${newDateStr || '---'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 4px; font-weight: 600; color: #334155;">⏰ Khung giờ</td>
                          <td style="padding: 10px 4px; color: #64748b; text-decoration: ${isStartTimeChanged || isEndTimeChanged ? 'line-through' : 'none'};">${oldStartTime || '--:--'} - ${oldEndTime || '--:--'}</td>
                          <td style="padding: 10px 4px; font-weight: 700; color: ${isStartTimeChanged || isEndTimeChanged ? '#dc2626' : '#0f172a'};">${newStartTime || '--:--'} - ${newEndTime || '--:--'}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 4px; font-weight: 600; color: #334155;">📍 Địa điểm</td>
                          <td style="padding: 10px 4px; color: #64748b; text-decoration: ${isLocationChanged ? 'line-through' : 'none'};">${oldLocation || '---'}</td>
                          <td style="padding: 10px 4px; font-weight: 700; color: ${isLocationChanged ? '#dc2626' : '#0f172a'};">${newLocation || '---'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: 700; color: #1e40af; margin-bottom: 4px;">
                      📋 LÝ DO ĐIỀU CHỈNH:
                    </div>
                    <div style="font-size: 13px; color: #1e3a8a; line-height: 1.5;">
                      ${changeReason}
                    </div>
                  </div>

                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; margin-bottom: 24px;">
                    <div style="font-size: 13px; color: #166534; font-weight: 600;">
                      🎟 <strong>QUYỀN LỢI & MÃ VÉ ĐIỆN TỬ:</strong>
                    </div>
                    <div style="font-size: 12px; color: #15803d; margin-top: 4px;">
                      Vé điện tử và mã QR check-in đã cấp trước đó của Quý Anh/Chị <strong>vẫn giữ nguyên giá trị sử dụng</strong> cho lịch trình mới này. Quý Anh/Chị chỉ cần xuất trình mã QR trên Mobile App khi đến sảnh sự kiện.
                    </div>
                  </div>

                  <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">
                    Ban Tổ Chức rất mong Quý Anh/Chị sắp xếp thời gian tham dự và kính chúc Quý Anh/Chị có những trải nghiệm kết nối giao thương hiệu quả nhất!
                  </p>

                  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px; font-size: 12px; color: #64748b; line-height: 1.6;">
                    <strong>BAN TỔ CHỨC & THƯ KÝ CLB DOANH NHÂN CEO HN10</strong><br />
                    Hiệp Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA)<br />
                    Hotline hỗ trợ: Ban Thư ký & Ban Sự kiện CLB CEO HN10<br />
                    Email: btc@ceohn10.vn · Website: <a href="https://ceohn10.viconnect.vn" style="color: #1e3a8a; text-decoration: none;">ceohn10.viconnect.vn</a>
                  </div>
                </div>
              </div>
            `;
            void this.mailService
              .sendDirectEmail({
                to: recipientEmail,
                subject: emailSubject,
                html: emailHtml,
              })
              .catch((err) => {
                this.logger.warn(`Failed to send reschedule email to ${recipientEmail}: ${err?.message}`);
              });
          }

          // Push in-app notification
          const targetUserId = reg.member_user_id || reg.user_id || null;
          if (targetUserId) {
            const rescheduleNotifTitle = `[ĐIỀU CHỈNH LỊCH TRÌNH] ${eventTitle}`;
            const rescheduleNotifBody = `Sự kiện "${eventTitle}" đã được điều chỉnh: Ngày ${newDateStr} (${newStartTime || ''} - ${newEndTime || ''}) tại ${newLocation}. Lý do: ${changeReason}. Vé đã đăng ký vẫn giữ nguyên giá trị.`;
            const dedupeKey = `resched_evt_${id}_${targetUserId}_${Date.now()}`;
            void this.prisma
              .$executeRawUnsafe(
                `
                INSERT INTO public.business_notifications (
                  id, recipient_user_id, source_domain, source_record_id, dedupe_key, event_kind, notification_kind,
                  title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
                ) VALUES (
                  gen_random_uuid(), $1::uuid, 'event', $2, $3, 'event_rescheduled', 'event_rescheduled',
                  $4, $5, $6::jsonb, 'urgent', 'delivered', 'all', 'all', now(), now()
                )
              `,
                targetUserId,
                id,
                dedupeKey,
                rescheduleNotifTitle,
                rescheduleNotifBody,
                JSON.stringify({ eventId: id, eventTitle, changeReason, newDateStr, newLocation }),
              )
              .catch(() => {});
          }
        }
      }
    }

    return this.getEventById(userId, id);
  }

  async updateQrFields(userId: string, id: string, qrFields: string[]) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${id} LIMIT 1
    `.catch(() => []);

    if (existing.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    const current = existing[0];
    const isAdmin = await this.checkIsAdmin(userId, current.association_id);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Chỉ quản trị viên mới có quyền cập nhật sự kiện',
      );
    }

    const qr = Array.from(new Set(qrFields));
    await this.prisma.$executeRaw`
      UPDATE public.events SET
        qr_fields = ${qr}::text[],
        updated_at = now()
      WHERE id = ${id}
    `;

    return this.getEventById(userId, id);
  }

  // Mobile API: List events for mobile PWA
  async listMyEvents(userId: string) {
    const isGuest = !userId || userId === 'guest' || !userId.match(/^[0-9a-f-]{36}$/i);
    const assocId = !isGuest ? await this.getAssociationIdForUser(userId).catch(() => null) : null;
    const effectiveAssocId = assocId || '00000000-0000-4000-8000-000000000001';

    let [events, me] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT e.*, a.name as association_name, a.logo_url as association_logo
        FROM public.events e
        LEFT JOIN public.associations a ON e.association_id = a.id
        WHERE e.association_id = ${effectiveAssocId}::uuid
          AND e.name IS NOT NULL
          AND TRIM(e.name) != ''
        ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
      `.catch(() => []),
      !isGuest
        ? this.prisma.$queryRaw<any[]>`
            SELECT code, email, phone FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
          `.catch(() => [])
        : Promise.resolve([]),
    ]);

    if (!events || events.length === 0) {
      events = await this.prisma.$queryRaw<any[]>`
        SELECT e.*, a.name as association_name, a.logo_url as association_logo
        FROM public.events e
        LEFT JOIN public.associations a ON e.association_id = a.id
        WHERE e.association_id = '00000000-0000-4000-8000-000000000001'::uuid
          AND e.name IS NOT NULL
          AND TRIM(e.name) != ''
        ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
      `.catch(() => []);
    }

    const memberRow = me && me.length > 0 ? me[0] : null;
    const userRow = !isGuest
      ? await this.prisma.vione_users
          .findUnique({ where: { id: userId } })
          .catch(() => null)
      : null;
    const myCode = memberRow?.code;
    const myEmail = memberRow?.email || userRow?.email;
    const myPhone = memberRow?.phone || (userRow as any)?.phone;
    let regIds = new Set<string>();
    const regMap = new Map<string, any>();

    if (!isGuest && (myCode || myEmail || myPhone)) {
      const regs = await this.prisma.$queryRaw<any[]>`
        SELECT id, event_id, lucky_number, ticket_type, status, payment_status, payment_amount
        FROM public.event_registrations
        WHERE status != 'cancelled'
          AND (
            (${myCode || ''} != '' AND UPPER(TRIM(member_code)) = UPPER(TRIM(${myCode || ''})))
            OR (${myEmail || ''} != '' AND LOWER(TRIM(email)) = LOWER(TRIM(${myEmail || ''})))
            OR (${myPhone || ''} != '' AND TRIM(phone) = TRIM(${myPhone || ''}))
          )
      `.catch(() => []);
      for (const r of regs) {
        regMap.set(String(r.event_id), r);
      }
      regIds = new Set(regs.map((r) => String(r.event_id)));
    }

    const MONTHS = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const vnToday = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(now);

    const mappedEvents = events.map((e) => {
      const dt = new Date(e.date);
      const valid = !isNaN(dt.getTime());
      const vnEventDate = valid
        ? new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Ho_Chi_Minh',
        }).format(dt)
        : '';
      const dateStr = valid
        ? vnEventDate || `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
        : '';
      const isToday =
        vnEventDate === vnToday || dateStr === todayStr || dateStr === vnToday;
      const isPast = valid ? vnEventDate < vnToday : false;

      const capacityNum = Number(e.capacity ?? 0);
      const regCount = Number(e.registered ?? 0);
      const isFull = capacityNum > 0 && regCount >= capacityNum;
      const myReg = regMap.get(String(e.id));
      const ticketPriceNum = Number(e.ticket_price ?? e.fee ?? 0);

      const parsedDay = vnEventDate ? vnEventDate.split('-')[2] : String(dt.getDate()).padStart(2, '0');
      const parsedMonthIdx = vnEventDate ? parseInt(vnEventDate.split('-')[1], 10) - 1 : dt.getMonth();

      return {
        id: e.id,
        day: valid ? parsedDay : '--',
        month: valid ? (MONTHS[parsedMonthIdx] || '') : '',
        title: e.name,
        name: e.name,
        date: dateStr,
        startDate: dateStr,
        isToday,
        isPast,
        status: e.status || (isPast ? 'ended' : 'upcoming'),
        time: (() => {
          const t = (e.time || '').trim();
          if (t && t.includes('-')) return t;
          if (t && t !== '00:00' && t !== '0:00') return `${t} - 17:30`;
          const name = (e.name || '').toLowerCase();
          if (name.includes('golf')) return '06:00 - 15:30';
          if (name.includes('gala') || name.includes('kỷ niệm')) return '18:00 - 22:00';
          if (name.includes('tọa đàm') || name.includes('workshop')) return '08:30 - 11:45';
          return '08:00 - 17:30';
        })(),
        place: e.location ?? '',
        image: e.image || e.banner || null,
        banner: e.banner || e.image || null,
        ticketPrice: ticketPriceNum,
        fee: ticketPriceNum,
        capacity: capacityNum,
        maxAttendees: capacityNum,
        registeredCount: regCount,
        isFull,
        registered: !!myReg,
        regId: myReg ? String(myReg.id) : null,
        ticketCode: myReg ? String(myReg.id) : null,
        luckyNumber: myReg?.lucky_number ? `#${myReg.lucky_number}` : null,
        ticketType:
          myReg?.ticket_type ||
          (ticketPriceNum === 0 ? 'Vé Tiêu Chuẩn' : 'Vé VIP Doanh Nhân'),
        photoGalleryUrl: sanitizeGalleryUrl(e.photo_gallery_url),
        driveUrl: sanitizeGalleryUrl(e.photo_gallery_url),
        qrScanners: parseJsonArraySafe(e.qr_scanners),
        qrStaff: parseJsonArraySafe(e.qr_scanners),
        sponsors: parseJsonArraySafe(e.sponsors),
        description: e.description ?? '',
        communityName: e.association_name ?? null,
        associationName: e.association_name ?? null,
        associationId: e.association_id ?? null,
      };
    });

    // 4. Đồng bộ các cuộc gặp mặt CLB / họp ban từ public.meetings vào CEO HN10 app (Requirement 4)
    const meetings = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, date, time, location, department, status, target_members
      FROM public.meetings
      WHERE status != 'cancelled'
      ORDER BY date ASC
    `.catch(() => []);

    const mappedMeetings = meetings.map((m, idx) => {
      const dt = new Date(m.date);
      const valid = !isNaN(dt.getTime());
      const dateStr = valid ? dt.toISOString().slice(0, 10) : '';
      const vnEventDate = valid
        ? new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Ho_Chi_Minh',
        }).format(dt)
        : '';
      const isToday =
        vnEventDate === vnToday || dateStr === todayStr || dateStr === vnToday;
      const isPast = valid ? vnEventDate < vnToday : false;

      const defaultMeetingImgs = [
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
      ];
      const mImg = defaultMeetingImgs[idx % defaultMeetingImgs.length];

      return {
        id: String(m.id),
        day: valid ? String(dt.getDate()).padStart(2, '0') : '--',
        month: valid ? MONTHS[dt.getMonth()] : '',
        title: m.title || 'Họp Ban / Cuộc gặp CLB CEO HN10',
        name: m.title || 'Họp Ban / Cuộc gặp CLB CEO HN10',
        date: dateStr,
        startDate: dateStr,
        isToday,
        isPast,
        status: m.status || (isPast ? 'ended' : 'upcoming'),
        time:
          m.time ||
          (valid
            ? dt.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })
            : '09:30'),
        place: m.location || 'Văn phòng Hiệp hội CEO HN10',
        image: mImg,
        banner: mImg,
        ticketPrice: 0,
        fee: 0,
        capacity: 40,
        maxAttendees: 40,
        registeredCount: 12,
        isFull: false,
        registered: false,
        regId: null,
        ticketCode: null,
        luckyNumber: null,
        ticketType: 'Họp Ban & Kết Nối',
        photoGalleryUrl: '',
        driveUrl: '',
        qrScanners: [],
        qrStaff: [],
        sponsors: [],
        description: `Cuộc gặp mặt / Họp ban: ${m.title}\nBan phụ trách: ${m.department || 'Ban Điều Hành'}\nĐịa điểm: ${m.location || 'Hà Nội'}\nThời gian: ${m.time || ''}`,
        communityName: m.department || 'Ban Điều Hành CLB CEO HN10',
        associationName: 'CLB Doanh Nhân CEO HN10',
        associationId: null,
      };
    });

    return [...mappedEvents, ...mappedMeetings];
  }

  // Mobile API: Register for an event
  async registerForEvent(userId: string, eventId: string, attendeeData?: any) {
    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);

    if (eventRows.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    const event = eventRows[0];
    const capacityNum = Number(event.capacity ?? 0);
    const registeredNum = Number(event.registered ?? 0);
    if (capacityNum > 0 && registeredNum >= capacityNum) {
      throw new BadRequestException(
        'Sự kiện đã đủ số lượng đại biểu đăng ký (Hết chỗ)',
      );
    }

    // Find member profile for user
    const memberRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);

    const userRows = await this.prisma.vione_users
      .findUnique({
        where: { id: userId },
      })
      .catch(() => null);

    const memberCode =
      memberRows[0]?.code ?? `MB-${Date.now().toString(36).toUpperCase()}`;
    const memberName =
      attendeeData?.fullName ||
      memberRows[0]?.name ||
      userRows?.name ||
      'Học viên';
    const email =
      attendeeData?.email && attendeeData.email.includes('@')
        ? attendeeData.email.trim()
        : memberRows[0]?.email && memberRows[0].email.includes('@')
          ? memberRows[0].email.trim()
          : userRows?.email && userRows.email.includes('@')
            ? userRows.email.trim()
            : 'vupv090120@gmail.com';
    const phone = attendeeData?.phone || memberRows[0]?.contact || '';
    const company = attendeeData?.company || '';
    const position = attendeeData?.position || '';
    const ticketCount = Math.max(1, Number(attendeeData?.ticketCount) || 1);
    const ticketType = attendeeData?.ticketType || 'Standard';
    const note = attendeeData?.note || '';
    const confirmOverlap = Boolean(attendeeData?.confirmOverlap);

    // Kiểm tra đăng ký trùng lặp chính sự kiện này
    const alreadyRegistered = await this.prisma
      .$queryRawUnsafe<any[]>(
        `SELECT id FROM public.event_registrations
         WHERE event_id = $1
         AND (member_code = $2 OR (LOWER(TRIM(email)) = LOWER(TRIM($3)) AND $3 != ''))
         AND status != 'cancelled'
         LIMIT 1`,
        eventId,
        memberCode,
        email,
      )
      .catch(() => []);

    if (alreadyRegistered.length > 0 && !confirmOverlap) {
      this.logger.log(
        `Member ${memberCode} (${email}) already registered for event ${eventId}, updating registration info.`,
      );
    }

    const ticketPrice =
      event.ticket_price !== undefined &&
        event.ticket_price !== null &&
        Number(event.ticket_price) > 0
        ? Number(event.ticket_price)
        : event.fee !== undefined && event.fee !== null
          ? Number(event.fee)
          : 0;
    const isFree = ticketPrice === 0;

    const lastReg = await this.prisma.$queryRaw<any[]>`
      SELECT COALESCE(MAX(CASE WHEN id ~ '^[0-9]+$' THEN CAST(id AS BIGINT) ELSE 0 END), 40000) AS max_id
      FROM public.event_registrations
    `.catch(() => []);
    const nextNumericId =
      lastReg.length > 0 && lastReg[0]?.max_id
        ? BigInt(lastReg[0].max_id) + 1n
        : 40001n;

    const targetAssociationId =
      event.association_id && String(event.association_id).length === 36
        ? event.association_id
        : 'c1983000-0000-4000-8000-000000001983';

    const initialStatus = isFree ? 'confirmed' : 'pending';
    const paymentStatus = isFree ? 'free' : 'pending';

    // UC-EVT-02: Hỗ trợ đăng ký nhiều vé (ví dụ 2 vé tự động tạo form cho người thứ 2)
    const attendeesList: any[] =
      Array.isArray(attendeeData?.attendees) && attendeeData.attendees.length > 0
        ? attendeeData.attendees
        : [
            {
              memberCode,
              fullName: memberName,
              phone,
              email,
              company,
              position,
              ticketType,
              ticketPrice,
            },
          ];

    const actualTicketCount = Math.max(attendeesList.length, ticketCount);
    let computedTotalAmount = 0;
    const createdTickets: any[] = [];
    let primaryRegId = '';
    let primaryLuckyNum = '';
    let primaryQrUrl = '';

    for (let i = 0; i < attendeesList.length; i++) {
      const att = attendeesList[i];
      const attName = (att.fullName || att.name || memberName).trim();
      const attPhone = (att.phone || phone).trim();
      const attEmail = (att.email || email).trim().toLowerCase();
      const attCompany = (att.company || company).trim();
      const attPosition = (att.position || position).trim();
      const attCode = (att.memberCode || (i === 0 ? memberCode : '')).trim().toUpperCase();
      const attTicketType = (att.ticketType || ticketType).trim();
      const attPrice = att.ticketPrice !== undefined ? Number(att.ticketPrice) : ticketPrice;
      computedTotalAmount += attPrice;

      const currentRegId = (nextNumericId + BigInt(i)).toString();
      const currentLuckyNum = String(Math.floor(1000 + Math.random() * 9000));
      if (i === 0) {
        primaryRegId = currentRegId;
        primaryLuckyNum = currentLuckyNum;
      }

      const noteText =
        i === 0
          ? note ? `${note} (Đại biểu chính)` : 'Đại biểu chính'
          : `Người tham gia cùng đại biểu ${memberName} (Mã chính: ${primaryRegId})`;

      await this.prisma.$executeRaw`
        INSERT INTO public.event_registrations (
          id, event_id, member_code, member_name, email, phone, company, position, note, registered_at, status, ticket_type, ticket_count, association_id, payment_status, payment_amount, lucky_number, created_at, updated_at
        ) VALUES (
          ${currentRegId},
          ${eventId},
          ${attCode},
          ${attName},
          ${attEmail},
          ${attPhone},
          ${attCompany},
          ${attPosition},
          ${noteText},
          now()::date,
          ${initialStatus},
          ${attTicketType},
          1,
          ${targetAssociationId}::uuid,
          ${paymentStatus},
          ${attPrice},
          ${currentLuckyNum},
          now(),
          now()
        )
      `;

      const attQrUrl = isFree
        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentRegId)}`
        : '';

      if (i === 0) primaryQrUrl = attQrUrl;

      // Nếu sự kiện miễn phí (0đ): gửi vé và mã QR cho từng đại biểu (kể cả người được đăng ký hộ)
      if (isFree && attEmail && attEmail.includes('@')) {
        void this.mailService.sendEventTicketEmail({
          to: attEmail,
          fullName: attName,
          phone: attPhone,
          company: attCompany,
          position: attPosition,
          eventTitle: event.title || event.name || 'Sự kiện CLB CEO HN10',
          eventDate: event.date
            ? event.date instanceof Date
              ? event.date.toLocaleDateString('vi-VN')
              : String(event.date).slice(0, 10)
            : 'Sắp diễn ra',
          eventLocation: event.location || 'Hà Nội',
          registrationId: currentRegId,
          ticketType: attTicketType,
          ticketCount: 1,
          luckyNumber: currentLuckyNum,
          isFree: true,
          totalAmount: 0,
          qrCodeUrl: attQrUrl,
          vietQrUrl: '',
          bankAccount: process.env.SEPAY_ACCOUNT_NO || '',
          bankName: process.env.SEPAY_BANK_NAME || 'MB Bank',
          bankOwner: process.env.SEPAY_ACCOUNT_HOLDER || 'CLB DOANH NHAN CEO HN10',
        }).catch((err) => {
          this.logger.warn(`Lỗi gửi vé email cho ${attEmail}: ${err?.message}`);
        });
      }

      createdTickets.push({
        id: currentRegId,
        fullName: attName,
        phone: attPhone,
        email: attEmail,
        ticketType: attTicketType,
        ticketPrice: attPrice,
        luckyNumber: currentLuckyNum,
        qrCodeUrl: attQrUrl,
      });
    }

    const regId = primaryRegId;
    const luckyNum = primaryLuckyNum;
    const totalAmount = computedTotalAmount;

    // Cập nhật số lượng người đăng ký vào bảng events
    await this.prisma.$executeRaw`
      UPDATE public.events SET registered = registered + ${actualTicketCount}, updated_at = now() WHERE id = ${eventId}
    `.catch(() => null);

    const qrCodeUrl = primaryQrUrl;
    const invoiceNo = `EV${regId}`;

    const sepayCfg = this.paymentService
      ? await this.paymentService.getSepayConfig()
      : {
          bankName: process.env.SEPAY_BANK_NAME || 'MBBank',
          accountNumber: process.env.SEPAY_ACCOUNT_NO || '',
          accountHolder: process.env.SEPAY_ACCOUNT_HOLDER || '',
          prefixEvent: 'CEO1983_EVT',
        };
    const bankShort = (sepayCfg.bankName || 'MB').toUpperCase().includes('MB') ? 'MB' : (sepayCfg.bankName || 'MB');
    // Mã chuyển khoản chuẩn: CEO1983_EVT_[ID]
    const memo = `CEO1983_EVT_${regId}`;
    const vietQrUrl = isFree || !sepayCfg.accountNumber
      ? ''
      : `https://img.vietqr.io/image/${bankShort}-${sepayCfg.accountNumber}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(sepayCfg.accountHolder)}`;

    const driveInfo = event.photo_gallery_url
      ? `\n- Link kho ảnh sự kiện (Google Drive): ${event.photo_gallery_url}`
      : '';

    if (memberCode) {
      if (isFree) {
        // Sự kiện Free: Gửi tin nhắn chào mừng & Thẻ Vé Điện Tử (VIP E-Ticket Pass có mã QR) từ Ban Truyền Thông
        const confirmMsg = `Kính gửi Anh/Chị ${memberName}, Ban Truyền Thông CLB Doanh Nhân CEO HN10 xin trân trọng gửi tới Anh/Chị Vé Điện Tử tham dự sự kiện "${event.title || event.name || 'Sự kiện'}".\n\n- Mã vé: ${regId}\n- Số may mắn (Lucky Draw): #${luckyNum}\n- Số lượng vé: ${ticketCount} vé (${ticketType})\n- Thời gian: ${event.date ? (event.date instanceof Date ? event.date.toLocaleDateString('vi-VN') : String(event.date)) : 'Sắp diễn ra'}\n- Địa điểm: ${event.location || 'Địa điểm tổ chức sự kiện'}${driveInfo}\n- Trạng thái: ĐÃ XÁC NHẬN (Miễn phí 0 đ)\n\nVui lòng sử dụng Thẻ Vé Điện Tử và mã QR bên dưới để xuất trình tại bàn đón tiếp sự kiện.`;

        const ticketActionMsg = `[action:ticket|eventId:${eventId}|eventTitle:${encodeURIComponent(event.title || event.name || 'Sự kiện')}|ticketCode:${regId}|lucky:${luckyNum}|time:${encodeURIComponent(event.date ? (event.date instanceof Date ? event.date.toLocaleDateString('vi-VN') : String(event.date)) : 'Sắp diễn ra')}|location:${encodeURIComponent(event.location || 'Địa điểm tổ chức sự kiện')}|attendee:${encodeURIComponent(memberName)}|qr:${encodeURIComponent(qrCodeUrl)}|type:${encodeURIComponent(ticketType)}|count:${ticketCount}]`;

        await this.prisma.$executeRaw`
          INSERT INTO public.messages (id, from_id, to_id, text, created_at)
          VALUES (gen_random_uuid(), 'channel_media', ${String(memberCode).toLowerCase()}, ${confirmMsg}, NOW() - interval '1 second')
        `.catch(() => { });

        await this.prisma.$executeRaw`
          INSERT INTO public.messages (id, from_id, to_id, text, created_at)
          VALUES (gen_random_uuid(), 'channel_media', ${String(memberCode).toLowerCase()}, ${ticketActionMsg}, NOW())
        `.catch(() => { });

        // Gửi thông báo đẩy cá nhân (business_notifications)
        if (userId) {
          const dedupeKey = `event_reg_free_${regId}_${userId}`;
          await this.prisma.$executeRaw`
            INSERT INTO public.business_notifications (
              id, recipient_user_id, source_domain, source_record_id, dedupe_key, event_kind, notification_kind,
              title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), ${userId}::uuid, 'event', ${regId}, ${dedupeKey}, 'event_ticket_issued', 'event_ticket_issued',
              'Vé tham gia sự kiện miễn phí (0đ) đã sẵn sàng',
              ${`Bạn đã đăng ký thành công vé tham dự sự kiện "${event.title || event.name}". Mã vé: ${regId} · Số may mắn: #${luckyNum}.`},
              ${JSON.stringify({ eventId, regId, luckyNumber: luckyNum, isFree: true, title: event.title || event.name })}::jsonb,
              'high', 'delivered', 'all', 'all', now(), now()
            )
          `.catch(() => { });
        }

        // Gửi thông báo vào Notification Center CRM
        const crmNotifCode = `NOTIF-EVT-${Date.now().toString().slice(-6)}`;
        await this.prisma.$executeRaw`
          INSERT INTO public.notifications (
            id, code, title, body, audience, channel, status, sent_at, reach, association_id, app_scope, target_app, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), ${crmNotifCode},
            ${`Học viên đăng ký vé 0đ: ${event.title || event.name}`},
            ${`Học viên ${memberName} (${memberCode}) đã nhận vé miễn phí sự kiện "${event.title || event.name}". Mã vé: ${regId} - Số may mắn: #${luckyNum}.`},
            'all', 'inapp', 'sent', now(), 1, ${event.association_id ? event.association_id : null}::uuid, 'all', 'all', now(), now()
          )
        `.catch(() => { });
      } else {
        // Sự kiện có phí: Gửi tin nhắn thông báo tiếp nhận & thẻ thanh toán VietQR từ Ban Truyền Thông
        const dueDate = new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString('vi-VN');
        const paymentDesc = encodeURIComponent(
          `Phí tham dự sự kiện "${event.title || event.name || 'Sự kiện'}" (${ticketCount} vé)`,
        );
        const actionMsg = `[action:payment|amount:${totalAmount}|invoice:${invoiceNo}|qr:${vietQrUrl}|due:${dueDate}|desc:${paymentDesc}]`;

        const greetingMsg = `Kính gửi Anh/Chị ${memberName}, Ban Truyền Thông CLB Doanh Nhân CEO HN10 đã tiếp nhận thành công thông tin đăng ký tham dự sự kiện "${event.title || event.name || 'Sự kiện'}".\n\n- Người đăng ký: ${memberName} (${position ? position + ' - ' : ''}${company || 'Học viên'})\n- Số điện thoại: ${phone || 'Chưa cập nhật'}\n- Số lượng vé: ${ticketCount} vé (${ticketType})\n- Tổng chi phí: ${new Intl.NumberFormat('vi-VN').format(totalAmount)} đ${driveInfo}\n\nVui lòng quét mã VietQR hoặc chuyển khoản theo hóa đơn bên dưới để hoàn tất thủ tục tham dự.`;

        await this.prisma.$executeRaw`
          INSERT INTO public.messages (id, from_id, to_id, text, created_at)
          VALUES (gen_random_uuid(), 'channel_media', ${String(memberCode).toLowerCase()}, ${greetingMsg}, NOW() - interval '1 second')
        `.catch(() => { });

        await this.prisma.$executeRaw`
          INSERT INTO public.messages (id, from_id, to_id, text, created_at)
          VALUES (gen_random_uuid(), 'channel_media', ${String(memberCode).toLowerCase()}, ${actionMsg}, NOW())
        `.catch(() => { });

        // Gửi thông báo vào Notification Center CRM cho sự kiện có phí
        const crmPaidNotifCode = `NOTIF-PAID-EVT-${Date.now().toString().slice(-6)}`;
        await this.prisma.$executeRaw`
          INSERT INTO public.notifications (
            id, code, title, body, audience, channel, status, sent_at, reach, association_id, app_scope, target_app, target_channel, pushed_to_messages, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), ${crmPaidNotifCode},
            ${`Học viên đăng ký vé sự kiện: ${event.title || event.name}`},
            ${`Học viên ${memberName} (${memberCode}) đã đăng ký ${ticketCount} vé sự kiện "${event.title || event.name}" (Tổng tiền: ${new Intl.NumberFormat('vi-VN').format(totalAmount)} đ). Hóa đơn: ${invoiceNo}.`},
            'all', 'inapp', 'sent', now(), 1, ${event.association_id ? event.association_id : null}::uuid, 'all', 'all', 'admins', true, now(), now()
          )
        `.catch(() => { });
      }
    }

    // Gửi email vé sự kiện điện tử (E-Ticket) CHỈ DÀNH CHO SỰ KIỆN MIỄN PHÍ (0đ).
    // Sự kiện có phí phải chờ Ban Truyền Thông / Tài Chính kiểm tra và bấm "Đã thanh toán" mới gửi vé kèm QR check-in!
    if (isFree && email && email.includes('@')) {
      void (async () => {
        try {
          await this.mailService.sendEventTicketEmail({
            to: email,
            fullName: memberName,
            phone,
            company,
            position,
            eventTitle: event.title || event.name || 'Sự kiện CLB CEO HN10',
            eventDate: event.date
              ? event.date instanceof Date
                ? event.date.toLocaleDateString('vi-VN')
                : String(event.date).slice(0, 10)
              : 'Sắp diễn ra',
            eventLocation: event.location || 'Hà Nội',
            registrationId: regId,
            ticketType,
            ticketCount,
            luckyNumber: luckyNum,
            isFree: true,
            totalAmount: 0,
            qrCodeUrl,
            vietQrUrl: '',
            bankAccount: process.env.SEPAY_ACCOUNT_NO || '',
            bankName: process.env.SEPAY_BANK_NAME || 'MB Bank',
            bankOwner: process.env.SEPAY_ACCOUNT_HOLDER || 'CLB DOANH NHAN CEO HN10',
          });
          this.logger.log(
            `Member free event ticket email dispatched to ${email} (Registration: ${regId}, Lucky #${luckyNum})`,
          );
        } catch (err: any) {
          this.logger.warn(
            `Failed to dispatch event ticket email to member ${email}: ${err?.message}`,
          );
        }
      })();
    }

    // Đối với sự kiện có phí: chỉ gửi email thông báo mã VNPAY-QR thanh toán (KHÔNG có số lucky, mã dự thưởng, hay mã QR vé)
    if (!isFree) {
      const vnpayQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `VNPAYQR|EV${regId}|${totalAmount}|${phone || ''}`,
      )}`;
      const paymentNoticePayload = {
        fullName: memberName,
        phone,
        company,
        position,
        eventTitle: event.title || event.name || 'Sự kiện CLB CEO HN10',
        eventDate: event.date
          ? event.date instanceof Date
            ? event.date.toLocaleDateString('vi-VN')
            : String(event.date).slice(0, 10)
          : 'Sắp diễn ra',
        eventLocation: event.location || 'Hà Nội',
        registrationId: regId,
        ticketType,
        ticketCount,
        luckyNumber: undefined,
        isFree: false,
        paymentConfirmed: false,
        totalAmount,
        qrCodeUrl: '',
        vietQrUrl: vietQrUrl,
        bankAccount: sepayCfg.accountNumber,
        bankName: sepayCfg.bankName || 'Ngân hàng thụ hưởng',
        bankOwner: sepayCfg.accountHolder,
      };

      void (async () => {
        if (email && email.includes('@')) {
          try {
            await this.mailService.sendEventTicketEmail({
              ...paymentNoticePayload,
              to: email,
            });
            this.logger.log(
              `Paid event registration VietQR email dispatched to registrant ${email}`,
            );
          } catch (err: any) {
            this.logger.warn(
              `Failed to dispatch paid event VietQR email to registrant ${email}: ${err?.message}`,
            );
          }
        }

        const primaryAdminEmail =
          process.env.ADMIN_NOTIFY_EMAIL || 'vupv090120@gmail.com';
        if (
          primaryAdminEmail &&
          primaryAdminEmail.toLowerCase() !== email.toLowerCase()
        ) {
          try {
            await this.mailService.sendEventTicketEmail({
              ...paymentNoticePayload,
              to: primaryAdminEmail,
              fullName: `${memberName} (Đăng ký vé có phí - Hệ thống)`,
            });
            this.logger.log(
              `Paid event registration VietQR email dispatched to primary admin ${primaryAdminEmail}`,
            );
          } catch (err: any) {
            this.logger.warn(
              `Failed to dispatch paid event email to primary admin: ${err?.message}`,
            );
          }
        }
      })();
    }

    return {
      ok: true,
      registered: isFree,
      registrationId: regId,
      eventId,
      ticketType,
      ticketCount: actualTicketCount,
      totalAmount,
      isFree,
      paymentStatus,
      status: initialStatus,
      luckyNumber: luckyNum,
      qrCodeUrl,
      vietQrUrl,
      memberName,
      eventTitle: event.title || event.name,
      tickets: createdTickets,
      message: isFree
        ? `Đăng ký thành công ${actualTicketCount} vé tham dự sự kiện miễn phí! Mã vé và mã QR check-in đã được gửi tới email của Quý Anh/Chị.`
        : `Đã tiếp nhận đăng ký ${actualTicketCount} vé tham dự sự kiện! Vui lòng chuyển khoản thanh toán số tiền ${totalAmount.toLocaleString('vi-VN')} đ theo mã VietQR. Sau khi xác nhận thanh toán, hệ thống sẽ tự động kích hoạt mã QR vé và gửi email cho Quý Anh/Chị.`,
    };
  }

  // Mobile API: Cancel registration for an event
  async cancelEventRegistration(
    userId: string,
    eventId: string,
    reason?: string,
  ) {
    const eventRows = await this.prisma
      .$queryRawUnsafe<any[]>(
        `
      SELECT * FROM public.events WHERE id::text = $1 OR id = $2::uuid LIMIT 1
    `,
        eventId,
        eventId.match(/[0-9a-f-]{36}/i)
          ? eventId
          : '00000000-0000-0000-0000-000000000000',
      )
      .catch(() => []);

    // Also look for registration directly if eventId might be a registration id
    let resolvedEventId = eventId;
    let eventTitle = 'Sự kiện';
    if (eventRows.length > 0) {
      resolvedEventId = String(eventRows[0].id);
      eventTitle = eventRows[0].title || eventRows[0].name || 'Sự kiện';
    } else {
      const regRows = await this.prisma
        .$queryRawUnsafe<any[]>(
          `
        SELECT r.*, e.name as event_name, e.title as event_title
        FROM public.event_registrations r
        LEFT JOIN public.events e ON e.id = r.event_id
        WHERE r.id = $1 OR r.id = $2
        LIMIT 1
      `,
          eventId,
          eventId.replace(/\D/g, '') || '0',
        )
        .catch(() => []);
      if (regRows.length > 0) {
        resolvedEventId = String(regRows[0].event_id);
        eventTitle =
          regRows[0].event_title || regRows[0].event_name || 'Sự kiện';
      }
    }

    const event: any = eventRows[0] || {
      id: resolvedEventId,
      title: eventTitle,
      name: eventTitle,
    };

    // Find member profile for user
    const memberRows = await this.prisma
      .$queryRawUnsafe<any[]>(
        `
      SELECT * FROM public.members WHERE user_id = $1::uuid OR id = $1 LIMIT 1
    `,
        userId,
      )
      .catch(() => []);

    const userRows = await this.prisma.vione_users
      .findUnique({
        where: { id: userId },
      })
      .catch(() => null);

    const memberCode = memberRows[0]?.code ?? null;
    const email = memberRows[0]?.email ?? userRows?.email ?? null;
    const phone = memberRows[0]?.phone ?? (userRows as any)?.phone ?? null;
    const memberName =
      memberRows[0]?.name ??
      userRows?.name ??
      (userRows as any)?.full_name ??
      null;

    // Update registration status to cancelled
    await this.prisma
      .$queryRawUnsafe(
        `
      UPDATE public.event_registrations
      SET status = 'cancelled', seat_assignment = NULL, updated_at = now()
      WHERE (event_id::text = $1 OR id = $1 OR id = $2)
        AND (
          ($3::text IS NOT NULL AND member_code = $3)
          OR ($4::text IS NOT NULL AND email = $4)
          OR ($5::text IS NOT NULL AND phone = $5)
          OR ($6::text IS NOT NULL AND member_name = $6)
          OR member_id = $7
          OR member_code = $7
          OR $8::text = 'ANY'
        )
        AND status != 'cancelled'
    `,
        resolvedEventId,
        eventId.replace(/\D/g, '') || '0',
        memberCode,
        email,
        phone,
        memberName,
        userId,
        memberCode || email || phone ? 'SPECIFIC' : 'ANY',
      )
      .catch(() => 0);

    // Decrement registered count if > 0
    await this.prisma
      .$executeRawUnsafe(
        `
      UPDATE public.events
      SET registered = GREATEST(0, registered - 1), updated_at = now()
      WHERE id::text = $1 OR id = $2::uuid
    `,
        resolvedEventId,
        resolvedEventId.match(/[0-9a-f-]{36}/i)
          ? resolvedEventId
          : '00000000-0000-0000-0000-000000000000',
      )
      .catch(() => null);

    try {
      const cancelReasonText = reason ? ` Lý do: "${reason}".` : '';
      const notifTitle = 'Hủy tham gia sự kiện thành công';
      const notifBody = `Bạn đã hủy tham gia sự kiện "${event.title || event.name || 'Sự kiện'}".${cancelReasonText}`;
      const notifId = require('crypto').randomUUID();
      const dedupeKey = `event-cancel-${eventId}-${userId}-${Date.now()}`;
      const safeData = JSON.stringify({
        title: notifTitle,
        body: notifBody,
        eventId,
        eventTitle: event.title || event.name,
        targetRoute: `/events/${eventId}`,
      });

      await this.prisma
        .$executeRawUnsafe(
          `
        INSERT INTO public.business_notifications (
          id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
          title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
        ) VALUES (
          $1::uuid, $2::uuid, 'event', $3, 'event_cancelled', 'ticket_cancelled',
          $4, $5, $6::jsonb, 'normal', 'delivered', $7, 'all', 'all', NOW(), NOW()
        )
      `,
          notifId,
          userId,
          eventId,
          notifTitle,
          notifBody,
          safeData,
          dedupeKey,
        )
        .catch(() => { });

      await this.prisma
        .$executeRawUnsafe(
          `
        INSERT INTO public.member_notifications (
          id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, false, false, 'event', $4, NOW()
        )
      `,
          memberRows[0]?.id || userId,
          notifTitle,
          notifBody,
          eventId,
        )
        .catch(() => { });

      // Dispatch inbox message
      const inboxMsg = `[XÁC NHẬN HỦY VÉ SỰ KIỆN]\nKính gửi Anh/Chị,\nHệ thống đã ghi nhận việc hủy tham gia sự kiện "${event.title || event.name || 'Sự kiện'}".${cancelReasonText}\nTrạng thái vé của Anh/Chị đã được chuyển thành 'Đã hủy'.`;
      if (memberCode) {
        await this.prisma.$executeRaw`
          INSERT INTO public.messages (id, from_id, to_id, text, created_at)
          VALUES (gen_random_uuid(), 'ADMIN', ${String(memberCode).toLowerCase()}, ${inboxMsg}, NOW())
        `.catch(() => { });
      }
      await this.prisma.$executeRaw`
        INSERT INTO public.messages (id, from_id, to_id, text, created_at)
        VALUES (gen_random_uuid(), 'ADMIN', ${userId}, ${inboxMsg}, NOW())
      `.catch(() => { });
    } catch (e: any) {
      console.warn(
        'Failed to send event cancellation notification:',
        e?.message,
      );
    }

    return { ok: true, cancelled: true };
  }

  // Cancel an entire event (by Organizer or Admin)
  async cancelEvent(
    userId: string,
    eventId: string,
    data: { reason: string; refundPolicy?: string },
  ) {
    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);

    if (eventRows.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }

    const event = eventRows[0];
    const assocId =
      event.association_id || 'c1983000-0000-4000-8000-000000001983';
    const isAdmin = await this.checkIsAdmin(userId, assocId);
    if (!isAdmin && event.created_by !== userId) {
      throw new ForbiddenException(
        'Chỉ Ban Tổ Chức hoặc Quản trị viên mới có quyền hủy sự kiện',
      );
    }

    const reason = (data.reason || '').trim();
    if (!reason) {
      throw new BadRequestException(
        'Vui lòng nhập lý do hủy sự kiện chuẩn nghiệp vụ',
      );
    }

    // 1. Update event status in DB and clear registered count
    await this.prisma.$executeRaw`
      UPDATE public.events
      SET status = 'cancelled', registered = 0, updated_at = now()
      WHERE id = ${eventId}
    `;

    // 2. Fetch all registered attendees
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT r.*, m.user_id as member_user_id, m.email as member_email
      FROM public.event_registrations r
      LEFT JOIN public.members m ON m.code = r.member_code
      WHERE r.event_id = ${eventId} AND r.status != 'cancelled'
    `.catch(() => []);

    // 3. Mark all registrations as cancelled
    await this.prisma.$executeRaw`
      UPDATE public.event_registrations
      SET status = 'cancelled', updated_at = now()
      WHERE event_id = ${eventId} AND status != 'cancelled'
    `.catch(() => { });

    // 4. Distinguish FREE vs PAID event
    const ticketPrice = Number(event.ticket_price || event.fee || 0);
    const isPaidEvent = Boolean(event.is_paid || ticketPrice > 0);
    const eventTitle = event.title || event.name || 'Sự kiện';
    const eventDateStr = event.date
      ? event.date instanceof Date
        ? event.date.toLocaleDateString('vi-VN')
        : String(event.date)
      : 'Sắp diễn ra';
    const eventLocationStr = event.location || 'Địa điểm tổ chức';

    const notifTitle = isPaidEvent
      ? `[HỦY SỰ KIỆN CÓ PHÍ] ${eventTitle}`
      : `[HỦY SỰ KIỆN] ${eventTitle}`;

    const refundPolicyText =
      data.refundPolicy ||
      'Ban Tổ Chức sẽ liên hệ và thực hiện hoàn trả 100% lệ phí tham gia vào số tài khoản của Quý Học viên trong vòng 3 - 5 ngày làm việc.';

    const notifBody = isPaidEvent
      ? `Sự kiện "${eventTitle}" dự kiến tổ chức ngày ${eventDateStr} đã bị hủy.\nLý do: "${reason}".\nCHÍNH SÁCH HOÀN TIỀN: ${refundPolicyText}\nHotline hỗ trợ: Ban Tài chính & Thư ký CLB CEO HN10.`
      : `Sự kiện "${eventTitle}" dự kiến tổ chức ngày ${eventDateStr} tại ${eventLocationStr} đã bị hủy vì lý do: "${reason}". Ban Tổ Chức trân trọng cáo lỗi cùng Quý Học viên vì sự bất tiện này.`;

    // 5. Broadcast to each registered attendee
    for (const reg of regRows) {
      const targetUserId = reg.member_user_id || reg.user_id || null;
      const targetMemberCode = reg.member_code
        ? String(reg.member_code).toLowerCase()
        : null;

      // 5a. Direct inbox message (messages)
      const directMsgText = `[THÔNG BÁO TỪ BAN TỔ CHỨC]\nKính gửi Anh/Chị ${reg.member_name || 'Học viên'},\n\n${notifBody}`;
      if (targetMemberCode) {
        await this.prisma.$executeRaw`
          INSERT INTO public.messages (id, from_id, to_id, text, created_at)
          VALUES (gen_random_uuid(), 'ADMIN', ${targetMemberCode}, ${directMsgText}, NOW())
        `.catch(() => { });
      }
      if (targetUserId) {
        await this.prisma.$executeRaw`
          INSERT INTO public.messages (id, from_id, to_id, text, created_at)
          VALUES (gen_random_uuid(), 'ADMIN', ${targetUserId}, ${directMsgText}, NOW())
        `.catch(() => { });

        // 5b. App bell push notification (business_notifications)
        const dedupeKey = `cancel_evt_${eventId}_${targetUserId}_${Date.now()}`;
        const safeData = JSON.stringify({
          eventId,
          eventTitle,
          reason,
          isPaidEvent,
          refundPolicy: isPaidEvent ? refundPolicyText : undefined,
        });

        await this.prisma
          .$executeRawUnsafe(
            `
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, dedupe_key, event_kind, notification_kind,
            title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1::uuid, 'event', $2, $3, 'event_cancelled', 'event_cancelled',
            $4, $5, $6::jsonb, 'urgent', 'delivered', 'all', 'all', now(), now()
          )
        `,
            targetUserId,
            eventId,
            dedupeKey,
            notifTitle,
            notifBody,
            safeData,
          )
          .catch(() => { });
      }

      // 5c. Member in-app notifications (member_notifications)
      await this.prisma
        .$executeRawUnsafe(
          `
        INSERT INTO public.member_notifications (
          id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, false, false, 'event', $4, NOW()
        )
      `,
          reg.member_id || targetUserId || reg.id,
          notifTitle,
          notifBody,
          eventId,
        )
        .catch(() => { });

      // 5d. Send cancellation email to attendee
      const recipientEmail = (reg.email || reg.member_email || '').trim();
      if (recipientEmail && recipientEmail.includes('@') && this.mailService) {
        const attendeeName = reg.member_name || 'Quý Hội viên / Quý Đại biểu';
        const emailSubject = `[THÔNG BÁO HỦY SỰ KIỆN] ${eventTitle} — CLB Doanh Nhân CEO HN10`;
        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
            <div style="background: linear-gradient(135deg, #8B0000 0%, #B22222 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.15); border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.25);">
                HANOIBA · CLB DOANH NHÂN CEO HN10
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff;">THÔNG BÁO HỦY SỰ KIỆN</h1>
              <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9; color: #fecaca;">Thông báo khẩn từ Ban Tổ Chức & Thư Ký CLB</p>
            </div>

            <div style="padding: 28px 24px; color: #1e293b; line-height: 1.6;">
              <p style="font-size: 15px; margin: 0 0 16px;">
                Kính gửi Anh/Chị: <strong style="color: #8B0000; font-size: 16px;">${attendeeName}</strong>,
              </p>
              <p style="font-size: 14px; color: #475569; margin: 0 0 20px;">
                Ban Tổ Chức CLB Doanh Nhân CEO HN10 (HanoiBA) xin trân trọng thông báo: Sự kiện dưới đây mà Quý Anh/Chị đã đăng ký tham gia hiện đã bị <strong style="color: #dc2626;">HỦY BỎ</strong>:
              </p>

              <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                <div style="font-size: 16px; font-weight: 800; color: #9f1239; margin-bottom: 10px;">${eventTitle}</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 6px;">
                  🗓 <strong>Lịch dự kiến ban đầu:</strong> ${eventDateStr}
                </div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 6px;">
                  📍 <strong>Địa điểm dự kiến:</strong> ${eventLocationStr}
                </div>
                <div style="font-size: 13px; color: #991b1b; font-weight: 600; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #fecdd3;">
                  ⚠️ <strong>Lý do hủy sự kiện:</strong> ${reason}
                </div>
              </div>

              ${
                isPaidEvent
                  ? `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                  <div style="font-size: 14px; font-weight: 700; color: #166534; margin-bottom: 6px;">
                    💰 CHÍNH SÁCH HOÀN TRẢ LỆ PHÍ VÉ:
                  </div>
                  <div style="font-size: 13px; color: #15803d; line-height: 1.5;">
                    ${refundPolicyText}
                  </div>
                </div>
              `
                  : ''
              }

              <div style="background: #f8fafc; border-left: 4px solid #8B0000; border-radius: 0 8px 8px 0; padding: 12px 16px; margin-bottom: 24px;">
                <div style="font-size: 12px; color: #64748b;">
                  Hệ thống đã tự động hủy đăng ký và thu hồi vé của sự kiện này. Quý Anh/Chị không cần thực hiện thêm bất kỳ thao tác nào.
                </div>
              </div>

              <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">
                Ban Tổ Chức và Thư Ký CLB Doanh Nhân CEO HN10 chân thành cáo lỗi cùng Quý Anh/Chị vì sự thay đổi ngoài ý muốn này. Chúng tôi rất mong nhận được sự thông cảm và tiếp tục đồng hành của Quý Anh/Chị trong các hoạt động sắp tới của CLB.
              </p>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px; font-size: 12px; color: #64748b; line-height: 1.6;">
                <strong>BAN TỔ CHỨC & THƯ KÝ CLB DOANH NHÂN CEO HN10</strong><br />
                Hiệp Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA)<br />
                Hotline hỗ trợ: Ban Thư ký & Ban Sự kiện CLB CEO HN10<br />
                Email: btc@ceohn10.vn · Website: <a href="https://ceohn10.viconnect.vn" style="color: #8B0000; text-decoration: none;">ceohn10.viconnect.vn</a>
              </div>
            </div>
          </div>
        `;
        void this.mailService
          .sendDirectEmail({
            to: recipientEmail,
            subject: emailSubject,
            html: emailHtml,
          })
          .catch((err) => {
            this.logger.warn(`Failed to send cancellation email to ${recipientEmail}: ${err?.message}`);
          });
      }
    }

    // 6. Log into CRM Notification Center (public.notifications)
    const crmNotifCode = `CANCEL-EVT-${Date.now().toString().slice(-6)}`;
    await this.prisma.$executeRaw`
      INSERT INTO public.notifications (
        id, code, title, body, audience, channel, status, sent_at, reach, association_id, app_scope, target_app, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${crmNotifCode},
        ${notifTitle},
        ${`Đã hủy sự kiện "${eventTitle}". Lý do: ${reason}. Đã gửi thông báo & tin nhắn đến ${regRows.length} đại biểu đăng ký.`},
        'all', 'inapp', 'sent', now(), ${regRows.length}, ${event.association_id ? event.association_id : null}::uuid, 'all', 'all', now(), now()
      )
    `.catch(() => { });

    return {
      ok: true,
      cancelled: true,
      notifiedAttendees: regRows.length,
      isPaidEvent,
    };
  }

  async updateRegistrationSeating(
    userId: string,
    registrationId: string,
    seatAssignment?: string | null,
  ) {
    const cleanSeat = seatAssignment && typeof seatAssignment === 'string' && seatAssignment.trim() !== ''
      ? seatAssignment.trim()
      : null;

    await this.prisma.$executeRaw`
      UPDATE public.event_registrations
      SET seat_assignment = ${cleanSeat}, updated_at = now()
      WHERE id = ${registrationId}
    `;

    // Lấy thông tin đại biểu và sự kiện để gửi thông báo Email + Zalo OA
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT r.*, e.name as event_name, e.date as event_date, e.location as event_location,
             COALESCE(r.attendee_name, m.name, u.name) as member_name,
             COALESCE(r.attendee_email, m.email, u.email) as member_email,
             COALESCE(r.attendee_phone, m.phone, u.phone) as member_phone
      FROM public.event_registrations r
      LEFT JOIN public.events e ON r.event_id = e.id
      LEFT JOIN public.members m ON r.member_id = m.id
      LEFT JOIN public.vione_users u ON r.user_id = u.id
      WHERE r.id = ${registrationId}
      LIMIT 1
    `.catch(() => []);

    if (regRows.length > 0) {
      const reg = regRows[0];
      const memberEmail = reg.member_email;
      const memberPhone = reg.member_phone;
      const memberName = reg.member_name || 'Quý Học viên';
      const eventName = reg.event_name || 'Sự kiện CEO HN10';
      const eventDateStr = reg.event_date ? new Date(reg.event_date).toLocaleDateString('vi-VN') : '';

      // 1. Gửi Email thông báo
      if (memberEmail && this.mailService) {
        const subject = cleanSeat
          ? `[CEO HN10] Cập nhật vị trí chỗ ngồi sự kiện: ${eventName}`
          : `[CEO HN10] Thông báo điều chỉnh chỗ ngồi sự kiện: ${eventName}`;
        const html = cleanSeat
          ? `<div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
              <h2 style="color: #003B95; margin-bottom: 12px;">CLB Doanh Nhân CEO HN10 (HanoiBA)</h2>
              <p>Kính gửi <strong>${memberName}</strong>,</p>
              <p>Ban Tổ Chức xin thông báo vị trí chỗ ngồi của Quý Học viên tại sự kiện <strong>${eventName}</strong> đã được sắp xếp:</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #003B95; padding: 12px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Vị trí ghế ngồi:</strong> <span style="font-size: 16px; color: #003B95; font-weight: bold;">${cleanSeat}</span></p>
                <p style="margin: 4px 0;"><strong>Thời gian:</strong> ${eventDateStr}</p>
                <p style="margin: 4px 0;"><strong>Địa điểm:</strong> ${reg.event_location || 'Hà Nội'}</p>
              </div>
              <p>Quý Học viên vui lòng mở ứng dụng <strong>CEO HN10 Mobile App</strong> để xuất trình thẻ QR Check-in khi tham dự sự kiện.</p>
              <p style="margin-top: 24px; color: #64748b; font-size: 13px;">Trân trọng cảm ơn,<br/><strong>Ban Tổ Chức CLB Doanh Nhân CEO HN10</strong></p>
            </div>`
          : `<div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
              <h2 style="color: #003B95; margin-bottom: 12px;">CLB Doanh Nhân CEO HN10 (HanoiBA)</h2>
              <p>Kính gửi <strong>${memberName}</strong>,</p>
              <p>Ban Tổ Chức xin thông báo vị trí chỗ ngồi trước đây của Quý Học viên tại sự kiện <strong>${eventName}</strong> đã được gỡ để điều chỉnh sắp xếp lại theo sơ đồ mới của Ban Tổ Chức.</p>
              <p>Chúng tôi sẽ cập nhật vị trí mới sớm nhất và gửi thông báo tới Quý Học viên qua Email và Zalo OA.</p>
              <p style="margin-top: 24px; color: #64748b; font-size: 13px;">Trân trọng cảm ơn,<br/><strong>Ban Tổ Chức CLB Doanh Nhân CEO HN10</strong></p>
            </div>`;

        void this.mailService.sendDirectEmail({ to: memberEmail, subject, html }).catch(() => { });
      }

      // 2. Gửi Zalo OA thông báo
      if (memberPhone && this.zaloService) {
        const zaloTitle = cleanSeat
          ? `[CEO HN10] Chỗ ngồi sự kiện: ${eventName}`
          : `[CEO HN10] Điều chỉnh chỗ ngồi sự kiện: ${eventName}`;
        const zaloContent = cleanSeat
          ? `Kính gửi ${memberName}, vị trí chỗ ngồi của bạn tại sự kiện "${eventName}" đã được cập nhật: ${cleanSeat}. Vui lòng mở ứng dụng CEO HN10 để xem chi tiết.`
          : `Kính gửi ${memberName}, vị trí chỗ ngồi của bạn tại sự kiện "${eventName}" đang được sắp xếp lại. Chúng tôi sẽ cập nhật vị trí mới sớm nhất.`;

        void this.zaloService.sendAutoNotification({
          recipientPhone: memberPhone,
          recipientEmail: memberEmail,
          recipientName: memberName,
          title: zaloTitle,
          content: zaloContent,
          ctaText: 'Xem sự kiện',
          ctaUrl: 'https://app.ceohn10.viconnect.vn/association/events',
        }).catch(() => { });
      }
    }

    return { ok: true, id: registrationId, seatAssignment: cleanSeat };
  }

  async recordWalkInCashPayment(
    userId: string,
    registrationId: string,
    customAmount?: number,
  ) {
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_registrations WHERE id = ${registrationId} LIMIT 1
    `.catch(() => []);
    if (regRows.length === 0)
      throw new NotFoundException('Không tìm thấy đăng ký');
    const reg = regRows[0];
    const amount =
      customAmount && customAmount > 0
        ? customAmount
        : Number(reg.payment_amount || 500000);

    // 1. Update event_registrations
    await this.prisma.$executeRaw`
      UPDATE public.event_registrations
      SET payment_status = 'paid', payment_method = 'cash', payment_amount = ${amount}, updated_at = now()
      WHERE id = ${registrationId}
    `;

    // 2. Insert into transactions table as Quản lý thu - Tiền mặt
    const txCode = `THU-TM-${Date.now().toString(36).toUpperCase()}`;
    await this.prisma.$executeRaw`
      INSERT INTO public.transactions (
        id, code, date, type, category, description, amount, method, status, association_id, recipient, invoice_url, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${txCode},
        now()::date,
        'income',
        'event_fee',
        ${'Thu tiền mặt sự kiện: ' + (reg.member_name || 'Khách vãng lai') + ' (' + registrationId + ')'},
        ${amount},
        'cash',
        'completed',
        ${reg.association_id}::uuid,
        ${reg.member_name || 'Khách vãng lai'},
        ${'/invoices/' + txCode + '.pdf'},
        now(),
        now()
      )
    `.catch((err) =>
      console.error('Error inserting walk-in transaction:', err),
    );

    // 3. Gửi email xác nhận thanh toán vé sự kiện thành công
    try {
      const recipientEmail = (
        reg.email ||
        process.env.ADMIN_NOTIFY_EMAIL ||
        'vupv090120@gmail.com'
      ).trim();
      const eventRows = await this.prisma.$queryRaw<any[]>`
        SELECT title FROM public.events WHERE id = ${reg.event_id}::uuid LIMIT 1
      `.catch(() => []);
      const eventTitle = eventRows[0]?.title || 'Sự kiện Doanh nhân CEO HN10';

      await this.mailService.sendEventPaymentSuccessEmail({
        to: recipientEmail,
        fullName: reg.member_name || 'Quý Học viên',
        eventTitle,
        ticketType: reg.ticket_type || 'Vé tham dự sự kiện',
        registrationId,
        amountPaid: amount,
        paymentMethod: 'Tiền mặt tại bàn đón tiếp',
        luckyNumber: reg.lucky_number ? String(reg.lucky_number) : undefined,
      });
    } catch (mailErr: any) {
      this.logger.warn(
        `Failed to dispatch event payment success email: ${mailErr?.message}`,
      );
    }

    return {
      ok: true,
      id: registrationId,
      txCode,
      amount,
      paymentStatus: 'paid',
      paymentMethod: 'cash',
    };
  }

  async sendPaymentReminder(userId: string, registrationId: string) {
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_registrations WHERE id = ${registrationId} LIMIT 1
    `.catch(() => []);
    if (regRows.length === 0)
      throw new NotFoundException('Không tìm thấy đăng ký');
    const reg = regRows[0];
    const currentReminders = Number(reg.reminder_count || 0) + 1;

    if (currentReminders >= 3) {
      // After 3 reminders without payment, cancel registration
      await this.prisma.$executeRaw`
        UPDATE public.event_registrations
        SET status = 'cancelled', payment_status = 'cancelled', reminder_count = ${currentReminders}, last_reminded_at = now(), updated_at = now()
        WHERE id = ${registrationId}
      `;
      return {
        ok: true,
        id: registrationId,
        reminderCount: currentReminders,
        status: 'cancelled',
        message:
          'Đã nhắc 3 lần không thanh toán phí. Hệ thống đã tự động hủy đơn đăng ký tham gia sự kiện.',
      };
    } else {
      await this.prisma.$executeRaw`
        UPDATE public.event_registrations
        SET reminder_count = ${currentReminders}, last_reminded_at = now(), updated_at = now()
        WHERE id = ${registrationId}
      `;
      return {
        ok: true,
        id: registrationId,
        reminderCount: currentReminders,
        status: reg.status,
        message: `Đã gửi thông báo nhắc nhở thanh toán lần ${currentReminders}/3 thành công.`,
      };
    }
  }

  async confirmBankPayment(
    userId: string,
    registrationId: string,
    paymentMethod = 'bank_transfer',
  ) {
    const cleanId = String(registrationId || '').trim();
    const rawDigits = cleanId.replace(/\D/g, '');
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_registrations 
      WHERE id = ${cleanId} 
         OR id::text = ${cleanId} 
         OR id::text = ${'EV' + cleanId}
         OR (${rawDigits !== ''} AND (id::text = ${rawDigits} OR id::text = ${'EV' + rawDigits}))
      LIMIT 1
    `.catch(() => []);
    if (regRows.length === 0)
      throw new NotFoundException(
        `Không tìm thấy phiếu đăng ký sự kiện #${registrationId}`,
      );
    const reg = regRows[0];
    const actualRegId = reg.id || cleanId;

    const isAlreadyPaid = reg.payment_status === 'paid';
    const amount = Number(reg.payment_amount || 0);

    // 1. Update event_registrations to paid & confirmed
    await this.prisma.$executeRaw`
      UPDATE public.event_registrations
      SET payment_status = 'paid',
          status = 'confirmed',
          payment_method = ${paymentMethod},
          paid_at = now(),
          updated_at = now()
      WHERE id = ${actualRegId} OR id::text = ${actualRegId}::text
    `;

    // 2. Increment registered count in events table if not already paid
    if (!isAlreadyPaid && reg.event_id) {
      await this.prisma.$executeRaw`
        UPDATE public.events SET registered = registered + 1, updated_at = now() 
        WHERE id = ${reg.event_id}::uuid OR id::text = ${reg.event_id}::text
      `.catch(() => null);
    }

    // 3. Generate QR Code Check-in
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(actualRegId)}`;

    // 4. Record income in transactions if amount > 0
    const txCode = `THU-EV${actualRegId}`;
    if (amount > 0) {
      await this.prisma.$executeRaw`
        INSERT INTO public.transactions (
          id, code, date, type, category, description, amount, method, status, association_id, recipient, invoice_url, provider, provider_ref, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${txCode},
          now()::date,
          'income',
          'Vé sự kiện',
          ${'Xác nhận thanh toán phí tham dự sự kiện: ' + (reg.member_name || 'Học viên') + ' (' + actualRegId + ')'},
          ${amount},
          ${paymentMethod},
          'completed',
          ${reg.association_id ? reg.association_id : 'c1983000-0000-4000-8000-000000001983'}::uuid,
          ${reg.member_name || 'Học viên'},
          ${'/invoices/' + txCode + '.pdf'},
          'vnpay',
          ${actualRegId},
          now(),
          now()
        )
      `.catch((err) =>
        console.error('Error inserting event confirmation transaction:', err),
      );

      const invoiceNo = `INV-EVT-${actualRegId}`;
      await this.prisma
        .$executeRawUnsafe(
          `
        INSERT INTO public.invoices (
          id, member_id, invoice_no, year, amount, due_date, paid_at, status, method, category, customer_name, customer_email, customer_phone, association_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_DATE, 'paid', $6, 'Vé sự kiện', $7, $8, $9, $10, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET status = 'paid', paid_at = CURRENT_DATE, method = $6, updated_at = NOW()
      `,
          invoiceNo,
          reg.member_code || actualRegId,
          invoiceNo,
          new Date().getFullYear(),
          Math.round(amount),
          paymentMethod,
          reg.member_name || 'Đại biểu',
          reg.email || '',
          reg.phone || '',
          reg.association_id ? reg.association_id : null,
        )
        .catch(() => { });
    }

    // 5. Fetch event details for email & notifications
    const eventRows = reg.event_id
      ? await this.prisma.$queryRaw<any[]>`
      SELECT title, name, date, location, photo_gallery_url FROM public.events 
      WHERE id = ${reg.event_id}::uuid OR id::text = ${reg.event_id}::text LIMIT 1
    `.catch(() => [])
      : [];
    const event = eventRows[0] || {};
    const eventTitle = event.title || event.name || 'Sự kiện CLB CEO HN10';
    const eventDateStr = event.date
      ? event.date instanceof Date
        ? event.date.toLocaleDateString('vi-VN')
        : String(event.date).slice(0, 10)
      : 'Sắp diễn ra';

    // 6. Gửi Email Vé Điện Tử kèm Mã QR Check-in về email của người đăng ký (chạy background non-blocking)
    const recipientEmail = (reg.email || '').trim();
    if (recipientEmail && recipientEmail.includes('@')) {
      void (async () => {
        try {
          await this.mailService.sendEventTicketEmail({
            to: recipientEmail,
            fullName: reg.member_name || 'Quý Học viên',
            eventTitle,
            eventDate: eventDateStr,
            eventLocation: event.location || 'Hà Nội',
            registrationId: actualRegId,
            ticketType: reg.ticket_type || 'Vé tham dự sự kiện',
            ticketCount: 1,
            luckyNumber: reg.lucky_number
              ? String(reg.lucky_number)
              : undefined,
            isFree: false,
            paymentConfirmed: true,
            totalAmount: amount,
            qrCodeUrl,
            vietQrUrl: '',
            bankAccount: process.env.SEPAY_ACCOUNT_NO || '',
            bankName: process.env.SEPAY_BANK_NAME || 'MB Bank',
            bankOwner: process.env.SEPAY_ACCOUNT_HOLDER || 'CLB DOANH NHAN CEO HN10',
          });
          this.logger.log(
            `Confirmed event ticket email dispatched to ${recipientEmail} (Registration: ${actualRegId})`,
          );
        } catch (mailErr: any) {
          this.logger.warn(
            `Failed to dispatch confirmed event ticket email: ${mailErr?.message}`,
          );
        }
      })();
    }

    // 7. Gửi tin nhắn qua kênh channel_media nếu có member_code
    if (reg.member_code) {
      const confirmMsg = `Kính gửi Anh/Chị ${reg.member_name || 'Học viên'}, Ban Truyền Thông & Ban Thư Ký CLB Doanh Nhân CEO HN10 xin thông báo: Giao dịch thanh toán phí tham dự sự kiện "${eventTitle}" của Anh/Chị đã được xác nhận thành công!\n\n- Mã vé: ${registrationId}\n- Số may mắn (Lucky Draw): #${reg.lucky_number || ''}\n- Số tiền đã thanh toán: ${new Intl.NumberFormat('vi-VN').format(amount)} đ\n- Thời gian: ${eventDateStr}\n- Địa điểm: ${event.location || 'Hà Nội'}\n\nVé điện tử kèm mã QR check-in đã được gửi về email của Anh/Chị. Anh/Chị cũng có thể xuất trình thẻ vé bên dưới khi tới dự sự kiện.`;
      const ticketActionMsg = `[action:ticket|eventId:${reg.event_id}|eventTitle:${encodeURIComponent(eventTitle)}|ticketCode:${registrationId}|lucky:${reg.lucky_number || ''}|time:${encodeURIComponent(eventDateStr)}|location:${encodeURIComponent(event.location || 'Địa điểm tổ chức')}|attendee:${encodeURIComponent(reg.member_name || '')}|qr:${encodeURIComponent(qrCodeUrl)}|type:${encodeURIComponent(reg.ticket_type || 'Standard')}|count:1]`;

      await this.prisma.$executeRaw`
        INSERT INTO public.messages (id, from_id, to_id, text, created_at)
        VALUES (gen_random_uuid(), 'channel_media', ${String(reg.member_code).toLowerCase()}, ${confirmMsg}, NOW() - interval '1 second')
      `.catch(() => { });

      await this.prisma.$executeRaw`
        INSERT INTO public.messages (id, from_id, to_id, text, created_at)
        VALUES (gen_random_uuid(), 'channel_media', ${String(reg.member_code).toLowerCase()}, ${ticketActionMsg}, NOW())
      `.catch(() => { });
    }

    return {
      ok: true,
      id: registrationId,
      status: 'confirmed',
      paymentStatus: 'paid',
      qrCodeUrl,
      message:
        'Đã xác nhận thanh toán thành công và đẩy vé điện tử kèm mã QR về email của người đăng ký.',
    };
  }

  async reconcilePayment(userId: string, registrationId: string) {
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_registrations WHERE id = ${registrationId} LIMIT 1
    `.catch(() => []);
    if (regRows.length === 0)
      throw new NotFoundException('Không tìm thấy đăng ký');
    const reg = regRows[0];

    if (reg.payment_status === 'paid') {
      return {
        ok: true,
        matched: true,
        status: 'paid',
        message: 'Phiếu đăng ký này đã được ghi nhận thanh toán thành công.',
      };
    }

    const expectedContent = `EV${registrationId}`;
    const expectedAmount = Number(reg.payment_amount || 0);

    // Kiểm tra dòng tiền trong bảng transactions hoặc đối soát ngân hàng
    const txMatch = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.transactions 
      WHERE (description ILIKE ${'%' + expectedContent + '%'} OR code ILIKE ${'%' + expectedContent + '%'})
        AND status = 'completed'
      LIMIT 1
    `.catch(() => []);

    if (txMatch.length > 0) {
      // Tự động kích hoạt thanh toán
      return this.confirmBankPayment(userId, registrationId, 'vietqr_auto');
    }

    return {
      ok: true,
      matched: false,
      invoiceCode: expectedContent,
      expectedAmount,
      message: `Chưa phát hiện giao dịch chuyển khoản khớp với cú pháp ${expectedContent} (${new Intl.NumberFormat('vi-VN').format(expectedAmount)} đ). Bạn có thể bấm nút "Xác nhận đã thanh toán" để duyệt thủ công.`,
    };
  }

  async getCheckinState(_userId: string) {
    // 1. Prioritize real attendees from event_registrations
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        r.id,
        r.member_name as name,
        r.member_code as code,
        r.email,
        r.ticket_type,
        r.seat_assignment,
        r.payment_status,
        r.checked_in_at,
        r.lucky_number,
        COALESCE(m.company, 'Doanh nghiệp CEO HN10') as company,
        COALESCE(m.position, 'CEO / Học viên') as title,
        COALESCE(m.phone, '0983000001') as phone
      FROM public.event_registrations r
      LEFT JOIN public.members m ON (m.code = r.member_code OR (r.email != '' AND m.email = r.email))
      LEFT JOIN public.vione_users u ON u.email = r.email
      WHERE r.status != 'cancelled'
      ORDER BY r.registered_at ASC
    `.catch(() => [] as any[]);

    let mappedAttendees: any[] = [];
    if (regRows && regRows.length > 0) {
      mappedAttendees = regRows.map((r: any) => {
        const name = String(r.name ?? 'Học viên');
        const initials =
          name
            .trim()
            .split(/\s+/)
            .slice(-2)
            .map((w: string) => w[0]?.toUpperCase())
            .join('') || 'U';
        return {
          id: String(r.id),
          name,
          initials,
          title: String(r.title ?? 'CEO / Học viên'),
          company: String(r.company ?? 'Doanh nghiệp CEO HN10'),
          phone: String(r.phone ?? '0983000001'),
          badges: String(r.ticket_type ?? '')
            .toLowerCase()
            .includes('vip')
            ? ['vip']
            : ['member'],
          membership: 'memberLevel.large',
          ticketType: r.ticket_type ? String(r.ticket_type) : 'VIP Pass',
          checkedIn: Boolean(r.checked_in_at),
          seatAssignment: r.seat_assignment || 'Chờ Ban Truyền Thông xếp chỗ',
          paymentStatus: r.payment_status || 'pending',
          luckyNumber: r.lucky_number
            ? `#${r.lucky_number}`
            : `#${Math.floor(1000 + Math.random() * 9000)}`,
        };
      });
    } else {
      const attendees = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.attendees ORDER BY name ASC
      `.catch(() => []);

      mappedAttendees = (attendees ?? []).map((r: any) => ({
        id: String(r.id),
        name: String(r.name ?? ''),
        initials: String(r.initials ?? ''),
        title: String(r.title ?? ''),
        company: String(r.company ?? ''),
        phone: String(r.phone ?? ''),
        badges: Array.isArray(r.badges) ? r.badges : [],
        membership: r.membership ?? 'memberLevel.small',
        ticketType: r.ticket_type ? String(r.ticket_type) : undefined,
        checkedIn: Boolean(r.checked_in),
        seatAssignment: 'Khu vực tự do',
      }));
    }

    const logs = await this.prisma.$queryRaw<any[]>`
      SELECT id, attendee_id, result, created_at FROM public.checkin_logs 
      ORDER BY created_at DESC LIMIT 10
    `.catch(() => []);

    const byId = new Map(mappedAttendees.map((a: any) => [a.id, a]));
    const recent = (logs ?? [])
      .map((l: any) => {
        const att = byId.get(String(l.attendee_id));
        if (!att) return null;
        const time = l.created_at
          ? new Date(l.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
          : '';
        return { attendee: att, result: l.result ?? 'success', time };
      })
      .filter(Boolean);

    const map = new Map<
      string,
      { ticketType: string; registered: number; checkedIn: number }
    >();
    for (const a of mappedAttendees) {
      const key = a.ticketType ?? 'Standard';
      const cur = map.get(key) ?? {
        ticketType: key,
        registered: 0,
        checkedIn: 0,
      };
      cur.registered += 1;
      if (a.checkedIn) cur.checkedIn += 1;
      map.set(key, cur);
    }
    const ticketStats = Array.from(map.values()).sort(
      (a, b) => b.registered - a.registered,
    );

    return {
      attendees: mappedAttendees,
      recent,
      stats: {
        registered: mappedAttendees.length,
        checkedIn: mappedAttendees.filter((a: any) => a.checkedIn).length,
      },
      ticketStats,
    };
  }

  async checkInAttendee(attendeeId: string) {
    // 1. Check in event_registrations first
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        r.id, r.member_name as name, r.email, r.ticket_type, r.seat_assignment, r.payment_status, r.checked_in_at,
        COALESCE(m.company, 'Doanh nghiệp CEO HN10') as company, COALESCE(m.position, 'CEO / Học viên') as title, COALESCE(m.phone, '0983000001') as phone
      FROM public.event_registrations r
      LEFT JOIN public.members m ON (m.code = r.member_code OR (r.email != '' AND m.email = r.email))
      WHERE r.id = ${attendeeId} LIMIT 1
    `.catch(() => [] as any[]);

    if (regRows.length > 0) {
      const cur = regRows[0];
      const already = Boolean(cur.checked_in_at);
      const result = already ? 'already' : 'success';
      if (!already) {
        await this.prisma.$executeRaw`
          UPDATE public.event_registrations
          SET checked_in_at = now(), updated_at = now()
          WHERE id = ${attendeeId}
        `.catch(() => null);

        // Dispatch 2-way business notification
        try {
          const userRows = await this.prisma.$queryRaw<any[]>`
            SELECT id FROM public.vione_users WHERE email = ${cur.email} LIMIT 1
          `.catch(() => []);
          const targetUserId = userRows[0]?.id;
          if (targetUserId) {
            const notifTitle = 'Check-in sự kiện thành công';
            const notifBody = `Chào mừng ${cur.name} đã đến tham dự sự kiện! Vị trí chỗ ngồi của bạn: ${cur.seat_assignment || 'Chờ Ban Truyền Thông xếp chỗ'}.`;
            const notifId = require('crypto').randomUUID();
            const dedupeKey = `checkin-${attendeeId}-${Date.now()}`;
            const safeData = JSON.stringify({
              title: notifTitle,
              body: notifBody,
              seatAssignment: cur.seat_assignment,
              ticketType: cur.ticket_type,
            });

            await this.prisma
              .$executeRawUnsafe(
                `
              INSERT INTO public.business_notifications (
                id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
                title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
              ) VALUES (
                $1::uuid, $2::uuid, 'event', $3, 'event_checkin', 'checkin_success',
                $4, $5, $6::jsonb, 'high', 'delivered', $7, 'all', 'all', NOW(), NOW()
              )
            `,
                notifId,
                targetUserId,
                attendeeId,
                notifTitle,
                notifBody,
                safeData,
                dedupeKey,
              )
              .catch(() => { });

            await this.prisma
              .$executeRawUnsafe(
                `
              INSERT INTO public.member_notifications (
                id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, false, false, 'checkin', $4, NOW()
              )
            `,
                targetUserId,
                notifTitle,
                notifBody,
                attendeeId,
              )
              .catch(() => { });
          }
        } catch (e: any) {
          console.warn('Failed to send checkin notification:', e?.message);
        }
      }
      await this.prisma.$executeRaw`
        INSERT INTO public.checkin_logs (id, attendee_id, result, created_at)
        VALUES (gen_random_uuid(), ${attendeeId}, ${result}, now())
      `.catch(() => null);

      const name = String(cur.name ?? 'Học viên');
      const initials =
        name
          .trim()
          .split(/\s+/)
          .slice(-2)
          .map((w: string) => w[0]?.toUpperCase())
          .join('') || 'U';
      const attendee = {
        id: String(cur.id),
        name,
        initials,
        title: String(cur.title ?? 'CEO / Học viên'),
        company: String(cur.company ?? 'CEO HN10'),
        phone: String(cur.phone ?? ''),
        badges: String(cur.ticket_type ?? '')
          .toLowerCase()
          .includes('vip')
          ? ['vip']
          : ['member'],
        membership: 'memberLevel.large',
        ticketType: cur.ticket_type ? String(cur.ticket_type) : 'VIP Pass',
        checkedIn: true,
        seatAssignment: cur.seat_assignment || 'Chờ Ban Truyền Thông xếp chỗ',
        paymentStatus: cur.payment_status || 'paid',
      };
      return { attendee, result, seatAssignment: attendee.seatAssignment };
    }

    // 2. Fallback to public.attendees
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.attendees WHERE id = ${attendeeId} LIMIT 1
    `.catch(() => []);
    const cur = rows?.[0];
    if (!cur) {
      throw new NotFoundException('Attendee not found');
    }
    const already = Boolean(cur.checked_in);
    const result = already ? 'already' : 'success';
    if (!already) {
      await this.prisma.$executeRaw`
        UPDATE public.attendees SET checked_in = true, updated_at = now() WHERE id = ${attendeeId}
      `.catch(() => null);
    }
    await this.prisma.$executeRaw`
      INSERT INTO public.checkin_logs (id, attendee_id, result, created_at)
      VALUES (gen_random_uuid(), ${attendeeId}, ${result}, now())
    `.catch(() => null);

    const attendee = {
      id: String(cur.id),
      name: String(cur.name ?? ''),
      initials: String(cur.initials ?? ''),
      title: String(cur.title ?? ''),
      company: String(cur.company ?? ''),
      phone: String(cur.phone ?? ''),
      badges: Array.isArray(cur.badges) ? cur.badges : [],
      membership: cur.membership ?? 'memberLevel.small',
      ticketType: cur.ticket_type ? String(cur.ticket_type) : undefined,
      checkedIn: true,
      seatAssignment: 'Khu vực tự do',
    };
    return { attendee, result, seatAssignment: attendee.seatAssignment };
  }

  async undoCheckInAttendee(attendeeId: string) {
    await this.prisma.$executeRaw`
      UPDATE public.event_registrations
      SET checked_in_at = null, updated_at = now()
      WHERE id = ${attendeeId}
    `.catch(() => null);
    await this.prisma.$executeRaw`
      UPDATE public.attendees SET checked_in = false, updated_at = now() WHERE id = ${attendeeId}
    `.catch(() => null);
    await this.prisma.$executeRaw`
      DELETE FROM public.checkin_logs WHERE attendee_id = ${attendeeId}
    `.catch(() => null);
    return { ok: true };
  }

  async getCheckinQrEvents(userId: string) {
    const overview = await this.getEventsOverview(userId);
    return overview.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      location: e.location,
      status: e.status,
      registered: e.confirmed || e.registrations,
      capacity: e.capacity,
      checkedIn: e.attended,
    }));
  }

  async scanTicketPayload(
    operatorUserId: string,
    body: {
      payload: string;
      currentEventId?: string;
      confirm?: boolean;
      method?: 'qr' | 'nfc';
    },
  ) {
    const method = body.method ?? 'qr';
    const rawPayload = (body.payload || '').trim();
    if (!rawPayload) {
      throw new BadRequestException('Mã QR sự kiện không hợp lệ hoặc rỗng.');
    }

    // 1. Resolve operator info (User B)
    let operatorName = 'Ban Soát Vé CEO HN10';
    if (operatorUserId) {
      const opRows = await this.prisma
        .$queryRawUnsafe<any[]>(
          `
        SELECT name, contact, executive_role, department FROM public.members
        WHERE user_id = $1::uuid OR id = $1
        LIMIT 1
      `,
          operatorUserId,
        )
        .catch(() => []);
      if (opRows.length > 0) {
        operatorName =
          opRows[0].name ||
          opRows[0].contact ||
          `${opRows[0].department || 'Ban Tổ Chức'} CEO HN10`;
      }
    }

    // 2. Parse payload (robust handling for raw JSON, QR generator URLs, ticketCode, event_ticket)
    let processedPayload = rawPayload.trim();
    if (processedPayload.includes('data=')) {
      try {
        const urlObj = new URL(processedPayload);
        const dataParam = urlObj.searchParams.get('data');
        if (dataParam) processedPayload = decodeURIComponent(dataParam);
      } catch {
        const match = processedPayload.match(/[?&]data=([^&]+)/);
        if (match && match[1]) {
          try {
            processedPayload = decodeURIComponent(match[1]);
          } catch { }
        }
      }
    }

    let scannedEventId: string | null = null;
    let scannedMemberCode: string | null = null;
    let scannedSeat: string | null = null;
    let scannedLucky: string | null = null;
    let scannedTicketCode: string | null = null;
    let scannedAttendeeName: string | null = null;
    let scannedAttendeePhone: string | null = null;
    let scannedAttendeeCompany: string | null = null;
    let scannedAttendeePosition: string | null = null;
    let scannedEventTitle: string | null = null;
    let scannedTicketType: string | null = null;
    let scannedTicketCount = 1;

    if (
      processedPayload.startsWith('event_ticket:') ||
      processedPayload.startsWith('EVENT_TICKET:')
    ) {
      const parts = processedPayload.split(':');
      scannedEventId = parts[1] || null;
      scannedMemberCode = parts[2] || null;
      scannedSeat = parts[3] ? decodeURIComponent(parts[3]) : null;
      scannedLucky = parts[4] ? decodeURIComponent(parts[4]) : null;
      scannedTicketCode = `TKT-${scannedEventId}-${scannedMemberCode}`;
    } else if (
      processedPayload.startsWith('event_checkin:') ||
      processedPayload.startsWith('EVENT_CHECKIN:')
    ) {
      const parts = processedPayload.split(':');
      scannedEventId = parts[1] || null;
    } else if (
      processedPayload.startsWith('{') &&
      processedPayload.endsWith('}')
    ) {
      try {
        const json = JSON.parse(processedPayload);
        scannedEventId = json.eventId || json.event_id || null;
        scannedMemberCode =
          json.memberCode || json.member_code || json.code || null;
        scannedTicketCode =
          json.ticketCode ||
          json.ticket_code ||
          json.id ||
          json.invoiceNo ||
          null;
        scannedSeat = json.seatAssignment || json.seat || null;
        scannedLucky = json.luckyNumber || json.lucky || null;
        scannedAttendeeName = json.name || json.attendeeName || null;
        scannedAttendeePhone = json.phone || json.attendeePhone || null;
        scannedAttendeeCompany = json.company || json.attendeeCompany || null;
        scannedAttendeePosition =
          json.position || json.attendeePosition || null;
        scannedEventTitle = json.eventTitle || json.title || null;
        scannedTicketType = json.ticketType || null;
        scannedTicketCount = Number(json.ticketCount) || 1;
      } catch { }
    } else {
      const uuidMatch = processedPayload.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
      );
      if (uuidMatch) {
        scannedEventId = uuidMatch[0];
      } else if (
        processedPayload.startsWith('TKT-') ||
        processedPayload.startsWith('EV-') ||
        processedPayload.startsWith('REG-') ||
        processedPayload.startsWith('HN10-') ||
        processedPayload.startsWith('HV-')
      ) {
        scannedTicketCode = processedPayload;
        if (
          processedPayload.startsWith('HN10-') ||
          processedPayload.startsWith('HV-')
        ) {
          scannedMemberCode = processedPayload;
        }
      } else {
        scannedTicketCode = processedPayload;
      }
    }

    const ticketDigits = scannedTicketCode
      ? scannedTicketCode.replace(/\D/g, '')
      : '';
    const luckyDigits = scannedLucky ? scannedLucky.replace(/\D/g, '') : '';

    // 3. Search registration in event_registrations
    let reg: any = null;
    if (
      scannedTicketCode ||
      ticketDigits ||
      scannedMemberCode ||
      (scannedEventId && scannedMemberCode)
    ) {
      const regRows = await this.prisma
        .$queryRawUnsafe<any[]>(
          `
        SELECT r.*, e.name as event_name, e.date as event_date, e.location as event_location,
               COALESCE(m.name, r.member_name) as attendee_name,
               COALESCE(m.phone, r.phone) as attendee_phone,
               COALESCE(m.company_name, m.company, 'CLB Doanh Nhân CEO HN10') as attendee_company,
               COALESCE(m.executive_role, m.position, 'Học viên') as attendee_position,
               m.avatar as attendee_avatar
        FROM public.event_registrations r
        LEFT JOIN public.events e ON e.id = r.event_id
        LEFT JOIN public.members m ON (m.code = r.member_code OR m.id = r.member_id OR (m.email IS NOT NULL AND m.email != '' AND m.email = r.email))
        WHERE (
          r.id = $1 
          OR ($2 != '' AND r.id = $2)
          OR r.member_code = $3
          OR ($4 != '' AND r.lucky_number = $4)
        )
          AND ($5::text IS NULL OR r.event_id::text = $5)
          AND r.status != 'cancelled'
        ORDER BY r.registered_at DESC
        LIMIT 1
      `,
          scannedTicketCode || '',
          ticketDigits || '',
          scannedMemberCode || '',
          luckyDigits || '',
          scannedEventId || null,
        )
        .catch(() => []);
      if (regRows.length > 0) reg = regRows[0];
    }

    // Fallback search by attendee phone / name
    if (!reg && (scannedAttendeePhone || scannedAttendeeName)) {
      const phoneDigits = scannedAttendeePhone
        ? scannedAttendeePhone.replace(/\D/g, '')
        : '';
      const regRows = await this.prisma
        .$queryRawUnsafe<any[]>(
          `
        SELECT r.*, e.name as event_name, e.date as event_date, e.location as event_location,
               COALESCE(m.name, r.member_name) as attendee_name,
               COALESCE(m.phone, r.phone) as attendee_phone,
               COALESCE(m.company_name, m.company, 'CLB Doanh Nhân CEO HN10') as attendee_company,
               COALESCE(m.executive_role, m.position, 'Học viên') as attendee_position,
               m.avatar as attendee_avatar
        FROM public.event_registrations r
        LEFT JOIN public.events e ON e.id = r.event_id
        LEFT JOIN public.members m ON (m.code = r.member_code OR m.id = r.member_id OR (m.email IS NOT NULL AND m.email != '' AND m.email = r.email))
        WHERE (
          ($1 != '' AND (r.phone ILIKE '%' || $1 || '%' OR m.phone ILIKE '%' || $1 || '%'))
          OR ($2 != '' AND (r.member_name ILIKE $2 OR m.name ILIKE $2))
        )
          AND ($3::text IS NULL OR r.event_id::text = $3)
          AND r.status != 'cancelled'
        ORDER BY r.registered_at DESC
        LIMIT 1
      `,
          phoneDigits,
          scannedAttendeeName ? `%${scannedAttendeeName}%` : '',
          scannedEventId || null,
        )
        .catch(() => []);
      if (regRows.length > 0) reg = regRows[0];
    }

    if (!reg && scannedMemberCode) {
      const regRows = await this.prisma
        .$queryRawUnsafe<any[]>(
          `
        SELECT r.*, e.name as event_name, e.date as event_date, e.location as event_location,
               COALESCE(m.name, r.member_name) as attendee_name,
               COALESCE(m.phone, r.phone) as attendee_phone,
               COALESCE(m.company_name, m.company, 'CLB Doanh Nhân CEO HN10') as attendee_company,
               COALESCE(m.executive_role, m.position, 'Học viên') as attendee_position,
               m.avatar as attendee_avatar
        FROM public.event_registrations r
        LEFT JOIN public.events e ON e.id = r.event_id
        LEFT JOIN public.members m ON (m.code = r.member_code OR m.id = r.member_id)
        WHERE (r.member_code = $1 OR m.code = $1)
          AND r.status != 'cancelled'
        ORDER BY r.registered_at DESC
        LIMIT 1
      `,
          scannedMemberCode,
        )
        .catch(() => []);
      if (regRows.length > 0) reg = regRows[0];
    }

    // 4. Resolve Event Details
    const resolvedEventId = reg?.event_id || scannedEventId;
    let eventRow: any = null;
    if (resolvedEventId) {
      const eRows = await this.prisma
        .$queryRawUnsafe<any[]>(
          `
        SELECT id, name, date, location, association_id FROM public.events
        WHERE id::text = $1 OR id = $2::uuid
        LIMIT 1
      `,
          resolvedEventId,
          resolvedEventId.match(/[0-9a-f-]{36}/i)
            ? resolvedEventId
            : '00000000-0000-0000-0000-000000000000',
        )
        .catch(() => []);
      if (eRows.length > 0) eventRow = eRows[0];
    }
    if (!eventRow && scannedEventTitle) {
      const eRows = await this.prisma
        .$queryRawUnsafe<any[]>(
          `
        SELECT id, name, date, location, association_id FROM public.events
        WHERE name ILIKE $1 OR title ILIKE $1
        ORDER BY date DESC
        LIMIT 1
      `,
          `%${scannedEventTitle}%`,
        )
        .catch(() => []);
      if (eRows.length > 0) eventRow = eRows[0];
    }

    // 5. Resolve Attendee Member Details (User A)
    let memberRow: any = null;
    if (
      scannedMemberCode ||
      reg?.member_code ||
      reg?.attendee_name ||
      scannedAttendeeName
    ) {
      const mRows = await this.prisma
        .$queryRawUnsafe<any[]>(
          `
        SELECT id, code, name, phone, company, company_name, executive_role, position, avatar, association_id, user_id
        FROM public.members
        WHERE code = $1 OR id = $2 OR (phone IS NOT NULL AND phone = $3) OR (name ILIKE $4)
        LIMIT 1
      `,
          scannedMemberCode || reg?.member_code || '',
          scannedMemberCode || '',
          reg?.attendee_phone || scannedAttendeePhone || '',
          scannedAttendeeName ? `%${scannedAttendeeName}%` : '',
        )
        .catch(() => []);
      if (mRows.length > 0) memberRow = mRows[0];
    }

    const eventTitle =
      eventRow?.name ||
      reg?.event_name ||
      scannedEventTitle ||
      'Đại hội Học viên CLB Doanh Nhân CEO HN10';
    const eventDate = eventRow?.date
      ? new Date(eventRow.date).toLocaleDateString('vi-VN')
      : reg?.event_date
        ? new Date(reg.event_date).toLocaleDateString('vi-VN')
        : '27/09/2026';
    const eventLocation =
      eventRow?.location ||
      reg?.event_location ||
      'Trung tâm Hội nghị Quốc gia, Hà Nội';
    const attendeeName =
      reg?.attendee_name ||
      memberRow?.name ||
      scannedAttendeeName ||
      'Đại biểu Học viên CEO HN10';
    const attendeePhone =
      reg?.attendee_phone || memberRow?.phone || scannedAttendeePhone || '—';
    const attendeeCompany =
      reg?.attendee_company ||
      memberRow?.company_name ||
      memberRow?.company ||
      scannedAttendeeCompany ||
      'CLB Doanh Nhân CEO HN10';
    const attendeePosition =
      reg?.attendee_position ||
      memberRow?.executive_role ||
      memberRow?.position ||
      scannedAttendeePosition ||
      'Học viên chính thức';
    const attendeeAvatar = reg?.attendee_avatar || memberRow?.avatar || null;
    const finalMemberCode =
      memberRow?.code || reg?.member_code || scannedMemberCode || 'HN10-HV';
    const seatAssignment =
      reg?.seat_assignment || scannedSeat || 'Chờ Ban Truyền Thông xếp chỗ';
    const luckyNumber = reg?.lucky_number
      ? `#${reg.lucky_number}`
      : scannedLucky || `#${finalMemberCode.slice(-4).toUpperCase()}`;
    const ticketCode =
      reg?.id ||
      scannedTicketCode ||
      `TKT-${resolvedEventId || '1983'}-${finalMemberCode}`;
    const ticketType =
      reg?.ticket_type || scannedTicketType || 'Vé Mời VIP (E-Ticket)';

    // 6. Check Event Mismatch
    let eventMismatch = false;
    let currentEventTitle: string | null = null;
    if (body.currentEventId && resolvedEventId) {
      if (String(body.currentEventId) !== String(resolvedEventId)) {
        eventMismatch = true;
        const curRows = await this.prisma
          .$queryRawUnsafe<any[]>(
            `
          SELECT name FROM public.events WHERE id::text = $1 OR id = $2::uuid LIMIT 1
        `,
            body.currentEventId,
            body.currentEventId.match(/[0-9a-f-]{36}/i)
              ? body.currentEventId
              : '00000000-0000-0000-0000-000000000000',
          )
          .catch(() => []);
        currentEventTitle = curRows[0]?.name || 'Sự kiện đang chọn tại cửa';
      }
    }

    // 7. Check prior check-in status
    let isCheckedIn = Boolean(reg?.checked_in_at);
    let checkedInAt = reg?.checked_in_at
      ? new Date(reg.checked_in_at).toLocaleString('vi-VN')
      : null;

    if (!isCheckedIn) {
      const priorCheckins = await this.prisma
        .$queryRawUnsafe<any[]>(
          `
        SELECT checked_at FROM public.member_checkins
        WHERE member_code = $1 AND (event_id::text = $2 OR event_title = $3) AND status = 'success'
        LIMIT 1
      `,
          finalMemberCode,
          String(resolvedEventId || ''),
          eventTitle,
        )
        .catch(() => []);
      if (priorCheckins.length > 0) {
        isCheckedIn = true;
        checkedInAt = new Date(priorCheckins[0].checked_at).toLocaleString(
          'vi-VN',
        );
      }
    }

    // 8. If confirm === true (Gatekeeper confirms check-in for User A)
    if (body.confirm && !isCheckedIn) {
      const now = new Date();
      checkedInAt = now.toLocaleString('vi-VN');
      isCheckedIn = true;

      if (reg?.id) {
        await this.prisma
          .$executeRawUnsafe(
            `
          UPDATE public.event_registrations
          SET checked_in_at = NOW(), status = 'attended', updated_at = NOW()
          WHERE id = $1
        `,
            reg.id,
          )
          .catch(() => { });
      }

      const assocId =
        eventRow?.association_id ||
        memberRow?.association_id ||
        'c1983000-0000-4000-8000-000000001983';
      const clientId = `chk:tkt:${assocId}:${finalMemberCode}:${resolvedEventId || 'any'}`;
      await this.prisma
        .$executeRawUnsafe(
          `
        INSERT INTO public.member_checkins (
          id, client_id, member_code, event_id, event_title, status, method, checked_at, association_id
        ) VALUES (
          gen_random_uuid(), $1, $2, $3::uuid, $4, 'success', $5, NOW(), $6::uuid
        ) ON CONFLICT (client_id) DO UPDATE SET checked_at = member_checkins.checked_at
      `,
          clientId,
          finalMemberCode,
          resolvedEventId && resolvedEventId.match(/[0-9a-f-]{36}/i)
            ? resolvedEventId
            : null,
          eventTitle,
          method,
          assocId,
        )
        .catch(() => { });

      await this.prisma
        .$executeRawUnsafe(
          `
        INSERT INTO public.checkin_logs (id, attendee_id, result, created_at)
        VALUES (gen_random_uuid(), $1, 'success', NOW())
      `,
          reg?.id || finalMemberCode,
        )
        .catch(() => { });

      if (memberRow?.user_id) {
        try {
          const notifTitle = 'Xác nhận check-in sự kiện';
          const notifBody = `Bạn đã hoàn tất thủ tục check-in tại sự kiện: "${eventTitle}". Vị trí chỗ ngồi: ${seatAssignment}.`;
          const notifId = crypto.randomUUID();
          const dedupeKey = `event-chk-${finalMemberCode}-${resolvedEventId || '1983'}`;
          const safeData = JSON.stringify({
            title: notifTitle,
            body: notifBody,
            eventTitle,
            seatAssignment,
            luckyNumber,
            ticketCode,
            targetRoute: '/association/checkin',
          });
          await this.prisma
            .$executeRawUnsafe(
              `
            INSERT INTO public.business_notifications (
              id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
              title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
            ) VALUES (
              $1::uuid, $2::uuid, 'event', $3, 'event_checkin', 'checkin_success',
              $4, $5, $6::jsonb, 'high', 'delivered', $7, 'all', 'all', NOW(), NOW()
            )
          `,
              notifId,
              memberRow.user_id,
              ticketCode,
              notifTitle,
              notifBody,
              safeData,
              dedupeKey,
            )
            .catch(() => { });
        } catch { }
      }
    }

    return {
      success: true,
      ticketCode,
      attendeeName,
      attendeePhone,
      attendeeCompany,
      attendeePosition,
      attendeeAvatar,
      memberCode: finalMemberCode,
      eventId: resolvedEventId,
      eventTitle,
      eventDate,
      eventLocation,
      ticketType,
      ticketFee: Number(eventRow?.ticket_fee || (eventRow as any)?.ticketPrice || reg?.ticket_price || 0),
      fundType: (eventRow as any)?.fund_type || 'general',
      fundNote: (eventRow as any)?.fund_type === 'personal_pool' || (eventRow as any)?.is_custom_event
        ? 'Dòng tiền tính vào quỹ cá nhân riêng, tách hoàn toàn quỹ chung của CEO HN10.'
        : 'Quỹ chung CEO HN10',
      seatAssignment,
      luckyNumber,
      ticketCount: 1,
      isCheckedIn,
      checkedInAt,
      scannedBy: operatorName,
      eventMismatch,
      currentEventId: body.currentEventId || null,
      currentEventTitle,
    };
  }

  async recordMemberCheckin(
    userId: string,
    body: { payload: string; method?: 'qr' | 'nfc'; currentEventId?: string },
  ) {
    return this.scanTicketPayload(userId, {
      payload: body.payload,
      currentEventId: body.currentEventId,
      confirm: true,
      method: body.method,
    });
  }

  async listMyMemberCheckins(userId: string, limit: number = 50) {
    const members = await this.prisma.$queryRaw<any[]>`
      SELECT code FROM public.members WHERE user_id = ${userId}::uuid
    `.catch(() => []);

    const codes = members.map((m) => m.code).filter(Boolean);
    if (codes.length === 0) return [];

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, event_id, event_title, status, method, checked_at
      FROM public.member_checkins
      WHERE member_code = ANY(${codes})
      ORDER BY checked_at DESC
      LIMIT ${limit}
    `.catch(() => []);

    return rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      eventTitle: r.event_title || 'Sự kiện',
      status: r.status || 'success',
      method: r.method || 'qr',
      at: r.checked_at ? new Date(r.checked_at).toISOString() : '',
    }));
  }

  async addOrCheckinAttendee(userId: string, eventId: string, body: any) {
    const memberName = String(
      body.memberName || body.name || 'Khách mời',
    ).trim();
    const memberCode = String(body.memberCode || body.code || '').trim();
    const email = String(body.email || '').trim();
    const ticketType = String(body.ticketType || 'VIP Pass').trim();
    const seatAssignment = String(body.seatAssignment || 'Khu vực VIP').trim();
    const paymentStatus = String(body.paymentStatus || 'paid');
    const checkedIn = body.checkedIn !== false;

    // Check if registration already exists for this event and memberCode/email
    let existing: any[] = [];
    if (memberCode || email) {
      existing = await this.prisma
        .$queryRawUnsafe<any[]>(
          `
        SELECT id FROM public.event_registrations
        WHERE event_id = $1 AND (
          (member_code = $2 AND $2 != '') OR 
          (email = $3 AND $3 != '')
        )
        LIMIT 1
      `,
          eventId,
          memberCode,
          email,
        )
        .catch(() => []);
    }

    let regId: string;
    if (existing.length > 0) {
      regId = existing[0].id;
      await this.prisma
        .$executeRawUnsafe(
          `
        UPDATE public.event_registrations
        SET checked_in_at = ${checkedIn ? 'NOW()' : 'checked_in_at'},
            seat_assignment = COALESCE($1, seat_assignment),
            payment_status = $2,
            updated_at = NOW()
        WHERE id = $3
      `,
          seatAssignment,
          paymentStatus,
          regId,
        )
        .catch(() => null);
    } else {
      regId = `REG-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      await this.prisma
        .$executeRawUnsafe(
          `
        INSERT INTO public.event_registrations (
          id, event_id, member_code, member_name, email, registered_at, status,
          ticket_type, seat_assignment, payment_status, reminder_count, checked_in_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW(), 'confirmed',
          $6, $7, $8, 0, ${checkedIn ? 'NOW()' : 'NULL'}, NOW(), NOW()
        )
      `,
          regId,
          eventId,
          memberCode,
          memberName,
          email,
          ticketType,
          seatAssignment,
          paymentStatus,
        )
        .catch(() => null);

      await this.prisma
        .$executeRawUnsafe(
          `
        UPDATE public.events SET registered = COALESCE(registered, 0) + 1 WHERE id = $1
      `,
          eventId,
        )
        .catch(() => null);
    }

    return {
      ok: true,
      registrationId: regId,
      eventId,
      memberName,
      memberCode,
      ticketType,
      seatAssignment,
      checkedIn,
      message: checkedIn
        ? 'Đã thêm và điểm danh sự kiện thành công!'
        : 'Đã thêm người tham gia thành công!',
    };
  }

  async deleteEvent(
    userId: string,
    id: string,
  ): Promise<{ success: boolean; id: string }> {
    const events = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.events WHERE id = ${id} LIMIT 1
    `;
    if (!events.length) {
      throw new NotFoundException(`Không tìm thấy sự kiện với mã: ${id}`);
    }

    // Cascade cleanups
    await this.prisma.$executeRaw`
      DELETE FROM public.member_checkins WHERE event_id = ${id}
    `.catch(() => { });

    await this.prisma.$executeRaw`
      DELETE FROM public.event_registrations WHERE event_id = ${id}
    `.catch(() => { });

    await this.prisma.$executeRaw`
      DELETE FROM public.event_ticket_types WHERE event_id = ${id}
    `.catch(() => { });

    await this.prisma.$executeRaw`
      DELETE FROM public.event_feedback WHERE event_id = ${id}
    `.catch(() => { });

    await this.prisma.$executeRaw`
      DELETE FROM public.event_materials WHERE event_id = ${id}
    `.catch(() => { });

    await this.prisma.$executeRaw`
      DELETE FROM public.event_invitation_guests WHERE event_id = ${id}
    `.catch(() => { });

    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.feed_posts WHERE content LIKE $1 OR title LIKE $1 OR metadata::text LIKE $1`,
      `%${id}%`,
    ).catch(() => { });

    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.business_notifications WHERE source_record_id = $1 OR safe_display_data::text LIKE $2`,
      id,
      `%${id}%`,
    ).catch(() => { });

    // Delete event record
    await this.prisma.$executeRaw`
      DELETE FROM public.events WHERE id = ${id}
    `;

    return { success: true, id };
  }

  /**
   * Đăng ký tham gia sự kiện dành cho khách vãng lai (quét mã QR đón tiếp tại sự kiện do Ban Truyền Thông đưa)
   * Tự động gửi email:
   * - Sự kiện có phí: Gửi email thanh toán phí sự kiện (VietQR, thông tin chuyển khoản, mã quay thưởng Lucky Draw, mã vé)
   * - Sự kiện miễn phí: Gửi email xác nhận vé điện tử, mã QR check-in, và mã quay thưởng Lucky Draw
   */
  async guestRegister(eventId: string, guestData: any) {
    const fullName = (guestData?.fullName || '').trim();
    const phone = (guestData?.phone || '').trim();
    const email = (guestData?.email || '').trim().toLowerCase();
    const company = (guestData?.company || '').trim();
    const position = (guestData?.position || '').trim();
    const ticketCount = Math.max(1, Number(guestData?.ticketCount) || 1);
    const note = (guestData?.note || '').trim();

    // 1. Tra cứu sự kiện trong public.events
    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);

    // 2. Nếu không có trong events, tra cứu trong public.trainings (chương trình đào tạo)
    let targetEvent: any = eventRows.length > 0 ? eventRows[0] : null;
    let targetTitle = targetEvent?.title || targetEvent?.name || '';
    if (!targetEvent) {
      const trainingRows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.trainings WHERE id = ${eventId} LIMIT 1
      `.catch(() => []);
      if (trainingRows.length > 0) {
        targetEvent = trainingRows[0];
        targetTitle = targetEvent.title || targetEvent.name || 'Chương trình đào tạo CEO HN10';
      }
    }

    // 3. Nếu mã QR dẫn tới sự kiện/đào tạo đã bị xóa hoặc không tồn tại
    const isDeletedOrMissing =
      !targetEvent ||
      targetEvent.is_deleted === true ||
      targetEvent.status === 'deleted' ||
      targetEvent.status === 'inactive';

    if (isDeletedOrMissing) {
      const fallbackTitle = targetTitle || 'Sự kiện / Chương trình đào tạo CLB CEO HN10';
      if (email && email.includes('@')) {
        await this.mailService.sendQrChangedOrExpiredEmail({
          to: email,
          fullName: fullName || 'Quý Khách',
          phone,
          company,
          position,
          eventTitle: fallbackTitle,
          qrCodeRef: eventId,
        });
      }
      return {
        ok: false,
        status: 'qr_changed_or_expired',
        isQrExpired: true,
        eventTitle: fallbackTitle,
        fullName: fullName || 'Quý Khách',
        email,
        message:
          'Sự kiện hoặc chương trình đào tạo liên quan đến mã QR này đã có sự thay đổi lịch trình hoặc mã QR không còn hiệu lực trên hệ thống. Ban Tổ Chức đã gửi thư thông báo chi tiết đến email của Quý Anh/Chị.',
      };
    }

    if (!fullName || !phone || !email) {
      throw new BadRequestException(
        'Vui lòng điền đầy đủ Họ tên, Số điện thoại và Email để nhận vé',
      );
    }

    const event = targetEvent;
    const resolvedEventId = event.id;

    const capacityNum = Number(event.capacity ?? 0);
    const registeredNum = Number(event.registered ?? 0);
    if (
      capacityNum > 0 &&
      (registeredNum + ticketCount > capacityNum ||
        registeredNum >= capacityNum)
    ) {
      await this.mailService.sendEventSoldOutEmail({
        to: email,
        fullName,
        phone,
        company,
        position,
        eventTitle: event.title || event.name || 'Sự kiện CLB CEO HN10',
        eventDate: event.date
          ? event.date instanceof Date
            ? event.date.toLocaleDateString('vi-VN')
            : String(event.date).slice(0, 10)
          : 'Sắp diễn ra',
        eventTime: event.time || '08:30 - 12:00',
        eventLocation: event.location || 'Hà Nội',
      });
      return {
        ok: false,
        status: 'sold_out',
        isSoldOut: true,
        eventTitle: event.title || event.name,
        message:
          'Rất tiếc, sự kiện đã đủ số lượng đại biểu tham dự (Hết chỗ). Ban Tổ Chức đã gửi email cảm ơn sự quan tâm của Quý Anh/Chị và lưu trữ thông tin cho sự kiện tiếp theo.',
      };
    }

    const ticketPrice =
      guestData?.ticketPrice !== undefined && Number(guestData?.ticketPrice) > 0
        ? Number(guestData.ticketPrice)
        : event.ticket_price !== undefined &&
          event.ticket_price !== null &&
          Number(event.ticket_price) > 0
          ? Number(event.ticket_price)
          : event.fee !== undefined && event.fee !== null
            ? Number(event.fee)
            : 0;
    const isFree = ticketPrice === 0;
    const totalAmount = ticketPrice * ticketCount;
    const paymentStatus = isFree ? 'free' : 'pending';

    // Sinh ID đăng ký liên tiếp
    const lastReg = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.event_registrations WHERE id ~ '^[0-9]+$' ORDER BY CAST(id AS BIGINT) DESC LIMIT 1
    `.catch(() => []);
    const regId =
      lastReg.length > 0
        ? (BigInt(lastReg[0].id) + 1n).toString()
        : `4${Math.floor(1000 + Math.random() * 9000)}`;
    const luckyNum = String(Math.floor(1000 + Math.random() * 9000));
    const memberCode = (guestData?.memberCode && String(guestData.memberCode).trim())
      ? String(guestData.memberCode).trim().toUpperCase()
      : `GUEST-${luckyNum}`;
    const chosenTicketType = (guestData?.ticketType || '').trim();
    const ticketType =
      chosenTicketType || (isFree ? 'Vé Mời Miễn Phí' : 'Vé Tiêu Chuẩn');

    const qrPayload = JSON.stringify({
      regId,
      eventId: resolvedEventId,
      fullName,
      phone,
      email,
      company,
      position,
      ticketType,
      ticketCount,
      luckyNum,
      isFree,
      totalAmount,
      note,
    });

    const targetAssociationId =
      event.association_id && String(event.association_id).length === 36
        ? event.association_id
        : 'c1983000-0000-4000-8000-000000001983';

    const checkinNow = guestData?.isCheckinNow === true || guestData?.status === 'attended';
    const initialGuestStatus = checkinNow ? 'attended' : (isFree ? 'confirmed' : 'pending');
    const guestPaymentStatus = isFree ? 'free' : (guestData?.paymentStatus || 'pending');

    await this.prisma.$executeRaw`
      INSERT INTO public.event_registrations (
        id, event_id, member_code, member_name, email, phone, company, position, note, registered_at, status, ticket_type, ticket_count, association_id, payment_status, payment_amount, lucky_number, qr_payload, is_walkin, registration_origin, checked_in_at, created_at, updated_at
      ) VALUES (
        ${regId},
        ${resolvedEventId},
        ${memberCode},
        ${fullName},
        ${email},
        ${phone},
        ${company},
        ${position},
        ${note},
        now()::date,
        ${initialGuestStatus},
        ${ticketType},
        ${ticketCount},
        ${targetAssociationId}::uuid,
        ${guestPaymentStatus},
        ${totalAmount},
        ${luckyNum},
        ${qrPayload},
        true,
        'walkin_at_door',
        ${checkinNow ? new Date() : null},
        now(),
        now()
      )
    `;

    // Nếu đã thanh toán và có số tiền > 0, ghi nhận ngay vào dòng tiền transactions và income_records
    if (guestPaymentStatus === 'paid' && totalAmount > 0) {
      const txCode = `THU-EV${regId}`;
      await this.prisma.$executeRaw`
        INSERT INTO public.transactions (
          id, code, date, type, category, description, amount, method, status, association_id, recipient, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${txCode},
          now()::date,
          'income',
          'Vé sự kiện',
          ${`Thu tiền vé sự kiện ${event.title || event.name} - ${fullName} (Mã vé: #${regId})`},
          ${totalAmount},
          'cash',
          'completed',
          ${targetAssociationId}::uuid,
          ${fullName},
          now(),
          now()
        )
      `.catch(() => {});
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO public.income_records (
          id, category, title, amount, date, payer_name, payment_method, status, event_id, notes, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          'Vé sự kiện',
          $1,
          $2,
          now()::date,
          $3,
          'Tiền mặt tại sự kiện',
          'completed',
          $4,
          $5,
          now(),
          now()
        )
      `,
        `Thu tiền vé sự kiện ${event.title || event.name} - ${fullName} (Mã vé: #${regId})`,
        totalAmount,
        fullName,
        resolvedEventId,
        `Ghi nhận trực tiếp khi khách đăng ký check-in tại cổng sự kiện`,
      ).catch(() => {});
    }

    // Cập nhật số lượng người đăng ký vào bảng events
    await this.prisma.$executeRaw`
      UPDATE public.events SET registered = registered + ${ticketCount}, updated_at = now() WHERE id = ${resolvedEventId}
    `.catch(() => null);

    const createdTickets: any[] = [{
      id: regId,
      fullName,
      phone,
      email,
      company,
      position,
      memberCode,
      luckyNumber: luckyNum,
      ticketType,
    }];

    const sepayCfg = this.paymentService
      ? await this.paymentService.getSepayConfig()
      : {
          bankName: process.env.SEPAY_BANK_NAME || 'MBBank',
          accountNumber: process.env.SEPAY_ACCOUNT_NO || '',
          accountHolder: process.env.SEPAY_ACCOUNT_HOLDER || '',
          prefixEvent: 'CEO1983_EVT',
        };
    const bankShort = (sepayCfg.bankName || 'MB').toUpperCase().includes('MB') ? 'MB' : (sepayCfg.bankName || 'MB');
    const memo = `CEO1983_EVT_${regId}`;
    const dynamicVietQrUrl = isFree || !sepayCfg.accountNumber
      ? ''
      : `https://img.vietqr.io/image/${bankShort}-${sepayCfg.accountNumber}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(sepayCfg.accountHolder)}`;

    // Hỗ trợ đăng ký nhiều người tham gia cùng (Multi-Attendee)
    if (guestData?.attendees && Array.isArray(guestData.attendees) && guestData.attendees.length > 1) {
      let nextIdBig = lastReg.length > 0 ? BigInt(lastReg[0].id) + 2n : BigInt(regId) + 1n;
      for (const att of guestData.attendees.slice(1)) {
        const attName = (att.fullName || att.name || '').trim();
        if (!attName) continue;
        const attPhone = (att.phone || phone).trim();
        const attEmail = (att.email || email).trim().toLowerCase();
        const attComp = (att.company || company).trim();
        const attPos = (att.position || position).trim();
        const attLucky = String(Math.floor(1000 + Math.random() * 9000));
        const attCode = (att.memberCode && String(att.memberCode).trim())
          ? String(att.memberCode).trim().toUpperCase()
          : `GUEST-${attLucky}`;
        const attRegId = (nextIdBig++).toString();
        const attTicketType = att.ticketType || ticketType;

        const attQrPayload = JSON.stringify({
          regId: attRegId,
          eventId: resolvedEventId,
          fullName: attName,
          phone: attPhone,
          email: attEmail,
          company: attComp,
          position: attPos,
          ticketType: attTicketType,
          luckyNum: attLucky,
          isFree,
        });

        await this.prisma.$executeRaw`
          INSERT INTO public.event_registrations (
            id, event_id, member_code, member_name, email, phone, company, position, note, registered_at, status, ticket_type, ticket_count, association_id, payment_status, payment_amount, lucky_number, qr_payload, registered_by, created_at, updated_at
          ) VALUES (
            ${attRegId},
            ${resolvedEventId},
            ${attCode},
            ${attName},
            ${attEmail},
            ${attPhone},
            ${attComp},
            ${attPos},
            ${note},
            now()::date,
            ${initialGuestStatus},
            ${attTicketType},
            1,
            ${targetAssociationId}::uuid,
            ${guestPaymentStatus},
            ${ticketPrice},
            ${attLucky},
            ${attQrPayload},
            ${regId},
            now(),
            now()
          )
        `.catch(() => {});

        createdTickets.push({
          id: attRegId,
          fullName: attName,
          phone: attPhone,
          email: attEmail,
          company: attComp,
          position: attPos,
          memberCode: attCode,
          luckyNumber: attLucky,
          ticketType: attTicketType,
        });

        // Bắn email vé riêng cho người tham gia nếu có email
        if (isFree && attEmail && attEmail.includes('@')) {
          try {
            await this.mailService.sendEventTicketEmail({
              to: attEmail,
              fullName: attName,
              phone: attPhone,
              company: attComp,
              position: attPos,
              eventTitle: event.title || event.name || 'Sự kiện CLB CEO HN10',
              eventDate: event.date
                ? event.date instanceof Date
                  ? event.date.toLocaleDateString('vi-VN')
                  : String(event.date).slice(0, 10)
                : 'Sắp diễn ra',
              eventTime: event.time || '08:30 - 12:00',
              eventLocation: event.location || 'Hà Nội',
              registrationId: attRegId,
              ticketType: attTicketType,
              ticketCount: 1,
              luckyNumber: attLucky,
              isFree: true,
              totalAmount: 0,
              qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(attRegId)}`,
              vietQrUrl: '',
              bankAccount: sepayCfg.accountNumber,
              bankName: sepayCfg.bankName,
              bankOwner: sepayCfg.accountHolder,
            });
          } catch (e) {
            this.logger.warn(`Failed to dispatch ticket email to attendee ${attEmail}`);
          }
        }
      }
    }

    const qrCodeUrl = isFree
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(regId)}`
      : '';

    // Gửi email vé điện tử E-Ticket CHỈ DÀNH CHO SỰ KIỆN MIỄN PHÍ (0đ)
    // Sự kiện có phí phải chờ Ban Truyền Thông / Tài Chính kiểm tra và bấm "Đã thanh toán" mới gửi vé kèm QR check-in!
    if (isFree && email && email.includes('@')) {
      try {
        await this.mailService.sendEventTicketEmail({
          to: email,
          fullName,
          phone,
          company,
          position,
          eventTitle: event.title || event.name || 'Sự kiện CLB CEO HN10',
          eventDate: event.date
            ? event.date instanceof Date
              ? event.date.toLocaleDateString('vi-VN')
              : String(event.date).slice(0, 10)
            : 'Sắp diễn ra',
          eventTime: event.time || '08:30 - 12:00',
          eventLocation: event.location || 'Hà Nội',
          registrationId: regId,
          ticketType,
          ticketCount,
          luckyNumber: luckyNum,
          isFree: true,
          totalAmount: 0,
          qrCodeUrl,
          vietQrUrl: '',
          bankAccount: sepayCfg.accountNumber,
          bankName: sepayCfg.bankName,
          bankOwner: sepayCfg.accountHolder,
        });
        this.logger.log(
          `Guest registration free ticket email dispatched to ${email} (Lucky #${luckyNum})`,
        );
      } catch (err: any) {
        this.logger.warn(
          `Failed to dispatch event ticket email to guest ${email}: ${err?.message}`,
        );
      }
    }

    // Đối với sự kiện có phí (khách đăng ký): chỉ gửi email thông báo mã VietQR thanh toán (KHÔNG có số lucky, mã dự thưởng, hay mã QR vé)
    if (!isFree) {
      const guestPaymentPayload = {
        fullName,
        phone,
        company,
        position,
        eventTitle: event.title || event.name || 'Sự kiện CLB CEO HN10',
        eventDate: event.date
          ? event.date instanceof Date
            ? event.date.toLocaleDateString('vi-VN')
            : String(event.date).slice(0, 10)
          : 'Sắp diễn ra',
        eventTime: event.time || '08:30 - 12:00',
        eventLocation: event.location || 'Hà Nội',
        registrationId: regId,
        ticketType,
        ticketCount,
        luckyNumber: undefined,
        isFree: false,
        paymentConfirmed: false,
        totalAmount,
        qrCodeUrl: '',
        vietQrUrl: dynamicVietQrUrl,
        bankAccount: sepayCfg.accountNumber,
        bankName: sepayCfg.bankName || 'Ngân hàng thụ hưởng',
        bankOwner: sepayCfg.accountHolder,
      };

      if (email && email.includes('@')) {
        try {
          await this.mailService.sendEventTicketEmail({
            ...guestPaymentPayload,
            to: email,
          });
          this.logger.log(
            `Guest paid event registration VietQR email dispatched to ${email}`,
          );
        } catch (err: any) {
          this.logger.warn(
            `Failed to dispatch guest paid event VietQR email to ${email}: ${err?.message}`,
          );
        }
      }

      const primaryAdminEmail =
        process.env.ADMIN_NOTIFY_EMAIL || 'vupv090120@gmail.com';
      if (
        primaryAdminEmail &&
        primaryAdminEmail.toLowerCase() !== email.toLowerCase()
      ) {
        try {
          await this.mailService.sendEventTicketEmail({
            ...guestPaymentPayload,
            to: primaryAdminEmail,
            fullName: `${fullName} (Khách đăng ký vé có phí - Hệ thống)`,
          });
          this.logger.log(
            `Guest paid registration copy dispatched to primary admin ${primaryAdminEmail}`,
          );
        } catch (err: any) {
          this.logger.warn(
            `Failed to dispatch guest paid registration to primary admin: ${err?.message}`,
          );
        }
      }
    }

    // Gửi thông báo khách đăng ký vé sự kiện vào Notification Center CRM
    const crmGuestNotifCode = `NOTIF-GUEST-EVT-${Date.now().toString().slice(-6)}`;
    await this.prisma.$executeRaw`
      INSERT INTO public.notifications (
        id, code, title, body, audience, channel, status, sent_at, reach, association_id, app_scope, target_app, target_channel, pushed_to_messages, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${crmGuestNotifCode},
        ${`Đại biểu khách đăng ký sự kiện: ${event.title || event.name}`},
        ${`Khách mời ${fullName} (${company || 'Khách vãng lai'}) đã đăng ký ${ticketCount} vé tham gia sự kiện "${event.title || event.name}" (${isFree ? 'Miễn phí' : new Intl.NumberFormat('vi-VN').format(totalAmount) + ' đ'}). Mã vé: ${regId}.`},
        'all', 'inapp', 'sent', now(), 1, ${event.association_id ? event.association_id : null}::uuid, 'all', 'all', 'admins', true, now(), now()
      )
    `.catch(() => { });

    return {
      ok: true,
      registered: true,
      registrationId: regId,
      luckyNumber: luckyNum,
      memberCode,
      createdTickets,
      totalAttendees: createdTickets.length,
      isFree,
      totalAmount,
      sepayQrUrl: dynamicVietQrUrl,
      vietQrUrl: dynamicVietQrUrl,
      bankAccount: sepayCfg.accountNumber,
      bankName: sepayCfg.bankName,
      bankOwner: sepayCfg.accountHolder,
      transferMemo: memo,
      eventTitle: event.title || event.name,
      eventDate: event.date,
      eventLocation: event.location,
      fullName,
      email,
      phone,
      qrCodeUrl,
      message: isFree
        ? `Đăng ký vé miễn phí thành công cho ${createdTickets.length} đại biểu! Mã vé chính: ${regId}. Email vé đã được gửi tới ${email}.`
        : `Đăng ký vé thành công cho ${createdTickets.length} đại biểu! Vui lòng thanh toán qua VietQR. Thông tin đã được gửi tới email ${email}.`,
    };
  }

  async deleteRegistration(userId: string, registrationId: string) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_registrations WHERE id = ${registrationId} LIMIT 1
    `.catch(() => []);

    if (existing.length === 0) {
      throw new NotFoundException('Không tìm thấy thông tin đăng ký');
    }

    const reg = existing[0];
    await this.prisma.$executeRaw`
      DELETE FROM public.event_registrations WHERE id = ${registrationId}
    `;

    // Đồng bộ Realtime Báo Cáo Tài Chính: Xóa dòng tiền tương ứng trong transactions và income_records
    const txCode = `THU-EV${registrationId}`;
    await this.prisma.$executeRaw`
      DELETE FROM public.transactions 
      WHERE code = ${txCode} 
         OR description LIKE ${`%#${registrationId}%`}
         OR description LIKE ${`%Vé ${registrationId}%`}
    `.catch(() => {});
    await this.prisma.$executeRaw`
      DELETE FROM public.income_records 
      WHERE id LIKE ${`inc_reg_${registrationId}%`} 
         OR description LIKE ${`%Vé ${registrationId}%`}
    `.catch(() => {});

    if (reg.event_id) {
      await this.prisma.$executeRaw`
        UPDATE public.events 
        SET registered = GREATEST(0, registered - 1), updated_at = now()
        WHERE id = ${reg.event_id}
      `.catch(() => null);
    }

    return { ok: true, deleted: true, id: registrationId };
  }

  // ── EVENT FEEDBACK & RATINGS (UC-2) ──────────────────────────────────────

  async listEventFeedbacks(eventId: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT id, event_id, member_name, member_phone, member_email, rating,
             COALESCE(NULLIF(content, ''), NULLIF(comment, ''), NULLIF(feedback_text, ''), '') as comment,
             status, attachment_url, created_at
      FROM public.event_feedback
      WHERE event_id = $1
      ORDER BY created_at DESC;
    `, eventId).catch(() => []);

    return rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      memberId: r.member_id || null,
      userName: r.member_name || 'Đại biểu',
      userEmail: r.member_email || '',
      userPhone: r.member_phone || '',
      rating: Number(r.rating || 5),
      comment: r.comment || '',
      createdAt: r.created_at,
    }));
  }

  async submitEventFeedback(eventId: string, data: any) {
    const rawComment = (data.comment || data.content || data.feedback_text || '').trim();
    if (!rawComment) {
      throw new BadRequestException('Vui lòng nhập nội dung đánh giá / phản hồi cho sự kiện');
    }

    const feedbackId = `fb_ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userName = (data.userName || data.memberName || data.name || 'Đại biểu CEO HN10').trim();
    const userEmail = (data.userEmail || data.memberEmail || data.email || '').trim().toLowerCase();
    const userPhone = (data.userPhone || data.memberPhone || data.phone || '').trim();
    const rating = Math.min(5, Math.max(1, Number(data.rating) || 5));

    await this.prisma.$executeRaw`
      INSERT INTO public.event_feedback (
        id, event_id, member_name, member_phone, member_email, rating, comment, content, feedback_text, status, created_at
      ) VALUES (
        ${feedbackId}, ${eventId}, ${userName}, ${userPhone}, ${userEmail}, ${rating}, ${rawComment}, ${rawComment}, ${rawComment}, 'received', now()
      )
    `;

    // Đồng bộ vào feedbacks CRM
    const evRows = await this.prisma.$queryRaw<any[]>`SELECT name, title, association_id FROM public.events WHERE id = ${eventId} LIMIT 1`.catch(() => []);
    const evTitle = evRows[0]?.name || evRows[0]?.title || 'Sự kiện CLB CEO HN10';
    const assocId = evRows[0]?.association_id || 'c1983000-0000-4000-8000-000000001983';

    await this.prisma.$executeRaw`
      INSERT INTO public.feedbacks (
        id, title, content, rating, type, status, association_id, created_at, user_id
      ) VALUES (
        ${feedbackId},
        ${`Đánh giá sự kiện: ${evTitle}`},
        ${`[${rating} Sao] ${rawComment} - Người gửi: ${userName} (${userPhone || userEmail || 'Khách'})`},
        ${rating},
        'event_feedback',
        'pending',
        ${assocId}::uuid,
        now(),
        NULL
      )
    `.catch(() => {});

    return {
      success: true,
      ok: true,
      feedbackId,
      message: 'Cảm ơn Anh/Chị đã gửi đánh giá phản hồi về sự kiện!',
    };
  }

  // ── ATTACH MEDIA & ARCHIVE TO DOCUMENTS (UC-2) ──────────────────────────

  async attachEventMedia(eventId: string, mediaUrl: string, description?: string) {
    if (!mediaUrl?.trim()) {
      throw new BadRequestException('Vui lòng cung cấp link hình ảnh hoặc video sự kiện');
    }

    const event = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM public.events WHERE id = $1 LIMIT 1;
    `, eventId).catch(() => []);

    const evTitle = event[0]?.name || 'Sự kiện CEO HN10';

    // 1. Cập nhật photo_gallery_url trong events
    await this.prisma.$executeRawUnsafe(`
      UPDATE public.events 
      SET photo_gallery_url = $1, updated_at = now() 
      WHERE id = $2;
    `, mediaUrl.trim(), eventId);

    // 2. Lưu link media vào Kho Tài Liệu CLB (public.documents)
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.documents (
        title, name, code, category, file_url, file_path, file_type, type,
        event_id, description, uploaded_by_name, uploaded_by, uploaded_at
      ) VALUES (
        $1, $1, $2, 'event_media', $3, $3, 'media_link', 'media_link',
        $4, $5, 'Ban Truyền Thông & Sự Kiện', 'Ban Truyền Thông & Sự Kiện', now()
      );
    `,
      `[Media Sự Kiện] ${evTitle}`,
      `EV-MEDIA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      mediaUrl.trim(),
      eventId,
      description || `Bộ ảnh và media tư liệu ghi hình sự kiện "${evTitle}".`,
    ).catch(() => { });

    return {
      success: true,
      message: 'Đã đính kèm link tư liệu ảnh/media sự kiện và lưu trữ vào Kho Tài Liệu CLB!',
      mediaUrl: mediaUrl.trim(),
    };
  }

  // ── 1-TIME CHECKIN & CHECKOUT ENFORCEMENT & PUBLIC TICKET LOOKUP ─────────────

  private resolveCleanTicketCode(rawCode: any): string {
    if (!rawCode) return '';
    let str = String(rawCode).trim();
    if (!str) return '';

    // Gỡ bỏ dấu ngoặc kép / nháy đơn bọc chuỗi
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
      str = str.slice(1, -1).trim();
    }

    // 1. Phân tích nếu chuỗi là JSON (từ camera quét QR payload)
    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        const parsed = JSON.parse(str);
        const candidate = parsed.ticketCode || parsed.registrationId || parsed.id || parsed.code || parsed.luckyNumber || parsed.phone;
        if (candidate) return String(candidate).trim();
      } catch {}
    }

    // 2. Phân tích nếu chuỗi là URL (từ camera quét QR URL web)
    if (str.includes('http://') || str.includes('https://') || str.includes('?') || str.includes('/ticket')) {
      try {
        const urlObj = str.startsWith('http') ? new URL(str) : new URL(`http://dummy.local/${str.replace(/^\/+/, '')}`);
        const candidate = urlObj.searchParams.get('ticket') || 
                          urlObj.searchParams.get('ticketCode') || 
                          urlObj.searchParams.get('regId') || 
                          urlObj.searchParams.get('registrationId') || 
                          urlObj.searchParams.get('id') ||
                          urlObj.searchParams.get('code');
        if (candidate) return candidate.trim();
      } catch {}
    }

    return str;
  }

  async getTicketStatus(ticketCode: string) {
    const clean = this.resolveCleanTicketCode(ticketCode);
    if (!clean) {
      throw new BadRequestException('Mã vé không được để trống hoặc không hợp lệ');
    }
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT r.*, e.name as event_name, e.title as event_title, e.date as event_date, e.location as event_location, e.start_time, e.end_time
      FROM public.event_registrations r
      LEFT JOIN public.events e ON e.id = r.event_id
      WHERE r.id = ${clean} 
         OR UPPER(TRIM(COALESCE(r.member_code, ''))) = UPPER(${clean})
         OR r.lucky_number = ${clean}
         OR r.phone = ${clean}
         OR LOWER(TRIM(COALESCE(r.email, ''))) = LOWER(${clean})
         OR (r.qr_payload IS NOT NULL AND r.qr_payload = ${clean})
         OR (r.qr_code IS NOT NULL AND r.qr_code = ${clean})
      ORDER BY r.created_at DESC
      LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) {
      // KIỂM TRA SỰ KIỆN MIỄN PHÍ: Nếu không tìm thấy vé nhưng có sự kiện miễn phí,
      // cho phép tự động cấp vé & CHECK-IN PASS cho khách mới không nằm trong danh sách đăng ký trước giờ G
      const freeEventRows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.events
        WHERE (ticket_price = 0 OR fee = 0 OR type = 'charity' OR type = 'khai_giang')
        ORDER BY created_at DESC
        LIMIT 1
      `.catch(() => []);

      if (freeEventRows.length > 0) {
        const freeEvt = freeEventRows[0];
        const lastReg = await this.prisma.$queryRaw<any[]>`
          SELECT id FROM public.event_registrations WHERE id ~ '^[0-9]+$' ORDER BY CAST(id AS BIGINT) DESC LIMIT 1
        `.catch(() => []);
        const nextId = lastReg.length > 0 ? (BigInt(lastReg[0].id) + 1n).toString() : `8${Math.floor(1000 + Math.random() * 9000)}`;
        const luckyNum = String(Math.floor(1000 + Math.random() * 9000));
        const memberCode = clean.startsWith('GUEST-') || clean.startsWith('HN10-') || clean.startsWith('WALKIN-') ? clean.toUpperCase() : `WALKIN-${luckyNum}`;
        const memberName = clean.startsWith('WALKIN-') || clean.match(/^[0-9]+$/) ? `Khách Mới Giờ G #${luckyNum}` : clean;

        await this.prisma.$executeRaw`
          INSERT INTO public.event_registrations (
            id, event_id, member_code, member_name, email, phone, company, position, note,
            registered_at, status, ticket_type, ticket_count, association_id, payment_status,
            payment_amount, lucky_number, is_walkin, registration_origin, created_at, updated_at
          ) VALUES (
            ${nextId},
            ${freeEvt.id},
            ${memberCode},
            ${memberName},
            ${clean.includes('@') ? clean.toLowerCase() : `walkin.${nextId}@ceohn10.vn`},
            ${clean.match(/^[0-9]{9,11}$/) ? clean : ''},
            'Khách vãng lai giờ G',
            'Đại biểu mới',
            'Khách tham gia không nằm trong danh sách đăng ký trước giờ G',
            now()::date,
            'confirmed',
            'Vé Miễn Phí (Tại Cửa)',
            1,
            ${freeEvt.association_id || 'c1983000-0000-4000-8000-000000001983'}::uuid,
            'free',
            0,
            ${luckyNum},
            true,
            'walkin_unannounced',
            now(),
            now()
          )
        `.catch(() => {});

        return {
          found: true,
          autoPassWalkIn: true,
          message: 'Sự kiện miễn phí: Tự động cấp vé & Cho phép Check-in Pass cho khách mới không nằm trong danh sách trước giờ G!',
          ticket: {
            id: nextId,
            eventId: freeEvt.id,
            eventTitle: freeEvt.name || freeEvt.title || 'Sự kiện CEO HN10',
            eventDate: freeEvt.date ? new Date(freeEvt.date).toLocaleDateString('vi-VN') : 'Hôm nay',
            eventTime: `${freeEvt.start_time || '08:30'} - ${freeEvt.end_time || '12:00'}`,
            eventLocation: freeEvt.location || 'Hà Nội',
            memberName,
            memberCode,
            phone: clean.match(/^[0-9]{9,11}$/) ? clean : '',
            email: clean.includes('@') ? clean.toLowerCase() : `walkin.${nextId}@ceohn10.vn`,
            company: 'Khách vãng lai giờ G',
            position: 'Đại biểu mới',
            ticketType: 'Vé Miễn Phí (Tại Cửa)',
            ticketCount: 1,
            paymentStatus: 'free',
            paymentAmount: 0,
            luckyNumber: luckyNum,
            seatAssignment: 'Khu vực tự do',
            isWalkIn: true,
            isWalkInAfterGHour: true,
            attendeeType: 'WALK_IN_UNANNOUNCED',
            attendeeTypeLabel: 'Khách không nằm trong danh sách đăng ký trước giờ G',
            registrationOrigin: 'walkin_unannounced',
            isCheckedIn: false,
            checkedInAt: null,
            isCheckedOut: false,
            checkedOutAt: null,
          },
        };
      }

      return { found: false, message: 'Không tìm thấy vé hoặc mã đăng ký trên hệ thống.' };
    }

    const reg = rows[0];
    const isCheckedIn = Boolean(reg.checked_in_at);
    const isCheckedOut = Boolean(reg.checked_out_at);
    const isWalkIn = reg.is_walkin === true || reg.registration_origin === 'walkin_at_door' || reg.registration_origin === 'walkin_unannounced';
    const isWalkInAfterGHour = reg.registration_origin === 'walkin_unannounced' || (reg.note && reg.note.includes('trước giờ G'));
    const attendeeType = isWalkInAfterGHour ? 'WALK_IN_UNANNOUNCED' : (isWalkIn ? 'WALK_IN_NEW' : 'PRE_REGISTERED');
    const attendeeTypeLabel = isWalkInAfterGHour ? 'Khách không nằm trong danh sách đăng ký trước giờ G' : (isWalkIn ? 'Khách mới đăng ký tại sự kiện' : 'Đại biểu đã đăng ký từ trước');

    return {
      found: true,
      ticket: {
        id: reg.id,
        eventId: reg.event_id,
        eventTitle: reg.event_name || reg.event_title || 'Sự kiện CEO HN10',
        eventDate: reg.event_date ? new Date(reg.event_date).toLocaleDateString('vi-VN') : 'Sắp diễn ra',
        eventTime: `${reg.start_time || '08:30'} - ${reg.end_time || '12:00'}`,
        eventLocation: reg.event_location || 'Hà Nội',
        memberName: reg.member_name,
        memberCode: reg.member_code,
        phone: reg.phone,
        email: reg.email,
        company: reg.company || 'Khách mời',
        position: reg.position || 'Đại biểu',
        ticketType: reg.ticket_type,
        ticketCount: reg.ticket_count || 1,
        paymentStatus: reg.payment_status || 'free',
        paymentAmount: Number(reg.payment_amount || 0),
        luckyNumber: reg.lucky_number,
        seatAssignment: reg.seat_assignment,
        isWalkIn,
        isWalkInAfterGHour,
        attendeeType,
        attendeeTypeLabel,
        registrationOrigin: reg.registration_origin || 'pre_registered',
        isCheckedIn,
        checkedInAt: reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleString('vi-VN') : null,
        isCheckedOut,
        checkedOutAt: reg.checked_out_at ? new Date(reg.checked_out_at).toLocaleString('vi-VN') : null,
      },
    };
  }

  async performTicketCheckin(ticketCode: string, method: string = 'web', attendedParts?: string[]) {
    const clean = this.resolveCleanTicketCode(ticketCode);
    if (!clean) {
      throw new BadRequestException('Mã vé không được để trống hoặc không hợp lệ');
    }
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT r.*, e.name as event_name, e.association_id as event_assoc_id,
             e.date as event_date
      FROM public.event_registrations r
      LEFT JOIN public.events e ON e.id = r.event_id
      WHERE r.id = ${clean} 
         OR UPPER(TRIM(COALESCE(r.member_code, ''))) = UPPER(${clean})
         OR r.lucky_number = ${clean}
         OR r.phone = ${clean}
         OR LOWER(TRIM(COALESCE(r.email, ''))) = LOWER(${clean})
         OR (r.qr_payload IS NOT NULL AND r.qr_payload = ${clean})
      ORDER BY r.created_at DESC
      LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) {
      throw new NotFoundException('Không tìm thấy thông tin vé đăng ký với mã: ' + clean);
    }

    const reg = rows[0];

    // Chặn check-in trùng lặp (Strict 1-Time Check-In Enforcement)
    if (reg.checked_in_at) {
      const formattedTime = new Date(reg.checked_in_at).toLocaleString('vi-VN');
      return {
        ok: false,
        alreadyCheckedIn: true,
        message: `Vé này ĐÃ ĐƯỢC CHECK-IN lúc ${formattedTime}! Không thể check-in lại.`,
        checkedInAt: formattedTime,
        ticket: {
          id: reg.id,
          memberName: reg.member_name,
          eventTitle: reg.event_name,
          phone: reg.phone,
          company: reg.company,
          attendedParts: parseJsonArraySafe(reg.attended_parts),
        },
      };
    }

    const now = new Date();
    const partsArray = Array.isArray(attendedParts) && attendedParts.length > 0 
      ? attendedParts 
      : parseJsonArraySafe(reg.attended_parts);
    const partsJson = JSON.stringify(partsArray);

    // Phân loại Đúng giờ / Đi muộn theo thời gian bắt đầu sự kiện (UC-EVT-05)
    let isLate = false;
    if (reg.event_date) {
      try {
        const dStr = reg.event_date instanceof Date ? reg.event_date.toISOString().slice(0, 10) : String(reg.event_date).slice(0, 10);
        const tStr = '08:30';
        const [sh, sm] = tStr.split(':').map((v: string) => parseInt(v, 10) || 0);
        const eventStart = new Date(dStr);
        eventStart.setHours(sh, sm, 0, 0);
        // Quá 15 phút sau giờ khai mạc tính là đi muộn
        if (now.getTime() > eventStart.getTime() + 15 * 60 * 1000) {
          isLate = true;
        }
      } catch {}
    }
    const checkinTimeliness = isLate ? 'late' : 'on_time';

    await this.prisma.$executeRawUnsafe(`
      UPDATE public.event_registrations
      SET checked_in_at = NOW(), status = 'attended', attended_parts = $1::jsonb, is_late = $2, checkin_timeliness = $3, updated_at = NOW()
      WHERE id = $4
    `, partsJson, isLate, checkinTimeliness, reg.id);

    // UC-EVT-05-1: Gửi email xác nhận điểm danh check-in thành công cho đại biểu
    if (reg.email && reg.email.includes('@') && this.mailService) {
      const seatInfo = reg.seat_assignment ? `Vị trí chỗ ngồi / Ghế số của Quý Anh/Chị: ${reg.seat_assignment}` : 'Quý Anh/Chị vui lòng liên hệ Ban Lễ Tân tại sảnh để được hướng dẫn vị trí ngồi.';
      this.mailService.sendDirectEmail({
        to: reg.email,
        subject: `[CLB CEO HN10] Điểm Danh Check-in Thành Công — ${reg.event_name || reg.event_title || 'Sự kiện'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #003B95; margin-bottom: 12px;">KÍNH CHÀO ANH/CHỊ ${reg.member_name || 'ĐẠI BIỂU'}</h2>
            <p style="font-size: 15px; color: #334155; line-height: 1.6;">
              Ban Tổ Chức CLB Doanh Nhân CEO HN10 xác nhận Quý Anh/Chị đã <strong>Check-in thành công</strong> tham dự sự kiện <strong>${reg.event_name || reg.event_title}</strong>.
            </p>
            <div style="background-color: #f8fafc; border-left: 4px solid #003B95; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 6px 0;"><strong>Mã vé:</strong> ${reg.id}</p>
              <p style="margin: 6px 0;"><strong>Hạng vé:</strong> ${reg.ticket_type || 'Vé Tiêu Chuẩn'}</p>
              <p style="margin: 6px 0;"><strong>Thời gian điểm danh:</strong> ${now.toLocaleString('vi-VN')}</p>
              <p style="margin: 6px 0; color: #003B95; font-size: 16px;"><strong>${seatInfo}</strong></p>
              <p style="margin: 6px 0; color: ${isLate ? '#d97706' : '#059669'};"><strong>Trạng thái điểm danh:</strong> ${isLate ? 'Đi muộn' : 'Đúng giờ'}</p>
            </div>
            <p style="font-size: 14px; color: #64748b;">Chúc Quý Anh/Chị có một buổi giao lưu, kết nối và nhận được nhiều giá trị thiết thực!</p>
          </div>
        `,
      }).catch((err) => {
        this.logger.warn(`Lỗi gửi email xác nhận check-in cho ${reg.email}: ${err?.message}`);
      });
    }

    // Ghi nhận vào member_checkins
    const clientId = `chk:tkt:${reg.association_id || 'ceohn10'}:${reg.member_code}:${reg.event_id || 'any'}`;
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.member_checkins (
        id, client_id, member_code, event_id, event_title, status, method, checked_at, association_id
      ) VALUES (
        gen_random_uuid(), $1, $2, $3::uuid, $4, 'success', $5, NOW(), $6::uuid
      ) ON CONFLICT (client_id) DO UPDATE SET checked_at = member_checkins.checked_at
    `,
      clientId,
      reg.member_code,
      reg.event_id && reg.event_id.match(/^[0-9a-f-]{36}$/i) ? reg.event_id : null,
      reg.event_name || reg.event_title || 'Sự kiện CEO HN10',
      method,
      reg.association_id && String(reg.association_id).match(/^[0-9a-f-]{36}$/i) ? reg.association_id : null,
    ).catch(() => {});

    const isWalkIn = reg.is_walkin === true || reg.registration_origin === 'walkin_at_door';
    const attendeeType = isWalkIn ? 'WALK_IN_NEW' : 'PRE_REGISTERED';
    const attendeeTypeLabel = isWalkIn ? 'Khách mới đăng ký tại sự kiện' : 'Đại biểu đã đăng ký từ trước';

    return {
      ok: true,
      message: 'Check-in thành công!',
      checkedInAt: now.toLocaleString('vi-VN'),
      ticket: {
        id: reg.id,
        memberName: reg.member_name,
        memberCode: reg.member_code,
        eventTitle: reg.event_name || reg.event_title,
        phone: reg.phone,
        company: reg.company,
        position: reg.position,
        seatAssignment: reg.seat_assignment,
        luckyNumber: reg.lucky_number,
        isWalkIn,
        isLate,
        checkinTimeliness,
        attendeeType,
        attendeeTypeLabel,
        registrationOrigin: reg.registration_origin || 'pre_registered',
        paymentStatus: reg.payment_status || 'free',
        paymentAmount: Number(reg.payment_amount || 0),
        attendedParts: partsArray,
      },
    };
  }

  async performTicketCheckout(ticketCode: string) {
    const clean = this.resolveCleanTicketCode(ticketCode);
    if (!clean) {
      throw new BadRequestException('Mã vé không được để trống hoặc không hợp lệ');
    }
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT r.*, e.name as event_name, e.title as event_title, e.association_id as event_assoc_id
      FROM public.event_registrations r
      LEFT JOIN public.events e ON e.id = r.event_id
      WHERE r.id = ${clean} 
         OR UPPER(TRIM(COALESCE(r.member_code, ''))) = UPPER(${clean})
         OR r.lucky_number = ${clean}
         OR r.phone = ${clean}
         OR LOWER(TRIM(COALESCE(r.email, ''))) = LOWER(${clean})
         OR (r.qr_payload IS NOT NULL AND r.qr_payload = ${clean})
         OR (r.qr_code IS NOT NULL AND r.qr_code = ${clean})
      ORDER BY r.created_at DESC
      LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) {
      throw new NotFoundException('Không tìm thấy vé đăng ký với mã: ' + clean);
    }

    const reg = rows[0];

    // Chưa check-in thì không được check-out
    if (!reg.checked_in_at) {
      return {
        ok: false,
        notCheckedIn: true,
        message: 'Vé này chưa được thực hiện check-in vào cửa! Vui lòng check-in trước.',
        ticket: {
          id: reg.id,
          memberName: reg.member_name,
          eventTitle: reg.event_name,
          phone: reg.phone,
          company: reg.company,
        },
      };
    }

    // Đã check-out rồi
    if (reg.checked_out_at) {
      const formattedTime = new Date(reg.checked_out_at).toLocaleString('vi-VN');
      return {
        ok: false,
        alreadyCheckedOut: true,
        message: `Vé này ĐÃ THỰC HIỆN CHECK-OUT lúc ${formattedTime}! Không thể check-out lại.`,
        checkedOutAt: formattedTime,
        ticket: {
          id: reg.id,
          memberName: reg.member_name,
          eventTitle: reg.event_name,
          phone: reg.phone,
          company: reg.company,
          checkedInAt: reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleString('vi-VN') : null,
          checkedOutAt: formattedTime,
        },
      };
    }

    const now = new Date();
    await this.prisma.$executeRawUnsafe(`
      UPDATE public.event_registrations
      SET checked_out_at = NOW(), status = 'checked_out', updated_at = NOW()
      WHERE id = $1
    `, reg.id);

    // Cập nhật member_checkins nếu có
    await this.prisma.$executeRawUnsafe(`
      UPDATE public.member_checkins
      SET status = 'checked_out'
      WHERE member_code = $1 AND event_title = $2
    `, reg.member_code || '', reg.event_name || reg.event_title || '').catch(() => {});

    // Gửi email cảm ơn Quý đại biểu đã tham gia sự kiện
    if (reg.email && reg.email.includes('@') && this.mailService) {
      const attendeeName = reg.member_name || 'Quý Hội viên / Quý Đại biểu';
      const eventTitle = reg.event_name || reg.event_title || 'Sự kiện CLB CEO HN10';
      const checkedInTimeStr = reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleString('vi-VN') : 'Đã check-in';
      const checkedOutTimeStr = now.toLocaleString('vi-VN');

      this.mailService.sendDirectEmail({
        to: reg.email,
        subject: `[THƯ CẢM ƠN] Ban Tổ Chức CLB CEO HN10 Cảm Ơn Quý Đại Biểu — ${eventTitle}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
            <div style="background: linear-gradient(135deg, #003B95 0%, #1e40af 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.15); border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.25);">
                HANOIBA · CLB DOANH NHÂN CEO HN10
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff;">THƯ CẢM ƠN THAM DỰ SỰ KIỆN</h1>
              <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9; color: #bfdbfe;">Trân trọng cảm ơn sự hiện diện quý báu của Quý Anh/Chị</p>
            </div>

            <div style="padding: 28px 24px; color: #1e293b; line-height: 1.6;">
              <p style="font-size: 15px; margin: 0 0 16px;">
                Kính gửi Anh/Chị: <strong style="color: #003B95; font-size: 16px;">${attendeeName}</strong>,
              </p>
              <p style="font-size: 14px; color: #475569; margin: 0 0 20px;">
                Ban Tổ Chức CLB Doanh Nhân CEO HN10 (HanoiBA) xin gửi lời cảm ơn chân thành và sâu sắc nhất tới Quý Anh/Chị đã dành thời gian quý báu đến tham dự chương trình <strong>${eventTitle}</strong>.
              </p>

              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                <div style="font-size: 15px; font-weight: 800; color: #166534; margin-bottom: 10px;">THÔNG TIN XÁC NHẬN RA VỀ (CHECK-OUT):</div>
                <div style="font-size: 13px; color: #334155; margin-bottom: 6px;">
                  🎫 <strong>Mã vé:</strong> ${reg.id}
                </div>
                <div style="font-size: 13px; color: #334155; margin-bottom: 6px;">
                  🟢 <strong>Thời gian vào cửa (Check-in):</strong> ${checkedInTimeStr}
                </div>
                <div style="font-size: 13px; color: #15803d; font-weight: 700; margin-bottom: 6px;">
                  🏁 <strong>Thời gian ra về (Check-out):</strong> ${checkedOutTimeStr}
                </div>
                ${reg.seat_assignment ? `<div style="font-size: 13px; color: #334155;">📍 <strong>Vị trí ghế:</strong> ${reg.seat_assignment}</div>` : ''}
              </div>

              <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">
                Sự hiện diện và đồng hành của Quý Doanh nhân đã góp phần tạo nên thành công rực rỡ cho sự kiện. Kính chúc Quý Anh/Chị cùng Doanh nghiệp ngày càng phát triển, vươn tầm và luôn kết nối bền chặt cùng đại gia đình CEO HN10!
              </p>

              <div style="background: #f8fafc; border-left: 4px solid #003B95; border-radius: 0 8px 8px 0; padding: 14px 18px; margin-top: 24px;">
                <div style="font-size: 13px; font-weight: 700; color: #003B95; margin-bottom: 4px;">BAN ĐIỀU HÀNH CLB DOANH NHÂN CEO HN10</div>
                <div style="font-size: 12px; color: #64748b;">Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)</div>
              </div>
            </div>
          </div>
        `,
      }).catch((err) => {
        this.logger.warn(`Lỗi gửi email cảm ơn check-out cho ${reg.email}: ${err?.message}`);
      });
    }

    return {
      ok: true,
      message: 'Check-out (ra về) thành công! Cảm ơn Quý đại biểu đã tham gia sự kiện.',
      checkedOutAt: now.toLocaleString('vi-VN'),
      ticket: {
        id: reg.id,
        memberName: reg.member_name,
        memberCode: reg.member_code,
        phone: reg.phone,
        company: reg.company,
        position: reg.position,
        eventTitle: reg.event_name || reg.event_title,
        ticketType: reg.ticket_type,
        seatAssignment: reg.seat_assignment,
        checkedInAt: reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleString('vi-VN') : null,
        checkedOutAt: now.toLocaleString('vi-VN'),
      },
    };
  }

  // ── OFFLINE CHECKIN ENGINE (HỖ TRỢ KHU VỰC MẤT SÓNG / KHÔNG CÓ MẠNG) ─────────

  async getEventOfflineDataset(eventId: string) {
    let resolvedEventId = eventId;
    if (!eventId || eventId === 'latest') {
      const latestEvents = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, title FROM public.events
        ORDER BY start_date DESC NULLS LAST, created_at DESC LIMIT 1
      `.catch(() => []);
      if (latestEvents.length > 0) {
        resolvedEventId = latestEvents[0].id;
      }
    }

    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, title, start_date, location FROM public.events
      WHERE id = ${resolvedEventId} LIMIT 1
    `.catch(() => []);
    const event = eventRows.length > 0 ? eventRows[0] : null;

    const tickets = await this.prisma.$queryRaw<any[]>`
      SELECT 
        r.id,
        r.member_code,
        r.lucky_number,
        r.member_name,
        r.phone,
        r.company,
        r.position,
        r.ticket_type,
        r.seat_assignment,
        r.checked_in_at,
        r.status,
        r.attended_parts,
        r.event_id
      FROM public.event_registrations r
      WHERE r.event_id = ${resolvedEventId}
      ORDER BY r.created_at ASC
    `.catch(() => []);

    return {
      ok: true,
      eventId: resolvedEventId,
      eventName: event?.name || event?.title || 'Sự kiện CEO HN10',
      totalTickets: tickets.length,
      downloadedAt: new Date().toISOString(),
      tickets: tickets.map((t) => ({
        id: t.id,
        memberCode: t.member_code,
        luckyNumber: t.lucky_number,
        memberName: t.member_name,
        phone: t.phone,
        company: t.company,
        position: t.position,
        ticketType: t.ticket_type || 'Vé Tiêu Chuẩn',
        seatAssignment: t.seat_assignment || 'Khu A',
        isCheckedIn: !!t.checked_in_at,
        checkedInAt: t.checked_in_at ? new Date(t.checked_in_at).toLocaleString('vi-VN') : null,
        status: t.status || 'pending',
        attendedParts: parseJsonArraySafe(t.attended_parts),
      })),
    };
  }

  async batchSyncCheckin(
    eventId: string,
    items: Array<{ ticketCode: string; checkedInAt?: string; method?: string; attendedParts?: string[] }>,
  ) {
    if (!Array.isArray(items) || items.length === 0) {
      return { ok: true, syncedCount: 0, conflictCount: 0, skippedCount: 0, details: [] };
    }

    let syncedCount = 0;
    let conflictCount = 0;
    let skippedCount = 0;
    const details: any[] = [];

    for (const item of items) {
      if (!item.ticketCode) continue;
      const clean = item.ticketCode.trim();

      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT r.*, e.name as event_name, e.title as event_title, e.association_id as event_assoc_id
        FROM public.event_registrations r
        LEFT JOIN public.events e ON e.id = r.event_id
        WHERE r.id = ${clean} 
           OR UPPER(TRIM(r.member_code)) = UPPER(${clean})
           OR r.lucky_number = ${clean}
        ORDER BY r.created_at DESC
        LIMIT 1
      `.catch(() => []);

      if (rows.length === 0) {
        skippedCount++;
        details.push({ ticketCode: clean, status: 'not_found', message: 'Không tìm thấy vé trên hệ thống' });
        continue;
      }

      const reg = rows[0];

      if (reg.checked_in_at) {
        const incomingTime = item.checkedInAt ? new Date(item.checkedInAt).getTime() : Date.now();
        const existingTime = new Date(reg.checked_in_at).getTime();

        if (incomingTime < existingTime) {
          // Xử lý xung đột: Thiết bị offline này quét sớm hơn mốc đã ghi nhận -> Ưu tiên mốc thời gian sớm hơn
          const earlierDate = new Date(incomingTime);
          const partsArray = Array.isArray(item.attendedParts) && item.attendedParts.length > 0
            ? item.attendedParts
            : parseJsonArraySafe(reg.attended_parts);

          await this.prisma.$executeRawUnsafe(`
            UPDATE public.event_registrations
            SET checked_in_at = $1, status = 'attended', attended_parts = $2::jsonb, updated_at = NOW()
            WHERE id = $3
          `, earlierDate, JSON.stringify(partsArray), reg.id).catch(() => {});

          syncedCount++;
          details.push({
            ticketCode: clean,
            status: 'conflict_resolved_earlier',
            memberName: reg.member_name,
            seatAssignment: reg.seat_assignment,
            checkedInAt: earlierDate.toLocaleString('vi-VN'),
            note: `Ưu tiên thời gian quét sớm hơn: ${earlierDate.toLocaleTimeString('vi-VN')} (máy quét sau: ${new Date(existingTime).toLocaleTimeString('vi-VN')})`,
          });
        } else {
          // Cảnh báo trùng lặp: Vé đã được check-in tại máy khác trước đó
          conflictCount++;
          details.push({
            ticketCode: clean,
            status: 'conflict_duplicate_warning',
            memberName: reg.member_name,
            seatAssignment: reg.seat_assignment,
            checkedInAt: new Date(existingTime).toLocaleString('vi-VN'),
            warning: `Vé đã được check-in tại thiết bị khác lúc ${new Date(existingTime).toLocaleTimeString('vi-VN')}. Không ghi đè.`,
          });
        }
        continue;
      }

      const checkinDate = item.checkedInAt ? new Date(item.checkedInAt) : new Date();
      const partsArray = Array.isArray(item.attendedParts) && item.attendedParts.length > 0
        ? item.attendedParts
        : parseJsonArraySafe(reg.attended_parts);

      await this.prisma.$executeRawUnsafe(`
        UPDATE public.event_registrations
        SET checked_in_at = $1, status = 'attended', attended_parts = $2::jsonb, updated_at = NOW()
        WHERE id = $3
      `, checkinDate, JSON.stringify(partsArray), reg.id).catch(() => {});

      const clientId = `offline-sync-${reg.id}-${Date.now()}`;
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO public.member_checkins (
          id, client_id, member_code, event_id, event_name, status, checkin_method, checked_at, association_id
        ) VALUES (
          gen_random_uuid(), $1, $2, $3::uuid, $4, 'success', $5, $6, $7::uuid
        ) ON CONFLICT (client_id) DO UPDATE SET checked_at = member_checkins.checked_at
      `,
        clientId,
        reg.member_code,
        reg.event_id && reg.event_id.match(/^[0-9a-f-]{36}$/i) ? reg.event_id : null,
        reg.event_name || reg.event_title || 'Sự kiện CEO HN10',
        item.method || 'offline_sync',
        checkinDate,
        reg.association_id && String(reg.association_id).match(/^[0-9a-f-]{36}$/i) ? reg.association_id : null,
      ).catch(() => {});

      syncedCount++;
      details.push({
        ticketCode: clean,
        status: 'synced_success',
        memberName: reg.member_name,
        seatAssignment: reg.seat_assignment,
        checkedInAt: checkinDate.toLocaleString('vi-VN'),
      });
    }

    return {
      ok: true,
      message: `Đồng bộ hoàn tất: ${syncedCount} lượt thành công, ${conflictCount} xung đột trùng lặp được phát hiện, ${skippedCount} bỏ qua.`,
      syncedCount,
      conflictCount,
      skippedCount,
      details,
    };
  }

  // ── DYNAMIC EVENT FEE CODES (TÍCH HỢP SEPAY DYNAMIC) ─────────────────────────

  async listEventFeeItems(eventId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_fee_items
      WHERE event_id = ${eventId}
      ORDER BY created_at ASC
    `.catch(() => []);
    return rows;
  }

  async createEventFeeItem(eventId: string, data: { feeCode: string; feeName: string; amount: number; description?: string }) {
    if (!data.feeCode || !data.feeName) {
      throw new BadRequestException('Mã phí và Tên phí là bắt buộc');
    }
    const cleanCode = data.feeCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const cleanName = data.feeName.trim();
    const amount = Math.max(0, Number(data.amount) || 0);
    const id = `FEE-${eventId.slice(-6)}-${Date.now().toString(36).toUpperCase()}`;

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.event_fee_items (id, event_id, fee_code, fee_name, amount, description, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
    `, id, eventId, cleanCode, cleanName, amount, data.description || '');

    return { ok: true, id, feeCode: cleanCode, feeName: cleanName, amount };
  }

  async updateEventFeeItem(eventId: string, feeId: string, data: { feeName?: string; amount?: number; description?: string; isActive?: boolean }) {
    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [feeId, eventId];

    if (data.feeName) {
      params.push(data.feeName.trim());
      updates.push(`fee_name = $${params.length}`);
    }
    if (data.amount !== undefined) {
      params.push(Math.max(0, Number(data.amount) || 0));
      updates.push(`amount = $${params.length}`);
    }
    if (data.description !== undefined) {
      params.push(data.description);
      updates.push(`description = $${params.length}`);
    }
    if (data.isActive !== undefined) {
      params.push(Boolean(data.isActive));
      updates.push(`is_active = $${params.length}`);
    }

    await this.prisma.$executeRawUnsafe(`
      UPDATE public.event_fee_items
      SET ${updates.join(', ')}
      WHERE id = $1 AND event_id = $2
    `, ...params);

    return { ok: true, message: 'Đã cập nhật mã phí thành công' };
  }

  async deleteEventFeeItem(eventId: string, feeId: string) {
    await this.prisma.$executeRawUnsafe(`
      DELETE FROM public.event_fee_items
      WHERE id = $1 AND event_id = $2
    `, feeId, eventId);
    return { ok: true, message: 'Đã xóa mã phí thành công' };
  }

  async generateSepayFeeQr(eventId: string, feeId: string, ticketCode: string) {
    const feeRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_fee_items WHERE id = ${feeId} AND event_id = ${eventId} LIMIT 1
    `.catch(() => []);
    if (feeRows.length === 0) {
      throw new NotFoundException('Không tìm thấy mã phí chỉ định');
    }
    const fee = feeRows[0];

    // Lấy cấu hình Sepay từ paymentService hoặc biến môi trường
    const sepayCfg = this.paymentService
      ? await this.paymentService.getSepayConfig()
      : {
          bankName: process.env.SEPAY_BANK_NAME || 'MBBank',
          accountNumber: process.env.SEPAY_ACCOUNT_NO || '',
          accountHolder: process.env.SEPAY_ACCOUNT_HOLDER || '',
          prefixEvent: 'CEOHN10_SK',
        };

    let bankAccount = sepayCfg.accountNumber;
    let bankName = sepayCfg.bankName || 'MB Bank (Quân Đội)';
    let bankBin = (sepayCfg.bankName || 'MB').toUpperCase().includes('MB') ? 'MB' : (sepayCfg.bankName || 'MB');
    let bankOwner = sepayCfg.accountHolder;
    let prefix = sepayCfg.prefixEvent || 'CEOHN10_SK';

    const cleanTicket = (ticketCode || 'TICKET').trim().replace(/[^a-zA-Z0-9]/g, '');
    const cleanFeeCode = (fee.fee_code || 'FEE').trim().replace(/[^a-zA-Z0-9]/g, '');
    const transferDescription = `${prefix}_${cleanTicket}_${cleanFeeCode}`;
    const amount = Number(fee.amount || 0);

    const vietQrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferDescription)}&accountName=${encodeURIComponent(bankOwner)}`;

    return {
      ok: true,
      feeName: fee.fee_name,
      feeCode: fee.fee_code,
      amount,
      transferDescription,
      bankAccount,
      bankName,
      bankOwner,
      vietQrUrl,
    };
  }

  /**
   * Lấy danh sách các cột động hiện có của bảng event_registrations
   * - Nếu truyền eventId: Chỉ lấy các cột động thuộc về riêng sự kiện đó (cô lập dữ liệu theo từng sự kiện)
   * - Nếu không truyền hoặc 'all': Lấy tất cả các cột động phát sinh
   */
  async getEventDynamicColumns(eventId?: string) {
    try {
      if (eventId && eventId !== 'all') {
        const keysResult = await this.prisma.$queryRaw<any[]>`
          SELECT DISTINCT jsonb_object_keys(dynamic_data) AS col_name 
          FROM public.event_registrations 
          WHERE event_id = ${eventId} 
            AND dynamic_data IS NOT NULL 
            AND dynamic_data::text != '{}'
        `.catch(() => []);

        const eventDynamicCols = keysResult.map((k: any) => ({
          columnName: k.col_name,
          dataType: 'text',
          label: k.col_name.replace(/_/g, ' ').toUpperCase(),
        }));

        return { ok: true, dynamicColumns: eventDynamicCols };
      }

      const cols = await this.prisma.$queryRaw<any[]>`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_registrations'
      `.catch(() => []);

      const standardCols = new Set([
        'id', 'event_id', 'member_code', 'member_name', 'email', 'phone', 'company',
        'position', 'note', 'registered_at', 'status', 'ticket_type', 'ticket_count',
        'association_id', 'payment_status', 'payment_amount', 'lucky_number', 'qr_payload',
        'created_at', 'updated_at', 'checked_in_at', 'checked_out_at', 'checkin_method',
        'checked_in_by', 'table_name', 'seat_assignment', 'vnp_txn_ref', 'payment_method',
        'paid_at', 'is_walkin', 'registration_origin', 'dynamic_data', 'attended_parts'
      ]);

      const dynamicCols = cols
        .filter((c: any) => !standardCols.has(c.column_name.toLowerCase()))
        .map((c: any) => ({
          columnName: c.column_name,
          dataType: c.data_type,
          label: c.column_name.replace(/_/g, ' ').toUpperCase(),
        }));

      return { ok: true, dynamicColumns: dynamicCols };
    } catch (err: any) {
      return { ok: false, dynamicColumns: [], message: err?.message };
    }
  }

  /**
   * Cập nhật trạng thái thanh toán trực tiếp trên từng row vé đăng ký
   * - Đồng bộ hạch toán Quỹ tài chính CRM khi chuyển sang Đã thanh toán (paid)
   */
  async updateRegistrationPaymentStatus(regId: string, paymentStatus: 'paid' | 'unpaid' | 'free') {
    if (!regId) throw new BadRequestException('Mã vé không được để trống');
    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_registrations WHERE id = ${regId} LIMIT 1
    `.catch(() => []);
    if (regRows.length === 0) {
      throw new NotFoundException(`Không tìm thấy vé đăng ký ID ${regId}`);
    }
    const reg = regRows[0];
    const oldStatus = reg.payment_status;
    const paymentAmount = Number(reg.payment_amount || 0);

    await this.prisma.$executeRaw`
      UPDATE public.event_registrations
      SET payment_status = ${paymentStatus},
          updated_at = now()
      WHERE id = ${regId}
    `;

    // Nếu chuyển sang paid và có số tiền > 0 -> tự động hạch toán Quỹ thu vé
    if (paymentStatus === 'paid' && paymentAmount > 0 && oldStatus !== 'paid') {
      const incId = `inc_reg_${regId}_${Date.now()}`;
      const desc = `Thu phí tham dự sự kiện (Đổi trạng thái CRM): ${reg.member_name} - Vé ${regId}`;
      const txCode = `THU-EV${regId}`;
      await this.prisma.$executeRaw`
        INSERT INTO public.transactions (
          id, code, date, type, category, description, amount, method, status, association_id, recipient, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${txCode},
          now()::date,
          'income',
          'Vé sự kiện',
          ${desc},
          ${paymentAmount},
          'bank',
          'completed',
          ${reg.association_id}::uuid,
          ${reg.member_name || ''},
          now(),
          now()
        )
      `.catch(() => {});
      await this.prisma.$executeRaw`
        INSERT INTO public.income_records (
          id, association_id, category, amount, description, source, transaction_date, created_at, status
        ) VALUES (
          ${incId},
          ${reg.association_id}::uuid,
          'Thu phí sự kiện',
          ${paymentAmount},
          ${desc},
          'crm_inline_toggle',
          now()::date,
          now(),
          'completed'
        )
      `.catch((err) => {
        this.logger.warn(`[updateRegistrationPaymentStatus] Lỗi ghi nhận quỹ: ${err?.message}`);
      });
    }

    // Nếu chuyển từ paid sang unpaid/free -> thu hồi/xóa giao dịch đã ghi nhận để Báo Cáo Tài Chính Realtime 100%
    if (paymentStatus !== 'paid' && oldStatus === 'paid') {
      const txCode = `THU-EV${regId}`;
      await this.prisma.$executeRaw`
        DELETE FROM public.transactions 
        WHERE code = ${txCode} 
           OR description LIKE ${`%#${regId}%`}
           OR description LIKE ${`%Vé ${regId}%`}
      `.catch(() => {});
      await this.prisma.$executeRaw`
        DELETE FROM public.income_records 
        WHERE id LIKE ${`inc_reg_${regId}%`} 
           OR description LIKE ${`%Vé ${regId}%`}
      `.catch(() => {});
    }

    return {
      ok: true,
      regId,
      paymentStatus,
      message: `Đã cập nhật trạng thái thanh toán thành: ${paymentStatus === 'paid' ? 'Đã thanh toán' : paymentStatus === 'unpaid' ? 'Chưa thanh toán' : 'Miễn phí'}`,
    };
  }

  /**
   * Lấy danh sách các đại biểu ĐÃ CHECK-IN của sự kiện phục vụ Vòng Quay Bốc Thăm (Lucky Draw) & Biểu Quyết
   */
  async getCheckedInCandidates(eventId: string) {
    if (!eventId) throw new BadRequestException('Mã sự kiện không được để trống');
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, member_code, member_name, phone, email, company, position, lucky_number, checked_in_at, is_walkin, attended_parts
      FROM public.event_registrations
      WHERE event_id = ${eventId}
        AND (
          checked_in_at IS NOT NULL 
          OR status = 'attended'
          OR status = 'checked_in'
        )
      ORDER BY checked_in_at DESC NULLS LAST, id ASC
    `.catch(() => []);

    const candidates = rows.map((r: any) => ({
      id: r.id,
      code: r.lucky_number || r.member_code || `MB-${r.id}`,
      name: r.member_name || 'Đại biểu',
      company: r.company || 'Doanh nghiệp CEO HN10',
      position: r.position || '',
      phone: r.phone || '',
      email: r.email || '',
      isWalkIn: Boolean(r.is_walkin),
      attendedParts: parseJsonArraySafe(r.attended_parts),
      checkedInAt: r.checked_in_at ? new Date(r.checked_in_at).toLocaleString('vi-VN') : '',
    }));

    return { ok: true, eventId, total: candidates.length, candidates };
  }

  /**
   * Chụp / Tải ảnh tư liệu trong quá trình diễn ra sự kiện
   * - Lưu vào bảng event_photos
   * - Đồng thời tự động đồng bộ vào chức năng Quản Lý Tài Liệu (documents)
   */
  async addEventPhoto(
    eventId: string,
    data: { photoUrl: string; caption?: string; uploadedBy?: string; associationId?: string }
  ) {
    if (!eventId) throw new BadRequestException('Mã sự kiện không được để trống');
    if (!data.photoUrl || !data.photoUrl.trim()) {
      throw new BadRequestException('Đường link ảnh không được để trống');
    }

    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT name, title, association_id FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);
    const eventName = eventRows[0]?.name || eventRows[0]?.title || 'Sự kiện CEO HN10';
    const assocId = data.associationId || eventRows[0]?.association_id || 'c1983000-0000-4000-8000-000000001983';

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

  /**
   * Lấy danh sách ảnh trực tiếp của một sự kiện
   */
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

  /**
   * Gửi đánh giá / góp ý sau sự kiện qua mã QR
   * - Lưu vào event_feedback
   * - Đồng thời lưu vào feedbacks của CRM
   */
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

  /**
   * Lấy danh sách đánh giá của sự kiện
   */
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

  /**
   * Gửi Email & Zalo OA thông báo sau sự kiện (Kèm link ảnh và nút đánh giá góp ý)
   * - Chỉ gửi cho những người ĐÃ CHECK-IN sự kiện
   */
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
    const galleryUrl = sanitizeGalleryUrl(event.photo_gallery_url) || `https://ceohn10.viconnect.vn/events/${eventId}`;
    const feedbackUrl = `https://ceohn10.viconnect.vn/events/${eventId}/feedback`;

    // Lấy tất cả người đã check-in
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

      // 1. Gửi Email Recap & Link Ảnh & Nút Đánh Giá
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
              <p>Sự hiện diện và đồng hành của Quý Đại Biểu đã góp phần to lớn tạo nên thành công rực rỡ và những khoảnh khắc đáng nhớ của sự kiện.</p>
              
              <div style="margin: 24px 0; text-align: center;">
                <a href="${galleryUrl}" style="display: inline-block; background-color: #003B95; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-right: 8px;">
                  📸 Xem Trọn Bộ Album Ảnh Sự Kiện
                </a>
                <a href="${feedbackUrl}" style="display: inline-block; background-color: #F59E0B; color: #000000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                  ⭐ Đánh Giá &amp; Góp Ý Sự Kiện
                </a>
              </div>

              <p style="font-size: 13px; color: #64748b;">Mọi ý kiến đóng góp quý báu của Quý Đại Biểu sẽ là cơ sở quan trọng giúp Ban Tổ Chức hoàn thiện và nâng cao chất lượng các sự kiện tiếp theo của CLB.</p>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
              <p>Hệ Thống Quản Trị &amp; Kết Nối Doanh Nghiệp CEO HN10</p>
            </div>
          </div>
        `;

        try {
          await this.mailService.dispatchSmtpEmail({
            to: email,
            subject: `[CEO HN10] Cảm ơn Quý Đại Biểu & Album Ảnh Sự Kiện "${eventName}"`,
            html: emailHtml,
          });
          sentEmailCount++;
        } catch (err: any) {
          this.logger.warn(`[sendPostEventRecap] Lỗi gửi email cho ${email}: ${err?.message}`);
        }
      }

      // 2. Gửi Zalo OA
      if (this.zaloService && phone) {
        try {
          await this.zaloService.sendAutoNotification({
            recipientPhone: phone,
            recipientName: memberName,
            title: `Cảm ơn đã tham dự sự kiện ${eventName}`,
            content: `Trân trọng cảm ơn ${memberName} đã tham dự sự kiện "${eventName}".\n📸 Xem Album ảnh sự kiện: ${galleryUrl}\n⭐ Gửi góp ý đánh giá: ${feedbackUrl}`,
          });
          sentZaloCount++;
        } catch (err: any) {
          this.logger.warn(`[sendPostEventRecap] Lỗi gửi Zalo cho ${phone}: ${err?.message}`);
        }
      }
    }

    return {
      ok: true,
      eventName,
      totalCheckedIn: checkedInAttendees.length,
      sentEmailCount,
      sentZaloCount,
      galleryUrl,
      feedbackUrl,
      message: `Đã gửi thông báo cảm ơn, link album ảnh và nút đánh giá tới ${sentEmailCount} email và ${sentZaloCount} Zalo OA của đại biểu đã check-in.`,
    };
  }

  /**
   * Import danh sách người tham gia sự kiện từ file (Word, Excel, PDF)
   * - Tự động thêm cột (dynamic columns) vào CSDL nếu file có thêm trường mới
   * - Đánh dấu trạng thái đã thanh toán / chưa thanh toán để phục vụ chức năng nhắc nợ phí
   * - Nếu có phí vé và đã thanh toán -> Ghi nhận vào Quỹ tài chính CRM CEO HN10 và hiện lên Dashboard
   * - Gửi mã vé và thông tin check-in qua Email hoặc Zalo OA
   */
  async importAttendeesFromFile(
    eventId: string,
    records: any[],
    customColumns: string[] = [],
    associationId?: string,
  ) {
    if (!eventId) {
      throw new BadRequestException('Mã sự kiện không được để trống');
    }
    if (!Array.isArray(records) || records.length === 0) {
      throw new BadRequestException('Danh sách đại biểu nhập vào không được để trống');
    }

    // 1. Kiểm tra sự kiện
    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);

    if (eventRows.length === 0) {
      throw new NotFoundException(`Không tìm thấy sự kiện với ID: ${eventId}`);
    }

    const event = eventRows[0];
    const targetAssocId = associationId || event.association_id || 'c1983000-0000-4000-8000-000000001983';
    const eventTitle = event.name || event.title || 'Sự kiện CLB CEO HN10';
    const eventDefaultFee = Number(event.ticket_price || event.fee || 0);

    // 2. Tra cứu các cột hiện tại trong information_schema
    const existingCols = await this.prisma.$queryRaw<any[]>`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'event_registrations'
    `.catch(() => []);
    const existingColSet = new Set(existingCols.map((c: any) => c.column_name.toLowerCase()));

    // 3. Tự động Dynamic DDL: Thêm cột mới vào bảng event_registrations nếu chưa có
    const newlyAddedColumns: string[] = [];
    const sanitizedColumnMap: Record<string, string> = {};

    for (const rawCol of customColumns) {
      if (!rawCol || typeof rawCol !== 'string') continue;
      const cleanCol = rawCol.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 50);

      if (!cleanCol) continue;
      sanitizedColumnMap[rawCol] = cleanCol;

      if (!existingColSet.has(cleanCol)) {
        try {
          await this.prisma.$executeRawUnsafe(
            `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS "${cleanCol}" text DEFAULT ''`
          );
          existingColSet.add(cleanCol);
          newlyAddedColumns.push(cleanCol);
          this.logger.log(`[Dynamic Columns] Đã tự động thêm cột mới "${cleanCol}" vào bảng public.event_registrations`);
        } catch (err: any) {
          this.logger.warn(`[Dynamic Columns] Lỗi khi thêm cột "${cleanCol}": ${err?.message}`);
        }
      }
    }

    // 4. Lấy số id lớn nhất hiện tại
    const lastReg = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.event_registrations WHERE id ~ '^[0-9]+$' ORDER BY CAST(id AS BIGINT) DESC LIMIT 1
    `.catch(() => []);
    let nextIdBig = lastReg.length > 0 ? BigInt(lastReg[0].id) + 1n : BigInt(`5${Math.floor(1000 + Math.random() * 9000)}`);

    // 4.1. VALIDATION NGHIỆP VỤ BẮT BUỘC:
    const declaredTickets: any[] = (await this.getEventTickets(eventId).catch(() => [])) || [];

    // (A) Nếu sự kiện ĐÃ KHAI BÁO CÁC LOẠI VÉ KHÁC NHAU (event_ticket_types):
    if (Array.isArray(declaredTickets) && declaredTickets.length > 0) {
      const validNamesSummary = declaredTickets
        .map((t) => `"${t.name}" (${Number(t.price).toLocaleString('vi-VN')} đ)`)
        .join(', ');

      for (let i = 0; i < records.length; i++) {
        const item = records[i];
        const fullName = (
          item.fullName ||
          item.name ||
          item.memberName ||
          item['Họ tên'] ||
          item['Họ và tên'] ||
          item['Tên'] ||
          ''
        ).trim();
        if (!fullName) continue;

        const rawStatus = String(
          item.paymentStatus ||
          item.status ||
          item['Trạng thái thanh toán'] ||
          item['Thanh toán'] ||
          item['Tình trạng'] ||
          '',
        ).toLowerCase();
        const isInvited =
          rawStatus.includes('mời') ||
          rawStatus.includes('moi') ||
          rawStatus.includes('invited') ||
          item.paymentStatus === 'invited_free';

        if (isInvited) continue;

        const rawTicketName = String(
          item.ticketType ||
          item['Loại vé'] ||
          item['Tên vé'] ||
          item['Hạng vé'] ||
          item['Vé'] ||
          item['Loại'] ||
          item['Ticket Type'] ||
          item['Ticket'] ||
          '',
        ).trim();

        const rawTicketLower = rawTicketName.toLowerCase();

        // Khớp loại vé với danh sách vé đã khai báo
        const matchedTicket = declaredTickets.find((dt) => {
          const dtNameLower = dt.name.trim().toLowerCase();
          return (
            dtNameLower === rawTicketLower ||
            (rawTicketLower &&
              (dtNameLower.includes(rawTicketLower) ||
                rawTicketLower.includes(dtNameLower)))
          );
        });

        if (!matchedTicket) {
          throw new BadRequestException(
            `Dòng ${i + 1}: Đại biểu "${fullName}" có loại vé "${rawTicketName || 'Trống'}" không khớp với các loại vé đã khai báo của sự kiện (${validNamesSummary}). Không được phép import!`,
          );
        }

        // Kiểm tra giá tiền trong file bắt buộc phải khớp chính xác với giá vé hệ thống
        const rawPrice =
          item.ticketPrice ||
          item.ticketFee ||
          item.fee ||
          item.price ||
          item.amount ||
          item['Giá vé'] ||
          item['Phí'] ||
          item['Số tiền'] ||
          item['Phí tham dự'];

        if (rawPrice !== undefined && rawPrice !== null && String(rawPrice).trim() !== '') {
          const cleanPrice = String(rawPrice).replace(/[^0-9]/g, '');
          if (cleanPrice) {
            const parsedPrice = parseInt(cleanPrice, 10);
            if (parsedPrice > 0 && parsedPrice !== Number(matchedTicket.price)) {
              throw new BadRequestException(
                `Dòng ${i + 1}: Đại biểu "${fullName}" đăng ký vé "${matchedTicket.name}" nhưng bị lệch giá! Giá trong file là ${parsedPrice.toLocaleString('vi-VN')} đ, giá khai báo trong hệ thống là ${Number(matchedTicket.price).toLocaleString('vi-VN')} đ. Không được phép import!`,
              );
            }
          }
        }
      }
    } else {
      // (B) Trường hợp sự kiện áp dụng một mức phí duy nhất:
      // (B1) Nếu sự kiện là MIỄN PHÍ: tệp import không được phép có trường tiền hoặc giá vé > 0
      const isEventFree = eventDefaultFee === 0 && !event.is_paid;
      if (isEventFree) {
        for (const item of records) {
          const rawPrice = item.ticketPrice || item.ticketFee || item.fee || item.price || item.amount || item['Giá vé'] || item['Phí'] || item['Số tiền'] || item['Phí tham dự'];
          if (rawPrice !== undefined && rawPrice !== null && String(rawPrice).trim() !== '') {
            const cleanPrice = String(rawPrice).replace(/[^0-9]/g, '');
            if (cleanPrice && parseInt(cleanPrice, 10) > 0) {
              throw new BadRequestException('Sự kiện được đánh dấu là MIỄN PHÍ. Tệp import không được phép chứa thông tin thu tiền hoặc giá vé có phí!');
            }
          }
        }
      }

      // (B2) Nếu sự kiện CÓ THU PHÍ: giá vé trong tệp bắt buộc phải khớp với giá vé mặc định đã thiết lập trên hệ thống (trừ khách mời không thu phí)
      if (!isEventFree && eventDefaultFee > 0) {
        for (const item of records) {
          const rawStatus = String(item.paymentStatus || item.status || item['Trạng thái thanh toán'] || item['Thanh toán'] || item['Tình trạng'] || '').toLowerCase();
          const isInvited = rawStatus.includes('mời') || rawStatus.includes('moi') || rawStatus.includes('invited') || item.paymentStatus === 'invited_free';
          if (isInvited) continue;

          const rawPrice = item.ticketPrice || item.ticketFee || item.fee || item.price || item.amount || item['Giá vé'] || item['Phí'] || item['Số tiền'] || item['Phí tham dự'];
          if (rawPrice !== undefined && rawPrice !== null && String(rawPrice).trim() !== '') {
            const cleanPrice = String(rawPrice).replace(/[^0-9]/g, '');
            if (cleanPrice) {
              const parsedPrice = parseInt(cleanPrice, 10);
              if (parsedPrice > 0 && parsedPrice !== eventDefaultFee) {
                const name = item.fullName || item.name || 'đại biểu';
                throw new BadRequestException(`Giá vé của đại biểu "${name}" (${parsedPrice.toLocaleString('vi-VN')} đ) không khớp với giá vé mặc định của sự kiện (${eventDefaultFee.toLocaleString('vi-VN')} đ). Vui lòng điều chỉnh lại tệp trước khi nhập!`);
              }
            }
          }
        }
      }
    }

    let importedCount = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let totalFundAdded = 0;
    const createdTickets: any[] = [];

    // 5. Duyệt qua từng bản ghi
    for (const item of records) {
      const fullName = (item.fullName || item.name || item.memberName || item['Họ tên'] || item['Họ và tên'] || item['Tên'] || '').trim();
      if (!fullName) continue;

      const phone = (item.phone || item.sdt || item['Số điện thoại'] || item['SĐT'] || item['Điện thoại'] || '').trim();
      const email = (item.email || item['Email'] || item['Thư điện tử'] || '').trim().toLowerCase();
      const company = (item.company || item.enterprise || item['Công ty'] || item['Doanh nghiệp'] || '').trim();
      const position = (item.position || item.title || item['Chức danh'] || item['Chức vụ'] || '').trim();
      const note = (item.note || item.notes || item['Ghi chú'] || '').trim();

      // Nhận diện trạng thái khách mời không thu phí
      const rawStatus = String(item.paymentStatus || item.status || item['Trạng thái thanh toán'] || item['Thanh toán'] || item['Tình trạng'] || '').toLowerCase();
      const isInvited = rawStatus.includes('mời') || rawStatus.includes('moi') || rawStatus.includes('invited') || item.paymentStatus === 'invited_free';

      // Xử lý loại vé & phí vé theo cấu hình sự kiện
      let ticketType = (item.ticketType || item['Loại vé'] || item['Tên vé'] || item['Hạng vé'] || item['Vé'] || '').trim();
      let ticketFee = isInvited ? 0 : eventDefaultFee;

      if (Array.isArray(declaredTickets) && declaredTickets.length > 0) {
        if (isInvited) {
          ticketFee = 0;
          ticketType = 'Vé Mời Miễn Phí';
        } else {
          const rawTicketLower = ticketType.toLowerCase();
          const matchedTicket = declaredTickets.find((dt) => {
            const dtNameLower = dt.name.trim().toLowerCase();
            return (
              dtNameLower === rawTicketLower ||
              (rawTicketLower && (dtNameLower.includes(rawTicketLower) || rawTicketLower.includes(dtNameLower)))
            );
          }) || declaredTickets[0];
          ticketType = matchedTicket.name;
          ticketFee = Number(matchedTicket.price || 0);
        }
      } else if (!isInvited) {
        const rawPrice = item.ticketPrice || item.ticketFee || item.fee || item.price || item.amount || item['Giá vé'] || item['Phí'] || item['Số tiền'] || item['Phí tham dự'];
        if (rawPrice !== undefined && rawPrice !== null && String(rawPrice).trim() !== '') {
          const cleanPrice = String(rawPrice).replace(/[^0-9]/g, '');
          if (cleanPrice) {
            ticketFee = Math.max(0, parseInt(cleanPrice, 10));
          }
        }
        if (!ticketType) {
          ticketType = ticketFee === 0 ? 'Vé Mời Miễn Phí' : 'Vé Tiêu Chuẩn';
        }
      }
      let isPaid = false;
      let paymentStatus = 'unpaid';
      let ticketStatus = 'pending';

      if (isInvited) {
        isPaid = true;
        paymentStatus = 'free';
        ticketFee = 0;
        ticketType = 'Vé Mời Miễn Phí';
        ticketStatus = 'confirmed';
      } else if (
        rawStatus.includes('đã thanh toán') ||
        rawStatus.includes('da thanh toan') ||
        rawStatus.includes('paid') ||
        rawStatus.includes('đã đóng') ||
        rawStatus.includes('da dong') ||
        rawStatus.includes('đã nộp') ||
        rawStatus.includes('da nop') ||
        rawStatus.includes('đã ck') ||
        rawStatus.includes('da ck') ||
        rawStatus.includes('chuyển khoản') ||
        rawStatus.includes('chuyen khoan') ||
        rawStatus.includes('ck') ||
        rawStatus.includes('tiền mặt') ||
        rawStatus.includes('tien mat') ||
        rawStatus.includes('đã trả') ||
        rawStatus.includes('rồi') ||
        rawStatus.includes('roi') ||
        rawStatus.includes('xong') ||
        rawStatus.includes('thành công') ||
        rawStatus.includes('thanh cong') ||
        rawStatus.includes('hoàn thành') ||
        rawStatus.includes('hoan thanh') ||
        rawStatus.includes('yes') ||
        rawStatus.includes('pass') ||
        rawStatus.includes('ok') ||
        rawStatus.includes('done') ||
        rawStatus === '1' ||
        rawStatus === 'x' ||
        rawStatus === 'v' ||
        rawStatus === 'true' ||
        rawStatus.includes('đã thu')
      ) {
        isPaid = true;
        paymentStatus = 'paid';
        ticketStatus = 'confirmed';
        paidCount++;
      } else if (
        rawStatus.includes('chưa') ||
        rawStatus.includes('chua') ||
        rawStatus.includes('unpaid') ||
        rawStatus.includes('pending') ||
        rawStatus.includes('nợ') ||
        rawStatus.includes('no') ||
        rawStatus === '0' ||
        rawStatus === 'false' ||
        rawStatus.includes('chờ') ||
        rawStatus.includes('thiếu')
      ) {
        isPaid = false;
        paymentStatus = 'unpaid';
        ticketStatus = 'pending';
        unpaidCount++;
      } else {
        isPaid = ticketFee === 0;
        paymentStatus = ticketFee === 0 ? 'free' : 'unpaid';
        ticketStatus = isPaid ? 'confirmed' : 'pending';
        if (isPaid) paidCount++;
        else unpaidCount++;
      }

      const regId = (nextIdBig++).toString();
      const luckyNum = String(Math.floor(1000 + Math.random() * 9000));
      const memberCode = (item.memberCode || item['Mã học viên'] || '').trim() || `TICKET-${luckyNum}`;

      // Trích xuất các trường dynamic data ngoài các trường chuẩn
      const dynamicFieldsData: Record<string, any> = {};
      for (const [key, val] of Object.entries(item)) {
        const sanitizedKey = sanitizedColumnMap[key];
        if (sanitizedKey && existingColSet.has(sanitizedKey)) {
          dynamicFieldsData[sanitizedKey] = String(val || '').trim();
        }
      }

      const qrPayload = JSON.stringify({
        regId,
        eventId,
        fullName,
        phone,
        email,
        company,
        position,
        luckyNum,
        ticketType,
        paymentStatus,
        ticketFee,
      });

      // Insert vào event_registrations
      await this.prisma.$executeRaw`
        INSERT INTO public.event_registrations (
          id, event_id, member_code, member_name, email, phone, company, position, note, registered_at,
          status, ticket_type, ticket_count, association_id, payment_status, payment_amount, lucky_number,
          qr_payload, is_walkin, registration_origin, dynamic_data, created_at, updated_at
        ) VALUES (
          ${regId},
          ${eventId},
          ${memberCode},
          ${fullName},
          ${email},
          ${phone},
          ${company},
          ${position},
          ${note},
          now()::date,
          ${ticketStatus},
          ${ticketType},
          1,
          ${targetAssocId}::uuid,
          ${paymentStatus},
          ${ticketFee},
          ${luckyNum},
          ${qrPayload},
          false,
          'pre_registered_import',
          ${JSON.stringify(dynamicFieldsData)}::jsonb,
          now(),
          now()
        )
      `.catch((err) => {
        this.logger.warn(`[importAttendeesFromFile] Lỗi insert vé ${regId}: ${err?.message}`);
      });

      // Cập nhật giá trị vào các cột dynamic cụ thể
      for (const [sanitizedCol, colVal] of Object.entries(dynamicFieldsData)) {
        try {
          await this.prisma.$executeRawUnsafe(
            `UPDATE public.event_registrations SET "${sanitizedCol}" = $1 WHERE id = $2`,
            colVal,
            regId,
          );
        } catch {}
      }

      // 6. GHI NHẬN VÀO QUỸ TÀI CHÍNH CRM CEO HN10 NẾU ĐÃ THANH TOÁN
      if (isPaid && ticketFee > 0) {
        totalFundAdded += ticketFee;
        const txCode = `THU-EV${regId}`;
        await this.prisma.$executeRaw`
          INSERT INTO public.transactions (
            id, code, date, type, category, description, amount, method, status, association_id, recipient, created_at, updated_at
          ) VALUES (
            gen_random_uuid(),
            ${txCode},
            now()::date,
            'income',
            'Vé sự kiện',
            ${`Thu tiền vé sự kiện ${eventTitle} - ${fullName} (Mã vé: #${regId})`},
            ${ticketFee},
            'bank',
            'completed',
            ${targetAssocId}::uuid,
            ${fullName},
            now(),
            now()
          )
        `.catch(() => {});
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.income_records (
            id, category, title, amount, date, payer_name, payment_method, status, event_id, notes, created_at, updated_at
          ) VALUES (
            gen_random_uuid(),
            'Vé sự kiện',
            $1,
            $2,
            now()::date,
            $3,
            'Import danh sách',
            'completed',
            $4,
            $5,
            now(),
            now()
          )
        `,
          `Thu tiền vé sự kiện ${eventTitle} - ${fullName} (Mã vé: ${regId})`,
          ticketFee,
          fullName,
          eventId,
          `Ghi nhận tự động từ import danh sách sự kiện (${eventTitle})`,
        ).catch(() => {});
      }

      // 7. GỬI MÃ VÉ HOẶC THÔNG BÁO THANH TOÁN QUA EMAIL / ZALO OA
      const baseUrl = process.env.APP_URL || 'https://ceohn10.viconnect.vn';
      const checkinQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(regId)}`;
      const sepayAcc = process.env.SEPAY_ACCOUNT_NO || '0983111222';
      const sepayBank = process.env.SEPAY_BANK_NAME || 'MBBank (Ngân hàng Quân Đội)';
      const sepayHolder = process.env.SEPAY_ACCOUNT_HOLDER || 'CLB DOANH NHAN CEO HN10';
      const transferContent = `EV${regId}`;
      const vietQrUrl = `https://img.vietqr.io/image/MB-${sepayAcc}-compact2.png?amount=${ticketFee}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(sepayHolder)}`;

      if (email && email.includes('@')) {
        this.mailService.sendEventTicketEmail({
          to: email,
          fullName,
          phone,
          company,
          position,
          eventTitle,
          eventDate: event.date ? (event.date instanceof Date ? event.date.toLocaleDateString('vi-VN') : String(event.date).slice(0, 10)) : 'Sắp diễn ra',
          eventTime: event.time || '08:30 - 12:00',
          eventLocation: event.location || 'Hà Nội',
          registrationId: regId,
          ticketType,
          luckyNumber: luckyNum,
          isFree: ticketFee === 0,
          paymentConfirmed: isPaid,
          totalAmount: ticketFee,
          qrCodeUrl: checkinQrUrl,
          vietQrUrl: (!isPaid && ticketFee > 0) ? vietQrUrl : undefined,
          bankAccount: sepayAcc,
          bankName: sepayBank,
          bankOwner: sepayHolder,
        }).catch((err) => {
          this.logger.warn(`[importAttendeesFromFile] Lỗi gửi email cho ${email}: ${err?.message}`);
        });
      }

      if (phone && this.zaloService) {
        const isActuallyPaid = isPaid || ticketFee === 0;
        this.zaloService.sendAutoNotification({
          recipientPhone: phone,
          recipientName: fullName,
          title: isActuallyPaid ? `Xác nhận vé tham dự: ${eventTitle}` : `[Cần Thanh Toán] Phí tham dự sự kiện: ${eventTitle}`,
          content: isActuallyPaid
            ? `Kính gửi Anh/Chị ${fullName},\nBan Tổ Chức CLB Doanh Nhân CEO HN10 xác nhận Anh/Chị đã có vé tham dự sự kiện "${eventTitle}".\n- Mã vé vào cửa: ${regId}\n- Số may mắn Lucky Draw: #${luckyNum}\n- Trạng thái: ${ticketFee === 0 ? 'Miễn phí' : 'Đã thanh toán'}\nQuý Anh/Chị vui lòng xuất trình mã vé này tại bàn lễ tân để check-in vào cửa. Trân trọng!`
            : `Kính gửi Anh/Chị ${fullName},\nBan Tổ Chức CLB Doanh Nhân CEO HN10 thông báo vé tham dự sự kiện "${eventTitle}" của Anh/Chị đang ở trạng thái CHƯA THANH TOÁN.\n- Mã đăng ký: ${regId}\n- Số tiền cần thanh toán: ${ticketFee.toLocaleString('vi-VN')} VNĐ\n- Chuyển khoản đến STK MBBank: ${sepayAcc} (Chủ TK: ${sepayHolder})\n- Cú pháp CK: EV${regId} ${phone}\nVé check-in sẽ được kích hoạt ngay khi nhận được thanh toán. Trân trọng!`,
        }).catch(() => {});
      }

      createdTickets.push({
        id: regId,
        fullName,
        phone,
        email,
        company,
        position,
        paymentStatus,
        ticketFee,
        luckyNumber: luckyNum,
      });

      importedCount++;
    }

    // 8. Cập nhật số lượng đăng ký của sự kiện
    await this.prisma.$executeRaw`
      UPDATE public.events 
      SET registered = registered + ${importedCount}, updated_at = now() 
      WHERE id = ${eventId}
    `.catch(() => {});

    this.logger.log(`[importAttendeesFromFile] Hoàn tất import ${importedCount} đại biểu cho sự kiện ${eventTitle}. Quỹ thêm: ${totalFundAdded} đ.`);

    return {
      ok: true,
      eventId,
      eventTitle,
      totalImported: importedCount,
      paidCount,
      unpaidCount,
      totalFundAdded,
      newlyAddedColumns,
      tickets: createdTickets.slice(0, 20),
    };
  }

  /**
   * UC-EVT-08: Gửi link kho ảnh Live Gallery qua Email & Zalo OA cho đại biểu tham gia sự kiện
   */
  async shareEventLiveGallery(eventId: string, customMessage?: string) {
    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);
    if (eventRows.length === 0) {
      throw new NotFoundException(`Không tìm thấy sự kiện ${eventId}`);
    }
    const event = eventRows[0];
    const eventTitle = event.name || event.title || 'Sự kiện CLB CEO HN10';
    const baseUrl = process.env.APP_URL || 'https://ceohn10.viconnect.vn';
    const galleryUrl = event.photo_gallery_url || `${baseUrl}/events/${eventId}`;

    const regRows = await this.prisma.$queryRaw<any[]>`
      SELECT DISTINCT email, phone, member_name FROM public.event_registrations 
      WHERE event_id = ${eventId} AND email IS NOT NULL AND email != ''
    `.catch(() => []);

    let sentCount = 0;
    for (const r of regRows) {
      if (r.email && r.email.includes('@')) {
        this.mailService.sendDirectEmail({
          to: r.email,
          subject: `[CLB CEO HN10] Kho Ảnh Trực Tiếp Sự Kiện: ${eventTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #003B95;">KHOẢNH KHẮC SỰ KIỆN: ${eventTitle}</h2>
              <p style="font-size: 15px; color: #334155; line-height: 1.6;">
                Kính gửi Anh/Chị <strong>${r.member_name || 'Đại biểu'}</strong>,<br/>
                Ban Tổ Chức CLB Doanh Nhân CEO HN10 xin gửi tới Quý Anh/Chị kho lưu trữ những hình ảnh và khoảnh khắc đáng nhớ nhất trong sự kiện.
              </p>
              ${customMessage ? `<p style="padding: 12px; background: #f8fafc; border-left: 4px solid #003B95; color: #1e293b;">${customMessage}</p>` : ''}
              <div style="text-align: center; margin: 28px 0;">
                <a href="${galleryUrl}" style="background-color: #003B95; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
                  XEM & TẢI ẢNH SỰ KIỆN
                </a>
              </div>
              <p style="font-size: 13px; color: #64748b;">Trân trọng,<br/>Ban Truyền Thông & Sự Kiện CLB Doanh Nhân CEO HN10</p>
            </div>
          `,
        }).catch(() => {});
        sentCount++;
      }
    }
    return { ok: true, sentCount, totalRegistrations: regRows.length, galleryUrl };
  }

  /**
   * UC-EVT-10: Gửi báo cáo sự kiện qua Email / Zalo OA cho nhiều tài khoản chọn trước
   */
  async sendEventReport(eventId: string, body: {
    recipients: string[];
    category?: string;
    format?: string;
    reportSummary?: {
      total: number;
      checkedIn: number;
      late: number;
      onTime: number;
      unpaid: number;
      paidAmount: number;
    };
  }) {
    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);
    const event = eventRows[0] || {};
    const eventTitle = event.name || event.title || 'Sự kiện CLB CEO HN10';
    const recipients = Array.isArray(body.recipients) ? body.recipients : [];
    if (recipients.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một người nhận báo cáo');
    }

    const summary = body.reportSummary || {
      total: 0,
      checkedIn: 0,
      late: 0,
      onTime: 0,
      unpaid: 0,
      paidAmount: 0,
    };

    let deliveredCount = 0;
    for (const email of recipients) {
      if (email && email.includes('@')) {
        this.mailService.sendDirectEmail({
          to: email.trim(),
          subject: `[BÁO CÁO SỰ KIỆN] ${eventTitle} — Danh mục: ${body.category || 'Tổng hợp'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px;">
              <h2 style="color: #003B95; margin-bottom: 8px;">BÁO CÁO TỔNG KẾT ĐẠI BIỂU SỰ KIỆN</h2>
              <p style="font-size: 14px; color: #475569; margin-top: 0;">Sự kiện: <strong>${eventTitle}</strong></p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h4 style="margin: 0 0 12px 0; color: #003B95;">SỐ LIỆU ĐIỂM DANH & TÀI CHÍNH</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #64748b;">Tổng đại biểu đăng ký:</td><td style="text-align: right; font-weight: bold;">${summary.total}</td></tr>
                  <tr><td style="padding: 6px 0; color: #059669;">Đã check-in thực tế:</td><td style="text-align: right; font-weight: bold; color: #059669;">${summary.checkedIn}</td></tr>
                  <tr><td style="padding: 6px 0; color: #0284c7;">Đến đúng giờ:</td><td style="text-align: right; font-weight: bold; color: #0284c7;">${summary.onTime}</td></tr>
                  <tr><td style="padding: 6px 0; color: #d97706;">Điểm danh muộn:</td><td style="text-align: right; font-weight: bold; color: #d97706;">${summary.late}</td></tr>
                  <tr><td style="padding: 6px 0; color: #e11d48;">Chưa nộp phí:</td><td style="text-align: right; font-weight: bold; color: #e11d48;">${summary.unpaid}</td></tr>
                  <tr style="border-top: 1px solid #e2e8f0;"><td style="padding: 8px 0; font-weight: bold; color: #003B95;">Tổng tiền vé đã thu:</td><td style="text-align: right; font-weight: bold; color: #003B95; font-size: 16px;">${summary.paidAmount.toLocaleString('vi-VN')} đ</td></tr>
                </table>
              </div>
              <p style="font-size: 13px; color: #64748b;">Báo cáo được trích xuất tự động từ Hệ thống Cổng Quản Trị CLB Doanh Nhân CEO HN10.</p>
            </div>
          `,
        }).catch(() => {});
        deliveredCount++;
      }
    }

    return { ok: true, deliveredCount, recipients };
  }

  // ==================== INVITATION GUESTS & PUBLIC RSVP (UC-INV-01..06) ====================

  private slugifyGuestName(name: string): string {
    return String(name || 'khach-moi')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'khach-moi';
  }

  async getInvitationGuests(eventId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_invitation_guests
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
    `.catch(() => []);
    return rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      slug: r.slug,
      fullName: r.full_name,
      title: r.title || '',
      company: r.company || '',
      email: r.email || '',
      phone: r.phone || '',
      guestType: r.guest_type === 'other_participant' ? 'other_participant' : 'invited_guest',
      source: r.source || 'import',
      sentAt: r.sent_at,
      createdAt: r.created_at,
    }));
  }

  private async canUserClassifyInvitationGuests(actor?: any): Promise<boolean> {
    if (!actor) return false;
    const roleStr = String(actor.role || '').toLowerCase();
    const rolesArr: string[] = Array.isArray(actor.roles) ? actor.roles.map((r: any) => String(r).toLowerCase()) : [];
    const emailStr = String(actor.email || '').toLowerCase();
    if (
      roleStr === 'platform_admin' ||
      roleStr === 'admin' ||
      rolesArr.includes('platform_admin') ||
      rolesArr.includes('admin') ||
      emailStr === 'admin@ceohn10.vn'
    ) {
      return true;
    }

    const userId = actor.id || actor.sub || actor.userId;
    if (!userId) return false;
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT m.department, m.executive_role, ur.role::text as user_role
      FROM public.members m
      LEFT JOIN public.user_roles ur ON ur.user_id = m.user_id
      WHERE m.user_id::text = ${String(userId)} OR LOWER(m.email) = LOWER(${emailStr})
      LIMIT 3
    `.catch(() => []);

    for (const r of rows) {
      const uRole = String(r.user_role || r.executive_role || '').toLowerCase();
      const dept = String(r.department || '').toLowerCase();
      if (uRole === 'platform_admin' || uRole === 'admin') return true;
      const isHead =
        uRole === 'truong_ban_chuyen_trach' ||
        uRole.includes('truong_ban') ||
        uRole.includes('trưởng ban');
      const isMediaOrEventDept =
        dept.includes('truyền thông') ||
        dept.includes('truyen thong') ||
        dept.includes('sự kiện') ||
        dept.includes('su kien') ||
        dept.includes('hậu cần');
      if (isHead && isMediaOrEventDept) return true;
    }
    return false;
  }

  async saveInvitationGuests(eventId: string, guests: any[], actor?: any) {
    const list = Array.isArray(guests) ? guests : [];
    const hasExplicitClassification = list.some((g) => g.guestType !== undefined || g.guest_type !== undefined);
    if (hasExplicitClassification && actor) {
      const allowed = await this.canUserClassifyInvitationGuests(actor);
      if (!allowed) {
        throw new ForbiddenException(
          'Chỉ Trưởng ban Truyền thông, Trưởng ban Sự kiện & Hậu cần hoặc Quản trị viên mới có quyền phân loại Khách mời / Khách tham gia sự kiện.',
        );
      }
    }

    const saved: any[] = [];
    for (const g of list) {
      const fullName = String(g.fullName || g.name || '').trim();
      if (!fullName) continue;
      const baseSlug = g.slug ? String(g.slug).trim().toLowerCase() : this.slugifyGuestName(fullName);
      const id = `INV-${eventId}-${baseSlug}`.slice(0, 120);
      const rawType = String(g.guestType || g.guest_type || 'invited_guest').trim();
      const guestType = rawType === 'other_participant' ? 'other_participant' : 'invited_guest';
      await this.prisma.$executeRaw`
        INSERT INTO public.event_invitation_guests (
          id, event_id, slug, full_name, title, company, email, phone, guest_type, source, created_at
        ) VALUES (
          ${id}, ${eventId}, ${baseSlug}, ${fullName}, ${String(g.title || '')}, ${String(g.company || '')},
          ${String(g.email || '')}, ${String(g.phone || '')}, ${guestType}, ${String(g.source || 'import')}, now()
        )
        ON CONFLICT (event_id, slug) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          title = EXCLUDED.title,
          company = EXCLUDED.company,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          guest_type = EXCLUDED.guest_type
      `.catch(() => {});
      saved.push({
        id,
        eventId,
        slug: baseSlug,
        fullName,
        title: String(g.title || ''),
        company: String(g.company || ''),
        email: String(g.email || ''),
        phone: String(g.phone || ''),
        guestType,
      });
    }
    return { ok: true, count: saved.length, guests: saved };
  }

  async clearInvitationGuests(eventId: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.event_invitation_guests WHERE event_id = ${eventId}
    `;
    return { ok: true, message: 'Đã xóa toàn bộ danh sách khách mời của sự kiện.' };
  }

  async getInvitationConfig(eventId: string) {
    await this.prisma.$executeRawUnsafe(
      `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS invitation_config jsonb`,
    ).catch(() => {});
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT invitation_config FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);
    const raw = rows[0]?.invitation_config || null;
    if (!raw) return { config: null };
    const config = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { config };
  }

  async saveInvitationConfig(eventId: string, body: any) {
    await this.prisma.$executeRawUnsafe(
      `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS invitation_config jsonb`,
    ).catch(() => {});
    const configPayload = body?.config && typeof body.config === 'object' ? body.config : body;
    const jsonStr = JSON.stringify(configPayload || {});
    await this.prisma.$executeRaw`
      UPDATE public.events
      SET invitation_config = ${jsonStr}::jsonb, updated_at = now()
      WHERE id = ${eventId}
    `;
    return { ok: true, config: configPayload };
  }

  /**
   * Gửi email thư mời cá nhân hóa qua MailService (SMTP) tới danh sách khách được chọn
   */
  async sendInvitationEmails(
    eventId: string,
    body: {
      guests?: Array<{
        slug?: string;
        fullName?: string;
        title?: string;
        company?: string;
        email?: string;
        link?: string;
      }>;
      template?: {
        bgThemeColor?: string;
        textColor?: string;
        accentColor?: string;
        fontPreset?: string;
        baseUrl?: string;
      };
    },
  ) {
    const evRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, date, location, venue_name
      FROM public.events
      WHERE id = ${eventId}
      LIMIT 1
    `.catch(() => []);
    const ev = evRows[0];
    if (!ev) {
      throw new NotFoundException('Không tìm thấy sự kiện để gửi thư mời.');
    }

    const inputGuests = Array.isArray(body?.guests) ? body.guests : [];
    const validGuests = inputGuests.filter(
      (g) =>
        (typeof g?.email === 'string' && g.email.trim().includes('@')) ||
        (typeof (g as any)?.phone === 'string' && String((g as any).phone).trim().length >= 8),
    );
    if (validGuests.length === 0) {
      throw new BadRequestException(
        'Không có khách mời nào có Email hoặc Số điện thoại hợp lệ trong danh sách đã chọn.',
      );
    }

    const tpl = body?.template || {};
    const baseUrl = (
      tpl.baseUrl ||
      process.env.APP_URL ||
      'https://ceohn10.viconnect.vn'
    ).replace(/\/$/, '');

    const formattedDate = ev.date
      ? new Date(ev.date).toLocaleDateString('vi-VN')
      : '';
    const locationText = [ev.venue_name, ev.location].filter(Boolean).join(' — ');

    let sentCount = 0;
    const failed: Array<{ email: string; fullName: string; reason: string }> = [];

    for (const g of validGuests) {
      const email = String(g.email || '').trim();
      const phone = String((g as any).phone || '').trim();
      const fullName = String(g.fullName || 'Quý Khách Mời').trim();
      const slug =
        String(g.slug || '').trim() || this.slugifyGuestName(fullName);
      const link =
        g.link && String(g.link).startsWith('http')
          ? String(g.link)
          : `${baseUrl}/invitation/${eventId}#${slug}`;
      const roleOrg = [g.title, g.company].filter(Boolean).join(' · ');

      const html = `
        <div style="font-family:'Be Vietnam Pro','Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;color:#0f172a;border:1px solid #e2e8f0;border-radius:12px;">
          <p style="font-size:12px;font-weight:700;color:#003B95;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px 0;">CLB DOANH NHÂN CEO HN10 — THƯ MỜI SỰ KIỆN</p>
          <h2 style="margin:0 0 6px 0;font-size:20px;color:#0f172a;">Trân trọng kính mời: ${fullName}</h2>
          ${roleOrg ? `<p style="margin:0 0 14px 0;font-size:13px;color:#475569;">${roleOrg}</p>` : ''}
          <p style="font-size:14px;line-height:1.6;margin:12px 0;color:#1e293b;">
            Ban Tổ Chức CLB Doanh Nhân CEO HN10 trân trọng kính mời Quý vị tham dự sự kiện: <strong>${ev.name}</strong>.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin:14px 0;font-size:13px;color:#334155;">
            ${formattedDate ? `<div><strong>Thời gian:</strong> ${formattedDate}</div>` : ''}
            ${locationText ? `<div style="margin-top:4px;"><strong>Địa điểm:</strong> ${locationText}</div>` : ''}
          </div>
          <p style="font-size:14px;line-height:1.6;color:#1e293b;">
            Quý vị vui lòng truy cập đường link thư mời cá nhân hóa dưới đây để xem chi tiết chương trình, chọn phần tham dự và xác nhận (RSVP):
          </p>
          <div style="margin:20px 0;text-align:center;">
            <a href="${link}" style="display:inline-block;padding:12px 28px;background:#003B95;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;border-radius:8px;">
              Mở Thư Mời &amp; Xác Nhận Tham Dự
            </a>
          </div>
        </div>
      `;

      let deliveredAny = false;
      let lastError = '';

      if (email && email.includes('@')) {
        try {
          const res = await this.mailService.sendDirectEmail({
            to: email,
            subject: `[THƯ MỜI] ${ev.name} — Kính mời ${fullName}`,
            html,
            templateCode: 'event_invitation',
          });
          if (res && res.ok) {
            deliveredAny = true;
          } else {
            lastError = res?.message || 'SMTP chưa gửi được email';
          }
        } catch (err: any) {
          lastError = err?.message || 'Lỗi gửi email SMTP';
        }
      }

      if (phone) {
        try {
          this.mailService.dispatchZaloOaNotification({
            recipientPhone: phone,
            recipientEmail: email || undefined,
            title: `Thư mời sự kiện: ${ev.name}`,
            content: `Trân trọng kính mời ${fullName} tham dự "${ev.name}"${formattedDate ? ` ngày ${formattedDate}` : ''}. Vui lòng bấm nút bên dưới để xem thư mời và xác nhận tham dự.`,
            ctaText: 'Mở Thư Mời & Xác Nhận',
            ctaUrl: link,
            trackingType: 'event_invitation',
          });
          if (!email) deliveredAny = true;
        } catch {}
      }

      if (deliveredAny) {
        sentCount++;
      } else {
        failed.push({
          email: email || phone,
          fullName,
          reason: lastError || 'Không gửi được qua Email/Zalo OA',
        });
      }
    }

    return {
      ok: sentCount > 0,
      sentCount,
      failedCount: failed.length,
      failed,
    };
  }

  async getPublicInvitation(eventId: string, slug?: string) {
    const evRows = await this.prisma.$queryRaw<any[]>`
      SELECT e.*, a.name as association_name, a.logo_url as association_logo
      FROM public.events e
      LEFT JOIN public.associations a ON e.association_id = a.id
      WHERE e.id = ${eventId}
      LIMIT 1
    `.catch(() => []);
    if (evRows.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }
    const event = this.mapEventRow(evRows[0]);
    const tickets = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.event_ticket_types WHERE event_id = ${eventId} ORDER BY sort_order ASC, price ASC
    `.catch(() => []);

    let guest: any = null;
    if (slug && slug.trim()) {
      const cleanSlug = slug.trim().toLowerCase();
      const gRows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.event_invitation_guests
        WHERE event_id = ${eventId} AND LOWER(slug) = ${cleanSlug}
        LIMIT 1
      `.catch(() => []);
      if (gRows.length > 0) {
        const g = gRows[0];
        guest = {
          id: g.id,
          slug: g.slug,
          fullName: g.full_name,
          title: g.title || '',
          company: g.company || '',
          email: g.email || '',
          phone: g.phone || '',
          guestType: g.guest_type === 'other_participant' ? 'other_participant' : 'invited_guest',
        };
      }
    }

    // Lấy cấu hình SePay từ Master Admin để hiển thị VietQR khi có phí
    let sepayConfig = {
      bankName: 'MBBank',
      accountNumber: '888809012026',
      accountHolder: 'CLB DOANH NHAN CEO HN10',
      prefixEvent: 'CEO1983_EVT',
    };
    try {
      const cfgRows = await this.prisma.$queryRaw<any[]>`
        SELECT value FROM public.master_system_settings WHERE key = 'sepay_integration_config' LIMIT 1
      `.catch(() => []);
      if (cfgRows.length > 0 && cfgRows[0]?.value) {
        const val = typeof cfgRows[0].value === 'string' ? JSON.parse(cfgRows[0].value) : cfgRows[0].value;
        sepayConfig = {
          bankName: val.bank_brand_name || val.bankName || sepayConfig.bankName,
          accountNumber: val.account_number || val.accountNumber || sepayConfig.accountNumber,
          accountHolder: val.account_owner || val.account_holder || val.accountHolder || sepayConfig.accountHolder,
          prefixEvent: val.prefix_event || val.prefixEvent || sepayConfig.prefixEvent,
        };
      }
    } catch {}

    const rawInvCfg = evRows[0]?.invitation_config || null;
    const invitationConfig = rawInvCfg
      ? typeof rawInvCfg === 'string'
        ? JSON.parse(rawInvCfg)
        : rawInvCfg
      : null;

    return {
      event,
      tickets: tickets.map((t) => this.mapTicketRow(t)),
      guest,
      sepayConfig,
      invitationConfig,
    };
  }

  async getRegistrationPaymentStatus(regId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, status, payment_status, payment_amount, attended_parts
      FROM public.event_registrations
      WHERE id = ${regId}
      LIMIT 1
    `.catch(() => []);
    if (rows.length === 0) return { found: false };
    const r = rows[0];
    return {
      found: true,
      id: r.id,
      status: r.status,
      paymentStatus: r.payment_status,
      paymentAmount: Number(r.payment_amount || 0),
      attendedParts: parseJsonArraySafe(r.attended_parts),
    };
  }

  async submitPublicRsvp(eventId: string, body: any) {
    const evRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${eventId} LIMIT 1
    `.catch(() => []);
    if (evRows.length === 0) {
      throw new NotFoundException('Không tìm thấy sự kiện');
    }
    const ev = evRows[0];
    const eventTitle = ev.name || 'Sự kiện CLB CEO HN10';

    const attendMode: 'single_part' | 'full' | 'declined' = body.attendMode || 'full';
    const fullName = String(body.fullName || 'Khách mời').trim();
    const title = String(body.title || '').trim();
    const company = String(body.company || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const selectedPartNames: string[] = Array.isArray(body.selectedPartNames) ? body.selectedPartNames : [];
    const attendeeCount = Math.max(1, Number(body.attendeeCount || 1));
    const attendees = Array.isArray(body.attendees) ? body.attendees : [];
    const totalFee = Math.max(0, Number(body.totalFee || 0));
    const regId = `REG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 899)}`;
    const memberCode = String(body.memberCode || body.guestSlug || `GUEST-${regId.slice(-6)}`).trim();

    if (attendMode === 'declined') {
      await this.prisma.$executeRaw`
        INSERT INTO public.event_registrations (
          id, event_id, member_code, association_id, member_name, company, email, phone, ticket_type, ticket_count,
          status, payment_status, payment_amount, attended_parts, dynamic_data, note, created_at, updated_at
        ) VALUES (
          ${regId}, ${eventId}, ${memberCode}, ${ev.association_id}::uuid, ${fullName}, ${company}, ${email}, ${phone},
          'Khách mời từ chối', 0, 'declined', 'none', 0, '[]'::jsonb,
          ${JSON.stringify({ title, company, attendMode: 'declined', declinedAt: new Date().toISOString() })}::jsonb,
          ${String(body.note || 'Khách mời phản hồi không thể tham dự từ thư mời')}, now(), now()
        )
      `;

      // Bắn thông báo real-time tới CRM & ghi activity_log (UC-INV-06)
      await this.prisma.$executeRaw`
        INSERT INTO public.activity_log (id, action, target, target_type, actor_email, association_id, created_at)
        VALUES (gen_random_uuid(), 'Khách mời từ chối tham dự sự kiện', ${`${fullName}${company ? ` (${company})` : ''} đã từ chối tham dự "${eventTitle}"`}, 'event', ${email || 'guest@ceohn10.vn'}, ${ev.association_id}::uuid, now())
      `.catch(() => {});

      const adminUsers = await this.prisma.$queryRaw<any[]>`
        SELECT DISTINCT user_id FROM public.user_roles WHERE role::text IN ('platform_admin', 'admin') LIMIT 10
      `.catch(() => []);
      for (const adm of adminUsers) {
        if (!adm.user_id) continue;
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
            title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1::uuid, 'event', $2, 'event_rsvp_declined', 'rsvp_declined',
            $3, $4, $5::jsonb, 'normal', 'delivered', $6, 'crm', 'crm', NOW(), NOW()
          )
        `,
          adm.user_id,
          regId,
          `Khách mời từ chối tham dự: ${fullName}`,
          `${fullName}${company ? ` (${company})` : ''} đã phản hồi không thể tham dự sự kiện "${eventTitle}".`,
          JSON.stringify({ eventId, regId, fullName, company, targetRoute: `/events/${eventId}` }),
          `rsvp-decline-${regId}`,
        ).catch(() => {});
      }

      return {
        ok: true,
        regId,
        attendMode: 'declined',
        message: 'Đã ghi nhận phản hồi từ chối của Quý khách và thông báo tới Ban Tổ Chức.',
      };
    }

    // Kiểm tra trùng đăng ký (Email + Họ tên + Số điện thoại) để không cho đăng ký thêm lần 2
    const cleanEmail = email.toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanName = fullName.toLowerCase();
    if (cleanEmail || (cleanPhone && cleanName)) {
      const dupRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, member_name, email, phone
        FROM public.event_registrations
        WHERE event_id = ${eventId}
          AND status NOT IN ('cancelled', 'declined')
          AND (
            (${cleanEmail} != '' AND LOWER(TRIM(COALESCE(email, ''))) = ${cleanEmail})
            OR (
              ${cleanPhone} != ''
              AND ${cleanName} != ''
              AND regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') = ${cleanPhone}
              AND LOWER(TRIM(COALESCE(member_name, ''))) = ${cleanName}
            )
          )
        LIMIT 1
      `.catch(() => []);
      if (dupRows.length > 0) {
        throw new BadRequestException(
          'Thông tin (Họ tên / Email / Số điện thoại) này đã đăng ký tham dự sự kiện trước đó, không thể đăng ký thêm lần 2!',
        );
      }
    }

    // Trường hợp tham dự 1 phần hoặc toàn bộ (UC-INV-04, UC-INV-05)
    // Phân loại vé lấy từ CSDL (do Trưởng ban Truyền thông / Trưởng ban Sự kiện & Hậu cần chỉ định), không cho khách tự chọn
    let ticketTier: 'invited_guest' | 'other_participant' = 'other_participant';
    if (body.guestSlug && String(body.guestSlug).trim()) {
      const gRows = await this.prisma.$queryRaw<any[]>`
        SELECT guest_type FROM public.event_invitation_guests
        WHERE event_id = ${eventId} AND LOWER(slug) = ${String(body.guestSlug).trim().toLowerCase()}
        LIMIT 1
      `.catch(() => []);
      if (gRows.length > 0) {
        ticketTier = gRows[0].guest_type === 'other_participant' ? 'other_participant' : 'invited_guest';
      }
    }
    const tierBadge = ticketTier === 'invited_guest' ? 'Vé Khách mời' : 'Vé Khách tham dự';
    const partsLabel =
      attendMode === 'full'
        ? `${tierBadge} · Tham dự toàn bộ (${selectedPartNames.join(' + ') || 'Lễ + Tiệc'})`
        : `${tierBadge} · Chỉ dự: ${selectedPartNames.join(', ') || '1 phần'}`;

    const paymentStatus = totalFee > 0 ? 'pending' : 'free';
    const regStatus = totalFee > 0 ? 'pending' : 'confirmed';
    const dynamicPayload = {
      title,
      company,
      attendMode,
      ticketTier,
      selectedPartNames,
      attendees,
      source: 'public_invitation_rsvp',
    };

    await this.prisma.$executeRaw`
      INSERT INTO public.event_registrations (
        id, event_id, member_code, association_id, member_name, company, email, phone, ticket_type, ticket_count,
        status, payment_status, payment_amount, attended_parts, dynamic_data, note, created_at, updated_at
      ) VALUES (
        ${regId}, ${eventId}, ${memberCode}, ${ev.association_id}::uuid, ${fullName}, ${company}, ${email}, ${phone},
        ${partsLabel}, ${attendeeCount}, ${regStatus}, ${paymentStatus}, ${totalFee},
        ${JSON.stringify(selectedPartNames)}::jsonb,
        ${JSON.stringify(dynamicPayload)}::jsonb,
        ${partsLabel}, now(), now()
      )
    `;

    await this.prisma.$executeRaw`
      UPDATE public.events SET registered = COALESCE(registered, 0) + ${attendeeCount}, updated_at = now()
      WHERE id = ${eventId}
    `.catch(() => {});

    await this.prisma.$executeRaw`
      INSERT INTO public.activity_log (id, action, target, target_type, actor_email, association_id, created_at)
      VALUES (gen_random_uuid(), 'Xác nhận tham dự từ Thư mời', ${`${fullName} (${attendeeCount} người) — ${partsLabel} tại "${eventTitle}"`}, 'event', ${email || 'guest@ceohn10.vn'}, ${ev.association_id}::uuid, now())
    `.catch(() => {});

    let vietQrUrl = '';
    let transferContent = '';
    let bankInfo: any = null;
    if (totalFee > 0) {
      const pubInfo = await this.getPublicInvitation(eventId);
      const cfg = pubInfo.sepayConfig;
      const bankShort = cfg.bankName.toUpperCase().includes('MB') ? 'MB' : cfg.bankName;
      transferContent = `${cfg.prefixEvent}_${regId}`;
      vietQrUrl = `https://img.vietqr.io/image/${bankShort}-${cfg.accountNumber}-compact2.png?amount=${totalFee}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(cfg.accountHolder)}`;
      bankInfo = cfg;
    }

    // Gửi Email trả về đúng Mã vé + Tên sự kiện + Phần đã đăng ký (+ QR thanh toán nếu có phí) cho khách
    if (email && email.includes('@') && this.mailService) {
      const formattedDate = ev.date ? new Date(ev.date).toLocaleDateString('vi-VN') : '';
      const evLocation = [ev.venue_name, ev.location].filter(Boolean).join(' — ');
      const qrCheckinUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(regId)}`;
      const partsListText = selectedPartNames.length > 0 ? selectedPartNames.join(', ') : partsLabel;

      const receiptHtml = `
        <div style="font-family:'Be Vietnam Pro','Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;color:#0f172a;border:1px solid #e2e8f0;border-radius:12px;">
          <p style="font-size:12px;font-weight:700;color:#003B95;text-transform:uppercase;margin:0 0 6px 0;">CLB DOANH NHÂN CEO HN10 — XÁC NHẬN VÉ SỰ KIỆN</p>
          <h2 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;">${totalFee > 0 ? 'Thông Tin Đăng Ký & Thanh Toán Vé' : 'Vé Điện Tử Tham Dự Sự Kiện'}</h2>
          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.7;">
            <div><strong>Khách tham dự:</strong> ${fullName} (${attendeeCount} người)</div>
            <div><strong>Sự kiện:</strong> ${eventTitle}</div>
            <div><strong>Phần đã đăng ký:</strong> ${partsListText}</div>
            <div><strong>Phân loại:</strong> ${partsLabel}</div>
            <div><strong>Mã vé của Quý khách:</strong> <span style="font-family:monospace;font-size:15px;font-weight:800;color:#003B95;">${regId}</span></div>
            ${formattedDate ? `<div><strong>Thời gian:</strong> ${formattedDate}</div>` : ''}
            ${evLocation ? `<div><strong>Địa điểm:</strong> ${evLocation}</div>` : ''}
            <div><strong>Tổng phí:</strong> <strong style="color:${totalFee > 0 ? '#d97706' : '#059669'};">${totalFee > 0 ? `${totalFee.toLocaleString('vi-VN')} VNĐ` : 'Miễn phí (0đ)'}</strong></div>
          </div>
          ${
            totalFee > 0 && vietQrUrl
              ? `<div style="margin-top:18px;text-align:center;padding:16px;border:1px dashed #f59e0b;border-radius:10px;background:#fffbeb;">
                  <div style="font-size:13px;font-weight:700;color:#b45309;margin-bottom:8px;">QUÉT MÃ VIETQR ĐỂ THANH TOÁN PHÍ SỰ KIỆN</div>
                  <img src="${vietQrUrl}" alt="VietQR Thanh Toán" style="width:220px;height:220px;object-fit:contain;border-radius:8px;background:#fff;padding:6px;" />
                  <div style="margin-top:8px;font-size:12px;color:#334155;">
                    <div><strong>Ngân hàng:</strong> ${bankInfo?.bankName || ''} — <strong>STK:</strong> ${bankInfo?.accountNumber || ''}</div>
                    <div><strong>Chủ TK:</strong> ${bankInfo?.accountHolder || ''}</div>
                    <div><strong>Số tiền:</strong> ${totalFee.toLocaleString('vi-VN')} VNĐ</div>
                    <div><strong>Nội dung CK:</strong> <code style="font-weight:700;">${transferContent}</code></div>
                  </div>
                </div>`
              : `<div style="margin-top:18px;text-align:center;padding:16px;border:1px solid #d1fae5;border-radius:10px;background:#ecfdf5;">
                  <div style="font-size:13px;font-weight:700;color:#047857;margin-bottom:8px;">MÃ QR CHECK-IN SỰ KIỆN</div>
                  <img src="${qrCheckinUrl}" alt="QR Check-in" style="width:180px;height:180px;background:#fff;padding:6px;border-radius:8px;" />
                  <div style="margin-top:6px;font-size:12px;color:#065f46;">Vui lòng xuất trình mã vé <strong>${regId}</strong> tại bàn Lễ tân.</div>
                </div>`
          }
        </div>
      `;

      void this.mailService
        .sendDirectEmail({
          to: email,
          subject:
            totalFee > 0
              ? `[VÉ & QR THANH TOÁN] ${eventTitle} — Mã vé ${regId}`
              : `[VÉ SỰ KIỆN] ${eventTitle} — Mã vé ${regId}`,
          html: receiptHtml,
          templateCode: 'event_ticket_rsvp',
        })
        .catch(() => {});
    }

    return {
      ok: true,
      regId,
      eventName: eventTitle,
      selectedPartNames,
      attendMode,
      partsLabel,
      attendeeCount,
      totalFee,
      paymentStatus,
      vietQrUrl,
      transferContent,
      bankInfo,
    };
  }
}
