-- ==============================================================================
-- BẢN MIGRATION CSDL CHUẨN CEO HN10: ĐỔI TÊN TABLE vione_users THÀNH ceohn10_users
-- Máy chủ CSDL: PostgreSQL 113.20.107.184:6432 (Database: ceohn10_project)
-- Quy chuẩn: Giữ toàn vẹn 100% dữ liệu, tương thích ngược tuyệt đối (No breaking change)
-- ==============================================================================

-- 1. TẠO BẢNG ceohn10_users NẾU CHƯA TỒN TẠI
CREATE TABLE IF NOT EXISTS public.ceohn10_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    name TEXT,
    avatar_url TEXT,
    google_id TEXT UNIQUE,
    apple_id TEXT UNIQUE,
    email_verified BOOLEAN DEFAULT false,
    apple_refresh_token TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ĐỒNG BỘ TOÀN BỘ DỮ LIỆU TỪ vione_users SANG ceohn10_users (NẾU CÓ BẢNG vione_users)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'vione_users'
    ) THEN
        INSERT INTO public.ceohn10_users (
            id, username, password, email, name, avatar_url, 
            google_id, apple_id, email_verified, apple_refresh_token, 
            created_at, updated_at
        )
        SELECT 
            id, username, password, email, name, avatar_url, 
            google_id, apple_id, email_verified, apple_refresh_token, 
            created_at, updated_at
        FROM public.vione_users
        ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            email = EXCLUDED.email,
            password = EXCLUDED.password,
            name = EXCLUDED.name,
            avatar_url = EXCLUDED.avatar_url,
            google_id = EXCLUDED.google_id,
            apple_id = EXCLUDED.apple_id,
            email_verified = EXCLUDED.email_verified,
            updated_at = now();
            
        RAISE NOTICE 'Đã đồng bộ thành công dữ liệu từ vione_users sang ceohn10_users!';
    END IF;
END $$;

-- 3. TẠO VIEW TƯƠNG THÍCH NGƯỢC (ALIAS) CHO vione_users NẾU CẦN THIẾT
-- Để đảm bảo mọi câu query cũ hoặc script của bên thứ ba không bao giờ bị lỗi
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'vione_users'
    ) THEN
        CREATE OR REPLACE VIEW public.vione_users AS 
        SELECT * FROM public.ceohn10_users;
        RAISE NOTICE 'Đã tạo VIEW alias public.vione_users trỏ về public.ceohn10_users';
    END IF;
END $$;

-- 4. TẠO CHỈ MỤC TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_ceohn10_users_email ON public.ceohn10_users(email);
CREATE INDEX IF NOT EXISTS idx_ceohn10_users_username ON public.ceohn10_users(username);
CREATE INDEX IF NOT EXISTS idx_ceohn10_users_created_at ON public.ceohn10_users(created_at DESC);
