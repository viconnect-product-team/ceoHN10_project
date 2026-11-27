import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const DEFAULT_FEE_CATEGORIES = [
  {
    id: 'fee_event',
    name: 'Vé tham gia sự kiện',
    prefix: 'CEO1983_EVT',
    target_fund_name: 'Quỹ Sự Kiện & Hậu Cần',
    action_type: 'event_ticket',
    action_label: 'Phát hành vé QR & gửi Email/Zalo',
    description: 'Tự động duyệt vé, tạo mã QR check-in HMAC-SHA256, gửi vé điện tử',
    is_active: true,
  },
  {
    id: 'fee_joining',
    name: 'Phí gia nhập CLB (Hội viên mới)',
    prefix: 'CEOHN10_GN',
    target_fund_name: 'Quỹ Tổng CLB CEO HN10',
    action_type: 'membership_join',
    action_label: 'Duyệt hội viên mới & cấp thẻ số',
    description: 'Kích hoạt hội viên chính thức, cấp mã học viên, mở thẻ 3D/NFC',
    is_active: true,
  },
  {
    id: 'fee_annual',
    name: 'Phí tham gia CLB thường niên hàng năm',
    prefix: 'CEOHN10_HP',
    target_fund_name: 'Quỹ Tổng CLB CEO HN10',
    action_type: 'membership_annual',
    action_label: 'Gia hạn niên liễm & thẻ hội viên',
    description: 'Tự động gạch nợ hóa đơn phí tham gia CLB, gia hạn niên hạn sử dụng thẻ',
    is_active: true,
  },
  {
    id: 'fee_course',
    name: 'Học phí Khóa học / 30 Chuyên đề',
    prefix: 'CEOHN10_LH',
    target_fund_name: 'Quỹ Ban Học Tập & Đào Tạo',
    action_type: 'course_enroll',
    action_label: 'Ghi danh lớp & mở khóa bài giảng',
    description: 'Ghi danh hội viên vào lớp học, cấp quyền truy cập tài liệu đào tạo',
    is_active: true,
  },
  {
    id: 'fee_sponsorship',
    name: 'Kinh phí Tài trợ CLB & Sự kiện',
    prefix: 'CEOHN10_TT',
    target_fund_name: 'Quỹ Tài TrỢ & Đối Ngoại',
    action_type: 'sponsorship',
    action_label: 'Kích hoạt logo & quyền lợi Sponsor',
    description: 'Ghi nhận quyền lợi nhà tài trợ (Kim cương, Vàng, Bạc), hiển thị logo app',
    is_active: true,
  },
  {
    id: 'fee_charity',
    name: 'Ủng hộ Quỹ Thiện nguyện',
    prefix: 'CEOHN10_TN',
    target_fund_name: 'Quỹ Thiện Nguyện CLB',
    action_type: 'charity',
    action_label: 'Ghi nhận đóng góp & vinh danh',
    description: 'Cộng tiền vào Quỹ Thiện nguyện, vinh danh Bảng vàng đóng góp',
    is_active: true,
  },
  {
    id: 'fee_b2b',
    name: 'Phí Gian hàng B2B / Kết nối giao thương',
    prefix: 'CEOHN10_B2B',
    target_fund_name: 'Quỹ Ban Xúc Tiến Thương Mại B2B',
    action_type: 'b2b_expo',
    action_label: 'Mở gian hàng số & lịch hẹn 1-on-1',
    description: 'Cấp quyền mở gian hàng sản phẩm và đặt lịch kết nối giao thương 1-on-1',
    is_active: true,
  },
];

@Injectable()
export class MasterSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureMasterSettingsTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.master_system_settings (
        key text PRIMARY KEY,
        value jsonb NOT NULL,
        category text DEFAULT 'general',
        description text,
        updated_by text,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );
    `).catch(() => {});
  }

  /**
   * Lấy cấu hình Sepay Integration động
   */
  async getSepayConfig() {
    await this.ensureMasterSettingsTable();
    try {
      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT key, value, description, updated_at FROM public.master_system_settings WHERE key = 'sepay_integration_config' LIMIT 1`,
      );

      if (rows && rows[0]) {
        const val = typeof rows[0].value === 'string'
          ? JSON.parse(rows[0].value)
          : rows[0].value;
        
        // Đảm bảo các trường ngân hàng phẳng dễ dùng
        const bankAcc = (val.bank_accounts && val.bank_accounts[0]) || {};
        const mergedConfig = {
          is_enabled: val.is_enabled ?? true,
          target_app: val.target_app || val.targetApp || 'all',
          target_app_label: val.target_app_label || 'Toàn nền tảng (Áp dụng tất cả phân hệ)',
          api_token: val.api_token || '',
          webhook_token: val.webhook_token || val.webhook_secret_key || '',
          webhook_url: (val.webhook_url && !val.webhook_url.includes('loca.lt'))
            ? val.webhook_url
            : (process.env.APP_URL ? `${process.env.APP_URL}/api/webhooks/sepay` : ''),
          bank_brand_name: val.bank_brand_name || val.bank_name || bankAcc.bank_brand_name || process.env.SEPAY_BANK_NAME || '',
          account_number: val.account_number || val.bank_account_number || bankAcc.account_number || process.env.SEPAY_ACCOUNT_NO || '',
          account_name: val.account_name || val.bank_account_holder || bankAcc.account_name || process.env.SEPAY_ACCOUNT_HOLDER || '',
          bank_accounts: val.bank_accounts || [
            {
              bank_brand_name: val.bank_brand_name || val.bank_name || process.env.SEPAY_BANK_NAME || '',
              account_number: val.account_number || val.bank_account_number || process.env.SEPAY_ACCOUNT_NO || '',
              account_name: val.account_name || val.bank_account_holder || process.env.SEPAY_ACCOUNT_HOLDER || '',
              is_default: true,
            },
          ],
          auto_activation: val.auto_activation || {
            membership_fee: true,
            event_ticket: true,
            course_fee: true,
          },
          prefix_syntax: val.prefix_syntax || {
            event: 'CEO1983_EVT',
            joining: 'CEOHN10_GN',
            membership: 'CEOHN10_HP',
            course: 'CEOHN10_LH',
            sponsor: 'CEOHN10_TT',
            charity: 'CEOHN10_TN',
            b2b: 'CEOHN10_B2B',
          },
          fee_categories: (val.fee_categories && Array.isArray(val.fee_categories) && val.fee_categories.length > 0)
            ? val.fee_categories
            : DEFAULT_FEE_CATEGORIES,
          notification: val.notification || {
            notify_telegram: false,
            notify_zalo_oa: true,
            notify_email: true,
          },
        };

        return {
          setting_key: 'sepay_integration_config',
          config: mergedConfig,
          updated_at: rows[0].updated_at,
        };
      }
    } catch (err: any) {
      console.warn('Could not read sepay_integration_config from DB, using defaults:', err?.message);
    }

    // Default template nếu chưa có (dùng biến môi trường .env, không hardcode)
    const defaultConfig = {
      is_enabled: false,
      api_token: process.env.SEPAY_API_TOKEN || '',
      webhook_token: process.env.SEPAY_WEBHOOK_SECRET || '',
      webhook_url: process.env.APP_URL ? `${process.env.APP_URL}/api/webhooks/sepay` : '',
      bank_brand_name: process.env.SEPAY_BANK_NAME || '',
      account_number: process.env.SEPAY_ACCOUNT_NO || '',
      account_name: process.env.SEPAY_ACCOUNT_HOLDER || '',
      bank_accounts: [
        {
          bank_brand_name: process.env.SEPAY_BANK_NAME || '',
          account_number: process.env.SEPAY_ACCOUNT_NO || '',
          account_name: process.env.SEPAY_ACCOUNT_HOLDER || '',
          is_default: true,
          qr_template: 'compact2',
        },
      ],
      auto_activation: {
        membership_fee: true,
        event_ticket: true,
        course_fee: true,
      },
      prefix_syntax: {
        event: 'CEO1983_EVT',
        joining: 'CEOHN10_GN',
        membership: 'CEOHN10_HP',
        course: 'CEOHN10_LH',
        sponsor: 'CEOHN10_TT',
        charity: 'CEOHN10_TN',
        b2b: 'CEOHN10_B2B',
      },
      fee_categories: DEFAULT_FEE_CATEGORIES,
      notification: {
        notify_telegram: false,
        notify_zalo_oa: true,
        notify_email: true,
      },
    };

    return {
      setting_key: 'sepay_integration_config',
      config: defaultConfig,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Lưu cấu hình Sepay
   * Tự động áp dụng cho toàn hệ thống:
   * 1. Lưu vào master_system_settings
   * 2. Đồng bộ sang app_settings (crm_sepay_config)
   * 3. Tự động upsert vào bảng public.bank_accounts để toàn bộ CRM & Thu/Chi Quỹ nhận diện tức thì
   */
  async saveSepayConfig(config: any, updatedBy?: string) {
    await this.ensureMasterSettingsTable();
    if (config && typeof config === 'object' && config.webhook_url && config.webhook_url.includes('loca.lt')) {
      config.webhook_url = '';
    }
    const configJson = JSON.stringify(config);

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.master_system_settings (
        key, value, category, description, updated_by, updated_at
      ) VALUES (
        'sepay_integration_config', $1::jsonb, 'payment_gateway',
        'Cấu hình cổng thanh toán SePay Master Admin', $2, NOW()
      ) ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING *`,
      configJson,
      updatedBy || 'admin@ceohn10.vn',
    );

    // 1. Đồng bộ sang app_settings (crm_sepay_config)
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO public.app_settings (key, value, updated_at)
       VALUES ('crm_sepay_config', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      configJson,
    ).catch(() => {});

    // 2. Tự động đồng bộ tài khoản ngân hàng sang bảng public.bank_accounts
    const accNo = String(config.account_number || (config.bank_accounts && config.bank_accounts[0]?.account_number) || '').trim();
    const bankBrand = String(config.bank_brand_name || (config.bank_accounts && config.bank_accounts[0]?.bank_brand_name) || '').trim();
    const accHolder = String(config.account_name || (config.bank_accounts && config.bank_accounts[0]?.account_name) || '').trim();

    if (accNo && bankBrand) {
      try {
        // Tìm Quỹ mặc định (Quỹ Tổng CLB hoặc Quỹ Sự Kiện & Hậu Cần)
        let fund = await this.prisma.financial_funds.findFirst({
          where: {
            OR: [
              { name: { contains: 'Tổng', mode: 'insensitive' } },
              { name: { contains: 'Sự kiện', mode: 'insensitive' } },
            ],
          },
        });

        if (!fund) {
          fund = await this.prisma.financial_funds.findFirst({
            orderBy: { created_at: 'asc' },
          });
        }

        if (!fund) {
          fund = await this.prisma.financial_funds.create({
            data: {
              name: 'Quỹ Tổng CLB CEO HN10',
              code: 'FND_MAIN',
              description: 'Quỹ hoạt động chung CLB CEO HN10',
              current_balance: BigInt(2080000000),
            },
          });
        }

        // Tìm xem tài khoản đã tồn tại trong bảng bank_accounts chưa
        const existingAcc = await this.prisma.bank_accounts.findFirst({
          where: { account_number: accNo },
        });

        if (existingAcc) {
          // Reset default của các tài khoản khác
          await this.prisma.bank_accounts.updateMany({
            where: { id: { not: existingAcc.id } },
            data: { is_default: false },
          });

          await this.prisma.bank_accounts.update({
            where: { id: existingAcc.id },
            data: {
              bank_name: bankBrand,
              account_holder: accHolder || existingAcc.account_holder,
              is_default: true,
              is_active: true,
            },
          });
        } else {
          // Reset default của các tài khoản khác
          await this.prisma.bank_accounts.updateMany({
            data: { is_default: false },
          });

          await this.prisma.bank_accounts.create({
            data: {
              fund_id: fund.id,
              bank_name: bankBrand,
              account_number: accNo,
              account_holder: accHolder || 'CLB DOANH NHAN CEO HN10',
              is_default: true,
              is_active: true,
            },
          });
        }
      } catch (syncErr) {
        // Ghi log nhẹ nhàng nếu có lỗi schema không làm gãy flow lưu cấu hình
      }
    }

    const savedConfig = (rows && rows[0]?.value)
      ? (typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value)
      : config;
    const updatedAt = (rows && rows[0]?.updated_at)
      ? rows[0].updated_at
      : new Date().toISOString();

    return {
      success: true,
      setting_key: 'sepay_integration_config',
      config: savedConfig,
      updated_at: updatedAt,
    };
  }

  /**
   * Lấy danh mục các nền tảng phần mềm đã đăng ký
   */
  async getPlatforms() {
    await this.ensureMasterSettingsTable();
    try {
      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT key, value, updated_at FROM public.master_system_settings WHERE key = 'master_platforms_catalog' LIMIT 1`,
      );

      if (rows && rows[0]) {
        const val = typeof rows[0].value === 'string'
          ? JSON.parse(rows[0].value)
          : rows[0].value;
        return Array.isArray(val) ? val : [];
      }
    } catch (err: any) {
      console.warn('Could not read master_platforms_catalog from DB, using defaults:', err?.message);
    }

    return [
      {
        id: 'plt-crm',
        name: 'Hệ thống CRM CEOHN10',
        code: 'CEOHN10_CRM_WEB',
        category: 'crm',
        categoryLabel: 'CRM CEOHN10',
        description: 'Cổng Quản trị CRM Học viên, Sự kiện, Tài chính, Phân quyền RBAC',
        endpointUrl: 'https://crm.ceohn10.viconnect.vn',
        healthcheckUrl: '/api/health',
        status: 'active',
        isCore: true,
        modules: ['Học viên', 'Sự kiện', 'Khai giảng', 'Tài chính', 'Phân quyền', 'Tra cứu'],
      },
      {
        id: 'plt-app',
        name: 'App Mobile CEOHN10',
        code: 'CEOHN10_MOBILE_APP',
        category: 'miniapp',
        categoryLabel: 'Mobile App Học viên',
        description: 'Ứng dụng di động dành riêng cho Học viên doanh nhân CEO HN10',
        endpointUrl: 'https://ceohn10.viconnect.vn/association',
        healthcheckUrl: '/api/health',
        status: 'active',
        isCore: true,
        modules: ['Danh thiếp số', 'B2B Connect', 'Điểm danh QR', 'Bình chọn', 'Hội viên'],
      },
    ];
  }

  /**
   * Lưu danh mục nền tảng phần mềm
   */
  async savePlatforms(platforms: any[], updatedBy?: string) {
    const json = JSON.stringify(platforms);

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.master_system_settings (
        key, value, category, description, updated_by, updated_at
      ) VALUES (
        'master_platforms_catalog', $1::jsonb, 'platforms',
        'Danh mục phần mềm và nền tảng tích hợp CLB CEOHN10', $2, NOW()
      ) ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING *`,
      json,
      updatedBy || 'admin@ceohn10.vn',
    );

    return {
      success: true,
      platforms: typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value,
      updated_at: rows[0].updated_at,
    };
  }

  /**
   * Thêm 1 nền tảng phần mềm mới (A, B, C... / Mini App)
   */
  async addPlatform(platform: any, updatedBy?: string) {
    const current = await this.getPlatforms();
    const newId = platform.id || `plt-${Date.now()}`;
    const newPlatform = {
      ...platform,
      id: newId,
      status: platform.status || 'active',
      isCore: Boolean(platform.isCore),
      createdAt: new Date().toISOString(),
    };
    current.push(newPlatform);
    await this.savePlatforms(current, updatedBy);
    return newPlatform;
  }

  /**
   * Cập nhật 1 nền tảng
   */
  async updatePlatform(id: string, updateData: any, updatedBy?: string) {
    const current = await this.getPlatforms();
    const index = current.findIndex((p: any) => p.id === id);
    if (index === -1) throw new NotFoundException('Không tìm thấy nền tảng');

    current[index] = {
      ...current[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    await this.savePlatforms(current, updatedBy);
    return current[index];
  }

  /**
   * Xóa 1 nền tảng
   */
  async deletePlatform(id: string, updatedBy?: string) {
    const current = await this.getPlatforms();
    const filtered = current.filter((p: any) => p.id !== id);
    await this.savePlatforms(filtered, updatedBy);
    return { success: true };
  }

  /**
   * Lấy cấu hình tích hợp Zalo OA / ZBS
   */
  async getZaloConfig() {
    await this.ensureMasterSettingsTable();
    try {
      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT key, value, updated_at FROM public.master_system_settings WHERE key = 'zalo_oa_integration_config' LIMIT 1`,
      );

      if (rows && rows[0]) {
        const val = typeof rows[0].value === 'string'
          ? JSON.parse(rows[0].value)
          : rows[0].value;
        return {
          setting_key: 'zalo_oa_integration_config',
          config: val,
          updated_at: rows[0].updated_at,
        };
      }
    } catch (err: any) {
      console.warn('Could not read zalo_oa_integration_config from DB, using defaults:', err?.message);
    }

    const defaultConfig = {
      is_enabled: false,
      oa_id: process.env.ZALO_OA_ID || '',
      app_id: process.env.ZALO_APP_ID || '',
      secret_key: process.env.ZALO_APP_SECRET || '',
      access_token: process.env.ZALO_OA_ACCESS_TOKEN || '',
      refresh_token: process.env.ZALO_REFRESH_TOKEN || '',
      webhook_url: 'https://ceohn10.viconnect.vn/api/zalo/webhook',
      default_zns_template: 'ZNS_THU_MOI_SU_KIEN_CEOHN10',
      status: 'disconnected',
    };

    return {
      setting_key: 'zalo_oa_integration_config',
      config: defaultConfig,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Lưu cấu hình tích hợp Zalo OA / ZBS
   */
  async saveZaloConfig(config: any, updatedBy?: string) {
    await this.ensureMasterSettingsTable();
    const configJson = JSON.stringify(config);

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.master_system_settings (
        key, value, category, description, updated_by, updated_at
      ) VALUES (
        'zalo_oa_integration_config', $1::jsonb, 'social_integration',
        'Cấu hình tích hợp Zalo Official Account & ZBS Master Admin', $2, NOW()
      ) ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING *`,
      configJson,
      updatedBy || 'admin@ceohn10.vn',
    );

    return {
      success: true,
      setting_key: 'zalo_oa_integration_config',
      config: typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value,
      updated_at: rows[0].updated_at,
    };
  }
}
