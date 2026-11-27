import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Brain,
  Layers,
  ChevronDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Database,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  Handshake,
  Calendar,
  Users,
  AlertCircle,
  ArrowUp,
  SlidersHorizontal,
  Bell,
  FileText,
  Briefcase,
  Bot,
  Paperclip,
  X,
  FileSpreadsheet as FileSpreadsheetIcon,
  Download,
  BarChart3,
  Eye,
  EyeOff,
  Printer,
  FileDown,
  UploadCloud,
  Workflow,
  RefreshCw,
  SkipForward,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { ViOneAiTutorGuide } from "../common/ViOneAiTutorGuide";
import { parseMultipleFiles, parseSingleDocument, type ParsedFileResult, type ParsedRecipientItem } from "@/lib/ai-excel-email-parser";
import { AiExecutionStepTracker, type AgentTaskExecutionPlan } from "./AiExecutionStepTracker";
import { AiQuickOpsDrawer } from "./AiQuickOpsDrawer";
import {
  exportToExcel,
  formatDisplayDate,
  formatExcelCurrency,
  numberToVietnameseWords,
} from "@/lib/excel-export";
import * as XLSX from "xlsx";

export type AiPersonaType = "general" | "opportunity" | "events" | "meetings" | "finance" | "documents";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  model?: string;
  latencyMs?: number;
  persona?: AiPersonaType;
  evidence?: Array<{ title: string; countOrVal: string; source: string }>;
  proactiveAlert?: string;
  agentPlan?: AgentTaskExecutionPlan;
  attachedFile?: {
    name: string;
    size: number;
    emailCount: number;
    recipients: ParsedRecipientItem[];
  };
  attachedFiles?: Array<{
    name: string;
    size: number;
    fileType: string;
    emailCount: number;
    recipients?: ParsedRecipientItem[];
  }>;
  executionPipeline?: {
    taskType: "event_email" | "fee_reminder" | "training_notice" | "report_export" | "general";
    commandText: string;
    fileName?: string;
    recipients: ParsedRecipientItem[];
    emailDraft?: { subject: string; body: string };
  };
  interactiveActions?: {
    type: "report_category_selector";
    title: string;
    subtitle?: string;
    targetDate: string;
    targetDateFormatted: string;
    isTodayRecords?: boolean;
    totalAvailableIncome?: number;
    todayTotal?: number;
    categories: Array<{
      id: string;
      title: string;
      desc: string;
      icon: string;
      badge: string;
      count: number;
      totalAmount: number;
      records: any[];
    }>;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
  persona?: AiPersonaType;
}

const STORAGE_KEY = "ceohn10_crm_chatgpt_sessions_v2";

export const AI_PERSONAS = [
  {
    id: "general" as AiPersonaType,
    name: "Trợ Lý Tổng Thể",
    roleDesc: "Điều hành & Báo cáo toàn diện CRM",
    icon: Sparkles,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    activeColor: "bg-amber-500 text-slate-950 font-bold",
    badge: "Bao quát toàn CLB",
    greeting: "Kính chào Quý Lãnh đạo! Tôi là Trợ Lý Điều Hành Cấp Cao CEO HN10. Tôi sẵn sàng hỗ trợ phân tích và cố vấn hoạt động CEOHN10.",
  },
  {
    id: "opportunity" as AiPersonaType,
    name: "AI Cơ Hội B2B",
    roleDesc: "Giám sát & Thông báo cơ hội mới",
    icon: Handshake,
    color: "text-orange-500 bg-orange-500/10 border-orange-500/30",
    activeColor: "bg-orange-500 text-white font-bold",
    badge: "🔔 Tự động báo cơ hội mới",
    greeting: "Chào Anh/Chị! Tôi là Trợ Lý Phân Tích Cơ Hội Giao Thương B2B. Tôi luôn theo dõi các cơ hội mới đăng và chủ động thông báo cho Anh/Chị.",
  },
  {
    id: "events" as AiPersonaType,
    name: "AI Sự Kiện",
    roleDesc: "Nhắc lịch & Điều phối đại biểu",
    icon: Calendar,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/30",
    activeColor: "bg-rose-500 text-white font-bold",
    badge: "📅 Nhắc lịch trình & Check-in",
    greeting: "Chào Anh/Chị! Tôi là Trợ Lý Sự Kiện & Hội Thảo CEO HN10. Tôi chủ động theo dõi lịch trình các sự kiện sắp diễn ra.",
  },
  {
    id: "meetings" as AiPersonaType,
    name: "AI Cuộc Họp B2B",
    roleDesc: "Lịch hẹn 1-on-1 & Phòng họp",
    icon: Users,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/30",
    activeColor: "bg-indigo-500 text-white font-bold",
    badge: "🤝 Nhắc cuộc gặp đối tác",
    greeting: "Chào Anh/Chị! Tôi là Trợ Lý Cuộc Họp & Lịch Hẹn CEO HN10. Tôi hỗ trợ điều phối các buổi kết nối giao thương giữa các CEO.",
  },
  {
    id: "finance" as AiPersonaType,
    name: "AI Tài Chính & Quỹ",
    roleDesc: "Đối soát thu chi & Sổ quỹ thật",
    icon: TrendingUp,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    activeColor: "bg-emerald-500 text-white font-bold",
    badge: "💰 Minh bạch số dư thật",
    greeting: "Chào Anh/Chị! Tôi là Trợ Lý Tài Chính & Quỹ Ngân Sách. Tôi đối soát dữ liệu thật từ sổ kế toán (105 triệu VNĐ khả dụng).",
  },
  {
    id: "documents" as AiPersonaType,
    name: "AI Tài Liệu",
    roleDesc: "Văn bản, Điều lệ & Quy chế",
    icon: FileText,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    activeColor: "bg-blue-500 text-white font-bold",
    badge: "📚 Tra cứu văn bản CEOHN10",
    greeting: "Chào Anh/Chị! Tôi là Trợ Lý Văn Bản & Tri Thức CEOHN10 CEO HN10. Tôi quản lý hệ thống văn bản và tài liệu đã ban hành.",
  },
];

const FREE_MODELS = [
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash (Free Tier)",
    provider: "Google AI Studio",
    icon: Zap,
    color: "text-amber-500",
    badge: "⚡ Siêu tốc • 1M context • Khuyên dùng",
    desc: "Mô hình miễn phí thế hệ mới nhất của Google, phân tích dữ liệu CRM cực nhanh và chính xác.",
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek V3 / R1 (Free)",
    provider: "DeepSeek Open Source",
    icon: Brain,
    color: "text-blue-500",
    badge: "🧠 Tư duy sâu • Phân tích chiến lược",
    desc: "Mô hình mã nguồn mở hàng đầu, phân tích logic tài chính và bài toán quản trị xuất sắc.",
  },
  {
    id: "llama-3.3-70b",
    name: "Meta Llama 3.3 70B (Groq Free)",
    provider: "Meta AI & Groq",
    icon: Layers,
    color: "text-emerald-500",
    badge: "🦙 300 token/s • Xử lý văn bản tự nhiên",
    desc: "Mô hình siêu nhanh qua hạ tầng Groq LPU, tối ưu cho việc soạn thảo văn bản và thông báo.",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o-mini (Free)",
    provider: "OpenAI Compatible",
    icon: Sparkles,
    color: "text-purple-500",
    badge: "💎 Trả lời súc tích • Chuẩn mực",
    desc: "Mô hình gọn nhẹ, trả lời chuẩn xác và tối ưu chi phí hạ tầng.",
  },
];

const QUICK_PROMPTS = [
  {
    icon: Sparkles,
    color: "from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
    title: "Cố vấn Vốn & Thẩm Định Deal",
    desc: "Tôi có 50 triệu thì deal cơ hội nào phù hợp & phân tích lời lỗ",
    prompt: "Tôi có 50000000 đồng thì có cơ hội kinh doanh nào phù hợp và phân tích lời lỗ nếu deal cơ hội đó dựa vào hồ sơ năng lực của người đăng?",
    persona: "opportunity" as AiPersonaType,
  },
  {
    icon: Handshake,
    color: "from-orange-500/10 to-amber-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/40",
    title: "Cơ hội B2B mới nhất",
    desc: "Kiểm tra cơ hội vừa đăng và ngân sách thực tế trong database",
    prompt: "Tôi muốn cập nhật các cơ hội giao thương B2B mới nhất vừa được đăng tải trên hệ thống, phân tích quy mô ngân sách và ngành nghề phù hợp.",
    persona: "opportunity" as AiPersonaType,
  },
  {
    icon: Calendar,
    color: "from-rose-500/10 to-pink-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40",
    title: "Sự kiện & Hội thảo",
    desc: "Nhắc nhở lịch trình các sự kiện sắp diễn ra và tình hình đăng ký",
    prompt: "Nhắc nhở cho tôi lịch trình các sự kiện sắp tới của CLB CEO HN10, địa điểm tổ chức và tiến độ chuẩn bị thẻ đại biểu QR Code.",
    persona: "events" as AiPersonaType,
  },
  {
    icon: FileSpreadsheet,
    color: "from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
    title: "Xuất Báo Cáo Tiền Thu Hôm Nay",
    desc: "Tự động phân loại 5 danh mục thu và tải file Excel chuẩn kế toán TT 200",
    prompt: "Xuất file báo cáo tiền thu trong ngày hôm nay, hãy đưa ra danh mục để tôi chọn.",
    persona: "finance" as AiPersonaType,
  },
  {
    icon: Workflow,
    color: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
    title: "Quy Trình: Đọc File ➔ Lên Lịch ➔ Gửi Thư Mời",
    desc: "Tự phối hợp bóc tách công văn, tạo sự kiện và gửi email mời đại biểu",
    prompt: "Đọc file công văn này, tạo các sự kiện trong lịch họp, tìm email những người liên quan từ CSDL, sau đó chuẩn bị gửi thông báo thư mời cho tất cả mọi người.",
    persona: "meetings" as AiPersonaType,
  },
  {
    icon: TrendingUp,
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
    title: "Đối soát Quỹ Ngân Sách",
    desc: "Trích xuất số dư tài chính thực tế 100% từ sổ kế toán",
    prompt: "Báo cáo chi tiết số dư quỹ CEOHN10 và các giao dịch thực tế từ sổ kế toán, không lấy số liệu giả định.",
    persona: "finance" as AiPersonaType,
  },
  {
    icon: Calendar,
    color: "from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40",
    title: "Lên Lịch Họp & Gửi Thư Mời",
    desc: "Tự động kiểm tra xung đột, tra cứu email hội viên từ CSDL và tạo Google Calendar",
    prompt: "Ngày 25/11/2026 tổ chức cuộc họp ban dự án lúc 9h tại phòng họp tầng 3. Thành phần tham dự gồm Nguyễn Văn A, Trần Văn B. Hãy kiểm tra lịch, tạo sự kiện và chuẩn bị thư mời.",
    persona: "meetings" as AiPersonaType,
  },
  {
    icon: BarChart3,
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
    title: "Thống Kê Doanh Thu 12 Tháng",
    desc: "Tổng hợp biểu đồ doanh thu theo từng tháng và dòng tiền thuần",
    prompt: "Thống kê doanh thu theo từng tháng trong năm 2026 và vẽ biểu đồ dòng tiền thu chi.",
    persona: "finance" as AiPersonaType,
  },
  {
    icon: Users,
    color: "from-indigo-500/10 to-blue-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40",
    title: "Cuộc họp & Kết nối B2B",
    desc: "Quản lý lịch hẹn 1-on-1 và gửi thông báo cho các bên",
    prompt: "Kiểm tra tình hình các cuộc hẹn kết nối B2B 1-on-1 giữa các CEO và hướng dẫn tôi lên lịch gặp gỡ đối tác mới.",
    persona: "meetings" as AiPersonaType,
  },
];

/**
 * Trình phân tích & hiển thị Markdown thuần an toàn (XSS-free)
 */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (keyPrefix: number) => {
    if (inTable && tableHeader.length > 0) {
      renderedElements.push(
        <div key={`table-${keyPrefix}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-bold">
              <tr>
                {tableHeader.map((th, i) => (
                  <th key={i} className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-700">
                    {renderInlineFormatted(th)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/40">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-slate-700 dark:text-slate-300">
                      {renderInlineFormatted(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }
  };

  function renderInlineFormatted(text: string): React.ReactNode {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-slate-950 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
        return (
          <em key={idx} className="italic text-slate-600 dark:text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-primary font-semibold">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  }

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    // Table row detection
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      const isDivider = cells.every((c) => /^:?-+:?$/.test(c));
      if (isDivider) return;

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      flushTable(idx);
    }

    // Header 3
    if (line.startsWith("### ")) {
      renderedElements.push(
        <h3 key={idx} className="text-sm font-bold text-slate-950 dark:text-white mt-3 mb-1.5 flex items-center gap-1.5">
          <Sparkles className="size-4 text-amber-500 shrink-0" />
          <span>{renderInlineFormatted(line.replace("### ", ""))}</span>
        </h3>
      );
      return;
    }

    // Header 4
    if (line.startsWith("#### ")) {
      renderedElements.push(
        <h4 key={idx} className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2 mb-1">
          {renderInlineFormatted(line.replace("#### ", ""))}
        </h4>
      );
      return;
    }

    // Bullet point
    if (line.startsWith("- ") || line.startsWith("* ")) {
      renderedElements.push(
        <div key={idx} className="flex items-start gap-2 my-1 pl-1">
          <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
          <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {renderInlineFormatted(line.slice(2))}
          </span>
        </div>
      );
      return;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const numMatch = line.match(/^(\d+\.)\s(.*)$/);
      if (numMatch) {
        renderedElements.push(
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-xs font-bold text-primary shrink-0 min-w-[18px]">
              {numMatch[1]}
            </span>
            <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {renderInlineFormatted(numMatch[2])}
            </span>
          </div>
        );
        return;
      }
    }

    // Empty line
    if (!line) {
      renderedElements.push(<div key={idx} className="h-1.5" />);
      return;
    }

    // Normal paragraph
    renderedElements.push(
      <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-0.5">
        {renderInlineFormatted(line)}
      </p>
    );
  });

  if (inTable) {
    flushTable(lines.length);
  }

  return <div className="space-y-0.5">{renderedElements}</div>;
}

/**
 * Thẻ tương tác Chọn Danh Mục Báo Cáo Tiền Thu thực tế 100% từ CSDL
 */
function ReportCategorySelectorCard({
  interactiveActions,
  onExportCategory,
  onExportAll,
}: {
  interactiveActions: NonNullable<ChatMessage["interactiveActions"]>;
  onExportCategory: (category: any) => void;
  onExportAll: (categories: any[]) => void;
}) {
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "TrendingUp":
        return TrendingUp;
      case "Users":
        return Users;
      case "Calendar":
        return Calendar;
      case "Handshake":
        return Handshake;
      case "FileSpreadsheet":
      default:
        return FileSpreadsheet;
    }
  };

  return (
    <div className="rounded-2xl border border-amber-300/80 dark:border-amber-900/60 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Header Danh Mục */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/80 dark:border-amber-900/50">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0 border border-amber-400/40">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight flex flex-wrap items-center gap-2">
              <span>{interactiveActions.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                {interactiveActions.targetDateFormatted}
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              {interactiveActions.subtitle || "Chọn danh mục để hệ thống trích xuất số liệu thực tế và tải file Excel:"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            <span>CSDL 113.20.107.184</span>
          </span>
        </div>
      </div>

      {/* Danh sách 5 danh mục */}
      <div className="grid grid-cols-1 gap-2.5">
        {interactiveActions.categories.map((cat, idx) => {
          const CatIcon = getCategoryIcon(cat.icon);
          const isExpanded = expandedCatId === cat.id;
          const records = cat.records || [];

          return (
            <div
              key={cat.id || idx}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? "border-amber-400 dark:border-amber-700 bg-white dark:bg-slate-900 shadow-md"
                  : "border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hover:border-amber-300 dark:hover:border-amber-800 hover:shadow-2xs"
              }`}
            >
              <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 grid place-items-center shrink-0 border border-slate-200 dark:border-slate-700 mt-0.5">
                    <CatIcon className="size-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {idx + 1}. {cat.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/20">
                        {cat.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                {/* Số tiền & Nút Hành Động */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                  <div className="text-right">
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {formatExcelCurrency(cat.totalAmount)} đ
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium">
                      {cat.count} giao dịch
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition flex items-center gap-1 cursor-pointer"
                      title={isExpanded ? "Ẩn bảng chi tiết" : "Xem trước chi tiết giao dịch"}
                    >
                      {isExpanded ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      <span className="hidden sm:inline">{isExpanded ? "Đóng" : "Xem"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onExportCategory(cat)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-[11px] transition flex items-center gap-1.5 shadow-2xs cursor-pointer group"
                    >
                      <Download className="size-3.5 group-hover:translate-y-0.5 transition-transform" />
                      <span>Xuất Excel (.xlsx)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bảng Xem Trước Chi Tiết (Khi click "Xem") */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Chi tiết các phiếu thu thực tế ({records.length} bản ghi):</span>
                    <span className="text-primary font-mono font-normal">Định dạng chuẩn TT 200/2014/TT-BTC</span>
                  </div>

                  {records.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      Chưa có phát sinh trong danh mục này. File Excel sẽ xuất theo mẫu biểu chuẩn.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold">
                          <tr>
                            <th className="px-2.5 py-1.5 border-b">STT</th>
                            <th className="px-2.5 py-1.5 border-b">Mã Phiếu</th>
                            <th className="px-2.5 py-1.5 border-b">Ngày</th>
                            <th className="px-2.5 py-1.5 border-b">Người Nộp / Cty</th>
                            <th className="px-2.5 py-1.5 border-b">Nội Dung</th>
                            <th className="px-2.5 py-1.5 border-b text-right">Số Tiền (VNĐ)</th>
                            <th className="px-2.5 py-1.5 border-b">Hình Thức</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {records.map((r: any, rIdx: number) => (
                            <tr key={r.id || rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-2.5 py-1.5 font-mono text-muted-foreground">{rIdx + 1}</td>
                              <td className="px-2.5 py-1.5 font-mono font-bold text-primary">{r.code || r.id}</td>
                              <td className="px-2.5 py-1.5">{formatDisplayDate(r.date)}</td>
                              <td className="px-2.5 py-1.5 font-medium">{r.recipient || "Học viên CLB"}</td>
                              <td className="px-2.5 py-1.5 max-w-[200px] truncate" title={r.description}>
                                {r.description || r.category}
                              </td>
                              <td className="px-2.5 py-1.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatExcelCurrency(r.amount)} đ
                              </td>
                              <td className="px-2.5 py-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800">
                                  {r.method === "bank" ? "VietQR" : "Tiền mặt"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white">
                          <tr>
                            <td colSpan={5} className="px-2.5 py-2 text-right uppercase text-[10px]">
                              Tổng cộng danh mục:
                            </td>
                            <td className="px-2.5 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400">
                              {formatExcelCurrency(cat.totalAmount)} đ
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Actions: Tải trọn bộ đa sheet */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-emerald-500" />
          <span>Biểu mẫu hợp chuẩn Thông tư số 200/2014/TT-BTC của Bộ Tài chính</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onExportAll(interactiveActions.categories)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Layers className="size-4" />
            <span>Tải Trọn Bộ Sổ Quỹ Excel Đa Sheet</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function CrmChatGPTView() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.0-flash");
  const [selectedPersona, setSelectedPersona] = useState<AiPersonaType>("general");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [quickOpsOpen, setQuickOpsOpen] = useState(false);

  // Quản lý đính kèm đa tệp (Excel / Word / PDF / CSV / Text) để AI bóc tách & tự động ra lệnh
  const [attachedFiles, setAttachedFiles] = useState<ParsedFileResult[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);

  // Biến tương thích tệp đầu tiên
  const attachedFile = attachedFiles[0] || null;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý nạp và bóc tách nhiều tệp Word / Excel / PDF / CSV
  const handleProcessFiles = async (files: File[]) => {
    if (!files.length) return;

    setIsParsingFile(true);
    try {
      const parsedResults = await parseMultipleFiles(files);
      setAttachedFiles((prev) => [...prev, ...parsedResults]);
      const totalEmails = parsedResults.reduce((acc, f) => acc + f.totalEmails, 0);
      toast.success(
        `Đã đọc thành công ${parsedResults.length} tệp: Bóc tách ${totalEmails} email & cấu trúc tài liệu!`
      );
      if (!inputMessage.trim()) {
        if (parsedResults.length >= 2) {
          setInputMessage(
            `So sánh và đối chiếu dữ liệu giữa các file: ${parsedResults.map((f) => f.fileName).join(", ")}`
          );
        } else {
          setInputMessage(
            `Đọc tệp ${parsedResults[0].fileName} và gửi thông báo tới các học viên trong danh sách`
          );
        }
      }
    } catch (err: any) {
      toast.error(`Lỗi đọc tệp: ${err?.message || "Định dạng không hỗ trợ"}`);
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Xử lý khi chọn tệp từ nút đính kèm
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      await handleProcessFiles(files);
    }
  };

  // Xuất file Excel cho 1 danh mục cụ thể
  const handleExportCategoryToExcel = (category: any, targetDateFormatted?: string) => {
    try {
      const records = category.records || [];
      const totalAmount = Number(category.totalAmount || 0);
      const dateDisplay = targetDateFormatted || new Date().toLocaleDateString("vi-VN");

      exportToExcel({
        title: category.title.toUpperCase(),
        subtitle: `CLB DOANH NHÂN CEO HN10 (HANOIBA) - NGÀY ${dateDisplay}`,
        filename: `Bao_Cao_${category.id}_${new Date().toISOString().slice(0, 10)}`,
        organization: "CLB DOANH NHÂN CEO HN10 (HANOIBA)",
        templateType: category.id === "accounting_circular_200" ? "cashbook" : "standard",
        circularCode: category.id === "accounting_circular_200" ? "Mẫu số S07-DN" : undefined,
        circularNote:
          category.id === "accounting_circular_200"
            ? "(Ban hành theo Thông tư số 200/2014/TT-BTC ngày 22/12/2014 của Bộ Tài chính)"
            : undefined,
        columns: [
          { header: "MÃ PHIẾU", key: "code", width: 16, value: (r: any) => r.code || r.id },
          { header: "NGÀY GHI NHẬN", key: "date", width: 15, value: (r: any) => formatDisplayDate(r.date) },
          {
            header: "NGƯỜI NỘP / DOANH NGHIỆP",
            key: "recipient",
            width: 28,
            value: (r: any) => r.recipient || "Học viên CLB CEO HN10",
          },
          { header: "DANH MỤC THU", key: "category", width: 22, value: (r: any) => r.category || "Phí tham gia CLB" },
          {
            header: "NỘI DUNG DIỄN GIẢI",
            key: "description",
            width: 36,
            value: (r: any) => r.description || "Nộp tiền vào quỹ CLB",
          },
          {
            header: "SỐ TIỀN (VNĐ)",
            key: "amount",
            width: 18,
            value: (r: any) => formatExcelCurrency(r.amount),
          },
          {
            header: "HÌNH THỨC",
            key: "method",
            width: 18,
            value: (r: any) => (r.method === "bank" ? "Chuyển khoản VietQR" : "Tiền mặt"),
          },
          {
            header: "TRẠNG THÁI",
            key: "status",
            width: 16,
            value: (r: any) => (r.status === "completed" ? "Đã ghi nhận quỹ" : "Đang chờ đối soát"),
          },
        ],
        data: records,
        summaryRows: [["", "", "", "", "TỔNG CỘNG:", formatExcelCurrency(totalAmount), "", ""]],
        amountInWords: numberToVietnameseWords(totalAmount),
        signerTitles: ["Người Lập Biểu", "Thủ Quỹ Kế Toán", "Chủ Tịch CLB CEO HN10"],
      });

      toast.success(`Đã xuất và tải file Excel thành công: ${category.title}!`);
    } catch (err: any) {
      toast.error(`Lỗi khi xuất file Excel: ${err?.message || "Vui lòng thử lại"}`);
    }
  };

  // Xuất trọn bộ Sổ quỹ đa sheet (5 danh mục)
  const handleExportAllWorkbook = (categories: any[]) => {
    try {
      const wb = XLSX.utils.book_new();

      categories.forEach((cat) => {
        const records = cat.records || [];
        const sheetData: any[][] = [];
        sheetData.push([`ĐƠN VỊ: CLB DOANH NHÂN CEO HN10 (HANOIBA)`]);
        sheetData.push([cat.title.toUpperCase()]);
        sheetData.push([`Ngày trích xuất: ${new Date().toLocaleDateString("vi-VN")}`]);
        sheetData.push([]);
        sheetData.push([
          "STT",
          "MÃ PHIẾU THU",
          "NGÀY THU",
          "NGƯỜI NỘP / DOANH NGHIỆP",
          "DANH MỤC THU",
          "NỘI DUNG DIỄN GIẢI",
          "SỐ TIỀN (VNĐ)",
          "HÌNH THỨC",
          "TRẠNG THÁI",
        ]);

        records.forEach((r: any, idx: number) => {
          sheetData.push([
            idx + 1,
            r.code || r.id,
            formatDisplayDate(r.date),
            r.recipient || "Học viên CLB",
            r.category || cat.title,
            r.description || "",
            Number(r.amount || 0),
            r.method === "bank" ? "Chuyển khoản VietQR" : "Tiền mặt",
            r.status === "completed" ? "Đã ghi nhận" : "Chờ xử lý",
          ]);
        });

        sheetData.push([]);
        sheetData.push(["", "", "", "", "", "TỔNG CỘNG:", Number(cat.totalAmount || 0), "", ""]);
        sheetData.push([`Số tiền bằng chữ: ${numberToVietnameseWords(cat.totalAmount)}`]);

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        const safeSheetName = cat.badge.replace(/[/\\?*[\]]/g, "_").slice(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
      });

      const todayStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `So_Quy_CEO_HN10_Tron_Bo_${todayStr}.xlsx`);
      toast.success("Đã xuất trọn bộ sổ quỹ 5 danh mục thành công!");
    } catch (err: any) {
      toast.error(`Lỗi khi xuất trọn bộ sổ quỹ: ${err?.message}`);
    }
  };

  // 1. Khởi tạo sessions từ localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          if (parsed[0].persona) setSelectedPersona(parsed[0].persona);
          return;
        }
      }
    } catch {}

    const initialSession: ChatSession = {
      id: `sess_${Date.now()}`,
      title: "Cuộc trò chuyện mới",
      createdAt: new Date().toISOString(),
      messages: [],
      persona: "general",
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
  }, []);

  // 2. Lưu sessions vào localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 50)));
      } catch {}
    }
  }, [sessions]);

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, currentSessionId, isGenerating]);

  // Lấy session hiện tại
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  // Tạo session mới
  const handleNewChat = (personaType?: AiPersonaType) => {
    const targetPersona = personaType || selectedPersona;
    const personaObj = AI_PERSONAS.find((p) => p.id === targetPersona);
    const newSession: ChatSession = {
      id: `sess_${Date.now()}`,
      title: `Hội thoại ${personaObj?.name || 'Mới'}`,
      createdAt: new Date().toISOString(),
      messages: [],
      persona: targetPersona,
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedPersona(targetPersona);
    setInputMessage("");
    setLiveAlert(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  // Chọn Persona
  const handleSelectPersona = async (persona: AiPersonaType) => {
    setSelectedPersona(persona);
    const personaObj = AI_PERSONAS.find((p) => p.id === persona);
    toast.info(`Đã chuyển sang vai trò: ${personaObj?.name}`);

    // Tự động kích hoạt câu chào chủ động & thông báo mới nhất từ database
    try {
      const res = await fetchNestApi<any>("/api/ai/crm/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Xin chào, hãy giới thiệu vai trò của bạn và báo cáo những cập nhật dữ liệu quan trọng nhất gần đây!",
          model: selectedModel,
          persona,
        }),
      });

      if (res?.ok && res?.reply) {
        if (res.proactiveAlert) {
          setLiveAlert(res.proactiveAlert);
        }

        const autoMsg: ChatMessage = {
          id: `msg_a_${Date.now()}`,
          role: "assistant",
          content: res.reply,
          createdAt: new Date().toISOString(),
          model: res.modelUsed || "CEO HN10 AI (Real Data)",
          persona,
          evidence: res.evidence || [],
          proactiveAlert: res.proactiveAlert,
          interactiveActions: res.interactiveActions,
          executionPipeline: res.executionPipeline,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  title: `${personaObj?.name || 'Trợ Lý'}: ${new Date().toLocaleDateString('vi-VN')}`,
                  persona,
                  messages: [...s.messages, autoMsg],
                }
              : s
          )
        );
      }
    } catch {}
  };

  // Xóa một session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      if (filtered.length === 0) {
        const fallback: ChatSession = {
          id: `sess_${Date.now()}`,
          title: "Cuộc trò chuyện mới",
          createdAt: new Date().toISOString(),
          messages: [],
          persona: "general",
        };
        setCurrentSessionId(fallback.id);
        return [fallback];
      }
      if (currentSessionId === sessionId) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
    toast.success("Đã xóa cuộc trò chuyện!");
  };

  // Xóa toàn bộ lịch sử
  const handleClearAllHistory = () => {
    if (window.confirm("Anh/Chị có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện AI không?")) {
      const fresh: ChatSession = {
        id: `sess_${Date.now()}`,
        title: "Cuộc trò chuyện mới",
        createdAt: new Date().toISOString(),
        messages: [],
        persona: "general",
      };
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Đã làm sạch toàn bộ lịch sử trò chuyện!");
    }
  };

  // Tự co giãn textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Xác nhận hoặc từ chối một bước nhạy cảm của Action Agent
  const handleConfirmAgentStep = async (taskId: string, stepId: string, approved: boolean) => {
    try {
      const res = await fetchNestApi<any>("/api/ai/agent/confirm-step", {
        method: "POST",
        body: JSON.stringify({ taskId, stepId, approved }),
      });
      if (res?.ok && res?.data) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.agentPlan?.taskId === taskId
                      ? {
                          ...m,
                          agentPlan: res.data,
                          content: res.data.overallSummary || m.content,
                        }
                      : m
                  ),
                }
              : s
          )
        );
      }
    } catch (err: any) {
      toast.error(`Lỗi duyệt bước: ${err?.message}`);
      throw err;
    }
  };

  // Thử lại một bước bị lỗi của Action Agent (Failure Recovery)
  const handleRetryAgentStep = async (taskId: string, stepId: string, modifiedParams?: Record<string, any>) => {
    try {
      const res = await fetchNestApi<any>("/api/ai/agent/retry-step", {
        method: "POST",
        body: JSON.stringify({ taskId, stepId, modifiedParams }),
      });
      if (res?.ok && res?.data) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.agentPlan?.taskId === taskId
                      ? {
                          ...m,
                          agentPlan: res.data,
                          content: res.data.overallSummary || m.content,
                        }
                      : m
                  ),
                }
              : s
          )
        );
        toast.success("Đang khởi động lại bước...");
      }
    } catch (err: any) {
      toast.error(`Lỗi khi thử lại: ${err?.message}`);
      throw err;
    }
  };

  // Bỏ qua một bước bị lỗi để tiếp tục chuỗi (Skip & Continue)
  const handleSkipAgentStep = async (taskId: string, stepId: string) => {
    try {
      const res = await fetchNestApi<any>("/api/ai/agent/skip-step", {
        method: "POST",
        body: JSON.stringify({ taskId, stepId }),
      });
      if (res?.ok && res?.data) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.agentPlan?.taskId === taskId
                      ? {
                          ...m,
                          agentPlan: res.data,
                          content: res.data.overallSummary || m.content,
                        }
                      : m
                  ),
                }
              : s
          )
        );
        toast.info("Đã bỏ qua bước và tiếp tục chuỗi.");
      }
    } catch (err: any) {
      toast.error(`Lỗi khi bỏ qua: ${err?.message}`);
      throw err;
    }
  };

  // Hủy bỏ toàn bộ quy trình nhiệm vụ
  const handleAbortAgentTask = async (taskId: string) => {
    try {
      const res = await fetchNestApi<any>("/api/ai/agent/abort-task", {
        method: "POST",
        body: JSON.stringify({ taskId }),
      });
      if (res?.ok && res?.data) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.agentPlan?.taskId === taskId
                      ? {
                          ...m,
                          agentPlan: res.data,
                          content: "Nhiệm vụ đã bị hủy theo yêu cầu.",
                        }
                      : m
                  ),
                }
              : s
          )
        );
        toast.warning("Đã hủy bỏ quy trình.");
      }
    } catch (err: any) {
      toast.error(`Lỗi khi hủy: ${err?.message}`);
      throw err;
    }
  };

  // Gửi tin nhắn & Tự động nhận diện lệnh / File Excel
  const handleSendMessage = async (textToSend?: string, overridePersona?: AiPersonaType) => {
    const messageText = (textToSend || inputMessage).trim();
    if (!messageText || isGenerating || !currentSessionId) return;

    const usePersona = overridePersona || selectedPersona;
    const currentAttachedList = [...attachedFiles];

    // Kiểm tra xem câu lệnh có phải là lệnh Action Agent thực thi không
    const isActionAgentCommand =
      currentAttachedList.length > 0 ||
      /(gửi\s+mail|gửi\s+email|thông\s+báo\s+phí|nhắc\s+nộp\s+phí|hội\s+phí|tạo\s+lịch|tạo\s+sự\s+kiện|cuộc\s+họp|lên\s+lịch|kiểm\s+tra\s+lịch|lịch\s+trống|trùng\s+lịch|họp|hẹn\s+gặp|tìm\s+học\s+viên|tìm\s+hội\s+viên|danh\s+bạ|bóc\s+tách|phân\s+tích\s+file|so\s+sánh|đối\s+chiếu|doanh\s+thu|thất\s+bại|chưa\s+xác\s+thực|đang\s+hoạt\s+động|bao\s+nhiêu\s+người|bắt\s+đầu\s+bằng|đầu\s+số\s+09|đăng\s+ký\s+hôm\s+nay|cơ\s+cấu\s+ban|thống\s+kê)/i.test(
        messageText
      );

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: "user",
      content: messageText,
      createdAt: new Date().toISOString(),
      persona: usePersona,
      attachedFiles: currentAttachedList.map((f) => ({
        name: f.fileName,
        size: f.fileSize,
        fileType: f.fileType,
        emailCount: f.totalEmails,
        recipients: f.recipients,
      })),
      attachedFile: currentAttachedList[0]
        ? {
            name: currentAttachedList[0].fileName,
            size: currentAttachedList[0].fileSize,
            emailCount: currentAttachedList[0].totalEmails,
            recipients: currentAttachedList[0].recipients,
          }
        : undefined,
    };

    const shouldUpdateTitle = messages.length === 0;
    const newTitle = shouldUpdateTitle
      ? messageText.slice(0, 32) + (messageText.length > 32 ? "..." : "")
      : currentSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              title: newTitle,
              persona: usePersona,
              messages: [...s.messages, userMsg],
            }
          : s
      )
    );

    setInputMessage("");
    setAttachedFiles([]); // Clear toàn bộ danh sách file sau khi gửi
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsGenerating(true);

    try {
      if (isActionAgentCommand) {
        // GỌI ENDPOINT ACTION AGENT CORE & TOOLS
        const res = await fetchNestApi<any>("/api/ai/agent/execute", {
          method: "POST",
          body: JSON.stringify({
            goal: messageText,
            files:
              currentAttachedList.length > 0
                ? currentAttachedList.map((f) => ({
                    name: f.fileName,
                    type: f.fileType,
                    text: f.rawText || f.summary || "",
                  }))
                : undefined,
            history: messages.slice(-4).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (res?.ok && res?.data) {
          const plan: AgentTaskExecutionPlan = res.data;
          const assistantMsg: ChatMessage = {
            id: `msg_a_${Date.now()}`,
            role: "assistant",
            content:
              plan.overallSummary ||
              `🤖 **AI Action Agent đã lập kế hoạch & điều phối thực thi:** "${messageText}"`,
            createdAt: new Date().toISOString(),
            model: "CEO HN10 Action Agent Engine",
            latencyMs: 220,
            persona: usePersona,
            agentPlan: plan,
          };

          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId
                ? {
                    ...s,
                    messages: [...s.messages, assistantMsg],
                  }
                : s
            )
          );
        } else {
          toast.error("Không thể khởi chạy quy trình Action Agent");
        }
      } else {
        // CHAT THƯỜNG / TRUY VẤN TƯ VẤN DOANH NGHIỆP
        const historyPayload = messages.slice(-4).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetchNestApi<any>("/api/ai/crm/chat", {
          method: "POST",
          body: JSON.stringify({
            message: messageText,
            history: historyPayload,
            model: selectedModel,
            persona: usePersona,
          }),
        });

        if (res?.ok && res?.reply) {
          if (res.proactiveAlert) {
            setLiveAlert(res.proactiveAlert);
          }

          const assistantMsg: ChatMessage = {
            id: `msg_a_${Date.now()}`,
            role: "assistant",
            content: res.reply,
            createdAt: new Date().toISOString(),
            model: res.modelUsed || "Gemini 2.0 Flash (Free)",
            latencyMs: res.latencyMs || 250,
            persona: usePersona,
            evidence: res.evidence || [],
            proactiveAlert: res.proactiveAlert,
            interactiveActions: res.interactiveActions,
            executionPipeline: res.executionPipeline,
          };

          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId
                ? {
                    ...s,
                    messages: [...s.messages, assistantMsg],
                  }
                : s
            )
          );
        } else {
          toast.error("Không nhận được phản hồi từ AI");
        }
      }
    } catch (e: any) {
      toast.error(`Lỗi kết nối Trợ lý AI: ${e?.message || "Vui lòng thử lại"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(content);
      toast.success("Đã sao chép nội dung vào bộ nhớ tạm!");
    }
  };

  const activeModelObj = FREE_MODELS.find((m) => m.id === selectedModel) || FREE_MODELS[0];
  const ActiveModelIcon = activeModelObj.icon;
  const activePersonaObj = AI_PERSONAS.find((p) => p.id === selectedPersona) || AI_PERSONAS[0];
  const ActivePersonaIcon = activePersonaObj.icon;

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[620px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
      {/* 1. SIDEBAR PHIÊN HỘI THOẠI (CHATGPT HISTORY) */}
      <div className="w-64 sm:w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col justify-between hidden md:flex">
        {/* Nút Tạo Cuộc Trò Chuyện Mới */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={() => handleNewChat()}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition shadow-2xs cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Plus className="size-4 text-primary group-hover:rotate-90 transition-transform" />
              <span>Cuộc trò chuyện mới</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
              ⌘N
            </span>
          </button>
        </div>

        {/* Danh sách Sessions */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Lịch sử theo vai trò
          </div>
          {sessions.map((s) => {
            const isActive = s.id === currentSessionId;
            const pObj = AI_PERSONAS.find((p) => p.id === s.persona) || AI_PERSONAS[0];
            const PIcon = pObj.icon;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentSessionId(s.id);
                  if (s.persona) setSelectedPersona(s.persona);
                }}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-slate-800 text-primary font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                  <PIcon className={`size-3.5 shrink-0 ${isActive ? "text-primary" : "text-slate-400"}`} />
                  <span className="truncate">{s.title || "Cuộc trò chuyện mới"}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  title="Xóa phiên này"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 rounded transition shrink-0"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Chân Sidebar: Quota & Nút dọn dẹp */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/80 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Dữ liệu điều hành cập nhật</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">Thời gian thực</span>
          </div>
          <button
            type="button"
            onClick={handleClearAllHistory}
            className="w-full text-center text-[10px] text-slate-500 hover:text-rose-500 py-1 transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Trash2 className="size-3" />
            <span>Xóa toàn bộ lịch sử</span>
          </button>
        </div>
      </div>

      {/* 2. KHUNG CHAT TRUNG TÂM (CHAT STREAM & INPUT) KÈM VÙNG KÉO THẢ TỆP */}
      <div
        className="flex-1 flex flex-col bg-white dark:bg-slate-950 min-w-0 relative"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
        }}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
          if (files.length > 0) {
            await handleProcessFiles(files);
          }
        }}
      >
        {/* OVERLAY HIỆU ỨNG KÉO THẢ TỆP VÀO KHUNG CHAT */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-xs border-2 border-dashed border-primary rounded-2xl grid place-items-center animate-fade-in pointer-events-none m-3">
            <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-primary/40 space-y-2 max-w-sm">
              <div className="size-14 mx-auto rounded-full bg-primary/20 grid place-items-center text-primary shadow-sm">
                <UploadCloud className="size-7 animate-bounce" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Thả các tệp tài liệu vào đây</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI Agent sẽ tự động bóc tách danh sách, đọc bảng biểu, phân tích sự kiện và lập kế hoạch thực thi.
              </p>
              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] font-mono text-primary font-bold">
                <span>.XLSX</span> • <span>.DOCX</span> • <span>.PDF</span> • <span>.CSV</span>
              </div>
            </div>
          </div>
        )}
        {/* Header Bar: Model Selector + Persona Selector */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xs z-10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            {/* Model Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ActiveModelIcon className={`size-4 ${activeModelObj.color}`} />
                <span>{activeModelObj.name}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>

              {modelDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-72 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Mô hình miễn phí (Free Tier)
                  </div>
                  {FREE_MODELS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = m.id === selectedModel;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.id);
                          setModelDropdownOpen(false);
                          toast.success(`Đã chuyển sang mô hình: ${m.name}`);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 text-primary font-bold border border-primary/20"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <Icon className={`size-4 ${m.color} shrink-0 mt-0.5`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{m.name}</span>
                            {isSelected && <Check className="size-3.5 text-primary" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{m.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTutorOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition active:scale-95"
                title="Mở hướng dẫn thao tác CRM tương tác từng bước"
              >
                <Bot className="size-3.5" />
                <span>AI Hướng Dẫn Thao Tác</span>
              </button>
              <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                <Database className="size-3" />
                <span>Dữ Liệu Chuẩn Xác</span>
              </span>
              <button
                type="button"
                onClick={() => handleNewChat()}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer md:hidden"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Persona Tabs (Thanh chọn vai trò chuyên biệt) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {AI_PERSONAS.map((p) => {
              const Icon = p.icon;
              const isSelected = selectedPersona === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPersona(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition cursor-pointer border ${
                    isSelected
                      ? `${p.activeColor} border-transparent shadow-xs scale-102`
                      : `bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800`
                  }`}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{p.name}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setQuickOpsOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                quickOpsOpen
                  ? "bg-[#003B95] text-white border-transparent shadow-xs"
                  : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <Workflow className="size-3.5 shrink-0" />
              <span>Tác Nghiệp Nhanh (Thư mời · HV · GV · Lớp)</span>
            </button>
          </div>
        </div>

        <AiQuickOpsDrawer
          open={quickOpsOpen}
          onClose={() => setQuickOpsOpen(false)}
          onLogResultToChat={(title, summary) => {
            const newMsg: ChatMessage = {
              id: `ai-op-${Date.now()}`,
              role: "assistant",
              content: `✅ **${title}**\n\n${summary}`,
              createdAt: new Date().toISOString(),
              persona: selectedPersona,
            };
            setSessions((prev) =>
              prev.map((s) =>
                s.id === currentSessionId
                  ? { ...s, messages: [...s.messages, newMsg], updatedAt: new Date().toISOString() }
                  : s
              )
            );
          }}
        />

        {/* Live Proactive Alert Banner (Nếu có) */}
        {liveAlert && (
          <div className="mx-4 mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 animate-fade-in">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Bell className="size-4 text-amber-500 shrink-0 animate-bounce" />
              <div className="truncate">{liveAlert}</div>
            </div>
            <button
              type="button"
              onClick={() => setLiveAlert(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.length === 0 ? (
            // Welcome & Quick Prompts
            <div className="max-w-2xl mx-auto h-full flex flex-col justify-center py-6 sm:py-8 text-center">
              <div className="size-14 sm:size-16 rounded-3xl bg-gradient-to-tr from-primary to-amber-500 mx-auto grid place-items-center text-white shadow-lg shadow-primary/20 mb-3 animate-bounce-subtle">
                <ActivePersonaIcon className="size-7 sm:size-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                {activePersonaObj.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
                {activePersonaObj.roleDesc}. Phân tích và cố vấn số liệu thực tế của CEOHN10 Doanh nhân CEO HN10.
              </p>

              {/* 4 Thẻ gợi ý bắt đầu nhanh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 text-left">
                {QUICK_PROMPTS.map((qp, i) => {
                  const Icon = qp.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(qp.prompt, qp.persona)}
                      className={`p-3.5 rounded-2xl border bg-gradient-to-br transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-left ${qp.color}`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <Icon className="size-4 shrink-0" />
                        <span>{qp.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {qp.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Message List
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                const pObj = AI_PERSONAS.find((p) => p.id === msg.persona) || activePersonaObj;
                const PIcon = pObj.icon;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="size-8 rounded-xl bg-gradient-to-tr from-primary to-amber-500 grid place-items-center text-white shrink-0 shadow-sm mt-0.5">
                        <PIcon className="size-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs ${
                        isUser
                          ? "bg-primary text-primary-foreground font-medium rounded-tr-xs shadow-xs space-y-2"
                          : "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-xs shadow-2xs space-y-3"
                      }`}
                    >
                      {isUser ? (
                        <>
                          {/* Hiển thị danh sách tệp đính kèm đa nguồn */}
                          {msg.attachedFiles && msg.attachedFiles.length > 0 ? (
                            <div className="space-y-1.5 pt-0.5">
                              {msg.attachedFiles.map((af, afIdx) => {
                                const isExcel = af.fileType === "excel" || af.fileType === "csv";
                                return (
                                  <div
                                    key={afIdx}
                                    className="flex items-center gap-2 p-2 rounded-xl bg-black/15 dark:bg-white/10 text-[11px] font-medium border border-white/20"
                                  >
                                    {isExcel ? (
                                      <FileSpreadsheetIcon className="size-3.5 shrink-0 text-emerald-300" />
                                    ) : (
                                      <FileText className="size-3.5 shrink-0 text-amber-200" />
                                    )}
                                    <div className="truncate flex-1">
                                      <span className="font-semibold">{af.name}</span>
                                      <span className="text-[10px] opacity-85 block">
                                        {(af.size / 1024).toFixed(0)} KB • {af.emailCount} emails
                                      </span>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold shrink-0">
                                      {af.emailCount} emails
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : msg.attachedFile ? (
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/15 dark:bg-white/10 text-[11px] font-medium border border-white/20">
                              <FileSpreadsheetIcon className="size-4 shrink-0 text-emerald-300" />
                              <div className="truncate flex-1">
                                <span className="font-semibold">{msg.attachedFile.name}</span>
                                <span className="text-[10px] opacity-80 block">
                                  Đã bóc tách tự động {msg.attachedFile.emailCount} địa chỉ email
                                </span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-bold shrink-0">
                                {msg.attachedFile.emailCount} emails
                              </span>
                            </div>
                          ) : null}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] text-primary font-bold">
                            <PIcon className="size-3" />
                            <span>{pObj.name}</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-muted-foreground font-normal">Real Database Analysis & Automation</span>
                          </div>

                          <MarkdownRenderer content={msg.content} />

                          {/* BẢNG CHỌN DANH MỤC BÁO CÁO TIỀN THU THEO YÊU CẦU */}
                          {msg.interactiveActions?.type === "report_category_selector" && (
                            <div className="pt-2">
                              <ReportCategorySelectorCard
                                interactiveActions={msg.interactiveActions}
                                onExportCategory={(cat) =>
                                  handleExportCategoryToExcel(
                                    cat,
                                    msg.interactiveActions?.targetDateFormatted
                                  )
                                }
                                onExportAll={(cats) => handleExportAllWorkbook(cats)}
                              />
                            </div>
                          )}

                          {/* ACTION AGENT REAL EXECUTION PLAN PIPELINE */}
                          {msg.agentPlan && (
                            <div className="pt-2">
                              <AiExecutionStepTracker
                                plan={msg.agentPlan}
                                onConfirmStep={handleConfirmAgentStep}
                                onRetryStep={handleRetryAgentStep}
                                onSkipStep={handleSkipAgentStep}
                                onAbortTask={handleAbortAgentTask}
                              />
                            </div>
                          )}

                          {/* PIPELINE STEPPER TỰ ĐỘNG HÓA TÍCH XANH REAL-TIME (LEGACY FALLBACK) */}
                          {msg.executionPipeline && !msg.agentPlan && (
                            <div className="pt-2">
                              <AiExecutionStepTracker
                                taskType={msg.executionPipeline.taskType}
                                commandText={msg.executionPipeline.commandText}
                                fileName={msg.executionPipeline.fileName}
                                recipients={msg.executionPipeline.recipients}
                                emailDraft={msg.executionPipeline.emailDraft}
                              />
                            </div>
                          )}

                          {/* Evidence & Action footer */}
                          {msg.evidence && msg.evidence.length > 0 && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                              {msg.evidence.map((ev, evIdx) => (
                                <span
                                  key={evIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                                >
                                  <Database className="size-2.5 text-primary" />
                                  <span>{ev.title}: <strong>{ev.countOrVal}</strong></span>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="font-mono">{msg.model || "CEO HN10 AI"} • {msg.latencyMs || 250}ms</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.content)}
                                title="Sao chép nội dung"
                                className="hover:text-foreground flex items-center gap-1 transition"
                              >
                                <Copy className="size-3" />
                                <span>Copy</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Generating loading bubble */}
              {isGenerating && (
                <div className="flex items-start gap-3 justify-start animate-fade-in">
                  <div className="size-8 rounded-xl bg-gradient-to-tr from-primary to-amber-500 grid place-items-center text-white shrink-0 shadow-sm mt-0.5">
                    <Sparkles className="size-4 animate-spin" />
                  </div>
                  <div className="rounded-2xl p-4 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-xs flex items-center gap-2 text-slate-500">
                    <div className="flex gap-1">
                      <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                      <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                      <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span>{activePersonaObj.name} đang tổng hợp và phân tích dữ liệu điều hành...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 3. FLOATING INPUT BAR PHONG CÁCH CHATGPT TỰ ĐỘNG HÓA */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Input file ẩn hỗ trợ đa tệp Excel / Word / PDF / CSV */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt"
              className="hidden"
            />

            {/* Banner hiển thị danh sách đa tệp đã bóc tách */}
            {attachedFiles.length > 0 && (
              <div className="p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 space-y-2 text-xs shadow-2xs animate-fade-in">
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-emerald-200 dark:border-emerald-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Tài liệu đính kèm ({attachedFiles.length} tệp)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200 font-bold">
                      Tổng {attachedFiles.reduce((acc, f) => acc + f.totalEmails, 0)} email
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {attachedFiles.length >= 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setInputMessage(
                            `So sánh và đối chiếu dữ liệu giữa các file ${attachedFiles.map((f) => f.fileName).join(", ")}`
                          )
                        }
                        className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-emerald-100 text-[10px] text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold transition cursor-pointer"
                      >
                        ⚖️ Đối chiếu các file
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAttachedFiles([])}
                      className="px-2 py-1 rounded-md text-[10px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer font-medium"
                    >
                      Gỡ tất cả
                    </button>
                  </div>
                </div>

                {/* Danh sách từng tệp (File Chips) */}
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {attachedFiles.map((f) => {
                    const isExcel = f.fileType === "excel" || f.fileType === "csv";
                    const isWord = f.fileType === "word";
                    const isPdf = f.fileType === "pdf";

                    return (
                      <div
                        key={f.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border bg-white dark:bg-slate-900 text-xs shadow-2xs ${
                          isExcel
                            ? "border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                            : isWord
                            ? "border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200"
                            : isPdf
                            ? "border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                            : "border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {isExcel ? (
                          <FileSpreadsheetIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <FileText
                            className={`size-4 shrink-0 ${
                              isWord
                                ? "text-blue-600 dark:text-blue-400"
                                : isPdf
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-slate-500"
                            }`}
                          />
                        )}

                        <div className="max-w-[150px] truncate">
                          <span className="font-semibold block truncate" title={f.fileName}>
                            {f.fileName}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {(f.fileSize / 1024).toFixed(0)} KB • {f.totalEmails} email
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setAttachedFiles((prev) => prev.filter((item) => item.id !== f.id))}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer ml-1"
                          title="Gỡ tệp này"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Khung nhập lệnh */}
            <div className="relative rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                disabled={isGenerating || isParsingFile}
                placeholder={
                  attachedFiles.length === 1
                    ? `Ra lệnh cho AI từ tệp ${attachedFiles[0].fileName} (Ví dụ: "Gửi mail thông báo sự kiện tới danh sách")...`
                    : attachedFiles.length > 1
                    ? `Ra lệnh cho AI từ ${attachedFiles.length} tệp đã chọn (Ví dụ: "So sánh và đối chiếu dữ liệu giữa các file")...`
                    : `Hỏi hoặc ra lệnh cho ${activePersonaObj.name}... (Kéo thả hoặc đính kèm Word/Excel/PDF/CSV)`
                }
                className="w-full px-4 py-3 text-xs bg-transparent border-none outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 max-h-44 min-h-[44px]"
              />
              <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  {/* NÚT ĐÍNH KÈM ĐA TỆP EXCEL / WORD / PDF / CSV */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsingFile || isGenerating}
                    title="Đính kèm một hoặc nhiều file Excel (.xlsx, .csv), Word (.docx) hoặc PDF (.pdf) để AI bóc tách và lập kế hoạch thực thi"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    <Paperclip className="size-3.5 text-primary" />
                    <span>
                      {isParsingFile
                        ? "Đang đọc tệp..."
                        : attachedFiles.length > 0
                        ? `Thêm tệp (${attachedFiles.length})`
                        : "Đính kèm tệp (Excel/Word/PDF)"}
                    </span>
                  </button>

                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="font-semibold text-primary">{activePersonaObj.name}</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{activeModelObj.name}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isGenerating || isParsingFile}
                  className="size-7 rounded-xl bg-primary text-primary-foreground grid place-items-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer"
                  title="Gửi câu lệnh thực thi tự động"
                >
                  <ArrowUp className="size-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            CEO HN10 AI Action Agent — Tự động bóc tách Email & Bảng biểu từ Excel/Word/PDF/CSV, đối chiếu CSDL chuẩn 113.20.107.184:6432 và thực thi theo thời gian thực.
          </p>
        </div>
      </div>

      {/* MODAL HƯỚNG DẪN THAO TÁC CRM TƯƠNG TÁC TỪNG BƯỚC */}
      <ViOneAiTutorGuide
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        systemType="crm"
      />
    </div>
  );
}
