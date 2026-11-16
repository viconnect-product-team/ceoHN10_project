# BỘ TIÊU CHUẨN GIAO DIỆN HỆ THỐNG CEO HN10
## QUY CHUẨN THIẾT KẾ ĐỘC QUYỀN 5 MÀU (STRICT 5-COLOR DESIGN SYSTEM)

---

## I. NGUYÊN TẮC THIẾT KẾ CỐT LÕI (CORE DESIGN PRINCIPLES)

Nhằm định vị đẳng cấp của **CLB Doanh Nhân CEO HN10 (Group Quản Trị & Khởi Nghiệp - HanoiBA)**, toàn bộ hệ sinh thái phần mềm (bao gồm **Hệ thống Web CRM Quản trị** và **Ứng dụng Mobile App/PWA Hội viên**) áp dụng nghiêm ngặt quy tắc thiết kế:

> **NGUYÊN TẮC BẤT KHẢ XÂM PHẠM: TỐI ƯU DUY NHẤT 5 MÀU.**  
> **Dải Gradient chủ đạo là TÍM HỒNG kết hợp NỀN ĐEN chữ TRẮNG. TUYỆT ĐỐI KHÔNG SỬ DỤNG BẤT KỲ MÀU NÀO KHÁC.**

### 1. Bảng mã 5 màu tiêu chuẩn hệ thống

| STT | Tên màu | Mã HEX | Vai trò & Mục đích sử dụng |
|:---:|:---|:---:|:---|
| **1** | **Tím Hoàng Gia (Royal Purple)** | `#7C2D82` | **Màu thương hiệu chính (Primary Brand)**: Đại diện cho tri thức, sự kết nối lãnh đạo và chiều sâu quản trị doanh nghiệp. Là điểm bắt đầu của dải màu Gradient. |
| **2** | **Hồng Tươi (Vibrant Magenta / Pink)** | `#D61F69` | **Màu điểm nhấn thị giác (Accent Color)**: Đại diện cho năng lượng khởi nghiệp, sự đổi mới sáng tạo và nhiệt huyết doanh nhân. Là điểm kết thúc của dải màu Gradient. |
| **3** | **Đen Tuyền (Carbon Black)** | `#000000` | **Màu nền chủ đạo (Primary Background)**: Nền toàn bộ hệ thống Web CRM, nền ứng dụng Mobile App, thanh bên (Sidebar), thẻ card tối và các khối bề mặt chính. Tạo chiều sâu tối thượng và tôn vinh nội dung. |
| **4** | **Trắng Tinh Khôi (Crisp Pure White)** | `#FFFFFF` | **Màu chữ & Biểu tượng (Typography & Contrast)**: Toàn bộ chữ hiển thị trên nền đen và trên dải gradient đều là màu trắng. Đảm bảo độ tương phản tối đa đạt chuẩn WCAG AAA. |
| **5** | **Đen Xám Viền (Dark Slate Surface & Border)** | `#18181B` | **Màu đường kẻ viền & Bề mặt cấp 2 (Border & Secondary Surface)**: Sử dụng cho các đường line phân chia (`border`), ô nhập liệu (`input background`), viền ngăn cách giữa các module, thanh cuộn tối giản. |

---

### 2. Quy chuẩn Dải màu Gradient Tím - Hồng (Purple-Pink Gradient)

- **Công thức dải Gradient chủ đạo**:
  $$\text{CSS Gradient} = \text{linear-gradient}(135^\circ, \#7C2D82 \;\; 0\%, \;\; \#D61F69 \;\; 100\%)$$
- **Ứng dụng của Gradient**:
  - Nút bấm hành động chính (Primary Action CTAs): Nút Đăng nhập, Nút Lưu dữ liệu, Nút Đăng ký sự kiện, Nút Tạo khóa học, Nút Đóng hội phí.
  - Thẻ Danh thiếp số VIP & Thẻ Hội viên điện tử (Digital Membership Card).
  - Khung viền vinh danh, Avatar của Ban Điều Hành, Top 1-2-3 Bảng xếp hạng.
  - Huy hiệu (Badges), Thẻ đánh dấu trạng thái hoạt động chính, Biểu đồ tiến độ.
  - Quầng sáng tỏa nhẹ (Radial glow mesh) trên nền đen của màn hình đăng nhập và trang chủ.

---

### 3. Quy chuẩn Typography & Phân cấp thị giác (Visual Hierarchy)

Mọi văn bản trong toàn bộ hệ thống đều tuân thủ nguyên tắc **CHỮ TRẮNG (`#FFFFFF`)**:
- **Tiêu đề cấp 1 (H1), Số liệu KPI lớn, Tên Doanh Nhân / Doanh Nghiệp**: Màu Trắng `#FFFFFF`, độ đậm `font-bold` (700) hoặc `font-black` (900).
- **Nội dung chính, Nhãn trường dữ liệu (Labels), Văn bản bảng biểu**: Màu Trắng `#FFFFFF`, `font-medium` (500) hoặc `font-normal` (400).
- **Mô tả phụ, Thời gian, Gợi ý, Placeholder**: Màu Trắng `#FFFFFF` với độ mờ Opacity $70\%$ (`rgba(255, 255, 255, 0.70)`) hoặc Opacity $50\%$ (`rgba(255, 255, 255, 0.50)`).
- **Nút bấm**: Nền Gradient Tím - Hồng (`#7C2D82` ➔ `#D61F69`), Chữ Trắng `#FFFFFF` in hoa đậm, không gạch chân.

---

### 4. Bảng cấm (Prohibited Colors & Anti-Patterns)

- ❌ **NGHIÊM CẤM** dùng màu vàng (`#F59E0B`, `#EAB308`), màu cam (`#F97316`), màu xanh lá (`#10B981`, `#22C55E`), màu xanh dương (`#003B95`, `#3B82F6`, `#0284C7`), màu đỏ tươi (`#EF4444`).
- ❌ **Trạng thái Thành công (Success)**: Biểu thị bằng icon màu Trắng `#FFFFFF` đặt trên nền Gradient Tím - Hồng hoặc viền Tím `#7C2D82`.
- ❌ **Trạng thái Cảnh báo / Hết hạn**: Biểu thị bằng màu Hồng `#D61F69` với chữ Trắng `#FFFFFF`.
- ❌ **Độ tương phản**: Không bao giờ đặt chữ màu xám tối hoặc màu đen trên nền đen; toàn bộ chữ bắt buộc là màu Trắng `#FFFFFF`.

---

## II. DANH SÁCH CÁC TÍNH NĂNG ĐÃ LOẠI BỎ TRIỆT ĐỂ

Theo chỉ đạo dứt khoát của Ban Điều Hành CEO HN10, các tính năng sau đây **ĐÃ ĐƯỢC LOẠI BỎ HOÀN TOÀN** khỏi menu điều hướng, giao diện và router hệ thống:
1. ❌ **Marketplace** (Chợ giao thương mua bán sản phẩm): Bỏ hoàn toàn.
2. ❌ **Giao thương chia sẻ cơ hội**: Bỏ hoàn toàn.
3. ❌ **Cuộc họp** (Lịch họp nội bộ / Business connect meetings): Bỏ hoàn toàn.
4. ❌ **Set up template web / Quản lý landing page**: Bỏ hoàn toàn.

Thay vào đó, hệ thống tập trung sâu sắc vào 5 trục giá trị cốt lõi:
1. 🎓 **Lớp học & Khóa đào tạo Doanh nghiệp (Trainings & Masterclasses)**
2. 📚 **Kho Lưu trữ Tài liệu & Học liệu số Doanh nghiệp (Digital Vault)**
3. 🎪 **Sự kiện & Check-in QR Code Realtime (Events Management)**
4. 💳 **Báo cáo Tài chính Realtime & Đóng hội phí tự động MoMo/VNPay (Treasury)**
5. 🏆 **Danh bạ Doanh nhân & Bảng xếp hạng Vinh danh Hội viên (Leaderboard)**

---

## III. MÔ TẢ CHI TIẾT TỪNG MÀN HÌNH HỆ THỐNG

---

### PHÂN HỆ 1: HỆ THỐNG WEB CRM QUẢN TRỊ (ADMIN & BAN ĐIỀU HÀNH)

```
+---------------------------------------------------------------------------------------+
|  LOGO CEO HN10 (Tím - Trắng)   |  Tìm kiếm... [Ctrl+K]       |  Admin Ban Điều Hành 🔔 |
+--------------------------------+-----------------------------+-------------------------+
| [Thanh bên - Nền Đen #000000]  | [Vùng làm việc chính - Nền Đen #000000 / Quầng tím hồng] |
| 📊 Tổng quan                   |                                                       |
| 👥 Hội viên                    |  [KPI 1: Hội viên]  [KPI 2: Tài chính]  [KPI 3: Lớp học] |
| 🛡️ Phân quyền RBAC              |  Gradient Tím-Hồng   Gradient Tím-Hồng   Gradient Tím-Hồng |
| 🎪 Sự kiện & QR                |  Số liệu chữ Trắng  Số liệu chữ Trắng  Số liệu chữ Trắng|
| 🎓 Lớp học & Đào tạo           +-------------------------------------------------------+
| 📚 Tài liệu & Học liệu số      | [Bảng dữ liệu / Biểu đồ realtime: Chữ Trắng - Viền #18181B] |
| 💰 Tài chính & Hội phí         |                                                       |
| ⚙️ Cài đặt hệ thống            |                                                       |
+--------------------------------+-------------------------------------------------------+
```

#### Màn hình 1: Đăng nhập Quản trị CRM (CRM Login Screen)
- **Đường dẫn**: `/login`
- **Màu nền**: Màu Đen tuyền `#000000` kết hợp hiệu ứng quầng sáng lan tỏa (Radial Glow Mesh) từ góc trên bên trái (Tím `#7C2D82`) và góc dưới bên phải (Hồng `#D61F69`).
- **Logo trung tâm**: Biểu trưng CEO HN10 chuẩn sắc tím hoàng gia kết hợp dải gradient chữ trắng tinh tế.
- **Tiêu đề**: "ĐĂNG NHẬP HỆ THỐNG QUẢN TRỊ CEO HN10" - Chữ Trắng `#FFFFFF`, font-extrabold.
- **Khối nhập liệu (Input Form)**:
  - Khung form: Nền Đen `#000000`, viền bao quanh Đen xám `#18181B`, bo góc `rounded-2xl`.
  - Ô Tên đăng nhập & Mật khẩu: Nền `#18181B`, viền `#18181B` (khi focus chuyển viền Hồng `#D61F69`), chữ Trắng `#FFFFFF`, placeholder mờ 50% chữ trắng.
  - Biểu tượng icon (User, Lock, Eye): Màu Trắng `#FFFFFF`.
- **Nút hành động (CTA)**: "ĐĂNG NHẬP VÀO HỆ THỐNG" - Nền dải Gradient Tím - Hồng (`linear-gradient(135deg, #7C2D82 0%, #D61F69 100%)`), chữ Trắng `#FFFFFF` in hoa đậm, hiệu ứng bóng mờ đổ sáng tím hồng (`box-shadow: 0 4px 16px rgba(214, 31, 105, 0.4)`).
- **Thông báo lỗi**: Khung viền Hồng `#D61F69`, chữ Trắng `#FFFFFF`.

---

#### Màn hình 2: Bảng Điều Khiển Tổng Quan (Executive Dashboard)
- **Đường dẫn**: `/` hoặc `/dashboard`
- **Màu nền**: Màu Đen tuyền `#000000` kết hợp viền phân cách `#18181B`.
- **Header trang**: "TỔNG QUAN HỆ THỐNG CEO HN10" (Chữ Trắng `#FFFFFF`, font-bold) kèm phụ đề "Cập nhật dữ liệu thời gian thực từ cơ sở dữ liệu PostgreSQL ceohn10_project" (Chữ Trắng mờ 70%).
- **4 Thẻ thống kê KPI chủ đạo**:
  1. *Thẻ 1 - Hội viên chính thức*: Khung card nền Đen `#000000`, viền Đen xám `#18181B`. Số lượng hội viên hiển thị chữ Trắng cỡ lớn `text-3xl font-black`. Icon người dùng viền dải Gradient Tím - Hồng.
  2. *Thẻ 2 - Quỹ Hội & Tài Chính Realtime*: Số dư ngân quỹ biến động tức thì theo từng giao dịch MoMo/VNPay thành công. Số tiền VND màu Trắng `#FFFFFF`.
  3. *Thẻ 3 - Sự kiện & Tỷ lệ Tham gia*: Số lượng sự kiện trong tháng và tỷ lệ check-in QR thực tế. Huy hiệu trạng thái viền tím hồng chữ trắng.
  4. *Thẻ 4 - Lớp học & Đào tạo Doanh nghiệp*: Tổng số khóa học đang triển khai và số lượt hội viên đã tham gia học.
- **Khu vực Biểu đồ Tăng trưởng & Dòng tiền**: Biểu đồ đường (Line Chart) và cột (Bar Chart) vẽ trên nền đen `#000000`, đường lưới viền `#18181B`, dải màu biểu đồ phối giữa Tím `#7C2D82`, Hồng `#D61F69` và Trắng `#FFFFFF`.
- **Bảng Sự kiện sắp diễn ra & Khóa đào tạo mới nhất**: Bảng dữ liệu nền Đen `#000000`, đường kẻ ngang `#18181B`, tiêu đề cột chữ trắng đậm, toàn bộ nội dung chữ trắng dễ đọc.

---

#### Màn hình 3: Quản Lý Danh Bạ & Hồ Sơ Hội Viên (Members Management)
- **Đường dẫn**: `/members`
- **Màu nền**: Đen `#000000`, viền `#18181B`.
- **Thanh công cụ lọc (Filter Toolbar)**:
  - Ô tìm kiếm theo tên, công ty, mã số hội viên: Nền `#18181B`, viền `#18181B`, chữ Trắng `#FFFFFF`.
  - Bộ lọc theo Ban chuyên môn (Ban Đào tạo, Ban Sự kiện, Ban Tài chính, v.v.): Dropdown nền Đen viền `#18181B`, chữ trắng.
  - Nút "Thêm Hội Viên Mới": Nền Gradient Tím - Hồng (`#7C2D82` ➔ `#D61F69`), icon dấu cộng trắng, chữ Trắng `#FFFFFF`.
  - Nút "Xuất Danh Sách Excel": Khung nền `#000000`, viền Tím `#7C2D82`, chữ Trắng `#FFFFFF`.
- **Bảng Danh Sách Hội Viên (Data Table)**:
  - Hàng tiêu đề (Table Header): Nền `#18181B`, chữ Trắng `#FFFFFF` in hoa font-bold.
  - Cột Avatar & Thông tin: Ảnh đại diện bo tròn viền Tím `#7C2D82`. Tên doanh nhân chữ Trắng đậm, tên doanh nghiệp chữ Trắng mờ 70%.
  - Cột Chức vụ / Ban chuyên môn: Pill tag nền Gradient Tím - Hồng chữ Trắng sắc nét.
  - Cột Trạng thái hội phí: Tag viền Tím `#7C2D82` chữ Trắng (Đã nộp) hoặc viền Hồng `#D61F69` chữ Trắng (Chờ nộp).
  - Cột Thao tác: Icon chỉnh sửa, xem chi tiết màu Trắng `#FFFFFF`.
- **Modal Chi Tiết Hồ Sơ Hội Viên**: Nền Đen `#000000`, viền bao quanh `#18181B`. Các tab thông tin (Thông tin chung, Doanh nghiệp, Lịch sử tham gia sự kiện, Lịch sử học tập) khi active sẽ có gạch chân Gradient Tím - Hồng chữ Trắng.

---

#### Màn hình 4: Ma Trận Phân Quyền & Ban Điều Hành (RBAC Permissions Matrix)
- **Đường dẫn**: `/permissions`
- **Màu nền**: Đen `#000000`, viền `#18181B`.
- **Banner Định Danh BĐH**: Khối banner nổi bật với dải Gradient Tím - Hồng (`#7C2D82` ➔ `#D61F69`), logo CEO HN10 và dòng chữ Trắng: "MA TRẬN PHÂN QUYỀN HỆ THỐNG CEO HN10 — KIỂM SOÁT VẬN HÀNH BẢO MẬT".
- **Bộ nút hành động trên Header**:
  - Nút "Cập Nhật Quyền": Nền Gradient Tím - Hồng (`#7C2D82` ➔ `#D61F69`), chữ Trắng.
  - Nút "Khôi Phục Mặc Định": Nền `#000000`, viền `#18181B`, chữ Trắng.
- **Tab Phân chia Phạm vi**:
  - Tab "QUẢN TRỊ CRM (WEB)" (Active): Nền Gradient Tím - Hồng, chữ Trắng đậm.
  - Tab "ỨNG DỤNG MOBILE (APP)" (Inactive): Nền `#000000`, viền `#18181B`, chữ Trắng mờ 70%.
- **Bảng Ma Trận Phân Quyền**:
  - Tiêu đề cột các Ban Điều Hành (Chủ tịch CLB, Ban Thư ký & Vận hành, Ban Đào tạo & Chuyên môn, Ban Tài chính & Quỹ, Ban Sự kiện & Truyền thông, Ban Hội viên & Gắn kết): Nền `#18181B`, chữ Trắng font-bold.
  - Các nhóm quyền:
    * Nhóm Quản trị Tổng quan & Hệ thống
    * Nhóm Quản lý Hội viên & Hồ sơ Doanh nhân
    * Nhóm Quản lý Sự kiện & Điểm danh QR
    * Nhóm **Lớp học & Khóa đào tạo Doanh nghiệp** (Đặc quyền mới của CEO HN10)
    * Nhóm **Kho Tài liệu & Học liệu số** (Đặc quyền mới của CEO HN10)
    * Nhóm Báo cáo Tài chính Realtime & Quỹ hội
  - Checkbox phân quyền: Ô vuông nền Đen `#000000`, viền Tím `#7C2D82`. Khi kích hoạt: Nền Gradient Tím - Hồng và icon check Trắng `#FFFFFF`.

---

#### Màn hình 5: Quản Lý Sự Kiện & Điểm Danh QR Code (Events & QR Check-in)
- **Đường dẫn**: `/events`
- **Màu nền**: Đen `#000000`, viền `#18181B`.
- **Bộ nút điều hướng**: Nút "Tạo Sự Kiện Mới" (Gradient Tím - Hồng, chữ Trắng), Nút "Mở Quầy Check-in Toàn Màn Hình" (Khung viền Tím `#7C2D82`, chữ Trắng).
- **Lưới danh sách Sự kiện**:
  - Thẻ sự kiện: Nền Đen `#000000`, viền `#18181B`, bo góc `rounded-xl`.
  - Ảnh cover sự kiện: Tỷ lệ 16:9 sắc nét.
  - Tên sự kiện: Chữ Trắng `#FFFFFF` font-bold `text-lg`.
  - Thời gian, địa điểm: Icon Trắng, chữ Trắng mờ 70%.
  - Huy hiệu tiến độ: Tag viền Gradient Tím - Hồng, chữ Trắng (ví dụ: "Đã có 68/80 hội viên đăng ký").
- **Màn hình Quầy Điểm Danh QR Code Trực Tiếp (Live QR Gate)**:
  - Khung quét camera: Viền laser phát sáng Gradient Tím - Hồng trên nền đen.
  - Khi quét thành công: Pop-up thông báo hiển thị Họ tên Doanh nhân, Tên Công ty, Thời gian quét chính xác, âm thanh xác nhận, toàn bộ chữ Trắng `#FFFFFF` trên nền Gradient Tím - Hồng.
  - Bảng thống kê điểm danh Realtime: Cập nhật từng giây không cần tải lại trang.

---

#### Màn hình 6: Quản Lý Lớp Học & Khóa Đào Tạo (Trainings Management)
- **Đường dẫn**: `/trainings`
- **Màu nền**: Đen `#000000`, viền `#18181B`.
- **Mục tiêu chuyên biệt**: Phục vụ các chuyên đề bồi dưỡng lãnh đạo, kỹ năng khởi nghiệp và quản trị vận hành dành riêng cho hội viên CEO Hà Nội.
- **Thanh tác vụ**: Nút "Tạo Khóa Đào Tạo Mới" (Gradient Tím - Hồng, chữ Trắng), Bộ lọc chuyên đề (Quản trị, Tài chính, Pháp lý, Nhân sự, Công nghệ).
- **Lưới danh sách Khóa học (Training Course Cards)**:
  - Thẻ khóa học: Nền Đen `#000000`, viền `#18181B`.
  - Tiêu đề khóa học: Chữ Trắng `#FFFFFF` font-bold.
  - Giảng viên / Chuyên gia: Tên chuyên gia chữ Trắng, tag danh vị viền Tím `#7C2D82` chữ Trắng.
  - Số buổi học & Thời lượng: Chữ Trắng mờ 70%.
  - Tiến độ lớp học & Số lượng học viên: Thanh tiến độ (Progress bar) bằng dải Gradient Tím - Hồng.
- **Màn hình Quản lý Buổi học & Tài liệu Khóa học**:
  - Danh sách bài giảng / video / slide buổi học: Chữ Trắng, nút tải tài liệu nền `#18181B` chữ Trắng.
  - Danh sách điểm danh hội viên tham gia từng buổi: Dữ liệu realtime từ PostgreSQL `ceohn10_project`.

---

#### Màn hình 7: Quản Lý Kho Tài Liệu & Học Liệu Số (Digital Vault & Knowledge Base)
- **Đường dẫn**: `/documents`
- **Màu nền**: Đen `#000000`, viền `#18181B`.
- **Khu vực Tải lên Tài liệu (Upload Zone)**:
  - Khung kéo thả file: Nền Đen `#000000`, viền nét đứt màu Tím `#7C2D82`.
  - Icon đám mây tải lên: Màu Trắng `#FFFFFF`.
  - Dòng hướng dẫn: "Kéo thả tài liệu PDF, DOCX, XLSX, MP4 hoặc bấm để chọn tệp" - Chữ Trắng `#FFFFFF`.
  - Nút bấm duyệt file: Nền Gradient Tím - Hồng, chữ Trắng.
- **Cây Thư Mục Tài Liệu Chuyên Đề**:
  - Thư mục: Kỷ yếu CLB, Biểu mẫu Hợp đồng & Pháp lý, Báo cáo Nghiên cứu Thị trường, Slide Khóa Đào Tạo CEO.
  - Tên thư mục & số lượng file: Icon thư mục trắng, chữ Trắng `#FFFFFF`.
- **Bảng Danh Sách Tài Liệu (Document Table)**:
  - Cột Tên tài liệu & Định dạng (PDF, DOCX...): Chữ Trắng.
  - Cột Dung lượng & Ngày tải lên: Chữ Trắng mờ 70%.
  - Cột Phân quyền truy cập: Tag viền Tím `#7C2D82` chữ Trắng (Tất cả hội viên / Chỉ BĐH / Lớp học đặc biệt).
  - Cột Thao tác: Nút Tải về (Download) và Xem trước (Preview) màu Trắng `#FFFFFF`.

---

#### Màn hình 8: Báo Cáo Tài Chính Realtime & Quản Lý Quỹ Hội (Financial Reports & Treasury)
- **Đường dẫn**: `/finance`
- **Màu nền**: Đen `#000000`, viền `#18181B`.
- **3 Thẻ Tổng Quan Tài Chính**:
  1. *Tổng Thu Quỹ Hội*: Nền Đen `#000000`, viền `#18181B`, số tiền VND màu Trắng `#FFFFFF` cỡ lớn.
  2. *Tổng Chi Hoạt Động*: Nền Đen `#000000`, viền `#18181B`, số tiền VND màu Trắng `#FFFFFF`.
  3. *Số Dư Khả Dụng Hiện Tại*: Nền dải Gradient Tím - Hồng (`#7C2D82` ➔ `#D61F69`), số tiền VND chữ Trắng `#FFFFFF` in hoa font-black. Biến động thời gian thực từ database.
- **Bảng Biến Động Dòng Tiền Thời Gian Thực (Realtime Transaction Ledger)**:
  - Tuyệt đối không dùng dữ liệu mock/fake. Toàn bộ giao dịch đồng bộ trực tiếp từ webhook MoMo, VNPay và phiếu kế toán.
  - Cột Mã giao dịch & Thời gian: Chữ Trắng.
  - Cột Doanh nhân nộp / Đối tác nhận: Chữ Trắng font-semibold.
  - Cột Hạng mục (Hội phí thường niên 2026, Tài trợ sự kiện, Chi phí tổ chức lớp học...): Chữ Trắng.
  - Cột Số tiền: Hiển thị định dạng chuẩn VND bằng chữ Trắng `#FFFFFF`.
  - Cột Chứng từ / Biên lai: Nút xem hóa đơn/phiếu thu nền `#18181B` chữ Trắng.
- **Nút Thao Tác Kế Toán**: "Lập Phiếu Thu / Chi Mới" (Gradient Tím - Hồng, chữ Trắng), "Xuất Sổ Quỹ Kế Toán" (Viền Tím `#7C2D82`, chữ Trắng).

---

#### Màn hình 9: Cài Đặt Hệ Thống & Kết Nối Zalo OA (System Settings)
- **Đường dẫn**: `/settings`
- **Màu nền**: Đen `#000000`, viền `#18181B`.
- **Khối Cấu hình Zalo Official Account (Zalo OA Auto-Token)**:
  - Khung cấu hình: Nền Đen `#000000`, viền `#18181B`.
  - Các trường App ID, Secret Key, OA Refresh Token: Ô input nền `#18181B`, viền `#18181B`, chữ Trắng `#FFFFFF`.
  - Trạng thái kết nối Zalo OA: Tag viền Gradient Tím - Hồng, chữ Trắng "Đang hoạt động — Tự động làm mới token mỗi 4 tiếng".
  - Nút "Kiểm Tra Kết Nối Zalo ZNS": Nền Gradient Tím - Hồng, chữ Trắng.
- **Khối Cấu hình Cổng Thanh Toán MoMo & VNPay**:
  - Khóa bảo mật Merchant ID, Secret Key, Endpoint IPN: Ẩn mã hóa, chữ Trắng.
- **Nhật ký Hoạt động Quản trị (Audit Log Table)**:
  - Bảng ghi vết: Thời gian, Tài khoản thực hiện, Hành vi thay đổi dữ liệu, Địa chỉ IP. Toàn bộ chữ Trắng trên nền Đen `#000000`.

---

### PHÂN HỆ 2: ỨNG DỤNG MOBILE APP / PWA HỘI VIÊN (MEMBER APP)

```
+---------------------------------------+
|  09:41                        📶 🔋  |
|  [Logo CEO HN10]   [Thông báo 🔔]      |
|  Chào Anh/Chị, NGUYỄN VĂN A            |
+---------------------------------------+
|  +---------------------------------+  |
|  | THẺ HỘI VIÊN VIP CEO HN10       |  |
|  | [Gradient Tím - Hồng Rực Rỡ]    |  |
|  | Số thẻ: HN10-8888               |  |
|  | Công ty: CỔ PHẦN CÔNG NGHỆ ABC  |  |
|  | Chữ Trắng #FFFFFF tinh tế       |  |
|  +---------------------------------+  |
+---------------------------------------+
| [4 Phím tắt nhanh - Nền Đen #000000]   |
|  (🎪 Sự kiện)      (🎓 Lớp học)        |
|  (📚 Học liệu)     (💳 Nộp quỹ)        |
+---------------------------------------+
|  SỰ KIỆN SẮP TỚI                      |
|  [Card nền đen #000000 - Chữ Trắng]   |
|  Họp mặt Ban Điều Hành Quý 4          |
|  Tag: Gradient Tím - Hồng             |
+---------------------------------------+
| [Bottom Bar: Nền Đen #000000]         |
|  🏠 Trang chủ  🎪 Sự kiện  👤 Cá nhân |
+---------------------------------------+
```

#### Màn hình 10: Splash Screen & Giới Thiệu Chào Mừng (Splash & Onboarding)
- **Màu nền**: Đen tuyền `#000000`.
- **Biểu tượng trung tâm**: Logo CLB Doanh Nhân CEO HN10 được tạo hiệu ứng hào quang phát sáng Tím - Hồng (`box-shadow: 0 0 50px rgba(124, 45, 130, 0.6)`).
- **Thông điệp mở màn**:
  - Dòng 1: "CLB DOANH NHÂN CEO HN10" - Chữ Trắng font-black `text-2xl`.
  - Dòng 2: "Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA)" - Chữ Trắng mờ 70%.
  - Dòng 3: "Gắn Kết Doanh Nhân — Kiến Tạo Giá Trị Bền Vững" - Chữ Trắng `text-sm font-semibold`.
- **Nút hành động**: "BẮT ĐẦU TRẢI NGHIỆM" - Nền Gradient Tím - Hồng (`#7C2D82` ➔ `#D61F69`), bo tròn hoàn toàn `rounded-full`, chữ Trắng `#FFFFFF` in hoa đậm.

---

#### Màn hình 11: Trang Chủ App Hội Viên (Member Home Feed)
- **Màu nền**: Đen tuyền `#000000`.
- **Thanh trạng thái & Lời chào**:
  - Header chào đón: "Xin chào, [Họ và Tên Hội Viên]" - Chữ Trắng `#FFFFFF` `text-lg font-bold`.
  - Avatar hội viên: Viền Gradient Tím - Hồng sắc nét.
  - Nút quả chuông thông báo: Icon màu Trắng, chấm đỏ thông báo thay bằng chấm Hồng `#D61F69`.
- **Thẻ Hội Viên Điện Tử Thông Minh (Digital VIP Membership Card)**:
  - Kích thước tỷ lệ thẻ tín dụng quốc tế (85.6mm x 53.98mm).
  - Nền thẻ: Dải màu Gradient Tím - Hồng (`linear-gradient(135deg, #7C2D82 0%, #D61F69 100%)`) cao cấp.
  - Họa tiết chìm: Biểu trưng mạng lưới kết nối CEO HN10 màu Trắng mờ.
  - Thông tin in trên thẻ: Họ tên Doanh nhân, Tên Doanh nghiệp, Mã số hội viên (HN10-xxxx), Cấp bậc hội viên - Toàn bộ in bằng chữ Trắng `#FFFFFF` sắc sảo.
- **Khối Phím Tắt Nhanh (Quick Actions)**:
  - 4 nút biểu tượng tròn:
    1. *Sự kiện CLB*: Icon Trắng trên nền Đen xám `#18181B` viền Tím `#7C2D82`.
    2. *Lớp đào tạo*: Icon Trắng trên nền Đen xám `#18181B` viền Tím `#7C2D82`.
    3. *Kho học liệu*: Icon Trắng trên nền Đen xám `#18181B` viền Tím `#7C2D82`.
    4. *Đóng hội phí*: Icon Trắng trên nền Đen xám `#18181B` viền Hồng `#D61F69`.
- **Khối Sự Kiện Nổi Bật Sắp Tới**: Thẻ ngang trượt (Carousel) nền Đen `#000000`, viền `#18181B`, tiêu đề chữ Trắng, nút "Xem chi tiết" nền Gradient Tím - Hồng.
- **Khối Khóa Học Đề Xuất**: Danh sách bài giảng mới nhất, thumbnail 16:9, chữ Trắng.
- **Thanh Điều Hướng Đáy (Bottom Navigation Bar)**:
  - Nền Đen `#000000`, viền trên Đen xám `#18181B`.
  - Icon khi Active: Màu Hồng `#D61F69` kèm chấm sáng nhỏ.
  - Icon khi Inactive: Màu Trắng `#FFFFFF` mờ 60%.

---

#### Màn hình 12: Danh Thiếp Số & Hồ Sơ Cá Nhân Doanh Nhân (Digital Profile & NFC Namecard)
- **Màu nền**: Đen `#000000`, viền `#18181B`.
- **Khối Danh Thiếp Thông Minh (Smart Digital Card)**:
  - Nền thẻ: Gradient Tím - Hồng (`#7C2D82` ➔ `#D61F69`).
  - Mã QR cá nhân hóa: Nền Trắng `#FFFFFF`, các chấm mã QR màu Đen `#000000` (đảm bảo camera điện thoại quét nhanh nhất).
  - Nút "Chạm NFC / Lưu danh bạ vào điện thoại": Khung bo tròn chữ Trắng `#FFFFFF`.
- **Thông tin Giới thiệu Doanh nghiệp**:
  - Tên Công ty, Lĩnh vực kinh doanh, Quy mô nhân sự, Trụ sở chính: Toàn bộ chữ Trắng `#FFFFFF` trên nền Đen `#000000`.
  - Hotline, Email, Website, Bản đồ Google Maps: Khối card viền `#18181B`, chữ Trắng.
- **Thư viện Hình ảnh Sản phẩm & Hoạt động Doanh nghiệp**: Hiển thị lưới 3 cột, khung viền `#18181B`.

---

#### Màn hình 13: Lịch Sự Kiện & Quét Mã QR Điểm Danh (Mobile Events & Check-in)
- **Màu nền**: Đen `#000000`.
- **Lịch Sự Kiện Trực Quan**:
  - Thanh trượt ngày trong tuần/tháng: Nền Đen `#000000`. Ngày có sự kiện được đánh dấu bằng vòng tròn Gradient Tím - Hồng.
- **Chi Tiết Sự Kiện Đã Đăng Ký**:
  - Thời gian, Địa điểm tổ chức, Diễn giả chính, Lịch trình chương trình: Chữ Trắng `#FFFFFF`.
  - Nút "MỞ MÃ QR CHECK-IN TẠI QUẦY": Nút bấm lớn toàn chiều rộng, nền Gradient Tím - Hồng (`#7C2D82` ➔ `#D61F69`), chữ Trắng. Khi bấm sẽ hiển thị mã QR cá nhân để quầy lễ tân quét xác nhận điểm danh tự động.
  - Tình trạng điểm danh: Badge viền Gradient Tím - Hồng chữ Trắng ("Đã điểm danh lúc 08:35").

---

#### Màn hình 14: Lớp Học & Đào Tạo Trực Tuyến (Mobile Training Modules)
- **Màu nền**: Đen `#000000`.
- **Danh sách Chuyên Đề Đào Tạo**:
  - Thẻ khóa học: Nền Đen `#000000`, viền `#18181B`, chữ Trắng.
  - Tên khóa học, thời lượng, số video: Chữ Trắng.
- **Giao diện Xem Video Bài Giảng & Học Trực Tuyến**:
  - Trình phát video chuyên nghiệp: Khung phát nền đen, nút Play màu Trắng viền Tím `#7C2D82`.
  - Thanh tiến độ học tập: Vạch chạy dải Gradient Tím - Hồng (`#7C2D82` ➔ `#D61F69`).
  - Danh mục bài học tiếp theo: Nền `#18181B`, chữ Trắng.
  - Tài liệu bài tập / Slide đính kèm: Nút tải file chữ Trắng trên nền Đen viền Tím.

---

#### Màn hình 15: Kho Học Liệu & Thư Viện Tài Liệu Doanh Nghiệp (Mobile Document Vault)
- **Màu nền**: Đen `#000000`.
- **Bộ lọc chuyên mục**: Kỷ yếu hội viên, Pháp lý doanh nghiệp, Quản trị nhân sự, Tài chính - Kế toán. Các pill lọc khi chọn sẽ có nền Gradient Tím - Hồng chữ Trắng.
- **Danh sách Tệp Tin Học Liệu**:
  - Thẻ tệp tin: Nền Đen `#000000`, viền `#18181B`.
  - Tên file & Mô tả ngắn: Chữ Trắng `#FFFFFF`.
  - Định dạng file (PDF / DOCX) & Dung lượng: Chữ Trắng mờ 70%.
  - Nút "Đọc ngay" & "Lưu về máy": Chữ Trắng trên nền `#18181B` viền Tím `#7C2D82`.

---

#### Màn hình 16: Đóng Hội Phí & Cổng Thanh Toán MoMo / VNPay (Mobile Dues Payment)
- **Màu nền**: Đen `#000000`.
- **Thẻ Tình Trạng Hội Phí Hội Viên**:
  - Nền dải Gradient Tím - Hồng (`#7C2D82` ➔ `#D61F69`).
  - Số tiền hội phí kỳ hiện tại: Chữ Trắng `#FFFFFF` cỡ lớn `text-2xl font-black`.
  - Hạn thanh toán: Chữ Trắng `#FFFFFF`.
- **Lựa Chọn Cổng Thanh Toán Tự Động**:
  - Lựa chọn 1: Cổng MoMo (Ví MoMo / Quét mã MoMo QR).
  - Lựa chọn 2: Cổng VNPay (Thẻ ATM, Visa/Mastercard, VNPay QR).
  - Lựa chọn 3: Chuyển khoản ngân hàng VietQR tự động khớp lệnh.
  - Khung chọn cổng thanh toán: Nền Đen `#000000`, viền `#18181B` (khi chọn phát sáng viền Hồng `#D61F69`), chữ Trắng.
- **Nút "TIẾN HÀNH THANH TOÁN"**: Nền Gradient Tím - Hồng, chữ Trắng in hoa.
- **Lịch Sử Đóng Quỹ Đã Xác Nhận**: Danh sách biên lai nộp tiền kèm mã giao dịch thời gian thực chữ Trắng, viền `#18181B`.

---

#### Màn hình 17: Bảng Xếp Hạng & Vinh Danh Doanh Nhân (Leaderboard & Recognition)
- **Màu nền**: Đen `#000000`.
- **Bục Vinh Danh Top 3 Doanh Nhân Xuất Sắc Nhất Tháng**:
  - Hạng 1 (Chính giữa): Khung bục cao nhất viền Gradient Tím - Hồng phát sáng, avatar lớn viền Gradient Tím - Hồng, chữ Trắng font-bold, điểm gắn kết cao nhất.
  - Hạng 2 & Hạng 3: Bục thấp hơn hai bên, viền Tím `#7C2D82`, chữ Trắng.
- **Danh Sách Xếp Hạng Gắn Kết (4 - 50)**:
  - Từng dòng thành viên: Nền Đen `#000000`, viền dưới `#18181B`.
  - Số thứ tự: Chữ Trắng font-bold.
  - Tên hội viên & Doanh nghiệp: Chữ Trắng `#FFFFFF`.
  - Điểm hoạt động tích lũy (Tham gia sự kiện, hoàn thành đào tạo, đóng hội phí đúng hạn): Chữ Trắng trên pill viền Tím `#7C2D82`.

---

#### Màn hình 18: Trung Tâm Thông Báo (Notifications Center)
- **Màu nền**: Đen `#000000`.
- **Bộ lọc thông báo**: Tất cả, Sự kiện, Lớp học, Tài chính/Hội phí, Thông báo chung từ BĐH.
- **Danh sách Thông Báo**:
  - Thông báo chưa đọc: Nền `#18181B`, chấm tròn nhỏ màu Hồng `#D61F69`, tiêu đề chữ Trắng font-bold.
  - Thông báo đã đọc: Nền Đen `#000000`, viền `#18181B`, chữ Trắng mờ 70%.
  - Thời gian thông báo: Chữ Trắng mờ 50%.
- **Thao tác**: Bấm vào thông báo sẽ điều hướng trực tiếp đến màn hình chi tiết tương ứng (Sự kiện, Lớp học, Biên lai).

---

## IV. BẢNG TỔNG KẾT MÃ MÀU THEO COMPONENT

| Thành phần giao diện (UI Component) | Màu nền (Background) | Màu viền (Border) | Màu chữ (Text) | Hiệu ứng đặc biệt |
|:---|:---:|:---:|:---:|:---|
| **Nền ứng dụng toàn hệ thống** | `#000000` (Đen) | Không | `#FFFFFF` (Trắng) | Quầng sáng tím hồng lan tỏa nhẹ |
| **Thanh bên điều hướng (Sidebar)** | `#000000` (Đen) | `#18181B` | `#FFFFFF` (Trắng) | Item active có quầng tím hồng mờ |
| **Thẻ thông tin chính (Card)** | `#000000` (Đen) | `#18181B` | `#FFFFFF` (Trắng) | Bo góc `rounded-xl` (12px) |
| **Nút bấm chính (Primary CTA)** | `linear-gradient(135deg, #7C2D82 0%, #D61F69 100%)` | `#7C2D82` | `#FFFFFF` (Trắng đậm) | Đổ bóng mờ hồng `rgba(214, 31, 105, 0.4)` |
| **Nút bấm phụ (Secondary Button)** | `#000000` (Đen) | `#18181B` | `#FFFFFF` (Trắng) | Hover đổi viền thành `#7C2D82` |
| **Ô nhập liệu (Input / Select)** | `#18181B` (Đen xám) | `#18181B` | `#FFFFFF` (Trắng) | Focus viền phát sáng `#D61F69` |
| **Huy hiệu trạng thái (Badge)** | `#000000` (Đen) | `#7C2D82` hoặc `#D61F69` | `#FFFFFF` (Trắng) | Bo tròn `rounded-full` |
| **Thẻ Hội Viên VIP / Danh thiếp số** | `linear-gradient(135deg, #7C2D82 0%, #D61F69 100%)` | `#D61F69` | `#FFFFFF` (Trắng) | Chiều sâu ánh sáng thương hiệu |
| **Bảng dữ liệu (Data Table)** | `#000000` (Đen) | `#18181B` | `#FFFFFF` (Trắng) | Hàng tiêu đề nền `#18181B` |
| **Đường phân cách (Divider)** | Trong suốt | `#18181B` (1px) | Không | Sắc nét, tinh tế |

---
**Tài liệu này là quy chuẩn thiết kế duy nhất có hiệu lực toàn diện cho hệ sinh thái CEO HN10.**  
*Mọi thay đổi giao diện hoặc bổ sung tính năng mới trong tương lai bắt buộc phải tuân thủ nghiêm ngặt hệ thống 5 màu độc quyền này.*
