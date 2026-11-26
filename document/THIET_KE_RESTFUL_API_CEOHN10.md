# ĐẶC TẢ GIAO DIỆN LẬP TRÌNH RESTFUL API HỆ THỐNG CEO HN10

**Phiên bản:** 3.0  
**Base URL:** `/api` (Production: `https://ceohn10.viconnect.vn/api` & `https://crm.ceohn10.viconnect.vn/api`)  
**Giao thức Realtime:** Socket.IO (`/socket.io`)  

---

## 1. QUY CHUẨN CHUNG
- **Xác thực:** JWT Bearer Token (`Authorization: Bearer <token>`) hoặc Cookie (`sb-access-token`, `vibe_token`, `access_token`). Các API công khai (Thư mời RSVP, Kiosk Check-in, SePay Webhook) dùng `OptionalJwtAuthGuard` hoặc Public Route.
- **Định dạng dữ liệu:** JSON UTF-8 (`Content-Type: application/json`), Upload file sử dụng `multipart/form-data` đẩy thẳng lên MinIO.
- **Mã phản hồi chuẩn:** `200/201` (Thành công), `400` (Lỗi dữ liệu / Trùng đăng ký / Biểu quyết đã đóng), `401` (Chưa đăng nhập), `403` (Sai quyền Role / Sai cổng đăng nhập), `404` (Không tìm thấy), `500` (Lỗi máy chủ).

---

## 2. ĐẶC TẢ CHI TIẾT CÁC NHÓM ENDPOINT

### 2.1. Xác thực & Quản lý Tài khoản (`/auth`, `/users`, `/rbac`)
| Method | Endpoint | Guard / Quyền | Mô tả & Payload chính |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Đăng nhập (`{ email, password, appScope }`). Chặn `app_only` vào CRM |
| `GET` | `/api/users/me` | `JwtAuthGuard` | Lấy thông tin người dùng hiện tại, role, ban chuyên trách |
| `GET` | `/api/users` | Admin | Danh sách tài khoản kèm cột `targetSystem` (Hệ thống / App / Cả hai) |
| `PATCH` | `/api/users/:id/target-system` | Admin | Cập nhật quyền vào cổng CRM / App / Cả hai |
| `DELETE` | `/api/users/:id` | Admin | Xóa tài khoản đăng nhập nhưng **bảo toàn hồ sơ Học viên** (`members.user_id = NULL`) |
| `GET/PUT` | `/api/admin/permission-matrix` | Platform Admin | Đọc & cập nhật ma trận phân quyền 9 Roles |

### 2.2. Học viên, Giảng viên & Trường động (`/members`, `/dynamic-fields`, `/dynamic-import`)
| Method | Endpoint | Guard / Quyền | Mô tả & Payload chính |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/members/me` | `JwtAuthGuard` | Hồ sơ học viên đang đăng nhập trên App |
| `GET` | `/api/members` | `OptionalJwt` | Danh sách học viên / danh bạ CEO |
| `POST` | `/api/members` | Admin / Thư ký | Tạo học viên mới (mặc định tạo tài khoản `app_only`) |
| `DELETE` | `/api/members/:id` | Admin | Xóa cứng học viên **và xóa kèm tài khoản đăng nhập theo email** |
| `POST` | `/api/dynamic-import/commit` | Admin / Thư ký | Import Excel/CSV/Word/PDF theo module, tự sinh cột động |
| `GET/POST` | `/api/dynamic-fields/schema/:entityType` | Admin / Ban CN | Lấy & thêm trường thông tin động cho Học viên / Sự kiện |

### 2.3. Sự kiện, Thư mời, RSVP, Thanh toán & Check-in (`/events`, `/payment`, `/webhooks`)
| Method | Endpoint | Guard / Quyền | Mô tả & Payload chính |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | `OptionalJwt` | Danh sách toàn bộ sự kiện |
| `GET` | `/api/events/my-events` | `OptionalJwt` | Danh sách sự kiện hiển thị trên App CEOHN10 |
| `POST` | `/api/events` | Admin / Ban SK | Tạo sự kiện (`parts`, `tickets`, `customFields`, `reserveCapacity`, `allowWalkinCheckin`) |
| `PATCH` | `/api/events/:id` | Admin / Ban SK | Cập nhật sự kiện; khi chuyển `completed`/`cancelled` tự động đóng `polls` gắn kèm |
| `DELETE` | `/api/events/:id` | Admin | Xóa sự kiện & dọn dữ liệu liên quan (`feed_posts`, `event_invitation_guests`, thông báo) |
| `GET` | `/api/events/:id/invitation-guests` | `JwtAuthGuard` | Lấy danh sách khách mời thư mời của sự kiện |
| `POST` | `/api/events/:id/invitation-guests` | `JwtAuthGuard` + **Trưởng ban TT / SK&HC / Admin** | Lưu danh sách & phân loại `guestType` (`invited_guest` 0đ vs `other_participant` tính phí) |
| `GET` | `/api/events/:id/public-invitation?slug=...` | Public | Lấy thông tin thư mời công khai, giá vé từng phần & `guest.guestType` |
| `POST` | `/api/events/:id/public-rsvp` | Public | Gửi xác nhận tham dự hoặc từ chối; **kiểm tra trùng Email / Họ tên + SĐT**; trả về `regId` + VietQR SePay nếu `totalFee > 0` |
| `GET` | `/api/events/registrations/:regId/payment-status` | Public | Auto-polling 3s/lần kiểm tra trạng thái `free` / `pending` / `paid` |
| `POST` | `/api/webhooks/sepay` | Webhook Secret | Tiếp nhận biến động số dư SePay (`CEO1983_EVT_<regId>`), kích hoạt vé `paid` & cộng Quỹ Ban Sự kiện & Hậu cần |
| `POST` | `/api/events/:id/ticket-checkin` | BTC / Truyền thông | Quét mã QR check-in (gắn nhãn Đúng giờ / Đi muộn, hỗ trợ Walk-in vé dự phòng) |
| `POST` | `/api/events/:id/ticket-checkout` | BTC / Truyền thông | Quét mã QR check-out, cập nhật `checked_out_at` & gửi email cảm ơn |

**Ví dụ Response `POST /api/events/:id/public-rsvp` (Khách tham gia có phí):**
```json
{
  "ok": true,
  "regId": "REG-849201-512",
  "attendMode": "full",
  "paymentStatus": "pending",
  "totalFee": 500000,
  "transferContent": "CEO1983_EVT_REG-849201-512",
  "vietQrUrl": "https://img.vietqr.io/image/MB-888809012026-compact2.png?amount=500000&addInfo=CEO1983_EVT_REG-849201-512"
}
```

### 2.4. Tài chính Quỹ Tổng, 7 Ban & Tài trợ (`/admin`, `/finance-init`, `/sponsors`)
| Method | Endpoint | Guard / Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/funds-overview` | Admin / Tài chính | Số dư Quỹ Tổng & 7 Quỹ Ban chuyên trách thời gian thực |
| `GET/POST` | `/api/admin/transactions` | Admin / Tài chính | Sổ quỹ thu/chi chi tiết |
| `POST` | `/api/admin/expense-requests` | Trưởng Ban | Tạo đề xuất chi theo Ban; duyệt 2 cấp (`/approve-finance`, `/approve-leader`, `/pay`) |
| `GET/POST` | `/api/sponsors` | Admin / Đối ngoại | Quản lý Nhà tài trợ & Gói tài trợ (`/sponsors/packages`) |

### 2.5. Biểu quyết & Bầu cử (`/voting`)
| Method | Endpoint | Guard / Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/voting/polls` | `OptionalJwt` | Danh sách biểu quyết (tự động đóng nếu sự kiện gắn kèm đã kết thúc) kèm `myVote` & `myVoteOptionTitle` |
| `POST` | `/api/voting/polls` | Admin | Tạo biểu quyết mới (`title`, `description`, `eventId`, `options`) + gửi Email & App notification |
| `POST` | `/api/voting/polls/:id/vote` | `JwtAuthGuard` | Bình chọn (`{ optionId, sourceApp }`); trả về `voteHistorySummary` để lưu lịch sử học viên |
| `POST` | `/api/voting/polls/:id/close` | Admin | Đóng biểu quyết thủ công & công bố kết quả |
| `DELETE` | `/api/voting/polls/:id` | Admin | Xóa biểu quyết theo `::text` kèm toàn bộ phiếu bầu & thông báo liên quan |

### 2.6. Đào tạo, Gắn kết B2B & Lưu trữ MinIO (`/trainings`, `/network`, `/meetings`, `/upload`)
| Method | Endpoint | Guard / Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET/POST` | `/api/trainings` | `OptionalJwt` / Admin | Danh sách & quản lý 30 chuyên đề lớp học |
| `GET/POST` | `/api/network/connections` | `JwtAuthGuard` | Kết nối B2B giữa các học viên |
| `GET/POST` | `/api/meetings` | `JwtAuthGuard` | Đặt lịch & quản lý cuộc hẹn gặp B2B |
| `POST` | `/api/upload` | `JwtAuthGuard` | Upload ảnh/video/tài liệu trực tiếp lên **MinIO** (trả về URL MinIO chuẩn, không lưu local) |
