import { useState, useRef, useEffect, useMemo } from "react";
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
  CalendarDays,
  MapPin,
  Tag,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { parseSingleDocument, type ParsedFileResult, type ParsedRecipientItem } from "@/lib/ai-excel-email-parser";

interface EventAttendeesImportModalProps {
  open: boolean;
  event?: any;
  eventsList?: any[];
  initialEventId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EventAttendeesImportModal({
  open,
  event,
  eventsList,
  initialEventId,
  onClose,
  onSuccess,
}: EventAttendeesImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [parsedFile, setParsedFile] = useState<ParsedFileResult | null>(null);
  const [recipients, setRecipients] = useState<ParsedRecipientItem[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);

  // 1. Quản lý danh sách sự kiện live: lấy từ props hoặc call API GET /events
  const [availableEvents, setAvailableEvents] = useState<any[]>(() => {
    if (Array.isArray(eventsList) && eventsList.length > 0) return eventsList;
    if (event) return [event];
    return [];
  });

  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return String(initialEventId || event?.id || (eventsList && eventsList[0]?.id) || "");
  });

  // Tự động gọi API lấy toàn bộ danh sách sự kiện đang có trong CSDL 113.20.107.184:6432
  useEffect(() => {
    if (!open) return;
    fetchNestApi<any[]>("/events")
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setAvailableEvents(res);
          if (!selectedEventId || !res.some((e) => String(e.id) === String(selectedEventId))) {
            setSelectedEventId(String(res[0].id));
          }
        }
      })
      .catch((err) => {
        console.warn("[EventAttendeesImportModal] Could not fetch live events:", err);
      });
  }, [open]);

  // Sự kiện hiện được chọn
  const currentEvent = useMemo(() => {
    const found = availableEvents.find((e) => String(e.id) === String(selectedEventId));
    return found || event || availableEvents[0] || null;
  }, [availableEvents, selectedEventId, event]);

  const eventTitle = currentEvent?.name || currentEvent?.title || "Sự kiện CLB CEO HN10";
  const currentEventFee = Number(currentEvent?.ticket_price || currentEvent?.ticketPrice || currentEvent?.fee || 0);
  const isCurrentEventFree = currentEvent ? (currentEventFee === 0 && !currentEvent.is_paid) : true;

  const [defaultTicketPrice, setDefaultTicketPrice] = useState<number>(currentEventFee);

  // Khi người dùng chuyển sự kiện qua dropdown
  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    const ev = availableEvents.find((e) => String(e.id) === String(id));
    if (ev) {
      const fee = Number(ev.ticket_price || ev.ticketPrice || ev.fee || 0);
      setDefaultTicketPrice(fee);
      const isFree = fee === 0 && !ev.is_paid;

      // Đồng bộ lại giá vé và trạng thái thanh toán của danh sách đại biểu
      setRecipients((prev) =>
        prev.map((r) => {
          if (isFree) {
            return { ...r, amount: 0, paymentStatus: "free" };
          } else {
            const numAmount = Number(r.amount || 0);
            return {
              ...r,
              amount: numAmount > 0 ? numAmount : fee,
              paymentStatus: r.paymentStatus === "free" ? "unpaid" : r.paymentStatus,
            };
          }
        })
      );
    }
  };

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
              !hLower.includes("tên") &&
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
              !hLower.includes("thanh toán") &&
              !hLower.includes("stt") &&
              !hLower.includes("ghi chú") &&
              !hLower.includes("note")
            ) {
              customCols.add(hClean);
            }
          }
        }
      }

      // Thu thập thêm các key động từ recipients
      for (const r of res.recipients || []) {
        if (r.dynamicFields) {
          for (const k of Object.keys(r.dynamicFields)) {
            const kLower = k.toLowerCase();
            if (!kLower.includes("name") && !kLower.includes("email") && !kLower.includes("phone")) {
              customCols.add(k);
            }
          }
        }
      }

      setDetectedColumns(Array.from(customCols));

      // Điền giá vé mặc định và nhận diện trạng thái thanh toán chuẩn xác (Paid vs Unpaid vs Free)
      const normalizedRecipients = (res.recipients || []).map((r) => {
        const fee = r.amount !== undefined && r.amount !== null && String(r.amount).trim() !== ""
          ? Number(r.amount) || 0
          : defaultTicketPrice;

        let status: "paid" | "unpaid" | "free" = "unpaid";
        if (isCurrentEventFree || (defaultTicketPrice === 0 && fee === 0)) {
          status = "free";
        } else if (r.paymentStatus === "paid") {
          status = "paid";
        } else if (r.paymentStatus === "free") {
          status = fee === 0 ? "free" : "paid";
        } else {
          status = "unpaid";
        }

        return {
          ...r,
          amount: fee,
          paymentStatus: status,
        };
      });

      setRecipients(normalizedRecipients);
      toast.success(`Đã phân tích tệp ${file.name}: Tìm thấy ${normalizedRecipients.length} đại biểu tham dự!`);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi phân tích tệp tài liệu");
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Toggle nhanh trạng thái từng đại biểu
  const handleTogglePaymentStatus = (index: number) => {
    setRecipients((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        let nextStatus: "paid" | "unpaid" | "free" = "paid";
        if (r.paymentStatus === "paid") {
          nextStatus = "unpaid";
        } else if (r.paymentStatus === "unpaid") {
          nextStatus = "paid";
        } else {
          nextStatus = "paid";
        }
        return { ...r, paymentStatus: nextStatus };
      })
    );
  };

  // Thao tác hàng loạt: Tất cả đã thanh toán
  const handleSetAllPaid = () => {
    setRecipients((prev) => prev.map((r) => ({ ...r, paymentStatus: "paid" })));
    toast.success("Đã chuyển tất cả đại biểu sang: ĐÃ THANH TOÁN (Nhận vé ngay)");
  };

  // Thao tác hàng loạt: Tất cả chưa thanh toán
  const handleSetAllUnpaid = () => {
    setRecipients((prev) => prev.map((r) => ({ ...r, paymentStatus: "unpaid" })));
    toast.info("Đã chuyển tất cả đại biểu sang: CHƯA THANH TOÁN (Sẽ gửi mail hướng dẫn CK)");
  };

  // Thao tác hàng loạt: Đảo trạng thái
  const handleInvertStatus = () => {
    setRecipients((prev) =>
      prev.map((r) => ({
        ...r,
        paymentStatus: r.paymentStatus === "paid" ? "unpaid" : "paid",
      }))
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
  const freeCount = recipients.filter((r) => r.paymentStatus === "free").length;
  const totalAmountToFund = recipients
    .filter((r) => r.paymentStatus === "paid")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const handleSubmitImport = async () => {
    if (recipients.length === 0) {
      toast.error("Không có đại biểu nào trong danh sách để nhập vào hệ thống");
      return;
    }

    const targetEvent = currentEvent;
    if (!targetEvent || !targetEvent.id) {
      toast.error("Vui lòng chọn sự kiện tiếp nhận danh sách đại biểu");
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

      const res = await fetchNestApi<any>(`/events/${targetEvent.id}/import-attendees`, {
        method: "POST",
        body: JSON.stringify({
          records: recordsPayload,
          customColumns: detectedColumns,
          associationId: targetEvent.association_id,
        }),
      });

      if (res && res.ok) {
        toast.success(
          `Nhập thành công ${res.totalImported} đại biểu vào sự kiện "${targetEvent.name || targetEvent.title}"! Đã ghi nhận ${res.totalFundAdded?.toLocaleString("vi-VN")} VNĐ vào Quỹ sự kiện CRM và tự động dispatch vé điện tử / thông báo thanh toán qua Email & Zalo OA!`
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white border border-slate-200 p-6 text-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
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
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Tự động nhận diện cột tùy biến (Dynamic Columns), bóc tách Đã / Chưa thanh toán & Đồng bộ Quỹ CRM
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
          {/* Dynamic Event Selector: Call API danh sách sự kiện đang có */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#003B95] shrink-0" />
                <label className="text-xs font-bold text-slate-800">
                  Chọn Sự Kiện Tiếp Nhận Danh Sách & Gửi Thông Báo:
                </label>
              </div>
              <select
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value)}
                className="w-full sm:w-auto min-w-[320px] max-w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003B95] cursor-pointer"
              >
                {availableEvents.length === 0 && (
                  <option value="">(Đang tải danh sách sự kiện...)</option>
                )}
                {availableEvents.map((ev: any) => {
                  const fee = Number(ev.ticket_price || ev.ticketPrice || ev.fee || 0);
                  const isFree = fee === 0 && !ev.is_paid;
                  const feeLabel = isFree ? "Miễn phí" : `${fee.toLocaleString("vi-VN")} đ`;
                  return (
                    <option key={ev.id} value={ev.id}>
                      {ev.name || ev.title} ({ev.date ? String(ev.date).slice(0, 10) : "Sắp tới"} • {feeLabel})
                    </option>
                  );
                })}
              </select>
            </div>

            {currentEvent && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 pt-3 border-t border-slate-200/80 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <strong>Địa điểm:</strong> {currentEvent.location || "Hội trường CLB CEO HN10"}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  <strong>Thời gian:</strong> {currentEvent.date ? String(currentEvent.date).slice(0, 10) : "Chưa ấn định"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  <strong>Loại vé:</strong>
                  {isCurrentEventFree ? (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Miễn phí (Tự động cấp vé check-in)
                    </span>
                  ) : (
                    <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Có phí ({currentEventFee.toLocaleString("vi-VN")} đ • Nhắc thanh toán nếu chưa nộp)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

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
              Hệ thống tự động nhận diện Họ tên, SĐT, Email, Công ty, Chức vụ, Trạng thái thanh toán (Đã CK / Tiền mặt / Chưa CK) và mọi cột dữ liệu tùy ý.
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
                <span className="text-[11px] font-semibold text-emerald-700 uppercase">Đã Thanh Toán (Nhận Vé)</span>
                <div className="text-xl font-black text-emerald-700 mt-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{paidCount}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] font-semibold text-amber-800 uppercase">Chưa Thanh Toán (Nhắc Nợ)</span>
                <div className="text-xl font-black text-amber-800 mt-0.5 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>{unpaidCount}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[11px] font-semibold text-blue-800 uppercase">Ghi Nhận Quỹ Sự Kiện</span>
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
                  Phát hiện {detectedColumns.length} cột tùy biến (Dynamic Columns) trong tệp:
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {detectedColumns.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-0.5 rounded-md bg-white border border-indigo-300 font-mono font-semibold text-indigo-800 text-[11px] shadow-2xs"
                    >
                      + {c}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-indigo-700">
                  ⚡ Cơ sở dữ liệu sẽ tự động thực thi Dynamic DDL để thêm các cột này trực tiếp vào bảng <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">event_registrations</code>, giữ nguyên trọn vẹn mọi thông tin tùy biến!
                </p>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {recipients.length > 0 && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Bảng Xem Trước Dữ Liệu Bóc Tách ({recipients.length} dòng)
                  </span>
                  <span className="text-[11px] text-slate-500 ml-2 hidden sm:inline">
                    • Nhấp vào trạng thái để chuyển đổi nhanh
                  </span>
                </div>

                {/* Batch Action Buttons: Thao tác hàng loạt */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSetAllPaid}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Tất cả Đã thanh toán
                  </button>
                  <button
                    type="button"
                    onClick={handleSetAllUnpaid}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    Tất cả Chưa thanh toán
                  </button>
                  <button
                    type="button"
                    onClick={handleInvertStatus}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Đảo ngược trạng thái"
                  >
                    <RefreshCw className="h-3 w-3 text-slate-600" />
                    Đảo
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="sticky top-0 bg-slate-100 text-slate-900 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 shadow-2xs">
                    <tr>
                      <th className="py-2.5 px-3 w-10">STT</th>
                      <th className="py-2.5 px-3">Họ Tên</th>
                      <th className="py-2.5 px-3">Số Điện Thoại</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Công Ty / Chức Danh</th>
                      <th className="py-2.5 px-3">Phí Vé (VNĐ)</th>
                      <th className="py-2.5 px-3">Trạng Thái Thanh Toán</th>
                      {/* Dynamic Columns Headers */}
                      {detectedColumns.map((col) => (
                        <th
                          key={col}
                          className="py-2.5 px-3 whitespace-nowrap bg-indigo-50/70 text-indigo-950 font-bold border-l border-indigo-200 text-left"
                        >
                          {col}
                        </th>
                      ))}
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
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                              r.paymentStatus === "paid"
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                                : r.paymentStatus === "free"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                            }`}
                          >
                            {r.paymentStatus === "paid" ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>Đã thanh toán (Nhận vé)</span>
                              </>
                            ) : r.paymentStatus === "free" ? (
                              <>
                                <Sparkles className="h-3 w-3 text-blue-600" />
                                <span>Miễn phí (Nhận vé)</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 text-amber-600" />
                                <span>Chưa thanh toán (Nhắc nợ)</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Dynamic Columns Values */}
                        {detectedColumns.map((col) => {
                          const val = (r.dynamicFields && r.dynamicFields[col] !== undefined)
                            ? r.dynamicFields[col]
                            : ((r as any)[col] ?? "—");
                          return (
                            <td
                              key={col}
                              className="py-2 px-3 whitespace-nowrap text-slate-700 border-l border-slate-100 font-medium"
                            >
                              {String(val || "—")}
                            </td>
                          );
                        })}

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
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
            {recipients.length > 0 ? (
              <span>
                Sẵn sàng nạp <strong>{recipients.length}</strong> đại biểu vào sự kiện <strong>"{eventTitle}"</strong> (Quỹ: +{totalAmountToFund.toLocaleString("vi-VN")} đ)
              </span>
            ) : (
              "Vui lòng chọn sự kiện và tải tệp danh sách đại biểu để tiếp tục"
            )}
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
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
                  <span>Lưu CSDL & Gửi Vé / Nhắc Thanh Toán</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
