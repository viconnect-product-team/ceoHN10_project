# BỘ NHỚ HỆ THỐNG & QUY CHUẨN VẬN HÀNH - CEO HN10 (HANOIBA)
*Phiên bản: 6.0 - Quy chuẩn Tinh Gọn, Phân Định CSDL Local/Server & Hệ Thống UI Specs cho AI Agent*
*Lịch sử chi tiết từ v1.0 đến v12.0 được lưu trữ tại: `document/history/CHANGELOG_ARCHIVE_v1_v12.md`*

---

## 0. QUY CHUẨN CƠ SỞ DỮ LIỆU THEO MÔI TRƯỜNG (STRICT DATABASE POLICY)
- **Môi trường Test & Phát triển Cục bộ (Localhost Development)**:
  - Địa chỉ máy chủ: **`127.0.0.1:5432`** (PostgreSQL cục bộ của máy dev).
  - Tên CSDL: **`ceohn10_project`**.
  - Chuỗi kết nối: `postgresql://postgres:postgres@127.0.0.1:5432/ceohn10_project`.
- **Môi trường Server Dev / Staging / Production (Máy Chủ Chính Thức)**:
  - Địa chỉ máy chủ: **`113.20.107.184:6432`** (kết nối qua PgBouncer).
  - Tên CSDL: **`ceohn10_project`**.
  - Tài khoản / Mật khẩu: `app1` / `5^S0CEpvYwC1(#YN1UoJ`.
  - Chuỗi kết nối: `postgresql://app1:5^S0CEpvYwC1(#YN1UoJ@113.20.107.184:6432/ceohn10_project?pgbouncer=true`.
- **Nguyên tắc bất di bất dịch**:
  - Khi chạy localhost, kết nối đúng CSDL localhost `127.0.0.1:5432`. Khi deploy server chính thức, kết nối đúng `113.20.107.184:6432`. Tuyệt đối không trỏ nhầm sang IP khác (`14.225.217.232`).
  - **CẤM TUYỆT ĐỐI MOCK/FAKE DỮ LIỆU**: Khi CSDL gặp sự cố kết nối, bắt buộc phải báo lỗi chính xác, tuyệt đối không âm thầm gán dữ liệu fake.

---

## 1. CÁC QUY TẮC CỐT LÕI BẢO VỆ MÃ NGUỒN VÀ HẠ TẦNG
1. **Lệnh Cấm Git Commit & Push**: Tuyệt đối không tự ý chạy `git commit` hoặc `git push`. Toàn bộ thao tác commit/push do người dùng chủ động thực hiện.
2. **Nginx Validation Gate**: Mọi kịch bản deploy Nginx bắt buộc kiểm tra `nginx -t` đạt exit code 0 (`syntax is ok` & `test is successful`) thì mới được reload/restart.
3. **Bảo Vệ Cấu Hình DevOps Host OS**: Không tự ý ghi đè `/etc/nginx` trên máy chủ; tuân thủ cơ chế Atomic Backup (`.bak`) & Rollback.
4. **Kiểm Tra Type Check**: Mọi chỉnh sửa mã nguồn bắt buộc vượt qua `npx tsc --noEmit` đạt 0 errors (Exit code 0) ở cả FE và BE.

---

## 2. HỆ THỐNG ĐẶC TẢ GIAO DIỆN DÀNH CHO AI AGENT (UI SPECS DIRECTORY)
Trước khi chạm vào mã nguồn giao diện, AI Agent **BẮT BUỘC** phải đọc tài liệu đặc tả tương ứng trong `.agents/ui-specs/`:
- **Giao diện Mobile App CEO HN10**: Đọc [.agents/ui-specs/UI_SPEC_MOBILE_APP_CEOHN10.md](file:///d:/download/VICONNECT/CEO_VIONE_PROJECT/ceohn10_project/.agents/ui-specs/UI_SPEC_MOBILE_APP_CEOHN10.md)
  * Quy tắc 3 màu chính (Trắng `#FFFFFF`, Xám `#F8FAFC`, Đen `#0F172A`) + 2 màu nhấn (Đỏ `#DC2626`, Xanh `#1D4ED8`).
  * Tuyệt đối không dùng icon bên cạnh label tiêu đề các mục.
  * Header tối giản: Logo vuông bo tròn `HN10` + chuông thông báo + icon tin nhắn.
  * Bento Grid 4 khối (Danh thiếp QR, Radar B2B, Diễn đàn, Kho tài liệu).
  * Slider sự kiện bo góc, Card trạm đào tạo dạng Timeline + Đồng hồ Gauge tiến độ.
  * Footer bar nổi bật với nút Tròn Quét QR trung tâm.
- **Giao diện Web CRM Quản trị & Master Platform**: Đọc [.agents/ui-specs/UI_SPEC_CRM_QUAN_TRI.md](file:///d:/download/VICONNECT/CEO_VIONE_PROJECT/ceohn10_project/.agents/ui-specs/UI_SPEC_CRM_QUAN_TRI.md)
  * Light mode phong cách doanh nhân sang trọng, Brand Navy `#002B70`.
  * Sidebar 6 nhóm menu, responsive mobile dạng slide-over drawer có đệm `pr-14` và nút đóng rõ ràng.
  * Màn Quản Trị RBAC: Cột Tên đăng nhập hiển thị Email + Mã học viên. Cột Thao tác tối đa 3 nút, nếu >3 thì có dropdown 3 chấm; cột thao tác co dãn linh hoạt được.
  * Màn Báo Cáo Tài Chính: Thẻ Quỹ Tổng thời gian thực (Số dư đầu kỳ 2.1 Tỷ + Tổng thu - Cấp 6 ban = Tồn quỹ). 4 Nguồn thu có modal xem chi tiết + xuất Excel. Phân bổ kinh phí 6 Ban chuyên môn.
  * Chính sách phí học viên CEO HN10: Lần đầu 1.000.000 đ, sau 1 tháng 2.000.000 đ.
- **Bản Đồ Định Vị Mã Nguồn**: Tra cứu Node ID tại [.agents/rules/node-matrix.md](file:///d:/download/VICONNECT/CEO_VIONE_PROJECT/ceohn10_project/.agents/rules/node-matrix.md).

---

## 3. CÁC THAY ĐỔI VỪA HOÀN THÀNH (LATEST UPDATES)
- **Tối giản giao diện Mobile App**: Đưa về đúng bảng màu 3 chính + 2 phụ, bỏ hết icon cạnh text tiêu đề, header tối giản, slider sự kiện, timeline đào tạo.
- **Responsive Web CRM & Master Platform**: Drawer trên mobile có overlay đóng tự động khi chạm ngoài, đệm `pr-14`.
- **Quản trị người dùng & Phân quyền RBAC**: Cột tên đăng nhập hiển thị email + mã học viên; cột thao tác tối đa 3 nút + menu 3 chấm, co dãn linh hoạt.
- **Báo cáo tài chính Quỹ Tổng & 6 Ban**: Quỹ Tổng biến động thời gian thực, 4 nguồn thu có xem chi tiết + xuất Excel, cấp kinh phí 6 ban.
- **Khôi phục tính năng**: Nhà tài trợ 4 hạng và quỹ tài trợ riêng biệt.
- **Dọn dẹp thư mục**: Xóa bỏ các thư mục rỗng `src/`, `docs/`, `modules/`, `dist-modules/` ở root.
- **Import vé sự kiện & Xuất báo cáo 3 định dạng**: Kiểm tra nghiêm ngặt loại vé và giá vé theo khai báo hệ thống khi import (từ chối nếu lệch loại/giá); modal xuất báo cáo đa danh mục (đã check-in, đi muộn, đúng giờ, vắng mặt, nộp phí...) với đủ 3 định dạng Excel (.xlsx), CSV (.csv UTF-8 BOM) và Bản in A4/PDF.
- **Khắc phục triệt để Duplicate API Calls & Event Storm khi khởi động**: Bổ sung cơ chế in-flight deduplication cache cho GET requests tại `fetchNestApi`, lazy-render Sidebar trong MobileMenuDrawer (chỉ mount khi mở drawer), chia sẻ promise tải nhãn động trong `useSidebarLabels`, và debounce/coalesce các sự kiện auth/RBAC/socket realtime.
- **Kiến trúc Tái sử dụng & Chuẩn hóa Thực thể**: Xây dựng BaseEntity, BaseService, PaginationQueryDto, ApiResponseDto và Zod validation ở Backend; chuẩn hóa tập trung BRAND_ASSETS (config/branding.ts) và bộ Common UI Components (EmptyState, StatusBadge, PageHeader) ở Frontend.
- **Kịch bản Deploy An Toàn Tuyệt Đối (deploy-safe.ps1)**: Thiết lập quy trình 7 cổng kiểm soát (Pre-flight TypeScript 0 errors, Local Production Build, Disk Check, Nginx Syntax Validation Gate `nginx -t`, Atomic Container Sync & Post-Deploy Health Check) nhằm triệt tiêu hoàn toàn nguy cơ sập server dev.
- **Tối ưu hóa tài liệu**: Đóng gói UI Specs tại `.agents/ui-specs/`, lưu trữ changelog cũ vào `document/history/CHANGELOG_ARCHIVE_v1_v12.md`.

---

## 4. QUY TẮC CẬP NHẬT FILE MEMORY.MD (TỪ BẢN 6.0 TRỞ ĐI)
- **TUYỆT ĐỐI KHÔNG VIẾT LẠI TOÀN BỘ FILE MEMORY.MD**.
- Khi hoàn thành tác vụ mới, Agent chỉ được phép thêm 1 - 2 dòng gạch đầu dòng (bullet points) vào Mục 3 ("CÁC THAY ĐỔI VỪA HOÀN THÀNH"), giữ file luôn dưới 150 dòng để tối ưu hiệu năng và ngữ cảnh làm việc.
