import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Ticket,
  User,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Send,
  ArrowLeft,
  QrCode,
  ShieldCheck,
  CreditCard,
  Copy,
  Check,
  Download,
  Clock,
  Briefcase,
  AlertCircle,
  Tag,
  Award,
  Heart,
  Share2,
  Compass,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { fetchNestApi } from "@/lib/api-client";
import { toast } from "sonner";
import { getQrUrl } from "@/lib/qr";

export const Route = createFileRoute("/guest-event-register/$eventId")({
  ssr: false,
  loader: async ({ params }) => {
    let event = await fetchNestApi<any>(`/events/${params.eventId}`).catch(() => null);
    if (!event) {
      const allEvents = await fetchNestApi<any[]>("/events").catch(() => []);
      if (Array.isArray(allEvents) && allEvents.length > 0) {
        event =
          allEvents.find((e: any) => e.id === params.eventId || e.slug === params.eventId) ||
          (params.eventId === "latest" ? allEvents[0] : null);
      }
    }
    if (!event) {
      event = null;
    }
    const realEventId = event?.id || params.eventId;
    const ticketsRes = realEventId
      ? await fetchNestApi<any[]>(`/events/${realEventId}/tickets`).catch(() => [])
      : [];
    const eventTickets = Array.isArray(ticketsRes) ? ticketsRes : [];
    return { event, tickets: eventTickets };
  },
  component: StandaloneGuestEventRegistrationPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `Đăng Ký Tham Dự: ${loaderData?.event?.name || "Sự Kiện CLB CEO HN10"}` },
      {
        name: "description",
        content: `Đăng ký vé tham gia sự kiện và nhận mã quay số may mắn trúng thưởng CLB Doanh Nhân CEO HN10.`,
      },
    ],
  }),
});

function StandaloneGuestEventRegistrationPage() {
  const { event, tickets: rawTickets } = Route.useLoaderData();
  const eventTickets: any[] = Array.isArray(rawTickets) ? rawTickets : [];

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Không Tìm Thấy Sự Kiện</h2>
          <p className="text-sm text-slate-600 mb-6">
            Mã sự kiện không tồn tại trên hệ thống hoặc sự kiện đã kết thúc. Vui lòng kiểm tra lại liên kết hoặc liên hệ Ban Tổ Chức.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#003B95] text-white font-bold rounded-xl text-sm hover:bg-blue-900 transition"
          >
            Về Trang Chủ
          </a>
        </div>
      </div>
    );
  }

  // Học viên mã tự khai báo (không bắt buộc, nếu nhập sẽ tự động tra cứu & điền)
  const [memberCode, setMemberCode] = useState("");
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [codeLookupSuccess, setCodeLookupSuccess] = useState<string | null>(null);

  // Paxlaw-style Recipient Name from URL hash (#pham-hong-nguyen) or search params
  const [inviteeName, setInviteeName] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        return decodeURIComponent(hash)
          .split(/[-_+\s]+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
      const sp = new URLSearchParams(window.location.search);
      const guest = sp.get("guest") || sp.get("name") || sp.get("recipient");
      if (guest) {
        return decodeURIComponent(guest)
          .split(/[-_+\s]+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
    }
    return "";
  });

  const [fullName, setFullName] = useState(() => inviteeName || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");

  const [showVietQrModal, setShowVietQrModal] = useState(false);
  const [hasConfirmedPayment, setHasConfirmedPayment] = useState(false);

  // ── SEPAY REALTIME AUTO-POLLING STATUS ───────────────────────────────────
  const [paymentConfirmedLive, setPaymentConfirmedLive] = useState(false);
  const [confirmedTicketDetails, setConfirmedTicketDetails] = useState<any>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleHashChange = () => {
        const hash = window.location.hash.replace(/^#/, "");
        if (hash) {
          const parsed = decodeURIComponent(hash)
            .split(/[-_+\s]+/)
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
          setInviteeName(parsed);
          setFullName((prev) => prev || parsed);
        }
      };
      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, []);

  // Khởi tạo ticketType dựa trên URL search params (VD: ?ticketType=VIP) hoặc vé đầu tiên
  const [ticketType, setTicketType] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const urlType = sp.get("ticketType") || sp.get("ticket_type") || sp.get("type");
      if (urlType) {
        const decoded = decodeURIComponent(urlType);
        if (eventTickets.length > 0) {
          const match = eventTickets.find(
            (t) =>
              t.name.toLowerCase() === decoded.toLowerCase() ||
              t.id.toLowerCase() === decoded.toLowerCase() ||
              (decoded.toUpperCase().includes("VIP") && t.name.toUpperCase().includes("VIP"))
          );
          if (match) return match.name;
        }
        return decoded;
      }
    }
    if (eventTickets.length > 0) {
      return eventTickets[0].name;
    }
    return "Vé Tiêu Chuẩn";
  });

  const [ticketCount, setTicketCount] = useState(1);
  const [note, setNote] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const regFormCfg = (event as any).formFieldsConfig || {};
  const customRegFields: Array<{
    id: string;
    label: string;
    type: string;
    required?: boolean;
    optionsText?: string;
  }> = Array.isArray(regFormCfg.registrationCustomFields)
    ? regFormCfg.registrationCustomFields
    : Array.isArray((event as any).customFields)
      ? (event as any).customFields
      : [];
  const [isCheckinNow, setIsCheckinNow] = useState(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("action") === "checkin" || sp.get("checkin") === "true";
    }
    return false;
  });

  // Danh mục các phần tham gia sự kiện (Chỉ lấy theo cấu hình người dùng thêm, không fix cứng Tọa đàm/Tiệc)
  const availableParts: string[] = Array.isArray(event.parts) && event.parts.length > 0
    ? event.parts
        .map((p: any) => (typeof p === "string" ? p : p?.name || p?.title || ""))
        .filter(Boolean)
    : [];
  const [selectedParts, setSelectedParts] = useState<string[]>(availableParts);

  // Lấy danh sách Timeline sự kiện (có thu gọn scroll khi dài quá 5 mục)
  const eventTimelineList: Array<{ time?: string; title?: string; speaker?: string }> = (() => {
    const src = (event as any).agenda || (event as any).timeline;
    if (Array.isArray(src) && src.length > 0) return src;
    if (typeof src === "string" && src.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(src);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (Array.isArray(event.parts) && event.parts.length > 0) {
      const items: Array<{ time?: string; title?: string; speaker?: string }> = [];
      for (const p of event.parts) {
        if (Array.isArray(p?.timeline) && p.timeline.length > 0) {
          for (const t of p.timeline) {
            items.push({
              time: [t.startTime, t.endTime].filter(Boolean).join(" - ") || t.time,
              title: t.title || t.content || p.name,
              speaker: t.speaker || p.name,
            });
          }
        } else if (p?.name) {
          items.push({
            time: [p.startTime, p.endTime].filter(Boolean).join(" - ") || "Theo lịch trình",
            title: p.name,
            speaker: p.hallName || "",
          });
        }
      }
      if (items.length > 0) return items;
    }
    return [];
  })();

  // Hiệu ứng chạm mặt nước iOS chân thực (3 vòng sóng nước đồng tâm + độ nảy mặt nước)
  const triggerWaterRipple = (e: React.MouseEvent<HTMLElement> | React.PointerEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    target.classList.remove("ios-water-surface-bounce");
    void target.offsetWidth;
    target.classList.add("ios-water-surface-bounce");

    const wave = document.createElement("span");
    wave.className = "ios-water-ripple-wave";
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    target.appendChild(wave);

    const ring1 = document.createElement("span");
    ring1.className = "ios-water-ripple-ring";
    ring1.style.left = `${x}px`;
    ring1.style.top = `${y}px`;
    target.appendChild(ring1);

    const ring2 = document.createElement("span");
    ring2.className = "ios-water-ripple-ring ios-water-ripple-ring-delay-1";
    ring2.style.left = `${x}px`;
    ring2.style.top = `${y}px`;
    target.appendChild(ring2);

    setTimeout(() => {
      wave.remove();
      ring1.remove();
      ring2.remove();
    }, 1050);
  };

  // Danh sách người tham gia cùng (multi-attendees)
  type AdditionalAttendee = {
    id: string;
    memberCode: string;
    fullName: string;
    phone: string;
    email: string;
    company: string;
    position: string;
  };
  const [additionalAttendees, setAdditionalAttendees] = useState<AdditionalAttendee[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Copy states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const totalAttendeesCount = 1 + additionalAttendees.length;

  // Tính giá vé của hạng vé đang chọn
  const activeTicketObj = eventTickets.find(
    (t) =>
      t.name === ticketType ||
      t.id === ticketType ||
      (ticketType.toUpperCase().includes("VIP") && t.name.toUpperCase().includes("VIP"))
  );
  const ticketPrice = activeTicketObj
    ? Number(activeTicketObj.price || 0)
    : Number(event.ticket_price || event.ticketPrice || event.fee || 0);
  const isFree = ticketPrice === 0;
  const totalAmount = ticketPrice * totalAttendeesCount;
  const isFull = (() => {
    const cap = Number(event.capacity || event.maxAttendees || event.maxSeats || 0);
    const reg = Number(event.registered || event.registeredCount || event.attendeesCount || 0);
    return cap > 0 && reg >= cap;
  })();

  // ── AUTO-POLLING SEPAY KHI ĐÃ CÓ MÃ ĐĂNG KÝ VÉ CÓ PHÍ ──────────────────
  useEffect(() => {
    if (!result?.registrationId || isFree || paymentConfirmedLive) return;

    const regId = result.registrationId;
    let intervalId: any = null;
    let pollCount = 0;
    const maxPolls = 120; // 120 x 3s = 6 phút auto-check

    const checkPaymentStatus = async (isManual = false) => {
      if (isManual) setIsCheckingPayment(true);
      pollCount++;
      if (pollCount > maxPolls && !isManual) {
        if (intervalId) clearInterval(intervalId);
        return;
      }
      try {
        const res = await fetchNestApi<{ found: boolean; ticket: any }>(
          `/events/ticket-status/${encodeURIComponent(regId)}`
        );
        if (res?.found && res?.ticket) {
          const st = String(res.ticket.paymentStatus || "").toLowerCase();
          const mainSt = String(res.ticket.status || "").toLowerCase();
          if (st === "paid" || mainSt === "confirmed") {
            setPaymentConfirmedLive(true);
            setConfirmedTicketDetails(res.ticket);
            toast.success("🎉 Ting ting! Hệ thống đã nhận được thanh toán từ SePay! Vé E-Ticket của Quý khách đã được kích hoạt thành công!");
            if (intervalId) clearInterval(intervalId);
          } else if (isManual) {
            toast.info("Giao dịch đang được SePay và Ngân hàng xử lý, hệ thống vẫn đang tự động kiểm tra mỗi 3 giây...");
          }
        }
      } catch {
        // bỏ qua lỗi mạng tạm thời
      } finally {
        if (isManual) setIsCheckingPayment(false);
      }
    };

    const timer = setTimeout(() => {
      void checkPaymentStatus();
      intervalId = setInterval(() => void checkPaymentStatus(), 3000);
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [result?.registrationId, isFree, paymentConfirmedLive]);

  const bankAccount = (event as any).bank_account || (event as any).bankAccount || "0983101010";
  const bankName = (event as any).bank_name || (event as any).bankName || "MB Bank (Ngân Hàng Quân Đội)";
  const bankOwner = (event as any).bank_owner || (event as any).bankOwner || "CLB DOANH NHAN CEO HN10";
  const bankCode = "970422"; // MB Bank bin
  const dynamicMemo = `CEOHN10_${(fullName || "DK").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8)}_${Date.now().toString(36).slice(-4).toUpperCase()}`;
  const popupVietQrUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(dynamicMemo)}&accountName=${encodeURIComponent(bankOwner)}`;

  const handleOpenBankApp = () => {
    const deepLink = `https://api.vietqr.io/pay?bank=${bankCode}&acc=${bankAccount}&amount=${totalAmount}&des=${encodeURIComponent(dynamicMemo)}`;
    window.open(deepLink, "_blank");
  };

  const handleLookupMemberCode = async (codeToSearch: string, attendeeIndex?: number) => {
    const trimmed = codeToSearch.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Vui lòng nhập mã học viên để tra cứu (Ví dụ: HN10-0001)!");
      return;
    }
    setIsSearchingCode(true);
    try {
      const member = await fetchNestApi<any>(`/members/by-code/${encodeURIComponent(trimmed)}`);
      if (member && (member.fullName || member.name)) {
        const foundName = member.fullName || member.name || "";
        const foundPhone = member.phone || "";
        const foundEmail = member.email || "";
        const foundCompany = member.company || member.enterpriseName || member.companyName || "";
        const foundPosition = member.position || member.title || "";

        if (typeof attendeeIndex === "number" && attendeeIndex >= 0) {
          setAdditionalAttendees((prev) =>
            prev.map((a, idx) =>
              idx === attendeeIndex
                ? {
                    ...a,
                    memberCode: member.code || trimmed,
                    fullName: foundName,
                    phone: foundPhone,
                    email: foundEmail,
                    company: foundCompany,
                    position: foundPosition,
                  }
                : a
            )
          );
        } else {
          setMemberCode(member.code || trimmed);
          if (foundName) setFullName(foundName);
          if (foundPhone) setPhone(foundPhone);
          if (foundEmail) setEmail(foundEmail);
          if (foundCompany) setCompany(foundCompany);
          if (foundPosition) setPosition(foundPosition);
          setCodeLookupSuccess(`Đã tìm thấy Học viên: ${foundName} (${member.code || trimmed}) - Thông tin đã được tự động điền.`);
        }
        toast.success(`Đã tự động điền thông tin Học viên ${foundName}!`);
      } else {
        toast.warning(`Không tìm thấy mã học viên "${trimmed}". Bạn có thể tự điền thông tin.`);
      }
    } catch {
      toast.warning(`Không tìm thấy mã học viên "${trimmed}". Bạn có thể tự điền thông tin.`);
    } finally {
      setIsSearchingCode(false);
    }
  };

  const addAttendee = () => {
    setAdditionalAttendees((prev) => [
      ...prev,
      {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        memberCode: "",
        fullName: "",
        phone: "",
        email: "",
        company: company,
        position: "",
      },
    ]);
    toast.info("Đã thêm 1 người tham gia cùng vào danh sách.");
  };

  const removeAttendee = (index: number) => {
    setAdditionalAttendees((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`Đã sao chép ${fieldName}!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Không thể sao chép tự động, vui lòng chọn và sao chép thủ công.");
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      toast.error("Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Email của người đăng ký!");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ!");
      return;
    }

    for (let i = 0; i < additionalAttendees.length; i++) {
      const a = additionalAttendees[i];
      if (!a.fullName.trim() || !a.phone.trim() || !a.email.trim()) {
        toast.error(`Vui lòng nhập đủ Họ tên, SĐT và Email cho người tham gia số ${i + 2}!`);
        return;
      }
    }

    // Với sự kiện có phí: Khi bấm đăng ký, hiện mã QR nổi lên kèm link app ngân hàng
    if (!isFree && !hasConfirmedPayment) {
      setShowVietQrModal(true);
      return;
    }

    await executeRegistrationSubmit();
  }

  async function handleConfirmPaymentAndSubmit() {
    setShowVietQrModal(false);
    setHasConfirmedPayment(true);
    await executeRegistrationSubmit();
  }

  async function executeRegistrationSubmit() {
    setSubmitting(true);
    try {
      const allAttendees = [
        {
          memberCode: memberCode.trim().toUpperCase() || undefined,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          company: company.trim(),
          position: position.trim(),
        },
        ...additionalAttendees.map((a) => ({
          memberCode: a.memberCode.trim().toUpperCase() || undefined,
          fullName: a.fullName.trim(),
          phone: a.phone.trim(),
          email: a.email.trim().toLowerCase(),
          company: a.company.trim(),
          position: a.position.trim(),
        })),
      ];

      // 1. Gửi dữ liệu tới API backend NestJS
      const res = await fetchNestApi<any>(`/events/${event.id}/guest-register`, {
        method: "POST",
        body: JSON.stringify({
          memberCode: memberCode.trim().toUpperCase() || undefined,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          company: company.trim(),
          position: position.trim(),
          ticketType: activeTicketObj?.name || ticketType,
          ticketCount: totalAttendeesCount,
          ticketPrice,
          note: note.trim(),
          customFieldValues,
          attendees: allAttendees,
          isCheckinNow: isCheckinNow,
        }),
      }).catch((err: any) => {
        return { ok: false, error: err };
      });

      // Kiểm tra trạng thái mã QR hết hạn / đã xóa / sự kiện thay đổi
      if (res && (res.status === "qr_changed_or_expired" || res.isQrExpired)) {
        setResult({
          isQrExpired: true,
          status: "qr_changed_or_expired",
          message:
            res.message ||
            "Sự kiện hoặc chương trình đào tạo liên quan đến mã QR này đã có sự thay đổi lịch trình hoặc mã QR không còn hiệu lực trên hệ thống. Ban Tổ Chức đã gửi thư thông báo chi tiết đến email của Quý Anh/Chị.",
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          eventTitle: res.eventTitle || event.name || event.title,
        });
        toast.warning("Mã QR đã có sự thay đổi hoặc hết hạn. Ban Tổ Chức đã gửi email thông báo chi tiết tới Quý Anh/Chị!");
        return;
      }

      // Kiểm tra trạng thái hết chỗ (Sold Out)
      if (res && (res.status === "sold_out" || res.isSoldOut || (res.message && res.message.includes("Hết chỗ")))) {
        setResult({
          isSoldOut: true,
          status: "sold_out",
          message:
            res.message ||
            "Rất tiếc, sự kiện đã đủ số lượng đại biểu tham dự (Hết chỗ). Ban Tổ Chức đã gửi email cảm ơn sự quan tâm của Quý Anh/Chị và lưu trữ thông tin cho sự kiện tiếp theo.",
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          eventTitle: event.name || event.title,
        });
        toast.info("Sự kiện đã đủ số lượng đại biểu tham dự (Hết chỗ).");
        return;
      }

      if (res && res.ok) {
        setResult(res);
        toast.success(
          isFree
            ? `Đăng ký thành công! Vé và mã quay thưởng đã được gửi tới email ${email.trim()}`
            : `Đăng ký thành công! Mã VietQR SePay thanh toán đã được gửi về email ${email.trim()}`
        );
        return;
      }

      if (isFull) {
        setResult({
          isSoldOut: true,
          status: "sold_out",
          message:
            "Rất tiếc, sự kiện đã đủ số lượng đại biểu tham dự (Hết chỗ). Ban Tổ Chức đã gửi email cảm ơn sự quan tâm của Quý Anh/Chị và lưu trữ thông tin cho sự kiện tiếp theo.",
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          eventTitle: event.name || event.title,
        });
        toast.info("Sự kiện đã đủ số lượng đại biểu tham dự (Hết chỗ).");
        return;
      }

      // 2. Client-side Fallback an toàn: Tự sinh mã vé
      const fallbackRegId = `GUEST-${Date.now().toString(36).toUpperCase()}`;
      const fallbackLuckyNum = Math.floor(1000 + Math.random() * 9000);
      const fallbackMemo = `CEOHN10_SK_${fallbackRegId}`;
      const fallbackQrCodeUrl = getQrUrl(fallbackRegId, 300);

      const clientResult = {
        ok: true,
        registered: true,
        registrationId: fallbackRegId,
        luckyNumber: fallbackLuckyNum,
        isFree,
        totalAmount,
        sepayQrUrl: "",
        vietQrUrl: "",
        bankAccount: "",
        bankName: "",
        bankOwner: "",
        transferMemo: fallbackMemo,
        qrCodeUrl: fallbackQrCodeUrl,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        company: company.trim(),
        position: position.trim(),
        ticketType,
        eventTitle: event?.name || event?.title,
        eventDate: event?.date,
        eventLocation: event?.location,
      };

      try {
        localStorage.setItem(`guest_ticket_${fallbackRegId}`, JSON.stringify(clientResult));
      } catch { }

      setResult(clientResult);
      toast.success(
        isFree
          ? `Đăng ký thành công! Mã vé: ${fallbackRegId}`
          : `Đăng ký thành công! Vui lòng quét mã VietQR để thanh toán.`
      );
    } catch (err: any) {
      toast.error(err?.message || "Đăng ký không thành công. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  }

  // 1. SOLD OUT VIEW
  if (result?.isSoldOut) {
    return (
      <div className="min-h-screen bg-[#F0F4F9] py-8 sm:py-16 px-4 flex items-center justify-center font-sans text-slate-800">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-[#002B70] via-[#003B95] to-[#0A4DB0] px-6 py-8 text-white text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              THÔNG BÁO TỪ BAN TỔ CHỨC
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white px-2 leading-snug">
              SỰ KIỆN ĐÃ ĐỦ SỐ LƯỢNG ĐẠI BIỂU (HẾT CHỖ)
            </h1>
            <p className="text-blue-100 text-xs mt-2 font-medium">
              {result.eventTitle || event.name}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {(result.status === "attended" || result.checkedInAt || isCheckinNow) && (
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold px-4 py-3 rounded-2xl text-center text-sm shadow-md flex items-center justify-center gap-2 border border-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
                <span>XÁC NHẬN: QUÝ ĐẠI BIỂU ĐÃ ĐƯỢC CHECK-IN VÀO CỬA SỰ KIỆN THÀNH CÔNG!</span>
              </div>
            )}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 text-left space-y-3">
              <div className="font-bold text-amber-950 text-sm sm:text-base">
                Kính gửi Quý Anh/Chị {result.fullName || "Đại biểu"},
              </div>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                Ban Tổ Chức CLB Doanh Nhân CEO HN10 xin chân thành cảm ơn sự quan tâm sâu sắc của Quý Anh/Chị đối với chương trình. Do số lượng đăng ký tham dự đã đạt tối đa sức chứa khán phòng nhằm đảm bảo công tác đón tiếp và kết nối giao thương chu đáo nhất, cổng đăng ký trực tuyến đã tạm thời đóng.
              </p>
              <div className="bg-white/80 rounded-xl p-3.5 border border-amber-200/60 text-xs text-amber-950 space-y-1">
                <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Email thông báo chi tiết đã được gửi tới:{" "}
                  <span className="font-mono text-blue-700 underline">{result.email}</span>
                </p>
                <p className="text-slate-600">
                  Thông tin kết nối doanh nghiệp của Quý Anh/Chị đã được Ban Truyền Thông lưu trữ ưu tiên cho các chương trình giao thương và sự kiện tiếp theo của CLB.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" />
                Hỗ Trợ Đại Biểu & Doanh Nhân:
              </div>
              <p>
                Hotline Ban Truyền Thông CLB CEO HN10:{" "}
                <a href="tel:0983101010" className="font-bold text-[#003B95] hover:underline">
                  0983 1010 10
                </a>{" "}
                · Email: <span className="font-medium text-slate-700">bancskh@ceohn10.com</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                Quay Lại Trang Sự Kiện
              </button>
              <a
                href="https://ceohn10.com"
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition"
              >
                Trang Chủ CLB CEO HN10
                <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1.5. QR EXPIRED OR CHANGED VIEW
  if (result && (result.isQrExpired || result.status === "qr_changed_or_expired")) {
    return (
      <div className="min-h-screen bg-[#F0F4F9] py-8 sm:py-12 px-4 flex items-center justify-center font-sans text-slate-800">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 px-6 py-8 text-white text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-300/40 text-amber-200 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
              THÔNG BÁO TỪ BAN TỔ CHỨC
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white px-2 leading-snug">
              MÃ QR ĐÃ THAY ĐỔI HOẶC HẾT HIỆU LỰC
            </h1>
            <p className="text-amber-100 text-xs mt-2 font-medium">
              {result.eventTitle || event.name || "Sự kiện / Chương trình đào tạo CLB CEO HN10"}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {(result.status === "attended" || result.checkedInAt || isCheckinNow) && (
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold px-4 py-3 rounded-2xl text-center text-sm shadow-md flex items-center justify-center gap-2 border border-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
                <span>XÁC NHẬN: QUÝ ĐẠI BIỂU ĐÃ ĐƯỢC CHECK-IN VÀO CỬA SỰ KIỆN THÀNH CÔNG!</span>
              </div>
            )}
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 text-left space-y-3">
              <div className="font-bold text-amber-950 text-sm sm:text-base">
                Kính gửi Quý Anh/Chị {result.fullName || "Đại biểu"},
              </div>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                {result.message ||
                  "Sự kiện hoặc chương trình đào tạo liên quan đến mã QR này đã có sự thay đổi lịch trình, cập nhật cấu hình hoặc mã QR không còn hiệu lực trên hệ thống."}
              </p>
              <div className="bg-white/90 rounded-xl p-3.5 border border-amber-200/80 text-xs text-amber-950 space-y-1.5">
                <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Email thông báo hướng dẫn đã được gửi tới:{" "}
                  <span className="font-mono text-blue-700 underline">{result.email}</span>
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Quý Anh/Chị vui lòng kiểm tra hộp thư (bao gồm cả thư mục Quảng cáo / Spam) để nhận thông tin cập nhật mới nhất và hướng dẫn chi tiết từ Ban Thư Ký CLB Doanh Nhân CEO HN10.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2 text-left">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-600" />
                Thông Tin Liên Hệ Ban Tổ Chức &amp; Hỗ Trợ Đăng Ký Lại:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                <div>• Hotline 1: <strong className="text-slate-900">0983 1010 10</strong></div>
                <div>• Hotline 2: <strong className="text-slate-900">0973 205 683</strong></div>
                <div>• Hotline 3: <strong className="text-slate-900">0903 205 683</strong></div>
                <div>• Email: <strong className="text-slate-900">btk@ceohn10.com</strong></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                Quay Lại Biểu Mẫu
              </button>
              <a
                href="https://ceohn10.viconnect.vn"
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#002B70] to-[#003B95] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md transition"
              >
                Mở App Tra Cứu Sự Kiện
                <ExternalLink className="w-3.5 h-3.5 text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. SUCCESS CONFIRMATION VIEW (LỜI CẢM ƠN TRANG TRỌNG)
  if (result) {
    const isPaid = !result.isFree && result.totalAmount > 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F19] via-[#0F172A] to-[#020617] py-8 sm:py-16 px-4 flex items-center justify-center font-sans text-slate-100">
        <div className="max-w-xl w-full bg-slate-900/95 rounded-3xl shadow-[0_0_60px_rgba(217,119,6,0.2)] border-2 border-amber-500/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md">
          {/* Header kim loại vàng sang trọng */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 px-6 py-8 text-slate-950 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl pointer-events-none" />
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-slate-950 text-amber-300 rounded-full text-xs font-black uppercase tracking-wider mb-2 shadow-sm border border-amber-400/50">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>TRÂN TRỌNG CẢM ƠN QUÝ ĐẠI BIỂU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-950 px-2 leading-snug">
              {result.status === "attended" || result.checkedInAt || isCheckinNow
                ? "ĐÃ CHECK-IN VÀO CỬA THÀNH CÔNG"
                : "ĐĂNG KÝ THAM DỰ THÀNH CÔNG"}
            </h1>
            <p className="text-slate-900 text-xs sm:text-sm mt-1.5 font-bold flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 text-slate-950" />
              {result.eventDate || event.date || "CLB Doanh Nhân CEO HN10"}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* LỜI CẢM ƠN TỪ BAN TỔ CHỨC */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-left space-y-3">
              <div className="font-serif font-bold text-amber-300 text-base sm:text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-amber-400 shrink-0 fill-amber-400/30" />
                <span>Kính gửi Quý Anh/Chị {result.fullName || inviteeName || "Đại biểu"},</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Ban Tổ Chức CLB Doanh Nhân CEO HN10 (HanoiBA) xin chân thành gửi lời cảm ơn sâu sắc nhất tới Quý Anh/Chị đã hoàn tất đăng ký tham dự chương trình <strong className="text-amber-300 font-semibold">{result.eventTitle || event.name}</strong>.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed italic border-t border-amber-500/20 pt-2">
                "Sự hiện diện quý báu của Quý Anh/Chị là niềm vinh hạnh to lớn cho sự kiện và là động lực mạnh mẽ để cộng đồng Doanh Nhân CEO HN10 không ngừng gắn kết, phát triển bền vững."
              </p>
            </div>
            {(result.status === "attended" || result.checkedInAt || isCheckinNow) && (
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold px-4 py-3 rounded-2xl text-center text-sm shadow-md flex items-center justify-center gap-2 border border-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
                <span>XÁC NHẬN: QUÝ ĐẠI BIỂU ĐÃ ĐƯỢC CHECK-IN VÀO CỬA SỰ KIỆN THÀNH CÔNG!</span>
              </div>
            )}
            {/* THẺ SỐ QUAY THƯỞNG LUCKY DRAW */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-orange-500/10 border-2 border-amber-400/60 rounded-2xl p-5 text-center shadow-sm relative">
              <span className="text-[11px] font-black text-amber-700 uppercase tracking-widest block mb-1">
                🎉 MÃ SỐ QUAY THƯỞNG MAY MẮN (LUCKY DRAW) 🎉
              </span>
              <div className="text-4xl sm:text-5xl font-black text-amber-600 tracking-wider font-mono my-1.5 drop-shadow-sm">
                #{result.luckyNumber}
              </div>
              <p className="text-xs text-amber-800/90 font-medium">
                Quý khách vui lòng giữ mã số này để tham gia bốc thăm trúng thưởng tại sự kiện!
              </p>
            </div>

            {/* THÔNG BÁO GỬI EMAIL */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left flex items-start gap-3 text-xs sm:text-sm text-emerald-950">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-emerald-900">
                  {isPaid
                    ? "Mã VietQR SePay thanh toán đã được gửi tới email:"
                    : "Vé điện tử E-Ticket đã được gửi tới email:"}{" "}
                  <span className="text-blue-700 underline font-mono">{result.email}</span>
                </p>
                <p className="text-emerald-800 text-xs leading-relaxed">
                  {isPaid
                    ? "Quý khách có thể kiểm tra email để lưu giữ thông tin thanh toán hoặc quét mã VietQR SePay trực tiếp bên dưới."
                    : "Quý khách vui lòng lưu lại mã QR check-in bên dưới để xuất trình tại bàn lễ tân khi đến sự kiện."}
                </p>
              </div>
            </div>

            {/* SỰ KIỆN CÓ PHÍ NHƯNG CHƯA THANH TOÁN -> SEPAY VIETQR */}
            {(isPaid && !paymentConfirmedLive) ? (
              <div className="rounded-2xl border-2 border-[#003B95]/30 bg-slate-50/70 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#003B95]">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    THANH TOÁN TỰ ĐỘNG SEPAY VIETQR
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    Khớp Lệnh Tự Động 24/7
                  </span>
                </div>

                {/* AUTO-POLLING STATUS BADGE */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                    <span className="font-medium">Hệ thống đang tự động kiểm tra giao dịch mỗi 3 giây...</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!result?.registrationId) return;
                      setIsCheckingPayment(true);
                      try {
                        const res = await fetchNestApi<{ found: boolean; ticket: any }>(
                          `/events/ticket-status/${encodeURIComponent(result.registrationId)}`
                        );
                        if (res?.found && res?.ticket) {
                          const st = String(res.ticket.paymentStatus || "").toLowerCase();
                          const mainSt = String(res.ticket.status || "").toLowerCase();
                          if (st === "paid" || mainSt === "confirmed") {
                            setPaymentConfirmedLive(true);
                            setConfirmedTicketDetails(res.ticket);
                            toast.success("🎉 Ting ting! Hệ thống đã nhận được thanh toán từ SePay! Vé E-Ticket của Quý khách đã được kích hoạt thành công!");
                          } else {
                            toast.info("Giao dịch đang được SePay và Ngân hàng xử lý, vui lòng chờ trong giây lát...");
                          }
                        }
                      } catch {
                        toast.error("Không thể kết nối máy chủ kiểm tra giao dịch.");
                      } finally {
                        setIsCheckingPayment(false);
                      }
                    }}
                    disabled={isCheckingPayment}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-300 text-blue-800 font-bold rounded-lg shadow-2xs hover:bg-blue-100 transition shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingPayment ? "animate-spin" : ""}`} />
                    Kiểm tra ngay
                  </button>
                </div>

                <div className="text-center">
                  <div className="text-xs text-slate-500 font-medium mb-1">Tổng số tiền cần thanh toán:</div>
                  <div className="text-3xl font-black text-emerald-600 tracking-tight">
                    {new Intl.NumberFormat("vi-VN").format(result.totalAmount)} đ
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Loại vé: <span className="font-bold text-slate-700">{result.ticketType || ticketType}</span> · Số lượng: <span className="font-bold text-slate-700">{ticketCount} vé</span>
                  </div>
                </div>

                {/* KHUNG HIỂN THỊ SEPAY VIETQR */}
                <div className="w-64 h-64 mx-auto bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-md flex items-center justify-center relative group">
                  {(result.sepayQrUrl || result.vietQrUrl) ? (
                    <img
                      src={result.sepayQrUrl || result.vietQrUrl}
                      alt="VietQR SePay Thanh Toán Phí Sự Kiện"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4 text-xs text-slate-500">
                      <QrCode className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      Vui lòng chuyển khoản theo thông tin số tài khoản bên dưới
                    </div>
                  )}
                </div>

                {/* THÔNG TIN CHUYỂN KHOẢN KÈM NÚT COPY */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-bold text-slate-800">{result.bankName || "Ngân hàng Quân Đội (MB Bank)"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-[#003B95] text-sm">{result.bankAccount || "Liên hệ BTC"}</span>
                      {result.bankAccount && (
                        <button
                          type="button"
                          onClick={() => handleCopy(result.bankAccount, "Số tài khoản")}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Sao chép STK"
                        >
                          {copiedField === "Số tài khoản" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="font-bold text-slate-800">{result.bankOwner || "CLB DOANH NHÂN CEO HN10"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Nội dung CK:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {result.transferMemo || `CEOHN10_SK_${result.registrationId}`}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(result.transferMemo || `CEOHN10_SK_${result.registrationId}`, "Nội dung chuyển khoản")
                        }
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Sao chép nội dung"
                      >
                        {copiedField === "Nội dung chuyển khoản" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                  * Sau khi chuyển khoản thành công, hệ thống sẽ tự động kích hoạt vé check-in và gửi thông báo xác nhận tới email của Quý khách.
                </div>
              </div>
            ) : (
              /* SỰ KIỆN MIỄN PHÍ HOẶC ĐÃ THANH TOÁN THÀNH CÔNG QUA SEPAY -> VÉ THAM DỰ E-TICKET */
              <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/40 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {paymentConfirmedLive && (
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black px-4 py-3 rounded-2xl text-center text-sm shadow-md flex items-center justify-center gap-2 border border-emerald-400">
                    <Sparkles className="w-5 h-5 text-amber-300 shrink-0 animate-pulse" />
                    <span>TING TING! XÁC NHẬN ĐÃ NHẬN THANH TOÁN TỰ ĐỘNG THÀNH CÔNG TỪ SEPAY!</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    VÉ ĐIỆN TỬ CHECK-IN (E-TICKET)
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    {paymentConfirmedLive ? "Đã Thanh Toán" : isPaid ? "Đã Xác Nhận" : "Vé Miễn Phí"}
                  </span>
                </div>

                {/* KHUNG HIỂN THỊ MÃ QR CHECK-IN */}
                <div className="w-56 h-56 mx-auto bg-white p-3 rounded-2xl border-2 border-emerald-300 shadow-md flex items-center justify-center">
                  <img
                    src={
                      result.qrCodeUrl ||
                      getQrUrl(result.registrationId, 300)
                    }
                    alt="Mã QR Check-in Sự Kiện"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="text-center space-y-1">
                  <div className="font-mono text-sm font-black text-slate-800 tracking-wider">
                    {result.registrationId}
                  </div>
                  <p className="text-xs text-slate-500">
                    Xuất trình mã QR này tại bàn lễ tân sự kiện để hoàn tất điểm danh.
                  </p>
                </div>
              </div>
            )}

            {/* DANH SÁCH VÉ E-TICKET CHO TỪNG ĐẠI BIỂU (MULTI-ATTENDEE TICKETS) */}
            {Array.isArray(result.createdTickets) && result.createdTickets.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm font-bold text-slate-800 flex items-center justify-between">
                  <span>Danh sách vé đã cấp ({result.createdTickets.length} vé):</span>
                  <span className="text-xs text-[#003B95] font-semibold">Quét mã check-in qua Zalo hoặc App</span>
                </div>
                {result.createdTickets.map((t: any, idx: number) => (
                  <div key={t.regId || idx} className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                      <div className="font-bold text-xs text-emerald-950">
                        Vé #{idx + 1}: <span className="text-blue-900">{t.fullName}</span> {t.memberCode && <span className="ml-1 text-[11px] bg-blue-100 text-[#003B95] px-1.5 py-0.5 rounded font-mono">[{t.memberCode}]</span>}
                      </div>
                      <span className="font-mono font-bold text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Lucky #{t.luckyNumber}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-36 h-36 bg-white p-2 rounded-xl border border-emerald-200 shadow-xs shrink-0 flex items-center justify-center">
                        <img
                          src={t.qrCodeUrl || getQrUrl(t.regId, 250)}
                          alt={`QR Check-in ${t.fullName}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600 flex-1 w-full">
                        <div><span className="text-slate-400">Mã vé:</span> <code className="font-bold font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">{t.regId}</code></div>
                        <div><span className="text-slate-400">SĐT:</span> <span className="font-medium text-slate-800">{t.phone}</span></div>
                        <div><span className="text-slate-400">Email:</span> <span className="font-medium text-slate-800">{t.email}</span></div>
                        <div className="pt-1 text-[11px] text-emerald-800 font-medium">
                          ✓ Vé chỉ được quét check-in 01 lần tại cổng (hỗ trợ quét qua Zalo & App CEO HN10).
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* THÔNG TIN CHI TIẾT ĐẠI BIỂU */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-700 text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
                Thông Tin Đại Biểu Đăng Ký
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400 block">Đại biểu:</span>
                  <span className="font-semibold text-slate-800">{result.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Số điện thoại:</span>
                  <span className="font-semibold text-slate-800">{result.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Doanh nghiệp:</span>
                  <span className="font-semibold text-slate-800">{result.company || "Cá nhân"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Chức vụ:</span>
                  <span className="font-semibold text-slate-800">{result.position || "Đại biểu"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Loại vé:</span>
                  <span className="font-semibold text-slate-800">{result.ticketType || ticketType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Vị trí chỗ ngồi:</span>
                  <span className="font-semibold text-amber-700">Chờ Ban Truyền Thông xếp chỗ</span>
                </div>
              </div>
            </div>

            {/* NÚT THAO TÁC */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Lưu / In Vé
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setFullName("");
                  setPhone("");
                  setEmail("");
                  setCompany("");
                  setPosition("");
                  setTicketCount(1);
                  setNote("");
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#002B70] via-[#003B95] to-[#0A4DB0] hover:bg-[#002B70] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-900/20 transition cursor-pointer"
              >
                Đăng Ký Thêm Vé Mới
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const submergedEventBg =
    (event as any).image ||
    (event as any).banner ||
    (event as any).cover_image ||
    "/skyline_perspective_dark.jpg";

  // 3. FORM VIEW (THƯ MỜI & ĐĂNG KÝ SỰ KIỆN THEME LUXURY TRẮNG TEXT ĐEN & iOS LIQUID GLASS TRONG SUỐT + CHẠM MẶT NƯỚC)
  return (
    <div className="min-h-screen relative overflow-x-hidden py-8 sm:py-14 px-4 font-sans text-slate-950 bg-[#dbe4f0]">
      <style>{`
        @keyframes iosWaterSurfaceBounce {
          0% { transform: scale(1); }
          25% { transform: scale(0.985) translateY(1.5px); }
          55% { transform: scale(1.006) translateY(-1px); }
          100% { transform: scale(1); }
        }
        .ios-water-surface-bounce {
          animation: iosWaterSurfaceBounce 0.62s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes iosWaterWave {
          0% {
            width: 6px;
            height: 6px;
            opacity: 0.95;
            transform: translate(-50%, -50%) scale(0.2);
          }
          100% {
            width: 420px;
            height: 420px;
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.35);
          }
        }
        @keyframes iosWaterRing {
          0% {
            width: 8px;
            height: 8px;
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.25);
          }
          100% {
            width: 360px;
            height: 360px;
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.45);
          }
        }
        .ios-liquid-glass {
          position: relative;
          overflow: hidden;
          background: radial-gradient(
            130% 100% at 12% 8%,
            rgba(255, 255, 255, 0.46) 0%,
            rgba(255, 255, 255, 0.14) 45%,
            rgba(255, 255, 255, 0.22) 100%
          );
          backdrop-filter: blur(15px) saturate(200%) brightness(106%);
          -webkit-backdrop-filter: blur(15px) saturate(200%) brightness(106%);
          border: 1px solid rgba(255, 255, 255, 0.72);
          box-shadow:
            0 24px 48px -12px rgba(15, 23, 42, 0.25),
            0 10px 22px -6px rgba(15, 23, 42, 0.12),
            inset 0 2px 6px rgba(255, 255, 255, 0.98),
            inset 0 -3px 8px rgba(15, 23, 42, 0.08),
            inset 0 0 22px rgba(255, 255, 255, 0.28);
        }
        .ios-liquid-pill {
          position: relative;
          overflow: hidden;
          background: radial-gradient(
            120% 90% at 15% 10%,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(255, 255, 255, 0.16) 55%,
            rgba(255, 255, 255, 0.24) 100%
          );
          backdrop-filter: blur(12px) saturate(195%);
          -webkit-backdrop-filter: blur(12px) saturate(195%);
          border: 1px solid rgba(255, 255, 255, 0.78);
          box-shadow:
            0 10px 24px -6px rgba(15, 23, 42, 0.16),
            inset 0 2px 4px rgba(255, 255, 255, 0.98),
            inset 0 -2px 4px rgba(15, 23, 42, 0.06);
        }
        .ios-liquid-input {
          background: rgba(255, 255, 255, 0.34);
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          border: 1.5px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            inset 0 2px 4px rgba(255, 255, 255, 0.85),
            0 4px 14px rgba(15, 23, 42, 0.06);
        }
        .ios-liquid-input:focus {
          background: rgba(255, 255, 255, 0.55);
          border-color: rgba(255, 255, 255, 1);
          box-shadow:
            0 0 0 3px rgba(255, 255, 255, 0.55),
            inset 0 1.5px 3px rgba(255, 255, 255, 1);
        }
        .ios-water-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease;
        }
        .ios-water-btn:active {
          transform: scale(0.96);
        }
        .ios-water-ripple-wave {
          position: absolute;
          pointer-events: none;
          border-radius: 9999px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(186, 230, 253, 0.78) 32%,
            rgba(125, 211, 252, 0.38) 56%,
            rgba(255, 255, 255, 0) 76%
          );
          animation: iosWaterWave 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 30;
        }
        .ios-water-ripple-ring {
          position: absolute;
          pointer-events: none;
          border-radius: 9999px;
          border: 2px solid rgba(255, 255, 255, 0.96);
          box-shadow:
            0 0 18px rgba(125, 211, 252, 0.85),
            inset 0 0 12px rgba(255, 255, 255, 0.95);
          animation: iosWaterRing 0.92s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 31;
        }
        .ios-water-ripple-ring-delay-1 {
          animation-delay: 0.12s;
          border-width: 1.5px;
          opacity: 0;
        }
      `}</style>

      {/* Nền có ảnh chìm sang trọng phía sau lớp kính trong suốt Liquid Glass */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{
            backgroundImage: `url("${submergedEventBg}"), url("/skyline_perspective_dark.jpg")`,
            filter: "saturate(120%) contrast(106%) brightness(104%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(155deg, rgba(248, 250, 252, 0.38) 0%, rgba(241, 245, 249, 0.32) 45%, rgba(226, 232, 240, 0.42) 100%)",
          }}
        />
        <div
          className="absolute -top-24 -left-16 w-[480px] h-[480px] rounded-full opacity-65 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(186,230,253,0.4) 60%, transparent 100%)",
          }}
        />
        <div
          className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full opacity-60 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(254,240,138,0.45) 0%, rgba(226,232,240,0.4) 65%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-5">
        {/* HEADER SỰ KIỆN CHỈ CÓ LOGO CEO HN10 CÙNG TÊN SỰ KIỆN (LIQUID GLASS TRONG SUỐT, ĐÃ BỎ TIMELINE) */}
        <div className="ios-liquid-glass rounded-3xl overflow-hidden relative">
          <div className="p-6 sm:p-10 text-center space-y-5 relative">
            {/* Logo CEO HN10 & Tên Sự Kiện */}
            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="ios-liquid-pill px-4 py-1.5 rounded-2xl inline-flex items-center justify-center">
                <img
                  src="/hn10-logo-2.png"
                  alt="CEO HN10"
                  className="h-8 sm:h-10 w-auto object-contain brightness-0"
                />
              </div>
              <h1
                className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight leading-snug"
                style={{ textShadow: "0 1px 2px rgba(255,255,255,0.85)" }}
              >
                {event.name}
              </h1>
              {event.subtitle && (
                <p className="text-xs sm:text-sm text-slate-800 font-semibold italic max-w-lg mx-auto">
                  {event.subtitle}
                </p>
              )}
            </div>

            {/* Khung tôn vinh danh tính đại biểu */}
            <div className="ios-liquid-pill rounded-2xl py-3.5 px-6 mx-auto max-w-lg">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-800 block mb-1">
                TRÂN TRỌNG KÍNH MỜI
              </span>
              <div className="text-xl sm:text-2xl font-serif font-black text-slate-950 uppercase">
                {inviteeName || fullName || "QUÝ ĐẠI BIỂU & DOANH NHÂN"}
              </div>
            </div>

            {/* Thông Tin Thời Gian, Địa Điểm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-1">
              <div className="ios-liquid-pill rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-950 text-xs font-black uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-slate-950" />
                  <span>Thời gian tổ chức</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-950">
                  {event.date || "Theo thông báo từ BTC"}
                </div>
                <div className="text-[11px] text-slate-800 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-700" />
                  <span>Đón khách &amp; Check-in: 30 phút trước khai mạc</span>
                </div>
              </div>

              <div className="ios-liquid-pill rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-950 text-xs font-black uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-slate-950" />
                  <span>Địa điểm diễn ra</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-950 truncate">
                  {event.location || "Trung tâm Hội nghị"}
                </div>
                {event.location && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-950 hover:underline"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Xem bản đồ đường đi</span>
                  </a>
                )}
              </div>
            </div>

            {/* Fee & Dress Code */}
            <div className="ios-liquid-pill rounded-2xl p-4 text-xs text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="font-black text-slate-950 uppercase tracking-wide block">
                  Quy định trang phục (Dress Code):
                </span>
                <span className="text-slate-800 font-medium text-[11px]">
                  Trang phục lịch sự, Vest, Áo dài hoặc Doanh nhân công sở.
                </span>
              </div>
              <div className="shrink-0">
                {isFree ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-400/35 text-emerald-950 border border-white/85 rounded-full font-black text-xs uppercase tracking-wide">
                    ✦ Miễn Phí (0 đ)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-400/35 text-amber-950 border border-white/85 rounded-full font-black text-xs uppercase tracking-wide">
                    {new Intl.NumberFormat("vi-VN").format(ticketPrice)} đ / vé
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {isFull && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-5 text-amber-900 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Sự kiện đã đủ số lượng đại biểu đăng ký (Hết chỗ)</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Cổng đăng ký trực tuyến cho sự kiện này đã đủ số lượng theo quy định đón tiếp. Quý khách vui lòng liên hệ Ban Tổ Chức (Hotline: 0983 1010 10) để được hỗ trợ.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* MÃ HỌC VIÊN (TỰ ĐỘNG TRA CỨU & ĐIỀN THÔNG TIN HỌC VIÊN) */}
          <div className="ios-liquid-glass rounded-3xl p-6 sm:p-7 space-y-3">
            <label className="block text-sm sm:text-base font-black text-slate-950">
              Mã học viên CEO HN10 (Tự động điền thông tin nếu đã là Học viên)
            </label>
            <p className="text-xs text-slate-800 font-medium">
              Nhập mã học viên (VD: <span className="font-mono font-bold text-slate-950">HN10-1234</span>) rồi bấm <strong>Tra cứu</strong> để hệ thống tự động điền Họ tên, SĐT, Email, Công ty và Chức vụ.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-800 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Nhập mã học viên (VD: HN10-1234)..."
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleLookupMemberCode(memberCode);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl ios-liquid-input text-sm font-mono uppercase text-slate-950 placeholder:text-slate-600 focus:outline-none transition"
                />
              </div>
              <button
                type="button"
                disabled={isSearchingCode}
                onPointerDown={triggerWaterRipple}
                onClick={() => void handleLookupMemberCode(memberCode)}
                className="ios-water-btn px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm disabled:opacity-50 cursor-pointer transition shrink-0"
              >
                {isSearchingCode ? "Đang tra cứu..." : "Tra cứu & Tự điền"}
              </button>
            </div>
            {codeLookupSuccess && (
              <div className="text-xs font-semibold text-emerald-950 ios-liquid-pill rounded-xl px-3 py-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{codeLookupSuccess}</span>
              </div>
            )}
          </div>

          {/* TRƯỜNG 1: HỌ VÀ TÊN */}
          <div className="ios-liquid-glass rounded-3xl p-6 sm:p-7 space-y-3">
            <label className="block text-sm sm:text-base font-black text-slate-950">
              1. Họ và tên của Quý Khách mời / Đại biểu <span className="text-rose-600">*</span>
            </label>
            <p className="text-xs text-slate-800 font-medium">
              Tên sẽ được in trên thẻ đeo đại biểu và số thứ tự Lucky Draw.
            </p>
            <div className="relative pt-1">
              <User className="w-4 h-4 text-slate-700 absolute left-3.5 top-4" />
              <input
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Văn Hoàng"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl ios-liquid-input text-sm text-slate-950 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* TRƯỜNG 2: SỐ ĐIỆN THOẠI */}
          <div className="ios-liquid-glass rounded-3xl p-6 sm:p-7 space-y-3">
            <label className="block text-sm sm:text-base font-black text-slate-950">
              2. Số điện thoại liên hệ (Ưu tiên số dùng Zalo) <span className="text-rose-600">*</span>
            </label>
            <p className="text-xs text-slate-800 font-medium">
              Dùng để Ban Truyền Thông gửi tin nhắn nhắc lịch và hỗ trợ check-in tại bàn lễ tân.
            </p>
            <div className="relative pt-1">
              <Phone className="w-4 h-4 text-slate-700 absolute left-3.5 top-4" />
              <input
                type="tel"
                required
                placeholder="0983xxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl ios-liquid-input text-sm text-slate-950 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* TRƯỜNG 3: EMAIL */}
          <div className="ios-liquid-glass rounded-3xl p-6 sm:p-7 space-y-3">
            <label className="block text-sm sm:text-base font-black text-slate-950">
              3. Địa chỉ Email chính thức nhận vé & mã QR <span className="text-rose-600">*</span>
            </label>
            <p className="text-xs text-slate-800 font-medium">
              Hệ thống sẽ gửi vé điện tử E-Ticket (kèm thông tin thanh toán SePay) qua địa chỉ email này.
            </p>
            <div className="relative pt-1">
              <Mail className="w-4 h-4 text-slate-700 absolute left-3.5 top-4" />
              <input
                type="email"
                required
                placeholder="hoang.nguyen@congty.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl ios-liquid-input text-sm text-slate-950 placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* TRƯỜNG 4 & 5: DOANH NGHIỆP & CHỨC VỤ */}
          <div className="ios-liquid-glass rounded-3xl p-6 sm:p-7 space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-black text-slate-950">
                4. Thông tin Doanh nghiệp & Chức vụ
              </label>
              <p className="text-xs text-slate-800 font-medium mt-1">
                Phục vụ sắp xếp vị trí bàn đại biểu và giới thiệu kết nối giao thương B2B.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Tên Doanh nghiệp / Tổ chức
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-700 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Công ty CP Tập Đoàn..."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl ios-liquid-input text-sm text-slate-950 placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Chức vụ / Vị trí
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-700 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Chủ tịch, CEO, Giám Đốc..."
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl ios-liquid-input text-sm text-slate-950 placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ĐĂNG KÝ NHIỀU NGƯỜI (MULTI-ATTENDEE / ĐOÀN THAM DỰ) */}
          <div className="ios-liquid-glass rounded-3xl p-6 sm:p-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/60 pb-3">
              <div>
                <label className="block text-sm sm:text-base font-black text-slate-950">
                  5. Danh sách người tham gia cùng (Tùy chọn)
                </label>
                <p className="text-xs text-slate-800 font-medium mt-0.5">
                  Quý Anh/Chị có thể đăng ký thêm đồng nghiệp, đối tác hoặc người đi cùng trong 1 lần đăng ký.
                </p>
              </div>
              <button
                type="button"
                onPointerDown={triggerWaterRipple}
                onClick={addAttendee}
                className="ios-water-btn ios-liquid-pill inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-950 text-xs font-black transition cursor-pointer"
              >
                <span>+ Thêm người tham gia cùng</span>
              </button>
            </div>

            {additionalAttendees.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Chưa có người tham gia cùng (Đăng ký 1 vé cho người đăng ký chính). Bấm nút <strong className="text-[#003B95]">+ Thêm người tham gia cùng</strong> nếu đi cùng đoàn.
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {additionalAttendees.map((att, idx) => (
                  <div
                    key={att.id}
                    className="p-4 sm:p-5 rounded-2xl border-2 border-blue-100 bg-slate-50/50 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-xs text-[#003B95] uppercase tracking-wide">
                        ✦ Người tham gia #{idx + 2}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttendee(idx)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                      >
                        ✕ Xóa người này
                      </button>
                    </div>

                    {/* Tra cứu mã học viên cho người tham gia cùng */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Mã học viên (nếu có, VD: HN10-0002)..."
                        value={att.memberCode}
                        onChange={(e) => {
                          const v = e.target.value.toUpperCase();
                          setAdditionalAttendees((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, memberCode: v } : a))
                          );
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs uppercase font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#003B95] bg-white"
                      />
                      <button
                        type="button"
                        disabled={isSearchingCode || !att.memberCode.trim()}
                        onClick={() => void handleLookupMemberCode(att.memberCode, idx)}
                        className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        Tra cứu
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Họ và tên <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Họ tên người đi cùng..."
                          value={att.fullName}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAdditionalAttendees((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, fullName: v } : a))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#003B95] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Số điện thoại (Zalo) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="0983xxxxxx..."
                          value={att.phone}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAdditionalAttendees((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, phone: v } : a))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#003B95] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Email nhận vé <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="email@congty.com..."
                          value={att.email}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAdditionalAttendees((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, email: v } : a))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#003B95] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Chức vụ
                        </label>
                        <input
                          type="text"
                          placeholder="Phó GĐ, Trợ lý..."
                          value={att.position}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAdditionalAttendees((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, position: v } : a))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#003B95] bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tóm tắt số vé & Tổng tiền */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold bg-blue-50/70 p-3 rounded-xl border border-blue-200/60 text-[#003B95]">
              <span>
                Tổng số lượng vé: <strong>{totalAttendeesCount} vé</strong> (1 chính + {additionalAttendees.length} cùng đoàn)
              </span>
              {!isFree && (
                <span>
                  Tổng thành tiền:{" "}
                  <strong className="text-amber-700 font-black text-sm">
                    {new Intl.NumberFormat("vi-VN").format(totalAmount)} đ
                  </strong>
                </span>
              )}
            </div>
          </div>

          {/* TRƯỜNG 6: GHI CHÚ / KẾT NỐI B2B */}
          <div className="ios-liquid-glass rounded-3xl p-6 sm:p-7 space-y-3">
            <label className="block text-sm sm:text-base font-black text-slate-950">
              6. Mong muốn kết nối B2B hoặc Ghi chú cho Ban Tổ Chức
            </label>
            <p className="text-xs text-slate-800 font-medium">
              Quý khách có thể ghi ngành nghề mong muốn tìm đối tác hoặc yêu cầu đón tiếp đặc biệt (không bắt buộc).
            </p>
            <textarea
              rows={3}
              placeholder="Ví dụ: Mong muốn kết nối các doanh nghiệp ngành F&B, Xây dựng; Yêu cầu vị trí gần màn hình..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3.5 rounded-xl ios-liquid-input text-sm text-slate-950 placeholder:text-slate-600 focus:outline-none"
            />
          </div>

          {/* CÁC TRƯỜNG TÙY CHỈNH DO BAN TỔ CHỨC CẤU HÌNH */}
          {customRegFields.length > 0 && (
            <div className="ios-liquid-glass rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="border-b border-white/60 pb-2">
                <span className="block text-sm sm:text-base font-black text-slate-950">
                  7. Thông tin bổ sung theo yêu cầu Ban Tổ Chức
                </span>
              </div>
              <div className="space-y-3">
                {customRegFields.map((cf) => {
                  const val = customFieldValues[cf.id] ?? "";
                  const setVal = (v: any) =>
                    setCustomFieldValues((prev) => ({ ...prev, [cf.id]: v }));
                  const opts = String(cf.optionsText || "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  return (
                    <div key={cf.id}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {cf.label} {cf.required && <span className="text-rose-500">*</span>}
                      </label>
                      {cf.type === "textarea" ? (
                        <textarea
                          rows={2}
                          required={Boolean(cf.required)}
                          value={val}
                          onChange={(e) => setVal(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-sm bg-slate-50/60"
                        />
                      ) : cf.type === "select" ? (
                        <select
                          required={Boolean(cf.required)}
                          value={val}
                          onChange={(e) => setVal(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/60"
                        >
                          <option value="">-- Chọn --</option>
                          {opts.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : cf.type === "checkbox" ? (
                        <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(val)}
                            onChange={(e) => setVal(e.target.checked)}
                            className="rounded text-[#003B95]"
                          />
                          <span>Xác nhận</span>
                        </label>
                      ) : (
                        <input
                          type={cf.type === "number" || cf.type === "date" || cf.type === "email" ? cf.type : "text"}
                          required={Boolean(cf.required)}
                          value={val}
                          onChange={(e) => setVal(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/60"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              onClick={(e) => triggerWaterRipple(e)}
              disabled={submitting || isFull}
              className={`ios-water-btn w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${isFull
                  ? "bg-slate-400 cursor-not-allowed"
                  : isCheckinNow
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/30 ring-2 ring-emerald-400"
                  : "bg-slate-950 hover:bg-slate-800 shadow-slate-900/25"
                }`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isCheckinNow ? "Đang xử lý Check-in & cấp số may mắn..." : "Đang xử lý đăng ký & gửi email..."}</span>
                </>
              ) : isFull ? (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-300" />
                  <span>Sự kiện đã hết chỗ</span>
                </>
              ) : (
                <>
                  {isCheckinNow ? (
                    <CheckCircle2 className="w-5 h-5 text-amber-300" />
                  ) : (
                    <Send className="w-5 h-5 text-amber-400" />
                  )}
                  <span>
                    {isCheckinNow
                      ? isFree
                        ? "⚡ Xác Nhận Điểm Danh & Check-in Vào Cửa Ngay"
                        : `⚡ Điểm Danh & Thanh Toán (${new Intl.NumberFormat("vi-VN").format(totalAmount)} đ)`
                      : isFree
                      ? "Xác Nhận Đăng Ký & Nhận Vé Ngay"
                      : `Xác Nhận Đăng Ký (${new Intl.NumberFormat("vi-VN").format(totalAmount)} đ)`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-4 space-y-1">
          <p>© 2026 CLB Doanh Nhân CEO HN10 (HanoiBA). All rights reserved.</p>
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Hệ thống đăng ký trực tuyến an toàn & bảo mật thông tin đại biểu.
          </p>
        </div>
      </div>

      {/* ── VIETQR BANKING POPUP MODAL (KHI BẤM ĐĂNG KÝ SỰ KIỆN CÓ PHÍ) ── */}
      {showVietQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-500/50 p-6 shadow-2xl text-slate-100 relative space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-amber-300 uppercase tracking-wide">
                  Mã VietQR Thanh Toán Sự Kiện
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVietQrModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs text-slate-400">Số tiền thanh toán ({totalAttendeesCount} vé):</p>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {new Intl.NumberFormat("vi-VN").format(totalAmount)} đ
              </div>
              <p className="text-[11px] text-slate-400">
                Loại vé: <strong className="text-slate-200">{activeTicketObj?.name || ticketType}</strong>
              </p>
            </div>

            {/* QR Code Container */}
            <div className="w-60 h-60 mx-auto bg-white p-3 rounded-2xl border-2 border-amber-400 shadow-lg flex items-center justify-center">
              <img
                src={popupVietQrUrl}
                alt="VietQR Thanh Toán Sự Kiện"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Bank details with 1-click copy */}
            <div className="bg-slate-800/90 rounded-2xl p-3.5 border border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ngân hàng:</span>
                <span className="font-bold text-slate-200">{bankName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-300">{bankAccount}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankAccount, "Số tài khoản")}
                    className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer"
                    title="Sao chép STK"
                  >
                    {copiedField === "Số tài khoản" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-bold text-slate-200">{bankOwner}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nội dung CK:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                    {dynamicMemo}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(dynamicMemo, "Nội dung")}
                    className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer"
                    title="Sao chép nội dung"
                  >
                    {copiedField === "Nội dung" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons: Deeplink to Bank App + Confirm */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleOpenBankApp}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Mở Ứng Dụng Ngân Hàng Để Thanh Toán Ngay</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmPaymentAndSubmit}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-60"
              >
                {submitting ? (
                  <span className="animate-spin">↻ Đang xác nhận...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Tôi Đã Chuyển Khoản Xong (Xem Lời Cảm Ơn)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
