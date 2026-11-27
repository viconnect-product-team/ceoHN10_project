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

  useEffect(() => {
    if (event) {
      const price = Number(event.ticketPrice || event.ticket_price || 0);
      setIsPaidEvent(price > 0);
      setTicketPrice(price);
    }
  }, [event]);

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
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <QrCode className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Mã QR Check-in Sự Kiện (Duy Nhất)
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

          <div className="w-full max-w-md flex items-center gap-2">
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
      </div>
    </div>
  );
}
