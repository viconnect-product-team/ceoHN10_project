import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Globe,
  Plus,
  Eye,
  Sliders,
  Link2,
  Trash2,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  FolderTree,
  Code,
  Image as ImageIcon,
  Palette,
  X,
  Play,
  RotateCcw,
  Check,
  Upload,
  MapPin,
  Users,
  Smartphone,
  MessageSquare,
  HelpCircle,
  Star,
  Video,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { useServerData } from "@/hooks/use-server-data";
import { uploadFileToNest, resolveMediaUrl } from "@/lib/api-client";
import {
  listLandingWebsFn,
  createLandingWebFn,
  updateLandingWebFn,
  deleteLandingWebFn,
  applySubdomainFn,
  testApiConnectorFn,
} from "@/lib/landing-webs.functions";
import {
  TimedCardsOpeningLanding,
  type LandingWebConfig,
  type LandingMenuItem,
  type LandingSlide,
  type LandingSubScreen,
  type LandingApiConfig,
  type StartupMobileTemplateConfig,
  DEFAULT_STARTUP_MOBILE_CONFIG,
  DEFAULT_FORGE_LUXURY_ATELIER_CONFIG,
} from "@/components/landing/TimedCardsOpeningLanding";
import { StartupMobileShowcaseLanding } from "@/components/landing/StartupMobileShowcaseLanding";
import { ForgeLuxuryAtelierLanding } from "@/components/landing/ForgeLuxuryAtelierLanding";
import {
  VideoVotingShowcaseLanding,
  DEFAULT_VIDEO_VOTING_7_SLIDES,
} from "@/components/landing/VideoVotingShowcaseLanding";
import { getQrUrl } from "@/lib/qr";
import { fetchNestApi } from "@/lib/api-client";
import { QrCode, Film, BarChart3, Clock, Vote } from "lucide-react";

export const DEFAULT_VIDEO_VOTING_TEMPLATE: LandingWebConfig = {
  id: "lw_video_voting_7slides_default",
  name: "Mẫu Chủ Đạo: Trình Chiếu 7 Video Trượt Ngang & Bình Chọn Realtime (Pinterest 900790362966152495)",
  slug: "video-voting",
  subdomain: "video-voting",
  isPublished: true,
  template: "video_voting_showcase",
  votingStartAt: new Date(Date.now() - 3600 * 1000).toISOString().slice(0, 16),
  votingEndAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
  votingDurationMinutes: 120,
  theme: {
    primaryColor: "#ecad29",
    secondaryColor: "#0B0F19",
    textColor: "#FFFFFF",
    backgroundColor: "#07090E",
    fontFamily: "Inter, Oswald, sans-serif",
  },
  brand: {
    logoText: "CEO HN10 VIDEO SHOWCASE & VOTING",
    logoIcon: "film",
    contactPhone: "0983.1010.10",
    contactEmail: "contact@ceohn10.viconnect.vn",
  },
  navMenu: [],
  slides: JSON.parse(JSON.stringify(DEFAULT_VIDEO_VOTING_7_SLIDES)),
  subScreens: [],
  apiConfig: {
    enabled: false,
    endpointUrl: "",
    rootPath: "",
  },
};

export const DEFAULT_TIMED_CARDS_TEMPLATE: LandingWebConfig = {
  id: "lw_timed_cards_opening_default",
  name: "Mẫu 1: Timed Cards Opening — Khám Phá Toàn Cầu (Pinterest Giulio Cuscito)",
  slug: "web-v1",
  subdomain: "web-v1",
  isPublished: true,
  template: "timed_cards_opening",
  theme: {
    primaryColor: "#ecad29",
    secondaryColor: "#1a1a1a",
    textColor: "#FFFFFF",
    backgroundColor: "#111317",
    fontFamily: "Inter, Oswald, sans-serif",
  },
  brand: {
    logoText: "Globe Express",
    logoIcon: "globe",
    contactPhone: "0983.1010.10",
    contactEmail: "contact@ceohn10.viconnect.vn",
  },
  navMenu: [
    { id: "m1", label: "Địa Điểm", active: true, type: "link", url: "#" },
    { id: "m2", label: "Thành Viên", type: "link", url: "#" },
    { id: "m3", label: "Sự Kiện", type: "link", url: "#" },
    { id: "m4", label: "Hệ Thống", type: "link", url: "#" },
  ],
  slides: [
    {
      id: "slide-1",
      place: "Switzerland Alps",
      title1: "SAINT",
      title2: "ANTONIEN",
      description: "Tận hưởng không gian thiên nhiên hùng vĩ của rặng núi Alps tại Thụy Sĩ. Nơi những doanh nhân tìm thấy sự tĩnh tại và cảm hứng sáng tạo vô tận.",
      image: "https://assets.codepen.io/3685267/timed-cards-1.jpg",
      ctaText: "Khám Phá Địa Điểm",
      ctaLink: "#",
    },
    {
      id: "slide-2",
      place: "Japan Danxia",
      title1: "NAGANO",
      title2: "PREFECTURE",
      description: "Vẻ đẹp thanh bình của xứ sở hoa anh đào qua góc nhìn của kiến trúc truyền thống và công nghệ hiện đại bậc nhất thế giới.",
      image: "https://assets.codepen.io/3685267/timed-cards-2.jpg",
      ctaText: "Tìm Hiểu Thêm",
      ctaLink: "#",
    },
    {
      id: "slide-3",
      place: "Sahara Desert",
      title1: "MARRAKECH",
      title2: "MERZOUGA",
      description: "Hành trình xuyên qua sa mạc Sahara huyền bí với những đụn cát vàng bất tận dưới bầu trời đêm ngập tràn ánh sao.",
      image: "https://assets.codepen.io/3685267/timed-cards-3.jpg",
      ctaText: "Xem Chi Tiết",
      ctaLink: "#",
    },
  ],
  subScreens: [],
  apiConfig: {
    enabled: false,
    endpointUrl: "",
    rootPath: "",
  },
};

export const DEFAULT_STARTUP_MOBILE_TEMPLATE: LandingWebConfig = {
  id: "lw_startup_mobile_showcase_default",
  name: "Mẫu 2: Startup Mobile Showcase — Ứng Dụng Di Động CEO HN10 (Pinterest 234398355598861981)",
  slug: "web-v2",
  subdomain: "web-v2",
  isPublished: true,
  template: "startup_mobile_showcase",
  theme: {
    primaryColor: "#003B95",
    secondaryColor: "#ecad29",
    textColor: "#0F172A",
    backgroundColor: "#F8FAFC",
    fontFamily: "Inter, Oswald, sans-serif",
  },
  brand: {
    logoText: "CLB Doanh Nhân CEO HN10",
    logoIcon: "smartphone",
    contactPhone: "0983.1010.10",
    contactEmail: "contact@ceohn10.viconnect.vn",
  },
  navMenu: [
    { id: "m1", label: "Trang chủ", url: "#hero" },
    { id: "m2", label: "Tính năng App", url: "#features" },
    { id: "m3", label: "Giao thương B2B", url: "#b2b" },
    { id: "m4", label: "Học viên tiêu biểu", url: "#members" },
    { id: "m5", label: "Tải ứng dụng", url: "#download" },
  ],
  slides: [
    {
      id: "slide-app-1",
      place: "Hệ Sinh Thái CEO HN10",
      title1: "KẾT NỐI",
      title2: "DOANH NHÂN",
      description: "Ứng dụng chuyên biệt kết nối giao thương nội khối, đặt lịch hẹn 1-on-1, thanh toán phí tham gia CLB MoMo/VNPay tự động và bảng xếp hạng số minh bạch.",
      image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80",
      ctaText: "Khám Phá Tính Năng",
      ctaLink: "#features",
    },
    {
      id: "slide-app-2",
      place: "Thương Mại & Đầu Tư",
      title1: "CƠ HỘI",
      title2: "GIAO THƯƠNG",
      description: "Hơn 500+ doanh nghiệp thành viên, cơ hội tiếp cận gói thầu giá trị cao và hỗ trợ pháp lý toàn diện từ Ban Điều Hành.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
      ctaText: "Xem Cơ Hội B2B",
      ctaLink: "#b2b",
    },
    {
      id: "slide-app-3",
      place: "Mạng Lưới Thẻ Doanh Nhân",
      title1: "DANH THIẾP",
      title2: "ĐIỆN TỬ QR",
      description: "Chia sẻ danh thiếp chỉ trong 1 giây qua NFC và QR Code, đồng bộ trực tiếp vào danh bạ và lưu vết kết nối trọn đời.",
      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
      ctaText: "Trải Nghiệm Thẻ QR",
      ctaLink: "#card",
    },
  ],
  subScreens: [],
  apiConfig: {
    enabled: false,
    endpointUrl: "",
    rootPath: "",
  },
  startupConfig: JSON.parse(JSON.stringify(DEFAULT_STARTUP_MOBILE_CONFIG)),
};

export const DEFAULT_FORGE_LUXURY_ATELIER_TEMPLATE: LandingWebConfig = {
  id: "lw_forge_luxury_atelier_default",
  name: "Mẫu 3: Forge Luxury Atelier — Dành Cho Doanh Nhân Đỉnh Cao (Pinterest SOTD Award)",
  slug: "web-v3",
  subdomain: "web-v3",
  isPublished: true,
  template: "forge_luxury_atelier",
  theme: {
    primaryColor: "#C5A880",
    secondaryColor: "#0A0A0A",
    textColor: "#EDEDED",
    backgroundColor: "#070707",
    fontFamily: "Cinzel, Inter, sans-serif",
  },
  brand: {
    logoText: "CEO HN10 Bespoke Atelier",
    logoIcon: "crown",
    contactPhone: "0983.1010.10",
    contactEmail: "contact@ceohn10.viconnect.vn",
  },
  navMenu: [
    { id: "m1", label: "Triết Lý", url: "#approach" },
    { id: "m2", label: "Phân Hệ Atelier", url: "#specialties" },
    { id: "m3", label: "Dự Án Tiêu Biểu", url: "#builds" },
    { id: "m4", label: "Cơ Hội Độc Quyền", url: "#stock" },
    { id: "m5", label: "Gia Nhập Ngay", url: "#enquire" },
  ],
  slides: [],
  subScreens: [],
  forgeAtelierConfig: JSON.parse(JSON.stringify(DEFAULT_FORGE_LUXURY_ATELIER_CONFIG)),
  apiConfig: {
    enabled: false,
    endpointUrl: "",
    rootPath: "",
  },
};

function LandingImageUploadField({
  label,
  value,
  onChange,
  folder = "landing",
  previewAspect = "video",
  placeholder = "https://... hoặc bấm tải ảnh lên",
  helperText,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  previewAspect?: "square" | "video" | "banner";
  placeholder?: string;
  helperText?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const url = await uploadFileToNest(file, `${folder}_${Date.now()}_${cleanName}`);
      onChange(url);
      toast.success("Tải ảnh lên thành công!");
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error(err?.message || "Tải ảnh thất bại, vui lòng thử lại!");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{label}</label>
        {helperText && <span className="text-[10px] text-slate-400">{helperText}</span>}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
        />

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <div className="size-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          <span>{uploading ? "Đang tải..." : "Tải Ảnh"}</span>
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
            title="Xóa ảnh"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {value && (
        <div className="mt-1 relative inline-block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs">
          <img
            src={resolveMediaUrl(value) || value}
            alt="Preview"
            className={`object-cover bg-slate-50 dark:bg-slate-900 ${previewAspect === "square" ? "size-14 rounded-lg" : previewAspect === "banner" ? "w-44 h-16" : "w-32 h-20"
              }`}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}

function LandingVideoUploadField({
  label,
  value,
  onChange,
  folder = "landing_videos",
  placeholder = "https://... (.mp4, .webm) hoặc bấm tải video lên",
  helperText,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  placeholder?: string;
  helperText?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const url = await uploadFileToNest(file, `${folder}_${Date.now()}_${cleanName}`);
      onChange(url);
      toast.success("Tải video lên thành công!");
    } catch (err: any) {
      console.error("Video upload failed:", err);
      toast.error(err?.message || "Tải video thất bại, vui lòng thử lại!");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Film className="size-3.5 text-[#003B95]" />
          <span>{label}</span>
        </label>
        {helperText && <span className="text-[10px] text-slate-400">{helperText}</span>}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
        />

        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          <span>{uploading ? "Đang tải video..." : "Tải Video Lên"}</span>
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
            title="Xóa video"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {value && (
        <div className="mt-1 rounded-xl overflow-hidden border border-slate-200 bg-black w-56 h-32">
          <video
            src={resolveMediaUrl(value) || value}
            muted
            controls
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/admin/landing-webs")({
  ssr: false,
  component: AdminLandingWebsPage,
});

function AdminLandingWebsPage() {
  const listFn = useServerFn(listLandingWebsFn);
  const createFn = useServerFn(createLandingWebFn);
  const updateFn = useServerFn(updateLandingWebFn);
  const deleteFn = useServerFn(deleteLandingWebFn);
  const applySubFn = useServerFn(applySubdomainFn);
  const testApiFn = useServerFn(testApiConnectorFn);

  const { data: landingWebs = [], loading, reload } = useServerData<LandingWebConfig[]>(() => listFn(), []);

  // Đảm bảo luôn hiển thị đầy đủ mẫu 7 Video Voting (Pinterest 900790362966152495) và các mẫu thiết kế chuẩn Pinterest
  const displayLandingWebs = useMemo(() => {
    const list = [...landingWebs];
    if (!list.some((w) => w.template === "video_voting_showcase" || w.slug === "video-voting")) {
      list.unshift(DEFAULT_VIDEO_VOTING_TEMPLATE);
    }
    if (!list.some((w) => w.template === "timed_cards_opening")) {
      list.push(DEFAULT_TIMED_CARDS_TEMPLATE);
    }
    if (!list.some((w) => w.template === "startup_mobile_showcase")) {
      list.push(DEFAULT_STARTUP_MOBILE_TEMPLATE);
    }
    if (!list.some((w) => w.template === "forge_luxury_atelier")) {
      list.push(DEFAULT_FORGE_LUXURY_ATELIER_TEMPLATE);
    }
    return list;
  }, [landingWebs]);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<LandingWebConfig | null>(null);
  const [editItem, setEditItem] = useState<LandingWebConfig | null>(null);
  const [subdomainModalItem, setSubdomainModalItem] = useState<LandingWebConfig | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<LandingWebConfig | null>(null);
  const [publishedQrItem, setPublishedQrItem] = useState<LandingWebConfig | null>(null);
  const [statsModalItem, setStatsModalItem] = useState<LandingWebConfig | null>(null);
  const [liveVoteStats, setLiveVoteStats] = useState<any>(null);

  // Form states for Create Modal
  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    subdomain: "",
    template: "video_voting_showcase" as
      | "video_voting_showcase"
      | "timed_cards_opening"
      | "ceohn10_executive"
      | "startup_mobile_showcase"
      | "forge_luxury_atelier",
  });
  const [creating, setCreating] = useState(false);

  // Form states for Subdomain Modal
  const [subdomainInput, setSubdomainInput] = useState("");
  const [applyingSubdomain, setApplyingSubdomain] = useState(false);

  // Tabs for Dynamic Builder Modal
  const [activeBuilderTab, setActiveBuilderTab] = useState<string>("general");
  const [activeAppTabEdit, setActiveAppTabEdit] = useState<"b2b" | "connect" | "card" | "analytics">("b2b");
  const [testingApi, setTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<any>(null);

  // Selected sub-screen for editing in Dynamic Builder
  const [editingSubScreen, setEditingSubScreen] = useState<LandingSubScreen | null>(null);

  const handleOpenEdit = (web: LandingWebConfig) => {
    const clone: LandingWebConfig = JSON.parse(JSON.stringify(web));
    if (clone.template === "video_voting_showcase" || clone.slug === "video-voting") {
      const rawSlides = Array.isArray(clone.slides) ? clone.slides : [];
      const ensured7Slides: LandingSlide[] = [];
      for (let i = 0; i < 7; i++) {
        const existing = rawSlides[i] || DEFAULT_VIDEO_VOTING_7_SLIDES[i];
        ensured7Slides.push({
          ...DEFAULT_VIDEO_VOTING_7_SLIDES[i],
          ...existing,
          id: existing.id || `vslide-${i + 1}`,
          votingOptions:
            Array.isArray(existing.votingOptions) && existing.votingOptions.length > 0
              ? existing.votingOptions
              : JSON.parse(JSON.stringify(DEFAULT_VIDEO_VOTING_7_SLIDES[i].votingOptions)),
        });
      }
      clone.slides = ensured7Slides;
      if (!clone.votingStartAt) {
        clone.votingStartAt = new Date().toISOString().slice(0, 16);
      }
      if (!clone.votingEndAt) {
        clone.votingEndAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16);
      }
      setActiveBuilderTab("slides");
    } else if (clone.template === "forge_luxury_atelier") {
      if (!clone.forgeAtelierConfig) {
        clone.forgeAtelierConfig = JSON.parse(JSON.stringify(DEFAULT_FORGE_LUXURY_ATELIER_CONFIG));
      }
      setActiveBuilderTab("general");
    } else if (clone.template === "startup_mobile_showcase") {
      if (!clone.startupConfig) {
        clone.startupConfig = JSON.parse(JSON.stringify(DEFAULT_STARTUP_MOBILE_CONFIG));
      }
      setActiveBuilderTab("m2_hero");
    } else {
      setActiveBuilderTab("general");
    }
    setEditItem(clone);
    setEditingSubScreen(null);
  };

  // Summary Metrics - tính toán trên danh sách đầy đủ
  const totalCount = displayLandingWebs.length;
  const publishedCount = displayLandingWebs.filter((w) => w.isPublished).length;
  const subdomainCount = displayLandingWebs.filter((w) => !!w.subdomain).length;
  const apiIntegratedCount = displayLandingWebs.filter((w) => w.apiConfig?.enabled).length;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error("Vui lòng nhập tên Landing Web");
      return;
    }
    setCreating(true);
    try {
      await createFn({ data: createForm });
      toast.success("Tạo mới Landing Web thành công!");
      setCreateModalOpen(false);
      setCreateForm({
        name: "",
        slug: "",
        subdomain: "",
        template: "timed_cards_opening",
      });
      await reload();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tạo mới Landing Web");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveDynamicConfig = async () => {
    if (!editItem) return;
    try {
      const toSave: LandingWebConfig = {
        ...editItem,
        isPublished: true,
      };
      await updateFn({ data: { id: toSave.id!, config: toSave } });
      toast.success("Đã Áp dụng & Xuất bản Landing Page công khai thành công! Quét mã QR để xem và bình chọn ngay.");
      await reload();
      setEditItem(null);
      setPublishedQrItem(toSave);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi cập nhật cấu hình");
    }
  };

  const handleOpenVoteStatsModal = async (web: LandingWebConfig) => {
    setStatsModalItem(web);
    setLiveVoteStats(null);
    try {
      const res = await fetchNestApi<any>(
        `/public/landing-webs/${encodeURIComponent(web.slug || web.id || "video-voting")}/vote-stats`
      );
      if (res) setLiveVoteStats(res);
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!deleteModalItem) return;
    try {
      await deleteFn({ data: { id: deleteModalItem.id! } });
      toast.success("Đã xóa Landing Web thành công!");
      setDeleteModalItem(null);
      await reload();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi xóa Landing Web");
    }
  };

  const handleApplySubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomainModalItem) return;
    const cleanSub = subdomainInput.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    if (!cleanSub) {
      toast.error("Vui lòng nhập slug hợp lệ (ví dụ: web-v1, web-v2, b2b-connect)");
      return;
    }
    setApplyingSubdomain(true);
    try {
      await updateFn({
        data: {
          id: subdomainModalItem.id!,
          config: {
            ...subdomainModalItem,
            slug: cleanSub,
            subdomain: cleanSub,
          },
        },
      });
      toast.success(`Đã cập nhật đường dẫn: crm.ceohn10.viconnect.vn/landing/${cleanSub}`);
      setSubdomainModalItem(null);
      await reload();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi cập nhật đường dẫn");
    } finally {
      setApplyingSubdomain(false);
    }
  };

  const handleTestApiConnector = async () => {
    if (!editItem?.apiConfig) return;
    setTestingApi(true);
    setApiTestResult(null);
    try {
      const res = await testApiFn({ data: { apiConfig: editItem.apiConfig } });
      setApiTestResult(res);
      toast.success(`Kết nối API thành công! Tìm thấy ${res?.count ?? 0} bản ghi.`);
    } catch (err: any) {
      toast.error(err?.message || "Không thể kết nối API. Vui lòng kiểm tra lại URL!");
    } finally {
      setTestingApi(false);
    }
  };

  return (
    <AppShell>
      {/* Top Banner & Heading */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 size-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                [NODE-CRM-021] • Dynamic Landing Platform
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#003B95] text-white">
                crm.ceohn10.viconnect.vn/landing/web-v1 &amp; web-v2
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Globe className="size-6 text-amber-400" />
              <span>Quản Lý Landing Web &amp; Đường Dẫn Tên Miền (Domain Path)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tạo mới và quản lý các trang Landing Web siêu chuyển đổi, mô phỏng chuẩn xác 100% thiết kế Pinterest (Mẫu 1: Timed Cards Opening và Mẫu 2: Startup Mobile Showcase). Tất cả hoạt động trực tiếp dưới tên miền chính <strong className="text-amber-300 font-mono">crm.ceohn10.viconnect.vn/landing/web-v1</strong> và <strong className="text-amber-300 font-mono">web-v2</strong> (không sử dụng subdomain riêng).
            </p>
          </div>

          <div className="z-10 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCreateForm({
                  name: `Landing Video Voting #${totalCount + 1}`,
                  slug: `video-voting-${Date.now().toString().slice(-4)}`,
                  subdomain: "",
                  template: "video_voting_showcase",
                });
                setCreateModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Tạo Mới Landing Page</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#131a26] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Landing Web</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</h3>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 grid place-items-center">
              <Globe className="size-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#131a26] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đang Xuất Bản</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{publishedCount}</h3>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center">
              <CheckCircle2 className="size-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#131a26] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đường Dẫn Domain</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{totalCount}</h3>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center">
              <Globe className="size-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#131a26] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">API Động Kích Hoạt</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">{apiIntegratedCount}</h3>
            </div>
            <div className="size-10 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 grid place-items-center">
              <Code className="size-5" />
            </div>
          </div>
        </div>

        {/* Landing Web Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="size-4 text-amber-500" />
              <span>Danh Sách Bản Mẫu &amp; Landing Web Đang Hoạt Động</span>
            </h2>
            <button
              type="button"
              onClick={() => reload()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              <span>Làm mới</span>
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="size-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đang tải danh sách Landing Web...</p>
            </div>
          ) : displayLandingWebs.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
              <Globe className="size-12 text-slate-400 mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có Landing Web nào được tạo</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Bấm nút "Tạo Mới Landing Web" để khởi tạo bản mẫu chuẩn Timed Cards Opening từ Pinterest Giulio Cuscito.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayLandingWebs.map((web) => {
                const firstImg = web.slides?.[0]?.image || "https://assets.codepen.io/3685267/timed-cards-1.jpg";
                const isTimedCards = web.template === "timed_cards_opening";
                const isStartupMobile = web.template === "startup_mobile_showcase";
                const isVideoVoting = web.template === "video_voting_showcase" || web.slug === "video-voting";

                return (
                  <div
                    key={web.id}
                    className="group rounded-3xl overflow-hidden bg-white dark:bg-[#131a26] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Thumbnail & Badge Header */}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                        <img
                          src={firstImg}
                          alt={web.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-700 filter brightness-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md"
                            style={{
                              backgroundColor:
                                web.theme?.primaryColor || (isStartupMobile ? "#003B95" : "#ecad29"),
                            }}
                          >
                            {isVideoVoting
                              ? "7 Video Slides & Realtime Voting"
                              : isStartupMobile
                              ? "Startup Mobile Showcase"
                              : isTimedCards
                                ? "Timed Cards Opening"
                                : "CEO HN10 Executive"}
                          </span>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-md ${web.isPublished
                                ? "bg-emerald-500/90 text-white"
                                : "bg-slate-700/90 text-slate-200"
                              }`}
                          >
                            {web.isPublished ? "Đang xuất bản" : "Bản nháp"}
                          </span>
                        </div>

                        {/* Bottom Overlay Info on Thumbnail */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                          <div className="flex items-center gap-1.5 font-bold truncate">
                            <Layers className="size-3.5 text-amber-400" />
                            <span>{web.slides?.length || 0} màn trình chiếu</span>
                          </div>
                          {isVideoVoting ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black">
                              QR Voting 1 Lượt/Người
                            </span>
                          ) : web.apiConfig?.enabled ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-700 text-white text-[10px] font-bold">
                              API Connected
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Card Content Info */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#003B95] dark:group-hover:text-blue-400 transition">
                            {web.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Slug: <code className="font-mono text-amber-600 dark:text-amber-400 font-bold">{web.slug}</code></span>
                          </div>
                        </div>

                        {/* Domain Path Link Banner */}
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px]">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                              <Globe className="size-3 text-slate-400" />
                              <span>URL:</span>
                            </span>
                            {(() => {
                              const pathSlug = web.slug || (isVideoVoting ? "video-voting" : web.template === "startup_mobile_showcase" ? "web-v2" : "web-v1");
                              const fullUrl = typeof window !== "undefined" ? `${window.location.origin}/landing/${pathSlug}` : `https://crm.ceohn10.viconnect.vn/landing/${pathSlug}`;
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(fullUrl);
                                    toast.success(`Đã sao chép: ${fullUrl}`);
                                  }}
                                  className="font-mono text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer truncate max-w-[210px]"
                                  title="Sao chép đường dẫn trực tiếp"
                                >
                                  <span className="truncate">/landing/{pathSlug}</span>
                                  <Copy className="size-3 shrink-0" />
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-5 gap-1.5 mt-2">
                      {/* Xem Trực Tiếp */}
                      <button
                        type="button"
                        onClick={() => setPreviewItem(web)}
                        className="col-span-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Xem bản xem trước trực quan"
                      >
                        <Eye className="size-3.5" />
                        <span className="hidden sm:inline">Xem</span>
                      </button>

                      {/* Tùy Biến Dynamic */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(web)}
                        className="col-span-1 py-2 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        title="Chỉnh sửa text, tải 7 video & cài đặt lựa chọn voting"
                      >
                        <Sliders className="size-3.5" />
                        <span className="hidden sm:inline">Sửa</span>
                      </button>

                      {/* Mã QR Công Khai */}
                      <button
                        type="button"
                        onClick={() => setPublishedQrItem(web)}
                        className="col-span-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        title="Hiện mã QR Code công khai để ai quét cũng vào xem và bình chọn được"
                      >
                        <QrCode className="size-3.5" />
                        <span className="hidden sm:inline">QR</span>
                      </button>

                      {/* Thống kê Voting Realtime */}
                      <button
                        type="button"
                        onClick={() => void handleOpenVoteStatsModal(web)}
                        className="col-span-1 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Xem màn thống kê tỷ lệ voting video realtime"
                      >
                        <BarChart3 className="size-3.5" />
                        <span className="hidden sm:inline">Vote</span>
                      </button>

                      {/* Xóa */}
                      <button
                        type="button"
                        onClick={() => setDeleteModalItem(web)}
                        className="col-span-1 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Xóa Landing Web"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL TẠO MỚI LANDING WEB ================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-80 grid place-items-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 grid place-items-center">
                  <Sparkles className="size-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Tạo Mới Landing Web</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="size-7 grid place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Landing Web *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Ví dụ: Khám Phá Toàn Cầu 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-[#003B95]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Đường dẫn Slug (Dùng cho URL: /landing/:slug) *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                  placeholder="kham-pha-toan-cau"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:border-[#003B95]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Đường dẫn Tên miền chính (Domain Path URL)
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-blue-600 dark:text-blue-400 flex items-center justify-between">
                  <span>https://crm.ceohn10.viconnect.vn/landing/{createForm.slug || "web-v1"}</span>
                  <Globe className="size-3.5 text-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Chọn Bản Mẫu Thiết Kế (Template) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Template 0: Pinterest 900790362966152495 - 7 Video Slides Trượt Ngang & Voting Realtime */}
                  <div
                    onClick={() => setCreateForm({ ...createForm, template: "video_voting_showcase" })}
                    className={`p-3 rounded-2xl border-2 transition cursor-pointer ${createForm.template === "video_voting_showcase"
                        ? "border-amber-500 bg-amber-500/15"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Video className="size-3.5 text-amber-500" />
                        <span>7 Video Trượt Ngang &amp; Voting Realtime</span>
                      </span>
                      <span className="size-2 rounded-full bg-amber-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Chuẩn Pinterest 900790362966152495: 7 màn video trượt ngang, bình chọn ngay dưới mỗi video, đếm thời gian, mỗi người vote 1 lần kèm QR và thống kê % realtime.
                    </p>
                  </div>

                  {/* Template 1: Pinterest 160088961741878822 */}
                  <div
                    onClick={() => setCreateForm({ ...createForm, template: "timed_cards_opening" })}
                    className={`p-3 rounded-2xl border-2 transition cursor-pointer ${createForm.template === "timed_cards_opening"
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-900 dark:text-white">Mẫu 1: Timed Cards Opening</span>
                      <span className="size-2 rounded-full bg-amber-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Mẫu Pinterest Giulio Cuscito, tone vàng Amber #ecad29, auto scroll chuyển slide 3D mượt mà.
                    </p>
                  </div>

                  {/* Template 2: Pinterest 234398355598861981 */}
                  <div
                    onClick={() => setCreateForm({ ...createForm, template: "startup_mobile_showcase" })}
                    className={`p-3 rounded-2xl border-2 transition cursor-pointer ${createForm.template === "startup_mobile_showcase"
                        ? "border-[#003B95] bg-[#003B95]/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-900 dark:text-white">Mẫu 2: Startup Mobile Showcase</span>
                      <span className="size-2 rounded-full bg-[#003B95]" />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Mẫu Pinterest video mockup cầm điện thoại 3D nghiêng theo chuột, 4 chỉ số vàng và tabs tính năng app.
                    </p>
                  </div>

                  {/* Template 3: Pinterest 569353577917214566 (Forge Luxury Atelier - SOTD Winner) */}
                  <div
                    onClick={() => setCreateForm({ ...createForm, template: "forge_luxury_atelier" })}
                    className={`p-3 rounded-2xl border-2 transition cursor-pointer ${createForm.template === "forge_luxury_atelier"
                        ? "border-[#C5A880] bg-[#C5A880]/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-900 dark:text-white">Mẫu 3: Forge Luxury Atelier</span>
                      <span className="size-2 rounded-full bg-[#C5A880]" />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Mẫu Pinterest SOTD Award Winner (Forge Automotive), video cinematic, typography editorial siêu sang, 6 phân hệ atelier.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {creating ? "Đang tạo..." : "Xác Nhận Tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL XEM TRỰC TIẾP (LIVE PREVIEW) ================= */}
      {previewItem && (
        <div className="fixed inset-0 z-90 bg-white light [color-scheme:light]">
          {previewItem.template === "video_voting_showcase" || previewItem.slug === "video-voting" ? (
            <VideoVotingShowcaseLanding
              config={previewItem}
              previewMode={true}
              onClosePreview={() => setPreviewItem(null)}
              onEditConfig={() => {
                handleOpenEdit(previewItem);
                setPreviewItem(null);
              }}
            />
          ) : previewItem.template === "forge_luxury_atelier" ? (
            <div className="relative w-full h-full overflow-y-auto">
              <div className="fixed top-4 right-4 z-[999] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-2xl">
                <a
                  href={`/landing/${previewItem.slug || "web-v3"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-[#C5A880] hover:bg-[#B39366] text-black text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Mở URL Tab Mới</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="size-8 rounded-xl bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer transition"
                >
                  <X className="size-4" />
                </button>
              </div>
              <ForgeLuxuryAtelierLanding config={previewItem} />
            </div>
          ) : previewItem.template === "startup_mobile_showcase" ? (
            <div className="relative w-full h-full overflow-y-auto">
              <div className="fixed top-4 right-4 z-[999] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-2xl">
                <a
                  href={`/landing/${previewItem.slug || (previewItem.template === "startup_mobile_showcase" ? "web-v2" : "web-v1")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-[#ffffff] hover:bg-slate-50 text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Mở URL Tab Mới</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(previewItem);
                    setPreviewItem(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#003B95] text-white text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Sliders className="size-3.5" />
                  <span>Sửa Cấu Hình</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="size-8 rounded-xl bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer transition"
                >
                  <X className="size-4" />
                </button>
              </div>
              <StartupMobileShowcaseLanding config={previewItem} />
            </div>
          ) : (
            <TimedCardsOpeningLanding
              config={previewItem}
              previewMode={true}
              onClosePreview={() => setPreviewItem(null)}
              onEditConfig={() => {
                handleOpenEdit(previewItem);
                setPreviewItem(null);
              }}
            />
          )}
        </div>
      )}

      {/* ================= MODAL TÙY BIẾN DYNAMIC TOÀN DIỆN ================= */}
      {editItem && (
        <div className="fixed inset-0 z-85 grid place-items-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-[#003B95]/10 text-[#003B95] dark:text-blue-400 grid place-items-center">
                  <Sliders className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Tùy Biến Toàn Diện Dynamic:</span>
                    <span className="text-amber-600 dark:text-amber-400">{editItem.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tùy biến cây menu phân cấp, các thẻ slide, màu sắc thương hiệu và tích hợp API
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewItem(editItem)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="size-3.5" />
                  <span>Xem Thử</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveDynamicConfig}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="size-3.5" />
                  <span>Áp Dụng &amp; Xuất Bản QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="size-8 grid place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer ml-1"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Builder Navigation Tabs - DYNAMIC TÁCH BIỆT RIÊNG CHO MỖI MẪU */}
            <div className="px-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 overflow-x-auto bg-slate-50/20 dark:bg-slate-950/20 text-xs font-bold">
              {editItem.template === "startup_mobile_showcase" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveBuilderTab("m2_hero")}
                    className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeBuilderTab === "m2_hero"
                        ? "border-[#003B95] text-[#003B95] dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <Smartphone className="size-4" />
                    <span>1. 🌟 Hero &amp; Bàn Tay 3D</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBuilderTab("m2_ribbon_tabs")}
                    className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeBuilderTab === "m2_ribbon_tabs"
                        ? "border-[#003B95] text-[#003B95] dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <Sliders className="size-4" />
                    <span>2. 📊 Ruy-băng &amp; 4 Tab App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBuilderTab("m2_map")}
                    className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeBuilderTab === "m2_map"
                        ? "border-[#003B95] text-[#003B95] dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <MapPin className="size-4" />
                    <span>3. 📍 Điểm Cầu Bản Đồ ({editItem.startupConfig?.mapChapterPins?.length || 5})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBuilderTab("m2_avatars")}
                    className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeBuilderTab === "m2_avatars"
                        ? "border-[#003B95] text-[#003B95] dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <Users className="size-4" />
                    <span>4. 👥 Cộng Đồng Avatars 3D ({editItem.startupConfig?.communityAvatars?.length || 4})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBuilderTab("m2_testimonials_faq")}
                    className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeBuilderTab === "m2_testimonials_faq"
                        ? "border-[#003B95] text-[#003B95] dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <MessageSquare className="size-4" />
                    <span>5. 💬 Đánh Giá &amp; FAQ</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveBuilderTab("general")}
                    className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeBuilderTab === "general"
                        ? "border-[#003B95] text-[#003B95] dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <Palette className="size-4" />
                    <span>1. Tổng Quan &amp; Brand</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBuilderTab("tree_menu")}
                    className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeBuilderTab === "tree_menu"
                        ? "border-[#003B95] text-[#003B95] dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <FolderTree className="size-4" />
                    <span>2. Cây Menu Phân Cấp (Tree Header)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBuilderTab("slides")}
                    className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeBuilderTab === "slides"
                        ? "border-[#003B95] text-[#003B95] dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <ImageIcon className="size-4" />
                    <span>3. Thẻ Trình Diễn ({editItem.slides?.length || 0} Cards)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBuilderTab("api")}
                    className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeBuilderTab === "api"
                        ? "border-[#003B95] text-[#003B95] dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <Code className="size-4" />
                    <span>4. Tích Hợp API Động</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBuilderTab("sub_screens")}
                    className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeBuilderTab === "sub_screens"
                        ? "border-[#003B95] text-[#003B95] dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <Layers className="size-4" />
                    <span>5. Màn Con Chi Tiết ({editItem.subScreens?.length || 0})</span>
                  </button>
                </>
              )}
            </div>

            {/* Builder Tab Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* ================= MẪU 2: TAB 1 - HERO & BÀN TAY 3D ================= */}
              {activeBuilderTab === "m2_hero" && editItem.startupConfig && (
                <div className="space-y-4 max-w-3xl">
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-black text-[#003B95] dark:text-blue-400">
                        Thiết Lập Mẫu 2: Startup Mobile Showcase (Video Pinterest)
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Bàn tay xoay 3D theo scroll chuột, dải chỉ số xanh hoàng gia và 4 phân hệ app động
                      </p>
                    </div>
                    <span className="font-mono px-2.5 py-1 rounded-lg bg-[#003B95] text-white font-bold text-[10px]">
                      /landing/{editItem.slug || "web-v2"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tên Cấu Hình Mẫu
                      </label>
                      <input
                        type="text"
                        value={editItem.name || ""}
                        onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Slug Đường Dẫn URL
                      </label>
                      <input
                        type="text"
                        value={editItem.slug || "web-v2"}
                        onChange={(e) => setEditItem({ ...editItem, slug: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Headline & Accent Underline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tiêu Đề Lớn Hero (Ngắt dòng bằng Enter)
                      </label>
                      <textarea
                        rows={3}
                        value={editItem.startupConfig.hero?.headline || ""}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            startupConfig: {
                              ...editItem.startupConfig!,
                              hero: { ...editItem.startupConfig!.hero, headline: e.target.value },
                            },
                          })
                        }
                        placeholder="Kết Nối Doanh Nhân&#10;Kiến Tạo Giá Trị"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Từ Khóa Gạch Chân Lượn Sóng Đỏ Cam (Underline Accent)
                        </label>
                        <input
                          type="text"
                          value={editItem.startupConfig.hero?.underlineAccent || ""}
                          onChange={(e) =>
                            setEditItem({
                              ...editItem,
                              startupConfig: {
                                ...editItem.startupConfig!,
                                hero: { ...editItem.startupConfig!.hero, underlineAccent: e.target.value },
                              },
                            })
                          }
                          placeholder="Đồng Hành Bứt Phá!"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-amber-600 dark:text-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nhãn Vầng Sáng Sunburst Trên Tiêu Đề
                        </label>
                        <input
                          type="text"
                          value={editItem.startupConfig.hero?.sunburstText || ""}
                          onChange={(e) =>
                            setEditItem({
                              ...editItem,
                              startupConfig: {
                                ...editItem.startupConfig!,
                                hero: { ...editItem.startupConfig!.hero, sunburstText: e.target.value },
                              },
                            })
                          }
                          placeholder="CEO HN10 ECOSYSTEM"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Đoạn Phụ Đề Hero (Sub-headline)
                    </label>
                    <textarea
                      rows={2}
                      value={editItem.startupConfig.hero?.subheadline || ""}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          startupConfig: {
                            ...editItem.startupConfig!,
                            hero: { ...editItem.startupConfig!.hero, subheadline: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* TẢI ẢNH BÀN TAY CẦM ĐIỆN THOẠI */}
                  <div className="p-4 rounded-2xl border border-blue-100 dark:border-blue-950 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Smartphone className="size-4 text-[#003B95]" />
                        <span>Hình Ảnh Bàn Tay Cầm Điện Thoại (Hoặc Mockup App)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditItem({
                            ...editItem,
                            startupConfig: {
                              ...editItem.startupConfig!,
                              hero: {
                                ...editItem.startupConfig!.hero,
                                handPhoneImage: "/images/landing/hand_holding_phone_transparent.png",
                              },
                            },
                          })
                        }
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Khôi phục ảnh bàn tay chuẩn Pinterest mặc định
                      </button>
                    </div>

                    <LandingImageUploadField
                      label="Tải ảnh bàn tay cầm điện thoại từ máy tính (PNG/WebP trong suốt)"
                      value={editItem.startupConfig.hero?.handPhoneImage || "/images/landing/hand_holding_phone_transparent.png"}
                      onChange={(url) =>
                        setEditItem({
                          ...editItem,
                          startupConfig: {
                            ...editItem.startupConfig!,
                            hero: { ...editItem.startupConfig!.hero, handPhoneImage: url },
                          },
                        })
                      }
                      folder="landing"
                      previewAspect="video"
                      helperText="Ảnh hiển thị xoay 3D chân thực khi cuộn trang"
                    />
                  </div>

                  {/* 2 THẺ NỔI 3D (FLOATING BADGES) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                        <Sparkles className="size-3.5" /> Thẻ Nổi 3D Trái (Badge 1)
                      </span>
                      <input
                        type="text"
                        value={editItem.startupConfig.hero?.floatingBadge1?.title || ""}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            startupConfig: {
                              ...editItem.startupConfig!,
                              hero: {
                                ...editItem.startupConfig!.hero,
                                floatingBadge1: { ...editItem.startupConfig!.hero.floatingBadge1, title: e.target.value },
                              },
                            },
                          })
                        }
                        placeholder="500+ Doanh Nghiệp"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={editItem.startupConfig.hero?.floatingBadge1?.subtitle || ""}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            startupConfig: {
                              ...editItem.startupConfig!,
                              hero: {
                                ...editItem.startupConfig!.hero,
                                floatingBadge1: { ...editItem.startupConfig!.hero.floatingBadge1, subtitle: e.target.value },
                              },
                            },
                          })
                        }
                        placeholder="Học viên chính thức"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-500"
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Sparkles className="size-3.5" /> Thẻ Nổi 3D Phải (Badge 2)
                      </span>
                      <input
                        type="text"
                        value={editItem.startupConfig.hero?.floatingBadge2?.title || ""}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            startupConfig: {
                              ...editItem.startupConfig!,
                              hero: {
                                ...editItem.startupConfig!.hero,
                                floatingBadge2: { ...editItem.startupConfig!.hero.floatingBadge2, title: e.target.value },
                              },
                            },
                          })
                        }
                        placeholder="+105.8 Tỷ VNĐ"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={editItem.startupConfig.hero?.floatingBadge2?.subtitle || ""}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            startupConfig: {
                              ...editItem.startupConfig!,
                              hero: {
                                ...editItem.startupConfig!.hero,
                                floatingBadge2: { ...editItem.startupConfig!.hero.floatingBadge2, subtitle: e.target.value },
                              },
                            },
                          })
                        }
                        placeholder="Giao thương B2B hoàn tất"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Nút bấm CTA & Video */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nút Kêu Gọi Chính (CTA Primary)
                      </label>
                      <input
                        type="text"
                        value={editItem.startupConfig.hero?.ctaPrimaryText || ""}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            startupConfig: {
                              ...editItem.startupConfig!,
                              hero: { ...editItem.startupConfig!.hero, ctaPrimaryText: e.target.value },
                            },
                          })
                        }
                        placeholder="Tải Ứng Dụng Ngay"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Đường Dẫn Video Giới Thiệu (MP4 / YouTube URL)
                      </label>
                      <input
                        type="text"
                        value={editItem.startupConfig.hero?.videoUrl || ""}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            startupConfig: {
                              ...editItem.startupConfig!,
                              hero: { ...editItem.startupConfig!.hero, videoUrl: e.target.value },
                            },
                          })
                        }
                        placeholder="https://v1.pinimg.com/videos/..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= MẪU 2: TAB 2 - RUY-BĂNG & 4 TAB APP ================= */}
              {activeBuilderTab === "m2_ribbon_tabs" && editItem.startupConfig && (
                <div className="space-y-6 max-w-4xl">
                  {/* 4 Khối Chỉ Số Ruy-Băng Xanh Hoàng Gia */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Sliders className="size-4 text-[#003B95]" />
                      <span>Dải Ruy-Băng Thống Kê Xanh Hoàng Gia (4 Khối Chỉ Số)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {(editItem.startupConfig.ribbonStats || []).map((stat, idx) => (
                        <div key={idx} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                          <span className="text-[10px] font-black text-[#003B95] dark:text-blue-400 uppercase">
                            Chỉ Số #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={stat.value}
                            onChange={(e) => {
                              const copy = [...editItem.startupConfig!.ribbonStats];
                              copy[idx].value = e.target.value;
                              setEditItem({ ...editItem, startupConfig: { ...editItem.startupConfig!, ribbonStats: copy } });
                            }}
                            placeholder="15+"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-black text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={stat.label}
                            onChange={(e) => {
                              const copy = [...editItem.startupConfig!.ribbonStats];
                              copy[idx].label = e.target.value;
                              setEditItem({ ...editItem, startupConfig: { ...editItem.startupConfig!, ribbonStats: copy } });
                            }}
                            placeholder="Năm Gắn Kết"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          />
                          <input
                            type="text"
                            value={stat.desc}
                            onChange={(e) => {
                              const copy = [...editItem.startupConfig!.ribbonStats];
                              copy[idx].desc = e.target.value;
                              setEditItem({ ...editItem, startupConfig: { ...editItem.startupConfig!, ribbonStats: copy } });
                            }}
                            placeholder="Đồng hành cùng HanoiBA"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cấu Hình 4 Tab Mô Phỏng App */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Smartphone className="size-4 text-[#003B95]" />
                        <span>Dữ Liệu 4 Phân Hệ Mô Phỏng Màn Hình App</span>
                      </h4>

                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {(["b2b", "connect", "card", "analytics"] as const).map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveAppTabEdit(tab)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${activeAppTabEdit === tab
                                ? "bg-[#003B95] text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                              }`}
                          >
                            {tab === "b2b" && "1. Sàn B2B"}
                            {tab === "connect" && "2. Lịch 1-on-1"}
                            {tab === "card" && "3. Thẻ QR"}
                            {tab === "analytics" && "4. Thống Kê"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chi tiết nội dung của tab đang chọn */}
                    {(() => {
                      const curTabObj = editItem.startupConfig.appTabs[activeAppTabEdit];
                      return (
                        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Tiêu Đề Tab
                              </label>
                              <input
                                type="text"
                                value={curTabObj?.title || ""}
                                onChange={(e) => {
                                  const updated = { ...editItem.startupConfig!.appTabs };
                                  updated[activeAppTabEdit].title = e.target.value;
                                  setEditItem({ ...editItem, startupConfig: { ...editItem.startupConfig!, appTabs: updated } });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Nhãn Chỉ Số Nổi Bật (Stat)
                              </label>
                              <input
                                type="text"
                                value={curTabObj?.stat || ""}
                                onChange={(e) => {
                                  const updated = { ...editItem.startupConfig!.appTabs };
                                  updated[activeAppTabEdit].stat = e.target.value;
                                  setEditItem({ ...editItem, startupConfig: { ...editItem.startupConfig!, appTabs: updated } });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-amber-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Đoạn Mô Tả Ngắn
                              </label>
                              <input
                                type="text"
                                value={curTabObj?.desc || ""}
                                onChange={(e) => {
                                  const updated = { ...editItem.startupConfig!.appTabs };
                                  updated[activeAppTabEdit].desc = e.target.value;
                                  setEditItem({ ...editItem, startupConfig: { ...editItem.startupConfig!, appTabs: updated } });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                              />
                            </div>
                          </div>

                          {/* 3 Mục Item Mẫu Trong Màn Hình App */}
                          <div className="space-y-2 pt-2">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              3 Mục Dữ Liệu Hiển Thị Mẫu Trong Màn Hình Điện Thoại:
                            </span>
                            {(curTabObj?.items || []).map((it, iIdx) => (
                              <div key={iIdx} className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <input
                                  type="text"
                                  value={it.name}
                                  onChange={(e) => {
                                    const updated = { ...editItem.startupConfig!.appTabs };
                                    updated[activeAppTabEdit].items[iIdx].name = e.target.value;
                                    setEditItem({ ...editItem, startupConfig: { ...editItem.startupConfig!, appTabs: updated } });
                                  }}
                                  placeholder="Tên sản phẩm / Cuộc hẹn"
                                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold truncate"
                                />
                                <input
                                  type="text"
                                  value={it.price}
                                  onChange={(e) => {
                                    const updated = { ...editItem.startupConfig!.appTabs };
                                    updated[activeAppTabEdit].items[iIdx].price = e.target.value;
                                    setEditItem({ ...editItem, startupConfig: { ...editItem.startupConfig!, appTabs: updated } });
                                  }}
                                  placeholder="Giá trị / Thời gian"
                                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 font-bold truncate"
                                />
                                <input
                                  type="text"
                                  value={it.author}
                                  onChange={(e) => {
                                    const updated = { ...editItem.startupConfig!.appTabs };
                                    updated[activeAppTabEdit].items[iIdx].author = e.target.value;
                                    setEditItem({ ...editItem, startupConfig: { ...editItem.startupConfig!, appTabs: updated } });
                                  }}
                                  placeholder="Đơn vị cung cấp / Địa điểm"
                                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 truncate"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ================= MẪU 2: TAB 3 - ĐIỂM CẦU BẢN ĐỒ ================= */}
              {activeBuilderTab === "m2_map" && editItem.startupConfig && (
                <div className="space-y-4 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className="size-4 text-[#003B95]" />
                        <span>Danh Sách Chi Hội &amp; Điểm Cầu Trên Bản Đồ Chấm</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Các điểm ghim nhấp nháy phát xung (Pulsing Pins) hiển thị trực tiếp trên bản đồ mạng lưới toàn quốc
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `pin-${Date.now().toString().slice(-4)}`;
                        const newPin = {
                          id: newId,
                          name: "Chi Hội Mới",
                          count: "50+ Học viên",
                          desc: "Địa chỉ trụ sở / Cụm công nghiệp",
                          x: "50%",
                          y: "50%",
                        };
                        setEditItem({
                          ...editItem,
                          startupConfig: {
                            ...editItem.startupConfig!,
                            mapChapterPins: [...(editItem.startupConfig!.mapChapterPins || []), newPin],
                          },
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#003B95] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="size-3.5" />
                      <span>Thêm Điểm Cầu</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(editItem.startupConfig.mapChapterPins || []).map((pin, idx) => (
                      <div key={pin.id || idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-[#003B95] dark:text-blue-400 font-bold">
                            Điểm cầu #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = editItem.startupConfig!.mapChapterPins.filter((_, i) => i !== idx);
                              setEditItem({
                                ...editItem,
                                startupConfig: { ...editItem.startupConfig!, mapChapterPins: copy },
                              });
                            }}
                            className="size-7 grid place-items-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Tên Chi Hội / Điểm Cầu
                            </label>
                            <input
                              type="text"
                              value={pin.name}
                              onChange={(e) => {
                                const copy = [...editItem.startupConfig!.mapChapterPins];
                                copy[idx].name = e.target.value;
                                setEditItem({
                                  ...editItem,
                                  startupConfig: { ...editItem.startupConfig!, mapChapterPins: copy },
                                });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Quy Mô Học viên
                            </label>
                            <input
                              type="text"
                              value={pin.count}
                              onChange={(e) => {
                                const copy = [...editItem.startupConfig!.mapChapterPins];
                                copy[idx].count = e.target.value;
                                setEditItem({
                                  ...editItem,
                                  startupConfig: { ...editItem.startupConfig!, mapChapterPins: copy },
                                });
                              }}
                              placeholder="1.250+ Học viên"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-amber-600"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Tọa Độ X (%)
                              </label>
                              <input
                                type="text"
                                value={pin.x}
                                onChange={(e) => {
                                  const copy = [...editItem.startupConfig!.mapChapterPins];
                                  copy[idx].x = e.target.value;
                                  setEditItem({
                                    ...editItem,
                                    startupConfig: { ...editItem.startupConfig!, mapChapterPins: copy },
                                  });
                                }}
                                placeholder="48%"
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Tọa Độ Y (%)
                              </label>
                              <input
                                type="text"
                                value={pin.y}
                                onChange={(e) => {
                                  const copy = [...editItem.startupConfig!.mapChapterPins];
                                  copy[idx].y = e.target.value;
                                  setEditItem({
                                    ...editItem,
                                    startupConfig: { ...editItem.startupConfig!, mapChapterPins: copy },
                                  });
                                }}
                                placeholder="22%"
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Địa Chỉ Trụ Sở / Khu Công Nghiệp
                          </label>
                          <input
                            type="text"
                            value={pin.desc}
                            onChange={(e) => {
                              const copy = [...editItem.startupConfig!.mapChapterPins];
                              copy[idx].desc = e.target.value;
                              setEditItem({
                                ...editItem,
                                startupConfig: { ...editItem.startupConfig!, mapChapterPins: copy },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= MẪU 2: TAB 4 - CỘNG ĐỒNG AVATARS 3D ================= */}
              {activeBuilderTab === "m2_avatars" && editItem.startupConfig && (
                <div className="space-y-4 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="size-4 text-[#003B95]" />
                        <span>Nhân Vật Nổi 3D Cộng Đồng (Floating Avatars)</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Tải ảnh đại diện trực tiếp từ máy tính lên cho từng nhân vật lãnh đạo, trôi bồng bềnh kèm bóng thoại
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `avt-${Date.now().toString().slice(-4)}`;
                        const newAvt = {
                          id: newId,
                          name: "Lãnh Đạo Học viên",
                          role: "CEO Doanh Nghiệp",
                          quote: "Kết nối kiến tạo giá trị",
                          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                          badge: "LinkedIn" as const,
                          x: "50%",
                          y: "50%",
                        };
                        setEditItem({
                          ...editItem,
                          startupConfig: {
                            ...editItem.startupConfig!,
                            communityAvatars: [...(editItem.startupConfig!.communityAvatars || []), newAvt],
                          },
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#003B95] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="size-3.5" />
                      <span>Thêm Nhân Vật</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(editItem.startupConfig.communityAvatars || []).map((avt, idx) => (
                      <div key={avt.id || idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold">
                            Avatar #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = editItem.startupConfig!.communityAvatars.filter((_, i) => i !== idx);
                              setEditItem({
                                ...editItem,
                                startupConfig: { ...editItem.startupConfig!, communityAvatars: copy },
                              });
                            }}
                            className="size-7 grid place-items-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        {/* TẢI ẢNH AVATAR */}
                        <LandingImageUploadField
                          label="Ảnh Đại Diện Avatar (Tải ảnh lên từ máy tính)"
                          value={avt.avatar}
                          onChange={(url) => {
                            const copy = [...editItem.startupConfig!.communityAvatars];
                            copy[idx].avatar = url;
                            setEditItem({
                              ...editItem,
                              startupConfig: { ...editItem.startupConfig!, communityAvatars: copy },
                            });
                          }}
                          previewAspect="square"
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Họ Và Tên
                            </label>
                            <input
                              type="text"
                              value={avt.name}
                              onChange={(e) => {
                                const copy = [...editItem.startupConfig!.communityAvatars];
                                copy[idx].name = e.target.value;
                                setEditItem({
                                  ...editItem,
                                  startupConfig: { ...editItem.startupConfig!, communityAvatars: copy },
                                });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Mạng Xã Hội (Badge)
                            </label>
                            <select
                              value={avt.badge}
                              onChange={(e) => {
                                const copy = [...editItem.startupConfig!.communityAvatars];
                                copy[idx].badge = e.target.value as any;
                                setEditItem({
                                  ...editItem,
                                  startupConfig: { ...editItem.startupConfig!, communityAvatars: copy },
                                });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                            >
                              <option value="LinkedIn">LinkedIn</option>
                              <option value="Zalo">Zalo</option>
                              <option value="TikTok">TikTok</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Chức Danh &amp; Doanh Nghiệp
                          </label>
                          <input
                            type="text"
                            value={avt.role}
                            onChange={(e) => {
                              const copy = [...editItem.startupConfig!.communityAvatars];
                              copy[idx].role = e.target.value;
                              setEditItem({
                                ...editItem,
                                startupConfig: { ...editItem.startupConfig!, communityAvatars: copy },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Lời Trích Dẫn Nổi Bật (Quote)
                          </label>
                          <input
                            type="text"
                            value={avt.quote}
                            onChange={(e) => {
                              const copy = [...editItem.startupConfig!.communityAvatars];
                              copy[idx].quote = e.target.value;
                              setEditItem({
                                ...editItem,
                                startupConfig: { ...editItem.startupConfig!, communityAvatars: copy },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs italic"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= MẪU 2: TAB 5 - ĐÁNH GIÁ & FAQ ================= */}
              {activeBuilderTab === "m2_testimonials_faq" && editItem.startupConfig && (
                <div className="space-y-6 max-w-4xl">
                  {/* BĂNG CHUYỀN ĐÁNH GIÁ Học viên */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="size-4 text-[#003B95]" />
                        <span>Băng Chuyền Đánh Giá Học viên (Testimonials Carousel)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newTestimonial = {
                            id: `test-${Date.now().toString().slice(-4)}`,
                            quote: "CEO HN10 mang đến cơ hội kết nối giao thương tuyệt vời...",
                            author: "Doanh Nhân Học viên",
                            role: "Tổng Giám Đốc",
                            company: "Học viên CLB",
                            rating: 5,
                            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                          };
                          setEditItem({
                            ...editItem,
                            startupConfig: {
                              ...editItem.startupConfig!,
                              testimonials: [...(editItem.startupConfig!.testimonials || []), newTestimonial],
                            },
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#003B95] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="size-3.5" />
                        <span>Thêm Đánh Giá</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(editItem.startupConfig.testimonials || []).map((item, idx) => (
                        <div key={item.id || idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold">
                              Đánh giá #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = editItem.startupConfig!.testimonials.filter((_, i) => i !== idx);
                                setEditItem({
                                  ...editItem,
                                  startupConfig: { ...editItem.startupConfig!, testimonials: copy },
                                });
                              }}
                              className="size-7 grid place-items-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          {/* TẢI ẢNH ĐẠI DIỆN Học viên */}
                          <LandingImageUploadField
                            label="Ảnh Đại Diện Học viên Đánh Giá (Tải ảnh lên)"
                            value={item.avatar}
                            onChange={(url) => {
                              const copy = [...editItem.startupConfig!.testimonials];
                              copy[idx].avatar = url;
                              setEditItem({
                                ...editItem,
                                startupConfig: { ...editItem.startupConfig!, testimonials: copy },
                              });
                            }}
                            previewAspect="square"
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Họ Tên Học viên
                              </label>
                              <input
                                type="text"
                                value={item.author}
                                onChange={(e) => {
                                  const copy = [...editItem.startupConfig!.testimonials];
                                  copy[idx].author = e.target.value;
                                  setEditItem({
                                    ...editItem,
                                    startupConfig: { ...editItem.startupConfig!, testimonials: copy },
                                  });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Chức Vụ &amp; Ban Điều Hành
                              </label>
                              <input
                                type="text"
                                value={item.role}
                                onChange={(e) => {
                                  const copy = [...editItem.startupConfig!.testimonials];
                                  copy[idx].role = e.target.value;
                                  setEditItem({
                                    ...editItem,
                                    startupConfig: { ...editItem.startupConfig!, testimonials: copy },
                                  });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Đánh Giá Sao (1 - 5 Sao)
                              </label>
                              <select
                                value={item.rating || 5}
                                onChange={(e) => {
                                  const copy = [...editItem.startupConfig!.testimonials];
                                  copy[idx].rating = Number(e.target.value);
                                  setEditItem({
                                    ...editItem,
                                    startupConfig: { ...editItem.startupConfig!, testimonials: copy },
                                  });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-amber-500"
                              >
                                <option value={5}>⭐⭐⭐⭐⭐ (5 Sao)</option>
                                <option value={4}>⭐⭐⭐⭐ (4 Sao)</option>
                                <option value={3}>⭐⭐⭐ (3 Sao)</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Nội Dung Nhận Xét Đánh Giá
                            </label>
                            <textarea
                              rows={2}
                              value={item.quote}
                              onChange={(e) => {
                                const copy = [...editItem.startupConfig!.testimonials];
                                copy[idx].quote = e.target.value;
                                setEditItem({
                                  ...editItem,
                                  startupConfig: { ...editItem.startupConfig!, testimonials: copy },
                                });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs italic"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DANH SÁCH HỎI ĐÁP FAQ */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <HelpCircle className="size-4 text-[#003B95]" />
                        <span>Danh Sách Hỏi Đáp Thường Gặp (FAQ Accordion)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newFaq = {
                            question: "Câu hỏi thường gặp mới?",
                            answer: "Câu trả lời giải thích chi tiết cho Học viên...",
                          };
                          setEditItem({
                            ...editItem,
                            startupConfig: {
                              ...editItem.startupConfig!,
                              faqs: [...(editItem.startupConfig!.faqs || []), newFaq],
                            },
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#003B95] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="size-3.5" />
                        <span>Thêm Câu Hỏi</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(editItem.startupConfig.faqs || []).map((faq, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-[#003B95] dark:text-blue-400 font-bold">
                              FAQ #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = editItem.startupConfig!.faqs.filter((_, i) => i !== idx);
                                setEditItem({
                                  ...editItem,
                                  startupConfig: { ...editItem.startupConfig!, faqs: copy },
                                });
                              }}
                              className="size-6 grid place-items-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded cursor-pointer"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => {
                              const copy = [...editItem.startupConfig!.faqs];
                              copy[idx].question = e.target.value;
                              setEditItem({
                                ...editItem,
                                startupConfig: { ...editItem.startupConfig!, faqs: copy },
                              });
                            }}
                            placeholder="Nhập câu hỏi..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                          />
                          <textarea
                            rows={2}
                            value={faq.answer}
                            onChange={(e) => {
                              const copy = [...editItem.startupConfig!.faqs];
                              copy[idx].answer = e.target.value;
                              setEditItem({
                                ...editItem,
                                startupConfig: { ...editItem.startupConfig!, faqs: copy },
                              });
                            }}
                            placeholder="Nhập câu trả lời..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* THÔNG TIN CHÂN TRANG FOOTER */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Thông Tin Chân Trang (Footer Liên Hệ)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Tiêu Đề Thương Hiệu Footer
                        </label>
                        <input
                          type="text"
                          value={editItem.startupConfig.footer?.headline || ""}
                          onChange={(e) =>
                            setEditItem({
                              ...editItem,
                              startupConfig: {
                                ...editItem.startupConfig!,
                                footer: { ...editItem.startupConfig!.footer, headline: e.target.value },
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Hotline Liên Hệ
                        </label>
                        <input
                          type="text"
                          value={editItem.startupConfig.footer?.contactPhone || ""}
                          onChange={(e) =>
                            setEditItem({
                              ...editItem,
                              startupConfig: {
                                ...editItem.startupConfig!,
                                footer: { ...editItem.startupConfig!.footer, contactPhone: e.target.value },
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Email Tiếp Nhận
                        </label>
                        <input
                          type="text"
                          value={editItem.startupConfig.footer?.contactEmail || ""}
                          onChange={(e) =>
                            setEditItem({
                              ...editItem,
                              startupConfig: {
                                ...editItem.startupConfig!,
                                footer: { ...editItem.startupConfig!.footer, contactEmail: e.target.value },
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Địa Chỉ Trụ Sở Chính
                        </label>
                        <input
                          type="text"
                          value={editItem.startupConfig.footer?.address || ""}
                          onChange={(e) =>
                            setEditItem({
                              ...editItem,
                              startupConfig: {
                                ...editItem.startupConfig!,
                                footer: { ...editItem.startupConfig!.footer, address: e.target.value },
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= MẪU 1: TAB 1 - TỔNG QUAN & BRAND ================= */}
              {activeBuilderTab === "general" && (
                <div className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Landing Web</label>
                      <input
                        type="text"
                        value={editItem.name || ""}
                        onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Slug URL</label>
                      <input
                        type="text"
                        value={editItem.slug || ""}
                        onChange={(e) => setEditItem({ ...editItem, slug: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Logo Thương Hiệu Text</label>
                      <input
                        type="text"
                        value={editItem.brand?.logoText || ""}
                        onChange={(e) => setEditItem({ ...editItem, brand: { ...editItem.brand, logoText: e.target.value } })}
                        placeholder="Globe Express hoặc CEO HN10"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Màu Chủ Đạo (Accent Color)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editItem.theme?.primaryColor || "#ecad29"}
                          onChange={(e) => setEditItem({ ...editItem, theme: { ...editItem.theme!, primaryColor: e.target.value } })}
                          className="size-8 rounded-lg cursor-pointer border border-slate-200"
                        />
                        <input
                          type="text"
                          value={editItem.theme?.primaryColor || "#ecad29"}
                          onChange={(e) => setEditItem({ ...editItem, theme: { ...editItem.theme!, primaryColor: e.target.value } })}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setEditItem({ ...editItem, theme: { ...editItem.theme!, primaryColor: "#ecad29" } })}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-500 text-[10px] font-bold"
                        >
                          Gold
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditItem({ ...editItem, theme: { ...editItem.theme!, primaryColor: "#003B95" } })}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 text-blue-600 text-[10px] font-bold"
                        >
                          Navy
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TẢI ẢNH LOGO THƯƠNG HIỆU */}
                  <LandingImageUploadField
                    label="Tải Ảnh Logo Thương Hiệu Lên (Tùy Chọn)"
                    value={editItem.brand?.logoUrl || ""}
                    onChange={(url) =>
                      setEditItem({
                        ...editItem,
                        brand: {
                          logoText: editItem.brand?.logoText || "",
                          ...editItem.brand,
                          logoUrl: url,
                        },
                      })
                    }
                    previewAspect="square"
                    helperText="Hỗ trợ tải trực tiếp ảnh PNG/WebP/SVG từ máy tính"
                  />

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="pub-toggle"
                      checked={editItem.isPublished}
                      onChange={(e) => setEditItem({ ...editItem, isPublished: e.target.checked })}
                      className="size-4 rounded text-[#003B95]"
                    />
                    <label htmlFor="pub-toggle" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Kích hoạt xuất bản công khai trang này
                    </label>
                  </div>

                  {/* CÀI ĐẶT THỜI GIAN ĐẾM VOTING (BẮT ĐẦU - KẾT THÚC) */}
                  <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="size-4 text-amber-500" />
                        <span>Cấu Hình Thời Gian Mở Cổng &amp; Đếm Lượt Bình Chọn (Voting Time Window)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                        Mỗi người chỉ được vote 1 lần duy nhất
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Khi bấm <strong>"Áp dụng &amp; Xuất bản QR"</strong>, Landing Page sẽ chạy công khai và hệ thống chỉ đếm lượt người bình chọn trong khung thời gian đã thiết lập dưới đây:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Thời gian Bắt Đầu Tính Lượt Vote
                        </label>
                        <input
                          type="datetime-local"
                          value={(editItem.votingStartAt || "").slice(0, 16)}
                          onChange={(e) => setEditItem({ ...editItem, votingStartAt: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Thời gian Kết Thúc Đóng Cổng Vote
                        </label>
                        <input
                          type="datetime-local"
                          value={(editItem.votingEndAt || "").slice(0, 16)}
                          onChange={(e) => setEditItem({ ...editItem, votingEndAt: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CÂY MENU PHÂN CẤP */}
              {activeBuilderTab === "tree_menu" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">Cấu Trúc Menu Đa Tầng</h4>
                      <p className="text-xs text-slate-400">
                        Bấm vào menu trên Header sẽ mở danh mục con dạng cây (Tree). Người dùng bấm vào từng mục con có thể mở Màn Con (Modal) hoặc link ngoài.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `m-${Date.now().toString().slice(-4)}`;
                        const newMenu: LandingMenuItem = {
                          id: newId,
                          label: "Menu Mới",
                          type: "tree_dropdown",
                          children: [
                            { id: `${newId}-1`, label: "Mục con 1", type: "link", url: "#" },
                          ],
                        };
                        setEditItem({ ...editItem, navMenu: [...(editItem.navMenu || []), newMenu] });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#003B95] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Thêm Menu Cha</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(editItem.navMenu || []).map((item, pIdx) => (
                      <div key={item.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="size-6 rounded-lg bg-amber-500/20 text-amber-500 text-xs font-black grid place-items-center">
                              {pIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => {
                                const copy = [...editItem.navMenu];
                                copy[pIdx].label = e.target.value;
                                setEditItem({ ...editItem, navMenu: copy });
                              }}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white flex-1"
                              placeholder="Tiêu đề menu cha"
                            />
                            <select
                              value={item.type || "link"}
                              onChange={(e) => {
                                const copy = [...editItem.navMenu];
                                copy[pIdx].type = e.target.value as any;
                                setEditItem({ ...editItem, navMenu: copy });
                              }}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
                            >
                              <option value="tree_dropdown">Dạng Cây (Tree Dropdown)</option>
                              <option value="link">Liên kết ngoài (Link)</option>
                              <option value="modal_screen">Mở Màn Con (Modal)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const childId = `${item.id}-${Date.now().toString().slice(-3)}`;
                                const copy = [...editItem.navMenu];
                                if (!copy[pIdx].children) copy[pIdx].children = [];
                                copy[pIdx].children!.push({
                                  id: childId,
                                  label: "Nhánh Con Mới",
                                  type: "modal_screen",
                                  subScreenId: editItem.subScreens?.[0]?.id,
                                });
                                setEditItem({ ...editItem, navMenu: copy });
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="size-3" />
                              <span>Thêm Nhánh Con</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = editItem.navMenu.filter((_, idx) => idx !== pIdx);
                                setEditItem({ ...editItem, navMenu: copy });
                              }}
                              className="size-7 grid place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Danh sách nhánh con (Children Nodes) */}
                        {item.children && item.children.length > 0 && (
                          <div className="ml-8 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-2">
                            {item.children.map((child, cIdx) => (
                              <div key={child.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="size-1.5 rounded-full bg-amber-400" />
                                  <input
                                    type="text"
                                    value={child.label}
                                    onChange={(e) => {
                                      const copy = [...editItem.navMenu];
                                      copy[pIdx].children![cIdx].label = e.target.value;
                                      setEditItem({ ...editItem, navMenu: copy });
                                    }}
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-semibold text-slate-800 dark:text-white flex-1"
                                    placeholder="Tên nhánh con"
                                  />
                                  <input
                                    type="text"
                                    value={child.badge || ""}
                                    onChange={(e) => {
                                      const copy = [...editItem.navMenu];
                                      copy[pIdx].children![cIdx].badge = e.target.value;
                                      setEditItem({ ...editItem, navMenu: copy });
                                    }}
                                    placeholder="Badge (ví dụ: Hot)"
                                    className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-[11px] text-amber-500 font-bold"
                                  />
                                  <select
                                    value={child.subScreenId || ""}
                                    onChange={(e) => {
                                      const copy = [...editItem.navMenu];
                                      copy[pIdx].children![cIdx].subScreenId = e.target.value;
                                      copy[pIdx].children![cIdx].type = "modal_screen";
                                      setEditItem({ ...editItem, navMenu: copy });
                                    }}
                                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs text-slate-600 dark:text-slate-300"
                                  >
                                    <option value="">-- Mở Màn Con (Modal) --</option>
                                    {(editItem.subScreens || []).map((scr) => (
                                      <option key={scr.id} value={scr.id}>
                                        Màn con: {scr.title}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = [...editItem.navMenu];
                                    copy[pIdx].children = copy[pIdx].children!.filter((_, idx) => idx !== cIdx);
                                    setEditItem({ ...editItem, navMenu: copy });
                                  }}
                                  className="size-6 grid place-items-center text-rose-400 hover:text-rose-600 cursor-pointer"
                                >
                                  <X className="size-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: THẺ TRÌNH DIỄN (7 VIDEO SLIDES & VOTING OPTIONS) */}
              {activeBuilderTab === "slides" && (
                <div className="space-y-4">
                  {/* Khung cài đặt thời gian đếm người bình chọn nhanh ngay tại tab Slides */}
                  <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-amber-500" />
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          Thiết Lập Thời Gian Đếm Người Bình Chọn Video (Voting Schedule)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const ensured7: LandingSlide[] = [];
                          for (let i = 0; i < 7; i++) {
                            const cur = editItem.slides?.[i] || DEFAULT_VIDEO_VOTING_7_SLIDES[i];
                            ensured7.push({
                              ...DEFAULT_VIDEO_VOTING_7_SLIDES[i],
                              ...cur,
                              id: cur.id || `vslide-${i + 1}`,
                              votingOptions:
                                Array.isArray(cur.votingOptions) && cur.votingOptions.length > 0
                                  ? cur.votingOptions
                                  : JSON.parse(JSON.stringify(DEFAULT_VIDEO_VOTING_7_SLIDES[i].votingOptions)),
                            });
                          }
                          setEditItem({ ...editItem, slides: ensured7 });
                          toast.success("Đã chuẩn hóa đủ 7 màn trình chiếu Video & Lựa chọn Voting!");
                        }}
                        className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black cursor-pointer hover:bg-amber-400 transition"
                      >
                        Chuẩn Hóa Đủ 7 Màn Video Trượt Ngang
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Bắt đầu mở bình chọn (Start Time)
                        </label>
                        <input
                          type="datetime-local"
                          value={(editItem.votingStartAt || "").slice(0, 16)}
                          onChange={(e) => setEditItem({ ...editItem, votingStartAt: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Kết thúc đóng bình chọn (End Time)
                        </label>
                        <input
                          type="datetime-local"
                          value={(editItem.votingEndAt || "").slice(0, 16)}
                          onChange={(e) => setEditItem({ ...editItem, votingEndAt: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Danh Sách {editItem.slides?.length || 0} Màn Video Trượt Ngang &amp; Cấu Hình Lựa Chọn Voting
                      </h4>
                      <p className="text-xs text-slate-400">
                        Mỗi màn tương ứng 1 video trượt ngang cho 1 slide. Hỗ trợ tải video trực tiếp từ máy tính và cấu hình các lựa chọn voting ngay bên dưới mỗi video.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextNum = (editItem.slides?.length || 0) + 1;
                        const newSlide: LandingSlide = {
                          id: `vslide-${Date.now().toString().slice(-4)}`,
                          place: `MÀN 0${nextNum} • VIDEO SHOWCASE`,
                          title1: `VIDEO MÀN 0${nextNum}`,
                          title2: "TRÌNH CHIẾU",
                          description: "Mô tả nội dung màn trình chiếu video mới.",
                          image: "https://assets.codepen.io/3685267/timed-cards-1.jpg",
                          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4",
                          ctaText: "Bình Chọn Ngay",
                          votingQuestion: `Bạn đánh giá thế nào về Video Màn 0${nextNum}?`,
                          votingOptions: [
                            { id: `v${nextNum}-opt-1`, label: "Lựa chọn 1: Xuất sắc & Ấn tượng nhất", description: "Nội dung truyền tải đắt giá" },
                            { id: `v${nextNum}-opt-2`, label: "Lựa chọn 2: Sáng tạo & Đột phá", description: "Hình ảnh và thông điệp mới mẻ" },
                            { id: `v${nextNum}-opt-3`, label: "Lựa chọn 3: Giàu giá trị thực tiễn", description: "Ứng dụng cao cho doanh nghiệp" },
                          ],
                        };
                        setEditItem({ ...editItem, slides: [...(editItem.slides || []), newSlide] });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#003B95] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Thêm Màn Video</span>
                    </button>
                  </div>

                  <div className="space-y-5">
                    {(editItem.slides || []).map((slide, sIdx) => (
                      <div key={slide.id} className="p-4 sm:p-5 rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black shrink-0">
                            MÀN 0{sIdx + 1} / {editItem.slides.length}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Nhãn phụ đề (Place / Tag)</label>
                              <input
                                type="text"
                                value={slide.place}
                                onChange={(e) => {
                                  const copy = [...editItem.slides];
                                  copy[sIdx].place = e.target.value;
                                  setEditItem({ ...editItem, slides: copy });
                                }}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Tiêu đề chính 1 (Title 1)</label>
                              <input
                                type="text"
                                value={slide.title1}
                                onChange={(e) => {
                                  const copy = [...editItem.slides];
                                  copy[sIdx].title1 = e.target.value;
                                  setEditItem({ ...editItem, slides: copy });
                                }}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black uppercase"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Tiêu đề điểm nhấn 2 (Title 2)</label>
                              <input
                                type="text"
                                value={slide.title2}
                                onChange={(e) => {
                                  const copy = [...editItem.slides];
                                  copy[sIdx].title2 = e.target.value;
                                  setEditItem({ ...editItem, slides: copy });
                                }}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black uppercase"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = editItem.slides.filter((_, idx) => idx !== sIdx);
                              setEditItem({ ...editItem, slides: copy });
                            }}
                            className="size-7 grid place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer shrink-0"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Đoạn Mô Tả Nội Dung Video (Chỉnh sửa text tự do)</label>
                          <textarea
                            rows={2}
                            value={slide.description}
                            onChange={(e) => {
                              const copy = [...editItem.slides];
                              copy[sIdx].description = e.target.value;
                              setEditItem({ ...editItem, slides: copy });
                            }}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>

                        {/* TẢI VIDEO & ẢNH POSTER CHO MÀN SLIDE */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <LandingVideoUploadField
                            label={`Video Trình Chiếu Màn 0${sIdx + 1} (Tải file MP4/WebM/MOV hoặc dán link)`}
                            value={slide.videoUrl || ""}
                            onChange={(url) => {
                              const copy = [...editItem.slides];
                              copy[sIdx].videoUrl = url;
                              setEditItem({ ...editItem, slides: copy });
                            }}
                            helperText="Hỗ trợ tải video trực tiếp lên hệ thống (tối đa 500MB)"
                          />

                          <LandingImageUploadField
                            label={`Ảnh Poster / Thumbnail Màn 0${sIdx + 1}`}
                            value={slide.image}
                            onChange={(url) => {
                              const copy = [...editItem.slides];
                              copy[sIdx].image = url;
                              setEditItem({ ...editItem, slides: copy });
                            }}
                            previewAspect="video"
                          />
                        </div>

                        {/* CẤU HÌNH CÂU HỎI & CÁC LỰA CHỌN VOTING NGAY DƯỚI VIDEO */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              <BarChart3 className="size-4 text-amber-500" />
                              <span>Thiết Lập Phần Voting Ngay Dưới Video Màn 0{sIdx + 1}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = [...editItem.slides];
                                const curOpts = Array.isArray(copy[sIdx].votingOptions) ? [...copy[sIdx].votingOptions!] : [];
                                curOpts.push({
                                  id: `v${sIdx + 1}-opt-${Date.now().toString().slice(-3)}`,
                                  label: `Lựa chọn bình chọn #${curOpts.length + 1}`,
                                  description: "Mô tả ngắn cho phương án bình chọn",
                                });
                                copy[sIdx].votingOptions = curOpts;
                                setEditItem({ ...editItem, slides: copy });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="size-3" />
                              <span>Thêm Lựa Chọn Voting</span>
                            </button>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Câu Hỏi Bình Chọn Hiển Thị Dưới Video
                            </label>
                            <input
                              type="text"
                              value={slide.votingQuestion || ""}
                              onChange={(e) => {
                                const copy = [...editItem.slides];
                                copy[sIdx].votingQuestion = e.target.value;
                                setEditItem({ ...editItem, slides: copy });
                              }}
                              placeholder={`Bạn ấn tượng nhất với điểm nào trong Video Màn 0${sIdx + 1}?`}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="space-y-2">
                            {(slide.votingOptions || []).map((opt, oIdx) => (
                              <div key={opt.id || oIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                <div className="sm:col-span-1 flex items-center gap-1.5">
                                  <span className="size-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black grid place-items-center">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                </div>
                                <div className="sm:col-span-5">
                                  <input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) => {
                                      const copy = [...editItem.slides];
                                      const opts = [...(copy[sIdx].votingOptions || [])];
                                      opts[oIdx] = { ...opts[oIdx], label: e.target.value };
                                      copy[sIdx].votingOptions = opts;
                                      setEditItem({ ...editItem, slides: copy });
                                    }}
                                    placeholder="Tên lựa chọn voting..."
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                                  />
                                </div>
                                <div className="sm:col-span-5">
                                  <input
                                    type="text"
                                    value={opt.description || ""}
                                    onChange={(e) => {
                                      const copy = [...editItem.slides];
                                      const opts = [...(copy[sIdx].votingOptions || [])];
                                      opts[oIdx] = { ...opts[oIdx], description: e.target.value };
                                      copy[sIdx].votingOptions = opts;
                                      setEditItem({ ...editItem, slides: copy });
                                    }}
                                    placeholder="Mô tả phụ (tùy chọn)..."
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300"
                                  />
                                </div>
                                <div className="sm:col-span-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const copy = [...editItem.slides];
                                      copy[sIdx].votingOptions = (copy[sIdx].votingOptions || []).filter((_, i) => i !== oIdx);
                                      setEditItem({ ...editItem, slides: copy });
                                    }}
                                    className="size-7 grid place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                    title="Xóa phương án này"
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: TÍCH HỢP API ĐỘNG */}
              {activeBuilderTab === "api" && (
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Tự Động Nạp Dữ Liệu Từ API</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Khi bật, các slide sẽ tự động được sinh ra từ dữ liệu API thực tế (Cơ hội, Sản phẩm, Sự kiện, v.v.).
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editItem.apiConfig?.enabled ?? false}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          apiConfig: {
                            ...(editItem.apiConfig || {
                              endpointUrl: "/api/opportunities",
                              fieldMapping: {},
                            }),
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="size-5 rounded text-slate-800 dark:text-slate-200 cursor-pointer"
                    />
                  </div>

                  {editItem.apiConfig?.enabled && (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          API Endpoint URL *
                        </label>
                        <input
                          type="text"
                          value={editItem.apiConfig?.endpointUrl || ""}
                          onChange={(e) =>
                            setEditItem({
                              ...editItem,
                              apiConfig: { ...editItem.apiConfig!, endpointUrl: e.target.value },
                            })
                          }
                          placeholder="/api/opportunities hoặc https://api.domain.com/feed"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                        />
                        <p className="text-[10.5px] text-slate-400 mt-1">
                          Hỗ trợ cả endpoint nội bộ hệ thống (ví dụ: <code className="text-amber-500 font-bold">/api/opportunities</code>, <code className="text-amber-500 font-bold">/api/events</code>, <code className="text-amber-500 font-bold">/api/products</code>) hoặc API REST bên ngoài.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phương thức</label>
                          <select
                            value={editItem.apiConfig?.method || "GET"}
                            onChange={(e) =>
                              setEditItem({
                                ...editItem,
                                apiConfig: { ...editItem.apiConfig!, method: e.target.value as any },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mảng Dữ Liệu (Root Path)</label>
                          <input
                            type="text"
                            value={editItem.apiConfig?.rootPath || ""}
                            onChange={(e) =>
                              setEditItem({
                                ...editItem,
                                apiConfig: { ...editItem.apiConfig!, rootPath: e.target.value },
                              })
                            }
                            placeholder="Để trống nếu là mảng gốc hoặc nhập 'data'"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Ánh xạ trường Field Mapping */}
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
                        <h5 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                          Ánh Xạ Trường Dữ Liệu (Field Mapping)
                        </h5>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Trường Địa Điểm / Tổ Chức</label>
                            <input
                              type="text"
                              value={editItem.apiConfig?.fieldMapping?.place || ""}
                              onChange={(e) =>
                                setEditItem({
                                  ...editItem,
                                  apiConfig: {
                                    ...editItem.apiConfig!,
                                    fieldMapping: { ...editItem.apiConfig!.fieldMapping, place: e.target.value },
                                  },
                                })
                              }
                              placeholder="company, location..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Trường Tiêu Đề</label>
                            <input
                              type="text"
                              value={editItem.apiConfig?.fieldMapping?.title1 || ""}
                              onChange={(e) =>
                                setEditItem({
                                  ...editItem,
                                  apiConfig: {
                                    ...editItem.apiConfig!,
                                    fieldMapping: { ...editItem.apiConfig!.fieldMapping, title1: e.target.value },
                                  },
                                })
                              }
                              placeholder="title, name..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Trường Mô Tả</label>
                            <input
                              type="text"
                              value={editItem.apiConfig?.fieldMapping?.description || ""}
                              onChange={(e) =>
                                setEditItem({
                                  ...editItem,
                                  apiConfig: {
                                    ...editItem.apiConfig!,
                                    fieldMapping: { ...editItem.apiConfig!.fieldMapping, description: e.target.value },
                                  },
                                })
                              }
                              placeholder="description, summary..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Trường Link Ảnh</label>
                            <input
                              type="text"
                              value={editItem.apiConfig?.fieldMapping?.image || ""}
                              onChange={(e) =>
                                setEditItem({
                                  ...editItem,
                                  apiConfig: {
                                    ...editItem.apiConfig!,
                                    fieldMapping: { ...editItem.apiConfig!.fieldMapping, image: e.target.value },
                                  },
                                })
                              }
                              placeholder="image, image_url, cover_image..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleTestApiConnector}
                          disabled={testingApi}
                          className="px-4 py-2 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                        >
                          <Play className="size-3.5" />
                          <span>{testingApi ? "Đang gọi thử..." : "Kiểm Tra Kết Nối API Trực Tiếp"}</span>
                        </button>
                      </div>

                      {apiTestResult && (
                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-2">
                          <div className="flex items-center gap-2 text-emerald-600 font-bold">
                            <CheckCircle2 className="size-4" />
                            <span>Kết nối thành công! Đã chuyển đổi {apiTestResult.count} slides.</span>
                          </div>
                          <pre className="p-2 rounded-lg bg-black/40 text-[10.5px] font-mono overflow-x-auto text-amber-300">
                            {JSON.stringify(apiTestResult.sampleSlides?.[0] || {}, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: MÀN CON CHI TIẾT */}
              {activeBuilderTab === "sub_screens" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">Danh Sách Màn Con (Sub-screens)</h4>
                      <p className="text-xs text-slate-400">
                        Các cửa sổ nội dung hiển thị khi người dùng click vào các mục trên cây menu hoặc nút Khám phá.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newScr: LandingSubScreen = {
                          id: `scr-${Date.now().toString().slice(-4)}`,
                          title: "Màn Con Chi Tiết Mới",
                          subtitle: "Phụ đề mô tả ngắn",
                          layout: "article",
                          contentHtml: "<p>Nội dung chi tiết của trang con...</p>",
                        };
                        setEditItem({ ...editItem, subScreens: [...(editItem.subScreens || []), newScr] });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#003B95] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Thêm Màn Con</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(editItem.subScreens || []).map((scr, idx) => (
                      <div key={scr.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                            {scr.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = editItem.subScreens!.filter((_, i) => i !== idx);
                              setEditItem({ ...editItem, subScreens: copy });
                            }}
                            className="size-6 grid place-items-center text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={scr.title}
                            onChange={(e) => {
                              const copy = [...editItem.subScreens!];
                              copy[idx].title = e.target.value;
                              setEditItem({ ...editItem, subScreens: copy });
                            }}
                            placeholder="Tiêu đề màn con"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={scr.subtitle || ""}
                            onChange={(e) => {
                              const copy = [...editItem.subScreens!];
                              copy[idx].subtitle = e.target.value;
                              setEditItem({ ...editItem, subScreens: copy });
                            }}
                            placeholder="Phụ đề ngắn"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400"
                          />
                        </div>

                        <LandingImageUploadField
                          label="Ảnh Minh Họa Màn Con (Subscreen Banner)"
                          value={scr.images?.[0] || ""}
                          onChange={(url) => {
                            const copy = [...editItem.subScreens!];
                            copy[idx].images = url ? [url] : [];
                            setEditItem({ ...editItem, subScreens: copy });
                          }}
                          previewAspect="video"
                        />

                        <div>
                          <textarea
                            rows={3}
                            value={scr.contentHtml || ""}
                            onChange={(e) => {
                              const copy = [...editItem.subScreens!];
                              copy[idx].contentHtml = e.target.value;
                              setEditItem({ ...editItem, subScreens: copy });
                            }}
                            placeholder="Nội dung HTML hoặc văn bản..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs">
              <span className="text-slate-400">ID: {editItem.id}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveDynamicConfig}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <QrCode className="size-4" />
                  <span>Áp Dụng &amp; Xuất Bản Ra Mã QR Công Khai</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL MÃ QR CÔNG KHAI KHI BẤM ÁP DỤNG ================= */}
      {publishedQrItem && (
        <div className="fixed inset-0 z-90 grid place-items-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setPublishedQrItem(null)}
              className="absolute top-4 right-4 size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white grid place-items-center cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider">
              <CheckCircle2 className="size-3.5" />
              <span>Đã Áp Dụng &amp; Public Ra Ngoài</span>
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Quét Mã QR Để Xem &amp; Bình Chọn Landing Page
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bất kỳ ai quét mã QR này đều có thể truy cập trực tiếp vào trang <strong className="text-slate-900 dark:text-white">{publishedQrItem.name}</strong> để xem 7 màn video trượt ngang và tham gia bình chọn (1 người / 1 lượt).
            </p>

            {(() => {
              const pathSlug =
                publishedQrItem.slug ||
                (publishedQrItem.template === "video_voting_showcase" ? "video-voting" : "web-v1");
              const publicUrl =
                typeof window !== "undefined"
                  ? `${window.location.origin}/landing/${pathSlug}`
                  : `https://crm.ceohn10.viconnect.vn/landing/${pathSlug}`;
              const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(
                publicUrl
              )}`;

              return (
                <>
                  <div className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-inner inline-block mx-auto">
                    <img
                      src={qrImgUrl}
                      alt="Landing Page Public QR Code"
                      className="size-56 object-contain mx-auto"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Đường dẫn công khai (Public Link):
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 truncate">
                        {publicUrl}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(publicUrl);
                          toast.success("Đã sao chép đường dẫn Landing Page!");
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>Mở Trang Công Khai</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const item = publishedQrItem;
                        setPublishedQrItem(null);
                        void handleOpenVoteStatsModal(item);
                      }}
                      className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                    >
                      <BarChart3 className="size-3.5" />
                      <span>Thống Kê Voting</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ================= MODAL THỐNG KÊ VOTING VIDEO REALTIME ================= */}
      {statsModalItem && (
        <div className="fixed inset-0 z-90 grid place-items-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 grid place-items-center">
                  <BarChart3 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Màn Thống Kê Voting Video Realtime Theo Tỷ Lệ Lựa Chọn (%)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Trang: <strong className="text-slate-800 dark:text-white">{statsModalItem.name}</strong> • Tổng số người đã bình chọn hợp lệ:{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400">{liveVoteStats?.totalVotes ?? 0} người</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleOpenVoteStatsModal(statsModalItem)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Cập nhật Realtime</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatsModalItem(null)}
                  className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white grid place-items-center cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Tỷ lệ % theo từng màn video */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(liveVoteStats?.slides || statsModalItem.slides || []).map((sl: any, idx: number) => {
                  const slideTitle = sl.slideTitle || `${sl.title1 || ""} ${sl.title2 || ""}`.trim() || `Video Màn 0${idx + 1}`;
                  const totalSlideVotes = sl.totalSlideVotes ?? 0;
                  const options = sl.options || sl.votingOptions || [];
                  return (
                    <div key={sl.slideId || sl.id || idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          Màn 0{idx + 1}: {slideTitle}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-black">
                          {totalSlideVotes} lượt vote
                        </span>
                      </div>
                      <div className="space-y-2">
                        {options.map((opt: any, oIdx: number) => {
                          const pct = opt.percentage ?? 0;
                          const cnt = opt.count ?? 0;
                          return (
                            <div key={opt.optionId || opt.id || oIdx} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-700 dark:text-slate-200">{opt.label}</span>
                                <span className="font-black text-amber-600 dark:text-amber-400">
                                  {pct}% ({cnt} phiếu)
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Danh sách người quét QR đã điền Tên & Email để vote */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Danh Sách Người Quét QR Đã Điền Tên &amp; Email Bình Chọn ({liveVoteStats?.recentVoters?.length || 0})
                </h4>
                {(!liveVoteStats?.recentVoters || liveVoteStats.recentVoters.length === 0) ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    Chưa có lượt bình chọn nào được ghi nhận. Hãy quét mã QR để thử nghiệm bình chọn!
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                          <th className="py-2.5 px-3">Họ và Tên</th>
                          <th className="py-2.5 px-3">Email (Định danh 1 lượt)</th>
                          <th className="py-2.5 px-3">Màn Video</th>
                          <th className="py-2.5 px-3">Phương Án Đã Chọn</th>
                          <th className="py-2.5 px-3">Thời Gian Vote</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {liveVoteStats.recentVoters.map((v: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{v.voterName}</td>
                            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">{v.voterEmail}</td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{v.slideId}</td>
                            <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">{v.optionLabel}</td>
                            <td className="py-2 px-3 text-slate-500">
                              {v.votedAt ? new Date(v.votedAt).toLocaleString("vi-VN") : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CẤU HÌNH ĐƯỜNG DẪN DOMAIN PATH ================= */}
      {subdomainModalItem && (
        <div className="fixed inset-0 z-80 grid place-items-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-[#003B95]/10 text-[#003B95] dark:text-blue-400 grid place-items-center">
                  <Globe className="size-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Cấu Hình Đường Dẫn Domain</h3>
              </div>
              <button
                type="button"
                onClick={() => setSubdomainModalItem(null)}
                className="size-7 grid place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubdomain} className="p-5 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Cấu hình định danh đường dẫn trực tiếp cho trang <strong className="text-slate-800 dark:text-white">{subdomainModalItem.name}</strong> dưới tên miền chính (không cần cấu hình subdomain riêng).
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Đường dẫn Slug (ví dụ: web-v1, web-v2, b2b-connect) *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-mono">
                    crm.ceohn10.viconnect.vn/landing/
                  </span>
                  <input
                    type="text"
                    required
                    value={subdomainInput}
                    onChange={(e) => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="web-v2"
                    className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:border-[#003B95]"
                  />
                </div>
              </div>

              {subdomainInput && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                  <span>URL hoàn chỉnh: </span>
                  <strong className="font-mono">https://crm.ceohn10.viconnect.vn/landing/{subdomainInput}</strong>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSubdomainModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={applyingSubdomain}
                  className="px-5 py-2 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {applyingSubdomain ? "Đang lưu..." : "Lưu Đường Dẫn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN XÓA ================= */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-80 grid place-items-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="size-12 rounded-full bg-rose-500/10 text-rose-500 grid place-items-center mx-auto">
              <AlertCircle className="size-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Xác Nhận Xóa Landing Web?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bạn có chắc chắn muốn xóa Landing Web <strong className="text-slate-800 dark:text-white">"{deleteModalItem.name}"</strong>? Thao tác này sẽ xóa vĩnh viễn cấu hình và gỡ subdomain.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

