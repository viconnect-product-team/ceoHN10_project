-- ═════════════════════════════════════════════════════════════════════════════════
-- SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU MÔI TRƯỜNG TEST - CLB DOANH NHÂN CEO HN10
-- CSDL Test: ceohn10_project_test (Độc lập 100% với Product: 113.20.107.184:6432)
-- ═════════════════════════════════════════════════════════════════════════════════

-- 1. Kích hoạt Extension UUID & Pgcrypto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Đảm bảo Role & User app1 có toàn quyền
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app1') THEN
    CREATE ROLE app1 WITH LOGIN PASSWORD '5^S0CEpvYwC1(#YN1UoJ' SUPERUSER CREATEDB;
  END IF;
END
$$;

-- 3. Tạo Schema public và cấp quyền
GRANT ALL ON SCHEMA public TO app1;

-- 4. Bảng app_settings (Cấu hình hệ thống & Ma trận phân quyền RBAC)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Bảng vione_users (Tài khoản người dùng & Quản trị viên)
CREATE TABLE IF NOT EXISTS public.vione_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  executive_role TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Bảng members (Hồ sơ Học viên CLB CEO HN10)
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  title TEXT,
  industry TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  membership_tier TEXT DEFAULT 'official',
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Bảng events (Danh sách sự kiện)
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  name TEXT,
  description TEXT,
  date DATE,
  time TEXT,
  location TEXT,
  venue_name TEXT,
  capacity INT DEFAULT 100,
  registered_count INT DEFAULT 0,
  ticket_price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'upcoming',
  category TEXT DEFAULT 'networking',
  qr_scanners JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Bảng event_registrations (Đăng ký vé sự kiện kèm cột động dynamic_data)
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  member_id TEXT,
  member_name TEXT NOT NULL,
  member_code TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  ticket_type TEXT DEFAULT 'VIP',
  ticket_count INT DEFAULT 1,
  seat_assignment TEXT,
  payment_status TEXT DEFAULT 'free',
  payment_amount NUMERIC DEFAULT 0,
  is_walkin BOOLEAN DEFAULT FALSE,
  registration_origin TEXT DEFAULT 'pre_registered',
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  registered_at DATE DEFAULT CURRENT_DATE,
  dynamic_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Bảng income_records (Quỹ Quản Lý Thu - Ghi nhận doanh thu vé sự kiện)
CREATE TABLE IF NOT EXISTS public.income_records (
  id TEXT PRIMARY KEY,
  code TEXT,
  date DATE DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  payer TEXT,
  description TEXT,
  payment_method TEXT DEFAULT 'sepay',
  fund_type TEXT DEFAULT 'general',
  event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Bảng event_fee_items (Mã phí động sự kiện cho SePay VietQR)
CREATE TABLE IF NOT EXISTS public.event_fee_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL,
  fee_code TEXT NOT NULL,
  fee_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dữ liệu mẫu khởi tạo cho Môi trường Test
INSERT INTO public.events (id, title, name, date, time, location, ticket_price, status)
VALUES (
  'evt-test-01',
  'Hội Thảo Giao Thương & Xúc Tiến Doanh Nghiệp CEO HN10 (TEST)',
  'Hội Thảo Giao Thương & Xúc Tiến Doanh Nghiệp CEO HN10 (TEST)',
  CURRENT_DATE + INTERVAL '7 days',
  '08:30 - 12:00',
  'Khách Sạn Daewoo Hà Nội',
  500000,
  'upcoming'
) ON CONFLICT (id) DO NOTHING;
