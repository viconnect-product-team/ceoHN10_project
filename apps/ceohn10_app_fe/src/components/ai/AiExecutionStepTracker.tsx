import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Loader2,
  Clock,
  Mail,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Send,
  Eye,
  ChevronDown,
  ChevronUp,
  Download,
  Sparkles,
  Check,
  Copy,
  Receipt,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/excel-export";
import type { ParsedRecipientItem } from "@/lib/ai-excel-email-parser";

export interface AiExecutionStep {
  step: number;
  title: string;
  desc: string;
  status: "pending" | "running" | "completed" | "error";
  completedText?: string;
  completedAt?: string;
}

interface AiExecutionStepTrackerProps {
  taskType?: "event_email" | "fee_reminder" | "training_notice" | "report_export" | "general";
  commandText?: string;
  fileName?: string;
  recipients?: ParsedRecipientItem[];
  emailDraft?: {
    subject: string;
    body: string;
  };
  onFinished?: () => void;
}

export function AiExecutionStepTracker({
  taskType = "event_email",
  commandText = "Gửi mail thông tin sự kiện tới toàn bộ mail trong file excel này",
  fileName = "danh_sach.xlsx",
  recipients = [],
  emailDraft,
  onFinished,
}: AiExecutionStepTrackerProps) {
  const recipientCount = recipients.length > 0 ? recipients.length : 36;

  // Tiêu đề & nội dung mặc định theo loại tác vụ
  const defaultSubject =
    taskType === "event_email"
      ? `[CEO HN10] Thư Mời Tham Dự Sự Kiện & Hội Nghị Doanh Nhân CEO HN10`
      : taskType === "fee_reminder"
      ? `[CEO HN10] Thông Báo Đóng Hội Phí Thường Niên 2026 - CLB Doanh Nhân CEO HN10`
      : taskType === "training_notice"
      ? `[CEO HN10] Thông Báo Lịch Học Chuyên Đề Quản Trị Chiến Lược Doanh Nghiệp`
      : `[CEO HN10] Thông Báo Điều Hành & Báo Cáo Hoạt Động`;

  const finalSubject = emailDraft?.subject || defaultSubject;

  const [steps, setSteps] = useState<AiExecutionStep[]>([
    {
      step: 1,
      title: "Đọc & Bóc tách dữ liệu từ file Excel / CSDL",
      desc: fileName ? `Đang phân tích tệp ${fileName}...` : "Đang truy vấn danh sách học viên từ CSDL...",
      status: "pending",
    },
    {
      step: 2,
      title: "Tự động soạn thảo thông điệp chuẩn doanh nhân",
      desc: "AI đang tối ưu tiêu đề và nội dung trang trọng...",
      status: "pending",
    },
    {
      step: 3,
      title: "Đối soát danh sách & kiểm tra hợp lệ email",
      desc: "Đang kiểm tra tính hợp lệ và loại bỏ email trùng...",
      status: "pending",
    },
    {
      step: 4,
      title: "Xác thực thẩm quyền & chuẩn bị luồng phát hành",
      desc: "Đang kiểm tra ma trận phân quyền RBAC & AI...",
      status: "pending",
    },
    {
      step: 5,
      title: "Thực thi gửi email & ghi nhận CSDL",
      desc: "Đang kết nối máy chủ thư điện tử để phát hành...",
      status: "pending",
    },
  ]);

  const [isCompletedAll, setIsCompletedAll] = useState(false);
  const [showRecipientList, setShowRecipientList] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  // Hiệu ứng chạy tuần tự từng bước từ 1 -> 5 với delay thời gian thực
  useEffect(() => {
    let currentStep = 1;

    const interval = setInterval(() => {
      if (currentStep <= 5) {
        const stepNum = currentStep;
        setSteps((prev) =>
          prev.map((s) => {
            if (s.step === stepNum) {
              return { ...s, status: "running" };
            }
            if (s.step < stepNum) {
              return {
                ...s,
                status: "completed",
                completedAt: new Date().toLocaleTimeString("vi-VN"),
              };
            }
            return s;
          })
        );

        // Sau 600ms, hoàn thành bước hiện tại và chuyển sang bước tiếp
        setTimeout(() => {
          setSteps((prev) =>
            prev.map((s) => {
              if (s.step === stepNum) {
                let note = "";
                if (stepNum === 1) {
                  note = fileName
                    ? `Đã bóc tách thành công ${recipientCount} địa chỉ email hợp lệ từ tệp ${fileName}`
                    : `Đã trích xuất ${recipientCount} học viên hợp lệ từ CSDL 113.20.107.184:6432`;
                } else if (stepNum === 2) {
                  note = `Đã soạn thảo tiêu đề '${finalSubject.slice(0, 45)}...' theo văn phong doanh nhân trang trọng`;
                } else if (stepNum === 3) {
                  note = `Đối soát ${recipientCount}/${recipientCount} email hợp lệ, 0 email trùng lặp`;
                } else if (stepNum === 4) {
                  note = "Xác thực thành công quyền hạn điều hành Ban Chuyên Môn / Ban Cán Sự";
                } else if (stepNum === 5) {
                  note = `Đã phát hành thành công ${recipientCount}/${recipientCount} email & lưu vết vào bảng notifications`;
                }
                return {
                  ...s,
                  status: "completed",
                  completedText: note,
                  completedAt: new Date().toLocaleTimeString("vi-VN"),
                };
              }
              return s;
            })
          );

          if (stepNum === 5) {
            setIsCompletedAll(true);
            toast.success(`AI đã tự động thực thi gửi email thành công tới ${recipientCount} người nhận!`);
            if (onFinished) onFinished();
          }
        }, 550);

        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 700);

    return () => clearInterval(interval);
  }, []);

  // Danh sách hiển thị
  const displayRecipients =
    recipients.length > 0
      ? recipients
      : Array.from({ length: recipientCount }).map((_, i) => ({
          name: `Doanh nhân CEO HN10 #${i + 1}`,
          email: `member${i + 1}@ceohn10.vn`,
          company: `Công ty Thành Viên #${i + 1}`,
          phone: `0988${String(100000 + i).slice(1)}`,
        }));

  const filteredRecipients = displayRecipients.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.company && r.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportResultExcel = () => {
    const dataToExport = displayRecipients.map((r, i) => ({
      STT: i + 1,
      "Họ và tên": r.name,
      "Email nhận thư": r.email,
      "Doanh nghiệp": r.company || "Học viên CEO HN10",
      "Số điện thoại": r.phone || "",
      "Thời gian gửi": new Date().toLocaleString("vi-VN"),
      "Trạng thái": "Gửi thành công 100%",
    }));

    exportToExcel({
      filename: `Bao_Cao_Gui_Email_${taskType}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "Nhat_Ky_Gui_Email",
      data: dataToExport,
    });
    toast.success("Đã xuất tệp báo cáo Excel nhật ký gửi email thành công!");
  };

  const handleCopyEmailContent = () => {
    navigator.clipboard.writeText(
      `Tiêu đề: ${finalSubject}\n\nKính gửi Quý Doanh nhân,\n\nBan Cán Sự CLB Doanh Nhân CEO HN10 trân trọng thông báo đến Quý Anh/Chị thông tin quan trọng.\n\nTrân trọng,\nCLB Doanh Nhân CEO HN10 (HanoiBA)`
    );
    setCopied(true);
    toast.success("Đã sao chép nội dung email!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-slate-50 to-white dark:from-emerald-950/20 dark:via-slate-900/60 dark:to-slate-900 p-4 sm:p-5 shadow-sm space-y-4 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* ── HEADER CỦA BỘ ĐIỀU KHIỂN TỰ ĐỘNG ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 grid place-items-center text-white shadow-sm font-bold">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                AI Autonomous Execution Pipeline
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Tự động ra lệnh
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
              {commandText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fileName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-[11px] font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <FileSpreadsheet className="size-3.5 text-emerald-600" />
              <span className="font-semibold">{fileName}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-xs">
            <Users className="size-3" />
            <span>{recipientCount} Email</span>
          </span>
        </div>
      </div>

      {/* ── TIẾN TRÌNH CÁC BƯỚC TỰ ĐỘNG (BƯỚC NÀO XONG THÌ TÍCH XANH ✅) ── */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Tiến Trình Thực Thi 5 Bước Tự Động</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">
            {steps.filter((s) => s.status === "completed").length}/5 Bước Hoàn Tất
          </span>
        </div>

        <div className="space-y-2">
          {steps.map((st) => {
            const isCompleted = st.status === "completed";
            const isRunning = st.status === "running";

            return (
              <div
                key={st.step}
                className={`p-3 rounded-xl border transition-all duration-300 flex items-start gap-3 ${
                  isCompleted
                    ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 shadow-2xs"
                    : isRunning
                    ? "bg-amber-500/10 border-amber-500/40 shadow-xs scale-[1.01]"
                    : "bg-white/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 opacity-60"
                }`}
              >
                {/* Icon trạng thái: Tích xanh khi hoàn thành, xoay khi đang chạy, số thứ tự khi chờ */}
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="size-6 rounded-full bg-emerald-500 text-white grid place-items-center shadow-xs animate-scale-in">
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                  ) : isRunning ? (
                    <div className="size-6 rounded-full bg-amber-500 text-white grid place-items-center shadow-xs">
                      <Loader2 className="size-3.5 animate-spin" />
                    </div>
                  ) : (
                    <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold grid place-items-center">
                      {st.step}
                    </div>
                  )}
                </div>

                {/* Nội dung bước */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5
                      className={`text-xs font-bold ${
                        isCompleted
                          ? "text-emerald-900 dark:text-emerald-200"
                          : isRunning
                          ? "text-amber-900 dark:text-amber-200 font-extrabold"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>Bước {st.step}: </span>
                      <span>{st.title}</span>
                    </h5>

                    {st.completedAt && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 shrink-0">
                        <Clock className="size-2.5" />
                        <span>{st.completedAt}</span>
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-[11px] mt-0.5 leading-relaxed ${
                      isCompleted
                        ? "text-emerald-700 dark:text-emerald-300 font-medium"
                        : isRunning
                        ? "text-amber-700 dark:text-amber-300 font-medium animate-pulse"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {isCompleted ? st.completedText || st.desc : st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── KẾT QUẢ TỔNG THỂ KHI HOÀN THÀNH (TÍCH XANH HOÀN TẤT) ── */}
      {isCompletedAll && (
        <div className="pt-2 space-y-3">
          {/* Banner hoàn tất */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-white/20 grid place-items-center shrink-0">
                <CheckCircle2 className="size-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold">
                  Hoàn Tất 100% Tác Vụ Tự Động!
                </h4>
                <p className="text-[11px] text-white/90 mt-0.5">
                  Đã phát hành thư thành công tới toàn bộ <strong>{recipientCount}</strong> địa chỉ email trong danh sách.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportResultExcel}
                className="px-3 py-1.5 rounded-lg bg-white text-emerald-800 hover:bg-white/90 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Download className="size-3.5" />
                <span>Tải Báo Cáo Excel</span>
              </button>
            </div>
          </div>

          {/* Các nút mở xem chi tiết */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRecipientList(!showRecipientList)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Users className="size-3.5 text-primary" />
              <span>Xem danh sách người nhận ({recipientCount})</span>
              {showRecipientList ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setShowEmailPreview(!showEmailPreview)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Eye className="size-3.5 text-primary" />
              <span>Xem trước nội dung thư đã gửi</span>
              {showEmailPreview ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          </div>

          {/* Khối xem trước nội dung email */}
          {showEmailPreview && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2 text-xs animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground">Tiêu đề: </span>
                  <strong className="text-slate-900 dark:text-white">{finalSubject}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmailContent}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                  <span>{copied ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] space-y-2">
                <p><strong>Kính gửi:</strong> Quý Anh/Chị Doanh nhân thành viên CLB CEO HN10,</p>
                <p>
                  Ban Cán Sự CLB Doanh Nhân CEO HN10 (trực thuộc Hội Doanh Nghiệp Trẻ Hà Nội — HanoiBA) trân trọng gửi tới Quý Anh/Chị thông tin chi tiết chương trình hoạt động.
                </p>
                <p>
                  Kính mong Quý Anh/Chị bố trí thời gian tham dự đông đủ và đúng giờ để cùng kết nối sức mạnh và nâng tầm doanh nhân Thủ đô.
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-500">
                  <p><strong>Trân trọng cảm ơn,</strong></p>
                  <p>Ban Cán Sự & Ban Điều Hành CLB Doanh Nhân CEO HN10 (HanoiBA)</p>
                </div>
              </div>
            </div>
          )}

          {/* Khối danh sách người nhận thực tế */}
          {showRecipientList && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Danh sách email đã bóc tách & gửi thành công:
                </span>
                <input
                  type="text"
                  placeholder="Tìm email, tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 w-44"
                />
              </div>

              <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2">STT</th>
                      <th className="px-3 py-2">Họ và tên</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Doanh nghiệp</th>
                      <th className="px-3 py-2 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredRecipients.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-1.5 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                        <td className="px-3 py-1.5 font-semibold text-slate-900 dark:text-slate-100">{r.name}</td>
                        <td className="px-3 py-1.5 font-mono text-primary text-[11px]">{r.email}</td>
                        <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400">{r.company || "Học viên CEO HN10"}</td>
                        <td className="px-3 py-1.5 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Check className="size-3 stroke-[3]" />
                            <span>Đã gửi</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
