const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = 'C:\\Users\\vumik\\.gemini\\antigravity\\brain\\d06e38ce-4ddc-4f6c-b41d-5fd1d20eecb7\\screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const BACKEND_URL = 'http://127.0.0.1:4003/api';
const FRONTEND_URL = 'http://127.0.0.1:5173';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function loginApi(email, password) {
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${await res.text()}`);
  return res.json();
}

async function injectAuth(page, authData) {
  const token = authData.access_token || authData.token || '';
  const user = authData.user || {};
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('vibe_token', token);
    localStorage.setItem('token', token);
    localStorage.setItem('vibe_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user });
}

async function main() {
  console.log('🚀 Chạy kịch bản kiểm thử hiển thị dữ liệu thực tế Sự Kiện CEO HN10...');
  
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    const auth = await loginApi('admin.hn10@ceohn10.vn', '123456a@');
    await injectAuth(page, auth);

    // 1. Mở trang Quản lý sự kiện /events
    console.log('1. Mở /events kiểm tra hiển thị sự kiện thực tế...');
    await page.goto(`${FRONTEND_URL}/events`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const shot01 = path.join(SCREENSHOTS_DIR, '01_live_events_table_with_real_event.png');
    await page.screenshot({ path: shot01, fullPage: false });
    console.log('📸 Đã chụp:', shot01);

    // 2. Mở trang Danh sách đăng ký sự kiện /event-registrations
    console.log('2. Mở /event-registrations kiểm tra 6 đại biểu...');
    await page.goto(`${FRONTEND_URL}/event-registrations`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const shot02 = path.join(SCREENSHOTS_DIR, '02_live_event_registrations_attendees.png');
    await page.screenshot({ path: shot02, fullPage: false });
    console.log('📸 Đã chụp:', shot02);

    // 3. Mở trang Cấu hình QR Checkin /checkin-qr
    console.log('3. Mở /checkin-qr kiểm tra mã QR sự kiện...');
    await page.goto(`${FRONTEND_URL}/checkin-qr`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const shot03 = path.join(SCREENSHOTS_DIR, '03_live_event_checkin_qr_code.png');
    await page.screenshot({ path: shot03, fullPage: false });
    console.log('📸 Đã chụp:', shot03);

    // 4. Mở Cổng Soát vé Check-in /event-checkin
    console.log('4. Mở /event-checkin kiểm tra cửa soát vé...');
    await page.goto(`${FRONTEND_URL}/event-checkin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const shot04 = path.join(SCREENSHOTS_DIR, '04_live_event_checkin_action.png');
    await page.screenshot({ path: shot04, fullPage: false });
    console.log('📸 Đã chụp:', shot04);

    // 5. Mở Cổng Học Viên Mobile App CEO HN10 /association
    console.log('5. Mở /association kiểm tra sự kiện trên Cổng Học viên Mobile App...');
    await page.goto(`${FRONTEND_URL}/association`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const shot05 = path.join(SCREENSHOTS_DIR, '05_live_mobile_app_event_view.png');
    await page.screenshot({ path: shot05, fullPage: false });
    console.log('📸 Đã chụp:', shot05);

    console.log('🎉 Hoàn tất kiểm thử và chụp ảnh giao diện thực tế!');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
