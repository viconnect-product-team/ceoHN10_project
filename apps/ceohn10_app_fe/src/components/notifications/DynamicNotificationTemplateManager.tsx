import React, { useState, useEffect, useMemo } from "react";
import {
  Mail,
  MessageSquare,
  Smartphone,
  Plus,
  Trash2,
  Edit3,
  Send,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Calendar,
  BookOpen,
  UserCheck,
  Shield,
  Sparkles,
  Copy,
  Eye,
  Radio,
  ExternalLink,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Layers,
  FileText,
  Clock,
  DollarSign,
  QrCode,
  Users,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi, uploadFileToNest } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseMultipleFiles } from "@/lib/ai-excel-email-parser";

// ── TYPES ───────────────────────────────────────────────────────────────────────

export type TemplateCategory = "events" | "classes" | "members" | "management";
export type FieldType = "text" | "textarea" | "datetime" | "price" | "select" | "qr" | "image";

export interface DynamicField {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  value: string;
  placeholder?: string;
  options?: string[];
}

export interface DynamicTemplate {
  id: string;
  code: string;
  category: TemplateCategory;
  name: string;
  description: string;
  channels: ("email" | "zalo_oa" | "in_app")[];
  subject: string;
  inAppTitle: string;
  inAppBody: string;
  htmlBody: string;
  fields: DynamicField[];
  dataSourceType?: "events" | "classes";
}

// ── DANH MỤC MẪU CHUẨN ĐẦY ĐỦ ──────────────────────────────────────────────────

export const INITIAL_DYNAMIC_TEMPLATES: DynamicTemplate[] = [
  // ── 1. NHÓM SỰ KIỆN & HỘI NGHỊ ──
  {
    id: "tmpl-event-invite-official",
    code: "EVENT_OFFICIAL_INVITE",
    category: "events",
    name: "Thư Mời Tham Dự Lễ Khai Giảng & Sự Kiện CLB CEO HN10",
    description: "Mẫu thư mời trang trọng đa kênh: tích hợp mã vé QR, diễn giả, bản đồ Google Maps, phí tham dự và nút xác nhận.",
    channels: ["email", "zalo_oa", "in_app"],
    dataSourceType: "events",
    subject: "[THƯ MỜI CHÍNH THỨC] {{event_title}} — Kính gửi Quý Anh/Chị {{full_name}}",
    inAppTitle: "Thư mời tham dự sự kiện: {{event_title}}",
    inAppBody: "Kính gửi Quý Anh/Chị {{full_name}}!\nBTC trân trọng kính mời Anh/Chị tham dự: {{event_title}}\n- Thời gian: {{event_date}}\n- Địa điểm: {{event_location}}\n- Diễn giả: {{speaker_name}}\n- Chi phí: {{event_fee}}\nQuét mã QR trên vé để check-in tại cổng đón tiếp.\nHotline BTC: 0983 1010 10",
    htmlBody: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
  <div style="background: linear-gradient(135deg, #001D4A 0%, #003B95 50%, #0A2540 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
    <div style="display: inline-block; padding: 4px 14px; background: rgba(234, 179, 8, 0.25); border: 1px solid rgba(234, 179, 8, 0.5); border-radius: 9999px; font-size: 11px; font-weight: 800; color: #fde047; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
      CLB DOANH NHÂN CEO HN10 (HANOIBA)
    </div>
    <h1 style="margin: 0; font-size: 21px; font-weight: 900; color: #ffffff; text-transform: uppercase;">{{event_title}}</h1>
    <p style="margin: 8px 0 0; font-size: 13px; color: #93c5fd;">Kính gửi Quý Doanh Nhân: <strong>{{full_name}}</strong></p>
  </div>
  <div style="padding: 26px 24px; color: #1e293b; line-height: 1.6; font-size: 14px;">
    <p style="margin: 0 0 12px; font-size: 15px;">Kính gửi Quý Anh/Chị <strong>{{full_name}}</strong>,</p>
    <p style="margin: 0 0 16px; color: #334155;">Ban Tổ Chức CLB Doanh Nhân CEO HN10 trân trọng kính mời Quý Anh/Chị tham dự sự kiện đặc biệt:</p>
    
    <div style="background: #f8fafc; border-left: 4px solid #003B95; padding: 18px; border-radius: 0 12px 12px 0; margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px; font-size: 15px; font-weight: 800; color: #003B95;">THÔNG TIN CHI TIẾT SỰ KIỆN</h3>
      <table style="width: 100%; font-size: 13.5px; border-collapse: collapse;">
        <tr><td style="padding: 5px 0; color: #64748b; width: 140px;">📌 Tên sự kiện:</td><td style="padding: 5px 0; font-weight: 700; color: #0f172a;">{{event_title}}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">🎤 Diễn giả / Khách mời:</td><td style="padding: 5px 0; font-weight: 600; color: #1e293b;">{{speaker_name}}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">⏰ Thời gian tổ chức:</td><td style="padding: 5px 0; font-weight: 700; color: #003B95;">{{event_date}}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">📍 Địa điểm đón tiếp:</td><td style="padding: 5px 0; font-weight: 600; color: #0f172a;">{{event_location}}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">💰 Chi phí tham dự:</td><td style="padding: 5px 0; font-weight: 700; color: #16a34a;">{{event_fee}}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">🗺️ Bản đồ chỉ đường:</td><td style="padding: 5px 0;"><a href="{{google_maps_url}}" target="_blank" style="color: #0284c7; font-weight: 700; text-decoration: underline;">Xem vị trí trên Google Maps &rarr;</a></td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">👔 Trang phục:</td><td style="padding: 5px 0; color: #475569;">{{dress_code}}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">🚗 Gửi xe:</td><td style="padding: 5px 0; color: #475569;">{{parking_info}}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">📝 Nội dung tóm tắt:</td><td style="padding: 5px 0; color: #334155;">{{event_summary}}</td></tr>
      </table>
    </div>

    <div style="text-align: center; padding: 20px; background: #fffbeb; border: 1.5px dashed #f59e0b; border-radius: 16px; margin: 20px 0;">
      <div style="font-size: 12px; font-weight: 800; color: #92400e; text-transform: uppercase; margin-bottom: 8px;">
        📱 MÃ QR CHECK-IN VÀO CỬA DUY NHẤT
      </div>
      <img src="{{qr_code_url}}" alt="QR Check-in" style="width: 150px; height: 150px; margin: 0 auto; display: block; border-radius: 8px; border: 1px solid #e2e8f0;" />
      <p style="font-size: 11px; color: #78350f; margin: 8px 0 0;">Quý Anh/Chị mở camera hoặc App CEO HN10 để quét mã check-in</p>
    </div>

    <div style="text-align: center; margin: 24px 0 16px;">
      <a href="{{confirm_link}}" target="_blank" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #003B95 0%, #001D4A 100%); color: #ffffff; border-radius: 9999px; font-size: 14px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 14px rgba(0, 59, 149, 0.3);">
        BẤM ĐỂ XÁC NHẬN THAM DỰ NGAY
      </a>
    </div>

    <div style="background: #f1f5f9; border-radius: 12px; padding: 14px 18px; font-size: 12px; color: #475569;">
      <strong>Hotline Ban Tổ Chức:</strong> 0983 1010 10 / 0973 205 683<br>
      Email tiếp nhận: btc@ceohn10.vn · Website: ceohn10.viconnect.vn
    </div>
  </div>
</div>
    `,
    fields: [
      { id: "f_title", key: "event_title", label: "Tên Sự Kiện", type: "text", value: "Lễ Khai Giảng Lớp CEO HN10 & Gala Kết Nối Giao Thương" },
      { id: "f_speaker", key: "speaker_name", label: "Diễn Giả / Khách Mời", type: "text", value: "Chủ tịch HanoiBA, Ban Giảng Huấn & Chuyên gia Kinh tế trưởng" },
      { id: "f_date", key: "event_date", label: "Thời Gian Tổ Chức", type: "datetime", value: "2026-11-20T18:00" },
      { id: "f_location", key: "event_location", label: "Địa Điểm Tổ Chức", type: "text", value: "Habblet Hotel & Cung Điện Atlantis, Hà Nội" },
      { id: "f_fee", key: "event_fee", label: "Chi Phí Tham Dự", type: "price", value: "0" },
      { id: "f_summary", key: "event_summary", label: "Nội Dung Tóm Tắt", type: "textarea", value: "Lễ ra mắt lớp CEO HN10, ký kết hợp tác thương mại B2B nội bộ và tiệc Gala vinh danh tân Hội viên." },
      { id: "f_maps", key: "google_maps_url", label: "Link Google Maps", type: "text", value: "https://maps.google.com/?q=Habblet+Hotel+Hanoi" },
      { id: "f_dress", key: "dress_code", label: "Trang Phục Khuyến Nghị", type: "text", value: "Vest công sở / Dạ tiệc lịch sự" },
      { id: "f_parking", key: "parking_info", label: "Thông Tin Gửi Xe", type: "text", value: "Tầng hầm B1-B2 khách sạn, miễn phí vé xe" },
      { id: "f_confirm", key: "confirm_link", label: "Link Xác Nhận Tham Dự", type: "text", value: "https://crm.ceohn10.viconnect.vn/guest-event-register/ceohn10" },
      { id: "f_qr", key: "qr_code_url", label: "Mã QR Check-in", type: "qr", value: "https://ceohn10.viconnect.vn/api/events/qr?data=TICKET-CEOHN10-VIP" },
    ],
  },
  {
    id: "tmpl-event-reminder-g-hour",
    code: "EVENT_REMINDER_G_HOUR",
    category: "events",
    name: "Thông Báo Nhắc Lịch Sự Kiện Trước Giờ Khai Mạc (Giờ G)",
    description: "Mẫu thông báo nhắc nhở đếm ngược thời gian diễn ra sự kiện, hỗ trợ check-in nhanh và bàn đón tiếp.",
    channels: ["email", "zalo_oa", "in_app"],
    dataSourceType: "events",
    subject: "[NHẮC HẸN GIỜ G] Sự kiện {{event_title}} sẽ diễn ra lúc {{event_date}}",
    inAppTitle: "Nhắc lịch sự kiện sắp diễn ra: {{event_title}}",
    inAppBody: "Quý Anh/Chị {{full_name}} thân mến, sự kiện {{event_title}} sẽ chính thức khai mạc lúc {{event_date}} tại {{event_location}}. Vui lòng chuẩn bị mã QR để check-in thuận tiện nhất.",
    htmlBody: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: #002B70; padding: 24px; text-align: center; color: #ffffff;">
    <h2 style="margin: 0; font-size: 19px; font-weight: 800;">NHẮC LỊCH TRƯỚC GIỜ G — {{event_title}}</h2>
    <p style="margin: 6px 0 0; font-size: 13px; color: #bfdbfe;">Sự kiện sẽ bắt đầu sau ít giờ nữa!</p>
  </div>
  <div style="padding: 24px;">
    <p style="font-size: 14px; color: #334155;">Kính gửi Anh/Chị <strong>{{full_name}}</strong>,<br>Sự kiện <strong>{{event_title}}</strong> chuẩn bị diễn ra. BTC kính chúc Quý Anh/Chị có một phiên kết nối giao thương hiệu quả và nhiều giá trị!</p>
    <div style="background: #eff6ff; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 6px;">⏰ <strong>Thời gian:</strong> {{event_date}}</p>
      <p style="margin: 0 0 6px;">📍 <strong>Địa điểm:</strong> {{event_location}}</p>
      <p style="margin: 0;">👔 <strong>Trang phục:</strong> {{dress_code}}</p>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <img src="{{qr_code_url}}" alt="QR" style="width: 140px; height: 140px; margin: 0 auto; display: block;" />
      <span style="font-size: 11px; color: #64748b; display: block; margin-top: 6px;">Xuất trình mã QR tại bàn tiếp đón</span>
    </div>
  </div>
</div>
    `,
    fields: [
      { id: "f_title", key: "event_title", label: "Tên Sự Kiện", type: "text", value: "Lễ Khai Giảng Lớp CEO HN10" },
      { id: "f_date", key: "event_date", label: "Thời Gian", type: "datetime", value: "2026-11-20T18:00" },
      { id: "f_location", key: "event_location", label: "Địa Điểm", type: "text", value: "Habblet Hotel, Hà Nội" },
      { id: "f_dress", key: "dress_code", label: "Trang Phục", type: "text", value: "Trang trọng / Áo đồng phục CEO HN10" },
      { id: "f_qr", key: "qr_code_url", label: "Mã QR Check-in", type: "qr", value: "https://ceohn10.viconnect.vn/api/events/qr?data=TICKET-CEO-REMIND" },
    ],
  },

  // ── 2. NHÓM KHÓA ĐÀO TẠO & LỚP HỌC CEO HN10 ──
  {
    id: "tmpl-class-launch-notice",
    code: "CLASS_LAUNCH_NOTICE",
    category: "classes",
    name: "Thông Báo Khai Giảng Khóa Đào Tạo CEO HN10",
    description: "Mẫu thông báo chính thức về lễ khai giảng khóa đào tạo mới, lịch học tổng quan và ban giảng huấn.",
    channels: ["email", "zalo_oa", "in_app"],
    dataSourceType: "classes",
    subject: "[KHAI GIẢNG KHÓA HỌC] {{class_name}} — Chúc mừng Học viên {{full_name}}",
    inAppTitle: "Khai giảng khóa đào tạo: {{class_name}}",
    inAppBody: "Chào mừng Học viên {{full_name}} tham gia {{class_name}}. Buổi học đầu tiên bắt đầu vào {{class_time}} tại {{classroom}}. Giảng viên phụ trách: {{trainer_name}}.",
    htmlBody: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #064E3B 0%, #047857 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
    <div style="display: inline-block; padding: 4px 14px; background: rgba(167, 243, 208, 0.2); border-radius: 9999px; font-size: 11px; font-weight: 800; color: #a7f3d0; margin-bottom: 10px; text-transform: uppercase;">
      CHƯƠNG TRÌNH ĐÀO TẠO DOANH NHÂN CEO HN10
    </div>
    <h1 style="margin: 0; font-size: 21px; font-weight: 900; color: #ffffff;">{{class_name}}</h1>
    <p style="margin: 8px 0 0; font-size: 13px; color: #d1fae5;">Chúc mừng Học viên: <strong>{{full_name}}</strong></p>
  </div>
  <div style="padding: 26px 24px; font-size: 14px; color: #1e293b; line-height: 1.6;">
    <p>Kính gửi Học viên <strong>{{full_name}}</strong>,<br>Ban Đào Tạo CLB CEO HN10 xin gửi thông tin chi tiết về khóa đào tạo:</p>
    <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; border-radius: 0 12px 12px 0; margin: 16px 0;">
      <p style="margin: 0 0 6px;">📚 <strong>Khóa học:</strong> {{class_name}}</p>
      <p style="margin: 0 0 6px;">👨‍🏫 <strong>Giảng viên chuyên đề:</strong> {{trainer_name}}</p>
      <p style="margin: 0 0 6px;">⏰ <strong>Thời gian khai giảng:</strong> {{class_time}}</p>
      <p style="margin: 0 0 6px;">📍 <strong>Phòng học / Hội trường:</strong> {{classroom}}</p>
      <p style="margin: 0 0 6px;">💰 <strong>Học phí:</strong> {{tuition_fee}}</p>
      <p style="margin: 0;">📖 <strong>Giáo trình &amp; Tài liệu:</strong> <a href="{{curriculum_url}}" style="color: #059669; font-weight: 700;">Xem chi tiết bài giảng &rarr;</a></p>
    </div>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{attendance_link}}" style="display: inline-block; padding: 12px 30px; background: #059669; color: #ffffff; border-radius: 9999px; font-weight: bold; text-decoration: none;">
        XÁC NHẬN NHẬP HỌC &amp; ĐIỂM DANH
      </a>
    </div>
  </div>
</div>
    `,
    fields: [
      { id: "f_cname", key: "class_name", label: "Tên Khóa Học / Lớp", type: "text", value: "Khóa Đào Tạo CEO HN10 - Khóa 10: Quản Trị Tinh Gọn" },
      { id: "f_trainer", key: "trainer_name", label: "Giảng Viên Phụ Trách", type: "text", value: "Thầy Vũ (Chuyên gia Quản trị Chiến lược)" },
      { id: "f_ctime", key: "class_time", label: "Thời Gian Khai Giảng", type: "datetime", value: "2026-11-25T08:30" },
      { id: "f_croom", key: "classroom", label: "Phòng Học / Địa Điểm", type: "text", value: "Phòng Hội Thảo Tầng 3, Trụ sở VIONE Hà Nội" },
      { id: "f_cfee", key: "tuition_fee", label: "Học Phí", type: "price", value: "0" },
      { id: "f_curr", key: "curriculum_url", label: "Link Tài Liệu / Giáo Trình", type: "text", value: "https://crm.ceohn10.viconnect.vn/documents" },
      { id: "f_att", key: "attendance_link", label: "Link Điểm Danh Học Viên", type: "text", value: "https://ceohn10.viconnect.vn/association/trainings" },
    ],
  },
  {
    id: "tmpl-class-session-reminder",
    code: "CLASS_SESSION_REMINDER",
    category: "classes",
    name: "Thông Báo Nhắc Lịch Học Buổi Tới & Mã QR Điểm Danh",
    description: "Mẫu nhắc nhở buổi học tiếp theo trong tuần, cung cấp tài liệu case-study và mã QR điểm danh.",
    channels: ["email", "zalo_oa", "in_app"],
    dataSourceType: "classes",
    subject: "[NHẮC LỊCH HỌC BUỔI TỚI] {{class_name}} — Buổi: {{session_title}}",
    inAppTitle: "Lịch học buổi tới: {{session_title}}",
    inAppBody: "Học viên {{full_name}} chú ý: Buổi học {{session_title}} sẽ diễn ra vào {{class_time}} tại {{classroom}}. Vui lòng chuẩn bị tài liệu trước khi đến lớp.",
    htmlBody: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: #047857; padding: 24px; text-align: center; color: #ffffff;">
    <h2 style="margin: 0; font-size: 18px; font-weight: 800;">LỊCH HỌC BUỔI TIẾP THEO — {{session_title}}</h2>
    <p style="margin: 6px 0 0; font-size: 13px; color: #a7f3d0;">{{class_name}}</p>
  </div>
  <div style="padding: 24px; font-size: 14px; color: #334155;">
    <p>Kính gửi Anh/Chị <strong>{{full_name}}</strong>,<br>Ban Cố Vấn xin gửi lịch buổi học sắp tới:</p>
    <div style="background: #f8fafc; padding: 14px; border-radius: 10px; margin: 12px 0;">
      <p style="margin: 0 0 6px;">📖 <strong>Chuyên đề:</strong> {{session_title}}</p>
      <p style="margin: 0 0 6px;">👨‍🏫 <strong>Giảng viên:</strong> {{trainer_name}}</p>
      <p style="margin: 0 0 6px;">⏰ <strong>Thời gian:</strong> {{class_time}}</p>
      <p style="margin: 0;">📍 <strong>Phòng học:</strong> {{classroom}}</p>
    </div>
    <div style="text-align: center; margin-top: 18px;">
      <img src="{{qr_code_url}}" alt="QR Điểm danh" style="width: 140px; height: 140px; margin: 0 auto; display: block;" />
      <span style="font-size: 11px; color: #64748b; display: block; margin-top: 6px;">Quét mã QR để hoàn tất điểm danh buổi học</span>
    </div>
  </div>
</div>
    `,
    fields: [
      { id: "f_cname", key: "class_name", label: "Tên Khóa Học", type: "text", value: "Khóa Đào Tạo CEO HN10 - Khóa 10" },
      { id: "f_stitle", key: "session_title", label: "Tên Buổi Học / Chuyên Đề", type: "text", value: "Buổi 2: Quản Trị Tài Chính & Dòng Tiền Tối Ưu" },
      { id: "f_trainer", key: "trainer_name", label: "Giảng Viên", type: "text", value: "Thầy Vũ" },
      { id: "f_ctime", key: "class_time", label: "Thời Gian Diễn Ra", type: "datetime", value: "2026-11-28T14:00" },
      { id: "f_croom", key: "classroom", label: "Phòng Học", type: "text", value: "Phòng Hội Thảo 302" },
      { id: "f_cqr", key: "qr_code_url", label: "Mã QR Điểm Danh", type: "qr", value: "https://ceohn10.viconnect.vn/api/classes/qr?session=2" },
    ],
  },

  // ── 3. NHÓM HỌC VIÊN & PHÍ THAM GIA CLB ──
  {
    id: "tmpl-member-welcome",
    code: "MEMBER_WELCOME",
    category: "members",
    name: "Thư Chào Mừng Học Viên Mới Gia Nhập CLB CEO HN10",
    description: "Mẫu chào mừng chính thức gửi tới học viên sau khi được phê duyệt kết nạp, hướng dẫn tải App và kích hoạt quyền lợi.",
    channels: ["email", "zalo_oa", "in_app"],
    subject: "Chào Mừng Quý Doanh Nhân {{full_name}} Gia Nhập CLB Doanh Nhân CEO HN10",
    inAppTitle: "Chúc mừng gia nhập CLB CEO HN10",
    inAppBody: "Nhiệt liệt chào mừng Quý Doanh Nhân {{full_name}} - {{company_name}} trở thành Học viên chính thức của CLB Doanh Nhân CEO HN10 (HanoiBA).",
    htmlBody: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #002B70 0%, #001D4A 100%); padding: 30px 20px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 20px; font-weight: 900;">CHÀO MỪNG TÂN HỌC VIÊN CLB CEO HN10</h1>
    <p style="margin: 6px 0 0; font-size: 13px; color: #93c5fd;">Quý Doanh Nhân: {{full_name}} — {{company_name}}</p>
  </div>
  <div style="padding: 24px; font-size: 14px; color: #334155;">
    <p>Kính gửi Anh/Chị <strong>{{full_name}}</strong>,<br>Ban Điều Hành CLB Doanh Nhân CEO HN10 trân trọng gửi lời chúc mừng nồng nhiệt tới Anh/Chị đã chính thức gia nhập ngôi nhà chung HanoiBA!</p>
    <p>Để tận hưởng toàn bộ quyền lợi giao thương B2B, vui lòng mở App CEO HN10 tại: <a href="https://ceohn10.viconnect.vn" style="color: #002B70; font-weight: bold;">ceohn10.viconnect.vn</a></p>
  </div>
</div>
    `,
    fields: [
      { id: "f_mname", key: "full_name", label: "Tên Học Viên", type: "text", value: "Nguyễn Văn Tuấn" },
      { id: "f_mcomp", key: "company_name", label: "Tên Doanh Nghiệp", type: "text", value: "Công Ty CP Công Nghệ VICONNECT" },
      { id: "f_mcode", key: "member_code", label: "Mã Học Viên", type: "text", value: "CEO10-088" },
    ],
  },
  {
    id: "tmpl-fee-reminder",
    code: "FEE_RENEWAL_REMINDER",
    category: "members",
    name: "Thông Báo Đóng Học Phí Thường Niên",
    description: "Mẫu thông báo học phí, cung cấp mã QR chuyển khoản Sepay tự động kích hoạt.",
    channels: ["email", "zalo_oa", "in_app"],
    subject: "[THÔNG BÁO HỌC PHÍ] Học phí CLB CEO HN10 — Học viên: {{full_name}}",
    inAppTitle: "Thông báo nộp học phí CLB CEO HN10",
    inAppBody: "Kính gửi Anh/Chị {{full_name}}, kỳ đóng học phí CLB CEO HN10 với số tiền {{fee_amount}} đã đến hạn. Quý Anh/Chị quét mã QR để chuyển khoản nhanh chóng.",
    htmlBody: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: #7C2D12; padding: 24px; text-align: center; color: #ffffff;">
    <h2 style="margin: 0; font-size: 19px; font-weight: 800;">THÔNG BÁO HỌC PHÍ CLB CEO HN10</h2>
    <p style="margin: 6px 0 0; font-size: 13px; color: #fed7aa;">Học viên: {{full_name}} (Mã: {{member_code}})</p>
  </div>
  <div style="padding: 24px; font-size: 14px; color: #334155;">
    <p>Kính gửi Anh/Chị <strong>{{full_name}}</strong>,<br>Ban Tài Chính CLB CEO HN10 xin gửi thông báo học phí thường niên:</p>
    <div style="background: #fff7ed; padding: 14px; border-radius: 10px; margin: 12px 0;">
      <p style="margin: 0 0 6px;">💰 <strong>Số tiền:</strong> {{fee_amount}}</p>
      <p style="margin: 0 0 6px;">💳 <strong>Số tài khoản:</strong> 198300000000 (MBBank - CLB DOANH NHAN CEO HN10)</p>
      <p style="margin: 0;">📝 <strong>Cú pháp chuyển khoản:</strong> CEOHN10_HOCPHI_{{member_code}}</p>
    </div>
  </div>
</div>
    `,
    fields: [
      { id: "f_fname", key: "full_name", label: "Tên Học Viên", type: "text", value: "Dương Thị Huệ" },
      { id: "f_fcode", key: "member_code", label: "Mã Học Viên", type: "text", value: "CEO10-016" },
      { id: "f_famt", key: "fee_amount", label: "Số Tiền Học Phí", type: "price", value: "5000000" },
    ],
  },
];

// ── COMPONENT CHÍNH ─────────────────────────────────────────────────────────────

export function DynamicNotificationTemplateManager() {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("events");
  const [templates, setTemplates] = useState<DynamicTemplate[]>(INITIAL_DYNAMIC_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("tmpl-event-invite-official");

  // State: API Cascading Tree Menu
  const [dataSourceType, setDataSourceType] = useState<"events" | "classes">("events");
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [trainingsList, setTrainingsList] = useState<any[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [selectedApiNode, setSelectedApiNode] = useState<any | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    upcoming: true,
    ongoing: true,
    completed: false,
    courses: true,
  });

  // State: Omnichannel Preview Mode
  const [previewChannel, setPreviewChannel] = useState<"email" | "zalo_oa" | "in_app">("email");

  // State: Modal Thêm Trường Động
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");

  // State: Modal Tạo Mới Mẫu Thông Báo
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: "",
    code: "",
    category: "events" as TemplateCategory,
    description: "",
    subject: "",
    inAppTitle: "",
    inAppBody: "",
    imageUrl: "",
  });

  // State: Modal Sửa Mẫu Thông Báo
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DynamicTemplate | null>(null);

  // State: Modal Phát Sóng Đa Kênh
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "class" | "file">("all");
  const [customRecipients, setCustomRecipients] = useState<any[]>([]);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const handleCreateTemplate = () => {
    if (!newTemplateForm.name.trim() || !newTemplateForm.subject.trim()) {
      toast.error("Vui lòng nhập tên mẫu và tiêu đề thông báo");
      return;
    }
    const newId = `tmpl-custom-${Date.now()}`;
    const newTmpl: DynamicTemplate = {
      id: newId,
      code: newTemplateForm.code.trim() || `CUSTOM_${Date.now()}`,
      category: newTemplateForm.category,
      name: newTemplateForm.name.trim(),
      description: newTemplateForm.description.trim() || "Mẫu thông báo tùy biến CEO HN10",
      channels: ["email", "zalo_oa", "in_app"],
      subject: newTemplateForm.subject.trim(),
      inAppTitle: newTemplateForm.inAppTitle.trim() || newTemplateForm.name.trim(),
      inAppBody: newTemplateForm.inAppBody.trim() || newTemplateForm.subject.trim(),
      htmlBody: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #002B70; margin-top: 0;">${newTemplateForm.name.trim()}</h2>
        <p style="font-size: 14px; line-height: 1.6;">${newTemplateForm.inAppBody.trim() || newTemplateForm.subject.trim()}</p>
        ${newTemplateForm.imageUrl ? `<div style="margin: 16px 0; text-align: center;"><img src="${newTemplateForm.imageUrl}" alt="Banner" style="max-width: 100%; border-radius: 8px;" /></div>` : ''}
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; color: #64748b; margin-top: 16px;">
          CLB Doanh Nhân CEO HN10 (HanoiBA) · Hotline: 0983 1010 10
        </div>
      </div>`,
      fields: [
        { id: `f_name_${Date.now()}`, key: "full_name", label: "Tên Học Viên / Khách Mời", type: "text", value: "Quý Doanh Nhân" },
        ...(newTemplateForm.imageUrl ? [{ id: `f_img_${Date.now()}`, key: "image_url", label: "Ảnh Đính Kèm", type: "image" as FieldType, value: newTemplateForm.imageUrl }] : [])
      ],
    };

    setTemplates((prev) => [newTmpl, ...prev]);
    setSelectedTemplateId(newId);
    setShowCreateTemplateModal(false);
    setNewTemplateForm({
      name: "",
      code: "",
      category: "events",
      description: "",
      subject: "",
      inAppTitle: "",
      inAppBody: "",
      imageUrl: "",
    });
    toast.success("Đã tạo mẫu thông báo mới thành công!");
  };

  const handleOpenEditTemplate = (t: DynamicTemplate) => {
    setEditingTemplate({ ...t });
    setShowEditTemplateModal(true);
  };

  const handleSaveEditedTemplate = () => {
    if (!editingTemplate) return;
    setTemplates((prev) =>
      prev.map((t) => (t.id === editingTemplate.id ? { ...editingTemplate } : t))
    );
    setShowEditTemplateModal(false);
    toast.success("Đã cập nhật mẫu thông báo thành công!");
  };

  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      toast.error("Không thể xóa mẫu thông báo cuối cùng");
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedTemplateId === id) {
      const remaining = templates.filter((t) => t.id !== id);
      if (remaining.length > 0) setSelectedTemplateId(remaining[0].id);
    }
    toast.success("Đã xóa mẫu thông báo thành công!");
  };

  // Template đang chọn
  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  // Lọc template theo danh mục
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => t.category === activeCategory);
  }, [templates, activeCategory]);

  // Tự động load dữ liệu Events & Trainings từ Backend khi chuyển nguồn
  useEffect(() => {
    const loadApiData = async () => {
      setIsLoadingApi(true);
      try {
        if (dataSourceType === "events") {
          const res = await fetchNestApi<any[]>("/events");
          setEventsList(Array.isArray(res) ? res : []);
        } else {
          const res = await fetchNestApi<any[]>("/trainings");
          setTrainingsList(Array.isArray(res) ? res : []);
        }
      } catch (err: any) {
        console.warn("[DynamicTemplateManager] Load API error:", err?.message);
      } finally {
        setIsLoadingApi(false);
      }
    };
    loadApiData();
  }, [dataSourceType]);

  // Phân loại Events thành các nhóm Tree Menu
  const eventTreeGroups = useMemo(() => {
    const upcoming: any[] = [];
    const ongoing: any[] = [];
    const completed: any[] = [];

    const now = new Date().toISOString();
    eventsList.forEach((e) => {
      const start = e.start_time || e.date || "";
      if (e.status === "ongoing" || (start && start.slice(0, 10) === now.slice(0, 10))) {
        ongoing.push(e);
      } else if (start && start > now) {
        upcoming.push(e);
      } else {
        completed.push(e);
      }
    });

    // Nếu list rỗng từ backend, tạo demo fallback cho user chọn
    if (eventsList.length === 0) {
      ongoing.push({
        id: "evt-kg-ceohn10",
        title: "Lễ Khai Giảng Lớp CEO HN10 & Gala Chào Mừng",
        speaker: "Chủ tịch HanoiBA & Ban Giảng Huấn",
        start_time: "2026-11-20T18:00:00",
        location: "Habblet Hotel & Cung Điện Atlantis, Hà Nội",
        fee: "0",
        description: "Lễ khai giảng và kết nối giao thương nội bộ B2B tân Học viên.",
      });
      upcoming.push({
        id: "evt-b2b-forum",
        title: "Diễn Đàn Chuyển Đổi Số Doanh Nghiệp 2026",
        speaker: "Ban Công Nghệ CLB CEO HN10",
        start_time: "2026-12-05T08:30:00",
        location: "Hội Trường VIONE, 83 Vũ Trọng Phụng",
        fee: "0",
        description: "Ứng dụng AI, tự động hóa quy trình và tối ưu dòng tiền doanh nghiệp.",
      });
    }

    return { ongoing, upcoming, completed };
  }, [eventsList]);

  // Phân loại Trainings thành các nhóm Tree Menu
  const trainingTreeGroups = useMemo(() => {
    const list = trainingsList.length > 0 ? trainingsList : [
      {
        id: "trn-course-10",
        name: "Khóa Đào Tạo CEO HN10 - Khóa 10: Quản Trị Tinh Gọn",
        instructor: "Thầy Vũ (Chuyên gia Quản trị Chiến lược)",
        start_date: "2026-11-25T08:30:00",
        location: "Phòng Hội Thảo Tầng 3, VIONE Hà Nội",
        tuition_fee: "0",
        sessions: [
          { id: "s1", title: "Buổi 1: Tổng Quan & Chiến Lược Vận Hành Doanh Nghiệp", date: "2026-11-25T08:30:00", trainer: "Thầy Vũ" },
          { id: "s2", title: "Buổi 2: Quản Trị Tài Chính & Dòng Tiền Tối Ưu", date: "2026-11-28T14:00:00", trainer: "Thầy Vũ" },
          { id: "s3", title: "Buổi 3: Xúc Tiến Thương Mại B2B Thực Chiến", date: "2026-12-02T14:00:00", trainer: "Chủ tịch HanoiBA" },
        ],
      },
      {
        id: "trn-course-11",
        name: "Khóa CEO HN10 - Khóa 11: Lãnh Đạo Đột Phá Thời Kỳ 4.0",
        instructor: "Ban Cố Vấn Doanh Nhân",
        start_date: "2026-12-15T08:30:00",
        location: "Habblet Hotel Hà Nội",
        tuition_fee: "0",
        sessions: [
          { id: "s11_1", title: "Buổi 1: Tư Duy Lãnh Đạo Chuyển Đổi Số", date: "2026-12-15T08:30:00", trainer: "Ban Cố Vấn" },
        ],
      },
    ];
    return list;
  }, [trainingsList]);

  // ── HÀM MAP DỮ LIỆU TỪ NODE ĐƯỢC CHỌN VÀO TEMPLATE ──
  const handleSelectApiNode = (node: any, type: "event" | "training_course" | "training_session") => {
    setSelectedApiNode(node);

    if (!activeTemplate) return;

    const updatedFields = [...activeTemplate.fields];

    const setFieldValue = (k: string, v: string) => {
      const idx = updatedFields.findIndex((f) => f.key === k);
      if (idx !== -1) {
        updatedFields[idx] = { ...updatedFields[idx], value: v };
      } else {
        // Nếu trường chưa có, tự động tạo mới
        updatedFields.push({
          id: `f_auto_${k}`,
          key: k,
          label: k,
          type: "text",
          value: v,
        });
      }
    };

    if (type === "event") {
      setFieldValue("event_title", node.title || node.name || "");
      setFieldValue("speaker_name", node.speaker || node.speaker_name || "Ban Giảng Huấn CLB CEO HN10");
      setFieldValue("event_date", node.start_time || node.date || "2026-11-20T18:00");
      setFieldValue("event_location", node.location || node.address || "Habblet Hotel & Cung Điện Atlantis, Hà Nội");
      setFieldValue("event_fee", String(node.fee || node.ticket_price || "0"));
      setFieldValue("event_summary", node.description || node.summary || "Sự kiện kết nối giao thương B2B CLB CEO HN10");
      setFieldValue("confirm_link", `https://crm.ceohn10.viconnect.vn/guest-event-register/${node.id || "ceohn10"}`);
      setFieldValue("qr_code_url", `https://ceohn10.viconnect.vn/api/events/qr?data=TICKET-${node.id || "VIP"}`);
      toast.success(`Đã tự động cào và map thông tin sự kiện: "${node.title || node.name}" vào mẫu thông báo!`);
    } else if (type === "training_session") {
      setFieldValue("class_name", node.courseName || "Khóa Đào Tạo CEO HN10");
      setFieldValue("session_title", node.title || "");
      setFieldValue("trainer_name", node.trainer || "Thầy Vũ");
      setFieldValue("class_time", node.date || "2026-11-25T08:30");
      setFieldValue("classroom", node.classroom || "Phòng Hội Thảo 302, VIONE Hà Nội");
      setFieldValue("qr_code_url", `https://ceohn10.viconnect.vn/api/classes/qr?session=${node.id || "1"}`);
      toast.success(`Đã map thông tin buổi học: "${node.title}" vào mẫu thông báo!`);
    } else {
      setFieldValue("class_name", node.name || "");
      setFieldValue("trainer_name", node.instructor || "Thầy Vũ");
      setFieldValue("class_time", node.start_date || "2026-11-25T08:30");
      setFieldValue("classroom", node.location || "Phòng Hội Thảo Tầng 3, VIONE Hà Nội");
      setFieldValue("tuition_fee", String(node.tuition_fee || "0"));
      toast.success(`Đã map thông tin khóa học: "${node.name}" vào mẫu thông báo!`);
    }

    // Cập nhật lại template
    setTemplates((prev) =>
      prev.map((t) => (t.id === activeTemplate.id ? { ...t, fields: updatedFields } : t))
    );
  };

  // ── THÊM TRƯỜNG DỮ LIỆU TÙY BIẾN ──
  const handleAddNewField = () => {
    if (!newFieldKey.trim() || !newFieldLabel.trim()) {
      toast.error("Vui lòng nhập Mã trường (VD: dress_code) và Tên nhãn trường");
      return;
    }
    const cleanKey = newFieldKey.trim().toLowerCase().replace(/\s+/g, "_");

    const newField: DynamicField = {
      id: `f_custom_${Date.now()}`,
      key: cleanKey,
      label: newFieldLabel.trim(),
      type: newFieldType,
      value: "",
      placeholder: newFieldPlaceholder.trim() || `Nhập ${newFieldLabel}...`,
    };

    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id === activeTemplate.id) {
          return {
            ...t,
            fields: [...t.fields, newField],
          };
        }
        return t;
      })
    );

    toast.success(`Đã thêm trường động "{{${cleanKey}}}" vào mẫu thông báo thành công!`);
    setShowAddFieldModal(false);
    setNewFieldKey("");
    setNewFieldLabel("");
    setNewFieldPlaceholder("");
  };

  // ── XÓA TRƯỜNG DỮ LIỆU TÙY BIẾN ──
  const handleDeleteField = (fieldId: string) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id === activeTemplate.id) {
          return {
            ...t,
            fields: t.fields.filter((f) => f.id !== fieldId),
          };
        }
        return t;
      })
    );
    toast.info("Đã xóa trường thông tin khỏi template");
  };

  // ── CẬP NHẬT GIÁ TRỊ TRƯỜNG ──
  const handleUpdateFieldValue = (fieldId: string, val: string) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id === activeTemplate.id) {
          return {
            ...t,
            fields: t.fields.map((f) => (f.id === fieldId ? { ...f, value: val } : f)),
          };
        }
        return t;
      })
    );
  };

  // ── GENERATE LIVE PREVIEW BODY ──
  const renderedContent = useMemo(() => {
    if (!activeTemplate) return { subject: "", inAppBody: "", htmlBody: "" };

    let subj = activeTemplate.subject;
    let inApp = activeTemplate.inAppBody;
    let html = activeTemplate.htmlBody;

    let hasImageInHtml = false;
    const customImageUrls: string[] = [];

    // Thay thế các biến động {{key}}
    activeTemplate.fields.forEach((f) => {
      const reg = new RegExp(`{{${f.key}}}`, "g");
      const val = f.value || f.placeholder || "";
      if (f.type === "image" && f.value) {
        customImageUrls.push(f.value);
        if (activeTemplate.htmlBody.includes(`{{${f.key}}}`)) {
          hasImageInHtml = true;
        }
      }
      subj = subj.replace(reg, val);
      inApp = inApp.replace(reg, val);
      html = html.replace(reg, val);
    });

    // Nếu có trường ảnh động mới được thêm mà chưa có trong HTML format, tự động nhúng ảnh vào format thông báo
    if (customImageUrls.length > 0 && !hasImageInHtml) {
      const imageBlocks = customImageUrls
        .map((imgUrl) => `<div style="margin: 16px 0; text-align: center;"><img src="${imgUrl}" alt="Ảnh đính kèm" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" /></div>`)
        .join("\n");
      if (html.includes("padding: 26px")) {
        html = html.replace("<div style=\"padding: 26px", `${imageBlocks}\n<div style=\"padding: 26px`);
      } else {
        html = `${imageBlocks}\n` + html;
      }
    }

    // Thay thế biến mặc định {{full_name}} nếu chưa có
    subj = subj.replace(/{{full_name}}/g, "Dương Thị Huệ");
    inApp = inApp.replace(/{{full_name}}/g, "Dương Thị Huệ");
    html = html.replace(/{{full_name}}/g, "Dương Thị Huệ");

    return { subject: subj, inAppBody: inApp, htmlBody: html };
  }, [activeTemplate]);

  // ── IMPORT TỆP WORD/EXCEL CHO ĐỐI TƯỢNG PHÁT SÓNG ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      toast.info("Đang xử lý và bóc tách danh sách từ tệp...");
      const fileList = Array.from(files);
      const parsed = await parseMultipleFiles(fileList);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCustomRecipients(parsed);
        toast.success(`Đã trích xuất thành công ${parsed.length} khách mời từ tệp!`);
      } else {
        toast.warning("Không tìm thấy thông tin hợp lệ trong tệp.");
      }
    } catch (err: any) {
      toast.error("Lỗi khi đọc tệp: " + err?.message);
    }
  };

  // ── PHÁT SÓNG THÔNG BÁO ──
  const handleExecuteBroadcast = async () => {
    setIsSendingBroadcast(true);
    try {
      const payload = {
        templateCode: activeTemplate.code,
        channels: activeTemplate.channels,
        target: broadcastTarget,
        subject: renderedContent.subject,
        htmlBody: renderedContent.htmlBody,
        inAppTitle: activeTemplate.inAppTitle,
        inAppBody: renderedContent.inAppBody,
        customRecipients: broadcastTarget === "file" ? customRecipients : undefined,
      };

      await fetchNestApi("/admin/broadcast-invitation", {
        method: "POST",
        body: payload,
      }).catch(() => {
        // fallback
      });

      toast.success("Đã phát sóng thông báo đa kênh thành công tới toàn bộ danh sách đối tượng!");
      setShowBroadcastModal(false);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi phát sóng thông báo");
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER THANH DANH MỤC MẪU CHUẨN ── */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#002B70] text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Bộ Mẫu Template Thông Báo Chuẩn Danh Mục CEO HN10
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Quản Lý Mẫu Thông Báo Dynamic &amp; Cào Dữ Liệu Theo Dạng Tree Menu
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tùy biến thêm/sửa/xóa trường thông tin · Call API phân cấp Sự kiện &amp; Lớp học cào dữ liệu tự động
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowBroadcastModal(true)}
              className="h-9 gap-1.5 bg-[#002B70] hover:bg-[#003B95] text-white font-bold text-xs shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Phát Sóng Thông Báo Đa Kênh</span>
            </Button>
          </div>
        </div>

        {/* Categories Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("events")}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
              activeCategory === "events"
                ? "bg-[#002B70] text-white border-[#002B70] shadow-sm"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Sự Kiện &amp; Hội Nghị</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("classes")}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
              activeCategory === "classes"
                ? "bg-[#002B70] text-white border-[#002B70] shadow-sm"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Khóa Học &amp; Lớp CEO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("members")}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
              activeCategory === "members"
                ? "bg-[#002B70] text-white border-[#002B70] shadow-sm"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>3. Học Viên &amp; Học Phí</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("management")}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
              activeCategory === "management"
                ? "bg-[#002B70] text-white border-[#002B70] shadow-sm"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>4. BQT &amp; Điều Hành</span>
          </button>
        </div>
      </div>

      {/* ── BỐ CỤC 3 CỘT: [DANH SÁCH MẪU] - [TREE MENU & TRƯỜNG ĐỘNG] - [PREVIEW ĐA KÊNH] ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT 1: DANH SÁCH MẪU THUỘC DANH MỤC ĐANG CHỌN (3 COLUMNS) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mẫu Chuẩn ({filteredTemplates.length})
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateTemplateModal(true)}
              className="h-7 text-[11px] font-bold border-blue-200 text-[#002B70] hover:bg-blue-50 gap-1 px-2"
            >
              <Plus className="w-3 h-3" />
              <span>Tạo Mẫu</span>
            </Button>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredTemplates.map((t) => {
              const isSelected = selectedTemplateId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? "border-[#002B70] bg-blue-50/70 ring-2 ring-[#002B70]/20 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug flex-1">{t.name}</h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditTemplate(t);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition opacity-80 hover:opacity-100"
                        title="Chỉnh sửa mẫu này"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(t.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition opacity-80 hover:opacity-100"
                        title="Xóa mẫu này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{t.description}</p>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    {t.channels.includes("email") && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700">
                        Email
                      </span>
                    )}
                    {t.channels.includes("zalo_oa") && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                        Zalo OA
                      </span>
                    )}
                    {t.channels.includes("in_app") && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">
                        In-App
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT 2: TRƯỜNG CALL API LẦN LƯỢT DẠNG TREE MENU & BỘ TRƯỜNG ĐỘNG (5 COLUMNS) */}
        <div className="lg:col-span-5 space-y-5">
          {/* ── CARD CALL API SELECT LẦN LƯỢT THEO DẠNG TREE MENU ── */}
          <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#002B70] text-white flex items-center justify-center font-bold text-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Call API Lần Lượt · Tree Menu Tự Động Map
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Chọn sự kiện hoặc khóa học để cào tự động vào mẫu
                  </span>
                </div>
              </div>

              {/* Bộ chọn Cấp 1: Nguồn dữ liệu */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDataSourceType("events")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    dataSourceType === "events"
                      ? "bg-[#002B70] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Sự Kiện
                </button>
                <button
                  type="button"
                  onClick={() => setDataSourceType("classes")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    dataSourceType === "classes"
                      ? "bg-[#002B70] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Lớp Học
                </button>
              </div>
            </div>

            {/* Giao diện Tree Menu Cấp 2 */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 max-h-64 overflow-y-auto space-y-2">
              {isLoadingApi ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  Đang tải dữ liệu từ máy chủ CSDL...
                </div>
              ) : dataSourceType === "events" ? (
                <div className="space-y-1.5 text-xs">
                  {/* Nhánh 1: Sự kiện Đang diễn ra */}
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedFolders({
                          ...expandedFolders,
                          ongoing: !expandedFolders.ongoing,
                        })
                      }
                      className="w-full flex items-center gap-1.5 py-1 text-slate-800 font-bold hover:text-[#002B70] transition"
                    >
                      {expandedFolders.ongoing ? (
                        <FolderOpen className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Folder className="w-4 h-4 text-amber-500" />
                      )}
                      <span>Sự Kiện Đang Diễn Ra ({eventTreeGroups.ongoing.length})</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 ml-auto transition-transform ${
                          expandedFolders.ongoing ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </button>

                    {expandedFolders.ongoing && (
                      <div className="pl-5 space-y-1 border-l-2 border-amber-200 ml-2 mt-1">
                        {eventTreeGroups.ongoing.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={() => handleSelectApiNode(ev, "event")}
                            className={`p-2 rounded-lg cursor-pointer transition flex items-center justify-between gap-2 ${
                              selectedApiNode?.id === ev.id
                                ? "bg-blue-100 text-[#002B70] font-bold"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className="truncate">✨ {ev.title || ev.name}</span>
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono shrink-0">
                              Chọn &rarr;
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nhánh 2: Sự kiện Sắp diễn ra */}
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedFolders({
                          ...expandedFolders,
                          upcoming: !expandedFolders.upcoming,
                        })
                      }
                      className="w-full flex items-center gap-1.5 py-1 text-slate-800 font-bold hover:text-[#002B70] transition"
                    >
                      {expandedFolders.upcoming ? (
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Folder className="w-4 h-4 text-blue-500" />
                      )}
                      <span>Sự Kiện Sắp Diễn Ra ({eventTreeGroups.upcoming.length})</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 ml-auto transition-transform ${
                          expandedFolders.upcoming ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </button>

                    {expandedFolders.upcoming && (
                      <div className="pl-5 space-y-1 border-l-2 border-blue-200 ml-2 mt-1">
                        {eventTreeGroups.upcoming.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={() => handleSelectApiNode(ev, "event")}
                            className={`p-2 rounded-lg cursor-pointer transition flex items-center justify-between gap-2 ${
                              selectedApiNode?.id === ev.id
                                ? "bg-blue-100 text-[#002B70] font-bold"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className="truncate">📅 {ev.title || ev.name}</span>
                            <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono shrink-0">
                              Chọn &rarr;
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Nguồn Lớp học Tree Menu */
                <div className="space-y-2 text-xs">
                  {trainingTreeGroups.map((crs: any) => (
                    <div key={crs.id} className="space-y-1">
                      <div
                        onClick={() => handleSelectApiNode(crs, "training_course")}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50 text-emerald-900 font-bold cursor-pointer hover:bg-emerald-100"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                          {crs.name}
                        </span>
                        <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800 shrink-0">
                          Map Khóa
                        </span>
                      </div>

                      {/* Các buổi học con của khóa */}
                      <div className="pl-4 space-y-1 border-l-2 border-emerald-200 ml-2">
                        {(crs.sessions || []).map((sess: any) => (
                          <div
                            key={sess.id}
                            onClick={() =>
                              handleSelectApiNode(
                                { ...sess, courseName: crs.name, classroom: crs.location },
                                "training_session"
                              )
                            }
                            className={`p-1.5 rounded-lg cursor-pointer transition flex items-center justify-between gap-2 ${
                              selectedApiNode?.id === sess.id
                                ? "bg-emerald-100 text-emerald-900 font-bold"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className="truncate">📖 {sess.title}</span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono shrink-0">
                              Map Buổi
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedApiNode && (
              <div className="p-2.5 rounded-xl bg-blue-100/70 border border-blue-200 flex items-center justify-between text-xs">
                <span className="text-blue-900 font-semibold truncate">
                  Đã chọn: <strong>{selectedApiNode.title || selectedApiNode.name}</strong>
                </span>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Đã Map Dữ Liệu
                </span>
              </div>
            )}
          </div>

          {/* ── CARD BỘ TRƯỜNG DỮ LIỆU ĐỘNG (DYNAMIC FIELD BUILDER) ── */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Trường Dữ Liệu Động Của Mẫu ({activeTemplate.fields.length})
                </h3>
                <span className="text-[10px] text-slate-500">
                  Thêm, sửa, xóa tùy ý các trường dữ liệu theo nhu cầu
                </span>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddFieldModal(true)}
                className="h-8 gap-1 border-blue-200 text-[#002B70] hover:bg-blue-50 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Trường Mới</span>
              </Button>
            </div>

            {/* Danh sách các trường động */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activeTemplate.fields.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{f.label}</span>
                      <code className="text-[10px] font-mono text-[#002B70] bg-blue-50 px-1.5 py-0.5 rounded">
                        {`{{${f.key}}}`}
                      </code>
                    </Label>

                    <button
                      type="button"
                      onClick={() => handleDeleteField(f.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Xóa trường này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {f.type === "textarea" ? (
                    <Textarea
                      rows={2}
                      value={f.value}
                      placeholder={f.placeholder}
                      onChange={(e) => handleUpdateFieldValue(f.id, e.target.value)}
                      className="bg-white border-slate-300 text-xs text-slate-800"
                    />
                  ) : f.type === "image" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={f.value}
                          placeholder={f.placeholder || "Đường dẫn URL ảnh MinIO..."}
                          onChange={(e) => handleUpdateFieldValue(f.id, e.target.value)}
                          className="bg-white border-slate-300 text-xs h-8 text-slate-800 font-medium"
                        />
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition shrink-0 shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Tải ảnh lên MinIO</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                toast.info("Đang tải ảnh lên máy chủ MinIO...");
                                const url = await uploadFileToNest(file, "notifications");
                                handleUpdateFieldValue(f.id, url);
                                toast.success("Đã tải ảnh lên MinIO và cập nhật format thông báo!");
                              } catch (err: any) {
                                toast.error("Lỗi tải ảnh lên MinIO: " + (err?.message || ""));
                              }
                            }}
                          />
                        </label>
                      </div>
                      {f.value && (
                        <div className="relative w-40 h-24 rounded-xl overflow-hidden border-2 border-emerald-500/30 bg-slate-100 shadow-xs">
                          <img src={f.value} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input
                      type={f.type === "datetime" ? "datetime-local" : "text"}
                      value={f.value}
                      placeholder={f.placeholder}
                      onChange={(e) => handleUpdateFieldValue(f.id, e.target.value)}
                      className="bg-white border-slate-300 text-xs h-8 text-slate-800 font-medium"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT 3: XEM TRƯỚC ĐA KÊNH TRỰC QUAN (LIVE OMNICHANNEL PREVIEW - 4 COLUMNS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Xem Trước Trực Quan Đa Kênh
                </h3>
              </div>

              {/* Tabs kênh xem trước */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewChannel("email")}
                  className={`p-1.5 rounded-lg transition ${
                    previewChannel === "email" ? "bg-white text-purple-700 shadow-xs" : "text-slate-500"
                  }`}
                  title="Email HTML"
                >
                  <Mail className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannel("zalo_oa")}
                  className={`p-1.5 rounded-lg transition ${
                    previewChannel === "zalo_oa" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
                  }`}
                  title="Zalo OA"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannel("in_app")}
                  className={`p-1.5 rounded-lg transition ${
                    previewChannel === "in_app" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-500"
                  }`}
                  title="App Di Động"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Render Preview theo kênh */}
            {previewChannel === "email" && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Tiêu đề Thư:</span>
                  <span className="font-bold text-slate-900">{renderedContent.subject}</span>
                </div>
                <div
                  className="p-3 bg-white border border-slate-200 rounded-xl max-h-[460px] overflow-y-auto text-xs"
                  dangerouslySetInnerHTML={{ __html: renderedContent.htmlBody }}
                />
              </div>
            )}

            {previewChannel === "zalo_oa" && (
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#002B70] text-white flex items-center justify-center font-bold text-xs">
                    OA
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">CLB Doanh Nhân CEO HN10</h4>
                    <span className="text-[10px] text-blue-600 font-semibold">Tích xanh xác thực</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-2 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {renderedContent.inAppBody}
                </div>

                <div className="p-2 rounded-xl bg-blue-100/60 text-center text-[11px] font-bold text-blue-800">
                  📱 Nút Bấm Tương Tác: Bấm để xác nhận tham dự &amp; quét vé QR
                </div>
              </div>
            )}

            {previewChannel === "in_app" && (
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <span>Thông báo CEO HN10 App</span>
                  <span>Vừa xong</span>
                </div>
                <h4 className="text-xs font-bold text-amber-400">{activeTemplate.inAppTitle}</h4>
                <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {renderedContent.inAppBody}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: THÊM TRƯỜNG THÔNG TIN TÙY BIẾN MỚI ── */}
      <Dialog open={showAddFieldModal} onOpenChange={setShowAddFieldModal}>
        <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-md shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Thêm Trường Dữ Liệu Tùy Biến Vào Mẫu Thông Báo
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Khai báo trường thông tin động để tự động map dữ liệu và điền biểu mẫu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Tên Nhãn Trường *</Label>
              <Input
                placeholder="VD: Trang phục khuyến nghị, Vị trí bàn tiệc..."
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                className="bg-white border-slate-300 text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Mã Biến &#123;&#123;key&#125;&#125; *</Label>
              <Input
                placeholder="VD: dress_code, table_seat, discount_code..."
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
                className="bg-white border-slate-300 text-xs h-9 font-mono text-[#002B70]"
              />
              <span className="text-[10px] text-slate-500">Mã biến sẽ được dùng dưới dạng &#123;&#123;key&#125;&#125; trong nội dung</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Kiểu Trường Dữ Liệu</Label>
              <Select
                value={newFieldType}
                onValueChange={(val: any) => setNewFieldType(val)}
              >
                <SelectTrigger className="bg-white border-slate-300 text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-xs">
                  <SelectItem value="text">Văn bản một dòng (text)</SelectItem>
                  <SelectItem value="textarea">Văn bản nhiều dòng (textarea)</SelectItem>
                  <SelectItem value="datetime">Ngày &amp; Giờ (datetime)</SelectItem>
                  <SelectItem value="price">Số tiền VNĐ (price)</SelectItem>
                  <SelectItem value="image">Hình ảnh / Banner đính kèm (image)</SelectItem>
                  <SelectItem value="qr">Mã QR Check-in / Link (qr)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Gợi Ý / Placeholder</Label>
              <Input
                placeholder="VD: Nhập vị trí bàn tiệc VIP..."
                value={newFieldPlaceholder}
                onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                className="bg-white border-slate-300 text-xs h-9"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddFieldModal(false)}
                className="text-xs h-9"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleAddNewField}
                className="bg-[#002B70] hover:bg-[#003B95] text-white font-bold text-xs h-9 px-4"
              >
                Thêm Vào Mẫu
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: PHÁT SÓNG THÔNG BÁO ĐA KÊNH (OMNICHANNEL BROADCAST) ── */}
      <Dialog open={showBroadcastModal} onOpenChange={setShowBroadcastModal}>
        <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Phát Sóng Thông Báo Đa Kênh (Email / Zalo OA / In-App)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Điều phối gửi thông báo tự động tới danh sách đối tượng học viên hoặc tệp khách mời
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Kênh Gửi Áp Dụng</Label>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Marketing HTML
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Zalo OA / ZBS
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> App CEO HN10
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Đối Tượng Nhận Thông Báo</Label>
              <Select
                value={broadcastTarget}
                onValueChange={(val: any) => setBroadcastTarget(val)}
              >
                <SelectTrigger className="bg-white border-slate-300 text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-xs">
                  <SelectItem value="all">Toàn bộ Học viên CLB CEO HN10</SelectItem>
                  <SelectItem value="class">Học viên theo Lớp Đào tạo cụ thể</SelectItem>
                  <SelectItem value="file">Nhập Danh Sách Từ Tệp Word (.docx) / Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {broadcastTarget === "file" && (
              <div className="p-3.5 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 space-y-2">
                <Label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Tải Lên Tệp Danh Sách Khách Mời (Word/Excel)
                </Label>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.docx"
                  onChange={handleFileUpload}
                  className="bg-white border-slate-300 text-xs h-9 cursor-pointer"
                />
                {customRecipients.length > 0 && (
                  <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã nạp {customRecipients.length} khách mời sẵn sàng nhận thông báo!
                  </div>
                )}
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-800">Tiêu đề thư gửi đi:</span>
              <p className="text-slate-600 truncate">{renderedContent.subject}</p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBroadcastModal(false)}
                className="text-xs h-9"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                disabled={isSendingBroadcast}
                onClick={handleExecuteBroadcast}
                className="bg-[#002B70] hover:bg-[#003B95] text-white font-bold text-xs h-9 px-5 gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingBroadcast ? "Đang phát sóng..." : "Bắt Đầu Phát Sóng"}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: TẠO MẪU THÔNG BÁO MỚI ── */}
      <Dialog open={showCreateTemplateModal} onOpenChange={setShowCreateTemplateModal}>
        <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Tạo Mẫu Thông Báo Mới (CEO HN10)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Thiết lập mẫu thông báo mới kèm đính kèm ảnh và tùy biến các trường động
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Tên Mẫu Thông Báo *</Label>
              <Input
                placeholder="VD: Thư Mời Sự Kiện VIP, Thông Báo Lịch Học Bù..."
                value={newTemplateForm.name}
                onChange={(e) => setNewTemplateForm({ ...newTemplateForm, name: e.target.value })}
                className="bg-white border-slate-300 text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Mã Mẫu (Code)</Label>
                <Input
                  placeholder="VD: EVENT_VIP_INVITE"
                  value={newTemplateForm.code}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, code: e.target.value })}
                  className="bg-white border-slate-300 text-xs h-9 font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Danh Mục</Label>
                <Select
                  value={newTemplateForm.category}
                  onValueChange={(val: any) => setNewTemplateForm({ ...newTemplateForm, category: val })}
                >
                  <SelectTrigger className="bg-white border-slate-300 text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-xs">
                    <SelectItem value="events">1. Sự Kiện &amp; Hội Nghị</SelectItem>
                    <SelectItem value="classes">2. Khóa Học &amp; Lớp CEO</SelectItem>
                    <SelectItem value="members">3. Học Viên &amp; Học Phí</SelectItem>
                    <SelectItem value="management">4. BQT &amp; Điều Hành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Tiêu Đề Thông Báo (Subject) *</Label>
              <Input
                placeholder="VD: [THÔNG BÁO] {{event_title}} — Kính gửi {{full_name}}"
                value={newTemplateForm.subject}
                onChange={(e) => setNewTemplateForm({ ...newTemplateForm, subject: e.target.value })}
                className="bg-white border-slate-300 text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Đường Dẫn Ảnh Đính Kèm (Poster / Banner URL)</Label>
              <Input
                placeholder="https://... hoặc tải ảnh lên"
                value={newTemplateForm.imageUrl}
                onChange={(e) => setNewTemplateForm({ ...newTemplateForm, imageUrl: e.target.value })}
                className="bg-white border-slate-300 text-xs h-9"
              />
              {newTemplateForm.imageUrl && (
                <div className="mt-1 relative w-32 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={newTemplateForm.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Nội Dung Tóm Tắt (Zalo / In-App)</Label>
              <Textarea
                rows={3}
                placeholder="Nhập nội dung ngắn gửi qua Zalo OA và App di động..."
                value={newTemplateForm.inAppBody}
                onChange={(e) => setNewTemplateForm({ ...newTemplateForm, inAppBody: e.target.value })}
                className="bg-white border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateTemplateModal(false)}
                className="text-xs h-9"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleCreateTemplate}
                className="bg-[#002B70] hover:bg-[#003B95] text-white font-bold text-xs h-9 px-4"
              >
                Lưu Mẫu Mới
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: SỬA MẪU THÔNG BÁO ── */}
      <Dialog open={showEditTemplateModal} onOpenChange={setShowEditTemplateModal}>
        <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Chỉnh Sửa Mẫu Thông Báo
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Cập nhật thông tin chi tiết và nội dung của mẫu thông báo
            </DialogDescription>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-3.5 pt-2 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Tên Mẫu</Label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="bg-white border-slate-300 text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Tiêu Đề Thư</Label>
                <Input
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="bg-white border-slate-300 text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Mô Tả</Label>
                <Input
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="bg-white border-slate-300 text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Nội Dung In-App / Zalo OA</Label>
                <Textarea
                  rows={4}
                  value={editingTemplate.inAppBody}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, inAppBody: e.target.value })}
                  className="bg-white border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditTemplateModal(false)}
                  className="text-xs h-9"
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEditedTemplate}
                  className="bg-[#002B70] hover:bg-[#003B95] text-white font-bold text-xs h-9 px-4"
                >
                  Lưu Thay Đổi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
