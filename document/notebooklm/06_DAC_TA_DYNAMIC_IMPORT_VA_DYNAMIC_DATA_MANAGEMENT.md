# ĐẶC TẢ KỸ THUẬT: HỆ THỐNG DYNAMIC IMPORT & DYNAMIC DATA MANAGEMENT - CRM CEO HN10 (HANOIBA)
*Phiên bản: 1.0 - Chuẩn Doanh Trí Enterprise & Kiến Trúc Hybrid Schema PostgreSQL*

---

## 1. TỔNG QUAN VÀ MỤC TIÊU HỆ THỐNG
Hệ thống **Dynamic Import & Dynamic Data Management** được thiết kế nhằm nâng cấp toàn diện năng lực xử lý dữ liệu của Cổng Quản trị Web CRM CEO HN10 (HanoiBA).
Mục tiêu cốt lõi:
1. Cho phép Ban Quản Trị, Ban Thành Viên, Ban Thư Ký và Kế toán tải lên các tài liệu ở 4 định dạng phổ biến: **Excel (.xlsx, .xls)**, **CSV (UTF-8, UTF-8 BOM)**, **Word (.docx)** và **PDF (.pdf)**.
2. Tự động nhận diện cấu trúc, bóc tách dòng tiêu đề và dữ liệu biểu mẫu.
3. Tự động suy luận kiểu dữ liệu thông minh (`text`, `number`, `currency`, `date`, `datetime`, `switch`, `select`, `email`, `phone`, `url`, `textarea`).
4. Tự động ánh xạ với các trường dữ liệu CRM chuẩn hoặc đề xuất sinh trường động mới (`isCustomField: true`).
5. Cung cấp màn hình Preview dữ liệu trực quan kèm 4 thẻ kiểm soát: Hợp lệ, Cảnh báo, Lỗi và Trùng lặp.
6. Cho phép lựa chọn chính sách đối soát trùng lặp: Bỏ qua (`skip`), Cập nhật đè dữ liệu (`update`), hoặc Tạo mới bản ghi (`create_new`).
7. Lưu lại cấu hình ánh xạ thành Mẫu Import (`import_templates`) để tái sử dụng nhanh chóng cho các lần sau.
8. **ĐẶC BIỆT**: Bảo toàn 100% chức năng CRUD nhập tay và toàn bộ vòng đời dữ liệu hiện tại.

---

## 2. KIẾN TRÚC HYBRID DATA ARCHITECTURE (POSTGRESQL)
Hệ thống tuân thủ nghiêm ngặt nguyên tắc **KHÔNG PHÁ VỠ HỆ THỐNG HIỆN TẠI**, áp dụng mô hình lai (Hybrid Data Architecture):
- **Trường nghiệp vụ cốt lõi (Core Physical Columns)**: Giữ nguyên các cột vật lý gốc trong PostgreSQL (`id`, `code`, `name`, `phone`, `email`, `status`, `created_at`, `updated_at`, ...). Không tự ý xóa, đổi tên hoặc thay đổi kiểu dữ liệu.
- **Trường động tùy biến (Custom Fields JSONB)**: Bổ sung an toàn cột `custom_data jsonb DEFAULT '{}'::jsonb` trên các bảng CRM chính (`members`, `event_registrations`, `trainings`, `financial_report_rows`).
- **GIN Index Tối Ưu Truy Vấn**: Tạo chỉ mục GIN `CREATE INDEX IF NOT EXISTS idx_[table]_custom_data_gin ON [table] USING gin (custom_data);` để đảm bảo tốc độ tìm kiếm và lọc dữ liệu JSONB đạt hiệu năng cao nhất.
- **Metadata Quản Lý Cấu Trình**:
  - `dynamic_form_schemas` & `dynamic_form_fields`: Quản lý định nghĩa các trường dữ liệu động theo từng phân hệ (`member`, `event_registration`, `finance`, `class`, `teacher`).
  - `import_templates`: Lưu chữ ký cấu trúc file (`file_structure_signature`) và quy tắc ánh xạ trường.
  - `import_jobs` & `import_errors`: Lưu vết nhật ký lịch sử nhập liệu và chi tiết dòng lỗi phục vụ kiểm toán (Audit Trail).

---

## 3. QUY TRÌNH WIZARD 6 BƯỚC CHUẨN ENTERPRISE
Giao diện người dùng được tổ chức thành Wizard 6 bước khép kín (`DynamicImportWizardModal.tsx`):
- **Bước 1: Tải tệp lên (Upload)**: Kéo thả hoặc chọn tệp Excel/CSV/Word/PDF; chọn phân hệ dữ liệu đích và sự kiện liên quan (nếu có).
- **Bước 2: Phân tích tệp (Parse & Analysis)**: Hệ thống đọc số sheet, phát hiện header, tính chữ ký cấu trúc và tự động áp dụng template khớp (nếu đã lưu trước đó).
- **Bước 3: Nhận diện & Ánh xạ trường (Smart Field Mapping)**: Đối chiếu tên cột trong tệp với trường chuẩn CRM (hỗ trợ từ khóa tiếng Việt đa dạng) hoặc đề xuất trường mới.
- **Bước 4: Cấu hình trường động mới (Custom Fields Config)**: Thiết lập nhãn hiển thị, kiểu dữ liệu, ràng buộc bắt buộc (`required`), chỉ mục tìm kiếm (`searchable`) và bộ lọc (`filterable`).
- **Bước 5: Xem trước & Đối soát trùng lặp (Preview & Validation)**: Bảng preview dữ liệu đầy đủ màu sắc theo trạng thái dòng, 4 chỉ số KPI thống kê, nút tải bảng báo cáo dòng lỗi Excel và chọn chính sách xử lý trùng (`skip` / `update` / `create_new`).
- **Bước 6: Xác nhận & Nhật ký kết quả (Execution & Summary)**: Thực thi ghi dữ liệu theo transaction an toàn, hiển thị số dòng thành công, thất bại, dòng trùng và tùy chọn lưu cấu hình thành Template tái sử dụng.

---

## 4. BẢO TOÀN VÀ ĐỒNG BỘ TOÀN DIỆN VÒNG ĐỜI DỮ LIỆU
Dữ liệu nhập tay và dữ liệu import cùng dùng chung một mô hình và bộ quy tắc validation duy nhất:
1. **Xem danh sách (Table / Cards View)**: Hỗ trợ nút "Cấu hình cột hiển thị" (`DynamicTableColumnsConfig`) cho phép người dùng tự do bật/tắt các cột động trên bảng dữ liệu.
2. **Xem chi tiết bản ghi (`DynamicDetailViewModal`)**: Hiển thị phân khu khoa học: Thông tin nhận diện cốt lõi + Trường dữ liệu động tùy biến (format chuẩn ngày tháng, tiền tệ VNĐ, URL).
3. **Thêm & Sửa thủ công (CRUD Form)**: Mẫu nhập tay (`CrudModal`) tự động tích hợp các trường mới đã sinh từ Import, pre-fill dữ liệu từ `custom_data`, và lưu vào CSDL qua cùng API endpoint.
4. **Tìm kiếm & Bộ lọc**: Ô tìm kiếm mở rộng tự động rà soát qua cả các giá trị nằm trong đối tượng `custom_data`.
5. **Xuất Excel (`exportToExcel`)**: Tự động ghép nối các cột dữ liệu động vào danh bạ và báo cáo xuất file Excel (.xlsx).
