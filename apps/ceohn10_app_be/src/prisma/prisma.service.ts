import * as fs from 'fs';
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@ceohn10/db';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const localDbUrl =
      'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project';
    const remoteDbUrl =
      'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?pgbouncer=true';

    const isServerRuntime =
      fs.existsSync('/.dockerenv') ||
      process.env.IS_DOCKER === 'true' ||
      process.env.DOCKER_CONTAINER === 'true' ||
      process.env.NODE_ENV === 'production' ||
      Boolean(process.env.REMOTE_SERVER);

    const standardDbUrl = isServerRuntime
      ? process.env.REMOTE_DATABASE_URL ||
        (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('127.0.0.1')
          ? process.env.DATABASE_URL
          : remoteDbUrl)
      : localDbUrl;

    super({
      datasources: {
        db: {
          url: standardDbUrl,
        },
      },
    });

    this.logger.log(
      `🚀 [PrismaService] Đang kết nối CSDL: ${standardDbUrl.includes('127.0.0.1') || standardDbUrl.includes('localhost') ? 'Localhost 127.0.0.1:5432 (Local thuần)' : '113.20.107.184:6432/ceohn10_project'}`,
    );
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log(
        '✅ [PrismaService] Kết nối cơ sở dữ liệu Prisma thành công.',
      );

      // Đảm bảo bảng app_settings luôn sẵn sàng cho RBAC Ma trận phân quyền và cấu hình hệ thống
      await this.$executeRawUnsafe(
        `
        CREATE TABLE IF NOT EXISTS public.app_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_by UUID,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `,
      ).catch(() => { });

      // Đảm bảo các bảng lưu trữ tương tác Zalo OA và mapping Học viên luôn sẵn sàng
      await this.$executeRawUnsafe(
        `
        CREATE TABLE IF NOT EXISTS public.zalo_subscribers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          zalo_user_id TEXT UNIQUE NOT NULL,
          display_name TEXT,
          avatar_url TEXT,
          phone TEXT,
          member_id TEXT,
          last_message TEXT,
          last_interacted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS public.zalo_webhook_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_name TEXT,
          sender_id TEXT,
          recipient_id TEXT,
          message_text TEXT,
          raw_payload JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        ALTER TABLE public.members ADD COLUMN IF NOT EXISTS zalo_user_id TEXT;
        ALTER TABLE public.members ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE public.members ADD COLUMN IF NOT EXISTS business_card_slug TEXT;

        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS folder_id TEXT;
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS drive_url TEXT;
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS share_scope TEXT DEFAULT 'public';
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS share_role TEXT DEFAULT 'viewer';
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS shared_with JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS color_tag TEXT;
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS doc_scope TEXT DEFAULT 'association';
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS enterprise_name TEXT;

        -- Safe Migration cho Marketplace Products (Ngăn lỗi column p.seller_id does not exist)
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id TEXT;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title TEXT;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company TEXT;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls TEXT[];
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS custom_id TEXT;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price NUMERIC;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS member_price NUMERIC;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS emoji TEXT;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pdf_url TEXT;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS website_url TEXT;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS facebook_url TEXT;

        -- Safe Migration cho Dynamic Form Schemas & Fields (Ngăn lỗi column name does not exist)
        CREATE TABLE IF NOT EXISTS public.dynamic_form_schemas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type TEXT NOT NULL,
          name TEXT,
          title TEXT,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE public.dynamic_form_schemas ADD COLUMN IF NOT EXISTS name TEXT;
        ALTER TABLE public.dynamic_form_schemas ADD COLUMN IF NOT EXISTS title TEXT;
        ALTER TABLE public.dynamic_form_schemas ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE public.dynamic_form_schemas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

        CREATE TABLE IF NOT EXISTS public.dynamic_form_fields (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          schema_id UUID,
          field_name TEXT NOT NULL,
          field_label TEXT NOT NULL,
          field_type TEXT NOT NULL DEFAULT 'text',
          options JSONB DEFAULT '[]'::jsonb,
          placeholder TEXT,
          default_value TEXT,
          is_required BOOLEAN DEFAULT FALSE,
          is_enabled BOOLEAN DEFAULT TRUE,
          order_index INTEGER DEFAULT 0,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
      ).catch(() => { });

      // Tự động kiểm tra và khởi tạo RBAC 15 Roles & Tài chính 2.1 Tỷ (Localhost & Subdomain self-healing)
      await this.ensureRbacAndFinanceSeeded().catch((e) => {
        this.logger.warn(`Lưu ý khởi tạo RBAC/Tài chính: ${e?.message || e}`);
      });
    } catch (err: any) {
      this.logger.warn(
        `⚠️ [PrismaService] Chưa thể kết nối cơ sở dữ liệu khi khởi động (${err?.message || err}). Tiến trình sẽ tiếp tục chạy và tự động tái kết nối khi CSDL sẵn sàng.`,
      );
    }
  }

  private async ensureRbacAndFinanceSeeded() {
    try {
      // 1. Kiểm tra roles
      const roleCount = await this.roles.count().catch(() => 0);
      if (roleCount === 0) {
        this.logger.log('🌱 [PrismaService] Khởi tạo 9 Roles chuẩn RBAC...');
        await this.$executeRawUnsafe(`
          INSERT INTO public.roles (code, name, scope_level, description) VALUES
          ('ADMIN_PLATFORM', 'Admin Platform', 'PLATFORM', 'Quản trị toàn bộ nền tảng'),
          ('ADMIN', 'Admin', 'ORGANIZATION', 'Quản lý toàn bộ tổ chức'),
          ('LOP_TRUONG', 'Lớp trưởng', 'CLASS', 'Quản lý toàn bộ lớp học'),
          ('LOP_PHO', 'Lớp phó', 'CLASS', 'Hỗ trợ lớp trưởng'),
          ('TRUONG_TEAM', 'Trưởng team', 'TEAM', 'Quản lý thành viên trong team'),
          ('PHO_TEAM', 'Phó team', 'TEAM', 'Hỗ trợ trưởng team'),
          ('TRUONG_BAN_CHUYEN_TRACH', 'Trưởng Ban chuyên trách', 'COMMITTEE', 'Trưởng 7 ban chuyên trách'),
          ('GIANG_VIEN', 'Giảng viên', 'CLASS', 'Giảng dạy lớp học'),
          ('HOC_VIEN', 'Học viên', 'SELF', 'Thành viên lớp học')
          ON CONFLICT (code) DO NOTHING;
        `);
      }

      // 2. Kiểm tra financial_funds (Quỹ Tổng + 7 Quỹ Ban Chuyên Trách)
      const fundCount = await this.financial_funds.count().catch(() => 0);
      if (fundCount === 0) {
        this.logger.log('🌱 [PrismaService] Khởi tạo Quỹ Tổng (2.08 tỷ) & 7 Quỹ Ban CEO HN10 (Ban CN 20M Kinh phí khai giảng)...');
        await this.$executeRawUnsafe(`
          INSERT INTO public.financial_funds (code, name, fund_type, description, current_balance) VALUES
          ('FUND_GENERAL', 'Quỹ Tổng CLB Doanh Nhân CEO HN10', 'GENERAL', 'Quỹ tài chính tổng hợp toàn CLB (2 tỷ 080 triệu)', 2080000000),
          ('FUND_BAN_CONG_NGHE', 'Quỹ Ban Công nghệ', 'COMMITTEE', 'Kinh phí khai giảng', 20000000),
          ('FUND_BAN_TRUYEN_THONG', 'Quỹ Ban Truyền thông', 'COMMITTEE', 'Quỹ chuyên trách truyền thông và thương hiệu', 0),
          ('FUND_BAN_TAI_CHINH', 'Quỹ Ban Tài chính', 'COMMITTEE', 'Quỹ chuyên trách ngân sách, kiểm soát tài chính và phí tham gia CLB', 0),
          ('FUND_BAN_SU_KIEN_HAU_CAN', 'Quỹ Ban Sự kiện & Hậu cần', 'COMMITTEE', 'Quỹ chuyên trách tổ chức sự kiện và tiếp nhận phí vé SePay', 0),
          ('FUND_BAN_DOI_NGOAI', 'Quỹ Ban Đối ngoại & Giao thương', 'COMMITTEE', 'Quỹ chuyên trách đối ngoại và kết nối giao thương B2B', 0),
          ('FUND_BAN_GAN_KET', 'Quỹ Ban Gắn kết & Đời sống', 'COMMITTEE', 'Quỹ chăm lo đời sống và gắn kết thành viên', 0),
          ('FUND_BAN_THIEN_NGUYEN', 'Quỹ Ban Thiện nguyện', 'COMMITTEE', 'Quỹ chuyên trách công tác xã hội và thiện nguyện cộng đồng', 0)
          ON CONFLICT (code) DO NOTHING;

          INSERT INTO public.bank_accounts (bank_name, account_number, account_holder, fund_id)
          SELECT 'Vietcombank', '101010202688', 'CLB DOANH NHAN CEO HN10 - QUY TONG', id
          FROM public.financial_funds WHERE code = 'FUND_GENERAL'
          ON CONFLICT (account_number) DO NOTHING;

          INSERT INTO public.bank_accounts (bank_name, account_number, account_holder, fund_id)
          SELECT 'MBBank', '888809012026', 'CLB DOANH NHAN CEO HN10 - BAN CONG NGHE', id
          FROM public.financial_funds WHERE code = 'FUND_BAN_CONG_NGHE'
          ON CONFLICT (account_number) DO NOTHING;
        `);
      }
    } catch (err: any) {
      this.logger.warn(`[PrismaService] Tự động khởi tạo dữ liệu: ${err?.message || err}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch { }
  }
}
