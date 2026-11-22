# Phân Hệ Quản Lý Sự Kiện, Check-in & Vé Điện Tử - CEO HN10
*Gói Module Độc Lập Chuyển Giao Khách Hàng - CEO HN10 Ecosystem*

---

## 1. Giới thiệu
Bao gồm tạo sự kiện, import danh sách 3 định dạng (.docx, .xlsx, .pdf), dynamic DDL database, check-in 2 mã QR, vòng quay may mắn Canvas, live photo stream, và khảo sát đánh giá sau sự kiện.

## 2. Hướng dẫn cài đặt và vận hành
1. **Cài đặt thư viện phụ thuộc**:
   ```bash
   npm install
   ```
2. **Cấu hình môi trường**:
   - Sao chép file `.env.example` thành `.env` và điền chuỗi kết nối Database PostgreSQL.
3. **Khởi chạy module**:
   ```bash
   npm run dev
   ```

## 3. Dữ liệu kiểm thử đi kèm
Trong thư mục `test-data/events/` có sẵn:
- File Excel mẫu (`.xlsx`) danh sách 15 đại biểu, có cột giá vé và trạng thái thanh toán để test tính năng import và hạch toán quỹ.
- File Word mẫu (`.docx`) bảng danh sách đại biểu.
- File JSON chứa các mã vé và QR mẫu để test luồng soát vé check-in 2 mã.
