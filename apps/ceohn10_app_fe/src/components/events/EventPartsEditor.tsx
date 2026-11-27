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
  capacity?: number;
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
      capacity: 100,
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
      capacity: 100,
      fee: 2000,
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

  const addPart = (customName?: string, isPartyPreset?: boolean) => {
    const idx = safeParts.length + 1;
    onChangeParts([
      ...safeParts,
      {
        id: `part_${Date.now()}_${idx}`,
        name: customName ?? "",
        capacity: 100,
        fee: 0,
        guestFee: 0,
        isPaid: false,
        isParty: Boolean(isPartyPreset),
        items: [{ time: "", title: "" }],
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
            Cấu Hình Hội Trường &amp; Các Phần Chương Trình ({safeParts.length} phần)
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Không tự động cố định Tọa đàm hay Tiệc. Bạn bấm thêm phần nào thì giao diện cấu hình phần đó mới hiển thị ra.
          </p>
        </div>
        <button
          type="button"
          onClick={() => addPart("", false)}
          className="inline-flex items-center gap-1 rounded-lg bg-[#003B95] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#002b70] cursor-pointer shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          + Thêm phần chương trình
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
        {safeParts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/60 p-4 text-center space-y-2.5">
            <p className="text-xs text-muted-foreground">
              Chưa có phần chương trình nào được cố định. Bấm chọn để thêm phần bạn muốn cấu hình:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => addPart("", false)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#003B95] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#002b70] cursor-pointer shadow-xs transition"
              >
                <Plus className="h-3.5 w-3.5" /> + Thêm Phần Tùy Chỉnh
              </button>
              <button
                type="button"
                onClick={() => addPart("Phiên Chuyên Đề / Tọa Đàm", false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-[#003B95] hover:bg-blue-100 cursor-pointer transition"
              >
                <Plus className="h-3.5 w-3.5" /> + Thêm Phần Chuyên Đề
              </button>
              <button
                type="button"
                onClick={() => addPart("Tiệc Giao Lưu & Kết Nối", true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer transition"
              >
                <Utensils className="h-3.5 w-3.5" /> + Thêm Phần Tiệc
              </button>
            </div>
          </div>
        ) : null}

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
              <div className={hidePriceInputs ? "sm:col-span-5" : "sm:col-span-4"}>
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

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Sức chứa (chỗ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={part.capacity ?? ""}
                  onChange={(e) => {
                    const num = parseInt(e.target.value.replace(/\D/g, ""), 10);
                    updatePart(pIdx, { capacity: Number.isFinite(num) ? num : 0 });
                  }}
                  placeholder="100"
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
                      onClick={() =>
                        updatePart(pIdx, {
                          isPaid: true,
                          fee: Number(part.fee || 0) >= 2000 ? Number(part.fee) : 2000,
                        })
                      }
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

        {safeParts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addPart("", false)}
              className="flex-1 py-2 rounded-xl border border-dashed border-border hover:border-[#003B95] text-xs font-bold text-muted-foreground hover:text-[#003B95] flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <Plus className="h-4 w-4" /> + Thêm Phần Chương Trình Mới
            </button>
            <button
              type="button"
              onClick={() => addPart("Tiệc Giao Lưu & Kết Nối", true)}
              className="py-2 px-3.5 rounded-xl border border-dashed border-amber-300 hover:border-amber-500 text-xs font-bold text-amber-800 hover:bg-amber-50 flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <Utensils className="h-3.5 w-3.5" /> + Thêm Phần Tiệc
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
