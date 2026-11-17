import React, { useState, useEffect } from "react";
import { Star, MessageSquare, X, Send, User, Upload, FileText, CheckCircle2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi, uploadFileToNest } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

export interface TrainingFeedbackItem {
  id: string;
  training_id: string;
  member_id?: string;
  user_name?: string;
  content: string;
  file_url?: string;
  file_name?: string;
  rating: number;
  created_at: string;
}

export function TrainingFeedbackModal({
  open,
  trainingId,
  trainingTitle,
  onClose,
}: {
  open: boolean;
  trainingId: string;
  trainingTitle: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<TrainingFeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  const loadFeedbacks = async () => {
    if (!trainingId) return;
    try {
      setLoading(true);
      const res = await fetchNestApi<TrainingFeedbackItem[]>(`/trainings/${trainingId}/feedbacks`);
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
  }, [open, trainingId]);

  if (!open) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const toastId = toast.loading("Đang tải file đính kèm phản hồi lên...");
    try {
      const url = await uploadFileToNest(file, `feedback_${Date.now()}_${file.name}`);
      setFileUrl(url);
      setFileName(file.name);
      toast.success("Đã tải tệp đính kèm thành công!", { id: toastId });
    } catch {
      toast.error("Không thể tải tệp lên lúc này", { id: toastId });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !fileUrl) {
      toast.error("Vui lòng nhập ý kiến đóng góp hoặc đính kèm tệp!");
      return;
    }
    setSubmitting(true);
    try {
      await fetchNestApi(`/trainings/${trainingId}/feedbacks`, {
        method: "POST",
        body: JSON.stringify({
          rating,
          content: content.trim(),
          fileUrl,
          fileName,
          userName: user?.name || user?.fullName || "Học viên CEO HN10",
        }),
      });
      toast.success("Đã gửi phản hồi buổi học thành công!");
      setContent("");
      setFileUrl("");
      setFileName("");
      await loadFeedbacks();
    } catch {
      toast.error("Không thể gửi phản hồi khóa học.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 flex items-center justify-center font-bold">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                Phản Hồi &amp; Đóng Góp Ý Kiến Sau Buổi Học
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Form đóng góp ý kiến */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                Đánh giá chất lượng buổi học
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-0.5 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        s <= rating
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-1.5 font-bold text-amber-600">{rating} sao</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ý kiến đóng góp / Bài thu hoạch (Văn bản Text)
              </label>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Gửi cảm nhận, câu hỏi cho giảng viên hoặc đề xuất nội dung chuyên đề tiếp theo..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs text-foreground outline-none focus:border-[#003B95]"
              />
            </div>

            {/* File đính kèm */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Đính kèm tệp bài thu hoạch / slide ghi chú (Tùy chọn)
              </label>
              {fileName ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="font-semibold truncate">{fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFileUrl("");
                      setFileName("");
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-background hover:bg-slate-50 cursor-pointer text-slate-600 dark:text-slate-400">
                  <Paperclip className="h-4 w-4 text-purple-600" />
                  <span>{uploadingFile ? "Đang tải tệp..." : "Tải lên tệp PDF, Word, PowerPoint hoặc Hình ảnh"}</span>
                  <input
                    type="file"
                    disabled={uploadingFile}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex justify-end pt-1">
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
                <span>Gửi Ý Kiến Phản Hồi</span>
              </button>
            </div>
          </form>

          {/* Danh sách phản hồi */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">
              Ý Kiến Phản Hồi Của Học Viên ({feedbacks.length})
            </h4>
            {loading ? (
              <div className="py-4 text-center text-slate-400">Đang tải phản hồi...</div>
            ) : feedbacks.length === 0 ? (
              <div className="py-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                Chưa có ý kiến đóng góp nào. Quý học viên vui lòng gửi phản hồi tại form phía trên.
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
                        <span>{f.user_name || "Học viên CEO HN10"}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: f.rating || 5 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                    </div>
                    {f.content && (
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {f.content}
                      </p>
                    )}
                    {f.file_url && (
                      <div className="pt-1">
                        <a
                          href={f.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 font-semibold hover:underline"
                        >
                          <Paperclip className="h-3 w-3" />
                          <span>{f.file_name || "Xem tệp đính kèm"}</span>
                        </a>
                      </div>
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
