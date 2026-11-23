import { useEffect, useState, useMemo } from "react";
import {
  Award,
  Check,
  CheckSquare,
  Gift,
  Search,
  Square,
  Trash2,
  Building2,
  DollarSign,
  Layers,
  Sparkles,
} from "lucide-react";
import { fetchNestApi } from "@/lib/api-client";
import { type EventSponsorItem } from "@/lib/events.functions";
import { type Sponsor } from "@/lib/sponsors.functions";
import { useFmt } from "@/lib/i18n";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function EventSponsorPackageSelector({
  value = [],
  onChange,
}: {
  eventId?: string;
  value: EventSponsorItem[];
  onChange: (sponsors: EventSponsorItem[]) => void;
}) {
  const fmt = useFmt();
  const [sponsorsList, setSponsorsList] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const sponsorsRes = await fetchNestApi<Sponsor[]>("/sponsors").catch(() => []);
        if (active) {
          const validSponsors = Array.isArray(sponsorsRes) ? sponsorsRes : [];
          setSponsorsList(validSponsors);
        }
      } catch (err) {
        console.error("[EventSponsorPackageSelector] Load error:", err);
        if (active) setSponsorsList([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const safeSelected = Array.isArray(value) ? value : [];

  // Filtered sponsors for multi-select
  const filteredSponsors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sponsorsList.filter((s) => {
      const pType = s.packageType || "bank_transfer";
      if (filterType !== "all" && pType !== filterType) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.contact && s.contact.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.inKindDescription && s.inKindDescription.toLowerCase().includes(q))
      );
    });
  }, [sponsorsList, query, filterType]);

  // Toggle selection for a sponsor (Multi-select)
  const handleToggleSponsor = (s: Sponsor) => {
    const existingIndex = safeSelected.findIndex(
      (item) => item.sponsorId === s.id || item.sponsorName === s.name
    );

    if (existingIndex >= 0) {
      // Remove from selected list
      onChange(safeSelected.filter((_, idx) => idx !== existingIndex));
    } else {
      // Add sponsor directly without package tier constraints
      const newItem: EventSponsorItem = {
        sponsorId: s.id,
        sponsorName: s.name,
        packageType: (s.packageType || "bank_transfer") as any,
        amount: Number(s.amount ?? 0),
        inKindDescription: s.inKindDescription || "",
      };
      onChange([...safeSelected, newItem]);
    }
  };

  // Update sponsor payment type (bank_transfer, cash, in_kind)
  const handleUpdatePackageType = (
    sponsorId: string,
    pType: "bank_transfer" | "cash" | "in_kind"
  ) => {
    onChange(
      safeSelected.map((item) => {
        if (item.sponsorId !== sponsorId) return item;
        return { ...item, packageType: pType };
      })
    );
  };

  // Update in-kind description
  const handleUpdateInKindDescription = (sponsorId: string, text: string) => {
    onChange(
      safeSelected.map((item) => {
        if (item.sponsorId !== sponsorId) return item;
        return { ...item, inKindDescription: text };
      })
    );
  };

  // Update custom amount
  const handleUpdateAmount = (sponsorId: string, amount: number) => {
    onChange(
      safeSelected.map((item) => {
        if (item.sponsorId !== sponsorId) return item;
        return { ...item, amount };
      })
    );
  };

  // Remove a sponsor
  const handleRemove = (sponsorId: string) => {
    onChange(safeSelected.filter((item) => item.sponsorId !== sponsorId));
  };

  // Select all available sponsors
  const handleSelectAllAvailable = () => {
    const newItems: EventSponsorItem[] = [];
    const existingIds = new Set(safeSelected.map((i) => i.sponsorId));
    newItems.push(...safeSelected);

    for (const s of filteredSponsors) {
      if (!existingIds.has(s.id)) {
        newItems.push({
          sponsorId: s.id,
          sponsorName: s.name,
          packageType: (s.packageType || "bank_transfer") as any,
          amount: Number(s.amount ?? 0),
          inKindDescription: s.inKindDescription || "",
        });
      }
    }
    onChange(newItems);
  };

  // Deselect all sponsors
  const handleDeselectAll = () => {
    onChange([]);
  };

  // Quick calculations
  const totalValue = safeSelected.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const bankTransferTotal = safeSelected
    .filter((s) => (s.packageType || "bank_transfer") === "bank_transfer")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const cashTotal = safeSelected
    .filter((s) => s.packageType === "cash")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const inKindTotal = safeSelected
    .filter((s) => s.packageType === "in_kind")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-4 shadow-xs">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">
                  Nhà tài trợ đồng hành
                </h4>
                {safeSelected.length > 1 ? (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs font-bold cursor-help hover:bg-primary/25 transition">
                          {safeSelected.length} nhà tài trợ (Rê chuột xem danh sách)
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-[80] max-w-sm rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl">
                        <div className="text-[11px] font-bold text-foreground mb-1 pb-1 border-b border-border">
                          Danh sách {safeSelected.length} nhà tài trợ đã chọn:
                        </div>
                        <ul className="text-xs space-y-1.5 max-h-48 overflow-y-auto">
                          {safeSelected.map((item, idx) => (
                            <li key={item.sponsorId} className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-foreground truncate">
                                {idx + 1}. {item.sponsorName}
                              </span>
                              <span className="text-[10px] font-bold text-primary shrink-0">
                                {fmt.money(item.amount || 0)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {safeSelected.length} nhà tài trợ
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Chọn các nhà tài trợ bên dưới để tham gia đồng hành cùng sự kiện
              </p>
            </div>
          </div>
        </div>

        {safeSelected.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
              <DollarSign className="h-3.5 w-3.5" />
              Tổng: {fmt.money(totalValue)}
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
              <span>(CK: {fmt.money(bankTransferTotal)}</span>
              <span>•</span>
              <span>Tiền mặt: {fmt.money(cashTotal)}</span>
              <span>•</span>
              <span>Hiện vật: {fmt.money(inKindTotal)})</span>
            </div>
          </div>
        )}
      </div>

      {/* 1. SECTION: DANH SÁCH NHÀ TÀI TRỢ ĐÃ CHỌN CHO SỰ KIỆN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Nhà tài trợ đã chọn cho sự kiện này ({safeSelected.length})</span>
          </div>
          {safeSelected.length > 0 && (
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-[11px] font-semibold text-destructive hover:underline cursor-pointer"
            >
              Gỡ tất cả
            </button>
          )}
        </div>

        {safeSelected.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground mb-2">
              <Building2 className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              Chưa chọn nhà tài trợ nào cho sự kiện
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-md mx-auto">
              Hãy tick chọn nhà tài trợ ở danh sách bên dưới để thêm vào sự kiện.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {safeSelected.map((item) => {
              const originalSponsor = sponsorsList.find((s) => s.id === item.sponsorId);
              const pType = item.packageType || "bank_transfer";

              return (
                <div
                  key={item.sponsorId}
                  className="rounded-xl border border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 p-3 shadow-xs transition-all space-y-2.5"
                >
                  {/* Sponsor Header */}
                  <div className="flex items-start justify-between gap-3 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#003B95]/10 text-[#003B95] dark:text-blue-400 shrink-0 font-bold text-xs">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-sm text-foreground truncate" title={item.sponsorName}>
                          {item.sponsorName}
                        </h5>
                        {originalSponsor?.contact && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            Đại diện: {originalSponsor.contact}
                            {originalSponsor.phone ? ` • ${originalSponsor.phone}` : ""}
                            {originalSponsor.email ? ` • ${originalSponsor.email}` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.sponsorId)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition cursor-pointer shrink-0"
                      title="Gỡ nhà tài trợ này khỏi sự kiện"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Sponsor Details Editor (Hình thức & Giá trị) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {/* Hình thức tài trợ */}
                    <div className="flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                        Hình thức:
                      </span>
                      <select
                        value={pType}
                        onChange={(e) =>
                          handleUpdatePackageType(
                            item.sponsorId,
                            e.target.value as "bank_transfer" | "cash" | "in_kind"
                          )
                        }
                        className="h-6 w-full rounded bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                      >
                        <option value="bank_transfer">Chuyển khoản</option>
                        <option value="cash">Tiền mặt</option>
                        <option value="in_kind">Hiện vật</option>
                      </select>
                    </div>

                    {/* Giá trị tài trợ */}
                    <div className="flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                        Giá trị:
                      </span>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={item.amount || ""}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          handleUpdateAmount(
                            item.sponsorId,
                            e.target.value === "" ? 0 : Number(e.target.value) || 0
                          )
                        }
                        className="h-6 w-full rounded bg-transparent text-xs font-bold text-primary focus:outline-none"
                      />
                      <span className="text-[11px] font-bold text-primary shrink-0">₫</span>
                    </div>

                    {/* Mô tả hiện vật nếu có */}
                    {pType === "in_kind" ? (
                      <div className="flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1.5 sm:col-span-2 lg:col-span-1">
                        <Gift className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                        <input
                          type="text"
                          placeholder="Mô tả hiện vật tài trợ..."
                          value={item.inKindDescription || ""}
                          onChange={(e) =>
                            handleUpdateInKindDescription(item.sponsorId, e.target.value)
                          }
                          className="h-6 w-full rounded bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div className="hidden lg:flex items-center gap-1.5 rounded-lg bg-card/50 border border-border/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Trực tiếp vào quỹ sự kiện</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. SECTION: TRÌNH CHỌN ĐA CHỌN NHÀ TÀI TRỢ (MULTI-SELECT SPONSOR PICKER) */}
      <div className="pt-3 border-t border-border space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Danh mục nhà tài trợ (Click để chọn vào sự kiện)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllAvailable}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Chọn tất cả
            </button>
            <span className="text-muted-foreground text-xs">•</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>

        {/* Search & Type Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm nhà tài trợ theo tên công ty, đại diện, sản phẩm..."
              className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs focus:border-ring focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "Tất cả" },
              { id: "bank_transfer", label: "Chuyển khoản" },
              { id: "cash", label: "Tiền mặt" },
              { id: "in_kind", label: "Hiện vật" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                  filterType === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-select Checklist Grid */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-xl border border-border bg-background/50 p-2">
          {loading ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Đang tải danh sách nhà tài trợ...
            </div>
          ) : filteredSponsors.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground italic">
              Không tìm thấy nhà tài trợ phù hợp với bộ lọc
            </div>
          ) : (
            filteredSponsors.map((s) => {
              const isSelected = safeSelected.some(
                (item) => item.sponsorId === s.id || item.sponsorName === s.name
              );
              const pType = s.packageType || "bank_transfer";

              return (
                <div
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSponsor(s);
                  }}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-lg text-xs transition cursor-pointer select-none ${
                    isSelected
                      ? "bg-primary/10 border border-primary/40 shadow-xs"
                      : "hover:bg-muted/70 border border-border/40 bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Checkbox Icon */}
                    <div className="shrink-0 text-primary">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground/60" />
                      )}
                    </div>

                    {/* Sponsor Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground truncate">{s.name}</span>
                        {pType === "in_kind" ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300">
                            <Gift className="h-3 w-3" /> Hiện vật
                          </span>
                        ) : pType === "cash" ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            <DollarSign className="h-3 w-3" /> Tiền mặt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-[#003B95] dark:text-blue-300">
                            <DollarSign className="h-3 w-3" /> Chuyển khoản
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate mt-0.5">
                        {s.contact && <span>{s.contact}</span>}
                        {s.phone && (
                          <>
                            <span>•</span>
                            <span>{s.phone}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-semibold text-foreground">{fmt.money(s.amount)}</span>
                        {s.inKindDescription && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-[200px]" title={s.inKindDescription}>
                              {s.inKindDescription}
                            </span>
                          </>
                        )}
                        {s.assignedEvent && (
                          <span className="text-[10px] text-muted-foreground">
                            (Đồng hành: {s.assignedEvent.name})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 text-right">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                        <Check className="h-3.5 w-3.5" /> Đã chọn
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-muted-foreground hover:text-primary">
                        Chọn
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
