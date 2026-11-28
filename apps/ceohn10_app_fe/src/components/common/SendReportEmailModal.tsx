import { useState } from "react";
import { Mail, Send, X, Loader2, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { buildThreeFormatAttachments, type ReportColumn } from "@/lib/report-mail-export";

export interface SendReportEmailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  filePrefix: string;
  columns: ReportColumn[];
  rows: Array<Record<string, any>>;
  defaultEmail?: string;
}

export function SendReportEmailModal({
  open,
  onClose,
  title,
  subtitle,
  filePrefix,
  columns,
  rows,
  defaultEmail = "",
}: SendReportEmailModalProps) {
  const [recipientInput, setRecipientInput] = useState(defaultEmail);
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSend = async () => {
    const recipients = Array.from(
      new Set(
        recipientInput
          .split(/[,;\s]+/)
          .map((e) => e.trim())
          .filter((e) => e.includes("@")),
      ),
    );
    if (recipients.length === 0) {
      toast.warning("Vui lòng nhập ít nhất 1 địa chỉ email hợp lệ!");
      return;
    }

    setSending(true);
    try {
      const attachments = buildThreeFormatAttachments({
        title,
        subtitle,
        filePrefix,
        columns,
        rows,
      });

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px;">
          <h2 style="color: #003B95; margin-bottom: 6px;">${title}</h2>
          ${subtitle ? `<p style="color: #475569; font-size: 13px; margin-top: 0;">${subtitle}</p>` : ""}
          <p style="font-size: 13px; color: #334155;">Tổng số bản ghi: <strong>${rows.length}</strong></p>
          <p style="font-size: 13px; color: #334155;">Đính kèm theo email này gồm đầy đủ <strong>3 định dạng tệp</strong>:</p>
          <ul style="font-size: 13px; color: #0f172a;">
            <li>Bảng tính Excel (<code>.xlsx</code>)</li>
            <li>Dữ liệu thô CSV (<code>.csv</code>)</li>
            <li>Tài liệu in PDF (<code>.pdf</code>)</li>
          </ul>
          <p style="font-size: 12px; color: #64748b; margin-top: 16px;">Xuất tự động từ Hệ thống Quản trị CLB Doanh Nhân CEO HN10.</p>
        </div>
      `;

      const res = await fetchNestApi<any>("/mail/send-report", {
        method: "POST",
        body: JSON.stringify({
          recipients,
          subject: `[CEO HN10] ${title} (Excel, CSV, PDF)`,
          html,
          attachments,
        }),
      });

      toast.success(
        `Đã gửi báo cáo (đủ 3 định dạng .xlsx, .csv, .pdf) tới ${res?.deliveredCount || recipients.length} email!`,
      );
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi gửi báo cáo qua email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        <div className="bg-[#003B95] px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <h3 className="text-sm font-bold">Xuất Báo Cáo Về Mail (Đủ 3 Dạng File)</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-white/15 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-muted/50 border border-border p-3 text-xs space-y-1.5">
            <div className="font-bold text-foreground">{title}</div>
            <div className="text-muted-foreground">Số bản ghi: <strong>{rows.length}</strong></div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 font-semibold">
                <FileSpreadsheet className="h-3 w-3" /> .xlsx
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 font-semibold">
                <FileText className="h-3 w-3" /> .csv
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 font-semibold">
                <Printer className="h-3 w-3" /> .pdf
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Email người nhận (cách nhau bằng dấu phẩy hoặc khoảng trắng)
            </label>
            <textarea
              rows={2}
              placeholder="vd: admin@ceohn10.vn, vupv090120@gmail.com"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-border bg-muted/30 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={handleSend}
            className="px-4 py-2 rounded-xl bg-[#003B95] hover:bg-[#002b70] text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>{sending ? "Đang gửi 3 file..." : "Gửi Báo Cáo (3 Dạng)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
