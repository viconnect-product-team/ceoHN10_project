# TÀI LIỆU YÊU CẦU NGHIỆP VỤ HỆ THỐNG CEO HN10 (BRD)

**Phiên bản:** 3.0 (Cập nhật đồng bộ toàn hệ thống)  
**Ngày ban hành:** 26/11/2026  
**Đơn vị thụ hưởng:** Câu lạc bộ Doanh Nhân CEO HN10 — Hiệp Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA)  
**Nền tảng triển khai:**
- **Web CRM Quản Trị:** `https://crm.ceohn10.viconnect.vn`
- **Mobile App & PWA Hội Viên:** `https://ceohn10.viconnect.vn`

---

## 1. TỔNG QUAN DỰ ÁN & MỤC TIÊU NGHIỆP VỤ

### 1.1. Bối cảnh và Bài toán
CLB Doanh Nhân CEO HN10 là cộng đồng quy tụ các Tổng Giám đốc, Chủ tịch và Nhà sáng lập doanh nghiệp khóa 2026–2027. Hoạt động của CLB bao gồm: quản trị hội viên, tổ chức đào tạo 30 chuyên đề, tổ chức các sự kiện lớn (Khai giảng, Year End Party, Team Building, Bế giảng), vận hành ngân sách Quỹ Tổng cùng 7 Ban chuyên trách, kết nối giao thương B2B và lấy ý kiến biểu quyết tập thể.

Trước khi số hóa, việc quản lý bằng Excel rời rạc dẫn đến:
- Khó kiểm soát danh sách khách mời miễn phí vs khách tham gia thu phí, dễ trùng lặp đăng ký và thất thoát vé.
- Đối soát chuyển khoản phí sự kiện thủ công chậm trễ, không cấp được E-Ticket QR tức thì.
- Thiếu minh bạch dòng tiền theo từng Ban chuyên trách và thiếu kênh tương tác/biểu quyết trực tiếp trên điện thoại cho học viên.

### 1.2. Mục tiêu chiến lược
1. **Tách biệt 2 không gian vận hành**: Cổng Quản trị Web CRM cho Ban Điều Hành / Ban Chuyên Trách và Mobile App CEO HN10 tối giản, sang trọng cho Học viên/Giảng viên.
2. **Số hóa toàn diện vòng đời Sự kiện & Dòng tiền**: Từ lập sự kiện đa phần, thiết kế thư mời Xám–Trắng Luxury cá nhân hóa, phân loại khách theo đúng thẩm quyền, thanh toán VietQR SePay tự động (< 3 giây) đến Check-in/Check-out, Quay số may mắn và Hạch toán Quỹ tự động.
3. **Minh bạch tài chính 7 Ban**: Quản lý thời gian thực Quỹ Tổng (2 tỷ 080 triệu) và 7 Quỹ Ban chuyên trách.
4. **Lưu trữ đám mây ổn định & Đồng bộ CSDL đa môi trường**: Mọi ảnh/video/tài liệu lưu 100% trên MinIO; tách biệt dữ liệu Localhost và Production nhưng đồng bộ tự động cấu trúc bảng/cột 2 chiều.

---

## 2. PHẠM VI HỆ THỐNG & CƠ CẤU PHÂN QUYỀN (9 ROLES & 7 BAN)

### 2.1. 9 Vai trò chuẩn (Roles)
| Mã Role | Tên hiển thị | Phạm vi dữ liệu | Cổng mặc định |
| :--- | :--- | :--- | :--- |
| `platform_admin` | Master Platform Admin | Toàn nền tảng | Web CRM + Master + App |
| `admin` | Ban Điều Hành / Admin | Toàn CLB CEO HN10 | Web CRM + App |
| `lop_truong` | Lớp trưởng | Toàn lớp CEO HN10 | Web CRM + App |
| `lop_pho` | Lớp phó | Toàn lớp CEO HN10 | Web CRM + App |
| `truong_team` | Trưởng team | Nhóm/Team phụ trách | Web CRM + App |
| `pho_team` | Phó team | Nhóm/Team phụ trách | Web CRM + App |
| `truong_ban_chuyen_trach` | Trưởng Ban chuyên trách | Theo Ban được giao | Web CRM + App |
| `giang_vien` | Giảng viên | Lớp học & Chuyên đề | App CEOHN10 (`app_only`) |
| `member` | Học viên | Hồ sơ cá nhân & Cộng đồng | App CEOHN10 (`app_only`) |

### 2.2. 7 Ban Chuyên Trách Chính Thức
1. **Ban Công nghệ** *(Quỹ khởi tạo: 20.000.000 đ — Kinh phí khai giảng)*
2. **Ban Truyền thông** *(Phụ trách nội dung, hình ảnh, phối hợp phân loại Khách mời thư mời & quét QR check-in)*
3. **Ban Tài chính** *(Kiểm soát Quỹ Tổng, Quỹ 7 Ban, duyệt chi cấp 1)*
4. **Ban Sự kiện & Hậu cần** *(Tổ chức sự kiện, phân loại Khách mời vs Khách tham gia thu phí, tiếp nhận doanh thu vé SePay)*
5. **Ban Đối ngoại & Giao thương** *(Kết nối B2B, Nhà tài trợ)*
6. **Ban Gắn kết & Đời sống** *(Chăm lo đời sống, sinh nhật, sự kiện nội bộ)*
7. **Ban Thiện nguyện** *(Hoạt động cộng đồng & Quỹ thiện nguyện)*

### 2.3. Quy tắc tách biệt Tài khoản & Học viên
- **Phân quyền cổng đăng nhập (`targetSystem`)**: Mỗi tài khoản hiển thị rõ trạng thái quyền vào **Chỉ App CEOHN10**, **Chỉ Web CRM**, hoặc **Cả CRM & App**. Học viên/Giảng viên mới tạo mặc định là `app_only` (bị chặn tại cổng `/auth` CRM cho tới khi Admin cấp quyền).
- **Quy tắc xóa tách biệt**:
  - **Xóa Học viên**: Xóa cứng hồ sơ học viên **và tự động xóa tài khoản đăng nhập** theo email tương ứng.
  - **Xóa Tài khoản**: Chỉ xóa quyền/tài khoản đăng nhập, **bảo toàn nguyên vẹn dữ liệu Học viên** trên màn Học viên (`user_id = NULL`).

---

## 3. YÊU CẦU NGHIỆP VỤ CỐT LÕI THEO PHÂN HỆ

### 3.1. Phân hệ Quản lý Học viên & Dữ liệu động (CRM)
- Hỗ trợ tạo, sửa, xóa, tìm kiếm và 1 nút **Import File** duy nhất (`.xlsx`, `.xls`, `.csv`, `.docx`, `.pdf`) tự động nhận diện cột và sinh thêm cột động trong bảng theo file import.
- Cho phép cấu hình **Thêm trường thông tin** động (Text, Number, Date, Select, Checkbox, Email, Phone) và ẩn/hiện cột hiển thị.

### 3.2. Phân hệ Quản lý Sự kiện, Thư mời, SePay & Check-in
1. **Khởi tạo Sự kiện 4 bước (`EventWizard`)**:
   - **Bước 1 (Thông tin & Các phần)**: Khai báo sức chứa tổng (VD: 200 vé), chia sự kiện thành nhiều phần (VD: *Phần 1: Lễ Khai Giảng — Miễn phí*, *Phần 2: Dự Tiệc — Có phí*), cấu hình Hội trường (`venueName`) và Trường động đăng ký.
   - **Bước 2 (Hạng vé & Sơ đồ chỗ ngồi)**: Không điền sẵn số lượng/hạng vé; người tạo tự thêm hạng vé theo từng phần. Sơ đồ chỗ ngồi chỉ tự sinh khi có tên loại vé và số lượng `> 0`. Nếu tổng số vé vượt sức chứa Bước 1, hệ thống hỏi xác nhận tạo thêm **Vé dự phòng** cho khách đến check-in trực tiếp chưa đăng ký qua form.
   - **Bước 3 (Cấu hình QR & Nhà tài trợ)** & **Bước 4 (Hoàn tất)**.
2. **Thư mời cá nhân hóa Xám–Trắng Luxury & Phân loại đối tượng vé**:
   - Thiết kế từ chi tiết từng sự kiện: tùy chỉnh màu nền, màu chữ, kiểu chữ, ảnh nền thành phố (MinIO), import danh sách khách mời hoặc chọn từ Học viên/Giảng viên để sinh link `#<slug>`.
   - **Quyền phân loại bắt buộc**: Chỉ tài khoản có role **Trưởng ban Truyền thông**, **Trưởng ban Sự kiện & Hậu cần** hoặc **Admin / Platform Admin** được phép chỉ định từng khách là **Vé Khách mời (0đ)** hoặc **Khách tham gia sự kiện (Tính phí)**. Khách mở thư mời không được tự chuyển đổi đối tượng vé.
3. **Đăng ký RSVP & Chống trùng lặp**:
   - Khách đăng ký không cần đăng nhập: chọn tham dự 1 phần hoặc toàn bộ, hoặc từ chối (ghi nhận thông báo & tab Khách mời từ chối trên CRM).
   - **Kiểm tra trùng đăng ký**: Chặn đăng ký lần 2 nếu trùng **Email** hoặc trùng **Họ tên + Số điện thoại** trong cùng sự kiện.
4. **Thanh toán VietQR SePay & Check-in / Check-out**:
   - Vé có phí (`> 0đ`) tự động sinh mã VietQR nội dung `CEO1983_EVT_<regId>`, auto-polling 3 giây/lần chuyển ngay sang thẻ E-Ticket QR khi Webhook SePay xác nhận tiền vào, đồng thời cộng vào **Quỹ Ban Sự kiện & Hậu cần**.
   - Check-in hỗ trợ quét QR đa định dạng (đánh dấu *Đúng giờ* / *Đi muộn*, chống quét trùng), hỗ trợ bàn đón tiếp Walk-in cho khách vé dự phòng, và Check-out ghi nhận giờ ra về + gửi email cảm ơn.
   - Kết thúc sự kiện có **Quay số may mắn** lọc theo chức danh trên danh sách đã check-in và **Xuất báo cáo** 3 định dạng (Excel, CSV, PDF A4).

### 3.3. Phân hệ Biểu quyết & Bầu cử
- Cho phép tạo biểu quyết độc lập hoặc gắn với sự kiện (`eventId`), gửi thông báo đồng thời qua Email và App CEOHN10.
- **Tự động đóng theo Sự kiện**: Khi sự kiện gắn kèm kết thúc (`completed` / `cancelled` / qua ngày tổ chức), biểu quyết tự động chuyển trạng thái `closed` và lưu tại danh mục biểu quyết.
- **Tương tác & Lịch sử trên App**: Hiển thị khối Biểu quyết ngay dưới *Sự kiện sắp tới* ở Trang chủ App; sau khi bình chọn, lưu và hiển thị rõ lịch sử lựa chọn của từng học viên (VD: *"Bạn đã chọn `<lựa chọn>` tại biểu quyết `<tên>` ở sự kiện `<tên sự kiện>`"*).

### 3.4. Phân hệ Mobile App CEOHN10 (Hội viên)
- **Trang chủ**: Header logo nền trong suốt, Banner Hero, Sự kiện tiêu điểm, Biểu quyết trực tiếp, Lộ trình đào tạo 30 buổi & Timeline 4 chặng.
- **Hoạt động**: Quản lý Sự kiện & Danh mục **Lớp học** (lịch học cố định, tài liệu, thảo luận lớp).
- **Gắn kết**: Logo tối giản ở header, thanh cuộn ngang tối đa 6 học viên kèm nút *Xem tất cả* dẫn vào Danh bạ CEO, Bảng tin và Hẹn gặp B2B.
- **Cá nhân & Lịch sử**: Thẻ hội viên số, Danh thiếp 3D, Lịch sử hoạt động/biểu quyết/thanh toán và cài đặt App 1 chạm.
