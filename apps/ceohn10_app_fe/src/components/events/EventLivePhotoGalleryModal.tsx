import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Upload,
  X,
  Image as ImageIcon,
  FolderOpen,
  CheckCircle2,
  Trash2,
  Download,
  ExternalLink,
  Loader2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export interface EventPhoto {
  id: string;
  photoUrl: string;
  caption?: string;
  uploadedBy?: string;
  createdAt?: string;
}

export function EventLivePhotoGalleryModal({
  open,
  eventId,
  eventName,
  canUpload = true,
  onClose,
}: {
  open: boolean;
  eventId: string;
  eventName: string;
  canUpload?: boolean;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<EventPhoto | null>(null);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load photos of this specific event
  const loadPhotos = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const res = await fetchNestApi<any>(`/events/${eventId}/photos`);
      const list = res?.photos || (Array.isArray(res) ? res : []);
      setPhotos(list);
    } catch {
      toast.error("Không thể tải danh sách ảnh sự kiện");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && eventId) {
      loadPhotos();
    }
  }, [open, eventId]);

  // Handle upload photos (Camera capture or File picker)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Đọc ảnh dạng Base64 Data URL để lưu trữ và hiển thị trực tiếp
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const caption = `Khoảnh khắc trực tiếp: ${file.name.replace(/\.[^/.]+$/, "")}`;

        await fetchNestApi(`/events/${eventId}/photos`, {
          method: "POST",
          body: JSON.stringify({
            photoUrl: dataUrl,
            caption,
            uploadedBy: "Ban Check-in & Truyền Thông",
          }),
        });

        successCount++;
      } catch (err: any) {
        console.error("Lỗi tải ảnh:", err);
      }
    }

    setUploading(false);
    if (e.target) e.target.value = "";

    if (successCount > 0) {
      toast.success(
        `Đã lưu ${successCount} ảnh vào sự kiện và tự động đồng bộ vào Quản Lý Tài Liệu CLB!`
      );
      loadPhotos();
    } else {
      toast.error("Không thể tải ảnh lên lúc này");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl border border-border bg-white dark:bg-card shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-foreground">
        {/* Hidden File Inputs */}
        {/* Input 1: Camera capture trực tiếp (Điện thoại/Webcam) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFilesSelected}
        />
        {/* Input 2: File upload đa chọn từ máy tính */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-[#002B70] via-[#003B95] to-[#0A4DB0] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                <span>TƯ LIỆU ẢNH TRỰC TIẾP TRONG SỰ KIỆN</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                  Tự Động Đồng Bộ Tài Liệu
                </span>
              </h2>
              <p className="text-xs text-blue-200 line-clamp-1">{eventName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-muted/30 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FolderOpen className="h-4 w-4 text-[#003B95]" />
            <span>Đã ghi lại: <strong className="text-foreground">{photos.length}</strong> khoảnh khắc</span>
          </div>

          {canUpload && (
            <div className="flex items-center gap-2.5">
              {/* Nút 1: Chụp ảnh trực tiếp */}
              <button
                type="button"
                disabled={uploading}
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                <span>Chụp Ảnh Ngay</span>
              </button>

              {/* Nút 2: Tải ảnh từ thư viện */}
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{uploading ? "Đang Lưu Ảnh..." : "Tải Ảnh Lên"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Photos Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-[#003B95]" />
              <p className="text-xs">Đang tải khoảnh khắc sự kiện...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center p-8 text-center rounded-3xl border-2 border-dashed border-border space-y-3">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Chưa có ảnh nào được ghi lại</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Ban Tổ Chức và người có quyền check-in có thể bấm <strong className="text-rose-600">Chụp Ảnh Ngay</strong> hoặc <strong className="text-[#003B95]">Tải Ảnh Lên</strong> để lưu lại khoảnh khắc sự kiện.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setPreviewPhoto(photo)}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-border bg-slate-100 dark:bg-muted shadow-2xs hover:shadow-lg transition cursor-pointer"
                >
                  <img
                    src={photo.photoUrl}
                    alt={photo.caption || "Ảnh sự kiện"}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2.5 text-white">
                    <p className="text-[11px] font-bold line-clamp-1">{photo.caption || "Khoảnh khắc sự kiện"}</p>
                    <p className="text-[9px] text-slate-300">
                      {photo.createdAt ? new Date(photo.createdAt).toLocaleTimeString("vi-VN") : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Xem Ảnh Phóng To */}
        {previewPhoto && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
            onClick={() => setPreviewPhoto(null)}
          >
            <div
              className="relative max-w-3xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewPhoto.photoUrl}
                alt={previewPhoto.caption || "Ảnh sự kiện"}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              />
              <div className="mt-3 flex items-center justify-between w-full px-2 text-white text-xs">
                <span>{previewPhoto.caption || eventName}</span>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold cursor-pointer transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
