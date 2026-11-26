# ĐẶC TẢ YÊU CẦU PHẦN MỀM HỆ THỐNG CEO HN10 (SRS — IEEE 830)

**Phiên bản:** 3.0  
**Ngày cập nhật:** 26/11/2026  
**Hệ thống:** Nền tảng Quản trị Web CRM & Ứng dụng Di động CLB Doanh Nhân CEO HN10  

---

## 1. GIỚI THIỆU & KIẾN TRÚC TỔNG THỂ

### 1.1. Mục đích tài liệu
Tài liệu mô tả chi tiết yêu cầu chức năng, luồng xử lý từng **Use Case** (tác nhân, điều kiện tiên quyết, luồng chính, luồng rẽ nhánh, ngoại lệ, hậu điều kiện) và các yêu cầu phi chức năng của hệ thống CEO HN10.

### 1.2. Kiến trúc triển khai
- **Frontend Web CRM & Mobile App (Monorepo TanStack Start + React 19 + Tailwind CSS)**: Đóng gói 2 container độc lập theo biến `VITE_APP_SCOPE` (`crm_platform` cổng `5022` và `association_app` cổng `5020`).
- **Backend API (NestJS 3 tầng: Controller → Service → Repository + Prisma)**: Cổng `5021` (App) và `5023` (CRM), sử dụng chung PostgreSQL Production `113.20.107.184:6432/ceohn10_project` trên server và `127.0.0.1:5432/ceohn10_project` ở Localhost.
- **Lưu trữ Media (MinIO Object Storage)**: Lưu trữ tập trung 100% ảnh, video, tài liệu (không lưu cục bộ trên ổ đĩa container).

---

## 2. ĐẶC TẢ CHI TIẾT CÁC USE CASES (LUỒNG XỬ LÝ TỪNG CASE)

---

### UC-AUTH-01: Đăng nhập & Phân tách cổng CRM vs App CEOHN10
- **Tác nhân:** Tất cả người dùng (Admin, Ban Điều Hành, Trưởng Ban, Giảng viên, Học viên).
- **Điều kiện tiên quyết:** Tài khoản tồn tại trong `public.vione_users`.
- **Luồng sự kiện chính:**
  1. Người dùng nhập Email/Mật khẩu tại `/auth` (Web CRM) hoặc `/association/login` (Mobile App).
  2. Frontend gửi `POST /api/auth/login` kèm `appScope` (`crm_platform` hoặc `association_app`).
  3. Backend xác thực mật khẩu, truy vấn bảng `user_roles` và kiểm tra cột quyền cổng (`target_system`: `app_only`, `crm_only`, `both`).
  4. Nếu `appScope === 'crm_platform'` mà tài khoản chỉ có quyền `app_only` (như Học viên/Giảng viên mặc định), Backend trả lỗi `403 Forbidden`: *"Tài khoản chỉ có quyền đăng nhập App CEOHN10"*.
  5. Nếu hợp lệ, Backend trả JWT Access Token; Frontend đồng bộ cookie (`sb-access-token`, `vibe_token`, `access_token`) và điều hướng vào màn hình chính.
- **Luồng ngoại lệ:** Sai mật khẩu hoặc tài khoản bị vô hiệu hóa (`is_active = false`) → trả `401 Unauthorized` và giữ nguyên màn hình đăng nhập.

---

### UC-MEM-01: Quản lý Học viên, Thêm trường thông tin & Import File động
- **Tác nhân:** Platform Admin, Admin, Ban Thư ký, Trưởng Ban.
- **Điều kiện tiên quyết:** Tài khoản có quyền vào Web CRM (`/members`).
- **Luồng sự kiện chính (Thêm / Sửa Học viên):**
  1. Tại `/members`, người dùng nhấn **Thêm Học viên** hoặc **Import File** (1 nút duy nhất).
  2. Nếu **Import File** (`.xlsx`, `.xls`, `.csv`, `.docx`, `.pdf`): hệ thống đọc tiêu đề cột trong file, tự động ánh xạ các cột chuẩn (`full_name`, `email`, `phone`, `company_name`, `position`, `department`) và tự động sinh các cột bổ sung vào `dynamic_form_fields` + lưu giá trị vào `custom_data` JSONB.
  3. Khi tạo mới học viên, hệ thống tự động tạo tài khoản đăng nhập tương ứng ở chế độ `app_only` (chỉ đăng nhập App CEOHN10).
  4. Người quản trị có thể bấm nút **Thêm trường thông tin** để khai báo thêm trường động (Text, Number, Date, Select...) cho bảng Học viên.
- **Hậu điều kiện:** Dữ liệu Học viên được lưu vào `public.members`, bảng hiển thị đầy đủ các cột động mới sinh.

---

### UC-MEM-02: Xóa Học viên vs Xóa Tài khoản (Quy tắc bảo toàn chéo)
- **Tác nhân:** Platform Admin, Admin.
- **Luồng A — Xóa Học viên tại `/members`:**
  1. Quản trị viên chọn **Xóa** một học viên.
  2. Backend xóa bản ghi trong `public.members` đồng thời tìm và xóa cứng tài khoản tương ứng trong `public.vione_users` & `public.user_roles` theo `email` / `user_id`.
- **Luồng B — Xóa Tài khoản tại `/account-settings`:**
  1. Quản trị viên chọn **Xóa tài khoản** trên bảng Tài khoản (nơi có cột **Quyền vào: Hệ thống CRM / App / Cả hai**).
  2. Backend đặt `public.members.user_id = NULL` trước, sau đó mới xóa `vione_users` và `user_roles`.
  3. **Kết quả:** Tài khoản bị xóa khỏi danh sách đăng nhập nhưng hồ sơ Học viên trên màn `/members` vẫn được giữ nguyên vẹn.

---

### UC-EVT-01: Khởi tạo Sự kiện đa phần, Hạng vé & Sơ đồ chỗ ngồi (`EventWizard`)
- **Tác nhân:** Platform Admin, Admin, Trưởng ban Sự kiện & Hậu cần.
- **Điều kiện tiên quyết:** Đang đăng nhập tại `/events` trên Web CRM.
- **Luồng sự kiện chính:**
  1. **Bước 1 — Thông tin chung & Cấu hình các Phần (`parts`)**:
     - Nhập Tên sự kiện, Ngày tổ chức, Khung giờ, Địa điểm, Tên Hội trường (`venueName`), và **Tổng sức chứa** (VD: `200` vé).
     - Cấu hình các phần của sự kiện (VD: *Phần 1: Lễ Khai Giảng — Miễn phí*, *Phần 2: Dự Tiệc — Có phí*), thêm các trường động cho form đăng ký nếu cần.
  2. **Bước 2 — Thiết lập Hạng vé & Sơ đồ chỗ ngồi**:
     - Hệ thống tự nhận diện phần nào Có phí / Miễn phí từ Bước 1, hiển thị thanh đối chiếu: *Sức chứa Bước 1 (200 vé) vs Tổng vé đã nhập*.
     - Hệ thống **không điền sẵn** hạng vé hay số lượng vé mẫu; người tạo bấm **Thêm vé cho: `<Tên phần>`** và tự nhập Tên loại vé (VD: VIP, Tiêu chuẩn), Giá vé (khóa 0đ nếu phần miễn phí, bắt buộc >0đ nếu phần có phí), Số lượng vé.
     - **Sơ đồ chỗ ngồi**: Trước khi có loại vé và số lượng > 0, sơ đồ hiển thị trạng thái trống. Ngay khi người tạo nhập tên vé và số lượng > 0 (dùng `useDeferredValue` để không bị đơ/giật), sơ đồ chỗ ngồi tự động sinh đúng số ghế và phân khu theo từng phần/hạng vé.
  3. **Bước 2b — Luồng rẽ nhánh Vượt sức chứa (Vé dự phòng Check-in)**:
     - Khi nhấn **Tiếp tục**, nếu `Tổng vé đã nhập > Sức chứa Bước 1`, hệ thống hiển thị hộp thoại xác nhận: *"Tổng số vé vượt X vé so với Bước 1. Bạn có muốn tạo thêm X vé dự phòng cho khách đến check-in chưa đăng ký qua form không?"*
     - **Đồng ý:** Hệ thống bật `allowWalkinCheckin = true`, lưu `reserveCapacity = X`, cộng thêm vào sức chứa và chuyển sang Bước 3.
     - **Từ chối:** Giữ tại Bước 2 để điều chỉnh lại số lượng vé.
  4. **Bước 3 & 4 — QR Check-in, Nhà tài trợ & Hoàn tất**:
     - Chọn trường dữ liệu mã hóa QR, gắn nhà tài trợ/giải thưởng, nhấn **Tạo sự kiện** (`POST /api/events`).
- **Hậu điều kiện:** Lưu bản ghi vào `public.events`, `public.event_ticket_types`, và lưu sơ đồ khu vực ghế.

---

### UC-EVT-02: Lập Thư mời Xám–Trắng Luxury & Phân loại Khách mời (Theo Role)
- **Tác nhân:** **Trưởng ban Truyền thông**, **Trưởng ban Sự kiện & Hậu cần**, hoặc **Admin / Platform Admin**.
- **Điều kiện tiên quyết:** Sự kiện đã được tạo; truy cập chi tiết sự kiện (`/events/$eventId`) → bấm nút **Mời đa kênh / Thư mời**.
- **Luồng sự kiện chính:**
  1. Người dùng tùy chỉnh giao diện Thư mời Xám–Trắng Luxury (màu nền, màu chữ, kiểu chữ, ảnh nền thành phố upload lên MinIO).
  2. Import danh sách khách mời từ Excel/CSV/Word hoặc chọn từ danh sách Học viên / Giảng viên đang dùng App → sinh link cá nhân hóa `/invitation/$eventId#<slug>`.
  3. **Phân loại đối tượng vé (Kiểm tra Role chặt chẽ)**:
     - Trên từng khách mời, người dùng có role **Trưởng ban Truyền thông**, **Trưởng ban Sự kiện & Hậu cần** hoặc **Admin** chọn phân loại:
       - `invited_guest`: **Khách mời (0đ — Miễn phí theo thư mời)**.
       - `other_participant`: **Khách tham gia sự kiện (Tính phí theo các phần/hạng vé)**.
     - Backend kiểm tra role qua `canUserClassifyInvitationGuests(actor)` tại `POST /api/events/:id/invitation-guests`; nếu không đúng role sẽ trả `403 Forbidden`.
  4. Bấm **Gửi Email hàng loạt** hoặc copy link `#<slug>` gửi qua Zalo.
- **Hậu điều kiện:** Lưu danh sách vào `public.event_invitation_guests` kèm `guest_type`.

---

### UC-EVT-03: Khách mở Thư mời, Đăng ký RSVP, Chống trùng & Thanh toán SePay
- **Tác nhân:** Khách mời / Khách tham gia sự kiện (truy cập công khai không cần đăng nhập).
- **Điều kiện tiên quyết:** Khách mở URL `/invitation/$eventId` hoặc `/invitation/$eventId#<slug>`.
- **Luồng sự kiện chính:**
  1. Frontend gọi `GET /api/events/:id/public-invitation?slug=...` lấy thông tin sự kiện, các phần (`parts`), bảng giá vé (`tickets`), cấu hình SePay và phân loại `guest.guestType`.
  2. Khách nhấn **Xác nhận tham dự**. Modal hiển thị đối tượng vé **chỉ đọc** (khách không được tự đổi):
     - Nếu `guestType === 'invited_guest'`: hiện badge **Vé Khách mời — Miễn phí (0đ)**.
     - Nếu `guestType === 'other_participant'` (hoặc không có slug): hiện badge **Khách tham gia sự kiện** kèm bảng giá vé từng phần.
  3. Khách nhập đầy đủ **Họ tên, Email, Số điện thoại**, chọn **Tham dự 1 phần / Toàn bộ chương trình**, và nhập số lượng + thông tin người đi cùng.
  4. Frontend gửi `POST /api/events/:id/public-rsvp`.
  5. **Kiểm tra trùng lặp ở Backend**:
     - Backend kiểm tra trong `public.event_registrations` (cùng `event_id`, `status NOT IN ('cancelled', 'declined')`): nếu trùng **Email** hoặc trùng **Họ tên + Số điện thoại** → trả `400 Bad Request` chặn đăng ký lần 2.
  6. **Khởi tạo vé & Thanh toán**:
     - Backend ghi vào `public.event_registrations` với mã `REG-...`.
     - **Trường hợp 1 (Tổng tiền = 0đ):** Đặt `payment_status = 'free'`, `status = 'confirmed'`, cấp ngay **E-Ticket QR** trên màn hình và gửi Email kèm QR.
     - **Trường hợp 2 (Tổng tiền > 0đ):** Đặt `payment_status = 'pending'`, `status = 'pending'`, sinh ảnh **VietQR SePay** với nội dung `CEO1983_EVT_<regId>`. Frontend tự động gọi `GET /api/events/registrations/:regId/payment-status` mỗi 3 giây. Khi Webhook SePay (`POST /api/webhooks/sepay`) khớp giao dịch: Backend đổi `payment_status = 'paid'`, `status = 'confirmed'`, hạch toán tự động vào **Quỹ Ban Sự kiện & Hậu cần**, và màn hình khách tự chuyển sang thẻ **E-Ticket QR**.
- **Luồng rẽ nhánh — Từ chối tham dự:**
  - Khách chọn *"Rất tiếc, không thể tham dự"* → Backend lưu `status = 'declined'`, bắn thông báo tới CRM, ghi `activity_log` và hiển thị tại tab **Khách mời đã từ chối** ở `/events/$eventId`.

---

### UC-EVT-04: Check-in, Vé dự phòng Walk-in & Check-out Sự kiện
- **Tác nhân:** Ban Tổ Chức, Ban Truyền Thông, Ban Sự Kiện & Hậu Cần (hoặc Kiosk `/event-checkin`).
- **Luồng Check-in vé đã đăng ký:**
  1. Mở quét QR tại `/events/$eventId`, `/event-registrations` hoặc nút Quét QR trên App.
  2. Hệ thống giải mã đa định dạng (`JSON`, URL `?ticket=...`, chuỗi `REG-...`/`EV-...`/`TKT-...`).
  3. Kiểm tra trạng thái thanh toán (chặn nếu vé thu phí chưa `paid`) và chống quét trùng (nếu đã check-in thì báo thời gian đã quét trước đó).
  4. Đối chiếu thời gian thực với giờ bắt đầu sự kiện để gắn nhãn **Đúng giờ** hoặc **Đi muộn**, cập nhật `checked_in_at` và gửi Email xác nhận kèm vị trí ghế.
- **Luồng Walk-in (Khách chưa đăng ký qua form dùng Vé dự phòng):**
  1. Tại bàn đón tiếp khi sự kiện sắp diễn ra, BTC chọn chức năng **Đăng ký & Check-in tại quầy (Walk-in)** (hoặc quét mã Check-in Kiosk).
  2. Nếu sự kiện còn hạn mức **Vé dự phòng (`reserveCapacity`)**, hệ thống tạo bản ghi `event_registrations` (`is_walkin = true`, `registration_origin = 'walkin_checkin'`), thu tiền mặt/VietQR (nếu có phí) và đánh dấu đã check-in ngay lập tức.
- **Luồng Check-out:**
  1. Khi ra về, quét lại mã QR ở chế độ **Check-out**.
  2. Hệ thống kiểm tra bắt buộc đã check-in và chưa check-out; cập nhật `checked_out_at`, `status = 'checked_out'` và gửi Email cảm ơn kèm mốc thời gian ra về.

---

### UC-EVT-05: Quay số may mắn (Lucky Draw) & Xuất báo cáo hậu sự kiện
- **Tác nhân:** Ban Tổ Chức / Admin.
- **Luồng chính:**
  1. Tại `/voting` hoặc chi tiết sự kiện, mở **Vòng quay may mắn**, lọc tập ứng viên từ những đại biểu **đã check-in** (có thể lọc theo Chức danh / Hạng vé).
  2. Bấm quay → chọn ngẫu nhiên, lưu giải thưởng và công bố kết quả.
  3. Tại `/event-registrations`, bấm **Xuất báo cáo** chọn bộ lọc (Đã check-in, Đi muộn, Đúng giờ, Vắng mặt, Đã nộp phí...) theo 1 trong 3 định dạng: **Excel (.xlsx)**, **CSV (UTF-8 BOM)**, hoặc **Bản in PDF A4**.

---

### UC-FIN-01: Quản trị Quỹ Tổng & 7 Quỹ Ban chuyên trách
- **Tác nhân:** Admin, Ban Tài chính, Trưởng Ban chuyên trách.
- **Luồng chính:**
  1. Màn `/finance-report` hiển thị thời gian thực: **Quỹ Tổng** (số dư đầu kỳ 2.080.000.000 đ + thu - phân bổ 7 ban) và **7 Quỹ Ban chuyên trách** (trong đó Quỹ Ban Công nghệ có 20.000.000 đ *Kinh phí khai giảng*).
  2. Doanh thu vé sự kiện từ SePay tự động ghi tăng vào **Quỹ Ban Sự kiện & Hậu cần**.
  3. Trưởng Ban tạo **Đề xuất chi** → **Ban Tài chính** duyệt cấp 1 → **Chủ tịch/Admin** duyệt cấp 2 → Chi tiền và trừ tồn quỹ tương ứng.

---

### UC-VOT-01: Biểu quyết, Tự động đóng theo Sự kiện & Lịch sử Học viên
- **Tác nhân:** Admin / Ban Điều Hành (tạo/xóa/đóng biểu quyết); Học viên (bình chọn trên App).
- **Luồng sự kiện chính:**
  1. Tại `/voting`, Admin tạo biểu quyết mới, tùy chọn gắn với 1 Sự kiện (`eventId`). Hệ thống lưu `polls` + `poll_options` và gửi thông báo về **Email** + **App CEOHN10** (`business_notifications`, `member_notifications`).
  2. Trên App CEOHN10 (`/association`), khối **Biểu Quyết & Lấy Ý Kiến Hội Viên** hiển thị ngay bên dưới **Sự Kiện & Hoạt Động Tiêu Điểm**.
  3. Học viên chạm 1 lần để bỏ phiếu (`POST /api/voting/polls/:id/vote` với `sourceApp = 'association_app'`).
  4. Hệ thống ghi `poll_votes`, trả tỷ lệ phần trăm mới và lưu hiển thị dòng xác nhận lịch sử ngay trên thẻ + trong màn **Lịch sử** (`/association/history`): *"Bạn đã chọn `<lựa chọn>` tại biểu quyết `<tên>` ở sự kiện `<tên sự kiện>`"*.
  5. **Tự động đóng theo Sự kiện**: Khi sự kiện gắn kèm chuyển sang `completed` / `cancelled` (hoặc qua ngày tổ chức), hệ thống tự động cập nhật `polls.status = 'closed'`, khóa quyền bỏ phiếu mới và giữ nguyên biểu quyết trong danh mục.
  6. Khi cần xóa biểu quyết ở `/voting`, `DELETE /api/voting/polls/:id` xóa sạch `poll_votes`, `poll_options`, thông báo liên quan và `polls` theo `id::text`.

---

## 3. YÊU CẦU PHI CHỨC NĂNG (NFR)
1. **Hiệu năng UI:** Các thao tác nhập liệu trong Wizard có sơ đồ nhiều ghế phải dùng `useDeferredValue` và giới hạn render chip xem nhanh để giữ tốc độ phản hồi `< 16ms/khung hình`.
2. **An toàn Dữ liệu & Lưu trữ:** 100% file tải lên lưu tại **MinIO** (không fallback lưu đĩa local). Phân tách cứng DB Localhost (`127.0.0.1:5432`) vs Server (`113.20.107.184:6432`) ngay trong `main.ts` và `PrismaService`.
3. **Đồng bộ Schema 2 chiều:** `SchemaSyncService` tự động đảm bảo cấu trúc bảng/cột giống nhau giữa Localhost và Production mỗi lần khởi động mà không làm mất dữ liệu.
4. **Bảo mật & Triển khai:** Mọi API quản trị bảo vệ bằng `JwtAuthGuard` + RBAC; subdomain chạy HTTPS Let's Encrypt chuẩn qua Nginx Host OS, kiểm tra `nginx -t` trước khi reload.
