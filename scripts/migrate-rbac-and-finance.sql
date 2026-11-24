-- ============================================================================
-- MIGRATION SCRIPT: RBAC ĐA CẤP, SCOPE-BASED ROLE ASSIGNMENTS, 
-- KHỞI TẠO TÀI CHÍNH (OPENING BALANCE 2.1 TỶ), ĐIỀU CHUYỂN 20M & SEPAY WEBHOOK
-- ============================================================================

-- 1. BẢNG DANH MỤC VAI TRÒ (ROLES)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    role_type VARCHAR(30) DEFAULT 'ORGANIZATIONAL', -- 'SYSTEM', 'ORGANIZATIONAL', 'PARTICIPANT'
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG DANH MỤC QUYỀN HẠN (PERMISSIONS: module.action)
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG QUAN HỆ VAI TRÒ - QUYỀN HẠN (ROLE_PERMISSIONS)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

-- 4. BẢNG PHÂN CÔNG CHỨC VỤ THEO PHẠM VI (USER_ROLE_ASSIGNMENTS - SCOPE BASED)
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    organization_id VARCHAR(50) DEFAULT 'ceohn10',
    scope_type VARCHAR(30) NOT NULL, -- 'PLATFORM', 'ORGANIZATION', 'CLASS', 'TEAM', 'COMMITTEE', 'SELF'
    scope_id VARCHAR(100) NOT NULL,   -- 'all', 'K01', 'team_alpha', 'dept_tc', or userId
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'revoked'
    assigned_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ura_user_status ON public.user_role_assignments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ura_scope ON public.user_role_assignments(scope_type, scope_id);

-- 5. BẢNG NHẬT KÝ QUẢN TRỊ & PHÂN QUYỀN (RBAC_AUDIT_LOGS)
CREATE TABLE IF NOT EXISTS public.rbac_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'USER', 'ROLE', 'ASSIGNMENT', 'PERMISSION', 'FINANCE'
    target_id VARCHAR(100),
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG DANH MỤC CÁC QUỸ TÀI CHÍNH (FINANCIAL_FUNDS)
CREATE TABLE IF NOT EXISTS public.financial_funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    fund_type VARCHAR(30) DEFAULT 'GENERAL', -- 'GENERAL', 'COMMITTEE', 'SPONSORSHIP', 'CHARITY'
    description TEXT,
    current_balance BIGINT DEFAULT 0,
    physical_items_balance JSONB DEFAULT '[]'::jsonb, -- Quản lý hiện vật tài trợ riêng biệt
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BẢNG QUẢN LÝ ĐA TÀI KHOẢN NGÂN HÀNG (BANK_ACCOUNTS)
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID REFERENCES public.financial_funds(id) ON DELETE SET NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_holder VARCHAR(150) NOT NULL,
    sepay_account_id VARCHAR(100),
    qr_template VARCHAR(50) DEFAULT 'compact2',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BẢNG KỲ KHỞI TẠO SỐ DƯ ĐẦU KỲ (FINANCIAL_OPENING_BALANCES: 2.1 TỶ)
CREATE TABLE IF NOT EXISTS public.financial_opening_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_code VARCHAR(50) UNIQUE NOT NULL,
    total_amount BIGINT DEFAULT 2100000000, -- 2.1 tỷ đồng
    status VARCHAR(30) DEFAULT 'DRAFT',     -- 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'POSTED'
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_by UUID,
    approved_by UUID,
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BẢNG CHI TIẾT PHÂN BỔ SỐ DƯ ĐẦU KỲ THEO QUỸ (FINANCIAL_OPENING_BALANCE_ITEMS)
CREATE TABLE IF NOT EXISTS public.financial_opening_balance_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opening_balance_id UUID NOT NULL REFERENCES public.financial_opening_balances(id) ON DELETE CASCADE,
    fund_id UUID NOT NULL REFERENCES public.financial_funds(id) ON DELETE RESTRICT,
    allocated_amount BIGINT NOT NULL DEFAULT 0,
    notes TEXT,
    CONSTRAINT uq_ob_fund UNIQUE (opening_balance_id, fund_id)
);

-- 10. BẢNG ĐIỀU CHUYỂN NỘI BỘ GIỮA CÁC QUỸ (FINANCIAL_TRANSFERS - KHOẢN 20M BAN CÔNG NGHỆ)
CREATE TABLE IF NOT EXISTS public.financial_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id VARCHAR(50) UNIQUE NOT NULL,
    source_fund_id UUID NOT NULL REFERENCES public.financial_funds(id),
    destination_fund_id UUID NOT NULL REFERENCES public.financial_funds(id),
    amount BIGINT NOT NULL,
    description TEXT NOT NULL,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'COMPLETED', -- 'PENDING', 'COMPLETED', 'REJECTED'
    created_by UUID,
    source_voucher_no VARCHAR(50),
    dest_voucher_no VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BẢNG LƯU TRỮ VÀ XÁC THỰC WEBHOOK SEPAY (SEPAY_WEBHOOK_EVENTS)
CREATE TABLE IF NOT EXISTS public.sepay_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway_transaction_id VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_brand_name VARCHAR(50),
    transfer_type VARCHAR(10) DEFAULT 'in', -- 'in' (tiền vào) hoặc 'out' (tiền ra)
    transfer_amount BIGINT NOT NULL DEFAULT 0,
    transaction_date TIMESTAMPTZ,
    content TEXT,
    reference_number VARCHAR(100),
    signature TEXT,
    status VARCHAR(30) DEFAULT 'RECEIVED', -- 'RECEIVED', 'AUTHENTICATED', 'DUPLICATE', 'PENDING_RECONCILIATION', 'MATCHED', 'POSTED', 'FAILED', 'REVERSED'
    fund_id UUID REFERENCES public.financial_funds(id),
    matched_order_id VARCHAR(100),
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_sepay_gateway_bank UNIQUE (gateway_transaction_id, bank_account_number)
);

CREATE INDEX IF NOT EXISTS idx_sepay_status ON public.sepay_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_sepay_bank_acc ON public.sepay_webhook_events(bank_account_number);

-- 12. BẢNG ĐỐI SOÁT NGÂN HÀNG (BANK_RECONCILIATIONS)
CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_code VARCHAR(50) UNIQUE NOT NULL,
    bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
    period_from DATE NOT NULL,
    period_to DATE NOT NULL,
    opening_balance BIGINT NOT NULL DEFAULT 0,
    closing_balance BIGINT NOT NULL DEFAULT 0,
    total_in BIGINT NOT NULL DEFAULT 0,
    total_out BIGINT NOT NULL DEFAULT 0,
    difference BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'RECONCILED', -- 'DRAFT', 'RECONCILED', 'APPROVED'
    matched_count INT DEFAULT 0,
    unmatched_count INT DEFAULT 0,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SEEDING DỮ LIỆU BAN ĐẦU: 15 VAI TRÒ CHUẨN CEO HN10
-- ============================================================================
INSERT INTO public.roles (code, name, description, role_type, is_system, is_active)
VALUES
    ('ADMIN_PLATFORM', 'Admin Platform', 'Quản trị viên toàn bộ nền tảng hệ sinh thái CEO HN10', 'SYSTEM', TRUE, TRUE),
    ('ADMIN', 'Admin Tổ Chức', 'Quản trị viên cấp CLB Doanh Nhân CEO HN10', 'ORGANIZATIONAL', TRUE, TRUE),
    ('LOP_TRUONG', 'Lớp Trưởng', 'Lớp trưởng Ban Cán sự lớp doanh nhân CEO HN10', 'ORGANIZATIONAL', FALSE, TRUE),
    ('LOP_PHO', 'Lớp Phó', 'Lớp phó phụ trách các ban điều hành lâm thời', 'ORGANIZATIONAL', FALSE, TRUE),
    ('TRUONG_TEAM', 'Trưởng Team', 'Trưởng nhóm/team kết nối giao thương trong lớp', 'ORGANIZATIONAL', FALSE, TRUE),
    ('PHO_TEAM', 'Phó Team', 'Phó nhóm/team hỗ trợ quản lý thành viên', 'ORGANIZATIONAL', FALSE, TRUE),
    ('TRUONG_BAN_HOC_TAP', 'Trưởng Ban Học Tập', 'Phụ trách đào tạo, học liệu, chuyên đề lớp', 'ORGANIZATIONAL', FALSE, TRUE),
    ('TRUONG_BAN_TRUYEN_THONG', 'Trưởng Ban Truyền Thông', 'Phụ trách tin tức, truyền thông, hình ảnh sự kiện', 'ORGANIZATIONAL', FALSE, TRUE),
    ('TRUONG_BAN_SU_KIEN_HAU_CAN', 'Trưởng Ban Sự Kiện & Hậu Cần', 'Phụ trách tổ chức sự kiện, gala, hậu cần', 'ORGANIZATIONAL', FALSE, TRUE),
    ('TRUONG_BAN_TAI_CHINH', 'Trưởng Ban Tài Chính', 'Phụ trách quản lý quỹ, thu chi, đối soát tài chính', 'ORGANIZATIONAL', FALSE, TRUE),
    ('TRUONG_BAN_THIEN_NGUYEN', 'Trưởng Ban Thiện Nguyện', 'Phụ trách an sinh xã hội, gây quỹ thiện nguyện', 'ORGANIZATIONAL', FALSE, TRUE),
    ('TRUONG_BAN_DOI_NOI', 'Trưởng Ban Đối Ngoại', 'Phụ trách đối ngoại, kết nối B2B và xúc tiến thương mại', 'ORGANIZATIONAL', FALSE, TRUE),
    ('TRUONG_BAN_DOI_SONG_XA_HOI', 'Trưởng Ban Đời Sống & Xã Hội', 'Phụ trách chăm lo đời sống, sinh nhật, gắn kết thành viên', 'ORGANIZATIONAL', FALSE, TRUE),
    ('GIANG_VIEN', 'Giảng Viên / Chuyên Gia', 'Giảng viên chuyên gia giảng dạy các khóa học CEO HN10', 'PARTICIPANT', FALSE, TRUE),
    ('HOC_VIEN', 'Học Viên / Hội Viên', 'Học viên doanh nhân chính thức của CEO HN10', 'PARTICIPANT', FALSE, TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    role_type = EXCLUDED.role_type,
    updated_at = NOW();

-- ============================================================================
-- SEEDING DỮ LIỆU BAN ĐẦU: QUYỀN HẠN PERMISSIONS (module.action)
-- ============================================================================
INSERT INTO public.permissions (code, name, module, action, description)
VALUES
    -- Module: Học viên (student)
    ('student.view', 'Xem danh sách học viên', 'student', 'view', 'Xem danh bạ và thông tin học viên trong phạm vi'),
    ('student.create', 'Tạo học viên mới', 'student', 'create', 'Thêm học viên mới vào hệ thống hoặc lớp'),
    ('student.update', 'Chỉnh sửa học viên', 'student', 'update', 'Cập nhật thông tin học viên'),
    ('student.delete', 'Xóa học viên', 'student', 'delete', 'Xóa hoặc lưu trữ học viên'),
    ('student.export', 'Xuất Excel danh sách học viên', 'student', 'export', 'Xuất dữ liệu học viên ra file Excel'),
    ('student.import', 'Nhập danh sách học viên từ file', 'student', 'import', 'Nhập danh sách học viên từ Word/Excel/PDF'),
    
    -- Module: Điểm danh (attendance)
    ('attendance.view', 'Xem điểm danh lớp học', 'attendance', 'view', 'Xem nhật ký và tỷ lệ chuyên cần'),
    ('attendance.record', 'Thực hiện điểm danh', 'attendance', 'record', 'Quét mã hoặc điểm danh học viên vào lớp'),
    ('attendance.approve', 'Phê duyệt điểm danh', 'attendance', 'approve', 'Xác nhận bảng điểm danh lớp học'),
    
    -- Module: Sự kiện (event)
    ('event.view', 'Xem danh sách sự kiện', 'event', 'view', 'Xem các sự kiện và chi tiết chương trình'),
    ('event.create', 'Tạo mới sự kiện', 'event', 'create', 'Tạo sự kiện mới có phí hoặc miễn phí'),
    ('event.update', 'Cập nhật sự kiện', 'event', 'update', 'Chỉnh sửa thông tin, địa điểm, lịch trình sự kiện'),
    ('event.delete', 'Xóa sự kiện', 'event', 'delete', 'Hủy hoặc xóa sự kiện'),
    ('event.checkin', 'Quét QR Check-in & Check-out', 'event', 'checkin', 'Quét mã vé đón tiếp đại biểu vào cửa và ra về'),
    ('event.feedback.view', 'Xem phản hồi sự kiện', 'event', 'view_feedback', 'Xem đánh giá khảo sát của đại biểu sau sự kiện'),
    
    -- Module: Tài chính & Quỹ (finance)
    ('finance.view', 'Xem sổ quỹ và báo cáo thu chi', 'finance', 'view', 'Xem báo cáo tài chính trong phạm vi được giao'),
    ('finance.create', 'Lập phiếu thu / phiếu chi', 'finance', 'create', 'Thêm mới giao dịch thu chi'),
    ('finance.update', 'Cập nhật phiếu tài chính', 'finance', 'update', 'Chỉnh sửa phiếu thu chi chưa chốt'),
    ('finance.approve', 'Phê duyệt chi tiêu tài chính', 'finance', 'approve', 'Duyệt các khoản chi và tạm ứng ngân sách'),
    ('finance.export', 'Xuất báo cáo tài chính', 'finance', 'export', 'Xuất báo cáo tài chính ra Excel/PDF'),
    
    -- Module: Khởi tạo số dư & Ngân hàng (financial)
    ('financial.opening_balance.view', 'Xem số dư đầu kỳ', 'financial', 'view_opening_balance', 'Xem bảng khởi tạo số dư đầu kỳ 2.1 tỷ'),
    ('financial.opening_balance.manage', 'Quản lý số dư đầu kỳ', 'financial', 'manage_opening_balance', 'Nhập và phân bổ số dư các quỹ'),
    ('financial.opening_balance.approve', 'Phê duyệt số dư đầu kỳ', 'financial', 'approve_opening_balance', 'Phê duyệt số dư đầu kỳ'),
    ('financial.opening_balance.post', 'Chốt sổ số dư đầu kỳ (POST)', 'financial', 'post_opening_balance', 'Ghi sổ chính thức số dư đầu kỳ'),
    ('financial.transfer.create', 'Điều chuyển nội bộ giữa các quỹ', 'financial', 'create_transfer', 'Lập lệnh chuyển tiền giữa các quỹ (VD: 20 triệu)'),
    ('financial.bank_account.manage', 'Quản lý tài khoản ngân hàng', 'financial', 'manage_bank_account', 'Thêm và cấu hình tài khoản ngân hàng gắn quỹ'),
    ('financial.bank_reconciliation.manage', 'Đối soát tài khoản ngân hàng', 'financial', 'reconciliation', 'Đối chiếu sổ quỹ với giao dịch SePay'),
    ('financial.sepay_config.manage', 'Cấu hình tích hợp SePay', 'financial', 'manage_sepay', 'Cấu hình Token, Webhook và Bank accounts'),
    
    -- Module: Tài khoản & Phân quyền (account & role)
    ('account.view', 'Xem danh sách tài khoản', 'account', 'view', 'Xem danh sách người dùng và trạng thái'),
    ('account.create', 'Tạo tài khoản người dùng', 'account', 'create', 'Tạo tài khoản mới bằng Email hoặc Mã học viên'),
    ('account.update', 'Cập nhật tài khoản', 'account', 'update', 'Sửa thông tin tài khoản người dùng'),
    ('account.lock', 'Khóa / Mở khóa tài khoản', 'account', 'lock', 'Tạm khóa hoặc kích hoạt lại tài khoản'),
    ('account.reset_password', 'Đặt lại mật khẩu tài khoản', 'account', 'reset_password', 'Cấp lại mật khẩu khởi tạo cho người dùng'),
    ('role_assignment.view', 'Xem phân công chức vụ', 'role_assignment', 'view', 'Xem lịch sử và danh sách gán chức vụ'),
    ('role_assignment.create', 'Gán chức vụ cho người dùng', 'role_assignment', 'create', 'Bổ nhiệm vai trò theo Scope cụ thể'),
    ('role_assignment.revoke', 'Thu hồi chức vụ', 'role_assignment', 'revoke', 'Thu hồi hoặc chấm dứt chức vụ trước thời hạn'),
    ('permission.manage', 'Quản trị vai trò & quyền hạn', 'permission', 'manage', 'Cấu hình ma trận quyền và danh mục Role'),
    ('audit_log.view', 'Xem nhật ký kiểm toán hệ thống', 'audit_log', 'view', 'Theo dõi Audit Log toàn bộ thao tác quản trị')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEEDING DỮ LIỆU BAN ĐẦU: CÁC QUỸ TÀI CHÍNH CHUẨN CEO HN10
-- ============================================================================
INSERT INTO public.financial_funds (code, name, fund_type, description, current_balance)
VALUES
    ('FUND_GENERAL', 'Quỹ Tổng CEO HN10', 'GENERAL', 'Quỹ tài chính tổng hợp toàn bộ hoạt động CLB Doanh Nhân CEO HN10', 1480000000),
    ('FUND_TECH', 'Quỹ Ban Công Nghệ', 'COMMITTEE', 'Quỹ chuyên trách hoạt động chuyển đổi số và công nghệ (Đã nhận 20M chuyển khoản)', 220000000),
    ('FUND_TRAINING', 'Quỹ Ban Học Tập & Đào Tạo', 'COMMITTEE', 'Quỹ phục vụ học liệu, giảng viên, khóa học và chuyên đề doanh nhân', 150000000),
    ('FUND_EVENTS', 'Quỹ Ban Sự Kiện & Hậu Cần', 'COMMITTEE', 'Quỹ tổ chức sự kiện, hội thảo, gala và chương trình xúc tiến', 150000000),
    ('FUND_SPONSOR', 'Quỹ Tài Trợ & Thiện Nguyện', 'SPONSORSHIP', 'Quỹ tiếp nhận tài trợ doanh nghiệp và các chương trình thiện nguyện cộng đồng', 100000000)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    fund_type = EXCLUDED.fund_type;

-- ============================================================================
-- SEEDING DỮ LIỆU BAN ĐẦU: TÀI KHOẢN NGÂN HÀNG KẾT NỐI QUỸ & SEPAY
-- ============================================================================
INSERT INTO public.bank_accounts (fund_id, bank_name, account_number, account_holder, sepay_account_id, is_active, is_default)
SELECT 
    f.id,
    'Vietcombank',
    '101010202688',
    'CLB DOANH NHAN CEO HN10 - QUY TONG',
    'SP_ACC_HN10_VCB_01',
    TRUE,
    TRUE
FROM public.financial_funds f WHERE f.code = 'FUND_GENERAL'
ON CONFLICT (account_number) DO NOTHING;

INSERT INTO public.bank_accounts (fund_id, bank_name, account_number, account_holder, sepay_account_id, is_active, is_default)
SELECT 
    f.id,
    'MBBank',
    '888809012026',
    'CLB DOANH NHAN CEO HN10 - BAN CONG NGHE',
    'SP_ACC_HN10_MB_TECH',
    TRUE,
    FALSE
FROM public.financial_funds f WHERE f.code = 'FUND_TECH'
ON CONFLICT (account_number) DO NOTHING;

-- ============================================================================
-- SEEDING DỮ LIỆU: KỲ SỐ DƯ ĐẦU KỲ 2.1 TỶ ĐỒNG (OPENING BALANCE - POSTED)
-- ============================================================================
DO $$
DECLARE
    v_ob_id UUID;
    v_fund_gen UUID;
    v_fund_tech UUID;
    v_fund_train UUID;
    v_fund_event UUID;
    v_fund_spon UUID;
BEGIN
    SELECT id INTO v_fund_gen FROM public.financial_funds WHERE code = 'FUND_GENERAL' LIMIT 1;
    SELECT id INTO v_fund_tech FROM public.financial_funds WHERE code = 'FUND_TECH' LIMIT 1;
    SELECT id INTO v_fund_train FROM public.financial_funds WHERE code = 'FUND_TRAINING' LIMIT 1;
    SELECT id INTO v_fund_event FROM public.financial_funds WHERE code = 'FUND_EVENTS' LIMIT 1;
    SELECT id INTO v_fund_spon FROM public.financial_funds WHERE code = 'FUND_SPONSOR' LIMIT 1;

    INSERT INTO public.financial_opening_balances (
        period_code, total_amount, status, notes, posted_at
    ) VALUES (
        'OB_2026_INITIAL',
        2100000000,
        'POSTED',
        'Khởi tạo số dư đầu kỳ chính thức CLB Doanh Nhân CEO HN10 chuyển tiếp từ các kỳ trước: 2.100.000.000 VNĐ',
        NOW()
    )
    ON CONFLICT (period_code) DO UPDATE SET
        total_amount = 2100000000,
        status = 'POSTED',
        posted_at = NOW()
    RETURNING id INTO v_ob_id;

    IF v_ob_id IS NOT NULL THEN
        -- Phân bổ: Quỹ Tổng 1.500.000.000đ, Quỹ Công nghệ 200.000.000đ, Đào tạo 150.000.000đ, Sự kiện 150.000.000đ, Tài trợ 100.000.000đ = ĐÚNG 2.1 TỶ
        INSERT INTO public.financial_opening_balance_items (opening_balance_id, fund_id, allocated_amount, notes)
        VALUES
            (v_ob_id, v_fund_gen, 1500000000, 'Số dư đầu kỳ Quỹ Tổng CEO HN10'),
            (v_ob_id, v_fund_tech, 200000000, 'Số dư đầu kỳ Quỹ Ban Công Nghệ'),
            (v_ob_id, v_fund_train, 150000000, 'Số dư đầu kỳ Quỹ Ban Học Tập & Đào Tạo'),
            (v_ob_id, v_fund_event, 150000000, 'Số dư đầu kỳ Quỹ Ban Sự Kiện & Hậu Cần'),
            (v_ob_id, v_fund_spon, 100000000, 'Số dư đầu kỳ Quỹ Tài Trợ Thiện Nguyện')
        ON CONFLICT (opening_balance_id, fund_id) DO UPDATE SET
            allocated_amount = EXCLUDED.allocated_amount;
    END IF;

    -- ============================================================================
    -- GHI NHẬN KHOẢN ĐIỀU CHUYỂN NỘI BỘ 20 TRIỆU TỪ QUỸ TỔNG SANG QUỸ BAN CÔNG NGHỆ
    -- (KHÔNG TÍNH VÀO DOANH THU/CHI PHÍ HỢP NHẤT)
    -- ============================================================================
    INSERT INTO public.financial_transfers (
        transfer_id, source_fund_id, destination_fund_id, amount,
        description, transfer_date, status, source_voucher_no, dest_voucher_no
    ) VALUES (
        'TRF-TECH-20M-2026',
        v_fund_gen,
        v_fund_tech,
        20000000,
        'Điều chuyển nội bộ: Cấp kinh phí 20.000.000 VNĐ từ Quỹ Tổng sang Quỹ Ban Công Nghệ để phát triển giải pháp số',
        CURRENT_DATE,
        'COMPLETED',
        'PC-TRF-2026-001',
        'PT-TRF-2026-001'
    )
    ON CONFLICT (transfer_id) DO NOTHING;
END $$;
