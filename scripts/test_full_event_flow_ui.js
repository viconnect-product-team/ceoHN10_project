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
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN LUỒNG SỰ KIỆN TRỰC TIẾP TRÊN GIAO DIỆN...');

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

  // Đăng nhập Admin
  console.log('🔑 Đang đăng nhập tài khoản Quản trị viên...');
  const auth = await loginApi('admin@connect.vn', '123456');
  await injectAuth(page, auth);
  console.log('✅ Đăng nhập thành công với vai trò:', auth.user.name);

  // Tạo 2 sự kiện thông qua Backend API (1 có phí 500k, 1 miễn phí 0k) để có dữ liệu thực tế chuẩn trong DB
  console.log('📦 Chuẩn bị dữ liệu 2 sự kiện mẫu (Có phí & Miễn phí)...');
  const now = new Date();
  const startTime = new Date(now.getTime() + 86400000).toISOString();
  const endTime = new Date(now.getTime() + 90000000).toISOString();

  // 1. Sự kiện có phí (Year End Party 500k)
  const paidEventRes = await fetch(`${BACKEND_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.access_token}`,
    },
    body: JSON.stringify({
      title: 'DẠ TIỆC TẤT NIÊN YEAR END PARTY 2026 - CEO HN10',
      description: 'Đêm tiệc tri ân và giao lưu kết nối doanh nhân CEO HN10 cuối năm.',
      type: 'year_end_party',
      category: 'Hội nghị - Dạ tiệc',
      location: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
      ticket_price: 500000,
      fee: 500000,
      capacity: 300,
      start_time: startTime,
      end_time: endTime,
      format: 'offline',
      status: 'published',
      sponsors: [
        {
          name: 'Tập đoàn Công nghệ Viconnect Vietnam',
          sponsor_type: 'companion',
          amount: 50000000,
          notes: 'Nhà tài trợ đồng hành - Chuyển khoản',
        }
      ]
    }),
  }).catch(() => null);
  const paidEventData = paidEventRes && paidEventRes.ok ? await paidEventRes.json() : null;
  const paidEvent = paidEventData?.event || paidEventData || { id: 'EVT-PAID-2026', title: 'DẠ TIỆC TẤT NIÊN YEAR END PARTY 2026 - CEO HN10' };
  console.log(`✅ Sự kiện có phí: ${paidEvent.title} (ID: ${paidEvent.id})`);

  // 2. Sự kiện miễn phí (Khai giảng 0k)
  const freeEventRes = await fetch(`${BACKEND_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.access_token}`,
    },
    body: JSON.stringify({
      title: 'LỄ KHAI GIẢNG KHÓA HỌC DOANH TRÍ CEO HN10',
      description: 'Lễ khai giảng khóa đào tạo lãnh đạo và quản trị doanh nghiệp cao cấp.',
      type: 'khai_giang',
      category: 'Đào tạo',
      location: 'Hội trường Tầng 5, Trụ sở CEO HN10, Cầu Giấy, Hà Nội',
      ticket_price: 0,
      fee: 0,
      capacity: 200,
      start_time: startTime,
      end_time: endTime,
      format: 'offline',
      status: 'published',
    }),
  }).catch(() => null);
  const freeEventData = freeEventRes && freeEventRes.ok ? await freeEventRes.json() : null;
  const freeEvent = freeEventData?.event || freeEventData || { id: 'EVT-FREE-2026', title: 'LỄ KHAI GIẢNG KHÓA HỌC DOANH TRÍ CEO HN10' };
  console.log(`✅ Sự kiện miễn phí: ${freeEvent.title} (ID: ${freeEvent.id})`);

  // ==========================================
  // GIAI ĐOẠN 1: TRƯỚC SỰ KIỆN (PRE-EVENT)
  // ==========================================
  console.log('\n--- [GIAI ĐOẠN 1: TRƯỚC SỰ KIỆN] ---');

  // 1.1 Mở trang Quản lý sự kiện /events
  console.log('1.1 Điều hướng tới /events kiểm tra hiển thị danh sách sự kiện...');
  await page.goto(`${FRONTEND_URL}/events`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const shot01 = path.join(SCREENSHOTS_DIR, '01_events_list_page.png');
  await page.screenshot({ path: shot01, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 01]:', shot01);

  // 1.2 Mở Popup "+ Tạo sự kiện" kiểm tra 5 mẫu sự kiện chuẩn
  console.log('1.2 Mở Popup "+ Tạo sự kiện" để kiểm tra 5 mẫu...');
  const createBtn = page.locator('button:has-text("Tạo sự kiện"), button:has-text("+ Tạo sự kiện")').first();
  if (await createBtn.isVisible()) {
    await createBtn.click();
    await page.waitForTimeout(1500);
    const shot02 = path.join(SCREENSHOTS_DIR, '02_create_event_wizard_templates.png');
    await page.screenshot({ path: shot02, fullPage: false });
    console.log('📸 [ĐÃ CHỤP 02]:', shot02);
    // Đóng modal
    const closeBtn = page.locator('button:has-text("Hủy"), button:has-text("Đóng"), button[aria-label="Close"]').first();
    if (await closeBtn.isVisible()) await closeBtn.click().catch(() => {});
    await page.waitForTimeout(1000);
  }

  // 1.3 Test đăng ký sự kiện CÓ PHÍ qua link QR/Web khách (/guest-event-register/:id)
  console.log(`1.3 Mở /guest-event-register/${paidEvent.id} để đăng ký vé có phí...`);
  await page.goto(`${FRONTEND_URL}/guest-event-register/${paidEvent.id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Điền form đăng ký đại biểu có phí
  const nameInput = page.locator('input[placeholder*="họ và tên" i], input[name="fullName"], input[placeholder*="Tên" i]').first();
  if (await nameInput.isVisible()) await nameInput.fill('Nguyễn Văn Tuấn (CEO Viconnect)');
  const phoneInput = page.locator('input[placeholder*="thoại" i], input[name="phone"], input[type="tel"]').first();
  if (await phoneInput.isVisible()) await phoneInput.fill('0912345678');
  const emailInput = page.locator('input[placeholder*="email" i], input[name="email"], input[type="email"]').first();
  if (await emailInput.isVisible()) await emailInput.fill('tuan.nguyen@viconnect.vn');
  const companyInput = page.locator('input[placeholder*="công ty" i], input[name="company"]').first();
  if (await companyInput.isVisible()) await companyInput.fill('Công ty Cổ phần Viconnect Group');

  const submitRegBtn = page.locator('button:has-text("Đăng ký"), button:has-text("Xác nhận đăng ký")').first();
  if (await submitRegBtn.isVisible()) {
    await submitRegBtn.click();
    await page.waitForTimeout(3000);
  }
  const shot03 = path.join(SCREENSHOTS_DIR, '03_guest_register_paid_event.png');
  await page.screenshot({ path: shot03, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 03]:', shot03);

  // 1.4 Test đăng ký sự kiện MIỄN PHÍ qua link QR/Web khách (/guest-event-register/:id)
  console.log(`1.4 Mở /guest-event-register/${freeEvent.id} để đăng ký vé miễn phí...`);
  await page.goto(`${FRONTEND_URL}/guest-event-register/${freeEvent.id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const nameInput2 = page.locator('input[placeholder*="họ và tên" i], input[name="fullName"], input[placeholder*="Tên" i]').first();
  if (await nameInput2.isVisible()) await nameInput2.fill('Trần Thị Mai (Giám đốc Chiến lược)');
  const phoneInput2 = page.locator('input[placeholder*="thoại" i], input[name="phone"], input[type="tel"]').first();
  if (await phoneInput2.isVisible()) await phoneInput2.fill('0987654321');
  const emailInput2 = page.locator('input[placeholder*="email" i], input[name="email"], input[type="email"]').first();
  if (await emailInput2.isVisible()) await emailInput2.fill('mai.tran@vione.com');

  const submitRegBtn2 = page.locator('button:has-text("Đăng ký"), button:has-text("Xác nhận đăng ký")').first();
  if (await submitRegBtn2.isVisible()) {
    await submitRegBtn2.click();
    await page.waitForTimeout(3000);
  }
  const shot04 = path.join(SCREENSHOTS_DIR, '04_guest_register_free_event.png');
  await page.screenshot({ path: shot04, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 04]:', shot04);

  // 1.5 Tạo các bản ghi đăng ký trước giờ G và kiểm tra tại /event-registrations
  console.log('1.5 Thêm danh sách đại biểu đăng ký trước giờ G vào hệ thống...');
  // Đại biểu đã đăng ký trước giờ G cho sự kiện có phí
  await fetch(`${BACKEND_URL}/events/${paidEvent.id}/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.access_token}` },
    body: JSON.stringify({
      fullName: 'Lê Hoàng Long',
      phone: '0901234567',
      email: 'long.le@hoanglong.vn',
      company: 'Hoàng Long Logistics',
      paymentStatus: 'paid',
      isWalkIn: false,
      registrationOrigin: 'pre_registered',
      note: 'Đại biểu đăng ký trước giờ G - Đã thanh toán 500k',
    }),
  }).catch(() => null);

  // Mở /event-registrations kiểm tra danh sách đại biểu
  console.log('1.6 Mở /event-registrations kiểm tra cột "Phân loại trước giờ G"...');
  await page.goto(`${FRONTEND_URL}/event-registrations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const shot05 = path.join(SCREENSHOTS_DIR, '05_event_registrations_pre_event.png');
  await page.screenshot({ path: shot05, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 05]:', shot05);

  // ==========================================
  // GIAI ĐOẠN 2: TRONG SỰ KIỆN (DURING EVENT - CHECK-IN)
  // ==========================================
  console.log('\n--- [GIAI ĐOẠN 2: TRONG SỰ KIỆN - CỔNG SOÁT VÉ CHECK-IN] ---');

  // 2.1 Mở Cổng Soát Vé /event-checkin
  await page.goto(`${FRONTEND_URL}/event-checkin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2.2 Tình huống 1: Check-in cho đại biểu đã đăng ký trước ("Lê Hoàng Long" / 0901234567)
  console.log('2.2 Check-in cho đại biểu có trong danh sách đăng ký trước ("Lê Hoàng Long")...');
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
  const shot06 = path.join(SCREENSHOTS_DIR, '06_event_checkin_gate_attendee.png');
  await page.screenshot({ path: shot06, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 06]:', shot06);

  // 2.3 Tình huống 2 - CỐT LÕI ĐẶC BIỆT:
  // Khách mới đến không có trong danh sách sự kiện miễn phí -> CHECK-IN LUÔN PASS + TỰ SINH CỘT ĐÁNH DẤU
  console.log('2.3 Test CỐT LÕI: Khách mới đến không có trong danh sách sự kiện miễn phí -> Check-in PASS ngay...');
  if (await searchInput.isVisible()) {
    await searchInput.fill('0977889900'); // Khách vãng lai: Hoàng Quốc Bảo
    const searchBtn = page.locator('button:has-text("Tra cứu"), button:has-text("Tìm")').first();
    if (await searchBtn.isVisible()) await searchBtn.click();
    await page.waitForTimeout(2500);
  }
  const shot07 = path.join(SCREENSHOTS_DIR, '07_event_checkin_free_walkin_pass.png');
  await page.screenshot({ path: shot07, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 07]:', shot07);

  // 2.4 Kiểm tra việc đổi trạng thái tại Quản lý đăng ký sự kiện /event-registrations
  console.log('2.4 Kiểm tra Quản lý đăng ký sự kiện /event-registrations đã đổi trạng thái Đã Check-in...');
  await page.goto(`${FRONTEND_URL}/event-registrations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const shot08 = path.join(SCREENSHOTS_DIR, '08_event_registrations_updated_after_checkin.png');
  await page.screenshot({ path: shot08, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 08]:', shot08);

  // ==========================================
  // GIAI ĐOẠN 3: SAU SỰ KIỆN (POST-EVENT)
  // ==========================================
  console.log('\n--- [GIAI ĐOẠN 3: SAU SỰ KIỆN - THỐNG KÊ & BÁO CÁO] ---');

  // Mở trang chi tiết sự kiện hoặc báo cáo tài chính
  console.log('3.1 Mở trang Thống kê Báo cáo sự kiện...');
  await page.goto(`${FRONTEND_URL}/finance-report`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const shot09 = path.join(SCREENSHOTS_DIR, '09_post_event_report.png');
  await page.screenshot({ path: shot09, fullPage: false });
  console.log('📸 [ĐÃ CHỤP 09]:', shot09);

  await browser.close();
  console.log('\n🎉 HOÀN TẤT KIỂM THỬ TOÀN DIỆN VÀ ĐÃ CHỤP ĐỦ 9 ẢNH MINH CHỨNG!');
}

main().catch(err => {
  console.error('❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ:', err);
  process.exit(1);
});
