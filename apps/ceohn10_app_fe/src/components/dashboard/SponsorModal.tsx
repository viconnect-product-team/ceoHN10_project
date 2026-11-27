import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Handshake,
  X,
  Sparkles,
  Coins,
  Gift,
  Heart,
  Plus,
  Building2,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import type { Sponsor, PackageType, InKindItem } from "@/lib/sponsors.functions";
import { VndCurrencyInput } from "@/components/dashboard/VndCurrencyInput";

export interface InKindItemDraft {
  name: string;
  quantity: number;
  unit: string;
  estimatedValue: number;
}

export interface SponsorDraft {
  name: string;
  companyName?: string;
  website?: string;
  birthDate?: string;
  age?: number;
  sponsorType: "regular" | "new";
  packageType: PackageType;
  inKindDescription?: string; // Nội dung / Diễn giải tài trợ mở rộng
  inKindItems?: InKindItemDraft[];
  tier: Sponsor["tier"];
  contact: string;
  email: string;
  phone: string;
  amount: number;
  since: string;
  status: "active" | "expired";
}

interface SponsorModalProps {
  open: boolean;
  initial?: Sponsor | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (draft: SponsorDraft) => void;
}

const inputCls =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 text-foreground";
const labelCls = "mb-1.5 block text-xs font-semibold text-foreground";

export function SponsorModal({
  open,
  initial,
  submitting = false,
  onClose,
  onSubmit,
}: SponsorModalProps) {
  const t = useT();

  const [draft, setDraft] = useState<SponsorDraft>({
    name: "",
    companyName: "",
    website: "",
    birthDate: "",
    age: undefined,
    sponsorType: "regular",
    packageType: "cash",
    inKindDescription: "",
    inKindItems: [],
    tier: "bronze",
    contact: "",
    email: "",
    phone: "",
    amount: 20000000,
    since: new Date().toISOString().slice(0, 10),
    status: "active",
  });

  useEffect(() => {
    if (open) {
      if (initial) {
        setDraft({
          name: initial.name || "",
          companyName: initial.companyName || "",
          website: initial.website || "",
          birthDate: initial.birthDate || "",
          age: initial.age,
          sponsorType: initial.sponsorType || "regular",
          packageType: initial.packageType || "cash",
          inKindDescription: initial.inKindDescription || "",
          inKindItems: initial.inKindItems || [],
          tier: initial.tier || "bronze",
          contact: initial.contact || "",
          email: initial.email || "",
          phone: initial.phone || "",
          amount: initial.amount || 0,
          since: initial.since || new Date().toISOString().slice(0, 10),
          status: initial.status || "active",
        });
      } else {
        setDraft({
          name: "",
          companyName: "",
          website: "",
          birthDate: "",
          age: undefined,
          sponsorType: "regular",
          packageType: "cash",
          inKindDescription: "",
          inKindItems: [],
          tier: "bronze",
          contact: "",
          email: "",
          phone: "",
          amount: 20000000,
          since: new Date().toISOString().slice(0, 10),
          status: "active",
        });
      }
    }
  }, [open, initial]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const isCurrentInKind = draft.packageType === "in_kind" || draft.packageType === "charity_in_kind";
  const isCharity = draft.packageType === "charity_cash" || draft.packageType === "charity_in_kind";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      toast.error("Vui lòng nhập tên Doanh nghiệp / Tổ chức tài trợ");
      return;
    }
    if (!draft.inKindDescription?.trim()) {
      toast.error("Vui lòng điền nội dung tài trợ cụ thể");
      return;
    }
    onSubmit(draft);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto w-screen h-screen"
      role="dialog"
      aria-modal="true"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="relative flex flex-col w-full max-w-2xl my-auto rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[92vh] z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {initial ? "Chỉnh Sửa Nhà Tài Trợ" : "Tiếp Nhận & Khai Báo Nhà Tài Trợ"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Phân loại chính xác nguồn Quỹ (Tiền mặt / Hiện vật / Quỹ Thiện nguyện) &amp; Nhập nội dung tài trợ mở rộng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5 overscroll-contain">
            {/* 1. CHỌN LOẠI TÀI TRỢ (BẮT BUỘC): PHÂN ĐỊNH TIỀN MẶT, HIỆN VẬT, QUỸ THIỆN NGUYỆN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>
                  Loại Tài Trợ &amp; Mục Đích Quỹ <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {isCharity ? "❤️ Quỹ Thiện Nguyện (CSR)" : "🏢 Quỹ Hoạt Động & Sự Kiện"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Quỹ Hoạt động - Tiền mặt */}
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, packageType: "cash" }))}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                    draft.packageType === "cash" || draft.packageType === "bank_transfer"
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 font-bold"
                      : "border-border bg-card hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Coins className="h-5 w-5 mb-1 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold leading-tight">Quỹ Hoạt Động</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    Mục Tiền mặt
                  </span>
                </button>

                {/* 2. Quỹ Hoạt động - Hiện vật */}
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, packageType: "in_kind" }))}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                    draft.packageType === "in_kind"
                      ? "border-blue-600 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30 font-bold"
                      : "border-border bg-card hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Gift className="h-5 w-5 mb-1 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold leading-tight">Quỹ Hoạt Động</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                    Mục Hiện vật
                  </span>
                </button>

                {/* 3. Quỹ Thiện nguyện - Tiền mặt */}
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, packageType: "charity_cash" }))}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                    draft.packageType === "charity_cash"
                      ? "border-rose-600 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30 font-bold"
                      : "border-border bg-card hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Heart className="h-5 w-5 mb-1 text-rose-600 dark:text-rose-400" />
                  <span className="text-xs font-bold leading-tight">Quỹ Thiện Nguyện</span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                    Mục Tiền mặt (CSR)
                  </span>
                </button>

                {/* 4. Quỹ Thiện nguyện - Hiện vật */}
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, packageType: "charity_in_kind" }))}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                    draft.packageType === "charity_in_kind"
                      ? "border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30 font-bold"
                      : "border-border bg-card hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Gift className="h-5 w-5 mb-1 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold leading-tight">Quỹ Thiện Nguyện</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                    Mục Hiện vật (CSR)
                  </span>
                </button>
              </div>
            </div>

            {/* 2. MỞ RỘNG TỰ ĐIỀN NỘI DUNG TÀI TRỢ (BẮT BUỘC) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls} htmlFor="sp-content">
                  Nội Dung / Diễn Giải Tài Trợ <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10.5px] text-muted-foreground italic">
                  Không áp đặt gói cứng, tự do mô tả chi tiết cam kết
                </span>
              </div>
              <textarea
                id="sp-content"
                rows={3}
                required
                value={draft.inKindDescription || ""}
                onChange={(e) => setDraft((d) => ({ ...d, inKindDescription: e.target.value }))}
                placeholder={
                  isCharity
                    ? "Ví dụ: Tài trợ kinh phí xây dựng điểm trường Bản Mù Mù Cang Chải / 500 suất quà tết cho hộ nghèo..."
                    : isCurrentInKind
                    ? "Ví dụ: Tài trợ 200 áo đồng phục Gala kết nối, 50 lẵng hoa tươi và quà tặng đại biểu..."
                    : "Ví dụ: Tài trợ kinh phí tổ chức sự kiện Business Matching HN10 Quý 3 / Hỗ trợ công tác truyền thông CEOHN10..."
                }
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>

            {/* 3. SỐ TIỀN / GIÁ TRỊ QUY ĐỔI HIỆN VẬT THỰC TẾ (VNĐ) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="sp-amount">
                  {isCurrentInKind
                    ? "Tổng Giá Trị Hiện Vật Quy Đổi Thực Tế (VNĐ)"
                    : "Số Tiền Tài Trợ Thực Tế (VNĐ)"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10.5px] text-muted-foreground">
                  {isCharity ? "Ghi nhận vào Quỹ Thiện Nguyện (CSR)" : "Ghi nhận vào Quỹ Hoạt Động & Sự Kiện"}
                </span>
              </div>
              <VndCurrencyInput
                id="sp-amount"
                value={draft.amount}
                onChange={(val) => setDraft((d) => ({ ...d, amount: val }))}
                placeholder="Nhập số tiền hoặc giá trị quy đổi (Ví dụ: 50.000.000)"
                required
              />
            </div>

            {/* 4. KÊ KHAI DANH MỤC VẬT PHẨM NẾU CHỌN HIỆN VẬT */}
            {isCurrentInKind && (
              <div className="space-y-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Gift className="h-4 w-4 text-amber-600" />
                    <span>Danh Mục Vật Phẩm Hiện Vật Cụ Thể (Kho Quỹ Hiện Vật)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const current = draft.inKindItems || [];
                      setDraft({
                        ...draft,
                        inKindItems: [
                          ...current,
                          { name: "", quantity: 1, unit: "chiếc", estimatedValue: 0 },
                        ],
                      });
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm vật phẩm</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(draft.inKindItems || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-background p-2 rounded-lg border border-border"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...(draft.inKindItems || [])];
                            updated[idx].name = e.target.value;
                            setDraft({ ...draft, inKindItems: updated });
                          }}
                          placeholder="Tên hiện vật (VD: 200 Áo đồng phục)"
                          className="h-8 w-full rounded-lg border border-border px-2 text-xs bg-background text-foreground"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value) || 1);
                            const updated = [...(draft.inKindItems || [])];
                            updated[idx].quantity = val;
                            const total = updated.reduce(
                              (sum, it) => sum + (Number(it.estimatedValue) || 0) * (Number(it.quantity) || 1),
                              0
                            );
                            setDraft({ ...draft, inKindItems: updated, amount: total > 0 ? total : draft.amount });
                          }}
                          placeholder="SL"
                          className="h-8 w-full rounded-lg border border-border px-2 text-xs bg-background text-foreground"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => {
                            const updated = [...(draft.inKindItems || [])];
                            updated[idx].unit = e.target.value;
                            setDraft({ ...draft, inKindItems: updated });
                          }}
                          placeholder="ĐVT"
                          className="h-8 w-full rounded-lg border border-border px-2 text-xs bg-background text-foreground"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={0}
                          value={item.estimatedValue}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            const updated = [...(draft.inKindItems || [])];
                            updated[idx].estimatedValue = val;
                            const total = updated.reduce(
                              (sum, it) => sum + (Number(it.estimatedValue) || 0) * (Number(it.quantity) || 1),
                              0
                            );
                            setDraft({ ...draft, inKindItems: updated, amount: total > 0 ? total : draft.amount });
                          }}
                          placeholder="Giá trị"
                          className="h-8 w-full rounded-lg border border-border px-2 text-xs bg-background text-foreground"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (draft.inKindItems || []).filter((_, i) => i !== idx);
                            const total = updated.reduce(
                              (sum, it) => sum + (Number(it.estimatedValue) || 0) * (Number(it.quantity) || 1),
                              0
                            );
                            setDraft({ ...draft, inKindItems: updated, amount: total > 0 ? total : draft.amount });
                          }}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Xóa vật phẩm"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. THÔNG TIN DOANH NGHIỆP / TỔ CHỨC TÀI TRỢ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={labelCls} htmlFor="sp-name">
                  Tên Doanh nghiệp / Tổ chức <span className="text-rose-500">*</span>
                </label>
                <input
                  id="sp-name"
                  type="text"
                  required
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      name: e.target.value,
                      companyName: draft.companyName || e.target.value,
                    })
                  }
                  placeholder="Ví dụ: Công ty Cổ phần AlphaTech"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="sp-website">
                  Website / Cổng thông tin
                </label>
                <input
                  id="sp-website"
                  type="url"
                  value={draft.website || ""}
                  onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                  placeholder="https://alphatech.vn"
                  className={inputCls}
                />
              </div>
            </div>

            {/* 6. ĐẠI DIỆN LIÊN HỆ, EMAIL & SỐ ĐIỆN THOẠI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className={labelCls} htmlFor="sp-contact">
                  Họ tên người đại diện
                </label>
                <input
                  id="sp-contact"
                  type="text"
                  value={draft.contact}
                  onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="sp-email">
                  Email liên hệ
                </label>
                <input
                  id="sp-email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  placeholder="doitac@alphatech.vn"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="sp-phone">
                  Số điện thoại
                </label>
                <input
                  id="sp-phone"
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  placeholder="0912 345 678"
                  className={inputCls}
                />
              </div>
            </div>

            {/* 7. PHÂN LOẠI ĐỐI TÁC, NGÀY THAM GIA & TRẠNG THÁI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className={labelCls} htmlFor="sp-type">
                  Phân loại đối tác
                </label>
                <select
                  id="sp-type"
                  value={draft.sponsorType}
                  onChange={(e) =>
                    setDraft({ ...draft, sponsorType: e.target.value as "regular" | "new" })
                  }
                  className={inputCls}
                >
                  <option value="regular">★ Thường xuyên ổn định</option>
                  <option value="new">✦ Nhà tài trợ mới</option>
                </select>
              </div>

              <div>
                <label className={labelCls} htmlFor="sp-since">
                  Ngày tiếp nhận tài trợ
                </label>
                <input
                  id="sp-since"
                  type="date"
                  value={draft.since}
                  onChange={(e) => setDraft({ ...draft, since: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="sp-status">
                  Trạng thái
                </label>
                <select
                  id="sp-status"
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({ ...draft, status: e.target.value as "active" | "expired" })
                  }
                  className={inputCls}
                >
                  <option value="active">Đang hiệu lực</option>
                  <option value="expired">Đã tất toán / hết hạn</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between gap-2.5 border-t border-border px-5 py-3.5 bg-muted/20 shrink-0">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>
                {isCharity
                  ? "Tự động cộng vào Quỹ Thiện Nguyện (CSR)"
                  : "Tự động cộng vào Quỹ Hoạt Động &amp; Sự Kiện"}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl px-5 py-2 text-xs font-bold text-primary-foreground shadow-md transition cursor-pointer disabled:opacity-60"
                style={{ background: "var(--gradient-primary)" }}
              >
                {submitting ? "Đang lưu..." : initial ? "Lưu thay đổi" : "Khai Báo & Tiếp Nhận"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
