import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy cấu hình Sepay Integration động
   */
  async getSepayConfig() {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.master_system_settings WHERE setting_key = 'sepay_integration_config' LIMIT 1`,
    );

    if (rows[0]) {
      const val = typeof rows[0].setting_value === 'string'
        ? JSON.parse(rows[0].setting_value)
        : rows[0].setting_value;
      
      // Đảm bảo các trường ngân hàng phẳng dễ dùng
      const bankAcc = (val.bank_accounts && val.bank_accounts[0]) || {};
      const mergedConfig = {
        is_enabled: val.is_enabled ?? true,
        api_token: val.api_token || '',
        webhook_token: val.webhook_token || '',
        webhook_url: val.webhook_url || 'https://crm.ceohn10.viconnect.vn/api/webhooks/sepay',
        bank_brand_name: val.bank_brand_name || bankAcc.bank_brand_name || process.env.SEPAY_BANK_NAME || '',
        account_number: val.account_number || bankAcc.account_number || process.env.SEPAY_ACCOUNT_NO || '',
        account_name: val.account_name || bankAcc.account_name || process.env.SEPAY_ACCOUNT_HOLDER || '',
        bank_accounts: val.bank_accounts || [
          {
            bank_brand_name: val.bank_brand_name || process.env.SEPAY_BANK_NAME || '',
            account_number: val.account_number || process.env.SEPAY_ACCOUNT_NO || '',
            account_name: val.account_name || process.env.SEPAY_ACCOUNT_HOLDER || '',
            is_default: true,
          },
        ],
        auto_activation: val.auto_activation || {
          membership_fee: true,
          event_ticket: true,
          course_fee: true,
        },
        prefix_syntax: val.prefix_syntax || {
          membership: 'CEOHN10_HP',
          event: 'CEOHN10_SK',
          course: 'CEOHN10_LH',
        },
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

    // Default template nếu chưa có (dùng biến môi trường .env, không hardcode)
    const defaultConfig = {
      is_enabled: false,
      api_token: process.env.SEPAY_API_TOKEN || '',
      webhook_token: process.env.SEPAY_WEBHOOK_SECRET || '',
      webhook_url: 'https://crm.ceohn10.viconnect.vn/api/webhooks/sepay',
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
        membership: 'CEOHN10_HP',
        event: 'CEOHN10_SK',
        course: 'CEOHN10_LH',
      },
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
   * Lưu cấu hình Sepay động
   */
  async saveSepayConfig(config: any, updatedBy?: string) {
    const configJson = JSON.stringify(config);

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.master_system_settings (
        id, setting_key, setting_value, description, updated_by, updated_at
      ) VALUES (
        gen_random_uuid(), 'sepay_integration_config', $1::jsonb,
        'Cấu hình cổng thanh toán Sepay dynamic Master Admin', $2, NOW()
      ) ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING *`,
      configJson,
      updatedBy || 'admin@ceohn10.vn',
    );

    return {
      success: true,
      setting_key: 'sepay_integration_config',
      config: typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value,
      updated_at: rows[0].updated_at,
    };
  }

  /**
   * Lấy danh mục các nền tảng phần mềm đã đăng ký
   */
  async getPlatforms() {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.master_system_settings WHERE setting_key = 'master_platforms_catalog' LIMIT 1`,
    );

    if (rows[0]) {
      const val = typeof rows[0].setting_value === 'string'
        ? JSON.parse(rows[0].setting_value)
        : rows[0].setting_value;
      return Array.isArray(val) ? val : [];
    }

    return [
      {
        id: 'plt-crm',
        name: 'Hệ thống CRM CEOHN10',
        code: 'CEOHN10_CRM_WEB',
        category: 'crm',
        categoryLabel: 'CRM Hiệp hội',
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
        id, setting_key, setting_value, description, updated_by, updated_at
      ) VALUES (
        gen_random_uuid(), 'master_platforms_catalog', $1::jsonb,
        'Danh mục phần mềm và nền tảng tích hợp CLB CEOHN10', $2, NOW()
      ) ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING *`,
      json,
      updatedBy || 'admin@ceohn10.vn',
    );

    return {
      success: true,
      platforms: typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value,
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
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.master_system_settings WHERE setting_key = 'zalo_oa_integration_config' LIMIT 1`,
    );

    if (rows[0]) {
      const val = typeof rows[0].setting_value === 'string'
        ? JSON.parse(rows[0].setting_value)
        : rows[0].setting_value;
      return {
        setting_key: 'zalo_oa_integration_config',
        config: val,
        updated_at: rows[0].updated_at,
      };
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
    const configJson = JSON.stringify(config);

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.master_system_settings (
        id, setting_key, setting_value, description, updated_by, updated_at
      ) VALUES (
        gen_random_uuid(), 'zalo_oa_integration_config', $1::jsonb,
        'Cấu hình tích hợp Zalo Official Account & ZBS Master Admin', $2, NOW()
      ) ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING *`,
      configJson,
      updatedBy || 'admin@ceohn10.vn',
    );

    return {
      success: true,
      setting_key: 'zalo_oa_integration_config',
      config: typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value,
      updated_at: rows[0].updated_at,
    };
  }
}
