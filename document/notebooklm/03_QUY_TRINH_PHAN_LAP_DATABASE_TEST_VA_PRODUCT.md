# QUY TRÌNH PHÂN LẬP CƠ SỞ DỮ LIỆU TEST VÀ PRODUCT (CEO HN10)
*Tài liệu kỹ thuật đồng bộ Google NotebookLM & Quản trị hạ tầng DevOps*
*Phiên bản: 1.0 - Ngày ban hành: 21/11/2026*

---

## 1. Mục Đích & Nguyên Tắc Tối Cao
1. **Bảo vệ toàn vẹn dữ liệu Sản Phẩm (Production)**:
   - Cơ sở dữ liệu Sản phẩm duy nhất của dự án là: **`113.20.107.184:6432/ceohn10_project`** (kết nối qua PgBouncer, user `app1`).
   - Mọi hoạt động kiểm thử (Test / Dev / Sandbox / Pentest / Mock data) **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** chạy trực tiếp trên CSDL Sản phẩm.
2. **Cơ chế Phân Lập Môi Trường (Environment Isolation)**:
   - **Môi trường Test (Staging / Testing)**: Sử dụng CSDL độc lập **`ceohn10_project_test`**.
   - Khi ở môi trường Test, hệ thống Backend NestJS tự động nạp cấu hình từ `.env.test` hoặc sử dụng `TEST_DATABASE_URL`.

---

## 2. Thông Số Kết Nối 2 Cơ Sở Dữ Liệu

| Thông số | CSDL Sản Phẩm (Production) | CSDL Thử Nghiệm (Test / Staging) |
| :--- | :--- | :--- |
| **Máy chủ (Host:Port)** | `113.20.107.184:6432` (PgBouncer) | `113.20.107.184:6432` hoặc Local `ceohn10_test_postgres:5432` |
| **Tên CSDL (Database)** | `ceohn10_project` | `ceohn10_project_test` |
| **Tài khoản (Username)** | `app1` | `app1` |
| **Mật khẩu (Password)** | `5^S0CEpvYwC1(#YN1UoJ` | `5^S0CEpvYwC1(#YN1UoJ` |
| **Chuỗi kết nối (URI)** | `postgresql://app1:5^S0CEpvYwC1(#YN1UoJ@113.20.107.184:6432/ceohn10_project?pgbouncer=true` | `postgresql://app1:5^S0CEpvYwC1(#YN1UoJ@113.20.107.184:6432/ceohn10_project_test?pgbouncer=true` |
| **Cổng Docker Test** | Không dùng Docker local | Cổng `5433:5432` (tránh xung đột) |

---

## 3. Kiến Trúc Tự Động Phân Nhánh Tại Backend (PrismaService)
Tại `apps/ceohn10_app_be/src/prisma/prisma.service.ts`:
```typescript
constructor() {
  const isTestEnv =
    process.env.APP_ENV === 'test' ||
    process.env.NODE_ENV === 'test' ||
    process.env.RUN_ENV === 'test';

  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    'postgresql://app1:5^S0CEpvYwC1(#YN1UoJ@113.20.107.184:6432/ceohn10_project_test?pgbouncer=true';

  const prodDbUrl =
    process.env.DATABASE_URL ||
    'postgresql://app1:5^S0CEpvYwC1(#YN1UoJ@113.20.107.184:6432/ceohn10_project?pgbouncer=true';

  const activeDbUrl = isTestEnv ? testDbUrl : prodDbUrl;

  super({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
  });
}
```

---

## 4. Hướng Dẫn Khởi Động Cụm Test Riêng Biệt (Docker Compose)
Để dựng một cụm Test server riêng biệt mà không ảnh hưởng tới Production:
```bash
# 1. Di chuyển vào thư mục deploy
cd deploy

# 2. Khởi động cụm Test độc lập
docker compose -f docker-compose.test.yml up -d --build

# 3. Kiểm tra logs
docker compose -f docker-compose.test.yml logs -f ceohn10_test_backend
```
- Cổng truy cập Web CRM Test: `http://localhost:3002`
- Cổng truy cập Backend API Test: `http://localhost:3001`
- Cổng kết nối CSDL Test: `localhost:5433` (Database: `ceohn10_project_test`)

---

## 5. Quy Chuẩn Đồng Bộ Schema & Migration
- Mọi thay đổi về bảng, thêm cột động (VD: Dynamic DDL `ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS`) được kiểm tra trên CSDL Test trước.
- Script khởi tạo CSDL Test được lưu tại: `scripts/init-test-database.sql`.
