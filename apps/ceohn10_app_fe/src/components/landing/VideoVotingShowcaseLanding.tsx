import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Vote,
  BarChart3,
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Mail,
  X,
  Trophy,
  RefreshCw,
  ExternalLink,
  Sliders,
  Maximize2,
  ArrowUpRight,
} from "lucide-react";
import type { LandingWebConfig, LandingSlide, LandingVoteOption } from "./TimedCardsOpeningLanding";
import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";
import { getQrUrl } from "@/lib/qr";
import { toast } from "sonner";

export const DEFAULT_VIDEO_VOTING_7_SLIDES: LandingSlide[] = [
  {
    id: "vslide-1",
    place: "01 · STRATEGIC VISION",
    title1: "KHỞI NGUỒN",
    title2: "THỊNH VƯỢNG",
    description:
      "Hành trình kiến tạo hệ sinh thái doanh nhân CEO HN10 tiên phong đổi mới, số hóa quản trị và mở rộng liên minh thương mại đa ngành trên toàn quốc.",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=85",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4",
    votingQuestion: "Định hướng Chiến lược & Tầm nhìn ở Video Màn 01?",
    votingOptions: [
      { id: "opt-1-1", label: "Đột phá & Truyền cảm hứng", description: "Tầm nhìn sắc bén, dẫn dắt xu thế" },
      { id: "opt-1-2", label: "Thực tiễn & Bám sát doanh nghiệp", description: "Dễ dàng áp dụng vào vận hành" },
      { id: "opt-1-3", label: "Sáng tạo & Khác biệt vượt trội", description: "Tạo dấu ấn thương hiệu độc bản" },
    ],
    ctaText: "Bình Chọn Video 01",
    ctaLink: "#vote",
  },
  {
    id: "vslide-2",
    place: "02 · AI & DIGITAL TRANSFORMATION",
    title1: "CÔNG NGHỆ",
    title2: "TIÊN PHONG",
    description:
      "Ứng dụng Trí tuệ nhân tạo (AI), Big Data và nền tảng quản trị thông minh giúp các doanh nghiệp thành viên tối ưu 40% hiệu suất vận hành.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-blue-circuits-99-large.mp4",
    votingQuestion: "Giải pháp công nghệ nào trong Video Màn 02 ấn tượng nhất?",
    votingOptions: [
      { id: "opt-2-1", label: "Hệ sinh thái AI & Tự động hóa", description: "Tối ưu nhân sự và tốc độ xử lý" },
      { id: "opt-2-2", label: "Web CRM & App Mobile CEO HN10", description: "Kết nối dữ liệu xuyên suốt 24/7" },
      { id: "opt-2-3", label: "Báo cáo Tài chính & Dữ liệu Realtime", description: "Minh bạch và chính xác tuyệt đối" },
    ],
    ctaText: "Bình Chọn Video 02",
    ctaLink: "#vote",
  },
  {
    id: "vslide-3",
    place: "03 · B2B COMMERCE ALLIANCE",
    title1: "KẾT NỐI",
    title2: "ĐỈNH CAO",
    description:
      "Thúc đẩy các thương vụ B2B Matching trăm tỷ nội khối, nơi chữ Tín và tình đồng niên trở thành bảo chứng vững chắc nhất cho mọi hợp đồng.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=85",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-business-people-shaking-hands-in-an-office-4822-large.mp4",
    votingQuestion: "Giá trị kết nối giao thương nào ở Video Màn 03 bạn tâm đắc nhất?",
    votingOptions: [
      { id: "opt-3-1", label: "Sàn B2B & Đặc quyền nội khối", description: "Ưu đãi chéo 15-30% giữa các học viên" },
      { id: "opt-3-2", label: "Business Matching 1-on-1", description: "Gặp gỡ trực tiếp chủ doanh nghiệp" },
      { id: "opt-3-3", label: "Liên minh đấu thầu liên ngành", description: "Cùng thực hiện các dự án quy mô lớn" },
    ],
    ctaText: "Bình Chọn Video 03",
    ctaLink: "#vote",
  },
  {
    id: "vslide-4",
    place: "04 · EXECUTIVE LEADERSHIP",
    title1: "TRÍ TUỆ",
    title2: "BẢN LĨNH",
    description:
      "Chương trình 30 chuyên đề đào tạo CEO chuyên sâu cùng các chuyên gia đầu ngành, kết hợp thăm quan thực tế doanh nghiệp (Company Tour).",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=85",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-people-working-in-a-modern-office-4347-large.mp4",
    votingQuestion: "Hoạt động đào tạo nào trong Video Màn 04 mang lại giá trị cao nhất?",
    votingOptions: [
      { id: "opt-4-1", label: "Quản trị chiến lược & Tài chính", description: "Nâng tầm tư duy điều hành vĩ mô" },
      { id: "opt-4-2", label: "CEO Talk & Bài học thực chiến", description: "Kinh nghiệm xương máu từ thương trường" },
      { id: "opt-4-3", label: "Business Tour thăm quan nhà máy", description: "Học hỏi mô hình vận hành trực tiếp" },
    ],
    ctaText: "Bình Chọn Video 04",
    ctaLink: "#vote",
  },
  {
    id: "vslide-5",
    place: "05 · ENTREPRENEURIAL CULTURE",
    title1: "GẮN KẾT",
    title2: "TÌNH THÂN",
    description:
      "Những khoảnh khắc sẻ chia ấm áp trong các kỳ Gala, sinh nhật tháng, giải Golf và hoạt động thể thao gắn kết đại gia đình CEO HN10.",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1600&q=85",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-friends-toasting-with-champagne-at-a-party-4636-large.mp4",
    votingQuestion: "Cảm xúc của bạn khi xem Video Màn 05 — Văn hóa Gắn kết?",
    votingOptions: [
      { id: "opt-5-1", label: "Ấm áp, chân thành như gia đình", description: "Văn hóa sẻ chia không khoảng cách" },
      { id: "opt-5-2", label: "Sôi động, đẳng cấp & Năng lượng", description: "Các sự kiện Gala & thể thao rực rỡ" },
      { id: "opt-5-3", label: "Tự hào là mảnh ghép CEO HN10", description: "Tinh thần đồng đội gắn bó bền chặt" },
    ],
    ctaText: "Bình Chọn Video 05",
    ctaLink: "#vote",
  },
  {
    id: "vslide-6",
    place: "06 · SOCIAL IMPACT & CSR",
    title1: "LAN TỎA",
    title2: "NHÂN VĂN",
    description:
      "Kinh doanh gắn liền với phụng sự xã hội: Xây trường vùng cao, trao học bổng khuyến học và đồng hành cùng những hoàn cảnh khó khăn.",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1600&q=85",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-sunrise-over-the-mountains-4100-large.mp4",
    votingQuestion: "Dự án cộng đồng nào trong Video Màn 06 chạm đến trái tim bạn nhất?",
    votingOptions: [
      { id: "opt-6-1", label: "Điểm trường vùng cao & Áo ấm", description: "Ươm mầm tri thức cho trẻ em nghèo" },
      { id: "opt-6-2", label: "Quỹ học bổng & Khởi nghiệp trẻ", description: "Tiếp sức thế hệ kế cận vững vàng" },
      { id: "opt-6-3", label: "Cứu trợ khẩn cấp & Nhà tình nghĩa", description: "Lá lành đùm lá rách kịp thời" },
    ],
    ctaText: "Bình Chọn Video 06",
    ctaLink: "#vote",
  },
  {
    id: "vslide-7",
    place: "07 · GLOBAL EXPANSION",
    title1: "VƯƠN RA",
    title2: "BIỂN LỚN",
    description:
      "Đưa thương hiệu doanh nghiệp CEO HN10 vươn tầm khu vực và thế giới, chinh phục những đỉnh cao mới trong kỷ nguyên kinh tế số toàn cầu.",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=85",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-flying-through-clouds-in-the-sky-4164-large.mp4",
    votingQuestion: "Bạn kỳ vọng bước tiến nào nhất ở Video Màn 07 — Vươn tầm quốc tế?",
    votingOptions: [
      { id: "opt-7-1", label: "Xuất khẩu & Thương mại xuyên biên giới", description: "Đưa sản phẩm Việt ra thế giới" },
      { id: "opt-7-2", label: "Gọi vốn & M&A quỹ đầu tư quốc tế", description: "Nâng cao năng lực tài chính toàn cầu" },
      { id: "opt-7-3", label: "Mạng lưới CEO kiều bào & Quốc tế", description: "Mở rộng biên giới hợp tác chiến lược" },
    ],
    ctaText: "Bình Chọn Video 07",
    ctaLink: "#vote",
  },
];

interface VideoVotingShowcaseLandingProps {
  config: LandingWebConfig;
  previewMode?: boolean;
  onClosePreview?: () => void;
  onEditConfig?: () => void;
}

export function VideoVotingShowcaseLanding({
  config,
  previewMode = false,
  onClosePreview,
  onEditConfig,
}: VideoVotingShowcaseLandingProps) {
  const slides: LandingSlide[] = useMemo(() => {
    const raw = Array.isArray(config.slides) && config.slides.length > 0 ? config.slides : DEFAULT_VIDEO_VOTING_7_SLIDES;
    const list: LandingSlide[] = [];
    for (let i = 0; i < 7; i++) {
      const item = raw[i] || DEFAULT_VIDEO_VOTING_7_SLIDES[i];
      list.push({
        ...DEFAULT_VIDEO_VOTING_7_SLIDES[i],
        ...item,
        id: item.id || `vslide-${i + 1}`,
        votingOptions:
          Array.isArray(item.votingOptions) && item.votingOptions.length > 0
            ? item.votingOptions
            : DEFAULT_VIDEO_VOTING_7_SLIDES[i].votingOptions,
      });
    }
    return list;
  }, [config.slides]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [selectedOptionBySlide, setSelectedOptionBySlide] = useState<Record<string, string>>({});
  const [voterModalOpen, setVoterModalOpen] = useState<boolean>(false);
  const [pendingVote, setPendingVote] = useState<{ slide: LandingSlide; option: LandingVoteOption } | null>(null);
  const [voterName, setVoterName] = useState<string>("");
  const [voterEmail, setVoterEmail] = useState<string>("");
  const [submittingVote, setSubmittingVote] = useState<boolean>(false);
  const [hasVotedEmail, setHasVotedEmail] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`voted_landing_${config.slug || "video-voting"}`);
    }
    return null;
  });

  const [activeScreen, setActiveScreen] = useState<"video" | "voting">("video");
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [voteStats, setVoteStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  const [countdownText, setCountdownText] = useState<string>("LIVE VOTING");
  const [isVotingWindowActive, setIsVotingWindowActive] = useState<boolean>(true);

  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const currentSlide = slides[currentIndex] || slides[0];
  const primaryColor = config.theme?.primaryColor || "#E5B84B";
  const appliedEventTitle =
    (config as any).eventName ||
    (config as any).eventTitle ||
    config.name ||
    config.brand?.logoText ||
    "SỰ KIỆN CEO HN10";
  const slugOrId = config.slug || config.id || "video-voting";

  const publicUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/landing/${config.slug || "video-voting"}`;
    }
    return `https://crm.ceohn10.viconnect.vn/landing/${config.slug || "video-voting"}`;
  }, [config.slug]);

  const fetchRealtimeStats = async () => {
    try {
      const res = await fetchNestApi<any>(`/public/landing-webs/${encodeURIComponent(slugOrId)}/vote-stats`);
      if (res) setVoteStats(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void fetchRealtimeStats();
    const timer = setInterval(() => {
      void fetchRealtimeStats();
    }, 4000);
    return () => clearInterval(timer);
  }, [slugOrId]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const startMs = config.votingStartAt ? new Date(config.votingStartAt).getTime() : null;
      const endMs = config.votingEndAt ? new Date(config.votingEndAt).getTime() : null;

      if (startMs && !isNaN(startMs) && now < startMs) {
        const diff = Math.max(0, Math.floor((startMs - now) / 1000));
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setCountdownText(`OPENS IN ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        setIsVotingWindowActive(false);
        return;
      }

      if (endMs && !isNaN(endMs)) {
        if (now > endMs) {
          setCountdownText("VOTING CLOSED");
          setIsVotingWindowActive(false);
          return;
        }
        const diff = Math.max(0, Math.floor((endMs - now) / 1000));
        const d = Math.floor(diff / 86400);
        const h = Math.floor((diff % 86400) / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setCountdownText(
          d > 0
            ? `${d}D ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
            : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        );
        setIsVotingWindowActive(true);
        return;
      }

      setCountdownText("LIVE VOTING OPEN");
      setIsVotingWindowActive(true);
    };

    updateCountdown();
    const t = setInterval(updateCountdown, 1000);
    return () => clearInterval(t);
  }, [config.votingStartAt, config.votingEndAt]);

  useEffect(() => {
    setVideoProgress(0);
    if (activeVideoRef.current) {
      activeVideoRef.current.load();
      activeVideoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentIndex, currentSlide.videoUrl]);

  // Keyboard Left / Right navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (voterModalOpen || showStatsModal || showQrModal) return;
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length, voterModalOpen, showStatsModal, showQrModal]);

  const handlePrevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) handleNextSlide();
      else handlePrevSlide();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleChooseOption = (slide: LandingSlide, option: LandingVoteOption) => {
    if (!isVotingWindowActive) {
      toast.warning(countdownText);
      return;
    }
    if (hasVotedEmail) {
      toast.info(`Bạn đã bình chọn bằng email ${hasVotedEmail}. Mỗi người chỉ được bình chọn 1 lần duy nhất!`);
      setShowStatsModal(true);
      return;
    }
    setSelectedOptionBySlide((prev) => ({ ...prev, [slide.id]: option.id }));
    setPendingVote({ slide, option });
    setVoterModalOpen(true);
  };

  const handleConfirmVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingVote) return;
    if (!voterName.trim() || !voterEmail.trim()) {
      toast.error("Vui lòng điền đầy đủ Họ tên và Email để lưu kết quả bình chọn!");
      return;
    }
    setSubmittingVote(true);
    try {
      const res = await fetchNestApi<any>(`/public/landing-webs/${encodeURIComponent(slugOrId)}/vote`, {
        method: "POST",
        body: JSON.stringify({
          slideId: pendingVote.slide.id,
          optionId: pendingVote.option.id,
          voterName: voterName.trim(),
          voterEmail: voterEmail.trim().toLowerCase(),
        }),
      });
      toast.success(res?.message || "Đã ghi nhận bình chọn thành công!");
      if (res?.stats) setVoteStats(res.stats);
      const cleanEmail = voterEmail.trim().toLowerCase();
      setHasVotedEmail(cleanEmail);
      try {
        localStorage.setItem(`voted_landing_${config.slug || "video-voting"}`, cleanEmail);
      } catch {}
      setVoterModalOpen(false);
      setShowStatsModal(true);
    } catch (err: any) {
      toast.error(err?.message || "Không thể ghi nhận bình chọn. Mỗi người chỉ được vote 1 lần duy nhất!");
    } finally {
      setSubmittingVote(false);
    }
  };

  const currentSlideStat = useMemo(() => {
    if (!voteStats?.slideStats) return null;
    return voteStats.slideStats.find((s: any) => s.slideId === currentSlide.id) || null;
  }, [voteStats, currentSlide.id]);

  // Tính toán khoảng cách vòng tròn cho 7 slide trượt ngang 3D
  const getRelativeOffset = (idx: number) => {
    const total = slides.length;
    let diff = idx - currentIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  const renderSlideVoteCard = (slide: LandingSlide, sIdx: number) => {
    const st =
      (voteStats?.slideStats || []).find((x: any) => x.slideId === slide.id) || {
        slideId: slide.id,
        slideNumber: sIdx + 1,
        title: `${slide.title1 || ""} ${slide.title2 || ""}`.trim() || `Video 0${sIdx + 1}`,
        totalVotes: 0,
        options: (slide.votingOptions || []).map((o) => ({
          id: o.id,
          label: o.label,
          count: 0,
          percentage: 0,
        })),
      };

    return (
      <div key={slide.id} className="pin-glass-card rounded-3xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2 pb-1">
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-700">
              VIDEO 0{sIdx + 1} · {[slide.title1, slide.title2].filter(Boolean).join(" ")}
            </span>
            <h3 className="text-sm font-extrabold text-[#0B0D12] truncate mt-0.5">
              {slide.votingQuestion || st.title}
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#0B0D12] text-white text-xs font-mono font-bold shrink-0">
            {st.totalVotes ?? 0} phiếu
          </span>
        </div>

        <div className="space-y-2.5">
          {(slide.votingOptions || []).map((opt) => {
            const optStat = (st.options || []).find((o: any) => o.id === opt.id);
            const count = optStat?.count ?? 0;
            const pct = optStat?.percentage ?? 0;
            const isSelected = selectedOptionBySlide[slide.id] === opt.id;
            const optionVoters = (voteStats?.recentVoters || []).filter(
              (v: any) => v.slideId === slide.id && v.optionId === opt.id,
            );

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleChooseOption(slide, opt)}
                className={`pin-vote-card w-full rounded-2xl p-3 text-left space-y-2 cursor-pointer ${
                  isSelected ? "ring-2 ring-[#0B0D12]" : ""
                }`}
              >
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="font-bold text-[#0B0D12]">{opt.label}</span>
                  <span className="font-mono font-extrabold text-blue-700 shrink-0 tabular-nums transition-all duration-500">
                    {pct}% ({count})
                  </span>
                </div>

                <div className="relative w-full min-h-[30px] rounded-xl bg-slate-100/90 border border-slate-200/80 overflow-hidden p-1.5 flex flex-wrap items-center gap-1.5">
                  <div
                    className="absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ease-out pointer-events-none"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      background: "linear-gradient(90deg, rgba(59,130,246,0.22) 0%, rgba(14,165,233,0.14) 100%)",
                    }}
                  />
                  {optionVoters.length > 0 ? (
                    optionVoters.slice(0, 10).map((voter: any, vIdx: number) => (
                      <span
                        key={voter.id || vIdx}
                        style={{ animationDelay: `${vIdx * 60}ms` }}
                        className="voter-chip-enter relative z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0B0D12] text-white text-[10px] font-semibold shadow-xs"
                      >
                        <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="max-w-[120px] truncate">{voter.voterName}</span>
                      </span>
                    ))
                  ) : (
                    <span className="relative z-10 text-[10px] text-[#8A919E] px-1">
                      Chạm để bình chọn phương án này
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative w-full min-h-screen bg-[#FFFFFF] text-[#0B0D12] overflow-y-auto overflow-x-hidden flex flex-col justify-between"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        touchAction: "pan-y",
      }}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Syne:wght@700;800&family=JetBrains+Mono:wght@500;700&display=swap");

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.16; transform: scale(1.04); }
          50% { opacity: 0.24; transform: scale(1.1); }
        }
        @keyframes waterRipple {
          0% { transform: scale(0.92); opacity: 0.7; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        .pin-glass-pill {
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(205, 222, 240, 0.7);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.98), 0 8px 24px -6px rgba(15, 23, 42, 0.08);
        }
        .pin-glass-card {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgba(205, 222, 240, 0.72);
          box-shadow: inset 0 1.5px 1px rgba(255, 255, 255, 0.98), 0 20px 48px -12px rgba(15, 23, 42, 0.08);
        }
        .pin-vote-card {
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(205, 222, 240, 0.75);
          box-shadow: 0 6px 18px -4px rgba(15, 23, 42, 0.05);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pin-vote-card:hover {
          background: rgba(255, 255, 255, 0.96);
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -6px rgba(15, 23, 42, 0.1);
        }
        .pin-vote-card:active {
          transform: scale(0.98);
        }
        @keyframes voterFlyIntoBar {
          0% {
            opacity: 0;
            transform: translate3d(38px, 8px, 0) scale(0.75);
            filter: blur(4px);
          }
          65% {
            opacity: 1;
            transform: translate3d(-4px, -1px, 0) scale(1.06);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }
        .voter-chip-enter {
          animation: voterFlyIntoBar 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* LIGHT THEME CAUSTIC BACKDROP */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 18% 20%, rgba(110, 215, 255, 0.22) 0%, transparent 44%),
              radial-gradient(circle at 82% 30%, rgba(190, 175, 255, 0.20) 0%, transparent 46%),
              radial-gradient(circle at 50% 85%, rgba(130, 245, 210, 0.18) 0%, transparent 46%)
            `,
          }}
        />
      </div>

      {/* PREVIEW MODE FLOATING HUD (Tối giản) */}
      {previewMode && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full pin-glass-pill flex items-center gap-2 text-[#0B0D12]">
          <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Preview</span>
          {onEditConfig && (
            <button
              type="button"
              onClick={onEditConfig}
              className="px-3 py-1 rounded-full bg-[#0B0D12] text-white hover:bg-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
            >
              <Sliders className="size-3" />
              <span>Chỉnh sửa</span>
            </button>
          )}
          {onClosePreview && (
            <button
              type="button"
              onClick={onClosePreview}
              className="size-6 rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white text-[#0B0D12] grid place-items-center cursor-pointer transition"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      )}

      {/* MINIMALIST LIGHT HEADER: CÂN ĐỐI CHỈ HIỆN LOGO HN10 + TIÊU ĐỀ NGẮN + CHUYỂN MÀN VIDEO / VOTING */}
      <header
        className={`relative z-30 w-full max-w-[1440px] mx-auto px-4 sm:px-10 ${
          previewMode ? "pt-14" : "pt-4 sm:pt-6"
        } pb-3 flex flex-wrap items-center justify-between gap-3`}
      >
        {/* Left: Logo HN10 + Active Video Title */}
        <div className="flex items-center gap-3 min-w-0 max-w-full sm:max-w-[36%]">
          <div className="h-9 px-3 rounded-full pin-glass-pill inline-flex items-center justify-center shrink-0">
            <span
              className="text-xs font-black tracking-tight text-[#0B0D12] leading-none"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              HN10
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-extrabold tracking-tight text-[#0B0D12] truncate leading-snug">
              {activeScreen === "video"
                ? [currentSlide.title1, currentSlide.title2].filter(Boolean).join(" ") || `Video 0${currentIndex + 1}`
                : "Voting & Biểu Đồ Bình Chọn"}
            </div>
          </div>
        </div>

        {/* Center: Screen Switcher (Video vs Voting & Biểu đồ) + 01..07 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-full pin-glass-pill">
            <button
              type="button"
              onClick={() => setActiveScreen("video")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeScreen === "video"
                  ? "bg-[#0B0D12] text-white shadow-sm"
                  : "text-[#525866] hover:text-[#0B0D12]"
              }`}
            >
              Video (0{currentIndex + 1}/0{slides.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveScreen("voting");
                setLoadingStats(true);
                fetchRealtimeStats().finally(() => setLoadingStats(false));
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeScreen === "voting"
                  ? "bg-[#0B0D12] text-white shadow-sm"
                  : "text-[#525866] hover:text-[#0B0D12]"
              }`}
            >
              <BarChart3 className="size-3.5" />
              <span>Voting &amp; Biểu đồ ({voteStats?.totalVoters ?? 0})</span>
            </button>
          </div>

          {activeScreen === "video" && (
            <div className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-full pin-glass-pill">
              {slides.map((s, idx) => {
                const active = idx === currentIndex;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative px-2.5 py-1 rounded-full text-[11px] font-mono transition-all duration-300 cursor-pointer ${
                      active
                        ? "bg-[#0B0D12] text-white font-bold shadow-sm"
                        : "text-[#525866] hover:text-[#0B0D12] hover:bg-slate-100"
                    }`}
                  >
                    0{idx + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Countdown + QR */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 pin-glass-pill ${
              isVotingWindowActive ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                isVotingWindowActive ? "bg-emerald-500 animate-ping" : "bg-rose-500"
              }`}
            />
            <span className="truncate max-w-[120px] sm:max-w-none">{countdownText}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#0B0D12] text-white hover:bg-slate-800 text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
          >
            <QrCode className="size-3.5" />
            <span>QR</span>
          </button>
        </div>
      </header>

      {/* MÀN 1: VIDEO SHOWCASE (KHÔNG LẪN MÀN VOTING) | MÀN 2: VOTING & BIỂU ĐỒ RIÊNG BIỆT (THEME SÁNG) */}
      {activeScreen === "video" ? (
        <>
          <main className="relative z-20 flex-1 w-full flex flex-col justify-start py-2 sm:py-4 space-y-5">
            {/* 1. CAROUSEL VIEWPORT FULL WIDTH (SWIPEABLE HORIZONTALLY, SCROLLABLE VERTICALLY) */}
            <div
              className="relative w-full h-[260px] sm:h-[460px] lg:h-[560px] flex items-center justify-center overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
          {slides.map((slide, idx) => {
            const offset = getRelativeOffset(idx);
            const isCenter = offset === 0;
            const isLeft = offset === -1;
            const isRight = offset === 1;
            const isFarLeft = offset === -2;
            const isFarRight = offset === 2;
            const isVisible = Math.abs(offset) <= 2;

            if (!isVisible) return null;

            let transformStyle = "translate3d(0%, 0, 0) scale(1)";
            let zIndex = 30;
            let opacity = 1;

            if (isLeft) {
              transformStyle = "translate3d(-74%, 0, -120px) rotateY(14deg) scale(0.82)";
              zIndex = 20;
              opacity = 0.42;
            } else if (isRight) {
              transformStyle = "translate3d(74%, 0, -120px) rotateY(-14deg) scale(0.82)";
              zIndex = 20;
              opacity = 0.42;
            } else if (isFarLeft) {
              transformStyle = "translate3d(-125%, 0, -240px) rotateY(22deg) scale(0.66)";
              zIndex = 10;
              opacity = 0.14;
            } else if (isFarRight) {
              transformStyle = "translate3d(125%, 0, -240px) rotateY(-22deg) scale(0.66)";
              zIndex = 10;
              opacity = 0.14;
            }

            return (
              <div
                key={slide.id}
                onClick={() => {
                  if (!isCenter) setCurrentIndex(idx);
                }}
                className={`absolute w-full h-full overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isCenter
                    ? "shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
                    : "cursor-pointer hover:opacity-70 rounded-2xl"
                }`}
                style={{
                  transform: transformStyle,
                  zIndex,
                  opacity,
                }}
              >
                {/* Pure Video or Cover (Zero Text Overlay on Video) */}
                {isCenter && slide.videoUrl ? (
                  <video
                    ref={activeVideoRef}
                    key={slide.videoUrl}
                    src={resolveMediaUrl(slide.videoUrl) || slide.videoUrl}
                    poster={resolveMediaUrl(slide.image) || slide.image}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    onTimeUpdate={(e) => {
                      const el = e.currentTarget;
                      if (el.duration > 0) {
                        setVideoProgress((el.currentTime / el.duration) * 100);
                      }
                    }}
                    className="absolute inset-0 w-full h-full object-cover scale-[1.01]"
                  />
                ) : (
                  <img
                    src={resolveMediaUrl(slide.image) || slide.image}
                    alt={`Video 0${idx + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Top-Right Minimal Audio & Play Icon Controls Only (Zero Text) */}
                {isCenter && (
                  <div className="relative z-10 p-3 sm:p-6 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!activeVideoRef.current) return;
                        if (activeVideoRef.current.paused) {
                          activeVideoRef.current.play();
                          setIsPlaying(true);
                        } else {
                          activeVideoRef.current.pause();
                          setIsPlaying(false);
                        }
                      }}
                      className="size-8 sm:size-10 rounded-full pin-glass-pill hover:bg-white/20 text-white grid place-items-center cursor-pointer transition active:scale-90"
                      title={isPlaying ? "Tạm dừng" : "Phát video"}
                    >
                      {isPlaying ? <Pause className="size-3.5 sm:size-4" /> : <Play className="size-3.5 sm:size-4 fill-white" />}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextMute = !isMuted;
                        setIsMuted(nextMute);
                        if (activeVideoRef.current) activeVideoRef.current.muted = nextMute;
                      }}
                      className="size-8 sm:size-10 rounded-full pin-glass-pill hover:bg-white/20 text-white grid place-items-center cursor-pointer transition active:scale-90"
                      title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                    >
                      {isMuted ? (
                        <VolumeX className="size-3.5 sm:size-4 text-white/80" />
                      ) : (
                        <Volume2 className="size-3.5 sm:size-4 text-emerald-400" />
                      )}
                    </button>
                  </div>
                )}

                {/* Sleek Cinema Video Progress Line at Very Bottom */}
                {isCenter && (
                  <div className="absolute inset-x-4 sm:inset-x-8 bottom-3 sm:bottom-5 z-10 h-[2px] bg-white/20 rounded-full overflow-hidden pointer-events-none">
                    <div
                      className="h-full transition-all duration-200 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(4, videoProgress))}%`,
                        backgroundColor: primaryColor,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Floating Glass Prev / Next Carousel Controls */}
          <button
            type="button"
            onClick={handlePrevSlide}
            className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 z-40 size-9 sm:size-12 rounded-full pin-glass-pill hover:bg-white hover:text-black text-white grid place-items-center transition-all duration-300 cursor-pointer active:scale-90 shadow-2xl"
            title="Màn trước (Arrow Left)"
          >
            <ChevronLeft className="size-4 sm:size-5" />
          </button>
          <button
            type="button"
            onClick={handleNextSlide}
            className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 z-40 size-9 sm:size-12 rounded-full pin-glass-pill hover:bg-white hover:text-black text-white grid place-items-center transition-all duration-300 cursor-pointer active:scale-90 shadow-2xl"
            title="Màn kế tiếp (Arrow Right)"
          >
            <ChevronRight className="size-4 sm:size-5" />
          </button>
        </div>

        {/* 2. VOTING NGAY BÊN DƯỚI VIDEO ĐANG CHẠY */}
        <div className="w-full max-w-[880px] mx-auto px-3 sm:px-4">
          {renderSlideVoteCard(currentSlide, currentIndex)}
        </div>

        {/* 3. NÚT CHUYỂN NHANH SANG MÀN BIỂU ĐỒ TỔNG HỢP 7 VIDEO */}
        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveScreen("voting");
              setLoadingStats(true);
              fetchRealtimeStats().finally(() => setLoadingStats(false));
            }}
            className="px-6 py-2.5 rounded-full bg-[#0B0D12] text-white hover:bg-slate-800 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg cursor-pointer transition active:scale-95"
          >
            <BarChart3 className="size-4" />
            <span>Xem Biểu Đồ Tổng Hợp 7 Video</span>
            <ArrowUpRight className="size-4" />
          </button>
        </div>
      </main>

      {/* BOTTOM LEFT (VIDEO ĐÃ XUẤT HIỆN) & BOTTOM RIGHT (VIDEO CHƯA XUẤT HIỆN) — VUỐT NGANG ĐỂ CHỌN */}
      <footer
        className="relative z-20 w-full max-w-[1440px] mx-auto px-3 sm:px-8 pb-5 pt-2 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Góc dưới bên trái: Các video đã xuất hiện */}
        <div className="flex flex-col gap-1 min-w-0 sm:max-w-[46%]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#525866] px-1">
            Đã xuất hiện ({currentIndex})
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {slides.slice(0, currentIndex).length === 0 ? (
              <span className="text-[11px] text-[#8A919E] px-2 py-1 rounded-xl pin-glass-pill">
                Đang ở video đầu tiên
              </span>
            ) : (
              slides.slice(0, currentIndex).map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className="group relative w-20 h-12 sm:w-24 sm:h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:scale-105 transition cursor-pointer shrink-0 bg-slate-900"
                  title={[s.title1, s.title2].filter(Boolean).join(" ")}
                >
                  <img
                    src={resolveMediaUrl(s.image) || s.image}
                    alt={`0${idx + 1}`}
                    className="w-full h-full object-cover opacity-85 group-hover:opacity-100"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono font-bold">
                    0{idx + 1}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Góc dưới bên phải: Các video chưa xuất hiện */}
        <div className="flex flex-col sm:items-end gap-1 min-w-0 sm:max-w-[46%]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#525866] px-1">
            Tiếp theo ({slides.length - 1 - currentIndex})
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {slides.slice(currentIndex + 1).length === 0 ? (
              <span className="text-[11px] text-[#8A919E] px-2 py-1 rounded-xl pin-glass-pill">
                Đã hết danh sách video
              </span>
            ) : (
              slides.slice(currentIndex + 1).map((s, offsetIdx) => {
                const realIdx = currentIndex + 1 + offsetIdx;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentIndex(realIdx)}
                    className="group relative w-20 h-12 sm:w-24 sm:h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:scale-105 transition cursor-pointer shrink-0 bg-slate-900"
                    title={[s.title1, s.title2].filter(Boolean).join(" ")}
                  >
                    <img
                      src={resolveMediaUrl(s.image) || s.image}
                      alt={`0${realIdx + 1}`}
                      className="w-full h-full object-cover opacity-85 group-hover:opacity-100"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono font-bold">
                      0{realIdx + 1}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </footer>
        </>
      ) : (
        /* MÀN 2: MÀN VOTING & BIỂU ĐỒ RIÊNG BIỆT (KHÔNG CÓ VIDEO, THEME SÁNG) */
        <main className="relative z-20 flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-8 py-4 sm:py-6 space-y-5">
          <div className="pin-glass-card rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-xl font-extrabold text-[#0B0D12] tracking-tight">
                Bình Chọn &amp; Biểu Đồ Thống Kê Realtime (7 Video)
              </h2>
              <p className="text-xs text-[#525866] mt-0.5">
                Chọn phương án bên dưới để bình chọn · Tên người bình chọn sẽ hiển thị trực tiếp vào lựa chọn trong biểu đồ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-800 text-xs font-mono font-bold">
                Tổng phiếu: {voteStats?.totalVoters ?? 0}
              </span>
              <button
                type="button"
                onClick={() => {
                  setLoadingStats(true);
                  fetchRealtimeStats().finally(() => setLoadingStats(false));
                }}
                className="px-3.5 py-1.5 rounded-full pin-glass-pill text-[#0B0D12] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${loadingStats ? "animate-spin" : ""}`} />
                <span>Làm mới</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetchNestApi<any>(`/public/landing-webs/${encodeURIComponent(slugOrId)}/export-voting-pdf`, {
                      method: "POST",
                    });
                    if (res?.ok) {
                      toast.success("Đã lưu file PDF kết quả Voting vào thư mục Sự kiện trong Quản lý Tài liệu!");
                    }
                  } catch (err: any) {
                    toast.error("Không thể xuất PDF: " + (err?.message || ""));
                  }
                }}
                className="px-3.5 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Lưu PDF về Tài liệu Sự kiện</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScreen("video")}
                className="px-3.5 py-1.5 rounded-full bg-[#0B0D12] text-white text-xs font-bold cursor-pointer"
              >
                ← Xem Video
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slides.slice(0, 7).map((slide, sIdx) => renderSlideVoteCard(slide, sIdx))}
          </div>
        </main>
      )}

      {/* MODAL ĐIỀN TÊN & EMAIL ĐỊNH DANH 1 LƯỢT VOTE DUY NHẤT (BORDERLESS) */}
      {voterModalOpen && pendingVote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl grid place-items-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[32px] pin-glass-card p-6 sm:p-8 space-y-5 text-white">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <div
                  className="size-10 rounded-2xl text-black grid place-items-center font-black shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Vote className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                    Xác Nhận Phiếu Bình Chọn
                  </h3>
                  <p className="text-[11px] text-white/60">
                    Định danh Email · Mỗi người bình chọn 01 lần duy nhất
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVoterModalOpen(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.06] space-y-1.5 text-xs">
              <div className="text-white/55 flex items-center justify-between">
                <span>Màn video:</span>
                <strong className="text-white font-mono">
                  {pendingVote.slide.title1} {pendingVote.slide.title2}
                </strong>
              </div>
              <div className="text-white/55 flex items-center justify-between gap-2">
                <span className="shrink-0">Lựa chọn:</span>
                <strong className="text-right" style={{ color: primaryColor }}>
                  {pendingVote.option.label}
                </strong>
              </div>
            </div>

            <form onSubmit={handleConfirmVoteSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-white/70 mb-1.5">
                  Họ và tên của bạn *
                </label>
                <div className="relative">
                  <User className="size-4 text-white/40 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    placeholder="Nguyễn Văn A..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.09] text-sm text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.14]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-white/70 mb-1.5">
                  Địa chỉ Email * (Lưu 1 lượt bình chọn duy nhất)
                </label>
                <div className="relative">
                  <Mail className="size-4 text-white/40 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={voterEmail}
                    onChange={(e) => setVoterEmail(e.target.value)}
                    placeholder="ceo@company.vn"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.09] text-sm text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.14]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setVoterModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white/80 cursor-pointer transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingVote}
                  className="flex-1 py-3 rounded-2xl bg-white text-black hover:bg-white/90 font-extrabold text-xs uppercase tracking-wider shadow-xl cursor-pointer disabled:opacity-50 transition active:scale-95"
                >
                  {submittingVote ? "Đang ghi nhận..." : "Xác Nhận Vote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MÀN THỐNG KÊ VOTING VIDEO REALTIME THEO TỶ LỆ LỰA CHỌN (BORDERLESS & MOBILE RESPONSIVE) */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl grid place-items-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[90vh] rounded-[28px] sm:rounded-[36px] pin-glass-card shadow-2xl flex flex-col overflow-hidden text-white">
            <div className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3 bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <div
                  className="size-10 sm:size-11 rounded-2xl text-black grid place-items-center font-black shadow-lg shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Trophy className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-lg font-extrabold uppercase tracking-wider text-white">
                    Realtime Voting Analytics · 07 Films
                  </h3>
                  <p className="text-[11px] sm:text-xs text-white/60">
                    Cập nhật tỷ lệ theo thời gian thực · Tổng số người bình chọn:{" "}
                    <strong className="text-white font-mono">{voteStats?.totalVoters ?? 0}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoadingStats(true);
                    fetchRealtimeStats().finally(() => setLoadingStats(false));
                  }}
                  className="px-3.5 py-1.5 rounded-full pin-glass-pill hover:bg-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`size-3.5 ${loadingStats ? "animate-spin" : ""}`} />
                  <span>Làm mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className="size-9 rounded-full bg-white/10 hover:bg-rose-600 grid place-items-center cursor-pointer transition"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-7 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slides.slice(0, 7).map((slide, sIdx) => {
                  const st =
                    (voteStats?.slideStats || []).find((x: any) => x.slideId === slide.id) || {
                      slideId: slide.id,
                      slideNumber: sIdx + 1,
                      title: `${slide.title1 || ""} ${slide.title2 || ""}`.trim() || `Video 0${sIdx + 1}`,
                      totalVotes: 0,
                      options: (slide.votingOptions || []).map((o) => ({
                        id: o.id,
                        label: o.label,
                        count: 0,
                        percentage: 0,
                      })),
                    };

                  return (
                    <div
                      key={slide.id}
                      className="p-4 sm:p-5 rounded-3xl bg-white/[0.05] space-y-3.5"
                    >
                      <div className="flex items-center justify-between gap-2 pb-1">
                        <div className="min-w-0">
                          <span
                            className="text-[10px] font-mono font-bold uppercase tracking-widest"
                            style={{ color: primaryColor }}
                          >
                            VIDEO 0{sIdx + 1}
                          </span>
                          <h4 className="text-sm font-extrabold text-white truncate">
                            {slide.votingQuestion || st.title || `Video 0${sIdx + 1}`}
                          </h4>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-mono font-bold shrink-0 transition-all">
                          {st.totalVotes ?? 0} phiếu
                        </span>
                      </div>

                      <div className="space-y-3">
                        {(st.options || []).map((opt: any) => {
                          const optionVoters = (voteStats?.recentVoters || []).filter(
                            (v: any) => v.slideId === slide.id && v.optionId === opt.id,
                          );
                          return (
                            <div key={opt.id} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs gap-2">
                                <span className="font-semibold text-white/90 truncate">{opt.label}</span>
                                <span
                                  className="font-mono font-bold shrink-0 tabular-nums transition-all duration-500"
                                  style={{ color: primaryColor }}
                                >
                                  {opt.percentage ?? 0}% ({opt.count ?? 0})
                                </span>
                              </div>

                              {/* Thanh biểu đồ biến động realtime + tên người vote bay vào lựa chọn */}
                              <div className="relative w-full min-h-[28px] rounded-xl bg-white/[0.08] overflow-hidden p-1 flex flex-wrap items-center gap-1">
                                <div
                                  className="absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ease-out opacity-35 pointer-events-none"
                                  style={{
                                    width: `${Math.min(100, opt.percentage ?? 0)}%`,
                                    backgroundColor: primaryColor,
                                  }}
                                />
                                {optionVoters.length > 0 ? (
                                  optionVoters.slice(0, 8).map((voter: any, vIdx: number) => (
                                    <span
                                      key={voter.id || vIdx}
                                      style={{ animationDelay: `${vIdx * 60}ms` }}
                                      className="voter-chip-enter relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-semibold shadow-sm"
                                    >
                                      <span
                                        className="size-1.5 rounded-full shrink-0"
                                        style={{ backgroundColor: primaryColor }}
                                      />
                                      <span className="max-w-[110px] truncate">{voter.voterName}</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="relative z-10 text-[10px] text-white/35 px-1.5">
                                    0 lượt chọn
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {Array.isArray(voteStats?.recentVoters) && voteStats.recentVoters.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white/60">
                    Danh Sách Đại Biểu Bình Chọn Gần Nhất ({voteStats.recentVoters.length})
                  </h4>
                  <div className="rounded-2xl overflow-x-auto bg-white/[0.04]">
                    <table className="w-full text-xs text-left min-w-[520px]">
                      <thead className="bg-white/10 text-white/70 uppercase text-[10px] font-mono">
                        <tr>
                          <th className="py-2.5 px-3.5">Họ và tên</th>
                          <th className="py-2.5 px-3.5">Email</th>
                          <th className="py-2.5 px-3.5">Lựa chọn</th>
                          <th className="py-2.5 px-3.5">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voteStats.recentVoters.slice(0, 15).map((v: any) => (
                          <tr key={v.id} className="hover:bg-white/5">
                            <td className="py-2.5 px-3.5 font-bold text-white">{v.voterName}</td>
                            <td className="py-2.5 px-3.5 font-mono text-white/70">{v.voterEmail}</td>
                            <td className="py-2.5 px-3.5 font-semibold" style={{ color: primaryColor }}>
                              {v.optionLabel}
                            </td>
                            <td className="py-2.5 px-3.5 text-white/50 font-mono">
                              {v.createdAt ? new Date(v.createdAt).toLocaleString("vi-VN") : "Vừa xong"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL MÃ QR CÔNG KHAI (BORDERLESS) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl grid place-items-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[32px] pin-glass-card p-6 sm:p-8 text-center space-y-5 text-white">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-white/80">
                QR PASS · PUBLIC SHOWCASE &amp; VOTE
              </span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="w-56 h-56 sm:w-60 sm:h-60 mx-auto bg-white p-3.5 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)] grid place-items-center">
              <img
                src={getQrUrl(publicUrl, 300)}
                alt="QR Code Landing Page"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-base font-extrabold text-white">{config.name}</div>
              <p className="text-xs text-white/60 leading-relaxed">
                Quét mã QR bằng điện thoại để trải nghiệm 7 màn video trượt ngang và bình chọn trực tiếp theo thời gian thực.
              </p>
              <div className="p-2.5 rounded-2xl bg-white/10 font-mono text-[11px] text-white/80 break-all">
                {publicUrl}
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  toast.success("Đã sao chép đường dẫn công khai!");
                }}
                className="flex-1 py-3 rounded-2xl pin-glass-pill hover:bg-white/15 text-xs font-bold text-white cursor-pointer transition"
              >
                Sao chép Link
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 rounded-2xl bg-white text-black hover:bg-white/90 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
              >
                <span>Mở Trang</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
