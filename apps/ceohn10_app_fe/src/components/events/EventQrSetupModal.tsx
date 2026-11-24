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
  const [copiedRegLink, setCopiedRegLink] = useState(false);
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

  const origin = typeof window !== "undefined" ? window.location.origin : "https://ceohn10.viconnect.vn";
  const regUrl = `${origin}/guest-event-register/${event.id}`;
  const checkinUrl = `${origin}/guest-event-register/${event.id}?checkin=true`;

  const copyToClipboard = (text: string, type: "reg" | "checkin") => {
    navigator.clipboard.writeText(text);
    if (type === "reg") {
      setCopiedRegLink(true);
      setTimeout(() => setCopiedRegLink(false), 2000);
      toast.success("Đã sao chép link đăng ký sự kiện!");
    } else {
      setCopiedCheckinLink(true);
      setTimeout(() => setCopiedCheckinLink(false), 2000);
      toast.success("Đã sao chép link điểm danh check-in tại cửa!");
    }
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
        method: "PATCH",
        body: JSON.stringify({
          ticket_price: finalPrice,
          ticketPrice: finalPrice,
          is_paid: isPaidEvent,
          isPaid: isPaidEvent,
        }),
      });
      toast.success("Đã lưu cấu hình mã QR & Biểu mẫu sự kiện thành công!");
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
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-2xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <QrCode className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Cấu Hình 2 Mã QR Check-in &amp; Đăng Ký
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

        {/* 2 Mã QR Trực Quan: Đăng Ký vs Check-in */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Mã QR Đăng Ký Sự Kiện */}
          <div className="rounded-2xl border border-border bg-muted/20 p-5 flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-foreground">1. Mã QR Đăng Ký (Công Khai)</h3>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Dành cho khách mời &amp; học viên quét để xem thư mời Paxlaw, chọn vé và đăng ký tham gia.
            </p>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <QrCanvas
                value={regUrl}
                size={180}
                id="qr-reg-canvas"
                className="mx-auto"
              />
            </div>

            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadQr("qr-reg-canvas", `QR_DangKy_${event.id}`)}
                className="flex-1 py-2 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Tải Ảnh QR</span>
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(regUrl, "reg")}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs hover:bg-slate-800 transition cursor-pointer"
              >
                {copiedRegLink ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                <span>{copiedRegLink ? "Đã copy link" : "Copy Link"}</span>
              </button>
              <a
                href={regUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition"
                title="Mở trang đăng ký"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>

          {/* Card 2: Mã QR Soát Vé Check-in Điểm Danh */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <h3 className="text-sm font-bold text-foreground">2. Mã QR Check-in (Bàn Lễ Tân)</h3>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              In đặt tại cửa đón tiếp. Đại biểu quét mã này để hoàn tất điểm danh check-in và nhận số quay thưởng.
            </p>

            <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm">
              <QrCanvas
                value={checkinUrl}
                size={180}
                id="qr-checkin-canvas"
                className="mx-auto"
              />
            </div>

            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadQr("qr-checkin-canvas", `QR_Checkin_LeTan_${event.id}`)}
                className="flex-1 py-2 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Tải Ảnh QR</span>
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(checkinUrl, "checkin")}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                {copiedCheckinLink ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span>{copiedCheckinLink ? "Đã copy link" : "Copy Link"}</span>
              </button>
              <a
                href={checkinUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition"
                title="Mở cổng check-in"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
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
