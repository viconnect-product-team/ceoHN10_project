import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { AiCrmAnalyticsService } from './ai-crm-analytics.service';
import { KnowledgeBaseService } from './knowledge-base.service';
import { AiPermissionService } from './ai-permission.service';
import { AgentCoreService } from './tools/agent-core.service';
import { ToolRegistryService } from './tools/tool-registry.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly crmAnalytics: AiCrmAnalyticsService,
    private readonly knowledgeBase: KnowledgeBaseService,
    private readonly aiPermission: AiPermissionService,
    private readonly agentCore: AgentCoreService,
    private readonly toolRegistry: ToolRegistryService,
  ) {}

  /** GET /api/ai/live-context — Ngữ cảnh động tài khoản phiên đăng nhập */
  @Get('live-context')
  async getLiveContext(@Request() req: any) {
    return this.aiService.getLiveMemberAssistantContext(req.user.id);
  }

  /** POST /api/ai/ask — Hỏi đáp Trợ lý AI (Google Gemini 2.0 Flash / Smart Hybrid) */
  @Post('ask')
  async askAssistant(
    @Request() req: any,
    @Body() body: { prompt: string; clientContext?: any },
  ) {
    const res = await this.aiService.askAssistant(
      req.user.id,
      body.prompt,
      body.clientContext,
    );
    return { ok: true, data: res };
  }

  /** POST /api/ai/deal-advisor — Cố vấn Thẩm định Deal, Khớp Vốn & Dòng Tiền Super Premium */
  @Post('deal-advisor')
  async getDealAdvisor(
    @Request() req: any,
    @Body() body: { capital?: number; prompt?: string; opportunityId?: string },
  ) {
    const res = await this.aiService.getDealAdvisorAnalysis(
      req.user.id,
      body.capital,
      body.prompt,
      body.opportunityId,
    );
    return { ok: true, data: res };
  }

  /** POST /api/ai/extract-tasks-from-document — Tự động bóc tách task, phân tích giải pháp & chia việc cho các Ban từ file Word/Excel/văn bản họp */
  @Post('extract-tasks-from-document')
  async extractTasksFromMeetingDocument(
    @Request() req: any,
    @Body()
    body: {
      documentText: string;
      fileName?: string;
      department?: string;
      customPrompt?: string;
    },
  ) {
    const res = await this.aiService.extractTasksFromMeetingDocument(
      req?.user?.id || 'admin',
      body,
    );
    return { ok: true, data: res };
  }

  /** POST /api/ai/ask-voice — Hỏi đáp bằng giọng nói (nhận file audio base64) */
  @Post('ask-voice')
  async askVoiceAssistant(
    @Request() req: any,
    @Body()
    body: {
      audioBase64?: string;
      mimeType?: string;
      prompt?: string;
      clientContext?: any;
    },
  ) {
    const res = await this.aiService.askVoiceAssistant(
      req.user.id,
      body.audioBase64,
      body.mimeType,
      body.prompt,
      body.clientContext,
    );
    return { ok: true, data: res };
  }

  /** GET /api/ai/roles — Roles của user hiện tại (cho phân quyền AI) */
  @Get('roles')
  async getRoles(@Request() req: any) {
    return this.aiService.getUserRoles(req.user.id);
  }

  /** GET /api/ai/settings/provider — Đọc cấu hình AI provider */
  @Get('settings/provider')
  async getProviderSetting() {
    return this.aiService.getAiProviderSetting();
  }

  /** POST /api/ai/audit — Ghi audit log (metadata only, không ghi prompt/answer) */
  @Post('audit')
  async insertAudit(
    @Request() req: any,
    @Body()
    body: {
      requestId: string;
      associationId?: string | null;
      capability: string;
      permissionLevel: string;
      provider: string;
      model?: string | null;
      usedFallback?: boolean;
      fallbackReason?: string | null;
      providerLatencyMs?: number;
      totalLatencyMs?: number;
      sourceTypes?: string[];
      sourceCount?: number;
      action?: string;
      target?: string;
    },
  ) {
    await this.aiService.insertAiAudit({
      requestId: body.requestId,
      userId: req.user.id,
      associationId: body.associationId ?? null,
      capability: body.capability ?? 'unknown',
      permissionLevel: body.permissionLevel ?? 'member',
      provider: body.provider ?? 'unknown',
      model: body.model ?? null,
      usedFallback: body.usedFallback ?? false,
      fallbackReason: body.fallbackReason ?? null,
      providerLatencyMs: body.providerLatencyMs ?? 0,
      totalLatencyMs: body.totalLatencyMs ?? 0,
      sourceTypes: body.sourceTypes ?? [],
      sourceCount: body.sourceCount ?? 0,
    });

    if (body.action) {
      await this.aiService.logActivity({
        userId: req.user.id,
        action: body.action,
        target: body.target ?? '',
        category: 'ai',
      });
    }

    return { ok: true };
  }

  /** GET /api/ai/activity-log — Danh sách activity log */
  @Get('activity-log')
  async listActivityLog() {
    return this.aiService.listActivityLog();
  }

  /** DELETE /api/ai/activity-log/:id — Xóa một entry */
  @Delete('activity-log/:id')
  async deleteActivityLog(@Param('id') id: string) {
    await this.aiService.deleteActivityLog(id);
    return { ok: true };
  }

  /** POST /api/ai/activity-log/clear — Xóa toàn bộ */
  @Post('activity-log/clear')
  async clearActivityLog() {
    await this.aiService.clearActivityLog();
    return { ok: true };
  }

  // ==========================================
  // AI QUOTA & USER MANAGEMENT (50 QUESTIONS LIMIT)
  // ==========================================

  /** GET /api/ai/quota — Lấy hạn mức 50 câu hỏi của tài khoản hiện tại */
  @Get('quota')
  async getMyQuota(@Request() req: any) {
    const quota = await this.aiService.getUserQuota(req.user.id);
    return { ok: true, data: quota };
  }

  /** POST /api/ai/quota/record — Ghi nhận 1 câu hỏi và kiểm tra hạn mức */
  @Post('quota/record')
  async recordQuestion(
    @Request() req: any,
    @Body() body: { question?: string },
  ) {
    const result = await this.aiService.checkAndIncrementUserQuota(
      req.user.id,
      body.question,
    );
    return { ok: result.allowed, data: result.quota };
  }

  /** GET /api/ai/admin/users — Danh sách người dùng, thống kê và tình trạng hạn mức AI */
  @Get('admin/users')
  async listUsersAiUsage(@Request() req: any) {
    const search = req.query?.search as string | undefined;
    const status = req.query?.status as string | undefined;
    const res = await this.aiService.listUsersAiUsage({ search, status });
    return { ok: true, data: res };
  }

  /** POST /api/ai/admin/users/reset — Cấp thêm câu hỏi hoặc đặt lại về 0 */
  @Post('admin/users/reset')
  async resetOrAdjustUserQuota(
    @Request() req: any,
    @Body()
    body: {
      userId: string;
      resetCount?: boolean;
      addExtra?: number;
      newLimit?: number;
      unblock?: boolean;
    },
  ) {
    const res = await this.aiService.resetOrAdjustUserQuota(body.userId, body);
    return res;
  }

  /** POST /api/ai/admin/users/block — Khóa hoặc mở khóa quyền AI của người dùng */
  @Post('admin/users/block')
  async toggleBlockUserAi(
    @Request() req: any,
    @Body() body: { userId: string; blocked: boolean },
  ) {
    const res = await this.aiService.toggleBlockUserAi(
      body.userId,
      body.blocked,
    );
    return res;
  }

  // ==========================================
  // SYSTEM AI CONFIGURATION & AUDIT LOGS
  // ==========================================

  /** GET /api/ai/system-config — Lấy cấu hình đa model AI & cảnh báo hạn mức */
  @Get('system-config')
  async getSystemConfig() {
    const config = await this.crmAnalytics.getSystemConfig();
    return { ok: true, data: config };
  }

  /** POST /api/ai/system-config — Lưu cấu hình đa model AI & fallback */
  @Post('system-config')
  async saveSystemConfig(@Request() req: any, @Body() body: any) {
    const res = await this.crmAnalytics.saveSystemConfig(body, req.user?.id);
    return res;
  }

  /** POST /api/ai/test-connection — Kiểm tra kết nối model */
  @Post('test-connection')
  async testConnection(
    @Body() body: { provider: string; apiKey?: string; model?: string },
  ) {
    const res = await this.crmAnalytics.testConnection(
      body.provider,
      body.apiKey,
      body.model,
    );
    return res;
  }

  /** GET /api/ai/system-logs — Lấy danh sách nhật ký thao tác AI */
  @Get('system-logs')
  async getSystemLogs() {
    const logs = await this.crmAnalytics.getSystemLogs();
    return { ok: true, data: logs };
  }

  // ==========================================
  // CRM EXECUTIVE AI & SUB-REPORTS
  // ==========================================

  /** GET /api/ai/crm/analyze — Phân tích toàn diện CRM realtime */
  @Get('crm/analyze')
  async analyzeCrmData(@Request() req: any) {
    const res = await this.crmAnalytics.analyzeCrmData(req.user.id);
    return { ok: true, data: res };
  }

  /** POST /api/ai/crm/export-report — Xuất báo cáo theo chức năng con (thu chi, hóa đơn/phiếu thu, danh mục tiền thu) */
  @Post('crm/export-report')
  async exportSubReport(
    @Request() req: any,
    @Body()
    body: {
      type: 'financial_summary' | 'invoice' | 'receipt' | 'events_report' | 'income_category';
      options?: any;
    },
  ) {
    const res = await this.crmAnalytics.exportSubReport(
      req.user.id,
      body.type,
      body.options,
    );
    return res;
  }

  /** POST /api/ai/crm/chat — Trò chuyện Trợ lý AI chuẩn ChatGPT với Live Context CRM & Model Free */
  @Post('crm/chat')
  async crmChat(
    @Request() req: any,
    @Body()
    body: {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      model?: string;
      persona?: any;
    },
  ) {
    const res = await this.crmAnalytics.handleChatAssistant(
      req.user?.id || 'admin',
      body.message,
      body.history || [],
      body.model,
      body.persona,
    );
    return res;
  }

  /** POST /api/ai/auto-execute-command — Tự động ra lệnh & thực thi tác vụ AI theo lệnh người dùng (Gửi mail sự kiện, Nhắc phí, Lớp học, Xuất báo cáo...) */
  @Post('auto-execute-command')
  async autoExecuteCommand(
    @Request() req: any,
    @Body()
    body: {
      command: string;
      taskType?: string;
      fileName?: string;
      recipients?: any[];
      eventOrCourseName?: string;
    },
  ) {
    const res = await this.crmAnalytics.handleAutoExecuteCommand(
      req?.user?.id || 'admin',
      body,
    );
    return res;
  }

  // ==========================================
  // KNOWLEDGE BASE (BRD, SRS, DATABASE, RESTFUL API)
  // ==========================================

  /** GET /api/ai/knowledge/docs — Danh mục tài liệu kỹ thuật BRD, SRS, CSDL & API đã nạp cho AI */
  @Get('knowledge/docs')
  async listKnowledgeDocs() {
    const docs = this.knowledgeBase.getRegisteredDocuments();
    return { ok: true, data: docs };
  }

  /** GET /api/ai/knowledge/docs/:code — Tra cứu chi tiết tài liệu kỹ thuật theo mã code */
  @Get('knowledge/docs/:code')
  async getKnowledgeDocDetail(@Param('code') code: string) {
    return this.knowledgeBase.queryTechnicalDocument(code);
  }

  // ==========================================
  // PHÂN QUYỀN CHO AI (AI RBAC PERMISSIONS)
  // ==========================================

  /** GET /api/ai/permissions/matrix — Lấy ma trận phân quyền Trợ Lý AI từ CSDL PostgreSQL */
  @Get('permissions/matrix')
  async getAiPermissionMatrix() {
    const matrixData = await this.aiPermission.getAiPermissionMatrix();
    return { ok: true, data: matrixData };
  }

  /** PUT /api/ai/permissions/matrix — Cập nhật ma trận phân quyền Trợ Lý AI vào CSDL PostgreSQL */
  @Put('permissions/matrix')
  async updateAiPermissionMatrix(@Body() body: { matrix: Record<string, Record<string, boolean>> }) {
    return this.aiPermission.saveAiPermissionMatrix(body.matrix);
  }

  /** GET /api/ai/permissions/my — Kiểm tra danh sách quyền hạn AI của người dùng phiên hiện tại */
  @Get('permissions/my')
  async getMyAiPermissions(@Request() req: any) {
    const matrixData = await this.aiPermission.getAiPermissionMatrix();
    const myAllowedCaps: string[] = [];

    for (const cap of matrixData.capabilities) {
      const allowed = await this.aiPermission.checkUserAiCapability(req.user.id, cap.code);
      if (allowed) {
        myAllowedCaps.push(cap.code);
      }
    }

    return { ok: true, data: { allowedCapabilities: myAllowedCaps } };
  }

  // ==========================================
  // ACTION AGENT CORE & TOOLS EXECUTION ENGINE
  // ==========================================

  /** POST /api/ai/agent/execute — Lập kế hoạch hành động và điều phối thực thi nghiệp vụ tự động */
  @Post('agent/execute')
  async executeAgentTask(
    @Request() req: any,
    @Body()
    body: {
      goal: string;
      files?: Array<{ name: string; type: string; base64?: string; text?: string }>;
      approvedSteps?: string[];
      history?: Array<{ role: string; content: string }>;
    },
  ) {
    const plan = await this.agentCore.planAndExecute(
      body.goal,
      {
        userId: req?.user?.id || 'admin',
        userRole: req?.user?.role || 'admin',
        userEmail: req?.user?.email,
        userName: req?.user?.fullName || req?.user?.username,
      },
      {
        files: body.files,
        approvedSteps: body.approvedSteps,
        history: body.history,
      },
    );
    return { ok: true, data: plan };
  }

  /** POST /api/ai/agent/confirm-step — Người dùng phê duyệt hoặc từ chối thực hiện hành động nhạy cảm */
  @Post('agent/confirm-step')
  async confirmAgentStep(
    @Request() req: any,
    @Body()
    body: {
      taskId: string;
      stepId: string;
      approved: boolean;
    },
  ) {
    const plan = await this.agentCore.confirmStep(
      body.taskId,
      body.stepId,
      body.approved,
      {
        userId: req?.user?.id || 'admin',
        userRole: req?.user?.role || 'admin',
        userEmail: req?.user?.email,
        userName: req?.user?.fullName || req?.user?.username,
        approved: body.approved,
      },
    );
    return { ok: true, data: plan };
  }

  /** POST /api/ai/agent/retry-step — Thử lại bước bị lỗi trong quy trình liên hoàn */
  @Post('agent/retry-step')
  async retryAgentStep(
    @Request() req: any,
    @Body()
    body: {
      taskId: string;
      stepId: string;
      modifiedParams?: Record<string, any>;
    },
  ) {
    const plan = await this.agentCore.retryStep(
      body.taskId,
      body.stepId,
      body.modifiedParams,
      {
        userId: req?.user?.id || 'admin',
        userRole: req?.user?.role || 'admin',
        userEmail: req?.user?.email,
        userName: req?.user?.fullName || req?.user?.username,
      },
    );
    return { ok: true, data: plan };
  }

  /** POST /api/ai/agent/skip-step — Bỏ qua bước lỗi để tiếp tục các bước sau */
  @Post('agent/skip-step')
  async skipAgentStep(
    @Request() req: any,
    @Body()
    body: {
      taskId: string;
      stepId: string;
    },
  ) {
    const plan = await this.agentCore.skipStep(
      body.taskId,
      body.stepId,
      {
        userId: req?.user?.id || 'admin',
        userRole: req?.user?.role || 'admin',
        userEmail: req?.user?.email,
        userName: req?.user?.fullName || req?.user?.username,
      },
    );
    return { ok: true, data: plan };
  }

  /** POST /api/ai/agent/abort-task — Hủy bỏ toàn bộ các bước còn lại của nhiệm vụ */
  @Post('agent/abort-task')
  async abortAgentTask(
    @Request() req: any,
    @Body()
    body: {
      taskId: string;
    },
  ) {
    const plan = await this.agentCore.abortTask(body.taskId);
    return { ok: true, data: plan };
  }

  /** GET /api/ai/agent/task/:taskId — Lấy trạng thái kế hoạch và tiến trình thực thi nhiệm vụ */
  @Get('agent/task/:taskId')
  async getAgentTaskStatus(@Param('taskId') taskId: string) {
    const plan = this.agentCore.getTask(taskId);
    if (!plan) {
      return { ok: false, error: 'Không tìm thấy nhiệm vụ' };
    }
    return { ok: true, data: plan };
  }

  /** GET /api/ai/agent/tools — Lấy danh mục tất cả công cụ nghiệp vụ sẵn có trong hệ thống */
  @Get('agent/tools')
  async getAvailableAgentTools() {
    const tools = this.agentCore.getAvailableTools();
    return { ok: true, data: tools };
  }

  /** POST /api/ai/tools/execute — Thực thi trực tiếp tool AI (tạo thư mời, thêm học viên, giảng viên, lớp học) */
  @Post('tools/execute')
  async executeAiTool(
    @Request() req: any,
    @Body() body: { toolName: string; params: Record<string, any> },
  ) {
    return this.toolRegistry.executeTool(body.toolName, body.params || {}, {
      userId: req?.user?.id || req?.user?.sub || 'admin',
      userRole: req?.user?.role || 'admin',
      userEmail: req?.user?.email,
      userName: req?.user?.fullName || req?.user?.username,
      approved: true,
    });
  }
}
