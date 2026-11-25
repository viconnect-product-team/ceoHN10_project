# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)
## USE CASES: TOÀN BỘ VÒNG ĐỜI SỰ KIỆN & QUẢN TRỊ DÒNG TIỀN PHÍ SỰ KIỆN
### HỆ THỐNG ĐIỀU HÀNH & KẾT NỐI LỚP HỌC DOANH NHÂN CEO HN10 (HANOIBA)
*Tuân thủ tiêu chuẩn: IEEE 830-1998 / ISO/IEC/IEEE 29148:2018*  
*Phiên bản: 3.0 - Cập nhật Chi tiết theo Luồng Nghiệp vụ & Ràng buộc Hệ thống*

---

## 1. GIỚI THIỆU TỔNG QUAN (INTRODUCTION)

### 1.1. Mục Đích Tài Liệu
Tài liệu này xác định chi tiết toàn bộ các Trường Hợp Sử Dụng (Use Cases) cho quy trình quản lý sự kiện và tài chính phí sự kiện của lớp học Doanh nhân CEO HN10 (Hội Doanh Nhân Trẻ Hà Nội - HanoiBA). Tài liệu phục vụ cho việc chuẩn hóa quy trình nghiệp vụ, làm căn cứ kiểm thử (QA/QC), nghiệm thu và điều chỉnh mã nguồn hệ thống.

### 1.2. Ràng Buộc Kiến Trúc & Định Tuyến Tối Cao
> [!IMPORTANT]
> **ĐỊNH TUYẾN CÔNG KHAI (STRICT PUBLIC STANDALONE RULE)**:
> Form Đăng Ký Tham Gia Sự Kiện (`/guest-event-register/:eventId`) và Form Check-in Điểm Danh (`/event-checkin`) **BẮT BUỘC PHẢI LÀ CÁC ROUTE CÔNG KHAI (PUBLIC)**.
> Bất kỳ ai quét mã QR qua Camera điện thoại, Zalo, hoặc trình duyệt web thông thường đều có thể mở form trực tiếp để đăng ký hoặc điểm danh, **TUYỆT ĐỐI KHÔNG BỊ REDIRECT (CHUYỂN HƯỚNG)** vào trang Đăng nhập hệ thống CRM hay Mobile App.

---

## 2. DANH MỤC 9 NHÓM TÁC NHÂN HỆ THỐNG (ACTOR CATALOG)

> **QUY CHUẨN ĐẶC BIỆT**: Hệ thống lớp CEO HN10 **TUYỆT ĐỐI KHÔNG CÓ** Ban Thư Ký hay Kế Toán riêng. Toàn bộ cơ cấu nhân sự được chuẩn hóa chính xác thành **9 nhóm tác nhân** như sau:

| Mã Tác Nhân | Tên Vai Trò / Tác Nhân | Trách Nhiệm & Quyền Hạn Trong Hệ Thống |
| :--- | :--- | :--- |
| **ACT-01** | **Platform Admin** | Quản trị viên cấp cao nhất hệ thống Master Platform. Toàn quyền hạ tầng, phân quyền hệ thống, sao lưu cơ sở dữ liệu và giám sát kỹ thuật. |
| **ACT-02** | **Admin** | Quản trị viên vận hành hệ thống CEO HN10; hỗ trợ kỹ thuật, kiểm tra cấu hình sự kiện, giám sát cổng thanh toán. |
| **ACT-03** | **Lớp trưởng** | Thủ lĩnh điều hành cao nhất của tập thể lớp CEO HN10; có thẩm quyền tối cao phê duyệt kế hoạch tổ chức sự kiện, duyệt hạn mức cấp kinh phí sự kiện từ Quỹ Tổng của lớp, ban hành thông báo chính thức. |
| **ACT-04** | **Lớp phó** | Hỗ trợ Lớp trưởng điều hành lớp; phụ trách công tác tài chính, quản lý Quỹ Tổng lớp học, theo dõi dòng tiền thu/chi sự kiện, thực hiện cấp tiền và đối soát sao kê ngân hàng. |
| **ACT-05** | **Trưởng team** | Trưởng nhóm các nhóm học viên trong lớp (Team Leader); chịu trách nhiệm đôn đốc, quản lý các thành viên trong team tham gia sự kiện và hoàn thành nộp phí sự kiện. |
| **ACT-06** | **Phó team** | Hỗ trợ Trưởng team phụ trách nhóm; theo dõi điểm danh, nhắc nhở đóng phí và gắn kết các thành viên trong team tại sự kiện. |
| **ACT-07** | **7 Trưởng ban chuyên trách** | Gồm 7 ban: **Ban Sự Kiện Hậu Cần**, **Ban Truyền Thông**, **Ban Học Tập**, **Ban Đối Nội Đối Ngoại**, **Ban Đời Sống Xã Hội**, **Ban Thiện Nguyện**, **Ban Công Nghệ**. Phụ trách triển khai các mảng nghiệp vụ chuyên môn tương ứng. |
| **ACT-08** | **Giảng viên** | Chuyên gia đào tạo, diễn giả đứng lớp; xem danh sách học viên tham gia, tài liệu giảng dạy và nhận đánh giá từ học viên. |
| **ACT-09** | **Học viên & Khách mời** | Doanh nhân thành viên của lớp CEO HN10 và khách mời đối tác bên ngoài; đăng ký sự kiện, mua vé, nhận mã QR, check-in, biểu quyết, quay thưởng và đóng góp ý kiến. |

---

## 3. PHẦN 1: CÁC USE CASE TRƯỚC SỰ KIỆN (PRE-EVENT)

### Use Case UC-EVT-01: Khởi Tạo Sự Kiện & Khai Báo Hạng Vé
* **Tác nhân (Actor)**: Trưởng Ban Sự Kiện Hậu Cần, Trưởng Ban Truyền Thông, Platform Admin, Admin.
* **Điều kiện tiên quyết**: Đăng nhập tài khoản có quyền `events:create`.
* **Luồng nghiệp vụ chính**:
  1. Ban Sự Kiện nhập thông tin: Tên sự kiện, Banner, Thời gian bắt đầu/kết thúc, Địa điểm (Google Map Address Picker), Ban phụ trách.
  2. Khai báo đa hạng vé (Ticket Tiers):
     * **Vé VIP**: Ví dụ: 1.000.000 đ - Giới hạn 50 vé - Quyền lợi: Bàn VIP, Kỷ yếu.
     * **Vé Tiêu chuẩn**: Ví dụ: 500.000 đ - Giới hạn 200 vé.
     * **Vé Khách mời Danh dự / Báo chí**: 0 đ - Cần phê duyệt của Ban Điều Hành.
  3. Cấu hình phân ban tài chính: Chọn Quỹ nhận tiền (Mặc định: Quỹ Tổng CLB).
  4. Xuất bản sự kiện: Sự kiện hiển thị lên Slider Trang chủ Mobile App và Cổng Web CRM.
  5. **Tính năng mở rộng (Smart Document Importer)**: Cho phép import file Excel, Word, PDF chứa nội dung kế hoạch sự kiện để hệ thống AI/Document Parser tự động bóc tách tên, ngày giờ, địa điểm, sức chứa và tạo sự kiện mới.

---

### Use Case UC-EVT-02: Học Viên / Khách Mời Đăng Ký & Mua Vé Trực Tuyến
* **Tác nhân**: Học viên Doanh nhân (Mobile App), Khách mời ngoài CLB qua thư mời hoặc link web.
* **Luồng nghiệp vụ chính**:
  1. Người đăng ký quét mã QR của từng hạng vé hoặc chọn vé trên giao diện công khai: Vé VIP mở form VIP, vé Tiêu chuẩn mở form Tiêu chuẩn.
  2. Điền form đăng ký (Nếu là Học viên: Hệ thống tự động tra cứu mã học viên và điền Họ tên, Doanh nghiệp, Mã học viên, Chức vụ).
  3. **Đăng ký nhiều vé (Multi-ticket)**: Nếu chọn số lượng vé $\ge 2$, hệ thống tự động mở rộng thêm các form con để điền thông tin cho người thứ 2, thứ 3... đi cùng.
  4. Tính tổng tiền tự động theo cơ cấu vé đã chọn (ví dụ: 1 VIP + 1 Tiêu chuẩn, 2 VIP...).
  5. Thanh toán phí tham gia:
     * **Trường hợp vé 0 đ**: Hệ thống duyệt ngay và phát hành vé điện tử cho cả người đăng ký và người được đăng ký hộ.
     * **Trường hợp vé có phí**: Nổi ngay mã VietQR chuyển khoản ngân hàng tích hợp SePay với cú pháp động: `CEO1983_EVT_[ID]`. Có nút bấm link trực tiếp đến app ngân hàng (Deep Link) để mở ứng dụng ngân hàng và thanh toán không cần nhập tay.
  6. Sau khi thanh toán thành công, SePay gửi Webhook về máy chủ, hệ thống tự động đổi trạng thái sang Đã thanh toán (Paid) và gửi vé điện tử (kèm mã QR check-in) qua Email và Zalo OA cho cả người đăng ký và người đi cùng.

---

### Use Case UC-EVT-03: Import Đại Biểu Từ Excel (Kiểm Tra Vé & Giá Nghiêm Ngặt)
* **Tác nhân**: Trưởng Ban Sự Kiện Hậu Cần, Trưởng Ban Truyền Thông.
* **Mục đích**: Nhập danh sách đại biểu nộp qua kênh riêng hoặc danh sách đối tác khách mời.
* **Ràng buộc an toàn dữ liệu (Strict Ticket Validation Rule)**:
  * File Excel import bắt buộc có các cột: Họ tên, Số điện thoại/Email, Loại vé, Giá vé, Trạng thái thanh toán.
  * Hệ thống thực hiện đối soát tự động với cấu hình sự kiện:
    * **Tình huống 1**: Nếu Loại vé trong file lệch tên (ví dụ: gõ "Vé Khách Vip" trong khi sự kiện chỉ có "Vé VIP") -> Từ chối import dòng đó, báo đỏ chi tiết.
    * **Tình huống 2**: Nếu Loại vé khớp tên nhưng Giá vé trong file lệch số tiền đã khai báo (ví dụ vé VIP khai báo 1.000.000 đ nhưng file ghi 800.000 đ) -> Chặn import và yêu cầu sửa lại giá đúng.
  * Chỉ những dòng khớp hoàn toàn 100% loại vé và giá vé mới được nạp vào hệ thống.
  * Tự động bổ sung cột động (Dynamic DDL) nếu file Excel có thêm các cột trường dữ liệu mới.

---

### Use Case UC-EVT-04: Phát Hành Vé Điện Tử & Thẻ QR Định Danh
* **Tác nhân**: Hệ thống tự động (Backend Daemon / Socket / Mailer).
* **Luồng nghiệp vụ**:
  1. Tạo mã QR Check-in mã hóa bảo mật chuẩn HMAC-SHA256 chứa `registration_id`, `event_id`, `ticket_tier`.
  2. Gửi vé điện tử đa kênh:
     * Hiển thị trực tiếp tại mục **Vé Sự Kiện Của Tôi** trên Mobile App.
     * Gửi email xác nhận kèm vé điện tử đính kèm mã QR.
     * Gửi tin nhắn Zalo ZNS / Zalo OA thông báo giờ giấc và sơ đồ chỗ ngồi.

---

## 4. PHẦN 2: CÁC USE CASE TRONG SỰ KIỆN (IN-EVENT)

### Use Case UC-EVT-05: Check-in Điểm Danh Quét Mã QR (Hỗ Trợ Online & Offline)
* **Tác nhân**: Trưởng Ban Sự Kiện Hậu Cần, Trưởng Ban Truyền Thông (Ban Lễ Tân Check-in).
* **Luồng nghiệp vụ chính**:
  1. Đại biểu xuất trình mã QR trên màn hình điện thoại hoặc vé in.
  2. Lễ tân quét mã QR:
     * Hệ thống kiểm tra: Đúng sự kiện? Đã thanh toán tiền vé chưa? Đã check-in trước đó chưa? (Chặn quét trùng lặp).
     * Nếu hợp lệ: Màn hình báo xanh "Check-in thành công - Chào mừng Doanh nhân [Tên]".
  3. **Tự động đánh dấu thời gian Check-in thực tế**:
     * **Đúng giờ**: Điểm danh trước hoặc trong vòng 15 phút sau giờ khai mạc.
     * **Đi muộn**: Điểm danh sau giờ khai mạc quá 15 phút.
  4. **Chế độ Offline Check-in (Khi mất mạng tại sảnh khách sạn)**:
     * Ứng dụng tự động lưu danh sách đại biểu vào bộ nhớ đệm an toàn (Local Cache / IndexedDB).
     * Khi quét offline, app đối soát trực tiếp trên cache và ghi nhận trạng thái check-in.
     * Khi có mạng internet trở lại, hệ thống tự động đồng bộ (Auto-sync) toàn bộ dữ liệu check-in lên máy chủ VPS.

---

### Use Case UC-EVT-05-1: Check-in Điểm Danh Quét Mã QR Đối Với Khách
* **Tác nhân**: Tất cả đại biểu đã đăng ký tham gia sự kiện.
* **Luồng nghiệp vụ chính**:
  1. Đại biểu dùng App CEO HN10, ứng dụng Zalo hoặc camera điện thoại quét mã QR chung của sự kiện đặt tại bàn đón tiếp.
  2. Form Check-in công khai mở ra, yêu cầu đại biểu nhập mã vé đã gửi về email hoặc tải ảnh có chứa mã QR vé lên.
  3. Hệ thống đối soát mã vé, nếu hợp lệ:
     * Ghi nhận trạng thái Đã điểm danh vào cơ sở dữ liệu sự kiện.
     * Gửi ngay email xác nhận check-in thành công cho đại biểu.
     * Hiển thị thông tin vị trí chỗ ngồi / bàn tiệc được phân công.

---

### Use Case UC-EVT-05-2: Xếp Chỗ (Seat Assignment)
* **Tác nhân**: Trưởng Ban Sự Kiện Hậu Cần, Trưởng Ban Truyền Thông.
* **Luồng nghiệp vụ chính**:
  1. Sau khi sự kiện được lên lịch, chức năng xếp chỗ tự động căn cứ theo số lượng ghế và hạng vé (Bàn VIP, Bàn Doanh nghiệp, Bàn Khách mời).
  2. Ban Sự Kiện phân bổ chỗ ngồi/ghế số cho người đã đăng ký sự kiện.
  3. Khi check-in (bằng máy lễ tân hoặc khách tự quét), hệ thống hiển thị chính xác số bàn/ghế và gửi thông báo vị trí ngồi về email cho đại biểu.

---

### Use Case UC-EVT-06: Tiếp Đón Khách Vãng Lai & Thu Phí Tại Bàn (Walk-in Desk)
* **Tác nhân**: Khách chưa đăng ký trước, Ban Lễ Tân Sự Kiện.
* **Luồng nghiệp vụ**:
  1. Khách đến bàn lễ tân đăng ký bổ sung.
  2. Khách quét mã QR check-in, chọn mục "Đăng ký khách mới" ngay trên form check-in công khai.
  3. Chọn loại vé: Màn hình hiển thị mã VietQR thanh toán động đúng số tiền vé.
  4. Sau khi khách chuyển khoản thành công (hoặc nộp tiền mặt được lễ tân xác nhận "Đã thu tiền"): Hệ thống tự động xuất mã vé, tính là đã check-in và lưu vào danh mục khách mới đăng ký của sự kiện.

---

### Use Case UC-EVT-07: Tương Tác Sự Kiện (Biểu Quyết & Vòng Quay May Mắn)
* **Tác nhân**: Toàn thể đại biểu đã check-in, Trưởng Ban Công Nghệ, Trưởng Ban Sự Kiện.
* **1. Biểu quyết thời gian thực (Realtime Voting)**:
  * Ban Tổ Chức kích hoạt câu hỏi biểu quyết trên Web CRM.
  * Học viên dùng App CEO HN10 nhận popup bình chọn; khách ngoài nhận form biểu quyết qua email/Zalo OA.
  * Biểu đồ tỷ lệ kết quả nhảy realtime trên màn hình LED sân khấu qua WebSocket.
* **2. Vòng Quay May Mắn (Lucky Draw)**:
  * Hệ thống **chỉ lấy danh sách những đại biểu đã thực tế Check-in** tại sự kiện (loại bỏ hoàn toàn người vắng mặt).
  * **Bộ lọc Chức danh**: Có tùy chọn lọc theo Chức danh (Chủ tịch, CEO, Giám đốc, Học viên...) để hệ thống tự động thêm những người đã check-in có chức danh đó vào vòng quay may mắn. Mặc định luôn lấy tất cả đại biểu đã check-in.
  * Vòng quay hiển thị đồ họa hoành tráng trên màn hình LED, công bố giải thưởng và thông báo ngay về máy người trúng giải.

---

### Use Case UC-EVT-08: Thư Viện Ảnh Live (Live Photo Gallery)
* **Tác nhân**: Trưởng Ban Truyền Thông, Trưởng Ban Sự Kiện Hậu Cần, Đại biểu tham dự.
* **Luồng nghiệp vụ**:
  1. Ban Truyền Thông chụp ảnh và upload trực tiếp ảnh sự kiện lên hệ thống (lưu trữ CDN và tự động đồng bộ vào Kho Tài Liệu CLB).
  2. **Nút chia sẻ link kho ảnh**: Có nút bấm gửi ngay đường link kho ảnh qua Email và Zalo OA cho tất cả đại biểu đã đăng ký tham gia sự kiện.
  3. Đại biểu mở mục "Ảnh Sự Kiện" trên Mobile App để xem trực tiếp các khoảnh khắc vừa chụp.
  4. Hỗ trợ tìm ảnh theo khuôn mặt (Face Recognition) giúp Hội viên tải nhanh ảnh có mặt mình để chia sẻ lên mạng xã hội.

---

## 5. PHẦN 3: CÁC USE CASE SAU SỰ KIỆN (POST-EVENT)

### Use Case UC-EVT-09: Khảo Sát Đánh Giá & Phản Ánh Góp Ý
* **Tác nhân**: Học viên, Khách đã tham dự.
* **Luồng nghiệp vụ**:
  1. Sau khi sự kiện kết thúc, hệ thống tự động gửi thông báo cảm ơn và mời đánh giá chất lượng sự kiện.
  2. Mẫu khảo sát gồm: Chấm điểm 1-5 sao (NPS Score), góp ý về diễn giả, địa điểm, tiệc tối.
  3. Kết quả đánh giá được tự động tổng hợp thành báo cáo đo lường chỉ số hài lòng.
  4. **Cơ chế đóng tự động**: Cổng khảo sát tự động đóng sau 24 giờ kể từ thời điểm sự kiện kết thúc.

---

### Use Case UC-EVT-10: Xuất Báo Cáo Sự Kiện Đa Danh Mục (3 Định Dạng Chuẩn)
* **Tác nhân**: Trưởng Ban Sự Kiện Hậu Cần, Lớp phó, Lớp trưởng, Admin.
* **Luồng nghiệp vụ**:
  1. Người dùng mở Modal Xuất Báo Cáo Sự Kiện trên Web CRM.
  2. Chọn danh mục cần xuất báo cáo:
     * Danh sách toàn bộ đại biểu đăng ký.
     * Danh sách đại biểu **ĐÃ CHECK-IN** (Có mặt thực tế).
     * Danh sách đại biểu **ĐI MUỘN** (Điểm danh sau giờ khai mạc).
     * Danh sách đại biểu **VẮNG MẶT** (Đăng ký nhưng không đến).
     * Danh sách đại biểu **ĐÃ NỘP PHÍ / CHƯA NỘP PHÍ / TỔNG PHÍ THU ĐƯỢC**.
  3. Tùy chọn xuất ra **3 định dạng chuẩn mực**:
     * **File Excel (.xlsx)**: Đầy đủ các cột dữ liệu, định dạng số tiền, ngày giờ chuẩn tiếng Việt, có nhận diện màu sắc thương hiệu.
     * **File CSV (.csv)**: Mã hóa UTF-8 with BOM chuẩn quốc tế, không bao giờ bị lỗi font tiếng Việt khi mở trên Excel mọi hệ điều hành.
     * **Bản in A4 / PDF (.pdf)**: Trình bày trang trọng, có tiêu đề CLB Doanh Nhân CEO HN10, bảng kẻ chỉn chu, có phần ký tên của Người lập biểu, Lớp phó (Phụ trách tài chính) và Lớp trưởng / Trưởng Ban Sự Kiện.
  4. **Chức năng Gửi Báo Cáo Đa Kênh**: Cho phép chọn nhiều tài khoản người nhận (Lớp trưởng, Lớp phó, Trưởng các ban chuyên trách hoặc email tùy chỉnh) để gửi tóm tắt số liệu và file báo cáo qua Email và Zalo OA.

---

## 6. PHẦN 4: CÁC USE CASE VỀ PHÍ SỰ KIỆN & QUẢN TRỊ DÒNG TIỀN QUỸ TỔNG

### Use Case UC-FIN-01: Dòng Tiền Phí Vé Chảy Thẳng Vào Quỹ Tổng Lớp
* **Tác nhân**: Hệ thống tự động, SePay Webhook, Lớp phó phụ trách tài chính.
* **Quy chuẩn bất di bất dịch**:
  * Ban Sự Kiện Hậu Cần **KHÔNG GIỮ QUỸ RIÊNG**.
  * Toàn bộ tiền bán vé sự kiện từ SePay chảy thẳng vào **Tài khoản Quỹ Tổng lớp học** (`113.20.107.184:6432`).
  * Số dư Quỹ Tổng trên Dashboard CRM nhảy tăng tức thời (Realtime balance update) ngay khi giao dịch thanh toán thành công.

### Use Case UC-FIN-02: Giám Sát Biến Động Số Dư Quỹ Tổng Thời Gian Thực
* **Tác nhân**: Lớp trưởng, Lớp phó phụ trách tài chính.
* **Luồng nghiệp vụ**:
  * Ban Cán sự lớp theo dõi biểu đồ doanh thu vé theo từng mốc thời gian trên Executive Dashboard.
  * Phân tích tỷ lệ lấp đầy vé VIP vs vé Tiêu chuẩn để có chiến lược truyền thông đôn đốc.

### Use Case UC-FIN-03: Đối Soát Danh Sách Người Đã Nộp Phí
* **Tác nhân**: Lớp phó phụ trách tài chính, Trưởng team, Phó team.
* **Luồng nghiệp vụ**:
  * Lớp phó lọc danh sách "Chưa nộp phí", xuất báo cáo phân nhóm theo Team.
  * Gửi danh sách cho Trưởng team và Phó team để đôn đốc thành viên hoàn thành nghĩa vụ trước ngày diễn ra sự kiện.

### Use Case UC-FIN-04: Cấp Phát Kinh Phí Cho Ban Sự Kiện Hậu Cần
* **Tác nhân**: Trưởng Ban Sự Kiện Hậu Cần, Lớp trưởng, Lớp phó phụ trách tài chính.
* **Luồng nghiệp vụ**:
  * Trưởng Ban Sự Kiện Hậu Cần tạo Đề xuất xin cấp kinh phí tổ chức (thuê âm thanh ánh sáng, tiệc teabreak/gala...).
  * Lớp trưởng phê duyệt đề xuất.
  * Lớp phó thực hiện chuyển khoản từ Quỹ Tổng và đính kèm ủy nhiệm chi vào hệ thống.

### Use Case UC-FIN-05: Xử Lý Hủy Vé & Hoàn Tiền (Refund Policy)
* **Tác nhân**: Học viên, Trưởng Ban Sự Kiện Hậu Cần, Lớp phó phụ trách tài chính.
* **Luồng nghiệp vụ**:
  * Học viên gửi yêu cầu hủy vé trước giờ G (tối thiểu 48 tiếng).
  * Ban Sự Kiện kiểm tra lý do và xác nhận.
  * Lớp phó thực hiện hoàn tiền theo quy định và cập nhật trạng thái vé thành "Đã hoàn tiền (Refunded)".

---

## 7. MA TRẬN PHÂN QUYỀN RACI (RESPONSIBILITY ASSIGNMENT MATRIX)

> **Ký hiệu**:
> * **R (Responsible)**: Người trực tiếp thực hiện nhiệm vụ.
> * **A (Accountable)**: Người chịu trách nhiệm cao nhất và phê duyệt.
> * **C (Consulted)**: Người được tham vấn ý kiến chuyên môn.
> * **I (Informed)**: Người nhận thông báo kết quả.

| Mã Use Case | Tên Use Case | Lớp trưởng | Lớp phó | Trưởng Ban SK | Trưởng Ban TT | Trưởng Ban CN | Trưởng/Phó Team | Học viên/Khách |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **UC-EVT-01** | Khởi tạo sự kiện & hạng vé | **A** | **C** | **R** | **C** | **I** | **I** | **I** |
| **UC-EVT-02** | Đăng ký & Mua vé trực tuyến | **I** | **I** | **I** | **I** | **I** | **C** | **R** |
| **UC-EVT-03** | Import đại biểu từ Excel | **I** | **C** | **R** | **R** | **I** | **I** | **I** |
| **UC-EVT-04** | Phát hành vé điện tử & QR | **I** | **I** | **A** | **R** | **C** | **I** | **I** |
| **UC-EVT-05** | Check-in điểm danh QR | **I** | **I** | **R** | **R** | **C** | **I** | **I** |
| **UC-EVT-05-1**| Khách tự check-in QR | **I** | **I** | **A** | **I** | **I** | **I** | **R** |
| **UC-EVT-05-2**| Xếp chỗ đại biểu | **A** | **I** | **R** | **R** | **I** | **C** | **I** |
| **UC-EVT-06** | Khách vãng lai & thu tiền mặt| **I** | **A** | **R** | **I** | **I** | **I** | **R** |
| **UC-EVT-07** | Biểu quyết & Vòng quay may mắn| **A** | **I** | **C** | **C** | **R** | **I** | **R** |
| **UC-EVT-08** | Thư viện ảnh Live Gallery | **I** | **I** | **C** | **R** | **C** | **I** | **I** |
| **UC-EVT-09** | Khảo sát đánh giá sau sự kiện | **I** | **I** | **I** | **I** | **I** | **C** | **R** |
| **UC-EVT-10** | Xuất báo cáo đa danh mục | **A** | **A** | **R** | **R** | **I** | **I** | **I** |
| **UC-FIN-01** | Thu tiền vé vào Quỹ Tổng | **A** | **R** | **I** | **I** | **I** | **I** | **I** |
| **UC-FIN-04** | Cấp kinh phí cho Ban Sự Kiện | **A** | **R** | **R** | **I** | **I** | **I** | **I** |
| **UC-FIN-05** | Hủy vé & Hoàn tiền | **A** | **R** | **C** | **I** | **I** | **I** | **I** |

---

## 8. TỔNG KẾT & QUY TRÌNH ÁP DỤNG MÃ NGUỒN

1. **Backend NestJS**:
   * API Đăng ký khách công khai: `POST /events/:id/guest-register` (hỗ trợ multi-attendee, VietQR SePay `CEO1983_EVT_[ID]`).
   * API Soát vé & Tự check-in: `POST /events/ticket-checkin` & `POST /events/:id/guest-self-checkin` (phân loại Đúng giờ/Đi muộn, gửi mail check-in kèm chỗ ngồi).
   * API Gửi link Live Gallery: `POST /events/:id/share-gallery`.
   * API Gửi báo cáo sự kiện: `POST /events/:id/send-report`.
   * Webhook SePay: `POST /api/webhooks/sepay` (khớp vé sự kiện, cập nhật Quỹ Tổng realtime và bắn email vé).
2. **Frontend React / TanStack Router**:
   * Cổng đăng ký công khai: `/guest-event-register/$eventId` (Standalone, không cần đăng nhập).
   * Cổng check-in công khai: `/event-checkin` (Hỗ trợ Online & Offline, hiển thị vị trí chỗ ngồi và tag Đúng giờ/Đi muộn).
   * Modal Vòng quay may mắn: `EventWheelOfFortuneModal.tsx` (Lọc tự động theo Chức danh của người đã check-in).
   * Modal Tư liệu ảnh: `EventLivePhotoGalleryModal.tsx` (Nút gửi link kho ảnh về Email/Zalo).
   * Modal Xuất báo cáo: `EventRegistrationsExportModal.tsx` (3 định dạng Excel, CSV, PDF và tính năng Gửi báo cáo tới Ban Cán sự).
