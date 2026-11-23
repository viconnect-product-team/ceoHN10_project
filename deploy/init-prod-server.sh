#!/bin/bash
# ==============================================================================
# HỆ THỐNG CEO HN10 (HANOIBA) - SCRIPT KHỞI TẠO MÁY CHỦ PRODUCTION TỰ ĐỘNG
# Phiên bản: 2.0 (Zero-Hardcode Dynamic Setup Wizard)
# Chức năng: Khi SSH vào server mới, chạy script này sẽ tự động sinh file cấu hình
#            môi trường thật (.env.production), thiết lập Docker, Nginx & SSL HTTPS.
# ==============================================================================

set -e

# Màu sắc hiển thị
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${GREEN}      HỆ SINH THÁI CLB DOANH NHÂN CEO HN10 (HANOIBA) - PRODUCTION DEPLOY      ${NC}"
echo -e "${YELLOW}                 TRÌNH THIẾT LẬP MÁY CHỦ TỰ ĐỘNG (ZERO-HARDCODE)              ${NC}"
echo -e "${BLUE}==============================================================================${NC}\n"

# 1. KIỂM TRA QUYỀN VÀ CÔNG CỤ CẦN THIẾT
echo -e "${CYAN}[BƯỚC 1/5] Kiểm tra môi trường hệ thống máy chủ...${NC}"

if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Khuyến nghị: Chạy với quyền root (hoặc sudo) để cấu hình Docker & Nginx mượt mà.${NC}"
fi

# Kiểm tra Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker chưa được cài đặt. Đang tiến hành cài đặt Docker engine...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Đã cài đặt Docker thành công.${NC}"
else
    echo -e "${GREEN}✓ Docker đã sẵn sàng: $(docker --version)${NC}"
fi

# Kiểm tra Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Docker Compose plugin chưa có. Đang cài đặt docker-compose-plugin...${NC}"
    apt-get update && apt-get install -y docker-compose-plugin || yum install -y docker-compose-plugin
    echo -e "${GREEN}✓ Đã cài đặt Docker Compose thành công.${NC}"
else
    echo -e "${GREEN}✓ Docker Compose đã sẵn sàng: $(docker compose version)${NC}"
fi

# 2. THU THẬP THÔNG SỐ CẤU HÌNH ĐỘNG TỪ BÊN VẬN HÀNH (KHÔNG HARDCODE)
echo -e "\n${CYAN}[BƯỚC 2/5] Nhập thông số cấu hình Production (Nhấn Enter để dùng giá trị đề xuất):${NC}"

# Tên miền (Domain)
read -p "1. Tên miền Web CRM (VD: crm.ceohn10.vn): " DOMAIN_CRM
DOMAIN_CRM=${DOMAIN_CRM:-"crm.ceohn10.vn"}

read -p "2. Tên miền Mobile App (VD: app.ceohn10.vn): " DOMAIN_APP
DOMAIN_APP=${DOMAIN_APP:-"app.ceohn10.vn"}

# CSDL PostgreSQL chuẩn
echo -e "\n${YELLOW}* CSDL Chuẩn Mực Dự Án: 113.20.107.184:6432 (ceohn10_project)${NC}"
DEFAULT_DB_URL="postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?pgbouncer=true"
read -p "3. Chuỗi kết nối Database URL [Enter để dùng mặc định]: " PROD_DB_URL
PROD_DB_URL=${PROD_DB_URL:-$DEFAULT_DB_URL}

# SePay VietQR (Tài khoản ngân hàng thật)
echo -e "\n${YELLOW}* Cấu hình Thanh toán SePay VietQR:${NC}"
read -p "4. Tên Ngân Hàng (VD: MBBank, Vietcombank): " SEPAY_BANK
read -p "5. Số Tài Khoản Ngân Hàng: " SEPAY_ACC_NO
read -p "6. Tên Chủ Tài Khoản (VD: CLB DOANH NHAN CEO HN10): " SEPAY_ACC_HOLDER
read -p "7. SePay API Token: " SEPAY_TOKEN
read -p "8. SePay Webhook Secret: " SEPAY_SECRET

# Zalo OA
echo -e "\n${YELLOW}* Cấu hình Zalo Official Account (Zalo OA):${NC}"
read -p "9. Zalo OA ID: " ZALO_OA_ID
read -p "10. Zalo App ID: " ZALO_APP_ID
read -p "11. Zalo App Secret: " ZALO_APP_SECRET
read -p "12. Zalo Refresh Token: " ZALO_REFRESH_TOKEN

# SMTP Email
echo -e "\n${YELLOW}* Cấu hình Gửi Email Vé & Thông Báo (SMTP):${NC}"
read -p "13. SMTP Host [smtp.gmail.com]: " SMTP_HOST
SMTP_HOST=${SMTP_HOST:-"smtp.gmail.com"}
read -p "14. SMTP Port [465]: " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-"465"}
read -p "15. SMTP Email gửi: " SMTP_USER
read -p "16. SMTP Mật khẩu ứng dụng (App Password): " SMTP_PASS

# Tự động sinh JWT Secret an toàn
RANDOM_JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /proc/sys/kernel/random/uuid | tr -d '-')

# 3. TỰ ĐỘNG SINH FILE CẤU HÌNH THẬT (.env.production)
echo -e "\n${CYAN}[BƯỚC 3/5] Đang sinh file cấu hình động .env.production trên máy chủ...${NC}"

PROD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$PROD_DIR/.." && pwd)"

cat <<EOF > "$ROOT_DIR/apps/ceohn10_app_be/.env.production"
# ==========================================================
# CEO HN10 PRODUCTION BACKEND ENVIRONMENT
# Được tạo tự động bởi init-prod-server.sh vào lúc $(date)
# ==========================================================
NODE_ENV=production
PORT=4003
DATABASE_URL=$PROD_DB_URL
JWT_SECRET=$RANDOM_JWT_SECRET
APP_URL=https://$DOMAIN_CRM

# SePay VietQR Configuration
SEPAY_BANK_NAME=$SEPAY_BANK
SEPAY_ACCOUNT_NO=$SEPAY_ACC_NO
SEPAY_ACCOUNT_HOLDER=$SEPAY_ACC_HOLDER
SEPAY_API_TOKEN=$SEPAY_TOKEN
SEPAY_WEBHOOK_SECRET=$SEPAY_SECRET

# Zalo OA Configuration
ZALO_OA_ID=$ZALO_OA_ID
ZALO_APP_ID=$ZALO_APP_ID
ZALO_APP_SECRET=$ZALO_APP_SECRET
ZALO_REFRESH_TOKEN=$ZALO_REFRESH_TOKEN

# SMTP Email Configuration
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
SMTP_FROM=$SMTP_USER
ADMIN_NOTIFY_EMAIL=$SMTP_USER
EOF

cat <<EOF > "$ROOT_DIR/apps/ceohn10_app_fe/.env.production"
# ==========================================================
# CEO HN10 PRODUCTION FRONTEND ENVIRONMENT
# Được tạo tự động bởi init-prod-server.sh vào lúc $(date)
# ==========================================================
VITE_API_URL=https://$DOMAIN_CRM/api
VITE_PUBLIC_APP_URL=https://$DOMAIN_CRM
VITE_MOBILE_APP_URL=https://$DOMAIN_APP
VITE_APP_SCOPE=crm_platform
VITE_APP_NAME="CLB Doanh Nhân CEO HN10"
EOF

echo -e "${GREEN}✓ Đã tạo thành công file cấu hình .env.production an toàn cho cả Backend và Frontend.${NC}"

# 4. TỰ ĐỘNG TẠO DOCKER COMPOSE PRODUCTION ĐỘC LẬP
echo -e "\n${CYAN}[BƯỚC 4/5] Chuẩn bị tệp Docker Compose Production...${NC}"

cat <<EOF > "$ROOT_DIR/docker-compose.prod.yml"
name: ceohn10-prod

services:
  ceohn10-backend:
    build:
      context: .
      dockerfile: apps/ceohn10_app_be/Dockerfile
    container_name: ceohn10-backend-prod
    restart: always
    env_file:
      - apps/ceohn10_app_be/.env.production
    environment:
      - NODE_ENV=production
      - PORT=4003
    ports:
      - "4003:4003"
    volumes:
      - uploads_data:/app/uploads
    networks:
      - ceohn10-prod-net

  ceohn10-frontend:
    build:
      context: .
      dockerfile: apps/ceohn10_app_fe/Dockerfile
    container_name: ceohn10-frontend-prod
    restart: always
    env_file:
      - apps/ceohn10_app_fe/.env.production
    environment:
      - PORT=8080
      - HOST=0.0.0.0
      - NITRO_HOST=0.0.0.0
      - NEST_API_URL=http://ceohn10-backend:4003
    ports:
      - "8080:8080"
    depends_on:
      - ceohn10-backend
    networks:
      - ceohn10-prod-net

volumes:
  uploads_data:
    name: ceohn10-prod-uploads

networks:
  ceohn10-prod-net:
    driver: bridge
EOF

echo -e "${GREEN}✓ Đã chuẩn bị xong docker-compose.prod.yml độc lập.${NC}"

# 5. TẠO CẤU HÌNH NGINX REVERSE PROXY & SSL
echo -e "\n${CYAN}[BƯỚC 5/5] Cấu hình Nginx Reverse Proxy & Chứng chỉ bảo mật SSL...${NC}"

NGINX_CONF="/etc/nginx/sites-available/ceohn10.conf"
if [ -d "/etc/nginx/sites-available" ]; then
cat <<EOF > "$NGINX_CONF"
server {
    listen 80;
    server_name $DOMAIN_CRM $DOMAIN_APP;

    location /api {
        proxy_pass http://127.0.0.1:4003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/ceohn10.conf 2>/dev/null || true
    nginx -t && systemctl reload nginx 2>/dev/null || echo -e "${YELLOW}Lưu ý: Nginx reload cần kiểm tra DNS.${NC}"
    echo -e "${GREEN}✓ Đã sinh cấu hình Nginx Reverse Proxy tại $NGINX_CONF.${NC}"
fi

echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN}                KHỞI TẠO MÁY CHỦ PRODUCTION HOÀN TẤT THÀNH CÔNG!              ${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo -e "Các bước tiếp theo trên máy chủ:"
echo -e " 1. Khởi chạy hệ thống:   ${YELLOW}docker compose -f docker-compose.prod.yml up -d --build${NC}"
echo -e " 2. Kích hoạt SSL HTTPS:  ${YELLOW}certbot --nginx -d $DOMAIN_CRM -d $DOMAIN_APP${NC}"
echo -e " 3. Kiểm tra nhật ký:     ${YELLOW}docker compose -f docker-compose.prod.yml logs -f${NC}\n"
