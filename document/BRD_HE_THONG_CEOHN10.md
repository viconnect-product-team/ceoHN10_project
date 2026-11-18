# TÀI LIỆU YÊU CẦU NGHIỆP VỤ HỆ THỐNG CEO HN10 (HANOIBA)
## BUSINESS REQUIREMENTS DOCUMENT (BRD) - MASTER CHÍNH THỨC
*Mã tài liệu: BRD-CEOHN10-ENTERPRISE-V1.0*  
*Đơn vị chủ quản: CLB Doanh Nhân CEO HN10 — Trực thuộc Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA)*  
*Đơn vị phát triển giải pháp: VICONNECT - Hệ Sinh Thái Chuyển Đổi Số Doanh Nhân*  
*Cơ sở dữ liệu trung tâm: PostgreSQL 113.20.107.184:6432 (ceohn10_project)*  
*Thời điểm ban hành: Tháng 11/2026*  

---

## MỤC LỤC
1. **TỔNG QUAN DỰ ÁN & SỨ MỆNH CLB DOANH NHÂN CEO HN10**
   - 1.1. Bối cảnh hình thành và tổ chức trực thuộc HanoiBA
   - 1.2. Mục tiêu chiến lược của nền tảng số hóa quản trị
   - 1.3. Cơ cấu tổ chức & Đối tượng thụ hưởng (9 nhóm người dùng)
2. **DANH MỤC 13 NHÓM CHỨC NĂNG HỆ THỐNG**
   - 2.1. Phân hệ Tổng quan (Dashboard) & Điều phối nhanh
   - 2.2. Phân hệ Quản lý Sự kiện
   - 2.3. Phân hệ Quản lý Khóa học / Buổi đào tạo
   - 2.4. Phân hệ Quản lý Nhà tài trợ
   - 2.5. Phân hệ Tạo & Điều hành Biểu quyết
   - 2.6. Nhóm chức năng Báo cáo thống kê
   - 2.7. Phân hệ Nhắn tin & Trao đổi B2B
   - 2.8. Phân hệ Quản lý Công việc (Task Management)
   - 2.9. Phân hệ Quản lý Tài liệu tập trung (Documents Vault)
   - 2.10. Phân hệ Quản lý Phản ánh, Góp ý & Khảo sát
   - 2.11. Phân hệ Quản lý Thông báo tùy biến động
   - 2.12. Phân hệ Cài đặt hệ thống
   - 2.13. Nhóm chức năng Phân quyền vai trò chuẩn RBAC
3. **ĐẶC TẢ CHI TIẾT 6 CA SỬ DỤNG NGHIỆP VỤ TRỌNG TÂM (UC-1 -> UC-6)**
   - 3.1. UC-1: Luồng Đăng nhập chuẩn JWT & Bảo mật phân quyền
   - 3.2. UC-2: Luồng Quản lý Sự kiện (Cố định/Linh hoạt, QR Link Public, Giới hạn Capacity, Album Media, Đánh giá sao)
   - 3.3. UC-3: Luồng Tạo Buổi học / Khóa học (Cố định Thứ 7, Agenda slots, Gửi Slide tự động, Góp ý text/file, Media kho tài liệu)
   - 3.4. UC-4: Khai báo Vật dụng hỗ trợ Hậu cần & Tích hợp Kho Hiện vật Nhà tài trợ
   - 3.5. UC-5: Cơ chế Vận hành 2 Túi Quỹ & Quy trình Đề xuất chi, Xuất Phiếu chi PDF 5 chữ ký
   - 3.6. UC-6: Phân hệ Nhà tài trợ (Tiền mặt / Hiện vật, Tự động phân bổ quỹ & Gửi email tri ân)
4. **MÔ HÌNH VÒNG TRÒN TUẦN HOÀN DỮ LIỆU LIÊN KẾT GIỮA CÁC PHÂN HỆ**
5. **QUY CHUẨN GIAO DIỆN VÀ TRẢI NGHIỆM PHÂN QUYỀN RBAC MỚI**
6. **TIÊU CHÍ NGHIỆM THU NGHIỆP VỤ (BUSINESS ACCEPTANCE CRITERIA)**

---

## 1. TỔNG QUAN DỰ ÁN & SỨ MỆNH CLB DOANH NHÂN CEO HN10

### 1.1. Bối cảnh hình thành và tổ chức trực thuộc HanoiBA
Câu Lạc Bộ Doanh Nhân CEO HN10 là tổ chức thành viên trực thuộc Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA). Nơi đây quy tụ hơn 500+ Chủ tịch Hội đồng Quản trị, Tổng Giám đốc, Nhà sáng lập doanh nghiệp trên địa bàn Thủ đô Hà Nội. Để nâng tầm hiệu quả liên kết kinh tế, xúc tiến thương mại B2B nội khối và số hóa toàn bộ nghiệp vụ điều hành, CLB triển khai Hệ thống Phần mềm Quản trị Số Toàn Diện CEO HN10 gồm Cổng Thông Tin Web CRM dành cho Ban Điều Hành và Ứng dụng Di Động (Mobile App) dành cho Học viên doanh nhân.

### 1.2. Mục tiêu chiến lược của nền tảng số hóa quản trị
1. **Minh bạch hóa tài chính**: Quản trị dòng tiền qua cơ chế 2 Túi Quỹ (Túi Quỹ Chung và Túi Quỹ Tài Trợ) cập nhật biến động thời gian thực từ CSDL PostgreSQL `113.20.107.184:6432`, triệt tiêu sai lệch thu chi.
2. **Số hóa sự kiện & đào tạo**: Tự động hóa khâu đăng ký, soát vé QR, phân bổ chỗ ngồi, gửi slide tài liệu bài giảng và lưu trữ tư liệu hình ảnh vào kho dùng chung.
3. **Thắt chặt gắn kết Học viên**: Trao quyền cho Học viên tiếp cận kho tri thức chuyên sâu qua 30 khóa học hạt nhân, tham gia đóng góp ý kiến, biểu quyết dân chủ và khai thác cơ hội giao thương B2B.

### 1.3. Cơ cấu tổ chức & Đối tượng thụ hưởng (9 nhóm người dùng)
- **Chủ tịch CLB (President)**: Phê duyệt các nghị quyết, phê duyệt hạn mức chi ngân sách lớn, chỉ đạo chiến lược.
- **Phó Chủ tịch & Ban Điều Hành (Executive Board)**: Điều phối hoạt động chung, thẩm định đề xuất liên ban.
- **Ban Thư Ký (General Secretary)**: Quản lý thông tin Học viên, lịch trình công tác, văn thư lưu trữ, phát hành thông báo.
- **Ban Tài Chính (Finance Committee)**: Giám sát 2 túi quỹ, kiểm soát phiếu thu - chi, lập báo cáo ngân sách, thẩm định đề xuất kinh phí.
- **Ban Sự Kiện & Hậu Cần (Logistics & Events Committee)**: Khởi tạo và điều hành sự kiện, chuẩn bị vật phẩm, thiết bị, khai báo vật dụng hỗ trợ từ kho tài trợ.
- **Ban Đào Tạo (Training Committee)**: Quản lý chương trình 30 khóa học, sắp xếp giảng viên, gửi slide bài giảng, điểm danh học viên.
- **Ban Truyền Thông (Media Committee)**: Phát hành bản tin, quản lý thư viện hình ảnh sự kiện, truyền thông mạng xã hội.
- **Ban Đời Sống (Welfare Committee)**: Chăm lo hiếu hỷ, sinh nhật, giải trí, đề xuất kinh phí thăm hỏi từ Túi Quỹ Chung.
- **Học viên Doanh Nhân (Enterprise Members)**: Tham gia học tập, tham dự sự kiện, tiếp cận đối tác B2B, đánh giá chất lượng buổi học và sự kiện.

---

## 2. DANH MỤC 13 NHÓM CHỨC NĂNG HỆ THỐNG

### 2.1. Phân hệ Tổng quan (Dashboard) & Điều phối nhanh
- Hiển thị nhanh các chỉ số hoạt động then chốt (KPI): Tổng số Học viên, số doanh nghiệp, sự kiện sắp diễn ra, khóa học đang mở.
- Mặc định khởi tạo sẵn 4 sự kiện và 30 khóa học hạt nhân đáp ứng nhu cầu đào tạo liên tục.
- **Widget Ví 2 Túi Quỹ**: Truy vấn trực tiếp từ CSDL, thể hiện rõ số dư Túi Quỹ Chung và Túi Quỹ Tài Trợ (Tiền mặt & Hiện vật).
- **Widget Tham gia của Học viên**: Khi 1 Học viên ghi danh khóa học hoặc sự kiện, hệ thống tự động đẩy hiển thị lên đầu Dashboard cá nhân kèm nút "Tải Slide" và "Góp ý / Đánh giá".

### 2.2. Phân hệ Quản lý Sự kiện
- Khởi tạo sự kiện đa dạng: Sự kiện định kỳ cố định (Đại hội, Họp định kỳ) hoặc sự kiện bất thường (Gala, Xúc tiến thương mại).
- Phân loại sự kiện có phí (thu qua chuyển khoản/VietQR) hoặc miễn phí.
- Tự động sinh mã QR độc bản và liên kết đăng ký công khai cho phép khách mời và Học viên quét ghi danh.
- Tự động kiểm soát sức chứa: Khi đủ chỗ, hệ thống đóng form và thông báo "Sự kiện đã đủ chỗ".
- Đính kèm album ảnh và media sự kiện, tự động lưu trữ sang phân hệ Quản lý tài liệu.
- Thu thập đánh giá sao (1-5 sao) và nhận xét chất lượng tổ chức.

### 2.3. Phân hệ Quản lý Khóa học / Buổi đào tạo
- Thiết lập lớp học cố định (Thứ 7 hàng tuần) hoặc các buổi chuyên đề đột xuất.
- Quản lý thời gian biểu chi tiết từng tiết học (Agenda slots).
- Quy trình 3 bước: Đăng ký trước buổi học -> Điểm danh trong buổi học -> Gửi slide cho học viên tham gia.
- Học viên gửi phản hồi, đóng góp ý kiến dưới dạng văn bản (text) hoặc đính kèm tệp tin.
- Đính kèm liên kết video quay lại buổi học và lưu trữ tự động vào phân hệ Quản lý tài liệu.

### 2.4. Phân hệ Quản lý Nhà tài trợ
- Phân loại rõ ràng: Tài trợ bằng tiền mặt hoặc tài trợ bằng hiện vật.
- Hồ sơ nhà tài trợ đầy đủ: Họ tên, tuổi/ngày sinh, số điện thoại, website công ty, tên doanh nghiệp, hình thức tài trợ.
- Tự động cộng tiền vào Túi Quỹ Tài Trợ (tiền mặt) hoặc nhập kho hiện vật tài trợ.
- Tự động kích hoạt gửi email cảm ơn trang trọng đến nhà tài trợ.

### 2.5. Phân hệ Tạo & Điều hành Biểu quyết
- Khởi tạo các cuộc biểu quyết, thăm dò ý kiến điện tử (bầu cử Ban Điều Hành, thông qua nghị quyết, lựa chọn địa điểm dã ngoại).
- Thiết lập thời hạn biểu quyết, số phương án lựa chọn, hình thức bỏ phiếu kín hoặc công khai.
- Thống kê tỷ lệ phần trăm thời gian thực, trực quan hóa biểu đồ kết quả.

### 2.6. Nhóm chức năng Báo cáo thống kê
- Báo cáo tài chính thu chi, phân tích dòng tiền biến động theo ngày, tuần, tháng, quý, năm.
- Báo cáo chuyên cần: Tỷ lệ Học viên tham gia sự kiện và tỷ lệ đi học các khóa đào tạo.
- Xuất báo cáo đa định dạng: Excel (.xlsx), Word (.docx) và PDF (.pdf).

### 2.7. Phân hệ Nhắn tin & Trao đổi B2B
- Nhắn tin riêng tư 1-1 giữa các chủ doanh nghiệp để trao đổi hợp tác kinh doanh.
- Phòng chat theo ban chuyên môn (Ban Tài Chính, Ban Sự Kiện, Ban Đào Tạo).
- Thông báo tin nhắn thời gian thực qua Web Socket.

### 2.8. Phân hệ Quản lý Công việc (Task Management)
- Giao việc từ Ban Điều Hành xuống các ban chuyên môn và từng thành viên.
- Theo dõi tiến độ công việc theo mô hình bảng Kanban (Cần làm, Đang làm, Hoàn thành).
- Đính kèm tài liệu bàn giao và báo cáo kết quả thực hiện.

### 2.9. Phân hệ Quản lý Tài liệu tập trung (Documents Vault)
- Kho lưu trữ số hóa toàn bộ tài liệu của CLB: Điều lệ, nghị quyết, quy chế hoạt động.
- Kho tài liệu đào tạo: Tự động tiếp nhận slide từ các khóa học (category `training_materials`).
- Kho tư liệu media: Tự động tiếp nhận link ảnh, video từ sự kiện và khóa học (category `event_media`).
- Phân quyền tải về và bảo mật 2 tầng.

### 2.10. Phân hệ Quản lý Phản ánh, Góp ý & Khảo sát
- Tiếp nhận ý kiến đóng góp của Học viên về công tác điều hành của Ban Chấp Hành.
- Phân loại phản ánh theo ban phụ trách: Đào tạo, Sự kiện, Tài chính, Đời sống.
- Theo dõi trạng thái xử lý phản ánh (Mới tiếp nhận, Đang xử lý, Đã giải quyết, Phản hồi Học viên).

### 2.11. Phân hệ Quản lý Thông báo tùy biến động
- Cho phép tạo các mẫu thông báo đa dạng (Hội phí, Thư mời họp, Lịch đào tạo, Cảnh báo khẩn).
- Khả năng thêm trường dữ liệu, xóa trường tùy thích theo nhu cầu từng loại thông báo.
- Gửi thông báo đa kênh: In-app badge, Email thông báo, và Zalo ZNS.

### 2.12. Phân hệ Cài đặt hệ thống
- Cấu hình thông tin pháp nhân CLB Doanh Nhân CEO HN10, biểu trưng, ban chấp hành đương nhiệm.
- Cấu hình máy chủ CSDL, kết nối cổng thanh toán, tài khoản email gửi tự động.
- Quản lý nhật ký kiểm toán hệ thống (Audit logs).

### 2.13. Nhóm chức năng Phân quyền vai trò chuẩn RBAC
- Quản lý ma trận phân quyền dựa trên vai trò (Role-Based Access Control).
- Thiết kế giao diện chuyển đổi linh hoạt: "Theo Từng Vai Trò" và "Bảng Ma Trận Đối Chiếu".
- 100% tiếng Việt chuẩn mực, hỗ trợ bộ cài đặt sẵn (Cấp toàn quyền, Chỉ xem, Quản lý chuẩn, Thu hồi).

---

## 3. ĐẶC TẢ CHI TIẾT 6 CA SỬ DỤNG NGHIỆP VỤ TRỌNG TÂM (UC-1 -> UC-6)

### 3.1. UC-1: Luồng Đăng nhập chuẩn JWT & Bảo mật phân quyền
- **Mục tiêu**: Xác thực danh tính người dùng bảo mật, an toàn, hỗ trợ cơ chế cấp token phiên làm việc.
- **Tác nhân**: Toàn bộ người dùng hệ thống (Admin, Lãnh đạo, Học viên).
- **Luồng nghiệp vụ chính**:
  1. Người dùng nhập Email/Tên đăng nhập và Mật khẩu.
  2. Hệ thống kiểm tra thông tin trong bảng `public.ceohn10_users` và mã băm bcrypt.
  3. Khi hợp lệ, hệ thống sinh cặp Access Token (JWT thời hạn ngắn) và Refresh Token (thời hạn dài).
  4. Hệ thống nạp thông tin vai trò từ `public.user_roles` và `executive_role`, đóng gói vào payload.
  5. Giao diện nhận diện quyền hạn và điều hướng người dùng tới Dashboard quản trị tương ứng.

### 3.2. UC-2: Luồng Quản lý Sự kiện
- **Mục tiêu**: Tổ chức sự kiện chuyên nghiệp, quản trị vé mời điện tử, kiểm soát sức chứa và lưu vết tư liệu.
- **Tác nhân**: Ban Sự Kiện & Hậu Cần, Khách mời, Học viên.
- **Luồng nghiệp vụ chính**:
  1. Ban Sự Kiện khởi tạo sự kiện: Tên sự kiện, thời gian bắt đầu/kết thúc, địa điểm, hình thức (Cố định / Đột xuất), chi phí (Có phí / Miễn phí), giới hạn người tham dự (Capacity).
  2. Hệ thống sinh mã QR sự kiện và đường link công khai: `https://ceohn10.viconnect.vn/guest-event-register/{id}`.
  3. Người tham gia quét QR để truy cập biểu mẫu đăng ký.
  4. **Kiểm soát sức chứa**: Trước khi lưu đăng ký, hệ thống kiểm tra số lượng bản ghi trong `event_registrations`. Nếu số lượng đã đạt ngưỡng Capacity, hệ thống từ chối đăng ký và hiển thị cảnh báo: **"Sự kiện đã đủ chỗ"**.
  5. **Tải tư liệu ảnh & media**: Trong và sau sự kiện, Ban Sự Kiện tải link album Google Drive / Flickr lên hệ thống. Dữ liệu này tự động được lưu trữ vào phân hệ Quản lý tài liệu (`public.documents` - `event_media`).
  6. **Đánh giá sự kiện**: Người tham dự mở giao diện phản hồi, chấm điểm từ 1 đến 5 sao kèm ý kiến đóng góp.

### 3.3. UC-3: Luồng Tạo Buổi học / Khóa học
- **Mục tiêu**: Đào tạo nâng cao năng lực quản trị doanh nghiệp cho Học viên với lộ trình 30 khóa học.
- **Tác nhân**: Ban Đào Tạo, Giảng viên chuyên đề, Học viên doanh nhân.
- **Luồng nghiệp vụ chính**:
  1. Ban Đào Tạo tạo lớp học: Tên khóa học, mô tả, giảng viên, loại hình (Cố định vào Thứ 7 hàng tuần hoặc linh hoạt).
  2. Thiết lập thời gian biểu chi tiết từng khung giờ trong buổi học (VD: 08:00 - 08:30: Đón tiếp; 08:30 - 10:00: Chuyên đề 1; 10:00 - 10:15: Teabreak; 10:15 - 11:45: Thảo luận tình huống).
  3. **Đăng ký tham gia**: Học viên bấm đăng ký trước ngày mở lớp.
  4. **Điểm danh buổi học**: Trong buổi học, Ban Đào Tạo hoặc Giảng viên thực hiện điểm danh học viên thực tế có mặt.
  5. **Gửi slide bài giảng**: Khi buổi học diễn ra hoặc kết thúc, Ban Đào Tạo bấm nút **"Gửi Slide cho học viên"**. Hệ thống gửi tài liệu tới hòm thư của học viên đã điểm danh, đồng thời tự động lưu trữ tài liệu vào phân hệ Quản lý tài liệu (`public.documents` - `training_materials`).
  6. **Đóng góp ý kiến sau buổi học**: Học viên có phần gửi phản hồi, có thể nhập văn bản nhận xét hoặc đính kèm tệp tin đánh giá.
  7. **Lưu trữ Media khóa học**: Đính kèm đường dẫn video bài giảng và album ảnh lưu trữ tự động vào Quản lý tài liệu.

### 3.4. UC-4: Khai báo Vật dụng hỗ trợ Hậu cần
- **Mục tiêu**: Đảm bảo công tác chuẩn bị chu đáo trang thiết bị cho sự kiện và các buổi học, tối ưu nguồn tài trợ.
- **Tác nhân**: Ban Sự Kiện & Hậu Cần, Ban Tài Chính.
- **Luồng nghiệp vụ chính**:
  1. Tại chi tiết mỗi sự kiện hoặc buổi học, Ban Sự Kiện & Hậu Cần mở giao diện **Khai báo vật dụng hỗ trợ** (`SupplyDeclarationModal`).
  2. Cán bộ hậu cần nhập: Tên vật dụng (Máy chiếu, standee, hoa tươi, quà tặng, tài liệu in), số lượng, đơn vị tính, chi phí ước tính.
  3. **Tùy chọn lấy từ Nhà tài trợ**: Cán bộ hậu cần có thể chọn nguồn hàng lấy trực tiếp từ **Kho hiện vật nhà tài trợ**. Khi chọn phương án này, chi phí mua sắm tự động quy đổi thành 0 VNĐ, hệ thống ghi nhận rõ vật dụng do đơn vị tài trợ nào cung cấp.
  4. Dữ liệu vật tư được lưu vào bảng `public.supplies`.

### 3.5. UC-5: Cơ chế Vận hành 2 Túi Quỹ & Phiếu chi PDF 5 Chữ Ký
- **Mục tiêu**: Quản trị tài chính công khai, minh bạch, kiểm soát chặt chẽ từng đồng ngân sách chi tiêu.
- **Tác nhân**: Ban Tài Chính, Ban Sự Kiện & Hậu Cần, Ban Đời Sống, Chủ tịch CLB, Người nhận tiền.
- **Cơ chế 2 Túi Quỹ**:
  1. **Túi Quỹ Chung**:
     - *Nguồn thu*: Tổng hợp từ đóng góp hội phí thường niên của Học viên CLB.
     - *Mục đích chi*: Phục vụ chi tiêu thường xuyên, chi cho cuộc họp các ban, chi cho các sự kiện chung của CLB. Ví dụ: Sự kiện hiếu hỷ, sinh nhật thuộc phụ trách của Ban Đời Sống.
     - *Quy chuẩn báo cáo chi*: Báo cáo chi bắt buộc phải chỉ rõ: Chi vào sự kiện nào, thuộc ban chuyên môn nào, lý do chi và **ai là người nhận tiền**.
     - *Xuất Phiếu Chi PDF*: Hệ thống tích hợp tính năng kết xuất Phiếu Chi chuẩn kế toán ra định dạng PDF hoặc in trực tiếp, có đầy đủ **5 vị trí ký tên**:
       * 1. Người lập phiếu (Ban chuyên môn đề xuất)
       * 2. Người nhận tiền (Cá nhân hoặc đại diện đối tác thụ hưởng)
       * 3. Thủ quỹ / Kế toán (Người trực tiếp xuất tiền mặt/chuyển khoản)
       * 4. Trưởng Ban Tài Chính (Thẩm tra tính hợp lý, hợp lệ của khoản chi)
       * 5. Chủ tịch CLB (Phê duyệt chi ngân sách)
  2. **Túi Quỹ Tài Trợ**:
     - *Nguồn thu*: Tiếp nhận tiền mặt hoặc hiện vật ủng hộ từ các Nhà tài trợ.
     - *Phân chia 2 mục rõ ràng*:
       * **Mục 1 - Tiền mặt tài trợ**: Dành để tài trợ kinh phí cho các sự kiện, buổi học khi Ban Sự Kiện & Hậu Cần lập đề xuất xin cấp kinh phí.
       * **Mục 2 - Kho hiện vật tài trợ**: Quản lý số lượng hiện vật tồn kho sẵn sàng cấp phát cho các ban phục vụ tổ chức chương trình.
- **Quy trình đề xuất chi phí Ban Hậu cần**:
  1. Ban Hậu cần sau khi lên danh mục dụng cụ, thiết yếu phẩm cần mua sắm sẽ lập Phiếu đề xuất kinh phí.
  2. Gửi đề xuất tới Trưởng Ban Tài Chính thẩm tra định mức.
  3. Trình Chủ tịch CLB phê duyệt trực tuyến trên hệ thống trước khi xuất quỹ.

### 3.6. UC-6: Phân hệ Quản lý Nhà tài trợ
- **Mục tiêu**: Thu hút nguồn lực xã hội hóa, ghi nhận tri ân nhà tài trợ và luân chuyển nguồn lực vào 2 túi quỹ.
- **Tác nhân**: Ban Tài Chính, Ban Đối Ngoại, Nhà tài trợ.
- **Luồng nghiệp vụ chính**:
  1. Khi tiếp nhận một nhà tài trợ mới, cán bộ quản lý mở biểu mẫu thêm mới Nhà tài trợ.
  2. Nhập các trường thông tin bắt buộc: Họ và tên nhà tài trợ, ngày tháng năm sinh (hệ thống tự động tính ra số tuổi), số điện thoại, địa chỉ email, website doanh nghiệp, tên công ty / tổ chức đại diện.
  3. **Lựa chọn hình thức tài trợ**:
     - *Tài trợ bằng tiền*: Nhập số tiền tài trợ. Hệ thống tự động cộng thẳng số tiền này vào số dư Tiền mặt của Túi Quỹ Tài Trợ, đồng thời ghi nhận một giao dịch Thu tài chính vào sổ quỹ.
     - *Tài trợ bằng hiện vật*: Nhập danh mục từng món hiện vật (Tên vật phẩm, số lượng, đơn vị tính, tổng định giá quy đổi). Hệ thống đẩy thẳng toàn bộ danh mục này vào Kho hiện vật của Túi Quỹ Tài Trợ.
  4. **Tự động gửi email cảm ơn**: Ngay sau khi bấm lưu thông tin nhà tài trợ, hệ thống tự động kích hoạt tiến trình gửi một bức thư cảm ơn trang trọng về địa chỉ email của nhà tài trợ kèm mã số chứng nhận đồng hành cùng CLB Doanh Nhân CEO HN10.

---

## 4. MÔ HÌNH VÒNG TRÒN TUẦN HOÀN DỮ LIỆU LIÊN KẾT GIỮA CÁC PHÂN HỆ

Hệ thống CEO HN10 được kiến trúc theo nguyên lý **Tuần hoàn dữ liệu khép kín (Data Loop)**. Các phân hệ không đứng độc lập mà gọi API xoay vòng liên quan mật thiết với nhau:

1. **Nhà tài trợ -> Túi Quỹ Tài Trợ**: Cung cấp tiền mặt và hiện vật vào kho quỹ.
2. **Kho hiện vật -> Khai báo vật tư hậu cần (UC-4)**: Cung ứng trang thiết bị cho Sự kiện (UC-2) và Buổi học (UC-3).
3. **Đề xuất kinh phí Sự kiện/Buổi học -> Túi Quỹ**: Rút tiền từ Túi Quỹ Chung hoặc Quỹ Tài Trợ, sinh Phiếu chi PDF 5 chữ ký.
4. **Sự kiện & Buổi học -> Quản lý tài liệu (Documents Vault)**: Slide đào tạo và album ảnh tư liệu tự động đồng bộ vào Kho tài liệu số dùng chung.
5. **Sự kiện & Buổi học -> Quản lý Phản ánh & Góp ý**: Thu nhận ý kiến đóng góp của học viên và khách mời chuyển về Ban chuyên môn xử lý.
6. **Học viên tham gia Sự kiện & Buổi học -> Dashboard Tổng quan**: Dữ liệu ghi danh tự động hiển thị trên Dashboard cá nhân kèm nút tải slide và gửi góp ý nhanh.

---

## 5. QUY CHUẨN GIAO DIỆN VÀ TRẢI NGHIỆM PHÂN QUYỀN RBAC MỚI

Phân hệ Phân quyền tại `/permissions` được thiết kế lại toàn diện:
- **Giao diện 2 Chế độ hiển thị**:
  1. *Chế độ Theo Từng Vai Trò*: Danh sách vai trò ở cột trái kèm huy hiệu tiến độ cấp quyền (VD: 34/38 quyền). Cột phải hiển thị danh mục quyền dạng thẻ lưới có công tắc Bật/Tắt nhanh theo từng hành vi (Xem, Thêm, Sửa, Xóa, Duyệt, Xuất Excel).
  2. *Chế độ Bảng Ma Trận Đối Chiếu*: Trực quan hóa bảng đối chiếu tổng thể toàn bộ các vai trò và quyền hạn ngang dọc phục vụ rà soát thanh tra.
- **Bộ thiết lập nhanh (Quick Presets)**: Cung cấp 4 nút cấu hình 1 chạm: "Cấp toàn quyền", "Chỉ xem", "Quản lý chuẩn", "Thu hồi tất cả".
- **Chuẩn hóa ngôn ngữ**: 100% tiếng Việt trong sáng, không để sót bất kỳ từ tiếng Anh nào trên nhãn và chú giải.

---

## 6. TIÊU CHÍ NGHIỆM THU NGHIỆP VỤ (BUSINESS ACCEPTANCE CRITERIA)

| Mã tiêu chí | Hạng mục kiểm tra | Tiêu chuẩn đạt |
| :--- | :--- | :--- |
| **BAC-01** | Kết nối CSDL chuẩn | 100% dữ liệu đọc/ghi trực tiếp vào PostgreSQL 113.20.107.184:6432, không có mock/fake data. |
| **BAC-02** | Khởi tạo mặc định | Dashboard hiển thị đúng 4 sự kiện và 30 khóa học hạt nhân. |
| **BAC-03** | Khóa đăng ký sự kiện | Khi sự kiện đầy chỗ (số đăng ký = capacity), hệ thống khóa đăng ký và báo "Sự kiện đã đủ chỗ". |
| **BAC-04** | Lưu trữ tài liệu tự động | Slide đào tạo và media sự kiện tự động lưu vào public.documents. |
| **BAC-05** | Xuất Phiếu Chi PDF | Phiếu chi kết xuất định dạng PDF chuẩn, thể hiện rõ sự kiện, ban, người nhận và 5 chữ ký. |
| **BAC-06** | Túi Quỹ Tài Trợ | Tiếp nhận nhà tài trợ tự động phân bổ vào Tiền mặt hoặc Kho hiện vật, tự động gửi email cảm ơn. |
| **BAC-07** | Chuẩn hóa tiếng Việt | 100% giao diện phân quyền RBAC và chức năng sử dụng tiếng Việt hoàn chỉnh. |

---
*Tài liệu được phê duyệt và áp dụng chính thức cho toàn bộ dự án CEO HN10.*

