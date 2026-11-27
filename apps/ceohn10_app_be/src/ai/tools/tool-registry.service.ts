import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import {
  IAgentTool,
  ToolDefinition,
  ToolExecutionContext,
  ToolExecutionResult,
} from './tool.interface';

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);
  private readonly tools = new Map<string, IAgentTool>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
    this.registerBuiltInTools();
  }

  /**
   * Đăng ký toàn bộ danh mục công cụ nghiệp vụ thực tế
   */
  private registerBuiltInTools() {
    // 1. TOOL: query_members (Contact & Member Agent Tool)
    this.registerTool({
      definition: {
        name: 'query_members',
        displayName: 'Tra cứu danh bạ hội viên & thông tin liên hệ',
        description:
          'Tìm kiếm học viên, doanh nhân CLB CEO HN10 theo tên, công ty, email, số điện thoại hoặc ban bệ.',
        category: 'contact',
        safetyLevel: 'READ',
        requiredPermission: 'AI_READ_ANALYTICS',
        contextContract: {
          consumes: ['attendeeNames', 'eventDetails'],
          produces: ['members', 'preparedList'],
          transformParams: (currentParams, context) => {
            const params = { ...currentParams };
            let handoffSummary: string | undefined;
            if (!params.keyword && context.eventDetails?.attendees?.length > 0) {
              params.keyword = context.eventDetails.attendees[0];
              handoffSummary = `Đã nạp đại biểu "${params.keyword}" từ tài liệu để tra cứu danh bạ CSDL.`;
            }
            return { params, handoffSummary };
          },
          extractContext: (resultData) => {
            const members = resultData?.members || [];
            const prepared = members
              .filter((m: any) => m.email && m.email.includes('@'))
              .map((m: any) => ({
                ho_ten: m.fullName,
                email: m.email,
                so_dien_thoai: m.phone,
                cong_ty: m.company,
                chuc_vu: m.position,
                trang_thai: m.status,
              }));
            return {
              members,
              preparedList: prepared,
            };
          },
        },
        parameters: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Từ khóa tìm kiếm (họ tên, công ty, chức danh, email hoặc SĐT)',
            },
            department: {
              type: 'string',
              description: 'Ban chuyên môn (vd: BTT - Ban Truyền Thông, BXT - Ban Xúc Tiến)',
            },
            limit: {
              type: 'number',
              description: 'Số lượng tối đa cần lấy (mặc định 20)',
              default: 20,
            },
          },
        },
        returns: {
          type: 'array',
          description: 'Danh sách học viên kèm thông tin liên hệ và trạng thái',
        },
      },
      execute: async (params, context) => {
        const keyword = (params.keyword || '').trim();
        const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);

        let query = `
          SELECT m.id, m.full_name, m.company, m.phone, m.email, m.position,
                 m.department, m.executive_role, m.status, u.role as user_role
          FROM public.members m
          LEFT JOIN public.ceohn10_users u ON m.user_id = u.id
          WHERE 1=1
        `;
        const queryParams: any[] = [];

        if (keyword) {
          queryParams.push(`%${keyword}%`);
          query += ` AND (m.full_name ILIKE $${queryParams.length} OR m.company ILIKE $${queryParams.length} OR m.email ILIKE $${queryParams.length} OR m.phone ILIKE $${queryParams.length})`;
        }
        if (params.department) {
          queryParams.push(`%${params.department}%`);
          query += ` AND m.department ILIKE $${queryParams.length}`;
        }

        query += ` ORDER BY m.created_at DESC LIMIT ${limit}`;

        try {
          const rows = await this.prisma.$queryRawUnsafe<any[]>(query, ...queryParams);
          const formatted = (rows || []).map((r) => ({
            id: r.id,
            fullName: r.full_name || 'Học viên CLB',
            company: r.company || 'Doanh nghiệp thành viên',
            phone: r.phone || '',
            email: r.email || '',
            position: r.position || 'Thành viên',
            department: r.department || 'CLB Doanh Nhân CEO HN10',
            executiveRole: r.executive_role || 'member',
            status: r.status || 'active',
            hasValidEmail: Boolean(r.email && r.email.includes('@')),
            hasValidPhone: Boolean(r.phone && r.phone.length >= 9),
          }));

          return {
            success: true,
            toolName: 'query_members',
            data: {
              totalFound: formatted.length,
              members: formatted,
            },
            auditMessage: `Đã tra cứu danh bạ với từ khóa "${keyword || 'tất cả'}": ${formatted.length} kết quả.`,
          };
        } catch (err: any) {
          this.logger.error(`query_members error: ${err?.message}`);
          return {
            success: false,
            toolName: 'query_members',
            error: `Lỗi truy vấn danh bạ CSDL: ${err?.message}`,
          };
        }
      },
    });

    // 2. TOOL: query_finance_records (Data Query Agent Tool)
    this.registerTool({
      definition: {
        name: 'query_finance_records',
        displayName: 'Tra cứu sổ quỹ thu chi & giao dịch tài chính',
        description:
          'Truy vấn các giao dịch thu, chi, phí tham gia CLB, tài trợ và số dư khả dụng thực tế từ sổ kế toán.',
        category: 'data_query',
        safetyLevel: 'READ',
        requiredPermission: 'AI_READ_ANALYTICS',
        contextContract: {
          produces: ['financeRecords', 'financeStats'],
          extractContext: (resultData) => ({
            financeRecords: resultData?.transactions || [],
            financeStats: resultData?.summary || null,
          }),
        },
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['income', 'expense', 'all'],
              description: 'Loại giao dịch: income (thu), expense (chi), all (toàn bộ)',
              default: 'all',
            },
            category: {
              type: 'string',
              description: 'Danh mục (Phí tham gia CLB, Vé sự kiện, Tài trợ, Chi hoạt động...)',
            },
            limit: {
              type: 'number',
              description: 'Giới hạn số lượng bản ghi (mặc định 50)',
              default: 50,
            },
          },
        },
        returns: {
          type: 'object',
          description: 'Báo cáo số dư quỹ, tổng thu, tổng chi và danh sách giao dịch',
        },
      },
      execute: async (params, context) => {
        try {
          const rows = await this.prisma.$queryRawUnsafe<any[]>(`
            SELECT id, code, date, type, category, description, amount, method, status, recipient, created_at
            FROM public.transactions
            ORDER BY date DESC, created_at DESC
            LIMIT 100
          `).catch(() => [] as any[]);

          let filtered = rows;
          if (params.type && params.type !== 'all') {
            filtered = filtered.filter((r) => r.type === params.type);
          }
          if (params.category) {
            const catLower = params.category.toLowerCase();
            filtered = filtered.filter(
              (r) =>
                (r.category || '').toLowerCase().includes(catLower) ||
                (r.description || '').toLowerCase().includes(catLower),
            );
          }

          const totalIncome = rows
            .filter((r) => r.type === 'income' || Number(r.amount) > 0)
            .reduce((acc, r) => acc + Number(r.amount || 0), 0);

          const totalExpense = rows
            .filter((r) => r.type === 'expense' || Number(r.amount) < 0)
            .reduce((acc, r) => acc + Math.abs(Number(r.amount || 0)), 0);

          const balance = totalIncome - totalExpense;

          return {
            success: true,
            toolName: 'query_finance_records',
            data: {
              summary: {
                totalIncome,
                totalExpense,
                balance,
                totalTransactions: rows.length,
                filteredCount: filtered.length,
              },
              transactions: filtered.map((r) => ({
                id: r.code || String(r.id),
                date: r.date ? String(r.date).slice(0, 10) : '',
                type: r.type || 'income',
                category: r.category || 'Chung',
                description: r.description || '',
                amount: Number(r.amount || 0),
                method: r.method || 'bank',
                status: r.status || 'completed',
                recipient: r.recipient || 'Học viên CLB',
              })),
            },
            auditMessage: `Tra cứu tài chính: Tổng thu ${totalIncome.toLocaleString('vi-VN')} đ, Số dư ${balance.toLocaleString('vi-VN')} đ.`,
          };
        } catch (err: any) {
          return {
            success: false,
            toolName: 'query_finance_records',
            error: `Lỗi truy vấn sổ quỹ tài chính: ${err?.message}`,
          };
        }
      },
    });

    // 3. TOOL: query_events_and_attendees (Event Agent Tool)
    this.registerTool({
      definition: {
        name: 'query_events_and_attendees',
        displayName: 'Tra cứu sự kiện, hội thảo & danh sách đại biểu',
        description:
          'Lấy danh sách các chương trình sự kiện, ngày giờ, địa điểm và tình hình đại biểu đăng ký.',
        category: 'calendar',
        safetyLevel: 'READ',
        requiredPermission: 'AI_READ_ANALYTICS',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['upcoming', 'completed', 'all'],
              description: 'Trạng thái sự kiện (sắp diễn ra, đã hoàn tất, tất cả)',
              default: 'upcoming',
            },
            limit: {
              type: 'number',
              description: 'Số lượng sự kiện',
              default: 10,
            },
          },
        },
        returns: {
          type: 'array',
          description: 'Danh sách sự kiện và số lượng vé/đại biểu đăng ký',
        },
      },
      execute: async (params, context) => {
        try {
          const events = await this.prisma.$queryRawUnsafe<any[]>(`
            SELECT id, name, description, date, location, status, max_attendees, banner
            FROM public.events
            ORDER BY date DESC
            LIMIT 10
          `).catch(() => [] as any[]);

          const formatted = await Promise.all(
            events.map(async (ev) => {
              const regCountRaw = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT count(*)::int as count FROM public.event_registrations WHERE event_id = $1`,
                ev.id,
              ).catch(() => [{ count: 0 }]);

              const regCount = Number(regCountRaw[0]?.count || 0);

              return {
                id: ev.id,
                title: ev.name,
                description: ev.description || '',
                date: ev.date ? new Date(ev.date).toLocaleDateString('vi-VN') : 'Đang cập nhật',
                location: ev.location || 'Hà Nội',
                status: ev.status || 'open',
                registeredCount: regCount,
                maxAttendees: ev.max_attendees || 150,
              };
            }),
          );

          return {
            success: true,
            toolName: 'query_events_and_attendees',
            data: {
              events: formatted,
            },
            auditMessage: `Đã tra cứu ${formatted.length} sự kiện thực tế trong hệ thống.`,
          };
        } catch (err: any) {
          return {
            success: false,
            toolName: 'query_events_and_attendees',
            error: `Lỗi tra cứu sự kiện: ${err?.message}`,
          };
        }
      },
    });

    // 4. TOOL: prepare_email_broadcast (Email Preview Tool - SafetyLevel: PREVIEW)
    this.registerTool({
      definition: {
        name: 'prepare_email_broadcast',
        displayName: 'Soạn thảo & đối soát danh sách gửi email hàng loạt',
        description:
          'Tạo bản xem trước nội dung email cá nhân hóa, kiểm tra tính hợp lệ và loại bỏ email trùng lặp trước khi gửi.',
        category: 'email',
        safetyLevel: 'PREVIEW',
        requiredPermission: 'AI_SEND_EVENT_NOTICES',
        contextContract: {
          consumes: ['preparedList', 'missingRecipients', 'meetingDetails', 'googleCalendarUrl', 'onlineLink'],
          produces: ['emailDraft', 'batchId', 'idempotencyKey'],
          transformParams: (currentParams, context) => {
            const params = { ...currentParams };
            let handoffSummary: string | undefined;

            const recipientsToUse =
              (context.missingRecipients && context.missingRecipients.length > 0)
                ? context.missingRecipients
                : context.preparedList;

            if (recipientsToUse && (!params.recipients || params.recipients === '[]')) {
              params.recipients = JSON.stringify(recipientsToUse);
              handoffSummary = `Đã tự động nạp ${recipientsToUse.length} người nhận từ bước trước.`;
            }

            if (context.meetingDetails) {
              const m = context.meetingDetails;
              params.subjectTemplate =
                params.subjectTemplate || `[CEO HN10] Thư Mời Tham Dự: ${m.title} - Kính gửi {ho_ten}`;
              params.bodyTemplate =
                params.bodyTemplate ||
                `Kính gửi Anh/Chị {ho_ten} ({cong_ty}),\n\nBan Điều Hành CLB Doanh Nhân CEO HN10 xin trân trọng kính mời Anh/Chị tham dự cuộc họp:\n- Nội dung: ${m.title}\n- Thời gian: ${m.date} lúc ${m.time}\n- Địa điểm: ${m.location}\n${context.onlineLink ? `- Phòng họp trực tuyến: ${context.onlineLink}\n` : ''}${context.googleCalendarUrl ? `- Thêm nhanh vào Google Calendar: ${context.googleCalendarUrl}\n` : ''}\nKính mong Anh/Chị tham gia đầy đủ và đúng giờ!`;
              handoffSummary =
                (handoffSummary ? handoffSummary + ' ' : '') +
                `Đã tích hợp lịch họp "${m.title}", link phòng họp trực tuyến và Google Calendar vào mẫu thư mời.`;
            }

            return { params, handoffSummary };
          },
          extractContext: (resultData, currentParams) => ({
            emailDraft: {
              subjectTemplate: currentParams.subjectTemplate,
              bodyTemplate: currentParams.bodyTemplate,
              sampleRecipients: resultData?.sampleRecipients || [],
              totalCount: resultData?.totalCount || 0,
            },
            batchId: resultData?.batchId,
            idempotencyKey: resultData?.idempotencyKey,
            preparedList: resultData?.sampleRecipients || [],
          }),
        },
        parameters: {
          type: 'object',
          properties: {
            subjectTemplate: {
              type: 'string',
              description: 'Tiêu đề email (hỗ trợ biến {ho_ten}, {cong_ty})',
            },
            bodyTemplate: {
              type: 'string',
              description: 'Nội dung email dạng HTML hoặc text chuẩn doanh nhân',
            },
            recipients: {
              type: 'string',
              description: 'Danh sách đối tượng nhận (JSON mảng hoặc chuỗi phân loại)',
            },
          },
          required: ['subjectTemplate', 'bodyTemplate'],
        },
        returns: {
          type: 'object',
          description: 'Bản xem trước gửi thư kèm thống kê số người nhận hợp lệ',
        },
      },
      execute: async (params, context) => {
        let recipientList: Array<{ name: string; email: string; company?: string }> = [];

        // Parse danh sách người nhận nếu được truyền vào
        if (Array.isArray(params.recipients)) {
          recipientList = params.recipients;
        } else if (typeof params.recipients === 'string' && params.recipients.startsWith('[')) {
          try {
            recipientList = JSON.parse(params.recipients);
          } catch {}
        }

        // Nếu chưa có danh sách, tra cứu từ database hội viên
        if (recipientList.length === 0) {
          try {
            const members = await this.prisma.$queryRawUnsafe<any[]>(`
              SELECT full_name, email, company FROM public.members
              WHERE email IS NOT NULL AND email != ''
              LIMIT 50
            `).catch(() => [] as any[]);

            recipientList = members.map((m) => ({
              name: m.full_name || 'Học viên CEO HN10',
              email: m.email,
              company: m.company || 'Doanh nghiệp CLB',
            }));
          } catch {}
        }

        // Lọc trùng và kiểm tra định dạng email
        const seenEmails = new Set<string>();
        const validRecipients: Array<{ name: string; email: string; company?: string }> = [];
        const invalidRecipients: Array<{ name: string; email: string }> = [];

        for (const item of recipientList) {
          const email = (item.email || '').trim().toLowerCase();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (email && emailRegex.test(email)) {
            if (!seenEmails.has(email)) {
              seenEmails.add(email);
              validRecipients.push({
                name: item.name || 'Quý Hội viên',
                email,
                company: item.company || '',
              });
            }
          } else {
            invalidRecipients.push({ name: item.name || 'Chưa rõ', email: item.email || '' });
          }
        }

        // Sinh bản xem trước cho người nhận đầu tiên
        const sample = validRecipients[0] || {
          name: 'Nguyễn Văn Hùng',
          email: 'sample@ceohn10.vn',
          company: 'Công ty Cổ phần Alpha',
        };

        const sampleSubject = (params.subjectTemplate || '')
          .replace(/{ho_ten}/g, sample.name)
          .replace(/{cong_ty}/g, sample.company || '');

        const sampleBody = (params.bodyTemplate || '')
          .replace(/{ho_ten}/g, sample.name)
          .replace(/{cong_ty}/g, sample.company || '');

        return {
          success: true,
          toolName: 'prepare_email_broadcast',
          requiresApproval: true,
          approvalPayload: {
            actionType: 'batch_email',
            summary: `Chuẩn bị gửi email tới ${validRecipients.length} người nhận (${invalidRecipients.length} email không hợp lệ bị loại bỏ)`,
            recipientsCount: validRecipients.length,
            previewData: {
              sampleRecipient: sample,
              sampleSubject,
              sampleBody,
              totalValid: validRecipients.length,
              totalInvalid: invalidRecipients.length,
            },
          },
          data: {
            validRecipients,
            invalidCount: invalidRecipients.length,
            samplePreview: {
              subject: sampleSubject,
              body: sampleBody,
            },
          },
          auditMessage: `Đã chuẩn bị bản xem trước gửi thư: ${validRecipients.length} người nhận hợp lệ. Đang chờ quản trị viên phê duyệt.`,
        };
      },
    });

    // 5. TOOL: dispatch_batch_email (Email Action Tool - SafetyLevel: EXTERNAL_ACTION)
    this.registerTool({
      definition: {
        name: 'dispatch_batch_email',
        displayName: 'Thực thi phát lệnh gửi email thực tế (SMTP Gmail)',
        description:
          'Gửi email thực tế đến danh sách người nhận thông qua SMTP Gmail. Bắt buộc có sự xác nhận của quản trị viên (Approved = true).',
        category: 'email',
        safetyLevel: 'EXTERNAL_ACTION',
        requiredPermission: 'AI_SEND_EVENT_NOTICES',
        contextContract: {
          consumes: ['emailDraft', 'preparedList', 'batchId', 'idempotencyKey'],
          produces: ['dispatchResult', 'failedEmails', 'successCount'],
          transformParams: (currentParams, context) => {
            const params = { ...currentParams };
            let handoffSummary: string | undefined;

            if ((!params.recipients || params.recipients === '[]') && context.preparedList) {
              params.recipients = JSON.stringify(context.preparedList);
              handoffSummary = `Đã nạp ${context.preparedList.length} người nhận từ bản xem trước.`;
            }
            if (!params.subject && context.emailDraft?.subjectTemplate) {
              params.subject = context.emailDraft.subjectTemplate;
            }
            if (!params.htmlContent && context.emailDraft?.bodyTemplate) {
              params.htmlContent = context.emailDraft.bodyTemplate;
            }
            if (!params.batchId && context.batchId) {
              params.batchId = context.batchId;
            }
            if (!params.idempotencyKey && context.idempotencyKey) {
              params.idempotencyKey = context.idempotencyKey;
            }

            return { params, handoffSummary };
          },
          extractContext: (resultData) => ({
            dispatchResult: resultData,
            failedEmails: resultData?.failedEmails || [],
            successCount: resultData?.successCount || 0,
          }),
        },
        parameters: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'Tiêu đề email chính thức',
            },
            htmlContent: {
              type: 'string',
              description: 'Nội dung email HTML chính thức',
            },
            recipients: {
              type: 'string',
              description: 'Mảng danh sách người nhận đã được chuẩn hóa',
            },
            idempotencyKey: {
              type: 'string',
              description: 'Khóa chống gửi trùng lặp (Idempotency Key)',
            },
            batchId: {
              type: 'string',
              description: 'Mã mẻ gửi thư để quản lý theo dõi',
            },
          },
          required: ['subject', 'htmlContent', 'recipients'],
        },
        returns: {
          type: 'object',
          description: 'Kết quả số email đã gửi thành công, thất bại, đã gửi trước đó và danh sách chi tiết',
        },
      },
      execute: async (params, context) => {
        // Khởi tạo bảng lưu vết email nếu chưa tồn tại trên CSDL 113.20.107.184:6432
        await this.prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS public.ai_email_dispatches (
            id VARCHAR(64) PRIMARY KEY,
            batch_id VARCHAR(64) NOT NULL,
            idempotency_key VARCHAR(128) NOT NULL,
            recipient_email VARCHAR(255) NOT NULL,
            recipient_name VARCHAR(255),
            company VARCHAR(255),
            subject TEXT NOT NULL,
            html_body TEXT,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            error_reason TEXT,
            retry_count INT DEFAULT 0,
            created_by VARCHAR(64),
            sent_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT now()
          );
          CREATE INDEX IF NOT EXISTS idx_ai_email_batch ON public.ai_email_dispatches(batch_id);
          CREATE INDEX IF NOT EXISTS idx_ai_email_idempotency ON public.ai_email_dispatches(idempotency_key);
          CREATE INDEX IF NOT EXISTS idx_ai_email_status ON public.ai_email_dispatches(status);
        `).catch(() => {});

        // Kiểm tra thẩm quyền phê duyệt
        if (!context.approved) {
          return {
            success: false,
            toolName: 'dispatch_batch_email',
            requiresApproval: true,
            error:
              'Hành động bên ngoài bị chặn: BẮT BUỘC phải có xác nhận (Approval) từ Quản trị viên trước khi gửi email hàng loạt.',
          };
        }

        const batchId = params.batchId || `batch_${Date.now()}`;
        const idempotencyKey = params.idempotencyKey || `idem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        let recipients: Array<{ email: string; name?: string; company?: string }> = [];
        if (Array.isArray(params.recipients)) {
          recipients = params.recipients;
        } else if (typeof params.recipients === 'string') {
          try {
            recipients = JSON.parse(params.recipients);
          } catch {
            recipients = [{ email: params.recipients }];
          }
        }

        let successCount = 0;
        let failCount = 0;
        let alreadySentCount = 0;
        const failedEmails: Array<{ email: string; reason: string }> = [];
        const dispatchDetails: Array<{ email: string; name?: string; status: string; reason?: string }> = [];

        // Gửi thực tế qua SMTP Gmail (xử lý an toàn theo mẻ tối đa 50 email)
        const batch = recipients.slice(0, 50);

        for (const r of batch) {
          const recipientEmail = (r.email || '').trim().toLowerCase();
          if (!recipientEmail || !recipientEmail.includes('@')) continue;

          // 1. KIỂM TRA CHỐNG GỬI TRÙNG (IDEMPOTENCY CHECK)
          const existing = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT id, status FROM public.ai_email_dispatches 
             WHERE idempotency_key = $1 AND recipient_email = $2 AND status = 'sent' LIMIT 1`,
            idempotencyKey,
            recipientEmail,
          ).catch(() => []);

          if (existing && existing.length > 0) {
            alreadySentCount++;
            dispatchDetails.push({
              email: recipientEmail,
              name: r.name,
              status: 'already_sent',
              reason: 'Bỏ qua: Email này đã được gửi thành công trước đó trong cùng phiên (Idempotent)',
            });
            continue;
          }

          // 2. GỬI THỰC TẾ QUA SMTP GMAIL
          const dispatchId = `disp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          try {
            const subjectPersonalized = (params.subject || '').replace(/{ho_ten}/g, r.name || 'Quý Hội viên');
            const bodyPersonalized = (params.htmlContent || '').replace(/{ho_ten}/g, r.name || 'Quý Hội viên');

            await this.mailService.sendDirectEmail({
              to: recipientEmail,
              subject: subjectPersonalized,
              html: bodyPersonalized,
              fromName: 'CLB Doanh Nhân CEO HN10 (HanoiBA)',
            });

            successCount++;
            dispatchDetails.push({ email: recipientEmail, name: r.name, status: 'sent' });

            // Lưu vết thành công vào CSDL 113.20.107.184
            await this.prisma.$executeRawUnsafe(
              `INSERT INTO public.ai_email_dispatches (
                id, batch_id, idempotency_key, recipient_email, recipient_name, company,
                subject, html_body, status, created_by, sent_at, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sent', $9, now(), now())
              ON CONFLICT (id) DO UPDATE SET status = 'sent', sent_at = now()`,
              dispatchId,
              batchId,
              idempotencyKey,
              recipientEmail,
              r.name || '',
              r.company || '',
              params.subject,
              params.htmlContent,
              context.userId || 'admin',
            ).catch(() => {});
          } catch (err: any) {
            failCount++;
            const errMsg = err?.message || 'Lỗi kết nối SMTP';
            failedEmails.push({ email: recipientEmail, reason: errMsg });
            dispatchDetails.push({ email: recipientEmail, name: r.name, status: 'failed', reason: errMsg });

            // Lưu vết thất bại vào CSDL để hỗ trợ tính năng gửi lại (Retry)
            await this.prisma.$executeRawUnsafe(
              `INSERT INTO public.ai_email_dispatches (
                id, batch_id, idempotency_key, recipient_email, recipient_name, company,
                subject, html_body, status, error_reason, created_by, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'failed', $9, $10, now())
              ON CONFLICT (id) DO UPDATE SET status = 'failed', error_reason = $9`,
              dispatchId,
              batchId,
              idempotencyKey,
              recipientEmail,
              r.name || '',
              r.company || '',
              params.subject,
              params.htmlContent,
              errMsg,
              context.userId || 'admin',
            ).catch(() => {});
          }
        }

        // Ghi nhận vào bảng notifications hệ thống
        try {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.notifications (
              id, tenant_id, kind, title, description, occurred_at, created_at
            ) VALUES (
              gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'info',
              $1, $2, now(), now()
            )`,
            `[AI Email] ${params.subject.slice(0, 100)}`,
            `Đã gửi thành công ${successCount}/${batch.length} email. Thất bại: ${failCount}. Trùng lặp bỏ qua: ${alreadySentCount}. (Batch: ${batchId})`,
          );
        } catch {}

        return {
          success: true,
          toolName: 'dispatch_batch_email',
          data: {
            batchId,
            idempotencyKey,
            totalAttempted: batch.length,
            successCount,
            failCount,
            alreadySentCount,
            failedEmails,
            dispatchDetails,
            canRetry: failCount > 0,
            summary: `Đã gửi thực tế: ${successCount} thành công, ${failCount} thất bại, ${alreadySentCount} bỏ qua chống trùng lặp.`,
          },
          auditMessage: `Đã phát hành email thực tế: ${successCount} thành công, ${failCount} thất bại qua máy chủ SMTP Gmail.`,
        };
      },
    });

    // 9. TOOL: resend_failed_emails (Email Agent - Retry Failed Only Tool)
    this.registerTool({
      definition: {
        name: 'resend_failed_emails',
        displayName: 'Gửi lại các email thất bại (Chống gửi trùng lặp)',
        description:
          'Tìm kiếm các email gửi thất bại trong mẻ gửi trước đó và chỉ gửi lại cho những người chưa nhận được thư, tuyệt đối không gửi lại cho người đã nhận thành công.',
        category: 'email',
        safetyLevel: 'EXTERNAL_ACTION',
        requiredPermission: 'AI_MANAGE_COMMUNICATIONS',
        parameters: {
          type: 'object',
          properties: {
            batchId: {
              type: 'string',
              description: 'Mã mẻ gửi thư cần gửi lại',
            },
            idempotencyKey: {
              type: 'string',
              description: 'Khóa phiên gửi thư',
            },
          },
        },
        returns: {
          type: 'object',
          description: 'Kết quả số email gửi lại thành công và số email vẫn còn lỗi',
        },
      },
      execute: async (params, context) => {
        // Kiểm tra quyền phê duyệt
        if (!context.approved) {
          return {
            success: false,
            toolName: 'resend_failed_emails',
            requiresApproval: true,
            error: 'Yêu cầu Quản trị viên phê duyệt trước khi gửi lại các email thất bại.',
          };
        }

        // Lấy danh sách các email bị failed từ CSDL chuẩn 113.20.107.184
        const failedRecords = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT id, recipient_email, recipient_name, subject, html_body, retry_count
           FROM public.ai_email_dispatches
           WHERE status = 'failed'
             ${params.batchId ? `AND batch_id = '${params.batchId}'` : ''}
             ${params.idempotencyKey ? `AND idempotency_key = '${params.idempotencyKey}'` : ''}
           ORDER BY created_at DESC
           LIMIT 50`,
        ).catch(() => []);

        if (failedRecords.length === 0) {
          return {
            success: true,
            toolName: 'resend_failed_emails',
            data: {
              totalFailedFound: 0,
              resentSuccessCount: 0,
              message: 'Không tìm thấy email nào ở trạng thái thất bại cần gửi lại.',
            },
          };
        }

        let resentSuccess = 0;
        let stillFailed = 0;
        const failedRemaining: Array<{ email: string; reason: string }> = [];

        for (const item of failedRecords) {
          const email = (item.recipient_email || '').trim();
          try {
            await this.mailService.sendDirectEmail({
              to: email,
              subject: item.subject,
              html: item.html_body,
              fromName: 'CLB Doanh Nhân CEO HN10 (HanoiBA)',
            });

            resentSuccess++;
            // Cập nhật trạng thái thành 'sent' trong CSDL
            await this.prisma.$executeRawUnsafe(
              `UPDATE public.ai_email_dispatches
               SET status = 'sent', sent_at = now(), retry_count = retry_count + 1, error_reason = NULL
               WHERE id = $1`,
              item.id,
            ).catch(() => {});
          } catch (err: any) {
            stillFailed++;
            const errMsg = err?.message || 'Lỗi gửi lại SMTP';
            failedRemaining.push({ email, reason: errMsg });

            await this.prisma.$executeRawUnsafe(
              `UPDATE public.ai_email_dispatches
               SET retry_count = retry_count + 1, error_reason = $1
               WHERE id = $2`,
              errMsg,
              item.id,
            ).catch(() => {});
          }
        }

        return {
          success: true,
          toolName: 'resend_failed_emails',
          data: {
            totalAttempted: failedRecords.length,
            resentSuccessCount: resentSuccess,
            stillFailedCount: stillFailed,
            failedRemaining,
            summary: `Đã gửi lại thành công ${resentSuccess}/${failedRecords.length} email. Còn ${stillFailed} email lỗi.`,
          },
          auditMessage: `Gửi lại email thất bại: ${resentSuccess} thành công, ${stillFailed} còn lỗi.`,
        };
      },
    });

    // 10. TOOL: query_email_history (Email Agent - Lịch Sử Phát Hành Thư)
    this.registerTool({
      definition: {
        name: 'query_email_history',
        displayName: 'Tra cứu nhật ký & lịch sử gửi thư điện tử',
        description:
          'Truy vấn lịch sử các email đã phát hành qua hệ thống AI từ CSDL, thống kê tỷ lệ gửi thành công, thất bại và danh sách người nhận.',
        category: 'email',
        safetyLevel: 'READ',
        requiredPermission: 'AI_MANAGE_COMMUNICATIONS',
        parameters: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Từ khóa tìm kiếm theo tiêu đề hoặc email người nhận',
            },
            status: {
              type: 'string',
              description: 'Trạng thái cần lọc: "sent", "failed", hoặc "all"',
              enum: ['sent', 'failed', 'all'],
            },
            limit: {
              type: 'number',
              description: 'Số lượng bản ghi tối đa (mặc định 30)',
            },
          },
        },
        returns: {
          type: 'object',
          description: 'Danh sách nhật ký phát hành email và thống kê tỷ lệ thành công',
        },
      },
      execute: async (params, context) => {
        const limit = Math.min(Number(params.limit || 30), 100);
        const status = params.status || 'all';
        const keyword = (params.keyword || '').trim().replace(/'/g, "''");

        let whereClause = '1=1';
        if (status !== 'all') {
          whereClause += ` AND status = '${status}'`;
        }
        if (keyword) {
          whereClause += ` AND (recipient_email ILIKE '%${keyword}%' OR recipient_name ILIKE '%${keyword}%' OR subject ILIKE '%${keyword}%')`;
        }

        const logs = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT id, batch_id, idempotency_key, recipient_email, recipient_name, subject,
                  status, error_reason, retry_count, sent_at, created_at
           FROM public.ai_email_dispatches
           WHERE ${whereClause}
           ORDER BY created_at DESC
           LIMIT ${limit}`,
        ).catch(() => []);

        // Thống kê tổng quan
        const stats = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT 
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
             COUNT(*) FILTER (WHERE status = 'failed') as failed_count
           FROM public.ai_email_dispatches`,
        ).catch(() => [{ total: 0, sent_count: 0, failed_count: 0 }]);

        return {
          success: true,
          toolName: 'query_email_history',
          data: {
            totalLogs: logs.length,
            overallStats: stats[0] || { total: 0, sent_count: 0, failed_count: 0 },
            logs: logs.map((l) => ({
              id: l.id,
              batchId: l.batch_id,
              email: l.recipient_email,
              name: l.recipient_name,
              subject: l.subject,
              status: l.status,
              errorReason: l.error_reason,
              retryCount: l.retry_count,
              sentAt: l.sent_at,
              createdAt: l.created_at,
            })),
          },
          auditMessage: `Tra cứu nhật ký email: Tìm thấy ${logs.length} bản ghi trong CSDL.`,
        };
      },
    });

    // 6. TOOL: create_calendar_meeting (Calendar & Meeting Action Tool - SafetyLevel: WRITE)
    this.registerTool({
      definition: {
        name: 'create_calendar_meeting',
        displayName: 'Tạo lịch cuộc họp, sự kiện & kết nối B2B (Google Calendar / ICS)',
        description:
          'Tạo lịch họp ban, sự kiện diễn đàn hoặc gặp gỡ B2B; tự động kiểm tra xung đột thời gian, tự động tra cứu email đại biểu từ CSDL hội viên, lưu vào CSDL hệ thống, sinh phòng họp trực tuyến và tạo link Google Calendar / iCalendar.',
        category: 'calendar',
        safetyLevel: 'WRITE',
        requiredPermission: 'AI_SEND_EVENT_NOTICES',
        contextContract: {
          consumes: ['eventDetails', 'preparedList'],
          produces: ['meetingDetails', 'googleCalendarUrl', 'onlineLink', 'preparedList'],
          transformParams: (currentParams, context) => {
            const detected = context.eventDetails;
            const params = { ...currentParams };
            let handoffSummary: string | undefined;

            if (detected) {
              if (!params.title || params.title === 'Cuộc họp Ban CLB Doanh Nhân CEO HN10') {
                params.title = detected.title || params.title;
              }
              if (!params.date && detected.date) params.date = detected.date;
              if ((!params.time || params.time === '09:00') && detected.time) params.time = detected.time;
              if (!params.location || params.location.includes('Phòng họp Trực tuyến')) {
                params.location = detected.location || params.location;
              }
              if ((!params.attendeeNames || params.attendeeNames.length === 0) && detected.attendees?.length > 0) {
                params.attendeeNames = detected.attendees;
              }
              handoffSummary = `Đã tự động tiếp nhận ngày giờ (${params.date} ${params.time}), địa điểm và ${params.attendeeNames?.length || 0} đại biểu từ bước bóc tách tài liệu.`;
            }

            if (context.preparedList && (!params.attendeeEmails || params.attendeeEmails.length === 0)) {
              const emails = context.preparedList.map((p: any) => p.email).filter(Boolean);
              if (emails.length > 0) {
                params.attendeeEmails = emails;
                handoffSummary = (handoffSummary ? handoffSummary + ' ' : '') + `Đã nạp ${emails.length} email đại biểu từ danh sách tài liệu.`;
              }
            }

            return { params, handoffSummary };
          },
          extractContext: (resultData) => ({
            meetingDetails: {
              id: resultData?.meetingId || resultData?.eventId,
              title: resultData?.title,
              date: resultData?.date,
              time: resultData?.time,
              location: resultData?.location,
            },
            googleCalendarUrl: resultData?.googleCalendarUrl,
            onlineLink: resultData?.onlineLink,
            preparedList: resultData?.preparedList || [],
          }),
        },
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Tên cuộc họp hoặc sự kiện',
            },
            scheduledAt: {
              type: 'string',
              description: 'Thời gian bắt đầu (định dạng ISO, YYYY-MM-DD HH:mm hoặc DD/MM/YYYY HH:mm)',
            },
            date: {
              type: 'string',
              description: 'Ngày tổ chức (ví dụ: 2026-11-25 hoặc 25/11/2026)',
            },
            time: {
              type: 'string',
              description: 'Giờ bắt đầu (ví dụ: 09:00 hoặc 9h)',
            },
            endTime: {
              type: 'string',
              description: 'Giờ hoặc thời gian kết thúc (ví dụ: 11:30 hoặc ISO)',
            },
            location: {
              type: 'string',
              description: 'Địa điểm tổ chức offline hoặc phòng họp trực tuyến',
            },
            description: {
              type: 'string',
              description: 'Nội dung, chương trình nghị sự cuộc họp',
            },
            eventType: {
              type: 'string',
              enum: ['meeting', 'forum', 'workshop', 'b2b'],
              description: 'Loại sự kiện (meeting: cuộc họp ban, forum: diễn đàn lớn, workshop: hội thảo, b2b: kết nối)',
            },
            attendeeNames: {
              type: 'array',
              items: { type: 'string' },
              description: 'Danh sách họ tên đại biểu tham gia (hệ thống sẽ tự động tra cứu email từ CSDL public.members)',
            },
            attendeeEmails: {
              type: 'array',
              items: { type: 'string' },
              description: 'Danh sách email đại biểu (nếu có sẵn)',
            },
            checkConflict: {
              type: 'boolean',
              description: 'Tự động kiểm tra xung đột thời gian với các sự kiện/cuộc họp khác trong ngày (mặc định true)',
            },
            isOnline: {
              type: 'boolean',
              description: 'Tự động tạo phòng họp trực tuyến bảo mật Jitsi/Meet (mặc định true)',
            },
          },
          required: ['title'],
        },
        returns: {
          type: 'object',
          description: 'Chi tiết sự kiện đã tạo, link Google Calendar, chuỗi .ics, cảnh báo xung đột và danh sách đại biểu kèm email',
        },
      },
      execute: async (params, context) => {
        try {
          const title = params.title || 'Cuộc họp Ban CLB Doanh Nhân CEO HN10';
          const description = params.description || 'Cuộc họp triển khai kế hoạch hoạt động của CEOHN10 CEO HN10';
          const eventType = params.eventType || 'meeting';

          // 1. Phân tích & chuẩn hóa thời gian bắt đầu
          let startDate: Date;
          if (params.scheduledAt) {
            const parsed = new Date(params.scheduledAt);
            if (!isNaN(parsed.getTime())) {
              startDate = parsed;
            } else {
              const match = String(params.scheduledAt).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2})[:h](\d{2})?)?/);
              if (match) {
                const d = parseInt(match[1], 10);
                const m = parseInt(match[2], 10) - 1;
                const y = parseInt(match[3], 10);
                const h = match[4] ? parseInt(match[4], 10) : 9;
                const min = match[5] ? parseInt(match[5], 10) : 0;
                startDate = new Date(y, m, d, h, min);
              } else {
                startDate = new Date();
              }
            }
          } else if (params.date) {
            let d = 25, m = 10, y = 2026;
            const match = String(params.date).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (match) {
              d = parseInt(match[1], 10);
              m = parseInt(match[2], 10) - 1;
              y = parseInt(match[3], 10);
            } else {
              const isoMatch = String(params.date).match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
              if (isoMatch) {
                y = parseInt(isoMatch[1], 10);
                m = parseInt(isoMatch[2], 10) - 1;
                d = parseInt(isoMatch[3], 10);
              }
            }
            let h = 9, min = 0;
            if (params.time) {
              const timeMatch = String(params.time).match(/(\d{1,2})[:h](\d{2})?/i);
              if (timeMatch) {
                h = parseInt(timeMatch[1], 10);
                min = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
              }
            }
            startDate = new Date(y, m, d, h, min);
          } else {
            startDate = new Date();
            startDate.setDate(startDate.getDate() + 1);
            startDate.setHours(9, 0, 0, 0);
          }

          // 2. Phân tích thời gian kết thúc
          let endDate: Date;
          if (params.endTime) {
            const endParsed = new Date(params.endTime);
            if (!isNaN(endParsed.getTime())) {
              endDate = endParsed;
            } else {
              const endMatch = String(params.endTime).match(/(\d{1,2})[:h](\d{2})?/i);
              if (endMatch) {
                endDate = new Date(startDate);
                endDate.setHours(parseInt(endMatch[1], 10), endMatch[2] ? parseInt(endMatch[2], 10) : 0);
              } else {
                endDate = new Date(startDate.getTime() + 90 * 60 * 1000); // Mặc định 1.5 tiếng
              }
            }
          } else {
            endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
          }

          const safeDateStr = startDate.toISOString().split('T')[0];
          const startTimeStr = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
          const endTimeStr = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

          // 3. Kiểm tra xung đột lịch trình (Conflict Detection)
          const conflictingEvents: any[] = [];
          if (params.checkConflict !== false) {
            const evRows = await this.prisma.$queryRawUnsafe<any[]>(
              `SELECT id, name as title, date, location, 'event' as type
               FROM public.events
               WHERE date = $1::date AND status != 'cancelled'
               LIMIT 5`,
              safeDateStr,
            ).catch(() => []);

            const mtRows = await this.prisma.$queryRawUnsafe<any[]>(
              `SELECT id, code, title, date, time, location, 'meeting' as type
               FROM public.meetings
               WHERE date = $1::date AND status != 'cancelled'
               LIMIT 5`,
              safeDateStr,
            ).catch(() => []);

            for (const ev of evRows) {
              conflictingEvents.push({
                id: ev.id,
                title: ev.title,
                time: 'Sự kiện cả ngày',
                location: ev.location,
                type: 'event',
              });
            }

            for (const mt of mtRows) {
              conflictingEvents.push({
                id: mt.id || mt.code,
                title: mt.title,
                time: mt.time || 'Chưa định',
                location: mt.location,
                type: 'meeting',
              });
            }
          }
          const conflictDetected = conflictingEvents.length > 0;

          // 4. Tra cứu đại biểu từ CSDL public.members
          let rawNames: string[] = [];
          if (Array.isArray(params.attendeeNames)) {
            rawNames = params.attendeeNames;
          } else if (typeof params.attendeeNames === 'string' && params.attendeeNames.trim()) {
            rawNames = (params.attendeeNames as string)
              .split(/,|\bvà\b|;/)
              .map((s) => s.trim())
              .filter((s) => s.length > 1);
          }

          let rawEmails: string[] = [];
          if (Array.isArray(params.attendeeEmails)) {
            rawEmails = params.attendeeEmails;
          } else if (typeof params.attendeeEmails === 'string' && params.attendeeEmails.trim()) {
            rawEmails = (params.attendeeEmails as string)
              .split(/[,;\s]+/)
              .filter((e) => e.includes('@'));
          }

          const matchedAttendees: Array<{
            name: string;
            code?: string;
            email: string | null;
            phone?: string;
            company?: string;
            role?: string;
            status: 'matched' | 'manual' | 'not_found';
          }> = [];

          for (const rawName of rawNames) {
            const trimmed = rawName.trim();
            if (!trimmed) continue;

            const foundMembers = await this.prisma.$queryRawUnsafe<any[]>(
              `SELECT id, code, name, email, phone, company, role, executive_role
               FROM public.members
               WHERE (name ILIKE $1 OR name ILIKE $2)
                 AND email IS NOT NULL AND email != ''
               LIMIT 1`,
              `%${trimmed}%`,
              `%${trimmed.split(' ').slice(-2).join(' ')}%`,
            ).catch(() => []);

            if (foundMembers.length > 0) {
              const m = foundMembers[0];
              matchedAttendees.push({
                name: m.name || trimmed,
                code: m.code,
                email: m.email,
                phone: m.phone,
                company: m.company,
                role: m.executive_role || m.role,
                status: 'matched',
              });
            } else {
              const manualEmail = rawEmails.shift() || null;
              matchedAttendees.push({
                name: trimmed,
                email: manualEmail,
                status: manualEmail ? 'manual' : 'not_found',
              });
            }
          }

          for (const remEmail of rawEmails) {
            if (!matchedAttendees.some((a) => a.email === remEmail)) {
              matchedAttendees.push({
                name: remEmail.split('@')[0],
                email: remEmail,
                status: 'manual',
              });
            }
          }

          // 5. Sinh link phòng họp online & định dạng địa điểm
          const meetingCode = `MEET-${Date.now().toString().slice(-6)}`;
          const onlineLink = params.isOnline !== false ? `https://meet.jit.si/ceohn10_${meetingCode}` : '';
          const location = params.location || 'Phòng họp Trực tuyến Jitsi Meet CEO HN10';
          const locationDisplay = onlineLink && !location.includes('http')
            ? `${location} (Link: ${onlineLink})`
            : location;

          // Lấy association_id
          const assocRows = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT id FROM public.associations LIMIT 1`,
          ).catch(() => []);
          const assocId = assocRows[0]?.id || null;

          // 6. Ghi CSDL thực tế (public.meetings hoặc public.events)
          const recordId = `meet_${Date.now()}`;
          if (eventType === 'forum' || eventType === 'workshop') {
            const eventId = `evt_${Date.now()}`;
            await this.prisma.$executeRawUnsafe(
              `INSERT INTO public.events (
                id, name, date, location, capacity, registered, status, type, association_id, description, created_at, updated_at
              ) VALUES (
                $1, $2, $3::date, $4, 100, $5, 'upcoming', $6, $7::uuid, $8, now(), now()
              )`,
              eventId,
              title,
              safeDateStr,
              locationDisplay,
              matchedAttendees.length,
              eventType,
              assocId,
              description,
            );

            // Tự động đăng ký đại biểu có email vào public.event_registrations
            for (const att of matchedAttendees) {
              if (att.email) {
                await this.prisma.$executeRawUnsafe(
                  `INSERT INTO public.event_registrations (
                    id, event_id, member_code, member_name, email, registered_at, status, ticket_type, association_id, created_at, updated_at
                  ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4, now()::date, 'confirmed', 'vip', $5::uuid, now(), now()
                  )`,
                  eventId,
                  att.code || `MEM-${Date.now().toString().slice(-4)}`,
                  att.name,
                  att.email,
                  assocId,
                ).catch(() => {});
              }
            }
          } else {
            const attendeeNamesStr = matchedAttendees
              .map((a) => `${a.name}${a.email ? ` (${a.email})` : ''}`)
              .join(', ');

            await this.prisma.$executeRawUnsafe(
              `INSERT INTO public.meetings (
                id, code, title, type, date, time, location, attendees, status, department, zoom_url, notes, association_id, created_at, updated_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4::date, $5, $6, $7, 'scheduled', 'Ban Điều Hành', $8, $9, $10::uuid, now(), now()
              )`,
              meetingCode,
              title,
              eventType,
              safeDateStr,
              `${startTimeStr} - ${endTimeStr}`,
              locationDisplay,
              attendeeNamesStr,
              onlineLink,
              description,
              assocId,
            );
          }

          // 7. Tạo Google Calendar render URL và chuỗi iCalendar (.ics)
          const startIsoUtc = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
          const endIsoUtc = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
          const gCalQuery = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            dates: `${startIsoUtc}/${endIsoUtc}`,
            details: `${description}\n\n${onlineLink ? `Phòng họp trực tuyến: ${onlineLink}\n` : ''}Thành phần tham gia: ${matchedAttendees.map((a) => a.name).join(', ')}`,
            location: locationDisplay,
          });
          const googleCalendarUrl = `https://calendar.google.com/calendar/render?${gCalQuery.toString()}`;

          const icsLines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//CEO HN10 (HanoiBA)//AI Calendar Agent//VI',
            'CALSCALE:GREGORIAN',
            'METHOD:REQUEST',
            'BEGIN:VEVENT',
            `UID:${meetingCode}@ceohn10.hanoiba.vn`,
            `DTSTAMP:${startIsoUtc}`,
            `DTSTART:${startIsoUtc}`,
            `DTEND:${endIsoUtc}`,
            `SUMMARY:${title.replace(/\n/g, ' ')}`,
            `DESCRIPTION:${description.replace(/\n/g, '\\n')}${onlineLink ? `\\nPhòng họp trực tuyến: ${onlineLink}` : ''}`,
            `LOCATION:${locationDisplay.replace(/\n/g, ' ')}`,
            'STATUS:CONFIRMED',
          ];
          if (onlineLink) icsLines.push(`URL:${onlineLink}`);
          for (const att of matchedAttendees) {
            if (att.email) {
              icsLines.push(`ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${att.name}:mailto:${att.email}`);
            }
          }
          icsLines.push('END:VEVENT', 'END:VCALENDAR');
          const icsData = icsLines.join('\r\n');

          // 8. Tạo danh sách đại biểu để handoff sang Email Agent
          const preparedList = matchedAttendees
            .filter((a) => !!a.email)
            .map((a) => ({
              name: a.name,
              email: a.email!,
              company: a.company || 'Hội viên CEO HN10',
              phone: a.phone || '',
              meetingTitle: title,
              meetingDate: safeDateStr,
              meetingTime: `${startTimeStr} - ${endTimeStr}`,
              location: locationDisplay,
              onlineLink,
              calendarUrl: googleCalendarUrl,
            }));

          return {
            success: true,
            toolName: 'create_calendar_meeting',
            data: {
              recordId,
              meetingCode,
              title,
              date: safeDateStr,
              time: `${startTimeStr} - ${endTimeStr}`,
              startTime: startTimeStr,
              endTime: endTimeStr,
              startIso: startDate.toISOString(),
              endIso: endDate.toISOString(),
              location: locationDisplay,
              onlineLink,
              googleCalendarUrl,
              icsData,
              conflictDetected,
              conflictingEvents,
              attendees: matchedAttendees,
              totalAttendees: matchedAttendees.length,
              matchedWithEmailCount: preparedList.length,
              preparedList,
              status: 'scheduled',
              summary: `Đã tạo thành công lịch "${title}" vào ngày ${safeDateStr} (${startTimeStr} - ${endTimeStr}). Đã tra cứu email cho ${preparedList.length}/${matchedAttendees.length} đại biểu từ CSDL hội viên.${conflictDetected ? ` (Lưu ý: Phát hiện ${conflictingEvents.length} sự kiện/họp trùng ngày).` : ''}`,
            },
            auditMessage: `Đã tạo lịch "${title}" (${safeDateStr} ${startTimeStr}) cho ${matchedAttendees.length} đại biểu.`,
          };
        } catch (err: any) {
          return {
            success: false,
            toolName: 'create_calendar_meeting',
            error: `Lỗi tạo sự kiện/lịch họp CSDL: ${err?.message}`,
          };
        }
      },
    });

    // 7. TOOL: parse_and_analyze_document (Document Agent Tool - Hỗ trợ đa tệp)
    this.registerTool({
      definition: {
        name: 'parse_and_analyze_document',
        displayName: 'Bóc tách văn bản, trích xuất sự kiện, bảng biểu & công việc',
        description:
          'Phân tích nội dung tài liệu Word/Excel/PDF/CSV, nhận diện tên sự kiện, ngày giờ, địa điểm, thành phần đại biểu, bảng biểu và đầu việc.',
        category: 'document',
        safetyLevel: 'READ',
        requiredPermission: 'AI_EXTRACT_DOCUMENTS',
        contextContract: {
          produces: ['preparedList', 'eventDetails', 'parsedFiles', 'taskItems', 'totalRecipients'],
          extractContext: (resultData) => ({
            preparedList: resultData?.preparedList || [],
            eventDetails: resultData?.analyzedFiles?.[0]?.detectedEvent || null,
            taskItems: resultData?.analyzedFiles?.[0]?.taskItems || [],
            parsedFiles: resultData?.analyzedFiles || [],
            totalRecipients: resultData?.totalRecipients || 0,
          }),
        },
        parameters: {
          type: 'object',
          properties: {
            documentText: {
              type: 'string',
              description: 'Nội dung text thô bóc tách từ tài liệu Word/Excel/PDF',
            },
            fileName: {
              type: 'string',
              description: 'Tên tệp tài liệu',
            },
            documents: {
              type: 'string',
              description: 'Chuỗi JSON danh sách nhiều tài liệu đính kèm (nếu gửi nhiều file)',
            },
          },
        },
        returns: {
          type: 'object',
          description: 'Cấu trúc thông tin trích xuất: Sự kiện, thời gian, đại biểu, công việc, danh sách email',
        },
      },
      execute: async (params, context) => {
        let docs: Array<{ fileName: string; documentText: string; tables?: any[] }> = [];

        if (params.documents) {
          try {
            const parsed = typeof params.documents === 'string' ? JSON.parse(params.documents) : params.documents;
            if (Array.isArray(parsed)) {
              docs = parsed.map((d: any) => ({
                fileName: d.fileName || d.name || 'document',
                documentText: d.documentText || d.rawText || d.text || '',
                tables: d.tables || [],
              }));
            }
          } catch {}
        }

        if (docs.length === 0) {
          docs.push({
            fileName: params.fileName || 'document.docx',
            documentText: params.documentText || '',
          });
        }

        const aggregatedRecipients: Array<{ name: string; email: string }> = [];
        const seenEmails = new Set<string>();
        const analyzedFiles: any[] = [];

        for (const doc of docs) {
          const text = doc.documentText;
          const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);

          // Trích xuất ngày giờ (RegEx)
          const dateMatch =
            text.match(/ngày\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i) ||
            text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
          const timeMatch = text.match(/(?:lúc|vào lúc\s+)?(\d{1,2})[h:](\d{2})?/i);

          // Trích xuất địa điểm
          const locationMatch = text.match(/(?:tại|ở|địa điểm:?)\s+([^\n,.]+)/i);

          // Trích xuất các đầu mối email
          const emailMatches = Array.from(
            new Set(text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []),
          );

          // Trích xuất đại biểu / người tham dự
          const attendeeMatch = text.match(/(?:thành phần tham dự|đại biểu|người tham gia)(?:[:\s]+)(?:gồm\s+)?([^\.\n]+)/i);
          const attendees = attendeeMatch
            ? attendeeMatch[1].split(/,|\bvà\b|\b;\b/).map((s) => s.trim()).filter((s) => s.length > 2 && !s.includes('@'))
            : [];

          // Trích xuất danh sách công việc (Task items)
          const taskItems: string[] = [];
          for (const line of lines) {
            if (/^(?:-|\*|\d+[\.\)])\s*(?:triển khai|chuẩn bị|báo cáo|liên hệ|hoàn thành|gửi|kiểm tra)/i.test(line)) {
              taskItems.push(line.replace(/^(?:-|\*|\d+[\.\)])\s*/, ''));
            }
          }

          emailMatches.forEach((em) => {
            const email = em.toLowerCase();
            if (!seenEmails.has(email)) {
              seenEmails.add(email);
              aggregatedRecipients.push({
                name: email.split('@')[0],
                email,
              });
            }
          });

          analyzedFiles.push({
            fileName: doc.fileName,
            detectedEvent: {
              date: dateMatch ? `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}` : null,
              time: timeMatch ? timeMatch[0] : null,
              location: locationMatch ? locationMatch[1].trim() : null,
              attendees,
            },
            emailsFoundCount: emailMatches.length,
            tasksCount: taskItems.length,
            taskItems,
          });
        }

        return {
          success: true,
          toolName: 'parse_and_analyze_document',
          data: {
            totalFiles: docs.length,
            analyzedFiles,
            preparedList: aggregatedRecipients,
            totalRecipients: aggregatedRecipients.length,
            summary: `Đã phân tích thành công ${docs.length} tệp tài liệu: Trích xuất ${aggregatedRecipients.length} email và nhận diện các thông tin sự kiện/nhiệm vụ.`,
          },
          auditMessage: `Đã bóc tách tài liệu: ${docs.map((d) => d.fileName).join(', ')} -> ${aggregatedRecipients.length} email.`,
        };
      },
    });

    // 8. TOOL: compare_and_reconcile_documents (Document Reconcile & Comparison Tool)
    this.registerTool({
      definition: {
        name: 'compare_and_reconcile_documents',
        displayName: 'So sánh & Đối chiếu tài liệu (Reconciliation)',
        description:
          'So sánh đối chiếu danh sách giữa 2 tệp tài liệu hoặc giữa tệp đính kèm với cơ sở dữ liệu hệ thống (tìm người chưa nộp phí, danh sách mới, lệch số tiền).',
        category: 'document',
        safetyLevel: 'READ',
        requiredPermission: 'AI_EXTRACT_DOCUMENTS',
        contextContract: {
          consumes: ['preparedList'],
          produces: ['reconcileResult', 'missingRecipients', 'matchedRecipients'],
          transformParams: (currentParams, context) => {
            const params = { ...currentParams };
            let handoffSummary: string | undefined;
            if (context.preparedList && (!params.targetEmails || params.targetEmails === '[]')) {
              const emails = context.preparedList.map((p: any) => p.email).filter(Boolean);
              params.targetEmails = JSON.stringify(emails);
              handoffSummary = `Đã tự động nạp ${emails.length} địa chỉ email từ tài liệu vào tập đối soát.`;
            }
            return { params, handoffSummary };
          },
          extractContext: (resultData) => ({
            reconcileResult: resultData,
            missingRecipients: resultData?.missingInTargetList || [],
            matchedRecipients: resultData?.matchedList || [],
          }),
        },
        parameters: {
          type: 'object',
          properties: {
            sourceFileName: {
              type: 'string',
              description: 'Tên file nguồn (hoặc "CSDL_HOI_VIEN")',
            },
            targetFileName: {
              type: 'string',
              description: 'Tên file cần đối chiếu',
            },
            sourceEmails: {
              type: 'string',
              description: 'JSON mảng danh sách email nguồn',
            },
            targetEmails: {
              type: 'string',
              description: 'JSON mảng danh sách email đối chiếu',
            },
          },
          required: ['targetEmails'],
        },
        returns: {
          type: 'object',
          description: 'Kết quả đối chiếu: Số lượng trùng, số lượng thiếu, số lượng mới',
        },
      },
      execute: async (params, context) => {
        let sourceList: string[] = [];
        let targetList: string[] = [];

        try {
          targetList = typeof params.targetEmails === 'string' ? JSON.parse(params.targetEmails) : params.targetEmails;
        } catch {}

        if (params.sourceEmails) {
          try {
            sourceList = typeof params.sourceEmails === 'string' ? JSON.parse(params.sourceEmails) : params.sourceEmails;
          } catch {}
        } else {
          // Lấy danh sách email hội viên chính thức từ CSDL 113.20.107.184
          const dbMembers = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT email FROM public.members WHERE email IS NOT NULL AND status = 'active' LIMIT 500`,
          ).catch(() => []);
          sourceList = dbMembers.map((m) => String(m.email).toLowerCase());
        }

        const sourceSet = new Set(sourceList.map((e) => String(e).toLowerCase().trim()));
        const targetSet = new Set(targetList.map((e) => String(e).toLowerCase().trim()));

        const matched: string[] = [];
        const missingInTarget: string[] = []; // Có trong source nhưng thiếu trong target
        const newInTarget: string[] = []; // Mới có trong target chưa có trong source

        targetSet.forEach((email) => {
          if (sourceSet.has(email)) {
            matched.push(email);
          } else {
            newInTarget.push(email);
          }
        });

        sourceSet.forEach((email) => {
          if (!targetSet.has(email)) {
            missingInTarget.push(email);
          }
        });

        return {
          success: true,
          toolName: 'compare_and_reconcile_documents',
          data: {
            sourceName: params.sourceFileName || 'CSDL_Hoi_Vien_He_Thong',
            targetName: params.targetFileName || 'Tai_Lieu_Doi_Chieu',
            totalSource: sourceSet.size,
            totalTarget: targetSet.size,
            matchedCount: matched.length,
            missingInTargetCount: missingInTarget.length,
            newInTargetCount: newInTarget.length,
            missingList: missingInTarget.slice(0, 50),
            newList: newInTarget.slice(0, 50),
            summary: `Đối chiếu hoàn tất: ${matched.length} trùng khớp, ${missingInTarget.length} chưa có trong tệp đối chiếu, ${newInTarget.length} đăng ký mới.`,
          },
          auditMessage: `Đối chiếu tài liệu: ${matched.length} trùng, ${missingInTarget.length} thiếu, ${newInTarget.length} mới.`,
        };
      },
    });

    // 11. TOOL: check_calendar_availability (Calendar Agent - Conflict & Availability Scanner)
    this.registerTool({
      definition: {
        name: 'check_calendar_availability',
        displayName: 'Kiểm tra lịch trống & phát hiện xung đột lịch trình',
        description:
          'Quét toàn bộ lịch họp và sự kiện trong CSDL, thống kê các khung giờ bận và đề xuất các khoảng thời gian còn trống để lên lịch.',
        category: 'calendar',
        safetyLevel: 'READ',
        requiredPermission: 'AI_READ_ANALYTICS',
        contextContract: {
          produces: ['availableSlots', 'suggestedFreeSlot', 'calendarConflicts'],
          extractContext: (resultData) => ({
            availableSlots: resultData?.availableSlots || [],
            suggestedFreeSlot: resultData?.suggestedFreeSlot || null,
            calendarConflicts: resultData?.conflicts || [],
          }),
        },
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Ngày kiểm tra (định dạng YYYY-MM-DD hoặc DD/MM/YYYY, mặc định là ngày hôm nay)',
            },
            days: {
              type: 'number',
              description: 'Số ngày cần quét (1: xem trong ngày, 7: xem cả tuần, mặc định 1)',
            },
            keyword: {
              type: 'string',
              description: 'Từ khóa lọc tên sự kiện/cuộc họp',
            },
          },
        },
        returns: {
          type: 'object',
          description: 'Danh sách các sự kiện hiện có, trạng thái các khung giờ (Sáng, Chiều, Tối) và gợi ý khung giờ trống',
        },
      },
      execute: async (params, context) => {
        try {
          let baseDate = new Date();
          if (params.date) {
            const parsed = new Date(params.date);
            if (!isNaN(parsed.getTime())) {
              baseDate = parsed;
            } else {
              const match = String(params.date).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
              if (match) {
                baseDate = new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10));
              }
            }
          }
          const daysToScan = params.days && params.days > 0 ? Math.min(params.days, 14) : 1;
          const startDateStr = baseDate.toISOString().split('T')[0];
          const endDateObj = new Date(baseDate);
          endDateObj.setDate(endDateObj.getDate() + daysToScan);
          const endDateStr = endDateObj.toISOString().split('T')[0];

          // 1. Quét sự kiện từ public.events
          const evRows = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT id, name as title, date, location, type, 'event' as source
             FROM public.events
             WHERE date >= $1::date AND date <= $2::date AND status != 'cancelled'
             ORDER BY date ASC`,
            startDateStr,
            endDateStr,
          ).catch(() => []);

          // 2. Quét cuộc họp từ public.meetings
          const mtRows = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT id, code, title, date, time, location, attendees, 'meeting' as source
             FROM public.meetings
             WHERE date >= $1::date AND date <= $2::date AND status != 'cancelled'
             ORDER BY date ASC, time ASC`,
            startDateStr,
            endDateStr,
          ).catch(() => []);

          const allItems = [...evRows, ...mtRows];

          // 3. Phân bổ các khung giờ trong ngày kiểm tra chính
          const morningBusy = allItems.filter((item) => {
            const t = (item.time || '').toLowerCase();
            return item.source === 'event' || t.includes('08:') || t.includes('09:') || t.includes('10:') || t.includes('11:') || t.includes('sáng');
          });

          const afternoonBusy = allItems.filter((item) => {
            const t = (item.time || '').toLowerCase();
            return item.source === 'event' || t.includes('13:') || t.includes('14:') || t.includes('15:') || t.includes('16:') || t.includes('17:') || t.includes('chiều');
          });

          const eveningBusy = allItems.filter((item) => {
            const t = (item.time || '').toLowerCase();
            return t.includes('18:') || t.includes('19:') || t.includes('20:') || t.includes('tối');
          });

          const timeSlots = [
            {
              slot: 'Sáng (08:30 - 11:30)',
              status: morningBusy.length > 0 ? 'busy' : 'available',
              busyWith: morningBusy.map((b) => b.title),
            },
            {
              slot: 'Chiều (13:30 - 17:00)',
              status: afternoonBusy.length > 0 ? 'busy' : 'available',
              busyWith: afternoonBusy.map((b) => b.title),
            },
            {
              slot: 'Tối (18:30 - 21:00)',
              status: eveningBusy.length > 0 ? 'busy' : 'available',
              busyWith: eveningBusy.map((b) => b.title),
            },
          ];

          const availableSlots = timeSlots.filter((s) => s.status === 'available').map((s) => s.slot);
          const suggestedFreeSlot = availableSlots[0] || 'Tất cả các ca đều kín lịch, đề xuất chọn ngày làm việc tiếp theo.';

          return {
            success: true,
            toolName: 'check_calendar_availability',
            data: {
              scannedDate: startDateStr,
              daysScanned: daysToScan,
              totalEventsFound: allItems.length,
              events: allItems.map((item) => ({
                id: item.id || item.code,
                title: item.title,
                date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : item.date,
                time: item.time || (item.source === 'event' ? 'Cả ngày' : '09:00'),
                location: item.location,
                source: item.source,
              })),
              timeSlots,
              availableSlots,
              suggestedFreeSlot,
              summary: `Ngày ${startDateStr}: Tìm thấy ${allItems.length} cuộc họp/sự kiện trong hệ thống. ${availableSlots.length > 0 ? `Khung giờ khả dụng: ${availableSlots.join(', ')}.` : 'Các khung giờ đều đã có lịch.'}`,
            },
            auditMessage: `Quét lịch trống ngày ${startDateStr}: ${allItems.length} lịch bận, ${availableSlots.length} khung giờ trống.`,
          };
        } catch (err: any) {
          return {
            success: false,
            toolName: 'check_calendar_availability',
            error: `Lỗi quét lịch CSDL: ${err?.message}`,
          };
        }
      },
    });

    // 12. TOOL: query_system_analytics (Data Query Agent - Advanced Multi-dimensional Analytics)
    this.registerTool({
      definition: {
        name: 'query_system_analytics',
        displayName: 'Tra cứu chuyên sâu, thống kê chỉ số & xuất báo cáo (Data Query Agent)',
        description:
          'Truy vấn số liệu an toàn từ CSDL PostgreSQL 113.20.107.184:6432: Đếm người dùng hoạt động/chưa xác thực email, ai đăng ký hôm nay, lọc SĐT bắt đầu bằng 09, thống kê doanh thu theo tháng cho biểu đồ Recharts, liệt kê giao dịch thất bại, cơ cấu ban ngành.',
        category: 'data_query',
        safetyLevel: 'READ',
        requiredPermission: 'AI_READ_ANALYTICS',
        contextContract: {
          produces: ['analyticsResult', 'kpiData', 'preparedList'],
          extractContext: (resultData) => {
            const rows = resultData?.tableData?.rows || [];
            const prepared = rows
              .filter((r: any) => r.email && String(r.email).includes('@'))
              .map((r: any) => ({
                ho_ten: r.fullName || r.full_name || 'Hội viên',
                email: r.email,
                so_dien_thoai: r.phone || '',
                cong_ty: r.company || '',
                chuc_vu: r.position || '',
              }));

            return {
              analyticsResult: resultData,
              kpiData: resultData?.kpis || [],
              preparedList: prepared.length > 0 ? prepared : undefined,
            };
          },
        },
        parameters: {
          type: 'object',
          properties: {
            queryType: {
              type: 'string',
              enum: [
                'member_overview',
                'member_search_advanced',
                'finance_monthly_stats',
                'failed_transactions',
                'department_distribution',
                'system_kpi_summary',
              ],
              description: 'Loại phân tích nghiệp vụ cần tra cứu',
            },
            filterKeyword: {
              type: 'string',
              description: 'Từ khóa lọc hoặc tiền tố (ví dụ tiền tố SĐT "09", domain "@gmail.com", tên ban ngành)',
            },
            timeRange: {
              type: 'string',
              enum: ['today', 'this_week', 'this_month', 'this_year', 'all'],
              description: 'Khoảng thời gian (hôm nay, tuần này, tháng này, năm nay, toàn bộ)',
            },
            year: {
              type: 'number',
              description: 'Năm thống kê doanh thu/giao dịch (mặc định 2026)',
            },
            status: {
              type: 'string',
              description: 'Trạng thái lọc: active, unverified, failed, pending, all',
            },
            limit: {
              type: 'number',
              description: 'Giới hạn số bản ghi trả về (mặc định 50)',
            },
          },
          required: ['queryType'],
        },
        returns: {
          type: 'object',
          description: 'Cấu trúc kết quả đa chiều: KPIs, dữ liệu bảng tableData, dữ liệu biểu đồ chartData, tóm tắt tự nhiên và danh sách xuất Excel',
        },
      },
      execute: async (params, context) => {
        const queryType = params.queryType || 'system_kpi_summary';
        const limit = Math.min(Math.max(Number(params.limit) || 50, 5), 200);
        const filterKeyword = (params.filterKeyword || '').trim();
        const timeRange = params.timeRange || 'all';

        try {
          // ==========================================
          // CASE 1: THỐNG KÊ DOANH THU THEO TỪNG THÁNG (Cho Recharts Bar Chart)
          // ==========================================
          if (queryType === 'finance_monthly_stats') {
            const targetYear = Number(params.year) || 2026;
            const monthlyRows = await this.prisma.$queryRawUnsafe<any[]>(
              `SELECT 
                 EXTRACT(MONTH FROM date)::int as month,
                 COALESCE(SUM(CASE WHEN type = 'income' OR amount > 0 THEN amount ELSE 0 END), 0)::numeric as income,
                 COALESCE(SUM(CASE WHEN type = 'expense' OR amount < 0 THEN ABS(amount) ELSE 0 END), 0)::numeric as expense
               FROM public.transactions
               WHERE EXTRACT(YEAR FROM date) = $1
               GROUP BY EXTRACT(MONTH FROM date)
               ORDER BY month ASC`,
              targetYear,
            ).catch(() => []);

            const monthMap = new Map<number, { income: number; expense: number }>();
            monthlyRows.forEach((r) => {
              monthMap.set(Number(r.month), {
                income: Number(r.income || 0),
                expense: Number(r.expense || 0),
              });
            });

            const monthsData: Array<{
              month: number;
              monthLabel: string;
              income: number;
              expense: number;
              net: number;
            }> = [];

            let totalYearIncome = 0;
            let totalYearExpense = 0;
            let peakMonth = { month: 1, income: 0 };

            for (let m = 1; m <= 12; m++) {
              const val = monthMap.get(m) || { income: 0, expense: 0 };
              const net = val.income - val.expense;
              totalYearIncome += val.income;
              totalYearExpense += val.expense;
              if (val.income > peakMonth.income) {
                peakMonth = { month: m, income: val.income };
              }

              monthsData.push({
                month: m,
                monthLabel: `Tháng ${m}`,
                income: val.income,
                expense: val.expense,
                net,
              });
            }

            const totalNet = totalYearIncome - totalYearExpense;

            return {
              success: true,
              toolName: 'query_system_analytics',
              data: {
                queryType,
                title: `Báo Cáo Thống Kê Doanh Thu & Chi Phí 12 Tháng Năm ${targetYear}`,
                targetYear,
                kpis: [
                  { label: 'Tổng Doanh Thu Cả Năm', value: `${totalYearIncome.toLocaleString('vi-VN')} đ`, color: 'text-emerald-600', trend: 'up' },
                  { label: 'Tổng Chi Phí Hoạt Động', value: `${totalYearExpense.toLocaleString('vi-VN')} đ`, color: 'text-rose-600', trend: 'down' },
                  { label: 'Thặng Dư Quỹ Ròng (Net)', value: `${totalNet.toLocaleString('vi-VN')} đ`, color: 'text-blue-600', trend: totalNet >= 0 ? 'up' : 'down' },
                  { label: 'Tháng Cao Điểm Nhất', value: `Tháng ${peakMonth.month} (${peakMonth.income.toLocaleString('vi-VN')} đ)`, color: 'text-purple-600', trend: 'neutral' },
                ],
                chartData: {
                  type: 'bar',
                  title: `Biểu Đồ Dòng Tiền 12 Tháng Năm ${targetYear} (Doanh Thu vs Chi Phí)`,
                  xKey: 'monthLabel',
                  data: monthsData,
                  series: [
                    { key: 'income', name: 'Doanh Thu (VNĐ)', color: '#10b981' },
                    { key: 'expense', name: 'Chi Phí (VNĐ)', color: '#ef4444' },
                    { key: 'net', name: 'Dòng Tiền Thuần (VNĐ)', color: '#3b82f6' },
                  ],
                },
                tableData: {
                  headers: ['Tháng', 'Tổng Thu (Doanh Thu VNĐ)', 'Tổng Chi (Chi Phí VNĐ)', 'Dòng Tiền Thuần (VNĐ)', 'Tỷ Suất Quỹ (%)'],
                  rows: monthsData.map((d) => [
                    d.monthLabel,
                    d.income.toLocaleString('vi-VN'),
                    d.expense.toLocaleString('vi-VN'),
                    d.net.toLocaleString('vi-VN'),
                    d.income > 0 ? `${Math.round((d.net / d.income) * 100)}%` : '0%',
                  ]),
                  total: monthsData.length,
                },
                rawItems: monthsData.map((d) => ({
                  month: d.monthLabel,
                  income: d.income,
                  expense: d.expense,
                  net: d.net,
                  year: targetYear,
                })),
                textSummary: `Năm ${targetYear}: Tổng doanh thu ghi nhận ${totalYearIncome.toLocaleString('vi-VN')} VNĐ, tổng chi phí ${totalYearExpense.toLocaleString('vi-VN')} VNĐ, thặng dư ròng đạt ${totalNet.toLocaleString('vi-VN')} VNĐ. Tháng cao điểm nhất là Tháng ${peakMonth.month} với doanh thu ${peakMonth.income.toLocaleString('vi-VN')} VNĐ.`,
              },
              auditMessage: `Tra cứu doanh thu 12 tháng năm ${targetYear}: Tổng thu ${totalYearIncome.toLocaleString('vi-VN')} đ.`,
            };
          }

          // ==========================================
          // CASE 2: LIỆT KÊ GIAO DỊCH THẤT BẠI / CHƯA HOÀN TẤT
          // ==========================================
          if (queryType === 'failed_transactions') {
            let whereClause = `WHERE (t.status IN ('failed', 'cancelled', 'pending') OR t.amount = 0)`;
            const qParams: any[] = [];

            if (timeRange === 'this_month') {
              whereClause += ` AND date >= date_trunc('month', CURRENT_DATE)`;
            } else if (timeRange === 'today') {
              whereClause += ` AND date = CURRENT_DATE`;
            }

            const query = `
              SELECT t.id, t.code, t.type, t.category, t.description, t.amount, t.status, t.method, t.date, t.created_at,
                     COALESCE(t.payer_name, t.recipient, 'Hội viên') as payer_display
              FROM public.transactions t
              ${whereClause}
              ORDER BY t.date DESC, t.created_at DESC
              LIMIT ${limit}
            `;

            const rows: any[] = (await this.prisma.$queryRawUnsafe<any[]>(query, ...qParams).catch(() => [])) || [];
            const totalFailedAmount = rows.reduce((acc: number, r: any) => acc + Number(r.amount || 0), 0);

            return {
              success: true,
              toolName: 'query_system_analytics',
              data: {
                queryType,
                title: `Danh Sách Giao Dịch Thất Bại & Chưa Hoàn Tất (${timeRange === 'this_month' ? 'Tháng Này' : 'Toàn Bộ'})`,
                kpis: [
                  { label: 'Số Giao Dịch Cần Xử Lý', value: rows.length, color: 'text-rose-600', trend: 'down' },
                  { label: 'Tổng Tiền Bị Nghẽn', value: `${totalFailedAmount.toLocaleString('vi-VN')} đ`, color: 'text-amber-600', trend: 'down' },
                  { label: 'Phạm Vi Thời Gian', value: timeRange === 'this_month' ? 'Tháng hiện tại' : 'Toàn bộ sổ quỹ', color: 'text-blue-600', trend: 'neutral' },
                ],
                tableData: {
                  headers: ['STT', 'Mã Giao Dịch', 'Ngày Phát Sinh', 'Đối Tác / Người Nộp', 'Danh Mục', 'Số Tiền (VNĐ)', 'Phương Thức', 'Trạng Thái', 'Nội Dung'],
                  rows: rows.map((r, i) => [
                    i + 1,
                    r.code || String(r.id).slice(0, 8),
                    r.date ? String(r.date).slice(0, 10) : 'Chưa định',
                    r.payer_display,
                    r.category || 'Phí tham gia CLB',
                    Number(r.amount || 0).toLocaleString('vi-VN'),
                    r.method || 'Chuyển khoản',
                    r.status === 'failed' ? 'Thất bại' : r.status === 'cancelled' ? 'Đã hủy' : 'Chờ xử lý',
                    r.description || '',
                  ]),
                  total: rows.length,
                },
                rawItems: rows.map((r, i) => ({
                  stt: i + 1,
                  code: r.code || String(r.id),
                  date: r.date ? String(r.date).slice(0, 10) : '',
                  payer: r.payer_display,
                  category: r.category,
                  amount: Number(r.amount || 0),
                  status: r.status,
                  description: r.description,
                })),
                textSummary: `Hệ thống ghi nhận ${rows.length} giao dịch ở trạng thái chưa hoàn tất hoặc thất bại với tổng giá trị ${totalFailedAmount.toLocaleString('vi-VN')} VNĐ. Quản trị viên và Kế toán cần đối soát sao kê ngân hàng để khớp lệnh.`,
              },
              auditMessage: `Tra cứu giao dịch lỗi: ${rows.length} bản ghi, tổng ${totalFailedAmount.toLocaleString('vi-VN')} đ.`,
            };
          }

          // ==========================================
          // CASE 3: TỔNG QUAN HỘI VIÊN, TÌM SĐT 09..., CHƯA XÁC THỰC EMAIL, MỚI ĐĂNG KÝ HÔM NAY
          // ==========================================
          if (queryType === 'member_overview' || queryType === 'member_search_advanced') {
            const [totalMemRow, activeMemRow, unverifiedRow, todayRow, weekRow] = await Promise.all([
              this.prisma.$queryRawUnsafe<any[]>(`SELECT count(*)::int as count FROM public.members`).catch(() => [{ count: 0 }]),
              this.prisma.$queryRawUnsafe<any[]>(`SELECT count(*)::int as count FROM public.members WHERE status = 'active'`).catch(() => [{ count: 0 }]),
              this.prisma.$queryRawUnsafe<any[]>(`SELECT count(*)::int as count FROM public.members WHERE email IS NULL OR email = '' OR email NOT LIKE '%@%.%'`).catch(() => [{ count: 0 }]),
              this.prisma.$queryRawUnsafe<any[]>(`SELECT count(*)::int as count FROM public.members WHERE created_at::date = CURRENT_DATE`).catch(() => [{ count: 0 }]),
              this.prisma.$queryRawUnsafe<any[]>(`SELECT count(*)::int as count FROM public.members WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`).catch(() => [{ count: 0 }]),
            ]);

            const totalCount = totalMemRow[0]?.count || 0;
            const activeCount = activeMemRow[0]?.count || 0;
            const unverifiedCount = unverifiedRow[0]?.count || 0;
            const todayCount = todayRow[0]?.count || 0;
            const weekCount = weekRow[0]?.count || 0;

            let whereClause = `WHERE 1=1`;
            const qParams: any[] = [];

            if (filterKeyword) {
              if (/^\d+$/.test(filterKeyword)) {
                qParams.push(`${filterKeyword}%`);
                whereClause += ` AND regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE $${qParams.length}`;
              } else {
                qParams.push(`%${filterKeyword}%`);
                whereClause += ` AND (COALESCE(name, full_name, '') ILIKE $${qParams.length} OR company ILIKE $${qParams.length} OR email ILIKE $${qParams.length} OR department ILIKE $${qParams.length})`;
              }
            }

            if (params.status === 'unverified') {
              whereClause += ` AND (email IS NULL OR email = '' OR email NOT LIKE '%@%.%')`;
            } else if (params.status === 'active') {
              whereClause += ` AND status = 'active'`;
            }

            if (timeRange === 'today') {
              whereClause += ` AND created_at::date = CURRENT_DATE`;
            } else if (timeRange === 'this_week') {
              whereClause += ` AND created_at >= CURRENT_DATE - INTERVAL '7 days'`;
            }

            const query = `
              SELECT id, code, COALESCE(name, full_name, 'Hội viên') as display_name,
                     phone, email, company, department, executive_role, status, created_at
              FROM public.members
              ${whereClause}
              ORDER BY created_at DESC
              LIMIT ${limit}
            `;

            const rows = await this.prisma.$queryRawUnsafe<any[]>(query, ...qParams).catch(() => []);

            const title = filterKeyword && /^\d+$/.test(filterKeyword)
              ? `Danh Sách Hội Viên Có Số Điện Thoại Bắt Đầu Bằng "${filterKeyword}" (${rows.length} kết quả)`
              : params.status === 'unverified'
              ? `Danh Sách Khách Hàng / Hội Viên Chưa Xác Thực Email (${rows.length} người)`
              : timeRange === 'today'
              ? `Danh Sách Hội Viên Vừa Đăng Ký Hôm Nay (${rows.length} người)`
              : `Báo Cáo Tổng Quan Hội Viên & Học Viên CLB CEO HN10`;

            return {
              success: true,
              toolName: 'query_system_analytics',
              data: {
                queryType,
                title,
                kpis: [
                  { label: 'Tổng Hội Viên / Học Viên', value: totalCount, color: 'text-blue-600', trend: 'up' },
                  { label: 'Đang Hoạt Động', value: activeCount, color: 'text-emerald-600', trend: 'up' },
                  { label: 'Chưa Xác Thực Email', value: unverifiedCount, color: 'text-amber-600', trend: unverifiedCount > 0 ? 'down' : 'up' },
                  { label: 'Đăng Ký Hôm Nay / Tuần Này', value: `${todayCount} hôm nay (${weekCount} tuần này)`, color: 'text-purple-600', trend: 'up' },
                ],
                tableData: {
                  headers: ['STT', 'Mã HV', 'Họ và tên', 'Số điện thoại', 'Email', 'Doanh nghiệp', 'Ban chuyên môn', 'Trạng thái', 'Ngày gia nhập'],
                  rows: rows.map((r, i) => [
                    i + 1,
                    r.code || `MEM-${String(r.id).slice(0, 4)}`,
                    r.display_name,
                    r.phone || 'Chưa cập nhật',
                    r.email || '(Chưa có email)',
                    r.company || 'Doanh nghiệp thành viên',
                    r.department || 'CLB CEO HN10',
                    r.status === 'active' ? 'Đang hoạt động' : 'Chờ duyệt',
                    r.created_at ? String(r.created_at).slice(0, 10) : 'Chưa định',
                  ]),
                  total: rows.length,
                },
                rawItems: rows.map((r, i) => ({
                  stt: i + 1,
                  code: r.code || String(r.id),
                  name: r.display_name,
                  phone: r.phone || '',
                  email: r.email || '',
                  company: r.company || '',
                  department: r.department || '',
                  status: r.status,
                  createdAt: r.created_at ? String(r.created_at).slice(0, 10) : '',
                })),
                textSummary: `Hệ thống hiện có ${totalCount} hội viên (${activeCount} đang hoạt động, ${unverifiedCount} chưa xác thực email). ${filterKeyword ? `Bộ lọc "${filterKeyword}" trả về ${rows.length} kết quả phù hợp.` : `Hôm nay có ${todayCount} đăng ký mới, tuần này có ${weekCount} đăng ký mới.`}`,
              },
              auditMessage: `Tra cứu hội viên (${queryType}): ${rows.length}/${totalCount} kết quả.`,
            };
          }

          // ==========================================
          // CASE 4: PHÂN BỐ HỘI VIÊN THEO BAN CHUYÊN MÔN (Pie Chart)
          // ==========================================
          if (queryType === 'department_distribution') {
            const deptRows: any[] = (await this.prisma.$queryRawUnsafe<any[]>(`
              SELECT COALESCE(NULLIF(department, ''), 'Chưa phân ban') as dept_name,
                     COUNT(*)::int as count
              FROM public.members
              GROUP BY COALESCE(NULLIF(department, ''), 'Chưa phân ban')
              ORDER BY count DESC
            `).catch(() => [])) || [];

            const totalMembers = deptRows.reduce((acc: number, r: any) => acc + Number(r.count || 0), 0);
            const pieData = deptRows.map((r) => ({
              name: r.dept_name,
              value: Number(r.count || 0),
              percentage: totalMembers > 0 ? Math.round((Number(r.count || 0) / totalMembers) * 100) : 0,
            }));

            return {
              success: true,
              toolName: 'query_system_analytics',
              data: {
                queryType,
                title: 'Báo Cáo Cơ Cấu Phân Bố Hội Viên Theo Ban Chuyên Môn',
                kpis: [
                  { label: 'Tổng Số Ban Ngành', value: deptRows.length, color: 'text-blue-600', trend: 'neutral' },
                  { label: 'Ban Đông Hội Viên Nhất', value: `${deptRows[0]?.dept_name || 'N/A'} (${deptRows[0]?.count || 0})`, color: 'text-emerald-600', trend: 'up' },
                  { label: 'Tổng Số Hội Viên', value: totalMembers, color: 'text-purple-600', trend: 'up' },
                ],
                chartData: {
                  type: 'pie',
                  title: 'Tỷ Trọng Hội Viên Giữa Các Ban Chuyên Môn CLB CEO HN10',
                  data: pieData,
                  series: [{ key: 'value', name: 'Số lượng hội viên', color: '#3b82f6' }],
                },
                tableData: {
                  headers: ['STT', 'Ban Chuyên Môn', 'Số Lượng Doanh Nhân', 'Tỷ Trọng Cơ Cấu (%)'],
                  rows: pieData.map((d, i) => [
                    i + 1,
                    d.name,
                    d.value.toLocaleString('vi-VN'),
                    `${d.percentage}%`,
                  ]),
                  total: pieData.length,
                },
                rawItems: pieData.map((d, i) => ({
                  stt: i + 1,
                  department: d.name,
                  count: d.value,
                  percentage: `${d.percentage}%`,
                })),
                textSummary: `Toàn CEOHN10 có ${deptRows.length} ban chuyên môn với ${totalMembers} hội viên. Ban có quy mô lớn nhất là "${deptRows[0]?.dept_name}" chiếm ${pieData[0]?.percentage || 0}% toàn CLB.`,
              },
              auditMessage: `Tra cứu cơ cấu ban ngành: ${deptRows.length} ban, tổng ${totalMembers} hội viên.`,
            };
          }

          // ==========================================
          // CASE 5: TỔNG QUAN KPI TOÀN DIỆN HỆ THỐNG (Default Fallback)
          // ==========================================
          const [memCountRow, evCountRow, txCountRow, meetCountRow] = await Promise.all([
            this.prisma.$queryRawUnsafe<any[]>(`SELECT count(*)::int as count FROM public.members WHERE status = 'active'`).catch(() => [{ count: 0 }]),
            this.prisma.$queryRawUnsafe<any[]>(`SELECT count(*)::int as count FROM public.events WHERE status != 'cancelled'`).catch(() => [{ count: 0 }]),
            this.prisma.$queryRawUnsafe<any[]>(`SELECT coalesce(sum(case when amount > 0 then amount else 0 end), 0)::numeric as inc, coalesce(sum(case when amount < 0 then abs(amount) else 0 end), 0)::numeric as exp FROM public.transactions`).catch(() => [{ inc: 0, exp: 0 }]),
            this.prisma.$queryRawUnsafe<any[]>(`SELECT count(*)::int as count FROM public.meetings WHERE status != 'cancelled'`).catch(() => [{ count: 0 }]),
          ]);

          const totalActiveMem = memCountRow[0]?.count || 0;
          const totalEvents = evCountRow[0]?.count || 0;
          const totalInc = Number(txCountRow[0]?.inc || 0);
          const totalExp = Number(txCountRow[0]?.exp || 0);
          const balance = totalInc - totalExp;
          const totalMeetings = meetCountRow[0]?.count || 0;

          return {
            success: true,
            toolName: 'query_system_analytics',
            data: {
              queryType: 'system_kpi_summary',
              title: 'Báo Cáo Tổng Hợp Các Chỉ Số KPI Trọng Yếu CLB Doanh Nhân CEO HN10',
              kpis: [
                { label: 'Hội Viên Đang Hoạt Động', value: totalActiveMem, color: 'text-emerald-600', trend: 'up' },
                { label: 'Số Dư Khả Dụng Sổ Quỹ', value: `${balance.toLocaleString('vi-VN')} đ`, color: 'text-blue-600', trend: balance >= 0 ? 'up' : 'down' },
                { label: 'Sự Kiện & Diễn Đàn', value: totalEvents, color: 'text-purple-600', trend: 'up' },
                { label: 'Cuộc Họp & Kết Nối B2B', value: totalMeetings, color: 'text-amber-600', trend: 'neutral' },
              ],
              tableData: {
                headers: ['Chỉ Số Trọng Yếu', 'Giá Trị Thực Tế', 'Đơn Vị Tính', 'Trạng Thái Vận Hành'],
                rows: [
                  ['Hội viên chính thức', totalActiveMem.toLocaleString('vi-VN'), 'Doanh nhân', 'Tăng trưởng ổn định'],
                  ['Tổng doanh thu quỹ lũy kế', totalInc.toLocaleString('vi-VN'), 'VNĐ', 'Thu đúng niên liễm'],
                  ['Tổng chi phí hoạt động', totalExp.toLocaleString('vi-VN'), 'VNĐ', 'Theo dự toán duyệt'],
                  ['Thặng dư ngân sách', balance.toLocaleString('vi-VN'), 'VNĐ', 'An toàn thanh khoản'],
                  ['Sự kiện CLB', totalEvents.toLocaleString('vi-VN'), 'Chương trình', 'Hoạt động liên tục'],
                  ['Phiên họp ban & 1-on-1', totalMeetings.toLocaleString('vi-VN'), 'Cuộc gặp', 'Kết nối mật thiết'],
                ],
                total: 6,
              },
              rawItems: [
                { kpi: 'Hội viên hoạt động', value: totalActiveMem },
                { kpi: 'Tổng thu', value: totalInc },
                { kpi: 'Tổng chi', value: totalExp },
                { kpi: 'Số dư quỹ', value: balance },
                { kpi: 'Sự kiện', value: totalEvents },
                { kpi: 'Cuộc họp', value: totalMeetings },
              ],
              textSummary: `Hệ sinh thái CEO HN10 đang vận hành vững mạnh với ${totalActiveMem} hội viên doanh nhân, ${totalEvents} sự kiện diễn đàn lớn và số dư khả dụng thực tế ${balance.toLocaleString('vi-VN')} VNĐ sẵn sàng bảo đảm cho các chương trình hành động.`,
            },
            auditMessage: `Báo cáo KPI hệ thống: ${totalActiveMem} hội viên, quỹ ${balance.toLocaleString('vi-VN')} đ.`,
          };
        } catch (err: any) {
          return {
            success: false,
            toolName: 'query_system_analytics',
            error: `Lỗi truy vấn dữ liệu báo cáo: ${err?.message}`,
          };
        }
      },
    });

    // 10. TOOL: create_event_invitation_list (Tạo danh sách khách mời & gửi thư mời sự kiện)
    this.registerTool({
      definition: {
        name: 'create_event_invitation_list',
        displayName: 'Tạo danh sách khách mời & gửi thư mời vào sự kiện',
        description:
          'Lưu danh sách khách mời vào sự kiện cụ thể (eventId) và tùy chọn gửi ngay email thư mời cá nhân hóa có đường dẫn public.',
        category: 'calendar',
        safetyLevel: 'EXTERNAL_ACTION',
        requiredPermission: 'AI_SEND_EMAIL',
        parameters: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'Mã sự kiện mục tiêu (VD: EV-...)' },
            guests: { type: 'array', description: 'Danh sách [{ fullName, email, phone, company, title, guestType }]' },
            sendEmail: { type: 'boolean', description: 'Có gửi ngay email thư mời không (mặc định true)' },
          },
          required: ['eventId', 'guests'],
        },
        returns: { type: 'object', description: 'Kết quả lưu danh sách & gửi thư mời' },
      },
      execute: async (params) => {
        try {
          const eventId = String(params.eventId || '').trim();
          const guests = Array.isArray(params.guests) ? params.guests : [];
          if (!eventId || guests.length === 0) {
            return { success: false, toolName: 'create_event_invitation_list', error: 'Thiếu eventId hoặc danh sách khách mời.' };
          }
          const evRows = await this.prisma.$queryRaw<any[]>`
            SELECT id, name, date, location, venue_name FROM public.events WHERE id = ${eventId} LIMIT 1
          `.catch(() => []);
          if (evRows.length === 0) {
            return { success: false, toolName: 'create_event_invitation_list', error: `Không tìm thấy sự kiện ${eventId}` };
          }
          const ev = evRows[0];
          const normalized = guests.map((g: any, idx: number) => {
            const fullName = String(g.fullName || g.name || g.ho_ten || `Khách mời ${idx + 1}`).trim();
            const slug = String(g.slug || fullName)
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '') || `guest-${idx + 1}`;
            return {
              slug,
              fullName,
              email: String(g.email || '').trim().toLowerCase(),
              phone: String(g.phone || g.so_dien_thoai || '').trim(),
              company: String(g.company || g.cong_ty || '').trim(),
              title: String(g.title || g.chuc_vu || '').trim(),
              guestType: g.guestType === 'other_participant' ? 'other_participant' : 'invited_guest',
            };
          });
          await this.prisma.$executeRawUnsafe(
            `UPDATE public.events SET invitation_guests = $1::jsonb, updated_at = NOW() WHERE id = $2`,
            JSON.stringify(normalized),
            eventId,
          ).catch(() => {});

          let sentCount = 0;
          if (params.sendEmail !== false && this.mailService) {
            const baseUrl = (process.env.APP_URL || 'https://crm.ceohn10.viconnect.vn').replace(/\/$/, '');
            for (const g of normalized) {
              if (!g.email || !g.email.includes('@')) continue;
              const link = `${baseUrl}/invitation/${eventId}#${g.slug}`;
              const r = await this.mailService.sendDirectEmail({
                to: g.email,
                subject: `[THƯ MỜI] ${ev.name} — Kính mời ${g.fullName}`,
                html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;"><h2 style="color:#003B95;">Trân trọng kính mời: ${g.fullName}</h2><p>Kính mời Quý vị tham dự sự kiện <strong>${ev.name}</strong>.</p><p style="text-align:center;margin:20px 0;"><a href="${link}" style="background:#003B95;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Mở Thư Mời &amp; Xác Nhận</a></p></div>`,
                templateCode: 'event_invitation_ai',
              }).catch(() => ({ ok: false }));
              if (r?.ok) sentCount++;
            }
          }
          return {
            success: true,
            toolName: 'create_event_invitation_list',
            data: { eventId, eventName: ev.name, guestCount: normalized.length, sentCount },
            auditMessage: `AI đã tạo danh sách ${normalized.length} khách mời cho "${ev.name}" và gửi ${sentCount} email thư mời.`,
          };
        } catch (err: any) {
          return { success: false, toolName: 'create_event_invitation_list', error: err?.message };
        }
      },
    });

    // 11. TOOL: import_or_create_members (Thêm học viên mới hàng loạt hoặc đơn lẻ)
    this.registerTool({
      definition: {
        name: 'import_or_create_members',
        displayName: 'Thêm mới / Import Học viên CLB CEO HN10',
        description: 'Thêm 1 hoặc nhiều học viên mới vào hệ thống từ thông tin chat hoặc file danh sách.',
        category: 'contact',
        safetyLevel: 'WRITE',
        requiredPermission: 'AI_WRITE_ACTIONS',
        parameters: {
          type: 'object',
          properties: {
            members: { type: 'array', description: 'Danh sách [{ name, email, phone, company, title, department }]' },
          },
          required: ['members'],
        },
        returns: { type: 'object', description: 'Số học viên thêm mới / cập nhật' },
      },
      execute: async (params) => {
        try {
          const list = Array.isArray(params.members) ? params.members : [];
          let created = 0;
          let updated = 0;
          const defaultAssocId = 'c1983000-0000-4000-8000-000000001983';
          for (const item of list) {
            const name = String(item.name || item.fullName || item.ho_ten || '').trim();
            if (!name) continue;
            const email = String(item.email || '').trim().toLowerCase();
            const phone = String(item.phone || item.so_dien_thoai || '').trim();
            const company = String(item.company || item.cong_ty || '').trim();
            const title = String(item.title || item.chuc_vu || 'Học viên').trim();
            const department = String(item.department || 'Ban Thành Viên').trim();
            const existing = email
              ? await this.prisma.$queryRaw<any[]>`SELECT id FROM public.members WHERE LOWER(email) = ${email} LIMIT 1`.catch(() => [])
              : [];
            if (existing.length > 0) {
              await this.prisma.$executeRaw`
                UPDATE public.members SET name = ${name}, contact = ${name}, company_name = ${company || null}, phone = COALESCE(NULLIF(${phone}, ''), phone), executive_role = ${title}, department = ${department}, updated_at = NOW()
                WHERE id = ${existing[0].id}
              `;
              updated++;
            } else {
              const newId = `MB${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
              const code = `CEOHN10-${Math.floor(1000 + Math.random() * 9000)}`;
              await this.prisma.$executeRaw`
                INSERT INTO public.members (id, name, contact, company_name, email, phone, type, level, industry, status, fee_paid, fee_year, joined_at, created_at, updated_at, association_id, executive_role, department, code)
                VALUES (${newId}, ${name}, ${name}, ${company || null}, ${email || null}, ${phone || null}, 'individual', 'Chính thức', 'Đa ngành', 'active', true, 2026, NOW()::date::text, NOW(), NOW(), ${defaultAssocId}::uuid, ${title}, ${department}, ${code})
              `;
              created++;
            }
          }
          return {
            success: true,
            toolName: 'import_or_create_members',
            data: { created, updated, total: created + updated },
            auditMessage: `AI đã thêm mới ${created} học viên và cập nhật ${updated} học viên.`,
          };
        } catch (err: any) {
          return { success: false, toolName: 'import_or_create_members', error: err?.message };
        }
      },
    });

    // 12. TOOL: create_lecturer (Thêm giảng viên mới)
    this.registerTool({
      definition: {
        name: 'create_lecturer',
        displayName: 'Thêm Giảng viên / Diễn giả mới',
        description: 'Thêm mới hồ sơ Giảng viên / Diễn giả đào tạo từ chat hoặc file danh sách.',
        category: 'contact',
        safetyLevel: 'WRITE',
        requiredPermission: 'AI_WRITE_ACTIONS',
        parameters: {
          type: 'object',
          properties: {
            lecturers: { type: 'array', description: 'Danh sách [{ fullName, title, company, specialty, email, phone }]' },
          },
          required: ['lecturers'],
        },
        returns: { type: 'object', description: 'Danh sách giảng viên đã thêm' },
      },
      execute: async (params) => {
        try {
          await this.prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS public.lecturers (
              id TEXT PRIMARY KEY,
              full_name TEXT NOT NULL,
              title TEXT DEFAULT '',
              company TEXT DEFAULT '',
              specialty TEXT DEFAULT '',
              email TEXT DEFAULT '',
              phone TEXT DEFAULT '',
              status TEXT DEFAULT 'active',
              created_at TIMESTAMPTZ DEFAULT NOW()
            )
          `).catch(() => {});
          const list = Array.isArray(params.lecturers) ? params.lecturers : [];
          let added = 0;
          for (const lec of list) {
            const fullName = String(lec.fullName || lec.name || lec.ho_ten || '').trim();
            if (!fullName) continue;
            const id = `LEC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
            await this.prisma.$executeRaw`
              INSERT INTO public.lecturers (id, full_name, title, company, specialty, email, phone, status, created_at)
              VALUES (${id}, ${fullName}, ${String(lec.title || lec.chuc_vu || 'Giảng viên')}, ${String(lec.company || lec.cong_ty || '')}, ${String(lec.specialty || 'Quản trị & Lãnh đạo')}, ${String(lec.email || '').toLowerCase()}, ${String(lec.phone || '')}, 'active', NOW())
            `;
            added++;
          }
          return {
            success: true,
            toolName: 'create_lecturer',
            data: { added },
            auditMessage: `AI đã thêm mới ${added} Giảng viên vào hệ thống đào tạo.`,
          };
        } catch (err: any) {
          return { success: false, toolName: 'create_lecturer', error: err?.message };
        }
      },
    });

    // 13. TOOL: create_training_class (Tạo lớp học / khóa đào tạo mới)
    this.registerTool({
      definition: {
        name: 'create_training_class',
        displayName: 'Tạo Lớp học / Khóa đào tạo mới',
        description: 'Tạo lớp học mới trên hệ thống Đào tạo CEO HN10 gắn Giảng viên, lịch học và học phí.',
        category: 'calendar',
        safetyLevel: 'EXTERNAL_ACTION',
        requiredPermission: 'AI_WRITE_ACTIONS',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Tên lớp học / khóa đào tạo' },
            instructorName: { type: 'string', description: 'Tên giảng viên phụ trách' },
            instructorTitle: { type: 'string', description: 'Chức danh giảng viên' },
            location: { type: 'string', description: 'Địa điểm học' },
            startTime: { type: 'string', description: 'Thời gian bắt đầu (ISO)' },
            ticketFee: { type: 'number', description: 'Học phí (VNĐ)' },
          },
          required: ['title'],
        },
        returns: { type: 'object', description: 'Thông tin lớp học vừa tạo' },
      },
      execute: async (params) => {
        try {
          const title = String(params.title || '').trim();
          if (!title) return { success: false, toolName: 'create_training_class', error: 'Thiếu tên lớp học.' };
          const startDt = params.startTime && !isNaN(new Date(params.startTime).getTime()) ? new Date(params.startTime) : new Date(Date.now() + 7 * 86400000);
          const rows = await this.prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO public.trainings (title, instructor_name, instructor_title, location, start_time, ticket_fee, status, format, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'upcoming', 'offline', NOW(), NOW()) RETURNING id, title`,
            title,
            String(params.instructorName || 'Giảng viên CEO HN10'),
            String(params.instructorTitle || 'Chuyên gia'),
            String(params.location || 'Hà Nội'),
            startDt,
            Number(params.ticketFee || 0),
          );
          return {
            success: true,
            toolName: 'create_training_class',
            data: rows[0] || { title },
            auditMessage: `AI đã tạo lớp học mới "${title}".`,
          };
        } catch (err: any) {
          return { success: false, toolName: 'create_training_class', error: err?.message };
        }
      },
    });
  }

  /**
   * Đăng ký một tool mới vào Registry
   */
  registerTool(tool: IAgentTool) {
    this.tools.set(tool.definition.name, tool);
    this.logger.log(`Đã đăng ký AI Tool: [${tool.definition.name}] - Safety: ${tool.definition.safetyLevel}`);
  }

  /**
   * Lấy danh sách định nghĩa tất cả các tools (định dạng Function Calling)
   */
  getToolsDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  /**
   * Tìm kiếm tool theo tên
   */
  getTool(name: string): IAgentTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Thực thi một tool cụ thể với cơ chế kiểm tra an toàn và Audit Log
   */
  async executeTool(
    name: string,
    params: Record<string, any>,
    context: ToolExecutionContext,
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        toolName: name,
        error: `Tool "${name}" không tồn tại trong Tool Registry.`,
      };
    }

    // Kiểm tra an toàn: nếu tool là EXTERNAL_ACTION và chưa được approved
    if (tool.definition.safetyLevel === 'EXTERNAL_ACTION' && !context.approved) {
      return {
        success: false,
        toolName: name,
        requiresApproval: true,
        error: `Tool "${tool.definition.displayName}" có tác động bên ngoài (EXTERNAL ACTION). Bắt buộc phải có xác nhận trước khi thực hiện.`,
      };
    }

    try {
      const result = await tool.execute(params, context);

      // Ghi audit log nếu thực thi thành công
      if (result.auditMessage) {
        this.prisma.$executeRawUnsafe(
          `INSERT INTO public.ai_request_audit (
            id, request_id, user_id, capability, permission_level, provider, model,
            used_fallback, provider_latency_ms, total_latency_ms, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, 'admin', 'agent_tool', $4,
            false, 50, 50, now()
          )`,
          `req_${Date.now()}`,
          context.userId || 'admin',
          `tool_${name}`,
          tool.definition.name,
        ).catch(() => {});
      }

      return result;
    } catch (err: any) {
      this.logger.error(`Lỗi thực thi tool [${name}]: ${err?.message}`);
      return {
        success: false,
        toolName: name,
        error: `Lỗi trong quá trình chạy công cụ ${name}: ${err?.message}`,
      };
    }
  }

  /**
   * Biến đổi tham số đầu vào cho tool dựa trên Workflow Context tích lũy từ các bước trước
   */
  transformStepParams(
    toolName: string,
    currentParams: Record<string, any>,
    workflowContext: Record<string, any>,
  ): { params: Record<string, any>; handoffSummary?: string } {
    const tool = this.getTool(toolName);
    if (!tool) {
      return { params: currentParams };
    }

    if (tool.definition.contextContract?.transformParams) {
      return tool.definition.contextContract.transformParams(currentParams, workflowContext);
    }

    return { params: currentParams };
  }

  /**
   * Trích xuất dữ liệu trả về của tool để nạp vào Workflow Context dùng chung
   */
  extractStepContext(
    toolName: string,
    resultData: any,
    currentParams: Record<string, any>,
  ): Record<string, any> {
    const tool = this.getTool(toolName);
    if (!tool) return {};

    if (tool.definition.contextContract?.extractContext) {
      return tool.definition.contextContract.extractContext(resultData, currentParams);
    }

    return {};
  }
}
