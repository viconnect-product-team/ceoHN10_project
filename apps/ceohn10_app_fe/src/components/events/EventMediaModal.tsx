import React, { useState } from "react";
import { Camera, Video, Link as LinkIcon, X, Upload, CheckCircle2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export function EventMediaModal({
  open,
  eventId,
  eventName,
  existingGalleryUrl,
  onClose,
  onUpdated,
}: {
  open: boolean;
  eventId: string;
  eventName: string;
  existingGalleryUrl?: string;
  onClose: () => void;
  onUpdated?: (newUrl: string) => void;
}) {
  const [mediaUrl, setMediaUrl] = useState(existingGalleryUrl || "");
  const [mediaType, setMediaType] = useState<"gallery" | "video" | "photo">("gallery");
  const [title, setTitle] = useState(`Khoảnh khắc & Ảnh tư liệu: ${eventName}`);
  const [description, setDescription] = useState("Album ảnh & media chính thức được ghi lại trong suốt sự kiện CEO HN10");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim()) {
      toast.error("Vui lòng nhập đường link Google Drive, OneDrive hoặc liên kết media!");
      return;
    }
    setSubmitting(true);
    try {
      await fetchNestApi(`/events/${eventId}/media`, {
        method: "POST",
        body: JSON.stringify({
          mediaUrl: mediaUrl.trim(),
          mediaType,
          title: title.trim(),
          description: description.trim(),
        }),
      });
      toast.success("Đã đính kèm tư liệu và tự động đồng bộ vào Quản Lý Tài Liệu CLB!");
      if (onUpdated) onUpdated(mediaUrl.trim());
      onClose();
    } catch {
      toast.error("Không thể lưu tư liệu media sự kiện lúc này.");
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
            <div className="w-10 h-10 rounded-xl bg-blue-800 text-white flex items-center justify-center font-bold">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                Tư Liệu Ảnh &amp; Media Sự Kiện
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <FolderOpen className="h-4 w-4 shrink-0 text-[#003B95] mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Tự động tích hợp Quản Lý Tài Liệu:</strong> Khi Ban Sự Kiện / Truyền Thông lưu link ảnh hoặc video tại đây, hệ thống sẽ tự động tạo bản ghi lưu trữ vào đúng phân hệ Quản Lý Tài Liệu để hội viên tiện tra cứu sau sự kiện.
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Phân Loại Tư Liệu Media
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "gallery", label: "Album Ảnh Drive", icon: Camera },
                { key: "video", label: "Video Quay Lại", icon: Video },
                { key: "photo", label: "Ảnh Nổi Bật", icon: LinkIcon },
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
              Đường Link Album Ảnh / Media (Google Drive, Cloud Storage, YouTube...) <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/... hoặc liên kết album"
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
              Ghi Chú / Mô Tả
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
              <span>Lưu Tư Liệu &amp; Đồng Bộ Tài Liệu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
