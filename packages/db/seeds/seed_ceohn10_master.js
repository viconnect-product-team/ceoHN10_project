const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const DB_URL = process.env.DATABASE_URL || 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project';
const ceoAssocId = 'c1983000-0000-4000-8000-000000001983';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Connected to ceohn10_project PostgreSQL database.');

  const salt = await bcrypt.genSalt(10);
  const hash123456 = await bcrypt.hash('123456', salt);

  // 1. Create or Update CEO HN10 Association
  console.log('1. Creating / Updating CEO HN10 Association...');
  await client.query(`
    INSERT INTO public.associations (
      id, name, slug, logo_url, brand_primary, tagline, about, contact_email, landing_published, public_card_enabled, created_at, updated_at
    ) VALUES (
      $1::uuid,
      'CLB Doanh Nhân CEO HN10',
      'ceohn10',
      'https://api.dicebear.com/7.x/identicon/svg?seed=CEOHN10',
      '#1E3A8A',
      'Hội tụ tinh hoa - Kết nối giá trị - Bứt phá tương lai',
      'CLB Doanh nhân CEO HN10 là tổ chức kết nối giao thương, hợp tác kinh doanh, chia sẻ tri thức và đồng hành cùng phát triển bền vững cho cộng đồng các chủ doanh nghiệp CEO Hà Nội 10 trên toàn quốc.',
      'banthuky@ceohn10.viconnect.vn',
      true,
      true,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      tagline = EXCLUDED.tagline,
      about = EXCLUDED.about,
      contact_email = EXCLUDED.contact_email,
      landing_published = true,
      public_card_enabled = true,
      updated_at = now()
  `, [ceoAssocId]);

  // 2. Ensure Admin & Core Accounts in ceohn10_project
  console.log('2. Ensuring Admin & Core Accounts in ceohn10_project...');
  const coreAccounts = [
    {
      id: '00000000-0000-4000-8000-000000000001',
      username: 'admin@viconnect.vn',
      email: 'admin@viconnect.vn',
      name: 'Super Admin CEO HN10',
      role: 'admin'
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      username: 'admin@connect.vn',
      email: 'admin@connect.vn',
      name: 'Lê Thị Dung (Admin CEO HN10)',
      role: 'admin'
    },
    {
      id: '00000000-0000-4000-8000-000000000003',
      username: 'infor@viconnect.vn',
      email: 'infor@viconnect.vn',
      name: 'Phạm Hồng Nguyên (Trưởng Ban Truyền Thông)',
      role: 'admin'
    },
    {
      id: '00000000-0000-4000-8000-000000000004',
      username: 'vumikasa6@gmail.com',
      email: 'vumikasa6@gmail.com',
      name: 'Vũ Minh Tuấn (Ban Tài Chính HN10)',
      role: 'admin'
    }
  ];

  for (const acc of coreAccounts) {
    await client.query(`
      INSERT INTO public.vione_users (id, username, email, password, name, email_verified, created_at, updated_at)
      VALUES ($1::uuid, $2, $3, $4, $5, true, now(), now())
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        name = EXCLUDED.name,
        updated_at = now()
    `, [acc.id, acc.username, acc.email, hash123456, acc.name]);

    await client.query(`
      INSERT INTO auth.users (id, email, role)
      VALUES ($1::uuid, $2, 'authenticated')
      ON CONFLICT (id) DO NOTHING
    `, [acc.id, acc.email]).catch(() => {});

    await client.query(`
      INSERT INTO public.memberships (id, user_id, association_id, role, is_default, created_at, updated_at)
      VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'admin', true, now(), now())
      ON CONFLICT DO NOTHING
    `, [acc.id, ceoAssocId]).catch(() => {});
  }

  // 3. Seed Executive & Member Roster
  console.log('3. Seeding Members with HN10-xxxx code prefix...');
  const memberList = [
    { id: 'b1000000-0000-4000-8000-000000000001', name: 'Nguyễn Văn Hùng', company: 'Hùng Phát Corp', title: 'Chủ tịch HĐQT', industry: 'Sản xuất & Thương mại', email: 'hung.nguyen@hungphat.vn', phone: '0912341001', code: 'HN10-0001', execRole: 'Chủ tịch CLB', dept: 'Ban Điều Hành' },
    { id: 'b1000000-0000-4000-8000-000000000002', name: 'Đặng Quốc Bảo', company: 'Bảo Gia Construction', title: 'Chủ tịch HĐQT', industry: 'Xây dựng & Bất động sản', email: 'bao.dang@baogiaconstruct.vn', phone: '0943191002', code: 'HN10-0002', execRole: 'Phó Chủ tịch', dept: 'Ban Điều Hành' },
    { id: 'b1000000-0000-4000-8000-000000000003', name: 'Lê Hoàng Long', company: 'Long Tech Solutions', title: 'Tổng Giám Đốc', industry: 'Công nghệ thông tin', email: 'long.le@longtech.vn', phone: '0903191003', code: 'HN10-0003', execRole: 'Tổng Thư Ký', dept: 'Ban Thư ký' },
    { id: 'b1000000-0000-4000-8000-000000000004', name: 'Trần Thị Mai Lan', company: 'Mai Lan Logistics', title: 'Tổng Giám Đốc', industry: 'Vận tải & Logistics', email: 'lan.tran@mailanlogistics.com', phone: '0983191004', code: 'HN10-0004', execRole: 'Trưởng Ban Tài Chính', dept: 'Ban Tài chính' },
    { id: 'b1000000-0000-4000-8000-000000000005', name: 'Vũ Thu Trang', company: 'Trang Media & Events', title: 'Giám đốc Điều hành', industry: 'Truyền thông & Sự kiện', email: 'trang.vu@trangmedia.vn', phone: '0933191005', code: 'HN10-0005', execRole: 'Trưởng Ban Truyền Thông', dept: 'Ban Truyền thông' },
    { id: 'b1000000-0000-4000-8000-000000000006', name: 'Phạm Đức Minh', company: 'Minh Capital Investment', title: 'Managing Partner', industry: 'Đầu tư & Tài chính', email: 'minh.pham@minhcapital.vn', phone: '0973191006', code: 'HN10-0006', execRole: 'Trưởng Ban Xúc Tiến TM', dept: 'Ban Xúc tiến thương mại' },
    { id: 'b1000000-0000-4000-8000-000000000007', name: 'Hoàng Hải Yến', company: 'Yến Ngọc Hospitality', title: 'Tổng Giám Đốc', industry: 'Du lịch & Khách sạn', email: 'yen.hoang@yenngochospitality.vn', phone: '0963191007', code: 'HN10-0007', execRole: 'Hội viên VIP', dept: 'Hội viên' },
    { id: 'b1000000-0000-4000-8000-000000000008', name: 'Bùi Anh Tuấn', company: 'Tuấn Minh Pharma', title: 'Giám đốc Phân phối', industry: 'Dược phẩm & Thiết bị Y tế', email: 'tuan.bui@tuanminhpharma.vn', phone: '0923191008', code: 'HN10-0008', execRole: 'Hội viên VIP', dept: 'Hội viên' }
  ];

  for (const m of memberList) {
    const userId = crypto.randomUUID();

    // Create user login
    await client.query(`
      INSERT INTO public.vione_users (id, username, email, password, name, email_verified, created_at, updated_at)
      VALUES ($1::uuid, $2, $3, $4, $5, true, now(), now())
      ON CONFLICT (id) DO NOTHING
    `, [userId, m.email, m.email, hash123456, m.name]).catch(() => {});

    // Create membership
    await client.query(`
      INSERT INTO public.memberships (id, user_id, association_id, role, is_default, created_at, updated_at)
      VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'member', true, now(), now())
      ON CONFLICT DO NOTHING
    `, [userId, ceoAssocId]).catch(() => {});

    // Create member profile
    await client.query(`
      INSERT INTO public.members (
        id, code, name, contact, email, phone, type, level, industry, region, status,
        avatar_url, association_id, user_id, executive_role, department, company_name, joined_at, created_at, updated_at
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, 'Doanh nghiệp', 'Kim Cương', $7, 'Hà Nội', 'active',
        $8, $9::uuid, $10::uuid, $11, $12, $13, now(), now(), now()
      )
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        company_name = EXCLUDED.company_name,
        executive_role = EXCLUDED.executive_role,
        department = EXCLUDED.department,
        updated_at = now()
    `, [
      m.id,
      m.code,
      m.name,
      m.company,
      m.email,
      m.phone,
      m.industry,
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`,
      ceoAssocId,
      userId,
      m.execRole,
      m.dept,
      m.company
    ]);
  }

  // 4. Seed Sample Event for CEO HN10
  console.log('4. Seeding Sample Events for CEO HN10...');
  await client.query(`
    INSERT INTO public.events (
      id, association_id, name, date, location, status, type, capacity, registered, qr_fields, created_at, updated_at
    ) VALUES (
      'e1000000-0000-4000-8000-000000000001'::uuid,
      $1::uuid,
      'Gặp Gỡ & Kết Nối Giao Thương CEO HN10 - Khai Xuân 2026',
      '2026-03-20',
      'Khách sạn Lotte Hotel Hanoi, 54 Liễu Giai, Ba Đình, Hà Nội',
      'upcoming',
      'offline',
      150,
      45,
      ARRAY['name', 'phone', 'company']::text[],
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      date = EXCLUDED.date,
      location = EXCLUDED.location,
      status = EXCLUDED.status,
      updated_at = now()
  `, [ceoAssocId]);

  console.log('=== SEED COMPLETED SUCCESSFULLY FOR CEOHN10 DATABASE ===');
  await client.end();
}

main().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
