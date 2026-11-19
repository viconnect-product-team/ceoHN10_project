const { Client } = require('pg');

const client = new Client({
  host: '113.20.107.184',
  port: 6432,
  user: 'app1',
  password: '5^S0CEpvYwC1(#YN1UoJ',
  database: 'ceohn10_project',
  ssl: false,
});

async function migrate() {
  await client.connect();
  console.log('Connected to PostgreSQL 113.20.107.184:6432');

  // 1. Bảng Dynamic Form Schemas & Fields (Phục vụ tùy biến form popup động)
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.dynamic_form_schemas (
      id TEXT PRIMARY KEY,
      entity_type TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.dynamic_form_fields (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      field_key TEXT NOT NULL,
      field_label TEXT NOT NULL,
      field_type TEXT NOT NULL DEFAULT 'text',
      placeholder TEXT,
      options JSONB DEFAULT '[]'::jsonb,
      is_required BOOLEAN DEFAULT false,
      is_enabled BOOLEAN DEFAULT true,
      display_order INTEGER DEFAULT 0,
      width_col TEXT DEFAULT 'col-span-1',
      is_system_field BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_dynamic_form_fields UNIQUE (entity_type, field_key)
    );

    CREATE INDEX IF NOT EXISTS idx_dynamic_form_fields_entity ON public.dynamic_form_fields(entity_type);
  `);
  console.log('Created dynamic_form_schemas and dynamic_form_fields tables.');

  // 2. Bảng Báo Cáo Tài Chính 1 Bảng Duy Nhất (Hỗ trợ thêm cột trực tiếp trên UI tự sync DB)
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.financial_report_columns (
      id TEXT PRIMARY KEY,
      column_key TEXT UNIQUE NOT NULL,
      column_label TEXT NOT NULL,
      data_type TEXT NOT NULL DEFAULT 'currency', -- 'currency', 'text', 'number', 'date', 'select'
      display_order INTEGER DEFAULT 0,
      is_system BOOLEAN DEFAULT false,
      is_visible BOOLEAN DEFAULT true,
      options JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.financial_report_rows (
      id TEXT PRIMARY KEY,
      row_code TEXT UNIQUE,
      title TEXT NOT NULL,
      transaction_date DATE DEFAULT CURRENT_DATE,
      category TEXT,
      type TEXT DEFAULT 'income', -- 'income' (thu), 'expense' (chi)
      amount NUMERIC(18, 2) DEFAULT 0,
      custom_data JSONB DEFAULT '{}'::jsonb,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_fin_report_rows_date ON public.financial_report_rows(transaction_date);
  `);
  console.log('Created financial_report_columns and financial_report_rows tables.');

  // 3. Khởi tạo cấu hình Sepay & Cài đặt hệ thống Master
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.master_system_settings (
      key TEXT PRIMARY KEY,
      category TEXT NOT NULL DEFAULT 'general',
      value JSONB NOT NULL,
      description TEXT,
      updated_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Seed cấu hình Sepay dynamic nếu chưa có
    INSERT INTO public.master_system_settings (key, category, value, description)
    VALUES (
      'sepay_integration_config',
      'payment_gateway',
      '{
        "is_enabled": true,
        "api_url": "https://my.sepay.vn/userapi",
        "api_token": "",
        "webhook_url": "https://crm.ceohn10.viconnect.vn/api/payments/sepay-webhook",
        "webhook_secret_key": "",
        "bank_name": "Vietcombank",
        "bank_account_number": "1019838888",
        "bank_account_holder": "CLB DOANH NHAN CEO HN10",
        "transfer_prefix": "CEOHN10",
        "auto_confirm_order": true,
        "auto_activate_member": true,
        "auto_checkin_event": false,
        "supported_apps": ["crm_ceohn10", "mobile_app_ceohn10"]
      }'::jsonb,
      'Cấu hình cổng thanh toán Sepay dynamic cho toàn bộ các nền tảng phần mềm CEOHN10'
    )
    ON CONFLICT (key) DO NOTHING;

    -- Seed danh mục các nền tảng phần mềm Master Admin
    INSERT INTO public.master_system_settings (key, category, value, description)
    VALUES (
      'master_platforms_catalog',
      'platforms',
      '[
        {
          "id": "crm_ceohn10",
          "name": "Hệ thống CRM CEOHN10",
          "code": "CEOHN10-CRM",
          "type": "crm",
          "status": "online",
          "domain": "crm.ceohn10.viconnect.vn",
          "route": "/",
          "description": "Cổng Quản trị Vận hành Toàn diện Học viên, Sự kiện, Lớp học, Tài chính CLB",
          "icon": "LayoutDashboard",
          "version": "v12.39"
        },
        {
          "id": "mobile_app_ceohn10",
          "name": "App Mobile CEOHN10",
          "code": "CEOHN10-APP",
          "type": "mobile",
          "status": "online",
          "domain": "ceohn10.viconnect.vn",
          "route": "/association",
          "description": "Ứng dụng Di động Hội viên CEO HN10: Danh thiếp, Kết nối B2B, Check-in",
          "icon": "Smartphone",
          "version": "v3.2"
        }
      ]'::jsonb,
      'Danh sách các phần mềm, app nền tảng thuộc hệ sinh thái CEOHN10'
    )
    ON CONFLICT (key) DO NOTHING;
  `);
  console.log('Created master_system_settings table and seeded Sepay & platforms configs.');

  // 4. Seed default dynamic fields cho form Học Viên (members)
  const defaultMemberFields = [
    { key: 'name', label: 'Họ và Tên', type: 'text', required: true, order: 1, width: 'col-span-1', is_sys: true },
    { key: 'code', label: 'Mã Học Viên / Code', type: 'text', required: true, order: 2, width: 'col-span-1', is_sys: true },
    { key: 'email', label: 'Email Đăng Nhập', type: 'email', required: true, order: 3, width: 'col-span-1', is_sys: true },
    { key: 'phone', label: 'Số Điện Thoại', type: 'tel', required: false, order: 4, width: 'col-span-1', is_sys: true },
    { key: 'company_name', label: 'Công Ty / Doanh Nghiệp', type: 'text', required: false, order: 5, width: 'col-span-2', is_sys: true },
    { key: 'department', label: 'Ban Chuyên Môn', type: 'select', required: true, order: 6, width: 'col-span-1', is_sys: true,
      options: [
        { label: 'Ban Điều Hành', value: 'Ban Điều Hành' },
        { label: 'Ban Thư Ký', value: 'Ban Thư Ký' },
        { label: 'Ban Xúc Tiến Thương Mại', value: 'Ban Xúc Tiến Thương Mại' },
        { label: 'Ban Truyền Thông & Sự Kiện', value: 'Ban Truyền Thông & Sự Kiện' },
        { label: 'Ban Đào Tạo & Khai Giảng', value: 'Ban Đào Tạo & Khai Giảng' },
        { label: 'Ban Tài Chính & Kế Toán', value: 'Ban Tài Chính & Kế Toán' },
        { label: 'Học viên ceohn10', value: 'Học viên ceohn10' }
      ]
    },
    { key: 'executive_role', label: 'Vai Trò Hệ Thống', type: 'select', required: true, order: 7, width: 'col-span-1', is_sys: true,
      options: [
        { label: 'Học viên', value: 'member' },
        { label: 'Trưởng Ban', value: 'truong_ban' },
        { label: 'Phó Ban', value: 'pho_ban' },
        { label: 'Kế toán', value: 'ke_toan' },
        { label: 'Thư ký', value: 'ban_thu_ky' },
        { label: 'Tổng Thư Ký', value: 'tong_thu_ky' },
        { label: 'Ban Điều Hành', value: 'ban_dieu_hanh' },
        { label: 'Chủ tịch', value: 'chu_tich' },
        { label: 'Quản trị viên', value: 'admin' }
      ]
    },
    { key: 'industry', label: 'Ngành Nghề Kinh Doanh', type: 'text', required: false, order: 8, width: 'col-span-1', is_sys: false },
    { key: 'address', label: 'Địa Chỉ Doanh Nghiệp', type: 'textarea', required: false, order: 9, width: 'col-span-2', is_sys: false },
    { key: 'bio', label: 'Giới Thiệu Bản Thân & Nhu Cầu Kết Nối', type: 'textarea', required: false, order: 10, width: 'col-span-2', is_sys: false },
  ];

  await client.query(`
    INSERT INTO public.dynamic_form_schemas (id, entity_type, title, description)
    VALUES ('schema_members', 'members', 'Form Học Viên CEOHN10', 'Cấu hình trường động cho popup thêm mới và chỉnh sửa Học viên')
    ON CONFLICT (entity_type) DO NOTHING;
  `);

  for (const f of defaultMemberFields) {
    await client.query(`
      INSERT INTO public.dynamic_form_fields (
        id, entity_type, field_key, field_label, field_type, placeholder, options, is_required, is_enabled, display_order, width_col, is_system_field
      ) VALUES (
        $1, 'members', $2, $3, $4, $5, $6::jsonb, $7, true, $8, $9, $10
      )
      ON CONFLICT (entity_type, field_key) DO UPDATE SET
        field_label = EXCLUDED.field_label,
        field_type = EXCLUDED.field_type,
        options = EXCLUDED.options,
        is_required = EXCLUDED.is_required,
        display_order = EXCLUDED.display_order,
        width_col = EXCLUDED.width_col;
    `, [
      `fld_mem_${f.key}`,
      f.key,
      f.label,
      f.type,
      `Nhập ${f.label.toLowerCase()}...`,
      JSON.stringify(f.options || []),
      f.required,
      f.order,
      f.width,
      f.is_sys
    ]);
  }
  console.log('Seeded default dynamic fields for members.');

  // 5. Seed default columns cho Báo cáo tài chính
  const defaultFinCols = [
    { key: 'transaction_date', label: 'Ngày Giao Dịch', type: 'date', order: 1, is_sys: true },
    { key: 'row_code', label: 'Mã Giao Dịch / Chứng Từ', type: 'text', order: 2, is_sys: true },
    { key: 'title', label: 'Khoản Thu / Chi (Nội dung)', type: 'text', order: 3, is_sys: true },
    { key: 'category', label: 'Khoản Mục', type: 'select', order: 4, is_sys: true,
      options: [
        { label: 'Niên liễm / Học phí', value: 'hoc_phi' },
        { label: 'Tài trợ sự kiện', value: 'tai_tro' },
        { label: 'Chi thuê hội trường', value: 'hoi_truong' },
        { label: 'Chi tiệc Gala & Teabreak', value: 'tiec_gala' },
        { label: 'Chi marketing & Quà tặng', value: 'marketing' },
        { label: 'Khác', value: 'khac' }
      ]
    },
    { key: 'type', label: 'Loại Dòng Tiền', type: 'select', order: 5, is_sys: true,
      options: [
        { label: 'Thu (+)', value: 'income' },
        { label: 'Chi (-)', value: 'expense' }
      ]
    },
    { key: 'amount', label: 'Số Tiền (VNĐ)', type: 'currency', order: 6, is_sys: true },
    { key: 'payer_recipient', label: 'Người Nộp / Đơn Vị Thụ Hưởng', type: 'text', order: 7, is_sys: false },
    { key: 'payment_method', label: 'Hình Thức Thanh Toán', type: 'select', order: 8, is_sys: false,
      options: [
        { label: 'Chuyển khoản Sepay/Ngân hàng', value: 'bank' },
        { label: 'Tiền mặt', value: 'cash' },
        { label: 'Ví điện tử', value: 'ewallet' }
      ]
    },
    { key: 'notes', label: 'Ghi Chú', type: 'text', order: 9, is_sys: false },
  ];

  for (const c of defaultFinCols) {
    await client.query(`
      INSERT INTO public.financial_report_columns (
        id, column_key, column_label, data_type, display_order, is_system, is_visible, options
      ) VALUES (
        $1, $2, $3, $4, $5, $6, true, $7::jsonb
      )
      ON CONFLICT (column_key) DO UPDATE SET
        column_label = EXCLUDED.column_label,
        data_type = EXCLUDED.data_type,
        display_order = EXCLUDED.display_order,
        options = EXCLUDED.options;
    `, [
      `col_${c.key}`,
      c.key,
      c.label,
      c.type,
      c.order,
      c.is_sys,
      JSON.stringify(c.options || [])
    ]);
  }
  console.log('Seeded default financial report columns.');

  // 6. Seed sample rows from existing transactions into financial_report_rows if empty
  const countRes = await client.query('SELECT count(*) FROM public.financial_report_rows');
  if (parseInt(countRes.rows[0].count) === 0) {
    const txRows = await client.query('SELECT * FROM public.transactions ORDER BY date DESC LIMIT 20').catch(() => ({ rows: [] }));
    if (txRows.rows.length > 0) {
      for (const tx of txRows.rows) {
        await client.query(`
          INSERT INTO public.financial_report_rows (
            id, row_code, title, transaction_date, category, type, amount, custom_data, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
          ON CONFLICT (id) DO NOTHING;
        `, [
          tx.id,
          tx.code || `TX-${tx.id.slice(0, 8)}`,
          tx.description || 'Giao dịch tài chính',
          tx.date,
          tx.category || 'hoc_phi',
          tx.type || 'income',
          tx.amount || 0,
          JSON.stringify({
            payer_recipient: tx.recipient || '',
            payment_method: tx.method || 'bank'
          }),
          tx.metadata?.note || ''
        ]);
      }
    }
  }

  await client.end();
  console.log('Migration completed successfully on PostgreSQL 113.20.107.184:6432!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
