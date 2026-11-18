import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface TechnicalDocItem {
  id: string;
  code: string;
  name: string;
  category: 'brd' | 'srs' | 'database' | 'api' | 'guide';
  path: string;
  sizeBytes: number;
  summary: string;
  keyTopics: string[];
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private cachedKnowledgePrompt: string = '';
  private lastIndexedAt: Date | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Danh mục hồ sơ tài liệu kỹ thuật BRD, SRS, CSDL PostgreSQL và RESTful API
   */
  getRegisteredDocuments(): TechnicalDocItem[] {
    return [
      {
        id: 'doc_brd_master',
        code: 'BRD-CEOHN10-MASTER',
        name: 'Tài liệu Yêu cầu Nghiệp vụ Tổng thể (BRD Master)',
        category: 'brd',
        path: 'document/BRD_CEOHN10_MASTER_CHINH_THUC.md',
        sizeBytes: 42226,
        summary: 'Toàn bộ mục tiêu chiến lược, sơ đồ tổ chức Ban Điều Hành, cơ cấu 7 Ban chuyên môn và quy trình vận hành CLB Doanh Nhân CEO HN10.',
        keyTopics: [
          'Cơ cấu tổ chức Lớp Trưởng, Lớp Phó, Ban Cán Sự Lớp & Team',
          '7 Ban chuyên môn: Học tập, Sự kiện, Tài chính tài trợ, Truyền thông, Công nghệ, Đối ngoại B2B, Đời sống',
          'Quy trình nạp hội viên, thu niên liễm, phê duyệt hồ sơ doanh nghiệp',
          'Nguyên tắc quản trị 2 túi quỹ minh bạch (Quỹ Hoạt Động & Quỹ Thiện Nguyện CSR)',
        ],
      },
      {
        id: 'doc_srs_crm',
        code: 'SRS-01-WEB-CRM',
        name: 'Đặc tả Kỹ thuật Hệ thống Cổng Quản trị Web CRM',
        category: 'srs',
        path: 'document/SRS_01_Web_CRM_CEOHN10.md',
        sizeBytes: 114468,
        summary: 'Đặc tả chi tiết từng màn hình, luồng dữ liệu, phân quyền RBAC và logic nghiệp vụ cho Cổng Quản trị Web CRM CEO HN10.',
        keyTopics: [
          'Dashboard điều hành, Sổ quỹ thu chi thời gian thực',
          'Quản lý 30 khóa học, lịch đào tạo, phòng họp video Jitsi Meet',
          'Quản lý sự kiện, bốc thăm may mắn, xuất danh sách điểm danh QR',
          'Hệ thống biểu mẫu tùy biến Word, Excel, PDF (không hardcode format)',
          'Ma trận phân quyền RBAC đa cấp độ kết nối CSDL PostgreSQL',
        ],
      },
      {
        id: 'doc_srs_mobile',
        code: 'SRS-02-APP-MOBILE',
        name: 'Đặc tả Kỹ thuật Ứng dụng Di động Hội viên CEO HN10',
        category: 'srs',
        path: 'document/SRS_02_App_Hiep_Hoi_CEOHN10.md',
        sizeBytes: 87115,
        summary: 'Đặc tả toàn diện trải nghiệm mobile-first cho Hội viên Doanh nhân, tích hợp thẻ thành viên số, danh thiếp thông minh, quét QR vé sự kiện và kết nối B2B.',
        keyTopics: [
          'Thẻ hội viên số QR Code & NFC Visit Card',
          'Mạng lưới giao thương B2B, chia sẻ cơ hội kinh doanh, sàn sản phẩm',
          'Điểm danh sự kiện & lịch học realtime bằng Camera điện thoại',
          'Biểu quyết điện tử và tra cứu quyền lợi thành viên',
        ],
      },
      {
        id: 'doc_db_postgres',
        code: 'DB-CEOHN10-SCHEMA',
        name: 'Thiết kế Cơ sở Dữ liệu PostgreSQL 113.20.107.184:6432',
        category: 'database',
        path: 'document/THIET_KE_CSDL_POSTGRESQL_CEOHN10.md',
        sizeBytes: 26191,
        summary: 'Lược đồ CSDL chi tiết cho toàn bộ các bảng trong ceohn10_project, ràng buộc toàn vẹn, chỉ mục tối ưu và quy chuẩn STRICT NO-MOCK.',
        keyTopics: [
          'Bảng cốt lõi: ceohn10_users, members, companies, user_roles',
          'Bảng sự kiện: events, event_registrations, lucky_draw_participants',
          'Bảng đào tạo: trainings, training_attendees',
          'Bảng tài chính 2 túi quỹ: invoices, transactions, expenses, member_dues, sponsors',
          'Bảng biểu mẫu & cấu hình: templates, documents, app_settings, activity_log',
          'Địa chỉ kết nối: 113.20.107.184:6432/ceohn10_project qua PgBouncer pooler',
        ],
      },
      {
        id: 'doc_api_restful',
        code: 'API-CEOHN10-SPEC',
        name: 'Đặc tả Giao diện Lập trình RESTful API CEO HN10',
        category: 'api',
        path: 'document/THIET_KE_RESTFUL_API_CEOHN10.md',
        sizeBytes: 19911,
        summary: 'Toàn bộ danh mục endpoints chuẩn RESTful của Backend NestJS, JWT Auth Guards, RBAC validation và cấu trúc Request/Response tiêu chuẩn.',
        keyTopics: [
          'Auth & Session: POST /api/auth/login, GET /api/users/me',
          'Học viên: GET /api/members, POST /api/members, PATCH /api/members/:id/renew',
          'Sự kiện & Vé: GET /api/events, POST /api/events/:id/register, POST /api/events/:id/guest-register',
          'Khóa đào tạo: GET /api/trainings, POST /api/trainings/:id/join',
          'Tài chính & Thu chi: GET /api/admin/transactions, POST /api/expenses',
          'Biểu mẫu: GET /api/templates, POST /api/templates',
          'Phân quyền: GET /api/admin/permission-matrix, PUT /api/admin/permission-matrix',
        ],
      },
    ];
  }

  /**
   * Tạo prompt tri thức kỹ thuật chuẩn mực để nạp vào AI Assistant
   */
  async getSystemKnowledgePrompt(): Promise<string> {
    if (this.cachedKnowledgePrompt && this.lastIndexedAt && Date.now() - this.lastIndexedAt.getTime() < 3600000) {
      return this.cachedKnowledgePrompt;
    }

    const docs = this.getRegisteredDocuments();
    const prompt = `
=== [CEOHN10 TECHNICAL KNOWLEDGE BASE & SYSTEM SPECIFICATIONS] ===
Bạn là Trợ Lý AI Điều Hành Toàn Năng kiêm Cố Vấn Kiến Trúc Kỹ Thuật cho Hệ sinh thái Doanh nhân CEO HN10 (trực thuộc Hội Doanh Nghiệp Trẻ Hà Nội - HanoiBA).
Bạn đã được nạp đầy đủ và nắm vững 100% các tài liệu nghiệp vụ, thiết kế hệ thống và CSDL sau:

1. TÀI LIỆU BRD (YÊU CẦU NGHIỆP VỤ):
- Đơn vị chủ quản: CLB Doanh Nhân CEO HN10 (HanoiBA).
- Cơ cấu lãnh đạo: Lớp Trưởng Lâm thời, Lớp Phó Lâm thời, Ban Cán Sự Lớp & Ban Cán Sự Team.
- 7 Ban chuyên môn nòng cốt:
  + Ban Học tập: Quản lý 30 khóa học, lịch đào tạo, học liệu số, phòng họp Jitsi Meet.
  + Ban Sự kiện & Hậu cần: Tổ chức sự kiện lớn, đăng ký vé điện tử, bốc thăm may mắn, check-in mã QR.
  + Ban Tài chính & Tài trợ: Quản lý 2 túi quỹ (Quỹ hoạt động tiền mặt/hiện vật & Quỹ thiện nguyện CSR), thu hội phí, báo cáo tài trợ không gán gói cố định (mở rộng tự điền nội dung, phân loại tiền/hiện vật rõ ràng).
  + Ban Truyền thông: Thông báo sự kiện/lớp học, tin tức báo chí, album ảnh sự kiện.
  + Ban Công nghệ: Hạ tầng Docker Nginx, bảo mật JWT, phân quyền RBAC, AI Trợ lý.
  + Ban Đối ngoại & Giao thương: Kết nối B2B, phân loại doanh nghiệp, xúc tiến thương mại.
  + Ban Đời sống & Gắn kết: Chăm sóc hội viên, sinh nhật, quyền lợi & ưu đãi.

2. THIẾT KẾ CƠ SỞ DỮ LIỆU POSTGRESQL CHUẨN MỰC (113.20.107.184:6432):
- Database Server duy nhất: 113.20.107.184:6432 (Database: ceohn10_project, user: app1).
- Nguyên tắc bất di bất dịch: TUYỆT ĐỐI KHÔNG HARDCODE MOCK DATA, mọi thao tác lưu/đọc đều từ PostgreSQL này.
- Các bảng CSDL cốt lõi:
  * \`public.ceohn10_users\`: Tài khoản người dùng, email, mật khẩu băm, role.
  * \`public.members\`: Hồ sơ Học viên doanh nhân, mã HV (code), chức vụ, doanh nghiệp, ban bệ, tình trạng hội phí.
  * \`public.events\`: Sự kiện, ngày giờ, địa điểm, kinh phí, loại quỹ (fund_type: general/csr), số vé.
  * \`public.event_registrations\`: Đăng ký sự kiện, mã vé, mã lucky draw, trạng thái điểm danh.
  * \`public.trainings\`: Lịch học, khóa đào tạo, giảng viên, link phòng họp Jitsi, tài liệu đính kèm.
  * \`public.sponsors\`: Nhà tài trợ, loại tài trợ (tiền mặt / hiện vật / quỹ thiện nguyện CSR), giá trị tài trợ.
  * \`public.invoices\` & \`public.transactions\`: Hóa đơn hội phí và sổ quỹ thu chi thời gian thực.
  * \`public.templates\`: Danh mục biểu mẫu định dạng Excel, Word, PDF (không hardcode cấu trúc báo cáo).
  * \`public.app_settings\`: Cấu hình hệ thống, ma trận phân quyền CRM (crm_permission_matrix) và phân quyền AI (ai_permission_matrix).

3. ĐẶC TẢ HỆ THỐNG RESTFUL APIS:
- Tiền tố API: \`/api/*\`
- Xác thực: \`Authorization: Bearer <JWT_TOKEN>\`
- Các endpoint trọng yếu:
  * \`/api/auth/login\`, \`/api/users/me\`: Xác thực danh tính & cấp quyền allowedRoutes + permissionsHash.
  * \`/api/members\`: Quản lý danh sách, hồ sơ và gia hạn Học viên.
  * \`/api/events\`, \`/api/events/:id/register\`, \`/api/events/:id/guest-register\`: Quản trị và đăng ký sự kiện.
  * \`/api/trainings\`, \`/api/trainings/:id/join\`: Quản lý buổi học và điểm danh QR.
  * \`/api/sponsors\`: Quản lý tài trợ, tự động cộng dồn vào quỹ tiền mặt, hiện vật hoặc thiện nguyện.
  * \`/api/admin/transactions\`: Sổ quỹ thu chi thời gian thực.
  * \`/api/templates\`: Quản lý biểu mẫu tải lên và xuất báo cáo.
  * \`/api/ai/*\`: Trợ lý AI, phân tích tài liệu, nhắc hội phí, cố vấn kinh doanh.

4. NGUYÊN TẮC HÀNH ĐỘNG CỦA AI:
- Khi người dùng hỏi về nghiệp vụ, hãy giải thích rõ ràng theo tài liệu BRD và SRS.
- Khi người dùng hỏi về cơ sở dữ liệu, hãy trích dẫn chính xác tên bảng, cột và kiểu dữ liệu PostgreSQL chuẩn.
- Khi người dùng yêu cầu thao tác (gửi email nhắc phí, xuất báo cáo, bóc tách file), hãy tuân thủ quy trình các bước có kiểm duyệt (review & approve) và chỉ thực thi khi được cấp quyền AI tương ứng.
=== [END TECHNICAL KNOWLEDGE BASE] ===
`;

    this.cachedKnowledgePrompt = prompt;
    this.lastIndexedAt = new Date();
    return prompt;
  }

  /**
   * Truy vấn nội dung chi tiết của một tài liệu kỹ thuật
   */
  async queryTechnicalDocument(code: string): Promise<any> {
    const docs = this.getRegisteredDocuments();
    const target = docs.find((d) => d.code.toLowerCase() === code.toLowerCase() || d.id === code);
    if (!target) {
      return { ok: false, message: `Không tìm thấy tài liệu với mã: ${code}` };
    }

    try {
      const fullPath = path.resolve(process.cwd(), target.path);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        return {
          ok: true,
          doc: target,
          contentLength: content.length,
          preview: content.slice(0, 3000),
          fullContent: content,
        };
      }
    } catch (e: any) {
      this.logger.warn(`Could not read physical file ${target.path}: ${e.message}`);
    }

    return {
      ok: true,
      doc: target,
      contentLength: 0,
      preview: target.summary,
      fullContent: target.summary,
    };
  }
}
