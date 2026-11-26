import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Calendar,
  Check,
  X,
  Users,
  CheckCircle2,
  CreditCard,
  Loader2,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";

export const Route = createFileRoute("/invitation/$eventId")({
  ssr: false,
  component: PublicInvitationPage,
});

interface AttendeeInput {
  fullName: string;
  phone: string;
  email: string;
  company: string;
  title: string;
}

function formatSlugFallback(slug: string): string {
  return decodeURIComponent(slug || "")
    .split(/[-_+\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function PublicInvitationPage() {
  const { eventId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [slug, setSlug] = useState("");

  // RSVP modal state
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [attendees, setAttendees] = useState<AttendeeInput[]>([]);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [customFullName, setCustomFullName] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [ticketTier, setTicketTier] = useState<"invited_guest" | "other_participant">("other_participant");
  const [submitting, setSubmitting] = useState(false);

  // Result & SePay payment state
  const [rsvpResult, setRsvpResult] = useState<any>(null);
  const [isPaidConfirmed, setIsPaidConfirmed] = useState(false);

  useEffect(() => {
    const readHash = () => {
      const h = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
      setSlug(h);
      return h;
    };
    const initialSlug = readHash();
    setLoading(true);
    fetchNestApi<any>(`/events/${eventId}/public-invitation${initialSlug ? `?slug=${encodeURIComponent(initialSlug)}` : ""}`)
      .then((res) => {
        setData(res);
        if (res?.guest) {
          setTicketTier(res.guest.guestType === "other_participant" ? "other_participant" : "invited_guest");
          setCustomFullName(res.guest.fullName || "");
          setCustomTitle(res.guest.title || "");
          setCustomCompany(res.guest.company || "");
          setContactEmail(res.guest.email || "");
          setContactPhone(res.guest.phone || "");
        } else {
          setTicketTier("other_participant");
          if (initialSlug) {
            setCustomFullName(formatSlugFallback(initialSlug));
          }
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));

    const onHashChange = () => {
      const nextSlug = readHash();
      fetchNestApi<any>(`/events/${eventId}/public-invitation${nextSlug ? `?slug=${encodeURIComponent(nextSlug)}` : ""}`)
        .then((res) => setData(res))
        .catch(() => {});
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [eventId]);

  // Sync attendees array length when attendeeCount changes
  useEffect(() => {
    setAttendees((prev) => {
      const next: AttendeeInput[] = [];
      for (let i = 0; i < attendeeCount; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else if (i === 0) {
          next.push({
            fullName: customFullName || "Khách mời",
            phone: contactPhone,
            email: contactEmail,
            company: customCompany,
            title: customTitle,
          });
        } else {
          next.push({ fullName: "", phone: "", email: "", company: "", title: "" });
        }
      }
      return next;
    });
  }, [attendeeCount, customFullName, contactPhone, contactEmail, customCompany, customTitle]);

  // Auto-polling 3s when waiting for SePay payment
  useEffect(() => {
    if (!rsvpResult?.regId || !rsvpResult?.totalFee || rsvpResult.totalFee <= 0 || isPaidConfirmed) return;
    const timer = setInterval(async () => {
      try {
        const st = await fetchNestApi<any>(`/events/registrations/${rsvpResult.regId}/status`);
        if (st?.paymentStatus === "paid" || st?.status === "confirmed") {
          setIsPaidConfirmed(true);
          toast.success("Thanh toán SePay thành công! Vé điện tử của Quý khách đã được kích hoạt.");
          clearInterval(timer);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [rsvpResult, isPaidConfirmed]);

  const event = data?.event;
  const guest = data?.guest;
  const displayGuestName = guest?.fullName || (slug ? formatSlugFallback(slug) : "Quý Khách Hàng & Đối Tác");
  const displayGuestOrg = guest
    ? `${guest.title || ""}${guest.title && guest.company ? " · " : ""}${guest.company || ""}`
    : "";

  const parts: any[] = useMemo(() => {
    if (Array.isArray(event?.parts) && event.parts.length > 0) return event.parts;
    return [
      {
        id: "part_1",
        name: event?.name || "Chương trình chính",
        fee: Number(event?.ticketPrice || 0),
        isParty: false,
        items: [{ time: event?.time || "08:30 - 11:30", title: event?.name || "Nội dung sự kiện" }],
      },
    ];
  }, [event]);

  const timelineItems = useMemo(() => {
    return parts.flatMap((p) => (Array.isArray(p.items) ? p.items : [])).slice(0, 3);
  }, [parts]);

  // Build RSVP Options from event.parts
  const rsvpOptions = useMemo(() => {
    const opts: {
      key: string;
      mode: "single_part" | "full" | "declined";
      label: string;
      desc: string;
      partNames: string[];
      unitFee: number;
    }[] = [];

    parts.forEach((p, idx) => {
      const subTimes = Array.isArray(p.items) ? p.items.map((it: any) => `${it.time} ${it.title}`).join(" · ") : "";
      const feeNum = ticketTier === "invited_guest" ? Number(p.guestFee ?? 0) : Number(p.fee || 0);
      opts.push({
        key: `part_${p.id || idx}`,
        mode: "single_part",
        label: `Chỉ tham dự ${p.name}`,
        desc: `${subTimes ? subTimes + " · " : ""}${feeNum > 0 ? feeNum.toLocaleString("vi-VN") + " đ/người" : "Miễn phí"}`,
        partNames: [p.name],
        unitFee: feeNum,
      });
    });

    if (parts.length > 1) {
      const totalUnit = parts.reduce(
        (s, p) => s + (ticketTier === "invited_guest" ? Number(p.guestFee ?? 0) : Number(p.fee || 0)),
        0,
      );
      opts.push({
        key: "full_all",
        mode: "full",
        label: `Tham dự toàn bộ (${parts.map((p) => p.name).join(" và ")})`,
        desc: `Bao gồm tất cả ${parts.length} phần · ${totalUnit > 0 ? totalUnit.toLocaleString("vi-VN") + " đ/người" : "Miễn phí"}`,
        partNames: parts.map((p) => p.name),
        unitFee: totalUnit,
      });
    }

    opts.push({
      key: "declined",
      mode: "declined",
      label: "Rất tiếc, không thể tham dự",
      desc: "Cảm ơn Quý khách đã phản hồi tới Ban Tổ Chức",
      partNames: [],
      unitFee: 0,
    });

    return opts;
  }, [parts, ticketTier]);

  const activeOpt = rsvpOptions.find((o) => o.key === selectedOption);
  const totalFee = activeOpt && activeOpt.mode !== "declined" ? activeOpt.unitFee * attendeeCount : 0;

  const handleSubmitRsvp = async () => {
    if (!activeOpt) {
      toast.error("Vui lòng chọn hình thức tham dự!");
      return;
    }
    const finalName = (customFullName || displayGuestName).trim();
    const finalEmail = (contactEmail || guest?.email || "").trim();
    const finalPhone = (contactPhone || guest?.phone || "").trim();
    if (!finalName) {
      toast.error("Vui lòng nhập Họ và tên!");
      return;
    }
    if (activeOpt.mode !== "declined" && (!finalEmail || !finalPhone)) {
      toast.error("Vui lòng nhập đầy đủ Email và Số điện thoại để kiểm tra định danh vé!");
      return;
    }
    if (activeOpt.mode !== "declined" && attendeeCount > 1) {
      const missing = attendees.slice(1).some((a) => !a.fullName.trim());
      if (missing) {
        toast.error(`Vui lòng điền đầy đủ Họ tên cho ${attendeeCount} người tham dự!`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetchNestApi<any>(`/events/${eventId}/public-rsvp`, {
        method: "POST",
        body: JSON.stringify({
          guestSlug: slug,
          fullName: finalName,
          title: customTitle || guest?.title || "",
          company: customCompany || guest?.company || "",
          email: contactEmail || guest?.email || "",
          phone: contactPhone || guest?.phone || "",
          attendMode: activeOpt.mode,
          selectedPartNames: activeOpt.partNames,
          attendeeCount: activeOpt.mode === "declined" ? 0 : attendeeCount,
          attendees: activeOpt.mode === "declined" ? [] : attendees,
          ticketTier,
          totalFee,
        }),
      });
      setRsvpResult(res);
      if (res?.attendMode === "declined") {
        toast.info("Đã ghi nhận phản hồi của Quý khách.");
      } else if (totalFee === 0) {
        toast.success("Xác nhận tham dự thành công!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi gửi xác nhận tham dự");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md space-y-3">
          <h1 className="text-xl font-bold">Không tìm thấy Thư mời sự kiện</h1>
          <p className="text-sm text-slate-400">Đường dẫn thư mời không hợp lệ hoặc sự kiện đã đóng.</p>
        </div>
      </div>
    );
  }

  const searchParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const customBgImg = searchParams?.get("bg") || "";
  const customBgColor = searchParams?.get("bgColor") || "";
  const customTextColor = searchParams?.get("textColor") || "";
  const customAccentColor = searchParams?.get("accentColor") || "";
  const rawCustomFont = searchParams?.get("font") || "";
  const customFont =
    rawCustomFont && !rawCustomFont.toLowerCase().includes("georgia")
      ? rawCustomFont
      : "'Be Vietnam Pro', 'Inter', 'Segoe UI', Roboto, sans-serif";

  const dateObj = event.date ? new Date(event.date) : new Date();
  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayOfWeek = !isNaN(dateObj.getTime()) ? dayNames[dateObj.getDay()] : "Thứ Bảy";
  const dayMonth = !isNaN(dateObj.getTime())
    ? `${String(dateObj.getDate()).padStart(2, "0")}.${String(dateObj.getMonth() + 1).padStart(2, "0")}`
    : "05.12";
  const yearStr = !isNaN(dateObj.getTime()) ? String(dateObj.getFullYear()) : "2026";
  const heroBg = customBgImg
    ? resolveMediaUrl(customBgImg) || customBgImg
    : event.image && !String(event.image).includes("unsplash")
      ? resolveMediaUrl(event.image) || "/skyline_perspective_dark.jpg"
      : "/skyline_perspective_dark.jpg";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location || "Hà Nội")}`;

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden flex flex-col justify-center"
      style={{
        background: customBgColor
          ? `radial-gradient(circle at 72% 45%, ${customBgColor} 0%, #0f172a 92%)`
          : "radial-gradient(circle at 72% 45%, #334155 0%, #1e293b 48%, #0f172a 85%, #090d16 100%)",
        color: customTextColor || "#ffffff",
        fontFamily: customFont,
      }}
    >
      {/* Background City Image: Desktop left half, Mobile top banner */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={heroBg}
          alt="City Skyline"
          className="w-full h-72 md:h-full md:w-[56%] object-cover opacity-50 grayscale-[30%]"
        />
        <div className="hidden md:block absolute inset-y-0 left-0 w-[60%] bg-gradient-to-r from-slate-950/20 via-slate-900/75 to-slate-900" />
        <div className="md:hidden absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-slate-950/20 via-slate-900/75 to-[#162032]" />
      </div>

      {/* Main Responsive Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 md:py-10 grid grid-cols-1 md:grid-cols-12 items-center gap-6">
        {/* Left Column (Desktop Motto over city skyline) */}
        <div className="md:col-span-5 flex flex-col justify-between md:min-h-[580px] pt-2 pb-16 md:pb-0">
          <div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-slate-200 to-transparent mb-3" />
            <p className="font-sans italic text-2xl md:text-4xl leading-snug text-slate-100 drop-shadow">
              Hội Tụ Doanh Trí,
              <br />
              Khẳng Định Vị Thế
            </p>
          </div>
        </div>

        {/* Right Column (Invitation Content) */}
        <div className="md:col-span-7 flex flex-col items-center text-center space-y-4">
          <div className="font-sans italic text-4xl md:text-5xl text-slate-100 tracking-wide">
            Thư mời
          </div>

          <div className="flex items-center gap-3">
            <span className="w-20 md:w-28 h-px bg-gradient-to-r from-transparent to-slate-300/80" />
            <span className="w-2 h-2 rotate-45 bg-white shadow" />
            <span className="w-20 md:w-28 h-px bg-gradient-to-l from-transparent to-slate-300/80" />
          </div>

          <div className="space-y-1">
            <div className="text-[11px] md:text-xs uppercase tracking-[0.35em] text-slate-300 font-semibold">
              TRÂN TRỌNG KÍNH MỜI
            </div>
            <h1 className="font-sans text-3xl md:text-5xl font-bold text-white tracking-wide drop-shadow">
              {displayGuestName}
            </h1>
            {displayGuestOrg && (
              <p className="text-xs md:text-base text-slate-200 font-normal">
                {displayGuestOrg}
              </p>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-[11px] uppercase tracking-[0.3em] text-slate-300 font-semibold">
              TỚI DỰ
            </div>
            <h2 className="font-sans text-3xl md:text-5xl font-bold uppercase tracking-wider text-white">
              {event.name}
            </h2>
            <div className="inline-block bg-white text-slate-900 font-extrabold text-xs md:text-sm tracking-[0.16em] uppercase px-8 py-2 rounded-full shadow-xl">
              CLB DOANH NHÂN CEO HN10
            </div>
          </div>

          {/* Glassmorphism Info Panel */}
          <div className="w-full max-w-2xl rounded-2xl border border-white/25 bg-slate-900/75 backdrop-blur-md p-4 md:p-5 shadow-2xl space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center border-b border-white/15 pb-4">
              <div className="flex items-center justify-center gap-3 sm:border-r sm:border-white/15 sm:pr-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-300 text-right leading-tight">
                  {dayOfWeek}
                  <br />
                  NGÀY
                </div>
                <div className="font-sans text-3xl md:text-4xl font-bold text-white">{dayMonth}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-300 text-left leading-tight">
                  NĂM
                  <br />
                  <b className="text-white text-xs">{yearStr}</b>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-300 text-right leading-tight shrink-0">
                  ĐỊA ĐIỂM
                  <br />
                  HỘI TRƯỜNG
                </div>
                <div className="text-left">
                  <div className="font-sans italic text-xl md:text-2xl text-white leading-tight">
                    {event.venueName || "Hội trường CLB"}
                  </div>
                  <div className="text-[11px] text-slate-300">{event.location || "Hà Nội"}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white/20" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-300 font-semibold">
                CHƯƠNG TRÌNH
              </span>
              <span className="h-px flex-1 bg-white/20" />
            </div>

            <div className="grid grid-cols-3 gap-2 relative pt-1">
              {timelineItems.map((it: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center text-center space-y-1.5">
                  <span className="font-sans text-sm md:text-lg font-semibold text-white">{it.time}</span>
                  <span className="w-2.5 h-2.5 rotate-45 bg-white shadow ring-4 ring-slate-800" />
                  <span className="text-[11px] md:text-xs text-slate-300 leading-snug">{it.title}</span>
                </div>
              ))}
            </div>

            <div className="pt-2.5 border-t border-white/15 flex items-center justify-center gap-2 text-xs text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Quý Doanh nhân vui lòng xác nhận tham dự để Ban Tổ Chức đón tiếp chu đáo.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              title="Chỉ đường Google Maps"
            >
              <MapPin className="h-5 w-5" />
            </a>

            <button
              type="button"
              onClick={() => {
                setRsvpResult(null);
                setIsPaidConfirmed(false);
                setRsvpOpen(true);
              }}
              className="px-7 py-3 rounded-full bg-gradient-to-b from-white via-slate-100 to-slate-300 text-slate-950 font-extrabold text-sm md:text-base shadow-[0_0_28px_rgba(255,255,255,0.35)] hover:brightness-105 active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <Check className="h-5 w-5" />
              <span>{rsvpResult ? "Đã gửi phản hồi ✓" : "Xác nhận tham dự"}</span>
            </button>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              title="Lưu lịch"
            >
              <Calendar className="h-5 w-5" />
            </a>
          </div>

          <div className="pt-2 space-y-1">
            <p className="font-sans italic text-sm md:text-base text-slate-200">
              Sự hiện diện của bạn là niềm vinh hạnh của chúng tôi
            </p>
            <p className="font-sans italic text-lg md:text-2xl text-white">
              Rất hân hạnh được đón tiếp!
            </p>
          </div>
        </div>
      </div>

      {/* RSVP MODAL (Không cần đăng nhập) */}
      {rsvpOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-white/15 p-6 text-white shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setRsvpOpen(false)}
              className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {!rsvpResult ? (
              <>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-semibold">
                    {event.name}
                  </div>
                  <h3 className="font-sans text-2xl font-bold text-white mt-1">
                    Xác nhận tham dự
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {dayOfWeek}, {dayMonth}.{yearStr} · {event.venueName || event.location}
                  </p>
                </div>

                {/* Hộp Kính gửi */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-white/10 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Kính gửi</div>
                  <div className="font-sans text-xl font-bold text-white">{displayGuestName}</div>
                  {displayGuestOrg && <div className="text-xs text-slate-300">{displayGuestOrg}</div>}
                  {!guest && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Họ và tên *"
                        value={customFullName}
                        onChange={(e) => setCustomFullName(e.target.value)}
                        className="h-9 rounded-xl border border-white/20 bg-slate-950/60 px-3 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Chức vụ / Công ty"
                        value={customCompany}
                        onChange={(e) => setCustomCompany(e.target.value)}
                        className="h-9 rounded-xl border border-white/20 bg-slate-950/60 px-3 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Đối tượng vé do Ban Truyền thông / Ban Sự kiện & Hậu cần chỉ định (chỉ đọc) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200">Đối tượng vé áp dụng</label>
                  {ticketTier === "invited_guest" ? (
                    <div className="p-3 rounded-xl border border-emerald-400/50 bg-emerald-500/15 text-white flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold">Vé Khách mời (Theo danh sách BTC)</div>
                        <div className="text-[11px] text-emerald-300">Miễn phí tham dự (0 đ)</div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-[10px] font-bold uppercase text-emerald-200">
                        0 đ
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-amber-400/50 bg-amber-500/15 text-white space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold">Khách tham gia sự kiện</div>
                          <div className="text-[11px] text-amber-300">Áp dụng giá vé theo từng phần chương trình</div>
                        </div>
                      </div>
                      {Array.isArray(data?.tickets) && data.tickets.length > 0 && (
                        <div className="pt-1.5 border-t border-white/10 flex flex-wrap gap-1.5">
                          {data.tickets.map((tk: any, idx: number) => (
                            <span
                              key={tk.id || idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/60 border border-white/15 text-[10px] text-slate-200"
                            >
                              <span>{tk.name}:</span>
                              <strong className="text-amber-300">
                                {Number(tk.price || 0) > 0 ? `${Number(tk.price).toLocaleString("vi-VN")} đ` : "Miễn phí"}
                              </strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Email & SĐT định danh để check trùng đăng ký */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email *</label>
                    <input
                      type="email"
                      placeholder="email@company.vn"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="h-9 w-full rounded-xl border border-white/20 bg-slate-950/60 px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      placeholder="09xxxxxxxx"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="h-9 w-full rounded-xl border border-white/20 bg-slate-950/60 px-3 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Câu hỏi & Các options theo từng phần sự kiện */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    Quý khách có tham dự không?
                  </label>
                  <div className="space-y-2">
                    {rsvpOptions.map((opt) => {
                      const active = selectedOption === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setSelectedOption(opt.key)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start gap-3 cursor-pointer ${
                            active
                              ? "border-white bg-white/15 shadow"
                              : "border-white/15 bg-slate-800/40 hover:border-white/40"
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              active ? "bg-white border-white text-slate-950" : "border-white/40"
                            }`}
                          >
                            {active && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{opt.label}</div>
                            <div className="text-xs text-slate-300 mt-0.5">{opt.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Số lượng người & Form từng người khi chọn tham dự */}
                {activeOpt && activeOpt.mode !== "declined" && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-white/10">
                      <div>
                        <div className="text-xs font-bold text-white">Đoàn đi mấy người?</div>
                        <div className="text-[11px] text-slate-400">Tính cả Quý khách</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAttendeeCount((c) => Math.max(1, c - 1))}
                          className="w-9 h-9 rounded-full border border-white/25 bg-slate-900 text-lg font-bold cursor-pointer"
                        >
                          −
                        </button>
                        <span className="font-sans text-2xl font-bold w-8 text-center">{attendeeCount}</span>
                        <button
                          type="button"
                          onClick={() => setAttendeeCount((c) => Math.min(30, c + 1))}
                          className="w-9 h-9 rounded-full border border-white/25 bg-slate-900 text-lg font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Thông tin từng người nếu > 1 người (UC-INV-05) */}
                    {attendeeCount > 1 && (
                      <div className="space-y-2.5 rounded-2xl bg-slate-800/50 border border-white/10 p-3.5">
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>Thông tin chi tiết {attendeeCount} người tham dự:</span>
                        </div>
                        {attendees.map((att, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-950/50 border border-white/10 space-y-2">
                            <div className="text-[11px] font-bold text-slate-300">Người thứ {idx + 1}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Họ và tên *"
                                value={att.fullName}
                                onChange={(e) => {
                                  const next = [...attendees];
                                  next[idx] = { ...next[idx], fullName: e.target.value };
                                  setAttendees(next);
                                }}
                                className="h-8 rounded-lg border border-white/20 bg-slate-900 px-2.5 text-xs text-white"
                              />
                              <input
                                type="text"
                                placeholder="Số điện thoại"
                                value={att.phone}
                                onChange={(e) => {
                                  const next = [...attendees];
                                  next[idx] = { ...next[idx], phone: e.target.value };
                                  setAttendees(next);
                                }}
                                className="h-8 rounded-lg border border-white/20 bg-slate-900 px-2.5 text-xs text-white"
                              />
                              <input
                                type="email"
                                placeholder="Email nhận vé"
                                value={att.email}
                                onChange={(e) => {
                                  const next = [...attendees];
                                  next[idx] = { ...next[idx], email: e.target.value };
                                  setAttendees(next);
                                }}
                                className="h-8 rounded-lg border border-white/20 bg-slate-900 px-2.5 text-xs text-white"
                              />
                              <input
                                type="text"
                                placeholder="Công ty / Chức vụ"
                                value={att.company}
                                onChange={(e) => {
                                  const next = [...attendees];
                                  next[idx] = { ...next[idx], company: e.target.value };
                                  setAttendees(next);
                                }}
                                className="h-8 rounded-lg border border-white/20 bg-slate-900 px-2.5 text-xs text-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tổng phí thanh toán */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 border border-white/15">
                      <span className="text-xs font-semibold text-slate-200">Tổng phí tham dự:</span>
                      <span className="font-mono text-lg font-black text-emerald-300">
                        {totalFee > 0 ? `${totalFee.toLocaleString("vi-VN")} VNĐ` : "Miễn phí (0đ)"}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!activeOpt || submitting}
                  onClick={handleSubmitRsvp}
                  className="w-full py-3.5 rounded-full bg-white text-slate-950 font-extrabold text-sm shadow-xl hover:bg-slate-100 disabled:opacity-40 cursor-pointer transition"
                >
                  {submitting
                    ? "Đang gửi xác nhận..."
                    : totalFee > 0
                      ? `Gửi xác nhận & Tạo mã QR thanh toán (${totalFee.toLocaleString("vi-VN")} đ)`
                      : "Gửi xác nhận"}
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  Xác nhận sẽ được ghi lại ngay, Quý khách không cần đăng nhập.
                </p>
              </>
            ) : (
              /* MÀN HÌNH KẾT QUẢ SAU KHI GỬI XÁC NHẬN */
              <div className="text-center space-y-4 py-2">
                {rsvpResult.attendMode === "declined" ? (
                  <>
                    <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 border border-white/20 flex items-center justify-center">
                      <Check className="h-7 w-7 text-slate-200" />
                    </div>
                    <h3 className="font-sans text-2xl font-bold text-white">Cảm ơn Quý khách đã phản hồi</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Ban Tổ Chức đã ghi nhận thông tin và rất mong được đón tiếp Quý khách trong các sự kiện tiếp theo của CEO HN10.
                    </p>
                  </>
                ) : rsvpResult.totalFee > 0 && !isPaidConfirmed ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Quét mã VietQR để hoàn tất thanh toán phí sự kiện</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {rsvpResult.eventName || event.name}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {rsvpResult.partsLabel} · {rsvpResult.attendeeCount} người
                    </p>
                    <div className="p-3 bg-white rounded-2xl inline-block shadow-lg">
                      <img src={rsvpResult.vietQrUrl} alt="VietQR SePay" className="w-56 h-56 object-contain" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800 text-left text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mã vé / Đăng ký:</span>
                        <b className="font-mono text-amber-300">{rsvpResult.regId}</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Số tiền:</span>
                        <b className="text-emerald-300 font-mono">{Number(rsvpResult.totalFee).toLocaleString("vi-VN")} đ</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nội dung CK:</span>
                        <b className="font-mono text-white">{rsvpResult.transferContent}</b>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                      <span>Thông tin vé &amp; mã QR thanh toán đã được gửi về Email của Quý khách.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                      <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {isPaidConfirmed ? "Đã thanh toán thành công!" : "Xác nhận tham dự thành công!"}
                    </h3>
                    <div className="rounded-xl bg-slate-800/80 border border-white/10 p-3 text-xs space-y-1 text-left">
                      <div><span className="text-slate-400">Sự kiện:</span> <b className="text-white">{rsvpResult.eventName || event.name}</b></div>
                      <div><span className="text-slate-400">Phần tham dự:</span> <b className="text-white">{rsvpResult.partsLabel}</b></div>
                      <div><span className="text-slate-400">Số lượng:</span> <b className="text-white">{rsvpResult.attendeeCount} người</b></div>
                      <div><span className="text-slate-400">Mã vé:</span> <b className="font-mono text-emerald-300">{rsvpResult.regId}</b></div>
                    </div>
                    <div className="p-3 bg-white rounded-2xl inline-block">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(rsvpResult.regId)}`}
                        alt="QR Check-in"
                        className="w-40 h-40"
                      />
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Vé điện tử &amp; mã vé <b className="font-mono text-white">{rsvpResult.regId}</b> đã được gửi về Email của Quý khách.
                    </p>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setRsvpOpen(false)}
                  className="w-full py-2.5 rounded-full border border-white/25 text-xs font-bold text-white hover:bg-white/10 cursor-pointer"
                >
                  Đóng &amp; Xem lại thư mời
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
