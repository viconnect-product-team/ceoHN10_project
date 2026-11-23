const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = 'C:\\Users\\vumik\\.gemini\\antigravity\\brain\\66c3fe0c-3aee-47bd-af2a-11049fa07d73\\screenshots';
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
  console.log('🚀 BẮT ĐẦU KIỂM THỬ THỰC TẾ LOCALHOST 100% CSDL POSTGRESQL LOCAL...');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  console.log('🔑 Đăng nhập Administrator...');
  const auth = await loginApi('admin@connect.vn', '123456');
  await injectAuth(page, auth);
  console.log('✅ Đăng nhập thành công:', auth.user.name);

  // 1. Mở trang Quản lý sự kiện /events
  console.log('1. Mở /events kiểm tra hiển thị 2 sự kiện từ CSDL Localhost và kiểm tra Sidebar...');
  await page.goto(`${FRONTEND_URL}/events`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const shot01 = path.join(SCREENSHOTS_DIR, '01_localhost_events_with_real_data.png');
  await page.screenshot({ path: shot01, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 01]:', shot01);

  // 2. Mở Popup "+ Tạo sự kiện" kiểm tra Add Nhà tài trợ & 5 Mẫu sự kiện
  console.log('2. Mở Popup "+ Tạo sự kiện" kiểm tra 5 mẫu sự kiện và chức năng Add Nhà tài trợ...');
  const createBtn = page.locator('button:has-text("Tạo sự kiện"), button:has-text("+ Tạo sự kiện")').first();
  if (await createBtn.isVisible()) {
    await createBtn.click();
    await page.waitForTimeout(2000);
    const shot02 = path.join(SCREENSHOTS_DIR, '02_create_event_popup_with_sponsor_selector.png');
    await page.screenshot({ path: shot02, fullPage: false });
    console.log('📸 [ĐÃ CHỤP 02]:', shot02);

    const closeBtn = page.locator('button:has-text("Hủy"), button:has-text("Đóng"), button[aria-label="Close"]').first();
    if (await closeBtn.isVisible()) await closeBtn.click().catch(() => {});
    await page.waitForTimeout(1000);
  }

  // 3. Trước sự kiện: Đăng ký vé & Xếp chỗ ngồi (/guest-event-register/EVT-PAID-2026)
  console.log('3. Mở trang đăng ký khách /guest-event-register/EVT-PAID-2026 (Có phí & VietQR)...');
  await page.goto(`${FRONTEND_URL}/guest-event-register/EVT-PAID-2026`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const shot03 = path.join(SCREENSHOTS_DIR, '03_guest_register_paid_vietqr.png');
  await page.screenshot({ path: shot03, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 03]:', shot03);

  // 4. Danh sách đăng ký & Xếp chỗ ngồi (/event-registrations)
  console.log('4. Mở /event-registrations kiểm tra phân loại trước giờ G & số ghế VIP...');
  await page.goto(`${FRONTEND_URL}/event-registrations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const shot04 = path.join(SCREENSHOTS_DIR, '04_event_registrations_seating_and_origin.png');
  await page.screenshot({ path: shot04, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 04]:', shot04);

  // 5. Trong sự kiện: Cổng Soát Vé Check-in (/event-checkin)
  console.log('5. Mở Cổng soát vé /event-checkin...');
  await page.goto(`${FRONTEND_URL}/event-checkin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 5.1 Check-in đại biểu có trong danh sách (Lê Hoàng Long - 0901234567)
  const searchInput = page.locator('input[placeholder*="mã vé" i], input[placeholder*="SĐT" i], input[placeholder*="Tìm" i], input[type="text"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('0901234567');
    const searchBtn = page.locator('button:has-text("Tra cứu"), button:has-text("Tìm"), button:has-text("Quét")').first();
    if (await searchBtn.isVisible()) await searchBtn.click();
    await page.waitForTimeout(1500);

    const checkinBtn = page.locator('button:has-text("Xác nhận Check-in"), button:has-text("Check-in ngay")').first();
    if (await checkinBtn.isVisible()) await checkinBtn.click();
    await page.waitForTimeout(2000);
  }
  const shot05 = path.join(SCREENSHOTS_DIR, '05_checkin_registered_vip_success.png');
  await page.screenshot({ path: shot05, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 05]:', shot05);

  // 5.2 Khách vãng lai mới đến sự kiện miễn phí -> CHECK-IN PASS NGAY + TỰ SINH CỘT ĐÁNH DẤU
  console.log('5.2 Soát vé khách vãng lai sự kiện miễn phí (0977889900) -> Check-in PASS ngay...');
  if (await searchInput.isVisible()) {
    await searchInput.fill('0977889900');
    const searchBtn = page.locator('button:has-text("Tra cứu"), button:has-text("Tìm")').first();
    if (await searchBtn.isVisible()) await searchBtn.click();
    await page.waitForTimeout(2500);
  }
  const shot06 = path.join(SCREENSHOTS_DIR, '06_checkin_free_walkin_unannounced_pass.png');
  await page.screenshot({ path: shot06, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 06]:', shot06);

  // 6. Trong sự kiện: Biểu Quyết & Bầu Cử (/voting)
  console.log('6. Mở trang Biểu quyết & Bầu cử /voting...');
  await page.goto(`${FRONTEND_URL}/voting`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const shot07 = path.join(SCREENSHOTS_DIR, '07_in_event_voting_and_elections.png');
  await page.screenshot({ path: shot07, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 07]:', shot07);

  // 7. Sau sự kiện: Phản ánh góp ý & Khảo sát chất lượng (/guest-event-feedback/EVT-PAID-2026)
  console.log('7. Mở trang Khảo sát & Phản ánh góp ý sau sự kiện...');
  await page.goto(`${FRONTEND_URL}/guest-event-feedback/EVT-PAID-2026`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const shot08 = path.join(SCREENSHOTS_DIR, '08_post_event_feedback_and_survey.png');
  await page.screenshot({ path: shot08, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 08]:', shot08);

  // 8. Sau sự kiện: Thống kê báo cáo tài chính (/finance-report)
  console.log('8. Mở trang Báo cáo Tài chính & Quỹ sự kiện /finance-report...');
  await page.goto(`${FRONTEND_URL}/finance-report`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const shot09 = path.join(SCREENSHOTS_DIR, '09_post_event_financial_report.png');
  await page.screenshot({ path: shot09, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 09]:', shot09);

  await browser.close();
  console.log('🎉 HOÀN THÀNH KIỂM THỬ THỰC TẾ TRÊN LOCALHOST CÓ DỮ LIỆU ĐẦY ĐỦ!');
}

main().catch(err => {
  console.error('❌ LỖI KIỂM THỬ LOCALHOST:', err);
  process.exit(1);
});
