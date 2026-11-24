/**
 * BRANDING & ASSETS CONFIGURATION - CEO HN10 (HANOIBA)
 * Quản lý tập trung toàn bộ logo, biểu trưng, hình ảnh đại diện và thông tin thương hiệu.
 * Tuyệt đối không hardcode đường dẫn ảnh hoặc icon rải rác trong các route.
 */

export const BRAND_ASSETS = {
  // Logo nhận diện thương hiệu
  logoSquare: '/ceohn10-logo.png',
  logoHeader: '/brand-header-logo.png',
  logoFavicon: '/favicon.ico',
  logoWhite: '/ceohn10-logo-white.png',

  // Fallback avatars theo phong cách doanh nhân
  defaultAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  defaultCompanyLogo: '/brand-header-logo.png',

  // QR Code placeholder cho học viên
  defaultQrFrame: '/ceohn10-qr-frame.png',
} as const;

export const BRAND_INFO = {
  shortName: 'CEO HN10',
  name: 'CLB Doanh Nhân CEO HN10',
  association: 'Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)',
  slogan: 'Kết Nối Giá Trị - Nâng Tầm Doanh Nhân',
  hotline: '1900 1983',
  email: 'contact@ceohn10.vn',
  website: 'https://ceohn10.vn',
  officeAddress: 'Hà Nội, Việt Nam',
} as const;

export const BRAND_COLORS = {
  navy: '#002B70',
  navyDark: '#001D4D',
  gold: '#D4AF37',
  goldLight: '#F3E5AB',
  rubyRed: '#DC2626',
  royalBlue: '#1D4ED8',
  slateDark: '#0F172A',
  slateLight: '#F8FAFC',
} as const;
