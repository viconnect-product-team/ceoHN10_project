import React, { useState } from "react";
import {
  X,
  QrCode,
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Power,
  ShieldCheck,
  CreditCard,
  Camera,
  MessageSquare,
  Sparkles,
  Download,
  Info,
} from "lucide-react";
import { QrCanvas } from "@/components/member/QrCanvas";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import type { EventItem } from "@/lib/events.functions";

export type EventQrType = "register" | "checkin" | "payment" | "gallery" | "survey" | "custom";

export interface EventQrConfigItem {
  id: string;
  type: EventQrType;
  label: string;
  description: string;
  targetUrl: string;
  isActive: boolean;
  isPrimary?: boolean;
}

interface EventQrConfigModalProps {
  open: boolean;
  event: EventItem | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function EventQrConfigModal({
  open,
  event,
  onClose,
  onSaved,
}: EventQrConfigModalProps) {
  if (!open || !event) return null;

  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://crm.ceohn10.viconnect.vn";

  const defaultQrConfigs: EventQrConfigItem[] = [
    {
      id: "qr-reg",
      type: "register",
      label: "Mã Đăng Ký Tại Cửa (Walk-in)",
      description: "Dành cho khách chưa đăng ký quét Zalo / Camera để mở form đăng ký nhanh kèm VietQR SePay.",
      targetUrl: `${origin}/guest-event-register/${event.id}?source=walkin`,
      isActive: true,
      isPrimary: true,
    },
    {
      id: "qr-checkin",
      type: "checkin",
      label: "Mã Check-in / Soát Vé Ban Tổ Chức",
      description: "Dành cho Ban Truyền Thông / Lễ Tân mở giao diện quét vé đại biểu (có hỗ trợ Offline khi mất sóng).",
      targetUrl: `${origin}/event-checkin?eventId=${event.id}`,
      isActive: true,
      isPrimary: false,
    },
    {
      id: "qr-payment",
      type: "payment",
      label: "Mã Thanh Toán Phí Sự Kiện (SePay)",
      description: "Mã VietQR động tự động nhận diện thanh toán vé sự kiện qua SePay.",
      targetUrl: `${origin}/guest-event-register/${event.id}?tab=payment`,
      isActive: false,
      isPrimary: false,
    },
    {
      id: "qr-gallery",
      type: "gallery",
      label: "Mã Xem Ảnh Trực Tiếp (Live Photo Gallery)",
      description: "Dành cho khách quét để xem và tải ảnh sự kiện được ban media tải lên trực tiếp.",
      targetUrl: `${origin}/event-checkin?eventId=${event.id}&tab=gallery`,
      isActive: true,
      isPrimary: false,
    },
    {
      id: "qr-survey",
      type: "survey",
      label: "Mã Đánh Giá & Khảo Sát Cuối Sự Kiện",
      description: "Dành cho khách quét sau khi kết thúc để gửi phản hồi và chấm điểm sự kiện.",
      targetUrl: `${origin}/guest-event-feedback/${event.id}`,
      isActive: false,
      isPrimary: false,
    },
  ];

  const [qrItems, setQrItems] = useState<EventQrConfigItem[]>(() => {
    try {
      const saved = localStorage.getItem(`ceohn10_event_qrs_${event.id}`);
      if (saved) return JSON.parse(saved);
    } catch { }
    return defaultQrConfigs;
  });

  const [selectedPreviewId, setSelectedPreviewId] = useState<string>(qrItems[0]?.id || "qr-reg");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<EventQrType>("custom");
  const [newUrl, setNewUrl] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedQr = qrItems.find((q) => q.id === selectedPreviewId) || qrItems[0];

  const handleToggleActive = (id: string) => {
    const updated = qrItems.map((q) => {
      if (q.id === id) {
        return { ...q, isActive: !q.isActive };
      }
      return q;
    });
    setQrItems(updated);
  };

  const handleSetPrimary = (id: string) => {
    const updated = qrItems.map((q) => ({
      ...q,
      isPrimary: q.id === id,
    }));
    setQrItems(updated);
    toast.success("Đã đặt làm Mã QR đại diện chính cho sự kiện!");
  };

  const handleAddNewQr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newUrl.trim()) {
      toast.error("Vui lòng nhập tên mã QR và đường link URL đích!");
      return;
    }
    const newId = `qr-custom-${Date.now()}`;
    const newQr: EventQrConfigItem = {
      id: newId,
      type: newType,
      label: newLabel.trim(),
      description: newDesc.trim() || "Mã QR tùy chỉnh sự kiện",
      targetUrl: newUrl.trim(),
      isActive: true,
      isPrimary: false,
    };
    const updated = [...qrItems, newQr];
    setQrItems(updated);
    setSelectedPreviewId(newId);
    setShowAddForm(false);
    setNewLabel("");
    setNewUrl("");
    setNewDesc("");
    toast.success("Đã thêm mã QR mới thành công!");
  };

  const handleDeleteQr = (id: string) => {
    if (qrItems.length <= 1) {
      toast.error("Sự kiện cần tối thiểu 1 mã QR!");
      return;
    }
    const updated = qrItems.filter((q) => q.id !== id);
    setQrItems(updated);
    if (selectedPreviewId === id) {
      setSelectedPreviewId(updated[0]?.id || "");
    }
    toast.info("Đã xóa mã QR khỏi cấu hình sự kiện");
  };

  const handleSaveConfigs = async () => {
    setSaving(true);
    try {
      localStorage.setItem(`ceohn10_event_qrs_${event.id}`, JSON.stringify(qrItems));
      // Optionally sync to backend event record
      await fetchNestApi(`/events/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          qrConfigs: qrItems,
        }),
      }).catch(() => { });

      toast.success("Đã lưu cấu hình danh sách Mã QR Sự Kiện thành công!");
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu cấu hình mã QR");
    } finally {
      setSaving(false);
    }
  };

  const getTypeBadge = (type: EventQrType) => {
    switch (type) {
      case "register":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">Đăng Ký</span>;
      case "checkin":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">Soát Vé Check-in</span>;
      case "payment":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">SePay Thanh Toán</span>;
      case "gallery":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">Album Live</span>;
      case "survey":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">Khảo Sát</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Tùy Biến</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#002B70] to-blue-600 text-white shadow-md shadow-blue-900/20">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-foreground">
                  Cấu Hình Mã QR Đính Vào Sự Kiện
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {qrItems.filter((q) => q.isActive).length}/{qrItems.length} Mã Đang Bật
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                {event.name} • Chỉ hiển thị những mã QR cần thiết, tránh gây rối mắt cho đại biểu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-secondary transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Split */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Left Column: QR List & Toggle */}
          <div className="md:col-span-7 p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Danh Sách Mã QR Sự Kiện
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm Mã QR Mới</span>
              </button>
            </div>

            {/* Add Custom QR Form */}
            {showAddForm && (
              <form onSubmit={handleAddNewQr} className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    Thêm Mã QR Tùy Chỉnh Cho Sự Kiện
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Đóng
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Loại Mã (Type)</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as EventQrType)}
                      className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium"
                    >
                      <option value="register">Đăng ký (Register)</option>
                      <option value="checkin">Check-in Soát vé</option>
                      <option value="payment">Thanh toán SePay</option>
                      <option value="gallery">Album ảnh Live</option>
                      <option value="survey">Khảo sát đánh giá</option>
                      <option value="custom">Tùy biến (Custom Link)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Tên Hiển Thị (Label)</label>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="VD: Quét Xem Menu Tiệc"
                      className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Đường Link URL Đích</label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Mô Tả Ngắn</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="VD: Dành cho đại biểu xem sơ đồ món ăn..."
                    className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Xác Nhận Thêm Mã
                  </button>
                </div>
              </form>
            )}

            {/* List Cards */}
            <div className="space-y-2.5">
              {qrItems.map((item) => {
                const isSelected = item.id === selectedPreviewId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPreviewId(item.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer relative ${
                      isSelected
                        ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 shadow-xs"
                        : "bg-card border-border hover:border-slate-300 dark:hover:border-slate-700"
                    } ${!item.isActive ? "opacity-60 grayscale-[40%]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${item.isActive ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                          <QrCode className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {item.label}
                            </span>
                            {getTypeBadge(item.type)}
                            {item.isPrimary && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs">
                                ★ Đại diện chính
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-1 truncate max-w-sm">
                            {item.targetUrl}
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item.id)}
                          className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            item.isActive
                              ? "bg-emerald-500 text-white border-emerald-600 shadow-2xs"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700"
                          }`}
                          title={item.isActive ? "Đang bật (Click để tắt)" : "Đang tắt (Click để bật)"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        {!item.isPrimary && item.isActive && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(item.id)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-500 transition cursor-pointer"
                            title="Đặt làm mã QR chính"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {item.type === "custom" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteQr(item.id)}
                            className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                            title="Xóa mã này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Preview & Standee View */}
          <div className="md:col-span-5 p-5 flex flex-col items-center justify-center bg-muted/20 text-center space-y-4">
            {selectedQr ? (
              <div className="w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Xem Trước Bản In & Standee
                  </span>
                  {selectedQr.isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Đang kích hoạt
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-500">
                      Đã ẩn khỏi sự kiện
                    </span>
                  )}
                </div>

                {/* QR Display Card */}
                <div className="p-4 rounded-3xl bg-white shadow-xl border border-slate-200 flex flex-col items-center">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                    CLB DOANH NHÂN CEO HN10
                  </div>
                  <div className="p-2 bg-white rounded-2xl">
                    <QrCanvas value={selectedQr.targetUrl} size={180} />
                  </div>
                  <h4 className="mt-3 text-xs font-black text-slate-900 uppercase">
                    {selectedQr.label}
                  </h4>
                  <p className="text-[10px] text-slate-500 max-w-xs mt-1">
                    {selectedQr.description}
                  </p>
                </div>

                {/* Copy Link & Direct Open */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedQr.targetUrl);
                      toast.success(`Đã sao chép link ${selectedQr.label}!`);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/80 transition cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Sao Chép Link</span>
                  </button>
                  <a
                    href={selectedQr.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Mở Thử Nghiệm</span>
                  </a>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 text-left flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Chỉ những mã QR được <strong>BẬT</strong> mới xuất hiện trên màn hình tiếp đón và các standee tự động của sự kiện.
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Vui lòng chọn một mã QR để xem chi tiết
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3.5 bg-muted/40">
          <span className="text-xs text-muted-foreground font-medium">
            Mọi thay đổi sẽ được áp dụng ngay cho standee và cổng tiếp đón
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleSaveConfigs}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#002B70] hover:bg-blue-800 text-white text-xs font-black shadow-md shadow-blue-900/20 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? "Đang Lưu..." : "Lưu Cấu Hình Mã QR"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
