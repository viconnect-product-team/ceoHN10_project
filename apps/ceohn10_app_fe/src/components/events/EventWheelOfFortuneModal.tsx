import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Trophy,
  Dices,
  Sparkles,
  Users,
  Check,
  CheckSquare,
  Square,
  Gift,
  Bell,
  Volume2,
  VolumeX,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export interface CandidateItem {
  id: string;
  code: string;
  name: string;
  company: string;
  position?: string;
  phone?: string;
  email?: string;
  isWalkIn?: boolean;
}

export interface PrizeItem {
  id: string;
  rankName: string;
  title: string;
  value: string;
  quantity?: number;
  imageUrl?: string | null;
}

const SECTOR_COLORS = [
  "#003B95", // Navy CEO HN10
  "#D97706", // Vàng hổ phách
  "#DC2626", // Đỏ cờ
  "#059669", // Xanh ngọc
  "#7C3AED", // Tím hoàng gia
  "#0284C7", // Sky blue
  "#EA580C", // Cam đất
  "#0D9488", // Teal
  "#4F46E5", // Indigo
  "#BE123C", // Rose
];

export function EventWheelOfFortuneModal({
  open,
  eventId,
  eventName,
  prizes = [],
  onClose,
}: {
  open: boolean;
  eventId: string;
  eventName: string;
  prizes?: PrizeItem[];
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [allCandidates, setAllCandidates] = useState<CandidateItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");

  // UC-EVT-07: Trích xuất danh mục chức danh duy nhất của những người đã check-in
  const uniquePositions = useMemo(() => {
    const set = new Set<string>();
    for (const c of allCandidates) {
      if (c.position && c.position.trim()) {
        set.add(c.position.trim());
      }
    }
    return Array.from(set).sort();
  }, [allCandidates]);

  const handleFilterByPosition = (pos: string) => {
    setSelectedPosition(pos);
    if (!pos) {
      setSelectedIds(new Set(allCandidates.map((c) => c.id)));
      toast.info(`Đã chọn lại tất cả ${allCandidates.length} đại biểu đã check-in vào vòng quay.`);
      return;
    }
    const matching = allCandidates.filter(
      (c) => c.position && c.position.trim().toLowerCase() === pos.trim().toLowerCase()
    );
    setSelectedIds(new Set(matching.map((c) => c.id)));
    toast.success(`Đã tự động chọn ${matching.length} đại biểu có chức danh "${pos}" vào vòng quay may mắn!`);
  };

  const [availablePrizes, setAvailablePrizes] = useState<PrizeItem[]>(() => {
    return prizes.length > 0
      ? prizes
      : [
          { id: "p1", rankName: "Giải Đặc Biệt", title: "Cúp Vàng Doanh Nhân & 50 Triệu VNĐ", value: "50.000.000 đ", quantity: 1 },
          { id: "p2", rankName: "Giải Nhất", title: "Bộ Quà Tặng Doanh Nghiệp Thượng Hạng", value: "20.000.000 đ", quantity: 2 },
          { id: "p3", rankName: "Giải Nhì", title: "Gói Quảng Bá Thương Hiệu B2B HN10", value: "10.000.000 đ", quantity: 3 },
          { id: "p4", rankName: "Giải May Mắn", title: "Voucher Nghỉ Dưỡng Resort 5 Sao", value: "5.000.000 đ", quantity: 5 },
        ];
  });
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>(availablePrizes[0]?.id || "");

  // Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const currentAngleRef = useRef(0);
  const [winner, setWinner] = useState<CandidateItem | null>(null);
  const [history, setHistory] = useState<Array<{ prizeTitle: string; winner: CandidateItem; time: string }>>([]);

  // Load checked-in candidates from strictly 100% checked-in database
  useEffect(() => {
    if (!open || !eventId) return;
    setLoading(true);
    fetchNestApi<any>(`/events/${eventId}/checked-in-candidates`)
      .then((res) => {
        const list: CandidateItem[] = res?.candidates || [];
        setAllCandidates(list);
        // Mặc định chọn tất cả đại biểu đã check-in
        setSelectedIds(new Set(list.map((c) => c.id)));
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách check-in:", err);
        toast.error("Không thể tải danh sách đại biểu đã check-in");
      })
      .finally(() => setLoading(false));
  }, [open, eventId]);

  // Candidates actually placed on the wheel
  const activeCandidates = useMemo(() => {
    return allCandidates.filter((c) => selectedIds.has(c.id));
  }, [allCandidates, selectedIds]);

  const currentPrize = useMemo(() => {
    return availablePrizes.find((p) => p.id === selectedPrizeId) || availablePrizes[0];
  }, [availablePrizes, selectedPrizeId]);

  // Draw wheel on canvas
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 24;

    ctx.clearRect(0, 0, width, height);

    const total = activeCandidates.length;
    if (total === 0) {
      // Empty state
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = "#F1F5F9";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#CBD5E1";
      ctx.stroke();

      ctx.font = "bold 15px sans-serif";
      ctx.fillStyle = "#64748B";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Vui lòng chọn đại biểu", centerX, centerY);
      return;
    }

    const arc = (2 * Math.PI) / total;

    // Draw outer golden ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 12, 0, 2 * Math.PI);
    ctx.lineWidth = 14;
    ctx.strokeStyle = "#F59E0B";
    ctx.stroke();

    // Outer decorative dots
    const numDots = 24;
    for (let d = 0; d < numDots; d++) {
      const dotAngle = (d * (2 * Math.PI)) / numDots;
      const dotX = centerX + (radius + 12) * Math.cos(dotAngle);
      const dotY = centerY + (radius + 12) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
    }
    ctx.restore();

    // Draw sectors
    for (let i = 0; i < total; i++) {
      const startAngle = angle + i * arc;
      const endAngle = startAngle + arc;
      const candidate = activeCandidates[i];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.fillStyle = SECTOR_COLORS[i % SECTOR_COLORS.length];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();

      // Text inside sector
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#FFFFFF";

      const maxLabelLen = total > 20 ? 12 : 18;
      const displayName = candidate.name.length > maxLabelLen
        ? candidate.name.slice(0, maxLabelLen) + ".."
        : candidate.name;

      if (total <= 30) {
        ctx.font = total > 15 ? "bold 11px sans-serif" : "bold 13px sans-serif";
        ctx.fillText(`${displayName}`, radius - 18, 4);
      } else {
        // Many attendees: render ticket code
        ctx.font = "bold 11px monospace";
        ctx.fillText(candidate.code || candidate.name.slice(0, 8), radius - 16, 4);
      }
      ctx.restore();
    }

    // Draw center hub / star
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#D97706";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = "#003B95";
    ctx.fill();

    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = "#F59E0B";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CEO HN10", centerX, centerY);
    ctx.restore();
  };

  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [activeCandidates]);

  // Start Physical Spin with cubic-bezier deceleration
  const handleStartSpin = () => {
    if (isSpinning || activeCandidates.length === 0 || !currentPrize) return;

    setWinner(null);
    setIsSpinning(true);

    const total = activeCandidates.length;
    const arc = (2 * Math.PI) / total;

    // Pick random winner index
    const winnerIndex = Math.floor(Math.random() * total);

    // Pointer is at 12 o'clock (-PI / 2).
    // An angle of 0 has sector 0 starting at 3 o'clock (0 rad).
    // To have sector winnerIndex stop at the top pointer:
    // angle + winnerIndex * arc + arc / 2 = 3 * PI / 2 (or -PI / 2)
    const targetOffset = (3 * Math.PI) / 2 - (winnerIndex * arc + arc / 2);

    // Number of full rotations (between 6 and 9 turns)
    const fullRotations = (6 + Math.floor(Math.random() * 3)) * 2 * Math.PI;
    const startAngle = currentAngleRef.current % (2 * Math.PI);
    const finalAngle = startAngle + fullRotations + targetOffset;

    const duration = 5200; // 5.2 seconds
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic formula
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startAngle + (finalAngle - startAngle) * easeProgress;

      currentAngleRef.current = current;
      drawWheel(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const winningCandidate = activeCandidates[winnerIndex];
        setWinner(winningCandidate);

        const prizeTitle = `${currentPrize.rankName}: ${currentPrize.title}`;
        setHistory((prev) => [
          {
            prizeTitle,
            winner: winningCandidate,
            time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          },
          ...prev,
        ]);

        // Giảm số lượng giải thưởng
        const nextQty = Math.max(0, (currentPrize.quantity || 1) - 1);
        setAvailablePrizes((prev) =>
          prev.map((p) => (p.id === currentPrize.id ? { ...p, quantity: nextQty } : p))
        );

        toast.success(
          `🎉 CHÚC MỪNG ${winningCandidate.name} (${winningCandidate.code}) đã trúng ${currentPrize.title}!`,
          { duration: 8000 }
        );
      }
    };

    requestAnimationFrame(animate);
  };

  const toggleCandidate = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(allCandidates.map((c) => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleRemoveWinnerFromWheel = () => {
    if (!winner) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(winner.id);
      return next;
    });
    toast.info(`Đã loại đại biểu ${winner.name} khỏi các vòng quay giải sau để tránh trúng trùng lặp.`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] rounded-3xl border border-amber-500/40 bg-white dark:bg-card shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-foreground">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-[#002B70] via-[#003B95] to-[#0A4DB0] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Dices className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                <span>VÒNG QUAY MAY MẮN HÌNH TRÒN (WHEEL OF FORTUNE)</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Chuẩn CSDL Check-in
                </span>
              </h2>
              <p className="text-xs text-blue-200 line-clamp-1">{eventName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (LG 7 CỘT): VÒNG QUAY HÌNH TRÒN */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-5 bg-slate-50 dark:bg-muted/20 p-6 rounded-3xl border border-border">
            {/* Giải thưởng đang chọn */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-card p-3.5 rounded-2xl border border-amber-500/30 shadow-2xs">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-black text-amber-600 tracking-wider">
                    Giải thưởng đang bốc thăm:
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {currentPrize?.rankName}: {currentPrize?.title}
                  </div>
                </div>
              </div>

              <select
                value={selectedPrizeId}
                onChange={(e) => setSelectedPrizeId(e.target.value)}
                disabled={isSpinning}
                className="text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
              >
                {availablePrizes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.rankName} ({p.value}) {p.quantity !== undefined ? `[Còn: ${p.quantity}]` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Khung Vòng Quay Canvas với Kim chỉ ở đỉnh */}
            <div className="relative flex items-center justify-center py-2">
              {/* Pointer / Ticker ở vị trí 12h */}
              <div className="absolute top-0 z-20 flex flex-col items-center">
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-rose-600 filter drop-shadow-md animate-bounce" />
              </div>

              <canvas
                ref={canvasRef}
                width={440}
                height={440}
                className="max-w-full h-auto drop-shadow-2xl select-none"
              />
            </div>

            {/* Nút Quay Thưởng Lớn */}
            <div className="w-full flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={isSpinning || activeCandidates.length === 0}
                onClick={handleStartSpin}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#D97706] hover:brightness-105 active:scale-95 text-slate-950 font-black text-base uppercase tracking-wider shadow-lg shadow-amber-500/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="h-5 w-5" />
                <span>{isSpinning ? "Đang Quay Số..." : "Quay Vòng May Mắn"}</span>
              </button>

              {winner && (
                <button
                  type="button"
                  onClick={handleRemoveWinnerFromWheel}
                  className="px-4 py-3 rounded-2xl bg-slate-200 dark:bg-muted text-foreground text-xs font-bold hover:bg-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                  title="Ẩn người này để không trúng trùng lặp ở các giải sau"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Loại khỏi giải sau</span>
                </button>
              )}
            </div>

            {/* Winner Banner */}
            {winner && (
              <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-amber-50 border-2 border-emerald-400 text-center space-y-1.5 animate-in zoom-in-95">
                <div className="text-[11px] uppercase font-black tracking-widest text-emerald-700">
                  ✦ CHÚC MỪNG ĐẠI BIỂU TRÚNG THƯỞNG ✦
                </div>
                <div className="text-xl font-black text-[#003B95]">{winner.name}</div>
                <div className="text-xs text-slate-600 font-medium">
                  Mã vé: <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">{winner.code}</span> · {winner.company}
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI (LG 5 CỘT): BỘ CHỌN ỨNG VIÊN & LỊCH SỬ TRAO GIẢI */}
          <div className="lg:col-span-5 space-y-4 flex flex-col h-full">
            {/* Header Danh sách ứng viên Check-in */}
            <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Users className="h-4 w-4 text-[#003B95]" />
                  <span>Đại biểu đã check-in ({activeCandidates.length}/{allCandidates.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    disabled={isSpinning}
                    className="text-[11px] font-bold text-[#003B95] hover:underline cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    disabled={isSpinning}
                    className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* UC-EVT-07: Chọn điều kiện Chức Danh để tự động add người đã check-in vào vòng quay */}
              {uniquePositions.length > 0 && (
                <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-300">
                    <span>Lọc theo chức danh tham gia:</span>
                    {selectedPosition && (
                      <button
                        type="button"
                        onClick={() => handleFilterByPosition("")}
                        className="text-amber-700 dark:text-amber-400 hover:underline cursor-pointer text-[10px]"
                      >
                        Hủy lọc (Lấy tất cả)
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedPosition}
                    onChange={(e) => handleFilterByPosition(e.target.value)}
                    disabled={isSpinning}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-card font-semibold text-foreground outline-none cursor-pointer"
                  >
                    <option value="">-- Tất cả chức danh đã check-in (Mặc định: {allCandidates.length} người) --</option>
                    {uniquePositions.map((pos) => {
                      const count = allCandidates.filter((c) => c.position && c.position.trim().toLowerCase() === pos.toLowerCase()).length;
                      return (
                        <option key={pos} value={pos}>
                          {pos} ({count} đại biểu)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Tìm kiếm nhanh */}
              <input
                type="text"
                placeholder="Tìm tên hoặc mã vé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background outline-none focus:border-[#003B95]"
              />

              {/* Danh sách cuộn chọn từng người */}
              <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border/60">
                {loading ? (
                  <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">
                    Đang tải danh sách đã check-in...
                  </div>
                ) : allCandidates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Chưa có đại biểu nào hoàn tất check-in tại sự kiện này.
                  </div>
                ) : (
                  allCandidates
                    .filter((c) =>
                      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.code.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((c) => {
                      const isSelected = selectedIds.has(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => !isSpinning && toggleCandidate(c.id)}
                          className={`flex items-center gap-2.5 p-2 text-xs transition cursor-pointer select-none ${
                            isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-muted/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isSpinning}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-[#003B95] pointer-events-none"
                          />
                          <span className="font-mono font-bold text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                            {c.code}
                          </span>
                          <span className="font-semibold text-foreground truncate flex-1">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{c.company}</span>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Lịch sử trúng thưởng */}
            <div className="flex-1 p-4 rounded-2xl border border-border bg-card space-y-2">
              <div className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Lịch sử vinh danh giải thưởng:</span>
                <span className="text-[11px] text-muted-foreground">{history.length} giải đã trao</span>
              </div>

              {history.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground italic">
                  Chưa có lượt quay nào được thực hiện.
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-2 text-xs">
                  {history.map((h, i) => (
                    <div key={i} className="p-2.5 rounded-xl border border-border bg-muted/40 space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-600 dark:text-amber-400">
                        <span>{h.prizeTitle}</span>
                        <span className="text-[10px] text-muted-foreground">{h.time}</span>
                      </div>
                      <div className="text-foreground">
                        {h.winner.name} ({h.winner.code}) · <span className="text-muted-foreground">{h.winner.company}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
