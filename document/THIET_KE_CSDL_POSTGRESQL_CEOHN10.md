# THIẾT KẾ CƠ SỞ DỮ LIỆU POSTGRESQL HỆ THỐNG CEO HN10

**Phiên bản:** 3.0  
**Hệ quản trị CSDL:** PostgreSQL 16 + Prisma ORM (`@ceohn10/db`) + `SchemaSyncService`  

---

## 1. KIẾN TRÚC PHÂN LẬP MÔI TRƯỜNG & ĐỒNG BỘ SCHEMA 2 CHIỀU

### 1.1. Phân tách Database theo môi trường (Strict Policy)
- **Môi trường Localhost Development:** `postgresql://app1:***@127.0.0.1:5432/ceohn10_project`
- **Môi trường Server Subdomain (PgBouncer):** `postgresql://app1:***@113.20.107.184:6432/ceohn10_project?pgbouncer=true`
- **Khóa cứng trong mã nguồn ([main.ts](file:///d:/download/VICONNECT/CEO_VIONE_PROJECT/ceoHN10_project/apps/ceohn10_app_be/src/main.ts) & [prisma.service.ts](file:///d:/download/VICONNECT/CEO_VIONE_PROJECT/ceoHN10_project/apps/ceohn10_app_be/src/prisma/prisma.service.ts)):**
  - Nếu chạy trong Docker (`/.dockerenv`, `DOCKER_CONTAINER=true`, `NODE_ENV=production`) → ép dùng `113.20.107.184:6432`.
  - Nếu chạy Localhost ngoài Docker → ép dùng `127.0.0.1:5432`.

### 1.2. Cơ chế Đồng bộ Cấu trúc Bảng & Cột (Schema-Only)
1. **Tự động khi khởi động (`SchemaSyncService`):** Chạy `CREATE TABLE IF NOT EXISTS` và `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` cho toàn bộ bảng/cột mở rộng ngay khi NestJS khởi động ở cả Localhost và Server.
2. **Prisma Migrations khi deploy (`Dockerfile.backend`):** Chạy `npx --prefix packages/db prisma migrate deploy` trước khi khởi động server.
3. **Đồng bộ ngược Server → Local (`scripts/sync-db-schema.mjs`):** Lệnh `npm run db:diff-schema` và `npm run db:sync-schema` so sánh `information_schema.columns` giữa Server và Local để bổ sung bảng/cột còn thiếu ở Local mà **tuyệt đối không copy dữ liệu**.

---

## 2. ĐẶC TẢ CHI TIẾT CÁC BẢNG CỐT LÕI (`public.*`)

### 2.1. Nhóm Tài khoản, Phân quyền & Cấu hình
| Bảng | Khóa chính | Các cột chính & Kiểu dữ liệu | Ghi chú nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `vione_users` | `id` (UUID) | `email` (TEXT UNIQUE), `password_hash` (TEXT), `full_name` (TEXT), `target_system` (TEXT: `app_only`/`crm_only`/`both`), `is_active` (BOOLEAN) | Tài khoản đăng nhập; xóa tài khoản giữ nguyên `members` |
| `roles` | `code` (TEXT) | `name` (TEXT), `scope_level` (TEXT), `description` (TEXT) | 9 roles chuẩn (`ADMIN_PLATFORM`, `ADMIN`, `LOP_TRUONG`, `LOP_PHO`, `TRUONG_TEAM`, `PHO_TEAM`, `TRUONG_BAN_CHUYEN_TRACH`, `GIANG_VIEN`, `HOC_VIEN`) |
| `user_roles` | `id` (UUID) | `user_id` (UUID), `role` (TEXT), `association_id` (UUID), `department_id` (TEXT) | Ánh xạ nhiều-nhiều user ↔ role |
| `members` | `id` (UUID) | `user_id` (UUID NULLABLE), `full_name`, `email`, `phone`, `membership_code`, `company_name`, `position`, `department`, `executive_role`, `avatar_url`, `cover_url`, `zalo_user_id`, `custom_data` (JSONB) | Hồ sơ Học viên / Giảng viên; xóa học viên xóa kèm `vione_users` |
| `departments` | `id` (TEXT) | `name` (TEXT), `code` (TEXT), `description` (TEXT), `sort_order` (INT) | 7 Ban chuyên trách chuẩn |
| `master_system_settings` | `key` (TEXT) | `value` (JSONB), `updated_at` (TIMESTAMPTZ) | Lưu cấu hình động SePay (`sepay_integration_config`), Zalo OA |
| `app_settings` | `key` (TEXT) | `value` (JSONB), `updated_by` (UUID) | Lưu ma trận RBAC, theme, nhãn Sidebar động |
| `dynamic_form_schemas` | `id` (UUID) | `entity_type` (TEXT), `name` (TEXT), `title` (TEXT), `is_active` (BOOLEAN) | Schema form động theo phân hệ (`members`, `events`...) |
| `dynamic_form_fields` | `id` (UUID) | `schema_id` (UUID), `field_name`, `field_label`, `field_type`, `options` (JSONB), `is_required`, `order_index` | Danh sách trường động do Ban Công Nghệ / Admin cấu hình |

### 2.2. Nhóm Sự kiện, Vé, Thư mời & Check-in
| Bảng | Khóa chính | Các cột chính & Kiểu dữ liệu | Ghi chú nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `events` | `id` (TEXT) | `name`, `tagline`, `date` (DATE), `start_time`, `end_time`, `location`, `venue_name`, `capacity` (INT), `registered` (INT), `reserve_capacity` (INT), `allow_walkin_checkin` (BOOLEAN), `type`, `status`, `is_paid`, `ticket_price` (NUMERIC), `parts` (JSONB), `form_config` (JSONB), `sponsors` (JSONB), `qr_fields` (JSONB), `image_url`, `association_id` (UUID) | `parts` lưu mảng các phần chương trình kèm mức phí từng phần; `reserve_capacity` lưu số vé dự phòng cho khách check-in trực tiếp |
| `event_ticket_types` | `id` (TEXT) | `event_id` (TEXT), `name` (TEXT), `price` (NUMERIC), `quantity` (INT), `sold` (INT), `description` (TEXT), `sort_order` (INT) | Các hạng vé chi tiết theo từng phần của sự kiện |
| `event_invitation_guests` | `id` (TEXT) | `event_id` (TEXT), `slug` (TEXT), `full_name`, `title`, `company`, `email`, `phone`, `guest_type` (TEXT: `invited_guest` \| `other_participant`), `source`, `sent_at` | `UNIQUE(event_id, slug)`. Chỉ Trưởng ban Truyền thông / Sự kiện & Hậu cần / Admin được đổi `guest_type` |
| `event_registrations` | `id` (TEXT) | `event_id` (TEXT), `member_id` (UUID), `member_code`, `member_name`, `company`, `email`, `phone`, `ticket_type`, `ticket_count` (INT), `status` (`confirmed`/`pending`/`declined`/`cancelled`/`checked_out`), `payment_status` (`free`/`pending`/`paid`), `payment_amount` (NUMERIC), `attended_parts` (JSONB), `dynamic_data` (JSONB), `is_walkin` (BOOLEAN), `registration_origin` (`pre_registered`/`walkin_checkin`), `is_late` (BOOLEAN), `checkin_timeliness`, `seat_assignment`, `checked_in_at` (TIMESTAMPTZ), `checked_out_at` (TIMESTAMPTZ) | Lưu toàn bộ đăng ký từ App, RSVP thư mời, Walk-in; kiểm tra trùng theo `event_id` + `email` hoặc `member_name` + `phone` |

### 2.3. Nhóm Tài chính & Tài trợ
| Bảng | Khóa chính | Các cột chính & Kiểu dữ liệu | Ghi chú nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `financial_funds` | `id` (UUID) | `code` (TEXT UNIQUE), `name`, `fund_type` (`GENERAL`/`COMMITTEE`), `current_balance` (NUMERIC) | Quỹ Tổng (`FUND_GENERAL`: 2.08 tỷ) & 7 Quỹ Ban chuyên trách (`FUND_BAN_CONG_NGHE`: 20 triệu...) |
| `bank_accounts` | `id` (UUID) | `bank_name`, `account_number` (UNIQUE), `account_holder`, `fund_id` (UUID) | Đồng bộ từ cấu hình SePay Master Admin |
| `financial_transactions` | `id` (UUID) | `fund_id` (UUID), `type` (`INCOME`/`EXPENSE`), `amount` (NUMERIC), `category`, `reference_code`, `description`, `created_at` | Tự động ghi nhận `INCOME` khi Webhook SePay xác nhận `CEO1983_EVT_<regId>` |
| `expense_requests` | `id` (UUID) | `fund_id` (UUID), `requester_id`, `amount`, `reason`, `status` (`pending`/`finance_approved`/`leader_approved`/`paid`), `created_at` | Quy trình duyệt chi 2 cấp |
| `sponsor_packages` | `id` (TEXT) | `tier`, `price` (BIGINT), `benefits` (TEXT[]), `available` (INT), `sold` (INT), `package_type`, `in_kind_description` | Gói tài trợ Kim Cương / Vàng / Bạc / Đồng |
| `sponsors` | `id` (TEXT) | `name`, `tier`, `sponsor_type`, `package_type`, `contact`, `email`, `phone`, `amount` (BIGINT), `status`, `in_kind_items` (JSONB) | Danh sách nhà tài trợ & hiện vật |

### 2.4. Nhóm Biểu quyết, Lớp học, Gắn kết & Thông báo
| Bảng | Khóa chính | Các cột chính & Kiểu dữ liệu | Ghi chú nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `polls` | `id` (UUID) | `title`, `description`, `status` (`open`/`closed`), `event_id` (TEXT), `training_id` (UUID), `start_date`, `end_date` | Tự động chuyển `closed` khi sự kiện `event_id` kết thúc |
| `poll_options` | `id` (UUID) | `poll_id` (UUID), `title`, `votes_count` (INT) | Các lựa chọn trong biểu quyết |
| `poll_votes` | `id` (UUID) | `poll_id` (UUID), `option_id` (UUID), `user_id` (UUID), `source_app` (`association_app`/`crm`), `created_at` | `UNIQUE(poll_id, user_id)` — lưu vết lựa chọn từng học viên |
| `trainings` | `id` (UUID) | `title`, `code`, `instructor`, `date`, `duration`, `location`, `is_online`, `slide_url`, `status` | 30 chuyên đề đào tạo CEO HN10 |
| `user_connections` | `id` (UUID) | `requester_id` (UUID), `recipient_id` (UUID), `status`, `message` | Kết nối bạn bè / đối tác B2B |
| `business_meetings` | `id` (UUID) | `requester_id` (UUID), `recipient_id` (UUID), `title`, `meeting_time`, `location`, `status` | Lịch hẹn gặp B2B |
| `business_notifications` | `id` (UUID) | `recipient_user_id` (UUID), `source_domain`, `source_record_id`, `event_kind`, `title_key`, `body_key`, `safe_display_data` (JSONB), `app_scope`, `target_app` | Thông báo realtime phân tách CRM vs App |
| `member_notifications` | `id` (UUID) | `recipient_id` (UUID), `title`, `body`, `read` (BOOLEAN), `ref_type`, `ref_id` | Hộp thư thông báo trên Mobile App |
| `activity_log` | `id` (UUID) | `action`, `target`, `target_type`, `actor_email`, `association_id`, `created_at` | Nhật ký thao tác toàn hệ thống |
