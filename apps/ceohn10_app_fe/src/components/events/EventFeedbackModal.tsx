import React, { useState, useEffect } from "react";
import { Star, MessageSquare, X, Send, User, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

export interface EventFeedback {
  id: string;
  event_id: string;
  member_id?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export function EventFeedbackModal({
  open,
  eventId,
  eventName,
  onClose,
}: {
  open: boolean;
  eventId: string;
  eventName: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<EventFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState(user?.name || user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");

  const loadFeedbacks = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const res = await fetchNestApi<EventFeedback[]>(`/events/${eventId}/feedbacks`);
      setFeedbacks(Array.isArray(res) ? res : []);
    } catch {
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadFeedbacks();
    }
  }, [open, eventId]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá góp ý!");
      return;
    }
    setSubmitting(true);
    try {
      await fetchNestApi(`/events/${eventId}/feedbacks`, {
        method: "POST",
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          userName: userName.trim() || user?.name || "Hội viên CEO HN10",
          email: email.trim() || user?.email || "",
          phone: user?.phone || "",
        }),
      });
      toast.success("Cảm ơn Quý Doanh nhân đã gửi đánh giá phản hồi!");
      setComment("");
      await loadFeedbacks();
    } catch {
      toast.error("Không thể gửi phản hồi lúc này.");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((acc, f) => acc + (Number(f.rating) || 5), 0) / feedbacks.length).toFixed(1)
    : "5.0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                Đánh Giá &amp; Phản Hồi Sự Kiện
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">{eventName}</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Summary Box */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
            <div>
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">
                ĐIỂM ĐÁNH GIÁ TRUNG BÌNH
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {avgRating}
                </span>
                <span className="text-xs font-semibold text-slate-500">/ 5 sao</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {feedbacks.length} lượt đánh giá
              </span>
              <span className="text-[11px] text-slate-500">từ đại biểu &amp; hội viên</span>
            </div>
          </div>

          {/* Form đánh giá mới */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span>Gửi Đánh Giá Của Quý Anh/Chị</span>
            </h4>

            {/* Star Selector */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1 hover:scale-110 transition cursor-pointer"
                >
                  <Star
                    className={`h-5 w-5 ${
                      s <= rating
                        ? "text-amber-500 fill-amber-500"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 font-bold text-amber-600">{rating} sao</span>
            </div>

            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận, ý kiến đóng góp về công tác tổ chức, nội dung sự kiện..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs text-foreground outline-none focus:border-[#003B95]"
            />

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-[#003B95] text-white font-bold text-xs shadow-xs hover:bg-[#002f78] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Gửi Đánh Giá</span>
              </button>
            </div>
          </form>

          {/* Feedback list */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">
              Các Ý Kiến Đóng Góp Trước Đó ({feedbacks.length})
            </h4>
            {loading ? (
              <div className="py-6 text-center text-slate-400">Đang tải đánh giá...</div>
            ) : feedbacks.length === 0 ? (
              <div className="py-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                Chưa có đánh giá nào cho sự kiện này. Hãy là người đầu tiên đóng góp ý kiến!
              </div>
            ) : (
              <div className="space-y-2.5">
                {feedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-background space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{f.user_name || "Đại biểu tham dự"}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: f.rating || 5 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                    </div>
                    {f.comment && (
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {f.comment}
                      </p>
                    )}
                    <div className="text-[10px] text-slate-400">
                      {f.created_at ? new Date(f.created_at).toLocaleString("vi-VN") : "Vừa xong"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
