#!/bin/bash
set -e

cd /root/ssl-proxy

# 1. Mở các cổng trên UFW nếu có UFW
if command -v ufw >/dev/null 2>&1; then
    echo "[UFW] Mở cổng 80, 443, 5443, 5444 trên tường lửa Ubuntu..."
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
    ufw allow 5443/tcp >/dev/null 2>&1 || true
    ufw allow 5444/tcp >/dev/null 2>&1 || true
    ufw reload >/dev/null 2>&1 || true
fi

# 2. Mở cổng trên iptables
iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
iptables -I INPUT -p tcp --dport 5443 -j ACCEPT 2>/dev/null || true
iptables -I INPUT -p tcp --dport 5444 -j ACCEPT 2>/dev/null || true

# 3. Chuẩn hóa tệp tin cấu hình (xóa bỏ \r nếu có)
sed -i 's/\r$//' nginx.conf docker-compose.ssl.yml 2>/dev/null || true

# 4. Khởi động lại container Nginx Proxy
echo "[Docker] Đảm bảo mạng ceohn10-network và khởi tạo container ceohn10-ssl-proxy..."
docker network create ceohn10-network 2>/dev/null || true
docker compose -f docker-compose.ssl.yml config --quiet
docker compose -f docker-compose.ssl.yml up -d --no-deps --force-recreate ssl-reverse-proxy

# 5. Đợi 2s để Nginx worker process ổn định
sleep 2

# 6. Kiểm tra trạng thái và logs
echo "--- TRẠNG THÁI NGINX SSL PROXY CONTAINER ---"
docker ps -a --filter name=ceohn10-ssl-proxy --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo "--- NHẬT KÝ NGINX (LOGS) ---"
docker logs --tail 15 ceohn10-ssl-proxy 2>&1 || true

# Tạm ngắt exit on error để các lệnh kiểm thử curl không làm fail script deploy
set +e

# Reload host nginx nếu đang chạy trên VPS để cập nhật cấu hình nếu có
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "[Host Nginx] Tải lại Nginx chính trên máy chủ chủ..."
    systemctl reload nginx 2>/dev/null || true
fi

echo "--- TEST NỘI BỘ HTTPS 443 (SUBDOMAINS) ---"
curl -k -s -I -H "Host: ceohn10.viconnect.vn" https://127.0.0.1:443/ 2>&1 | head -n 5 || echo "Lỗi kết nối https 443 ceohn10 nội bộ"
curl -k -s -I -H "Host: crm.ceohn10.viconnect.vn" https://127.0.0.1:443/ 2>&1 | head -n 5 || echo "Lỗi kết nối https 443 crm nội bộ"

echo "--- TEST NỘI BỘ HTTPS 5443 (WEB CRM & LANDING) ---"
curl -k -s -I https://127.0.0.1:5443/ 2>&1 | head -n 5 || echo "Lỗi kết nối https 5443 nội bộ"

echo "--- TEST NỘI BỘ HTTPS 5444 (APP HIỆP HỘI CEO HN10) ---"
curl -k -s -I https://127.0.0.1:5444/ 2>&1 | head -n 5 || echo "Lỗi kết nối https 5444 nội bộ"
