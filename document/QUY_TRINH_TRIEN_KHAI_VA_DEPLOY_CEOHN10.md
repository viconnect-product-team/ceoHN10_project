# QUY TRÌNH TRIỂN KHAI VÀ DEPLOY HỆ THỐNG CLB DOANH NHÂN CEO HN10

**Mã tài liệu:** `DEPLOY-CEOHN10-V1.0`  
**Ngày cập nhật:** 16/11/2026  
**Phạm vi áp dụng:** Hệ thống Monorepo `CEOHN10_project` (Cổng Quản trị CRM + App PWA Học viên + Backend NestJS + CSDL PostgreSQL)  
**Nguyên tắc cốt lõi:** Cách ly tuyệt đối (Zero Cross-Impact), không đụng chạm đến cơ sở dữ liệu, cổng mạng hoặc container của CEO HN10 và ViOne.

---

## 1. BẢNG THÔNG SỐ ĐỊNH DANH & CÁCH LY HẠ TẦNG

| Hạng mục | Thông số CEO HN10 (`ceohn10_project`) | **Thông số Độc Lập CEO HN10 (`CEOHN10_project`)** |
|:---|:---|:---|
| **Mã định danh** | `CEOHN10` / `HN10-xxx` | **`CEOHN10` / `HN10-xxx`** |
| **Tên cơ sở dữ liệu** | `ceohn10_project` | **`ceohn10_project`** (hoàn toàn tách biệt) |
| **Cổng CSDL Local** | `6432:5432` (`ceohn10-db-local`) | **`6434:5432` (`ceohn10-db-local`)** |
| **Backend API Dev** | `localhost:4000` / `4002` | **`localhost:4003`** |
| **Frontend Web/PWA Dev** | `localhost:5000` | **`localhost:5003`** |
| **App PWA Production** | Port `5002` (FE) / `5003` (BE) | **Port `5020` (FE) / `5021` (BE)** |
| **Web CRM Production** | Port `5004` (FE) / `5005` (BE) | **Port `5022` (FE) / `5023` (BE)** |
| **Đường dẫn thư mục VPS** | `~/association` & `~/crm` | **`~/ceohn10_association` & `~/ceohn10_crm`** |
| **Tên Container Docker** | `ceohn10-frontend-prod`, `ceohn10-backend-prod` | **`ceohn10-frontend-prod`, `ceohn10-backend-prod`, `ceohn10-crm-frontend-prod`, `ceohn10-crm-backend-prod`** |
| **Docker Network** | `ceohn10-network` | **`ceohn10-network`** |
| **Service Worker Cache** | `ceohn10-pwa-v6` | **`ceohn10-pwa-v1`** |
| **LocalStorage Key** | Tiền tố `vba_` / `ceohn10_` | **Tiền tố `ceohn10_`** |

---

## 2. KHỞI CHẠY HỆ THỐNG TẠI MÁY PHÁT TRIỂN (LOCAL DEV)

### Cách 1: Chạy trực tiếp Node.js (Hot Reload)
```powershell
# Chuyển vào thư mục dự án
cd d:\download\VICONNECT\CEO_VIONE_PROJECT\CEOHN10_project

# Chạy đồng bộ toàn bộ monorepo (FE + BE)
npm run dev

# Hoặc khởi chạy riêng từng phân hệ:
npm run dev:fe   # Mở Web CRM & PWA tại http://localhost:5003
npm run dev:be   # Mở Backend API tại http://localhost:4003/api
```

### Cách 2: Khởi chạy trọn gói bằng Docker Compose (Bao gồm PostgreSQL)
```powershell
cd d:\download\VICONNECT\CEO_VIONE_PROJECT\CEOHN10_project

# Khởi động PostgreSQL (Port 6434), Backend (Port 4003) và Frontend (Port 5003)
docker compose up -d

# Xem log các dịch vụ
docker compose logs -f
```

---

## 3. CẤU HÌNH CƠ SỞ DỮ LIỆU ĐỘC LẬP (`packages/db`)

Để đảm bảo dữ liệu của CEO HN10 không bị trộn lẫn với dữ liệu của CEO HN10:

1. **Chuỗi kết nối CSDL chuẩn:**
   - Khi chạy qua PgBouncer Remote:
     ```env
     DATABASE_URL="postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?pgbouncer=true"
     DIRECT_URL="postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project"
     ```
   - Khi chạy CSDL Local:
     ```env
     DATABASE_URL="postgresql://app1:ceohn10_secure_pass_2026@localhost:6434/ceohn10_project"
     ```

2. **Đồng bộ Schema Prisma vào Database CEO HN10:**
   ```powershell
   cd d:\download\VICONNECT\CEO_VIONE_PROJECT\CEOHN10_project\packages\db
   npx prisma db push
   npx prisma generate
   ```

---

## 4. QUY TRÌNH DEPLOY LÊN MÁY CHỦ (PRODUCTION DEPLOYMENT)

### 4.1. Deploy Phân hệ App PWA Học viên (`deploy/ceohn10`)
Kịch bản triển khai tự động đóng gói image, nén Gzip, đẩy qua SCP và kích hoạt Docker Compose độc lập trên VPS tại thư mục `~/ceohn10_association`:
```powershell
cd d:\download\VICONNECT\CEO_VIONE_PROJECT\CEOHN10_project
.\deploy\ceohn10\fast-deploy.ps1
```

### 4.2. Deploy Phân hệ Cổng Quản trị CRM (`deploy/crm`)
Triển khai độc lập cho cổng quản trị CRM tại thư mục `~/ceohn10_crm`:
```powershell
cd d:\download\VICONNECT\CEO_VIONE_PROJECT\CEOHN10_project
.\deploy\crm\fast-deploy.ps1
```

### 4.3. Cập nhật nóng (Hot Update) không cần rebuild toàn bộ Docker
Khi có chỉnh sửa code giao diện hoặc tính năng và muốn cập nhật ngay lập tức:
```powershell
cd d:\download\VICONNECT\CEO_VIONE_PROJECT\CEOHN10_project
.\deploy-direct.ps1
```

---

## 5. BẢO MẬT & KIỂM TRA SAU KHI DEPLOY (CHECKLIST)

1. **Kiểm tra trạng thái Service Worker**:
   - Truy cập giao diện PWA `/association`. Mở F12 -> tab Application -> Service Workers.
   - Xác nhận cache name là `ceohn10-pwa-v1`.
2. **Kiểm tra phân quyền Cổng CRM**:
   - Truy cập domain CRM, Service Worker phải tự động bypass/unregister, không can thiệp cache vào trang quản trị.
3. **Kiểm tra tính toàn vẹn CSDL**:
   - Ghi nhận thông tin Học viên mới, kiểm tra đúng vào database `ceohn10_project`, xác nhận không ảnh hưởng đến database `ceohn10_project`.
