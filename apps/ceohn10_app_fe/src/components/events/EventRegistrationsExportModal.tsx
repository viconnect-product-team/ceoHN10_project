import { useState, useMemo } from "react";
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  UserX,
  Users,
  Wallet,
  Coins,
  Sparkles,
  CalendarDays,
  Tag,
  Building,
  Check,
  Send,
  Mail,
  UserCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, type ExcelColumn } from "@/lib/excel-export";
import { buildThreeFormatAttachments } from "@/lib/report-mail-export";
import { type EventItem, type Registration } from "@/lib/events.functions";
import { fetchNestApi } from "@/lib/api-client";

export type ExportCategory =
  | "all"
  | "checked_in"
  | "late"
  | "on_time"
  | "not_checked_in"
  | "paid"
  | "unpaid"
  | "vip"
  | "standard";

export interface EventRegistrationsExportModalProps {
  open: boolean;
  onClose: () => void;
  registrations: Registration[];
  eventsList?: EventItem[];
  currentEvent?: EventItem | null;
  selectedEventId?: string;
}

export function isLateAttendee(reg: Registration, event?: EventItem | any): boolean {
  if (!reg.checkedInAt && reg.status !== "attended") return false;
  if ((reg as any).isLate || (reg as any).dynamic_data?.isLate) return true;
  if (reg.note && (reg.note.toLowerCase().includes("muộn") || reg.note.toLowerCase().includes("late"))) return true;

  if (reg.checkedInAt) {
    try {
      const checkinDate = new Date(reg.checkedInAt);
      if (!isNaN(checkinDate.getTime())) {
        const eventDateStr = reg.eventDate || event?.date;
        const startTimeStr = (event as any)?.start_time || (event as any)?.startTime || "08:30";
        if (eventDateStr) {
          const [sh, sm] = startTimeStr.split(":").map((v: string) => parseInt(v, 10) || 0);
          const eventStart = new Date(eventDateStr);
          eventStart.setHours(sh, sm, 0, 0);
          return checkinDate.getTime() > eventStart.getTime() + 5 * 60 * 1000;
        } else if (checkinDate.getHours() >= 9 && checkinDate.getMinutes() > 0) {
          return true;
        }
      }
    } catch {}
  }
  return false;
}

export function EventRegistrationsExportModal({
  open,
  onClose,
  registrations,
  eventsList = [],
  currentEvent,
  selectedEventId,
}: EventRegistrationsExportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<ExportCategory>("all");
  const [exporting, setExporting] = useState<string | null>(null);

  // UC-EVT-10: Gửi báo cáo qua Email / Zalo OA cho nhiều tài khoản chọn trước
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [selectedRecipientAccounts, setSelectedRecipientAccounts] = useState<string[]>([
    "loptruong@ceohn10.vn",
    "loppho_taichinh@ceohn10.vn",
  ]);
  const [customRecipientInput, setCustomRecipientInput] = useState("");

  const PRECONFIGURED_ACCOUNTS = [
    { id: "loptruong@ceohn10.vn", label: "Lớp trưởng (Ban Điều Hành Cao Nhất)", role: "Lớp trưởng" },
    { id: "loppho_taichinh@ceohn10.vn", label: "Lớp phó (Phụ Trách Tài Chính & Quỹ Lớp)", role: "Lớp phó" },
    { id: "truong_ban_sukien@ceohn10.vn", label: "Trưởng Ban Sự Kiện & Hậu Cần", role: "Trưởng Ban" },
    { id: "truong_ban_truyenthong@ceohn10.vn", label: "Trưởng Ban Truyền Thông", role: "Trưởng Ban" },
    { id: "truong_ban_congnghe@ceohn10.vn", label: "Trưởng Ban Công Nghệ", role: "Trưởng Ban" },
  ];

  const handleToggleRecipient = (accId: string) => {
    setSelectedRecipientAccounts((prev) =>
      prev.includes(accId) ? prev.filter((id) => id !== accId) : [...prev, accId]
    );
  };

  // Phân loại danh sách theo sự kiện hiện tại (nếu chọn sự kiện cụ thể)
  const scopedRegistrations = useMemo(() => {
    if (!selectedEventId || selectedEventId === "all") return registrations;
    return registrations.filter((r) => String(r.eventId) === String(selectedEventId));
  }, [registrations, selectedEventId]);

  // Lấy sự kiện đại diện
  const activeEvent = useMemo(() => {
    if (currentEvent) return currentEvent;
    if (selectedEventId && selectedEventId !== "all") {
      return eventsList.find((e) => String(e.id) === String(selectedEventId)) || null;
    }
    return eventsList[0] || null;
  }, [currentEvent, selectedEventId, eventsList]);

  const eventTitle = activeEvent?.name || "CLB Doanh Nhân CEO HN10";
  const eventDate = activeEvent?.date ? String(activeEvent.date).slice(0, 10) : "2026";
  const eventLocation = activeEvent?.location || "Hội trường CLB CEO HN10";

  // Danh mục phân loại và số lượng đại biểu tương ứng
  const categoriesConfig = useMemo(() => {
    const totalAll = scopedRegistrations.length;
    const checkedInList = scopedRegistrations.filter((r) => r.status === "attended" || Boolean(r.checkedInAt));
    const lateList = checkedInList.filter((r) => isLateAttendee(r, activeEvent));
    const onTimeList = checkedInList.filter((r) => !isLateAttendee(r, activeEvent));
    const notCheckedInList = scopedRegistrations.filter((r) => r.status !== "attended" && !r.checkedInAt);
    const paidList = scopedRegistrations.filter((r) => r.paymentStatus === "paid");
    const unpaidList = scopedRegistrations.filter((r) => r.paymentStatus !== "paid");
    const vipList = scopedRegistrations.filter(
      (r) => r.ticketType && r.ticketType.toLowerCase().includes("vip")
    );
    const standardList = scopedRegistrations.filter(
      (r) => !r.ticketType || !r.ticketType.toLowerCase().includes("vip")
    );

    return [
      {
        id: "all" as ExportCategory,
        title: "Tất cả đại biểu đăng ký",
        desc: "Toàn bộ danh sách tham dự sự kiện",
        count: totalAll,
        icon: Users,
        color: "text-blue-700 bg-blue-50 border-blue-200",
      },
      {
        id: "checked_in" as ExportCategory,
        title: "Khách đã check-in",
        desc: "Đại biểu đã có mặt và điểm danh",
        count: checkedInList.length,
        icon: CheckCircle2,
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      },
      {
        id: "late" as ExportCategory,
        title: "Khách đi muộn",
        desc: "Đại biểu điểm danh sau giờ bắt đầu",
        count: lateList.length,
        icon: Clock,
        color: "text-amber-800 bg-amber-50 border-amber-200",
      },
      {
        id: "on_time" as ExportCategory,
        title: "Khách đến đúng giờ",
        desc: "Đại biểu điểm danh chuẩn giờ",
        count: onTimeList.length,
        icon: Sparkles,
        color: "text-teal-700 bg-teal-50 border-teal-200",
      },
      {
        id: "not_checked_in" as ExportCategory,
        title: "Chưa check-in / Vắng mặt",
        desc: "Đại biểu chưa điểm danh tại cửa",
        count: notCheckedInList.length,
        icon: UserX,
        color: "text-rose-700 bg-rose-50 border-rose-200",
      },
      {
        id: "paid" as ExportCategory,
        title: "Đã thanh toán phí vé",
        desc: "Đã hoàn thành nghĩa vụ tài chính",
        count: paidList.length,
        icon: Wallet,
        color: "text-indigo-700 bg-indigo-50 border-indigo-200",
      },
      {
        id: "unpaid" as ExportCategory,
        title: "Chưa thanh toán / Chờ thu",
        desc: "Đại biểu chưa nộp phí tham dự",
        count: unpaidList.length,
        icon: Coins,
        color: "text-orange-700 bg-orange-50 border-orange-200",
      },
      {
        id: "vip" as ExportCategory,
        title: "Đại biểu vé VIP",
        desc: "Doanh nhân & Khách mời hạng VIP",
        count: vipList.length,
        icon: Tag,
        color: "text-purple-700 bg-purple-50 border-purple-200",
      },
    ];
  }, [scopedRegistrations, activeEvent]);

  // Lọc danh sách theo danh mục đang chọn
  const filteredData = useMemo(() => {
    switch (selectedCategory) {
      case "checked_in":
        return scopedRegistrations.filter((r) => r.status === "attended" || Boolean(r.checkedInAt));
      case "late":
        return scopedRegistrations.filter((r) => (r.status === "attended" || Boolean(r.checkedInAt)) && isLateAttendee(r, activeEvent));
      case "on_time":
        return scopedRegistrations.filter((r) => (r.status === "attended" || Boolean(r.checkedInAt)) && !isLateAttendee(r, activeEvent));
      case "not_checked_in":
        return scopedRegistrations.filter((r) => r.status !== "attended" && !r.checkedInAt);
      case "paid":
        return scopedRegistrations.filter((r) => r.paymentStatus === "paid");
      case "unpaid":
        return scopedRegistrations.filter((r) => r.paymentStatus !== "paid");
      case "vip":
        return scopedRegistrations.filter((r) => r.ticketType && r.ticketType.toLowerCase().includes("vip"));
      case "standard":
        return scopedRegistrations.filter((r) => !r.ticketType || !r.ticketType.toLowerCase().includes("vip"));
      case "all":
      default:
        return scopedRegistrations;
    }
  }, [scopedRegistrations, selectedCategory, activeEvent]);

  const activeCategoryMeta = useMemo(() => {
    return categoriesConfig.find((c) => c.id === selectedCategory) || categoriesConfig[0];
  }, [categoriesConfig, selectedCategory]);

  // Cấu hình cột xuất cho Excel & CSV
  const excelColumns: ExcelColumn<Registration>[] = [
    {
      header: "STT",
      key: "stt",
      width: 8,
      value: (_, idx) => idx + 1,
    },
    {
      header: "Mã ĐK / Mã Vé",
      key: "id",
      width: 16,
      value: (r) => r.id || r.memberCode || "—",
    },
    {
      header: "Họ và Tên",
      key: "memberName",
      width: 26,
      value: (r) => r.memberName,
    },
    {
      header: "Số Điện Thoại",
      key: "phone",
      width: 16,
      value: (r) => r.phone || "—",
    },
    {
      header: "Email",
      key: "email",
      width: 26,
      value: (r) => r.email || "—",
    },
    {
      header: "Doanh Nghiệp / Công Ty",
      key: "company",
      width: 28,
      value: (r) => r.company || "—",
    },
    {
      header: "Chức Vụ",
      key: "title",
      width: 18,
      value: (r) => r.title || (r as any).position || "Đại biểu",
    },
    {
      header: "Loại Vé",
      key: "ticketType",
      width: 18,
      value: (r) => r.ticketType || "Vé Tiêu Chuẩn",
    },
    {
      header: "Giá Vé (VNĐ)",
      key: "paymentAmount",
      width: 16,
      value: (r) => Number(r.paymentAmount || 0),
    },
    {
      header: "Thanh Toán",
      key: "paymentStatus",
      width: 16,
      value: (r) => (r.paymentStatus === "paid" ? "Đã thanh toán" : r.paymentStatus === "free" ? "Miễn phí" : "Chưa thanh toán"),
    },
    {
      header: "Chỗ Ngồi",
      key: "seatAssignment",
      width: 16,
      value: (r) => r.seatAssignment || "Chưa xếp",
    },
    {
      header: "Thời Gian Check-in",
      key: "checkedInAt",
      width: 22,
      value: (r) => (r.checkedInAt ? new Date(r.checkedInAt).toLocaleString("vi-VN") : "Chưa điểm danh"),
    },
    {
      header: "Tình Trạng Điểm Danh",
      key: "attendanceStatus",
      width: 20,
      value: (r) => {
        if (!r.checkedInAt && r.status !== "attended") return "Vắng mặt / Chưa đến";
        return isLateAttendee(r, activeEvent) ? "Đi muộn" : "Đúng giờ";
      },
    },
    {
      header: "Ghi Chú",
      key: "note",
      width: 22,
      value: (r) => r.note || "",
    },
  ];

  // 1. XUẤT ĐỊNH DẠNG 1: MICROSOFT EXCEL (.xlsx)
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.warning("Không có dữ liệu đại biểu trong danh mục này để xuất file");
      return;
    }
    setExporting("excel");
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const categorySlug = selectedCategory;
      const cleanEventName = eventTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_").slice(0, 30);
      const filename = `Bao_Cao_${cleanEventName}_${categorySlug}_${stamp}`;

      const totalPaidAmount = filteredData
        .filter((r) => r.paymentStatus === "paid")
        .reduce((sum, r) => sum + Number(r.paymentAmount || 0), 0);

      exportToExcel<Registration>({
        filename,
        title: "BÁO CÁO DANH SÁCH ĐẠI BIỂU SỰ KIỆN",
        subtitle: `Sự kiện: ${eventTitle} | Địa điểm: ${eventLocation} | Ngày: ${eventDate}`,
        sheetName: "Danh Sách Đại Biểu",
        organization: "CLB DOANH NHÂN CEO HN10 (HANOIBA)",
        address: "CEOHN10 Doanh Nghiệp Trẻ Hà Nội",
        columns: excelColumns,
        data: filteredData,
        summaryRows: [
          ["TỔNG SỐ ĐẠI BIỂU TRONG BÁO CÁO:", `${filteredData.length} người`],
          ["DANH MỤC XUẤT BÁO CÁO:", activeCategoryMeta.title],
          ["TỔNG TIỀN VÉ ĐÃ THU:", `${totalPaidAmount.toLocaleString("vi-VN")} VNĐ`],
        ],
      });

      toast.success(`Đã xuất thành công tệp Excel: ${filename}.xlsx (${filteredData.length} bản ghi)`);
    } catch (err: any) {
      toast.error("Lỗi khi xuất tệp Excel: " + (err?.message || ""));
    } finally {
      setExporting(null);
    }
  };

  // 2. XUẤT ĐỊNH DẠNG 2: TỆP DỮ LIỆU CSV (.csv) CHUẨN UTF-8 BOM
  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      toast.warning("Không có dữ liệu đại biểu trong danh mục này để xuất file");
      return;
    }
    setExporting("csv");
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const cleanEventName = eventTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_").slice(0, 30);
      const filename = `Bao_Cao_${cleanEventName}_${selectedCategory}_${stamp}.csv`;

      // Header CSV
      const headers = excelColumns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",");
      const rows = filteredData.map((r, idx) => {
        return excelColumns
          .map((c) => {
            const rawVal = c.value(r, idx);
            const strVal = rawVal === null || rawVal === undefined ? "" : String(rawVal);
            return `"${strVal.replace(/"/g, '""')}"`;
          })
          .join(",");
      });

      // UTF-8 BOM (\uFEFF) giúp Excel mở không bao giờ bị lỗi font tiếng Việt
      const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Đã xuất thành công tệp CSV: ${filename} (${filteredData.length} bản ghi)`);
    } catch (err: any) {
      toast.error("Lỗi khi xuất tệp CSV: " + (err?.message || ""));
    } finally {
      setExporting(null);
    }
  };

  // 3. XUẤT ĐỊNH DẠNG 3: BẢN IN HÀNH CHÍNH A4 / PDF (.pdf)
  const handleExportPdf = () => {
    if (filteredData.length === 0) {
      toast.warning("Không có dữ liệu đại biểu trong danh mục này để in / xuất PDF");
      return;
    }
    setExporting("pdf");
    try {
      const now = new Date();
      const dateStr = `Hà Nội, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
      const totalPaidAmount = filteredData
        .filter((r) => r.paymentStatus === "paid")
        .reduce((sum, r) => sum + Number(r.paymentAmount || 0), 0);

      const tableRowsHtml = filteredData
        .map((r, idx) => {
          const attendance = !r.checkedInAt && r.status !== "attended" 
            ? '<span style="color: #991b1b; font-weight: bold;">Chưa điểm danh</span>' 
            : isLateAttendee(r, activeEvent) 
            ? '<span style="color: #b45309; font-weight: bold;">Đi muộn</span>' 
            : '<span style="color: #065f46; font-weight: bold;">Đúng giờ</span>';

          const payment = r.paymentStatus === "paid" 
            ? '<span style="color: #065f46;">Đã nộp</span>' 
            : r.paymentStatus === "free" 
            ? '<span style="color: #5b21b6;">Miễn phí</span>' 
            : '<span style="color: #b45309;">Chưa nộp</span>';

          return `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td style="font-family: monospace; font-size: 8.5pt;">${r.id || r.memberCode || "—"}</td>
              <td style="font-weight: bold;">${r.memberName}</td>
              <td>${r.phone || "—"}</td>
              <td>${r.company || "—"}</td>
              <td>${r.title || (r as any).position || "Đại biểu"}</td>
              <td style="font-weight: bold;">${r.ticketType || "Vé Tiêu Chuẩn"}</td>
              <td style="text-align: right; font-family: monospace;">${Number(r.paymentAmount || 0).toLocaleString("vi-VN")} đ</td>
              <td style="text-align: center;">${payment}</td>
              <td style="text-align: center;">${r.seatAssignment || "—"}</td>
              <td style="text-align: center;">${attendance}</td>
            </tr>
          `;
        })
        .join("");

      const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Báo Cáo Đại Biểu Sự Kiện - ${eventTitle}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 15mm 12mm 15mm;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
            color: #0f172a;
            margin: 0;
            padding: 0;
            line-height: 1.35;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          .header-table td {
            vertical-align: top;
            border: none;
            padding: 2px 0;
          }
          .title-section {
            text-align: center;
            margin: 10px 0 16px 0;
          }
          .title-section h1 {
            font-size: 15pt;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            color: #002B70;
          }
          .title-section p {
            margin: 4px 0 0 0;
            font-size: 10.5pt;
            font-style: italic;
          }
          .category-tag {
            display: inline-block;
            margin-top: 5px;
            padding: 2px 10px;
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            font-weight: bold;
            font-size: 10pt;
            color: #0f172a;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          table.data-table th, table.data-table td {
            border: 1px solid #64748b;
            padding: 5px 6px;
            font-size: 8.5pt;
          }
          table.data-table th {
            background-color: #f8fafc;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            font-size: 8pt;
          }
          .summary-box {
            margin-top: 12px;
            font-size: 9.5pt;
            font-style: italic;
          }
          .sign-table {
            width: 100%;
            margin-top: 25px;
            border-collapse: collapse;
            page-break-inside: avoid;
          }
          .sign-table td {
            text-align: center;
            vertical-align: top;
            border: none;
            width: 33.3%;
            font-size: 9.5pt;
          }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #002B70; color: white; padding: 10px 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
          <span><strong>Chế độ In A4 / Xuất PDF:</strong> Nhấn nút "In hoặc Lưu PDF" bên phải hoặc dùng phím tắt Ctrl+P (chọn Save as PDF).</span>
          <button onclick="window.print()" style="background: #10B981; color: white; font-weight: bold; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer;">
            🖨️ In hoặc Lưu PDF
          </button>
        </div>

        <table class="header-table">
          <tr>
            <td style="width: 45%; text-align: center;">
              <strong>CEOHN10 DOANH NGHIỆP TRẺ HÀ NỘI</strong><br/>
              <strong style="color: #002B70;">CLB DOANH NHÂN CEO HN10</strong><br/>
              <span style="font-size: 8.5pt;">Số: ...../BC-CEOHN10-EVT</span>
            </td>
            <td style="width: 55%; text-align: center;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <strong style="text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</strong><br/>
              <span style="font-size: 8.5pt; font-style: italic;">----------o0o----------</span>
            </td>
          </tr>
        </table>

        <div class="title-section">
          <h1>BÁO CÁO DANH SÁCH ĐẠI BIỂU SỰ KIỆN</h1>
          <p>Sự kiện: <strong>${eventTitle}</strong></p>
          <p style="font-size: 9pt;">Thời gian: ${eventDate} | Địa điểm: ${eventLocation}</p>
          <div class="category-tag">Danh mục báo cáo: ${activeCategoryMeta.title} (${filteredData.length} đại biểu)</div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 25px;">STT</th>
              <th style="width: 70px;">Mã Vé</th>
              <th>Họ và Tên</th>
              <th style="width: 80px;">SĐT</th>
              <th>Công Ty / Đơn Vị</th>
              <th style="width: 75px;">Chức Vụ</th>
              <th style="width: 75px;">Hạng Vé</th>
              <th style="width: 80px;">Giá Vé</th>
              <th style="width: 65px;">Thu Phí</th>
              <th style="width: 60px;">Chỗ Ngồi</th>
              <th style="width: 85px;">Điểm Danh</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="summary-box">
          * Tổng số đại biểu theo danh mục: <strong>${filteredData.length} người</strong>.<br/>
          * Tổng số tiền vé đã ghi nhận thu: <strong>${totalPaidAmount.toLocaleString("vi-VN")} VNĐ</strong>.
        </div>

        <div style="text-align: right; margin-top: 15px; font-style: italic; font-size: 9.5pt;">
          ${dateStr}
        </div>

        <table class="sign-table">
          <tr>
            <td>
              <strong>NGƯỜI LẬP BIỂU</strong><br/>
              <span style="font-size: 8.5pt; font-style: italic;">(Ký, ghi rõ họ tên)</span>
              <br/><br/><br/><br/>
            </td>
            <td>
              <strong>LỚP PHÓ (PHỤ TRÁCH TÀI CHÍNH)</strong><br/>
              <span style="font-size: 8.5pt; font-style: italic;">(Ký, ghi rõ họ tên)</span>
              <br/><br/><br/><br/>
            </td>
            <td>
              <strong>LỚP TRƯỞNG / TRƯỞNG BAN SỰ KIỆN HẬU CẦN</strong><br/>
              <span style="font-size: 8.5pt; font-style: italic;">(Ký, đóng dấu)</span>
              <br/><br/><br/><br/>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      } else {
        toast.info("Vui lòng cho phép mở cửa sổ popup để xem bản in A4 / Lưu PDF.");
      }

      toast.success(`Đã chuẩn bị bản in A4 / PDF: Danh mục "${activeCategoryMeta.title}" (${filteredData.length} bản ghi)`);
    } catch (err: any) {
      toast.error("Lỗi khi tạo bản in PDF: " + (err?.message || ""));
    } finally {
      setExporting(null);
    }
  };

  // UC-EVT-10: Gửi báo cáo sự kiện qua Email / Zalo OA cho nhiều tài khoản
  const handleSendReport = async () => {
    const extraEmails = customRecipientInput
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    const allRecipients = Array.from(new Set([...selectedRecipientAccounts, ...extraEmails]));

    if (allRecipients.length === 0) {
      toast.warning("Vui lòng chọn hoặc nhập ít nhất một email tài khoản nhận báo cáo!");
      return;
    }

    setSendingReport(true);
    try {
      const eId = activeEvent?.id || "latest";
      const totalPaidAmount = filteredData
        .filter((r) => r.paymentStatus === "paid")
        .reduce((sum, r) => sum + Number(r.paymentAmount || 0), 0);

      const attachments = buildThreeFormatAttachments({
        title: `BÁO CÁO ĐẠI BIỂU SỰ KIỆN: ${eventTitle}`,
        subtitle: `Danh mục: ${activeCategoryMeta.title} | Ngày: ${eventDate}`,
        filePrefix: `bao-cao-su-kien-${eId}`,
        columns: [
          { header: "Mã Vé", key: "id" },
          { header: "Họ Tên", key: "memberName" },
          { header: "SĐT", key: "phone" },
          { header: "Email", key: "email" },
          { header: "Loại Vé", key: "ticketType" },
          { header: "Số Tiền", key: "paymentAmount" },
          { header: "Thanh Toán", key: "paymentStatus" },
        ],
        rows: filteredData.map((r) => ({
          id: r.id,
          memberName: r.memberName,
          phone: r.phone || "",
          email: r.email || "",
          ticketType: r.ticketType || "Standard",
          paymentAmount: r.paymentAmount ?? 0,
          paymentStatus: r.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
        })),
      });

      const res = await fetchNestApi<any>(`/events/${eId}/send-report`, {
        method: "POST",
        body: JSON.stringify({
          recipients: allRecipients,
          category: activeCategoryMeta.title,
          format: "Tất cả định dạng (Excel, CSV, PDF)",
          attachments,
          reportSummary: {
            total: scopedRegistrations.length,
            checkedIn: scopedRegistrations.filter((r) => r.status === "attended" || Boolean(r.checkedInAt)).length,
            late: scopedRegistrations.filter((r) => isLateAttendee(r, activeEvent)).length,
            onTime: scopedRegistrations.filter((r) => !isLateAttendee(r, activeEvent)).length,
            unpaid: scopedRegistrations.filter((r) => r.paymentStatus !== "paid").length,
            paidAmount: totalPaidAmount,
          },
        }),
      });

      if (res && res.ok) {
        toast.success(`Đã gửi báo cáo danh mục "${activeCategoryMeta.title}" thành công tới ${res.deliveredCount || allRecipients.length} tài khoản qua Email & Zalo OA!`);
        setShowSendModal(false);
      } else {
        toast.error(res?.message || "Không thể gửi báo cáo lúc này");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi gửi báo cáo");
    } finally {
      setSendingReport(false);
    }
  };

  // 4. XUẤT CẢ 3 ĐỊNH DẠNG ĐỒNG THỜI
  const handleExportAllFormats = () => {
    handleExportExcel();
    setTimeout(() => {
      handleExportCsv();
    }, 400);
    setTimeout(() => {
      handleExportPdf();
    }, 800);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 overflow-hidden max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#002B70] flex items-center justify-center text-white shadow-xs">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Xuất Báo Cáo Danh Sách Đại Biểu Tham Dự Sự Kiện
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chọn danh mục cần báo cáo (check-in, đi muộn, chưa đến, đã thu phí...) và xuất đủ 3 định dạng chuẩn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Target Event Info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#002B70]" />
              <span className="font-bold text-slate-900">{eventTitle}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-medium">{eventDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{eventLocation}</span>
            </div>
          </div>

          {/* 1. Chọn Danh Mục Báo Cáo */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                1. Chọn Danh Mục Cần Xuất Báo Cáo:
              </label>
              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Đã chọn: {activeCategoryMeta.title} ({filteredData.length} đại biểu)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {categoriesConfig.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 relative ${
                      isSelected
                        ? "border-[#002B70] bg-blue-50/70 ring-2 ring-[#002B70]/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#002B70] text-white flex items-center justify-center text-[10px] font-black">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {cat.title}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-500 truncate max-w-[100px]">
                        {cat.desc}
                      </span>
                      <span className="font-black text-sm text-[#002B70] font-mono">
                        {cat.count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn Định Dạng Xuất File (Đủ 3 Định Dạng Chuẩn) */}
          <div className="pt-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2.5">
              2. Chọn Định Dạng Xuất Báo Cáo (Đầy Đủ 3 Định Dạng):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Định dạng 1: Excel .xlsx */}
              <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Microsoft Excel (.xlsx)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Định dạng chuẩn kế toán & kiểm toán, có tiêu đề, màu sắc, phân cột và dòng tổng
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={exporting !== null || filteredData.length === 0}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất File Excel (.xlsx)</span>
                </button>
              </div>

              {/* Định dạng 2: CSV .csv */}
              <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Tệp Dữ Liệu CSV (.csv)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Chuẩn UTF-8 BOM, phân tách dấu phẩy, mở trên Excel / ERP không bị lỗi font tiếng Việt
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={exporting !== null || filteredData.length === 0}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất File CSV (.csv)</span>
                </button>
              </div>

              {/* Định dạng 3: Bản In A4 / PDF .pdf */}
              <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Bản In Hành Chính / PDF (.pdf)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mẫu biểu A4 chuẩn mực, có Quốc hiệu, Tiêu ngữ, chữ ký BQT, in hoặc Lưu thành PDF
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exporting !== null || filteredData.length === 0}
                  className="w-full py-2 px-3 rounded-xl bg-[#002B70] hover:bg-blue-950 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In / Lưu PDF (.pdf)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
            Danh mục: <strong>"{activeCategoryMeta.title}"</strong> ({filteredData.length} đại biểu tham dự)
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Nút gửi báo cáo trực tiếp (UC-EVT-10) */}
            <button
              type="button"
              onClick={() => setShowSendModal(true)}
              disabled={filteredData.length === 0}
              className="py-2 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#002B70] font-bold text-xs flex items-center gap-1.5 border border-blue-200 transition cursor-pointer disabled:opacity-50"
              title="Gửi báo cáo số liệu và danh sách đại biểu qua Email và Zalo OA cho nhiều tài khoản chọn trước"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi Báo Cáo (Email/Zalo)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleExportAllFormats}
              disabled={exporting !== null || filteredData.length === 0}
              className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
              title="Tự động xuất cả 3 định dạng: Excel (.xlsx), CSV (.csv) và Mở bản in A4 / Lưu PDF"
            >
              <Download className="h-4 w-4" />
              <span>Xuất Cả 3 Định Dạng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal: Chọn tài khoản để gửi báo cáo qua Email / Zalo OA (UC-EVT-10) */}
      {showSendModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#002B70] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">GỬI BÁO CÁO QUA EMAIL / ZALO OA</h4>
                  <p className="text-[11px] text-slate-500">Danh mục: {activeCategoryMeta.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 block">
                Chọn các tài khoản Ban Cán Sự & Trưởng Ban nhận báo cáo:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {PRECONFIGURED_ACCOUNTS.map((acc) => {
                  const isChecked = selectedRecipientAccounts.includes(acc.id);
                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleToggleRecipient(acc.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
                        isChecked
                          ? "bg-blue-50 border-blue-300 text-blue-900 font-semibold"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded text-[#002B70] pointer-events-none"
                        />
                        <span className="truncate">{acc.label}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0 font-medium">
                        {acc.role}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Nhập thêm email khác (cách nhau bởi dấu phẩy):
                </label>
                <input
                  type="text"
                  placeholder="vi_du@ceohn10.vn, doanhtri@gmail.com..."
                  value={customRecipientInput}
                  onChange={(e) => setCustomRecipientInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-[#002B70]"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">Tóm tắt nội dung sẽ gửi:</div>
              <div className="text-[11px] text-slate-600 flex justify-between">
                <span>Số đại biểu trong báo cáo:</span>
                <strong className="text-slate-800">{filteredData.length} người</strong>
              </div>
              <div className="text-[11px] text-slate-600 flex justify-between">
                <span>Số tài khoản sẽ nhận:</span>
                <strong className="text-[#002B70]">
                  {selectedRecipientAccounts.length + (customRecipientInput.trim() ? 1 : 0)} tài khoản
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={sendingReport}
                onClick={handleSendReport}
                className="py-1.5 px-4 rounded-xl bg-[#002B70] hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {sendingReport ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{sendingReport ? "Đang Gửi..." : "Xác Nhận Gửi"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
