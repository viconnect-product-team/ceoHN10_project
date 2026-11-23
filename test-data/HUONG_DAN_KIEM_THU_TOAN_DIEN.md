# TÀI LIỆU HƯỚNG DẪN KIỂM THỬ TOÀN DIỆN VÒNG ĐỜI SỰ KIỆN CEO HN10
*Mục đích: Hướng dẫn chi tiết từng bước kiểm thử (Trước - Trong - Sau sự kiện) kèm tệp dữ liệu thực tế*

---

## 📁 1. CÁC TỆP DỮ LIỆU KIỂM THỬ SẴN CÓ
Các tệp đã được tạo sẵn trong thư mục `test-data/events/`:
1. `danh_sach_tham_du_khai_giang_mau.xlsx`:
   - Danh sách 10 đại biểu mẫu với đầy đủ Họ tên, SĐT, Email, Công ty, Chức danh.
   - Có cột **Trạng thái thanh toán** (`Đã thanh toán` vs `Chưa thanh toán`).
   - Có cột **Giá vé** (`500.000 VNĐ`, `0 VNĐ`).
   - Có các cột động đặc thù: `Số ghế VIP`, `Yêu cầu đặc biệt` (Ăn chay, Xuất hóa đơn VAT, v.v.).
2. `danh_sach_tham_du_hoi_nghi_mau.csv`:
   - File CSV danh sách đại biểu để test import định dạng bảng phân tách dấu phẩy.
3. `sample_tickets_qr_payloads.json`:
   - Danh sách mã vé `TKT-TEST-0001` đến `TKT-TEST-0010` và URL QR Code để kiểm thử soát vé tại cửa.

---

## 🛠️ 2. QUY TRÌNH KIỂM THỬ TỪNG BƯỚC

### BƯỚC 1: KIỂM THỬ IMPORT FILE & DYNAMIC DDL CỘT DATABASE (TRƯỚC SỰ KIỆN)
1. Mở Cổng Quản Trị CRM -> Điều hướng tới mục **Sự kiện & Điểm danh** -> Chọn tab **Đại biểu & Đăng ký vé** (`/event-registrations`).
2. Bấm nút **"Import Danh Sách (Word/Excel/PDF)"**.
3. Kéo thả hoặc chọn tệp `test-data/events/danh_sach_tham_du_khai_giang_mau.xlsx`.
4. **Kiểm tra kết quả**:
   - Giao diện nạp lên danh sách 10 đại biểu kèm các cột `Số ghế VIP`, `Yêu cầu đặc biệt`.
   - Bấm **"Xác Nhận Nạp Dữ Liệu"**:
     - Database tự động thực thi `ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS "Số ghế VIP" text` và `"Yêu cầu đặc biệt" text`.
     - Bảng hiển thị đúng 2 cột động mới của riêng sự kiện đó. Các sự kiện khác khi lọc sẽ không bị hiển thị nhầm cột này (Tính năng cô lập cột động).
     - Kiểm tra hạch toán Quỹ: Số tiền từ các vé `Đã thanh toán` (500.000 VNĐ x số vé) tự động được nạp vào Quỹ CLB và cập nhật tổng thu trên Dashboard CRM.

---

### BƯỚC 2: KIỂM THỬ TOGGLE TRẠNG THÁI THANH TOÁN TRÊN TỪNG DÒNG
1. Tại bảng danh sách đại biểu (`/event-registrations`), tìm đại biểu có trạng thái `Chưa thanh toán` (Ví dụ: Lê Hoàng Long).
2. Bấm trực tiếp vào nút **"Chưa thanh toán"** trên dòng đó.
3. **Kiểm tra kết quả**:
   - Trạng thái lập tức chuyển sang huy hiệu màu xanh **"Đã thanh toán"**.
   - Xuất hiện thông báo: *"Đã chuyển sang ĐÃ THANH TOÁN & tự động hạch toán Quỹ tài chính CRM!"*.
   - Số tiền 500.000 VNĐ lập tức được tạo bản ghi `income_records` và cập nhật vào Quỹ tài chính.
   - Bấm lại lần nữa để chuyển ngược về `Chưa thanh toán`.

---

### BƯỚC 3: KIỂM THỬ CỔNG CHECK-IN 2 MÃ QR (ĐỐI SOÁT KHÁCH HÀNG)
1. Mở Cổng Check-in (`/event-checkin`).
2. **Trường hợp 1 - Đại biểu đã đăng ký từ trước**:
   - Nhập mã vé `TKT-TEST-0001` (hoặc tải ảnh QR) -> Bấm **"Kiểm Tra Mã Vé"**.
   - Hệ thống hiển thị màu xanh lá kèm huy hiệu 🟢 **"ĐẠI BIỂU ĐÃ ĐĂNG KÝ TỪ TRƯỚC (PRE-REGISTERED)"**.
   - Tích chọn phần tham gia (Tọa đàm / Gala Dinner) -> Bấm **"XÁC NHẬN CHECK-IN VÀO CỬA"**.
   - Thử nhập lại mã `TKT-TEST-0001`: Hệ thống lập tức cảnh báo màu đỏ: *"Vé này ĐÃ ĐƯỢC CHECK-IN lúc ...! Không thể check-in lại."* (Chống gian lận vé 1 lần).
3. **Trường hợp 2 - Khách mới đăng ký tại cửa (Walk-in)**:
   - Bấm nút **"+ Khách Mới Tại Cửa"**.
   - Điền thông tin khách mới (kèm nút `+ Thêm người đi cùng` nếu có người đi kèm).
   - Bấm **"Xác Nhận Đăng Ký & Check-in Ngay"**.
   - Hệ thống cấp mã vé mới và đánh dấu huy hiệu 🔵 **"KHÁCH MỚI ĐĂNG KÝ TẠI SỰ KIỆN (WALK-IN GUEST)"**.

---

### BƯỚC 4: KIỂM THỬ VÒNG QUAY MAY MẮN CANVAS (TRONG SỰ KIỆN)
1. Tại trang Quản lý sự kiện hoặc Dashboard, mở **"Vòng Quay May Mắn (Lucky Draw)"**.
2. **Kiểm tra nguồn dữ liệu**:
   - Hệ thống chỉ tải danh sách các đại biểu **ĐÃ CHECK-IN** ở Bước 3.
   - Có thể chọn "Chọn tất cả" hoặc tick chọn từng người cụ thể đưa vào vòng quay.
3. Bấm **"QUAY VÒNG MAY MẮN"**:
   - Vòng quay tròn Canvas quay tít với hiệu ứng vật lý giảm tốc mượt mà và kim chỉ ở góc 12h.
   - Khi dừng lại: Hiệu ứng pháo hoa và âm thanh chúc mừng người trúng giải.
   - Bấm nút **"Loại bỏ khỏi vòng quay"** để người vừa trúng không bị quay trùng ở giải tiếp theo.

---

### BƯỚC 5: KIỂM THỬ CHỤP ẢNH & ĐỒNG BỘ TÀI LIỆU (TRONG SỰ KIỆN)
1. Tại Cổng Check-in hoặc Danh sách sự kiện, bấm **"Chụp & Album Ảnh Sự Kiện"**.
2. Bấm **"Chụp Ảnh Ngay"** (mở camera) hoặc **"Tải Ảnh Lên"** (chọn ảnh từ máy).
3. **Kiểm tra kết quả**:
   - Ảnh nạp thành công hiển thị ngay trong album sự kiện.
   - Vào mục **Tài Liệu & Biểu Mẫu** trên CRM: Bản ghi ảnh sự kiện tự động xuất hiện với danh mục `"Ảnh Sự Kiện"` và mô tả tên sự kiện tương ứng.

---

### BƯỚC 6: KIỂM THỬ ĐÁNH GIÁ SAU SỰ KIỆN & GỬI RECAP (SAU SỰ KIỆN)
1. **Trình chiếu QR Đánh Giá**:
   - Tại danh sách sự kiện CRM, bấm nút **"Đánh giá"** -> Bấm **"Trình Chiếu LED"**.
   - Màn hình LED phóng to mã QR với độ phân giải cao để đại biểu trong hội trường dùng điện thoại quét.
2. **Đại biểu gửi đánh giá**:
   - Quét mã mở trang `/guest-event-feedback/:eventId`.
   - Chọn số sao (5 sao), nhập cảm nhận và bấm **"GỬI ĐÁNH GIÁ"**.
   - Kiểm tra tại CRM: Ý kiến đánh giá lập tức xuất hiện trong danh sách phản hồi và đồng bộ vào mục **Phản Ánh & Góp Ý** của CLB.
3. **Gửi Recap**:
   - Tại danh sách sự kiện CRM, bấm **"Gửi Recap"**.
   - Hệ thống tự động gửi Email và Zalo OA cho tất cả đại biểu đã check-in kèm đường link xem trọn bộ album ảnh và nút đánh giá sự kiện.
