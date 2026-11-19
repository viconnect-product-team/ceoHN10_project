import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ToolRegistryService } from './tool-registry.service';
import { LlmProviderAdapter } from './llm-provider.adapter';
import {
  AgentTaskExecutionPlan,
  AgentTaskStep,
  ToolExecutionContext,
  ToolExecutionResult,
} from './tool.interface';

@Injectable()
export class AgentCoreService {
  private readonly logger = new Logger(AgentCoreService.name);

  // Bộ nhớ đệm lưu trữ tiến trình nhiệm vụ (In-memory Task Store)
  private readonly activePlans = new Map<string, AgentTaskExecutionPlan>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly toolRegistry: ToolRegistryService,
    private readonly llmAdapter: LlmProviderAdapter,
  ) {}

  /**
   * Tiếp nhận yêu cầu ngôn ngữ tự nhiên, lập kế hoạch hành động và điều phối thực thi
   */
  async planAndExecute(
    goal: string,
    context: ToolExecutionContext,
    options?: {
      files?: Array<{ name: string; type: string; base64?: string; text?: string }>;
      approvedSteps?: string[];
      history?: Array<{ role: string; content: string }>;
    },
  ): Promise<AgentTaskExecutionPlan> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.logger.log(`Bắt đầu lập kế hoạch nhiệm vụ [${taskId}]: "${goal}"`);

    // 1. Lấy danh sách định nghĩa các Tools hiện có
    const tools = this.toolRegistry.getToolsDefinitions();

    // 2. Xây dựng System Prompt định hướng Agent
    const systemPrompt = `
Bạn là AI Agent Điều Hành & Thực Thi Nghiệp Vụ Tối Cao của CLB Doanh Nhân CEO HN10 (HanoiBA).
Nhiệm vụ của bạn là:
1. Hiểu sâu sắc ý định người dùng (tìm kiếm danh bạ, tài chính quỹ, tạo sự kiện, đọc file, gửi email thông báo).
2. Tự động lập kế hoạch và lựa chọn các Tools/Function Calling phù hợp nhất.
3. KHÔNG trả lời bằng văn bản chung chung khi người dùng yêu cầu thực hiện hành động. Hãy gọi Tool tương ứng.
4. Với các tác vụ gửi email hoặc thay đổi dữ liệu (EXTERNAL_ACTION/WRITE), bạn phải chuẩn bị trước (prepare) và tạo bản xem trước (preview) để người dùng xác nhận trước khi thực hiện.
5. Danh bạ, thông tin hội viên, dòng tiền quỹ và sự kiện phải được truy vấn trung thực từ cơ sở dữ liệu hệ thống.
`;

    // Nếu có file đính kèm, bổ sung thông tin vào prompt
    let enhancedGoal = goal;
    if (options?.files && options.files.length > 0) {
      enhancedGoal += `\n[Tài liệu đính kèm: ${options.files.map((f) => f.name).join(', ')}]`;
    }

    // 3. Gọi LLM Adapter kèm Tools
    const llmRes = await this.llmAdapter.generateWithTools(
      systemPrompt,
      enhancedGoal,
      tools,
      options?.history,
    );

    // 4. Khởi tạo danh sách các bước thực thi (Steps)
    const steps: AgentTaskStep[] = [];

    // Nếu có file đính kèm mà chưa có tool đọc file, thêm bước đọc file đầu tiên
    if (options?.files && options.files.length > 0) {
      steps.push({
        id: `step_file_parse`,
        stepNumber: 1,
        toolName: 'parse_and_analyze_document',
        title: `Phân tích dữ liệu từ ${options.files.length} tệp: ${options.files.map((f) => f.name).join(', ')}`,
        description: 'Trích xuất cấu trúc danh sách, bảng biểu, họ tên, email, số điện thoại hoặc lịch trình',
        safetyLevel: 'READ',
        status: 'pending',
        params: {
          fileName: options.files[0].name,
          documentText: options.files.map((f) => `=== TỆP: ${f.name} ===\n${f.text || ''}`).join('\n\n'),
          documents: JSON.stringify(
            options.files.map((f) => ({
              fileName: f.name,
              fileType: f.type,
              documentText: f.text || '',
            })),
          ),
          extractFields: ['name', 'email', 'phone', 'company', 'position'],
        },
      });

      // Nếu có từ 2 file hoặc người dùng yêu cầu đối chiếu so sánh
      const isReconcileIntent =
        options.files.length >= 2 ||
        /(so sánh|đối chiếu|kiểm tra trùng|lệch|chưa nộp|danh sách mới)/i.test(goal);

      if (isReconcileIntent) {
        steps.push({
          id: `step_reconcile`,
          stepNumber: 2,
          toolName: 'compare_and_reconcile_documents',
          title: `Đối chiếu dữ liệu giữa các tệp / CSDL Hội viên`,
          description: 'So sánh danh sách đại biểu, kiểm tra trùng lặp và xác định người chưa có trong hệ thống',
          safetyLevel: 'READ',
          status: 'pending',
          params: {
            sourceFileName: options.files[0]?.name || 'CSDL_HOI_VIEN',
            targetFileName: options.files[1]?.name || options.files[0]?.name,
            targetEmails: '[]', // Sẽ được handoff từ step_file_parse
          },
        });
      }
    }

    // Phân tích các tool calls được sinh ra từ LLM
    if (llmRes.toolCalls && llmRes.toolCalls.length > 0) {
      for (let i = 0; i < llmRes.toolCalls.length; i++) {
        const call = llmRes.toolCalls[i];
        const toolDef = this.toolRegistry.getTool(call.name)?.definition;
        const stepNum = steps.length + 1;

        steps.push({
          id: `step_${stepNum}_${call.name}`,
          stepNumber: stepNum,
          toolName: call.name,
          title: toolDef?.displayName || call.name,
          description: toolDef?.description || 'Thực thi hành động nghiệp vụ',
          safetyLevel: toolDef?.safetyLevel || 'READ',
          status: 'pending',
          params: call.arguments,
          requiresApproval: toolDef?.safetyLevel === 'EXTERNAL_ACTION',
        });
      }
    } else {
      // Nếu không có tool calls, tạo một bước phản hồi thông tin trực tiếp
      steps.push({
        id: `step_direct_response`,
        stepNumber: 1,
        toolName: 'direct_response',
        title: 'Phân tích & Phản hồi nghiệp vụ',
        description: 'Tổng hợp thông tin trả lời trực tiếp cho người dùng',
        safetyLevel: 'READ',
        status: 'completed',
        result: {
          message: llmRes.content || 'Đã tiếp nhận và phân tích yêu cầu của Anh/Chị.',
        },
        completedAt: new Date().toISOString(),
      });
    }

    // Khởi tạo Kế hoạch tổng thể (Execution Plan) với Workflow Context
    const initialWorkflowContext: Record<string, any> = {
      files: options?.files || [],
    };

    const plan: AgentTaskExecutionPlan = {
      taskId,
      userId: context.userId,
      goal,
      status: 'executing',
      currentStepIndex: 0,
      steps,
      workflowContext: initialWorkflowContext,
      chainSummary: [],
      overallSummary: llmRes.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.activePlans.set(taskId, plan);

    // 5. Tiến hành chạy tuần tự các bước
    return this.runStepPipeline(plan, context, options?.approvedSteps || []);
  }

  /**
   * Điều phối thực thi tuần tự pipeline các bước (Multi-step Action Chaining)
   */
  private async runStepPipeline(
    plan: AgentTaskExecutionPlan,
    context: ToolExecutionContext,
    approvedSteps: string[],
  ): Promise<AgentTaskExecutionPlan> {
    for (let i = plan.currentStepIndex; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      plan.currentStepIndex = i;

      // Nếu bước đã hoàn thành thì bỏ qua
      if (step.status === 'completed' || step.status === 'skipped') {
        continue;
      }

      // Xử lý bước phản hồi trực tiếp (không cần gọi tool registry)
      if (step.toolName === 'direct_response') {
        step.status = 'completed';
        step.completedAt = new Date().toISOString();
        continue;
      }

      const tool = this.toolRegistry.getTool(step.toolName);
      if (!tool) {
        step.status = 'failed';
        step.error = `Tool ${step.toolName} không có trong Registry.`;
        plan.status = 'halted';
        break;
      }

      // 1. Tự động chuyển giao dữ liệu (Extensible Context Contract Handoff)
      const { params: resolvedParams, handoffSummary } = this.toolRegistry.transformStepParams(
        step.toolName,
        step.params || {},
        plan.workflowContext || {},
      );
      step.params = resolvedParams;

      if (handoffSummary) {
        step.dataHandoff = {
          sourceStepId: i > 0 ? plan.steps[i - 1]?.id : undefined,
          summary: handoffSummary,
          keys: tool.definition.contextContract?.consumes || [],
        };
        plan.chainSummary = plan.chainSummary || [];
        plan.chainSummary.push({
          fromStep: i > 0 ? plan.steps[i - 1]?.title || 'Bước trước' : 'Đầu vào tệp',
          toStep: step.title,
          key: (tool.definition.contextContract?.consumes || []).join(', ') || 'data_flow',
          desc: handoffSummary,
        });
      }

      // 2. Kiểm tra an toàn: EXTERNAL_ACTION bắt buộc phê duyệt
      const isApproved = approvedSteps.includes(step.id) || context.approved === true;

      if (tool.definition.safetyLevel === 'EXTERNAL_ACTION' && !isApproved) {
        step.status = 'waiting_approval';
        step.requiresApproval = true;
        plan.status = 'waiting_approval';
        this.logger.log(
          `Tác vụ [${plan.taskId}] tạm dừng tại bước [${step.id}] để chờ người dùng xác nhận.`,
        );
        break; // Tạm dừng và trả về Plan cho người dùng xem trước & xác nhận
      }

      // Bắt đầu chạy bước
      step.status = 'running';
      step.startedAt = new Date().toISOString();
      plan.updatedAt = new Date().toISOString();

      try {
        const executionResult: ToolExecutionResult = await this.toolRegistry.executeTool(
          step.toolName,
          step.params || {},
          { ...context, approved: isApproved },
        );

        if (executionResult.requiresApproval) {
          step.status = 'waiting_approval';
          step.requiresApproval = true;
          step.approvalData = executionResult.approvalPayload;
          plan.status = 'waiting_approval';
          break;
        }

        if (executionResult.success) {
          step.status = 'completed';
          step.result = executionResult.data;
          step.completedAt = new Date().toISOString();

          // Trích xuất kết quả vào Workflow Context để phục vụ các bước sau trong chuỗi
          const extractedContext = this.toolRegistry.extractStepContext(
            step.toolName,
            executionResult.data,
            step.params || {},
          );
          plan.workflowContext = {
            ...(plan.workflowContext || {}),
            ...extractedContext,
          };
        } else {
          step.status = 'failed';
          step.error = executionResult.error || 'Thực thi thất bại';
          plan.status = 'halted'; // Tạm dừng an toàn để người dùng chọn Thử lại hoặc Bỏ qua
          this.logger.warn(`Bước [${step.id}] thất bại. Kế hoạch [${plan.taskId}] chuyển sang trạng thái halted.`);
          break;
        }
      } catch (err: any) {
        this.logger.error(`Lỗi thực thi step [${step.id}]: ${err?.message}`);
        step.status = 'failed';
        step.error = err?.message;
        plan.status = 'halted';
        break;
      }
    }

    // Kiểm tra xem tất cả các bước đã hoàn thành chưa
    const allCompleted = plan.steps.every(
      (s) => s.status === 'completed' || s.status === 'skipped',
    );
    if (allCompleted) {
      plan.status = 'completed';
      plan.overallSummary = this.buildOverallSummary(plan);
    }

    plan.updatedAt = new Date().toISOString();
    this.activePlans.set(plan.taskId, plan);
    return plan;
  }

  /**
   * Người dùng phê duyệt hoặc từ chối một bước nhạy cảm (External Action Confirmation)
   */
  async confirmStep(
    taskId: string,
    stepId: string,
    approved: boolean,
    context: ToolExecutionContext,
  ): Promise<AgentTaskExecutionPlan> {
    const plan = this.activePlans.get(taskId);
    if (!plan) {
      throw new Error(`Nhiệm vụ [${taskId}] không tồn tại hoặc đã hết hạn.`);
    }

    const step = plan.steps.find((s) => s.id === stepId);
    if (!step) {
      throw new Error(`Bước [${stepId}] không tồn tại trong nhiệm vụ.`);
    }

    if (!approved) {
      step.status = 'skipped';
      step.error = 'Người dùng đã hủy thực hiện hành động này.';
      plan.status = 'partially_completed';
      plan.updatedAt = new Date().toISOString();
      return plan;
    }

    this.logger.log(`Người dùng đã PHÊ DUYỆT bước [${stepId}] của nhiệm vụ [${taskId}]. Tiến hành thực thi...`);
    return this.runStepPipeline(plan, context, [stepId]);
  }

  /**
   * Thử lại một bước bị lỗi (Retry Step - Failure Recovery)
   */
  async retryStep(
    taskId: string,
    stepId: string,
    modifiedParams?: Record<string, any>,
    context?: ToolExecutionContext,
  ): Promise<AgentTaskExecutionPlan> {
    const plan = this.activePlans.get(taskId);
    if (!plan) throw new Error(`Nhiệm vụ [${taskId}] không tồn tại.`);
    const stepIndex = plan.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) throw new Error(`Bước [${stepId}] không tồn tại.`);

    const step = plan.steps[stepIndex];
    step.status = 'pending';
    step.error = undefined;
    if (modifiedParams) {
      step.params = { ...step.params, ...modifiedParams };
    }
    plan.status = 'executing';
    plan.currentStepIndex = stepIndex;

    this.logger.log(`Đang thử lại bước [${stepId}] của nhiệm vụ [${taskId}]...`);
    return this.runStepPipeline(plan, context || { userId: plan.userId }, []);
  }

  /**
   * Bỏ qua một bước bị lỗi để tiếp tục các bước tiếp theo trong chuỗi (Skip Step & Continue)
   */
  async skipStep(
    taskId: string,
    stepId: string,
    context?: ToolExecutionContext,
  ): Promise<AgentTaskExecutionPlan> {
    const plan = this.activePlans.get(taskId);
    if (!plan) throw new Error(`Nhiệm vụ [${taskId}] không tồn tại.`);
    const stepIndex = plan.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) throw new Error(`Bước [${stepId}] không tồn tại.`);

    const step = plan.steps[stepIndex];
    step.status = 'skipped';
    step.error = 'Đã bỏ qua theo yêu cầu người dùng.';
    step.completedAt = new Date().toISOString();
    plan.status = 'executing';
    plan.currentStepIndex = stepIndex + 1;

    this.logger.log(`Đã bỏ qua bước [${stepId}]. Tiến hành các bước tiếp theo của [${taskId}]...`);
    return this.runStepPipeline(plan, context || { userId: plan.userId }, []);
  }

  /**
   * Hủy bỏ toàn bộ các bước còn lại của nhiệm vụ (Abort Task)
   */
  async abortTask(taskId: string): Promise<AgentTaskExecutionPlan> {
    const plan = this.activePlans.get(taskId);
    if (!plan) throw new Error(`Nhiệm vụ [${taskId}] không tồn tại.`);

    for (let i = plan.currentStepIndex; i < plan.steps.length; i++) {
      if (plan.steps[i].status === 'pending' || plan.steps[i].status === 'waiting_approval') {
        plan.steps[i].status = 'skipped';
        plan.steps[i].error = 'Nhiệm vụ đã bị hủy bởi người dùng.';
      }
    }
    plan.status = 'failed';
    plan.updatedAt = new Date().toISOString();
    this.logger.log(`Nhiệm vụ [${taskId}] đã bị hủy bởi người dùng.`);
    return plan;
  }

  /**
   * Lấy thông tin trạng thái nhiệm vụ hiện tại
   */
  getTask(taskId: string): AgentTaskExecutionPlan | undefined {
    return this.activePlans.get(taskId);
  }

  /**
   * Lấy danh sách định nghĩa tất cả các Tools để hiển thị trên UI
   */
  getAvailableTools() {
    return this.toolRegistry.getToolsDefinitions();
  }

  /**
   * Tự động tổng hợp thông điệp báo cáo hoàn thành sau khi chạy hết pipeline
   */
  private buildOverallSummary(plan: AgentTaskExecutionPlan): string {
    const completedSteps = plan.steps.filter((s) => s.status === 'completed');
    const summaries: string[] = [];

    for (const step of completedSteps) {
      if (step.toolName === 'query_members' && step.result?.members) {
        summaries.push(`✅ Đã tra cứu thành công ${step.result.total} học viên/hội viên.`);
      } else if (step.toolName === 'query_finance_records' && step.result) {
        summaries.push(`✅ Đã trích xuất ${step.result.totalCount} giao dịch sổ quỹ.`);
      } else if (step.toolName === 'prepare_email_broadcast' && step.result) {
        summaries.push(`✅ Đã chuẩn bị bản xem trước gửi thư cho ${step.result.totalCount} người nhận.`);
      } else if (step.toolName === 'dispatch_batch_email' && step.result) {
        summaries.push(
          `🚀 Đã gửi thành công ${step.result.successCount} email thực tế qua SMTP Gmail (Thất bại: ${step.result.failCount || 0}, Chống gửi trùng bỏ qua: ${step.result.alreadySentCount || 0}).`,
        );
      } else if (step.toolName === 'resend_failed_emails' && step.result) {
        summaries.push(
          `🔄 Đã gửi lại thành công ${step.result.resentSuccessCount}/${step.result.totalAttempted || 0} email lỗi trước đó.`,
        );
      } else if (step.toolName === 'query_email_history' && step.result) {
        summaries.push(
          `📬 Nhật ký thư điện tử: Tìm thấy ${step.result.totalLogs} bản ghi (Đã gửi: ${step.result.overallStats?.sent_count || 0}, Thất bại: ${step.result.overallStats?.failed_count || 0}).`,
        );
      } else if (step.toolName === 'create_calendar_meeting' && step.result) {
        summaries.push(
          `📅 Đã tạo lịch sự kiện & cuộc họp: "${step.result.title}" (${step.result.date} ${step.result.time}). Đã tra cứu email cho ${step.result.matchedWithEmailCount || 0}/${step.result.totalAttendees || 0} đại biểu.${step.result.conflictDetected ? ` (Lưu ý: Phát hiện ${step.result.conflictingEvents?.length || 0} lịch trùng trong ngày).` : ''}`,
        );
      } else if (step.toolName === 'check_calendar_availability' && step.result) {
        summaries.push(
          `🔍 Đã kiểm tra lịch trình ngày ${step.result.scannedDate}: Phát hiện ${step.result.totalEventsFound} sự kiện/cuộc họp bận. Khung giờ khả dụng: ${step.result.availableSlots?.join(', ') || 'Đã kín lịch'}.`,
        );
      } else if (step.toolName === 'parse_and_analyze_document' && step.result) {
        summaries.push(`📄 Đã phân tích ${step.result.totalFiles || 1} tài liệu: Trích xuất ${step.result.totalRecipients || 0} địa chỉ email và cấu trúc nội dung.`);
      } else if (step.toolName === 'query_system_analytics' && step.result) {
        summaries.push(
          `📊 Báo cáo tra cứu hệ thống (${step.result.title || 'Data Query'}): ${step.result.textSummary || `Đã trích xuất ${step.result.tableData?.total || 0} bản ghi và tính toán các chỉ số KPI.`}`,
        );
      } else if (step.toolName === 'compare_and_reconcile_documents' && step.result) {
        summaries.push(
          `⚖️ Đã đối chiếu tài liệu: ${step.result.matchedCount} trùng khớp, ${step.result.missingInTargetCount} chưa có trong tệp đối chiếu, ${step.result.newInTargetCount} đăng ký mới.`,
        );
      }
    }

    if (summaries.length === 0) {
      return plan.overallSummary || 'Nhiệm vụ đã được xử lý hoàn tất.';
    }

    return `### 🎯 BÁO CÁO THỰC THI NHIỆM VỤ HOÀN TẤT\n\n${summaries.join('\n\n')}`;
  }
}
