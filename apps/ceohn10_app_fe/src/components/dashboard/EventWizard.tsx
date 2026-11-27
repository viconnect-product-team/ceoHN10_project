import { useEffect, useMemo, useState, useRef, useDeferredValue } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  QrCode,
  Ticket,
  Trash2,
  X,
  ImagePlus,
  Sparkles,
  MapPin,
  Users,
  Award,
  FileUp,
  FileText,
  UserPlus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  QR_FIELDS,
  type EventItem,
  type QrField,
  type EventSponsorItem,
} from "@/lib/events.functions";
import { fetchNestApi, uploadFileToNest, resolveMediaUrl } from "@/lib/api-client";
import { QrCanvas } from "@/components/member/QrCanvas";
import { useT } from "@/lib/i18n";
import { EVENT_TYPE_TEMPLATES, type EventTypeKey } from "@/lib/event-type-templates";
import { EventQrStaffSelector } from "@/components/events/EventQrStaffSelector";
import { EventSponsorPackageSelector } from "@/components/events/EventSponsorPackageSelector";
import { parseEventDocument, type ParsedEventData } from "@/lib/event-doc-parser";
import { CinemaSeatingMap, buildSeatingLayoutFromTickets } from "@/components/dashboard/CinemaSeatingMap";
import { EventPartsEditor, createDefaultCeoHn10Parts, type EventPartConfig } from "@/components/events/EventPartsEditor";

type EventType = EventItem["type"];
type EventStatus = EventItem["status"];

export type EventCustomFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "email"
  | "phone";

export type EventCustomFieldDraft = {
  id: string;
  label: string;
  type: EventCustomFieldType;
  required?: boolean;
  optionsText?: string;
};

type TicketDraft = {
  partId?: string;
  partName?: string;
  isPartFree?: boolean;
  name: string;
  price: string;
  guestPrice?: string;
  quantity: string;
  description: string;
};

type Info = {
  name: string;
  tagline?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location: string;
  venueName?: string;
  parts?: EventPartConfig[];
  customFields?: EventCustomFieldDraft[];
  capacity: string;
  type: EventType;
  status: EventStatus;
  imageUrl?: string;
  photoGalleryUrl?: string;
  description?: string;
  qrStaff: string[];
  sponsors: EventSponsorItem[];
  isFixed?: boolean;
  recurrenceRule?: string;
  isPaid?: boolean;
  reserveCapacity?: number;
};

const emptyTicket = (): TicketDraft => ({ name: "", price: "", quantity: "", description: "" });

import { VndCurrencyInput, parseVndNumber } from "@/components/dashboard/VndCurrencyInput";
import { StandardDateInput, formatToDdmmyyyy } from "@/components/common/StandardDateInput";
import { GoogleMapAddressPicker } from "@/components/common/GoogleMapAddressPicker";

const TYPE_OPTS: EventType[] = ["khai_giang", "year_end_party", "teambuilding", "be_giang", "charity"];
const STATUS_OPTS: EventStatus[] = ["upcoming", "ongoing", "completed", "cancelled"];

export function EventWizard({
  open,
  onClose,
  onCreated,
  initialType,
  editingEvent,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (event: EventItem) => void;
  initialType?: EventType;
  editingEvent?: EventItem | null;
}) {
  // Chỉ render khi người dùng bấm "Tạo sự kiện" hoặc "Chỉnh sửa" (open=true). Mỗi lần mở là 1 phiên mới.
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <EventWizardDialog
      key={editingEvent?.id || "create"}
      onClose={onClose}
      onCreated={onCreated}
      initialType={initialType}
      editingEvent={editingEvent}
    />,
    document.body,
  );
}

function EventWizardDialog({
  onClose,
  onCreated,
  initialType,
  editingEvent,
}: {
  onClose: () => void;
  onCreated: (event: EventItem) => void;
  initialType?: EventType;
  editingEvent?: EventItem | null;
}) {
  const t = useT();

  // Khóa cuộn trang nền khi popup đang mở
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  const defaultTpl = EVENT_TYPE_TEMPLATES[(initialType as EventTypeKey) || "khai_giang"] || EVENT_TYPE_TEMPLATES.khai_giang;

  const defaultParts = createDefaultCeoHn10Parts();
  const editAny = editingEvent as any;
  const editParts: EventPartConfig[] =
    Array.isArray(editAny?.parts) && editAny.parts.length > 0
      ? editAny.parts
      : defaultParts;
  const parsedTimeParts = String(editAny?.time || "").split("-").map((s: string) => s.trim());
  const initialDateStr = editingEvent?.date
    ? String(editingEvent.date).slice(0, 10)
    : "";
  const initialPartsCap = editParts.reduce((s, p) => s + (Number(p.capacity) || 0), 0);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [createdEvent, setCreatedEvent] = useState<EventItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState<Info>(() => {
    if (editingEvent) {
      return {
        name: editingEvent.name || "",
        tagline: editAny?.tagline || defaultTpl.tagline,
        date: initialDateStr,
        startTime: editAny?.startTime || parsedTimeParts[0] || "08:30",
        endTime: editAny?.endTime || parsedTimeParts[1] || "11:30",
        location: editingEvent.location || "",
        capacity: String(editingEvent.capacity ?? initialPartsCap),
        type: (editingEvent.type as EventType) || "khai_giang",
        status: (editingEvent.status as EventStatus) || "upcoming",
        imageUrl: editAny?.image || editAny?.imageUrl || editAny?.banner || defaultTpl.bgImage,
        photoGalleryUrl: editAny?.photoGalleryUrl || "",
        description: editAny?.description || "",
        qrStaff: editAny?.qrStaff || editAny?.qrScanners || [],
        sponsors: editingEvent.sponsors || [],
        isFixed: Boolean(editAny?.isFixed),
        recurrenceRule: editAny?.recurrenceRule || "Hàng tháng",
        isPaid: Boolean(editAny?.isPaid || Number(editingEvent.ticketPrice || editAny?.fee || 0) > 0 || editParts.some((p) => p.isPaid || Number(p.fee || 0) > 0)),
        venueName: editAny?.venueName || "",
        parts: editParts,
        customFields: Array.isArray(editAny?.customFields)
          ? editAny.customFields
          : Array.isArray(editAny?.dynamicFields)
            ? editAny.dynamicFields
            : [],
      };
    }
    return {
      name: initialType === "charity" ? defaultTpl.name : "",
      tagline: defaultTpl.tagline,
      date: "",
      startTime: "08:30",
      endTime: "11:30",
      location: initialType === "charity" ? defaultTpl.defaultLocation : "",
      capacity: initialType === "charity" ? defaultTpl.defaultCapacity : String(initialPartsCap),
      type: initialType || "khai_giang",
      status: "upcoming",
      imageUrl: defaultTpl.bgImage,
      description: initialType === "charity" ? defaultTpl.description : "",
      qrStaff: [],
      sponsors: [],
      isFixed: false,
      recurrenceRule: "Hàng tháng",
      isPaid: false,
      venueName: "",
      parts: defaultParts,
      customFields: [],
    };
  });
  const [tickets, setTickets] = useState<TicketDraft[]>([]);
  const [qrFields, setQrFields] = useState<QrField[]>(["registration_code"]);
  const [approvedReserveExtra, setApprovedReserveExtra] = useState<number>(0);

  const reset = () => {
    setStep(0);
    setCreatedEvent(null);
    setInfo({
      name: "",
      tagline: defaultTpl.tagline,
      date: "",
      startTime: "08:30",
      endTime: "11:30",
      location: "",
      capacity: "",
      type: "khai_giang",
      status: "upcoming",
      imageUrl: defaultTpl.bgImage,
      description: "",
      qrStaff: [],
      sponsors: [],
      isFixed: false,
      recurrenceRule: "Hàng tháng",
      isPaid: false,
    });
    setTickets([]);
    setQrFields(["registration_code"]);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const qrSample = useMemo(() => {
    const parts: string[] = [];
    if (qrFields.includes("registration_code")) parts.push("REG-XXXXXX");
    if (qrFields.includes("verify_url")) parts.push(`${originSafe()}/verify?c=REG-XXXXXX`);
    if (qrFields.includes("ticket_code")) {
      const activeTicketName =
        tickets.slice().reverse().find((t) => t.name.trim())?.name.trim() ||
        tickets[0]?.name.trim() ||
        "TK-STANDARD";
      parts.push(activeTicketName);
    }
    return parts.join("|") || "REG-XXXXXX";
  }, [qrFields, tickets]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateInfo = () => {
    const errs: Record<string, string> = {};
    if (!info.name.trim()) {
      errs.name = "Vui lòng nhập tên sự kiện!";
    }
    if (!info.date.trim()) {
      errs.date = "Vui lòng chọn ngày diễn ra theo định dạng ngày/tháng/năm!";
    }
    if (!info.location.trim()) {
      errs.location = "Vui lòng nhập địa điểm tổ chức sự kiện!";
    }
    const partsList = Array.isArray(info.parts) ? info.parts : [];
    if (partsList.length > 0) {
      const missingPart = partsList.find((p) => !Number(p.capacity) || Number(p.capacity) <= 0);
      if (missingPart) {
        errs.capacity = `Vui lòng nhập sức chứa (> 0) cho "${missingPart.name || "phần chương trình"}"!`;
      }
    } else if (!info.capacity.trim() || Number(info.capacity) <= 0) {
      errs.capacity = "Vui lòng nhập số lượng đại biểu (sức chứa)!";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc có dấu (*)");
      return false;
    }
    return true;
  };

  const validateTickets = () => {
    const errs: Record<string, string> = {};
    tickets.forEach((tk, idx) => {
      if (!tk.name.trim()) {
        errs[`ticket_${idx}_name`] = "Vui lòng nhập tên hạng vé!";
      }
      const priceNum = parseVndNumber(tk.price);
      if ((!info.isPaid || tk.isPartFree) && priceNum > 0) {
        errs[`ticket_${idx}_price`] = "Phần/sự kiện miễn phí không được đặt giá > 0";
      }
      if (info.isPaid && tk.isPartFree === false && priceNum <= 0) {
        errs[`ticket_${idx}_price`] = "Vui lòng nhập giá vé > 0đ cho phần có thu phí";
      }
    });
    setErrors(errs);
    if (info.isPaid && tickets.length === 0) {
      toast.error("Có phần thu phí, vui lòng thiết lập ít nhất 1 hạng vé!");
      return false;
    }
    if (info.isPaid && !tickets.some((tk) => parseVndNumber(tk.price) > 0)) {
      toast.error("Vui lòng nhập giá vé > 0đ cho ít nhất 1 phần có thu phí!");
      return false;
    }
    if (Object.keys(errs).length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin giá vé!");
      return false;
    }
    return true;
  };

  const syncTicketsFromParts = () => {
    const parts = Array.isArray(info.parts) ? info.parts : [];
    const hasPaidPart = parts.some((p) => Boolean(p.isPaid));
    setInfo((prev) => ({ ...prev, isPaid: hasPaidPart }));

    // Chỉ đồng bộ tên phần & trạng thái miễn phí/có phí cho các vé người tạo đã nhập;
    // KHÔNG tự động sinh sẵn loại vé hay số lượng vé.
    setTickets((prev) =>
      prev.map((tk) => {
        if (!tk.partId) return tk;
        const matchedPart = parts.find((p) => p.id === tk.partId);
        if (!matchedPart) return tk;
        return {
          ...tk,
          partName: matchedPart.name,
          isPartFree: !matchedPart.isPaid,
          price: matchedPart.isPaid ? tk.price : "0",
          guestPrice: matchedPart.isPaid ? (tk.guestPrice ?? "0") : "0",
        };
      }),
    );
  };

  const next = () => {
    if (step === 0) {
      if (!validateInfo()) return;
      syncTicketsFromParts();
    }
    if (step === 1) {
      if (!validateTickets()) return;
      const partsList = Array.isArray(info.parts) ? info.parts : [];
      let extra = 0;
      const overParts: string[] = [];
      if (partsList.length > 0) {
        for (const p of partsList) {
          const partCap = Number(p.capacity) || 0;
          const partQty = tickets
            .filter((tk) => tk.partId === p.id)
            .reduce((sum, tk) => sum + (parseInt(String(tk.quantity).replace(/\D/g, ""), 10) || 0), 0);
          if (partCap > 0 && partQty > partCap) {
            const diff = partQty - partCap;
            extra += diff;
            overParts.push(`${p.name}: ${partQty}/${partCap} vé (+${diff})`);
          }
        }
      } else {
        const declaredCap = parseInt(String(info.capacity).replace(/\D/g, ""), 10) || 0;
        const totalTicketsQty = tickets.reduce(
          (sum, tk) => sum + (parseInt(String(tk.quantity).replace(/\D/g, ""), 10) || 0),
          0,
        );
        if (declaredCap > 0 && totalTicketsQty > declaredCap) {
          extra = totalTicketsQty - declaredCap;
        }
      }
      if (extra > 0) {
        if (approvedReserveExtra !== extra) {
          const detailText = overParts.length > 0 ? `\n(${overParts.join("; ")})` : "";
          const ok = window.confirm(
            `Số lượng vé đã nhập vượt quá ${extra.toLocaleString("vi-VN")} vé so với sức chứa đã khai báo ở Bước 1.${detailText}\n\nBạn có muốn tạo thêm ${extra.toLocaleString("vi-VN")} vé dự phòng cho khách đến check-in chưa đăng ký qua form không?`,
          );
          if (!ok) {
            toast.info("Vui lòng điều chỉnh lại số lượng vé theo đúng sức chứa từng phần ở Bước 1.");
            return;
          }
          setApprovedReserveExtra(extra);
          setInfo((prev) => ({ ...prev, reserveCapacity: extra }));
          toast.success(`Đã kích hoạt thêm ${extra.toLocaleString("vi-VN")} vé dự phòng check-in tại quầy!`);
        }
      } else if (approvedReserveExtra !== 0) {
        setApprovedReserveExtra(0);
        setInfo((prev) => ({ ...prev, reserveCapacity: 0 }));
      }
    }
    setStep((s) => (s + 1) as 0 | 1 | 2);
  };

  const back = () => setStep((s) => (s - 1) as 0 | 1 | 2);

  const toggleQr = (f: QrField) => {
    setQrFields((prev) => (prev.includes(f) ? prev.filter((x: any) => x !== f) : [...prev, f]));
  };

  const submit = async () => {
    if (!validateInfo() || !validateTickets()) return;
    if (qrFields.length === 0) {
      toast.error(t("ewz.err.qr"));
      return;
    }
    setSubmitting(true);
    try {
      const syncedParts = (Array.isArray(info.parts) ? info.parts : []).map((part) => {
        const partTickets = tickets.filter((tk) => tk.partId === part.id);
        const partTicketQty = partTickets.reduce(
          (sum, tk) => sum + (parseInt(String(tk.quantity).replace(/\D/g, ""), 10) || 0),
          0,
        );
        const matchedTicket = partTickets[0];
        const pFee = matchedTicket ? (part.isPaid ? parseVndNumber(matchedTicket.price) : 0) : part.fee;
        const gFee = matchedTicket ? (part.isPaid ? parseVndNumber(matchedTicket.guestPrice || "0") : 0) : part.guestFee;
        return {
          ...part,
          capacity: Number(part.capacity) || 0,
          ticketQuantity: partTicketQty,
          fee: pFee,
          guestFee: gFee,
        };
      });
      const computedTicketPrice =
        info.isPaid && tickets.length > 0
          ? Math.max(0, ...tickets.map((tk) => parseVndNumber(tk.price)))
          : info.isPaid
            ? Math.max(0, ...syncedParts.map((p) => Number(p.fee || 0)))
            : 0;

      const payloadBody = {
        name: info.name.trim(),
        tagline: (info.tagline || "").trim(),
        date: info.date,
        startTime: (info.startTime || "08:30").trim(),
        endTime: (info.endTime || "11:30").trim(),
        time: `${(info.startTime || "08:30").trim()} - ${(info.endTime || "11:30").trim()}`,
        location: info.location.trim(),
        venueName: (info.venueName || "").trim(),
        parts: syncedParts,
        customFields: Array.isArray(info.customFields) ? info.customFields : [],
        dynamicFields: Array.isArray(info.customFields) ? info.customFields : [],
        address: info.location.trim(),
        capacity: (Number(info.capacity) || 0) + (approvedReserveExtra > 0 ? approvedReserveExtra : 0),
        reserveCapacity: approvedReserveExtra,
        allowWalkinCheckin: approvedReserveExtra > 0,
        type: info.type,
        status: info.status,
        imageUrl: info.imageUrl,
        image: info.imageUrl,
        banner: info.imageUrl,
        photoGalleryUrl: info.photoGalleryUrl || "",
        isFixed: !!info.isFixed,
        recurrenceRule: info.recurrenceRule || "",
        isPaid: !!info.isPaid,
        ticketPrice: computedTicketPrice,
        fee: computedTicketPrice,
        description: info.description || "",
        qrStaff: info.qrStaff,
        qrScanners: info.qrStaff,
        sponsors: info.sponsors,
        qrFields,
        tickets: tickets.map((tk) => ({
          name: tk.name.trim(),
          price: info.isPaid ? parseVndNumber(tk.price) : 0,
          quantity: parseInt(String(tk.quantity).replace(/\D/g, ""), 10) || 0,
          description: tk.description.trim(),
        })),
      };

      if (editingEvent?.id) {
        const res = await fetchNestApi<{ event: EventItem }>(`/events/${editingEvent.id}`, {
          method: "PUT",
          body: JSON.stringify(payloadBody),
        });
        const updatedEv = res?.event || (res as unknown as EventItem) || editingEvent;
        onCreated(updatedEv);
        toast.success("Đã lưu cập nhật sự kiện thành công!");
        reset();
        onClose();
        return;
      }

      const res = await fetchNestApi<{ event: EventItem }>("/events", {
        method: "POST",
        body: JSON.stringify(payloadBody),
      });
      const createdEv = res?.event || (res as unknown as EventItem);
      if (createdEv?.id && tickets.length > 0) {
        try {
          const layout = buildSeatingLayoutFromTickets(
            tickets.map((tk) => ({
              name: tk.name.trim(),
              quantity: parseInt(String(tk.quantity).replace(/\D/g, ""), 10) || 0,
              price: parseVndNumber(tk.price),
              description: tk.description.trim(),
            }))
          );
          localStorage.setItem(`ceohn10_dynamic_seats_${createdEv.id}`, JSON.stringify(layout.dynamicSeats));
          localStorage.setItem(`ceohn10_dynamic_zones_${createdEv.id}`, JSON.stringify(layout.dynamicZones));
          localStorage.setItem(`ceohn10_cinema_rows_${createdEv.id}`, JSON.stringify(layout.cinemaRows));
          localStorage.setItem(`ceohn10_seating_zones_${createdEv.id}`, JSON.stringify(layout.seatingZones));
          localStorage.setItem(`ceohn10_banquet_tables_${createdEv.id}`, JSON.stringify(layout.banquetTables));
        } catch {}
      }
      setCreatedEvent(createdEv);
      onCreated(createdEv);
      setStep(3);
      toast.success("Khởi tạo sự kiện thành công! Sơ đồ chỗ ngồi đã được tự động khởi tạo đúng theo các hạng vé.");
    } catch (err: any) {
      console.error("[EventWizard] Create error:", err);
      toast.error(err?.message || t("ewz.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    t("ewz.step.info"),
    t("ewz.step.tickets"),
    t("ewz.step.qr"),
    "Đăng ký thành viên",
  ];
  const announcement = submitting
    ? t("ewz.announce.submitting")
    : t("ewz.announce.step", { n: step + 1, total: 4, label: steps[step] });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={close}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close();
        }
      }}
    >
      <p className="sr-only" role="status" aria-live="polite" data-testid="ewz-announcement">
        {announcement}
      </p>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("ewz.title")}
        aria-busy={submitting}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card text-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + stepper */}
        <div className="border-b border-border bg-slate-50 dark:bg-card/90 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#003B95] dark:text-blue-400" />
              <span>
                {step === 3
                  ? "Đăng Ký Thành Viên Tham Dự Sự Kiện"
                  : editingEvent
                    ? `Chỉnh Sửa Sự Kiện — ${editingEvent.name}`
                    : t("ewz.title")}
              </span>
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label={t("ewz.cancel")}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <ol
            className="flex items-center gap-2"
            aria-label={t("ewz.step.of", { n: step + 1, total: 4 })}
          >
            {steps.map((label, i) => (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    i < step
                      ? "bg-emerald-600 text-white font-bold"
                      : i === step
                      ? "bg-[#003B95]/15 text-[#003B95] ring-2 ring-[#003B95] font-bold dark:text-blue-400 dark:ring-blue-400"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                  aria-current={i === step ? "step" : undefined}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <span
                  className={`truncate text-xs font-medium ${
                    i === step ? "text-[#003B95] dark:text-blue-400 font-bold" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                {i < steps.length - 1 && (
                  <span className="hidden h-px flex-1 bg-border sm:block" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-background text-foreground">
          {step === 0 && (
            <InfoStep
              info={info}
              setInfo={setInfo}
              errors={errors}
              setErrors={setErrors}
              onTogglePaid={(newPaid) => {
                setInfo({ ...info, isPaid: newPaid });
                if (!newPaid) {
                  setTickets((prev) => prev.map((t) => ({ ...t, price: "0" })));
                }
              }}
            />
          )}
          {step === 1 && (
            <TicketStep
              isPaid={!!info.isPaid}
              declaredCapacity={parseInt(String(info.capacity).replace(/\D/g, ""), 10) || 0}
              approvedReserveExtra={approvedReserveExtra}
              parts={Array.isArray(info.parts) ? info.parts : []}
              tickets={tickets}
              setTickets={setTickets}
              errors={errors}
              setErrors={setErrors}
            />
          )}
          {step === 2 && <QrStep qrFields={qrFields} toggleQr={toggleQr} sample={qrSample} />}
          {step === 3 && createdEvent && (
            <AttendeeRegistrationStep
              event={createdEvent}
              tickets={tickets}
              customFields={info.customFields || []}
              onClose={close}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border bg-slate-50 dark:bg-card/90 p-4">
          {step === 3 ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-muted-foreground">
                Sự kiện đã được lưu an toàn vào hệ thống. Bạn có thể đóng bất kỳ lúc nào.
              </span>
              <button
                type="button"
                onClick={close}
                className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold bg-[#003B95] hover:bg-[#002d73] text-white shadow-md shadow-[#003B95]/20 cursor-pointer transition active:scale-95"
              >
                <Check className="h-4 w-4" />
                <span>Hoàn tất &amp; Đóng cửa sổ</span>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={step === 0 ? close : back}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
              >
                {step === 0 ? (
                  t("ewz.cancel")
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {t("ewz.back")}
                  </>
                )}
              </button>
              <div className="flex items-center gap-2">
                {editingEvent && (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-60 cursor-pointer transition active:scale-95"
                  >
                    <Check className="h-4 w-4 text-white" aria-hidden="true" />
                    {submitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                  </button>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold bg-[#003B95] hover:bg-[#002d73] text-white shadow-md shadow-[#003B95]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer transition active:scale-95"
                  >
                    {t("ewz.next")} <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold bg-[#003B95] hover:bg-[#002d73] text-white shadow-md shadow-[#003B95]/20 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer transition active:scale-95"
                  >
                    <Check className="h-4 w-4 text-white" aria-hidden="true" />
                    {submitting ? "Đang xử lý..." : editingEvent ? "Lưu Thay Đổi" : t("ewz.create")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function originSafe() {
  return typeof window !== "undefined" ? window.location.origin : "https://app";
}

const inputCls =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-[#003B95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003B95]/30 transition";
const labelCls = "mb-1.5 block text-xs font-semibold text-foreground";

function InfoStep({
  info,
  setInfo,
  errors,
  setErrors,
  onTogglePaid,
}: {
  info: Info;
  setInfo: (v: Info) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onTogglePaid?: (v: boolean) => void;
}) {
  const t = useT();
  const currentTpl = EVENT_TYPE_TEMPLATES[info.type as EventTypeKey] || EVENT_TYPE_TEMPLATES.forum;

  const [parsingFile, setParsingFile] = useState(false);
  const [extractedSummary, setExtractedSummary] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingFile(true);
    const toastId = toast.loading(`Đang đọc và bóc tách dữ liệu từ file ${file.name}...`);
    try {
      const parsed = await parseEventDocument(file);
      setExtractedSummary(parsed.extractedFields);

      setInfo({
        ...info,
        name: parsed.name || info.name,
        date: parsed.date || info.date,
        startTime: parsed.startTime || info.startTime,
        endTime: parsed.endTime || info.endTime,
        location: parsed.location || info.location,
        capacity: parsed.capacity || info.capacity,
        description: parsed.description || info.description,
        tagline: parsed.tagline || info.tagline,
        type: parsed.type || info.type,
      });

      // Clear validate errors for extracted fields
      setErrors((prev) => {
        const copy = { ...prev };
        if (parsed.name) delete copy.name;
        if (parsed.date) delete copy.date;
        if (parsed.location) delete copy.location;
        if (parsed.capacity) delete copy.capacity;
        return copy;
      });

      toast.success(
        `Bóc tách thành công! Đã trích xuất: ${parsed.extractedFields.join(", ")}`,
        { id: toastId }
      );
    } catch (err: any) {
      console.error("[InfoStep] File parse error:", err);
      toast.error(err?.message || "Không thể bóc tách nội dung từ file này", { id: toastId });
    } finally {
      setParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelectType = (newType: EventTypeKey) => {
    const tpl = EVENT_TYPE_TEMPLATES[newType];
    setInfo({
      ...info,
      type: newType,
      name: tpl.name,
      tagline: tpl.tagline,
      location: tpl.defaultLocation,
      capacity: tpl.defaultCapacity,
      imageUrl: tpl.bgImage,
      description: tpl.description,
    });
    toast.info(`Đã áp dụng bố cục nội dung & banner: ${tpl.label}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("ewz.info.heading")}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("ewz.info.hint")}</p>
      </div>

      {/* Trường Import File (Excel, Word, PDF) - Không require, tự động bóc tách */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#003B95]/10 text-[#003B95] dark:text-blue-400">
              <FileUp className="h-4 w-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-foreground">
                Tự động bóc tách thông tin từ File (Excel, Word, PDF)
              </span>
              <span className="ml-1.5 rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Tùy chọn
              </span>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsingFile}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-card px-3.5 py-2 text-xs font-bold text-[#003B95] dark:text-blue-300 shadow-xs hover:bg-blue-50 dark:hover:bg-muted transition cursor-pointer disabled:opacity-50"
            >
              {parsingFile ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang đọc &amp; bóc tách...</span>
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5 text-[#003B95]" />
                  <span>Chọn File Excel, Word hoặc PDF</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.docx,.doc,.pdf,.txt,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Đưa file kế hoạch sự kiện, công văn hoặc thông báo vào để hệ thống tự động bóc tách: <strong>Tên sự kiện</strong>, <strong>Lịch trình / Ngày giờ</strong>, <strong>Địa điểm</strong>, <strong>Diễn giả (speaker)</strong>, <strong>Sức chứa</strong> và <strong>Mô tả chi tiết</strong> rồi tự động điền vào các trường bên dưới.
        </p>

        {extractedSummary.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Đã bóc tách thành công:
            </span>
            {extractedSummary.map((field) => (
              <span
                key={field}
                className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800 dark:text-emerald-300"
              >
                ✓ {field}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Event Type Grid Selector (Requirement 2: chọn loại sự kiện -> tự động hiện text & banner đúng) */}
      <div>
        <label className={labelCls}>
          Chọn loại sự kiện (Tự động áp dụng bố cục nội dung & banner đặc thù)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {(["khai_giang", "year_end_party", "teambuilding", "be_giang", "charity"] as EventTypeKey[]).map((key) => {
            const tpl = EVENT_TYPE_TEMPLATES[key];
            const isSelected = info.type === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectType(key)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                    ? "border-[#003B95] bg-blue-50 dark:bg-blue-950/30 ring-2 ring-[#003B95]/30 shadow-xs"
                    : "border-border bg-card hover:bg-muted/50 hover:border-[#003B95]/40 text-foreground"
                  }`}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <span className={`text-xs font-bold line-clamp-1 ${isSelected ? "text-[#003B95] dark:text-blue-400" : "text-foreground"}`}>{tpl.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#003B95] dark:text-blue-400 ml-auto shrink-0" />}
                </div>
                <span className="mt-1 text-[10px] text-muted-foreground line-clamp-1">
                  {tpl.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Custom Banner Preview */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls}>Bố cục Banner xem trước theo loại sự kiện</label>
          <button
            type="button"
            onClick={() => handleSelectType(info.type as EventTypeKey)}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            Khôi phục nội dung mẫu
          </button>
        </div>
        <div
          className="relative overflow-hidden rounded-2xl p-4 shadow-md text-white min-h-[160px] flex flex-col justify-between border border-white/15"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url(${info.imageUrl || currentTpl.bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Top Badge */}
          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs"
              style={{ backgroundColor: currentTpl.badgeBg, color: currentTpl.badgeText }}
            >
              {currentTpl.badge}
            </span>
            <span className="text-[10px] font-bold text-white/80 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
              CLB CEO HN10
            </span>
          </div>

          {/* Headline Title & Tagline */}
          <div className="my-2">
            <h4 className="text-sm sm:text-base font-extrabold uppercase leading-tight tracking-tight drop-shadow-md text-white line-clamp-2">
              {info.name || currentTpl.name}
            </h4>
            <p className="mt-1 text-xs font-semibold drop-shadow-sm line-clamp-1" style={{ color: currentTpl.accentColor }}>
              {info.tagline !== undefined && info.tagline !== "" ? info.tagline : currentTpl.tagline}
            </p>
          </div>

          {/* Bottom Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/20 text-[10.5px] text-white/90">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
              <span className="line-clamp-1 max-w-[220px]">{info.location || currentTpl.defaultLocation}</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span>📅 {info.date ? formatToDdmmyyyy(info.date) : "25/09/2026"}</span>
              <span>👥 {info.capacity || currentTpl.defaultCapacity} khách</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Fields */}
      <div>
        <label className={labelCls} htmlFor="ewz-name">
          {t("ewz.field.name")} <span className="text-destructive font-bold">*</span>
        </label>
        <input
          id="ewz-name"
          className={`${inputCls} ${errors.name ? "border-destructive ring-1 ring-destructive/30" : ""}`}
          placeholder="Nhập tên sự kiện (ví dụ: Gala Doanh Nhân CEO HN10 - Kỷ Niệm 10 Năm)..."
          value={info.name}
          onChange={(e) => {
            setInfo({ ...info, name: e.target.value });
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
          }}
        />
        {errors.name && (
          <p className="mt-1 text-xs font-semibold text-destructive animate-in fade-in duration-150">
            {errors.name}
          </p>
        )}
      </div>

      {/* Trường mới: Khẩu hiệu / Thông điệp phụ trên Banner */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls} htmlFor="ewz-tagline">
            Khẩu hiệu / Thông điệp phụ trên Banner (Tagline / Slogan)
          </label>
          <span className="text-[10px] text-muted-foreground">Hiển thị trực tiếp dưới tiêu đề banner xem trước</span>
        </div>
        <input
          id="ewz-tagline"
          className={inputCls}
          placeholder="Nhập khẩu hiệu banner (ví dụ: Bứt phá tăng trưởng & Kết nối giao thương đa ngành)..."
          value={info.tagline ?? ""}
          onChange={(e) => {
            setInfo({ ...info, tagline: e.target.value });
          }}
        />
      </div>

      {/* Event Banner / Photo Upload */}
      <div>
        <label className={labelCls}>Ảnh nền Banner sự kiện</label>
        {info.imageUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img
              src={resolveMediaUrl(info.imageUrl) || info.imageUrl}
              alt="Banner sự kiện"
              className="h-28 w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setInfo({ ...info, imageUrl: "" })}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/70 text-white hover:bg-rose-600 transition"
              aria-label="Xoá ảnh"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800/60 bg-blue-50 dark:bg-[#001433]/60 p-3 hover:border-blue-400 dark:hover:border-amber-400/60 hover:bg-blue-100 dark:hover:bg-[#001838] transition">
            <ImagePlus className="h-6 w-6 text-blue-400 dark:text-amber-400/80 mb-1" />
            <span className="text-xs font-semibold text-blue-700 dark:text-white">Tải ảnh sự kiện lên</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">PNG, JPG hoặc WEBP</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const toastId = toast.loading("Đang tải ảnh sự kiện lên hệ thống...");
                try {
                  const uploadedUrl = await uploadFileToNest(file, `event_${Date.now()}_${file.name}`);
                  setInfo({ ...info, imageUrl: uploadedUrl });
                  toast.success("Đã tải ảnh sự kiện thành công!", { id: toastId });
                } catch (err: any) {
                  toast.error(err?.message || "Lỗi tải ảnh sự kiện", { id: toastId });
                }
              }}
            />
          </label>
        )}
      </div>

      <div className={(info.parts?.length || 0) > 0 ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}>
        <div>
          <label className={labelCls} htmlFor="ewz-date">
            {t("ewz.field.date")} (dd/mm/yyyy) <span className="text-destructive font-bold">*</span>
          </label>
          <StandardDateInput
            id="ewz-date"
            className={`${inputCls} ${errors.date ? "border-destructive ring-1 ring-destructive/30" : ""}`}
            value={info.date}
            placeholder="dd/mm/yyyy (ví dụ: 25/10/2026)"
            onChange={(isoVal) => {
              setInfo({ ...info, date: isoVal });
              if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
            }}
          />
          {errors.date && (
            <p className="mt-1 text-xs font-semibold text-destructive animate-in fade-in duration-150">
              {errors.date}
            </p>
          )}
        </div>
        {(info.parts?.length || 0) === 0 && (
          <div>
            <label className={labelCls} htmlFor="ewz-capacity">
              {t("ewz.field.capacity")} <span className="text-destructive font-bold">*</span>
            </label>
            <input
              id="ewz-capacity"
              type="number"
              min={0}
              className={`${inputCls} ${errors.capacity ? "border-destructive ring-1 ring-destructive/30" : ""}`}
              placeholder="Ví dụ: 100 chỗ ngồi"
              value={info.capacity}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => {
                setInfo({ ...info, capacity: e.target.value });
                if (errors.capacity) setErrors((prev) => ({ ...prev, capacity: "" }));
              }}
            />
            {errors.capacity && (
              <p className="mt-1 text-xs font-semibold text-destructive animate-in fade-in duration-150">
                {errors.capacity}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Thời gian bắt đầu - kết thúc */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="ewz-start-time">
            Giờ bắt đầu (VD: 08:30)
          </label>
          <input
            id="ewz-start-time"
            type="text"
            className={inputCls}
            placeholder="08:30"
            value={info.startTime ?? ""}
            onChange={(e) => setInfo({ ...info, startTime: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="ewz-end-time">
            Giờ kết thúc (VD: 11:30)
          </label>
          <input
            id="ewz-end-time"
            type="text"
            className={inputCls}
            placeholder="11:30"
            value={info.endTime ?? ""}
            onChange={(e) => setInfo({ ...info, endTime: e.target.value })}
          />
        </div>
      </div>

      <div>
        <GoogleMapAddressPicker
          id="ewz-location"
          label={t("ewz.field.location")}
          required
          value={info.location}
          onChange={(addr, extra) => {
            setInfo({
              ...info,
              location: addr,
              ...(extra?.mapUrl ? { photoGalleryUrl: info.photoGalleryUrl || extra.mapUrl } : {}),
            });
            if (errors.location) setErrors((prev) => ({ ...prev, location: "" }));
          }}
          placeholder="Địa chỉ / Khách sạn tổ chức (ví dụ: Trung tâm Hội nghị Quốc gia, Hà Nội)..."
          error={errors.location}
          showQuickLocations={true}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="ewz-type">
            {t("ewz.field.type")}
          </label>
          <select
            id="ewz-type"
            className={inputCls}
            value={info.type}
            onChange={(e) => handleSelectType(e.target.value as EventTypeKey)}
          >
            {TYPE_OPTS.map((o) => (
              <option key={o} value={o}>
                {t(`events.type.${o}` as never)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="ewz-status">
            {t("ewz.field.status")}
          </label>
          <select
            id="ewz-status"
            className={inputCls}
            value={info.status}
            onChange={(e) => setInfo({ ...info, status: e.target.value as EventStatus })}
          >
            {STATUS_OPTS.map((o) => (
              <option key={o} value={o}>
                {t(`events.status.${o}` as never)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* UC-2: TÍNH CHẤT SỰ KIỆN CỐ ĐỊNH & THU PHÍ */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-card border border-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Cố định vs Không cố định */}
          <div>
            <label className={labelCls}>Tính chất sự kiện</label>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setInfo({ ...info, isFixed: false })}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${!info.isFixed
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
              >
                Không cố định (Đột xuất)
              </button>
              <button
                type="button"
                onClick={() => setInfo({ ...info, isFixed: true })}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${info.isFixed
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
              >
                Cố định (Định kỳ)
              </button>
            </div>
            {info.isFixed && (
              <div className="mt-2">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Quy luật lặp lại (VD: Thứ 6 tuần thứ 2 hàng tháng)..."
                  value={info.recurrenceRule || ""}
                  onChange={(e) => setInfo({ ...info, recurrenceRule: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Thông báo tự động nhận biết thu phí theo từng phần */}
          <div>
            <label className={labelCls}>Chính sách vé tham gia</label>
            <div className="mt-1 rounded-xl border border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/30 px-3 py-2 text-[11px] text-blue-800 dark:text-blue-200">
              Chọn <strong>Miễn phí</strong> hoặc <strong>Có thu phí</strong> ngay ở từng phần chương trình bên dưới. Bước 2 sẽ tự động nhận biết phần có phí để cấu hình giá vé &amp; tích hợp QR SePay.
            </div>
          </div>
        </div>
      </div>

      {/* Cấu hình các phần chương trình (ẩn ô giá ở Bước 1, tự nhận biết ở Bước 2) */}
      <EventPartsEditor
        venueName={info.venueName || ""}
        onChangeVenueName={(v) => setInfo({ ...info, venueName: v })}
        parts={Array.isArray(info.parts) ? info.parts : createDefaultCeoHn10Parts()}
        onChangeParts={(nextParts) => {
          const sumCap = nextParts.reduce((s, p) => s + (Number(p.capacity) || 0), 0);
          setInfo({
            ...info,
            parts: nextParts,
            ...(nextParts.length > 0 ? { capacity: String(sumCap) } : {}),
          });
          if (errors.capacity) setErrors((prev) => ({ ...prev, capacity: "" }));
        }}
        hidePriceInputs={true}
      />

      {/* Trường dữ liệu động cho form đăng ký sự kiện */}
      <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Thêm Trường Dữ Liệu Động (Form Đăng Ký Sự Kiện)
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Tự do thêm các trường thông tin cần thu thập với đầy đủ định dạng và nhãn (Label) hiển thị trên form đăng ký.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextFields: EventCustomFieldDraft[] = [
                ...(info.customFields || []),
                {
                  id: `cf_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                  label: "",
                  type: "text",
                  required: false,
                  optionsText: "",
                },
              ];
              setInfo({ ...info, customFields: nextFields });
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm trường động
          </button>
        </div>

        {(!info.customFields || info.customFields.length === 0) ? (
          <p className="text-[11px] text-muted-foreground italic">
            Chưa có trường động nào. Bấm &quot;+ Thêm trường động&quot; để tạo thêm câu hỏi / thông tin riêng cho sự kiện này.
          </p>
        ) : (
          <div className="space-y-2.5">
            {info.customFields.map((cf, cfIdx) => (
              <div
                key={cf.id}
                className="rounded-xl border border-border bg-card p-3 space-y-2 shadow-2xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Tên trường (Label)
                    </label>
                    <input
                      type="text"
                      value={cf.label}
                      onChange={(e) => {
                        const next = (info.customFields || []).map((x, i) =>
                          i === cfIdx ? { ...x, label: e.target.value } : x,
                        );
                        setInfo({ ...info, customFields: next });
                      }}
                      placeholder="VD: Yêu cầu ăn chay / Size áo / Số khách đi kèm"
                      className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Định dạng dữ liệu
                    </label>
                    <select
                      value={cf.type}
                      onChange={(e) => {
                        const next = (info.customFields || []).map((x, i) =>
                          i === cfIdx ? { ...x, type: e.target.value as EventCustomFieldType } : x,
                        );
                        setInfo({ ...info, customFields: next });
                      }}
                      className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs font-medium"
                    >
                      <option value="text">Văn bản ngắn (Text)</option>
                      <option value="textarea">Đoạn văn dài (Textarea)</option>
                      <option value="number">Số (Number)</option>
                      <option value="date">Ngày/Tháng/Năm (Date)</option>
                      <option value="select">Danh sách chọn (Dropdown)</option>
                      <option value="checkbox">Checkbox (Có / Không)</option>
                      <option value="email">Email</option>
                      <option value="phone">Số điện thoại</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-1.5 h-9">
                    <input
                      id={`cf-req-${cf.id}`}
                      type="checkbox"
                      checked={Boolean(cf.required)}
                      onChange={(e) => {
                        const next = (info.customFields || []).map((x, i) =>
                          i === cfIdx ? { ...x, required: e.target.checked } : x,
                        );
                        setInfo({ ...info, customFields: next });
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                    <label htmlFor={`cf-req-${cf.id}`} className="text-[11px] font-semibold text-muted-foreground cursor-pointer">
                      Bắt buộc
                    </label>
                  </div>
                  <div className="sm:col-span-1 flex justify-end h-9 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setInfo({
                          ...info,
                          customFields: (info.customFields || []).filter((_, i) => i !== cfIdx),
                        });
                      }}
                      className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg cursor-pointer"
                      title="Xóa trường"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {cf.type === "select" && (
                  <div>
                    <input
                      type="text"
                      value={cf.optionsText || ""}
                      onChange={(e) => {
                        const next = (info.customFields || []).map((x, i) =>
                          i === cfIdx ? { ...x, optionsText: e.target.value } : x,
                        );
                        setInfo({ ...info, customFields: next });
                      }}
                      placeholder="Nhập các lựa chọn phân cách bằng dấu phẩy (VD: Size S, Size M, Size L, Size XL)"
                      className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mô tả / Nội dung chi tiết sự kiện */}
      <div>
        <label className={labelCls} htmlFor="ewz-description">
          Mô tả / Thông tin sự kiện
        </label>
        <textarea
          id="ewz-description"
          rows={3}
          className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-[#003B95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003B95]/30 transition"
          value={info.description || ""}
          onChange={(e) => setInfo({ ...info, description: e.target.value })}
          placeholder="Nhập nội dung tóm tắt, lịch trình hoặc lưu ý tham gia..."
        />
      </div>

      {/* Link ảnh sự kiện (Google Drive / Cloud) dành cho Ban Truyền Thông nạp link ảnh sau sự kiện */}
      <div>
        <label className={labelCls} htmlFor="ewz-photo-gallery">
          Link album ảnh sự kiện (Google Drive / Lưu trữ đám mây)
        </label>
        <input
          id="ewz-photo-gallery"
          type="url"
          className={inputCls}
          placeholder="https://drive.google.com/drive/folders/... hoặc liên kết album ảnh"
          value={info.photoGalleryUrl || ""}
          onChange={(e) => setInfo({ ...info, photoGalleryUrl: e.target.value })}
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Ban Truyền Thông dán link Google Drive hoặc OneDrive chứa ảnh sự kiện vào đây để Học viên xem và tải ảnh sau khi sự kiện kết thúc.
        </p>
      </div>

      {/* MULTISELECT 1: Chọn người thực hiện quét mã QR (Ban Truyền Thông) */}
      <div className="pt-3 border-t border-border">
        <label className="mb-2 block text-xs font-semibold text-foreground">
          Người thực hiện quét mã QR (Ban Truyền Thông)
        </label>
        <EventQrStaffSelector
          value={info.qrStaff}
          onChange={(staffList) => setInfo({ ...info, qrStaff: staffList })}
        />
      </div>

      {/* MULTISELECT 2: Chọn nhà tài trợ đồng hành */}
      <div className="pt-3 border-t border-border">
        <label className="mb-2 block text-xs font-semibold text-foreground">
          Nhà tài trợ đồng hành
        </label>
        <EventSponsorPackageSelector
          value={info.sponsors}
          onChange={(sponsors) => setInfo({ ...info, sponsors })}
        />
      </div>
    </div>
  );
}

function TicketStep({
  isPaid,
  declaredCapacity,
  approvedReserveExtra,
  parts,
  tickets,
  setTickets,
  errors,
  setErrors,
}: {
  isPaid: boolean;
  declaredCapacity: number;
  approvedReserveExtra: number;
  parts: EventPartConfig[];
  tickets: TicketDraft[];
  setTickets: (v: TicketDraft[]) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const t = useT();
  const [selectedPartTab, setSelectedPartTab] = useState<string>(parts[0]?.id || "all");
  const [showFullSeatingEditor, setShowFullSeatingEditor] = useState(false);
  const deferredTickets = useDeferredValue(tickets);

  const update = (i: number, patch: Partial<TicketDraft>) =>
    setTickets(tickets.map((tk, idx) => (idx === i ? { ...tk, ...patch } : tk)));
  const remove = (i: number) => setTickets(tickets.filter((_, idx) => idx !== i));

  const totalConfiguredTickets = useMemo(
    () =>
      tickets.reduce(
        (sum, tk) => sum + (parseInt(String(tk.quantity).replace(/\D/g, ""), 10) || 0),
        0,
      ),
    [tickets],
  );

  const ticketsForPreview = useMemo(() => {
    const filtered =
      selectedPartTab === "all"
        ? deferredTickets
        : deferredTickets.filter((tk) => tk.partId === selectedPartTab || (!tk.partId && parts.length === 0));
    return filtered
      .filter((tk) => {
        const q = parseInt(String(tk.quantity).replace(/\D/g, ""), 10) || 0;
        return tk.name.trim().length > 0 && q > 0;
      })
      .map((tk) => ({
        name: tk.name.trim(),
        price: tk.isPartFree ? 0 : parseVndNumber(tk.price),
        quantity: parseInt(String(tk.quantity).replace(/\D/g, ""), 10) || 0,
        description: tk.description,
      }));
  }, [deferredTickets, selectedPartTab, parts.length]);

  const previewLayout = useMemo(
    () =>
      ticketsForPreview.length > 0
        ? buildSeatingLayoutFromTickets(ticketsForPreview)
        : { dynamicZones: [], dynamicSeats: [] },
    [ticketsForPreview],
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Ticket className="h-4 w-4 text-primary" aria-hidden="true" /> {t("ewz.tickets.heading")}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("ewz.tickets.hint")}</p>
      </div>

      {/* Bộ đếm sức chứa & số lượng vé theo từng phần của sự kiện */}
      {parts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {parts.map((part, pIdx) => {
            const partCap = Number(part.capacity) || 0;
            const partQty = tickets
              .filter((tk) => tk.partId === part.id)
              .reduce((sum, tk) => sum + (parseInt(String(tk.quantity).replace(/\D/g, ""), 10) || 0), 0);
            const isOver = partCap > 0 && partQty > partCap;
            return (
              <div
                key={part.id || pIdx}
                className={`p-3 rounded-xl border text-xs flex flex-col gap-1 ${
                  isOver
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200"
                    : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2 font-bold">
                  <span className="truncate">Phần {pIdx + 1}: {part.name}</span>
                  <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 border border-border">
                    {partQty.toLocaleString("vi-VN")} / {partCap > 0 ? partCap.toLocaleString("vi-VN") : "∞"} vé
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Sức chứa riêng: <strong>{partCap > 0 ? `${partCap.toLocaleString("vi-VN")} chỗ` : "Chưa giới hạn"}</strong>
                  {isOver && (
                    <span className="ml-1.5 font-semibold text-amber-700 dark:text-amber-300">
                      (Vượt {(partQty - partCap).toLocaleString("vi-VN")} vé{approvedReserveExtra > 0 ? " — Đã bật dự phòng" : ""})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
            declaredCapacity > 0 && totalConfiguredTickets > declaredCapacity
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200"
              : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
          }`}
        >
          <span>
            Sức chứa Bước 1: <strong>{declaredCapacity > 0 ? `${declaredCapacity.toLocaleString("vi-VN")} vé` : "Chưa giới hạn"}</strong> · Tổng vé đã nhập:{" "}
            <strong>{totalConfiguredTickets.toLocaleString("vi-VN")} vé</strong>
          </span>
          {declaredCapacity > 0 && totalConfiguredTickets > declaredCapacity && (
            <span className="font-semibold">
              Vượt {(totalConfiguredTickets - declaredCapacity).toLocaleString("vi-VN")} vé{" "}
              {approvedReserveExtra > 0 ? "(Đã bật vé dự phòng check-in tại quầy)" : "(Sẽ hỏi tạo vé dự phòng khi Tiếp tục)"}
            </span>
          )}
        </div>
      )}

      {!isPaid ? (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Sự kiện này được thiết lập <strong>Miễn phí (Free)</strong> ở Bước 1. Mọi hạng vé tạo ra đều có giá 0 đồng (miễn phí tham dự).
          </span>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-[#003B95] dark:text-blue-300 flex items-center gap-2">
          <Ticket className="h-4 w-4 shrink-0 text-[#003B95]" />
          <span>
            Sự kiện <strong>Có thu phí</strong>. Vui lòng thiết lập giá vé (VIP, Tiêu Chuẩn...) để đại biểu thanh toán khi đăng ký.
          </span>
        </div>
      )}

      {tickets.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
          {t("ewz.tickets.empty")}
        </p>
      )}

      <div className="space-y-3">
        {tickets.map((tk, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3 shadow-xs">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex-1 space-y-1">
                {tk.partName && (
                  <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                    Phần: {tk.partName}
                  </span>
                )}
                <label htmlFor={`ewz-ticket-name-${i}`} className="sr-only">
                  {t("ewz.tickets.name")}
                </label>
                <input
                  id={`ewz-ticket-name-${i}`}
                  className={`${inputCls} font-medium ${errors[`ticket_${i}_name`] ? "border-destructive ring-1 ring-destructive/30" : ""}`}
                  placeholder={t("ewz.tickets.namePh")}
                  aria-label={t("ewz.tickets.name")}
                  value={tk.name}
                  onChange={(e) => {
                    update(i, { name: e.target.value });
                    if (errors[`ticket_${i}_name`]) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy[`ticket_${i}_name`];
                        return copy;
                      });
                    }
                  }}
                />
                {errors[`ticket_${i}_name`] && (
                  <p className="mt-1 text-xs font-semibold text-destructive animate-in fade-in duration-150">
                    {errors[`ticket_${i}_name`]}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={t("ewz.tickets.remove")}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls} htmlFor={`ewz-ticket-price-${i}`}>
                    {t("ewz.tickets.price")} (VNĐ)
                  </label>
                  {(() => {
                    const num = parseVndNumber(tk.price);
                    return num <= 0 ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                        Miễn phí (0đ)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                        Có phí: {num.toLocaleString("vi-VN")} đ
                      </span>
                    );
                  })()}
                </div>
                <VndCurrencyInput
                  id={`ewz-ticket-price-${i}`}
                  placeholder="0 (0 là miễn phí)"
                  disabled={!isPaid || tk.isPartFree === true}
                  className={`${inputCls} ${!isPaid || tk.isPartFree === true ? "bg-muted cursor-not-allowed opacity-80" : ""}`}
                  value={!isPaid || tk.isPartFree === true ? 0 : parseVndNumber(tk.price)}
                  onChange={(val) => {
                    if ((!isPaid || tk.isPartFree === true) && val > 0) {
                      toast.error("Phần miễn phí không được tạo vé có phí!");
                      update(i, { price: "0" });
                      return;
                    }
                    update(i, { price: String(val) });
                    if (errors[`ticket_${i}_price`]) {
                      setErrors((prev) => ({ ...prev, [`ticket_${i}_price`]: "" }));
                    }
                  }}
                />
                {errors[`ticket_${i}_price`] && (
                  <p className="mt-1 text-[11px] font-medium text-rose-500">{errors[`ticket_${i}_price`]}</p>
                )}
                <p className="mt-1 text-[10.5px] text-muted-foreground">
                  {!isPaid || tk.isPartFree === true || parseVndNumber(tk.price) <= 0
                    ? "Phần miễn phí — không thu phí."
                    : "Phần có thu phí — tự động xuất QR SePay khi đăng ký."}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls} htmlFor={`ewz-ticket-qty-${i}`}>
                    {t("ewz.tickets.qty")}
                  </label>
                  {(() => {
                    const qNum = parseInt(String(tk.quantity).replace(/\D/g, ""), 10) || 0;
                    return qNum > 0 ? (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {qNum.toLocaleString("vi-VN")} suất
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="relative flex items-center w-full">
                  <input
                    id={`ewz-ticket-qty-${i}`}
                    aria-label={t("ewz.tickets.qty")}
                    type="text"
                    inputMode="numeric"
                    placeholder="Ví dụ: 100 vé (để trống: không giới hạn)"
                    className={`${inputCls} pr-12 font-medium`}
                    value={
                      tk.quantity
                        ? (parseInt(String(tk.quantity).replace(/\D/g, ""), 10) || "").toLocaleString("vi-VN")
                        : ""
                    }
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      update(i, { quantity: clean });
                    }}
                  />
                  <span className="absolute right-3 z-10 text-xs font-semibold text-muted-foreground select-none pointer-events-none">
                    vé
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <label className={labelCls} htmlFor={`ewz-ticket-desc-${i}`}>
                {t("ewz.tickets.desc")}
              </label>
              <input
                id={`ewz-ticket-desc-${i}`}
                aria-label={t("ewz.tickets.desc")}
                className={inputCls}
                placeholder="Mô tả quyền lợi vé (ví dụ: Bao gồm tiệc tối Gala, tài liệu đại biểu, chỗ ngồi VIP)..."
                value={tk.description}
                onChange={(e) => update(i, { description: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {parts.map((part) => (
          <button
            key={part.id}
            type="button"
              onClick={() =>
              setTickets([
                ...tickets,
                {
                  partId: part.id,
                  partName: part.name,
                  isPartFree: !part.isPaid,
                  name: "",
                  price: part.isPaid ? "" : "0",
                  guestPrice: "0",
                  quantity: "",
                  description: part.isPaid ? `Thuộc ${part.name}` : `Miễn phí (${part.name})`,
                },
              ])
            }
            className="inline-flex flex-1 min-w-[200px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/30 py-2 px-3 text-xs font-semibold text-[#003B95] dark:text-blue-400 hover:bg-muted transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              Thêm vé cho: {part.name}
              {Number(part.capacity) > 0 ? ` (Sức chứa: ${Number(part.capacity).toLocaleString("vi-VN")})` : ""}
            </span>
          </button>
        ))}
        {parts.length === 0 && (
          <button
            type="button"
            onClick={() =>
              setTickets([
                ...tickets,
                { name: "", price: isPaid ? "" : "0", quantity: "", description: "" },
              ])
            }
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/30 py-2.5 text-sm font-semibold text-[#003B95] dark:text-blue-400 hover:bg-muted transition cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> {t("ewz.tickets.add")}
          </button>
        )}
      </div>

      {/* Sơ đồ chỗ ngồi tối giản tự động sinh đúng số ghế & loại vé theo từng phần */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Sơ Đồ Chỗ Ngồi Theo Từng Phần &amp; Loại Vé
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tự động sinh đúng số ghế ứng với số lượng và tên loại vé của từng phần (giao diện tối giản).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowFullSeatingEditor((v) => !v)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
          >
            {showFullSeatingEditor ? "Thu gọn sơ đồ kéo thả" : "Mở sơ đồ kéo thả đầy đủ"}
          </button>
        </div>

        {/* Tabs chọn phần sự kiện */}
        {parts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {parts.map((p) => {
              const active = selectedPartTab === p.id;
              const partSeatTotal = tickets
                .filter((tk) => tk.partId === p.id)
                .reduce((s, tk) => s + (parseInt(String(tk.quantity).replace(/\D/g, ""), 10) || 0), 0);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPartTab(p.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    active
                      ? "border-slate-800 bg-slate-800 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  {p.name} ({partSeatTotal} ghế)
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedPartTab("all")}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                selectedPartTab === "all"
                  ? "border-slate-800 bg-slate-800 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              Tất cả các phần
            </button>
          </div>
        )}

        {/* Render danh sách ghế tối giản theo từng loại vé (chỉ sinh khi có loại vé & số lượng > 0) */}
        {previewLayout.dynamicZones.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/30 p-4 text-center text-xs text-slate-500">
            Chưa có ghế nào. Vui lòng nhập tên loại vé và số lượng vé (&gt; 0) ở trên để hệ thống tự động sinh sơ đồ ghế tương ứng.
          </p>
        ) : (
          <div className="space-y-3">
            {previewLayout.dynamicZones.map((zone, zIdx) => {
              const zoneTickets = ticketsForPreview[zIdx];
              const seatCount = zoneTickets?.quantity || 0;
              const zoneSeats = previewLayout.dynamicSeats.filter(
                (s) => s.y >= zone.y && s.y <= zone.y + zone.height,
              );
              const visibleSeats = zoneSeats.slice(0, 60);
              const hiddenCount = Math.max(0, zoneSeats.length - visibleSeats.length);
              return (
                <div
                  key={zone.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {zoneTickets?.name || zone.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                      {seatCount} ghế · {zoneTickets?.price ? `${zoneTickets.price.toLocaleString("vi-VN")} đ` : "Miễn phí"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {visibleSeats.map((seat) => (
                      <span
                        key={seat.id}
                        title={seat.label}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-200"
                      >
                        {seat.id}
                      </span>
                    ))}
                    {hiddenCount > 0 && (
                      <span className="inline-flex items-center justify-center rounded-md border border-dashed border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        +{hiddenCount} ghế nữa
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showFullSeatingEditor && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <CinemaSeatingMap
              tickets={ticketsForPreview}
              onSelectSeat={(seatLabel) => toast.info(`Đã xem ghế: ${seatLabel}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function QrStep({
  qrFields,
  toggleQr,
  sample,
}: {
  qrFields: QrField[];
  toggleQr: (f: QrField) => void;
  sample: string;
}) {
  const t = useT();
  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <QrCode className="h-4 w-4 text-primary" aria-hidden="true" /> {t("ewz.qr.heading")}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("ewz.qr.hint")}</p>
      </div>

      <fieldset className="space-y-2">
        {QR_FIELDS.map((f) => {
          const checked = qrFields.includes(f);
          return (
            <label
              key={f}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${checked
                  ? "border-[#003B95] bg-blue-50 dark:bg-blue-950/30 text-foreground shadow-xs"
                  : "border-border bg-card hover:bg-muted/50 text-foreground"
                }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#003B95]"
                checked={checked}
                onChange={() => toggleQr(f)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-foreground">
                  {t(`ewz.qr.${f}` as never)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t(`ewz.qr.${f}.desc` as never)}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <p className="mb-3 text-xs font-semibold text-[#003B95] dark:text-blue-400">{t("ewz.qr.preview")}</p>
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-white shadow-md border border-border">
            <QrCanvas value={sample} size={120} />
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              {t("ewz.qr.previewHint")}
            </p>
            <code className="block break-all rounded-md bg-muted px-2 py-1.5 text-[11px] text-foreground border border-border font-mono">
              {sample}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendeeRegistrationStep({
  event,
  tickets,
  customFields = [],
  onClose,
}: {
  event: EventItem;
  tickets: TicketDraft[];
  customFields?: EventCustomFieldDraft[];
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    memberName: "",
    position: "",
    phone: "",
    company: "",
    email: "",
    ticketType: tickets[0]?.name || "Standard VIP",
  });
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [sepayQrResult, setSepayQrResult] = useState<{
    regId: string;
    amount: number;
    vietQrUrl: string;
    transferContent: string;
    memberName: string;
    ticketType: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attendeeList, setAttendeeList] = useState<
    Array<{
      id: string;
      name: string;
      position: string;
      phone: string;
      company?: string;
      email?: string;
      ticketType: string;
      registeredAt: string;
    }>
  >([]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberName.trim()) {
      toast.error("Vui lòng nhập họ và tên thành viên tham dự");
      return;
    }
    if (!formData.position.trim()) {
      toast.error("Vui lòng nhập chức danh / vị trí công tác");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại liên hệ");
      return;
    }

    setSubmitting(true);
    try {
      const selectedTicket = tickets.find((tk) => tk.name === formData.ticketType);
      const ticketAmount = selectedTicket ? parseVndNumber(selectedTicket.price) : 0;

      const rsvpRes = await fetchNestApi<any>(`/events/${event.id}/public-rsvp`, {
        method: "POST",
        body: JSON.stringify({
          fullName: formData.memberName.trim(),
          title: formData.position.trim(),
          phone: formData.phone.trim(),
          company: formData.company.trim(),
          email: formData.email.trim(),
          attendMode: selectedTicket?.partId ? "single_part" : "full",
          selectedPartNames: [formData.ticketType],
          attendeeCount: 1,
          ticketTier: "other_participant",
          totalFee: ticketAmount,
          customFields: customValues,
        }),
      });

      if (ticketAmount > 0 && rsvpRes?.vietQrUrl) {
        setSepayQrResult({
          regId: rsvpRes.regId || "",
          amount: ticketAmount,
          vietQrUrl: rsvpRes.vietQrUrl,
          transferContent: rsvpRes.transferContent || "",
          memberName: formData.memberName.trim(),
          ticketType: formData.ticketType,
        });
      } else {
        setSepayQrResult(null);
      }

      const newAttendee = {
        id: rsvpRes?.regId || `ATT-${Date.now()}`,
        name: formData.memberName.trim(),
        position: formData.position.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        email: formData.email.trim(),
        ticketType: formData.ticketType,
        registeredAt: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setAttendeeList((prev) => [newAttendee, ...prev]);
      toast.success(
        ticketAmount > 0
          ? `Đã tạo đăng ký (${ticketAmount.toLocaleString("vi-VN")} đ) & xuất mã QR SePay!`
          : `Đã đăng ký tham dự thành công cho: ${formData.memberName}`,
      );

      setFormData({
        memberName: "",
        position: "",
        phone: "",
        company: "",
        email: "",
        ticketType: tickets[0]?.name || "Standard VIP",
      });
      setCustomValues({});
    } catch (err: any) {
      console.error("[AttendeeRegistrationStep] Register failed:", err);
      toast.error(err?.message || "Không thể đăng ký thành viên lúc này");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Banner chúc mừng khởi tạo thành công */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-950 dark:text-emerald-200">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white font-bold shadow-xs">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
              Khởi tạo sự kiện thành công: {event.name}
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
              📅 {event.date} · ⏰ {(event as any).time || "08:30 - 11:30"} · 📍 {event.location || "CLB CEO HN10"}
            </p>
          </div>
        </div>
      </div>

      {/* Form đăng ký thành viên tham dự */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#003B95] dark:text-blue-400" />
            <h3 className="text-sm font-bold text-foreground">Đăng Ký Thành Viên Tham Dự Sự Kiện</h3>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            Đã đăng ký: <strong className="text-primary">{attendeeList.length}</strong> đại biểu
          </span>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls} htmlFor="att-name">
                Họ và tên thành viên <span className="text-rose-500">*</span>
              </label>
              <input
                id="att-name"
                type="text"
                required
                value={formData.memberName}
                onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                placeholder="Nguyễn Văn A"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls} htmlFor="att-pos">
                Chức danh / Vị trí <span className="text-rose-500">*</span>
              </label>
              <input
                id="att-pos"
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Chủ tịch / Tổng Giám Đốc"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls} htmlFor="att-phone">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <input
                id="att-phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912 345 678"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls} htmlFor="att-company">
                Tên công ty / Doanh nghiệp
              </label>
              <input
                id="att-company"
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Công ty CP Tập đoàn Alpha"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls} htmlFor="att-email">
                Email liên hệ
              </label>
              <input
                id="att-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="alpha@ceo.vn"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls} htmlFor="att-ticket">
                Hạng vé / Quyền lợi
              </label>
              <select
                id="att-ticket"
                value={formData.ticketType}
                onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                className={inputCls}
              >
                {tickets.length > 0 ? (
                  tickets.map((t, idx) => {
                    const pNum = parseVndNumber(t.price);
                    return (
                      <option key={idx} value={t.name}>
                        {t.name} {pNum > 0 ? `(${pNum.toLocaleString("vi-VN")} đ)` : "(Miễn phí)"}
                      </option>
                    );
                  })
                ) : (
                  <>
                    <option value="VIP Pass">Vé VIP Khách mời</option>
                    <option value="Standard Pass">Vé Tiêu Chuẩn</option>
                    <option value="Học viên CLB">Học viên CLB CEO HN10</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Các trường dữ liệu động đã cấu hình ở Bước 1 */}
          {customFields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              {customFields.map((cf) => {
                const val = customValues[cf.id] ?? "";
                const lbl = cf.label.trim() || "Trường thông tin";
                return (
                  <div key={cf.id} className={cf.type === "textarea" ? "sm:col-span-2" : ""}>
                    <label className={labelCls}>
                      {lbl} {cf.required && <span className="text-rose-500">*</span>}
                    </label>
                    {cf.type === "textarea" ? (
                      <textarea
                        rows={2}
                        required={cf.required}
                        value={val}
                        onChange={(e) => setCustomValues({ ...customValues, [cf.id]: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                      />
                    ) : cf.type === "select" ? (
                      <select
                        required={cf.required}
                        value={val}
                        onChange={(e) => setCustomValues({ ...customValues, [cf.id]: e.target.value })}
                        className={inputCls}
                      >
                        <option value="">-- Chọn {lbl} --</option>
                        {(cf.optionsText || "")
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                      </select>
                    ) : cf.type === "checkbox" ? (
                      <label className="flex items-center gap-2 text-xs font-medium text-foreground py-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) => setCustomValues({ ...customValues, [cf.id]: e.target.checked })}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span>Có / Đồng ý</span>
                      </label>
                    ) : (
                      <input
                        type={cf.type === "phone" ? "tel" : cf.type}
                        required={cf.required}
                        value={val}
                        onChange={(e) => setCustomValues({ ...customValues, [cf.id]: e.target.value })}
                        className={inputCls}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-50"
              style={{ background: "var(--gradient-primary)" }}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{submitting ? "Đang ghi nhận..." : "Xác nhận đăng ký tham dự"}</span>
            </button>
          </div>
        </form>

        {/* Hiển thị mã QR SePay ngay sau khi đăng ký phần có thu phí */}
        {sepayQrResult && (
          <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30 p-4 flex flex-col sm:flex-row items-center gap-4">
            <img
              src={sepayQrResult.vietQrUrl}
              alt="QR Thanh toán SePay"
              className="w-40 h-40 rounded-xl border border-border bg-white p-1.5 shrink-0"
            />
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-amber-900 dark:text-amber-300 text-sm">
                Mã QR Thanh Toán SePay — {sepayQrResult.amount.toLocaleString("vi-VN")} đ
              </div>
              <p className="text-muted-foreground">
                Đại biểu: <strong>{sepayQrResult.memberName}</strong> · Vé: <strong>{sepayQrResult.ticketType}</strong>
              </p>
              <p className="text-muted-foreground">
                Mã đơn: <span className="font-mono font-bold text-foreground">{sepayQrResult.regId}</span>
              </p>
              <p className="text-muted-foreground">
                Nội dung CK: <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{sepayQrResult.transferContent}</span>
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Quét mã bằng app ngân hàng để test đối soát tự động qua SePay.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Danh sách đại biểu vừa đăng ký */}
      {attendeeList.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              Danh sách thành viên vừa đăng ký tham dự ({attendeeList.length})
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-[10.5px] uppercase font-bold text-muted-foreground">
                  <th className="px-3 py-2 w-12 text-center">STT</th>
                  <th className="px-3 py-2">Họ và tên</th>
                  <th className="px-3 py-2">Chức danh</th>
                  <th className="px-3 py-2">Số điện thoại</th>
                  <th className="px-3 py-2">Công ty</th>
                  <th className="px-3 py-2">Hạng vé</th>
                  <th className="px-3 py-2 text-right">Giờ đăng ký</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendeeList.map((att, i) => (
                  <tr key={att.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 text-center font-mono text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-bold text-foreground">{att.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{att.position}</td>
                    <td className="px-3 py-2 font-mono text-primary font-semibold">{att.phone}</td>
                    <td className="px-3 py-2 text-muted-foreground">{att.company || "—"}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-full bg-blue-500/10 text-[#003B95] dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                        {att.ticketType}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground text-[11px]">
                      {att.registeredAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
