import React, { useState } from "react";
import { Camera, Video, Link as LinkIcon, X, CheckCircle2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export function TrainingMediaModal({
  open,
  trainingId,
  trainingTitle,
  existingMediaUrl,
  onClose,
  onUpdated,
}: {
  open: boolean;
  trainingId: string;
  trainingTitle: string;
  existingMediaUrl?: string;
  onClose: () => void;
  onUpdated?: (newUrl: string) => void;
}) {
  const [mediaUrl, setMediaUrl] = useState(existingMediaUrl || "");
  const [mediaType, setMediaType] = useState<"video" | "gallery" | "photo" | "slide">("slide");
  const [department, setDepartment] = useState<string>("Ban Học Tập");
  const [title, setTitle] = useState(`Khoảnh khắc & Ghi hình buổi học: ${trainingTitle}`);
  const [description, setDescription] = useState("Video bài giảng và hình ảnh lưu niệm được ghi lại trong suốt buổi đào tạo CEO HN10");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim()) {
      toast.error("Vui lòng nhập đường link video hoặc album ảnh (Google Drive / YouTube / Cloud)!");
      return;
    }
    setSubmitting(true);
    try {
      await fetchNestApi(`/trainings/${trainingId}/media`, {
        method: "POST",
        body: JSON.stringify({
          mediaUrl: mediaUrl.trim(),
          mediaType,
          department,
          docType: mediaType === "slide" ? "slide" : "media",
          title: title.trim(),
          description: description.trim(),
        }),
      });
      toast.success("Đã đính kèm tư liệu và tự động đồng bộ vào Quản Lý Tài Liệu CLB!");
      if (onUpdated) onUpdated(mediaUrl.trim());
      onClose();
    } catch {
      toast.error("Không thể lưu tư liệu media buổi học lúc này.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-800 text-white flex items-center justify-center font-bold">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                Tư Liệu Quay Phim &amp; Chụp Ảnh Buổi Học
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <FolderOpen className="h-4 w-4 shrink-0 text-indigo-700 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Tự động lưu trữ Quản Lý Tài Liệu:</strong> Trong suốt quá trình buổi học diễn ra có quay phim chụp ảnh, khi kết thúc buổi học, ban tổ chức đính kèm link tại đây và hệ thống sẽ tự động chuyển vào Quản Lý Tài Liệu CLB cho toàn thể học viên xem lại.
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ban Chức Năng Tải Lên (Tự động lưu vào thư mục Ban)
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="Ban Học Tập">Ban Học Tập (Lớp phó Nguyễn Thành Luân - Slide bài giảng)</option>
              <option value="Ban Truyền Thông">Ban Truyền Thông (Lớp phó Phạm Hồng Anh - Ảnh, Video ghi hình)</option>
              <option value="Ban Sự Kiện – Hậu Cần">Ban Sự Kiện – Hậu Cần (Lớp phó Đàm Thị Hương - Vật tư)</option>
              <option value="Ban Tài Chính – Tài Trợ">Ban Tài Chính – Tài Trợ (Lớp phó Lê Thị Thủy - Báo cáo tài trợ)</option>
              <option value="Ban Công Nghệ">Ban Công Nghệ (Lớp phó Ngô Văn Tuấn)</option>
              <option value="Ban Đối Ngoại & Giao Thương">Ban Đối Ngoại & Giao Thương (Lớp phó Dương Văn Hiệu)</option>
              <option value="Ban Đời Sống & Gắn Kết">Ban Đời Sống & Gắn Kết (Lớp phó Bùi Thị Phương Dinh)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Phân Loại Tư Liệu Buổi Học
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "slide", label: "Slide Bài Giảng", icon: LinkIcon },
                { key: "video", label: "Video Ghi Hình", icon: Video },
                { key: "gallery", label: "Album Ảnh Drive", icon: Camera },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = mediaType === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMediaType(m.key as any)}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-1 transition cursor-pointer ${
                      isSelected
                        ? "border-[#003B95] bg-blue-50 dark:bg-blue-950/40 text-[#003B95] dark:text-blue-300 ring-2 ring-[#003B95]/20"
                        : "border-slate-200 dark:border-slate-800 bg-background text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Đường Link Tư Liệu (Google Drive / YouTube / Cloud Storage) <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://drive.google.com/... hoặc link video YouTube bài giảng"
              className="w-full h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs text-foreground outline-none focus:border-[#003B95]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tiêu Đề Bản Ghi Tư Liệu
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs font-semibold text-foreground outline-none focus:border-[#003B95]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ghi Chú / Tóm Tắt Nội Dung Video
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-xs text-foreground outline-none focus:border-[#003B95]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#003B95] text-white font-bold text-xs shadow-md hover:bg-[#002f78] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>Lưu Tư Liệu &amp; Tự Động Lưu Trữ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
