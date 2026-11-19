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

  // 1. Thêm cột checked_out_at, registered_by, fee_items vào public.event_registrations
  await client.query(`
    ALTER TABLE public.event_registrations 
    ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS registered_by TEXT,
    ADD COLUMN IF NOT EXISTS fee_items JSONB DEFAULT '[]'::jsonb;
  `);
  console.log('Updated public.event_registrations with checked_out_at, registered_by, fee_items');

  // 2. Bảng public.event_fee_items: Cấu hình mã phí động cho sự kiện / khai giảng
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.event_fee_items (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      fee_code TEXT NOT NULL,
      fee_name TEXT NOT NULL,
      amount NUMERIC NOT NULL DEFAULT 0,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_event_fee_items_event_id ON public.event_fee_items(event_id);
    CREATE INDEX IF NOT EXISTS idx_event_fee_items_code ON public.event_fee_items(fee_code);
  `);
  console.log('Created / verified table public.event_fee_items');

  // 3. Đảm bảo trường code trong public.members có chỉ mục tìm kiếm nhanh
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_members_code_search ON public.members(code);
  `);
  console.log('Created index on public.members(code)');

  await client.end();
  console.log('Migration completed successfully!');
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
