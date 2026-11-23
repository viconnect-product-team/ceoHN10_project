const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project"
    }
  }
});

async function exec(sql) {
  try {
    await prisma.$executeRawUnsafe(sql);
  } catch (e) {
    console.warn("Notice on SQL:", e.message);
  }
}

async function main() {
  console.log("🌱 BẮT ĐẦU NẠP DỮ LIỆU ĐẦY ĐỦ CHO DATABASE LOCALHOST (PORT 5432)...");

  // 1. DDL: Bổ sung các cột
  console.log("1. Đảm bảo cấu trúc cột (DDL) cho bảng events & event_registrations...");
  const ddlStatements = [
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description text DEFAULT ''`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS photo_gallery_url text DEFAULT ''`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tagline text DEFAULT ''`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS department text DEFAULT 'ban_su_kien'`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category text DEFAULT 'su_kien_clb'`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_custom_event boolean DEFAULT false`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS total_cost numeric DEFAULT 0`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS expected_attendees integer DEFAULT 1`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_fee numeric DEFAULT 0`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_price numeric DEFAULT 0`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fee numeric DEFAULT 0`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS format text DEFAULT 'offline'`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_url text DEFAULT ''`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sponsors jsonb DEFAULT '[]'::jsonb`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS seating_map jsonb DEFAULT '[]'::jsonb`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS lucky_draw jsonb DEFAULT '[]'::jsonb`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS parts jsonb DEFAULT '["Tọa đàm", "Tiệc Gala Dinner"]'::jsonb`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS form_config jsonb DEFAULT '{}'::jsonb`,
    `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS phone text DEFAULT ''`,
    `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS company text DEFAULT ''`,
    `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS seat_number text DEFAULT ''`,
    `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS checked_in_at timestamp with time zone`,
    `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS checked_out_at timestamp with time zone`,
    `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS is_walkin boolean DEFAULT false`,
    `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS registration_origin text DEFAULT 'pre_registered'`,
    `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'free'`,
    `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT 0`,
    `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS note text DEFAULT ''`,
    `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS dynamic_data jsonb DEFAULT '{}'::jsonb`,
    `ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS attended_parts jsonb DEFAULT '[]'::jsonb`,
    `CREATE TABLE IF NOT EXISTS public.event_photos (
      id text PRIMARY KEY,
      event_id text NOT NULL,
      photo_url text NOT NULL,
      caption text DEFAULT '',
      uploaded_by text DEFAULT '',
      created_at timestamp with time zone DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS public.event_feedback (
      id text PRIMARY KEY,
      event_id text NOT NULL,
      member_name text DEFAULT '',
      member_phone text DEFAULT '',
      rating integer DEFAULT 5,
      comment text DEFAULT '',
      created_at timestamp with time zone DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS public.polls (
      id text PRIMARY KEY,
      title text NOT NULL,
      description text DEFAULT '',
      event_id text,
      status text DEFAULT 'active',
      options jsonb DEFAULT '[]'::jsonb,
      created_at timestamp with time zone DEFAULT now()
    )`
  ];

  for (const s of ddlStatements) {
    await exec(s);
  }
  console.log("✅ DDL hoàn tất!");

  // 2. Tạo Association chuẩn: CLB Doanh Nhân CEO HN10 (HanoiBA)
  const assocId = "00000000-0000-4000-8000-000000000001";
  console.log("2. Cập nhật / Thêm Association CEO HN10...");
  await exec(`
    INSERT INTO public.associations (id, name, slug, tagline, about, contact_email)
    VALUES (
      '${assocId}'::uuid,
      'CLB Doanh Nhân CEO HN10 (HanoiBA)',
      'ceohn10',
      'Hội Doanh Nhân Trẻ Hà Nội - Lớp CEO HN10',
      'Cộng đồng doanh nhân kết nối tri thức, hợp tác đầu tư và phát triển bền vững.',
      'admin@ceohn10.vn'
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      tagline = EXCLUDED.tagline
  `);

  // 3. Tạo tài khoản Quản trị viên
  console.log("3. Tạo / Cập nhật tài khoản Admin...");
  const salt = await bcrypt.genSalt(10);
  const hashPass = await bcrypt.hash("123456", salt);
  const adminId = "00000000-0000-4000-8000-000000000002";

  await exec(`
    INSERT INTO public.vione_users (id, username, email, password, name, phone, role, status)
    VALUES (
      '${adminId}'::uuid,
      'admin@connect.vn',
      'admin@viconnect.vn',
      '${hashPass}',
      'Quản trị viên CEO HN10',
      '0988888888',
      'admin',
      'active'
    )
    ON CONFLICT (id) DO UPDATE SET
      password = '${hashPass}',
      name = 'Quản trị viên CEO HN10',
      role = 'admin',
      status = 'active'
  `);

  await exec(`
    INSERT INTO public.vione_users (id, username, email, password, name, phone, role, status)
    VALUES (
      '00000000-0000-4000-8000-000000000003'::uuid,
      'admin.hn10@ceohn10.vn',
      'admin.hn10@ceohn10.vn',
      '${hashPass}',
      'Admin Platform CEO HN10',
      '0977777777',
      'admin_platform',
      'active'
    )
    ON CONFLICT (id) DO UPDATE SET
      password = '${hashPass}',
      name = 'Admin Platform CEO HN10',
      role = 'admin_platform'
  `);

  // 4. Tạo 2 Sự kiện mẫu đầy đủ dữ liệu
  console.log("4. Nạp 2 sự kiện mẫu (Có phí 500k & Miễn phí 0k)...");
  
  const paidSponsors = JSON.stringify([
    {
      id: "sp-01",
      name: "Tập đoàn Công nghệ Viconnect Vietnam",
      sponsor_type: "companion",
      amount: 50000000,
      notes: "Tài trợ Kim Cương Dạ Tiệc - Chuyển khoản VietQR",
      logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300"
    },
    {
      id: "sp-02",
      name: "Công ty Cổ phần Bất Động Sản Doanh Trí",
      sponsor_type: "companion",
      amount: 20000000,
      notes: "Tài trợ Vàng - Tiền mặt",
      logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300"
    }
  ]);

  const paidSeatingMap = JSON.stringify([
    { row: "A", seats: [
      { id: "A-01", number: "A-01", status: "occupied", guestName: "Lê Hoàng Long", guestTitle: "Hoàng Long Logistics" },
      { id: "A-02", number: "A-02", status: "occupied", guestName: "Nguyễn Văn Tuấn", guestTitle: "CEO Viconnect" },
      { id: "A-03", number: "A-03", status: "available" },
      { id: "A-04", number: "A-04", status: "available" },
      { id: "A-05", number: "A-05", status: "vip" }
    ]},
    { row: "B", seats: [
      { id: "B-01", number: "B-01", status: "available" },
      { id: "B-02", number: "B-02", status: "available" },
      { id: "B-03", number: "B-03", status: "available" }
    ]}
  ]);

  const paidLuckyDraw = JSON.stringify([
    { id: "prize-1", title: "Giải Nhất: iPhone 16 Pro Max 256GB", value: 35000000, winner: "Lê Hoàng Long (0901234567)" },
    { id: "prize-2", title: "Giải Nhì: iPad Pro M4", value: 24000000, winner: null },
    { id: "prize-3", title: "Giải Ba: Thẻ Doanh Nhân Vàng CEO HN10", value: 10000000, winner: null }
  ]);

  // Insert Sự kiện 1: Có phí (Year End Party 500k)
  await exec(`
    INSERT INTO public.events (
      id, name, date, location, capacity, registered, status, type,
      description, ticket_fee, ticket_price, fee, format, sponsors, seating_map, lucky_draw, association_id
    ) VALUES (
      'EVT-PAID-2026',
      'DẠ TIỆC TẤT NIÊN YEAR END PARTY 2026 - CEO HN10',
      '2026-12-30',
      'Trung tâm Hội nghị Quốc gia, Mễ Trì, Nam Từ Liêm, Hà Nội',
      300,
      3,
      'upcoming',
      'year_end_party',
      'Đêm tiệc tri ân và giao lưu kết nối doanh nhân CEO HN10 cuối năm với sự tham gia của 300 CEO.',
      500000,
      500000,
      500000,
      'offline',
      '${paidSponsors.replace(/'/g, "''")}'::jsonb,
      '${paidSeatingMap.replace(/'/g, "''")}'::jsonb,
      '${paidLuckyDraw.replace(/'/g, "''")}'::jsonb,
      '${assocId}'::uuid
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      ticket_price = 500000,
      fee = 500000,
      sponsors = EXCLUDED.sponsors,
      seating_map = EXCLUDED.seating_map,
      lucky_draw = EXCLUDED.lucky_draw
  `);

  // Insert Sự kiện 2: Miễn phí (Khai giảng 0k)
  await exec(`
    INSERT INTO public.events (
      id, name, date, location, capacity, registered, status, type,
      description, ticket_fee, ticket_price, fee, format, association_id
    ) VALUES (
      'EVT-FREE-2026',
      'LỄ KHAI GIẢNG KHÓA HỌC DOANH TRÍ CEO HN10',
      '2026-12-15',
      'Hội trường Tầng 5, Trụ sở CEO HN10, Cầu Giấy, Hà Nội',
      200,
      2,
      'upcoming',
      'khai_giang',
      'Lễ khai giảng khóa đào tạo lãnh đạo và quản trị doanh nghiệp cao cấp miễn phí cho hội viên.',
      0,
      0,
      0,
      'offline',
      '${assocId}'::uuid
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      ticket_price = 0,
      fee = 0
  `);

  // 5. Nạp danh sách đại biểu đăng ký
  console.log("5. Nạp danh sách đại biểu đăng ký...");
  await exec(`DELETE FROM public.event_registrations WHERE event_id IN ('EVT-PAID-2026', 'EVT-FREE-2026')`);

  // Đăng ký 1: Có phí - Đã thanh toán 500k
  await exec(`
    INSERT INTO public.event_registrations (
      id, event_id, member_code, member_name, email, phone, company,
      status, ticket_type, payment_status, payment_amount, is_walkin, registration_origin,
      seat_number, note, association_id
    ) VALUES (
      'REG-PAID-001',
      'EVT-PAID-2026',
      'HN10-001',
      'Lê Hoàng Long',
      'long.le@hoanglong.vn',
      '0901234567',
      'Hoàng Long Logistics',
      'confirmed',
      'VIP',
      'paid',
      500000,
      false,
      'pre_registered',
      'A-01 VIP',
      'Đại biểu VIP - Đã thanh toán 500.000₫ qua VietQR',
      '${assocId}'::uuid
    )
  `);

  // Đăng ký 2: Có phí - Chờ thanh toán
  await exec(`
    INSERT INTO public.event_registrations (
      id, event_id, member_code, member_name, email, phone, company,
      status, ticket_type, payment_status, payment_amount, is_walkin, registration_origin,
      seat_number, note, association_id
    ) VALUES (
      'REG-PAID-002',
      'EVT-PAID-2026',
      'HN10-002',
      'Phạm Minh Đức',
      'duc.pm@ducminh.vn',
      '0912999888',
      'Đức Minh Media & Event',
      'waitlist',
      'Standard',
      'pending',
      500000,
      false,
      'pre_registered',
      'B-01',
      'Chờ thanh toán nhận vé - Quét mã VietQR MBBank',
      '${assocId}'::uuid
    )
  `);

  // Đăng ký 3: Sự kiện miễn phí - Đăng ký trước giờ G
  await exec(`
    INSERT INTO public.event_registrations (
      id, event_id, member_code, member_name, email, phone, company,
      status, ticket_type, payment_status, payment_amount, is_walkin, registration_origin,
      note, association_id
    ) VALUES (
      'REG-FREE-001',
      'EVT-FREE-2026',
      'HN10-003',
      'Trần Thị Mai',
      'mai.tran@vione.com',
      '0987654321',
      'Tập đoàn Vione EdTech',
      'confirmed',
      'Standard',
      'free',
      0,
      false,
      'pre_registered',
      'Học viên đăng ký trước giờ G',
      '${assocId}'::uuid
    )
  `);

  // Đăng ký 4: Sự kiện miễn phí - KHÁCH VÃNG LAI MỚI ĐẾN (Auto Pass + Tự sinh cột đánh dấu)
  await exec(`
    INSERT INTO public.event_registrations (
      id, event_id, member_code, member_name, email, phone, company,
      status, ticket_type, payment_status, payment_amount, is_walkin, registration_origin,
      checked_in_at, note, association_id
    ) VALUES (
      'REG-FREE-WALKIN-999',
      'EVT-FREE-2026',
      'HN10-GUEST-999',
      'Hoàng Quốc Bảo',
      'bao.hq@vietcorp.vn',
      '0977889900',
      'Việt Corp Technology',
      'attended',
      'Walk-in',
      'free',
      0,
      true,
      'walkin_unannounced',
      NOW(),
      'Khách tham gia không nằm trong danh sách đăng ký trước giờ G',
      '${assocId}'::uuid
    )
  `);

  // 6. Nạp Ảnh Sự Kiện (Photo Gallery)
  console.log("6. Nạp bộ sưu tập ảnh sự kiện (Live Photo Gallery)...");
  await exec(`DELETE FROM public.event_photos WHERE event_id IN ('EVT-PAID-2026', 'EVT-FREE-2026')`);
  await exec(`
    INSERT INTO public.event_photos (id, event_id, photo_url, caption, uploaded_by) VALUES
    ('ph-01', 'EVT-PAID-2026', 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800', 'Lễ trao kỷ niệm chương Nhà tài trợ Kim Cương', 'Ban Truyền thông'),
    ('ph-02', 'EVT-PAID-2026', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800', 'Toàn cảnh Hội nghị Dạ tiệc Tất niên 2026', 'Ban Sự kiện'),
    ('ph-03', 'EVT-FREE-2026', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', 'Giây phút Khai mạc Khóa học Doanh Trí', 'Ban Đào tạo')
  `);

  // 7. Nạp Phản ánh & Góp ý (Feedbacks)
  console.log("7. Nạp phản ánh góp ý sau sự kiện...");
  await exec(`DELETE FROM public.event_feedback WHERE event_id IN ('EVT-PAID-2026', 'EVT-FREE-2026')`);
  await exec(`
    INSERT INTO public.event_feedback (id, event_id, member_name, member_phone, rating, comment) VALUES
    ('fb-01', 'EVT-PAID-2026', 'Lê Hoàng Long', '0901234567', 5, 'Dạ tiệc tổ chức rất trang trọng, kết nối giao thương hiệu quả!'),
    ('fb-02', 'EVT-PAID-2026', 'Trần Thị Mai', '0987654321', 5, 'Khâu tiếp đón và check-in rất chuyên nghiệp, mã QR mượt mà.'),
    ('fb-03', 'EVT-FREE-2026', 'Hoàng Quốc Bảo', '0977889900', 5, 'Khách đến chưa đăng ký trước nhưng được hỗ trợ check-in pass rất nhanh và lịch sự.')
  `);

  // 8. Nạp Biểu Quyết (Polls)
  console.log("8. Nạp cuộc biểu quyết & bầu cử...");
  const pollOptions = JSON.stringify([
    { id: "opt-1", label: "Đồng thuận 100% Kế hoạch Hội Khóa 2026", votes: 48 },
    { id: "opt-2", label: "Cần bổ sung thêm chuyên đề Quản trị AI", votes: 12 },
    { id: "opt-3", label: "Ý kiến khác", votes: 2 }
  ]);
  await exec(`
    INSERT INTO public.polls (id, title, description, event_id, status, options)
    VALUES (
      'POLL-CEO-2026',
      'Biểu quyết Kế hoạch Hoạt động & Mục tiêu Kết nối Giao thương CEO HN10 Năm 2026',
      'Lấy ý kiến biểu quyết toàn thể học viên trong phiên họp toàn thể sự kiện.',
      'EVT-PAID-2026',
      'active',
      '${pollOptions.replace(/'/g, "''")}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      options = EXCLUDED.options
  `);

  // Kiểm tra số lượng sự kiện sau nạp
  const count = await prisma.events.count();
  console.log(`\n🎉 NẠP DỮ LIỆU THÀNH CÔNG! Tổng số sự kiện trong DB Localhost: ${count}`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("❌ LỖI KHI NẠP DỮ LIỆU LOCAL:", err);
  process.exit(1);
});
