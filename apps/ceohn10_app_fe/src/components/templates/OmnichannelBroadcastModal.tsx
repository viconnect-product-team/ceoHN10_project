import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Smartphone,
  MessageSquare,
  Mail,
  CheckCircle2,
  AlertCircle,
  Users,
  Shield,
  Calendar,
  MapPin,
  Sparkles,
  Layers,
  Check,
  Upload,
  FileSpreadsheet,
  FileText,
  Trash2,
  Plus,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { parseMultipleFiles, type ParsedRecipientItem } from "@/lib/ai-excel-email-parser";

export interface OmnichannelBroadcastModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  invitationData: {
    title: string;
    subtitle?: string;
    posterUrl?: string;
    imageUrl?: string;
    date?: string;
    time?: string;
    location?: string;
    salutation?: string;
    bodyText?: string;
    templateId?: string;
    category?: string;
    [key: string]: any;
  };
  onSuccess?: () => void;
}

export function OmnichannelBroadcastModal({
  open,
  isOpen,
  onClose,
  invitationData,
  onSuccess,
}: OmnichannelBroadcastModalProps) {
  const isModalOpen = open ?? isOpen ?? true;
  if (!isModalOpen) return null;

  // Checkbox states for 3 channels (user can pick 1, 2, or all 3)
  const [sendToApp, setSendToApp] = useState<boolean>(true);
  const [sendToZalo, setSendToZalo] = useState<boolean>(true);
  const [sendToEmail, setSendToEmail] = useState<boolean>(true);

  // Ảnh đính kèm thông báo
  const [broadcastImageUrl, setBroadcastImageUrl] = useState<string>(
    invitationData?.imageUrl || invitationData?.posterUrl || ""
  );

  // Target audience selection
  const [targetAudience, setTargetAudience] = useState<
    "all" | "executives" | "department" | "registered" | "custom_file"
  >("all");
  const [selectedDept, setSelectedDept] = useState<string>("Ban Xúc Tiến Thương Mại");

  // Custom Recipients
  const [customRecipients, setCustomRecipients] = useState<ParsedRecipientItem[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Emails Input (Yêu cầu 3: có thể điền nhiều email)
  const [bulkEmailText, setBulkEmailText] = useState("");

  // Zalo OA Subscribers (Yêu cầu 3: call theo danh sách người đã quan tâm zalo oa)
  const [zaloSubscribers, setZaloSubscribers] = useState<any[]>([]);
  const [loadingZaloSubscribers, setLoadingZaloSubscribers] = useState(false);
  const [showZaloList, setShowZaloList] = useState(false);

  // Manual Add Form states
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualCompany, setManualCompany] = useState("");

  const [isSending, setIsSending] = useState<boolean>(false);

  const totalChannelsSelected =
    (sendToApp ? 1 : 0) + (sendToZalo ? 1 : 0) + (sendToEmail ? 1 : 0);

  const handleSelectAll = () => {
    setSendToApp(true);
    setSendToZalo(true);
    setSendToEmail(true);
  };

  const handleClearAll = () => {
    setSendToApp(false);
    setSendToZalo(false);
    setSendToEmail(false);
  };

  // Nạp danh sách người đã quan tâm Zalo OA
  const handleFetchZaloSubscribers = async () => {
    setLoadingZaloSubscribers(true);
    try {
      const res = await fetchNestApi<any>("/zalo/subscribers");
      const list = Array.isArray(res) ? res : res?.items || res?.users || [];
      setZaloSubscribers(list);
      setShowZaloList(true);
      if (list.length > 0) {
        toast.success(`Đã lấy danh sách ${list.length} người quan tâm Zalo OA thành công!`);
      } else {
        toast.info("Hiện chưa có người theo dõi mới trên Zalo OA hoặc tài khoản đang ở chế độ giả lập.");
      }
    } catch (err: any) {
      toast.error("Không thể tải danh sách Zalo OA: " + (err?.message || "Lỗi kết nối"));
    } finally {
      setLoadingZaloSubscribers(false);
    }
  };

  // Thêm toàn bộ người quan tâm Zalo OA vào danh sách gửi
  const handleAddZaloSubscribersToRecipients = () => {
    if (zaloSubscribers.length === 0) {
      toast.warning("Chưa có danh sách người quan tâm Zalo OA để nạp!");
      return;
    }
    const newItems: ParsedRecipientItem[] = zaloSubscribers.map((u: any) => ({
      name: u.name || u.displayName || u.user_id || "Khách quan tâm Zalo OA",
      phone: u.phone || u.phoneNumber || "",
      email: u.email || "",
      company: u.company || "Người quan tâm Zalo OA",
    }));

    setCustomRecipients((prev) => {
      const map = new Map<string, ParsedRecipientItem>();
      [...prev, ...newItems].forEach((item) => {
        const key = (item.phone || item.email || item.name).toLowerCase().trim();
        if (key) map.set(key, item);
      });
      return Array.from(map.values());
    });
    setTargetAudience("custom_file");
    toast.success(`Đã thêm ${newItems.length} người từ Zalo OA vào danh sách gửi thư mời!`);
  };

  // Xử lý nạp nhiều email một lúc (Bulk email parser)
  const handleAddBulkEmails = () => {
    if (!bulkEmailText.trim()) {
      toast.error("Vui lòng nhập danh sách email!");
      return;
    }
    // Tách bằng dấu phẩy, chấm phẩy, xuống dòng, hoặc khoảng trắng
    const rawTokens = bulkEmailText.split(/[\s,;]+/);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails: string[] = [];

    rawTokens.forEach((token) => {
      const clean = token.trim().toLowerCase();
      if (clean && emailRegex.test(clean)) {
        if (!validEmails.includes(clean)) {
          validEmails.push(clean);
        }
      }
    });

    if (validEmails.length === 0) {
      toast.error("Không tìm thấy email hợp lệ nào. Vui lòng kiểm tra lại định dạng email!");
      return;
    }

    const newItems: ParsedRecipientItem[] = validEmails.map((email) => ({
      name: email.split("@")[0],
      email: email,
      phone: "",
      company: "Doanh nghiệp khách mời",
    }));

    setCustomRecipients((prev) => {
      const map = new Map<string, ParsedRecipientItem>();
      [...prev, ...newItems].forEach((item) => {
        const key = (item.email || "").toLowerCase().trim();
        if (key) map.set(key, item);
      });
      return Array.from(map.values());
    });

    setTargetAudience("custom_file");
    setBulkEmailText("");
    toast.success(`Đã trích xuất và thêm thành công ${validEmails.length} địa chỉ email vào danh sách!`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsParsingFile(true);
    try {
      const results = await parseMultipleFiles(files);
      const combinedRecipients: ParsedRecipientItem[] = [];
      const fileNames: string[] = [];

      for (const res of results) {
        fileNames.push(res.fileName);
        if (Array.isArray(res.recipients) && res.recipients.length > 0) {
          combinedRecipients.push(...res.recipients);
        }
      }

      if (combinedRecipients.length > 0) {
        setCustomRecipients((prev) => {
          const map = new Map<string, ParsedRecipientItem>();
          [...prev, ...combinedRecipients].forEach((item) => {
            const key = (item.email || item.phone || item.name).toLowerCase().trim();
            if (key) map.set(key, item);
          });
          return Array.from(map.values());
        });
        setUploadedFileName(fileNames.join(", "));
        toast.success(`Đã trích xuất thành công ${combinedRecipients.length} khách mời từ tệp!`);
      } else {
        toast.warning("Không tìm thấy email hoặc thông tin khách mời hợp lệ trong tệp.");
      }
    } catch (err: any) {
      console.error("Lỗi khi đọc tệp Word/Excel:", err);
      toast.error(err?.message || "Không thể xử lý tệp. Vui lòng kiểm tra lại định dạng.");
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddManualRecipient = () => {
    const cleanEmail = manualEmail.trim().toLowerCase();
    const cleanPhone = manualPhone.trim();
    const cleanName = manualName.trim();
    if (!cleanEmail && !cleanPhone) {
      toast.error("Vui lòng nhập Email hoặc Số điện thoại của khách mời!");
      return;
    }
    const newRecipient: ParsedRecipientItem = {
      name: cleanName || cleanEmail.split("@")[0] || cleanPhone,
      email: cleanEmail,
      phone: cleanPhone,
      company: manualCompany.trim() || "Doanh nghiệp khách mời",
    };
    setCustomRecipients((prev) => [newRecipient, ...prev]);
    setManualName("");
    setManualEmail("");
    setManualPhone("");
    setManualCompany("");
    setShowManualAdd(false);
    toast.success("Đã thêm khách mời vào danh sách gửi!");
  };

  const handleRemoveRecipient = (indexToRemove: number) => {
    setCustomRecipients((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleBroadcast = async () => {
    if (totalChannelsSelected === 0) {
      toast.error("Vui lòng tích chọn ít nhất 1 kênh để gửi thư mời!");
      return;
    }

    if (targetAudience === "custom_file" && customRecipients.length === 0) {
      toast.error("Vui lòng tải lên tệp hoặc thêm ít nhất 1 email/khách mời vào danh sách!");
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        title: invitationData.title,
        subtitle: invitationData.subtitle,
        posterUrl: broadcastImageUrl || invitationData.posterUrl,
        imageUrl: broadcastImageUrl || invitationData.posterUrl,
        date: invitationData.date,
        time: invitationData.time,
        location: invitationData.location,
        salutation: invitationData.salutation,
        bodyText: invitationData.bodyText,
        templateId: invitationData.templateId,
        channels: {
          sendToApp,
          sendToZalo,
          sendToEmail,
        },
        targetAudience,
        departmentId: targetAudience === "department" ? selectedDept : undefined,
        customRecipients: targetAudience === "custom_file" ? customRecipients : undefined,
      };

      await fetchNestApi<any>("/admin/invitation-templates/broadcast", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const channelNames: string[] = [];
      if (sendToApp) channelNames.push("App Mobile");
      if (sendToZalo) channelNames.push("Zalo OA");
      if (sendToEmail) channelNames.push("Email");

      const countStr = targetAudience === "custom_file" ? ` tới ${customRecipients.length} khách mời` : "";
      toast.success(
        `Đã phát thư mời thành công${countStr} qua ${channelNames.join(", ")}!`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Broadcast invitation error:", err);
      toast.error(err?.message || "Lỗi khi phát thư mời đa kênh");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Container: Chuẩn Theme Sáng (Light Theme) */}
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800">
        
        {/* Header - Theme Sáng */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-linear-to-r from-slate-50 via-blue-50/40 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Áp Dụng &amp; Gửi Thư Mời Đa Kênh
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                  CEO HN10
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Gửi thông báo &amp; thư mời trang trọng qua App Mobile, Zalo OA và Email
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Card Preview Thư Mời - Theme Sáng */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 flex items-start gap-4 shadow-2xs">
            {broadcastImageUrl || invitationData.posterUrl ? (
              <img
                src={broadcastImageUrl || invitationData.posterUrl}
                alt="Banner preview"
                className="w-20 h-28 object-cover rounded-lg border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-20 h-28 rounded-lg border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0 text-center p-1">
                <Layers className="size-6 text-blue-500 mb-1" />
                <span className="text-[9px] font-semibold">Ảnh Thư Mời</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                {invitationData.subtitle || "CLB Doanh Nhân CEO HN10 (HanoiBA)"}
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                {invitationData.title || "Thư Mời Sự Kiện"}
              </h4>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                {invitationData.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-blue-600 shrink-0" />
                    <span>{invitationData.date} {invitationData.time ? `(${invitationData.time})` : ""}</span>
                  </div>
                )}
                {invitationData.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{invitationData.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TRƯỜNG TẢI ẢNH ĐÍNH KÈM THÔNG BÁO */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Upload className="size-3.5 text-blue-600" />
                <span>Ảnh Đính Kèm Thông Báo (Banner / Poster Sự Kiện / Lớp Học)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Tùy chọn tải ảnh</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Dán link ảnh hoặc URL hình ảnh..."
                value={broadcastImageUrl}
                onChange={(e) => setBroadcastImageUrl(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
              <label className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 cursor-pointer flex items-center gap-1 shrink-0 transition">
                <span>Chọn ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const url = URL.createObjectURL(f);
                      setBroadcastImageUrl(url);
                      toast.success(`Đã chọn ảnh: ${f.name}`);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* KHỐI CHỌN 3 KÊNH GỬI (TÍCH CHỌN 1, 2 HOẶC TẤT CẢ) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>Chọn các kênh gửi</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                  {totalChannelsSelected}/3 kênh được chọn
                </span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Chọn tất cả
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] text-slate-500 hover:underline font-semibold cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {/* 3 Checkbox Channels - Theme Sáng */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* KÊNH 1: GỬI VÀO APP */}
              <label
                className={`relative flex items-start gap-3.5 p-3.5 rounded-xl border transition cursor-pointer select-none ${
                  sendToApp
                    ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-400/40"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={sendToApp}
                    onChange={(e) => setSendToApp(e.target.checked)}
                    className="size-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-blue-100 text-blue-700">
                      <Smartphone className="size-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      1. Gửi vào App Mobile CEO HN10
                    </span>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                      In-App &amp; Feed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Bắn Push Notification tới thiết bị Học viên &amp; tự động tạo bài viết lên Bảng tin Mạng lưới.
                  </p>
                </div>
              </label>

              {/* KÊNH 2: GỬI VÀO ZALO OA */}
              <div
                className={`relative flex flex-col p-3.5 rounded-xl border transition select-none ${
                  sendToZalo
                    ? "border-cyan-500 bg-cyan-50/40 ring-1 ring-cyan-400/40"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={sendToZalo}
                      onChange={(e) => setSendToZalo(e.target.checked)}
                      className="size-4.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-cyan-100 text-cyan-700">
                        <MessageSquare className="size-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        2. Gửi vào Zalo Official Account (Zalo OA / ZNS)
                      </span>
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-semibold">
                        Zalo OA
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pl-6">
                      Gửi tin nhắn Zalo OA tới người đã quan tâm kèm link mở vé và mã QR xác nhận.
                    </p>
                  </div>
                </div>

                {/* Yêu cầu 3: Call theo danh sách người đã quan tâm Zalo OA */}
                {sendToZalo && (
                  <div className="mt-3 pt-3 border-t border-cyan-100 pl-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                        <Users className="size-3.5 text-cyan-700" />
                        Danh sách người đã quan tâm Zalo OA:
                      </span>
                      <button
                        type="button"
                        onClick={handleFetchZaloSubscribers}
                        disabled={loadingZaloSubscribers}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold transition cursor-pointer shadow-xs"
                      >
                        <RefreshCw className={`size-3 ${loadingZaloSubscribers ? "animate-spin" : ""}`} />
                        <span>{loadingZaloSubscribers ? "Đang gọi Zalo..." : "Lấy DS quan tâm"}</span>
                      </button>
                    </div>

                    {zaloSubscribers.length > 0 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-cyan-200 text-xs">
                        <span className="text-slate-700 font-semibold">
                          Đã tìm thấy <strong className="text-cyan-700">{zaloSubscribers.length}</strong> người theo dõi Zalo OA
                        </span>
                        <button
                          type="button"
                          onClick={handleAddZaloSubscribersToRecipients}
                          className="px-2.5 py-1 bg-cyan-100 hover:bg-cyan-200 text-cyan-800 rounded font-bold text-[11px] cursor-pointer"
                        >
                          + Nạp vào DS gửi
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* KÊNH 3: GỬI VÀO EMAIL */}
              <div
                className={`relative flex flex-col p-3.5 rounded-xl border transition select-none ${
                  sendToEmail
                    ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-400/40"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={sendToEmail}
                      onChange={(e) => setSendToEmail(e.target.checked)}
                      className="size-4.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-amber-100 text-amber-700">
                        <Mail className="size-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        3. Gửi vào Email Doanh Nghiệp
                      </span>
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                        HTML Email
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pl-6">
                      Gửi thư điện tử trang trọng chuẩn HTML gắn kèm Poster và vé mời tham dự.
                    </p>
                  </div>
                </div>

                {/* Yêu cầu 3: Gửi mời qua email thì có thể điền nhiều mail */}
                {sendToEmail && (
                  <div className="mt-3 pt-3 border-t border-amber-100 pl-6 space-y-2">
                    <label className="text-xs font-bold text-amber-900 flex items-center justify-between">
                      <span>Điền nhanh danh sách nhiều Email (ngăn cách bởi dấu phẩy, chấm phẩy hoặc dòng mới):</span>
                    </label>
                    <div className="space-y-1.5">
                      <textarea
                        rows={2}
                        placeholder="Ví dụ: vumikasa6@gmail.com, thuylt313@gmail.com, vupv090120@gmail.com..."
                        value={bulkEmailText}
                        onChange={(e) => setBulkEmailText(e.target.value)}
                        className="w-full bg-white border border-amber-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddBulkEmails}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs transition"
                        >
                          <Plus className="size-3.5" />
                          <span>Thêm các email trên vào DS gửi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ĐỐI TƯỢNG NHẬN THƯ */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="size-3.5 text-blue-600" />
              <span>Đối tượng nhận thư mời</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetAudience("all")}
                className={`p-2.5 rounded-lg border text-left text-xs font-medium transition cursor-pointer ${
                  targetAudience === "all"
                    ? "border-blue-500 bg-blue-50/70 text-blue-900 font-bold"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold">Toàn bộ Học viên CLB</div>
                <div className="text-[10px] text-slate-500">Tất cả Học viên chính thức</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience("executives")}
                className={`p-2.5 rounded-lg border text-left text-xs font-medium transition cursor-pointer ${
                  targetAudience === "executives"
                    ? "border-blue-500 bg-blue-50/70 text-blue-900 font-bold"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold">Ban Điều Hành &amp; Trưởng Ban</div>
                <div className="text-[10px] text-slate-500">Lãnh đạo &amp; Thường trực CLB</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience("department")}
                className={`p-2.5 rounded-lg border text-left text-xs font-medium transition cursor-pointer ${
                  targetAudience === "department"
                    ? "border-blue-500 bg-blue-50/70 text-blue-900 font-bold"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold">Theo Ban Chuyên Môn</div>
                <div className="text-[10px] text-slate-500">Chỉ gửi cho 1 ban chuyên môn</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience("registered")}
                className={`p-2.5 rounded-lg border text-left text-xs font-medium transition cursor-pointer ${
                  targetAudience === "registered"
                    ? "border-blue-500 bg-blue-50/70 text-blue-900 font-bold"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold">Học viên Đã Đăng Ký</div>
                <div className="text-[10px] text-slate-500">Gửi nhắc hẹn &amp; xác nhận</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience("custom_file")}
                className={`col-span-2 p-2.5 rounded-lg border text-left text-xs font-medium transition cursor-pointer ${
                  targetAudience === "custom_file"
                    ? "border-blue-500 bg-blue-50/70 text-blue-900 ring-1 ring-blue-400 font-bold"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="size-4 text-emerald-600" />
                    <span>Danh Sách Khách Mời Cụ Thể (File Excel / Nhiều Email / Zalo OA)</span>
                  </span>
                  {customRecipients.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {customRecipients.length} khách mời
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Tải lên file danh sách khách mời hoặc nhập danh sách Email/SĐT để gửi đích danh
                </div>
              </button>
            </div>

            {/* KHỐI TẢI TỆP WORD / EXCEL & QUẢN LÝ KHÁCH MỜI CỤ THỂ */}
            {targetAudience === "custom_file" && (
              <div className="mt-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3 animate-in fade-in duration-200">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.docx,.doc,.csv"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isParsingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      <Upload className="size-3.5" />
                      <span>{isParsingFile ? "Đang đọc tệp..." : "Tải lên file Excel"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManualAdd(!showManualAdd)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>{showManualAdd ? "Đóng form" : "Thêm 1 người"}</span>
                    </button>
                  </div>
                  {uploadedFileName && (
                    <span className="text-[11px] text-emerald-700 font-semibold truncate max-w-xs">
                      📁 {uploadedFileName}
                    </span>
                  )}
                </div>

                {/* Form thêm thủ công nhanh */}
                {showManualAdd && (
                  <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2 shadow-2xs">
                    <div className="text-[11px] font-bold text-blue-800">Thêm khách mời cụ thể:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Họ và tên khách mời"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
                      />
                      <input
                        type="email"
                        placeholder="Địa chỉ Email"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
                      />
                      <input
                        type="tel"
                        placeholder="Số điện thoại"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Doanh nghiệp / Chức danh"
                        value={manualCompany}
                        onChange={(e) => setManualCompany(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddManualRecipient}
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Lưu vào danh sách
                      </button>
                    </div>
                  </div>
                )}

                {/* Bảng danh sách khách mời đã nạp */}
                {customRecipients.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <span>Danh sách sẽ nhận thư ({customRecipients.length} người):</span>
                      <button
                        type="button"
                        onClick={() => setCustomRecipients([])}
                        className="text-rose-600 hover:underline text-[10px] font-semibold"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white text-xs shadow-2xs">
                      {customRecipients.map((item, idx) => (
                        <div key={idx} className="p-2 flex items-center justify-between gap-2 hover:bg-slate-50">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 truncate">{item.name}</div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap gap-2">
                              {item.email && <span className="text-blue-600 font-medium truncate">✉ {item.email}</span>}
                              {item.phone && <span className="text-emerald-600 font-medium">📞 {item.phone}</span>}
                              {item.company && <span className="text-slate-500 truncate">🏢 {item.company}</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipient(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Xóa khách này"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500 bg-white">
                    Chưa có khách mời nào trong danh sách. Quý BTC hãy nhập danh sách Email phía trên hoặc bấm "Tải lên file Excel".
                  </div>
                )}
              </div>
            )}

            {targetAudience === "department" && (
              <div className="mt-2">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                >
                  <option value="Ban Xúc Tiến Thương Mại">Ban Xúc Tiến Thương Mại</option>
                  <option value="Ban Thành Viên">Ban Thành Viên</option>
                  <option value="Ban Truyền Thông">Ban Truyền Thông</option>
                  <option value="Ban Tài Chính & Tài Trợ">Ban Tài Chính &amp; Tài Trợ</option>
                  <option value="Ban Thiện Nguyện & Cộng Đồng">Ban Thiện Nguyện &amp; Cộng Đồng</option>
                  <option value="Ban Sự Kiện">Ban Sự Kiện</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Theme Sáng */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-600">
            {totalChannelsSelected === 0 ? (
              <span className="text-rose-600 font-medium">Chưa chọn kênh gửi nào</span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="size-3.5" /> Sẵn sàng phát tới {totalChannelsSelected} kênh
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={isSending || totalChannelsSelected === 0}
              onClick={handleBroadcast}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition shadow-md cursor-pointer ${
                isSending || totalChannelsSelected === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-white hover:brightness-105 shadow-blue-500/20"
              }`}
            >
              <Send className="size-3.5" />
              <span>{isSending ? "Đang phát thư mời..." : "Áp Dụng & Gửi Ngay"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
