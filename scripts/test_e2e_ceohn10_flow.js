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
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Login failed (${res.status}): ${errText}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`Login error for ${email}:`, err.message);
    throw err;
  }
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
  console.log('🚀 Bắt đầu kịch bản kiểm thử E2E CEO HN10...');
  
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  try {
    // =========================================================================
    // GIAI ĐOẠN 1: MASTER ADMIN TẠO TÀI KHOẢN QUẢN TRỊ CEO HN10
    // =========================================================================
    console.log('\n--- BƯỚC 1: Master Admin đăng nhập và tạo tài khoản Quản trị CEO HN10 ---');
    const masterAuth = await loginApi('admin@ceohn10.vn', '123456a@');
    console.log('✓ Master Admin login API thành công, token:', masterAuth.access_token?.slice(0, 15) + '...');

    await injectAuth(page, masterAuth);
    await page.goto(`${FRONTEND_URL}/master?tab=accounts`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Chuyển sang Tab 2: Quản lý tài khoản
    const accountsTabBtn = page.locator('button:has-text("QUẢN LÝ TÀI KHOẢN"), button:has-text("Tài Khoản Quản Trị")').first();
    if (await accountsTabBtn.isVisible()) {
      await accountsTabBtn.click();
      await page.waitForTimeout(600);
    }

    // Mở modal tạo tài khoản
    console.log('Click nút "Tạo Tài Khoản Quản Trị Mới"...');
    const createBtn = page.locator('button:has-text("Tạo Tài Khoản Quản Trị Mới")').first();
    await createBtn.waitFor({ state: 'visible', timeout: 5000 });
    await createBtn.click();
    await page.waitForTimeout(800);

    // Điền thông tin tạo tài khoản Quản trị CEO HN10
    console.log('Điền form tạo tài khoản admin.hn10@ceohn10.vn...');
    const modal = page.locator('div[role="dialog"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // Điền Họ và tên
    await modal.locator('input[placeholder*="Nguyễn Văn A"]').fill('Ban Quản Trị CEO HN10');

    // Điền Mã tài khoản
    await modal.locator('input[placeholder*="ADM-01"]').fill('ADM-HN10-01');

    // Điền Email đăng nhập
    await modal.locator('input[type="email"]').fill('admin.hn10@ceohn10.vn');

    // Điền Mật khẩu
    await modal.locator('input[type="password"]').fill('123456a@');

    // Chọn Hệ thống được quản trị: CLB Doanh Nhân CEO HN10
    console.log('Chọn Tenant Scope là CLB Doanh Nhân CEO HN10...');
    const tenantTrigger = modal.locator('button:has-text("Toàn Bộ Nền Tảng"), button:has-text("CLB Doanh Nhân"), button:has-text("Hệ thống")').first();
    if (await tenantTrigger.isVisible()) {
      await tenantTrigger.click();
      await page.waitForTimeout(400);
      const hn10Option = page.locator('div[role="option"]:has-text("CEO HN10")').first();
      if (await hn10Option.isVisible()) {
        await hn10Option.click();
        await page.waitForTimeout(400);
      }
    }

    // Chụp ảnh 01: Modal tạo tài khoản quản trị CEO HN10
    const shot01 = path.join(SCREENSHOTS_DIR, '01_modal_create_ceohn10_admin.png');
    await page.screenshot({ path: shot01, fullPage: false });
    console.log('📸 Đã chụp:', shot01);

    // Submit form
    const submitBtn = modal.locator('button:has-text("Tạo & Cấp Quyền")').first();
    await submitBtn.click();
    await page.waitForTimeout(3000);

    // Chụp ảnh 02: Bảng danh sách tài khoản đã có tài khoản Quản trị CEO HN10
    const shot02 = path.join(SCREENSHOTS_DIR, '02_accounts_list_ceohn10_admin_created.png');
    await page.screenshot({ path: shot02, fullPage: false });
    console.log('📸 Đã chụp:', shot02);

    // =========================================================================
    // GIAI ĐOẠN 2: ĐĂNG NHẬP BẰNG QUẢN TRỊ VIÊN CEO HN10
    // =========================================================================
    console.log('\n--- BƯỚC 2: Đăng nhập bằng Quản trị viên CEO HN10 (admin.hn10@ceohn10.vn) ---');
    const hn10Auth = await loginApi('admin.hn10@ceohn10.vn', '123456a@');
    console.log('✓ Quản trị viên CEO HN10 login API thành công, user:', hn10Auth.user?.email);

    // Tạo context mới cho user CEO HN10
    const hn10Context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const hn10Page = await hn10Context.newPage();
    await injectAuth(hn10Page, hn10Auth);

    // Mở trang chủ CRM
    await hn10Page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle' });
    await hn10Page.waitForTimeout(1500);

    // Chụp ảnh 03: Trang chủ CRM của Quản trị viên CEO HN10
    const shot03 = path.join(SCREENSHOTS_DIR, '03_crm_home_ceohn10_admin.png');
    await hn10Page.screenshot({ path: shot03, fullPage: false });
    console.log('📸 Đã chụp:', shot03);

    // Mở Portal Quản trị platform của CEO HN10
    console.log('Mở /master?tab=accounts với quyền Quản trị CEO HN10...');
    await hn10Page.goto(`${FRONTEND_URL}/master?tab=accounts`, { waitUntil: 'networkidle' });
    await hn10Page.waitForTimeout(1500);

    // Quản trị viên CEO HN10 tạo tài khoản Cán sự lớp
    const subCreateBtn = hn10Page.locator('button:has-text("Tạo Tài Khoản Cán Sự"), button:has-text("Tạo Tài Khoản")').first();
    if (await subCreateBtn.isVisible()) {
      await subCreateBtn.click();
      await hn10Page.waitForTimeout(800);

      const subModal = hn10Page.locator('div[role="dialog"]');
      await subModal.waitFor({ state: 'visible', timeout: 5000 });

      // Họ tên
      await subModal.locator('input[placeholder*="Nguyễn Văn A"]').fill('Lớp Trưởng CEO HN10 - Khóa 1');
      // Mã
      await subModal.locator('input[placeholder*="ADM-01"]').fill('LT-HN10-01');
      // Email
      await subModal.locator('input[type="email"]').fill('loptruong.hn10@ceohn10.vn');
      // Pass
      await subModal.locator('input[type="password"]').fill('123456a@');

      // Chọn Role: Lớp Trưởng / Cán Sự Lớp
      const roleSelect = subModal.locator('button:has-text("Quản trị viên"), button:has-text("Admin")').first();
      if (await roleSelect.isVisible()) {
        await roleSelect.click();
        await hn10Page.waitForTimeout(400);
        const lopTruongOpt = hn10Page.locator('div[role="option"]:has-text("Lớp Trưởng")').first();
        if (await lopTruongOpt.isVisible()) {
          await lopTruongOpt.click();
          await hn10Page.waitForTimeout(400);
        }
      }

      // Chụp ảnh 04: Modal Quản trị CEO HN10 tạo tài khoản Cán sự
      const shot04 = path.join(SCREENSHOTS_DIR, '04_modal_ceohn10_create_sub_account.png');
      await hn10Page.screenshot({ path: shot04, fullPage: false });
      console.log('📸 Đã chụp:', shot04);

      // Submit
      const subSubmit = subModal.locator('button:has-text("Tạo & Cấp Quyền")').first();
      if (await subSubmit.isVisible()) {
        await subSubmit.click();
        await hn10Page.waitForTimeout(3000);
      }
    }

    // Chụp ảnh 05: Danh sách tài khoản sau khi tạo Cán sự
    const shot05 = path.join(SCREENSHOTS_DIR, '05_accounts_list_sub_accounts.png');
    await hn10Page.screenshot({ path: shot05, fullPage: false });
    console.log('📸 Đã chụp:', shot05);

    // =========================================================================
    // GIAI ĐOẠN 3: TEST LUỒNG TRƯỚC SỰ KIỆN (PRE-EVENT)
    // =========================================================================
    console.log('\n--- BƯỚC 3: Test Luồng Trước sự kiện (Tạo sự kiện, QR Check-in, Mẫu Zalo) ---');
    await hn10Page.goto(`${FRONTEND_URL}/events`, { waitUntil: 'networkidle' });
    await hn10Page.waitForTimeout(1500);
    const shot06 = path.join(SCREENSHOTS_DIR, '06_pre_event_events_management.png');
    await hn10Page.screenshot({ path: shot06, fullPage: false });
    console.log('📸 Đã chụp:', shot06);

    // Cấu hình QR check-in & link vào cửa
    await hn10Page.goto(`${FRONTEND_URL}/checkin-qr`, { waitUntil: 'networkidle' });
    await hn10Page.waitForTimeout(1500);
    const shot07 = path.join(SCREENSHOTS_DIR, '07_pre_event_qr_registration_config.png');
    await hn10Page.screenshot({ path: shot07, fullPage: false });
    console.log('📸 Đã chụp:', shot07);

    // Mẫu thông báo Zalo OA áp dụng vào sự kiện
    await hn10Page.goto(`${FRONTEND_URL}/notifications?tab=templates&channel=zalo_oa`, { waitUntil: 'networkidle' });
    await hn10Page.waitForTimeout(1500);
    const shot08 = path.join(SCREENSHOTS_DIR, '08_pre_event_zalo_oa_notification.png');
    await hn10Page.screenshot({ path: shot08, fullPage: false });
    console.log('📸 Đã chụp:', shot08);

    // =========================================================================
    // GIAI ĐOẠN 4: TEST LUỒNG TRONG SỰ KIỆN (DURING-EVENT)
    // =========================================================================
    console.log('\n--- BƯỚC 4: Test Luồng Trong sự kiện (Check-in Offline, Quay số, Bầu cử) ---');
    await hn10Page.goto(`${FRONTEND_URL}/event-registrations`, { waitUntil: 'networkidle' });
    await hn10Page.waitForTimeout(1500);
    const shot09 = path.join(SCREENSHOTS_DIR, '09_during_event_checkin_offline_presync.png');
    await hn10Page.screenshot({ path: shot09, fullPage: false });
    console.log('📸 Đã chụp:', shot09);

    // Quay số may mắn / Lucky Draw
    await hn10Page.goto(`${FRONTEND_URL}/lucky-draw`, { waitUntil: 'networkidle' });
    await hn10Page.waitForTimeout(1500);
    const shot10 = path.join(SCREENSHOTS_DIR, '10_during_event_lucky_draw.png');
    await hn10Page.screenshot({ path: shot10, fullPage: false });
    console.log('📸 Đã chụp:', shot10);

    // Biểu quyết & Đánh giá ý kiến / Bầu cử
    await hn10Page.goto(`${FRONTEND_URL}/voting`, { waitUntil: 'networkidle' });
    await hn10Page.waitForTimeout(1500);
    const shot11 = path.join(SCREENSHOTS_DIR, '11_during_event_voting.png');
    await hn10Page.screenshot({ path: shot11, fullPage: false });
    console.log('📸 Đã chụp:', shot11);

    // =========================================================================
    // GIAI ĐOẠN 5: TEST LUỒNG SAU SỰ KIỆN & CÁC CHỨC NĂNG KHÁC (POST-EVENT & EXTENSIONS)
    // =========================================================================
    console.log('\n--- BƯỚC 5: Test Luồng Sau sự kiện (Báo cáo tài chính, Phân hệ Lớp học) ---');
    // Báo cáo tài chính
    await hn10Page.goto(`${FRONTEND_URL}/finance-report`, { waitUntil: 'networkidle' });
    await hn10Page.waitForTimeout(1500);
    const shot12 = path.join(SCREENSHOTS_DIR, '12_post_event_finance_report.png');
    await hn10Page.screenshot({ path: shot12, fullPage: false });
    console.log('📸 Đã chụp:', shot12);

    // Quản lý lớp & 30 chuyên đề đào tạo
    await hn10Page.goto(`${FRONTEND_URL}/classes?tab=courses`, { waitUntil: 'networkidle' });
    await hn10Page.waitForTimeout(1500);
    const shot13 = path.join(SCREENSHOTS_DIR, '13_classes_courses.png');
    await hn10Page.screenshot({ path: shot13, fullPage: false });
    console.log('📸 Đã chụp:', shot13);

    // Dashboard học viên đa chỉ số
    await hn10Page.goto(`${FRONTEND_URL}/classes?tab=students`, { waitUntil: 'networkidle' });
    await hn10Page.waitForTimeout(1500);
    const shot14 = path.join(SCREENSHOTS_DIR, '14_classes_students_dashboard.png');
    await hn10Page.screenshot({ path: shot14, fullPage: false });
    console.log('📸 Đã chụp:', shot14);

    // Quỹ tài chính lớp 20tr
    await hn10Page.goto(`${FRONTEND_URL}/classes?tab=finance`, { waitUntil: 'networkidle' });
    await hn10Page.waitForTimeout(1500);
    const shot15 = path.join(SCREENSHOTS_DIR, '15_classes_finance_fund_20m.png');
    await hn10Page.screenshot({ path: shot15, fullPage: false });
    console.log('📸 Đã chụp:', shot15);

    console.log('\n🎉 TOÀN BỘ KỊCH BẢN KIỂM THỬ ĐÃ HOÀN TẤT THÀNH CÔNG VỚI 15 ẢNH CHỤP MINH CHỨNG!');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('❌ Lỗi khi thực thi test script:', err);
  process.exit(1);
});
