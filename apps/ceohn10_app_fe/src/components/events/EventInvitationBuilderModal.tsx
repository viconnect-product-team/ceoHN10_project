import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import {
  X,
  UploadCloud,
  Users,
  Mail,
  Copy,
  ExternalLink,
  Check,
  Smartphone,
  Monitor,
  Loader2,
  Send,
  Sparkles,
  UserPlus,
  Trash2,
  Save,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { fetchNestApi, uploadFileToNest, resolveMediaUrl } from "@/lib/api-client";
import type { EventItem } from "@/lib/events.functions";

interface InvitationGuest {
  id?: string;
  slug: string;
  fullName: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  guestType?: "invited_guest" | "other_participant";
  source?: string;
}

function slugifyName(name: string): string {
  return (
    String(name || "khach-moi")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "khach-moi"
  );
}

export function EventInvitationBuilderModal({
  open,
  event,
  onClose,
}: {
  open: boolean;
  event: EventItem | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const canClassifyGuests = (() => {
    const role = String(user?.role || "").toLowerCase();
    const dept = String((user as any)?.department || "").toLowerCase();
    const email = String(user?.email || "").toLowerCase();
    if (role === "platform_admin" || role === "admin" || email === "admin@ceohn10.vn") return true;
    const isHead = role === "truong_ban_chuyen_trach" || role.includes("truong_ban");
    const isAllowedDept =
      dept.includes("truyền thông") ||
      dept.includes("truyen thong") ||
      dept.includes("sự kiện") ||
      dept.includes("su kien") ||
      dept.includes("hậu cần");
    return isHead && isAllowedDept;
  })();

  const [guests, setGuests] = useState<InvitationGuest[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [selectedGuestSlugs, setSelectedGuestSlugs] = useState<Set<string>>(new Set());

  // Member picker state
  const [appMembersOpen, setAppMembersOpen] = useState(false);
  const [appMembers, setAppMembers] = useState<any[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  // Tùy chỉnh mẫu Thư mời (Màu sắc, Ảnh nền thành phố, Kiểu chữ)
  const [bgThemeColor, setBgThemeColor] = useState("#1e293b");
  const [textColor, setTextColor] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#f1f5f9");
  const [cityBgUrl, setCityBgUrl] = useState("/skyline_perspective_dark.jpg");
  const [fontPreset, setFontPreset] = useState<string>("'Be Vietnam Pro', 'Inter', 'Segoe UI', sans-serif");
  const [uploadingBg, setUploadingBg] = useState(false);

  // Chỉnh sửa nội dung text độc lập trên Thư mời (lưu vào DB)
  const [editingTextOpen, setEditingTextOpen] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [invHeading, setInvHeading] = useState("Thư mời");
  const [invSubtitle, setInvSubtitle] = useState("TRÂN TRỌNG KÍNH MỜI");
  const [invAttendLabel, setInvAttendLabel] = useState("TỚI DỰ");
  const [invEventTitle, setInvEventTitle] = useState("");
  const [invOrgName, setInvOrgName] = useState("CLB DOANH NHÂN CEO HN10");
  const [invDateText, setInvDateText] = useState("");
  const [invVenueName, setInvVenueName] = useState("");
  const [invLocation, setInvLocation] = useState("");
  const [invButtonText, setInvButtonText] = useState("✓ Xác nhận tham dự");
  const [invMotto, setInvMotto] = useState("Hội Tụ Doanh Trí, Khẳng Định Vị Thế");
  const [invFooterWish, setInvFooterWish] = useState("Sự hiện diện của bạn là niềm vinh hạnh của chúng tôi. Rất hân hạnh được đón tiếp!");
  const [invProgramItems, setInvProgramItems] = useState<Array<{ time: string; title: string }>>([]);

  useEffect(() => {
    if (!open || !event?.id) return;
    const dObj = event.date ? new Date(event.date) : new Date();
    const dm = !isNaN(dObj.getTime())
      ? `${String(dObj.getDate()).padStart(2, "0")}.${String(dObj.getMonth() + 1).padStart(2, "0")}`
      : "05.12";
    const yr = !isNaN(dObj.getTime()) ? String(dObj.getFullYear()) : "2026";
    const evParts: any[] =
      Array.isArray((event as any).parts) && (event as any).parts.length > 0
        ? (event as any).parts
        : [
            { name: "Chương trình chính", items: [{ time: "08:00 - 08:30", title: "Đón khách" }, { time: "08:30 - 11:30", title: "Chương trình chính" }] },
            { name: "Dự Tiệc", items: [{ time: "11:30", title: "Tiệc chúc mừng" }] },
          ];
    const defaultTimeline = evParts.flatMap((p) => (Array.isArray(p.items) ? p.items : [])).slice(0, 3);

    setInvEventTitle(event.name || "");
    setInvDateText(`${dm}.${yr}`);
    setInvVenueName((event as any).venueName || "Hội trường");
    setInvLocation(event.location || "Hà Nội");
    setInvProgramItems(defaultTimeline);

    setLoadingGuests(true);
    fetchNestApi<InvitationGuest[]>(`/events/${event.id}/invitation-guests`)
      .then((res) => {
        if (Array.isArray(res)) setGuests(res);
      })
      .catch(() => {})
      .finally(() => setLoadingGuests(false));

    fetchNestApi<{ config: any }>(`/events/${event.id}/invitation-config`)
      .then((res) => {
        const c = res?.config;
        if (!c) return;
        if (c.bgThemeColor) setBgThemeColor(c.bgThemeColor);
        if (c.textColor) setTextColor(c.textColor);
        if (c.accentColor) setAccentColor(c.accentColor);
        if (c.cityBgUrl) setCityBgUrl(c.cityBgUrl);
        if (c.fontPreset) setFontPreset(c.fontPreset);
        if (c.invHeading !== undefined) setInvHeading(c.invHeading);
        if (c.invSubtitle !== undefined) setInvSubtitle(c.invSubtitle);
        if (c.invAttendLabel !== undefined) setInvAttendLabel(c.invAttendLabel);
        if (c.invEventTitle !== undefined) setInvEventTitle(c.invEventTitle);
        if (c.invOrgName !== undefined) setInvOrgName(c.invOrgName);
        if (c.invDateText !== undefined) setInvDateText(c.invDateText);
        if (c.invVenueName !== undefined) setInvVenueName(c.invVenueName);
        if (c.invLocation !== undefined) setInvLocation(c.invLocation);
        if (c.invButtonText !== undefined) setInvButtonText(c.invButtonText);
        if (c.invMotto !== undefined) setInvMotto(c.invMotto);
        if (c.invFooterWish !== undefined) setInvFooterWish(c.invFooterWish);
        if (Array.isArray(c.invProgramItems) && c.invProgramItems.length > 0) {
          setInvProgramItems(c.invProgramItems);
        }
      })
      .catch(() => {});
  }, [open, event?.id]);

  if (!open || !event || typeof document === "undefined") return null;

  const activeGuest = guests[selectedIdx] || {
    slug: "quy-khach-moi",
    fullName: "Quý Khách Hàng & Đối Tác",
    title: "Tổng Giám Đốc",
    company: "CLB Doanh Nhân CEO HN10",
    email: "",
    phone: "",
  };

  const buildGuestUrl = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ceohn10.viconnect.vn";
    const qs = new URLSearchParams({
      bg: cityBgUrl,
      bgColor: bgThemeColor,
      textColor,
      accentColor,
      font: fontPreset,
    });
    return `${origin}/invitation/${event.id}?${qs.toString()}#${slug}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      let parsedGuests: InvitationGuest[] = [];

      if (ext === "xlsx" || ext === "xls" || ext === "csv") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
        parsedGuests = rows
          .map((row) => {
            const keys = Object.keys(row);
            const findVal = (patterns: string[]) => {
              const k = keys.find((key) =>
                patterns.some((p) => key.toLowerCase().includes(p))
              );
              return k ? String(row[k] || "").trim() : "";
            };
            const fullName = findVal(["họ tên", "ho ten", "tên", "ten", "name", "full_name"]);
            if (!fullName) return null;
            return {
              slug: slugifyName(fullName),
              fullName,
              title: findVal(["chức vụ", "chuc vu", "chức danh", "title", "position"]),
              company: findVal(["công ty", "cong ty", "đơn vị", "don vi", "company", "doanh nghiệp"]),
              email: findVal(["email", "mail"]),
              phone: findVal(["sđt", "sdt", "điện thoại", "dien thoai", "phone"]),
              source: "import",
            } as InvitationGuest;
          })
          .filter((x): x is InvitationGuest => !!x);
      } else if (ext === "docx" || ext === "txt") {
        const text = await file.text();
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 2);
        parsedGuests = lines.map((line) => {
          const parts = line.split(/[-–|,;]+/).map((s) => s.trim());
          const fullName = parts[0] || line;
          return {
            slug: slugifyName(fullName),
            fullName,
            title: parts[1] || "Doanh nhân",
            company: parts[2] || "",
            email: parts.find((p) => p.includes("@")) || "",
            phone: "",
            source: "import_doc",
          };
        });
      }

      if (parsedGuests.length === 0) {
        toast.error("Không tìm thấy dữ liệu khách mời (cần có cột Họ tên / Tên).");
        return;
      }

      setSaving(true);
      const res = await fetchNestApi<{ guests: InvitationGuest[] }>(`/events/${event.id}/invitation-guests`, {
        method: "POST",
        body: JSON.stringify({ guests: parsedGuests }),
      });
      const merged = res?.guests || parsedGuests;
      setGuests((prev) => {
        const map = new Map<string, InvitationGuest>();
        prev.forEach((g) => map.set(g.slug, g));
        merged.forEach((g) => map.set(g.slug, g));
        return Array.from(map.values());
      });
      setSelectedIdx(0);
      toast.success(`Đã import & lưu ${parsedGuests.length} khách mời kèm link thư mời riêng!`);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi đọc file danh sách khách mời");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  };

  const handleOpenAppMembers = async () => {
    setAppMembersOpen(true);
    try {
      const res = await fetchNestApi<any[]>("/members");
      if (Array.isArray(res)) setAppMembers(res);
    } catch {}
  };

  const handleConfirmAppMembers = async () => {
    const chosen = appMembers.filter((m) => selectedMemberIds.has(String(m.id)));
    if (chosen.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 học viên/giảng viên");
      return;
    }
    const payload: InvitationGuest[] = chosen.map((m) => ({
      slug: slugifyName(m.name),
      fullName: m.name,
      title: m.contact || m.executiveRole || "Học viên CEO HN10",
      company: m.companyName || m.company_name || "",
      email: m.email || "",
      phone: m.phone || "",
      source: "app_members",
    }));
    setSaving(true);
    try {
      const res = await fetchNestApi<{ guests: InvitationGuest[] }>(`/events/${event.id}/invitation-guests`, {
        method: "POST",
        body: JSON.stringify({ guests: payload }),
      });
      const merged = res?.guests || payload;
      setGuests((prev) => {
        const map = new Map<string, InvitationGuest>();
        prev.forEach((g) => map.set(g.slug, g));
        merged.forEach((g) => map.set(g.slug, g));
        return Array.from(map.values());
      });
      setAppMembersOpen(false);
      setSelectedMemberIds(new Set());
      toast.success(`Đã thêm ${payload.length} học viên/giảng viên vào danh sách Thư mời!`);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi lưu khách mời");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInvitationConfig = async () => {
    setSavingConfig(true);
    try {
      await fetchNestApi(`/events/${event.id}/invitation-config`, {
        method: "PUT",
        body: JSON.stringify({
          config: {
            bgThemeColor,
            textColor,
            accentColor,
            cityBgUrl,
            fontPreset,
            invHeading,
            invSubtitle,
            invAttendLabel,
            invEventTitle,
            invOrgName,
            invDateText,
            invVenueName,
            invLocation,
            invButtonText,
            invMotto,
            invFooterWish,
            invProgramItems,
          },
        }),
      });
      toast.success("Đã lưu nội dung & giao diện Thư mời! Link thư mời của khách sẽ hiển thị đúng nội dung này.");
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu cấu hình Thư mời");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleClearGuests = async () => {
    if (guests.length === 0) return;
    if (!window.confirm(`Xác nhận xóa toàn bộ ${guests.length} khách mời cũ trong danh sách?`)) return;
    setSaving(true);
    try {
      await fetchNestApi(`/events/${event.id}/invitation-guests`, {
        method: "DELETE",
      });
      setGuests([]);
      setSelectedGuestSlugs(new Set());
      setSelectedIdx(0);
      toast.success("Đã xóa sạch danh sách khách mời cũ!");
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa danh sách khách mời");
    } finally {
      setSaving(false);
    }
  };

  const sendEmailsToGuests = async (targetGuests: InvitationGuest[]) => {
    const validTargets = targetGuests.filter(
      (g) => (g.email && g.email.trim().includes("@")) || (g.phone && g.phone.trim().length >= 8),
    );
    if (validTargets.length === 0) {
      toast.error("Khách mời được chọn chưa có Email hoặc Số điện thoại hợp lệ.");
      return;
    }
    setSendingEmails(true);
    try {
      const res = await fetchNestApi<{
        ok: boolean;
        sentCount: number;
        failedCount: number;
        failed?: Array<{ email: string; fullName: string; reason: string }>;
      }>(`/events/${event.id}/send-invitations`, {
        method: "POST",
        body: JSON.stringify({
          guests: validTargets.map((g) => ({
            slug: g.slug,
            fullName: g.fullName,
            title: g.title,
            company: g.company,
            email: g.email,
            phone: g.phone,
            link: buildGuestUrl(g.slug),
          })),
          template: {
            bgThemeColor,
            textColor,
            accentColor,
            fontPreset,
            baseUrl: typeof window !== "undefined" ? window.location.origin : "https://ceohn10.viconnect.vn",
          },
        }),
      });

      const sentCount = Number(res?.sentCount || 0);
      const failedCount = Number(res?.failedCount || 0);
      if (sentCount > 0 && failedCount === 0) {
        toast.success(`Đã gửi link thư mời cá nhân hóa tới ${sentCount} khách (Email / Zalo OA)!`);
      } else if (sentCount > 0 && failedCount > 0) {
        const firstReason = res?.failed?.[0]?.reason || "Lỗi SMTP";
        toast.warning(`Đã gửi ${sentCount} khách, thất bại ${failedCount} khách (${firstReason}).`);
      } else {
        const firstReason = res?.failed?.[0]?.reason || "Không gửi được email (kiểm tra cấu hình SMTP).";
        toast.error(`Gửi thư mời thất bại: ${firstReason}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi gửi link thư mời");
    } finally {
      setSendingEmails(false);
    }
  };

  const handleSendSelectedEmails = async () => {
    const chosen = guests.filter((g) => selectedGuestSlugs.has(g.slug));
    if (chosen.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 khách mời để gửi thư mời.");
      return;
    }
    await sendEmailsToGuests(chosen);
  };

  const allSelected = guests.length > 0 && guests.every((g) => selectedGuestSlugs.has(g.slug));
  const toggleSelectAllGuests = () => {
    if (allSelected) {
      setSelectedGuestSlugs(new Set());
    } else {
      setSelectedGuestSlugs(new Set(guests.map((g) => g.slug)));
    }
  };

  const parts: any[] = Array.isArray((event as any).parts) && (event as any).parts.length > 0
    ? (event as any).parts
    : [
        { name: "Lễ Khai Giảng CEO HN10", items: [{ time: "08:00 - 08:30", title: "Đón khách" }, { time: "08:30 - 11:30", title: "Chương trình chính" }] },
        { name: "Dự Tiệc", items: [{ time: "11:30", title: "Tiệc chúc mừng" }] },
      ];
  const timelineItems = parts.flatMap((p) => (Array.isArray(p.items) ? p.items : [])).slice(0, 3);
  const dateObj = event.date ? new Date(event.date) : new Date();
  const dayMonth = !isNaN(dateObj.getTime())
    ? `${String(dateObj.getDate()).padStart(2, "0")}.${String(dateObj.getMonth() + 1).padStart(2, "0")}`
    : "05.12";
  const yearStr = !isNaN(dateObj.getTime()) ? String(dateObj.getFullYear()) : "2026";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5">
      <div className="relative flex flex-col w-full max-w-6xl max-h-[94vh] rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border bg-slate-50 dark:bg-slate-900">
          <div>
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#003B95]" />
              <span>Gửi Thư Mời Cá Nhân Hóa — {event.name}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Import file danh sách khách mời (Excel/CSV/Word) hoặc chọn từ App → Tự động điền lên Poster Xám-Trắng &amp; sinh link RSVP riêng.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Cột Trái: Danh sách khách mời */}
          <div className="lg:col-span-5 p-4 space-y-3 flex flex-col max-h-[70vh] lg:max-h-full overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              <label className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold cursor-pointer shadow-xs">
                <UploadCloud className="h-4 w-4" />
                <span>{saving ? "Đang nạp..." : "Import Excel / Word"}</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleOpenAppMembers}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white px-3 py-2 text-xs font-bold cursor-pointer shadow-xs"
              >
                <UserPlus className="h-4 w-4" />
                <span>Chọn từ Học viên / GV</span>
              </button>
            </div>

            {appMembersOpen && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Chọn Học viên / Giảng viên đang dùng App:</span>
                  <button type="button" onClick={() => setAppMembersOpen(false)} className="text-muted-foreground cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                  {appMembers.map((m) => {
                    const idStr = String(m.id);
                    const checked = selectedMemberIds.has(idStr);
                    return (
                      <label key={idStr} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(selectedMemberIds);
                            if (checked) next.delete(idStr);
                            else next.add(idStr);
                            setSelectedMemberIds(next);
                          }}
                        />
                        <span className="font-semibold truncate">{m.name}</span>
                        <span className="text-muted-foreground truncate text-[11px]">({m.companyName || m.email || m.code})</span>
                      </label>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleConfirmAppMembers}
                  className="w-full py-1.5 rounded-lg bg-[#003B95] text-white text-xs font-bold cursor-pointer"
                >
                  Thêm {selectedMemberIds.size} người đã chọn
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-muted-foreground pt-1">
              <div className="flex items-center gap-2">
                {guests.length > 0 && (
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-foreground">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAllGuests}
                      className="rounded border-border"
                    />
                    <span>Chọn tất cả</span>
                  </label>
                )}
                <span>({selectedGuestSlugs.size}/{guests.length})</span>
              </div>
              {guests.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSendSelectedEmails}
                    disabled={sendingEmails || selectedGuestSlugs.size === 0}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#003B95] hover:bg-[#002B70] disabled:opacity-50 text-white px-2.5 py-1.5 text-[11px] font-bold cursor-pointer"
                  >
                    {sendingEmails ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    <span>Gửi tới mail đã chọn ({selectedGuestSlugs.size})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => sendEmailsToGuests(guests)}
                    disabled={sendingEmails}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-white hover:bg-slate-50 text-slate-700 px-2 py-1.5 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                    title="Gửi link thư mời tới tất cả khách mời"
                  >
                    <Mail className="h-3 w-3" />
                    <span>Gửi tất cả</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearGuests}
                    disabled={saving || sendingEmails}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1.5 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                    title="Xóa danh sách khách mời cũ"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Xóa DS</span>
                  </button>
                </div>
              )}
            </div>

            {loadingGuests ? (
              <div className="py-10 text-center text-xs text-muted-foreground">Đang tải danh sách khách mời...</div>
            ) : guests.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                Chưa có khách mời nào. Hãy import file Excel/Word hoặc chọn từ danh sách Học viên / Giảng viên.
              </div>
            ) : (
              <div className="space-y-1.5 overflow-y-auto flex-1">
                {guests.map((g, idx) => {
                  const active = idx === selectedIdx;
                  const isChecked = selectedGuestSlugs.has(g.slug);
                  const link = buildGuestUrl(g.slug);
                  return (
                    <div
                      key={g.slug + idx}
                      onClick={() => setSelectedIdx(idx)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                        active
                          ? "border-[#003B95] bg-blue-50/70 dark:bg-blue-950/30"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onClick={(ev) => ev.stopPropagation()}
                          onChange={() => {
                            const next = new Set(selectedGuestSlugs);
                            if (isChecked) next.delete(g.slug);
                            else next.add(g.slug);
                            setSelectedGuestSlugs(next);
                          }}
                          className="mt-1 rounded border-border shrink-0 cursor-pointer"
                          aria-label={`Chọn ${g.fullName}`}
                        />
                        <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">{g.fullName}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {g.title || "Doanh nhân"}{g.company ? ` · ${g.company}` : ""}
                        </div>
                        {g.email ? (
                          <div className="text-[10px] text-slate-500 truncate">{g.email}</div>
                        ) : (
                          <div className="text-[10px] text-rose-500 truncate">Chưa có Email</div>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono text-blue-600 truncate">#{g.slug}</span>
                          <select
                            value={g.guestType === "other_participant" ? "other_participant" : "invited_guest"}
                            disabled={!canClassifyGuests || saving}
                            onClick={(ev) => ev.stopPropagation()}
                            onChange={async (ev) => {
                              ev.stopPropagation();
                              const nextType = ev.target.value as "invited_guest" | "other_participant";
                              const updatedGuest = { ...g, guestType: nextType };
                              setGuests((prev) => prev.map((item, i) => (i === idx ? updatedGuest : item)));
                              try {
                                await fetchNestApi(`/events/${event.id}/invitation-guests`, {
                                  method: "POST",
                                  body: JSON.stringify({ guests: [updatedGuest] }),
                                });
                                toast.success(
                                  nextType === "invited_guest"
                                    ? `Đã đặt "${g.fullName}" là Khách mời (0đ)`
                                    : `Đã đặt "${g.fullName}" là Khách tham gia (Tính phí)`,
                                );
                              } catch (err: any) {
                                toast.error(err?.message || "Không thể phân loại khách mời");
                              }
                            }}
                            title={
                              canClassifyGuests
                                ? "Phân loại đối tượng vé (Trưởng ban Truyền thông / Sự kiện & Hậu cần)"
                                : "Chỉ Trưởng ban Truyền thông hoặc Trưởng ban Sự kiện & Hậu cần được phân loại"
                            }
                            className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 border cursor-pointer disabled:opacity-70 ${
                              g.guestType === "other_participant"
                                ? "bg-amber-50 border-amber-300 text-amber-800"
                                : "bg-emerald-50 border-emerald-300 text-emerald-800"
                            }`}
                          >
                            <option value="invited_guest">Khách mời (0đ)</option>
                            <option value="other_participant">Khách tham gia (Tính phí)</option>
                          </select>
                        </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={sendingEmails || !g.email || !g.email.includes("@")}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            sendEmailsToGuests([g]);
                          }}
                          className="p-1.5 rounded-lg border border-border hover:bg-background text-emerald-700 disabled:opacity-40 cursor-pointer"
                          title={g.email ? `Gửi thư mời tới ${g.email}` : "Khách chưa có Email"}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            navigator.clipboard.writeText(link);
                            toast.success(`Đã copy link thư mời cho ${g.fullName}`);
                          }}
                          className="p-1.5 rounded-lg border border-border hover:bg-background text-slate-600 cursor-pointer"
                          title="Copy link thư mời"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(ev) => ev.stopPropagation()}
                          className="p-1.5 rounded-lg border border-border hover:bg-background text-[#003B95]"
                          title="Mở trang thư mời"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cột Phải: Xem trước Poster Xám-Trắng */}
          <div className="lg:col-span-7 p-4 bg-slate-950 text-white flex flex-col space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-200 font-bold text-[10px]">
                  XEM TRƯỚC POSTER XÁM-TRẮNG
                </span>
                <span className="text-slate-400 truncate max-w-[240px]">
                  Đang điền: <b className="text-white">{activeGuest.fullName}</b>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingTextOpen((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    editingTextOpen ? "bg-amber-400 text-slate-950" : "bg-white/10 text-slate-200 hover:bg-white/20"
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5" /> {editingTextOpen ? "Đóng sửa chữ" : "Sửa nội dung chữ"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveInvitationConfig}
                  disabled={savingConfig}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#003B95] hover:bg-[#002B70] text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {savingConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Lưu Thư mời</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    previewMode === "desktop" ? "bg-white text-slate-950" : "bg-white/10 text-slate-300"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    previewMode === "mobile" ? "bg-white text-slate-950" : "bg-white/10 text-slate-300"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" /> Mobile
                </button>
                <a
                  href={buildGuestUrl(activeGuest.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500 text-slate-950 flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Mở Link Thật
                </a>
              </div>
            </div>

            {/* Thanh tùy chỉnh Màu sắc, Ảnh nền thành phố & Kiểu chữ */}
            <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-3 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Màu mẫu:</span>
                {[
                  { label: "Xám - Trắng", bg: "#1e293b", txt: "#ffffff", acc: "#f1f5f9" },
                  { label: "Navy HN10", bg: "#003B95", txt: "#ffffff", acc: "#e0f2fe" },
                  { label: "Xám Bạc Sáng", bg: "#e2e8f0", txt: "#0f172a", acc: "#0f172a" },
                  { label: "Đen Than", bg: "#18181b", txt: "#fafafa", acc: "#e4e4e7" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setBgThemeColor(preset.bg);
                      setTextColor(preset.txt);
                      setAccentColor(preset.acc);
                    }}
                    className="px-2 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 text-[11px] font-semibold text-slate-200 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
                <label className="inline-flex items-center gap-1 text-[11px] text-slate-300 ml-auto">
                  Nền:
                  <input
                    type="color"
                    value={bgThemeColor}
                    onChange={(e) => setBgThemeColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </label>
                <label className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                  Chữ:
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </label>
                <label className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                  Nhấn:
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-5">
                  <select
                    value={fontPreset}
                    onChange={(e) => setFontPreset(e.target.value)}
                    className="w-full h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-[11px] text-slate-200"
                    title="Kiểu chữ thư mời"
                  >
                    <option value="'Be Vietnam Pro', 'Inter', 'Segoe UI', sans-serif">Kiểu chữ: Hiện Đại Chuẩn Tiếng Việt (Be Vietnam Pro)</option>
                    <option value="'Times New Roman', 'Noto Serif', serif">Kiểu chữ: Cổ Điển Trang Trọng (Times New Roman)</option>
                    <option value="'Segoe UI', Roboto, Arial, sans-serif">Kiểu chữ: Thanh Lịch (Segoe UI)</option>
                  </select>
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={cityBgUrl}
                    onChange={(e) => setCityBgUrl(e.target.value)}
                    placeholder="URL ảnh nền thành phố..."
                    className="w-full h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-[11px] text-slate-200"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="w-full h-8 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white flex items-center justify-center cursor-pointer">
                    {uploadingBg ? "..." : "Đổi ảnh"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (ev) => {
                        const f = ev.target.files?.[0];
                        if (!f) return;
                        setUploadingBg(true);
                        try {
                          const up = await uploadFileToNest(f);
                          const url = resolveMediaUrl(up?.url || up?.filePath || up?.fileUrl || "") || up?.url;
                          if (url) setCityBgUrl(url);
                        } catch {
                          toast.error("Không tải được ảnh nền");
                        } finally {
                          setUploadingBg(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {editingTextOpen && (
                <div className="pt-2.5 mt-2 border-t border-white/10 space-y-2 text-[11px]">
                  <div className="font-bold text-amber-300">
                    Chỉnh sửa nội dung chữ trên Thư mời (Độc lập với thông tin gốc của sự kiện):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={invHeading}
                      onChange={(e) => setInvHeading(e.target.value)}
                      placeholder="Tiêu đề (Thư mời)"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                    <input
                      type="text"
                      value={invSubtitle}
                      onChange={(e) => setInvSubtitle(e.target.value)}
                      placeholder="Dòng kính mời"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                    <input
                      type="text"
                      value={invAttendLabel}
                      onChange={(e) => setInvAttendLabel(e.target.value)}
                      placeholder="TỚI DỰ"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={invEventTitle}
                      onChange={(e) => setInvEventTitle(e.target.value)}
                      placeholder="Tên sự kiện hiển thị trên thư mời"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100 font-semibold"
                    />
                    <input
                      type="text"
                      value={invOrgName}
                      onChange={(e) => setInvOrgName(e.target.value)}
                      placeholder="Tên CLB / Đơn vị tổ chức"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={invDateText}
                      onChange={(e) => setInvDateText(e.target.value)}
                      placeholder="Ngày (VD: 05.12.2026)"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                    <input
                      type="text"
                      value={invVenueName}
                      onChange={(e) => setInvVenueName(e.target.value)}
                      placeholder="Tên hội trường"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                    <input
                      type="text"
                      value={invLocation}
                      onChange={(e) => setInvLocation(e.target.value)}
                      placeholder="Địa điểm"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={invMotto}
                      onChange={(e) => setInvMotto(e.target.value)}
                      placeholder="Khẩu hiệu bên trái (Desktop)"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                    <input
                      type="text"
                      value={invButtonText}
                      onChange={(e) => setInvButtonText(e.target.value)}
                      placeholder="Chữ nút xác nhận"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                  </div>
                  <input
                    type="text"
                    value={invFooterWish}
                    onChange={(e) => setInvFooterWish(e.target.value)}
                    placeholder="Lời chúc cuối thư mời"
                    className="w-full h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Các mốc chương trình hiển thị trên thư mời:</span>
                      <button
                        type="button"
                        onClick={() => setInvProgramItems((prev) => [...prev, { time: "09:00", title: "Nội dung mới" }])}
                        className="text-amber-300 hover:underline cursor-pointer"
                      >
                        + Thêm mốc
                      </button>
                    </div>
                    {invProgramItems.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                        <input
                          type="text"
                          value={it.time}
                          onChange={(e) =>
                            setInvProgramItems((prev) => prev.map((x, i) => (i === idx ? { ...x, time: e.target.value } : x)))
                          }
                          placeholder="Giờ"
                          className="col-span-4 h-7 rounded border border-white/15 bg-slate-950 px-2 text-slate-100"
                        />
                        <input
                          type="text"
                          value={it.title}
                          onChange={(e) =>
                            setInvProgramItems((prev) => prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))
                          }
                          placeholder="Nội dung"
                          className="col-span-7 h-7 rounded border border-white/15 bg-slate-950 px-2 text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => setInvProgramItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="col-span-1 text-rose-400 hover:text-rose-300 text-center cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Khung Preview Poster */}
            <div className="flex-1 flex items-center justify-center overflow-auto py-2">
              <div
                className={`relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl transition-all ${
                  previewMode === "mobile" ? "w-[320px] min-h-[540px]" : "w-full min-h-[380px]"
                }`}
                style={{
                  background: `radial-gradient(circle at 70% 50%, ${bgThemeColor} 0%, #0f172a 100%)`,
                  color: textColor,
                  fontFamily: fontPreset,
                }}
              >
                {/* Ảnh thành phố nền */}
                <img
                  src={cityBgUrl || "/skyline_perspective_dark.jpg"}
                  alt="City"
                  className={`absolute inset-0 object-cover opacity-45 grayscale-[30%] ${
                    previewMode === "mobile" ? "h-52 w-full" : "h-full w-1/2"
                  }`}
                />
                <div
                  className={`absolute inset-0 ${
                    previewMode === "mobile"
                      ? "bg-gradient-to-b from-slate-900/20 via-slate-900/90 to-slate-950"
                      : "bg-gradient-to-r from-slate-900/10 via-slate-900/85 to-slate-950"
                  }`}
                />

                <div
                  className={`relative z-10 p-6 flex flex-col justify-center items-center text-center space-y-2.5 ${
                    previewMode === "desktop" ? "ml-[38%]" : "mt-28"
                  }`}
                >
                  <div className="font-sans italic text-2xl text-slate-100">{invHeading || "Thư mời"}</div>
                  <div className="text-[9px] uppercase tracking-[0.28em] text-slate-300">{invSubtitle || "TRÂN TRỌNG KÍNH MỜI"}</div>
                  <div className="font-sans text-xl sm:text-2xl font-bold text-white">{activeGuest.fullName}</div>
                  <div className="text-[11px] text-slate-300">
                    {activeGuest.title}{activeGuest.company ? ` · ${activeGuest.company}` : ""}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.25em] text-slate-400 pt-1">{invAttendLabel || "TỚI DỰ"}</div>
                  <div className="font-sans text-xl font-bold uppercase tracking-wider text-white">
                    {invEventTitle || event.name}
                  </div>
                  <div className="px-4 py-1 rounded-full bg-white text-slate-900 text-[10px] font-extrabold uppercase tracking-wider">
                    {invOrgName || "CLB DOANH NHÂN CEO HN10"}
                  </div>

                  {/* Khung kính */}
                  <div className="w-full rounded-xl border border-white/20 bg-slate-900/75 p-3 text-[10px] space-y-2">
                    <div className="flex items-center justify-between border-b border-white/15 pb-2">
                      <div>
                        <span className="text-slate-400 uppercase block text-[8px]">Ngày</span>
                        <b className="text-base font-sans">{invDateText || `${dayMonth}.${yearStr}`}</b>
                      </div>
                      <div className="text-right">
                        <span className="font-sans italic text-sm text-white block">
                          {invVenueName || (event as any).venueName || "Hội trường"}
                        </span>
                        <span className="text-slate-300 text-[9px]">{invLocation || event.location || "Hà Nội"}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center pt-1">
                      {(invProgramItems.length > 0 ? invProgramItems : timelineItems).map((it: any, i: number) => (
                        <div key={i}>
                          <div className="font-bold text-white">{it.time}</div>
                          <div className="text-[9px] text-slate-300 truncate">{it.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="inline-block px-5 py-1.5 rounded-full bg-white text-slate-950 font-bold text-xs shadow">
                      {invButtonText || "✓ Xác nhận tham dự"}
                    </span>
                  </div>
                  {invFooterWish && (
                    <div className="text-[10px] italic text-slate-300 pt-0.5 max-w-xs">{invFooterWish}</div>
                  )}
                </div>
              </div>

              {editingTextOpen && (
                <div className="pt-2.5 mt-2 border-t border-white/10 space-y-2 text-[11px]">
                  <div className="font-bold text-amber-300">
                    Chỉnh sửa nội dung chữ trên Thư mời (Độc lập với thông tin gốc của sự kiện):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={invHeading}
                      onChange={(e) => setInvHeading(e.target.value)}
                      placeholder="Tiêu đề (Thư mời)"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                    <input
                      type="text"
                      value={invSubtitle}
                      onChange={(e) => setInvSubtitle(e.target.value)}
                      placeholder="Dòng kính mời"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                    <input
                      type="text"
                      value={invAttendLabel}
                      onChange={(e) => setInvAttendLabel(e.target.value)}
                      placeholder="TỚI DỰ"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={invEventTitle}
                      onChange={(e) => setInvEventTitle(e.target.value)}
                      placeholder="Tên sự kiện hiển thị trên thư mời"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100 font-semibold"
                    />
                    <input
                      type="text"
                      value={invOrgName}
                      onChange={(e) => setInvOrgName(e.target.value)}
                      placeholder="Tên CLB / Đơn vị tổ chức"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={invDateText}
                      onChange={(e) => setInvDateText(e.target.value)}
                      placeholder="Ngày (VD: 05.12.2026)"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                    <input
                      type="text"
                      value={invVenueName}
                      onChange={(e) => setInvVenueName(e.target.value)}
                      placeholder="Tên hội trường"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                    <input
                      type="text"
                      value={invLocation}
                      onChange={(e) => setInvLocation(e.target.value)}
                      placeholder="Địa điểm"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={invMotto}
                      onChange={(e) => setInvMotto(e.target.value)}
                      placeholder="Khẩu hiệu bên trái (Desktop)"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                    <input
                      type="text"
                      value={invButtonText}
                      onChange={(e) => setInvButtonText(e.target.value)}
                      placeholder="Chữ nút xác nhận"
                      className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                    />
                  </div>
                  <input
                    type="text"
                    value={invFooterWish}
                    onChange={(e) => setInvFooterWish(e.target.value)}
                    placeholder="Lời chúc cuối thư mời"
                    className="w-full h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-slate-100"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Các mốc chương trình hiển thị trên thư mời:</span>
                      <button
                        type="button"
                        onClick={() => setInvProgramItems((prev) => [...prev, { time: "09:00", title: "Nội dung mới" }])}
                        className="text-amber-300 hover:underline cursor-pointer"
                      >
                        + Thêm mốc
                      </button>
                    </div>
                    {invProgramItems.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                        <input
                          type="text"
                          value={it.time}
                          onChange={(e) =>
                            setInvProgramItems((prev) => prev.map((x, i) => (i === idx ? { ...x, time: e.target.value } : x)))
                          }
                          placeholder="Giờ"
                          className="col-span-4 h-7 rounded border border-white/15 bg-slate-950 px-2 text-slate-100"
                        />
                        <input
                          type="text"
                          value={it.title}
                          onChange={(e) =>
                            setInvProgramItems((prev) => prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))
                          }
                          placeholder="Nội dung"
                          className="col-span-7 h-7 rounded border border-white/15 bg-slate-950 px-2 text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => setInvProgramItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="col-span-1 text-rose-400 hover:text-rose-300 text-center cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
