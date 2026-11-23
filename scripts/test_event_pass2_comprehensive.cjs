const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SCREENSHOTS_DIR = "C:\\Users\\vumik\\.gemini\\antigravity\\brain\\66c3fe0c-3aee-47bd-af2a-11049fa07d73\\screenshots";
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const EXCEL_FILE = path.resolve(__dirname, "../test-data/events/danh_sach_dai_bieu_pass2.xlsx");

async function main() {
  console.log("🚀 BẮT ĐẦU TEST TOÀN DIỆN LUỒNG SỰ KIỆN PASS 2 (PLAYWRIGHT UI LOCALHOST:5173)...");

  // 1. Lấy token đăng nhập từ Backend NestJS
  console.log("1. Xác thực tài khoản Administrator...");
  const loginRes = await fetch("http://127.0.0.1:4003/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@connect.vn",
      username: "admin@connect.vn",
      password: "123456",
    }),
  });

  const authData = await loginRes.json();
  if (!authData.access_token) {
    throw new Error("Không thể đăng nhập Backend: " + JSON.stringify(authData));
  }
  const token = authData.access_token;
  const user = authData.user;
  console.log("✅ Đăng nhập thành công! User:", user.email, "Role:", user.role);

  // 2. Khởi chạy trình duyệt Playwright Edge
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  // Inject session vào localStorage của trình duyệt
  await context.addInitScript(({ token, user }) => {
    localStorage.setItem("vibe_token", token);
    localStorage.setItem("token", token);
    localStorage.setItem("access_token", token);
    localStorage.setItem("vibe_user", JSON.stringify(user));
    localStorage.setItem("vba_current_role", "admin");
    localStorage.setItem("vba_user_role", "admin");
    localStorage.setItem("vba_is_admin", "true");
    localStorage.setItem(
      "ceohn10_custom_profile",
      JSON.stringify({ role: "admin", isPlatformAdmin: true, isAdmin: true, isPresident: true })
    );
    localStorage.setItem("vba_active_assoc_name", "CLB Doanh Nhân CEO HN10 (HanoiBA)");
    localStorage.setItem("crm_system_name", "CLB Doanh Nhân CEO HN10 (HanoiBA)");
    localStorage.setItem("vba_active_tenant", "ceohn10");
  }, { token, user });

  const page = await context.newPage();

  try {
    // -------------------------------------------------------------------------
    // BƯỚC 1: TRUY CẬP TRANG SỰ KIỆN LOCALHOST:5173/events
    // -------------------------------------------------------------------------
    console.log("2. Truy cập http://localhost:5173/events...");
    await page.goto("http://localhost:5173/events", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Kiểm tra Sidebar: phải có "Phản hồi & Góp ý", KHÔNG có "Hệ Thống Quản Trị:"
    const feedbackLink = await page.$("a[href='/feedback']");
    console.log(" - Mục 'Phản hồi & Góp ý' trên Sidebar:", feedbackLink ? "✅ CÓ MẶT" : "❌ THIẾU");

    const tenantDropdown = await page.$("text='Hệ Thống Quản Trị:'");
    console.log(" - Khối dropdown 'Hệ Thống Quản Trị:':", tenantDropdown ? "❌ VẪN CÒN" : "✅ ĐÃ XÓA SẠCH");

    // Chụp ảnh màn hình bước 1
    const s1Path = path.join(SCREENSHOTS_DIR, "01_localhost_events_with_real_data_pass2.png");
    await page.screenshot({ path: s1Path, fullPage: false });
    console.log("📸 Đã lưu:", s1Path);

    // -------------------------------------------------------------------------
    // BƯỚC 2: MỞ POPUP TẠO SỰ KIỆN (KIỂM TRA 5 MẪU + BỎ GÓI TÀI TRỢ)
    // -------------------------------------------------------------------------
    console.log("3. Mở popup '+ Tạo sự kiện'...");
    const createBtn = await page.locator("button:has-text('+ Tạo sự kiện'), button:has-text('Tạo sự kiện')").first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(1500);

      const s2Path = path.join(SCREENSHOTS_DIR, "02_create_event_popup_with_sponsor_selector_pass2.png");
      await page.screenshot({ path: s2Path, fullPage: false });
      console.log("📸 Đã lưu:", s2Path);

      // Đóng modal tạo sự kiện
      const closeBtn = await page.locator("button:has-text('Hủy'), button:has-text('Đóng')").first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(800);
      }
    }

    // -------------------------------------------------------------------------
    // BƯỚC 3: ĐĂNG KÝ SỰ KIỆN CÓ PHÍ (VIETQR) & SỰ KIỆN MIỄN PHÍ
    // -------------------------------------------------------------------------
    console.log("4. Kiểm tra trang Đăng ký Khách mời Có phí: /guest-event-register/EVT-PAID-2026...");
    await page.goto("http://localhost:5173/guest-event-register/EVT-PAID-2026", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(2000);

    const s3Path = path.join(SCREENSHOTS_DIR, "03_guest_register_paid_vietqr_pass2.png");
    await page.screenshot({ path: s3Path, fullPage: false });
    console.log("📸 Đã lưu:", s3Path);

    console.log("5. Kiểm tra trang Đăng ký Khách mời Miễn phí: /guest-event-register/EVT-FREE-2026...");
    await page.goto("http://localhost:5173/guest-event-register/EVT-FREE-2026", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(2000);

    const s4Path = path.join(SCREENSHOTS_DIR, "04_guest_register_free_pass2.png");
    await page.screenshot({ path: s4Path, fullPage: false });
    console.log("📸 Đã lưu:", s4Path);

    // -------------------------------------------------------------------------
    // BƯỚC 4: QUẢN LÝ ĐĂNG KÝ SỰ KIỆN & SƠ ĐỒ GHẾ
    // -------------------------------------------------------------------------
    console.log("6. Mở trang Quản lý Đăng Ký Sự Kiện /event-registrations...");
    await page.goto("http://localhost:5173/event-registrations", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(2500);

    const s5Path = path.join(SCREENSHOTS_DIR, "05_event_registrations_seating_and_origin_pass2.png");
    await page.screenshot({ path: s5Path, fullPage: false });
    console.log("📸 Đã lưu:", s5Path);

    // -------------------------------------------------------------------------
    // BƯỚC 5: IMPORT FILE EXCEL PASS 2 VỚI 2 EMAIL YÊU CẦU
    // (vumikasa6@gmail.com - paid & vupv090120@gmail.com - unpaid)
    // -------------------------------------------------------------------------
    console.log("7. Mở modal Import Danh Sách Đại Biểu...");
    const importBtn = await page.locator("button:has-text('Nhập Danh Sách'), button:has-text('Import')").first();
    if (await importBtn.isVisible()) {
      await importBtn.click();
      await page.waitForTimeout(1500);

      console.log(" - Upload file Excel:", EXCEL_FILE);
      const fileInput = await page.locator("input[type='file']").first();
      await fileInput.setInputFiles(EXCEL_FILE);
      await page.waitForTimeout(2500);

      // Chụp ảnh Modal Import hiển thị rõ 2 email
      const s6Path = path.join(SCREENSHOTS_DIR, "06_import_excel_pass2_with_emails.png");
      await page.screenshot({ path: s6Path, fullPage: false });
      console.log("📸 Đã lưu:", s6Path);

      // Bấm nút Lưu Vào CSDL & Bắn Vé
      const submitImportBtn = await page.locator("button:has-text('Lưu Vào CSDL'), button:has-text('Bắn Vé')").first();
      if (await submitImportBtn.isVisible()) {
        console.log(" - Xác nhận Import & Dispatch vé/hướng dẫn thanh toán...");
        await submitImportBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // -------------------------------------------------------------------------
    // BƯỚC 6: CỔNG CHECK-IN & SOÁT VÉ (/event-checkin)
    // - Checkin đại biểu hợp lệ vumikasa6@gmail.com (SĐT 0988112233)
    // - Checkin khách vãng lai sự kiện miễn phí (SĐT 0911223344) -> LUÔN PASS
    // -------------------------------------------------------------------------
    console.log("8. Mở Cổng Soát Vé /event-checkin...");
    await page.goto("http://localhost:5173/event-checkin", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(2000);

    // 8a. Check-in đại biểu đã đăng ký (0988112233)
    console.log(" - Tra cứu và Check-in đại biểu Phạm Văn Vũ (0988112233)...");
    const ticketInput = await page.locator("input[placeholder*='Mã vé'], input[placeholder*='Số điện thoại'], input[type='text']").first();
    await ticketInput.fill("0988112233");
    await page.locator("button:has-text('Tra cứu'), button:has-text('Tìm')").first().click();
    await page.waitForTimeout(1500);

    // Xác nhận Check-in
    const confirmCheckinBtn = await page.locator("button:has-text('Xác Nhận Check-in'), button:has-text('Check-in Ngay')").first();
    if (await confirmCheckinBtn.isVisible()) {
      await confirmCheckinBtn.click();
      await page.waitForTimeout(1500);
    }

    const s7Path = path.join(SCREENSHOTS_DIR, "07_checkin_registered_vip_success_pass2.png");
    await page.screenshot({ path: s7Path, fullPage: false });
    console.log("📸 Đã lưu:", s7Path);

    // 8b. Check-in khách chưa đăng ký sự kiện miễn phí (WALKIN-9999) -> LUÔN PASS
    console.log(" - Thử nghiệm khách mới không nằm trong danh sách đăng ký trước giờ G (WALKIN-9999)...");
    await ticketInput.fill("WALKIN-9999");
    await page.locator("button:has-text('Tra cứu'), button:has-text('Tìm')").first().click();
    await page.waitForTimeout(2000);

    const s8Path = path.join(SCREENSHOTS_DIR, "08_checkin_free_walkin_unannounced_pass_pass2.png");
    await page.screenshot({ path: s8Path, fullPage: false });
    console.log("📸 Đã lưu:", s8Path);

    // -------------------------------------------------------------------------
    // BƯỚC 7: KIỂM TRA TRẠNG THÁI ĐỔI TRONG /event-registrations
    // -------------------------------------------------------------------------
    console.log("9. Quay lại /event-registrations để xác nhận trạng thái Đã Check-in...");
    await page.goto("http://localhost:5173/event-registrations", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(2500);

    const s9Path = path.join(SCREENSHOTS_DIR, "09_event_registrations_updated_after_checkin_pass2.png");
    await page.screenshot({ path: s9Path, fullPage: false });
    console.log("📸 Đã lưu:", s9Path);

    // -------------------------------------------------------------------------
    // BƯỚC 8: VÒNG QUAY MAY MẮN (LUCKY DRAW) & BIỂU QUYẾT (VOTING)
    // -------------------------------------------------------------------------
    console.log("10. Truy cập Quản lý Quay thưởng /lucky-draw...");
    await page.goto("http://localhost:5173/lucky-draw", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(2000);

    const s10Path = path.join(SCREENSHOTS_DIR, "10_in_event_lucky_draw_pass2.png");
    await page.screenshot({ path: s10Path, fullPage: false });
    console.log("📸 Đã lưu:", s10Path);

    console.log("11. Truy cập Biểu Quyết & Bầu Cử /voting...");
    await page.goto("http://localhost:5173/voting", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(2000);

    const s11Path = path.join(SCREENSHOTS_DIR, "11_in_event_voting_pass2.png");
    await page.screenshot({ path: s11Path, fullPage: false });
    console.log("📸 Đã lưu:", s11Path);

    // -------------------------------------------------------------------------
    // BƯỚC 9: SAU SỰ KIỆN - PHẢN HỒI GÓP Ý & BÁO CÁO TÀI CHÍNH
    // -------------------------------------------------------------------------
    console.log("12. Truy cập Phản hồi & Góp ý /feedback...");
    await page.goto("http://localhost:5173/feedback", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(2000);

    const s12Path = path.join(SCREENSHOTS_DIR, "12_post_event_feedback_page_pass2.png");
    await page.screenshot({ path: s12Path, fullPage: false });
    console.log("📸 Đã lưu:", s12Path);

    console.log("13. Truy cập Báo cáo tài chính /finance-report...");
    await page.goto("http://localhost:5173/finance-report", { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(2000);

    const s13Path = path.join(SCREENSHOTS_DIR, "13_post_event_financial_report_pass2.png");
    await page.screenshot({ path: s13Path, fullPage: false });
    console.log("📸 Đã lưu:", s13Path);

    console.log("\n🎉 HOÀN TẤT TOÀN BỘ 13 BƯỚC TEST TỰ ĐỘNG HÓA TRÊN GIAO DIỆN LOCALHOST!");
  } catch (err) {
    console.error("❌ Lỗi trong quá trình test:", err.message);
  } finally {
    await browser.close();
  }
}

main();
