# BỘ KỊCH BẢN KIỂM THỬ TOÀN DIỆN VÒNG ĐỜI SỰ KIỆN & QUẢN TRỊ DÒNG TIỀN
## HỆ THỐNG ĐIỀU HÀNH & KẾT NỐI LỚP HỌC DOANH NHÂN CEO HN10 (HANOIBA)
*Mã tài liệu: `TEST-EVT-CEOHN10-V1.0`*  
*Căn cứ đặc tả: IEEE 830-1998 / SRS USE CASES LUỒNG SỰ KIỆN VÀ PHÍ V3.0*  
*Ngày ban hành: 24/11/2026*  

---

## 1. THÔNG TIN CHUNG & MÔI TRƯỜNG KIỂM THỬ

### 1.1. Mục Tiêu Kiểm Thử
Kiểm thử toàn phần (End-to-End E2E) từ lúc lập kế hoạch, khởi tạo sự kiện trên Web CRM Quản trị, phát hành vé, đăng ký đa kênh (App Hội viên và Web công khai), thanh toán VietQR SePay, điểm danh check-in QR (Online & Offline), tổ chức tương tác (Vòng quay may mắn, Ảnh Live), đến xuất báo cáo đa định dạng (Excel, CSV, PDF A4) và đối soát tài chính vào Quỹ Tổng CLB.

### 1.2. Môi Trường & Địa Chỉ Truy Cập

| Thành Phần | URL Kiểm Thử Cục Bộ (Localhost) | URL Máy Chủ Thử Nghiệm (Staging) |
| :--- | :--- | :--- |
| **Cổng Web CRM Quản Trị** | `http://localhost:4002/admin` hoặc `/events` | `https://crm.ceohn10.vn/events` |
| **Ứng Dụng Di Động Hội Viên** | `http://localhost:4002/association/events` | `https://app.ceohn10.vn/association/events` |
| **Form Đăng Ký Công Khai** | `http://localhost:4002/guest-event-register/:id` | `https://app.ceohn10.vn/guest-event-register/:id` |
| **Kiosk Check-in Công Khai** | `http://localhost:4002/event-checkin` | `https://app.ceohn10.vn/event-checkin` |
| **Form Đánh Giá Khảo Sát** | `http://localhost:4002/guest-event-feedback/:id` | `https://app.ceohn10.vn/guest-event-feedback/:id` |
| **Backend REST API** | `http://127.0.0.1:4003/api` | `https://api.ceohn10.vn/api` |
| **Cơ Sở Dữ Liệu PostgreSQL** | `127.0.0.1:5432/ceohn10_project` | `113.20.107.184:6432/ceohn10_project` |

### 1.3. Danh Mục 9 Nhóm Tác Nhân & Tài Khoản Kiểm Thử

| Mã Tác Nhân | Vai Trò | Trách Nhiệm Kiểm Thử | Tài Khoản Đăng Nhập Test |
| :--- | :--- | :--- | :--- |
| **ACT-01** | Platform Admin | Cấu hình tham số hệ thống, giám sát CSDL | `admin@ceohn10.vn` / `Admin@123456` |
| **ACT-02** | Admin Vận Hành | Giám sát cổng thanh toán SePay, duyệt vé | `vanhanh@ceohn10.vn` / `Admin@123456` |
| **ACT-03** | Lớp trưởng | Phê duyệt kế hoạch sự kiện, cấp hạn mức chi Quỹ | `loptruong@ceohn10.vn` / `CeoHN10@2026` |
| **ACT-04** | Lớp phó (Tài chính) | Quản lý Quỹ Tổng, đối soát sao kê tiền vé | `loppho.taichinh@ceohn10.vn` / `CeoHN10@2026` |
| **ACT-05** | Trưởng team | Đôn đốc học viên trong team đăng ký tham gia | `truongteam1@ceohn10.vn` / `CeoHN10@2026` |
| **ACT-06** | Phó team | Theo dõi điểm danh danh sách học viên team | `photeam1@ceohn10.vn` / `CeoHN10@2026` |
| **ACT-07** | Ban Sự Kiện / TT | Tạo sự kiện, import Excel, xếp chỗ, quét QR | `bansukien@ceohn10.vn` / `CeoHN10@2026` |
| **ACT-08** | Giảng viên | Xem tài liệu giảng dạy, theo dõi sĩ số | `giangvien@ceohn10.vn` / `CeoHN10@2026` |
| **ACT-09** | Học viên / Khách | Mua vé, thanh toán VietQR, check-in, quay thưởng | `hocvien.test@ceohn10.vn` hoặc Khách vãng lai |

---

## 2. GIAI ĐOẠN 1: TRƯỚC SỰ KIỆN (PRE-EVENT)

### TC-EVT-01: Khởi Tạo Sự Kiện Mới & Thiết Lập Đa Hạng Vé
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-01`.
* **Người thực hiện**: Trưởng Ban Sự Kiện Hậu Cần / Ban Truyền Thông / Admin.
* **Màn hình**: Web CRM -> Menu Sự Kiện (`/events` hoặc `/admin`).
* **Các bước thực hiện**:
  1. Đăng nhập tài khoản Ban Sự Kiện (`bansukien@ceohn10.vn`).
  2. Bấm nút **"+ Tạo Sự Kiện Mới"** để mở `EventWizard`.
  3. Nhập thông tin sự kiện:
     * **Tên sự kiện**: `Gala Doanh Nhân CEO HN10 - Kết Nối Thịnh Vượng 2026`
     * **Thời gian bắt đầu**: `08:00 - 15/12/2026` | **Thời gian kết thúc**: `17:30 - 15/12/2026`
     * **Địa điểm**: `Khách sạn Melia Hà Nội, 44 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội`
     * **Ban phụ trách**: `Ban Sự Kiện Hậu Cần` phối hợp `Ban Truyền Thông`
  4. Khai báo 3 hạng vé độc lập:
     * **Hạng vé 1 (VIP)**: Tên `Vé VIP Doanh Nhân` | Đơn giá: `1.000.000 đ` | Số lượng: `50 vé` | Quyền lợi: Bàn VIP cận sân khấu, Kỷ yếu mạ vàng.
     * **Hạng vé 2 (Tiêu chuẩn)**: Tên `Vé Tiêu Chuẩn` | Đơn giá: `500.000 đ` | Số lượng: `150 vé` | Quyền lợi: Tham dự đầy đủ tiệc trà và gala.
     * **Hạng vé 3 (Khách mời 0đ)**: Tên `Vé Khách Mời Danh Dự` | Đơn giá: `0 đ` | Số lượng: `30 vé` | Quyền lợi: Bàn đại biểu danh dự.
  5. Cấu hình phân ban tài chính: Chọn **Quỹ Tổng CLB** làm nơi tiếp nhận tiền bán vé.
  6. Thử nghiệm tính năng **Smart Document Importer**: Tải thử một file Word/PDF kế hoạch tổ chức sự kiện lên -> Kiểm tra hệ thống tự động bóc tách tên, ngày giờ và địa điểm.
  7. Bấm **"Xuất Bản Sự Kiện"**.
* **Kết quả mong đợi (Expected Results)**:
  * Sự kiện lưu thành công vào CSDL PostgreSQL bảng `vba_events`.
  * Sự kiện hiển thị ngay trên danh mục sự kiện Web CRM (`/events`) với trạng thái `Đang mở đăng ký`.
  * Sự kiện xuất hiện tức thì trên Slider Trang chủ và danh sách Sự kiện của Mobile App (`/association/events`).

---

### TC-EVT-02: Học Viên Đăng Ký Vé Đơn Trên Mobile App
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-02`.
* **Người thực hiện**: Học viên Doanh nhân (ACT-09).
* **Màn hình**: Mobile App Hội viên -> Tab Sự Kiện (`/association/events`).
* **Các bước thực hiện**:
  1. Mở ứng dụng Mobile App, chuyển sang tab **"Sự Kiện & Lớp Học"**.
  2. Bấm vào thẻ sự kiện `Gala Doanh Nhân CEO HN10 - Kết Nối Thịnh Vượng 2026`.
  3. Xem chi tiết sự kiện: Thông tin diễn giả, địa điểm, các hạng vé.
  4. Chọn hạng vé: Bấm chọn **"Vé Tiêu Chuẩn - 500.000 đ"**.
  5. Bấm **"Đăng ký ngay"**.
  6. Kiểm tra thông tin điền sẵn: Hệ thống tự động tra cứu mã học viên, điền sẵn Họ tên, Công ty, Số điện thoại.
  7. Xác nhận đăng ký.
* **Kết quả mong đợi**:
  * Tạo bản ghi đăng ký trong CSDL với trạng thái `pending_payment` (hoặc `confirmed` nếu vé 0đ).
  * Chuyển mượt mà sang màn hình Thanh toán VietQR SePay.

---

### TC-EVT-03: Đăng Ký Đa Vé (Multi-ticket) Trên Form Web Công Khai
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-02` (Ràng buộc Standalone Public Route).
* **Người thực hiện**: Khách mời ngoài CLB hoặc Doanh nghiệp mua vé cho nhiều người.
* **Màn hình**: Đường dẫn công khai `/guest-event-register/:eventId`.
* **Các bước thực hiện**:
  1. Dùng trình duyệt ẩn danh (Incognito) hoặc quét mã QR sự kiện để mở link công khai (Không cần đăng nhập).
  2. Xác nhận hệ thống KHÔNG chuyển hướng (redirect) vào trang login CRM.
  3. Tại trường số lượng vé: Chọn **2 vé VIP** và **1 vé Tiêu Chuẩn** (Tổng 3 vé).
  4. Kiểm tra giao diện form:
     * Hệ thống tự động mở rộng 3 cụm thông tin riêng biệt: Đại biểu 1 (Trưởng đoàn), Đại biểu 2, Đại biểu 3.
     * Điền đầy đủ Họ tên, Email, Số điện thoại cho từng đại biểu.
  5. Kiểm tra tự động tính tiền:
     $$\text{Tổng tiền} = 2 \times 1.000.000 + 1 \times 500.000 = 2.500.000\text{ đ}$$
  6. Bấm **"Xác Nhận Đăng Ký & Thanh Toán"**.
* **Kết quả mong đợi**:
  * Form hiển thị thông báo hợp lệ, lưu 3 bản ghi vé vào cơ sở dữ liệu.
  * Hiển thị bảng mã VietQR thanh toán SePay với đúng tổng tiền `2.500.000 đ`.

---

### TC-EVT-04: Thanh Toán VietQR Tích Hợp SePay & Phát Hành Vé Điện Tử
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-02` & `UC-EVT-04`.
* **Người thực hiện**: Người đăng ký mua vé (ACT-09) & Cổng tự động SePay.
* **Màn hình**: Popup Thanh Toán VietQR SePay.
* **Các bước thực hiện**:
  1. Kiểm tra hình ảnh VietQR:
     * Ngân hàng thụ hưởng: Vietcombank / MBBank của Quỹ Tổng CLB CEO HN10.
     * Số tiền: Đúng khớp 100% số tiền vé cần thanh toán.
     * Nội dung chuyển khoản động: Đúng cú pháp chuẩn `CEO1983_EVT_[ID]`.
  2. Bấm nút **"Mở Ứng Dụng Ngân Hàng" (Deep Link)** trên điện thoại -> Kiểm tra tự động chuyển thông tin sang app ngân hàng.
  3. Giả lập thanh toán SePay (Bằng kịch bản cURL Webhook hoặc Lễ tân xác nhận "Đã nhận tiền"):
     ```bash
     curl -X POST http://127.0.0.1:4003/api/events/sepay-webhook \
       -H "Content-Type: application/json" \
       -d '{"gateway":"Vietcombank","transactionDate":"2026-12-15 08:30:00","accountNumber":"0011001234567","code":null,"content":"CEO1983_EVT_1001","transferType":"in","transferAmount":500000,"id":99991}'
     ```
  4. Quan sát phản hồi trên màn hình khách hàng:
     * Màn hình chuyển sang trạng thái: **"Thanh toán thành công! Chào mừng Quý Doanh nhân"**.
  5. Mở mục **"Vé Sự Kiện Của Tôi"** trên Mobile App hoặc kiểm tra Email nhận vé:
     * Vé điện tử hiển thị mã QR định danh bảo mật HMAC-SHA256.
     * Hiển thị họ tên, hạng vé, thời gian và vị trí chỗ ngồi dự kiến.
* **Kết quả mong đợi**:
  * Trạng thái đăng ký chuyển sang `paid` / `confirmed`.
  * Vé điện tử được cấp phát tức thì, mỗi đại biểu có 1 mã QR check-in độc nhất vô nhị.

---

### TC-EVT-05: Import Danh Sách Đại Biểu Từ Excel (Kiểm Tra Vé & Giá Nghiêm Ngặt)
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-03` (Strict Ticket Validation Rule).
* **Người thực hiện**: Trưởng Ban Sự Kiện / Trưởng Ban Truyền Thông.
* **Màn hình**: Web CRM -> Chi tiết sự kiện -> Tab "Đại biểu" -> Bấm **"Import Excel"**.
* **Thực hiện 3 ca kiểm thử đối soát nghiêm ngặt**:
  * **Ca 5A (Lệch tên Loại vé)**:
    * File Excel có cột `Loại vé` ghi: `Vé Khách VIP` (trong khi cấu hình sự kiện chỉ có `Vé VIP Doanh Nhân`).
    * **Kết quả mong đợi**: Hệ thống từ chối nạp dòng này, hiển thị cảnh báo đỏ: *"Lỗi dòng 3: Loại vé 'Vé Khách VIP' không tồn tại trong sự kiện!"*.
  * **Ca 5B (Lệch Đơn giá vé)**:
    * File Excel có `Loại vé` là `Vé VIP Doanh Nhân` nhưng cột `Giá vé` ghi: `800.000 đ` (trong khi sự kiện khai báo `1.000.000 đ`).
    * **Kết quả mong đợi**: Hệ thống chặn nạp, báo đỏ: *"Lỗi dòng 5: Đơn giá 800.000 đ không khớp với đơn giá khai báo 1.000.000 đ của Vé VIP Doanh Nhân!"*.
  * **Ca 5C (File chuẩn 100%)**:
    * File Excel chuẩn tên vé `Vé VIP Doanh Nhân`, giá `1.000.000 đ`, có thêm cột mở rộng `Tên trợ lý`, `Nhu cầu ăn chay`.
    * **Kết quả mong đợi**: Import thành công 100%, hệ thống tự động sinh cột động (Dynamic DDL) và phát hành mã vé cho toàn bộ danh sách.

---

## 3. GIAI ĐOẠN 2: TRONG SỰ KIỆN (IN-EVENT)

### TC-EVT-06: Check-in Quét Mã QR Qua Camera Mobile App (Online)
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-05`.
* **Người thực hiện**: Lễ tân Ban Sự Kiện (ACT-07).
* **Màn hình**: Mobile App -> Nút tròn **Quét QR** ở giữa Bottom Navigation (hoặc trong chi tiết sự kiện).
* **Các bước thực hiện**:
  1. Lễ tân dùng điện thoại mở Camera quét QR của ứng dụng CEO HN10.
  2. Hướng camera vào mã QR vé điện tử trên điện thoại của đại biểu Nguyễn Văn A (Hạng vé VIP).
  3. Quan sát giao diện xử lý:
     * Âm thanh / Rung haptic phản hồi thành công.
     * Màn hình sáng đèn xanh: **"Check-in thành công - Chào mừng Doanh nhân Nguyễn Văn A - Vé VIP Doanh Nhân"**.
     * Hiển thị vị trí chỗ ngồi: **"Bàn VIP 01 - Ghế số 05"**.
  4. Kiểm tra CSDL: Thời gian check-in thực tế được ghi nhận chính xác đến từng giây.
* **Kết quả mong đợi**:
  * Điểm danh thành công trong thời gian < 1 giây.
  * Tự động gắn tag **"Đúng giờ"** (nếu đến trước hoặc trong vòng 15 phút đầu sau giờ khai mạc).

---

### TC-EVT-07: Khách Tự Check-in Tại Kiosk Công Khai (`/event-checkin`)
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-05-1`.
* **Người thực hiện**: Đại biểu tham dự tự phục vụ.
* **Màn hình**: Máy tính bảng đặt tại bàn đón tiếp hoặc trình duyệt điện thoại cá nhân (`/event-checkin`).
* **Các bước thực hiện**:
  1. Đại biểu quét mã QR bàn đón tiếp để mở trang `/event-checkin` (Public Standalone, không redirect login).
  2. Chọn hình thức check-in:
     * **Cách 1**: Nhập mã vé (ví dụ: `EVT-20261215-0012`).
     * **Cách 2**: Tải ảnh chụp vé điện tử chứa mã QR lên màn hình.
  3. Bấm **"Xác Nhận Điểm Danh"**.
* **Kết quả mong đợi**:
  * Hệ thống đối soát mã vé hợp lệ trong CSDL.
  * Màn hình hiển thị: *"Chào mừng Quý Doanh nhân [Tên]! Điểm danh thành công. Vị trí của Quý vị: Bàn 03 - Ghế 12"*.
  * Tự động gửi Email / Zalo OA thông báo check-in thành công kèm sơ đồ hội trường.

---

### TC-EVT-08: Kiểm Tra Chặn Quét Trùng Lặp (Anti-Fraud Duplicate Scan)
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-05` (Bảo mật vé chống gian lận).
* **Người thực hiện**: Lễ tân Ban Sự Kiện.
* **Các bước thực hiện**:
  1. Lấy mã QR của đại biểu Nguyễn Văn A vừa check-in ở TC-EVT-06.
  2. Thực hiện quét lại lần thứ 2 bằng điện thoại lễ tân khác hoặc cùng máy.
* **Kết quả mong đợi**:
  * Hệ thống **TỪ CHỐI CHECK-IN**.
  * Màn hình cảnh báo màu đỏ chớp nháy:
    $$\text{"CẢNH BÁO: Vé này ĐÃ CHECK-IN lúc 08:14:22 bởi Lễ tân Trần Thị B!"}$$
  * Không làm thay đổi dữ liệu thời gian điểm danh lần đầu.

---

### TC-EVT-09: Kiểm Tra Chế Độ Offline Check-in Khi Mất Mạng
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-05` (Chế độ ngoại tuyến tại sảnh khách sạn).
* **Người thực hiện**: Lễ tân Ban Sự Kiện.
* **Các bước thực hiện**:
  1. Khi có mạng: Lễ tân mở màn hình Check-in sự kiện trên Mobile App -> Hệ thống tự động đồng bộ danh sách đại biểu vào bộ nhớ đệm an toàn (`IndexedDB` / `localStorage`).
  2. Giả lập mất mạng: Bật **Chế độ máy bay (Airplane Mode)** hoặc tắt Wi-Fi / 4G trên thiết bị lễ tân.
  3. Đưa mã QR của đại biểu Lê Văn C (chưa check-in) vào quét.
  4. Quan sát phản hồi:
     * App vẫn nhận diện mã vé và báo xanh: **"Check-in Ngoại Tuyến (Offline) thành công"**.
     * Bản ghi được lưu tạm vào hàng đợi Offline Queue trên máy.
  5. Bật lại Wi-Fi / 4G:
     * Ứng dụng phát hiện có mạng trở lại -> Tự động kích hoạt **Auto-sync** đẩy toàn bộ hàng đợi điểm danh lên máy chủ.
* **Kết quả mong đợi**:
  * Không gián đoạn khâu tiếp đón tại cửa dù sảnh khách sạn bị mất sóng internet.
  * Sau khi có mạng, dữ liệu trên máy chủ đồng bộ đầy đủ 100%, không bị mất bất kỳ bản ghi nào.

---

### TC-EVT-10: Tiếp Đón Khách Vãng Lai & Thu Phí Tại Bàn (Walk-in Desk)
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-06`.
* **Người thực hiện**: Khách chưa đăng ký trước & Lễ tân đón tiếp.
* **Màn hình**: Kiosk Check-in `/event-checkin` hoặc CRM Check-in Panel.
* **Các bước thực hiện**:
  1. Khách đến bàn lễ tân, chọn mục **"Đăng ký khách mới tại chỗ"**.
  2. Điền nhanh: Họ tên, Số điện thoại, Doanh nghiệp.
  3. Chọn loại vé: `Vé Tiêu Chuẩn - 500.000 đ`.
  4. Thanh toán:
     * **Phương án A (Chuyển khoản)**: Quét VietQR động hiển thị trên màn hình.
     * **Phương án B (Tiền mặt)**: Đưa tiền mặt cho Lễ tân, Lễ tân bấm nút **"Xác nhận đã thu tiền mặt"**.
* **Kết quả mong đợi**:
  * Hệ thống tự động xuất mã vé mới, chuyển ngay sang trạng thái `Đã check-in`.
  * Phân loại khách vào nhóm `Khách vãng lai đăng ký tại sự kiện`.

---

### TC-EVT-11: Vòng Quay May Mắn (Lucky Draw) Có Bộ Lọc Chức Danh
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-07`.
* **Người thực hiện**: Trưởng Ban Công Nghệ / MC Sự Kiện / Admin.
* **Màn hình**: Web CRM -> Chi tiết sự kiện -> Tab Tương Tác -> Bấm **"Vòng Quay May Mắn"**.
* **Các bước thực hiện**:
  1. Mở giao diện Vòng Quay May Mắn (`EventLuckyDrawModal`).
  2. Kiểm tra danh sách tham gia vòng quay:
     * Xác nhận danh sách **CHỈ CHỨA** những người **ĐÃ THỰC TẾ CHECK-IN** (những người vắng mặt hoặc chưa đến bị loại bỏ 100%).
  3. Kiểm tra tính năng **Lọc theo Chức danh**:
     * Chọn bộ lọc chức danh: `Chủ tịch` / `CEO` / `Tổng Giám Đốc`.
     * Xác nhận danh sách vòng quay tự động co lại đúng nhóm chức danh đã chọn.
     * Chọn lại `Tất cả đại biểu` để quay giải đại trà.
  4. Bấm nút **"QUAY SỐ"**:
     * Vòng quay xoay tròn với hiệu ứng âm thanh và đồ họa visual hoành tráng trên màn hình LED.
     * Dừng lại tại đại biểu may mắn trúng thưởng (ví dụ: Doanh nhân Trần Văn D).
     * Màn hình nổ pháo hoa chúc mừng, hiện thông tin giải thưởng.
* **Kết quả mong đợi**:
  * Chỉ đại biểu có mặt mới trúng giải, tính minh bạch tuyệt đối.
  * Tự động lưu tên người trúng giải vào lịch sử giải thưởng sự kiện.

---

### TC-EVT-12: Thư Viện Ảnh Live (Live Photo Gallery) & Chia Sẻ Đa Kênh
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-08`.
* **Người thực hiện**: Trưởng Ban Truyền Thông (ACT-07) & Toàn thể đại biểu.
* **Màn hình**: Web CRM Media Panel & Mobile App Thư Viện Ảnh.
* **Các bước thực hiện**:
  1. Ban Truyền Thông upload 10 tấm ảnh chất lượng cao chụp tại sự kiện lên hệ thống qua Web CRM.
  2. Bấm nút **"Chia Sẻ Link Kho Ảnh"**:
     * Hệ thống gửi tin nhắn thông báo kèm link kho ảnh qua Zalo OA và Email cho toàn bộ đại biểu đã đăng ký tham dự.
  3. Học viên mở mục **"Ảnh Sự Kiện"** trên Mobile App:
     * Ảnh mới chụp xuất hiện theo thời gian thực (Realtime).
     * Học viên bấm xem ảnh to và tải về máy tốc độ cao.
* **Kết quả mong đợi**:
  * Tốc độ tải ảnh mượt mà, lưu trữ CDN an toàn.
  * Đại biểu dễ dàng lấy ảnh để check-in truyền thông trên mạng xã hội.

---

## 4. GIAI ĐOẠN 3: SAU SỰ KIỆN (POST-EVENT)

### TC-EVT-13: Khảo Sát Đánh Giá Chất Lượng & Phản Ánh Góp Ý
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-09`.
* **Người thực hiện**: Học viên & Khách đã tham dự.
* **Màn hình**: Trang đánh giá công khai `/guest-event-feedback/:id`.
* **Các bước thực hiện**:
  1. Hệ thống tự động gửi thông báo cảm ơn và link đánh giá sự kiện sau khi sự kiện kết thúc.
  2. Đại biểu bấm vào link mở form khảo sát:
     * Chấm điểm độ hài lòng chung (1 đến 5 sao / Chỉ số NPS).
     * Đánh giá chất lượng diễn giả & nội dung bài giảng.
     * Đánh giá khâu tổ chức hậu cần & tiệc tối.
     * Nhập góp ý bổ sung: *"Sự kiện rất ý nghĩa, mong ban tổ chức có thêm thời gian giao lưu 1-1"*.
  3. Bấm **"Gửi Đánh Giá"**.
  4. Kiểm tra trên Web CRM: Điểm đánh giá trung bình và phản ánh hiển thị ngay trên Dashboard sự kiện.
  5. Thử nghiệm mở form khảo sát sau 24 giờ kể từ lúc sự kiện kết thúc -> Kiểm tra cổng tự động đóng và báo *"Thời hạn khảo sát cho sự kiện này đã kết thúc"*.
* **Kết quả mong đợi**:
  * Thu thập ý kiến chính xác, tự động tổng hợp báo cáo hài lòng.
  * Cổng đóng tự động đúng thời gian quy định.

---

### TC-EVT-14: Xuất Báo Cáo Sự Kiện Đa Danh Mục (3 Định Dạng Chuẩn Mực)
* **Căn cứ nghiệp vụ**: Use Case `UC-EVT-10`.
* **Người thực hiện**: Trưởng Ban Sự Kiện / Lớp phó / Lớp trưởng / Admin.
* **Màn hình**: Web CRM -> Chi tiết sự kiện -> Bấm **"Xuất Báo Cáo Sự Kiện"** (`EventReportExportModal`).
* **Các bước kiểm thử chi tiết**:
  1. Mở modal xuất báo cáo, kiểm tra 5 danh mục lọc số liệu:
     * Danh mục 1: **Toàn bộ đại biểu đăng ký** (Kèm trạng thái thanh toán và mã vé).
     * Danh mục 2: **Đại biểu ĐÃ CHECK-IN** (Thời gian check-in thực tế, người quét vé).
     * Danh mục 3: **Đại biểu ĐI MUỘN** (Đến sau giờ khai mạc > 15 phút).
     * Danh mục 4: **Đại biểu VẮNG MẶT** (Đăng ký nhưng không check-in).
     * Danh mục 5: **Báo cáo Tài chính Phí Sự Kiện** (Tổng thu, vé đã thanh toán, vé chưa nộp tiền).
  2. Kiểm tra xuất **3 định dạng file bắt buộc**:
     * **Định dạng 1 - File Excel (.xlsx)**: Bấm "Tải Excel" -> Mở file kiểm tra: Đầy đủ màu sắc thương hiệu đỏ - xanh CEO HN10, định dạng số tiền VND chuẩn, ngày giờ hiển thị dạng `DD/MM/YYYY HH:mm`.
     * **Định dạng 2 - File CSV (.csv)**: Bấm "Tải CSV" -> Mở kiểm tra trên Excel: Mã hóa chuẩn **UTF-8 with BOM**, tuyệt đối **KHÔNG BỊ LỖI FONT** tiếng Việt.
     * **Định dạng 3 - Bản in A4 / PDF (.pdf)**: Bấm "In báo cáo PDF" -> Mở bản in kiểm tra: Trình bày chuẩn thể thức văn bản Hội Doanh Nhân Trẻ Hà Nội HanoiBA, có đầy đủ 3 ô chữ ký trang trọng: **Người lập biểu**, **Lớp phó phụ trách tài chính** và **Lớp trưởng / Trưởng Ban Sự Kiện**.
  3. Thử nghiệm tính năng **"Gửi Báo Cáo Đa Kênh"**: Chọn tài khoản Lớp trưởng và Lớp phó -> Bấm gửi -> Kiểm tra nhận file báo cáo qua Email đính kèm.
* **Kết quả mong đợi**:
  * Cả 3 định dạng xuất ra hoàn hảo 100%, số liệu khớp tuyệt đối với CSDL.
  * Email gửi đính kèm file báo cáo thành công.

---

### TC-EVT-15: Đối Soát Dòng Tiền Vé & Chuyển Quỹ Tổng CLB
* **Căn cứ nghiệp vụ**: Use Case `UC-FIN-01` đến `UC-FIN-03`.
* **Người thực hiện**: Lớp phó phụ trách tài chính (ACT-04) & Lớp trưởng (ACT-03).
* **Màn hình**: Web CRM -> Quản trị Tài Chính & Quỹ Tổng (`/finance`).
* **Các bước thực hiện**:
  1. Lớp phó mở màn hình Tài Chính Quỹ Tổng CLB.
  2. Kiểm tra dòng tiền vào:
     * Toàn bộ doanh thu bán vé sự kiện từ SePay được ghi nhận tăng số dư Quỹ Tổng CLB (`vba_finance_funds`).
     * Mỗi giao dịch có mã tham chiếu sự kiện rõ ràng.
  3. Kiểm tra đề xuất chi tổ chức sự kiện:
     * Ban Sự Kiện lập đề xuất thanh toán tiền thuê địa điểm khách sạn Melia.
     * Lớp trưởng (ACT-03) duyệt hạn mức trên Web CRM.
     * Lớp phó (ACT-04) xác nhận giải ngân -> Số dư Quỹ Tổng được trừ đúng số tiền thực chi.
* **Kết quả mong đợi**:
  * Dòng tiền sự kiện minh bạch, đối soát chính xác từng đồng, không xảy ra thất thoát hay sai lệch sổ sách.

---

## 5. BẢNG MA TRẬN ĐÁNH GIÁ KẾT QUẢ KIỂM THỬ (TEST CHECKLIST)

| STT | Mã Test Case | Tên Kịch Bản Kiểm Thử | Tiêu Chuẩn Nghiệm Thu | Kết Quả (Pass / Fail) | Ghi Chú |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | **TC-EVT-01** | Tạo sự kiện & Đa hạng vé trên CRM | Lưu CSDL, hiện trên App & Web CRM | [ ] | |
| 2 | **TC-EVT-02** | Đăng ký vé đơn trên Mobile App | Tự điền thông tin, ra mã thanh toán | [ ] | |
| 3 | **TC-EVT-03** | Đăng ký nhiều vé trên Web công khai | Mở 3 form con, tính tiền tự động | [ ] | Route public |
| 4 | **TC-EVT-04** | Thanh toán VietQR SePay & Cấp vé QR | Sinh mã QR HMAC-SHA256 tức thì | [ ] | Đúng cú pháp |
| 5 | **TC-EVT-05** | Import Excel đối soát vé & đơn giá | Chặn vé sai tên & chặn giá sai lệch | [ ] | Strict Rule |
| 6 | **TC-EVT-06** | Check-in Camera App Mobile (Online) | Nhận diện < 1s, phân loại Đúng giờ | [ ] | Haptic feedback |
| 7 | **TC-EVT-07** | Khách tự Check-in tại Kiosk công khai | Nhập mã vé hoặc tải ảnh QR thành công | [ ] | `/event-checkin` |
| 8 | **TC-EVT-08** | Chặn quét vé trùng lặp | Cảnh báo đỏ, chặn check-in lần 2 | [ ] | Chống gian lận |
| 9 | **TC-EVT-09** | Check-in Ngoại tuyến (Offline Mode) | Điểm danh không mạng, tự đồng bộ lại | [ ] | IndexedDB cache |
| 10 | **TC-EVT-10** | Tiếp đón khách vãng lai tại bàn | Thu tiền mặt/QR, xuất vé tại chỗ | [ ] | Walk-in desk |
| 11 | **TC-EVT-11** | Vòng quay may mắn lọc theo Chức danh | Chỉ quay người đã check-in, lọc đúng chức danh | [ ] | Visual LED |
| 12 | **TC-EVT-12** | Thư viện ảnh Live & Chia sẻ link | Xem realtime, gửi link Zalo/Email | [ ] | CDN sync |
| 13 | **TC-EVT-13** | Khảo sát đánh giá & Đóng sau 24h | NPS 1-5 sao, tự đóng sau 24h | [ ] | Auto-close |
| 14 | **TC-EVT-14** | Xuất báo cáo 3 định dạng (Excel, CSV, PDF) | Excel đẹp, CSV UTF-8 BOM, PDF A4 có chữ ký | [ ] | 3 Định dạng |
| 15 | **TC-EVT-15** | Đối soát Quỹ Tổng CLB | Tiền vé vào Quỹ Tổng, duyệt chi chuẩn | [ ] | UC-FIN-01 |

---

## 6. HƯỚNG DẪN XỬ LÝ KHI GẶP LỖI THƯỜNG GẶP (TROUBLESHOOTING)

1. **Lỗi cổng 4003 bị chiếm dụng (`EADDRINUSE: 0.0.0.0:4003`)**:
   * *Nguyên nhân*: Có tiến trình Node.js chạy ngầm giữ cổng 4003.
   * *Khắc phục*: Chạy `cmd.exe /c "taskkill /F /IM node.exe"` hoặc tìm PID qua `netstat -ano | findstr :4003` và kill PID đó.
2. **Lỗi chuyển hướng khi quét mã QR công khai**:
   * *Nguyên nhân*: Route `/guest-event-register/:id` hoặc `/event-checkin` bị bọc bởi Auth Guard.
   * *Khắc phục*: Xác nhận các route này nằm ngoài `ProtectedRoute` và backend sử dụng `OptionalJwtAuthGuard`.
3. **Lỗi file CSV mở trên Excel bị lỗi font tiếng Việt**:
   * *Nguyên nhân*: File CSV thiếu tiền tố Byte Order Mark (BOM).
   * *Khắc phục*: Luôn thêm mã hex `\uFEFF` vào đầu chuỗi nội dung CSV trước khi xuất file.
4. **Lỗi không kết nối được CSDL Localhost**:
   * *Nguyên nhân*: PostgreSQL 127.0.0.1:5432 chưa được bật hoặc thông số kết nối chưa khớp.
   * *Khắc phục*: Khởi động dịch vụ PostgreSQL trên máy phát triển hoặc kiểm tra chuỗi `DATABASE_URL` trong file `.env`.
