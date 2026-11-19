/**
 * ĐỊNH NGHĨA KIẾN TRÚC TOOLS / FUNCTION CALLING CHO AI AGENT
 * Hệ thống CLB Doanh Nhân CEO HN10 (HanoiBA)
 * Tuân thủ phân cấp an toàn 4 mức: READ | PREVIEW | WRITE | EXTERNAL_ACTION
 */

export type ToolSafetyLevel = 'READ' | 'PREVIEW' | 'WRITE' | 'EXTERNAL_ACTION';

export type ToolCategory =
  | 'email'
  | 'document'
  | 'calendar'
  | 'contact'
  | 'data_query'
  | 'workflow';

export interface ToolParameterProperty {
  type: string;
  description: string;
  enum?: string[];
  default?: any;
  items?: {
    type: string;
    description?: string;
  };
}

export interface ToolContextContract {
  consumes?: string[]; // Các key dữ liệu mà tool cần nhận từ context chung
  produces?: string[]; // Các key dữ liệu mà tool sẽ sinh ra để nạp vào context chung
  transformParams?: (
    currentParams: Record<string, any>,
    workflowContext: Record<string, any>,
  ) => { params: Record<string, any>; handoffSummary?: string };
  extractContext?: (
    resultData: any,
    currentParams: Record<string, any>,
  ) => Record<string, any>;
}

export interface ToolDefinition {
  name: string;
  displayName: string;
  description: string;
  category: ToolCategory;
  safetyLevel: ToolSafetyLevel;
  requiredPermission?: string;
  contextContract?: ToolContextContract;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameterProperty>;
    required?: string[];
  };
  returns: {
    type: string;
    description: string;
  };
}

export interface ToolExecutionContext {
  userId: string;
  userRole?: string;
  userEmail?: string;
  userName?: string;
  sessionId?: string;
  approved?: boolean;
}

export interface ToolExecutionResult {
  success: boolean;
  toolName: string;
  data?: any;
  error?: string;
  auditMessage?: string;
  requiresApproval?: boolean;
  approvalPayload?: {
    actionType: string;
    summary: string;
    recipientsCount?: number;
    previewData?: any;
  };
  metadata?: Record<string, any>;
}

export interface IAgentTool {
  readonly definition: ToolDefinition;
  execute(
    params: Record<string, any>,
    context: ToolExecutionContext,
  ): Promise<ToolExecutionResult>;
}

export interface StepDataHandoff {
  sourceStepId?: string;
  summary: string;
  keys: string[];
}

export interface AgentTaskStep {
  id: string;
  stepNumber: number;
  toolName: string;
  title: string;
  description: string;
  safetyLevel: ToolSafetyLevel;
  status:
    | 'pending'
    | 'running'
    | 'waiting_approval'
    | 'completed'
    | 'failed'
    | 'skipped';
  params?: Record<string, any>;
  result?: any;
  error?: string;
  requiresApproval?: boolean;
  approvalData?: any;
  dataHandoff?: StepDataHandoff;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowChainSummaryItem {
  fromStep: string;
  toStep: string;
  key: string;
  count?: number;
  desc: string;
}

export interface AgentTaskExecutionPlan {
  taskId: string;
  userId: string;
  goal: string;
  status:
    | 'planning'
    | 'waiting_approval'
    | 'executing'
    | 'completed'
    | 'partially_completed'
    | 'halted'
    | 'failed';
  currentStepIndex: number;
  steps: AgentTaskStep[];
  workflowContext?: Record<string, any>;
  chainSummary?: WorkflowChainSummaryItem[];
  overallSummary?: string;
  createdAt: string;
  updatedAt: string;
}
