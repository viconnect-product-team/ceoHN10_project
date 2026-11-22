import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Star,
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Send,
  MessageSquare,
  Camera,
  Paperclip,
  Share2,
  Copy,
  ExternalLink,
  ChevronRight,
  Heart,
  ThumbsUp,
} from "lucide-react";
import { fetchNestApi, uploadFileToNest } from "@/lib/api-client";
import { toast } from "sonner";
import { EventLivePhotoGalleryModal } from "@/components/events/EventLivePhotoGalleryModal";

export const Route = createFileRoute("/guest-event-feedback/$eventId")({
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
      event = {
        id: params.eventId,
        name: "Sự Kiện CLB Doanh Nhân CEO HN10",
        date: new Date().toISOString(),
        location: "Trụ sở CLB CEO HN10 (HanoiBA)",
      };
    }
    return { event };
  },
  component: StandaloneGuestEventFeedbackPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `Đánh Giá Sự Kiện: ${loaderData?.event?.name || "CLB CEO HN10"}` },
      {
        name: "description",
        content: `Đóng góp ý kiến và đánh giá chất lượng tổ chức sự kiện CLB Doanh Nhân CEO HN10 (HanoiBA).`,
      },
    ],
  }),
});

function StandaloneGuestEventFeedbackPage() {
  const { event } = Route.useLoaderData();

  const [rating, setRating] = useState<number>(5);
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [comment, setComment] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Gallery modal
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);

  useEffect(() => {
    if (event?.id) {
      fetchNestApi<any[]>(`/events/${event.id}/photos`)
        .then((res) => {
          if (Array.isArray(res)) setPhotoCount(res.length);
        })
        .catch(() => setPhotoCount(0));
    }
  }, [event?.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const toastId = toast.loading("Đang tải tệp đính kèm...");
    try {
      const url = await uploadFileToNest(file, `feedback_${event.id}_${Date.now()}_${file.name}`);
      setFileUrl(url);
      setFileName(file.name);
      toast.success("Đã đính kèm tệp thành công!", { id: toastId });
    } catch {
      toast.error("Không thể tải tệp lên lúc này", { id: toastId });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá góp ý!");
      return;
    }
    setSubmitting(true);
    try {
      await fetchNestApi(`/events/${event.id}/feedbacks`, {
        method: "POST",
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          fileUrl,
          fileName,
          userName: userName.trim() || "Đại biểu tham dự",
          email: email.trim(),
          phone: phone.trim(),
          company: company.trim(),
          position: position.trim(),
        }),
      });
      setSubmitted(true);
      toast.success("Cảm ơn Quý Doanh nhân đã gửi đánh giá góp ý cho CLB!");
    } catch (err: any) {
      toast.error("Không thể gửi phản hồi: " + (err?.message || "Lỗi kết nối"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 antialiased selection:bg-[#003B95] selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#003B95]/30 via-[#BA2025]/20 to-transparent blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto space-y-5 py-4 sm:py-8">
        {/* Brand Banner Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CLB DOANH NHÂN CEO HN10 (HANOIBA)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            Đánh Giá &amp; Góp Ý Sự Kiện
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Ý kiến đóng góp quý báu của Quý Doanh nhân giúp Ban Tổ Chức hoàn thiện và nâng tầm chất lượng các kỳ sự kiện tiếp theo.
          </p>
        </div>

        {/* Event Card Summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                SỰ KIỆN CLB
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 line-clamp-2">
                {event.name}
              </h2>
            </div>
            {photoCount > 0 && (
              <button
                type="button"
                onClick={() => setPhotoGalleryOpen(true)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#003B95]/30 border border-[#003B95]/50 text-sky-300 text-xs font-semibold hover:bg-[#003B95]/50 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Xem ảnh ({photoCount})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{event.date ? new Date(event.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }) : "Đã hoàn thành"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="line-clamp-1">{event.location || "CLB CEO HN10"}</span>
            </div>
          </div>
        </div>

        {/* Form or Success State */}
        {submitted ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 backdrop-blur-md p-6 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                Gửi Đánh Giá Thành Công!
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Chân thành cảm ơn Quý Doanh nhân đã dành thời gian quý báu chia sẻ cảm nhận. Mọi phản hồi đã được lưu vào hệ thống CRM CEO HN10 và chuyển tới Ban Điều Hành CLB.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setPhotoGalleryOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#003B95] text-white font-bold text-xs hover:bg-[#002f78] transition cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Xem Trọn Bộ Album Ảnh Sự Kiện</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setComment("");
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
              >
                <span>Gửi Thêm Đóng Góp</span>
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-5 text-xs"
          >
            {/* Rating Star Selection */}
            <div className="text-center space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                Mức Độ Hài Lòng Của Quý Anh/Chị Về Sự Kiện *
              </label>
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1.5 transition transform hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                          : "text-slate-600 hover:text-slate-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-amber-400">
                {rating === 5 && "⭐ Xuất sắc - Rất hài lòng"}
                {rating === 4 && "⭐ Tốt - Hài lòng"}
                {rating === 3 && "⭐ Bình thường - Đạt yêu cầu"}
                {rating === 2 && "⭐ Cần cải thiện thêm"}
                {rating === 1 && "⭐ Chưa hài lòng"}
              </p>
            </div>

            {/* User Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Họ và tên Quý Anh/Chị
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:border-[#003B95]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:border-[#003B95]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Công ty / Doanh nghiệp
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Tập đoàn ABC"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:border-[#003B95]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Chức danh
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Chủ tịch / CEO"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:border-[#003B95]"
                  />
                </div>
              </div>
            </div>

            {/* Comment Body */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Ý kiến đóng góp &amp; cảm nhận chi tiết *
              </label>
              <textarea
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ về nội dung chương trình, khâu đón tiếp, tiệc kết nối, diễn giả hoặc đề xuất các chủ đề cho sự kiện tới..."
                className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:border-[#003B95] leading-relaxed"
              />
            </div>

            {/* Attachment */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800 transition cursor-pointer text-xs">
                <Paperclip className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  {uploadingFile
                    ? "Đang tải tệp..."
                    : fileName
                      ? fileName
                      : "Đính kèm ảnh kỷ niệm / tư liệu"}
                </span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFile}
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#BA2025] to-[#003B95] text-white font-bold text-xs shadow-lg hover:opacity-95 transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>GỬI ĐÁNH GIÁ</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer Note */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>© 2026 CLB Doanh Nhân CEO HN10 - HanoiBA. Bản quyền thuộc về CLB.</p>
          <p>Hệ thống tự động tiếp nhận và chuyển đến Ban Thư Ký &amp; Ban Quản Trị.</p>
        </div>
      </div>

      {/* Photo Gallery Modal */}
      {photoGalleryOpen && (
        <EventLivePhotoGalleryModal
          open={photoGalleryOpen}
          eventId={event.id}
          eventName={event.name}
          canUpload={false}
          onClose={() => setPhotoGalleryOpen(false)}
        />
      )}
    </div>
  );
}
