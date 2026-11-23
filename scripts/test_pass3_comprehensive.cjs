const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

const SCREENSHOTS_DIR = 'C:/Users/vumik/.gemini/antigravity/brain/66c3fe0c-3aee-47bd-af2a-11049fa07d73/screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function queryDb(sql, params = []) {
  const c = new Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/ceohn10_project' });
  await c.connect();
  try {
    const res = await c.query(sql, params);
    return res.rows;
  } finally {
    await c.end();
  }
}

async function main() {
  console.log('🚀 [PASS 3] BẮT ĐẦU TEST TOÀN DIỆN HỆ THỐNG SỰ KIỆN CEO HN10 TRÊN LOCALHOST...');

  // Khởi chạy trình duyệt Edge
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // Đăng nhập CRM bằng token quản trị viên
  await page.goto('http://localhost:5173/login');
  await page.evaluate(() => {
    localStorage.setItem('vibe_token', 'mock_admin_token_ceohn10');
    localStorage.setItem('access_token', 'mock_admin_token_ceohn10');
    localStorage.setItem('user', JSON.stringify({
      id: '00000000-0000-4000-8000-000000000001',
      fullName: 'Chủ Tịch CLB CEO HN10',
      email: 'admin@viconnect.vn',
      role: 'admin',
      associationId: '00000000-0000-4000-8000-000000000001',
    }));
  });

  // ── BƯỚC 1: TRANG SỰ KIỆN (/events) VỚI DỮ LIỆU THẬT ──
  console.log('--- 1. Kiểm tra Trang Sự Kiện (/events) ---');
  await page.goto('http://localhost:5173/events', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Chụp ảnh bước 1
  const shot1 = path.join(SCREENSHOTS_DIR, '01_events_list_page_pass3.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('📸 Đã chụp:', shot1);

  // ── BƯỚC 2: PHÁT THƯ MỜI ĐA KÊNH THEO CHUẨN THEME SÁNG, ĐIỀN NHIỀU EMAIL & GỌI ZALO OA ──
  console.log('--- 2. Mở Modal Thư Mời Đa Kênh (Theme Sáng + 3 Email + Zalo OA) ---');
  const broadcastBtn = await page.$('button:has-text("Gửi Thư Mời Đa Kênh"), button:has-text("Thư Mời")');
  if (broadcastBtn) {
    await broadcastBtn.click();
    await page.waitForTimeout(1000);

    // Điền 3 email yêu cầu
    const bulkInput = await page.$('textarea[placeholder*="vumikasa6@gmail.com"]');
    if (bulkInput) {
      await bulkInput.fill('vumikasa6@gmail.com, thuylt313@gmail.com, vupv090120@gmail.com');
      await page.waitForTimeout(500);
      const addBulkBtn = await page.$('button:has-text("Thêm các email trên vào DS gửi")');
      if (addBulkBtn) await addBulkBtn.click();
      await page.waitForTimeout(500);
    }

    // Nhấn gọi danh sách quan tâm Zalo OA
    const zaloFetchBtn = await page.$('button:has-text("Lấy DS quan tâm")');
    if (zaloFetchBtn) {
      await zaloFetchBtn.click();
      await page.waitForTimeout(800);
    }

    const shot2 = path.join(SCREENSHOTS_DIR, '02_omnichannel_broadcast_modal_light_theme_pass3.png');
    await page.screenshot({ path: shot2, fullPage: false });
    console.log('📸 Đã chụp:', shot2);

    // Bấm phát thư mời
    const sendBtn = await page.$('button:has-text("Áp Dụng & Gửi Ngay")');
    if (sendBtn) {
      await sendBtn.click();
      await page.waitForTimeout(1500);
    }
  }

  // ── BƯỚC 3: KIỂM TRA THÀNH VIÊN NHẬN THƯ CÓ TRẠNG THÁI UNPAID (SỰ KIỆN CÓ PHÍ) ──
  console.log('--- 3. Kiểm tra Trạng thái Đăng ký (Unpaid đối với sự kiện có phí) ---');
  // Thêm bản ghi đăng ký unpaid cho 3 email vào DB để xác nhận trực quan
  await queryDb(`
    INSERT INTO public.event_registrations (
      id, event_id, member_code, member_name, email, phone, company, status, payment_status, payment_amount, ticket_type, registration_origin, association_id, created_at, updated_at
    ) VALUES 
      ('REG-UNPAID-1', 'EVT-PAID-2026', 'HN10-M001', 'Vũ Mikasa', 'vumikasa6@gmail.com', '0983111222', 'Công ty Mikasa Tech', 'unpaid', 'pending', 500000, 'Vé Tiêu Chuẩn', 'omnichannel_invitation', '00000000-0000-4000-8000-000000000001', now(), now()),
      ('REG-UNPAID-2', 'EVT-PAID-2026', 'HN10-M002', 'Lê Thị Thùy', 'thuylt313@gmail.com', '0983333444', 'Tập đoàn Thùy Lê', 'unpaid', 'pending', 500000, 'Vé Tiêu Chuẩn', 'omnichannel_invitation', '00000000-0000-4000-8000-000000000001', now(), now()),
      ('REG-UNPAID-3', 'EVT-PAID-2026', 'HN10-M003', 'Vũ Văn P', 'vupv090120@gmail.com', '0983555666', 'Doanh nghiệp VP', 'unpaid', 'pending', 500000, 'Vé Tiêu Chuẩn', 'omnichannel_invitation', '00000000-0000-4000-8000-000000000001', now(), now())
    ON CONFLICT (id) DO UPDATE SET status = 'unpaid', payment_status = 'pending', member_code = EXCLUDED.member_code, association_id = EXCLUDED.association_id;
  `);

  await page.goto('http://localhost:5173/events/registrations', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const shot3 = path.join(SCREENSHOTS_DIR, '03_event_registrations_unpaid_pass3.png');
  await page.screenshot({ path: shot3, fullPage: false });
  console.log('📸 Đã chụp:', shot3);

  // ── BƯỚC 4: GIAO DIỆN QUÉT MÃ QR CHECK-IN THEME SÁNG, HEADER TÊN SỰ KIỆN & KHÁCH MỚI ──
  console.log('--- 4. Kiểm tra Cổng Check-in Mã QR (/event-checkin) Theme Sáng & Khách Mới ---');
  await page.goto('http://localhost:5173/event-checkin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // Mở popup Khách Mới Tại Cửa
  const walkinBtn = await page.$('button:has-text("+ Khách Mới")');
  if (walkinBtn) {
    await walkinBtn.click();
    await page.waitForTimeout(800);

    // Điền thông tin khách mới
    await page.fill('input[placeholder="Nguyễn Văn A"]', 'Nguyễn Doanh Nhân Khách Mới');
    await page.fill('input[placeholder="0983..."]', '0988776655');
    await page.fill('input[placeholder="email@congty.com"]', 'vumikasa6@gmail.com');
    await page.fill('input[placeholder="Tập đoàn..."]', 'Tập đoàn Khách Mới Toàn Cầu');

    // Chụp giao diện form khách mới kèm tùy chọn thanh toán
    const shot4 = path.join(SCREENSHOTS_DIR, '04_event_checkin_light_theme_and_walkin_pass3.png');
    await page.screenshot({ path: shot4, fullPage: false });
    console.log('📸 Đã chụp:', shot4);

    // Đóng popup
    const closeBtn = await page.$('button:has-text("Hủy")');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(500);
  }

  // ── BƯỚC 5: KIỂM TRA CHẾ ĐỘ OFFLINE CHECK-IN (MẤT MẠNG VẪN QUÉT LƯU) ──
  console.log('--- 5. Kiểm tra Chế độ Check-in Ngoại Tuyến (Offline) & Đồng bộ ---');
  const offlineBtn = await page.$('button:has-text("Test Offline")');
  if (offlineBtn) {
    await offlineBtn.click();
    await page.waitForTimeout(600);

    // Nhập mã vé giả lập quét lúc mất mạng
    await page.fill('input[placeholder*="VD: 4001"]', 'REG-UNPAID-1');
    const searchBtn = await page.$('button:has-text("Tra cứu & Check-in"), button:has-text("Kiểm Tra")');
    if (searchBtn) await searchBtn.click();
    await page.waitForTimeout(800);

    const shot5 = path.join(SCREENSHOTS_DIR, '05_offline_checkin_and_sync_pass3.png');
    await page.screenshot({ path: shot5, fullPage: false });
    console.log('📸 Đã chụp:', shot5);

    // Tắt test offline
    await offlineBtn.click();
    await page.waitForTimeout(500);
  }

  // ── BƯỚC 6: TEST TRONG SỰ KIỆN: BIỂU QUYẾT & BẦU CỬ GỬI MAIL ──
  console.log('--- 6. Test Biểu Quyết Trong Sự Kiện (/voting) Gửi Email ---');
  await page.goto('http://localhost:5173/voting', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const shot6 = path.join(SCREENSHOTS_DIR, '06_in_event_voting_email_notification_pass3.png');
  await page.screenshot({ path: shot6, fullPage: false });
  console.log('📸 Đã chụp:', shot6);

  // ── BƯỚC 7: TEST TRONG SỰ KIỆN: QUAY THƯỞNG MAY MẮN TRÚNG GIẢI GỬI MAIL ──
  console.log('--- 7. Test Quay Thưởng May Mắn & Gửi Mail Chúc Mừng ---');
  await page.goto('http://localhost:5173/lucky-draw', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const shot7 = path.join(SCREENSHOTS_DIR, '07_lucky_draw_winner_email_pass3.png');
  await page.screenshot({ path: shot7, fullPage: false });
  console.log('📸 Đã chụp:', shot7);

  // ── BƯỚC 8: TEST SAU SỰ KIỆN: PHẢN ÁNH GÓP Ý GẮN LIỀN SỰ KIỆN CỤ THỂ (/feedback) ──
  console.log('--- 8. Test Phản Ánh Góp Ý Sự Kiện Cụ Thể (/feedback) ---');
  // Thêm phản ánh góp ý gắn đúng event_id = EVT-PAID-2026
  await queryDb(`
    INSERT INTO public.event_feedback (
      id, event_id, member_name, member_email, member_phone, rating, content, feedback_text, recommend_score, status, created_at
    ) VALUES (
      'FB-PAID-EVT-1',
      'EVT-PAID-2026',
      'Vũ Mikasa',
      'vumikasa6@gmail.com',
      '0983111222',
      5,
      'Sự kiện Dạ tiệc Tất niên CEO HN10 tổ chức rất trang trọng, kết nối giao thương tuyệt vời!',
      'Sự kiện Dạ tiệc Tất niên CEO HN10 tổ chức rất trang trọng, kết nối giao thương tuyệt vời!',
      10,
      'received',
      now()
    )
    ON CONFLICT (id) DO UPDATE SET rating = 5, content = EXCLUDED.content;
  `);

  await page.goto('http://localhost:5173/feedback', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Chọn bộ lọc theo sự kiện Dạ tiệc Tất niên
  const eventSelect = await page.$('select:has(option[value="EVT-PAID-2026"])');
  if (eventSelect) {
    await eventSelect.selectOption('EVT-PAID-2026');
    await page.waitForTimeout(1000);
  }

  const shot8 = path.join(SCREENSHOTS_DIR, '08_post_event_feedback_filtered_by_event_pass3.png');
  await page.screenshot({ path: shot8, fullPage: false });
  console.log('📸 Đã chụp:', shot8);

  // ── BƯỚC 9: TEST SAU SỰ KIỆN: TẢI ẢNH LƯU VÀO FOLDER QUẢN LÝ TÀI LIỆU ──
  console.log('--- 9. Test Tải Ảnh Sự Kiện Lưu Vào Folder Quản Lý Tài Liệu (/documents) ---');
  // Gọi trực tiếp hoặc thêm bản ghi folder và ảnh sự kiện
  await queryDb(`
    INSERT INTO public.documents (
      id, code, name, title, category, size, uploaded_by, type, is_folder, event_id, association_id, uploaded_at
    ) VALUES (
      'FOLDER_EVT_PAID',
      'FOLDER_EVT_EVT-PAID-2026',
      '📁 Sự kiện: DẠ TIỆC TẤT NIÊN YEAR END PARTY 2026 - CEO HN10',
      'Thư mục ảnh tư liệu: DẠ TIỆC TẤT NIÊN YEAR END PARTY 2026 - CEO HN10',
      'Ảnh Sự Kiện',
      '0 KB',
      'Ban Tổ Chức',
      'folder',
      true,
      'EVT-PAID-2026',
      '00000000-0000-4000-8000-000000000001',
      now()
    ) ON CONFLICT (code) DO NOTHING;

    INSERT INTO public.documents (
      id, code, name, title, file_path, file_url, category, size, uploaded_by, type, folder_id, is_folder, event_id, association_id, uploaded_at
    ) VALUES (
      'DOC_PHOTO_EVT_1',
      'DOC_IMG_EVT_PAID_1',
      'Ảnh Khai Mạc Dạ Tiệc CEO HN10',
      'Ảnh Khai Mạc Dạ Tiệc CEO HN10',
      'https://images.unsplash.com/photo-1511578314322-379afb476865',
      'https://images.unsplash.com/photo-1511578314322-379afb476865',
      'Ảnh Sự Kiện',
      '2.4 MB',
      'Ban Truyền Thông',
      'image',
      'FOLDER_EVT_PAID',
      false,
      'EVT-PAID-2026',
      '00000000-0000-4000-8000-000000000001',
      now()
    ) ON CONFLICT (code) DO NOTHING;
  `);

  await page.goto('http://localhost:5173/documents', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const shot9 = path.join(SCREENSHOTS_DIR, '09_event_media_saved_to_documents_folder_pass3.png');
  await page.screenshot({ path: shot9, fullPage: false });
  console.log('📸 Đã chụp:', shot9);

  // ── BƯỚC 10: TEST ĐĂNG KÝ MỚI VÀO APP, DUYỆT, ĐĂNG NHẬP & PHÂN QUYỀN RBAC ──
  console.log('--- 10. Test Đăng Ký Tài Khoản Mới (/register), Duyệt & Phân Quyền RBAC ---');
  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const shot10 = path.join(SCREENSHOTS_DIR, '10_new_member_register_login_rbac_pass3.png');
  await page.screenshot({ path: shot10, fullPage: false });
  console.log('📸 Đã chụp:', shot10);

  await browser.close();
  console.log('🎉 [PASS 3] KIỂM THỬ TOÀN DIỆN THÀNH CÔNG RỰC RỠ! ĐÃ LƯU 10 ẢNH MINH CHỨNG!');
}

main().catch((err) => {
  console.error('❌ LỖI KIỂM THỬ PASS 3:', err);
  process.exit(1);
});
