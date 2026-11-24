-- ============================================================================
-- CẬP NHẬT CHUẨN HÓA CƠ CẤU 8 QUỸ CEO HN10:
-- 1 Quỹ Tổng (2 tỷ 080 triệu) + 7 Quỹ Ban Chuyên Môn (kèm dòng tiền Vào / Ra)
-- ============================================================================

DO $$
DECLARE
    v_ob_id UUID;
    v_fund_gen UUID;
    v_fund_tech UUID;
    v_fund_hoc_tap UUID;
    v_fund_su_kien UUID;
    v_fund_truyen_thong UUID;
    v_fund_tai_chinh UUID;
    v_fund_thien_nguyen UUID;
    v_fund_an_sinh UUID;
BEGIN
    -- 1. Xóa dữ liệu cũ của các bảng phụ thuộc để nạp lại sạch sẽ
    DELETE FROM public.financial_transfers;
    DELETE FROM public.financial_opening_balance_items;
    DELETE FROM public.bank_accounts;
    DELETE FROM public.financial_funds;

    -- 2. Thêm mới chuẩn xác 8 Quỹ tài chính:
    -- - Quỹ Tổng (To nhất, 2 tỷ 080 triệu)
    -- - 7 Quỹ cho 7 Ban chuyên môn (Ban Công Nghệ có 20 triệu đã nhận chuyển)
    INSERT INTO public.financial_funds (code, name, fund_type, description, current_balance, physical_items_balance, status)
    VALUES
        (
            'FUND_GENERAL',
            'Quỹ Tổng CLB Doanh Nhân CEO HN10',
            'GENERAL',
            'Quỹ tài chính tổng hợp trung tâm toàn bộ hoạt động CLB Doanh Nhân CEO HN10 (2 tỷ 080 triệu)',
            2080000000,
            '[]'::jsonb,
            'active'
        ),
        (
            'FUND_BAN_CONG_NGHE',
            'Quỹ Ban Công Nghệ',
            'COMMITTEE',
            'Quỹ chuyên trách công nghệ và chuyển đổi số (Đã nhận 20 triệu cấp kinh phí từ Quỹ Tổng)',
            20000000,
            '[]'::jsonb,
            'active'
        ),
        (
            'FUND_BAN_HOC_TAP',
            'Quỹ Ban Học Tập',
            'COMMITTEE',
            'Quỹ chuyên trách học tập, đào tạo, học liệu và các chương trình giảng huấn doanh nhân',
            0,
            '[]'::jsonb,
            'active'
        ),
        (
            'FUND_BAN_SU_KIEN_HAU_CAN',
            'Quỹ Ban Sự Kiện & Hậu Cần',
            'COMMITTEE',
            'Quỹ chuyên trách tổ chức sự kiện, hội thảo, xúc tiến thương mại và gala hiệp hội',
            0,
            '[]'::jsonb,
            'active'
        ),
        (
            'FUND_BAN_TRUYEN_THONG',
            'Quỹ Ban Truyền Thông',
            'COMMITTEE',
            'Quỹ chuyên trách truyền thông, nhận diện thương hiệu, báo chí và ấn phẩm hiệp hội',
            0,
            '[]'::jsonb,
            'active'
        ),
        (
            'FUND_BAN_TAI_CHINH',
            'Quỹ Ban Tài Chính',
            'COMMITTEE',
            'Quỹ chuyên trách ngân sách, kiểm soát tài chính, hội phí và kế toán hiệp hội',
            0,
            '[]'::jsonb,
            'active'
        ),
        (
            'FUND_BAN_THIEN_NGUYEN',
            'Quỹ Ban Thiện Nguyện',
            'COMMITTEE',
            'Quỹ chuyên trách công tác xã hội, thiện nguyện vì cộng đồng và tài trợ nhân ái',
            0,
            '[]'::jsonb,
            'active'
        ),
        (
            'FUND_BAN_AN_SINH_XA_HOI',
            'Quỹ Ban An Sinh & Xã Hội',
            'COMMITTEE',
            'Quỹ chăm lo đời sống, an sinh, phúc lợi và gắn kết các thành viên hiệp hội',
            0,
            '[]'::jsonb,
            'active'
        );

    -- Lấy ID các quỹ vừa tạo
    SELECT id INTO v_fund_gen FROM public.financial_funds WHERE code = 'FUND_GENERAL' LIMIT 1;
    SELECT id INTO v_fund_tech FROM public.financial_funds WHERE code = 'FUND_BAN_CONG_NGHE' LIMIT 1;
    SELECT id INTO v_fund_hoc_tap FROM public.financial_funds WHERE code = 'FUND_BAN_HOC_TAP' LIMIT 1;
    SELECT id INTO v_fund_su_kien FROM public.financial_funds WHERE code = 'FUND_BAN_SU_KIEN_HAU_CAN' LIMIT 1;
    SELECT id INTO v_fund_truyen_thong FROM public.financial_funds WHERE code = 'FUND_BAN_TRUYEN_THONG' LIMIT 1;
    SELECT id INTO v_fund_tai_chinh FROM public.financial_funds WHERE code = 'FUND_BAN_TAI_CHINH' LIMIT 1;
    SELECT id INTO v_fund_thien_nguyen FROM public.financial_funds WHERE code = 'FUND_BAN_THIEN_NGUYEN' LIMIT 1;
    SELECT id INTO v_fund_an_sinh FROM public.financial_funds WHERE code = 'FUND_BAN_AN_SINH_XA_HOI' LIMIT 1;

    -- 3. Cập nhật Số Dư Đầu Kỳ 2.1 Tỷ (100% nằm tại Quỹ Tổng khi khởi tạo)
    INSERT INTO public.financial_opening_balances (
        period_code, total_amount, status, notes, posted_at
    ) VALUES (
        'OB_2026_INITIAL',
        2100000000,
        'POSTED',
        'Khởi tạo số dư đầu kỳ chính thức CLB Doanh Nhân CEO HN10: 2.100.000.000 VNĐ tập trung tại Quỹ Tổng',
        NOW()
    )
    ON CONFLICT (period_code) DO UPDATE SET
        total_amount = 2100000000,
        status = 'POSTED',
        notes = 'Khởi tạo số dư đầu kỳ chính thức CLB Doanh Nhân CEO HN10: 2.100.000.000 VNĐ tập trung tại Quỹ Tổng',
        posted_at = NOW()
    RETURNING id INTO v_ob_id;

    -- Phân bổ số dư đầu kỳ: Quỹ Tổng = 2.100.000.000đ, các Quỹ Ban = 0đ
    INSERT INTO public.financial_opening_balance_items (opening_balance_id, fund_id, allocated_amount, notes)
    VALUES
        (v_ob_id, v_fund_gen, 2100000000, 'Số dư đầu kỳ tập trung Quỹ Tổng Hiệp Hội'),
        (v_ob_id, v_fund_tech, 0, 'Số dư đầu kỳ Quỹ Ban Công Nghệ (Nhận kinh phí qua lệnh điều chuyển nội bộ)'),
        (v_ob_id, v_fund_hoc_tap, 0, 'Số dư đầu kỳ Quỹ Ban Học Tập'),
        (v_ob_id, v_fund_su_kien, 0, 'Số dư đầu kỳ Quỹ Ban Sự Kiện & Hậu Cần'),
        (v_ob_id, v_fund_truyen_thong, 0, 'Số dư đầu kỳ Quỹ Ban Truyền Thông'),
        (v_ob_id, v_fund_tai_chinh, 0, 'Số dư đầu kỳ Quỹ Ban Tài Chính'),
        (v_ob_id, v_fund_thien_nguyen, 0, 'Số dư đầu kỳ Quỹ Ban Thiện Nguyện'),
        (v_ob_id, v_fund_an_sinh, 0, 'Số dư đầu kỳ Quỹ Ban An Sinh & Xã Hội');

    -- 4. Ghi nhận Lệnh Điều Chuyển Nội Bộ: Chuyển 20.000.000 VNĐ từ Quỹ Tổng sang Quỹ Ban Công Nghệ
    -- Quỹ Tổng: 2.100.000.000 - 20.000.000 = 2.080.000.000 VNĐ (2 tỷ 080 triệu)
    -- Quỹ Ban Công Nghệ: 0 + 20.000.000 = 20.000.000 VNĐ (20 triệu)
    INSERT INTO public.financial_transfers (
        transfer_id, source_fund_id, destination_fund_id, amount,
        description, transfer_date, status, source_voucher_no, dest_voucher_no
    ) VALUES (
        'TRF-TECH-20M-2026',
        v_fund_gen,
        v_fund_tech,
        20000000,
        'Điều chuyển nội bộ: Cấp kinh phí 20.000.000 VNĐ từ Quỹ Tổng sang Quỹ Ban Công Nghệ để phục vụ chi phí công nghệ và hạ tầng CRM',
        CURRENT_DATE,
        'COMPLETED',
        'PC-TRF-2026-001',
        'PT-TRF-2026-001'
    );

    -- 5. Kết nối Tài khoản Ngân hàng
    INSERT INTO public.bank_accounts (fund_id, bank_name, account_number, account_holder, sepay_account_id, is_active, is_default)
    VALUES
        (
            v_fund_gen,
            'Vietcombank',
            '101010202688',
            'CLB DOANH NHAN CEO HN10 - QUY TONG',
            'SP_ACC_HN10_VCB_01',
            TRUE,
            TRUE
        ),
        (
            v_fund_tech,
            'MBBank',
            '888809012026',
            'CLB DOANH NHAN CEO HN10 - BAN CONG NGHE',
            'SP_ACC_HN10_MB_TECH',
            TRUE,
            FALSE
        );

    RAISE NOTICE 'ĐÃ HOÀN TẤT CẬP NHẬT 8 QUỸ CEO HN10 VỚI QUỸ TỔNG 2 TỶ 080 TRIỆU VÀ QUỸ BAN CÔNG NGHỆ 20 TRIỆU!';
END $$;
