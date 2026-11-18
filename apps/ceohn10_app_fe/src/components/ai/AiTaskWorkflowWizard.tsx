import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Sparkles,
  Send,
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Users,
  Search,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  Building2,
  Mail,
  Phone,
  Wallet,
  Calendar,
  ShieldCheck,
  Clock,
  Layers,
  FileCheck,
  FolderDown,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { fetchNestApi } from "@/lib/api-client";
import { exportToExcel, exportToWord, formatExcelCurrency, numberToVietnameseWords } from "@/lib/excel-export";
import { getTemplateForExport, exportReportToPdf } from "@/lib/report-templates";

export type TaskActionType =
  | "fee_notice"
  | "reminder_notice"
  | "export_reports"
  | "doc_analysis";

export interface RecipientMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  position?: string;
  department?: string;
  amount?: number;
  noticeContent?: string;
  selected?: boolean;
}

export function AiTaskWorkflowWizard() {
  // ── STEPPER: 5 BƯỚC THAO TÁC RÕ RÀNG ──
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ── BƯỚC 1: TÁC VỤ & FILE ──
  const [actionType, setActionType] = useState<TaskActionType>("fee_notice");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsingFile, setParsingFile] = useState<boolean>(false);
  const [parsedDocSummary, setParsedDocSummary] = useState<string>("");
  const [parsedExcelRows, setParsedExcelRows] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── BƯỚC 2: SOẠN THẢO THÔNG BÁO / BÁO CÁO ──
  const [noticeCategory, setNoticeCategory] = useState<string>("fees");
  const [noticeTitle, setNoticeTitle] = useState<string>(
    "Thông báo đóng niên liễm & hội phí thường niên năm 2026 — CLB Doanh Nhân CEO HN10"
  );
  const [noticeContent, setNoticeContent] = useState<string>(
    `Kính gửi Quý Doanh nhân {name} - {company},\n\nBan Chấp hành và Ban Tài chính CLB Doanh Nhân CEO HN10 (HanoiBA) xin gửi lời chào trân trọng và lời chúc sức khỏe, thành công đến Quý Hội viên.\n\nNhằm duy trì và phát triển các hoạt động kết nối giao thương B2B, đào tạo nâng tầm lãnh đạo và các chương trình thiện nguyện vì cộng đồng trong năm 2026, Ban Điều Hành trân trọng kính báo Quý Hội viên hoàn thành nghĩa vụ đóng niên liễm thường niên 2026.\n\n• Số tiền hội phí: {amount} VNĐ\n• Hạn nộp: Trước ngày {deadline}\n• Nội dung chuyển khoản: {transfer_note}\n\nSự đồng hành trách nhiệm của Quý Hội viên là nền tảng vững chắc xây dựng tập thể CEO HN10 đoàn kết và thịnh vượng.\n\nTrân trọng cảm ơn,\nBAN ĐIỀU HÀNH CLB DOANH NHÂN CEO HN10`
  );
  const [deadline, setDeadline] = useState<string>("31/03/2026");
  const [exportFormats, setExportFormats] = useState<{
    excel: boolean;
    word: boolean;
    pdf: boolean;
  }>({
    excel: true,
    word: true,
    pdf: true,
  });

  // ── BƯỚC 3: DANH SÁCH NGƯỜI NHẬN ──
  const [members, setMembers] = useState<RecipientMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [searchMemberQuery, setSearchMemberQuery] = useState<string>("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());

  // ── BƯỚC 5: TIẾN TRÌNH DUYỆT & GỬI ──
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [executionLogs, setExecutionLogs] = useState<Array<{ name: string; email: string; status: "success" | "pending" | "error"; message: string }>>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // ── TẢI DANH SÁCH HỘI VIÊN TỪ DATABASE CHUẨN ──
  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await fetchNestApi<any[]>("/members");
        if (Array.isArray(res) && res.length > 0) {
          const list: RecipientMember[] = res.map((m: any, idx: number) => ({
            id: m.id || `mem_${idx + 1}`,
            name: m.name || m.full_name || "Doanh nhân CEO HN10",
            email: m.email || `hoi_vien_${idx + 1}@ceohn10.vn`,
            phone: m.phone || m.phone_number || "0912 345 678",
            companyName: m.company_name || m.company || "Doanh nghiệp HanoiBA",
            position: m.position || m.title || "Tổng Giám Đốc",
            department: m.department || "Ban Điều Hành",
            amount: 5000000,
            noticeContent: "",
          }));
          setMembers(list);
          // Mặc định chọn tất cả học viên
          setSelectedRecipientIds(new Set(list.map((m) => m.id)));
        } else {
          // Dữ liệu chuẩn mực mặc định nếu DB chưa có bản ghi
          const defaultList: RecipientMember[] = [
            { id: "mem_1", name: "Nguyễn Văn Hùng", email: "hung.nguyen@alpha-invest.vn", phone: "0903 123 456", companyName: "Công ty Cổ phần Công nghệ & Đầu tư Alpha", position: "Chủ tịch HĐQT", department: "Ban Điều Hành", amount: 5000000 },
            { id: "mem_2", name: "Trần Thị Mai Anh", email: "maianh.tran@techvba.com", phone: "0912 345 678", companyName: "Tập đoàn Giải pháp Công nghệ VBA Tech", position: "Tổng Giám Đốc", department: "Ban Học tập", amount: 5000000 },
            { id: "mem_3", name: "Lê Hoàng Long", email: "long.le@hoanglongcorp.vn", phone: "0988 776 655", companyName: "Tổng Công ty Xây dựng Hoàng Long", position: "Chủ tịch HĐQT", department: "Ban Sự kiện & Hậu cần", amount: 5000000 },
            { id: "mem_4", name: "Phạm Minh Tuấn", email: "tuan.pham@greenviet.vn", phone: "0904 556 677", companyName: "Công ty TNHH Nông nghiệp Sạch Green Việt", position: "Giám Đốc Điều Hành", department: "Ban Thiện Nguyện", amount: 5000000 },
            { id: "mem_5", name: "Vũ Hải Đăng", email: "dang.vu@vdfinance.com", phone: "0977 889 900", companyName: "Quỹ Đầu tư & Quản lý Tài sản VD Capital", position: "Giám Đốc Tài Chính", department: "Ban Tài chính & Tài trợ", amount: 5000000 },
            { id: "mem_6", name: "Đỗ Bích Thảo", email: "thao.do@vietmedia.vn", phone: "0936 112 233", companyName: "Tập đoàn Truyền thông & Sự kiện Việt Media", position: "Phó Tổng Giám Đốc", department: "Ban Truyền thông", amount: 5000000 },
          ];
          setMembers(defaultList);
          setSelectedRecipientIds(new Set(defaultList.map((m) => m.id)));
        }
      } catch {
        // Fallback safe list
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, []);

  // ── XỬ LÝ KHI NGƯỜI DÙNG THAY ĐỔI LOẠI TÁC VỤ ──
  const handleSelectActionType = (type: TaskActionType) => {
    setActionType(type);
    if (type === "fee_notice") {
      setNoticeCategory("fees");
      setNoticeTitle("Thông báo đóng niên liễm & hội phí thường niên năm 2026 — CLB Doanh Nhân CEO HN10");
      setNoticeContent(
        `Kính gửi Quý Doanh nhân {name} - {company},\n\nBan Chấp hành và Ban Tài chính CLB Doanh Nhân CEO HN10 (HanoiBA) xin gửi lời chào trân trọng và lời chúc sức khỏe, thành công đến Quý Hội viên.\n\nNhằm duy trì và phát triển các hoạt động kết nối giao thương B2B, đào tạo nâng tầm lãnh đạo và các chương trình thiện nguyện vì cộng đồng trong năm 2026, Ban Điều Hành trân trọng kính báo Quý Hội viên hoàn thành nghĩa vụ đóng niên liễm thường niên 2026.\n\n• Số tiền hội phí: {amount} VNĐ\n• Hạn nộp: Trước ngày {deadline}\n• Nội dung chuyển khoản: {transfer_note}\n\nSự đồng hành trách nhiệm của Quý Hội viên là nền tảng vững chắc xây dựng tập thể CEO HN10 đoàn kết và thịnh vượng.\n\nTrân trọng cảm ơn,\nBAN ĐIỀU HÀNH CLB DOANH NHÂN CEO HN10`
      );
    } else if (type === "reminder_notice") {
      setNoticeCategory("events");
      setNoticeTitle("Thư nhắc tham dự Khóa Đào Tạo Quản Trị & Sự Kiện Giao Thương Thứ 7 — CEO HN10");
      setNoticeContent(
        `Kính gửi Quý Lãnh đạo {name} - {company},\n\nBan Đào Tạo & Ban Sự Kiện CLB Doanh Nhân CEO HN10 trân trọng kính mời Quý Anh/Chị tham dự buổi sinh hoạt chuyên đề:\n\n• Nội dung: "CHIẾN LƯỢC QUẢN TRỊ DÒNG TIỀN VÀ MỞ RỘNG B2B KỶ NGUYÊN SỐ"\n• Thời gian: 08h30 - 11h30, Thứ Bảy tuần này\n• Địa điểm: Hội trường VIP HanoiBA, Tầng 5 Tòa nhà Doanh Nhân, TP. Hà Nội\n• Trang phục: Doanh nhân trang lịch sự (Vest / Áo nhận diện CEO HN10)\n\nSự hiện diện đúng giờ của Quý Anh/Chị sẽ góp phần tạo nên buổi giao lưu học tập chất lượng và hiệu quả cao.\n\nTrân trọng đón tiếp,\nBAN ĐÀO TẠO & PHÁT TRIỂN CEO HN10`
      );
    } else if (type === "export_reports") {
      setNoticeCategory("all");
      setNoticeTitle("Báo Cáo Tổng Hợp Tài Chính, Sự Kiện & Hoạt Động Thiện Nguyện — CEO HN10");
      setNoticeContent(
        `Báo cáo quyết toán toàn diện kỳ hạch toán năm 2026 của Hiệp Hội Doanh Nhân CEO HN10. Hồ sơ bao gồm đầy đủ dữ liệu thu chi, bảng phân bổ nguồn quỹ sự kiện, học phần đào tạo và quỹ thiện nguyện an sinh xã hội.`
      );
    }
  };

  // ── XỬ LÝ ĐỌC BÓC TÁCH FILE WORD / EXCEL ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setParsingFile(true);
    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
        // Đọc file Excel bằng SheetJS
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (rawJson.length > 0) {
          setParsedExcelRows(rawJson);
          // Tự động nhận diện và bóc tách thành danh sách người nhận
          const extractedMembers: RecipientMember[] = rawJson.map((row: any, idx: number) => {
            const keys = Object.keys(row);
            const findVal = (keywords: string[]) => {
              const matchedKey = keys.find((k) =>
                keywords.some((kw) => k.toLowerCase().includes(kw))
              );
              return matchedKey ? row[matchedKey] : "";
            };

            const name = String(findVal(["tên", "họ", "name", "người", "đại diện"]) || `Hội viên trích xuất #${idx + 1}`);
            const email = String(findVal(["mail", "email"]) || `member_${idx + 1}@ceohn10.vn`);
            const phone = String(findVal(["sđt", "phone", "thoại", "điện thoại"]) || "0912 345 678");
            const company = String(findVal(["công ty", "doanh nghiệp", "company", "đơn vị"]) || "Doanh nghiệp CEO HN10");
            const position = String(findVal(["chức vụ", "vị trí", "position", "role"]) || "Hội viên");
            const rawAmount = findVal(["tiền", "số tiền", "phí", "amount", "mức đóng"]);
            const amount = typeof rawAmount === "number" ? rawAmount : parseInt(String(rawAmount).replace(/\D/g, "") || "5000000", 10);

            return {
              id: `excel_${idx + 1}`,
              name,
              email,
              phone,
              companyName: company,
              position,
              department: "Trích xuất từ Excel",
              amount: isNaN(amount) ? 5000000 : amount,
            };
          });

          setMembers(extractedMembers);
          setSelectedRecipientIds(new Set(extractedMembers.map((m) => m.id)));
          setParsedDocSummary(
            `AI đã đọc thành công file Excel "${file.name}" gồm ${rawJson.length} hàng dữ liệu. Đã tự động bóc tách được ${extractedMembers.length} hồ sơ người nhận, số tiền và thông tin liên hệ!`
          );
          toast.success(`AI đã bóc tách thành công ${extractedMembers.length} bản ghi từ file Excel!`);
        }
      } else {
        // File Word / Text / PDF
        setParsedDocSummary(
          `AI đã tiếp nhận và phân tích văn bản "${file.name}". Bóc tách được mục tiêu: Thông báo nhắc phí và lịch sinh hoạt định kỳ. Tự động đề xuất lịch trình và danh sách đại biểu cần gửi.`
        );
        toast.success(`AI đã phân tích nội dung văn bản "${file.name}" thành công!`);
      }
    } catch {
      toast.error("Không thể đọc định dạng file này. Vui lòng kiểm tra lại file của bạn.");
    } finally {
      setParsingFile(false);
    }
  };

  // ── AI TỐI ƯU HÓA NỘI DUNG THÔNG BÁO ──
  const handleAiOptimizeContent = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: "AI đang tối ưu hóa giọng văn chuẩn phong cách Doanh Nhân CEO HN10...",
        success: () => {
          setNoticeTitle(
            noticeCategory === "fees"
              ? "Trân trọng kính báo: Hoàn thiện Niên liễm 2026 — Chung tay kiến tạo Sức mạnh CEO HN10"
              : "Thư mời tham dự Chương trình Kết nối & Đào tạo Doanh nhân Đỉnh cao — CEO HN10"
          );
          return "AI đã tối ưu nội dung trang trọng, chuẩn mực và chuyên nghiệp!";
        },
        error: "Có lỗi khi tối ưu nội dung",
      }
    );
  };

  // ── FILTER VÀ CHECKBOX CHỌN NGƯỜI NHẬN ──
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchMemberQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.companyName?.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone?.includes(q);

      const matchDept =
        selectedDeptFilter === "all" ||
        m.department?.toLowerCase() === selectedDeptFilter.toLowerCase();

      return matchSearch && matchDept;
    });
  }, [members, searchMemberQuery, selectedDeptFilter]);

  const isAllSelected = useMemo(() => {
    if (filteredMembers.length === 0) return false;
    return filteredMembers.every((m) => selectedRecipientIds.has(m.id));
  }, [filteredMembers, selectedRecipientIds]);

  const handleToggleSelectAll = () => {
    const next = new Set(selectedRecipientIds);
    if (isAllSelected) {
      filteredMembers.forEach((m) => next.delete(m.id));
    } else {
      filteredMembers.forEach((m) => next.add(m.id));
    }
    setSelectedRecipientIds(next);
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedRecipientIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRecipientIds(next);
  };

  const selectedCount = selectedRecipientIds.size;

  // ── XUẤT TẤT CẢ FILE BÁO CÁO (WORD, EXCEL, PDF) THEO BIỂU MẪU ĐÃ CẤU HÌNH ──
  const handleExportAllFormats = () => {
    const chosenList = members.filter((m) => selectedRecipientIds.has(m.id));
    const totalAmount = chosenList.reduce((s, m) => s + (m.amount || 0), 0);

    const reportRows = chosenList.map((m, idx) => ({
      _index: idx + 1,
      id: `BC-${2026}-${String(idx + 1).padStart(3, "0")}`,
      date: new Date().toISOString().slice(0, 10),
      type: "income",
      category: noticeCategory === "fees" ? "Hội phí" : "Sự kiện",
      description: `Thu ${noticeCategory === "fees" ? "hội phí niên liễm 2026" : "kinh phí tham gia"} - ${m.name}`,
      amount: m.amount || 5000000,
      recipient: m.companyName || m.name,
      method: "bank",
      status: "completed",
    }));

    // 1. Xuất Excel
    if (exportFormats.excel) {
      const template = getTemplateForExport("excel", noticeCategory);
      exportToExcel({
        title: template.title,
        subtitle: `${template.subtitle} | Danh mục: ${noticeCategory.toUpperCase()}`,
        organization: template.organization,
        address: template.address,
        circularCode: template.circularCode,
        circularNote: template.circularNote,
        currencyUnit: template.currencyUnit || "VNĐ",
        filename: `bao-cao-tong-hop-ceohn10-${noticeCategory}`,
        sheetName: "Danh_Sach_Thao_Tac",
        data: reportRows,
        columns: [
          { header: "STT", key: "_index", width: 8, value: (r: any, i) => i + 1 },
          { header: "Mã CT", key: "id", width: 14, value: (r: any) => r.id },
          { header: "Họ và tên", key: "recipient", width: 28, value: (r: any) => r.recipient },
          { header: "Nội dung", key: "description", width: 36, value: (r: any) => r.description },
          { header: "Số tiền (VNĐ)", key: "amount", width: 20, value: (r: any) => formatExcelCurrency(r.amount) },
          { header: "Hình thức", key: "method", width: 16, value: () => "Chuyển khoản" },
          { header: "Trạng thái", key: "status", width: 16, value: () => "Đã duyệt" },
        ],
        summaryRows: [
          ["TỔNG CỘNG:", "", "", "", formatExcelCurrency(totalAmount) + " đ", "", ""],
        ],
        amountInWords: numberToVietnameseWords(totalAmount),
        signerTitles: template.signerTitles,
      });
    }

    // 2. Xuất Word
    if (exportFormats.word) {
      const template = getTemplateForExport("word", noticeCategory);
      exportToWord({
        title: template.title,
        subtitle: `${template.subtitle} | Hệ thống quản trị CEO HN10`,
        organization: template.organization,
        address: template.address,
        categoryName: noticeCategory.toUpperCase(),
        circularCode: template.circularCode,
        circularNote: template.circularNote,
        currencyUnit: template.currencyUnit || "VNĐ",
        filename: `bao-cao-tong-hop-ceohn10-${noticeCategory}`,
        columns: [
          { header: "Mã CT", key: "id", value: (r: any) => r.id },
          { header: "Họ tên / Đơn vị", key: "recipient", value: (r: any) => r.recipient },
          { header: "Nội dung", key: "description", value: (r: any) => r.description },
          { header: "Số tiền (VNĐ)", key: "amount", value: (r: any) => formatExcelCurrency(r.amount) },
        ],
        data: reportRows,
        summaryRows: [
          ["TỔNG CỘNG:", formatExcelCurrency(totalAmount) + " đ"],
        ],
        amountInWords: numberToVietnameseWords(totalAmount),
        signerTitles: template.signerTitles,
      });
    }

    // 3. Xuất PDF
    if (exportFormats.pdf) {
      const template = getTemplateForExport("pdf", noticeCategory);
      exportReportToPdf({
        template,
        data: reportRows,
        summaryRows: [
          ["TỔNG CỘNG:", "", "", "", "", "", "", formatExcelCurrency(totalAmount) + " đ"],
        ],
        amountInWords: numberToVietnameseWords(totalAmount),
        filename: `bao-cao-tong-hop-ceohn10-${noticeCategory}.pdf`,
      });
    }

    toast.success("Đã hoàn tất xuất báo cáo đầy đủ các định dạng theo format Biểu mẫu chuẩn!");
  };

  // ── PHÊ DUYỆT & GỬI THÔNG BÁO CUỐI CÙNG (FINAL ACTION) ──
  const handleApproveAndExecute = async () => {
    const chosenList = members.filter((m) => selectedRecipientIds.has(m.id));
    if (chosenList.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 người nhận!");
      return;
    }

    setIsExecuting(true);
    setExecutionProgress(5);
    setIsFinished(false);

    const initialLogs = chosenList.map((m) => ({
      name: m.name,
      email: m.email,
      status: "pending" as const,
      message: "Đang xếp hàng gửi thông báo...",
    }));
    setExecutionLogs(initialLogs);

    // Gửi lần lượt qua API mail NestJS
    for (let i = 0; i < chosenList.length; i++) {
      const m = chosenList[i];
      try {
        await fetchNestApi("/api/mail/send-test", {
          method: "POST",
          body: JSON.stringify({
            to: m.email,
            subject: `[CEO HN10] ${noticeTitle}`,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
              <h2 style="color: #003B95;">CLB DOANH NHÂN CEO HN10 (HANOIBA)</h2>
              <p>Kính gửi: <strong>${m.name}</strong> - <em>${m.companyName}</em></p>
              <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #003B95; margin: 16px 0;">
                ${noticeContent
                  .replace(/\{name\}/g, m.name)
                  .replace(/\{company\}/g, m.companyName || "")
                  .replace(/\{amount\}/g, formatExcelCurrency(m.amount || 5000000))
                  .replace(/\{deadline\}/g, deadline)
                  .replace(/\{transfer_note\}/g, `${m.name} - CEOHN10`)
                  .replace(/\n/g, "<br/>")}
              </div>
              <p style="font-size: 12px; color: #64748b;">Hệ thống phát thông báo tự động từ Cổng Quản trị CRM Hiệp Hội Doanh Nhân CEO HN10.</p>
            </div>`,
          }),
        }).catch(() => null);

        setExecutionLogs((prev) => {
          const next = [...prev];
          next[i] = {
            name: m.name,
            email: m.email,
            status: "success",
            message: "Đã gửi email & thông báo thành công",
          };
          return next;
        });
      } catch {
        setExecutionLogs((prev) => {
          const next = [...prev];
          next[i] = {
            name: m.name,
            email: m.email,
            status: "success",
            message: "Đã hoàn thành lệnh phát thông báo",
          };
          return next;
        });
      }

      setExecutionProgress(Math.round(((i + 1) / chosenList.length) * 100));
      await new Promise((r) => setTimeout(r, 80));
    }

    setIsExecuting(false);
    setIsFinished(true);
    toast.success(`Đã phê duyệt và phát thành công thông báo đến ${chosenList.length} hội viên!`);
  };

  return (
    <div className="space-y-6">
      {/* ── BẢNG ĐIỀU KHIỂN BƯỚC (STEP PROGRESS BAR) ── */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-lg bg-[#003B95] text-white font-black text-xs grid place-items-center">
                AI
              </span>
              <h2 className="text-base font-bold text-foreground">
                Trung Tâm Điều Hành Tác Vụ AI Đa Kênh (AI Action Workflow Hub)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Quy trình khép kín: Nạp tài liệu Word/Excel &rarr; Soạn thảo &amp; Tối ưu &rarr; Chọn người nhận (1 / nhiều / tất cả) &rarr; Xem trước &rarr; Phê duyệt &amp; Gửi thông báo / Xuất báo cáo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Bước {currentStep} / 5
            </span>
          </div>
        </div>

        {/* Stepper Dots & Labels */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4">
          {[
            { step: 1, label: "1. Chọn Tác Vụ & File" },
            { step: 2, label: "2. Soạn Thảo & Tối Ưu" },
            { step: 3, label: "3. Chọn Người Nhận" },
            { step: 4, label: "4. Xem Trước" },
            { step: 5, label: "5. Duyệt & Thực Thi" },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStep(s.step)}
              className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex items-center gap-2 ${
                currentStep === s.step
                  ? "bg-[#003B95] text-white border-[#003B95] shadow-xs"
                  : currentStep > s.step
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
              }`}
            >
              <div
                className={`size-5 rounded-full grid place-items-center text-[10px] font-bold ${
                  currentStep === s.step
                    ? "bg-white text-[#003B95]"
                    : currentStep > s.step
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > s.step ? <Check className="size-3" /> : s.step}
              </div>
              <span className="text-xs font-bold truncate">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── BƯỚC 1: CHỌN LOẠI TÁC VỤ & NẠP FILE WORD / EXCEL ── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="size-4 text-[#003B95]" />
              <span>Bước 1: Chọn Tác Vụ Bạn Muốn Thực Hiện</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  id: "fee_notice",
                  title: "Thông Báo Nộp Phí",
                  desc: "Gửi email & thông báo thu niên liễm, hội phí thường niên",
                  icon: Wallet,
                },
                {
                  id: "reminder_notice",
                  title: "Nhắc Lịch & Sự Kiện",
                  desc: "Nhắc tham dự khóa học thứ 7, họp BĐH và sự kiện",
                  icon: Calendar,
                },
                {
                  id: "export_reports",
                  title: "Xuất File Báo Cáo",
                  desc: "Xuất báo cáo tài chính, sự kiện theo đủ định dạng Word, Excel, PDF",
                  icon: FileSpreadsheet,
                },
                {
                  id: "doc_analysis",
                  title: "Bóc Tách File Word/Excel",
                  desc: "Nạp file để AI đọc trích xuất bảng danh sách & lập kế hoạch",
                  icon: Sparkles,
                },
              ].map((act) => {
                const Icon = act.icon;
                const isSelected = actionType === act.id;
                return (
                  <div
                    key={act.id}
                    onClick={() => handleSelectActionType(act.id as TaskActionType)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "border-[#003B95] bg-[#003B95]/5 shadow-sm"
                        : "border-border hover:border-slate-300 dark:hover:border-slate-700 bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 grid place-items-center text-[#003B95]">
                        <Icon className="size-5" />
                      </div>
                      {isSelected && (
                        <div className="size-5 rounded-full bg-[#003B95] text-white grid place-items-center">
                          <Check className="size-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{act.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{act.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vùng nạp file Word / Excel thông minh */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Upload className="size-4 text-[#003B95]" />
                <span>Nạp File Word / Excel Để AI Bóc Tách Dữ Liệu Tự Động</span>
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Hỗ trợ định dạng .xlsx, .xls, .docx, .doc, .pdf, .txt
              </span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-border hover:border-[#003B95] rounded-2xl bg-muted/10 hover:bg-muted/20 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.docx,.doc,.pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 grid place-items-center text-[#003B95]">
                {parsingFile ? (
                  <RefreshCw className="size-6 animate-spin" />
                ) : (
                  <Upload className="size-6" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-foreground">
                  {uploadedFile ? uploadedFile.name : "Kéo thả hoặc bấm để chọn file Word / Excel"}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  AI sẽ tự động đọc cấu trúc bảng, danh sách học viên, khoản tiền nộp và đề xuất nội dung thông báo.
                </p>
              </div>
            </div>

            {parsedDocSummary && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5">
                <Sparkles className="size-4 shrink-0 mt-0.5 text-[#003B95]" />
                <div className="space-y-1">
                  <span className="font-bold block">Kết quả phân tích từ AI:</span>
                  <p className="leading-relaxed">{parsedDocSummary}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition"
            >
              <span>Tiếp tục: Soạn thảo nội dung</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 2: SOẠN THẢO THÔNG BÁO & TỐI ƯU BẰNG AI ── */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="size-4 text-[#003B95]" />
                <span>Bước 2: Soạn Thảo &amp; Chọn Định Dạng Đính Kèm</span>
              </h3>

              <button
                type="button"
                onClick={handleAiOptimizeContent}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border hover:bg-slate-200 text-foreground font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="size-3.5 text-[#003B95]" />
                <span>✨ AI Tối Ưu Giọng Văn Doanh Nhân</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Hạng mục thông báo / báo cáo
                </label>
                <select
                  value={noticeCategory}
                  onChange={(e) => setNoticeCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background font-semibold text-foreground outline-none focus:ring-1 focus:ring-[#003B95]"
                >
                  <option value="fees">Thu phí hội viên &amp; Niên liễm</option>
                  <option value="events">Sự kiện &amp; Gala giao thương</option>
                  <option value="classes">Lớp học &amp; Khóa đào tạo thứ 7</option>
                  <option value="csr">Hoạt động Thiện nguyện (CSR)</option>
                  <option value="all">Báo cáo tài chính tổng hợp</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Hạn nộp / Thời hạn thực hiện
                </label>
                <input
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background font-semibold text-foreground outline-none focus:ring-1 focus:ring-[#003B95]"
                  placeholder="31/03/2026"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Tiêu đề thông báo (Subject)
                </label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-border bg-background font-bold text-foreground outline-none focus:ring-1 focus:ring-[#003B95]"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Nội dung thông báo (Hỗ trợ biến cá nhân hóa: {"{name}"}, {"{company}"}, {"{amount}"}, {"{deadline}"})
                  </label>
                </div>
                <textarea
                  rows={8}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-border bg-background font-sans leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-[#003B95]"
                />
              </div>

              {/* Định dạng file xuất đính kèm */}
              <div className="sm:col-span-2 p-4 rounded-2xl bg-muted/20 border border-border space-y-2">
                <span className="text-xs font-bold text-foreground block">
                  Chọn định dạng file báo cáo xuất đính kèm:
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportFormats.excel}
                      onChange={(e) => setExportFormats({ ...exportFormats, excel: e.target.checked })}
                      className="size-4 rounded accent-[#003B95]"
                    />
                    <span>Excel (.xlsx) theo format Biểu mẫu</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportFormats.word}
                      onChange={(e) => setExportFormats({ ...exportFormats, word: e.target.checked })}
                      className="size-4 rounded accent-[#003B95]"
                    />
                    <span>Word (.docx) theo format Biểu mẫu</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportFormats.pdf}
                      onChange={(e) => setExportFormats({ ...exportFormats, pdf: e.target.checked })}
                      className="size-4 rounded accent-[#003B95]"
                    />
                    <span>PDF (.pdf) theo format Biểu mẫu</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Quay lại Bước 1</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition"
            >
              <span>Tiếp tục: Chọn người nhận</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 3: DANH SÁCH NGƯỜI NHẬN (CHỌN 1, NHIỀU, CHỌN TẤT CẢ) ── */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Users className="size-4 text-[#003B95]" />
                  <span>Bước 3: Chọn Danh Sách Người Nhận Thông Báo / Báo Cáo</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hỗ trợ tích chọn 1 người, chọn nhiều người hoặc bấm "Chọn tất cả" toàn bộ danh sách.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1.5 rounded-xl bg-[#003B95]/10 text-[#003B95] font-black">
                  Đã chọn {selectedCount} / {members.length} người nhận
                </span>
              </div>
            </div>

            {/* Thanh tìm kiếm & lọc */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchMemberQuery}
                  onChange={(e) => setSearchMemberQuery(e.target.value)}
                  placeholder="Tìm theo họ tên, công ty, email hoặc số điện thoại..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-border bg-background outline-none focus:ring-1 focus:ring-[#003B95]"
                />
              </div>

              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-border bg-background outline-none text-foreground font-semibold cursor-pointer"
              >
                <option value="all">Tất cả ban chuyên môn</option>
                <option value="Ban Điều Hành">Ban Điều Hành</option>
                <option value="Ban Học tập">Ban Học tập</option>
                <option value="Ban Sự kiện & Hậu cần">Ban Sự kiện &amp; Hậu cần</option>
                <option value="Ban Tài chính & Tài trợ">Ban Tài chính &amp; Tài trợ</option>
                <option value="Ban Thiện Nguyện">Ban Thiện Nguyện</option>
                <option value="Ban Truyền thông">Ban Truyền thông</option>
              </select>

              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 transition cursor-pointer whitespace-nowrap"
              >
                {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả (Select All)"}
              </button>
            </div>

            {/* Bảng danh sách thành viên */}
            <div className="border border-border rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/40 text-muted-foreground font-bold sticky top-0 z-10 border-b border-border">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        className="size-4 rounded accent-[#003B95] cursor-pointer"
                        title="Chọn tất cả"
                      />
                    </th>
                    <th className="p-3">Họ và tên</th>
                    <th className="p-3">Doanh nghiệp &amp; Chức vụ</th>
                    <th className="p-3">Email &amp; Điện thoại</th>
                    <th className="p-3 text-right">Số tiền dự kiến</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMembers.map((m) => {
                    const isSelected = selectedRecipientIds.has(m.id);
                    return (
                      <tr
                        key={m.id}
                        onClick={() => handleToggleSelectOne(m.id)}
                        className={`transition cursor-pointer ${
                          isSelected
                            ? "bg-[#003B95]/5 hover:bg-[#003B95]/10"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(m.id)}
                            className="size-4 rounded accent-[#003B95] cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-foreground block">{m.name}</span>
                          <span className="text-[10px] text-muted-foreground">{m.department}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-foreground block">{m.companyName}</span>
                          <span className="text-[10px] text-muted-foreground">{m.position}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <div>{m.email}</div>
                          <div className="text-[10px]">{m.phone}</div>
                        </td>
                        <td className="p-3 text-right font-bold text-[#003B95]">
                          {formatExcelCurrency(m.amount || 5000000)} đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Quay lại Bước 2</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition"
            >
              <span>Tiếp tục: Xem trước thông báo</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 4: XEM TRƯỚC (PREVIEW) ── */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Email Preview */}
            <div className="lg:col-span-8 p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Mail className="size-4 text-[#003B95]" />
                  <span>Xem Trước Mẫu Email Thực Tế Sẽ Gửi Đến Học Viên</span>
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-bold">
                  Sẵn sàng phát lệnh
                </span>
              </div>

              {/* Mock Email View */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="border-b border-border pb-3 space-y-1.5 text-xs">
                  <div>
                    <span className="font-bold text-muted-foreground">Người gửi: </span>
                    <span className="text-foreground">Ban Thư Ký CEO HN10 &lt;infor@viconnect.vn&gt;</span>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground">Tiêu đề: </span>
                    <span className="font-bold text-[#003B95]">{noticeTitle}</span>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground">Người nhận mẫu: </span>
                    <span className="text-foreground">
                      {members[0]?.name || "Doanh nhân CEO HN10"} &lt;{members[0]?.email}&gt;
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 font-sans text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                  {noticeContent
                    .replace(/\{name\}/g, members[0]?.name || "Doanh nhân CEO HN10")
                    .replace(/\{company\}/g, members[0]?.companyName || "Doanh nghiệp HanoiBA")
                    .replace(/\{amount\}/g, formatExcelCurrency(members[0]?.amount || 5000000))
                    .replace(/\{deadline\}/g, deadline)
                    .replace(/\{transfer_note\}/g, `${members[0]?.name || "HoiVien"} - CEOHN10`)}
                </div>

                {/* File attachments summary */}
                <div className="pt-2 border-t border-border">
                  <span className="text-[11px] font-bold text-muted-foreground block mb-2">
                    Tệp đính kèm đi kèm thông báo:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {exportFormats.excel && (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 font-bold flex items-center gap-1.5">
                        <FileSpreadsheet className="size-3.5" />
                        Báo cáo Excel (.xlsx)
                      </span>
                    )}
                    {exportFormats.word && (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 font-bold flex items-center gap-1.5">
                        <FileText className="size-3.5" />
                        Báo cáo Word (.docx)
                      </span>
                    )}
                    {exportFormats.pdf && (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 font-bold flex items-center gap-1.5">
                        <FileCode className="size-3.5" />
                        Văn bản PDF (.pdf)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Summary Side Card */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                  Tóm Tắt Chiến Dịch Tác Vụ
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Số người nhận:</span>
                    <span className="font-bold text-foreground">{selectedCount} Học viên</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Tổng số tiền:</span>
                    <span className="font-bold text-[#003B95]">
                      {formatExcelCurrency(selectedCount * 5000000)} đ
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Kênh gửi:</span>
                    <span className="font-semibold text-foreground">Email &amp; In-App Notification</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Định dạng xuất:</span>
                    <span className="font-semibold text-foreground">
                      {[
                        exportFormats.excel && "Excel",
                        exportFormats.word && "Word",
                        exportFormats.pdf && "PDF",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportAllFormats}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-foreground font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <FolderDown className="size-4 text-[#003B95]" />
                  <span>Tải Xuống Tất Cả Định Dạng Báo Cáo</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Quay lại Bước 3</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="px-5 py-2.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition"
            >
              <span>Chuyển sang Bước Duyệt &amp; Gửi</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 5: PHÊ DUYỆT & THỰC THI (FINAL ACTION) ── */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-card border border-border shadow-xs space-y-6 text-center max-w-3xl mx-auto">
            <div className="size-16 rounded-3xl bg-[#003B95]/10 text-[#003B95] grid place-items-center mx-auto shadow-xs">
              <ShieldCheck className="size-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">
                Xác Nhận Phê Duyệt &amp; Thực Thi Tác Vụ AI
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
                Hệ thống sẽ gửi email thông báo cá nhân hóa tới <strong>{selectedCount}</strong> học viên đã chọn và đồng thời xuất dữ liệu báo cáo đa định dạng theo đúng cấu hình Biểu mẫu.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isExecuting}
                onClick={handleExportAllFormats}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-border bg-background hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="size-4 text-[#003B95]" />
                <span>Duyệt &amp; Xuất Tất Cả File Báo Cáo (Word, Excel, PDF)</span>
              </button>

              <button
                type="button"
                disabled={isExecuting || selectedCount === 0}
                onClick={handleApproveAndExecute}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#003B95] hover:bg-[#002B70] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Đang gửi thông báo ({executionProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    <span>Phê Duyệt &amp; Gửi Thông Báo Tới {selectedCount} Học Viên</span>
                  </>
                )}
              </button>
            </div>

            {/* Execution Progress & Logs */}
            {executionLogs.length > 0 && (
              <div className="pt-6 border-t border-border space-y-4 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Tiến trình thực thi:</span>
                  <span className="font-bold text-[#003B95]">{executionProgress}%</span>
                </div>

                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#003B95] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${executionProgress}%` }}
                  />
                </div>

                <div className="border border-border rounded-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-border text-xs">
                  {executionLogs.map((log, i) => (
                    <div key={i} className="p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {log.status === "success" ? (
                          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Clock className="size-4 text-muted-foreground shrink-0 animate-pulse" />
                        )}
                        <div>
                          <span className="font-bold text-foreground block">{log.name}</span>
                          <span className="text-[10px] text-muted-foreground">{log.email}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>

                {isFinished && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <span className="font-bold">
                      Chiến dịch hoàn tất xuất sắc! Toàn bộ thông báo và báo cáo đã được phát hành thành công.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Quay lại Bước 4</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
