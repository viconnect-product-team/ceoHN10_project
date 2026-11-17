const fs = require('fs');
const path = require('path');

const srsContent = `# ĐẶC TẢ YÊU CẦU PHẦN MỀM HỆ THỐNG CEO HN10 (HANOIBA)
## SOFTWARE REQUIREMENTS SPECIFICATION (SRS) - CHUẨN IEEE 830
*Mã tài liệu: SRS-CEOHN10-ENTERPRISE-V1.0*  
*Đơn vị chủ quản: CLB Doanh Nhân CEO HN10 — Trực thuộc Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA)*  
*Đơn vị phát triển: VICONNECT - Kiến Trúc Sư Phần Mềm & An Ninh Dữ Liệu*  
*Cơ sở dữ liệu trung tâm: PostgreSQL 113.20.107.184:6432 (ceohn10_project)*  
*Thời điểm ban hành: Tháng 11/2026*  

---

## MỤC LỤC
1. **GIỚI THIỆU (INTRODUCTION)**
   - 1.1. Mục đích tài liệu
   - 1.2. Phạm vi sản phẩm (Product Scope)
   - 1.3. Định nghĩa, thuật ngữ và từ viết tắt
   - 1.4. Tài liệu tham chiếu
   - 1.5. Tổng quan cấu trúc tài liệu
2. **MÔ TẢ TỔNG THỂ (OVERALL DESCRIPTION)**
   - 2.1. Mô hình kiến trúc phân tầng (3-Tier Monorepo Architecture)
   - 2.2. Phân hệ Web CRM Quản trị & Phân hệ Mobile App Hội viên
   - 2.3. Đặc điểm người dùng & 9 nhóm vai trò hệ thống
   - 2.4. Môi trường vận hành và hạ tầng triển khai
   - 2.5. Ràng buộc thiết kế và hiện thực hóa (STRICT DATABASE & NO-MOCK)
3. **YÊU CẦU GIAO DIỆN HỆ THỐNG (SYSTEM INTERFACE REQUIREMENTS)**
   - 3.1. Giao diện người dùng (User Interface - UI/UX Standards)
   - 3.2. Tiêu chuẩn màu sắc nhận diện 3 cấp độ (Burgundy, Gold, Navy)
   - 3.3. Giao diện phần mềm & Giao thức truyền thông (API / WebSockets)
4. **ĐẶC TẢ CHI TIẾT YÊU CẦU CHỨC NĂNG PHẦN MỀM (SOFTWARE FUNCTIONAL REQUIREMENTS)**
   - 4.1. SFR-01: Phân hệ Xác thực JWT & Phân giải quyền hạn RBAC (UC-1)
   - 4.2. SFR-02: Phân hệ Sự kiện, QR Động, Giới hạn Chỗ & Media (UC-2)
   - 4.3. SFR-03: Phân hệ Khóa học, Agenda slots, Gửi Slide & Góp ý (UC-3)
   - 4.4. SFR-04: Phân hệ Khai báo Vật tư Hậu cần & Kho Hiện vật Nhà tài trợ (UC-4)
   - 4.5. SFR-05: Phân hệ Quản lý 2 Túi Quỹ, Đề xuất chi & Xuất Phiếu chi PDF 5 chữ ký (UC-5)
   - 4.6. SFR-06: Phân hệ Quản lý Nhà tài trợ & Tự động gửi Email cảm ơn (UC-6)
   - 4.7. SFR-07: Phân hệ Kho Tài liệu số hóa tập trung (Documents Vault)
   - 4.8. SFR-08: Phân hệ Tiếp nhận Phản ánh, Góp ý & Khảo sát
   - 4.9. SFR-09: Phân hệ Biểu quyết điện tử & Thống kê kết quả
   - 4.10. SFR-10: Phân hệ Quản lý Mẫu thông báo tùy biến động trường
   - 4.11. SFR-11: Phân hệ Phân quyền RBAC chế độ kép (100% Tiếng Việt)
   - 4.12. SFR-12: Phân hệ Cài đặt cấu hình hệ thống
   - 4.13. SFR-13: Phân hệ Dashboard Tổng quan nhanh (4 Sự kiện & 30 Khóa học, 2 Túi quỹ)
5. **YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)**
   - 5.1. Yêu cầu về Hiệu năng (Performance Requirements)
   - 5.2. Yêu cầu về Bảo mật & Toàn vẹn dữ liệu (Security Requirements)
   - 5.3. Yêu cầu về Độ tin cậy & Tính sẵn sàng (Reliability & Availability)
   - 5.4. Yêu cầu về Khả năng bảo trì & Mở rộng (Maintainability & Scalability)
6. **MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU (TRACEABILITY MATRIX)**

---

## 1. GIỚI THIỆU (INTRODUCTION)

### 1.1. Mục đích tài liệu
Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) này xác định đầy đủ, chi tiết và chính xác các yêu cầu chức năng, yêu cầu phi chức năng, giao diện và các ràng buộc kỹ thuật của Hệ thống Phần mềm Quản trị Số CEO HN10. Tài liệu này đóng vai trò là cơ sở pháp lý và kỹ thuật phục vụ việc phát triển, kiểm thử, tích hợp, triển khai và nghiệm thu bàn giao giữa đơn vị phát triển VICONNECT và CLB Doanh Nhân CEO HN10.

### 1.2. Phạm vi sản phẩm (Product Scope)
Hệ sinh thái phần mềm CEO HN10 gồm 2 phân hệ chính hoạt động trên một cơ sở dữ liệu dùng chung:
1. **Cổng Thông Tin Web CRM Quản Trị**: Dành cho Ban Chủ tịch, Ban Điều Hành, Ban Thư Ký, Ban Tài Chính và các Trưởng/Phó Ban chuyên môn quản lý hội viên, sự kiện, khóa học, 2 túi quỹ, tài liệu và phân quyền.
2. **Ứng Dụng Di Động CEO HN10 Mobile App**: Dành cho các Hội viên doanh nhân tra cứu danh bạ doanh nghiệp, đăng ký sự kiện, ghi danh 30 khóa học, tải slide bài giảng, gửi góp ý phản hồi và kết nối kinh doanh B2B.

### 1.3. Định nghĩa và từ viết tắt
- **HanoiBA**: Hội Doanh Nghiệp Trẻ Hà Nội.
- **CEO HN10**: Câu Lạc Bộ Doanh Nhân CEO HN10.
- **RBAC**: Role-Based Access Control (Kiểm soát truy cập dựa trên vai trò).
- **JWT**: JSON Web Token.
- **RESTful API**: Giao diện lập trình ứng dụng tuân thủ kiến trúc REST qua HTTP/JSON.
- **Túi Quỹ Chung**: Quỹ tài chính hình thành từ hội phí thường niên của hội viên.
- **Túi Quỹ Tài Trợ**: Quỹ tài chính tiếp nhận tiền mặt và kho hiện vật do các Nhà tài trợ đóng góp.
- **Agenda Slots**: Khung thời gian chi tiết các tiết học trong một buổi đào tạo.
- **Capacity**: Sức chứa tối đa của một sự kiện/lớp học.

### 1.4. Tài liệu tham chiếu
- Bộ tài liệu Yêu cầu Nghiệp vụ (BRD CEO HN10 Enterprise V1.0).
- Tiêu chuẩn IEEE Std 830-1998 cho việc xây dựng tài liệu SRS.
- Quy định vận hành CSDL PostgreSQL \`113.20.107.184:6432\` và cấm dữ liệu mock (\`AGENTS.md\`).

---

## 2. MÔ TẢ TỔNG THỂ (OVERALL DESCRIPTION)

### 2.1. Mô hình kiến trúc phân tầng (3-Tier Monorepo Architecture)
- **Tầng Giao Diện (Presentation Layer)**:
  - Web CRM: Ứng dụng TanStack Start kết hợp Vite, Tailwind CSS, Lucide Icons, Recharts.
  - Mobile App: React Native / Capacitor tối ưu hóa trải nghiệm mobile-first trên iOS và Android.
- **Tầng Ứng Dụng & Nghiệp Vụ (Application & Business Logic Layer)**:
  - Backend NestJS viết bằng TypeScript, phân rã theo Domain-Driven Design (Auth, Users, Events, Trainings, Supplies, Sponsors, Finance/Expenses, Documents, Feedback, Notifications, Rbac).
  - Tích hợp chuẩn RESTful API, validation pipes và role guards.
- **Tầng Cơ Sở Dữ Liệu (Data Persistence Layer)**:
  - Máy chủ CSDL PostgreSQL \`113.20.107.184:6432\` (database \`ceohn10_project\`), kết nối qua PgBouncer connection pooler.

### 2.2. Đặc điểm người dùng & 9 nhóm vai trò
1. \`admin\` / \`quan_tri\`: Quản trị viên hệ thống, toàn quyền cấu hình và phân quyền.
2. \`chu_tich\`: Chủ tịch CLB, phê duyệt ngân sách, phê duyệt chi và chỉ đạo toàn diện.
3. \`ban_dieu_hanh\`: Ban Điều Hành / Phó Chủ tịch, giám sát hoạt động.
4. \`ban_thu_ky\`: Ban Thư Ký / Tổng Thư Ký, quản lý công văn, danh bạ hội viên, thông báo.
5. \`ban_tai_chinh\`: Ban Tài Chính, quản trị 2 túi quỹ, lập phiếu chi, báo cáo tài chính.
6. \`ban_su_kien\`: Ban Sự Kiện & Hậu Cần, tạo sự kiện, khai báo vật dụng hỗ trợ.
7. \`ban_dao_tao\`: Ban Đào Tạo, điều hành 30 khóa học, điểm danh, phát slide.
8. \`ban_truyen_thong\`: Ban Truyền Thông, quản lý thư viện ảnh, bài đăng, bản tin.
9. \`member\` / \`hoi_vien\`: Hội viên doanh nhân, người dùng đầu cuối trên Mobile App và cổng hội viên.

### 2.3. Ràng buộc thiết kế và hiện thực hóa (STRICT DATABASE & NO-MOCK)
- **Cơ sở dữ liệu duy nhất**: \`113.20.107.184:6432\` (database \`ceohn10_project\`). Tuyệt đối không trỏ sang CSDL khác.
- **Tuyệt đối cấm Fake/Mock dữ liệu**: Mọi dữ liệu trên giao diện phải lấy từ CSDL. Khi CSDL lỗi kết nối, phải báo lỗi minh bạch.
- **Không tự ý git push / commit**: Mọi thay đổi lưu trữ cục bộ để người dùng chủ động kiểm tra.
- **Type-Check 0 lỗi**: Toàn bộ mã nguồn phải đạt \`tsc --noEmit\` exit code 0.

---

## 3. YÊU CẦU GIAO DIỆN HỆ THỐNG (SYSTEM INTERFACE REQUIREMENTS)

### 3.1. Giao diện người dùng (User Interface)
- Đáp ứng đa nền tảng: Màn hình lớn (Desktop 1440px), Máy tính bảng (Tablet 1024px), và Điện thoại (Mobile 390px - 430px).
- Giao diện quản trị CRM bố trí Sidebar thông minh, bảng dữ liệu dạng Excel, bộ lọc tìm kiếm tức thì.
- Giao diện Mobile App hỗ trợ cử chỉ vuốt, thanh điều hướng đáy (Bottom Navigation Bar) và thẻ QR danh thiếp thông minh.

### 3.2. Tiêu chuẩn màu sắc nhận diện 3 cấp độ
- **Màu Đỏ Burgundy (#8B0000 / #991B1B)**: Màu nhận diện thương hiệu chủ đạo, sử dụng cho Header, Nút hành động chính (Primary Button), Trạng thái quan trọng.
- **Màu Vàng Gold (#D97706 / #B45309)**: Màu biểu trưng cho sự thịnh vượng của doanh nhân, dùng cho Huy hiệu VIP, Đường viền điểm nhấn, Nút hành động bổ trợ.
- **Màu Xanh Navy (#1E3A8A / #1E40AF)**: Màu nền tảng thể hiện sự tin cậy, vững chãi của giới doanh nghiệp, dùng cho Sidebar, Card nền và Bảng biểu.

---

## 4. ĐẶC TẢ CHI TIẾT YÊU CẦU CHỨC NĂNG PHẦN MỀM (SFR)

### 4.1. SFR-01: Phân hệ Xác thực JWT & Phân giải quyền hạn (UC-1)
- **SFR-01.1**: Hệ thống cung cấp API \`POST /api/auth/login\` tiếp nhận email/username và mật khẩu, kiểm tra mã băm bcrypt với muối 10 rounds.
- **SFR-01.2**: Khi đăng nhập thành công, hệ thống cấp phát Access Token (thời hạn 24 giờ) và Refresh Token (thời hạn 30 ngày) chuẩn RFC 7519.
- **SFR-01.3**: Token chứa các claims: \`userId\`, \`email\`, \`role\`, \`executiveRole\`, \`permissions\`.
- **SFR-01.4**: Cơ chế JwtAuthGuard và RolesGuard chặn đứng mọi truy cập trái phép hoặc không đủ quyền tại tầng API Controller.
- **SFR-01.5**: Hỗ trợ API \`GET /api/users/me\` nạp thông tin phiên người dùng và làm mới token tự động qua \`POST /api/auth/refresh\`.

### 4.2. SFR-02: Phân hệ Quản lý Sự kiện (UC-2)
- **SFR-02.1**: Cho phép Ban Sự Kiện tạo sự kiện với các thuộc tính: Tiêu đề, mô tả, địa điểm, thời gian bắt đầu/kết thúc, loại hình (Cố định / Đột xuất), hình thức chi phí (Miễn phí / Có phí), sức chứa tối đa (\`capacity\`).
- **SFR-02.2**: Tự động sinh mã QR sự kiện và đường link đăng ký công khai: \`https://ceohn10.viconnect.vn/guest-event-register/{id}\`.
- **SFR-02.3**: **Kiểm tra giới hạn số lượng**: Khi số lượng người đã đăng ký bằng với \`capacity\`, hệ thống khóa form đăng ký và hiển thị cảnh báo: **"Sự kiện đã đủ chỗ"**.
- **SFR-02.4**: Cung cấp API tải lên danh sách đường link album ảnh và media tư liệu (\`POST /api/events/:id/media\`), tự động lưu bản ghi vào bảng \`public.documents\` với danh mục \`event_media\`.
- **SFR-02.5**: Cung cấp API đánh giá phản hồi sự kiện (\`POST /api/events/:id/feedbacks\`), lưu điểm sao (1 - 5) và ý kiến của người tham gia.
- **SFR-02.6**: Cung cấp API \`GET /api/events/my-events\` trả về danh sách các sự kiện mà hội viên đang đăng nhập đã tham gia để hiển thị trên Dashboard.

### 4.3. SFR-03: Phân hệ Quản lý Khóa học / Buổi học (UC-3)
- **SFR-03.1**: Cho phép tạo khóa học/buổi học với các thuộc tính: Tên khóa học, chuyên đề, giảng viên, loại hình (Cố định vào Thứ 7 hàng tuần hoặc linh hoạt), thời gian, địa điểm, danh sách khung giờ chi tiết (\`agenda slots\`).
- **SFR-03.2**: Hỗ trợ học viên đăng ký tham gia khóa học trước ngày diễn ra (\`POST /api/trainings/:id/register\`).
- **SFR-03.3**: Cung cấp giao diện và API điểm danh học viên có mặt thực tế trong buổi học (\`POST /api/trainings/:id/checkin\`).
- **SFR-03.4**: **Nút Gửi Slide**: Cung cấp API \`POST /api/trainings/:id/send-slides\` tự động gửi slide bài giảng cho học viên và lưu trữ tài liệu vào \`public.documents\` với danh mục \`training_materials\`.
- **SFR-03.5**: Cho phép học viên đóng góp ý kiến sau buổi học qua \`POST /api/trainings/:id/feedbacks\`, hỗ trợ gửi phản hồi bằng văn bản hoặc đính kèm tệp tin.
- **SFR-03.6**: Cho phép đính kèm link video/ảnh buổi học qua \`POST /api/trainings/:id/media\` và tự động lưu vào \`public.documents\`.
- **SFR-03.7**: Cung cấp API \`GET /api/trainings/my/enrolled\` trả về các khóa học hội viên đã tham gia để hiển thị trên Dashboard cá nhân kèm nút "Tải Slide" và "Góp ý".

### 4.4. SFR-04: Phân hệ Khai báo Vật dụng hỗ trợ Hậu cần (UC-4)
- **SFR-04.1**: Cung cấp chức năng cho Ban Sự Kiện & Hậu Cần khai báo vật tư hỗ trợ tại từng sự kiện và từng buổi học qua \`POST /api/supplies\`.
- **SFR-04.2**: Thuộc tính vật dụng gồm: Tên vật dụng, số lượng, đơn vị tính, chi phí ước tính, ghi chú, ban đề xuất (\`department\`).
- **SFR-04.3**: **Tích hợp kho hiện vật nhà tài trợ**: Cung cấp API \`GET /api/supplies/sponsor-inventory\` trả về danh sách hiện vật tài trợ còn khả dụng trong kho.
- **SFR-04.4**: Khi chọn lấy vật phẩm từ nhà tài trợ, chi phí ước tính được tự động gán bằng 0 VNĐ và liên kết mã nhà tài trợ (\`sponsorId\`, \`sponsorName\`).

### 4.5. SFR-05: Phân hệ Quản lý 2 Túi Quỹ & Phiếu chi PDF 5 chữ ký (UC-5)
- **SFR-05.1**: Hệ thống quản lý tài chính độc lập trên 2 Túi Quỹ:
  - **Túi Quỹ Chung**: Tổng hợp từ hội phí hội viên và nguồn thu thường xuyên. Phục vụ chi phí sự kiện, họp ban, hiếu hỷ Ban Đời Sống.
  - **Túi Quỹ Tài Trợ**: Phân chia thành 2 mục rõ ràng: (1) Tiền mặt tài trợ, (2) Kho hiện vật tài trợ.
- **SFR-05.2**: Cung cấp API tổng quan quỹ \`GET /api/admin/funds-overview\` trả về số dư realtime, tổng thu, tổng chi của cả 2 túi quỹ.
- **SFR-05.3**: **Báo cáo chi bắt buộc**: Mỗi bản ghi chi tiêu (\`expenses\`) bắt buộc chỉ rõ: Thuộc sự kiện nào (\`targetEventName\`), thuộc ban chuyên môn nào (\`targetDepartment\`), lý do chi, và **ai là người nhận tiền** (\`recipientName\`).
- **SFR-05.4**: **Xuất Phiếu Chi PDF**: Cung cấp chức năng tạo Phiếu Chi chuẩn quy cách kế toán có thể in hoặc xuất ra PDF có đầy đủ **5 vị trí chữ ký**:
  1. Người lập phiếu (Ban đề xuất chi)
  2. Người nhận tiền (Cá nhân/đại diện nhận chi trả)
  3. Kế toán / Thủ quỹ (Người xuất quỹ)
  4. Trưởng Ban Tài Chính (Thẩm tra tính hợp lý)
  5. Chủ tịch CLB (Phê duyệt chi)
- **SFR-05.5**: Hỗ trợ quy trình Ban Hậu cần lập đề xuất chi xin cấp kinh phí gửi Trưởng Ban Tài Chính và Chủ tịch CLB xét duyệt trực tuyến.

### 4.6. SFR-06: Phân hệ Quản lý Nhà tài trợ (UC-6)
- **SFR-06.1**: Cho phép tiếp nhận nhà tài trợ theo 2 hình thức: Tài trợ bằng tiền mặt hoặc Tài trợ bằng hiện vật (\`POST /api/sponsors\`).
- **SFR-06.2**: Thuộc tính nhà tài trợ đầy đủ: Họ và tên, ngày tháng năm sinh (tự động tính ra tuổi), số điện thoại, email, website doanh nghiệp, tên công ty.
- **SFR-06.3**: Khi tài trợ bằng tiền mặt: Tự động cộng số tiền vào số dư Tiền mặt của Túi Quỹ Tài Trợ và ghi nhận giao dịch thu vào sổ quỹ (\`public.transactions\`).
- **SFR-06.4**: Khi tài trợ bằng hiện vật: Tiếp nhận danh mục từng món hiện vật (Tên vật phẩm, số lượng, đơn vị, định giá) và đẩy thẳng vào Kho hiện vật của Túi Quỹ Tài Trợ.
- **SFR-06.5**: Tự động kích hoạt dịch vụ gửi email (\`MailService\`) gửi thư cảm ơn trang trọng đến địa chỉ email của nhà tài trợ ngay sau khi tạo thành công.

### 4.7. SFR-07: Phân hệ Kho Tài liệu số hóa tập trung (Documents Vault)
- **SFR-07.1**: Quản trị tài liệu tập trung theo các danh mục chuẩn: \`training_materials\` (Tài liệu bài giảng/slide), \`event_media\` (Hình ảnh/video sự kiện), \`legal_regulations\` (Điều lệ, nghị quyết, quy chế), \`enterprise_profiles\` (Hồ sơ năng lực doanh nghiệp).
- **SFR-07.2**: Tự động nhận diện và lưu trữ tài liệu khi các phân hệ Khóa học gửi slide hoặc Sự kiện tải media lên.
- **SFR-07.3**: Phân quyền 2 tầng: Tài liệu công khai toàn CLB và Tài liệu bảo mật nội bộ Ban Điều Hành.

### 4.8. SFR-08: Phân hệ Tiếp nhận Phản ánh, Góp ý & Khảo sát
- **SFR-08.1**: Tiếp nhận ý kiến phản hồi của hội viên về hoạt động của CLB.
- **SFR-08.2**: Phân loại phản ánh theo ban chuyên môn giải quyết: Ban Đào Tạo, Ban Sự Kiện, Ban Tài Chính, Ban Đời Sống.
- **SFR-08.3**: Cập nhật trạng thái xử lý: Mới tiếp nhận -> Đang xử lý -> Đã giải quyết -> Phản hồi hội viên.

### 4.9. SFR-09: Phân hệ Biểu quyết điện tử & Thăm dò ý kiến
- **SFR-09.1**: Ban Điều Hành tạo cuộc biểu quyết: Tiêu đề, nội dung, danh sách phương án lựa chọn, thời gian bắt đầu và kết thúc.
- **SFR-09.2**: Hội viên hợp lệ thực hiện bỏ phiếu (mỗi hội viên chỉ được bỏ phiếu 1 lần đối với mỗi cuộc biểu quyết).
- **SFR-09.3**: Tự động thống kê số phiếu, tỷ lệ phần trăm và hiển thị biểu đồ kết quả trực quan.

### 4.10. SFR-10: Phân hệ Quản lý Mẫu thông báo tùy biến động
- **SFR-10.1**: Cung cấp chức năng tạo và quản lý các mẫu thông báo (Hội phí, Thư mời họp, Lịch đào tạo, Cảnh báo).
- **SFR-10.2**: Hỗ trợ thêm trường dữ liệu, xóa trường dữ liệu linh hoạt theo nhu cầu từng mẫu (Text, Số, Ngày giờ, Tiền tệ, Mã QR).
- **SFR-10.3**: Xem trước nội dung thông báo trên giao diện Web, App và Zalo ZNS trước khi phát hành.

### 4.11. SFR-11: Phân hệ Phân quyền RBAC chế độ kép (100% Tiếng Việt)
- **SFR-11.1**: Thiết kế giao diện chuyển đổi linh hoạt giữa 2 chế độ:
  - *Chế độ Theo Từng Vai Trò*: Danh sách vai trò ở cột trái kèm huy hiệu tiến độ cấp quyền (VD: \`34/38 quyền\`). Cột phải hiển thị danh mục quyền dạng thẻ lưới có công tắc Bật/Tắt nhanh theo từng hành vi (Xem, Thêm, Sửa, Xóa, Duyệt, Xuất Excel).
  - *Chế độ Bảng Ma Trận Đối Chiếu*: Hiển thị bảng đối chiếu tổng thể toàn bộ các vai trò và quyền hạn ngang dọc phục vụ rà soát thanh tra.
- **SFR-11.2**: Tích hợp 4 nút thiết lập nhanh (Quick Presets): "Cấp toàn quyền", "Chỉ xem", "Quản lý chuẩn", "Thu hồi tất cả".
- **SFR-11.3**: Toàn bộ nhãn, gợi ý công cụ, tên quyền, mô tả hành động đều sử dụng 100% tiếng Việt chuẩn mực.

### 4.12. SFR-12: Phân hệ Cài đặt cấu hình hệ thống
- **SFR-12.1**: Cấu hình thông tin pháp nhân CLB Doanh Nhân CEO HN10, biểu trưng, nhiệm kỳ ban chấp hành.
- **SFR-12.2**: Cấu hình thông số kết nối CSDL, tài khoản máy chủ thư điện tử (SMTP), cổng thanh toán điện tử.
- **SFR-12.3**: Ghi nhận và tra cứu nhật ký kiểm toán hệ thống (Audit Logs) đảm bảo an toàn an ninh mạng.

### 4.13. SFR-13: Phân hệ Dashboard Tổng quan nhanh
- **SFR-13.1**: Khởi tạo mặc định 4 sự kiện và 30 khóa học hạt nhân của CEO HN10.
- **SFR-13.2**: Hiển thị widget "Ví 2 Túi Quỹ CEO HN10" kết nối realtime CSDL gồm Túi Quỹ Chung và Túi Quỹ Tài Trợ (Tiền mặt + Kho hiện vật).
- **SFR-13.3**: Hiển thị widget "Khóa Học & Sự Kiện Tôi Tham Gia" dành cho hội viên kèm nút "Tải Slide" và "Góp ý / Đánh giá".

---

## 5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

### 5.1. Yêu cầu về Hiệu năng (Performance Requirements)
- **NFR-P1**: Thời gian phản hồi của các RESTful API trung bình < 200ms đối với các tác vụ truy vấn đơn và < 500ms đối với các báo cáo tài chính tổng hợp.
- **NFR-P2**: Thời gian tải trang ban đầu (First Contentful Paint) < 1.2 giây; tương tác mượt mà (INP) < 100ms.
- **NFR-P3**: Hệ thống có khả năng phục vụ đồng thời 1.000+ người dùng hoạt động mà không làm suy giảm hiệu năng.

### 5.2. Yêu cầu về Bảo mật & Toàn vẹn dữ liệu (Security Requirements)
- **NFR-S1**: Mật khẩu người dùng được băm bằng thuật toán bcrypt với độ an toàn 10 rounds; tuyệt đối không lưu mật khẩu dạng bản rõ.
- **NFR-S2**: Kiểm soát phân quyền đa tầng tại cả Frontend (route & UI component) và Backend (JwtAuthGuard, RolesGuard, Param check).
- **NFR-S3**: Phòng chống tấn công SQL Injection bằng cách sử dụng TypeORM parameterized queries 100%.
- **NFR-S4**: Chống tấn công XSS, CSRF và thiết lập cấu hình CORS nghiêm ngặt.
- **NFR-S5 (STRICT DATABASE LAW)**: Toàn bộ dữ liệu phải được lưu trữ và truy vấn trực tiếp từ CSDL PostgreSQL \`113.20.107.184:6432\` (database \`ceohn10_project\`). Tuyệt đối không mock/fake dữ liệu.

### 5.3. Yêu cầu về Độ tin cậy & Tính sẵn sàng (Reliability & Availability)
- **NFR-R1**: Hệ thống cam kết thời gian hoạt động liên tục (Uptime) đạt tối thiểu 99.9% (24/7/365).
- **NFR-R2**: Sử dụng PgBouncer quản lý connection pooling, tự động tái kết nối khi gặp biến động mạng.
- **NFR-R3**: Cơ chế sao lưu dữ liệu tự động định kỳ hàng ngày, thời gian khôi phục dữ liệu (RTO) < 30 phút.

### 5.4. Yêu cầu về Khả năng bảo trì & Mở rộng (Maintainability & Scalability)
- **NFR-M1**: Cấu trúc Monorepo phân tách rõ ràng giữa Frontend (\`apps/ceohn10_app_fe\`) và Backend (\`apps/ceohn10_app_be\`).
- **NFR-M2**: Mã nguồn tuân thủ nghiêm ngặt chuẩn kiểm tra kiểu dữ liệu TypeScript (\`tsc --noEmit\` exit code 0).
- **NFR-M3**: Sẵn sàng đóng gói container hóa qua Docker Compose phục vụ triển khai hạ tầng độc lập.

---

## 6. MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU (TRACEABILITY MATRIX)

| Mã Yêu Cầu BRD | Mã Yêu Cầu SFR (SRS) | Phân Hệ Mục Tiêu | Thành Phần Backend | Thành Phần Frontend |
| :--- | :--- | :--- | :--- | :--- |
| **UC-1** | SFR-01 | Auth / Core | \`auth.controller.ts\`, \`users.service.ts\` | \`use-auth.ts\`, \`use-role.ts\` |
| **UC-2** | SFR-02 | Sự kiện | \`events.controller.ts\`, \`events.service.ts\` | \`events.index.tsx\`, \`events.$eventId.tsx\` |
| **UC-3** | SFR-03 | Khóa học | \`trainings.controller.ts\`, \`trainings.service.ts\` | \`trainings.tsx\`, \`SendSlideModal.tsx\` |
| **UC-4** | SFR-04 | Hậu cần | \`supplies.controller.ts\`, \`supplies.service.ts\` | \`SupplyDeclarationModal.tsx\` |
| **UC-5** | SFR-05 | Tài chính / 2 Quỹ | \`admin.controller.ts\`, \`expenses.service.ts\` | \`expenses.tsx\`, \`invoice-receipt.ts\` |
| **UC-6** | SFR-06 | Nhà tài trợ | \`sponsors.service.ts\`, \`mail.service.ts\` | \`sponsors.tsx\`, \`SponsorModal.tsx\` |
| **I.1** | SFR-13 | Tổng quan | \`admin.controller.ts\` (\`/funds-overview\`) | \`ExecutiveDashboard.tsx\` |
| **RBAC** | SFR-11 | Phân quyền | \`users.service.ts\`, \`rbac.guard.ts\` | \`RbacPermissionMatrix.tsx\` |

---
*Tài liệu Đặc tả Kỹ thuật IEEE 830 được nghiệm thu và làm căn cứ kỹ thuật chính thức.*
`;

fs.writeFileSync(path.join(__dirname, 'SRS_HE_THONG_CEOHN10.md'), srsContent, 'utf8');
console.log('SUCCESS: Generated SRS_HE_THONG_CEOHN10.md');
