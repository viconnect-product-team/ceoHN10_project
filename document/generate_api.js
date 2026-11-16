const fs = require('fs');
const path = require('path');

const apiContent = `# ĐẶC TẢ GIAO DIỆN LẬP TRÌNH RESTFUL API HỆ THỐNG CEO HN10 (HANOIBA)
## RESTFUL API DESIGN SPECIFICATION - ENTERPRISE EDITION
*Mã tài liệu: API-CEOHN10-ENTERPRISE-V1.0*  
*Đơn vị chủ quản: CLB Doanh Nhân CEO HN10 — Trực thuộc Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA)*  
*Đơn vị phát triển: VICONNECT - Kiến Trúc Sư Tích Hợp Hệ Thống*  
*Cơ sở dữ liệu trung tâm: PostgreSQL 113.20.107.184:6432 (ceohn10_project)*  
*Thời điểm ban hành: Tháng 11/2026*  

---

## MỤC LỤC
1. **NGUYÊN TẮC THIẾT KẾ RESTFUL API CHUẨN MỰC**
   - 1.1. Base URL & Tiền tố định tuyến
   - 1.2. Mã trạng thái HTTP tiêu chuẩn (HTTP Status Codes)
   - 1.3. Định dạng dữ liệu yêu cầu & phản hồi (JSON Standards)
   - 1.4. Cơ chế phân trang, lọc và sắp xếp
2. **CƠ CHẾ XÁC THỰC & BẢO MẬT PHÂN QUYỀN (JWT & RBAC GUARDS)**
   - 2.1. Cấu trúc Bearer Token trong Authorization Header
   - 2.2. Cơ chế làm mới Access Token qua Refresh Token
   - 2.3. Giải mã và phân quyền theo vai trò thực tế
3. **ĐẶC TẢ CHI TIẾT CÁC PHÂN HỆ API ENDPOINTS**
   - 3.1. Phân hệ Xác thực & Quản trị phiên (Auth Controller)
   - 3.2. Phân hệ Dashboard Tổng quan & Ví 2 Túi Quỹ (Admin Controller)
   - 3.3. Phân hệ Quản lý Sự kiện & Soát vé QR (Events Controller)
   - 3.4. Phân hệ Quản lý 30 Khóa học & Phát Slide (Trainings Controller)
   - 3.5. Phân hệ Khai báo Vật tư Hậu cần & Kho Hiện vật (Supplies Controller)
   - 3.6. Phân hệ Quản lý Tài chính, 2 Túi Quỹ & Xuất Phiếu chi PDF (Expenses Controller)
   - 3.7. Phân hệ Quản lý Nhà tài trợ & Tri ân tự động (Sponsors Controller)
   - 3.8. Phân hệ Kho Tài liệu số hóa tập trung (Documents Controller)
   - 3.9. Phân hệ Tiếp nhận Phản ánh, Góp ý & Khảo sát (Feedbacks Controller)
   - 3.10. Phân hệ Biểu quyết điện tử (Votes Controller)
   - 3.11. Phân hệ Quản lý Mẫu thông báo tùy biến động (Notifications Controller)
   - 3.12. Phân hệ Phân quyền RBAC chế độ kép (RBAC Permissions Controller)
4. **MÔ HÌNH TUẦN HOÀN GỌI API GIỮA CÁC PHÂN HỆ (API DATA LOOP FLOW)**
5. **MÃ LỖI HỆ THỐNG & QUY TRÌNH XỬ LÝ NGOẠI LỆ (ERROR CODES & EXCEPTION HANDLING)**

---

## 1. NGUYÊN TẮC THIẾT KẾ RESTFUL API CHUẨN MỰC

### 1.1. Base URL & Tiền tố định tuyến
- **Môi trường phát triển & kiểm thử**: \`http://113.20.107.184:5000/api\` hoặc \`http://localhost:5000/api\`
- **Môi trường sản xuất chính thức**: \`https://api-ceohn10.viconnect.vn/api\`
- Tất cả các endpoint đều có tiền tố bắt buộc: \`/api\`

### 1.2. Mã trạng thái HTTP tiêu chuẩn (HTTP Status Codes)
- \`200 OK\`: Yêu cầu thực hiện thành công và có trả về dữ liệu payload.
- \`201 Created\`: Bản ghi mới đã được tạo thành công trong CSDL.
- \`400 Bad Request\`: Dữ liệu đầu vào không hợp lệ hoặc thiếu trường bắt buộc.
- \`401 Unauthorized\`: Không có token hoặc token đã hết hạn / không hợp lệ.
- \`403 Forbidden\`: Người dùng không có quyền truy cập chức năng này (RBAC chặn).
- \`404 Not Found\`: Không tìm thấy tài nguyên yêu cầu.
- \`500 Internal Server Error\`: Lỗi xử lý nghiệp vụ hoặc lỗi kết nối máy chủ CSDL.

### 1.3. Định dạng dữ liệu yêu cầu & phản hồi (JSON Standards)
Mọi phản hồi từ hệ thống đều tuân thủ cấu trúc chuẩn hóa:
\`\`\`json
{
  "statusCode": 200,
  "message": "Thao tác thành công",
  "data": { ... },
  "timestamp": "2026-11-16T16:00:00.000Z"
}
\`\`\`

---

## 2. CƠ CHẾ XÁC THỰC & BẢO MẬT PHÂN QUYỀN

### 2.1. Cấu trúc Bearer Token trong Authorization Header
Mọi request tới các endpoint bảo vệ bắt buộc phải đính kèm Header:
\`\`\`http
Authorization: Bearer <access_token_jwt>
\`\`\`

Payload giải mã của Access Token:
\`\`\`json
{
  "sub": "67e1bca9-94e6-4859-b13c-bf93e2b9c4c5",
  "email": "vumikasa6@gmail.com",
  "role": "thanh_vien_ban_tai_chinh",
  "executiveRole": "thanh_vien_ban_tai_chinh",
  "iat": 1794819200,
  "exp": 1794905600
}
\`\`\`

---

## 3. ĐẶC TẢ CHI TIẾT CÁC PHÂN HỆ API ENDPOINTS

### 3.1. Phân hệ Xác thực & Quản trị phiên (Auth Controller)

#### \`POST /api/auth/login\` — Đăng nhập hệ thống (UC-1)
- **Mô tả**: Tiếp nhận thông tin đăng nhập, xác thực mật khẩu bcrypt và cấp phát cặp token JWT.
- **Request Body**:
  \`\`\`json
  {
    "email": "admin@viconnect.vn",
    "password": "Mật khẩu bảo mật"
  }
  \`\`\`
- **Response 200 OK**:
  \`\`\`json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "d8a1f8b2-3c4e-4f5a-9b1c-7e8f9a0b1c2d",
    "user": {
      "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "email": "admin@viconnect.vn",
      "fullName": "Lê Thị Dung",
      "role": "admin",
      "status": "active"
    }
  }
  \`\`\`

#### \`GET /api/users/me\` — Nạp hồ sơ và quyền hạn cá nhân
- **Header**: \`Authorization: Bearer <token>\`
- **Response 200 OK**: Trả về toàn bộ hồ sơ hội viên, ban chuyên trách và danh sách quyền RBAC.

#### \`POST /api/auth/refresh\` — Làm mới Access Token
- **Request Body**: \`{ "refreshToken": "..." }\`
- **Response 200 OK**: Cấp Access Token mới khi phiên làm việc còn hiệu lực.

---

### 3.2. Phân hệ Dashboard Tổng quan & Ví 2 Túi Quỹ (Admin Controller)

#### \`GET /api/admin/funds-overview\` — Tổng quan số dư Ví 2 Túi Quỹ Realtime (UC-5)
- **Mô tả**: Truy vấn trực tiếp CSDL PostgreSQL trả về trạng thái biến động của Túi Quỹ Chung và Túi Quỹ Tài Trợ (Tiền mặt + Kho hiện vật).
- **Header**: \`Authorization: Bearer <token>\`
- **Response 200 OK**:
  \`\`\`json
  {
    "generalFund": {
      "totalBalance": 450000000,
      "totalIncome": 600000000,
      "totalExpense": 150000000,
      "source": "Tổng hợp từ phí hội viên đóng thường niên",
      "purpose": "Chi sự kiện, họp ban, hoạt động hiếu hỷ Ban Đời Sống"
    },
    "sponsorshipFund": {
      "cash": {
        "availableAmount": 250000000,
        "allocatedAmount": 50000000,
        "purpose": "Chi cho sự kiện, buổi học khi ban Sự kiện & Hậu cần xin cấp kinh phí"
      },
      "inKind": {
        "totalEstimatedValue": 45000000,
        "inventory": [
          { "itemName": "Standee khung nhôm", "quantity": 20, "unit": "Chiếc", "sponsor": "Công ty In Ấn ABC" },
          { "itemName": "Màn hình LED di động", "quantity": 1, "unit": "Bộ", "sponsor": "Tập đoàn Công nghệ XYZ" }
        ]
      }
    }
  }
  \`\`\`

---

### 3.3. Phân hệ Quản lý Sự kiện & Soát vé QR (Events Controller)

#### \`GET /api/events\` — Danh sách sự kiện
- **Query Params**: \`page=1\`, \`limit=10\`, \`type=fixed|standard\`, \`status=published\`
- **Response 200 OK**: Danh sách 4+ sự kiện hạt nhân kèm thông tin sức chứa và số lượng đã đăng ký.

#### \`POST /api/events/:id/register\` — Đăng ký sự kiện & Kiểm soát Sức chứa (UC-2)
- **Mô tả**: Ghi danh tham gia sự kiện. Hệ thống tự động kiểm tra số chỗ.
- **Request Body**:
  \`\`\`json
  {
    "guestName": "Nguyễn Văn Hùng",
    "guestPhone": "0912345678",
    "guestEmail": "hung.nv@techcorp.vn"
  }
  \`\`\`
- **Xử lý Capacity Limit**:
  - Nếu \`registered_count < capacity\`: Trả về \`201 Created\` kèm mã vé QR.
  - Nếu \`registered_count >= capacity\`: Trả về mã lỗi \`400 Bad Request\`:
    \`\`\`json
    {
      "statusCode": 400,
      "message": "Sự kiện đã đủ chỗ! Vui lòng liên hệ Ban Tổ Chức để được hỗ trợ."
    }
    \`\`\`

#### \`POST /api/events/:id/media\` — Tải lên Album ảnh & Media sự kiện (UC-2)
- **Mô tả**: Ban Sự Kiện tải link album ảnh Google Drive / tư liệu sự kiện. Hệ thống tự động lưu trữ sang bảng \`public.documents\` danh mục \`event_media\`.
- **Request Body**:
  \`\`\`json
  {
    "mediaUrls": [
      "https://photos.app.goo.gl/ceo-hn10-gala-2026",
      "https://drive.google.com/drive/folders/album-su-kien-hanoiba"
    ]
  }
  \`\`\`
- **Response 200 OK**: Đã liên kết và đồng bộ lưu trữ vào Kho tài liệu.

#### \`POST /api/events/:id/feedbacks\` — Đánh giá & Phản hồi sự kiện (UC-2)
- **Request Body**:
  \`\`\`json
  {
    "rating": 5,
    "comment": "Chương trình tổ chức trang trọng, kết nối được nhiều đối tác chất lượng!"
  }
  \`\`\`

#### \`GET /api/events/my-events\` — Danh sách sự kiện hội viên đã tham gia
- **Response 200 OK**: Danh sách sự kiện hội viên hiện tại đã đăng ký để hiển thị trên Dashboard tổng quan.

---

### 3.4. Phân hệ Quản lý 30 Khóa học & Phát Slide (Trainings Controller)

#### \`GET /api/trainings\` — Danh sách khóa học / buổi đào tạo (UC-3)
- **Query Params**: \`scheduleType=fixed_saturday\`, \`status=upcoming\`
- **Response 200 OK**: Danh sách 30 khóa học CEO HN10 với lộ trình chi tiết.

#### \`POST /api/trainings/:id/send-slides\` — Gửi Slide đào tạo cho học viên (UC-3)
- **Mô tả**: Ban Đào Tạo bấm gửi slide cho học viên đã đăng ký/điểm danh, đồng thời tự động lưu trữ tài liệu vào phân hệ Quản lý tài liệu (\`public.documents\` - \`training_materials\`).
- **Request Body**:
  \`\`\`json
  {
    "slideUrl": "https://ceohn10.viconnect.vn/storage/slides/khoa-hoc-k01-lanh-dao-chien-luoc.pdf",
    "slideTitle": "Slide Bài Giảng Khóa K01: Năng Lực Lãnh Đạo Chiến Lược"
  }
  \`\`\`
- **Response 200 OK**: Đã gửi slide thành công cho toàn bộ học viên và lưu trữ vào Kho tài liệu.

#### \`POST /api/trainings/:id/feedbacks\` — Học viên đóng góp ý kiến (UC-3)
- **Mô tả**: Học viên gửi phản hồi bằng văn bản hoặc đính kèm tệp tin tài liệu.
- **Request Body**:
  \`\`\`json
  {
    "comment": "Nội dung bài giảng rất thực chiến, đề xuất buổi sau có thêm case study thực tế.",
    "attachmentUrl": "https://ceohn10.viconnect.vn/storage/feedbacks/bai-tap-tinh-huong-k01.docx"
  }
  \`\`\`

#### \`POST /api/trainings/:id/media\` — Đính kèm video/ảnh buổi học (UC-3)
- **Request Body**: \`{ "mediaUrls": ["https://youtube.com/watch?v=k01-lecture"] }\`
- **Tác vụ ngầm**: Tự động tạo bản ghi trong \`public.documents\` với danh mục \`event_media\`.

#### \`GET /api/trainings/my/enrolled\` — Khóa học hội viên tham gia
- **Response 200 OK**: Danh sách khóa học hội viên đã ghi danh để hiển thị trên Dashboard tổng quan kèm nút "Tải Slide" và "Góp ý".

---

### 3.5. Phân hệ Khai báo Vật tư Hậu cần (Supplies Controller)

#### \`GET /api/supplies\` — Danh sách vật tư hậu cần khai báo (UC-4)
- **Query Params**: \`targetType=event|training\`, \`targetId=<uuid>\`
- **Response 200 OK**: Danh sách vật dụng cần cho sự kiện/buổi học.

#### \`GET /api/supplies/sponsor-inventory\` — Lấy Kho hiện vật Nhà tài trợ (UC-4)
- **Mô tả**: Trả về danh sách hiện vật tài trợ còn khả dụng để Ban Sự Kiện & Hậu Cần chọn lấy.
- **Response 200 OK**:
  \`\`\`json
  [
    {
      "sponsorId": "a1b2c3d4-...",
      "sponsorName": "Trần Đình Trọng",
      "companyName": "Công ty Thiết Bị Sự Kiện Pro",
      "itemName": "Standee khung nhôm cuốn VIP",
      "availableQuantity": 20,
      "unit": "Chiếc",
      "estimatedValue": 5000000
    }
  ]
  \`\`\`

#### \`POST /api/supplies\` — Khai báo vật tư hỗ trợ (UC-4)
- **Request Body**:
  \`\`\`json
  {
    "targetType": "event",
    "targetId": "e1f2a3b4-...",
    "targetName": "Gala Doanh Nhân CEO HN10 2026",
    "itemName": "Standee khung nhôm cuốn VIP",
    "quantity": 10,
    "unit": "Chiếc",
    "isFromSponsor": true,
    "sponsorId": "a1b2c3d4-...",
    "sponsorName": "Trần Đình Trọng",
    "estimatedCost": 0,
    "department": "Ban Sự kiện & Hậu cần",
    "note": "Lấy từ gói hiện vật tài trợ của Công ty Pro"
  }
  \`\`\`

---

### 3.6. Phân hệ Quản lý Tài chính, 2 Túi Quỹ & Phiếu chi PDF (Expenses Controller)

#### \`POST /api/expenses\` — Lập Phiếu chi ngân sách (UC-5)
- **Mô tả**: Bắt buộc ghi rõ chi vào sự kiện nào, ban nào, từ túi quỹ nào và **ai là người nhận tiền**.
- **Request Body**:
  \`\`\`json
  {
    "title": "Chi tiền thuê âm thanh ánh sáng hội trường Keangnam",
    "amount": 25000000,
    "fundType": "general_fund",
    "department": "Ban Sự kiện & Hậu cần",
    "targetEventId": "e1f2a3b4-...",
    "recipientName": "Công ty TNHH Âm Thanh Ánh Sáng Hà Nội",
    "recipientPhone": "0988776655"
  }
  \`\`\`

#### \`GET /api/expenses/:id/export-pdf-data\` — Dữ liệu Xuất Phiếu Chi PDF 5 Chữ Ký (UC-5)
- **Response 200 OK**:
  \`\`\`json
  {
    "voucherCode": "PC-2026-11-001",
    "date": "16/11/2026",
    "fundName": "Túi Quỹ Chung CEO HN10",
    "department": "Ban Sự kiện & Hậu cần",
    "eventName": "Gala Doanh Nhân CEO HN10 2026",
    "recipientName": "Công ty TNHH Âm Thanh Ánh Sáng Hà Nội",
    "reason": "Chi tiền thuê âm thanh ánh sáng hội trường Keangnam",
    "amount": 25000000,
    "amountInWords": "Hai mươi lăm triệu đồng chẵn",
    "signers": [
      { "role": "Người lập phiếu", "name": "Nguyễn Văn Hậu Cần" },
      { "role": "Người nhận tiền", "name": "Đại diện Âm Thanh Ánh Sáng Hà Nội" },
      { "role": "Kế toán / Thủ quỹ", "name": "Lê Thị Thủ Quỹ" },
      { "role": "Trưởng Ban Tài Chính", "name": "Phạm Văn Tài Chính" },
      { "role": "Chủ tịch CLB", "name": "Chủ Tịch CEO HN10" }
    ]
  }
  \`\`\`

---

### 3.7. Phân hệ Quản lý Nhà tài trợ & Tri ân tự động (Sponsors Controller)

#### \`POST /api/sponsors\` — Tiếp nhận Nhà tài trợ (UC-6)
- **Mô tả**: Hỗ trợ 2 hình thức: Tiền mặt (cộng vào Quỹ Tài Trợ) và Hiện vật (đẩy vào Kho Hiện Vật). Tự động gửi email cảm ơn.
- **Request Body (Tài trợ Tiền mặt)**:
  \`\`\`json
  {
    "name": "Nguyễn Hoàng Minh",
    "birthDate": "1983-05-15",
    "phone": "0903456789",
    "email": "minh.nh@vietgroup.vn",
    "website": "https://vietgroup.vn",
    "companyName": "Tập Đoàn Việt Group",
    "sponsorType": "cash",
    "totalAmount": 50000000,
    "note": "Tài trợ giải Gala CEO HN10 2026"
  }
  \`\`\`
- **Request Body (Tài trợ Hiện vật)**:
  \`\`\`json
  {
    "name": "Trần Thu Hà",
    "birthDate": "1988-10-20",
    "phone": "0912987654",
    "email": "ha.tt@adtech.vn",
    "website": "https://adtech.vn",
    "companyName": "Công Ty Quảng Cáo AdTech",
    "sponsorType": "in_kind",
    "totalAmount": 15000000,
    "inKindItems": [
      { "name": "Standee sự kiện", "quantity": 10, "unit": "Chiếc", "estimatedValue": 5000000 },
      { "name": "Màn hình tương tác", "quantity": 1, "unit": "Chiếc", "estimatedValue": 10000000 }
    ]
  }
  \`\`\`
- **Hành vi xử lý ngầm**:
  1. Tính tự động trường \`age\` dựa trên \`birthDate\`.
  2. Nếu \`sponsorType = 'cash'\`: Thêm bản ghi giao dịch thu vào \`public.transactions\` với \`fund_type = 'sponsorship_fund'\`.
  3. Kích hoạt \`MailService.sendSponsorThankYouEmail()\` gửi thư tri ân trang trọng kèm chữ ký điện tử của Chủ tịch CLB.

---

### 3.8. Phân hệ Phân quyền RBAC chế độ kép (RBAC Permissions Controller)

#### \`GET /api/admin/rbac/roles\` — Danh sách vai trò và tiến độ cấp quyền
- **Response 200 OK**:
  \`\`\`json
  [
    { "roleKey": "chu_tich", "roleName": "Chủ tịch CLB", "grantedCount": 38, "totalCount": 38 },
    { "roleKey": "thanh_vien_ban_tai_chinh", "roleName": "Thành viên Ban Tài chính", "grantedCount": 14, "totalCount": 38 },
    { "roleKey": "member", "roleName": "Hội viên Doanh nhân", "grantedCount": 8, "totalCount": 38 }
  ]
  \`\`\`

#### \`PUT /api/admin/rbac/roles/:roleKey/permissions\` — Cập nhật quyền hạn theo vai trò
- **Request Body**:
  \`\`\`json
  {
    "module": "finance",
    "canView": true,
    "canCreate": true,
    "canEdit": true,
    "canDelete": false,
    "canApprove": true,
    "canExport": true
  }
  \`\`\`

#### \`POST /api/admin/rbac/quick-preset\` — Cấu hình nhanh 1 chạm
- **Request Body**:
  \`\`\`json
  {
    "roleKey": "ban_dao_tao",
    "preset": "standard_manager" // all_access | view_only | standard_manager | revoke_all
  }
  \`\`\`

---

## 4. MÔ HÌNH TUẦN HOÀN GỌI API GIỮA CÁC PHÂN HỆ

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Admin as Ban Quản Trị
    actor Sponsor as Nhà Tài Trợ
    actor Member as Hội Viên
    participant BE as Backend NestJS
    participant DB as PostgreSQL 113.20.107.184:6432
    participant Mail as Mailer Service
    
    %% UC-6: Tài Trợ
    Admin->>BE: POST /api/sponsors (Tiền mặt / Hiện vật)
    BE->>DB: INSERT into sponsors & transactions (Túi Quỹ Tài Trợ)
    BE->>Mail: sendSponsorThankYouEmail()
    Mail-->>Sponsor: Email Thư Cảm Ơn Trang Trọng
    
    %% UC-4: Hậu cần xin cấp hiện vật
    Admin->>BE: GET /api/supplies/sponsor-inventory
    BE-->>Admin: Danh mục kho hiện vật tài trợ
    Admin->>BE: POST /api/supplies (Lấy từ tài trợ, chi phí = 0đ)
    BE->>DB: INSERT into supplies
    
    %% UC-5: Xuất Phiếu Chi PDF
    Admin->>BE: POST /api/expenses (Chi Sự Kiện, Ban, Người nhận tiền)
    BE->>DB: INSERT into expenses & transactions
    Admin->>BE: GET /api/expenses/:id/export-pdf-data
    BE-->>Admin: Dữ liệu Phiếu chi PDF 5 chữ ký
    
    %% UC-3: Khóa Học & Phát Slide
    Admin->>BE: POST /api/trainings/:id/send-slides
    BE->>DB: INSERT into documents (category: training_materials)
    BE-->>Member: Gửi Slide bài giảng
    Member->>BE: POST /api/trainings/:id/feedbacks (Text + File)
    BE->>DB: INSERT into feedbacks
    
    %% I.1: Dashboard Tổng Quan
    Member->>BE: GET /api/trainings/my/enrolled & GET /api/events/my-events
    BE-->>Member: Danh sách khóa học tham gia (Hiện nút Tải Slide & Góp ý)
\`\`\`

---

## 5. MÃ LỖI HỆ THỐNG & QUY TRÌNH XỬ LÝ NGOẠI LỆ

| Mã lỗi HTTP | Mã lỗi chi tiết (Error Code) | Nguyên nhân phát sinh | Giải pháp khắc phục |
| :---: | :--- | :--- | :--- |
| **400** | \`EVENT_CAPACITY_REACHED\` | Số lượng người đăng ký đã đạt mức \`capacity\` | Báo lỗi "Sự kiện đã đủ chỗ", hướng dẫn liên hệ BTC |
| **400** | \`INVALID_SUPPLY_INPUT\` | Khai báo thiếu tên vật dụng hoặc số lượng <= 0 | Nhập đủ tên vật dụng, đơn vị tính và số lượng |
| **400** | \`MISSING_RECIPIENT_INFO\` | Lập phiếu chi thiếu tên người nhận tiền hoặc ban | Nhập đầy đủ người nhận tiền, sự kiện và ban đề xuất |
| **401** | \`TOKEN_EXPIRED\` | Phiên làm việc JWT đã quá 24 giờ | Gọi API \`/auth/refresh\` hoặc điều hướng về Đăng nhập |
| **403** | \`FORBIDDEN_ROLE\` | Người dùng không đủ quyền theo ma trận RBAC | Hiển thị thông báo không có quyền, không hiển thị chức năng |
| **500** | \`DATABASE_CONNECTION_LOST\`| Mất kết nối tới CSDL 113.20.107.184:6432 | Thông báo lỗi kết nối CSDL, không dùng dữ liệu mock |

---
*Tài liệu Đặc tả Giao diện Lập trình RESTful API hoàn chỉnh và chuẩn mực.*
`;

fs.writeFileSync(path.join(__dirname, 'THIET_KE_RESTFUL_API_CEOHN10.md'), apiContent, 'utf8');
console.log('SUCCESS: Generated THIET_KE_RESTFUL_API_CEOHN10.md');
