import React from "react";
import { Plus, Trash2, Clock, Sparkles, Utensils } from "lucide-react";
import { VndCurrencyInput } from "@/components/dashboard/VndCurrencyInput";

export interface EventSubItem {
  time: string;
  title: string;
}

export interface EventPartConfig {
  id: string;
  name: string;
  fee: number;
  guestFee?: number;
  isPaid?: boolean;
  isParty?: boolean;
  items: EventSubItem[];
}

export function createDefaultCeoHn10Parts(): EventPartConfig[] {
  return [
    {
      id: "part_1",
      name: "Lễ Khai Giảng CEO HN10",
      fee: 0,
      guestFee: 0,
      isPaid: false,
      isParty: false,
      items: [
        { time: "08:00 - 08:30", title: "Đón khách & giao lưu" },
        { time: "08:30 - 11:30", title: "Lễ Khai Giảng CEO HN10" },
      ],
    },
    {
      id: "part_2",
      name: "Dự Tiệc Chúc Mừng",
      fee: 1000,
      guestFee: 0,
      isPaid: true,
      isParty: true,
      items: [{ time: "11:30 - 14:00", title: "Tiệc trưa chúc mừng & kết nối B2B" }],
    },
  ];
}

export function EventPartsEditor({
  venueName,
  onChangeVenueName,
  parts,
  onChangeParts,
  hidePriceInputs = false,
}: {
  venueName: string;
  onChangeVenueName: (v: string) => void;
  parts: EventPartConfig[];
  onChangeParts: (next: EventPartConfig[]) => void;
  hidePriceInputs?: boolean;
}) {
  const safeParts = Array.isArray(parts) ? parts : [];

  const addPart = () => {
    const idx = safeParts.length + 1;
    onChangeParts([
      ...safeParts,
      {
        id: `part_${Date.now()}_${idx}`,
        name: `Phần ${idx}: Chương trình`,
        fee: 0,
        guestFee: 0,
        isPaid: false,
        isParty: false,
        items: [{ time: "18:30", title: "Hoạt động chính" }],
      },
    ]);
  };

  const updatePart = (idx: number, patch: Partial<EventPartConfig>) => {
    const next = safeParts.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onChangeParts(next);
  };

  const removePart = (idx: number) => {
    onChangeParts(safeParts.filter((_, i) => i !== idx));
  };

  const addSubItem = (partIdx: number) => {
    const target = safeParts[partIdx];
    if (!target) return;
    updatePart(partIdx, {
      items: [...(target.items || []), { time: "", title: "" }],
    });
  };

  const updateSubItem = (partIdx: number, subIdx: number, patch: Partial<EventSubItem>) => {
    const target = safeParts[partIdx];
    if (!target) return;
    const nextItems = (target.items || []).map((it, j) => (j === subIdx ? { ...it, ...patch } : it));
    updatePart(partIdx, { items: nextItems });
  };

  const removeSubItem = (partIdx: number, subIdx: number) => {
    const target = safeParts[partIdx];
    if (!target) return;
    updatePart(partIdx, {
      items: (target.items || []).filter((_, j) => j !== subIdx),
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Cấu Hình Hội Trường &amp; Các Phần Chương Trình (Thư Mời / RSVP)
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Chia rõ từng phần (VD: Phần 1 Lễ Khai Giảng, Phần 2 Dự Tiệc). Mỗi phần có mốc thời gian và mức phí vé riêng (0đ = Miễn phí).
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChangeParts(createDefaultCeoHn10Parts())}
          className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
        >
          <Sparkles className="h-3 w-3" />
          Nạp mẫu Lễ + Tiệc
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">
          Tên Hội trường / Phòng tổ chức (hiện nổi bật trên Thư mời)
        </label>
        <input
          type="text"
          value={venueName}
          onChange={(e) => onChangeVenueName(e.target.value)}
          placeholder="VD: Grand Plaza, Avenir Grand, Ballroom Melia..."
          className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground"
        />
      </div>

      <div className="space-y-3">
        {safeParts.map((part, pIdx) => (
          <div
            key={part.id || pIdx}
            className="rounded-xl border border-border bg-card p-3.5 space-y-3 shadow-2xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-900 text-white">
                  Phần {pIdx + 1}
                </span>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!part.isParty}
                    onChange={(e) => updatePart(pIdx, { isParty: e.target.checked })}
                    className="rounded border-border"
                  />
                  <Utensils className="h-3 w-3 text-amber-600" />
                  <span>Là phần Tiệc (đếm suất ăn)</span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => removePart(pIdx)}
                className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg cursor-pointer"
                title="Xóa phần này"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className={hidePriceInputs ? "sm:col-span-7" : "sm:col-span-6"}>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Tên phần chương trình chính
                </label>
                <input
                  type="text"
                  value={part.name}
                  onChange={(e) => updatePart(pIdx, { name: e.target.value })}
                  placeholder="VD: Lễ Khai Giảng CEO HN10 / Dự Tiệc"
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground"
                />
              </div>

              {hidePriceInputs ? (
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Hình thức vé của phần này (Giá vé cấu hình ở Bước 2)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updatePart(pIdx, { isPaid: false, fee: 0, guestFee: 0 })}
                      className={`flex-1 h-9 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        !(part.isPaid ?? Number(part.fee || 0) > 0)
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Miễn phí
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePart(pIdx, { isPaid: true })}
                      className={`flex-1 h-9 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        part.isPaid ?? Number(part.fee || 0) > 0
                          ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Có thu phí
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                      Vé Khách mời (0 = Free)
                    </label>
                    <VndCurrencyInput
                      value={Number(part.guestFee ?? 0)}
                      onChange={(val) => updatePart(pIdx, { guestFee: Number(String(val).replace(/\D/g, "")) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Vé Khách khác (VNĐ)
                    </label>
                    <VndCurrencyInput
                      value={Number(part.fee || 0)}
                      onChange={(val) => {
                        const num = Number(String(val).replace(/\D/g, "")) || 0;
                        updatePart(pIdx, { fee: num, isPaid: num > 0 });
                      }}
                      placeholder="0"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Các mốc giờ bên trong phần */}
            <div className="space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Các mốc thời gian trong phần này:
                </span>
                <button
                  type="button"
                  onClick={() => addSubItem(pIdx)}
                  className="text-[11px] font-bold text-[#003B95] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Thêm mốc giờ
                </button>
              </div>
              {(part.items || []).map((it, sIdx) => (
                <div key={sIdx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={it.time}
                    onChange={(e) => updateSubItem(pIdx, sIdx, { time: e.target.value })}
                    placeholder="08:00 - 08:30"
                    className="col-span-4 h-8 rounded-lg border border-border bg-background px-2 text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={it.title}
                    onChange={(e) => updateSubItem(pIdx, sIdx, { title: e.target.value })}
                    placeholder="Đón khách & giao lưu"
                    className="col-span-7 h-8 rounded-lg border border-border bg-background px-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeSubItem(pIdx, sIdx)}
                    className="col-span-1 text-slate-400 hover:text-rose-600 flex justify-center cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addPart}
          className="w-full py-2 rounded-xl border border-dashed border-border hover:border-[#003B95] text-xs font-bold text-muted-foreground hover:text-[#003B95] flex items-center justify-center gap-1.5 cursor-pointer transition"
        >
          <Plus className="h-4 w-4" /> Thêm Phần Chương Trình Mới
        </button>
      </div>
    </div>
  );
}
