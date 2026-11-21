import { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Layers,
  Wallet,
  Users,
  Send,
  Trash2,
  DollarSign,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { parseSingleDocument, type ParsedFileResult, type ParsedRecipientItem } from "@/lib/ai-excel-email-parser";

interface EventAttendeesImportModalProps {
  open: boolean;
  event: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EventAttendeesImportModal({
  open,
  event,
  onClose,
  onSuccess,
}: EventAttendeesImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [parsedFile, setParsedFile] = useState<ParsedFileResult | null>(null);
  const [recipients, setRecipients] = useState<ParsedRecipientItem[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [defaultTicketPrice, setDefaultTicketPrice] = useState<number>(() => {
    return Number(event?.ticket_price || event?.ticketPrice || event?.fee || 0);
  });

  if (!open || !event) return null;

  const eventTitle = event.name || event.title || "Sự kiện CLB CEO HN10";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    try {
      const res = await parseSingleDocument(file);
      setParsedFile(res);

      // Thu thập toàn bộ các headers / dynamic columns từ tables
      const customCols = new Set<string>();
      if (res.tables && res.tables.length > 0) {
        for (const tbl of res.tables) {
          for (const h of tbl.headers) {
            const hClean = h.trim();
            const hLower = hClean.toLowerCase();
            if (
              !hLower.includes("họ tên") &&
              !hLower.includes("họ và tên") &&
              !hLower.includes("email") &&
              !hLower.includes("mail") &&
              !hLower.includes("sđt") &&
              !hLower.includes("điện thoại") &&
              !hLower.includes("phone") &&
              !hLower.includes("công ty") &&
              !hLower.includes("doanh nghiệp") &&
              !hLower.includes("chức vụ") &&
              !hLower.includes("chức danh") &&
              !hLower.includes("số tiền") &&
              !hLower.includes("tiền") &&
              !hLower.includes("giá vé") &&
              !hLower.includes("phí") &&
              !hLower.includes("trạng thái") &&
              !hLower.includes("thanh toán")
            ) {
              customCols.add(hClean);
            }
          }
        }
      }
      setDetectedColumns(Array.from(customCols));

      // Điền giá vé mặc định nếu bản ghi chưa có giá vé
      const normalizedRecipients = (res.recipients || []).map((r) => ({
        ...r,
        amount: r.amount !== undefined && r.amount !== null && String(r.amount).trim() !== ""
          ? r.amount
          : defaultTicketPrice,
        paymentStatus: r.paymentStatus || (defaultTicketPrice === 0 ? ("free" as const) : ("unpaid" as const)),
      }));

      setRecipients(normalizedRecipients);
      toast.success(`Đã phân tích tệp ${file.name}: Tìm thấy ${normalizedRecipients.length} đại biểu tham dự!`);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi phân tích tệp tài liệu");
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleTogglePaymentStatus = (index: number) => {
    setRecipients((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const nextStatus = r.paymentStatus === "paid" ? "unpaid" : "paid";
        return { ...r, paymentStatus: nextStatus };
      })
    );
  };

  const handleUpdateAmount = (index: number, newAmount: number) => {
    setRecipients((prev) =>
      prev.map((r, i) => (i === index ? { ...r, amount: newAmount } : r))
    );
  };

  const handleDeleteRecipient = (index: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  // Tính toán chỉ số thống kê
  const paidCount = recipients.filter((r) => r.paymentStatus === "paid").length;
  const unpaidCount = recipients.filter((r) => r.paymentStatus === "unpaid").length;
  const totalAmountToFund = recipients
    .filter((r) => r.paymentStatus === "paid")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const handleSubmitImport = async () => {
    if (recipients.length === 0) {
      toast.error("Không có đại biểu nào trong danh sách để nhập vào hệ thống");
      return;
    }

    setSubmitting(true);
    try {
      const recordsPayload = recipients.map((r) => ({
        fullName: r.name,
        phone: r.phone,
        email: r.email,
        company: r.company,
        position: r.position,
        paymentStatus: r.paymentStatus,
        ticketFee: Number(r.amount) || 0,
        note: r.notes,
        ...(r.dynamicFields || {}),
      }));

      const res = await fetchNestApi<any>(`/events/${event.id}/import-attendees`, {
        method: "POST",
        body: JSON.stringify({
          records: recordsPayload,
          customColumns: detectedColumns,
          associationId: event.association_id,
        }),
      });

      if (res && res.ok) {
        toast.success(
          `Nhập thành công ${res.totalImported} đại biểu! Đã ghi nhận ${res.totalFundAdded?.toLocaleString("vi-VN")} VNĐ vào Quỹ sự kiện CRM và tự động dispatch mã vé qua Email/Zalo OA!`
        );
        onSuccess();
        onClose();
      } else {
        toast.error(res?.message || "Không thể nhập danh sách đại biểu");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu danh sách đại biểu vào cơ sở dữ liệu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white border border-slate-200 p-6 text-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#003B95] text-white flex items-center justify-center shadow-md">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Nhập Danh Sách Người Đã Đăng Ký Tham Gia Sự Kiện
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#003B95]">
                  Word • Excel • PDF
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium line-clamp-1">
                Sự kiện: <span className="font-bold text-slate-800">{eventTitle}</span> • Tự động tạo cột động (Dynamic DB) & Ghi nhận Quỹ CRM
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="mt-4 overflow-y-auto pr-1 flex-1 space-y-4">
          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#003B95] rounded-2xl p-6 text-center bg-slate-50/70 hover:bg-blue-50/30 transition cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.docx,.doc,.pdf,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-3 mb-2">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600 group-hover:scale-110 transition" />
              <FileText className="h-8 w-8 text-blue-600 group-hover:scale-110 transition" />
              <FileCode className="h-8 w-8 text-rose-600 group-hover:scale-110 transition" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {parsing ? "Đang phân tích tệp tài liệu..." : "Kéo thả hoặc bấm để tải tệp Word (.docx), Excel (.xlsx), hoặc PDF (.pdf)"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống tự động bóc tách Họ tên, SĐT, Email, Công ty, Chức vụ, Trạng thái thanh toán, Phí vé và các cột dữ liệu tùy ý.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          {recipients.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Tổng Đại Biểu</span>
                <div className="text-xl font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#003B95]" />
                  <span>{recipients.length} người</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase">Đã Thanh Toán</span>
                <div className="text-xl font-black text-emerald-700 mt-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{paidCount}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] font-semibold text-amber-800 uppercase">Chưa Thanh Toán</span>
                <div className="text-xl font-black text-amber-800 mt-0.5 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>{unpaidCount} (Cần nhắc)</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[11px] font-semibold text-blue-800 uppercase">Thu Vào Quỹ Sự Kiện</span>
                <div className="text-xl font-black text-blue-900 mt-0.5 flex items-center gap-1.5">
                  <Wallet className="h-4 w-4" />
                  <span>{totalAmountToFund.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Columns Alert */}
          {detectedColumns.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3 text-xs text-indigo-950">
              <Layers className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-900">
                  Phát hiện {detectedColumns.length} cột tùy biến mới trong tệp:
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {detectedColumns.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-md bg-white border border-indigo-300 font-mono font-semibold text-indigo-800 text-[11px]"
                    >
                      + {c}
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-indigo-700">
                  ⚡ Cơ sở dữ liệu sẽ tự động thực thi Dynamic DDL để thêm các cột này trực tiếp vào bảng <code className="font-mono bg-white px-1 rounded">event_registrations</code> mà không bị mất dữ liệu!
                </p>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {recipients.length > 0 && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Bảng Xem Trước Dữ Liệu Bóc Tách ({recipients.length} dòng)
                </span>
                <span className="text-[11px] text-slate-500">
                  Click vào nút trạng thái để đổi Đã thanh toán / Chưa thanh toán
                </span>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="sticky top-0 bg-slate-100 text-slate-900 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10">STT</th>
                      <th className="py-2.5 px-3">Họ Tên</th>
                      <th className="py-2.5 px-3">Số Điện Thoại</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Công Ty / Chức Danh</th>
                      <th className="py-2.5 px-3">Phí Vé (VNĐ)</th>
                      <th className="py-2.5 px-3">Trạng Thái</th>
                      <th className="py-2.5 px-3 text-right w-12">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recipients.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{r.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.phone || "—"}</td>
                        <td className="py-2 px-3 text-blue-600 truncate max-w-[140px]">{r.email}</td>
                        <td className="py-2 px-3 truncate max-w-[140px]">
                          {r.company ? <span className="font-medium text-slate-800">{r.company}</span> : "—"}
                          {r.position ? <span className="text-slate-400 text-[10px] block">{r.position}</span> : null}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={r.amount || 0}
                            onChange={(e) => handleUpdateAmount(idx, Number(e.target.value))}
                            className="w-24 px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <button
                            type="button"
                            onClick={() => handleTogglePaymentStatus(idx)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                              r.paymentStatus === "paid"
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            }`}
                          >
                            {r.paymentStatus === "paid" ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>Đã thanh toán</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 text-amber-600" />
                                <span>Chưa thanh toán</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteRecipient(idx)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            {recipients.length > 0
              ? `Sẵn sàng nhập ${recipients.length} đại biểu vào CSDL & Quỹ CRM`
              : "Vui lòng chọn tệp danh sách để bắt đầu"}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmitImport}
              disabled={submitting || recipients.length === 0}
              className="py-2 px-5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Đang Nhập & Bắn Vé Điện Tử...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Lưu Vào CSDL & Bắn Vé Qua Email/Zalo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
