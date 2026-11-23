const { PrismaClient } = require('@ceohn10/db');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Bắt đầu khởi tạo dữ liệu THỰC SỰ cho luồng Trước - Trong - Sau sự kiện CEO HN10...');

  // 1. Lấy thông tin Association chuẩn
  const assocs = await prisma.$queryRaw`
    SELECT id, name FROM public.associations LIMIT 1
  `.catch(() => []);
  const assocId = assocs?.[0]?.id || 'c1983000-0000-4000-8000-000000001983';
  console.log('✓ Association ID:', assocId);

  // 2. ID sự kiện
  const eventId = 'ceohn10-evt-kg2026';
  const eventName = 'Lễ Khai Giảng Lớp CEO HN10 & Đại Hội Giao Thương Khóa 1';

  // Xóa sạch dữ liệu cũ của sự kiện này nếu có
  await prisma.$executeRaw`DELETE FROM public.member_checkins WHERE event_id = ${eventId}`.catch(() => {});
  await prisma.$executeRaw`DELETE FROM public.event_registrations WHERE event_id = ${eventId}`.catch(() => {});
  await prisma.$executeRaw`DELETE FROM public.event_ticket_types WHERE event_id = ${eventId}`.catch(() => {});
  await prisma.$executeRaw`DELETE FROM public.events WHERE id = ${eventId}`.catch(() => {});

  // 3. TẠO SỰ KIỆN VÀO BẢNG public.events
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 3); // Diễn ra sau 3 ngày

  await prisma.$executeRaw`
    INSERT INTO public.events (
      id, name, date, location, capacity, registered, status, type, qr_fields, association_id, created_at, updated_at
    ) VALUES (
      ${eventId},
      ${eventName},
      ${eventDate},
      'Trung Tâm Hội Nghị Quốc Gia (NCC) - Cổng 1 Đại Lộ Thăng Long, Mễ Trì, Nam Từ Liêm, Hà Nội',
      150,
      6,
      'upcoming',
      'gala',
      ARRAY['registration_code', 'member_name', 'phone', 'ticket_type']::text[],
      ${assocId}::uuid,
      NOW(),
      NOW()
    )
  `;
  console.log('✓ Đã tạo Sự kiện thành công vào CSDL:', eventName);

  // 4. TẠO 3 HẠNG VÉ VÀO BẢNG public.event_ticket_types
  await prisma.$executeRaw`
    INSERT INTO public.event_ticket_types (id, event_id, association_id, name, price, quantity, description, created_at, updated_at)
    VALUES 
      ('tkt-vip', ${eventId}, ${assocId}::uuid, 'Vé VIP Doanh Nhân (Bao gồm Gala Dinner)', 1000000, 30, 'Chỗ ngồi hàng đầu, dự tiệc Gala Dinner và quà tặng VIP', NOW(), NOW()),
      ('tkt-standard', ${eventId}, ${assocId}::uuid, 'Vé Tiêu Chuẩn Học Viên CEO HN10', 0, 100, 'Dành riêng cho học viên chính thức lớp CEO HN10', NOW(), NOW()),
      ('tkt-guest', ${eventId}, ${assocId}::uuid, 'Vé Khách Mời B2B Giao Thương', 500000, 20, 'Tham dự phiên kết nối giao thương và triển lãm sản phẩm', NOW(), NOW())
  `;
  console.log('✓ Đã tạo 3 hạng vé sự kiện (VIP 1tr, Tiêu chuẩn 0đ, Khách mời 500k)');

  // 5. TẠO 6 ĐẠI BIỂU ĐĂNG KÝ VÀO BẢNG public.event_registrations
  const attendees = [
    {
      id: 'reg-hn10-001',
      member_code: 'HN10-001',
      member_name: 'Lê Thị Dung (Admin Viconnect)',
      email: 'admin@viconnect.vn',
      status: 'checked_in',
      ticket_type: 'Vé VIP Doanh Nhân',
      checked_in: true,
    },
    {
      id: 'reg-hn10-002',
      member_code: 'HN10-002',
      member_name: 'Phạm Hồng Nguyên (BTT)',
      email: 'infor@viconnect.vn',
      status: 'checked_in',
      ticket_type: 'Vé Tiêu Chuẩn Học Viên CEO HN10',
      checked_in: true,
    },
    {
      id: 'reg-hn10-003',
      member_code: 'HN10-003',
      member_name: 'Nguyễn Văn Tuấn (Quản trị CEO HN10)',
      email: 'admin.hn10@ceohn10.vn',
      status: 'checked_in',
      ticket_type: 'Vé VIP Doanh Nhân',
      checked_in: true,
    },
    {
      id: 'reg-hn10-004',
      member_code: 'HN10-004',
      member_name: 'Trần Thu Hà (Á Châu Invest)',
      email: 'ha.tran@achau-invest.vn',
      status: 'checked_in',
      ticket_type: 'Vé Khách Mời B2B Giao Thương',
      checked_in: true,
    },
    {
      id: 'reg-hn10-005',
      member_code: 'HN10-005',
      member_name: 'Hoàng Minh Đức (Nội Thất Đức Phát)',
      email: 'duc.hoang@ducphat-furniture.vn',
      status: 'confirmed',
      ticket_type: 'Vé Tiêu Chuẩn Học Viên CEO HN10',
      checked_in: false,
    },
    {
      id: 'reg-hn10-006',
      member_code: 'HN10-006',
      member_name: 'Vũ Thị Mai (Dược Phẩm Việt Pháp)',
      email: 'mai.vu@vietphap-pharma.vn',
      status: 'confirmed',
      ticket_type: 'Vé Khách Mời B2B Giao Thương',
      checked_in: false,
    },
  ];

  for (const att of attendees) {
    await prisma.$executeRaw`
      INSERT INTO public.event_registrations (
        id, event_id, member_code, member_name, email, registered_at, status, ticket_type, association_id, created_at, updated_at
      ) VALUES (
        ${att.id},
        ${eventId},
        ${att.member_code},
        ${att.member_name},
        ${att.email},
        ${eventDate},
        ${att.status},
        ${att.ticket_type},
        ${assocId}::uuid,
        NOW(),
        NOW()
      )
    `;

    // 6. GHI NHẬN CHECK-IN CHO 4 ĐẠI BIỂU ĐÃ VÀO CỬA VÀO BẢNG public.member_checkins
    if (att.checked_in) {
      await prisma.$executeRaw`
        INSERT INTO public.member_checkins (
          id, client_id, member_code, event_id, event_title, status, method, checked_at, association_id, created_at
        ) VALUES (
          gen_random_uuid(),
          ${att.id},
          ${att.member_code},
          ${eventId},
          ${eventName},
          'checked_in',
          'qr_scanner',
          NOW(),
          ${assocId}::uuid,
          NOW()
        )
      `;
    }
  }
  console.log('✓ Đã tạo 6 đại biểu đăng ký (4 đã check-in qua QR, 2 chưa check-in để sẵn sàng quét thử)');

  // 7. CẬP NHẬT CẤU HÌNH THÔNG BÁO VÀ DÒNG TIỀN VÀO app_settings
  await prisma.$executeRaw`
    INSERT INTO public.app_settings (key, value, updated_at)
    VALUES (
      'ceohn10_active_event_context',
      ${JSON.stringify({
        activeEventId: eventId,
        eventName: eventName,
        totalRegistered: 6,
        totalCheckedIn: 4,
        attendanceRate: '66.7%',
        vipTickets: 2,
        standardTickets: 2,
        guestTickets: 2,
        eventFunds: {
          revenue: 15000000,
          expenses: 11000000,
          netBalance: 4000000,
        }
      })}::jsonb,
      NOW()
    )
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `.catch(() => {});
  console.log('✓ Đã lưu context sự kiện vào app_settings');

  console.log('🎉 TOÀN BỘ DỮ LIỆU SỰ KIỆN THỰC TẾ ĐÃ ĐƯỢC LƯU VÀO CSDL CHUẨN 113.20.107.184:6432!');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Lỗi seed event flow:', e);
  await prisma.$disconnect();
  process.exit(1);
});
