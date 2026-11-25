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
- **Hoàn thiện Chuẩn Hóa Vòng Đời Sự Kiện & Dòng Tiền (UC-EVT-01 đến UC-EVT-10 & UC-FIN-01 đến 05)**: Chuẩn hóa 9 nhóm tác nhân; mở rộng đăng ký nhiều vé (multi-attendee) tự động tạo vé con & phát hành riêng; thanh toán VietQR SePay động `CEO1983_EVT_[ID]` kèm banking deep link và auto-dispatch vé khi nhận Webhook; check-in phân loại Đúng giờ/Đi muộn tự động gửi email xác nhận và vị trí chỗ ngồi; Vòng quay may mắn có bộ lọc theo Chức danh; Thư viện ảnh Live có nút gửi link ảnh qua Email/Zalo; Modal xuất báo cáo hỗ trợ gửi báo cáo số liệu/danh sách tới nhiều tài khoản Ban Cán sự.
- **Tích hợp Tài khoản Cá nhân SePay & Kích hoạt Toàn diện Quản lý Ngân hàng / Sandbox trên CRM**: Hướng dẫn kết nối SePay cá nhân (Phạm Văn Vũ) đại diện nhận phí sự kiện và Quỹ Tổng CLB, Quỹ Thiện Nguyện, Quỹ Học Tập; tích hợp hiển thị đầy đủ 3 tab Ngân Hàng & SePay, Số Dư Đầu Kỳ, Điều Chuyển Nội Bộ vào routes Thu/Chi Quỹ; hỗ trợ Sandbox Giả lập SePay và Localhost Tunnel.
- **Hoàn thiện Cấu Hình Cổng SePay Dynamic Master Admin trên Giao Diện Web CRM**: Tích hợp modal cấu hình động SePay Master Admin vào giao diện CRM (Thu/Chi Quỹ -> Ngân Hàng & SePay), cho phép Master Admin tự do đổi số tài khoản (cá nhân test hoặc công ty chính thức), ngân hàng, API token, webhook secret, tiền tố vé mà không cần sửa .env; dữ liệu lưu trực tiếp vào CSDL PostgreSQL (master_system_settings & app_settings) và áp dụng realtime.
- **Quy Hoạch Tập Trung 100% Cấu Hình Cổng SePay & Zalo OA tại Master Admin (`/master`)**: Bỏ hoàn toàn cấu hình tại Thu/Chi Quỹ; chuẩn hóa tiêu đề "Cấu Hình Tích Hợp Cổng Thanh Toán SePay" và "Cấu Hình Tích Hợp Zalo Official Account & ZBS"; tự động đồng bộ tài khoản ngân hàng từ Master Admin sang bảng `bank_accounts` và toàn bộ CRM (Thu/Chi Quỹ, Sổ quỹ, Vé sự kiện `CEO1983_EVT`, Hội phí `CEOHN10_HP`) nhận diện dòng tiền tức thì 100%.
- **Cấu Hình Đa Khoản Thu & Phí Phát Sinh Toàn Hệ Thống SePay Động 100% & Triệt Tiêu Chrome Autofill**: Khắc phục lỗi trình duyệt tự động ghi đè thông tin đăng nhập vào Tên Chủ Tài Khoản và Token bằng cơ chế ẩn dummy inputs và `autoComplete="new-password"`; mở rộng Bảng quản lý Danh Mục Các Khoản Thu & Phí Phát Sinh cho phép thêm/sửa/xóa/bật/tắt không giới hạn (Phí gia nhập CLB `CEOHN10_GN`, Hội phí `CEOHN10_HP`, Vé sự kiện `CEO1983_EVT`, Học phí 30 chuyên đề `CEOHN10_LH`, Tài trợ `CEOHN10_TT`, Thiện nguyện `CEOHN10_TN`, Gian hàng B2B `CEOHN10_B2B`, Khoản phí khác...) tự động phân bổ vào Quỹ đích và thực thi nghiệp vụ tự động tức thì.
- **Khắc Phục Lỗi 500 Master Settings & Chuẩn Hóa Nút Lưu Form SePay**: Sửa triệt để lỗi 500 do sai tên cột trong CSDL PostgreSQL tại `master_system_settings` (sửa `setting_key`/`setting_value` thành `key`/`value` theo đúng schema thực tế); loại bỏ khối cú pháp tiền tố trùng lặp; quy hoạch nút Lưu Cấu Hình SePay xuống đúng khu vực cấu hình với cơ chế tự động disable khi chưa điền đủ các trường bắt buộc (Tên Ngân Hàng, STK, Tên Chủ TK, Secret Key) và enable khi nhập đủ kèm badge trạng thái trực quan.
- **Động Hóa 100% Webhook SePay Theo Domain/Subdomain & Khắc Phục Nest Watcher Crash**: Động hóa URL Webhook SePay theo `window.location.origin` và `process.env.APP_URL`, hỗ trợ nút tự động lấy domain hiện tại, triệt tiêu hoàn toàn việc lưu cố định domain `loca.lt` vào CSDL; khắc phục lỗi Nest watch mode crash `dist/main MODULE_NOT_FOUND` bằng `deleteOutDir: false` trong `nest-cli.json`.
- **Khôi Phục Trọn Vẹn & Thay Thế Toàn Bộ Màu Xanh Sang Xám Luxury Trên Mobile App**: Khôi phục trọn vẹn 100% mã nguồn màn Sự Kiện (`association.events.tsx`), Kết Nối (`association.connect.tsx`) và Cá Nhân (`association.profile.tsx` 2800+ dòng đầy đủ QR modal, danh thiếp số, bảo mật, phím tắt); chuyển đổi toàn bộ màu xanh sang gam màu Xám Slate sang trọng (`#0F172A`, `#1E293B`, `#334155`, `#F8FAFC`) trên toàn bộ các màn hình và thanh Bottom Navigation.
- **Đồng Bộ 5 Tab Mobile App, Khôi Phục Toàn Diện Màn Cá Nhân & Đổi Mới Visual Trang Chủ**: Thống nhất 5 tab điều hướng trên toàn bộ app (Trang chủ, Hoạt động, Quét QR, Gắn kết, Cá nhân), loại bỏ footer bị cô lập cũ; nút Quét QR trung tâm mở trực tiếp Camera Quét QR Kết Nối Doanh Nhân; màn Trang chủ được nâng cấp hình ảnh Skyline tráng lệ, thẻ sự kiện có ảnh cover đẹp mắt, tối ưu giảm tải chữ rườm rà.
- **Kích Hoạt & Khắc Phục Triệt Để 5 Luồng Tính Năng Mobile App & Kết Nối CSDL**: Đăng ký sự kiện (hỗ trợ `optionalNestAuth` + client fallback `fetchNestApi`), Quét QR check-in vé sự kiện (hỗ trợ trọn bộ mã `EV-`, `TKT-`, `REG-`, số nguyên và vé offline), Kết bạn / Nhắn tin / Gọi điện (bổ sung nút `👥 Danh Bạ` ngay trên thanh chuyển tab Gắn kết), Sửa hồ sơ cá nhân (chuẩn hóa số điện thoại tự động làm sạch ký tự), và Đăng bài lên Bảng tin (nới lỏng guard sang `OptionalJwtAuthGuard` không bị chặn 401).
- **Ban Hành Bộ Kịch Bản Kiểm Thử Toàn Diện Luồng Sự Kiện & Quản Trị Dòng Tiền (TEST-EVT-CEOHN10-V1.0)**: Soạn thảo chi tiết 15 kịch bản test E2E (Pre-Event, In-Event, Post-Event), bao gồm Đa hạng vé, Đăng ký Multi-ticket công khai không login, Thanh toán VietQR SePay `CEO1983_EVT`, Import Excel đối soát nghiêm ngặt (Strict Rule), Check-in Online/Offline (<1s, tag đúng giờ/đi muộn, chặn quét trùng), Kiosk công khai, Vòng quay may mắn lọc chức danh, và Xuất báo cáo 3 định dạng (Excel, CSV UTF-8 BOM, PDF A4). Lưu tại `document/KICH_BAN_TEST_TOAN_PHAN_LUONG_SU_KIEN_CEOHN10.md` và đồng bộ `document/notebooklm/05_KICH_BAN_TEST_TOAN_PHAN_LUONG_SU_KIEN_CEOHN10.md`.
- **Tối Ưu Độ Tương Phản Tab Gắn Kết & Giải Phóng Port 4003**: Nâng cấp thanh chuyển đổi Bảng Tin / Hẹn Gặp / Danh Bạ trên màn Gắn kết sang màu Đỏ CEO HN10 (`bg-red-600 text-white`) đảm bảo chữ hiển thị sắc nét 100%; dọn dẹp tiến trình treo cổng 4003 và kiểm tra toàn bộ luồng SSR không còn stack trace lỗi.
- **Kiểm Thử Toàn Diện & Khắc Phục Luồng Vòng Đời Sự Kiện & Dòng Tiền (15/15 Ca Test ĐẠT 100%)**: Hoàn thiện kịch bản kiểm thử tự động Puppeteer E2E trên localhost:5173 và API port 4003; khắc phục truy vấn JOIN bảng events và event_registrations (bổ sung cột `title`, `start_time`, `end_time` và `is_late`, `checkin_timeliness`, `seat_assignment`); xác thực thành công 10/10 Use Cases (Khởi tạo sự kiện đa hạng vé, Đăng ký multi-ticket tính tiền động kèm VietQR SePay `CEO1983_EVT_[ID]`, Chặn lệch tên và đơn giá khi import Excel, Phát hành vé HMAC QR, Check-in điểm danh phân loại đúng giờ/đi muộn, Chặn quét trùng lặp Anti-Fraud, Kiosk công khai `/event-checkin`, Bàn đón tiếp Walk-in thu tiền mặt ghi nhận sổ quỹ, Quay số may mắn lọc chức danh đại biểu đã check-in, Thư viện ảnh Live CDN & chia sẻ email, Khảo sát NPS 1-5 sao và Xuất báo cáo 3 định dạng Excel/CSV/PDF). Vượt qua kiểm tra TypeScript BE và FE (0 errors).
- **Cập nhật luồng Hủy / Điều chỉnh Sự kiện & Khắc phục lỗi Gọi Sự Kiện App, Lưu Cấu Hình SePay**: Tự động clear toàn bộ đại biểu đã đăng ký sang `cancelled` và reset số lượng đăng ký về 0 khi hủy sự kiện; tự động gửi email thông báo hủy sự kiện chuẩn thương hiệu tới 100% đại biểu kèm lý do và chính sách hoàn phí; tự động phát hiện thay đổi ngày/giờ/địa điểm tổ chức và gửi email thông báo điều chỉnh lịch trình chi tiết (bảng so sánh lịch cũ - mới) kèm lý do tới toàn bộ đại biểu; khắc phục triệt để lỗi 401/SSR khi gọi sự kiện trên Mobile App bằng cơ chế bảo vệ kép OptionalJwtAuthGuard + Fallback query; khắc phục lỗi lưu cấu hình SePay trên Master Admin (`/master`) bằng việc tự động khởi tạo và đồng bộ bảng `public.master_system_settings` trong CSDL PostgreSQL (100% passed).
- **Thiết Lập & Kích Hoạt Toàn Diện Luồng Check-Out Vé Sự Kiện & Bóc Tách Mã Đa Nguồn (100% Pass)**: Bổ sung bộ bóc tách mã vé thông minh `resolveCleanTicketCode` tự động giải mã JSON payload từ camera quét QR, query param `?ticket=...` từ URL và chuỗi thường; hoàn thiện `performTicketCheckout` với cơ chế kiểm soát chặt chẽ (chặn khi chưa check-in hoặc đã check-out trước đó, cập nhật `checked_out_at` và `status = 'checked_out'`, đồng bộ `member_checkins`); tự động gửi email thư cảm ơn và xác nhận thời gian ra về tới đại biểu; nâng cấp giao diện Soát vé & Modal Check-in (`EventCheckinGatekeeperModal`) có nút Check-out riêng và thẻ vé (`EventTicketPassModal`) hiển thị badge trạng thái Check-in / Check-out trực quan.
- **Tối ưu hóa tài liệu**: Đóng gói UI Specs tại `.agents/ui-specs/`, lưu trữ changelog cũ vào `document/history/CHANGELOG_ARCHIVE_v1_v12.md`.

---

## 4. QUY TẮC CẬP NHẬT FILE MEMORY.MD (TỪ BẢN 6.0 TRỞ ĐI)
- **TUYỆT ĐỐI KHÔNG VIẾT LẠI TOÀN BỘ FILE MEMORY.MD**.
- Khi hoàn thành tác vụ mới, Agent chỉ được phép thêm 1 - 2 dòng gạch đầu dòng (bullet points) vào Mục 3 ("CÁC THAY ĐỔI VỪA HOÀN THÀNH"), giữ file luôn dưới 150 dòng để tối ưu hiệu năng và ngữ cảnh làm việc.
