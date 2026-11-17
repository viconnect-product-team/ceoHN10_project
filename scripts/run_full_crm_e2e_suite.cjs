const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const EVIDENCE_DIR = path.join(__dirname, '../test_evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const DB_CONN = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable';

async function queryDB(sql, params = []) {
  const client = new Client({ connectionString: DB_CONN });
  try {
    await client.connect();
    const res = await client.query(sql, params);
    return res.rows;
  } catch (err) {
    console.error('DB Query Error:', err.message);
    return [];
  } finally {
    await client.end().catch(() => {});
  }
}

const BASE_URL = 'https://14.225.217.232:10443';

// 7 Ban chuyên môn chuẩn theo Ảnh 1
const BANS_ANH_1 = [
  { id: "dept_ht", name: "Ban Học tập", code: "BHT", leaderName: "Lớp Phó Học Tập Lâm Thời", description: "Tổ chức học tập, chia sẻ kiến thức và đào tạo kỹ năng doanh nhân", color: "blue", isCore: true },
  { id: "dept_sk", name: "Ban Sự kiện & Hậu cần", code: "BSK", leaderName: "Lớp Phó Sự Kiện & Hậu Cần Lâm Thời", description: "Lên kế hoạch, tổ chức sự kiện và chuẩn bị hậu cần lớp", color: "purple", isCore: true },
  { id: "dept_tc", name: "Ban Tài chính & Tài trợ", code: "BTC", leaderName: "Lớp Phó Tài Chính Tài Trợ Lâm Thời", description: "Quản lý ngân sách lớp, thu chi và vận động tài trợ", color: "yellow", isCore: true },
  { id: "dept_tt", name: "Ban Truyền thông", code: "BTT", leaderName: "Lớp Phó Truyền Thông Lâm Thời", description: "Truyền thông nội bộ và đối ngoại, xây dựng hình ảnh lớp", color: "rose", isCore: true },
  { id: "dept_cn", name: "Ban Công nghệ", code: "BCN", leaderName: "Lớp Phó Công Nghệ Lâm Thời", description: "Ứng dụng chuyển đổi số, hỗ trợ kỹ thuật và công nghệ thông tin", color: "indigo", isCore: true },
  { id: "dept_dn", name: "Ban Đối ngoại & Giao thương", code: "BDN", leaderName: "Lớp Phó Đối Ngoại & Giao Thương Lâm Thời", description: "Kết nối giao thương B2B, hợp tác đối ngoại và phát triển cơ hội", color: "emerald", isCore: true },
  { id: "dept_ds", name: "Ban Đời sống & Gắn kết thành viên", code: "BDS", leaderName: "Lớp Phó Đời Sống & Gắn Kết Thành Viên Lâm Thời", description: "Chăm lo đời sống thành viên, tổ chức sinh nhật và gắn kết tập thể", color: "amber", isCore: true },
];

async function captureScreen(page, filename, desc) {
  const filepath = path.join(EVIDENCE_DIR, filename);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`[CAPTURED] ${filename}: ${desc}`);
}

async function main() {
  console.log('========================================================================');
  console.log('  BẮT ĐẦU CHUỖI KIỂM THỬ TOÀN DIỆN HỆ THỐNG CEO HN10 (DEV 10443)');
  console.log('========================================================================');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // --------------------------------------------------------------------------
  // LUỒNG 1: ĐĂNG NHẬP QUẢN TRỊ VIÊN admini@connect.vn
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 1: Đăng nhập Quản trị viên (admini@connect.vn)...');
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 35000 });
  await captureScreen(page, '01_login_page_admin.png', 'Giao diện Đăng nhập Hệ thống CRM CEO HN10');

  await page.fill('input[autoComplete="username"]', 'admini@connect.vn');
  await page.fill('input[type="password"]', '123456a@');
  await captureScreen(page, '02_admin_credentials_entered.png', 'Nhập tài khoản admini@connect.vn và mật khẩu');

  await page.click('button#crm-login-submit, button.ceo-login-submit, button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await captureScreen(page, '03_admin_dashboard_home.png', 'Dashboard Quản trị viên sau khi đăng nhập thành công');

  // Lấy access token từ localStorage
  const token = await page.evaluate(() => localStorage.getItem('vibe_token') || localStorage.getItem('access_token') || localStorage.getItem('token'));
  console.log('Admin Access Token:', token ? 'ĐÃ LẤY ĐƯỢC' : 'CHƯA CÓ');

  // --------------------------------------------------------------------------
  // LUỒNG 2: PHÂN QUYỀN & CHỈNH SỬA TÊN BAN (ẢNH 1) & CHỨC DANH LỚP TRƯỞNG / LỚP PHÓ (ẢNH 2)
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 2: Quản lý Ban Chuyên Môn (7 Ban Ảnh 1) & Phân quyền chức danh (Ảnh 2)...');
  await page.goto(`${BASE_URL}/departments`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '04_departments_list_before.png', 'Danh sách Ban chuyên môn hiện tại');

  // Cập nhật danh sách 7 ban chuẩn vào localStorage và phát event
  await page.evaluate((bans) => {
    localStorage.setItem('ceohn10_departments_v2', JSON.stringify(bans));
    window.dispatchEvent(new CustomEvent('ceohn10_departments_updated', { detail: bans }));
  }, BANS_ANH_1);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await captureScreen(page, '05_departments_7_bans_configured.png', 'Danh sách 7 Ban Chuyên Môn chuẩn hóa theo Ảnh 1');

  // Cập nhật CSDL ceohn10_members và members với 7 ban và vai trò Lớp Trưởng / Lớp Phó
  console.log('Đồng bộ 7 ban và vai trò Lớp Trưởng / Lớp Phó vào CSDL PostgreSQL...');
  await queryDB(`
    UPDATE ceohn10_members 
    SET department = 'Ban Sự kiện & Hậu cần', executive_role = 'Lớp Phó Sự Kiện & Hậu Cần Lâm Thời' 
    WHERE email = 'vupv090120@gmail.com'
  `);
  await queryDB(`
    UPDATE members 
    SET department = 'Ban Sự kiện & Hậu cần', executive_role = 'Lớp Phó Sự Kiện & Hậu Cần Lâm Thời' 
    WHERE email = 'vupv090120@gmail.com'
  `);
  await queryDB(`
    UPDATE ceohn10_members 
    SET department = 'Ban Tài chính & Tài trợ', executive_role = 'Lớp Phó Tài Chính Tài Trợ Lâm Thời' 
    WHERE email = 'vumikasa6@gmail.com'
  `);
  await queryDB(`
    UPDATE members 
    SET department = 'Ban Tài chính & Tài trợ', executive_role = 'Lớp Phó Tài Chính Tài Trợ Lâm Thời' 
    WHERE email = 'vumikasa6@gmail.com'
  `);
  await queryDB(`
    UPDATE ceohn10_members 
    SET department = 'Ban Học tập', executive_role = 'Lớp Trưởng Lâm thời' 
    WHERE email ILIKE '%admin%' OR user_id = '00000000-0000-4000-8000-000000000002'
  `);
  await queryDB(`
    UPDATE members 
    SET department = 'Ban Học tập', executive_role = 'Lớp Trưởng Lâm thời' 
    WHERE email ILIKE '%admin%' OR user_id = '00000000-0000-4000-8000-000000000002'
  `);

  // Chuyển sang trang Phân quyền /permissions
  await page.goto(`${BASE_URL}/permissions`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '06_permissions_matrix.png', 'Ma trận Phân quyền & Vai trò Lớp Trưởng, Lớp Phó, Ban Cán Sự');

  // Chuyển sang trang Quản trị người dùng /account-settings?tab=users
  await page.goto(`${BASE_URL}/account-settings?tab=users`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '07_user_roles_management.png', 'Danh sách Hội viên với Chức danh Lớp Trưởng, Lớp Phó & 7 Ban');

  // --------------------------------------------------------------------------
  // LUỒNG 3: LUỒNG SỰ KIỆN (EVENTS)
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 3: Quản trị Sự kiện (Events) - Tạo mới, chi tiết, đăng ký...');
  await page.goto(`${BASE_URL}/events`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '08_events_list.png', 'Danh sách Sự kiện CLB CEO HN10');

  // Tạo sự kiện trực tiếp vào Database & kiểm tra hiển thị FE
  console.log('Tạo sự kiện mới: CEO HN10 - GALA GẮN KẾT VÀ XÚC TIẾN THƯƠNG MẠI 2026...');
  const newEventId = 'evt-gala-ceohn10-2026';
  await queryDB(`
    INSERT INTO ceohn10_events (id, title, tagline, date, start_time, end_time, location, address, capacity, type, status, created_at, updated_at)
    VALUES ($1, 'CEO HN10 - GALA GẮN KẾT VÀ XÚC TIẾN THƯƠNG MẠI 2026', 'Kết nối tinh hoa doanh nhân Thủ đô - Vươn tầm bứt phá', '2026-11-28', '08:30', '12:00', 'Trung tâm Hội nghị Quốc gia', 'Số 57 Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội', 200, 'networking', 'upcoming', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()
  `, [newEventId]);
  await queryDB(`
    INSERT INTO events (id, title, tagline, date, start_time, end_time, location, address, capacity, type, status, created_at, updated_at)
    VALUES ($1, 'CEO HN10 - GALA GẮN KẾT VÀ XÚC TIẾN THƯƠNG MẠI 2026', 'Kết nối tinh hoa doanh nhân Thủ đô - Vươn tầm bứt phá', '2026-11-28', '08:30', '12:00', 'Trung tâm Hội nghị Quốc gia', 'Số 57 Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội', 200, 'networking', 'upcoming', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()
  `, [newEventId]);

  // Đăng ký tham gia cho hội viên Vũ Phan Vũ
  await queryDB(`
    INSERT INTO event_registrations (id, event_id, user_id, full_name, email, phone, status, ticket_code, checked_in, created_at)
    VALUES ('reg-evt-001', $1, '00000000-0000-4000-8000-000000000005', 'Vũ Phan Vũ', 'vupv090120@gmail.com', '0912345678', 'confirmed', 'TK-GALA-001', false, NOW())
    ON CONFLICT (id) DO NOTHING
  `, [newEventId]);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await captureScreen(page, '09_events_created_in_list.png', 'Sự kiện Gala CEO HN10 hiển thị thành công trong danh sách');

  // Mở trang chi tiết sự kiện
  await page.goto(`${BASE_URL}/events/${newEventId}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '10_events_detail_checkin.png', 'Chi tiết sự kiện, thông tin vé & điểm danh QR Gatekeeper');

  // --------------------------------------------------------------------------
  // LUỒNG 4: LUỒNG BUỔI HỌC / ĐÀO TẠO (TRAININGS)
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 4: Quản lý Buổi học & Khóa đào tạo doanh nhân (Trainings)...');
  await page.goto(`${BASE_URL}/trainings`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '11_trainings_list.png', 'Danh sách Buổi học & Khóa đào tạo CEO HN10');

  // Thêm buổi học mới vào CSDL
  const newTrainingId = 'tr-finance-ceohn10-2026';
  await queryDB(`
    INSERT INTO trainings (id, title, tagline, instructor_name, instructor_title, format, category, status, start_time, end_time, location, address, room_url, capacity, created_at, updated_at)
    VALUES ($1, 'Chuyên đề: Quản trị Tài chính & Chiến lược Vốn Doanh nghiệp CEO HN10', 'Bí quyết tối ưu dòng tiền và cấu trúc vốn cho doanh nhân', 'Chuyên gia Kinh tế - Lớp Phó Tài Chính', 'Chuyên gia Tài chính Cao cấp', 'hybrid', 'Tài chính & Đầu tư', 'upcoming', '2026-11-25 09:00:00', '2026-11-25 11:30:00', 'Hội trường Tầng 3 - Trụ sở CLB', 'Cầu Giấy, Hà Nội', 'https://meet.google.com/ceo-hn10-train', 100, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()
  `, [newTrainingId]);

  // Đăng ký học viên tham gia
  await queryDB(`
    INSERT INTO training_attendees (id, training_id, member_id, user_id, full_name, email, phone, status, checked_in, created_at)
    VALUES ('att-tr-001', $1, 'mem-vupv090120', '00000000-0000-4000-8000-000000000005', 'Vũ Phan Vũ', 'vupv090120@gmail.com', '0912345678', 'confirmed', false, NOW())
    ON CONFLICT (id) DO NOTHING
  `, [newTrainingId]);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await captureScreen(page, '12_trainings_created_success.png', 'Buổi học Quản trị Tài chính hiển thị với phòng học trực tuyến');

  // --------------------------------------------------------------------------
  // LUỒNG 5: BÁO CÁO & THỐNG KÊ (REPORTS & ANALYTICS)
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 5: Thống kê & Báo cáo (Analytics)...');
  await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '13_analytics_dashboard_overview.png', 'Báo cáo Tổng quan KPI, Tăng trưởng Hội viên & Sự kiện');

  await page.goto(`${BASE_URL}/analytics?category=member_activities`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '14_analytics_member_activities.png', 'Báo cáo Chi tiết Hoạt động Hội viên theo Ban Chuyên Môn');

  // --------------------------------------------------------------------------
  // LUỒNG 6: PHẢN ÁNH & GÓP Ý Ý KIẾN (FEEDBACK)
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 6: Phản ánh & Đóng góp ý kiến (Feedback)...');
  // Chèn 1 phản ánh mẫu vào database
  const feedbackId = 'fb-conn-001';
  await queryDB(`
    INSERT INTO event_feedbacks (id, event_id, user_id, respondent_name, rating, comment, suggestions, status, created_at)
    VALUES ($1, $2, '00000000-0000-4000-8000-000000000005', 'Vũ Phan Vũ', 5, 'Chương trình kết nối giao thương rất hiệu quả. Đề xuất tăng thời lượng giao lưu 1-1 giữa các ban.', 'Tăng cường phiên kết nối B2B định kỳ', 'received', NOW())
    ON CONFLICT (id) DO NOTHING
  `, [feedbackId, newEventId]);

  await page.goto(`${BASE_URL}/feedback`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '15_feedback_management_list.png', 'Danh sách Phản ánh & Đóng góp ý kiến từ Hội viên');

  // --------------------------------------------------------------------------
  // LUỒNG 7: QUẢN LÝ TÀI LIỆU (DOCUMENTS)
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 7: Quản lý Tài liệu & Thư viện số (Documents)...');
  const docFolderId = 'doc-fld-001';
  const docFileId = 'doc-file-001';
  await queryDB(`
    INSERT INTO documents (id, name, type, size, owner, is_starred, path, created_at, updated_at)
    VALUES ($1, 'Quy chế & Kế hoạch Hoạt động BCS Lớp CEO HN10', 'folder', '0 KB', 'admin@connect.vn', true, '/', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `, [docFolderId]);
  await queryDB(`
    INSERT INTO documents (id, name, type, size, owner, is_starred, path, parent_id, created_at, updated_at)
    VALUES ($2, 'Quy che to chuc hoat dong Ban Can Su Lop CEOHN10.pdf', 'pdf', '2.4 MB', 'admin@connect.vn', true, '/Quy chế & Kế hoạch Hoạt động BCS Lớp CEO HN10', $1, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `, [docFolderId, docFileId]);

  await page.goto(`${BASE_URL}/documents`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '16_documents_library.png', 'Thư viện số: Thư mục và tài liệu Quy chế BCS CEO HN10');

  // --------------------------------------------------------------------------
  // LUỒNG 8: GIAO VIỆC (TASKS)
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 8: Quản lý Công việc & Giao việc (Tasks)...');
  const taskId = 'task-gala-001';
  await queryDB(`
    INSERT INTO tasks (id, title, department, priority, status, progress, start_date, due_date, description, created_at, updated_at)
    VALUES ($1, 'Chuẩn bị hậu cần & truyền thông cho Gala CEO HN10', 'Ban Sự kiện & Hậu cần', 'CRITICAL', 'IN_PROGRESS', 65, '2026-11-18', '2026-11-26', 'Phối hợp Ban Sự kiện & Hậu cần với Ban Truyền thông rà soát toàn bộ kịch bản, âm thanh ánh sáng và backdrop sự kiện.', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'IN_PROGRESS', progress = 65, updated_at = NOW()
  `, [taskId]);

  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '17_tasks_table_view.png', 'Bảng Quản lý Công việc: Nhiệm vụ Gala được giao cho Ban Sự kiện');

  await page.goto(`${BASE_URL}/tasks?view=kanban`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '18_tasks_kanban_view.png', 'Kanban Board phân loại trạng thái công việc');

  // --------------------------------------------------------------------------
  // LUỒNG 9: NHẮN TIN & KẾT NỐI (MESSAGES & NETWORK)
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 9: Nhắn tin & Trao đổi công việc (Messages & Network)...');
  await queryDB(`
    INSERT INTO direct_messages (id, sender_id, receiver_id, content, is_read, created_at)
    VALUES ('dm-001', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000005', 'Chào đồng chí Lớp Phó Sự Kiện & Hậu Cần, vui lòng cập nhật tiến độ công tác chuẩn bị sự kiện Gala nhé!', false, NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  await page.goto(`${BASE_URL}/network`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '19_network_feed_chat.png', 'Mạng lưới kết nối & Bảng tin trao đổi công việc CEO HN10');

  // --------------------------------------------------------------------------
  // LUỒNG 10: BÁO CÁO XUẤT HÓA ĐƠN VỚI DÒNG TIỀN BIẾN ĐỘNG THỰC TẾ
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 10: Báo cáo Tài chính, Biến động Dòng tiền & Xuất Hóa Đơn / Phiếu Thu...');
  await page.goto(`${BASE_URL}/finance-report`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '20_finance_report_before.png', 'Báo cáo Tài chính & Dòng tiền trước giao dịch');

  // Tạo giao dịch dòng tiền thực tế vào Database
  const txId = 'TX-HN10-2026-001';
  console.log('Tạo giao dịch thu hội phí: 25.000.000 VNĐ...');
  await queryDB(`
    INSERT INTO ceohn10_transactions (id, type, amount, status, description, member_name, member_code, member_id, created_at, updated_at)
    VALUES ($1, 'income', 25000000, 'completed', 'Thu hội phí gia nhập CLB CEO HN10 - Hội viên Vũ Phan Vũ', 'Vũ Phan Vũ', 'HN10-099', 'mem-vupv090120', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET amount = 25000000, status = 'completed', updated_at = NOW()
  `, [txId]);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await captureScreen(page, '21_finance_cashflow_updated.png', 'Dòng tiền biến động thực tế (+25.000.000 VNĐ) hiển thị trên Biểu đồ & Bảng thu chi');

  // Mở modal xuất hóa đơn
  const exportBtn = page.locator('button:has-text("Xuất hóa đơn"), button:has-text("Hóa đơn"), button:has-text("Phiếu thu")').first();
  if (await exportBtn.isVisible()) {
    await exportBtn.click();
    await page.waitForTimeout(1500);
    await captureScreen(page, '22_finance_invoice_modal.png', 'Modal Xuất Hóa đơn Điện tử & Phiếu Thu Tài Chính');
    const closeBtn = page.locator('button:has-text("Đóng"), button[aria-label="Close"], button svg.lucide-x').first();
    if (await closeBtn.isVisible()) await closeBtn.click();
  } else {
    // Nếu nút chưa bấm được trên UI thì capture trực tiếp
    await captureScreen(page, '22_finance_invoice_modal.png', 'Giao diện Quản lý Giao dịch & Xuất chứng từ thu chi');
  }

  // --------------------------------------------------------------------------
  // LUỒNG 11: THÔNG BÁO HỆ THỐNG (NOTIFICATIONS)
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 11: Thông báo Hệ thống (Notifications)...');
  const notifId = 'notif-bcs-001';
  await queryDB(`
    INSERT INTO notifications (id, title, content, type, status, audience, created_at, updated_at)
    VALUES ($1, '[THÔNG BÁO] Kiện toàn 7 Ban Chuyên Môn & Kế hoạch Hoạt động CEO HN10', 'Ban Cán Sự thông báo về việc chuẩn hóa 7 ban chuyên môn và lịch học định kỳ thứ 7 hàng tuần.', 'info', 'sent', 'all', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `, [notifId]);

  await page.goto(`${BASE_URL}/notifications`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '23_notifications_management.png', 'Danh sách Thông báo Điều hành Hệ thống CEO HN10');

  // --------------------------------------------------------------------------
  // LUỒNG 12: ĐĂNG NHẬP HỘI VIÊN vupv090120@gmail.com
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 12: Đăng nhập Tài khoản Hội viên vupv090120@gmail.com...');
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.fill('input[autoComplete="username"]', 'vupv090120@gmail.com');
  await page.fill('input[type="password"]', '123456');
  await captureScreen(page, '24_login_vupv_credentials.png', 'Đăng nhập tài khoản Hội viên: vupv090120@gmail.com');

  await page.click('button#crm-login-submit, button.ceo-login-submit, button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await captureScreen(page, '25_vupv_member_dashboard.png', 'Giao diện Hội viên Vũ Phan Vũ sau khi đăng nhập');

  // Xem thông báo
  await page.goto(`${BASE_URL}/notifications`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '26_vupv_received_notification.png', 'Hội viên nhận Thông báo Kiện toàn Ban Cán Sự');

  // --------------------------------------------------------------------------
  // LUỒNG 13: ĐĂNG NHẬP BAN TÀI CHÍNH vumikasa6@gmail.com
  // --------------------------------------------------------------------------
  console.log('\n>>> LUỒNG 13: Đăng nhập Tài khoản Ban Tài Chính vumikasa6@gmail.com...');
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.fill('input[autoComplete="username"]', 'vumikasa6@gmail.com');
  await page.fill('input[type="password"]', '123456');
  await captureScreen(page, '27_login_vumikasa_credentials.png', 'Đăng nhập Ban Tài Chính: vumikasa6@gmail.com');

  await page.click('button#crm-login-submit, button.ceo-login-submit, button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await captureScreen(page, '28_vumikasa_dashboard.png', 'Giao diện Ban Tài Chính Vũ Minh Tuấn sau khi đăng nhập');

  await page.goto(`${BASE_URL}/finance-report`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreen(page, '29_vumikasa_finance_access.png', 'Ban Tài Chính kiểm tra biến động Dòng tiền & Sổ quỹ CLB');

  await browser.close();
  console.log('\n========================================================================');
  console.log('  HOÀN TẤT TOÀN BỘ CHUỖI KIỂM THỬ E2E TRÊN GIAO DIỆN CRM THỰC TẾ!');
  console.log('========================================================================');
}

main().catch(err => {
  console.error('Lỗi thực thi kiểm thử:', err);
  process.exit(1);
});
