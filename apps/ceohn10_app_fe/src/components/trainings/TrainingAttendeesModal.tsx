import React, { useState, useEffect } from "react";
import { Users, CheckCircle2, Clock, Send, Plus, X, Search, FileText, Check, ShieldCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

export interface TrainingAttendee {
  id: string;
  training_id: string;
  member_id?: string;
  user_name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "registered" | "attended" | "cancelled";
  slide_sent: boolean;
  slide_sent_at?: string;
  registered_at: string;
  attended_at?: string;
}

export function TrainingAttendeesModal({
  open,
  trainingId,
  trainingTitle,
  initialSlideUrl,
  onClose,
  onUpdateCount,
}: {
  open: boolean;
  trainingId: string;
  trainingTitle: string;
  initialSlideUrl?: string;
  onClose: () => void;
  onUpdateCount?: (newCount: number) => void;
}) {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<TrainingAttendee[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Slide modal
  const [slideUrl, setSlideUrl] = useState(initialSlideUrl || "");
  const [sendingSlides, setSendingSlides] = useState(false);

  // Register attendee modal / form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [registering, setRegistering] = useState(false);

  const loadAttendees = async () => {
    if (!trainingId) return;
    try {
      setLoading(true);
      const res = await fetchNestApi<TrainingAttendee[]>(`/trainings/${trainingId}/attendees`);
      const list = Array.isArray(res) ? res : [];
      setAttendees(list);
      if (onUpdateCount) onUpdateCount(list.length);
    } catch {
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadAttendees();
    }
  }, [open, trainingId]);

  if (!open) return null;

  // Handle Attendance Check-in
  const handleCheckin = async (attendeeId: string) => {
    try {
      await fetchNestApi(`/trainings/${trainingId}/attendees/${attendeeId}/checkin`, {
        method: "PATCH",
        body: JSON.stringify({ status: "attended" }),
      });
      toast.success("Đã điểm danh học viên thành công!");
      await loadAttendees();
    } catch {
      toast.error("Không thể điểm danh lúc này");
    }
  };

  // Handle Send Slides to all attendees (and archive to Document Management)
  const handleSendSlides = async () => {
    if (!slideUrl.trim()) {
      toast.error("Vui lòng nhập đường link slide bài giảng (Google Drive / PDF / PPTX)!");
      return;
    }
    setSendingSlides(true);
    try {
      await fetchNestApi(`/trainings/${trainingId}/send-slides`, {
        method: "POST",
        body: JSON.stringify({ slideUrl: slideUrl.trim() }),
      });
      toast.success(
        "Đã gửi slide bài giảng cho tất cả học viên và tự động lưu trữ vào Quản Lý Tài Liệu CLB!"
      );
      await loadAttendees();
    } catch {
      toast.error("Không thể gửi slide bài giảng");
    } finally {
      setSendingSlides(false);
    }
  };

  // Handle Register New Attendee
  const handleRegisterAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Vui lòng điền họ tên và email học viên!");
      return;
    }
    setRegistering(true);
    try {
      await fetchNestApi(`/trainings/${trainingId}/register`, {
        method: "POST",
        body: JSON.stringify({
          fullName: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          phone: newPhone.trim(),
          company: newCompany.trim(),
        }),
      });
      toast.success(`Đã đăng ký học viên "${newName}" vào khóa học thành công!`);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewCompany("");
      setShowAddForm(false);
      await loadAttendees();
    } catch {
      toast.error("Không thể đăng ký học viên lúc này");
    } finally {
      setRegistering(false);
    }
  };

  const filtered = attendees.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.user_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.phone && a.phone.includes(q)) ||
      (a.company && a.company.toLowerCase().includes(q))
    );
  });

  const attendedCount = attendees.filter((a) => a.status === "attended").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800 text-white flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                Danh Sách Học Viên &amp; Điểm Danh
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">{trainingTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Bar: Gửi Slide & Thêm học viên */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-xs">
                Tổng đăng ký: {attendees.length}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs">
                Đã điểm danh: {attendedCount}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-foreground font-bold text-xs hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Đăng Ký Học Viên Mới</span>
              </button>
            </div>
          </div>

          {/* Form Gửi Slide cho học viên */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex-1 min-w-[260px]">
              <input
                type="url"
                value={slideUrl}
                onChange={(e) => setSlideUrl(e.target.value)}
                placeholder="Dán link slide bài giảng (Google Drive / PowerPoint / PDF)..."
                className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs text-foreground outline-none focus:border-[#003B95]"
              />
            </div>
            <button
              type="button"
              disabled={sendingSlides}
              onClick={handleSendSlides}
              className="px-4 py-2 rounded-xl bg-[#003B95] text-white font-bold text-xs shadow-xs hover:bg-[#002f78] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {sendingSlides ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Gửi Slide Cho Học Viên &amp; Lưu Vào Tài Liệu</span>
            </button>
          </div>

          {/* Form thêm học viên mới inline */}
          {showAddForm && (
            <form
              onSubmit={handleRegisterAttendee}
              className="p-3.5 rounded-2xl bg-white dark:bg-card border border-blue-200 dark:border-blue-900 space-y-2.5 animate-in fade-in"
            >
              <div className="font-bold text-xs text-blue-900 dark:text-blue-300">
                Đăng ký học viên tham gia trước buổi học:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Họ và tên học viên *"
                  className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-background"
                />
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Địa chỉ Email nhận slide *"
                  className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-background"
                />
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Số điện thoại"
                  className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-background"
                />
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="Doanh nghiệp / Đơn vị công tác"
                  className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-background"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-4 py-1 rounded-lg bg-[#003B95] text-white text-xs font-bold shadow-xs"
                >
                  {registering ? "Đang lưu..." : "Xác Nhận Đăng Ký"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Filter input */}
        <div className="px-6 py-2.5 bg-background border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên học viên, email, công ty..."
            className="w-full bg-transparent text-xs text-foreground outline-none"
          />
        </div>

        {/* Table of attendees */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-8 text-center text-slate-400">Đang tải danh sách học viên...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              Chưa có học viên nào đăng ký.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                    <th className="pb-2.5">STT</th>
                    <th className="pb-2.5">Học Viên</th>
                    <th className="pb-2.5">Doanh Nghiệp / SĐT</th>
                    <th className="pb-2.5">Slide Bài Giảng</th>
                    <th className="pb-2.5">Trạng Thái</th>
                    <th className="pb-2.5 text-right">Điểm Danh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filtered.map((a, idx) => {
                    const isAttended = a.status === "attended";
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 text-slate-400">{idx + 1}</td>
                        <td className="py-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {a.user_name}
                          </div>
                          <div className="text-[11px] text-slate-500">{a.email}</div>
                        </td>
                        <td className="py-3">
                          <div className="text-slate-700 dark:text-slate-300">
                            {a.company || "Hội viên CLB"}
                          </div>
                          <div className="text-[11px] text-slate-400">{a.phone || "—"}</div>
                        </td>
                        <td className="py-3">
                          {a.slide_sent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Đã gửi slide</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Chưa gửi</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isAttended
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {isAttended ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Đã tham dự</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3" />
                                <span>Đã đăng ký</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {!isAttended ? (
                            <button
                              type="button"
                              onClick={() => handleCheckin(a.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer transition"
                            >
                              Xác Nhận Điểm Danh
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              Đã check-in ({a.attended_at ? new Date(a.attended_at).toLocaleTimeString("vi-VN") : "Hợp lệ"})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
