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

  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [voteStats, setVoteStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  const [countdownText, setCountdownText] = useState<string>("LIVE VOTING");
  const [isVotingWindowActive, setIsVotingWindowActive] = useState<boolean>(true);

  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const currentSlide = slides[currentIndex] || slides[0];
  const primaryColor = config.theme?.primaryColor || "#E5B84B";
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
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 45) {
      if (deltaX < 0) handleNextSlide();
      else handlePrevSlide();
    }
    touchStartX.current = null;
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

  return (
    <div
      className="relative w-full min-h-screen bg-[#050507] text-white overflow-x-hidden flex flex-col justify-between select-none"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Syne:wght@700;800&family=JetBrains+Mono:wght@500;700&display=swap");

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.38; transform: scale(1.06); }
          50% { opacity: 0.55; transform: scale(1.14); }
        }
        @keyframes waterRipple {
          0% { transform: scale(0.92); opacity: 0.7; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        .pin-glass-pill {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.38);
        }
        .pin-glass-card {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.035) 100%);
          backdrop-filter: blur(36px) saturate(190%);
          -webkit-backdrop-filter: blur(36px) saturate(190%);
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.65);
        }
        .pin-vote-card {
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.03) 100%);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pin-vote-card:hover {
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%);
          transform: translateY(-3px);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5);
        }
        .pin-vote-card:active {
          transform: scale(0.97);
        }
      `}</style>

      {/* AMBIENT DYNAMIC CINEMA BACKDROP */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out"
          style={{
            backgroundImage: `url(${resolveMediaUrl(currentSlide.image) || currentSlide.image})`,
            filter: "blur(75px) saturate(190%)",
            animation: "pulseGlow 9s ease-in-out infinite",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(5,5,7,0.35)_0%,rgba(5,5,7,0.88)_65%,#050507_100%)]" />
        {/* Subtle fine grain grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* PREVIEW MODE FLOATING HUD (Chỉ hiện khi Admin xem trước trong CRM) */}
      {previewMode && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl px-4 py-2 rounded-full pin-glass-pill flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/90">
              STUDIO PREVIEW · 07 HORIZONTAL VIDEO SHOWCASE &amp; LIVE VOTING
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onEditConfig && (
              <button
                type="button"
                onClick={onEditConfig}
                className="px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-white/90 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <Sliders className="size-3" />
                <span>Chỉnh sửa Video &amp; Nội dung</span>
              </button>
            )}
            {onClosePreview && (
              <button
                type="button"
                onClick={onClosePreview}
                className="size-7 rounded-full bg-white/10 hover:bg-rose-500 text-white grid place-items-center cursor-pointer transition"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* MINIMALIST EDITORIAL TOP NAVIGATION (BORDERLESS & MOBILE-FIRST RESPONSIVE) */}
      <header
        className={`relative z-30 w-full max-w-[1440px] mx-auto px-4 sm:px-10 ${
          previewMode ? "pt-16" : "pt-4 sm:pt-6"
        } pb-2 flex flex-wrap items-center justify-between gap-3`}
      >
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="size-9 sm:size-10 rounded-full pin-glass-pill grid place-items-center shrink-0">
            <span
              className="text-xs font-black tracking-tighter"
              style={{ color: primaryColor, fontFamily: "'Syne', sans-serif" }}
            >
              HN10
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-sm font-extrabold tracking-[0.2em] sm:tracking-[0.24em] uppercase text-white truncate">
              {config.brand?.logoText || "CEO HN10 · EXHIBITION"}
            </div>
            <div className="text-[9px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.2em] uppercase text-white/50 font-mono truncate">
              INTERACTIVE FILM &amp; REALTIME VOTING
            </div>
          </div>
        </div>

        {/* Center: Sleek 01 — 07 Filmstrip Chapter Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full pin-glass-pill">
          {slides.map((s, idx) => {
            const active = idx === currentIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative px-3 py-1 rounded-full text-[11px] font-mono transition-all duration-500 cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? "bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.45)]"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>0{idx + 1}</span>
                {active && (
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider max-w-[110px] truncate">
                    · {s.title1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Countdown + Live Stats + QR Access */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 sm:gap-2 pin-glass-pill ${
              isVotingWindowActive ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                isVotingWindowActive ? "bg-emerald-400 animate-ping" : "bg-rose-400"
              }`}
            />
            <span className="truncate max-w-[125px] sm:max-w-none">{countdownText}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setLoadingStats(true);
                fetchRealtimeStats().finally(() => setLoadingStats(false));
                setShowStatsModal(true);
              }}
              className="px-3 sm:px-3.5 py-1.5 rounded-full pin-glass-pill hover:bg-white/15 text-white text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase flex items-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <BarChart3 className="size-3.5" style={{ color: primaryColor }} />
              <span className="hidden sm:inline">Live Analytics</span>
              <span className="font-mono font-bold text-white/90">({voteStats?.totalVoters ?? 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-3 sm:px-4 py-1.5 rounded-full bg-white text-black hover:bg-white/90 text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.25)] transition active:scale-95"
            >
              <QrCode className="size-3.5" />
              <span>QR Pass</span>
            </button>
          </div>
        </div>
      </header>

      {/* HORIZONTAL 3D PERSPECTIVE 7-VIDEO CAROUSEL STAGE (ZERO TEXT ON VIDEO, BORDERLESS, MOBILE RESPONSIVE) */}
      <main className="relative z-20 flex-1 w-full max-w-[1440px] mx-auto flex flex-col justify-center py-2 sm:py-5">
        {/* 1. CAROUSEL VIEWPORT WITH PEEKING ADJACENT VIDEO CARDS */}
        <div className="relative w-full h-[230px] sm:h-[430px] lg:h-[520px] flex items-center justify-center overflow-hidden px-3 sm:px-4">
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
                className={`absolute w-[92%] sm:w-[82%] lg:w-[72%] max-w-[1020px] h-full rounded-[24px] sm:rounded-[38px] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isCenter
                    ? "shadow-[0_35px_100px_rgba(0,0,0,0.85)]"
                    : "cursor-pointer hover:opacity-70"
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

        {/* 2. FLOATING INTERACTIVE VOTING DOCK DIRECTLY BELOW ACTIVE VIDEO (BORDERLESS & MOBILE RESPONSIVE) */}
        <div className="w-[94%] sm:w-[82%] lg:w-[72%] max-w-[1020px] mx-auto mt-3 sm:mt-5">
          <div className="rounded-[24px] sm:rounded-[34px] pin-glass-card p-4 sm:p-7 space-y-3.5 sm:space-y-4">
            {/* Voting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 sm:pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-white/60">
                    INTERACTIVE POLL · SLIDE 0{currentIndex + 1}
                  </span>
                </div>
                <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight">
                  {currentSlide.votingQuestion ||
                    `Bình chọn đánh giá của bạn cho Video 0${currentIndex + 1}`}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {hasVotedEmail ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    <span className="truncate max-w-[180px]">Đã vote ({hasVotedEmail})</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-white/50 font-mono">
                    1 VOTE / PERSON
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-white/10 text-[11px] font-mono text-white/90">
                  {currentSlideStat?.totalVotes ?? 0} phiếu
                </span>
              </div>
            </div>

            {/* Voting Option Cards with Fluid Realtime Progress Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(currentSlide.votingOptions || []).map((opt, oIdx) => {
                const optStat = currentSlideStat?.options?.find((o: any) => o.id === opt.id);
                const count = optStat?.count ?? 0;
                const pct = optStat?.percentage ?? 0;
                const isSelected = selectedOptionBySlide[currentSlide.id] === opt.id;

                return (
                  <button
                    key={opt.id || oIdx}
                    type="button"
                    onClick={() => handleChooseOption(currentSlide, opt)}
                    className={`pin-vote-card group relative rounded-2xl p-3.5 sm:p-4 text-left flex flex-col justify-between gap-3 overflow-hidden cursor-pointer ${
                      isSelected ? "bg-white/20 shadow-[0_0_25px_rgba(255,255,255,0.2)]" : ""
                    }`}
                  >
                    {/* Animated Liquid Fill Percentage Backdrop */}
                    <div
                      className="absolute inset-y-0 left-0 pointer-events-none transition-all duration-1000 ease-out opacity-15"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        background: `linear-gradient(90deg, ${primaryColor} 0%, transparent 100%)`,
                      }}
                    />

                    <div className="relative z-10 space-y-1.5 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">
                          OPTION 0{oIdx + 1}
                        </span>
                        <span
                          className="text-xs font-mono font-bold"
                          style={{ color: primaryColor }}
                        >
                          {pct}% <span className="text-white/40 font-normal">({count})</span>
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white group-hover:text-amber-200 transition leading-snug">
                        {opt.label}
                      </div>

                      {opt.description && (
                        <p className="text-[11px] text-white/55 line-clamp-2 leading-relaxed">
                          {opt.description}
                        </p>
                      )}
                    </div>

                    <div className="relative z-10 w-full space-y-2">
                      {/* Slim Progress Line */}
                      <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            backgroundColor: primaryColor,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white/45 font-medium">
                          {hasVotedEmail ? "Xem thống kê" : "Chạm để bình chọn"}
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-white group-hover:translate-x-0.5 transition">
                          <span>Vote</span>
                          <ArrowUpRight className="size-3.5" style={{ color: primaryColor }} />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM 7-SLIDE FILMSTRIP DOCK */}
      <footer className="relative z-20 w-full max-w-[1440px] mx-auto px-4 sm:px-10 pb-5 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 scrollbar-none">
          {slides.map((s, idx) => {
            const active = idx === currentIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`group relative flex items-center gap-2 p-1.5 pr-3 rounded-full transition-all duration-500 cursor-pointer shrink-0 ${
                  active
                    ? "bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.3)] scale-105"
                    : "pin-glass-pill text-white/70 hover:text-white"
                }`}
              >
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0">
                  <img
                    src={resolveMediaUrl(s.image) || s.image}
                    alt={`0${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <div
                    className={`text-[9px] font-mono uppercase tracking-widest ${
                      active ? "text-black/60 font-bold" : "text-white/45"
                    }`}
                  >
                    0{idx + 1}
                  </div>
                  <div className="text-[11px] font-bold leading-none truncate max-w-[85px]">
                    {s.title1}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:block text-[11px] font-mono text-white/40 tracking-wider uppercase">
          SWIPE OR USE ← → KEYS TO GLIDE THROUGH 07 FILMS
        </div>
      </footer>

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
                {(voteStats?.slideStats || []).map((st: any) => (
                  <div
                    key={st.slideId}
                    className="p-4 sm:p-5 rounded-3xl bg-white/[0.05] space-y-3.5"
                  >
                    <div className="flex items-center justify-between pb-2">
                      <div>
                        <span
                          className="text-[10px] font-mono font-bold uppercase tracking-widest"
                          style={{ color: primaryColor }}
                        >
                          FILM 0{st.slideNumber} · {st.place}
                        </span>
                        <h4 className="text-sm font-extrabold text-white mt-0.5">{st.title}</h4>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-mono font-bold shrink-0">
                        {st.totalVotes} votes
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(st.options || []).map((opt: any) => (
                        <div key={opt.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="font-medium text-white/85">{opt.label}</span>
                            <span className="font-mono font-bold shrink-0" style={{ color: primaryColor }}>
                              {opt.percentage}% ({opt.count})
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${Math.min(100, opt.percentage)}%`,
                                backgroundColor: primaryColor,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
