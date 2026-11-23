# KIẾN TRÚC PHÂN RÃ THEO PHÂN HỆ MODULE - CEO HN10 ECOSYSTEM
*Phiên bản: 1.0 - Hướng dẫn Trích xuất và Chuyển giao Độc lập Từng Phân Hệ cho Khách Hàng*

---

## 1. TỔNG QUAN CÁC PHÂN HỆ MODULE ĐỘC LẬP
Hệ sinh thái CEO HN10 được tổ chức thành 4 phân hệ module nghiệp vụ có tính kết dính cao (High Cohesion) và phụ thuộc lỏng (Loose Coupling):

```
ceoHN10_project/
├── modules/
│   ├── module-events/          # [PHÂN HỆ 1] Quản Lý Sự Kiện, Check-in & Vé Điện Tử
│   ├── module-members/         # [PHÂN HỆ 2] Quản Lý Hội Viên & Danh Bạ Doanh Nhân
│   ├── module-finance/         # [PHÂN HỆ 3] Quản Lý Quỹ Tài Chính & SePay VietQR
│   └── module-communications/  # [PHÂN HỆ 4] Truyền Thông Đa Kênh, Mail HTML & Zalo OA
```

---

## 2. CHI TIẾT TỪNG PHÂN HỆ & DANH MỤC TỆP NGUỒN

### 🎟️ PHÂN HỆ 1: QUẢN LÝ SỰ KIỆN, CHECK-IN & VÉ ĐIỆN TỬ (`module-events`)
- **Nghiệp vụ cốt lõi**:
  - Tạo sự kiện, quản lý Nhà tài trợ tùy chọn.
  - Form Builder cấu hình động các trường đăng ký và check-in.
  - Import danh sách 3 định dạng (`.docx`, `.xlsx`, `.pdf`) kèm Dynamic DDL Database tự động thêm cột và cô lập theo sự kiện.
  - Cổng Check-in 2 mã QR riêng biệt (Khách mới tại cửa vs Đại biểu đã đăng ký từ trước) kèm giải mã ảnh QR.
  - Quản lý trạng thái thanh toán inline toggle trên từng dòng, tự động hạch toán Quỹ CRM.
  - Vòng quay may mắn bốc thăm trúng thưởng hình tròn Canvas (lấy 100% từ người đã check-in).
  - Chụp ảnh trực tiếp trong sự kiện & Đồng bộ Quản lý tài liệu.
  - Biểu quyết chọn cử tri từ danh sách đã check-in.
  - Đánh giá sau sự kiện qua mã QR & Gửi Recap Email / Zalo OA tự động.
- **Tệp Backend**:
  - `src/events/events.module.ts`
  - `src/events/events.controller.ts`
  - `src/events/checkin.controller.ts`
  - `src/events/events.service.ts`
  - `src/events/sub-services/events-checkin.service.ts`
  - `src/events/sub-services/events-media.service.ts`
  - `src/events/sub-services/events-feedback.service.ts`
- **Tệp Frontend**:
  - `src/routes/events.index.tsx`
  - `src/routes/event-registrations.tsx`
  - `src/routes/event-checkin.tsx`
  - `src/routes/guest-event-register.$eventId.tsx`
  - `src/routes/guest-event-feedback.$eventId.tsx`
  - `src/components/events/EventAttendeesImportModal.tsx`
  - `src/components/events/EventCheckinGatekeeperModal.tsx`
  - `src/components/events/EventWheelOfFortuneModal.tsx`
  - `src/components/events/EventLivePhotoGalleryModal.tsx`
  - `src/components/events/EventFeedbackModal.tsx`
  - `src/components/events/EventFormConfigModal.tsx`

---

### 👥 PHÂN HỆ 2: HỘI VIÊN & DANH BẠ DOANH NHÂN (`module-members`)
- **Nghiệp vụ cốt lõi**:
  - Hồ sơ học viên / doanh nhân CEO HN10, thông tin doanh nghiệp, ngành nghề kết nối B2B.
  - Phê duyệt hội viên mới, phân cấp hội viên (Kim Cương, Vàng, Bạc, Đồng).
  - Thẻ danh thiếp điện tử (Digital Business Card) tích hợp mã QR cá nhân và NFC.
- **Tệp Backend**: `src/members/`, `src/connect-app/`
- **Tệp Frontend**: `src/routes/members.*`, `src/routes/connect-app.*`, `src/components/business-connect/`

---

### 💳 PHÂN HỆ 3: QUỸ TÀI CHÍNH & SEPAY VIETQR (`module-finance`)
- **Nghiệp vụ cốt lõi**:
  - Thu chi, sổ quỹ tài chính CLB CEO HN10, báo cáo dòng tiền và doanh thu từng sự kiện.
  - Tích hợp SePay VietQR (MBBank `198300000000`), webhook tự động gạch nợ học phí, niên liễm và vé sự kiện.
- **Tệp Backend**: `src/invoices/`, `src/admin/admin.service.ts` (funds overview), `src/webhooks/`
- **Tệp Frontend**: `src/routes/funds-overview.tsx`, `src/routes/invoices.tsx`, `src/components/dashboard/ExecutiveDashboard.tsx`

---

### 📢 PHÂN HỆ 4: TRUYỀN THÔNG ĐA KÊNH & ZALO OA (`module-communications`)
- **Nghiệp vụ cốt lõi**:
  - Studio thiết kế thư mời sự kiện, poster quảng bá, chứng nhận hoàn thành.
  - Quản lý mẫu template thông báo động dạng Tree Menu.
  - Gửi Email HTML trang trọng và thông báo Zalo OA tích xanh.
- **Tệp Backend**: `src/mail/`, `src/zalo/`, `src/notifications/`
- **Tệp Frontend**: `src/components/templates/`, `src/components/notifications/DynamicNotificationTemplateManager.tsx`

---

## 3. LỆNH TRÍCH XUẤT MODULE ĐỘC LẬP CHO KHÁCH HÀNG

Chạy lệnh trích xuất module mong muốn:
```bash
# Trích xuất riêng module Sự kiện & Check-in:
node scripts/export-module.mjs --module=events --out=dist-modules/module-events

# Trích xuất riêng module Quỹ tài chính & SePay:
node scripts/export-module.mjs --module=finance --out=dist-modules/module-finance
```

Thư mục kết quả trong `dist-modules/<module>` là một gói mã nguồn hoàn chỉnh có `package.json`, `.env.example`, tài liệu `README.md` và các file test data đi kèm, khách hàng chỉ cần chạy:
```bash
cd dist-modules/module-events
npm install
npm run dev
```
Giao diện và API của module sẽ chạy độc lập và phục vụ chuẩn xác nghiệp vụ mà không cần toàn bộ source code của các phân hệ khác!
