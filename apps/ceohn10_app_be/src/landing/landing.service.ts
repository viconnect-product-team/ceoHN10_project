import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LandingVoteOption {
  id: string;
  label: string;
  description?: string;
}

export interface LandingMenuItem {
  id: string;
  label: string;
  active?: boolean;
  icon?: string;
  badge?: string;
  type: 'link' | 'tree_dropdown' | 'modal_screen' | 'api_view';
  url?: string;
  subScreenId?: string;
  children?: LandingMenuItem[];
}

export interface LandingSlide {
  id: string;
  place: string;
  title1: string;
  title2: string;
  description: string;
  image: string;
  videoUrl?: string;
  votingQuestion?: string;
  votingOptions?: LandingVoteOption[];
  bookmarkAction?: string;
  ctaText: string;
  ctaLink?: string;
  ctaType?: 'link' | 'sub_screen';
  ctaSubScreenId?: string;
}

export interface LandingSubScreen {
  id: string;
  title: string;
  subtitle?: string;
  layout: 'article' | 'grid_cards' | 'contact_form' | 'api_feed';
  contentHtml?: string;
  images?: string[];
  apiEndpoint?: string;
  ctaButton?: { label: string; action: string };
}

export interface LandingApiConfig {
  enabled: boolean;
  endpointUrl: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  rootPath?: string;
  fieldMapping: {
    place?: string;
    title1?: string;
    title2?: string;
    description?: string;
    image?: string;
    ctaText?: string;
    ctaLink?: string;
  };
}

export interface StartupMobileTemplateConfig {
  hero: {
    headline: string;
    subheadline: string;
    underlineAccent: string;
    sunburstText?: string;
    handPhoneImage?: string;
    ctaPrimaryText: string;
    ctaPrimaryLink: string;
    ctaSecondaryText: string;
    videoUrl?: string;
    floatingBadge1: {
      title: string;
      subtitle: string;
    };
    floatingBadge2: {
      title: string;
      subtitle: string;
    };
  };
  ribbonStats: Array<{
    value: string;
    label: string;
    desc: string;
  }>;
  appTabs: {
    b2b: {
      title: string;
      desc: string;
      stat: string;
      items: Array<{ name: string; price: string; author: string }>;
    };
    connect: {
      title: string;
      desc: string;
      stat: string;
      items: Array<{ name: string; price: string; author: string }>;
    };
    card: {
      title: string;
      desc: string;
      stat: string;
      items: Array<{ name: string; price: string; author: string }>;
    };
    analytics: {
      title: string;
      desc: string;
      stat: string;
      items: Array<{ name: string; price: string; author: string }>;
    };
  };
  mapChapterPins: Array<{
    id: string;
    name: string;
    count: string;
    desc: string;
    x: string;
    y: string;
  }>;
  communityAvatars: Array<{
    id: string;
    name: string;
    role: string;
    quote: string;
    avatar: string;
    badge: 'Zalo' | 'LinkedIn' | 'TikTok';
    x: string;
    y: string;
  }>;
  testimonials: Array<{
    id?: string;
    quote: string;
    author: string;
    role: string;
    company: string;
    rating: number;
    avatar: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  footer: {
    headline: string;
    description: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
  };
}

export interface LandingWebConfig {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  isPublished: boolean;
  template:
  | 'timed_cards_opening'
  | 'ceohn10_executive'
  | 'startup_mobile_showcase'
  | 'forge_luxury_atelier'
  | 'modern_luxury_estate'
  | 'video_voting_showcase';
  votingStartAt?: string;
  votingEndAt?: string;
  votingDurationMinutes?: number;
  theme: {
    primaryColor: string;
    secondaryColor?: string;
    textColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
  };
  brand: {
    logoText: string;
    logoIcon?: string;
    logoUrl?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  navMenu: LandingMenuItem[];
  slides: LandingSlide[];
  subScreens: LandingSubScreen[];
  apiConfig: LandingApiConfig;
  startupConfig?: StartupMobileTemplateConfig;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_STARTUP_MOBILE_CONFIG: StartupMobileTemplateConfig = {
  hero: {
    headline: 'Gắn Kết Đồng Niên\nNâng Tầm Doanh Nghiệp',
    subheadline:
      'Cộng đồng kết nối xúc tiến giao thương, nâng tầm quản trị thực chiến và bảo chứng tín nhiệm dành riêng cho các chủ doanh nghiệp sinh năm 1983 (Quý Hợi) trực thuộc Hội Doanh nghiệp Trẻ Hà Nội (HanoiBA).',
    underlineAccent: 'Kết Nối – Chia Sẻ – Bứt Phá!',
    sunburstText: 'CLB DOANH NHÂN CEO HN10',
    handPhoneImage: '/images/landing/hand_holding_phone_transparent.png',
    ctaPrimaryText: 'Tải Ứng Dụng Ngay',
    ctaPrimaryLink: '#download',
    ctaSecondaryText: 'Xem Video Giới Thiệu',
    videoUrl:
      'https://v1.pinimg.com/videos/iht/expMp4/v2/92/8a/ca/928aca8b8e476ade2d17a603c7e62015_720w.mp4',
    floatingBadge1: {
      title: '500+ Doanh Nghiệp',
      subtitle: 'Học viên chính thức HanoiBA',
    },
    floatingBadge2: {
      title: '+105.8 Tỷ VNĐ',
      subtitle: 'Giao thương B2B hoàn tất',
    },
  },
  ribbonStats: [
    {
      value: '1.983+',
      label: 'Học viên Doanh Nhân',
      desc: 'Doanh nhân 1983 toàn quốc',
    },
    {
      value: '500+',
      label: 'Doanh Nghiệp Thành Viên',
      desc: 'Học viên chính thức HanoiBA',
    },
    {
      value: '100+ Tỷ',
      label: 'VNĐ Giao Thương B2B',
      desc: 'Giá trị kết nối hoàn tất',
    },
    {
      value: '98%',
      label: 'Tín Nhiệm Hài Lòng',
      desc: 'Đánh giá giao thương thực chất',
    },
  ],
  appTabs: {
    b2b: {
      title: 'Sàn Thương Mại B2B',
      desc: 'Niêm yết hơn 500+ sản phẩm & dịch vụ độc quyền từ các doanh nghiệp Học viên',
      stat: '500+ Sản phẩm B2B',
      items: [
        {
          name: 'Phần mềm ERP Quản trị Doanh nghiệp',
          price: '120.000.000 đ',
          author: 'ViConnect Tech',
        },
        {
          name: 'Gói thầu thiết kế nội thất trụ sở CEO',
          price: '850.000.000 đ',
          author: 'An Cường Interior',
        },
        {
          name: 'Dịch vụ tư vấn pháp lý M&A',
          price: '45.000.000 đ',
          author: 'Luật Hà Nội',
        },
      ],
    },
    connect: {
      title: 'Lịch Gặp & Kết Nối 1-on-1',
      desc: 'Chủ động đặt lịch giao lưu, cố vấn chiến lược và thảo luận cơ hội hợp tác',
      stat: '240+ Buổi hẹn/tháng',
      items: [
        {
          name: 'Cố vấn chiến lược gọi vốn Series A',
          price: 'Đặt lịch ngay',
          author: 'Chủ tịch Lê Thị Dung',
        },
        {
          name: 'Trao đổi hợp tác phân phối độc quyền',
          price: 'Thứ Năm, 14:00',
          author: 'Phó CT Nguyễn Hoàng Long',
        },
        {
          name: 'Cà phê kết nối Doanh nhân 1983',
          price: 'Sáng Thứ Bảy',
          author: 'Ban Xúc Tiến Giao Thương',
        },
      ],
    },
    card: {
      title: 'Thẻ Doanh Nhân Số & QR',
      desc: 'Trao danh thiếp thông minh, quét mã định danh xác thực Học viên chính thức',
      stat: 'Định danh Chuẩn',
      items: [
        {
          name: 'Doanh nhân: Trần Tuấn Anh',
          price: 'Học viên Vàng',
          author: 'ViConnect Group',
        },
        {
          name: 'Chức vụ: Tổng Giám Đốc',
          price: 'Đã xác thực',
          author: 'Mã số: CEO HN10-0089',
        },
        {
          name: 'Lĩnh vực: Công nghệ thông tin & AI',
          price: 'Kết nối ngay',
          author: 'Trụ sở: Hà Nội',
        },
      ],
    },
    analytics: {
      title: 'Thống Kê Giao Thương',
      desc: 'Minh bạch mọi chỉ số cơ hội, ngân sách và dòng tiền giao dịch thành công',
      stat: '100+ Tỷ VNĐ',
      items: [
        {
          name: 'Tổng cơ hội giao thương đã mở',
          price: '128 cơ hội',
          author: 'Toàn hệ thống',
        },
        {
          name: 'Doanh số giao dịch hoàn tất',
          price: '105.8 Tỷ VNĐ',
          author: 'Quý 1/2026',
        },
        {
          name: 'Tỷ lệ kết nối thành công',
          price: '89.4%',
          author: 'Chỉ số tín nhiệm',
        },
      ],
    },
  },
  mapChapterPins: [
    {
      id: 'hanoi',
      name: 'Hà Nội — Trụ Sở Chính',
      count: '1.250+ Học viên',
      desc: 'Cung Tri Thức, Số 1 Tôn Thất Thuyết, Cầu Giấy',
      x: '48%',
      y: '22%',
    },
    {
      id: 'haiphong',
      name: 'Hải Phòng & Quảng Ninh',
      count: '210+ Học viên',
      desc: 'Cụm Công nghiệp & Cảng biển Logistics Đông Bắc',
      x: '55%',
      y: '27%',
    },
    {
      id: 'danang',
      name: 'Đà Nẵng & Miền Trung',
      count: '185+ Học viên',
      desc: 'Trung tâm xúc tiến đầu tư Du lịch & Dịch vụ',
      x: '57%',
      y: '48%',
    },
    {
      id: 'hcm',
      name: 'TP. Hồ Chí Minh',
      count: '320+ Học viên',
      desc: 'VP Đại diện Phía Nam & Kết nối thị trường tài chính',
      x: '52%',
      y: '78%',
    },
    {
      id: 'cantho',
      name: 'Cần Thơ & ĐBSCL',
      count: '95+ Học viên',
      desc: 'Mạng lưới kết nối Nông sản & Xuất khẩu',
      x: '46%',
      y: '85%',
    },
  ],
  communityAvatars: [
    {
      id: 'dung-le',
      name: 'Lê Thị Dung',
      role: 'Chủ tịch CLB Doanh Nhân CEO HN10',
      quote: 'Tiên phong đổi mới - Kết nối bền vững',
      avatar:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      badge: 'LinkedIn',
      x: '18%',
      y: '25%',
    },
    {
      id: 'tuan-anh',
      name: 'Trần Tuấn Anh',
      role: 'CEO ViConnect Tech',
      quote: 'Số hóa quản trị - Tăng tốc quy mô',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      badge: 'Zalo',
      x: '75%',
      y: '22%',
    },
    {
      id: 'hoang-long',
      name: 'Nguyễn Hoàng Long',
      role: 'Phó Chủ Tịch Thường Trực HanoiBA',
      quote: 'Lan tỏa giá trị tri thức doanh nhân',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      badge: 'LinkedIn',
      x: '25%',
      y: '65%',
    },
    {
      id: 'minh-tri',
      name: 'Hoàng Minh Trí',
      role: 'Tổng Giám Đốc An Cường Interior',
      quote: 'Chất lượng tạo dựng niềm tin thương hiệu',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      badge: 'TikTok',
      x: '80%',
      y: '68%',
    },
  ],
  testimonials: [
    {
      quote:
        'Nền tảng số hóa của CLB giúp các Học viên trao đổi cơ hội kinh doanh chỉ trong 1 chạm. Qua các phiên Business Matching và chia sẻ cơ hội B2B, doanh nghiệp tôi đã kết nối thành công nhiều hợp đồng chiến lược giá trị cao.',
      author: 'Trần Tuấn Anh',
      role: 'Phó Chủ Tịch CLB, CEO ViConnect Tech',
      company: 'Ban Điều Hành CEO HN10',
      rating: 5,
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    {
      quote:
        'CLB Doanh nhân CEO HN10 là ngôi nhà chung gắn kết tình đồng niên chân thành, nơi chúng tôi cùng học hỏi, nâng tầm năng lực quản trị thực chiến và trao nhau cơ hội hợp tác kinh doanh thực chất, cùng vững bước vươn tầm.',
      author: 'Lê Thị Dung',
      role: 'Chủ tịch CLB Doanh Nhân CEO HN10',
      company: 'Tổng Giám Đốc DGroup, Viện trưởng Viện Doanh Trí',
      rating: 5,
      avatar:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    {
      quote:
        'CEO HN10 là một trong những câu lạc bộ đồng niên năng động và đoàn kết nhất của HanoiBA. Các anh chị doanh nhân Quý Hợi luôn tràn đầy nhiệt huyết, bản lĩnh và tinh thần trách nhiệm vì cộng đồng.',
      author: 'Nguyễn Hoàng Long',
      role: 'Phó Chủ Tịch HanoiBA',
      company: 'Hội Doanh nghiệp Trẻ Hà Nội',
      rating: 5,
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    {
      quote:
        'Các chương trình CEO Talk, Business Tour và tọa đàm chuyên đề mang lại giá trị tri thức thực chiến vô cùng quý báu, giúp các doanh nghiệp Học viên tự tin tháo gỡ điểm nghẽn và bứt phá mạnh mẽ.',
      author: 'Đỗ Minh Đức',
      role: 'Trưởng Ban Đào Tạo & Doanh Trí',
      company: 'Ban Chuyên Môn CEO HN10',
      rating: 5,
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
  ],
  faqs: [
    {
      question:
        'CLB Doanh Nhân CEO HN10 là tổ chức gì và trực thuộc đơn vị nào?',
      answer:
        'CLB Doanh nhân CEO HN10 là cộng đồng quy tụ các chủ doanh nghiệp, nhà sáng lập sinh năm Quý Hợi (1983), hoạt động chính thức trực thuộc Hội Doanh nghiệp Trẻ Hà Nội (HanoiBA). CLB hoạt động với phương châm "Gắn kết đồng niên - Nâng tầm doanh nghiệp", gắn kết tình thân đồng niên và thúc đẩy hợp tác kinh doanh thực chất.',
    },
    {
      question: 'Sứ mệnh và các hoạt động trọng tâm của CLB bao gồm những gì?',
      answer:
        'Sứ mệnh của CLB là kiến tạo cộng đồng doanh nhân bản lĩnh, trí tuệ và nhân văn. Các hoạt động cốt lõi gồm: Xúc tiến giao thương B2B (Business Matching & Business Tour), Đào tạo nâng tầm quản trị (CEO Talk & CEO Exchange), Đặt lịch hẹn 1-on-1 giữa các lãnh đạo và các hoạt động trách nhiệm xã hội CSR (Áo ấm vùng cao, xây nhà tình nghĩa).',
    },
    {
      question: 'Điều kiện để gia nhập trở thành Học viên chính thức của CLB?',
      answer:
        'Học viên là các Doanh nhân, Chủ tịch HĐQT, CEO, Tổng giám đốc hoặc Cấp quản lý doanh nghiệp sinh năm 1983 (Quý Hợi). Hồ sơ gia nhập sẽ được Ban Thẩm định và Ban Điều hành phê duyệt theo đúng quy chế CEOHN10 của HanoiBA.',
    },
    {
      question:
        'Ứng dụng di động CEO HN10 mang lại những lợi ích gì cho Học viên?',
      answer:
        'Ứng dụng cung cấp trọn vẹn giải pháp số hóa: Thẻ Doanh nhân số & mã QR định danh cá nhân, Sàn thương mại B2B niêm yết sản phẩm/dịch vụ ưu đãi nội khối 15-30%, công cụ đặt lịch hẹn kết nối 1-on-1 trực tiếp, biểu đồ thống kê cơ hội minh bạch và thông báo đẩy lịch sự kiện thời gian thực.',
    },
    {
      question:
        'Làm thế nào để doanh nghiệp tôi có thể niêm yết sản phẩm trên Sàn B2B?',
      answer:
        'Sau khi hoàn tất đăng ký Học viên chính thức và được Ban Thẩm định hồ sơ thông qua, doanh nghiệp được cấp tài khoản định danh để tự động đăng tải sản phẩm/dịch vụ lên Sàn B2B.',
    },
  ],
  footer: {
    headline: 'CLB DOANH NHÂN CEO HN10 — HANOIBA',
    description:
      'Cộng đồng kết nối giao thương, nâng tầm tri thức quản trị thực chiến và lan tỏa giá trị nhân văn cho các doanh nhân sinh năm 1983 trực thuộc Hội Doanh nghiệp Trẻ Hà Nội (HanoiBA).',
    contactPhone: '0983.1010.10',
    contactEmail: 'contact@ceohn10.com',
    address: 'Cung Tri Thức Thành Phố, Số 1 Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
  },
};

const DEFAULT_TIMED_CARDS_SLIDES: LandingSlide[] = [
  {
    id: 'slide-1',
    place: 'Switzerland Alps',
    title1: 'SAINT',
    title2: 'ANTONIEN',
    description:
      "Tucked away in the Switzerland Alps, Saint Antönien offers an idyllic retreat for those seeking tranquility and adventure alike. It's a hidden gem for backcountry skiing in winter and boasts lush trails for hiking and mountain biking during the warmer months.",
    image: 'https://assets.codepen.io/3685267/timed-cards-1.jpg',
    ctaText: 'Discover Location',
    ctaLink: '#discover',
  },
  {
    id: 'slide-2',
    place: 'Japan Alps',
    title1: 'NAGANO',
    title2: 'PREFECTURE',
    description:
      "Nagano Prefecture, set within the majestic Japan Alps, is a cultural treasure trove with its historic shrines and temples, particularly the famous Zenkō-ji. The region is also a hotspot for skiing and snowboarding, offering some of the country's best powder.",
    image: 'https://assets.codepen.io/3685267/timed-cards-2.jpg',
    ctaText: 'Discover Location',
    ctaLink: '#discover',
  },
  {
    id: 'slide-3',
    place: 'Sahara Desert - Morocco',
    title1: 'MARRAKECH',
    title2: 'MERZOUGA',
    description:
      'The journey from the vibrant souks and palaces of Marrakech to the tranquil, starlit sands of Merzouga showcases the diverse splendor of Morocco. Camel treks and desert camps offer an unforgettable immersion into the nomadic way of life.',
    image: 'https://assets.codepen.io/3685267/timed-cards-3.jpg',
    ctaText: 'Discover Location',
    ctaLink: '#discover',
  },
  {
    id: 'slide-4',
    place: 'Sierra Nevada - USA',
    title1: 'YOSEMITE',
    title2: 'NATIONAL PARK',
    description:
      'Yosemite National Park is a showcase of the American wilderness, revered for its towering granite monoliths, ancient giant sequoias, and thundering waterfalls. The park offers year-round recreational activities, from rock climbing to serene valley walks.',
    image: 'https://assets.codepen.io/3685267/timed-cards-4.jpg',
    ctaText: 'Discover Location',
    ctaLink: '#discover',
  },
  {
    id: 'slide-5',
    place: 'Tarifa - Spain',
    title1: 'LOS LANCES',
    title2: 'BEACH',
    description:
      "Los Lances Beach in Tarifa is a coastal paradise known for its consistent winds, making it a world-renowned spot for kitesurfing and windsurfing. The beach's long, sandy shores provide ample space for relaxation and sunbathing, with a vibrant atmosphere of beach bars and cafes.",
    image: 'https://assets.codepen.io/3685267/timed-cards-5.jpg',
    ctaText: 'Discover Location',
    ctaLink: '#discover',
  },
  {
    id: 'slide-6',
    place: 'Cappadocia - Turkey',
    title1: 'GÖREME',
    title2: 'VALLEY',
    description:
      'Göreme Valley in Cappadocia is a historical marvel set against a unique geological backdrop, where centuries of wind and water have sculpted the landscape into whimsical formations. The valley is also famous for its open-air museums, underground cities, and the enchanting experience of hot air ballooning.',
    image: 'https://assets.codepen.io/3685267/timed-cards-6.jpg',
    ctaText: 'Discover Location',
    ctaLink: '#discover',
  },
];

const DEFAULT_TIMED_CARDS_NAV: LandingMenuItem[] = [
  { id: 'm-1', label: 'Home', active: true, type: 'link', url: '#home' },
  {
    id: 'm-2',
    label: 'Destinations',
    type: 'tree_dropdown',
    children: [
      {
        id: 'm-2-1',
        label: 'Châu Âu & Dãy Alps',
        badge: 'Hot',
        type: 'modal_screen',
        subScreenId: 'scr-alps',
        children: [
          {
            id: 'm-2-1-1',
            label: 'Saint Antönien (Thụy Sĩ)',
            type: 'modal_screen',
            subScreenId: 'scr-alps',
          },
          {
            id: 'm-2-1-2',
            label: 'Los Lances Beach (Tây Ban Nha)',
            type: 'modal_screen',
            subScreenId: 'scr-spain',
          },
        ],
      },
      {
        id: 'm-2-2',
        label: 'Châu Á & Trung Đông',
        type: 'tree_dropdown',
        children: [
          {
            id: 'm-2-2-1',
            label: 'Nagano Prefecture (Nhật Bản)',
            type: 'modal_screen',
            subScreenId: 'scr-japan',
          },
          {
            id: 'm-2-2-2',
            label: 'Göreme Valley (Thổ Nhĩ Kỳ)',
            type: 'modal_screen',
            subScreenId: 'scr-turkey',
          },
        ],
      },
      {
        id: 'm-2-3',
        label: 'Châu Mỹ & Châu Phi',
        type: 'tree_dropdown',
        children: [
          {
            id: 'm-2-3-1',
            label: 'Yosemite National Park (Mỹ)',
            type: 'modal_screen',
            subScreenId: 'scr-yosemite',
          },
          {
            id: 'm-2-3-2',
            label: 'Sa Mạc Sahara (Morocco)',
            type: 'modal_screen',
            subScreenId: 'scr-sahara',
          },
        ],
      },
    ],
  },
  {
    id: 'm-3',
    label: 'Holidays',
    type: 'tree_dropdown',
    children: [
      {
        id: 'm-3-1',
        label: 'Trượt tuyết mùa đông',
        type: 'link',
        url: '#skiing',
      },
      {
        id: 'm-3-2',
        label: 'Du lịch mạo hiểm sa mạc',
        type: 'link',
        url: '#safari',
      },
      {
        id: 'm-3-3',
        label: 'Nghỉ dưỡng bãi biển nhiệt đới',
        type: 'link',
        url: '#beach',
      },
    ],
  },
  {
    id: 'm-4',
    label: 'Offers',
    type: 'modal_screen',
    subScreenId: 'scr-offers',
  },
  {
    id: 'm-5',
    label: 'Contact',
    type: 'modal_screen',
    subScreenId: 'scr-contact',
  },
];

const DEFAULT_SUB_SCREENS: LandingSubScreen[] = [
  {
    id: 'scr-alps',
    title: 'Khám Phá Dãy Alps Thụy Sĩ — Saint Antönien',
    subtitle: 'Kỳ nghỉ thiên đường tại đỉnh cao của sự tĩnh lặng và mạo hiểm',
    layout: 'article',
    contentHtml: `<p>Ẩn mình giữa dãy Alps Thụy Sĩ hùng vĩ, Saint Antönien là điểm đến lý tưởng cho những ai khao khát tìm kiếm sự thanh bình kết hợp cùng tinh thần chinh phục mạo hiểm.</p><p>Vào mùa đông, đây là viên ngọc quý với những sườn dốc tuyết trắng nguyên sơ hoàn hảo cho bộ môn trượt tuyết việt dã (backcountry skiing). Khi hè sang, thung lũng khoác lên mình tấm áo xanh mướt với những cung đường mòn uốn lượn dành cho leo núi và xe đạp địa hình.</p>`,
    images: ['https://assets.codepen.io/3685267/timed-cards-1.jpg'],
    ctaButton: { label: 'Đặt Tour Trải Nghiệm', action: 'book_alps' },
  },
  {
    id: 'scr-offers',
    title: 'Gói Ưu Đãi Đặc Quyền Du Lịch & Trải Nghiệm',
    subtitle:
      'Chương trình hợp tác độc quyền cùng CEOHN10 Doanh nhân CEO HN10',
    layout: 'article',
    contentHtml: `<p>Nhận ngay ưu đãi 25% cho tất cả Học viên CEO HN10 khi đặt dịch vụ nghỉ dưỡng cao cấp và tour khám phá quốc tế.</p>`,
    ctaButton: { label: 'Nhận Mã Ưu Đãi', action: 'claim_offer' },
  },
  {
    id: 'scr-contact',
    title: 'Liên Hệ & Hỗ Trợ Đặt Chỗ',
    subtitle: 'Đội ngũ chuyên viên tư vấn cao cấp luôn sẵn sàng đồng hành 24/7',
    layout: 'contact_form',
    contentHtml: `<p>Hotline: 0983.1010.10 — Email: contact@ceohn10.viconnect.vn</p>`,
  },
];

const SETTINGS_KEY = 'crm_landing_webs_configs';

export const DEFAULT_VIDEO_VOTING_7_SLIDES: LandingSlide[] = [
  {
    id: 'vslide-1',
    place: 'MÀN 01 · TẦM NHÌN CHIẾN LƯỢC CEO HN10',
    title1: 'KHỞI NGUỒN',
    title2: 'THỊNH VƯỢNG',
    description:
      'Hành trình kiến tạo hệ sinh thái doanh nhân CEO HN10 tiên phong đổi mới, số hóa quản trị và mở rộng liên minh thương mại đa ngành trên toàn quốc.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=85',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4',
    votingQuestion: 'Bạn đánh giá thế nào về định hướng Chiến lược & Tầm nhìn ở Video Màn 01?',
    votingOptions: [
      { id: 'opt-1-1', label: 'Đột phá & Truyền cảm hứng mạnh mẽ', description: 'Tầm nhìn sắc bén, dẫn dắt xu thế' },
      { id: 'opt-1-2', label: 'Thực tiễn & Bám sát nhu cầu doanh nghiệp', description: 'Dễ dàng áp dụng vào vận hành' },
      { id: 'opt-1-3', label: 'Sáng tạo & Khác biệt vượt trội', description: 'Tạo dấu ấn thương hiệu độc bản' },
    ],
    ctaText: 'Bình Chọn Video 01',
    ctaLink: '#vote',
  },
  {
    id: 'vslide-2',
    place: 'MÀN 02 · CHUYỂN ĐỔI SỐ & AI DOANH NGHIỆP',
    title1: 'CÔNG NGHỆ',
    title2: 'TIÊN PHONG',
    description:
      'Ứng dụng Trí tuệ nhân tạo (AI), Big Data và nền tảng quản trị thông minh giúp các doanh nghiệp thành viên tối ưu 40% hiệu suất vận hành.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-blue-circuits-99-large.mp4',
    votingQuestion: 'Giải pháp công nghệ nào trong Video Màn 02 ấn tượng nhất với bạn?',
    votingOptions: [
      { id: 'opt-2-1', label: 'Hệ sinh thái AI & Tự động hóa quy trình', description: 'Tối ưu nhân sự và tốc độ xử lý' },
      { id: 'opt-2-2', label: 'Nền tảng Web CRM & App Mobile CEO HN10', description: 'Kết nối dữ liệu xuyên suốt 24/7' },
      { id: 'opt-2-3', label: 'Phân tích dữ liệu & Báo cáo tài chính Realtime', description: 'Minh bạch và chính xác tuyệt đối' },
    ],
    ctaText: 'Bình Chọn Video 02',
    ctaLink: '#vote',
  },
  {
    id: 'vslide-3',
    place: 'MÀN 03 · LIÊN MINH GIAO THƯƠNG B2B',
    title1: 'KẾT NỐI',
    title2: 'ĐỈNH CAO',
    description:
      'Thúc đẩy các thương vụ B2B Matching trăm tỷ nội khối, nơi chữ Tín và tình đồng niên trở thành bảo chứng vững chắc nhất cho mọi hợp đồng.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=85',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-business-people-shaking-hands-in-an-office-4822-large.mp4',
    votingQuestion: 'Giá trị kết nối giao thương nào ở Video Màn 03 bạn tâm đắc nhất?',
    votingOptions: [
      { id: 'opt-3-1', label: 'Sàn giao thương B2B & Đặc quyền nội khối', description: 'Ưu đãi chéo 15-30% giữa các học viên' },
      { id: 'opt-3-2', label: 'Phiên kết nối Business Matching 1-on-1', description: 'Gặp gỡ trực tiếp chủ doanh nghiệp' },
      { id: 'opt-3-3', label: 'Liên minh đấu thầu & Hợp tác liên ngành', description: 'Cùng thực hiện các dự án quy mô lớn' },
    ],
    ctaText: 'Bình Chọn Video 03',
    ctaLink: '#vote',
  },
  {
    id: 'vslide-4',
    place: 'MÀN 04 · ĐÀO TẠO LÃNH ĐẠO THỰC CHIẾN',
    title1: 'TRÍ TUỆ',
    title2: 'BẢN LĨNH',
    description:
      'Chương trình 30 chuyên đề đào tạo CEO chuyên sâu cùng các chuyên gia đầu ngành, kết hợp thăm quan thực tế doanh nghiệp (Company Tour).',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=85',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-people-working-in-a-modern-office-4347-large.mp4',
    votingQuestion: 'Hoạt động đào tạo nào trong Video Màn 04 mang lại giá trị cao nhất?',
    votingOptions: [
      { id: 'opt-4-1', label: 'Chuyên đề Quản trị chiến lược & Tài chính', description: 'Nâng tầm tư duy điều hành vĩ mô' },
      { id: 'opt-4-2', label: 'CEO Talk & Chia sẻ bài học thực chiến', description: 'Kinh nghiệm xương máu từ thương trường' },
      { id: 'opt-4-3', label: 'Business Tour thăm quan nhà máy/trụ sở', description: 'Học hỏi mô hình vận hành trực tiếp' },
    ],
    ctaText: 'Bình Chọn Video 04',
    ctaLink: '#vote',
  },
  {
    id: 'vslide-5',
    place: 'MÀN 05 · VĂN HÓA & ĐỜI SỐNG DOANH NHÂN',
    title1: 'GẮN KẾT',
    title2: 'TÌNH THÂN',
    description:
      'Những khoảnh khắc sẻ chia ấm áp trong các kỳ Gala, sinh nhật tháng, giải Golf và hoạt động thể thao gắn kết đại gia đình CEO HN10.',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1600&q=85',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-friends-toasting-with-champagne-at-a-party-4636-large.mp4',
    votingQuestion: 'Cảm xúc của bạn khi xem Video Màn 05 — Văn hóa Gắn kết?',
    votingOptions: [
      { id: 'opt-5-1', label: 'Ấm áp, chân thành như một gia đình lớn', description: 'Văn hóa sẻ chia không khoảng cách' },
      { id: 'opt-5-2', label: 'Sôi động, đẳng cấp và giàu năng lượng', description: 'Các sự kiện Gala & thể thao rực rỡ' },
      { id: 'opt-5-3', label: 'Tự hào là một mảnh ghép của CEO HN10', description: 'Tinh thần đồng đội gắn bó bền chặt' },
    ],
    ctaText: 'Bình Chọn Video 05',
    ctaLink: '#vote',
  },
  {
    id: 'vslide-6',
    place: 'MÀN 06 · TRÁCH NHIỆM XÃ HỘI & THIỆN NGUYỆN',
    title1: 'LAN TỎA',
    title2: 'NHÂN VĂN',
    description:
      'Kinh doanh gắn liền với phụng sự xã hội: Xây trường vùng cao, trao học bổng khuyến học và đồng hành cùng những hoàn cảnh khó khăn.',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1600&q=85',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sunrise-over-the-mountains-4100-large.mp4',
    votingQuestion: 'Dự án cộng đồng nào trong Video Màn 06 chạm đến trái tim bạn nhất?',
    votingOptions: [
      { id: 'opt-6-1', label: 'Điểm trường vùng cao & Áo ấm cho em', description: 'Ươm mầm tri thức cho trẻ em nghèo' },
      { id: 'opt-6-2', label: 'Quỹ học bổng & Khởi nghiệp trẻ', description: 'Tiếp sức thế hệ kế cận vững vàng' },
      { id: 'opt-6-3', label: 'Cứu trợ khẩn cấp & Xây nhà tình nghĩa', description: 'Lá lành đùm lá rách kịp thời' },
    ],
    ctaText: 'Bình Chọn Video 06',
    ctaLink: '#vote',
  },
  {
    id: 'vslide-7',
    place: 'MÀN 07 · KHÁT VỌNG VƯƠN TẦM QUỐC TẾ',
    title1: 'VƯƠN RA',
    title2: 'BIỂN LỚN',
    description:
      'Đưa thương hiệu doanh nghiệp CEO HN10 vươn tầm khu vực và thế giới, chinh phục những đỉnh cao mới trong kỷ nguyên kinh tế số toàn cầu.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=85',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-flying-through-clouds-in-the-sky-4164-large.mp4',
    votingQuestion: 'Bạn kỳ vọng bước tiến nào nhất ở Video Màn 07 — Vươn tầm quốc tế?',
    votingOptions: [
      { id: 'opt-7-1', label: 'Xúc tiến xuất khẩu & Thương mại xuyên biên giới', description: 'Đưa sản phẩm Việt ra thế giới' },
      { id: 'opt-7-2', label: 'Hợp tác gọi vốn & M&A với quỹ đầu tư quốc tế', description: 'Nâng cao năng lực tài chính toàn cầu' },
      { id: 'opt-7-3', label: 'Mạng lưới kết nối CEO kiều bào & Quốc tế', description: 'Mở rộng biên giới hợp tác chiến lược' },
    ],
    ctaText: 'Bình Chọn Video 07',
    ctaLink: '#vote',
  },
];

@Injectable()
export class LandingService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) { }

  async onModuleInit() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.landing_video_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        landing_id TEXT NOT NULL,
        slide_id TEXT NOT NULL,
        option_id TEXT NOT NULL,
        option_label TEXT,
        voter_name TEXT NOT NULL,
        voter_email TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_landing_video_votes_landing ON public.landing_video_votes(landing_id);
      CREATE INDEX IF NOT EXISTS idx_landing_video_votes_email ON public.landing_video_votes(landing_id, LOWER(voter_email));
    `).catch(() => {});
  }

  /**
   * Lấy toàn bộ danh sách Landing Web đã cấu hình
   */
  async getAllLandingWebs(): Promise<LandingWebConfig[]> {
    const rows = await this.prisma.$queryRaw<{ value: any }[]>`
      SELECT value FROM public.app_settings WHERE key = ${SETTINGS_KEY} LIMIT 1
    `.catch(() => []);

    let list: LandingWebConfig[] = [];
    if (rows && rows.length > 0 && rows[0]?.value) {
      const val =
        typeof rows[0].value === 'string'
          ? JSON.parse(rows[0].value)
          : rows[0].value;
      if (Array.isArray(val)) list = val;
      else if (val && typeof val === 'object') list = Object.values(val);
    }

    let modified = false;
    // Đảm bảo luôn có Mẫu 1: Timed Cards Opening (Pinterest Giulio Cuscito - crm.ceohn10.viconnect.vn/landing/web-v1)
    const t1Idx = list.findIndex((w) => w.template === 'timed_cards_opening');
    if (t1Idx === -1) {
      const t1 = this.generateDefaultTemplate(
        'timed_cards_opening',
        'Khám Phá Toàn Cầu — Timed Cards Opening (Mẫu 1)',
        'web-v1',
      );
      list.unshift(t1);
      modified = true;
    } else {
      // Cập nhật slug về chuẩn path-based domain web-v1 nếu còn để slug cũ
      if (!list[t1Idx].slug || list[t1Idx].slug === 'kham-pha-toan-cau') {
        list[t1Idx].slug = 'web-v1';
        list[t1Idx].name = 'Khám Phá Toàn Cầu — Timed Cards Opening (Mẫu 1)';
        modified = true;
      }
    }

    // Đảm bảo luôn có Mẫu 2: Startup Mobile Showcase (Pinterest 234398355598861981 - crm.ceohn10.viconnect.vn/landing/web-v2)
    const t2Idx = list.findIndex(
      (w) => w.template === 'startup_mobile_showcase',
    );
    if (t2Idx === -1) {
      const t2 = this.generateDefaultTemplate(
        'startup_mobile_showcase',
        'Ứng Dụng Di Động CEO HN10 — Startup Mobile Showcase (Mẫu 2)',
        'web-v2',
      );
      list.push(t2);
      modified = true;
    } else {
      // Cập nhật slug về chuẩn path-based domain web-v2 nếu còn để slug cũ
      if (
        !list[t2Idx].slug ||
        list[t2Idx].slug === 'app-ceohn10' ||
        list[t2Idx].slug === 'startup-mobile-showcase'
      ) {
        list[t2Idx].slug = 'web-v2';
        list[t2Idx].name =
          'Ứng Dụng Di Động CEO HN10 — Startup Mobile Showcase (Mẫu 2)';
        modified = true;
      }
      if (!list[t2Idx].startupConfig) {
        list[t2Idx].startupConfig = JSON.parse(
          JSON.stringify(DEFAULT_STARTUP_MOBILE_CONFIG),
        );
        modified = true;
      }
    }

    // Đảm bảo luôn có Mẫu Video Voting 7 Màn (Pinterest 900790362966152495 - crm.ceohn10.viconnect.vn/landing/video-voting)
    const t5Idx = list.findIndex(
      (w) => w.template === 'video_voting_showcase' || w.slug === 'video-voting',
    );
    if (t5Idx === -1) {
      const t5 = this.generateDefaultTemplate(
        'video_voting_showcase',
        'Trình Chiếu 7 Video & Bình Chọn Realtime (Pinterest 900790362966152495)',
        'video-voting',
      );
      list.unshift(t5);
      modified = true;
    } else {
      if (!list[t5Idx].slides || list[t5Idx].slides.length < 7) {
        const existingSlides = list[t5Idx].slides || [];
        const mergedSlides: LandingSlide[] = [];
        for (let i = 0; i < 7; i++) {
          mergedSlides.push(existingSlides[i] || DEFAULT_VIDEO_VOTING_7_SLIDES[i]);
        }
        list[t5Idx].slides = mergedSlides;
        modified = true;
      }
    }

    if (modified || list.length === 0) {
      await this.saveAllLandingWebs(list);
    }

    return list;
  }

  /**
   * Lưu toàn bộ mảng Landing Web vào CSDL
   */
  private async saveAllLandingWebs(list: LandingWebConfig[]): Promise<void> {
    const jsonStr = JSON.stringify(list);
    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO public.app_settings (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW()
      `,
      SETTINGS_KEY,
      jsonStr,
    );
  }

  /**
   * Lấy chi tiết một Landing Web theo ID
   */
  async getLandingWebById(id: string): Promise<LandingWebConfig> {
    const list = await this.getAllLandingWebs();
    const item = list.find((w) => w.id === id);
    if (!item)
      throw new NotFoundException(
        `Không tìm thấy cấu hình Landing Web với mã: ${id}`,
      );
    return item;
  }

  /**
   * Tạo mới một Landing Web từ Template
   */
  async createLandingWeb(data: {
    name: string;
    slug: string;
    subdomain?: string;
    template?:
    | 'timed_cards_opening'
    | 'ceohn10_executive'
    | 'startup_mobile_showcase'
    | 'forge_luxury_atelier'
    | 'modern_luxury_estate'
    | 'video_voting_showcase';
  }): Promise<LandingWebConfig> {
    const list = await this.getAllLandingWebs();

    // Chuẩn hóa slug
    const safeSlug = (data.slug || data.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');

    if (list.some((w) => w.slug === safeSlug)) {
      throw new BadRequestException(
        `Đường dẫn slug "${safeSlug}" đã tồn tại. Vui lòng chọn slug khác.`,
      );
    }

    if (data.subdomain) {
      const safeSub = data.subdomain
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '');
      if (list.some((w) => w.subdomain === safeSub)) {
        throw new BadRequestException(
          `Tên miền phụ Subdomain "${safeSub}" đã được gán cho một trang khác.`,
        );
      }
    }

    const tpl = data.template || 'timed_cards_opening';
    const newConfig = this.generateDefaultTemplate(
      tpl,
      data.name,
      safeSlug,
      data.subdomain,
    );
    list.push(newConfig);

    await this.saveAllLandingWebs(list);
    return newConfig;
  }

  /**
   * Cập nhật toàn diện cấu hình Dynamic của Landing Web
   */
  async updateLandingWeb(
    id: string,
    updateData: Partial<LandingWebConfig>,
  ): Promise<LandingWebConfig> {
    const list = await this.getAllLandingWebs();
    const idx = list.findIndex((w) => w.id === id);
    if (idx === -1)
      throw new NotFoundException(
        `Không tìm thấy Landing Web để cập nhật (ID: ${id})`,
      );

    // Kiểm tra trùng lặp slug nếu sửa slug
    if (updateData.slug && updateData.slug !== list[idx].slug) {
      const slugExists = list.some(
        (w) => w.id !== id && w.slug === updateData.slug,
      );
      if (slugExists)
        throw new BadRequestException(`Slug "${updateData.slug}" đã bị trùng.`);
    }

    // Kiểm tra trùng lặp subdomain nếu sửa subdomain
    if (updateData.subdomain && updateData.subdomain !== list[idx].subdomain) {
      const subExists = list.some(
        (w) => w.id !== id && w.subdomain === updateData.subdomain,
      );
      if (subExists)
        throw new BadRequestException(
          `Subdomain "${updateData.subdomain}" đã bị trùng.`,
        );
    }

    const current = list[idx];
    const updated: LandingWebConfig = {
      ...current,
      ...updateData,
      id: current.id, // giữ nguyên ID gốc
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updated;
    await this.saveAllLandingWebs(list);
    return updated;
  }

  /**
   * Xóa một Landing Web
   */
  async deleteLandingWeb(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const list = await this.getAllLandingWebs();
    const filtered = list.filter((w) => w.id !== id);
    if (filtered.length === list.length) {
      throw new NotFoundException(`Không tìm thấy Landing Web có ID: ${id}`);
    }
    await this.saveAllLandingWebs(filtered);
    return { success: true, message: 'Đã xóa cấu hình Landing Web thành công' };
  }

  /**
   * Áp dụng Subdomain cho Landing Web
   */
  async applySubdomain(
    id: string,
    subdomain: string,
  ): Promise<LandingWebConfig> {
    const cleanSub = (subdomain || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '');
    if (!cleanSub) {
      throw new BadRequestException(
        'Vui lòng nhập subdomain hợp lệ (chữ cái thường, chữ số và dấu gạch nối)',
      );
    }

    const list = await this.getAllLandingWebs();
    const exists = list.some((w) => w.id !== id && w.subdomain === cleanSub);
    if (exists) {
      throw new BadRequestException(
        `Subdomain "${cleanSub}" đã được đăng ký bởi trang khác.`,
      );
    }

    return this.updateLandingWeb(id, {
      subdomain: cleanSub,
      isPublished: true,
    });
  }

  /**
   * Lấy cấu hình công khai phục vụ Render trên Subdomain hoặc Slug công khai
   */
  async getPublicLandingWeb(
    slugOrSubdomain: string,
  ): Promise<LandingWebConfig> {
    const list = await this.getAllLandingWebs();
    const target = (slugOrSubdomain || '').toLowerCase().trim();

    let matched = list.find(
      (w) =>
        (w.slug && w.slug.toLowerCase() === target) ||
        (w.subdomain && w.subdomain.toLowerCase() === target),
    );

    // Hỗ trợ alias cho đường dẫn path domain crm.ceohn10.viconnect.vn/landing/web-v1 và web-v2
    if (!matched) {
      if (
        ['web-v1', 'web1', 'web-1', 'v1', 'kham-pha-toan-cau'].includes(target)
      ) {
        matched =
          list.find((w) => w.template === 'timed_cards_opening') ||
          this.generateDefaultTemplate(
            'timed_cards_opening',
            'Khám Phá Toàn Cầu — Timed Cards Opening (Mẫu 1)',
            'web-v1',
          );
      } else if (
        [
          'web-v2',
          'web2',
          'web-2',
          'v2',
          'app-ceohn10',
          'startup-mobile-showcase',
        ].includes(target)
      ) {
        matched =
          list.find((w) => w.template === 'startup_mobile_showcase') ||
          this.generateDefaultTemplate(
            'startup_mobile_showcase',
            'Ứng Dụng Di Động CEO HN10 — Startup Mobile Showcase (Mẫu 2)',
            'web-v2',
          );
      } else if (
        [
          'video-voting',
          'video-vote',
          'voting',
          'web-v5',
          'v5',
          '900790362966152495',
        ].includes(target)
      ) {
        matched =
          list.find((w) => w.template === 'video_voting_showcase') ||
          this.generateDefaultTemplate(
            'video_voting_showcase',
            'Trình Chiếu 7 Video & Bình Chọn Realtime (Pinterest 900790362966152495)',
            'video-voting',
          );
      }
    }

    if (!matched) {
      throw new NotFoundException(
        `Không tìm thấy trang Landing Web với định danh: ${slugOrSubdomain}`,
      );
    }

    // Nếu cấu hình API Động đang bật, tự động nạp dữ liệu từ API và cập nhật danh sách slides
    if (matched.apiConfig?.enabled && matched.apiConfig?.endpointUrl) {
      try {
        const dynamicSlides = await this.fetchDynamicSlidesFromApi(
          matched.apiConfig,
        );
        if (dynamicSlides && dynamicSlides.length > 0) {
          matched.slides = dynamicSlides;
        }
      } catch (err: any) {
        console.warn(
          `[LandingService] Lỗi nạp API động cho ${matched.slug}:`,
          err?.message,
        );
      }
    }

    return matched;
  }

  /**
   * Kiểm tra và nạp thử dữ liệu từ API người dùng cấu hình
   */
  async testApiConnector(apiConfig: LandingApiConfig): Promise<{
    success: boolean;
    count: number;
    sampleSlides: LandingSlide[];
    rawCount: number;
  }> {
    if (!apiConfig.endpointUrl) {
      throw new BadRequestException('Vui lòng cung cấp URL Endpoint API');
    }

    const slides = await this.fetchDynamicSlidesFromApi(apiConfig);
    return {
      success: true,
      count: slides.length,
      sampleSlides: slides.slice(0, 6),
      rawCount: slides.length,
    };
  }

  /**
   * Cơ chế gọi API động nội bộ hoặc ngoài và ánh xạ vào LandingSlide
   */
  private async fetchDynamicSlidesFromApi(
    apiConfig: LandingApiConfig,
  ): Promise<LandingSlide[]> {
    let url = apiConfig.endpointUrl.trim();
    if (url.startsWith('/')) {
      // Nội bộ hệ thống
      url = `http://127.0.0.1:${process.env.PORT || 4000}${url}`;
    }

    const resp = await fetch(url, {
      method: apiConfig.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiConfig.headers || {}),
      },
    });

    if (!resp.ok) {
      throw new Error(
        `Endpoint trả về mã lỗi HTTP ${resp.status}: ${resp.statusText}`,
      );
    }

    const json = await resp.json();
    let items: any[] = [];
    if (Array.isArray(json)) {
      items = json;
    } else if (
      apiConfig.rootPath &&
      json[apiConfig.rootPath] &&
      Array.isArray(json[apiConfig.rootPath])
    ) {
      items = json[apiConfig.rootPath];
    } else if (json.data && Array.isArray(json.data)) {
      items = json.data;
    } else if (json.items && Array.isArray(json.items)) {
      items = json.items;
    } else {
      // Tìm mảng đầu tiên trong object
      for (const k of Object.keys(json)) {
        if (Array.isArray(json[k])) {
          items = json[k];
          break;
        }
      }
    }

    if (!items || items.length === 0) return [];

    const m = apiConfig.fieldMapping;
    return items.map((raw, idx) => {
      const place =
        (m.place && raw[m.place]) ||
        raw.company ||
        raw.location ||
        raw.industry ||
        'CEO HN10';
      const title =
        (m.title1 && raw[m.title1]) ||
        raw.title ||
        raw.name ||
        `CHỦ ĐỀ #${idx + 1}`;

      // Tách title thành title1 và title2 nếu có
      let t1 = title;
      let t2 = '';
      if (m.title2 && raw[m.title2]) {
        t2 = raw[m.title2];
      } else if (title.includes(' ')) {
        const words = title.split(' ');
        t1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
        t2 = words.slice(Math.ceil(words.length / 2)).join(' ');
      }

      let img =
        (m.image && raw[m.image]) ||
        raw.image ||
        raw.image_url ||
        raw.cover_image;
      if (Array.isArray(raw.images) && raw.images.length > 0)
        img = raw.images[0];
      if (!img || typeof img !== 'string' || !img.startsWith('http')) {
        img =
          DEFAULT_TIMED_CARDS_SLIDES[idx % DEFAULT_TIMED_CARDS_SLIDES.length]
            .image;
      }

      const desc =
        (m.description && raw[m.description]) ||
        raw.description ||
        raw.summary ||
        raw.content ||
        'Khám phá thông tin hợp tác kinh doanh và kết nối phát triển cùng CLB Doanh Nhân CEO HN10.';

      return {
        id: `dyn-slide-${raw.id || idx}`,
        place: String(place).toUpperCase(),
        title1: String(t1).toUpperCase(),
        title2: String(t2).toUpperCase(),
        description: String(desc).slice(0, 300),
        image: img,
        ctaText: (m.ctaText && raw[m.ctaText]) || 'Khám Phá Chi Tiết',
        ctaLink:
          (m.ctaLink && raw[m.ctaLink]) ||
          `/association/opportunities?id=${raw.id || ''}`,
      };
    });
  }

  /**
   * Bình chọn cho Video Slide trên Landing Page
   * - Mỗi người (theo email) chỉ được vote 1 lần duy nhất
   * - Phải điền Tên và Email để lưu lại vào CSDL
   * - Kiểm tra thời gian bình chọn đã set up
   */
  async castVideoVote(
    slugOrId: string,
    payload: {
      slideId: string;
      optionId: string;
      voterName: string;
      voterEmail: string;
    },
  ) {
    const voterName = (payload.voterName || '').trim();
    const voterEmail = (payload.voterEmail || '').trim().toLowerCase();
    const slideId = (payload.slideId || '').trim();
    const optionId = (payload.optionId || '').trim();

    if (!voterName || !voterEmail) {
      throw new BadRequestException(
        'Vui lòng điền đầy đủ Họ tên và Email để hệ thống ghi nhận lượt bình chọn!',
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(voterEmail)) {
      throw new BadRequestException('Địa chỉ Email không hợp lệ.');
    }
    if (!slideId || !optionId) {
      throw new BadRequestException('Vui lòng chọn một phương án bình chọn.');
    }

    const list = await this.getAllLandingWebs();
    const target = (slugOrId || '').toLowerCase().trim();
    let landing =
      list.find(
        (w) =>
          w.id === slugOrId ||
          (w.slug && w.slug.toLowerCase() === target) ||
          (w.subdomain && w.subdomain.toLowerCase() === target),
      ) || list.find((w) => w.template === 'video_voting_showcase');

    if (!landing) {
      landing = this.generateDefaultTemplate(
        'video_voting_showcase',
        'Trình Chiếu 7 Video & Bình Chọn Realtime (Pinterest 900790362966152495)',
        'video-voting',
      );
    }

    const now = Date.now();
    if (landing.votingStartAt) {
      const startMs = new Date(landing.votingStartAt).getTime();
      if (!isNaN(startMs) && now < startMs) {
        throw new BadRequestException(
          `Chưa đến thời gian mở cổng bình chọn (Bắt đầu lúc: ${new Date(startMs).toLocaleString('vi-VN')}).`,
        );
      }
    }
    if (landing.votingEndAt) {
      const endMs = new Date(landing.votingEndAt).getTime();
      if (!isNaN(endMs) && now > endMs) {
        throw new BadRequestException(
          `Thời gian bình chọn đã kết thúc lúc ${new Date(endMs).toLocaleString('vi-VN')}.`,
        );
      }
    }

    // Kiểm tra mỗi người chỉ được vote 1 lần duy nhất trên landing page này
    const existingVotes = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, slide_id, option_id, option_label, created_at
       FROM public.landing_video_votes
       WHERE landing_id = $1 AND LOWER(voter_email) = $2
       LIMIT 1`,
      landing.id,
      voterEmail,
    ).catch(() => []);

    if (existingVotes.length > 0) {
      throw new BadRequestException(
        `Email "${voterEmail}" đã thực hiện bình chọn trước đó! Mỗi người chỉ được bình chọn 1 lần duy nhất.`,
      );
    }

    const slide = (landing.slides || []).find((s) => s.id === slideId);
    const opt = (slide?.votingOptions || []).find((o) => o.id === optionId);
    const optionLabel = opt?.label || optionId;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO public.landing_video_votes (
        id, landing_id, slide_id, option_id, option_label, voter_name, voter_email, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
      )`,
      landing.id,
      slideId,
      optionId,
      optionLabel,
      voterName,
      voterEmail,
    );

    const stats = await this.getVideoVotingStats(landing.id);
    return {
      ok: true,
      message: `Cảm ơn ${voterName}! Hệ thống đã ghi nhận lựa chọn bình chọn của bạn.`,
      stats,
    };
  }

  /**
   * Thống kê kết quả bình chọn video theo thời gian thực (Realtime tỷ lệ lựa chọn & danh sách người vote)
   */
  async getVideoVotingStats(slugOrId: string) {
    const list = await this.getAllLandingWebs();
    const target = (slugOrId || '').toLowerCase().trim();
    let landing =
      list.find(
        (w) =>
          w.id === slugOrId ||
          (w.slug && w.slug.toLowerCase() === target) ||
          (w.subdomain && w.subdomain.toLowerCase() === target),
      ) || list.find((w) => w.template === 'video_voting_showcase');

    if (!landing) {
      landing = this.generateDefaultTemplate(
        'video_voting_showcase',
        'Trình Chiếu 7 Video & Bình Chọn Realtime (Pinterest 900790362966152495)',
        'video-voting',
      );
    }

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, slide_id, option_id, option_label, voter_name, voter_email, created_at
       FROM public.landing_video_votes
       WHERE landing_id = $1
       ORDER BY created_at DESC`,
      landing.id,
    ).catch(() => []);

    // Lọc các lượt vote nằm trong khoảng thời gian đã cài đặt (nếu có)
    const startMs = landing.votingStartAt ? new Date(landing.votingStartAt).getTime() : null;
    const endMs = landing.votingEndAt ? new Date(landing.votingEndAt).getTime() : null;

    const validVotes = rows.filter((r) => {
      const t = new Date(r.created_at).getTime();
      if (startMs && !isNaN(startMs) && t < startMs) return false;
      if (endMs && !isNaN(endMs) && t > endMs) return false;
      return true;
    });

    const slideStats = (landing.slides || []).map((slide, idx) => {
      const votesForSlide = validVotes.filter((v) => v.slide_id === slide.id);
      const totalSlideVotes = votesForSlide.length;
      const options = (slide.votingOptions || []).map((opt) => {
        const count = votesForSlide.filter((v) => v.option_id === opt.id).length;
        const percentage = totalSlideVotes > 0 ? Math.round((count / totalSlideVotes) * 1000) / 10 : 0;
        return {
          id: opt.id,
          label: opt.label,
          description: opt.description || '',
          count,
          percentage,
        };
      });

      return {
        slideId: slide.id,
        slideNumber: idx + 1,
        place: slide.place,
        title: `${slide.title1} ${slide.title2}`.trim(),
        videoUrl: slide.videoUrl || '',
        image: slide.image || '',
        votingQuestion: slide.votingQuestion || `Bình chọn cho Video Màn 0${idx + 1}`,
        totalVotes: totalSlideVotes,
        options,
      };
    });

    return {
      landingId: landing.id,
      slug: landing.slug,
      name: landing.name,
      isPublished: landing.isPublished,
      votingStartAt: landing.votingStartAt || null,
      votingEndAt: landing.votingEndAt || null,
      totalVoters: validVotes.length,
      allTimeVoters: rows.length,
      slideStats,
      recentVoters: validVotes.slice(0, 50).map((v) => ({
        id: v.id,
        slideId: v.slide_id,
        optionId: v.option_id,
        optionLabel: v.option_label,
        voterName: v.voter_name,
        voterEmail: v.voter_email,
        createdAt: v.created_at,
      })),
    };
  }

  private buildSimplePdfBuffer(lines: string[]): Buffer {
    const sanitize = (s: string) =>
      String(s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');

    const pageLines = lines.slice(0, 46);
    const textCommands = [
      'BT',
      '/F1 11 Tf',
      '45 790 Td',
      '15 TL',
      ...pageLines.map((ln, idx) =>
        idx === 0 ? `(${sanitize(ln)}) Tj` : `T* (${sanitize(ln)}) Tj`,
      ),
      'ET',
    ].join('\n');

    const objects: string[] = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
      `4 0 obj << /Length ${Buffer.byteLength(textCommands, 'utf8')} >> stream\n${textCommands}\nendstream endobj`,
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];
    for (const obj of objects) {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += `${obj}\n`;
    }
    const xrefPos = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
    return Buffer.from(pdf, 'utf8');
  }

  /**
   * Xuất kết quả Voting Video thành file PDF và lưu vào thư mục "Sự kiện" trong Quản lý Tài liệu
   */
  async exportVotingResultsPdfToDocuments(idOrSlug: string) {
    const stats = await this.getVideoVotingStats(idOrSlug);
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    const { randomUUID } = await import('crypto');

    const lines: string[] = [
      `BAO CAO KET QUA VOTING VIDEO - ${stats.name || 'CEO HN10'}`,
      `Thoi gian xuat: ${new Date().toLocaleString('vi-VN')}`,
      `Tong so nguoi binh chon: ${stats.totalVoters ?? 0}`,
      '----------------------------------------------------------------------',
    ];

    for (const st of stats.slideStats || []) {
      lines.push(`VIDEO 0${st.slideNumber}: ${st.title || st.votingQuestion} (${st.totalVotes} phieu)`);
      for (const opt of st.options || []) {
        lines.push(`   - ${opt.label}: ${opt.percentage}% (${opt.count} phieu)`);
      }
      lines.push('');
    }

    if (Array.isArray(stats.recentVoters) && stats.recentVoters.length > 0) {
      lines.push('DANH SACH NGUOI BINH CHON:');
      for (const v of stats.recentVoters.slice(0, 15)) {
        lines.push(`   * ${v.voterName} (${v.voterEmail}) -> ${v.optionLabel}`);
      }
    }

    const pdfBuffer = this.buildSimplePdfBuffer(lines);
    const fileName = `voting-result-${Date.now()}.pdf`;
    const fileUrl = `/upload/file/documents/${fileName}`;

    for (const dir of [
      path.join('/app', 'uploads', 'documents'),
      path.join(os.tmpdir(), 'ceohn10_uploads', 'documents'),
    ]) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, fileName), pdfBuffer);
      } catch {}
    }

    // Tìm hoặc tạo thư mục "Sự kiện" trong public.documents
    const existingFolders = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name FROM public.documents
       WHERE (is_folder = true OR type = 'folder')
         AND (LOWER(TRIM(COALESCE(name, title, ''))) = 'sự kiện' OR LOWER(TRIM(COALESCE(category, ''))) = 'sự kiện')
       LIMIT 1`,
    ).catch(() => []);

    let eventFolderId = existingFolders[0]?.id || null;
    if (!eventFolderId) {
      eventFolderId = randomUUID();
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO public.documents (
          id, title, name, category, type, is_folder, file_url, file_path,
          doc_scope, color_tag, uploaded_by_name, created_by, created_at, updated_at
        ) VALUES ($1, $2, $2, $3, 'folder', true, '', '', 'association', '#0EA5E9', 'Hệ thống Voting', 'system', NOW(), NOW())`,
        eventFolderId,
        'Sự kiện',
        'Sự kiện',
      ).catch(() => {});
    }

    const docId = randomUUID();
    const docTitle = `Kết quả Voting Video - ${stats.name || 'Landing Page'} (${new Date().toLocaleDateString('vi-VN')}).pdf`;
    const sizeLabel = `${Math.max(1, Math.round(pdfBuffer.length / 1024))} KB`;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO public.documents (
        id, title, name, category, type, size, is_folder, folder_id,
        file_url, file_path, doc_scope, uploaded_by_name, created_by, created_at, updated_at
      ) VALUES ($1, $2, $2, 'Sự kiện', 'pdf', $3, false, $4, $5, $5, 'association', 'Hệ thống Voting', 'system', NOW(), NOW())`,
      docId,
      docTitle,
      sizeLabel,
      eventFolderId,
      fileUrl,
    );

    return {
      ok: true,
      documentId: docId,
      folderId: eventFolderId,
      folderName: 'Sự kiện',
      title: docTitle,
      fileUrl,
      totalVoters: stats.totalVoters ?? 0,
    };
  }

  /**
   * Tạo cấu hình mẫu chuẩn
   */
  private generateDefaultTemplate(
    template:
      | 'timed_cards_opening'
      | 'ceohn10_executive'
      | 'startup_mobile_showcase'
      | 'forge_luxury_atelier'
      | 'modern_luxury_estate'
      | 'video_voting_showcase',
    name: string,
    slug?: string,
    subdomain?: string,
  ): LandingWebConfig {
    const isCeo = template === 'ceohn10_executive';
    const isStartupMobile = template === 'startup_mobile_showcase';
    const isVideoVoting = template === 'video_voting_showcase';
    const now = new Date().toISOString();
    const endDefault = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const id = isVideoVoting
      ? 'lw_video_voting_7slides_default'
      : `lw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    return {
      id,
      name,
      slug: slug || (isVideoVoting ? 'video-voting' : isStartupMobile ? 'web-v2' : 'web-v1'),
      subdomain: subdomain || (isVideoVoting ? 'video-voting' : isStartupMobile ? 'web-v2' : 'web-v1'),
      isPublished: true,
      template,
      votingStartAt: isVideoVoting ? now : undefined,
      votingEndAt: isVideoVoting ? endDefault : undefined,
      votingDurationMinutes: isVideoVoting ? 120 : undefined,
      theme: {
        primaryColor: isVideoVoting ? '#ecad29' : isCeo || isStartupMobile ? '#003B95' : '#ecad29',
        secondaryColor: isVideoVoting ? '#0B0F19' : isCeo || isStartupMobile ? '#ecad29' : '#1a1a1a',
        textColor: isStartupMobile ? '#0F172A' : '#FFFFFF',
        backgroundColor: isStartupMobile ? '#F8FAFC' : '#0B0F19',
        fontFamily: 'Inter, Oswald, sans-serif',
      },
      brand: {
        logoText:
          isVideoVoting
            ? 'CEO HN10 VIDEO SHOWCASE & VOTING'
            : isCeo || isStartupMobile
            ? 'CLB Doanh Nhân CEO HN10'
            : 'Globe Express',
        logoIcon: isStartupMobile ? 'smartphone' : isCeo ? 'shield' : 'globe',
        contactPhone: '0983.1010.10',
        contactEmail: 'contact@ceohn10.viconnect.vn',
      },
      navMenu:
        isCeo || isStartupMobile
          ? [
            {
              id: 'm-1',
              label: 'Trang Chủ',
              active: true,
              type: 'link',
              url: '#home',
            },
            {
              id: 'm-2',
              label: 'Hệ Sinh Thái App',
              type: 'tree_dropdown',
              children: [
                {
                  id: 'm-2-1',
                  label: 'Sàn Thương Mại B2B',
                  badge: 'Hot',
                  type: 'modal_screen',
                  subScreenId: 'scr-b2b',
                  children: [
                    {
                      id: 'm-2-1-1',
                      label: 'Phần mềm & Chuyển đổi số',
                      type: 'modal_screen',
                      subScreenId: 'scr-erp',
                    },
                    {
                      id: 'm-2-1-2',
                      label: 'Thiết bị & Vật tư IoT',
                      type: 'modal_screen',
                      subScreenId: 'scr-iot',
                    },
                  ],
                },
                {
                  id: 'm-2-2',
                  label: 'Lịch Gặp & Kết Nối 1-on-1',
                  type: 'modal_screen',
                  subScreenId: 'scr-connect',
                },
                {
                  id: 'm-2-3',
                  label: 'Thẻ Doanh Nhân Số & QR',
                  type: 'modal_screen',
                  subScreenId: 'scr-card',
                },
              ],
            },
            {
              id: 'm-3',
              label: 'Ban Điều Hành',
              type: 'modal_screen',
              subScreenId: 'scr-board',
            },
            { id: 'm-4', label: 'Hỏi Đáp FAQ', type: 'link', url: '#faq' },
            {
              id: 'm-5',
              label: 'Tải Ứng Dụng',
              type: 'link',
              url: '#download',
            },
          ]
          : DEFAULT_TIMED_CARDS_NAV,
      slides: isVideoVoting
        ? JSON.parse(JSON.stringify(DEFAULT_VIDEO_VOTING_7_SLIDES))
        : isCeo
        ? [
          {
            id: 's-1',
            place: 'HÀ NỘI — VIỆT NAM',
            title1: 'KẾT NỐI',
            title2: 'DOANH NHÂN 1983',
            description:
              'Cộng đồng Doanh nhân CEO HN10 quy tụ các nhà sáng lập, lãnh đạo doanh nghiệp sinh năm 1983 tiên phong đổi mới, cùng nhau kiến tạo chuỗi giá trị và liên kết giao thương bền vững trực thuộc HanoiBA.',
            image:
              'https://ceohn10.viconnect.vn/ceohn10_hero_daylight_skyline.jpg',
            ctaText: 'Gia Nhập Ngay',
            ctaLink: '#register',
          },
          {
            id: 's-2',
            place: 'SÀN THƯƠNG MẠI NỘI KHỐI',
            title1: 'SẢN PHẨM',
            title2: 'TIÊU BIỂU B2B',
            description:
              'Không gian kết nối giao thương nội khối, giới thiệu sản phẩm dịch vụ tiêu biểu và chuyển giao công nghệ giữa các thành viên với chính sách ưu đãi đặc quyền tối ưu.',
            image:
              'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1600',
            ctaText: 'Xem Gian Hàng',
            ctaLink: '#products',
          },
          {
            id: 's-3',
            place: 'DIỄN ĐÀN THƯỜNG NIÊN',
            title1: 'LEADERSHIP',
            title2: 'SUMMIT 2026',
            description:
              'Sự kiện thường niên hội tụ các chuyên gia kinh tế, nhà hoạch định chiến lược và hơn 500 doanh nhân tiêu biểu thảo luận về xu hướng thị trường và cơ hội chuyển đổi số.',
            image:
              'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600',
            ctaText: 'Đăng Ký Tham Dự',
            ctaLink: '#events',
          },
          {
            id: 's-4',
            place: 'HỢP TÁC CHIẾN LƯỢC',
            title1: 'GIAO THƯƠNG',
            title2: 'B2B MATCHING',
            description:
              'Cơ chế ghép cặp B2B 1-on-1, trao đổi cơ hội kinh doanh thực chiến và thúc đẩy các gói hợp đồng giao thương quy mô hàng chục tỷ đồng minh bạch, hiệu quả.',
            image:
              'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600',
            ctaText: 'Lên Lịch Kết Nối',
            ctaLink: '#matching',
          },
        ]
        : DEFAULT_TIMED_CARDS_SLIDES,
      subScreens: DEFAULT_SUB_SCREENS,
      apiConfig: {
        enabled: false,
        endpointUrl: '/api/opportunities',
        method: 'GET',
        rootPath: '',
        fieldMapping: {
          place: 'company',
          title1: 'title',
          title2: 'industry',
          description: 'description',
          image: 'image',
          ctaText: 'ctaText',
        },
      },
      startupConfig: isStartupMobile
        ? JSON.parse(JSON.stringify(DEFAULT_STARTUP_MOBILE_CONFIG))
        : undefined,
      createdAt: now,
      updatedAt: now,
    };
  }
}
