import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * SchemaSyncService: Nguồn sự thật tập trung cho các bảng & cột SQL bổ sung.
 * Chạy idempotent (IF NOT EXISTS) mỗi khi Backend khởi động ở cả Localhost và Server Subdomain
 * để đảm bảo cấu trúc bảng/cột luôn tương đồng 100% giữa 2 môi trường mà không làm mất dữ liệu.
 */
@Injectable()
export class SchemaSyncService implements OnModuleInit {
  private readonly logger = new Logger(SchemaSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureAllSchemas();
  }

  async ensureAllSchemas(): Promise<void> {
    const statements: string[] = [
      // 1. Cấu hình hệ thống & cờ nội bộ
      `CREATE TABLE IF NOT EXISTS public.app_system_flags (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS public.master_system_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,

      // 2. Tài trợ & Gói tài trợ
      `CREATE TABLE IF NOT EXISTS public.sponsor_packages (
        id TEXT PRIMARY KEY,
        tier TEXT NOT NULL,
        price BIGINT NOT NULL DEFAULT 0,
        benefits TEXT[] DEFAULT ARRAY[]::TEXT[],
        available INT NOT NULL DEFAULT 10,
        sold INT NOT NULL DEFAULT 0,
        association_id UUID,
        package_type TEXT DEFAULT 'cash',
        in_kind_description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS public.sponsors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tier TEXT NOT NULL DEFAULT 'gold',
        sponsor_type TEXT DEFAULT 'enterprise',
        package_type TEXT DEFAULT 'cash',
        in_kind_description TEXT,
        contact TEXT DEFAULT '',
        email TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        amount BIGINT NOT NULL DEFAULT 0,
        events INT NOT NULL DEFAULT 0,
        since DATE,
        status TEXT DEFAULT 'active',
        association_id UUID,
        birth_date DATE,
        age INT,
        website TEXT,
        company_name TEXT,
        in_kind_items JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,

      // 3. Sự kiện, Hạng vé, Thư mời cá nhân hóa & Đăng ký
      `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT '';`,
      `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue_name TEXT DEFAULT '';`,
      `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS parts JSONB DEFAULT '[]'::jsonb;`,
      `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT '{}'::jsonb;`,
      `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS reserve_capacity INT DEFAULT 0;`,
      `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS allow_walkin_checkin BOOLEAN DEFAULT FALSE;`,

      `CREATE TABLE IF NOT EXISTS public.event_invitation_guests (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        slug TEXT NOT NULL,
        full_name TEXT NOT NULL,
        title TEXT DEFAULT '',
        company TEXT DEFAULT '',
        email TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        guest_type TEXT DEFAULT 'invited_guest',
        source TEXT DEFAULT 'import',
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(event_id, slug)
      );`,
      `ALTER TABLE public.event_invitation_guests ADD COLUMN IF NOT EXISTS guest_type TEXT DEFAULT 'invited_guest';`,

      `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS is_walkin BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS registration_origin TEXT DEFAULT 'pre_registered';`,
      `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'free';`,
      `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_amount NUMERIC DEFAULT 0;`,
      `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS attended_parts JSONB DEFAULT '[]'::jsonb;`,
      `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS dynamic_data JSONB DEFAULT '{}'::jsonb;`,
      `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS checkin_timeliness TEXT;`,
      `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS seat_assignment TEXT;`,
      `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;`,
      `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ;`,

      // 4. Kết nối B2B & Cuộc hẹn
      `CREATE TABLE IF NOT EXISTS public.user_connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id UUID NOT NULL,
        recipient_id UUID NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS public.business_meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id UUID NOT NULL,
        recipient_id UUID NOT NULL,
        title TEXT NOT NULL,
        meeting_time TIMESTAMPTZ,
        location TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,

      // 5. Biểu quyết & Bầu cử
      `ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS training_id UUID;`,
      `ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS target_type TEXT;`,
      `ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS target_id TEXT;`,
    ];

    let applied = 0;
    for (const sql of statements) {
      try {
        await this.prisma.$executeRawUnsafe(sql);
        applied++;
      } catch (err: any) {
        this.logger.warn(`SchemaSync warning: ${err?.message || err}`);
      }
    }
    this.logger.log(`✅ [SchemaSyncService] Đã kiểm tra & đồng bộ ${applied}/${statements.length} cấu trúc bảng/cột chuẩn.`);
  }
}
