import type { CapacitorConfig } from '@capacitor/cli';

/**
 * =========================================================================
 * CEO HN10 MOBILE - CẤU HÌNH CAPACITOR THEO MÔI TRƯỜNG
 * =========================================================================
 *
 * [CHẾ ĐỘ HIỆN TẠI] DEV LIVE SERVER:
 * - Đang bật `server.url` trỏ về IP Dev (14.225.217.232:5444).
 * - Sửa giao diện/logic FE chỉ cần deploy lên server dev là APK tự đổi, không cần build lại.
 *
 * [HƯỚNG A] ĐÓNG GÓI TĨNH STANDALONE / OFFLINE:
 * - Đổi `USE_REMOTE_SERVER = false` bên dưới (hoặc comment khối server).
 * - Chạy: `npm run build:static` (hoặc build FE rồi chạy `npx cap sync android`).
 * - Mở Android Studio build lại file APK. Toàn bộ code sẽ nằm cố định trong APK.
 *
 * [HƯỚNG B] PRODUCTION QUA DOMAIN HTTPS CHÍNH THỨC:
 * - Đổi `USE_REMOTE_SERVER = true`.
 * - Đổi `REMOTE_URL` thành domain production chính thức có SSL (ví dụ: 'https://app.ceohn10.vn').
 * - Đổi `CLEARTEXT = false`.
 * =========================================================================
 */

// CẤU HÌNH LIVE SERVER: Mở trực tiếp App Hiệp Hội CEO HN10 chuẩn
const USE_REMOTE_SERVER = true;

// URL Cổng Web chính thức của Phân hệ Hiệp hội CLB Doanh Nhân CEO HN10 (100% HTTPS có SSL Domain chính thức)
export const REMOTE_URL = 'https://ceohn10.viconnect.vn/association';
export const WEB_PORTAL_URL = 'https://ceohn10.viconnect.vn/association';

// Chạy 100% bảo mật HTTPS
const CLEARTEXT = false;

const config: CapacitorConfig = {
  appId: 'vn.ceohn10.app',
  appName: 'CEO HN10',

  // Thư mục chứa gói web bundle tĩnh
  webDir: 'www',

  server: {
    url: USE_REMOTE_SERVER ? REMOTE_URL : undefined,
    androidScheme: 'https',
    cleartext: CLEARTEXT,
    allowNavigation: [
      '14.225.217.232*',
      '14.225.217.232:5444*',
      'ceohn10.viconnect.vn*',
      '*.ceohn10.viconnect.vn*',
      'ceohn10.com*',
      '*.ceohn10.com*',
      'api.qrserver.com*'
    ]
  }
};

export default config;

