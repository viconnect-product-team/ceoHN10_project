import React, { useEffect, useState } from "react";
import {
  Calendar,
  Send,
  Users,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

interface AiQuickOpsDrawerProps {
  open: boolean;
  onClose: () => void;
  onLogResultToChat: (title: string, summary: string) => void;
}

export function AiQuickOpsDrawer({
  open,
  onClose,
  onLogResultToChat,
}: AiQuickOpsDrawerProps) {
  const [tab, setTab] = useState<"invite" | "member" | "lecturer" | "class">("invite");
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [busy, setBusy] = useState(false);

  // 1. Invite state
  const [guestText, setGuestText] = useState("");
  const [sendInviteEmail, setSendInviteEmail] = useState(true);

  // 2. Member state
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "CEO",
    department: "Ban Thành Viên",
  });
  const [importedMembers, setImportedMembers] = useState<any[]>([]);

  // 3. Lecturer state
  const [lecturerForm, setLecturerForm] = useState({
    fullName: "",
    title: "Chuyên gia / Giảng viên",
    company: "",
    specialty: "Quản trị Doanh nghiệp",
    email: "",
    phone: "",
  });
  const [importedLecturers, setImportedLecturers] = useState<any[]>([]);

  // 4. Class state
  const [classForm, setClassForm] = useState({
    title: "",
    instructorName: "",
    instructorTitle: "Chuyên gia CEO HN10",
    location: "Hà Nội",
    startTime: "",
    ticketFee: "0",
  });

  useEffect(() => {
    if (!open) return;
    fetchNestApi<any[]>("/events")
      .then((res) => {
        const list = Array.isArray(res) ? res : [];
        setEvents(list);
        if (list.length > 0 && !selectedEventId) {
          setSelectedEventId(list[0].id);
        }
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const parseSheetFile = async (
    file: File,
    onRows: (rows: any[]) => void,
  ) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      onRows(Array.isArray(rows) ? rows : []);
      toast.success(`Đã đọc ${rows.length} dòng từ file ${file.name}`);
    } catch {
      toast.error("Không thể đọc file Excel/CSV này.");
    }
  };

  const handleCreateInvites = async () => {
    if (!selectedEventId) {
      toast.error("Vui lòng chọn 1 sự kiện!");
      return;
    }
    const lines = guestText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const guests = lines.map((line, i) => {
      const parts = line.split(/[,;\t|]+/).map((p) => p.trim());
      return {
        fullName: parts[0] || `Khách mời ${i + 1}`,
        email: parts.find((p) => p.includes("@")) || parts[1] || "",
        phone: parts.find((p) => /^0\d{8,10}$/.test(p.replace(/\s+/g, ""))) || parts[2] || "",
        company: parts[3] || "",
        title: parts[4] || "",
        guestType: "invited_guest",
      };
    });
    if (guests.length === 0) {
      toast.error("Vui lòng nhập hoặc tải file danh sách khách mời!");
      return;
    }
    setBusy(true);
    try {
      const res = await fetchNestApi<any>("/ai/tools/execute", {
        method: "POST",
        body: {
          toolName: "create_event_invitation_list",
          params: { eventId: selectedEventId, guests, sendEmail: sendInviteEmail },
        },
      });
      if (res?.success) {
        toast.success(res.auditMessage || "Đã tạo danh sách & gửi thư mời!");
        onLogResultToChat(
          "Tạo danh sách & Gửi thư mời sự kiện",
          res.auditMessage || `Đã lưu ${guests.length} khách mời vào sự kiện ${selectedEventId}.`,
        );
        setGuestText("");
      } else {
        toast.error(res?.error || "Thao tác thất bại");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCreateMembers = async () => {
    const members =
      importedMembers.length > 0
        ? importedMembers.map((r) => ({
            name: r.name || r.fullName || r["Họ tên"] || r["Họ và tên"] || "",
            email: r.email || r.Email || "",
            phone: String(r.phone || r["SĐT"] || r["Số điện thoại"] || ""),
            company: r.company || r["Công ty"] || r["Doanh nghiệp"] || "",
            title: r.title || r["Chức vụ"] || "Học viên",
            department: r.department || r["Ban"] || "Ban Thành Viên",
          }))
        : memberForm.name.trim()
        ? [memberForm]
        : [];
    if (members.length === 0) {
      toast.error("Vui lòng nhập thông tin học viên hoặc tải file Excel/CSV!");
      return;
    }
    setBusy(true);
    try {
      const res = await fetchNestApi<any>("/ai/tools/execute", {
        method: "POST",
        body: { toolName: "import_or_create_members", params: { members } },
      });
      if (res?.success) {
        toast.success(res.auditMessage || "Đã thêm học viên thành công!");
        onLogResultToChat("Thêm / Import Học viên", res.auditMessage || "");
        setImportedMembers([]);
        setMemberForm({ name: "", email: "", phone: "", company: "", title: "CEO", department: "Ban Thành Viên" });
      } else {
        toast.error(res?.error || "Lỗi thêm học viên");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCreateLecturers = async () => {
    const lecturers =
      importedLecturers.length > 0
        ? importedLecturers.map((r) => ({
            fullName: r.fullName || r.name || r["Họ tên"] || r["Giảng viên"] || "",
            title: r.title || r["Chức danh"] || "Giảng viên",
            company: r.company || r["Đơn vị"] || "",
            specialty: r.specialty || r["Chuyên môn"] || "Quản trị & Lãnh đạo",
            email: r.email || r.Email || "",
            phone: String(r.phone || r["SĐT"] || ""),
          }))
        : lecturerForm.fullName.trim()
        ? [lecturerForm]
        : [];
    if (lecturers.length === 0) {
      toast.error("Vui lòng nhập tên giảng viên hoặc tải file!");
      return;
    }
    setBusy(true);
    try {
      const res = await fetchNestApi<any>("/ai/tools/execute", {
        method: "POST",
        body: { toolName: "create_lecturer", params: { lecturers } },
      });
      if (res?.success) {
        toast.success(res.auditMessage || "Đã thêm giảng viên!");
        onLogResultToChat("Thêm Giảng viên mới", res.auditMessage || "");
        setImportedLecturers([]);
        setLecturerForm({ fullName: "", title: "Chuyên gia / Giảng viên", company: "", specialty: "Quản trị Doanh nghiệp", email: "", phone: "" });
      } else {
        toast.error(res?.error || "Lỗi thêm giảng viên");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCreateClass = async () => {
    if (!classForm.title.trim()) {
      toast.error("Vui lòng nhập tên lớp học!");
      return;
    }
    setBusy(true);
    try {
      const res = await fetchNestApi<any>("/ai/tools/execute", {
        method: "POST",
        body: {
          toolName: "create_training_class",
          params: {
            ...classForm,
            ticketFee: Number(classForm.ticketFee || 0),
          },
        },
      });
      if (res?.success) {
        toast.success(res.auditMessage || "Đã tạo lớp học!");
        onLogResultToChat("Tạo Lớp học mới", res.auditMessage || "");
        setClassForm({ title: "", instructorName: "", instructorTitle: "Chuyên gia CEO HN10", location: "Hà Nội", startTime: "", ticketFee: "0" });
      } else {
        toast.error(res?.error || "Lỗi tạo lớp học");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-4 mt-3 p-4 rounded-2xl border border-blue-200 bg-blue-50/50 dark:bg-slate-900 dark:border-slate-700 space-y-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setTab("invite")} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${tab === "invite" ? "bg-[#003B95] text-white" : "bg-white text-slate-700 border border-slate-200"}`}>
            <Calendar className="size-3.5" /> Thư mời Sự kiện
          </button>
          <button type="button" onClick={() => setTab("member")} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${tab === "member" ? "bg-[#003B95] text-white" : "bg-white text-slate-700 border border-slate-200"}`}>
            <Users className="size-3.5" /> Học viên mới
          </button>
          <button type="button" onClick={() => setTab("lecturer")} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${tab === "lecturer" ? "bg-[#003B95] text-white" : "bg-white text-slate-700 border border-slate-200"}`}>
            <GraduationCap className="size-3.5" /> Giảng viên mới
          </button>
          <button type="button" onClick={() => setTab("class")} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${tab === "class" ? "bg-[#003B95] text-white" : "bg-white text-slate-700 border border-slate-200"}`}>
            <BookOpen className="size-3.5" /> Tạo Lớp học
          </button>
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer">
          <X className="size-4" />
        </button>
      </div>

      {tab === "invite" && (
        <div className="space-y-2.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Chọn sự kiện trong hệ thống:</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name || ev.title} ({ev.date || "Sắp diễn ra"})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700">Danh sách khách mời (mỗi dòng: Họ tên, Email, SĐT, Công ty):</label>
            <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 cursor-pointer font-semibold text-blue-700">
              <FileSpreadsheet className="size-3.5" /> Nạp từ Excel/CSV
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    void parseSheetFile(f, (rows) => {
                      const lines = rows.map((r) => [r.fullName || r.name || r["Họ tên"] || "", r.email || r.Email || "", r.phone || r["SĐT"] || "", r.company || r["Công ty"] || ""].filter(Boolean).join(", "));
                      setGuestText(lines.join("\n"));
                    });
                  }
                }}
              />
            </label>
          </div>
          <textarea
            rows={3}
            value={guestText}
            onChange={(e) => setGuestText(e.target.value)}
            placeholder="Nguyễn Văn A, a@gmail.com, 0901234567, Công ty ABC"
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-mono"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={sendInviteEmail} onChange={(e) => setSendInviteEmail(e.target.checked)} />
              Gửi ngay email thư mời cá nhân hóa
            </label>
            <button type="button" disabled={busy} onClick={handleCreateInvites} className="px-4 py-2 rounded-xl bg-[#003B95] text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Tạo DS &amp; Gửi Thư Mời
            </button>
          </div>
        </div>
      )}

      {tab === "member" && (
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Nhập trực tiếp hoặc nạp file Excel/CSV danh sách học viên:</span>
            <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 cursor-pointer font-semibold text-blue-700">
              <FileSpreadsheet className="size-3.5" /> Chọn file Excel/CSV ({importedMembers.length})
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void parseSheetFile(f, setImportedMembers); }} />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input placeholder="Họ tên *" value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
            <input placeholder="Email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
            <input placeholder="Số điện thoại" value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
            <input placeholder="Công ty" value={memberForm.company} onChange={(e) => setMemberForm({ ...memberForm, company: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
            <input placeholder="Chức vụ" value={memberForm.title} onChange={(e) => setMemberForm({ ...memberForm, title: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
            <button type="button" disabled={busy} onClick={handleCreateMembers} className="rounded-lg bg-emerald-600 text-white font-bold px-3 py-1.5 flex items-center justify-center gap-1 cursor-pointer">
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              Lưu Học Viên
            </button>
          </div>
        </div>
      )}

      {tab === "lecturer" && (
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Thêm Giảng viên mới (nhập tay hoặc file Excel/CSV):</span>
            <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 cursor-pointer font-semibold text-blue-700">
              <FileSpreadsheet className="size-3.5" /> File Giảng viên ({importedLecturers.length})
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void parseSheetFile(f, setImportedLecturers); }} />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input placeholder="Họ tên Giảng viên *" value={lecturerForm.fullName} onChange={(e) => setLecturerForm({ ...lecturerForm, fullName: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
            <input placeholder="Chức danh / Học vị" value={lecturerForm.title} onChange={(e) => setLecturerForm({ ...lecturerForm, title: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
            <input placeholder="Chuyên môn" value={lecturerForm.specialty} onChange={(e) => setLecturerForm({ ...lecturerForm, specialty: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
            <input placeholder="Email" value={lecturerForm.email} onChange={(e) => setLecturerForm({ ...lecturerForm, email: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
            <input placeholder="Số điện thoại" value={lecturerForm.phone} onChange={(e) => setLecturerForm({ ...lecturerForm, phone: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
            <button type="button" disabled={busy} onClick={handleCreateLecturers} className="rounded-lg bg-indigo-600 text-white font-bold px-3 py-1.5 flex items-center justify-center gap-1 cursor-pointer">
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              Lưu Giảng Viên
            </button>
          </div>
        </div>
      )}

      {tab === "class" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <input placeholder="Tên lớp học / Chuyên đề *" value={classForm.title} onChange={(e) => setClassForm({ ...classForm, title: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
          <input placeholder="Tên Giảng viên" value={classForm.instructorName} onChange={(e) => setClassForm({ ...classForm, instructorName: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
          <input placeholder="Địa điểm học" value={classForm.location} onChange={(e) => setClassForm({ ...classForm, location: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
          <input type="datetime-local" value={classForm.startTime} onChange={(e) => setClassForm({ ...classForm, startTime: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
          <input type="number" placeholder="Học phí (VNĐ)" value={classForm.ticketFee} onChange={(e) => setClassForm({ ...classForm, ticketFee: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
          <button type="button" disabled={busy} onClick={handleCreateClass} className="rounded-lg bg-[#003B95] text-white font-bold px-3 py-1.5 flex items-center justify-center gap-1 cursor-pointer">
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
            Tạo Lớp Học
          </button>
        </div>
      )}
    </div>
  );
}
