import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Vote as VoteIcon,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Send,
  User,
  Mail,
  Phone,
  Sparkles,
  ArrowLeft,
  Check,
} from "lucide-react";
import { fetchNestApi } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/guest-voting/$pollId")({
  ssr: false,
  loader: async ({ params }) => {
    let poll: any = await fetchNestApi<any>(`/voting/public-polls/${params.pollId}`).catch(() => null);
    if (!poll) {
      poll = await fetchNestApi<any>(`/voting/polls/${params.pollId}`).catch(() => null);
    }
    return { poll };
  },
  component: GuestVotingPage,
});

function GuestVotingPage() {
  const { poll } = Route.useLoaderData();
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [voterName, setVoterName] = useState("");
  const [voterEmail, setVoterEmail] = useState("");
  const [voterPhone, setVoterPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  if (!poll) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Không Tìm Thấy Phiên Biểu Quyết</h2>
          <p className="text-sm text-slate-600 mb-6">
            Mã biểu quyết không tồn tại hoặc phiên biểu quyết đã kết thúc. Vui lòng kiểm tra lại liên kết trong Email hoặc Zalo OA.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#003B95] text-white font-bold rounded-xl text-sm hover:bg-blue-900 transition"
          >
            Về Trang Chủ
          </a>
        </div>
      </div>
    );
  }

  const isClosed = poll.status === "closed";
  const options = Array.isArray(poll.options) ? poll.options : [];

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOptionId) {
      toast.error("Vui lòng chọn 1 phương án biểu quyết trước khi gửi!");
      return;
    }
    if (!voterName.trim()) {
      toast.error("Vui lòng nhập Họ tên của Quý Doanh nhân!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchNestApi<any>(`/voting/public-polls/${poll.id}/vote`, {
        method: "POST",
        body: JSON.stringify({
          optionId: selectedOptionId,
          voterName: voterName.trim(),
          voterEmail: voterEmail.trim().toLowerCase(),
          voterPhone: voterPhone.trim(),
        }),
      });

      if (res && (res.ok || res.success)) {
        setSubmitted(true);
        setResultMessage(res.message || "Ghi nhận kết quả biểu quyết thành công!");
        toast.success("Đã ghi nhận phiếu biểu quyết của bạn thành công!");
      } else {
        toast.error(res?.message || "Không thể gửi kết quả biểu quyết.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi kết nối khi gửi biểu quyết.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 px-4 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-[#001A4D] via-[#003B95] to-[#0A255C] text-white rounded-t-3xl p-6 text-center shadow-lg relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hệ Thống Biểu Quyết Trực Tuyến CEO HN10</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
            CLB DOANH NHÂN CEO HN10 (HANOIBA)
          </h1>
          <p className="text-xs text-blue-100/80 mt-1">
            Lấy ý kiến đại biểu & biểu quyết nghị quyết sự kiện
          </p>
        </div>

        {/* Form Body */}
        <div className="bg-white rounded-b-3xl shadow-xl border border-slate-200/80 p-6 md:p-8 space-y-6">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 mx-auto bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border-2 border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">
                Xác Nhận Thành Công!
              </h2>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                {resultMessage || "Phiếu biểu quyết của Quý Doanh nhân đã được lưu trữ an toàn vào hệ thống quản trị của Ban Điều Hành CLB CEO HN10."}
              </p>
              <div className="pt-4">
                <a
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#003B95] text-white text-sm font-bold shadow-md hover:bg-blue-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Trang Chủ CEO HN10</span>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVoteSubmit} className="space-y-6">
              {/* Question / Title */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#003B95] uppercase tracking-wider">
                  <VoteIcon className="w-4 h-4" />
                  <span>Nội dung biểu quyết:</span>
                </div>
                <h2 className="text-lg font-black text-slate-800 leading-snug">
                  {poll.title}
                </h2>
                {poll.description && (
                  <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-200/60">
                    {poll.description}
                  </p>
                )}
                {poll.eventName && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold pt-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sự kiện: {poll.eventName}</span>
                  </div>
                )}
              </div>

              {isClosed ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center text-amber-800 text-sm font-bold">
                  ⚠️ Phiên biểu quyết này đã chính thức đóng. Ban Tổ Chức không tiếp nhận thêm kết quả.
                </div>
              ) : (
                <>
                  {/* Options List */}
                  <div className="space-y-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Chọn phương án biểu quyết của bạn (*):
                    </label>
                    <div className="space-y-2.5">
                      {options.map((opt: any) => {
                        const isSelected = selectedOptionId === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => setSelectedOptionId(opt.id)}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? "border-[#003B95] bg-blue-50/60 shadow-sm ring-1 ring-blue-500"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                                  isSelected
                                    ? "border-[#003B95] bg-[#003B95]"
                                    : "border-slate-400 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                              </div>
                              <span
                                className={`text-sm font-bold ${
                                  isSelected ? "text-[#003B95]" : "text-slate-800"
                                }`}
                              >
                                {opt.title}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Voter Information */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Thông tin cử tri / đại biểu biểu quyết:
                    </label>
                    <div className="space-y-3">
                      <div>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={voterName}
                            onChange={(e) => setVoterName(e.target.value)}
                            placeholder="Họ và tên của bạn (*)"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#003B95]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                          <input
                            type="email"
                            value={voterEmail}
                            onChange={(e) => setVoterEmail(e.target.value)}
                            placeholder="Email nhận xác nhận"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#003B95]"
                          />
                        </div>
                        <div className="relative">
                          <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                          <input
                            type="tel"
                            value={voterPhone}
                            onChange={(e) => setVoterPhone(e.target.value)}
                            placeholder="Số điện thoại"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#003B95]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting || !selectedOptionId}
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#003B95] hover:bg-[#002870] disabled:opacity-50 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      {submitting ? (
                        <span>Đang gửi kết quả biểu quyết...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Xác Nhận Gửi Kết Quả Biểu Quyết</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-slate-400 text-center mt-2.5">
                      ✓ Kết quả biểu quyết được lưu trữ minh bạch và đối soát thời gian thực.
                    </p>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
