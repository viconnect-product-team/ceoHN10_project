-- ==============================================================================
-- QUY CHUẨN ĐỒNG BỘ 100% CSDL SANG ĐỊNH DẠNG UID / UUID
-- Database: 113.20.107.184:6432/ceohn10_project (PgBouncer, user app1)
-- ==============================================================================

-- 1. Bật extension sinh UUID chuẩn PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Đảm bảo các bảng sự kiện (Events, Registrations, Tickets) có default gen_random_uuid()
DO $$
BEGIN
    -- Bảng events
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'id') THEN
        ALTER TABLE public.events ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    END IF;

    -- Bảng event_registrations
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'id') THEN
        ALTER TABLE public.event_registrations ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    END IF;

    -- Bảng event_ticket_types
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_ticket_types' AND column_name = 'id') THEN
        ALTER TABLE public.event_ticket_types ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    END IF;

    -- Bảng event_photos
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_photos' AND column_name = 'id') THEN
        ALTER TABLE public.event_photos ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    END IF;

    -- Bảng event_feedback
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_feedback' AND column_name = 'id') THEN
        ALTER TABLE public.event_feedback ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    END IF;
    
    -- Bảng income_records (Quỹ tài chính CRM)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_records' AND column_name = 'id') THEN
        ALTER TABLE public.income_records ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    END IF;
END $$;

-- 3. Tạo chỉ mục tìm kiếm tối ưu cho ID dạng UID
CREATE INDEX IF NOT EXISTS idx_events_uid ON public.events(id);
CREATE INDEX IF NOT EXISTS idx_event_reg_uid ON public.event_registrations(id);
CREATE INDEX IF NOT EXISTS idx_event_reg_event_uid ON public.event_registrations(event_id);
