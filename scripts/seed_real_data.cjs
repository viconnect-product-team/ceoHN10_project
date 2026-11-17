const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable'
});

async function seedRealData() {
  await client.connect();
  console.log('--- ĐỒNG BỘ DỮ LIỆU THỰC TẾ VÀO CSDL POSTGRESQL CHUẨN ---');

  const assocRes = await client.query(`SELECT id FROM associations LIMIT 1`);
  const assocId = assocRes.rows[0]?.id || 'c1983000-0000-4000-8000-000000001983';
  console.log('Using association_id:', assocId);

  // 1. Sự kiện Gala
  const evtId = 'e0000000-0000-4000-8000-000000000001';
  await client.query(`
    INSERT INTO events (id, association_id, name, tagline, date, start_time, end_time, location, address, capacity, type, status, created_at, updated_at)
    VALUES ($1, $2, 'CEO HN10 - GALA GẮN KẾT VÀ XÚC TIẾN THƯƠNG MẠI 2026', 'Kết nối tinh hoa doanh nhân Thủ đô - Vươn tầm bứt phá', '2026-11-28', '08:30', '12:00', 'Trung tâm Hội nghị Quốc gia Hà Nội', 'Số 57 Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội', 200, 'networking', 'upcoming', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
  `, [evtId, assocId]);
  await client.query(`
    INSERT INTO ceohn10_events (id, association_id, name, date, location, capacity, type, status, created_at, updated_at)
    VALUES ($1, $2, 'CEO HN10 - GALA GẮN KẾT VÀ XÚC TIẾN THƯƠNG MẠI 2026', '2026-11-28', 'Trung tâm Hội nghị Quốc gia Hà Nội', 200, 'networking', 'upcoming', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
  `, [evtId, assocId]);
  console.log('✅ Đã lưu Sự kiện vào Database events & ceohn10_events');

  // 2. Buổi học / Đào tạo (Valid UUID)
  const trId = crypto.randomUUID();
  await client.query(`
    INSERT INTO trainings (id, title, tagline, instructor_name, instructor_title, format, category, status, start_time, end_time, location, address, room_url, max_attendees, created_at, updated_at)
    VALUES ($1, 'Chuyên đề: Quản trị Tài chính & Chiến lược Vốn Doanh nghiệp CEO HN10', 'Bí quyết tối ưu dòng tiền và cấu trúc vốn cho doanh nhân', 'Chuyên gia Kinh tế - Lớp Phó Tài Chính', 'Chuyên gia Tài chính Doanh nghiệp', 'hybrid', 'Tài chính & Đầu tư', 'upcoming', '2026-11-25 09:00:00', '2026-11-25 11:30:00', 'Hội trường Tầng 3 - Trụ sở CLB CEO HN10', 'Cầu Giấy, Hà Nội', 'https://meet.google.com/ceo-hn10-train', 100, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()
  `, [trId]);
  console.log('✅ Đã lưu Buổi học vào Database trainings');

  // 3. Phản ánh (Valid UUID)
  const fbId = crypto.randomUUID();
  await client.query(`
    INSERT INTO event_feedbacks (id, event_id, user_name, user_email, rating, comment, created_at)
    VALUES ($1, $2, 'Vũ Phan Vũ', 'vupv090120@gmail.com', 5, 'Chương trình kết nối giao thương rất thiết thực. Đề xuất tăng cường phiên kết nối 1-1 giữa các ban chuyên môn.', NOW())
    ON CONFLICT (id) DO NOTHING
  `, [fbId, evtId]);
  console.log('✅ Đã lưu Phản ánh vào Database event_feedbacks');

  // 4. Tài liệu (Valid UUID & BigInt sizes & file_url)
  const docFldId = crypto.randomUUID();
  const docFileId = crypto.randomUUID();
  await client.query(`
    INSERT INTO documents (id, association_id, title, name, type, file_url, file_size, size, is_folder, uploaded_by_name, created_at, updated_at)
    VALUES ($1, $2, 'Quy chế & Kế hoạch Hoạt động BCS Lớp CEO HN10', 'Quy chế & Kế hoạch Hoạt động BCS Lớp CEO HN10', 'folder', '/folders/quy-che', 0, 0, true, 'Lê Thị Dung (Admin CEO HN10)', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `, [docFldId, assocId]);
  await client.query(`
    INSERT INTO documents (id, association_id, title, name, type, file_url, file_size, size, is_folder, folder_id, uploaded_by_name, created_at, updated_at)
    VALUES ($1, $2, 'Quy chế tổ chức hoạt động Ban Cán Sự Lớp CEO HN10', 'Quy che to chuc hoat dong Ban Can Su Lop CEOHN10.pdf', 'pdf', 'https://ceohn10.vn/docs/quy-che-bcs-ceohn10.pdf', 2457600, 2457600, false, $3, 'Lê Thị Dung (Admin CEO HN10)', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `, [docFileId, assocId, docFldId]);
  console.log('✅ Đã lưu Tài liệu vào Database documents');

  // 5. Công việc (Tasks)
  const taskId = crypto.randomUUID();
  await client.query(`
    INSERT INTO tasks (id, title, department, priority, status, progress, start_date, due_date, description, created_at, updated_at)
    VALUES ($1, 'Chuẩn bị hậu cần & truyền thông cho Gala CEO HN10', 'Ban Sự kiện & Hậu cần', 'CRITICAL', 'IN_PROGRESS', 65, '2026-11-18', '2026-11-26', 'Phối hợp Ban Sự kiện & Hậu cần với Ban Truyền thông rà soát toàn bộ kịch bản, âm thanh ánh sáng và backdrop sự kiện.', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'IN_PROGRESS', progress = 65, updated_at = NOW()
  `, [taskId]);
  console.log('✅ Đã lưu Công việc vào Database tasks');

  // 6. Giao dịch tài chính & Dòng tiền thực tế
  const txId = crypto.randomUUID();
  await client.query(`
    INSERT INTO ceohn10_transactions (id, association_id, type, amount, status, description, date, method, category, code, created_at, updated_at)
    VALUES ($1, $2, 'income', 25000000, 'completed', 'Thu hội phí gia nhập CLB CEO HN10 - Học viên Vũ Phan Vũ', '2026-11-16', 'Chuyển khoản Ngân hàng', 'Hội phí', 'HP-HN10-099', NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET amount = 25000000, status = 'completed', updated_at = NOW()
  `, [txId, assocId]);
  console.log('✅ Đã lưu Giao dịch tài chính thực tế vào Database ceohn10_transactions');

  // 7. Thông báo hệ thống
  const notifId = crypto.randomUUID();
  let tenantId = null;
  try {
    const tenantRow = await client.query(`SELECT id FROM tenants LIMIT 1`);
    tenantId = tenantRow.rows[0]?.id;
  } catch (err) {
    console.log('Error fetching tenant:', err.message);
  }

  if (tenantId) {
    await client.query(`
      INSERT INTO notifications (id, tenant_id, title, description, kind, created_at)
      VALUES ($1, $2, '[THÔNG BÁO] Kiện toàn 7 Ban Chuyên Môn & Kế hoạch Hoạt động CEO HN10', 'Ban Cán Sự thông báo về việc chuẩn hóa 7 ban chuyên môn và lịch học định kỳ thứ 7 hàng tuần.', 'info', NOW())
      ON CONFLICT (id) DO NOTHING
    `, [notifId, tenantId]);
    console.log('✅ Đã lưu Thông báo hệ thống vào Database notifications (tenant_id:', tenantId, ')');
  } else {
    console.log('⚠️ Bỏ qua notifications do không có tenant hợp lệ');
  }

  await client.end();
  console.log('--- ĐỒNG BỘ DỮ LIỆU HOÀN TẤT 100%! ---');
}

seedRealData().catch(console.error);
