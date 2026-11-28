import React, { useState, useEffect } from "react";
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  X,
  CreditCard,
  Sparkles,
  Ticket,
  SlidersHorizontal,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
} from "lucide-react";
import { QrCanvas } from "@/components/member/QrCanvas";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { getPublicAppOrigin } from "@/lib/qr";
import { formatVnd } from "@/lib/fees-data";

interface EventQrSetupModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function EventQrSetupModal({
  event,
  isOpen,
  onClose,
  onUpdated,
}: EventQrSetupModalProps) {
  const [copiedCheckinLink, setCopiedCheckinLink] = useState(false);
  const [isPaidEvent, setIsPaidEvent] = useState(false);
  const [ticketPrice, setTicketPrice] = useState(0);
  const [fastCheckin, setFastCheckin] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const defaultCheckinFormConfig = {
    logoUrl: "/ceohn10-official-logo.png",
    logoHeightPx: 56,
    accentColor: "#007AFF",
    enabledTabs: {
      member: true,
      ticket: true,
      walkin: true,
      checkout: true,
      checkedin_list: true,
      checkedout_list: true,
    },
    tabLabels: {
      member: "Học viên",
      ticket: "Có mã vé",
      walkin: "Khách mới",
      checkout: "Check-out",
      checkedin_list: "Đã Check-in",
      checkedout_list: "Đã Check-out",
    },
    sectionTitles: {
      member: "Check-in Học Viên",
      ticket: "Check-in Bằng Mã Vé",
      walkin: "Đăng Ký Khách Mới",
      checkout: "Check-out Sự Kiện",
    },
    memberPlaceholder: "Nhập mã học viên...",
    ticketPlaceholder: "Nhập mã vé...",
    submitButtonText: "Check-in",
    showProxyCheckin: true,
    bankName: "",
    bankAccount: "",
    bankOwner: "",
    customFields: [] as Array<{
      id: string;
      label: string;
      type: "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "email" | "phone";
      required: boolean;
      optionsText?: string;
    }>,
  };
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [savingFormConfig, setSavingFormConfig] = useState(false);
  const [checkinFormDraft, setCheckinFormDraft] = useState(defaultCheckinFormConfig);

  useEffect(() => {
    if (event) {
      const price = Number(event.ticketPrice || event.ticket_price || 0);
      setIsPaidEvent(price > 0);
      setTicketPrice(price);
      setShowFormEditor(false);
      if (isOpen && event.id) {
        fetchNestApi<any>(`/events/${encodeURIComponent(event.id)}/checkin-form-config`)
          .then((res) => {
            const cfg = res?.config;
            if (cfg && typeof cfg === "object") {
              setCheckinFormDraft({
                ...defaultCheckinFormConfig,
                ...cfg,
                enabledTabs: { ...defaultCheckinFormConfig.enabledTabs, ...(cfg.enabledTabs || {}) },
                tabLabels: { ...defaultCheckinFormConfig.tabLabels, ...(cfg.tabLabels || {}) },
                sectionTitles: { ...defaultCheckinFormConfig.sectionTitles, ...(cfg.sectionTitles || {}) },
                customFields: Array.isArray(cfg.customFields) ? cfg.customFields : [],
              });
            } else {
              setCheckinFormDraft(defaultCheckinFormConfig);
            }
          })
          .catch(() => setCheckinFormDraft(defaultCheckinFormConfig));
      }
    }
  }, [event, isOpen]);

  const handleApplyFormConfig = async () => {
    if (!event?.id) return;
    setSavingFormConfig(true);
    try {
      await fetchNestApi(`/events/${encodeURIComponent(event.id)}/checkin-form-config`, {
        method: "PUT",
        body: JSON.stringify({ config: checkinFormDraft }),
      });
      toast.success("Đã áp dụng & Public Form Check-in sự kiện!");
      setShowFormEditor(false);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      toast.error("Lỗi khi áp dụng Form Check-in: " + (err?.message || ""));
    } finally {
      setSavingFormConfig(false);
    }
  };

  if (!isOpen || !event) return null;

  const origin = getPublicAppOrigin();
  const checkinUrl = `${origin}/event-checkin?eventId=${event.id}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCheckinLink(true);
    setTimeout(() => setCopiedCheckinLink(false), 2000);
    toast.success("Đã sao chép link Mã QR Check-in!");
  };

  const handleDownloadQr = (elementId: string, filename: string) => {
    const canvas = document.getElementById(elementId) as HTMLCanvasElement;
    if (!canvas) {
      toast.error("Không tìm thấy canvas mã QR");
      return;
    }
    const a = document.createElement("a");
    a.download = `${filename}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
    toast.success(`Đã tải xuống ${filename}.png thành công!`);
  };

  const handleSaveSetup = async () => {
    setIsSaving(true);
    try {
      const finalPrice = isPaidEvent ? ticketPrice : 0;
      await fetchNestApi(`/events/${event.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ticket_price: finalPrice,
          ticketPrice: finalPrice,
          fee: finalPrice,
          is_paid: isPaidEvent,
          isPaid: isPaidEvent,
        }),
      });
      toast.success("Đã lưu cấu hình Mã QR Check-in & Phí sự kiện thành công!");
      if (onUpdated) onUpdated();
      onClose();
    } catch {
      toast.error("Lỗi khi lưu cấu hình sự kiện");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-2xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            {showFormEditor ? (
              <button
                type="button"
                onClick={() => setShowFormEditor(false)}
                className="p-2.5 rounded-2xl bg-blue-500/10 text-[#003B95] border border-blue-500/20 hover:bg-blue-500/20 transition cursor-pointer"
                title="Quay lại Mã QR Check-in"
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : (
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <QrCode className="size-6" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {showFormEditor
                  ? "Chỉnh sửa Form Check-in Sự Kiện"
                  : "Mã QR Check-in Sự Kiện (Duy Nhất)"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sự kiện: <span className="font-semibold text-foreground">{event.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {showFormEditor ? (
          <div className="space-y-5 text-xs">
            {/* 1. Header Logo & Màu nút chính */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-border bg-muted/30">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">
                  Chiều cao Logo Header CEO HN10 ({checkinFormDraft.logoHeightPx}px)
                </label>
                <input
                  type="range"
                  min={36}
                  max={96}
                  value={checkinFormDraft.logoHeightPx}
                  onChange={(e) =>
                    setCheckinFormDraft((prev) => ({
                      ...prev,
                      logoHeightPx: Number(e.target.value) || 56,
                    }))
                  }
                  className="w-full accent-[#007AFF]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Màu nút chính (iOS Liquid Glass)</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: "iOS Blue", color: "#007AFF" },
                    { label: "Obsidian", color: "#0B0D12" },
                    { label: "CEO HN10", color: "#003B95" },
                    { label: "Emerald", color: "#059669" },
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() =>
                        setCheckinFormDraft((prev) => ({ ...prev, accentColor: preset.color }))
                      }
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer inline-flex items-center gap-1.5 ${
                        checkinFormDraft.accentColor === preset.color
                          ? "border-foreground bg-card text-foreground shadow-xs"
                          : "border-border bg-card/60 text-muted-foreground"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: preset.color }} />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. 6 Danh mục hiện có trên Form Check-in */}
            <div className="space-y-2">
              <label className="font-bold text-foreground block">
                1. Các danh mục hiện có trên Form Check-in (Bật/Tắt &amp; Đổi nhãn)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    { key: "member" },
                    { key: "ticket" },
                    { key: "walkin" },
                    { key: "checkout" },
                    { key: "checkedin_list" },
                    { key: "checkedout_list" },
                  ] as const
                ).map(({ key }) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-xl border border-border bg-muted/20"
                  >
                    <input
                      type="checkbox"
                      checked={checkinFormDraft.enabledTabs[key]}
                      onChange={(e) =>
                        setCheckinFormDraft((prev) => ({
                          ...prev,
                          enabledTabs: { ...prev.enabledTabs, [key]: e.target.checked },
                        }))
                      }
                      className="rounded accent-[#007AFF] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={checkinFormDraft.tabLabels[key]}
                      onChange={(e) =>
                        setCheckinFormDraft((prev) => ({
                          ...prev,
                          tabLabels: { ...prev.tabLabels, [key]: e.target.value },
                        }))
                      }
                      className="flex-1 min-w-0 bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold text-foreground"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Các trường nhập liệu & Tiêu đề hiện có */}
            <div className="space-y-2">
              <label className="font-bold text-foreground block">
                2. Các trường &amp; Tiêu đề đang có trên Form Check-in
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Tiêu đề tab Học viên
                  </label>
                  <input
                    type="text"
                    value={checkinFormDraft.sectionTitles.member}
                    onChange={(e) =>
                      setCheckinFormDraft((prev) => ({
                        ...prev,
                        sectionTitles: { ...prev.sectionTitles, member: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Placeholder mã Học viên
                  </label>
                  <input
                    type="text"
                    value={checkinFormDraft.memberPlaceholder}
                    onChange={(e) =>
                      setCheckinFormDraft((prev) => ({ ...prev, memberPlaceholder: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Tiêu đề tab Có mã vé
                  </label>
                  <input
                    type="text"
                    value={checkinFormDraft.sectionTitles.ticket}
                    onChange={(e) =>
                      setCheckinFormDraft((prev) => ({
                        ...prev,
                        sectionTitles: { ...prev.sectionTitles, ticket: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Placeholder mã vé
                  </label>
                  <input
                    type="text"
                    value={checkinFormDraft.ticketPlaceholder}
                    onChange={(e) =>
                      setCheckinFormDraft((prev) => ({ ...prev, ticketPlaceholder: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Tiêu đề tab Khách mới
                  </label>
                  <input
                    type="text"
                    value={checkinFormDraft.sectionTitles.walkin}
                    onChange={(e) =>
                      setCheckinFormDraft((prev) => ({
                        ...prev,
                        sectionTitles: { ...prev.sectionTitles, walkin: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Chữ trên nút xác nhận
                  </label>
                  <input
                    type="text"
                    value={checkinFormDraft.submitButtonText}
                    onChange={(e) =>
                      setCheckinFormDraft((prev) => ({ ...prev, submitButtonText: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 font-semibold text-foreground cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={checkinFormDraft.showProxyCheckin}
                  onChange={(e) =>
                    setCheckinFormDraft((prev) => ({ ...prev, showProxyCheckin: e.target.checked }))
                  }
                  className="rounded accent-[#007AFF]"
                />
                <span>Cho phép nút &quot;+ Check-in hộ&quot; nhiều người cùng lúc</span>
              </label>
            </div>

            {/* 4. Tài khoản nhận phí CEO HN10 cho Khách mới */}
            <div className="space-y-2 pt-3 border-t border-border">
              <label className="font-bold text-foreground block">
                3. Tài khoản nhận phí CEO HN10 (Hiển thị + Xem QR cho Khách mới khi sự kiện có phí)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Ngân hàng (VD: MB Bank)"
                  value={checkinFormDraft.bankName}
                  onChange={(e) =>
                    setCheckinFormDraft((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Số tài khoản CEO HN10"
                  value={checkinFormDraft.bankAccount}
                  onChange={(e) =>
                    setCheckinFormDraft((prev) => ({ ...prev, bankAccount: e.target.value }))
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold font-mono"
                />
                <input
                  type="text"
                  placeholder="Chủ tài khoản"
                  value={checkinFormDraft.bankOwner}
                  onChange={(e) =>
                    setCheckinFormDraft((prev) => ({ ...prev, bankOwner: e.target.value }))
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                />
              </div>
            </div>

            {/* 5. Trường thông tin bổ sung */}
            <div className="space-y-2 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">
                  4. Trường thông tin bổ sung ({checkinFormDraft.customFields.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCheckinFormDraft((prev) => ({
                      ...prev,
                      customFields: [
                        ...prev.customFields,
                        {
                          id: `cf_${Date.now().toString(36)}`,
                          label: "Trường thông tin mới",
                          type: "text",
                          required: false,
                          optionsText: "",
                        },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#003B95] font-bold text-[11px] cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Thêm trường</span>
                </button>
              </div>

              {checkinFormDraft.customFields.map((cf, idx) => (
                <div key={cf.id} className="p-2.5 rounded-xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cf.label}
                      onChange={(e) =>
                        setCheckinFormDraft((prev) => ({
                          ...prev,
                          customFields: prev.customFields.map((item, i) =>
                            i === idx ? { ...item, label: e.target.value } : item,
                          ),
                        }))
                      }
                      placeholder="Tên trường..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold"
                    />
                    <select
                      value={cf.type}
                      onChange={(e) =>
                        setCheckinFormDraft((prev) => ({
                          ...prev,
                          customFields: prev.customFields.map((item, i) =>
                            i === idx ? { ...item, type: e.target.value as any } : item,
                          ),
                        }))
                      }
                      className="px-2 py-1.5 rounded-lg border border-border bg-background text-[11px]"
                    >
                      <option value="text">Văn bản</option>
                      <option value="number">Số</option>
                      <option value="select">Danh sách chọn</option>
                      <option value="phone">SĐT</option>
                      <option value="email">Email</option>
                    </select>
                    <label className="inline-flex items-center gap-1 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cf.required}
                        onChange={(e) =>
                          setCheckinFormDraft((prev) => ({
                            ...prev,
                            customFields: prev.customFields.map((item, i) =>
                              i === idx ? { ...item, required: e.target.checked } : item,
                            ),
                          }))
                        }
                      />
                      <span>Bắt buộc</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setCheckinFormDraft((prev) => ({
                          ...prev,
                          customFields: prev.customFields.filter((_, i) => i !== idx),
                        }))
                      }
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  {cf.type === "select" && (
                    <input
                      type="text"
                      value={cf.optionsText || ""}
                      onChange={(e) =>
                        setCheckinFormDraft((prev) => ({
                          ...prev,
                          customFields: prev.customFields.map((item, i) =>
                            i === idx ? { ...item, optionsText: e.target.value } : item,
                          ),
                        }))
                      }
                      placeholder="Các lựa chọn cách nhau dấu phẩy (VD: S, M, L)"
                      className="w-full px-2.5 py-1 rounded-lg border border-border bg-background text-[11px]"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Footer Editor */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setCheckinFormDraft(defaultCheckinFormConfig)}
                className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground transition cursor-pointer"
              >
                Khôi phục mặc định
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormEditor(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleApplyFormConfig}
                  disabled={savingFormConfig}
                  className="px-5 py-2 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="size-3.5" />
                  <span>{savingFormConfig ? "Đang áp dụng..." : "Áp dụng & Public"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
        {/* Duy nhất 1 Mã QR Check-in */}
        <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-6 flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <h3 className="text-base font-bold text-foreground">Mã QR Check-in Sự Kiện</h3>
          </div>
          <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
            Khi quét mã này sẽ mở cổng 2 phần: <strong>Phần 1</strong> (nhập Mã học viên hoặc Mã vé để Check-in) và <strong>Phần 2</strong> (danh mục Khách mới đến đăng ký vé &amp; thanh toán tự động Check-in).
          </p>

          <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm">
            <QrCanvas
              value={checkinUrl}
              size={200}
              id="qr-checkin-canvas"
              className="mx-auto"
            />
          </div>

          <code className="w-full max-w-md truncate rounded-xl bg-muted px-3 py-1.5 font-mono text-[11px] text-foreground">
            {checkinUrl}
          </code>

          <div className="w-full max-w-md flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadQr("qr-checkin-canvas", `QR_Checkin_${event.id}`)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Tải Ảnh QR</span>
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(checkinUrl)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                {copiedCheckinLink ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span>{copiedCheckinLink ? "Đã copy link" : "Copy Link"}</span>
              </button>
              <a
                href={checkinUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition"
                title="Mở cổng check-in"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
            <button
              type="button"
              onClick={() => setShowFormEditor(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-[#003B95]/30 bg-blue-50 hover:bg-blue-100 text-[#003B95] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Chỉnh sửa Form Check-in Sự Kiện</span>
            </button>
          </div>
        </div>

        {/* Thiết lập chế độ Phí vé & Điểm danh */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Thiết Lập Phí Vé &amp; Điểm Danh Nhanh
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground block">
                Chế độ phí tham dự sự kiện:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaidEvent(false)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    !isPaidEvent
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  Miễn Phí (0đ)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPaidEvent(true);
                    if (ticketPrice === 0) setTicketPrice(500000);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    isPaidEvent
                      ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  Có Thu Phí
                </button>
              </div>
            </div>

            {isPaidEvent && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">
                  Giá vé tiêu chuẩn (VNĐ):
                </label>
                <input
                  type="number"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(Number(e.target.value) || 0)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
                  placeholder="500000"
                  step="50000"
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span className="text-xs text-foreground font-medium">
                Tự động cấp mã số may mắn (Lucky Draw) khi hoàn tất check-in
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={fastCheckin}
                onChange={(e) => setFastCheckin(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary size-4 cursor-pointer"
              />
              <span className="font-semibold text-foreground">Điểm danh 1 chạm</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSaveSetup}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Đang lưu..." : "Lưu Cấu Hình"}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
