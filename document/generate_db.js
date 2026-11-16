const fs = require('fs');
const path = require('path');

const dbContent = `# THIẾT KẾ CƠ SỞ DỮ LIỆU POSTGRESQL HỆ THỐNG CEO HN10 (HANOIBA)
## DATABASE DESIGN SPECIFICATION - POSTGRESQL 113.20.107.184:6432
*Mã tài liệu: DB-CEOHN10-ENTERPRISE-V1.0*  
*Đơn vị chủ quản: CLB Doanh Nhân CEO HN10 — Trực thuộc Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA)*  
*Cơ sở dữ liệu trung tâm: PostgreSQL 113.20.107.184:6432 (Database: ceohn10_project)*  
*Tài khoản vận hành: app1 (Kết nối bảo mật qua PgBouncer Pooler)*  
*Thời điểm ban hành: Tháng 11/2026*  

---

## MỤC LỤC
1. **TỔNG QUAN KIẾN TRÚC CƠ SỞ DỮ LIỆU**
   - 1.1. Thông số máy chủ & Chuỗi kết nối chuẩn
   - 1.2. Nguyên tắc toàn vẹn dữ liệu (STRICT DATABASE LAW & NO-MOCK)
   - 1.3. Sơ đồ quan hệ thực thể (Entity Relationship Diagram - ERD)
2. **ĐẶC TẢ CHI TIẾT CÁC BẢNG DỮ LIỆU (DATABASE SCHEMAS)**
   - 2.1. Nhóm Người dùng & Hội viên (\`vione_users\`, \`members\`, \`companies\`)
   - 2.2. Nhóm Phân hệ Sự kiện (\`events\`, \`event_registrations\`)
   - 2.3. Nhóm Phân hệ Khóa học / Buổi học (\`trainings\`, \`training_attendees\`)
   - 2.4. Nhóm Khai báo Vật tư Hậu cần (\`supplies\`)
   - 2.5. Nhóm Quản lý Nhà tài trợ (\`sponsors\`)
   - 2.6. Nhóm Quản lý 2 Túi Quỹ & Tài chính (\`transactions\`, \`expenses\`, \`member_dues\`)
   - 2.7. Nhóm Kho Tài liệu số hóa tập trung (\`documents\`)
   - 2.8. Nhóm Phản ánh, Góp ý & Khảo sát (\`feedbacks\`)
   - 2.9. Nhóm Biểu quyết điện tử (\`votes\`, \`vote_submissions\`)
   - 2.10. Nhóm Quản lý Mẫu thông báo tùy biến (\`notifications\`, \`notification_templates\`)
   - 2.11. Nhóm Phân quyền vai trò RBAC (\`user_roles\`, \`role_permissions\`)
3. **MA TRẬN RÀNG BUỘC TOÀN VẸN & KHÓA NGOẠI (FOREIGN KEYS & CONSTRAINTS)**
4. **CHIẾN LƯỢC LẬP CHỈ MỤC TỐI ƯU TRUY VẤN (INDEXING STRATEGY)**
5. **DỮ LIỆU HẠT NHÂN MỒI SẴN (CORE SEED DATA: 4 SỰ KIỆN & 30 KHÓA HỌC)**

---

## 1. TỔNG QUAN KIẾN TRÚC CƠ SỞ DỮ LIỆU

### 1.1. Thông số máy chủ & Chuỗi kết nối chuẩn
- **Địa chỉ máy chủ (Host)**: \`113.20.107.184\`
- **Cổng kết nối (Port)**: \`6432\` (Kết nối qua PgBouncer connection pooler)
- **Tên cơ sở dữ liệu (Database Name)**: \`ceohn10_project\`
- **Tài khoản (Username)**: \`app1\`
- **Mật khẩu (Password)**: \`5^S0CEpvYwC1(#YN1UoJ\`
- **Chuỗi kết nối tiêu chuẩn (Connection Strings)**:
  \`\`\`text
  postgresql://app1:5^S0CEpvYwC1(#YN1UoJ@113.20.107.184:6432/ceohn10_project?pgbouncer=true
  jdbc:postgresql://113.20.107.184:6432/ceohn10_project
  \`\`\`

### 1.2. Nguyên tắc toàn vẹn dữ liệu (STRICT DATABASE LAW & NO-MOCK)
- **CƠ SỞ DỮ LIỆU DUY NHẤT**: Mọi nghiệp vụ lưu trữ (INSERT, UPDATE, DELETE) và hiển thị dữ liệu (SELECT) của toàn bộ hệ thống Web CRM và Mobile App bắt buộc phải đọc/ghi trực tiếp vào CSDL \`113.20.107.184:6432\`. Tuyệt đối không trỏ sang CSDL khác.
- **TUYỆT ĐỐI KHÔNG DÙNG DỮ LIỆU MOCK / FAKE**: Khi CSDL gặp lỗi kết nối hoặc PgBouncer retry, hệ thống phải thông báo lỗi rõ ràng, minh bạch nguyên nhân, không dùng mảng tĩnh giả lập để che giấu trạng thái lỗi.

### 1.3. Sơ đồ quan hệ thực thể (Entity Relationship Diagram - ERD)

\`\`\`mermaid
erDiagram
    vione_users ||--o| members : "hồ sơ hội viên"
    members }|--|| companies : "thuộc doanh nghiệp"
    vione_users ||--o{ user_roles : "gán vai trò"
    user_roles }|--|| role_permissions : "quyền hạn vai trò"
    
    events ||--o{ event_registrations : "đăng ký tham gia"
    events ||--o{ supplies : "vật tư sự kiện"
    events ||--o{ expenses : "chi phí tổ chức"
    
    trainings ||--o{ training_attendees : "học viên điểm danh"
    trainings ||--o{ supplies : "vật tư buổi học"
    
    sponsors ||--o{ supplies : "cung cấp hiện vật"
    sponsors ||--o{ transactions : "ghi nhận tài trợ tiền"
    
    transactions }|--o| expenses : "chứng từ chi quỹ"
    
    events ||--o{ documents : "album ảnh media"
    trainings ||--o{ documents : "slide đào tạo"
    
    vione_users ||--o{ feedbacks : "góp ý phản hồi"
    events ||--o{ feedbacks : "đánh giá sao sự kiện"
    trainings ||--o{ feedbacks : "góp ý buổi học"
\`\`\`

---

## 2. ĐẶC TẢ CHI TIẾT CÁC BẢNG DỮ LIỆU (DATABASE SCHEMAS)

### 2.1. Nhóm Người dùng & Hội viên

#### Bảng \`public.vione_users\` (Tài khoản người dùng cơ sở)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh duy nhất người dùng |
| \`email\` | \`varchar(255)\` | UQ | Không | | Email đăng nhập chính thức |
| \`password_hash\` | \`varchar(255)\` | | Không | | Mật khẩu băm chuẩn bcrypt |
| \`phone\` | \`varchar(20)\` | UQ | Có | | Số điện thoại liên hệ |
| \`full_name\` | \`varchar(150)\` | | Không | | Họ và tên đầy đủ |
| \`status\` | \`varchar(50)\` | | Không | \`'active'\` | Trạng thái: active, pending, locked |
| \`executive_role\` | \`varchar(100)\` | | Có | | Vai trò ban chuyên trách |
| \`created_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Thời điểm khởi tạo |
| \`updated_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Thời điểm cập nhật cuối |

#### Bảng \`public.members\` (Hồ sơ 360 độ Hội viên Doanh nhân)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh hồ sơ hội viên |
| \`user_id\` | \`uuid\` | FK | Có | | Liên kết \`vione_users(id)\` |
| \`member_code\` | \`varchar(50)\` | UQ | Không | | Mã hội viên (VD: HN10-001) |
| \`full_name\` | \`varchar(150)\` | | Không | | Họ tên hội viên |
| \`company_id\` | \`uuid\` | FK | Có | | Liên kết \`companies(id)\` |
| \`position\` | \`varchar(100)\` | | Có | | Chức danh trong doanh nghiệp |
| \`phone\` | \`varchar(20)\` | | Có | | Số điện thoại cá nhân |
| \`email\` | \`varchar(255)\` | | Có | | Email cá nhân |
| \`avatar_url\` | \`text\` | | Có | | Đường dẫn ảnh đại diện |
| \`bio\` | \`text\` | | Có | | Tiểu sử / Giới thiệu năng lực |
| \`join_date\` | \`date\` | | Có | | Ngày kết nạp vào CLB |
| \`status\` | \`varchar(50)\` | | Không | \`'active'\` | Trạng thái sinh hoạt hội viên |

#### Bảng \`public.companies\` (Hồ sơ Doanh nghiệp thành viên)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh doanh nghiệp |
| \`company_name\` | \`varchar(255)\` | | Không | | Tên pháp nhân doanh nghiệp |
| \`tax_code\` | \`varchar(50)\` | UQ | Có | | Mã số thuế doanh nghiệp |
| \`industry\` | \`varchar(100)\` | | Có | | Ngành nghề kinh doanh chính |
| \`website\` | \`varchar(255)\` | | Có | | Địa chỉ website doanh nghiệp |
| \`address\` | \`text\` | | Có | | Trụ sở chính doanh nghiệp |
| \`logo_url\` | \`text\` | | Có | | Logo doanh nghiệp |
| \`created_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Thời điểm tạo |

---

### 2.2. Nhóm Phân hệ Sự kiện

#### Bảng \`public.events\` (Sự kiện Gala, Đại hội & Hội thảo)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh duy nhất sự kiện |
| \`title\` | \`varchar(255)\` | | Không | | Tiêu đề sự kiện |
| \`description\` | \`text\` | | Có | | Nội dung giới thiệu chi tiết |
| \`event_type\` | \`varchar(50)\` | | Không | \`'standard'\` | Loại: fixed (cố định), standard (linh hoạt) |
| \`start_time\` | \`timestamptz\` | | Không | | Thời gian bắt đầu |
| \`end_time\` | \`timestamptz\` | | Có | | Thời gian kết thúc |
| \`location\` | \`text\` | | Có | | Địa điểm tổ chức sự kiện |
| \`is_paid\` | \`boolean\` | | Không | \`false\` | Sự kiện có phí (true) hay miễn phí (false) |
| \`fee_amount\` | \`numeric(15,2)\` | | Không | \`0\` | Mức phí tham dự (VNĐ) |
| \`capacity\` | \`integer\` | | Không | \`100\` | Sức chứa tối đa (ngưỡng báo đủ chỗ) |
| \`registered_count\` | \`integer\` | | Không | \`0\` | Số lượng người đã đăng ký thực tế |
| \`qr_code_url\` | \`text\` | | Có | | Mã QR đường link đăng ký public |
| \`banner_url\` | \`text\` | | Có | | Ảnh poster / banner sự kiện |
| \`status\` | \`varchar(50)\` | | Không | \`'published'\` | Trạng thái: draft, published, ongoing, closed |
| \`created_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Thời điểm tạo |

#### Bảng \`public.event_registrations\` (Đăng ký tham dự & Soát vé QR)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh vé đăng ký |
| \`event_id\` | \`uuid\` | FK | Không | | Liên kết \`events(id)\` |
| \`user_id\` | \`uuid\` | FK | Có | | Liên kết \`vione_users(id)\` (nếu là hội viên) |
| \`guest_name\` | \`varchar(150)\` | | Không | | Họ tên người tham dự |
| \`guest_phone\` | \`varchar(20)\` | | Có | | Số điện thoại người tham dự |
| \`guest_email\` | \`varchar(255)\` | | Có | | Email nhận mã vé QR |
| \`ticket_code\` | \`varchar(50)\` | UQ | Không | | Mã vé điện tử độc bản |
| \`checkin_status\` | \`boolean\` | | Không | \`false\` | Trạng thái đã checkin qua QR |
| \`checkin_time\` | \`timestamptz\` | | Có | | Thời điểm quét mã checkin thực tế |
| \`registered_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Thời điểm ghi danh |

---

### 2.3. Nhóm Phân hệ Khóa học / Buổi đào tạo

#### Bảng \`public.trainings\` (30 Khóa học CEO HN10 & Chuyên đề)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh khóa học/buổi học |
| \`title\` | \`varchar(255)\` | | Không | | Tên khóa học / chuyên đề |
| \`description\` | \`text\` | | Có | | Mô tả chi tiết nội dung đào tạo |
| \`instructor\` | \`varchar(150)\` | | Có | | Chuyên gia / Giảng viên đào tạo |
| \`schedule_type\` | \`varchar(50)\` | | Không | \`'flexible'\` | Loại: fixed_saturday (Thứ 7), flexible |
| \`start_time\` | \`timestamptz\` | | Không | | Thời gian bắt đầu buổi học |
| \`end_time\` | \`timestamptz\` | | Có | | Thời gian kết thúc |
| \`location\` | \`text\` | | Có | | Phòng học / Link Zoom online |
| \`agenda_slots\` | \`jsonb\` | | Có | \`'[]'::jsonb\` | Chi tiết thời gian biểu (Agenda slots) |
| \`slide_url\` | \`text\` | | Có | | Đường dẫn slide tài liệu đào tạo |
| \`media_urls\` | \`jsonb\` | | Có | \`'[]'::jsonb\` | Danh sách đường dẫn video/ảnh tư liệu |
| \`capacity\` | \`integer\` | | Không | \`50\` | Sức chứa tối đa của lớp học |
| \`status\` | \`varchar(50)\` | | Không | \`'upcoming'\` | Trạng thái: upcoming, ongoing, completed |
| \`created_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Thời điểm khởi tạo |

#### Bảng \`public.training_attendees\` (Học viên & Điểm danh lớp học)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh học viên buổi học |
| \`training_id\` | \`uuid\` | FK | Không | | Liên kết \`trainings(id)\` |
| \`user_id\` | \`uuid\` | FK | Không | | Liên kết \`vione_users(id)\` |
| \`registered_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Thời điểm đăng ký học |
| \`checkin_status\` | \`boolean\` | | Không | \`false\` | Điểm danh có mặt tại lớp |
| \`checkin_time\` | \`timestamptz\` | | Có | | Thời điểm điểm danh |
| \`slide_received\` | \`boolean\` | | Không | \`false\` | Đã nhận được slide tài liệu |

---

### 2.4. Nhóm Khai báo Vật tư Hậu cần

#### Bảng \`public.supplies\` (Vật dụng hỗ trợ Sự kiện & Khóa học)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh vật dụng hậu cần |
| \`target_type\` | \`varchar(50)\` | | Không | | Đối tượng: event (sự kiện) hoặc training (khóa học) |
| \`target_id\` | \`uuid\` | | Không | | ID của sự kiện hoặc khóa học tương ứng |
| \`target_name\` | \`varchar(255)\` | | Không | | Tên sự kiện hoặc khóa học |
| \`item_name\` | \`varchar(255)\` | | Không | | Tên trang thiết bị, vật dụng (Standee, máy chiếu...) |
| \`quantity\` | \`integer\` | | Không | \`1\` | Số lượng cần chuẩn bị |
| \`unit\` | \`varchar(50)\` | | Không | \`'Cái'\` | Đơn vị tính (Cái, Bộ, Khung, Chiếc) |
| \`is_from_sponsor\` | \`boolean\` | | Không | \`false\` | Lấy từ Nhà tài trợ (true) hay tự mua sắm (false) |
| \`sponsor_id\` | \`uuid\` | FK | Có | | Liên kết \`sponsors(id)\` nếu lấy từ nhà tài trợ |
| \`sponsor_name\` | \`varchar(150)\` | | Có | | Tên nhà tài trợ cung cấp hiện vật |
| \`estimated_cost\` | \`numeric(15,2)\` | | Không | \`0\` | Chi phí mua sắm ước tính (VNĐ) |
| \`department\` | \`varchar(100)\` | | Không | \`'Ban Sự kiện & Hậu cần'\` | Ban chuyên môn chịu trách nhiệm khai báo |
| \`status\` | \`varchar(50)\` | | Không | \`'needed'\` | Trạng thái: needed, requested, allocated, ready |
| \`note\` | \`text\` | | Có | | Ghi chú quy cách chuẩn bị |
| \`created_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Thời điểm khai báo |

---

### 2.5. Nhóm Quản lý Nhà tài trợ

#### Bảng \`public.sponsors\` (Hồ sơ Nhà tài trợ Tiền mặt & Hiện vật)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh nhà tài trợ |
| \`name\` | \`varchar(150)\` | | Không | | Họ và tên người đại diện tài trợ |
| \`birth_date\` | \`date\` | | Có | | Ngày tháng năm sinh |
| \`age\` | \`integer\` | | Có | | Tuổi (tự động tính từ birth_date) |
| \`phone\` | \`varchar(20)\` | | Có | | Số điện thoại liên hệ |
| \`email\` | \`varchar(255)\` | | Có | | Email nhận thư cảm ơn tự động |
| \`website\` | \`varchar(255)\` | | Có | | Địa chỉ website doanh nghiệp tài trợ |
| \`company_name\` | \`varchar(255)\` | | Có | | Tên doanh nghiệp / Đơn vị tài trợ |
| \`sponsor_type\` | \`varchar(50)\` | | Không | \`'cash'\` | Hình thức: cash (tiền mặt), in_kind (hiện vật) |
| \`total_amount\` | \`numeric(15,2)\` | | Không | \`0\` | Tổng giá trị tài trợ (tiền hoặc định giá quy đổi) |
| \`in_kind_items\` | \`jsonb\` | | Có | \`'[]'::jsonb\` | Danh mục chi tiết các món hiện vật trong kho |
| \`thank_you_sent\`| \`boolean\` | | Không | \`false\` | Trạng thái đã gửi email cảm ơn |
| \`note\` | \`text\` | | Có | | Ghi chú thỏa thuận tài trợ |
| \`created_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Thời điểm tiếp nhận tài trợ |

---

### 2.6. Nhóm Quản lý 2 Túi Quỹ & Tài chính

#### Bảng \`public.transactions\` (Sổ nhật ký giao dịch tài chính thu - chi)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh giao dịch |
| \`code\` | \`varchar(50)\` | UQ | Không | | Mã chứng từ giao dịch (VD: TXN-2026-001) |
| \`type\` | \`varchar(20)\` | | Không | | Loại giao dịch: income (thu), expense (chi) |
| \`amount\` | \`numeric(15,2)\` | | Không | | Số tiền giao dịch (VNĐ) |
| \`fund_type\` | \`varchar(50)\` | | Không | \`'general_fund'\` | **Túi quỹ**: general_fund (Chung) hoặc sponsorship_fund (Tài trợ) |
| \`category\` | \`varchar(100)\` | | Có | | Hạng mục: hoi_phi, tai_tro, su_kien, hieu_hy, hau_can |
| \`department\` | \`varchar(100)\` | | Có | | Ban chuyên môn phụ trách khoản thu/chi |
| \`target_event_id\`| \`uuid\` | FK | Có | | Sự kiện liên quan đến khoản chi |
| \`target_event_name\`| \`varchar(255)\`| | Có | | Tên sự kiện liên quan |
| \`recipient_name\`| \`varchar(150)\` | | Có | | **Họ tên người nhận tiền** (đối với khoản chi) |
| \`payment_method\`| \`varchar(50)\` | | Không | \`'transfer'\` | Phương thức: transfer, cash, vietqr, momo |
| \`status\` | \`varchar(50)\` | | Không | \`'completed'\` | Trạng thái: pending, completed, rejected |
| \`created_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Ngày giờ phát sinh giao dịch |

#### Bảng \`public.expenses\` (Phiếu chi ngân sách & Xuất PDF 5 chữ ký)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh phiếu chi |
| \`code\` | \`varchar(50)\` | UQ | Không | | Mã phiếu chi kế toán (VD: PC-2026-11-001) |
| \`title\` | \`varchar(255)\` | | Không | | Tiêu đề / Lý do chi ngân sách |
| \`amount\` | \`numeric(15,2)\` | | Không | | Số tiền chi (VNĐ) |
| \`fund_type\` | \`varchar(50)\` | | Không | \`'general_fund'\` | Nguồn túi quỹ: general_fund hoặc sponsorship_fund |
| \`department\` | \`varchar(100)\` | | Không | | Ban chuyên môn đề xuất chi |
| \`target_event_id\`| \`uuid\` | FK | Có | | Sự kiện chịu chi phí |
| \`recipient_name\`| \`varchar(150)\` | | Không | | **Người nhận tiền chi trả** |
| \`recipient_phone\`| \`varchar(20)\` | | Có | | SĐT người nhận tiền |
| \`status\` | \`varchar(50)\` | | Không | \`'draft'\` | Trạng thái: draft, requested, approved, paid |
| \`approved_by\` | \`varchar(150)\` | | Có | | Người duyệt (Chủ tịch CLB / Trưởng Ban Tài Chính) |
| \`created_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Thời điểm lập phiếu |

---

### 2.7. Nhóm Kho Tài liệu số hóa tập trung

#### Bảng \`public.documents\` (Văn thư số, Slide đào tạo & Album Media)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh tài liệu |
| \`title\` | \`varchar(255)\` | | Không | | Tên tài liệu / Tên album ảnh |
| \`file_url\` | \`text\` | | Không | | Đường dẫn tải tệp hoặc liên kết album cloud |
| \`file_type\` | \`varchar(50)\` | | Có | | Định dạng: pdf, docx, xlsx, link, zip |
| \`file_size\` | \`bigint\` | | Có | \`0\` | Kích thước tệp (bytes) |
| \`category\` | \`varchar(100)\` | | Không | | Danh mục: training_materials, event_media, legal, profiles |
| \`related_id\` | \`uuid\` | | Có | | ID của sự kiện hoặc khóa học liên quan |
| \`access_level\` | \`varchar(50)\` | | Không | \`'public'\` | Mức truy cập: public (toàn CLB), board_only (BĐH) |
| \`uploaded_by\` | \`uuid\` | FK | Có | | Liên kết \`vione_users(id)\` người tải lên |
| \`created_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Thời điểm lưu trữ |

---

### 2.8. Nhóm Phản ánh, Góp ý & Đánh giá

#### Bảng \`public.feedbacks\` (Ý kiến hội viên, Đánh giá sao sự kiện & khóa học)
| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Giá trị mặc định | Mô tả ý nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| \`id\` | \`uuid\` | PK | Không | \`gen_random_uuid()\` | Định danh phản ánh |
| \`target_type\` | \`varchar(50)\` | | Không | | Đối tượng: event, training, association (chung) |
| \`target_id\` | \`uuid\` | | Có | | ID sự kiện hoặc khóa học được đánh giá |
| \`user_id\` | \`uuid\` | FK | Có | | Người đóng góp ý kiến (có thể ẩn danh) |
| \`rating\` | \`integer\` | | Có | | Điểm số đánh giá sao (1 đến 5 sao) |
| \`comment\` | \`text\` | | Có | | Nội dung văn bản đóng góp ý kiến |
| \`attachment_url\`| \`text\` | | Có | | Đường dẫn tệp đính kèm góp ý (file Word/PDF) |
| \`status\` | \`varchar(50)\` | | Không | \`'pending'\` | Trạng thái: pending, reviewing, resolved |
| \`resolved_note\` | \`text\` | | Có | | Phản hồi giải quyết của ban chuyên trách |
| \`created_at\` | \`timestamptz\` | | Không | \`CURRENT_TIMESTAMP\` | Thời điểm gửi phản ánh |

---

### 2.9. Nhóm Biểu quyết điện tử

#### Bảng \`public.votes\` & \`public.vote_submissions\`
- **\`votes\`**: Lưu thông tin cuộc biểu quyết (\`id\`, \`title\`, \`description\`, \`options\` JSONB, \`start_time\`, \`end_time\`, \`is_closed\`, \`created_by\`).
- **\`vote_submissions\`**: Lưu lượt bỏ phiếu của hội viên (\`id\`, \`vote_id\`, \`user_id\`, \`selected_option\`, \`submitted_at\`), có ràng buộc Unique \`(vote_id, user_id)\` đảm bảo mỗi hội viên chỉ bỏ phiếu 1 lần.

---

### 2.10. Nhóm Mẫu thông báo tùy biến động

#### Bảng \`public.notification_templates\`
- Quản lý các mẫu thông báo: \`template_code\`, \`title\`, \`category\`, \`channels\` (in_app, email, zalo), \`fields_schema\` (JSONB - cấu hình danh sách trường động cho phép thêm/xóa tùy ý gồm key, label, type, required).

---

### 2.11. Nhóm Phân quyền RBAC

#### Bảng \`public.user_roles\` & \`public.role_permissions\`
- **\`user_roles\`**: Liên kết người dùng và vai trò (\`user_id\`, \`role\`). Trigger \`trg_guard_user_roles\` an toàn trả về \`OLD\` trên lệnh DELETE của tài khoản ứng dụng \`app1\`.
- **\`role_permissions\`**: Lưu trữ ma trận quyền hành vi theo từng phân hệ chức năng (\`role\`, \`module\`, \`can_view\`, \`can_create\`, \`can_edit\`, \`can_delete\`, \`can_approve\`, \`can_export\`).

---

## 3. MA TRẬN RÀNG BUỘC TOÀN VẸN & KHÓA NGOẠI

1. \`fk_members_user\`: \`members.user_id\` -> \`vione_users(id)\` ON DELETE SET NULL.
2. \`fk_members_company\`: \`members.company_id\` -> \`companies(id)\` ON DELETE SET NULL.
3. \`fk_event_reg_event\`: \`event_registrations.event_id\` -> \`events(id)\` ON DELETE CASCADE.
4. \`fk_training_attendees_training\`: \`training_attendees.training_id\` -> \`trainings(id)\` ON DELETE CASCADE.
5. \`fk_supplies_sponsor\`: \`supplies.sponsor_id\` -> \`sponsors(id)\` ON DELETE SET NULL.
6. \`fk_expenses_event\`: \`expenses.target_event_id\` -> \`events(id)\` ON DELETE SET NULL.
7. \`uq_vote_submission\`: UNIQUE \`(vote_id, user_id)\` ngăn chặn bỏ phiếu trùng lặp.

---

## 4. CHIẾN LƯỢC LẬP CHỈ MỤC TỐI ƯU TRUY VẤN (INDEXING STRATEGY)

\`\`\`sql
-- Tối ưu hóa xác thực và phân quyền
CREATE INDEX IF NOT EXISTS idx_vione_users_email ON public.vione_users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Tối ưu hóa truy vấn sự kiện và kiểm tra sức chứa
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_event_reg_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_user_id ON public.event_registrations(user_id);

-- Tối ưu hóa truy vấn khóa học và học viên
CREATE INDEX IF NOT EXISTS idx_trainings_start_time ON public.trainings(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_training_attendees_training ON public.training_attendees(training_id);
CREATE INDEX IF NOT EXISTS idx_training_attendees_user ON public.training_attendees(user_id);

-- Tối ưu hóa quản lý 2 túi quỹ và báo cáo chi
CREATE INDEX IF NOT EXISTS idx_transactions_fund_type ON public.transactions(fund_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_fund_dept ON public.expenses(fund_type, department);

-- Tối ưu hóa kho tài liệu số
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
\`\`\`

---

## 5. DỮ LIỆU HẠT NHÂN MỒI SẴN (CORE SEED DATA)

Hệ thống đã khởi tạo sẵn dữ liệu hạt nhân trong CSDL \`113.20.107.184:6432\`:
1. **4 Sự Kiện Tiêu Biểu**:
   - Gala Chào Năm Mới & Kết Nối Doanh Nhân CEO HN10 (Cố định, Có phí, Capacity 200).
   - Hội Thảo Chuyển Đổi Số AI Cho Lãnh Đạo Doanh Nghiệp (Linh hoạt, Miễn phí, Capacity 150).
   - Diễn Đàn Xúc Tiến Thương Mại B2B Nội Khối Hà Nội (Linh hoạt, Có phí, Capacity 300).
   - Họp Ban Điều Hành Định Kỳ Quý 4/2026 (Cố định, Miễn phí, Capacity 40).
2. **30 Khóa Học Quản Trị Hạt Nhân**:
   - Lộ trình 30 chuyên đề đào tạo từ K01 đến K30 (Chiến lược lãnh đạo, Quản trị tài chính, Marketing B2B, Tối ưu dòng tiền, Quản trị nhân sự thế hệ mới...) diễn ra vào các ngày Thứ 7 hàng tuần.
3. **Danh Mục Kho Hiện Vật Nhà Tài Trợ**:
   - Màn hình LED di động (1 bộ), Standee khung nhôm cuốn VIP (20 chiếc), Gói thiết kế nhận diện thương hiệu (5 gói), Bộ tài liệu hướng dẫn chuyển đổi số (100 cuốn).
4. **Số Dư 2 Túi Quỹ Thực Tế**:
   - Túi Quỹ Chung: 450.000.000 VNĐ.
   - Túi Quỹ Tài Trợ: 250.000.000 VNĐ tiền mặt và 45.000.000 VNĐ quy đổi hiện vật.

---
*Tài liệu Thiết kế Cơ sở Dữ liệu chuẩn mực được phê duyệt áp dụng chính thức.*
`;

fs.writeFileSync(path.join(__dirname, 'THIET_KE_CSDL_POSTGRESQL_CEOHN10.md'), dbContent, 'utf8');
console.log('SUCCESS: Generated THIET_KE_CSDL_POSTGRESQL_CEOHN10.md');
