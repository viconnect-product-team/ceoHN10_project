const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = 'C:/Users/vumik/.gemini/antigravity/brain/66c3fe0c-3aee-47bd-af2a-11049fa07d73/screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function main() {
  console.log('🚀 KIỂM THỬ XÁC MINH CÁC LỖI TRONG 3 ẢNH CỦA NGƯỜI DÙNG...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Đăng nhập CRM
  await page.goto('http://localhost:5173/login');
  await page.evaluate(() => {
    localStorage.setItem('vibe_token', 'mock_admin_token_ceohn10');
    localStorage.setItem('access_token', 'mock_admin_token_ceohn10');
    localStorage.setItem('vba_active_assoc_name', 'CLB Doanh Nhân CEO HN10');
    localStorage.setItem('crm_system_name', 'CLB Doanh Nhân CEO HN10');
    localStorage.setItem('user', JSON.stringify({
      id: '00000000-0000-4000-8000-000000000001',
      fullName: 'Chủ Tịch CLB CEO HN10',
      email: 'admin@viconnect.vn',
      role: 'admin',
      associationId: '00000000-0000-4000-8000-000000000001',
    }));
  });

  // 1. Kiểm tra trang /events - Đã có dữ liệu 2 sự kiện, Header chuẩn "CLB Doanh Nhân CEO HN10", Sidebar sạch
  console.log('--- 1. Kiểm tra /events có dữ liệu, Header chuẩn CEO HN10 & không còn dropdown Hệ Thống Quản Trị ---');
  await page.goto('http://localhost:5173/events', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const shot1 = path.join(SCREENSHOTS_DIR, 'fix_01_events_list_with_data_and_clean_sidebar.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('📸 Đã chụp:', shot1);

  // 2. Kiểm tra Form Đăng ký & Check-in Công khai (100% PUBLIC, không chặn Auth)
  console.log('--- 2. Kiểm tra /guest-event-register/EVT-FREE-2026?checkin=true ---');
  const guestPage = await context.newPage();
  await guestPage.goto('http://localhost:5173/guest-event-register/EVT-FREE-2026?checkin=true', { waitUntil: 'networkidle' });
  await guestPage.waitForTimeout(1000);
  const shot2 = path.join(SCREENSHOTS_DIR, 'fix_02_public_guest_register_and_checkin_form.png');
  await guestPage.screenshot({ path: shot2, fullPage: false });
  console.log('📸 Đã chụp:', shot2);

  // 3. Kiểm tra Trang Biểu Quyết /voting - Nút Gửi Link Biểu Quyết (Email & Zalo OA)
  console.log('--- 3. Kiểm tra /voting và Modal Gửi Link Biểu Quyết ---');
  await page.goto('http://localhost:5173/voting', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const sendBtn = page.locator('button:has-text("Gửi Link Biểu Quyết")').first();
  if (await sendBtn.isVisible()) {
    await sendBtn.click();
    await page.waitForTimeout(1000);
  }
  const shot3 = path.join(SCREENSHOTS_DIR, 'fix_03_voting_broadcast_modal_with_checkedin_attendees.png');
  await page.screenshot({ path: shot3, fullPage: false });
  console.log('📸 Đã chụp:', shot3);

  // 4. Kiểm tra Trang Biểu Quyết Công Khai Khách Mời /guest-voting
  console.log('--- 4. Kiểm tra /guest-voting/VOTE-LOCAL-001 ---');
  await guestPage.goto('http://localhost:5173/guest-voting/VOTE-LOCAL-001', { waitUntil: 'networkidle' });
  await guestPage.waitForTimeout(1000);
  const shot4 = path.join(SCREENSHOTS_DIR, 'fix_04_guest_public_voting_page.png');
  await guestPage.screenshot({ path: shot4, fullPage: false });
  console.log('📸 Đã chụp:', shot4);

  // 5. Kiểm tra Báo Cáo Tài Chính /finance-report - Dòng tiền từ Vé Sự Kiện đã nộp
  console.log('--- 5. Kiểm tra /finance-report - Biến động dòng tiền Vé sự kiện ---');
  await page.goto('http://localhost:5173/finance-report', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const shot5 = path.join(SCREENSHOTS_DIR, 'fix_05_finance_report_event_tickets_cashflow.png');
  await page.screenshot({ path: shot5, fullPage: false });
  console.log('📸 Đã chụp:', shot5);

  // 6. Kiểm tra Phản Ánh Góp Ý /feedback - Lọc theo Sự Kiện Cụ Thể
  console.log('--- 6. Kiểm tra /feedback - Danh sách phản ánh theo sự kiện ---');
  await page.goto('http://localhost:5173/feedback', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const shot6 = path.join(SCREENSHOTS_DIR, 'fix_06_feedback_filtered_by_event.png');
  await page.screenshot({ path: shot6, fullPage: false });
  console.log('📸 Đã chụp:', shot6);

  await browser.close();
  console.log('🎉 ĐÃ HOÀN TẤT CHỤP ẢNH MINH CHỨNG CHO TẤT CẢ CÁC MỤC!');
}

main().catch(err => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
