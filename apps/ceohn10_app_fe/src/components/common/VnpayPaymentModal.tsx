import { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  Building2,
  RefreshCw,
  QrCode,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export interface SepayPaymentModalProps {
  open: boolean;
  onClose: () => void;
  type: "event" | "fee";
  targetId: string; // registrationId or invoiceId
  eventId?: string;
  amount: number;
  title: string; // Event title or Invoice description
  attendeeName?: string;
  memberCode?: string;
  initialMethod?: string;
  onSuccess?: () => void;
}

export function SepayPaymentModal({
  open,
  onClose,
  type,
  targetId,
  eventId,
  amount,
  title,
  attendeeName,
  memberCode,
  onSuccess,
}: SepayPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Bank & QR info from SePay config
  const [bankInfo, setBankInfo] = useState({
    bankName: "MBBank (Ngân Hàng Quân Đội)",
    accountNumber: "198300000000",
    accountHolder: "CLB DOANH NHAN CEO HN10",
    memo: `CEOHN10_${type === "event" ? "SK" : "HP"}_${targetId}`,
    qrUrl: "",
  });

  useEffect(() => {
    if (!open || !targetId) {
      setPaymentSuccess(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const cleanMemo = `CEOHN10_${type === "event" ? "SK" : "HP"}_${targetId}`.replace(/[^A-Za-z0-9_]/g, "");
    const endpoint = type === "event" ? "/payment/create-event-checkout" : "/payment/create-fee-checkout";
    const payload = type === "event"
      ? { registrationId: targetId, eventId: eventId || "", amount, memberName: attendeeName, memberCode }
      : { invoiceId: targetId, amount, memberName: attendeeName, year: new Date().getFullYear() };

    fetchNestApi<any>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!isMounted) return;
        if (res && res.bankAccount) {
          setBankInfo({
            bankName: res.bankAccount.bankName || "MBBank",
            accountNumber: res.bankAccount.accountNumber || "198300000000",
            accountHolder: res.bankAccount.accountHolder || "CLB DOANH NHAN CEO HN10",
            memo: res.bankAccount.transferMemo || cleanMemo,
            qrUrl: res.qrImageUrl || `https://img.vietqr.io/image/MB-198300000000-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(cleanMemo)}&accountName=${encodeURIComponent("CLB DOANH NHAN CEO HN10")}`,
          });
        } else {
          setBankInfo((prev) => ({
            ...prev,
            memo: cleanMemo,
            qrUrl: `https://img.vietqr.io/image/MB-198300000000-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(cleanMemo)}&accountName=${encodeURIComponent("CLB DOANH NHAN CEO HN10")}`,
          }));
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setBankInfo((prev) => ({
          ...prev,
          memo: cleanMemo,
          qrUrl: `https://img.vietqr.io/image/MB-198300000000-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(cleanMemo)}&accountName=${encodeURIComponent("CLB DOANH NHAN CEO HN10")}`,
        }));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, targetId, type, eventId, amount, attendeeName, memberCode]);

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`Đã sao chép ${fieldName}!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleVerifyPayment = async () => {
    setChecking(true);
    try {
      // Giả lập kiểm tra hoặc gọi API tra cứu trạng thái
      const checkUrl = type === "event"
        ? `/events/ticket-status/${encodeURIComponent(targetId)}`
        : `/invoices/${encodeURIComponent(targetId)}`;

      const res = await fetchNestApi<any>(checkUrl).catch(() => null);
      if (res && (res.ticket?.paymentStatus === "paid" || res.ticket?.status === "confirmed" || res.status === "paid")) {
        setPaymentSuccess(true);
        toast.success("Hệ thống đã ghi nhận thanh toán thành công!");
        onSuccess?.();
      } else {
        toast.info("Đang chờ xác nhận giao dịch từ ngân hàng. Nếu Quý vị đã chuyển khoản thành công, hệ thống sẽ tự động kích hoạt vé trong ít phút.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi kiểm tra trạng thái thanh toán");
    } finally {
      setChecking(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 text-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Thanh Toán Tự Động SePay VietQR
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {title || (type === "event" ? "Thanh toán vé sự kiện" : "Thanh toán niên liễm")}
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

        {paymentSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Thanh Toán Hoàn Tất!</h4>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              Hệ thống đã ghi nhận tiền về quỹ và tự động kích hoạt quyền lợi vé tham gia sự kiện.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4 overflow-y-auto max-h-[75vh] pr-1">
            {/* Amount Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Số tiền cần thanh toán
                </span>
                <div className="text-2xl font-black text-emerald-600 tracking-tight mt-0.5">
                  {amount.toLocaleString("vi-VN")} VNĐ
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                Khớp Lệnh Tự Động 24/7
              </span>
            </div>

            {/* VietQR Image Container */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200">
              {loading ? (
                <div className="h-56 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              ) : bankInfo.qrUrl ? (
                <div className="space-y-2 text-center">
                  <img
                    src={bankInfo.qrUrl}
                    alt="SePay VietQR Code"
                    className="w-56 h-56 object-contain rounded-xl border border-slate-200 shadow-sm mx-auto bg-white p-1"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    Mở ứng dụng ngân hàng bất kỳ (MB, Vietcombank, Techcombank...) để quét mã
                  </p>
                </div>
              ) : null}
            </div>

            {/* Transfer Details Form */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Ngân hàng:</span>
                <span className="font-bold text-slate-800">{bankInfo.bankName}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">{bankInfo.accountNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankInfo.accountNumber, "Số tài khoản")}
                    className="p-1 rounded-md hover:bg-slate-200 text-slate-600"
                    title="Sao chép"
                  >
                    {copiedField === "Số tài khoản" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                <span className="font-bold text-slate-800">{bankInfo.accountHolder}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <div>
                  <span className="text-amber-800 font-semibold block">Nội dung chuyển khoản (Bắt buộc):</span>
                  <span className="font-mono font-bold text-blue-700 text-sm">{bankInfo.memo}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(bankInfo.memo, "Nội dung chuyển khoản")}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 transition"
                >
                  {copiedField === "Nội dung chuyển khoản" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>Sao chép</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleVerifyPayment}
                disabled={checking}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-60"
              >
                {checking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Kiểm Tra Thanh Toán</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Tương thích ngược: Export cả tên VnpayPaymentModal
export const VnpayPaymentModal = SepayPaymentModal;
export type { SepayPaymentModalProps as VnpayPaymentModalProps };
