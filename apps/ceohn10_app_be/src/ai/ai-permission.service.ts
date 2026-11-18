import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AiCapabilityDefinition {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  requiresReviewStep: boolean;
  defaultRoles: Record<string, boolean>;
}

export const AI_CAPABILITIES_CATALOG: AiCapabilityDefinition[] = [
  {
    id: 'ai_cap_read_analytics',
    code: 'AI_READ_ANALYTICS',
    name: 'Phân tích dữ liệu & Báo cáo điều hành',
    category: 'Thống kê & Báo cáo',
    description: 'Cho phép AI đọc số liệu thực tế từ CSDL PostgreSQL để phân tích tình hình thu chi, số lượng hội viên, sự kiện và hiệu quả tài trợ.',
    requiresReviewStep: false,
    defaultRoles: {
      quan_tri: true,
      chu_tich: true,
      pho_chu_tich: true,
      tong_thu_ky: true,
      truong_ban_tai_chinh: true,
      truong_ban_truyen_thong: true,
      member: false,
    },
  },
  {
    id: 'ai_cap_read_tech_docs',
    code: 'AI_READ_TECHNICAL_DOCS',
    name: 'Tra cứu tài liệu BRD, SRS, CSDL & API',
    category: 'Tri thức kỹ thuật',
    description: 'Cho phép AI đọc và phân tích sâu các tài liệu kiến trúc, đặc tả chức năng BRD/SRS, lược đồ bảng PostgreSQL và danh mục API.',
    requiresReviewStep: false,
    defaultRoles: {
      quan_tri: true,
      chu_tich: true,
      pho_chu_tich: true,
      tong_thu_ky: true,
      truong_ban_tai_chinh: false,
      truong_ban_truyen_thong: false,
      member: false,
    },
  },
  {
    id: 'ai_cap_extract_docs',
    code: 'AI_EXTRACT_DOCUMENTS',
    name: 'Bóc tách file đính kèm (Excel, Word, PDF)',
    category: 'Xử lý tài liệu',
    description: 'Cho phép AI đọc tệp Excel, Word, PDF tải lên để bóc tách thông tin sự kiện, diễn giả, lịch trình, hoặc danh sách người nhận.',
    requiresReviewStep: true,
    defaultRoles: {
      quan_tri: true,
      chu_tich: true,
      pho_chu_tich: true,
      tong_thu_ky: true,
      truong_ban_tai_chinh: true,
      truong_ban_truyen_thong: true,
      member: false,
    },
  },
  {
    id: 'ai_cap_send_fee_reminders',
    code: 'AI_SEND_FEE_REMINDERS',
    name: 'Tự động gửi email nhắc đóng hội phí',
    category: 'Tài chính & Thu phí',
    description: 'Cho phép AI quét danh sách hội viên chưa đóng phí, tạo kịch bản thông báo có mã QR thanh toán VietQR và gửi email sau khi được duyệt.',
    requiresReviewStep: true,
    defaultRoles: {
      quan_tri: true,
      chu_tich: true,
      pho_chu_tich: true,
      tong_thu_ky: false,
      truong_ban_tai_chinh: true,
      truong_ban_truyen_thong: false,
      member: false,
    },
  },
  {
    id: 'ai_cap_send_event_notices',
    code: 'AI_SEND_EVENT_NOTICES',
    name: 'Soạn thảo & Gửi thông báo / Thư mời sự kiện',
    category: 'Truyền thông & Sự kiện',
    description: 'Cho phép AI soạn thảo nội dung thư mời, thông báo lớp học và gửi email tới 1, nhiều hoặc toàn bộ hội viên sau khi duyệt.',
    requiresReviewStep: true,
    defaultRoles: {
      quan_tri: true,
      chu_tich: true,
      pho_chu_tich: true,
      tong_thu_ky: true,
      truong_ban_tai_chinh: false,
      truong_ban_truyen_thong: true,
      member: false,
    },
  },
  {
    id: 'ai_cap_export_reports',
    code: 'AI_EXPORT_REPORTS',
    name: 'Xuất báo cáo tài chính & sự kiện (Excel/Word/PDF)',
    category: 'Báo cáo & Biểu mẫu',
    description: 'Cho phép AI tự động điền số liệu thực tế vào các mẫu biểu đã cấu hình (không hardcode) và xuất ra file Excel, Word, PDF hoàn chỉnh.',
    requiresReviewStep: true,
    defaultRoles: {
      quan_tri: true,
      chu_tich: true,
      pho_chu_tich: true,
      tong_thu_ky: true,
      truong_ban_tai_chinh: true,
      truong_ban_truyen_thong: true,
      member: false,
    },
  },
  {
    id: 'ai_cap_query_db',
    code: 'AI_QUERY_DATABASE',
    name: 'Tra cứu CSDL PostgreSQL chuyên sâu',
    category: 'Dữ liệu hệ thống',
    description: 'Cho phép AI thực hiện các truy vấn SQL đọc an toàn (Read-only) trên CSDL PostgreSQL 113.20.107.184:6432 để trích xuất thông tin đặc thù.',
    requiresReviewStep: false,
    defaultRoles: {
      quan_tri: true,
      chu_tich: true,
      pho_chu_tich: false,
      tong_thu_ky: false,
      truong_ban_tai_chinh: false,
      truong_ban_truyen_thong: false,
      member: false,
    },
  },
  {
    id: 'ai_cap_approve_actions',
    code: 'AI_APPROVE_ACTIONS',
    name: 'Duyệt & Thực thi tác vụ tự động',
    category: 'Vận hành & Tự động hóa',
    description: 'Quyền phê duyệt bước cuối cùng (nút Duyệt & Gửi) để kích hoạt email, xuất file báo cáo hoặc cập nhật trạng thái dữ liệu trong hệ thống.',
    requiresReviewStep: true,
    defaultRoles: {
      quan_tri: true,
      chu_tich: true,
      pho_chu_tich: true,
      tong_thu_ky: true,
      truong_ban_tai_chinh: false,
      truong_ban_truyen_thong: false,
      member: false,
    },
  },
];

@Injectable()
export class AiPermissionService {
  private readonly logger = new Logger(AiPermissionService.name);
  private readonly SETTING_KEY = 'ai_permission_matrix';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Đọc ma trận phân quyền AI từ CSDL PostgreSQL (public.app_settings)
   */
  async getAiPermissionMatrix(): Promise<{
    capabilities: AiCapabilityDefinition[];
    roles: string[];
    matrix: Record<string, Record<string, boolean>>;
  }> {
    const roles = [
      'quan_tri',
      'chu_tich',
      'pho_chu_tich',
      'tong_thu_ky',
      'truong_ban_tai_chinh',
      'truong_ban_truyen_thong',
      'member',
    ];

    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT value FROM public.app_settings WHERE key = ${this.SETTING_KEY} LIMIT 1
      `.catch(() => []);

      if (rows.length > 0 && rows[0].value) {
        let savedData: any = rows[0].value;
        if (typeof savedData === 'string') {
          savedData = JSON.parse(savedData);
        }
        if (savedData && savedData.matrix) {
          return {
            capabilities: AI_CAPABILITIES_CATALOG,
            roles,
            matrix: savedData.matrix,
          };
        }
      }
    } catch (e: any) {
      this.logger.warn(`Could not read ai_permission_matrix from DB: ${e.message}`);
    }

    // Default fallback matrix from catalog
    const defaultMatrix: Record<string, Record<string, boolean>> = {};
    for (const cap of AI_CAPABILITIES_CATALOG) {
      defaultMatrix[cap.code] = { ...cap.defaultRoles };
    }

    return {
      capabilities: AI_CAPABILITIES_CATALOG,
      roles,
      matrix: defaultMatrix,
    };
  }

  /**
   * Lưu ma trận phân quyền AI trực tiếp vào CSDL PostgreSQL (public.app_settings)
   */
  async saveAiPermissionMatrix(matrix: Record<string, Record<string, boolean>>): Promise<{ ok: boolean; message: string }> {
    const payload = JSON.stringify({
      matrix,
      updated_at: new Date().toISOString(),
    });

    await this.prisma.$executeRaw`
      INSERT INTO public.app_settings (id, key, value, created_at, updated_at)
      VALUES (gen_random_uuid(), ${this.SETTING_KEY}, ${payload}::jsonb, now(), now())
      ON CONFLICT (key) DO UPDATE
      SET value = ${payload}::jsonb, updated_at = now()
    `;

    return {
      ok: true,
      message: 'Đã lưu ma trận phân quyền Trợ Lý AI vào CSDL PostgreSQL thành công!',
    };
  }

  /**
   * Kiểm tra thẩm quyền của người dùng đối với một năng lực của AI
   */
  async checkUserAiCapability(userId: string, capabilityCode: string): Promise<boolean> {
    if (!userId) return false;

    // 1. Kiểm tra tài khoản Quản trị viên tối cao
    if (
      userId === '00000000-0000-0000-0000-000000000000' ||
      userId === '00000000-0000-4000-8000-000000000001' ||
      userId === '00000000-0000-4000-8000-000000000002'
    ) {
      return true;
    }

    // 2. Tra cứu vai trò của người dùng
    const [vUsers, uRoles] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT id, role, email FROM public.vione_users WHERE id::text = ${userId}::text LIMIT 1
      `.catch(() => []),
      this.prisma.$queryRaw<any[]>`
        SELECT role::text FROM public.user_roles WHERE user_id::text = ${userId}::text
      `.catch(() => []),
    ]);

    const userRoles = new Set<string>();
    if (vUsers.length > 0 && vUsers[0].role) {
      userRoles.add(String(vUsers[0].role).toLowerCase());
    }
    for (const r of uRoles) {
      if (r.role) userRoles.add(String(r.role).toLowerCase());
    }

    // Map to role keys in matrix
    let matchedRoleKey = 'member';
    if (userRoles.has('quan_tri') || userRoles.has('admin') || userRoles.has('platform_admin')) {
      matchedRoleKey = 'quan_tri';
    } else if (userRoles.has('chu_tich') || userRoles.has('president') || userRoles.has('lop_truong')) {
      matchedRoleKey = 'chu_tich';
    } else if (userRoles.has('pho_chu_tich') || userRoles.has('ban_dieu_hanh') || userRoles.has('lop_pho')) {
      matchedRoleKey = 'pho_chu_tich';
    } else if (userRoles.has('tong_thu_ky') || userRoles.has('ban_thu_ky')) {
      matchedRoleKey = 'tong_thu_ky';
    } else if (userRoles.has('truong_ban_tai_chinh') || userRoles.has('btc')) {
      matchedRoleKey = 'truong_ban_tai_chinh';
    } else if (userRoles.has('truong_ban_truyen_thong') || userRoles.has('btt')) {
      matchedRoleKey = 'truong_ban_truyen_thong';
    }

    // 3. Tra cứu từ ma trận phân quyền
    const { matrix } = await this.getAiPermissionMatrix();
    const capMatrix = matrix[capabilityCode];
    if (!capMatrix) {
      return false;
    }

    return Boolean(capMatrix[matchedRoleKey]);
  }
}
