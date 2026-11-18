import React, { useState } from "react";
import { Calendar, FileSpreadsheet, FileText, FileCode, LayoutTemplate } from "lucide-react";
import { InvitationSetupManager } from "./InvitationSetupManager";
import { ReportTemplateEditor } from "./ReportTemplateEditor";

export type TemplateTab = "excel" | "word" | "pdf" | "invitation-setup";

export interface PageTemplatesHubProps {
  initialTab?: string;
  initialType?: string;
}

export function PageTemplatesHub({ initialTab = "excel", initialType }: PageTemplatesHubProps) {
  // Support both search ?type=excel/word/pdf or ?tab=invitation-setup
  const resolveTab = (): TemplateTab => {
    if (initialType === "excel" || initialType === "word" || initialType === "pdf") {
      return initialType;
    }
    if (initialTab === "excel" || initialTab === "word" || initialTab === "pdf" || initialTab === "invitation-setup") {
      return initialTab;
    }
    return "excel";
  };

  const [activeTab, setActiveTab] = useState<TemplateTab>(resolveTab());

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <LayoutTemplate className="size-6 text-[#003B95]" />
            <span>Quản Lý &amp; Cài Đặt Biểu Mẫu Hệ Thống</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Thiết lập định dạng chuẩn cho file Excel, Word, PDF xuất báo cáo tài chính, hóa đơn và thư mời sự kiện.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("excel")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "excel"
                ? "bg-[#003B95] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSpreadsheet className="size-4" />
            <span>Biểu mẫu Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("word")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "word"
                ? "bg-[#003B95] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="size-4" />
            <span>Biểu mẫu Word</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pdf")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "pdf"
                ? "bg-[#003B95] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCode className="size-4" />
            <span>Biểu mẫu PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("invitation-setup")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "invitation-setup"
                ? "bg-[#003B95] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="size-4" />
            <span>Thư Mời Sự Kiện</span>
          </button>
        </div>
      </div>

      {/* RENDER CURRENT ACTIVE SUB-FUNCTION */}
      <div className="animate-in fade-in-50 duration-200">
        {activeTab === "excel" && <ReportTemplateEditor type="excel" />}
        {activeTab === "word" && <ReportTemplateEditor type="word" />}
        {activeTab === "pdf" && <ReportTemplateEditor type="pdf" />}
        {activeTab === "invitation-setup" && <InvitationSetupManager />}
      </div>
    </div>
  );
}
