# THIẾT KẾ CƠ SỞ DỮ LIỆU POSTGRESQL HỆ THỐNG CEO HN10 (HANOIBA)
## DATABASE DESIGN SPECIFICATION - POSTGRESQL 113.20.107.184:6432 (ENTERPRISE EDITION)
*Mã tài liệu: DB-CEOHN10-ENTERPRISE-V2.0*  
*Đơn vị chủ quản: CLB Doanh Nhân CEO HN10 — Trực thuộc Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA)*  
*Cơ sở dữ liệu trung tâm: PostgreSQL 113.20.107.184:6432 (Database: ceohn10_project)*  
*Tài khoản vận hành: app1 (Kết nối bảo mật qua PgBouncer Pooler)*  
*Thời điểm ban hành: Tháng 11/2026*  

---

## MỤC LỤC TỔNG THỂ
1. **TỔNG QUAN KIẾN TRÚC CƠ SỞ DỮ LIỆU**
   - 1.1. Thông số kết nối máy chủ chuẩn & Connection String
   - 1.2. Nguyên tắc toàn vẹn dữ liệu tối cao (STRICT DATABASE LAW & STRICT NO-MOCK)
   - 1.3. Sơ đồ thực thể liên kết tổng thể (Master Entity Relationship Diagram - Mermaid ERD)
2. **DANH MỤC 31 BẢNG DỮ LIỆU CHUẨN TRONG HỆ THỐNG**
3. **ĐẶC TẢ CHI TIẾT TỪNG BẢNG DỮ LIỆU (ĐẦY ĐỦ CÁC CỘT, KIỂU DỮ LIỆU, RÀNG BUỘC, DEFAULT & MÔ TẢ)**
   - 3.1. Phân hệ Người Dùng & Học Viên: `ceohn10_users`, `members`, `companies`
   - 3.2. Phân hệ Cơ Cấu 7 Ban Chuyên Môn: `departments`, `department_members`
   - 3.3. Phân hệ Lớp Học & Đào Tạo: `courses`, `trainings`, `training_sessions`, `training_attendees`
   - 3.4. Phân hệ Sự Kiện, Đăng Ký & Bốc Thăm: `events`, `event_registrations`, `lucky_draw_prizes`, `lucky_draw_history`, `event_votes`, `event_vote_results`
   - 3.5. Phân hệ Nhà Tài Trợ & Quỹ 4 Nguồn: `sponsors`, `sponsor_items`
   - 3.6. Phân hệ Tài Chính, Sổ Quỹ & Báo Cáo: `transactions`, `transaction_categories`, `finance_reports`
   - 3.7. Phân hệ Hoạt Động, Cuộc Họp, Biểu Mẫu: `meetings`, `meeting_attendees`, `documents`, `templates`
   - 3.8. Phân hệ Kết Nối Giao Thương: `b2b_opportunities`, `messages`
   - 3.9. Phân hệ Truyền Thông, Thông Báo & Quyền Lợi: `notifications`, `notification_recipients`, `news`, `perks`
   - 3.10. Phân hệ Hệ Thống, Nhật Ký & Phân Quyền: `activity_logs`, `app_settings`
4. **MA TRẬN QUAN HỆ KHÓA NGOẠI (FOREIGN KEY CONSTRAINTS)**
5. **CHIẾN LƯỢC ĐÁNH CHỈ MỤC TỐI ƯU HIỆU NĂNG (INDEXING STRATEGY)**
6. **DỮ LIỆU KHỞI TẠO MẪU HẠT NHÂN (SEED DATA: 4 SỰ KIỆN THƯỜNG NIÊN & SỔ QUỸ 2.1 TỶ VNĐ)**

---

## 1. TỔNG QUAN KIẾN TRÚC CƠ SỞ DỮ LIỆU

### 1.1. Thông số kết nối máy chủ chuẩn & Connection String
- **Địa chỉ máy chủ (Host)**: `113.20.107.184`
- **Cổng kết nối (Port)**: `6432` (Kết nối bảo mật qua PgBouncer connection pooler)
- **Tên cơ sở dữ liệu (Database Name)**: `ceohn10_project`
- **Tài khoản (Username)**: `app1`
- **Mật khẩu (Password)**: `5^S0CEpvYwC1(#YN1UoJ`
- **Chuỗi kết nối tiêu chuẩn (Connection Strings)**:
  ```text
  postgresql://app1:5^S0CEpvYwC1(#YN1UoJ@113.20.107.184:6432/ceohn10_project?pgbouncer=true
  jdbc:postgresql://113.20.107.184:6432/ceohn10_project
  ```

### 1.2. Nguyên tắc toàn vẹn dữ liệu tối cao (STRICT DATABASE LAW & STRICT NO-MOCK)
1. **CSDL DUY NHẤT & CHUẨN MỰC**: Toàn bộ hệ sinh thái CEO HN10 (Backend NestJS, Web CRM Quản trị và Mobile App Học viên) bắt buộc phải đọc/ghi vào CSDL `113.20.107.184:6432`. Tuyệt đối không trỏ sang CSDL khác.
2. **STRICT NO-MOCK LAW**: Tuyệt đối không mock/fake dữ liệu tĩnh hoặc gán mảng giả lập để che giấu trạng thái lỗi cơ sở dữ liệu. Mọi trường hợp lỗi kết nối hoặc PgBouncer retry đều phải báo rõ ràng và trung thực cho người dùng.
3. **MÔ HÌNH PHÂN QUYỀN ĐỘNG (DYNAMIC RBAC)**: Ma trận phân quyền CRM (`crm_permission_matrix`) và phân quyền năng lực AI (`ai_permission_matrix`) được lưu trữ tập trung trong bảng `public.app_settings`, cho phép cập nhật tức thời 2 chiều từ giao diện quản trị mà không cần sửa code.

---

### 1.3. Sơ đồ thực thể liên kết tổng thể (Master Entity Relationship Diagram - Mermaid ERD)

```mermaid
erDiagram
    ceohn10_users ||--o| members : "1:1 hồ sơ học viên"
    members }|--|| companies : "n:1 thuộc doanh nghiệp"
    members }|--o{ department_members : "n:m sinh hoạt ban"
    departments ||--o{ department_members : "1:n cơ cấu ban"
    
    courses ||--o{ trainings : "1:n môn học -> lớp học"
    trainings ||--o{ training_sessions : "1:n buổi học chi tiết"
    training_sessions ||--o{ training_attendees : "1:n điểm danh buổi học"
    members ||--o{ training_attendees : "1:n tham gia học"
    
    events ||--o{ event_registrations : "1:n đăng ký vé sự kiện"
    members ||--o{ event_registrations : "1:n đăng ký tham dự"
    events ||--o{ lucky_draw_prizes : "1:n cơ cấu giải thưởng"
    lucky_draw_prizes ||--o{ lucky_draw_history : "1:n lịch sử trúng giải"
    members ||--o{ lucky_draw_history : "1:n người trúng thưởng"
    
    events ||--o{ event_votes : "1:n phiên biểu quyết"
    event_votes ||--o{ event_vote_results : "1:n phiếu biểu quyết"
    members ||--o{ event_vote_results : "1:n cử tri bỏ phiếu"
    
    sponsors ||--o{ sponsor_items : "1:n vật phẩm hiện vật"
    sponsors ||--o{ transactions : "1:n giao dịch nộp quỹ tài trợ"
    
    transaction_categories ||--o{ transactions : "1:n phân loại thu/chi"
    events ||--o{ transactions : "1:n chi phí sự kiện"
    trainings ||--o{ transactions : "1:n chi phí lớp học"
    transactions ||--o{ finance_reports : "n:1 tổng hợp báo cáo"
    
    templates ||--o{ finance_reports : "1:n định dạng mẫu xuất báo cáo"
    
    meetings ||--o{ meeting_attendees : "1:n thành phần dự họp"
    members ||--o{ meeting_attendees : "1:n tham gia cuộc họp"
    
    departments ||--o{ documents : "1:n văn bản theo ban"
    events ||--o{ documents : "1:n hình ảnh media sự kiện"
    
    members ||--o{ b2b_opportunities : "1:n đăng cơ hội hợp tác"
    ceohn10_users ||--o{ messages : "1:n tin nhắn trao đổi"
    
    notifications ||--o{ notification_recipients : "1:n người nhận thông báo"
    members ||--o{ notification_recipients : "1:n tiếp nhận tin"
    
    ceohn10_users ||--o{ activity_logs : "1:n nhật ký an ninh audit"
```

---

## 2. DANH MỤC 31 BẢNG DỮ LIỆU CHUẨN TRONG HỆ THỐNG

| STT | Tên Bảng | Phân Hệ | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :---: | :--- | :--- | :--- |
| 1 | `public.ceohn10_users` | Tài khoản & Xác thực | Lưu trữ tài khoản đăng nhập, mật khẩu mã hóa bcrypt, email, số điện thoại |
| 2 | `public.members` | Học viên Doanh nhân | Hồ sơ 360 độ học viên, chức danh, mã định danh số, QR code cá nhân |
| 3 | `public.companies` | Doanh nghiệp | Pháp nhân doanh nghiệp, mã số thuế, ngành nghề, vốn, website |
| 4 | `public.departments` | Cơ cấu tổ chức | Danh mục 7 Ban Chuyên Môn & Ban Cán Sự (Ban Học Tập, Sự Kiện, Tài Chính, Thiện Nguyện, Truyền Thông, B2B, Thành Viên) |
| 5 | `public.department_members` | Nhân sự các ban | Phân bổ học viên vào các ban chuyên môn, chức vụ (Trưởng ban, Phó ban, Ủy viên) |
| 6 | `public.courses` | Khóa đào tạo | Chương trình đào tạo chuẩn quản trị doanh nghiệp CEO HN10 |
| 7 | `public.trainings` | Lớp học & Khóa học | Thông tin lớp học, thời gian, địa điểm, giảng viên, trạng thái mở lớp |
| 8 | `public.training_sessions` | Buổi học chi tiết | Từng buổi học trong lớp, lịch giảng, phòng học, mã QR điểm danh động |
| 9 | `public.training_attendees` | Điểm danh lớp học | Lịch sử điểm danh buổi học, thời gian quét QR, ghi chú học tập |
| 10 | `public.events` | Sự kiện | Thông tin sự kiện (4 sự kiện cố định thường niên + sự kiện chuyên đề + sự kiện thiện nguyện CSR) |
| 11 | `public.event_registrations`| Đăng ký & Vé sự kiện | Danh sách đại biểu đăng ký tham gia, loại vé, mã vé QR E-Ticket, trạng thái check-in |
| 12 | `public.lucky_draw_prizes` | Bốc thăm may mắn | Cơ cấu giải thưởng bốc thăm tại Gala/Sự kiện (Đặc biệt, Nhất, Nhì, Ba, Khuyến khích) |
| 13 | `public.lucky_draw_history`| Lịch sử trúng giải | Ghi nhận đại biểu trúng thưởng, thời điểm quay số, trạng thái trao giải |
| 14 | `public.event_votes` | Biểu quyết điện tử | Phiên bầu cử Ban Cán Sự hoặc biểu quyết nghị quyết đại hội trực tuyến |
| 15 | `public.event_vote_results` | Kết quả biểu quyết | Phiếu bầu của từng đại biểu (1 người - 1 phiếu), lựa chọn tán thành/không tán thành |
| 16 | `public.sponsors` | Nhà tài trợ & Quỹ | Thông tin nhà tài trợ mở rộng, nội dung tài trợ, phân loại 4 nguồn quỹ |
| 17 | `public.sponsor_items` | Hiện vật tài trợ | Chi tiết danh mục vật phẩm tài trợ, đơn vị tính, số lượng, giá trị quy đổi VNĐ |
| 18 | `public.transactions` | Sổ quỹ & Thu - Chi | Sổ quỹ hội 2.1 Tỷ VNĐ, phiếu thu, phiếu chi, chứng từ kế toán, luồng phê duyệt 4 cấp |
| 19 | `public.transaction_categories`| Danh mục thu chi | Phân loại thu chi (Hội phí niên liễm, Sự kiện, Lớp học, Thiện nguyện CSR, Vận hành) |
| 20 | `public.finance_reports` | Báo cáo tài chính | Lịch sử tổng hợp báo cáo tài chính định kỳ theo từng danh mục |
| 21 | `public.templates` | Biểu mẫu động | Cấu hình định dạng biểu mẫu Excel, Word, PDF (tiêu đề, căn cứ, các cột, 3 chữ ký) |
| 22 | `public.meetings` | Quản lý cuộc họp | Cuộc họp Ban Cán Sự, Ban Điều Hành, Ban Chuyên Môn, lịch họp, phòng họp |
| 23 | `public.meeting_attendees` | Đại biểu dự họp | Danh sách lãnh đạo được triệu tập tham dự cuộc họp, trạng thái có mặt/vắng |
| 24 | `public.documents` | Tài liệu & Học liệu | Kho lưu trữ nghị quyết, quy chế, biên bản cuộc họp, slide bài giảng, hình ảnh media |
| 25 | `public.b2b_opportunities` | Cơ hội giao thương | Sàn giao thương B2B nội khối, chào mua, chào bán sản phẩm ưu đãi học viên |
| 26 | `public.messages` | Tin nhắn nội bộ | Tin nhắn kết nối 1-on-1 trực tiếp giữa các chủ doanh nghiệp |
| 27 | `public.notifications` | Quản lý thông báo | Thông báo đẩy, thông báo sự kiện, lớp học, nhắc nộp niên liễm |
| 28 | `public.notification_recipients`| Người nhận thông báo | Danh sách học viên nhận thông báo và trạng thái đã đọc/chưa đọc |
| 29 | `public.news` | Tin tức & Truyền thông | Bài viết truyền thông, tin hoạt động hiệp hội, vinh danh học viên tiêu biểu |
| 30 | `public.perks` | Quyền lợi & Ưu đãi | Danh mục đặc quyền dành riêng cho học viên CEO HN10 |
| 31 | `public.activity_logs` | Nhật ký hệ thống | Audit logs ghi nhận toàn bộ thao tác, địa chỉ IP, tài khoản thực hiện |
| 32 | `public.app_settings` | Cấu hình hệ thống | Lưu ma trận RBAC (`crm_permission_matrix`), ma trận AI (`ai_permission_matrix`) |

---

## 3. ĐẶC TẢ CHI TIẾT TỪNG BẢNG DỮ LIỆU

### 3.1. Phân hệ Người Dùng & Học Viên

#### Bảng 1: `public.ceohn10_users` (Tài khoản người dùng CEO HN10)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh duy nhất của tài khoản người dùng |
| `email` | `varchar(255)` | UQ | Không | | Email đăng nhập chính thức của tài khoản |
| `password_hash` | `varchar(255)` | | Không | | Chuỗi mật khẩu băm bảo mật theo thuật toán bcrypt |
| `phone` | `varchar(20)` | UQ | Có | | Số điện thoại đăng ký nhận OTP / liên hệ |
| `full_name` | `varchar(150)` | | Không | | Họ và tên đầy đủ của người dùng |
| `avatar_url` | `text` | | Có | | Đường dẫn URL ảnh đại diện |
| `status` | `varchar(50)` | | Không | `'active'` | Trạng thái: `active` (hoạt động), `pending` (chờ duyệt), `locked` (bị khóa) |
| `role` | `varchar(100)` | | Không | `'member'` | Vai trò hệ thống: `quan_tri`, `chu_tich`, `pho_chu_tich`, `tong_thu_ky`, `truong_ban_tai_chinh`, `truong_ban_truyen_thong`, `member` |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm tạo tài khoản |
| `updated_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm cập nhật tài khoản gần nhất |

#### Bảng 2: `public.members` (Hồ sơ 360 độ Học viên Doanh nhân)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh duy nhất của học viên |
| `user_id` | `uuid` | FK -> `ceohn10_users(id)` | Có | | Khóa ngoại liên kết tới tài khoản đăng nhập |
| `member_code` | `varchar(50)` | UQ | Không | | Mã định danh học viên (VD: `HN10-001`, `HN10-088`) |
| `full_name` | `varchar(150)` | | Không | | Họ và tên học viên |
| `company_id` | `uuid` | FK -> `companies(id)` | Có | | Khóa ngoại liên kết tới doanh nghiệp học viên sở hữu |
| `position` | `varchar(100)` | | Có | | Chức vụ tại doanh nghiệp (Chủ tịch HĐQT, Tổng Giám đốc...) |
| `phone` | `varchar(20)` | | Có | | Số điện thoại di động chính |
| `email` | `varchar(255)` | | Có | | Email liên hệ công việc |
| `birthday` | `date` | | Có | | Ngày tháng năm sinh |
| `gender` | `varchar(20)` | | Có | | Giới tính: `nam`, `nu`, `khac` |
| `qr_code_url` | `text` | | Có | | URL mã QR thẻ doanh nhân số cá nhân |
| `bio` | `text` | | Có | | Tiểu sử tóm tắt năng lực và lĩnh vực hoạt động |
| `join_date` | `date` | | Có | `CURRENT_DATE` | Ngày gia nhập lớp CEO HN10 |
| `status` | `varchar(50)` | | Không | `'active'` | Trạng thái sinh hoạt: `active`, `suspended`, `graduated` |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm tạo hồ sơ |
| `updated_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm cập nhật hồ sơ |

#### Bảng 3: `public.companies` (Hồ sơ Doanh nghiệp thành viên)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh duy nhất doanh nghiệp |
| `company_name` | `varchar(255)` | | Không | | Tên pháp nhân đầy đủ của doanh nghiệp |
| `short_name` | `varchar(100)` | | Có | | Tên thương hiệu viết tắt |
| `tax_code` | `varchar(50)` | UQ | Có | | Mã số thuế doanh nghiệp |
| `industry` | `varchar(150)` | | Có | | Ngành nghề hoạt động chính (Bất động sản, Công nghệ, Y tế...) |
| `address` | `text` | | Có | | Địa chỉ trụ sở chính đăng ký kinh doanh |
| `website` | `varchar(255)` | | Có | | Địa chỉ website doanh nghiệp |
| `logo_url` | `text` | | Có | | URL logo nhận diện doanh nghiệp |
| `charter_capital`| `numeric(18,2)`| | Có | `0` | Vốn điều lệ đăng ký (VNĐ) |
| `employee_count` | `integer` | | Có | `0` | Quy mô số lượng nhân sự |
| `description` | `text` | | Có | | Giới thiệu năng lực cung ứng sản phẩm, dịch vụ |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm tạo bản ghi |
| `updated_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm cập nhật bản ghi |

---

### 3.2. Phân hệ Cơ Cấu 7 Ban Chuyên Môn & Ban Cán Sự

#### Bảng 4: `public.departments` (Ban Chuyên Môn & Cơ Cấu Tổ Chức)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh ban chuyên môn |
| `code` | `varchar(50)` | UQ | Không | | Mã ban: `BDH`, `BHT`, `BSK`, `BTC`, `BTN`, `BTT`, `B2B`, `BTV` |
| `name` | `varchar(150)` | | Không | | Tên ban: Ban Điều Hành, Ban Học Tập, Ban Sự Kiện, Ban Tài Chính, Ban Thiện Nguyện, Ban Truyền Thông, Ban B2B, Ban Thành Viên |
| `description` | `text` | | Có | | Quy chế chức năng, nhiệm vụ và phạm vi hoạt động của ban |
| `leader_id` | `uuid` | FK -> `members(id)` | Có | | Khóa ngoại người giữ vị trí Trưởng ban |
| `color_theme` | `varchar(50)` | | Có | `'#334155'` | Mã màu nhận diện đại diện cho ban |
| `is_active` | `boolean` | | Không | `true` | Trạng thái hoạt động của ban |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm thành lập ban |

#### Bảng 5: `public.department_members` (Phân bổ nhân sự vào ban)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh bản ghi phân bổ nhân sự |
| `department_id` | `uuid` | FK -> `departments(id)` | Không | | Khóa ngoại liên kết tới ban |
| `member_id` | `uuid` | FK -> `members(id)` | Không | | Khóa ngoại liên kết tới học viên |
| `role_in_dept` | `varchar(50)` | | Không | `'member'` | Chức vụ trong ban: `truong_ban`, `pho_ban`, `uy_vien` |
| `assigned_date` | `date` | | Không | `CURRENT_DATE` | Ngày bổ nhiệm vào ban |
| `is_active` | `boolean` | | Không | `true` | Trạng thái sinh hoạt trong ban |

---

### 3.3. Phân hệ Lớp Học & Đào Tạo

#### Bảng 6: `public.courses` (Khóa Đào Tạo Quản Trị)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh khóa đào tạo |
| `course_code` | `varchar(50)` | UQ | Không | | Mã môn học / khóa đào tạo (VD: `MGT-101`) |
| `title` | `varchar(255)` | | Không | | Tên khóa đào tạo quản trị |
| `description` | `text` | | Có | | Mục tiêu đào tạo và chuẩn đầu ra |
| `total_hours` | `integer` | | Có | `0` | Tổng thời lượng giờ học |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm tạo khóa học |

#### Bảng 7: `public.trainings` (Lớp học thực tế CEO HN10)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh lớp học |
| `course_id` | `uuid` | FK -> `courses(id)` | Có | | Liên kết khóa học |
| `title` | `varchar(255)` | | Không | | Tên lớp học (VD: Lớp Chiến lược tài chính doanh nghiệp) |
| `instructor_name`| `varchar(150)`| | Có | | Tên chuyên gia / giảng viên giảng dạy |
| `start_date` | `date` | | Không | | Ngày bắt đầu khóa học |
| `end_date` | `date` | | Có | | Ngày bế giảng khóa học |
| `location` | `text` | | Có | | Địa điểm tổ chức giảng dạy |
| `status` | `varchar(50)` | | Không | `'upcoming'` | Trạng thái: `upcoming`, `in_progress`, `completed` |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm tạo lớp học |

#### Bảng 8: `public.training_sessions` (Buổi học chi tiết & Mã QR Điểm Danh)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh buổi học chi tiết |
| `training_id` | `uuid` | FK -> `trainings(id)` | Không | | Khóa ngoại liên kết tới lớp học |
| `session_number`| `integer` | | Không | `1` | Thứ tự buổi học (Buổi 1, Buổi 2...) |
| `topic` | `varchar(255)` | | Không | | Chủ đề nội dung bài giảng của buổi |
| `session_date` | `date` | | Không | | Ngày tổ chức buổi học |
| `start_time` | `time` | | Không | | Giờ bắt đầu điểm danh và giảng dạy |
| `end_time` | `time` | | Có | | Giờ kết thúc buổi học |
| `qr_checkin_code`| `varchar(100)`| UQ | Có | | Mã token QR ngẫu nhiên để điểm danh realtime |
| `is_checkin_open`| `boolean` | | Không | `false` | Trạng thái mở cổng điểm danh mã QR |

#### Bảng 9: `public.training_attendees` (Điểm danh học viên buổi học)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh bản ghi điểm danh |
| `session_id` | `uuid` | FK -> `training_sessions(id)` | Không | | Khóa ngoại buổi học |
| `member_id` | `uuid` | FK -> `members(id)` | Không | | Khóa ngoại học viên có mặt |
| `checkin_time` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm quét mã QR điểm danh thành công |
| `checkin_method`| `varchar(50)` | | Không | `'qr_scan'` | Phương thức: `qr_scan`, `manual_admin` |
| `notes` | `text` | | Có | | Ghi chú của cán bộ quản lý lớp học |

---

### 3.4. Phân hệ Sự Kiện, Đăng Ký Đại Biểu & Bốc Thăm

#### Bảng 10: `public.events` (Sự kiện & 4 Sự kiện cố định thường niên)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh duy nhất của sự kiện |
| `title` | `varchar(255)` | | Không | | Tiêu đề sự kiện (VD: Lễ Khai Giảng, Gala YEP...) |
| `event_type` | `varchar(50)` | | Không | `'workshop'` | Phân loại: `fixed` (cố định), `charity` (thiện nguyện), `workshop`, `gala`, `networking` |
| `is_fixed` | `boolean` | | Không | `false` | Cờ đánh dấu 4 sự kiện cố định thường niên của lớp |
| `fixed_date_code`| `varchar(50)` | | Có | | Mã nhận diện ngày cố định: `15_03` (Khai giảng), `18_07` (Teambuilding), `26_12` (YEP), `16_01` (Bế giảng) |
| `start_time` | `timestamptz` | | Không | | Thời gian bắt đầu sự kiện |
| `end_time` | `timestamptz` | | Có | | Thời gian kết thúc sự kiện |
| `location` | `text` | | Không | | Địa chỉ tổ chức sự kiện |
| `speaker` | `varchar(150)` | | Có | | Diễn giả chính / Khách mời danh dự |
| `capacity` | `integer` | | Có | `0` | Sức chứa tối đa số lượng đại biểu |
| `banner_url` | `text` | | Có | | URL ảnh banner sự kiện |
| `description` | `text` | | Có | | Nội dung chương trình và kịch bản chi tiết |
| `status` | `varchar(50)` | | Không | `'published'`| Trạng thái: `draft`, `published`, `ongoing`, `completed`, `cancelled` |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm tạo sự kiện |

#### Bảng 11: `public.event_registrations` (Đăng ký đại biểu & Vé QR E-Ticket)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh bản ghi đăng ký tham dự |
| `event_id` | `uuid` | FK -> `events(id)` | Không | | Khóa ngoại liên kết tới sự kiện |
| `member_id` | `uuid` | FK -> `members(id)` | Có | | Khóa ngoại nếu người đăng ký là học viên chính thức |
| `attendee_name` | `varchar(150)` | | Không | | Họ và tên đại biểu |
| `attendee_phone`| `varchar(20)` | | Không | | Số điện thoại liên hệ đại biểu |
| `attendee_email`| `varchar(255)` | | Có | | Email nhận vé điện tử |
| `company_name` | `varchar(255)` | | Có | | Doanh nghiệp đại biểu đại diện |
| `position` | `varchar(100)` | | Có | | Chức danh công tác |
| `ticket_code` | `varchar(50)` | UQ | Không | | Mã vé duy nhất (VD: `TKT-SK2026-089`) |
| `qr_code_url` | `text` | | Có | | Đường dẫn ảnh mã QR soát vé E-Ticket |
| `checkin_status`| `varchar(50)` | | Không | `'not_checked_in'` | Trạng thái soát vé: `not_checked_in`, `checked_in` |
| `checkin_time` | `timestamptz` | | Có | | Thời điểm quét mã QR check-in tại cổng |
| `registered_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm đăng ký tham dự |

#### Bảng 12: `public.lucky_draw_prizes` (Cơ cấu giải thưởng bốc thăm)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh giải thưởng |
| `event_id` | `uuid` | FK -> `events(id)` | Không | | Khóa ngoại liên kết tới sự kiện Gala |
| `prize_name` | `varchar(150)` | | Không | | Tên giải: Giải Đặc Biệt, Giải Nhất, Giải Nhì... |
| `quantity` | `integer` | | Không | `1` | Số lượng giải thưởng |
| `prize_value` | `numeric(18,2)`| | Có | `0` | Giá trị ước tính của giải thưởng (VNĐ) |
| `sponsor_id` | `uuid` | FK -> `sponsors(id)` | Có | | Khóa ngoại nhà tài trợ giải thưởng |

#### Bảng 13: `public.lucky_draw_history` (Lịch sử người trúng giải bốc thăm)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh bản ghi trúng thưởng |
| `prize_id` | `uuid` | FK -> `lucky_draw_prizes(id)` | Không | | Khóa ngoại giải thưởng được quay |
| `registration_id`| `uuid` | FK -> `event_registrations(id)` | Không | | Khóa ngoại đại biểu may mắn trúng giải |
| `drawn_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm quay số trúng thưởng |
| `is_claimed` | `boolean` | | Không | `true` | Đã nhận giải thưởng trên sân khấu |

#### Bảng 14: `public.event_votes` (Phiên biểu quyết & Bầu cử trực tuyến)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh phiên biểu quyết |
| `event_id` | `uuid` | FK -> `events(id)` | Không | | Khóa ngoại liên kết sự kiện/đại hội |
| `title` | `varchar(255)` | | Không | | Nội dung vấn đề lấy ý kiến biểu quyết / bầu cử |
| `description` | `text` | | Có | | Tờ trình đại hội và các phương án biểu quyết |
| `is_active` | `boolean` | | Không | `false` | Trạng thái mở phiên nhận phiếu |
| `closed_at` | `timestamptz` | | Có | | Thời điểm đóng phiên biểu quyết |

#### Bảng 15: `public.event_vote_results` (Kết quả biểu quyết của cử tri)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh phiếu bầu |
| `vote_id` | `uuid` | FK -> `event_votes(id)` | Không | | Khóa ngoại phiên biểu quyết |
| `member_id` | `uuid` | FK -> `members(id)` | Không | | Khóa ngoại học viên thực hiện bỏ phiếu |
| `choice` | `varchar(50)` | | Không | | Ý kiến bầu: `agree` (tán thành), `disagree` (không tán thành), `abstain` (ý kiến khác) |
| `voted_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm gửi phiếu biểu quyết |

---

### 3.5. Phân hệ Nhà Tài Trợ & Quỹ 4 Nguồn

#### Bảng 16: `public.sponsors` (Nhà tài trợ & Phân bổ 4 nguồn quỹ)
*Lưu ý: Không dùng gói tài trợ cố định (Vàng, Bạc, Đồng), hỗ trợ mở rộng textarea tự do và phân loại rạch ròi 4 nguồn quỹ.*
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh nhà tài trợ |
| `sponsor_name` | `varchar(255)` | | Không | | Tên cá nhân hoặc pháp nhân nhà tài trợ |
| `company_id` | `uuid` | FK -> `companies(id)` | Có | | Khóa ngoại nếu nhà tài trợ là doanh nghiệp học viên |
| `sponsor_fund_type`| `varchar(50)`| | Không | `'general_cash'` | 1 trong 4 nguồn quỹ bắt buộc: `general_cash` (Quỹ hoạt động tiền mặt), `general_in_kind` (Quỹ hoạt động hiện vật), `charity_cash` (Quỹ thiện nguyện tiền mặt), `charity_in_kind` (Quỹ thiện nguyện hiện vật) |
| `content` | `text` | | Không | | Nội dung diễn giải chi tiết cam kết tài trợ |
| `cash_amount` | `numeric(18,2)`| | Có | `0` | Số tiền mặt tài trợ (VNĐ) nếu là tài trợ tiền |
| `in_kind_value` | `numeric(18,2)`| | Có | `0` | Giá trị quy đổi thành tiền (VNĐ) nếu là hiện vật |
| `event_id` | `uuid` | FK -> `events(id)` | Có | | Sự kiện được nhận tài trợ (nếu tài trợ riêng theo sự kiện) |
| `status` | `varchar(50)` | | Không | `'confirmed'` | Trạng thái: `pledged` (cam kết), `confirmed` (đã nhận), `completed` (đã giải ngân) |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm ghi nhận tài trợ |

#### Bảng 17: `public.sponsor_items` (Vật phẩm hiện vật tài trợ)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh vật phẩm hiện vật |
| `sponsor_id` | `uuid` | FK -> `sponsors(id)` | Không | | Khóa ngoại liên kết nhà tài trợ |
| `item_name` | `varchar(255)` | | Không | | Tên vật phẩm (VD: Rượu vang Gala, Áo thun Teambuilding, Quà tặng CSR...) |
| `unit` | `varchar(50)` | | Có | `'chiếc'` | Đơn vị tính (thùng, chai, chiếc, gói) |
| `quantity` | `numeric(12,2)`| | Không | `1` | Số lượng vật phẩm bàn giao |
| `unit_price` | `numeric(18,2)`| | Có | `0` | Đơn giá ước tính quy đổi (VNĐ) |
| `total_value` | `numeric(18,2)`| | Có | `0` | Tổng giá trị quy đổi = số lượng * đơn giá |
| `storage_location`| `text` | | Có | | Nơi lưu kho / bộ phận tiếp nhận quản lý |

---

### 3.6. Phân hệ Tài Chính, Sổ Quỹ 2.1 Tỷ VNĐ & Báo Cáo

#### Bảng 18: `public.transactions` (Sổ Quỹ Thu - Chi Toàn Lớp)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh giao dịch kế toán |
| `voucher_code` | `varchar(50)` | UQ | Không | | Số hiệu chứng từ kế toán (VD: `PT-2026-001`, `PC-2026-045`) |
| `transaction_type`| `varchar(20)` | | Không | | Loại giao dịch: `thu` (phiếu thu tiền vào), `chi` (phiếu chi tiền ra) |
| `category_id` | `uuid` | FK -> `transaction_categories(id)` | Không | | Khóa ngoại phân loại danh mục thu chi |
| `amount` | `numeric(18,2)`| | Không | | Số tiền giao dịch phát sinh (VNĐ) |
| `payment_method`| `varchar(50)` | | Không | `'bank_transfer'` | Hình thức: `bank_transfer` (chuyển khoản), `cash` (tiền mặt) |
| `transacted_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Ngày giờ thực tế giao dịch phát sinh |
| `description` | `text` | | Không | | Diễn giải nội dung khoản thu hoặc khoản chi |
| `payer_receiver`| `varchar(255)` | | Có | | Họ tên/Tổ chức người nộp hoặc người nhận tiền |
| `member_id` | `uuid` | FK -> `members(id)` | Có | | Khóa ngoại học viên liên quan (nếu thu niên liễm) |
| `event_id` | `uuid` | FK -> `events(id)` | Có | | Khóa ngoại sự kiện liên quan (nếu chi tổ chức sự kiện) |
| `training_id` | `uuid` | FK -> `trainings(id)` | Có | | Khóa ngoại lớp học liên quan (nếu chi thù lao giảng viên) |
| `approval_status`| `varchar(50)` | | Không | `'pending'` | Trạng thái duyệt 4 cấp: `pending`, `approved`, `rejected` |
| `approved_by` | `uuid` | FK -> `ceohn10_users(id)` | Có | | Khóa ngoại lãnh đạo duyệt (Lớp Trưởng / Trưởng Ban Tài Chính) |
| `receipt_url` | `text` | | Có | | URL ảnh chụp hóa đơn, sao kê chứng từ chuyển tiền |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm tạo bản ghi kế toán |

#### Bảng 19: `public.transaction_categories` (Danh Mục Hạch Toán Thu Chi)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh danh mục |
| `code` | `varchar(50)` | UQ | Không | | Mã danh mục: `DUES` (Niên liễm), `EVENT` (Sự kiện), `TRAINING` (Lớp học), `CSR` (Thiện nguyện), `OPERATING` (Vận hành) |
| `name` | `varchar(150)` | | Không | | Tên danh mục thu chi hiển thị báo cáo |
| `type` | `varchar(20)` | | Không | | Áp dụng cho: `thu`, `chi`, `both` |

#### Bảng 20: `public.finance_reports` (Lịch Sử Kết Xuất Báo Cáo Tài Chính)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh báo cáo |
| `report_title` | `varchar(255)` | | Không | | Tên báo cáo tài chính đã xuất |
| `category_scope`| `varchar(50)` | | Không | `'all'` | Danh mục kết xuất: `all`, `event`, `training`, `dues`, `csr` |
| `template_id` | `uuid` | FK -> `templates(id)` | Có | | Khóa ngoại biểu mẫu định dạng đã áp dụng |
| `export_format` | `varchar(20)` | | Không | `'excel'` | Định dạng xuất: `excel`, `word`, `pdf` |
| `file_url` | `text` | | Không | | URL tải tệp báo cáo tài chính đã tạo |
| `created_by` | `uuid` | FK -> `ceohn10_users(id)` | Không | | Khóa ngoại kế toán / lãnh đạo thực hiện kết xuất |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm xuất báo cáo |

---

### 3.7. Phân hệ Biểu Mẫu, Cuộc Họp & Tài Liệu

#### Bảng 21: `public.templates` (Biểu Mẫu Cấu Hình Format Xuất Excel, Word, PDF)
*Không hardcode mẫu báo cáo trong source code, lưu trữ linh hoạt trong CSDL.*
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh biểu mẫu |
| `template_code` | `varchar(50)` | UQ | Không | | Mã hiệu biểu mẫu: `BM-TC-01`, `BM-SK-02`, `BM-TN-03` |
| `name` | `varchar(255)` | | Không | | Tên biểu mẫu (VD: Báo cáo thu chi sự kiện chuẩn HanoiBA) |
| `category` | `varchar(50)` | | Không | `'finance'` | Phân loại: `finance`, `event`, `meeting`, `charity` |
| `header_config` | `jsonb` | | Không | `'{}'` | Cấu hình tiêu đề, quốc hiệu tiêu ngữ, đơn vị ban hành |
| `columns_config`| `jsonb` | | Không | `'[]'` | Danh sách cột, độ rộng, tiêu đề cột và thứ tự hiển thị |
| `signatures` | `jsonb` | | Không | `'[]'` | Khối chữ ký 3 bên (Người lập, Trưởng ban/Thủ quỹ, Lớp Trưởng) |
| `is_default` | `boolean` | | Không | `false` | Biểu mẫu mặc định áp dụng khi xuất file |
| `updated_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm cập nhật biểu mẫu |

#### Bảng 22: `public.meetings` (Quản Lý Cuộc Họp)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh cuộc họp |
| `title` | `varchar(255)` | | Không | | Tiêu đề cuộc họp (Họp Ban Cán Sự định kỳ, Họp trù bị...) |
| `department_id` | `uuid` | FK -> `departments(id)` | Có | | Ban chủ trì cuộc họp (nếu là họp riêng của ban) |
| `meeting_date` | `date` | | Không | | Ngày tổ chức cuộc họp |
| `start_time` | `time` | | Không | | Giờ bắt đầu cuộc họp |
| `location` | `text` | | Không | | Địa điểm phòng họp hoặc link họp trực tuyến Zoom/Meet |
| `agenda` | `text` | | Có | | Chương trình nghị sự cuộc họp |
| `minutes_doc_id`| `uuid` | FK -> `documents(id)` | Có | | Liên kết biên bản cuộc họp đã được ký duyệt |
| `status` | `varchar(50)` | | Không | `'scheduled'` | Trạng thái: `scheduled`, `in_progress`, `completed`, `cancelled` |

#### Bảng 23: `public.meeting_attendees` (Đại Biểu Tham Gia Họp)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh bản ghi triệu tập |
| `meeting_id` | `uuid` | FK -> `meetings(id)` | Không | | Khóa ngoại cuộc họp |
| `member_id` | `uuid` | FK -> `members(id)` | Không | | Khóa ngoại học viên được mời họp |
| `attendance` | `varchar(50)` | | Không | `'invited'` | Trạng thái: `invited`, `confirmed`, `attended`, `absent` |

#### Bảng 24: `public.documents` (Kho Lưu Trữ Tài Liệu & Học Liệu Số)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh tài liệu |
| `title` | `varchar(255)` | | Không | | Tên tài liệu, văn bản, nghị quyết, slide bài giảng |
| `doc_type` | `varchar(50)` | | Không | `'pdf'` | Định dạng: `pdf`, `docx`, `xlsx`, `image`, `video` |
| `file_url` | `text` | | Không | | URL tải tệp tin lưu trữ an toàn |
| `file_size_bytes`| `bigint` | | Có | `0` | Kích thước dung lượng file (bytes) |
| `department_id` | `uuid` | FK -> `departments(id)` | Có | | Ban chuyên môn sở hữu/phụ trách tài liệu |
| `event_id` | `uuid` | FK -> `events(id)` | Có | | Sự kiện đính kèm (nếu là media/ảnh sự kiện) |
| `uploaded_by` | `uuid` | FK -> `ceohn10_users(id)` | Không | | Người tải tài liệu lên hệ thống |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm tải lên |

---

### 3.8. Phân hệ Kết Nối Giao Thương B2B & Tin Nhắn

#### Bảng 25: `public.b2b_opportunities` (Sàn Giao Thương B2B Nội Khối)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh cơ hội giao thương |
| `member_id` | `uuid` | FK -> `members(id)` | Không | | Khóa ngoại học viên đăng bài |
| `type` | `varchar(50)` | | Không | `'offer'` | Loại tin: `offer` (chào bán ưu đãi), `demand` (chào mua / tìm đối tác) |
| `title` | `varchar(255)` | | Không | | Tiêu đề sản phẩm hoặc nhu cầu hợp tác |
| `description` | `text` | | Không | | Chi tiết sản phẩm, chính sách giá ưu đãi học viên |
| `deal_value` | `numeric(18,2)`| | Có | `0` | Giá trị gói hợp tác ước tính (VNĐ) |
| `discount_percent`| `numeric(5,2)`| | Có | `0` | Mức chiết khấu dành riêng cho học viên CEO HN10 (%) |
| `image_url` | `text` | | Có | | URL ảnh chụp sản phẩm, dịch vụ |
| `status` | `varchar(50)` | | Không | `'active'` | Trạng thái: `active`, `closed`, `pending_review` |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm đăng tin |

#### Bảng 26: `public.messages` (Tin Nhắn Nội Bộ Giữa Doanh Nhân)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh tin nhắn |
| `sender_id` | `uuid` | FK -> `ceohn10_users(id)` | Không | | Khóa ngoại người gửi tin nhắn |
| `receiver_id` | `uuid` | FK -> `ceohn10_users(id)` | Không | | Khóa ngoại người nhận tin nhắn |
| `content` | `text` | | Không | | Nội dung trao đổi công việc |
| `is_read` | `boolean` | | Không | `false` | Trạng thái đã xem |
| `sent_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm gửi tin nhắn |

---

### 3.9. Phân hệ Truyền Thông, Thông Báo & Quyền Lợi

#### Bảng 27: `public.notifications` (Quản Lý Thông Báo)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh thông báo |
| `title` | `varchar(255)` | | Không | | Tiêu đề thông báo |
| `content` | `text` | | Không | | Nội dung chi tiết thông báo |
| `type` | `varchar(50)` | | Không | `'general'` | Phân loại: `event`, `training`, `fee_reminder`, `general` |
| `event_id` | `uuid` | FK -> `events(id)` | Có | | Khóa ngoại sự kiện đính kèm |
| `training_id` | `uuid` | FK -> `trainings(id)` | Có | | Khóa ngoại lớp học đính kèm |
| `created_by` | `uuid` | FK -> `ceohn10_users(id)` | Không | | Người soạn thông báo |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm tạo thông báo |

#### Bảng 28: `public.notification_recipients` (Người Nhận Thông Báo)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh người nhận |
| `notification_id`| `uuid` | FK -> `notifications(id)` | Không | | Khóa ngoại thông báo |
| `member_id` | `uuid` | FK -> `members(id)` | Không | | Khóa ngoại học viên tiếp nhận |
| `is_read` | `boolean` | | Không | `false` | Trạng thái đã mở xem |
| `read_at` | `timestamptz` | | Có | | Thời điểm xem thông báo |

#### Bảng 29: `public.news` (Tin Tức & Truyền Thông)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh bài viết |
| `title` | `varchar(255)` | | Không | | Tiêu đề bài viết tin tức |
| `slug` | `varchar(255)` | UQ | Không | | Đường dẫn thân thiện SEO |
| `summary` | `text` | | Có | | Tóm tắt nội dung bài viết |
| `content` | `text` | | Không | | Toàn văn bài viết định dạng HTML/Markdown |
| `cover_image_url`| `text` | | Có | | URL ảnh bìa bài viết |
| `is_published` | `boolean` | | Không | `true` | Đã xuất bản công khai |
| `published_at` | `timestamptz` | | Có | `CURRENT_TIMESTAMP` | Thời điểm đăng tải |

#### Bảng 30: `public.perks` (Quyền Lợi & Ưu Đãi Học Viên)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh quyền lợi |
| `title` | `varchar(255)` | | Không | | Tiêu đề đặc quyền ưu đãi |
| `provider_company`| `varchar(255)`| | Có | | Doanh nghiệp tài trợ/cung cấp ưu đãi |
| `discount_value`| `varchar(100)` | | Có | | Mức ưu đãi (VD: Giảm 20% thẻ phòng Golf, Miễn phí phòng chờ VIP) |
| `terms` | `text` | | Có | | Điều kiện áp dụng đặc quyền |
| `expiry_date` | `date` | | Có | | Ngày hết hạn ưu đãi |

---

### 3.10. Phân hệ Nhật Ký An Ninh & Cài Đặt Hệ Thống

#### Bảng 31: `public.activity_logs` (Nhật Ký Thao Tác & Audit Trail)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh bản ghi log |
| `user_id` | `uuid` | FK -> `ceohn10_users(id)` | Có | | Khóa ngoại người thực hiện thao tác |
| `action_code` | `varchar(100)` | | Không | | Mã hành động: `LOGIN`, `UPDATE_PERMISSION`, `CREATE_EVENT`, `APPROVE_EXPENSE` |
| `target_entity` | `varchar(100)` | | Có | | Bảng dữ liệu bị tác động (`events`, `transactions`, `app_settings`) |
| `target_id` | `varchar(100)` | | Có | | Khóa chính của bản ghi bị tác động |
| `ip_address` | `varchar(50)` | | Có | | Địa chỉ IP của máy khách |
| `user_agent` | `text` | | Có | | Trình duyệt / Ứng dụng gửi yêu cầu |
| `changes_json` | `jsonb` | | Có | `'{}'` | Chi tiết dữ liệu trước và sau khi thay đổi (diff) |
| `created_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm thực hiện thao tác |

#### Bảng 32: `public.app_settings` (Cấu Hình Hệ Thống & Ma Trận Phân Quyền)
*Lưu trữ cấu hình toàn hệ thống, đặc biệt là `crm_permission_matrix` và `ai_permission_matrix`.*
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Nullable | Giá Trị Mặc Định | Mô Tả Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `uuid` | PK | Không | `gen_random_uuid()` | Định danh bản ghi cấu hình |
| `key` | `varchar(100)` | UQ | Không | | Khóa cấu hình: `crm_permission_matrix`, `ai_permission_matrix`, `general_config` |
| `value` | `jsonb` | | Không | | Dữ liệu cấu hình định dạng JSONB linh hoạt |
| `description` | `text` | | Có | | Ghi chú ý nghĩa và mục đích của cấu hình |
| `updated_by` | `uuid` | FK -> `ceohn10_users(id)` | Có | | Lãnh đạo/Admin thực hiện cập nhật |
| `updated_at` | `timestamptz` | | Không | `CURRENT_TIMESTAMP` | Thời điểm lưu cấu hình gần nhất |

---

## 4. MA TRẬN QUAN HỆ KHÓA NGOẠI (FOREIGN KEY CONSTRAINTS)

```sql
-- Liên kết Người dùng & Doanh nghiệp
ALTER TABLE public.members ADD CONSTRAINT fk_members_user FOREIGN KEY (user_id) REFERENCES public.ceohn10_users(id) ON DELETE SET NULL;
ALTER TABLE public.members ADD CONSTRAINT fk_members_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.departments ADD CONSTRAINT fk_departments_leader FOREIGN KEY (leader_id) REFERENCES public.members(id) ON DELETE SET NULL;
ALTER TABLE public.department_members ADD CONSTRAINT fk_dep_mem_dep FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;
ALTER TABLE public.department_members ADD CONSTRAINT fk_dep_mem_mem FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Liên kết Lớp học & Điểm danh
ALTER TABLE public.trainings ADD CONSTRAINT fk_trainings_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;
ALTER TABLE public.training_sessions ADD CONSTRAINT fk_sessions_training FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;
ALTER TABLE public.training_attendees ADD CONSTRAINT fk_att_session FOREIGN KEY (session_id) REFERENCES public.training_sessions(id) ON DELETE CASCADE;
ALTER TABLE public.training_attendees ADD CONSTRAINT fk_att_member FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Liên kết Sự kiện & Vé & Bốc thăm & Biểu quyết
ALTER TABLE public.event_registrations ADD CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.event_registrations ADD CONSTRAINT fk_reg_member FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;
ALTER TABLE public.lucky_draw_prizes ADD CONSTRAINT fk_prize_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.lucky_draw_history ADD CONSTRAINT fk_history_prize FOREIGN KEY (prize_id) REFERENCES public.lucky_draw_prizes(id) ON DELETE CASCADE;
ALTER TABLE public.lucky_draw_history ADD CONSTRAINT fk_history_reg FOREIGN KEY (registration_id) REFERENCES public.event_registrations(id) ON DELETE CASCADE;
ALTER TABLE public.event_votes ADD CONSTRAINT fk_votes_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.event_vote_results ADD CONSTRAINT fk_results_vote FOREIGN KEY (vote_id) REFERENCES public.event_votes(id) ON DELETE CASCADE;
ALTER TABLE public.event_vote_results ADD CONSTRAINT fk_results_member FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Liên kết Tài trợ & Hiện vật
ALTER TABLE public.sponsors ADD CONSTRAINT fk_sponsors_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.sponsors ADD CONSTRAINT fk_sponsors_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;
ALTER TABLE public.sponsor_items ADD CONSTRAINT fk_items_sponsor FOREIGN KEY (sponsor_id) REFERENCES public.sponsors(id) ON DELETE CASCADE;

-- Liên kết Kế toán Thu Chi
ALTER TABLE public.transactions ADD CONSTRAINT fk_trans_category FOREIGN KEY (category_id) REFERENCES public.transaction_categories(id) ON DELETE RESTRICT;
ALTER TABLE public.transactions ADD CONSTRAINT fk_trans_member FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD CONSTRAINT fk_trans_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD CONSTRAINT fk_trans_training FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD CONSTRAINT fk_trans_approver FOREIGN KEY (approved_by) REFERENCES public.ceohn10_users(id) ON DELETE SET NULL;
ALTER TABLE public.finance_reports ADD CONSTRAINT fk_reports_template FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE SET NULL;
ALTER TABLE public.finance_reports ADD CONSTRAINT fk_reports_user FOREIGN KEY (created_by) REFERENCES public.ceohn10_users(id) ON DELETE RESTRICT;
```

---

## 5. CHIẾN LƯỢC ĐÁNH CHỈ MỤC TỐI ƯU HIỆU NĂNG (INDEXING STRATEGY)

Nhằm đảm bảo tốc độ phản hồi API dưới 100ms trên máy chủ CSDL PgBouncer `113.20.107.184:6432`, hệ thống triển khai các chỉ mục sau:

```sql
-- 1. Tìm kiếm và đăng nhập
CREATE INDEX idx_users_email ON public.ceohn10_users(email);
CREATE INDEX idx_users_phone ON public.ceohn10_users(phone);
CREATE INDEX idx_members_code ON public.members(member_code);
CREATE INDEX idx_members_user_id ON public.members(user_id);
CREATE INDEX idx_companies_tax_code ON public.companies(tax_code);

-- 2. Quét QR điểm danh và soát vé E-Ticket
CREATE UNIQUE INDEX idx_training_sessions_qr ON public.training_sessions(qr_checkin_code) WHERE qr_checkin_code IS NOT NULL;
CREATE UNIQUE INDEX idx_event_reg_ticket ON public.event_registrations(ticket_code);
CREATE INDEX idx_event_reg_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_reg_checkin ON public.event_registrations(event_id, checkin_status);

-- 3. Truy vấn tài chính, thu chi & 4 nguồn quỹ tài trợ
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_date ON public.transactions(transacted_at DESC);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_sponsors_fund_type ON public.sponsors(sponsor_fund_type);

-- 4. Tìm kiếm nhanh JSONB (Ma trận RBAC và AI)
CREATE INDEX idx_app_settings_key ON public.app_settings(key);
CREATE INDEX idx_app_settings_value_gin ON public.app_settings USING GIN (value jsonb_path_ops);

-- 5. Lọc thông báo và audit log
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notif_recipients_mem_read ON public.notification_recipients(member_id, is_read);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);
```

---

## 6. DỮ LIỆU KHỞI TẠO MẪU HẠT NHÂN (CORE SEED DATA)

### 6.1. Khởi tạo 4 Sự Kiện Cố Định Thường Niên
```sql
INSERT INTO public.events (id, title, event_type, is_fixed, fixed_date_code, start_time, location, capacity, status)
VALUES
('e0000000-0000-4000-8000-000000000001', 'Lễ Khai Giảng Lớp Doanh Nhân CEO HN10', 'fixed', true, '15_03', '2026-03-15 08:00:00+07', 'Trung tâm Hội nghị Quốc gia Hà Nội', 500, 'published'),
('e0000000-0000-4000-8000-000000000002', 'Hành Trình Teambuilding & Chiến Binh Doanh Nhân CEO HN10', 'fixed', true, '18_07', '2026-07-18 07:00:00+07', 'FLC Sầm Sơn Beach Resort', 300, 'published'),
('e0000000-0000-4000-8000-000000000003', 'Year End Party 2026 & Gala Dạ Tiệc Kết Nối Doanh Nhân', 'fixed', true, '26_12', '2026-12-26 17:30:00+07', 'Khách sạn JW Marriott Hà Nội', 600, 'published'),
('e0000000-0000-4000-8000-000000000004', 'Lễ Bế Giảng & Vinh Danh Doanh Nhân Thành Đạt CEO HN10', 'fixed', true, '16_01', '2027-01-16 08:30:00+07', 'Đại học Quốc gia Hà Nội', 400, 'published')
ON CONFLICT (id) DO NOTHING;
```

### 6.2. Khởi tạo Sổ Quỹ Hội 2.1 Tỷ VNĐ
```sql
-- Tạo danh mục thu Quỹ Hội
INSERT INTO public.transaction_categories (id, code, name, type)
VALUES ('c0000000-0000-4000-8000-000000000001', 'DUES', 'Hội phí niên liễm & Đóng góp Quỹ Lớp', 'thu')
ON CONFLICT (code) DO NOTHING;

-- Ghi nhận khoản nộp Quỹ khởi tạo ban đầu = 2.100.000.000 VNĐ
INSERT INTO public.transactions (id, voucher_code, transaction_type, category_id, amount, payment_method, transacted_at, description, payer_receiver, approval_status)
VALUES
('t0000000-0000-4000-8000-000000000001', 'PT-HN10-INIT-01', 'thu', 'c0000000-0000-4000-8000-000000000001', 25000000, 'bank_transfer', '2026-11-10 10:00:00+07', 'Đóng quỹ lớp đợt 1', 'Ban Cán Sự CEO HN10', 'approved'),
('t0000000-0000-4000-8000-000000000002', 'PT-HN10-INIT-02', 'thu', 'c0000000-0000-4000-8000-000000000001', 2075000000, 'bank_transfer', '2026-11-16 09:30:00+07', 'Nộp quỹ đại hội và kinh phí duy trì hoạt động năm 2026', 'Tập thể Học viên CEO HN10', 'approved')
ON CONFLICT (voucher_code) DO NOTHING;
```
